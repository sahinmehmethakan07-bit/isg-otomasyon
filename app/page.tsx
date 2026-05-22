"use client";
// SessionGuard devre disi
// destroySession devre disi
import { useUserRole } from "./lib/useUserRole";
import { getUserProfile, UserProfile, UserRole, ROLE_CONFIG, withCreatedBy } from "./lib/roleManager";
import { AdminUserPanel } from "./lib/AdminUserPanel";
import { Ek2MuayeneFormu } from "./lib/Ek2MuayeneFormu";
import { useLanguage } from "./lib/i18n";

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
  query,
  where,
  documentId,
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

type OnboardingTaskKey = "doctorEk2" | "safetyTraining" | "safetyDocuments";
type OnboardingStatus = "pending" | "completed";

type OnboardingTask = {
  key: OnboardingTaskKey;
  label: string;
  ownerRole: "doctor" | "safety_expert";
  completed: boolean;
  completedAt?: string;
};

type EmployeeOnboarding = {
  status: OnboardingStatus;
  tasks: Record<OnboardingTaskKey, OnboardingTask>;
  missingSteps: string[];
  notifiedAt?: string;
  lastReminderAt?: string;
};

type Employee = {
  id: string;
  companyId: string;
  firstName: string;
  lastName: string;
  tcNo: string;
  photo?: string;
  birthPlace?: string;
  birthDate?: string;
  gender?: string;
  nationality?: string;
  serialNo?: string;
  fatherName?: string;
  motherName?: string;
  phone?: string;
  email?: string;
  department?: string;
  diplomaInfo?: string;
  educationLevel?: string;
  maritalStatus?: string;
  childrenCount?: string;
  address?: string;
  title: string;
  jobDescription?: string;
  profession?: string;
  hireDate: string;
  sgkNo?: string;
  iban?: string;
  emergencyContactName?: string;
  emergencyContactPhone?: string;
  bloodType?: string;
  chronicDisease?: string;
  tetanusVaccine?: string;
  hepatitisVaccine?: string;
  allergies?: string;
  notes?: string;
  isActive: boolean;
  trainingComplete: boolean;
  checklist: EmployeeChecklist;
  onboarding?: EmployeeOnboarding;
};

type NewEmployeeForm = {
  companyId: string;
  firstName: string;
  lastName: string;
  tcNo: string;
  photo: string;
  birthPlace: string;
  birthDate: string;
  gender: string;
  nationality: string;
  nationalityOther: string;
  serialNo: string;
  fatherName: string;
  motherName: string;
  phone: string;
  email: string;
  department: string;
  diplomaInfo: string;
  educationLevel: string;
  maritalStatus: string;
  childrenCount: string;
  address: string;
  title: string;
  jobDescription: string;
  profession: string;
  hireDate: string;
  sgkNo: string;
  iban: string;
  emergencyContactName: string;
  emergencyContactPhone: string;
  bloodType: string;
  chronicDisease: string;
  tetanusVaccine: string;
  hepatitisVaccine: string;
  allergies: string;
  notes: string;
};

const emptyNewEmployee: NewEmployeeForm = {
  companyId: "",
  firstName: "",
  lastName: "",
  tcNo: "",
  photo: "",
  birthPlace: "",
  birthDate: "",
  gender: "",
  nationality: "T.C.",
  nationalityOther: "",
  serialNo: "",
  fatherName: "",
  motherName: "",
  phone: "",
  email: "",
  department: "",
  diplomaInfo: "",
  educationLevel: "",
  maritalStatus: "",
  childrenCount: "",
  address: "",
  title: "",
  jobDescription: "",
  profession: "",
  hireDate: "",
  sgkNo: "",
  iban: "",
  emergencyContactName: "",
  emergencyContactPhone: "",
  bloodType: "",
  chronicDisease: "",
  tetanusVaccine: "",
  hepatitisVaccine: "",
  allergies: "",
  notes: "",
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
  doctorEmail?: string;
  safetyExpertEmail?: string;
  subject: string;
  message: string;
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

type AnnualPlanType = "Eğitim" | "Muayene" | "Risk Değerlendirme" | "Acil Durum Tatbikatı" | "Kurul Toplantısı" | "Saha Ziyareti" | "Belge Yenileme";
type AnnualPlanStatus = "Planlandı" | "Devam Ediyor" | "Tamamlandı" | "Gecikti";

type AnnualPlanRecord = {
  id: string;
  companyId: string;
  year: number;
  type: AnnualPlanType;
  title: string;
  plannedDate: string;
  responsible: string;
  status: AnnualPlanStatus;
  notes: string;
};

type TrainingType = "Temel İSG Eğitimi" | "İşe Giriş Eğitimi" | "Yenileme Eğitimi" | "Acil Durum Eğitimi" | "KKD Eğitimi" | "Hijyen Eğitimi";
type TrainingStatus = "Planlandı" | "Tamamlandı" | "İptal";

type TrainingRecord = {
  id: string;
  companyId: string;
  title: string;
  type: TrainingType;
  trainingDate: string;
  durationHours?: string;
  location?: string;
  trainer: string;
  participantIds: string[];
  status: TrainingStatus;
  notes: string;
};

type PpeStatus = "Teslim Edildi" | "İade Edildi" | "Hasarlı / Kayıp";

type PpeRecord = {
  id: string;
  companyId: string;
  employeeId: string;
  equipment: string;
  quantity: number;
  issueDate: string;
  returnDate?: string;
  status: PpeStatus;
  serialNo?: string;
  notes: string;
};

type EmergencyPlanStatus = "Taslak" | "Yürürlükte" | "Tatbikat Planlandı" | "Güncelleme Gerekli";

type EmergencyPlanRecord = {
  id: string;
  companyId: string;
  title: string;
  scenario: string;
  assemblyArea: string;
  emergencyTeam: string;
  responsible: string;
  planDate: string;
  drillDate?: string;
  status: EmergencyPlanStatus;
  notes: string;
};

type CommitteeMeetingStatus = "Planlandı" | "Yapıldı" | "Ertelendi" | "Kararlar Takipte";

type CommitteeMeetingRecord = {
  id: string;
  companyId: string;
  meetingNo: string;
  meetingDate: string;
  location: string;
  chairperson: string;
  agenda: string;
  decisions: string;
  participantIds: string[];
  status: CommitteeMeetingStatus;
  notes: string;
};

type AccidentReportStatus = "Açık" | "İncelemede" | "Aksiyon Planlandı" | "Kapandı";
type AccidentSeverity = "Ramak Kala" | "Hafif" | "Orta" | "Ağır";

type AccidentReportRecord = {
  id: string;
  companyId: string;
  employeeId: string;
  accidentDate: string;
  location: string;
  severity: AccidentSeverity;
  incidentType: string;
  description: string;
  rootCause: string;
  actionPlan: string;
  responsible: string;
  dueDate?: string;
  status: AccidentReportStatus;
  notes: string;
};

type CompanyVisitStatus = "Planlandı" | "Tamamlandı" | "Ertelendi" | "Takip Gerekli";
type CompanyVisitPurpose = "Rutin Ziyaret" | "Risk Kontrolü" | "Eğitim / Bilgilendirme" | "DÖF Takibi" | "Acil Ziyaret";

type CompanyVisitRecord = {
  id: string;
  companyId: string;
  visitDate: string;
  purpose: CompanyVisitPurpose;
  visitor: string;
  contactedPerson: string;
  findings: string;
  actions: string;
  nextVisitDate?: string;
  status: CompanyVisitStatus;
  notes: string;
};

type ArchiveItem = {
  id: string;
  companyId: string;
  type: string;
  title: string;
  owner: string;
  date: string;
  status: string;
  sourceTab: string;
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

function createOnboardingFromChecklist(checklist: EmployeeChecklist): EmployeeOnboarding {
  const tasks: Record<OnboardingTaskKey, OnboardingTask> = {
    doctorEk2: {
      key: "doctorEk2",
      label: "İşyeri hekimi EK-2 formunu tamamlamalı",
      ownerRole: "doctor",
      completed: !!checklist.ek2Date,
      completedAt: checklist.ek2Date || undefined,
    },
    safetyTraining: {
      key: "safetyTraining",
      label: "İSG uzmanı eğitim planlamasını tamamlamalı",
      ownerRole: "safety_expert",
      completed: !!checklist.orientationDate && !!checklist.isgCertificateDate,
      completedAt: checklist.isgCertificateDate || checklist.orientationDate || undefined,
    },
    safetyDocuments: {
      key: "safetyDocuments",
      label: "İSG uzmanı personel evraklarını tamamlamalı",
      ownerRole: "safety_expert",
      completed: checklist.preTest && checklist.postTest && checklist.undertaking && checklist.kkdMinutes && checklist.attendanceDoc,
    },
  };
  const missingSteps = Object.values(tasks).filter(task => !task.completed).map(task => task.label);
  return {
    status: missingSteps.length === 0 ? "completed" : "pending",
    tasks,
    missingSteps,
  };
}

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

function annualPlanStatusColor(status: AnnualPlanStatus) {
  if (status === "Tamamlandı") return "#16a34a";
  if (status === "Devam Ediyor") return "#0ea5e9";
  if (status === "Gecikti") return "#dc2626";
  return "#d97706";
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

async function generateAnnualPlanPDF(plans: AnnualPlanRecord[], companies: Company[]) {
  if (plans.length === 0) return;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const pdfMake = (await import("pdfmake/build/pdfmake")) as any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const pdfFonts = (await import("pdfmake/build/vfs_fonts")) as any;
  const maker = pdfMake.default || pdfMake;
  maker.vfs = (pdfFonts.default || pdfFonts).vfs;

  const companyName = (companyId: string) => companies.find(c => c.id === companyId)?.officialName || companies.find(c => c.id === companyId)?.nickName || "-";
  const sortedPlans = [...plans].sort((a, b) => `${a.companyId}-${a.plannedDate}`.localeCompare(`${b.companyId}-${b.plannedDate}`));
  const content: any[] = [
    { text: "YILLIK İSG PLANI", fontSize: 16, bold: true, color: "#1e293b", alignment: "center", margin: [0, 0, 0, 4] },
    { text: new Date().toLocaleDateString("tr-TR"), fontSize: 9, color: "#64748b", alignment: "center", margin: [0, 0, 0, 14] },
    {
      table: {
        headerRows: 1,
        widths: [78, 46, 72, "*", 58, 70, 62, "*"],
        body: [
          ["Firma", "Yıl", "Tür", "Başlık", "Tarih", "Sorumlu", "Durum", "Not"].map(text => ({ text, bold: true, color: "white", fillColor: "#1e293b", fontSize: 8, margin: [3, 4, 3, 4] })),
          ...sortedPlans.map(plan => [
            companyName(plan.companyId),
            String(plan.year),
            plan.type,
            plan.title,
            plan.plannedDate ? new Date(plan.plannedDate).toLocaleDateString("tr-TR") : "-",
            plan.responsible || "-",
            plan.status,
            plan.notes || "-",
          ].map(text => ({ text, fontSize: 7, color: "#334155", margin: [3, 4, 3, 4] }))),
        ],
      },
      layout: { hLineWidth: () => 0.4, vLineWidth: () => 0.4, hLineColor: () => "#cbd5e1", vLineColor: () => "#cbd5e1" },
    },
  ];

  maker.createPdf({
    pageOrientation: "landscape",
    pageSize: "A4",
    pageMargins: [18, 18, 18, 18],
    content,
    defaultStyle: { font: "Roboto" },
  }).download(`Yillik_ISG_Plani_${new Date().getFullYear()}.pdf`);
}

async function generateTrainingPDF(trainings: TrainingRecord[], companies: Company[], employees: Employee[]) {
  if (trainings.length === 0) return;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const pdfMake = (await import("pdfmake/build/pdfmake")) as any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const pdfFonts = (await import("pdfmake/build/vfs_fonts")) as any;
  const maker = pdfMake.default || pdfMake;
  maker.vfs = (pdfFonts.default || pdfFonts).vfs;

  const companyName = (companyId: string) => companies.find(c => c.id === companyId)?.officialName || companies.find(c => c.id === companyId)?.nickName || "-";
  const employeeName = (employeeId: string) => {
    const employee = employees.find(e => e.id === employeeId);
    return employee ? `${employee.firstName} ${employee.lastName}` : "";
  };
  const sortedTrainings = [...trainings].sort((a, b) => `${a.companyId}-${a.trainingDate}`.localeCompare(`${b.companyId}-${b.trainingDate}`));

  const content: any[] = [
    { text: "İSG EĞİTİM TAKİP LİSTESİ", fontSize: 16, bold: true, color: "#1e293b", alignment: "center", margin: [0, 0, 0, 4] },
    { text: new Date().toLocaleDateString("tr-TR"), fontSize: 9, color: "#64748b", alignment: "center", margin: [0, 0, 0, 14] },
    {
      table: {
        headerRows: 1,
        widths: [82, 86, 82, 58, 70, 96, 58, "*"],
        body: [
          ["Firma", "Eğitim", "Tür", "Tarih", "Eğitmen", "Katılımcılar", "Durum", "Not"].map(text => ({ text, bold: true, color: "white", fillColor: "#1e293b", fontSize: 8, margin: [3, 4, 3, 4] })),
          ...sortedTrainings.map(training => [
            companyName(training.companyId),
            training.title,
            training.type,
            training.trainingDate ? new Date(training.trainingDate).toLocaleDateString("tr-TR") : "-",
            training.trainer || "-",
            training.participantIds.map(employeeName).filter(Boolean).join(", ") || "-",
            training.status,
            training.notes || "-",
          ].map(text => ({ text, fontSize: 7, color: "#334155", margin: [3, 4, 3, 4] }))),
        ],
      },
      layout: { hLineWidth: () => 0.4, vLineWidth: () => 0.4, hLineColor: () => "#cbd5e1", vLineColor: () => "#cbd5e1" },
    },
  ];

  maker.createPdf({
    pageOrientation: "landscape",
    pageSize: "A4",
    pageMargins: [18, 18, 18, 18],
    content,
    defaultStyle: { font: "Roboto" },
  }).download(`ISG_Egitim_Takip_${new Date().getFullYear()}.pdf`);
}

async function generateTrainingAttendancePDF(training: TrainingRecord, company: Company | undefined, employees: Employee[]) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const pdfMake = (await import("pdfmake/build/pdfmake")) as any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const pdfFonts = (await import("pdfmake/build/vfs_fonts")) as any;
  const maker = pdfMake.default || pdfMake;
  maker.vfs = (pdfFonts.default || pdfFonts).vfs;

  const participants = training.participantIds
    .map(id => employees.find(employee => employee.id === id))
    .filter(Boolean) as Employee[];

  const body = [
    ["No", "Ad Soyad", "T.C. Kimlik No", "Görev / Ünvan", "İmza"].map(text => ({ text, bold: true, color: "white", fillColor: "#1e293b", fontSize: 8, margin: [4, 5, 4, 5] })),
    ...(participants.length > 0 ? participants : [{ firstName: "", lastName: "", tcNo: "", title: "" } as Employee]).map((employee, index) => [
      String(index + 1),
      `${employee.firstName} ${employee.lastName}`.trim() || " ",
      employee.tcNo || " ",
      employee.title || " ",
      " ",
    ].map(text => ({ text, fontSize: 8, color: "#334155", margin: [4, 7, 4, 7] }))),
  ];

  const content: any[] = [
    { text: "EĞİTİM KATILIM FORMU", fontSize: 16, bold: true, color: "#1e293b", alignment: "center", margin: [0, 0, 0, 12] },
    {
      table: {
        widths: [90, "*", 90, "*"],
        body: [
          ["Firma", company?.officialName || company?.nickName || "-", "Eğitim Türü", training.type],
          ["Eğitim Başlığı", training.title, "Eğitim Tarihi", training.trainingDate ? new Date(training.trainingDate).toLocaleDateString("tr-TR") : "-"],
          ["Eğitmen", training.trainer || "-", "Süre / Yer", `${training.durationHours || "-"} saat / ${training.location || "-"}`],
        ].map(row => row.map((text, index) => ({ text, fontSize: 8, bold: index % 2 === 0, color: "#334155", margin: [4, 5, 4, 5] }))),
      },
      layout: { hLineWidth: () => 0.4, vLineWidth: () => 0.4, hLineColor: () => "#cbd5e1", vLineColor: () => "#cbd5e1" },
      margin: [0, 0, 0, 12],
    },
    {
      table: {
        headerRows: 1,
        widths: [28, "*", 82, "*", 110],
        body,
      },
      layout: { hLineWidth: () => 0.4, vLineWidth: () => 0.4, hLineColor: () => "#cbd5e1", vLineColor: () => "#cbd5e1" },
      margin: [0, 0, 0, 18],
    },
    {
      columns: [
        { width: "*", text: "Eğitmen\n\n\nİmza", fontSize: 9, alignment: "center" },
        { width: "*", text: "İşveren / İşveren Vekili\n\n\nİmza", fontSize: 9, alignment: "center" },
      ],
    },
  ];

  maker.createPdf({
    pageSize: "A4",
    pageMargins: [28, 28, 28, 28],
    content,
    defaultStyle: { font: "Roboto" },
  }).download(`Egitim_Katilim_Formu_${training.title.replace(/\s+/g, "_")}.pdf`);
}

async function generateTrainingCertificatesPDF(training: TrainingRecord, company: Company | undefined, employees: Employee[]) {
  const participants = training.participantIds
    .map(id => employees.find(employee => employee.id === id))
    .filter(Boolean) as Employee[];
  if (participants.length === 0) return;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const pdfMake = (await import("pdfmake/build/pdfmake")) as any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const pdfFonts = (await import("pdfmake/build/vfs_fonts")) as any;
  const maker = pdfMake.default || pdfMake;
  maker.vfs = (pdfFonts.default || pdfFonts).vfs;

  const certificatePages = participants.flatMap((employee, index) => {
    const page: any = {
      stack: [
        { text: "İŞ SAĞLIĞI VE GÜVENLİĞİ", fontSize: 13, bold: true, color: "#0f766e", alignment: "center", margin: [0, 10, 0, 4] },
        { text: "EĞİTİM KATILIM SERTİFİKASI", fontSize: 24, bold: true, color: "#1e293b", alignment: "center", margin: [0, 0, 0, 24] },
        { text: `${employee.firstName} ${employee.lastName}`, fontSize: 22, bold: true, color: "#111827", alignment: "center", margin: [0, 0, 0, 12] },
        { text: `${training.title} (${training.type}) eğitimine katılmıştır.`, fontSize: 12, color: "#334155", alignment: "center", margin: [40, 0, 40, 18] },
        {
          table: {
            widths: ["*", "*"],
            body: [
              ["Firma", company?.officialName || company?.nickName || "-"],
              ["Tarih", training.trainingDate ? new Date(training.trainingDate).toLocaleDateString("tr-TR") : "-"],
              ["Süre", training.durationHours ? `${training.durationHours} saat` : "-"],
              ["Eğitmen", training.trainer || "-"],
            ].map(row => row.map((text, cellIndex) => ({ text, bold: cellIndex === 0, fontSize: 9, color: "#334155", margin: [5, 5, 5, 5] }))),
          },
          layout: { hLineWidth: () => 0.4, vLineWidth: () => 0.4, hLineColor: () => "#cbd5e1", vLineColor: () => "#cbd5e1" },
          margin: [70, 0, 70, 34],
        },
        {
          columns: [
            { width: "*", text: "Eğitmen\n\n\nİmza", fontSize: 9, alignment: "center" },
            { width: "*", text: "İşveren / İşveren Vekili\n\n\nİmza", fontSize: 9, alignment: "center" },
          ],
        },
      ],
      margin: [0, 0, 0, 0],
    };
    return index < participants.length - 1 ? [page, { text: "", pageBreak: "after" as const }] : [page];
  });

  maker.createPdf({
    pageSize: "A4",
    pageMargins: [34, 34, 34, 34],
    content: certificatePages,
    defaultStyle: { font: "Roboto" },
  }).download(`Egitim_Sertifikalari_${training.title.replace(/\s+/g, "_")}.pdf`);
}

async function generatePpeAssignmentPDF(record: PpeRecord, company: Company | undefined, employee: Employee | undefined) {
  if (!employee) return;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const pdfMake = (await import("pdfmake/build/pdfmake")) as any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const pdfFonts = (await import("pdfmake/build/vfs_fonts")) as any;
  const maker = pdfMake.default || pdfMake;
  maker.vfs = (pdfFonts.default || pdfFonts).vfs;

  const content: any[] = [
    { text: "KİŞİSEL KORUYUCU DONANIM ZİMMET FORMU", fontSize: 15, bold: true, color: "#1e293b", alignment: "center", margin: [0, 0, 0, 14] },
    {
      table: {
        widths: [100, "*", 100, "*"],
        body: [
          ["Firma", company?.officialName || company?.nickName || "-", "Tarih", record.issueDate ? new Date(record.issueDate).toLocaleDateString("tr-TR") : "-"],
          ["Personel", `${employee.firstName} ${employee.lastName}`, "T.C. Kimlik No", employee.tcNo || "-"],
          ["Bölüm", employee.department || "-", "Görev / Ünvan", employee.title || "-"],
        ].map(row => row.map((text, index) => ({ text, fontSize: 8, bold: index % 2 === 0, color: "#334155", margin: [4, 5, 4, 5] }))),
      },
      layout: { hLineWidth: () => 0.4, vLineWidth: () => 0.4, hLineColor: () => "#cbd5e1", vLineColor: () => "#cbd5e1" },
      margin: [0, 0, 0, 12],
    },
    {
      table: {
        headerRows: 1,
        widths: ["*", 50, 86, 86, "*"],
        body: [
          ["KKD / Malzeme", "Adet", "Seri No", "Durum", "Not"].map(text => ({ text, bold: true, color: "white", fillColor: "#1e293b", fontSize: 8, margin: [4, 5, 4, 5] })),
          [
            record.equipment,
            String(record.quantity || 1),
            record.serialNo || "-",
            record.status,
            record.notes || "-",
          ].map(text => ({ text, fontSize: 8, color: "#334155", margin: [4, 7, 4, 7] })),
        ],
      },
      layout: { hLineWidth: () => 0.4, vLineWidth: () => 0.4, hLineColor: () => "#cbd5e1", vLineColor: () => "#cbd5e1" },
      margin: [0, 0, 0, 14],
    },
    {
      text: "Yukarıda belirtilen kişisel koruyucu donanımı eksiksiz ve çalışır durumda teslim aldım. Kullanım talimatlarına uygun kullanacağımı, kayıp veya hasar durumunda işverenimi bilgilendireceğimi kabul ederim.",
      fontSize: 9,
      color: "#334155",
      margin: [0, 0, 0, 28],
    },
    {
      columns: [
        { width: "*", text: "Teslim Eden\n\n\nAd Soyad / İmza", fontSize: 9, alignment: "center" },
        { width: "*", text: "Teslim Alan Personel\n\n\nAd Soyad / İmza", fontSize: 9, alignment: "center" },
      ],
    },
  ];

  maker.createPdf({
    pageSize: "A4",
    pageMargins: [28, 28, 28, 28],
    content,
    defaultStyle: { font: "Roboto" },
  }).download(`KKD_Zimmet_${employee.firstName}_${employee.lastName}.pdf`);
}

async function generateEmergencyPlanPDF(plan: EmergencyPlanRecord, company: Company | undefined, employees: Employee[]) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const pdfMake = (await import("pdfmake/build/pdfmake")) as any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const pdfFonts = (await import("pdfmake/build/vfs_fonts")) as any;
  const maker = pdfMake.default || pdfMake;
  maker.vfs = (pdfFonts.default || pdfFonts).vfs;

  const companyEmployees = employees.filter(employee => employee.companyId === plan.companyId);
  const infoRows = [
    ["Firma", company?.officialName || company?.nickName || "-", "Tehlike Sınıfı", company?.dangerClass || "-"],
    ["Plan Başlığı", plan.title, "Plan Tarihi", plan.planDate ? new Date(plan.planDate).toLocaleDateString("tr-TR") : "-"],
    ["Senaryo", plan.scenario, "Tatbikat Tarihi", plan.drillDate ? new Date(plan.drillDate).toLocaleDateString("tr-TR") : "-"],
    ["Toplanma Alanı", plan.assemblyArea || "-", "Sorumlu", plan.responsible || "-"],
  ];

  const content: any[] = [
    { text: "ACİL DURUM PLANI", fontSize: 17, bold: true, color: "#1e293b", alignment: "center", margin: [0, 0, 0, 12] },
    {
      table: {
        widths: [92, "*", 92, "*"],
        body: infoRows.map(row => row.map((text, index) => ({ text, fontSize: 8, bold: index % 2 === 0, color: "#334155", margin: [4, 5, 4, 5] }))),
      },
      layout: { hLineWidth: () => 0.4, vLineWidth: () => 0.4, hLineColor: () => "#cbd5e1", vLineColor: () => "#cbd5e1" },
      margin: [0, 0, 0, 12],
    },
    { text: "Acil Durum Ekibi", fontSize: 11, bold: true, color: "#1e293b", margin: [0, 0, 0, 6] },
    {
      table: {
        widths: ["*"],
        body: [[{ text: plan.emergencyTeam || "-", fontSize: 9, color: "#334155", margin: [5, 8, 5, 8] }]],
      },
      layout: { hLineWidth: () => 0.4, vLineWidth: () => 0.4, hLineColor: () => "#cbd5e1", vLineColor: () => "#cbd5e1" },
      margin: [0, 0, 0, 12],
    },
    { text: "Uygulama Notları", fontSize: 11, bold: true, color: "#1e293b", margin: [0, 0, 0, 6] },
    {
      table: {
        widths: ["*"],
        body: [[{ text: plan.notes || "Acil durumda ilgili ekipler bilgilendirilir, personel toplanma alanına yönlendirilir ve yoklama alınır.", fontSize: 9, color: "#334155", margin: [5, 8, 5, 8] }]],
      },
      layout: { hLineWidth: () => 0.4, vLineWidth: () => 0.4, hLineColor: () => "#cbd5e1", vLineColor: () => "#cbd5e1" },
      margin: [0, 0, 0, 12],
    },
    { text: "Personel Bilgisi", fontSize: 11, bold: true, color: "#1e293b", margin: [0, 0, 0, 6] },
    {
      table: {
        headerRows: 1,
        widths: ["*", "*", 74],
        body: [
          ["Ad Soyad", "Bölüm / Ünvan", "Telefon"].map(text => ({ text, bold: true, color: "white", fillColor: "#1e293b", fontSize: 8, margin: [4, 5, 4, 5] })),
          ...(companyEmployees.length > 0 ? companyEmployees : [{ firstName: "", lastName: "", department: "", title: "", phone: "" } as Employee]).slice(0, 18).map(employee => [
            `${employee.firstName} ${employee.lastName}`.trim() || " ",
            [employee.department, employee.title].filter(Boolean).join(" / ") || " ",
            employee.phone || " ",
          ].map(text => ({ text, fontSize: 7, color: "#334155", margin: [4, 4, 4, 4] }))),
        ],
      },
      layout: { hLineWidth: () => 0.4, vLineWidth: () => 0.4, hLineColor: () => "#cbd5e1", vLineColor: () => "#cbd5e1" },
      margin: [0, 0, 0, 18],
    },
    {
      columns: [
        { width: "*", text: "Hazırlayan\n\n\nAd Soyad / İmza", fontSize: 9, alignment: "center" },
        { width: "*", text: "İşveren / İşveren Vekili\n\n\nAd Soyad / İmza", fontSize: 9, alignment: "center" },
      ],
    },
  ];

  maker.createPdf({
    pageSize: "A4",
    pageMargins: [28, 28, 28, 28],
    content,
    defaultStyle: { font: "Roboto" },
  }).download(`Acil_Durum_Plani_${plan.title.replace(/\s+/g, "_")}.pdf`);
}

async function generateCommitteeMeetingPDF(meeting: CommitteeMeetingRecord, company: Company | undefined, employees: Employee[]) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const pdfMake = (await import("pdfmake/build/pdfmake")) as any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const pdfFonts = (await import("pdfmake/build/vfs_fonts")) as any;
  const maker = pdfMake.default || pdfMake;
  maker.vfs = (pdfFonts.default || pdfFonts).vfs;

  const participants = meeting.participantIds
    .map(id => employees.find(employee => employee.id === id))
    .filter(Boolean) as Employee[];

  const content: any[] = [
    { text: "İSG KURUL TOPLANTISI TUTANAĞI", fontSize: 16, bold: true, color: "#1e293b", alignment: "center", margin: [0, 0, 0, 12] },
    {
      table: {
        widths: [90, "*", 90, "*"],
        body: [
          ["Firma", company?.officialName || company?.nickName || "-", "Toplantı No", meeting.meetingNo || "-"],
          ["Tarih", meeting.meetingDate ? new Date(meeting.meetingDate).toLocaleDateString("tr-TR") : "-", "Yer", meeting.location || "-"],
          ["Başkan", meeting.chairperson || "-", "Durum", meeting.status],
        ].map(row => row.map((text, index) => ({ text, fontSize: 8, bold: index % 2 === 0, color: "#334155", margin: [4, 5, 4, 5] }))),
      },
      layout: { hLineWidth: () => 0.4, vLineWidth: () => 0.4, hLineColor: () => "#cbd5e1", vLineColor: () => "#cbd5e1" },
      margin: [0, 0, 0, 12],
    },
    { text: "Gündem", fontSize: 11, bold: true, color: "#1e293b", margin: [0, 0, 0, 6] },
    {
      table: { widths: ["*"], body: [[{ text: meeting.agenda || "-", fontSize: 9, color: "#334155", margin: [5, 8, 5, 8] }]] },
      layout: { hLineWidth: () => 0.4, vLineWidth: () => 0.4, hLineColor: () => "#cbd5e1", vLineColor: () => "#cbd5e1" },
      margin: [0, 0, 0, 12],
    },
    { text: "Alınan Kararlar", fontSize: 11, bold: true, color: "#1e293b", margin: [0, 0, 0, 6] },
    {
      table: { widths: ["*"], body: [[{ text: meeting.decisions || "-", fontSize: 9, color: "#334155", margin: [5, 8, 5, 8] }]] },
      layout: { hLineWidth: () => 0.4, vLineWidth: () => 0.4, hLineColor: () => "#cbd5e1", vLineColor: () => "#cbd5e1" },
      margin: [0, 0, 0, 12],
    },
    { text: "Katılımcılar", fontSize: 11, bold: true, color: "#1e293b", margin: [0, 0, 0, 6] },
    {
      table: {
        headerRows: 1,
        widths: [28, "*", "*", 110],
        body: [
          ["No", "Ad Soyad", "Görev / Ünvan", "İmza"].map(text => ({ text, bold: true, color: "white", fillColor: "#1e293b", fontSize: 8, margin: [4, 5, 4, 5] })),
          ...(participants.length > 0 ? participants : [{ firstName: "", lastName: "", title: "" } as Employee]).map((employee, index) => [
            String(index + 1),
            `${employee.firstName} ${employee.lastName}`.trim() || " ",
            employee.title || " ",
            " ",
          ].map(text => ({ text, fontSize: 8, color: "#334155", margin: [4, 7, 4, 7] }))),
        ],
      },
      layout: { hLineWidth: () => 0.4, vLineWidth: () => 0.4, hLineColor: () => "#cbd5e1", vLineColor: () => "#cbd5e1" },
      margin: [0, 0, 0, 18],
    },
    { text: meeting.notes || "", fontSize: 8, color: "#64748b", margin: [0, 0, 0, 16] },
    {
      columns: [
        { width: "*", text: "Kurul Başkanı\n\n\nAd Soyad / İmza", fontSize: 9, alignment: "center" },
        { width: "*", text: "İşveren / İşveren Vekili\n\n\nAd Soyad / İmza", fontSize: 9, alignment: "center" },
      ],
    },
  ];

  maker.createPdf({
    pageSize: "A4",
    pageMargins: [28, 28, 28, 28],
    content,
    defaultStyle: { font: "Roboto" },
  }).download(`Kurul_Toplantisi_${meeting.meetingNo || meeting.meetingDate}.pdf`);
}

