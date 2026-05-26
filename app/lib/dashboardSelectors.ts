import { requiredCompanyDocs } from "./constants";
import { createOnboardingFromChecklist, getDateStatus } from "./dashboardUtils";
import type {
  AccidentReportRecord,
  AnnualPlanRecord,
  ArchiveItem,
  CommitteeMeetingRecord,
  Company,
  CompanyVisitRecord,
  DocumentRecord,
  DofRecord,
  EmergencyPlanRecord,
  Employee,
  PpeRecord,
  RiskRecord,
  TaskItem,
  TaskPriority,
  TrainingRecord,
} from "./types";

export function matchesSearch(parts: Array<string | number | undefined | null>, search: string) {
  return parts.join(" ").toLowerCase().includes(search.toLowerCase());
}

export function filterCompanies(companies: Company[], search: string) {
  return companies.filter(company => matchesSearch([company.nickName, company.officialName, company.sgkSicil, company.naceCode], search));
}

export function filterEmployees(employees: Employee[], companies: Company[], selectedCompanyId: string, search: string) {
  return employees.filter(employee => {
    const company = companies.find(c => c.id === employee.companyId);
    const matchesCompany = selectedCompanyId === "all" || employee.companyId === selectedCompanyId;
    return matchesCompany && matchesSearch([
      employee.firstName,
      employee.lastName,
      employee.tcNo,
      employee.phone,
      employee.email,
      employee.department,
      employee.educationLevel,
      employee.address,
      employee.title,
      employee.workingHours,
      employee.shiftPlan,
      employee.foreignLanguage,
      company?.nickName,
    ], search);
  });
}

export function filterDocuments(documents: DocumentRecord[], companies: Company[], employees: Employee[], selectedCompanyId: string, search: string) {
  return documents.filter(document => {
    const company = companies.find(c => c.id === document.companyId);
    const employee = employees.find(e => e.id === document.employeeId);
    const matchesCompany = selectedCompanyId === "all" || document.companyId === selectedCompanyId;
    return matchesCompany && matchesSearch([document.type, company?.nickName, employee?.firstName, employee?.lastName], search);
  });
}

export function filterDofs(dofs: DofRecord[], companies: Company[], selectedCompanyId: string, search: string) {
  return dofs.filter(dof => {
    const company = companies.find(c => c.id === dof.companyId);
    const matchesCompany = selectedCompanyId === "all" || dof.companyId === selectedCompanyId;
    return matchesCompany && matchesSearch([dof.title, dof.description, dof.location, company?.nickName], search);
  });
}

export function filterRisks(risks: RiskRecord[], companies: Company[], selectedCompanyId: string, search: string) {
  return risks.filter(risk => {
    const company = companies.find(c => c.id === risk.companyId);
    const matchesCompany = selectedCompanyId === "all" || risk.companyId === selectedCompanyId;
    return matchesCompany && matchesSearch([risk.section, risk.hazard, risk.risk, risk.actionToTake, company?.nickName], search);
  });
}

export function filterAnnualPlans(annualPlans: AnnualPlanRecord[], companies: Company[], selectedCompanyId: string, search: string) {
  return annualPlans.filter(plan => {
    const company = companies.find(c => c.id === plan.companyId);
    const matchesCompany = selectedCompanyId === "all" || plan.companyId === selectedCompanyId;
    return matchesCompany && matchesSearch([plan.year, plan.type, plan.title, plan.responsible, plan.status, plan.notes, company?.nickName], search);
  });
}

export function filterTrainings(trainings: TrainingRecord[], companies: Company[], employees: Employee[], selectedCompanyId: string, search: string) {
  return trainings.filter(training => {
    const company = companies.find(c => c.id === training.companyId);
    const participantNames = training.participantIds
      .map(id => employees.find(e => e.id === id))
      .filter(Boolean)
      .map(employee => `${employee!.firstName} ${employee!.lastName}`)
      .join(" ");
    const matchesCompany = selectedCompanyId === "all" || training.companyId === selectedCompanyId;
    return matchesCompany && matchesSearch([training.title, training.type, training.trainer, training.status, training.notes, participantNames, company?.nickName], search);
  });
}

