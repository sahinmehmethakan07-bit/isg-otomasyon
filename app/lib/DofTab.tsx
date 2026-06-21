import React, { ChangeEvent, useEffect, useState } from "react";
import { priorityColor } from "./dashboardUtils";
import { CHECKLIST, findChecklistItem } from "./dofVisionChecklist";
import type { Company, DofRecord, Employee, Observer, RiskRecord } from "./types";
import { auth } from "../../lib/firebase";

type NewDofForm = {
  companyId: string;
  observerId: string;
  title: string;
  description: string;
  lawReference: string;
  priority: "Düşük" | "Orta" | "Yüksek";
  responsible: string;
  dueDate: string;
  status: DofRecord["status"];
  location: string;
  beforePhoto: string;
  afterPhoto: string;
  affectedPersons: string;
};

type DofTabProps = {
  styles: Record<string, React.CSSProperties>;
  companies: Company[];
  observers: Observer[];
  employees: Employee[];
  filteredDofs: DofRecord[];
  risks: RiskRecord[];
  newDof: NewDofForm;
  setNewDof: React.Dispatch<React.SetStateAction<NewDofForm>>;
  dofAdding: boolean;
  dofAddStatus: string | null;
  setDofAddStatus: React.Dispatch<React.SetStateAction<string | null>>;
  search: string;
  setSearch: React.Dispatch<React.SetStateAction<string>>;
  selectedCompanyId: string;
  setSelectedCompanyId: React.Dispatch<React.SetStateAction<string>>;
  editingDofId: string | null;
  setEditingDofId: React.Dispatch<React.SetStateAction<string | null>>;
  addDof: () => void;
  updateDofStatus: (id: string, status: DofRecord["status"]) => void;
  updateDofPhoto: (id: string, field: "beforePhoto" | "afterPhoto", base64: string) => void;
  removeDofPhoto: (id: string, field: "beforePhoto" | "afterPhoto") => void;
  createRiskFromDof: (dof: DofRecord) => void;
  generateDofPDF: (dof: DofRecord) => void;
  deleteDof: (id: string) => void;
  handleImageToBase64: (event: ChangeEvent<HTMLInputElement>, callback: (base64: string) => void) => void;
};

type VisionDetection = {
  id: string;
  confidence: number;
  evidence: string;
  approved: boolean;
};

function compressImageForVision(base64: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      const maxSide = 1280;
      const scale = Math.min(1, maxSide / Math.max(img.width, img.height));
      const width = Math.max(1, Math.round(img.width * scale));
      const height = Math.max(1, Math.round(img.height * scale));
      const canvas = document.createElement("canvas");
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext("2d");
      if (!ctx) {
        reject(new Error("Fotoğraf işlenemedi"));
        return;
      }
      ctx.drawImage(img, 0, 0, width, height);
      resolve(canvas.toDataURL("image/jpeg", 0.75));
    };
    img.onerror = () => reject(new Error("Fotoğraf okunamadı"));
    img.src = base64;
  });
}

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

  const displayValue = value ? new Date(value).toLocaleDateString("tr-TR") : "Tarih seçin...";

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
              return (
                <button key={day} type="button" onClick={() => select(day)} style={{ backgroundColor: isSelected ? "#0ea5e9" : "transparent", color: isSelected ? "#fff" : "var(--isg-text)", border: "none", borderRadius: 4, padding: "4px 0", fontSize: 12, cursor: "pointer", textAlign: "center" }}>
                  {day}
                </button>
              );
            })}
          </div>
          <button type="button" onClick={() => { onChange(""); setOpen(false); }} style={{ ...styles.btnSecondary, width: "100%", marginTop: 8, fontSize: 11 }}>Temizle</button>
        </div>
      )}
    </div>
  );
}

