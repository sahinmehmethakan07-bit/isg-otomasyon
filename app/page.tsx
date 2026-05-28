"use client";
// SessionGuard devre disi
// destroySession devre disi
import { useUserRole } from "./lib/useUserRole";
import { getUserProfile, UserProfile, UserRole, ROLE_CONFIG } from "./lib/roleManager";
import { AccidentReportsTab } from "./lib/AccidentReportsTab";
import { AdminUserPanel } from "./lib/AdminUserPanel";
import { AnnualPlansTab } from "./lib/AnnualPlansTab";
import { ArchiveTab } from "./lib/ArchiveTab";
import { CommitteeMeetingsTab } from "./lib/CommitteeMeetingsTab";
import { CompanyVisitsTab } from "./lib/CompanyVisitsTab";
import { CompaniesTab } from "./lib/CompaniesTab";
import { DocumentsTab } from "./lib/DocumentsTab";
import { DofTab } from "./lib/DofTab";
import { Ek2MuayeneFormu } from "./lib/Ek2MuayeneFormu";
import { EmployeeDetailPanel } from "./lib/EmployeeDetailPanel";
import { EmployeeForm } from "./lib/EmployeeForm";
import { EmployeeTable } from "./lib/EmployeeTable";
import { EmergencyPlansTab } from "./lib/EmergencyPlansTab";
import { MykLookupTab, NaceLookupTab } from "./lib/LookupTabs";
import { ObserversTab } from "./lib/ObserversTab";
import { PpeTab } from "./lib/PpeTab";
import { RiskTab } from "./lib/RiskTab";
import { SignersTab } from "./lib/SignersTab";
import { TrainingsTab } from "./lib/TrainingsTab";
import WorkInstructionsTab from "./lib/WorkInstructionsTab";
import { useLanguage } from "./lib/i18n";
import {
  generateRiskPDF,
} from "./lib/pdf";
import { emptyNewEmployee } from "./lib/constants";
import { getDashboardOverview } from "./lib/dashboardOverview";
import { generateDofPDF as generateDofPDFDocument } from "./lib/dofPdf";
import {
  createCompanyRecord,
  deleteCompanyCascade,
  emptyCompanyDraft,
} from "./lib/companyService";
import {
  createEmployeeRecord,
  deleteEmployeeRecord,
  saveEmployeeChecklist,
  saveEmployeeTraining,
  validateNewEmployee,
} from "./lib/employeeService";
import {
  createDofRecord,
  createRiskFromDofRecord,
  createRiskRecord,
  deleteDofRecord,
  deleteRiskRecord,
  emptyDofDraft,
  emptyRiskDraft,
  removeDofPhotoRecord,
  updateDofPhotoRecord,
  updateDofStatusRecord,
} from "./lib/dofRiskService";
import {
  createDocumentRecord,
  createObserverRecord,
  createSignerRecord,
  deleteDocumentRecord,
  deleteObserverRecord,
  deleteSignerRecord,
  emptyDocumentDraft,
  emptyObserverDraft,
} from "./lib/recordService";
import {
  createAccidentReportRecord,
  createAnnualPlanRecord,
  createCommitteeMeetingRecord,
  createCompanyVisitRecord,
  createEmergencyPlanRecord,
  createPpeRecord,
  createTrainingRecord,
  deleteModuleRecord,
  emptyAccidentReportDraft,
  emptyAnnualPlanDraft,
  emptyCommitteeMeetingDraft,
  emptyCompanyVisitDraft,
  emptyEmergencyPlanDraft,
  emptyPpeDraft,
  emptyTrainingDraft,
  updateModuleRecordStatus,
} from "./lib/moduleRecordService";
import {
  buildArchiveItems,
  buildTaskItems,
  filterAccidentReports,
  filterAnnualPlans,
  filterArchiveItems,
  filterCommitteeMeetings,
  filterCompanies,
  filterCompanyVisits,
  filterDocuments,
  filterDofs,
  filterEmergencyPlans,
  filterEmployees,
  filterPpeRecords,
  filterRisks,
  filterTaskItems,
  filterTrainings,
  getCompanyDocSummary as selectCompanyDocSummary,
  getCompanyDocuments as selectCompanyDocuments,
  getCompanyIndicator as selectCompanyIndicator,
} from "./lib/dashboardSelectors";
import {
  annualPlanStatusColor,
  checklistCompletion,
  createOnboardingFromChecklist,
  daysUntil,
  getDateStatus,
  normalizeCommitteeMeetingRecord,
  normalizeEmployeeRecord,
  normalizeTrainingRecord,
  priorityColor,
  riskScoreColor,
  statusColor,
} from "./lib/dashboardUtils";
import type {
  AccidentReportRecord,
  AccidentReportStatus,
  AnnualPlanRecord,
  AnnualPlanStatus,
  ArchiveItem,
  CommitteeMeetingRecord,
  CommitteeMeetingStatus,
  Company,
  CompanyVisitRecord,
  CompanyVisitStatus,
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
  Signer,
  SignerRole,
  TaskItem,
  TaskPriority,
  TrainingRecord,
  TrainingStatus,
} from "./lib/types";

