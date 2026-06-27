import React, { useEffect, useState } from "react";
import { formatDate, formatDateShort } from "./dateUtils";
import {
  generateTrainingAttendancePDF,
  generateTrainingCertificatesPDF,
  generateTrainingPDF,
} from "./pdf";
import { EmptyTableRow } from "./EmptyState";
import type { Company, Employee, TrainingRecord, TrainingStatus, TrainingType } from "./types";

type Styles = Record<string, React.CSSProperties>;

type TrainingDraft = {
  companyId: string;
  title: string;
  type: TrainingType;
  trainingDate: string;
  durationHours: string;
  location: string;
  trainer: string;
  participantIds: string[];
  status: TrainingStatus;
  notes: string;
};

function FormField({ styles, label, children }: { styles: Styles; label: string; children: React.ReactNode }) {
  return <div><label style={styles.label} className="isg-label">{label}</label>{children}</div>;
}

function Badge({ styles, text, color }: { styles: Styles; text: string; color: string }) {
  return <span style={{ ...styles.badge, backgroundColor: color + "22", color, border: "1px solid " + color + "44" }}>{text}</span>;
}

function DatePicker({ styles, value, onChange }: { styles: Styles; value: string; onChange: (v: string) => void }) {
  const [open, setOpen] = useState(false);
  const ref = React.useRef<HTMLDivElement>(null);
  const now = value ? new Date(value) : new Date();
  const [viewYear, setViewYear] = useState(now.getFullYear());
  const [viewMonth, setViewMonth] = useState(now.getMonth());

  const months = ["Oca","Şub","Mar","Nis","May","Haz","Tem","Ağu","Eyl","Eki","Kas","Ara"];
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
            <button onClick={() => { if (viewMonth === 0) { setViewMonth(11); setViewYear(y => y - 1); } else setViewMonth(m => m - 1); }} style={{ ...styles.btnSecondary, padding: "2px 8px" }}>‹</button>
            <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
              <select value={viewMonth} onChange={e => setViewMonth(Number(e.target.value))} style={{ ...styles.select, width: "auto", padding: "2px 6px", fontSize: 12 }}>
                {months.map((m, i) => <option key={i} value={i}>{m}</option>)}
              </select>
              <select value={viewYear} onChange={e => setViewYear(Number(e.target.value))} style={{ ...styles.select, width: "auto", padding: "2px 6px", fontSize: 12 }}>
                {Array.from({ length: 20 }, (_, i) => 2020 + i).map(y => <option key={y} value={y}>{y}</option>)}
              </select>
            </div>
            <button onClick={() => { if (viewMonth === 11) { setViewMonth(0); setViewYear(y => y + 1); } else setViewMonth(m => m + 1); }} style={{ ...styles.btnSecondary, padding: "2px 8px" }}>›</button>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 2, marginBottom: 4 }}>
            {["Pt","Sa","Ça","Pe","Cu","Ct","Pz"].map(d => <div key={d} style={{ textAlign: "center", fontSize: 10, color: "var(--isg-text-muted)", padding: "2px 0" }}>{d}</div>)}
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 2 }}>
            {Array.from({ length: firstDay }).map((_, i) => <div key={"e" + i} />)}
            {Array.from({ length: daysInMonth }, (_, i) => i + 1).map(day => {
              const isSelected = selectedDate && selectedDate.getFullYear() === viewYear && selectedDate.getMonth() === viewMonth && selectedDate.getDate() === day;
              return (
                <button key={day} onClick={() => select(day)} style={{ backgroundColor: isSelected ? "#1B4332" : "transparent", color: isSelected ? "#fff" : "var(--isg-text)", border: "none", borderRadius: 4, padding: "4px 0", fontSize: 12, cursor: "pointer", textAlign: "center" }}>
                  {day}
                </button>
              );
            })}
          </div>
          <button onClick={() => { onChange(""); setOpen(false); }} style={{ ...styles.btnSecondary, width: "100%", marginTop: 8, fontSize: 11 }}>Temizle</button>
        </div>
      )}
    </div>
  );
}