export function filterPpeRecords(ppeRecords: PpeRecord[], companies: Company[], employees: Employee[], selectedCompanyId: string, search: string) {
  return ppeRecords.filter(record => {
    const company = companies.find(c => c.id === record.companyId);
    const employee = employees.find(e => e.id === record.employeeId);
    const matchesCompany = selectedCompanyId === "all" || record.companyId === selectedCompanyId;
    return matchesCompany && matchesSearch([record.equipment, record.status, record.serialNo, record.notes, company?.nickName, employee?.firstName, employee?.lastName, employee?.tcNo], search);
  });
}

export function filterEmergencyPlans(emergencyPlans: EmergencyPlanRecord[], companies: Company[], selectedCompanyId: string, search: string) {
  return emergencyPlans.filter(plan => {
    const company = companies.find(c => c.id === plan.companyId);
    const matchesCompany = selectedCompanyId === "all" || plan.companyId === selectedCompanyId;
    return matchesCompany && matchesSearch([plan.title, plan.scenario, plan.assemblyArea, plan.emergencyTeam, plan.responsible, plan.status, plan.notes, company?.nickName], search);
  });
}

export function filterCommitteeMeetings(committeeMeetings: CommitteeMeetingRecord[], companies: Company[], employees: Employee[], selectedCompanyId: string, search: string) {
  return committeeMeetings.filter(meeting => {
    const company = companies.find(c => c.id === meeting.companyId);
    const participantNames = meeting.participantIds
      .map(id => employees.find(e => e.id === id))
      .filter(Boolean)
      .map(employee => `${employee!.firstName} ${employee!.lastName}`)
      .join(" ");
    const matchesCompany = selectedCompanyId === "all" || meeting.companyId === selectedCompanyId;
    return matchesCompany && matchesSearch([meeting.meetingNo, meeting.location, meeting.chairperson, meeting.agenda, meeting.decisions, meeting.status, meeting.notes, participantNames, company?.nickName], search);
  });
}

export function filterAccidentReports(accidentReports: AccidentReportRecord[], companies: Company[], employees: Employee[], selectedCompanyId: string, search: string) {
  return accidentReports.filter(report => {
    const company = companies.find(c => c.id === report.companyId);
    const employee = employees.find(e => e.id === report.employeeId);
    const matchesCompany = selectedCompanyId === "all" || report.companyId === selectedCompanyId;
    return matchesCompany && matchesSearch([report.incidentType, report.location, report.severity, report.description, report.rootCause, report.actionPlan, report.responsible, report.status, report.notes, company?.nickName, employee?.firstName, employee?.lastName], search);
  });
}

export function filterCompanyVisits(companyVisits: CompanyVisitRecord[], companies: Company[], selectedCompanyId: string, search: string) {
  return companyVisits.filter(visit => {
    const company = companies.find(c => c.id === visit.companyId);
    const matchesCompany = selectedCompanyId === "all" || visit.companyId === selectedCompanyId;
    return matchesCompany && matchesSearch([visit.purpose, visit.visitor, visit.contactedPerson, visit.findings, visit.actions, visit.status, visit.notes, company?.nickName, company?.officialName], search);
  });
}

type ArchiveInput = {
  documents: DocumentRecord[];
  annualPlans: AnnualPlanRecord[];
  trainings: TrainingRecord[];
  ppeRecords: PpeRecord[];
  emergencyPlans: EmergencyPlanRecord[];
  committeeMeetings: CommitteeMeetingRecord[];
  accidentReports: AccidentReportRecord[];
  companyVisits: CompanyVisitRecord[];
  dofs: DofRecord[];
  risks: RiskRecord[];
  employees: Employee[];
};

