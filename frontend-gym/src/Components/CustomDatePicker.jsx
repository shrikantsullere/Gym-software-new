import React, { useState, useEffect, useRef } from "react";
import { Calendar, ChevronLeft, ChevronRight } from "lucide-react";

const CustomDatePicker = ({
  value,
  onChange,
  label,
  required = false,
  placeholder = "Select Date",
  minYear = 1940,
  maxYear = 2035,
  className = "",
  disabled = false
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [view, setView] = useState("days"); // 'days' | 'years'

  // Parse current selected date (YYYY-MM-DD format)
  const parseDate = (val) => {
    if (!val) return new Date();
    const parts = String(val).split("T")[0].split("-");
    if (parts.length === 3) {
      const y = parseInt(parts[0], 10);
      const m = parseInt(parts[1], 10) - 1;
      const d = parseInt(parts[2], 10);
      if (!isNaN(y) && !isNaN(m) && !isNaN(d)) {
        return new Date(y, m, d);
      }
    }
    const parsed = new Date(val);
    return isNaN(parsed.getTime()) ? new Date() : parsed;
  };

  const selectedDate = value ? parseDate(value) : null;

  // Viewing state (Month & Year)
  const [currentYear, setCurrentYear] = useState(
    selectedDate ? selectedDate.getFullYear() : new Date().getFullYear()
  );
  const [currentMonth, setCurrentMonth] = useState(
    selectedDate ? selectedDate.getMonth() : new Date().getMonth()
  );

  const containerRef = useRef(null);

  useEffect(() => {
    if (value) {
      const d = parseDate(value);
      setCurrentYear(d.getFullYear());
      setCurrentMonth(d.getMonth());
    }
  }, [value]);

  // Close popup when clicking outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setIsOpen(false);
        setView("days");
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const monthNames = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];

  const daysOfWeek = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];

  // Generate Year Array (minYear to maxYear, descending)
  const years = [];
  for (let y = maxYear; y >= minYear; y--) {
    years.push(y);
  }

  // Days in current month
  const getDaysInMonth = (year, month) => {
    return new Date(year, month + 1, 0).getDate();
  };

  // First day index of month (0 = Sunday)
  const getFirstDayOfMonth = (year, month) => {
    return new Date(year, month, 1).getDay();
  };

  const handleDateClick = (day) => {
    const mStr = String(currentMonth + 1).padStart(2, "0");
    const dStr = String(day).padStart(2, "0");
    const formatted = `${currentYear}-${mStr}-${dStr}`;
    onChange(formatted);
    setIsOpen(false);
    setView("days");
  };

  const handleYearSelect = (y) => {
    setCurrentYear(y);
    setView("days");
  };

  const prevMonth = () => {
    if (currentMonth === 0) {
      setCurrentMonth(11);
      setCurrentYear(prev => prev - 1);
    } else {
      setCurrentMonth(prev => prev - 1);
    }
  };

  const nextMonth = () => {
    if (currentMonth === 11) {
      setCurrentMonth(0);
      setCurrentYear(prev => prev + 1);
    } else {
      setCurrentMonth(prev => prev + 1);
    }
  };

  // Format value for display (DD/MM/YYYY)
  const displayValue = value
    ? (() => {
        const d = parseDate(value);
        const day = String(d.getDate()).padStart(2, "0");
        const month = String(d.getMonth() + 1).padStart(2, "0");
        const yr = d.getFullYear();
        return `${day}/${month}/${yr}`;
      })()
    : "";

  const daysInMonthCount = getDaysInMonth(currentYear, currentMonth);
  const firstDayIndex = getFirstDayOfMonth(currentYear, currentMonth);

  return (
    <div className="position-relative w-100" ref={containerRef}>
      {label && (
        <label className="form-label fw-medium mb-1">
          {label} {required && <span className="text-danger">*</span>}
        </label>
      )}

      {/* Input Group */}
      <div className="input-group">
        <input
          type="text"
          className={`form-control ${className}`}
          placeholder={placeholder || "DD/MM/YYYY"}
          value={displayValue}
          onClick={() => !disabled && setIsOpen(!isOpen)}
          readOnly
          disabled={disabled}
          style={{ cursor: disabled ? "not-allowed" : "pointer", backgroundColor: "#fff" }}
        />
        <button
          type="button"
          className="btn btn-outline-secondary d-flex align-items-center justify-content-center"
          onClick={() => !disabled && setIsOpen(!isOpen)}
          disabled={disabled}
        >
          <Calendar size={18} />
        </button>
      </div>

      {/* Calendar Popup */}
      {isOpen && (
        <div
          className="card border-0 shadow-lg position-absolute mt-1"
          style={{
            zIndex: 1060,
            top: "100%",
            left: 0,
            width: "300px",
            borderRadius: "12px",
            overflow: "hidden",
            backgroundColor: "#ffffff",
          }}
        >
          {/* Header */}
          <div className="card-header bg-primary text-white p-2 d-flex align-items-center justify-content-between">
            <button
              type="button"
              className="btn btn-sm text-white p-1"
              onClick={prevMonth}
              title="Previous Month"
            >
              <ChevronLeft size={20} />
            </button>

            <div className="d-flex align-items-center gap-1">
              {/* Month Dropdown */}
              <select
                className="form-select form-select-sm bg-white text-dark border-0 fw-bold"
                style={{ cursor: "pointer", width: "auto", fontSize: "13px", paddingRight: "20px" }}
                value={currentMonth}
                onChange={(e) => setCurrentMonth(parseInt(e.target.value, 10))}
              >
                {monthNames.map((m, idx) => (
                  <option key={m} value={idx}>
                    {m}
                  </option>
                ))}
              </select>

              {/* Direct Select Year Dropdown (Option 1) */}
              <select
                className="form-select form-select-sm bg-white text-dark border-0 fw-bold"
                style={{ cursor: "pointer", width: "auto", fontSize: "13px", paddingRight: "20px" }}
                value={currentYear}
                onChange={(e) => setCurrentYear(parseInt(e.target.value, 10))}
              >
                {years.map((y) => (
                  <option key={y} value={y}>
                    {y}
                  </option>
                ))}
              </select>
            </div>

            <button
              type="button"
              className="btn btn-sm text-white p-1"
              onClick={nextMonth}
              title="Next Month"
            >
              <ChevronRight size={20} />
            </button>
          </div>

          {/* Body */}
          <div className="card-body p-2">
            {/* View Mode Toggle Bar */}
            <div className="d-flex justify-content-center gap-2 mb-2">
              <button
                type="button"
                className={`btn btn-xs ${view === "days" ? "btn-primary" : "btn-light text-dark"}`}
                style={{ fontSize: "12px", padding: "2px 10px", borderRadius: "15px" }}
                onClick={() => setView("days")}
              >
                Calendar
              </button>
              <button
                type="button"
                className={`btn btn-xs ${view === "years" ? "btn-primary" : "btn-light text-dark"}`}
                style={{ fontSize: "12px", padding: "2px 10px", borderRadius: "15px" }}
                onClick={() => setView("years")}
              >
                Year Grid
              </button>
            </div>

            {/* YEAR GRID VIEW (Option 2) */}
            {view === "years" && (
              <div
                style={{
                  maxHeight: "180px",
                  overflowY: "auto",
                  display: "grid",
                  gridTemplateColumns: "repeat(3, 1fr)",
                  gap: "6px",
                  padding: "4px",
                }}
              >
                {years.map((y) => (
                  <button
                    key={y}
                    type="button"
                    className={`btn btn-sm ${
                      y === currentYear ? "btn-primary" : "btn-outline-secondary"
                    }`}
                    style={{ fontSize: "13px", padding: "6px 0", borderRadius: "6px" }}
                    onClick={() => handleYearSelect(y)}
                  >
                    {y}
                  </button>
                ))}
              </div>
            )}

            {/* DAYS CALENDAR VIEW */}
            {view === "days" && (
              <>
                {/* Day Labels */}
                <div className="d-grid text-center text-muted fw-semibold mb-1" style={{ gridTemplateColumns: "repeat(7, 1fr)", fontSize: "12px" }}>
                  {daysOfWeek.map((day) => (
                    <div key={day} className="py-1">{day}</div>
                  ))}
                </div>

                {/* Days Grid */}
                <div className="d-grid text-center" style={{ gridTemplateColumns: "repeat(7, 1fr)", gap: "2px" }}>
                  {/* Empty slots for first week */}
                  {Array.from({ length: firstDayIndex }).map((_, i) => (
                    <div key={`empty-${i}`} />
                  ))}

                  {/* Day Buttons */}
                  {Array.from({ length: daysInMonthCount }).map((_, i) => {
                    const day = i + 1;
                    const isSelected =
                      selectedDate &&
                      selectedDate.getFullYear() === currentYear &&
                      selectedDate.getMonth() === currentMonth &&
                      selectedDate.getDate() === day;

                    const isToday =
                      new Date().getFullYear() === currentYear &&
                      new Date().getMonth() === currentMonth &&
                      new Date().getDate() === day;

                    return (
                      <button
                        key={day}
                        type="button"
                        className={`btn btn-sm p-0 rounded-circle ${
                          isSelected
                            ? "btn-primary text-white"
                            : isToday
                            ? "btn-outline-primary fw-bold"
                            : "btn-light text-dark"
                        }`}
                        style={{
                          width: "32px",
                          height: "32px",
                          lineHeight: "32px",
                          margin: "auto",
                          fontSize: "13px",
                        }}
                        onClick={() => handleDateClick(day)}
                      >
                        {day}
                      </button>
                    );
                  })}
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default CustomDatePicker;
