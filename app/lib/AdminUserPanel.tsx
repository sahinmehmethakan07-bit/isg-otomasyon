"use client";

import React, { useState, useEffect } from "react";
import { initializeApp, deleteApp } from "firebase/app";
import { createUserWithEmailAndPassword, getAuth, signOut } from "firebase/auth";
import { auth, db, firebaseConfig } from "../../lib/firebase";
import { addDoc, collection, doc, serverTimestamp, updateDoc } from "firebase/firestore";
import {
  getAllUsers,
  setUserProfile,
  updateUserPlan,
  UserProfile,
  UserRole,
  ROLE_CONFIG,
} from "./roleManager";
import {
  getAllAccounts,
  createAccount,
  updateAccount,
  deleteAccount,
  Account,
} from "./accountService";
import { PLANS, getPlan, limitLabel, type PlanId } from "./plans";

type Props = {
  styles: Record<string, React.CSSProperties>;
  companies: { id: string; nickName: string; officialName: string }[];
  onCompanyCreated?: (company: any) => void;
};

const ALL_ROLES = Object.keys(ROLE_CONFIG) as UserRole[];

function normalizeRoles(user: Pick<UserProfile, "role" | "roles">) {
  return user.roles?.length ? user.roles : [user.role];
}

function RoleBadge({ role }: { role: UserRole }) {
  const cfg = ROLE_CONFIG[role];
  return (
    <span style={{
      display: "inline-flex", alignItems: "center", gap: 4,
      padding: "3px 8px", borderRadius: 7, fontSize: 11, fontWeight: 750,
      backgroundColor: cfg.color + "22", color: cfg.color,
      border: `1px solid ${cfg.color}44`,
    }}>
      {cfg.icon} {cfg.label}
    </span>
  );
}

function PlanBadge({ planId }: { planId?: string }) {
  const plan = getPlan(planId);
  return (
    <span style={{
      display: "inline-flex", alignItems: "center", gap: 4,
      padding: "3px 8px", borderRadius: 7, fontSize: 11, fontWeight: 750,
      backgroundColor: plan.color + "22", color: plan.color,
      border: `1px solid ${plan.color}44`,
    }}>
      {plan.emoji} {plan.label}
    </span>
  );
}

