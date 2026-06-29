import { addDoc, collection, deleteDoc, doc, updateDoc, type Firestore } from "firebase/firestore";
import { withCreatedBy, type UserProfile } from "./roleManager";
import type {
  AccidentReportRecord,
  AccidentReportStatus,
  AccidentSeverity,
  AnnualPlanRecord,
  AnnualPlanStatus,
  AnnualPlanType,
  CommitteeMeetingRecord,
  CommitteeMeetingStatus,
  CompanyVisitPurpose,
  CompanyVisitRecord,
  CompanyVisitStatus,
  EmergencyPlanRecord,
  EmergencyPlanStatus,
  PpeRecord,
  PpeStatus,
  TrainingRecord,
  TrainingStatus,
  TrainingType,
} from "./types";

export type AnnualPlanDraft = {
  companyId: string;
  year: string;
  type: AnnualPlanType;
  title: string;
  plannedDate: string;
  responsible: string;
  status: AnnualPlanStatus;
  notes: string;
};

export type TrainingDraft = {
  companyId: string;
  title: string;
  type: TrainingType;
  trainingDate: string;
  durationHours: string;
  location: string;
  trainer: string;
  participantIds: string[];
  status: TrainingStatus;
  notes: string;
};

export type PpeDraft = {
  companyId: string;
  employeeId: string;
  equipment: string;
  quantity: string;
  issueDate: string;
  returnDate: string;
  status: PpeStatus;
  serialNo: string;
  notes: string;
};

export type EmergencyPlanDraft = {
  companyId: string;
  title: string;
  scenario: string;
  assemblyArea: string;
  emergencyTeam: string;
  responsible: string;
  planDate: string;
  drillDate: string;
  status: EmergencyPlanStatus;
  notes: string;
};

export type CommitteeMeetingDraft = {
  companyId: string;
  meetingNo: string;
  meetingDate: string;
  location: string;
  chairperson: string;
  agenda: string;
  decisions: string;
  participantIds: string[];
  status: CommitteeMeetingStatus;
  notes: string;
};

export type AccidentReportDraft = {
  companyId: string;
  employeeId: string;
  relatedRiskId: string;
  relatedDofId: string;
  accidentDate: string;
  location: string;
  severity: AccidentSeverity;
  incidentType: string;
  description: string;
  rootCause: string;
  actionPlan: string;
  responsible: string;
  dueDate: string;
  status: AccidentReportStatus;
  notes: string;
};

export type CompanyVisitDraft = {
  companyId: string;
  visitDate: string;
  purpose: CompanyVisitPurpose;
  visitor: string;
  contactedPerson: string;
  findings: string;
  actions: string;
  nextVisitDate: string;
  status: CompanyVisitStatus;
  notes: string;
};

export const emptyAnnualPlanDraft: AnnualPlanDraft = {
  companyId: "",
  year: String(new Date().getFullYear()),
  type: "Eğitim",
  title: "",
  plannedDate: "",
  responsible: "",
  status: "Planlandı",
  notes: "",
};

export const emptyTrainingDraft: TrainingDraft = {
  companyId: "",
  title: "",
  type: "Temel İSG Eğitimi",
  trainingDate: "",
  durationHours: "",
  location: "",
  trainer: "",
  participantIds: [],
  status: "Planlandı",
  notes: "",
};

export const emptyPpeDraft: PpeDraft = {
  companyId: "",
  employeeId: "",
  equipment: "Baret",
  quantity: "1",
  issueDate: "",
  returnDate: "",
  status: "Teslim Edildi",
  serialNo: "",
  notes: "",
};

export const emptyEmergencyPlanDraft: EmergencyPlanDraft = {
  companyId: "",
  title: "Acil Durum Planı",
  scenario: "Yangın",
  assemblyArea: "",
  emergencyTeam: "",
  responsible: "",
  planDate: "",
  drillDate: "",
  status: "Taslak",
  notes: "",
};

export const emptyCommitteeMeetingDraft: CommitteeMeetingDraft = {
  companyId: "",
  meetingNo: "",
  meetingDate: "",
  location: "",
  chairperson: "",
  agenda: "",
  decisions: "",
  participantIds: [],
  status: "Planlandı",
  notes: "",
};

export const emptyAccidentReportDraft: AccidentReportDraft = {
  companyId: "",
  employeeId: "",
  relatedRiskId: "",
  relatedDofId: "",
  accidentDate: "",
  location: "",
  severity: "Hafif",
  incidentType: "İş Kazası",
  description: "",
  rootCause: "",
  actionPlan: "",
  responsible: "",
  dueDate: "",
  status: "Açık",
  notes: "",
};

export const emptyCompanyVisitDraft: CompanyVisitDraft = {
  companyId: "",
  visitDate: "",
  purpose: "Rutin Ziyaret",
  visitor: "",
  contactedPerson: "",
  findings: "",
  actions: "",
  nextVisitDate: "",
  status: "Planlandı",
  notes: "",
};

function creator(userProfile: UserProfile) {
  return { uid: userProfile.uid, role: userProfile.activeRole || userProfile.role };
}

export async function createAnnualPlanRecord(db: Firestore, draft: AnnualPlanDraft, userProfile: UserProfile): Promise<AnnualPlanRecord | null> {
  if (!draft.companyId || !draft.title || !draft.plannedDate) return null;
  const data: Omit<AnnualPlanRecord, "id"> = {
    companyId: draft.companyId,
    year: parseInt(draft.year) || new Date().getFullYear(),
    type: draft.type,
    title: draft.title,
    plannedDate: draft.plannedDate,
    responsible: draft.responsible,
    status: draft.status,
    notes: draft.notes,
  };
  const user = creator(userProfile);
  const ref = await addDoc(collection(db, "annualPlans"), withCreatedBy(data, user.uid, user.role));
  return { id: ref.id, ...data };
}

