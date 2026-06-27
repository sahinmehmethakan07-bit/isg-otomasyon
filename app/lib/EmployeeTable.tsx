import React from "react";
import { checklistCompletion, createOnboardingFromChecklist } from "./dashboardUtils";
import { formatDate } from "./dateUtils";
import { EmptyTableRow } from "./EmptyState";
import type { Company, Employee } from "./types";

type EmployeeTableProps = {
  styles: Record<string, React.CSSProperties>;
  companies: Company[];
  filteredEmployees: Employee[];
  search: string;
  setSearch: (value: string) => void;
  selectedCompanyId: string;
  setSelectedCompanyId: (value: string) => void;
  selectedEmployeeId: string | null;
  setSelectedEmployeeId: (value: string) => void;
  deleteEmployee: (id: string) => void;
};

function Badge({ text, color }: { text: string; color: string }) {
  return (
    <span className="isg-badge" style={{ border: "1px solid " + color + "55", color, background: color + "18" }}>{text}</span>
  );
}

export function EmployeeTable({
  styles,
  companies,
  filteredEmployees,
  search,
  setSearch,
  selectedCompanyId,
  setSelectedCompanyId,
  selectedEmployeeId,
  setSelectedEmployeeId,
  deleteEmployee,
}: EmployeeTableProps) {
  return (
    <>
      <div style={{ ...styles.searchBar, gridColumn: "1 / -1" }}>
        <input style={{ ...styles.input, maxWidth: 240 }} placeholder="Ara..." value={search} onChange={e => setSearch(e.target.value)} />
        <select style={{ ...styles.select, maxWidth: 180 }} value={selectedCompanyId} onChange={e => setSelectedCompanyId(e.target.value)}>
          <option value="all">Tüm Firmalar</option>
          {companies.map(c => <option key={c.id} value={c.id}>{c.nickName}</option>)}
        </select>
        <span style={{ color: "#6B7280", fontSize: 13 }}>{filteredEmployees.length} kişi</span>
      </div>
      <div style={{ ...styles.card, gridColumn: "1 / -1", padding: 0, overflow: "auto", WebkitOverflowScrolling: "touch" as any }}>
        <table style={styles.table}>
          <thead><tr>{["Ad Soyad", "TC No", "İletişim", "Birim", "Unvan", "Firma", "İşe Giriş", "Onboarding", "Eksikler", "Kontrol Listesi", "İşlem"].map(h => <th key={h} style={styles.th} className="isg-th">{h}</th>)}</tr></thead>
          <tbody>
            {filteredEmployees.map(emp => {
              const company = companies.find(c => c.id === emp.companyId);
              const cl = checklistCompletion(emp.checklist);
              const onboarding = emp.onboarding || createOnboardingFromChecklist(emp.checklist);
              const completionWidth = cl.total > 0 ? (cl.completed / cl.total) * 100 : 0;
              return (
                <tr key={emp.id} style={{ cursor: "pointer", backgroundColor: selectedEmployeeId === emp.id ? "#1a2942" : "transparent" }} onClick={() => setSelectedEmployeeId(emp.id)}>
                  <td style={styles.td} className="isg-td">
                    <div style={{ display: "flex", alignItems: "center", gap: 9, minWidth: 180 }}>
                      {emp.photo ? <img src={emp.photo} alt="" style={{ width: 34, height: 34, borderRadius: 8, objectFit: "cover", border: "1px solid var(--isg-border)" }} /> : <div style={{ width: 34, height: 34, borderRadius: 8, backgroundColor: "var(--isg-input-bg)", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--isg-text-muted)", fontSize: 13 }}>👤</div>}
                      <span style={{ fontWeight: 700 }}>{emp.firstName} {emp.lastName}</span>
                    </div>
                  </td>
                  <td style={{ ...styles.td, fontSize: 12, color: "var(--isg-text-muted)" }}>{emp.tcNo}</td>
                  <td style={{ ...styles.td, fontSize: 11, color: "var(--isg-text-muted)" }}>
                    <div>{emp.phone || "—"}</div>
                    {emp.email && <div>{emp.email}</div>}
                  </td>
                  <td style={{ ...styles.td, fontSize: 12 }}>{emp.department || "—"}</td>
                  <td style={styles.td} className="isg-td">{emp.title}</td>
                  <td style={{ ...styles.td, fontSize: 12 }}>{company?.nickName}</td>
                  <td style={{ ...styles.td, fontSize: 12 }}>{formatDate(emp.hireDate)}</td>
                  <td style={styles.td} className="isg-td"><Badge text={onboarding.status === "completed" ? "Tamamlandı" : "Bekliyor"} color={onboarding.status === "completed" ? "#2D6A4F" : "#D4A017"} /></td>
                  <td style={{ ...styles.td, fontSize: 11, color: "var(--isg-text-muted)", minWidth: 220 }}>{onboarding.missingSteps.length > 0 ? onboarding.missingSteps.join(", ") : "Tüm görevler tamamlandı"}</td>
                  <td style={styles.td} className="isg-td">
                    <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                      <div style={{ height: 6, width: 80, backgroundColor: "var(--isg-bg)", borderRadius: 3, overflow: "hidden" }}>
                        <div style={{ height: "100%", width: completionWidth + "%", backgroundColor: cl.missing === 0 ? "#2D6A4F" : "#D4A017" }} />
                      </div>
                      <span style={{ fontSize: 11, color: "var(--isg-text-muted)" }}>{cl.completed}/{cl.total}</span>
                    </div>
                  </td>
                  <td style={styles.td} className="isg-td"><button style={styles.btnDanger} onClick={e => { e.stopPropagation(); deleteEmployee(emp.id); }}>Sil</button></td>
                </tr>
              );
            })}
            {filteredEmployees.length === 0 && (
              <EmptyTableRow colSpan={11} message="Yeni personel eklemek için yukarıdaki personel formunu kullanın." />
            )}
          </tbody>
        </table>
      </div>
    </>
  );
}
