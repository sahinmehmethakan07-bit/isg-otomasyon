import { NextRequest, NextResponse } from "next/server";
import { getAdminAuth, getAdminDb } from "../../../lib/firebaseAdmin";

export const runtime = "nodejs";

async function verifyAdmin(req: NextRequest) {
  const token = (req.headers.get("authorization") || "").replace("Bearer ", "");
  if (!token) throw new Error("Oturum doğrulaması gerekli.");
  const adminAuth = getAdminAuth();
  const adminDb = getAdminDb();
  const decoded = await adminAuth.verifyIdToken(token);
  const snap = await adminDb.collection("users").doc(decoded.uid).get();
  const data = snap.data();
  const roles = Array.isArray(data?.roles) ? data.roles : [data?.role || ""];
  if (!roles.includes("admin")) throw new Error("Admin yetkisi gerekli.");
  return adminDb;
}

// GET /api/admin/accounts — tüm hesapları listele
export async function GET(req: NextRequest) {
  try {
    const db = await verifyAdmin(req);
    const snap = await db.collection("accounts").get();
    const accounts = snap.docs.map(d => ({ id: d.id, ...d.data() }));
    return NextResponse.json({ accounts });
  } catch (e: any) {
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
      plan: plan || "free",
      companyIds: companyIds || [],
      createdAt: new Date().toISOString(),
    };
    await ref.set(payload);
    return NextResponse.json({ account: { id: ref.id, ...payload } });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
