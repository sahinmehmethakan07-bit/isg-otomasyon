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
  const statusColor = (status: string) =>
    status === "Süresi Dolmuş" || status === "Açık" ? "#C0392B"
      : status === "Tamamlandı" || status === "Kapandı" || status === "Geçerli" ? "#2D6A4F"
        : status === "all" ? "#52d3b5"
          : "#D4A017";
  const typeColor = (type: string) =>
    type === "Risk" || type === "DÖF" || type === "İş Kazası" ? "#C0392B"
      : type === "Belge" || type === "KKD" ? "#2D6A4F"
        : type === "Eğitim" || type === "Yıllık Plan" ? "#D4A017"
          : type === "all" ? "#52d3b5"
            : "#1B4332";
  const typeFilters = [
    { value: "all", label: "Tüm Türler", count: archiveItems.length, color: typeColor("all") },
    ...archiveTypes.map(type => ({
      value: type,
      label: type,
      count: archiveItems.filter(item => item.type === type).length,
      color: typeColor(type),
    })),
  ];
  const statusFilters = [
    { value: "all", label: "Tüm Durumlar", count: archiveItems.length, color: statusColor("all") },
    ...archiveStatuses.map(status => ({
      value: status,
      label: status,
      count: archiveItems.filter(item => item.status === status).length,
      color: statusColor(status),
    })),
  ];

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

      <div style={{ ...styles.card, padding: 14, marginBottom: 16 }} className="isg-card">
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(min(280px, 100%), 1fr))", gap: 14 }}>
          <div>
            <div style={{ ...styles.label, marginBottom: 8 }} className="isg-label">Tür Hızlı Filtresi</div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
              {typeFilters.map(filter => {
                const active = archiveTypeFilter === filter.value;
                return (
                  <button
                    key={filter.value}
                    type="button"
                    onClick={() => setArchiveTypeFilter(filter.value)}
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
            <div style={{ ...styles.label, marginBottom: 8 }} className="isg-label">Durum Hızlı Filtresi</div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
              {statusFilters.map(filter => {
                const active = archiveStatusFilter === filter.value;
                return (
                  <button
                    key={filter.value}
                    type="button"
                    onClick={() => setArchiveStatusFilter(filter.value)}
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
          <thead><tr>{["Tür", "Başlık", "Firma", "İlgili", "Tarih", "Durum", "Kaynak"].map(h => <th key={h} style={styles.th} className="isg-th">{h}</th>)}</tr></thead>
          <tbody>
            {filteredArchiveItems.map(item => {
              const company = companies.find(c => c.id === item.companyId);
              const color = statusColor(item.status);
              return (
                <tr key={`${item.type}-${item.id}`}>
                  <td style={styles.td} className="isg-td"><Badge text={item.type} color={typeColor(item.type)} /></td>
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
