import React from "react";
import { IsoTarihSecici } from "./TarihSecici";
import { formatDate } from "./dateUtils";
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
  const [typeFilter, setTypeFilter] = React.useState<"all" | TrainingType>("all");
  const [statusFilter, setStatusFilter] = React.useState<"all" | TrainingStatus>("all");
  const availableParticipants = employees.filter(employee => employee.companyId === newTraining.companyId);
  const trainingTypeColor = (type: "all" | TrainingType) =>
    type === "Acil Durum Eğitimi" ? "#C0392B"
      : type === "KKD Eğitimi" ? "#2D6A4F"
        : type === "İşe Giriş Eğitimi" ? "#0ea5e9"
          : type === "Yenileme Eğitimi" ? "#D4A017"
            : type === "all" ? "#52d3b5"
              : "#8b5cf6";
  const trainingStatusColor = (status: "all" | TrainingStatus) =>
    status === "Tamamlandı" ? "#2D6A4F"
      : status === "İptal" ? "#C0392B"
        : status === "all" ? "#52d3b5"
          : "#D4A017";
  const visibleTrainings = React.useMemo(() => filteredTrainings.filter(training => {
    const matchesType = typeFilter === "all" || training.type === typeFilter;
    const matchesStatus = statusFilter === "all" || training.status === statusFilter;
    return matchesType && matchesStatus;
  }), [filteredTrainings, typeFilter, statusFilter]);
  const typeFilters: Array<{ value: "all" | TrainingType; label: string; count: number; color: string }> = (["all", "Temel İSG Eğitimi", "İşe Giriş Eğitimi", "Yenileme Eğitimi", "Acil Durum Eğitimi", "KKD Eğitimi", "Hijyen Eğitimi"] as const).map(type => ({
    value: type,
    label: type === "all" ? "Tüm Türler" : type,
    count: type === "all" ? filteredTrainings.length : filteredTrainings.filter(training => training.type === type).length,
    color: trainingTypeColor(type),
  }));
  const statusFilters: Array<{ value: "all" | TrainingStatus; label: string; count: number; color: string }> = (["all", "Planlandı", "Tamamlandı", "İptal"] as const).map(status => ({
    value: status,
    label: status === "all" ? "Tüm Durumlar" : status,
    count: status === "all" ? filteredTrainings.length : filteredTrainings.filter(training => training.status === status).length,
    color: trainingStatusColor(status),
  }));

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
          <FormField styles={styles} label="Eğitim Tarihi *"><IsoTarihSecici allowFuture styles={styles} value={newTraining.trainingDate} onChange={v => setNewTraining({ ...newTraining, trainingDate: v })} /></FormField>
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
        <span style={{ color: "var(--isg-text-muted)", fontSize: 13 }}>{visibleTrainings.length} eğitim</span>
      </div>

      <div style={{ ...styles.card, padding: 14, marginBottom: 16 }} className="isg-card">
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(min(280px, 100%), 1fr))", gap: 14 }}>
          <div>
            <div style={{ ...styles.label, marginBottom: 8 }} className="isg-label">Eğitim Türü Filtresi</div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
              {typeFilters.map(filter => {
                const active = typeFilter === filter.value;
                return (
                  <button
                    key={filter.value}
                    type="button"
                    onClick={() => setTypeFilter(filter.value)}
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
            <div style={{ ...styles.label, marginBottom: 8 }} className="isg-label">Durum Filtresi</div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
              {statusFilters.map(filter => {
                const active = statusFilter === filter.value;
                return (
                  <button
                    key={filter.value}
                    type="button"
                    onClick={() => setStatusFilter(filter.value)}
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
          <thead><tr>{["Firma", "Eğitim", "Tür", "Tarih", "Süre / Yer", "Eğitmen", "Katılımcı", "Durum", "Not", "Çıktılar", "İşlem"].map(h => <th key={h} style={styles.th} className="isg-th">{h}</th>)}</tr></thead>
          <tbody>
            {visibleTrainings.map(training => {
              const company = companies.find(c => c.id === training.companyId);
              const participants = training.participantIds
                .map(id => employees.find(employee => employee.id === id))
                .filter(Boolean)
                .map(employee => employee!.firstName + " " + employee!.lastName);
              return (
                <tr key={training.id}>
                  <td style={styles.td} className="isg-td">{company?.nickName || "—"}</td>
                  <td style={{ ...styles.td, minWidth: 180 }} className="isg-td"><strong>{training.title}</strong></td>
                  <td style={styles.td} className="isg-td"><Badge styles={styles} text={training.type} color={trainingTypeColor(training.type)} /></td>
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
            {visibleTrainings.length === 0 && (
              <EmptyTableRow colSpan={11} message="Yeni eğitim kaydı eklemek için yukarıdaki formu kullanın." />
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
