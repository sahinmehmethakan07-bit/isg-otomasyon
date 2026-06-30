import React from "react";
import { IsoTarihSecici } from "./TarihSecici";
import { formatDate } from "./dateUtils";
import { EmptyTableRow } from "./EmptyState";
import { generateEmergencyPlanPDF } from "./pdf";
import type { Company, EmergencyPlanRecord, EmergencyPlanStatus, Employee } from "./types";

type EmergencyPlanDraft = {
  companyId: string;
  title: string;
  scenario: string;
  assemblyArea: string;
  planDate: string;
  drillDate: string;
  responsible: string;
  emergencyTeam: string;
  status: EmergencyPlanStatus;
  notes: string;
};

type EmergencyPlansTabProps = {
  styles: Record<string, React.CSSProperties>;
  companies: Company[];
  employees: Employee[];
  filteredEmergencyPlans: EmergencyPlanRecord[];
  newEmergencyPlan: EmergencyPlanDraft;
  setNewEmergencyPlan: React.Dispatch<React.SetStateAction<EmergencyPlanDraft>>;
  search: string;
  setSearch: (value: string) => void;
  selectedCompanyId: string;
  setSelectedCompanyId: (value: string) => void;
  addEmergencyPlan: () => void;
  updateEmergencyPlanStatus: (id: string, status: EmergencyPlanStatus) => void;
  deleteEmergencyPlan: (id: string) => void;
};

function FormField({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label>
      <span style={{ display: "block", fontSize: 12, color: "var(--isg-text-muted)", marginBottom: 8, fontWeight: 700 }}>{label}</span>
      {children}
    </label>
  );
}

function Badge({ text, color }: { text: string; color: string }) {
  return (
    <span className="isg-badge" style={{ border: `1px solid ${color}55`, color, background: `${color}18` }}>{text}</span>
  );
}

const scenarioColor = (scenario: string) =>
  scenario === "Yangın" ? "#C0392B"
    : scenario === "Deprem" ? "#D4A017"
      : scenario === "Kimyasal Sızıntı" ? "#7c3aed"
        : scenario === "İlk Yardım / Yaralanma" ? "#0ea5e9"
          : scenario === "all" ? "#52d3b5"
            : "#2D6A4F";

const statusColor = (status: "all" | EmergencyPlanStatus) =>
  status === "Yürürlükte" ? "#2D6A4F"
    : status === "Güncelleme Gerekli" ? "#C0392B"
      : status === "Tatbikat Planlandı" ? "#D4A017"
        : status === "all" ? "#52d3b5"
          : "#0ea5e9";

