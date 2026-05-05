/**
 * login/page.tsx — Login Sayfası (İlk Giriş Kazanır)
 * 
 * Akış:
 * 1. Firebase Auth ile email/şifre doğrula
 * 2. checkExistingSession() → aktif oturum var mı bak
 * 3. Varsa → GİRİŞİ REDDET, hata mesajı göster
 * 4. Yoksa → createSession() ile oturum aç, dashboard'a yönlendir
 */

"use client";

import React, { useState, useEffect } from "react";
import {
  signInWithEmailAndPassword,
  signOut,
} from "firebase/auth";
import { auth } from "../../lib/firebase";
import { useRouter } from "next/navigation";
import { checkExistingSession, createSession } from "../lib/sessionManager";

export default function LoginPage() {
  const router = useRouter();
  
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [infoMessage, setInfoMessage] = useState<string | null>(null);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const reason = params.get("reason");
    if (reason === "expired") {
      setInfoMessage("Oturum süreniz doldu. Lütfen tekrar giriş yapın.");
    } else if (reason === "logged_out") {
      setInfoMessage("Başarıyla çıkış yaptınız.");
    }
  }, []);

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setInfoMessage(null);
    setLoading(true);

    try {
      // 1. Firebase Auth ile doğrula
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      // 2. Aktif oturum var mı kontrol et
      const sessionCheck = await checkExistingSession(user.uid);

      if (sessionCheck.blocked) {
        // 3. AKTİF OTURUM VAR → girişi reddet
        // Firebase Auth oturumunu da kapat (çünkü signIn zaten çağrıldı)
        await signOut(auth);
        setError(sessionCheck.reason || "Bu hesap başka bir cihazda aktif.");
        setLoading(false);
        return;
      }

      // 4. Oturum yok → yeni oturum oluştur
      await createSession(user.uid);

      // 5. Dashboard'a yönlendir
      router.push("/dashboard");
    } catch (err: any) {
      console.error("Login error:", err);

      const errorMessages: Record<string, string> = {
        "auth/user-not-found": "Bu e-posta adresiyle kayıtlı kullanıcı bulunamadı.",
        "auth/wrong-password": "Şifre hatalı.",
        "auth/invalid-email": "Geçersiz e-posta adresi.",
        "auth/too-many-requests": "Çok fazla başarısız deneme. Lütfen biraz bekleyin.",
        "auth/invalid-credential": "E-posta veya şifre hatalı.",
      };

      setError(errorMessages[err.code] || `Giriş başarısız: ${err.message}`);
    } finally {
      setLoading(false);
    }
  }

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
        border: "1px solid #334155",
        borderRadius: 12,
        padding: 32,
        width: "100%",
        maxWidth: 400,
      }}>
        <div style={{ textAlign: "center", marginBottom: 24 }}>
          <span style={{ fontSize: 36 }}>🦺</span>
          <h1 style={{ fontSize: 20, fontWeight: 700, color: "#f1f5f9", marginTop: 8 }}>
            İSG <span style={{ color: "#38bdf8" }}>Otomasyon</span>
          </h1>
          <p style={{ fontSize: 13, color: "#94a3b8", marginTop: 4 }}>Sisteme giriş yapın</p>
        </div>

        {infoMessage && (
          <div style={{
            backgroundColor: "#0ea5e922",
            border: "1px solid #0ea5e944",
            borderRadius: 8,
            padding: "10px 14px",
            marginBottom: 16,
            fontSize: 13,
            color: "#7dd3fc",
            lineHeight: 1.5,
          }}>
            {infoMessage}
          </div>
        )}

        {error && (
          <div style={{
            backgroundColor: "#dc262622",
            border: "1px solid #dc262644",
            borderRadius: 8,
            padding: "10px 14px",
            marginBottom: 16,
            fontSize: 13,
            color: "#fca5a5",
            lineHeight: 1.5,
          }}>
            {error}
          </div>
        )}

        <form onSubmit={handleLogin}>
          <div style={{ marginBottom: 16 }}>
            <label style={{ display: "block", fontSize: 12, color: "#94a3b8", marginBottom: 6 }}>
              E-posta
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              style={{
                width: "100%",
                backgroundColor: "#0f172a",
                border: "1px solid #334155",
                borderRadius: 6,
                color: "#f1f5f9",
                padding: "10px 14px",
                fontSize: 14,
                outline: "none",
                boxSizing: "border-box",
              }}
              placeholder="ornek@firma.com"
            />
          </div>

          <div style={{ marginBottom: 24 }}>
            <label style={{ display: "block", fontSize: 12, color: "#94a3b8", marginBottom: 6 }}>
              Şifre
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              style={{
                width: "100%",
                backgroundColor: "#0f172a",
                border: "1px solid #334155",
                borderRadius: 6,
                color: "#f1f5f9",
                padding: "10px 14px",
                fontSize: 14,
                outline: "none",
                boxSizing: "border-box",
              }}
              placeholder="••••••••"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            style={{
              width: "100%",
              backgroundColor: loading ? "#0369a1" : "#0ea5e9",
              color: "#fff",
              border: "none",
              borderRadius: 8,
              padding: "12px 0",
              fontSize: 14,
              fontWeight: 600,
              cursor: loading ? "not-allowed" : "pointer",
              opacity: loading ? 0.7 : 1,
            }}
          >
            {loading ? "Giriş yapılıyor..." : "Giriş Yap"}
          </button>
        </form>

        <p style={{ textAlign: "center", fontSize: 11, color: "#475569", marginTop: 20 }}>
          🔒 Her hesap aynı anda sadece 1 cihazdan kullanılabilir.
        </p>
      </div>
    </div>
  );
}
