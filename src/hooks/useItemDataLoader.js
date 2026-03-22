// src/hooks/useItemDataLoader.js
import { useEffect, useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "react-toastify";

import useApiData from "./useApiData";
import useSubmitData from "./usePostData";

import {
  SignedStaff,
  UnsignedStaff,
  StaffLaptop,
  InventoryItem,
} from "../pages/showItem/ShowItemData";
import { ComponentStyle } from "@aws-amplify/ui-react/server";

/**
 * Mapping item types to form templates
 */
const templateMap = {
  "signed staff": SignedStaff,
  "unsigned staff": UnsignedStaff,
  "staff laptop": StaffLaptop,
  "laptop charger": InventoryItem,
  "radio": InventoryItem,
  "radio headset": InventoryItem,
  "pc headset": InventoryItem,
};

/**
 * Mapping item types to API endpoints for fetching data
 */
const dataUrlMap = {
  "signed staff": "/staffMember?contractSigned=True&userID=",
  "unsigned staff": "/staffMember?contractSigned=False&userID=",
  "staff laptop": "/device?itemType=Staff Laptop&deviceSN=",
  "laptop charger": "/device?itemType=Laptop Charger&deviceSN=",
  "radio": "/device?itemType=Radio&deviceSN=",
  "radio headset": "/device?itemType=Radio Headset&deviceSN=",
  "pc headset": "/device?itemType=PC Headset&deviceSN=",
};

export default function useItemDataLoader(itemType, serialNumber, isViewOnly, isAddMode) {
  const baseUrl = import.meta.env.VITE_API_BASE_URL;
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { submitData } = useSubmitData();

  // State
  const [formData, setFormData] = useState([]);
  const [deviceStatus, setDeviceStatus] = useState("");
  const [notes, setNotes] = useState([]);

  // --- Normalize itemType for consistent lookup ---
  const cleanedType = useMemo(() => itemType?.trim().toLowerCase() || "", [itemType]);
  const template = useMemo(() => templateMap[cleanedType] || [], [cleanedType]);
  const dataUrl = useMemo(() => {
    if (!serialNumber || !dataUrlMap[cleanedType]) return "";
    return `${baseUrl}${dataUrlMap[cleanedType]}${serialNumber}`;
  }, [baseUrl, cleanedType, serialNumber]);

  // --- Fetch primary users (if not view-only) ---
  const { data: dataPU } = useApiData({
    queryKey: ["primaryUser"],
    url: `${baseUrl}/primaryUser`,
    enabled: !isViewOnly,
  });

  // --- Fetch item data (skip in add mode) ---
  const { data, isLoading, isError, refetch } = useApiData({
    queryKey: ["itemData", cleanedType, serialNumber],
    url: dataUrl,
    enabled: !!dataUrl && !isAddMode,
  });

  // --- Sync notes from API ---
  useEffect(() => {
    setNotes(data?.notes || []);
  }, [data]);

  // --- Initialize form data ---
  useEffect(() => {
    if (isAddMode) {
      const blankForm = template.map((f) => ({
        ...f,
        value: f.type === "checkbox" ? false : "",
      }));
      setFormData(blankForm);
      return;
    }

    if (data) {
      const populated = template.map((field) => {
  let value;

  if (field.type === "checkbox") {
    // Special handling for contractSigned checkbox
    if (field.name === "contractSigned") {
      value = data.contractSigned === "SignedStaff" || data.contractSigned === true;
    } else {
      value = Boolean(data[field.name]);
    }
  } else {
    value = data[field.name] ?? "";
  }

  return { ...field, value };
});


      setFormData((prev) =>
        JSON.stringify(prev) === JSON.stringify(populated) ? prev : populated
      );

      const status = data.deviceStatus;
      const allowed = ["Damaged Possibly Repairable", "Damaged Beyond Repair"];
      setDeviceStatus(allowed.includes(status) ? status : "Fully Functional");
    }
  }, [data, isAddMode, template]);

  // --- Handle input change ---
  const handleInputChange = async (index, newValue) => {
    setFormData((prev) => {
      const updated = [...prev];
      updated[index] = { ...updated[index], value: newValue };
      return updated;
    });

    const field = formData[index];

   if (field?.type === "checkbox" && serialNumber) {
     const oldValue = field.value; // Store previous checkbox state
  console.log("Checkbox changed:", field.name, "New Value:", newValue);
  const contractEndpoint = `${baseUrl}/contractSigned?userID=${serialNumber}&isSigning=${newValue}`;


  // Try submitting the change
  const result = await submitData(contractEndpoint, { isSigning: newValue }, "post");

  // If submit failed → rollback the checkbox
  if (!result) {
    console.log("Reverting checkbox due to submission failure");
    setFormData((prev) => {
      const reverted = [...prev];
      reverted[index].value = true;
      return reverted;
    });
  }

  return; // Prevent further unwanted processing
}
  };

  

  // --- Handle device status update ---
  const handleStatusClick = async (newStatus) => {
    setDeviceStatus(newStatus);
    if (!serialNumber || isViewOnly || isAddMode) return;

    const endpoint = `${baseUrl}/status?itemType=${itemType}&newStatus=${newStatus}&deviceSN=${serialNumber}`;
    await submitData(endpoint, {}, "put");
  };
  const handleDelete = async (itemType, serialNumber, selectedPrefix) => {
    if (!serialNumber) return;
    const endpoint = `${baseUrl}/deleteEquipment?itemType=${itemType}&serialNumber=${serialNumber}&prefix=${selectedPrefix}`;
    const confirmed = window.confirm(`Are you sure you want to delete this ${itemType} with serial number ${serialNumber}? This action cannot be undone.`);
    if (!confirmed) return;
    await submitData(endpoint, {}, "post");
    console.log("Item deleted, navigating back to home.");
    
  }

  // --- Handle field blur ---
  const handleFieldBlur = async (field) => {
    console.log("isAddMode:", isAddMode); 
    console.log("Field blurred:", field);
    if (isAddMode) {
      console.log("In add mode, no updates will be sent.");
      return;
    }
  if (field.readOnly || isViewOnly || isAddMode) return;

   const originalValue = data?.[field.name];

  // Only continue if the value is actually different
  if (
    originalValue !== undefined && 
    String(originalValue).trim() === String(field.value).trim()
  ) {
    console.log(`No change detected for ${field.name}, skipping update.`);
    return;
  }
  if (field.name === "serialNumber" || field.name === "assetTag") {
    const newSerial = field.value.trim();
    const originalSerial = data?.serialNumber;

    const updateEndpoint = `${baseUrl}/update?itemType=${itemType}&deviceSN=${originalSerial}`;
    const payload = { fieldName: field.name, newValue: newSerial };

    await submitData(updateEndpoint, payload, "put");

      // ✅ invalidate old cache
      await queryClient.invalidateQueries({
        queryKey: ["itemData", itemType.toLowerCase(), originalSerial],
        exact: true,
      });

      if (field.name === "serialNumber") {
        console.log("Navigating to new serial number:", newSerial);
      navigate(`/showitem/${itemType}/${newSerial}`, { replace: true });
      return;
      }

      // ✅ optionally, force refetch after navigation
      setTimeout(() => {
        refetch?.();
      }, 50);

  }



    // --- Primary User updates ---
    if (field.name === "primaryUser") {
      const originalSerial = data?.primaryUser;
      
      console.log("Updating primary user to:", field.value);
      const matchedUser = dataPU?.find((u) => u.email === field.value);
      console.log("Matched user:", matchedUser);
      const isNoneOrEmpty = !field.value || field.value.toLowerCase() === "none";
      if (String(originalSerial).trim().toLowerCase() === String(field.value).trim().toLowerCase()) {
        console.log("Primary user unchanged, skipping update.");
        return;
      }
      if (!isNoneOrEmpty && !matchedUser) {
        toast.error("Invalid primary user email.");
        return;
      }

      const endpoint = `${baseUrl}/device?itemType=${itemType}&deviceSN=${serialNumber}`;
      const payload = {
        userID: matchedUser?.id ?? "None",
        email: matchedUser?.email ?? "None",
        signOut: isNoneOrEmpty ? "False" : "True",
      };

      await submitData(endpoint, payload, "put");
      return;
    }

    // --- Notes updates ---
    if (field.name === "notes" && !field.readOnly && !isViewOnly && !isAddMode) {
      if (!field.value.trim()) return;

      const noteEndpoint = `${baseUrl}/note?itemType=${itemType}&deviceSN=${serialNumber}`;
      const payload = { serialNumber, note: field.value.trim() };
      setNotes((prev) => [...prev, { date: new Date().toISOString().split("T")[0], content: field.value.trim() }]);
      await submitData(noteEndpoint, payload, "put");
      toast.success("Note added.");
      if (typeof field.clearInput === "function") field.clearInput();
      await refetch();
      
      return;
    }

    // --- Generic select field updates ---
    const selectFields = ["manufacturer", "purchasedBy", "Unknown"];
    if (selectFields.includes(field.name)) {
        const updateEndpoint = `${baseUrl}/update?itemType=${itemType}&deviceSN=${serialNumber}`;
        await submitData(updateEndpoint, { fieldName: field.name, newValue: field.value.trim() }, "put");
        toast.success(`${field.label} updated successfully`);
      
      return;
    }
  };

  // --- Handle delete note ---
  const handleDeleteNote = async (index) => {
    if (!notes || notes.length === 0) return;


      const endpoint = `${baseUrl}/deleteNote?itemType=${itemType}&deviceSN=${serialNumber}&index=${index}`;
      await submitData(endpoint, {}, "post");

      setNotes((prev) => prev.filter((_, i) => i !== index));;
      await refetch();

  };

  // --- Sync from external source ---
  const handleSync = async (itemType, serial, selectedPrefix) => {
    const endpoint = `${baseUrl}/updateItemFromMicrosoft?itemType=${itemType}&prefix=${selectedPrefix}&serialNumber=${serial}`;
    await submitData(endpoint, {}, "post");

    await refetch();
  };

  return {
    formData,
    setFormData,
    deviceStatus,
    setDeviceStatus,
    data,
    notes,
    setNotes,
    isLoading,
    isError,
    dataPU,
    refetch,
    handleInputChange,
    handleStatusClick,
    handleFieldBlur,
    handleDeleteNote,
    handleDelete,
    handleSync,
  };
}
