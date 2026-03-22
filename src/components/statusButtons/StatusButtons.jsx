import React from "react";
import "./StatusButtons.css";

const default_statuses = [
  "In Use",
  "Spare",
  "Damaged Possibly Repairable",
  "Damaged Beyond Repair",
  "Lost",
];

const computer_statuses = [
  "Fully Functional",
  "Damaged Possibly Repairable",
  "Damaged Beyond Repair",
  "Lost",
];

const isStaffComputer = (itemType) =>
  itemType === "Staff laptop" || itemType === "Staff computer" || itemType === "Radio" || itemType === "Mobile phone";

const mapStatusForDisplay = (status, itemType) => {
  if (!isStaffComputer(itemType)) return status;
  return status === "In Use" || status === "Spare" ? "Fully Functional" : status;
};

const mapStatusForStorage = (status, itemType, primaryUser) => {
  if (!isStaffComputer(itemType)) return status;
  if (status === "Fully Functional") return primaryUser ? "In Use" : "Spare";
  return status;
};

const StatusButtons = ({
  deviceStatus,
  onStatusChange,   // ✅ use this
  disabled,
  itemType,
  primaryUser,
}) => {
  const buttons_to_map = isStaffComputer(itemType)
    ? computer_statuses
    : default_statuses;

  const displayStatus = mapStatusForDisplay(deviceStatus, itemType);

  return (
    <div className="IsWorkingButtons">
      {buttons_to_map.map((s) => (
        <button
          key={s}
          className={`IsWorkingButton ${displayStatus === s ? "selected" : ""}`}
          onClick={() => onStatusChange(mapStatusForStorage(s, itemType, primaryUser))}
          disabled={disabled}
          type="button"
        >
          {s}
        </button>
      ))}
    </div>
  );
};

export default StatusButtons;