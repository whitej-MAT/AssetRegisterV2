// ReusableTable.jsx
import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import "./ReusableTable.css";

/**
 * Map API "tableHeaders" labels -> actual row object keys.
 * Add/edit as your API evolves.
 */
const HEADER_TO_FIELD = {
  "Asset tag": "assetTag",
  "Serial number": "serialNumber",
  "Device status": "deviceStatus",
  "Most recent note": "mostRecentNote",
  "Damage date": "damageDate", // change if backend uses a different key
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

export default function ReusableTable({
  tableRows = [],
  tableHeadings = [],
  globalSearch = "",
  onVisibleRowCountChange = null,
}) {
  const navigate = useNavigate();
  const [selectedRows, setSelectedRows] = useState(() => new Set());

  useEffect(() => {
    setSelectedRows(new Set());
  }, [tableRows, tableHeadings]);

  const columns = useMemo(() => {
    return (tableHeadings || []).map((headingLabel) => ({
      headingLabel,
      fieldKey: HEADER_TO_FIELD[headingLabel] ?? null,
    }));
  }, [tableHeadings]);

  const getValueForColumn = (row, col) => {
    if (!row) return "—";
    if (col.fieldKey) return row?.[col.fieldKey] ?? "—";

    const guessedKey = String(col.headingLabel)
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, "")
      .split(/\s+/)
      .map((w, i) => (i === 0 ? w : w.charAt(0).toUpperCase() + w.slice(1)))
      .join("");

    return row?.[guessedKey] ?? "—";
  };

  const getRowId = (row, index) => {
    if (!row) return String(index);
    if (row.serialNumber != null) return `serial:${row.serialNumber}`;
    if (row.id != null) return `id:${row.id}`;
    if (row.SK != null) return `sk:${row.SK}`;
    return String(index);
  };

  const isRowSelected = (row, index) => selectedRows.has(getRowId(row, index));

  const toggleRow = (row, index) => {
    const id = getRowId(row, index);
    setSelectedRows((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const handleRowClick = (row) => {
    console.log("Row clicked:", row);
    if (!row) return;

    // STAFF
    if (row.contractSigned === "Unsigned Staff") {
      navigate(`/ShowItem/Unsigned Staff/${row.id}`);
      return;
    }
    if (row.contractSigned === "Signed Staff") {
      navigate(`/ShowItem/Signed Staff/${row.id}`);
      return;
    }

    // DEVICES / ASSETS
    if (row.deviceType && row.serialNumber || row.phoneNumber) {
      if (row.deviceType && row.serialNumber) {
        navigate(`/ShowItem/${row.deviceType}/${row.serialNumber}`);
        return;
      }
      else if (row.deviceType && row.phoneNumber) {
        navigate(`/ShowItem/${row.deviceType}/${row.phoneNumber}`);
        return;
      }
      return;
    }
  };

  const filteredRows = useMemo(() => {
    const needle = (globalSearch || "").trim().toLowerCase();
    if (!needle) return tableRows;

    const hasCols = columns.length > 0;

    return (tableRows || []).filter((row) => {
      if (!row) return false;

      if (hasCols) {
        return columns.some((col) =>
          String(getValueForColumn(row, col)).toLowerCase().includes(needle)
        );
      }

      return Object.values(row).some((v) =>
        String(v ?? "").toLowerCase().includes(needle)
      );
    });
  }, [tableRows, globalSearch, columns]);

  useEffect(() => {
  onVisibleRowCountChange?.(filteredRows.length);
}, [filteredRows, onVisibleRowCountChange]);
  return (
    <div className="TableWrapper">
      <table className="ScrollableTable">
        <thead>
          <tr>
            <th style={{ width: 40 }}></th>
            {columns.map((col, idx) => (
              <th key={idx}>{col.headingLabel}</th>
            ))}
          </tr>
        </thead>

        <tbody>
          {filteredRows.length === 0 ? (
            <tr>
              <td
                colSpan={columns.length + 1}
                style={{ textAlign: "center", padding: "1rem" }}
              >
                No data to display
              </td>
            </tr>
          ) : (
            filteredRows.map((row, rowIdx) => (
              <tr
                key={getRowId(row, rowIdx)}
                onClick={() => handleRowClick(row)}
                className={isRowSelected(row, rowIdx) ? "row-selected" : ""}
              >
                <td onClick={(e) => e.stopPropagation()}>
                  <input
                    type="checkbox"
                    checked={isRowSelected(row, rowIdx)}
                    onChange={() => toggleRow(row, rowIdx)}
                    style={{ accentColor: "#8c2c24" }}
                  />
                </td>

                {columns.map((col, colIdx) => (
                  <td key={colIdx}>{getValueForColumn(row, col)}</td>
                ))}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}
