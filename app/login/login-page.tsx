/**
 * login/page.tsx — Rol Tabanlı Login Sayfası (TR/EN Dil Destekli)
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
  getUserProfile,
  UserRole,
  ROLE_CONFIG,
} from "../lib/roleManager";
import { useLanguage } from "../lib/i18n";
import { LanguageSwitcher } from "../lib/LanguageSwitcher";
import { CookieConsent } from "../lib/CookieConsent";

type LoginStep = "select_role" | "enter_credentials";

export default function LoginPage() {
  const router = useRouter();
  const { lang, setLang, t } = useLanguage();
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
    if (reason === "expired") setInfoMessage(t("login.expired"));
    else if (reason === "logged_out") setInfoMessage(t("login.loggedOut"));
    else if (reason === "no_role") setInfoMessage(t("login.noRole"));
    else if (reason === "role_mismatch") setInfoMessage(t("login.roleMismatch"));
  }, [t]);

  const roleLabels: Record<UserRole, { label: string; desc: string }> = {
    admin: { label: t("role.admin"), desc: t("role.admin.desc") },
    doctor: { label: t("role.doctor"), desc: t("role.doctor.desc") },
    nurse: { label: t("role.nurse"), desc: t("role.nurse.desc") },
    safety_expert: { label: t("role.safety_expert"), desc: t("role.safety_expert.desc") },
  };

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
      const cred = await signInWithEmailAndPassword(auth, email, password);
      const user = cred.user;

      const profile = await getUserProfile(user.uid);
      if (!profile) {
        await signOut(auth);
        setError(t("login.noProfile"));
        setLoading(false);
        return;
      }

      if (profile.role !== selectedRole) {
        await signOut(auth);
        setError(t("login.wrongRole", { role: roleLabels[profile.role].label }));
        setLoading(false);
        return;
      }

      router.push("/");
    } catch (err: any) {
      console.error("[Login] Error:", err);
      const msgs: Record<string, string> = {
        "auth/user-not-found": t("login.userNotFound"),
        "auth/wrong-password": t("login.wrongPassword"),
        "auth/invalid-email": t("login.invalidEmail"),
        "auth/too-many-requests": t("login.tooManyRequests"),
        "auth/invalid-credential": t("login.invalidCredential"),
        "permission-denied": t("login.permissionDenied"),
        "unavailable": t("login.unavailable"),
      };
      const errorCode = err.code?.replace("firestore/", "") || "";
      const friendlyMsg = msgs[errorCode] || msgs[err.code] || null;
      if (friendlyMsg) {
        setError(friendlyMsg);
      } else if (err.message?.includes("ERR_BLOCKED") || err.message?.includes("Failed to fetch")) {
        setError(t("login.blocked"));
      } else {
        setError(`${t("login.failed")}: ${err.message}`);
      }
    } finally {
      setLoading(false);
    }
  }

  const roleConfig = selectedRole ? ROLE_CONFIG[selectedRole] : null;

  return (
    <CookieConsent>
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
        {/* Dil değiştirici — sağ üst */}
        <div style={{ position: "absolute", top: 16, right: 20, zIndex: 10 }}>
          <LanguageSwitcher lang={lang} setLang={setLang} />
        </div>

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
              {lang === "tr" ? "İSG" : "OHS"} <span style={{ color: "#38bdf8" }}>{lang === "tr" ? "Otomasyon" : "Automation"}</span>
            </h1>
            <p style={{ fontSize: 14, color: "#64748b", marginTop: 4 }}>
              {t("app.subtitle")}
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
                {t("login.selectRole")}
              </p>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 16 }}>
                {(Object.entries(ROLE_CONFIG) as [UserRole, typeof ROLE_CONFIG["admin"]][])
                  .filter(([role]) => role !== "admin")
                  .map(([role, config]) => (
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
                      {roleLabels[role].label}
                    </div>
                    <div style={{ fontSize: 11, color: "#64748b", lineHeight: 1.4 }}>
                      {roleLabels[role].desc}
                    </div>
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
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 24 }}>
                <p style={{ fontSize: 11, color: "#334155" }}>
                  🔒 {t("login.singleDevice")}
                </p>
                <button
                  onClick={() => selectRole("admin")}
                  style={{
                    background: "none",
                    border: "1px solid #334155",
                    borderRadius: 8,
                    color: "#64748b",
                    fontSize: 12,
                    padding: "5px 14px",
                    cursor: "pointer",
                    transition: "all 0.2s",
                  }}
                  onMouseEnter={(e) => {
                    (e.currentTarget as HTMLElement).style.borderColor = "#8b5cf6";
                    (e.currentTarget as HTMLElement).style.color = "#a78bfa";
                  }}
                  onMouseLeave={(e) => {
                    (e.currentTarget as HTMLElement).style.borderColor = "#334155";
                    (e.currentTarget as HTMLElement).style.color = "#64748b";
                  }}
                >
                  🛡️ Admin
                </button>
              </div>
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
                  ← {t("back")}
                </button>
                <div style={{ display: "flex", alignItems: "center", gap: 8, flex: 1 }}>
                  <span style={{ fontSize: 24 }}>{roleConfig.icon}</span>
                  <div>
                    <div style={{ fontSize: 16, fontWeight: 700, color: "#f1f5f9" }}>
                      {roleLabels[selectedRole!].label} {t("role.login")}
                    </div>
                    <div style={{ fontSize: 11, color: "#64748b" }}>
                      {roleLabels[selectedRole!].desc}
                    </div>
                  </div>
                </div>
              </div>

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
                    {t("login.email")}
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
                    placeholder={t("login.emailPlaceholder")}
                  />
                </div>

                <div style={{ marginBottom: 24 }}>
                  <label style={{ display: "block", fontSize: 12, color: "#94a3b8", marginBottom: 6 }}>
                    {t("login.password")}
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
                    placeholder={t("login.passwordPlaceholder")}
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
                  {loading ? t("login.signingIn") : t("login.signIn")}
                </button>
              </form>
            </div>
          )}
        </div>
      </div>
    </CookieConsent>
  );
}