export function DofTab({
  styles,
  companies,
  observers,
  employees,
  filteredDofs,
  risks,
  newDof,
  setNewDof,
  dofAdding,
  dofAddStatus,
  setDofAddStatus,
  search,
  setSearch,
  selectedCompanyId,
  setSelectedCompanyId,
  editingDofId,
  setEditingDofId,
  addDof,
  updateDofStatus,
  updateDofPhoto,
  removeDofPhoto,
  createRiskFromDof,
  generateDofPDF,
  deleteDof,
  handleImageToBase64,
}: DofTabProps) {
  const [visionDetections, setVisionDetections] = useState<VisionDetection[]>([]);
  const [visionLoading, setVisionLoading] = useState(false);
  const [visionError, setVisionError] = useState<string | null>(null);
  const [manualChecklistId, setManualChecklistId] = useState("");

  const setField = (field: keyof NewDofForm, value: string) => {
    setNewDof(current => ({ ...current, [field]: value }));
  };

  const companyEmployees = employees.filter(emp => emp.companyId === newDof.companyId);
  const approvedDetections = visionDetections.filter(item => item.approved);
  const uncertainDetections = visionDetections.filter(item => item.confidence < 0.6);

  async function analyzePhoto(base64: string) {
    setVisionLoading(true);
    setVisionError(null);
    try {
      const imageBase64 = await compressImageForVision(base64);
      const token = await auth.currentUser?.getIdToken();
      if (!token) throw new Error("Oturum doğrulaması gerekli");
      const res = await fetch("/api/analyze-dof-photo", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ imageBase64 }),
      });
      const rawText = await res.text();
      let data: { detected?: unknown; error?: string } = {};
      try {
        data = rawText ? JSON.parse(rawText) : {};
      } catch {
        data = { error: rawText };
      }
      if (!res.ok) {
        const fallback = rawText.includes("Request Entity")
          ? "Fotoğraf boyutu çok büyük. Daha küçük bir fotoğrafla tekrar deneyin."
          : "Fotoğraf analizi yapılamadı";
        throw new Error(data?.error || fallback);
      }
      const detected = Array.isArray(data.detected) ? data.detected : [];
      setVisionDetections(
        detected.map((item: { id: string; confidence: number; evidence: string }) => ({
          id: item.id,
          confidence: item.confidence,
          evidence: item.evidence,
          approved: item.confidence >= 0.6,
        }))
      );
      if (detected.length === 0) {
        setVisionError("Fotoğrafta checklist ile eşleşen net bir uygunsuzluk bulunamadı.");
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : "Bilinmeyen analiz hatası";
      setVisionError(message);
      setVisionDetections([]);
    } finally {
      setVisionLoading(false);
    }
  }

  function handleNewPhoto(field: "beforePhoto" | "afterPhoto", event: ChangeEvent<HTMLInputElement>) {
    handleImageToBase64(event, base64 => {
      setField(field, base64);
      if (field === "beforePhoto") analyzePhoto(base64);
    });
  }

  function toggleDetection(id: string) {
    setVisionDetections(current =>
      current.map(item => item.id === id ? { ...item, approved: !item.approved } : item)
    );
  }

  function removeDetection(id: string) {
    setVisionDetections(current => current.filter(item => item.id !== id));
  }

  function addManualDetection() {
    if (!manualChecklistId) return;
    setVisionDetections(current => {
      if (current.some(item => item.id === manualChecklistId)) return current;
      return [
        ...current,
        {
          id: manualChecklistId,
          confidence: 1,
          evidence: "Kullanıcı tarafından manuel eklendi",
          approved: true,
        },
      ];
    });
    setManualChecklistId("");
  }

  function applyApprovedDetectionsToDof() {
    const selectedItems = approvedDetections
      .map(item => ({ detection: item, checklist: findChecklistItem(item.id) }))
      .filter((item): item is { detection: VisionDetection; checklist: NonNullable<ReturnType<typeof findChecklistItem>> } => Boolean(item.checklist));

    if (selectedItems.length === 0) {
      setDofAddStatus("⚠️ DÖF metnine aktarılacak onaylı madde yok");
      setTimeout(() => setDofAddStatus(null), 3500);
      return;
    }

    const descriptionLines = selectedItems.map(({ detection, checklist }, index) =>
      `${index + 1}. Tespit: ${checklist.label}\nKanıt: ${detection.evidence || "Fotoğraf analizinde checklist ile eşleşti."}`
    );
    const dofLines = selectedItems.map(({ checklist }, index) =>
      `${index + 1}. ${checklist.regulation} gereği: ${checklist.requiredAction}`
    );

    setNewDof(current => ({
      ...current,
      title: current.title || (selectedItems.length === 1 ? selectedItems[0].checklist.label : "Fotoğraftan tespit edilen İSG uygunsuzlukları"),
      description: descriptionLines.join("\n\n"),
      lawReference: dofLines.join("\n"),
      priority: selectedItems.some(({ checklist }) =>
        checklist.id.includes("yuksekte") ||
        checklist.id.includes("elektrik") ||
        checklist.id.includes("yangin") ||
        checklist.id.includes("acil")
      ) ? "Yüksek" : current.priority,
    }));
    setDofAddStatus("✅ Onaylanan maddeler DÖF metnine aktarıldı");
    setTimeout(() => setDofAddStatus(null), 3500);
  }

  return (
    <div>
      <div style={styles.card} className="isg-card">
        <p style={styles.sectionTitle} className="isg-text-muted">Yeni DÖF Kaydı</p>
        <div style={styles.formGrid}>
          <FormField styles={styles} label="Firma *"><select style={styles.select} className="isg-input" value={newDof.companyId} onChange={e => setField("companyId", e.target.value)}><option value="">Seçin...</option>{companies.map(c => <option key={c.id} value={c.id}>{c.nickName}</option>)}</select></FormField>
          <FormField styles={styles} label="Gözlemci"><select style={styles.select} className="isg-input" value={newDof.observerId} onChange={e => setField("observerId", e.target.value)}><option value="">Seçin...</option>{observers.map(o => <option key={o.id} value={o.id}>{o.fullName}</option>)}</select></FormField>
          <FormField styles={styles} label="Başlık *"><input style={styles.input} className="isg-input" value={newDof.title} onChange={e => setField("title", e.target.value)} /></FormField>
          <FormField styles={styles} label="Konum"><input style={styles.input} className="isg-input" value={newDof.location} onChange={e => setField("location", e.target.value)} /></FormField>
          <FormField styles={styles} label="Öncelik"><select style={styles.select} className="isg-input" value={newDof.priority} onChange={e => setNewDof(current => ({ ...current, priority: e.target.value as NewDofForm["priority"] }))}><option>Düşük</option><option>Orta</option><option>Yüksek</option></select></FormField>
          <FormField styles={styles} label="Sorumlu"><input style={styles.input} className="isg-input" value={newDof.responsible} onChange={e => setField("responsible", e.target.value)} /></FormField>
          <FormField styles={styles} label="Termin"><DatePicker styles={styles} value={newDof.dueDate} onChange={v => setField("dueDate", v)} /></FormField>
          <FormField styles={styles} label="Durum"><select style={styles.select} className="isg-input" value={newDof.status} onChange={e => setNewDof(current => ({ ...current, status: e.target.value as DofRecord["status"] }))}><option>Açık</option></select></FormField>
        </div>
        <div style={{ marginTop: 10 }}>
          <label style={styles.label} className="isg-label">Açıklama</label>
          <textarea style={{ ...styles.input, height: 60, resize: "vertical" as const }} value={newDof.description} onChange={e => setField("description", e.target.value)} />
        </div>
        <div style={{ marginTop: 10 }}>
          <label style={styles.label} className="isg-label">Yasal Dayanak</label>
          <input style={styles.input} className="isg-input" value={newDof.lawReference} onChange={e => setField("lawReference", e.target.value)} />
        </div>
        <div style={{ marginTop: 10 }}>
          <label style={styles.label} className="isg-label">Etkilenecek Kişiler</label>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 6 }}>
            {companyEmployees.length > 0 ? (
              companyEmployees.map(emp => {
                const fullName = (emp.firstName + " " + emp.lastName).trim();
                const selected = (newDof.affectedPersons || "").split(",").map(s => s.trim()).filter(Boolean);
                const isSelected = selected.includes(fullName);
                return (
                  <button key={emp.id} type="button" onClick={() => {
                    const current = (newDof.affectedPersons || "").split(",").map(s => s.trim()).filter(Boolean);
                    const updated = isSelected ? current.filter(n => n !== fullName) : [...current, fullName];
                    setField("affectedPersons", updated.join(", "));
                  }} style={{ fontSize: 11, padding: "4px 10px", borderRadius: 12, border: isSelected ? "1.5px solid #3b82f6" : "1px solid var(--isg-border, #334155)", backgroundColor: isSelected ? "#3b82f622" : "transparent", color: isSelected ? "#3b82f6" : "var(--isg-text-muted)", cursor: "pointer" }}>
                    {isSelected ? "✓ " : ""}{fullName}
                  </button>
                );
              })
            ) : (
              <span style={{ fontSize: 12, color: "var(--isg-text-muted)" }}>{newDof.companyId ? "Bu firmaya ait çalışan yok" : "Önce firma seçin"}</span>
            )}
          </div>
          <input style={{ ...styles.input, fontSize: 12 }} className="isg-input" value={newDof.affectedPersons} onChange={e => setField("affectedPersons", e.target.value)} placeholder="Tüm çalışanlar veya isimleri seçin/yazın" />
        </div>
        <div style={{ marginTop: 10, display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(min(220px, 100%), 1fr))", gap: 16 }}>
          {(["beforePhoto", "afterPhoto"] as const).map(field => {
            const label = field === "beforePhoto" ? "📷 Öncesi Fotoğraf (Uygunsuzluk)" : "📷 Sonrası Fotoğraf (Düzeltme)";
            const value = newDof[field];
            const inputId = `dof-new-${field}`;
            return (
              <div key={field}>
                <label style={styles.label} className="isg-label">{label}</label>
                {value ? (
                  <div style={{ display: "flex", alignItems: "flex-start", gap: 10 }}>
                    <div style={{ position: "relative" as const, display: "inline-block" }}>
                      <img src={value} alt={field} style={{ width: 120, height: 90, objectFit: "cover" as const, borderRadius: 8, border: "1px solid var(--isg-border)" }} />
                      <button type="button" onClick={() => setField(field, "")} style={{ position: "absolute" as const, top: -6, right: -6, width: 20, height: 20, borderRadius: "50%", border: "none", backgroundColor: "#dc2626", color: "white", fontSize: 11, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>✕</button>
                    </div>
                    <label htmlFor={inputId} style={{ ...styles.btnSecondary, cursor: "pointer", fontSize: 12, display: "inline-flex", alignItems: "center", gap: 5 }}>
                      🔄 Değiştir
                      <input id={inputId} type="file" accept="image/*" style={{ display: "none" }} onChange={e => handleNewPhoto(field, e)} />
                    </label>
                  </div>
                ) : (
                  <label htmlFor={inputId} style={{
                    display: "flex", alignItems: "center", gap: 8, cursor: "pointer",
                    height: 38, padding: "0 14px", borderRadius: 8, fontSize: 13, fontWeight: 700,
                    border: "1px dashed var(--isg-border)", backgroundColor: "var(--isg-input-bg)",
                    color: "var(--isg-text-muted)", transition: "border-color 0.15s",
                  }}>
                    📎 Fotoğraf Seç
                    <input id={inputId} type="file" accept="image/*" style={{ display: "none" }} onChange={e => handleNewPhoto(field, e)} />
                  </label>
                )}
              </div>
            );
          })}
        </div>
        <div style={{ marginTop: 14, border: "1px solid var(--isg-border)", borderRadius: 10, padding: 14, backgroundColor: "rgba(255,255,255,0.025)" }}>
          <div style={{ display: "flex", justifyContent: "space-between", gap: 12, alignItems: "center", flexWrap: "wrap", marginBottom: 10 }}>
            <div>
              <div style={{ fontSize: 12, fontWeight: 800, textTransform: "uppercase" as const, letterSpacing: "0.07em", color: "var(--isg-text-muted)" }}>AI Fotoğraf Analizi</div>
              <div style={{ fontSize: 12, color: "var(--isg-text-subtle)", marginTop: 3 }}>Model yalnızca sabit checklist id eşleşmesi yapar; mevzuat ve DÖF metni koddan üretilir.</div>
            </div>
            <button type="button" style={{ ...styles.btnSecondary, opacity: newDof.beforePhoto && !visionLoading ? 1 : 0.55 }} disabled={!newDof.beforePhoto || visionLoading} onClick={() => analyzePhoto(newDof.beforePhoto)}>
              {visionLoading ? "Analiz ediliyor..." : "Fotoğrafı Analiz Et"}
            </button>
          </div>
          {visionError && (
            <div style={{ fontSize: 12, color: visionError.startsWith("Fotoğrafta") ? "var(--isg-warning)" : "var(--isg-danger)", marginBottom: 10 }}>{visionError}</div>
          )}
          {visionDetections.length > 0 && (
            <div style={{ display: "grid", gap: 8 }}>
              {visionDetections.map(item => {
                const checklist = findChecklistItem(item.id);
                if (!checklist) return null;
                const uncertain = item.confidence < 0.6;
                return (
                  <div key={item.id} style={{ border: "1px solid var(--isg-border)", borderRadius: 8, padding: 10, backgroundColor: item.approved ? "rgba(76,201,166,0.08)" : "var(--isg-input-bg)" }}>
                    <div style={{ display: "flex", gap: 10, justifyContent: "space-between", alignItems: "flex-start" }}>
                      <div style={{ minWidth: 0 }}>
                        <div style={{ fontSize: 13, fontWeight: 800 }}>{checklist.label}</div>
                        <div style={{ fontSize: 12, color: "var(--isg-text-muted)", marginTop: 4 }}>{item.evidence}</div>
                        <div style={{ fontSize: 11, color: uncertain ? "var(--isg-warning)" : "var(--isg-accent)", marginTop: 5 }}>
                          Güven: {Math.round(item.confidence * 100)}%{uncertain ? " · Kesin değil, manuel kontrol edilmeli" : ""}
                        </div>
                      </div>
                      <div style={{ display: "flex", gap: 6, flexShrink: 0 }}>
                        <button type="button" style={{ ...styles.btnSecondary, height: 30, padding: "0 10px", fontSize: 11 }} onClick={() => toggleDetection(item.id)}>{item.approved ? "Onaylı" : "Onayla"}</button>
                        <button type="button" style={{ ...styles.btnDanger, height: 30, padding: "0 10px", fontSize: 11 }} onClick={() => removeDetection(item.id)}>Sil</button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
          {uncertainDetections.length > 0 && (
            <div style={{ marginTop: 10, fontSize: 12, color: "var(--isg-warning)" }}>Manuel kontrol önerilir: {uncertainDetections.length} düşük güvenli madde otomatik DÖF'e eklenmedi.</div>
          )}
          <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap", marginTop: 12 }}>
            <select style={{ ...styles.select, maxWidth: 360 }} value={manualChecklistId} onChange={e => setManualChecklistId(e.target.value)}>
              <option value="">Checklist'ten manuel madde ekle...</option>
              {CHECKLIST.map(item => <option key={item.id} value={item.id}>{item.label}</option>)}
            </select>
            <button type="button" style={styles.btnSecondary} onClick={addManualDetection}>Manuel Ekle</button>
            <button type="button" style={{ ...styles.btnPrimary, opacity: approvedDetections.length ? 1 : 0.55 }} disabled={!approvedDetections.length} onClick={applyApprovedDetectionsToDof}>Onaylananları DÖF Metnine Aktar</button>
          </div>
        </div>
        <div style={{ marginTop: 12, display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
          <button style={{ ...styles.btnPrimary, opacity: dofAdding ? 0.6 : 1 }} disabled={dofAdding} onClick={addDof}>{dofAdding ? "Kaydediliyor..." : "DÖF Ekle"}</button>
          {dofAddStatus && (
            <span style={{ fontSize: 13, padding: "6px 12px", borderRadius: 6, backgroundColor: dofAddStatus.startsWith("✅") ? "#16a34a22" : dofAddStatus.startsWith("⚠️") ? "#d9770622" : "#dc262622", color: dofAddStatus.startsWith("✅") ? "#16a34a" : dofAddStatus.startsWith("⚠️") ? "#d97706" : "#dc2626" }}>{dofAddStatus}</span>
          )}
        </div>
      </div>
      <div style={styles.searchBar}>
        <input style={{ ...styles.input, maxWidth: 240 }} placeholder="Ara..." value={search} onChange={e => setSearch(e.target.value)} />
        <select style={{ ...styles.select, maxWidth: 180 }} value={selectedCompanyId} onChange={e => setSelectedCompanyId(e.target.value)}><option value="all">Tüm Firmalar</option>{companies.map(c => <option key={c.id} value={c.id}>{c.nickName}</option>)}</select>
        <span style={{ color: "#64748b", fontSize: 13 }}>{filteredDofs.length} kayıt</span>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))", gap: 12 }}>
        {filteredDofs.map(dof => {
          const company = companies.find(c => c.id === dof.companyId);
          const observer = observers.find(o => o.id === dof.observerId);
          const isEditing = editingDofId === dof.id;
          return (
            <div key={dof.id} style={{ ...styles.card, borderLeft: "3px solid " + priorityColor(dof.priority) }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 8 }}>
                <div style={{ fontWeight: 700, fontSize: 14 }}>{dof.title}</div>
                <Badge styles={styles} text={dof.priority} color={priorityColor(dof.priority)} />
              </div>
              <div style={{ fontSize: 12, color: "#94a3b8", marginBottom: 4 }}>{dof.description}</div>
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 8 }}>
                <span style={{ fontSize: 11, color: "var(--isg-text-muted)" }}>📍 {dof.location}</span>
                <span style={{ fontSize: 11, color: "var(--isg-text-muted)" }}>👤 {dof.responsible}</span>
                <span style={{ fontSize: 11, color: "var(--isg-text-muted)" }}>📅 {dof.dueDate}</span>
                {dof.affectedPersons && <span style={{ fontSize: 11, color: "var(--isg-text-muted)" }}>👥 {dof.affectedPersons}</span>}
              </div>
              <div style={{ display: "flex", gap: 6, marginBottom: 8, flexWrap: "wrap" }}>
                <Badge styles={styles} text={dof.status} color={dof.status === "Çözüldü" ? "#16a34a" : dof.status === "Riske Aktarıldı" ? "#7c3aed" : dof.status === "Önlem Alındı" ? "#d97706" : dof.status === "Bildirildi" ? "#0ea5e9" : "#dc2626"} />
                <span style={{ fontSize: 11, color: "var(--isg-text-muted)" }}>{company?.nickName}</span>
                {observer && <span style={{ fontSize: 11, color: "var(--isg-text-muted)" }}>{observer.fullName}</span>}
              </div>
              {(dof.beforePhoto || dof.afterPhoto) && (
                <div style={{ display: "flex", gap: 8, marginBottom: 8 }}>
                  {dof.beforePhoto && <div><div style={{ fontSize: 10, color: "#64748b", marginBottom: 2 }}>Önce</div><img src={dof.beforePhoto} alt="önce" style={{ width: 80, height: 60, objectFit: "cover", borderRadius: 4 }} /></div>}
                  {dof.afterPhoto && <div><div style={{ fontSize: 10, color: "#64748b", marginBottom: 2 }}>Sonra</div><img src={dof.afterPhoto} alt="sonra" style={{ width: 80, height: 60, objectFit: "cover", borderRadius: 4 }} /></div>}
                </div>
              )}
              {isEditing && (
                <div style={{ marginBottom: 8 }}>
                  <select style={{ ...styles.select, marginBottom: 10 }} className="isg-input" value={dof.status} onChange={e => updateDofStatus(dof.id, e.target.value as DofRecord["status"])}>
                    <option>Açık</option><option>Bildirildi</option><option>Önlem Alındı</option><option>Çözüldü</option>
                  </select>
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(min(220px, 100%), 1fr))", gap: 16 }}>
                    {(["beforePhoto", "afterPhoto"] as const).map(field => {
                      const lbl = field === "beforePhoto" ? "📷 Öncesi Fotoğraf (Uygunsuzluk)" : "📷 Sonrası Fotoğraf (Düzeltme)";
                      const val = dof[field];
                      const inputId = `dof-edit-${dof.id}-${field}`;
                      return (
                        <div key={field}>
                          <label style={{ fontSize: 11, fontWeight: 700, color: "var(--isg-text-muted)", display: "block", marginBottom: 6, textTransform: "uppercase" as const, letterSpacing: "0.06em" }}>{lbl}</label>
                          {val ? (
                            <div style={{ display: "flex", alignItems: "flex-start", gap: 8 }}>
                              <div style={{ position: "relative" as const, display: "inline-block" }}>
                                <img src={val} alt={field} style={{ width: 140, height: 100, objectFit: "cover" as const, borderRadius: 8, border: "1px solid var(--isg-border)" }} />
                                <button type="button" onClick={() => removeDofPhoto(dof.id, field)} style={{ position: "absolute" as const, top: -6, right: -6, width: 20, height: 20, borderRadius: "50%", border: "none", backgroundColor: "#dc2626", color: "white", fontSize: 11, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>✕</button>
                              </div>
                              <label htmlFor={inputId} style={{ ...styles.btnSecondary, cursor: "pointer", fontSize: 11, display: "inline-flex", alignItems: "center", gap: 4 }}>
                                🔄 Değiştir
                                <input id={inputId} type="file" accept="image/*" style={{ display: "none" }} onChange={e => handleImageToBase64(e, b64 => updateDofPhoto(dof.id, field, b64))} />
                              </label>
                            </div>
                          ) : (
                            <label htmlFor={inputId} style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer", height: 38, padding: "0 14px", borderRadius: 8, fontSize: 13, fontWeight: 700, border: "1px dashed var(--isg-border)", backgroundColor: "var(--isg-input-bg)", color: "var(--isg-text-muted)" }}>
                              📎 Fotoğraf Seç
                              <input id={inputId} type="file" accept="image/*" style={{ display: "none" }} onChange={e => handleImageToBase64(e, b64 => updateDofPhoto(dof.id, field, b64))} />
                            </label>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
              <div style={{ display: "flex", gap: 6 }}>
                <button style={styles.btnSecondary} onClick={() => setEditingDofId(isEditing ? null : dof.id)}>{isEditing ? "Kapat" : "Düzenle"}</button>
                {risks.some(r => r.sourceDofId === dof.id) ? (
                  <button style={{ ...styles.btnSuccess, fontSize: 11, padding: "4px 10px" }} onClick={() => createRiskFromDof(dof)}>✓ Risk Görüntüle</button>
                ) : dof.status !== "Riske Aktarıldı" && (
                  <button style={{ ...styles.btnPrimary, fontSize: 11, padding: "4px 10px", opacity: dof.status === "Önlem Alındı" ? 1 : 0.6 }} onClick={() => {
                    if (dof.status !== "Önlem Alındı") {
                      setDofAddStatus('⚠️ Riske aktarmak için önce DÖF durumunu "Önlem Alındı" olarak değiştirin');
                      setTimeout(() => setDofAddStatus(null), 4000);
                      return;
                    }
                    createRiskFromDof(dof);
                  }}>⚡ Riske Aktar</button>
                )}
                <button style={{ ...styles.btnSecondary, fontSize: 11, padding: "4px 8px" }} onClick={() => generateDofPDF(dof)}>📄 PDF</button>
                <button style={styles.btnDanger} onClick={() => deleteDof(dof.id)}>Sil</button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
