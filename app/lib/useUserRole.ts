/**
 * useUserRole.ts — Kullanıcı Rol Hook'u
 *
 * Tüm bileşenlerde kullanıcının rolüne erişim sağlar.
 * Auth state değiştiğinde profili Firestore'dan çeker.
 */

"use client";

import { useEffect, useState } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { doc, updateDoc } from "firebase/firestore";
import { auth, db } from "../../lib/firebase";
import { getUserProfile, UserProfile } from "./roleManager";

type UseUserRoleReturn = {
  user: UserProfile | null;
  loading: boolean;
  isAdmin: boolean;
  isDoctor: boolean;
  isNurse: boolean;
  isHumanResources: boolean;
};

export function useUserRole(): UseUserRoleReturn {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (firebaseUser) => {
      if (!firebaseUser) {
        setUser(null);
        setLoading(false);
        return;
      }

      const profile = await getUserProfile(firebaseUser.uid);
      if (profile) {
        const storedRole = localStorage.getItem("isg_activeRole");
        const allowedRoles = profile.roles?.length ? profile.roles : [profile.role];
        let activeRole = allowedRoles.includes(storedRole as typeof profile.role) ? storedRole as typeof profile.role : profile.role;

        if (allowedRoles.includes("admin") && activeRole !== "admin" && (!profile.companyIds || profile.companyIds.length === 0)) {
          activeRole = "admin";
          localStorage.setItem("isg_activeRole", "admin");
          updateDoc(doc(db, "users", firebaseUser.uid), { activeRole: "admin" }).catch((error) => {
            console.error("[useUserRole] activeRole admin olarak güncellenemedi:", error);
          });
        }

        setUser({ ...profile, activeRole });
      } else {
        setUser(null);
      }
      setLoading(false);
    });

    return () => unsub();
  }, []);

  return {
    user,
    loading,
    isAdmin: user?.activeRole === "admin",
    isDoctor: user?.activeRole === "doctor",
    isNurse: user?.activeRole === "nurse",
    isHumanResources: user?.activeRole === "human_resources",
  };
}
