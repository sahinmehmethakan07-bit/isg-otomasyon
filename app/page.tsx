"use client";

import { ChangeEvent, useEffect, useMemo, useState } from "react";
import { db, auth } from "../lib/firebase";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { useRouter } from "next/navigation";
import { NOTO_SANS_BASE64 } from "../lib/notoSansFont";
import {
  collection,
  getDocs,
  addDoc,
  deleteDoc,
  doc,
  updateDoc,
} from "firebase/firestore";

type DangerClass = "Az Tehlikeli" | "Tehlikeli" | "Çok Tehlikeli";
type ServiceType = "İş Güvenliği" | "İş Güvenliği + İşyeri Hekimliği";

type Company = {
  id: string;
  nickName: string;
  officialName: string;
  sgkSicil: string;
  naceCode: string;
  dangerClass: DangerClass;
  employeeCount: number;
  contractEnd: string;
  serviceType: ServiceType;
};

type EmployeeChecklist = {
  isgCertificateDate: string;
  ek2Date: string;
  orientationDate: string;
  preTest: boolean;
  postTest: boolean;
  undertaking: boolean;
  kkdMinutes: boolean;
  attendanceDoc: boolean;
};

type Employee = {
  id: string;
  companyId: string;
  firstName: string;
  lastName: string;
  tcNo: string;
  title: string;
  hireDate: string;
  isActive: boolean;
  trainingComplete: boolean;
  checklist: EmployeeChecklist;
};

type DocumentRecord = {
  id: string;
  companyId: string;
  employeeId: string | null;
  type: string;
  issueDate: string;
  expiryDate: string;
};

type Observer = {
  id: string;
  fullName: string;
  title: string;
  certificateNo: string;
  phone: string;
};

type DofRecord = {
  id: string;
  companyId: string;
  observerId: string;
  title: string;
  description: string;
  lawReference: string;
  priority: "Düşük" | "Orta" | "Yüksek";
  responsible: string;
  dueDate: string;
  status: "Açık" | "Devam Ediyor" | "Kapandı";
  location: string;
  beforePhoto?: string;
  afterPhoto?: string;
};

type ShiftType = "Gündüz" | "Akşam" | "Gece";

type Shift = {
  id: string;
  companyId: string;
  employeeId: string;
  date: string;
  shiftType: ShiftType;
  startTime: string;
  endTime: string;
  note: string;
};

type RiskRecord = {
  id: string;
  companyId: string;
  sourceDofId: string | null;
  section: string;
  hazard: string;
  risk: string;
  currentMeasure: string;
  actionToTake: string;
  probability: number;
  severity: number;
  score: number;
  residualProbability: number;
  residualSeverity: number;
  residualScore: number;
  responsible: string;
  dueDate: string;
  status: "Açık" | "Kontrol Altında" | "Kapandı";
  affectedPersons?: string;
  lawReference?: string;
  controlDate?: string;
};

const emptyChecklist: EmployeeChecklist = {
  isgCertificateDate: "",
  ek2Date: "",
  orientationDate: "",
  preTest: false,
  postTest: false,
  undertaking: false,
  kkdMinutes: false,
  attendanceDoc: false,
};

const sgkCompanyRegistry: Record<string, { officialName: string; naceCode: string }> = {
  "2612345678901234567890": { officialName: "Örnek Turizm Otelcilik İnşaat Sanayi ve Ticaret A.Ş.", naceCode: "55.10.01" },
  "2611111111111111111111": { officialName: "Mavi Deniz Gıda Dağıtım Lojistik Limited Şirketi", naceCode: "46.38.01" },
};

const requiredCompanyDocs = ["Risk Değerlendirme Raporu", "Acil Durum Eylem Planı", "Yıllık Eğitim Planı", "Yıllık Çalışma Planı"];

const documentTemplates = [
  "Risk Değerlendirme Raporu", "DÖF Formu", "Acil Durum Eylem Planı", "Yıllık Eğitim Planı",
  "Yıllık Çalışma Planı", "Yıllık Değerlendirme Raporu", "Çalışan Temsilcisi Atama Tutanağı",
  "Eğitim Katılım Tutanağı", "İSG Kurul Toplantı Tutanağı", "İşe Giriş Sağlık Muayene Formu",
  "İSG Sertifikası", "EK-2",
];

