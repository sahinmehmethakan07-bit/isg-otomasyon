import { NextRequest, NextResponse } from "next/server";
import { getAdminAuth, getAdminDb } from "../../../../lib/firebaseAdmin";
import { requireAuthenticatedUser, securityErrorResponse } from "../../../../lib/serverSecurity";

export const runtime = "nodejs";

function cleanPlan(value: unknown) {
  return value === "free" || value === "uzman" || value === "osgb" ? value : undefined;
}

export async function PATCH(req: NextRequest, context: { params: Promise<unknown> }) {
  try {
    await requireAuthenticatedUser(req, ["admin"]);

    const params = await context.params as { uid?: string };
    const uid = typeof params.uid === "string" ? params.uid : "";
    const body = await req.json();
    const db = getAdminDb();
    const patch: Record<string, unknown> = {};

    if (!uid) {
      return NextResponse.json({ error: "Kullanıcı uid gerekli." }, { status: 400 });
    }

    if (typeof body.accountId === "string" && body.accountId) {
      const accountSnap = await db.collection("accounts").doc(body.accountId).get();
      if (!accountSnap.exists) {
        return NextResponse.json({ error: "Hesap bulunamadı." }, { status: 404 });
      }
      patch.accountId = body.accountId;
    }

    const plan = cleanPlan(body.plan);
    if (plan) patch.plan = plan;

    if (Object.keys(patch).length === 0) {
      return NextResponse.json({ error: "Güncellenecek geçerli alan yok." }, { status: 400 });
    }

    patch.updatedAt = new Date().toISOString();
    await db.collection("users").doc(uid).update(patch);

    const userSnap = await db.collection("users").doc(uid).get();
    const data = userSnap.data() || {};
    const existingClaims = (await getAdminAuth().getUser(uid)).customClaims || {};

    await getAdminAuth().setCustomUserClaims(uid, {
      ...existingClaims,
      accountId: typeof data.accountId === "string" ? data.accountId : existingClaims.accountId,
      plan: typeof data.plan === "string" ? data.plan : existingClaims.plan,
    });

    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    const securityResponse = securityErrorResponse(error);
    if (securityResponse) return securityResponse;
    const message = error instanceof Error ? error.message : "Kullanıcı güncellenemedi.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
