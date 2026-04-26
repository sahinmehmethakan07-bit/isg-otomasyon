import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const { toEmails, pdfBase64, companyName } = await req.json();
    if (!toEmails || !Array.isArray(toEmails) || toEmails.length === 0) {
      return NextResponse.json({ error: "En az bir alıcı email adresi gerekli" }, { status: 400 });
    }

    const apiKey = process.env.RESEND_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: "RESEND_API_KEY tanımlı değil" }, { status: 500 });
    }

    const today = new Date().toLocaleDateString("tr-TR").replace(/\./g, "_");

    const html = `
      <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;">
        <div style="background:#1e293b;padding:20px;border-radius:8px 8px 0 0;">
          <h1 style="color:white;margin:0;font-size:20px;">ISG Otomasyon</h1>
          <p style="color:#94a3b8;margin:4px 0 0;font-size:14px;">Risk Degerlendirme Raporu</p>
        </div>
        <div style="border:1px solid #e2e8f0;border-top:none;padding:24px;border-radius:0 0 8px 8px;">
          <p style="font-size:14px;color:#334155;margin:0 0 8px;">Sayin Yetkili,</p>
          <p style="font-size:14px;color:#334155;margin:0 0 16px;"><strong>${companyName || "Tum firmalar"}</strong> icin risk degerlendirme raporu ekte sunulmustur.</p>
          <p style="font-size:13px;color:#64748b;margin:20px 0 0;">Detayli bilgi icin ekteki PDF dosyasini inceleyiniz.</p>
          <div style="margin-top:24px;padding-top:16px;border-top:1px solid #e2e8f0;">
            <p style="color:#94a3b8;font-size:12px;margin:0;">Bu bildirim ISG Otomasyon tarafindan otomatik gonderilmistir.</p>
          </div>
        </div>
      </div>`;

    const emailPayload: any = {
      from: "ISG Otomasyon <onboarding@resend.dev>",
      to: toEmails,
      subject: `[ISG] Risk Degerlendirme Raporu — ${companyName || "Tum Firmalar"}`,
      html,
    };

    if (pdfBase64) {
      emailPayload.attachments = [{
        filename: `Risk_Raporu_${today}.pdf`,
        content: pdfBase64,
      }];
    }

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
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
