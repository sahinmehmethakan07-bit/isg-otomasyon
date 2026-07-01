import React from "react";
import { formatDate } from "./dateUtils";
import { buildDofActionPipeline, type DofActionLevel } from "./dofActionPipeline";
import type { Company, DofRecord, RiskRecord } from "./types";

type DofActionPipelinePanelProps = {
  styles: Record<string, React.CSSProperties>;
  companies: Company[];
  dofs: DofRecord[];
  risks: RiskRecord[];
  createRiskFromDof: (dof: DofRecord) => void;
  setActiveTab: (tab: string) => void;
  setDofAddStatus: React.Dispatch<React.SetStateAction<string | null>>;
  setSelectedCompanyId: React.Dispatch<React.SetStateAction<string>>;
};

const LEVEL_COLORS: Record<DofActionLevel, string> = {
  Kritik: "#C0392B",
  "Riske Aktar": "#7c3aed",
  Takip: "#D4A017",
  Tamam: "#2D6A4F",
};

function SmallBadge({ text, color }: { text: string; color: string }) {
  return (
    <span style={{
      alignItems: "center",
      backgroundColor: `${color}18`,
      border: `1px solid ${color}44`,
      borderRadius: 999,
      color,
      display: "inline-flex",
      fontSize: 11,
      fontWeight: 800,
      minHeight: 26,
      padding: "0 9px",
      whiteSpace: "nowrap",
    }}>
      {text}
    </span>
  );
}

export function DofActionPipelinePanel({
  styles,
  companies,
  dofs,
  risks,
  createRiskFromDof,
  setActiveTab,
  setDofAddStatus,
  setSelectedCompanyId,
}: DofActionPipelinePanelProps) {
  const summary = React.useMemo(
    () => buildDofActionPipeline(companies, dofs, risks),
    [companies, dofs, risks]
  );
  const visibleItems = summary.items.slice(0, 6);

  function handleCreateRisk(dof: DofRecord, canCreateRisk: boolean) {
    if (!canCreateRisk) {
      setDofAddStatus('⚠️ Riske aktarmak için DÖF durumunu önce "Önlem Alındı" yapın');
      window.setTimeout(() => setDofAddStatus(null), 4000);
      return;
    }
    createRiskFromDof(dof);
  }

  function openTasks(companyId: string) {
    setSelectedCompanyId(companyId);
    setActiveTab("gorevler");
  }

  return (
    <div style={styles.card} className="isg-card">
      <div style={{ display: "flex", justifyContent: "space-between", gap: 12, alignItems: "flex-start", flexWrap: "wrap", marginBottom: 14 }}>
        <div>
          <p style={{ ...styles.sectionTitle, marginBottom: 6 }} className="isg-text-muted">DÖF Aksiyon Merkezi</p>
          <div style={{ color: "var(--isg-text-muted)", fontSize: 13, lineHeight: 1.55 }}>
            Açık DÖF kayıtlarını termin, öncelik, durum ve risk bağlantısına göre sıralar.
          </div>
        </div>
        <SmallBadge text={`${summary.totalOpen} açık DÖF`} color="#52d3b5" />
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(min(150px, 100%), 1fr))", gap: 10, marginBottom: 14 }}>
        {[
          { label: "Geciken", value: summary.overdue, color: "#C0392B" },
          { label: "Riske Hazır", value: summary.readyForRisk, color: "#7c3aed" },
          { label: "Yüksek Öncelik", value: summary.highPriority, color: "#D4A017" },
        ].map(metric => (
          <div key={metric.label} style={{ border: "1px solid var(--isg-border)", borderRadius: 12, padding: "12px 14px", backgroundColor: "var(--isg-input-bg)" }}>
            <div style={{ color: metric.color, fontSize: 22, fontWeight: 900, lineHeight: 1 }}>{metric.value}</div>
            <div style={{ color: "var(--isg-text-muted)", fontSize: 12, fontWeight: 700, marginTop: 5 }}>{metric.label}</div>
          </div>
        ))}
      </div>

      {visibleItems.length > 0 ? (
        <div style={{ display: "grid", gap: 10 }}>
          {visibleItems.map(item => {
            const color = LEVEL_COLORS[item.level];
            return (
              <div key={item.dof.id} style={{ border: "1px solid var(--isg-border)", borderLeft: `4px solid ${color}`, borderRadius: 12, padding: 12, backgroundColor: "var(--isg-input-bg)" }}>
                <div style={{ display: "flex", justifyContent: "space-between", gap: 10, alignItems: "flex-start", flexWrap: "wrap" }}>
                  <div style={{ minWidth: 0 }}>
                    <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center", marginBottom: 6 }}>
                      <SmallBadge text={item.level} color={color} />
                      <span style={{ color: "var(--isg-text-muted)", fontSize: 12, fontWeight: 700 }}>{item.companyName}</span>
                      <span style={{ color: "var(--isg-text-muted)", fontSize: 12 }}>{formatDate(item.dof.dueDate)}</span>
                    </div>
                    <div style={{ color: "var(--isg-text)", fontSize: 14, fontWeight: 850 }}>{item.actionTitle}</div>
                    <div style={{ color: "var(--isg-text-muted)", fontSize: 12, lineHeight: 1.5, marginTop: 4 }}>
                      {item.dof.title} · {item.actionDetail}
                    </div>
                  </div>
                  <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                    <button type="button" style={styles.btnSecondary} onClick={() => openTasks(item.dof.companyId)}>
                      Görevlerde Gör
                    </button>
                    {!item.linkedRisk && (
                      <button type="button" style={{ ...styles.btnPrimary, opacity: item.canCreateRisk ? 1 : 0.62 }} onClick={() => handleCreateRisk(item.dof, item.canCreateRisk)}>
                        Riske Aktar
                      </button>
                    )}
                    {item.linkedRisk && (
                      <button type="button" style={styles.btnSecondary} onClick={() => setActiveTab("risk")}>
                        Riski Aç
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div style={{ border: "1px dashed var(--isg-border)", borderRadius: 12, color: "var(--isg-text-muted)", fontSize: 13, padding: 14 }}>
          Açık DÖF yok. Yeni uygunsuzluk oluştuğunda aksiyon önceliği burada görünecek.
        </div>
      )}
    </div>
  );
}