export function buildArchiveItems(input: ArchiveInput): ArchiveItem[] {
  const employeeName = (employeeId?: string | null) => {
    const employee = input.employees.find(e => e.id === employeeId);
    return employee ? `${employee.firstName} ${employee.lastName}` : "Firma";
  };

  return [
    ...input.documents.map(item => ({
      id: item.id,
      companyId: item.companyId,
      type: "Belge",
      title: item.type,
      owner: employeeName(item.employeeId),
      date: item.issueDate || item.expiryDate || "",
      status: item.expiryDate ? getDateStatus(item.expiryDate) : "Arşivde",
      sourceTab: "belgeler",
    })),
    ...input.annualPlans.map(item => ({
      id: item.id,
      companyId: item.companyId,
      type: "Yıllık Plan",
      title: `${item.year} - ${item.title || item.type}`,
      owner: item.responsible || "Firma",
      date: item.plannedDate,
      status: item.status,
      sourceTab: "yillik-planlar",
    })),
    ...input.trainings.map(item => ({
      id: item.id,
      companyId: item.companyId,
      type: "Eğitim",
      title: item.title || item.type,
      owner: item.trainer || "Eğitmen girilmedi",
      date: item.trainingDate,
      status: item.status,
      sourceTab: "egitimler",
    })),
    ...input.ppeRecords.map(item => ({
      id: item.id,
      companyId: item.companyId,
      type: "KKD",
      title: item.equipment,
      owner: employeeName(item.employeeId),
      date: item.issueDate,
      status: item.status,
      sourceTab: "kkd-formu",
    })),
    ...input.emergencyPlans.map(item => ({
      id: item.id,
      companyId: item.companyId,
      type: "Acil Durum",
      title: item.title,
      owner: item.responsible || "Firma",
      date: item.planDate,
      status: item.status,
      sourceTab: "acil-durum-plani",
    })),
    ...input.committeeMeetings.map(item => ({
      id: item.id,
      companyId: item.companyId,
      type: "Kurul",
      title: item.meetingNo || "Kurul Toplantısı",
      owner: item.chairperson || "Kurul",
      date: item.meetingDate,
      status: item.status,
      sourceTab: "kurul-toplantisi",
    })),
    ...input.accidentReports.map(item => ({
      id: item.id,
      companyId: item.companyId,
      type: "İş Kazası",
      title: item.incidentType,
      owner: employeeName(item.employeeId),
      date: item.accidentDate,
      status: item.status,
      sourceTab: "is-kazasi-raporu",
    })),
    ...input.companyVisits.map(item => ({
      id: item.id,
      companyId: item.companyId,
      type: "Firma Ziyareti",
      title: item.purpose,
      owner: item.visitor || "Ziyaretçi girilmedi",
      date: item.visitDate,
      status: item.status,
      sourceTab: "firma-ziyaretleri",
    })),
    ...input.dofs.map(item => ({
      id: item.id,
      companyId: item.companyId,
      type: "DÖF",
      title: item.title,
      owner: item.responsible || "Sorumlu girilmedi",
      date: item.dueDate,
      status: item.status,
      sourceTab: "dof",
    })),
    ...input.risks.map(item => ({
      id: item.id,
      companyId: item.companyId,
      type: "Risk",
      title: item.hazard,
      owner: item.responsible || "Sorumlu girilmedi",
      date: item.dueDate || item.controlDate || "",
      status: item.status,
      sourceTab: "risk",
    })),
  ].sort((a, b) => (b.date || "").localeCompare(a.date || ""));
}

export function filterArchiveItems(archiveItems: ArchiveItem[], companies: Company[], selectedCompanyId: string, search: string, archiveTypeFilter: string, archiveStatusFilter: string, archiveDateFrom: string, archiveDateTo: string) {
  return archiveItems.filter(item => {
    const company = companies.find(c => c.id === item.companyId);
    const matchesCompany = selectedCompanyId === "all" || item.companyId === selectedCompanyId;
    const matchesType = archiveTypeFilter === "all" || item.type === archiveTypeFilter;
    const matchesStatus = archiveStatusFilter === "all" || item.status === archiveStatusFilter;
    const matchesDateFrom = !archiveDateFrom || (!!item.date && item.date >= archiveDateFrom);
    const matchesDateTo = !archiveDateTo || (!!item.date && item.date <= archiveDateTo);
    const matchesQuery = matchesSearch([item.type, item.title, item.owner, item.status, company?.nickName, company?.officialName], search);
    return matchesCompany && matchesType && matchesStatus && matchesDateFrom && matchesDateTo && matchesQuery;
  });
}

type TaskInput = Omit<ArchiveInput, "ppeRecords" | "emergencyPlans" | "committeeMeetings"> & {
  companies: Company[];
  activeRole?: string;
};

