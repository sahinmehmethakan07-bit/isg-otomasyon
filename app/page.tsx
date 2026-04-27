"use client";

import React, { ChangeEvent, useEffect, useMemo, useState } from "react";
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
  getDoc,
  setDoc,
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
  contactEmail?: string;
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
  status: "Açık" | "Bildirildi" | "Önlem Alındı" | "Çözüldü" | "Riske Aktarıldı";
  location: string;
  beforePhoto?: string;
  afterPhoto?: string;
  affectedPersons?: string;
};

type SignerRole = "İş Güvenliği Uzmanı" | "İşveren / İşveren Vekili" | "Çalışan Temsilcisi";

type EmailSettings = {
  enabled: boolean;
  toEmail: string;
  ccEmail: string;
  subject: string;
  message: string;
};

type EmailContact = {
  id: string;
  name: string;
  email: string;
  role: string;
};

type Signer = {
  id: string;
  companyId: string;
  role: SignerRole;
  fullName: string;
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

async function generateRiskPDF(risks: RiskRecord[], companies: Company[], signers: Signer[]) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const pdfMake = (await import("pdfmake/build/pdfmake")) as any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const pdfFonts = (await import("pdfmake/build/vfs_fonts")) as any;
  const maker = pdfMake.default || pdfMake;
  maker.vfs = (pdfFonts.default || pdfFonts).vfs;

  const today = new Date().toLocaleDateString("tr-TR");
  const nextYear = new Date(new Date().setFullYear(new Date().getFullYear() + 1)).toLocaleDateString("tr-TR");
  const byCompany = companies
    .map((c) => ({ company: c, risks: risks.filter((r) => r.companyId === c.id) }))
    .filter((g) => g.risks.length > 0);

  if (byCompany.length === 0) return;

  const scoreColor = (s: number): string => s >= 15 ? "#dc2626" : s >= 8 ? "#d97706" : "#16a34a";
  const HL = "#1e293b"; // header/label color

  const content: any[] = [];
  let pageNum = 0;

  for (const { company, risks: cr } of byCompany) {
    if (content.length > 0) content.push({ text: "", pageBreak: "before" });
    pageNum++;

    // ── Sayfa 1: Başlık ──
    content.push({
      table: { widths: ["*"], body: [[{
        stack: [
          { text: company.officialName.toUpperCase(), fontSize: 14, bold: true, color: "white", alignment: "center" },
          { text: "RİSK DEĞERLENDİRME RAPORU", fontSize: 10, color: "white", alignment: "center", margin: [0, 2, 0, 0] },
        ],
        fillColor: HL, margin: [0, 6, 0, 6],
      }]] },
      layout: "noBorders",
      margin: [0, 0, 0, 6],
    });

    // ── Bilgi bölümü ──
    const infoRow = (label: string, value: string) => ({
      text: [{ text: label, bold: true, fontSize: 8 }, { text: " " + value, fontSize: 8 }], margin: [0, 1, 0, 1] as [number, number, number, number],
    });

    content.push({
      columns: [
        { width: "50%", stack: [
          infoRow("İşyeri Ünvanı :", company.officialName),
          infoRow("İşyeri Bölümü :", "GENEL"),
          infoRow("NACE Kodu :", company.naceCode),
          infoRow("Çalışan Sayısı :", String(company.employeeCount)),
          infoRow("Hizmet Türü :", company.serviceType),
        ]},
        { width: "50%", stack: [
          infoRow("SGK Sicil No. :", company.sgkSicil),
          infoRow("Analiz Tarihi :", today),
          infoRow("Tehlike Sınıfı :", company.dangerClass),
          infoRow("Geçerlilik Tarihi :", nextYear),
        ]},
      ],
      margin: [0, 0, 0, 8],
    });

    // ── Risk tablosu ──
    const hdr = (t: string) => ({ text: t, fontSize: 6, bold: true, color: "white", fillColor: HL, alignment: "center" as const, margin: [1, 3, 1, 3] as [number, number, number, number] });
    const tableHead = [
      hdr("No"), hdr("Bölüm /\nFaaliyet"), hdr("Tehlike Kaynağı /\nMevcut Durum"), hdr("Mevcut\nÖnlem"),
      hdr("Tehlike /\nRisk"), hdr("O"), hdr("Ş"), hdr("RS"),
      hdr("Öneriler /\nAlınacak Önlemler"), hdr("Etkilenecek\nKişiler"), hdr("Süreç\nSorumlusu"),
      hdr("Termin"), hdr("Kontrol\nTarihi"), hdr("O"), hdr("Ş"), hdr("RS"), hdr("İlgili Mevzuat"),
    ];

    const tCell = (t: string, align?: string) => ({ text: t, fontSize: 6, alignment: (align || "left") as any, margin: [1, 2, 1, 2] as [number, number, number, number] });
    const scoreCell = (val: number) => ({
      text: String(val), fontSize: 7, bold: true, color: "white",
      fillColor: scoreColor(val), alignment: "center" as const, margin: [1, 2, 1, 2] as [number, number, number, number],
    });

    const tableBody: any[] = [tableHead];
    cr.forEach((r, i) => {
      tableBody.push([
        tCell(String(i + 1), "center"),
        tCell(r.section || ""),
        tCell(r.hazard || ""),
        tCell(r.currentMeasure || ""),
        tCell(r.risk || ""),
        tCell(String(r.probability), "center"),
        tCell(String(r.severity), "center"),
        scoreCell(r.score),
        tCell(r.actionToTake || ""),
        tCell(r.affectedPersons || "-"),
        tCell(r.responsible || ""),
        tCell(r.dueDate || "", "center"),
        tCell(r.controlDate || "", "center"),
        tCell(String(r.residualProbability), "center"),
        tCell(String(r.residualSeverity), "center"),
        scoreCell(r.residualScore),
        tCell(r.lawReference || ""),
      ]);
    });

    content.push({
      table: {
        headerRows: 1,
        widths: [12, "*", "*", 34, "*", 12, 12, 16, "*", "*", 34, 30, 30, 12, 12, 16, "*"],
        body: tableBody,
      },
      layout: {
        hLineWidth: () => 0.5,
        vLineWidth: () => 0.5,
        hLineColor: () => "#94a3b8",
        vLineColor: () => "#94a3b8",
      },
    });

    // ── Sayfa numarası ──
    content.push({ text: `Sayfa ${pageNum}`, alignment: "center", fontSize: 8, color: "#64748b", margin: [0, 6, 0, 6] });

    // ── İmza bölümü ──
    const roles: SignerRole[] = ["İş Güvenliği Uzmanı", "İşveren / İşveren Vekili", "Çalışan Temsilcisi"];
    const companySigners = roles.map(role => {
      const found = signers.find(s => s.companyId === company.id && s.role === role);
      return { role, name: found?.fullName || "—" };
    });

    content.push({
      table: {
        widths: ["*", "*", "*"],
        body: [[
          ...companySigners.map(s => ({
            stack: [
              { text: s.role, fontSize: 8, bold: true, alignment: "center" as const, color: "#334155" },
              { text: s.name.toUpperCase(), fontSize: 9, bold: true, alignment: "center" as const, margin: [0, 4, 0, 0] as [number, number, number, number] },
              { text: "\n\n", fontSize: 6 },
              { text: "İmza", fontSize: 7, alignment: "center" as const, color: "#94a3b8" },
            ],
            margin: [6, 6, 6, 6] as [number, number, number, number],
          })),
        ]],
      },
      layout: {
        hLineWidth: () => 0.5,
        vLineWidth: () => 0.5,
        hLineColor: () => "#94a3b8",
        vLineColor: () => "#94a3b8",
      },
      margin: [0, 8, 0, 0],
    });

    // ── Sayfa 2: Metodoloji Matrisi ──
    content.push({ text: "", pageBreak: "before" });

    content.push({
      text: "Risk Değerlendirmesi Karar Matris Metodolojisi",
      fontSize: 13, bold: true, alignment: "center", color: HL, margin: [0, 0, 0, 12],
    });

    // Olasılık tablosu
    const mHdr = (t: string) => ({ text: t, fontSize: 8, bold: true, color: "white", fillColor: HL, margin: [4, 4, 4, 4] as [number, number, number, number] });
    const mCell = (t: string, bold?: boolean) => ({ text: t, fontSize: 8, bold: !!bold, margin: [4, 3, 4, 3] as [number, number, number, number] });

    content.push({
      table: {
        widths: [30, 100, "*"],
        headerRows: 1,
        body: [
          [mHdr("Puan"), mHdr("Zararın Gerçekleşme Olasılığı"), mHdr("Derecelendirme Basamakları")],
          [mCell("1", true), mCell("Çok Küçük"), mCell("Hemen hemen hiç")],
          [mCell("2", true), mCell("Küçük"), mCell("Çok az (yılda bir kez), sadece anormal durumlarda")],
          [mCell("3", true), mCell("Orta"), mCell("Az (yılda bir kaç kez)")],
          [mCell("4", true), mCell("Yüksek"), mCell("Sıklıkla (ayda bir)")],
          [mCell("5", true), mCell("Çok Yüksek"), mCell("Çok sıklıkla (haftada bir, her gün)")],
        ],
      },
      layout: { hLineWidth: () => 0.5, vLineWidth: () => 0.5, hLineColor: () => "#94a3b8", vLineColor: () => "#94a3b8" },
      margin: [0, 0, 0, 12],
    });

    // Şiddet tablosu
    content.push({
      table: {
        widths: [30, 100, "*"],
        headerRows: 1,
        body: [
          [mHdr("Puan"), mHdr("İhtimal"), mHdr("Derecelendirme")],
          [mCell("1", true), mCell("Çok Hafif"), mCell("İş saati kaybı yok, hemen giderilebilen")],
          [mCell("2", true), mCell("Hafif"), mCell("İş günü kaybı yok, kalıcı etkisi olmayan")],
          [mCell("3", true), mCell("Orta"), mCell("Hafif yaralanma, yatarak tedavi")],
          [mCell("4", true), mCell("Ciddi"), mCell("Ciddi yaralanma, meslek hastalığı")],
          [mCell("5", true), mCell("Çok Ciddi"), mCell("Ölüm, sürekli iş göremezlik")],
        ],
      },
      layout: { hLineWidth: () => 0.5, vLineWidth: () => 0.5, hLineColor: () => "#94a3b8", vLineColor: () => "#94a3b8" },
      margin: [0, 0, 0, 12],
    });

    // Risk skoru tablosu
    content.push({
      table: {
        widths: [60, 100, "*"],
        headerRows: 1,
        body: [
          [mHdr("Risk Skoru"), mHdr("Anlamı"), mHdr("Açıklama")],
          [{ text: "25", fontSize: 8, bold: true, fillColor: "#dc2626", color: "white", alignment: "center", margin: [4, 3, 4, 3] }, mCell("Kabul Edilemez"), mCell("Risk kabul edilebilir seviyeye düşürülünceye kadar iş başlatılmamalıdır.")],
          [{ text: "15, 16, 20", fontSize: 8, bold: true, fillColor: "#dc2626", color: "white", alignment: "center", margin: [4, 3, 4, 3] }, mCell("Ciddi"), mCell("Riskleri düşürmek için faaliyetler kısa zamanda başlatılmalıdır.")],
          [{ text: "8, 9, 10, 12", fontSize: 8, bold: true, fillColor: "#d97706", color: "white", alignment: "center", margin: [4, 3, 4, 3] }, mCell("Orta"), mCell("Riskleri düşürmek için faaliyetler en az 6 ay içinde tamamlanmalıdır.")],
          [{ text: "2, 3, 4, 5, 6", fontSize: 8, bold: true, fillColor: "#16a34a", color: "white", alignment: "center", margin: [4, 3, 4, 3] }, mCell("Düşük (Katlanılabilir)"), mCell("Mevcut kontroller sürdürülmelidir.")],
          [{ text: "1", fontSize: 8, bold: true, fillColor: "#16a34a", color: "white", alignment: "center", margin: [4, 3, 4, 3] }, mCell("Önemsiz"), mCell("Önlem öncelikli değildir.")],
        ],
      },
      layout: { hLineWidth: () => 0.5, vLineWidth: () => 0.5, hLineColor: () => "#94a3b8", vLineColor: () => "#94a3b8" },
      margin: [0, 0, 0, 12],
    });

    // Renk skalası
    content.push({
      text: "Risk Seviyesi Renk Skalası:", fontSize: 9, bold: true, margin: [0, 0, 0, 6],
    });
    content.push({
      columns: [
        { width: "auto", stack: [{ canvas: [{ type: "rect", x: 0, y: 0, w: 14, h: 14, r: 2, color: "#dc2626" }] }], margin: [0, 0, 4, 0] },
        { width: "auto", text: "Yüksek Risk (≥15) — Kabul edilemez / Ciddi", fontSize: 8, margin: [0, 2, 16, 0] },
        { width: "auto", stack: [{ canvas: [{ type: "rect", x: 0, y: 0, w: 14, h: 14, r: 2, color: "#d97706" }] }], margin: [0, 0, 4, 0] },
        { width: "auto", text: "Orta Risk (8-14) — Faaliyetler 6 ay içinde", fontSize: 8, margin: [0, 2, 16, 0] },
        { width: "auto", stack: [{ canvas: [{ type: "rect", x: 0, y: 0, w: 14, h: 14, r: 2, color: "#16a34a" }] }], margin: [0, 0, 4, 0] },
        { width: "auto", text: "Düşük Risk (<8) — Mevcut kontroller yeterli", fontSize: 8, margin: [0, 2, 0, 0] },
      ],
    });
  }

  const docDef: any = {
    pageOrientation: "landscape",
    pageSize: "A3",
    pageMargins: [20, 20, 20, 20],
    content,
    defaultStyle: { font: "Roboto" },
  };

  maker.createPdf(docDef).download(`Risk_Degerlendirme_Raporu_${today.replace(/\./g, "_")}.pdf`);
}


