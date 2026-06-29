import React from "react";
import { formatDate } from "./dateUtils";
import { EmptyState } from "./EmptyState";
import type { Company, Employee, ArchiveItem, TaskItem, TaskPriority } from "./types";
import type { DashboardCard, QuickAction } from "./dashboardOverview";

type CompanyIndicator = { text: string; color: string };
type DocSummary = { missingCount: number; expiredCount: number; soonCount: number };

type OzetTabProps = {
  styles: Record<string, React.CSSProperties>;
  roleDashboardTitle: string;
  roleDashboardSubtitle: string;
  roleDashboardCards: DashboardCard[];
  roleQuickActions: QuickAction[];
  topDashboardTasks: TaskItem[];
  upcomingTrainings: number;
  openAccidentReports: number;
  followUpVisits: number;
  archiveItems: ArchiveItem[];
  companies: Company[];
  employees: Employee[];
  getCompanyIndicator: (id: string) => CompanyIndicator;
  getCompanyDocSummary: (id: string) => DocSummary;
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

const FIELD_ACTIONS = [
  { label: "DÖF Aç", detail: "Fotoğraflı uygunsuzluk kaydı", tab: "dof", color: "#C0392B" },
  { label: "Risk Ekle", detail: "Tehlike ve aksiyon planı", tab: "risk", color: "#D4A017" },
  { label: "Ziyaret Kaydı", detail: "Saha ziyareti ve takip", tab: "firma-ziyaretleri", color: "#0ea5e9" },
  { label: "Olay Raporu", detail: "İş kazası / ramak kala", tab: "is-kazasi-raporu", color: "#7c3aed" },
];

export function OzetTab({
  styles,
  roleDashboardTitle,
  roleDashboardSubtitle,
  roleDashboardCards,
  roleQuickActions,
  topDashboardTasks,
  upcomingTrainings,
  openAccidentReports,
  followUpVisits,
  archiveItems,
  companies,
  employees,
  getCompanyIndicator,
  getCompanyDocSummary,
  setActiveTab,
}: OzetTabProps) {
  return (
    <div>
      <div style={styles.card} className="isg-card">
        <p style={{ ...styles.sectionTitle, marginBottom: 10 }} className="isg-text-muted">
          {roleDashboardTitle}
        </p>
        <div style={{ color: "var(--isg-text-muted)", fontSize: 13, lineHeight: 1.55 }}>
          {roleDashboardSubtitle}
        </div>
      </div>

      <div style={styles.statGrid}>
        {roleDashboardCards.map(({ value, label, color }) => (
          <div
            key={label}
            style={styles.statCard}
            className="isg-stat-card"
            onMouseEnter={e => {
              (e.currentTarget as HTMLElement).style.borderColor = "rgba(255,255,255,0.15)";
              (e.currentTarget as HTMLElement).style.transform = "translateY(-2px)";
            }}
            onMouseLeave={e => {
              (e.currentTarget as HTMLElement).style.borderColor = "rgba(255,255,255,0.07)";
              (e.currentTarget as HTMLElement).style.transform = "";
            }}
          >
            <div style={{ ...styles.statValue, color }}>{value}</div>
            <div style={styles.statLabel}>{label}</div>
          </div>
        ))}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(min(360px, 100%), 1fr))", gap: 16, marginBottom: 24 }}>
        {/* Bugünün Öncelikleri */}
        <div style={styles.card} className="isg-card">
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12, marginBottom: 14 }}>
            <p style={{ ...styles.sectionTitle, marginBottom: 0 }} className="isg-text-muted">
              Bugünün Öncelikleri
            </p>
            <button style={styles.btnSecondary} onClick={() => setActiveTab("gorevler")}>
              Tüm Görevler
            </button>
          </div>
          <div style={{ display: "grid", gap: 10 }}>
            {topDashboardTasks.map(task => {
              const company = companies.find(c => c.id === task.companyId);
              const color: Record<TaskPriority, string> = {
                Kritik: "#C0392B", Yüksek: "#D4A017", Orta: "#1B4332", Düşük: "#2D6A4F",
              };
              const escalationColor = task.escalationLevel === "Gecikti" || task.escalationLevel === "Acil" ? "#C0392B" : task.escalationLevel === "Yakında" ? "#D4A017" : "#2D6A4F";
              return (
                <div
                  key={task.id}
                  style={{ border: "1px solid var(--isg-border)", borderRadius: 8, padding: 12, backgroundColor: "var(--isg-input-bg)" }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", gap: 10, alignItems: "flex-start" }}>
                    <div>
                      <div style={{ fontWeight: 800, marginBottom: 4 }}>{task.title}</div>
                      <div style={{ color: "var(--isg-text-muted)", fontSize: 12, lineHeight: 1.45 }}>{task.detail}</div>
                      <div style={{ color: "var(--isg-text-subtle)", fontSize: 11, marginTop: 6 }}>
                        {company?.nickName || "Firma"} · {task.dueDate ? formatDate(task.dueDate) : "Termin yok"} · {task.escalationLabel || "Termin yok"}
                      </div>
                    </div>
                    <div style={{ display: "flex", gap: 6, flexWrap: "wrap", justifyContent: "flex-end" }}>
                      <Badge text={task.escalationLevel || "Tarihsiz"} color={escalationColor} />
                      <Badge text={task.priority} color={color[task.priority]} />
                    </div>
                  </div>
                </div>
              );
            })}
            {topDashboardTasks.length === 0 && (
              <EmptyState title="Kritik takip görünmüyor." message="Acil görev oluştuğunda bu alanda öne çıkarılacak." />
            )}
          </div>
        </div>

        {/* Hızlı Aksiyonlar */}
        <div style={styles.card} className="isg-card">
          <div style={{ marginBottom: 18 }}>
            <p style={styles.sectionTitle} className="isg-text-muted">Mobil Saha Kaydı</p>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(min(160px, 100%), 1fr))", gap: 10 }}>
              {FIELD_ACTIONS.map(action => (
                <button
                  key={action.tab}
                  type="button"
                  onClick={() => setActiveTab(action.tab)}
                  style={{
                    minHeight: 74,
                    border: `1px solid ${action.color}55`,
                    borderRadius: 12,
                    background: `${action.color}16`,
                    color: "var(--isg-text)",
                    padding: "12px 14px",
                    textAlign: "left",
                    cursor: "pointer",
                    display: "flex",
                    flexDirection: "column",
                    justifyContent: "center",
                    gap: 4,
                  }}
                >
                  <span style={{ fontSize: 15, fontWeight: 900, color: action.color }}>{action.label}</span>
                  <span style={{ fontSize: 12, color: "var(--isg-text-muted)", lineHeight: 1.35 }}>{action.detail}</span>
                </button>
              ))}
            </div>
          </div>
          <p style={styles.sectionTitle} className="isg-text-muted">Hızlı Aksiyonlar</p>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))", gap: 10 }}>
            {roleQuickActions.map(action => (
              <button
                key={action.tab}
                style={{ ...styles.btnSecondary, width: "100%", justifyContent: "center" as any }}
                onClick={() => setActiveTab(action.tab)}
              >
                {action.label}
              </button>
            ))}
          </div>
          <div style={{ marginTop: 18, borderTop: "1px solid var(--isg-border)", paddingTop: 14 }}>
            <p style={{ ...styles.sectionTitle, marginBottom: 10 }} className="isg-text-muted">
              Operasyon Özeti
            </p>
            <div style={{ display: "grid", gap: 8, fontSize: 13, color: "var(--isg-text-muted)" }}>
              <div>Planlı eğitim: <strong style={{ color: "var(--isg-text)" }}>{upcomingTrainings}</strong></div>
              <div>Açık olay/ramak kala: <strong style={{ color: "var(--isg-text)" }}>{openAccidentReports}</strong></div>
              <div>Ziyaret takibi: <strong style={{ color: "var(--isg-text)" }}>{followUpVisits}</strong></div>
              <div>Arşiv kaydı: <strong style={{ color: "var(--isg-text)" }}>{archiveItems.length}</strong></div>
            </div>
          </div>
        </div>
      </div>

      {/* Firma Durumları */}
      <p style={styles.sectionTitle} className="isg-text-muted">Firma Durumları</p>
      {companies.map(c => {
        const ind = getCompanyIndicator(c.id);
        const summary = getCompanyDocSummary(c.id);
        const empCount = employees.filter(e => e.companyId === c.id).length;
        return (
          <div
            key={c.id}
            style={{ ...styles.card, display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 8 }}
          >
            <div>
              <div style={{ fontWeight: 600, marginBottom: 4 }}>{c.nickName}</div>
              <div style={{ fontSize: 12, color: "var(--isg-text-muted)" }}>
                {empCount} personel · Sözleşme: {formatDate(c.contractEnd)} ·{" "}
                <Badge
                  text={c.dangerClass}
                  color={c.dangerClass === "Çok Tehlikeli" ? "#C0392B" : c.dangerClass === "Tehlikeli" ? "#D4A017" : "#2D6A4F"}
                />
              </div>
            </div>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              {summary.missingCount > 0 && <Badge text={`${summary.missingCount} Eksik`} color="#C0392B" />}
              {summary.expiredCount > 0 && <Badge text={`${summary.expiredCount} Süresi Dolmuş`} color="#C0392B" />}
              {summary.soonCount > 0 && <Badge text={`${summary.soonCount} Yaklaşıyor`} color="#D4A017" />}
              <Badge text={ind.text} color={ind.color} />
            </div>
          </div>
        );
      })}
    </div>
  );
}
