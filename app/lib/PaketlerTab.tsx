import React from "react";
import { PLANS, getPlan, limitLabel, type Plan, type PlanId } from "./plans";

type PaketlerTabProps = {
  styles: Record<string, React.CSSProperties>;
  currentPlanId?: PlanId | string;
  isAdmin: boolean;
};

const MODULE_LABELS: Record<string, string> = {
  "ozet":              "📊 Özet & Dashboard",
  "gorevler":          "✅ Görev / Takip Paneli",
  "firmalar":          "🏢 Firma Yönetimi",
  "personel":          "👤 Personel Yönetimi",
  "belgeler":          "📄 Belge Takibi",
  "gozlemciler":       "🔍 Gözlemciler",
  "dof":               "⚠️ DÖF Yönetimi",
  "risk":              "🛡 Risk Değerlendirme",
  "imzacilar":         "✍️ İmzacı Yönetimi",
  "egitimler":         "🎓 Eğitim Takibi",
  "kkd-formu":         "🧤 KKD Formu",
  "talimatlar":        "📋 İş Talimatları",
  "acil-durum-plani":  "⚠️ Acil Durum Planı",
  "nace-sorgula":      "🔎 NACE Sorgulama",
  "ek2muayene":        "🏥 EK-2 Muayene Formu",
  "myk-sorgula":       "🪪 MYK Sorgulama",
  "arsiv":             "🗂 Arşiv",
  "yillik-planlar":    "📅 Yıllık Planlar",
  "kurul-toplantisi":  "👥 Kurul Toplantısı",
  "is-kazasi-raporu":  "🚑 İş Kazası Raporu",
  "firma-ziyaretleri": "📍 Firma Ziyaretleri",
};

const ALL_MODULES = Object.keys(MODULE_LABELS);
const LOCKED_MODULES_FREE = PLANS.free.lockedModules;

function PlanCard({
  plan,
  isCurrent,
  isAdmin,
}: {
  plan: Plan;
  isCurrent: boolean;
  isAdmin: boolean;
}) {
  const freeModules = ALL_MODULES.filter(m => !LOCKED_MODULES_FREE.includes(m));
  const premiumModules = ALL_MODULES.filter(m => LOCKED_MODULES_FREE.includes(m));
  const hasAll = plan.lockedModules.length === 0;

  return (
    <div style={{
      border: isCurrent ? `2px solid ${plan.color}` : "1px solid var(--isg-border)",
      borderRadius: 16,
      padding: "24px 22px",
      backgroundColor: isCurrent ? plan.color + "0d" : "var(--isg-card)",
      display: "grid",
      gap: 20,
      position: "relative" as const,
      boxShadow: isCurrent ? `0 0 0 4px ${plan.color}18` : "none",
      transition: "box-shadow 0.2s",
    }}>
      {/* Mevcut paket rozeti */}
      {isCurrent && !isAdmin && (
        <div style={{
          position: "absolute" as const, top: -12, left: "50%", transform: "translateX(-50%)",
          backgroundColor: plan.color, color: "#fff",
          padding: "3px 14px", borderRadius: 20, fontSize: 11, fontWeight: 800,
          whiteSpace: "nowrap" as const,
        }}>
          Mevcut Paketiniz
        </div>
      )}

      {/* Başlık */}
      <div style={{ textAlign: "center" as const }}>
        <div style={{ fontSize: 36, marginBottom: 8 }}>{plan.emoji}</div>
        <div style={{ fontSize: 22, fontWeight: 900, color: plan.color, marginBottom: 4 }}>
          {plan.label}
        </div>
        <div style={{ fontSize: 12, color: "var(--isg-text-muted)", lineHeight: 1.5 }}>
          {plan.id === "free" && "Başlangıç için temel İSG araçları"}
          {plan.id === "uzman" && "İSG profesyonelleri için tam donanım"}
          {plan.id === "osgb" && "OSGB'ler ve büyük işletmeler için"}
        </div>
      </div>

      {/* Limitler */}
      <div style={{
        display: "grid", gap: 10,
        backgroundColor: "var(--isg-input-bg)",
        border: "1px solid var(--isg-border)",
        borderRadius: 10, padding: "14px 16px",
      }}>
        <div style={{ fontSize: 11, fontWeight: 800, color: "var(--isg-text-subtle)", textTransform: "uppercase" as const, letterSpacing: "0.08em", marginBottom: 2 }}>
          Kullanım Limitleri
        </div>
        {[
          { icon: "🏢", label: "Firma",         value: limitLabel(plan.maxCompanies) },
          { icon: "👤", label: "Personel",      value: limitLabel(plan.maxEmployees) },
          { icon: "📄", label: "PDF / gün",     value: limitLabel(plan.maxPdfPerDay) },
        ].map(({ icon, label, value }) => (
          <div key={label} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: 13 }}>
            <span style={{ color: "var(--isg-text-muted)" }}>{icon} {label}</span>
            <span style={{ fontWeight: 800, color: value === "Sınırsız" ? plan.color : "var(--isg-text)" }}>
              {value}
            </span>
          </div>
        ))}
      </div>

      {/* Modüller */}
      <div>
        <div style={{ fontSize: 11, fontWeight: 800, color: "var(--isg-text-subtle)", textTransform: "uppercase" as const, letterSpacing: "0.08em", marginBottom: 10 }}>
          Dahil Modüller
        </div>
        <div style={{ display: "grid", gap: 6 }}>
          {freeModules.map(m => (
            <div key={m} style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 12 }}>
              <span style={{ color: "#16a34a", fontWeight: 800, fontSize: 14 }}>✓</span>
              <span style={{ color: "var(--isg-text-muted)" }}>{MODULE_LABELS[m]}</span>
            </div>
          ))}
          {premiumModules.map(m => {
            const included = hasAll;
            return (
              <div key={m} style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 12, opacity: included ? 1 : 0.45 }}>
                <span style={{ fontWeight: 800, fontSize: 14, color: included ? "#16a34a" : "var(--isg-text-subtle)" }}>
                  {included ? "✓" : "✕"}
                </span>
                <span style={{ color: included ? "var(--isg-text-muted)" : "var(--isg-text-subtle)" }}>
                  {MODULE_LABELS[m]}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Admin notu */}
      {isAdmin && (
        <div style={{ fontSize: 11, color: "var(--isg-text-subtle)", textAlign: "center" as const, borderTop: "1px solid var(--isg-border)", paddingTop: 12 }}>
          Admin panelinden kullanıcılara atayabilirsiniz
        </div>
      )}
    </div>
  );
}

