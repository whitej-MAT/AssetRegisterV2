// src/pages/showItem/ShowItem.jsx
import React, { useMemo, useState, useEffect, useRef } from "react";
import { useParams } from "react-router-dom";
import { useAuthContext } from "../../hooks/useAuthContext";
import useApiData from "../../hooks/useApiData";
import useSubmitData from "../../hooks/usePostData";
import Header from "../../components/header/Header";
import FormFields from "../../components/formFilds/FormFields";
import ItemHeader from "../../components/itemHeader/ItemHeader";
import StatusButtons from "../../components/statusButtons/StatusButtons";
import NotesSection from "../../components/notesSection/NotesSection";
import ReusableTable from "../../components/reusableTable/ReusableTable";
import DeviceDepreciationChart from "../../components/deviceDepreciationChart/DeviceDepreciationChart";
import "./ShowItem.css";

function ShowItem() {
  const { deviceType, serialNumber } = useParams();
  const { selectedPrefix, isAdmin, isViewOnly, isAdminPlus } = useAuthContext();
  const baseUrl = import.meta.env.VITE_API_BASE_URL;

  const { submitData } = useSubmitData();

  const [values, setValues] = useState({});
  const [newNote, setNewNote] = useState("");

  // Track last saved/loaded values so we can skip POSTs when nothing changed
  const lastSavedRef = useRef({});

  // =========================
  // GET: Item endpoint
  // =========================
  const itemEndpoint = useMemo(() => {
    if (!selectedPrefix || !deviceType || !serialNumber) return "";
    return `${baseUrl}/item?prefix=${encodeURIComponent(
      selectedPrefix
    )}&deviceType=${encodeURIComponent(deviceType)}&serialNumber=${encodeURIComponent(
      serialNumber
    )}&isAdminPlus=${encodeURIComponent(String(isAdminPlus))}`;
  }, [baseUrl, selectedPrefix, deviceType, serialNumber, isAdminPlus]);

  const { data, isLoading } = useApiData({
    queryKey: ["itemDetails", selectedPrefix, deviceType, serialNumber],
    url: itemEndpoint,
    enabled: !!itemEndpoint,
  });
 const devicesOwnedEndpoint = useMemo(() => {
  if (deviceType !== "Signed Staff" || !selectedPrefix) return null;
  return `${baseUrl}/devicesOwned?userID=${encodeURIComponent(serialNumber)}`;
}, [deviceType, baseUrl, selectedPrefix, serialNumber]);

const { data: devicesOwned } = useApiData({
  queryKey: ["devicesOwned", serialNumber],
  url: devicesOwnedEndpoint,
  enabled: !!devicesOwnedEndpoint,
});

const devicesOwnedHeadings = devicesOwned?.tableHeaders ?? [];
const devicesOwnedRows = devicesOwned?.searchableItems?.items ?? [];
  // =========================
  // GET: Staff list endpoint
  // =========================
  const staffEndpoint = useMemo(() => {
    if (!selectedPrefix) return "";
    return `${baseUrl}/primaryUsers?prefix=${encodeURIComponent(selectedPrefix)}`;
  }, [baseUrl, selectedPrefix]);

  const { data: staffData } = useApiData({
    queryKey: ["staffList", selectedPrefix],
    url: staffEndpoint,
    enabled: !!staffEndpoint,
  });

  const dataPU = staffData?.items ?? [];
  const fields = data?.fields ?? [];
  const item = data?.item ?? {};

  const adminFields = data?.adminFields ?? [];
  const adminItem = data?.adminItem ?? {};

  // =========================
  // Add a synthetic "None" option
  // =========================
  const dataPUWithNone = useMemo(() => {
    const base = dataPU ?? [];
    const hasNone = base.some(
      (u) => String(u?.email ?? "").toLowerCase().trim() === "none"
    );
    if (hasNone) return base;

    return [{ id: "None", email: "None" }, ...base];
  }, [dataPU]);

  // =========================
  // map email -> id for primaryUserID (includes None)
  // =========================
  const staffByEmail = useMemo(() => {
    const map = new Map();
    for (const u of dataPUWithNone) {
      const email = String(u?.email ?? "").trim().toLowerCase();
      if (email) map.set(email, u.id);
    }
    return map;
  }, [dataPUWithNone]);

  // =========================
  // helpers
  // =========================
  const normalize = (v) => (v == null ? "" : String(v));
  const isEqual = (a, b) => normalize(a) === normalize(b);

  const isNoneValue = (v) => {
    const s = String(v ?? "").trim().toLowerCase();
    return s === "" || s === "none" || s === "null" || s === "n/a";
  };

  // Local timestamp: "DD-MM-YYYY HH:mm"
  const makeLocalTimestamp = () => {
    const now = new Date();
    const dd = String(now.getDate()).padStart(2, "0");
    const mm = String(now.getMonth() + 1).padStart(2, "0");
    const yyyy = now.getFullYear();
    const hh = String(now.getHours()).padStart(2, "0");
    const min = String(now.getMinutes()).padStart(2, "0");
    return `${dd}-${mm}-${yyyy} ${hh}:${min}`;
  };

  // =========================
  // Local state update
  // =========================
const toBoolean = (v) => {
  if (typeof v === "boolean") return v;
  if (typeof v === "string") {
    const s = v.trim().toLowerCase();
    if (s === "true") return true;
    if (s === "false") return false;
  }
  return Boolean(v);
};

const handleChange = async (name, value) => {
  let finalValue = value;

  if (name === "inSenso") {
    const signed = toBoolean(value);
    finalValue = signed ? "TRUE" : "FALSE";
  }

  if (name === "contractSigned") {
    const signed = toBoolean(value);
    finalValue = signed ? "Signed Staff" : "Unsigned Staff";
  }

  setValues((prev) => ({
    ...prev,
    [name]: finalValue,
  }));

  if (isViewOnly) return;

  if (name === "contractSigned") {
    const signed = toBoolean(value);

    const url = `${baseUrl}/contractSigned?prefix=${encodeURIComponent(
      selectedPrefix
    )}&id=${encodeURIComponent(serialNumber)}&contractSigned=${encodeURIComponent(
      String(signed)
    )}`;

    await submitData(url, {});
    return;
  }

  if (name === "inSenso") {
    const boolValue = toBoolean(value);

    const url = `${baseUrl}/updateItem?prefix=${encodeURIComponent(
      selectedPrefix
    )}&deviceType=${encodeURIComponent(
      deviceType
    )}&serialNumber=${encodeURIComponent(
      serialNumber
    )}&attribute=${encodeURIComponent(name)}&newValue=${encodeURIComponent(
      boolValue ? "TRUE" : "FALSE"
    )}`;


    await submitData(url, {});
  }
};

  // =========================
  // Save on blur (POST)
  // =========================
  const handleFieldBlur = async (name, value) => {
    if (isViewOnly) return;
    console.log(`Field blur: ${name} =`, value);

    const raw = String(value ?? "").trim();
    const none = isNoneValue(raw);
    const finalValue = none ? "None" : raw;

    const previous = lastSavedRef.current?.[name];
    if (isEqual(previous, finalValue)) return;

    let url = `${baseUrl}/updateItem?prefix=${encodeURIComponent(
      selectedPrefix
    )}&deviceType=${encodeURIComponent(
      deviceType
    )}&serialNumber=${encodeURIComponent(
      serialNumber
    )}&attribute=${encodeURIComponent(name)}&newValue=${encodeURIComponent(
      finalValue
    )}`;

    if (name === "primaryUser") {
      if (none) {
        url += `&primaryUserID=None`;
      } else {
        const email = finalValue.toLowerCase();
        const userId = staffByEmail.get(email);

        if (!userId) {
          console.error("Invalid primary user email:", finalValue);
          return;
        }

        url += `&primaryUserID=${encodeURIComponent(userId)}`;
      }
    }
    console.log("Submitting field update to URL:", url);
    await submitData(url, {});

    // update snapshot
    lastSavedRef.current = {
      ...lastSavedRef.current,
      [name]: finalValue,
    };
  };

  // =========================
  // NOTES: Add note on blur (POST to /notes)
  // Endpoint: /notes?prefix=...&deviceType=...&serialNumber=...&noteText=...
  // Data NOT returned, so we append locally with a local timestamp.
  // =========================
const handleDeleteNote = async (index) => {
  if (isViewOnly) return;

  const currentNotes = Array.isArray(values.notes ?? item.notes)
    ? (values.notes ?? item.notes)
    : [];

  const noteToDelete = currentNotes[index];
  if (!noteToDelete) return;

  const ts = noteToDelete.date;
  const text = noteToDelete.text;

  // Optimistic UI update
  setValues((prev) => ({
    ...prev,
    notes: (Array.isArray(prev.notes) ? prev.notes : currentNotes).filter(
      (_, i) => i !== index
    ),
  }));

  try {
    const token = auth.user?.access_token;

    const url = `${baseUrl}/notes?prefix=${encodeURIComponent(
      selectedPrefix
    )}&deviceType=${encodeURIComponent(
      deviceType
    )}&serialNumber=${encodeURIComponent(
      serialNumber
    )}&timestamp=${encodeURIComponent(ts)}&noteText=${encodeURIComponent(text)}`;

    const resp = await fetch(url, {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (!resp.ok) {
      setValues((prev) => ({
        ...prev,
        notes: currentNotes,
      }));
      console.error("Delete note failed:", await resp.text());
    }
  } catch (err) {
    setValues((prev) => ({
      ...prev,
      notes: currentNotes,
    }));
    console.error("Delete note error:", err);
  }
};

  // =========================
  // Load item into values when data arrives
  // =========================
  useEffect(() => {
  if (!fields.length) return;

  const initial = {};
  for (const f of fields) initial[f.name] = item[f.name] ?? "";

  // include admin fields too (if present)
  for (const f of adminFields ?? []) {
    initial[f.name] = data?.adminItem?.[f.name] ?? "";
  }

  if (isNoneValue(initial.primaryUser)) initial.primaryUser = "None";
  if (isNoneValue(initial.primaryUserID)) initial.primaryUserID = "None";

  if (!Array.isArray(initial.notes))
    initial.notes = Array.isArray(item.notes) ? item.notes : [];

  setValues(initial);
  lastSavedRef.current = initial;
}, [fields, adminFields, item, data?.adminItem]);

useEffect(() => {
  console.log("API data:", data);
  console.log("depreciation:", data?.depreciation);
  console.log("points:", data?.depreciation?.points);
  console.log("isAdminPlus:", isAdminPlus);
  console.log("itemEndpoint:", itemEndpoint);
}, [data, isAdminPlus, itemEndpoint]);

const handleStatusChange = async (status) => {
  // 1) update UI immediately
  setValues((prev) => ({ ...prev, deviceStatus: status }));

  // 2) force POST regardless of lastSavedRef (don't pre-update it)
  if (isViewOnly) return;

  const url = `${baseUrl}/updateItem?prefix=${encodeURIComponent(
    selectedPrefix
  )}&deviceType=${encodeURIComponent(deviceType)}&serialNumber=${encodeURIComponent(
    serialNumber
  )}&attribute=${encodeURIComponent("deviceStatus")}&newValue=${encodeURIComponent(
    status
  )}`;

  console.log("Submitting status update to URL:", url);
  await submitData(url, {});

  // 3) now update snapshot
  lastSavedRef.current = {
    ...lastSavedRef.current,
    deviceStatus: status,
  };
};
const handleDelete = async () => {
  if (!isViewOnly) {
    const url = `${baseUrl}/deleteItem?prefix=${encodeURIComponent(
      selectedPrefix
    )}&deviceType=${encodeURIComponent(
      deviceType
    )}&serialNumber=${encodeURIComponent(serialNumber)}`;
    console.log("Submitting delete request to URL:", url);
    await submitData(url, {});
  }
};

  const deviceStatus = values.deviceStatus ?? item.deviceStatus ?? "";
  console.log(deviceStatus)
  const notes = Array.isArray(values.notes ?? item.notes) ? (values.notes ?? item.notes) : [];

  if (isLoading)
    return (
      <>
        <Header />
        <p>Loading...</p>
      </>
    );

  return (
    <>
      <Header />
      <div className="ShowItemWrapper">
        <ItemHeader
          deviceType={deviceType}
          itemSerialNumber={serialNumber}
          // These existed in your snippet; keep your implementations:
          handleSync={() => handleSync(deviceType, serialNumber, selectedPrefix)}
          handleDelete={() => handleDelete(deviceType, serialNumber, selectedPrefix)}
        />

        <FormFields
          fields={fields}
          values={values}
          onChange={handleChange}
          onBlur={handleFieldBlur}
          isAdmin={isAdmin}
          isAdminPlus={isAdminPlus}
          isViewOnly={isViewOnly}
          dataPU={dataPUWithNone}
        />
        {isAdminPlus && deviceType !== "Signed Staff" && deviceType !== "Unsigned Staff" && (
  <>
    <FormFields
      fields={adminFields}
      values={values}
      onChange={handleChange}
      onBlur={handleFieldBlur}
      isAdmin={isAdmin}
      isAdminPlus={isAdminPlus}
      isViewOnly={isViewOnly}
    />

    <DeviceDepreciationChart depreciation={data?.depreciation} />
  </>
)}

        {deviceType !== "Signed Staff" && deviceType !== "Unsigned Staff" && (
          <>
            <StatusButtons
              deviceStatus={deviceStatus}
              itemType={deviceType}
              primaryUser={values.primaryUser}
              disabled={isViewOnly}
              onStatusChange={handleStatusChange}
            />

            <NotesSection
              notes={notes}
              newNoteValue={newNote}
              onNewNoteChange={(e) => setNewNote(e.target.value)}
              onAddNoteBlur={handleAddNoteBlur}
              onDeleteNote={handleDeleteNote}
            />
          </>
        )}
        {deviceType === "Signed Staff" && (
        <ReusableTable
          tableRows={devicesOwnedRows}
          tableHeadings={devicesOwnedHeadings}
          globalSearch={""}
        />

        )}
      </div>
    </>
  );
}

export default ShowItem;