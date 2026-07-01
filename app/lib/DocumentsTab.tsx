import React from "react";
import { IsoTarihSecici } from "./TarihSecici";
import { documentTemplates } from "./constants";
import { daysUntil, getDateStatus, statusColor } from "./dashboardUtils";
import { DocumentCompliancePanel } from "./DocumentCompliancePanel";
import { formatDate, formatRelativeDays } from "./dateUtils";
import { EmptyTableRow } from "./EmptyState";
import { buildValidityCalendar } from "./validityCalendar";
import type { Company, DocumentRecord, Employee, TrainingRecord } from "./types";

type DocumentDraft = {
  companyId: string;
  employeeId: string;
  type: string;
  issueDate: string;
  expiryDate: string;
};

type DocumentValidityFilter = "all" | "Süresi Dolmuş" | "Yaklaşıyor" | "Geçerli" | "Tarihsiz";
type DocumentOwnerFilter = "all" | "company" | "employee";

type DocumentsTabProps = {
  styles: Record<string, React.CSSProperties>;
  companies: Company[];
  employees: Employee[];
  trainings: TrainingRecord[];
  documents: DocumentRecord[];
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

function documentStatus(document: DocumentRecord): DocumentValidityFilter {
  return document.expiryDate ? getDateStatus(document.expiryDate) as DocumentValidityFilter : "Tarihsiz";
}

function documentStatusColor(status: DocumentValidityFilter) {
  return status === "Tarihsiz" ? "#6B7280" : status === "all" ? "#52d3b5" : statusColor(status);
}

export function DocumentsTab({
  styles,
  companies,
  employees,
  trainings,
  documents,
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
  const [validityStatusFilter, setValidityStatusFilter] = React.useState("all");
  const [documentTypeFilter, setDocumentTypeFilter] = React.useState("all");
  const [documentValidityFilter, setDocumentValidityFilter] = React.useState<DocumentValidityFilter>("all");
  const [documentOwnerFilter, setDocumentOwnerFilter] = React.useState<DocumentOwnerFilter>("all");
  const filteredCompanies = selectedCompanyId === "all" ? companies : companies.filter(company => company.id === selectedCompanyId);
  const filteredTrainings = selectedCompanyId === "all" ? trainings : trainings.filter(training => training.companyId === selectedCompanyId);
  const validityItems = buildValidityCalendar({ companies: filteredCompanies, documents: filteredDocuments, trainings: filteredTrainings });
  const expiredCount = validityItems.filter(item => item.status === "Süresi Dolmuş").length;
  const soonCount = validityItems.filter(item => item.status === "Yaklaşıyor").length;
  const validCount = validityItems.filter(item => item.status === "Geçerli").length;
  const visibleValidityItems = validityItems
    .filter(item => validityStatusFilter === "all" || item.status === validityStatusFilter)
    .slice(0, 8);
  const validityFilters = [
    { value: "all", label: "Tümü", count: validityItems.length, color: "#52d3b5" },
    { value: "Süresi Dolmuş", label: "Süresi Dolmuş", count: expiredCount, color: statusColor("Süresi Dolmuş") },
    { value: "Yaklaşıyor", label: "Yaklaşıyor", count: soonCount, color: statusColor("Yaklaşıyor") },
    { value: "Geçerli", label: "Geçerli", count: validCount, color: statusColor("Geçerli") },
  ];
  const visibleDocuments = React.useMemo(() => filteredDocuments.filter(document => {
    const matchesType = documentTypeFilter === "all" || document.type === documentTypeFilter;
    const matchesValidity = documentValidityFilter === "all" || documentStatus(document) === documentValidityFilter;
    const matchesOwner =
      documentOwnerFilter === "all" ||
      (documentOwnerFilter === "company" && !document.employeeId) ||
      (documentOwnerFilter === "employee" && Boolean(document.employeeId));
    return matchesType && matchesValidity && matchesOwner;
  }), [documentOwnerFilter, documentTypeFilter, documentValidityFilter, filteredDocuments]);
  const documentTypeFilters = [
    { value: "all", label: "Tüm Belgeler", count: filteredDocuments.length, color: "#52d3b5" },
    ...Array.from(new Set(filteredDocuments.map(document => document.type).filter(Boolean))).map(type => ({
      value: type,
      label: type,
      count: filteredDocuments.filter(document => document.type === type).length,
      color: "#60a5fa",
    })),
  ];
  const documentValidityFilters: Array<{ value: DocumentValidityFilter; label: string; count: number; color: string }> = (
    ["all", "Süresi Dolmuş", "Yaklaşıyor", "Geçerli", "Tarihsiz"] as const
  ).map(status => ({
    value: status,
    label: status === "all" ? "Tüm Durumlar" : status,
    count: status === "all" ? filteredDocuments.length : filteredDocuments.filter(document => documentStatus(document) === status).length,
    color: documentStatusColor(status),
  }));
  const documentOwnerFilters: Array<{ value: DocumentOwnerFilter; label: string; count: number; color: string }> = [
    { value: "all", label: "Tüm Kapsamlar", count: filteredDocuments.length, color: "#52d3b5" },
    { value: "company", label: "Firma Belgesi", count: filteredDocuments.filter(document => !document.employeeId).length, color: "#D4A017" },
    { value: "employee", label: "Personel Belgesi", count: filteredDocuments.filter(document => Boolean(document.employeeId)).length, color: "#a78bfa" },
  ];

  return (
    <div>
      <div style={styles.card} className="isg-card">
        <p style={styles.sectionTitle} className="isg-text-muted">Yeni Belge Ekle</p>
        <div style={styles.formGrid}>
          <FormField label="Firma *"><select style={styles.select} className="isg-input" value={newDocument.companyId} onChange={e => setNewDocument({ ...newDocument, companyId: e.target.value })}><option value="">Seçin...</option>{companies.map(c => <option key={c.id} value={c.id}>{c.nickName}</option>)}</select></FormField>
          <FormField label="Belge Türü *"><select style={styles.select} className="isg-input" value={newDocument.type} onChange={e => setNewDocument({ ...newDocument, type: e.target.value })}>{documentTemplates.map(t => <option key={t}>{t}</option>)}</select></FormField>
          <FormField label="Personel (opsiyonel)"><select style={styles.select} className="isg-input" value={newDocument.employeeId} onChange={e => setNewDocument({ ...newDocument, employeeId: e.target.value })}><option value="">Firma Belgesi</option>{employees.filter(e => !newDocument.companyId || e.companyId === newDocument.companyId).map(e => <option key={e.id} value={e.id}>{e.firstName} {e.lastName}</option>)}</select></FormField>
          <FormField label="Düzenleme Tarihi *"><IsoTarihSecici allowFuture styles={styles} value={newDocument.issueDate} onChange={v => setNewDocument({ ...newDocument, issueDate: v })} /></FormField>
          <FormField label="Geçerlilik Tarihi"><IsoTarihSecici allowFuture styles={styles} value={newDocument.expiryDate} onChange={v => setNewDocument({ ...newDocument, expiryDate: v })} /></FormField>
        </div>
        <div style={{ marginTop: 12 }}><button style={styles.btnPrimary} onClick={addDocument}>Belge Ekle</button></div>
      </div>
      <DocumentCompliancePanel
        styles={styles}
        companies={filteredCompanies}
        documents={documents}
        setSelectedCompanyId={setSelectedCompanyId}
      />
      <div style={styles.card} className="isg-card">
        <div style={{ display: "flex", justifyContent: "space-between", gap: 12, alignItems: "center", flexWrap: "wrap", marginBottom: 12 }}>
          <div>
            <p style={styles.sectionTitle} className="isg-text-muted">Geçerlilik Takvimi</p>
            <div style={{ fontSize: 12, color: "var(--isg-text-muted)" }}>Belgeler, firma sözleşmeleri ve planlı eğitim tarihleri tek listede izlenir.</div>
          </div>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            <Badge text={`${expiredCount} süresi dolmuş`} color={statusColor("Süresi Dolmuş")} />
            <Badge text={`${soonCount} yaklaşıyor`} color={statusColor("Yaklaşıyor")} />
            <Badge text={`${validCount} geçerli`} color={statusColor("Geçerli")} />
          </div>
        </div>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 12 }}>
          {validityFilters.map(filter => {
            const active = validityStatusFilter === filter.value;
            const activeBackground = filter.value === "all" ? "rgba(82, 211, 181, 0.16)" : `${filter.color}18`;
            const activeBorder = filter.value === "all" ? "rgba(82, 211, 181, 0.45)" : `${filter.color}55`;
            return (
              <button
                key={filter.value}
                type="button"
                onClick={() => setValidityStatusFilter(filter.value)}
                style={{
                  ...styles.btnSecondary,
                  minHeight: 38,
                  backgroundColor: active ? activeBackground : "var(--isg-btn-secondary)",
                  borderColor: active ? activeBorder : "var(--isg-border)",
                  color: active ? filter.color : "var(--isg-text)",
                }}
              >
                {filter.label} ({filter.count})
              </button>
            );
          })}
        </div>
        {visibleValidityItems.length > 0 ? (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(min(260px, 100%), 1fr))", gap: 10 }}>
            {visibleValidityItems.map(item => (
              <div key={item.id} style={{ border: "1px solid var(--isg-border)", borderRadius: 10, padding: 12, backgroundColor: "var(--isg-input-bg)" }}>
                <div style={{ display: "flex", justifyContent: "space-between", gap: 8, alignItems: "flex-start" }}>
                  <div style={{ minWidth: 0 }}>
                    <div style={{ fontSize: 12, color: "var(--isg-text-muted)", fontWeight: 700 }}>{item.type}</div>
                    <div style={{ fontSize: 14, fontWeight: 800, marginTop: 3 }}>{item.title}</div>
                  </div>
                  <Badge text={item.status} color={statusColor(item.status)} />
                </div>
                <div style={{ fontSize: 12, color: "var(--isg-text-muted)", marginTop: 8 }}>{item.owner}</div>
                <div style={{ fontSize: 12, color: "var(--isg-text-subtle)", marginTop: 4 }}>
                  {formatDate(item.dueDate)} · {item.daysRemaining >= 0 ? formatRelativeDays(item.daysRemaining) : `${Math.abs(item.daysRemaining)} gün geçti`}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div style={{ fontSize: 13, color: "var(--isg-text-muted)" }}>Seçili filtrede izlenecek tarihli kayıt yok.</div>
        )}
      </div>
      <div style={styles.searchBar}>
        <input style={{ ...styles.input, maxWidth: 240 }} placeholder="Ara..." value={search} onChange={e => setSearch(e.target.value)} />
        <select style={{ ...styles.select, maxWidth: 180 }} value={selectedCompanyId} onChange={e => setSelectedCompanyId(e.target.value)}><option value="all">Tüm Firmalar</option>{companies.map(c => <option key={c.id} value={c.id}>{c.nickName}</option>)}</select>
        <span style={{ color: "var(--isg-text-muted)", fontSize: 13 }}>{visibleDocuments.length} belge</span>
      </div>
      <div style={{ ...styles.card, padding: 16 }} className="isg-card">
        {[
          { title: "Belge Türü Filtresi", filters: documentTypeFilters, value: documentTypeFilter, onChange: setDocumentTypeFilter },
          { title: "Geçerlilik Filtresi", filters: documentValidityFilters, value: documentValidityFilter, onChange: setDocumentValidityFilter },
          { title: "Kapsam Filtresi", filters: documentOwnerFilters, value: documentOwnerFilter, onChange: setDocumentOwnerFilter },
        ].map(group => (
          <div key={group.title} style={{ marginBottom: 12 }}>
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
                      minHeight: 38,
                      border: `1px solid ${active ? filter.color : "var(--isg-border)"}`,
                      backgroundColor: active ? `${filter.color}18` : "var(--isg-input-bg)",
                      color: active ? filter.color : "var(--isg-text)",
                    }}
                  >
                    {filter.label} <span style={{ color: active ? filter.color : "var(--isg-text-muted)" }}>({filter.count})</span>
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>
      <div style={{ ...styles.card, padding: 0, overflow: "auto", WebkitOverflowScrolling: "touch" as React.CSSProperties["WebkitOverflowScrolling"] }}>
        <table style={styles.table}>
          <thead><tr>{["Belge Türü", "Firma", "Personel", "Düzenleme", "Geçerlilik", "Durum", "İşlem"].map(h => <th key={h} style={styles.th} className="isg-th">{h}</th>)}</tr></thead>
          <tbody>
            {visibleDocuments.map(d => {
              const company = companies.find(c => c.id === d.companyId);
              const emp = employees.find(e => e.id === d.employeeId);
              const ds = d.expiryDate ? getDateStatus(d.expiryDate) : "—";
              const days = d.expiryDate ? daysUntil(d.expiryDate) : null;
              return (
                <tr key={d.id}>
                  <td style={{ ...styles.td, fontWeight: 500 }}>{d.type}</td>
                  <td style={styles.td} className="isg-td">{company?.nickName}</td>
                  <td style={{ ...styles.td, fontSize: 12, color: "var(--isg-text-muted)" }}>{emp ? `${emp.firstName} ${emp.lastName}` : "—"}</td>
                  <td style={{ ...styles.td, fontSize: 12 }}>{formatDate(d.issueDate)}</td>
                  <td style={{ ...styles.td, fontSize: 12 }}>{formatDate(d.expiryDate)}</td>
                  <td style={styles.td} className="isg-td">{d.expiryDate ? <div><Badge text={ds} color={statusColor(ds)} />{days !== null && days >= 0 && <div style={{ fontSize: 11, color: "#6B7280", marginTop: 2 }}>{formatRelativeDays(days)}</div>}</div> : "—"}</td>
                  <td style={styles.td} className="isg-td"><button style={styles.btnDanger} onClick={() => deleteDocument(d.id)}>Sil</button></td>
                </tr>
              );
            })}
            {visibleDocuments.length === 0 && (
              <EmptyTableRow colSpan={7} message="Filtreleri değiştirin veya yeni belge eklemek için yukarıdaki formu kullanın." />
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
