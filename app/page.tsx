"use client";

import { ChangeEvent, useEffect, useMemo, useState } from "react";

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
};

type AppData = {
  companies: Company[];
  employees: Employee[];
  documents: DocumentRecord[];
  observers: Observer[];
  dofs: DofRecord[];
  risks: RiskRecord[];
};

const STORAGE_KEY = "isg-otomasyon-v4";

const sgkCompanyRegistry: Record<string, { officialName: string; naceCode: string }> = {
  "2612345678901234567890": {
    officialName: "Örnek Turizm Otelcilik İnşaat Sanayi ve Ticaret A.Ş.",
    naceCode: "55.10.01",
  },
  "2611111111111111111111": {
    officialName: "Mavi Deniz Gıda Dağıtım Lojistik Limited Şirketi",
    naceCode: "46.38.01",
  },
  "2699999999999999999999": {
    officialName: "Yıldız Yapı İnşaat Taahhüt ve Mühendislik A.Ş.",
    naceCode: "41.20.01",
  },
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

const initialData: AppData = {
  companies: [
    {
      id: "f1",
      nickName: "Örnek Turizm",
      officialName: "Örnek Turizm Otelcilik İnşaat Sanayi ve Ticaret A.Ş.",
      sgkSicil: "2612345678901234567890",
      naceCode: "55.10.01",
      dangerClass: "Çok Tehlikeli",
      employeeCount: 85,
      contractEnd: "2026-07-30",
      serviceType: "İş Güvenliği + İşyeri Hekimliği",
    },
    {
      id: "f2",
      nickName: "Mavi Deniz Gıda",
      officialName: "Mavi Deniz Gıda Dağıtım Lojistik Limited Şirketi",
      sgkSicil: "2611111111111111111111",
      naceCode: "46.38.01",
      dangerClass: "Tehlikeli",
      employeeCount: 24,
      contractEnd: "2026-05-15",
      serviceType: "İş Güvenliği",
    },
  ],
  employees: [
    {
      id: "p1",
      companyId: "f1",
      firstName: "Ahmet",
      lastName: "Kaya",
      tcNo: "11111111110",
      title: "Garson",
      hireDate: "2025-06-10",
      isActive: true,
      trainingComplete: true,
      checklist: {
        isgCertificateDate: "2026-01-10",
        ek2Date: "2026-01-10",
        orientationDate: "2025-06-10",
        preTest: true,
        postTest: true,
        undertaking: true,
        kkdMinutes: true,
        attendanceDoc: true,
      },
    },
    {
      id: "p2",
      companyId: "f1",
      firstName: "Ayşe",
      lastName: "Demir",
      tcNo: "11111111111",
      title: "Kat Görevlisi",
      hireDate: "2024-03-22",
      isActive: true,
      trainingComplete: false,
      checklist: {
        ...emptyChecklist,
        orientationDate: "2024-03-22",
        preTest: true,
      },
    },
  ],
  documents: [
    {
      id: "d1",
      companyId: "f1",
      employeeId: null,
      type: "Risk Değerlendirme Raporu",
      issueDate: "2024-08-01",
      expiryDate: "2026-08-01",
    },
    {
      id: "d2",
      companyId: "f1",
      employeeId: null,
      type: "Acil Durum Eylem Planı",
      issueDate: "2025-07-15",
      expiryDate: "2026-04-20",
    },
  ],
  observers: [
    {
      id: "o1",
      fullName: "Osman Yavuz",
      title: "İş Güvenliği Uzmanı",
      certificateNo: "C-12345",
      phone: "05550000001",
    },
  ],
  dofs: [
    {
      id: "dof1",
      companyId: "f1",
      observerId: "o1",
      title: "Açık elektrik panosu",
      description: "Makine dairesindeki elektrik panosunun kapağı açık durumda.",
      lawReference: "6331 ve ilgili elektrik güvenliği tedbirleri",
      priority: "Yüksek",
      responsible: "Bakım Şefi",
      dueDate: "2026-04-25",
      status: "Açık",
      location: "Makine Dairesi",
    },
  ],
  risks: [
    {
      id: "r1",
      companyId: "f1",
      sourceDofId: null,
      section: "Mutfak",
      hazard: "Kaygan zemin",
      risk: "Düşme, burkulma",
      currentMeasure: "Uyarı levhası mevcut",
      actionToTake: "Kaymaz paspas ve anlık temizlik kontrolü",
      probability: 3,
      severity: 3,
      score: 9,
      residualProbability: 2,
      residualSeverity: 2,
      residualScore: 4,
      responsible: "Şef Garson",
      dueDate: "2026-05-01",
      status: "Açık",
    },
  ],
};

const requiredCompanyDocs = [
  "Risk Değerlendirme Raporu",
  "Acil Durum Eylem Planı",
  "Yıllık Eğitim Planı",
  "Yıllık Çalışma Planı",
];

const documentTemplates = [
  "Risk Değerlendirme Raporu",
  "DÖF Formu",
  "Acil Durum Eylem Planı",
  "Yıllık Eğitim Planı",
  "Yıllık Çalışma Planı",
  "Yıllık Değerlendirme Raporu",
  "Çalışan Temsilcisi Atama Tutanağı",
  "Çalışan Temsilcisi Eğitim Tutanağı",
  "Çalışan Temsilcisi Eğitim Sertifikası",
  "Kurul Üyeleri Atama Tutanağı",
  "Kurul Üyeleri Eğitim Katılım Sertifikası",
  "Eğitim Katılım Tutanağı",
  "İSG Kurul Toplantı Tutanağı",
  "Destek Elemanları Atama Tutanağı",
  "Destek Elemanları Eğitim Katılım Tutanağı",
  "İşe Giriş Sağlık Muayene Formu",
  "İSG Sertifikası",
  "EK-2",
];

function daysUntil(dateString: string) {
  const now = new Date();
  const target = new Date(dateString);
  const diff = target.getTime() - now.getTime();
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
}

function getDateStatus(dateString: string) {
  const days = daysUntil(dateString);
  if (days < 0) return "Süresi Dolmuş";
  if (days <= 30) return "Yaklaşıyor";
  return "Geçerli";
}

function dangerFromNace(naceCode: string): DangerClass {
  const code = naceCode.trim();
  if (
    code.startsWith("41") ||
    code.startsWith("42") ||
    code.startsWith("43") ||
    code.startsWith("55") ||
    code.startsWith("56")
  ) {
    return "Çok Tehlikeli";
  }
  if (
    code.startsWith("46") ||
    code.startsWith("49") ||
    code.startsWith("52") ||
    code.startsWith("81")
  ) {
    return "Tehlikeli";
  }
  return "Az Tehlikeli";
}

function extractNaceFromSgk(sgkSicil: string) {
  const clean = sgkSicil.replace(/\D/g, "");
  if (sgkCompanyRegistry[clean]) return sgkCompanyRegistry[clean].naceCode;
  if (clean.length >= 6) {
    return `${clean.slice(0, 2)}.${clean.slice(2, 4)}.${clean.slice(4, 6)}`;
  }
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
    !!checklist.isgCertificateDate,
    !!checklist.ek2Date,
    !!checklist.orientationDate,
    checklist.preTest,
    checklist.postTest,
    checklist.undertaking,
    checklist.kkdMinutes,
    checklist.attendanceDoc,
  ];
  const completed = items.filter(Boolean).length;
  return { completed, total: items.length, missing: items.length - completed };
}

// ─── Shared UI primitives ────────────────────────────────────────────────────

