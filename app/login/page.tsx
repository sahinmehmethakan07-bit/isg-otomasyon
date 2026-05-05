/**
 * login/page.tsx — Rol Tabanlı Login Sayfası
 *
 * Üç ayrı giriş kartı:
 * - 🩺 Doktor Girişi
 * - 💉 Hemşire Girişi
 * - 🛡️ Admin Girişi
 *
 * Akış:
 * 1. Kullanıcı rol kartını seçer
 * 2. Email/şifre girer
 * 3. Firebase Auth doğrular
 * 4. Firestore'dan kullanıcı profili çekilir
 * 5. Profildeki rol, seçilen rolle eşleşmezse → hata
 * 6. Session oluşturulur → dashboard'a yönlendirilir
 */

"use client";

import React, { useState, useEffect } from "react";
import {
  signInWithEmailAndPassword,
  signOut,
} from "firebase/auth";
import { auth } from "../../lib/firebase";
import { useRouter } from "next/navigation";
import {
  checkExistingSession,
  createSession,
} from "../lib/sessionManager";
import {
  getUserProfile,
  UserRole,
  ROLE_CONFIG,
} from "../lib/roleManager";

type LoginStep = "select_role" | "enter_credentials";

export default function LoginPage() {
  const router = useRouter();
  const [step, setStep] = useState<LoginStep>("select_role");
  const [selectedRole, setSelectedRole] = useState<UserRole | null>(null);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [infoMessage, setInfoMessage] = useState<string | null>(null);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const reason = params.get("reason");
    if (reason === "expired") setInfoMessage("Oturum süreniz doldu. Lütfen tekrar giriş yapın.");
    else if (reason === "logged_out") setInfoMessage("Başarıyla çıkış yaptınız.");
    else if (reason === "no_role") setInfoMessage("Hesabınıza bir rol atanmamış. Lütfen admin ile iletişime geçin.");
    else if (reason === "role_mismatch") setInfoMessage("Seçtiğiniz rol ile hesabınız uyuşmuyor.");
  }, []);

  function selectRole(role: UserRole) {
    setSelectedRole(role);
    setStep("enter_credentials");
    setError("");
    setInfoMessage(null);
  }

  function goBack() {
    setStep("select_role");
    setSelectedRole(null);
    setEmail("");
    setPassword("");
    setError("");
  }

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedRole) return;
    setError("");
    setLoading(true);

    try {
      // 1. Firebase Auth
      const cred = await signInWithEmailAndPassword(auth, email, password);
      const user = cred.user;

      // 2. Profil kontrolü
      const profile = await getUserProfile(user.uid);
      if (!profile) {
        await signOut(auth);
        setError("Hesabınıza henüz rol atanmamış. Lütfen admin ile iletişime geçin.");
        setLoading(false);
        return;
      }

      // 3. Rol eşleşmesi (çoklu rol desteği)
      const userRoles = profile.roles || [profile.role];
      if (!userRoles.includes(selectedRole)) {
        await signOut(auth);
        const allowedLabels = userRoles.map((r: any) => (ROLE_CONFIG as any)[r]?.label).join(", ");
        setError(`Bu hesap sadece "${allowedLabels}" olarak kayıtlı. Lütfen doğru girişi seçin.`);
        setLoading(false);
        return;
      }
      profile.activeRole = selectedRole;

      // 4. Tek oturum kontrolü
      const sessionCheck = await checkExistingSession(user.uid);
      if (sessionCheck.blocked) {
        await signOut(auth);
        setError(sessionCheck.reason || "Bu hesap başka bir cihazda aktif.");
        setLoading(false);
        return;
      }

      // 5. Session oluştur
      await createSession(user.uid);

      // 6. Dashboard'a yönlendir
      router.push("/");
    } catch (err: any) {
      const msgs: Record<string, string> = {
        "auth/user-not-found": "Bu e-posta adresiyle kayıtlı kullanıcı bulunamadı.",
        "auth/wrong-password": "Şifre hatalı.",
        "auth/invalid-email": "Geçersiz e-posta adresi.",
        "auth/too-many-requests": "Çok fazla başarısız deneme. Lütfen biraz bekleyin.",
        "auth/invalid-credential": "E-posta veya şifre hatalı.",
      };
      setError(msgs[err.code] || `Giriş başarısız: ${err.message}`);
    } finally {
      setLoading(false);
    }
  }

  const roleConfig = selectedRole ? ROLE_CONFIG[selectedRole] : null;

  return (
    <div style={{
      minHeight: "100vh",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: "#0a0e1a",
      fontFamily: "'IBM Plex Sans', system-ui, sans-serif",
      position: "relative",
      overflow: "hidden",
    }}>
      {/* Arka plan efekti */}
      <div style={{
        position: "absolute",
        top: "-50%",
        left: "-50%",
        width: "200%",
        height: "200%",
        background: "radial-gradient(ellipse at 30% 20%, rgba(14, 165, 233, 0.06) 0%, transparent 50%), radial-gradient(ellipse at 70% 80%, rgba(139, 92, 246, 0.04) 0%, transparent 50%)",
        pointerEvents: "none",
      }} />

      <div style={{ position: "relative", zIndex: 1, width: "100%", maxWidth: step === "select_role" ? 680 : 420, padding: "0 20px" }}>
        {/* Logo */}
        <div style={{ textAlign: "center", marginBottom: 32 }}>
          <span style={{ fontSize: 44 }}>🦺</span>
          <h1 style={{ fontSize: 24, fontWeight: 700, color: "#f1f5f9", marginTop: 8, letterSpacing: "-0.02em" }}>
            İSG <span style={{ color: "#38bdf8" }}>Otomasyon</span>
          </h1>
          <p style={{ fontSize: 14, color: "#64748b", marginTop: 4 }}>
            İş Sağlığı ve Güvenliği Yönetim Sistemi
          </p>
        </div>

        {/* Bilgi mesajı */}
        {infoMessage && (
          <div style={{
            backgroundColor: "#0ea5e911",
            border: "1px solid #0ea5e933",
            borderRadius: 10,
            padding: "12px 16px",
            marginBottom: 20,
            fontSize: 13,
            color: "#7dd3fc",
            textAlign: "center",
          }}>
            {infoMessage}
          </div>
        )}

        {/* ── ADIM 1: Rol Seçimi ── */}
        {step === "select_role" && (
          <div>
            <p style={{ textAlign: "center", fontSize: 15, color: "#94a3b8", marginBottom: 24 }}>
              Giriş türünüzü seçin
            </p>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 16 }}>
              {(Object.entries(ROLE_CONFIG).filter(([role]) => role !== "admin") as [UserRole, typeof ROLE_CONFIG["admin"]][]).map(([role, config]) => (
                <button
                  key={role}
                  onClick={() => selectRole(role)}
                  style={{
                    backgroundColor: "#111827",
                    border: "1px solid #1e293b",
                    borderRadius: 16,
                    padding: "32px 20px",
                    cursor: "pointer",
                    transition: "all 0.2s ease",
                    textAlign: "center",
                    position: "relative",
                    overflow: "hidden",
                  }}
                  onMouseEnter={(e) => {
                    (e.currentTarget as HTMLElement).style.borderColor = config.color;
                    (e.currentTarget as HTMLElement).style.transform = "translateY(-4px)";
                    (e.currentTarget as HTMLElement).style.boxShadow = `0 12px 40px ${config.color}22`;
                  }}
                  onMouseLeave={(e) => {
                    (e.currentTarget as HTMLElement).style.borderColor = "#1e293b";
                    (e.currentTarget as HTMLElement).style.transform = "translateY(0)";
                    (e.currentTarget as HTMLElement).style.boxShadow = "none";
                  }}
                >
                  <div style={{ fontSize: 40, marginBottom: 12 }}>{config.icon}</div>
                  <div style={{ fontSize: 16, fontWeight: 700, color: "#f1f5f9", marginBottom: 6 }}>
                    {config.label}
                  </div>
                  <div style={{ fontSize: 11, color: "#64748b", lineHeight: 1.4 }}>
                    {config.description}
                  </div>
                  {/* Alt çizgi */}
                  <div style={{
                    position: "absolute",
                    bottom: 0,
                    left: "20%",
                    right: "20%",
                    height: 3,
                    backgroundColor: config.color,
                    borderRadius: "3px 3px 0 0",
                    opacity: 0.6,
                  }} />
                </button>
              ))}
            </div>
            <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 24 }}>
              <button
                onClick={() => selectRole("admin")}
                style={{
                  backgroundColor: "transparent",
                  border: "1px solid #1e293b",
                  borderRadius: 8,
                  padding: "8px 16px",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  gap: 6,
                  fontSize: 12,
                  color: "#64748b",
                }}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLElement).style.borderColor = "#8b5cf6";
                  (e.currentTarget as HTMLElement).style.color = "#8b5cf6";
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLElement).style.borderColor = "#1e293b";
                  (e.currentTarget as HTMLElement).style.color = "#64748b";
                }}
              >
                🛡️ Admin Girişi
              </button>
            </div>
            <p style={{ textAlign: "center", fontSize: 11, color: "#334155", marginTop: 12 }}>
              🔒 Her hesap aynı anda sadece 1 cihazdan kullanılabilir
            </p>
          </div>
        )}

        {/* ── ADIM 2: Giriş Formu ── */}
        {step === "enter_credentials" && roleConfig && (
          <div style={{
            backgroundColor: "#111827",
            border: `1px solid ${roleConfig.color}33`,
            borderRadius: 16,
            padding: 32,
          }}>
            {/* Geri butonu + Rol başlığı */}
            <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 24 }}>
              <button
                onClick={goBack}
                style={{
                  backgroundColor: "transparent",
                  border: "1px solid #1e293b",
                  borderRadius: 8,
                  color: "#94a3b8",
                  padding: "6px 12px",
                  fontSize: 13,
                  cursor: "pointer",
                }}
              >
                ← Geri
              </button>
              <div style={{ display: "flex", alignItems: "center", gap: 8, flex: 1 }}>
                <span style={{ fontSize: 24 }}>{roleConfig.icon}</span>
                <div>
                  <div style={{ fontSize: 16, fontWeight: 700, color: "#f1f5f9" }}>
                    {roleConfig.label} Girişi
                  </div>
                  <div style={{ fontSize: 11, color: "#64748b" }}>
                    {roleConfig.description}
                  </div>
                </div>
              </div>
            </div>

            {/* Hata */}
            {error && (
              <div style={{
                backgroundColor: "#dc262615",
                border: "1px solid #dc262633",
                borderRadius: 10,
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
                  autoFocus
                  style={{
                    width: "100%",
                    backgroundColor: "#0a0e1a",
                    border: "1px solid #1e293b",
                    borderRadius: 8,
                    color: "#f1f5f9",
                    padding: "12px 14px",
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
                    backgroundColor: "#0a0e1a",
                    border: "1px solid #1e293b",
                    borderRadius: 8,
                    color: "#f1f5f9",
                    padding: "12px 14px",
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
                  backgroundColor: loading ? `${roleConfig.color}88` : roleConfig.color,
                  color: "#fff",
                  border: "none",
                  borderRadius: 10,
                  padding: "13px 0",
                  fontSize: 14,
                  fontWeight: 600,
                  cursor: loading ? "not-allowed" : "pointer",
                  transition: "opacity 0.2s",
                }}
              >
                {loading ? "Giriş yapılıyor..." : "Giriş Yap"}
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}
