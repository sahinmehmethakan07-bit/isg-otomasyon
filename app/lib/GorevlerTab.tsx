import React from "react";
import { formatDate } from "./dateUtils";
import { EmptyTableRow } from "./EmptyState";
import type { Company, TaskEscalation, TaskItem, TaskPriority } from "./types";

type GorevlerTabProps = {
  styles: Record<string, React.CSSProperties>;
  taskItems: TaskItem[];
  filteredTaskItems: TaskItem[];
  companies: Company[];
  search: string;
  setSearch: (v: string) => void;
  selectedCompanyId: string;
  setSelectedCompanyId: (v: string) => void;
  setActiveTab: (tab: string) => void;
};

function Badge({ text, color }: { text: string; color: string }) {
  return (
    <span style={{
      display: "inline-flex", alignItems: "center", padding: "3px 8px",
      borderRadius: 6, fontSize: 11, fontWeight: 700, whiteSpace: "nowrap",
      backgroundColor: color + "22", color, border: `1px solid ${color}44`,
    }}>
      {text}
    </span>
  );
}

const PRIORITY_COLORS: Record<TaskPriority, string> = {
  Kritik: "#C0392B",
  Yüksek: "#D4A017",
  Orta: "#1B4332",
  Düşük: "#2D6A4F",
};

const ESCALATION_COLORS: Record<TaskEscalation, string> = {
  Gecikti: "#C0392B",
  Acil: "#C0392B",
  Yakında: "#D4A017",
  İzlemede: "#1B4332",
  Planlı: "#2D6A4F",
  Tarihsiz: "#6B7280",
};