const styles: Record<string, React.CSSProperties> = {
  app: {
    minHeight: "100vh",
    backgroundColor: "#0f172a",
    color: "#e2e8f0",
    fontFamily: "'IBM Plex Sans', system-ui, sans-serif",
  },
  header: {
    backgroundColor: "#1e293b",
    borderBottom: "1px solid #334155",
    padding: "0 24px",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    height: 56,
  },
  headerLogo: {
    display: "flex",
    alignItems: "center",
    gap: 10,
    fontWeight: 700,
    fontSize: 17,
    letterSpacing: "-0.3px",
    color: "#f1f5f9",
  },
  headerLogoAccent: {
    color: "#38bdf8",
  },
  nav: {
    display: "flex",
    gap: 2,
    padding: "12px 24px 0",
    borderBottom: "1px solid #1e293b",
    backgroundColor: "#0f172a",
    overflowX: "auto" as const,
  },
  navBtn: {
    padding: "8px 16px",
    borderRadius: "6px 6px 0 0",
    border: "none",
    cursor: "pointer",
    fontSize: 13,
    fontWeight: 500,
    whiteSpace: "nowrap" as const,
    transition: "all 0.15s",
  },
  content: {
    padding: 24,
    maxWidth: 1400,
    margin: "0 auto",
  },
  card: {
    backgroundColor: "#1e293b",
    border: "1px solid #334155",
    borderRadius: 10,
    padding: 20,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: 600,
    color: "#94a3b8",
    textTransform: "uppercase" as const,
    letterSpacing: "0.08em",
    marginBottom: 16,
  },
  input: {
    width: "100%",
    backgroundColor: "#0f172a",
    border: "1px solid #334155",
    borderRadius: 6,
    color: "#e2e8f0",
    padding: "8px 12px",
    fontSize: 13,
    outline: "none",
    boxSizing: "border-box" as const,
  },
  select: {
    width: "100%",
    backgroundColor: "#0f172a",
    border: "1px solid #334155",
    borderRadius: 6,
    color: "#e2e8f0",
    padding: "8px 12px",
    fontSize: 13,
    outline: "none",
    boxSizing: "border-box" as const,
  },
  label: {
    fontSize: 12,
    color: "#94a3b8",
    marginBottom: 4,
    display: "block",
  },
  formGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))",
    gap: 12,
  },
  btnPrimary: {
    backgroundColor: "#0ea5e9",
    color: "#fff",
    border: "none",
    borderRadius: 6,
    padding: "8px 16px",
    fontSize: 13,
    fontWeight: 600,
    cursor: "pointer",
  },
  btnDanger: {
    backgroundColor: "#dc2626",
    color: "#fff",
    border: "none",
    borderRadius: 6,
    padding: "6px 12px",
    fontSize: 12,
    cursor: "pointer",
  },
  btnSecondary: {
    backgroundColor: "#334155",
    color: "#e2e8f0",
    border: "none",
    borderRadius: 6,
    padding: "6px 12px",
    fontSize: 12,
    cursor: "pointer",
  },
  badge: {
    display: "inline-block",
    padding: "2px 8px",
    borderRadius: 4,
    fontSize: 11,
    fontWeight: 600,
  },
  table: {
    width: "100%",
    borderCollapse: "collapse" as const,
    fontSize: 13,
  },
  th: {
    textAlign: "left" as const,
    padding: "8px 12px",
    borderBottom: "1px solid #334155",
    color: "#94a3b8",
    fontWeight: 600,
    fontSize: 12,
    textTransform: "uppercase" as const,
    letterSpacing: "0.05em",
  },
  td: {
    padding: "10px 12px",
    borderBottom: "1px solid #1e293b",
    verticalAlign: "top" as const,
  },
  searchBar: {
    display: "flex",
    gap: 10,
    marginBottom: 16,
    alignItems: "center",
    flexWrap: "wrap" as const,
  },
  statGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))",
    gap: 12,
    marginBottom: 20,
  },
  statCard: {
    backgroundColor: "#1e293b",
    border: "1px solid #334155",
    borderRadius: 8,
    padding: 16,
  },
  statValue: {
    fontSize: 28,
    fontWeight: 700,
    lineHeight: 1,
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: "#94a3b8",
  },
};

function Badge({ text, color }: { text: string; color: string }) {
  return (
    <span
      style={{
        ...styles.badge,
        backgroundColor: color + "22",
        color: color,
        border: `1px solid ${color}44`,
      }}
    >
      {text}
    </span>
  );
}

function FormField({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label style={styles.label}>{label}</label>
      {children}
    </div>
  );
}

// ─── Main Component ──────────────────────────────────────────────────────────

