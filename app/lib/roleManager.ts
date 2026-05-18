/**
 * roleManager.ts — Kullanıcı Rol Yönetimi
 *
 * Firestore "users" collection'ında her kullanıcı için:
 * - role: "admin" | "doctor" | "nurse" | "safety_expert" | "human_resources"
 * - email: string
 * - displayName: string
 * - createdAt: timestamp
 *
 * Veri filtreleme mantığı:
 * - Admin: tüm verileri görür
 * - Doktor/Hemşire/İSG/İK: sadece kendi eklediği verileri görür
 *   (her document'a "createdBy" alanı eklenir)
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
    return { uid, ...userDoc.data() } as UserProfile;
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
  data: { email: string; displayName: string; role: UserRole; roles?: UserRole[]; activeRole?: UserRole }
): Promise<void> {
  const roles = data.roles?.length ? data.roles : [data.role];
  await setDoc(
    doc(db, "users", uid),
    {
      ...data,
      role: roles[0],
      roles,
      activeRole: data.activeRole && roles.includes(data.activeRole) ? data.activeRole : roles[0],
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
  return snap.docs.map((d) => ({ uid: d.id, ...d.data() } as UserProfile));
}

/**
 * Belirli roldeki kullanıcıları getirir.
 */
export async function getUsersByRole(role: UserRole): Promise<UserProfile[]> {
  const q = query(collection(db, "users"), where("role", "==", role));
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ uid: d.id, ...d.data() } as UserProfile));
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

  if (sharedCollections.has(collectionName) || activeRole === "admin" || activeRole === "human_resources" || userProfile.role === "admin" || userProfile.role === "human_resources") {
    return col; // filtre yok
  }

  // Kullanici sadece kendi roluyle ekledigi verileri gorur
  return query(col, where("createdBy", "==", userProfile.uid), where("createdAsRole", "==", activeRole));
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