export function EmergencyPlansTab({
  styles,
  companies,
  employees,
  filteredEmergencyPlans,
  newEmergencyPlan,
  setNewEmergencyPlan,
  search,
  setSearch,
  selectedCompanyId,
  setSelectedCompanyId,
  addEmergencyPlan,
  updateEmergencyPlanStatus,
  deleteEmergencyPlan,
}: EmergencyPlansTabProps) {
  const [scenarioFilter, setScenarioFilter] = React.useState("all");
  const [statusFilter, setStatusFilter] = React.useState<"all" | EmergencyPlanStatus>("all");

  const visibleEmergencyPlans = React.useMemo(() => filteredEmergencyPlans.filter(plan => {
    const matchesScenario = scenarioFilter === "all" || plan.scenario === scenarioFilter;
    const matchesStatus = statusFilter === "all" || plan.status === statusFilter;
    return matchesScenario && matchesStatus;
  }), [filteredEmergencyPlans, scenarioFilter, statusFilter]);

  const scenarioFilters = [
    { value: "all", label: "Tüm Senaryolar", count: filteredEmergencyPlans.length, color: scenarioColor("all") },
    ...Array.from(new Set(filteredEmergencyPlans.map(plan => plan.scenario).filter(Boolean))).map(scenario => ({
      value: scenario,
      label: scenario,
      count: filteredEmergencyPlans.filter(plan => plan.scenario === scenario).length,
      color: scenarioColor(scenario),
    })),
  ];

  const statusFilters: Array<{ value: "all" | EmergencyPlanStatus; label: string; count: number; color: string }> = (
    ["all", "Taslak", "Yürürlükte", "Tatbikat Planlandı", "Güncelleme Gerekli"] as const
  ).map(status => ({
    value: status,
    label: status === "all" ? "Tüm Durumlar" : status,
    count: status === "all" ? filteredEmergencyPlans.length : filteredEmergencyPlans.filter(plan => plan.status === status).length,
    color: statusColor(status),
  }));

  return (
    <div>
      <div style={styles.card} className="isg-card">
        <p style={styles.sectionTitle} className="isg-text-muted">Acil Durum Planı</p>
        <div style={styles.formGrid}>
          <FormField label="Firma *">
            <select style={styles.select} className="isg-input" value={newEmergencyPlan.companyId} onChange={e => setNewEmergencyPlan({ ...newEmergencyPlan, companyId: e.target.value })}>
              <option value="">Seçin...</option>
              {companies.map(c => <option key={c.id} value={c.id}>{c.nickName}</option>)}
            </select>
          </FormField>
          <FormField label="Plan Başlığı *"><input style={styles.input} className="isg-input" value={newEmergencyPlan.title} onChange={e => setNewEmergencyPlan({ ...newEmergencyPlan, title: e.target.value })} placeholder="Örn. Otel yangın acil durum planı" /></FormField>
          <FormField label="Senaryo">
            <select style={styles.select} className="isg-input" value={newEmergencyPlan.scenario} onChange={e => setNewEmergencyPlan({ ...newEmergencyPlan, scenario: e.target.value })}>
              <option>Yangın</option>
              <option>Deprem</option>
              <option>Kimyasal Sızıntı</option>
              <option>Elektrik Kesintisi</option>
              <option>İlk Yardım / Yaralanma</option>
              <option>Tahliye</option>
              <option>Diğer</option>
            </select>
          </FormField>
          <FormField label="Toplanma Alanı"><input style={styles.input} className="isg-input" value={newEmergencyPlan.assemblyArea} onChange={e => setNewEmergencyPlan({ ...newEmergencyPlan, assemblyArea: e.target.value })} placeholder="Örn. Ana otopark A noktası" /></FormField>
          <FormField label="Plan Tarihi *"><IsoTarihSecici allowFuture styles={styles} value={newEmergencyPlan.planDate} onChange={v => setNewEmergencyPlan({ ...newEmergencyPlan, planDate: v })} /></FormField>
          <FormField label="Tatbikat Tarihi"><IsoTarihSecici allowFuture styles={styles} value={newEmergencyPlan.drillDate} onChange={v => setNewEmergencyPlan({ ...newEmergencyPlan, drillDate: v })} /></FormField>
          <FormField label="Sorumlu"><input style={styles.input} className="isg-input" value={newEmergencyPlan.responsible} onChange={e => setNewEmergencyPlan({ ...newEmergencyPlan, responsible: e.target.value })} placeholder="Acil durum koordinatörü" /></FormField>
          <FormField label="Durum">
            <select style={styles.select} className="isg-input" value={newEmergencyPlan.status} onChange={e => setNewEmergencyPlan({ ...newEmergencyPlan, status: e.target.value as EmergencyPlanStatus })}>
              <option>Taslak</option>
              <option>Yürürlükte</option>
              <option>Tatbikat Planlandı</option>
              <option>Güncelleme Gerekli</option>
            </select>
          </FormField>
          <FormField label="Acil Durum Ekibi"><input style={styles.input} className="isg-input" value={newEmergencyPlan.emergencyTeam} onChange={e => setNewEmergencyPlan({ ...newEmergencyPlan, emergencyTeam: e.target.value })} placeholder="Söndürme, kurtarma, ilk yardım ekibi..." /></FormField>
          <FormField label="Not"><input style={styles.input} className="isg-input" value={newEmergencyPlan.notes} onChange={e => setNewEmergencyPlan({ ...newEmergencyPlan, notes: e.target.value })} placeholder="Tahliye, iletişim, özel riskler..." /></FormField>
        </div>
        <div style={{ marginTop: 12, display: "flex", gap: 10, flexWrap: "wrap" }}>
          <button style={styles.btnPrimary} onClick={addEmergencyPlan}>Acil Durum Planı Ekle</button>
        </div>
      </div>

      <div style={styles.searchBar}>
        <input style={{ ...styles.input, maxWidth: 300 }} placeholder="Ara..." value={search} onChange={e => setSearch(e.target.value)} />
        <select style={{ ...styles.select, maxWidth: 180 }} value={selectedCompanyId} onChange={e => setSelectedCompanyId(e.target.value)}><option value="all">Tüm Firmalar</option>{companies.map(c => <option key={c.id} value={c.id}>{c.nickName}</option>)}</select>
        <span style={{ color: "var(--isg-text-muted)", fontSize: 13 }}>{visibleEmergencyPlans.length} plan</span>
      </div>

      <div style={{ ...styles.card, padding: 14, marginBottom: 16 }} className="isg-card">
        <div style={{ display: "grid", gap: 14 }}>
          <div>
            <div style={{ ...styles.label, marginBottom: 8 }} className="isg-label">Senaryo Filtresi</div>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              {scenarioFilters.map(filter => {
                const active = scenarioFilter === filter.value;
                return (
                  <button
                    key={filter.value}
                    type="button"
                    onClick={() => setScenarioFilter(filter.value)}
                    style={{
                      ...styles.btnSecondary,
                      minHeight: 44,
                      background: active ? `${filter.color}24` : "var(--isg-surface-soft)",
                      borderColor: active ? `${filter.color}88` : "var(--isg-border)",
                      color: active ? filter.color : "var(--isg-text)",
                    }}
                  >
                    {filter.label} ({filter.count})
                  </button>
                );
              })}
            </div>
          </div>

          <div>
            <div style={{ ...styles.label, marginBottom: 8 }} className="isg-label">Durum Filtresi</div>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              {statusFilters.map(filter => {
                const active = statusFilter === filter.value;
                return (
                  <button
                    key={filter.value}
                    type="button"
                    onClick={() => setStatusFilter(filter.value)}
                    style={{
                      ...styles.btnSecondary,
                      minHeight: 44,
                      background: active ? `${filter.color}24` : "var(--isg-surface-soft)",
                      borderColor: active ? `${filter.color}88` : "var(--isg-border)",
                      color: active ? filter.color : "var(--isg-text)",
                    }}
                  >
                    {filter.label} ({filter.count})
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      <div style={{ ...styles.card, padding: 0, overflow: "auto", WebkitOverflowScrolling: "touch" as any }}>
        <table style={styles.table}>
          <thead><tr>{["Firma", "Başlık", "Senaryo", "Toplanma Alanı", "Plan", "Tatbikat", "Sorumlu", "Durum", "Ekip / Not", "Çıktı", "İşlem"].map(h => <th key={h} style={styles.th} className="isg-th">{h}</th>)}</tr></thead>
          <tbody>
            {visibleEmergencyPlans.map(plan => {
              const company = companies.find(c => c.id === plan.companyId);
              return (
                <tr key={plan.id}>
                  <td style={styles.td} className="isg-td">{company?.nickName || "—"}</td>
                  <td style={{ ...styles.td, minWidth: 170 }} className="isg-td"><strong>{plan.title}</strong></td>
                  <td style={styles.td} className="isg-td"><Badge text={plan.scenario} color={scenarioColor(plan.scenario)} /></td>
                  <td style={styles.td} className="isg-td">{plan.assemblyArea || "—"}</td>
                  <td style={styles.td} className="isg-td">{formatDate(plan.planDate)}</td>
                  <td style={styles.td} className="isg-td">{formatDate(plan.drillDate)}</td>
                  <td style={styles.td} className="isg-td">{plan.responsible || "—"}</td>
                  <td style={styles.td} className="isg-td">
                    <select style={{ ...styles.select, minWidth: 150 }} value={plan.status} onChange={e => updateEmergencyPlanStatus(plan.id, e.target.value as EmergencyPlanStatus)}>
                      <option>Taslak</option>
                      <option>Yürürlükte</option>
                      <option>Tatbikat Planlandı</option>
                      <option>Güncelleme Gerekli</option>
                    </select>
                  </td>
                  <td style={{ ...styles.td, minWidth: 210, color: "var(--isg-text-muted)" }} className="isg-td">{[plan.emergencyTeam, plan.notes].filter(Boolean).join(" / ") || "—"}</td>
                  <td style={styles.td} className="isg-td"><button style={styles.btnSecondary} onClick={() => generateEmergencyPlanPDF(plan, company, employees)}>Plan PDF</button></td>
                  <td style={styles.td} className="isg-td"><button style={styles.btnDanger} onClick={() => deleteEmergencyPlan(plan.id)}>Sil</button></td>
                </tr>
              );
            })}
            {visibleEmergencyPlans.length === 0 && (
              <EmptyTableRow colSpan={11} message="Yeni acil durum planı eklemek için yukarıdaki formu kullanın." />
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