// ── Hesap içinde kullanıcı ekleme formu ──────────────────────────────────────
function AddUserForm({
  styles,
  account,
  companies,
  existingUsers,
  onCreated,
  onCancel,
}: {
  styles: Record<string, React.CSSProperties>;
  account: Account;
  companies: Props["companies"];
  existingUsers: UserProfile[];
  onCreated: (user: UserProfile) => void;
  onCancel: () => void;
}) {
  const [form, setForm] = useState({
    displayName: "",
    email: "",
    password: "",
    role: "doctor" as UserRole,
    companyIds: account.companyIds,
  });
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showPass, setShowPass] = useState(false);

  const accountPlan = getPlan(account.plan);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!form.role) {
      setError("❌ Lütfen bir rol seçin.");
      return;
    }

    // Rol limit kontrolü
    if (accountPlan.maxUsersPerRole !== -1) {
      const count = existingUsers.filter(u =>
        (u.roles?.length ? u.roles : [u.role]).includes(form.role) &&
        u.accountId === account.id
      ).length;
      if (count >= accountPlan.maxUsersPerRole) {
        setError(`❌ "${ROLE_CONFIG[form.role].label}" rolünde en fazla ${accountPlan.maxUsersPerRole} kullanıcı ekleyebilirsiniz (${accountPlan.label} paket).`);
        return;
      }
    }

    setCreating(true);
    let secondaryApp: ReturnType<typeof initializeApp> | null = null;
    try {
      secondaryApp = initializeApp(firebaseConfig, `add-user-${Date.now()}`);
      const secondaryAuth = getAuth(secondaryApp);
      const cred = await createUserWithEmailAndPassword(secondaryAuth, form.email, form.password);

      await setUserProfile(cred.user.uid, {
        email: form.email,
        displayName: form.displayName,
        role: form.role,
        roles: [form.role],
        companyIds: form.companyIds,
      });

      // accountId ata
      await updateDoc(doc(db, "users", cred.user.uid), {
        accountId: account.id,
        plan: account.plan,
      });

      await signOut(secondaryAuth);
      await deleteApp(secondaryApp);
      secondaryApp = null;

      onCreated({
        uid: cred.user.uid,
        email: form.email,
        displayName: form.displayName,
        role: form.role,
        roles: [form.role],
        activeRole: form.role,
        companyIds: form.companyIds,
        accountId: account.id,
        plan: account.plan,
        createdAt: null,
      });
    } catch (err: any) {
      setError(`❌ ${err.message}`);
    } finally {
      if (secondaryApp) await deleteApp(secondaryApp).catch(() => {});
      setCreating(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} style={{
      borderTop: "1px solid var(--isg-border)",
      padding: "16px 0 0",
      marginTop: 8,
      display: "grid", gap: 12,
    }}>
      <div style={{ fontSize: 12, fontWeight: 800, color: "var(--isg-text-muted)", textTransform: "uppercase" as const, letterSpacing: "0.06em" }}>
        Yeni Kullanıcı
      </div>

      {error && (
        <div style={{ fontSize: 12, color: "#fca5a5", backgroundColor: "#dc262615", border: "1px solid #dc262633", borderRadius: 7, padding: "8px 10px" }}>
          {error}
        </div>
      )}

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
        <div>
          <label style={styles.label}>Ad Soyad</label>
          <input style={styles.input} value={form.displayName} onChange={e => setForm(p => ({ ...p, displayName: e.target.value }))} required placeholder="Dr. Ahmet Yılmaz" />
        </div>
        <div>
          <label style={styles.label}>E-posta</label>
          <input style={styles.input} type="email" value={form.email} onChange={e => setForm(p => ({ ...p, email: e.target.value }))} required placeholder="ahmet@firma.com" />
        </div>
      </div>

      <div style={{ position: "relative" as const }}>
        <label style={styles.label}>Şifre</label>
        <input
          style={{ ...styles.input, paddingRight: 72 }}
          type={showPass ? "text" : "password"}
          value={form.password}
          onChange={e => setForm(p => ({ ...p, password: e.target.value }))}
          required minLength={6}
          placeholder="En az 6 karakter"
        />
        <button type="button" onClick={() => setShowPass(v => !v)} style={{
          position: "absolute" as const, right: 8, bottom: 6,
          border: "1px solid var(--isg-border)", backgroundColor: "var(--isg-input-bg)",
          color: "var(--isg-text)", borderRadius: 6, padding: "4px 8px", fontSize: 11, fontWeight: 700, cursor: "pointer",
        }}>
          {showPass ? "Gizle" : "Göster"}
        </button>
      </div>

      <div>
        <label style={styles.label}>Rol — sadece 1 seçin</label>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" as const }}>
          {ALL_ROLES.filter(r => r !== "admin").map(role => {
            const cfg = ROLE_CONFIG[role];
            const selected = form.role === role;
            const count = existingUsers.filter(u =>
              (u.roles?.length ? u.roles : [u.role]).includes(role) && u.accountId === account.id
            ).length;
            const atLimit = accountPlan.maxUsersPerRole !== -1 && count >= accountPlan.maxUsersPerRole;
            return (
              <label key={role} style={{
                display: "flex", alignItems: "center", gap: 6,
                cursor: atLimit && !selected ? "not-allowed" : "pointer",
                padding: "7px 12px", borderRadius: 8, fontSize: 12, fontWeight: 700,
                border: selected ? `2px solid ${cfg.color}` : "1px solid var(--isg-border)",
                backgroundColor: selected ? cfg.color + "22" : "var(--isg-input-bg)",
                color: selected ? cfg.color : atLimit ? "var(--isg-text-subtle)" : "var(--isg-text-muted)",
                opacity: atLimit && !selected ? 0.45 : 1,
                transition: "all 0.15s",
              }}>
                <input
                  type="radio"
                  name="userRole"
                  value={role}
                  checked={selected}
                  disabled={atLimit}
                  onChange={() => setForm(p => ({ ...p, role }))}
                  style={{ display: "none" }}
                />
                {selected && <span style={{ fontSize: 10 }}>●</span>}
                {cfg.icon} {cfg.label}
                {atLimit && !selected && <span style={{ fontSize: 10 }}>(dolu)</span>}
              </label>
            );
          })}
        </div>
      </div>

      <div style={{ display: "flex", gap: 8 }}>
        <button type="submit" disabled={creating} style={{
          height: 36, backgroundColor: "var(--isg-accent)", color: "#fff",
          border: "none", borderRadius: 8, padding: "0 20px",
          fontSize: 13, fontWeight: 800, cursor: creating ? "not-allowed" : "pointer",
          opacity: creating ? 0.65 : 1,
        }}>
          {creating ? "Oluşturuluyor..." : "✅ Kullanıcı Ekle"}
        </button>
        <button type="button" onClick={onCancel} style={styles.btnSecondary}>İptal</button>
      </div>
    </form>
  );
}