export function buildTaskItems(input: TaskInput): TaskItem[] {
  const items: TaskItem[] = [];
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const soonLimit = new Date(today);
  soonLimit.setDate(soonLimit.getDate() + 30);
  const isPast = (date?: string) => !!date && new Date(date) < today;
  const isSoon = (date?: string) => !!date && new Date(date) <= soonLimit;
  const companyName = (companyId: string) => input.companies.find(c => c.id === companyId)?.nickName || "Firma";
  const employeeName = (employeeId?: string | null) => {
    const employee = input.employees.find(e => e.id === employeeId);
    return employee ? `${employee.firstName} ${employee.lastName}` : "";
  };

  input.documents.forEach(document => {
    if (!document.expiryDate || !isSoon(document.expiryDate)) return;
    const expired = isPast(document.expiryDate);
    items.push({
      id: `document-${document.id}`,
      companyId: document.companyId,
      title: expired ? "Süresi dolmuş belge" : "Yaklaşan belge yenileme",
      detail: `${document.type} · ${employeeName(document.employeeId) || companyName(document.companyId)}`,
      owner: "Belge sorumlusu",
      dueDate: document.expiryDate,
      priority: expired ? "Kritik" : "Yüksek",
      sourceTab: "belgeler",
      category: "Belge",
    });
  });

  input.employees.forEach(employee => {
    const onboarding = employee.onboarding || createOnboardingFromChecklist(employee.checklist);
    if (onboarding.status === "completed") return;
    const missingTasks = Object.values(onboarding.tasks).filter(task => !task.completed);
    const roleTasks = input.activeRole === "doctor"
      ? missingTasks.filter(task => task.ownerRole === "doctor")
      : input.activeRole === "safety_expert"
        ? missingTasks.filter(task => task.ownerRole === "safety_expert")
        : missingTasks;
    if (roleTasks.length === 0) return;
    items.push({
      id: `employee-${employee.id}`,
      companyId: employee.companyId,
      title: "Personel onboarding eksik",
      detail: `${employee.firstName} ${employee.lastName} · ${roleTasks.map(task => task.label).join(", ")}`,
      owner: input.activeRole === "doctor" ? "Doktor" : input.activeRole === "safety_expert" ? "İş Güvenliği Uzmanı" : "Sorumlu ekip",
      dueDate: employee.hireDate,
      priority: "Yüksek",
      sourceTab: input.activeRole === "doctor" ? "ek2muayene" : "personel",
      category: "Personel",
    });
  });

  input.dofs.forEach(dof => {
    if (dof.status === "Çözüldü" || dof.status === "Riske Aktarıldı") return;
    items.push({
      id: `dof-${dof.id}`,
      companyId: dof.companyId,
      title: dof.status === "Önlem Alındı" ? "DÖF riske aktarılmalı" : "Açık DÖF takibi",
      detail: `${dof.title} · ${dof.location || "Konum yok"}`,
      owner: dof.responsible || "Sorumlu girilmedi",
      dueDate: dof.dueDate,
      priority: isPast(dof.dueDate) ? "Kritik" : dof.priority === "Yüksek" ? "Yüksek" : "Orta",
      sourceTab: "dof",
      category: "DÖF",
    });
  });

  input.risks.forEach(risk => {
    if (risk.status === "Kapandı") return;
    if (risk.score < 15 && !isPast(risk.dueDate)) return;
    items.push({
      id: `risk-${risk.id}`,
      companyId: risk.companyId,
      title: risk.score >= 15 ? "Yüksek risk aksiyonu" : "Geciken risk aksiyonu",
      detail: `${risk.hazard} · Skor ${risk.score}`,
      owner: risk.responsible || "Sorumlu girilmedi",
      dueDate: risk.dueDate || risk.controlDate || "",
      priority: risk.score >= 15 || isPast(risk.dueDate) ? "Kritik" : "Yüksek",
      sourceTab: "risk",
      category: "Risk",
    });
  });

  input.trainings.forEach(training => {
    if (training.status !== "Planlandı" || !isSoon(training.trainingDate)) return;
    items.push({
      id: `training-${training.id}`,
      companyId: training.companyId,
      title: "Planlanan eğitim",
      detail: `${training.title || training.type} · ${training.participantIds.length} katılımcı`,
      owner: training.trainer || "Eğitmen girilmedi",
      dueDate: training.trainingDate,
      priority: isPast(training.trainingDate) ? "Kritik" : "Orta",
      sourceTab: "egitimler",
      category: "Eğitim",
    });
  });

  input.annualPlans.forEach(plan => {
    if (plan.status === "Tamamlandı") return;
    if (plan.status !== "Gecikti" && !isSoon(plan.plannedDate)) return;
    items.push({
      id: `annual-${plan.id}`,
      companyId: plan.companyId,
      title: plan.status === "Gecikti" || isPast(plan.plannedDate) ? "Geciken yıllık plan" : "Yaklaşan yıllık plan",
      detail: `${plan.type} · ${plan.title}`,
      owner: plan.responsible || "Sorumlu girilmedi",
      dueDate: plan.plannedDate,
      priority: plan.status === "Gecikti" || isPast(plan.plannedDate) ? "Kritik" : "Orta",
      sourceTab: "yillik-planlar",
      category: "Plan",
    });
  });

  input.accidentReports.forEach(report => {
    if (report.status === "Kapandı") return;
    items.push({
      id: `accident-${report.id}`,
      companyId: report.companyId,
      title: "İş kazası / ramak kala takibi",
      detail: `${report.incidentType} · ${employeeName(report.employeeId) || report.location || "Detay bekliyor"}`,
      owner: report.responsible || "Sorumlu girilmedi",
      dueDate: report.dueDate || report.accidentDate,
      priority: report.severity === "Ağır" ? "Kritik" : report.severity === "Orta" ? "Yüksek" : "Orta",
      sourceTab: "is-kazasi-raporu",
      category: "Olay",
    });
  });

  input.companyVisits.forEach(visit => {
    if (visit.status === "Tamamlandı" && !isSoon(visit.nextVisitDate)) return;
    if (visit.status === "Planlandı" || visit.status === "Takip Gerekli" || isSoon(visit.nextVisitDate)) {
      items.push({
        id: `visit-${visit.id}`,
        companyId: visit.companyId,
        title: visit.status === "Takip Gerekli" ? "Ziyaret sonrası takip" : "Firma ziyareti",
        detail: `${visit.purpose} · ${visit.findings || visit.actions || "Plan detayı bekliyor"}`,
        owner: visit.visitor || "Ziyaretçi girilmedi",
        dueDate: visit.nextVisitDate || visit.visitDate,
        priority: visit.status === "Takip Gerekli" ? "Yüksek" : isPast(visit.visitDate) && visit.status !== "Tamamlandı" ? "Kritik" : "Düşük",
        sourceTab: "firma-ziyaretleri",
        category: "Ziyaret",
      });
    }
  });

  return items.sort((a, b) => {
    const priorityWeight: Record<TaskPriority, number> = { Kritik: 0, Yüksek: 1, Orta: 2, Düşük: 3 };
    const byPriority = priorityWeight[a.priority] - priorityWeight[b.priority];
    if (byPriority !== 0) return byPriority;
    return (a.dueDate || "9999-12-31").localeCompare(b.dueDate || "9999-12-31");
  });
}

