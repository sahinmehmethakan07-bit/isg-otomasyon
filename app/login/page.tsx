"use client";

import React, { useEffect, useState } from "react";
import { signInWithEmailAndPassword, signOut } from "firebase/auth";
import { doc, updateDoc } from "firebase/firestore";
import { useRouter } from "next/navigation";
import { auth, db } from "../../lib/firebase";
import { CookieConsent } from "../lib/CookieConsent";
import { useLanguage } from "../lib/i18n";
import { getUserProfile, ROLE_CONFIG, UserRole } from "../lib/roleManager";

type LoginStep = "select_role" | "enter_credentials";

const AUTH_ERRORS = {
  wrongCredentials: "E-posta veya şifre hatalı. Lütfen bilgilerinizi kontrol edin.",
  accountLocked: "Hesabınız geçici olarak kilitlendi. 15 dakika sonra tekrar deneyin.",
  emptyField: "Bu alan zorunludur.",
  network: "Bağlantı hatası. İnternet bağlantınızı kontrol edin.",
  sessionExpired: "Oturumunuz sona erdi. Lütfen tekrar giriş yapın.",
};

function EyeIcon({ visible }: { visible: boolean }) {
  return (
    <svg className="isg-login-eye" width="20" height="20" viewBox="0 0 24 24" aria-hidden="true">
      {visible ? (
        <>
          <path d="M3.6 12s3-5.2 8.4-5.2S20.4 12 20.4 12s-3 5.2-8.4 5.2S3.6 12 3.6 12Z" fill="none" stroke="currentColor" strokeWidth="1.8" />
          <circle cx="12" cy="12" r="2.5" fill="none" stroke="currentColor" strokeWidth="1.8" />
        </>
      ) : (
        <>
          <path d="M4 4l16 16" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
          <path d="M8.6 8.1A7.8 7.8 0 0 1 12 7c5.4 0 8.4 5 8.4 5a13.2 13.2 0 0 1-2.5 3" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
          <path d="M14.2 14.4A3 3 0 0 1 9.7 10" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
          <path d="M6.7 10.2A13.8 13.8 0 0 0 3.6 12s3 5 8.4 5c1.2 0 2.3-.25 3.2-.67" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
        </>
      )}
    </svg>
  );
}

function FloatingField({
  error,
  label,
  onChange,
  type,
  value,
  autoComplete,
  autoFocus,
  children,
}: {
  error?: string;
  label: string;
  onChange: (value: string) => void;
  type: string;
  value: string;
  autoComplete?: string;
  autoFocus?: boolean;
  children?: React.ReactNode;
}) {
  return (
    <label className={`isg-floating-field${error ? " has-error" : ""}`}>
      <input
        autoComplete={autoComplete}
        autoFocus={autoFocus}
        className="isg-login-input"
        onChange={event => onChange(event.target.value)}
        placeholder=" "
        type={type}
        value={value}
      />
      <span>{label}</span>
      {children}
      {error && <small>{error}</small>}
    </label>
  );
}

