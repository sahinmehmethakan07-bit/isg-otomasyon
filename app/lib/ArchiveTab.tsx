import React, { useEffect, useState } from "react";
import type { ArchiveItem, Company } from "./types";

type ArchiveTabProps = {
  styles: Record<string, React.CSSProperties>;
  companies: Company[];
  archiveItems: ArchiveItem[];
  filteredArchiveItems: ArchiveItem[];
  archiveTypes: string[];
  archiveStatuses: string[];
  archiveTypeFilter: string;
  setArchiveTypeFilter: (value: string) => void;
  archiveStatusFilter: string;
  setArchiveStatusFilter: (value: string) => void;
  archiveDateFrom: string;
  setArchiveDateFrom: (value: string) => void;
  archiveDateTo: string;
  setArchiveDateTo: (value: string) => void;
  documentsCount: number;
  plansAndTrainingsCount: number;
  riskDofAccidentCount: number;
  search: string;
  setSearch: (value: string) => void;
  selectedCompanyId: string;
  setSelectedCompanyId: (value: string) => void;
  setActiveTab: (value: string) => void;
};

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

export function ArchiveTab({
  styles,
  companies,
  archiveItems,
  filteredArchiveItems,
  archiveTypes,
  archiveStatuses,
  archiveTypeFilter,
  setArchiveTypeFilter,
  archiveStatusFilter,
  setArchiveStatusFilter,
  archiveDateFrom,
  setArchiveDateFrom,
  archiveDateTo,
  setArchiveDateTo,
  documentsCount,
  plansAndTrainingsCount,
  riskDofAccidentCount,
  search,
  setSearch,
  selectedCompanyId,
  setSelectedCompanyId,
  setActiveTab,
}: ArchiveTabProps) {
  return (
    <div>
      <div style={styles.statGrid}>
        <div style={styles.statCard} className="isg-stat-card">
          <div style={{ ...styles.statValue, color: "#0ea5e9" }}>{archiveItems.length}</div>
          <div style={styles.statLabel}>Toplam Arşiv Kaydı</div>
        </div>
        <div style={styles.statCard} className="isg-stat-card">
          <div style={{ ...styles.statValue, color: "#16a34a" }}>{documentsCount}</div>
          <div style={styles.statLabel}>Belge</div>
        </div>
        <div style={styles.statCard} className="isg-stat-card">
          <div style={{ ...styles.statValue, color: "#d97706" }}>{plansAndTrainingsCount}</div>
          <div style={styles.statLabel}>Plan / Eğitim</div>
        </div>
        <div style={styles.statCard} className="isg-stat-card">
          <div style={{ ...styles.statValue, color: "#ef4444" }}>{riskDofAccidentCount}</div>
          <div style={styles.statLabel}>Risk / DÖF / Kaza</div>
        </div>
      </div>

      <div style={styles.card} className="isg-card">
        <p style={styles.sectionTitle} className="isg-text-muted">Arşiv Merkezi</p>
        <div style={{ color: "var(--isg-text-muted)", fontSize: 13, lineHeight: 1.55 }}>
          Belgeler, eğitimler, yıllık planlar, KKD kayıtları, acil durum planları, kurul toplantıları, iş kazası raporları, firma ziyaretleri, DÖF ve risk kayıtları bu ekranda firma bazlı toplanır.
        </div>
      </div>

      <div style={styles.searchBar}>
        <input style={{ ...styles.input, maxWidth: 300 }} placeholder="Arşivde ara..." value={search} onChange={e => setSearch(e.target.value)} />
        <select style={{ ...styles.select, maxWidth: 180 }} value={selectedCompanyId} onChange={e => setSelectedCompanyId(e.target.value)}><option value="all">Tüm Firmalar</option>{companies.map(c => <option key={c.id} value={c.id}>{c.nickName}</option>)}</select>
        <select style={{ ...styles.select, maxWidth: 170 }} value={archiveTypeFilter} onChange={e => setArchiveTypeFilter(e.target.value)}>
          <option value="all">Tüm Türler</option>
          {archiveTypes.map(type => <option key={type} value={type}>{type}</option>)}
        </select>
        <select style={{ ...styles.select, maxWidth: 170 }} value={archiveStatusFilter} onChange={e => setArchiveStatusFilter(e.target.value)}>
          <option value="all">Tüm Durumlar</option>
          {archiveStatuses.map(status => <option key={status} value={status}>{status}</option>)}
        </select>
        <div style={{ minWidth: 150, maxWidth: 170 }}>
          <div style={{ ...styles.label, marginBottom: 4 }}>Başlangıç</div>
          <DatePicker styles={styles} value={archiveDateFrom} onChange={setArchiveDateFrom} />
        </div>
        <div style={{ minWidth: 150, maxWidth: 170 }}>
          <div style={{ ...styles.label, marginBottom: 4 }}>Bitiş</div>
          <DatePicker styles={styles} value={archiveDateTo} onChange={setArchiveDateTo} />
        </div>
        {(archiveTypeFilter !== "all" || archiveStatusFilter !== "all" || archiveDateFrom || archiveDateTo) && (
          <button style={styles.btnSecondary} onClick={() => { setArchiveTypeFilter("all"); setArchiveStatusFilter("all"); setArchiveDateFrom(""); setArchiveDateTo(""); }}>Filtreleri Temizle</button>
        )}
        <span style={{ color: "var(--isg-text-muted)", fontSize: 13 }}>{filteredArchiveItems.length} kayıt</span>
      </div>

      <div style={{ ...styles.card, padding: 0, overflow: "auto", WebkitOverflowScrolling: "touch" as any }}>
        <table style={styles.table}>
          <thead><tr>{["Tür", "Başlık", "Firma", "İlgili", "Tarih", "Durum", "Kaynak"].map(h => <th key={h} style={styles.th} className="isg-th">{h}</th>)}</tr></thead>
          <tbody>
            {filteredArchiveItems.map(item => {
              const company = companies.find(c => c.id === item.companyId);
              const color = item.status === "Süresi Dolmuş" || item.status === "Açık" ? "#dc2626" : item.status === "Tamamlandı" || item.status === "Kapandı" || item.status === "Geçerli" ? "#16a34a" : "#d97706";
              return (
                <tr key={`${item.type}-${item.id}`}>
                  <td style={styles.td} className="isg-td"><Badge text={item.type} color="#0ea5e9" /></td>
                  <td style={{ ...styles.td, minWidth: 220, fontWeight: 700 }} className="isg-td">{item.title || "—"}</td>
                  <td style={styles.td} className="isg-td">{company?.nickName || "—"}</td>
                  <td style={{ ...styles.td, color: "var(--isg-text-muted)" }} className="isg-td">{item.owner || "—"}</td>
                  <td style={styles.td} className="isg-td">{item.date ? new Date(item.date).toLocaleDateString("tr-TR") : "—"}</td>
                  <td style={styles.td} className="isg-td"><Badge text={item.status || "Arşivde"} color={color} /></td>
                  <td style={styles.td} className="isg-td"><button style={styles.btnSecondary} onClick={() => setActiveTab(item.sourceTab)}>Modüle Git</button></td>
                </tr>
              );
            })}
            {filteredArchiveItems.length === 0 && (
              <tr>
                <td colSpan={7} style={{ ...styles.td, color: "var(--isg-text-muted)", textAlign: "center", padding: 24 }}>Arşivde gösterilecek kayıt bulunamadı.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
