/**
 * roleManager.ts — Kullanıcı Rol Yönetimi
 *
 * Firestore "users" collection'ında her kullanıcı için:
 * - role: "admin" | "doctor" | "nurse" | "safety_expert" | "human_resources"
 * - companyIds: string[] (erişebileceği firma kayıtları)
 * - email: string
 * - displayName: string
 * - createdAt: timestamp
 *
 * Veri filtreleme mantığı:
 * - Admin: tüm verileri görür
 * - Diğer roller: sadece companyIds içinde yetkili olduğu firma verilerini görür
 */

import { db } from "../../lib/firebase";
import {
  doc,
  getDoc,
  setDoc,
  collection,
  query,
  where,
  getDocs,
  serverTimestamp,
} from "firebase/firestore";

// ── Tipler ───────────────────────────────────────────────────────────────────

export type UserRole = "admin" | "doctor" | "nurse" | "safety_expert" | "human_resources";

export type UserProfile = {
  uid: string;
  email: string;
  displayName: string;
  role: UserRole;
  roles: UserRole[];
  activeRole?: UserRole;
  companyIds: string[];
  activeCompanyId?: string;
  createdAt: any;
};

// ── Rol Bilgileri ────────────────────────────────────────────────────────────

export const ROLE_CONFIG: Record<
  UserRole,
  { label: string; icon: string; color: string; description: string }
> = {
  admin: {
    label: "Admin",
    icon: "🛡️",
    color: "#8b5cf6",
    description: "Tüm kullanıcıların verilerini görür ve yönetir",
  },
  doctor: {
    label: "Doktor",
    icon: "🩺",
    color: "#0ea5e9",
    description: "Sadece kendi eklediği verileri görür",
  },
  nurse: {
    label: "Hemşire",
    icon: "💉",
    color: "#10b981",
    description: "Sadece kendi eklediği verileri görür",
  },
  safety_expert: {
    label: "İş Güvenliği Uzmanı",
    icon: "🦺",
    color: "#f59e0b",
    description: "Sadece kendi eklediği verileri görür",
  },
  human_resources: {
    label: "İnsan Kaynakları",
    icon: "👥",
    color: "#ec4899",
    description: "Personel girişlerini ve onboarding sürecini yönetir",
  },
};

export function isUserRole(value: unknown): value is UserRole {
  return typeof value === "string" && value in ROLE_CONFIG;
}

export function normalizeUserProfile(uid: string, data: Record<string, any>): UserProfile {
  const role = isUserRole(data.role) ? data.role : "doctor";
  const rolesFromData = Array.isArray(data.roles)
    ? data.roles.filter(isUserRole)
    : [];
  const roles = Array.from(new Set(rolesFromData.length > 0 ? rolesFromData : [role]));
  const activeRole = isUserRole(data.activeRole) && roles.includes(data.activeRole)
    ? data.activeRole
    : roles[0];
  const companyIds = Array.isArray(data.companyIds)
    ? data.companyIds.filter((id: unknown): id is string => typeof id === "string" && id.length > 0)
    : [];
  const activeCompanyId = typeof data.activeCompanyId === "string" && companyIds.includes(data.activeCompanyId)
    ? data.activeCompanyId
    : companyIds[0] || "";

  return {
    uid,
    email: typeof data.email === "string" ? data.email : "",
    displayName: typeof data.displayName === "string" ? data.displayName : "",
    role: roles[0],
    roles,
    activeRole,
    companyIds,
    activeCompanyId,
    createdAt: data.createdAt || null,
  };
}

// ── Kullanıcı Profil İşlemleri ───────────────────────────────────────────────

/**
 * Kullanıcının rolünü Firestore'dan alır.
 * Yoksa null döner (kullanıcı henüz kayıtlı değil demektir).
 */
export async function getUserProfile(
  uid: string
): Promise<UserProfile | null> {
  try {
    const userDoc = await getDoc(doc(db, "users", uid));
    if (!userDoc.exists()) return null;
    return normalizeUserProfile(uid, userDoc.data());
  } catch (error) {
    console.error("[RoleManager] getUserProfile error:", error);
    return null;
  }
}

