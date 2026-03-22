// src/utils/formatPayload.js

/**
 * Build API payload from values + fields definitions.
 * - values: plain object { [fieldName]: value }
 * - fields: array of field objects, typically with .name
 */
console.log("✅ using utils/formatPayload", import.meta.url);
export function formatPayload(values = {}, fields = []) {
  // Normalize fields into an array safely
  const fieldList = Array.isArray(fields)
    ? fields
    : fields && typeof fields === "object"
      ? (Array.isArray(fields.fields) ? fields.fields : Object.values(fields))
      : [];

  // If we still don't have a usable fields list, just send values as-is
  if (!Array.isArray(fieldList) || fieldList.length === 0) {
    return { ...values };
  }

  // Only include keys that exist in field definitions
  const payload = {};
  for (const f of fieldList) {
    const key = f?.name ?? f?.key ?? f?.id;
    if (!key) continue;
    payload[key] = values[key];
  }

  // Always include notes if you maintain it locally (optional)
  if (values.notes !== undefined) payload.notes = values.notes;

  return payload;
}