// ── Hesap kartı ──────────────────────────────────────────────────────────────
function AccountCard({
  account,
  users,
  companies,
  styles,
  onPlanChange,
  onDeleteAccount,
  onUserDeleted,
  onUserCreated,
}: {
  account: Account;
  users: UserProfile[];
  companies: Props["companies"];
  styles: Record<string, React.CSSProperties>;
  onPlanChange: (accountId: string, plan: PlanId) => void;
  onDeleteAccount: (account: Account) => void;
  onUserDeleted: (uid: string) => void;
  onUserCreated: (user: UserProfile) => void;
}) {
  const [showAddUser, setShowAddUser] = useState(false);
  const [deletingUid, setDeletingUid] = useState<string | null>(null);
  const accountUsers = users.filter(u => u.accountId === account.id);
  const plan = getPlan(account.plan);

  async function handleRemoveUser(user: UserProfile) {
    if (!confirm(`${user.displayName || user.email} kullanıcısını bu hesaptan kaldır?`)) return;
    setDeletingUid(user.uid);
    try {
      const token = await auth.currentUser?.getIdToken();
      const res = await fetch("/api/admin/delete-user", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ uid: user.uid }),
      });
      if (!res.ok) throw new Error((await res.json()).error || "Silinemedi");
      onUserDeleted(user.uid);
    } catch (e: any) {
      alert(`❌ ${e.message}`);
    } finally {
      setDeletingUid(null);
    }
  }

  return (
    <div style={{
      ...styles.card,
      border: "1px solid var(--isg-border)",
      borderRadius: 14,
      padding: 20,
      marginBottom: 16,
    }}>
      {/* Hesap başlığı */}
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 12, flexWrap: "wrap" as const, marginBottom: 16 }}>
        <div style={{ display: "grid", gap: 6 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <span style={{ fontSize: 18 }}>🏢</span>
            <span style={{ fontSize: 16, fontWeight: 900, color: "var(--isg-text)" }}>{account.name}</span>
          </div>
          {account.companyIds.length > 0 && (
            <div style={{ display: "flex", gap: 6, flexWrap: "wrap" as const }}>
              {account.companyIds.map(cid => {
                const c = companies.find(x => x.id === cid);
                return c ? (
                  <span key={cid} style={{ ...styles.badge, backgroundColor: "rgba(76,201,166,0.12)", color: "var(--isg-accent)", border: "1px solid rgba(76,201,166,0.24)", fontSize: 11 }}>
                    🏢 {c.nickName || c.officialName}
                  </span>
                ) : null;
              })}
            </div>
          )}
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" as const }}>
          <PlanBadge planId={account.plan} />
          <select
            value={account.plan}
            onChange={e => onPlanChange(account.id, e.target.value as PlanId)}
            style={{ height: 28, border: "1px solid var(--isg-border)", borderRadius: 7, backgroundColor: "var(--isg-input-bg)", color: "var(--isg-text)", padding: "0 8px", fontSize: 12, outline: "none" }}
          >
            {Object.values(PLANS).map(p => (
              <option key={p.id} value={p.id}>{p.emoji} {p.label}</option>
            ))}
          </select>
          <button
            onClick={() => onDeleteAccount(account)}
            style={{ ...styles.btnDanger, height: 28, padding: "0 10px", fontSize: 12 }}
          >
            Sil
          </button>
        </div>
      </div>

      {/* Limit bilgisi */}
      <div style={{ display: "flex", gap: 12, flexWrap: "wrap" as const, marginBottom: 14, fontSize: 12, color: "var(--isg-text-muted)" }}>
        <span>👤 {accountUsers.length} kullanıcı</span>
        <span>🏢 Firma: {limitLabel(plan.maxCompanies)}</span>
        <span>👥 Personel: {limitLabel(plan.maxEmployees)}</span>
        <span>🎭 Rol başına: {limitLabel(plan.maxUsersPerRole)}</span>
      </div>

      {/* Kullanıcı listesi */}
      {accountUsers.length > 0 ? (
        <div style={{ display: "grid", gap: 8, marginBottom: 12 }}>
          {accountUsers.map(user => {
            const userRoles = normalizeRoles(user).filter(r => r !== "admin");
            return (
              <div key={user.uid} style={{
                display: "flex", alignItems: "center", justifyContent: "space-between",
                gap: 12, padding: "10px 12px",
                backgroundColor: "var(--isg-input-bg)",
                border: "1px solid var(--isg-border)",
                borderRadius: 9,
                flexWrap: "wrap" as const,
              }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10, minWidth: 0 }}>
                  <div style={{
                    width: 32, height: 32, borderRadius: 8, flexShrink: 0,
                    backgroundColor: ROLE_CONFIG[userRoles[0] || "doctor"]?.color + "22" || "#33333322",
                    border: `1px solid ${ROLE_CONFIG[userRoles[0] || "doctor"]?.color + "44" || "#33333344"}`,
                    display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14,
                  }}>
                    {ROLE_CONFIG[userRoles[0] || "doctor"]?.icon || "👤"}
                  </div>
                  <div style={{ minWidth: 0 }}>
                    <div style={{ fontWeight: 750, fontSize: 13, color: "var(--isg-text)" }}>
                      {user.displayName || "—"}
                    </div>
                    <div style={{ fontSize: 11, color: "var(--isg-text-muted)", overflowWrap: "anywhere" }}>
                      {user.email}
                    </div>
                  </div>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" as const }}>
                  {userRoles.map(r => <RoleBadge key={r} role={r} />)}
                  <button
                    onClick={() => handleRemoveUser(user)}
                    disabled={deletingUid === user.uid}
                    style={{ ...styles.btnDanger, height: 26, padding: "0 8px", fontSize: 11, opacity: deletingUid === user.uid ? 0.6 : 1 }}
                  >
                    {deletingUid === user.uid ? "..." : "Sil"}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div style={{ color: "var(--isg-text-subtle)", fontSize: 12, marginBottom: 12, padding: "10px 0" }}>
          Henüz kullanıcı eklenmemiş.
        </div>
      )}

      {/* Kullanıcı ekle */}
      {showAddUser ? (
        <AddUserForm
          styles={styles}
          account={account}
          companies={companies}
          existingUsers={users}
          onCreated={(user) => { onUserCreated(user); setShowAddUser(false); }}
          onCancel={() => setShowAddUser(false)}
        />
      ) : (
        <button onClick={() => setShowAddUser(true)} style={{ ...styles.btnSecondary, fontSize: 12 }}>
          + Kullanıcı Ekle
        </button>
      )}
    </div>
  );
}

// ── Ana panel ────────────────────────────────────────────────────────────────
export function AdminUserPanel({ styles, companies }: Props) {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState<string | null>(null);
  const [showNewAccountForm, setShowNewAccountForm] = useState(false);
  const [newAccount, setNewAccount] = useState({ name: "", plan: "free" as PlanId, companyIds: [] as string[] });
  const [savingAccount, setSavingAccount] = useState(false);

  useEffect(() => { loadAll(); }, []);

  async function loadAll() {
    setLoading(true);
    // allSettled: biri hata verse bile diğeri yüklenir
    const [accountsResult, usersResult] = await Promise.allSettled([
      getAllAccounts(),
      getAllUsers(),
    ]);
    if (accountsResult.status === "fulfilled") setAccounts(accountsResult.value);
    else setStatus(`⚠️ Hesaplar yüklenemedi: ${accountsResult.reason?.message}`);
    if (usersResult.status === "fulfilled") setUsers(usersResult.value);
    else setStatus(s => s ? s + ` | Kullanıcılar: ${usersResult.reason?.message}` : `⚠️ Kullanıcılar yüklenemedi: ${usersResult.reason?.message}`);
    setLoading(false);
  }

  async function handleCreateAccount(e: React.FormEvent) {
    e.preventDefault();
    if (!newAccount.name.trim()) return;
    setSavingAccount(true);
    try {
      const account = await createAccount({
        name: newAccount.name.trim(),
        plan: newAccount.plan,
        companyIds: newAccount.companyIds,
      });
      setAccounts(prev => [...prev, account]);
      setNewAccount({ name: "", plan: "free", companyIds: [] });
      setShowNewAccountForm(false);
      setStatus(`✅ "${account.name}" hesabı oluşturuldu.`);
    } catch (e: any) {
      setStatus(`❌ ${e.message}`);
    } finally {
      setSavingAccount(false);
    }
  }

  async function handlePlanChange(accountId: string, plan: PlanId) {
    await updateAccount(accountId, { plan });
    setAccounts(prev => prev.map(a => a.id === accountId ? { ...a, plan } : a));
    // Hesaptaki tüm kullanıcıların planını da güncelle
    const accountUsers = users.filter(u => u.accountId === accountId);
    await Promise.all(accountUsers.map(u => updateUserPlan(u.uid, plan)));
    setUsers(prev => prev.map(u => u.accountId === accountId ? { ...u, plan } : u));
    setStatus(`✅ Paket güncellendi: ${PLANS[plan].emoji} ${PLANS[plan].label}`);
    setTimeout(() => setStatus(null), 3000);
  }

  async function handleDeleteAccount(account: Account) {
    const accountUsers = users.filter(u => u.accountId === account.id);
    const confirmed = confirm(
      `"${account.name}" hesabını silmek istediğinizden emin misiniz?\n` +
      (accountUsers.length > 0 ? `Bu hesaptaki ${accountUsers.length} kullanıcı da silinecek.` : "")
    );
    if (!confirmed) return;

    try {
      const token = await auth.currentUser?.getIdToken();
      // Kullanıcıları sil
      for (const user of accountUsers) {
        await fetch("/api/admin/delete-user", {
          method: "POST",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
          body: JSON.stringify({ uid: user.uid }),
        });
      }
      await deleteAccount(account.id);
      setAccounts(prev => prev.filter(a => a.id !== account.id));
      setUsers(prev => prev.filter(u => u.accountId !== account.id));
      setStatus(`✅ "${account.name}" hesabı silindi.`);
    } catch (e: any) {
      setStatus(`❌ ${e.message}`);
    }
  }

  // Admin kullanıcılar — accountId olsa da olmasa da hepsini göster
  const adminUsers = users.filter(u => normalizeRoles(u).includes("admin"));
  // Hesapsız, admin olmayan kullanıcılar
  const unassignedUsers = users.filter(u =>
    !u.accountId && !normalizeRoles(u).includes("admin")
  );

  if (loading) return <div style={{ color: "var(--isg-text-muted)", padding: 20 }}>Yükleniyor...</div>;

  return (
    <div>
      {/* Başlık */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20, flexWrap: "wrap" as const, gap: 10 }}>
        <p style={{ ...styles.sectionTitle, marginBottom: 0 }}>Müşteri Hesapları</p>
        <button
          onClick={() => setShowNewAccountForm(v => !v)}
          style={styles.btnPrimary}
        >
          {showNewAccountForm ? "İptal" : "+ Yeni Hesap"}
        </button>
      </div>

      {/* Durum mesajı */}
      {status && (
        <div style={{
          backgroundColor: status.startsWith("✅") ? "#16a34a15" : "#dc262615",
          border: `1px solid ${status.startsWith("✅") ? "#16a34a33" : "#dc262633"}`,
          borderRadius: 8, padding: "10px 14px", marginBottom: 16, fontSize: 13,
          color: status.startsWith("✅") ? "#86efac" : "#fca5a5",
        }}>
          {status}
        </div>
      )}

      {/* Yeni hesap formu */}
      {showNewAccountForm && (
        <div style={{ ...styles.card, marginBottom: 20 }}>
          <form onSubmit={handleCreateAccount} style={{ display: "grid", gap: 14 }}>
            <p style={{ ...styles.sectionTitle, marginBottom: 0 }}>Yeni Hesap Oluştur</p>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              <div>
                <label style={styles.label}>Müşteri / Hesap Adı *</label>
                <input
                  style={styles.input}
                  value={newAccount.name}
                  onChange={e => setNewAccount(p => ({ ...p, name: e.target.value }))}
                  required placeholder="Acıbadem Mobil"
                />
              </div>
              <div>
                <label style={styles.label}>Paket</label>
                <select
                  style={styles.select}
                  value={newAccount.plan}
                  onChange={e => setNewAccount(p => ({ ...p, plan: e.target.value as PlanId }))}
                >
                  {Object.values(PLANS).map(p => (
                    <option key={p.id} value={p.id}>{p.emoji} {p.label}</option>
                  ))}
                </select>
              </div>
            </div>
            <div>
              <label style={styles.label}>Bağlı Firmalar</label>
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap" as const }}>
                {companies.map(c => {
                  const checked = newAccount.companyIds.includes(c.id);
                  return (
                    <label key={c.id} style={{
                      display: "flex", alignItems: "center", gap: 5, cursor: "pointer",
                      padding: "5px 10px", borderRadius: 8, fontSize: 12, fontWeight: 700,
                      border: checked ? "1px solid rgba(76,201,166,0.5)" : "1px solid var(--isg-border)",
                      backgroundColor: checked ? "rgba(76,201,166,0.12)" : "var(--isg-input-bg)",
                      color: checked ? "var(--isg-accent)" : "var(--isg-text-muted)",
                    }}>
                      <input type="checkbox" checked={checked} style={{ display: "none" }} onChange={() => {
                        setNewAccount(p => ({
                          ...p,
                          companyIds: checked
                            ? p.companyIds.filter(id => id !== c.id)
                            : [...p.companyIds, c.id],
                        }));
                      }} />
                      🏢 {c.nickName || c.officialName}
                    </label>
                  );
                })}
                {companies.length === 0 && <span style={{ fontSize: 12, color: "var(--isg-text-muted)" }}>Henüz firma yok.</span>}
              </div>
            </div>
            <div>
              <button type="submit" disabled={savingAccount} style={{
                height: 40, backgroundColor: "var(--isg-accent)", color: "#fff",
                border: "none", borderRadius: 9, padding: "0 24px",
                fontSize: 13, fontWeight: 800, cursor: savingAccount ? "not-allowed" : "pointer",
                opacity: savingAccount ? 0.65 : 1,
                boxShadow: "0 4px 14px var(--isg-accent-glow)",
              }}>
                {savingAccount ? "Oluşturuluyor..." : "✅ Hesap Oluştur"}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Hesap kartları */}
      {accounts.length === 0 && !showNewAccountForm && (
        <div style={{ ...styles.card, textAlign: "center" as const, color: "var(--isg-text-muted)", padding: 32 }}>
          Henüz hesap yok. "+ Yeni Hesap" ile başlayın.
        </div>
      )}
      {accounts.map(account => (
        <AccountCard
          key={account.id}
          account={account}
          users={users}
          companies={companies}
          styles={styles}
          onPlanChange={handlePlanChange}
          onDeleteAccount={handleDeleteAccount}
          onUserDeleted={uid => setUsers(prev => prev.filter(u => u.uid !== uid))}
          onUserCreated={user => setUsers(prev => [...prev, user])}
        />
      ))}

      {/* Hesapsız kullanıcılar */}
      {unassignedUsers.length > 0 && (
        <div style={{ ...styles.card, marginTop: 8 }}>
          <p style={{ ...styles.sectionTitle, marginBottom: 12, color: "#f59e0b" }}>
            ⚠️ Hesaba Atanmamış Kullanıcılar ({unassignedUsers.length})
          </p>
          <div style={{ display: "grid", gap: 8 }}>
            {unassignedUsers.map(user => (
              <div key={user.uid} style={{
                display: "flex", alignItems: "center", justifyContent: "space-between",
                gap: 12, padding: "10px 12px",
                backgroundColor: "var(--isg-input-bg)",
                border: "1px solid var(--isg-border)", borderRadius: 9,
                flexWrap: "wrap" as const,
              }}>
                <div>
                  <div style={{ fontWeight: 750, fontSize: 13 }}>{user.displayName || user.email}</div>
                  <div style={{ fontSize: 11, color: "var(--isg-text-muted)" }}>{user.email}</div>
                </div>
                <div style={{ display: "flex", gap: 6, alignItems: "center", flexWrap: "wrap" as const }}>
                  {normalizeRoles(user).map(r => <RoleBadge key={r} role={r} />)}
                  <select
                    defaultValue=""
                    style={{ height: 28, border: "1px solid var(--isg-border)", borderRadius: 7, backgroundColor: "var(--isg-input-bg)", color: "var(--isg-text)", padding: "0 8px", fontSize: 11, outline: "none" }}
                    onChange={async e => {
                      const accountId = e.target.value;
                      if (!accountId) return;
                      await updateDoc(doc(db, "users", user.uid), { accountId });
                      setUsers(prev => prev.map(u => u.uid === user.uid ? { ...u, accountId } : u));
                      setStatus(`✅ ${user.displayName || user.email} hesaba atandı.`);
                      setTimeout(() => setStatus(null), 3000);
                    }}
                  >
                    <option value="">Hesaba Ata...</option>
                    {accounts.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
                  </select>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Admin kullanıcılar */}
      {adminUsers.length > 0 && (
        <div style={{ ...styles.card, marginTop: 16 }}>
          <p style={{ ...styles.sectionTitle, marginBottom: 12 }}>🛡️ Sistem Yöneticileri</p>
          <div style={{ display: "grid", gap: 8 }}>
            {adminUsers.map(user => {
              const isCurrentUser = user.uid === auth.currentUser?.uid;
              return (
                <div key={user.uid} style={{
                  display: "flex", alignItems: "center", justifyContent: "space-between",
                  gap: 12, padding: "10px 12px",
                  backgroundColor: "rgba(139,92,246,0.08)",
                  border: "1px solid rgba(139,92,246,0.25)", borderRadius: 9,
                }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <div style={{ fontSize: 20 }}>🛡️</div>
                    <div>
                      <div style={{ fontWeight: 750, fontSize: 13 }}>
                        {user.displayName || "—"}
                        {isCurrentUser && (
                          <span style={{ marginLeft: 6, fontSize: 10, fontWeight: 700, color: "#a78bfa", backgroundColor: "rgba(167,139,250,0.15)", border: "1px solid rgba(167,139,250,0.3)", borderRadius: 5, padding: "2px 6px" }}>
                            Sen
                          </span>
                        )}
                      </div>
                      <div style={{ fontSize: 11, color: "var(--isg-text-muted)" }}>{user.email}</div>
                    </div>
                  </div>
                  {isCurrentUser ? (
                    <span style={{ fontSize: 11, color: "var(--isg-text-subtle)" }}>Silinemez</span>
                  ) : (
                    <button
                      onClick={async () => {
                        if (!confirm(`${user.displayName || user.email} admin hesabını silmek istediğinizden emin misiniz?`)) return;
                        try {
                          const token = await auth.currentUser?.getIdToken();
                          const res = await fetch("/api/admin/delete-user", {
                            method: "POST",
                            headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
                            body: JSON.stringify({ uid: user.uid }),
                          });
                          const result = await res.json();
                          if (!res.ok) throw new Error(result.error || "Silinemedi");
                          setUsers(prev => prev.filter(u => u.uid !== user.uid));
                          setStatus(`✅ ${user.displayName || user.email} silindi.`);
                        } catch (e: any) {
                          setStatus(`❌ ${e.message}`);
                        }
                      }}
                      style={{ ...styles.btnDanger, height: 28, padding: "0 10px", fontSize: 12 }}
                    >
                      Sil
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      <div style={{ fontSize: 11, color: "#475569", marginTop: 16 }}>
        ⚠️ Kullanıcı silme işlemi Firebase Authentication hesabını kaldırır.
      </div>
    </div>
  );
}
