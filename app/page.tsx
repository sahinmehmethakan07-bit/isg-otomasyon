"use client";
// SessionGuard devre disi
// destroySession devre disi
import { AccidentReportsTab } from "./lib/AccidentReportsTab";
import { AdminUserPanel } from "./lib/AdminUserPanel";
import { AnnualPlansTab } from "./lib/AnnualPlansTab";
import { AppShell } from "./lib/AppShell";
import { ArchiveTab } from "./lib/ArchiveTab";
import { CommitteeMeetingsTab } from "./lib/CommitteeMeetingsTab";
import { CompanyVisitsTab } from "./lib/CompanyVisitsTab";
import { CompaniesTab } from "./lib/CompaniesTab";
import { DocumentsTab } from "./lib/DocumentsTab";
import { DofTab } from "./lib/DofTab";
import { Ek2MuayeneFormu } from "./lib/Ek2MuayeneFormu";
import { EmployeeDetailPanel } from "./lib/EmployeeDetailPanel";
import { EmployeeForm } from "./lib/EmployeeForm";
import { EmployeeTable } from "./lib/EmployeeTable";
import { EmergencyPlansTab } from "./lib/EmergencyPlansTab";
import { MykLookupTab, NaceLookupTab } from "./lib/LookupTabs";
import { LockedModuleNotice } from "./lib/LockedModuleNotice";
import { ObserversTab } from "./lib/ObserversTab";
import { PpeTab } from "./lib/PpeTab";
import { RiskTab } from "./lib/RiskTab";
import { SignersTab } from "./lib/SignersTab";
import { TrainingsTab } from "./lib/TrainingsTab";
import { usePageState } from "./lib/usePageState";
import { OzetTab } from "./lib/OzetTab";
import { GorevlerTab } from "./lib/GorevlerTab";
import { PaketlerTab } from "./lib/PaketlerTab";

import React from "react";

