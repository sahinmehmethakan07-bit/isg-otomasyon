import React from "react";
import { formatDate } from "./dateUtils";
import { buildNotificationCenter, type NotificationSeverity } from "./notificationCenter";
import type { Company, TaskItem } from "./types";

type NotificationCenterPanelProps = {
  styles: Record<string, React.CSSProperties>;
  taskItems: TaskItem[];
  companies: Company[];
  setActiveTab: (tab: string) => void;
  setSelectedCompanyId: (companyId: string) => void;
};

const SEVERITY_COLORS: Record<NotificationSeverity, string> = {
  Kritik: "#C0392B",
  Yüksek: "#D4A017",
  Normal: "#2D6A4F",
};

function Badge({ text, color }: { text: string; color: string }) {
  return (
    <span style={{
      alignItems: "center",
      backgroundColor: `${color}18`,
      border: `1px solid ${color}44`,
      borderRadius: 999,
      color,
      display: "inline-flex",
      fontSize: 11,
      fontWeight: 800,
      minHeight: 26,
      padding: "0 9px",
      whiteSpace: "nowrap",
    }}>
      {text}
    </span>
  );
}

export function NotificationCenterPanel({
  styles,
  taskItems,
  companies,
  setActiveTab,
  setSelectedCompanyId,
}: NotificationCenterPanelProps) {
  const summary = React.useMemo(() => buildNotificationCenter(taskItems, companies), [companies, taskItems]);
  const [copiedId, setCopiedId] = React.useState<string | null>(null);
  const visibleItems = summary.items.slice(0, 7);

  async function copyMessage(id: string, message: string) {
    if (typeof navigator === "undefined" || !navigator.clipboard) return;
    await navigator.clipboard.writeText(message);
    setCopiedId(id);
    window.setTimeout(() => setCopiedId(null), 1800);
  }

  function openTask(task: TaskItem) {
    setSelectedCompanyId(task.companyId);
    setActiveTab(task.sourceTab);
  }

  return (
    <div style={styles.card} className="isg-card">
      <div style={{ display: "flex", justifyContent: "space-between", gap: 12, alignItems: "flex-start", flexWrap: "wrap", marginBottom: 14 }}>
        <div>
          <p style={{ ...styles.sectionTitle, marginBottom: 6 }} className="isg-text-muted">Bildirim / Hatırlatma Merkezi</p>
          <div style={{ color: "var(--isg-text-muted)", fontSize: 13, lineHeight: 1.55 }}>
            Görevlerden otomatik hatırlatma üretir; e-posta adresi olan firmalar ayrıca işaretlenir.
          </div>
        </div>
        <Badge text={`${summary.items.length} bildirim`} color="#52d3b5" />
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(min(150px, 100%), 1fr))", gap: 10, marginBottom: 14 }}>
        {[
          { label: "Geciken", value: summary.overdue, color: "#C0392B" },
          { label: "Bugün/Yarın", value: summary.dueToday, color: "#D4A017" },
          { label: "E-posta Hazır", value: summary.emailReady, color: "#0ea5e9" },
          { label: "Kritik", value: summary.critical, color: "#7c3aed" },
        ].map(metric => (
          <div key={metric.label} style={{ border: "1px solid var(--isg-border)", borderRadius: 12, padding: "12px 14px", backgroundColor: "var(--isg-input-bg)" }}>
            <div style={{ color: metric.color, fontSize: 22, fontWeight: 900, lineHeight: 1 }}>{metric.value}</div>
            <div style={{ color: "var(--isg-text-muted)", fontSize: 12, fontWeight: 700, marginTop: 5 }}>{metric.label}</div>
          </div>
        ))}
      </div>

      {visibleItems.length > 0 ? (
        <div style={{ display: "grid", gap: 10 }}>
          {visibleItems.map(item => {
            const color = SEVERITY_COLORS[item.severity];
            return (
              <div key={item.id} style={{ border: "1px solid var(--isg-border)", borderLeft: `4px solid ${color}`, borderRadius: 12, padding: 12, backgroundColor: "var(--isg-input-bg)" }}>
                <div style={{ display: "flex", justifyContent: "space-between", gap: 10, alignItems: "flex-start", flexWrap: "wrap" }}>
                  <div style={{ minWidth: 0 }}>
                    <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center", marginBottom: 6 }}>
                      <Badge text={item.severity} color={color} />
                      <Badge text={item.channel} color={item.channel === "E-posta Hazır" ? "#0ea5e9" : "#6B7280"} />
                      <span style={{ color: "var(--isg-text-muted)", fontSize: 12, fontWeight: 700 }}>{item.companyName}</span>
                      <span style={{ color: "var(--isg-text-muted)", fontSize: 12 }}>{item.sendWindow}</span>
                    </div>
                    <div style={{ color: "var(--isg-text)", fontSize: 14, fontWeight: 850 }}>{item.title}</div>
                    <div style={{ color: "var(--isg-text-muted)", fontSize: 12, lineHeight: 1.5, marginTop: 4 }}>
                      {item.message}
                    </div>
                    <div style={{ color: "var(--isg-text-subtle)", fontSize: 11, marginTop: 5 }}>
                      Alıcı/takip: {item.recipient} · Termin: {formatDate(item.task.dueDate)}
                    </div>
                  </div>
                  <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                    <button type="button" style={styles.btnSecondary} onClick={() => copyMessage(item.id, item.message)}>
                      {copiedId === item.id ? "Kopyalandı" : "Metni Kopyala"}
                    </button>
                    <button type="button" style={styles.btnPrimary} onClick={() => openTask(item.task)}>
                      Modüle Git
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div style={{ border: "1px dashed var(--isg-border)", borderRadius: 12, color: "var(--isg-text-muted)", fontSize: 13, padding: 14 }}>
          Şu an bildirim gerektiren geciken, acil veya yüksek öncelikli görev yok.
        </div>
      )}
    </div>
  );
}
