import React from "react";
import { IsoTarihSecici } from "./TarihSecici";
import { riskScoreColor } from "./dashboardUtils";
import { formatDate } from "./dateUtils";
import { EmptyTableRow } from "./EmptyState";
import { generateRiskPDF } from "./pdf";
import type { Company, DofRecord, RiskRecord, Signer } from "./types";

type NewRiskForm = {
  companyId: string;
  section: string;
  hazard: string;
  risk: string;
  currentMeasure: string;
  actionToTake: string;
  probability: string;
  severity: string;
  residualProbability: string;
  residualSeverity: string;
  responsible: string;
  dueDate: string;
  status: "Açık" | "Kontrol Altında" | "Kapandı";
  affectedPersons: string;
  lawReference: string;
  controlDate: string;
};

type RiskTabProps = {
  styles: Record<string, React.CSSProperties>;
  companies: Company[];
  dofs: DofRecord[];
  risks: RiskRecord[];
  signers: Signer[];
  filteredRisks: RiskRecord[];
  newRisk: NewRiskForm;
  setNewRisk: React.Dispatch<React.SetStateAction<NewRiskForm>>;
  pdfLoading: boolean;
  setPdfLoading: React.Dispatch<React.SetStateAction<boolean>>;
  search: string;
  setSearch: React.Dispatch<React.SetStateAction<string>>;
  selectedCompanyId: string;
  setSelectedCompanyId: React.Dispatch<React.SetStateAction<string>>;
  addRisk: () => void;
  deleteRisk: (id: string) => void;
  setActiveTab: React.Dispatch<React.SetStateAction<string>>;
};

function FormField({ styles, label, children }: { styles: Record<string, React.CSSProperties>; label: string; children: React.ReactNode }) {
  return <div><label style={styles.label} className="isg-label">{label}</label>{children}</div>;
}

function Badge({ styles, text, color }: { styles: Record<string, React.CSSProperties>; text: string; color: string }) {
  return <span style={{ ...styles.badge, backgroundColor: color + "22", color, border: "1px solid " + color + "44" }}>{text}</span>;
}