/**
 * Yeni kullanıcı profili oluşturur veya mevcudu günceller.
 * Admin tarafından kullanıcı oluştururken çağrılır.
 */
export async function setUserProfile(
  uid: string,
  data: { email: string; displayName: string; role: UserRole; roles?: UserRole[]; activeRole?: UserRole; companyIds?: string[]; activeCompanyId?: string }
): Promise<void> {
  const roles = data.roles?.length ? data.roles : [data.role];
  const companyIds = data.companyIds || [];
  await setDoc(
    doc(db, "users", uid),
    {
      ...data,
      role: roles[0],
      roles,
      activeRole: data.activeRole && roles.includes(data.activeRole) ? data.activeRole : roles[0],
      companyIds,
      activeCompanyId: data.activeCompanyId && companyIds.includes(data.activeCompanyId) ? data.activeCompanyId : companyIds[0] || "",
      createdAt: serverTimestamp(),
    },
    { merge: true }
  );
}

/**
 * Tüm kullanıcı profillerini getirir (Admin paneli için).
 */
export async function getAllUsers(): Promise<UserProfile[]> {
  const snap = await getDocs(collection(db, "users"));
  return snap.docs.map((d) => normalizeUserProfile(d.id, d.data()));
}

/**
 * Belirli roldeki kullanıcıları getirir.
 */
export async function getUsersByRole(role: UserRole): Promise<UserProfile[]> {
  const q = query(collection(db, "users"), where("role", "==", role));
  const snap = await getDocs(q);
  return snap.docs.map((d) => normalizeUserProfile(d.id, d.data()));
}

// ── Veri Filtreleme ──────────────────────────────────────────────────────────

/**
 * Kullanıcının rolüne göre Firestore query oluşturur.
 *
 * - Admin: filtre yok, tüm verileri çeker
 * - Operasyon koleksiyonları: tüm roller ortak veri havuzunu görür
 * - Diğer koleksiyonlar: admin/İK tümünü, diğer roller kendi kayıtlarını görür
 *
 * Kullanım:
 *   const q = getRoleFilteredQuery("companies", userProfile);
 *   const snap = await getDocs(q);
 */
export function getRoleFilteredQuery(
  collectionName: string,
  userProfile: UserProfile
) {
  const col = collection(db, collectionName);
  const sharedCollections = new Set([
    "companies",
    "employees",
    "documents",
    "observers",
    "dofs",
    "risks",
    "signers",
    "ek2forms",
  ]);

  const activeRole = userProfile.activeRole || userProfile.role;

  if (sharedCollections.has(collectionName) || activeRole === "admin" || activeRole === "human_resources") {
    return col; // filtre yok
  }

  // Kullanici sadece kendi roluyle ekledigi verileri gorur
  return query(col, where("createdBy", "==", userProfile.uid), where("createdAsRole", "==", activeRole));
}

export function isGlobalAdmin(userProfile: UserProfile) {
  return (userProfile.activeRole || userProfile.role) === "admin";
}

export function canAccessCompany(userProfile: UserProfile, companyId?: string | null) {
  if (isGlobalAdmin(userProfile)) return true;
  if (!companyId) return false;
  return (userProfile.companyIds || []).includes(companyId);
}

export function filterByCompanyAccess<T extends { id?: string; companyId?: string | null }>(
  collectionName: string,
  records: T[],
  userProfile: UserProfile
) {
  if (isGlobalAdmin(userProfile)) return records;
  const allowedCompanyIds = userProfile.companyIds || [];
  if (collectionName === "companies") {
    return records.filter(record => record.id && allowedCompanyIds.includes(record.id));
  }
  return records.filter(record => record.companyId && allowedCompanyIds.includes(record.companyId));
}

/**
 * Veri eklerken createdBy alanını otomatik ekler.
 * Bu fonksiyonu addDoc çağrılarından önce data'ya uygulayın.
 */
export function withCreatedBy<T extends Record<string, any>>(
  data: T,
  uid: string,
  activeRole?: UserRole
): T & { createdBy: string; createdAsRole: string; createdAt: any } {
  return {
    ...data,
    createdBy: uid,
    createdAsRole: activeRole || "admin",
    createdAt: serverTimestamp(),
  };
}
