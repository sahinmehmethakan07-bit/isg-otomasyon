import { NextRequest, NextResponse } from "next/server";
import { getAdminDb } from "../../../../lib/firebaseAdmin";
import { requireAuthenticatedUser, securityErrorResponse } from "../../../../lib/serverSecurity";

export const runtime = "nodejs";

async function verifyAdmin(req: NextRequest) {
  await requireAuthenticatedUser(req, ["admin"]);
  return getAdminDb();
}

function cleanCompanyIds(value: unknown) {
  return Array.isArray(value)
    ? Array.from(new Set(value.filter((item): item is string => typeof item === "string" && item.length > 0)))
    : undefined;
}

function cleanPlan(value: unknown) {
  return value === "free" || value === "uzman" || value === "osgb" ? value : undefined;
}

function cleanPatch(data: Record<string, unknown>) {
  const patch: Record<string, unknown> = {};

  if (typeof data.name === "string" && data.name.trim()) {
    patch.name = data.name.trim();
  }

  const plan = cleanPlan(data.plan);
  if (plan) patch.plan = plan;

  const companyIds = cleanCompanyIds(data.companyIds);
  if (companyIds) patch.companyIds = companyIds;

  return patch;
}

// PATCH /api/admin/accounts/[id] — hesabı güncelle
export async function PATCH(req: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await context.params;
    const db = await verifyAdmin(req);
    const data = await req.json();
    const patch = cleanPatch(data);

    if (Object.keys(patch).length === 0) {
      return NextResponse.json({ error: "Güncellenecek geçerli alan yok." }, { status: 400 });
    }

    await db.collection("accounts").doc(id).update({
      ...patch,
      updatedAt: new Date().toISOString(),
    });
    return NextResponse.json({ success: true });
  } catch (e: any) {
    const securityResponse = securityErrorResponse(e);
    if (securityResponse) return securityResponse;
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

// DELETE /api/admin/accounts/[id] — hesabı sil
export async function DELETE(req: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await context.params;
    const db = await verifyAdmin(req);
    await db.collection("accounts").doc(id).delete();
    return NextResponse.json({ success: true });
  } catch (e: any) {
    const securityResponse = securityErrorResponse(e);
    if (securityResponse) return securityResponse;
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
