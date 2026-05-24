import React, { useEffect, useState } from "react";
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
    <span style={{ border: `1px solid ${color}55`, color, background: `${color}18`, padding: "4px 8px", borderRadius: 6, fontSize: 12, fontWeight: 800 }}>{text}</span>
  );
}

function DatePicker({ value, onChange, styles }: { value: string; onChange: (value: string) => void; styles: Record<string, React.CSSProperties> }) {
  const [displayValue, setDisplayValue] = useState("");

  useEffect(() => {
    if (!value) {
      setDisplayValue("");
      return;
    }
    const [year, month, day] = value.split("-");
    setDisplayValue(year && month && day ? `${day}.${month}.${year}` : value);
  }, [value]);

  function formatInput(raw: string) {
    const digits = raw.replace(/\D/g, "").slice(0, 8);
    if (digits.length <= 2) return digits;
    if (digits.length <= 4) return `${digits.slice(0, 2)}.${digits.slice(2)}`;
    return `${digits.slice(0, 2)}.${digits.slice(2, 4)}.${digits.slice(4)}`;
  }

  function commitDate(text: string) {
    const match = text.match(/^(\d{2})\.(\d{2})\.(\d{4})$/);
    if (!match) return;
    const [, day, month, year] = match;
    const iso = `${year}-${month}-${day}`;
    const parsed = new Date(iso);
    if (!Number.isNaN(parsed.getTime())) onChange(iso);
  }

  return (
    <div style={{ position: "relative" }}>
      <input
        style={{ ...styles.input, paddingRight: 44 }}
        className="isg-input"
        value={displayValue}
        onChange={e => {
          const formatted = formatInput(e.target.value);
          setDisplayValue(formatted);
          if (formatted.length === 10) commitDate(formatted);
          if (formatted.length === 0) onChange("");
        }}
        onBlur={() => commitDate(displayValue)}
        placeholder="Tarih seçin..."
      />
      <input
        type="date"
        value={value}
        onChange={e => onChange(e.target.value)}
        style={{ position: "absolute", inset: 0, opacity: 0, cursor: "pointer" }}
        aria-label="Tarih seç"
      />
      <span style={{ position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)", pointerEvents: "none", color: "var(--isg-text-muted)" }}>📅</span>
    </div>
  );
}

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
          <FormField label="Plan Tarihi *"><DatePicker styles={styles} value={newEmergencyPlan.planDate} onChange={v => setNewEmergencyPlan({ ...newEmergencyPlan, planDate: v })} /></FormField>
          <FormField label="Tatbikat Tarihi"><DatePicker styles={styles} value={newEmergencyPlan.drillDate} onChange={v => setNewEmergencyPlan({ ...newEmergencyPlan, drillDate: v })} /></FormField>
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
        <span style={{ color: "var(--isg-text-muted)", fontSize: 13 }}>{filteredEmergencyPlans.length} plan</span>
      </div>

      <div style={{ ...styles.card, padding: 0, overflow: "auto", WebkitOverflowScrolling: "touch" as any }}>
        <table style={styles.table}>
          <thead><tr>{["Firma", "Başlık", "Senaryo", "Toplanma Alanı", "Plan", "Tatbikat", "Sorumlu", "Durum", "Ekip / Not", "Çıktı", "İşlem"].map(h => <th key={h} style={styles.th} className="isg-th">{h}</th>)}</tr></thead>
          <tbody>
            {filteredEmergencyPlans.map(plan => {
              const company = companies.find(c => c.id === plan.companyId);
              return (
                <tr key={plan.id}>
                  <td style={styles.td} className="isg-td">{company?.nickName || "—"}</td>
                  <td style={{ ...styles.td, minWidth: 170 }} className="isg-td"><strong>{plan.title}</strong></td>
                  <td style={styles.td} className="isg-td"><Badge text={plan.scenario} color="#f97316" /></td>
                  <td style={styles.td} className="isg-td">{plan.assemblyArea || "—"}</td>
                  <td style={styles.td} className="isg-td">{plan.planDate ? new Date(plan.planDate).toLocaleDateString("tr-TR") : "—"}</td>
                  <td style={styles.td} className="isg-td">{plan.drillDate ? new Date(plan.drillDate).toLocaleDateString("tr-TR") : "—"}</td>
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
            {filteredEmergencyPlans.length === 0 && (
              <tr>
                <td colSpan={11} style={{ ...styles.td, color: "var(--isg-text-muted)", textAlign: "center", padding: 24 }}>Henüz acil durum planı yok.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
