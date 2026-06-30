import React from "react";
import { buildCompany360Summary } from "./company360";
import { formatDate } from "./dateUtils";
import { EmptyState } from "./EmptyState";
import type {
  AccidentReportRecord,
  Company,
  CompanyVisitRecord,
  DocumentRecord,
  DofRecord,
  Employee,
  RiskRecord,
} from "./types";

type Company360PanelProps = {
  styles: Record<string, React.CSSProperties>;
  company: Company;
  employees: Employee[];
  documents: DocumentRecord[];
  dofs: DofRecord[];
  risks: RiskRecord[];
  accidentReports: AccidentReportRecord[];
  companyVisits: CompanyVisitRecord[];
  openTab: (tab: string) => void;
  onClose: () => void;
};

function Badge({ text, color }: { text: string; color: string }) {
  return (
    <span className="isg-badge" style={{ border: `1px solid ${color}55`, color, background: `${color}18` }}>
      {text}
    </span>
  );
}

export function Company360Panel({
  styles,
  company,
  employees,
  documents,
  dofs,
  risks,
  accidentReports,
  companyVisits,
  openTab,
  onClose,
}: Company360PanelProps) {
  const summary = buildCompany360Summary({ company, employees, documents, dofs, risks, accidentReports, companyVisits });

  return (
    <div style={styles.card} className="isg-card">
      <div style={{ display: "flex", justifyContent: "space-between", gap: 12, alignItems: "flex-start", flexWrap: "wrap", marginBottom: 16 }}>
        <div>
          <p style={{ ...styles.sectionTitle, marginBottom: 6 }} className="isg-text-muted">
            Firma 360
          </p>
          <h3 style={{ margin: 0, fontSize: 20, lineHeight: 1.25 }}>{company.nickName}</h3>
          <div style={{ color: "var(--isg-text-muted)", fontSize: 13, lineHeight: 1.5, marginTop: 6 }}>
            {company.officialName || "Resmi unvan yok"} · SGK {company.sgkSicil || "girilmeli"} · NACE {company.naceCode || "girilmeli"}
          </div>
        </div>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap", justifyContent: "flex-end" }}>
          <Badge text={company.dangerClass} color={company.dangerClass === "Çok Tehlikeli" ? "#C0392B" : company.dangerClass === "Tehlikeli" ? "#D4A017" : "#2D6A4F"} />
          <Badge text={`Sözleşme: ${summary.contractStatus}`} color={summary.contractColor} />
          <button type="button" style={styles.btnSecondary} onClick={onClose}>Kapat</button>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(min(145px, 100%), 1fr))", gap: 10, marginBottom: 16 }}>
        {summary.metrics.map(metric => (
          <button
            key={metric.label}
            type="button"
            onClick={() => openTab(metric.tab)}
            style={{
              minHeight: 68,
              border: `1px solid ${metric.color}44`,
              borderRadius: 12,
              background: `${metric.color}14`,
              color: "var(--isg-text)",
              cursor: "pointer",
              padding: "10px 12px",
              textAlign: "left",
            }}
          >
            <div style={{ color: metric.color, fontSize: 22, fontWeight: 900, lineHeight: 1 }}>{metric.value}</div>
            <div style={{ color: "var(--isg-text-muted)", fontSize: 12, fontWeight: 800, marginTop: 6 }}>{metric.label}</div>
          </button>
        ))}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(min(220px, 100%), 1fr))", gap: 12, marginBottom: 16 }}>
        <div style={{ border: "1px solid var(--isg-border)", borderRadius: 12, padding: 14, background: "var(--isg-input-bg)" }}>
          <div style={{ ...styles.label, marginBottom: 8 }}>Firma Bilgisi</div>
          <div style={{ display: "grid", gap: 6, color: "var(--isg-text-muted)", fontSize: 13, lineHeight: 1.45 }}>
            <span>Hizmet: <strong style={{ color: "var(--isg-text)" }}>{company.serviceType}</strong></span>
            <span>Personel: <strong style={{ color: "var(--isg-text)" }}>{summary.activeEmployees}/{summary.employeeTotal || company.employeeCount}</strong></span>
            <span>Sözleşme bitiş: <strong style={{ color: "var(--isg-text)" }}>{formatDate(company.contractEnd)}</strong></span>
            <span>E-posta: <strong style={{ color: "var(--isg-text)" }}>{company.contactEmail || "girilmeli"}</strong></span>
          </div>
        </div>

        <div style={{ border: "1px solid var(--isg-border)", borderRadius: 12, padding: 14, background: "var(--isg-input-bg)" }}>
          <div style={{ ...styles.label, marginBottom: 8 }}>Öncelikli Bulgular</div>
          <div style={{ display: "grid", gap: 8 }}>
            {summary.issues.slice(0, 5).map(issue => (
              <button
                key={`${issue.label}-${issue.detail}`}
                type="button"
                onClick={() => openTab(issue.tab)}
                style={{
                  border: `1px solid ${issue.color}44`,
                  borderRadius: 10,
                  background: `${issue.color}12`,
                  color: "var(--isg-text)",
                  cursor: "pointer",
                  minHeight: 48,
                  padding: "9px 10px",
                  textAlign: "left",
                }}
              >
                <strong style={{ color: issue.color, marginRight: 6 }}>{issue.label}</strong>
                <span style={{ color: "var(--isg-text-muted)", fontSize: 12 }}>{issue.detail}</span>
              </button>
            ))}
            {summary.issues.length === 0 && (
              <EmptyState title="Kritik bulgu yok." message="Bu firmada açık DÖF, kritik risk veya yaklaşan belge uyarısı görünmüyor." />
            )}
          </div>
        </div>
      </div>

      <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
        <button type="button" style={styles.btnSecondary} onClick={() => openTab("belgeler")}>Belgeleri Aç</button>
        <button type="button" style={styles.btnSecondary} onClick={() => openTab("personel")}>Personeli Aç</button>
        <button type="button" style={styles.btnSecondary} onClick={() => openTab("dof")}>DÖF Takibi</button>
        <button type="button" style={styles.btnSecondary} onClick={() => openTab("risk")}>Riskleri Aç</button>
      </div>
    </div>
  );
}
