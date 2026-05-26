import React from "react";
import { createOnboardingFromChecklist } from "./dashboardUtils";
import type { Company, Employee, EmployeeChecklist } from "./types";

type EmployeeDetailPanelProps = {
  styles: Record<string, React.CSSProperties>;
  selectedEmployee: Employee;
  selectedEmployeeCompany: Company | null;
  updateEmployeeChecklist: (employeeId: string, checklist: EmployeeChecklist) => void;
  updateEmployeeTraining: (employeeId: string, trainingComplete: boolean) => void;
  printEmployeeCertificate: (employee: Employee, company: Company | null) => void;
};

function FormField({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label>
      <span style={{ display: "block", fontSize: 12, color: "var(--isg-text-muted)", marginBottom: 8, fontWeight: 700 }}>{label}</span>
      {children}
    </label>
  );
}

function Badge({ text, color }: { text: string; color: string }) {
  return (
    <span style={{ border: "1px solid " + color + "55", color, background: color + "18", padding: "4px 8px", borderRadius: 6, fontSize: 12, fontWeight: 800 }}>{text}</span>
  );
}

export function EmployeeDetailPanel({
  styles,
  selectedEmployee,
  selectedEmployeeCompany,
  updateEmployeeChecklist,
  updateEmployeeTraining,
  printEmployeeCertificate,
}: EmployeeDetailPanelProps) {
  const onboarding = selectedEmployee.onboarding || createOnboardingFromChecklist(selectedEmployee.checklist);
  const onboardingBorder = onboarding.status === "completed" ? "#16a34a33" : "#d9770633";
  const onboardingBackground = onboarding.status === "completed" ? "#16a34a10" : "#d9770610";
  const scannedDocuments = selectedEmployee.scannedDocuments || [];

  return (
    <div style={{ minWidth: 0, maxWidth: "100%" }}>
      <div style={{ ...styles.card, overflow: "visible" }} className="isg-card">
        <p style={styles.sectionTitle} className="isg-text-muted">Personel Detayı</p>
        <div style={{ display: "flex", gap: 12, alignItems: "flex-start" }}>
          {selectedEmployee.photo ? <img src={selectedEmployee.photo} alt="" style={{ width: 76, height: 92, borderRadius: 8, objectFit: "cover", border: "1px solid var(--isg-border)" }} /> : <div style={{ width: 76, height: 92, borderRadius: 8, backgroundColor: "var(--isg-input-bg)", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--isg-text-muted)" }}>👤</div>}
          <div>
            <div style={{ fontWeight: 800, fontSize: 16, marginBottom: 2 }}>{selectedEmployee.firstName} {selectedEmployee.lastName}</div>
            <div style={{ fontSize: 12, color: "var(--isg-text-muted)" }}>{selectedEmployee.title || "Unvan girilmedi"}</div>
            <div style={{ fontSize: 12, color: "var(--isg-text-muted)", marginTop: 2 }}>{selectedEmployee.department || "Birim girilmedi"}</div>
            <div style={{ fontSize: 12, color: "var(--isg-text-muted)", marginTop: 2 }}>{selectedEmployeeCompany?.nickName}</div>
          </div>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: 6, marginTop: 14, fontSize: 12, color: "var(--isg-text-muted)", lineHeight: 1.45 }}>
          <div><strong style={{ color: "var(--isg-text)" }}>TC:</strong> {selectedEmployee.tcNo || "—"}</div>
          <div><strong style={{ color: "var(--isg-text)" }}>Doğum:</strong> {[selectedEmployee.birthPlace, selectedEmployee.birthDate].filter(Boolean).join(" / ") || "—"}</div>
          <div><strong style={{ color: "var(--isg-text)" }}>Telefon:</strong> {selectedEmployee.phone || "—"}</div>
          <div><strong style={{ color: "var(--isg-text)" }}>E-posta:</strong> {selectedEmployee.email || "—"}</div>
          {selectedEmployee.address && <div><strong style={{ color: "var(--isg-text)" }}>Adres:</strong> {selectedEmployee.address}</div>}
          {selectedEmployee.bloodType && <div><strong style={{ color: "var(--isg-text)" }}>Kan Grubu:</strong> {selectedEmployee.bloodType}</div>}
          {selectedEmployee.chronicConditions && <div><strong style={{ color: "var(--isg-text)" }}>Kronik Rahatsızlık:</strong> {selectedEmployee.chronicConditions}</div>}
          {selectedEmployee.workingHours && <div><strong style={{ color: "var(--isg-text)" }}>Çalışma Süresi:</strong> {selectedEmployee.workingHours}</div>}
          {selectedEmployee.shiftPlan && <div><strong style={{ color: "var(--isg-text)" }}>Vardiya:</strong> {selectedEmployee.shiftPlan}</div>}
          {selectedEmployee.foreignLanguage && <div><strong style={{ color: "var(--isg-text)" }}>Yabancı Dil:</strong> {selectedEmployee.foreignLanguage}</div>}
          {selectedEmployee.militaryStatus && <div><strong style={{ color: "var(--isg-text)" }}>Askerlik:</strong> {selectedEmployee.militaryStatus}</div>}
          {selectedEmployee.driverLicense && <div><strong style={{ color: "var(--isg-text)" }}>Ehliyet:</strong> {selectedEmployee.driverLicense}</div>}
          {selectedEmployee.criminalRecord && <div><strong style={{ color: "var(--isg-text)" }}>Sabıka:</strong> {selectedEmployee.criminalRecord}</div>}
          {selectedEmployee.retirementInfo && <div><strong style={{ color: "var(--isg-text)" }}>Emekli:</strong> {selectedEmployee.retirementInfo}</div>}
          {scannedDocuments.length > 0 && <div><strong style={{ color: "var(--isg-text)" }}>Taranan Belge:</strong> {scannedDocuments.length} dosya</div>}
          {selectedEmployee.emergencyContactName && <div><strong style={{ color: "var(--isg-text)" }}>Acil:</strong> {selectedEmployee.emergencyContactName} {selectedEmployee.emergencyContactPhone}</div>}
        </div>

        {scannedDocuments.length > 0 && (
          <>
            <p style={{ ...styles.sectionTitle, marginTop: 16 }}>Belge Taramaları</p>
            <div style={{ display: "grid", gap: 8 }}>
              {scannedDocuments.map(doc => (
                <a
                  key={doc.id}
                  href={doc.data}
                  download={doc.name}
                  style={{ ...styles.btnSecondary, textDecoration: "none", justifyContent: "space-between", fontSize: 12 }}
                >
                  <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{doc.name}</span>
                  <span>İndir</span>
                </a>
              ))}
            </div>
          </>
        )}

        <div style={{ backgroundColor: onboardingBackground, border: "1px solid " + onboardingBorder, borderRadius: 8, padding: 12, marginTop: 14 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8, marginBottom: 6 }}>
            <span style={{ fontSize: 12, fontWeight: 700, color: onboarding.status === "completed" ? "#86efac" : "#fbbf24" }}>
              {onboarding.status === "completed" ? "Yeşil statü: tamamlandı" : "Eksik görev var"}
            </span>
            <Badge text={onboarding.status === "completed" ? "Tamamlandı" : onboarding.missingSteps.length + " eksik"} color={onboarding.status === "completed" ? "#16a34a" : "#d97706"} />
          </div>
          <div style={{ fontSize: 11, color: "var(--isg-text-muted)", lineHeight: 1.5 }}>
            {onboarding.missingSteps.length > 0 ? onboarding.missingSteps.join(" · ") : "Doktor ve İSG uzmanı görevleri tamamlandı."}
          </div>
        </div>

        <p style={{ ...styles.sectionTitle, marginTop: 16 }}>Kontrol Listesi</p>
        {[{ key: "isgCertificateDate", label: "İSG Sertifikası Tarihi" }, { key: "ek2Date", label: "EK-2 Tarihi" }, { key: "orientationDate", label: "Oryantasyon Tarihi" }].map(({ key, label }) => (
          <FormField key={key} label={label}>
            <input
              style={{ ...styles.input, marginBottom: 8 }}
              type="date"
              value={(selectedEmployee.checklist as any)[key]}
              onChange={e => {
                const updated = { ...selectedEmployee.checklist, [key]: e.target.value };
                updateEmployeeChecklist(selectedEmployee.id, updated);
              }}
            />
          </FormField>
        ))}
        {[{ key: "preTest", label: "Ön Test" }, { key: "postTest", label: "Son Test" }, { key: "undertaking", label: "Taahhütname" }, { key: "kkdMinutes", label: "KKD Tutanağı" }, { key: "attendanceDoc", label: "Katılım Belgesi" }].map(({ key, label }) => (
          <label key={key} style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8, cursor: "pointer", fontSize: 13 }}>
            <input
              type="checkbox"
              checked={(selectedEmployee.checklist as any)[key]}
              onChange={e => {
                const updated = { ...selectedEmployee.checklist, [key]: e.target.checked };
                updateEmployeeChecklist(selectedEmployee.id, updated);
              }}
            />
            {label}
          </label>
        ))}
        <label style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 8, cursor: "pointer", fontSize: 13 }}>
          <input type="checkbox" checked={selectedEmployee.trainingComplete} onChange={e => updateEmployeeTraining(selectedEmployee.id, e.target.checked)} />
          Eğitim Tamamlandı
        </label>
        {selectedEmployee.checklist.isgCertificateDate && (
          <button style={{ ...styles.btnPrimary, marginTop: 16, width: "100%" }} onClick={() => printEmployeeCertificate(selectedEmployee, selectedEmployeeCompany)}>
            🖨 Sertifikayı Yazdır
          </button>
        )}
      </div>
    </div>
  );
}
