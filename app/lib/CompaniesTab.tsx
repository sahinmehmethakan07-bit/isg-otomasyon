import React from "react";
import { IsoTarihSecici } from "./TarihSecici";
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
type ContractStatusFilter = "all" | "Süresi Dolmuş" | "Yaklaşıyor" | "Geçerli" | "Tarihsiz";

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

function dangerColor(dangerClass: "all" | DangerClass) {
  return dangerClass === "Çok Tehlikeli" ? "#C0392B"
    : dangerClass === "Tehlikeli" ? "#D4A017"
      : dangerClass === "all" ? "#52d3b5"
        : "#2D6A4F";
}

function serviceColor(serviceType: "all" | ServiceType) {
  return serviceType === "İş Güvenliği + İşyeri Hekimliği" ? "#a78bfa"
    : serviceType === "all" ? "#52d3b5"
      : "#60a5fa";
}

function companyContractStatus(company: Company): ContractStatusFilter {
  return company.contractEnd ? getDateStatus(company.contractEnd) as ContractStatusFilter : "Tarihsiz";
}

function contractStatusColor(status: ContractStatusFilter) {
  return status === "Tarihsiz" ? "#6B7280" : status === "all" ? "#52d3b5" : statusColor(status);
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
  const [dangerFilter, setDangerFilter] = React.useState<"all" | DangerClass>("all");
  const [contractFilter, setContractFilter] = React.useState<ContractStatusFilter>("all");
  const [serviceFilter, setServiceFilter] = React.useState<"all" | ServiceType>("all");
  const visibleCompanies = React.useMemo(() => filteredCompanies.filter(company => {
    const matchesDanger = dangerFilter === "all" || company.dangerClass === dangerFilter;
    const matchesContract = contractFilter === "all" || companyContractStatus(company) === contractFilter;
    const matchesService = serviceFilter === "all" || company.serviceType === serviceFilter;
    return matchesDanger && matchesContract && matchesService;
  }), [contractFilter, dangerFilter, filteredCompanies, serviceFilter]);
  const dangerFilters: Array<{ value: "all" | DangerClass; label: string; count: number; color: string }> = (
    ["all", "Az Tehlikeli", "Tehlikeli", "Çok Tehlikeli"] as const
  ).map(dangerClass => ({
    value: dangerClass,
    label: dangerClass === "all" ? "Tüm Tehlikeler" : dangerClass,
    count: dangerClass === "all" ? filteredCompanies.length : filteredCompanies.filter(company => company.dangerClass === dangerClass).length,
    color: dangerColor(dangerClass),
  }));
  const contractFilters: Array<{ value: ContractStatusFilter; label: string; count: number; color: string }> = (
    ["all", "Süresi Dolmuş", "Yaklaşıyor", "Geçerli", "Tarihsiz"] as const
  ).map(status => ({
    value: status,
    label: status === "all" ? "Tüm Sözleşmeler" : status,
    count: status === "all" ? filteredCompanies.length : filteredCompanies.filter(company => companyContractStatus(company) === status).length,
    color: contractStatusColor(status),
  }));
  const serviceFilters: Array<{ value: "all" | ServiceType; label: string; count: number; color: string }> = (
    ["all", "İş Güvenliği", "İş Güvenliği + İşyeri Hekimliği"] as const
  ).map(serviceType => ({
    value: serviceType,
    label: serviceType === "all" ? "Tüm Hizmetler" : serviceType,
    count: serviceType === "all" ? filteredCompanies.length : filteredCompanies.filter(company => company.serviceType === serviceType).length,
    color: serviceColor(serviceType),
  }));

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
            <FormField label="Sözleşme Bitiş"><IsoTarihSecici allowFuture styles={styles} value={newCompany.contractEnd} onChange={v => setNewCompany({ ...newCompany, contractEnd: v })} /></FormField>
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
        <span style={{ color: "var(--isg-text-muted)", fontSize: 13 }}>{visibleCompanies.length} firma</span>
      </div>
      <div style={{ ...styles.card, padding: 16 }} className="isg-card">
        {[
          { title: "Tehlike Sınıfı Filtresi", filters: dangerFilters, value: dangerFilter, onChange: setDangerFilter },
          { title: "Sözleşme Filtresi", filters: contractFilters, value: contractFilter, onChange: setContractFilter },
          { title: "Hizmet Türü Filtresi", filters: serviceFilters, value: serviceFilter, onChange: setServiceFilter },
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
      <div style={{ ...styles.card, padding: 0, overflow: "auto", WebkitOverflowScrolling: "touch" as any }}>
        <table style={styles.table}>
          <thead><tr>{["Kısa Ad", "Resmi Unvan", "SGK Sicil", "NACE", "Tehlike", "Personel", "Sözleşme", "Hizmet", "Durum", ...(isAdmin ? ["İşlem"] : [])].map(h => <th key={h} style={styles.th} className="isg-th">{h}</th>)}</tr></thead>
          <tbody>
            {visibleCompanies.map(c => {
              const ind = getCompanyIndicator(c.id);
              const cs = getDateStatus(c.contractEnd);
              const remainingDays = c.contractEnd ? daysUntil(c.contractEnd) : null;
              return (
                <tr key={c.id}>
                  <td style={styles.td} className="isg-td"><span style={{ fontWeight: 600 }}>{c.nickName}</span></td>
                  <td style={{ ...styles.td, maxWidth: 180, fontSize: 12, color: "var(--isg-text-muted)" }}>{c.officialName}</td>
                  <td style={{ ...styles.td, fontSize: 11, color: "var(--isg-text-muted)" }}>{c.sgkSicil}</td>
                  <td style={styles.td} className="isg-td">{c.naceCode}</td>
                  <td style={styles.td} className="isg-td"><Badge text={c.dangerClass} color={dangerColor(c.dangerClass)} /></td>
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
            {visibleCompanies.length === 0 && (
              <EmptyTableRow colSpan={isAdmin ? 10 : 9} message="Filtreleri değiştirin veya yeni bir firma eklemek için yukarıdaki formu kullanın." />
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
