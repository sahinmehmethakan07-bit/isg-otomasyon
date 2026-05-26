import { createOnboardingFromChecklist, getDateStatus } from "./dashboardUtils";
import type {
  AccidentReportRecord,
  Company,
  CompanyVisitRecord,
  DocumentRecord,
  DofRecord,
  Employee,
  PpeRecord,
  RiskRecord,
  TaskItem,
  TrainingRecord,
} from "./types";

export type DashboardCard = {
  value: number;
  label: string;
  color: string;
};

export type QuickAction = {
  label: string;
  tab: string;
};

type DashboardOverviewInput = {
  activeRole?: string;
  companies: Company[];
  employees: Employee[];
  documents: DocumentRecord[];
  dofs: DofRecord[];
  risks: RiskRecord[];
  trainings: TrainingRecord[];
  ppeRecords: PpeRecord[];
  accidentReports: AccidentReportRecord[];
  companyVisits: CompanyVisitRecord[];
  taskItems: TaskItem[];
};

export function getDashboardOverview(input: DashboardOverviewInput) {
  const totalExpiredDocs = input.documents.filter(document => getDateStatus(document.expiryDate) === "Süresi Dolmuş").length;
  const totalSoonDocs = input.documents.filter(document => getDateStatus(document.expiryDate) === "Yaklaşıyor").length;
  const openDofs = input.dofs.filter(dof => dof.status !== "Çözüldü" && dof.status !== "Riske Aktarıldı").length;
  const highRisks = input.risks.filter(risk => risk.score >= 15).length;
  const incompleteEmployees = input.employees.filter(employee => !employee.trainingComplete).length;
  const criticalTasks = input.taskItems.filter(task => task.priority === "Kritik");
  const highPriorityTasks = input.taskItems.filter(task => task.priority === "Yüksek");
  const upcomingTrainings = input.trainings.filter(training => training.status === "Planlandı").length;
  const openAccidentReports = input.accidentReports.filter(report => report.status !== "Kapandı").length;
  const followUpVisits = input.companyVisits.filter(visit => visit.status === "Takip Gerekli" || visit.status === "Planlandı").length;
  const ek2PendingEmployees = input.employees.filter(employee => !(employee.onboarding || createOnboardingFromChecklist(employee.checklist)).tasks.doctorEk2.completed).length;
  const safetyPendingEmployees = input.employees.filter(employee => {
    const onboarding = employee.onboarding || createOnboardingFromChecklist(employee.checklist);
    return !onboarding.tasks.safetyTraining.completed || !onboarding.tasks.safetyDocuments.completed;
  }).length;
  const plannedCompanyVisits = input.companyVisits.filter(visit => visit.status === "Planlandı" || visit.status === "Takip Gerekli").length;

  const title = input.activeRole === "doctor"
    ? "Doktor Çalışma Alanı"
    : input.activeRole === "nurse"
      ? "Hemşire Çalışma Alanı"
      : input.activeRole === "safety_expert"
        ? "İş Güvenliği Uzmanı Çalışma Alanı"
        : input.activeRole === "human_resources"
          ? "İnsan Kaynakları Çalışma Alanı"
          : "Genel Yönetim Paneli";

  const subtitle = input.activeRole === "doctor"
    ? "EK-2 bekleyen personeller, açık olay takipleri ve sağlıkla ilgili kayıtlar öncelikli gösterilir."
    : input.activeRole === "nurse"
      ? "Personel sağlık hazırlıkları, eğitim/KKD kayıtları ve yaklaşan belgeler öne çıkarılır."
      : input.activeRole === "safety_expert"
        ? "Açık DÖF, yüksek risk, eğitim, plan ve saha ziyareti takipleri öncelikli gösterilir."
        : input.activeRole === "human_resources"
          ? "Personel girişleri ve onboarding eksikleri öne çıkarılır."
          : "Tüm firmalar, kritik görevler, riskler, belgeler ve operasyon kayıtları tek bakışta izlenir.";

  const cards: DashboardCard[] = input.activeRole === "doctor"
    ? [
      { value: ek2PendingEmployees, label: "EK-2 Bekleyen", color: ek2PendingEmployees > 0 ? "#d97706" : "#16a34a" },
      { value: openAccidentReports, label: "Açık Olay", color: openAccidentReports > 0 ? "#dc2626" : "#16a34a" },
      { value: input.employees.length, label: "Personel", color: "#a78bfa" },
      { value: totalSoonDocs, label: "Yaklaşan Belge", color: totalSoonDocs > 0 ? "#d97706" : "#16a34a" },
    ]
    : input.activeRole === "nurse"
      ? [
        { value: input.employees.length, label: "Personel", color: "#a78bfa" },
        { value: input.ppeRecords.length, label: "KKD Kaydı", color: "#16a34a" },
        { value: upcomingTrainings, label: "Planlı Eğitim", color: upcomingTrainings > 0 ? "#0ea5e9" : "#16a34a" },
        { value: totalSoonDocs, label: "Yaklaşan Belge", color: totalSoonDocs > 0 ? "#d97706" : "#16a34a" },
      ]
      : input.activeRole === "safety_expert"
        ? [
          { value: openDofs, label: "Açık DÖF", color: openDofs > 0 ? "#d97706" : "#16a34a" },
          { value: highRisks, label: "Yüksek Risk", color: highRisks > 0 ? "#dc2626" : "#16a34a" },
          { value: upcomingTrainings, label: "Planlı Eğitim", color: upcomingTrainings > 0 ? "#0ea5e9" : "#16a34a" },
          { value: plannedCompanyVisits, label: "Ziyaret Takibi", color: plannedCompanyVisits > 0 ? "#d97706" : "#16a34a" },
        ]
        : input.activeRole === "human_resources"
          ? [
            { value: input.employees.length, label: "Personel", color: "#a78bfa" },
            { value: incompleteEmployees, label: "Onboarding Eksik", color: incompleteEmployees > 0 ? "#d97706" : "#16a34a" },
            { value: ek2PendingEmployees, label: "EK-2 Bekleyen", color: ek2PendingEmployees > 0 ? "#d97706" : "#16a34a" },
            { value: safetyPendingEmployees, label: "İSG Evrak/Eğitim", color: safetyPendingEmployees > 0 ? "#d97706" : "#16a34a" },
          ]
          : [
            { value: input.companies.length, label: "Firma", color: "#38bdf8" },
            { value: input.employees.length, label: "Personel", color: "#a78bfa" },
            { value: criticalTasks.length, label: "Kritik Görev", color: criticalTasks.length > 0 ? "#dc2626" : "#16a34a" },
            { value: highPriorityTasks.length, label: "Yüksek Öncelik", color: highPriorityTasks.length > 0 ? "#d97706" : "#16a34a" },
            { value: totalExpiredDocs, label: "Süresi Dolmuş Belge", color: totalExpiredDocs > 0 ? "#dc2626" : "#16a34a" },
            { value: totalSoonDocs, label: "Yaklaşan Belge", color: totalSoonDocs > 0 ? "#d97706" : "#16a34a" },
            { value: openDofs, label: "Açık DÖF", color: openDofs > 0 ? "#d97706" : "#16a34a" },
            { value: highRisks, label: "Yüksek Risk (≥15)", color: highRisks > 0 ? "#dc2626" : "#16a34a" },
            { value: incompleteEmployees, label: "Eğitim Eksik", color: incompleteEmployees > 0 ? "#d97706" : "#16a34a" },
            { value: upcomingTrainings, label: "Planlı Eğitim", color: upcomingTrainings > 0 ? "#0ea5e9" : "#16a34a" },
            { value: openAccidentReports, label: "Açık Olay", color: openAccidentReports > 0 ? "#dc2626" : "#16a34a" },
            { value: followUpVisits, label: "Ziyaret Takibi", color: followUpVisits > 0 ? "#d97706" : "#16a34a" },
          ];

  const quickActions: QuickAction[] = input.activeRole === "doctor"
    ? [
      { label: "EK-2 Muayene", tab: "ek2muayene" },
      { label: "Personel Listesi", tab: "personel" },
      { label: "İş Kazası Takibi", tab: "is-kazasi-raporu" },
      { label: "Görevler", tab: "gorevler" },
    ]
    : input.activeRole === "nurse"
      ? [
        { label: "Personel Listesi", tab: "personel" },
        { label: "KKD Formu", tab: "kkd-formu" },
        { label: "Eğitimler", tab: "egitimler" },
        { label: "Belgeler", tab: "belgeler" },
      ]
      : input.activeRole === "safety_expert"
        ? [
          { label: "DÖF Oluştur", tab: "dof" },
          { label: "Risk Ekle", tab: "risk" },
          { label: "Eğitim Planla", tab: "egitimler" },
          { label: "Firma Ziyareti", tab: "firma-ziyaretleri" },
          { label: "Görevler", tab: "gorevler" },
        ]
        : [
          { label: "Yeni Personel", tab: "personel" },
          { label: "DÖF Oluştur", tab: "dof" },
          { label: "Risk Ekle", tab: "risk" },
          { label: "Eğitim Planla", tab: "egitimler" },
          { label: "Firma Ziyareti", tab: "firma-ziyaretleri" },
          { label: "Arşivi Aç", tab: "arsiv" },
        ];

  const roleTaskCategories = input.activeRole === "doctor"
    ? ["Personel", "Olay", "Belge"]
    : input.activeRole === "nurse"
      ? ["Personel", "Eğitim", "KKD", "Belge"]
      : input.activeRole === "safety_expert"
        ? ["DÖF", "Risk", "Eğitim", "Plan", "Ziyaret", "Olay"]
        : [];
  const topTasks = (roleTaskCategories.length > 0 ? input.taskItems.filter(task => roleTaskCategories.includes(task.category)) : input.taskItems).slice(0, 5);

  return {
    title,
    subtitle,
    cards,
    quickActions,
    topTasks,
    upcomingTrainings,
    openAccidentReports,
    followUpVisits,
  };
}
