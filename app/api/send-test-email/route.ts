import { NextRequest, NextResponse } from "next/server";
import {
  assertRequestSize,
  enforceRateLimit,
  requireAuthenticatedUser,
  securityErrorResponse,
} from "../../lib/serverSecurity";

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function POST(req: NextRequest) {
  try {
    assertRequestSize(req, 16 * 1024);
    enforceRateLimit(req, "send-test-email", 3, 60_000);
    await requireAuthenticatedUser(req, ["admin"]);

    const { toEmail, ccEmail } = await req.json();
    if (typeof toEmail !== "string" || !EMAIL_PATTERN.test(toEmail) || toEmail.length > 254) {
      return NextResponse.json({ error: "Geçerli bir alıcı e-posta adresi gerekli" }, { status: 400 });
    }
    if (ccEmail && (typeof ccEmail !== "string" || !EMAIL_PATTERN.test(ccEmail) || ccEmail.length > 254)) {
      return NextResponse.json({ error: "Geçerli bir CC e-posta adresi gerekli" }, { status: 400 });
    }

    const apiKey = process.env.RESEND_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: "RESEND_API_KEY tanımlı değil" }, { status: 500 });
    }

    const html = `
      <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;">
        <div style="background:#1e293b;padding:20px;border-radius:8px 8px 0 0;">
          <h1 style="color:white;margin:0;font-size:20px;">ISG Otomasyon</h1>
          <p style="color:#94a3b8;margin:4px 0 0;font-size:14px;">Test E-postası</p>
        </div>
        <div style="border:1px solid #e2e8f0;border-top:none;padding:24px;border-radius:0 0 8px 8px;">
          <p style="font-size:14px;color:#334155;margin:0 0 8px;">Bu bir test e-postasıdır.</p>
          <p style="font-size:14px;color:#334155;margin:0 0 16px;">E-posta bildirimleri başarıyla yapılandırılmıştır. DÖF oluşturulduğunda otomatik bildirim bu adrese gönderilecektir.</p>
          <div style="margin-top:24px;padding:12px;background:#f0fdf4;border:1px solid #bbf7d0;border-radius:6px;">
            <p style="color:#16a34a;font-size:13px;margin:0;font-weight:600;">✅ E-posta yapılandırması başarılı</p>
          </div>
          <div style="margin-top:24px;padding-top:16px;border-top:1px solid #e2e8f0;">
            <p style="color:#94a3b8;font-size:12px;margin:0;">Bu bildirim ISG Otomasyon tarafından otomatik gönderilmiştir.</p>
          </div>
        </div>
      </div>`;

    const emailPayload: any = {
      from: "ISG Otomasyon <onboarding@resend.dev>",
      to: [toEmail],
      subject: "[ISG] Test E-postası — Bağlantı Başarılı",
      html,
    };
    if (ccEmail) emailPayload.cc = [ccEmail];

    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
      body: JSON.stringify(emailPayload),
    });

    const result = await response.json();

    if (!response.ok) {
      return NextResponse.json({ error: JSON.stringify(result) }, { status: response.status });
    }

    return NextResponse.json({ success: true, id: result.id });
  } catch (error: any) {
    const securityResponse = securityErrorResponse(error);
    if (securityResponse) return securityResponse;
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
