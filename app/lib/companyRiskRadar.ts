import { getDateStatus } from "./dashboardUtils";
import type { AccidentReportRecord, Company, CompanyVisitRecord, DocumentRecord, DofRecord, RiskRecord } from "./types";

export type CompanyRiskRadarItem = {
  companyId: string;
  companyName: string;
  score: number;
  level: "Kritik" | "Dikkat" | "İzlemede";
  color: string;
  reasons: string[];
};

type CompanyRiskRadarInput = {
  companies: Company[];
  documents: DocumentRecord[];
  dofs: DofRecord[];
  risks: RiskRecord[];
  accidentReports: AccidentReportRecord[];
  companyVisits: CompanyVisitRecord[];
};

export function getCompanyRiskRadar(input: CompanyRiskRadarInput): CompanyRiskRadarItem[] {
  return input.companies
    .map(company => {
      const companyDocuments = input.documents.filter(document => document.companyId === company.id);
      const expiredDocs = companyDocuments.filter(document => getDateStatus(document.expiryDate) === "Süresi Dolmuş").length;
      const soonDocs = companyDocuments.filter(document => getDateStatus(document.expiryDate) === "Yaklaşıyor").length;
      const openDofs = input.dofs.filter(dof => dof.companyId === company.id && dof.status !== "Çözüldü" && dof.status !== "Riske Aktarıldı").length;
      const highRisks = input.risks.filter(risk => risk.companyId === company.id && risk.status !== "Kapandı" && risk.score >= 15).length;
      const openAccidents = input.accidentReports.filter(report => report.companyId === company.id && report.status !== "Kapandı").length;
      const visitFollowUps = input.companyVisits.filter(visit => visit.companyId === company.id && (visit.status === "Takip Gerekli" || visit.status === "Planlandı")).length;

      const score = expiredDocs * 5 + highRisks * 5 + openAccidents * 4 + openDofs * 3 + visitFollowUps * 2 + soonDocs;
      const reasons = [
        expiredDocs > 0 ? `${expiredDocs} süresi dolmuş belge` : "",
        highRisks > 0 ? `${highRisks} yüksek risk` : "",
        openAccidents > 0 ? `${openAccidents} açık olay` : "",
        openDofs > 0 ? `${openDofs} açık DÖF` : "",
        visitFollowUps > 0 ? `${visitFollowUps} ziyaret takibi` : "",
        soonDocs > 0 ? `${soonDocs} yaklaşan belge` : "",
      ].filter(Boolean);

      const level: CompanyRiskRadarItem["level"] = score >= 10 ? "Kritik" : score >= 4 ? "Dikkat" : "İzlemede";
      const color = level === "Kritik" ? "#C0392B" : level === "Dikkat" ? "#D4A017" : "#2D6A4F";

      return {
        companyId: company.id,
        companyName: company.nickName,
        score,
        level,
        color,
        reasons,
      };
    })
    .filter(item => item.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, 5);
}
