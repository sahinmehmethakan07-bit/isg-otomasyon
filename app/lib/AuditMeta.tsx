import React from "react";
import { ROLE_CONFIG, type AuditMetadata, type UserRole } from "./roleManager";

function toDate(value: any): Date | null {
  if (!value) return null;
  if (value instanceof Date) return value;
  if (typeof value?.toDate === "function") return value.toDate();
  if (typeof value === "string" || typeof value === "number") {
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? null : date;
  }
  return null;
}

function formatAuditDate(value: any) {
  const date = toDate(value);
  if (!date) return "";
  return new Intl.DateTimeFormat("tr-TR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

function roleLabel(role?: string) {
  if (!role) return "";
  return ROLE_CONFIG[role as UserRole]?.label || role;
}

function shortUser(uid?: string) {
  if (!uid) return "";
  return uid.length > 10 ? `${uid.slice(0, 6)}...${uid.slice(-4)}` : uid;
}

export function AuditMeta({ record }: { record: AuditMetadata }) {
  const updatedDate = formatAuditDate(record.updatedAt);
  const createdDate = formatAuditDate(record.createdAt);
  const updated = record.updatedBy
    ? `Güncelleyen: ${roleLabel(String(record.updatedAsRole || "")) || "Rol yok"} · ${shortUser(record.updatedBy)}${updatedDate ? ` · ${updatedDate}` : ""}`
    : "";
  const created = record.createdBy
    ? `Oluşturan: ${roleLabel(String(record.createdAsRole || "")) || "Rol yok"} · ${shortUser(record.createdBy)}${createdDate ? ` · ${createdDate}` : ""}`
    : "";

  const text = updated || created;
  if (!text) return null;

  return (
    <div style={{ fontSize: 11, color: "var(--isg-text-subtle)", marginTop: 6 }}>
      {text}
    </div>
  );
}
