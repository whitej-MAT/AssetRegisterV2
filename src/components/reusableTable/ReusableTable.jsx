// ReusableTable.jsx
import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { HEADER_TO_FIELD } from "../../utils/helpers";
import "./ReusableTable.css";

export default function ReusableTable({
  tableRows = [],
  tableHeadings = [],
  globalSearch = "",
  onVisibleRowCountChange = null,
}) {
  const navigate = useNavigate();
  const [selectedRows, setSelectedRows] = useState(() => new Set());
  const [sortCol, setSortCol] = useState(null);
  const [sortDir, setSortDir] = useState("asc");
  const [copiedCell, setCopiedCell] = useState(null);

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
    if (!row) return;

    if (row.contractSigned === "Unsigned Staff" || row.contractSigned === "Signed Staff") {
      const staffId = row.SK ? row.SK.split("#").filter(Boolean).pop() : undefined;
      navigate(`/ShowItem/${row.contractSigned}/${staffId}`);
      return;
    }

    if (row.deviceType && row.serialNumber) {
      navigate(`/ShowItem/${row.deviceType}/${row.serialNumber}`);
      return;
    }
    if (row.deviceType && row.phoneNumber) {
      navigate(`/ShowItem/${row.deviceType}/${row.phoneNumber}`);
    }
  };

  const handleCellClick = (e, value, rowIdx, colIdx) => {
    e.stopPropagation();
    const text = String(value === "—" ? "" : value ?? "");
    if (!text) return;
    navigator.clipboard.writeText(text).then(() => {
      setCopiedCell(`${rowIdx}-${colIdx}`);
      setTimeout(() => setCopiedCell(null), 1000);
    });
  };

  const handleHeaderClick = (colIdx) => {
    if (sortCol === colIdx) {
      if (sortDir === "asc") {
        setSortDir("desc");
      } else {
        setSortCol(null);
        setSortDir("asc");
      }
    } else {
      setSortCol(colIdx);
      setSortDir("asc");
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

  const sortedRows = useMemo(() => {
    if (sortCol === null) return filteredRows;
    const col = columns[sortCol];
    if (!col) return filteredRows;

    return [...filteredRows].sort((a, b) => {
      const av = String(getValueForColumn(a, col) ?? "");
      const bv = String(getValueForColumn(b, col) ?? "");

      const an = parseFloat(av);
      const bn = parseFloat(bv);
      const bothNumeric = !isNaN(an) && !isNaN(bn);

      const cmp = bothNumeric ? an - bn : av.localeCompare(bv);
      return sortDir === "asc" ? cmp : -cmp;
    });
  }, [filteredRows, sortCol, sortDir, columns]);

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
              <th
                key={idx}
                className="sortable-header"
                onClick={() => handleHeaderClick(idx)}
                title="Click to sort"
              >
                <span>{col.headingLabel}</span>
                <span className="sort-indicator">
                  {sortCol === idx ? (sortDir === "asc" ? " ▲" : " ▼") : " ⇅"}
                </span>
              </th>
            ))}
          </tr>
        </thead>

        <tbody>
          {sortedRows.length === 0 ? (
            <tr>
              <td
                colSpan={columns.length + 1}
                style={{ textAlign: "center", padding: "1rem" }}
              >
                No data to display
              </td>
            </tr>
          ) : (
            sortedRows.map((row, rowIdx) => (
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

                {columns.map((col, colIdx) => {
                  const value = getValueForColumn(row, col);
                  const isCopied = copiedCell === `${rowIdx}-${colIdx}`;
                  return (
                    <td
                      key={colIdx}
                      className={isCopied ? "cell-copied" : ""}
                    >
                      <span
                        onClick={(e) => handleCellClick(e, value, rowIdx, colIdx)}
                        title="Click to copy"
                        style={{ cursor: "copy" }}
                      >
                        {isCopied ? "Copied!" : value}
                      </span>
                    </td>
                  );
                })}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}
