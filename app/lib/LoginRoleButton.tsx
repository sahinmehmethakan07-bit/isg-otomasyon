"use client";

import React, { useState } from "react";
import type { UserRole } from "./roleManager";

type LoginRoleButtonProps = {
  role: UserRole;
  icon: string;
  label: string;
  description: string;
  color: string;
  isMobile: boolean;
  onSelect: (role: UserRole) => void;
};

export function LoginRoleButton({
  role,
  icon,
  label,
  description,
  color,
  isMobile,
  onSelect,
}: LoginRoleButtonProps) {
  const [active, setActive] = useState(false);

  function handleClick() {
    if (active) return;
    setActive(true);
    window.setTimeout(() => onSelect(role), 1250);
  }

  return (
    <button
      type="button"
      className={`login-role-button ${active ? "active" : ""}`}
      onClick={handleClick}
      style={{
        "--role-color": color,
        "--role-glow": `${color}33`,
        minHeight: isMobile ? 82 : 176,
        padding: isMobile ? "16px 16px" : "28px 18px",
        textAlign: isMobile ? "left" : "center",
        display: isMobile ? "flex" : "block",
        alignItems: "center",
        gap: isMobile ? 12 : 0,
      } as React.CSSProperties}
      aria-label={`${label} girişi`}
    >
      <span className="login-role-content">
        <span className="login-role-icon" style={{ fontSize: isMobile ? 28 : 40, marginBottom: isMobile ? 0 : 12 }}>
          {icon}
        </span>
        <span className="login-role-copy">
          <span className="login-role-label">{label}</span>
          <span className="login-role-desc">{description}</span>
        </span>
      </span>

      <span className="login-role-scan" aria-hidden="true">
        <svg className="fingerprint fingerprint-out" viewBox="0 0 64 64">
          <path className="odd" d="M19 39c0-9 5-16 13-16s13 7 13 16" />
          <path className="even" d="M23 42c0-7 3-12 9-12s9 5 9 12" />
          <path className="odd" d="M27 45c0-5 1-8 5-8s5 3 5 8" />
          <path className="even" d="M16 32c2-10 8-16 16-16s14 6 16 16" />
          <path className="odd" d="M12 39c0-14 8-26 20-26s20 12 20 26" />
        </svg>
        <svg className="fingerprint fingerprint-active" viewBox="0 0 64 64">
          <path className="odd" d="M19 39c0-9 5-16 13-16s13 7 13 16" />
          <path className="even" d="M23 42c0-7 3-12 9-12s9 5 9 12" />
          <path className="odd" d="M27 45c0-5 1-8 5-8s5 3 5 8" />
          <path className="even" d="M16 32c2-10 8-16 16-16s14 6 16 16" />
          <path className="odd" d="M12 39c0-14 8-26 20-26s20 12 20 26" />
        </svg>
        <svg className="login-role-ok" viewBox="0 0 64 64">
          <path d="M18 33.5 27.5 43 47 21" />
        </svg>
      </span>
      <span className="login-role-underline" />
    </button>
  );
}
