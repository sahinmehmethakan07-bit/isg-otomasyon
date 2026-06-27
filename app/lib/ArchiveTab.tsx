import React from "react";
import { IsoTarihSecici } from "./TarihSecici";
import { formatDate } from "./dateUtils";
import { EmptyTableRow } from "./EmptyState";
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
    <span className="isg-badge" style={{ border: `1px solid ${color}55`, color, background: `${color}18` }}>{text}</span>
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
          <div style={{ ...styles.statValue, color: "#1B4332" }}>{archiveItems.length}</div>
          <div style={styles.statLabel}>Toplam Arşiv Kaydı</div>
        </div>
        <div style={styles.statCard} className="isg-stat-card">
          <div style={{ ...styles.statValue, color: "#2D6A4F" }}>{documentsCount}</div>
          <div style={styles.statLabel}>Belge</div>
        </div>
        <div style={styles.statCard} className="isg-stat-card">
          <div style={{ ...styles.statValue, color: "#D4A017" }}>{plansAndTrainingsCount}</div>
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
          <IsoTarihSecici allowFuture styles={styles} value={archiveDateFrom} onChange={setArchiveDateFrom} />
        </div>
        <div style={{ minWidth: 150, maxWidth: 170 }}>
          <div style={{ ...styles.label, marginBottom: 4 }}>Bitiş</div>
          <IsoTarihSecici allowFuture styles={styles} value={archiveDateTo} onChange={setArchiveDateTo} />
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
              const color = item.status === "Süresi Dolmuş" || item.status === "Açık" ? "#C0392B" : item.status === "Tamamlandı" || item.status === "Kapandı" || item.status === "Geçerli" ? "#2D6A4F" : "#D4A017";
              return (
                <tr key={`${item.type}-${item.id}`}>
                  <td style={styles.td} className="isg-td"><Badge text={item.type} color="#1B4332" /></td>
                  <td style={{ ...styles.td, minWidth: 220, fontWeight: 700 }} className="isg-td">{item.title || "—"}</td>
                  <td style={styles.td} className="isg-td">{company?.nickName || "—"}</td>
                  <td style={{ ...styles.td, color: "var(--isg-text-muted)" }} className="isg-td">{item.owner || "—"}</td>
                  <td style={styles.td} className="isg-td">{formatDate(item.date)}</td>
                  <td style={styles.td} className="isg-td"><Badge text={item.status || "Arşivde"} color={color} /></td>
                  <td style={styles.td} className="isg-td"><button style={styles.btnSecondary} onClick={() => setActiveTab(item.sourceTab)}>Modüle Git</button></td>
                </tr>
              );
            })}
            {filteredArchiveItems.length === 0 && (
              <EmptyTableRow colSpan={7} message="Filtreleri temizleyin veya kayıt oluşturulduğunda arşiv burada görünecek." />
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
