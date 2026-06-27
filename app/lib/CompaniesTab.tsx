import React, { useEffect, useState } from "react";
import { dangerFromNace, daysUntil, extractNaceFromSgk, getDateStatus, officialNameFromSgk, statusColor } from "./dashboardUtils";
import { formatDate } from "./dateUtils";
import { EmptyTableRow } from "./EmptyState";
import type { Company, DangerClass, ServiceType } from "./types";

type CompanyDraft = {
  nickName: string;
  officialName: string;
  sgkSicil: string;
  naceCode: string;
  dangerClass: DangerClass;
  employeeCount: string;
  contractEnd: string;
  serviceType: ServiceType;
  contactEmail: string;
};

type CompanyIndicator = { text: string; color: string };

type CompaniesTabProps = {
  styles: Record<string, React.CSSProperties>;
  isAdmin: boolean;
  companies: Company[];
  filteredCompanies: Company[];
  newCompany: CompanyDraft;
  setNewCompany: React.Dispatch<React.SetStateAction<CompanyDraft>>;
  search: string;
  setSearch: (value: string) => void;
  addCompany: () => void;
  deleteCompany: (id: string) => void;
  getCompanyIndicator: (companyId: string) => CompanyIndicator;
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

export function CompaniesTab({
  styles,
  isAdmin,
  companies,
  filteredCompanies,
  newCompany,
  setNewCompany,
  search,
  setSearch,
  addCompany,
  deleteCompany,
  getCompanyIndicator,
}: CompaniesTabProps) {
  return (
    <div>
      {isAdmin ? (
        <div style={styles.card} className="isg-card">
          <p style={styles.sectionTitle} className="isg-text-muted">Yeni Firma Ekle</p>
          <div style={styles.formGrid}>
            <FormField label="Kısa Ad *"><input style={styles.input} className="isg-input" value={newCompany.nickName} onChange={e => setNewCompany({ ...newCompany, nickName: e.target.value })} /></FormField>
            <FormField label="SGK Sicil No *"><input style={styles.input} className="isg-input" value={newCompany.sgkSicil} onChange={e => { const sgk = e.target.value; const nace = extractNaceFromSgk(sgk); const official = officialNameFromSgk(sgk); setNewCompany({ ...newCompany, sgkSicil: sgk, naceCode: nace, officialName: official || newCompany.officialName, dangerClass: dangerFromNace(nace) }); }} /></FormField>
            <FormField label="Resmi Unvan"><input style={styles.input} className="isg-input" value={newCompany.officialName} onChange={e => setNewCompany({ ...newCompany, officialName: e.target.value })} /></FormField>
            <FormField label="NACE Kodu"><input style={styles.input} className="isg-input" value={newCompany.naceCode} onChange={e => setNewCompany({ ...newCompany, naceCode: e.target.value, dangerClass: dangerFromNace(e.target.value) })} /></FormField>
            <FormField label="Tehlike Sınıfı"><select style={styles.select} className="isg-input" value={newCompany.dangerClass} onChange={e => setNewCompany({ ...newCompany, dangerClass: e.target.value as DangerClass })}><option>Az Tehlikeli</option><option>Tehlikeli</option><option>Çok Tehlikeli</option></select></FormField>
            <FormField label="Çalışan Sayısı"><input style={styles.input} className="isg-input" type="number" value={newCompany.employeeCount} onChange={e => setNewCompany({ ...newCompany, employeeCount: e.target.value })} /></FormField>
            <FormField label="Sözleşme Bitiş"><DatePicker styles={styles} value={newCompany.contractEnd} onChange={v => setNewCompany({ ...newCompany, contractEnd: v })} /></FormField>
            <FormField label="Hizmet Türü"><select style={styles.select} className="isg-input" value={newCompany.serviceType} onChange={e => setNewCompany({ ...newCompany, serviceType: e.target.value as ServiceType })}><option>İş Güvenliği</option><option>İş Güvenliği + İşyeri Hekimliği</option></select></FormField>
            <FormField label="İletişim E-posta"><input style={styles.input} className="isg-input" type="email" value={newCompany.contactEmail} onChange={e => setNewCompany({ ...newCompany, contactEmail: e.target.value })} placeholder="firma@ornek.com" /></FormField>
          </div>
          <div style={{ marginTop: 12 }}><button style={styles.btnPrimary} onClick={addCompany}>Firma Ekle</button></div>
        </div>
      ) : (
        <div style={styles.card} className="isg-card">
          <p style={styles.sectionTitle} className="isg-text-muted">Firma Yetkileriniz</p>
          <p style={{ margin: 0, color: "var(--isg-text-muted)", fontSize: 13 }}>
            Bu ekranda yalnızca size atanmış firmalar görünür. Yeni firma ekleme ve firma silme işlemleri sadece Admin panelinden yapılır.
          </p>
        </div>
      )}
      <div style={styles.searchBar}>
        <input style={{ ...styles.input, maxWidth: 300 }} placeholder="Ara..." value={search} onChange={e => setSearch(e.target.value)} />
        <span style={{ color: "#6B7280", fontSize: 13 }}>{filteredCompanies.length} firma</span>
      </div>
      <div style={{ ...styles.card, padding: 0, overflow: "auto", WebkitOverflowScrolling: "touch" as any }}>
        <table style={styles.table}>
          <thead><tr>{["Kısa Ad", "Resmi Unvan", "SGK Sicil", "NACE", "Tehlike", "Personel", "Sözleşme", "Hizmet", "Durum", ...(isAdmin ? ["İşlem"] : [])].map(h => <th key={h} style={styles.th} className="isg-th">{h}</th>)}</tr></thead>
          <tbody>
            {filteredCompanies.map(c => {
              const ind = getCompanyIndicator(c.id);
              const cs = getDateStatus(c.contractEnd);
              const remainingDays = c.contractEnd ? daysUntil(c.contractEnd) : null;
              return (
                <tr key={c.id}>
                  <td style={styles.td} className="isg-td"><span style={{ fontWeight: 600 }}>{c.nickName}</span></td>
                  <td style={{ ...styles.td, maxWidth: 180, fontSize: 12, color: "var(--isg-text-muted)" }}>{c.officialName}</td>
                  <td style={{ ...styles.td, fontSize: 11, color: "var(--isg-text-muted)" }}>{c.sgkSicil}</td>
                  <td style={styles.td} className="isg-td">{c.naceCode}</td>
                  <td style={styles.td} className="isg-td"><Badge text={c.dangerClass} color={c.dangerClass === "Çok Tehlikeli" ? "#C0392B" : c.dangerClass === "Tehlikeli" ? "#D4A017" : "#2D6A4F"} /></td>
                  <td style={styles.td} className="isg-td">{c.employeeCount}</td>
                  <td style={styles.td} className="isg-td">
                    <span style={{ fontSize: 12 }}>{formatDate(c.contractEnd)}</span> <Badge text={cs} color={statusColor(cs)} />
                    {remainingDays !== null && remainingDays >= 0 && <div style={{ fontSize: 11, color: "#6B7280", marginTop: 4 }}>{remainingDays} gün kaldı</div>}
                  </td>
                  <td style={{ ...styles.td, fontSize: 12 }}>{c.serviceType}</td>
                  <td style={styles.td} className="isg-td"><Badge text={ind.text} color={ind.color} /></td>
                  {isAdmin && <td style={styles.td} className="isg-td"><button style={styles.btnDanger} onClick={() => deleteCompany(c.id)}>Sil</button></td>}
                </tr>
              );
            })}
            {filteredCompanies.length === 0 && (
              <EmptyTableRow colSpan={isAdmin ? 10 : 9} message="Yeni bir firma eklemek için yukarıdaki formu kullanın." />
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
