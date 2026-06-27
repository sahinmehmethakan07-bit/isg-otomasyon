import React from "react";
import { formatDate } from "./dateUtils";

type TurkishDateInputProps = {
  value: string;
  onChange: (value: string) => void;
  styles: Record<string, React.CSSProperties>;
  readOnly?: boolean;
  placeholder?: string;
};

export function TurkishDateInput({
  value,
  onChange,
  styles,
  readOnly = false,
  placeholder = "Tarih seçin...",
}: TurkishDateInputProps) {
  return (
    <div style={{ position: "relative" }}>
      <div
        style={{
          ...styles.input,
          paddingRight: 44,
          cursor: readOnly ? "default" : "pointer",
          color: value ? "var(--isg-text)" : "var(--isg-text-muted)",
        }}
        className="isg-input"
        aria-hidden="true"
      >
        {value ? formatDate(value, "") : placeholder}
      </div>
      {!readOnly && (
        <input
          type="date"
          value={value}
          onChange={e => onChange(e.target.value)}
          style={{ position: "absolute", inset: 0, opacity: 0, cursor: "pointer" }}
          aria-label="Tarih seç"
        />
      )}
      <span style={{ position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)", pointerEvents: "none", color: "var(--isg-text-muted)" }}>📅</span>
    </div>
  );
}
