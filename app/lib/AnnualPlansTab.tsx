import React from "react";
import { IsoTarihSecici } from "./TarihSecici";
import { formatDate } from "./dateUtils";
import { EmptyTableRow } from "./EmptyState";
import { generateAnnualPlanPDF } from "./pdf";
import type { AnnualPlanRecord, AnnualPlanStatus, AnnualPlanType, Company } from "./types";

type Styles = Record<string, React.CSSProperties>;

type AnnualPlanDraft = {
  companyId: string;
  year: string;
  type: AnnualPlanType;
  title: string;
  plannedDate: string;
  responsible: string;
  status: AnnualPlanStatus;
  notes: string;
};

function FormField({ styles, label, children }: { styles: Styles; label: string; children: React.ReactNode }) {
  return <div><label style={styles.label} className="isg-label">{label}</label>{children}</div>;
}

function Badge({ styles, text, color }: { styles: Styles; text: string; color: string }) {
  return <span style={{ ...styles.badge, backgroundColor: color + "22", color, border: "1px solid " + color + "44" }}>{text}</span>;
}

const planTypeColor = (type: "all" | AnnualPlanType) =>
  type === "Risk Değerlendirme" ? "#C0392B"
    : type === "Acil Durum Tatbikatı" ? "#D4A017"
      : type === "Eğitim" ? "#0ea5e9"
        : type === "all" ? "#52d3b5"
          : "#2D6A4F";

const planStatusColor = (status: "all" | AnnualPlanStatus) =>
  status === "Tamamlandı" ? "#2D6A4F"
    : status === "Gecikti" ? "#C0392B"
      : status === "Devam Ediyor" ? "#D4A017"
        : status === "all" ? "#52d3b5"
          : "#0ea5e9";

