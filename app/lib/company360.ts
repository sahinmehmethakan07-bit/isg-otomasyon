import { getDateStatus, statusColor } from "./dashboardUtils";
import type {
  AccidentReportRecord,
  Company,
  CompanyVisitRecord,
  DocumentRecord,
  DofRecord,
  Employee,
  RiskRecord,
} from "./types";

export type Company360Metric = {
  label: string;
  value: number | string;
  color: string;
  tab: string;
};

export type Company360Issue = {
  label: string;
  detail: string;
  color: string;
  tab: string;
};

export type Company360Summary = {
  contractStatus: string;
  contractColor: string;
  activeEmployees: number;
  employeeTotal: number;
  expiredDocuments: number;
  soonDocuments: number;
  openDofs: number;
  criticalRisks: number;
  openAccidents: number;
  followUpVisits: number;
  metrics: Company360Metric[];
  issues: Company360Issue[];
};

type Company360Input = {
  company: Company;
  employees: Employee[];
  documents: DocumentRecord[];
  dofs: DofRecord[];
  risks: RiskRecord[];
  accidentReports: AccidentReportRecord[];
  companyVisits: CompanyVisitRecord[];
};

export function buildCompany360Summary(input: Company360Input): Company360Summary {
  const { company } = input;
  const companyEmployees = input.employees.filter(employee => employee.companyId === company.id);
  const companyDocuments = input.documents.filter(document => document.companyId === company.id);
  const companyDofs = input.dofs.filter(dof => dof.companyId === company.id);
  const companyRisks = input.risks.filter(risk => risk.companyId === company.id);
  const companyAccidents = input.accidentReports.filter(report => report.companyId === company.id);
  const companyVisits = input.companyVisits.filter(visit => visit.companyId === company.id);

  const contractStatus = company.contractEnd ? getDateStatus(company.contractEnd) : "Tarihsiz";
  const contractColor = contractStatus === "Tarihsiz" ? "#6B7280" : statusColor(contractStatus);
  const activeEmployees = companyEmployees.filter(employee => employee.isActive).length;
  const expiredDocuments = companyDocuments.filter(document => document.expiryDate && getDateStatus(document.expiryDate) === "Süresi Dolmuş").length;
  const soonDocuments = companyDocuments.filter(document => document.expiryDate && getDateStatus(document.expiryDate) === "Yaklaşıyor").length;
  const openDofs = companyDofs.filter(dof => dof.status !== "Çözüldü" && dof.status !== "Riske Aktarıldı").length;
  const criticalRisks = companyRisks.filter(risk => risk.status !== "Kapandı" && risk.score >= 15).length;
  const openAccidents = companyAccidents.filter(report => report.status !== "Kapandı").length;
  const followUpVisits = companyVisits.filter(visit => visit.status === "Takip Gerekli" || visit.status === "Planlandı").length;

  const issues: Company360Issue[] = [
    ...(contractStatus === "Süresi Dolmuş" || contractStatus === "Yaklaşıyor"
      ? [{ label: "Sözleşme", detail: `Sözleşme durumu: ${contractStatus}`, color: contractColor, tab: "firmalar" }]
      : []),
    ...(expiredDocuments > 0
      ? [{ label: "Belge", detail: `${expiredDocuments} belgenin süresi dolmuş`, color: "#C0392B", tab: "belgeler" }]
      : []),
    ...(soonDocuments > 0
      ? [{ label: "Belge", detail: `${soonDocuments} belge yenilemeye yaklaşıyor`, color: "#D4A017", tab: "belgeler" }]
      : []),
    ...(openDofs > 0
      ? [{ label: "DÖF", detail: `${openDofs} açık/takipte DÖF var`, color: "#C0392B", tab: "dof" }]
      : []),
    ...(criticalRisks > 0
      ? [{ label: "Risk", detail: `${criticalRisks} yüksek skorlu açık risk var`, color: "#C0392B", tab: "risk" }]
      : []),
    ...(openAccidents > 0
      ? [{ label: "Olay", detail: `${openAccidents} açık iş kazası/ramak kala takibi var`, color: "#7c3aed", tab: "is-kazasi-raporu" }]
      : []),
    ...(followUpVisits > 0
      ? [{ label: "Ziyaret", detail: `${followUpVisits} ziyaret veya takip bekliyor`, color: "#0ea5e9", tab: "firma-ziyaretleri" }]
      : []),
  ];

  return {
    contractStatus,
    contractColor,
    activeEmployees,
    employeeTotal: companyEmployees.length,
    expiredDocuments,
    soonDocuments,
    openDofs,
    criticalRisks,
    openAccidents,
    followUpVisits,
    metrics: [
      { label: "Aktif Personel", value: activeEmployees, color: "#52d3b5", tab: "personel" },
      { label: "Belge Uyarısı", value: expiredDocuments + soonDocuments, color: expiredDocuments > 0 ? "#C0392B" : "#D4A017", tab: "belgeler" },
      { label: "Açık DÖF", value: openDofs, color: openDofs > 0 ? "#C0392B" : "#2D6A4F", tab: "dof" },
      { label: "Kritik Risk", value: criticalRisks, color: criticalRisks > 0 ? "#C0392B" : "#2D6A4F", tab: "risk" },
      { label: "Açık Olay", value: openAccidents, color: openAccidents > 0 ? "#7c3aed" : "#2D6A4F", tab: "is-kazasi-raporu" },
      { label: "Ziyaret Takibi", value: followUpVisits, color: followUpVisits > 0 ? "#0ea5e9" : "#2D6A4F", tab: "firma-ziyaretleri" },
    ],
    issues,
  };
}
