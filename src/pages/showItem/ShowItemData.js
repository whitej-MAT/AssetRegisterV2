export const signedstaff = [
  { label: "First Name", name: "firstName", type: "text", readOnly: true },
  { label: "Surname", name: "surname", type: "text", readOnly: true },
  { label: "Email", name: "email", type: "text", readOnly: true },
  { label: "Job Title", name: "jobTitle", type: "text", readOnly: true },
  { label: "Contract Signed", name: "contractSigned", type: "checkbox", value: true },
  { label: "Date Signed", name: "dateSigned", type: "text", readOnly: true },
  { label: "Devices Owned", name: "devicesOwned", type: "text", readOnly: true },
];
export const stafflaptop = [
  { label: "Device Name", name: "deviceName", readOnly: true },
  { label: "Serial Number", name: "serialNumber", readOnly: true },
  { label: "Asset Tag", name: "assetTag", readOnly: false },
  { label: "Model", name: "model", readOnly: true },
  { label: "Warranty End Date", name: "warrantyEndDate", readOnly: true },
  { label: "Primary User", name: "primaryUser", readOnly: false },
  { label: "Sign Out Date", name: "signOutDate", readOnly: true },
  { label: "Manufacturer", name: "manufacturer", type: "text", readOnly: true },
  { label: "Purchased By", name: "purchasedBy", type: "select", options: ["School", "Trust", "Unknown"], },
];
export const InventoryItem = [
  { label: "Asset Tag", name: "assetTag", type: "text", readOnly: false },
  { label: "Serial Number", name: "serialNumber", type: "text", readOnly: false },
  { label: "Primary User", name: "primaryUser", type: "text", readOnly: false },
];