import { ChangeEvent, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { onAuthStateChanged, signOut } from "firebase/auth";
import {
  collection,
  getDocs,
  doc,
  getDoc,
  query,
  where,
  documentId,
} from "firebase/firestore";
import { db, auth } from "../../lib/firebase";
import { useUserRole } from "./useUserRole";
import { useLanguage } from "./i18n";
import { getPlan, withinLimit, type Plan } from "./plans";
import { emptyNewEmployee } from "./constants";
import { getDashboardOverview } from "./dashboardOverview";
import { formatDate } from "./dateUtils";
import { generateDofPDF as generateDofPDFDocument } from "./dofPdf";
import {
  createCompanyRecord,
  deleteCompanyCascade,
  emptyCompanyDraft,
} from "./companyService";
import {
  createEmployeeRecord,
  deleteEmployeeRecord,
  saveEmployeeChecklist,
  saveEmployeeTraining,
  validateNewEmployee,
} from "./employeeService";
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
} from "./dofRiskService";
import {
  createDocumentRecord,
  createObserverRecord,
  createSignerRecord,
  deleteDocumentRecord,
  deleteObserverRecord,
  deleteSignerRecord,
  emptyDocumentDraft,
  emptyObserverDraft,
} from "./recordService";
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
} from "./moduleRecordService";
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
} from "./dashboardSelectors";
import {
  normalizeCommitteeMeetingRecord,
  normalizeEmployeeRecord,
  normalizeTrainingRecord,
} from "./dashboardUtils";
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
  TrainingRecord,
  TrainingStatus,
} from "./types";

const isMobileScreen = () =>
  typeof window !== "undefined" && window.innerWidth <= 768;

