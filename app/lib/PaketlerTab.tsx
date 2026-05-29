import React from "react";
import { PLANS, getPlan, type Plan, type PlanId } from "./plans";

type PaketlerTabProps = {
  styles: Record<string, React.CSSProperties>;
  currentPlanId?: PlanId | string;
  isAdmin: boolean;
};

function FeatureRow({ text, type }: { text: string; type: "check" | "limit" | "cross" }) {
  const icon  = type === "check" ? "✓" : type === "limit" ? "⚠" : "✕";
  const color = type === "check" ? "#22c55e" : type === "limit" ? "#f59e0b" : "#ef4444";
  return (
    <div style={{ display: "flex", alignItems: "flex-start", gap: 10, fontSize: 13, lineHeight: 1.45 }}>
      <span style={{ color, fontWeight: 900, fontSize: 15, flexShrink: 0, marginTop: 1 }}>{icon}</span>
      <span style={{
        color: type === "cross" ? "var(--isg-text-subtle)" : "var(--isg-text-muted)",
        textDecoration: type === "cross" ? "line-through" : "none",
      }}>
        {text}
      </span>
    </div>
  );
}

function PlanCard({
  plan,
  isCurrent,
  isAdmin,
}: {
  plan: Plan;
  isCurrent: boolean;
  isAdmin: boolean;
}) {
  return (
    <div style={{
      position: "relative" as const,
      border: plan.popular
        ? `2px solid ${plan.color}`
        : isCurrent
          ? `2px solid ${plan.color}88`
          : "1px solid var(--isg-border)",
      borderRadius: 16,
      padding: plan.popular ? "28px 22px 24px" : "24px 22px",
      backgroundColor: plan.popular
        ? plan.color + "0e"
        : isCurrent
          ? plan.color + "08"
          : "var(--isg-card)",
      display: "grid",
      gap: 20,
      alignContent: "start" as const,
    }}>

      {/* EN POPÜLER rozeti */}
      {plan.popular && (
        <div style={{
          position: "absolute" as const,
          top: -14, left: "50%", transform: "translateX(-50%)",
          background: `linear-gradient(135deg, ${plan.color}, #818cf8)`,
          color: "#fff", padding: "4px 16px", borderRadius: 20,
          fontSize: 11, fontWeight: 900, letterSpacing: "0.06em",
          whiteSpace: "nowrap" as const, boxShadow: `0 4px 12px ${plan.color}44`,
        }}>
          ⭐ EN POPÜLER
        </div>
      )}

      {/* Mevcut paket rozeti */}
      {isCurrent && !isAdmin && (
        <div style={{
          position: "absolute" as const,
          top: -12, right: 16,
          backgroundColor: plan.color, color: "#fff",
          padding: "3px 10px", borderRadius: 20,
          fontSize: 10, fontWeight: 800,
        }}>
          Mevcut Paket
        </div>
      )}

      {/* Başlık */}
      <div>
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 4 }}>
          <div style={{
            width: 36, height: 36, borderRadius: 10, fontSize: 18,
            display: "flex", alignItems: "center", justifyContent: "center",
            backgroundColor: plan.color + "22", border: `1px solid ${plan.color}44`,
          }}>
            {plan.emoji}
          </div>
          <div>
            <div style={{ fontWeight: 900, fontSize: 16, color: "var(--isg-text)" }}>{plan.label}</div>
            <div style={{ fontSize: 11, color: "var(--isg-text-subtle)" }}>{plan.subtitle}</div>
          </div>
        </div>
      </div>

      {/* Fiyat */}
      <div style={{ borderBottom: "1px solid var(--isg-border)", paddingBottom: 16 }}>
        <div style={{ display: "flex", alignItems: "flex-end", gap: 4 }}>
          <span style={{ fontSize: 40, fontWeight: 900, color: plan.price === 0 ? "var(--isg-text)" : plan.color, lineHeight: 1 }}>
            {plan.price === 0 ? "0" : plan.price}
          </span>
          {plan.price > 0 && (
            <span style={{ fontSize: 16, fontWeight: 700, color: plan.color, marginBottom: 4 }}>₺</span>
          )}
          {plan.price === 0 && (
            <span style={{ fontSize: 16, fontWeight: 700, color: "var(--isg-text-muted)", marginBottom: 4 }}>₺</span>
          )}
        </div>
        <div style={{ fontSize: 12, color: "var(--isg-text-muted)", marginTop: 2 }}>
          {plan.priceSuffix}
        </div>
      </div>

      {/* Özellik listesi */}
      <div style={{ display: "grid", gap: 9 }}>
        {plan.features.map((f, i) => (
          <FeatureRow key={i} text={f.text} type={f.type} />
        ))}
      </div>

      {/* Alt buton */}
      <div style={{ marginTop: 4 }}>
        {isCurrent && !isAdmin ? (
          <div style={{
            height: 40, borderRadius: 10, border: `1px solid ${plan.color}44`,
            backgroundColor: plan.color + "15", color: plan.color,
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 13, fontWeight: 750,
          }}>
            ✓ Şu Anki Paketiniz
          </div>
        ) : (
          <div style={{
            height: 40, borderRadius: 10, border: "1px solid var(--isg-border)",
            backgroundColor: "var(--isg-input-bg)", color: "var(--isg-text-muted)",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 12, fontWeight: 600,
          }}>
            {isAdmin ? "Admin tarafından atanır" : "Yöneticinizle iletişime geçin"}
          </div>
        )}
      </div>
    </div>
  );
}

export function PaketlerTab({ styles, currentPlanId, isAdmin }: PaketlerTabProps) {
  const currentPlan = getPlan(currentPlanId);

  return (
    <div>
      {/* Başlık */}
      <div style={{ textAlign: "center" as const, marginBottom: 32 }}>
        <p style={{ ...styles.sectionTitle, marginBottom: 10, fontSize: 13 }} className="isg-text-muted">
          PAKET PLANLARI
        </p>
        <h2 style={{ fontSize: 24, fontWeight: 900, margin: "0 0 10px", color: "var(--isg-text)" }}>
          İSG İşlerinizi Hızlandırın
        </h2>
        <p style={{ color: "var(--isg-text-muted)", fontSize: 14, lineHeight: 1.6, maxWidth: 480, margin: "0 auto" }}>
          {isAdmin
            ? "Kullanıcı Yönetimi sekmesinden her kullanıcıya paket atayabilirsiniz."
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
        </p>
      </div>

      {/* Paket kartları */}
      <div style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(min(260px, 100%), 1fr))",
        gap: 20,
        marginBottom: 32,
        alignItems: "start" as const,
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

      {/* Alt not */}
      <div style={{
        ...styles.card,
        display: "flex", alignItems: "flex-start", gap: 14, fontSize: 13,
        color: "var(--isg-text-muted)", lineHeight: 1.65,
      }}>
        <span style={{ fontSize: 20, flexShrink: 0 }}>ℹ️</span>
        <div>
          <strong style={{ color: "var(--isg-text)" }}>Limit aşıldığında ne olur?</strong>
          <br />
          Firma, personel veya PDF limitleri aşıldığında yeni kayıt eklenmesi engellenir ve
          kullanıcıya bilgi mesajı gösterilir. <strong style={{ color: "var(--isg-text)" }}>Mevcut veriler silinmez.</strong>{" "}
          Ücretsiz paketteki kilitli modüllere tıklandığında içerik yerine paket yükseltme bilgisi görüntülenir.
        </div>
      </div>
    </div>
  );
}
