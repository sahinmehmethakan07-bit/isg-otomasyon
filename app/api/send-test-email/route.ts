import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const { toEmail, ccEmail } = await req.json();
    if (!toEmail) return NextResponse.json({ error: "toEmail gerekli" }, { status: 400 });

    const apiKey = process.env.RESEND_API_KEY;
    if (!apiKey) return NextResponse.json({ error: "RESEND_API_KEY tanımlı değil" }, { status: 500 });

    const emailPayload: any = {
      from: "İSG Otomasyon <onboarding@resend.dev>",
      to: [toEmail],
      subject: "[İSG] Test E-postası",
      html: `
        <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;">
          <div style="background:#1e293b;padding:20px;border-radius:8px 8px 0 0;">
            <h1 style="color:white;margin:0;font-size:20px;">🦺 İSG Otomasyon</h1>
            <p style="color:#94a3b8;margin:4px 0 0;font-size:14px;">Test E-postası</p>
          </div>
          <div style="border:1px solid #e2e8f0;border-top:none;padding:24px;border-radius:0 0 8px 8px;">
            <p style="font-size:14px;color:#334155;">Bu bir test e-postasıdır.</p>
            <p style="font-size:14px;color:#334155;">E-posta bildirim sistemi başarıyla çalışıyor.</p>
            <p style="font-size:12px;color:#94a3b8;margin-top:20px;">Gönderim zamanı: ${new Date().toLocaleString("tr-TR")}</p>
          </div>
        </div>`,
    };
    if (ccEmail) emailPayload.cc = [ccEmail];

    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
      body: JSON.stringify(emailPayload),
    });

    const result = await response.json();
    if (!response.ok) return NextResponse.json({ error: result.message || JSON.stringify(result) }, { status: response.status });

    return NextResponse.json({ success: true, id: result.id });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
