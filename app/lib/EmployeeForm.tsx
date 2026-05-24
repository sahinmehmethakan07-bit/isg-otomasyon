import React, { ChangeEvent, useEffect, useState } from "react";
import type { Company, NewEmployeeForm } from "./types";

type EmployeeFormProps = {
  styles: Record<string, React.CSSProperties>;
  companies: Company[];
  newEmployee: NewEmployeeForm;
  setNewEmployee: React.Dispatch<React.SetStateAction<NewEmployeeForm>>;
  compactLayout: boolean;
  employeeAddStatus: string | null;
  addEmployee: () => void;
  handleImageToBase64: (event: ChangeEvent<HTMLInputElement>, callback: (base64: string) => void) => void;
};

function FormField({ styles, label, children }: { styles: Record<string, React.CSSProperties>; label: string; children: React.ReactNode }) {
  return <div><label style={styles.label} className="isg-label">{label}</label>{children}</div>;
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
      <div
        onClick={() => setOpen(!open)}
        style={{ ...styles.input, cursor: "pointer", display: "flex", justifyContent: "space-between", alignItems: "center" }}
      >
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
            {["Pt", "Sa", "Ça", "Pe", "Cu", "Ct", "Pz"].map(d => (
              <div key={d} style={{ textAlign: "center", fontSize: 10, color: "var(--isg-text-muted)", padding: "2px 0" }}>{d}</div>
            ))}
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 2 }}>
            {Array.from({ length: firstDay }).map((_, i) => <div key={"empty-" + i} />)}
            {Array.from({ length: daysInMonth }, (_, i) => i + 1).map(day => {
              const isSelected = selectedDate &&
                selectedDate.getFullYear() === viewYear &&
                selectedDate.getMonth() === viewMonth &&
                selectedDate.getDate() === day;
              return (
                <button
                  key={day}
                  type="button"
                  onClick={() => select(day)}
                  style={{
                    backgroundColor: isSelected ? "#0ea5e9" : "transparent",
                    color: isSelected ? "#fff" : "var(--isg-text)",
                    border: "none",
                    borderRadius: 4,
                    padding: "4px 0",
                    fontSize: 12,
                    cursor: "pointer",
                    textAlign: "center",
                  }}
                >
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

function statusStyle(status: string): React.CSSProperties {
  const success = status.startsWith("✅");
  const warning = status.startsWith("⚠️");
  const color = success ? "#86efac" : warning ? "#fbbf24" : "#fca5a5";
  const base = success ? "#16a34a" : warning ? "#d97706" : "#dc2626";

  return {
    marginTop: 12,
    padding: "10px 12px",
    borderRadius: 8,
    fontSize: 13,
    color,
    backgroundColor: base + "15",
    border: "1px solid " + base + "33",
  };
}

export function EmployeeForm({
  styles,
  companies,
  newEmployee,
  setNewEmployee,
  compactLayout,
  employeeAddStatus,
  addEmployee,
  handleImageToBase64,
}: EmployeeFormProps) {
  const setField = (field: keyof NewEmployeeForm, value: string) => {
    setNewEmployee(current => ({ ...current, [field]: value }));
  };

  return (
    <div style={{ minWidth: 0 }}>
      <div style={styles.card} className="isg-card">
        <p style={styles.sectionTitle} className="isg-text-muted">Yeni Personel Ekle</p>
        <div style={{ display: "grid", gridTemplateColumns: compactLayout ? "minmax(0, 1fr)" : "minmax(160px, 190px) minmax(0, 1fr)", gap: 18, alignItems: "start", minWidth: 0 }}>
          <div style={{ border: "1px solid var(--isg-border)", borderRadius: 8, padding: 14, backgroundColor: "var(--isg-input-bg)" }}>
            <label style={styles.label} className="isg-label">Personel Fotoğrafı</label>
            {newEmployee.photo ? (
              <div style={{ position: "relative", width: 132 }}>
                <img src={newEmployee.photo} alt="personel fotoğrafı" style={{ width: 132, height: 160, objectFit: "cover", borderRadius: 8, border: "1px solid var(--isg-border)" }} />
                <button type="button" onClick={() => setField("photo", "")} style={{ position: "absolute", top: -7, right: -7, width: 24, height: 24, borderRadius: "50%", border: "none", backgroundColor: "#dc2626", color: "white", fontSize: 12, cursor: "pointer" }}>✕</button>
              </div>
            ) : (
              <div>
                <div style={{ width: 132, height: 160, borderRadius: 8, border: "1px dashed var(--isg-border-strong)", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--isg-text-muted)", fontSize: 12, marginBottom: 10, textAlign: "center", padding: 10 }}>
                  Fotoğraf seçin
                </div>
                <label style={{ ...styles.btnSecondary, display: "inline-flex", alignItems: "center", justifyContent: "center", width: "100%", cursor: "pointer", boxSizing: "border-box" as const }}>
                  Fotoğraf Seç
                  <input type="file" accept="image/*" style={{ display: "none" }} onChange={e => handleImageToBase64(e, b64 => setField("photo", b64))} />
                </label>
              </div>
            )}
          </div>
          <div style={{ display: "grid", gap: 18, minWidth: 0 }}>
            <div>
              <p style={{ ...styles.sectionTitle, marginBottom: 10 }}>Kimlik Bilgileri</p>
              <div style={styles.formGrid}>
                <FormField styles={styles} label="Firma *"><select style={styles.select} className="isg-input" value={newEmployee.companyId} onChange={e => setField("companyId", e.target.value)}><option value="">{companies.length === 0 ? "Firma bulunamadı" : "Seçin..."}</option>{companies.map(c => <option key={c.id} value={c.id}>{c.nickName}</option>)}</select></FormField>
                <FormField styles={styles} label="Ad *"><input style={styles.input} className="isg-input" value={newEmployee.firstName} onChange={e => setField("firstName", e.target.value)} /></FormField>
                <FormField styles={styles} label="Soyad"><input style={styles.input} className="isg-input" value={newEmployee.lastName} onChange={e => setField("lastName", e.target.value)} /></FormField>
                <FormField styles={styles} label="TC No"><input style={styles.input} className="isg-input" value={newEmployee.tcNo} onChange={e => setField("tcNo", e.target.value)} /></FormField>
                <FormField styles={styles} label="Doğum Yeri"><input style={styles.input} className="isg-input" value={newEmployee.birthPlace} onChange={e => setField("birthPlace", e.target.value)} /></FormField>
                <FormField styles={styles} label="Doğum Tarihi"><DatePicker styles={styles} value={newEmployee.birthDate} onChange={v => setField("birthDate", v)} /></FormField>
                <FormField styles={styles} label="Cinsiyet"><select style={styles.select} className="isg-input" value={newEmployee.gender} onChange={e => setField("gender", e.target.value)}><option value="">Seçin...</option><option>Erkek</option><option>Kadın</option><option>Diğer</option></select></FormField>
                <FormField styles={styles} label="Uyruk"><select style={styles.select} className="isg-input" value={newEmployee.nationality} onChange={e => setNewEmployee(current => ({ ...current, nationality: e.target.value, nationalityOther: e.target.value === "Diğer" ? current.nationalityOther : "" }))}><option value="T.C.">T.C.</option><option value="Diğer">Diğer</option></select></FormField>
                {newEmployee.nationality === "Diğer" && (
                  <FormField styles={styles} label="Uyruk Açıklaması"><input style={styles.input} className="isg-input" value={newEmployee.nationalityOther} onChange={e => setField("nationalityOther", e.target.value)} placeholder="Örn. Bulgaristan, Suriye..." /></FormField>
                )}
                <FormField styles={styles} label="Seri / Belge No"><input style={styles.input} className="isg-input" value={newEmployee.serialNo} onChange={e => setField("serialNo", e.target.value)} /></FormField>
                <FormField styles={styles} label="Baba Adı"><input style={styles.input} className="isg-input" value={newEmployee.fatherName} onChange={e => setField("fatherName", e.target.value)} /></FormField>
                <FormField styles={styles} label="Anne Adı"><input style={styles.input} className="isg-input" value={newEmployee.motherName} onChange={e => setField("motherName", e.target.value)} /></FormField>
              </div>
            </div>
            <div>
              <p style={{ ...styles.sectionTitle, marginBottom: 10 }}>İletişim ve Aile</p>
              <div style={styles.formGrid}>
                <FormField styles={styles} label="Telefon"><input style={styles.input} className="isg-input" value={newEmployee.phone} onChange={e => setField("phone", e.target.value)} /></FormField>
                <FormField styles={styles} label="E-posta"><input style={styles.input} className="isg-input" type="email" value={newEmployee.email} onChange={e => setField("email", e.target.value)} /></FormField>
                <FormField styles={styles} label="Adres"><input style={styles.input} className="isg-input" value={newEmployee.address} onChange={e => setField("address", e.target.value)} /></FormField>
                <FormField styles={styles} label="Medeni Durum"><select style={styles.select} className="isg-input" value={newEmployee.maritalStatus} onChange={e => setField("maritalStatus", e.target.value)}><option value="">Seçin...</option><option>Bekar</option><option>Evli</option><option>Boşanmış</option><option>Dul</option></select></FormField>
                <FormField styles={styles} label="Çocuk Sayısı"><input style={styles.input} className="isg-input" value={newEmployee.childrenCount} onChange={e => setField("childrenCount", e.target.value)} /></FormField>
                <FormField styles={styles} label="Acil Durum Kişisi"><input style={styles.input} className="isg-input" value={newEmployee.emergencyContactName} onChange={e => setField("emergencyContactName", e.target.value)} /></FormField>
                <FormField styles={styles} label="Acil Durum Telefonu"><input style={styles.input} className="isg-input" value={newEmployee.emergencyContactPhone} onChange={e => setField("emergencyContactPhone", e.target.value)} /></FormField>
              </div>
            </div>
            <div>
              <p style={{ ...styles.sectionTitle, marginBottom: 10 }}>İş ve Eğitim Bilgileri</p>
              <div style={styles.formGrid}>
                <FormField styles={styles} label="Birim"><input style={styles.input} className="isg-input" value={newEmployee.department} onChange={e => setField("department", e.target.value)} placeholder="Üretim, muhasebe..." /></FormField>
                <FormField styles={styles} label="Unvan"><input style={styles.input} className="isg-input" value={newEmployee.title} onChange={e => setField("title", e.target.value)} /></FormField>
                <FormField styles={styles} label="Meslek / Meslek Dalı"><input style={styles.input} className="isg-input" value={newEmployee.profession} onChange={e => setField("profession", e.target.value)} /></FormField>
                <FormField styles={styles} label="Yapacağı İş"><input style={styles.input} className="isg-input" value={newEmployee.jobDescription} onChange={e => setField("jobDescription", e.target.value)} /></FormField>
                <FormField styles={styles} label="İşe Giriş"><DatePicker styles={styles} value={newEmployee.hireDate} onChange={v => setField("hireDate", v)} /></FormField>
                <FormField styles={styles} label="Eğitim Durumu"><input style={styles.input} className="isg-input" value={newEmployee.educationLevel} onChange={e => setField("educationLevel", e.target.value)} /></FormField>
                <FormField styles={styles} label="Diploma Bilgileri"><input style={styles.input} className="isg-input" value={newEmployee.diplomaInfo} onChange={e => setField("diplomaInfo", e.target.value)} placeholder="Okul / bölüm / yıl" /></FormField>
                <FormField styles={styles} label="SGK No"><input style={styles.input} className="isg-input" value={newEmployee.sgkNo} onChange={e => setField("sgkNo", e.target.value)} /></FormField>
                <FormField styles={styles} label="IBAN"><input style={styles.input} className="isg-input" value={newEmployee.iban} onChange={e => setField("iban", e.target.value)} /></FormField>
              </div>
            </div>
            <div>
              <p style={{ ...styles.sectionTitle, marginBottom: 10 }}>Sağlık Ön Bilgileri</p>
              <div style={styles.formGrid}>
                <FormField styles={styles} label="Kan Grubu"><select style={styles.select} className="isg-input" value={newEmployee.bloodType} onChange={e => setField("bloodType", e.target.value)}><option value="">Seçin...</option><option>A Rh+</option><option>A Rh-</option><option>B Rh+</option><option>B Rh-</option><option>AB Rh+</option><option>AB Rh-</option><option>0 Rh+</option><option>0 Rh-</option><option>Bilinmiyor</option></select></FormField>
                <FormField styles={styles} label="Kronik Hastalık"><input style={styles.input} className="isg-input" value={newEmployee.chronicDisease} onChange={e => setField("chronicDisease", e.target.value)} /></FormField>
                <FormField styles={styles} label="Alerji"><input style={styles.input} className="isg-input" value={newEmployee.allergies} onChange={e => setField("allergies", e.target.value)} /></FormField>
                <FormField styles={styles} label="Tetanoz Aşı Bilgisi"><input style={styles.input} className="isg-input" value={newEmployee.tetanusVaccine} onChange={e => setField("tetanusVaccine", e.target.value)} /></FormField>
                <FormField styles={styles} label="Hepatit Aşı Bilgisi"><input style={styles.input} className="isg-input" value={newEmployee.hepatitisVaccine} onChange={e => setField("hepatitisVaccine", e.target.value)} /></FormField>
              </div>
              <div style={{ marginTop: 12 }}>
                <FormField styles={styles} label="Notlar"><textarea style={{ ...styles.input, minHeight: 76, resize: "vertical" as const }} className="isg-input" value={newEmployee.notes} onChange={e => setField("notes", e.target.value)} /></FormField>
              </div>
            </div>
          </div>
        </div>
        <div style={{ marginTop: 12 }}><button style={styles.btnPrimary} onClick={addEmployee}>Personel Ekle</button></div>
        {employeeAddStatus && (
          <div style={statusStyle(employeeAddStatus)}>
            {employeeAddStatus}
          </div>
        )}
      </div>
    </div>
  );
}
