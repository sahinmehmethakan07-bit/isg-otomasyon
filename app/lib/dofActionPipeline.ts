import type { Company, DofRecord, RiskRecord } from "./types";

export type DofActionLevel = "Kritik" | "Riske Aktar" | "Takip" | "Tamam";

export type DofActionItem = {
  dof: DofRecord;
  companyName: string;
  linkedRisk: RiskRecord | null;
  level: DofActionLevel;
  score: number;
  actionTitle: string;
  actionDetail: string;
  canCreateRisk: boolean;
};

export type DofActionPipelineSummary = {
  totalOpen: number;
  overdue: number;
  readyForRisk: number;
  highPriority: number;
  items: DofActionItem[];
};

const DAY_MS = 24 * 60 * 60 * 1000;

function isPastDate(value: string) {
  if (!value) return false;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return false;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return date.getTime() < today.getTime();
}

function daysUntil(value: string) {
  if (!value) return Number.POSITIVE_INFINITY;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return Number.POSITIVE_INFINITY;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return Math.ceil((date.getTime() - today.getTime()) / DAY_MS);
}

function getActionForDof(dof: DofRecord, linkedRisk: RiskRecord | null): Pick<DofActionItem, "level" | "score" | "actionTitle" | "actionDetail" | "canCreateRisk"> {
  const overdue = isPastDate(dof.dueDate);
  const dueSoon = daysUntil(dof.dueDate) <= 7;
  const highPriority = dof.priority === "Yüksek";
  const hasAfterPhoto = Boolean(dof.afterPhoto);
  const canCreateRisk = dof.status === "Önlem Alındı" && !linkedRisk;

  if (canCreateRisk) {
    return {
      level: "Riske Aktar",
      score: 90 + (highPriority ? 8 : 0) + (overdue ? 6 : 0),
      actionTitle: "Risk kaydına aktar",
      actionDetail: "Önlem alınmış DÖF için kalıcı risk kaydı oluşturulmalı.",
      canCreateRisk,
    };
  }

  if (overdue && dof.status !== "Çözüldü") {
    return {
      level: "Kritik",
      score: 80 + (highPriority ? 12 : 0),
      actionTitle: "Geciken DÖF aksiyonu",
      actionDetail: "Termin geçmiş. Sorumlu ve düzeltici faaliyet durumu bugün kontrol edilmeli.",
      canCreateRisk,
    };
  }

  if (highPriority && dof.status === "Açık") {
    return {
      level: "Kritik",
      score: 72,
      actionTitle: "Yüksek öncelikli açık DÖF",
      actionDetail: "Bildirim ve sorumlu ataması hızlandırılmalı; görev merkezinde takip edilmeli.",
      canCreateRisk,
    };
  }

  if (dof.status === "Bildirildi" && !hasAfterPhoto) {
    return {
      level: "Takip",
      score: dueSoon ? 58 : 46,
      actionTitle: "Kanıt fotoğrafı bekleniyor",
      actionDetail: "Düzeltme sonrası fotoğrafı ve sorumlu geri bildirimi tamamlanmalı.",
      canCreateRisk,
    };
  }

  if (linkedRisk) {
    return {
      level: "Tamam",
      score: 20,
      actionTitle: "Risk bağlantısı var",
      actionDetail: "Bu DÖF risk kaydıyla ilişkilendirilmiş; risk modülünde takip edilebilir.",
      canCreateRisk,
    };
  }

  return {
    level: dueSoon ? "Takip" : "Tamam",
    score: dueSoon ? 36 : 10,
    actionTitle: dueSoon ? "Termin yaklaşıyor" : "Standart takip",
    actionDetail: dueSoon ? "Termin 7 gün içinde. Görev merkezinde görünür durumda." : "Ek aksiyon gerekmiyor.",
    canCreateRisk,
  };
}

export function buildDofActionPipeline(companies: Company[], dofs: DofRecord[], risks: RiskRecord[]): DofActionPipelineSummary {
  const openDofs = dofs.filter(dof => dof.status !== "Çözüldü" && dof.status !== "Riske Aktarıldı");

  const items = openDofs
    .map(dof => {
      const linkedRisk = risks.find(risk => risk.sourceDofId === dof.id || risk.id === dof.sourceRiskId) ?? null;
      const company = companies.find(item => item.id === dof.companyId);
      const action = getActionForDof(dof, linkedRisk);

      return {
        dof,
        companyName: company?.nickName || "Firma yok",
        linkedRisk,
        ...action,
      };
    })
    .sort((a, b) => b.score - a.score);

  return {
    totalOpen: openDofs.length,
    overdue: openDofs.filter(dof => isPastDate(dof.dueDate)).length,
    readyForRisk: items.filter(item => item.canCreateRisk).length,
    highPriority: openDofs.filter(dof => dof.priority === "Yüksek").length,
    items,
  };
}
