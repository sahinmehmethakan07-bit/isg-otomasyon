/**
 * roleManager.ts — Kullanıcı Rol Yönetimi
 *
 * Firestore "users" collection'ında her kullanıcı için:
 * - role: "admin" | "doctor" | "nurse"
 * - email: string
 * - displayName: string
 * - createdAt: timestamp
 *
 * Veri filtreleme mantığı:
 * - Admin: tüm verileri görür
 * - Doktor/Hemşire: sadece kendi eklediği verileri görür
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

export type UserRole = "admin" | "doctor" | "nurse";

export type UserProfile = {
  uid: string;
  email: string;
  displayName: string;
  role: UserRole;
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
  data: { email: string; displayName: string; role: UserRole }
): Promise<void> {
  await setDoc(
    doc(db, "users", uid),
    {
      ...data,
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
 * - Doctor/Nurse: createdBy == uid olan kayıtları çeker
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

  if (userProfile.role === "admin") {
    return col; // filtre yok
  }

  // Doctor ve Nurse sadece kendi verilerini görür
  return query(col, where("createdBy", "==", userProfile.uid));
}

/**
 * Veri eklerken createdBy alanını otomatik ekler.
 * Bu fonksiyonu addDoc çağrılarından önce data'ya uygulayın.
 */
export function withCreatedBy<T extends Record<string, any>>(
  data: T,
  uid: string
): T & { createdBy: string; createdAt: any } {
  return {
    ...data,
    createdBy: uid,
    createdAt: serverTimestamp(),
  };
}
