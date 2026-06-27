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
        backgroundColor: "#F8F7F4",
        color: "#6B7280",
        fontFamily: "var(--isg-font-sans)",
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
        backgroundColor: "#F8F7F4",
        fontFamily: "var(--isg-font-sans)",
      }}>
        <div style={{
          backgroundColor: "#FFFFFF",
          border: "1px solid #D4A01744",
          borderRadius: 16,
          padding: "40px 32px",
          maxWidth: 420,
          textAlign: "center",
        }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>⏰</div>
          <h2 style={{ fontSize: 18, fontWeight: 700, color: "#1A1A1A", marginBottom: 12 }}>
            Oturum Süresi Doldu
          </h2>
          <p style={{ fontSize: 14, color: "#6B7280", lineHeight: 1.6 }}>
            12 saatlik oturum süreniz doldu. Giriş sayfasına yönlendiriliyorsunuz...
          </p>
        </div>
      </div>
    );
  }

  if (status === "invalid") return null;

  return <>{children}</>;
}