export default function LoginPage() {
  const router = useRouter();
  const { t } = useLanguage();
  const [step, setStep] = useState<LoginStep>("select_role");
  const [selectedRole, setSelectedRole] = useState<UserRole | null>(null);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [fieldErrors, setFieldErrors] = useState<{ email?: string; password?: string }>({});
  const [loading, setLoading] = useState(false);
  const [infoMessage, setInfoMessage] = useState<string | null>(null);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const reason = params.get("reason");
    if (reason === "expired") setInfoMessage(AUTH_ERRORS.sessionExpired);
    else if (reason === "logged_out") setInfoMessage(t("login.loggedOut"));
    else if (reason === "no_role") setInfoMessage(t("login.noRole"));
    else if (reason === "role_mismatch") setInfoMessage(t("login.roleMismatch"));
  }, [t]);

  const roleLabels: Record<UserRole, { label: string; desc: string }> = {
    admin: { label: t("role.admin"), desc: t("role.admin.desc") },
    doctor: { label: t("role.doctor"), desc: t("role.doctor.desc") },
    nurse: { label: t("role.nurse"), desc: t("role.nurse.desc") },
    safety_expert: { label: t("role.safety_expert"), desc: t("role.safety_expert.desc") },
    human_resources: { label: t("role.human_resources"), desc: t("role.human_resources.desc") },
  };

  function clearMessages() {
    setError("");
    setInfoMessage(null);
    setFieldErrors({});
  }

  function selectRole(role: UserRole) {
    setSelectedRole(role);
    setStep("enter_credentials");
    clearMessages();
  }

  function goBack() {
    setStep("select_role");
    setSelectedRole(null);
    setEmail("");
    setPassword("");
    clearMessages();
  }

  function updateEmail(value: string) {
    setEmail(value);
    clearMessages();
  }

  function updatePassword(value: string) {
    setPassword(value);
    clearMessages();
  }

  function mapAuthError(err: any) {
    const code = err?.code?.replace("firestore/", "") || "";
    if (code === "auth/too-many-requests") return AUTH_ERRORS.accountLocked;
    if (code === "unavailable" || code === "auth/network-request-failed") return AUTH_ERRORS.network;
    if (err?.message?.includes("ERR_BLOCKED") || err?.message?.includes("Failed to fetch")) return AUTH_ERRORS.network;
    return AUTH_ERRORS.wrongCredentials;
  }

  async function handleLogin(event: React.FormEvent) {
    event.preventDefault();
    if (!selectedRole) return;

    const nextFieldErrors: { email?: string; password?: string } = {};
    if (!email.trim()) nextFieldErrors.email = AUTH_ERRORS.emptyField;
    if (!password.trim()) nextFieldErrors.password = AUTH_ERRORS.emptyField;
    if (nextFieldErrors.email || nextFieldErrors.password) {
      setFieldErrors(nextFieldErrors);
      setError("");
      return;
    }

    setError("");
    setLoading(true);

    try {
      const cred = await signInWithEmailAndPassword(auth, email, password);
      const user = cred.user;
      const profile = await getUserProfile(user.uid);

      if (!profile) {
        await signOut(auth);
        setError(AUTH_ERRORS.wrongCredentials);
        setLoading(false);
        return;
      }

      const allowedRoles = profile.roles?.length ? profile.roles : [profile.role];
      if (!allowedRoles.includes(selectedRole)) {
        await signOut(auth);
        setError(AUTH_ERRORS.wrongCredentials);
        setLoading(false);
        return;
      }

      localStorage.setItem("isg_activeRole", selectedRole);
      await updateDoc(doc(db, "users", user.uid), { activeRole: selectedRole });
      router.push("/");
    } catch (err: any) {
      console.error("[Login] Error:", err);
      setError(mapAuthError(err));
    } finally {
      setLoading(false);
    }
  }

  const roleConfig = selectedRole ? ROLE_CONFIG[selectedRole] : null;
  const roleEntries = (Object.entries(ROLE_CONFIG) as [UserRole, typeof ROLE_CONFIG["admin"]][]);

  return (
    <CookieConsent>
      <main className="isg-login-page">
        <section className="isg-login-brand" aria-label="İSG Otomasyon tanıtım">
          <svg className="isg-login-pattern" viewBox="0 0 760 760" aria-hidden="true">
            <path d="M92 119h156l78 135-78 135H92L14 254 92 119Z" />
            <path d="M422 70h178l89 154-89 154H422l-89-154 89-154Z" />
            <path d="M255 360h210l105 182-105 182H255L150 542 255 360Z" />
            <path d="M573 410h126l63 109-63 109H573l-63-109 63-109Z" />
            <path d="M58 542h122l61 106-61 106H58L-3 648 58 542Z" />
          </svg>
          <div className="isg-login-brand-copy">
            <p>İSG Otomasyon</p>
            <h1>Güvenli iş ortamları için akıllı yönetim.</h1>
          </div>
        </section>

        <section className="isg-login-panel">
          <div className="isg-login-card">
            <div className="isg-login-heading">
              <p>Giriş Yap</p>
              <h2>İSG yönetim panelinize hoş geldiniz.</h2>
            </div>

            {infoMessage && (
              <div className="isg-login-info">
                {infoMessage}
              </div>
            )}

            {step === "select_role" && (
              <div className="isg-role-step">
                <div className="isg-role-intro">Devam etmek için rolünüzü seçin.</div>
                <div className="isg-role-grid">
                  {roleEntries.map(([role, config]) => (
                    <button
                      key={role}
                      className="isg-role-card"
                      onClick={() => selectRole(role)}
                      type="button"
                    >
                      <span className="isg-role-icon">{config.icon}</span>
                      <span>
                        <strong>{roleLabels[role].label}</strong>
                        <small>{roleLabels[role].desc}</small>
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {step === "enter_credentials" && roleConfig && (
              <form className="isg-login-form" onSubmit={handleLogin} noValidate>
                <div className="isg-selected-role">
                  <button className="isg-role-back" onClick={goBack} type="button">← Rol değiştir</button>
                  <span>{roleConfig.icon}</span>
                  <strong>{roleLabels[selectedRole!].label}</strong>
                </div>

                <FloatingField
                  autoComplete="email"
                  autoFocus
                  error={fieldErrors.email}
                  label="E-posta"
                  onChange={updateEmail}
                  type="email"
                  value={email}
                />

                <FloatingField
                  autoComplete="current-password"
                  error={fieldErrors.password}
                  label="Şifre"
                  onChange={updatePassword}
                  type={showPassword ? "text" : "password"}
                  value={password}
                >
                  <button
                    aria-label={showPassword ? "Şifreyi gizle" : "Şifreyi göster"}
                    className="isg-password-toggle"
                    onClick={() => setShowPassword(current => !current)}
                    type="button"
                  >
                    <EyeIcon visible={showPassword} />
                  </button>
                </FloatingField>

                <a className="isg-forgot-link" href="mailto:admin@isg-otomasyon.local?subject=Şifre sıfırlama talebi">
                  Şifremi unuttum
                </a>

                <button className="isg-login-submit" disabled={loading} type="submit">
                  {loading ? <span className="isg-login-spinner" aria-label="Giriş yapılıyor" /> : "Giriş Yap"}
                </button>

                {error && (
                  <div className="isg-login-error" role="alert">
                    <span aria-hidden="true">⚠</span>
                    <p>{error}</p>
                  </div>
                )}
              </form>
            )}
          </div>
        </section>
      </main>
    </CookieConsent>
  );
}
