import { checklistCompletion, createOnboardingFromChecklist, getDateStatus } from "./dashboardUtils";
import type { DocumentRecord, Employee, EmployeeChecklist, PpeRecord, TrainingRecord } from "./types";

export type Employee360Metric = {
  label: string;
  value: number | string;
  color: string;
  tab: string;
};

export type Employee360Issue = {
  label: string;
  detail: string;
  color: string;
  tab: string;
};

export type Employee360Summary = {
  checklistCompleted: number;
  checklistTotal: number;
  checklistMissing: number;
  expiredDocuments: number;
  soonDocuments: number;
  completedTrainings: number;
  plannedTrainings: number;
  activePpe: number;
  missingSteps: string[];
  metrics: Employee360Metric[];
  issues: Employee360Issue[];
};

type Employee360Input = {
  employee: Employee;
  documents: DocumentRecord[];
  trainings: TrainingRecord[];
  ppeRecords: PpeRecord[];
};

const CHECKLIST_LABELS: Record<keyof EmployeeChecklist, string> = {
  isgCertificateDate: "İSG sertifikası tarihi",
  ek2Date: "EK-2 muayene tarihi",
  orientationDate: "Oryantasyon tarihi",
  preTest: "Ön test",
  postTest: "Son test",
  undertaking: "Taahhütname",
  kkdMinutes: "KKD tutanağı",
  attendanceDoc: "Katılım belgesi",
};

export function buildEmployee360Summary(input: Employee360Input): Employee360Summary {
  const { employee } = input;
  const onboarding = employee.onboarding || createOnboardingFromChecklist(employee.checklist);
  const checklist = checklistCompletion(employee.checklist);
  const employeeDocuments = input.documents.filter(document => document.employeeId === employee.id);
  const employeeTrainings = input.trainings.filter(training => training.participantIds.includes(employee.id));
  const employeePpe = input.ppeRecords.filter(record => record.employeeId === employee.id);
  const expiredDocuments = employeeDocuments.filter(document => document.expiryDate && getDateStatus(document.expiryDate) === "Süresi Dolmuş").length;
  const soonDocuments = employeeDocuments.filter(document => document.expiryDate && getDateStatus(document.expiryDate) === "Yaklaşıyor").length;
  const completedTrainings = employeeTrainings.filter(training => training.status === "Tamamlandı").length;
  const plannedTrainings = employeeTrainings.filter(training => training.status === "Planlandı").length;
  const activePpe = employeePpe.filter(record => record.status === "Teslim Edildi").length;

  const missingChecklistItems = (Object.keys(CHECKLIST_LABELS) as Array<keyof EmployeeChecklist>)
    .filter(key => !employee.checklist[key])
    .map(key => CHECKLIST_LABELS[key]);

  const issues: Employee360Issue[] = [
    ...(onboarding.status !== "completed"
      ? [{ label: "Onboarding", detail: onboarding.missingSteps.join(" · "), color: "#D4A017", tab: "personel" }]
      : []),
    ...(expiredDocuments > 0
      ? [{ label: "Belge", detail: `${expiredDocuments} personel belgesinin süresi dolmuş`, color: "#C0392B", tab: "belgeler" }]
      : []),
    ...(soonDocuments > 0
      ? [{ label: "Belge", detail: `${soonDocuments} personel belgesi yenilemeye yaklaşıyor`, color: "#D4A017", tab: "belgeler" }]
      : []),
    ...(plannedTrainings > 0
      ? [{ label: "Eğitim", detail: `${plannedTrainings} planlı eğitim bekliyor`, color: "#0ea5e9", tab: "egitimler" }]
      : []),
    ...(activePpe === 0
      ? [{ label: "KKD", detail: "Teslim edilmiş KKD kaydı bulunmuyor", color: "#D4A017", tab: "kkd-formu" }]
      : []),
    ...(missingChecklistItems.length > 0
      ? [{ label: "Checklist", detail: missingChecklistItems.slice(0, 4).join(" · "), color: "#D4A017", tab: "personel" }]
      : []),
  ];

  return {
    checklistCompleted: checklist.completed,
    checklistTotal: checklist.total,
    checklistMissing: checklist.missing,
    expiredDocuments,
    soonDocuments,
    completedTrainings,
    plannedTrainings,
    activePpe,
    missingSteps: onboarding.missingSteps,
    metrics: [
      { label: "Checklist", value: `${checklist.completed}/${checklist.total}`, color: checklist.missing === 0 ? "#2D6A4F" : "#D4A017", tab: "personel" },
      { label: "Belge Uyarısı", value: expiredDocuments + soonDocuments, color: expiredDocuments > 0 ? "#C0392B" : soonDocuments > 0 ? "#D4A017" : "#2D6A4F", tab: "belgeler" },
      { label: "Tamamlanan Eğitim", value: completedTrainings, color: "#2D6A4F", tab: "egitimler" },
      { label: "Planlı Eğitim", value: plannedTrainings, color: plannedTrainings > 0 ? "#0ea5e9" : "#2D6A4F", tab: "egitimler" },
      { label: "Aktif KKD", value: activePpe, color: activePpe > 0 ? "#2D6A4F" : "#D4A017", tab: "kkd-formu" },
    ],
    issues,
  };
}
