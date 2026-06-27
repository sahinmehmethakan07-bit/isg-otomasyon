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
          <button style={styles.btnSecondary} onClick={() => generateAnnualPlanPDF(filteredAnnualPlans, companies)}>PDF İndir</button>
        </div>
      </div>

      <div style={styles.searchBar}>
        <input style={{ ...styles.input, maxWidth: 300 }} placeholder="Ara..." value={search} onChange={e => setSearch(e.target.value)} />
        <select style={{ ...styles.select, maxWidth: 180 }} value={selectedCompanyId} onChange={e => setSelectedCompanyId(e.target.value)}><option value="all">Tüm Firmalar</option>{companies.map(c => <option key={c.id} value={c.id}>{c.nickName}</option>)}</select>
        <span style={{ color: "var(--isg-text-muted)", fontSize: 13 }}>{filteredAnnualPlans.length} plan kalemi</span>
      </div>

      <div style={{ ...styles.card, padding: 0, overflow: "auto", WebkitOverflowScrolling: "touch" as any }}>
        <table style={styles.table}>
          <thead><tr>{["Firma", "Yıl", "Tür", "Başlık", "Tarih", "Sorumlu", "Durum", "Not", "İşlem"].map(h => <th key={h} style={styles.th} className="isg-th">{h}</th>)}</tr></thead>
          <tbody>
            {filteredAnnualPlans.map(plan => {
              const company = companies.find(c => c.id === plan.companyId);
              return (
                <tr key={plan.id}>
                  <td style={styles.td} className="isg-td">{company?.nickName || "—"}</td>
                  <td style={styles.td} className="isg-td">{plan.year}</td>
                  <td style={styles.td} className="isg-td"><Badge styles={styles} text={plan.type} color="#1B4332" /></td>
                  <td style={{ ...styles.td, minWidth: 180 }} className="isg-td"><strong>{plan.title}</strong></td>
                  <td style={styles.td} className="isg-td">{formatDate(plan.plannedDate)}</td>
                  <td style={styles.td} className="isg-td">{plan.responsible || "—"}</td>
                  <td style={styles.td} className="isg-td"><select style={{ ...styles.select, minWidth: 132 }} value={plan.status} onChange={e => updateAnnualPlanStatus(plan.id, e.target.value as AnnualPlanStatus)}><option>Planlandı</option><option>Devam Ediyor</option><option>Tamamlandı</option><option>Gecikti</option></select></td>
                  <td style={{ ...styles.td, color: "var(--isg-text-muted)", minWidth: 160 }}>{plan.notes || "—"}</td>
                  <td style={styles.td} className="isg-td"><button style={styles.btnDanger} onClick={() => deleteAnnualPlan(plan.id)}>Sil</button></td>
                </tr>
              );
            })}
            {filteredAnnualPlans.length === 0 && (
              <EmptyTableRow colSpan={9} message="Yeni yıllık plan kalemi eklemek için yukarıdaki formu kullanın." />
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
