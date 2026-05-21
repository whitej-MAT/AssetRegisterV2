import React, { useMemo, useState } from "react";
import DataList from "../../components/dataList/Datalist";

/**
 * Backend-driven form renderer (excluding deviceStatus).
 *
 * Props:
 * - fields: [{ name, label, type, required, readOnly, adminOnly, hidden, options }]
 * - values: { [fieldName]: any }
 * - onChange: (name, value) => void
 * - onBlur: (name, value) => void
 * - isAdmin: boolean
 * - isViewOnly: boolean
 * - dataPU: [{ email, id }]  (primary users list)
 */
function FormFields({
  fields = [],
  values = {},
  onChange = () => {},
  onBlur = () => {},
  isAdmin = false,
  isViewOnly = false,
  isAdminPlus = false,
  isAddMode = false,
  dataPU = [],
  locationOptions = [],
}) {
  const [copiedField, setCopiedField] = useState(null);

  const copyToClipboard = (name, value) => {
    const text = String(value ?? "").trim();
    if (!text || text.toLowerCase() === "none") return;
    navigator.clipboard.writeText(text).then(() => {
      setCopiedField(name);
      setTimeout(() => setCopiedField(null), 1000);
    });
  };

  const normalizeValue = (v) => {
    if (v === null || v === undefined) return "";
    if (typeof v === "string" && v.trim().toLowerCase() === "none") return "";
    return v;
  };

  const isEditable = (field) => {
    if (isAddMode) return true; // all fields editable in add mode
    if (field.hidden) return false;
    if (isViewOnly) return false;
    if (field.readOnly) return false;
    if (field.adminOnly && !isAdmin && !isAdminPlus) return false;
    return true;
  };

  const primaryUserOptions = useMemo(() => {
    if (!Array.isArray(dataPU)) return [];
    return dataPU.map((u) => u?.email).filter(Boolean);
  }, [dataPU]);

  const CopyBtn = ({ name, value }) => {
    const text = String(value ?? "").trim();
    if (!text || text.toLowerCase() === "none") {
      return <span className="formCopyPlaceholder" />;
    }
    return (
      <button
        type="button"
        className="formCopyBtn"
        onClick={() => copyToClipboard(name, value)}
        title="Copy to clipboard"
      >
        {copiedField === name ? "✓" : "⧉"}
      </button>
    );
  };

  return (
    <div className="ItemForm">
      {fields
        .filter((f) => !f.hidden)
        .filter((f) => f.name !== "deviceStatus")
        .map((field) => {
          const rawValue = values[field.name];
          const value = normalizeValue(rawValue);
          const editable = isEditable(field);

          const handleBlur = () => onBlur(field.name, value);

          if (field.name === "primaryUser") {
            return (
              <div className="formRow" key={field.name}>
                <label className="formLabel">
                  {field.label}
                  {field.required ? <span className="requiredStar"> *</span> : null}
                </label>

                <DataList
                  className="formInput"
                  value={value ?? ""}
                  onChange={(v) => onChange(field.name, v)}
                  onBlur={handleBlur}
                  options={primaryUserOptions}
                  disabled={!editable}
                  name={field.name}
                  placeholder="Start typing an email..."
                />
                <CopyBtn name={field.name} value={value} />
              </div>
            );
          }

          if (field.name === "location" && locationOptions.length > 0) {
            return (
              <div className="formRow" key={field.name}>
                <label className="formLabel">
                  {field.label}
                  {field.required ? <span className="requiredStar"> *</span> : null}
                </label>

                <DataList
                  className="formInput"
                  value={value ?? ""}
                  onChange={(v) => onChange(field.name, v)}
                  onBlur={handleBlur}
                  options={locationOptions}
                  disabled={!editable}
                  name={field.name}
                  placeholder="Start typing a location..."
                />
                <CopyBtn name={field.name} value={value} />
              </div>
            );
          }

          if (field.type === "select") {
            const selectValue = typeof value === "string" ? value.trim() : value;

            return (
              <div className="formRow" key={field.name}>
                <label className="formLabel">
                  {field.label}
                  {field.required ? <span className="requiredStar"> *</span> : null}
                </label>

                <select
                  className="formInput"
                  value={selectValue ?? ""}
                  disabled={!editable}
                  onChange={(e) => onChange(field.name, e.target.value)}
                  onBlur={handleBlur}
                >
                  <option value="" disabled>
                    -- Select --
                  </option>
                  {(field.options ?? []).map((opt) => (
                    <option key={opt} value={opt}>
                      {opt}
                    </option>
                  ))}
                </select>
                <CopyBtn name={field.name} value={value} />
              </div>
            );
          }

          if (field.type === "checkbox") {
            const bool_value =
              value === "TRUE" ||
              (typeof value === "string" && value.toLowerCase() === "signed staff");
            return (
              <div className="formRow" key={field.name}>
                <label className="formLabel">
                  {field.label}
                  {field.required ? <span className="requiredStar"> *</span> : null}
                </label>

                <input
                  className="formInput"
                  type="checkbox"
                  checked={Boolean(bool_value)}
                  disabled={!editable}
                  onChange={(e) => onChange(field.name, e.target.checked)}
                />
                <span className="formCopyPlaceholder" />
              </div>
            );
          }

          return (
            <div className="formRow" key={field.name}>
              <label className="formLabel">
                {field.label}
                {field.required ? <span className="requiredStar"> *</span> : null}
              </label>

              <input
                className="formInput"
                type={field.type || "text"}
                value={value ?? ""}
                readOnly={!editable}
                onChange={(e) => {
                  const next =
                    field.type === "number"
                      ? e.target.value === ""
                        ? ""
                        : Number(e.target.value)
                      : e.target.value;

                  onChange(field.name, next);
                }}
                onBlur={handleBlur}
              />
              <CopyBtn name={field.name} value={value} />
            </div>
          );
        })}
    </div>
  );
}

export default FormFields;