export function usePageState() {
  const router = useRouter();
  const { user: userProfile, isAdmin, isHumanResources, loading: roleLoading } = useUserRole();
  const { t } = useLanguage();

  const getLocalAuditUpdate = () => ({
    updatedBy: userProfile?.uid || "",
    updatedAsRole: userProfile?.activeRole || userProfile?.role || "admin",
    updatedAt: new Date().toISOString(),
  });

  // ── UI state ──────────────────────────────────────────────────────────────
  const [mounted, setMounted] = useState(false);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [pdfLoading, setPdfLoading] = useState(false);
  const [darkMode, setDarkMode] = useState<boolean>(() => {
    if (typeof window === "undefined") return true;
    const theme = localStorage.getItem("theme");
    if (theme === "dark" || theme === "light") return theme === "dark";
    const saved = localStorage.getItem("isg-dark-mode");
    return saved !== null ? saved === "true" : true;
  });

  useEffect(() => {
    document.documentElement.classList.toggle("dark", darkMode);
    document.documentElement.classList.toggle("light", !darkMode);
    document.body.classList.remove("dark", "light");
    document.body.classList.add(darkMode ? "dark" : "light");
    localStorage.setItem("theme", darkMode ? "dark" : "light");
    localStorage.setItem("isg-dark-mode", String(darkMode));
  }, [darkMode]);

  // ── Data state ────────────────────────────────────────────────────────────
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
  const [signers, setSigners] = useState<Signer[]>([]);
  const [emailSettings, setEmailSettings] = useState<EmailSettings>({
    enabled: true, toEmail: "", ccEmail: "",
    subject: "[İSG] Yeni DÖF Bildirimi: {dofTitle}", message: "",
  });

  // ── Navigation / filter state ─────────────────────────────────────────────
  const [activeTab, setActiveTab] = useState("firmalar");
  const [search, setSearch] = useState("");
  const [selectedCompanyId, setSelectedCompanyId] = useState("all");
  const [archiveTypeFilter, setArchiveTypeFilter] = useState("all");
  const [archiveStatusFilter, setArchiveStatusFilter] = useState("all");
  const [archiveDateFrom, setArchiveDateFrom] = useState("");
  const [archiveDateTo, setArchiveDateTo] = useState("");
  const [selectedEmployeeId, setSelectedEmployeeId] = useState<string | null>(null);
  const [editingDofId, setEditingDofId] = useState<string | null>(null);

  // ── Form / draft state ────────────────────────────────────────────────────
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

  // ── Plan / limit state ────────────────────────────────────────────────────
  const [planError, setPlanError] = useState<string | null>(null);
  const [pdfTodayCount, setPdfTodayCount] = useState<number>(() => {
    if (typeof window === "undefined") return 0;
    const saved = localStorage.getItem("isg-pdf-count");
    if (!saved) return 0;
    try {
      const { date, count } = JSON.parse(saved);
      return date === new Date().toDateString() ? count : 0;
    } catch { return 0; }
  });

  // ── Status state ──────────────────────────────────────────────────────────
  const [dofAdding, setDofAdding] = useState(false);
  const [dofAddStatus, setDofAddStatus] = useState<string | null>(null);
  const [employeeAddStatus, setEmployeeAddStatus] = useState<string | null>(null);

  // ── Data loading ──────────────────────────────────────────────────────────
  async function loadCompanyScopedRecords<T extends { id: string }>(
    collectionName: string
  ): Promise<T[]> {
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
    const snaps = await Promise.all(
      chunks.map(ids => {
        const field = collectionName === "companies" ? documentId() : "companyId";
        return getDocs(query(collection(db, collectionName), where(field, "in", ids)));
      })
    );
    return snaps.flatMap(snap => snap.docs.map(d => ({ id: d.id, ...d.data() } as T)));
  }

  async function loadAll() {
    if (!userProfile) return;
    setLoading(true);
    setLoadError(null);
    try {
      const [
        compResult, empResult, docResult, obsResult, dofResult, riskResult,
        signerResult, annualPlanResult, trainingResult, ppeResult,
        emergencyPlanResult, committeeMeetingResult, accidentReportResult, companyVisitResult,
      ] = await Promise.allSettled([
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
      const failedLoads = loadResults
        .filter(({ result }) => result.status === "rejected")
        .map(({ label }) => label);

      if (failedLoads.length > 0) {
        setLoadError(
          `${failedLoads.join(", ")} verileri yüklenemedi. Firebase Rules içinde bu role okuma izni verilmeli.`
        );
      }

      if (compResult.status === "fulfilled") setCompanies(compResult.value);
      if (empResult.status === "fulfilled") setEmployees(empResult.value.map(normalizeEmployeeRecord));
      if (docResult.status === "fulfilled") setDocuments(docResult.value);
      if (obsResult.status === "fulfilled") setObservers(obsResult.value);
      if (dofResult.status === "fulfilled") setDofs(dofResult.value);
      if (riskResult.status === "fulfilled") setRisks(riskResult.value);
      if (signerResult.status === "fulfilled") setSigners(signerResult.value);
      if (annualPlanResult.status === "fulfilled") setAnnualPlans(annualPlanResult.value);
      if (trainingResult.status === "fulfilled")
        setTrainings(trainingResult.value.map(normalizeTrainingRecord));
      if (ppeResult.status === "fulfilled") setPpeRecords(ppeResult.value);
      if (emergencyPlanResult.status === "fulfilled") setEmergencyPlans(emergencyPlanResult.value);
      if (committeeMeetingResult.status === "fulfilled")
        setCommitteeMeetings(committeeMeetingResult.value.map(normalizeCommitteeMeetingRecord));
      if (accidentReportResult.status === "fulfilled") setAccidentReports(accidentReportResult.value);
      if (companyVisitResult.status === "fulfilled") setCompanyVisits(companyVisitResult.value);

      const emailDoc = await getDoc(doc(db, "settings", "emailNotifications"));
      if (emailDoc.exists()) {
        setEmailSettings(emailDoc.data() as EmailSettings);
      }
    } catch (e) {
      console.error("Firestore yükleme hatası", e);
    } finally {
      setLoading(false);
      setMounted(true);
    }
  }

  // ── Effects ───────────────────────────────────────────────────────────────
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (!user) router.push("/login");
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

  // ── Derived state ─────────────────────────────────────────────────────────
  const selectedEmployee = employees.find(e => e.id === selectedEmployeeId) ?? null;
  const selectedEmployeeCompany = selectedEmployee
    ? companies.find(c => c.id === selectedEmployee.companyId) ?? null
    : null;
  const activeRole = userProfile?.activeRole || userProfile?.role;
  const activeRoleLabel = activeRole ? t(`role.${activeRole}`) : "";
  const compactLayout = isMobileScreen();

  // ── Plan ──────────────────────────────────────────────────────────────────
  // Admin her zaman sınırsız erişime sahiptir
  const currentPlan: Plan = isAdmin ? getPlan("osgb") : getPlan(userProfile?.plan);

  function showPlanError(msg: string) {
    setPlanError(msg);
    setTimeout(() => setPlanError(null), 6000);
  }

  function incrementPdfCount() {
    const next = pdfTodayCount + 1;
    setPdfTodayCount(next);
    localStorage.setItem("isg-pdf-count", JSON.stringify({ date: new Date().toDateString(), count: next }));
  }

  // ── Helper functions ──────────────────────────────────────────────────────
  function getCompanyDocuments(companyId: string) {
    return selectCompanyDocuments(documents, companyId);
  }
  function getCompanyDocSummary(companyId: string) {
    return selectCompanyDocSummary(documents, companyId);
  }
  function getCompanyIndicator(companyId: string) {
    return selectCompanyIndicator(documents, companyId);
  }

  function compressImageFile(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      if (!file.type.startsWith("image/")) {
        reject(new Error("Lütfen geçerli bir fotoğraf seçin."));
        return;
      }

      const reader = new FileReader();
      reader.onerror = () => reject(new Error("Fotoğraf okunamadı."));
      reader.onload = () => {
        const img = new Image();
        img.onerror = () => reject(new Error("Fotoğraf işlenemedi."));
        img.onload = () => {
          const maxSide = 1600;
          const scale = Math.min(1, maxSide / Math.max(img.width, img.height));
          const width = Math.max(1, Math.round(img.width * scale));
          const height = Math.max(1, Math.round(img.height * scale));
          const canvas = document.createElement("canvas");
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext("2d");
          if (!ctx) {
            reject(new Error("Fotoğraf işlenemedi."));
            return;
          }
          ctx.drawImage(img, 0, 0, width, height);
          resolve(canvas.toDataURL("image/jpeg", 0.78));
        };
        img.src = String(reader.result || "");
      };
      reader.readAsDataURL(file);
    });
  }

  async function handleImageToBase64(
    event: ChangeEvent<HTMLInputElement>,
    callback: (base64: string) => void
  ) {
    const file = event.target.files?.[0];
    if (!file) return;
    try {
      const compressed = await compressImageFile(file);
      if (compressed.length > 900 * 1024) {
        alert("Fotoğraf hâlâ çok büyük. Lütfen daha düşük çözünürlüklü bir fotoğraf seçin.");
        return;
      }
      callback(compressed);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Fotoğraf yüklenemedi.";
      alert(message);
    } finally {
      event.target.value = "";
    }
  }
  function printEmployeeCertificate(employee: Employee, company: Company | null) {
    if (!company || !employee.checklist.isgCertificateDate) return;
    const signatures =
      company.serviceType === "İş Güvenliği + İşyeri Hekimliği"
        ? ["İşveren / İşveren Vekili", "İş Güvenliği Uzmanı", "İşyeri Hekimi"]
        : ["İşveren / İşveren Vekili", "İş Güvenliği Uzmanı"];
    const html = `<html><head><title>İSG Sertifikası</title><style>body{font-family:Arial,sans-serif;padding:40px}.box{border:2px solid #000;padding:30px}h1{text-align:center;margin-bottom:30px}.line{margin-bottom:12px;font-size:18px}.signatures{margin-top:60px;display:flex;justify-content:space-between;gap:20px}.sig{width:30%;text-align:center}.topline{border-top:1px solid #000;padding-top:10px;margin-top:50px}</style></head><body><div class="box"><h1>İSG EĞİTİM SERTİFİKASI</h1><div class="line"><strong>Personel:</strong> ${employee.firstName} ${employee.lastName}</div><div class="line"><strong>T.C. Kimlik No:</strong> ${employee.tcNo}</div><div class="line"><strong>Unvan:</strong> ${employee.title}</div><div class="line"><strong>Firma:</strong> ${company.officialName}</div><div class="line"><strong>Hizmet Türü:</strong> ${company.serviceType}</div><div class="line"><strong>Eğitim / Sertifika Tarihi:</strong> ${formatDate(employee.checklist.isgCertificateDate)}</div><div class="signatures">${signatures.map(s => `<div class="sig"><div class="topline">${s}</div></div>`).join("")}</div></div></body></html>`;
    const win = window.open("", "_blank", "width=900,height=700");
    if (!win) return;
    win.document.open();
    win.document.write(html);
    win.document.close();
    win.focus();
    win.print();
  }

  // ── Filtered memos ────────────────────────────────────────────────────────
  const filteredCompanies = useMemo(
    () => filterCompanies(companies, search),
    [companies, search]
  );
  const filteredEmployees = useMemo(
    () => filterEmployees(employees, companies, selectedCompanyId, search),
    [employees, companies, selectedCompanyId, search]
  );
  const filteredDocuments = useMemo(
    () => filterDocuments(documents, companies, employees, selectedCompanyId, search),
    [documents, companies, employees, selectedCompanyId, search]
  );
  const filteredDofs = useMemo(
    () => filterDofs(dofs, companies, selectedCompanyId, search),
    [dofs, companies, selectedCompanyId, search]
  );
  const filteredRisks = useMemo(
    () => filterRisks(risks, companies, selectedCompanyId, search),
    [risks, companies, selectedCompanyId, search]
  );
  const filteredAnnualPlans = useMemo(
    () => filterAnnualPlans(annualPlans, companies, selectedCompanyId, search),
    [annualPlans, companies, selectedCompanyId, search]
  );
  const filteredTrainings = useMemo(
    () => filterTrainings(trainings, companies, employees, selectedCompanyId, search),
    [trainings, companies, employees, selectedCompanyId, search]
  );
  const filteredPpeRecords = useMemo(
    () => filterPpeRecords(ppeRecords, companies, employees, selectedCompanyId, search),
    [ppeRecords, companies, employees, selectedCompanyId, search]
  );
  const filteredEmergencyPlans = useMemo(
    () => filterEmergencyPlans(emergencyPlans, companies, selectedCompanyId, search),
    [emergencyPlans, companies, selectedCompanyId, search]
  );
  const filteredCommitteeMeetings = useMemo(
    () => filterCommitteeMeetings(committeeMeetings, companies, employees, selectedCompanyId, search),
    [committeeMeetings, companies, employees, selectedCompanyId, search]
  );
  const filteredAccidentReports = useMemo(
    () => filterAccidentReports(accidentReports, companies, employees, selectedCompanyId, search),
    [accidentReports, companies, employees, selectedCompanyId, search]
  );
  const filteredCompanyVisits = useMemo(
    () => filterCompanyVisits(companyVisits, companies, selectedCompanyId, search),
    [companyVisits, companies, selectedCompanyId, search]
  );
  const archiveItems = useMemo<ArchiveItem[]>(
    () => buildArchiveItems({ documents, annualPlans, trainings, ppeRecords, emergencyPlans, committeeMeetings, accidentReports, companyVisits, dofs, risks, employees }),
    [documents, annualPlans, trainings, ppeRecords, emergencyPlans, committeeMeetings, accidentReports, companyVisits, dofs, risks, employees]
  );
  const filteredArchiveItems = useMemo(
    () => filterArchiveItems(archiveItems, companies, selectedCompanyId, search, archiveTypeFilter, archiveStatusFilter, archiveDateFrom, archiveDateTo),
    [archiveItems, companies, selectedCompanyId, search, archiveTypeFilter, archiveStatusFilter, archiveDateFrom, archiveDateTo]
  );
  const archiveTypes = useMemo(
    () => Array.from(new Set(archiveItems.map(item => item.type))).sort(),
    [archiveItems]
  );
  const archiveStatuses = useMemo(
    () => Array.from(new Set(archiveItems.map(item => item.status || "Arşivde"))).sort(),
    [archiveItems]
  );
  const taskItems = useMemo<TaskItem[]>(
    () => buildTaskItems({ documents, employees, dofs, risks, trainings, annualPlans, accidentReports, companyVisits, companies, activeRole }),
    [activeRole, annualPlans, accidentReports, companies, companyVisits, documents, dofs, employees, risks, trainings]
  );
  const filteredTaskItems = useMemo(
    () => filterTaskItems(taskItems, companies, selectedCompanyId, search),
    [taskItems, companies, selectedCompanyId, search]
  );

  // ── Dashboard overview ────────────────────────────────────────────────────
  const dashboardOverview = useMemo(
    () => getDashboardOverview({ activeRole, companies, employees, documents, dofs, risks, trainings, ppeRecords, accidentReports, companyVisits, taskItems }),
    [activeRole, companies, employees, documents, dofs, risks, trainings, ppeRecords, accidentReports, companyVisits, taskItems]
  );

  // ── Company handlers ──────────────────────────────────────────────────────
  async function addCompany() {
    if (!isAdmin) return;
    if (!withinLimit(companies.length, currentPlan.maxCompanies)) {
      showPlanError(`❌ Firma limitine ulaştınız (${currentPlan.maxCompanies} firma). Daha fazla firma eklemek için paketinizi yükseltin.`);
      return;
    }
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

  // ── Employee handlers ─────────────────────────────────────────────────────
  async function addEmployee() {
    setEmployeeAddStatus(null);
    if (!withinLimit(employees.length, currentPlan.maxEmployees)) {
      setEmployeeAddStatus(`❌ Personel limitine ulaştınız (${currentPlan.maxEmployees} personel). Daha fazla personel eklemek için paketinizi yükseltin.`);
      return;
    }
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
    setEmployees(prev =>
      prev.map(e => e.id === employeeId ? { ...e, checklist, onboarding, trainingComplete } : e)
    );
  }

  async function updateEmployeeTraining(employeeId: string, trainingComplete: boolean) {
    const employee = employees.find(e => e.id === employeeId);
    const update = await saveEmployeeTraining(db, employee, employeeId, trainingComplete);
    setEmployees(prev => prev.map(e => e.id === employeeId ? { ...e, ...update } : e));
  }

  // ── Document handlers ─────────────────────────────────────────────────────
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

  // ── Observer handlers ─────────────────────────────────────────────────────
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

  // ── DÖF handlers ──────────────────────────────────────────────────────────
  async function generateDofPDF(dof: DofRecord, returnBase64?: boolean): Promise<string | void> {
    if (!returnBase64) {
      // Yalnızca kullanıcıya sunulan PDF'ler sayılır (base64 = e-posta için, sayılmaz)
      if (!withinLimit(pdfTodayCount, currentPlan.maxPdfPerDay)) {
        showPlanError(`❌ Günlük PDF limitine ulaştınız (${currentPlan.maxPdfPerDay}/gün). Sınırsız PDF için paketinizi yükseltin.`);
        return;
      }
      incrementPdfCount();
    }
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

      if (emailSettings.enabled && emailSettings.toEmail) {
        try {
          const pdfBase64 = await generateDofPDF(dof, true);
          const token = await auth.currentUser?.getIdToken();
          if (!token) throw new Error("Oturum doğrulaması gerekli");
          const res = await fetch("/api/send-dof-email", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
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
    await updateDofStatusRecord(db, id, status, userProfile!);
    const audit = getLocalAuditUpdate();
    setDofs(prev => prev.map(d => d.id === id ? { ...d, status, ...audit } : d));
  }

  async function updateDofPhoto(id: string, field: "beforePhoto" | "afterPhoto", base64: string) {
    await updateDofPhotoRecord(db, id, field, base64, userProfile!);
    const audit = getLocalAuditUpdate();
    setDofs(prev => prev.map(d => d.id === id ? { ...d, [field]: base64, ...audit } : d));
  }

  async function removeDofPhoto(id: string, field: "beforePhoto" | "afterPhoto") {
    await removeDofPhotoRecord(db, id, field, userProfile!);
    const audit = getLocalAuditUpdate();
    setDofs(prev => prev.map(d => d.id === id ? { ...d, [field]: "", ...audit } : d));
  }

  async function createRiskFromDof(dof: DofRecord) {
    if (risks.some(r => r.sourceDofId === dof.id)) {
      setActiveTab("risk");
      return;
    }
    if (dof.status !== "Önlem Alındı") return;
    const risk = await createRiskFromDofRecord(db, dof, userProfile!);
    setRisks(prev => [...prev, risk]);
    const audit = getLocalAuditUpdate();
    setDofs(prev => prev.map(d => d.id === dof.id ? { ...d, status: "Riske Aktarıldı", ...audit } : d));
    setActiveTab("risk");
  }

  // ── Risk handlers ─────────────────────────────────────────────────────────
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

  // ── Signer handlers ───────────────────────────────────────────────────────
  async function addSigner(companyId: string, role: SignerRole, fullName: string) {
    const signer = await createSignerRecord(db, companyId, role, fullName, userProfile!);
    if (!signer) return;
    setSigners(prev => [...prev, signer]);
  }

  async function deleteSigner(id: string) {
    await deleteSignerRecord(db, id);
    setSigners(prev => prev.filter(s => s.id !== id));
  }

  // ── Annual plan handlers ──────────────────────────────────────────────────
  async function addAnnualPlan() {
    const annualPlan = await createAnnualPlanRecord(db, newAnnualPlan, userProfile!);
    if (!annualPlan) return;
    setAnnualPlans(prev => [...prev, annualPlan]);
    setNewAnnualPlan(emptyAnnualPlanDraft);
  }

  async function updateAnnualPlanStatus(id: string, status: AnnualPlanStatus) {
    await updateModuleRecordStatus(db, "annualPlans", id, status, userProfile!);
    const audit = getLocalAuditUpdate();
    setAnnualPlans(prev => prev.map(plan => plan.id === id ? { ...plan, status, ...audit } : plan));
  }

  async function deleteAnnualPlan(id: string) {
    await deleteModuleRecord(db, "annualPlans", id);
    setAnnualPlans(prev => prev.filter(plan => plan.id !== id));
  }

  // ── Training handlers ─────────────────────────────────────────────────────
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
    await updateModuleRecordStatus(db, "trainings", id, status, userProfile!);
    const audit = getLocalAuditUpdate();
    setTrainings(prev => prev.map(t => t.id === id ? { ...t, status, ...audit } : t));
  }

  async function deleteTraining(id: string) {
    await deleteModuleRecord(db, "trainings", id);
    setTrainings(prev => prev.filter(t => t.id !== id));
  }

  // ── PPE handlers ──────────────────────────────────────────────────────────
  async function addPpeRecord() {
    const ppeRecord = await createPpeRecord(db, newPpe, userProfile!);
    if (!ppeRecord) return;
    setPpeRecords(prev => [...prev, ppeRecord]);
    setNewPpe(emptyPpeDraft);
  }

  async function updatePpeStatus(id: string, status: PpeStatus) {
    await updateModuleRecordStatus(db, "ppeRecords", id, status, userProfile!);
    const audit = getLocalAuditUpdate();
    setPpeRecords(prev => prev.map(r => r.id === id ? { ...r, status, ...audit } : r));
  }

  async function deletePpeRecord(id: string) {
    await deleteModuleRecord(db, "ppeRecords", id);
    setPpeRecords(prev => prev.filter(r => r.id !== id));
  }

  // ── Emergency plan handlers ───────────────────────────────────────────────
  async function addEmergencyPlan() {
    const emergencyPlan = await createEmergencyPlanRecord(db, newEmergencyPlan, userProfile!);
    if (!emergencyPlan) return;
    setEmergencyPlans(prev => [...prev, emergencyPlan]);
    setNewEmergencyPlan(emptyEmergencyPlanDraft);
  }

  async function updateEmergencyPlanStatus(id: string, status: EmergencyPlanStatus) {
    await updateModuleRecordStatus(db, "emergencyPlans", id, status, userProfile!);
    const audit = getLocalAuditUpdate();
    setEmergencyPlans(prev => prev.map(p => p.id === id ? { ...p, status, ...audit } : p));
  }

  async function deleteEmergencyPlan(id: string) {
    await deleteModuleRecord(db, "emergencyPlans", id);
    setEmergencyPlans(prev => prev.filter(p => p.id !== id));
  }

  // ── Committee meeting handlers ────────────────────────────────────────────
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
    await updateModuleRecordStatus(db, "committeeMeetings", id, status, userProfile!);
    const audit = getLocalAuditUpdate();
    setCommitteeMeetings(prev => prev.map(m => m.id === id ? { ...m, status, ...audit } : m));
  }

  async function deleteCommitteeMeeting(id: string) {
    await deleteModuleRecord(db, "committeeMeetings", id);
    setCommitteeMeetings(prev => prev.filter(m => m.id !== id));
  }

  // ── Accident report handlers ──────────────────────────────────────────────
  async function addAccidentReport() {
    const accidentReport = await createAccidentReportRecord(db, newAccidentReport, userProfile!);
    if (!accidentReport) return;
    setAccidentReports(prev => [...prev, accidentReport]);
    setNewAccidentReport(emptyAccidentReportDraft);
  }

  async function updateAccidentReportStatus(id: string, status: AccidentReportStatus) {
    await updateModuleRecordStatus(db, "accidentReports", id, status, userProfile!);
    const audit = getLocalAuditUpdate();
    setAccidentReports(prev => prev.map(r => r.id === id ? { ...r, status, ...audit } : r));
  }

  async function deleteAccidentReport(id: string) {
    await deleteModuleRecord(db, "accidentReports", id);
    setAccidentReports(prev => prev.filter(r => r.id !== id));
  }

  // ── Company visit handlers ────────────────────────────────────────────────
  async function addCompanyVisit() {
    const companyVisit = await createCompanyVisitRecord(db, newCompanyVisit, userProfile!);
    if (!companyVisit) return;
    setCompanyVisits(prev => [...prev, companyVisit]);
    setNewCompanyVisit(emptyCompanyVisitDraft);
  }

  async function updateCompanyVisitStatus(id: string, status: CompanyVisitStatus) {
    await updateModuleRecordStatus(db, "companyVisits", id, status, userProfile!);
    const audit = getLocalAuditUpdate();
    setCompanyVisits(prev => prev.map(v => v.id === id ? { ...v, status, ...audit } : v));
  }

  async function deleteCompanyVisit(id: string) {
    await deleteModuleRecord(db, "companyVisits", id);
    setCompanyVisits(prev => prev.filter(v => v.id !== id));
  }

  // ── Auth ──────────────────────────────────────────────────────────────────
  async function handleSignOut() {
    await signOut(auth);
    router.push("/login?reason=logged_out");
  }

  // ── Tabs & menu groups ────────────────────────────────────────────────────
  const allTabDefs = [
    { id: "ozet", label: "📊 Özet" },
    { id: "gorevler", label: "✅ Görevler" },
    { id: "firmalar", label: "🏢 Firmalar" },
    { id: "personel", label: "👤 Personel" },
    { id: "paketler", label: "📦 Paketler" },
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

  const tabs = (isHumanResources && !isAdmin
    ? [{ id: "personel", label: "👥 İnsan Kaynakları" }]
    : allTabDefs
  ).map(tab => ({
    ...tab,
    locked: currentPlan.lockedModules.includes(tab.id),
  }));

  const menuGroups: Array<{ title: string; items: Array<{ id: string; label: string; disabled?: boolean; locked?: boolean }> }> =
    isHumanResources && !isAdmin
      ? [{ title: "Yönetim", items: tabs }]
      : [
        { title: "Yönetim", items: tabs.filter(tab => ["ozet", "gorevler", "firmalar", "personel", "paketler", "kullanicilar"].includes(tab.id)) },
        { title: "Risk Yönetimi", items: tabs.filter(tab => ["gozlemciler", "dof", "risk"].includes(tab.id)) },
        { title: "Formlar & Belgeler", items: tabs.filter(tab => ["belgeler", "imzacilar", "ek2muayene", "kkd-formu", "is-kazasi-raporu"].includes(tab.id)) },
        {
          title: "Planlama & Arşiv",
          items: tabs.filter(tab => ["yillik-planlar", "egitimler", "acil-durum-plani", "kurul-toplantisi", "firma-ziyaretleri", "arsiv"].includes(tab.id)),
        },
        { title: "Araçlar", items: tabs.filter(tab => ["nace-sorgula", "myk-sorgula"].includes(tab.id)) },
      ];

  // ── Return ────────────────────────────────────────────────────────────────
  return {
    // Auth / user
    userProfile, isAdmin, isHumanResources, roleLoading,
    activeRole, activeRoleLabel,
    handleSignOut,

    // Plan
    currentPlan,
    planError, setPlanError,
    pdfTodayCount,

    // UI
    mounted, loading, loadError,
    pdfLoading, setPdfLoading,
    darkMode, setDarkMode,
    compactLayout,

    // Navigation
    activeTab, setActiveTab,
    search, setSearch,
    selectedCompanyId, setSelectedCompanyId,
    archiveTypeFilter, setArchiveTypeFilter,
    archiveStatusFilter, setArchiveStatusFilter,
    archiveDateFrom, setArchiveDateFrom,
    archiveDateTo, setArchiveDateTo,
    selectedEmployeeId, setSelectedEmployeeId,
    editingDofId, setEditingDofId,

    // Data
    companies, setCompanies,
    employees,
    documents,
    observers,
    dofs,
    risks,
    annualPlans,
    trainings,
    ppeRecords,
    emergencyPlans,
    committeeMeetings,
    accidentReports,
    companyVisits,
    signers,

    // Derived
    selectedEmployee,
    selectedEmployeeCompany,

    // Filtered lists
    filteredCompanies,
    filteredEmployees,
    filteredDocuments,
    filteredDofs,
    filteredRisks,
    filteredAnnualPlans,
    filteredTrainings,
    filteredPpeRecords,
    filteredEmergencyPlans,
    filteredCommitteeMeetings,
    filteredAccidentReports,
    filteredCompanyVisits,

    // Archive
    archiveItems,
    filteredArchiveItems,
    archiveTypes,
    archiveStatuses,

    // Tasks
    taskItems,
    filteredTaskItems,

    // Dashboard
    roleDashboardTitle: dashboardOverview.title,
    roleDashboardSubtitle: dashboardOverview.subtitle,
    roleDashboardCards: dashboardOverview.cards,
    roleQuickActions: dashboardOverview.quickActions,
    topDashboardTasks: dashboardOverview.topTasks,
    upcomingTrainings: dashboardOverview.upcomingTrainings,
    openAccidentReports: dashboardOverview.openAccidentReports,
    followUpVisits: dashboardOverview.followUpVisits,

    // Form drafts
    newCompany, setNewCompany,
    newEmployee, setNewEmployee,
    newDocument, setNewDocument,
    newObserver, setNewObserver,
    newDof, setNewDof,
    newRisk, setNewRisk,
    newAnnualPlan, setNewAnnualPlan,
    newTraining, setNewTraining,
    newPpe, setNewPpe,
    newEmergencyPlan, setNewEmergencyPlan,
    newCommitteeMeeting, setNewCommitteeMeeting,
    newAccidentReport, setNewAccidentReport,
    newCompanyVisit, setNewCompanyVisit,

    // Status
    dofAdding,
    dofAddStatus, setDofAddStatus,
    employeeAddStatus,

    // Tabs / navigation
    tabs,
    menuGroups,

    // Data loading
    loadAll,

    // Helpers
    getCompanyDocuments,
    getCompanyDocSummary,
    getCompanyIndicator,
    handleImageToBase64,
    printEmployeeCertificate,

    // Company handlers
    addCompany,
    deleteCompany,

    // Employee handlers
    addEmployee,
    deleteEmployee,
    updateEmployeeChecklist,
    updateEmployeeTraining,

    // Document handlers
    addDocument,
    deleteDocument,

    // Observer handlers
    addObserver,
    deleteObserver,

    // DÖF handlers
    generateDofPDF,
    addDof,
    deleteDof,
    updateDofStatus,
    updateDofPhoto,
    removeDofPhoto,
    createRiskFromDof,

    // Risk handlers
    addRisk,
    deleteRisk,

    // Signer handlers
    addSigner,
    deleteSigner,

    // Annual plan handlers
    addAnnualPlan,
    updateAnnualPlanStatus,
    deleteAnnualPlan,

    // Training handlers
    toggleTrainingParticipant,
    addTraining,
    updateTrainingStatus,
    deleteTraining,

    // PPE handlers
    addPpeRecord,
    updatePpeStatus,
    deletePpeRecord,

    // Emergency plan handlers
    addEmergencyPlan,
    updateEmergencyPlanStatus,
    deleteEmergencyPlan,

    // Committee meeting handlers
    toggleCommitteeParticipant,
    addCommitteeMeeting,
    updateCommitteeMeetingStatus,
    deleteCommitteeMeeting,

    // Accident report handlers
    addAccidentReport,
    updateAccidentReportStatus,
    deleteAccidentReport,

    // Company visit handlers
    addCompanyVisit,
    updateCompanyVisitStatus,
    deleteCompanyVisit,
  };
}