export async function createTrainingRecord(db: Firestore, draft: TrainingDraft, userProfile: UserProfile): Promise<TrainingRecord | null> {
  if (!draft.companyId || !draft.title || !draft.trainingDate) return null;
  const data: Omit<TrainingRecord, "id"> = {
    companyId: draft.companyId,
    title: draft.title,
    type: draft.type,
    trainingDate: draft.trainingDate,
    durationHours: draft.durationHours,
    location: draft.location,
    trainer: draft.trainer,
    participantIds: draft.participantIds,
    status: draft.status,
    notes: draft.notes,
  };
  const user = creator(userProfile);
  const ref = await addDoc(collection(db, "trainings"), withCreatedBy(data, user.uid, user.role));
  return { id: ref.id, ...data };
}

export async function createPpeRecord(db: Firestore, draft: PpeDraft, userProfile: UserProfile): Promise<PpeRecord | null> {
  if (!draft.companyId || !draft.employeeId || !draft.equipment || !draft.issueDate) return null;
  const data: Omit<PpeRecord, "id"> = {
    companyId: draft.companyId,
    employeeId: draft.employeeId,
    equipment: draft.equipment,
    quantity: parseInt(draft.quantity) || 1,
    issueDate: draft.issueDate,
    returnDate: draft.returnDate,
    status: draft.status,
    serialNo: draft.serialNo,
    notes: draft.notes,
  };
  const user = creator(userProfile);
  const ref = await addDoc(collection(db, "ppeRecords"), withCreatedBy(data, user.uid, user.role));
  return { id: ref.id, ...data };
}

export async function createEmergencyPlanRecord(db: Firestore, draft: EmergencyPlanDraft, userProfile: UserProfile): Promise<EmergencyPlanRecord | null> {
  if (!draft.companyId || !draft.title || !draft.planDate) return null;
  const data: Omit<EmergencyPlanRecord, "id"> = {
    companyId: draft.companyId,
    title: draft.title,
    scenario: draft.scenario,
    assemblyArea: draft.assemblyArea,
    emergencyTeam: draft.emergencyTeam,
    responsible: draft.responsible,
    planDate: draft.planDate,
    drillDate: draft.drillDate,
    status: draft.status,
    notes: draft.notes,
  };
  const user = creator(userProfile);
  const ref = await addDoc(collection(db, "emergencyPlans"), withCreatedBy(data, user.uid, user.role));
  return { id: ref.id, ...data };
}

export async function createCommitteeMeetingRecord(db: Firestore, draft: CommitteeMeetingDraft, userProfile: UserProfile): Promise<CommitteeMeetingRecord | null> {
  if (!draft.companyId || !draft.meetingDate) return null;
  const data: Omit<CommitteeMeetingRecord, "id"> = {
    companyId: draft.companyId,
    meetingNo: draft.meetingNo,
    meetingDate: draft.meetingDate,
    location: draft.location,
    chairperson: draft.chairperson,
    agenda: draft.agenda,
    decisions: draft.decisions,
    participantIds: draft.participantIds,
    status: draft.status,
    notes: draft.notes,
  };
  const user = creator(userProfile);
  const ref = await addDoc(collection(db, "committeeMeetings"), withCreatedBy(data, user.uid, user.role));
  return { id: ref.id, ...data };
}

export async function createAccidentReportRecord(db: Firestore, draft: AccidentReportDraft, userProfile: UserProfile): Promise<AccidentReportRecord | null> {
  if (!draft.companyId || !draft.accidentDate || !draft.description) return null;
  const data: Omit<AccidentReportRecord, "id"> = {
    companyId: draft.companyId,
    employeeId: draft.employeeId,
    relatedRiskId: draft.relatedRiskId,
    relatedDofId: draft.relatedDofId,
    accidentDate: draft.accidentDate,
    location: draft.location,
    severity: draft.severity,
    incidentType: draft.incidentType,
    description: draft.description,
    rootCause: draft.rootCause,
    actionPlan: draft.actionPlan,
    responsible: draft.responsible,
    dueDate: draft.dueDate,
    status: draft.status,
    notes: draft.notes,
  };
  const user = creator(userProfile);
  const ref = await addDoc(collection(db, "accidentReports"), withCreatedBy(data, user.uid, user.role));
  return { id: ref.id, ...data };
}

export async function createCompanyVisitRecord(db: Firestore, draft: CompanyVisitDraft, userProfile: UserProfile): Promise<CompanyVisitRecord | null> {
  if (!draft.companyId || !draft.visitDate || !draft.visitor) return null;
  const data: Omit<CompanyVisitRecord, "id"> = {
    companyId: draft.companyId,
    visitDate: draft.visitDate,
    purpose: draft.purpose,
    visitor: draft.visitor,
    contactedPerson: draft.contactedPerson,
    findings: draft.findings,
    actions: draft.actions,
    nextVisitDate: draft.nextVisitDate,
    status: draft.status,
    notes: draft.notes,
  };
  const user = creator(userProfile);
  const ref = await addDoc(collection(db, "companyVisits"), withCreatedBy(data, user.uid, user.role));
  return { id: ref.id, ...data };
}

export async function updateModuleRecordStatus(db: Firestore, collectionName: string, id: string, status: string) {
  await updateDoc(doc(db, collectionName, id), { status });
}

export async function deleteModuleRecord(db: Firestore, collectionName: string, id: string) {
  await deleteDoc(doc(db, collectionName, id));
}