export function filterTaskItems(taskItems: TaskItem[], companies: Company[], selectedCompanyId: string, search: string) {
  return taskItems.filter(task => {
    const company = companies.find(c => c.id === task.companyId);
    const matchesCompany = selectedCompanyId === "all" || task.companyId === selectedCompanyId;
    return matchesCompany && matchesSearch([task.category, task.title, task.detail, task.owner, task.priority, company?.nickName, company?.officialName], search);
  });
}

export function getCompanyDocuments(documents: DocumentRecord[], companyId: string) {
  return documents.filter(document => document.companyId === companyId && document.employeeId === null);
}

export function getCompanyDocSummary(documents: DocumentRecord[], companyId: string) {
  const companyDocs = getCompanyDocuments(documents, companyId);
  const missingCount = requiredCompanyDocs.filter(type => !companyDocs.some(document => document.type === type)).length;
  const expiredCount = companyDocs.filter(document => getDateStatus(document.expiryDate) === "Süresi Dolmuş").length;
  const soonCount = companyDocs.filter(document => getDateStatus(document.expiryDate) === "Yaklaşıyor").length;
  return { missingCount, expiredCount, soonCount };
}

export function getCompanyIndicator(documents: DocumentRecord[], companyId: string) {
  const summary = getCompanyDocSummary(documents, companyId);
  if (summary.missingCount > 0 || summary.expiredCount > 0) return { text: "Kritik", color: "#dc2626" };
  if (summary.soonCount > 0) return { text: "Yaklaşıyor", color: "#d97706" };
  return { text: "Uygun", color: "#16a34a" };
}