// ── Styles ────────────────────────────────────────────────────────────────────
const styles: Record<string, React.CSSProperties> = {
  app: { minHeight: "100vh", height: "100dvh", background: "var(--isg-bg)", color: "var(--isg-text)", fontFamily: "-apple-system, BlinkMacSystemFont, 'Roboto', 'Segoe UI', sans-serif", overflow: "hidden" as const },
  header: { backgroundColor: "var(--isg-header)", borderBottom: "1px solid var(--isg-border)", padding: "0 28px", display: "flex", alignItems: "center", justifyContent: "space-between", height: 58, gap: 10, backdropFilter: "blur(22px)", WebkitBackdropFilter: "blur(22px)", position: "sticky" as const, top: 0, zIndex: 50, boxShadow: "0 12px 34px rgba(0,0,0,0.22)" },
  nav: { display: "flex", gap: 6, padding: "0 28px", borderBottom: "1px solid var(--isg-border)", backgroundColor: "var(--isg-nav)", overflowX: "auto" as const, WebkitOverflowScrolling: "touch" as const, msOverflowStyle: "none" as const, scrollbarWidth: "none" as const, backdropFilter: "blur(22px)", WebkitBackdropFilter: "blur(22px)", position: "sticky" as const, top: 58, zIndex: 40, height: 50, alignItems: "center" },
  shell: { display: "flex", alignItems: "stretch", minHeight: "calc(100vh - 58px)", width: "100%", overflow: "hidden" as const },
  sidebar: { flexShrink: 0, borderRight: "1px solid var(--isg-border)", backgroundColor: "var(--isg-nav)", padding: "18px 14px", overflowY: "auto" as const, boxSizing: "border-box" as const, backdropFilter: "blur(22px)", WebkitBackdropFilter: "blur(22px)", zIndex: 35 },
  sidebarSearch: { height: 34, border: "1px solid var(--isg-border)", borderRadius: 8, backgroundColor: "var(--isg-input-bg)", display: "flex", alignItems: "center", gap: 8, padding: "0 10px", marginBottom: 18 },
  sidebarGroupTitle: { color: "var(--isg-text-subtle)", fontSize: 10, fontWeight: 800, textTransform: "uppercase" as const, letterSpacing: "0.1em", margin: "0 0 7px 4px" },
  sidebarItem: { minHeight: 36, width: "100%", border: "1px solid transparent", borderRadius: 8, backgroundColor: "transparent", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8, padding: "0 10px", fontSize: 13, fontWeight: 700, textAlign: "left" as const, transition: "color 0.15s, border-color 0.15s, background-color 0.15s, opacity 0.15s" },
  soonBadge: { fontSize: 10, fontWeight: 800, color: "#a78bfa", border: "1px solid rgba(167,139,250,0.24)", backgroundColor: "rgba(167,139,250,0.12)", borderRadius: 6, padding: "2px 6px", whiteSpace: "nowrap" as const },
  content: { padding: "24px", width: "100%", minWidth: 0, flex: "1 1 auto", boxSizing: "border-box" as const, margin: "0 auto" },
  card: { backgroundColor: "var(--isg-card)", border: "1px solid var(--isg-border)", borderRadius: 12, padding: "20px 22px", marginBottom: 20 },
  sectionTitle: { fontSize: 12, fontWeight: 800, textTransform: "uppercase" as const, letterSpacing: "0.08em", marginBottom: 14 },
  input: { height: 44, border: "1px solid var(--isg-border)", borderRadius: 10, backgroundColor: "var(--isg-input-bg)", color: "var(--isg-text)", padding: "0 12px", fontSize: 16, width: "100%", outline: "none", boxSizing: "border-box" as const },
  select: { height: 44, border: "1px solid var(--isg-border)", borderRadius: 10, backgroundColor: "var(--isg-input-bg)", color: "var(--isg-text)", padding: "0 12px", fontSize: 16, width: "100%", outline: "none", boxSizing: "border-box" as const },
  textarea: { border: "1px solid var(--isg-border)", borderRadius: 10, backgroundColor: "var(--isg-input-bg)", color: "var(--isg-text)", padding: "10px 12px", fontSize: 16, width: "100%", outline: "none", resize: "vertical" as const, fontFamily: "inherit", boxSizing: "border-box" as const },
  btnPrimary: { minHeight: 44, backgroundColor: "var(--isg-accent)", color: "#fff", border: "none", borderRadius: 10, padding: "0 16px", fontSize: 15, fontWeight: 700, cursor: "pointer", display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 6, whiteSpace: "nowrap" as const },
  btnSecondary: { minHeight: 44, backgroundColor: "var(--isg-btn-secondary)", color: "var(--isg-text)", border: "1px solid var(--isg-border)", borderRadius: 10, padding: "0 14px", fontSize: 15, fontWeight: 650, cursor: "pointer", display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 6, whiteSpace: "nowrap" as const },
  btnDanger: { minHeight: 44, backgroundColor: "rgba(220,38,38,0.1)", color: "var(--isg-danger)", border: "1px solid rgba(220,38,38,0.2)", borderRadius: 10, padding: "0 14px", fontSize: 15, fontWeight: 700, cursor: "pointer", whiteSpace: "nowrap" as const },
  table: { width: "100%", borderCollapse: "collapse" as const, fontSize: 13 },
  th: { padding: "10px 12px", textAlign: "left" as const, fontWeight: 800, fontSize: 11, textTransform: "uppercase" as const, letterSpacing: "0.07em", borderBottom: "1px solid var(--isg-border)", color: "var(--isg-text-muted)", whiteSpace: "nowrap" as const },
  td: { padding: "10px 12px", borderBottom: "1px solid var(--isg-border)", verticalAlign: "top" as const },
  searchBar: { display: "flex", gap: 10, marginBottom: 16, flexWrap: "wrap" as const, alignItems: "center" },
  formGrid: { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(min(220px, 100%), 1fr))", gap: 12, marginBottom: 14 },
  label: { fontSize: 11, fontWeight: 700, color: "var(--isg-text-subtle)", textTransform: "uppercase" as const, letterSpacing: "0.07em", display: "block", marginBottom: 5 },
  statGrid: { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(min(160px, 100%), 1fr))", gap: 12, marginBottom: 20 },
  statCard: { backgroundColor: "var(--isg-card)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 12, padding: "16px 18px", transition: "border-color 0.2s, transform 0.2s" },
  statValue: { fontSize: 28, fontWeight: 900, lineHeight: 1, marginBottom: 6 },
  statLabel: { fontSize: 12, color: "var(--isg-text-muted)", fontWeight: 600 },
  badge: { display: "inline-flex", alignItems: "center", padding: "3px 8px", borderRadius: 6, fontSize: 11, fontWeight: 700, whiteSpace: "nowrap" as const },
};

// ── Main ──────────────────────────────────────────────────────────────────────
export default function Page() {
  const {
    // Auth / user
    userProfile, isAdmin, isHumanResources,
    activeRole, activeRoleLabel,
    handleSignOut,

    // Plan
    currentPlan,
    planError,
    pdfTodayCount,

    // UI
    mounted, loading, loadError,
    pdfLoading, setPdfLoading,
    darkMode, setDarkMode,
    compactLayout,

    // Navigation
    activeTab, setActiveTab,
    search, setSearch,
    selectedCompanyId, setSelectedCompanyId,
    archiveTypeFilter, setArchiveTypeFilter,
    archiveStatusFilter, setArchiveStatusFilter,
    archiveDateFrom, setArchiveDateFrom,
    archiveDateTo, setArchiveDateTo,
    selectedEmployeeId, setSelectedEmployeeId,
    editingDofId, setEditingDofId,

    // Data
    companies, setCompanies,
    employees,
    documents,
    observers,
    dofs,
    risks,
    annualPlans,
    trainings,
    ppeRecords,
    emergencyPlans,
    committeeMeetings,
    accidentReports,
    companyVisits,
    signers,

    // Derived
    selectedEmployee,
    selectedEmployeeCompany,

    // Filtered lists
    filteredCompanies,
    filteredEmployees,
    filteredDocuments,
    filteredDofs,
    filteredRisks,
    filteredAnnualPlans,
    filteredTrainings,
    filteredPpeRecords,
    filteredEmergencyPlans,
    filteredCommitteeMeetings,
    filteredAccidentReports,
    filteredCompanyVisits,

    // Archive
    archiveItems,
    filteredArchiveItems,
    archiveTypes,
    archiveStatuses,

    // Tasks
    taskItems,
    filteredTaskItems,

    // Dashboard
    roleDashboardTitle,
    roleDashboardSubtitle,
    roleDashboardCards,
    roleQuickActions,
    topDashboardTasks,
    upcomingTrainings,
    openAccidentReports,
    followUpVisits,

    // Form drafts
    newCompany, setNewCompany,
    newEmployee, setNewEmployee,
    newDocument, setNewDocument,
    newObserver, setNewObserver,
    newDof, setNewDof,
    newRisk, setNewRisk,
    newAnnualPlan, setNewAnnualPlan,
    newTraining, setNewTraining,
    newPpe, setNewPpe,
    newEmergencyPlan, setNewEmergencyPlan,
    newCommitteeMeeting, setNewCommitteeMeeting,
    newAccidentReport, setNewAccidentReport,
    newCompanyVisit, setNewCompanyVisit,

    // Status
    dofAdding,
    dofAddStatus, setDofAddStatus,
    employeeAddStatus,

    // Tabs / navigation
    tabs,
    menuGroups,

    // Data loading
    loadAll,

    // Helpers
    getCompanyDocSummary,
    getCompanyIndicator,
    handleImageToBase64,
    printEmployeeCertificate,

    // Handlers (company)
    addCompany, deleteCompany,
    addEmployee, deleteEmployee,
    updateEmployeeChecklist, updateEmployeeTraining,
    addDocument, deleteDocument,
    addObserver, deleteObserver,
    generateDofPDF,
    addDof, deleteDof,
    updateDofStatus, updateDofPhoto, removeDofPhoto,
    createRiskFromDof,
    addRisk, deleteRisk,
    addSigner, deleteSigner,
    addAnnualPlan, updateAnnualPlanStatus, deleteAnnualPlan,
    toggleTrainingParticipant,
    addTraining, updateTrainingStatus, deleteTraining,
    addPpeRecord, updatePpeStatus, deletePpeRecord,
    addEmergencyPlan, updateEmergencyPlanStatus, deleteEmergencyPlan,
    toggleCommitteeParticipant,
    addCommitteeMeeting, updateCommitteeMeetingStatus, deleteCommitteeMeeting,
    addAccidentReport, updateAccidentReportStatus, deleteAccidentReport,
    addCompanyVisit, updateCompanyVisitStatus, deleteCompanyVisit,
  } = usePageState();

  const [lockedModuleNotice, setLockedModuleNotice] = React.useState<string | null>(null);

  function handleTabChange(tab: { id: string; label: string; disabled?: boolean; locked?: boolean }) {
    if (tab.disabled) return;
    setActiveTab(tab.id);
    setSearch("");

    if (tab.locked) {
      setLockedModuleNotice(
        `Paketiniz ${currentPlan.label}. ${tab.label} modülünü kullanmak için paketinizi yükseltin.`
      );
      window.setTimeout(() => setLockedModuleNotice(null), 4500);
      return;
    }

    setLockedModuleNotice(null);
  }

  if (!mounted || loading) {
    return (
      <div style={{ ...styles.app, display: "flex", alignItems: "center", justifyContent: "center", flexDirection: "column", gap: 16 }}>
        <div style={{ fontSize: 32 }}>🦺</div>
        <div style={{ color: "var(--isg-text-muted)", fontSize: 14 }}>Veriler yükleniyor...</div>
      </div>
    );
  }

  return (

    <div style={styles.app} className="isg-app">
      <AppShell
        activeRoleLabel={activeRoleLabel}
        activeTab={activeTab}
        currentPlan={currentPlan}
        darkMode={darkMode}
        isAdmin={isAdmin}
        menuGroups={menuGroups}
        onRefresh={loadAll}
        onSignOut={handleSignOut}
        onTabChange={handleTabChange}
        setDarkMode={setDarkMode}
        tabs={tabs}
      >
        {loadError && (
          <div style={{ backgroundColor: "#dc262615", border: "1px solid #dc262633", borderRadius: 8, color: "#fca5a5", fontSize: 13, marginBottom: 16, padding: "10px 12px" }}>
            {loadError}
          </div>
        )}

        {planError && (
          <div style={{ backgroundColor: "#d9770615", border: "1px solid #d9770633", borderRadius: 8, color: "#fcd34d", fontSize: 13, marginBottom: 16, padding: "10px 14px", display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12 }}>
            <span>{planError}</span>
          </div>
        )}

        {lockedModuleNotice && (
          <LockedModuleNotice
            message={lockedModuleNotice}
            onClose={() => setLockedModuleNotice(null)}
          />
        )}

        {/* Kilitli modül — sadece banner göster, içerik gizlenir */}
        {currentPlan.lockedModules.includes(activeTab) && (
          <div style={{ backgroundColor: "rgba(167,139,250,0.08)", border: "1px solid rgba(167,139,250,0.25)", borderRadius: 12, padding: "40px 24px", textAlign: "center" as const }}>
            <div style={{ fontSize: 48, marginBottom: 16 }}>🔒</div>
            <div style={{ fontWeight: 800, fontSize: 18, marginBottom: 10 }}>Bu modül paket yükseltmesi gerektiriyor</div>
            <div style={{ color: "var(--isg-text-muted)", fontSize: 14, marginBottom: 16, lineHeight: 1.7 }}>
              <strong style={{ color: "var(--isg-text)" }}>{tabs.find(t => t.id === activeTab)?.label}</strong> modülü{" "}
              <strong style={{ color: "#0ea5e9" }}>⭐ Uzman</strong> veya{" "}
              <strong style={{ color: "#a78bfa" }}>🏆 OSGB</strong> paketinde mevcuttur.
              <br />Mevcut paketiniz: <strong style={{ color: currentPlan.color }}>{currentPlan.emoji} {currentPlan.label}</strong>
            </div>
            <div style={{ fontSize: 13, color: "var(--isg-text-subtle)" }}>
              Paketi yükseltmek için yöneticinizle iletişime geçin.
            </div>
          </div>
        )}

        {/* Tüm tab içerikleri — kilitliyse render edilmez */}
        {!currentPlan.lockedModules.includes(activeTab) && activeTab === "ozet" && (
          <OzetTab
            styles={styles}
            roleDashboardTitle={roleDashboardTitle}
            roleDashboardSubtitle={roleDashboardSubtitle}
            roleDashboardCards={roleDashboardCards}
            roleQuickActions={roleQuickActions}
            topDashboardTasks={topDashboardTasks}
            upcomingTrainings={upcomingTrainings}
            openAccidentReports={openAccidentReports}
            followUpVisits={followUpVisits}
            archiveItems={archiveItems}
            companies={companies}
            employees={employees}
            getCompanyIndicator={getCompanyIndicator}
            getCompanyDocSummary={getCompanyDocSummary}
            setActiveTab={setActiveTab}
          />
        )}

        {!currentPlan.lockedModules.includes(activeTab) && activeTab === "gorevler" && (
          <GorevlerTab
            styles={styles}
            taskItems={taskItems}
            filteredTaskItems={filteredTaskItems}
            companies={companies}
            search={search}
            setSearch={setSearch}
            selectedCompanyId={selectedCompanyId}
            setSelectedCompanyId={setSelectedCompanyId}
            setActiveTab={setActiveTab}
          />
        )}

        {!currentPlan.lockedModules.includes(activeTab) && activeTab === "paketler" && (
          <PaketlerTab
            styles={styles}
            currentPlanId={userProfile?.plan}
            isAdmin={isAdmin}
          />
        )}

        {!currentPlan.lockedModules.includes(activeTab) && activeTab === "firmalar" && (
          <CompaniesTab
            styles={styles}
            isAdmin={isAdmin}
            companies={companies}
            filteredCompanies={filteredCompanies}
            newCompany={newCompany}
            setNewCompany={setNewCompany}
            search={search}
            setSearch={setSearch}
            addCompany={addCompany}
            deleteCompany={deleteCompany}
            getCompanyIndicator={getCompanyIndicator}
          />
        )}

        {!currentPlan.lockedModules.includes(activeTab) && activeTab === "personel" && (
          <div style={{ display: "grid", gridTemplateColumns: selectedEmployee && !compactLayout ? "minmax(0, 1fr) minmax(380px, 420px)" : "minmax(0, 1fr)", gap: 20, minWidth: 0, alignItems: "start" }}>
            <EmployeeForm
              styles={styles}
              companies={companies}
              newEmployee={newEmployee}
              setNewEmployee={setNewEmployee}
              compactLayout={compactLayout}
              employeeAddStatus={employeeAddStatus}
              addEmployee={addEmployee}
              handleImageToBase64={handleImageToBase64}
            />
            <EmployeeTable
              styles={styles}
              companies={companies}
              filteredEmployees={filteredEmployees}
              search={search}
              setSearch={setSearch}
              selectedCompanyId={selectedCompanyId}
              setSelectedCompanyId={setSelectedCompanyId}
              selectedEmployeeId={selectedEmployeeId}
              setSelectedEmployeeId={setSelectedEmployeeId}
              deleteEmployee={deleteEmployee}
            />
            {selectedEmployee && (
              <EmployeeDetailPanel
                styles={styles}
                selectedEmployee={selectedEmployee}
                selectedEmployeeCompany={selectedEmployeeCompany}
                updateEmployeeChecklist={updateEmployeeChecklist}
                updateEmployeeTraining={updateEmployeeTraining}
                printEmployeeCertificate={printEmployeeCertificate}
              />
            )}
          </div>
        )}

        {!currentPlan.lockedModules.includes(activeTab) && activeTab === "belgeler" && (
          <DocumentsTab
            styles={styles}
            companies={companies}
            employees={employees}
            filteredDocuments={filteredDocuments}
            newDocument={newDocument}
            setNewDocument={setNewDocument}
            search={search}
            setSearch={setSearch}
            selectedCompanyId={selectedCompanyId}
            setSelectedCompanyId={setSelectedCompanyId}
            addDocument={addDocument}
            deleteDocument={deleteDocument}
          />
        )}

        {!currentPlan.lockedModules.includes(activeTab) && activeTab === "gozlemciler" && (
          <ObserversTab
            styles={styles}
            observers={observers}
            newObserver={newObserver}
            setNewObserver={setNewObserver}
            addObserver={addObserver}
            deleteObserver={deleteObserver}
          />
        )}

        {!currentPlan.lockedModules.includes(activeTab) && activeTab === "dof" && (
          <DofTab
            styles={styles}
            companies={companies}
            observers={observers}
            employees={employees}
            filteredDofs={filteredDofs}
            risks={risks}
            newDof={newDof}
            setNewDof={setNewDof}
            dofAdding={dofAdding}
            dofAddStatus={dofAddStatus}
            setDofAddStatus={setDofAddStatus}
            search={search}
            setSearch={setSearch}
            selectedCompanyId={selectedCompanyId}
            setSelectedCompanyId={setSelectedCompanyId}
            editingDofId={editingDofId}
            setEditingDofId={setEditingDofId}
            addDof={addDof}
            updateDofStatus={updateDofStatus}
            updateDofPhoto={updateDofPhoto}
            removeDofPhoto={removeDofPhoto}
            createRiskFromDof={createRiskFromDof}
            generateDofPDF={generateDofPDF}
            deleteDof={deleteDof}
            handleImageToBase64={handleImageToBase64}
          />
        )}

        {!currentPlan.lockedModules.includes(activeTab) && activeTab === "risk" && (
          <RiskTab
            styles={styles}
            companies={companies}
            dofs={dofs}
            risks={risks}
            signers={signers}
            filteredRisks={filteredRisks}
            newRisk={newRisk}
            setNewRisk={setNewRisk}
            pdfLoading={pdfLoading}
            setPdfLoading={setPdfLoading}
            search={search}
            setSearch={setSearch}
            selectedCompanyId={selectedCompanyId}
            setSelectedCompanyId={setSelectedCompanyId}
            addRisk={addRisk}
            deleteRisk={deleteRisk}
            setActiveTab={setActiveTab}
          />
        )}

        {!currentPlan.lockedModules.includes(activeTab) && activeTab === "imzacilar" && (
          <SignersTab
            styles={styles}
            companies={companies}
            signers={signers}
            isAdmin={isAdmin}
            addSigner={addSigner}
            deleteSigner={deleteSigner}
          />
        )}

        {!currentPlan.lockedModules.includes(activeTab) && activeTab === "yillik-planlar" && (
          <AnnualPlansTab
            styles={styles}
            companies={companies}
            filteredAnnualPlans={filteredAnnualPlans}
            newAnnualPlan={newAnnualPlan}
            setNewAnnualPlan={setNewAnnualPlan}
            search={search}
            setSearch={setSearch}
            selectedCompanyId={selectedCompanyId}
            setSelectedCompanyId={setSelectedCompanyId}
            addAnnualPlan={addAnnualPlan}
            updateAnnualPlanStatus={updateAnnualPlanStatus}
            deleteAnnualPlan={deleteAnnualPlan}
          />
        )}

        {!currentPlan.lockedModules.includes(activeTab) && activeTab === "egitimler" && (
          <TrainingsTab
            styles={styles}
            companies={companies}
            employees={employees}
            filteredTrainings={filteredTrainings}
            newTraining={newTraining}
            setNewTraining={setNewTraining}
            search={search}
            setSearch={setSearch}
            selectedCompanyId={selectedCompanyId}
            setSelectedCompanyId={setSelectedCompanyId}
            toggleTrainingParticipant={toggleTrainingParticipant}
            addTraining={addTraining}
            updateTrainingStatus={updateTrainingStatus}
            deleteTraining={deleteTraining}
          />
        )}

        {!currentPlan.lockedModules.includes(activeTab) && activeTab === "kkd-formu" && (
          <PpeTab
            styles={styles}
            companies={companies}
            employees={employees}
            filteredPpeRecords={filteredPpeRecords}
            newPpe={newPpe}
            setNewPpe={setNewPpe}
            search={search}
            setSearch={setSearch}
            selectedCompanyId={selectedCompanyId}
            setSelectedCompanyId={setSelectedCompanyId}
            addPpeRecord={addPpeRecord}
            updatePpeStatus={updatePpeStatus}
            deletePpeRecord={deletePpeRecord}
          />
        )}

        {!currentPlan.lockedModules.includes(activeTab) && activeTab === "acil-durum-plani" && (
          <EmergencyPlansTab
            styles={styles}
            companies={companies}
            employees={employees}
            filteredEmergencyPlans={filteredEmergencyPlans}
            newEmergencyPlan={newEmergencyPlan}
            setNewEmergencyPlan={setNewEmergencyPlan}
            search={search}
            setSearch={setSearch}
            selectedCompanyId={selectedCompanyId}
            setSelectedCompanyId={setSelectedCompanyId}
            addEmergencyPlan={addEmergencyPlan}
            updateEmergencyPlanStatus={updateEmergencyPlanStatus}
            deleteEmergencyPlan={deleteEmergencyPlan}
          />
        )}

        {!currentPlan.lockedModules.includes(activeTab) && activeTab === "kurul-toplantisi" && (
          <CommitteeMeetingsTab
            styles={styles}
            companies={companies}
            employees={employees}
            filteredCommitteeMeetings={filteredCommitteeMeetings}
            newCommitteeMeeting={newCommitteeMeeting}
            setNewCommitteeMeeting={setNewCommitteeMeeting}
            search={search}
            setSearch={setSearch}
            selectedCompanyId={selectedCompanyId}
            setSelectedCompanyId={setSelectedCompanyId}
            toggleCommitteeParticipant={toggleCommitteeParticipant}
            addCommitteeMeeting={addCommitteeMeeting}
            updateCommitteeMeetingStatus={updateCommitteeMeetingStatus}
            deleteCommitteeMeeting={deleteCommitteeMeeting}
          />
        )}

        {!currentPlan.lockedModules.includes(activeTab) && activeTab === "is-kazasi-raporu" && (
          <AccidentReportsTab
            styles={styles}
            companies={companies}
            employees={employees}
            filteredAccidentReports={filteredAccidentReports}
            newAccidentReport={newAccidentReport}
            setNewAccidentReport={setNewAccidentReport}
            search={search}
            setSearch={setSearch}
            selectedCompanyId={selectedCompanyId}
            setSelectedCompanyId={setSelectedCompanyId}
            addAccidentReport={addAccidentReport}
            updateAccidentReportStatus={updateAccidentReportStatus}
            deleteAccidentReport={deleteAccidentReport}
          />
        )}

        {!currentPlan.lockedModules.includes(activeTab) && activeTab === "firma-ziyaretleri" && (
          <CompanyVisitsTab
            styles={styles}
            companies={companies}
            filteredCompanyVisits={filteredCompanyVisits}
            newCompanyVisit={newCompanyVisit}
            setNewCompanyVisit={setNewCompanyVisit}
            search={search}
            setSearch={setSearch}
            selectedCompanyId={selectedCompanyId}
            setSelectedCompanyId={setSelectedCompanyId}
            addCompanyVisit={addCompanyVisit}
            updateCompanyVisitStatus={updateCompanyVisitStatus}
            deleteCompanyVisit={deleteCompanyVisit}
          />
        )}

        {!currentPlan.lockedModules.includes(activeTab) && activeTab === "arsiv" && (
          <ArchiveTab
            styles={styles}
            companies={companies}
            archiveItems={archiveItems}
            filteredArchiveItems={filteredArchiveItems}
            archiveTypes={archiveTypes}
            archiveStatuses={archiveStatuses}
            archiveTypeFilter={archiveTypeFilter}
            setArchiveTypeFilter={setArchiveTypeFilter}
            archiveStatusFilter={archiveStatusFilter}
            setArchiveStatusFilter={setArchiveStatusFilter}
            archiveDateFrom={archiveDateFrom}
            setArchiveDateFrom={setArchiveDateFrom}
            archiveDateTo={archiveDateTo}
            setArchiveDateTo={setArchiveDateTo}
            documentsCount={documents.length}
            plansAndTrainingsCount={trainings.length + annualPlans.length}
            riskDofAccidentCount={accidentReports.length + risks.length + dofs.length}
            search={search}
            setSearch={setSearch}
            selectedCompanyId={selectedCompanyId}
            setSelectedCompanyId={setSelectedCompanyId}
            setActiveTab={setActiveTab}
          />
        )}

        {!currentPlan.lockedModules.includes(activeTab) && activeTab === "ek2muayene" && (
          <Ek2MuayeneFormu
            styles={styles}
            companies={companies}
            employees={employees}
            userRole={userProfile?.activeRole || userProfile?.role || ""}
            userId={userProfile?.uid || ""}
          />
        )}

        {!currentPlan.lockedModules.includes(activeTab) && activeTab === "nace-sorgula" && (
          <NaceLookupTab
            styles={styles}
            compactLayout={compactLayout}
            isAdmin={isAdmin}
            onApplyToCompany={(code, dangerClass) => {
              setNewCompany({ ...newCompany, naceCode: code, dangerClass });
              setActiveTab("firmalar");
            }}
          />
        )}

        {!currentPlan.lockedModules.includes(activeTab) && activeTab === "myk-sorgula" && (
          <MykLookupTab
            styles={styles}
            compactLayout={compactLayout}
            companies={companies}
            employees={employees}
            onOpenEmployee={(employeeId) => {
              setSelectedEmployeeId(employeeId);
              setActiveTab("personel");
            }}
          />
        )}

        {activeTab === "kullanicilar" && isAdmin && (
          <AdminUserPanel
            styles={styles}
            companies={companies}
            onCompanyCreated={(company) => setCompanies(prev => [...prev, company])}
          />
        )}

        {/* Vardiya ve Ayarlar sekmeleri kaldırıldı */}

      </AppShell>
    </div>

  );
}
