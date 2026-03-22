export const laptopColumns = [
  "assetTag",
  "deviceName",
  "deviceStatus",
  "primaryUser",
  "warrantyEndDate",
  "mostRecentNote",
];

export const allDevicesColumns = [
  "assetTag",
  "deviceType",
  "deviceName",
  "deviceStatus",
  "primaryUser",
  "warrantyEndDate",
  "mostRecentNote",
];

export const damagedColumns = [
  "assetTag",
  "deviceName",
  "deviceStatus",
  "primaryUser",
  "deviceType",
  "damageDate",
  "mostRecentNote",
];

export const unsignedStaffColumns = ["email", "firstName", "surname", "jobTitle"];

export const signedStaffColumns = [
  "email",
  "firstName",
  "surname",
  "jobTitle",
  "devicesOwned",
];

export const inventoryItemColumns = [
  "assetTag",
  "serialNumber",
  "primaryUser",
  "deviceStatus",
];

export const deviceOwnedColumns = [
  "assetTag",
  "serialNumber",
  "deviceName",
  "signOutDate",
  "itemType",
];

export const searchCondition = [
  "Equals",
  "Contains",
  "Starts With",
  "Ends With",
  "Not Equals",
  "Greater Than",
  "Less Than",
];

export const tableConfigs = {
  "All Assets": {
    title: "All Assets",
    columnHeaders: allDevicesColumns,
    kind: "multipliable",
    itemSerialKey: "serialNumber",
    itemType: "itemType",
    itemTypeParam: "asset",
  },

  "All Devices": {
    title: "All Devices",
    columnHeaders: allDevicesColumns,
    kind: "multipliable",
    itemSerialKey: "serialNumber",
    itemType: "itemType",
    itemTypeParam: "device",
  },

  "Damaged Assets": {
    title: "Damaged Assets",
    columnHeaders: damagedColumns,
    kind: "damaged",
    itemSerialKey: "serialNumber",
    itemType: "itemType",
    itemTypeParam: "asset",
  },

  "Damaged Devices": {
    title: "Damaged Devices",
    columnHeaders: damagedColumns,
    kind: "damaged",
    itemSerialKey: "serialNumber",
    itemType: "itemType",
    itemTypeParam: "device",
  },

  "Staff Laptops": {
    title: "Staff Laptops",
    columnHeaders: laptopColumns,
    kind: "multipliable",
    itemSerialKey: "serialNumber",
    itemType: "itemType",
    showButton: true,
    buttonText: "Sync With Microsoft",
    itemTypeParam: "asset",
  },

  "Staff Computers": {
    title: "Staff Computers",
    columnHeaders: laptopColumns,
    kind: "multipliable",
    itemSerialKey: "serialNumber",
    itemType: "itemType",
    showButton: true,
    buttonText: "Sync With Microsoft",
    itemTypeParam: "asset",
  },

  "Student Laptops": {
    title: "Student Laptops",
    columnHeaders: laptopColumns,
    kind: "multipliable",
    itemSerialKey: "serialNumber",
    itemType: "itemType",
    showButton: true,
    buttonText: "Sync With Microsoft",
    itemTypeParam: "asset",
  },

  "Student Computers": {
    title: "Student Computers",
    columnHeaders: laptopColumns,
    kind: "multipliable",
    itemSerialKey: "serialNumber",
    itemType: "itemType",
    showButton: true,
    buttonText: "Sync With Microsoft",
    itemTypeParam: "asset",
  },
  "Mobile Phones": {
    title: "Mobile Phones",
    columnHeaders: laptopColumns,
    kind: "multipliable",
    itemSerialKey: "serialNumber",
    itemType: "itemType",
    showButton: true,
    buttonText: "Add New Item",
    buttonPath: "/addItem/Mobile Phone",
    itemTypeParam: "asset",
  },

  "Printers": {
    title: "Printers",
    columnHeaders: laptopColumns,
    kind: "multipliable",
    itemSerialKey: "serialNumber",
    itemType: "itemType",
    showButton: true,
    buttonText: "Add New Item",
    buttonPath: "/addItem/Printer",
    itemTypeParam: "asset",
  },

  // ✅ Staff
  "Signed Staff Members": {
    title: "Signed Staff Members",
    columnHeaders: signedStaffColumns,
    kind: "staffMembersSigned",
    itemSerialKey: "id",
    itemType: "staff", // ✅ keep it simple/consistent
  },

  "Unsigned Staff Members": {
    title: "Unsigned Staff Members",
    columnHeaders: unsignedStaffColumns,
    kind: "staffMembersUnsigned",
    itemSerialKey: "id",
    itemType: "staff",
    showButton: true,
    buttonText: "Sync With Microsoft",
  },

  // ✅ FIXED: removed duplicate itemTypeParam
  "Laptop Chargers": {
    title: "Laptop Chargers",
    columnHeaders: inventoryItemColumns,
    kind: "devicesByItemType",
    itemSerialKey: "serialNumber",
    itemType: "itemType",
    itemTypeParam: "Laptop Charger",
    showButton: true,
    buttonPath: "/addItem/Laptop Charger",
  },

  // ✅ FIXED: removed duplicate itemTypeParam
  "Radios": {
    title: "Radios",
    columnHeaders: inventoryItemColumns,
    kind: "multipliable",
    itemSerialKey: "serialNumber",
    itemType: "itemType",
    itemTypeParam: "device", // keep this as device for multipliable endpoint
    showButton: true,
    buttonPath: "/addItem/Radio",
    buttonText: "Add New Radio",
  },

  "Radio Headsets": {
    title: "Radio Headsets",
    columnHeaders: inventoryItemColumns,
    kind: "devicesByItemType",
    itemSerialKey: "serialNumber",
    itemType: "itemType",
    itemTypeParam: "Radio Headset",
    showButton: true,
    buttonPath: "/addItem/Radio Headset",
  },

  "CCTV Cameras": {
    title: "CCTV Cameras",
    columnHeaders: laptopColumns,
    kind: "multipliable",
    itemSerialKey: "serialNumber",
    itemType: "itemType",
    showButton: true,
    buttonText: "Add New Camera",
    buttonPath: "/addItem/CCTV Camera",
    itemTypeParam: "asset",
  },

  "Devices Owned": {
    title: "Devices Owned",
    columnHeaders: deviceOwnedColumns,
    kind: "devicesOwned",
    itemSerialKey: "serialNumber",
    itemType: "itemType",
    localData: [],
  },
};
