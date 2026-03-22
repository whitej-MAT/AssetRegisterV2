// SelectInput.jsx
import React from "react";

/**
 * Reusable select dropdown component
 *
 * Props:
 * - value: string
 * - onChange: (value: string) => void
 * - options: array of { value: string, label: string }
 * - disabled?: boolean
 * - className?: string
 * - placeholder?: string (optional first disabled option)
 * - name?: string
 */
export default function DropDownBox({
  value,
  onChange,
  options = [],
  disabled = false,
  className = "",
  placeholder,
  name,
}) {
  return (
    <select
      className={className}
      value={value}
      name={name}
      disabled={disabled}
      onChange={(e) => onChange(e.target.value)}
    >
      {placeholder && (
        <option value="" disabled>
          {placeholder}
        </option>
      )}

      {options.map((opt) => (
        <option key={opt.value} value={opt.value}>
          {opt.label}
        </option>
      ))}
    </select>
  );
}
