import { NextRequest, NextResponse } from "next/server";
import { getAdminAuth, getAdminDb } from "../../../lib/firebaseAdmin";
import { requireAuthenticatedUser, securityErrorResponse } from "../../../lib/serverSecurity";

export const runtime = "nodejs";

function rolesFrom(data: FirebaseFirestore.DocumentData | undefined) {
  if (!data) return [];
  const role = typeof data.role === "string" ? data.role : "";
  const roles = Array.isArray(data.roles) ? data.roles.filter((item): item is string => typeof item === "string") : [];
  return Array.from(new Set(roles.length > 0 ? roles : role ? [role] : []));
}

export async function POST(req: NextRequest) {
  try {
    const requester = await requireAuthenticatedUser(req, ["admin"]);

    const { uid } = await req.json();
    if (!uid || typeof uid !== "string") {
      return NextResponse.json({ error: "Silinecek kullanici uid gerekli." }, { status: 400 });
    }

    const adminAuth = getAdminAuth();
    const adminDb = getAdminDb();

    if (requester.uid === uid) {
      return NextResponse.json({ error: "Kendi hesabinizi buradan silemezsiniz." }, { status: 400 });
    }

    const targetRef = adminDb.collection("users").doc(uid);
    const targetSnap = await targetRef.get();
    const targetRoles = rolesFrom(targetSnap.data());

    if (targetRoles.includes("admin")) {
      const usersSnap = await adminDb.collection("users").get();
      const adminCount = usersSnap.docs.filter(doc => rolesFrom(doc.data()).includes("admin")).length;
      if (adminCount <= 1) {
        return NextResponse.json({ error: "Sistemde en az bir admin kalmali. Son admin silinemez." }, { status: 400 });
      }
    }

    let authDeleted = true;
    try {
      await adminAuth.deleteUser(uid);
    } catch (error: any) {
      if (error?.code === "auth/user-not-found") {
        authDeleted = false;
      } else {
        throw error;
      }
    }

    await targetRef.delete();

    return NextResponse.json({ success: true, authDeleted });
  } catch (error: any) {
    const securityResponse = securityErrorResponse(error);
    if (securityResponse) return securityResponse;
    return NextResponse.json({ error: error?.message || "Kullanici silinemedi." }, { status: 500 });
  }
}
