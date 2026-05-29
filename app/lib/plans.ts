/**
 * plans.ts — Paket / Abonelik Tanımları
 *
 * Tüm paket sınırlarını buradan yönetirsin.
 * maxCompanies / maxEmployees / maxPdfPerDay → -1 = sınırsız
 * lockedModules → bu sekmeleri görmek için yükseltme gerekir
 */

export type PlanId = "free" | "uzman" | "osgb";

export type Plan = {
  id: PlanId;
  label: string;
  emoji: string;
  color: string;
  /** Maksimum firma sayısı. -1 = sınırsız */
  maxCompanies: number;
  /** Maksimum toplam personel sayısı. -1 = sınırsız */
  maxEmployees: number;
  /** Günlük maksimum PDF çıktısı. -1 = sınırsız */
  maxPdfPerDay: number;
  /** Bu pakette erişilemeyen sekme id'leri */
  lockedModules: string[];
};

export const PLANS: Record<PlanId, Plan> = {
  free: {
    id: "free",
    label: "Ücretsiz",
    emoji: "🆓",
    color: "#64748b",
    maxCompanies: 3,
    maxEmployees: 30,
    maxPdfPerDay: 5,
    lockedModules: [
      "ek2muayene",
      "myk-sorgula",
      "arsiv",
      "yillik-planlar",
      "kurul-toplantisi",
      "is-kazasi-raporu",
      "firma-ziyaretleri",
    ],
  },
  uzman: {
    id: "uzman",
    label: "Uzman",
    emoji: "⭐",
    color: "#0ea5e9",
    maxCompanies: 20,
    maxEmployees: 1200,
    maxPdfPerDay: -1,
    lockedModules: [],
  },
  osgb: {
    id: "osgb",
    label: "OSGB",
    emoji: "🏆",
    color: "#a78bfa",
    maxCompanies: -1,
    maxEmployees: -1,
    maxPdfPerDay: -1,
    lockedModules: [],
  },
};

export const DEFAULT_PLAN: PlanId = "free";

/** Geçersiz veya eksik plan id'si → free döner */
export function getPlan(planId?: string | null): Plan {
  if (planId && planId in PLANS) return PLANS[planId as PlanId];
  return PLANS.free;
}

/** Limiti kontrol eder. max === -1 ise her zaman true (sınırsız) */
export function withinLimit(current: number, max: number): boolean {
  return max === -1 || current < max;
}

/** Kullanıcı dostu limit metni */
export function limitLabel(max: number): string {
  return max === -1 ? "Sınırsız" : String(max);
}