export function AnnualPlansTab({
  styles,
  companies,
  filteredAnnualPlans,
  newAnnualPlan,
  setNewAnnualPlan,
  search,
  setSearch,
  selectedCompanyId,
  setSelectedCompanyId,
  addAnnualPlan,
  updateAnnualPlanStatus,
  deleteAnnualPlan,
}: {
  styles: Styles;
  companies: Company[];
  filteredAnnualPlans: AnnualPlanRecord[];
  newAnnualPlan: AnnualPlanDraft;
  setNewAnnualPlan: (value: AnnualPlanDraft) => void;
  search: string;
  setSearch: (value: string) => void;
  selectedCompanyId: string;
  setSelectedCompanyId: (value: string) => void;
  addAnnualPlan: () => void;
  updateAnnualPlanStatus: (id: string, status: AnnualPlanStatus) => void;
  deleteAnnualPlan: (id: string) => void;
}) {
  const [yearFilter, setYearFilter] = React.useState("all");
  const [typeFilter, setTypeFilter] = React.useState<"all" | AnnualPlanType>("all");
  const [statusFilter, setStatusFilter] = React.useState<"all" | AnnualPlanStatus>("all");

  const visibleAnnualPlans = React.useMemo(() => filteredAnnualPlans.filter(plan => {
    const matchesYear = yearFilter === "all" || String(plan.year) === yearFilter;
    const matchesType = typeFilter === "all" || plan.type === typeFilter;
    const matchesStatus = statusFilter === "all" || plan.status === statusFilter;
    return matchesYear && matchesType && matchesStatus;
  }), [filteredAnnualPlans, statusFilter, typeFilter, yearFilter]);

  const yearFilters = [
    { value: "all", label: "Tüm Yıllar", count: filteredAnnualPlans.length, color: "#52d3b5" },
    ...Array.from(new Set(filteredAnnualPlans.map(plan => String(plan.year)).filter(Boolean))).sort().map(year => ({
      value: year,
      label: year,
      count: filteredAnnualPlans.filter(plan => String(plan.year) === year).length,
      color: "#0ea5e9",
    })),
  ];

  const typeFilters: Array<{ value: "all" | AnnualPlanType; label: string; count: number; color: string }> = (
    ["all", "Eğitim", "Muayene", "Risk Değerlendirme", "Acil Durum Tatbikatı", "Kurul Toplantısı", "Saha Ziyareti", "Belge Yenileme"] as const
  ).map(type => ({
    value: type,
    label: type === "all" ? "Tüm Türler" : type,
    count: type === "all" ? filteredAnnualPlans.length : filteredAnnualPlans.filter(plan => plan.type === type).length,
    color: planTypeColor(type),
  }));

  const statusFilters: Array<{ value: "all" | AnnualPlanStatus; label: string; count: number; color: string }> = (
    ["all", "Planlandı", "Devam Ediyor", "Tamamlandı", "Gecikti"] as const
  ).map(status => ({
    value: status,
    label: status === "all" ? "Tüm Durumlar" : status,
    count: status === "all" ? filteredAnnualPlans.length : filteredAnnualPlans.filter(plan => plan.status === status).length,
    color: planStatusColor(status),
  }));

  return (
    <div>
      <div style={styles.card} className="isg-card">
        <p style={styles.sectionTitle} className="isg-text-muted">Yıllık İSG Planı</p>
        <div style={styles.formGrid}>
          <FormField styles={styles} label="Firma *"><select style={styles.select} className="isg-input" value={newAnnualPlan.companyId} onChange={e => setNewAnnualPlan({ ...newAnnualPlan, companyId: e.target.value })}><option value="">Seçin...</option>{companies.map(c => <option key={c.id} value={c.id}>{c.nickName}</option>)}</select></FormField>
          <FormField styles={styles} label="Plan Yılı"><input style={styles.input} className="isg-input" type="number" value={newAnnualPlan.year} onChange={e => setNewAnnualPlan({ ...newAnnualPlan, year: e.target.value })} /></FormField>
          <FormField styles={styles} label="Plan Türü"><select style={styles.select} className="isg-input" value={newAnnualPlan.type} onChange={e => setNewAnnualPlan({ ...newAnnualPlan, type: e.target.value as AnnualPlanType })}><option>Eğitim</option><option>Muayene</option><option>Risk Değerlendirme</option><option>Acil Durum Tatbikatı</option><option>Kurul Toplantısı</option><option>Saha Ziyareti</option><option>Belge Yenileme</option></select></FormField>
          <FormField styles={styles} label="Başlık *"><input style={styles.input} className="isg-input" value={newAnnualPlan.title} onChange={e => setNewAnnualPlan({ ...newAnnualPlan, title: e.target.value })} placeholder="Örn. Temel İSG eğitimi" /></FormField>
          <FormField styles={styles} label="Planlanan Tarih *"><IsoTarihSecici allowFuture styles={styles} value={newAnnualPlan.plannedDate} onChange={v => setNewAnnualPlan({ ...newAnnualPlan, plannedDate: v })} /></FormField>
          <FormField styles={styles} label="Sorumlu"><input style={styles.input} className="isg-input" value={newAnnualPlan.responsible} onChange={e => setNewAnnualPlan({ ...newAnnualPlan, responsible: e.target.value })} placeholder="Doktor, İSG uzmanı..." /></FormField>
          <FormField styles={styles} label="Durum"><select style={styles.select} className="isg-input" value={newAnnualPlan.status} onChange={e => setNewAnnualPlan({ ...newAnnualPlan, status: e.target.value as AnnualPlanStatus })}><option>Planlandı</option><option>Devam Ediyor</option><option>Tamamlandı</option><option>Gecikti</option></select></FormField>
          <FormField styles={styles} label="Not"><input style={styles.input} className="isg-input" value={newAnnualPlan.notes} onChange={e => setNewAnnualPlan({ ...newAnnualPlan, notes: e.target.value })} placeholder="Kısa açıklama" /></FormField>
        </div>
        <div style={{ marginTop: 12, display: "flex", gap: 10, flexWrap: "wrap" }}>
          <button style={styles.btnPrimary} onClick={addAnnualPlan}>Plan Kalemi Ekle</button>
          <button style={styles.btnSecondary} onClick={() => generateAnnualPlanPDF(visibleAnnualPlans, companies)}>PDF İndir</button>
        </div>
      </div>

      <div style={styles.searchBar}>
        <input style={{ ...styles.input, maxWidth: 300 }} placeholder="Ara..." value={search} onChange={e => setSearch(e.target.value)} />
        <select style={{ ...styles.select, maxWidth: 180 }} value={selectedCompanyId} onChange={e => setSelectedCompanyId(e.target.value)}><option value="all">Tüm Firmalar</option>{companies.map(c => <option key={c.id} value={c.id}>{c.nickName}</option>)}</select>
        <span style={{ color: "var(--isg-text-muted)", fontSize: 13 }}>{visibleAnnualPlans.length} plan kalemi</span>
      </div>

      <div style={{ ...styles.card, padding: 14, marginBottom: 16 }} className="isg-card">
        <div style={{ display: "grid", gap: 14 }}>
          {[
            { title: "Yıl Filtresi", filters: yearFilters, value: yearFilter, onChange: setYearFilter },
            { title: "Tür Filtresi", filters: typeFilters, value: typeFilter, onChange: setTypeFilter },
            { title: "Durum Filtresi", filters: statusFilters, value: statusFilter, onChange: setStatusFilter },
          ].map(group => (
            <div key={group.title}>
              <div style={{ ...styles.label, marginBottom: 8 }} className="isg-label">{group.title}</div>
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                {group.filters.map(filter => {
                  const active = group.value === filter.value;
                  return (
                    <button
                      key={filter.value}
                      type="button"
                      onClick={() => group.onChange(filter.value as never)}
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
          ))}
        </div>
      </div>

      <div style={{ ...styles.card, padding: 0, overflow: "auto", WebkitOverflowScrolling: "touch" as any }}>
        <table style={styles.table}>
          <thead><tr>{["Firma", "Yıl", "Tür", "Başlık", "Tarih", "Sorumlu", "Durum", "Not", "İşlem"].map(h => <th key={h} style={styles.th} className="isg-th">{h}</th>)}</tr></thead>
          <tbody>
            {visibleAnnualPlans.map(plan => {
              const company = companies.find(c => c.id === plan.companyId);
              return (
                <tr key={plan.id}>
                  <td style={styles.td} className="isg-td">{company?.nickName || "—"}</td>
                  <td style={styles.td} className="isg-td">{plan.year}</td>
                  <td style={styles.td} className="isg-td"><Badge styles={styles} text={plan.type} color={planTypeColor(plan.type)} /></td>
                  <td style={{ ...styles.td, minWidth: 180 }} className="isg-td"><strong>{plan.title}</strong></td>
                  <td style={styles.td} className="isg-td">{formatDate(plan.plannedDate)}</td>
                  <td style={styles.td} className="isg-td">{plan.responsible || "—"}</td>
                  <td style={styles.td} className="isg-td"><select style={{ ...styles.select, minWidth: 132 }} value={plan.status} onChange={e => updateAnnualPlanStatus(plan.id, e.target.value as AnnualPlanStatus)}><option>Planlandı</option><option>Devam Ediyor</option><option>Tamamlandı</option><option>Gecikti</option></select></td>
                  <td style={{ ...styles.td, color: "var(--isg-text-muted)", minWidth: 160 }}>{plan.notes || "—"}</td>
                  <td style={styles.td} className="isg-td"><button style={styles.btnDanger} onClick={() => deleteAnnualPlan(plan.id)}>Sil</button></td>
                </tr>
              );
            })}
            {visibleAnnualPlans.length === 0 && (
              <EmptyTableRow colSpan={9} message="Yeni yıllık plan kalemi eklemek için yukarıdaki formu kullanın." />
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
