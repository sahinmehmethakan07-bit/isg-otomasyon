import React, { useEffect, useState } from "react";
import { riskScoreColor } from "./dashboardUtils";
import { formatDate, formatDateShort } from "./dateUtils";
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

function DatePicker({ styles, value, onChange }: { styles: Record<string, React.CSSProperties>; value: string; onChange: (v: string) => void }) {
  const [open, setOpen] = useState(false);
  const ref = React.useRef<HTMLDivElement>(null);
  const now = value ? new Date(value) : new Date();
  const [viewYear, setViewYear] = useState(now.getFullYear());
  const [viewMonth, setViewMonth] = useState(now.getMonth());

  const months = ["Oca", "Şub", "Mar", "Nis", "May", "Haz", "Tem", "Ağu", "Eyl", "Eki", "Kas", "Ara"];
  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
  const firstDay = (new Date(viewYear, viewMonth, 1).getDay() + 6) % 7;
  const selectedDate = value ? new Date(value) : null;

  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  const select = (day: number) => {
    const d = String(viewYear) + "-" + String(viewMonth + 1).padStart(2, "0") + "-" + String(day).padStart(2, "0");
    onChange(d);
    setOpen(false);
  };

  const displayValue = value ? formatDateShort(value) : "Tarih seçin...";

  return (
    <div ref={ref} style={{ position: "relative" }}>
      <div onClick={() => setOpen(!open)} style={{ ...styles.input, cursor: "pointer", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <span style={{ color: value ? "var(--isg-text)" : "var(--isg-text-muted)" }}>{displayValue}</span>
        <span style={{ fontSize: 14 }}>📅</span>
      </div>
      {open && (
        <div style={{ position: "absolute", zIndex: 1000, top: "calc(100% + 4px)", left: 0, backgroundColor: "var(--isg-card)", border: "1px solid var(--isg-border)", borderRadius: 8, padding: 12, width: 240, boxShadow: "0 8px 32px rgba(0,0,0,0.5)" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
            <button type="button" onClick={() => { if (viewMonth === 0) { setViewMonth(11); setViewYear(y => y - 1); } else setViewMonth(m => m - 1); }} style={{ ...styles.btnSecondary, padding: "2px 8px" }}>‹</button>
            <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
              <select value={viewMonth} onChange={e => setViewMonth(Number(e.target.value))} style={{ ...styles.select, width: "auto", padding: "2px 6px", fontSize: 12 }}>
                {months.map((m, i) => <option key={m} value={i}>{m}</option>)}
              </select>
              <select value={viewYear} onChange={e => setViewYear(Number(e.target.value))} style={{ ...styles.select, width: "auto", padding: "2px 6px", fontSize: 12 }}>
                {Array.from({ length: 20 }, (_, i) => 2020 + i).map(y => <option key={y} value={y}>{y}</option>)}
              </select>
            </div>
            <button type="button" onClick={() => { if (viewMonth === 11) { setViewMonth(0); setViewYear(y => y + 1); } else setViewMonth(m => m + 1); }} style={{ ...styles.btnSecondary, padding: "2px 8px" }}>›</button>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 2, marginBottom: 4 }}>
            {["Pt", "Sa", "Ça", "Pe", "Cu", "Ct", "Pz"].map(d => <div key={d} style={{ textAlign: "center", fontSize: 10, color: "var(--isg-text-muted)", padding: "2px 0" }}>{d}</div>)}
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 2 }}>
            {Array.from({ length: firstDay }).map((_, i) => <div key={"empty-" + i} />)}
            {Array.from({ length: daysInMonth }, (_, i) => i + 1).map(day => {
              const isSelected = selectedDate && selectedDate.getFullYear() === viewYear && selectedDate.getMonth() === viewMonth && selectedDate.getDate() === day;
              return <button key={day} type="button" onClick={() => select(day)} style={{ backgroundColor: isSelected ? "#1B4332" : "transparent", color: isSelected ? "#fff" : "var(--isg-text)", border: "none", borderRadius: 4, padding: "4px 0", fontSize: 12, cursor: "pointer", textAlign: "center" }}>{day}</button>;
            })}
          </div>
          <button type="button" onClick={() => { onChange(""); setOpen(false); }} style={{ ...styles.btnSecondary, width: "100%", marginTop: 8, fontSize: 11 }}>Temizle</button>
        </div>
      )}
    </div>
  );
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
  const setField = (field: keyof NewRiskForm, value: string) => {
    setNewRisk(current => ({ ...current, [field]: value }));
  };

  const riskScore = parseInt(newRisk.probability) * parseInt(newRisk.severity);
  const residualScore = parseInt(newRisk.residualProbability) * parseInt(newRisk.residualSeverity);

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
          <FormField styles={styles} label="Termin"><DatePicker styles={styles} value={newRisk.dueDate} onChange={v => setField("dueDate", v)} /></FormField>
          <FormField styles={styles} label="Kontrol Tarihi"><DatePicker styles={styles} value={newRisk.controlDate} onChange={v => setField("controlDate", v)} /></FormField>
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
        <span style={{ color: "#6B7280", fontSize: 13 }}>{filteredRisks.length} kayıt</span>
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
            {filteredRisks.map(r => {
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
            {filteredRisks.length === 0 && (
              <EmptyTableRow colSpan={20} message="Yeni risk kaydı eklemek için yukarıdaki formu kullanın veya DÖF kaydından risk oluşturun." />
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