// ── Styles ────────────────────────────────────────────────────────────────────
const styles: Record<string, React.CSSProperties> = {
  app: { minHeight: "100vh", backgroundColor: "var(--isg-bg)", color: "var(--isg-text)", fontFamily: "'IBM Plex Sans', system-ui, sans-serif" },
  header: { backgroundColor: "var(--isg-header)", borderBottom: "1px solid var(--isg-border)", padding: "0 24px", display: "flex", alignItems: "center", justifyContent: "space-between", height: 56 },
  nav: { display: "flex", gap: 2, padding: "12px 24px 0", borderBottom: "1px solid var(--isg-border)", backgroundColor: "var(--isg-nav)", overflowX: "auto" as const },
  content: { padding: 24, maxWidth: 1400, margin: "0 auto" },
  card: { backgroundColor: "var(--isg-card)", border: "1px solid var(--isg-border)", borderRadius: 10, padding: 20, marginBottom: 16 },
  sectionTitle: { fontSize: 13, fontWeight: 600, color: "var(--isg-text-muted)", textTransform: "uppercase" as const, letterSpacing: "0.08em", marginBottom: 16 },
  input: { width: "100%", backgroundColor: "var(--isg-input-bg)", border: "1px solid var(--isg-border)", borderRadius: 6, color: "var(--isg-text)", padding: "8px 12px", fontSize: 13, outline: "none", boxSizing: "border-box" as const },
  select: { width: "100%", backgroundColor: "var(--isg-input-bg)", border: "1px solid var(--isg-border)", borderRadius: 6, color: "var(--isg-text)", padding: "8px 12px", fontSize: 13, outline: "none", boxSizing: "border-box" as const },
  label: { fontSize: 12, color: "var(--isg-text-muted)", marginBottom: 4, display: "block" },
  formGrid: { display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: 12 },
  btnPrimary: { backgroundColor: "#0ea5e9", color: "#fff", border: "none", borderRadius: 6, padding: "8px 16px", fontSize: 13, fontWeight: 600, cursor: "pointer" },
  btnDanger: { backgroundColor: "#dc2626", color: "#fff", border: "none", borderRadius: 6, padding: "6px 12px", fontSize: 12, cursor: "pointer" },
  btnSecondary: { backgroundColor: "var(--isg-btn-secondary)", color: "var(--isg-text)", border: "1px solid var(--isg-border)", borderRadius: 6, padding: "6px 12px", fontSize: 12, cursor: "pointer" },
  btnSuccess: { backgroundColor: "#16a34a", color: "#fff", border: "none", borderRadius: 6, padding: "8px 16px", fontSize: 13, fontWeight: 600, cursor: "pointer" },
  badge: { display: "inline-block", padding: "2px 8px", borderRadius: 4, fontSize: 11, fontWeight: 600 },
  table: { width: "100%", borderCollapse: "collapse" as const, fontSize: 13 },
  th: { textAlign: "left" as const, padding: "8px 12px", borderBottom: "1px solid var(--isg-border)", color: "var(--isg-text-muted)", fontWeight: 600, fontSize: 12, textTransform: "uppercase" as const, letterSpacing: "0.05em" },
  td: { padding: "10px 12px", borderBottom: "1px solid var(--isg-border)", verticalAlign: "top" as const, color: "var(--isg-text)" },
  searchBar: { display: "flex", gap: 10, marginBottom: 16, alignItems: "center", flexWrap: "wrap" as const },
  statGrid: { display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))", gap: 12, marginBottom: 20 },
  statCard: { backgroundColor: "var(--isg-card)", border: "1px solid var(--isg-border)", borderRadius: 8, padding: 16 },
  statValue: { fontSize: 28, fontWeight: 700, lineHeight: 1, marginBottom: 4 },
  statLabel: { fontSize: 12, color: "var(--isg-text-muted)" },
};

