"use client";

import { useState } from "react";
import { signInWithEmailAndPassword } from "firebase/auth";
import { auth } from "../../lib/firebase";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function handleLogin() {
    if (!email || !password) return;
    setLoading(true);
    setError("");
    try {
      await signInWithEmailAndPassword(auth, email, password);
      router.push("/");
    } catch (e: any) {
      setError("E-posta veya şifre hatalı.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{
      minHeight: "100vh",
      backgroundColor: "#0f172a",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      fontFamily: "'IBM Plex Sans', system-ui, sans-serif",
    }}>
      <div style={{
        backgroundColor: "#1e293b",
        border: "1px solid #334155",
        borderRadius: 12,
        padding: 40,
        width: 360,
      }}>
        {/* Logo */}
        <div style={{ textAlign: "center", marginBottom: 32 }}>
          <div style={{ fontSize: 36, marginBottom: 8 }}>🦺</div>
          <div style={{ fontWeight: 700, fontSize: 20, color: "#f1f5f9" }}>
            İSG <span style={{ color: "#38bdf8" }}>Otomasyon</span>
          </div>
          <div style={{ fontSize: 13, color: "#64748b", marginTop: 4 }}>
            Yönetim Paneli
          </div>
        </div>

        {/* Form */}
        <div style={{ marginBottom: 12 }}>
          <label style={{ fontSize: 12, color: "#94a3b8", marginBottom: 4, display: "block" }}>
            E-posta
          </label>
          <input
            type="email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            onKeyDown={e => e.key === "Enter" && handleLogin()}
            placeholder="ornek@mail.com"
            style={{
              width: "100%",
              backgroundColor: "#0f172a",
              border: "1px solid #334155",
              borderRadius: 6,
              color: "#e2e8f0",
              padding: "10px 12px",
              fontSize: 14,
              outline: "none",
              boxSizing: "border-box",
            }}
          />
        </div>

        <div style={{ marginBottom: 20 }}>
          <label style={{ fontSize: 12, color: "#94a3b8", marginBottom: 4, display: "block" }}>
            Şifre
          </label>
          <input
            type="password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            onKeyDown={e => e.key === "Enter" && handleLogin()}
            placeholder="••••••••"
            style={{
              width: "100%",
              backgroundColor: "#0f172a",
              border: "1px solid #334155",
              borderRadius: 6,
              color: "#e2e8f0",
              padding: "10px 12px",
              fontSize: 14,
              outline: "none",
              boxSizing: "border-box",
            }}
          />
        </div>

        {error && (
          <div style={{
            backgroundColor: "#dc262622",
            border: "1px solid #dc262644",
            borderRadius: 6,
            padding: "8px 12px",
            color: "#fca5a5",
            fontSize: 13,
            marginBottom: 16,
          }}>
            {error}
          </div>
        )}

        <button
          onClick={handleLogin}
          disabled={loading}
          style={{
            width: "100%",
            backgroundColor: loading ? "#0369a1" : "#0ea5e9",
            color: "#fff",
            border: "none",
            borderRadius: 6,
            padding: "11px",
            fontSize: 14,
            fontWeight: 600,
            cursor: loading ? "not-allowed" : "pointer",
            transition: "background 0.2s",
          }}
        >
          {loading ? "Giriş yapılıyor..." : "Giriş Yap"}
        </button>
      </div>
    </div>
  );
}
