import React, { useEffect, useState } from "react";
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
          <FormField label="Ziyaret Tarihi *"><DatePicker styles={styles} value={newCompanyVisit.visitDate} onChange={v => setNewCompanyVisit({ ...newCompanyVisit, visitDate: v })} /></FormField>
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
          <FormField label="Sonraki Ziyaret"><DatePicker styles={styles} value={newCompanyVisit.nextVisitDate} onChange={v => setNewCompanyVisit({ ...newCompanyVisit, nextVisitDate: v })} /></FormField>
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
        <span style={{ color: "var(--isg-text-muted)", fontSize: 13 }}>{filteredCompanyVisits.length} ziyaret</span>
      </div>

      <div style={{ ...styles.card, padding: 0, overflow: "auto", WebkitOverflowScrolling: "touch" as any }}>
        <table style={styles.table}>
          <thead><tr>{["Firma", "Tarih", "Amaç", "Ziyaret Eden", "Görüşülen", "Durum", "Tespit / Aksiyon", "Sonraki", "Çıktı", "İşlem"].map(h => <th key={h} style={styles.th} className="isg-th">{h}</th>)}</tr></thead>
          <tbody>
            {filteredCompanyVisits.map(visit => {
              const company = companies.find(c => c.id === visit.companyId);
              return (
                <tr key={visit.id}>
                  <td style={styles.td} className="isg-td">{company?.nickName || "—"}</td>
                  <td style={styles.td} className="isg-td">{visit.visitDate ? new Date(visit.visitDate).toLocaleDateString("tr-TR") : "—"}</td>
                  <td style={styles.td} className="isg-td"><Badge text={visit.purpose} color="#0ea5e9" /></td>
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
                  <td style={styles.td} className="isg-td">{visit.nextVisitDate ? new Date(visit.nextVisitDate).toLocaleDateString("tr-TR") : "—"}</td>
                  <td style={styles.td} className="isg-td"><button style={styles.btnSecondary} onClick={() => generateCompanyVisitPDF(visit, company)}>Ziyaret PDF</button></td>
                  <td style={styles.td} className="isg-td"><button style={styles.btnDanger} onClick={() => deleteCompanyVisit(visit.id)}>Sil</button></td>
                </tr>
              );
            })}
            {filteredCompanyVisits.length === 0 && (
              <tr>
                <td colSpan={10} style={{ ...styles.td, color: "var(--isg-text-muted)", textAlign: "center", padding: 24 }}>Henüz firma ziyareti kaydı yok.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
