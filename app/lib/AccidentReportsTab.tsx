import React, { useEffect, useState } from "react";
import { formatDate } from "./dateUtils";
import { EmptyTableRow } from "./EmptyState";
import { generateAccidentReportPDF } from "./pdf";
import type { AccidentReportRecord, AccidentReportStatus, AccidentSeverity, Company, Employee } from "./types";

type AccidentReportDraft = {
  companyId: string;
  employeeId: string;
  accidentDate: string;
  location: string;
  severity: AccidentSeverity;
  incidentType: string;
  description: string;
  rootCause: string;
  actionPlan: string;
  responsible: string;
  dueDate: string;
  status: AccidentReportStatus;
  notes: string;
};

type AccidentReportsTabProps = {
  styles: Record<string, React.CSSProperties>;
  companies: Company[];
  employees: Employee[];
  filteredAccidentReports: AccidentReportRecord[];
  newAccidentReport: AccidentReportDraft;
  setNewAccidentReport: React.Dispatch<React.SetStateAction<AccidentReportDraft>>;
  search: string;
  setSearch: (value: string) => void;
  selectedCompanyId: string;
  setSelectedCompanyId: (value: string) => void;
  addAccidentReport: () => void;
  updateAccidentReportStatus: (id: string, status: AccidentReportStatus) => void;
  deleteAccidentReport: (id: string) => void;
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
    setDisplayValue(formatDate(value, ""));
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

export function AccidentReportsTab({
  styles,
  companies,
  employees,
  filteredAccidentReports,
  newAccidentReport,
  setNewAccidentReport,
  search,
  setSearch,
  selectedCompanyId,
  setSelectedCompanyId,
  addAccidentReport,
  updateAccidentReportStatus,
  deleteAccidentReport,
}: AccidentReportsTabProps) {
  return (
    <div>
      <div style={styles.card} className="isg-card">
        <p style={styles.sectionTitle} className="isg-text-muted">İş Kazası / Ramak Kala Raporu</p>
        <div style={styles.formGrid}>
          <FormField label="Firma *">
            <select style={styles.select} className="isg-input" value={newAccidentReport.companyId} onChange={e => setNewAccidentReport({ ...newAccidentReport, companyId: e.target.value, employeeId: "" })}>
              <option value="">Seçin...</option>
              {companies.map(c => <option key={c.id} value={c.id}>{c.nickName}</option>)}
            </select>
          </FormField>
          <FormField label="Personel">
            <select style={styles.select} className="isg-input" value={newAccidentReport.employeeId} onChange={e => setNewAccidentReport({ ...newAccidentReport, employeeId: e.target.value })}>
              <option value="">Seçin...</option>
              {employees.filter(employee => employee.companyId === newAccidentReport.companyId).map(employee => <option key={employee.id} value={employee.id}>{employee.firstName} {employee.lastName}</option>)}
            </select>
          </FormField>
          <FormField label="Olay Tarihi *"><DatePicker styles={styles} value={newAccidentReport.accidentDate} onChange={v => setNewAccidentReport({ ...newAccidentReport, accidentDate: v })} /></FormField>
          <FormField label="Olay Yeri"><input style={styles.input} className="isg-input" value={newAccidentReport.location} onChange={e => setNewAccidentReport({ ...newAccidentReport, location: e.target.value })} placeholder="Bölüm, saha, alan..." /></FormField>
          <FormField label="Olay Türü">
            <select style={styles.select} className="isg-input" value={newAccidentReport.incidentType} onChange={e => setNewAccidentReport({ ...newAccidentReport, incidentType: e.target.value })}>
              <option>İş Kazası</option>
              <option>Ramak Kala</option>
              <option>Meslek Hastalığı Şüphesi</option>
              <option>Malzeme Hasarı</option>
              <option>Diğer</option>
            </select>
          </FormField>
          <FormField label="Şiddet">
            <select style={styles.select} className="isg-input" value={newAccidentReport.severity} onChange={e => setNewAccidentReport({ ...newAccidentReport, severity: e.target.value as AccidentSeverity })}>
              <option>Ramak Kala</option>
              <option>Hafif</option>
              <option>Orta</option>
              <option>Ağır</option>
            </select>
          </FormField>
          <FormField label="Durum">
            <select style={styles.select} className="isg-input" value={newAccidentReport.status} onChange={e => setNewAccidentReport({ ...newAccidentReport, status: e.target.value as AccidentReportStatus })}>
              <option>Açık</option>
              <option>İncelemede</option>
              <option>Aksiyon Planlandı</option>
              <option>Kapandı</option>
            </select>
          </FormField>
          <FormField label="Aksiyon Sorumlusu"><input style={styles.input} className="isg-input" value={newAccidentReport.responsible} onChange={e => setNewAccidentReport({ ...newAccidentReport, responsible: e.target.value })} placeholder="Ad Soyad / birim" /></FormField>
          <FormField label="Termin"><DatePicker styles={styles} value={newAccidentReport.dueDate} onChange={v => setNewAccidentReport({ ...newAccidentReport, dueDate: v })} /></FormField>
          <FormField label="Olay Açıklaması *"><input style={styles.input} className="isg-input" value={newAccidentReport.description} onChange={e => setNewAccidentReport({ ...newAccidentReport, description: e.target.value })} placeholder="Olay nasıl gerçekleşti?" /></FormField>
          <FormField label="Kök Neden"><input style={styles.input} className="isg-input" value={newAccidentReport.rootCause} onChange={e => setNewAccidentReport({ ...newAccidentReport, rootCause: e.target.value })} placeholder="Ekipman, eğitim, ortam, davranış..." /></FormField>
          <FormField label="Aksiyon Planı"><input style={styles.input} className="isg-input" value={newAccidentReport.actionPlan} onChange={e => setNewAccidentReport({ ...newAccidentReport, actionPlan: e.target.value })} placeholder="Alınacak önlemler" /></FormField>
          <FormField label="Not"><input style={styles.input} className="isg-input" value={newAccidentReport.notes} onChange={e => setNewAccidentReport({ ...newAccidentReport, notes: e.target.value })} placeholder="Ek açıklamalar" /></FormField>
        </div>
        <div style={{ marginTop: 12, display: "flex", gap: 10, flexWrap: "wrap" }}>
          <button style={styles.btnPrimary} onClick={addAccidentReport}>Rapor Kaydı Ekle</button>
        </div>
      </div>

      <div style={styles.searchBar}>
        <input style={{ ...styles.input, maxWidth: 300 }} placeholder="Ara..." value={search} onChange={e => setSearch(e.target.value)} />
        <select style={{ ...styles.select, maxWidth: 180 }} value={selectedCompanyId} onChange={e => setSelectedCompanyId(e.target.value)}><option value="all">Tüm Firmalar</option>{companies.map(c => <option key={c.id} value={c.id}>{c.nickName}</option>)}</select>
        <span style={{ color: "var(--isg-text-muted)", fontSize: 13 }}>{filteredAccidentReports.length} rapor</span>
      </div>

      <div style={{ ...styles.card, padding: 0, overflow: "auto", WebkitOverflowScrolling: "touch" as any }}>
        <table style={styles.table}>
          <thead><tr>{["Firma", "Personel", "Tarih", "Yer", "Tür", "Şiddet", "Durum", "Açıklama / Aksiyon", "Çıktı", "İşlem"].map(h => <th key={h} style={styles.th} className="isg-th">{h}</th>)}</tr></thead>
          <tbody>
            {filteredAccidentReports.map(report => {
              const company = companies.find(c => c.id === report.companyId);
              const employee = employees.find(e => e.id === report.employeeId);
              return (
                <tr key={report.id}>
                  <td style={styles.td} className="isg-td">{company?.nickName || "—"}</td>
                  <td style={styles.td} className="isg-td">{employee ? `${employee.firstName} ${employee.lastName}` : "—"}</td>
                  <td style={styles.td} className="isg-td">{formatDate(report.accidentDate)}</td>
                  <td style={styles.td} className="isg-td">{report.location || "—"}</td>
                  <td style={styles.td} className="isg-td"><Badge text={report.incidentType} color="#ef4444" /></td>
                  <td style={styles.td} className="isg-td"><Badge text={report.severity} color={report.severity === "Ağır" ? "#C0392B" : report.severity === "Orta" ? "#D4A017" : "#2D6A4F"} /></td>
                  <td style={styles.td} className="isg-td">
                    <select style={{ ...styles.select, minWidth: 150 }} value={report.status} onChange={e => updateAccidentReportStatus(report.id, e.target.value as AccidentReportStatus)}>
                      <option>Açık</option>
                      <option>İncelemede</option>
                      <option>Aksiyon Planlandı</option>
                      <option>Kapandı</option>
                    </select>
                  </td>
                  <td style={{ ...styles.td, minWidth: 260, color: "var(--isg-text-muted)" }} className="isg-td">{[report.description, report.rootCause, report.actionPlan].filter(Boolean).join(" / ") || "—"}</td>
                  <td style={styles.td} className="isg-td"><button style={styles.btnSecondary} onClick={() => generateAccidentReportPDF(report, company, employee)}>Rapor PDF</button></td>
                  <td style={styles.td} className="isg-td"><button style={styles.btnDanger} onClick={() => deleteAccidentReport(report.id)}>Sil</button></td>
                </tr>
              );
            })}
            {filteredAccidentReports.length === 0 && (
              <EmptyTableRow colSpan={10} message="Yeni iş kazası veya ramak kala raporu eklemek için yukarıdaki formu kullanın." />
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
