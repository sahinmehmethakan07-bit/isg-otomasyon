"use client";

import { useEffect } from "react";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[ISG] Sayfa hatası:", error);
  }, [error]);

  function clearAndLogin() {
    localStorage.removeItem("isg_activeRole");
    window.location.href = "/login?reason=reload";
  }

  return (
    <main
      style={{
        minHeight: "100vh",
        display: "grid",
        placeItems: "center",
        padding: 24,
        background: "linear-gradient(135deg, #F8F7F4 0%, #F1EEE8 48%, #F8F7F4 100%)",
        color: "#1A1A1A",
        fontFamily: "var(--isg-font-sans)",
      }}
    >
      <section
        style={{
          width: "min(560px, 100%)",
          border: "1px solid rgba(255,255,255,0.12)",
          borderRadius: 12,
          padding: 24,
          background: "rgba(20,24,32,0.88)",
          boxShadow: "0 24px 80px rgba(0,0,0,0.45)",
        }}
      >
        <div style={{ fontSize: 32, marginBottom: 12 }}>⚠️</div>
        <h1 style={{ margin: "0 0 8px", fontSize: 24 }}>Sayfa güvenli moda alındı</h1>
        <p style={{ margin: "0 0 18px", color: "#6B7280", lineHeight: 1.55 }}>
          Oturum veya rol bilgisi çakıştığı için ekran açılmadı. Yeniden deneyebilir ya da giriş ekranına dönüp temiz oturum açabilirsiniz.
        </p>
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
          <button
            type="button"
            onClick={reset}
            style={{
              border: "1px solid rgba(255,255,255,0.14)",
              borderRadius: 8,
              background: "#242832",
              color: "#1A1A1A",
              padding: "10px 14px",
              fontWeight: 700,
              cursor: "pointer",
            }}
          >
            Tekrar Dene
          </button>
          <button
            type="button"
            onClick={clearAndLogin}
            style={{
              border: "1px solid rgba(76,201,166,0.4)",
              borderRadius: 8,
              background: "#2D6A4F",
              color: "#07110f",
              padding: "10px 14px",
              fontWeight: 800,
              cursor: "pointer",
            }}
          >
            Temiz Giriş Yap
          </button>
        </div>
      </section>
    </main>
  );
}