export function PaketlerTab({ styles, currentPlanId, isAdmin }: PaketlerTabProps) {
  const currentPlan = getPlan(currentPlanId);

  return (
    <div>
      {/* Başlık */}
      <div style={{ ...styles.card, marginBottom: 24, textAlign: "center" as const }}>
        <p style={{ ...styles.sectionTitle, marginBottom: 8 }} className="isg-text-muted">
          Paket Planları
        </p>
        <div style={{ color: "var(--isg-text-muted)", fontSize: 13, lineHeight: 1.6 }}>
          {isAdmin
            ? "Kullanıcı Yönetimi sekmesinden her kullanıcıya istediğiniz paketi atayabilirsiniz."
            : (
              <>
                Mevcut paketiniz:{" "}
                <strong style={{ color: currentPlan.color }}>
                  {currentPlan.emoji} {currentPlan.label}
                </strong>
                {" "}— Paketi değiştirmek için yöneticinizle iletişime geçin.
              </>
            )
          }
        </div>
      </div>

      {/* Karşılaştırma tablosu */}
      <div style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(min(280px, 100%), 1fr))",
        gap: 20,
        marginBottom: 32,
      }}>
        {(Object.values(PLANS) as Plan[]).map(plan => (
          <PlanCard
            key={plan.id}
            plan={plan}
            isCurrent={!isAdmin && currentPlan.id === plan.id}
            isAdmin={isAdmin}
          />
        ))}
      </div>

      {/* Kilitli modüller açıklaması */}
      <div style={{ ...styles.card }}>
        <p style={{ ...styles.sectionTitle, marginBottom: 12 }} className="isg-text-muted">
          🔒 Kilitli Modüller Hakkında
        </p>
        <div style={{ color: "var(--isg-text-muted)", fontSize: 13, lineHeight: 1.7 }}>
          <p style={{ marginBottom: 10 }}>
            <strong style={{ color: "var(--isg-text)" }}>Ücretsiz</strong> pakette 7 modül kilitlidir. Bu modüllerin sekmelerinde{" "}
            <span style={{ fontSize: 14 }}>🔒</span> ikonu görünür; tıklandığında içerik yerine paket yükseltme bilgisi gösterilir.
          </p>
          <p style={{ marginBottom: 10 }}>
            <strong style={{ color: "#0ea5e9" }}>⭐ Uzman</strong> ve{" "}
            <strong style={{ color: "#a78bfa" }}>🏆 OSGB</strong> paketlerinde tüm modüller açıktır.
          </p>
          <p>
            Firma, personel ve PDF limitleri aşıldığında işlem engellenir ve kullanıcıya bilgi mesajı gösterilir. Mevcut veriler silinmez, yalnızca yeni ekleme durdurulur.
          </p>
        </div>
      </div>
    </div>
  );
}
