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

export function AdminUserPanel({ styles }: Props) {
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [newUser, setNewUser] = useState({
    email: "",
    password: "",
    displayName: "",
    role: "doctor" as UserRole,
  });
  const [creating, setCreating] = useState(false);
  const [status, setStatus] = useState<string | null>(null);

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
        role: newUser.role,
      });

      // Oluşturulan kullanıcıdan çıkış yap, admin'e geri dön
      // Bu workaround — production'da Cloud Function ile yapılmalı
      if (currentUser) {
        // Admin tekrar sign-in olacak (session cookie hâlâ var)
        // window.location.reload() en güvenli yol
      }

      setStatus(`✅ ${newUser.displayName} (${ROLE_CONFIG[newUser.role].label}) başarıyla oluşturuldu`);
      setNewUser({ email: "", password: "", displayName: "", role: "doctor" });
      setShowForm(false);
      await loadUsers();
    } catch (err: any) {
      setStatus(`❌ Hata: ${err.message}`);
    } finally {
      setCreating(false);
    }
  }

  async function updateRole(uid: string, user: UserProfile, newRole: UserRole) {
    await setUserProfile(uid, {
      email: user.email,
      displayName: user.displayName,
      role: newRole,
    });
    await loadUsers();
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
                <label style={styles.label}>Rol</label>
                <select
                  style={styles.select}
                  value={newUser.role}
                  onChange={(e) => setNewUser({ ...newUser, role: e.target.value as UserRole })}
                >
                  <option value="doctor">🩺 Doktor</option>
                  <option value="nurse">💉 Hemşire</option>
                  <option value="admin">🛡️ Admin</option>
                  <option value="safety_expert">🦺 İş Güvenliği Uzmanı</option>
                </select>
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
              <th style={styles.th}>Rol</th>
              <th style={styles.th}>Rol Değiştir</th>
            </tr>
          </thead>
          <tbody>
            {users.map((user) => (
              <tr key={user.uid}>
                <td style={styles.td}>{user.displayName || "—"}</td>
                <td style={styles.td}>{user.email}</td>
                <td style={styles.td}>
                  <span style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 4,
                    padding: "2px 10px",
                    borderRadius: 6,
                    fontSize: 12,
                    fontWeight: 600,
                    backgroundColor: ROLE_CONFIG[user.role]?.color + "22" || "#33333322",
                    color: ROLE_CONFIG[user.role]?.color || "#999",
                    border: `1px solid ${ROLE_CONFIG[user.role]?.color || "#333"}44`,
                  }}>
                    {ROLE_CONFIG[user.role]?.icon} {ROLE_CONFIG[user.role]?.label || user.role}
                  </span>
                </td>
                <td style={styles.td}>
                  <select
                    value={user.role}
                    onChange={(e) => updateRole(user.uid, user, e.target.value as UserRole)}
                    style={{ ...styles.select, width: "auto", padding: "4px 8px", fontSize: 12 }}
                  >
                    <option value="doctor">Doktor</option>
                    <option value="nurse">Hemşire</option>
                    <option value="admin">Admin</option>
                    <option value="safety_expert">İş Güvenliği Uzmanı</option>
                  </select>
                </td>
              </tr>
            ))}
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
