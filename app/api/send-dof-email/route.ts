import { NextRequest, NextResponse } from "next/server";
import type { Firestore } from "firebase-admin/firestore";
import { getAdminDb } from "../../lib/firebaseAdmin";
import {
  assertRequestSize,
  enforceRateLimit,
  escapeHtml,
  requireAuthenticatedUser,
  securityErrorResponse,
} from "../../lib/serverSecurity";
import { formatDate, formatDateShort } from "../../lib/dateUtils";

type EmailPayload = {
  from: string;
  to: string[];
  subject: string;
  html: string;
  cc?: string[];
  attachments?: Array<{ filename: string; content: string }>;
};

function stringField(record: Record<string, unknown>, field: string) {
  return typeof record[field] === "string" ? record[field] : "";
}

function dateField(record: Record<string, unknown>, field: string) {
  const value = record[field];
  return value instanceof Date || typeof value === "string" || typeof value === "number" ? value : undefined;
}

function errorMessage(error: unknown) {
  return error instanceof Error ? error.message : "İşlem tamamlanamadı.";
}

export async function POST(req: NextRequest) {
  try {
    assertRequestSize(req, 12 * 1024 * 1024);
    enforceRateLimit(req, "send-dof-email", 10, 60_000);
    const user = await requireAuthenticatedUser(req);
    const db = getAdminDb();

    const { dofId, pdfBase64 } = await req.json();
    if (typeof dofId !== "string" || !dofId || dofId.length > 128) {
      return NextResponse.json({ error: "Geçerli bir dofId gerekli" }, { status: 400 });
    }
    if (pdfBase64 && (typeof pdfBase64 !== "string" || pdfBase64.length > 10 * 1024 * 1024)) {
      return NextResponse.json({ error: "PDF boyutu izin verilen sınırı aşıyor" }, { status: 413 });
    }

    // 1. Email ayarlarini oku
    const settingsSnap = await db.collection("settings").doc("emailNotifications").get();
    if (!settingsSnap.exists) {
      return NextResponse.json({ error: "Email ayarlari bulunamadi" }, { status: 404 });
    }
    const settings = settingsSnap.data() as Record<string, unknown>;
    if (!settings.enabled) {
      return NextResponse.json({ message: "Email bildirimi pasif" }, { status: 200 });
    }
    const toEmail = stringField(settings, "toEmail");
    const ccEmail = stringField(settings, "ccEmail");
    const message = stringField(settings, "message");
    const subjectTemplate = stringField(settings, "subject") || "[ISG] Yeni DOF Bildirimi";

    if (!toEmail) {
      return NextResponse.json({ error: "Alici email adresi tanimli degil" }, { status: 400 });
    }

    // 2. DOF kaydini oku
    const dofSnap = await db.collection("dofs").doc(dofId).get();
    if (!dofSnap.exists) {
      return NextResponse.json({ error: "DOF kaydi bulunamadi" }, { status: 404 });
    }
    const dof = dofSnap.data() as Record<string, unknown>;
    const dofCompanyId = stringField(dof, "companyId");
    const dofTitle = stringField(dof, "title");
    const dofPriority = stringField(dof, "priority") || "Orta";

    if (!user.roles.includes("admin") && (!dofCompanyId || !user.companyIds.includes(dofCompanyId))) {
      return NextResponse.json({ error: "Bu DÖF kaydı için yetkiniz yok." }, { status: 403 });
    }

    // 3. Firma bilgisi
    let companyName = "—";
    if (dofCompanyId) {
      const compSnap = await db.collection("companies").doc(dofCompanyId).get();
      if (compSnap.exists) {
        const company = compSnap.data() as Record<string, unknown>;
        companyName = stringField(company, "officialName") || stringField(company, "nickName") || companyName;
      }
    }

    // 4. Konu hazirla
    const subject = subjectTemplate
      .replace("{dofTitle}", dofTitle)
      .replace("{companyName}", companyName);

    // 5. Kisa HTML govde (PDF ekte)
    const html = `
      <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;">
        <div style="background:#FFFFFF;padding:20px;border-radius:8px 8px 0 0;">
          <h1 style="color:white;margin:0;font-size:20px;">ISG Otomasyon</h1>
          <p style="color:#6B7280;margin:4px 0 0;font-size:14px;">DOF Bildirimi</p>
        </div>
        <div style="border:1px solid #e2e8f0;border-top:none;padding:24px;border-radius:0 0 8px 8px;">
          <p style="font-size:14px;color:#334155;margin:0 0 8px;">Sayin Yetkili,</p>
          <p style="font-size:14px;color:#334155;margin:0 0 16px;"><strong>${escapeHtml(companyName)}</strong> firmasina ait yeni bir DOF kaydi olusturulmustur.</p>
          <p style="font-size:14px;color:#334155;margin:0 0 8px;"><strong>Baslik:</strong> ${escapeHtml(dofTitle)}</p>
          <p style="font-size:14px;color:#334155;margin:0 0 8px;"><strong>Oncelik:</strong> ${escapeHtml(dofPriority)}</p>
          <p style="font-size:14px;color:#334155;margin:0 0 8px;"><strong>Termin:</strong> ${escapeHtml(formatDate(dateField(dof, "dueDate")))}</p>
          ${message ? `<p style="font-size:14px;color:#334155;margin:16px 0 0;padding:12px;background:#1A1A1A;border-radius:6px;border:1px solid #e2e8f0;">${escapeHtml(message)}</p>` : ""}
          <p style="font-size:13px;color:#6B7280;margin:20px 0 0;">Detayli bilgi icin ekteki PDF dosyasini inceleyiniz.</p>
          <div style="margin-top:24px;padding-top:16px;border-top:1px solid #e2e8f0;">
            <p style="color:#6B7280;font-size:12px;margin:0;">Bu bildirim ISG Otomasyon tarafindan otomatik gonderilmistir.</p>
          </div>
        </div>
      </div>`;

    // 6. Resend ile gonder (PDF ek olarak)
    const apiKey = process.env.RESEND_API_KEY;
    if (!apiKey) {
      await logEmail(db, dofId, toEmail, "failed", "RESEND_API_KEY yok");
      return NextResponse.json({ error: "RESEND_API_KEY tanimli degil" }, { status: 500 });
    }

    const today = formatDateShort(new Date()).replace(/\./g, "_");
    const emailPayload: EmailPayload = {
      from: "ISG Otomasyon <onboarding@resend.dev>",
      to: [toEmail],
      subject,
      html,
    };
    if (ccEmail) emailPayload.cc = [ccEmail];

    // PDF eki ekle
    if (pdfBase64) {
      emailPayload.attachments = [{
        filename: `DOF_${dofId.substring(0, 8)}_${today}.pdf`,
        content: pdfBase64,
      }];
    }

    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
      body: JSON.stringify(emailPayload),
    });

    const result = await response.json() as Record<string, unknown>;

    if (!response.ok) {
      await logEmail(db, dofId, toEmail, "failed", JSON.stringify(result));
      return NextResponse.json({ error: result }, { status: response.status });
    }

    // 7. DOF durumunu guncelle
    await db.collection("dofs").doc(dofId).update({ status: "Bildirildi" });

    // 8. Basarili log
    const resultId = stringField(result, "id");
    await logEmail(db, dofId, toEmail, "success", resultId);

    return NextResponse.json({ success: true, id: resultId });
  } catch (error: unknown) {
    const securityResponse = securityErrorResponse(error);
    if (securityResponse) return securityResponse;
    return NextResponse.json({ error: errorMessage(error) }, { status: 500 });
  }
}

async function logEmail(fireDb: Firestore, dofId: string, to: string, status: string, detail: string) {
  try {
    await fireDb.collection("emailLogs").add({
      dofId, to, status, detail, createdAt: new Date().toISOString(),
    });
  } catch (e) { console.error("Log yazilamadi:", e); }
}
