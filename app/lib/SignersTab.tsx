import React from "react";
import type { Company, Signer, SignerRole } from "./types";

type SignersTabProps = {
  styles: Record<string, React.CSSProperties>;
  companies: Company[];
  signers: Signer[];
  isAdmin: boolean;
  addSigner: (companyId: string, role: SignerRole, fullName: string) => Promise<void>;
  deleteSigner: (id: string) => Promise<void>;
};

const signerRoles: SignerRole[] = ["İş Güvenliği Uzmanı", "İşveren / İşveren Vekili", "Çalışan Temsilcisi"];

export function SignersTab({ styles, companies, signers, isAdmin, addSigner, deleteSigner }: SignersTabProps) {
  const [search, setSearch] = React.useState("");
  const [statusFilter, setStatusFilter] = React.useState<"all" | "complete" | "missing">("all");
  const [missingRoleFilter, setMissingRoleFilter] = React.useState<"all" | SignerRole>("all");

  const normalizedSearch = search.trim().toLocaleLowerCase("tr-TR");
  const companySigners = React.useCallback((companyId: string) => signers.filter(signer => signer.companyId === companyId), [signers]);
  const isCompanyComplete = React.useCallback((companyId: string) => {
    const compSigners = companySigners(companyId);
    return signerRoles.every(role => compSigners.some(signer => signer.role === role));
  }, [companySigners]);

  const visibleCompanies = React.useMemo(() => companies.filter(company => {
    const compSigners = companySigners(company.id);
    const haystack = [
      company.nickName,
      company.officialName,
      ...compSigners.map(signer => `${signer.fullName} ${signer.role}`),
    ].join(" ").toLocaleLowerCase("tr-TR");
    const complete = signerRoles.every(role => compSigners.some(signer => signer.role === role));
    const missingSelectedRole = missingRoleFilter === "all" || !compSigners.some(signer => signer.role === missingRoleFilter);
    const matchesSearch = !normalizedSearch || haystack.includes(normalizedSearch);
    const matchesStatus =
      statusFilter === "all" ||
      (statusFilter === "complete" && complete) ||
      (statusFilter === "missing" && !complete);

    return matchesSearch && matchesStatus && missingSelectedRole;
  }), [companies, companySigners, missingRoleFilter, normalizedSearch, statusFilter]);

  const statusFilters = [
    { value: "all" as const, label: "Tüm Firmalar", count: companies.length, color: "#52d3b5" },
    { value: "complete" as const, label: "İmzacıları Tam", count: companies.filter(company => isCompanyComplete(company.id)).length, color: "#2D6A4F" },
    { value: "missing" as const, label: "İmzacı Eksiği Var", count: companies.filter(company => !isCompanyComplete(company.id)).length, color: "#C0392B" },
  ];

  const roleFilters = [
    { value: "all" as const, label: "Tüm Roller", count: companies.length, color: "#52d3b5" },
    ...signerRoles.map(role => ({
      value: role,
      label: `${role} Eksik`,
      count: companies.filter(company => !companySigners(company.id).some(signer => signer.role === role)).length,
      color: "#D4A017",
    })),
  ];

  return (
    <div>
      <div style={styles.card} className="isg-card">
        <p style={styles.sectionTitle} className="isg-text-muted">İmzacı Yönetimi</p>
        <p style={{ fontSize: 12, color: "var(--isg-text-muted)", marginBottom: 16 }}>
          Her firma için PDF raporlarında görünecek 3 imzacıyı belirleyin: İş Güvenliği Uzmanı, İşveren/İşveren Vekili ve Çalışan Temsilcisi.
          {!isAdmin && " Bu ekranda yalnızca size atanmış firmaların imzacıları görünür."}
        </p>

        <div style={styles.searchBar}>
          <input
            style={{ ...styles.input, maxWidth: 320 }}
            className="isg-input"
            placeholder="Firma veya imzacı ara..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
          <span style={{ color: "var(--isg-text-muted)", fontSize: 13 }}>{visibleCompanies.length} firma</span>
        </div>

        <div style={{ display: "grid", gap: 14, marginBottom: 16 }}>
          <div>
            <div style={{ ...styles.label, marginBottom: 8 }} className="isg-label">Tamamlanma Filtresi</div>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              {statusFilters.map(filter => {
                const active = statusFilter === filter.value;
                return (
                  <button
                    key={filter.value}
                    type="button"
                    onClick={() => setStatusFilter(filter.value)}
                    style={{
                      ...styles.btnSecondary,
                      minHeight: 44,
                      background: active ? `${filter.color}24` : "var(--isg-surface-soft)",
                      borderColor: active ? `${filter.color}88` : "var(--isg-border)",
                      color: active ? filter.color : "var(--isg-text)",
                    }}
                  >
                    {filter.label} ({filter.count})
                  </button>
                );
              })}
            </div>
          </div>

          <div>
            <div style={{ ...styles.label, marginBottom: 8 }} className="isg-label">Eksik Rol Filtresi</div>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              {roleFilters.map(filter => {
                const active = missingRoleFilter === filter.value;
                return (
                  <button
                    key={filter.value}
                    type="button"
                    onClick={() => setMissingRoleFilter(filter.value)}
                    style={{
                      ...styles.btnSecondary,
                      minHeight: 44,
                      background: active ? `${filter.color}24` : "var(--isg-surface-soft)",
                      borderColor: active ? `${filter.color}88` : "var(--isg-border)",
                      color: active ? filter.color : "var(--isg-text)",
                    }}
                  >
                    {filter.label} ({filter.count})
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {visibleCompanies.map(company => {
          const compSigners = companySigners(company.id);
          const filledCount = signerRoles.filter(role => compSigners.some(signer => signer.role === role)).length;
          const complete = filledCount === signerRoles.length;

          return (
            <div key={company.id} style={{ ...styles.card, marginBottom: 12 }} className="isg-card">
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10, flexWrap: "wrap", marginBottom: 12 }}>
                <div style={{ fontWeight: 700, fontSize: 14, color: "var(--isg-text)" }}>{company.nickName}</div>
                <span
                  className="isg-badge"
                  style={{
                    border: `1px solid ${complete ? "#2D6A4F" : "#C0392B"}55`,
                    color: complete ? "#2D6A4F" : "#C0392B",
                    background: complete ? "#2D6A4F18" : "#C0392B18",
                  }}
                >
                  {filledCount}/{signerRoles.length} imzacı
                </span>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(min(240px, 100%), 1fr))", gap: 12 }}>
                {signerRoles.map(role => {
                  const existing = compSigners.find(s => s.role === role);
                  return (
                    <div key={role} style={{ backgroundColor: "var(--isg-input-bg)", border: "1px solid var(--isg-border)", borderRadius: 8, padding: 12 }}>
                      <div style={{ fontSize: 11, fontWeight: 600, color: "var(--isg-text-muted)", marginBottom: 8 }}>{role}</div>
                      {existing ? (
                        <div>
                          <div style={{ fontSize: 14, fontWeight: 700, color: "var(--isg-text)", marginBottom: 8 }}>{existing.fullName}</div>
                          <div style={{ display: "flex", gap: 6 }}>
                            <button style={styles.btnDanger} onClick={() => deleteSigner(existing.id)}>Sil</button>
                          </div>
                        </div>
                      ) : (
                        <div>
                          <input
                            style={styles.input}
                            className="isg-input"
                            placeholder="Ad Soyad girin..."
                            onKeyDown={async (e) => {
                              if (e.key === "Enter" && (e.target as HTMLInputElement).value.trim()) {
                                const input = e.target as HTMLInputElement;
                                const name = input.value.trim();
                                await addSigner(company.id, role, name);
                                input.value = "";
                              }
                            }}
                          />
                          <div style={{ fontSize: 10, color: "var(--isg-text-muted)", marginTop: 4 }}>Enter ile kaydet</div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}

        {visibleCompanies.length === 0 && (
          <div style={{ ...styles.card, color: "var(--isg-text-muted)" }} className="isg-card">
            Filtreleri temizleyin veya firma imzacılarını ekleyin.
          </div>
        )}
      </div>
    </div>
  );
}
