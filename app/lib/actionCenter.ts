import type { Company, TaskEscalation, TaskItem, TaskPriority } from "./types";

export type ActionCenterMetric = {
  label: string;
  value: number;
  color: string;
};

export type ActionCenterItem = TaskItem & {
  companyName: string;
  urgencyColor: string;
  sortScore: number;
};

const PRIORITY_WEIGHT: Record<TaskPriority, number> = {
  Kritik: 0,
  Yüksek: 1,
  Orta: 2,
  Düşük: 3,
};

const ESCALATION_WEIGHT: Record<TaskEscalation, number> = {
  Gecikti: 0,
  Acil: 1,
  Yakında: 2,
  İzlemede: 3,
  Planlı: 4,
  Tarihsiz: 5,
};

const ESCALATION_COLOR: Record<TaskEscalation, string> = {
  Gecikti: "#C0392B",
  Acil: "#C0392B",
  Yakında: "#D4A017",
  İzlemede: "#0ea5e9",
  Planlı: "#2D6A4F",
  Tarihsiz: "#6b7280",
};

const ACTIONABLE_ESCALATIONS = new Set<TaskEscalation>(["Gecikti", "Acil", "Yakında", "İzlemede"]);
const ACTIONABLE_PRIORITIES = new Set<TaskPriority>(["Kritik", "Yüksek"]);

export function getPriorityColor(priority: TaskPriority) {
  if (priority === "Kritik") return "#C0392B";
  if (priority === "Yüksek") return "#D4A017";
  if (priority === "Orta") return "#1B4332";
  return "#2D6A4F";
}

export function getEscalationColor(escalation?: TaskEscalation) {
  return ESCALATION_COLOR[escalation || "Tarihsiz"];
}

export function buildActionCenterItems(tasks: TaskItem[], companies: Company[]) {
  return tasks
    .filter(task => {
      const escalation = task.escalationLevel || "Tarihsiz";
      return ACTIONABLE_ESCALATIONS.has(escalation) || ACTIONABLE_PRIORITIES.has(task.priority);
    })
    .map<ActionCenterItem>(task => {
      const escalation = task.escalationLevel || "Tarihsiz";
      const companyName = companies.find(company => company.id === task.companyId)?.nickName || "Firma";
      const dateScore = task.daysRemaining === null || task.daysRemaining === undefined
        ? 90
        : Math.max(-30, Math.min(90, task.daysRemaining));
      const sortScore = ESCALATION_WEIGHT[escalation] * 100 + PRIORITY_WEIGHT[task.priority] * 10 + dateScore;
      return {
        ...task,
        companyName,
        urgencyColor: getEscalationColor(escalation),
        sortScore,
      };
    })
    .sort((a, b) => {
      if (a.sortScore !== b.sortScore) return a.sortScore - b.sortScore;
      return (a.dueDate || "9999-12-31").localeCompare(b.dueDate || "9999-12-31");
    });
}

export function getActionCenterMetrics(items: ActionCenterItem[]): ActionCenterMetric[] {
  const overdue = items.filter(item => item.escalationLevel === "Gecikti").length;
  const urgent = items.filter(item => item.escalationLevel === "Acil").length;
  const upcoming = items.filter(item => item.escalationLevel === "Yakında" || item.escalationLevel === "İzlemede").length;
  const highRisk = items.filter(item => item.priority === "Kritik" || item.priority === "Yüksek").length;

  return [
    { label: "Geciken", value: overdue, color: "#C0392B" },
    { label: "Bugün/Yarın", value: urgent, color: "#C0392B" },
    { label: "30 Gün İçinde", value: upcoming, color: "#D4A017" },
    { label: "Kritik/Yüksek", value: highRisk, color: "#7c3aed" },
  ];
}

export function getActionCenterHealth(items: ActionCenterItem[]) {
  if (items.some(item => item.escalationLevel === "Gecikti" || item.priority === "Kritik")) {
    return { label: "Müdahale gerekli", color: "#C0392B" };
  }
  if (items.some(item => item.escalationLevel === "Acil" || item.priority === "Yüksek")) {
    return { label: "Yakın takip", color: "#D4A017" };
  }
  if (items.length > 0) return { label: "İzlemede", color: "#0ea5e9" };
  return { label: "Temiz", color: "#2D6A4F" };
}
