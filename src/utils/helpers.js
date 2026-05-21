// Shared utility functions used across multiple pages/components.
// Import from here rather than copying into each file.

export const HEADER_TO_FIELD = {
  "Asset tag": "assetTag",
  "Serial number": "serialNumber",
  "Device status": "deviceStatus",
  "Most recent note": "mostRecentNote",
  "Damage date": "damageDate",
  "Device name": "deviceName",
  "Device type": "deviceType",
  "Primary user": "primaryUser",
  "Location": "location",
  "Ram": "ram",
  "Email": "email",
  "First name": "firstName",
  "Surname": "surname",
  "Job title": "jobTitle",
  "Contract signed": "contractSigned",
  "Date signed": "dateSigned",
  "Devices owned": "devicesOwned",
};

const headingToFieldKey = (heading) => {
  if (HEADER_TO_FIELD[heading]) return HEADER_TO_FIELD[heading];
  return String(heading)
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, "")
    .split(/\s+/)
    .map((w, i) => (i === 0 ? w : w.charAt(0).toUpperCase() + w.slice(1)))
    .join("");
};

const csvEscape = (v) => {
  const s = String(v ?? "");
  return s.includes(",") || s.includes('"') || s.includes("\n")
    ? `"${s.replace(/"/g, '""')}"`
    : s;
};

export const downloadCsv = (items, headings, filename = "export") => {
  const rows = [
    headings.map(csvEscape).join(","),
    ...items.map((item) =>
      headings.map((h) => csvEscape(item[headingToFieldKey(h)] ?? "")).join(",")
    ),
  ];

  const blob = new Blob([rows.join("\n")], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${filename}_${new Date().toISOString().slice(0, 10)}.csv`;
  a.click();
  URL.revokeObjectURL(url);
};

export const downloadAllFieldsCsv = (items, filename = "export") => {
  if (!items.length) return;
  const SKIP = new Set(["PK", "SK"]);
  const keys = [...new Set(items.flatMap(Object.keys))].filter((k) => !SKIP.has(k));
  const toLabel = (k) => k.replace(/([A-Z])/g, " $1").replace(/^./, (c) => c.toUpperCase()).trim();
  const rows = [
    keys.map(toLabel).map(csvEscape).join(","),
    ...items.map((item) => keys.map((k) => csvEscape(item[k] ?? "")).join(",")),
  ];
  const blob = new Blob([rows.join("\n")], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${filename}_${new Date().toISOString().slice(0, 10)}.csv`;
  a.click();
  URL.revokeObjectURL(url);
};

export const isNoneValue = (v) => {
  const s = String(v ?? "").trim().toLowerCase();
  return s === "" || s === "none" || s === "null" || s === "n/a";
};

// Returns "DD-MM-YYYY HH:mm" in local time
export const makeLocalTimestamp = () => {
  const now = new Date();
  const dd = String(now.getDate()).padStart(2, "0");
  const mm = String(now.getMonth() + 1).padStart(2, "0");
  const hh = String(now.getHours()).padStart(2, "0");
  const min = String(now.getMinutes()).padStart(2, "0");
  return `${dd}-${mm}-${now.getFullYear()} ${hh}:${min}`;
};

// Converts a URL slug (camelCase, kebab, or spaced) to readable words
export const normalizeTileSlug = (slug = "") =>
  String(slug)
    .replace(/[-_]+/g, " ")
    .replace(/([a-z0-9])([A-Z])/g, "$1 $2")
    .trim()
    .replace(/\s+/g, " ");

export const toTitleCase = (s = "") =>
  String(s).replace(/\b\w/g, (c) => c.toUpperCase());
