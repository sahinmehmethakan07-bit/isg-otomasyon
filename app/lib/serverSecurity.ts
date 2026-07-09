import { NextRequest, NextResponse } from "next/server";
import { getAdminAuth, getAdminDb } from "./firebaseAdmin";

export class ApiSecurityError extends Error {
  constructor(
    public readonly status: number,
    message: string,
  ) {
    super(message);
  }
}

type RateLimitEntry = { count: number; resetAt: number };
const rateLimits = new Map<string, RateLimitEntry>();

function clientIp(req: NextRequest) {
  return (req.headers.get("x-forwarded-for") || "unknown").split(",")[0].trim();
}

export function assertRequestSize(req: NextRequest, maxBytes: number) {
  const contentLength = Number(req.headers.get("content-length") || "0");
  if (Number.isFinite(contentLength) && contentLength > maxBytes) {
    throw new ApiSecurityError(413, "İstek boyutu izin verilen sınırı aşıyor.");
  }
}

export function enforceRateLimit(
  req: NextRequest,
  scope: string,
  maxRequests: number,
  windowMs: number,
) {
  const now = Date.now();
  const key = `${scope}:${clientIp(req)}`;
  const current = rateLimits.get(key);

  if (!current || current.resetAt <= now) {
    rateLimits.set(key, { count: 1, resetAt: now + windowMs });
    return;
  }

  if (current.count >= maxRequests) {
    throw new ApiSecurityError(429, "Çok fazla istek gönderildi. Lütfen daha sonra tekrar deneyin.");
  }

  current.count += 1;
}

export async function requireAuthenticatedUser(
  req: NextRequest,
  allowedRoles?: string[],
) {
  const authorization = req.headers.get("authorization") || "";
  const match = authorization.match(/^Bearer (.+)$/);
  if (!match) throw new ApiSecurityError(401, "Oturum doğrulaması gerekli.");

  try {
    const decoded = await getAdminAuth().verifyIdToken(match[1], true);
    const profile = await getAdminDb().collection("users").doc(decoded.uid).get();
    if (!profile.exists) throw new ApiSecurityError(403, "Kullanıcı profili bulunamadı.");

    const data = profile.data();
    const roles = Array.isArray(data?.roles)
      ? data.roles.filter((role: unknown): role is string => typeof role === "string")
      : typeof data?.role === "string"
        ? [data.role]
        : [];

    if (allowedRoles && !roles.some(role => allowedRoles.includes(role))) {
      throw new ApiSecurityError(403, "Bu işlem için yetkiniz yok.");
    }

    const companyIds = Array.isArray(data?.companyIds)
      ? data.companyIds.filter((companyId: unknown): companyId is string => typeof companyId === "string")
      : [];
    const accountId = typeof data?.accountId === "string" ? data.accountId : undefined;

    return { uid: decoded.uid, roles, companyIds, accountId };
  } catch (error) {
    if (error instanceof ApiSecurityError) throw error;
    throw new ApiSecurityError(401, "Oturum doğrulanamadı.");
  }
}

export function securityErrorResponse(error: unknown) {
  if (error instanceof ApiSecurityError) {
    return NextResponse.json({ error: error.message }, { status: error.status });
  }
  return null;
}

export function escapeHtml(value: unknown) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}