function DatePicker({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const [open, setOpen] = useState(false);
  const ref = React.useRef<HTMLDivElement>(null);
  const now = value ? new Date(value) : new Date();
  const [viewYear, setViewYear] = useState(now.getFullYear());
  const [viewMonth, setViewMonth] = useState(now.getMonth());

  const months = ["Oca","Şub","Mar","Nis","May","Haz","Tem","Ağu","Eyl","Eki","Kas","Ara"];
  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
  const firstDay = (new Date(viewYear, viewMonth, 1).getDay() + 6) % 7;

  const selectedDate = value ? new Date(value) : null;

  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  const select = (day: number) => {
    const d = `${viewYear}-${String(viewMonth + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
    onChange(d);
    setOpen(false);
  };

  const displayValue = value
    ? new Date(value).toLocaleDateString("tr-TR")
    : "Tarih seçin...";

  return (
    <div ref={ref} style={{ position: "relative" }}>
      <div
        onClick={() => setOpen(!open)}
        style={{ ...styles.input, cursor: "pointer", display: "flex", justifyContent: "space-between", alignItems: "center" }}
      >
        <span style={{ color: value ? "var(--isg-text)" : "var(--isg-text-muted)" }}>{displayValue}</span>
        <span style={{ fontSize: 14 }}>📅</span>
      </div>
      {open && (
        <div style={{ position: "absolute", zIndex: 1000, top: "calc(100% + 4px)", left: 0, backgroundColor: "var(--isg-card)", border: "1px solid var(--isg-border)", borderRadius: 8, padding: 12, width: 240, boxShadow: "0 8px 32px rgba(0,0,0,0.5)" }}>
          {/* Ay/Yıl navigasyon */}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
            <button onClick={() => { if (viewMonth === 0) { setViewMonth(11); setViewYear(y => y - 1); } else setViewMonth(m => m - 1); }} style={{ ...styles.btnSecondary, padding: "2px 8px" }}>‹</button>
            <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
              <select value={viewMonth} onChange={e => setViewMonth(Number(e.target.value))} style={{ ...styles.select, width: "auto", padding: "2px 6px", fontSize: 12 }}>
                {months.map((m, i) => <option key={i} value={i}>{m}</option>)}
              </select>
              <select value={viewYear} onChange={e => setViewYear(Number(e.target.value))} style={{ ...styles.select, width: "auto", padding: "2px 6px", fontSize: 12 }}>
                {Array.from({ length: 20 }, (_, i) => 2020 + i).map(y => <option key={y} value={y}>{y}</option>)}
              </select>
            </div>
            <button onClick={() => { if (viewMonth === 11) { setViewMonth(0); setViewYear(y => y + 1); } else setViewMonth(m => m + 1); }} style={{ ...styles.btnSecondary, padding: "2px 8px" }}>›</button>
          </div>
          {/* Gün başlıkları */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 2, marginBottom: 4 }}>
            {["Pt","Sa","Ça","Pe","Cu","Ct","Pz"].map(d => (
              <div key={d} style={{ textAlign: "center", fontSize: 10, color: "var(--isg-text-muted)", padding: "2px 0" }}>{d}</div>
            ))}
          </div>
          {/* Günler */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 2 }}>
            {Array.from({ length: firstDay }).map((_, i) => <div key={`e${i}`} />)}
            {Array.from({ length: daysInMonth }, (_, i) => i + 1).map(day => {
              const isSelected = selectedDate &&
                selectedDate.getFullYear() === viewYear &&
                selectedDate.getMonth() === viewMonth &&
                selectedDate.getDate() === day;
              return (
                <button
                  key={day}
                  onClick={() => select(day)}
                  style={{
                    backgroundColor: isSelected ? "#0ea5e9" : "transparent",
                    color: isSelected ? "#fff" : "var(--isg-text)",
                    border: "none",
                    borderRadius: 4,
                    padding: "4px 0",
                    fontSize: 12,
                    cursor: "pointer",
                    textAlign: "center",
                  }}
                >
                  {day}
                </button>
              );
            })}
          </div>
          {/* Temizle */}
          <button onClick={() => { onChange(""); setOpen(false); }} style={{ ...styles.btnSecondary, width: "100%", marginTop: 8, fontSize: 11 }}>Temizle</button>
        </div>
      )}
    </div>
  );
}

function Badge({ text, color }: { text: string; color: string }) {
  return <span style={{ ...styles.badge, backgroundColor: color + "22", color, border: `1px solid ${color}44` }}>{text}</span>;
}

function FormField({ label, children }: { label: string; children: React.ReactNode }) {
  return <div><label style={styles.label} className="isg-label">{label}</label>{children}</div>;
}

// ── Main ──────────────────────────────────────────────────────────────────────
export default function Page() {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [loading, setLoading] = useState(true);
  const [pdfLoading, setPdfLoading] = useState(false);
  const [darkMode, setDarkMode] = useState(true);

  // Body class güncelle
  useEffect(() => {
    document.body.classList.remove("dark", "light");
    document.body.classList.add(darkMode ? "dark" : "light");
  }, [darkMode]);

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

  const [newCompany, setNewCompany] = useState({ nickName: "", officialName: "", sgkSicil: "", naceCode: "", dangerClass: "Az Tehlikeli" as DangerClass, employeeCount: "", contractEnd: "", serviceType: "İş Güvenliği" as ServiceType, contactEmail: "" });
  const [newEmployee, setNewEmployee] = useState({ companyId: "", firstName: "", lastName: "", tcNo: "", title: "", hireDate: "" });
  const [newDocument, setNewDocument] = useState({ companyId: "", employeeId: "", type: "Risk Değerlendirme Raporu", issueDate: "", expiryDate: "" });
  const [newObserver, setNewObserver] = useState({ fullName: "", title: "", certificateNo: "", phone: "" });
  const [newDof, setNewDof] = useState({ companyId: "", observerId: "", title: "", description: "", lawReference: "", priority: "Orta" as "Düşük" | "Orta" | "Yüksek", responsible: "", dueDate: "", status: "Açık" as "Açık" | "Bildirildi" | "Önlem Alındı" | "Çözüldü" | "Riske Aktarıldı", location: "", beforePhoto: "", afterPhoto: "", affectedPersons: "" });
  const [newRisk, setNewRisk] = useState({
    companyId: "", section: "", hazard: "", risk: "", currentMeasure: "", actionToTake: "",
    probability: "1", severity: "1", residualProbability: "1", residualSeverity: "1",
    responsible: "", dueDate: "", status: "Açık" as "Açık" | "Kontrol Altında" | "Kapandı",
    affectedPersons: "", lawReference: "", controlDate: "",
  });

  const [signers, setSigners] = useState<Signer[]>([]);
  const [emailSettings, setEmailSettings] = useState<EmailSettings>({ enabled: true, toEmail: "", ccEmail: "", subject: "[İSG] Yeni DÖF Bildirimi: {dofTitle}", message: "" });
  const [dofAdding, setDofAdding] = useState(false);
  const [dofAddStatus, setDofAddStatus] = useState<string | null>(null);
  const [emailContacts, setEmailContacts] = useState<EmailContact[]>([]);
  const [newContact, setNewContact] = useState({ name: "", email: "", role: "" });
  const [riskEmailModal, setRiskEmailModal] = useState<{ companyId: string } | null>(null);
  const [riskEmailSelectedContacts, setRiskEmailSelectedContacts] = useState<string[]>([]);
  const [riskEmailSending, setRiskEmailSending] = useState(false);
  const [riskEmailStatus, setRiskEmailStatus] = useState<string | null>(null);

  async function loadAll() {
    setLoading(true);
    try {
      const [compSnap, empSnap, docSnap, obsSnap, dofSnap, riskSnap, signerSnap] = await Promise.all([
        getDocs(collection(db, "companies")),
        getDocs(collection(db, "employees")),
        getDocs(collection(db, "documents")),
        getDocs(collection(db, "observers")),
        getDocs(collection(db, "dofs")),
        getDocs(collection(db, "risks")),
        getDocs(collection(db, "signers")),
      ]);
      setCompanies(compSnap.docs.map(d => ({ id: d.id, ...d.data() } as Company)));
      setEmployees(empSnap.docs.map(d => ({ id: d.id, ...d.data() } as Employee)));
      setDocuments(docSnap.docs.map(d => ({ id: d.id, ...d.data() } as DocumentRecord)));
      setObservers(obsSnap.docs.map(d => ({ id: d.id, ...d.data() } as Observer)));
      setDofs(dofSnap.docs.map(d => ({ id: d.id, ...d.data() } as DofRecord)));
      setRisks(riskSnap.docs.map(d => ({ id: d.id, ...d.data() } as RiskRecord)));
      setSigners(signerSnap.docs.map(d => ({ id: d.id, ...d.data() } as Signer)));

      // Email ayarlarını yükle
      const emailDoc = await getDoc(doc(db, "settings", "emailNotifications"));
      if (emailDoc.exists()) {
        const ed = emailDoc.data() as EmailSettings;
        setEmailSettings(ed);
      }

      // Email adres defterini yükle
      const contactSnap = await getDocs(collection(db, "emailContacts"));
      setEmailContacts(contactSnap.docs.map(d => ({ id: d.id, ...d.data() } as EmailContact)));
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
    const data = { nickName: newCompany.nickName, officialName, sgkSicil: newCompany.sgkSicil, naceCode, dangerClass: dangerFromNace(naceCode), employeeCount: parseInt(newCompany.employeeCount) || 0, contractEnd: newCompany.contractEnd, serviceType: newCompany.serviceType, contactEmail: newCompany.contactEmail };
    const ref = await addDoc(collection(db, "companies"), data);
    setCompanies(prev => [...prev, { id: ref.id, ...data }]);
    setNewCompany({ nickName: "", officialName: "", sgkSicil: "", naceCode: "", dangerClass: "Az Tehlikeli", employeeCount: "", contractEnd: "", serviceType: "İş Güvenliği", contactEmail: "" });
  }

  async function deleteCompany(id: string) {
    if (!confirm("Bu firmayı silmek istediğinizden emin misiniz?")) return;
    // Firestore'dan cascade sil
    const relatedEmployees = employees.filter(e => e.companyId === id);
    const relatedDocs = documents.filter(d => d.companyId === id);
    const relatedDofs = dofs.filter(d => d.companyId === id);
    const relatedRisks = risks.filter(r => r.companyId === id);
    const relatedSigners = signers.filter(s => s.companyId === id);
    await Promise.all([
      deleteDoc(doc(db, "companies", id)),
      ...relatedEmployees.map(e => deleteDoc(doc(db, "employees", e.id))),
      ...relatedDocs.map(d => deleteDoc(doc(db, "documents", d.id))),
      ...relatedDofs.map(d => deleteDoc(doc(db, "dofs", d.id))),
      ...relatedRisks.map(r => deleteDoc(doc(db, "risks", r.id))),
      ...relatedSigners.map(s => deleteDoc(doc(db, "signers", s.id))),
    ]);
    setCompanies(prev => prev.filter(c => c.id !== id));
    setEmployees(prev => prev.filter(e => e.companyId !== id));
    setDocuments(prev => prev.filter(d => d.companyId !== id));
    setDofs(prev => prev.filter(d => d.companyId !== id));
    setRisks(prev => prev.filter(r => r.companyId !== id));
    setSigners(prev => prev.filter(s => s.companyId !== id));
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

  async function generateDofPDF(dof: DofRecord, returnBase64?: boolean): Promise<string | void> {
    const pdfMake = (await import("pdfmake/build/pdfmake")) as any;
    const pdfFonts = (await import("pdfmake/build/vfs_fonts")) as any;
    const maker = pdfMake.default || pdfMake;
    maker.vfs = (pdfFonts.default || pdfFonts).vfs;

    const company = companies.find(c => c.id === dof.companyId);
    const observer = observers.find(o => o.id === dof.observerId);
    const companySigners = signers.filter(s => s.companyId === dof.companyId);
    const today = new Date().toLocaleDateString("tr-TR");
    const HL = "#1e293b";
    const BORDER = "#d1d5db";

    const priorityColor = dof.priority === "Yüksek" ? "#dc2626" : dof.priority === "Orta" ? "#d97706" : "#16a34a";

    // Header helpers (birebir Risk PDF stili)
    const thCell = (t: string) => ({ text: t, fontSize: 7, bold: true, color: "white", fillColor: HL, margin: [3, 4, 3, 4] as [number, number, number, number] });
    const tdCell = (t: string, opts?: any) => ({ text: t || "—", fontSize: 7, margin: [3, 3, 3, 3] as [number, number, number, number], ...opts });
    const infoLabel = (t: string) => ({ text: t, fontSize: 8, bold: true, color: "#334155", margin: [0, 2, 0, 2] as [number, number, number, number] });
    const infoValue = (t: string) => ({ text: t || "—", fontSize: 8, color: "#475569", margin: [0, 2, 0, 2] as [number, number, number, number] });

    // Öncelik badge rengi
    const prBadge = (priority: string) => {
      const color = priority === "Yüksek" ? "#dc2626" : priority === "Orta" ? "#d97706" : "#16a34a";
      return { text: priority, fontSize: 7, bold: true, color: "white", fillColor: color, alignment: "center" as const, margin: [3, 3, 3, 3] as [number, number, number, number] };
    };

    // Durum badge rengi
    const stBadge = (status: string) => {
      const colorMap: Record<string, string> = { "Açık": "#dc2626", "Bildirildi": "#0ea5e9", "Önlem Alındı": "#d97706", "Çözüldü": "#16a34a", "Riske Aktarıldı": "#7c3aed" };
      const color = colorMap[status] || "#64748b";
      return { text: status, fontSize: 7, bold: true, color: "white", fillColor: color, alignment: "center" as const, margin: [3, 3, 3, 3] as [number, number, number, number] };
    };

    const content: any[] = [
      // ─── HEADER BAR ───
      {
        table: { widths: ["*"], body: [[{
          stack: [
            { text: (company?.officialName || "—").toUpperCase(), fontSize: 14, bold: true, color: "white", alignment: "center" },
            { text: "DOF — DUZELTME ONLEYICI FAALIYET FORMU", fontSize: 9, color: "#94a3b8", alignment: "center", margin: [0, 2, 0, 0] },
          ],
          fillColor: HL, margin: [0, 8, 0, 8],
        }]] },
        layout: "noBorders", margin: [0, 0, 0, 12],
      },

      // ─── FİRMA BİLGİLERİ (Risk PDF stili: sol-sağ iki sütun) ───
      {
        table: {
          widths: ["auto", "*", "auto", "*"],
          body: [
            [infoLabel("Isyeri Unvani"), infoValue(company?.officialName || ""), infoLabel("SGK Sicil No."), infoValue(company?.sgkSicil || "")],
            [infoLabel("Isyeri Bolumu"), infoValue(dof.location || "GENEL"), infoLabel("DOF Tarihi"), infoValue(today)],
            [infoLabel("NACE Kodu"), infoValue(company?.naceCode || ""), infoLabel("Tehlike Sinifi"), infoValue(company?.dangerClass || "")],
            [infoLabel("Calisan Sayisi"), infoValue(String(company?.employeeCount || "")), infoLabel("Termin Tarihi"), infoValue(dof.dueDate || "")],
            [infoLabel("Gozlemci"), infoValue(observer?.fullName || ""), infoLabel("Belge No."), infoValue(observer?.certificateNo || "")],
          ],
        },
        layout: { hLineWidth: () => 0, vLineWidth: () => 0 },
        margin: [0, 0, 0, 16],
      },

      // ─── DÖF DETAY TABLOSU (Risk PDF tablo stili) ───
      {
        table: {
          headerRows: 1,
          widths: [18, 55, "*", 50, 50, "auto", "*", 55, 50, 50, "auto"],
          body: [
            [
              thCell("No"),
              thCell("Konum / Bolum"),
              thCell("Uygunsuzluk / Baslik"),
              thCell("Oncelik"),
              thCell("Durum"),
              thCell("Aciklama"),
              thCell("Oneriler / Alinacak Onlemler"),
              thCell("Etkilenecek Kisiler"),
              thCell("Surec Sorumlusu"),
              thCell("Termin"),
              thCell("Ilgili Mevzuat"),
            ],
            [
              tdCell("1"),
              tdCell(dof.location || "GENEL"),
              tdCell(dof.title, { bold: true }),
              prBadge(dof.priority),
              stBadge(dof.status),
              tdCell(dof.description || ""),
              tdCell(dof.lawReference ? `Mevzuat: ${dof.lawReference}` : ""),
              tdCell(dof.affectedPersons || "Tum calisanlar"),
              tdCell(dof.responsible || ""),
              tdCell(dof.dueDate || ""),
              tdCell(dof.lawReference || ""),
            ],
          ],
        },
        layout: {
          hLineWidth: (i: number) => i <= 1 ? 0.5 : 0.3,
          vLineWidth: () => 0.3,
          hLineColor: (i: number) => i <= 1 ? HL : BORDER,
          vLineColor: () => BORDER,
        },
        margin: [0, 0, 0, 16],
      },

      // ─── FOTOĞRAFLAR (yan yana) ───
      ...((dof.beforePhoto || dof.afterPhoto) ? [{
        columns: [
          ...(dof.beforePhoto ? [{
            stack: [
              { text: "Uygunsuzluk Fotografi (Once)", fontSize: 8, bold: true, color: HL, margin: [0, 0, 0, 4] as [number, number, number, number] },
              { image: dof.beforePhoto.startsWith("data:") ? dof.beforePhoto : `data:image/jpeg;base64,${dof.beforePhoto}`, width: 260, margin: [0, 0, 10, 0] as [number, number, number, number] },
            ],
            width: "auto",
          }] : []),
          ...(dof.afterPhoto ? [{
            stack: [
              { text: "Duzeltme Fotografi (Sonra)", fontSize: 8, bold: true, color: HL, margin: [0, 0, 0, 4] as [number, number, number, number] },
              { image: dof.afterPhoto.startsWith("data:") ? dof.afterPhoto : `data:image/jpeg;base64,${dof.afterPhoto}`, width: 260, margin: [0, 0, 0, 0] as [number, number, number, number] },
            ],
            width: "auto",
          }] : []),
        ],
        margin: [0, 0, 0, 20] as [number, number, number, number],
      }] : []),

      // ─── İMZA BÖLÜMÜnü sayfanın en altına itmek için spacer
      { text: "", margin: [0, 0, 0, 0] },

      // ─── İMZA BÖLÜMÜ (Risk PDF stili: 3 sütun, isimler altında çizgi) ───
      {
        table: {
          widths: ["*", "*", "*"],
          body: [
            [
              { text: "Is Guvenligi Uzmani", fontSize: 8, bold: true, color: "#334155", margin: [0, 0, 0, 4] },
              { text: "Isveren / Isveren Vekili", fontSize: 8, bold: true, color: "#334155", margin: [0, 0, 0, 4] },
              { text: "Calisan Temsilcisi", fontSize: 8, bold: true, color: "#334155", margin: [0, 0, 0, 4] },
            ],
            [
              { text: companySigners.find(s => s.role === "İş Güvenliği Uzmanı")?.fullName || observer?.fullName || "", fontSize: 8, color: "#475569" },
              { text: companySigners.find(s => s.role === "İşveren / İşveren Vekili")?.fullName || "", fontSize: 8, color: "#475569" },
              { text: companySigners.find(s => s.role === "Çalışan Temsilcisi")?.fullName || "", fontSize: 8, color: "#475569" },
            ],
            [
              { text: "____________________\nImza", fontSize: 7, color: "#94a3b8", margin: [0, 12, 0, 0] },
              { text: "____________________\nImza", fontSize: 7, color: "#94a3b8", margin: [0, 12, 0, 0] },
              { text: "____________________\nImza", fontSize: 7, color: "#94a3b8", margin: [0, 12, 0, 0] },
            ],
          ],
        },
        layout: "noBorders",
        margin: [0, 40, 0, 0],
      },
    ];

    const docDef: any = {
      pageSize: "A4",
      pageOrientation: "landscape",
      pageMargins: [30, 30, 30, 40],
      content,
      defaultStyle: { font: "Roboto" },
      footer: (currentPage: number) => ({
        text: `Sayfa ${currentPage}`,
        alignment: "right",
        fontSize: 7,
        color: "#94a3b8",
        margin: [0, 0, 30, 0],
      }),
    };

    if (returnBase64) {
      return new Promise<string>((resolve) => {
        maker.createPdf(docDef).getBase64((data: string) => resolve(data));
      });
    } else {
      maker.createPdf(docDef).download(`DOF_${dof.id.substring(0, 8)}_${today.replace(/\./g, "_")}.pdf`);
    }
  }

  async function addDof() {
    if (!newDof.companyId || !newDof.title) return;
    setDofAdding(true);
    setDofAddStatus(null);
    try {
      const data: Omit<DofRecord, "id"> = { companyId: newDof.companyId, observerId: newDof.observerId, title: newDof.title, description: newDof.description, lawReference: newDof.lawReference, priority: newDof.priority, responsible: newDof.responsible, dueDate: newDof.dueDate, status: newDof.status, location: newDof.location, affectedPersons: newDof.affectedPersons || "" };
      if (newDof.beforePhoto) (data as any).beforePhoto = newDof.beforePhoto;
      if (newDof.afterPhoto) (data as any).afterPhoto = newDof.afterPhoto;
      const ref = await addDoc(collection(db, "dofs"), data);
      setDofs(prev => [...prev, { id: ref.id, ...data }]);

      // E-mail bildirimi — sadece email aktifse gönder
      if (emailSettings.enabled && emailSettings.toEmail) {
        try {
          const dofWithId = { id: ref.id, ...data };
          const pdfBase64 = await generateDofPDF(dofWithId, true);
          const res = await fetch("/api/send-dof-email", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ dofId: ref.id, pdfBase64 }),
          });
          if (res.ok) {
            setDofs(prev => prev.map(d => d.id === ref.id ? { ...d, status: "Bildirildi" } : d));
            setDofAddStatus("✅ DÖF kaydedildi ve e-posta gönderildi");
          } else {
            const errData = await res.json();
            setDofAddStatus(`⚠️ DÖF kaydedildi ama e-posta gönderilemedi: ${errData.error || "Bilinmeyen hata"}`);
          }
        } catch (e: any) {
          setDofAddStatus(`⚠️ DÖF kaydedildi ama e-posta gönderilemedi: ${e.message}`);
        }
      } else {
        setDofAddStatus("✅ DÖF kaydedildi (e-posta bildirimi pasif)");
      }

      setNewDof({ companyId: "", observerId: "", title: "", description: "", lawReference: "", priority: "Orta", responsible: "", dueDate: "", status: "Açık", location: "", beforePhoto: "", afterPhoto: "", affectedPersons: "" });
    } catch (e: any) {
      setDofAddStatus(`❌ DÖF kaydedilemedi: ${e.message}`);
    } finally {
      setDofAdding(false);
      setTimeout(() => setDofAddStatus(null), 6000);
    }
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
    // Zaten risk varsa Risk sekmesine git
    if (risks.some(r => r.sourceDofId === dof.id)) {
      setActiveTab("risk");
      return;
    }
    // Sadece "Önlem Alındı" durumundaki DÖF'ler riske aktarılabilir
    if (dof.status !== "Önlem Alındı") {
      return;
    }
    const probMap: Record<string, number> = { "Yüksek": 5, "Orta": 3, "Düşük": 1 };
    const prob = probMap[dof.priority] || 3;
    const sev = dof.priority === "Yüksek" ? 4 : dof.priority === "Orta" ? 3 : 2;
    const data = {
      companyId: dof.companyId,
      sourceDofId: dof.id,
      section: dof.location || "",
      hazard: dof.title,
      risk: dof.description || "",
      currentMeasure: "",
      actionToTake: "",
      probability: prob,
      severity: sev,
      score: prob * sev,
      residualProbability: 1,
      residualSeverity: 1,
      residualScore: 1,
      responsible: dof.responsible || "",
      dueDate: dof.dueDate || "",
      status: "Açık" as const,
      affectedPersons: dof.affectedPersons || "",
      lawReference: dof.lawReference || "",
      controlDate: "",
    };
    const ref = await addDoc(collection(db, "risks"), data);
    setRisks(prev => [...prev, { id: ref.id, ...data }]);
    // DÖF durumunu güncelle
    await updateDoc(doc(db, "dofs", dof.id), { status: "Riske Aktarıldı" });
    setDofs(prev => prev.map(d => d.id === dof.id ? { ...d, status: "Riske Aktarıldı" } : d));
    setActiveTab("risk");
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

  const tabs = [
    { id: "ozet", label: "📊 Özet" },
    { id: "firmalar", label: "🏢 Firmalar" },
    { id: "personel", label: "👤 Personel" },
    { id: "belgeler", label: "📄 Belgeler" },
    { id: "gozlemciler", label: "🔍 Gözlemciler" },
    { id: "dof", label: "⚠️ DÖF" },
    { id: "risk", label: "🛡 Risk" },
    { id: "imzacilar", label: "✍️ İmzacılar" },
  ];

  if (!mounted || loading) {
    return (
      <div style={{ ...styles.app, display: "flex", alignItems: "center", justifyContent: "center", flexDirection: "column", gap: 16 }}>
        <div style={{ fontSize: 32 }}>🦺</div>
        <div style={{ color: "var(--isg-text-muted)", fontSize: 14 }}>Veriler yükleniyor...</div>
      </div>
    );
  }

  const totalExpiredDocs = documents.filter(d => getDateStatus(d.expiryDate) === "Süresi Dolmuş").length;
  const totalSoonDocs = documents.filter(d => getDateStatus(d.expiryDate) === "Yaklaşıyor").length;
  const openDofs = dofs.filter(d => d.status !== "Çözüldü" && d.status !== "Riske Aktarıldı").length;
  const highRisks = risks.filter(r => r.score >= 15).length;
  const incompleteEmployees = employees.filter(e => !e.trainingComplete).length;

  return (
    <div style={styles.app} className="isg-app">
      <header style={styles.header} className="isg-header">
        <div style={{ display: "flex", alignItems: "center", gap: 10, fontWeight: 700, fontSize: 17 }} className="isg-text">
          <span style={{ fontSize: 20 }}>🦺</span>
          <span>İSG <span style={{ color: "#38bdf8" }}>Otomasyon</span></span>
        </div>
        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          <button style={{ fontSize: 20, padding: "4px 8px", backgroundColor: "transparent", border: "none", cursor: "pointer" }} onClick={() => setDarkMode(!darkMode)} title={darkMode ? "Açık tema" : "Koyu tema"}>
            {darkMode ? "☀️" : "🌙"}
          </button>
          <button style={{ ...styles.btnSecondary, fontSize: 11 }} onClick={loadAll}>🔄 Yenile</button>
          <button style={{ ...styles.btnDanger, fontSize: 11 }} onClick={async () => {
            await signOut(auth);
            document.cookie = "isg_session=; path=/; max-age=0";
            router.push("/login");
          }}>Çıkış</button>
        </div>
      </header>

      <nav style={styles.nav} className="isg-nav">
        {tabs.map(tab => (
          <button key={tab.id} style={{ padding: "8px 16px", borderRadius: "6px 6px 0 0", border: "none", cursor: "pointer", fontSize: 13, fontWeight: 500, whiteSpace: "nowrap" as const, backgroundColor: activeTab === tab.id ? "#0ea5e9" : "transparent", color: activeTab === tab.id ? "#fff" : "var(--isg-text-muted)" }}
            onClick={() => { setActiveTab(tab.id); setSearch(""); }}>
            {tab.label}
          </button>
        ))}
      </nav>

      <main style={styles.content} className="isg-app">

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
                <div key={label} style={styles.statCard} className="isg-stat-card">
                  <div style={{ ...styles.statValue, color }}>{value}</div>
                  <div style={styles.statLabel}>{label}</div>
                </div>
              ))}
            </div>
            <p style={styles.sectionTitle} className="isg-text-muted">Firma Durumları</p>
            {companies.map(c => {
              const ind = getCompanyIndicator(c.id);
              const summary = getCompanyDocSummary(c.id);
              const empCount = employees.filter(e => e.companyId === c.id).length;
              return (
                <div key={c.id} style={{ ...styles.card, display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 8 }}>
                  <div>
                    <div style={{ fontWeight: 600, marginBottom: 4 }}>{c.nickName}</div>
                    <div style={{ fontSize: 12, color: "var(--isg-text-muted)" }}>{empCount} personel · Sözleşme: {c.contractEnd} · <Badge text={c.dangerClass} color={c.dangerClass === "Çok Tehlikeli" ? "#dc2626" : c.dangerClass === "Tehlikeli" ? "#d97706" : "#16a34a"} /></div>
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
            <div style={styles.card} className="isg-card">
              <p style={styles.sectionTitle} className="isg-text-muted">Yeni Firma Ekle</p>
              <div style={styles.formGrid}>
                <FormField label="Kısa Ad *"><input style={styles.input} className="isg-input" value={newCompany.nickName} onChange={e => setNewCompany({ ...newCompany, nickName: e.target.value })} /></FormField>
                <FormField label="SGK Sicil No *"><input style={styles.input} className="isg-input" value={newCompany.sgkSicil} onChange={e => { const sgk = e.target.value; const nace = extractNaceFromSgk(sgk); const official = officialNameFromSgk(sgk); setNewCompany({ ...newCompany, sgkSicil: sgk, naceCode: nace, officialName: official || newCompany.officialName, dangerClass: dangerFromNace(nace) }); }} /></FormField>
                <FormField label="Resmi Unvan"><input style={styles.input} className="isg-input" value={newCompany.officialName} onChange={e => setNewCompany({ ...newCompany, officialName: e.target.value })} /></FormField>
                <FormField label="NACE Kodu"><input style={styles.input} className="isg-input" value={newCompany.naceCode} onChange={e => setNewCompany({ ...newCompany, naceCode: e.target.value, dangerClass: dangerFromNace(e.target.value) })} /></FormField>
                <FormField label="Tehlike Sınıfı"><select style={styles.select} className="isg-input" value={newCompany.dangerClass} onChange={e => setNewCompany({ ...newCompany, dangerClass: e.target.value as DangerClass })}><option>Az Tehlikeli</option><option>Tehlikeli</option><option>Çok Tehlikeli</option></select></FormField>
                <FormField label="Çalışan Sayısı"><input style={styles.input} className="isg-input" type="number" value={newCompany.employeeCount} onChange={e => setNewCompany({ ...newCompany, employeeCount: e.target.value })} /></FormField>
                <FormField label="Sözleşme Bitiş"><DatePicker value={newCompany.contractEnd} onChange={v => setNewCompany({ ...newCompany, contractEnd: v })} /></FormField>
                <FormField label="Hizmet Türü"><select style={styles.select} className="isg-input" value={newCompany.serviceType} onChange={e => setNewCompany({ ...newCompany, serviceType: e.target.value as ServiceType })}><option>İş Güvenliği</option><option>İş Güvenliği + İşyeri Hekimliği</option></select></FormField>
                <FormField label="İletişim E-posta"><input style={styles.input} className="isg-input" type="email" value={newCompany.contactEmail} onChange={e => setNewCompany({ ...newCompany, contactEmail: e.target.value })} placeholder="firma@ornek.com" /></FormField>
              </div>
              <div style={{ marginTop: 12 }}><button style={styles.btnPrimary} onClick={addCompany}>Firma Ekle</button></div>
            </div>
            <div style={styles.searchBar}>
              <input style={{ ...styles.input, maxWidth: 300 }} placeholder="Ara..." value={search} onChange={e => setSearch(e.target.value)} />
              <span style={{ color: "#64748b", fontSize: 13 }}>{filteredCompanies.length} firma</span>
            </div>
            <div style={{ ...styles.card, padding: 0, overflow: "auto" }}>
              <table style={styles.table}>
                <thead><tr>{["Kısa Ad", "Resmi Unvan", "SGK Sicil", "NACE", "Tehlike", "Personel", "Sözleşme", "Hizmet", "Durum", "İşlem"].map(h => <th key={h} style={styles.th} className="isg-th">{h}</th>)}</tr></thead>
                <tbody>
                  {filteredCompanies.map(c => {
                    const ind = getCompanyIndicator(c.id);
                    const cs = getDateStatus(c.contractEnd);
                    return (
                      <tr key={c.id}>
                        <td style={styles.td} className="isg-td"><span style={{ fontWeight: 600 }}>{c.nickName}</span></td>
                        <td style={{ ...styles.td, maxWidth: 180, fontSize: 12, color: "var(--isg-text-muted)" }}>{c.officialName}</td>
                        <td style={{ ...styles.td, fontSize: 11, color: "var(--isg-text-muted)" }}>{c.sgkSicil}</td>
                        <td style={styles.td} className="isg-td">{c.naceCode}</td>
                        <td style={styles.td} className="isg-td"><Badge text={c.dangerClass} color={c.dangerClass === "Çok Tehlikeli" ? "#dc2626" : c.dangerClass === "Tehlikeli" ? "#d97706" : "#16a34a"} /></td>
                        <td style={styles.td} className="isg-td">{c.employeeCount}</td>
                        <td style={styles.td} className="isg-td"><span style={{ fontSize: 12 }}>{c.contractEnd}</span> <Badge text={cs} color={statusColor(cs)} /></td>
                        <td style={{ ...styles.td, fontSize: 12 }}>{c.serviceType}</td>
                        <td style={styles.td} className="isg-td"><Badge text={ind.text} color={ind.color} /></td>
                        <td style={styles.td} className="isg-td"><button style={styles.btnDanger} onClick={() => deleteCompany(c.id)}>Sil</button></td>
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
              <div style={styles.card} className="isg-card">
                <p style={styles.sectionTitle} className="isg-text-muted">Yeni Personel Ekle</p>
                <div style={styles.formGrid}>
                  <FormField label="Firma *"><select style={styles.select} className="isg-input" value={newEmployee.companyId} onChange={e => setNewEmployee({ ...newEmployee, companyId: e.target.value })}><option value="">Seçin...</option>{companies.map(c => <option key={c.id} value={c.id}>{c.nickName}</option>)}</select></FormField>
                  <FormField label="Ad *"><input style={styles.input} className="isg-input" value={newEmployee.firstName} onChange={e => setNewEmployee({ ...newEmployee, firstName: e.target.value })} /></FormField>
                  <FormField label="Soyad"><input style={styles.input} className="isg-input" value={newEmployee.lastName} onChange={e => setNewEmployee({ ...newEmployee, lastName: e.target.value })} /></FormField>
                  <FormField label="TC No"><input style={styles.input} className="isg-input" value={newEmployee.tcNo} onChange={e => setNewEmployee({ ...newEmployee, tcNo: e.target.value })} /></FormField>
                  <FormField label="Unvan"><input style={styles.input} className="isg-input" value={newEmployee.title} onChange={e => setNewEmployee({ ...newEmployee, title: e.target.value })} /></FormField>
                  <FormField label="İşe Giriş"><DatePicker value={newEmployee.hireDate} onChange={v => setNewEmployee({ ...newEmployee, hireDate: v })} /></FormField>
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
                  <thead><tr>{["Ad Soyad", "TC No", "Unvan", "Firma", "İşe Giriş", "Eğitim", "Kontrol Listesi", "İşlem"].map(h => <th key={h} style={styles.th} className="isg-th">{h}</th>)}</tr></thead>
                  <tbody>
                    {filteredEmployees.map(emp => {
                      const company = companies.find(c => c.id === emp.companyId);
                      const cl = checklistCompletion(emp.checklist);
                      return (
                        <tr key={emp.id} style={{ cursor: "pointer", backgroundColor: selectedEmployeeId === emp.id ? "#1a2942" : "transparent" }} onClick={() => setSelectedEmployeeId(emp.id)}>
                          <td style={styles.td} className="isg-td"><span style={{ fontWeight: 600 }}>{emp.firstName} {emp.lastName}</span></td>
                          <td style={{ ...styles.td, fontSize: 12, color: "var(--isg-text-muted)" }}>{emp.tcNo}</td>
                          <td style={styles.td} className="isg-td">{emp.title}</td>
                          <td style={{ ...styles.td, fontSize: 12 }}>{company?.nickName}</td>
                          <td style={{ ...styles.td, fontSize: 12 }}>{emp.hireDate}</td>
                          <td style={styles.td} className="isg-td"><Badge text={emp.trainingComplete ? "Tamamlandı" : "Eksik"} color={emp.trainingComplete ? "#16a34a" : "#d97706"} /></td>
                          <td style={styles.td} className="isg-td">
                            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                              <div style={{ height: 6, width: 80, backgroundColor: "var(--isg-bg)", borderRadius: 3, overflow: "hidden" }}>
                                <div style={{ height: "100%", width: `${(cl.completed / cl.total) * 100}%`, backgroundColor: cl.missing === 0 ? "#16a34a" : "#d97706" }} />
                              </div>
                              <span style={{ fontSize: 11, color: "var(--isg-text-muted)" }}>{cl.completed}/{cl.total}</span>
                            </div>
                          </td>
                          <td style={styles.td} className="isg-td"><button style={styles.btnDanger} onClick={e => { e.stopPropagation(); deleteEmployee(emp.id); }}>Sil</button></td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
            {selectedEmployee && (
              <div>
                <div style={styles.card} className="isg-card">
                  <p style={styles.sectionTitle} className="isg-text-muted">Personel Detayı</p>
                  <div style={{ fontWeight: 700, fontSize: 16, marginBottom: 2 }}>{selectedEmployee.firstName} {selectedEmployee.lastName}</div>
                  <div style={{ fontSize: 12, color: "var(--isg-text-muted)" }}>{selectedEmployee.title}</div>
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
            <div style={styles.card} className="isg-card">
              <p style={styles.sectionTitle} className="isg-text-muted">Yeni Belge Ekle</p>
              <div style={styles.formGrid}>
                <FormField label="Firma *"><select style={styles.select} className="isg-input" value={newDocument.companyId} onChange={e => setNewDocument({ ...newDocument, companyId: e.target.value })}><option value="">Seçin...</option>{companies.map(c => <option key={c.id} value={c.id}>{c.nickName}</option>)}</select></FormField>
                <FormField label="Belge Türü *"><select style={styles.select} className="isg-input" value={newDocument.type} onChange={e => setNewDocument({ ...newDocument, type: e.target.value })}>{documentTemplates.map(t => <option key={t}>{t}</option>)}</select></FormField>
                <FormField label="Personel (opsiyonel)"><select style={styles.select} className="isg-input" value={newDocument.employeeId} onChange={e => setNewDocument({ ...newDocument, employeeId: e.target.value })}><option value="">Firma Belgesi</option>{employees.filter(e => !newDocument.companyId || e.companyId === newDocument.companyId).map(e => <option key={e.id} value={e.id}>{e.firstName} {e.lastName}</option>)}</select></FormField>
                <FormField label="Düzenleme Tarihi *"><DatePicker value={newDocument.issueDate} onChange={v => setNewDocument({ ...newDocument, issueDate: v })} /></FormField>
                <FormField label="Geçerlilik Tarihi"><DatePicker value={newDocument.expiryDate} onChange={v => setNewDocument({ ...newDocument, expiryDate: v })} /></FormField>
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
                <thead><tr>{["Belge Türü", "Firma", "Personel", "Düzenleme", "Geçerlilik", "Durum", "İşlem"].map(h => <th key={h} style={styles.th} className="isg-th">{h}</th>)}</tr></thead>
                <tbody>
                  {filteredDocuments.map(d => {
                    const company = companies.find(c => c.id === d.companyId);
                    const emp = employees.find(e => e.id === d.employeeId);
                    const ds = d.expiryDate ? getDateStatus(d.expiryDate) : "—";
                    const days = d.expiryDate ? daysUntil(d.expiryDate) : null;
                    return (
                      <tr key={d.id}>
                        <td style={{ ...styles.td, fontWeight: 500 }}>{d.type}</td>
                        <td style={styles.td} className="isg-td">{company?.nickName}</td>
                        <td style={{ ...styles.td, fontSize: 12, color: "var(--isg-text-muted)" }}>{emp ? `${emp.firstName} ${emp.lastName}` : "—"}</td>
                        <td style={{ ...styles.td, fontSize: 12 }}>{d.issueDate}</td>
                        <td style={{ ...styles.td, fontSize: 12 }}>{d.expiryDate || "—"}</td>
                        <td style={styles.td} className="isg-td">{d.expiryDate ? <div><Badge text={ds} color={statusColor(ds)} />{days !== null && days >= 0 && <div style={{ fontSize: 11, color: "#64748b", marginTop: 2 }}>{days} gün</div>}</div> : "—"}</td>
                        <td style={styles.td} className="isg-td"><button style={styles.btnDanger} onClick={() => deleteDocument(d.id)}>Sil</button></td>
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
            <div style={styles.card} className="isg-card">
              <p style={styles.sectionTitle} className="isg-text-muted">Yeni Gözlemci Ekle</p>
              <div style={styles.formGrid}>
                <FormField label="Ad Soyad *"><input style={styles.input} className="isg-input" value={newObserver.fullName} onChange={e => setNewObserver({ ...newObserver, fullName: e.target.value })} /></FormField>
                <FormField label="Unvan"><input style={styles.input} className="isg-input" value={newObserver.title} onChange={e => setNewObserver({ ...newObserver, title: e.target.value })} /></FormField>
                <FormField label="Sertifika No"><input style={styles.input} className="isg-input" value={newObserver.certificateNo} onChange={e => setNewObserver({ ...newObserver, certificateNo: e.target.value })} /></FormField>
                <FormField label="Telefon"><input style={styles.input} className="isg-input" value={newObserver.phone} onChange={e => setNewObserver({ ...newObserver, phone: e.target.value })} /></FormField>
              </div>
              <div style={{ marginTop: 12 }}><button style={styles.btnPrimary} onClick={addObserver}>Gözlemci Ekle</button></div>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 12 }}>
              {observers.map(obs => (
                <div key={obs.id} style={styles.card} className="isg-card">
                  <div style={{ fontWeight: 700, marginBottom: 4 }}>{obs.fullName}</div>
                  <div style={{ fontSize: 12, color: "#94a3b8", marginBottom: 2 }}>{obs.title}</div>
                  <div style={{ fontSize: 12, color: "var(--isg-text-muted)" }}>Sertifika: {obs.certificateNo}</div>
                  <div style={{ fontSize: 12, color: "var(--isg-text-muted)" }}>Tel: {obs.phone}</div>
                  <div style={{ marginTop: 12 }}><button style={styles.btnDanger} onClick={() => deleteObserver(obs.id)}>Sil</button></div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === "dof" && (
          <div>
            <div style={styles.card} className="isg-card">
              <p style={styles.sectionTitle} className="isg-text-muted">Yeni DÖF Kaydı</p>
              <div style={styles.formGrid}>
                <FormField label="Firma *"><select style={styles.select} className="isg-input" value={newDof.companyId} onChange={e => setNewDof({ ...newDof, companyId: e.target.value })}><option value="">Seçin...</option>{companies.map(c => <option key={c.id} value={c.id}>{c.nickName}</option>)}</select></FormField>
                <FormField label="Gözlemci"><select style={styles.select} className="isg-input" value={newDof.observerId} onChange={e => setNewDof({ ...newDof, observerId: e.target.value })}><option value="">Seçin...</option>{observers.map(o => <option key={o.id} value={o.id}>{o.fullName}</option>)}</select></FormField>
                <FormField label="Başlık *"><input style={styles.input} className="isg-input" value={newDof.title} onChange={e => setNewDof({ ...newDof, title: e.target.value })} /></FormField>
                <FormField label="Konum"><input style={styles.input} className="isg-input" value={newDof.location} onChange={e => setNewDof({ ...newDof, location: e.target.value })} /></FormField>
                <FormField label="Öncelik"><select style={styles.select} className="isg-input" value={newDof.priority} onChange={e => setNewDof({ ...newDof, priority: e.target.value as any })}><option>Düşük</option><option>Orta</option><option>Yüksek</option></select></FormField>
                <FormField label="Sorumlu"><input style={styles.input} className="isg-input" value={newDof.responsible} onChange={e => setNewDof({ ...newDof, responsible: e.target.value })} /></FormField>
                <FormField label="Termin"><DatePicker value={newDof.dueDate} onChange={v => setNewDof({ ...newDof, dueDate: v })} /></FormField>
                <FormField label="Durum"><select style={styles.select} className="isg-input" value={newDof.status} onChange={e => setNewDof({ ...newDof, status: e.target.value as any })}><option>Açık</option></select></FormField>
              </div>
              <div style={{ marginTop: 10 }}>
                <label style={styles.label} className="isg-label">Açıklama</label>
                <textarea style={{ ...styles.input, height: 60, resize: "vertical" as const }} value={newDof.description} onChange={e => setNewDof({ ...newDof, description: e.target.value })} />
              </div>
              <div style={{ marginTop: 10 }}>
                <label style={styles.label} className="isg-label">Yasal Dayanak</label>
                <input style={styles.input} className="isg-input" value={newDof.lawReference} onChange={e => setNewDof({ ...newDof, lawReference: e.target.value })} />
              </div>
              <div style={{ marginTop: 10 }}>
                <label style={styles.label} className="isg-label">Etkilenecek Kişiler</label>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 6 }}>
                  {employees.filter(emp => emp.companyId === newDof.companyId).length > 0 ? (
                    employees.filter(emp => emp.companyId === newDof.companyId).map(emp => {
                      const fullName = `${emp.firstName} ${emp.lastName}`;
                      const selected = (newDof.affectedPersons || "").split(",").map(s => s.trim()).filter(Boolean);
                      const isSelected = selected.includes(fullName);
                      return (
                        <button key={emp.id} type="button" onClick={() => {
                          const current = (newDof.affectedPersons || "").split(",").map(s => s.trim()).filter(Boolean);
                          const updated = isSelected ? current.filter(n => n !== fullName) : [...current, fullName];
                          setNewDof({ ...newDof, affectedPersons: updated.join(", ") });
                        }} style={{ fontSize: 11, padding: "4px 10px", borderRadius: 12, border: isSelected ? "1.5px solid #3b82f6" : "1px solid var(--isg-border, #334155)", backgroundColor: isSelected ? "#3b82f622" : "transparent", color: isSelected ? "#3b82f6" : "var(--isg-text-muted)", cursor: "pointer" }}>
                          {isSelected ? "✓ " : ""}{fullName}
                        </button>
                      );
                    })
                  ) : (
                    <span style={{ fontSize: 12, color: "var(--isg-text-muted)" }}>{newDof.companyId ? "Bu firmaya ait çalışan yok" : "Önce firma seçin"}</span>
                  )}
                </div>
                <input style={{ ...styles.input, fontSize: 12 }} className="isg-input" value={newDof.affectedPersons} onChange={e => setNewDof({ ...newDof, affectedPersons: e.target.value })} placeholder="Tüm çalışanlar veya isimleri seçin/yazın" />
              </div>
              <div style={{ marginTop: 10, display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
                <div>
                  <label style={styles.label} className="isg-label">Öncesi Fotoğraf (Uygunsuzluk)</label>
                  {newDof.beforePhoto ? (
                    <div style={{ position: "relative", display: "inline-block" }}>
                      <img src={newDof.beforePhoto} alt="önce" style={{ width: 120, height: 90, objectFit: "cover", borderRadius: 6, border: "1px solid var(--isg-border, #334155)" }} />
                      <button type="button" onClick={() => setNewDof({ ...newDof, beforePhoto: "" })} style={{ position: "absolute", top: -6, right: -6, width: 20, height: 20, borderRadius: "50%", border: "none", backgroundColor: "#dc2626", color: "white", fontSize: 11, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>✕</button>
                    </div>
                  ) : (
                    <input type="file" accept="image/*" style={{ fontSize: 12, color: "var(--isg-text-muted)" }} onChange={e => handleImageToBase64(e, b64 => setNewDof({ ...newDof, beforePhoto: b64 }))} />
                  )}
                </div>
                <div>
                  <label style={styles.label} className="isg-label">Sonrası Fotoğraf (Düzeltme)</label>
                  {newDof.afterPhoto ? (
                    <div style={{ position: "relative", display: "inline-block" }}>
                      <img src={newDof.afterPhoto} alt="sonra" style={{ width: 120, height: 90, objectFit: "cover", borderRadius: 6, border: "1px solid var(--isg-border, #334155)" }} />
                      <button type="button" onClick={() => setNewDof({ ...newDof, afterPhoto: "" })} style={{ position: "absolute", top: -6, right: -6, width: 20, height: 20, borderRadius: "50%", border: "none", backgroundColor: "#dc2626", color: "white", fontSize: 11, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>✕</button>
                    </div>
                  ) : (
                    <input type="file" accept="image/*" style={{ fontSize: 12, color: "var(--isg-text-muted)" }} onChange={e => handleImageToBase64(e, b64 => setNewDof({ ...newDof, afterPhoto: b64 }))} />
                  )}
                </div>
              </div>
              <div style={{ marginTop: 12, display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
                <button style={{ ...styles.btnPrimary, opacity: dofAdding ? 0.6 : 1 }} disabled={dofAdding} onClick={addDof}>{dofAdding ? "Kaydediliyor..." : "DÖF Ekle"}</button>
                {dofAddStatus && (
                  <span style={{ fontSize: 13, padding: "6px 12px", borderRadius: 6, backgroundColor: dofAddStatus.startsWith("✅") ? "#16a34a22" : dofAddStatus.startsWith("⚠️") ? "#d9770622" : "#dc262622", color: dofAddStatus.startsWith("✅") ? "#16a34a" : dofAddStatus.startsWith("⚠️") ? "#d97706" : "#dc2626" }}>{dofAddStatus}</span>
                )}
              </div>
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
                      <span style={{ fontSize: 11, color: "var(--isg-text-muted)" }}>📍 {dof.location}</span>
                      <span style={{ fontSize: 11, color: "var(--isg-text-muted)" }}>👤 {dof.responsible}</span>
                      <span style={{ fontSize: 11, color: "var(--isg-text-muted)" }}>📅 {dof.dueDate}</span>
                      {dof.affectedPersons && <span style={{ fontSize: 11, color: "var(--isg-text-muted)" }}>👥 {dof.affectedPersons}</span>}
                    </div>
                    <div style={{ display: "flex", gap: 6, marginBottom: 8, flexWrap: "wrap" }}>
                      <Badge text={dof.status} color={dof.status === "Çözüldü" ? "#16a34a" : dof.status === "Riske Aktarıldı" ? "#7c3aed" : dof.status === "Önlem Alındı" ? "#d97706" : dof.status === "Bildirildi" ? "#0ea5e9" : "#dc2626"} />
                      <span style={{ fontSize: 11, color: "var(--isg-text-muted)" }}>{company?.nickName}</span>
                      {observer && <span style={{ fontSize: 11, color: "var(--isg-text-muted)" }}>{observer.fullName}</span>}
                    </div>
                    {(dof.beforePhoto || dof.afterPhoto) && (
                      <div style={{ display: "flex", gap: 8, marginBottom: 8 }}>
                        {dof.beforePhoto && <div><div style={{ fontSize: 10, color: "#64748b", marginBottom: 2 }}>Önce</div><img src={dof.beforePhoto} alt="önce" style={{ width: 80, height: 60, objectFit: "cover", borderRadius: 4 }} /></div>}
                        {dof.afterPhoto && <div><div style={{ fontSize: 10, color: "#64748b", marginBottom: 2 }}>Sonra</div><img src={dof.afterPhoto} alt="sonra" style={{ width: 80, height: 60, objectFit: "cover", borderRadius: 4 }} /></div>}
                      </div>
                    )}
                    {isEditing && (
                      <div style={{ marginBottom: 8 }}>
                        <select style={styles.select} className="isg-input" value={dof.status} onChange={e => updateDofStatus(dof.id, e.target.value as any)}>
                          <option>Açık</option><option>Bildirildi</option><option>Önlem Alındı</option><option>Çözüldü</option>
                        </select>
                      </div>
                    )}
                    <div style={{ display: "flex", gap: 6 }}>
                      <button style={styles.btnSecondary} onClick={() => setEditingDofId(isEditing ? null : dof.id)}>{isEditing ? "Kapat" : "Düzenle"}</button>
                      {risks.some(r => r.sourceDofId === dof.id) ? (
                        <button style={{ ...styles.btnSuccess, fontSize: 11, padding: "4px 10px" }} onClick={() => createRiskFromDof(dof)}>✓ Risk Görüntüle</button>
                      ) : dof.status !== "Riske Aktarıldı" && (
                        <button style={{ ...styles.btnPrimary, fontSize: 11, padding: "4px 10px", opacity: dof.status === "Önlem Alındı" ? 1 : 0.6 }} onClick={() => {
                          if (dof.status !== "Önlem Alındı") {
                            setDofAddStatus(`⚠️ Riske aktarmak için önce DÖF durumunu "Önlem Alındı" olarak değiştirin`);
                            setTimeout(() => setDofAddStatus(null), 4000);
                            return;
                          }
                          createRiskFromDof(dof);
                        }}>⚡ Riske Aktar</button>
                      )}
                      <button style={{ ...styles.btnSecondary, fontSize: 11, padding: "4px 8px" }} onClick={() => generateDofPDF(dof)}>📄 PDF</button>
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
            <div style={styles.card} className="isg-card">
              <p style={styles.sectionTitle} className="isg-text-muted">Yeni Risk Kaydı</p>
              <div style={styles.formGrid}>
                <FormField label="Firma *"><select style={styles.select} className="isg-input" value={newRisk.companyId} onChange={e => setNewRisk({ ...newRisk, companyId: e.target.value })}><option value="">Seçin...</option>{companies.map(c => <option key={c.id} value={c.id}>{c.nickName}</option>)}</select></FormField>
                <FormField label="Bölüm / Faaliyet"><input style={styles.input} className="isg-input" value={newRisk.section} onChange={e => setNewRisk({ ...newRisk, section: e.target.value })} /></FormField>
                <FormField label="Tehlike Kaynağı / Mevcut Durum *"><input style={styles.input} className="isg-input" value={newRisk.hazard} onChange={e => setNewRisk({ ...newRisk, hazard: e.target.value })} /></FormField>
                <FormField label="Tehlike"><input style={styles.input} className="isg-input" value={newRisk.risk} onChange={e => setNewRisk({ ...newRisk, risk: e.target.value })} /></FormField>
                <FormField label="Mevcut Önlem"><input style={styles.input} className="isg-input" value={newRisk.currentMeasure} onChange={e => setNewRisk({ ...newRisk, currentMeasure: e.target.value })} /></FormField>
                <FormField label="Öneriler / Alınacak Önlemler"><input style={styles.input} className="isg-input" value={newRisk.actionToTake} onChange={e => setNewRisk({ ...newRisk, actionToTake: e.target.value })} /></FormField>
                <FormField label="Olasılık (1-5)"><input style={styles.input} className="isg-input" type="number" min={1} max={5} value={newRisk.probability} onChange={e => setNewRisk({ ...newRisk, probability: e.target.value })} /></FormField>
                <FormField label="Şiddet (1-5)"><input style={styles.input} className="isg-input" type="number" min={1} max={5} value={newRisk.severity} onChange={e => setNewRisk({ ...newRisk, severity: e.target.value })} /></FormField>
                <FormField label="Kalıntı Olasılık"><input style={styles.input} className="isg-input" type="number" min={1} max={5} value={newRisk.residualProbability} onChange={e => setNewRisk({ ...newRisk, residualProbability: e.target.value })} /></FormField>
                <FormField label="Kalıntı Şiddet"><input style={styles.input} className="isg-input" type="number" min={1} max={5} value={newRisk.residualSeverity} onChange={e => setNewRisk({ ...newRisk, residualSeverity: e.target.value })} /></FormField>
                <FormField label="Etkilenecek Kişiler"><input style={styles.input} className="isg-input" value={newRisk.affectedPersons} onChange={e => setNewRisk({ ...newRisk, affectedPersons: e.target.value })} placeholder="Tüm çalışanlar" /></FormField>
                <FormField label="Sorumlu"><input style={styles.input} className="isg-input" value={newRisk.responsible} onChange={e => setNewRisk({ ...newRisk, responsible: e.target.value })} /></FormField>
                <FormField label="Termin"><DatePicker value={newRisk.dueDate} onChange={v => setNewRisk({ ...newRisk, dueDate: v })} /></FormField>
                <FormField label="Kontrol Tarihi"><DatePicker value={newRisk.controlDate} onChange={v => setNewRisk({ ...newRisk, controlDate: v })} /></FormField>
                <FormField label="Durum"><select style={styles.select} className="isg-input" value={newRisk.status} onChange={e => setNewRisk({ ...newRisk, status: e.target.value as any })}><option>Açık</option><option>Kontrol Altında</option><option>Kapandı</option></select></FormField>
                <FormField label="İlgili Mevzuat">
                  <input style={styles.input} className="isg-input" value={newRisk.lawReference} onChange={e => setNewRisk({ ...newRisk, lawReference: e.target.value })} placeholder="6331 sayılı İSG Kanunu..." />
                </FormField>
              </div>
              <div style={{ marginTop: 8, fontSize: 13, color: "var(--isg-text-muted)" }}>
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
                    await generateRiskPDF(risksToExport, companiesToExport, signers);
                  } finally {
                    setPdfLoading(false);
                  }
                }}
              >
                {pdfLoading ? "⏳ Hazırlanıyor..." : "📄 PDF Rapor İndir"}
              </button>
              <button
                style={{ ...styles.btnPrimary, opacity: risks.length === 0 ? 0.6 : 1 }}
                disabled={risks.length === 0}
                onClick={() => {
                  setRiskEmailModal({ companyId: selectedCompanyId === "all" ? "" : selectedCompanyId });
                  setRiskEmailSelectedContacts([]);
                  setRiskEmailStatus(null);
                }}
              >
                📧 Risk Raporu Email Gönder
              </button>
            </div>

            <div style={{ ...styles.card, padding: 0, overflow: "auto" }}>
              <table style={styles.table}>
                <thead>
                  <tr>
                    {["Firma", "Bölüm", "Tehlike Kaynağı", "Tehlike", "Mevcut Önlem", "Öneriler", "O", "Ş", "RS", "KO", "KŞ", "KRS", "Etkilenecek", "Sorumlu", "Termin", "K.Tarihi", "Durum", "Mevzuat", "Kaynak", "İşlem"].map(h => (
                      <th key={h} style={styles.th} className="isg-th">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filteredRisks.map(r => {
                    const company = companies.find(c => c.id === r.companyId);
                    const sourceDof = r.sourceDofId ? dofs.find(d => d.id === r.sourceDofId) : null;
                    return (
                      <tr key={r.id}>
                        <td style={{ ...styles.td, fontSize: 12 }}>{company?.nickName}</td>
                        <td style={styles.td} className="isg-td">{r.section}</td>
                        <td style={{ ...styles.td, fontWeight: 500 }}>{r.hazard}</td>
                        <td style={{ ...styles.td, fontSize: 12, color: "var(--isg-text-muted)" }}>{r.risk}</td>
                        <td style={{ ...styles.td, fontSize: 11, color: "var(--isg-text-muted)" }}>{r.currentMeasure}</td>
                        <td style={{ ...styles.td, fontSize: 11, color: "var(--isg-text-muted)" }}>{r.actionToTake}</td>
                        <td style={{ ...styles.td, textAlign: "center" as const, fontSize: 12 }}>{r.probability}</td>
                        <td style={{ ...styles.td, textAlign: "center" as const, fontSize: 12 }}>{r.severity}</td>
                        <td style={styles.td} className="isg-td"><span style={{ fontWeight: 700, color: riskScoreColor(r.score), fontSize: 14 }}>{r.score}</span></td>
                        <td style={{ ...styles.td, textAlign: "center" as const, fontSize: 12 }}>{r.residualProbability}</td>
                        <td style={{ ...styles.td, textAlign: "center" as const, fontSize: 12 }}>{r.residualSeverity}</td>
                        <td style={styles.td} className="isg-td"><span style={{ fontWeight: 700, color: riskScoreColor(r.residualScore), fontSize: 14 }}>{r.residualScore}</span></td>
                        <td style={{ ...styles.td, fontSize: 11 }}>{r.affectedPersons || "—"}</td>
                        <td style={{ ...styles.td, fontSize: 12 }}>{r.responsible}</td>
                        <td style={{ ...styles.td, fontSize: 12 }}>{r.dueDate}</td>
                        <td style={{ ...styles.td, fontSize: 12 }}>{r.controlDate || "—"}</td>
                        <td style={styles.td} className="isg-td"><Badge text={r.status} color={r.status === "Kapandı" ? "#16a34a" : r.status === "Kontrol Altında" ? "#d97706" : "#dc2626"} /></td>
                        <td style={{ ...styles.td, fontSize: 11, color: "#94a3b8", maxWidth: 140 }}>{r.lawReference || "—"}</td>
                        <td style={styles.td} className="isg-td">
                          {sourceDof ? (
                            <span onClick={() => setActiveTab("dof")} style={{ cursor: "pointer", display: "inline-block", padding: "2px 6px", borderRadius: 4, fontSize: 10, fontWeight: 600, backgroundColor: "#7c3aed22", color: "#7c3aed", border: "1px solid #7c3aed44" }} title={sourceDof.title}>
                              DÖF ↗
                            </span>
                          ) : <span style={{ fontSize: 11, color: "var(--isg-text-muted)" }}>Manuel</span>}
                        </td>
                        <td style={styles.td} className="isg-td">
                          <div style={{ display: "flex", gap: 4 }}>
                            <button style={styles.btnDanger} onClick={() => deleteRisk(r.id)}>Sil</button>
                            <button style={{ ...styles.btnSecondary, fontSize: 11, padding: "2px 6px" }} title="Risk Raporu Email Gönder" onClick={() => {
                              setRiskEmailModal({ companyId: r.companyId });
                              setRiskEmailSelectedContacts([]);
                              setRiskEmailStatus(null);
                            }}>📧</button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Risk Email Gönder Modal */}
            {riskEmailModal && (
              <div style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, backgroundColor: "rgba(0,0,0,0.6)", zIndex: 2000, display: "flex", alignItems: "center", justifyContent: "center" }} onClick={() => setRiskEmailModal(null)}>
                <div style={{ backgroundColor: "var(--isg-card)", border: "1px solid var(--isg-border)", borderRadius: 12, padding: 24, width: 500, maxWidth: "90vw", maxHeight: "80vh", overflowY: "auto" }} onClick={e => e.stopPropagation()}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
                    <div style={{ fontWeight: 700, fontSize: 15, color: "var(--isg-text)" }}>📧 Risk Raporu Email Gönder</div>
                    <button style={{ ...styles.btnSecondary, fontSize: 16, padding: "2px 8px" }} onClick={() => setRiskEmailModal(null)}>✕</button>
                  </div>

                  <div style={{ fontSize: 12, color: "var(--isg-text-muted)", marginBottom: 12 }}>
                    {riskEmailModal.companyId
                      ? `${companies.find(c => c.id === riskEmailModal.companyId)?.nickName || ""} firmasına ait risk raporu PDF olarak seçili adreslere gönderilecektir.`
                      : "Tüm firmalara ait risk raporu PDF olarak seçili adreslere gönderilecektir."}
                  </div>

                  <div style={{ fontSize: 12, fontWeight: 600, color: "var(--isg-text)", marginBottom: 8 }}>Alıcıları Seçin:</div>

                  {emailContacts.length > 0 && (
                    <div style={{ display: "flex", flexDirection: "column", gap: 6, marginBottom: 12 }}>
                      {emailContacts.map(c => {
                        const isSelected = riskEmailSelectedContacts.includes(c.id);
                        return (
                          <label key={c.id} style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 12px", borderRadius: 8, border: `1px solid ${isSelected ? "#3b82f6" : "var(--isg-border)"}`, backgroundColor: isSelected ? "#3b82f622" : "transparent", cursor: "pointer" }}>
                            <input type="checkbox" checked={isSelected} onChange={() => {
                              setRiskEmailSelectedContacts(prev => isSelected ? prev.filter(id => id !== c.id) : [...prev, c.id]);
                            }} style={{ width: 16, height: 16 }} />
                            <div style={{ flex: 1 }}>
                              <div style={{ fontSize: 13, fontWeight: 600, color: "var(--isg-text)" }}>{c.name}</div>
                              <div style={{ fontSize: 11, color: "var(--isg-text-muted)" }}>{c.email}{c.role ? ` · ${c.role}` : ""}</div>
                            </div>
                            <button style={{ ...styles.btnDanger, fontSize: 10, padding: "2px 6px" }} onClick={async (e) => {
                              e.preventDefault(); e.stopPropagation();
                              await deleteDoc(doc(db, "emailContacts", c.id));
                              setEmailContacts(prev => prev.filter(x => x.id !== c.id));
                              setRiskEmailSelectedContacts(prev => prev.filter(id => id !== c.id));
                            }}>✕</button>
                          </label>
                        );
                      })}
                    </div>
                  )}

                  {emailContacts.length === 0 && (
                    <p style={{ fontSize: 12, color: "var(--isg-text-muted)", padding: 12, backgroundColor: "var(--isg-bg)", borderRadius: 6, marginBottom: 12 }}>
                      Henüz kayıtlı alıcı yok. Aşağıdan ekleyin.
                    </p>
                  )}

                  {/* Inline Kişi Ekleme */}
                  <div style={{ display: "flex", gap: 6, marginBottom: 16, flexWrap: "wrap", alignItems: "end" }}>
                    <div style={{ flex: 1, minWidth: 120 }}>
                      <label style={{ fontSize: 10, color: "var(--isg-text-muted)" }}>Ad Soyad</label>
                      <input style={{ ...styles.input, fontSize: 12, padding: "6px 8px" }} className="isg-input" value={newContact.name} onChange={e => setNewContact({ ...newContact, name: e.target.value })} placeholder="Ad Soyad" />
                    </div>
                    <div style={{ flex: 1, minWidth: 160 }}>
                      <label style={{ fontSize: 10, color: "var(--isg-text-muted)" }}>Email</label>
                      <input style={{ ...styles.input, fontSize: 12, padding: "6px 8px" }} className="isg-input" type="email" value={newContact.email} onChange={e => setNewContact({ ...newContact, email: e.target.value })} placeholder="email@firma.com" />
                    </div>
                    <div style={{ flex: 1, minWidth: 100 }}>
                      <label style={{ fontSize: 10, color: "var(--isg-text-muted)" }}>Rol</label>
                      <input style={{ ...styles.input, fontSize: 12, padding: "6px 8px" }} className="isg-input" value={newContact.role} onChange={e => setNewContact({ ...newContact, role: e.target.value })} placeholder="İSG Uzmanı..." />
                    </div>
                    <button style={{ ...styles.btnSuccess, fontSize: 12, padding: "6px 12px", whiteSpace: "nowrap" }} onClick={async () => {
                      if (!newContact.name || !newContact.email) return;
                      try {
                        const ref = await addDoc(collection(db, "emailContacts"), newContact);
                        const added = { id: ref.id, ...newContact };
                        setEmailContacts(prev => [...prev, added]);
                        setRiskEmailSelectedContacts(prev => [...prev, ref.id]);
                        setNewContact({ name: "", email: "", role: "" });
                      } catch (e: any) { console.error(e); }
                    }}>+ Ekle</button>
                  </div>

                  <div style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center" }}>
                    <button style={{ ...styles.btnPrimary, opacity: riskEmailSending || riskEmailSelectedContacts.length === 0 ? 0.5 : 1 }} disabled={riskEmailSending || riskEmailSelectedContacts.length === 0} onClick={async () => {
                      if (!riskEmailModal) return;
                      setRiskEmailSending(true);
                      setRiskEmailStatus(null);
                      try {
                        const risksToSend = riskEmailModal.companyId ? risks.filter(r => r.companyId === riskEmailModal.companyId) : risks;
                        if (risksToSend.length === 0) {
                          setRiskEmailStatus("⚠️ Gönderilecek risk kaydı bulunamadı");
                          setRiskEmailSending(false);
                          return;
                        }
                        const companiesToSend = riskEmailModal.companyId ? companies.filter(c => c.id === riskEmailModal.companyId) : companies;
                        const pdfMake = (await import("pdfmake/build/pdfmake")) as any;
                        const pdfFonts = (await import("pdfmake/build/vfs_fonts")) as any;
                        const maker = pdfMake.default || pdfMake;
                        maker.vfs = (pdfFonts.default || pdfFonts).vfs;
                        const pdfBase64: string = await new Promise((resolve, reject) => {
                          try {
                            const docDef: any = {
                              pageSize: "A4", pageOrientation: "landscape", pageMargins: [20, 20, 20, 20],
                              content: [
                                { text: "RISK DEGERLENDIRME RAPORU", fontSize: 14, bold: true, alignment: "center", margin: [0, 0, 0, 10] },
                                {
                                  table: {
                                    headerRows: 1,
                                    widths: [15, 50, 60, 50, 40, 15, 15, 20, 70, 50, 40, 40, 15, 15, 20, 50],
                                    body: [
                                      ["No", "Bolum", "Tehlike Kaynagi", "Mevcut Onlem", "Tehlike/Risk", "O", "S", "RS", "Oneriler", "Etkilenecek", "Sorumlu", "Termin", "KO", "KS", "KRS", "Mevzuat"].map(h => ({ text: h, fontSize: 6, bold: true, color: "white", fillColor: "#1e293b", margin: [2, 3, 2, 3] })),
                                      ...risksToSend.map((r, i) => [
                                        { text: String(i + 1), fontSize: 6, margin: [2, 2, 2, 2] },
                                        { text: r.section || "", fontSize: 6, margin: [2, 2, 2, 2] },
                                        { text: r.hazard || "", fontSize: 6, margin: [2, 2, 2, 2] },
                                        { text: r.currentMeasure || "", fontSize: 6, margin: [2, 2, 2, 2] },
                                        { text: r.risk || "", fontSize: 6, margin: [2, 2, 2, 2] },
                                        { text: String(r.probability || 0), fontSize: 6, alignment: "center", margin: [2, 2, 2, 2] },
                                        { text: String(r.severity || 0), fontSize: 6, alignment: "center", margin: [2, 2, 2, 2] },
                                        { text: String(r.score || 0), fontSize: 7, bold: true, color: "white", fillColor: r.score >= 15 ? "#dc2626" : r.score >= 8 ? "#d97706" : "#16a34a", alignment: "center", margin: [2, 2, 2, 2] },
                                        { text: r.actionToTake || "", fontSize: 6, margin: [2, 2, 2, 2] },
                                        { text: r.affectedPersons || "Tum calisanlar", fontSize: 6, margin: [2, 2, 2, 2] },
                                        { text: r.responsible || "", fontSize: 6, margin: [2, 2, 2, 2] },
                                        { text: r.dueDate || "", fontSize: 6, margin: [2, 2, 2, 2] },
                                        { text: String(r.residualProbability || 0), fontSize: 6, alignment: "center", margin: [2, 2, 2, 2] },
                                        { text: String(r.residualSeverity || 0), fontSize: 6, alignment: "center", margin: [2, 2, 2, 2] },
                                        { text: String(r.residualScore || 0), fontSize: 7, bold: true, color: "white", fillColor: (r.residualScore || 0) >= 15 ? "#dc2626" : (r.residualScore || 0) >= 8 ? "#d97706" : "#16a34a", alignment: "center", margin: [2, 2, 2, 2] },
                                        { text: r.lawReference || "", fontSize: 6, margin: [2, 2, 2, 2] },
                                      ]),
                                    ],
                                  },
                                  layout: { hLineWidth: () => 0.3, vLineWidth: () => 0.3, hLineColor: () => "#d1d5db", vLineColor: () => "#d1d5db" },
                                },
                              ],
                              defaultStyle: { font: "Roboto" },
                            };
                            maker.createPdf(docDef).getBase64((data: string) => resolve(data));
                          } catch (pdfErr) { reject(pdfErr); }
                        });
                        const selectedEmails = emailContacts.filter(c => riskEmailSelectedContacts.includes(c.id)).map(c => c.email);
                        if (selectedEmails.length === 0) {
                          setRiskEmailStatus("⚠️ Seçili alıcı bulunamadı");
                          setRiskEmailSending(false);
                          return;
                        }
                        const res = await fetch("/api/send-risk-email", {
                          method: "POST",
                          headers: { "Content-Type": "application/json" },
                          body: JSON.stringify({ toEmails: selectedEmails, pdfBase64, companyName: companiesToSend.map(c => c.nickName).join(", ") }),
                        });
                        const data = await res.json();
                        if (res.ok) {
                          setRiskEmailStatus("✅ Risk raporu başarıyla gönderildi!");
                          setTimeout(() => setRiskEmailModal(null), 2000);
                        } else {
                          setRiskEmailStatus(`❌ Hata: ${typeof data.error === "string" ? data.error : JSON.stringify(data.error)}`);
                        }
                      } catch (e: any) {
                        setRiskEmailStatus(`❌ Hata: ${e.message}`);
                      }
                      setRiskEmailSending(false);
                    }}>{riskEmailSending ? "Gönderiliyor..." : `📧 ${riskEmailSelectedContacts.length} Kişiye Gönder`}</button>
                    {riskEmailStatus && (
                      <span style={{ fontSize: 13, color: riskEmailStatus.startsWith("✅") ? "#16a34a" : "#dc2626" }}>{riskEmailStatus}</span>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === "imzacilar" && (
          <div>
            <div style={styles.card} className="isg-card">
              <p style={styles.sectionTitle} className="isg-text-muted">İmzacı Yönetimi</p>
              <p style={{ fontSize: 12, color: "var(--isg-text-muted)", marginBottom: 16 }}>
                Her firma için PDF raporlarında görünecek 3 imzacıyı belirleyin: İş Güvenliği Uzmanı, İşveren/İşveren Vekili ve Çalışan Temsilcisi.
              </p>

              {companies.map(company => {
                const compSigners = signers.filter(s => s.companyId === company.id);
                const roles: SignerRole[] = ["İş Güvenliği Uzmanı", "İşveren / İşveren Vekili", "Çalışan Temsilcisi"];

                return (
                  <div key={company.id} style={{ ...styles.card, marginBottom: 12 }} className="isg-card">
                    <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 12, color: "var(--isg-text)" }}>{company.nickName}</div>
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12 }}>
                      {roles.map(role => {
                        const existing = compSigners.find(s => s.role === role);
                        return (
                          <div key={role} style={{ backgroundColor: "var(--isg-input-bg)", border: "1px solid var(--isg-border)", borderRadius: 8, padding: 12 }}>
                            <div style={{ fontSize: 11, fontWeight: 600, color: "var(--isg-text-muted)", marginBottom: 8 }}>{role}</div>
                            {existing ? (
                              <div>
                                <div style={{ fontSize: 14, fontWeight: 700, color: "var(--isg-text)", marginBottom: 8 }}>{existing.fullName}</div>
                                <div style={{ display: "flex", gap: 6 }}>
                                  <button style={styles.btnDanger} onClick={async () => {
                                    await deleteDoc(doc(db, "signers", existing.id));
                                    setSigners(prev => prev.filter(s => s.id !== existing.id));
                                  }}>Sil</button>
                                </div>
                              </div>
                            ) : (
                              <div>
                                <input
                                  style={styles.input}
                                  className="isg-input"
                                  placeholder="Ad Soyad girin..."
                                  onKeyDown={async (e) => {
                                    if (e.key === "Enter" && (e.target as HTMLInputElement).value.trim()) {
                                      const name = (e.target as HTMLInputElement).value.trim();
                                      const data = { companyId: company.id, role, fullName: name };
                                      const ref = await addDoc(collection(db, "signers"), data);
                                      setSigners(prev => [...prev, { id: ref.id, ...data }]);
                                      (e.target as HTMLInputElement).value = "";
                                    }
                                  }}
                                />
                                <div style={{ fontSize: 10, color: "var(--isg-text-muted)", marginTop: 4 }}>Enter ile kaydet</div>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Vardiya ve Ayarlar sekmeleri kaldırıldı */}

      </main>
    </div>
  );
}
