/**
 * plans.ts — Paket / Abonelik Tanımları
 *
 * Tüm paket sınırlarını buradan yönetirsin.
 * maxCompanies / maxEmployees / maxPdfPerDay → -1 = sınırsız
 * lockedModules → bu sekmeleri görmek için yükseltme gerekir
 */

export type PlanId = "free" | "uzman" | "osgb";

export type PlanFeature = {
  text: string;
  /** "check" = yeşil ✓ | "limit" = sarı ⚠ | "cross" = kırmızı ✗ */
  type: "check" | "limit" | "cross";
};

export type Plan = {
  id: PlanId;
  label: string;
  emoji: string;
  color: string;
  /** Aylık fiyat (₺). 0 = ücretsiz */
  price: number;
  /** Fiyat altı küçük yazı */
  priceSuffix: string;
  /** "EN POPÜLER" rozeti göster */
  popular: boolean;
  /** Kart altında küçük açıklama */
  subtitle: string;
  /** Maksimum firma sayısı. -1 = sınırsız */
  maxCompanies: number;
  /** Maksimum toplam personel sayısı. -1 = sınırsız */
  maxEmployees: number;
  /** Günlük maksimum PDF çıktısı. -1 = sınırsız */
  maxPdfPerDay: number;
  /** Kart özellik listesi */
  features: PlanFeature[];
  /** Bu pakette erişilemeyen sekme id'leri */
  lockedModules: string[];
};

export const PLANS: Record<PlanId, Plan> = {
  free: {
    id: "free",
    label: "Ücretsiz",
    emoji: "🆓",
    color: "#64748b",
    price: 0,
    priceSuffix: "/ sonsuza kadar",
    popular: false,
    subtitle: "Başlangıç için temel İSG araçları",
    maxCompanies: 3,
    maxEmployees: 30,
    maxPdfPerDay: 5,
    features: [
      { text: "Temel İSG araçları",          type: "check" },
      { text: "Risk değerlendirme",           type: "check" },
      { text: "Tüm İSG evrakları",            type: "check" },
      { text: "DÖF & Belge yönetimi",         type: "check" },
      { text: "Günde sadece 5 PDF",           type: "limit" },
      { text: "Maksimum 30 personel",         type: "limit" },
      { text: "Maksimum 3 firma",             type: "limit" },
      { text: "EK-2 Muayene & MYK Sorgu",    type: "cross" },
      { text: "Arşiv & Yıllık Planlar",       type: "cross" },
      { text: "Kurul, Kaza & Ziyaret",        type: "cross" },
    ],
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
    price: 249,
    priceSuffix: "/ aylık",
    popular: true,
    subtitle: "İSG profesyonelleri için tam donanım",
    maxCompanies: 20,
    maxEmployees: 1200,
    maxPdfPerDay: -1,
    features: [
      { text: "Sınırsız PDF oluşturma",       type: "check" },
      { text: "1200 personele kadar",         type: "check" },
      { text: "20 firmaya kadar",             type: "check" },
      { text: "Tüm İSG modülleri",            type: "check" },
      { text: "EK-2 Muayene & MYK Sorgu",    type: "check" },
      { text: "Arşiv & Yıllık Planlar",       type: "check" },
      { text: "Kurul, Kaza & Ziyaret",        type: "check" },
      { text: "Çoklu Atama — Max 3 Firma",    type: "limit" },
      { text: "Toplu Atama — Max 3 Firma",    type: "limit" },
    ],
    lockedModules: [],
  },
  osgb: {
    id: "osgb",
    label: "OSGB",
    emoji: "🏆",
    color: "#a78bfa",
    price: 349,
    priceSuffix: "/ aylık",
    popular: false,
    subtitle: "Şirketler & OSGB'ler için",
    maxCompanies: -1,
    maxEmployees: -1,
    maxPdfPerDay: -1,
    features: [
      { text: "Tüm Uzman özellikleri",        type: "check" },
      { text: "Sınırsız firma & personel",    type: "check" },
      { text: "Tam kapsamlı İSG yönetimi",    type: "check" },
      { text: "Çoklu Atama Sınırsız",         type: "check" },
      { text: "Toplu Atama İndir Sınırsız",   type: "check" },
    ],
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