export function RiskTab({
  styles,
  companies,
  dofs,
  risks,
  signers,
  filteredRisks,
  newRisk,
  setNewRisk,
  pdfLoading,
  setPdfLoading,
  search,
  setSearch,
  selectedCompanyId,
  setSelectedCompanyId,
  addRisk,
  deleteRisk,
  setActiveTab,
}: RiskTabProps) {
  const [scoreFilter, setScoreFilter] = React.useState("all");
  const [statusFilter, setStatusFilter] = React.useState("all");
  const setField = (field: keyof NewRiskForm, value: string) => {
    setNewRisk(current => ({ ...current, [field]: value }));
  };

  const riskScore = parseInt(newRisk.probability) * parseInt(newRisk.severity);
  const residualScore = parseInt(newRisk.residualProbability) * parseInt(newRisk.residualSeverity);
  const visibleRisks = React.useMemo(
    () => filteredRisks.filter(risk => {
      const matchesScore =
        scoreFilter === "all" ||
        (scoreFilter === "high" && risk.score >= 15) ||
        (scoreFilter === "medium" && risk.score >= 8 && risk.score < 15) ||
        (scoreFilter === "low" && risk.score < 8);
      const matchesStatus = statusFilter === "all" || risk.status === statusFilter;
      return matchesScore && matchesStatus;
    }),
    [filteredRisks, scoreFilter, statusFilter]
  );
  const scoreFilters = [
    { value: "all", label: "Tüm Riskler", count: filteredRisks.length, color: "#52d3b5" },
    { value: "high", label: "Yüksek", count: filteredRisks.filter(risk => risk.score >= 15).length, color: "#C0392B" },
    { value: "medium", label: "Orta", count: filteredRisks.filter(risk => risk.score >= 8 && risk.score < 15).length, color: "#D4A017" },
    { value: "low", label: "Düşük", count: filteredRisks.filter(risk => risk.score < 8).length, color: "#2D6A4F" },
  ];
  const statusFilters = [
    { value: "all", label: "Tüm Durumlar", count: filteredRisks.length, color: "#52d3b5" },
    { value: "Açık", label: "Açık", count: filteredRisks.filter(risk => risk.status === "Açık").length, color: "#C0392B" },
    { value: "Kontrol Altında", label: "Kontrol Altında", count: filteredRisks.filter(risk => risk.status === "Kontrol Altında").length, color: "#D4A017" },
    { value: "Kapandı", label: "Kapandı", count: filteredRisks.filter(risk => risk.status === "Kapandı").length, color: "#2D6A4F" },
  ];

  return (
    <div>
      <div style={styles.card} className="isg-card">
        <p style={styles.sectionTitle} className="isg-text-muted">Yeni Risk Kaydı</p>
        <div style={styles.formGrid}>
          <FormField styles={styles} label="Firma *"><select style={styles.select} className="isg-input" value={newRisk.companyId} onChange={e => setField("companyId", e.target.value)}><option value="">Seçin...</option>{companies.map(c => <option key={c.id} value={c.id}>{c.nickName}</option>)}</select></FormField>
          <FormField styles={styles} label="Bölüm / Faaliyet"><input style={styles.input} className="isg-input" value={newRisk.section} onChange={e => setField("section", e.target.value)} /></FormField>
          <FormField styles={styles} label="Tehlike Kaynağı / Mevcut Durum *"><input style={styles.input} className="isg-input" value={newRisk.hazard} onChange={e => setField("hazard", e.target.value)} /></FormField>
          <FormField styles={styles} label="Tehlike"><input style={styles.input} className="isg-input" value={newRisk.risk} onChange={e => setField("risk", e.target.value)} /></FormField>
          <FormField styles={styles} label="Mevcut Önlem"><input style={styles.input} className="isg-input" value={newRisk.currentMeasure} onChange={e => setField("currentMeasure", e.target.value)} /></FormField>
          <FormField styles={styles} label="Öneriler / Alınacak Önlemler"><input style={styles.input} className="isg-input" value={newRisk.actionToTake} onChange={e => setField("actionToTake", e.target.value)} /></FormField>
          <FormField styles={styles} label="Olasılık (1-5)"><input style={styles.input} className="isg-input" type="number" min={1} max={5} value={newRisk.probability} onChange={e => setField("probability", e.target.value)} /></FormField>
          <FormField styles={styles} label="Şiddet (1-5)"><input style={styles.input} className="isg-input" type="number" min={1} max={5} value={newRisk.severity} onChange={e => setField("severity", e.target.value)} /></FormField>
          <FormField styles={styles} label="Kalıntı Olasılık"><input style={styles.input} className="isg-input" type="number" min={1} max={5} value={newRisk.residualProbability} onChange={e => setField("residualProbability", e.target.value)} /></FormField>
          <FormField styles={styles} label="Kalıntı Şiddet"><input style={styles.input} className="isg-input" type="number" min={1} max={5} value={newRisk.residualSeverity} onChange={e => setField("residualSeverity", e.target.value)} /></FormField>
          <FormField styles={styles} label="Etkilenecek Kişiler"><input style={styles.input} className="isg-input" value={newRisk.affectedPersons} onChange={e => setField("affectedPersons", e.target.value)} placeholder="Tüm çalışanlar" /></FormField>
          <FormField styles={styles} label="Sorumlu"><input style={styles.input} className="isg-input" value={newRisk.responsible} onChange={e => setField("responsible", e.target.value)} /></FormField>
          <FormField styles={styles} label="Termin"><IsoTarihSecici allowFuture styles={styles} value={newRisk.dueDate} onChange={v => setField("dueDate", v)} /></FormField>
          <FormField styles={styles} label="Kontrol Tarihi"><IsoTarihSecici allowFuture styles={styles} value={newRisk.controlDate} onChange={v => setField("controlDate", v)} /></FormField>
          <FormField styles={styles} label="Durum"><select style={styles.select} className="isg-input" value={newRisk.status} onChange={e => setNewRisk(current => ({ ...current, status: e.target.value as NewRiskForm["status"] }))}><option>Açık</option><option>Kontrol Altında</option><option>Kapandı</option></select></FormField>
          <FormField styles={styles} label="İlgili Mevzuat">
            <input style={styles.input} className="isg-input" value={newRisk.lawReference} onChange={e => setField("lawReference", e.target.value)} placeholder="6331 sayılı İSG Kanunu..." />
          </FormField>
        </div>
        <div style={{ marginTop: 8, fontSize: 13, color: "var(--isg-text-muted)" }}>
          Risk Skoru = <strong style={{ color: riskScoreColor(riskScore) }}>{riskScore}</strong>
          {" · "}Kalıntı Skoru = <strong style={{ color: riskScoreColor(residualScore) }}>{residualScore}</strong>
        </div>
        <div style={{ marginTop: 12 }}><button style={styles.btnPrimary} onClick={addRisk}>Risk Ekle</button></div>
      </div>

      <div style={styles.searchBar}>
        <input style={{ ...styles.input, maxWidth: 240 }} placeholder="Ara..." value={search} onChange={e => setSearch(e.target.value)} />
        <select style={{ ...styles.select, maxWidth: 180 }} value={selectedCompanyId} onChange={e => setSelectedCompanyId(e.target.value)}><option value="all">Tüm Firmalar</option>{companies.map(c => <option key={c.id} value={c.id}>{c.nickName}</option>)}</select>
        <span style={{ color: "#6B7280", fontSize: 13 }}>{visibleRisks.length} kayıt</span>
        <button
          style={{ ...styles.btnSuccess, marginLeft: "auto", opacity: pdfLoading || risks.length === 0 ? 0.6 : 1 }}
          disabled={pdfLoading || risks.length === 0}
          onClick={async () => {
            setPdfLoading(true);
            try {
              const risksToExport = selectedCompanyId === "all" ? risks : risks.filter(r => r.companyId === selectedCompanyId);
              const companiesToExport = selectedCompanyId === "all" ? companies : companies.filter(c => c.id === selectedCompanyId);
              await generateRiskPDF(risksToExport, companiesToExport, signers);
            } finally {
              setPdfLoading(false);
            }
          }}
        >
          {pdfLoading ? "⏳ Hazırlanıyor..." : "📄 PDF Rapor İndir"}
        </button>
      </div>

      <div style={{ ...styles.card, display: "grid", gap: 12, marginBottom: 16 }} className="isg-card">
        <div>
          <p style={{ ...styles.sectionTitle, marginBottom: 8 }} className="isg-text-muted">Risk Seviyesi Filtresi</p>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            {scoreFilters.map(filter => {
              const active = scoreFilter === filter.value;
              return (
                <button
                  key={filter.value}
                  type="button"
                  onClick={() => setScoreFilter(filter.value)}
                  style={{
                    ...styles.btnSecondary,
                    minHeight: 38,
                    backgroundColor: active ? `${filter.color}18` : "var(--isg-btn-secondary)",
                    borderColor: active ? `${filter.color}55` : "var(--isg-border)",
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
          <p style={{ ...styles.sectionTitle, marginBottom: 8 }} className="isg-text-muted">Durum Filtresi</p>
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
                    minHeight: 38,
                    backgroundColor: active ? `${filter.color}18` : "var(--isg-btn-secondary)",
                    borderColor: active ? `${filter.color}55` : "var(--isg-border)",
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

      <div style={{ ...styles.card, padding: 0, overflow: "auto", WebkitOverflowScrolling: "touch" as const }}>
        <table style={styles.table}>
          <thead>
            <tr>
              {["Firma", "Bölüm", "Tehlike Kaynağı", "Tehlike", "Mevcut Önlem", "Öneriler", "O", "Ş", "RS", "KO", "KŞ", "KRS", "Etkilenecek", "Sorumlu", "Termin", "K.Tarihi", "Durum", "Mevzuat", "Kaynak", "İşlem"].map(h => (
                <th key={h} style={styles.th} className="isg-th">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {visibleRisks.map(r => {
              const company = companies.find(c => c.id === r.companyId);
              const sourceDof = r.sourceDofId ? dofs.find(d => d.id === r.sourceDofId) : null;
              return (
                <tr key={r.id}>
                  <td style={{ ...styles.td, fontSize: 12 }}>{company?.nickName}</td>
                  <td style={styles.td} className="isg-td">{r.section}</td>
                  <td style={{ ...styles.td, fontWeight: 500 }}>{r.hazard}</td>
                  <td style={{ ...styles.td, fontSize: 12, color: "var(--isg-text-muted)" }}>{r.risk}</td>
                  <td style={{ ...styles.td, fontSize: 11, color: "var(--isg-text-muted)" }}>{r.currentMeasure}</td>
                  <td style={{ ...styles.td, fontSize: 11, color: "var(--isg-text-muted)" }}>{r.actionToTake}</td>
                  <td style={{ ...styles.td, textAlign: "center" as const, fontSize: 12 }}>{r.probability}</td>
                  <td style={{ ...styles.td, textAlign: "center" as const, fontSize: 12 }}>{r.severity}</td>
                  <td style={styles.td} className="isg-td"><span style={{ fontWeight: 700, color: riskScoreColor(r.score), fontSize: 14 }}>{r.score}</span></td>
                  <td style={{ ...styles.td, textAlign: "center" as const, fontSize: 12 }}>{r.residualProbability}</td>
                  <td style={{ ...styles.td, textAlign: "center" as const, fontSize: 12 }}>{r.residualSeverity}</td>
                  <td style={styles.td} className="isg-td"><span style={{ fontWeight: 700, color: riskScoreColor(r.residualScore), fontSize: 14 }}>{r.residualScore}</span></td>
                  <td style={{ ...styles.td, fontSize: 11 }}>{r.affectedPersons || "—"}</td>
                  <td style={{ ...styles.td, fontSize: 12 }}>{r.responsible}</td>
                  <td style={{ ...styles.td, fontSize: 12 }}>{formatDate(r.dueDate)}</td>
                  <td style={{ ...styles.td, fontSize: 12 }}>{formatDate(r.controlDate)}</td>
                  <td style={styles.td} className="isg-td"><Badge styles={styles} text={r.status} color={r.status === "Kapandı" ? "#2D6A4F" : r.status === "Kontrol Altında" ? "#D4A017" : "#C0392B"} /></td>
                  <td style={{ ...styles.td, fontSize: 11, color: "#6B7280", maxWidth: 140 }}>{r.lawReference || "—"}</td>
                  <td style={styles.td} className="isg-td">
                    {sourceDof ? (
                      <span onClick={() => setActiveTab("dof")} style={{ cursor: "pointer", display: "inline-block", padding: "2px 6px", borderRadius: 4, fontSize: 10, fontWeight: 600, backgroundColor: "#7c3aed22", color: "#7c3aed", border: "1px solid #7c3aed44" }} title={sourceDof.title}>
                        DÖF ↗
                      </span>
                    ) : <span style={{ fontSize: 11, color: "var(--isg-text-muted)" }}>Manuel</span>}
                  </td>
                  <td style={styles.td} className="isg-td">
                    <button style={styles.btnDanger} onClick={() => deleteRisk(r.id)}>Sil</button>
                  </td>
                </tr>
              );
            })}
            {visibleRisks.length === 0 && (
              <EmptyTableRow colSpan={20} message="Yeni risk kaydı eklemek için yukarıdaki formu kullanın veya DÖF kaydından risk oluşturun." />
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
