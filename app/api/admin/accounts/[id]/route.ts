import { NextRequest, NextResponse } from "next/server";
import { getAdminAuth, getAdminDb } from "../../../../lib/firebaseAdmin";

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

// PATCH /api/admin/accounts/[id] — hesabı güncelle
export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const db = await verifyAdmin(req);
    const data = await req.json();
    await db.collection("accounts").doc(params.id).update(data);
    return NextResponse.json({ success: true });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

// DELETE /api/admin/accounts/[id] — hesabı sil
export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const db = await verifyAdmin(req);
    await db.collection("accounts").doc(params.id).delete();
    return NextResponse.json({ success: true });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
