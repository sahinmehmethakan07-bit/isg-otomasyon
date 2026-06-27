"use client";

import React, { useEffect, useId, useRef, useState } from "react";
import { formatDateShort, formatDateWithWeekday, parseDisplayDate } from "./dateUtils";

type TarihSeciciProps = {
  value: Date | null;
  onChange: (date: Date | null) => void;
  label?: string;
  required?: boolean;
  minDate?: Date;
  maxDate?: Date;
  allowFuture?: boolean;
  error?: string;
  placeholder?: string;
  disabled?: boolean;
};

type IsoTarihSeciciProps = Omit<TarihSeciciProps, "value" | "onChange"> & {
  value: string;
  onChange: (value: string) => void;
  styles?: Record<string, React.CSSProperties>;
};

const MONTHS = [
  "Ocak",
  "Şubat",
  "Mart",
  "Nisan",
  "Mayıs",
  "Haziran",
  "Temmuz",
  "Ağustos",
  "Eylül",
  "Ekim",
  "Kasım",
  "Aralık",
];

const WEEKDAYS = ["Pzt", "Sal", "Çar", "Per", "Cum", "Cmt", "Paz"];

function startOfDay(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

function sameDay(a: Date | null, b: Date | null) {
  return !!a && !!b && a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}

function clampDate(date: Date, minDate?: Date, maxDate?: Date) {
  const time = startOfDay(date).getTime();
  if (minDate && time < startOfDay(minDate).getTime()) return false;
  if (maxDate && time > startOfDay(maxDate).getTime()) return false;
  return true;
}

export function dateToIso(date: Date | null) {
  if (!date) return "";
  return [
    String(date.getFullYear()),
    String(date.getMonth() + 1).padStart(2, "0"),
    String(date.getDate()).padStart(2, "0"),
  ].join("-");
}

export function isoToDate(value: string) {
  return parseDisplayDate(value);
}

export function TarihSecici({
  value,
  onChange,
  label,
  required,
  minDate,
  maxDate,
  allowFuture = false,
  error,
  placeholder = "GG.AA.YYYY",
  disabled = false,
}: TarihSeciciProps) {
  const today = startOfDay(new Date());
  const effectiveMaxDate = maxDate || (allowFuture ? undefined : today);
  const initial = value || today;
  const [open, setOpen] = useState(false);
  const [viewYear, setViewYear] = useState(initial.getFullYear());
  const [viewMonth, setViewMonth] = useState(initial.getMonth());
  const wrapperRef = useRef<HTMLDivElement>(null);
  const labelId = useId();

  useEffect(() => {
    if (!value) return;
    setViewYear(value.getFullYear());
    setViewMonth(value.getMonth());
  }, [value]);

  useEffect(() => {
    if (!open) return;
    const close = (event: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) setOpen(false);
    };
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", close);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", close);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
  const firstDay = (new Date(viewYear, viewMonth, 1).getDay() + 6) % 7;
  const selected = value ? startOfDay(value) : null;

  function selectDay(day: number) {
    const next = new Date(viewYear, viewMonth, day, 12);
    if (!clampDate(next, minDate, effectiveMaxDate)) return;
    onChange(next);
    setOpen(false);
  }

  function moveMonth(delta: number) {
    const next = new Date(viewYear, viewMonth + delta, 1);
    setViewYear(next.getFullYear());
    setViewMonth(next.getMonth());
  }

  const displayText = value ? formatDateShort(value, "") : placeholder;
  const accessibleDateText = value ? formatDateWithWeekday(value, "") : placeholder;
  const labelText = label ? `${label}${required ? " *" : ""}` : undefined;

  return (
    <div ref={wrapperRef} lang="tr" style={{ position: "relative", width: "100%" }}>
      {labelText && <label id={labelId} style={{ display: "block", fontSize: 13, fontWeight: 700, color: "var(--isg-text-muted)", marginBottom: 8 }}>{labelText}</label>}
      <button
        type="button"
        aria-labelledby={label ? labelId : undefined}
        aria-label={label ? undefined : accessibleDateText}
        aria-haspopup="dialog"
        aria-expanded={open}
        disabled={disabled}
        onClick={() => !disabled && setOpen(prev => !prev)}
        title={accessibleDateText}
        style={{
          alignItems: "center",
          background: disabled ? "#F8FAFC" : "var(--isg-input-bg)",
          border: `1.5px solid ${error ? "#EF4444" : "#CBD5E1"}`,
          borderRadius: 8,
          boxShadow: error ? "0 0 0 3px rgba(239,68,68,0.15)" : "none",
          color: value ? "var(--isg-text)" : "var(--isg-text-muted)",
          cursor: disabled ? "not-allowed" : "pointer",
          display: "flex",
          font: "inherit",
          fontSize: 14,
          justifyContent: "space-between",
          minHeight: 44,
          padding: "0 12px",
          textAlign: "left",
          width: "100%",
        }}
        onFocus={event => {
          event.currentTarget.style.borderColor = error ? "#EF4444" : "#3B82F6";
          event.currentTarget.style.boxShadow = error ? "0 0 0 3px rgba(239,68,68,0.15)" : "0 0 0 3px rgba(59,130,246,0.15)";
        }}
        onBlur={event => {
          event.currentTarget.style.borderColor = error ? "#EF4444" : "#CBD5E1";
          event.currentTarget.style.boxShadow = error ? "0 0 0 3px rgba(239,68,68,0.15)" : "none";
        }}
      >
        <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{displayText}</span>
        <span aria-hidden="true" style={{ color: "var(--isg-text-muted)", marginLeft: 10 }}>📅</span>
      </button>
      {value && !disabled && (
        <button
          type="button"
          aria-label="Tarihi temizle"
          onClick={() => onChange(null)}
          style={{
            alignItems: "center",
            background: "transparent",
            border: 0,
            color: "var(--isg-text-muted)",
            cursor: "pointer",
            display: "flex",
            fontSize: 18,
            height: 36,
            justifyContent: "center",
            position: "absolute",
            right: 34,
            top: labelText ? 31 : 4,
            width: 36,
          }}
        >
          ×
        </button>
      )}
      {error && <div style={{ color: "#EF4444", fontSize: 12, fontWeight: 700, marginTop: 6 }}>{error}</div>}
      {open && (
        <div
          role="dialog"
          aria-label="Tarih seçici"
          style={{
            background: "var(--isg-card)",
            border: "1px solid #E2E8F0",
            borderRadius: 12,
            boxShadow: "0 10px 40px rgba(0,0,0,0.12)",
            color: "var(--isg-text)",
            left: 0,
            padding: 12,
            position: "absolute",
            top: "calc(100% + 6px)",
            width: 292,
            zIndex: 1000,
          }}
        >
          <div style={{ alignItems: "center", display: "flex", justifyContent: "space-between", marginBottom: 12 }}>
            <button type="button" aria-label="Önceki ay" onClick={() => moveMonth(-1)} style={navButtonStyle}>‹</button>
            <div style={{ color: "#1E293B", fontWeight: 600 }}>
              {MONTHS[viewMonth]} {viewYear}
            </div>
            <button type="button" aria-label="Sonraki ay" onClick={() => moveMonth(1)} style={navButtonStyle}>›</button>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 4, marginBottom: 6 }}>
            {WEEKDAYS.map(day => (
              <div key={day} style={{ color: "var(--isg-text-muted)", fontSize: 11, fontWeight: 700, textAlign: "center" }}>{day}</div>
            ))}
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 4 }}>
            {Array.from({ length: firstDay }).map((_, index) => <span key={`empty-${index}`} />)}
            {Array.from({ length: daysInMonth }, (_, index) => index + 1).map(day => {
              const date = new Date(viewYear, viewMonth, day, 12);
              const isSelected = sameDay(selected, date);
              const isToday = sameDay(today, date);
              const disabledDay = !clampDate(date, minDate, effectiveMaxDate);
              return (
                <button
                  key={day}
                  type="button"
                  disabled={disabledDay}
                  onClick={() => selectDay(day)}
                  style={{
                    alignItems: "center",
                    background: isSelected ? "#3B82F6" : isToday ? "var(--isg-today-bg)" : "transparent",
                    border: isToday && !isSelected ? "1px solid #3B82F6" : "1px solid transparent",
                    borderRadius: "50%",
                    color: isSelected ? "#FFFFFF" : disabledDay ? "var(--isg-text-subtle)" : "var(--isg-text)",
                    cursor: disabledDay ? "not-allowed" : "pointer",
                    display: "flex",
                    fontWeight: isSelected || isToday ? 800 : 600,
                    height: 34,
                    justifyContent: "center",
                    opacity: disabledDay ? 0.45 : 1,
                    width: 34,
                  }}
                  onMouseEnter={event => {
                    if (!isSelected && !disabledDay) event.currentTarget.style.background = "#EFF6FF";
                  }}
                  onMouseLeave={event => {
                    if (!isSelected) event.currentTarget.style.background = isToday ? "var(--isg-today-bg)" : "transparent";
                  }}
                >
                  {day}
                </button>
              );
            })}
          </div>
          <button
            type="button"
            onClick={() => {
              onChange(today);
              setViewYear(today.getFullYear());
              setViewMonth(today.getMonth());
              setOpen(false);
            }}
            style={{
              background: "transparent",
              border: "1px solid #3B82F6",
              borderRadius: 8,
              color: "#3B82F6",
              cursor: "pointer",
              fontWeight: 800,
              marginTop: 12,
              minHeight: 38,
              width: "100%",
            }}
          >
            Bugün
          </button>
        </div>
      )}
    </div>
  );
}

const navButtonStyle: React.CSSProperties = {
  alignItems: "center",
  background: "var(--isg-btn-secondary)",
  border: "1px solid var(--isg-border)",
  borderRadius: 8,
  color: "var(--isg-text)",
  cursor: "pointer",
  display: "flex",
  fontSize: 20,
  fontWeight: 800,
  height: 34,
  justifyContent: "center",
  width: 34,
};

export function IsoTarihSecici({ value, onChange, ...props }: IsoTarihSeciciProps) {
  return (
    <TarihSecici
      {...props}
      value={isoToDate(value)}
      onChange={date => onChange(dateToIso(date))}
    />
  );
}
