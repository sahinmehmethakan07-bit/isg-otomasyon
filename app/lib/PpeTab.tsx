import React from "react";
import { IsoTarihSecici } from "./TarihSecici";
import { formatDate } from "./dateUtils";
import { EmptyTableRow } from "./EmptyState";
import { generatePpeAssignmentPDF } from "./pdf";
import type { Company, Employee, PpeRecord, PpeStatus } from "./types";

type PpeDraft = {
  companyId: string;
  employeeId: string;
  equipment: string;
  quantity: string;
  issueDate: string;
  returnDate: string;
  status: PpeStatus;
  serialNo: string;
  notes: string;
};

type PpeTabProps = {
  styles: Record<string, React.CSSProperties>;
  companies: Company[];
  employees: Employee[];
  filteredPpeRecords: PpeRecord[];
  newPpe: PpeDraft;
  setNewPpe: React.Dispatch<React.SetStateAction<PpeDraft>>;
  search: string;
  setSearch: (value: string) => void;
  selectedCompanyId: string;
  setSelectedCompanyId: (value: string) => void;
  addPpeRecord: () => void;
  updatePpeStatus: (id: string, status: PpeStatus) => void;
  deletePpeRecord: (id: string) => void;
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
    <span className="isg-badge" style={{ border: `1px solid ${color}55`, color, background: `${color}18` }}>{text}</span>
  );
}

