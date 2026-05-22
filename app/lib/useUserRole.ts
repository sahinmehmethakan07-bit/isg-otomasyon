/**
 * useUserRole.ts — Kullanıcı Rol Hook'u
 *
 * Tüm bileşenlerde kullanıcının rolüne erişim sağlar.
 * Auth state değiştiğinde profili Firestore'dan çeker.
 */

"use client";

import { useEffect, useState } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "../../lib/firebase";
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
        const allowedRoles = profile.roles?.length ? profile.roles : [profile.role];
        const activeRole = profile.activeRole && allowedRoles.includes(profile.activeRole) ? profile.activeRole : profile.role;
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
