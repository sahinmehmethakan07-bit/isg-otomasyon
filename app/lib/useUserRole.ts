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
      setUser(profile);
      setLoading(false);
    });

    return () => unsub();
  }, []);

  return {
    user,
    loading,
    isAdmin: user?.role === "admin",
    isDoctor: user?.role === "doctor",
    isNurse: user?.role === "nurse",
  };
}
