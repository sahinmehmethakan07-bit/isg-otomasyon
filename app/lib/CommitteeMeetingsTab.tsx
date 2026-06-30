import React from "react";
import { IsoTarihSecici } from "./TarihSecici";
import { formatDate } from "./dateUtils";
import { EmptyTableRow } from "./EmptyState";
import { generateCommitteeMeetingPDF } from "./pdf";
import type { CommitteeMeetingRecord, CommitteeMeetingStatus, Company, Employee } from "./types";

type CommitteeMeetingDraft = {
  companyId: string;
  meetingNo: string;
  meetingDate: string;
  location: string;
  chairperson: string;
  participantIds: string[];
  agenda: string;
  decisions: string;
  status: CommitteeMeetingStatus;
  notes: string;
};

type CommitteeMeetingsTabProps = {
  styles: Record<string, React.CSSProperties>;
  companies: Company[];
  employees: Employee[];
  filteredCommitteeMeetings: CommitteeMeetingRecord[];
  newCommitteeMeeting: CommitteeMeetingDraft;
  setNewCommitteeMeeting: React.Dispatch<React.SetStateAction<CommitteeMeetingDraft>>;
  search: string;
  setSearch: (value: string) => void;
  selectedCompanyId: string;
  setSelectedCompanyId: (value: string) => void;
  toggleCommitteeParticipant: (employeeId: string) => void;
  addCommitteeMeeting: () => void;
  updateCommitteeMeetingStatus: (id: string, status: CommitteeMeetingStatus) => void;
  deleteCommitteeMeeting: (id: string) => void;
};

function FormField({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label>
      <span style={{ display: "block", fontSize: 12, color: "var(--isg-text-muted)", marginBottom: 8, fontWeight: 700 }}>{label}</span>
      {children}
    </label>
  );
}

const statusColor = (status: "all" | CommitteeMeetingStatus) =>
  status === "Yapıldı" ? "#2D6A4F"
    : status === "Ertelendi" ? "#C0392B"
      : status === "Kararlar Takipte" ? "#D4A017"
        : status === "all" ? "#52d3b5"
          : "#0ea5e9";

