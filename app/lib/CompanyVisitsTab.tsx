import React from "react";
import { IsoTarihSecici } from "./TarihSecici";
import { formatDate } from "./dateUtils";
import { EmptyTableRow } from "./EmptyState";
import { generateCompanyVisitPDF } from "./pdf";
import type { Company, CompanyVisitPurpose, CompanyVisitRecord, CompanyVisitStatus } from "./types";

type CompanyVisitDraft = {
  companyId: string;
  visitDate: string;
  purpose: CompanyVisitPurpose;
  visitor: string;
  contactedPerson: string;
  findings: string;
  actions: string;
  nextVisitDate: string;
  status: CompanyVisitStatus;
  notes: string;
};

type CompanyVisitsTabProps = {
  styles: Record<string, React.CSSProperties>;
  companies: Company[];
  filteredCompanyVisits: CompanyVisitRecord[];
  newCompanyVisit: CompanyVisitDraft;
  setNewCompanyVisit: React.Dispatch<React.SetStateAction<CompanyVisitDraft>>;
  search: string;
  setSearch: (value: string) => void;
  selectedCompanyId: string;
  setSelectedCompanyId: (value: string) => void;
  addCompanyVisit: () => void;
  updateCompanyVisitStatus: (id: string, status: CompanyVisitStatus) => void;
  deleteCompanyVisit: (id: string) => void;
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

export function CompanyVisitsTab({
  styles,
  companies,
  filteredCompanyVisits,
  newCompanyVisit,
  setNewCompanyVisit,
  search,
  setSearch,
  selectedCompanyId,
  setSelectedCompanyId,
  addCompanyVisit,
  updateCompanyVisitStatus,
  deleteCompanyVisit,
}: CompanyVisitsTabProps) {
  const [purposeFilter, setPurposeFilter] = React.useState<"all" | CompanyVisitPurpose>("all");
  const [statusFilter, setStatusFilter] = React.useState<"all" | CompanyVisitStatus>("all");
  const visitStatusColor = (status: "all" | CompanyVisitStatus) =>
    status === "Tamamlandı" ? "#2D6A4F"
      : status === "Takip Gerekli" ? "#D4A017"
        : status === "Ertelendi" ? "#C0392B"
          : status === "all" ? "#52d3b5"
            : "#1B4332";
  const visitPurposeColor = (purpose: "all" | CompanyVisitPurpose) =>
    purpose === "Acil Ziyaret" ? "#C0392B"
      : purpose === "Risk Kontrolü" ? "#D4A017"
        : purpose === "DÖF Takibi" ? "#7c3aed"
          : purpose === "Eğitim / Bilgilendirme" ? "#0ea5e9"
            : purpose === "all" ? "#52d3b5"
              : "#1B4332";
  const visibleCompanyVisits = React.useMemo(() => filteredCompanyVisits.filter(visit => {
    const matchesPurpose = purposeFilter === "all" || visit.purpose === purposeFilter;
    const matchesStatus = statusFilter === "all" || visit.status === statusFilter;
    return matchesPurpose && matchesStatus;
  }), [filteredCompanyVisits, purposeFilter, statusFilter]);
  const purposeFilters: Array<{ value: "all" | CompanyVisitPurpose; label: string; count: number; color: string }> = (["all", "Rutin Ziyaret", "Risk Kontrolü", "Eğitim / Bilgilendirme", "DÖF Takibi", "Acil Ziyaret"] as const).map(purpose => ({
    value: purpose,
    label: purpose === "all" ? "Tüm Amaçlar" : purpose,
    count: purpose === "all" ? filteredCompanyVisits.length : filteredCompanyVisits.filter(visit => visit.purpose === purpose).length,
    color: visitPurposeColor(purpose),
  }));
  const statusFilters: Array<{ value: "all" | CompanyVisitStatus; label: string; count: number; color: string }> = (["all", "Planlandı", "Tamamlandı", "Ertelendi", "Takip Gerekli"] as const).map(status => ({
    value: status,
    label: status === "all" ? "Tüm Durumlar" : status,
    count: status === "all" ? filteredCompanyVisits.length : filteredCompanyVisits.filter(visit => visit.status === status).length,
    color: visitStatusColor(status),
  }));

  return (
    <div>
      <div style={styles.card} className="isg-card">
        <p style={styles.sectionTitle} className="isg-text-muted">Firma Ziyareti Planla</p>
        <div style={styles.formGrid}>
          <FormField label="Firma *">
            <select style={styles.select} className="isg-input" value={newCompanyVisit.companyId} onChange={e => setNewCompanyVisit({ ...newCompanyVisit, companyId: e.target.value })}>
              <option value="">Seçin...</option>
              {companies.map(c => <option key={c.id} value={c.id}>{c.nickName}</option>)}
            </select>
          </FormField>
          <FormField label="Ziyaret Tarihi *"><IsoTarihSecici allowFuture styles={styles} value={newCompanyVisit.visitDate} onChange={v => setNewCompanyVisit({ ...newCompanyVisit, visitDate: v })} /></FormField>
          <FormField label="Ziyaret Amacı">
            <select style={styles.select} className="isg-input" value={newCompanyVisit.purpose} onChange={e => setNewCompanyVisit({ ...newCompanyVisit, purpose: e.target.value as CompanyVisitPurpose })}>
              <option>Rutin Ziyaret</option>
              <option>Risk Kontrolü</option>
              <option>Eğitim / Bilgilendirme</option>
              <option>DÖF Takibi</option>
              <option>Acil Ziyaret</option>
            </select>
          </FormField>
          <FormField label="Ziyaret Eden *"><input style={styles.input} className="isg-input" value={newCompanyVisit.visitor} onChange={e => setNewCompanyVisit({ ...newCompanyVisit, visitor: e.target.value })} placeholder="Ad Soyad" /></FormField>
          <FormField label="Görüşülen Kişi"><input style={styles.input} className="isg-input" value={newCompanyVisit.contactedPerson} onChange={e => setNewCompanyVisit({ ...newCompanyVisit, contactedPerson: e.target.value })} placeholder="Firma yetkilisi" /></FormField>
          <FormField label="Durum">
            <select style={styles.select} className="isg-input" value={newCompanyVisit.status} onChange={e => setNewCompanyVisit({ ...newCompanyVisit, status: e.target.value as CompanyVisitStatus })}>
              <option>Planlandı</option>
              <option>Tamamlandı</option>
              <option>Ertelendi</option>
              <option>Takip Gerekli</option>
            </select>
          </FormField>
          <FormField label="Sonraki Ziyaret"><IsoTarihSecici allowFuture styles={styles} value={newCompanyVisit.nextVisitDate} onChange={v => setNewCompanyVisit({ ...newCompanyVisit, nextVisitDate: v })} /></FormField>
          <FormField label="Tespitler"><input style={styles.input} className="isg-input" value={newCompanyVisit.findings} onChange={e => setNewCompanyVisit({ ...newCompanyVisit, findings: e.target.value })} placeholder="Sahada görülen durumlar" /></FormField>
          <FormField label="Aksiyonlar"><input style={styles.input} className="isg-input" value={newCompanyVisit.actions} onChange={e => setNewCompanyVisit({ ...newCompanyVisit, actions: e.target.value })} placeholder="Alınacak aksiyonlar" /></FormField>
          <FormField label="Not"><input style={styles.input} className="isg-input" value={newCompanyVisit.notes} onChange={e => setNewCompanyVisit({ ...newCompanyVisit, notes: e.target.value })} placeholder="Ek açıklama" /></FormField>
        </div>
        <div style={{ marginTop: 12, display: "flex", gap: 10, flexWrap: "wrap" }}>
          <button style={styles.btnPrimary} onClick={addCompanyVisit}>Ziyaret Kaydı Ekle</button>
        </div>
      </div>

      <div style={styles.searchBar}>
        <input style={{ ...styles.input, maxWidth: 300 }} placeholder="Ara..." value={search} onChange={e => setSearch(e.target.value)} />
        <select style={{ ...styles.select, maxWidth: 180 }} value={selectedCompanyId} onChange={e => setSelectedCompanyId(e.target.value)}><option value="all">Tüm Firmalar</option>{companies.map(c => <option key={c.id} value={c.id}>{c.nickName}</option>)}</select>
        <span style={{ color: "var(--isg-text-muted)", fontSize: 13 }}>{visibleCompanyVisits.length} ziyaret</span>
      </div>

      <div style={{ ...styles.card, padding: 14, marginBottom: 16 }} className="isg-card">
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(min(280px, 100%), 1fr))", gap: 14 }}>
          <div>
            <div style={{ ...styles.label, marginBottom: 8 }} className="isg-label">Amaç Filtresi</div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
              {purposeFilters.map(filter => {
                const active = purposeFilter === filter.value;
                return (
                  <button
                    key={filter.value}
                    type="button"
                    onClick={() => setPurposeFilter(filter.value)}
                    style={{
                      minHeight: 44,
                      borderRadius: 12,
                      border: `1px solid ${active ? filter.color : "var(--isg-border)"}`,
                      backgroundColor: active ? filter.color + "18" : "var(--isg-input-bg)",
                      color: active ? filter.color : "var(--isg-text)",
                      fontWeight: 800,
                      padding: "8px 12px",
                      cursor: "pointer",
                      transition: "all 0.2s ease",
                    }}
                  >
                    {filter.label} <span style={{ color: active ? filter.color : "var(--isg-text-muted)" }}>({filter.count})</span>
                  </button>
                );
              })}
            </div>
          </div>
          <div>
            <div style={{ ...styles.label, marginBottom: 8 }} className="isg-label">Durum Filtresi</div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
              {statusFilters.map(filter => {
                const active = statusFilter === filter.value;
                return (
                  <button
                    key={filter.value}
                    type="button"
                    onClick={() => setStatusFilter(filter.value)}
                    style={{
                      minHeight: 44,
                      borderRadius: 12,
                      border: `1px solid ${active ? filter.color : "var(--isg-border)"}`,
                      backgroundColor: active ? filter.color + "18" : "var(--isg-input-bg)",
                      color: active ? filter.color : "var(--isg-text)",
                      fontWeight: 800,
                      padding: "8px 12px",
                      cursor: "pointer",
                      transition: "all 0.2s ease",
                    }}
                  >
                    {filter.label} <span style={{ color: active ? filter.color : "var(--isg-text-muted)" }}>({filter.count})</span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      <div style={{ ...styles.card, padding: 0, overflow: "auto", WebkitOverflowScrolling: "touch" as any }}>
        <table style={styles.table}>
          <thead><tr>{["Firma", "Tarih", "Amaç", "Ziyaret Eden", "Görüşülen", "Durum", "Tespit / Aksiyon", "Sonraki", "Çıktı", "İşlem"].map(h => <th key={h} style={styles.th} className="isg-th">{h}</th>)}</tr></thead>
          <tbody>
            {visibleCompanyVisits.map(visit => {
              const company = companies.find(c => c.id === visit.companyId);
              return (
                <tr key={visit.id}>
                  <td style={styles.td} className="isg-td">{company?.nickName || "—"}</td>
                  <td style={styles.td} className="isg-td">{formatDate(visit.visitDate)}</td>
                  <td style={styles.td} className="isg-td"><Badge text={visit.purpose} color={visitPurposeColor(visit.purpose)} /></td>
                  <td style={styles.td} className="isg-td">{visit.visitor || "—"}</td>
                  <td style={styles.td} className="isg-td">{visit.contactedPerson || "—"}</td>
                  <td style={styles.td} className="isg-td">
                    <select style={{ ...styles.select, minWidth: 150 }} value={visit.status} onChange={e => updateCompanyVisitStatus(visit.id, e.target.value as CompanyVisitStatus)}>
                      <option>Planlandı</option>
                      <option>Tamamlandı</option>
                      <option>Ertelendi</option>
                      <option>Takip Gerekli</option>
                    </select>
                  </td>
                  <td style={{ ...styles.td, minWidth: 260, color: "var(--isg-text-muted)" }} className="isg-td">{[visit.findings, visit.actions, visit.notes].filter(Boolean).join(" / ") || "—"}</td>
                  <td style={styles.td} className="isg-td">{formatDate(visit.nextVisitDate)}</td>
                  <td style={styles.td} className="isg-td"><button style={styles.btnSecondary} onClick={() => generateCompanyVisitPDF(visit, company)}>Ziyaret PDF</button></td>
                  <td style={styles.td} className="isg-td"><button style={styles.btnDanger} onClick={() => deleteCompanyVisit(visit.id)}>Sil</button></td>
                </tr>
              );
            })}
            {visibleCompanyVisits.length === 0 && (
              <EmptyTableRow colSpan={10} message="Yeni firma ziyareti eklemek için yukarıdaki formu kullanın." />
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
