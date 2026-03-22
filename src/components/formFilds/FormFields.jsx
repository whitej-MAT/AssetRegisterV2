import React, { useMemo } from "react";
import DataList from "../../components/dataList/Datalist"; // <-- your datalist component (adjust if needed)

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
  onClick = () => {},
  isAdmin = false,
  isViewOnly = false,
  isAdminPlus = false,
  isAddMode = false,
  dataPU = [],
}) {
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

  // ✅ Build the datalist options (emails)
  const primaryUserOptions = useMemo(() => {
    if (!Array.isArray(dataPU)) return [];
    return dataPU.map((u) => u?.email).filter(Boolean);
  }, [dataPU]);

  return (
    <div className="ItemForm">
      {fields
        // ✅ hide hidden fields
        .filter((f) => !f.hidden)
        // ✅ remove deviceStatus here (it will be its own component)
        .filter((f) => f.name !== "deviceStatus")
        .map((field) => {
          const rawValue = values[field.name];
          const value = normalizeValue(rawValue);
          const editable = isEditable(field);

          const handleBlur = () => onBlur(field.name, value);
          const handleOnClick = () => onClick(field.name, value);

          // ✅ primaryUser uses your DataList component
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
              </div>
            );
          }

          // ✅ select fields (excluding deviceStatus) still supported
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
              </div>
            );
          }

          // ✅ checkbox supported
          if (field.type === "checkbox") {
            let bool_value = ""
            console.log("Raw value for checkbox:", rawValue);
            if (typeof value === "string" && value.toLowerCase() === "signed staff" || value === "TRUE") {
              bool_value = true;
            }
            else if (typeof value === "string" && value.toLowerCase() === "unsigned staff" || value === "FALSE") {
              bool_value = false;
            }
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
                  onClick={handleOnClick}
                />
              </div>
            );
          }

          // ✅ default input (text/number/date/etc.)
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
            </div>
          );
        })}
    </div>
  );
}

export default FormFields;