function daysUntil(dateString: string) {
  const now = new Date();
  const target = new Date(dateString);
  return Math.ceil((target.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
}

function getDateStatus(dateString: string) {
  const days = daysUntil(dateString);
  if (days < 0) return "Süresi Dolmuş";
  if (days <= 30) return "Yaklaşıyor";
  return "Geçerli";
}

function dangerFromNace(naceCode: string): DangerClass {
  const code = naceCode.trim();
  if (code.startsWith("41") || code.startsWith("42") || code.startsWith("43") || code.startsWith("55") || code.startsWith("56")) return "Çok Tehlikeli";
  if (code.startsWith("46") || code.startsWith("49") || code.startsWith("52") || code.startsWith("81")) return "Tehlikeli";
  return "Az Tehlikeli";
}

function extractNaceFromSgk(sgkSicil: string) {
  const clean = sgkSicil.replace(/\D/g, "");
  if (sgkCompanyRegistry[clean]) return sgkCompanyRegistry[clean].naceCode;
  if (clean.length >= 6) return `${clean.slice(0, 2)}.${clean.slice(2, 4)}.${clean.slice(4, 6)}`;
  return "00.00.00";
}

function officialNameFromSgk(sgkSicil: string) {
  const clean = sgkSicil.replace(/\D/g, "");
  return sgkCompanyRegistry[clean]?.officialName || "";
}

function statusColor(status: string) {
  if (status === "Süresi Dolmuş") return "#dc2626";
  if (status === "Yaklaşıyor") return "#d97706";
  return "#16a34a";
}

function priorityColor(priority: string) {
  if (priority === "Yüksek") return "#dc2626";
  if (priority === "Orta") return "#d97706";
  return "#16a34a";
}

function riskScoreColor(value: number) {
  if (value >= 15) return "#dc2626";
  if (value >= 8) return "#d97706";
  return "#16a34a";
}

function checklistCompletion(checklist: EmployeeChecklist) {
  const items = [
    !!checklist.isgCertificateDate, !!checklist.ek2Date, !!checklist.orientationDate,
    checklist.preTest, checklist.postTest, checklist.undertaking, checklist.kkdMinutes, checklist.attendanceDoc,
  ];
  const completed = items.filter(Boolean).length;
  return { completed, total: items.length, missing: items.length - completed };
}

// ── Türkçe karakter dönüştürücü (jsPDF Latin-1 encoding için) ────────────────
function tr(text: string): string {
  return String(text)
    .replace(/İ/g, "I").replace(/ı/g, "i")
    .replace(/Ğ/g, "G").replace(/ğ/g, "g")
    .replace(/Ü/g, "U").replace(/ü/g, "u")
    .replace(/Ş/g, "S").replace(/ş/g, "s")
    .replace(/Ö/g, "O").replace(/ö/g, "o")
    .replace(/Ç/g, "C").replace(/ç/g, "c");
}

async function generateRiskPDF(risks: RiskRecord[], companies: Company[]) {
  const { default: jsPDF } = await import("jspdf");
  const { default: autoTable } = await import("jspdf-autotable");

  // Tüm eski kod silindi, temiz versiyon:
  const today = new Date().toLocaleDateString("tr-TR");
  const byCompany = companies
    .map((c) => ({ company: c, risks: risks.filter((r) => r.companyId === c.id) }))
    .filter((g) => g.risks.length > 0);

  if (byCompany.length === 0) return;

  const pdf = new jsPDF({ orientation: "landscape", unit: "mm", format: "a3" });

  // NotoSans Türkçe font yükle
  pdf.addFileToVFS("NotoSans-Regular.ttf", NOTO_SANS_BASE64);
  pdf.addFont("NotoSans-Regular.ttf", "NotoSans", "normal");
  pdf.addFileToVFS("NotoSans-Bold.ttf", NOTO_SANS_BASE64);
  pdf.addFont("NotoSans-Bold.ttf", "NotoSans", "bold");
  pdf.setFont("NotoSans", "normal");

  const pw = pdf.internal.pageSize.width;
  const ph = pdf.internal.pageSize.height;

  let isFirst = true;
  for (const { company, risks: companyRisks } of byCompany) {
    if (!isFirst) pdf.addPage();
    isFirst = false;

    // Başlık
    pdf.setFillColor(30, 41, 59);
    pdf.rect(0, 0, pw, 18, "F");
    pdf.setFont("NotoSans", "bold");
    pdf.setFontSize(12);
    pdf.setTextColor(255, 255, 255);
    pdf.text(company.officialName.toUpperCase(), pw / 2, 8, { align: "center" });
    pdf.setFontSize(9);
    pdf.setFont("NotoSans", "normal");
    pdf.text("RISK DEGERLENDIRME RAPORU", pw / 2, 14, { align: "center" });

    // Bilgi satırları
    pdf.setTextColor(0, 0, 0);
    pdf.setFontSize(7.5);
    pdf.setFont("NotoSans", "normal");
    const infoY = 24;
    const col2X = pw / 2 + 10;
    const gap = 6;

    const info = (label: string, value: string, x: number, y: number) => {
      pdf.setFont("NotoSans", "bold");
      pdf.text(label, x, y);
      pdf.setFont("NotoSans", "normal");
      pdf.text(value, x + pdf.getTextWidth(label) + 2, y);
    };

    info("Isyeri Unvani    :", company.officialName, 14, infoY);
    info("SGK Sicil No.    :", company.sgkSicil, col2X, infoY);
    info("NACE Kodu        :", company.naceCode, 14, infoY + gap);
    info("Analiz Tarihi    :", today, col2X, infoY + gap);
    info("Tehlike Sinifi   :", company.dangerClass, 14, infoY + gap * 2);
    info("Gecerlilik Tarihi:", new Date(new Date().setFullYear(new Date().getFullYear() + 1)).toLocaleDateString("tr-TR"), col2X, infoY + gap * 2);
    info("Calisan Sayisi   :", String(company.employeeCount), 14, infoY + gap * 3);
    info("Hizmet Turu      :", company.serviceType, col2X, infoY + gap * 3);

    // Risk tablosu
    const head = [["No", "Bolum", "Tehlike Kaynagi", "Tehlike/Risk", "Mevcut Onlem", "Oneriler", "O", "S", "RS", "KO", "KS", "KRS", "Etkilenecek", "Sorumlu", "Termin", "Durum"]];
    const body = companyRisks.map((r, i) => [
      String(i + 1),
      r.section || "",
      r.hazard || "",
      r.risk || "",
      r.currentMeasure || "",
      r.actionToTake || "",
      String(r.probability),
      String(r.severity),
      String(r.score),
      String(r.residualProbability),
      String(r.residualSeverity),
      String(r.residualScore),
      r.affectedPersons || "-",
      r.responsible || "",
      r.dueDate || "",
      r.status || "",
    ]);

    autoTable(pdf, {
      startY: infoY + gap * 4 + 2,
      margin: { left: 14, right: 14, bottom: 20 },
      head,
      body,
      styles: { fontSize: 7, cellPadding: 2, overflow: "linebreak", font: "NotoSans" },
      headStyles: { fillColor: [30, 41, 59], textColor: [255, 255, 255], fontStyle: "normal", fontSize: 7 },
      columnStyles: {
        0: { cellWidth: 8 },
        1: { cellWidth: 22 },
        2: { cellWidth: 30 },
        3: { cellWidth: 28 },
        4: { cellWidth: 28 },
        5: { cellWidth: 30 },
        6: { cellWidth: 8 },
        7: { cellWidth: 8 },
        8: { cellWidth: 10 },
        9: { cellWidth: 8 },
        10: { cellWidth: 8 },
        11: { cellWidth: 10 },
        12: { cellWidth: 24 },
        13: { cellWidth: 20 },
        14: { cellWidth: 18 },
        15: { cellWidth: 20 },
      },
      didDrawCell: (data: any) => {
        if (data.section === "body" && data.column.index === 8) {
          const score = parseInt(data.cell.text[0]);
          const color = score >= 15 ? [220, 38, 38] : score >= 8 ? [217, 119, 6] : [22, 163, 74];
          pdf.setFillColor(color[0], color[1], color[2]);
          pdf.rect(data.cell.x + 1, data.cell.y + 1, data.cell.width - 2, data.cell.height - 2, "F");
          pdf.setTextColor(255, 255, 255);
          pdf.setFont("NotoSans", "bold");
          pdf.setFontSize(7);
          pdf.text(data.cell.text[0], data.cell.x + data.cell.width / 2, data.cell.y + data.cell.height / 2 + 1, { align: "center" });
        }
        if (data.section === "body" && data.column.index === 11) {
          const score = parseInt(data.cell.text[0]);
          const color = score >= 15 ? [220, 38, 38] : score >= 8 ? [217, 119, 6] : [22, 163, 74];
          pdf.setFillColor(color[0], color[1], color[2]);
          pdf.rect(data.cell.x + 1, data.cell.y + 1, data.cell.width - 2, data.cell.height - 2, "F");
          pdf.setTextColor(255, 255, 255);
          pdf.setFont("NotoSans", "bold");
          pdf.setFontSize(7);
          pdf.text(data.cell.text[0], data.cell.x + data.cell.width / 2, data.cell.y + data.cell.height / 2 + 1, { align: "center" });
        }
      },
    });
  }

  pdf.save(`Risk_Degerlendirme_Raporu_${today.replace(/\./g, "_")}.pdf`);
}

// ── Styles ────────────────────────────────────────────────────────────────────
const styles: Record<string, React.CSSProperties> = {
  app: { minHeight: "100vh", backgroundColor: "#0f172a", color: "#e2e8f0", fontFamily: "'IBM Plex Sans', system-ui, sans-serif" },
  header: { backgroundColor: "#1e293b", borderBottom: "1px solid #334155", padding: "0 24px", display: "flex", alignItems: "center", justifyContent: "space-between", height: 56 },
  nav: { display: "flex", gap: 2, padding: "12px 24px 0", borderBottom: "1px solid #1e293b", backgroundColor: "#0f172a", overflowX: "auto" as const },
  content: { padding: 24, maxWidth: 1400, margin: "0 auto" },
  card: { backgroundColor: "#1e293b", border: "1px solid #334155", borderRadius: 10, padding: 20, marginBottom: 16 },
  sectionTitle: { fontSize: 13, fontWeight: 600, color: "#94a3b8", textTransform: "uppercase" as const, letterSpacing: "0.08em", marginBottom: 16 },
  input: { width: "100%", backgroundColor: "#0f172a", border: "1px solid #334155", borderRadius: 6, color: "#e2e8f0", padding: "8px 12px", fontSize: 13, outline: "none", boxSizing: "border-box" as const },
  select: { width: "100%", backgroundColor: "#0f172a", border: "1px solid #334155", borderRadius: 6, color: "#e2e8f0", padding: "8px 12px", fontSize: 13, outline: "none", boxSizing: "border-box" as const },
  label: { fontSize: 12, color: "#94a3b8", marginBottom: 4, display: "block" },
  formGrid: { display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: 12 },
  btnPrimary: { backgroundColor: "#0ea5e9", color: "#fff", border: "none", borderRadius: 6, padding: "8px 16px", fontSize: 13, fontWeight: 600, cursor: "pointer" },
  btnDanger: { backgroundColor: "#dc2626", color: "#fff", border: "none", borderRadius: 6, padding: "6px 12px", fontSize: 12, cursor: "pointer" },
  btnSecondary: { backgroundColor: "#334155", color: "#e2e8f0", border: "none", borderRadius: 6, padding: "6px 12px", fontSize: 12, cursor: "pointer" },
  btnSuccess: { backgroundColor: "#16a34a", color: "#fff", border: "none", borderRadius: 6, padding: "8px 16px", fontSize: 13, fontWeight: 600, cursor: "pointer" },
  badge: { display: "inline-block", padding: "2px 8px", borderRadius: 4, fontSize: 11, fontWeight: 600 },
  table: { width: "100%", borderCollapse: "collapse" as const, fontSize: 13 },
  th: { textAlign: "left" as const, padding: "8px 12px", borderBottom: "1px solid #334155", color: "#94a3b8", fontWeight: 600, fontSize: 12, textTransform: "uppercase" as const, letterSpacing: "0.05em" },
  td: { padding: "10px 12px", borderBottom: "1px solid #1e293b", verticalAlign: "top" as const },
  searchBar: { display: "flex", gap: 10, marginBottom: 16, alignItems: "center", flexWrap: "wrap" as const },
  statGrid: { display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))", gap: 12, marginBottom: 20 },
  statCard: { backgroundColor: "#1e293b", border: "1px solid #334155", borderRadius: 8, padding: 16 },
  statValue: { fontSize: 28, fontWeight: 700, lineHeight: 1, marginBottom: 4 },
  statLabel: { fontSize: 12, color: "#94a3b8" },
};

function Badge({ text, color }: { text: string; color: string }) {
  return <span style={{ ...styles.badge, backgroundColor: color + "22", color, border: `1px solid ${color}44` }}>{text}</span>;
}

function FormField({ label, children }: { label: string; children: React.ReactNode }) {
  return <div><label style={styles.label}>{label}</label>{children}</div>;
}

// ── Main ──────────────────────────────────────────────────────────────────────
export default function Page() {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [loading, setLoading] = useState(true);
  const [pdfLoading, setPdfLoading] = useState(false);

  const [companies, setCompanies] = useState<Company[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [documents, setDocuments] = useState<DocumentRecord[]>([]);
  const [observers, setObservers] = useState<Observer[]>([]);
  const [dofs, setDofs] = useState<DofRecord[]>([]);
  const [risks, setRisks] = useState<RiskRecord[]>([]);

  const [activeTab, setActiveTab] = useState("firmalar");
  const [search, setSearch] = useState("");
  const [selectedCompanyId, setSelectedCompanyId] = useState("all");
  const [selectedEmployeeId, setSelectedEmployeeId] = useState<string | null>(null);
  const [editingDofId, setEditingDofId] = useState<string | null>(null);

  const [newCompany, setNewCompany] = useState({ nickName: "", officialName: "", sgkSicil: "", naceCode: "", dangerClass: "Az Tehlikeli" as DangerClass, employeeCount: "", contractEnd: "", serviceType: "İş Güvenliği" as ServiceType });
  const [newEmployee, setNewEmployee] = useState({ companyId: "", firstName: "", lastName: "", tcNo: "", title: "", hireDate: "" });
  const [newDocument, setNewDocument] = useState({ companyId: "", employeeId: "", type: "Risk Değerlendirme Raporu", issueDate: "", expiryDate: "" });
  const [newObserver, setNewObserver] = useState({ fullName: "", title: "", certificateNo: "", phone: "" });
  const [newDof, setNewDof] = useState({ companyId: "", observerId: "", title: "", description: "", lawReference: "", priority: "Orta" as "Düşük" | "Orta" | "Yüksek", responsible: "", dueDate: "", status: "Açık" as "Açık" | "Devam Ediyor" | "Kapandı", location: "", beforePhoto: "", afterPhoto: "" });
  const [newRisk, setNewRisk] = useState({
    companyId: "", section: "", hazard: "", risk: "", currentMeasure: "", actionToTake: "",
    probability: "1", severity: "1", residualProbability: "1", residualSeverity: "1",
    responsible: "", dueDate: "", status: "Açık" as "Açık" | "Kontrol Altında" | "Kapandı",
    affectedPersons: "", lawReference: "", controlDate: "",
  });

  const [shifts, setShifts] = useState<Shift[]>([]);
  const [newShift, setNewShift] = useState({ companyId: "", employeeId: "", date: "", shiftType: "Gündüz" as ShiftType, startTime: "08:00", endTime: "16:00", note: "" });
  const [shiftWeekOffset, setShiftWeekOffset] = useState(0);

  async function loadAll() {
    setLoading(true);
    try {
      const [compSnap, empSnap, docSnap, obsSnap, dofSnap, riskSnap, shiftSnap] = await Promise.all([
        getDocs(collection(db, "companies")),
        getDocs(collection(db, "employees")),
        getDocs(collection(db, "documents")),
        getDocs(collection(db, "observers")),
        getDocs(collection(db, "dofs")),
        getDocs(collection(db, "risks")),
        getDocs(collection(db, "shifts")),
      ]);
      setCompanies(compSnap.docs.map(d => ({ id: d.id, ...d.data() } as Company)));
      setEmployees(empSnap.docs.map(d => ({ id: d.id, ...d.data() } as Employee)));
      setDocuments(docSnap.docs.map(d => ({ id: d.id, ...d.data() } as DocumentRecord)));
      setObservers(obsSnap.docs.map(d => ({ id: d.id, ...d.data() } as Observer)));
      setDofs(dofSnap.docs.map(d => ({ id: d.id, ...d.data() } as DofRecord)));
      setRisks(riskSnap.docs.map(d => ({ id: d.id, ...d.data() } as RiskRecord)));
      setShifts(shiftSnap.docs.map(d => ({ id: d.id, ...d.data() } as Shift)));
    } catch (e) {
      console.error("Firestore yükleme hatası", e);
    } finally {
      setLoading(false);
      setMounted(true);
    }
  }

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (!user) {
        router.push("/login");
      } else {
        loadAll();
      }
    });
    return () => unsubscribe();
  }, []);

  const selectedEmployee = employees.find(e => e.id === selectedEmployeeId) ?? null;
  const selectedEmployeeCompany = selectedEmployee ? companies.find(c => c.id === selectedEmployee.companyId) ?? null : null;

  function getCompanyDocuments(companyId: string) { return documents.filter(d => d.companyId === companyId && d.employeeId === null); }

  function getCompanyDocSummary(companyId: string) {
    const companyDocs = getCompanyDocuments(companyId);
    const missingCount = requiredCompanyDocs.filter(t => !companyDocs.some(d => d.type === t)).length;
    const expiredCount = companyDocs.filter(d => getDateStatus(d.expiryDate) === "Süresi Dolmuş").length;
    const soonCount = companyDocs.filter(d => getDateStatus(d.expiryDate) === "Yaklaşıyor").length;
    return { missingCount, expiredCount, soonCount };
  }

  function getCompanyIndicator(companyId: string) {
    const s = getCompanyDocSummary(companyId);
    if (s.missingCount > 0 || s.expiredCount > 0) return { text: "Kritik", color: "#dc2626" };
    if (s.soonCount > 0) return { text: "Yaklaşıyor", color: "#d97706" };
    return { text: "Uygun", color: "#16a34a" };
  }

  function handleImageToBase64(event: ChangeEvent<HTMLInputElement>, callback: (base64: string) => void) {
    const file = event.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => callback(String(reader.result || ""));
    reader.readAsDataURL(file);
  }

  function printEmployeeCertificate(employee: Employee, company: Company | null) {
    if (!company || !employee.checklist.isgCertificateDate) return;
    const signatures = company.serviceType === "İş Güvenliği + İşyeri Hekimliği" ? ["İşveren / İşveren Vekili", "İş Güvenliği Uzmanı", "İşyeri Hekimi"] : ["İşveren / İşveren Vekili", "İş Güvenliği Uzmanı"];
    const html = `<html><head><title>İSG Sertifikası</title><style>body{font-family:Arial,sans-serif;padding:40px}.box{border:2px solid #000;padding:30px}h1{text-align:center;margin-bottom:30px}.line{margin-bottom:12px;font-size:18px}.signatures{margin-top:60px;display:flex;justify-content:space-between;gap:20px}.sig{width:30%;text-align:center}.topline{border-top:1px solid #000;padding-top:10px;margin-top:50px}</style></head><body><div class="box"><h1>İSG EĞİTİM SERTİFİKASI</h1><div class="line"><strong>Personel:</strong> ${employee.firstName} ${employee.lastName}</div><div class="line"><strong>T.C. Kimlik No:</strong> ${employee.tcNo}</div><div class="line"><strong>Unvan:</strong> ${employee.title}</div><div class="line"><strong>Firma:</strong> ${company.officialName}</div><div class="line"><strong>Hizmet Türü:</strong> ${company.serviceType}</div><div class="line"><strong>Eğitim / Sertifika Tarihi:</strong> ${employee.checklist.isgCertificateDate}</div><div class="signatures">${signatures.map(s => `<div class="sig"><div class="topline">${s}</div></div>`).join("")}</div></div></body></html>`;
    const win = window.open("", "_blank", "width=900,height=700");
    if (!win) return;
    win.document.open(); win.document.write(html); win.document.close(); win.focus(); win.print();
  }

  const filteredCompanies = useMemo(() => companies.filter(c => `${c.nickName} ${c.officialName} ${c.sgkSicil} ${c.naceCode}`.toLowerCase().includes(search.toLowerCase())), [companies, search]);
  const filteredEmployees = useMemo(() => employees.filter(e => { const company = companies.find(c => c.id === e.companyId); const matchesCompany = selectedCompanyId === "all" || e.companyId === selectedCompanyId; return matchesCompany && `${e.firstName} ${e.lastName} ${e.tcNo} ${e.title} ${company?.nickName || ""}`.toLowerCase().includes(search.toLowerCase()); }), [employees, companies, selectedCompanyId, search]);
  const filteredDocuments = useMemo(() => documents.filter(d => { const company = companies.find(c => c.id === d.companyId); const employee = employees.find(e => e.id === d.employeeId); const matchesCompany = selectedCompanyId === "all" || d.companyId === selectedCompanyId; return matchesCompany && `${d.type} ${company?.nickName || ""} ${employee?.firstName || ""} ${employee?.lastName || ""}`.toLowerCase().includes(search.toLowerCase()); }), [documents, companies, employees, selectedCompanyId, search]);
  const filteredDofs = useMemo(() => dofs.filter(d => { const company = companies.find(c => c.id === d.companyId); const matchesCompany = selectedCompanyId === "all" || d.companyId === selectedCompanyId; return matchesCompany && `${d.title} ${d.description} ${d.location} ${company?.nickName || ""}`.toLowerCase().includes(search.toLowerCase()); }), [dofs, companies, selectedCompanyId, search]);
  const filteredRisks = useMemo(() => risks.filter(r => { const company = companies.find(c => c.id === r.companyId); const matchesCompany = selectedCompanyId === "all" || r.companyId === selectedCompanyId; return matchesCompany && `${r.section} ${r.hazard} ${r.risk} ${r.actionToTake} ${company?.nickName || ""}`.toLowerCase().includes(search.toLowerCase()); }), [risks, companies, selectedCompanyId, search]);

  async function addCompany() {
    if (!newCompany.nickName || !newCompany.sgkSicil) return;
    const naceCode = newCompany.naceCode || extractNaceFromSgk(newCompany.sgkSicil);
    const officialName = newCompany.officialName || officialNameFromSgk(newCompany.sgkSicil) || newCompany.nickName;
    const data = { nickName: newCompany.nickName, officialName, sgkSicil: newCompany.sgkSicil, naceCode, dangerClass: dangerFromNace(naceCode), employeeCount: parseInt(newCompany.employeeCount) || 0, contractEnd: newCompany.contractEnd, serviceType: newCompany.serviceType };
    const ref = await addDoc(collection(db, "companies"), data);
    setCompanies(prev => [...prev, { id: ref.id, ...data }]);
    setNewCompany({ nickName: "", officialName: "", sgkSicil: "", naceCode: "", dangerClass: "Az Tehlikeli", employeeCount: "", contractEnd: "", serviceType: "İş Güvenliği" });
  }

  async function deleteCompany(id: string) {
    if (!confirm("Bu firmayı silmek istediğinizden emin misiniz?")) return;
    // Firestore'dan cascade sil
    const relatedEmployees = employees.filter(e => e.companyId === id);
    const relatedDocs = documents.filter(d => d.companyId === id);
    const relatedDofs = dofs.filter(d => d.companyId === id);
    const relatedRisks = risks.filter(r => r.companyId === id);
    await Promise.all([
      deleteDoc(doc(db, "companies", id)),
      ...relatedEmployees.map(e => deleteDoc(doc(db, "employees", e.id))),
      ...relatedDocs.map(d => deleteDoc(doc(db, "documents", d.id))),
      ...relatedDofs.map(d => deleteDoc(doc(db, "dofs", d.id))),
      ...relatedRisks.map(r => deleteDoc(doc(db, "risks", r.id))),
    ]);
    setCompanies(prev => prev.filter(c => c.id !== id));
    setEmployees(prev => prev.filter(e => e.companyId !== id));
    setDocuments(prev => prev.filter(d => d.companyId !== id));
    setDofs(prev => prev.filter(d => d.companyId !== id));
    setRisks(prev => prev.filter(r => r.companyId !== id));
  }

  async function addEmployee() {
    if (!newEmployee.firstName || !newEmployee.companyId) return;
    const data = { companyId: newEmployee.companyId, firstName: newEmployee.firstName, lastName: newEmployee.lastName, tcNo: newEmployee.tcNo, title: newEmployee.title, hireDate: newEmployee.hireDate, isActive: true, trainingComplete: false, checklist: { ...emptyChecklist } };
    const ref = await addDoc(collection(db, "employees"), data);
    setEmployees(prev => [...prev, { id: ref.id, ...data }]);
    setNewEmployee({ companyId: "", firstName: "", lastName: "", tcNo: "", title: "", hireDate: "" });
  }

  async function deleteEmployee(id: string) {
    if (!confirm("Bu personeli silmek istediğinizden emin misiniz?")) return;
    await deleteDoc(doc(db, "employees", id));
    setEmployees(prev => prev.filter(e => e.id !== id));
    if (selectedEmployeeId === id) setSelectedEmployeeId(null);
  }

  async function updateEmployeeChecklist(employeeId: string, checklist: EmployeeChecklist) {
    await updateDoc(doc(db, "employees", employeeId), { checklist });
    setEmployees(prev => prev.map(e => e.id === employeeId ? { ...e, checklist } : e));
  }

  async function updateEmployeeTraining(employeeId: string, trainingComplete: boolean) {
    await updateDoc(doc(db, "employees", employeeId), { trainingComplete });
    setEmployees(prev => prev.map(e => e.id === employeeId ? { ...e, trainingComplete } : e));
  }

  async function addDocument() {
    if (!newDocument.companyId || !newDocument.type || !newDocument.issueDate) return;
    const data = { companyId: newDocument.companyId, employeeId: newDocument.employeeId || null, type: newDocument.type, issueDate: newDocument.issueDate, expiryDate: newDocument.expiryDate };
    const ref = await addDoc(collection(db, "documents"), data);
    setDocuments(prev => [...prev, { id: ref.id, ...data }]);
    setNewDocument({ companyId: "", employeeId: "", type: "Risk Değerlendirme Raporu", issueDate: "", expiryDate: "" });
  }

  async function deleteDocument(id: string) {
    await deleteDoc(doc(db, "documents", id));
    setDocuments(prev => prev.filter(d => d.id !== id));
  }

  async function addObserver() {
    if (!newObserver.fullName) return;
    const data = { fullName: newObserver.fullName, title: newObserver.title, certificateNo: newObserver.certificateNo, phone: newObserver.phone };
    const ref = await addDoc(collection(db, "observers"), data);
    setObservers(prev => [...prev, { id: ref.id, ...data }]);
    setNewObserver({ fullName: "", title: "", certificateNo: "", phone: "" });
  }

  async function deleteObserver(id: string) {
    await deleteDoc(doc(db, "observers", id));
    setObservers(prev => prev.filter(o => o.id !== id));
  }

  async function addDof() {
    if (!newDof.companyId || !newDof.title) return;
    const data: Omit<DofRecord, "id"> = { companyId: newDof.companyId, observerId: newDof.observerId, title: newDof.title, description: newDof.description, lawReference: newDof.lawReference, priority: newDof.priority, responsible: newDof.responsible, dueDate: newDof.dueDate, status: newDof.status, location: newDof.location, beforePhoto: newDof.beforePhoto || undefined, afterPhoto: newDof.afterPhoto || undefined };
    const ref = await addDoc(collection(db, "dofs"), data);
    setDofs(prev => [...prev, { id: ref.id, ...data }]);
    setNewDof({ companyId: "", observerId: "", title: "", description: "", lawReference: "", priority: "Orta", responsible: "", dueDate: "", status: "Açık", location: "", beforePhoto: "", afterPhoto: "" });
  }

  async function deleteDof(id: string) {
    await deleteDoc(doc(db, "dofs", id));
    setDofs(prev => prev.filter(d => d.id !== id));
  }

  async function updateDofStatus(id: string, status: DofRecord["status"]) {
    await updateDoc(doc(db, "dofs", id), { status });
    setDofs(prev => prev.map(d => d.id === id ? { ...d, status } : d));
  }

  async function createRiskFromDof(dof: DofRecord) {
    if (risks.some(r => r.sourceDofId === dof.id)) {
      alert("Bu DÖF için zaten bir risk kaydı oluşturulmuş.");
      return;
    }
    const data = {
      companyId: dof.companyId,
      sourceDofId: dof.id,
      section: dof.location || "",
      hazard: dof.title,
      risk: dof.description || "",
      currentMeasure: "",
      actionToTake: "",
      probability: 3,
      severity: 3,
      score: 9,
      residualProbability: 1,
      residualSeverity: 1,
      residualScore: 1,
      responsible: dof.responsible || "",
      dueDate: dof.dueDate || "",
      status: "Açık" as const,
      affectedPersons: "",
      lawReference: dof.lawReference || "",
      controlDate: "",
    };
    const ref = await addDoc(collection(db, "risks"), data);
    setRisks(prev => [...prev, { id: ref.id, ...data }]);
    alert("Risk kaydı oluşturuldu. Risk sekmesinden düzenleyebilirsiniz.");
  }

  async function addRisk() {
    if (!newRisk.companyId || !newRisk.hazard) return;
    const prob = parseInt(newRisk.probability);
    const sev = parseInt(newRisk.severity);
    const rProb = parseInt(newRisk.residualProbability);
    const rSev = parseInt(newRisk.residualSeverity);
    const data = {
      companyId: newRisk.companyId, sourceDofId: null,
      section: newRisk.section, hazard: newRisk.hazard, risk: newRisk.risk,
      currentMeasure: newRisk.currentMeasure, actionToTake: newRisk.actionToTake,
      probability: prob, severity: sev, score: prob * sev,
      residualProbability: rProb, residualSeverity: rSev, residualScore: rProb * rSev,
      responsible: newRisk.responsible, dueDate: newRisk.dueDate, status: newRisk.status,
      affectedPersons: newRisk.affectedPersons, lawReference: newRisk.lawReference, controlDate: newRisk.controlDate,
    };
    const ref = await addDoc(collection(db, "risks"), data);
    setRisks(prev => [...prev, { id: ref.id, ...data }]);
    setNewRisk({ companyId: "", section: "", hazard: "", risk: "", currentMeasure: "", actionToTake: "", probability: "1", severity: "1", residualProbability: "1", residualSeverity: "1", responsible: "", dueDate: "", status: "Açık", affectedPersons: "", lawReference: "", controlDate: "" });
  }

  async function deleteRisk(id: string) {
    await deleteDoc(doc(db, "risks", id));
    setRisks(prev => prev.filter(r => r.id !== id));
  }

  async function addShift() {
    if (!newShift.companyId || !newShift.employeeId || !newShift.date) return;
    const data = { ...newShift };
    const ref = await addDoc(collection(db, "shifts"), data);
    setShifts(prev => [...prev, { id: ref.id, ...data }]);
    setNewShift({ companyId: newShift.companyId, employeeId: "", date: "", shiftType: "Gündüz", startTime: "08:00", endTime: "16:00", note: "" });
  }

  async function deleteShift(id: string) {
    await deleteDoc(doc(db, "shifts", id));
    setShifts(prev => prev.filter(s => s.id !== id));
  }

  // Haftalık takvim için yardımcı fonksiyonlar
  function getWeekDays(offset: number): Date[] {
    const now = new Date();
    const monday = new Date(now);
    const day = now.getDay() === 0 ? 6 : now.getDay() - 1;
    monday.setDate(now.getDate() - day + offset * 7);
    monday.setHours(0, 0, 0, 0);
    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date(monday);
      d.setDate(monday.getDate() + i);
      return d;
    });
  }

  function formatDateKey(d: Date) {
    return d.toISOString().slice(0, 10);
  }

  const tabs = [
    { id: "ozet", label: "📊 Özet" },
    { id: "firmalar", label: "🏢 Firmalar" },
    { id: "personel", label: "👤 Personel" },
    { id: "belgeler", label: "📄 Belgeler" },
    { id: "gozlemciler", label: "🔍 Gözlemciler" },
    { id: "dof", label: "⚠️ DÖF" },
    { id: "risk", label: "🛡 Risk" },
    { id: "vardiya", label: "🕐 Vardiya" },
  ];

  if (!mounted || loading) {
    return (
      <div style={{ ...styles.app, display: "flex", alignItems: "center", justifyContent: "center", flexDirection: "column", gap: 16 }}>
        <div style={{ fontSize: 32 }}>🦺</div>
        <div style={{ color: "#94a3b8", fontSize: 14 }}>Veriler yükleniyor...</div>
      </div>
    );
  }

  const totalExpiredDocs = documents.filter(d => getDateStatus(d.expiryDate) === "Süresi Dolmuş").length;
  const totalSoonDocs = documents.filter(d => getDateStatus(d.expiryDate) === "Yaklaşıyor").length;
  const openDofs = dofs.filter(d => d.status !== "Kapandı").length;
  const highRisks = risks.filter(r => r.score >= 15).length;
  const incompleteEmployees = employees.filter(e => !e.trainingComplete).length;

  return (
    <div style={styles.app}>
      <header style={styles.header}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, fontWeight: 700, fontSize: 17, color: "#f1f5f9" }}>
          <span style={{ fontSize: 20 }}>🦺</span>
          <span>İSG <span style={{ color: "#38bdf8" }}>Otomasyon</span></span>
        </div>
        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          <button style={{ ...styles.btnSecondary, fontSize: 11 }} onClick={loadAll}>🔄 Yenile</button>
          <button style={{ ...styles.btnDanger, fontSize: 11 }} onClick={async () => {
            await signOut(auth);
            document.cookie = "isg_session=; path=/; max-age=0";
            router.push("/login");
          }}>Çıkış</button>
        </div>
      </header>

      <nav style={styles.nav}>
        {tabs.map(tab => (
          <button key={tab.id} style={{ padding: "8px 16px", borderRadius: "6px 6px 0 0", border: "none", cursor: "pointer", fontSize: 13, fontWeight: 500, whiteSpace: "nowrap" as const, backgroundColor: activeTab === tab.id ? "#0ea5e9" : "transparent", color: activeTab === tab.id ? "#fff" : "#94a3b8" }}
            onClick={() => { setActiveTab(tab.id); setSearch(""); }}>
            {tab.label}
          </button>
        ))}
      </nav>

      <main style={styles.content}>

        {activeTab === "ozet" && (
          <div>
            <p style={{ ...styles.sectionTitle, marginBottom: 20 }}>Genel Durum</p>
            <div style={styles.statGrid}>
              {[
                { value: companies.length, label: "Firma", color: "#38bdf8" },
                { value: employees.length, label: "Personel", color: "#a78bfa" },
                { value: totalExpiredDocs, label: "Süresi Dolmuş Belge", color: totalExpiredDocs > 0 ? "#dc2626" : "#16a34a" },
                { value: totalSoonDocs, label: "Yaklaşan Belge", color: totalSoonDocs > 0 ? "#d97706" : "#16a34a" },
                { value: openDofs, label: "Açık DÖF", color: openDofs > 0 ? "#d97706" : "#16a34a" },
                { value: highRisks, label: "Yüksek Risk (≥15)", color: highRisks > 0 ? "#dc2626" : "#16a34a" },
                { value: incompleteEmployees, label: "Eğitim Eksik", color: incompleteEmployees > 0 ? "#d97706" : "#16a34a" },
              ].map(({ value, label, color }) => (
                <div key={label} style={styles.statCard}>
                  <div style={{ ...styles.statValue, color }}>{value}</div>
                  <div style={styles.statLabel}>{label}</div>
                </div>
              ))}
            </div>
            <p style={styles.sectionTitle}>Firma Durumları</p>
            {companies.map(c => {
              const ind = getCompanyIndicator(c.id);
              const summary = getCompanyDocSummary(c.id);
              const empCount = employees.filter(e => e.companyId === c.id).length;
              return (
                <div key={c.id} style={{ ...styles.card, display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 8 }}>
                  <div>
                    <div style={{ fontWeight: 600, marginBottom: 4 }}>{c.nickName}</div>
                    <div style={{ fontSize: 12, color: "#94a3b8" }}>{empCount} personel · Sözleşme: {c.contractEnd} · <Badge text={c.dangerClass} color={c.dangerClass === "Çok Tehlikeli" ? "#dc2626" : c.dangerClass === "Tehlikeli" ? "#d97706" : "#16a34a"} /></div>
                  </div>
                  <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                    {summary.missingCount > 0 && <Badge text={`${summary.missingCount} Eksik`} color="#dc2626" />}
                    {summary.expiredCount > 0 && <Badge text={`${summary.expiredCount} Süresi Dolmuş`} color="#dc2626" />}
                    {summary.soonCount > 0 && <Badge text={`${summary.soonCount} Yaklaşıyor`} color="#d97706" />}
                    <Badge text={ind.text} color={ind.color} />
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {activeTab === "firmalar" && (
          <div>
            <div style={styles.card}>
              <p style={styles.sectionTitle}>Yeni Firma Ekle</p>
              <div style={styles.formGrid}>
                <FormField label="Kısa Ad *"><input style={styles.input} value={newCompany.nickName} onChange={e => setNewCompany({ ...newCompany, nickName: e.target.value })} /></FormField>
                <FormField label="SGK Sicil No *"><input style={styles.input} value={newCompany.sgkSicil} onChange={e => { const sgk = e.target.value; const nace = extractNaceFromSgk(sgk); const official = officialNameFromSgk(sgk); setNewCompany({ ...newCompany, sgkSicil: sgk, naceCode: nace, officialName: official || newCompany.officialName, dangerClass: dangerFromNace(nace) }); }} /></FormField>
                <FormField label="Resmi Unvan"><input style={styles.input} value={newCompany.officialName} onChange={e => setNewCompany({ ...newCompany, officialName: e.target.value })} /></FormField>
                <FormField label="NACE Kodu"><input style={styles.input} value={newCompany.naceCode} onChange={e => setNewCompany({ ...newCompany, naceCode: e.target.value, dangerClass: dangerFromNace(e.target.value) })} /></FormField>
                <FormField label="Tehlike Sınıfı"><select style={styles.select} value={newCompany.dangerClass} onChange={e => setNewCompany({ ...newCompany, dangerClass: e.target.value as DangerClass })}><option>Az Tehlikeli</option><option>Tehlikeli</option><option>Çok Tehlikeli</option></select></FormField>
                <FormField label="Çalışan Sayısı"><input style={styles.input} type="number" value={newCompany.employeeCount} onChange={e => setNewCompany({ ...newCompany, employeeCount: e.target.value })} /></FormField>
                <FormField label="Sözleşme Bitiş"><input style={styles.input} type="date" value={newCompany.contractEnd} onChange={e => setNewCompany({ ...newCompany, contractEnd: e.target.value })} /></FormField>
                <FormField label="Hizmet Türü"><select style={styles.select} value={newCompany.serviceType} onChange={e => setNewCompany({ ...newCompany, serviceType: e.target.value as ServiceType })}><option>İş Güvenliği</option><option>İş Güvenliği + İşyeri Hekimliği</option></select></FormField>
              </div>
              <div style={{ marginTop: 12 }}><button style={styles.btnPrimary} onClick={addCompany}>Firma Ekle</button></div>
            </div>
            <div style={styles.searchBar}>
              <input style={{ ...styles.input, maxWidth: 300 }} placeholder="Ara..." value={search} onChange={e => setSearch(e.target.value)} />
              <span style={{ color: "#64748b", fontSize: 13 }}>{filteredCompanies.length} firma</span>
            </div>
            <div style={{ ...styles.card, padding: 0, overflow: "auto" }}>
              <table style={styles.table}>
                <thead><tr>{["Kısa Ad", "Resmi Unvan", "SGK Sicil", "NACE", "Tehlike", "Personel", "Sözleşme", "Hizmet", "Durum", "İşlem"].map(h => <th key={h} style={styles.th}>{h}</th>)}</tr></thead>
                <tbody>
                  {filteredCompanies.map(c => {
                    const ind = getCompanyIndicator(c.id);
                    const cs = getDateStatus(c.contractEnd);
                    return (
                      <tr key={c.id}>
                        <td style={styles.td}><span style={{ fontWeight: 600 }}>{c.nickName}</span></td>
                        <td style={{ ...styles.td, maxWidth: 180, fontSize: 12, color: "#94a3b8" }}>{c.officialName}</td>
                        <td style={{ ...styles.td, fontSize: 11, color: "#64748b" }}>{c.sgkSicil}</td>
                        <td style={styles.td}>{c.naceCode}</td>
                        <td style={styles.td}><Badge text={c.dangerClass} color={c.dangerClass === "Çok Tehlikeli" ? "#dc2626" : c.dangerClass === "Tehlikeli" ? "#d97706" : "#16a34a"} /></td>
                        <td style={styles.td}>{c.employeeCount}</td>
                        <td style={styles.td}><span style={{ fontSize: 12 }}>{c.contractEnd}</span> <Badge text={cs} color={statusColor(cs)} /></td>
                        <td style={{ ...styles.td, fontSize: 12 }}>{c.serviceType}</td>
                        <td style={styles.td}><Badge text={ind.text} color={ind.color} /></td>
                        <td style={styles.td}><button style={styles.btnDanger} onClick={() => deleteCompany(c.id)}>Sil</button></td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === "personel" && (
          <div style={{ display: "grid", gridTemplateColumns: selectedEmployee ? "1fr 340px" : "1fr", gap: 20 }}>
            <div>
              <div style={styles.card}>
                <p style={styles.sectionTitle}>Yeni Personel Ekle</p>
                <div style={styles.formGrid}>
                  <FormField label="Firma *"><select style={styles.select} value={newEmployee.companyId} onChange={e => setNewEmployee({ ...newEmployee, companyId: e.target.value })}><option value="">Seçin...</option>{companies.map(c => <option key={c.id} value={c.id}>{c.nickName}</option>)}</select></FormField>
                  <FormField label="Ad *"><input style={styles.input} value={newEmployee.firstName} onChange={e => setNewEmployee({ ...newEmployee, firstName: e.target.value })} /></FormField>
                  <FormField label="Soyad"><input style={styles.input} value={newEmployee.lastName} onChange={e => setNewEmployee({ ...newEmployee, lastName: e.target.value })} /></FormField>
                  <FormField label="TC No"><input style={styles.input} value={newEmployee.tcNo} onChange={e => setNewEmployee({ ...newEmployee, tcNo: e.target.value })} /></FormField>
                  <FormField label="Unvan"><input style={styles.input} value={newEmployee.title} onChange={e => setNewEmployee({ ...newEmployee, title: e.target.value })} /></FormField>
                  <FormField label="İşe Giriş"><input style={styles.input} type="date" value={newEmployee.hireDate} onChange={e => setNewEmployee({ ...newEmployee, hireDate: e.target.value })} /></FormField>
                </div>
                <div style={{ marginTop: 12 }}><button style={styles.btnPrimary} onClick={addEmployee}>Personel Ekle</button></div>
              </div>
              <div style={styles.searchBar}>
                <input style={{ ...styles.input, maxWidth: 240 }} placeholder="Ara..." value={search} onChange={e => setSearch(e.target.value)} />
                <select style={{ ...styles.select, maxWidth: 180 }} value={selectedCompanyId} onChange={e => setSelectedCompanyId(e.target.value)}><option value="all">Tüm Firmalar</option>{companies.map(c => <option key={c.id} value={c.id}>{c.nickName}</option>)}</select>
                <span style={{ color: "#64748b", fontSize: 13 }}>{filteredEmployees.length} kişi</span>
              </div>
              <div style={{ ...styles.card, padding: 0, overflow: "auto" }}>
                <table style={styles.table}>
                  <thead><tr>{["Ad Soyad", "TC No", "Unvan", "Firma", "İşe Giriş", "Eğitim", "Kontrol Listesi", "İşlem"].map(h => <th key={h} style={styles.th}>{h}</th>)}</tr></thead>
                  <tbody>
                    {filteredEmployees.map(emp => {
                      const company = companies.find(c => c.id === emp.companyId);
                      const cl = checklistCompletion(emp.checklist);
                      return (
                        <tr key={emp.id} style={{ cursor: "pointer", backgroundColor: selectedEmployeeId === emp.id ? "#1a2942" : "transparent" }} onClick={() => setSelectedEmployeeId(emp.id)}>
                          <td style={styles.td}><span style={{ fontWeight: 600 }}>{emp.firstName} {emp.lastName}</span></td>
                          <td style={{ ...styles.td, fontSize: 12, color: "#94a3b8" }}>{emp.tcNo}</td>
                          <td style={styles.td}>{emp.title}</td>
                          <td style={{ ...styles.td, fontSize: 12 }}>{company?.nickName}</td>
                          <td style={{ ...styles.td, fontSize: 12 }}>{emp.hireDate}</td>
                          <td style={styles.td}><Badge text={emp.trainingComplete ? "Tamamlandı" : "Eksik"} color={emp.trainingComplete ? "#16a34a" : "#d97706"} /></td>
                          <td style={styles.td}>
                            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                              <div style={{ height: 6, width: 80, backgroundColor: "#0f172a", borderRadius: 3, overflow: "hidden" }}>
                                <div style={{ height: "100%", width: `${(cl.completed / cl.total) * 100}%`, backgroundColor: cl.missing === 0 ? "#16a34a" : "#d97706" }} />
                              </div>
                              <span style={{ fontSize: 11, color: "#94a3b8" }}>{cl.completed}/{cl.total}</span>
                            </div>
                          </td>
                          <td style={styles.td}><button style={styles.btnDanger} onClick={e => { e.stopPropagation(); deleteEmployee(emp.id); }}>Sil</button></td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
            {selectedEmployee && (
              <div>
                <div style={styles.card}>
                  <p style={styles.sectionTitle}>Personel Detayı</p>
                  <div style={{ fontWeight: 700, fontSize: 16, marginBottom: 2 }}>{selectedEmployee.firstName} {selectedEmployee.lastName}</div>
                  <div style={{ fontSize: 12, color: "#94a3b8" }}>{selectedEmployee.title}</div>
                  <div style={{ fontSize: 12, color: "#64748b", marginTop: 2 }}>{selectedEmployeeCompany?.nickName}</div>
                  <p style={{ ...styles.sectionTitle, marginTop: 16 }}>Kontrol Listesi</p>
                  {[{ key: "isgCertificateDate", label: "İSG Sertifikası Tarihi" }, { key: "ek2Date", label: "EK-2 Tarihi" }, { key: "orientationDate", label: "Oryantasyon Tarihi" }].map(({ key, label }) => (
                    <FormField key={key} label={label}>
                      <input style={{ ...styles.input, marginBottom: 8 }} type="date" value={(selectedEmployee.checklist as any)[key]}
                        onChange={e => { const updated = { ...selectedEmployee.checklist, [key]: e.target.value }; updateEmployeeChecklist(selectedEmployee.id, updated); }} />
                    </FormField>
                  ))}
                  {[{ key: "preTest", label: "Ön Test" }, { key: "postTest", label: "Son Test" }, { key: "undertaking", label: "Taahhütname" }, { key: "kkdMinutes", label: "KKD Tutanağı" }, { key: "attendanceDoc", label: "Katılım Belgesi" }].map(({ key, label }) => (
                    <label key={key} style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8, cursor: "pointer", fontSize: 13 }}>
                      <input type="checkbox" checked={(selectedEmployee.checklist as any)[key]}
                        onChange={e => { const updated = { ...selectedEmployee.checklist, [key]: e.target.checked }; updateEmployeeChecklist(selectedEmployee.id, updated); }} />
                      {label}
                    </label>
                  ))}
                  <label style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 8, cursor: "pointer", fontSize: 13 }}>
                    <input type="checkbox" checked={selectedEmployee.trainingComplete} onChange={e => updateEmployeeTraining(selectedEmployee.id, e.target.checked)} />
                    Eğitim Tamamlandı
                  </label>
                  {selectedEmployee.checklist.isgCertificateDate && (
                    <button style={{ ...styles.btnPrimary, marginTop: 16, width: "100%" }} onClick={() => printEmployeeCertificate(selectedEmployee, selectedEmployeeCompany)}>
                      🖨 Sertifikayı Yazdır
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === "belgeler" && (
          <div>
            <div style={styles.card}>
              <p style={styles.sectionTitle}>Yeni Belge Ekle</p>
              <div style={styles.formGrid}>
                <FormField label="Firma *"><select style={styles.select} value={newDocument.companyId} onChange={e => setNewDocument({ ...newDocument, companyId: e.target.value })}><option value="">Seçin...</option>{companies.map(c => <option key={c.id} value={c.id}>{c.nickName}</option>)}</select></FormField>
                <FormField label="Belge Türü *"><select style={styles.select} value={newDocument.type} onChange={e => setNewDocument({ ...newDocument, type: e.target.value })}>{documentTemplates.map(t => <option key={t}>{t}</option>)}</select></FormField>
                <FormField label="Personel (opsiyonel)"><select style={styles.select} value={newDocument.employeeId} onChange={e => setNewDocument({ ...newDocument, employeeId: e.target.value })}><option value="">Firma Belgesi</option>{employees.filter(e => !newDocument.companyId || e.companyId === newDocument.companyId).map(e => <option key={e.id} value={e.id}>{e.firstName} {e.lastName}</option>)}</select></FormField>
                <FormField label="Düzenleme Tarihi *"><input style={styles.input} type="date" value={newDocument.issueDate} onChange={e => setNewDocument({ ...newDocument, issueDate: e.target.value })} /></FormField>
                <FormField label="Geçerlilik Tarihi"><input style={styles.input} type="date" value={newDocument.expiryDate} onChange={e => setNewDocument({ ...newDocument, expiryDate: e.target.value })} /></FormField>
              </div>
              <div style={{ marginTop: 12 }}><button style={styles.btnPrimary} onClick={addDocument}>Belge Ekle</button></div>
            </div>
            <div style={styles.searchBar}>
              <input style={{ ...styles.input, maxWidth: 240 }} placeholder="Ara..." value={search} onChange={e => setSearch(e.target.value)} />
              <select style={{ ...styles.select, maxWidth: 180 }} value={selectedCompanyId} onChange={e => setSelectedCompanyId(e.target.value)}><option value="all">Tüm Firmalar</option>{companies.map(c => <option key={c.id} value={c.id}>{c.nickName}</option>)}</select>
              <span style={{ color: "#64748b", fontSize: 13 }}>{filteredDocuments.length} belge</span>
            </div>
            <div style={{ ...styles.card, padding: 0, overflow: "auto" }}>
              <table style={styles.table}>
                <thead><tr>{["Belge Türü", "Firma", "Personel", "Düzenleme", "Geçerlilik", "Durum", "İşlem"].map(h => <th key={h} style={styles.th}>{h}</th>)}</tr></thead>
                <tbody>
                  {filteredDocuments.map(d => {
                    const company = companies.find(c => c.id === d.companyId);
                    const emp = employees.find(e => e.id === d.employeeId);
                    const ds = d.expiryDate ? getDateStatus(d.expiryDate) : "—";
                    const days = d.expiryDate ? daysUntil(d.expiryDate) : null;
                    return (
                      <tr key={d.id}>
                        <td style={{ ...styles.td, fontWeight: 500 }}>{d.type}</td>
                        <td style={styles.td}>{company?.nickName}</td>
                        <td style={{ ...styles.td, fontSize: 12, color: "#94a3b8" }}>{emp ? `${emp.firstName} ${emp.lastName}` : "—"}</td>
                        <td style={{ ...styles.td, fontSize: 12 }}>{d.issueDate}</td>
                        <td style={{ ...styles.td, fontSize: 12 }}>{d.expiryDate || "—"}</td>
                        <td style={styles.td}>{d.expiryDate ? <div><Badge text={ds} color={statusColor(ds)} />{days !== null && days >= 0 && <div style={{ fontSize: 11, color: "#64748b", marginTop: 2 }}>{days} gün</div>}</div> : "—"}</td>
                        <td style={styles.td}><button style={styles.btnDanger} onClick={() => deleteDocument(d.id)}>Sil</button></td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === "gozlemciler" && (
          <div>
            <div style={styles.card}>
              <p style={styles.sectionTitle}>Yeni Gözlemci Ekle</p>
              <div style={styles.formGrid}>
                <FormField label="Ad Soyad *"><input style={styles.input} value={newObserver.fullName} onChange={e => setNewObserver({ ...newObserver, fullName: e.target.value })} /></FormField>
                <FormField label="Unvan"><input style={styles.input} value={newObserver.title} onChange={e => setNewObserver({ ...newObserver, title: e.target.value })} /></FormField>
                <FormField label="Sertifika No"><input style={styles.input} value={newObserver.certificateNo} onChange={e => setNewObserver({ ...newObserver, certificateNo: e.target.value })} /></FormField>
                <FormField label="Telefon"><input style={styles.input} value={newObserver.phone} onChange={e => setNewObserver({ ...newObserver, phone: e.target.value })} /></FormField>
              </div>
              <div style={{ marginTop: 12 }}><button style={styles.btnPrimary} onClick={addObserver}>Gözlemci Ekle</button></div>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 12 }}>
              {observers.map(obs => (
                <div key={obs.id} style={styles.card}>
                  <div style={{ fontWeight: 700, marginBottom: 4 }}>{obs.fullName}</div>
                  <div style={{ fontSize: 12, color: "#94a3b8", marginBottom: 2 }}>{obs.title}</div>
                  <div style={{ fontSize: 12, color: "#64748b" }}>Sertifika: {obs.certificateNo}</div>
                  <div style={{ fontSize: 12, color: "#64748b" }}>Tel: {obs.phone}</div>
                  <div style={{ marginTop: 12 }}><button style={styles.btnDanger} onClick={() => deleteObserver(obs.id)}>Sil</button></div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === "dof" && (
          <div>
            <div style={styles.card}>
              <p style={styles.sectionTitle}>Yeni DÖF Kaydı</p>
              <div style={styles.formGrid}>
                <FormField label="Firma *"><select style={styles.select} value={newDof.companyId} onChange={e => setNewDof({ ...newDof, companyId: e.target.value })}><option value="">Seçin...</option>{companies.map(c => <option key={c.id} value={c.id}>{c.nickName}</option>)}</select></FormField>
                <FormField label="Gözlemci"><select style={styles.select} value={newDof.observerId} onChange={e => setNewDof({ ...newDof, observerId: e.target.value })}><option value="">Seçin...</option>{observers.map(o => <option key={o.id} value={o.id}>{o.fullName}</option>)}</select></FormField>
                <FormField label="Başlık *"><input style={styles.input} value={newDof.title} onChange={e => setNewDof({ ...newDof, title: e.target.value })} /></FormField>
                <FormField label="Konum"><input style={styles.input} value={newDof.location} onChange={e => setNewDof({ ...newDof, location: e.target.value })} /></FormField>
                <FormField label="Öncelik"><select style={styles.select} value={newDof.priority} onChange={e => setNewDof({ ...newDof, priority: e.target.value as any })}><option>Düşük</option><option>Orta</option><option>Yüksek</option></select></FormField>
                <FormField label="Sorumlu"><input style={styles.input} value={newDof.responsible} onChange={e => setNewDof({ ...newDof, responsible: e.target.value })} /></FormField>
                <FormField label="Termin"><input style={styles.input} type="date" value={newDof.dueDate} onChange={e => setNewDof({ ...newDof, dueDate: e.target.value })} /></FormField>
                <FormField label="Durum"><select style={styles.select} value={newDof.status} onChange={e => setNewDof({ ...newDof, status: e.target.value as any })}><option>Açık</option><option>Devam Ediyor</option><option>Kapandı</option></select></FormField>
              </div>
              <div style={{ marginTop: 10 }}>
                <label style={styles.label}>Açıklama</label>
                <textarea style={{ ...styles.input, height: 60, resize: "vertical" as const }} value={newDof.description} onChange={e => setNewDof({ ...newDof, description: e.target.value })} />
              </div>
              <div style={{ marginTop: 10 }}>
                <label style={styles.label}>Yasal Dayanak</label>
                <input style={styles.input} value={newDof.lawReference} onChange={e => setNewDof({ ...newDof, lawReference: e.target.value })} />
              </div>
              <div style={{ marginTop: 10, display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                <div><label style={styles.label}>Öncesi Fotoğraf</label><input type="file" accept="image/*" style={{ fontSize: 12, color: "#94a3b8" }} onChange={e => handleImageToBase64(e, b64 => setNewDof({ ...newDof, beforePhoto: b64 }))} /></div>
                <div><label style={styles.label}>Sonrası Fotoğraf</label><input type="file" accept="image/*" style={{ fontSize: 12, color: "#94a3b8" }} onChange={e => handleImageToBase64(e, b64 => setNewDof({ ...newDof, afterPhoto: b64 }))} /></div>
              </div>
              <div style={{ marginTop: 12 }}><button style={styles.btnPrimary} onClick={addDof}>DÖF Ekle</button></div>
            </div>
            <div style={styles.searchBar}>
              <input style={{ ...styles.input, maxWidth: 240 }} placeholder="Ara..." value={search} onChange={e => setSearch(e.target.value)} />
              <select style={{ ...styles.select, maxWidth: 180 }} value={selectedCompanyId} onChange={e => setSelectedCompanyId(e.target.value)}><option value="all">Tüm Firmalar</option>{companies.map(c => <option key={c.id} value={c.id}>{c.nickName}</option>)}</select>
              <span style={{ color: "#64748b", fontSize: 13 }}>{filteredDofs.length} kayıt</span>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))", gap: 12 }}>
              {filteredDofs.map(dof => {
                const company = companies.find(c => c.id === dof.companyId);
                const observer = observers.find(o => o.id === dof.observerId);
                const isEditing = editingDofId === dof.id;
                return (
                  <div key={dof.id} style={{ ...styles.card, borderLeft: `3px solid ${priorityColor(dof.priority)}` }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 8 }}>
                      <div style={{ fontWeight: 700, fontSize: 14 }}>{dof.title}</div>
                      <Badge text={dof.priority} color={priorityColor(dof.priority)} />
                    </div>
                    <div style={{ fontSize: 12, color: "#94a3b8", marginBottom: 4 }}>{dof.description}</div>
                    <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 8 }}>
                      <span style={{ fontSize: 11, color: "#64748b" }}>📍 {dof.location}</span>
                      <span style={{ fontSize: 11, color: "#64748b" }}>👤 {dof.responsible}</span>
                      <span style={{ fontSize: 11, color: "#64748b" }}>📅 {dof.dueDate}</span>
                    </div>
                    <div style={{ display: "flex", gap: 6, marginBottom: 8, flexWrap: "wrap" }}>
                      <Badge text={dof.status} color={dof.status === "Kapandı" ? "#16a34a" : dof.status === "Devam Ediyor" ? "#d97706" : "#dc2626"} />
                      <span style={{ fontSize: 11, color: "#64748b" }}>{company?.nickName}</span>
                      {observer && <span style={{ fontSize: 11, color: "#64748b" }}>{observer.fullName}</span>}
                    </div>
                    {(dof.beforePhoto || dof.afterPhoto) && (
                      <div style={{ display: "flex", gap: 8, marginBottom: 8 }}>
                        {dof.beforePhoto && <div><div style={{ fontSize: 10, color: "#64748b", marginBottom: 2 }}>Önce</div><img src={dof.beforePhoto} alt="önce" style={{ width: 80, height: 60, objectFit: "cover", borderRadius: 4 }} /></div>}
                        {dof.afterPhoto && <div><div style={{ fontSize: 10, color: "#64748b", marginBottom: 2 }}>Sonra</div><img src={dof.afterPhoto} alt="sonra" style={{ width: 80, height: 60, objectFit: "cover", borderRadius: 4 }} /></div>}
                      </div>
                    )}
                    {isEditing && (
                      <div style={{ marginBottom: 8 }}>
                        <select style={styles.select} value={dof.status} onChange={e => updateDofStatus(dof.id, e.target.value as any)}>
                          <option>Açık</option><option>Devam Ediyor</option><option>Kapandı</option>
                        </select>
                      </div>
                    )}
                    <div style={{ display: "flex", gap: 6 }}>
                      <button style={styles.btnSecondary} onClick={() => setEditingDofId(isEditing ? null : dof.id)}>{isEditing ? "Kapat" : "Düzenle"}</button>
                      <button style={{ ...styles.btnPrimary, fontSize: 11, padding: "4px 10px" }} onClick={() => createRiskFromDof(dof)}>
                        {risks.some(r => r.sourceDofId === dof.id) ? "✓ Risk Var" : "⚡ Risk Oluştur"}
                      </button>
                      <button style={styles.btnDanger} onClick={() => deleteDof(dof.id)}>Sil</button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {activeTab === "risk" && (
          <div>
            <div style={styles.card}>
              <p style={styles.sectionTitle}>Yeni Risk Kaydı</p>
              <div style={styles.formGrid}>
                <FormField label="Firma *"><select style={styles.select} value={newRisk.companyId} onChange={e => setNewRisk({ ...newRisk, companyId: e.target.value })}><option value="">Seçin...</option>{companies.map(c => <option key={c.id} value={c.id}>{c.nickName}</option>)}</select></FormField>
                <FormField label="Bölüm / Faaliyet"><input style={styles.input} value={newRisk.section} onChange={e => setNewRisk({ ...newRisk, section: e.target.value })} /></FormField>
                <FormField label="Tehlike Kaynağı / Mevcut Durum *"><input style={styles.input} value={newRisk.hazard} onChange={e => setNewRisk({ ...newRisk, hazard: e.target.value })} /></FormField>
                <FormField label="Tehlike"><input style={styles.input} value={newRisk.risk} onChange={e => setNewRisk({ ...newRisk, risk: e.target.value })} /></FormField>
                <FormField label="Mevcut Önlem"><input style={styles.input} value={newRisk.currentMeasure} onChange={e => setNewRisk({ ...newRisk, currentMeasure: e.target.value })} /></FormField>
                <FormField label="Öneriler / Alınacak Önlemler"><input style={styles.input} value={newRisk.actionToTake} onChange={e => setNewRisk({ ...newRisk, actionToTake: e.target.value })} /></FormField>
                <FormField label="Olasılık (1-5)"><input style={styles.input} type="number" min={1} max={5} value={newRisk.probability} onChange={e => setNewRisk({ ...newRisk, probability: e.target.value })} /></FormField>
                <FormField label="Şiddet (1-5)"><input style={styles.input} type="number" min={1} max={5} value={newRisk.severity} onChange={e => setNewRisk({ ...newRisk, severity: e.target.value })} /></FormField>
                <FormField label="Kalıntı Olasılık"><input style={styles.input} type="number" min={1} max={5} value={newRisk.residualProbability} onChange={e => setNewRisk({ ...newRisk, residualProbability: e.target.value })} /></FormField>
                <FormField label="Kalıntı Şiddet"><input style={styles.input} type="number" min={1} max={5} value={newRisk.residualSeverity} onChange={e => setNewRisk({ ...newRisk, residualSeverity: e.target.value })} /></FormField>
                <FormField label="Etkilenecek Kişiler"><input style={styles.input} value={newRisk.affectedPersons} onChange={e => setNewRisk({ ...newRisk, affectedPersons: e.target.value })} placeholder="Tüm çalışanlar" /></FormField>
                <FormField label="Sorumlu"><input style={styles.input} value={newRisk.responsible} onChange={e => setNewRisk({ ...newRisk, responsible: e.target.value })} /></FormField>
                <FormField label="Termin"><input style={styles.input} type="date" value={newRisk.dueDate} onChange={e => setNewRisk({ ...newRisk, dueDate: e.target.value })} /></FormField>
                <FormField label="Kontrol Tarihi"><input style={styles.input} type="date" value={newRisk.controlDate} onChange={e => setNewRisk({ ...newRisk, controlDate: e.target.value })} /></FormField>
                <FormField label="Durum"><select style={styles.select} value={newRisk.status} onChange={e => setNewRisk({ ...newRisk, status: e.target.value as any })}><option>Açık</option><option>Kontrol Altında</option><option>Kapandı</option></select></FormField>
                <FormField label="İlgili Mevzuat">
                  <input style={styles.input} value={newRisk.lawReference} onChange={e => setNewRisk({ ...newRisk, lawReference: e.target.value })} placeholder="6331 sayılı İSG Kanunu..." />
                </FormField>
              </div>
              <div style={{ marginTop: 8, fontSize: 13, color: "#94a3b8" }}>
                Risk Skoru = <strong style={{ color: riskScoreColor(parseInt(newRisk.probability) * parseInt(newRisk.severity)) }}>{parseInt(newRisk.probability) * parseInt(newRisk.severity)}</strong>
                {" · "}Kalıntı Skoru = <strong style={{ color: riskScoreColor(parseInt(newRisk.residualProbability) * parseInt(newRisk.residualSeverity)) }}>{parseInt(newRisk.residualProbability) * parseInt(newRisk.residualSeverity)}</strong>
              </div>
              <div style={{ marginTop: 12 }}><button style={styles.btnPrimary} onClick={addRisk}>Risk Ekle</button></div>
            </div>

            <div style={styles.searchBar}>
              <input style={{ ...styles.input, maxWidth: 240 }} placeholder="Ara..." value={search} onChange={e => setSearch(e.target.value)} />
              <select style={{ ...styles.select, maxWidth: 180 }} value={selectedCompanyId} onChange={e => setSelectedCompanyId(e.target.value)}><option value="all">Tüm Firmalar</option>{companies.map(c => <option key={c.id} value={c.id}>{c.nickName}</option>)}</select>
              <span style={{ color: "#64748b", fontSize: 13 }}>{filteredRisks.length} kayıt</span>
              <button
                style={{ ...styles.btnSuccess, marginLeft: "auto", opacity: pdfLoading || risks.length === 0 ? 0.6 : 1 }}
                disabled={pdfLoading || risks.length === 0}
                onClick={async () => {
                  setPdfLoading(true);
                  try {
                    const risksToExport = selectedCompanyId === "all" ? risks : risks.filter(r => r.companyId === selectedCompanyId);
                    const companiesToExport = selectedCompanyId === "all" ? companies : companies.filter(c => c.id === selectedCompanyId);
                    await generateRiskPDF(risksToExport, companiesToExport);
                  } finally {
                    setPdfLoading(false);
                  }
                }}
              >
                {pdfLoading ? "⏳ Hazırlanıyor..." : "📄 PDF Rapor İndir"}
              </button>
            </div>

            <div style={{ ...styles.card, padding: 0, overflow: "auto" }}>
              <table style={styles.table}>
                <thead>
                  <tr>
                    {["Firma", "Bölüm", "Tehlike Kaynağı", "Tehlike", "Mevcut Önlem", "Öneriler", "O", "Ş", "RS", "KO", "KŞ", "KRS", "Etkilenecek", "Sorumlu", "Termin", "K.Tarihi", "Durum", "Mevzuat", "İşlem"].map(h => (
                      <th key={h} style={styles.th}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filteredRisks.map(r => {
                    const company = companies.find(c => c.id === r.companyId);
                    return (
                      <tr key={r.id}>
                        <td style={{ ...styles.td, fontSize: 12 }}>{company?.nickName}</td>
                        <td style={styles.td}>{r.section}</td>
                        <td style={{ ...styles.td, fontWeight: 500 }}>{r.hazard}</td>
                        <td style={{ ...styles.td, fontSize: 12, color: "#94a3b8" }}>{r.risk}</td>
                        <td style={{ ...styles.td, fontSize: 11, color: "#64748b" }}>{r.currentMeasure}</td>
                        <td style={{ ...styles.td, fontSize: 11, color: "#64748b" }}>{r.actionToTake}</td>
                        <td style={{ ...styles.td, textAlign: "center" as const, fontSize: 12 }}>{r.probability}</td>
                        <td style={{ ...styles.td, textAlign: "center" as const, fontSize: 12 }}>{r.severity}</td>
                        <td style={styles.td}><span style={{ fontWeight: 700, color: riskScoreColor(r.score), fontSize: 14 }}>{r.score}</span></td>
                        <td style={{ ...styles.td, textAlign: "center" as const, fontSize: 12 }}>{r.residualProbability}</td>
                        <td style={{ ...styles.td, textAlign: "center" as const, fontSize: 12 }}>{r.residualSeverity}</td>
                        <td style={styles.td}><span style={{ fontWeight: 700, color: riskScoreColor(r.residualScore), fontSize: 14 }}>{r.residualScore}</span></td>
                        <td style={{ ...styles.td, fontSize: 11 }}>{r.affectedPersons || "—"}</td>
                        <td style={{ ...styles.td, fontSize: 12 }}>{r.responsible}</td>
                        <td style={{ ...styles.td, fontSize: 12 }}>{r.dueDate}</td>
                        <td style={{ ...styles.td, fontSize: 12 }}>{r.controlDate || "—"}</td>
                        <td style={styles.td}><Badge text={r.status} color={r.status === "Kapandı" ? "#16a34a" : r.status === "Kontrol Altında" ? "#d97706" : "#dc2626"} /></td>
                        <td style={{ ...styles.td, fontSize: 11, color: "#94a3b8", maxWidth: 140 }}>{r.lawReference || "—"}</td>
                        <td style={styles.td}><button style={styles.btnDanger} onClick={() => deleteRisk(r.id)}>Sil</button></td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === "vardiya" && (() => {
          const weekDays = getWeekDays(shiftWeekOffset);
          const dayNames = ["Pzt", "Sal", "Çar", "Per", "Cum", "Cmt", "Paz"];
          const companyEmployees = newShift.companyId
            ? employees.filter(e => e.companyId === newShift.companyId && e.isActive)
            : [];
          const filteredShifts = selectedCompanyId === "all"
            ? shifts
            : shifts.filter(s => s.companyId === selectedCompanyId);

          const shiftColor: Record<ShiftType, string> = {
            "Gündüz": "#0ea5e9",
            "Akşam": "#d97706",
            "Gece": "#7c3aed",
          };

          return (
            <div>
              {/* Form */}
              <div style={styles.card}>
                <p style={styles.sectionTitle}>Vardiya Ekle</p>
                <div style={styles.formGrid}>
                  <FormField label="Firma *">
                    <select style={styles.select} value={newShift.companyId} onChange={e => setNewShift({ ...newShift, companyId: e.target.value, employeeId: "" })}>
                      <option value="">Seçin...</option>
                      {companies.map(c => <option key={c.id} value={c.id}>{c.nickName}</option>)}
                    </select>
                  </FormField>
                  <FormField label="Personel *">
                    <select style={styles.select} value={newShift.employeeId} onChange={e => setNewShift({ ...newShift, employeeId: e.target.value })}>
                      <option value="">Seçin...</option>
                      {companyEmployees.map(e => <option key={e.id} value={e.id}>{e.firstName} {e.lastName}</option>)}
                    </select>
                  </FormField>
                  <FormField label="Tarih *">
                    <input style={styles.input} type="date" value={newShift.date} onChange={e => setNewShift({ ...newShift, date: e.target.value })} />
                  </FormField>
                  <FormField label="Vardiya Türü">
                    <select style={styles.select} value={newShift.shiftType} onChange={e => setNewShift({ ...newShift, shiftType: e.target.value as ShiftType, startTime: e.target.value === "Gündüz" ? "08:00" : e.target.value === "Akşam" ? "16:00" : "00:00", endTime: e.target.value === "Gündüz" ? "16:00" : e.target.value === "Akşam" ? "00:00" : "08:00" })}>
                      <option>Gündüz</option>
                      <option>Akşam</option>
                      <option>Gece</option>
                    </select>
                  </FormField>
                  <FormField label="Başlangıç">
                    <input style={styles.input} type="time" value={newShift.startTime} onChange={e => setNewShift({ ...newShift, startTime: e.target.value })} />
                  </FormField>
                  <FormField label="Bitiş">
                    <input style={styles.input} type="time" value={newShift.endTime} onChange={e => setNewShift({ ...newShift, endTime: e.target.value })} />
                  </FormField>
                  <FormField label="Not">
                    <input style={styles.input} value={newShift.note} onChange={e => setNewShift({ ...newShift, note: e.target.value })} placeholder="Opsiyonel..." />
                  </FormField>
                </div>
                <div style={{ marginTop: 12 }}>
                  <button style={styles.btnPrimary} onClick={addShift}>Vardiya Ekle</button>
                </div>
              </div>

              {/* Haftalık Takvim */}
              <div style={styles.card}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16, flexWrap: "wrap", gap: 8 }}>
                  <p style={{ ...styles.sectionTitle, margin: 0 }}>Haftalık Takvim</p>
                  <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                    <select style={{ ...styles.select, maxWidth: 180 }} value={selectedCompanyId} onChange={e => setSelectedCompanyId(e.target.value)}>
                      <option value="all">Tüm Firmalar</option>
                      {companies.map(c => <option key={c.id} value={c.id}>{c.nickName}</option>)}
                    </select>
                    <button style={styles.btnSecondary} onClick={() => setShiftWeekOffset(prev => prev - 1)}>← Önceki</button>
                    <button style={{ ...styles.btnSecondary, minWidth: 60 }} onClick={() => setShiftWeekOffset(0)}>Bu Hafta</button>
                    <button style={styles.btnSecondary} onClick={() => setShiftWeekOffset(prev => prev + 1)}>Sonraki →</button>
                  </div>
                </div>

                {/* Takvim grid */}
                <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 6 }}>
                  {weekDays.map((day, i) => {
                    const key = formatDateKey(day);
                    const dayShifts = filteredShifts.filter(s => s.date === key);
                    const isToday = formatDateKey(new Date()) === key;
                    return (
                      <div key={key} style={{ backgroundColor: isToday ? "#1e3a5f" : "#0f172a", border: `1px solid ${isToday ? "#0ea5e9" : "#334155"}`, borderRadius: 8, padding: 8, minHeight: 120 }}>
                        <div style={{ fontSize: 11, color: isToday ? "#38bdf8" : "#64748b", fontWeight: 600, marginBottom: 2 }}>{dayNames[i]}</div>
                        <div style={{ fontSize: 13, fontWeight: 700, color: isToday ? "#e2e8f0" : "#94a3b8", marginBottom: 8 }}>{day.getDate()}.{String(day.getMonth() + 1).padStart(2, "0")}</div>
                        {dayShifts.map(s => {
                          const emp = employees.find(e => e.id === s.employeeId);
                          return (
                            <div key={s.id} style={{ backgroundColor: shiftColor[s.shiftType] + "22", border: `1px solid ${shiftColor[s.shiftType]}44`, borderRadius: 4, padding: "4px 6px", marginBottom: 4, fontSize: 11 }}>
                              <div style={{ color: shiftColor[s.shiftType], fontWeight: 600 }}>{s.shiftType}</div>
                              <div style={{ color: "#e2e8f0" }}>{emp ? `${emp.firstName} ${emp.lastName}` : "—"}</div>
                              <div style={{ color: "#64748b" }}>{s.startTime}–{s.endTime}</div>
                              {s.note && <div style={{ color: "#94a3b8", fontSize: 10, marginTop: 2 }}>{s.note}</div>}
                              <button style={{ ...styles.btnDanger, fontSize: 10, padding: "2px 6px", marginTop: 4 }} onClick={() => deleteShift(s.id)}>Sil</button>
                            </div>
                          );
                        })}
                      </div>
                    );
                  })}
                </div>

                {/* Legend */}
                <div style={{ display: "flex", gap: 16, marginTop: 12 }}>
                  {(["Gündüz", "Akşam", "Gece"] as ShiftType[]).map(t => (
                    <div key={t} style={{ display: "flex", alignItems: "center", gap: 6 }}>
                      <div style={{ width: 10, height: 10, borderRadius: 2, backgroundColor: shiftColor[t] }} />
                      <span style={{ fontSize: 12, color: "#94a3b8" }}>{t}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Liste görünümü */}
              <div style={styles.card}>
                <p style={styles.sectionTitle}>Tüm Vardiyalar</p>
                <div style={{ ...styles.card, padding: 0, overflow: "auto", margin: 0 }}>
                  <table style={styles.table}>
                    <thead>
                      <tr>
                        {["Firma", "Personel", "Tarih", "Tür", "Saat", "Not", "İşlem"].map(h => (
                          <th key={h} style={styles.th}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {filteredShifts.sort((a, b) => b.date.localeCompare(a.date)).map(s => {
                        const emp = employees.find(e => e.id === s.employeeId);
                        const company = companies.find(c => c.id === s.companyId);
                        return (
                          <tr key={s.id}>
                            <td style={{ ...styles.td, fontSize: 12 }}>{company?.nickName || "—"}</td>
                            <td style={styles.td}>{emp ? `${emp.firstName} ${emp.lastName}` : "—"}</td>
                            <td style={{ ...styles.td, fontSize: 12 }}>{s.date}</td>
                            <td style={styles.td}><Badge text={s.shiftType} color={shiftColor[s.shiftType]} /></td>
                            <td style={{ ...styles.td, fontSize: 12 }}>{s.startTime}–{s.endTime}</td>
                            <td style={{ ...styles.td, fontSize: 12, color: "#94a3b8" }}>{s.note || "—"}</td>
                            <td style={styles.td}><button style={styles.btnDanger} onClick={() => deleteShift(s.id)}>Sil</button></td>
                          </tr>
                        );
                      })}
                      {filteredShifts.length === 0 && (
                        <tr><td colSpan={7} style={{ ...styles.td, textAlign: "center", color: "#64748b" }}>Vardiya kaydı yok</td></tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          );
        })()}

      </main>
    </div>
  );
}
