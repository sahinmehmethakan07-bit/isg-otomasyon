import { requiredCompanyDocs } from "./constants";
import { getDateStatus } from "./dashboardUtils";
import type { Company, DocumentRecord } from "./types";

export type CompanyDocumentCompliance = {
  companyId: string;
  companyName: string;
  missingDocs: string[];
  expiredDocs: string[];
  soonDocs: string[];
  validDocs: number;
  score: number;
  level: "Kritik" | "Takip" | "Uygun";
  color: string;
};

export type DocumentComplianceSummary = {
  companies: CompanyDocumentCompliance[];
  missingTotal: number;
  expiredTotal: number;
  soonTotal: number;
  criticalCompanies: number;
  averageScore: number;
};

type ComplianceLevel = CompanyDocumentCompliance["level"];

export function buildDocumentCompliance(companies: Company[], documents: DocumentRecord[]): DocumentComplianceSummary {
  const companySummaries = companies.map(company => {
    const companyDocuments = documents.filter(document => document.companyId === company.id && !document.employeeId);
    const missingDocs = requiredCompanyDocs.filter(type => !companyDocuments.some(document => document.type === type));
    const expiredDocs = companyDocuments
      .filter(document => document.expiryDate && getDateStatus(document.expiryDate) === "Süresi Dolmuş")
      .map(document => document.type);
    const soonDocs = companyDocuments
      .filter(document => document.expiryDate && getDateStatus(document.expiryDate) === "Yaklaşıyor")
      .map(document => document.type);
    const validDocs = companyDocuments.filter(document => document.expiryDate && getDateStatus(document.expiryDate) === "Geçerli").length;
    const requiredScore = requiredCompanyDocs.length === 0
      ? 100
      : Math.round(((requiredCompanyDocs.length - missingDocs.length) / requiredCompanyDocs.length) * 100);
    const penalty = expiredDocs.length * 15 + soonDocs.length * 5;
    const score = Math.max(0, requiredScore - penalty);
    const level: ComplianceLevel = missingDocs.length > 0 || expiredDocs.length > 0 ? "Kritik" : soonDocs.length > 0 ? "Takip" : "Uygun";
    const color = level === "Kritik" ? "#C0392B" : level === "Takip" ? "#D4A017" : "#2D6A4F";

    return {
      companyId: company.id,
      companyName: company.nickName,
      missingDocs,
      expiredDocs,
      soonDocs,
      validDocs,
      score,
      level,
      color,
    };
  }).sort((a, b) => {
    const levelWeight: Record<ComplianceLevel, number> = { Kritik: 0, Takip: 1, Uygun: 2 };
    const byLevel = levelWeight[a.level] - levelWeight[b.level];
    if (byLevel !== 0) return byLevel;
    return a.score - b.score;
  });

  const missingTotal = companySummaries.reduce((total, company) => total + company.missingDocs.length, 0);
  const expiredTotal = companySummaries.reduce((total, company) => total + company.expiredDocs.length, 0);
  const soonTotal = companySummaries.reduce((total, company) => total + company.soonDocs.length, 0);
  const criticalCompanies = companySummaries.filter(company => company.level === "Kritik").length;
  const averageScore = companySummaries.length === 0
    ? 100
    : Math.round(companySummaries.reduce((total, company) => total + company.score, 0) / companySummaries.length);

  return {
    companies: companySummaries,
    missingTotal,
    expiredTotal,
    soonTotal,
    criticalCompanies,
    averageScore,
  };
}