export function PpeTab({
  styles,
  companies,
  employees,
  filteredPpeRecords,
  newPpe,
  setNewPpe,
  search,
  setSearch,
  selectedCompanyId,
  setSelectedCompanyId,
  addPpeRecord,
  updatePpeStatus,
  deletePpeRecord,
}: PpeTabProps) {
  return (
    <div>
      <div style={styles.card} className="isg-card">
        <p style={styles.sectionTitle} className="isg-text-muted">KKD Zimmet Formu</p>
        <div style={styles.formGrid}>
          <FormField label="Firma *">
            <select style={styles.select} className="isg-input" value={newPpe.companyId} onChange={e => setNewPpe({ ...newPpe, companyId: e.target.value, employeeId: "" })}>
              <option value="">Seçin...</option>
              {companies.map(c => <option key={c.id} value={c.id}>{c.nickName}</option>)}
            </select>
          </FormField>
          <FormField label="Personel *">
            <select style={styles.select} className="isg-input" value={newPpe.employeeId} onChange={e => setNewPpe({ ...newPpe, employeeId: e.target.value })}>
              <option value="">Seçin...</option>
              {employees.filter(employee => employee.companyId === newPpe.companyId).map(employee => <option key={employee.id} value={employee.id}>{employee.firstName} {employee.lastName}</option>)}
            </select>
          </FormField>
          <FormField label="KKD / Malzeme *">
            <select style={styles.select} className="isg-input" value={newPpe.equipment} onChange={e => setNewPpe({ ...newPpe, equipment: e.target.value })}>
              <option>Baret</option>
              <option>İş Ayakkabısı</option>
              <option>Koruyucu Gözlük</option>
              <option>Kulak Koruyucu</option>
              <option>İş Eldiveni</option>
              <option>Reflektörlü Yelek</option>
              <option>Emniyet Kemeri</option>
              <option>Toz Maskesi</option>
              <option>Diğer</option>
            </select>
          </FormField>
          <FormField label="Adet"><input style={styles.input} className="isg-input" type="number" min="1" value={newPpe.quantity} onChange={e => setNewPpe({ ...newPpe, quantity: e.target.value })} /></FormField>
          <FormField label="Teslim Tarihi *"><IsoTarihSecici allowFuture styles={styles} value={newPpe.issueDate} onChange={v => setNewPpe({ ...newPpe, issueDate: v })} /></FormField>
          <FormField label="İade Tarihi"><IsoTarihSecici allowFuture styles={styles} value={newPpe.returnDate} onChange={v => setNewPpe({ ...newPpe, returnDate: v })} /></FormField>
          <FormField label="Durum">
            <select style={styles.select} className="isg-input" value={newPpe.status} onChange={e => setNewPpe({ ...newPpe, status: e.target.value as PpeStatus })}>
              <option>Teslim Edildi</option>
              <option>İade Edildi</option>
              <option>Hasarlı / Kayıp</option>
            </select>
          </FormField>
          <FormField label="Seri No"><input style={styles.input} className="isg-input" value={newPpe.serialNo} onChange={e => setNewPpe({ ...newPpe, serialNo: e.target.value })} placeholder="Varsa seri / beden / özellik" /></FormField>
          <FormField label="Not"><input style={styles.input} className="isg-input" value={newPpe.notes} onChange={e => setNewPpe({ ...newPpe, notes: e.target.value })} placeholder="Kullanım talimatı, beden, marka..." /></FormField>
        </div>
        <div style={{ marginTop: 12, display: "flex", gap: 10, flexWrap: "wrap" }}>
          <button style={styles.btnPrimary} onClick={addPpeRecord}>KKD Kaydı Ekle</button>
        </div>
      </div>

      <div style={styles.searchBar}>
        <input style={{ ...styles.input, maxWidth: 300 }} placeholder="Ara..." value={search} onChange={e => setSearch(e.target.value)} />
        <select style={{ ...styles.select, maxWidth: 180 }} value={selectedCompanyId} onChange={e => setSelectedCompanyId(e.target.value)}><option value="all">Tüm Firmalar</option>{companies.map(c => <option key={c.id} value={c.id}>{c.nickName}</option>)}</select>
        <span style={{ color: "var(--isg-text-muted)", fontSize: 13 }}>{filteredPpeRecords.length} KKD kaydı</span>
      </div>

      <div style={{ ...styles.card, padding: 0, overflow: "auto", WebkitOverflowScrolling: "touch" as any }}>
        <table style={styles.table}>
          <thead><tr>{["Firma", "Personel", "KKD", "Adet", "Teslim", "İade", "Durum", "Seri / Not", "Çıktı", "İşlem"].map(h => <th key={h} style={styles.th} className="isg-th">{h}</th>)}</tr></thead>
          <tbody>
            {filteredPpeRecords.map(record => {
              const company = companies.find(c => c.id === record.companyId);
              const employee = employees.find(e => e.id === record.employeeId);
              return (
                <tr key={record.id}>
                  <td style={styles.td} className="isg-td">{company?.nickName || "—"}</td>
                  <td style={styles.td} className="isg-td"><strong>{employee ? `${employee.firstName} ${employee.lastName}` : "—"}</strong></td>
                  <td style={styles.td} className="isg-td"><Badge text={record.equipment} color="#f59e0b" /></td>
                  <td style={styles.td} className="isg-td">{record.quantity}</td>
                  <td style={styles.td} className="isg-td">{formatDate(record.issueDate)}</td>
                  <td style={styles.td} className="isg-td">{formatDate(record.returnDate)}</td>
                  <td style={styles.td} className="isg-td">
                    <select style={{ ...styles.select, minWidth: 142 }} value={record.status} onChange={e => updatePpeStatus(record.id, e.target.value as PpeStatus)}>
                      <option>Teslim Edildi</option>
                      <option>İade Edildi</option>
                      <option>Hasarlı / Kayıp</option>
                    </select>
                  </td>
                  <td style={{ ...styles.td, minWidth: 170, color: "var(--isg-text-muted)" }} className="isg-td">{[record.serialNo, record.notes].filter(Boolean).join(" / ") || "—"}</td>
                  <td style={styles.td} className="isg-td"><button style={styles.btnSecondary} onClick={() => generatePpeAssignmentPDF(record, company, employee)}>Zimmet PDF</button></td>
                  <td style={styles.td} className="isg-td"><button style={styles.btnDanger} onClick={() => deletePpeRecord(record.id)}>Sil</button></td>
                </tr>
              );
            })}
            {filteredPpeRecords.length === 0 && (
              <EmptyTableRow colSpan={10} message="Yeni KKD kaydı eklemek için yukarıdaki formu kullanın." />
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
