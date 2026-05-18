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
import { createUserWithEmailAndPassword } from "firebase/auth";
import { auth } from "../../lib/firebase";
import {
  getAllUsers,
  setUserProfile,
  UserProfile,
  UserRole,
  ROLE_CONFIG,
} from "./roleManager";

type Props = {
  styles: Record<string, React.CSSProperties>;
};

const ALL_ROLES = Object.keys(ROLE_CONFIG) as UserRole[];

function normalizeRoles(user: Pick<UserProfile, "role" | "roles">) {
  return user.roles?.length ? user.roles : [user.role];
}

export function AdminUserPanel({ styles }: Props) {
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [newUser, setNewUser] = useState({
    email: "",
    password: "",
    displayName: "",
    roles: ["doctor"] as UserRole[],
  });
  const [creating, setCreating] = useState(false);
  const [status, setStatus] = useState<string | null>(null);
  const [roleUpdatingUid, setRoleUpdatingUid] = useState<string | null>(null);

  useEffect(() => {
    loadUsers();
  }, []);

  async function loadUsers() {
    setLoading(true);
    const all = await getAllUsers();
    setUsers(all);
    setLoading(false);
  }

  async function handleCreateUser(e: React.FormEvent) {
    e.preventDefault();
    setCreating(true);
    setStatus(null);

    try {
      // DİKKAT: Bu, mevcut oturumu değiştirir!
      // Production'da Cloud Function kullanın.
      const currentUser = auth.currentUser;

      const cred = await createUserWithEmailAndPassword(
        auth,
        newUser.email,
        newUser.password
      );

      await setUserProfile(cred.user.uid, {
        email: newUser.email,
        displayName: newUser.displayName,
        role: newUser.roles[0],
        roles: newUser.roles,
      });

      // Oluşturulan kullanıcıdan çıkış yap, admin'e geri dön
      // Bu workaround — production'da Cloud Function ile yapılmalı
      if (currentUser) {
        // Admin tekrar sign-in olacak (session cookie hâlâ var)
        // window.location.reload() en güvenli yol
      }

      setStatus(`✅ ${newUser.displayName} (${newUser.roles.map(role => ROLE_CONFIG[role].label).join(", ")}) başarıyla oluşturuldu`);
      setNewUser({ email: "", password: "", displayName: "", roles: ["doctor"] });
      setShowForm(false);
      await loadUsers();
    } catch (err: any) {
      setStatus(`❌ Hata: ${err.message}`);
    } finally {
      setCreating(false);
    }
  }

  function toggleNewUserRole(role: UserRole) {
    setNewUser(prev => {
      const exists = prev.roles.includes(role);
      const roles = exists ? prev.roles.filter(item => item !== role) : [...prev.roles, role];
      return { ...prev, roles: roles.length > 0 ? roles : [role] };
    });
  }

  async function updateRoles(uid: string, user: UserProfile, role: UserRole, checked: boolean) {
    setStatus(null);
    setRoleUpdatingUid(uid);
    try {
      const currentRoles = normalizeRoles(user);
      const nextRoles = checked ? Array.from(new Set([...currentRoles, role])) : currentRoles.filter(item => item !== role);
      const roles = nextRoles.length > 0 ? nextRoles : [role];
      await setUserProfile(uid, {
        email: user.email,
        displayName: user.displayName,
        role: roles[0],
        roles,
        activeRole: user.activeRole && roles.includes(user.activeRole) ? user.activeRole : roles[0],
      });
      setStatus(`✅ ${user.displayName || user.email} rolleri güncellendi: ${roles.map(item => ROLE_CONFIG[item].label).join(", ")}`);
      await loadUsers();
    } catch (error) {
      const message = error instanceof Error ? error.message : "Bilinmeyen hata";
      setStatus(`❌ Rol güncellenemedi: ${message}`);
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
        <button
          style={styles.btnPrimary}
          onClick={() => setShowForm(!showForm)}
        >
          {showForm ? "İptal" : "+ Yeni Kullanıcı"}
        </button>
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
                <input
                  style={styles.input}
                  type="password"
                  value={newUser.password}
                  onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
                  required
                  minLength={6}
                  placeholder="En az 6 karakter"
                />
              </div>
              <div>
                <label style={styles.label}>Roller</label>
                <div style={{ display: "grid", gap: 8 }}>
                  {ALL_ROLES.map((role) => (
                    <label key={role} style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13, color: "var(--isg-text)", cursor: "pointer" }}>
                      <input
                        type="checkbox"
                        checked={newUser.roles.includes(role)}
                        onChange={() => toggleNewUserRole(role)}
                      />
                      <span>{ROLE_CONFIG[role].icon} {ROLE_CONFIG[role].label}</span>
                    </label>
                  ))}
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
      <div style={styles.card}>
        <table style={styles.table}>
          <thead>
            <tr>
              <th style={styles.th}>Ad Soyad</th>
              <th style={styles.th}>E-posta</th>
              <th style={styles.th}>Roller</th>
              <th style={styles.th}>Rol Ekle / Kaldır</th>
            </tr>
          </thead>
          <tbody>
            {users.map((user) => {
              const userRoles = normalizeRoles(user);
              return (
                <tr key={user.uid}>
                  <td style={styles.td}>{user.displayName || "—"}</td>
                  <td style={styles.td}>{user.email}</td>
                  <td style={styles.td}>
                    <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                      {userRoles.map((role) => (
                        <span key={role} style={{
                          display: "inline-flex",
                          alignItems: "center",
                          gap: 4,
                          padding: "2px 10px",
                          borderRadius: 6,
                          fontSize: 12,
                          fontWeight: 600,
                          backgroundColor: ROLE_CONFIG[role]?.color + "22" || "#33333322",
                          color: ROLE_CONFIG[role]?.color || "#999",
                          border: `1px solid ${ROLE_CONFIG[role]?.color || "#333"}44`,
                        }}>
                          {ROLE_CONFIG[role]?.icon} {ROLE_CONFIG[role]?.label || role}
                        </span>
                      ))}
                    </div>
                  </td>
                  <td style={styles.td}>
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(2, minmax(150px, 1fr))", gap: 8 }}>
                      {ALL_ROLES.map((role) => (
                        <label key={role} style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, color: "var(--isg-text)", cursor: "pointer" }}>
                          <input
                            type="checkbox"
                            checked={userRoles.includes(role)}
                            disabled={roleUpdatingUid === user.uid}
                            onChange={(e) => updateRoles(user.uid, user, role, e.target.checked)}
                          />
                          <span>{ROLE_CONFIG[role].icon} {ROLE_CONFIG[role].label}</span>
                        </label>
                      ))}
                    </div>
                  </td>
                </tr>
              );
            })}
            {users.length === 0 && (
              <tr>
                <td colSpan={4} style={{ ...styles.td, textAlign: "center", color: "var(--isg-text-muted)" }}>
                  Henüz kayıtlı kullanıcı yok
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div style={{ fontSize: 11, color: "#475569", marginTop: 12 }}>
        ⚠️ Kullanıcı oluşturma işlemi client-side yapılmaktadır. Production ortamında Firebase Cloud Functions kullanılması önerilir.
      </div>
    </div>
  );
}
