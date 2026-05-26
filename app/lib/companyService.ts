import { addDoc, collection, deleteDoc, doc, type Firestore } from "firebase/firestore";
import { dangerFromNace, extractNaceFromSgk, officialNameFromSgk } from "./dashboardUtils";
import { withCreatedBy, type UserProfile } from "./roleManager";
import type { Company, CompanyVisitRecord, DocumentRecord, DofRecord, Employee, RiskRecord, Signer } from "./types";

export type CompanyDraft = {
  nickName: string;
  officialName: string;
  sgkSicil: string;
  naceCode: string;
  dangerClass: Company["dangerClass"];
  employeeCount: string;
  contractEnd: string;
  serviceType: Company["serviceType"];
  contactEmail: string;
};

export const emptyCompanyDraft: CompanyDraft = {
  nickName: "",
  officialName: "",
  sgkSicil: "",
  naceCode: "",
  dangerClass: "Az Tehlikeli",
  employeeCount: "",
  contractEnd: "",
  serviceType: "İş Güvenliği",
  contactEmail: "",
};

export function buildCompanyRecord(newCompany: CompanyDraft): Omit<Company, "id"> {
  const naceCode = newCompany.naceCode || extractNaceFromSgk(newCompany.sgkSicil);
  const officialName = newCompany.officialName || officialNameFromSgk(newCompany.sgkSicil) || newCompany.nickName;

  return {
    nickName: newCompany.nickName,
    officialName,
    sgkSicil: newCompany.sgkSicil,
    naceCode,
    dangerClass: dangerFromNace(naceCode),
    employeeCount: parseInt(newCompany.employeeCount) || 0,
    contractEnd: newCompany.contractEnd,
    serviceType: newCompany.serviceType,
    contactEmail: newCompany.contactEmail,
  };
}

export async function createCompanyRecord(db: Firestore, newCompany: CompanyDraft, userProfile: UserProfile): Promise<Company | null> {
  if (!newCompany.nickName || !newCompany.sgkSicil) return null;
  const data = buildCompanyRecord(newCompany);
  const ref = await addDoc(collection(db, "companies"), withCreatedBy(data, userProfile.uid, userProfile.activeRole || userProfile.role));
  return { id: ref.id, ...data };
}

type DeleteCompanyInput = {
  employees: Employee[];
  documents: DocumentRecord[];
  dofs: DofRecord[];
  risks: RiskRecord[];
  signers: Signer[];
  companyVisits: CompanyVisitRecord[];
};

export async function deleteCompanyCascade(db: Firestore, companyId: string, related: DeleteCompanyInput) {
  const relatedEmployees = related.employees.filter(employee => employee.companyId === companyId);
  const relatedDocs = related.documents.filter(document => document.companyId === companyId);
  const relatedDofs = related.dofs.filter(dof => dof.companyId === companyId);
  const relatedRisks = related.risks.filter(risk => risk.companyId === companyId);
  const relatedSigners = related.signers.filter(signer => signer.companyId === companyId);
  const relatedCompanyVisits = related.companyVisits.filter(visit => visit.companyId === companyId);

  await Promise.all([
    deleteDoc(doc(db, "companies", companyId)),
    ...relatedEmployees.map(employee => deleteDoc(doc(db, "employees", employee.id))),
    ...relatedDocs.map(document => deleteDoc(doc(db, "documents", document.id))),
    ...relatedDofs.map(dof => deleteDoc(doc(db, "dofs", dof.id))),
    ...relatedRisks.map(risk => deleteDoc(doc(db, "risks", risk.id))),
    ...relatedSigners.map(signer => deleteDoc(doc(db, "signers", signer.id))),
    ...relatedCompanyVisits.map(visit => deleteDoc(doc(db, "companyVisits", visit.id))),
  ]);
}