async function generateAccidentReportPDF(report: AccidentReportRecord, company: Company | undefined, employee: Employee | undefined) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const pdfMake = (await import("pdfmake/build/pdfmake")) as any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const pdfFonts = (await import("pdfmake/build/vfs_fonts")) as any;
  const maker = pdfMake.default || pdfMake;
  maker.vfs = (pdfFonts.default || pdfFonts).vfs;

  const content: any[] = [
    { text: "İŞ KAZASI / RAMAK KALA RAPORU", fontSize: 16, bold: true, color: "#1e293b", alignment: "center", margin: [0, 0, 0, 12] },
    {
      table: {
        widths: [90, "*", 90, "*"],
        body: [
          ["Firma", company?.officialName || company?.nickName || "-", "Tarih", report.accidentDate ? new Date(report.accidentDate).toLocaleDateString("tr-TR") : "-"],
          ["Personel", employee ? `${employee.firstName} ${employee.lastName}` : "-", "T.C. Kimlik No", employee?.tcNo || "-"],
          ["Olay Yeri", report.location || "-", "Şiddet", report.severity],
          ["Olay Türü", report.incidentType || "-", "Durum", report.status],
        ].map(row => row.map((text, index) => ({ text, fontSize: 8, bold: index % 2 === 0, color: "#334155", margin: [4, 5, 4, 5] }))),
      },
      layout: { hLineWidth: () => 0.4, vLineWidth: () => 0.4, hLineColor: () => "#cbd5e1", vLineColor: () => "#cbd5e1" },
      margin: [0, 0, 0, 12],
    },
    ...[
      ["Olay Açıklaması", report.description],
      ["Kök Neden", report.rootCause],
      ["Aksiyon Planı", report.actionPlan],
      ["Sorumlu / Termin", `${report.responsible || "-"} / ${report.dueDate ? new Date(report.dueDate).toLocaleDateString("tr-TR") : "-"}`],
      ["Not", report.notes],
    ].flatMap(([title, text]) => [
      { text: title, fontSize: 11, bold: true, color: "#1e293b", margin: [0, 0, 0, 6] },
      {
        table: { widths: ["*"], body: [[{ text: text || "-", fontSize: 9, color: "#334155", margin: [5, 8, 5, 8] }]] },
        layout: { hLineWidth: () => 0.4, vLineWidth: () => 0.4, hLineColor: () => "#cbd5e1", vLineColor: () => "#cbd5e1" },
        margin: [0, 0, 0, 12],
      },
    ]),
    {
      columns: [
        { width: "*", text: "Raporu Hazırlayan\n\n\nAd Soyad / İmza", fontSize: 9, alignment: "center" },
        { width: "*", text: "İşveren / İşveren Vekili\n\n\nAd Soyad / İmza", fontSize: 9, alignment: "center" },
      ],
    },
  ];

  maker.createPdf({
    pageSize: "A4",
    pageMargins: [28, 28, 28, 28],
    content,
    defaultStyle: { font: "Roboto" },
  }).download(`Is_Kazasi_Raporu_${report.accidentDate || report.id}.pdf`);
}

async function generateCompanyVisitPDF(visit: CompanyVisitRecord, company: Company | undefined) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const pdfMake = (await import("pdfmake/build/pdfmake")) as any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const pdfFonts = (await import("pdfmake/build/vfs_fonts")) as any;
  const maker = pdfMake.default || pdfMake;
  maker.vfs = (pdfFonts.default || pdfFonts).vfs;

  const content: any[] = [
    { text: "FİRMA ZİYARET RAPORU", fontSize: 16, bold: true, color: "#1e293b", alignment: "center", margin: [0, 0, 0, 12] },
    {
      table: {
        widths: [90, "*", 90, "*"],
        body: [
          ["Firma", company?.officialName || company?.nickName || "-", "Ziyaret Tarihi", visit.visitDate ? new Date(visit.visitDate).toLocaleDateString("tr-TR") : "-"],
          ["Ziyaret Amacı", visit.purpose, "Durum", visit.status],
          ["Ziyaret Eden", visit.visitor || "-", "Görüşülen Kişi", visit.contactedPerson || "-"],
          ["Sonraki Ziyaret", visit.nextVisitDate ? new Date(visit.nextVisitDate).toLocaleDateString("tr-TR") : "-", "SGK Sicil", company?.sgkSicil || "-"],
        ].map(row => row.map((text, index) => ({ text, fontSize: 8, bold: index % 2 === 0, color: "#334155", margin: [4, 5, 4, 5] }))),
      },
      layout: { hLineWidth: () => 0.4, vLineWidth: () => 0.4, hLineColor: () => "#cbd5e1", vLineColor: () => "#cbd5e1" },
      margin: [0, 0, 0, 12],
    },
    ...[
      ["Tespitler", visit.findings],
      ["Aksiyonlar", visit.actions],
      ["Notlar", visit.notes],
    ].flatMap(([title, text]) => [
      { text: title, fontSize: 11, bold: true, color: "#1e293b", margin: [0, 0, 0, 6] },
      {
        table: { widths: ["*"], body: [[{ text: text || "-", fontSize: 9, color: "#334155", margin: [5, 8, 5, 8] }]] },
        layout: { hLineWidth: () => 0.4, vLineWidth: () => 0.4, hLineColor: () => "#cbd5e1", vLineColor: () => "#cbd5e1" },
        margin: [0, 0, 0, 12],
      },
    ]),
    {
      columns: [
        { width: "*", text: "Ziyareti Yapan\n\n\nAd Soyad / İmza", fontSize: 9, alignment: "center" },
        { width: "*", text: "Firma Yetkilisi\n\n\nAd Soyad / İmza", fontSize: 9, alignment: "center" },
      ],
    },
  ];

  maker.createPdf({
    pageSize: "A4",
    pageMargins: [28, 28, 28, 28],
    content,
    defaultStyle: { font: "Roboto" },
  }).download(`Firma_Ziyaret_Raporu_${visit.visitDate || visit.id}.pdf`);
}


// ── Styles ────────────────────────────────────────────────────────────────────
// ── Mobil algılama yardımcısı (styles dışında kullanılır) ──
const isMobileScreen = () => typeof window !== "undefined" && window.innerWidth <= 768;