export function TrainingsTab({
  styles,
  companies,
  employees,
  filteredTrainings,
  newTraining,
  setNewTraining,
  search,
  setSearch,
  selectedCompanyId,
  setSelectedCompanyId,
  toggleTrainingParticipant,
  addTraining,
  updateTrainingStatus,
  deleteTraining,
}: {
  styles: Styles;
  companies: Company[];
  employees: Employee[];
  filteredTrainings: TrainingRecord[];
  newTraining: TrainingDraft;
  setNewTraining: (value: TrainingDraft) => void;
  search: string;
  setSearch: (value: string) => void;
  selectedCompanyId: string;
  setSelectedCompanyId: (value: string) => void;
  toggleTrainingParticipant: (employeeId: string) => void;
  addTraining: () => void;
  updateTrainingStatus: (id: string, status: TrainingStatus) => void;
  deleteTraining: (id: string) => void;
}) {
  const availableParticipants = employees.filter(employee => employee.companyId === newTraining.companyId);

  return (
    <div>
      <div style={styles.card} className="isg-card">
        <p style={styles.sectionTitle} className="isg-text-muted">Eğitim Yönetimi</p>
        <div style={styles.formGrid}>
          <FormField styles={styles} label="Firma *">
            <select style={styles.select} className="isg-input" value={newTraining.companyId} onChange={e => setNewTraining({ ...newTraining, companyId: e.target.value, participantIds: [] })}>
              <option value="">Seçin...</option>
              {companies.map(c => <option key={c.id} value={c.id}>{c.nickName}</option>)}
            </select>
          </FormField>
          <FormField styles={styles} label="Eğitim Türü">
            <select style={styles.select} className="isg-input" value={newTraining.type} onChange={e => setNewTraining({ ...newTraining, type: e.target.value as TrainingType })}>
              <option>Temel İSG Eğitimi</option>
              <option>İşe Giriş Eğitimi</option>
              <option>Yenileme Eğitimi</option>
              <option>Acil Durum Eğitimi</option>
              <option>KKD Eğitimi</option>
              <option>Hijyen Eğitimi</option>
            </select>
          </FormField>
          <FormField styles={styles} label="Eğitim Başlığı *"><input style={styles.input} className="isg-input" value={newTraining.title} onChange={e => setNewTraining({ ...newTraining, title: e.target.value })} placeholder="Örn. Yeni başlayan personel eğitimi" /></FormField>
          <FormField styles={styles} label="Eğitim Tarihi *"><DatePicker styles={styles} value={newTraining.trainingDate} onChange={v => setNewTraining({ ...newTraining, trainingDate: v })} /></FormField>
          <FormField styles={styles} label="Süre (Saat)"><input style={styles.input} className="isg-input" value={newTraining.durationHours} onChange={e => setNewTraining({ ...newTraining, durationHours: e.target.value })} placeholder="Örn. 4" /></FormField>
          <FormField styles={styles} label="Eğitim Yeri"><input style={styles.input} className="isg-input" value={newTraining.location} onChange={e => setNewTraining({ ...newTraining, location: e.target.value })} placeholder="Toplantı salonu, saha..." /></FormField>
          <FormField styles={styles} label="Eğitmen / Sorumlu"><input style={styles.input} className="isg-input" value={newTraining.trainer} onChange={e => setNewTraining({ ...newTraining, trainer: e.target.value })} placeholder="Eğitimi veren kişi" /></FormField>
          <FormField styles={styles} label="Durum">
            <select style={styles.select} className="isg-input" value={newTraining.status} onChange={e => setNewTraining({ ...newTraining, status: e.target.value as TrainingStatus })}>
              <option>Planlandı</option>
              <option>Tamamlandı</option>
              <option>İptal</option>
            </select>
          </FormField>
          <FormField styles={styles} label="Not"><input style={styles.input} className="isg-input" value={newTraining.notes} onChange={e => setNewTraining({ ...newTraining, notes: e.target.value })} placeholder="Kısa açıklama" /></FormField>
        </div>

        <div style={{ marginTop: 18 }}>
          <div style={{ ...styles.label, marginBottom: 8 }} className="isg-label">Katılımcılar</div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
            {availableParticipants.map(employee => {
              const checked = newTraining.participantIds.includes(employee.id);
              return (
                <button
                  key={employee.id}
                  type="button"
                  onClick={() => toggleTrainingParticipant(employee.id)}
                  style={{
                    border: checked ? "1px solid color-mix(in srgb, var(--isg-accent) 72%, white)" : "1px solid var(--isg-border)",
                    backgroundColor: checked ? "rgba(104, 211, 180, 0.16)" : "var(--isg-input-bg)",
                    color: checked ? "var(--isg-accent)" : "var(--isg-text-muted)",
                    borderRadius: 8,
                    padding: "8px 11px",
                    fontSize: 12,
                    fontWeight: 700,
                    cursor: "pointer",
                  }}
                >
                  {checked ? "✓ " : ""}{employee.firstName} {employee.lastName}
                </button>
              );
            })}
            {!newTraining.companyId && <span style={{ color: "var(--isg-text-muted)", fontSize: 13 }}>Katılımcı seçmek için önce firma seçin.</span>}
            {newTraining.companyId && availableParticipants.length === 0 && <span style={{ color: "var(--isg-text-muted)", fontSize: 13 }}>Bu firmaya kayıtlı personel bulunamadı.</span>}
          </div>
        </div>

        <div style={{ marginTop: 14, display: "flex", gap: 10, flexWrap: "wrap" }}>
          <button style={styles.btnPrimary} onClick={addTraining}>Eğitim Kaydı Ekle</button>
          <button style={styles.btnSecondary} onClick={() => generateTrainingPDF(filteredTrainings, companies, employees)}>PDF İndir</button>
        </div>
      </div>

      <div style={styles.searchBar}>
        <input style={{ ...styles.input, maxWidth: 300 }} placeholder="Ara..." value={search} onChange={e => setSearch(e.target.value)} />
        <select style={{ ...styles.select, maxWidth: 180 }} value={selectedCompanyId} onChange={e => setSelectedCompanyId(e.target.value)}><option value="all">Tüm Firmalar</option>{companies.map(c => <option key={c.id} value={c.id}>{c.nickName}</option>)}</select>
        <span style={{ color: "var(--isg-text-muted)", fontSize: 13 }}>{filteredTrainings.length} eğitim</span>
      </div>

      <div style={{ ...styles.card, padding: 0, overflow: "auto", WebkitOverflowScrolling: "touch" as any }}>
        <table style={styles.table}>
          <thead><tr>{["Firma", "Eğitim", "Tür", "Tarih", "Süre / Yer", "Eğitmen", "Katılımcı", "Durum", "Not", "Çıktılar", "İşlem"].map(h => <th key={h} style={styles.th} className="isg-th">{h}</th>)}</tr></thead>
          <tbody>
            {filteredTrainings.map(training => {
              const company = companies.find(c => c.id === training.companyId);
              const participants = training.participantIds
                .map(id => employees.find(employee => employee.id === id))
                .filter(Boolean)
                .map(employee => employee!.firstName + " " + employee!.lastName);
              return (
                <tr key={training.id}>
                  <td style={styles.td} className="isg-td">{company?.nickName || "—"}</td>
                  <td style={{ ...styles.td, minWidth: 180 }} className="isg-td"><strong>{training.title}</strong></td>
                  <td style={styles.td} className="isg-td"><Badge styles={styles} text={training.type} color="#8b5cf6" /></td>
                  <td style={styles.td} className="isg-td">{formatDate(training.trainingDate)}</td>
                  <td style={styles.td} className="isg-td">{training.durationHours || training.location ? (training.durationHours || "—") + " saat / " + (training.location || "—") : "—"}</td>
                  <td style={styles.td} className="isg-td">{training.trainer || "—"}</td>
                  <td style={{ ...styles.td, minWidth: 180 }} className="isg-td">{participants.length > 0 ? participants.join(", ") : "—"}</td>
                  <td style={styles.td} className="isg-td">
                    <select style={{ ...styles.select, minWidth: 126 }} value={training.status} onChange={e => updateTrainingStatus(training.id, e.target.value as TrainingStatus)}>
                      <option>Planlandı</option>
                      <option>Tamamlandı</option>
                      <option>İptal</option>
                    </select>
                  </td>
                  <td style={{ ...styles.td, color: "var(--isg-text-muted)", minWidth: 150 }}>{training.notes || "—"}</td>
                  <td style={{ ...styles.td, minWidth: 190 }} className="isg-td">
                    <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                      <button style={styles.btnSecondary} onClick={() => generateTrainingAttendancePDF(training, company, employees)}>Katılım Formu</button>
                      <button style={styles.btnSecondary} onClick={() => generateTrainingCertificatesPDF(training, company, employees)}>Sertifika</button>
                    </div>
                  </td>
                  <td style={styles.td} className="isg-td"><button style={styles.btnDanger} onClick={() => deleteTraining(training.id)}>Sil</button></td>
                </tr>
              );
            })}
            {filteredTrainings.length === 0 && (
              <EmptyTableRow colSpan={11} message="Yeni eğitim kaydı eklemek için yukarıdaki formu kullanın." />
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
