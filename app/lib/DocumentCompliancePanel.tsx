import React from "react";
import { buildDocumentCompliance } from "./documentCompliance";
import { EmptyState } from "./EmptyState";
import type { Company, DocumentRecord } from "./types";

type DocumentCompliancePanelProps = {
  styles: Record<string, React.CSSProperties>;
  companies: Company[];
  documents: DocumentRecord[];
  setSelectedCompanyId: (companyId: string) => void;
};

function Badge({ text, color }: { text: string; color: string }) {
  return (
    <span className="isg-badge" style={{ border: `1px solid ${color}55`, color, background: `${color}18` }}>
      {text}
    </span>
  );
}

export function DocumentCompliancePanel({
  styles,
  companies,
  documents,
  setSelectedCompanyId,
}: DocumentCompliancePanelProps) {
  const summary = buildDocumentCompliance(companies, documents);
  const visibleCompanies = summary.companies.slice(0, 6);

  return (
    <div style={styles.card} className="isg-card">
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 12, flexWrap: "wrap", marginBottom: 14 }}>
        <div>
          <p style={{ ...styles.sectionTitle, marginBottom: 6 }} className="isg-text-muted">
            Akıllı Evrak Uygunluk Kontrolü
          </p>
          <div style={{ color: "var(--isg-text-muted)", fontSize: 13, lineHeight: 1.55 }}>
            Zorunlu firma evraklarını, süresi dolanları ve yaklaşan yenilemeleri firma bazında denetler.
          </div>
        </div>
        <Badge text={`Ortalama ${summary.averageScore}%`} color={summary.averageScore < 70 ? "#C0392B" : summary.averageScore < 90 ? "#D4A017" : "#2D6A4F"} />
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(min(145px, 100%), 1fr))", gap: 10, marginBottom: 14 }}>
        {[
          { label: "Kritik Firma", value: summary.criticalCompanies, color: "#C0392B" },
          { label: "Eksik Evrak", value: summary.missingTotal, color: "#C0392B" },
          { label: "Süresi Dolmuş", value: summary.expiredTotal, color: "#C0392B" },
          { label: "Yaklaşıyor", value: summary.soonTotal, color: "#D4A017" },
        ].map(metric => (
          <div
            key={metric.label}
            style={{
              minHeight: 62,
              border: `1px solid ${metric.color}44`,
              borderRadius: 12,
              background: `${metric.color}14`,
              padding: "10px 12px",
            }}
          >
            <div style={{ color: metric.color, fontSize: 22, fontWeight: 900, lineHeight: 1 }}>{metric.value}</div>
            <div style={{ color: "var(--isg-text-muted)", fontSize: 12, fontWeight: 800, marginTop: 6 }}>{metric.label}</div>
          </div>
        ))}
      </div>

      <div style={{ display: "grid", gap: 10 }}>
        {visibleCompanies.map(company => (
          <button
            key={company.companyId}
            type="button"
            onClick={() => setSelectedCompanyId(company.companyId)}
            style={{
              border: "1px solid var(--isg-border)",
              borderLeft: `4px solid ${company.color}`,
              borderRadius: 12,
              background: "var(--isg-input-bg)",
              color: "var(--isg-text)",
              cursor: "pointer",
              minHeight: 68,
              padding: "12px 14px",
              textAlign: "left",
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
              <strong>{company.companyName}</strong>
              <div style={{ display: "flex", gap: 7, flexWrap: "wrap", justifyContent: "flex-end" }}>
                <Badge text={`${company.score}%`} color={company.color} />
                <Badge text={company.level} color={company.color} />
              </div>
            </div>
            <div style={{ color: "var(--isg-text-muted)", fontSize: 12, lineHeight: 1.45, marginTop: 7 }}>
              {company.missingDocs.length > 0 && `Eksik: ${company.missingDocs.join(", ")}`}
              {company.missingDocs.length > 0 && (company.expiredDocs.length > 0 || company.soonDocs.length > 0) ? " · " : ""}
              {company.expiredDocs.length > 0 && `Süresi dolmuş: ${company.expiredDocs.join(", ")}`}
              {company.expiredDocs.length > 0 && company.soonDocs.length > 0 ? " · " : ""}
              {company.soonDocs.length > 0 && `Yaklaşıyor: ${company.soonDocs.join(", ")}`}
              {company.missingDocs.length === 0 && company.expiredDocs.length === 0 && company.soonDocs.length === 0 && "Zorunlu evrak görünümü uygun."}
            </div>
          </button>
        ))}
        {visibleCompanies.length === 0 && (
          <EmptyState title="Evrak kontrolü için firma yok." message="Firma kaydı oluştuğunda zorunlu evrak uygunluğu burada izlenir." />
        )}
      </div>
    </div>
  );
}
