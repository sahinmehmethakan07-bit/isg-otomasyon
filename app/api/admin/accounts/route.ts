import { NextRequest, NextResponse } from "next/server";
import { getAdminDb } from "../../../lib/firebaseAdmin";
import { requireAuthenticatedUser, securityErrorResponse } from "../../../lib/serverSecurity";

export const runtime = "nodejs";

async function verifyAdmin(req: NextRequest) {
  await requireAuthenticatedUser(req, ["admin"]);
  return getAdminDb();
}

function cleanCompanyIds(value: unknown) {
  return Array.isArray(value)
    ? Array.from(new Set(value.filter((item): item is string => typeof item === "string" && item.length > 0)))
    : [];
}

function cleanPlan(value: unknown) {
  return value === "free" || value === "uzman" || value === "osgb" ? value : "free";
}

// GET /api/admin/accounts — tüm hesapları listele
export async function GET(req: NextRequest) {
  try {
    const db = await verifyAdmin(req);
    const snap = await db.collection("accounts").get();
    const accounts = snap.docs.map(d => ({ id: d.id, ...d.data() }));
    return NextResponse.json({ accounts });
  } catch (e: any) {
    const securityResponse = securityErrorResponse(e);
    if (securityResponse) return securityResponse;
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

// POST /api/admin/accounts — yeni hesap oluştur
export async function POST(req: NextRequest) {
  try {
    const db = await verifyAdmin(req);
    const { name, plan, companyIds } = await req.json();
    if (!name?.trim()) return NextResponse.json({ error: "Hesap adı gerekli." }, { status: 400 });
    const ref = db.collection("accounts").doc();
    const payload = {
      name: name.trim(),
      plan: cleanPlan(plan),
      companyIds: cleanCompanyIds(companyIds),
      createdAt: new Date().toISOString(),
    };
    await ref.set(payload);
    return NextResponse.json({ account: { id: ref.id, ...payload } });
  } catch (e: any) {
    const securityResponse = securityErrorResponse(e);
    if (securityResponse) return securityResponse;
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
