import type { Company, TaskEscalation, TaskItem, TaskPriority } from "./types";

export type NotificationSeverity = "Kritik" | "Yüksek" | "Normal";
export type NotificationChannel = "E-posta Hazır" | "Manuel Takip";

export type NotificationItem = {
  id: string;
  task: TaskItem;
  companyName: string;
  recipient: string;
  channel: NotificationChannel;
  severity: NotificationSeverity;
  title: string;
  message: string;
  sendWindow: string;
  sortScore: number;
};

export type NotificationSummary = {
  items: NotificationItem[];
  overdue: number;
  dueToday: number;
  emailReady: number;
  critical: number;
};

const ESCALATION_WEIGHT: Record<TaskEscalation, number> = {
  Gecikti: 0,
  Acil: 1,
  Yakında: 2,
  İzlemede: 3,
  Planlı: 4,
  Tarihsiz: 5,
};

const PRIORITY_WEIGHT: Record<TaskPriority, number> = {
  Kritik: 0,
  Yüksek: 1,
  Orta: 2,
  Düşük: 3,
};

function getSeverity(task: TaskItem): NotificationSeverity {
  if (task.priority === "Kritik" || task.escalationLevel === "Gecikti") return "Kritik";
  if (task.priority === "Yüksek" || task.escalationLevel === "Acil" || task.escalationLevel === "Yakında") return "Yüksek";
  return "Normal";
}

function getSendWindow(task: TaskItem) {
  if (task.escalationLevel === "Gecikti") return "Hemen";
  if (task.escalationLevel === "Acil") return "Bugün";
  if (task.escalationLevel === "Yakında") return "Bu hafta";
  if (task.escalationLevel === "İzlemede") return "30 gün içinde";
  return "Planlı takip";
}

function shouldNotify(task: TaskItem) {
  if (task.escalationLevel === "Planlı" || task.escalationLevel === "Tarihsiz") {
    return task.priority === "Kritik" || task.priority === "Yüksek";
  }
  return true;
}

export function buildNotificationCenter(taskItems: TaskItem[], companies: Company[]): NotificationSummary {
  const items = taskItems
    .filter(shouldNotify)
    .map<NotificationItem>(task => {
      const company = companies.find(item => item.id === task.companyId);
      const escalation = task.escalationLevel || "Tarihsiz";
      const severity = getSeverity(task);
      const recipient = company?.contactEmail || task.owner || "Sorumlu girilmedi";
      const channel: NotificationChannel = company?.contactEmail ? "E-posta Hazır" : "Manuel Takip";
      const companyName = company?.nickName || "Firma";
      const sendWindow = getSendWindow(task);
      const sortScore =
        ESCALATION_WEIGHT[escalation] * 100 +
        PRIORITY_WEIGHT[task.priority] * 10 +
        Math.max(-30, Math.min(90, task.daysRemaining ?? 90));

      return {
        id: `notification-${task.id}`,
        task,
        companyName,
        recipient,
        channel,
        severity,
        title: `${task.title} hatırlatması`,
        message: `${companyName} için ${task.title.toLowerCase()} takibi: ${task.detail}. Termin: ${task.escalationLabel || "termin yok"}.`,
        sendWindow,
        sortScore,
      };
    })
    .sort((a, b) => {
      if (a.sortScore !== b.sortScore) return a.sortScore - b.sortScore;
      return (a.task.dueDate || "9999-12-31").localeCompare(b.task.dueDate || "9999-12-31");
    });

  return {
    items,
    overdue: items.filter(item => item.task.escalationLevel === "Gecikti").length,
    dueToday: items.filter(item => item.task.escalationLevel === "Acil").length,
    emailReady: items.filter(item => item.channel === "E-posta Hazır").length,
    critical: items.filter(item => item.severity === "Kritik").length,
  };
}