const styles: Record<string, React.CSSProperties> = {
  app: { minHeight: "100vh", background: "var(--isg-bg)", color: "var(--isg-text)", fontFamily: "'IBM Plex Sans', -apple-system, sans-serif", overflowX: "hidden" as const },
  header: { backgroundColor: "var(--isg-header)", borderBottom: "1px solid var(--isg-border)", padding: "0 28px", display: "flex", alignItems: "center", justifyContent: "space-between", height: 58, gap: 10, backdropFilter: "blur(22px)", WebkitBackdropFilter: "blur(22px)", position: "sticky" as const, top: 0, zIndex: 50, boxShadow: "0 12px 34px rgba(0,0,0,0.22)" },
  nav: { display: "flex", gap: 6, padding: "0 28px", borderBottom: "1px solid var(--isg-border)", backgroundColor: "var(--isg-nav)", overflowX: "auto" as const, WebkitOverflowScrolling: "touch" as const, msOverflowStyle: "none" as const, scrollbarWidth: "none" as const, backdropFilter: "blur(22px)", WebkitBackdropFilter: "blur(22px)", position: "sticky" as const, top: 58, zIndex: 40, height: 50, alignItems: "center" },
  shell: { display: "flex", alignItems: "stretch", minHeight: "calc(100vh - 58px)" },
  sidebar: { flexShrink: 0, borderRight: "1px solid var(--isg-border)", backgroundColor: "var(--isg-nav)", padding: "18px 14px", overflowY: "auto" as const, boxSizing: "border-box" as const, backdropFilter: "blur(22px)", WebkitBackdropFilter: "blur(22px)", zIndex: 35 },
  sidebarSearch: { height: 34, border: "1px solid var(--isg-border)", borderRadius: 8, backgroundColor: "var(--isg-input-bg)", display: "flex", alignItems: "center", gap: 8, padding: "0 10px", marginBottom: 18 },
  sidebarGroupTitle: { color: "var(--isg-text-subtle)", fontSize: 10, fontWeight: 800, textTransform: "uppercase" as const, letterSpacing: "0.1em", margin: "0 0 7px 4px" },
  sidebarItem: { minHeight: 36, width: "100%", border: "1px solid transparent", borderRadius: 8, backgroundColor: "transparent", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8, padding: "0 10px", fontSize: 13, fontWeight: 700, textAlign: "left" as const, transition: "color 0.15s, border-color 0.15s, background-color 0.15s, opacity 0.15s" },
  soonBadge: { fontSize: 10, fontWeight: 800, color: "#a78bfa", border: "1px solid rgba(167,139,250,0.24)", backgroundColor: "rgba(167,139,250,0.12)", borderRadius: 6, padding: "2px 6px", whiteSpace: "nowrap" as const },
  content: { padding: "30px 28px", width: "100%", boxSizing: "border-box" as const, margin: "0 auto" },
  card: { backgroundColor: "var(--isg-card)", border: "1px solid var(--isg-border)", borderRadius: 8, padding: "22px", marginBottom: 16, transition: "border-color 0.2s, background-color 0.2s, box-shadow 0.2s", boxShadow: "var(--isg-shadow)" },
  sectionTitle: { fontSize: 10, fontWeight: 700, color: "var(--isg-text-subtle)", textTransform: "uppercase" as const, letterSpacing: "0.12em", marginBottom: 16 },
  input: { width: "100%", backgroundColor: "var(--isg-input-bg)", border: "1px solid var(--isg-border)", borderRadius: 8, color: "var(--isg-text)", padding: "10px 13px", fontSize: 14, outline: "none", boxSizing: "border-box" as const, transition: "border-color 0.15s, box-shadow 0.15s, background-color 0.15s" },
  select: { width: "100%", backgroundColor: "var(--isg-input-bg)", border: "1px solid var(--isg-border)", borderRadius: 8, color: "var(--isg-text)", padding: "10px 13px", fontSize: 14, outline: "none", boxSizing: "border-box" as const },
  label: { fontSize: 11, fontWeight: 600, color: "var(--isg-text-muted)", marginBottom: 7, display: "block", letterSpacing: "0.02em" },
  formGrid: { display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(min(210px, 100%), 1fr))", gap: 16 },
  btnPrimary: { backgroundColor: "var(--isg-accent)", color: "#06110f", border: "1px solid color-mix(in srgb, var(--isg-accent) 72%, white)", borderRadius: 8, padding: "10px 18px", fontSize: 13, fontWeight: 700, cursor: "pointer", letterSpacing: 0, transition: "opacity 0.15s, transform 0.15s, box-shadow 0.15s", boxShadow: "0 10px 24px var(--isg-accent-glow)" },
  btnDanger: { backgroundColor: "rgba(255,107,107,0.12)", color: "var(--isg-danger)", border: "1px solid rgba(255,107,107,0.26)", borderRadius: 8, padding: "7px 13px", fontSize: 12, fontWeight: 600, cursor: "pointer", transition: "all 0.15s" },
  btnSecondary: { backgroundColor: "var(--isg-btn-secondary)", color: "var(--isg-text-muted)", border: "1px solid var(--isg-border)", borderRadius: 8, padding: "9px 15px", fontSize: 13, cursor: "pointer", transition: "all 0.15s" },
  btnSuccess: { backgroundColor: "rgba(76,201,166,0.14)", color: "var(--isg-accent)", border: "1px solid rgba(76,201,166,0.26)", borderRadius: 8, padding: "10px 18px", fontSize: 13, fontWeight: 700, cursor: "pointer", transition: "all 0.15s" },
  badge: { display: "inline-block", padding: "3px 9px", borderRadius: 6, fontSize: 11, fontWeight: 700, letterSpacing: 0 },
  table: { width: "100%", borderCollapse: "collapse" as const, fontSize: 13 },
  th: { textAlign: "left" as const, padding: "11px 14px", borderBottom: "1px solid var(--isg-border)", color: "var(--isg-text-subtle)", fontWeight: 700, fontSize: 10, textTransform: "uppercase" as const, letterSpacing: "0.08em", whiteSpace: "nowrap" as const },
  td: { padding: "13px 14px", borderBottom: "1px solid rgba(255,255,255,0.055)", verticalAlign: "top" as const, color: "var(--isg-text)", transition: "background 0.1s" },
  searchBar: { display: "flex", gap: 10, marginBottom: 18, alignItems: "center", flexWrap: "wrap" as const },
  statGrid: { display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(min(160px, 45%), 1fr))", gap: 14, marginBottom: 30 },
  statCard: { backgroundColor: "var(--isg-card)", border: "1px solid var(--isg-border)", borderRadius: 8, padding: "18px 16px", transition: "all 0.2s ease", cursor: "default", position: "relative" as const, overflow: "hidden" as const, boxShadow: "var(--isg-shadow)" },
  statValue: { fontSize: 30, fontWeight: 800, lineHeight: 1, marginBottom: 8, letterSpacing: 0 },
  statLabel: { fontSize: 11, fontWeight: 500, color: "var(--isg-text-muted)", letterSpacing: 0 },
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
  const { user: userProfile, isAdmin, isHumanResources, loading: roleLoading } = useUserRole();
  const { t } = useLanguage();
  const [mounted, setMounted] = useState(false);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
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
  const [annualPlans, setAnnualPlans] = useState<AnnualPlanRecord[]>([]);
  const [trainings, setTrainings] = useState<TrainingRecord[]>([]);
  const [ppeRecords, setPpeRecords] = useState<PpeRecord[]>([]);
  const [emergencyPlans, setEmergencyPlans] = useState<EmergencyPlanRecord[]>([]);
  const [committeeMeetings, setCommitteeMeetings] = useState<CommitteeMeetingRecord[]>([]);
  const [accidentReports, setAccidentReports] = useState<AccidentReportRecord[]>([]);
  const [companyVisits, setCompanyVisits] = useState<CompanyVisitRecord[]>([]);

  const [activeTab, setActiveTab] = useState("firmalar");
  const [search, setSearch] = useState("");
  const [selectedCompanyId, setSelectedCompanyId] = useState("all");
  const [selectedEmployeeId, setSelectedEmployeeId] = useState<string | null>(null);
  const [editingDofId, setEditingDofId] = useState<string | null>(null);

  const [newCompany, setNewCompany] = useState({ nickName: "", officialName: "", sgkSicil: "", naceCode: "", dangerClass: "Az Tehlikeli" as DangerClass, employeeCount: "", contractEnd: "", serviceType: "İş Güvenliği" as ServiceType, contactEmail: "" });
  const [newEmployee, setNewEmployee] = useState<NewEmployeeForm>(emptyNewEmployee);
  const [newDocument, setNewDocument] = useState({ companyId: "", employeeId: "", type: "Risk Değerlendirme Raporu", issueDate: "", expiryDate: "" });
  const [newObserver, setNewObserver] = useState({ fullName: "", title: "", certificateNo: "", phone: "" });
  const [newDof, setNewDof] = useState({ companyId: "", observerId: "", title: "", description: "", lawReference: "", priority: "Orta" as "Düşük" | "Orta" | "Yüksek", responsible: "", dueDate: "", status: "Açık" as "Açık" | "Bildirildi" | "Önlem Alındı" | "Çözüldü" | "Riske Aktarıldı", location: "", beforePhoto: "", afterPhoto: "", affectedPersons: "" });
  const [newRisk, setNewRisk] = useState({
    companyId: "", section: "", hazard: "", risk: "", currentMeasure: "", actionToTake: "",
    probability: "1", severity: "1", residualProbability: "1", residualSeverity: "1",
    responsible: "", dueDate: "", status: "Açık" as "Açık" | "Kontrol Altında" | "Kapandı",
    affectedPersons: "", lawReference: "", controlDate: "",
  });
  const [newAnnualPlan, setNewAnnualPlan] = useState({
    companyId: "",
    year: String(new Date().getFullYear()),
    type: "Eğitim" as AnnualPlanType,
    title: "",
    plannedDate: "",
    responsible: "",
    status: "Planlandı" as AnnualPlanStatus,
    notes: "",
  });
  const [newTraining, setNewTraining] = useState({
    companyId: "",
    title: "",
    type: "Temel İSG Eğitimi" as TrainingType,
    trainingDate: "",
    durationHours: "",
    location: "",
    trainer: "",
    participantIds: [] as string[],
    status: "Planlandı" as TrainingStatus,
    notes: "",
  });
  const [newPpe, setNewPpe] = useState({
    companyId: "",
    employeeId: "",
    equipment: "Baret",
    quantity: "1",
    issueDate: "",
    returnDate: "",
    status: "Teslim Edildi" as PpeStatus,
    serialNo: "",
    notes: "",
  });
  const [newEmergencyPlan, setNewEmergencyPlan] = useState({
    companyId: "",
    title: "Acil Durum Planı",
    scenario: "Yangın",
    assemblyArea: "",
    emergencyTeam: "",
    responsible: "",
    planDate: "",
    drillDate: "",
    status: "Taslak" as EmergencyPlanStatus,
    notes: "",
  });
  const [newCommitteeMeeting, setNewCommitteeMeeting] = useState({
    companyId: "",
    meetingNo: "",
    meetingDate: "",
    location: "",
    chairperson: "",
    agenda: "",
    decisions: "",
    participantIds: [] as string[],
    status: "Planlandı" as CommitteeMeetingStatus,
    notes: "",
  });
  const [newAccidentReport, setNewAccidentReport] = useState({
    companyId: "",
    employeeId: "",
    accidentDate: "",
    location: "",
    severity: "Hafif" as AccidentSeverity,
    incidentType: "İş Kazası",
    description: "",
    rootCause: "",
    actionPlan: "",
    responsible: "",
    dueDate: "",
    status: "Açık" as AccidentReportStatus,
    notes: "",
  });
  const [newCompanyVisit, setNewCompanyVisit] = useState({
    companyId: "",
    visitDate: "",
    purpose: "Rutin Ziyaret" as CompanyVisitPurpose,
    visitor: "",
    contactedPerson: "",
    findings: "",
    actions: "",
    nextVisitDate: "",
    status: "Planlandı" as CompanyVisitStatus,
    notes: "",
  });

  const [signers, setSigners] = useState<Signer[]>([]);
  const [emailSettings, setEmailSettings] = useState<EmailSettings>({ enabled: true, toEmail: "", ccEmail: "", subject: "[İSG] Yeni DÖF Bildirimi: {dofTitle}", message: "" });
  const [dofAdding, setDofAdding] = useState(false);
  const [dofAddStatus, setDofAddStatus] = useState<string | null>(null);
  const [employeeAddStatus, setEmployeeAddStatus] = useState<string | null>(null);

  async function loadCompanyScopedRecords<T extends { id: string }>(collectionName: string): Promise<T[]> {
    if (!userProfile) return [];
    const activeRole = userProfile.activeRole || userProfile.role;
    if (activeRole === "admin") {
      const snap = await getDocs(collection(db, collectionName));
      return snap.docs.map(d => ({ id: d.id, ...d.data() } as T));
    }

    const allowedCompanyIds = userProfile.companyIds || [];
    if (allowedCompanyIds.length === 0) return [];

    const chunks: string[][] = [];
    for (let i = 0; i < allowedCompanyIds.length; i += 30) {
      chunks.push(allowedCompanyIds.slice(i, i + 30));
    }

    const snaps = await Promise.all(chunks.map(ids => {
      const field = collectionName === "companies" ? documentId() : "companyId";
      return getDocs(query(collection(db, collectionName), where(field, "in", ids)));
    }));

    return snaps.flatMap(snap => snap.docs.map(d => ({ id: d.id, ...d.data() } as T)));
  }

  async function loadAll() {
    if (!userProfile) return;
    setLoading(true);
    setLoadError(null);
    try {
      const [compResult, empResult, docResult, obsResult, dofResult, riskResult, signerResult, annualPlanResult, trainingResult, ppeResult, emergencyPlanResult, committeeMeetingResult, accidentReportResult, companyVisitResult] = await Promise.allSettled([
        loadCompanyScopedRecords<Company>("companies"),
        loadCompanyScopedRecords<Employee>("employees"),
        loadCompanyScopedRecords<DocumentRecord>("documents"),
        loadCompanyScopedRecords<Observer & { companyId?: string }>("observers"),
        loadCompanyScopedRecords<DofRecord>("dofs"),
        loadCompanyScopedRecords<RiskRecord>("risks"),
        loadCompanyScopedRecords<Signer>("signers"),
        loadCompanyScopedRecords<AnnualPlanRecord>("annualPlans"),
        loadCompanyScopedRecords<TrainingRecord>("trainings"),
        loadCompanyScopedRecords<PpeRecord>("ppeRecords"),
        loadCompanyScopedRecords<EmergencyPlanRecord>("emergencyPlans"),
        loadCompanyScopedRecords<CommitteeMeetingRecord>("committeeMeetings"),
        loadCompanyScopedRecords<AccidentReportRecord>("accidentReports"),
        loadCompanyScopedRecords<CompanyVisitRecord>("companyVisits"),
      ]);
      const loadResults: Array<{ label: string; result: PromiseSettledResult<unknown> }> = [
        { label: "Firmalar", result: compResult },
        { label: "Personel", result: empResult },
        { label: "Belgeler", result: docResult },
        { label: "Gözlemciler", result: obsResult },
        { label: "DÖF", result: dofResult },
        { label: "Risk", result: riskResult },
        { label: "İmzacılar", result: signerResult },
        { label: "Yıllık Planlar", result: annualPlanResult },
        { label: "Eğitimler", result: trainingResult },
        { label: "KKD", result: ppeResult },
        { label: "Acil Durum Planları", result: emergencyPlanResult },
        { label: "Kurul Toplantıları", result: committeeMeetingResult },
        { label: "İş Kazası Raporları", result: accidentReportResult },
        { label: "Firma Ziyaretleri", result: companyVisitResult },
      ];
      const failedLoads = loadResults.filter(({ result }) => result.status === "rejected").map(({ label }) => label);

      if (failedLoads.length > 0) {
        setLoadError(`${failedLoads.join(", ")} verileri yüklenemedi. Firebase Rules içinde bu role okuma izni verilmeli.`);
      }

      if (compResult.status === "fulfilled") setCompanies(compResult.value);
      if (empResult.status === "fulfilled") setEmployees(empResult.value);
      if (docResult.status === "fulfilled") setDocuments(docResult.value);
      if (obsResult.status === "fulfilled") setObservers(obsResult.value);
      if (dofResult.status === "fulfilled") setDofs(dofResult.value);
      if (riskResult.status === "fulfilled") setRisks(riskResult.value);
      if (signerResult.status === "fulfilled") setSigners(signerResult.value);
      if (annualPlanResult.status === "fulfilled") setAnnualPlans(annualPlanResult.value);
      if (trainingResult.status === "fulfilled") setTrainings(trainingResult.value);
      if (ppeResult.status === "fulfilled") setPpeRecords(ppeResult.value);
      if (emergencyPlanResult.status === "fulfilled") setEmergencyPlans(emergencyPlanResult.value);
      if (committeeMeetingResult.status === "fulfilled") setCommitteeMeetings(committeeMeetingResult.value);
      if (accidentReportResult.status === "fulfilled") setAccidentReports(accidentReportResult.value);
      if (companyVisitResult.status === "fulfilled") setCompanyVisits(companyVisitResult.value);

      // Email ayarlarını yükle
      const emailDoc = await getDoc(doc(db, "settings", "emailNotifications"));
      if (emailDoc.exists()) {
        const ed = emailDoc.data() as EmailSettings;
        setEmailSettings(ed);
      }

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
      }
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (userProfile) loadAll();
  }, [userProfile]);

  useEffect(() => {
    if (isHumanResources && !isAdmin && activeTab !== "personel") {
      setActiveTab("personel");
    }
  }, [activeTab, isAdmin, isHumanResources]);

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
  const filteredEmployees = useMemo(() => employees.filter(e => {
    const company = companies.find(c => c.id === e.companyId);
    const matchesCompany = selectedCompanyId === "all" || e.companyId === selectedCompanyId;
    return matchesCompany && `${e.firstName} ${e.lastName} ${e.tcNo} ${e.phone || ""} ${e.email || ""} ${e.department || ""} ${e.diplomaInfo || ""} ${e.educationLevel || ""} ${e.address || ""} ${e.title} ${e.profession || ""} ${company?.nickName || ""}`.toLowerCase().includes(search.toLowerCase());
  }), [employees, companies, selectedCompanyId, search]);
  const filteredDocuments = useMemo(() => documents.filter(d => { const company = companies.find(c => c.id === d.companyId); const employee = employees.find(e => e.id === d.employeeId); const matchesCompany = selectedCompanyId === "all" || d.companyId === selectedCompanyId; return matchesCompany && `${d.type} ${company?.nickName || ""} ${employee?.firstName || ""} ${employee?.lastName || ""}`.toLowerCase().includes(search.toLowerCase()); }), [documents, companies, employees, selectedCompanyId, search]);
  const filteredDofs = useMemo(() => dofs.filter(d => { const company = companies.find(c => c.id === d.companyId); const matchesCompany = selectedCompanyId === "all" || d.companyId === selectedCompanyId; return matchesCompany && `${d.title} ${d.description} ${d.location} ${company?.nickName || ""}`.toLowerCase().includes(search.toLowerCase()); }), [dofs, companies, selectedCompanyId, search]);
  const filteredRisks = useMemo(() => risks.filter(r => { const company = companies.find(c => c.id === r.companyId); const matchesCompany = selectedCompanyId === "all" || r.companyId === selectedCompanyId; return matchesCompany && `${r.section} ${r.hazard} ${r.risk} ${r.actionToTake} ${company?.nickName || ""}`.toLowerCase().includes(search.toLowerCase()); }), [risks, companies, selectedCompanyId, search]);
  const filteredAnnualPlans = useMemo(() => annualPlans.filter(plan => {
    const company = companies.find(c => c.id === plan.companyId);
    const matchesCompany = selectedCompanyId === "all" || plan.companyId === selectedCompanyId;
    return matchesCompany && `${plan.year} ${plan.type} ${plan.title} ${plan.responsible} ${plan.status} ${plan.notes} ${company?.nickName || ""}`.toLowerCase().includes(search.toLowerCase());
  }), [annualPlans, companies, selectedCompanyId, search]);
  const filteredTrainings = useMemo(() => trainings.filter(training => {
    const company = companies.find(c => c.id === training.companyId);
    const participantNames = training.participantIds
      .map(id => employees.find(e => e.id === id))
      .filter(Boolean)
      .map(employee => `${employee!.firstName} ${employee!.lastName}`)
      .join(" ");
    const matchesCompany = selectedCompanyId === "all" || training.companyId === selectedCompanyId;
    return matchesCompany && `${training.title} ${training.type} ${training.trainer} ${training.status} ${training.notes} ${participantNames} ${company?.nickName || ""}`.toLowerCase().includes(search.toLowerCase());
  }), [trainings, companies, employees, selectedCompanyId, search]);
  const filteredPpeRecords = useMemo(() => ppeRecords.filter(record => {
    const company = companies.find(c => c.id === record.companyId);
    const employee = employees.find(e => e.id === record.employeeId);
    const matchesCompany = selectedCompanyId === "all" || record.companyId === selectedCompanyId;
    return matchesCompany && `${record.equipment} ${record.status} ${record.serialNo || ""} ${record.notes} ${company?.nickName || ""} ${employee?.firstName || ""} ${employee?.lastName || ""} ${employee?.tcNo || ""}`.toLowerCase().includes(search.toLowerCase());
  }), [ppeRecords, companies, employees, selectedCompanyId, search]);
  const filteredEmergencyPlans = useMemo(() => emergencyPlans.filter(plan => {
    const company = companies.find(c => c.id === plan.companyId);
    const matchesCompany = selectedCompanyId === "all" || plan.companyId === selectedCompanyId;
    return matchesCompany && `${plan.title} ${plan.scenario} ${plan.assemblyArea} ${plan.emergencyTeam} ${plan.responsible} ${plan.status} ${plan.notes} ${company?.nickName || ""}`.toLowerCase().includes(search.toLowerCase());
  }), [emergencyPlans, companies, selectedCompanyId, search]);
  const filteredCommitteeMeetings = useMemo(() => committeeMeetings.filter(meeting => {
    const company = companies.find(c => c.id === meeting.companyId);
    const participantNames = meeting.participantIds
      .map(id => employees.find(e => e.id === id))
      .filter(Boolean)
      .map(employee => `${employee!.firstName} ${employee!.lastName}`)
      .join(" ");
    const matchesCompany = selectedCompanyId === "all" || meeting.companyId === selectedCompanyId;
    return matchesCompany && `${meeting.meetingNo} ${meeting.location} ${meeting.chairperson} ${meeting.agenda} ${meeting.decisions} ${meeting.status} ${meeting.notes} ${participantNames} ${company?.nickName || ""}`.toLowerCase().includes(search.toLowerCase());
  }), [committeeMeetings, companies, employees, selectedCompanyId, search]);
  const filteredAccidentReports = useMemo(() => accidentReports.filter(report => {
    const company = companies.find(c => c.id === report.companyId);
    const employee = employees.find(e => e.id === report.employeeId);
    const matchesCompany = selectedCompanyId === "all" || report.companyId === selectedCompanyId;
    return matchesCompany && `${report.incidentType} ${report.location} ${report.severity} ${report.description} ${report.rootCause} ${report.actionPlan} ${report.responsible} ${report.status} ${report.notes} ${company?.nickName || ""} ${employee?.firstName || ""} ${employee?.lastName || ""}`.toLowerCase().includes(search.toLowerCase());
  }), [accidentReports, companies, employees, selectedCompanyId, search]);
  const filteredCompanyVisits = useMemo(() => companyVisits.filter(visit => {
    const company = companies.find(c => c.id === visit.companyId);
    const matchesCompany = selectedCompanyId === "all" || visit.companyId === selectedCompanyId;
    return matchesCompany && `${visit.purpose} ${visit.visitor} ${visit.contactedPerson} ${visit.findings} ${visit.actions} ${visit.status} ${visit.notes} ${company?.nickName || ""} ${company?.officialName || ""}`.toLowerCase().includes(search.toLowerCase());
  }), [companyVisits, companies, selectedCompanyId, search]);
  const archiveItems = useMemo<ArchiveItem[]>(() => {
    const employeeName = (employeeId?: string | null) => {
      const employee = employees.find(e => e.id === employeeId);
      return employee ? `${employee.firstName} ${employee.lastName}` : "Firma";
    };

    return [
      ...documents.map(item => ({
        id: item.id,
        companyId: item.companyId,
        type: "Belge",
        title: item.type,
        owner: employeeName(item.employeeId),
        date: item.issueDate || item.expiryDate || "",
        status: item.expiryDate ? getDateStatus(item.expiryDate) : "Arşivde",
        sourceTab: "belgeler",
      })),
      ...annualPlans.map(item => ({
        id: item.id,
        companyId: item.companyId,
        type: "Yıllık Plan",
        title: `${item.year} - ${item.title || item.type}`,
        owner: item.responsible || "Firma",
        date: item.plannedDate,
        status: item.status,
        sourceTab: "yillik-planlar",
      })),
      ...trainings.map(item => ({
        id: item.id,
        companyId: item.companyId,
        type: "Eğitim",
        title: item.title || item.type,
        owner: item.trainer || "Eğitmen girilmedi",
        date: item.trainingDate,
        status: item.status,
        sourceTab: "egitimler",
      })),
      ...ppeRecords.map(item => ({
        id: item.id,
        companyId: item.companyId,
        type: "KKD",
        title: item.equipment,
        owner: employeeName(item.employeeId),
        date: item.issueDate,
        status: item.status,
        sourceTab: "kkd-formu",
      })),
      ...emergencyPlans.map(item => ({
        id: item.id,
        companyId: item.companyId,
        type: "Acil Durum",
        title: item.title,
        owner: item.responsible || "Firma",
        date: item.planDate,
        status: item.status,
        sourceTab: "acil-durum-plani",
      })),
      ...committeeMeetings.map(item => ({
        id: item.id,
        companyId: item.companyId,
        type: "Kurul",
        title: item.meetingNo || "Kurul Toplantısı",
        owner: item.chairperson || "Kurul",
        date: item.meetingDate,
        status: item.status,
        sourceTab: "kurul-toplantisi",
      })),
      ...accidentReports.map(item => ({
        id: item.id,
        companyId: item.companyId,
        type: "İş Kazası",
        title: item.incidentType,
        owner: employeeName(item.employeeId),
        date: item.accidentDate,
        status: item.status,
        sourceTab: "is-kazasi-raporu",
      })),
      ...companyVisits.map(item => ({
        id: item.id,
        companyId: item.companyId,
        type: "Firma Ziyareti",
        title: item.purpose,
        owner: item.visitor || "Ziyaretçi girilmedi",
        date: item.visitDate,
        status: item.status,
        sourceTab: "firma-ziyaretleri",
      })),
      ...dofs.map(item => ({
        id: item.id,
        companyId: item.companyId,
        type: "DÖF",
        title: item.title,
        owner: item.responsible || "Sorumlu girilmedi",
        date: item.dueDate,
        status: item.status,
        sourceTab: "dof",
      })),
      ...risks.map(item => ({
        id: item.id,
        companyId: item.companyId,
        type: "Risk",
        title: item.hazard,
        owner: item.responsible || "Sorumlu girilmedi",
        date: item.dueDate || item.controlDate || "",
        status: item.status,
        sourceTab: "risk",
      })),
    ].sort((a, b) => (b.date || "").localeCompare(a.date || ""));
  }, [documents, annualPlans, trainings, ppeRecords, emergencyPlans, committeeMeetings, accidentReports, companyVisits, dofs, risks, employees]);
  const filteredArchiveItems = useMemo(() => archiveItems.filter(item => {
    const company = companies.find(c => c.id === item.companyId);
    const matchesCompany = selectedCompanyId === "all" || item.companyId === selectedCompanyId;
    return matchesCompany && `${item.type} ${item.title} ${item.owner} ${item.status} ${company?.nickName || ""} ${company?.officialName || ""}`.toLowerCase().includes(search.toLowerCase());
  }), [archiveItems, companies, selectedCompanyId, search]);

  async function addCompany() {
    if (!isAdmin) return;
    if (!newCompany.nickName || !newCompany.sgkSicil) return;
    const naceCode = newCompany.naceCode || extractNaceFromSgk(newCompany.sgkSicil);
    const officialName = newCompany.officialName || officialNameFromSgk(newCompany.sgkSicil) || newCompany.nickName;
    const data = { nickName: newCompany.nickName, officialName, sgkSicil: newCompany.sgkSicil, naceCode, dangerClass: dangerFromNace(naceCode), employeeCount: parseInt(newCompany.employeeCount) || 0, contractEnd: newCompany.contractEnd, serviceType: newCompany.serviceType, contactEmail: newCompany.contactEmail };
    const ref = await addDoc(collection(db, "companies"), withCreatedBy(data, userProfile!.uid, userProfile!.activeRole || userProfile!.role));
    setCompanies(prev => [...prev, { id: ref.id, ...data }]);
    setNewCompany({ nickName: "", officialName: "", sgkSicil: "", naceCode: "", dangerClass: "Az Tehlikeli", employeeCount: "", contractEnd: "", serviceType: "İş Güvenliği", contactEmail: "" });
  }

  async function deleteCompany(id: string) {
    if (!isAdmin) return;
    if (!confirm("Bu firmayı silmek istediğinizden emin misiniz?")) return;
    // Firestore'dan cascade sil
    const relatedEmployees = employees.filter(e => e.companyId === id);
    const relatedDocs = documents.filter(d => d.companyId === id);
    const relatedDofs = dofs.filter(d => d.companyId === id);
    const relatedRisks = risks.filter(r => r.companyId === id);
    const relatedSigners = signers.filter(s => s.companyId === id);
    const relatedCompanyVisits = companyVisits.filter(v => v.companyId === id);
    await Promise.all([
      deleteDoc(doc(db, "companies", id)),
      ...relatedEmployees.map(e => deleteDoc(doc(db, "employees", e.id))),
      ...relatedDocs.map(d => deleteDoc(doc(db, "documents", d.id))),
      ...relatedDofs.map(d => deleteDoc(doc(db, "dofs", d.id))),
      ...relatedRisks.map(r => deleteDoc(doc(db, "risks", r.id))),
      ...relatedSigners.map(s => deleteDoc(doc(db, "signers", s.id))),
      ...relatedCompanyVisits.map(v => deleteDoc(doc(db, "companyVisits", v.id))),
    ]);
    setCompanies(prev => prev.filter(c => c.id !== id));
    setEmployees(prev => prev.filter(e => e.companyId !== id));
    setDocuments(prev => prev.filter(d => d.companyId !== id));
    setDofs(prev => prev.filter(d => d.companyId !== id));
    setRisks(prev => prev.filter(r => r.companyId !== id));
    setSigners(prev => prev.filter(s => s.companyId !== id));
    setCompanyVisits(prev => prev.filter(v => v.companyId !== id));
  }

  async function addEmployee() {
    setEmployeeAddStatus(null);
    if (!newEmployee.companyId) {
      setEmployeeAddStatus("⚠️ Önce firma seçmelisiniz. Firma listesi boşsa Admin panelinden bu kullanıcıya firma yetkisi verilmelidir.");
      return;
    }
    if (!newEmployee.firstName.trim()) {
      setEmployeeAddStatus("⚠️ Personel adı zorunlu.");
      return;
    }

    try {
      const checklist = { ...emptyChecklist };
      const onboarding = createOnboardingFromChecklist(checklist);
      const data = {
        companyId: newEmployee.companyId,
        firstName: newEmployee.firstName,
        lastName: newEmployee.lastName,
        tcNo: newEmployee.tcNo,
        photo: newEmployee.photo,
        birthPlace: newEmployee.birthPlace,
        birthDate: newEmployee.birthDate,
        gender: newEmployee.gender,
        nationality: newEmployee.nationality === "Diğer" ? newEmployee.nationalityOther : newEmployee.nationality,
        serialNo: newEmployee.serialNo,
        fatherName: newEmployee.fatherName,
        motherName: newEmployee.motherName,
        phone: newEmployee.phone,
        email: newEmployee.email,
        department: newEmployee.department,
        diplomaInfo: newEmployee.diplomaInfo,
        educationLevel: newEmployee.educationLevel,
        maritalStatus: newEmployee.maritalStatus,
        childrenCount: newEmployee.childrenCount,
        address: newEmployee.address,
        title: newEmployee.title,
        jobDescription: newEmployee.jobDescription,
        profession: newEmployee.profession,
        hireDate: newEmployee.hireDate,
        sgkNo: newEmployee.sgkNo,
        iban: newEmployee.iban,
        emergencyContactName: newEmployee.emergencyContactName,
        emergencyContactPhone: newEmployee.emergencyContactPhone,
        bloodType: newEmployee.bloodType,
        chronicDisease: newEmployee.chronicDisease,
        tetanusVaccine: newEmployee.tetanusVaccine,
        hepatitisVaccine: newEmployee.hepatitisVaccine,
        allergies: newEmployee.allergies,
        notes: newEmployee.notes,
        isActive: true,
        trainingComplete: false,
        checklist,
        onboarding,
      };
      const ref = await addDoc(collection(db, "employees"), withCreatedBy(data, userProfile!.uid, userProfile!.activeRole || userProfile!.role));
      setEmployees(prev => [...prev, { id: ref.id, ...data }]);
      setNewEmployee(emptyNewEmployee);
      setEmployeeAddStatus("✅ Personel kaydı oluşturuldu. Doktor ve İSG uzmanı için onboarding görevleri açıldı.");
      if (emailSettings.enabled) {
        await fetch("/api/send-onboarding-notification", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ employeeId: ref.id, type: "created" }),
        }).catch((error) => console.error("Onboarding bildirimi gönderilemedi", error));
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : "Bilinmeyen hata";
      setEmployeeAddStatus(`❌ Personel eklenemedi: ${message}`);
    }
  }

  async function deleteEmployee(id: string) {
    if (!confirm("Bu personeli silmek istediğinizden emin misiniz?")) return;
    await deleteDoc(doc(db, "employees", id));
    setEmployees(prev => prev.filter(e => e.id !== id));
    if (selectedEmployeeId === id) setSelectedEmployeeId(null);
  }

  async function updateEmployeeChecklist(employeeId: string, checklist: EmployeeChecklist) {
    const onboarding = createOnboardingFromChecklist(checklist);
    const trainingComplete = onboarding.status === "completed";
    await updateDoc(doc(db, "employees", employeeId), { checklist, onboarding, trainingComplete });
    setEmployees(prev => prev.map(e => e.id === employeeId ? { ...e, checklist, onboarding, trainingComplete } : e));
  }

  async function updateEmployeeTraining(employeeId: string, trainingComplete: boolean) {
    const employee = employees.find(e => e.id === employeeId);
    const onboarding = employee ? { ...(employee.onboarding || createOnboardingFromChecklist(employee.checklist)), status: trainingComplete ? "completed" as const : "pending" as const, missingSteps: trainingComplete ? [] : (employee.onboarding?.missingSteps || createOnboardingFromChecklist(employee.checklist).missingSteps) } : undefined;
    await updateDoc(doc(db, "employees", employeeId), onboarding ? { trainingComplete, onboarding } : { trainingComplete });
    setEmployees(prev => prev.map(e => e.id === employeeId ? { ...e, trainingComplete, ...(onboarding ? { onboarding } : {}) } : e));
  }

  async function addDocument() {
    if (!newDocument.companyId || !newDocument.type || !newDocument.issueDate) return;
    const data = { companyId: newDocument.companyId, employeeId: newDocument.employeeId || null, type: newDocument.type, issueDate: newDocument.issueDate, expiryDate: newDocument.expiryDate };
    const ref = await addDoc(collection(db, "documents"), withCreatedBy(data, userProfile!.uid, userProfile!.activeRole || userProfile!.role));
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
    const ref = await addDoc(collection(db, "observers"), withCreatedBy(data, userProfile!.uid, userProfile!.activeRole || userProfile!.role));
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
      const ref = await addDoc(collection(db, "dofs"), withCreatedBy(data, userProfile!.uid, userProfile!.activeRole || userProfile!.role));
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

  async function updateDofPhoto(id: string, field: "beforePhoto" | "afterPhoto", base64: string) {
    await updateDoc(doc(db, "dofs", id), { [field]: base64 });
    setDofs(prev => prev.map(d => d.id === id ? { ...d, [field]: base64 } : d));
  }

  async function removeDofPhoto(id: string, field: "beforePhoto" | "afterPhoto") {
    await updateDoc(doc(db, "dofs", id), { [field]: "" });
    setDofs(prev => prev.map(d => d.id === id ? { ...d, [field]: "" } : d));
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
    const ref = await addDoc(collection(db, "risks"), withCreatedBy(data, userProfile!.uid, userProfile!.activeRole || userProfile!.role));
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
    const ref = await addDoc(collection(db, "risks"), withCreatedBy(data, userProfile!.uid, userProfile!.activeRole || userProfile!.role));
    setRisks(prev => [...prev, { id: ref.id, ...data }]);
    setNewRisk({ companyId: "", section: "", hazard: "", risk: "", currentMeasure: "", actionToTake: "", probability: "1", severity: "1", residualProbability: "1", residualSeverity: "1", responsible: "", dueDate: "", status: "Açık", affectedPersons: "", lawReference: "", controlDate: "" });
  }

  async function deleteRisk(id: string) {
    await deleteDoc(doc(db, "risks", id));
    setRisks(prev => prev.filter(r => r.id !== id));
  }

  async function addAnnualPlan() {
    if (!newAnnualPlan.companyId || !newAnnualPlan.title || !newAnnualPlan.plannedDate) return;
    const data = {
      companyId: newAnnualPlan.companyId,
      year: parseInt(newAnnualPlan.year) || new Date().getFullYear(),
      type: newAnnualPlan.type,
      title: newAnnualPlan.title,
      plannedDate: newAnnualPlan.plannedDate,
      responsible: newAnnualPlan.responsible,
      status: newAnnualPlan.status,
      notes: newAnnualPlan.notes,
    };
    const ref = await addDoc(collection(db, "annualPlans"), withCreatedBy(data, userProfile!.uid, userProfile!.activeRole || userProfile!.role));
    setAnnualPlans(prev => [...prev, { id: ref.id, ...data }]);
    setNewAnnualPlan({ companyId: "", year: String(new Date().getFullYear()), type: "Eğitim", title: "", plannedDate: "", responsible: "", status: "Planlandı", notes: "" });
  }

  async function updateAnnualPlanStatus(id: string, status: AnnualPlanStatus) {
    await updateDoc(doc(db, "annualPlans", id), { status });
    setAnnualPlans(prev => prev.map(plan => plan.id === id ? { ...plan, status } : plan));
  }

  async function deleteAnnualPlan(id: string) {
    await deleteDoc(doc(db, "annualPlans", id));
    setAnnualPlans(prev => prev.filter(plan => plan.id !== id));
  }

  function toggleTrainingParticipant(employeeId: string) {
    setNewTraining(prev => ({
      ...prev,
      participantIds: prev.participantIds.includes(employeeId)
        ? prev.participantIds.filter(id => id !== employeeId)
        : [...prev.participantIds, employeeId],
    }));
  }

  async function addTraining() {
    if (!newTraining.companyId || !newTraining.title || !newTraining.trainingDate) return;
    const data = {
      companyId: newTraining.companyId,
      title: newTraining.title,
      type: newTraining.type,
      trainingDate: newTraining.trainingDate,
      durationHours: newTraining.durationHours,
      location: newTraining.location,
      trainer: newTraining.trainer,
      participantIds: newTraining.participantIds,
      status: newTraining.status,
      notes: newTraining.notes,
    };
    const ref = await addDoc(collection(db, "trainings"), withCreatedBy(data, userProfile!.uid, userProfile!.activeRole || userProfile!.role));
    setTrainings(prev => [...prev, { id: ref.id, ...data }]);
    setNewTraining({ companyId: "", title: "", type: "Temel İSG Eğitimi", trainingDate: "", durationHours: "", location: "", trainer: "", participantIds: [], status: "Planlandı", notes: "" });
  }

  async function updateTrainingStatus(id: string, status: TrainingStatus) {
    await updateDoc(doc(db, "trainings", id), { status });
    setTrainings(prev => prev.map(training => training.id === id ? { ...training, status } : training));
  }

  async function deleteTraining(id: string) {
    await deleteDoc(doc(db, "trainings", id));
    setTrainings(prev => prev.filter(training => training.id !== id));
  }

  async function addPpeRecord() {
    if (!newPpe.companyId || !newPpe.employeeId || !newPpe.equipment || !newPpe.issueDate) return;
    const data = {
      companyId: newPpe.companyId,
      employeeId: newPpe.employeeId,
      equipment: newPpe.equipment,
      quantity: parseInt(newPpe.quantity) || 1,
      issueDate: newPpe.issueDate,
      returnDate: newPpe.returnDate,
      status: newPpe.status,
      serialNo: newPpe.serialNo,
      notes: newPpe.notes,
    };
    const ref = await addDoc(collection(db, "ppeRecords"), withCreatedBy(data, userProfile!.uid, userProfile!.activeRole || userProfile!.role));
    setPpeRecords(prev => [...prev, { id: ref.id, ...data }]);
    setNewPpe({ companyId: "", employeeId: "", equipment: "Baret", quantity: "1", issueDate: "", returnDate: "", status: "Teslim Edildi", serialNo: "", notes: "" });
  }

  async function updatePpeStatus(id: string, status: PpeStatus) {
    await updateDoc(doc(db, "ppeRecords", id), { status });
    setPpeRecords(prev => prev.map(record => record.id === id ? { ...record, status } : record));
  }

  async function deletePpeRecord(id: string) {
    await deleteDoc(doc(db, "ppeRecords", id));
    setPpeRecords(prev => prev.filter(record => record.id !== id));
  }

  async function addEmergencyPlan() {
    if (!newEmergencyPlan.companyId || !newEmergencyPlan.title || !newEmergencyPlan.planDate) return;
    const data = {
      companyId: newEmergencyPlan.companyId,
      title: newEmergencyPlan.title,
      scenario: newEmergencyPlan.scenario,
      assemblyArea: newEmergencyPlan.assemblyArea,
      emergencyTeam: newEmergencyPlan.emergencyTeam,
      responsible: newEmergencyPlan.responsible,
      planDate: newEmergencyPlan.planDate,
      drillDate: newEmergencyPlan.drillDate,
      status: newEmergencyPlan.status,
      notes: newEmergencyPlan.notes,
    };
    const ref = await addDoc(collection(db, "emergencyPlans"), withCreatedBy(data, userProfile!.uid, userProfile!.activeRole || userProfile!.role));
    setEmergencyPlans(prev => [...prev, { id: ref.id, ...data }]);
    setNewEmergencyPlan({ companyId: "", title: "Acil Durum Planı", scenario: "Yangın", assemblyArea: "", emergencyTeam: "", responsible: "", planDate: "", drillDate: "", status: "Taslak", notes: "" });
  }

  async function updateEmergencyPlanStatus(id: string, status: EmergencyPlanStatus) {
    await updateDoc(doc(db, "emergencyPlans", id), { status });
    setEmergencyPlans(prev => prev.map(plan => plan.id === id ? { ...plan, status } : plan));
  }

  async function deleteEmergencyPlan(id: string) {
    await deleteDoc(doc(db, "emergencyPlans", id));
    setEmergencyPlans(prev => prev.filter(plan => plan.id !== id));
  }

  function toggleCommitteeParticipant(employeeId: string) {
    setNewCommitteeMeeting(prev => ({
      ...prev,
      participantIds: prev.participantIds.includes(employeeId)
        ? prev.participantIds.filter(id => id !== employeeId)
        : [...prev.participantIds, employeeId],
    }));
  }

  async function addCommitteeMeeting() {
    if (!newCommitteeMeeting.companyId || !newCommitteeMeeting.meetingDate) return;
    const data = {
      companyId: newCommitteeMeeting.companyId,
      meetingNo: newCommitteeMeeting.meetingNo,
      meetingDate: newCommitteeMeeting.meetingDate,
      location: newCommitteeMeeting.location,
      chairperson: newCommitteeMeeting.chairperson,
      agenda: newCommitteeMeeting.agenda,
      decisions: newCommitteeMeeting.decisions,
      participantIds: newCommitteeMeeting.participantIds,
      status: newCommitteeMeeting.status,
      notes: newCommitteeMeeting.notes,
    };
    const ref = await addDoc(collection(db, "committeeMeetings"), withCreatedBy(data, userProfile!.uid, userProfile!.activeRole || userProfile!.role));
    setCommitteeMeetings(prev => [...prev, { id: ref.id, ...data }]);
    setNewCommitteeMeeting({ companyId: "", meetingNo: "", meetingDate: "", location: "", chairperson: "", agenda: "", decisions: "", participantIds: [], status: "Planlandı", notes: "" });
  }

  async function updateCommitteeMeetingStatus(id: string, status: CommitteeMeetingStatus) {
    await updateDoc(doc(db, "committeeMeetings", id), { status });
    setCommitteeMeetings(prev => prev.map(meeting => meeting.id === id ? { ...meeting, status } : meeting));
  }

  async function deleteCommitteeMeeting(id: string) {
    await deleteDoc(doc(db, "committeeMeetings", id));
    setCommitteeMeetings(prev => prev.filter(meeting => meeting.id !== id));
  }

  async function addAccidentReport() {
    if (!newAccidentReport.companyId || !newAccidentReport.accidentDate || !newAccidentReport.description) return;
    const data = {
      companyId: newAccidentReport.companyId,
      employeeId: newAccidentReport.employeeId,
      accidentDate: newAccidentReport.accidentDate,
      location: newAccidentReport.location,
      severity: newAccidentReport.severity,
      incidentType: newAccidentReport.incidentType,
      description: newAccidentReport.description,
      rootCause: newAccidentReport.rootCause,
      actionPlan: newAccidentReport.actionPlan,
      responsible: newAccidentReport.responsible,
      dueDate: newAccidentReport.dueDate,
      status: newAccidentReport.status,
      notes: newAccidentReport.notes,
    };
    const ref = await addDoc(collection(db, "accidentReports"), withCreatedBy(data, userProfile!.uid, userProfile!.activeRole || userProfile!.role));
    setAccidentReports(prev => [...prev, { id: ref.id, ...data }]);
    setNewAccidentReport({ companyId: "", employeeId: "", accidentDate: "", location: "", severity: "Hafif", incidentType: "İş Kazası", description: "", rootCause: "", actionPlan: "", responsible: "", dueDate: "", status: "Açık", notes: "" });
  }

  async function updateAccidentReportStatus(id: string, status: AccidentReportStatus) {
    await updateDoc(doc(db, "accidentReports", id), { status });
    setAccidentReports(prev => prev.map(report => report.id === id ? { ...report, status } : report));
  }

  async function deleteAccidentReport(id: string) {
    await deleteDoc(doc(db, "accidentReports", id));
    setAccidentReports(prev => prev.filter(report => report.id !== id));
  }

  async function addCompanyVisit() {
    if (!newCompanyVisit.companyId || !newCompanyVisit.visitDate || !newCompanyVisit.visitor) return;
    const data = {
      companyId: newCompanyVisit.companyId,
      visitDate: newCompanyVisit.visitDate,
      purpose: newCompanyVisit.purpose,
      visitor: newCompanyVisit.visitor,
      contactedPerson: newCompanyVisit.contactedPerson,
      findings: newCompanyVisit.findings,
      actions: newCompanyVisit.actions,
      nextVisitDate: newCompanyVisit.nextVisitDate,
      status: newCompanyVisit.status,
      notes: newCompanyVisit.notes,
    };
    const ref = await addDoc(collection(db, "companyVisits"), withCreatedBy(data, userProfile!.uid, userProfile!.activeRole || userProfile!.role));
    setCompanyVisits(prev => [...prev, { id: ref.id, ...data }]);
    setNewCompanyVisit({ companyId: "", visitDate: "", purpose: "Rutin Ziyaret", visitor: "", contactedPerson: "", findings: "", actions: "", nextVisitDate: "", status: "Planlandı", notes: "" });
  }

  async function updateCompanyVisitStatus(id: string, status: CompanyVisitStatus) {
    await updateDoc(doc(db, "companyVisits", id), { status });
    setCompanyVisits(prev => prev.map(visit => visit.id === id ? { ...visit, status } : visit));
  }

  async function deleteCompanyVisit(id: string) {
    await deleteDoc(doc(db, "companyVisits", id));
    setCompanyVisits(prev => prev.filter(visit => visit.id !== id));
  }

  const tabs = isHumanResources && !isAdmin
    ? [{ id: "personel", label: "👥 İnsan Kaynakları" }]
    : [
      { id: "ozet", label: "📊 Özet" },
      { id: "firmalar", label: "🏢 Firmalar" },
      { id: "personel", label: "👤 Personel" },
      { id: "belgeler", label: "📄 Belgeler" },
      { id: "gozlemciler", label: "🔍 Gözlemciler" },
      { id: "dof", label: "⚠️ DÖF" },
      { id: "risk", label: "🛡 Risk" },
      { id: "imzacilar", label: "✍️ İmzacılar" },
      { id: "ek2muayene", label: "🏥 EK-2 Muayene" },
      { id: "yillik-planlar", label: "📅 Yıllık Planlar" },
      { id: "egitimler", label: "🎓 Eğitimler" },
      { id: "kkd-formu", label: "🧤 KKD Formu" },
      { id: "acil-durum-plani", label: "⚠️ Acil Durum Planı" },
      { id: "kurul-toplantisi", label: "👥 Kurul Toplantısı" },
      { id: "firma-ziyaretleri", label: "📍 Firma Ziyaretleri" },
      { id: "arsiv", label: "🗂 Arşiv" },
      { id: "is-kazasi-raporu", label: "🚑 İş Kazası Raporu" },
      ...(isAdmin ? [{ id: "kullanicilar", label: "👥 Kullanıcılar" }] : []),
    ];
  const menuGroups: Array<{ title: string; items: Array<{ id: string; label: string; disabled?: boolean }> }> = isHumanResources && !isAdmin
    ? [{ title: "Yönetim", items: tabs }]
    : [
      { title: "Yönetim", items: tabs.filter(tab => ["ozet", "firmalar", "personel", "kullanicilar"].includes(tab.id)) },
      { title: "Risk Yönetimi", items: tabs.filter(tab => ["gozlemciler", "dof", "risk"].includes(tab.id)) },
      { title: "Formlar & Belgeler", items: tabs.filter(tab => ["belgeler", "imzacilar", "ek2muayene", "kkd-formu", "is-kazasi-raporu"].includes(tab.id)) },
      {
        title: "Planlama & Arşiv",
        items: [
          ...tabs.filter(tab => ["yillik-planlar", "egitimler", "acil-durum-plani", "kurul-toplantisi", "firma-ziyaretleri", "arsiv"].includes(tab.id)),
        ],
      },
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
  const activeRole = userProfile?.activeRole || userProfile?.role;
  const activeRoleLabel = activeRole ? t(`role.${activeRole}`) : "";
  const compactLayout = isMobileScreen();

  return (
    
    <div style={styles.app} className="isg-app">
      <header style={styles.header} className="isg-header">
        <div style={{ display: "flex", alignItems: "center", gap: 10, minWidth: 0 }}>
          <div style={{ width: 32, height: 32, borderRadius: 8, background: "linear-gradient(135deg, var(--isg-accent) 0%, var(--isg-accent-2) 100%)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 15, flexShrink: 0, boxShadow: "0 10px 24px var(--isg-accent-glow)" }}>🦺</div>
          <span style={{ fontWeight: 800, fontSize: 15, letterSpacing: 0, color: "var(--isg-text)" }}>İSG <span style={{ color: "var(--isg-text-muted)", fontWeight: 650 }}>Otomasyon</span></span>
          {activeRoleLabel && (
            <span style={{
              fontSize: 12,
              color: "var(--isg-text)",
              backgroundColor: "rgba(76,201,166,0.12)",
              border: "1px solid rgba(76,201,166,0.24)",
              borderRadius: 8,
              marginLeft: 4,
              padding: "5px 9px",
              fontWeight: 750,
              lineHeight: 1,
              whiteSpace: "nowrap",
            }}>
              {activeRoleLabel}
            </span>
          )}
        </div>
        <div style={{ display: "flex", gap: 6, alignItems: "center", flexShrink: 0 }}>
          <button style={{ width: 34, height: 34, borderRadius: 8, backgroundColor: "var(--isg-btn-secondary)", border: "1px solid var(--isg-border)", cursor: "pointer", fontSize: 14, display: "flex", alignItems: "center", justifyContent: "center" }} onClick={() => setDarkMode(!darkMode)}>
            {darkMode ? "☀️" : "🌙"}
          </button>
          <button style={{ ...styles.btnSecondary, fontSize: 12, padding: "6px 12px" }} onClick={loadAll}>Yenile</button>
          <button style={{ backgroundColor: "rgba(255,107,107,0.11)", color: "var(--isg-danger)", border: "1px solid rgba(255,107,107,0.22)", borderRadius: 8, padding: "7px 14px", fontSize: 12, fontWeight: 650, cursor: "pointer" }} onClick={async () => {
            await signOut(auth);
            router.push("/login?reason=logged_out");
          }}>Çıkış</button>
        </div>
      </header>

      <div style={{ ...styles.shell, flexDirection: compactLayout ? "column" : "row" }} className="isg-shell">
        <aside style={{ ...styles.sidebar, width: compactLayout ? "100%" : 252, position: compactLayout ? "relative" : "sticky", top: compactLayout ? 0 : 58, height: compactLayout ? "auto" : "calc(100vh - 58px)" }} className="isg-sidebar">
          <div style={styles.sidebarSearch}>
            <span style={{ color: "var(--isg-text-subtle)", fontSize: 14 }}>⌕</span>
            <span style={{ color: "var(--isg-text-muted)", fontSize: 12 }}>Modül ara...</span>
          </div>
          <div style={{ display: "grid", gap: 18 }}>
            {menuGroups.map(group => (
              <div key={group.title}>
                <div style={styles.sidebarGroupTitle}>{group.title}</div>
                <div style={{ display: "grid", gap: 4 }}>
                  {group.items.map(tab => {
                    const isActive = activeTab === tab.id;
                    return (
                      <button
                        key={tab.id}
                        type="button"
                        disabled={tab.disabled}
                        title={tab.disabled ? "Bu modül sonraki adımlarda eklenecek" : undefined}
                        style={{
                          ...styles.sidebarItem,
                          backgroundColor: isActive ? "rgba(76,201,166,0.16)" : "transparent",
                          color: tab.disabled ? "var(--isg-text-subtle)" : isActive ? "var(--isg-text)" : "var(--isg-text-muted)",
                          borderColor: isActive ? "rgba(76,201,166,0.3)" : "transparent",
                          opacity: tab.disabled ? 0.58 : 1,
                          cursor: tab.disabled ? "not-allowed" : "pointer",
                        }}
                        onClick={() => {
                          if (tab.disabled) return;
                          setActiveTab(tab.id);
                          setSearch("");
                        }}
                      >
                        <span>{tab.label}</span>
                        {tab.disabled && <span style={styles.soonBadge}>Yakında</span>}
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </aside>

      <main style={{ ...styles.content, maxWidth: compactLayout ? "100%" : 1480 }} className="isg-app">
        {loadError && (
          <div style={{
            backgroundColor: "#dc262615",
            border: "1px solid #dc262633",
            borderRadius: 8,
            color: "#fca5a5",
            fontSize: 13,
            marginBottom: 16,
            padding: "10px 12px",
          }}>
            {loadError}
          </div>
        )}

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
                <div key={label} style={styles.statCard} className="isg-stat-card"
                  onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = "rgba(255,255,255,0.15)"; (e.currentTarget as HTMLElement).style.transform = "translateY(-2px)"; }}
                  onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = "rgba(255,255,255,0.07)"; (e.currentTarget as HTMLElement).style.transform = ""; }}>
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
            {isAdmin ? (
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
            ) : (
              <div style={styles.card} className="isg-card">
                <p style={styles.sectionTitle} className="isg-text-muted">Firma Yetkileriniz</p>
                <p style={{ margin: 0, color: "var(--isg-text-muted)", fontSize: 13 }}>
                  Bu ekranda yalnızca size atanmış firmalar görünür. Yeni firma ekleme ve firma silme işlemleri sadece Admin panelinden yapılır.
                </p>
              </div>
            )}
            <div style={styles.searchBar}>
              <input style={{ ...styles.input, maxWidth: 300 }} placeholder="Ara..." value={search} onChange={e => setSearch(e.target.value)} />
              <span style={{ color: "#64748b", fontSize: 13 }}>{filteredCompanies.length} firma</span>
            </div>
            <div style={{ ...styles.card, padding: 0, overflow: "auto", WebkitOverflowScrolling: "touch" as any }}>
              <table style={styles.table}>
                <thead><tr>{["Kısa Ad", "Resmi Unvan", "SGK Sicil", "NACE", "Tehlike", "Personel", "Sözleşme", "Hizmet", "Durum", ...(isAdmin ? ["İşlem"] : [])].map(h => <th key={h} style={styles.th} className="isg-th">{h}</th>)}</tr></thead>
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
                        {isAdmin && <td style={styles.td} className="isg-td"><button style={styles.btnDanger} onClick={() => deleteCompany(c.id)}>Sil</button></td>}
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
                <div style={{ display: "grid", gridTemplateColumns: "minmax(160px, 190px) 1fr", gap: 18, alignItems: "start" }}>
                  <div style={{ border: "1px solid var(--isg-border)", borderRadius: 8, padding: 14, backgroundColor: "var(--isg-input-bg)" }}>
                    <label style={styles.label} className="isg-label">Personel Fotoğrafı</label>
                    {newEmployee.photo ? (
                      <div style={{ position: "relative", width: 132 }}>
                        <img src={newEmployee.photo} alt="personel fotoğrafı" style={{ width: 132, height: 160, objectFit: "cover", borderRadius: 8, border: "1px solid var(--isg-border)" }} />
                        <button type="button" onClick={() => setNewEmployee({ ...newEmployee, photo: "" })} style={{ position: "absolute", top: -7, right: -7, width: 24, height: 24, borderRadius: "50%", border: "none", backgroundColor: "#dc2626", color: "white", fontSize: 12, cursor: "pointer" }}>✕</button>
                      </div>
                    ) : (
                      <div>
                        <div style={{ width: 132, height: 160, borderRadius: 8, border: "1px dashed var(--isg-border-strong)", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--isg-text-muted)", fontSize: 12, marginBottom: 10, textAlign: "center", padding: 10 }}>
                          Fotoğraf seçin
                        </div>
                        <label style={{ ...styles.btnSecondary, display: "inline-flex", alignItems: "center", justifyContent: "center", width: "100%", cursor: "pointer", boxSizing: "border-box" as const }}>
                          Fotoğraf Seç
                          <input type="file" accept="image/*" style={{ display: "none" }} onChange={e => handleImageToBase64(e, b64 => setNewEmployee({ ...newEmployee, photo: b64 }))} />
                        </label>
                      </div>
                    )}
                  </div>
                  <div style={{ display: "grid", gap: 18 }}>
                    <div>
                      <p style={{ ...styles.sectionTitle, marginBottom: 10 }}>Kimlik Bilgileri</p>
                      <div style={styles.formGrid}>
                        <FormField label="Firma *"><select style={styles.select} className="isg-input" value={newEmployee.companyId} onChange={e => setNewEmployee({ ...newEmployee, companyId: e.target.value })}><option value="">{companies.length === 0 ? "Firma bulunamadı" : "Seçin..."}</option>{companies.map(c => <option key={c.id} value={c.id}>{c.nickName}</option>)}</select></FormField>
                        <FormField label="Ad *"><input style={styles.input} className="isg-input" value={newEmployee.firstName} onChange={e => setNewEmployee({ ...newEmployee, firstName: e.target.value })} /></FormField>
                        <FormField label="Soyad"><input style={styles.input} className="isg-input" value={newEmployee.lastName} onChange={e => setNewEmployee({ ...newEmployee, lastName: e.target.value })} /></FormField>
                        <FormField label="TC No"><input style={styles.input} className="isg-input" value={newEmployee.tcNo} onChange={e => setNewEmployee({ ...newEmployee, tcNo: e.target.value })} /></FormField>
                        <FormField label="Doğum Yeri"><input style={styles.input} className="isg-input" value={newEmployee.birthPlace} onChange={e => setNewEmployee({ ...newEmployee, birthPlace: e.target.value })} /></FormField>
                        <FormField label="Doğum Tarihi"><DatePicker value={newEmployee.birthDate} onChange={v => setNewEmployee({ ...newEmployee, birthDate: v })} /></FormField>
                        <FormField label="Cinsiyet"><select style={styles.select} className="isg-input" value={newEmployee.gender} onChange={e => setNewEmployee({ ...newEmployee, gender: e.target.value })}><option value="">Seçin...</option><option>Erkek</option><option>Kadın</option><option>Diğer</option></select></FormField>
                        <FormField label="Uyruk"><select style={styles.select} className="isg-input" value={newEmployee.nationality} onChange={e => setNewEmployee({ ...newEmployee, nationality: e.target.value, nationalityOther: e.target.value === "Diğer" ? newEmployee.nationalityOther : "" })}><option value="T.C.">T.C.</option><option value="Diğer">Diğer</option></select></FormField>
                        {newEmployee.nationality === "Diğer" && (
                          <FormField label="Uyruk Açıklaması"><input style={styles.input} className="isg-input" value={newEmployee.nationalityOther} onChange={e => setNewEmployee({ ...newEmployee, nationalityOther: e.target.value })} placeholder="Örn. Bulgaristan, Suriye..." /></FormField>
                        )}
                        <FormField label="Seri / Belge No"><input style={styles.input} className="isg-input" value={newEmployee.serialNo} onChange={e => setNewEmployee({ ...newEmployee, serialNo: e.target.value })} /></FormField>
                        <FormField label="Baba Adı"><input style={styles.input} className="isg-input" value={newEmployee.fatherName} onChange={e => setNewEmployee({ ...newEmployee, fatherName: e.target.value })} /></FormField>
                        <FormField label="Anne Adı"><input style={styles.input} className="isg-input" value={newEmployee.motherName} onChange={e => setNewEmployee({ ...newEmployee, motherName: e.target.value })} /></FormField>
                      </div>
                    </div>
                    <div>
                      <p style={{ ...styles.sectionTitle, marginBottom: 10 }}>İletişim ve Aile</p>
                      <div style={styles.formGrid}>
                        <FormField label="Telefon"><input style={styles.input} className="isg-input" value={newEmployee.phone} onChange={e => setNewEmployee({ ...newEmployee, phone: e.target.value })} /></FormField>
                        <FormField label="E-posta"><input style={styles.input} className="isg-input" type="email" value={newEmployee.email} onChange={e => setNewEmployee({ ...newEmployee, email: e.target.value })} /></FormField>
                        <FormField label="Adres"><input style={styles.input} className="isg-input" value={newEmployee.address} onChange={e => setNewEmployee({ ...newEmployee, address: e.target.value })} /></FormField>
                        <FormField label="Medeni Durum"><select style={styles.select} className="isg-input" value={newEmployee.maritalStatus} onChange={e => setNewEmployee({ ...newEmployee, maritalStatus: e.target.value })}><option value="">Seçin...</option><option>Bekar</option><option>Evli</option><option>Boşanmış</option><option>Dul</option></select></FormField>
                        <FormField label="Çocuk Sayısı"><input style={styles.input} className="isg-input" value={newEmployee.childrenCount} onChange={e => setNewEmployee({ ...newEmployee, childrenCount: e.target.value })} /></FormField>
                        <FormField label="Acil Durum Kişisi"><input style={styles.input} className="isg-input" value={newEmployee.emergencyContactName} onChange={e => setNewEmployee({ ...newEmployee, emergencyContactName: e.target.value })} /></FormField>
                        <FormField label="Acil Durum Telefonu"><input style={styles.input} className="isg-input" value={newEmployee.emergencyContactPhone} onChange={e => setNewEmployee({ ...newEmployee, emergencyContactPhone: e.target.value })} /></FormField>
                      </div>
                    </div>
                    <div>
                      <p style={{ ...styles.sectionTitle, marginBottom: 10 }}>İş ve Eğitim Bilgileri</p>
                      <div style={styles.formGrid}>
                        <FormField label="Birim"><input style={styles.input} className="isg-input" value={newEmployee.department} onChange={e => setNewEmployee({ ...newEmployee, department: e.target.value })} placeholder="Üretim, muhasebe..." /></FormField>
                        <FormField label="Unvan"><input style={styles.input} className="isg-input" value={newEmployee.title} onChange={e => setNewEmployee({ ...newEmployee, title: e.target.value })} /></FormField>
                        <FormField label="Meslek / Meslek Dalı"><input style={styles.input} className="isg-input" value={newEmployee.profession} onChange={e => setNewEmployee({ ...newEmployee, profession: e.target.value })} /></FormField>
                        <FormField label="Yapacağı İş"><input style={styles.input} className="isg-input" value={newEmployee.jobDescription} onChange={e => setNewEmployee({ ...newEmployee, jobDescription: e.target.value })} /></FormField>
                        <FormField label="İşe Giriş"><DatePicker value={newEmployee.hireDate} onChange={v => setNewEmployee({ ...newEmployee, hireDate: v })} /></FormField>
                        <FormField label="Eğitim Durumu"><input style={styles.input} className="isg-input" value={newEmployee.educationLevel} onChange={e => setNewEmployee({ ...newEmployee, educationLevel: e.target.value })} /></FormField>
                        <FormField label="Diploma Bilgileri"><input style={styles.input} className="isg-input" value={newEmployee.diplomaInfo} onChange={e => setNewEmployee({ ...newEmployee, diplomaInfo: e.target.value })} placeholder="Okul / bölüm / yıl" /></FormField>
                        <FormField label="SGK No"><input style={styles.input} className="isg-input" value={newEmployee.sgkNo} onChange={e => setNewEmployee({ ...newEmployee, sgkNo: e.target.value })} /></FormField>
                        <FormField label="IBAN"><input style={styles.input} className="isg-input" value={newEmployee.iban} onChange={e => setNewEmployee({ ...newEmployee, iban: e.target.value })} /></FormField>
                      </div>
                    </div>
                    <div>
                      <p style={{ ...styles.sectionTitle, marginBottom: 10 }}>Sağlık Ön Bilgileri</p>
                      <div style={styles.formGrid}>
                        <FormField label="Kan Grubu"><select style={styles.select} className="isg-input" value={newEmployee.bloodType} onChange={e => setNewEmployee({ ...newEmployee, bloodType: e.target.value })}><option value="">Seçin...</option><option>A Rh+</option><option>A Rh-</option><option>B Rh+</option><option>B Rh-</option><option>AB Rh+</option><option>AB Rh-</option><option>0 Rh+</option><option>0 Rh-</option><option>Bilinmiyor</option></select></FormField>
                        <FormField label="Kronik Hastalık"><input style={styles.input} className="isg-input" value={newEmployee.chronicDisease} onChange={e => setNewEmployee({ ...newEmployee, chronicDisease: e.target.value })} /></FormField>
                        <FormField label="Alerji"><input style={styles.input} className="isg-input" value={newEmployee.allergies} onChange={e => setNewEmployee({ ...newEmployee, allergies: e.target.value })} /></FormField>
                        <FormField label="Tetanoz Aşı Bilgisi"><input style={styles.input} className="isg-input" value={newEmployee.tetanusVaccine} onChange={e => setNewEmployee({ ...newEmployee, tetanusVaccine: e.target.value })} /></FormField>
                        <FormField label="Hepatit Aşı Bilgisi"><input style={styles.input} className="isg-input" value={newEmployee.hepatitisVaccine} onChange={e => setNewEmployee({ ...newEmployee, hepatitisVaccine: e.target.value })} /></FormField>
                      </div>
                      <div style={{ marginTop: 12 }}>
                        <FormField label="Notlar"><textarea style={{ ...styles.input, minHeight: 76, resize: "vertical" as const }} className="isg-input" value={newEmployee.notes} onChange={e => setNewEmployee({ ...newEmployee, notes: e.target.value })} /></FormField>
                      </div>
                    </div>
                  </div>
                </div>
                <div style={{ marginTop: 12 }}><button style={styles.btnPrimary} onClick={addEmployee}>Personel Ekle</button></div>
                {employeeAddStatus && (
                  <div style={{
                    marginTop: 12,
                    padding: "10px 12px",
                    borderRadius: 8,
                    fontSize: 13,
                    color: employeeAddStatus.startsWith("✅") ? "#86efac" : employeeAddStatus.startsWith("⚠️") ? "#fbbf24" : "#fca5a5",
                    backgroundColor: employeeAddStatus.startsWith("✅") ? "#16a34a15" : employeeAddStatus.startsWith("⚠️") ? "#d9770615" : "#dc262615",
                    border: `1px solid ${employeeAddStatus.startsWith("✅") ? "#16a34a33" : employeeAddStatus.startsWith("⚠️") ? "#d9770633" : "#dc262633"}`,
                  }}>
                    {employeeAddStatus}
                  </div>
                )}
              </div>
              <div style={styles.searchBar}>
                <input style={{ ...styles.input, maxWidth: 240 }} placeholder="Ara..." value={search} onChange={e => setSearch(e.target.value)} />
                <select style={{ ...styles.select, maxWidth: 180 }} value={selectedCompanyId} onChange={e => setSelectedCompanyId(e.target.value)}><option value="all">Tüm Firmalar</option>{companies.map(c => <option key={c.id} value={c.id}>{c.nickName}</option>)}</select>
                <span style={{ color: "#64748b", fontSize: 13 }}>{filteredEmployees.length} kişi</span>
              </div>
              <div style={{ ...styles.card, padding: 0, overflow: "auto", WebkitOverflowScrolling: "touch" as any }}>
                <table style={styles.table}>
                  <thead><tr>{["Ad Soyad", "TC No", "İletişim", "Birim", "Unvan", "Firma", "İşe Giriş", "Onboarding", "Eksikler", "Kontrol Listesi", "İşlem"].map(h => <th key={h} style={styles.th} className="isg-th">{h}</th>)}</tr></thead>
                  <tbody>
                    {filteredEmployees.map(emp => {
                      const company = companies.find(c => c.id === emp.companyId);
                      const cl = checklistCompletion(emp.checklist);
                      const onboarding = emp.onboarding || createOnboardingFromChecklist(emp.checklist);
                      return (
                        <tr key={emp.id} style={{ cursor: "pointer", backgroundColor: selectedEmployeeId === emp.id ? "#1a2942" : "transparent" }} onClick={() => setSelectedEmployeeId(emp.id)}>
                          <td style={styles.td} className="isg-td">
                            <div style={{ display: "flex", alignItems: "center", gap: 9, minWidth: 180 }}>
                              {emp.photo ? <img src={emp.photo} alt="" style={{ width: 34, height: 34, borderRadius: 8, objectFit: "cover", border: "1px solid var(--isg-border)" }} /> : <div style={{ width: 34, height: 34, borderRadius: 8, backgroundColor: "var(--isg-input-bg)", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--isg-text-muted)", fontSize: 13 }}>👤</div>}
                              <span style={{ fontWeight: 700 }}>{emp.firstName} {emp.lastName}</span>
                            </div>
                          </td>
                          <td style={{ ...styles.td, fontSize: 12, color: "var(--isg-text-muted)" }}>{emp.tcNo}</td>
                          <td style={{ ...styles.td, fontSize: 11, color: "var(--isg-text-muted)" }}>
                            <div>{emp.phone || "—"}</div>
                            {emp.email && <div>{emp.email}</div>}
                          </td>
                          <td style={{ ...styles.td, fontSize: 12 }}>{emp.department || "—"}</td>
                          <td style={styles.td} className="isg-td">{emp.title}</td>
                          <td style={{ ...styles.td, fontSize: 12 }}>{company?.nickName}</td>
                          <td style={{ ...styles.td, fontSize: 12 }}>{emp.hireDate}</td>
                          <td style={styles.td} className="isg-td"><Badge text={onboarding.status === "completed" ? "Tamamlandı" : "Bekliyor"} color={onboarding.status === "completed" ? "#16a34a" : "#d97706"} /></td>
                          <td style={{ ...styles.td, fontSize: 11, color: "var(--isg-text-muted)", minWidth: 220 }}>{onboarding.missingSteps.length > 0 ? onboarding.missingSteps.join(", ") : "Tüm görevler tamamlandı"}</td>
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
                  <div style={{ display: "flex", gap: 12, alignItems: "flex-start" }}>
                    {selectedEmployee.photo ? <img src={selectedEmployee.photo} alt="" style={{ width: 76, height: 92, borderRadius: 8, objectFit: "cover", border: "1px solid var(--isg-border)" }} /> : <div style={{ width: 76, height: 92, borderRadius: 8, backgroundColor: "var(--isg-input-bg)", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--isg-text-muted)" }}>👤</div>}
                    <div>
                      <div style={{ fontWeight: 800, fontSize: 16, marginBottom: 2 }}>{selectedEmployee.firstName} {selectedEmployee.lastName}</div>
                      <div style={{ fontSize: 12, color: "var(--isg-text-muted)" }}>{selectedEmployee.title || "Unvan girilmedi"}</div>
                      <div style={{ fontSize: 12, color: "var(--isg-text-muted)", marginTop: 2 }}>{selectedEmployee.department || "Birim girilmedi"}</div>
                      <div style={{ fontSize: 12, color: "var(--isg-text-muted)", marginTop: 2 }}>{selectedEmployeeCompany?.nickName}</div>
                    </div>
                  </div>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: 6, marginTop: 14, fontSize: 12, color: "var(--isg-text-muted)", lineHeight: 1.45 }}>
                    <div><strong style={{ color: "var(--isg-text)" }}>TC:</strong> {selectedEmployee.tcNo || "—"}</div>
                    <div><strong style={{ color: "var(--isg-text)" }}>Doğum:</strong> {[selectedEmployee.birthPlace, selectedEmployee.birthDate].filter(Boolean).join(" / ") || "—"}</div>
                    <div><strong style={{ color: "var(--isg-text)" }}>Telefon:</strong> {selectedEmployee.phone || "—"}</div>
                    <div><strong style={{ color: "var(--isg-text)" }}>E-posta:</strong> {selectedEmployee.email || "—"}</div>
                    {selectedEmployee.diplomaInfo && <div><strong style={{ color: "var(--isg-text)" }}>Diploma:</strong> {selectedEmployee.diplomaInfo}</div>}
                    {selectedEmployee.address && <div><strong style={{ color: "var(--isg-text)" }}>Adres:</strong> {selectedEmployee.address}</div>}
                    {selectedEmployee.bloodType && <div><strong style={{ color: "var(--isg-text)" }}>Kan Grubu:</strong> {selectedEmployee.bloodType}</div>}
                    {selectedEmployee.emergencyContactName && <div><strong style={{ color: "var(--isg-text)" }}>Acil:</strong> {selectedEmployee.emergencyContactName} {selectedEmployee.emergencyContactPhone}</div>}
                  </div>
                  {(() => {
                    const onboarding = selectedEmployee.onboarding || createOnboardingFromChecklist(selectedEmployee.checklist);
                    return (
                      <div style={{ backgroundColor: onboarding.status === "completed" ? "#16a34a10" : "#d9770610", border: `1px solid ${onboarding.status === "completed" ? "#16a34a33" : "#d9770633"}`, borderRadius: 8, padding: 12, marginTop: 14 }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8, marginBottom: 6 }}>
                          <span style={{ fontSize: 12, fontWeight: 700, color: onboarding.status === "completed" ? "#86efac" : "#fbbf24" }}>
                            {onboarding.status === "completed" ? "Yeşil statü: tamamlandı" : "Eksik görev var"}
                          </span>
                          <Badge text={onboarding.status === "completed" ? "Tamamlandı" : `${onboarding.missingSteps.length} eksik`} color={onboarding.status === "completed" ? "#16a34a" : "#d97706"} />
                        </div>
                        <div style={{ fontSize: 11, color: "var(--isg-text-muted)", lineHeight: 1.5 }}>
                          {onboarding.missingSteps.length > 0 ? onboarding.missingSteps.join(" · ") : "Doktor ve İSG uzmanı görevleri tamamlandı."}
                        </div>
                        {onboarding.missingSteps.length > 0 && (
                          <button
                            style={{ ...styles.btnSecondary, width: "100%", marginTop: 10 }}
                            onClick={() => fetch("/api/send-onboarding-notification", {
                              method: "POST",
                              headers: { "Content-Type": "application/json" },
                              body: JSON.stringify({ employeeId: selectedEmployee.id, type: "reminder" }),
                            }).catch((error) => console.error("Onboarding uyarısı gönderilemedi", error))}
                          >
                            Eksikler için uyarı gönder
                          </button>
                        )}
                      </div>
                    );
                  })()}
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
            <div style={{ ...styles.card, padding: 0, overflow: "auto", WebkitOverflowScrolling: "touch" as any }}>
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
                        <select style={{ ...styles.select, marginBottom: 10 }} className="isg-input" value={dof.status} onChange={e => updateDofStatus(dof.id, e.target.value as any)}>
                          <option>Açık</option><option>Bildirildi</option><option>Önlem Alındı</option><option>Çözüldü</option>
                        </select>
                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
                          <div>
                            <label style={{ fontSize: 11, color: "var(--isg-text-muted)", display: "block", marginBottom: 4 }}>Öncesi Fotoğraf (Uygunsuzluk)</label>
                            {dof.beforePhoto ? (
                              <div style={{ position: "relative", display: "inline-block" }}>
                                <img src={dof.beforePhoto} alt="önce" style={{ width: 140, height: 100, objectFit: "cover", borderRadius: 6, border: "1px solid var(--isg-border)" }} />
                                <button type="button" onClick={() => removeDofPhoto(dof.id, "beforePhoto")} style={{ position: "absolute", top: -6, right: -6, width: 20, height: 20, borderRadius: "50%", border: "none", backgroundColor: "#dc2626", color: "white", fontSize: 11, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>✕</button>
                              </div>
                            ) : (
                              <input type="file" accept="image/*" style={{ fontSize: 12, color: "var(--isg-text-muted)" }} onChange={e => handleImageToBase64(e, b64 => updateDofPhoto(dof.id, "beforePhoto", b64))} />
                            )}
                          </div>
                          <div>
                            <label style={{ fontSize: 11, color: "var(--isg-text-muted)", display: "block", marginBottom: 4 }}>Sonrası Fotoğraf (Düzeltme)</label>
                            {dof.afterPhoto ? (
                              <div style={{ position: "relative", display: "inline-block" }}>
                                <img src={dof.afterPhoto} alt="sonra" style={{ width: 140, height: 100, objectFit: "cover", borderRadius: 6, border: "1px solid var(--isg-border)" }} />
                                <button type="button" onClick={() => removeDofPhoto(dof.id, "afterPhoto")} style={{ position: "absolute", top: -6, right: -6, width: 20, height: 20, borderRadius: "50%", border: "none", backgroundColor: "#dc2626", color: "white", fontSize: 11, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>✕</button>
                              </div>
                            ) : (
                              <input type="file" accept="image/*" style={{ fontSize: 12, color: "var(--isg-text-muted)" }} onChange={e => handleImageToBase64(e, b64 => updateDofPhoto(dof.id, "afterPhoto", b64))} />
                            )}
                          </div>
                        </div>
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
            </div>

            <div style={{ ...styles.card, padding: 0, overflow: "auto", WebkitOverflowScrolling: "touch" as any }}>
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
                          <button style={styles.btnDanger} onClick={() => deleteRisk(r.id)}>Sil</button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

          </div>
        )}


        {activeTab === "imzacilar" && (
          <div>
            <div style={styles.card} className="isg-card">
              <p style={styles.sectionTitle} className="isg-text-muted">İmzacı Yönetimi</p>
              <p style={{ fontSize: 12, color: "var(--isg-text-muted)", marginBottom: 16 }}>
                Her firma için PDF raporlarında görünecek 3 imzacıyı belirleyin: İş Güvenliği Uzmanı, İşveren/İşveren Vekili ve Çalışan Temsilcisi.
                {!isAdmin && " Bu ekranda yalnızca size atanmış firmaların imzacıları görünür."}
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
                                      const ref = await addDoc(collection(db, "signers"), withCreatedBy(data, userProfile!.uid, userProfile!.activeRole || userProfile!.role));
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

        {activeTab === "yillik-planlar" && (
          <div>
            <div style={styles.card} className="isg-card">
              <p style={styles.sectionTitle} className="isg-text-muted">Yıllık İSG Planı</p>
              <div style={styles.formGrid}>
                <FormField label="Firma *"><select style={styles.select} className="isg-input" value={newAnnualPlan.companyId} onChange={e => setNewAnnualPlan({ ...newAnnualPlan, companyId: e.target.value })}><option value="">Seçin...</option>{companies.map(c => <option key={c.id} value={c.id}>{c.nickName}</option>)}</select></FormField>
                <FormField label="Plan Yılı"><input style={styles.input} className="isg-input" type="number" value={newAnnualPlan.year} onChange={e => setNewAnnualPlan({ ...newAnnualPlan, year: e.target.value })} /></FormField>
                <FormField label="Plan Türü"><select style={styles.select} className="isg-input" value={newAnnualPlan.type} onChange={e => setNewAnnualPlan({ ...newAnnualPlan, type: e.target.value as AnnualPlanType })}><option>Eğitim</option><option>Muayene</option><option>Risk Değerlendirme</option><option>Acil Durum Tatbikatı</option><option>Kurul Toplantısı</option><option>Saha Ziyareti</option><option>Belge Yenileme</option></select></FormField>
                <FormField label="Başlık *"><input style={styles.input} className="isg-input" value={newAnnualPlan.title} onChange={e => setNewAnnualPlan({ ...newAnnualPlan, title: e.target.value })} placeholder="Örn. Temel İSG eğitimi" /></FormField>
                <FormField label="Planlanan Tarih *"><DatePicker value={newAnnualPlan.plannedDate} onChange={v => setNewAnnualPlan({ ...newAnnualPlan, plannedDate: v })} /></FormField>
                <FormField label="Sorumlu"><input style={styles.input} className="isg-input" value={newAnnualPlan.responsible} onChange={e => setNewAnnualPlan({ ...newAnnualPlan, responsible: e.target.value })} placeholder="Doktor, İSG uzmanı..." /></FormField>
                <FormField label="Durum"><select style={styles.select} className="isg-input" value={newAnnualPlan.status} onChange={e => setNewAnnualPlan({ ...newAnnualPlan, status: e.target.value as AnnualPlanStatus })}><option>Planlandı</option><option>Devam Ediyor</option><option>Tamamlandı</option><option>Gecikti</option></select></FormField>
                <FormField label="Not"><input style={styles.input} className="isg-input" value={newAnnualPlan.notes} onChange={e => setNewAnnualPlan({ ...newAnnualPlan, notes: e.target.value })} placeholder="Kısa açıklama" /></FormField>
              </div>
              <div style={{ marginTop: 12, display: "flex", gap: 10, flexWrap: "wrap" }}>
                <button style={styles.btnPrimary} onClick={addAnnualPlan}>Plan Kalemi Ekle</button>
                <button style={styles.btnSecondary} onClick={() => generateAnnualPlanPDF(filteredAnnualPlans, companies)}>PDF İndir</button>
              </div>
            </div>

            <div style={styles.searchBar}>
              <input style={{ ...styles.input, maxWidth: 300 }} placeholder="Ara..." value={search} onChange={e => setSearch(e.target.value)} />
              <select style={{ ...styles.select, maxWidth: 180 }} value={selectedCompanyId} onChange={e => setSelectedCompanyId(e.target.value)}><option value="all">Tüm Firmalar</option>{companies.map(c => <option key={c.id} value={c.id}>{c.nickName}</option>)}</select>
              <span style={{ color: "var(--isg-text-muted)", fontSize: 13 }}>{filteredAnnualPlans.length} plan kalemi</span>
            </div>

            <div style={{ ...styles.card, padding: 0, overflow: "auto", WebkitOverflowScrolling: "touch" as any }}>
              <table style={styles.table}>
                <thead><tr>{["Firma", "Yıl", "Tür", "Başlık", "Tarih", "Sorumlu", "Durum", "Not", "İşlem"].map(h => <th key={h} style={styles.th} className="isg-th">{h}</th>)}</tr></thead>
                <tbody>
                  {filteredAnnualPlans.map(plan => {
                    const company = companies.find(c => c.id === plan.companyId);
                    return (
                      <tr key={plan.id}>
                        <td style={styles.td} className="isg-td">{company?.nickName || "—"}</td>
                        <td style={styles.td} className="isg-td">{plan.year}</td>
                        <td style={styles.td} className="isg-td"><Badge text={plan.type} color="#0ea5e9" /></td>
                        <td style={{ ...styles.td, minWidth: 180 }} className="isg-td"><strong>{plan.title}</strong></td>
                        <td style={styles.td} className="isg-td">{plan.plannedDate ? new Date(plan.plannedDate).toLocaleDateString("tr-TR") : "—"}</td>
                        <td style={styles.td} className="isg-td">{plan.responsible || "—"}</td>
                        <td style={styles.td} className="isg-td"><select style={{ ...styles.select, minWidth: 132 }} value={plan.status} onChange={e => updateAnnualPlanStatus(plan.id, e.target.value as AnnualPlanStatus)}><option>Planlandı</option><option>Devam Ediyor</option><option>Tamamlandı</option><option>Gecikti</option></select></td>
                        <td style={{ ...styles.td, color: "var(--isg-text-muted)", minWidth: 160 }}>{plan.notes || "—"}</td>
                        <td style={styles.td} className="isg-td"><button style={styles.btnDanger} onClick={() => deleteAnnualPlan(plan.id)}>Sil</button></td>
                      </tr>
                    );
                  })}
                  {filteredAnnualPlans.length === 0 && (
                    <tr>
                      <td colSpan={9} style={{ ...styles.td, color: "var(--isg-text-muted)", textAlign: "center", padding: 24 }}>Henüz yıllık plan kalemi yok.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === "egitimler" && (
          <div>
            <div style={styles.card} className="isg-card">
              <p style={styles.sectionTitle} className="isg-text-muted">Eğitim Yönetimi</p>
              <div style={styles.formGrid}>
                <FormField label="Firma *">
                  <select
                    style={styles.select}
                    className="isg-input"
                    value={newTraining.companyId}
                    onChange={e => setNewTraining({ ...newTraining, companyId: e.target.value, participantIds: [] })}
                  >
                    <option value="">Seçin...</option>
                    {companies.map(c => <option key={c.id} value={c.id}>{c.nickName}</option>)}
                  </select>
                </FormField>
                <FormField label="Eğitim Türü">
                  <select style={styles.select} className="isg-input" value={newTraining.type} onChange={e => setNewTraining({ ...newTraining, type: e.target.value as TrainingType })}>
                    <option>Temel İSG Eğitimi</option>
                    <option>İşe Giriş Eğitimi</option>
                    <option>Yenileme Eğitimi</option>
                    <option>Acil Durum Eğitimi</option>
                    <option>KKD Eğitimi</option>
                    <option>Hijyen Eğitimi</option>
                  </select>
                </FormField>
                <FormField label="Eğitim Başlığı *"><input style={styles.input} className="isg-input" value={newTraining.title} onChange={e => setNewTraining({ ...newTraining, title: e.target.value })} placeholder="Örn. Yeni başlayan personel eğitimi" /></FormField>
                <FormField label="Eğitim Tarihi *"><DatePicker value={newTraining.trainingDate} onChange={v => setNewTraining({ ...newTraining, trainingDate: v })} /></FormField>
                <FormField label="Süre (Saat)"><input style={styles.input} className="isg-input" value={newTraining.durationHours} onChange={e => setNewTraining({ ...newTraining, durationHours: e.target.value })} placeholder="Örn. 4" /></FormField>
                <FormField label="Eğitim Yeri"><input style={styles.input} className="isg-input" value={newTraining.location} onChange={e => setNewTraining({ ...newTraining, location: e.target.value })} placeholder="Toplantı salonu, saha..." /></FormField>
                <FormField label="Eğitmen / Sorumlu"><input style={styles.input} className="isg-input" value={newTraining.trainer} onChange={e => setNewTraining({ ...newTraining, trainer: e.target.value })} placeholder="Eğitimi veren kişi" /></FormField>
                <FormField label="Durum">
                  <select style={styles.select} className="isg-input" value={newTraining.status} onChange={e => setNewTraining({ ...newTraining, status: e.target.value as TrainingStatus })}>
                    <option>Planlandı</option>
                    <option>Tamamlandı</option>
                    <option>İptal</option>
                  </select>
                </FormField>
                <FormField label="Not"><input style={styles.input} className="isg-input" value={newTraining.notes} onChange={e => setNewTraining({ ...newTraining, notes: e.target.value })} placeholder="Kısa açıklama" /></FormField>
              </div>

              <div style={{ marginTop: 18 }}>
                <div style={{ ...styles.label, marginBottom: 8 }} className="isg-label">Katılımcılar</div>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                  {employees.filter(employee => employee.companyId === newTraining.companyId).map(employee => {
                    const checked = newTraining.participantIds.includes(employee.id);
                    return (
                      <button
                        key={employee.id}
                        type="button"
                        onClick={() => toggleTrainingParticipant(employee.id)}
                        style={{
                          border: checked ? "1px solid color-mix(in srgb, var(--isg-accent) 72%, white)" : "1px solid var(--isg-border)",
                          backgroundColor: checked ? "rgba(104, 211, 180, 0.16)" : "var(--isg-input-bg)",
                          color: checked ? "var(--isg-accent)" : "var(--isg-text-muted)",
                          borderRadius: 8,
                          padding: "8px 11px",
                          fontSize: 12,
                          fontWeight: 700,
                          cursor: "pointer",
                        }}
                      >
                        {checked ? "✓ " : ""}{employee.firstName} {employee.lastName}
                      </button>
                    );
                  })}
                  {!newTraining.companyId && <span style={{ color: "var(--isg-text-muted)", fontSize: 13 }}>Katılımcı seçmek için önce firma seçin.</span>}
                  {newTraining.companyId && employees.filter(employee => employee.companyId === newTraining.companyId).length === 0 && (
                    <span style={{ color: "var(--isg-text-muted)", fontSize: 13 }}>Bu firmaya kayıtlı personel bulunamadı.</span>
                  )}
                </div>
              </div>

              <div style={{ marginTop: 14, display: "flex", gap: 10, flexWrap: "wrap" }}>
                <button style={styles.btnPrimary} onClick={addTraining}>Eğitim Kaydı Ekle</button>
                <button style={styles.btnSecondary} onClick={() => generateTrainingPDF(filteredTrainings, companies, employees)}>PDF İndir</button>
              </div>
            </div>

            <div style={styles.searchBar}>
              <input style={{ ...styles.input, maxWidth: 300 }} placeholder="Ara..." value={search} onChange={e => setSearch(e.target.value)} />
              <select style={{ ...styles.select, maxWidth: 180 }} value={selectedCompanyId} onChange={e => setSelectedCompanyId(e.target.value)}><option value="all">Tüm Firmalar</option>{companies.map(c => <option key={c.id} value={c.id}>{c.nickName}</option>)}</select>
              <span style={{ color: "var(--isg-text-muted)", fontSize: 13 }}>{filteredTrainings.length} eğitim</span>
            </div>

            <div style={{ ...styles.card, padding: 0, overflow: "auto", WebkitOverflowScrolling: "touch" as any }}>
              <table style={styles.table}>
                <thead><tr>{["Firma", "Eğitim", "Tür", "Tarih", "Süre / Yer", "Eğitmen", "Katılımcı", "Durum", "Not", "Çıktılar", "İşlem"].map(h => <th key={h} style={styles.th} className="isg-th">{h}</th>)}</tr></thead>
                <tbody>
                  {filteredTrainings.map(training => {
                    const company = companies.find(c => c.id === training.companyId);
                    const participants = training.participantIds
                      .map(id => employees.find(employee => employee.id === id))
                      .filter(Boolean)
                      .map(employee => `${employee!.firstName} ${employee!.lastName}`);
                    return (
                      <tr key={training.id}>
                        <td style={styles.td} className="isg-td">{company?.nickName || "—"}</td>
                        <td style={{ ...styles.td, minWidth: 180 }} className="isg-td"><strong>{training.title}</strong></td>
                        <td style={styles.td} className="isg-td"><Badge text={training.type} color="#8b5cf6" /></td>
                        <td style={styles.td} className="isg-td">{training.trainingDate ? new Date(training.trainingDate).toLocaleDateString("tr-TR") : "—"}</td>
                        <td style={styles.td} className="isg-td">{training.durationHours || training.location ? `${training.durationHours || "—"} saat / ${training.location || "—"}` : "—"}</td>
                        <td style={styles.td} className="isg-td">{training.trainer || "—"}</td>
                        <td style={{ ...styles.td, minWidth: 180 }} className="isg-td">{participants.length > 0 ? participants.join(", ") : "—"}</td>
                        <td style={styles.td} className="isg-td">
                          <select style={{ ...styles.select, minWidth: 126 }} value={training.status} onChange={e => updateTrainingStatus(training.id, e.target.value as TrainingStatus)}>
                            <option>Planlandı</option>
                            <option>Tamamlandı</option>
                            <option>İptal</option>
                          </select>
                        </td>
                        <td style={{ ...styles.td, color: "var(--isg-text-muted)", minWidth: 150 }}>{training.notes || "—"}</td>
                        <td style={{ ...styles.td, minWidth: 190 }} className="isg-td">
                          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                            <button style={styles.btnSecondary} onClick={() => generateTrainingAttendancePDF(training, company, employees)}>Katılım Formu</button>
                            <button style={styles.btnSecondary} onClick={() => generateTrainingCertificatesPDF(training, company, employees)}>Sertifika</button>
                          </div>
                        </td>
                        <td style={styles.td} className="isg-td"><button style={styles.btnDanger} onClick={() => deleteTraining(training.id)}>Sil</button></td>
                      </tr>
                    );
                  })}
                  {filteredTrainings.length === 0 && (
                    <tr>
                      <td colSpan={11} style={{ ...styles.td, color: "var(--isg-text-muted)", textAlign: "center", padding: 24 }}>Henüz eğitim kaydı yok.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === "kkd-formu" && (
          <div>
            <div style={styles.card} className="isg-card">
              <p style={styles.sectionTitle} className="isg-text-muted">KKD Zimmet Formu</p>
              <div style={styles.formGrid}>
                <FormField label="Firma *">
                  <select style={styles.select} className="isg-input" value={newPpe.companyId} onChange={e => setNewPpe({ ...newPpe, companyId: e.target.value, employeeId: "" })}>
                    <option value="">Seçin...</option>
                    {companies.map(c => <option key={c.id} value={c.id}>{c.nickName}</option>)}
                  </select>
                </FormField>
                <FormField label="Personel *">
                  <select style={styles.select} className="isg-input" value={newPpe.employeeId} onChange={e => setNewPpe({ ...newPpe, employeeId: e.target.value })}>
                    <option value="">Seçin...</option>
                    {employees.filter(employee => employee.companyId === newPpe.companyId).map(employee => <option key={employee.id} value={employee.id}>{employee.firstName} {employee.lastName}</option>)}
                  </select>
                </FormField>
                <FormField label="KKD / Malzeme *">
                  <select style={styles.select} className="isg-input" value={newPpe.equipment} onChange={e => setNewPpe({ ...newPpe, equipment: e.target.value })}>
                    <option>Baret</option>
                    <option>İş Ayakkabısı</option>
                    <option>Koruyucu Gözlük</option>
                    <option>Kulak Koruyucu</option>
                    <option>İş Eldiveni</option>
                    <option>Reflektörlü Yelek</option>
                    <option>Emniyet Kemeri</option>
                    <option>Toz Maskesi</option>
                    <option>Diğer</option>
                  </select>
                </FormField>
                <FormField label="Adet"><input style={styles.input} className="isg-input" type="number" min="1" value={newPpe.quantity} onChange={e => setNewPpe({ ...newPpe, quantity: e.target.value })} /></FormField>
                <FormField label="Teslim Tarihi *"><DatePicker value={newPpe.issueDate} onChange={v => setNewPpe({ ...newPpe, issueDate: v })} /></FormField>
                <FormField label="İade Tarihi"><DatePicker value={newPpe.returnDate} onChange={v => setNewPpe({ ...newPpe, returnDate: v })} /></FormField>
                <FormField label="Durum">
                  <select style={styles.select} className="isg-input" value={newPpe.status} onChange={e => setNewPpe({ ...newPpe, status: e.target.value as PpeStatus })}>
                    <option>Teslim Edildi</option>
                    <option>İade Edildi</option>
                    <option>Hasarlı / Kayıp</option>
                  </select>
                </FormField>
                <FormField label="Seri No"><input style={styles.input} className="isg-input" value={newPpe.serialNo} onChange={e => setNewPpe({ ...newPpe, serialNo: e.target.value })} placeholder="Varsa seri / beden / özellik" /></FormField>
                <FormField label="Not"><input style={styles.input} className="isg-input" value={newPpe.notes} onChange={e => setNewPpe({ ...newPpe, notes: e.target.value })} placeholder="Kullanım talimatı, beden, marka..." /></FormField>
              </div>
              <div style={{ marginTop: 12, display: "flex", gap: 10, flexWrap: "wrap" }}>
                <button style={styles.btnPrimary} onClick={addPpeRecord}>KKD Kaydı Ekle</button>
              </div>
            </div>

            <div style={styles.searchBar}>
              <input style={{ ...styles.input, maxWidth: 300 }} placeholder="Ara..." value={search} onChange={e => setSearch(e.target.value)} />
              <select style={{ ...styles.select, maxWidth: 180 }} value={selectedCompanyId} onChange={e => setSelectedCompanyId(e.target.value)}><option value="all">Tüm Firmalar</option>{companies.map(c => <option key={c.id} value={c.id}>{c.nickName}</option>)}</select>
              <span style={{ color: "var(--isg-text-muted)", fontSize: 13 }}>{filteredPpeRecords.length} KKD kaydı</span>
            </div>

            <div style={{ ...styles.card, padding: 0, overflow: "auto", WebkitOverflowScrolling: "touch" as any }}>
              <table style={styles.table}>
                <thead><tr>{["Firma", "Personel", "KKD", "Adet", "Teslim", "İade", "Durum", "Seri / Not", "Çıktı", "İşlem"].map(h => <th key={h} style={styles.th} className="isg-th">{h}</th>)}</tr></thead>
                <tbody>
                  {filteredPpeRecords.map(record => {
                    const company = companies.find(c => c.id === record.companyId);
                    const employee = employees.find(e => e.id === record.employeeId);
                    return (
                      <tr key={record.id}>
                        <td style={styles.td} className="isg-td">{company?.nickName || "—"}</td>
                        <td style={styles.td} className="isg-td"><strong>{employee ? `${employee.firstName} ${employee.lastName}` : "—"}</strong></td>
                        <td style={styles.td} className="isg-td"><Badge text={record.equipment} color="#f59e0b" /></td>
                        <td style={styles.td} className="isg-td">{record.quantity}</td>
                        <td style={styles.td} className="isg-td">{record.issueDate ? new Date(record.issueDate).toLocaleDateString("tr-TR") : "—"}</td>
                        <td style={styles.td} className="isg-td">{record.returnDate ? new Date(record.returnDate).toLocaleDateString("tr-TR") : "—"}</td>
                        <td style={styles.td} className="isg-td">
                          <select style={{ ...styles.select, minWidth: 142 }} value={record.status} onChange={e => updatePpeStatus(record.id, e.target.value as PpeStatus)}>
                            <option>Teslim Edildi</option>
                            <option>İade Edildi</option>
                            <option>Hasarlı / Kayıp</option>
                          </select>
                        </td>
                        <td style={{ ...styles.td, minWidth: 170, color: "var(--isg-text-muted)" }} className="isg-td">{[record.serialNo, record.notes].filter(Boolean).join(" / ") || "—"}</td>
                        <td style={styles.td} className="isg-td"><button style={styles.btnSecondary} onClick={() => generatePpeAssignmentPDF(record, company, employee)}>Zimmet PDF</button></td>
                        <td style={styles.td} className="isg-td"><button style={styles.btnDanger} onClick={() => deletePpeRecord(record.id)}>Sil</button></td>
                      </tr>
                    );
                  })}
                  {filteredPpeRecords.length === 0 && (
                    <tr>
                      <td colSpan={10} style={{ ...styles.td, color: "var(--isg-text-muted)", textAlign: "center", padding: 24 }}>Henüz KKD kaydı yok.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === "acil-durum-plani" && (
          <div>
            <div style={styles.card} className="isg-card">
              <p style={styles.sectionTitle} className="isg-text-muted">Acil Durum Planı</p>
              <div style={styles.formGrid}>
                <FormField label="Firma *">
                  <select style={styles.select} className="isg-input" value={newEmergencyPlan.companyId} onChange={e => setNewEmergencyPlan({ ...newEmergencyPlan, companyId: e.target.value })}>
                    <option value="">Seçin...</option>
                    {companies.map(c => <option key={c.id} value={c.id}>{c.nickName}</option>)}
                  </select>
                </FormField>
                <FormField label="Plan Başlığı *"><input style={styles.input} className="isg-input" value={newEmergencyPlan.title} onChange={e => setNewEmergencyPlan({ ...newEmergencyPlan, title: e.target.value })} placeholder="Örn. Otel yangın acil durum planı" /></FormField>
                <FormField label="Senaryo">
                  <select style={styles.select} className="isg-input" value={newEmergencyPlan.scenario} onChange={e => setNewEmergencyPlan({ ...newEmergencyPlan, scenario: e.target.value })}>
                    <option>Yangın</option>
                    <option>Deprem</option>
                    <option>Kimyasal Sızıntı</option>
                    <option>Elektrik Kesintisi</option>
                    <option>İlk Yardım / Yaralanma</option>
                    <option>Tahliye</option>
                    <option>Diğer</option>
                  </select>
                </FormField>
                <FormField label="Toplanma Alanı"><input style={styles.input} className="isg-input" value={newEmergencyPlan.assemblyArea} onChange={e => setNewEmergencyPlan({ ...newEmergencyPlan, assemblyArea: e.target.value })} placeholder="Örn. Ana otopark A noktası" /></FormField>
                <FormField label="Plan Tarihi *"><DatePicker value={newEmergencyPlan.planDate} onChange={v => setNewEmergencyPlan({ ...newEmergencyPlan, planDate: v })} /></FormField>
                <FormField label="Tatbikat Tarihi"><DatePicker value={newEmergencyPlan.drillDate} onChange={v => setNewEmergencyPlan({ ...newEmergencyPlan, drillDate: v })} /></FormField>
                <FormField label="Sorumlu"><input style={styles.input} className="isg-input" value={newEmergencyPlan.responsible} onChange={e => setNewEmergencyPlan({ ...newEmergencyPlan, responsible: e.target.value })} placeholder="Acil durum koordinatörü" /></FormField>
                <FormField label="Durum">
                  <select style={styles.select} className="isg-input" value={newEmergencyPlan.status} onChange={e => setNewEmergencyPlan({ ...newEmergencyPlan, status: e.target.value as EmergencyPlanStatus })}>
                    <option>Taslak</option>
                    <option>Yürürlükte</option>
                    <option>Tatbikat Planlandı</option>
                    <option>Güncelleme Gerekli</option>
                  </select>
                </FormField>
                <FormField label="Acil Durum Ekibi"><input style={styles.input} className="isg-input" value={newEmergencyPlan.emergencyTeam} onChange={e => setNewEmergencyPlan({ ...newEmergencyPlan, emergencyTeam: e.target.value })} placeholder="Söndürme, kurtarma, ilk yardım ekibi..." /></FormField>
                <FormField label="Not"><input style={styles.input} className="isg-input" value={newEmergencyPlan.notes} onChange={e => setNewEmergencyPlan({ ...newEmergencyPlan, notes: e.target.value })} placeholder="Tahliye, iletişim, özel riskler..." /></FormField>
              </div>
              <div style={{ marginTop: 12, display: "flex", gap: 10, flexWrap: "wrap" }}>
                <button style={styles.btnPrimary} onClick={addEmergencyPlan}>Acil Durum Planı Ekle</button>
              </div>
            </div>

            <div style={styles.searchBar}>
              <input style={{ ...styles.input, maxWidth: 300 }} placeholder="Ara..." value={search} onChange={e => setSearch(e.target.value)} />
              <select style={{ ...styles.select, maxWidth: 180 }} value={selectedCompanyId} onChange={e => setSelectedCompanyId(e.target.value)}><option value="all">Tüm Firmalar</option>{companies.map(c => <option key={c.id} value={c.id}>{c.nickName}</option>)}</select>
              <span style={{ color: "var(--isg-text-muted)", fontSize: 13 }}>{filteredEmergencyPlans.length} plan</span>
            </div>

            <div style={{ ...styles.card, padding: 0, overflow: "auto", WebkitOverflowScrolling: "touch" as any }}>
              <table style={styles.table}>
                <thead><tr>{["Firma", "Başlık", "Senaryo", "Toplanma Alanı", "Plan", "Tatbikat", "Sorumlu", "Durum", "Ekip / Not", "Çıktı", "İşlem"].map(h => <th key={h} style={styles.th} className="isg-th">{h}</th>)}</tr></thead>
                <tbody>
                  {filteredEmergencyPlans.map(plan => {
                    const company = companies.find(c => c.id === plan.companyId);
                    return (
                      <tr key={plan.id}>
                        <td style={styles.td} className="isg-td">{company?.nickName || "—"}</td>
                        <td style={{ ...styles.td, minWidth: 170 }} className="isg-td"><strong>{plan.title}</strong></td>
                        <td style={styles.td} className="isg-td"><Badge text={plan.scenario} color="#f97316" /></td>
                        <td style={styles.td} className="isg-td">{plan.assemblyArea || "—"}</td>
                        <td style={styles.td} className="isg-td">{plan.planDate ? new Date(plan.planDate).toLocaleDateString("tr-TR") : "—"}</td>
                        <td style={styles.td} className="isg-td">{plan.drillDate ? new Date(plan.drillDate).toLocaleDateString("tr-TR") : "—"}</td>
                        <td style={styles.td} className="isg-td">{plan.responsible || "—"}</td>
                        <td style={styles.td} className="isg-td">
                          <select style={{ ...styles.select, minWidth: 150 }} value={plan.status} onChange={e => updateEmergencyPlanStatus(plan.id, e.target.value as EmergencyPlanStatus)}>
                            <option>Taslak</option>
                            <option>Yürürlükte</option>
                            <option>Tatbikat Planlandı</option>
                            <option>Güncelleme Gerekli</option>
                          </select>
                        </td>
                        <td style={{ ...styles.td, minWidth: 210, color: "var(--isg-text-muted)" }} className="isg-td">{[plan.emergencyTeam, plan.notes].filter(Boolean).join(" / ") || "—"}</td>
                        <td style={styles.td} className="isg-td"><button style={styles.btnSecondary} onClick={() => generateEmergencyPlanPDF(plan, company, employees)}>Plan PDF</button></td>
                        <td style={styles.td} className="isg-td"><button style={styles.btnDanger} onClick={() => deleteEmergencyPlan(plan.id)}>Sil</button></td>
                      </tr>
                    );
                  })}
                  {filteredEmergencyPlans.length === 0 && (
                    <tr>
                      <td colSpan={11} style={{ ...styles.td, color: "var(--isg-text-muted)", textAlign: "center", padding: 24 }}>Henüz acil durum planı yok.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === "kurul-toplantisi" && (
          <div>
            <div style={styles.card} className="isg-card">
              <p style={styles.sectionTitle} className="isg-text-muted">Kurul Toplantısı</p>
              <div style={styles.formGrid}>
                <FormField label="Firma *">
                  <select
                    style={styles.select}
                    className="isg-input"
                    value={newCommitteeMeeting.companyId}
                    onChange={e => setNewCommitteeMeeting({ ...newCommitteeMeeting, companyId: e.target.value, participantIds: [] })}
                  >
                    <option value="">Seçin...</option>
                    {companies.map(c => <option key={c.id} value={c.id}>{c.nickName}</option>)}
                  </select>
                </FormField>
                <FormField label="Toplantı No"><input style={styles.input} className="isg-input" value={newCommitteeMeeting.meetingNo} onChange={e => setNewCommitteeMeeting({ ...newCommitteeMeeting, meetingNo: e.target.value })} placeholder="Örn. 2026/01" /></FormField>
                <FormField label="Toplantı Tarihi *"><DatePicker value={newCommitteeMeeting.meetingDate} onChange={v => setNewCommitteeMeeting({ ...newCommitteeMeeting, meetingDate: v })} /></FormField>
                <FormField label="Toplantı Yeri"><input style={styles.input} className="isg-input" value={newCommitteeMeeting.location} onChange={e => setNewCommitteeMeeting({ ...newCommitteeMeeting, location: e.target.value })} placeholder="Toplantı salonu" /></FormField>
                <FormField label="Kurul Başkanı"><input style={styles.input} className="isg-input" value={newCommitteeMeeting.chairperson} onChange={e => setNewCommitteeMeeting({ ...newCommitteeMeeting, chairperson: e.target.value })} placeholder="Ad Soyad" /></FormField>
                <FormField label="Durum">
                  <select style={styles.select} className="isg-input" value={newCommitteeMeeting.status} onChange={e => setNewCommitteeMeeting({ ...newCommitteeMeeting, status: e.target.value as CommitteeMeetingStatus })}>
                    <option>Planlandı</option>
                    <option>Yapıldı</option>
                    <option>Ertelendi</option>
                    <option>Kararlar Takipte</option>
                  </select>
                </FormField>
                <FormField label="Gündem"><input style={styles.input} className="isg-input" value={newCommitteeMeeting.agenda} onChange={e => setNewCommitteeMeeting({ ...newCommitteeMeeting, agenda: e.target.value })} placeholder="Gündem maddeleri" /></FormField>
                <FormField label="Alınan Kararlar"><input style={styles.input} className="isg-input" value={newCommitteeMeeting.decisions} onChange={e => setNewCommitteeMeeting({ ...newCommitteeMeeting, decisions: e.target.value })} placeholder="Kararlar ve aksiyonlar" /></FormField>
                <FormField label="Not"><input style={styles.input} className="isg-input" value={newCommitteeMeeting.notes} onChange={e => setNewCommitteeMeeting({ ...newCommitteeMeeting, notes: e.target.value })} placeholder="Takip, sorumlu, termin..." /></FormField>
              </div>

              <div style={{ marginTop: 18 }}>
                <div style={{ ...styles.label, marginBottom: 8 }} className="isg-label">Katılımcılar</div>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                  {employees.filter(employee => employee.companyId === newCommitteeMeeting.companyId).map(employee => {
                    const checked = newCommitteeMeeting.participantIds.includes(employee.id);
                    return (
                      <button
                        key={employee.id}
                        type="button"
                        onClick={() => toggleCommitteeParticipant(employee.id)}
                        style={{
                          border: checked ? "1px solid color-mix(in srgb, var(--isg-accent) 72%, white)" : "1px solid var(--isg-border)",
                          backgroundColor: checked ? "rgba(104, 211, 180, 0.16)" : "var(--isg-input-bg)",
                          color: checked ? "var(--isg-accent)" : "var(--isg-text-muted)",
                          borderRadius: 8,
                          padding: "8px 11px",
                          fontSize: 12,
                          fontWeight: 700,
                          cursor: "pointer",
                        }}
                      >
                        {checked ? "✓ " : ""}{employee.firstName} {employee.lastName}
                      </button>
                    );
                  })}
                  {!newCommitteeMeeting.companyId && <span style={{ color: "var(--isg-text-muted)", fontSize: 13 }}>Katılımcı seçmek için önce firma seçin.</span>}
                  {newCommitteeMeeting.companyId && employees.filter(employee => employee.companyId === newCommitteeMeeting.companyId).length === 0 && (
                    <span style={{ color: "var(--isg-text-muted)", fontSize: 13 }}>Bu firmaya kayıtlı personel bulunamadı.</span>
                  )}
                </div>
              </div>

              <div style={{ marginTop: 14, display: "flex", gap: 10, flexWrap: "wrap" }}>
                <button style={styles.btnPrimary} onClick={addCommitteeMeeting}>Toplantı Kaydı Ekle</button>
              </div>
            </div>

            <div style={styles.searchBar}>
              <input style={{ ...styles.input, maxWidth: 300 }} placeholder="Ara..." value={search} onChange={e => setSearch(e.target.value)} />
              <select style={{ ...styles.select, maxWidth: 180 }} value={selectedCompanyId} onChange={e => setSelectedCompanyId(e.target.value)}><option value="all">Tüm Firmalar</option>{companies.map(c => <option key={c.id} value={c.id}>{c.nickName}</option>)}</select>
              <span style={{ color: "var(--isg-text-muted)", fontSize: 13 }}>{filteredCommitteeMeetings.length} toplantı</span>
            </div>

            <div style={{ ...styles.card, padding: 0, overflow: "auto", WebkitOverflowScrolling: "touch" as any }}>
              <table style={styles.table}>
                <thead><tr>{["Firma", "No", "Tarih", "Yer", "Başkan", "Katılımcı", "Durum", "Gündem / Kararlar", "Çıktı", "İşlem"].map(h => <th key={h} style={styles.th} className="isg-th">{h}</th>)}</tr></thead>
                <tbody>
                  {filteredCommitteeMeetings.map(meeting => {
                    const company = companies.find(c => c.id === meeting.companyId);
                    const participants = meeting.participantIds
                      .map(id => employees.find(employee => employee.id === id))
                      .filter(Boolean)
                      .map(employee => `${employee!.firstName} ${employee!.lastName}`);
                    return (
                      <tr key={meeting.id}>
                        <td style={styles.td} className="isg-td">{company?.nickName || "—"}</td>
                        <td style={styles.td} className="isg-td">{meeting.meetingNo || "—"}</td>
                        <td style={styles.td} className="isg-td">{meeting.meetingDate ? new Date(meeting.meetingDate).toLocaleDateString("tr-TR") : "—"}</td>
                        <td style={styles.td} className="isg-td">{meeting.location || "—"}</td>
                        <td style={styles.td} className="isg-td">{meeting.chairperson || "—"}</td>
                        <td style={{ ...styles.td, minWidth: 180 }} className="isg-td">{participants.length > 0 ? participants.join(", ") : "—"}</td>
                        <td style={styles.td} className="isg-td">
                          <select style={{ ...styles.select, minWidth: 140 }} value={meeting.status} onChange={e => updateCommitteeMeetingStatus(meeting.id, e.target.value as CommitteeMeetingStatus)}>
                            <option>Planlandı</option>
                            <option>Yapıldı</option>
                            <option>Ertelendi</option>
                            <option>Kararlar Takipte</option>
                          </select>
                        </td>
                        <td style={{ ...styles.td, minWidth: 230, color: "var(--isg-text-muted)" }} className="isg-td">{[meeting.agenda, meeting.decisions, meeting.notes].filter(Boolean).join(" / ") || "—"}</td>
                        <td style={styles.td} className="isg-td"><button style={styles.btnSecondary} onClick={() => generateCommitteeMeetingPDF(meeting, company, employees)}>Tutanak PDF</button></td>
                        <td style={styles.td} className="isg-td"><button style={styles.btnDanger} onClick={() => deleteCommitteeMeeting(meeting.id)}>Sil</button></td>
                      </tr>
                    );
                  })}
                  {filteredCommitteeMeetings.length === 0 && (
                    <tr>
                      <td colSpan={10} style={{ ...styles.td, color: "var(--isg-text-muted)", textAlign: "center", padding: 24 }}>Henüz kurul toplantısı kaydı yok.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === "is-kazasi-raporu" && (
          <div>
            <div style={styles.card} className="isg-card">
              <p style={styles.sectionTitle} className="isg-text-muted">İş Kazası / Ramak Kala Raporu</p>
              <div style={styles.formGrid}>
                <FormField label="Firma *">
                  <select style={styles.select} className="isg-input" value={newAccidentReport.companyId} onChange={e => setNewAccidentReport({ ...newAccidentReport, companyId: e.target.value, employeeId: "" })}>
                    <option value="">Seçin...</option>
                    {companies.map(c => <option key={c.id} value={c.id}>{c.nickName}</option>)}
                  </select>
                </FormField>
                <FormField label="Personel">
                  <select style={styles.select} className="isg-input" value={newAccidentReport.employeeId} onChange={e => setNewAccidentReport({ ...newAccidentReport, employeeId: e.target.value })}>
                    <option value="">Seçin...</option>
                    {employees.filter(employee => employee.companyId === newAccidentReport.companyId).map(employee => <option key={employee.id} value={employee.id}>{employee.firstName} {employee.lastName}</option>)}
                  </select>
                </FormField>
                <FormField label="Olay Tarihi *"><DatePicker value={newAccidentReport.accidentDate} onChange={v => setNewAccidentReport({ ...newAccidentReport, accidentDate: v })} /></FormField>
                <FormField label="Olay Yeri"><input style={styles.input} className="isg-input" value={newAccidentReport.location} onChange={e => setNewAccidentReport({ ...newAccidentReport, location: e.target.value })} placeholder="Bölüm, saha, alan..." /></FormField>
                <FormField label="Olay Türü">
                  <select style={styles.select} className="isg-input" value={newAccidentReport.incidentType} onChange={e => setNewAccidentReport({ ...newAccidentReport, incidentType: e.target.value })}>
                    <option>İş Kazası</option>
                    <option>Ramak Kala</option>
                    <option>Meslek Hastalığı Şüphesi</option>
                    <option>Malzeme Hasarı</option>
                    <option>Diğer</option>
                  </select>
                </FormField>
                <FormField label="Şiddet">
                  <select style={styles.select} className="isg-input" value={newAccidentReport.severity} onChange={e => setNewAccidentReport({ ...newAccidentReport, severity: e.target.value as AccidentSeverity })}>
                    <option>Ramak Kala</option>
                    <option>Hafif</option>
                    <option>Orta</option>
                    <option>Ağır</option>
                  </select>
                </FormField>
                <FormField label="Durum">
                  <select style={styles.select} className="isg-input" value={newAccidentReport.status} onChange={e => setNewAccidentReport({ ...newAccidentReport, status: e.target.value as AccidentReportStatus })}>
                    <option>Açık</option>
                    <option>İncelemede</option>
                    <option>Aksiyon Planlandı</option>
                    <option>Kapandı</option>
                  </select>
                </FormField>
                <FormField label="Aksiyon Sorumlusu"><input style={styles.input} className="isg-input" value={newAccidentReport.responsible} onChange={e => setNewAccidentReport({ ...newAccidentReport, responsible: e.target.value })} placeholder="Ad Soyad / birim" /></FormField>
                <FormField label="Termin"><DatePicker value={newAccidentReport.dueDate} onChange={v => setNewAccidentReport({ ...newAccidentReport, dueDate: v })} /></FormField>
                <FormField label="Olay Açıklaması *"><input style={styles.input} className="isg-input" value={newAccidentReport.description} onChange={e => setNewAccidentReport({ ...newAccidentReport, description: e.target.value })} placeholder="Olay nasıl gerçekleşti?" /></FormField>
                <FormField label="Kök Neden"><input style={styles.input} className="isg-input" value={newAccidentReport.rootCause} onChange={e => setNewAccidentReport({ ...newAccidentReport, rootCause: e.target.value })} placeholder="Ekipman, eğitim, ortam, davranış..." /></FormField>
                <FormField label="Aksiyon Planı"><input style={styles.input} className="isg-input" value={newAccidentReport.actionPlan} onChange={e => setNewAccidentReport({ ...newAccidentReport, actionPlan: e.target.value })} placeholder="Alınacak önlemler" /></FormField>
                <FormField label="Not"><input style={styles.input} className="isg-input" value={newAccidentReport.notes} onChange={e => setNewAccidentReport({ ...newAccidentReport, notes: e.target.value })} placeholder="Ek açıklamalar" /></FormField>
              </div>
              <div style={{ marginTop: 12, display: "flex", gap: 10, flexWrap: "wrap" }}>
                <button style={styles.btnPrimary} onClick={addAccidentReport}>Rapor Kaydı Ekle</button>
              </div>
            </div>

            <div style={styles.searchBar}>
              <input style={{ ...styles.input, maxWidth: 300 }} placeholder="Ara..." value={search} onChange={e => setSearch(e.target.value)} />
              <select style={{ ...styles.select, maxWidth: 180 }} value={selectedCompanyId} onChange={e => setSelectedCompanyId(e.target.value)}><option value="all">Tüm Firmalar</option>{companies.map(c => <option key={c.id} value={c.id}>{c.nickName}</option>)}</select>
              <span style={{ color: "var(--isg-text-muted)", fontSize: 13 }}>{filteredAccidentReports.length} rapor</span>
            </div>

            <div style={{ ...styles.card, padding: 0, overflow: "auto", WebkitOverflowScrolling: "touch" as any }}>
              <table style={styles.table}>
                <thead><tr>{["Firma", "Personel", "Tarih", "Yer", "Tür", "Şiddet", "Durum", "Açıklama / Aksiyon", "Çıktı", "İşlem"].map(h => <th key={h} style={styles.th} className="isg-th">{h}</th>)}</tr></thead>
                <tbody>
                  {filteredAccidentReports.map(report => {
                    const company = companies.find(c => c.id === report.companyId);
                    const employee = employees.find(e => e.id === report.employeeId);
                    return (
                      <tr key={report.id}>
                        <td style={styles.td} className="isg-td">{company?.nickName || "—"}</td>
                        <td style={styles.td} className="isg-td">{employee ? `${employee.firstName} ${employee.lastName}` : "—"}</td>
                        <td style={styles.td} className="isg-td">{report.accidentDate ? new Date(report.accidentDate).toLocaleDateString("tr-TR") : "—"}</td>
                        <td style={styles.td} className="isg-td">{report.location || "—"}</td>
                        <td style={styles.td} className="isg-td"><Badge text={report.incidentType} color="#ef4444" /></td>
                        <td style={styles.td} className="isg-td"><Badge text={report.severity} color={report.severity === "Ağır" ? "#dc2626" : report.severity === "Orta" ? "#d97706" : "#16a34a"} /></td>
                        <td style={styles.td} className="isg-td">
                          <select style={{ ...styles.select, minWidth: 150 }} value={report.status} onChange={e => updateAccidentReportStatus(report.id, e.target.value as AccidentReportStatus)}>
                            <option>Açık</option>
                            <option>İncelemede</option>
                            <option>Aksiyon Planlandı</option>
                            <option>Kapandı</option>
                          </select>
                        </td>
                        <td style={{ ...styles.td, minWidth: 260, color: "var(--isg-text-muted)" }} className="isg-td">{[report.description, report.rootCause, report.actionPlan].filter(Boolean).join(" / ") || "—"}</td>
                        <td style={styles.td} className="isg-td"><button style={styles.btnSecondary} onClick={() => generateAccidentReportPDF(report, company, employee)}>Rapor PDF</button></td>
                        <td style={styles.td} className="isg-td"><button style={styles.btnDanger} onClick={() => deleteAccidentReport(report.id)}>Sil</button></td>
                      </tr>
                    );
                  })}
                  {filteredAccidentReports.length === 0 && (
                    <tr>
                      <td colSpan={10} style={{ ...styles.td, color: "var(--isg-text-muted)", textAlign: "center", padding: 24 }}>Henüz iş kazası / ramak kala raporu yok.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === "firma-ziyaretleri" && (
          <div>
            <div style={styles.card} className="isg-card">
              <p style={styles.sectionTitle} className="isg-text-muted">Firma Ziyareti Planla</p>
              <div style={styles.formGrid}>
                <FormField label="Firma *">
                  <select style={styles.select} className="isg-input" value={newCompanyVisit.companyId} onChange={e => setNewCompanyVisit({ ...newCompanyVisit, companyId: e.target.value })}>
                    <option value="">Seçin...</option>
                    {companies.map(c => <option key={c.id} value={c.id}>{c.nickName}</option>)}
                  </select>
                </FormField>
                <FormField label="Ziyaret Tarihi *"><DatePicker value={newCompanyVisit.visitDate} onChange={v => setNewCompanyVisit({ ...newCompanyVisit, visitDate: v })} /></FormField>
                <FormField label="Ziyaret Amacı">
                  <select style={styles.select} className="isg-input" value={newCompanyVisit.purpose} onChange={e => setNewCompanyVisit({ ...newCompanyVisit, purpose: e.target.value as CompanyVisitPurpose })}>
                    <option>Rutin Ziyaret</option>
                    <option>Risk Kontrolü</option>
                    <option>Eğitim / Bilgilendirme</option>
                    <option>DÖF Takibi</option>
                    <option>Acil Ziyaret</option>
                  </select>
                </FormField>
                <FormField label="Ziyaret Eden *"><input style={styles.input} className="isg-input" value={newCompanyVisit.visitor} onChange={e => setNewCompanyVisit({ ...newCompanyVisit, visitor: e.target.value })} placeholder="Ad Soyad" /></FormField>
                <FormField label="Görüşülen Kişi"><input style={styles.input} className="isg-input" value={newCompanyVisit.contactedPerson} onChange={e => setNewCompanyVisit({ ...newCompanyVisit, contactedPerson: e.target.value })} placeholder="Firma yetkilisi" /></FormField>
                <FormField label="Durum">
                  <select style={styles.select} className="isg-input" value={newCompanyVisit.status} onChange={e => setNewCompanyVisit({ ...newCompanyVisit, status: e.target.value as CompanyVisitStatus })}>
                    <option>Planlandı</option>
                    <option>Tamamlandı</option>
                    <option>Ertelendi</option>
                    <option>Takip Gerekli</option>
                  </select>
                </FormField>
                <FormField label="Sonraki Ziyaret"><DatePicker value={newCompanyVisit.nextVisitDate} onChange={v => setNewCompanyVisit({ ...newCompanyVisit, nextVisitDate: v })} /></FormField>
                <FormField label="Tespitler"><input style={styles.input} className="isg-input" value={newCompanyVisit.findings} onChange={e => setNewCompanyVisit({ ...newCompanyVisit, findings: e.target.value })} placeholder="Sahada görülen durumlar" /></FormField>
                <FormField label="Aksiyonlar"><input style={styles.input} className="isg-input" value={newCompanyVisit.actions} onChange={e => setNewCompanyVisit({ ...newCompanyVisit, actions: e.target.value })} placeholder="Alınacak aksiyonlar" /></FormField>
                <FormField label="Not"><input style={styles.input} className="isg-input" value={newCompanyVisit.notes} onChange={e => setNewCompanyVisit({ ...newCompanyVisit, notes: e.target.value })} placeholder="Ek açıklama" /></FormField>
              </div>
              <div style={{ marginTop: 12, display: "flex", gap: 10, flexWrap: "wrap" }}>
                <button style={styles.btnPrimary} onClick={addCompanyVisit}>Ziyaret Kaydı Ekle</button>
              </div>
            </div>

            <div style={styles.searchBar}>
              <input style={{ ...styles.input, maxWidth: 300 }} placeholder="Ara..." value={search} onChange={e => setSearch(e.target.value)} />
              <select style={{ ...styles.select, maxWidth: 180 }} value={selectedCompanyId} onChange={e => setSelectedCompanyId(e.target.value)}><option value="all">Tüm Firmalar</option>{companies.map(c => <option key={c.id} value={c.id}>{c.nickName}</option>)}</select>
              <span style={{ color: "var(--isg-text-muted)", fontSize: 13 }}>{filteredCompanyVisits.length} ziyaret</span>
            </div>

            <div style={{ ...styles.card, padding: 0, overflow: "auto", WebkitOverflowScrolling: "touch" as any }}>
              <table style={styles.table}>
                <thead><tr>{["Firma", "Tarih", "Amaç", "Ziyaret Eden", "Görüşülen", "Durum", "Tespit / Aksiyon", "Sonraki", "Çıktı", "İşlem"].map(h => <th key={h} style={styles.th} className="isg-th">{h}</th>)}</tr></thead>
                <tbody>
                  {filteredCompanyVisits.map(visit => {
                    const company = companies.find(c => c.id === visit.companyId);
                    return (
                      <tr key={visit.id}>
                        <td style={styles.td} className="isg-td">{company?.nickName || "—"}</td>
                        <td style={styles.td} className="isg-td">{visit.visitDate ? new Date(visit.visitDate).toLocaleDateString("tr-TR") : "—"}</td>
                        <td style={styles.td} className="isg-td"><Badge text={visit.purpose} color="#0ea5e9" /></td>
                        <td style={styles.td} className="isg-td">{visit.visitor || "—"}</td>
                        <td style={styles.td} className="isg-td">{visit.contactedPerson || "—"}</td>
                        <td style={styles.td} className="isg-td">
                          <select style={{ ...styles.select, minWidth: 150 }} value={visit.status} onChange={e => updateCompanyVisitStatus(visit.id, e.target.value as CompanyVisitStatus)}>
                            <option>Planlandı</option>
                            <option>Tamamlandı</option>
                            <option>Ertelendi</option>
                            <option>Takip Gerekli</option>
                          </select>
                        </td>
                        <td style={{ ...styles.td, minWidth: 260, color: "var(--isg-text-muted)" }} className="isg-td">{[visit.findings, visit.actions, visit.notes].filter(Boolean).join(" / ") || "—"}</td>
                        <td style={styles.td} className="isg-td">{visit.nextVisitDate ? new Date(visit.nextVisitDate).toLocaleDateString("tr-TR") : "—"}</td>
                        <td style={styles.td} className="isg-td"><button style={styles.btnSecondary} onClick={() => generateCompanyVisitPDF(visit, company)}>Ziyaret PDF</button></td>
                        <td style={styles.td} className="isg-td"><button style={styles.btnDanger} onClick={() => deleteCompanyVisit(visit.id)}>Sil</button></td>
                      </tr>
                    );
                  })}
                  {filteredCompanyVisits.length === 0 && (
                    <tr>
                      <td colSpan={10} style={{ ...styles.td, color: "var(--isg-text-muted)", textAlign: "center", padding: 24 }}>Henüz firma ziyareti kaydı yok.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === "arsiv" && (
          <div>
            <div style={styles.statGrid}>
              <div style={styles.statCard} className="isg-stat-card">
                <div style={{ ...styles.statValue, color: "#0ea5e9" }}>{archiveItems.length}</div>
                <div style={styles.statLabel}>Toplam Arşiv Kaydı</div>
              </div>
              <div style={styles.statCard} className="isg-stat-card">
                <div style={{ ...styles.statValue, color: "#16a34a" }}>{documents.length}</div>
                <div style={styles.statLabel}>Belge</div>
              </div>
              <div style={styles.statCard} className="isg-stat-card">
                <div style={{ ...styles.statValue, color: "#d97706" }}>{trainings.length + annualPlans.length}</div>
                <div style={styles.statLabel}>Plan / Eğitim</div>
              </div>
              <div style={styles.statCard} className="isg-stat-card">
                <div style={{ ...styles.statValue, color: "#ef4444" }}>{accidentReports.length + risks.length + dofs.length}</div>
                <div style={styles.statLabel}>Risk / DÖF / Kaza</div>
              </div>
            </div>

            <div style={styles.card} className="isg-card">
              <p style={styles.sectionTitle} className="isg-text-muted">Arşiv Merkezi</p>
              <div style={{ color: "var(--isg-text-muted)", fontSize: 13, lineHeight: 1.55 }}>
                Belgeler, eğitimler, yıllık planlar, KKD kayıtları, acil durum planları, kurul toplantıları, iş kazası raporları, firma ziyaretleri, DÖF ve risk kayıtları bu ekranda firma bazlı toplanır.
              </div>
            </div>

            <div style={styles.searchBar}>
              <input style={{ ...styles.input, maxWidth: 300 }} placeholder="Arşivde ara..." value={search} onChange={e => setSearch(e.target.value)} />
              <select style={{ ...styles.select, maxWidth: 180 }} value={selectedCompanyId} onChange={e => setSelectedCompanyId(e.target.value)}><option value="all">Tüm Firmalar</option>{companies.map(c => <option key={c.id} value={c.id}>{c.nickName}</option>)}</select>
              <span style={{ color: "var(--isg-text-muted)", fontSize: 13 }}>{filteredArchiveItems.length} kayıt</span>
            </div>

            <div style={{ ...styles.card, padding: 0, overflow: "auto", WebkitOverflowScrolling: "touch" as any }}>
              <table style={styles.table}>
                <thead><tr>{["Tür", "Başlık", "Firma", "İlgili", "Tarih", "Durum", "Kaynak"].map(h => <th key={h} style={styles.th} className="isg-th">{h}</th>)}</tr></thead>
                <tbody>
                  {filteredArchiveItems.map(item => {
                    const company = companies.find(c => c.id === item.companyId);
                    const color = item.status === "Süresi Dolmuş" || item.status === "Açık" ? "#dc2626" : item.status === "Tamamlandı" || item.status === "Kapandı" || item.status === "Geçerli" ? "#16a34a" : "#d97706";
                    return (
                      <tr key={`${item.type}-${item.id}`}>
                        <td style={styles.td} className="isg-td"><Badge text={item.type} color="#0ea5e9" /></td>
                        <td style={{ ...styles.td, minWidth: 220, fontWeight: 700 }} className="isg-td">{item.title || "—"}</td>
                        <td style={styles.td} className="isg-td">{company?.nickName || "—"}</td>
                        <td style={{ ...styles.td, color: "var(--isg-text-muted)" }} className="isg-td">{item.owner || "—"}</td>
                        <td style={styles.td} className="isg-td">{item.date ? new Date(item.date).toLocaleDateString("tr-TR") : "—"}</td>
                        <td style={styles.td} className="isg-td"><Badge text={item.status || "Arşivde"} color={color} /></td>
                        <td style={styles.td} className="isg-td"><button style={styles.btnSecondary} onClick={() => setActiveTab(item.sourceTab)}>Modüle Git</button></td>
                      </tr>
                    );
                  })}
                  {filteredArchiveItems.length === 0 && (
                    <tr>
                      <td colSpan={7} style={{ ...styles.td, color: "var(--isg-text-muted)", textAlign: "center", padding: 24 }}>Arşivde gösterilecek kayıt bulunamadı.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

                {activeTab === "ek2muayene" && (
          <Ek2MuayeneFormu
            styles={styles}
            companies={companies}
            employees={employees}
            userRole={typeof window !== "undefined" ? localStorage.getItem("isg_activeRole") || userProfile?.role || "" : userProfile?.role || ""}
            userId={userProfile?.uid || ""}
          />
        )}

        {activeTab === "kullanicilar" && isAdmin && (
          <AdminUserPanel
            styles={styles}
            companies={companies}
            onCompanyCreated={(company) => setCompanies(prev => [...prev, company])}
          />
        )}

        {/* Vardiya ve Ayarlar sekmeleri kaldırıldı */}

      </main>
      </div>
    </div>
    
  );
}
