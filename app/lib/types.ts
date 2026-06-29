export type DangerClass = "Az Tehlikeli" | "Tehlikeli" | "Çok Tehlikeli";
export type ServiceType = "İş Güvenliği" | "İş Güvenliği + İşyeri Hekimliği";

export type Company = {
  id: string;
  nickName: string;
  officialName: string;
  sgkSicil: string;
  naceCode: string;
  dangerClass: DangerClass;
  employeeCount: number;
  contractEnd: string;
  serviceType: ServiceType;
  contactEmail?: string;
};

export type EmployeeChecklist = {
  isgCertificateDate: string;
  ek2Date: string;
  orientationDate: string;
  preTest: boolean;
  postTest: boolean;
  undertaking: boolean;
  kkdMinutes: boolean;
  attendanceDoc: boolean;
};

export type OnboardingTaskKey = "doctorEk2" | "safetyTraining" | "safetyDocuments";
export type OnboardingStatus = "pending" | "completed";

export type OnboardingTask = {
  key: OnboardingTaskKey;
  label: string;
  ownerRole: "doctor" | "safety_expert";
  completed: boolean;
  completedAt?: string;
};

export type EmployeeOnboarding = {
  status: OnboardingStatus;
  tasks: Record<OnboardingTaskKey, OnboardingTask>;
  missingSteps: string[];
};

export type Employee = {
  id: string;
  companyId: string;
  firstName: string;
  lastName: string;
  tcNo: string;
  photo?: string;
  birthPlace?: string;
  birthDate?: string;
  gender?: string;
  nationality?: string;
  serialNo?: string;
  phone?: string;
  email?: string;
  department?: string;
  educationLevel?: string;
  maritalStatus?: string;
  address?: string;
  title: string;
  hireDate: string;
  iban?: string;
  emergencyContactName?: string;
  emergencyContactPhone?: string;
  bloodType?: string;
  chronicDisease?: string;
  chronicConditions?: string;
  workingHours?: string;
  shiftPlan?: string;
  foreignLanguage?: string;
  militaryStatus?: string;
  driverLicense?: string;
  criminalRecord?: string;
  retirementInfo?: string;
  scannedDocuments?: EmployeeScannedDocument[];
  tetanusVaccine?: string;
  hepatitisVaccine?: string;
  allergies?: string;
  notes?: string;
  isActive: boolean;
  trainingComplete: boolean;
  checklist: EmployeeChecklist;
  onboarding?: EmployeeOnboarding;
};

export type EmployeeScannedDocument = {
  id: string;
  name: string;
  type: string;
  data: string;
  uploadedAt: string;
};

export type NewEmployeeForm = {
  companyId: string;
  firstName: string;
  lastName: string;
  tcNo: string;
  photo: string;
  birthPlace: string;
  birthDate: string;
  gender: string;
  nationality: string;
  nationalityOther: string;
  serialNo: string;
  phone: string;
  email: string;
  department: string;
  educationLevel: string;
  maritalStatus: string;
  address: string;
  title: string;
  hireDate: string;
  iban: string;
  emergencyContactName: string;
  emergencyContactPhone: string;
  bloodType: string;
  chronicConditions: string;
  workingHours: string;
  shiftPlan: string;
  foreignLanguage: string;
  militaryStatus: string;
  driverLicense: string;
  driverLicenseClass: string;
  criminalRecord: string;
  retirementInfo: string;
  scannedDocuments: EmployeeScannedDocument[];
  tetanusVaccine: string;
  hepatitisVaccine: string;
  allergies: string;
  notes: string;
};

export type DocumentRecord = {
  id: string;
  companyId: string;
  employeeId: string | null;
  type: string;
  issueDate: string;
  expiryDate: string;
};

export type Observer = {
  id: string;
  fullName: string;
  title: string;
  certificateNo: string;
  phone: string;
};

export type DofRecord = {
  id: string;
  companyId: string;
  observerId: string;
  title: string;
  description: string;
  lawReference: string;
  priority: "Düşük" | "Orta" | "Yüksek";
  responsible: string;
  dueDate: string;
  status: "Açık" | "Bildirildi" | "Önlem Alındı" | "Çözüldü" | "Riske Aktarıldı";
  location: string;
  beforePhoto?: string;
  afterPhoto?: string;
  affectedPersons?: string;
};

export type SignerRole = "İş Güvenliği Uzmanı" | "İşveren / İşveren Vekili" | "Çalışan Temsilcisi";

export type EmailSettings = {
  enabled: boolean;
  toEmail: string;
  ccEmail: string;
  doctorEmail?: string;
  safetyExpertEmail?: string;
  subject: string;
  message: string;
};

export type Signer = {
  id: string;
  companyId: string;
  role: SignerRole;
  fullName: string;
};

