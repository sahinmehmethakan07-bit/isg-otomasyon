import { NextRequest, NextResponse } from "next/server";
import { initializeApp, getApps } from "firebase/app";
import { getFirestore, addDoc, collection, doc, getDoc, updateDoc } from "firebase/firestore";

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

type NotificationType = "created" | "reminder";

type EmployeeChecklist = {
  isgCertificateDate?: string;
  ek2Date?: string;
  orientationDate?: string;
  preTest?: boolean;
  postTest?: boolean;
  undertaking?: boolean;
  kkdMinutes?: boolean;
  attendanceDoc?: boolean;
};

type EmployeeData = {
  companyId?: string;
  firstName?: string;
  lastName?: string;
  tcNo?: string;
  department?: string;
  diplomaInfo?: string;
  address?: string;
  title?: string;
  hireDate?: string;
  checklist?: EmployeeChecklist;
  onboarding?: { missingSteps?: string[] };
};

function missingSteps(checklist: EmployeeChecklist = {}) {
  const missing: string[] = [];
  if (!checklist.ek2Date) missing.push("İşyeri hekimi EK-2 formunu tamamlamalı");
  if (!checklist.orientationDate || !checklist.isgCertificateDate) missing.push("İSG uzmanı eğitim planlamasını tamamlamalı");
  if (!checklist.preTest || !checklist.postTest || !checklist.undertaking || !checklist.kkdMinutes || !checklist.attendanceDoc) {
    missing.push("İSG uzmanı personel evraklarını tamamlamalı");
  }
  return missing;
}

function employeeName(employee: EmployeeData) {
  return `${employee.firstName || ""} ${employee.lastName || ""}`.trim() || "Yeni personel";
}

export async function POST(req: NextRequest) {
  try {
    const { employeeId, type = "created" } = await req.json() as { employeeId?: string; type?: NotificationType };
    if (!employeeId) return NextResponse.json({ error: "employeeId gerekli" }, { status: 400 });

    const apiKey = process.env.RESEND_API_KEY;
    if (!apiKey) return NextResponse.json({ error: "RESEND_API_KEY tanımlı değil" }, { status: 500 });

    const settingsSnap = await getDoc(doc(db, "settings", "emailNotifications"));
    const settings = settingsSnap.exists() ? settingsSnap.data() : {};
    if (settings.enabled === false) return NextResponse.json({ message: "Email bildirimi pasif" }, { status: 200 });

    const employeeSnap = await getDoc(doc(db, "employees", employeeId));
    if (!employeeSnap.exists()) return NextResponse.json({ error: "Personel kaydı bulunamadı" }, { status: 404 });
    const employee = employeeSnap.data() as EmployeeData;

    let companyName = "—";
    if (employee.companyId) {
      const companySnap = await getDoc(doc(db, "companies", employee.companyId));
      if (companySnap.exists()) {
        const company = companySnap.data();
        companyName = company.officialName || company.nickName || "—";
      }
    }

    const missing = employee.onboarding?.missingSteps?.length ? employee.onboarding.missingSteps : missingSteps(employee.checklist);
    const name = employeeName(employee);
    const subjectPrefix = type === "reminder" ? "Eksik Onboarding Görevleri" : "Yeni Personel Onboarding Görevi";
    const subject = `[İSG] ${subjectPrefix}: ${name}`;

    const html = `
      <div style="font-family:Arial,sans-serif;max-width:640px;margin:0 auto;">
        <div style="background:#1e293b;padding:20px;border-radius:8px 8px 0 0;">
          <h1 style="color:white;margin:0;font-size:20px;">İSG Otomasyon</h1>
          <p style="color:#94a3b8;margin:4px 0 0;font-size:14px;">${subjectPrefix}</p>
        </div>
        <div style="border:1px solid #e2e8f0;border-top:none;padding:24px;border-radius:0 0 8px 8px;">
          <p style="font-size:14px;color:#334155;margin:0 0 16px;">${type === "reminder" ? "Aşağıdaki personel için tamamlanmamış görevler bulunmaktadır." : "İK tarafından yeni bir personel kaydı oluşturuldu. Lütfen size ait görevleri tamamlayınız."}</p>
          <table style="width:100%;border-collapse:collapse;font-size:13px;color:#334155;margin-bottom:18px;">
            <tr><td style="padding:6px 0;font-weight:700;">Personel</td><td style="padding:6px 0;">${name}</td></tr>
            <tr><td style="padding:6px 0;font-weight:700;">Firma</td><td style="padding:6px 0;">${companyName}</td></tr>
            <tr><td style="padding:6px 0;font-weight:700;">Birim</td><td style="padding:6px 0;">${employee.department || "—"}</td></tr>
            <tr><td style="padding:6px 0;font-weight:700;">Unvan</td><td style="padding:6px 0;">${employee.title || "—"}</td></tr>
            <tr><td style="padding:6px 0;font-weight:700;">Diploma</td><td style="padding:6px 0;">${employee.diplomaInfo || "—"}</td></tr>
            <tr><td style="padding:6px 0;font-weight:700;">Adres</td><td style="padding:6px 0;">${employee.address || "—"}</td></tr>
            <tr><td style="padding:6px 0;font-weight:700;">İşe Giriş</td><td style="padding:6px 0;">${employee.hireDate || "—"}</td></tr>
          </table>
          <div style="background:#fff7ed;border:1px solid #fed7aa;border-radius:8px;padding:14px;">
            <p style="margin:0 0 8px;font-size:13px;font-weight:700;color:#9a3412;">Eksik adımlar</p>
            <ul style="margin:0;padding-left:20px;color:#7c2d12;font-size:13px;line-height:1.6;">
              ${missing.length > 0 ? missing.map(step => `<li>${step}</li>`).join("") : "<li>Tüm görevler tamamlandı.</li>"}
            </ul>
          </div>
          <p style="font-size:12px;color:#94a3b8;margin:20px 0 0;">Bu bildirim İSG Otomasyon tarafından otomatik gönderilmiştir.</p>
        </div>
      </div>`;

    const recipients = [
      settings.doctorEmail || settings.toEmail,
      settings.safetyExpertEmail || settings.toEmail,
    ].filter(Boolean);

    if (recipients.length === 0) {
      return NextResponse.json({ error: "Alıcı email adresi tanımlı değil" }, { status: 400 });
    }

    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
      body: JSON.stringify({
        from: "ISG Otomasyon <onboarding@resend.dev>",
        to: Array.from(new Set(recipients)),
        cc: settings.ccEmail ? [settings.ccEmail] : undefined,
        subject,
        html,
      }),
    });

    const result = await response.json();
    if (!response.ok) {
      await logOnboardingEmail(employeeId, Array.from(new Set(recipients)), "failed", JSON.stringify(result));
      return NextResponse.json({ error: result }, { status: response.status });
    }

    await updateDoc(doc(db, "employees", employeeId), {
      [type === "reminder" ? "onboarding.lastReminderAt" : "onboarding.notifiedAt"]: new Date().toISOString(),
    });
    await logOnboardingEmail(employeeId, Array.from(new Set(recipients)), "success", result.id);

    return NextResponse.json({ success: true, id: result.id });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Bilinmeyen hata";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

async function logOnboardingEmail(employeeId: string, to: string[], status: string, detail: string) {
  try {
    await addDoc(collection(db, "emailLogs"), {
      employeeId,
      type: "employeeOnboarding",
      to,
      status,
      detail,
      createdAt: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Onboarding email log yazılamadı:", error);
  }
}
