/**
 * useSessionGuard.ts — React Hook: Oturum Koruma
 * 
 * Korumalı sayfalarda kullanılır.
 * - Sayfa yüklendiğinde oturum geçerliliğini kontrol eder
 * - Geçersizse login'e yönlendirir
 * - Periyodik olarak lastActivity günceller (oturum süresini yeniler)
 * - Firestore listener ile oturum silinirse (logout) yakalar
 */

"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "../../lib/firebase";
import {
  validateSession,
  updateSessionActivity,
  listenForSessionChanges,
} from "./sessionManager";

type SessionStatus = "checking" | "valid" | "expired" | "invalid";

export function useSessionGuard(): { status: SessionStatus } {
  const router = useRouter();
  const [status, setStatus] = useState<SessionStatus>("checking");
  const unsubRef = useRef<(() => void) | null>(null);
  const activityIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const handleSessionLost = useCallback(() => {
    setStatus("invalid");
    if (unsubRef.current) unsubRef.current();
    if (activityIntervalRef.current) clearInterval(activityIntervalRef.current);
    router.push("/login");
  }, [router]);

  useEffect(() => {
    let cancelled = false;

    const unsubAuth = onAuthStateChanged(auth, async (user) => {
      if (cancelled) return;

      if (!user) {
        setStatus("invalid");
        router.push("/login");
        return;
      }

      const result = await validateSession(user.uid);
      if (cancelled) return;

      if (!result.valid) {
        if (result.reason === "session_expired") {
          setStatus("expired");
          router.push("/login?reason=expired");
        } else {
          setStatus("invalid");
          router.push("/login");
        }
        return;
      }

      setStatus("valid");

      // Oturum silinirse yakala
      unsubRef.current = listenForSessionChanges(user.uid, handleSessionLost);

      // Periyodik activity güncellemesi
      activityIntervalRef.current = setInterval(() => {
        updateSessionActivity(user.uid);
      }, 5 * 60 * 1000);

      updateSessionActivity(user.uid);
    });

    return () => {
      cancelled = true;
      unsubAuth();
      if (unsubRef.current) unsubRef.current();
      if (activityIntervalRef.current) clearInterval(activityIntervalRef.current);
    };
  }, [router, handleSessionLost]);

  return { status };
}
