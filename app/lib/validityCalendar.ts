import { daysUntil, getDateStatus } from "./dashboardUtils";
import type { Company, DocumentRecord, TrainingRecord } from "./types";

export type ValidityCalendarItem = {
  id: string;
  companyId: string;
  type: "Belge" | "Sözleşme" | "Eğitim";
  title: string;
  owner: string;
  dueDate: string;
  status: "Süresi Dolmuş" | "Yaklaşıyor" | "Geçerli";
  daysRemaining: number;
  sourceTab: string;
};

type ValidityCalendarInput = {
  companies: Company[];
  documents: DocumentRecord[];
  trainings: TrainingRecord[];
};

function compareValidity(a: ValidityCalendarItem, b: ValidityCalendarItem) {
  const rank = { "Süresi Dolmuş": 0, "Yaklaşıyor": 1, "Geçerli": 2 };
  return rank[a.status] - rank[b.status] || a.daysRemaining - b.daysRemaining;
}

export function buildValidityCalendar(input: ValidityCalendarInput): ValidityCalendarItem[] {
  const companyName = (companyId: string) => input.companies.find(company => company.id === companyId)?.nickName || "Firma";

  const documentItems = input.documents
    .filter(document => Boolean(document.expiryDate))
    .map(document => ({
      id: `document-${document.id}`,
      companyId: document.companyId,
      type: "Belge" as const,
      title: document.type,
      owner: companyName(document.companyId),
      dueDate: document.expiryDate,
      status: getDateStatus(document.expiryDate) as ValidityCalendarItem["status"],
      daysRemaining: daysUntil(document.expiryDate),
      sourceTab: "belgeler",
    }));

  const contractItems = input.companies
    .filter(company => Boolean(company.contractEnd))
    .map(company => ({
      id: `company-contract-${company.id}`,
      companyId: company.id,
      type: "Sözleşme" as const,
      title: "Firma sözleşme bitişi",
      owner: company.nickName,
      dueDate: company.contractEnd,
      status: getDateStatus(company.contractEnd) as ValidityCalendarItem["status"],
      daysRemaining: daysUntil(company.contractEnd),
      sourceTab: "firmalar",
    }));

  const plannedTrainingItems = input.trainings
    .filter(training => training.status === "Planlandı" && Boolean(training.trainingDate))
    .map(training => ({
      id: `training-${training.id}`,
      companyId: training.companyId,
      type: "Eğitim" as const,
      title: training.title || training.type,
      owner: training.trainer || companyName(training.companyId),
      dueDate: training.trainingDate,
      status: getDateStatus(training.trainingDate) as ValidityCalendarItem["status"],
      daysRemaining: daysUntil(training.trainingDate),
      sourceTab: "egitimler",
    }));

  return [...documentItems, ...contractItems, ...plannedTrainingItems].sort(compareValidity);
}
