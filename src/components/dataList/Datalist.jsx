// DatalistInput.jsx
import React, { useId, useMemo } from "react";

/**
 * Reusable datalist-backed input.
 *
 * Props:
 * - value: string
 * - onChange: (newValue: string) => void
 * - options: string[]
 * - placeholder?: string
 * - disabled?: boolean
 * - className?: string
 * - listId?: string (optional override)
 * - name?: string (optional)
 * - onKeyDown?: (e) => void
 * - onBlur?: (e) => void
 */
export default function DataList({
  value,
  onChange,
  options = [],
  placeholder = "",
  disabled = false,
  className = "",
  listId,
  name,
  onKeyDown,
  onBlur,
}) {
  const autoId = useId();
  const resolvedListId = listId || `datalist-${autoId}`;

  const safeOptions = useMemo(() => {
    // Deduplicate + remove falsy
    const set = new Set((options || []).filter(Boolean));
    return Array.from(set);
  }, [options]);

  return (
    <>
      <input
        className={className}
        list={resolvedListId}
        value={value}
        name={name}
        placeholder={placeholder}
        disabled={disabled}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={onKeyDown}
        onBlur={onBlur}
        autoComplete="off"
      />
      <datalist id={resolvedListId}>
        {safeOptions.map((opt) => (
          <option key={opt} value={opt} />
        ))}
      </datalist>
    </>
  );
}
