import React, { useState, useEffect } from "react";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import "./CustomDatePicker.css";

const CustomDatePicker = ({
  value,
  onChange,
  label,
  required = false,
  placeholder = "DD/MM/YYYY",
  minYear = 1940,
  maxYear = 2035,
  className = "",
  disabled = false
}) => {
  const [selectedDate, setSelectedDate] = useState(null);

  // Parse incoming YYYY-MM-DD string value
  useEffect(() => {
    if (value) {
      const datePart = String(value).split("T")[0]; // handle ISO strings or YYYY-MM-DD
      const parts = datePart.split("-");
      if (parts.length === 3) {
        const y = parseInt(parts[0], 10);
        const m = parseInt(parts[1], 10) - 1;
        const d = parseInt(parts[2], 10);
        const parsedDate = new Date(y, m, d);
        if (!isNaN(parsedDate.getTime())) {
          setSelectedDate(parsedDate);
          return;
        }
      }
      // Fallback
      const parsed = new Date(value);
      if (!isNaN(parsed.getTime())) {
        setSelectedDate(parsed);
      } else {
        setSelectedDate(null);
      }
    } else {
      setSelectedDate(null);
    }
  }, [value]);

  const handleChange = (date) => {
    setSelectedDate(date);
    if (date) {
      const y = date.getFullYear();
      const m = String(date.getMonth() + 1).padStart(2, "0");
      const d = String(date.getDate()).padStart(2, "0");
      const formatted = `${y}-${m}-${d}`;
      onChange(formatted);
    } else {
      onChange("");
    }
  };

  return (
    <div className="w-100 custom-datepicker-container">
      {label && (
        <label className="form-label fw-medium mb-1">
          {label} {required && <span className="text-danger">*</span>}
        </label>
      )}
      <div className="position-relative">
        <DatePicker
          selected={selectedDate}
          onChange={handleChange}
          disabled={disabled}
          placeholderText={placeholder}
          dateFormat="dd/MM/yyyy"
          className={`form-control bg-white ${className}`}
          showMonthDropdown
          showYearDropdown
          dropdownMode="select"
          minDate={new Date(minYear, 0, 1)}
          maxDate={new Date(maxYear, 11, 31)}
          isClearable={!required && !disabled}
          wrapperClassName="w-100"
        />
        {/* Calendar Icon for visual enhancement */}
        <span 
          className="position-absolute" 
          style={{ 
            right: '12px', 
            top: '50%', 
            transform: 'translateY(-50%)', 
            pointerEvents: 'none',
            color: '#6c757d'
          }}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
            <line x1="16" y1="2" x2="16" y2="6"></line>
            <line x1="8" y1="2" x2="8" y2="6"></line>
            <line x1="3" y1="10" x2="21" y2="10"></line>
          </svg>
        </span>
      </div>
    </div>
  );
};

export default CustomDatePicker;