export function GorevlerTab({
  styles,
  taskItems,
  filteredTaskItems,
  companies,
  search,
  setSearch,
  selectedCompanyId,
  setSelectedCompanyId,
  setActiveTab,
}: GorevlerTabProps) {
  const [categoryFilter, setCategoryFilter] = React.useState("all");
  const [escalationFilter, setEscalationFilter] = React.useState("all");
  const categoryOptions = React.useMemo(
    () => Array.from(new Set(taskItems.map(task => task.category))).sort((a, b) => a.localeCompare(b, "tr")),
    [taskItems]
  );
  const escalationOptions = React.useMemo(
    () => Array.from(new Set(taskItems.map(task => task.escalationLevel || "Tarihsiz"))),
    [taskItems]
  );
  const visibleTaskItems = React.useMemo(
    () => filteredTaskItems.filter(task => {
      const matchesCategory = categoryFilter === "all" || task.category === categoryFilter;
      const matchesEscalation = escalationFilter === "all" || (task.escalationLevel || "Tarihsiz") === escalationFilter;
      return matchesCategory && matchesEscalation;
    }),
    [categoryFilter, escalationFilter, filteredTaskItems]
  );

  return (
    <div>
      <div style={styles.statGrid}>
        {[
          { value: taskItems.length, label: "Toplam Görev", color: "#1B4332" },
          { value: taskItems.filter(t => t.escalationLevel === "Gecikti").length, label: "Geciken", color: "#C0392B" },
          { value: taskItems.filter(t => t.escalationLevel === "Acil").length, label: "Acil Termin", color: "#C0392B" },
          { value: taskItems.filter(t => t.category === "Personel").length, label: "Personel Görevi", color: "#a78bfa" },
        ].map(({ value, label, color }) => (
          <div key={label} style={styles.statCard} className="isg-stat-card">
            <div style={{ ...styles.statValue, color }}>{value}</div>
            <div style={styles.statLabel}>{label}</div>
          </div>
        ))}
      </div>

      <div style={styles.card} className="isg-card">
        <p style={styles.sectionTitle} className="isg-text-muted">Görev / Takip Paneli</p>
        <div style={{ color: "var(--isg-text-muted)", fontSize: 13, lineHeight: 1.55 }}>
          Bu panel, mevcut kayıtlardan otomatik görev çıkarır: süresi yaklaşan belgeler, açık DÖF'ler,
          yüksek riskler, eksik onboarding adımları, yaklaşan eğitimler, açık iş kazası raporları ve
          firma ziyaret takipleri.
        </div>
      </div>

      <div style={styles.searchBar}>
        <input
          style={{ ...styles.input, maxWidth: 300 }}
          placeholder="Görevlerde ara..."
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
        <select
          style={{ ...styles.select, maxWidth: 180 }}
          value={selectedCompanyId}
          onChange={e => setSelectedCompanyId(e.target.value)}
        >
          <option value="all">Tüm Firmalar</option>
          {companies.map(c => <option key={c.id} value={c.id}>{c.nickName}</option>)}
        </select>
        <span style={{ color: "var(--isg-text-muted)", fontSize: 13 }}>
          {visibleTaskItems.length} görev
        </span>
      </div>

      <div style={{ ...styles.card, display: "grid", gap: 12, marginBottom: 16 }} className="isg-card">
        <div>
          <p style={{ ...styles.sectionTitle, marginBottom: 8 }} className="isg-text-muted">Kategori Filtresi</p>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            {["all", ...categoryOptions].map(category => {
              const active = categoryFilter === category;
              return (
                <button
                  key={category}
                  type="button"
                  onClick={() => setCategoryFilter(category)}
                  style={{
                    ...styles.btnSecondary,
                    minHeight: 38,
                    backgroundColor: active ? "rgba(82, 211, 181, 0.16)" : "var(--isg-btn-secondary)",
                    borderColor: active ? "rgba(82, 211, 181, 0.45)" : "var(--isg-border)",
                    color: active ? "var(--isg-primary)" : "var(--isg-text)",
                  }}
                >
                  {category === "all" ? "Tüm Kategoriler" : category}
                </button>
              );
            })}
          </div>
        </div>
        <div>
          <p style={{ ...styles.sectionTitle, marginBottom: 8 }} className="isg-text-muted">Termin Filtresi</p>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            {["all", ...escalationOptions].map(escalation => {
              const active = escalationFilter === escalation;
              const color = escalation === "all" ? "var(--isg-primary)" : ESCALATION_COLORS[escalation as TaskEscalation] || "#6B7280";
              const activeBackground = escalation === "all" ? "rgba(82, 211, 181, 0.16)" : `${color}18`;
              const activeBorder = escalation === "all" ? "rgba(82, 211, 181, 0.45)" : `${color}55`;
              return (
                <button
                  key={escalation}
                  type="button"
                  onClick={() => setEscalationFilter(escalation)}
                  style={{
                    ...styles.btnSecondary,
                    minHeight: 38,
                    backgroundColor: active ? activeBackground : "var(--isg-btn-secondary)",
                    borderColor: active ? activeBorder : "var(--isg-border)",
                    color: active ? color : "var(--isg-text)",
                  }}
                >
                  {escalation === "all" ? "Tüm Terminler" : escalation}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      <div style={{ ...styles.card, padding: 0, overflow: "auto", WebkitOverflowScrolling: "touch" as any }}>
        <table style={styles.table}>
          <thead>
            <tr>
              {["Eskalasyon", "Öncelik", "Kategori", "Görev", "Firma", "Sorumlu", "Termin", "İşlem"].map(h => (
                <th key={h} style={styles.th} className="isg-th">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {visibleTaskItems.map(task => {
              const company = companies.find(c => c.id === task.companyId);
              return (
                <tr key={task.id}>
                  <td style={styles.td} className="isg-td">
                    <Badge text={task.escalationLevel || "Tarihsiz"} color={ESCALATION_COLORS[task.escalationLevel || "Tarihsiz"]} />
                  </td>
                  <td style={styles.td} className="isg-td">
                    <Badge text={task.priority} color={PRIORITY_COLORS[task.priority]} />
                  </td>
                  <td style={styles.td} className="isg-td">
                    <Badge text={task.category} color="#6B7280" />
                  </td>
                  <td style={{ ...styles.td, minWidth: 280 }} className="isg-td">
                    <div style={{ fontWeight: 800, marginBottom: 4 }}>{task.title}</div>
                    <div style={{ color: "var(--isg-text-muted)", fontSize: 12 }}>{task.detail}</div>
                  </td>
                  <td style={styles.td} className="isg-td">{company?.nickName || "—"}</td>
                  <td style={{ ...styles.td, color: "var(--isg-text-muted)" }} className="isg-td">
                    {task.owner}
                  </td>
                  <td style={styles.td} className="isg-td">
                    <div>{formatDate(task.dueDate)}</div>
                    <div style={{ color: "var(--isg-text-muted)", fontSize: 11, marginTop: 2 }}>{task.escalationLabel || "Termin yok"}</div>
                  </td>
                  <td style={styles.td} className="isg-td">
                    <button style={styles.btnSecondary} onClick={() => setActiveTab(task.sourceTab)}>
                      Modüle Git
                    </button>
                  </td>
                </tr>
              );
            })}
            {visibleTaskItems.length === 0 && (
              <EmptyTableRow colSpan={8} message="Şu an takip gerektiren görev yok. Yeni görevler oluştuğunda burada görünecek." />
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
