"use client";
// SessionGuard devre disi
// destroySession devre disi
import { useUserRole } from "./lib/useUserRole";
import { getUserProfile, UserProfile, UserRole, ROLE_CONFIG, withCreatedBy } from "./lib/roleManager";
import { AccidentReportsTab } from "./lib/AccidentReportsTab";
import { AdminUserPanel } from "./lib/AdminUserPanel";
import { AnnualPlansTab } from "./lib/AnnualPlansTab";
import { ArchiveTab } from "./lib/ArchiveTab";
import { CommitteeMeetingsTab } from "./lib/CommitteeMeetingsTab";
import { CompanyVisitsTab } from "./lib/CompanyVisitsTab";
import { Ek2MuayeneFormu } from "./lib/Ek2MuayeneFormu";
import { EmergencyPlansTab } from "./lib/EmergencyPlansTab";
import { MykLookupTab, NaceLookupTab } from "./lib/LookupTabs";
import { PpeTab } from "./lib/PpeTab";
import { TrainingsTab } from "./lib/TrainingsTab";
import { useLanguage } from "./lib/i18n";
import {
  generateRiskPDF,
} from "./lib/pdf";
import { documentTemplates, emptyNewEmployee, requiredCompanyDocs } from "./lib/constants";
import {
  annualPlanStatusColor,
  checklistCompletion,
  createOnboardingFromChecklist,
  dangerFromNace,
  daysUntil,
  emptyChecklist,
  extractNaceFromSgk,
  getDateStatus,
  normalizeCommitteeMeetingRecord,
  normalizeEmployeeRecord,
  normalizeTrainingRecord,
  officialNameFromSgk,
  priorityColor,
  riskScoreColor,
  statusColor,
} from "./lib/dashboardUtils";
import type {
  AccidentReportRecord,
  AccidentReportStatus,
  AccidentSeverity,
  AnnualPlanRecord,
  AnnualPlanStatus,
  AnnualPlanType,
  ArchiveItem,
  CommitteeMeetingRecord,
  CommitteeMeetingStatus,
  Company,
  CompanyVisitPurpose,
  CompanyVisitRecord,
  CompanyVisitStatus,
  DangerClass,
  DocumentRecord,
  DofRecord,
  EmailSettings,
  EmergencyPlanRecord,
  EmergencyPlanStatus,
  Employee,
  EmployeeChecklist,
  NewEmployeeForm,
  Observer,
  PpeRecord,
  PpeStatus,
  RiskRecord,
  ServiceType,
  Signer,
  SignerRole,
  TaskItem,
  TaskPriority,
  TrainingRecord,
  TrainingStatus,
  TrainingType,
} from "./lib/types";

import React, { ChangeEvent, useEffect, useMemo, useState } from "react";
import { db, auth } from "../lib/firebase";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { useRouter } from "next/navigation";
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

// ── Styles ────────────────────────────────────────────────────────────────────
// ── Mobil algılama yardımcısı (styles dışında kullanılır) ──
const isMobileScreen = () => typeof window !== "undefined" && window.innerWidth <= 768;

