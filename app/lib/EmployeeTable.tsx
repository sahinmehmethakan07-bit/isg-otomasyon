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

type EmployeeActivityFilter = "all" | "active" | "inactive";
type EmployeeOnboardingFilter = "all" | "completed" | "pending";
type EmployeeChecklistFilter = "all" | "complete" | "missing";

function Badge({ text, color }: { text: string; color: string }) {
  return (
    <span className="isg-badge" style={{ border: "1px solid " + color + "55", color, background: color + "18" }}>{text}</span>
  );
}

function filterColor(value: string) {
  if (value === "active" || value === "completed" || value === "complete") return "#2D6A4F";
  if (value === "inactive" || value === "pending" || value === "missing") return "#D4A017";
  return "#52d3b5";
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
  const [activityFilter, setActivityFilter] = React.useState<EmployeeActivityFilter>("all");
  const [onboardingFilter, setOnboardingFilter] = React.useState<EmployeeOnboardingFilter>("all");
  const [checklistFilter, setChecklistFilter] = React.useState<EmployeeChecklistFilter>("all");
  const getOnboarding = React.useCallback((employee: Employee) => employee.onboarding || createOnboardingFromChecklist(employee.checklist), []);
  const visibleEmployees = React.useMemo(() => filteredEmployees.filter(employee => {
    const onboarding = getOnboarding(employee);
    const checklist = checklistCompletion(employee.checklist);
    const matchesActivity =
      activityFilter === "all" ||
      (activityFilter === "active" && employee.isActive !== false) ||
      (activityFilter === "inactive" && employee.isActive === false);
    const matchesOnboarding = onboardingFilter === "all" || onboarding.status === onboardingFilter;
    const matchesChecklist =
      checklistFilter === "all" ||
      (checklistFilter === "complete" && checklist.missing === 0) ||
      (checklistFilter === "missing" && checklist.missing > 0);
    return matchesActivity && matchesOnboarding && matchesChecklist;
  }), [activityFilter, checklistFilter, filteredEmployees, getOnboarding, onboardingFilter]);
  const activityFilters: Array<{ value: EmployeeActivityFilter; label: string; count: number; color: string }> = [
    { value: "all", label: "Tüm Personel", count: filteredEmployees.length, color: filterColor("all") },
    { value: "active", label: "Aktif", count: filteredEmployees.filter(employee => employee.isActive !== false).length, color: filterColor("active") },
    { value: "inactive", label: "Pasif", count: filteredEmployees.filter(employee => employee.isActive === false).length, color: filterColor("inactive") },
  ];
  const onboardingFilters: Array<{ value: EmployeeOnboardingFilter; label: string; count: number; color: string }> = [
    { value: "all", label: "Tüm Onboarding", count: filteredEmployees.length, color: filterColor("all") },
    { value: "completed", label: "Tamamlandı", count: filteredEmployees.filter(employee => getOnboarding(employee).status === "completed").length, color: filterColor("completed") },
    { value: "pending", label: "Bekliyor", count: filteredEmployees.filter(employee => getOnboarding(employee).status === "pending").length, color: filterColor("pending") },
  ];
  const checklistFilters: Array<{ value: EmployeeChecklistFilter; label: string; count: number; color: string }> = [
    { value: "all", label: "Tüm Listeler", count: filteredEmployees.length, color: filterColor("all") },
    { value: "complete", label: "Liste Tam", count: filteredEmployees.filter(employee => checklistCompletion(employee.checklist).missing === 0).length, color: filterColor("complete") },
    { value: "missing", label: "Eksik Var", count: filteredEmployees.filter(employee => checklistCompletion(employee.checklist).missing > 0).length, color: filterColor("missing") },
  ];

  return (
    <>
      <div style={{ ...styles.searchBar, gridColumn: "1 / -1" }}>
        <input style={{ ...styles.input, maxWidth: 240 }} placeholder="Ara..." value={search} onChange={e => setSearch(e.target.value)} />
        <select style={{ ...styles.select, maxWidth: 180 }} value={selectedCompanyId} onChange={e => setSelectedCompanyId(e.target.value)}>
          <option value="all">Tüm Firmalar</option>
          {companies.map(c => <option key={c.id} value={c.id}>{c.nickName}</option>)}
        </select>
        <span style={{ color: "var(--isg-text-muted)", fontSize: 13 }}>{visibleEmployees.length} kişi</span>
      </div>
      <div style={{ ...styles.card, gridColumn: "1 / -1", padding: 16 }} className="isg-card">
        {[
          { title: "Aktiflik Filtresi", filters: activityFilters, value: activityFilter, onChange: setActivityFilter },
          { title: "Onboarding Filtresi", filters: onboardingFilters, value: onboardingFilter, onChange: setOnboardingFilter },
          { title: "Kontrol Listesi Filtresi", filters: checklistFilters, value: checklistFilter, onChange: setChecklistFilter },
        ].map(group => (
          <div key={group.title} style={{ marginBottom: 12 }}>
            <div style={{ ...styles.label, marginBottom: 8 }} className="isg-label">{group.title}</div>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              {group.filters.map(filter => {
                const active = group.value === filter.value;
                return (
                  <button
                    key={filter.value}
                    type="button"
                    onClick={() => group.onChange(filter.value as never)}
                    style={{
                      ...styles.btnSecondary,
                      minHeight: 38,
                      border: `1px solid ${active ? filter.color : "var(--isg-border)"}`,
                      backgroundColor: active ? `${filter.color}18` : "var(--isg-input-bg)",
                      color: active ? filter.color : "var(--isg-text)",
                    }}
                  >
                    {filter.label} <span style={{ color: active ? filter.color : "var(--isg-text-muted)" }}>({filter.count})</span>
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>
      <div style={{ ...styles.card, gridColumn: "1 / -1", padding: 0, overflow: "auto", WebkitOverflowScrolling: "touch" as any }}>
        <table style={styles.table}>
          <thead><tr>{["Ad Soyad", "TC No", "İletişim", "Birim", "Unvan", "Firma", "İşe Giriş", "Onboarding", "Eksikler", "Kontrol Listesi", "İşlem"].map(h => <th key={h} style={styles.th} className="isg-th">{h}</th>)}</tr></thead>
          <tbody>
            {visibleEmployees.map(emp => {
              const company = companies.find(c => c.id === emp.companyId);
              const cl = checklistCompletion(emp.checklist);
              const onboarding = getOnboarding(emp);
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
            {visibleEmployees.length === 0 && (
              <EmptyTableRow colSpan={11} message="Filtreleri değiştirin veya yeni personel eklemek için yukarıdaki personel formunu kullanın." />
            )}
          </tbody>
        </table>
      </div>
    </>
  );
}
