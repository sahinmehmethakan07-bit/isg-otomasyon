import { addDoc, collection, deleteDoc, doc, updateDoc, type Firestore } from "firebase/firestore";
import { withCreatedBy, type UserProfile } from "./roleManager";
import type { DofRecord, RiskRecord } from "./types";

export type DofDraft = {
  companyId: string;
  observerId: string;
  title: string;
  description: string;
  lawReference: string;
  priority: DofRecord["priority"];
  responsible: string;
  dueDate: string;
  status: DofRecord["status"];
  location: string;
  beforePhoto: string;
  afterPhoto: string;
  affectedPersons: string;
};

export type RiskDraft = {
  companyId: string;
  section: string;
  hazard: string;
  risk: string;
  currentMeasure: string;
  actionToTake: string;
  probability: string;
  severity: string;
  residualProbability: string;
  residualSeverity: string;
  responsible: string;
  dueDate: string;
  status: RiskRecord["status"];
  affectedPersons: string;
  lawReference: string;
  controlDate: string;
};

export const emptyDofDraft: DofDraft = {
  companyId: "",
  observerId: "",
  title: "",
  description: "",
  lawReference: "",
  priority: "Orta",
  responsible: "",
  dueDate: "",
  status: "Açık",
  location: "",
  beforePhoto: "",
  afterPhoto: "",
  affectedPersons: "",
};

export const emptyRiskDraft: RiskDraft = {
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
  status: "Açık",
  affectedPersons: "",
  lawReference: "",
  controlDate: "",
};

export function buildDofRecord(draft: DofDraft): Omit<DofRecord, "id"> {
  const data: Omit<DofRecord, "id"> = {
    companyId: draft.companyId,
    observerId: draft.observerId,
    title: draft.title,
    description: draft.description,
    lawReference: draft.lawReference,
    priority: draft.priority,
    responsible: draft.responsible,
    dueDate: draft.dueDate,
    status: draft.status,
    location: draft.location,
    affectedPersons: draft.affectedPersons || "",
  };

  if (draft.beforePhoto) data.beforePhoto = draft.beforePhoto;
  if (draft.afterPhoto) data.afterPhoto = draft.afterPhoto;

  return data;
}

export async function createDofRecord(db: Firestore, draft: DofDraft, userProfile: UserProfile): Promise<DofRecord | null> {
  if (!draft.companyId || !draft.title) return null;

  const data = buildDofRecord(draft);
  const ref = await addDoc(collection(db, "dofs"), withCreatedBy(data, userProfile.uid, userProfile.activeRole || userProfile.role));
  return { id: ref.id, ...data };
}

export async function deleteDofRecord(db: Firestore, id: string) {
  await deleteDoc(doc(db, "dofs", id));
}

export async function updateDofStatusRecord(db: Firestore, id: string, status: DofRecord["status"]) {
  await updateDoc(doc(db, "dofs", id), { status });
}

export async function updateDofPhotoRecord(db: Firestore, id: string, field: "beforePhoto" | "afterPhoto", base64: string) {
  await updateDoc(doc(db, "dofs", id), { [field]: base64 });
}

export async function removeDofPhotoRecord(db: Firestore, id: string, field: "beforePhoto" | "afterPhoto") {
  await updateDoc(doc(db, "dofs", id), { [field]: "" });
}

export function buildRiskFromDof(dof: DofRecord): Omit<RiskRecord, "id"> {
  const probMap: Record<DofRecord["priority"], number> = { "Yüksek": 5, "Orta": 3, "Düşük": 1 };
  const prob = probMap[dof.priority] || 3;
  const sev = dof.priority === "Yüksek" ? 4 : dof.priority === "Orta" ? 3 : 2;

  return {
    companyId: dof.companyId,
    sourceDofId: dof.id,
    section: dof.location || "",
    hazard: dof.title,
    risk: dof.description || "",
    currentMeasure: "",
    actionToTake: "",
    probability: prob,
    severity: sev,
    score: prob * sev,
    residualProbability: 1,
    residualSeverity: 1,
    residualScore: 1,
    responsible: dof.responsible || "",
    dueDate: dof.dueDate || "",
    status: "Açık",
    affectedPersons: dof.affectedPersons || "",
    lawReference: dof.lawReference || "",
    controlDate: "",
  };
}

export async function createRiskFromDofRecord(db: Firestore, dof: DofRecord, userProfile: UserProfile): Promise<RiskRecord> {
  const data = buildRiskFromDof(dof);
  const ref = await addDoc(collection(db, "risks"), withCreatedBy(data, userProfile.uid, userProfile.activeRole || userProfile.role));
  await updateDoc(doc(db, "dofs", dof.id), { status: "Riske Aktarıldı" });
  return { id: ref.id, ...data };
}

export function buildRiskRecord(draft: RiskDraft): Omit<RiskRecord, "id"> {
  const prob = parseInt(draft.probability);
  const sev = parseInt(draft.severity);
  const residualProbability = parseInt(draft.residualProbability);
  const residualSeverity = parseInt(draft.residualSeverity);

  return {
    companyId: draft.companyId,
    sourceDofId: null,
    section: draft.section,
    hazard: draft.hazard,
    risk: draft.risk,
    currentMeasure: draft.currentMeasure,
    actionToTake: draft.actionToTake,
    probability: prob,
    severity: sev,
    score: prob * sev,
    residualProbability,
    residualSeverity,
    residualScore: residualProbability * residualSeverity,
    responsible: draft.responsible,
    dueDate: draft.dueDate,
    status: draft.status,
    affectedPersons: draft.affectedPersons,
    lawReference: draft.lawReference,
    controlDate: draft.controlDate,
  };
}

export async function createRiskRecord(db: Firestore, draft: RiskDraft, userProfile: UserProfile): Promise<RiskRecord | null> {
  if (!draft.companyId || !draft.hazard) return null;

  const data = buildRiskRecord(draft);
  const ref = await addDoc(collection(db, "risks"), withCreatedBy(data, userProfile.uid, userProfile.activeRole || userProfile.role));
  return { id: ref.id, ...data };
}

export async function deleteRiskRecord(db: Firestore, id: string) {
  await deleteDoc(doc(db, "risks", id));
}