import React, { ChangeEvent, useEffect, useMemo, useState } from "react";
import { db, auth } from "../lib/firebase";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { useRouter } from "next/navigation";
import {
  collection,
  getDocs,
  doc,
  getDoc,
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

  const [newCompany, setNewCompany] = useState(emptyCompanyDraft);
  const [newEmployee, setNewEmployee] = useState<NewEmployeeForm>(emptyNewEmployee);
  const [newDocument, setNewDocument] = useState(emptyDocumentDraft);
  const [newObserver, setNewObserver] = useState(emptyObserverDraft);
  const [newDof, setNewDof] = useState(emptyDofDraft);
  const [newRisk, setNewRisk] = useState(emptyRiskDraft);
  const [newAnnualPlan, setNewAnnualPlan] = useState(emptyAnnualPlanDraft);
  const [newTraining, setNewTraining] = useState(emptyTrainingDraft);
  const [newPpe, setNewPpe] = useState(emptyPpeDraft);
  const [newEmergencyPlan, setNewEmergencyPlan] = useState(emptyEmergencyPlanDraft);
  const [newCommitteeMeeting, setNewCommitteeMeeting] = useState(emptyCommitteeMeetingDraft);
  const [newAccidentReport, setNewAccidentReport] = useState(emptyAccidentReportDraft);
  const [newCompanyVisit, setNewCompanyVisit] = useState(emptyCompanyVisitDraft);

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

  function getCompanyDocuments(companyId: string) {
    return selectCompanyDocuments(documents, companyId);
  }

  function getCompanyDocSummary(companyId: string) {
    return selectCompanyDocSummary(documents, companyId);
  }

  function getCompanyIndicator(companyId: string) {
    return selectCompanyIndicator(documents, companyId);
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

  const filteredCompanies = useMemo(() => filterCompanies(companies, search), [companies, search]);
  const filteredEmployees = useMemo(() => filterEmployees(employees, companies, selectedCompanyId, search), [employees, companies, selectedCompanyId, search]);
  const filteredDocuments = useMemo(() => filterDocuments(documents, companies, employees, selectedCompanyId, search), [documents, companies, employees, selectedCompanyId, search]);
  const filteredDofs = useMemo(() => filterDofs(dofs, companies, selectedCompanyId, search), [dofs, companies, selectedCompanyId, search]);
  const filteredRisks = useMemo(() => filterRisks(risks, companies, selectedCompanyId, search), [risks, companies, selectedCompanyId, search]);
  const filteredAnnualPlans = useMemo(() => filterAnnualPlans(annualPlans, companies, selectedCompanyId, search), [annualPlans, companies, selectedCompanyId, search]);
  const filteredTrainings = useMemo(() => filterTrainings(trainings, companies, employees, selectedCompanyId, search), [trainings, companies, employees, selectedCompanyId, search]);
  const filteredPpeRecords = useMemo(() => filterPpeRecords(ppeRecords, companies, employees, selectedCompanyId, search), [ppeRecords, companies, employees, selectedCompanyId, search]);
  const filteredEmergencyPlans = useMemo(() => filterEmergencyPlans(emergencyPlans, companies, selectedCompanyId, search), [emergencyPlans, companies, selectedCompanyId, search]);
  const filteredCommitteeMeetings = useMemo(() => filterCommitteeMeetings(committeeMeetings, companies, employees, selectedCompanyId, search), [committeeMeetings, companies, employees, selectedCompanyId, search]);
  const filteredAccidentReports = useMemo(() => filterAccidentReports(accidentReports, companies, employees, selectedCompanyId, search), [accidentReports, companies, employees, selectedCompanyId, search]);
  const filteredCompanyVisits = useMemo(() => filterCompanyVisits(companyVisits, companies, selectedCompanyId, search), [companyVisits, companies, selectedCompanyId, search]);
  const archiveItems = useMemo<ArchiveItem[]>(() => buildArchiveItems({ documents, annualPlans, trainings, ppeRecords, emergencyPlans, committeeMeetings, accidentReports, companyVisits, dofs, risks, employees }), [documents, annualPlans, trainings, ppeRecords, emergencyPlans, committeeMeetings, accidentReports, companyVisits, dofs, risks, employees]);
  const filteredArchiveItems = useMemo(() => filterArchiveItems(archiveItems, companies, selectedCompanyId, search, archiveTypeFilter, archiveStatusFilter, archiveDateFrom, archiveDateTo), [archiveItems, companies, selectedCompanyId, search, archiveTypeFilter, archiveStatusFilter, archiveDateFrom, archiveDateTo]);
  const archiveTypes = useMemo(() => Array.from(new Set(archiveItems.map(item => item.type))).sort(), [archiveItems]);
  const archiveStatuses = useMemo(() => Array.from(new Set(archiveItems.map(item => item.status || "Arşivde"))).sort(), [archiveItems]);
  const taskItems = useMemo<TaskItem[]>(() => buildTaskItems({ documents, employees, dofs, risks, trainings, annualPlans, accidentReports, companyVisits, companies, activeRole }), [activeRole, annualPlans, accidentReports, companies, companyVisits, documents, dofs, employees, risks, trainings]);
  const filteredTaskItems = useMemo(() => filterTaskItems(taskItems, companies, selectedCompanyId, search), [taskItems, companies, selectedCompanyId, search]);

  async function addCompany() {
    if (!isAdmin) return;
    const company = await createCompanyRecord(db, newCompany, userProfile!);
    if (!company) return;
    setCompanies(prev => [...prev, company]);
    setNewCompany(emptyCompanyDraft);
  }

  async function deleteCompany(id: string) {
    if (!isAdmin) return;
    if (!confirm("Bu firmayı silmek istediğinizden emin misiniz?")) return;
    await deleteCompanyCascade(db, id, { employees, documents, dofs, risks, signers, companyVisits });
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
    const validationMessage = validateNewEmployee(newEmployee);
    if (validationMessage) {
      setEmployeeAddStatus(validationMessage);
      return;
    }

    try {
      const employee = await createEmployeeRecord(db, newEmployee, userProfile!);
      setEmployees(prev => [...prev, employee]);
      setNewEmployee(emptyNewEmployee);
      setEmployeeAddStatus("✅ Personel kaydı oluşturuldu. Doktor ve İSG uzmanı için onboarding görevleri açıldı.");
    } catch (error) {
      const message = error instanceof Error ? error.message : "Bilinmeyen hata";
      setEmployeeAddStatus(`❌ Personel eklenemedi: ${message}`);
    }
  }

  async function deleteEmployee(id: string) {
    if (!confirm("Bu personeli silmek istediğinizden emin misiniz?")) return;
    await deleteEmployeeRecord(db, id);
    setEmployees(prev => prev.filter(e => e.id !== id));
    if (selectedEmployeeId === id) setSelectedEmployeeId(null);
  }

  async function updateEmployeeChecklist(employeeId: string, checklist: EmployeeChecklist) {
    const { onboarding, trainingComplete } = await saveEmployeeChecklist(db, employeeId, checklist);
    setEmployees(prev => prev.map(e => e.id === employeeId ? { ...e, checklist, onboarding, trainingComplete } : e));
  }

  async function updateEmployeeTraining(employeeId: string, trainingComplete: boolean) {
    const employee = employees.find(e => e.id === employeeId);
    const update = await saveEmployeeTraining(db, employee, employeeId, trainingComplete);
    setEmployees(prev => prev.map(e => e.id === employeeId ? { ...e, ...update } : e));
  }

  async function addDocument() {
    const document = await createDocumentRecord(db, newDocument, userProfile!);
    if (!document) return;
    setDocuments(prev => [...prev, document]);
    setNewDocument(emptyDocumentDraft);
  }

  async function deleteDocument(id: string) {
    await deleteDocumentRecord(db, id);
    setDocuments(prev => prev.filter(d => d.id !== id));
  }

  async function addObserver() {
    const observer = await createObserverRecord(db, newObserver, userProfile!);
    if (!observer) return;
    setObservers(prev => [...prev, observer]);
    setNewObserver(emptyObserverDraft);
  }

  async function deleteObserver(id: string) {
    await deleteObserverRecord(db, id);
    setObservers(prev => prev.filter(o => o.id !== id));
  }

  async function generateDofPDF(dof: DofRecord, returnBase64?: boolean): Promise<string | void> {
    return generateDofPDFDocument(dof, { companies, observers, signers }, returnBase64);
  }

  async function addDof() {
    if (!newDof.companyId || !newDof.title) return;
    setDofAdding(true);
    setDofAddStatus(null);
    try {
      const dof = await createDofRecord(db, newDof, userProfile!);
      if (!dof) return;
      setDofs(prev => [...prev, dof]);

      // E-mail bildirimi — sadece email aktifse gönder
      if (emailSettings.enabled && emailSettings.toEmail) {
        try {
          const pdfBase64 = await generateDofPDF(dof, true);
          const res = await fetch("/api/send-dof-email", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ dofId: dof.id, pdfBase64 }),
          });
          if (res.ok) {
            setDofs(prev => prev.map(d => d.id === dof.id ? { ...d, status: "Bildirildi" } : d));
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

      setNewDof(emptyDofDraft);
    } catch (e: any) {
      setDofAddStatus(`❌ DÖF kaydedilemedi: ${e.message}`);
    } finally {
      setDofAdding(false);
      setTimeout(() => setDofAddStatus(null), 6000);
    }
  }

  async function deleteDof(id: string) {
    await deleteDofRecord(db, id);
    setDofs(prev => prev.filter(d => d.id !== id));
  }

  async function updateDofStatus(id: string, status: DofRecord["status"]) {
    await updateDofStatusRecord(db, id, status);
    setDofs(prev => prev.map(d => d.id === id ? { ...d, status } : d));
  }

  async function updateDofPhoto(id: string, field: "beforePhoto" | "afterPhoto", base64: string) {
    await updateDofPhotoRecord(db, id, field, base64);
    setDofs(prev => prev.map(d => d.id === id ? { ...d, [field]: base64 } : d));
  }

  async function removeDofPhoto(id: string, field: "beforePhoto" | "afterPhoto") {
    await removeDofPhotoRecord(db, id, field);
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
    const risk = await createRiskFromDofRecord(db, dof, userProfile!);
    setRisks(prev => [...prev, risk]);
    // DÖF durumunu güncelle
    setDofs(prev => prev.map(d => d.id === dof.id ? { ...d, status: "Riske Aktarıldı" } : d));
    setActiveTab("risk");
  }

  async function addRisk() {
    const risk = await createRiskRecord(db, newRisk, userProfile!);
    if (!risk) return;
    setRisks(prev => [...prev, risk]);
    setNewRisk(emptyRiskDraft);
  }

  async function deleteRisk(id: string) {
    await deleteRiskRecord(db, id);
    setRisks(prev => prev.filter(r => r.id !== id));
  }

  async function addSigner(companyId: string, role: SignerRole, fullName: string) {
    const signer = await createSignerRecord(db, companyId, role, fullName, userProfile!);
    if (!signer) return;
    setSigners(prev => [...prev, signer]);
  }

  async function deleteSigner(id: string) {
    await deleteSignerRecord(db, id);
    setSigners(prev => prev.filter(s => s.id !== id));
  }

  async function addAnnualPlan() {
    const annualPlan = await createAnnualPlanRecord(db, newAnnualPlan, userProfile!);
    if (!annualPlan) return;
    setAnnualPlans(prev => [...prev, annualPlan]);
    setNewAnnualPlan(emptyAnnualPlanDraft);
  }

  async function updateAnnualPlanStatus(id: string, status: AnnualPlanStatus) {
    await updateModuleRecordStatus(db, "annualPlans", id, status);
    setAnnualPlans(prev => prev.map(plan => plan.id === id ? { ...plan, status } : plan));
  }

  async function deleteAnnualPlan(id: string) {
    await deleteModuleRecord(db, "annualPlans", id);
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
    const training = await createTrainingRecord(db, newTraining, userProfile!);
    if (!training) return;
    setTrainings(prev => [...prev, training]);
    setNewTraining(emptyTrainingDraft);
  }

  async function updateTrainingStatus(id: string, status: TrainingStatus) {
    await updateModuleRecordStatus(db, "trainings", id, status);
    setTrainings(prev => prev.map(training => training.id === id ? { ...training, status } : training));
  }

  async function deleteTraining(id: string) {
    await deleteModuleRecord(db, "trainings", id);
    setTrainings(prev => prev.filter(training => training.id !== id));
  }

  async function addPpeRecord() {
    const ppeRecord = await createPpeRecord(db, newPpe, userProfile!);
    if (!ppeRecord) return;
    setPpeRecords(prev => [...prev, ppeRecord]);
    setNewPpe(emptyPpeDraft);
  }

  async function updatePpeStatus(id: string, status: PpeStatus) {
    await updateModuleRecordStatus(db, "ppeRecords", id, status);
    setPpeRecords(prev => prev.map(record => record.id === id ? { ...record, status } : record));
  }

  async function deletePpeRecord(id: string) {
    await deleteModuleRecord(db, "ppeRecords", id);
    setPpeRecords(prev => prev.filter(record => record.id !== id));
  }

  async function addEmergencyPlan() {
    const emergencyPlan = await createEmergencyPlanRecord(db, newEmergencyPlan, userProfile!);
    if (!emergencyPlan) return;
    setEmergencyPlans(prev => [...prev, emergencyPlan]);
    setNewEmergencyPlan(emptyEmergencyPlanDraft);
  }

  async function updateEmergencyPlanStatus(id: string, status: EmergencyPlanStatus) {
    await updateModuleRecordStatus(db, "emergencyPlans", id, status);
    setEmergencyPlans(prev => prev.map(plan => plan.id === id ? { ...plan, status } : plan));
  }

  async function deleteEmergencyPlan(id: string) {
    await deleteModuleRecord(db, "emergencyPlans", id);
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
    const committeeMeeting = await createCommitteeMeetingRecord(db, newCommitteeMeeting, userProfile!);
    if (!committeeMeeting) return;
    setCommitteeMeetings(prev => [...prev, committeeMeeting]);
    setNewCommitteeMeeting(emptyCommitteeMeetingDraft);
  }

  async function updateCommitteeMeetingStatus(id: string, status: CommitteeMeetingStatus) {
    await updateModuleRecordStatus(db, "committeeMeetings", id, status);
    setCommitteeMeetings(prev => prev.map(meeting => meeting.id === id ? { ...meeting, status } : meeting));
  }

  async function deleteCommitteeMeeting(id: string) {
    await deleteModuleRecord(db, "committeeMeetings", id);
    setCommitteeMeetings(prev => prev.filter(meeting => meeting.id !== id));
  }

  async function addAccidentReport() {
    const accidentReport = await createAccidentReportRecord(db, newAccidentReport, userProfile!);
    if (!accidentReport) return;
    setAccidentReports(prev => [...prev, accidentReport]);
    setNewAccidentReport(emptyAccidentReportDraft);
  }

  async function updateAccidentReportStatus(id: string, status: AccidentReportStatus) {
    await updateModuleRecordStatus(db, "accidentReports", id, status);
    setAccidentReports(prev => prev.map(report => report.id === id ? { ...report, status } : report));
  }

  async function deleteAccidentReport(id: string) {
    await deleteModuleRecord(db, "accidentReports", id);
    setAccidentReports(prev => prev.filter(report => report.id !== id));
  }

  async function addCompanyVisit() {
    const companyVisit = await createCompanyVisitRecord(db, newCompanyVisit, userProfile!);
    if (!companyVisit) return;
    setCompanyVisits(prev => [...prev, companyVisit]);
    setNewCompanyVisit(emptyCompanyVisitDraft);
  }

  async function updateCompanyVisitStatus(id: string, status: CompanyVisitStatus) {
    await updateModuleRecordStatus(db, "companyVisits", id, status);
    setCompanyVisits(prev => prev.map(visit => visit.id === id ? { ...visit, status } : visit));
  }

  async function deleteCompanyVisit(id: string) {
    await deleteModuleRecord(db, "companyVisits", id);
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
      { id: "talimatlar", label: "📋 Talimatlar" },
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
      { title: "Formlar & Belgeler", items: tabs.filter(tab => ["belgeler", "imzacilar", "ek2muayene", "kkd-formu", "talimatlar", "is-kazasi-raporu"].includes(tab.id)) },
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

  const activeRoleLabel = activeRole ? t(`role.${activeRole}`) : "";
  const dashboardOverview = getDashboardOverview({
    activeRole,
    companies,
    employees,
    documents,
    dofs,
    risks,
    trainings,
    ppeRecords,
    accidentReports,
    companyVisits,
    taskItems,
  });
  const roleDashboardTitle = dashboardOverview.title;
  const roleDashboardSubtitle = dashboardOverview.subtitle;
  const roleDashboardCards = dashboardOverview.cards;
  const roleQuickActions = dashboardOverview.quickActions;
  const topDashboardTasks = dashboardOverview.topTasks;
  const upcomingTrainings = dashboardOverview.upcomingTrainings;
  const openAccidentReports = dashboardOverview.openAccidentReports;
  const followUpVisits = dashboardOverview.followUpVisits;
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
          <CompaniesTab
            styles={styles}
            isAdmin={isAdmin}
            companies={companies}
            filteredCompanies={filteredCompanies}
            newCompany={newCompany}
            setNewCompany={setNewCompany}
            search={search}
            setSearch={setSearch}
            addCompany={addCompany}
            deleteCompany={deleteCompany}
            getCompanyIndicator={getCompanyIndicator}
          />
        )}

        {activeTab === "personel" && (
          <div style={{ display: "grid", gridTemplateColumns: selectedEmployee && !compactLayout ? "minmax(0, 1fr) minmax(380px, 420px)" : "minmax(0, 1fr)", gap: 20, minWidth: 0, alignItems: "start" }}>
            <EmployeeForm
              styles={styles}
              companies={companies}
              newEmployee={newEmployee}
              setNewEmployee={setNewEmployee}
              compactLayout={compactLayout}
              employeeAddStatus={employeeAddStatus}
              addEmployee={addEmployee}
              handleImageToBase64={handleImageToBase64}
            />
            <EmployeeTable
              styles={styles}
              companies={companies}
              filteredEmployees={filteredEmployees}
              search={search}
              setSearch={setSearch}
              selectedCompanyId={selectedCompanyId}
              setSelectedCompanyId={setSelectedCompanyId}
              selectedEmployeeId={selectedEmployeeId}
              setSelectedEmployeeId={setSelectedEmployeeId}
              deleteEmployee={deleteEmployee}
            />
            {selectedEmployee && (
              <EmployeeDetailPanel
                styles={styles}
                selectedEmployee={selectedEmployee}
                selectedEmployeeCompany={selectedEmployeeCompany}
                updateEmployeeChecklist={updateEmployeeChecklist}
                updateEmployeeTraining={updateEmployeeTraining}
                printEmployeeCertificate={printEmployeeCertificate}
              />
            )}
          </div>
        )}

        {activeTab === "belgeler" && (
          <DocumentsTab
            styles={styles}
            companies={companies}
            employees={employees}
            filteredDocuments={filteredDocuments}
            newDocument={newDocument}
            setNewDocument={setNewDocument}
            search={search}
            setSearch={setSearch}
            selectedCompanyId={selectedCompanyId}
            setSelectedCompanyId={setSelectedCompanyId}
            addDocument={addDocument}
            deleteDocument={deleteDocument}
          />
        )}

        {activeTab === "gozlemciler" && (
          <ObserversTab
            styles={styles}
            observers={observers}
            newObserver={newObserver}
            setNewObserver={setNewObserver}
            addObserver={addObserver}
            deleteObserver={deleteObserver}
          />
        )}

        {activeTab === "dof" && (
          <DofTab
            styles={styles}
            companies={companies}
            observers={observers}
            employees={employees}
            filteredDofs={filteredDofs}
            risks={risks}
            newDof={newDof}
            setNewDof={setNewDof}
            dofAdding={dofAdding}
            dofAddStatus={dofAddStatus}
            setDofAddStatus={setDofAddStatus}
            search={search}
            setSearch={setSearch}
            selectedCompanyId={selectedCompanyId}
            setSelectedCompanyId={setSelectedCompanyId}
            editingDofId={editingDofId}
            setEditingDofId={setEditingDofId}
            addDof={addDof}
            updateDofStatus={updateDofStatus}
            updateDofPhoto={updateDofPhoto}
            removeDofPhoto={removeDofPhoto}
            createRiskFromDof={createRiskFromDof}
            generateDofPDF={generateDofPDF}
            deleteDof={deleteDof}
            handleImageToBase64={handleImageToBase64}
          />
        )}

        {activeTab === "risk" && (
          <RiskTab
            styles={styles}
            companies={companies}
            dofs={dofs}
            risks={risks}
            signers={signers}
            filteredRisks={filteredRisks}
            newRisk={newRisk}
            setNewRisk={setNewRisk}
            pdfLoading={pdfLoading}
            setPdfLoading={setPdfLoading}
            search={search}
            setSearch={setSearch}
            selectedCompanyId={selectedCompanyId}
            setSelectedCompanyId={setSelectedCompanyId}
            addRisk={addRisk}
            deleteRisk={deleteRisk}
            setActiveTab={setActiveTab}
          />
        )}

        {activeTab === "imzacilar" && (
          <SignersTab
            styles={styles}
            companies={companies}
            signers={signers}
            isAdmin={isAdmin}
            addSigner={addSigner}
            deleteSigner={deleteSigner}
          />
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

        {activeTab === "talimatlar" && (
          <WorkInstructionsTab styles={styles} />
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
