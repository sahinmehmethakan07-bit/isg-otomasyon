/**
 * AdminUserPanel.tsx — Admin Kullanıcı Yönetim Paneli
 *
 * Admin sekmesi olarak dashboard'a eklenir.
 * - Tüm kullanıcıları listeler
 * - Yeni kullanıcı oluşturabilir (Firebase Auth + Firestore profil)
 * - Kullanıcı rollerini değiştirebilir
 *
 * NOT: Firebase Auth'da kullanıcı oluşturmak için Firebase Admin SDK
 * veya client-side createUserWithEmailAndPassword kullanılır.
 * Client-side'da createUser yapınca mevcut oturum değişir — buna dikkat.
 * Production'da bu işi bir Cloud Function ile yapmak daha güvenli.
 */

"use client";

import React, { useState, useEffect } from "react";
import { initializeApp, deleteApp } from "firebase/app";
import { createUserWithEmailAndPassword, getAuth, signOut } from "firebase/auth";
import { auth, db, firebaseConfig } from "../../lib/firebase";
import { addDoc, collection, serverTimestamp } from "firebase/firestore";
import {
  getAllUsers,
  setUserProfile,
  UserProfile,
  UserRole,
  ROLE_CONFIG,
} from "./roleManager";

type Props = {
  styles: Record<string, React.CSSProperties>;
  companies: { id: string; nickName: string; officialName: string }[];
  onCompanyCreated?: (company: AdminCompany) => void;
};

type AdminCompany = {
  id: string;
  nickName: string;
  officialName: string;
  sgkSicil: string;
  naceCode: string;
  dangerClass: "Az Tehlikeli" | "Tehlikeli" | "Çok Tehlikeli";
  employeeCount: number;
  contractEnd: string;
  serviceType: "İş Güvenliği" | "İş Güvenliği + İşyeri Hekimliği";
  contactEmail?: string;
};

const ALL_ROLES = Object.keys(ROLE_CONFIG) as UserRole[];

function normalizeRoles(user: Pick<UserProfile, "role" | "roles">) {
  return user.roles?.length ? user.roles : [user.role];
}

function PermissionToggle({
  checked,
  disabled,
  icon,
  title,
  subtitle,
  accent = "var(--isg-accent)",
  compact = false,
  onChange,
}: {
  checked: boolean;
  disabled?: boolean;
  icon: string;
  title: string;
  subtitle?: string;
  accent?: string;
  compact?: boolean;
  onChange: (checked: boolean) => void;
}) {
  return (
    <label
      style={{
        minHeight: compact ? 34 : 44,
        display: "flex",
        alignItems: "center",
        gap: compact ? 7 : 10,
        padding: compact ? "7px 9px" : "10px 12px",
        borderRadius: compact ? 8 : 10,
        border: checked ? `1px solid ${accent}88` : "1px solid var(--isg-border)",
        backgroundColor: checked ? `${accent}1f` : "rgba(255,255,255,0.035)",
        color: checked ? "var(--isg-text)" : "var(--isg-text-muted)",
        boxShadow: checked ? `0 0 0 1px ${accent}18 inset` : "none",
        cursor: disabled ? "not-allowed" : "pointer",
        opacity: disabled ? 0.55 : 1,
        transition: "border-color 120ms ease, background-color 120ms ease, box-shadow 120ms ease",
        minWidth: 0,
      }}
    >
      <input
        type="checkbox"
        checked={checked}
        disabled={disabled}
        onChange={(event) => onChange(event.target.checked)}
        style={{ position: "absolute", opacity: 0, pointerEvents: "none" }}
      />
      <span
        style={{
          width: compact ? 22 : 26,
          height: compact ? 22 : 26,
          flex: `0 0 ${compact ? 22 : 26}px`,
          display: "inline-flex",
          alignItems: "center",
          justifyContent: "center",
          borderRadius: compact ? 7 : 8,
          backgroundColor: checked ? `${accent}2b` : "rgba(255,255,255,0.06)",
          border: checked ? `1px solid ${accent}66` : "1px solid var(--isg-border)",
          fontSize: compact ? 12 : 14,
        }}
      >
        {checked ? "✓" : icon}
      </span>
      <span style={{ minWidth: 0, display: "grid", gap: 2 }}>
        <span style={{ fontSize: compact ? 12 : 13, fontWeight: 800, color: checked ? accent : "var(--isg-text)", lineHeight: 1.15, overflowWrap: "anywhere" }}>
          {icon} {title}
        </span>
        {subtitle && !compact && (
          <span style={{ fontSize: 11, color: "var(--isg-text-muted)", lineHeight: 1.25, whiteSpace: "normal" }}>
            {subtitle}
          </span>
        )}
      </span>
    </label>
  );
}