export type RiskRecord = {
  id: string;
  companyId: string;
  sourceDofId: string | null;
  section: string;
  hazard: string;
  risk: string;
  currentMeasure: string;
  actionToTake: string;
  probability: number;
  severity: number;
  score: number;
  residualProbability: number;
  residualSeverity: number;
  residualScore: number;
  responsible: string;
  dueDate: string;
  status: "Açık" | "Kontrol Altında" | "Kapandı";
  affectedPersons?: string;
  lawReference?: string;
  controlDate?: string;
};

export type AnnualPlanType = "Eğitim" | "Muayene" | "Risk Değerlendirme" | "Acil Durum Tatbikatı" | "Kurul Toplantısı" | "Saha Ziyareti" | "Belge Yenileme";
export type AnnualPlanStatus = "Planlandı" | "Devam Ediyor" | "Tamamlandı" | "Gecikti";

export type AnnualPlanRecord = {
  id: string;
  companyId: string;
  year: number;
  type: AnnualPlanType;
  title: string;
  plannedDate: string;
  responsible: string;
  status: AnnualPlanStatus;
  notes: string;
};

export type TrainingType = "Temel İSG Eğitimi" | "İşe Giriş Eğitimi" | "Yenileme Eğitimi" | "Acil Durum Eğitimi" | "KKD Eğitimi" | "Hijyen Eğitimi";
export type TrainingStatus = "Planlandı" | "Tamamlandı" | "İptal";

export type TrainingRecord = {
  id: string;
  companyId: string;
  title: string;
  type: TrainingType;
  trainingDate: string;
  durationHours?: string;
  location?: string;
  trainer: string;
  participantIds: string[];
  status: TrainingStatus;
  notes: string;
};

export type PpeStatus = "Teslim Edildi" | "İade Edildi" | "Hasarlı / Kayıp";

export type PpeRecord = {
  id: string;
  companyId: string;
  employeeId: string;
  equipment: string;
  quantity: number;
  issueDate: string;
  returnDate?: string;
  status: PpeStatus;
  serialNo?: string;
  notes: string;
};

export type EmergencyPlanStatus = "Taslak" | "Yürürlükte" | "Tatbikat Planlandı" | "Güncelleme Gerekli";

export type EmergencyPlanRecord = {
  id: string;
  companyId: string;
  title: string;
  scenario: string;
  assemblyArea: string;
  emergencyTeam: string;
  responsible: string;
  planDate: string;
  drillDate?: string;
  status: EmergencyPlanStatus;
  notes: string;
};

export type CommitteeMeetingStatus = "Planlandı" | "Yapıldı" | "Ertelendi" | "Kararlar Takipte";

export type CommitteeMeetingRecord = {
  id: string;
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

export type AccidentReportStatus = "Açık" | "İncelemede" | "Aksiyon Planlandı" | "Kapandı";
export type AccidentSeverity = "Ramak Kala" | "Hafif" | "Orta" | "Ağır";

export type AccidentReportRecord = {
  id: string;
  companyId: string;
  employeeId: string;
  accidentDate: string;
  location: string;
  severity: AccidentSeverity;
  incidentType: string;
  description: string;
  rootCause: string;
  actionPlan: string;
  responsible: string;
  dueDate?: string;
  status: AccidentReportStatus;
  notes: string;
};

export type CompanyVisitStatus = "Planlandı" | "Tamamlandı" | "Ertelendi" | "Takip Gerekli";
export type CompanyVisitPurpose = "Rutin Ziyaret" | "Risk Kontrolü" | "Eğitim / Bilgilendirme" | "DÖF Takibi" | "Acil Ziyaret";

export type CompanyVisitRecord = {
  id: string;
  companyId: string;
  visitDate: string;
  purpose: CompanyVisitPurpose;
  visitor: string;
  contactedPerson: string;
  findings: string;
  actions: string;
  nextVisitDate?: string;
  status: CompanyVisitStatus;
  notes: string;
};

export type ArchiveItem = {
  id: string;
  companyId: string;
  type: string;
  title: string;
  owner: string;
  date: string;
  status: string;
  sourceTab: string;
};

export type TaskPriority = "Kritik" | "Yüksek" | "Orta" | "Düşük";
export type TaskEscalation = "Gecikti" | "Acil" | "Yakında" | "İzlemede" | "Planlı" | "Tarihsiz";

export type TaskItem = {
  id: string;
  companyId: string;
  title: string;
  detail: string;
  owner: string;
  dueDate: string;
  priority: TaskPriority;
  escalationLevel?: TaskEscalation;
  escalationLabel?: string;
  daysRemaining?: number | null;
  sourceTab: string;
  category: string;
};
