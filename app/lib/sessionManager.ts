/**
 * sessionManager.ts — Tek Oturum / Tek Cihaz Yönetimi
 * 
 * STRATEJİ: "İLK GİRİŞ KAZANIR"
 * - Aktif oturum varken başka cihazdan giriş ENGELLENİR
 * - Giriş yapabilmek için önce açık cihazdan çıkış yapılmalı
 * - Hayalet oturum koruması: 12 saat sonra oturum otomatik düşer
 * 
 * Firestore collection: "sessions"
 * Document ID: user.uid
 */

import { db } from "../../lib/firebase";
import {
  doc,
  getDoc,
  setDoc,
  deleteDoc,
  serverTimestamp,
  onSnapshot,
  Unsubscribe,
} from "firebase/firestore";

// ── Tipler ───────────────────────────────────────────────────────────────────

export type SessionData = {
  userId: string;
  sessionToken: string;
  fingerprint: string;
  ip: string;
  userAgent: string;
  screenResolution: string;
  loginTime: any;
  lastActivity: any;
  expiresAt: number;
};

// ── Sabitler ─────────────────────────────────────────────────────────────────

const SESSION_COLLECTION = "sessions";
const SESSION_MAX_AGE_MS = 12 * 60 * 60 * 1000;
const SESSION_COOKIE_NAME = "isg_session";
const ACTIVITY_UPDATE_INTERVAL_MS = 5 * 60 * 1000;

// ── Yardımcılar ──────────────────────────────────────────────────────────────

export function generateFingerprint(): string {
  if (typeof window === "undefined") return "server";
  const components = [
    navigator.userAgent,
    `${screen.width}x${screen.height}`,
    screen.colorDepth?.toString() || "",
    navigator.language,
    Intl.DateTimeFormat().resolvedOptions().timeZone,
    navigator.hardwareConcurrency?.toString() || "",
  ];
  const raw = components.join("|");
  let hash = 5381;
  for (let i = 0; i < raw.length; i++) {
    hash = ((hash << 5) + hash + raw.charCodeAt(i)) & 0xffffffff;
  }
  return `fp_${Math.abs(hash).toString(36)}`;
}

export function generateSessionToken(): string {
  if (typeof crypto !== "undefined" && crypto.randomUUID) {
    return `st_${crypto.randomUUID()}_${Date.now().toString(36)}`;
  }
  const bytes = new Uint8Array(32);
  crypto.getRandomValues(bytes);
  const hex = Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("");
  return `st_${hex}_${Date.now().toString(36)}`;
}

export async function getClientIP(): Promise<string> {
  try {
    const apis = ["https://api.ipify.org?format=json", "https://ipapi.co/json/"];
    for (const api of apis) {
      try {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 3000);
        const res = await fetch(api, { signal: controller.signal });
        clearTimeout(timeout);
        if (res.ok) {
          const data = await res.json();
          return data.ip || "unknown";
        }
      } catch { continue; }
    }
    return "unknown";
  } catch { return "unknown"; }
}

// ── Ana Fonksiyonlar ─────────────────────────────────────────────────────────

/**
 * Aktif oturum var mı kontrol eder.
 * Varsa giriş ENGELLENİR. Süresi dolmuşsa temizler ve izin verir.
 */
export async function checkExistingSession(
  userId: string
): Promise<{ blocked: boolean; reason?: string }> {
  try {
    const sessionDoc = await getDoc(doc(db, SESSION_COLLECTION, userId));

    if (!sessionDoc.exists()) {
      return { blocked: false };
    }

    const session = sessionDoc.data() as SessionData;

    // Süresi dolmuş hayalet oturum → temizle, giriş serbest
    if (Date.now() > session.expiresAt) {
      await deleteDoc(doc(db, SESSION_COLLECTION, userId));
      return { blocked: false };
    }

    // Aktif oturum var → ENGELle
    return {
      blocked: true,
      reason: "Bu hesap şu anda başka bir cihazda aktif. Giriş yapabilmek için önce diğer cihazdan çıkış yapın.",
    };
  } catch (error) {
    console.error("[SessionManager] Check error:", error);
    return { blocked: false };
  }
}

/**
 * Oturum kaydı oluşturur. checkExistingSession() ile kontrol yapılmış olmalı!
 */
