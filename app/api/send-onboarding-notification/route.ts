import { NextRequest, NextResponse } from "next/server";

const PROJECT_ID = "isg-otomasyon";

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

type FirestoreValue = {
  stringValue?: string;
  integerValue?: string;
  doubleValue?: number;
  booleanValue?: boolean;
  timestampValue?: string;
  nullValue?: null;
  arrayValue?: { values?: FirestoreValue[] };
  mapValue?: { fields?: Record<string, FirestoreValue> };
};

function documentUrl(path: string) {
  const encodedPath = path.split("/").map(encodeURIComponent).join("/");
  return `https://firestore.googleapis.com/v1/projects/${PROJECT_ID}/databases/(default)/documents/${encodedPath}`;
}

function parseFirestoreValue(value: FirestoreValue): any {
  if ("stringValue" in value) return value.stringValue;
  if ("integerValue" in value) return Number(value.integerValue);
  if ("doubleValue" in value) return value.doubleValue;
  if ("booleanValue" in value) return value.booleanValue;
  if ("timestampValue" in value) return value.timestampValue;
  if ("nullValue" in value) return null;
  if (value.arrayValue) return (value.arrayValue.values || []).map(parseFirestoreValue);
  if (value.mapValue) return parseFirestoreFields(value.mapValue.fields || {});
  return undefined;
}

function parseFirestoreFields(fields: Record<string, FirestoreValue>) {
  return Object.fromEntries(Object.entries(fields).map(([key, value]) => [key, parseFirestoreValue(value)]));
}

async function firestoreGet(path: string, token: string) {
  const response = await fetch(documentUrl(path), {
    headers: { Authorization: `Bearer ${token}` },
    cache: "no-store",
  });
  if (!response.ok) {
    const detail = await response.text();
    throw new Error(`Firestore okuma hatası (${response.status}): ${detail}`);
  }
  const document = await response.json();
  return parseFirestoreFields(document.fields || {});
}

async function firestorePatch(path: string, token: string, body: unknown, updateMask: string[]) {
  const params = updateMask.map(field => `updateMask.fieldPaths=${encodeURIComponent(field)}`).join("&");
  const response = await fetch(`${documentUrl(path)}?${params}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
    body: JSON.stringify(body),
  });
  if (!response.ok) {
    console.error("Firestore güncelleme hatası:", await response.text());
  }
}

async function firestoreAdd(path: string, token: string, body: unknown) {
  const response = await fetch(documentUrl(path), {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
    body: JSON.stringify(body),
  });
  if (!response.ok) {
    console.error("Firestore log yazma hatası:", await response.text());
  }
}

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
    const token = req.headers.get("authorization")?.replace(/^Bearer\s+/i, "");
    if (!token) return NextResponse.json({ error: "Oturum doğrulaması gerekli" }, { status: 401 });

    const { employeeId, type = "created" } = await req.json() as { employeeId?: string; type?: NotificationType };
    if (!employeeId) return NextResponse.json({ error: "employeeId gerekli" }, { status: 400 });

    const apiKey = process.env.RESEND_API_KEY;
    if (!apiKey) return NextResponse.json({ error: "RESEND_API_KEY tanımlı değil" }, { status: 500 });

    const settings = await firestoreGet("settings/emailNotifications", token);
    if (settings.enabled === false) return NextResponse.json({ message: "Email bildirimi pasif" }, { status: 200 });

    const employee = await firestoreGet(`employees/${employeeId}`, token) as EmployeeData;

    let companyName = "—";
    if (employee.companyId) {
      try {
        const company = await firestoreGet(`companies/${employee.companyId}`, token);
        companyName = company.officialName || company.nickName || "—";
      } catch (error) {
        console.error("Firma bilgisi okunamadı:", error);
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

    const uniqueRecipients = Array.from(new Set(recipients));
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
      body: JSON.stringify({
        from: "ISG Otomasyon <onboarding@resend.dev>",
        to: uniqueRecipients,
        cc: settings.ccEmail ? [settings.ccEmail] : undefined,
        subject,
        html,
      }),
    });

    const result = await response.json();
    if (!response.ok) {
      await logOnboardingEmail(employeeId, uniqueRecipients, "failed", JSON.stringify(result), token);
      return NextResponse.json({ error: result }, { status: response.status });
    }

    const notificationField = type === "reminder" ? "onboarding.lastReminderAt" : "onboarding.notifiedAt";
    await firestorePatch(`employees/${employeeId}`, token, {
      fields: {
        onboarding: {
          mapValue: {
            fields: {
              [type === "reminder" ? "lastReminderAt" : "notifiedAt"]: { stringValue: new Date().toISOString() },
            },
          },
        },
      },
    }, [notificationField]);
    await logOnboardingEmail(employeeId, uniqueRecipients, "success", result.id, token);

    return NextResponse.json({ success: true, id: result.id, to: uniqueRecipients, cc: settings.ccEmail ? [settings.ccEmail] : [] });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Bilinmeyen hata";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

async function logOnboardingEmail(employeeId: string, to: string[], status: string, detail: string, token: string) {
  await firestoreAdd("emailLogs", token, {
    fields: {
      employeeId: { stringValue: employeeId },
      type: { stringValue: "employeeOnboarding" },
      status: { stringValue: status },
      detail: { stringValue: detail },
      createdAt: { stringValue: new Date().toISOString() },
      to: { arrayValue: { values: to.map(email => ({ stringValue: email })) } },
    },
  });
}
