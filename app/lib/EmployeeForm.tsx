import React, { ChangeEvent } from "react";
import { IsoTarihSecici } from "./TarihSecici";
import type { Company, EmployeeScannedDocument, NewEmployeeForm } from "./types";

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

function statusStyle(status: string): React.CSSProperties {
  const success = status.startsWith("✅");
  const warning = status.startsWith("⚠️");
  const color = success ? "#86efac" : warning ? "#fbbf24" : "#C0392B";
  const base = success ? "#2D6A4F" : warning ? "#D4A017" : "#C0392B";

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
  const addScannedDocuments = (event: ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    if (files.length === 0) return;

    files.forEach(file => {
      const reader = new FileReader();
      reader.onload = () => {
        const item: EmployeeScannedDocument = {
          id: crypto.randomUUID(),
          name: file.name,
          type: file.type || "application/octet-stream",
          data: String(reader.result || ""),
          uploadedAt: new Date().toISOString(),
        };
        setNewEmployee(current => ({
          ...current,
          scannedDocuments: [...current.scannedDocuments, item],
        }));
      };
      reader.readAsDataURL(file);
    });
    event.target.value = "";
  };

  const removeScannedDocument = (id: string) => {
    setNewEmployee(current => ({
      ...current,
      scannedDocuments: current.scannedDocuments.filter(doc => doc.id !== id),
    }));
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
                <button type="button" onClick={() => setField("photo", "")} style={{ position: "absolute", top: -7, right: -7, width: 24, height: 24, borderRadius: "50%", border: "none", backgroundColor: "#C0392B", color: "white", fontSize: 12, cursor: "pointer" }}>✕</button>
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
                <FormField styles={styles} label="Doğum Tarihi"><IsoTarihSecici styles={styles} value={newEmployee.birthDate} onChange={v => setField("birthDate", v)} /></FormField>
                <FormField styles={styles} label="Cinsiyet"><select style={styles.select} className="isg-input" value={newEmployee.gender} onChange={e => setField("gender", e.target.value)}><option value="">Seçin...</option><option>Erkek</option><option>Kadın</option><option>Diğer</option></select></FormField>
                <FormField styles={styles} label="Uyruk"><select style={styles.select} className="isg-input" value={newEmployee.nationality} onChange={e => setNewEmployee(current => ({ ...current, nationality: e.target.value, nationalityOther: e.target.value === "Diğer" ? current.nationalityOther : "" }))}><option value="T.C.">T.C.</option><option value="Diğer">Diğer</option></select></FormField>
                {newEmployee.nationality === "Diğer" && (
                  <FormField styles={styles} label="Uyruk Açıklaması"><input style={styles.input} className="isg-input" value={newEmployee.nationalityOther} onChange={e => setField("nationalityOther", e.target.value)} placeholder="Örn. Bulgaristan, Suriye..." /></FormField>
                )}
                <FormField styles={styles} label="Seri / Belge No"><input style={styles.input} className="isg-input" value={newEmployee.serialNo} onChange={e => setField("serialNo", e.target.value)} /></FormField>
              </div>
            </div>
            <div>
              <p style={{ ...styles.sectionTitle, marginBottom: 10 }}>İletişim ve Aile</p>
              <div style={styles.formGrid}>
                <FormField styles={styles} label="Telefon"><input style={styles.input} className="isg-input" value={newEmployee.phone} onChange={e => setField("phone", e.target.value)} /></FormField>
                <FormField styles={styles} label="E-posta"><input style={styles.input} className="isg-input" type="email" value={newEmployee.email} onChange={e => setField("email", e.target.value)} /></FormField>
                <FormField styles={styles} label="Adres"><input style={styles.input} className="isg-input" value={newEmployee.address} onChange={e => setField("address", e.target.value)} /></FormField>
                <FormField styles={styles} label="Medeni Durum"><select style={styles.select} className="isg-input" value={newEmployee.maritalStatus} onChange={e => setField("maritalStatus", e.target.value)}><option value="">Seçin...</option><option>Bekar</option><option>Evli</option><option>Boşanmış</option><option>Dul</option></select></FormField>
                <FormField styles={styles} label="Acil Durum Kişisi"><input style={styles.input} className="isg-input" value={newEmployee.emergencyContactName} onChange={e => setField("emergencyContactName", e.target.value)} /></FormField>
                <FormField styles={styles} label="Acil Durum Telefonu"><input style={styles.input} className="isg-input" value={newEmployee.emergencyContactPhone} onChange={e => setField("emergencyContactPhone", e.target.value)} /></FormField>
              </div>
            </div>
            <div>
              <p style={{ ...styles.sectionTitle, marginBottom: 10 }}>İş ve Eğitim Bilgileri</p>
              <div style={styles.formGrid}>
                <FormField styles={styles} label="Birim"><input style={styles.input} className="isg-input" value={newEmployee.department} onChange={e => setField("department", e.target.value)} placeholder="Üretim, muhasebe..." /></FormField>
                <FormField styles={styles} label="Unvan"><input style={styles.input} className="isg-input" value={newEmployee.title} onChange={e => setField("title", e.target.value)} /></FormField>
                <FormField styles={styles} label="İşe Giriş"><IsoTarihSecici allowFuture styles={styles} value={newEmployee.hireDate} onChange={v => setField("hireDate", v)} /></FormField>
                <FormField styles={styles} label="Eğitim Durumu"><input style={styles.input} className="isg-input" value={newEmployee.educationLevel} onChange={e => setField("educationLevel", e.target.value)} /></FormField>
                <FormField styles={styles} label="IBAN"><input style={styles.input} className="isg-input" value={newEmployee.iban} onChange={e => setField("iban", e.target.value)} /></FormField>
                <FormField styles={styles} label="Çalışma Süreleri"><input style={styles.input} className="isg-input" value={newEmployee.workingHours} onChange={e => setField("workingHours", e.target.value)} placeholder="Örn. 08:00 - 17:00" /></FormField>
                <FormField styles={styles} label="Vardiya Planlaması"><input style={styles.input} className="isg-input" value={newEmployee.shiftPlan} onChange={e => setField("shiftPlan", e.target.value)} placeholder="Gündüz, gece, 3 vardiya..." /></FormField>
                <FormField styles={styles} label="Yabancı Dil Bilgisi"><input style={styles.input} className="isg-input" value={newEmployee.foreignLanguage} onChange={e => setField("foreignLanguage", e.target.value)} /></FormField>
                <FormField styles={styles} label="Askerlik Durumu"><select style={styles.select} className="isg-input" value={newEmployee.militaryStatus} onChange={e => setField("militaryStatus", e.target.value)}><option value="">Seçin...</option><option>Yapıldı</option><option>Tecilli</option><option>Muaf</option><option>Yapılmadı</option><option>Uygun Değil</option></select></FormField>
                <FormField styles={styles} label="Ehliyet Bilgisi"><select style={styles.select} className="isg-input" value={newEmployee.driverLicense} onChange={e => setNewEmployee(current => ({ ...current, driverLicense: e.target.value, driverLicenseClass: e.target.value === "Var" ? current.driverLicenseClass : "" }))}><option value="">Seçin...</option><option>Var</option><option>Yok</option></select></FormField>
                {newEmployee.driverLicense === "Var" && (
                  <FormField styles={styles} label="Ehliyet Sınıfı"><input style={styles.input} className="isg-input" value={newEmployee.driverLicenseClass} onChange={e => setField("driverLicenseClass", e.target.value)} placeholder="B, C, D, E..." /></FormField>
                )}
                <FormField styles={styles} label="Sabıka Kaydı"><select style={styles.select} className="isg-input" value={newEmployee.criminalRecord} onChange={e => setField("criminalRecord", e.target.value)}><option value="">Seçin...</option><option>Yok</option><option>Var</option><option>Belge Bekleniyor</option></select></FormField>
                <FormField styles={styles} label="Emekli Bilgisi"><select style={styles.select} className="isg-input" value={newEmployee.retirementInfo} onChange={e => setField("retirementInfo", e.target.value)}><option value="">Seçin...</option><option>Emekli Değil</option><option>Emekli</option><option>EYT</option><option>Bilinmiyor</option></select></FormField>
              </div>
            </div>
            <div>
              <p style={{ ...styles.sectionTitle, marginBottom: 10 }}>Sağlık Ön Bilgileri</p>
              <div style={styles.formGrid}>
                <FormField styles={styles} label="Kan Grubu"><select style={styles.select} className="isg-input" value={newEmployee.bloodType} onChange={e => setField("bloodType", e.target.value)}><option value="">Seçin...</option><option>A Rh+</option><option>A Rh-</option><option>B Rh+</option><option>B Rh-</option><option>AB Rh+</option><option>AB Rh-</option><option>0 Rh+</option><option>0 Rh-</option><option>Bilinmiyor</option></select></FormField>
                <FormField styles={styles} label="Kronik Rahatsızlıklar"><input style={styles.input} className="isg-input" value={newEmployee.chronicConditions} onChange={e => setField("chronicConditions", e.target.value)} /></FormField>
                <FormField styles={styles} label="Alerji"><input style={styles.input} className="isg-input" value={newEmployee.allergies} onChange={e => setField("allergies", e.target.value)} /></FormField>
                <FormField styles={styles} label="Tetanoz Aşı Bilgisi"><input style={styles.input} className="isg-input" value={newEmployee.tetanusVaccine} onChange={e => setField("tetanusVaccine", e.target.value)} /></FormField>
                <FormField styles={styles} label="Hepatit Aşı Bilgisi"><input style={styles.input} className="isg-input" value={newEmployee.hepatitisVaccine} onChange={e => setField("hepatitisVaccine", e.target.value)} /></FormField>
              </div>
              <div style={{ marginTop: 12 }}>
                <FormField styles={styles} label="Notlar"><textarea style={{ ...styles.input, minHeight: 76, resize: "vertical" as const }} className="isg-input" value={newEmployee.notes} onChange={e => setField("notes", e.target.value)} /></FormField>
              </div>
            </div>
            <div>
              <p style={{ ...styles.sectionTitle, marginBottom: 10 }}>Belge Taraması</p>
              <div style={{ border: "1px solid var(--isg-border)", borderRadius: 8, padding: 12, backgroundColor: "var(--isg-input-bg)" }}>
                <label style={{ ...styles.btnSecondary, display: "inline-flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}>
                  Belge Tara / Dosya Seç
                  <input type="file" accept="image/*,.pdf" multiple style={{ display: "none" }} onChange={addScannedDocuments} />
                </label>
                {newEmployee.scannedDocuments.length > 0 && (
                  <div style={{ display: "grid", gap: 8, marginTop: 12 }}>
                    {newEmployee.scannedDocuments.map(doc => (
                      <div key={doc.id} style={{ display: "flex", justifyContent: "space-between", gap: 8, alignItems: "center", border: "1px solid var(--isg-border)", borderRadius: 8, padding: "8px 10px", fontSize: 12 }}>
                        <span style={{ color: "var(--isg-text)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{doc.name}</span>
                        <button type="button" style={{ ...styles.btnDanger, padding: "5px 9px", fontSize: 11 }} onClick={() => removeScannedDocument(doc.id)}>Kaldır</button>
                      </div>
                    ))}
                  </div>
                )}
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
