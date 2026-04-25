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
    const { dofId, pdfBase64 } = await req.json();
    if (!dofId) return NextResponse.json({ error: "dofId gerekli" }, { status: 400 });

    // 1. Email ayarlarini oku
    const settingsSnap = await getDoc(doc(db, "settings", "emailNotifications"));
    if (!settingsSnap.exists()) {
      return NextResponse.json({ error: "Email ayarlari bulunamadi" }, { status: 404 });
    }
    const settings = settingsSnap.data();
    if (!settings.enabled) {
      return NextResponse.json({ message: "Email bildirimi pasif" }, { status: 200 });
    }
    if (!settings.toEmail) {
      return NextResponse.json({ error: "Alici email adresi tanimli degil" }, { status: 400 });
    }

    // 2. DOF kaydini oku
    const dofSnap = await getDoc(doc(db, "dofs", dofId));
    if (!dofSnap.exists()) {
      return NextResponse.json({ error: "DOF kaydi bulunamadi" }, { status: 404 });
    }
    const dof = dofSnap.data();

    // 3. Firma bilgisi
    let companyName = "—";
    if (dof.companyId) {
      const compSnap = await getDoc(doc(db, "companies", dof.companyId));
      if (compSnap.exists()) companyName = compSnap.data().officialName || compSnap.data().nickName;
    }

    // 4. Konu hazirla
    const subject = (settings.subject || "[ISG] Yeni DOF Bildirimi")
      .replace("{dofTitle}", dof.title || "")
      .replace("{companyName}", companyName);

    // 5. Kisa HTML govde (PDF ekte)
    const html = `
      <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;">
        <div style="background:#1e293b;padding:20px;border-radius:8px 8px 0 0;">
          <h1 style="color:white;margin:0;font-size:20px;">ISG Otomasyon</h1>
          <p style="color:#94a3b8;margin:4px 0 0;font-size:14px;">DOF Bildirimi</p>
        </div>
        <div style="border:1px solid #e2e8f0;border-top:none;padding:24px;border-radius:0 0 8px 8px;">
          <p style="font-size:14px;color:#334155;margin:0 0 8px;">Sayin Yetkili,</p>
          <p style="font-size:14px;color:#334155;margin:0 0 16px;"><strong>${companyName}</strong> firmasina ait yeni bir DOF kaydi olusturulmustur.</p>
          <p style="font-size:14px;color:#334155;margin:0 0 8px;"><strong>Baslik:</strong> ${dof.title || ""}</p>
          <p style="font-size:14px;color:#334155;margin:0 0 8px;"><strong>Oncelik:</strong> ${dof.priority || "Orta"}</p>
          <p style="font-size:14px;color:#334155;margin:0 0 8px;"><strong>Termin:</strong> ${dof.dueDate || "—"}</p>
          ${settings.message ? `<p style="font-size:14px;color:#334155;margin:16px 0 0;padding:12px;background:#f8fafc;border-radius:6px;border:1px solid #e2e8f0;">${settings.message}</p>` : ""}
          <p style="font-size:13px;color:#64748b;margin:20px 0 0;">Detayli bilgi icin ekteki PDF dosyasini inceleyiniz.</p>
          <div style="margin-top:24px;padding-top:16px;border-top:1px solid #e2e8f0;">
            <p style="color:#94a3b8;font-size:12px;margin:0;">Bu bildirim ISG Otomasyon tarafindan otomatik gonderilmistir.</p>
          </div>
        </div>
      </div>`;

    // 6. Resend ile gonder (PDF ek olarak)
    const apiKey = process.env.RESEND_API_KEY;
    if (!apiKey) {
      await logEmail(db, dofId, settings.toEmail, "failed", "RESEND_API_KEY yok");
      return NextResponse.json({ error: "RESEND_API_KEY tanimli degil" }, { status: 500 });
    }

    const today = new Date().toLocaleDateString("tr-TR").replace(/\./g, "_");
    const emailPayload: any = {
      from: "ISG Otomasyon <onboarding@resend.dev>",
      to: [settings.toEmail],
      subject,
      html,
    };
    if (settings.ccEmail) emailPayload.cc = [settings.ccEmail];

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

    const result = await response.json();

    if (!response.ok) {
      await logEmail(db, dofId, settings.toEmail, "failed", JSON.stringify(result));
      return NextResponse.json({ error: result }, { status: response.status });
    }

    // 7. DOF durumunu guncelle
    await updateDoc(doc(db, "dofs", dofId), { status: "Bildirildi" });

    // 8. Basarili log
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
  } catch (e) { console.error("Log yazilamadi:", e); }
}
