import React from "react";
import "./ItemHeader.css";
import { useAuthContext } from "../../hooks/useAuthContext";

function ItemHeader({ deviceType, itemSerialNumber, handleSync, handleDelete, primaryUser }) {
  const { isAdmin, isAdminPlus } = useAuthContext();

  const isSyncType =
    deviceType === "Signed Staff" ||
    deviceType === "Unsigned Staff" ||
    deviceType === "Staff Laptop";

  // 🛑 Only allow delete if primaryUser is None or none
  const canDelete = primaryUser === "None" || primaryUser === "none" || primaryUser === "" || primaryUser === null || primaryUser === undefined ;

  const formatTitle = (text) => {
  if (!text) return "";

  return text
    .toLowerCase()
    .replace(/_/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());
};

  return (
    <div className="ShowItemHeader">
      <div className="TitleRow">
        <div className="ShowItemTitle">{formatTitle(deviceType)}</div>

        {(isAdminPlus || isAdmin)  && (
          <>
            {isSyncType ? (
              <button onClick={handleSync}>Sync With Microsoft</button>
            ) : (
              <button
                className="DeleteButton"
                onClick={handleDelete}
                disabled={!canDelete}
                style={{
                  backgroundColor: canDelete ? "#b91c1c" : "#9ca3af",
                  color: "white",
                  cursor: canDelete ? "pointer" : "not-allowed",
                }}
                title={
                  canDelete
                    ? "Delete this item"
                    : "Cannot delete — item still assigned to a user"
                }
              >
                Delete
              </button>
            )}
          </>
        )}
      </div>

      {deviceType !== "Signed Staff" && deviceType !== "Unsigned Staff" && (
        <div className="ShowItemSubtitle">{itemSerialNumber}</div>
      )}
    </div>
  );
}

export default ItemHeader;
