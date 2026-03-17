import React from "react";

export default function Toggle({ icon, label, value, setValue, disabled = false }) {
  return (
    <>
      {icon}
      <span className="deviceLabel">{label}</span>

      <div
        onClick={() => {
          if (!disabled) setValue(!value);
        }}
        className={`toggle ${value ? "toggleOn" : ""} ${disabled ? "toggleDisabled" : ""}`}
        role="switch"
        aria-checked={value}
        tabIndex={disabled ? -1 : 0}
        onKeyDown={(e) => {
          if (!disabled && (e.key === "Enter" || e.key === " ")) setValue(!value);
        }}
      >
        <div className="toggleKnob" />
      </div>
    </>
  );
}