export async function createSession(userId: string): Promise<string> {
  const sessionToken = generateSessionToken();
  const fingerprint = generateFingerprint();
  const ip = await getClientIP();

  const sessionData: SessionData = {
    userId,
    sessionToken,
    fingerprint,
    ip,
    userAgent: navigator.userAgent,
    screenResolution: `${screen.width}x${screen.height}`,
    loginTime: serverTimestamp(),
    lastActivity: serverTimestamp(),
    expiresAt: Date.now() + SESSION_MAX_AGE_MS,
  };

  await setDoc(doc(db, SESSION_COLLECTION, userId), sessionData);
  setSessionCookie(sessionToken);
  return sessionToken;
}

/**
 * Mevcut oturumun geçerli olup olmadığını kontrol eder.
 */
export async function validateSession(
  userId: string
): Promise<{ valid: boolean; reason?: string }> {
  const cookieToken = getSessionCookie();
  if (!cookieToken) return { valid: false, reason: "no_cookie" };

  try {
    const sessionDoc = await getDoc(doc(db, SESSION_COLLECTION, userId));
    if (!sessionDoc.exists()) return { valid: false, reason: "no_session" };

    const session = sessionDoc.data() as SessionData;

    if (session.sessionToken !== cookieToken) {
      clearSessionCookie();
      return { valid: false, reason: "token_mismatch" };
    }

    if (Date.now() > session.expiresAt) {
      await destroySession(userId);
      return { valid: false, reason: "session_expired" };
    }

    return { valid: true };
  } catch (error) {
    console.error("[SessionManager] Validation error:", error);
    return { valid: false, reason: "validation_error" };
  }
}

/**
 * lastActivity günceller + oturum süresini yeniler.
 */
let lastActivityUpdate = 0;

export async function updateSessionActivity(userId: string): Promise<void> {
  const now = Date.now();
  if (now - lastActivityUpdate < ACTIVITY_UPDATE_INTERVAL_MS) return;
  lastActivityUpdate = now;

  try {
    const sessionRef = doc(db, SESSION_COLLECTION, userId);
    const sessionDoc = await getDoc(sessionRef);
    if (!sessionDoc.exists()) return;

    const session = sessionDoc.data() as SessionData;
    const cookieToken = getSessionCookie();

    if (session.sessionToken === cookieToken) {
      await setDoc(sessionRef, {
        lastActivity: serverTimestamp(),
        expiresAt: Date.now() + SESSION_MAX_AGE_MS,
      }, { merge: true });
    }
  } catch (error) {
    console.error("[SessionManager] Activity update error:", error);
  }
}

/**
 * Oturumu sonlandırır (logout). Bunu yapmadan başka cihaz giremez!
 */
export async function destroySession(userId: string): Promise<void> {
  try {
    await deleteDoc(doc(db, SESSION_COLLECTION, userId));
  } catch (error) {
    console.error("[SessionManager] Destroy error:", error);
  }
  clearSessionCookie();
}

/**
 * Oturum silinirse (başka yerden logout) dinler.
 */
export function listenForSessionChanges(
  userId: string,
  onSessionDestroyed: () => void
): Unsubscribe {
  const cookieToken = getSessionCookie();
  return onSnapshot(doc(db, SESSION_COLLECTION, userId), (snapshot) => {
    if (!snapshot.exists()) {
      clearSessionCookie();
      onSessionDestroyed();
      return;
    }
    const session = snapshot.data() as SessionData;
    if (session.sessionToken !== cookieToken) {
      clearSessionCookie();
      onSessionDestroyed();
    }
  });
}

// ── Cookie ───────────────────────────────────────────────────────────────────

function setSessionCookie(token: string): void {
  const maxAge = SESSION_MAX_AGE_MS / 1000;
  const secure = window.location.protocol === "https:" ? ";Secure" : "";
  document.cookie = `${SESSION_COOKIE_NAME}=${token};path=/;max-age=${maxAge};SameSite=Strict${secure}`;
}

export function getSessionCookie(): string | null {
  const match = document.cookie.match(new RegExp(`(?:^|; )${SESSION_COOKIE_NAME}=([^;]*)`));
  return match ? match[1] : null;
}

function clearSessionCookie(): void {
  document.cookie = `${SESSION_COOKIE_NAME}=;path=/;max-age=0`;
}
