import type { EmployeeChecklist, NewEmployeeForm } from "./types";
import { createOnboardingFromChecklist } from "./dashboardUtils";

export function buildEmployeeRecord(newEmployee: NewEmployeeForm, checklist: EmployeeChecklist) {
  const onboarding = createOnboardingFromChecklist(checklist);
  const nationality = newEmployee.nationality === "Diğer"
    ? newEmployee.nationalityOther
    : newEmployee.nationality;
  const driverLicense = [newEmployee.driverLicense, newEmployee.driverLicenseClass]
    .filter(Boolean)
    .join(" / ");

  return {
    companyId: newEmployee.companyId,
    firstName: newEmployee.firstName,
    lastName: newEmployee.lastName,
    tcNo: newEmployee.tcNo,
    photo: newEmployee.photo,
    birthPlace: newEmployee.birthPlace,
    birthDate: newEmployee.birthDate,
    gender: newEmployee.gender,
    nationality,
    serialNo: newEmployee.serialNo,
    phone: newEmployee.phone,
    email: newEmployee.email,
    department: newEmployee.department,
    educationLevel: newEmployee.educationLevel,
    maritalStatus: newEmployee.maritalStatus,
    address: newEmployee.address,
    title: newEmployee.title,
    hireDate: newEmployee.hireDate,
    iban: newEmployee.iban,
    emergencyContactName: newEmployee.emergencyContactName,
    emergencyContactPhone: newEmployee.emergencyContactPhone,
    bloodType: newEmployee.bloodType,
    chronicConditions: newEmployee.chronicConditions,
    workingHours: newEmployee.workingHours,
    shiftPlan: newEmployee.shiftPlan,
    foreignLanguage: newEmployee.foreignLanguage,
    militaryStatus: newEmployee.militaryStatus,
    driverLicense,
    criminalRecord: newEmployee.criminalRecord,
    retirementInfo: newEmployee.retirementInfo,
    scannedDocuments: newEmployee.scannedDocuments,
    tetanusVaccine: newEmployee.tetanusVaccine,
    hepatitisVaccine: newEmployee.hepatitisVaccine,
    allergies: newEmployee.allergies,
    notes: newEmployee.notes,
    isActive: true,
    trainingComplete: false,
    checklist,
    onboarding,
  };
}
