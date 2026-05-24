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
  const setField = (field: keyof NewObserverForm, value: string) => {
    setNewObserver(current => ({ ...current, [field]: value }));
  };

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
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 12 }}>
        {observers.map(obs => (
          <div key={obs.id} style={styles.card} className="isg-card">
            <div style={{ fontWeight: 700, marginBottom: 4 }}>{obs.fullName}</div>
            <div style={{ fontSize: 12, color: "#94a3b8", marginBottom: 2 }}>{obs.title}</div>
            <div style={{ fontSize: 12, color: "var(--isg-text-muted)" }}>Sertifika: {obs.certificateNo}</div>
            <div style={{ fontSize: 12, color: "var(--isg-text-muted)" }}>Tel: {obs.phone}</div>
            <div style={{ marginTop: 12 }}><button style={styles.btnDanger} onClick={() => deleteObserver(obs.id)}>Sil</button></div>
          </div>
        ))}
      </div>
    </div>
  );
}
