import React, { useEffect, useState } from "react";
import { documentTemplates } from "./constants";
import { daysUntil, getDateStatus, statusColor } from "./dashboardUtils";
import { EmptyTableRow } from "./EmptyState";
import type { Company, DocumentRecord, Employee } from "./types";

type DocumentDraft = {
  companyId: string;
  employeeId: string;
  type: string;
  issueDate: string;
  expiryDate: string;
};

type DocumentsTabProps = {
  styles: Record<string, React.CSSProperties>;
  companies: Company[];
  employees: Employee[];
  filteredDocuments: DocumentRecord[];
  newDocument: DocumentDraft;
  setNewDocument: React.Dispatch<React.SetStateAction<DocumentDraft>>;
  search: string;
  setSearch: (value: string) => void;
  selectedCompanyId: string;
  setSelectedCompanyId: (value: string) => void;
  addDocument: () => void;
  deleteDocument: (id: string) => void;
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

export function DocumentsTab({
  styles,
  companies,
  employees,
  filteredDocuments,
  newDocument,
  setNewDocument,
  search,
  setSearch,
  selectedCompanyId,
  setSelectedCompanyId,
  addDocument,
  deleteDocument,
}: DocumentsTabProps) {
  return (
    <div>
      <div style={styles.card} className="isg-card">
        <p style={styles.sectionTitle} className="isg-text-muted">Yeni Belge Ekle</p>
        <div style={styles.formGrid}>
          <FormField label="Firma *"><select style={styles.select} className="isg-input" value={newDocument.companyId} onChange={e => setNewDocument({ ...newDocument, companyId: e.target.value })}><option value="">Seçin...</option>{companies.map(c => <option key={c.id} value={c.id}>{c.nickName}</option>)}</select></FormField>
          <FormField label="Belge Türü *"><select style={styles.select} className="isg-input" value={newDocument.type} onChange={e => setNewDocument({ ...newDocument, type: e.target.value })}>{documentTemplates.map(t => <option key={t}>{t}</option>)}</select></FormField>
          <FormField label="Personel (opsiyonel)"><select style={styles.select} className="isg-input" value={newDocument.employeeId} onChange={e => setNewDocument({ ...newDocument, employeeId: e.target.value })}><option value="">Firma Belgesi</option>{employees.filter(e => !newDocument.companyId || e.companyId === newDocument.companyId).map(e => <option key={e.id} value={e.id}>{e.firstName} {e.lastName}</option>)}</select></FormField>
          <FormField label="Düzenleme Tarihi *"><DatePicker styles={styles} value={newDocument.issueDate} onChange={v => setNewDocument({ ...newDocument, issueDate: v })} /></FormField>
          <FormField label="Geçerlilik Tarihi"><DatePicker styles={styles} value={newDocument.expiryDate} onChange={v => setNewDocument({ ...newDocument, expiryDate: v })} /></FormField>
        </div>
        <div style={{ marginTop: 12 }}><button style={styles.btnPrimary} onClick={addDocument}>Belge Ekle</button></div>
      </div>
      <div style={styles.searchBar}>
        <input style={{ ...styles.input, maxWidth: 240 }} placeholder="Ara..." value={search} onChange={e => setSearch(e.target.value)} />
        <select style={{ ...styles.select, maxWidth: 180 }} value={selectedCompanyId} onChange={e => setSelectedCompanyId(e.target.value)}><option value="all">Tüm Firmalar</option>{companies.map(c => <option key={c.id} value={c.id}>{c.nickName}</option>)}</select>
        <span style={{ color: "#6B7280", fontSize: 13 }}>{filteredDocuments.length} belge</span>
      </div>
      <div style={{ ...styles.card, padding: 0, overflow: "auto", WebkitOverflowScrolling: "touch" as any }}>
        <table style={styles.table}>
          <thead><tr>{["Belge Türü", "Firma", "Personel", "Düzenleme", "Geçerlilik", "Durum", "İşlem"].map(h => <th key={h} style={styles.th} className="isg-th">{h}</th>)}</tr></thead>
          <tbody>
            {filteredDocuments.map(d => {
              const company = companies.find(c => c.id === d.companyId);
              const emp = employees.find(e => e.id === d.employeeId);
              const ds = d.expiryDate ? getDateStatus(d.expiryDate) : "—";
              const days = d.expiryDate ? daysUntil(d.expiryDate) : null;
              return (
                <tr key={d.id}>
                  <td style={{ ...styles.td, fontWeight: 500 }}>{d.type}</td>
                  <td style={styles.td} className="isg-td">{company?.nickName}</td>
                  <td style={{ ...styles.td, fontSize: 12, color: "var(--isg-text-muted)" }}>{emp ? `${emp.firstName} ${emp.lastName}` : "—"}</td>
                  <td style={{ ...styles.td, fontSize: 12 }}>{d.issueDate}</td>
                  <td style={{ ...styles.td, fontSize: 12 }}>{d.expiryDate || "—"}</td>
                  <td style={styles.td} className="isg-td">{d.expiryDate ? <div><Badge text={ds} color={statusColor(ds)} />{days !== null && days >= 0 && <div style={{ fontSize: 11, color: "#6B7280", marginTop: 2 }}>{days} gün</div>}</div> : "—"}</td>
                  <td style={styles.td} className="isg-td"><button style={styles.btnDanger} onClick={() => deleteDocument(d.id)}>Sil</button></td>
                </tr>
              );
            })}
            {filteredDocuments.length === 0 && (
              <EmptyTableRow colSpan={7} message="Yeni belge eklemek için yukarıdaki formu kullanın." />
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
