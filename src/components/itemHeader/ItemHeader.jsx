import React from "react";
import "./ItemHeader.css";
import { useAuthContext } from "../../hooks/useAuthContext";

function ItemHeader({ deviceType, itemSerialNumber, handleSync, handleDelete, handleBack, handleRefresh, isRefreshing, primaryUser }) {
  const { isAdmin, isAdminPlus } = useAuthContext();

  const isStaffMember =
    deviceType === "Signed Staff" || deviceType === "Unsigned Staff";

  const canDelete = primaryUser === "None" || primaryUser === "none" || primaryUser === "" || primaryUser === null || primaryUser === undefined;

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
        <div className="LeftButtonGroup">
          <button className="BackButton" onClick={handleBack} title="Go back">
            Back
          </button>
          <button
            className="RefreshButton"
            onClick={handleRefresh}
            disabled={isRefreshing}
            title="Reload item data"
          >
            {isRefreshing ? "Refreshing…" : "Refresh"}
          </button>
        </div>

        <div className="ShowItemTitle">{formatTitle(deviceType)}</div>

        {(isAdminPlus || isAdmin) && !isStaffMember && (
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
      </div>

      {deviceType !== "Signed Staff" && deviceType !== "Unsigned Staff" && (
        <div className="ShowItemSubtitle">{itemSerialNumber}</div>
      )}
    </div>
  );
}

export default ItemHeader;
