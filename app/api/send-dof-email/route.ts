import { NextRequest, NextResponse } from "next/server";
import { initializeApp, getApps } from "firebase/app";
import { getFirestore, doc, getDoc, updateDoc, collection, addDoc } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyDCCKqJLR7V_VN9n4NPM5_ZlPlc-O1alAk",
  authDomain: "isg-otomasyon.firebaseapp.com",
  projectId: "isg-otomasyon",
  storageBucket: "isg-otomasyon.firebasestorage.app",
  messagingSenderId: "664404617229",
  appId: "1:664404617229:web:12cba547e7cbebf46b4d44",
};

const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];
const db = getFirestore(app);

export async function POST(req: NextRequest) {
  try {
    const { dofId } = await req.json();
    if (!dofId) return NextResponse.json({ error: "dofId gerekli" }, { status: 400 });

    // 1. Email ayarlarını oku
    const settingsSnap = await getDoc(doc(db, "settings", "emailNotifications"));
    if (!settingsSnap.exists()) {
      return NextResponse.json({ error: "Email ayarları bulunamadı. Ayarlar sekmesinden yapılandırın." }, { status: 404 });
    }
    const settings = settingsSnap.data();
    if (!settings.enabled) {
      return NextResponse.json({ message: "Email bildirimi pasif" }, { status: 200 });
    }
    if (!settings.toEmail) {
      return NextResponse.json({ error: "Alıcı email adresi tanımlı değil" }, { status: 400 });
    }

    // 2. DÖF kaydını oku
    const dofSnap = await getDoc(doc(db, "dofs", dofId));
    if (!dofSnap.exists()) {
      return NextResponse.json({ error: "DÖF kaydı bulunamadı" }, { status: 404 });
    }
    const dof = dofSnap.data();

    // 3. Firma bilgisi
    let companyName = "—";
    if (dof.companyId) {
      const compSnap = await getDoc(doc(db, "companies", dof.companyId));
      if (compSnap.exists()) companyName = compSnap.data().officialName || compSnap.data().nickName;
    }

    // 4. Konu hazırla
    const subject = (settings.subject || "[İSG] Yeni DÖF Bildirimi")
      .replace("{dofTitle}", dof.title || "")
      .replace("{companyName}", companyName);

    const priorityColor = dof.priority === "Yüksek" ? "#dc2626" : dof.priority === "Orta" ? "#d97706" : "#16a34a";

    const html = `
      <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;">
        <div style="background:#1e293b;padding:20px;border-radius:8px 8px 0 0;">
          <h1 style="color:white;margin:0;font-size:20px;">🦺 İSG Otomasyon</h1>
          <p style="color:#94a3b8;margin:4px 0 0;font-size:14px;">Yeni DÖF Bildirimi</p>
        </div>
        <div style="border:1px solid #e2e8f0;border-top:none;padding:24px;border-radius:0 0 8px 8px;">
          <h2 style="margin:0 0 16px;color:#1e293b;font-size:18px;">${dof.title || ""}</h2>
          ${settings.message ? `<p style="color:#334155;font-size:14px;margin:0 0 16px;padding:12px;background:#f8fafc;border-radius:6px;border:1px solid #e2e8f0;">${settings.message}</p>` : ""}
          <table style="width:100%;border-collapse:collapse;font-size:14px;">
            <tr><td style="padding:8px 12px;border-bottom:1px solid #f1f5f9;color:#64748b;width:140px;">Firma</td><td style="padding:8px 12px;border-bottom:1px solid #f1f5f9;font-weight:600;">${companyName}</td></tr>
            <tr><td style="padding:8px 12px;border-bottom:1px solid #f1f5f9;color:#64748b;">Konum</td><td style="padding:8px 12px;border-bottom:1px solid #f1f5f9;">${dof.location || "—"}</td></tr>
            <tr><td style="padding:8px 12px;border-bottom:1px solid #f1f5f9;color:#64748b;">Öncelik</td><td style="padding:8px 12px;border-bottom:1px solid #f1f5f9;"><span style="background:${priorityColor};color:white;padding:2px 10px;border-radius:4px;font-size:12px;font-weight:600;">${dof.priority || "Orta"}</span></td></tr>
            <tr><td style="padding:8px 12px;border-bottom:1px solid #f1f5f9;color:#64748b;">Sorumlu</td><td style="padding:8px 12px;border-bottom:1px solid #f1f5f9;">${dof.responsible || "—"}</td></tr>
            <tr><td style="padding:8px 12px;border-bottom:1px solid #f1f5f9;color:#64748b;">Termin</td><td style="padding:8px 12px;border-bottom:1px solid #f1f5f9;">${dof.dueDate || "—"}</td></tr>
          </table>
          ${dof.description ? `<div style="margin-top:16px;"><p style="color:#64748b;font-size:13px;margin:0 0 4px;">Açıklama:</p><p style="color:#1e293b;font-size:14px;margin:0;padding:12px;background:#f8fafc;border-radius:6px;border:1px solid #e2e8f0;">${dof.description}</p></div>` : ""}
          <div style="margin-top:24px;padding-top:16px;border-top:1px solid #e2e8f0;"><p style="color:#94a3b8;font-size:12px;margin:0;">Bu bildirim İSG Otomasyon tarafından otomatik gönderilmiştir.</p></div>
        </div>
      </div>`;

    // 5. Resend ile gönder
    const apiKey = process.env.RESEND_API_KEY;
    if (!apiKey) {
      await logEmail(db, dofId, settings.toEmail, "failed", "RESEND_API_KEY yok");
      return NextResponse.json({ error: "RESEND_API_KEY tanımlı değil" }, { status: 500 });
    }

    const emailPayload: any = {
      from: "İSG Otomasyon <onboarding@resend.dev>",
      to: [settings.toEmail],
      subject,
      html,
    };
    if (settings.ccEmail) emailPayload.cc = [settings.ccEmail];

    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
      body: JSON.stringify(emailPayload),
    });

    const result = await response.json();

    if (!response.ok) {
      await logEmail(db, dofId, settings.toEmail, "failed", JSON.stringify(result));
      return NextResponse.json({ error: result }, { status: response.status });
    }

    // 6. DÖF durumunu güncelle
    await updateDoc(doc(db, "dofs", dofId), { status: "Bildirildi" });

    // 7. Başarılı log
    await logEmail(db, dofId, settings.toEmail, "success", result.id);

    return NextResponse.json({ success: true, id: result.id });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

async function logEmail(fireDb: any, dofId: string, to: string, status: string, detail: string) {
  try {
    await addDoc(collection(fireDb, "emailLogs"), {
      dofId, to, status, detail, createdAt: new Date().toISOString(),
    });
  } catch (e) { console.error("Log yazılamadı:", e); }
}
