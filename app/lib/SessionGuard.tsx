/**
 * SessionGuard.tsx — Dashboard'u saran koruma bileşeni
 * 
 * Kullanım:
 *   <SessionGuard>
 *     <div>...mevcut page içeriği...</div>
 *   </SessionGuard>
 */

"use client";

import React from "react";
import { useSessionGuard } from "./useSessionGuard";

export function SessionGuard({ children }: { children: React.ReactNode }) {
  const { status } = useSessionGuard();

  if (status === "checking") {
    return (
      <div style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        flexDirection: "column",
        gap: 16,
        backgroundColor: "#0f172a",
        color: "#94a3b8",
        fontFamily: "'IBM Plex Sans', system-ui, sans-serif",
      }}>
        <div style={{ fontSize: 32 }}>🦺</div>
        <div style={{ fontSize: 14 }}>Oturum doğrulanıyor...</div>
      </div>
    );
  }

  if (status === "expired") {
    return (
      <div style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: "#0f172a",
        fontFamily: "'IBM Plex Sans', system-ui, sans-serif",
      }}>
        <div style={{
          backgroundColor: "#1e293b",
          border: "1px solid #d9770644",
          borderRadius: 16,
          padding: "40px 32px",
          maxWidth: 420,
          textAlign: "center",
        }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>⏰</div>
          <h2 style={{ fontSize: 18, fontWeight: 700, color: "#f1f5f9", marginBottom: 12 }}>
            Oturum Süresi Doldu
          </h2>
          <p style={{ fontSize: 14, color: "#94a3b8", lineHeight: 1.6 }}>
            12 saatlik oturum süreniz doldu. Giriş sayfasına yönlendiriliyorsunuz...
          </p>
        </div>
      </div>
    );
  }

  if (status === "invalid") return null;

  return <>{children}</>;
}