const styles: Record<string, React.CSSProperties> = {
  app: { minHeight: "100vh", background: "var(--isg-bg)", color: "var(--isg-text)", fontFamily: "'IBM Plex Sans', -apple-system, sans-serif", overflowX: "hidden" as const },
  header: { backgroundColor: "var(--isg-header)", borderBottom: "1px solid var(--isg-border)", padding: "0 28px", display: "flex", alignItems: "center", justifyContent: "space-between", height: 58, gap: 10, backdropFilter: "blur(22px)", WebkitBackdropFilter: "blur(22px)", position: "sticky" as const, top: 0, zIndex: 50, boxShadow: "0 12px 34px rgba(0,0,0,0.22)" },
  nav: { display: "flex", gap: 6, padding: "0 28px", borderBottom: "1px solid var(--isg-border)", backgroundColor: "var(--isg-nav)", overflowX: "auto" as const, WebkitOverflowScrolling: "touch" as const, msOverflowStyle: "none" as const, scrollbarWidth: "none" as const, backdropFilter: "blur(22px)", WebkitBackdropFilter: "blur(22px)", position: "sticky" as const, top: 58, zIndex: 40, height: 50, alignItems: "center" },
  shell: { display: "flex", alignItems: "stretch", minHeight: "calc(100vh - 58px)", width: "100%", overflow: "hidden" as const },
  sidebar: { flexShrink: 0, borderRight: "1px solid var(--isg-border)", backgroundColor: "var(--isg-nav)", padding: "18px 14px", overflowY: "auto" as const, boxSizing: "border-box" as const, backdropFilter: "blur(22px)", WebkitBackdropFilter: "blur(22px)", zIndex: 35 },
  sidebarSearch: { height: 34, border: "1px solid var(--isg-border)", borderRadius: 8, backgroundColor: "var(--isg-input-bg)", display: "flex", alignItems: "center", gap: 8, padding: "0 10px", marginBottom: 18 },
  sidebarGroupTitle: { color: "var(--isg-text-subtle)", fontSize: 10, fontWeight: 800, textTransform: "uppercase" as const, letterSpacing: "0.1em", margin: "0 0 7px 4px" },
  sidebarItem: { minHeight: 36, width: "100%", border: "1px solid transparent", borderRadius: 8, backgroundColor: "transparent", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8, padding: "0 10px", fontSize: 13, fontWeight: 700, textAlign: "left" as const, transition: "color 0.15s, border-color 0.15s, background-color 0.15s, opacity 0.15s" },
  soonBadge: { fontSize: 10, fontWeight: 800, color: "#a78bfa", border: "1px solid rgba(167,139,250,0.24)", backgroundColor: "rgba(167,139,250,0.12)", borderRadius: 6, padding: "2px 6px", whiteSpace: "nowrap" as const },
  content: { padding: "30px 28px", width: "100%", minWidth: 0, flex: "1 1 auto", boxSizing: "border-box" as const, margin: "0 auto" },
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
  const [archiveTypeFilter, setArchiveTypeFilter] = useState("all");
  const [archiveStatusFilter, setArchiveStatusFilter] = useState("all");
  const [archiveDateFrom, setArchiveDateFrom] = useState("");
  const [archiveDateTo, setArchiveDateTo] = useState("");
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
      if (empResult.status === "fulfilled") setEmployees(empResult.value.map(normalizeEmployeeRecord));
      if (docResult.status === "fulfilled") setDocuments(docResult.value);
      if (obsResult.status === "fulfilled") setObservers(obsResult.value);
      if (dofResult.status === "fulfilled") setDofs(dofResult.value);
      if (riskResult.status === "fulfilled") setRisks(riskResult.value);
      if (signerResult.status === "fulfilled") setSigners(signerResult.value);
      if (annualPlanResult.status === "fulfilled") setAnnualPlans(annualPlanResult.value);
      if (trainingResult.status === "fulfilled") setTrainings(trainingResult.value.map(normalizeTrainingRecord));
      if (ppeResult.status === "fulfilled") setPpeRecords(ppeResult.value);
      if (emergencyPlanResult.status === "fulfilled") setEmergencyPlans(emergencyPlanResult.value);
      if (committeeMeetingResult.status === "fulfilled") setCommitteeMeetings(committeeMeetingResult.value.map(normalizeCommitteeMeetingRecord));
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
  const activeRole = userProfile?.activeRole || userProfile?.role;

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
    const matchesType = archiveTypeFilter === "all" || item.type === archiveTypeFilter;
    const matchesStatus = archiveStatusFilter === "all" || item.status === archiveStatusFilter;
    const matchesDateFrom = !archiveDateFrom || (!!item.date && item.date >= archiveDateFrom);
    const matchesDateTo = !archiveDateTo || (!!item.date && item.date <= archiveDateTo);
    const matchesSearch = `${item.type} ${item.title} ${item.owner} ${item.status} ${company?.nickName || ""} ${company?.officialName || ""}`.toLowerCase().includes(search.toLowerCase());
    return matchesCompany && matchesType && matchesStatus && matchesDateFrom && matchesDateTo && matchesSearch;
  }), [archiveItems, companies, selectedCompanyId, search, archiveTypeFilter, archiveStatusFilter, archiveDateFrom, archiveDateTo]);
  const archiveTypes = useMemo(() => Array.from(new Set(archiveItems.map(item => item.type))).sort(), [archiveItems]);
  const archiveStatuses = useMemo(() => Array.from(new Set(archiveItems.map(item => item.status || "Arşivde"))).sort(), [archiveItems]);
  const taskItems = useMemo<TaskItem[]>(() => {
    const items: TaskItem[] = [];
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const soonLimit = new Date(today);
    soonLimit.setDate(soonLimit.getDate() + 30);
    const isPast = (date?: string) => !!date && new Date(date) < today;
    const isSoon = (date?: string) => !!date && new Date(date) <= soonLimit;
    const companyName = (companyId: string) => companies.find(c => c.id === companyId)?.nickName || "Firma";
    const employeeName = (employeeId?: string | null) => {
      const employee = employees.find(e => e.id === employeeId);
      return employee ? `${employee.firstName} ${employee.lastName}` : "";
    };

    documents.forEach(document => {
      if (!document.expiryDate || !isSoon(document.expiryDate)) return;
      const expired = isPast(document.expiryDate);
      items.push({
        id: `document-${document.id}`,
        companyId: document.companyId,
        title: expired ? "Süresi dolmuş belge" : "Yaklaşan belge yenileme",
        detail: `${document.type} · ${employeeName(document.employeeId) || companyName(document.companyId)}`,
        owner: "Belge sorumlusu",
        dueDate: document.expiryDate,
        priority: expired ? "Kritik" : "Yüksek",
        sourceTab: "belgeler",
        category: "Belge",
      });
    });

    employees.forEach(employee => {
      const onboarding = employee.onboarding || createOnboardingFromChecklist(employee.checklist);
      if (onboarding.status === "completed") return;
      const missingTasks = Object.values(onboarding.tasks).filter(task => !task.completed);
      const roleTasks = activeRole === "doctor"
        ? missingTasks.filter(task => task.ownerRole === "doctor")
        : activeRole === "safety_expert"
          ? missingTasks.filter(task => task.ownerRole === "safety_expert")
          : missingTasks;
      if (roleTasks.length === 0) return;
      items.push({
        id: `employee-${employee.id}`,
        companyId: employee.companyId,
        title: "Personel onboarding eksik",
        detail: `${employee.firstName} ${employee.lastName} · ${roleTasks.map(task => task.label).join(", ")}`,
        owner: activeRole === "doctor" ? "Doktor" : activeRole === "safety_expert" ? "İş Güvenliği Uzmanı" : "Sorumlu ekip",
        dueDate: employee.hireDate,
        priority: "Yüksek",
        sourceTab: activeRole === "doctor" ? "ek2muayene" : "personel",
        category: "Personel",
      });
    });

    dofs.forEach(dof => {
      if (dof.status === "Çözüldü" || dof.status === "Riske Aktarıldı") return;
      items.push({
        id: `dof-${dof.id}`,
        companyId: dof.companyId,
        title: dof.status === "Önlem Alındı" ? "DÖF riske aktarılmalı" : "Açık DÖF takibi",
        detail: `${dof.title} · ${dof.location || "Konum yok"}`,
        owner: dof.responsible || "Sorumlu girilmedi",
        dueDate: dof.dueDate,
        priority: isPast(dof.dueDate) ? "Kritik" : dof.priority === "Yüksek" ? "Yüksek" : "Orta",
        sourceTab: "dof",
        category: "DÖF",
      });
    });

    risks.forEach(risk => {
      if (risk.status === "Kapandı") return;
      if (risk.score < 15 && !isPast(risk.dueDate)) return;
      items.push({
        id: `risk-${risk.id}`,
        companyId: risk.companyId,
        title: risk.score >= 15 ? "Yüksek risk aksiyonu" : "Geciken risk aksiyonu",
        detail: `${risk.hazard} · Skor ${risk.score}`,
        owner: risk.responsible || "Sorumlu girilmedi",
        dueDate: risk.dueDate || risk.controlDate || "",
        priority: risk.score >= 15 || isPast(risk.dueDate) ? "Kritik" : "Yüksek",
        sourceTab: "risk",
        category: "Risk",
      });
    });

    trainings.forEach(training => {
      if (training.status !== "Planlandı" || !isSoon(training.trainingDate)) return;
      items.push({
        id: `training-${training.id}`,
        companyId: training.companyId,
        title: "Planlanan eğitim",
        detail: `${training.title || training.type} · ${training.participantIds.length} katılımcı`,
        owner: training.trainer || "Eğitmen girilmedi",
        dueDate: training.trainingDate,
        priority: isPast(training.trainingDate) ? "Kritik" : "Orta",
        sourceTab: "egitimler",
        category: "Eğitim",
      });
    });

    annualPlans.forEach(plan => {
      if (plan.status === "Tamamlandı") return;
      if (plan.status !== "Gecikti" && !isSoon(plan.plannedDate)) return;
      items.push({
        id: `annual-${plan.id}`,
        companyId: plan.companyId,
        title: plan.status === "Gecikti" || isPast(plan.plannedDate) ? "Geciken yıllık plan" : "Yaklaşan yıllık plan",
        detail: `${plan.type} · ${plan.title}`,
        owner: plan.responsible || "Sorumlu girilmedi",
        dueDate: plan.plannedDate,
        priority: plan.status === "Gecikti" || isPast(plan.plannedDate) ? "Kritik" : "Orta",
        sourceTab: "yillik-planlar",
        category: "Plan",
      });
    });

    accidentReports.forEach(report => {
      if (report.status === "Kapandı") return;
      items.push({
        id: `accident-${report.id}`,
        companyId: report.companyId,
        title: "İş kazası / ramak kala takibi",
        detail: `${report.incidentType} · ${employeeName(report.employeeId) || report.location || "Detay bekliyor"}`,
        owner: report.responsible || "Sorumlu girilmedi",
        dueDate: report.dueDate || report.accidentDate,
        priority: report.severity === "Ağır" ? "Kritik" : report.severity === "Orta" ? "Yüksek" : "Orta",
        sourceTab: "is-kazasi-raporu",
        category: "Olay",
      });
    });

    companyVisits.forEach(visit => {
      if (visit.status === "Tamamlandı" && !isSoon(visit.nextVisitDate)) return;
      if (visit.status === "Planlandı" || visit.status === "Takip Gerekli" || isSoon(visit.nextVisitDate)) {
        items.push({
          id: `visit-${visit.id}`,
          companyId: visit.companyId,
          title: visit.status === "Takip Gerekli" ? "Ziyaret sonrası takip" : "Firma ziyareti",
          detail: `${visit.purpose} · ${visit.findings || visit.actions || "Plan detayı bekliyor"}`,
          owner: visit.visitor || "Ziyaretçi girilmedi",
          dueDate: visit.nextVisitDate || visit.visitDate,
          priority: visit.status === "Takip Gerekli" ? "Yüksek" : isPast(visit.visitDate) && visit.status !== "Tamamlandı" ? "Kritik" : "Düşük",
          sourceTab: "firma-ziyaretleri",
          category: "Ziyaret",
        });
      }
    });

    return items.sort((a, b) => {
      const priorityWeight: Record<TaskPriority, number> = { Kritik: 0, Yüksek: 1, Orta: 2, Düşük: 3 };
      const byPriority = priorityWeight[a.priority] - priorityWeight[b.priority];
      if (byPriority !== 0) return byPriority;
      return (a.dueDate || "9999-12-31").localeCompare(b.dueDate || "9999-12-31");
    });
  }, [activeRole, annualPlans, accidentReports, companies, companyVisits, documents, dofs, employees, risks, trainings]);
  const filteredTaskItems = useMemo(() => taskItems.filter(task => {
    const company = companies.find(c => c.id === task.companyId);
    const matchesCompany = selectedCompanyId === "all" || task.companyId === selectedCompanyId;
    return matchesCompany && `${task.category} ${task.title} ${task.detail} ${task.owner} ${task.priority} ${company?.nickName || ""} ${company?.officialName || ""}`.toLowerCase().includes(search.toLowerCase());
  }), [taskItems, companies, selectedCompanyId, search]);

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
      { id: "gorevler", label: "✅ Görevler" },
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
      { id: "nace-sorgula", label: "🔎 NACE Sorgula" },
      { id: "myk-sorgula", label: "🪪 MYK Sorgula" },
      ...(isAdmin ? [{ id: "kullanicilar", label: "👥 Kullanıcılar" }] : []),
    ];
  const menuGroups: Array<{ title: string; items: Array<{ id: string; label: string; disabled?: boolean }> }> = isHumanResources && !isAdmin
    ? [{ title: "Yönetim", items: tabs }]
    : [
      { title: "Yönetim", items: tabs.filter(tab => ["ozet", "gorevler", "firmalar", "personel", "kullanicilar"].includes(tab.id)) },
      { title: "Risk Yönetimi", items: tabs.filter(tab => ["gozlemciler", "dof", "risk"].includes(tab.id)) },
      { title: "Formlar & Belgeler", items: tabs.filter(tab => ["belgeler", "imzacilar", "ek2muayene", "kkd-formu", "is-kazasi-raporu"].includes(tab.id)) },
      {
        title: "Planlama & Arşiv",
        items: [
          ...tabs.filter(tab => ["yillik-planlar", "egitimler", "acil-durum-plani", "kurul-toplantisi", "firma-ziyaretleri", "arsiv"].includes(tab.id)),
        ],
      },
      { title: "Araçlar", items: tabs.filter(tab => ["nace-sorgula", "myk-sorgula"].includes(tab.id)) },
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
  const activeRoleLabel = activeRole ? t(`role.${activeRole}`) : "";
  const criticalTasks = taskItems.filter(task => task.priority === "Kritik");
  const highPriorityTasks = taskItems.filter(task => task.priority === "Yüksek");
  const upcomingTrainings = trainings.filter(training => training.status === "Planlandı").length;
  const openAccidentReports = accidentReports.filter(report => report.status !== "Kapandı").length;
  const followUpVisits = companyVisits.filter(visit => visit.status === "Takip Gerekli" || visit.status === "Planlandı").length;
  const ek2PendingEmployees = employees.filter(employee => !(employee.onboarding || createOnboardingFromChecklist(employee.checklist)).tasks.doctorEk2.completed).length;
  const safetyPendingEmployees = employees.filter(employee => {
    const onboarding = employee.onboarding || createOnboardingFromChecklist(employee.checklist);
    return !onboarding.tasks.safetyTraining.completed || !onboarding.tasks.safetyDocuments.completed;
  }).length;
  const plannedCompanyVisits = companyVisits.filter(visit => visit.status === "Planlandı" || visit.status === "Takip Gerekli").length;
  const roleDashboardTitle = activeRole === "doctor"
    ? "Doktor Çalışma Alanı"
    : activeRole === "nurse"
      ? "Hemşire Çalışma Alanı"
      : activeRole === "safety_expert"
        ? "İş Güvenliği Uzmanı Çalışma Alanı"
        : activeRole === "human_resources"
          ? "İnsan Kaynakları Çalışma Alanı"
          : "Genel Yönetim Paneli";
  const roleDashboardSubtitle = activeRole === "doctor"
    ? "EK-2 bekleyen personeller, açık olay takipleri ve sağlıkla ilgili kayıtlar öncelikli gösterilir."
    : activeRole === "nurse"
      ? "Personel sağlık hazırlıkları, eğitim/KKD kayıtları ve yaklaşan belgeler öne çıkarılır."
      : activeRole === "safety_expert"
        ? "Açık DÖF, yüksek risk, eğitim, plan ve saha ziyareti takipleri öncelikli gösterilir."
        : activeRole === "human_resources"
          ? "Personel girişleri ve onboarding eksikleri öne çıkarılır."
          : "Tüm firmalar, kritik görevler, riskler, belgeler ve operasyon kayıtları tek bakışta izlenir.";
  const roleDashboardCards = activeRole === "doctor"
    ? [
      { value: ek2PendingEmployees, label: "EK-2 Bekleyen", color: ek2PendingEmployees > 0 ? "#d97706" : "#16a34a" },
      { value: openAccidentReports, label: "Açık Olay", color: openAccidentReports > 0 ? "#dc2626" : "#16a34a" },
      { value: employees.length, label: "Personel", color: "#a78bfa" },
      { value: totalSoonDocs, label: "Yaklaşan Belge", color: totalSoonDocs > 0 ? "#d97706" : "#16a34a" },
    ]
    : activeRole === "nurse"
      ? [
        { value: employees.length, label: "Personel", color: "#a78bfa" },
        { value: ppeRecords.length, label: "KKD Kaydı", color: "#16a34a" },
        { value: upcomingTrainings, label: "Planlı Eğitim", color: upcomingTrainings > 0 ? "#0ea5e9" : "#16a34a" },
        { value: totalSoonDocs, label: "Yaklaşan Belge", color: totalSoonDocs > 0 ? "#d97706" : "#16a34a" },
      ]
      : activeRole === "safety_expert"
        ? [
          { value: openDofs, label: "Açık DÖF", color: openDofs > 0 ? "#d97706" : "#16a34a" },
          { value: highRisks, label: "Yüksek Risk", color: highRisks > 0 ? "#dc2626" : "#16a34a" },
          { value: upcomingTrainings, label: "Planlı Eğitim", color: upcomingTrainings > 0 ? "#0ea5e9" : "#16a34a" },
          { value: plannedCompanyVisits, label: "Ziyaret Takibi", color: plannedCompanyVisits > 0 ? "#d97706" : "#16a34a" },
        ]
        : activeRole === "human_resources"
          ? [
            { value: employees.length, label: "Personel", color: "#a78bfa" },
            { value: incompleteEmployees, label: "Onboarding Eksik", color: incompleteEmployees > 0 ? "#d97706" : "#16a34a" },
            { value: ek2PendingEmployees, label: "EK-2 Bekleyen", color: ek2PendingEmployees > 0 ? "#d97706" : "#16a34a" },
            { value: safetyPendingEmployees, label: "İSG Evrak/Eğitim", color: safetyPendingEmployees > 0 ? "#d97706" : "#16a34a" },
          ]
          : [
            { value: companies.length, label: "Firma", color: "#38bdf8" },
            { value: employees.length, label: "Personel", color: "#a78bfa" },
            { value: criticalTasks.length, label: "Kritik Görev", color: criticalTasks.length > 0 ? "#dc2626" : "#16a34a" },
            { value: highPriorityTasks.length, label: "Yüksek Öncelik", color: highPriorityTasks.length > 0 ? "#d97706" : "#16a34a" },
            { value: totalExpiredDocs, label: "Süresi Dolmuş Belge", color: totalExpiredDocs > 0 ? "#dc2626" : "#16a34a" },
            { value: totalSoonDocs, label: "Yaklaşan Belge", color: totalSoonDocs > 0 ? "#d97706" : "#16a34a" },
            { value: openDofs, label: "Açık DÖF", color: openDofs > 0 ? "#d97706" : "#16a34a" },
            { value: highRisks, label: "Yüksek Risk (≥15)", color: highRisks > 0 ? "#dc2626" : "#16a34a" },
            { value: incompleteEmployees, label: "Eğitim Eksik", color: incompleteEmployees > 0 ? "#d97706" : "#16a34a" },
            { value: upcomingTrainings, label: "Planlı Eğitim", color: upcomingTrainings > 0 ? "#0ea5e9" : "#16a34a" },
            { value: openAccidentReports, label: "Açık Olay", color: openAccidentReports > 0 ? "#dc2626" : "#16a34a" },
            { value: followUpVisits, label: "Ziyaret Takibi", color: followUpVisits > 0 ? "#d97706" : "#16a34a" },
          ];
  const roleQuickActions = activeRole === "doctor"
    ? [
      { label: "EK-2 Muayene", tab: "ek2muayene" },
      { label: "Personel Listesi", tab: "personel" },
      { label: "İş Kazası Takibi", tab: "is-kazasi-raporu" },
      { label: "Görevler", tab: "gorevler" },
    ]
    : activeRole === "nurse"
      ? [
        { label: "Personel Listesi", tab: "personel" },
        { label: "KKD Formu", tab: "kkd-formu" },
        { label: "Eğitimler", tab: "egitimler" },
        { label: "Belgeler", tab: "belgeler" },
      ]
      : activeRole === "safety_expert"
        ? [
          { label: "DÖF Oluştur", tab: "dof" },
          { label: "Risk Ekle", tab: "risk" },
          { label: "Eğitim Planla", tab: "egitimler" },
          { label: "Firma Ziyareti", tab: "firma-ziyaretleri" },
          { label: "Görevler", tab: "gorevler" },
        ]
        : [
          { label: "Yeni Personel", tab: "personel" },
          { label: "DÖF Oluştur", tab: "dof" },
          { label: "Risk Ekle", tab: "risk" },
          { label: "Eğitim Planla", tab: "egitimler" },
          { label: "Firma Ziyareti", tab: "firma-ziyaretleri" },
          { label: "Arşivi Aç", tab: "arsiv" },
        ];
  const roleTaskCategories = activeRole === "doctor"
    ? ["Personel", "Olay", "Belge"]
    : activeRole === "nurse"
      ? ["Personel", "Eğitim", "KKD", "Belge"]
      : activeRole === "safety_expert"
        ? ["DÖF", "Risk", "Eğitim", "Plan", "Ziyaret", "Olay"]
        : [];
  const topDashboardTasks = (roleTaskCategories.length > 0 ? taskItems.filter(task => roleTaskCategories.includes(task.category)) : taskItems).slice(0, 5);
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

      <main style={{ ...styles.content, maxWidth: "100%" }} className="isg-app">
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
            <div style={styles.card} className="isg-card">
              <p style={{ ...styles.sectionTitle, marginBottom: 10 }} className="isg-text-muted">{roleDashboardTitle}</p>
              <div style={{ color: "var(--isg-text-muted)", fontSize: 13, lineHeight: 1.55 }}>{roleDashboardSubtitle}</div>
            </div>
            <div style={styles.statGrid}>
              {roleDashboardCards.map(({ value, label, color }) => (
                <div key={label} style={styles.statCard} className="isg-stat-card"
                  onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = "rgba(255,255,255,0.15)"; (e.currentTarget as HTMLElement).style.transform = "translateY(-2px)"; }}
                  onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = "rgba(255,255,255,0.07)"; (e.currentTarget as HTMLElement).style.transform = ""; }}>
                  <div style={{ ...styles.statValue, color }}>{value}</div>
                  <div style={styles.statLabel}>{label}</div>
                </div>
              ))}
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(min(360px, 100%), 1fr))", gap: 16, marginBottom: 24 }}>
              <div style={styles.card} className="isg-card">
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12, marginBottom: 14 }}>
                  <p style={{ ...styles.sectionTitle, marginBottom: 0 }} className="isg-text-muted">Bugünün Öncelikleri</p>
                  <button style={styles.btnSecondary} onClick={() => setActiveTab("gorevler")}>Tüm Görevler</button>
                </div>
                <div style={{ display: "grid", gap: 10 }}>
                  {topDashboardTasks.map(task => {
                    const company = companies.find(c => c.id === task.companyId);
                    const color: Record<TaskPriority, string> = { Kritik: "#dc2626", Yüksek: "#d97706", Orta: "#0ea5e9", Düşük: "#16a34a" };
                    return (
                      <div key={task.id} style={{ border: "1px solid var(--isg-border)", borderRadius: 8, padding: 12, backgroundColor: "var(--isg-input-bg)" }}>
                        <div style={{ display: "flex", justifyContent: "space-between", gap: 10, alignItems: "flex-start" }}>
                          <div>
                            <div style={{ fontWeight: 800, marginBottom: 4 }}>{task.title}</div>
                            <div style={{ color: "var(--isg-text-muted)", fontSize: 12, lineHeight: 1.45 }}>{task.detail}</div>
                            <div style={{ color: "var(--isg-text-subtle)", fontSize: 11, marginTop: 6 }}>{company?.nickName || "Firma"} · {task.dueDate ? new Date(task.dueDate).toLocaleDateString("tr-TR") : "Termin yok"}</div>
                          </div>
                          <Badge text={task.priority} color={color[task.priority]} />
                        </div>
                      </div>
                    );
                  })}
                  {topDashboardTasks.length === 0 && (
                    <div style={{ color: "var(--isg-text-muted)", fontSize: 13, padding: "10px 0" }}>Şu an kritik takip görünmüyor.</div>
                  )}
                </div>
              </div>

              <div style={styles.card} className="isg-card">
                <p style={styles.sectionTitle} className="isg-text-muted">Hızlı Aksiyonlar</p>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))", gap: 10 }}>
                  {roleQuickActions.map(action => (
                    <button key={action.tab} style={{ ...styles.btnSecondary, width: "100%", justifyContent: "center" as any }} onClick={() => setActiveTab(action.tab)}>
                      {action.label}
                    </button>
                  ))}
                </div>
                <div style={{ marginTop: 18, borderTop: "1px solid var(--isg-border)", paddingTop: 14 }}>
                  <p style={{ ...styles.sectionTitle, marginBottom: 10 }} className="isg-text-muted">Operasyon Özeti</p>
                  <div style={{ display: "grid", gap: 8, fontSize: 13, color: "var(--isg-text-muted)" }}>
                    <div>Planlı eğitim: <strong style={{ color: "var(--isg-text)" }}>{upcomingTrainings}</strong></div>
                    <div>Açık olay/ramak kala: <strong style={{ color: "var(--isg-text)" }}>{openAccidentReports}</strong></div>
                    <div>Ziyaret takibi: <strong style={{ color: "var(--isg-text)" }}>{followUpVisits}</strong></div>
                    <div>Arşiv kaydı: <strong style={{ color: "var(--isg-text)" }}>{archiveItems.length}</strong></div>
                  </div>
                </div>
              </div>
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

        {activeTab === "gorevler" && (
          <div>
            <div style={styles.statGrid}>
              {[
                { value: taskItems.length, label: "Toplam Görev", color: "#0ea5e9" },
                { value: taskItems.filter(task => task.priority === "Kritik").length, label: "Kritik", color: "#dc2626" },
                { value: taskItems.filter(task => task.priority === "Yüksek").length, label: "Yüksek", color: "#d97706" },
                { value: taskItems.filter(task => task.category === "Personel").length, label: "Personel Görevi", color: "#a78bfa" },
              ].map(({ value, label, color }) => (
                <div key={label} style={styles.statCard} className="isg-stat-card">
                  <div style={{ ...styles.statValue, color }}>{value}</div>
                  <div style={styles.statLabel}>{label}</div>
                </div>
              ))}
            </div>

            <div style={styles.card} className="isg-card">
              <p style={styles.sectionTitle} className="isg-text-muted">Görev / Takip Paneli</p>
              <div style={{ color: "var(--isg-text-muted)", fontSize: 13, lineHeight: 1.55 }}>
                Bu panel, mevcut kayıtlardan otomatik görev çıkarır: süresi yaklaşan belgeler, açık DÖF'ler, yüksek riskler, eksik onboarding adımları, yaklaşan eğitimler, açık iş kazası raporları ve firma ziyaret takipleri.
              </div>
            </div>

            <div style={styles.searchBar}>
              <input style={{ ...styles.input, maxWidth: 300 }} placeholder="Görevlerde ara..." value={search} onChange={e => setSearch(e.target.value)} />
              <select style={{ ...styles.select, maxWidth: 180 }} value={selectedCompanyId} onChange={e => setSelectedCompanyId(e.target.value)}><option value="all">Tüm Firmalar</option>{companies.map(c => <option key={c.id} value={c.id}>{c.nickName}</option>)}</select>
              <span style={{ color: "var(--isg-text-muted)", fontSize: 13 }}>{filteredTaskItems.length} görev</span>
            </div>

            <div style={{ ...styles.card, padding: 0, overflow: "auto", WebkitOverflowScrolling: "touch" as any }}>
              <table style={styles.table}>
                <thead><tr>{["Öncelik", "Kategori", "Görev", "Firma", "Sorumlu", "Termin", "İşlem"].map(h => <th key={h} style={styles.th} className="isg-th">{h}</th>)}</tr></thead>
                <tbody>
                  {filteredTaskItems.map(task => {
                    const company = companies.find(c => c.id === task.companyId);
                    const priorityColorMap: Record<TaskPriority, string> = {
                      Kritik: "#dc2626",
                      Yüksek: "#d97706",
                      Orta: "#0ea5e9",
                      Düşük: "#16a34a",
                    };
                    return (
                      <tr key={task.id}>
                        <td style={styles.td} className="isg-td"><Badge text={task.priority} color={priorityColorMap[task.priority]} /></td>
                        <td style={styles.td} className="isg-td"><Badge text={task.category} color="#64748b" /></td>
                        <td style={{ ...styles.td, minWidth: 280 }} className="isg-td">
                          <div style={{ fontWeight: 800, marginBottom: 4 }}>{task.title}</div>
                          <div style={{ color: "var(--isg-text-muted)", fontSize: 12 }}>{task.detail}</div>
                        </td>
                        <td style={styles.td} className="isg-td">{company?.nickName || "—"}</td>
                        <td style={{ ...styles.td, color: "var(--isg-text-muted)" }} className="isg-td">{task.owner}</td>
                        <td style={styles.td} className="isg-td">{task.dueDate ? new Date(task.dueDate).toLocaleDateString("tr-TR") : "—"}</td>
                        <td style={styles.td} className="isg-td"><button style={styles.btnSecondary} onClick={() => setActiveTab(task.sourceTab)}>Modüle Git</button></td>
                      </tr>
                    );
                  })}
                  {filteredTaskItems.length === 0 && (
                    <tr>
                      <td colSpan={7} style={{ ...styles.td, color: "var(--isg-text-muted)", textAlign: "center", padding: 24 }}>Şu an takip gerektiren görev bulunamadı.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
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
          <div style={{ display: "grid", gridTemplateColumns: selectedEmployee && !compactLayout ? "minmax(0, 1fr) minmax(380px, 420px)" : "minmax(0, 1fr)", gap: 20, minWidth: 0, alignItems: "start" }}>
            <div style={{ minWidth: 0 }}>
              <div style={styles.card} className="isg-card">
                <p style={styles.sectionTitle} className="isg-text-muted">Yeni Personel Ekle</p>
                <div style={{ display: "grid", gridTemplateColumns: compactLayout ? "minmax(0, 1fr)" : "minmax(160px, 190px) minmax(0, 1fr)", gap: 18, alignItems: "start", minWidth: 0 }}>
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
                  <div style={{ display: "grid", gap: 18, minWidth: 0 }}>
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
            </div>
            <div style={{ ...styles.searchBar, gridColumn: "1 / -1" }}>
                <input style={{ ...styles.input, maxWidth: 240 }} placeholder="Ara..." value={search} onChange={e => setSearch(e.target.value)} />
                <select style={{ ...styles.select, maxWidth: 180 }} value={selectedCompanyId} onChange={e => setSelectedCompanyId(e.target.value)}><option value="all">Tüm Firmalar</option>{companies.map(c => <option key={c.id} value={c.id}>{c.nickName}</option>)}</select>
                <span style={{ color: "#64748b", fontSize: 13 }}>{filteredEmployees.length} kişi</span>
              </div>
            <div style={{ ...styles.card, gridColumn: "1 / -1", padding: 0, overflow: "auto", WebkitOverflowScrolling: "touch" as any }}>
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
            {selectedEmployee && (
              <div style={{ minWidth: 0, maxWidth: "100%" }}>
                <div style={{ ...styles.card, overflow: "visible" }} className="isg-card">
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
              <div style={{ marginTop: 10, display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(min(220px, 100%), 1fr))", gap: 16 }}>
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
                        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(min(220px, 100%), 1fr))", gap: 16 }}>
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
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(min(240px, 100%), 1fr))", gap: 12 }}>
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
          <AnnualPlansTab
            styles={styles}
            companies={companies}
            filteredAnnualPlans={filteredAnnualPlans}
            newAnnualPlan={newAnnualPlan}
            setNewAnnualPlan={setNewAnnualPlan}
            search={search}
            setSearch={setSearch}
            selectedCompanyId={selectedCompanyId}
            setSelectedCompanyId={setSelectedCompanyId}
            addAnnualPlan={addAnnualPlan}
            updateAnnualPlanStatus={updateAnnualPlanStatus}
            deleteAnnualPlan={deleteAnnualPlan}
          />
        )}

        {activeTab === "egitimler" && (
          <TrainingsTab
            styles={styles}
            companies={companies}
            employees={employees}
            filteredTrainings={filteredTrainings}
            newTraining={newTraining}
            setNewTraining={setNewTraining}
            search={search}
            setSearch={setSearch}
            selectedCompanyId={selectedCompanyId}
            setSelectedCompanyId={setSelectedCompanyId}
            toggleTrainingParticipant={toggleTrainingParticipant}
            addTraining={addTraining}
            updateTrainingStatus={updateTrainingStatus}
            deleteTraining={deleteTraining}
          />
        )}

        {activeTab === "kkd-formu" && (
          <PpeTab
            styles={styles}
            companies={companies}
            employees={employees}
            filteredPpeRecords={filteredPpeRecords}
            newPpe={newPpe}
            setNewPpe={setNewPpe}
            search={search}
            setSearch={setSearch}
            selectedCompanyId={selectedCompanyId}
            setSelectedCompanyId={setSelectedCompanyId}
            addPpeRecord={addPpeRecord}
            updatePpeStatus={updatePpeStatus}
            deletePpeRecord={deletePpeRecord}
          />
        )}

        {activeTab === "acil-durum-plani" && (
          <EmergencyPlansTab
            styles={styles}
            companies={companies}
            employees={employees}
            filteredEmergencyPlans={filteredEmergencyPlans}
            newEmergencyPlan={newEmergencyPlan}
            setNewEmergencyPlan={setNewEmergencyPlan}
            search={search}
            setSearch={setSearch}
            selectedCompanyId={selectedCompanyId}
            setSelectedCompanyId={setSelectedCompanyId}
            addEmergencyPlan={addEmergencyPlan}
            updateEmergencyPlanStatus={updateEmergencyPlanStatus}
            deleteEmergencyPlan={deleteEmergencyPlan}
          />
        )}

        {activeTab === "kurul-toplantisi" && (
          <CommitteeMeetingsTab
            styles={styles}
            companies={companies}
            employees={employees}
            filteredCommitteeMeetings={filteredCommitteeMeetings}
            newCommitteeMeeting={newCommitteeMeeting}
            setNewCommitteeMeeting={setNewCommitteeMeeting}
            search={search}
            setSearch={setSearch}
            selectedCompanyId={selectedCompanyId}
            setSelectedCompanyId={setSelectedCompanyId}
            toggleCommitteeParticipant={toggleCommitteeParticipant}
            addCommitteeMeeting={addCommitteeMeeting}
            updateCommitteeMeetingStatus={updateCommitteeMeetingStatus}
            deleteCommitteeMeeting={deleteCommitteeMeeting}
          />
        )}

        {activeTab === "is-kazasi-raporu" && (
          <AccidentReportsTab
            styles={styles}
            companies={companies}
            employees={employees}
            filteredAccidentReports={filteredAccidentReports}
            newAccidentReport={newAccidentReport}
            setNewAccidentReport={setNewAccidentReport}
            search={search}
            setSearch={setSearch}
            selectedCompanyId={selectedCompanyId}
            setSelectedCompanyId={setSelectedCompanyId}
            addAccidentReport={addAccidentReport}
            updateAccidentReportStatus={updateAccidentReportStatus}
            deleteAccidentReport={deleteAccidentReport}
          />
        )}

        {activeTab === "firma-ziyaretleri" && (
          <CompanyVisitsTab
            styles={styles}
            companies={companies}
            filteredCompanyVisits={filteredCompanyVisits}
            newCompanyVisit={newCompanyVisit}
            setNewCompanyVisit={setNewCompanyVisit}
            search={search}
            setSearch={setSearch}
            selectedCompanyId={selectedCompanyId}
            setSelectedCompanyId={setSelectedCompanyId}
            addCompanyVisit={addCompanyVisit}
            updateCompanyVisitStatus={updateCompanyVisitStatus}
            deleteCompanyVisit={deleteCompanyVisit}
          />
        )}

        {activeTab === "arsiv" && (
          <ArchiveTab
            styles={styles}
            companies={companies}
            archiveItems={archiveItems}
            filteredArchiveItems={filteredArchiveItems}
            archiveTypes={archiveTypes}
            archiveStatuses={archiveStatuses}
            archiveTypeFilter={archiveTypeFilter}
            setArchiveTypeFilter={setArchiveTypeFilter}
            archiveStatusFilter={archiveStatusFilter}
            setArchiveStatusFilter={setArchiveStatusFilter}
            archiveDateFrom={archiveDateFrom}
            setArchiveDateFrom={setArchiveDateFrom}
            archiveDateTo={archiveDateTo}
            setArchiveDateTo={setArchiveDateTo}
            documentsCount={documents.length}
            plansAndTrainingsCount={trainings.length + annualPlans.length}
            riskDofAccidentCount={accidentReports.length + risks.length + dofs.length}
            search={search}
            setSearch={setSearch}
            selectedCompanyId={selectedCompanyId}
            setSelectedCompanyId={setSelectedCompanyId}
            setActiveTab={setActiveTab}
          />
        )}

        {activeTab === "ek2muayene" && (
          <Ek2MuayeneFormu
            styles={styles}
            companies={companies}
            employees={employees}
            userRole={userProfile?.activeRole || userProfile?.role || ""}
            userId={userProfile?.uid || ""}
          />
        )}

        {activeTab === "nace-sorgula" && (
          <NaceLookupTab
            styles={styles}
            compactLayout={compactLayout}
            isAdmin={isAdmin}
            onApplyToCompany={(code, dangerClass) => {
              setNewCompany({ ...newCompany, naceCode: code, dangerClass });
              setActiveTab("firmalar");
            }}
          />
        )}

        {activeTab === "myk-sorgula" && (
          <MykLookupTab
            styles={styles}
            compactLayout={compactLayout}
            companies={companies}
            employees={employees}
            onOpenEmployee={(employeeId) => {
              setSelectedEmployeeId(employeeId);
              setActiveTab("personel");
            }}
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