function ModernDatePicker({
  value,
  onChange,
  styles,
}: {
  value: string;
  onChange: (value: string) => void;
  styles: Record<string, React.CSSProperties>;
}) {
  const [open, setOpen] = useState(false);
  const ref = React.useRef<HTMLDivElement>(null);
  const current = value ? new Date(value) : new Date();
  const [viewYear, setViewYear] = useState(current.getFullYear());
  const [viewMonth, setViewMonth] = useState(current.getMonth());
  const selectedDate = value ? new Date(value) : null;
  const months = ["Oca", "Şub", "Mar", "Nis", "May", "Haz", "Tem", "Ağu", "Eyl", "Eki", "Kas", "Ara"];
  const firstDay = (new Date(viewYear, viewMonth, 1).getDay() + 6) % 7;
  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();

  useEffect(() => {
    if (!open) return;
    const handler = (event: MouseEvent) => {
      if (ref.current && !ref.current.contains(event.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  const selectDay = (day: number) => {
    const date = `${viewYear}-${String(viewMonth + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
    onChange(date);
    setOpen(false);
  };

  return (
    <div ref={ref} style={{ position: "relative" }}>
      <button
        type="button"
        onClick={() => setOpen(prev => !prev)}
        style={{ ...styles.input, cursor: "pointer", display: "flex", justifyContent: "space-between", alignItems: "center", textAlign: "left" }}
      >
        <span style={{ color: value ? "var(--isg-text)" : "var(--isg-text-muted)" }}>
          {value ? new Date(value).toLocaleDateString("tr-TR") : "Tarih seçin..."}
        </span>
        <span style={{ fontSize: 14 }}>📅</span>
      </button>
      {open && (
        <div style={{ position: "absolute", zIndex: 1000, top: "calc(100% + 4px)", left: 0, backgroundColor: "var(--isg-card)", border: "1px solid var(--isg-border)", borderRadius: 8, padding: 12, width: 240, boxShadow: "0 8px 32px rgba(0,0,0,0.5)" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
            <button type="button" onClick={() => { if (viewMonth === 0) { setViewMonth(11); setViewYear(year => year - 1); } else setViewMonth(month => month - 1); }} style={{ ...styles.btnSecondary, padding: "2px 8px" }}>‹</button>
            <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
              <select value={viewMonth} onChange={event => setViewMonth(Number(event.target.value))} style={{ ...styles.select, width: "auto", padding: "2px 6px", fontSize: 12 }}>
                {months.map((month, index) => <option key={month} value={index}>{month}</option>)}
              </select>
              <select value={viewYear} onChange={event => setViewYear(Number(event.target.value))} style={{ ...styles.select, width: "auto", padding: "2px 6px", fontSize: 12 }}>
                {Array.from({ length: 20 }, (_, index) => 2020 + index).map(year => <option key={year} value={year}>{year}</option>)}
              </select>
            </div>
            <button type="button" onClick={() => { if (viewMonth === 11) { setViewMonth(0); setViewYear(year => year + 1); } else setViewMonth(month => month + 1); }} style={{ ...styles.btnSecondary, padding: "2px 8px" }}>›</button>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 2, marginBottom: 4 }}>
            {["Pt", "Sa", "Ça", "Pe", "Cu", "Ct", "Pz"].map(day => (
              <div key={day} style={{ textAlign: "center", fontSize: 10, color: "var(--isg-text-muted)", padding: "2px 0" }}>{day}</div>
            ))}
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 2 }}>
            {Array.from({ length: firstDay }).map((_, index) => <div key={`empty-${index}`} />)}
            {Array.from({ length: daysInMonth }, (_, index) => index + 1).map(day => {
              const isSelected = selectedDate &&
                selectedDate.getFullYear() === viewYear &&
                selectedDate.getMonth() === viewMonth &&
                selectedDate.getDate() === day;
              return (
                <button
                  key={day}
                  type="button"
                  onClick={() => selectDay(day)}
                  style={{
                    backgroundColor: isSelected ? "#0ea5e9" : "transparent",
                    color: isSelected ? "#fff" : "var(--isg-text)",
                    border: "none",
                    borderRadius: 4,
                    padding: "4px 0",
                    fontSize: 12,
                    cursor: "pointer",
                  }}
                >
                  {day}
                </button>
              );
            })}
          </div>
          <button type="button" onClick={() => { onChange(""); setOpen(false); }} style={{ ...styles.btnSecondary, width: "100%", marginTop: 8, fontSize: 11 }}>Temizle</button>
        </div>
      )}
    </div>
  );
}

export function AdminUserPanel({ styles, companies, onCompanyCreated }: Props) {
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [localCompanies, setLocalCompanies] = useState(companies);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [showCompanyForm, setShowCompanyForm] = useState(false);
  const [newCompany, setNewCompany] = useState({
    nickName: "",
    officialName: "",
    sgkSicil: "",
    naceCode: "",
    dangerClass: "Az Tehlikeli" as AdminCompany["dangerClass"],
    employeeCount: "",
    contractEnd: "",
    serviceType: "İş Güvenliği" as AdminCompany["serviceType"],
    contactEmail: "",
  });
  const [newUser, setNewUser] = useState({
    email: "",
    password: "",
    displayName: "",
    roles: ["doctor"] as UserRole[],
    companyIds: [] as string[],
  });
  const [creating, setCreating] = useState(false);
  const [status, setStatus] = useState<string | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [roleUpdatingUid, setRoleUpdatingUid] = useState<string | null>(null);
  const [deletingUid, setDeletingUid] = useState<string | null>(null);
  const [showNewUserPassword, setShowNewUserPassword] = useState(false);

  useEffect(() => {
    loadUsers();
  }, []);

  useEffect(() => {
    setLocalCompanies(companies);
  }, [companies]);

  async function loadUsers() {
    setLoading(true);
    setLoadError(null);
    try {
      const all = await getAllUsers();
      setUsers(all);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Bilinmeyen hata";
      setLoadError(`Kullanıcı listesi yüklenemedi: ${message}`);
      setUsers([]);
    } finally {
      setLoading(false);
    }
  }

  async function handleCreateUser(e: React.FormEvent) {
    e.preventDefault();
    setCreating(true);
    setStatus(null);
    let secondaryApp: ReturnType<typeof initializeApp> | null = null;

    try {
      const hasCompanyScopedRole = newUser.roles.some(role => role !== "admin");
      if (hasCompanyScopedRole && newUser.companyIds.length === 0) {
        setStatus("❌ Doktor, hemşire, İSG uzmanı veya İK rolü için en az bir firma yetkisi seçmelisiniz.");
        setCreating(false);
        return;
      }

      const secondaryAppName = `admin-user-create-${Date.now()}`;
      secondaryApp = initializeApp(firebaseConfig, secondaryAppName);
      const secondaryAuth = getAuth(secondaryApp);
      const cred = await createUserWithEmailAndPassword(
        secondaryAuth,
        newUser.email,
        newUser.password
      );

      await setUserProfile(cred.user.uid, {
        email: newUser.email,
        displayName: newUser.displayName,
        role: newUser.roles[0],
        roles: newUser.roles,
        companyIds: newUser.companyIds,
      });

      await signOut(secondaryAuth);
      await deleteApp(secondaryApp);
      secondaryApp = null;

      setStatus(`✅ ${newUser.displayName} (${newUser.roles.map(role => ROLE_CONFIG[role].label).join(", ")}) başarıyla oluşturuldu`);
      setNewUser({ email: "", password: "", displayName: "", roles: ["doctor"], companyIds: [] });
      setShowForm(false);
      await loadUsers();
    } catch (err: any) {
      setStatus(`❌ Hata: ${err.message}`);
    } finally {
      if (secondaryApp) {
        await deleteApp(secondaryApp).catch(() => undefined);
      }
      setCreating(false);
    }
  }

  async function handleCreateCompany(e: React.FormEvent) {
    e.preventDefault();
    setStatus(null);
    if (!newCompany.nickName.trim() || !newCompany.sgkSicil.trim()) {
      setStatus("❌ Firma kısa adı ve SGK sicil no zorunludur.");
      return;
    }

    try {
      const data = {
        nickName: newCompany.nickName.trim(),
        officialName: newCompany.officialName.trim() || newCompany.nickName.trim(),
        sgkSicil: newCompany.sgkSicil.trim(),
        naceCode: newCompany.naceCode.trim(),
        dangerClass: newCompany.dangerClass,
        employeeCount: parseInt(newCompany.employeeCount) || 0,
        contractEnd: newCompany.contractEnd,
        serviceType: newCompany.serviceType,
        contactEmail: newCompany.contactEmail.trim(),
        createdAt: serverTimestamp(),
      };
      const ref = await addDoc(collection(db, "companies"), data);
      const created = { id: ref.id, ...data, createdAt: undefined } as unknown as AdminCompany;
      setLocalCompanies(prev => [...prev, created]);
      onCompanyCreated?.(created);
      setNewCompany({ nickName: "", officialName: "", sgkSicil: "", naceCode: "", dangerClass: "Az Tehlikeli", employeeCount: "", contractEnd: "", serviceType: "İş Güvenliği", contactEmail: "" });
      setShowCompanyForm(false);
      setStatus(`✅ ${created.nickName} firması oluşturuldu. Artık kullanıcıları bu firmaya atayabilirsiniz.`);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Bilinmeyen hata";
      setStatus(`❌ Firma oluşturulamadı: ${message}`);
    }
  }

  function toggleNewUserRole(role: UserRole) {
    setNewUser(prev => {
      const exists = prev.roles.includes(role);
      const roles = exists ? prev.roles.filter(item => item !== role) : [...prev.roles, role];
      const normalizedRoles = roles.length > 0 ? roles : [role];
      return { ...prev, roles: normalizedRoles };
    });
  }

  async function updateRoles(uid: string, user: UserProfile, role: UserRole, checked: boolean) {
    setStatus(null);
    setRoleUpdatingUid(uid);
    try {
      const currentUid = auth.currentUser?.uid;
      if (uid === currentUid && role === "admin" && !checked) {
        setStatus("❌ Kendi admin yetkinizi kaldıramazsınız. Başka bir admin bu işlemi yapmalı.");
        return;
      }

      const currentRoles = normalizeRoles(user);
      const nextRoles = checked ? Array.from(new Set([...currentRoles, role])) : currentRoles.filter(item => item !== role);
      const roles = nextRoles.length > 0 ? nextRoles : [role];
      const activeRole = user.activeRole && roles.includes(user.activeRole) ? user.activeRole : roles[0];
      setUsers(prev => prev.map(item => item.uid === uid ? { ...item, roles, role: roles[0], activeRole } : item));
      await setUserProfile(uid, {
        email: user.email,
        displayName: user.displayName,
        role: roles[0],
        roles,
        activeRole,
        companyIds: user.companyIds || [],
        activeCompanyId: user.activeCompanyId,
      });
      setStatus(`✅ ${user.displayName || user.email} rolleri güncellendi: ${roles.map(item => ROLE_CONFIG[item].label).join(", ")}`);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Bilinmeyen hata";
      setStatus(`❌ Rol güncellenemedi: ${message}`);
      await loadUsers();
    } finally {
      setRoleUpdatingUid(null);
    }
  }

  function toggleNewUserCompany(companyId: string) {
    setNewUser(prev => {
      const exists = prev.companyIds.includes(companyId);
      const companyIds = exists ? prev.companyIds.filter(id => id !== companyId) : [...prev.companyIds, companyId];
      return { ...prev, companyIds };
    });
  }

  async function deleteUserProfile(user: UserProfile) {
    setStatus(null);
    const currentUid = auth.currentUser?.uid;
    if (user.uid === currentUid) {
      setStatus("❌ Kendi kullanıcı kaydınızı silemezsiniz. Başka bir admin bu işlemi yapmalı.");
      return;
    }

    const userRoles = normalizeRoles(user);
    if (userRoles.includes("admin")) {
      const adminCount = users.filter(item => normalizeRoles(item).includes("admin")).length;
      if (adminCount <= 1) {
        setStatus("❌ Sistemde en az bir admin kalmalı. Son admin kullanıcısı silinemez.");
        return;
      }
    }

    const label = user.displayName || user.email;
    const confirmed = window.confirm(`${label} kullanıcısı tamamen silinsin mi? Bu işlem Firebase Authentication hesabını ve uygulama rol/firma kaydını kaldırır.`);
    if (!confirmed) return;

    setDeletingUid(user.uid);
    try {
      const token = await auth.currentUser?.getIdToken();
      if (!token) throw new Error("Admin oturumu doğrulanamadı. Lütfen tekrar giriş yapın.");

      const response = await fetch("/api/admin/delete-user", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ uid: user.uid }),
      });
      const result = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(result.error || "Kullanıcı silinemedi.");
      }

      setUsers(prev => prev.filter(item => item.uid !== user.uid));
      setStatus(`✅ ${label} kullanıcısı silindi.`);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Bilinmeyen hata";
      setStatus(`❌ Kullanıcı silinemedi: ${message}`);
    } finally {
      setDeletingUid(null);
    }
  }

  async function updateUserCompanies(uid: string, user: UserProfile, companyId: string, checked: boolean) {
    setStatus(null);
    setRoleUpdatingUid(uid);
    try {
      const currentCompanyIds = user.companyIds || [];
      const companyIds = checked
        ? Array.from(new Set([...currentCompanyIds, companyId]))
        : currentCompanyIds.filter(id => id !== companyId);
      const roles = normalizeRoles(user);
      const activeCompanyId = user.activeCompanyId && companyIds.includes(user.activeCompanyId) ? user.activeCompanyId : companyIds[0] || "";
      setUsers(prev => prev.map(item => item.uid === uid ? { ...item, companyIds, activeCompanyId } : item));
      await setUserProfile(uid, {
        email: user.email,
        displayName: user.displayName,
        role: roles[0],
        roles,
        activeRole: user.activeRole && roles.includes(user.activeRole) ? user.activeRole : roles[0],
        companyIds,
        activeCompanyId,
      });
      setStatus(`✅ ${user.displayName || user.email} firma yetkileri güncellendi`);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Bilinmeyen hata";
      setStatus(`❌ Firma yetkisi güncellenemedi: ${message}`);
      await loadUsers();
    } finally {
      setRoleUpdatingUid(null);
    }
  }

  if (loading) {
    return <div style={{ color: "var(--isg-text-muted)", padding: 20 }}>Kullanıcılar yükleniyor...</div>;
  }

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
        <p style={{ ...styles.sectionTitle, marginBottom: 0 }}>Kullanıcı Yönetimi</p>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          <button
            style={styles.btnSecondary}
            onClick={() => {
              setShowCompanyForm(!showCompanyForm);
              if (!showCompanyForm) setShowForm(false);
            }}
          >
            {showCompanyForm ? "Firma Formunu Kapat" : "+ Yeni Firma"}
          </button>
          <button
            style={styles.btnPrimary}
            onClick={() => {
              setShowForm(!showForm);
              if (!showForm) setShowCompanyForm(false);
            }}
          >
            {showForm ? "İptal" : "+ Yeni Kullanıcı"}
          </button>
        </div>
      </div>

      {status && (
        <div style={{
          backgroundColor: status.startsWith("✅") ? "#16a34a15" : "#dc262615",
          border: `1px solid ${status.startsWith("✅") ? "#16a34a33" : "#dc262633"}`,
          borderRadius: 8,
          padding: "10px 14px",
          marginBottom: 16,
          fontSize: 13,
          color: status.startsWith("✅") ? "#86efac" : "#fca5a5",
        }}>
          {status}
        </div>
      )}

      {loadError && (
        <div style={{
          backgroundColor: "#dc262615",
          border: "1px solid #dc262633",
          borderRadius: 8,
          padding: "10px 14px",
          marginBottom: 16,
          fontSize: 13,
          color: "#fca5a5",
        }}>
          ❌ {loadError}
        </div>
      )}

      {/* Yeni firma formu */}
      {showCompanyForm && (
        <div style={{ ...styles.card, marginBottom: 20 }}>
          <form onSubmit={handleCreateCompany}>
            <p style={{ ...styles.sectionTitle, marginBottom: 14 }}>Yeni Firma Ekle</p>
            <div style={styles.formGrid}>
              <div>
                <label style={styles.label}>Kısa Ad *</label>
                <input
                  style={styles.input}
                  value={newCompany.nickName}
                  onChange={(e) => setNewCompany({ ...newCompany, nickName: e.target.value })}
                  required
                  placeholder="Edition Hotel"
                />
              </div>
              <div>
                <label style={styles.label}>Resmi Unvan</label>
                <input
                  style={styles.input}
                  value={newCompany.officialName}
                  onChange={(e) => setNewCompany({ ...newCompany, officialName: e.target.value })}
                  placeholder="Edition Hotel A.Ş."
                />
              </div>
              <div>
                <label style={styles.label}>SGK Sicil No *</label>
                <input
                  style={styles.input}
                  value={newCompany.sgkSicil}
                  onChange={(e) => setNewCompany({ ...newCompany, sgkSicil: e.target.value })}
                  required
                />
              </div>
              <div>
                <label style={styles.label}>NACE Kodu</label>
                <input
                  style={styles.input}
                  value={newCompany.naceCode}
                  onChange={(e) => setNewCompany({ ...newCompany, naceCode: e.target.value })}
                />
              </div>
              <div>
                <label style={styles.label}>Tehlike Sınıfı</label>
                <select
                  style={styles.select}
                  value={newCompany.dangerClass}
                  onChange={(e) => setNewCompany({ ...newCompany, dangerClass: e.target.value as AdminCompany["dangerClass"] })}
                >
                  <option>Az Tehlikeli</option>
                  <option>Tehlikeli</option>
                  <option>Çok Tehlikeli</option>
                </select>
              </div>
              <div>
                <label style={styles.label}>Çalışan Sayısı</label>
                <input
                  style={styles.input}
                  type="number"
                  min={0}
                  value={newCompany.employeeCount}
                  onChange={(e) => setNewCompany({ ...newCompany, employeeCount: e.target.value })}
                />
              </div>
              <div>
                <label style={styles.label}>Sözleşme Bitiş</label>
                <ModernDatePicker
                  value={newCompany.contractEnd}
                  onChange={(value) => setNewCompany({ ...newCompany, contractEnd: value })}
                  styles={styles}
                />
              </div>
              <div>
                <label style={styles.label}>Hizmet Türü</label>
                <select
                  style={styles.select}
                  value={newCompany.serviceType}
                  onChange={(e) => setNewCompany({ ...newCompany, serviceType: e.target.value as AdminCompany["serviceType"] })}
                >
                  <option>İş Güvenliği</option>
                  <option>İş Güvenliği + İşyeri Hekimliği</option>
                </select>
              </div>
              <div>
                <label style={styles.label}>İletişim E-posta</label>
                <input
                  style={styles.input}
                  type="email"
                  value={newCompany.contactEmail}
                  onChange={(e) => setNewCompany({ ...newCompany, contactEmail: e.target.value })}
                  placeholder="firma@ornek.com"
                />
              </div>
            </div>
            <div style={{ marginTop: 12 }}>
              <button type="submit" style={styles.btnSuccess}>Firma Oluştur</button>
            </div>
          </form>
        </div>
      )}

      {/* Yeni kullanıcı formu */}
      {showForm && (
        <div style={{ ...styles.card, marginBottom: 20 }}>
          <form onSubmit={handleCreateUser}>
            <div style={styles.formGrid}>
              <div>
                <label style={styles.label}>Ad Soyad</label>
                <input
                  style={styles.input}
                  value={newUser.displayName}
                  onChange={(e) => setNewUser({ ...newUser, displayName: e.target.value })}
                  required
                  placeholder="Dr. Ahmet Yılmaz"
                />
              </div>
              <div>
                <label style={styles.label}>E-posta</label>
                <input
                  style={styles.input}
                  type="email"
                  value={newUser.email}
                  onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
                  required
                  placeholder="ahmet@firma.com"
                />
              </div>
              <div>
                <label style={styles.label}>Şifre</label>
                <div style={{ position: "relative" }}>
                  <input
                    style={{ ...styles.input, paddingRight: 82 }}
                    type={showNewUserPassword ? "text" : "password"}
                    value={newUser.password}
                    onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
                    required
                    minLength={6}
                    placeholder="En az 6 karakter"
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewUserPassword(prev => !prev)}
                    style={{
                      position: "absolute",
                      right: 8,
                      top: "50%",
                      transform: "translateY(-50%)",
                      border: "1px solid var(--isg-border)",
                      backgroundColor: "var(--isg-input-bg)",
                      color: "var(--isg-text)",
                      borderRadius: 6,
                      padding: "6px 9px",
                      fontSize: 12,
                      fontWeight: 700,
                      cursor: "pointer",
                    }}
                  >
                    {showNewUserPassword ? "Gizle" : "Göster"}
                  </button>
                </div>
              </div>
              <div>
                <label style={styles.label}>Roller</label>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(190px, 1fr))", gap: 10 }}>
                  {ALL_ROLES.map((role) => (
                    <PermissionToggle
                      key={role}
                      checked={newUser.roles.includes(role)}
                      icon={ROLE_CONFIG[role].icon}
                      title={ROLE_CONFIG[role].label}
                      subtitle={role === "admin" ? "Tam yetki" : "Firma bazlı erişim"}
                      accent={ROLE_CONFIG[role].color}
                      onChange={() => toggleNewUserRole(role)}
                    />
                  ))}
                </div>
              </div>
              <div>
                <label style={styles.label}>Firma Yetkileri</label>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(210px, 1fr))", gap: 10, maxHeight: 240, overflow: "auto", border: "1px solid var(--isg-border)", borderRadius: 12, padding: 12, backgroundColor: "rgba(255,255,255,0.035)" }}>
                  {newUser.roles.includes("admin") && (
                    <div style={{ gridColumn: "1 / -1", fontSize: 12, color: "var(--isg-text-muted)", lineHeight: 1.4 }}>
                      Admin rolü tüm firmaları görür. Seçili firmalar, aynı kullanıcının doktor/hemşire/İSG/İK rolüne geçtiğinde hangi firmaları göreceğini belirler.
                    </div>
                  )}
                  {localCompanies.map((company) => (
                    <PermissionToggle
                      key={company.id}
                      checked={newUser.companyIds.includes(company.id)}
                      icon="🏢"
                      title={company.nickName || company.officialName}
                      subtitle={company.officialName && company.officialName !== company.nickName ? company.officialName : "Firma yetkisi"}
                      onChange={() => toggleNewUserCompany(company.id)}
                    />
                  ))}
                  {localCompanies.length === 0 && (
                    <div style={{ fontSize: 12, color: "var(--isg-text-muted)" }}>Önce Firma sekmesinden firma ekleyin.</div>
                  )}
                </div>
              </div>
            </div>
            <div style={{ marginTop: 12 }}>
              <button type="submit" style={styles.btnSuccess} disabled={creating}>
                {creating ? "Oluşturuluyor..." : "Kullanıcı Oluştur"}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Kullanıcı listesi */}
      <div style={{ display: "grid", gap: 14 }}>
        {users.map((user) => {
          const userRoles = normalizeRoles(user);
          const isCurrentUser = user.uid === auth.currentUser?.uid;
          return (
            <article
              key={user.uid}
              style={{
                ...styles.card,
                display: "grid",
                gap: 18,
                padding: 20,
                overflow: "hidden",
              }}
            >
              <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 16, flexWrap: "wrap" }}>
                <div style={{ display: "grid", gap: 6, minWidth: 220 }}>
                  <div style={{ color: "var(--isg-text)", fontSize: 16, fontWeight: 850 }}>
                    {user.displayName || "İsimsiz kullanıcı"}
                  </div>
                  <div style={{ color: "var(--isg-text-muted)", fontSize: 13, overflowWrap: "anywhere" }}>
                    {user.email}
                  </div>
                </div>
                <button
                  type="button"
                  style={{ ...styles.btnDanger, opacity: deletingUid === user.uid || isCurrentUser ? 0.55 : 1 }}
                  disabled={deletingUid === user.uid || isCurrentUser}
                  onClick={() => deleteUserProfile(user)}
                  title={isCurrentUser ? "Kendi hesabınızı buradan silemezsiniz" : "Kullanıcıyı tamamen sil"}
                >
                  {deletingUid === user.uid ? "Siliniyor..." : "Kaydı Sil"}
                </button>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "minmax(220px, 0.9fr) minmax(260px, 1fr) minmax(260px, 1fr)", gap: 18, alignItems: "start" }}>
                <section style={{ display: "grid", gap: 12, minWidth: 0 }}>
                  <div>
                    <div style={{ ...styles.sectionTitle, marginBottom: 8 }}>Aktif Roller</div>
                    <div style={{ display: "flex", gap: 7, flexWrap: "wrap" }}>
                      {userRoles.map((role) => (
                        <span key={role} style={{
                          display: "inline-flex",
                          alignItems: "center",
                          gap: 5,
                          padding: "5px 10px",
                          borderRadius: 8,
                          fontSize: 12,
                          fontWeight: 750,
                          backgroundColor: ROLE_CONFIG[role]?.color + "22" || "#33333322",
                          color: ROLE_CONFIG[role]?.color || "#999",
                          border: `1px solid ${ROLE_CONFIG[role]?.color || "#333"}44`,
                        }}>
                          {ROLE_CONFIG[role]?.icon} {ROLE_CONFIG[role]?.label || role}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div>
                    <div style={{ ...styles.sectionTitle, marginBottom: 8 }}>Firma Yetkileri</div>
                    {(user.companyIds || []).length > 0 ? (
                      <div style={{ display: "flex", gap: 7, flexWrap: "wrap" }}>
                        {(user.companyIds || []).map(companyId => {
                          const company = localCompanies.find(c => c.id === companyId);
                          return (
                            <span key={companyId} style={{ ...styles.badge, backgroundColor: "rgba(76,201,166,0.12)", color: "var(--isg-accent)", border: "1px solid rgba(76,201,166,0.24)" }}>
                              {company?.nickName || company?.officialName || companyId}
                            </span>
                          );
                        })}
                      </div>
                    ) : userRoles.includes("admin") ? (
                      <div style={{ color: "var(--isg-text-muted)", fontSize: 12, lineHeight: 1.4 }}>
                        Admin olarak tüm firmalar görünür. Diğer roller için firma seçin.
                      </div>
                    ) : (
                      <span style={{ color: "#f59e0b", fontSize: 12 }}>Firma atanmamış</span>
                    )}
                  </div>
                </section>

                <section style={{ display: "grid", gap: 9, minWidth: 0 }}>
                  <div style={styles.sectionTitle}>Rol Ekle / Kaldır</div>
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(130px, 1fr))", gap: 8 }}>
                    {ALL_ROLES.map((role) => (
                      <PermissionToggle
                        key={role}
                        checked={userRoles.includes(role)}
                        disabled={roleUpdatingUid === user.uid || (isCurrentUser && role === "admin")}
                        icon={ROLE_CONFIG[role].icon}
                        title={ROLE_CONFIG[role].label}
                        subtitle={role === "admin" ? "Tam yönetim" : "Firma bazlı"}
                        accent={ROLE_CONFIG[role].color}
                        compact
                        onChange={(checked) => updateRoles(user.uid, user, role, checked)}
                      />
                    ))}
                  </div>
                </section>

                <section style={{ display: "grid", gap: 9, minWidth: 0 }}>
                  <div style={styles.sectionTitle}>Firma Ekle / Kaldır</div>
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(145px, 1fr))", gap: 8, maxHeight: 190, overflow: "auto", paddingRight: 4 }}>
                    {localCompanies.map((company) => (
                      <PermissionToggle
                        key={company.id}
                        checked={(user.companyIds || []).includes(company.id)}
                        disabled={roleUpdatingUid === user.uid}
                        icon="🏢"
                        title={company.nickName || company.officialName}
                        subtitle="Yetki ver"
                        compact
                        onChange={(checked) => updateUserCompanies(user.uid, user, company.id, checked)}
                      />
                    ))}
                    {localCompanies.length === 0 && (
                      <div style={{ fontSize: 12, color: "var(--isg-text-muted)" }}>Henüz firma yok.</div>
                    )}
                  </div>
                </section>
              </div>
            </article>
          );
        })}
        {users.length === 0 && (
          <div style={{ ...styles.card, textAlign: "center", color: "var(--isg-text-muted)" }}>
            Henüz kayıtlı kullanıcı yok
          </div>
        )}
      </div>

      <div style={{ fontSize: 11, color: "#475569", marginTop: 12 }}>
        ⚠️ Kullanıcı silme işlemi Firebase Authentication hesabını ve uygulama rol/firma kaydını kaldırır. Kendi hesabınızı ve sistemdeki son admin hesabını buradan silemezsiniz.
      </div>
    </div>
  );
}
