import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const { to, companyName, dofTitle, dofDescription, dofLocation, dofPriority, dofResponsible, dofDueDate, dofLawReference } = await req.json();

    const apiKey = process.env.RESEND_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: "RESEND_API_KEY not configured" }, { status: 500 });
    }

    if (!to) {
      return NextResponse.json({ error: "Recipient email missing" }, { status: 400 });
    }

    const priorityColor = dofPriority === "Yüksek" ? "#dc2626" : dofPriority === "Orta" ? "#d97706" : "#16a34a";

    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background-color: #1e293b; padding: 20px; border-radius: 8px 8px 0 0;">
          <h1 style="color: white; margin: 0; font-size: 20px;">🦺 İSG Otomasyon</h1>
          <p style="color: #94a3b8; margin: 4px 0 0; font-size: 14px;">Yeni DÖF Bildirimi</p>
        </div>
        <div style="border: 1px solid #e2e8f0; border-top: none; padding: 24px; border-radius: 0 0 8px 8px;">
          <h2 style="margin: 0 0 16px; color: #1e293b; font-size: 18px;">${dofTitle}</h2>
          
          <table style="width: 100%; border-collapse: collapse; font-size: 14px;">
            <tr>
              <td style="padding: 8px 12px; border-bottom: 1px solid #f1f5f9; color: #64748b; width: 140px;">Firma</td>
              <td style="padding: 8px 12px; border-bottom: 1px solid #f1f5f9; font-weight: 600;">${companyName}</td>
            </tr>
            <tr>
              <td style="padding: 8px 12px; border-bottom: 1px solid #f1f5f9; color: #64748b;">Konum / Bölüm</td>
              <td style="padding: 8px 12px; border-bottom: 1px solid #f1f5f9;">${dofLocation || "—"}</td>
            </tr>
            <tr>
              <td style="padding: 8px 12px; border-bottom: 1px solid #f1f5f9; color: #64748b;">Öncelik</td>
              <td style="padding: 8px 12px; border-bottom: 1px solid #f1f5f9;">
                <span style="background-color: ${priorityColor}; color: white; padding: 2px 10px; border-radius: 4px; font-size: 12px; font-weight: 600;">${dofPriority}</span>
              </td>
            </tr>
            <tr>
              <td style="padding: 8px 12px; border-bottom: 1px solid #f1f5f9; color: #64748b;">Sorumlu</td>
              <td style="padding: 8px 12px; border-bottom: 1px solid #f1f5f9;">${dofResponsible || "—"}</td>
            </tr>
            <tr>
              <td style="padding: 8px 12px; border-bottom: 1px solid #f1f5f9; color: #64748b;">Termin</td>
              <td style="padding: 8px 12px; border-bottom: 1px solid #f1f5f9;">${dofDueDate || "—"}</td>
            </tr>
            ${dofLawReference ? `<tr>
              <td style="padding: 8px 12px; border-bottom: 1px solid #f1f5f9; color: #64748b;">İlgili Mevzuat</td>
              <td style="padding: 8px 12px; border-bottom: 1px solid #f1f5f9;">${dofLawReference}</td>
            </tr>` : ""}
          </table>

          ${dofDescription ? `
          <div style="margin-top: 16px;">
            <p style="color: #64748b; font-size: 13px; margin: 0 0 4px;">Açıklama:</p>
            <p style="color: #1e293b; font-size: 14px; margin: 0; padding: 12px; background: #f8fafc; border-radius: 6px; border: 1px solid #e2e8f0;">${dofDescription}</p>
          </div>` : ""}

          <div style="margin-top: 24px; padding-top: 16px; border-top: 1px solid #e2e8f0;">
            <p style="color: #94a3b8; font-size: 12px; margin: 0;">Bu bildirim İSG Otomasyon sistemi tarafından otomatik olarak gönderilmiştir.</p>
          </div>
        </div>
      </div>
    `;

    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        from: "İSG Otomasyon <onboarding@resend.dev>",
        to: [to],
        subject: `[İSG] Yeni DÖF: ${dofTitle} — ${companyName}`,
        html,
      }),
    });

    const result = await response.json();

    if (!response.ok) {
      return NextResponse.json({ error: result }, { status: response.status });
    }

    return NextResponse.json({ success: true, id: result.id });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
