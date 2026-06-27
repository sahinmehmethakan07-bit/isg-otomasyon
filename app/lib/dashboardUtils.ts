import { sgkCompanyRegistry } from "./constants";
import type {
  AnnualPlanStatus,
  CommitteeMeetingRecord,
  DangerClass,
  Employee,
  EmployeeChecklist,
  EmployeeOnboarding,
  OnboardingTask,
  OnboardingTaskKey,
  TrainingRecord,
} from "./types";

export const emptyChecklist: EmployeeChecklist = {
  isgCertificateDate: "",
  ek2Date: "",
  orientationDate: "",
  preTest: false,
  postTest: false,
  undertaking: false,
  kkdMinutes: false,
  attendanceDoc: false,
};

export function createOnboardingFromChecklist(checklist: EmployeeChecklist): EmployeeOnboarding {
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

export function normalizeChecklist(checklist?: Partial<EmployeeChecklist> | null): EmployeeChecklist {
  return {
    ...emptyChecklist,
    ...(checklist || {}),
    preTest: !!checklist?.preTest,
    postTest: !!checklist?.postTest,
    undertaking: !!checklist?.undertaking,
    kkdMinutes: !!checklist?.kkdMinutes,
    attendanceDoc: !!checklist?.attendanceDoc,
  };
}

export function normalizeOnboarding(onboarding: EmployeeOnboarding | undefined, checklist: EmployeeChecklist): EmployeeOnboarding {
  const generated = createOnboardingFromChecklist(checklist);
  const tasks = onboarding?.tasks ? { ...generated.tasks, ...onboarding.tasks } : generated.tasks;
  const missingSteps = Object.values(tasks).filter(task => !task.completed).map(task => task.label);
  return {
    ...generated,
    ...(onboarding || {}),
    tasks,
    missingSteps,
    status: missingSteps.length === 0 ? "completed" : "pending",
  };
}

export function normalizeEmployeeRecord(employee: Employee): Employee {
  const checklist = normalizeChecklist(employee.checklist);
  return {
    ...employee,
    checklist,
    trainingComplete: !!employee.trainingComplete,
    isActive: employee.isActive !== false,
    onboarding: normalizeOnboarding(employee.onboarding, checklist),
  };
}

export function normalizeTrainingRecord(training: TrainingRecord): TrainingRecord {
  return {
    ...training,
    participantIds: Array.isArray(training.participantIds) ? training.participantIds : [],
  };
}

export function normalizeCommitteeMeetingRecord(meeting: CommitteeMeetingRecord): CommitteeMeetingRecord {
  return {
    ...meeting,
    participantIds: Array.isArray(meeting.participantIds) ? meeting.participantIds : [],
  };
}

export function daysUntil(dateString: string) {
  const now = new Date();
  const target = new Date(dateString);
  return Math.ceil((target.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
}

export function getDateStatus(dateString: string) {
  const days = daysUntil(dateString);
  if (days < 0) return "Süresi Dolmuş";
  if (days <= 30) return "Yaklaşıyor";
  return "Geçerli";
}

export function dangerFromNace(naceCode: string): DangerClass {
  const code = naceCode.trim();
  if (code.startsWith("41") || code.startsWith("42") || code.startsWith("43") || code.startsWith("55") || code.startsWith("56")) return "Çok Tehlikeli";
  if (code.startsWith("46") || code.startsWith("49") || code.startsWith("52") || code.startsWith("81")) return "Tehlikeli";
  return "Az Tehlikeli";
}

export function extractNaceFromSgk(sgkSicil: string) {
  const clean = sgkSicil.replace(/\D/g, "");
  if (sgkCompanyRegistry[clean]) return sgkCompanyRegistry[clean].naceCode;
  if (clean.length >= 6) return `${clean.slice(0, 2)}.${clean.slice(2, 4)}.${clean.slice(4, 6)}`;
  return "00.00.00";
}

export function officialNameFromSgk(sgkSicil: string) {
  const clean = sgkSicil.replace(/\D/g, "");
  return sgkCompanyRegistry[clean]?.officialName || "";
}

export function statusColor(status: string) {
  if (status === "Süresi Dolmuş") return "#C0392B";
  if (status === "Yaklaşıyor") return "#D4A017";
  return "#2D6A4F";
}

export function priorityColor(priority: string) {
  if (priority === "Yüksek") return "#C0392B";
  if (priority === "Orta") return "#D4A017";
  return "#2D6A4F";
}

export function riskScoreColor(value: number) {
  if (value >= 15) return "#C0392B";
  if (value >= 8) return "#D4A017";
  return "#2D6A4F";
}

export function annualPlanStatusColor(status: AnnualPlanStatus) {
  if (status === "Tamamlandı") return "#2D6A4F";
  if (status === "Devam Ediyor") return "#1B4332";
  if (status === "Gecikti") return "#C0392B";
  return "#D4A017";
}

export function checklistCompletion(checklist: EmployeeChecklist) {
  const items = [
    !!checklist.isgCertificateDate, !!checklist.ek2Date, !!checklist.orientationDate,
    checklist.preTest, checklist.postTest, checklist.undertaking, checklist.kkdMinutes, checklist.attendanceDoc,
  ];
  const completed = items.filter(Boolean).length;
  return { completed, total: items.length, missing: items.length - completed };
}