export default function Page() {
  const [mounted, setMounted] = useState(false);

  const [companies, setCompanies] = useState<Company[]>(initialData.companies);
  const [employees, setEmployees] = useState<Employee[]>(initialData.employees);
  const [documents, setDocuments] = useState<DocumentRecord[]>(initialData.documents);
  const [observers, setObservers] = useState<Observer[]>(initialData.observers);
  const [dofs, setDofs] = useState<DofRecord[]>(initialData.dofs);
  const [risks, setRisks] = useState<RiskRecord[]>(initialData.risks);

  const [activeTab, setActiveTab] = useState("firmalar");
  const [search, setSearch] = useState("");
  const [selectedCompanyId, setSelectedCompanyId] = useState("all");
  const [selectedEmployeeId, setSelectedEmployeeId] = useState<string | null>(
    initialData.employees[0]?.id ?? null
  );

  const [editingCompanyId, setEditingCompanyId] = useState<string | null>(null);
  const [editingEmployeeId, setEditingEmployeeId] = useState<string | null>(null);
  const [editingObserverId, setEditingObserverId] = useState<string | null>(null);
  const [editingDofId, setEditingDofId] = useState<string | null>(null);
  const [editingRiskId, setEditingRiskId] = useState<string | null>(null);

  const [newCompany, setNewCompany] = useState({
    nickName: "",
    officialName: "",
    sgkSicil: "",
    naceCode: "",
    dangerClass: "Az Tehlikeli" as DangerClass,
    employeeCount: "",
    contractEnd: "",
    serviceType: "İş Güvenliği" as ServiceType,
  });

  const [newEmployee, setNewEmployee] = useState({
    companyId: "",
    firstName: "",
    lastName: "",
    tcNo: "",
    title: "",
    hireDate: "",
    isActive: "true",
    trainingComplete: "false",
  });

  const [newDocument, setNewDocument] = useState({
    companyId: "",
    employeeId: "",
    type: "Risk Değerlendirme Raporu",
    issueDate: "",
    expiryDate: "",
  });

  const [newObserver, setNewObserver] = useState({
    fullName: "",
    title: "",
    certificateNo: "",
    phone: "",
  });

  const [newDof, setNewDof] = useState({
    companyId: "",
    observerId: "",
    title: "",
    description: "",
    lawReference: "",
    priority: "Orta" as "Düşük" | "Orta" | "Yüksek",
    responsible: "",
    dueDate: "",
    status: "Açık" as "Açık" | "Devam Ediyor" | "Kapandı",
    location: "",
    beforePhoto: "",
    afterPhoto: "",
  });

  const [newRisk, setNewRisk] = useState({
    companyId: "",
    section: "",
    hazard: "",
    risk: "",
    currentMeasure: "",
    actionToTake: "",
    probability: "1",
    severity: "1",
    residualProbability: "1",
    residualSeverity: "1",
    responsible: "",
    dueDate: "",
    status: "Açık" as "Açık" | "Kontrol Altında" | "Kapandı",
  });

  // ── LocalStorage ─────────────────────────────────────────────────────────

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as AppData;
        setCompanies(parsed.companies || initialData.companies);
        setEmployees(parsed.employees || initialData.employees);
        setDocuments(parsed.documents || initialData.documents);
        setObservers(parsed.observers || initialData.observers);
        setDofs(parsed.dofs || initialData.dofs);
        setRisks(parsed.risks || initialData.risks);
        if (parsed.employees?.length) setSelectedEmployeeId(parsed.employees[0].id);
      }
    } catch (e) {
      console.error("localStorage okuma hatası", e);
    } finally {
      setMounted(true);
    }
  }, []);

  useEffect(() => {
    if (!mounted) return;
    const data: AppData = { companies, employees, documents, observers, dofs, risks };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  }, [mounted, companies, employees, documents, observers, dofs, risks]);

  // ── Derived state ─────────────────────────────────────────────────────────

  const selectedEmployee = employees.find((e) => e.id === selectedEmployeeId) ?? null;
  const selectedEmployeeCompany = selectedEmployee
    ? companies.find((c) => c.id === selectedEmployee.companyId) ?? null
    : null;

  function resetAllData() {
    localStorage.removeItem(STORAGE_KEY);
    setCompanies(initialData.companies);
    setEmployees(initialData.employees);
    setDocuments(initialData.documents);
    setObservers(initialData.observers);
    setDofs(initialData.dofs);
    setRisks(initialData.risks);
    setSelectedEmployeeId(initialData.employees[0]?.id ?? null);
    setEditingCompanyId(null);
    setEditingEmployeeId(null);
    setEditingObserverId(null);
    setEditingDofId(null);
    setEditingRiskId(null);
  }

  function getCompanyDocuments(companyId: string) {
    return documents.filter((d) => d.companyId === companyId && d.employeeId === null);
  }

  function getCompanyDocSummary(companyId: string) {
    const companyDocs = getCompanyDocuments(companyId);
    const missingCount = requiredCompanyDocs.filter(
      (docType) => !companyDocs.some((d) => d.type === docType)
    ).length;
    const expiredCount = companyDocs.filter(
      (d) => getDateStatus(d.expiryDate) === "Süresi Dolmuş"
    ).length;
    const soonCount = companyDocs.filter(
      (d) => getDateStatus(d.expiryDate) === "Yaklaşıyor"
    ).length;
    return { missingCount, expiredCount, soonCount };
  }

  function getCompanyIndicator(companyId: string) {
    const summary = getCompanyDocSummary(companyId);
    if (summary.missingCount > 0 || summary.expiredCount > 0)
      return { text: "Kritik", color: "#dc2626" };
    if (summary.soonCount > 0) return { text: "Yaklaşıyor", color: "#d97706" };
    return { text: "Uygun", color: "#16a34a" };
  }

  function getEmployeeStatus(employee: Employee) {
    const cl = checklistCompletion(employee.checklist);
    return {
      trainingMissing: !employee.trainingComplete,
      missingChecklist: cl.missing,
      checklistText: `${cl.completed}/${cl.total}`,
    };
  }

  function updateSelectedEmployee(updater: (emp: Employee) => Employee) {
    if (!selectedEmployee) return;
    setEmployees((prev) =>
      prev.map((emp) => (emp.id === selectedEmployee.id ? updater(emp) : emp))
    );
  }

  function handleImageToBase64(
    event: ChangeEvent<HTMLInputElement>,
    callback: (base64: string) => void
  ) {
    const file = event.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => callback(String(reader.result || ""));
    reader.readAsDataURL(file);
  }

  function printEmployeeCertificate(employee: Employee, company: Company | null) {
    if (!company || !employee.checklist.isgCertificateDate) return;
    const signatures =
      company.serviceType === "İş Güvenliği + İşyeri Hekimliği"
        ? ["İşveren / İşveren Vekili", "İş Güvenliği Uzmanı", "İşyeri Hekimi"]
        : ["İşveren / İşveren Vekili", "İş Güvenliği Uzmanı"];

    const html = `<html><head><title>İSG Sertifikası</title><style>body{font-family:Arial,sans-serif;padding:40px}.box{border:2px solid #000;padding:30px}h1{text-align:center;margin-bottom:30px}.line{margin-bottom:12px;font-size:18px}.signatures{margin-top:60px;display:flex;justify-content:space-between;gap:20px}.sig{width:30%;text-align:center}.topline{border-top:1px solid #000;padding-top:10px;margin-top:50px}</style></head><body><div class="box"><h1>İSG EĞİTİM SERTİFİKASI</h1><div class="line"><strong>Personel:</strong> ${employee.firstName} ${employee.lastName}</div><div class="line"><strong>T.C. Kimlik No:</strong> ${employee.tcNo}</div><div class="line"><strong>Unvan:</strong> ${employee.title}</div><div class="line"><strong>Firma:</strong> ${company.officialName}</div><div class="line"><strong>Hizmet Türü:</strong> ${company.serviceType}</div><div class="line"><strong>Eğitim / Sertifika Tarihi:</strong> ${employee.checklist.isgCertificateDate}</div><div class="signatures">${signatures.map((s) => `<div class="sig"><div class="topline">${s}</div></div>`).join("")}</div></div></body></html>`;

    const win = window.open("", "_blank", "width=900,height=700");
    if (!win) return;
    win.document.open();
    win.document.write(html);
    win.document.close();
    win.focus();
    win.print();
  }

  // ── Filtered lists ────────────────────────────────────────────────────────

  const filteredCompanies = useMemo(
    () =>
      companies.filter((c) => {
        const text =
          `${c.nickName} ${c.officialName} ${c.sgkSicil} ${c.naceCode} ${c.dangerClass}`.toLowerCase();
        return text.includes(search.toLowerCase());
      }),
    [companies, search]
  );

  const filteredEmployees = useMemo(
    () =>
      employees.filter((e) => {
        const company = companies.find((c) => c.id === e.companyId);
        const matchesCompany =
          selectedCompanyId === "all" || e.companyId === selectedCompanyId;
        const text =
          `${e.firstName} ${e.lastName} ${e.tcNo} ${e.title} ${company?.nickName || ""}`.toLowerCase();
        return matchesCompany && text.includes(search.toLowerCase());
      }),
    [employees, companies, selectedCompanyId, search]
  );

  const filteredDocuments = useMemo(
    () =>
      documents.filter((d) => {
        const company = companies.find((c) => c.id === d.companyId);
        const employee = employees.find((e) => e.id === d.employeeId);
        const matchesCompany =
          selectedCompanyId === "all" || d.companyId === selectedCompanyId;
        const text =
          `${d.type} ${company?.nickName || ""} ${employee?.firstName || ""} ${employee?.lastName || ""}`.toLowerCase();
        return matchesCompany && text.includes(search.toLowerCase());
      }),
    [documents, companies, employees, selectedCompanyId, search]
  );

  const filteredDofs = useMemo(
    () =>
      dofs.filter((d) => {
        const company = companies.find((c) => c.id === d.companyId);
        const observer = observers.find((o) => o.id === d.observerId);
        const matchesCompany =
          selectedCompanyId === "all" || d.companyId === selectedCompanyId;
        const text =
          `${d.title} ${d.description} ${d.location} ${company?.nickName || ""} ${observer?.fullName || ""}`.toLowerCase();
        return matchesCompany && text.includes(search.toLowerCase());
      }),
    [dofs, companies, observers, selectedCompanyId, search]
  );

  // ── THE FIX: filteredRisks was cut off in the original ───────────────────
  const filteredRisks = useMemo(
    () =>
      risks.filter((r) => {
        const company = companies.find((c) => c.id === r.companyId);
        const matchesCompany =
          selectedCompanyId === "all" || r.companyId === selectedCompanyId;
        const text =
          `${r.section} ${r.hazard} ${r.risk} ${r.actionToTake} ${company?.nickName || ""}`.toLowerCase();
        return matchesCompany && text.includes(search.toLowerCase());
      }),
    [risks, companies, selectedCompanyId, search]
  );

  // ── CRUD helpers ──────────────────────────────────────────────────────────

  function addCompany() {
    if (!newCompany.nickName || !newCompany.sgkSicil) return;
    const naceCode =
      newCompany.naceCode || extractNaceFromSgk(newCompany.sgkSicil);
    const officialName =
      newCompany.officialName || officialNameFromSgk(newCompany.sgkSicil) || newCompany.nickName;
    const company: Company = {
      id: `f${Date.now()}`,
      nickName: newCompany.nickName,
      officialName,
      sgkSicil: newCompany.sgkSicil,
      naceCode,
      dangerClass: dangerFromNace(naceCode),
      employeeCount: parseInt(newCompany.employeeCount) || 0,
      contractEnd: newCompany.contractEnd,
      serviceType: newCompany.serviceType,
    };
    setCompanies((prev) => [...prev, company]);
    setNewCompany({
      nickName: "", officialName: "", sgkSicil: "", naceCode: "",
      dangerClass: "Az Tehlikeli", employeeCount: "", contractEnd: "",
      serviceType: "İş Güvenliği",
    });
  }

  function deleteCompany(id: string) {
    if (!confirm("Bu firmayı silmek istediğinizden emin misiniz?")) return;
    setCompanies((prev) => prev.filter((c) => c.id !== id));
    setEmployees((prev) => prev.filter((e) => e.companyId !== id));
    setDocuments((prev) => prev.filter((d) => d.companyId !== id));
    setDofs((prev) => prev.filter((d) => d.companyId !== id));
    setRisks((prev) => prev.filter((r) => r.companyId !== id));
  }

  function addEmployee() {
    if (!newEmployee.firstName || !newEmployee.companyId) return;
    const emp: Employee = {
      id: `p${Date.now()}`,
      companyId: newEmployee.companyId,
      firstName: newEmployee.firstName,
      lastName: newEmployee.lastName,
      tcNo: newEmployee.tcNo,
      title: newEmployee.title,
      hireDate: newEmployee.hireDate,
      isActive: newEmployee.isActive === "true",
      trainingComplete: newEmployee.trainingComplete === "true",
      checklist: { ...emptyChecklist },
    };
    setEmployees((prev) => [...prev, emp]);
    setNewEmployee({
      companyId: "", firstName: "", lastName: "", tcNo: "",
      title: "", hireDate: "", isActive: "true", trainingComplete: "false",
    });
  }

  function deleteEmployee(id: string) {
    if (!confirm("Bu personeli silmek istediğinizden emin misiniz?")) return;
    setEmployees((prev) => prev.filter((e) => e.id !== id));
    setDocuments((prev) => prev.filter((d) => d.employeeId !== id));
    if (selectedEmployeeId === id) setSelectedEmployeeId(null);
  }

  function addDocument() {
    if (!newDocument.companyId || !newDocument.type || !newDocument.issueDate) return;
    const doc: DocumentRecord = {
      id: `d${Date.now()}`,
      companyId: newDocument.companyId,
      employeeId: newDocument.employeeId || null,
      type: newDocument.type,
      issueDate: newDocument.issueDate,
      expiryDate: newDocument.expiryDate,
    };
    setDocuments((prev) => [...prev, doc]);
    setNewDocument({
      companyId: "", employeeId: "", type: "Risk Değerlendirme Raporu",
      issueDate: "", expiryDate: "",
    });
  }

  function deleteDocument(id: string) {
    setDocuments((prev) => prev.filter((d) => d.id !== id));
  }

  function addObserver() {
    if (!newObserver.fullName) return;
    const obs: Observer = {
      id: `o${Date.now()}`,
      fullName: newObserver.fullName,
      title: newObserver.title,
      certificateNo: newObserver.certificateNo,
      phone: newObserver.phone,
    };
    setObservers((prev) => [...prev, obs]);
    setNewObserver({ fullName: "", title: "", certificateNo: "", phone: "" });
  }

  function deleteObserver(id: string) {
    setObservers((prev) => prev.filter((o) => o.id !== id));
  }

  function addDof() {
    if (!newDof.companyId || !newDof.title) return;
    const dof: DofRecord = {
      id: `dof${Date.now()}`,
      companyId: newDof.companyId,
      observerId: newDof.observerId,
      title: newDof.title,
      description: newDof.description,
      lawReference: newDof.lawReference,
      priority: newDof.priority,
      responsible: newDof.responsible,
      dueDate: newDof.dueDate,
      status: newDof.status,
      location: newDof.location,
      beforePhoto: newDof.beforePhoto || undefined,
      afterPhoto: newDof.afterPhoto || undefined,
    };
    setDofs((prev) => [...prev, dof]);
    setNewDof({
      companyId: "", observerId: "", title: "", description: "",
      lawReference: "", priority: "Orta", responsible: "", dueDate: "",
      status: "Açık", location: "", beforePhoto: "", afterPhoto: "",
    });
  }

  function deleteDof(id: string) {
    setDofs((prev) => prev.filter((d) => d.id !== id));
  }

  function addRisk() {
    if (!newRisk.companyId || !newRisk.hazard) return;
    const prob = parseInt(newRisk.probability);
    const sev = parseInt(newRisk.severity);
    const rProb = parseInt(newRisk.residualProbability);
    const rSev = parseInt(newRisk.residualSeverity);
    const risk: RiskRecord = {
      id: `r${Date.now()}`,
      companyId: newRisk.companyId,
      sourceDofId: null,
      section: newRisk.section,
      hazard: newRisk.hazard,
      risk: newRisk.risk,
      currentMeasure: newRisk.currentMeasure,
      actionToTake: newRisk.actionToTake,
      probability: prob,
      severity: sev,
      score: prob * sev,
      residualProbability: rProb,
      residualSeverity: rSev,
      residualScore: rProb * rSev,
      responsible: newRisk.responsible,
      dueDate: newRisk.dueDate,
      status: newRisk.status,
    };
    setRisks((prev) => [...prev, risk]);
    setNewRisk({
      companyId: "", section: "", hazard: "", risk: "", currentMeasure: "",
      actionToTake: "", probability: "1", severity: "1",
      residualProbability: "1", residualSeverity: "1",
      responsible: "", dueDate: "", status: "Açık",
    });
  }

  function deleteRisk(id: string) {
    setRisks((prev) => prev.filter((r) => r.id !== id));
  }

  // ── Tab definitions ───────────────────────────────────────────────────────

  const tabs = [
    { id: "ozet", label: "📊 Özet" },
    { id: "firmalar", label: "🏢 Firmalar" },
    { id: "personel", label: "👤 Personel" },
    { id: "belgeler", label: "📄 Belgeler" },
    { id: "gozlemciler", label: "🔍 Gözlemciler" },
    { id: "dof", label: "⚠️ DÖF" },
    { id: "risk", label: "🛡 Risk" },
  ];

  if (!mounted) {
    return (
      <div style={{ ...styles.app, display: "flex", alignItems: "center", justifyContent: "center" }}>
        <span style={{ color: "#94a3b8" }}>Yükleniyor...</span>
      </div>
    );
  }

  // ── Dashboard / Özet ─────────────────────────────────────────────────────

  const totalExpiredDocs = documents.filter(
    (d) => getDateStatus(d.expiryDate) === "Süresi Dolmuş"
  ).length;
  const totalSoonDocs = documents.filter(
    (d) => getDateStatus(d.expiryDate) === "Yaklaşıyor"
  ).length;
  const openDofs = dofs.filter((d) => d.status !== "Kapandı").length;
  const highRisks = risks.filter((r) => r.score >= 15).length;
  const incompleteEmployees = employees.filter((e) => !e.trainingComplete).length;

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div style={styles.app}>
      {/* Header */}
      <header style={styles.header}>
        <div style={styles.headerLogo}>
          <span style={{ fontSize: 20 }}>🦺</span>
          <span>
            İSG <span style={styles.headerLogoAccent}>Otomasyon</span>
          </span>
        </div>
        <button
          style={{ ...styles.btnDanger, fontSize: 11 }}
          onClick={() => confirm("Tüm veriler sıfırlansın mı?") && resetAllData()}
        >
          Verileri Sıfırla
        </button>
      </header>

      {/* Navigation */}
      <nav style={styles.nav}>
        {tabs.map((tab) => (
          <button
            key={tab.id}
            style={{
              ...styles.navBtn,
              backgroundColor: activeTab === tab.id ? "#0ea5e9" : "transparent",
              color: activeTab === tab.id ? "#fff" : "#94a3b8",
            }}
            onClick={() => { setActiveTab(tab.id); setSearch(""); }}
          >
            {tab.label}
          </button>
        ))}
      </nav>

      <main style={styles.content}>

        {/* ── ÖZET ──────────────────────────────────────────────────────── */}
        {activeTab === "ozet" && (
          <div>
            <p style={{ ...styles.sectionTitle, marginBottom: 20 }}>Genel Durum</p>
            <div style={styles.statGrid}>
              <div style={styles.statCard}>
                <div style={{ ...styles.statValue, color: "#38bdf8" }}>{companies.length}</div>
                <div style={styles.statLabel}>Firma</div>
              </div>
              <div style={styles.statCard}>
                <div style={{ ...styles.statValue, color: "#a78bfa" }}>{employees.length}</div>
                <div style={styles.statLabel}>Personel</div>
              </div>
              <div style={styles.statCard}>
                <div style={{ ...styles.statValue, color: totalExpiredDocs > 0 ? "#dc2626" : "#16a34a" }}>
                  {totalExpiredDocs}
                </div>
                <div style={styles.statLabel}>Süresi Dolmuş Belge</div>
              </div>
              <div style={styles.statCard}>
                <div style={{ ...styles.statValue, color: totalSoonDocs > 0 ? "#d97706" : "#16a34a" }}>
                  {totalSoonDocs}
                </div>
                <div style={styles.statLabel}>Yaklaşan Belge</div>
              </div>
              <div style={styles.statCard}>
                <div style={{ ...styles.statValue, color: openDofs > 0 ? "#d97706" : "#16a34a" }}>
                  {openDofs}
                </div>
                <div style={styles.statLabel}>Açık DÖF</div>
              </div>
              <div style={styles.statCard}>
                <div style={{ ...styles.statValue, color: highRisks > 0 ? "#dc2626" : "#16a34a" }}>
                  {highRisks}
                </div>
                <div style={styles.statLabel}>Yüksek Risk (≥15)</div>
              </div>
              <div style={styles.statCard}>
                <div style={{ ...styles.statValue, color: incompleteEmployees > 0 ? "#d97706" : "#16a34a" }}>
                  {incompleteEmployees}
                </div>
                <div style={styles.statLabel}>Eğitim Eksik Personel</div>
              </div>
            </div>

            <p style={styles.sectionTitle}>Firma Durumları</p>
            <div>
              {companies.map((c) => {
                const ind = getCompanyIndicator(c.id);
                const summary = getCompanyDocSummary(c.id);
                const empCount = employees.filter((e) => e.companyId === c.id).length;
                return (
                  <div key={c.id} style={{ ...styles.card, display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 8 }}>
                    <div>
                      <div style={{ fontWeight: 600, marginBottom: 4 }}>{c.nickName}</div>
                      <div style={{ fontSize: 12, color: "#94a3b8" }}>
                        {empCount} personel · Sözleşme: {c.contractEnd} · <Badge text={c.dangerClass} color={c.dangerClass === "Çok Tehlikeli" ? "#dc2626" : c.dangerClass === "Tehlikeli" ? "#d97706" : "#16a34a"} />
                      </div>
                    </div>
                    <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
                      {summary.missingCount > 0 && <Badge text={`${summary.missingCount} Eksik Belge`} color="#dc2626" />}
                      {summary.expiredCount > 0 && <Badge text={`${summary.expiredCount} Süresi Dolmuş`} color="#dc2626" />}
                      {summary.soonCount > 0 && <Badge text={`${summary.soonCount} Yaklaşıyor`} color="#d97706" />}
                      <Badge text={ind.text} color={ind.color} />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ── FİRMALAR ─────────────────────────────────────────────────── */}
        {activeTab === "firmalar" && (
          <div>
            {/* Add form */}
            <div style={styles.card}>
              <p style={styles.sectionTitle}>Yeni Firma Ekle</p>
              <div style={styles.formGrid}>
                <FormField label="Kısa Ad *">
                  <input style={styles.input} value={newCompany.nickName}
                    onChange={(e) => setNewCompany({ ...newCompany, nickName: e.target.value })} />
                </FormField>
                <FormField label="SGK Sicil No *">
                  <input style={styles.input} value={newCompany.sgkSicil}
                    onChange={(e) => {
                      const sgk = e.target.value;
                      const nace = extractNaceFromSgk(sgk);
                      const official = officialNameFromSgk(sgk);
                      setNewCompany({
                        ...newCompany, sgkSicil: sgk,
                        naceCode: nace, officialName: official || newCompany.officialName,
                        dangerClass: dangerFromNace(nace),
                      });
                    }} />
                </FormField>
                <FormField label="Resmi Unvan">
                  <input style={styles.input} value={newCompany.officialName}
                    onChange={(e) => setNewCompany({ ...newCompany, officialName: e.target.value })} />
                </FormField>
                <FormField label="NACE Kodu">
                  <input style={styles.input} value={newCompany.naceCode}
                    onChange={(e) => setNewCompany({ ...newCompany, naceCode: e.target.value, dangerClass: dangerFromNace(e.target.value) })} />
                </FormField>
                <FormField label="Tehlike Sınıfı">
                  <select style={styles.select} value={newCompany.dangerClass}
                    onChange={(e) => setNewCompany({ ...newCompany, dangerClass: e.target.value as DangerClass })}>
                    <option>Az Tehlikeli</option>
                    <option>Tehlikeli</option>
                    <option>Çok Tehlikeli</option>
                  </select>
                </FormField>
                <FormField label="Çalışan Sayısı">
                  <input style={styles.input} type="number" value={newCompany.employeeCount}
                    onChange={(e) => setNewCompany({ ...newCompany, employeeCount: e.target.value })} />
                </FormField>
                <FormField label="Sözleşme Bitiş">
                  <input style={styles.input} type="date" value={newCompany.contractEnd}
                    onChange={(e) => setNewCompany({ ...newCompany, contractEnd: e.target.value })} />
                </FormField>
                <FormField label="Hizmet Türü">
                  <select style={styles.select} value={newCompany.serviceType}
                    onChange={(e) => setNewCompany({ ...newCompany, serviceType: e.target.value as ServiceType })}>
                    <option>İş Güvenliği</option>
                    <option>İş Güvenliği + İşyeri Hekimliği</option>
                  </select>
                </FormField>
              </div>
              <div style={{ marginTop: 12 }}>
                <button style={styles.btnPrimary} onClick={addCompany}>Firma Ekle</button>
              </div>
            </div>

            {/* Search */}
            <div style={styles.searchBar}>
              <input style={{ ...styles.input, maxWidth: 300 }} placeholder="Ara..." value={search}
                onChange={(e) => setSearch(e.target.value)} />
              <span style={{ color: "#64748b", fontSize: 13 }}>{filteredCompanies.length} firma</span>
            </div>

            {/* Table */}
            <div style={{ ...styles.card, padding: 0, overflow: "auto" }}>
              <table style={styles.table}>
                <thead>
                  <tr>
                    {["Kısa Ad", "Resmi Unvan", "SGK Sicil", "NACE", "Tehlike", "Personel", "Sözleşme", "Hizmet", "Durum", "İşlem"].map((h) => (
                      <th key={h} style={styles.th}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filteredCompanies.map((c) => {
                    const ind = getCompanyIndicator(c.id);
                    const contractStatus = getDateStatus(c.contractEnd);
                    const isEditing = editingCompanyId === c.id;
                    return (
                      <tr key={c.id} style={{ backgroundColor: isEditing ? "#1a2942" : "transparent" }}>
                        <td style={styles.td}>
                          {isEditing ? (
                            <input style={{ ...styles.input, width: 120 }} defaultValue={c.nickName}
                              id={`edit-nick-${c.id}`} />
                          ) : <span style={{ fontWeight: 600 }}>{c.nickName}</span>}
                        </td>
                        <td style={{ ...styles.td, maxWidth: 200, fontSize: 12, color: "#94a3b8" }}>
                          {c.officialName}
                        </td>
                        <td style={{ ...styles.td, fontSize: 11, color: "#64748b" }}>{c.sgkSicil}</td>
                        <td style={styles.td}>{c.naceCode}</td>
                        <td style={styles.td}>
                          <Badge text={c.dangerClass}
                            color={c.dangerClass === "Çok Tehlikeli" ? "#dc2626" : c.dangerClass === "Tehlikeli" ? "#d97706" : "#16a34a"} />
                        </td>
                        <td style={styles.td}>{c.employeeCount}</td>
                        <td style={styles.td}>
                          <span style={{ fontSize: 12 }}>{c.contractEnd}</span>
                          {" "}<Badge text={contractStatus} color={statusColor(contractStatus)} />
                        </td>
                        <td style={{ ...styles.td, fontSize: 12 }}>{c.serviceType}</td>
                        <td style={styles.td}><Badge text={ind.text} color={ind.color} /></td>
                        <td style={styles.td}>
                          <div style={{ display: "flex", gap: 6 }}>
                            <button style={styles.btnSecondary}
                              onClick={() => setEditingCompanyId(isEditing ? null : c.id)}>
                              {isEditing ? "İptal" : "Düzenle"}
                            </button>
                            <button style={styles.btnDanger} onClick={() => deleteCompany(c.id)}>Sil</button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ── PERSONEL ─────────────────────────────────────────────────── */}
        {activeTab === "personel" && (
          <div style={{ display: "grid", gridTemplateColumns: "1fr 340px", gap: 20 }}>
            {/* Left: list */}
            <div>
              <div style={styles.card}>
                <p style={styles.sectionTitle}>Yeni Personel Ekle</p>
                <div style={styles.formGrid}>
                  <FormField label="Firma *">
                    <select style={styles.select} value={newEmployee.companyId}
                      onChange={(e) => setNewEmployee({ ...newEmployee, companyId: e.target.value })}>
                      <option value="">Seçin...</option>
                      {companies.map((c) => <option key={c.id} value={c.id}>{c.nickName}</option>)}
                    </select>
                  </FormField>
                  <FormField label="Ad *">
                    <input style={styles.input} value={newEmployee.firstName}
                      onChange={(e) => setNewEmployee({ ...newEmployee, firstName: e.target.value })} />
                  </FormField>
                  <FormField label="Soyad">
                    <input style={styles.input} value={newEmployee.lastName}
                      onChange={(e) => setNewEmployee({ ...newEmployee, lastName: e.target.value })} />
                  </FormField>
                  <FormField label="TC No">
                    <input style={styles.input} value={newEmployee.tcNo}
                      onChange={(e) => setNewEmployee({ ...newEmployee, tcNo: e.target.value })} />
                  </FormField>
                  <FormField label="Unvan">
                    <input style={styles.input} value={newEmployee.title}
                      onChange={(e) => setNewEmployee({ ...newEmployee, title: e.target.value })} />
                  </FormField>
                  <FormField label="İşe Giriş">
                    <input style={styles.input} type="date" value={newEmployee.hireDate}
                      onChange={(e) => setNewEmployee({ ...newEmployee, hireDate: e.target.value })} />
                  </FormField>
                </div>
                <div style={{ marginTop: 12 }}>
                  <button style={styles.btnPrimary} onClick={addEmployee}>Personel Ekle</button>
                </div>
              </div>

              <div style={styles.searchBar}>
                <input style={{ ...styles.input, maxWidth: 240 }} placeholder="Ara..." value={search}
                  onChange={(e) => setSearch(e.target.value)} />
                <select style={{ ...styles.select, maxWidth: 180 }} value={selectedCompanyId}
                  onChange={(e) => setSelectedCompanyId(e.target.value)}>
                  <option value="all">Tüm Firmalar</option>
                  {companies.map((c) => <option key={c.id} value={c.id}>{c.nickName}</option>)}
                </select>
                <span style={{ color: "#64748b", fontSize: 13 }}>{filteredEmployees.length} kişi</span>
              </div>

              <div style={{ ...styles.card, padding: 0, overflow: "auto" }}>
                <table style={styles.table}>
                  <thead>
                    <tr>
                      {["Ad Soyad", "TC No", "Unvan", "Firma", "İşe Giriş", "Eğitim", "Kontrol Listesi", "İşlem"].map((h) => (
                        <th key={h} style={styles.th}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {filteredEmployees.map((emp) => {
                      const company = companies.find((c) => c.id === emp.companyId);
                      const status = getEmployeeStatus(emp);
                      const cl = checklistCompletion(emp.checklist);
                      return (
                        <tr key={emp.id}
                          style={{ cursor: "pointer", backgroundColor: selectedEmployeeId === emp.id ? "#1a2942" : "transparent" }}
                          onClick={() => setSelectedEmployeeId(emp.id)}>
                          <td style={styles.td}>
                            <span style={{ fontWeight: 600 }}>{emp.firstName} {emp.lastName}</span>
                            {!emp.isActive && <Badge text="Pasif" color="#64748b" />}
                          </td>
                          <td style={{ ...styles.td, fontSize: 12, color: "#94a3b8" }}>{emp.tcNo}</td>
                          <td style={styles.td}>{emp.title}</td>
                          <td style={{ ...styles.td, fontSize: 12 }}>{company?.nickName}</td>
                          <td style={{ ...styles.td, fontSize: 12 }}>{emp.hireDate}</td>
                          <td style={styles.td}>
                            <Badge text={emp.trainingComplete ? "Tamamlandı" : "Eksik"}
                              color={emp.trainingComplete ? "#16a34a" : "#d97706"} />
                          </td>
                          <td style={styles.td}>
                            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                              <div style={{ height: 6, width: 80, backgroundColor: "#0f172a", borderRadius: 3, overflow: "hidden" }}>
                                <div style={{
                                  height: "100%",
                                  width: `${(cl.completed / cl.total) * 100}%`,
                                  backgroundColor: cl.missing === 0 ? "#16a34a" : "#d97706",
                                }} />
                              </div>
                              <span style={{ fontSize: 11, color: "#94a3b8" }}>{cl.completed}/{cl.total}</span>
                            </div>
                          </td>
                          <td style={styles.td}>
                            <button style={styles.btnDanger}
                              onClick={(e) => { e.stopPropagation(); deleteEmployee(emp.id); }}>
                              Sil
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Right: detail panel */}
            {selectedEmployee && (
              <div>
                <div style={styles.card}>
                  <p style={styles.sectionTitle}>Personel Detayı</p>
                  <div style={{ marginBottom: 12 }}>
                    <div style={{ fontWeight: 700, fontSize: 16, marginBottom: 2 }}>
                      {selectedEmployee.firstName} {selectedEmployee.lastName}
                    </div>
                    <div style={{ fontSize: 12, color: "#94a3b8" }}>{selectedEmployee.title}</div>
                    <div style={{ fontSize: 12, color: "#64748b", marginTop: 2 }}>
                      {selectedEmployeeCompany?.nickName}
                    </div>
                  </div>

                  <p style={{ ...styles.sectionTitle, marginTop: 16 }}>Kontrol Listesi</p>

                  {/* Date fields */}
                  {[
                    { key: "isgCertificateDate", label: "İSG Sertifikası Tarihi" },
                    { key: "ek2Date", label: "EK-2 Tarihi" },
                    { key: "orientationDate", label: "Oryantasyon Tarihi" },
                  ].map(({ key, label }) => (
                    <FormField key={key} label={label}>
                      <input style={{ ...styles.input, marginBottom: 8 }} type="date"
                        value={(selectedEmployee.checklist as any)[key]}
                        onChange={(e) =>
                          updateSelectedEmployee((emp) => ({
                            ...emp,
                            checklist: { ...emp.checklist, [key]: e.target.value },
                          }))
                        } />
                    </FormField>
                  ))}

                  {/* Checkbox fields */}
                  {[
                    { key: "preTest", label: "Ön Test" },
                    { key: "postTest", label: "Son Test" },
                    { key: "undertaking", label: "Taahhütname" },
                    { key: "kkdMinutes", label: "KKD Tutanağı" },
                    { key: "attendanceDoc", label: "Katılım Belgesi" },
                  ].map(({ key, label }) => (
                    <label key={key} style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8, cursor: "pointer", fontSize: 13 }}>
                      <input type="checkbox"
                        checked={(selectedEmployee.checklist as any)[key]}
                        onChange={(e) =>
                          updateSelectedEmployee((emp) => ({
                            ...emp,
                            checklist: { ...emp.checklist, [key]: e.target.checked },
                          }))
                        } />
                      {label}
                    </label>
                  ))}

                  {/* Training complete toggle */}
                  <label style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 8, cursor: "pointer", fontSize: 13 }}>
                    <input type="checkbox"
                      checked={selectedEmployee.trainingComplete}
                      onChange={(e) =>
                        updateSelectedEmployee((emp) => ({
                          ...emp,
                          trainingComplete: e.target.checked,
                        }))
                      } />
                    Eğitim Tamamlandı
                  </label>

                  {/* Print certificate */}
                  {selectedEmployee.checklist.isgCertificateDate && (
                    <button
                      style={{ ...styles.btnPrimary, marginTop: 16, width: "100%" }}
                      onClick={() => printEmployeeCertificate(selectedEmployee, selectedEmployeeCompany)}
                    >
                      🖨 Sertifikayı Yazdır
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        {/* ── BELGELER ─────────────────────────────────────────────────── */}
        {activeTab === "belgeler" && (
          <div>
            <div style={styles.card}>
              <p style={styles.sectionTitle}>Yeni Belge Ekle</p>
              <div style={styles.formGrid}>
                <FormField label="Firma *">
                  <select style={styles.select} value={newDocument.companyId}
                    onChange={(e) => setNewDocument({ ...newDocument, companyId: e.target.value })}>
                    <option value="">Seçin...</option>
                    {companies.map((c) => <option key={c.id} value={c.id}>{c.nickName}</option>)}
                  </select>
                </FormField>
                <FormField label="Belge Türü *">
                  <select style={styles.select} value={newDocument.type}
                    onChange={(e) => setNewDocument({ ...newDocument, type: e.target.value })}>
                    {documentTemplates.map((t) => <option key={t}>{t}</option>)}
                  </select>
                </FormField>
                <FormField label="Personel (opsiyonel)">
                  <select style={styles.select} value={newDocument.employeeId}
                    onChange={(e) => setNewDocument({ ...newDocument, employeeId: e.target.value })}>
                    <option value="">Firma Belgesi</option>
                    {employees
                      .filter((e) => !newDocument.companyId || e.companyId === newDocument.companyId)
                      .map((e) => (
                        <option key={e.id} value={e.id}>{e.firstName} {e.lastName}</option>
                      ))}
                  </select>
                </FormField>
                <FormField label="Düzenleme Tarihi *">
                  <input style={styles.input} type="date" value={newDocument.issueDate}
                    onChange={(e) => setNewDocument({ ...newDocument, issueDate: e.target.value })} />
                </FormField>
                <FormField label="Geçerlilik Tarihi">
                  <input style={styles.input} type="date" value={newDocument.expiryDate}
                    onChange={(e) => setNewDocument({ ...newDocument, expiryDate: e.target.value })} />
                </FormField>
              </div>
              <div style={{ marginTop: 12 }}>
                <button style={styles.btnPrimary} onClick={addDocument}>Belge Ekle</button>
              </div>
            </div>

            <div style={styles.searchBar}>
              <input style={{ ...styles.input, maxWidth: 240 }} placeholder="Ara..." value={search}
                onChange={(e) => setSearch(e.target.value)} />
              <select style={{ ...styles.select, maxWidth: 180 }} value={selectedCompanyId}
                onChange={(e) => setSelectedCompanyId(e.target.value)}>
                <option value="all">Tüm Firmalar</option>
                {companies.map((c) => <option key={c.id} value={c.id}>{c.nickName}</option>)}
              </select>
              <span style={{ color: "#64748b", fontSize: 13 }}>{filteredDocuments.length} belge</span>
            </div>

            <div style={{ ...styles.card, padding: 0, overflow: "auto" }}>
              <table style={styles.table}>
                <thead>
                  <tr>
                    {["Belge Türü", "Firma", "Personel", "Düzenleme", "Geçerlilik", "Durum", "İşlem"].map((h) => (
                      <th key={h} style={styles.th}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filteredDocuments.map((doc) => {
                    const company = companies.find((c) => c.id === doc.companyId);
                    const emp = employees.find((e) => e.id === doc.employeeId);
                    const ds = doc.expiryDate ? getDateStatus(doc.expiryDate) : "—";
                    const days = doc.expiryDate ? daysUntil(doc.expiryDate) : null;
                    return (
                      <tr key={doc.id}>
                        <td style={{ ...styles.td, fontWeight: 500 }}>{doc.type}</td>
                        <td style={styles.td}>{company?.nickName}</td>
                        <td style={{ ...styles.td, fontSize: 12, color: "#94a3b8" }}>
                          {emp ? `${emp.firstName} ${emp.lastName}` : "—"}
                        </td>
                        <td style={{ ...styles.td, fontSize: 12 }}>{doc.issueDate}</td>
                        <td style={{ ...styles.td, fontSize: 12 }}>{doc.expiryDate || "—"}</td>
                        <td style={styles.td}>
                          {doc.expiryDate ? (
                            <div>
                              <Badge text={ds} color={statusColor(ds)} />
                              {days !== null && days >= 0 && (
                                <div style={{ fontSize: 11, color: "#64748b", marginTop: 2 }}>{days} gün</div>
                              )}
                            </div>
                          ) : "—"}
                        </td>
                        <td style={styles.td}>
                          <button style={styles.btnDanger} onClick={() => deleteDocument(doc.id)}>Sil</button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ── GÖZLEMCİLER ──────────────────────────────────────────────── */}
        {activeTab === "gozlemciler" && (
          <div>
            <div style={styles.card}>
              <p style={styles.sectionTitle}>Yeni Gözlemci Ekle</p>
              <div style={styles.formGrid}>
                <FormField label="Ad Soyad *">
                  <input style={styles.input} value={newObserver.fullName}
                    onChange={(e) => setNewObserver({ ...newObserver, fullName: e.target.value })} />
                </FormField>
                <FormField label="Unvan">
                  <input style={styles.input} value={newObserver.title}
                    onChange={(e) => setNewObserver({ ...newObserver, title: e.target.value })} />
                </FormField>
                <FormField label="Sertifika No">
                  <input style={styles.input} value={newObserver.certificateNo}
                    onChange={(e) => setNewObserver({ ...newObserver, certificateNo: e.target.value })} />
                </FormField>
                <FormField label="Telefon">
                  <input style={styles.input} value={newObserver.phone}
                    onChange={(e) => setNewObserver({ ...newObserver, phone: e.target.value })} />
                </FormField>
              </div>
              <div style={{ marginTop: 12 }}>
                <button style={styles.btnPrimary} onClick={addObserver}>Gözlemci Ekle</button>
              </div>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 12 }}>
              {observers.map((obs) => (
                <div key={obs.id} style={styles.card}>
                  <div style={{ fontWeight: 700, marginBottom: 4 }}>{obs.fullName}</div>
                  <div style={{ fontSize: 12, color: "#94a3b8", marginBottom: 2 }}>{obs.title}</div>
                  <div style={{ fontSize: 12, color: "#64748b" }}>Sertifika: {obs.certificateNo}</div>
                  <div style={{ fontSize: 12, color: "#64748b" }}>Tel: {obs.phone}</div>
                  <div style={{ marginTop: 12, display: "flex", gap: 8 }}>
                    <button style={styles.btnDanger} onClick={() => deleteObserver(obs.id)}>Sil</button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── DÖF ──────────────────────────────────────────────────────── */}
        {activeTab === "dof" && (
          <div>
            <div style={styles.card}>
              <p style={styles.sectionTitle}>Yeni DÖF Kaydı</p>
              <div style={styles.formGrid}>
                <FormField label="Firma *">
                  <select style={styles.select} value={newDof.companyId}
                    onChange={(e) => setNewDof({ ...newDof, companyId: e.target.value })}>
                    <option value="">Seçin...</option>
                    {companies.map((c) => <option key={c.id} value={c.id}>{c.nickName}</option>)}
                  </select>
                </FormField>
                <FormField label="Gözlemci">
                  <select style={styles.select} value={newDof.observerId}
                    onChange={(e) => setNewDof({ ...newDof, observerId: e.target.value })}>
                    <option value="">Seçin...</option>
                    {observers.map((o) => <option key={o.id} value={o.id}>{o.fullName}</option>)}
                  </select>
                </FormField>
                <FormField label="Başlık *">
                  <input style={styles.input} value={newDof.title}
                    onChange={(e) => setNewDof({ ...newDof, title: e.target.value })} />
                </FormField>
                <FormField label="Konum">
                  <input style={styles.input} value={newDof.location}
                    onChange={(e) => setNewDof({ ...newDof, location: e.target.value })} />
                </FormField>
                <FormField label="Öncelik">
                  <select style={styles.select} value={newDof.priority}
                    onChange={(e) => setNewDof({ ...newDof, priority: e.target.value as any })}>
                    <option>Düşük</option>
                    <option>Orta</option>
                    <option>Yüksek</option>
                  </select>
                </FormField>
                <FormField label="Sorumlu">
                  <input style={styles.input} value={newDof.responsible}
                    onChange={(e) => setNewDof({ ...newDof, responsible: e.target.value })} />
                </FormField>
                <FormField label="Termin">
                  <input style={styles.input} type="date" value={newDof.dueDate}
                    onChange={(e) => setNewDof({ ...newDof, dueDate: e.target.value })} />
                </FormField>
                <FormField label="Durum">
                  <select style={styles.select} value={newDof.status}
                    onChange={(e) => setNewDof({ ...newDof, status: e.target.value as any })}>
                    <option>Açık</option>
                    <option>Devam Ediyor</option>
                    <option>Kapandı</option>
                  </select>
                </FormField>
              </div>
              <div style={{ marginTop: 10 }}>
                <label style={styles.label}>Açıklama</label>
                <textarea
                  style={{ ...styles.input, height: 60, resize: "vertical" as const }}
                  value={newDof.description}
                  onChange={(e) => setNewDof({ ...newDof, description: e.target.value })}
                />
              </div>
              <div style={{ marginTop: 10 }}>
                <label style={styles.label}>Yasal Dayanak</label>
                <input style={styles.input} value={newDof.lawReference}
                  onChange={(e) => setNewDof({ ...newDof, lawReference: e.target.value })} />
              </div>
              <div style={{ marginTop: 10, display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                <div>
                  <label style={styles.label}>Öncesi Fotoğraf</label>
                  <input type="file" accept="image/*" style={{ fontSize: 12, color: "#94a3b8" }}
                    onChange={(e) => handleImageToBase64(e, (b64) => setNewDof({ ...newDof, beforePhoto: b64 }))} />
                </div>
                <div>
                  <label style={styles.label}>Sonrası Fotoğraf</label>
                  <input type="file" accept="image/*" style={{ fontSize: 12, color: "#94a3b8" }}
                    onChange={(e) => handleImageToBase64(e, (b64) => setNewDof({ ...newDof, afterPhoto: b64 }))} />
                </div>
              </div>
              <div style={{ marginTop: 12 }}>
                <button style={styles.btnPrimary} onClick={addDof}>DÖF Ekle</button>
              </div>
            </div>

            <div style={styles.searchBar}>
              <input style={{ ...styles.input, maxWidth: 240 }} placeholder="Ara..." value={search}
                onChange={(e) => setSearch(e.target.value)} />
              <select style={{ ...styles.select, maxWidth: 180 }} value={selectedCompanyId}
                onChange={(e) => setSelectedCompanyId(e.target.value)}>
                <option value="all">Tüm Firmalar</option>
                {companies.map((c) => <option key={c.id} value={c.id}>{c.nickName}</option>)}
              </select>
              <span style={{ color: "#64748b", fontSize: 13 }}>{filteredDofs.length} kayıt</span>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))", gap: 12 }}>
              {filteredDofs.map((dof) => {
                const company = companies.find((c) => c.id === dof.companyId);
                const observer = observers.find((o) => o.id === dof.observerId);
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

                    {/* Photos */}
                    {(dof.beforePhoto || dof.afterPhoto) && (
                      <div style={{ display: "flex", gap: 8, marginBottom: 8 }}>
                        {dof.beforePhoto && (
                          <div>
                            <div style={{ fontSize: 10, color: "#64748b", marginBottom: 2 }}>Önce</div>
                            <img src={dof.beforePhoto} alt="önce"
                              style={{ width: 80, height: 60, objectFit: "cover", borderRadius: 4 }} />
                          </div>
                        )}
                        {dof.afterPhoto && (
                          <div>
                            <div style={{ fontSize: 10, color: "#64748b", marginBottom: 2 }}>Sonra</div>
                            <img src={dof.afterPhoto} alt="sonra"
                              style={{ width: 80, height: 60, objectFit: "cover", borderRadius: 4 }} />
                          </div>
                        )}
                      </div>
                    )}

                    {/* Status edit */}
                    {isEditing && (
                      <div style={{ marginBottom: 8 }}>
                        <select style={{ ...styles.select }}
                          defaultValue={dof.status}
                          onChange={(e) => {
                            setDofs((prev) =>
                              prev.map((d) => d.id === dof.id ? { ...d, status: e.target.value as any } : d)
                            );
                          }}>
                          <option>Açık</option>
                          <option>Devam Ediyor</option>
                          <option>Kapandı</option>
                        </select>
                      </div>
                    )}

                    <div style={{ display: "flex", gap: 6 }}>
                      <button style={styles.btnSecondary}
                        onClick={() => setEditingDofId(isEditing ? null : dof.id)}>
                        {isEditing ? "Kapat" : "Düzenle"}
                      </button>
                      <button style={styles.btnDanger} onClick={() => deleteDof(dof.id)}>Sil</button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ── RİSK ─────────────────────────────────────────────────────── */}
        {activeTab === "risk" && (
          <div>
            <div style={styles.card}>
              <p style={styles.sectionTitle}>Yeni Risk Kaydı</p>
              <div style={styles.formGrid}>
                <FormField label="Firma *">
                  <select style={styles.select} value={newRisk.companyId}
                    onChange={(e) => setNewRisk({ ...newRisk, companyId: e.target.value })}>
                    <option value="">Seçin...</option>
                    {companies.map((c) => <option key={c.id} value={c.id}>{c.nickName}</option>)}
                  </select>
                </FormField>
                <FormField label="Bölüm">
                  <input style={styles.input} value={newRisk.section}
                    onChange={(e) => setNewRisk({ ...newRisk, section: e.target.value })} />
                </FormField>
                <FormField label="Tehlike *">
                  <input style={styles.input} value={newRisk.hazard}
                    onChange={(e) => setNewRisk({ ...newRisk, hazard: e.target.value })} />
                </FormField>
                <FormField label="Risk">
                  <input style={styles.input} value={newRisk.risk}
                    onChange={(e) => setNewRisk({ ...newRisk, risk: e.target.value })} />
                </FormField>
                <FormField label="Mevcut Önlem">
                  <input style={styles.input} value={newRisk.currentMeasure}
                    onChange={(e) => setNewRisk({ ...newRisk, currentMeasure: e.target.value })} />
                </FormField>
                <FormField label="Alınacak Önlem">
                  <input style={styles.input} value={newRisk.actionToTake}
                    onChange={(e) => setNewRisk({ ...newRisk, actionToTake: e.target.value })} />
                </FormField>
                <FormField label="Olasılık (1-5)">
                  <input style={styles.input} type="number" min={1} max={5} value={newRisk.probability}
                    onChange={(e) => setNewRisk({ ...newRisk, probability: e.target.value })} />
                </FormField>
                <FormField label="Şiddet (1-5)">
                  <input style={styles.input} type="number" min={1} max={5} value={newRisk.severity}
                    onChange={(e) => setNewRisk({ ...newRisk, severity: e.target.value })} />
                </FormField>
                <FormField label="Kalıntı Olasılık">
                  <input style={styles.input} type="number" min={1} max={5} value={newRisk.residualProbability}
                    onChange={(e) => setNewRisk({ ...newRisk, residualProbability: e.target.value })} />
                </FormField>
                <FormField label="Kalıntı Şiddet">
                  <input style={styles.input} type="number" min={1} max={5} value={newRisk.residualSeverity}
                    onChange={(e) => setNewRisk({ ...newRisk, residualSeverity: e.target.value })} />
                </FormField>
                <FormField label="Sorumlu">
                  <input style={styles.input} value={newRisk.responsible}
                    onChange={(e) => setNewRisk({ ...newRisk, responsible: e.target.value })} />
                </FormField>
                <FormField label="Termin">
                  <input style={styles.input} type="date" value={newRisk.dueDate}
                    onChange={(e) => setNewRisk({ ...newRisk, dueDate: e.target.value })} />
                </FormField>
                <FormField label="Durum">
                  <select style={styles.select} value={newRisk.status}
                    onChange={(e) => setNewRisk({ ...newRisk, status: e.target.value as any })}>
                    <option>Açık</option>
                    <option>Kontrol Altında</option>
                    <option>Kapandı</option>
                  </select>
                </FormField>
              </div>
              <div style={{ marginTop: 8, fontSize: 13, color: "#94a3b8" }}>
                Risk Skoru = {parseInt(newRisk.probability) * parseInt(newRisk.severity)} · Kalıntı = {parseInt(newRisk.residualProbability) * parseInt(newRisk.residualSeverity)}
              </div>
              <div style={{ marginTop: 12 }}>
                <button style={styles.btnPrimary} onClick={addRisk}>Risk Ekle</button>
              </div>
            </div>

            <div style={styles.searchBar}>
              <input style={{ ...styles.input, maxWidth: 240 }} placeholder="Ara..." value={search}
                onChange={(e) => setSearch(e.target.value)} />
              <select style={{ ...styles.select, maxWidth: 180 }} value={selectedCompanyId}
                onChange={(e) => setSelectedCompanyId(e.target.value)}>
                <option value="all">Tüm Firmalar</option>
                {companies.map((c) => <option key={c.id} value={c.id}>{c.nickName}</option>)}
              </select>
              <span style={{ color: "#64748b", fontSize: 13 }}>{filteredRisks.length} kayıt</span>
            </div>

            <div style={{ ...styles.card, padding: 0, overflow: "auto" }}>
              <table style={styles.table}>
                <thead>
                  <tr>
                    {["Firma", "Bölüm", "Tehlike", "Risk", "Mevcut Önlem", "Alınacak Önlem", "Skor", "Kalıntı", "Sorumlu", "Termin", "Durum", "İşlem"].map((h) => (
                      <th key={h} style={styles.th}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filteredRisks.map((r) => {
                    const company = companies.find((c) => c.id === r.companyId);
                    return (
                      <tr key={r.id}>
                        <td style={{ ...styles.td, fontSize: 12 }}>{company?.nickName}</td>
                        <td style={styles.td}>{r.section}</td>
                        <td style={{ ...styles.td, fontWeight: 500 }}>{r.hazard}</td>
                        <td style={{ ...styles.td, fontSize: 12, color: "#94a3b8" }}>{r.risk}</td>
                        <td style={{ ...styles.td, fontSize: 11, color: "#64748b" }}>{r.currentMeasure}</td>
                        <td style={{ ...styles.td, fontSize: 11, color: "#64748b" }}>{r.actionToTake}</td>
                        <td style={styles.td}>
                          <span style={{
                            fontWeight: 700,
                            color: riskScoreColor(r.score),
                            fontSize: 15,
                          }}>{r.score}</span>
                          <div style={{ fontSize: 10, color: "#64748b" }}>{r.probability}×{r.severity}</div>
                        </td>
                        <td style={styles.td}>
                          <span style={{
                            fontWeight: 700,
                            color: riskScoreColor(r.residualScore),
                            fontSize: 15,
                          }}>{r.residualScore}</span>
                          <div style={{ fontSize: 10, color: "#64748b" }}>{r.residualProbability}×{r.residualSeverity}</div>
                        </td>
                        <td style={{ ...styles.td, fontSize: 12 }}>{r.responsible}</td>
                        <td style={{ ...styles.td, fontSize: 12 }}>{r.dueDate}</td>
                        <td style={styles.td}>
                          <Badge text={r.status}
                            color={r.status === "Kapandı" ? "#16a34a" : r.status === "Kontrol Altında" ? "#d97706" : "#dc2626"} />
                        </td>
                        <td style={styles.td}>
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

      </main>
    </div>
  );
}
