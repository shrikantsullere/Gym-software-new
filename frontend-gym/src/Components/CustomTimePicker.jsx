import React, { forwardRef } from "react";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { format, parse } from "date-fns";

const CustomTimePicker = forwardRef(({ value, onChange, name, className, disabled, required, placeholder }, ref) => {
  // Parse "HH:mm" to Date object
  let selectedDate = null;
  if (value) {
    try {
      selectedDate = parse(value, "HH:mm", new Date());
    } catch (e) {
      console.warn("Invalid time format passed to CustomTimePicker:", value);
    }
  }

  const handleChange = (date) => {
    if (onChange) {
      // Format back to "HH:mm" for internal state consistency (mimicking native input type="time")
      const timeString = date ? format(date, "HH:mm") : "";
      onChange({
        target: {
          name: name,
          value: timeString,
        },
      });
    }
  };

  return (
    <DatePicker
      selected={selectedDate}
      onChange={handleChange}
      showTimeSelect
      showTimeSelectOnly
      timeIntervals={15}
      timeCaption="Time"
      dateFormat="h:mm aa" // Displays in 12-hour format for user
      className={className}
      disabled={disabled}
      required={required}
      placeholderText={placeholder || "Select Time"}
      ref={ref}
    />
  );
});

CustomTimePicker.displayName = "CustomTimePicker";

export default CustomTimePicker;
