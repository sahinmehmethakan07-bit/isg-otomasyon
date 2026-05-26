import { addDoc, collection, deleteDoc, doc, type Firestore } from "firebase/firestore";
import { withCreatedBy, type UserProfile } from "./roleManager";
import type { DocumentRecord, Observer, Signer, SignerRole } from "./types";

export type DocumentDraft = {
  companyId: string;
  employeeId: string;
  type: string;
  issueDate: string;
  expiryDate: string;
};

export type ObserverDraft = {
  fullName: string;
  title: string;
  certificateNo: string;
  phone: string;
};

export const emptyDocumentDraft: DocumentDraft = {
  companyId: "",
  employeeId: "",
  type: "Risk Değerlendirme Raporu",
  issueDate: "",
  expiryDate: "",
};

export const emptyObserverDraft: ObserverDraft = {
  fullName: "",
  title: "",
  certificateNo: "",
  phone: "",
};

export async function createDocumentRecord(db: Firestore, draft: DocumentDraft, userProfile: UserProfile): Promise<DocumentRecord | null> {
  if (!draft.companyId || !draft.type || !draft.issueDate) return null;

  const data: Omit<DocumentRecord, "id"> = {
    companyId: draft.companyId,
    employeeId: draft.employeeId || null,
    type: draft.type,
    issueDate: draft.issueDate,
    expiryDate: draft.expiryDate,
  };
  const ref = await addDoc(collection(db, "documents"), withCreatedBy(data, userProfile.uid, userProfile.activeRole || userProfile.role));
  return { id: ref.id, ...data };
}

export async function deleteDocumentRecord(db: Firestore, id: string) {
  await deleteDoc(doc(db, "documents", id));
}

export async function createObserverRecord(db: Firestore, draft: ObserverDraft, userProfile: UserProfile): Promise<Observer | null> {
  if (!draft.fullName.trim()) return null;

  const data: Omit<Observer, "id"> = {
    fullName: draft.fullName,
    title: draft.title,
    certificateNo: draft.certificateNo,
    phone: draft.phone,
  };
  const ref = await addDoc(collection(db, "observers"), withCreatedBy(data, userProfile.uid, userProfile.activeRole || userProfile.role));
  return { id: ref.id, ...data };
}

export async function deleteObserverRecord(db: Firestore, id: string) {
  await deleteDoc(doc(db, "observers", id));
}

export async function createSignerRecord(db: Firestore, companyId: string, role: SignerRole, fullName: string, userProfile: UserProfile): Promise<Signer | null> {
  if (!companyId || !fullName.trim()) return null;

  const data: Omit<Signer, "id"> = { companyId, role, fullName };
  const ref = await addDoc(collection(db, "signers"), withCreatedBy(data, userProfile.uid, userProfile.activeRole || userProfile.role));
  return { id: ref.id, ...data };
}

export async function deleteSignerRecord(db: Firestore, id: string) {
  await deleteDoc(doc(db, "signers", id));
}