export function CommitteeMeetingsTab({
  styles,
  companies,
  employees,
  filteredCommitteeMeetings,
  newCommitteeMeeting,
  setNewCommitteeMeeting,
  search,
  setSearch,
  selectedCompanyId,
  setSelectedCompanyId,
  toggleCommitteeParticipant,
  addCommitteeMeeting,
  updateCommitteeMeetingStatus,
  deleteCommitteeMeeting,
}: CommitteeMeetingsTabProps) {
  const [statusFilter, setStatusFilter] = React.useState<"all" | CommitteeMeetingStatus>("all");
  const [participantFilter, setParticipantFilter] = React.useState<"all" | "withParticipants" | "withoutParticipants">("all");

  const visibleCommitteeMeetings = React.useMemo(() => filteredCommitteeMeetings.filter(meeting => {
    const hasParticipants = meeting.participantIds.length > 0;
    const matchesStatus = statusFilter === "all" || meeting.status === statusFilter;
    const matchesParticipants =
      participantFilter === "all" ||
      (participantFilter === "withParticipants" && hasParticipants) ||
      (participantFilter === "withoutParticipants" && !hasParticipants);

    return matchesStatus && matchesParticipants;
  }), [filteredCommitteeMeetings, participantFilter, statusFilter]);

  const statusFilters: Array<{ value: "all" | CommitteeMeetingStatus; label: string; count: number; color: string }> = (
    ["all", "Planlandı", "Yapıldı", "Ertelendi", "Kararlar Takipte"] as const
  ).map(status => ({
    value: status,
    label: status === "all" ? "Tüm Durumlar" : status,
    count: status === "all" ? filteredCommitteeMeetings.length : filteredCommitteeMeetings.filter(meeting => meeting.status === status).length,
    color: statusColor(status),
  }));

  const participantFilters = [
    { value: "all" as const, label: "Tüm Toplantılar", count: filteredCommitteeMeetings.length, color: "#52d3b5" },
    {
      value: "withParticipants" as const,
      label: "Katılımcı Seçili",
      count: filteredCommitteeMeetings.filter(meeting => meeting.participantIds.length > 0).length,
      color: "#2D6A4F",
    },
    {
      value: "withoutParticipants" as const,
      label: "Katılımcı Eksik",
      count: filteredCommitteeMeetings.filter(meeting => meeting.participantIds.length === 0).length,
      color: "#C0392B",
    },
  ];

  return (
    <div>
      <div style={styles.card} className="isg-card">
        <p style={styles.sectionTitle} className="isg-text-muted">Kurul Toplantısı</p>
        <div style={styles.formGrid}>
          <FormField label="Firma *">
            <select
              style={styles.select}
              className="isg-input"
              value={newCommitteeMeeting.companyId}
              onChange={e => setNewCommitteeMeeting({ ...newCommitteeMeeting, companyId: e.target.value, participantIds: [] })}
            >
              <option value="">Seçin...</option>
              {companies.map(c => <option key={c.id} value={c.id}>{c.nickName}</option>)}
            </select>
          </FormField>
          <FormField label="Toplantı No"><input style={styles.input} className="isg-input" value={newCommitteeMeeting.meetingNo} onChange={e => setNewCommitteeMeeting({ ...newCommitteeMeeting, meetingNo: e.target.value })} placeholder="Örn. 2026/01" /></FormField>
          <FormField label="Toplantı Tarihi *"><IsoTarihSecici allowFuture styles={styles} value={newCommitteeMeeting.meetingDate} onChange={v => setNewCommitteeMeeting({ ...newCommitteeMeeting, meetingDate: v })} /></FormField>
          <FormField label="Toplantı Yeri"><input style={styles.input} className="isg-input" value={newCommitteeMeeting.location} onChange={e => setNewCommitteeMeeting({ ...newCommitteeMeeting, location: e.target.value })} placeholder="Toplantı salonu" /></FormField>
          <FormField label="Kurul Başkanı"><input style={styles.input} className="isg-input" value={newCommitteeMeeting.chairperson} onChange={e => setNewCommitteeMeeting({ ...newCommitteeMeeting, chairperson: e.target.value })} placeholder="Ad Soyad" /></FormField>
          <FormField label="Durum">
            <select style={styles.select} className="isg-input" value={newCommitteeMeeting.status} onChange={e => setNewCommitteeMeeting({ ...newCommitteeMeeting, status: e.target.value as CommitteeMeetingStatus })}>
              <option>Planlandı</option>
              <option>Yapıldı</option>
              <option>Ertelendi</option>
              <option>Kararlar Takipte</option>
            </select>
          </FormField>
          <FormField label="Gündem"><input style={styles.input} className="isg-input" value={newCommitteeMeeting.agenda} onChange={e => setNewCommitteeMeeting({ ...newCommitteeMeeting, agenda: e.target.value })} placeholder="Gündem maddeleri" /></FormField>
          <FormField label="Alınan Kararlar"><input style={styles.input} className="isg-input" value={newCommitteeMeeting.decisions} onChange={e => setNewCommitteeMeeting({ ...newCommitteeMeeting, decisions: e.target.value })} placeholder="Kararlar ve aksiyonlar" /></FormField>
          <FormField label="Not"><input style={styles.input} className="isg-input" value={newCommitteeMeeting.notes} onChange={e => setNewCommitteeMeeting({ ...newCommitteeMeeting, notes: e.target.value })} placeholder="Takip, sorumlu, termin..." /></FormField>
        </div>

        <div style={{ marginTop: 18 }}>
          <div style={{ ...styles.label, marginBottom: 8 }} className="isg-label">Katılımcılar</div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
            {employees.filter(employee => employee.companyId === newCommitteeMeeting.companyId).map(employee => {
              const checked = newCommitteeMeeting.participantIds.includes(employee.id);
              return (
                <button
                  key={employee.id}
                  type="button"
                  onClick={() => toggleCommitteeParticipant(employee.id)}
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
            {!newCommitteeMeeting.companyId && <span style={{ color: "var(--isg-text-muted)", fontSize: 13 }}>Katılımcı seçmek için önce firma seçin.</span>}
            {newCommitteeMeeting.companyId && employees.filter(employee => employee.companyId === newCommitteeMeeting.companyId).length === 0 && (
              <span style={{ color: "var(--isg-text-muted)", fontSize: 13 }}>Bu firmaya kayıtlı personel bulunamadı.</span>
            )}
          </div>
        </div>

        <div style={{ marginTop: 14, display: "flex", gap: 10, flexWrap: "wrap" }}>
          <button style={styles.btnPrimary} onClick={addCommitteeMeeting}>Toplantı Kaydı Ekle</button>
        </div>
      </div>

      <div style={styles.searchBar}>
        <input style={{ ...styles.input, maxWidth: 300 }} placeholder="Ara..." value={search} onChange={e => setSearch(e.target.value)} />
        <select style={{ ...styles.select, maxWidth: 180 }} value={selectedCompanyId} onChange={e => setSelectedCompanyId(e.target.value)}><option value="all">Tüm Firmalar</option>{companies.map(c => <option key={c.id} value={c.id}>{c.nickName}</option>)}</select>
        <span style={{ color: "var(--isg-text-muted)", fontSize: 13 }}>{visibleCommitteeMeetings.length} toplantı</span>
      </div>

      <div style={{ ...styles.card, padding: 14, marginBottom: 16 }} className="isg-card">
        <div style={{ display: "grid", gap: 14 }}>
          <div>
            <div style={{ ...styles.label, marginBottom: 8 }} className="isg-label">Durum Filtresi</div>
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
            <div style={{ ...styles.label, marginBottom: 8 }} className="isg-label">Katılımcı Filtresi</div>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              {participantFilters.map(filter => {
                const active = participantFilter === filter.value;
                return (
                  <button
                    key={filter.value}
                    type="button"
                    onClick={() => setParticipantFilter(filter.value)}
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
      </div>

      <div style={{ ...styles.card, padding: 0, overflow: "auto", WebkitOverflowScrolling: "touch" as any }}>
        <table style={styles.table}>
          <thead><tr>{["Firma", "No", "Tarih", "Yer", "Başkan", "Katılımcı", "Durum", "Gündem / Kararlar", "Çıktı", "İşlem"].map(h => <th key={h} style={styles.th} className="isg-th">{h}</th>)}</tr></thead>
          <tbody>
            {visibleCommitteeMeetings.map(meeting => {
              const company = companies.find(c => c.id === meeting.companyId);
              const participants = meeting.participantIds
                .map(id => employees.find(employee => employee.id === id))
                .filter(Boolean)
                .map(employee => `${employee!.firstName} ${employee!.lastName}`);
              return (
                <tr key={meeting.id}>
                  <td style={styles.td} className="isg-td">{company?.nickName || "—"}</td>
                  <td style={styles.td} className="isg-td">{meeting.meetingNo || "—"}</td>
                  <td style={styles.td} className="isg-td">{formatDate(meeting.meetingDate)}</td>
                  <td style={styles.td} className="isg-td">{meeting.location || "—"}</td>
                  <td style={styles.td} className="isg-td">{meeting.chairperson || "—"}</td>
                  <td style={{ ...styles.td, minWidth: 180 }} className="isg-td">{participants.length > 0 ? participants.join(", ") : "—"}</td>
                  <td style={styles.td} className="isg-td">
                    <select style={{ ...styles.select, minWidth: 140 }} value={meeting.status} onChange={e => updateCommitteeMeetingStatus(meeting.id, e.target.value as CommitteeMeetingStatus)}>
                      <option>Planlandı</option>
                      <option>Yapıldı</option>
                      <option>Ertelendi</option>
                      <option>Kararlar Takipte</option>
                    </select>
                  </td>
                  <td style={{ ...styles.td, minWidth: 230, color: "var(--isg-text-muted)" }} className="isg-td">{[meeting.agenda, meeting.decisions, meeting.notes].filter(Boolean).join(" / ") || "—"}</td>
                  <td style={styles.td} className="isg-td"><button style={styles.btnSecondary} onClick={() => generateCommitteeMeetingPDF(meeting, company, employees)}>Tutanak PDF</button></td>
                  <td style={styles.td} className="isg-td"><button style={styles.btnDanger} onClick={() => deleteCommitteeMeeting(meeting.id)}>Sil</button></td>
                </tr>
              );
            })}
            {visibleCommitteeMeetings.length === 0 && (
              <EmptyTableRow colSpan={10} message="Yeni kurul toplantısı kaydı eklemek için yukarıdaki formu kullanın." />
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
