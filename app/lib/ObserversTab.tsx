import React from "react";
import type { Observer } from "./types";

type NewObserverForm = {
  fullName: string;
  title: string;
  certificateNo: string;
  phone: string;
};

type ObserversTabProps = {
  styles: Record<string, React.CSSProperties>;
  observers: Observer[];
  newObserver: NewObserverForm;
  setNewObserver: React.Dispatch<React.SetStateAction<NewObserverForm>>;
  addObserver: () => void;
  deleteObserver: (id: string) => void;
};

function FormField({ styles, label, children }: { styles: Record<string, React.CSSProperties>; label: string; children: React.ReactNode }) {
  return <div><label style={styles.label} className="isg-label">{label}</label>{children}</div>;
}

export function ObserversTab({ styles, observers, newObserver, setNewObserver, addObserver, deleteObserver }: ObserversTabProps) {
  const [search, setSearch] = React.useState("");
  const [titleFilter, setTitleFilter] = React.useState("all");
  const [infoFilter, setInfoFilter] = React.useState<"all" | "complete" | "missing">("all");

  const setField = (field: keyof NewObserverForm, value: string) => {
    setNewObserver(current => ({ ...current, [field]: value }));
  };

  const normalizedSearch = search.trim().toLocaleLowerCase("tr-TR");
  const visibleObservers = React.useMemo(() => observers.filter(observer => {
    const haystack = [
      observer.fullName,
      observer.title,
      observer.certificateNo,
      observer.phone,
    ].join(" ").toLocaleLowerCase("tr-TR");
    const hasRequiredInfo = Boolean(observer.title?.trim() && observer.certificateNo?.trim() && observer.phone?.trim());
    const matchesSearch = !normalizedSearch || haystack.includes(normalizedSearch);
    const matchesTitle = titleFilter === "all" || observer.title === titleFilter;
    const matchesInfo =
      infoFilter === "all" ||
      (infoFilter === "complete" && hasRequiredInfo) ||
      (infoFilter === "missing" && !hasRequiredInfo);

    return matchesSearch && matchesTitle && matchesInfo;
  }), [observers, normalizedSearch, titleFilter, infoFilter]);

  const titleFilters = [
    { value: "all", label: "Tüm Unvanlar", count: observers.length, color: "#52d3b5" },
    ...Array.from(new Set(observers.map(observer => observer.title).filter(Boolean))).map(title => ({
      value: title,
      label: title,
      count: observers.filter(observer => observer.title === title).length,
      color: "#0ea5e9",
    })),
  ];

  const infoFilters = [
    { value: "all" as const, label: "Tüm Kayıtlar", count: observers.length, color: "#52d3b5" },
    {
      value: "complete" as const,
      label: "Bilgisi Tam",
      count: observers.filter(observer => observer.title?.trim() && observer.certificateNo?.trim() && observer.phone?.trim()).length,
      color: "#2D6A4F",
    },
    {
      value: "missing" as const,
      label: "Eksik Bilgi",
      count: observers.filter(observer => !(observer.title?.trim() && observer.certificateNo?.trim() && observer.phone?.trim())).length,
      color: "#C0392B",
    },
  ];

  return (
    <div>
      <div style={styles.card} className="isg-card">
        <p style={styles.sectionTitle} className="isg-text-muted">Yeni Gözlemci Ekle</p>
        <div style={styles.formGrid}>
          <FormField styles={styles} label="Ad Soyad *"><input style={styles.input} className="isg-input" value={newObserver.fullName} onChange={e => setField("fullName", e.target.value)} /></FormField>
          <FormField styles={styles} label="Unvan"><input style={styles.input} className="isg-input" value={newObserver.title} onChange={e => setField("title", e.target.value)} /></FormField>
          <FormField styles={styles} label="Sertifika No"><input style={styles.input} className="isg-input" value={newObserver.certificateNo} onChange={e => setField("certificateNo", e.target.value)} /></FormField>
          <FormField styles={styles} label="Telefon"><input style={styles.input} className="isg-input" value={newObserver.phone} onChange={e => setField("phone", e.target.value)} /></FormField>
        </div>
        <div style={{ marginTop: 12 }}><button style={styles.btnPrimary} onClick={addObserver}>Gözlemci Ekle</button></div>
      </div>

      <div style={styles.searchBar}>
        <input
          style={{ ...styles.input, maxWidth: 320 }}
          className="isg-input"
          placeholder="Gözlemci ara..."
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
        <span style={{ color: "var(--isg-text-muted)", fontSize: 13 }}>{visibleObservers.length} gözlemci</span>
      </div>

      <div style={{ ...styles.card, padding: 14, marginBottom: 16 }} className="isg-card">
        <div style={{ display: "grid", gap: 14 }}>
          <div>
            <div style={{ ...styles.label, marginBottom: 8 }} className="isg-label">Unvan Filtresi</div>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              {titleFilters.map(filter => {
                const active = titleFilter === filter.value;
                return (
                  <button
                    key={filter.value}
                    type="button"
                    onClick={() => setTitleFilter(filter.value)}
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
            <div style={{ ...styles.label, marginBottom: 8 }} className="isg-label">Bilgi Durumu</div>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              {infoFilters.map(filter => {
                const active = infoFilter === filter.value;
                return (
                  <button
                    key={filter.value}
                    type="button"
                    onClick={() => setInfoFilter(filter.value)}
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

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 12 }}>
        {visibleObservers.map(obs => (
          <div key={obs.id} style={styles.card} className="isg-card">
            <div style={{ fontWeight: 700, marginBottom: 4 }}>{obs.fullName}</div>
            <div style={{ fontSize: 12, color: "var(--isg-text-muted)", marginBottom: 2 }}>{obs.title || "Unvan girilmemiş"}</div>
            <div style={{ fontSize: 12, color: "var(--isg-text-muted)" }}>Sertifika: {obs.certificateNo || "—"}</div>
            <div style={{ fontSize: 12, color: "var(--isg-text-muted)" }}>Tel: {obs.phone || "—"}</div>
            <div style={{ marginTop: 12 }}><button style={styles.btnDanger} onClick={() => deleteObserver(obs.id)}>Sil</button></div>
          </div>
        ))}
        {visibleObservers.length === 0 && (
          <div style={{ ...styles.card, color: "var(--isg-text-muted)", gridColumn: "1 / -1" }} className="isg-card">
            Filtreleri temizleyin veya yeni gözlemci ekleyin.
          </div>
        )}
      </div>
    </div>
  );
}
