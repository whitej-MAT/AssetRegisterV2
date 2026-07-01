// src/pages/showItem/ShowItem.jsx
import React, { useMemo, useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuthContext } from "../../hooks/useAuthContext";
import useStaffList from "../../hooks/useStaffList";
import { isNoneValue, makeLocalTimestamp } from "../../utils/helpers";
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
  const navigate = useNavigate();
  const { auth, selectedPrefix, isAdmin, isViewOnly, isAdminPlus } = useAuthContext();
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

  const { data, isLoading, isFetching, refetch } = useApiData({
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

  const { dataPUWithNone, staffByEmail } = useStaffList();

  const locationsEndpoint = useMemo(() => {
    const isStaff = deviceType === "Signed Staff" || deviceType === "Unsigned Staff";
    if (!selectedPrefix || !deviceType || isStaff) return "";
    return `${baseUrl}/locations?prefix=${encodeURIComponent(selectedPrefix)}&deviceType=${encodeURIComponent(deviceType)}`;
  }, [baseUrl, selectedPrefix, deviceType]);

  const { data: locationsData } = useApiData({
    queryKey: ["locations", selectedPrefix, deviceType],
    url: locationsEndpoint,
    enabled: !!locationsEndpoint,
  });

  const locationOptions = locationsData?.locations ?? [];

  const fields = data?.fields ?? [];
  const item = data?.item ?? {};

  const adminFields = data?.adminFields ?? [];

  const normalize = (v) => (v == null ? "" : String(v));
  const isEqual = (a, b) => normalize(a) === normalize(b);

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
  const handleAddNoteBlur = async (noteText) => {
    if (isViewOnly) return;

    const raw = String(noteText ?? "").trim();
    if (!raw) return;

    const url = `${baseUrl}/notes?prefix=${encodeURIComponent(
      selectedPrefix
    )}&deviceType=${encodeURIComponent(
      deviceType
    )}&serialNumber=${encodeURIComponent(
      serialNumber
    )}&noteText=${encodeURIComponent(raw)}`;
    await submitData(url, {});

    const dateStamp = makeLocalTimestamp();

    // append locally
    setValues((prev) => {
      const existing = Array.isArray(prev.notes)
        ? prev.notes
        : Array.isArray(item.notes)
        ? item.notes
        : [];

      return {
      ...prev,
      notes: [{ date: dateStamp, text: raw }, ...existing],
    };
    });

    setNewNote("");
  };

  // Optional: delete locally (wire server delete when you have endpoint)
  const handleDeleteNote = async (index) => {
  if (isViewOnly) return;
  const token = auth.user?.id_token || auth.user?.access_token;
      if (!token) throw new Error("No token found. User may not be authenticated.");

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
      // rollback if delete failed
      setValues((prev) => ({
        ...prev,
        notes: currentNotes,
      }));
      console.error("Delete note failed:", await resp.text());
    }
  } catch (err) {
    // rollback if network error
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

const handleStatusChange = async (status) => {
  setValues((prev) => ({ ...prev, deviceStatus: status }));

  if (isViewOnly) return;

  const url = `${baseUrl}/updateItem?prefix=${encodeURIComponent(
    selectedPrefix
  )}&deviceType=${encodeURIComponent(deviceType)}&serialNumber=${encodeURIComponent(
    serialNumber
  )}&attribute=${encodeURIComponent("deviceStatus")}&newValue=${encodeURIComponent(
    status
  )}`;

  await submitData(url, {});

  lastSavedRef.current = { ...lastSavedRef.current, deviceStatus: status };
};

const handleDeletePreviousUser = async (email) => {
  if (isViewOnly) return;

  const current = Array.isArray(values.previousUsers) ? values.previousUsers : [];

  setValues((prev) => ({
    ...prev,
    previousUsers: current.filter((e) => e !== email),
  }));

  const url = `${baseUrl}/previousUsers?prefix=${encodeURIComponent(selectedPrefix)}&deviceType=${encodeURIComponent(deviceType)}&serialNumber=${encodeURIComponent(serialNumber)}&email=${encodeURIComponent(email)}`;
  const result = await submitData(url, {}, "delete");

  if (!result) {
    setValues((prev) => ({ ...prev, previousUsers: current }));
  }
};

const handleDelete = async () => {
  if (isViewOnly) return;
  if (!window.confirm(`Delete ${serialNumber}? This cannot be undone.`)) return;

  const url = `${baseUrl}/deleteItem?prefix=${encodeURIComponent(
    selectedPrefix
  )}&deviceType=${encodeURIComponent(
    deviceType
  )}&serialNumber=${encodeURIComponent(serialNumber)}`;
  await submitData(url, {}, "delete");
  navigate(-1);
};

const handleBack = () => {
  navigate(-1);
};

const handleRefresh = async () => {
  await refetch();
};

const handleSync = async () => {
  const url = `${baseUrl}/updateItemFromMicrosoft?prefix=${encodeURIComponent(
    selectedPrefix
  )}&deviceType=${encodeURIComponent(deviceType)}&serialNumber=${encodeURIComponent(serialNumber)}`;
  await submitData(url, {});
  await refetch();
};

  const deviceStatus = values.deviceStatus ?? item.deviceStatus ?? "";
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
          primaryUser={values.primaryUser}
          handleSync={handleSync}
          handleDelete={handleDelete}
          handleBack={handleBack}
          handleRefresh={handleRefresh}
          isRefreshing={isFetching}
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
          locationOptions={locationOptions}
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

        {fields.some((f) => f.name === "primaryUser") && (
          <div className="PreviousUsersSection">
            <h3 className="PreviousUsersTitle">Previous users</h3>
            {Array.isArray(values.previousUsers) && values.previousUsers.length > 0 ? (
              <div className="PreviousUsersBubbles">
                {values.previousUsers.slice(0, 5).map((email) => (
                  <div key={email} className="PreviousUsersBubble" title={email}>
                    <span className="PreviousUsersBubbleText">{email}</span>
                    {!isViewOnly && (
                      <button
                        className="PreviousUsersBubbleDelete"
                        onClick={() => handleDeletePreviousUser(email)}
                        title="Remove"
                      >
                        ✕
                      </button>
                    )}
                  </div>
                ))}
                {values.previousUsers.length > 5 && (
                  <div className="PreviousUsersBubble PreviousUsersBubbleCount">
                    +{values.previousUsers.length - 5}
                  </div>
                )}
              </div>
            ) : (
              <p className="PreviousUsersEmpty">No previous users</p>
            )}
          </div>
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