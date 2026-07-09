import { NextRequest, NextResponse } from "next/server";
import { getAdminAuth, getAdminDb } from "../../../lib/firebaseAdmin";
import { requireAuthenticatedUser, securityErrorResponse } from "../../../lib/serverSecurity";

export const runtime = "nodejs";

const ALLOWED_ROLES = new Set(["doctor", "safety_expert", "nurse", "human_resources"]);

function cleanCompanyIds(value: unknown) {
  return Array.isArray(value)
    ? Array.from(new Set(value.filter((item): item is string => typeof item === "string" && item.length > 0)))
    : [];
}

function cleanPlan(value: unknown) {
  return value === "free" || value === "uzman" || value === "osgb" ? value : "free";
}

export async function POST(req: NextRequest) {
  let createdUid: string | null = null;

  try {
    await requireAuthenticatedUser(req, ["admin"]);

    const body = await req.json();
    const email = typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
    const password = typeof body.password === "string" ? body.password : "";
    const displayName = typeof body.displayName === "string" ? body.displayName.trim() : "";
    const role = typeof body.role === "string" && ALLOWED_ROLES.has(body.role) ? body.role : "";
    const accountId = typeof body.accountId === "string" ? body.accountId : "";
    const plan = cleanPlan(body.plan);
    const companyIds = cleanCompanyIds(body.companyIds);

    if (!email || !password || password.length < 6 || !displayName || !role || !accountId) {
      return NextResponse.json({ error: "E-posta, şifre, ad soyad, rol ve hesap zorunludur." }, { status: 400 });
    }

    const adminAuth = getAdminAuth();
    const adminDb = getAdminDb();
    const accountSnap = await adminDb.collection("accounts").doc(accountId).get();

    if (!accountSnap.exists) {
      return NextResponse.json({ error: "Hesap bulunamadı." }, { status: 404 });
    }

    const account = accountSnap.data();
    const allowedCompanyIds = Array.isArray(account?.companyIds) ? account.companyIds : [];
    const invalidCompanyId = companyIds.find(companyId => !allowedCompanyIds.includes(companyId));

    if (invalidCompanyId) {
      return NextResponse.json({ error: "Kullanıcı sadece hesaba bağlı firmalara atanabilir." }, { status: 400 });
    }

    const userRecord = await adminAuth.createUser({
      email,
      password,
      displayName,
      emailVerified: false,
      disabled: false,
    });
    createdUid = userRecord.uid;

    await adminAuth.setCustomUserClaims(createdUid, {
      roles: [role],
      accountId,
      companyIds,
      plan,
    });

    const payload = {
      uid: createdUid,
      email,
      displayName,
      role,
      roles: [role],
      activeRole: role,
      companyIds,
      accountId,
      plan,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    await adminDb.collection("users").doc(createdUid).set(payload);

    return NextResponse.json({ user: payload });
  } catch (error: any) {
    if (createdUid) {
      await getAdminAuth().deleteUser(createdUid).catch(() => {});
    }
    const securityResponse = securityErrorResponse(error);
    if (securityResponse) return securityResponse;
    return NextResponse.json({ error: error?.message || "Kullanıcı oluşturulamadı." }, { status: 500 });
  }
}
