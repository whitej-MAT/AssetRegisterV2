// src/pages/addItem/AddItem.jsx
import React, { useMemo, useEffect, useState, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import Header from "../../components/header/Header";
import FormFields from "../../components/formFilds/FormFields";
import StatusButtons from "../../components/statusButtons/StatusButtons";
import NotesSection from "../../components/notesSection/NotesSection";
import useApiData from "../../hooks/useApiData";
import useSubmitData from "../../hooks/usePostData";
import { useAuthContext } from "../../hooks/useAuthContext";
import { formatPayload } from "../../utils/formatPayload";
import "./AddItem.css";
import "../showItem/ShowItem.css";

const normalizeTileSlug = (slug = "") =>
  String(slug)
    .replace(/[-_]+/g, " ")
    .replace(/([a-z0-9])([A-Z])/g, "$1 $2")
    .trim()
    .replace(/\s+/g, " ");

const toTitleCase = (s = "") => String(s).replace(/\b\w/g, (c) => c.toUpperCase());

const isNoneValue = (v) => {
  const s = String(v ?? "").trim().toLowerCase();
  return s === "" || s === "none" || s === "null" || s === "n/a";
};

const makeLocalTimestamp = () => {
  const now = new Date();
  const dd = String(now.getDate()).padStart(2, "0");
  const mm = String(now.getMonth() + 1).padStart(2, "0");
  const yyyy = now.getFullYear();
  const hh = String(now.getHours()).padStart(2, "0");
  const min = String(now.getMinutes()).padStart(2, "0");
  return `${dd}-${mm}-${yyyy} ${hh}:${min}`;
};

const singularize = (label = "") => {
  const s = String(label).trim();
  if (/ies$/i.test(s) && s.length > 3) return s.replace(/ies$/i, "y");
  if (/s$/i.test(s) && !/ss$/i.test(s) && s.length > 3) return s.replace(/s$/i, "");
  return s;
};

function AddItem() {
  const baseUrl = import.meta.env.VITE_API_BASE_URL;
  const navigate = useNavigate();
  const { selectedPrefix } = useAuthContext();
  const { itemType: itemTypeParam } = useParams();

  const deviceTypeDisplay = useMemo(() => {
    const base = toTitleCase(normalizeTileSlug(itemTypeParam));
    return singularize(base);
  }, [itemTypeParam]);

  const deviceTypeForApi = useMemo(
    () => (deviceTypeDisplay ? deviceTypeDisplay.trim().toUpperCase() : ""),
    [deviceTypeDisplay]
  );

  const fieldsEndpoint = useMemo(() => {
    if (!deviceTypeForApi) return "";
    return `${baseUrl}/newItemFeilds?deviceType=${encodeURIComponent(deviceTypeForApi)}`;
  }, [baseUrl, deviceTypeForApi]);

  const { data, isLoading, isError, error } = useApiData({
    queryKey: ["addItemFields", selectedPrefix, deviceTypeForApi],
    url: fieldsEndpoint,
    enabled: !!fieldsEndpoint,
  });

  const fields = useMemo(() => {
    if (!data) return [];
    if (Array.isArray(data)) return data;
    return data.fields ?? [];
  }, [data]);

  const [values, setValues] = useState({});
  const [submitError, setSubmitError] = useState("");
  const [newNote, setNewNote] = useState("");

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

  const dataPUWithNone = useMemo(() => {
    const base = dataPU ?? [];
    const hasNone = base.some(
      (u) => String(u?.email ?? "").toLowerCase().trim() === "none"
    );
    if (hasNone) return base;
    return [{ id: "None", email: "None" }, ...base];
  }, [dataPU]);

  const staffByEmail = useMemo(() => {
    const map = new Map();
    for (const u of dataPUWithNone) {
      const email = String(u?.email ?? "").trim().toLowerCase();
      if (email) {
        map.set(email, u.id);
      }
    }
    return map;
  }, [dataPUWithNone]);

  useEffect(() => {
    if (!fields.length) return;

    const initial = {};
    for (const f of fields) {
      initial[f.name] = "";
    }

    if (fields.some((f) => f.name === "PK")) {
      initial.PK = selectedPrefix ?? "";
    }

    initial.deviceStatus = "Spare";
    initial.notes = [];

    setValues(initial);
  }, [fields, selectedPrefix]);

  const handleChange = useCallback((name, value) => {
    setValues((prev) => ({ ...prev, [name]: value }));
  }, []);

  const handleStatusChange = useCallback((status) => {
    setValues((prev) => ({ ...prev, deviceStatus: status }));
  }, []);

  const handleAddNoteBlur = useCallback((noteText) => {
    const raw = String(noteText ?? "").trim();
    if (!raw) return;

    const dt = makeLocalTimestamp();
    setValues((prev) => ({
      ...prev,
      notes: [{ date: dt, text: raw }, ...(Array.isArray(prev.notes) ? prev.notes : [])],
    }));

    setNewNote("");
  }, []);

  const requiredMissing = useMemo(() => {
    const missing = [];
    for (const f of fields) {
      if (!f.required) continue;
      const v = values[f.name];
      if (isNoneValue(v)) missing.push(f.label || f.name);
    }
    return missing;
  }, [fields, values]);

  const canSubmit = requiredMissing.length === 0;

  const { submitData, isSubmitting } = useSubmitData();

  const deviceStatus = values.deviceStatus || "Spare";
  const notes = Array.isArray(values.notes) ? values.notes : [];

  const handleSubmit = useCallback(async () => {
    console.log("Submitting new item with values:", values);
    setSubmitError("");

    if (!canSubmit) {
      setSubmitError(`Missing required fields: ${requiredMissing.join(", ")}`);
      return;
    }

    console.log("values:", Object.prototype.toString.call(values), values);
    console.log("fields:", Object.prototype.toString.call(fields), fields);

    const payload = formatPayload(values, fields);

    if (Object.prototype.hasOwnProperty.call(payload, "primaryUser")) {
      const selectedEmail = String(payload.primaryUser ?? "").trim().toLowerCase();

      if (
        !selectedEmail ||
        selectedEmail === "none" ||
        selectedEmail === "null" ||
        selectedEmail === "n/a"
      ) {
        payload.primaryUser = "None";
        payload.primaryUserID = "None";
      } else {
        payload.primaryUserID = staffByEmail.get(selectedEmail) || "None";
      }
    }

    console.log("Formatted payload:", payload);

    const url = `${baseUrl}/item?prefix=${encodeURIComponent(
      selectedPrefix
    )}&deviceType=${encodeURIComponent(deviceTypeForApi)}`;

    try {
      console.log("Submitting to URL:", url);
      await submitData(url, payload);

      setValues((prev) => ({
        ...prev,
        serialNumber: "",
        assetTag: "",
        notes: [],
        mostRecentNote: "",
        ...(Object.prototype.hasOwnProperty.call(prev, "primaryUser")
          ? { primaryUser: "", primaryUserID: "" }
          : {}),
        deviceStatus: "Spare",
      }));

      setNewNote("");
    } catch (e) {
      console.error("Submission error:", e);
      setSubmitError(String(e?.message ?? e));
    }
  }, [
    baseUrl,
    selectedPrefix,
    deviceTypeForApi,
    values,
    fields,
    submitData,
    canSubmit,
    requiredMissing,
    staffByEmail,
  ]);

  return (
    <>
      <Header />

      <div className="ShowItemWrapper">
        <div className="ShowItemHeader">
          <div className="ShowItemTitle">Add New Item</div>
          <div className="ShowItemSubtitle">{deviceTypeDisplay}</div>
        </div>

        {isLoading && <p>Loading form…</p>}

        {isError && (
          <div style={{ marginTop: 8 }}>
            <p>Failed to load fields.</p>
            <pre style={{ whiteSpace: "pre-wrap" }}>{String(error?.message ?? error)}</pre>
          </div>
        )}

        {!isLoading && !isError && (
          <>
            <FormFields
              fields={fields}
              isAddMode={true}
              values={values}
              onChange={handleChange}
              onBlur={() => {}}
              dataPU={dataPUWithNone}
            />

            <StatusButtons
              deviceStatus={deviceStatus}
              itemType={deviceTypeDisplay}
              primaryUser={values.primaryUser}
              disabled={false}
              onStatusChange={handleStatusChange}
            />

            <NotesSection
              notes={notes}
              newNoteValue={newNote}
              onNewNoteChange={(e) => setNewNote(e.target.value)}
              onAddNoteBlur={handleAddNoteBlur}
              forceShowAdd={true}
            />

            {submitError && (
              <div style={{ marginTop: 10 }}>
                <p style={{ color: "crimson" }}>{submitError}</p>
              </div>
            )}

            <button
              className="AddItemButtons"
              type="button"
              onClick={handleSubmit}
              disabled={!canSubmit || isSubmitting}
            >
              {isSubmitting ? "Creating…" : "Create Item"}
            </button>

            <button
              className="AddItemButtons"
              type="button"
              onClick={() => navigate(-1)}
              disabled={isSubmitting}
            >
              Cancel
            </button>
          </>
        )}
      </div>
    </>
  );
}

export default AddItem;