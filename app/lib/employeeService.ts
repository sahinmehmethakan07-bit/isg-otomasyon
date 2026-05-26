import { addDoc, collection, deleteDoc, doc, updateDoc, type Firestore } from "firebase/firestore";
import { createOnboardingFromChecklist, emptyChecklist } from "./dashboardUtils";
import { buildEmployeeRecord } from "./employeeData";
import { withCreatedBy, type UserProfile } from "./roleManager";
import type { Employee, EmployeeChecklist, NewEmployeeForm } from "./types";

export function validateNewEmployee(newEmployee: NewEmployeeForm) {
  if (!newEmployee.companyId) {
    return "⚠️ Önce firma seçmelisiniz. Firma listesi boşsa Admin panelinden bu kullanıcıya firma yetkisi verilmelidir.";
  }
  if (!newEmployee.firstName.trim()) {
    return "⚠️ Personel adı zorunlu.";
  }
  return null;
}

export async function createEmployeeRecord(db: Firestore, newEmployee: NewEmployeeForm, userProfile: UserProfile) {
  const checklist = { ...emptyChecklist };
  const data = buildEmployeeRecord(newEmployee, checklist);
  const ref = await addDoc(collection(db, "employees"), withCreatedBy(data, userProfile.uid, userProfile.activeRole || userProfile.role));
  return { id: ref.id, ...data };
}

export async function deleteEmployeeRecord(db: Firestore, employeeId: string) {
  await deleteDoc(doc(db, "employees", employeeId));
}

export async function saveEmployeeChecklist(db: Firestore, employeeId: string, checklist: EmployeeChecklist) {
  const onboarding = createOnboardingFromChecklist(checklist);
  const trainingComplete = onboarding.status === "completed";
  await updateDoc(doc(db, "employees", employeeId), { checklist, onboarding, trainingComplete });
  return { checklist, onboarding, trainingComplete };
}

export async function saveEmployeeTraining(db: Firestore, employee: Employee | undefined, employeeId: string, trainingComplete: boolean) {
  const onboarding = employee
    ? {
      ...(employee.onboarding || createOnboardingFromChecklist(employee.checklist)),
      status: trainingComplete ? "completed" as const : "pending" as const,
      missingSteps: trainingComplete ? [] : (employee.onboarding?.missingSteps || createOnboardingFromChecklist(employee.checklist).missingSteps),
    }
    : undefined;
  await updateDoc(doc(db, "employees", employeeId), onboarding ? { trainingComplete, onboarding } : { trainingComplete });
  return onboarding ? { trainingComplete, onboarding } : { trainingComplete };
}
