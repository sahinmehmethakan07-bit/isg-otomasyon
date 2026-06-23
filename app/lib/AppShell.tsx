"use client";

import React from "react";

type MenuTab = {
  id: string;
  label: string;
  disabled?: boolean;
  locked?: boolean;
};

type MenuGroup = {
  title: string;
  items: MenuTab[];
};

type PlanBadge = {
  color: string;
  emoji: string;
  label: string;
};

type ViewMode = "mobile" | "web";

type AppShellProps = {
  activeRoleLabel?: string;
  activeTab: string;
  children: React.ReactNode;
  currentPlan: PlanBadge;
  darkMode: boolean;
  isAdmin: boolean;
  menuGroups: MenuGroup[];
  onRefresh: () => void;
  onSignOut: () => void;
  onTabChange: (tab: MenuTab) => void;
  setDarkMode: (value: boolean) => void;
  tabs: MenuTab[];
};

const PRIMARY_TAB_IDS = ["ozet", "gorevler", "firmalar", "personel"];
const VIEW_MODE_STORAGE_KEY = "isg-view-mode";

function getIcon(label: string) {
  return label.split(" ")[0] || "•";
}

function getTitle(label?: string) {
  if (!label) return "İSG Otomasyon";
  const parts = label.trim().split(" ");
  return parts.length > 1 ? parts.slice(1).join(" ") : label;
}

export function AppShell({
  activeRoleLabel,
  activeTab,
  children,
  currentPlan,
  darkMode,
  isAdmin,
  menuGroups,
  onRefresh,
  onSignOut,
  onTabChange,
  setDarkMode,
  tabs,
}: AppShellProps) {
  const [moreOpen, setMoreOpen] = React.useState(false);
  const [moduleSearch, setModuleSearch] = React.useState("");
  const [viewMode, setViewMode] = React.useState<ViewMode>(() => {
    if (typeof window === "undefined") return "mobile";
    const saved = localStorage.getItem(VIEW_MODE_STORAGE_KEY);
    return saved === "mobile" || saved === "web" ? saved : "mobile";
  });

  const flatTabs = React.useMemo(
    () => menuGroups.flatMap(group => group.items),
    [menuGroups]
  );
  const activeItem = flatTabs.find(tab => tab.id === activeTab) || tabs.find(tab => tab.id === activeTab);
  const homeItem = tabs.find(tab => tab.id === "ozet") || tabs.find(tab => tab.id === "firmalar") || tabs[0];
  const primaryItems = PRIMARY_TAB_IDS
    .map(id => tabs.find(tab => tab.id === id))
    .filter((tab): tab is MenuTab => Boolean(tab))
    .slice(0, 4);
  const moreIsActive = !primaryItems.some(tab => tab.id === activeTab);

  const visibleGroups = moduleSearch.trim()
    ? menuGroups
        .map(group => ({
          ...group,
          items: group.items.filter(tab =>
            tab.label.toLowerCase().includes(moduleSearch.toLowerCase())
          ),
        }))
        .filter(group => group.items.length > 0)
    : menuGroups;

  function navigate(tab: MenuTab) {
    if (tab.disabled) return;
    onTabChange(tab);
    setMoreOpen(false);
    setModuleSearch("");
  }

  function changeViewMode(mode: ViewMode) {
    setViewMode(mode);
    localStorage.setItem(VIEW_MODE_STORAGE_KEY, mode);
  }

  return (
    <div className={`isg-app-shell isg-view-${viewMode}`}>
      <header className="isg-app-header">
        <div className="isg-header-left">
          {homeItem && activeTab !== homeItem.id && (
            <button
              type="button"
              className="isg-icon-button isg-back-button"
              aria-label="Özete dön"
              onClick={() => navigate(homeItem)}
            >
              ‹
            </button>
          )}
          <div className="isg-app-logo" aria-hidden="true">🦺</div>
          <div className="isg-title-block">
            <div className="isg-page-title">{getTitle(activeItem?.label)}</div>
            {activeRoleLabel && <div className="isg-page-subtitle">{activeRoleLabel}</div>}
          </div>
        </div>

        <div className="isg-header-actions">
          <div className="isg-view-toggle" aria-label="Görünüm seçimi">
            <button
              type="button"
              className={viewMode === "mobile" ? "is-active" : ""}
              onClick={() => changeViewMode("mobile")}
              aria-pressed={viewMode === "mobile"}
            >
              Mobil
            </button>
            <button
              type="button"
              className={viewMode === "web" ? "is-active" : ""}
              onClick={() => changeViewMode("web")}
              aria-pressed={viewMode === "web"}
            >
              Web
            </button>
          </div>
          <button
            type="button"
            className="isg-icon-button"
            aria-label="Temayı değiştir"
            onClick={() => setDarkMode(!darkMode)}
          >
            {darkMode ? "☀️" : "🌙"}
          </button>
          <button type="button" className="isg-header-button isg-hide-small" onClick={onRefresh}>
            Yenile
          </button>
          <button type="button" className="isg-header-button isg-danger-button isg-hide-small" onClick={onSignOut}>
            Çıkış
          </button>
        </div>
      </header>

      {isAdmin ? (
        <div className="isg-plan-strip isg-plan-strip-empty" aria-hidden="true" />
      ) : (
        <div className="isg-plan-strip" style={{ color: currentPlan.color, borderColor: `${currentPlan.color}44` }}>
          <span>{currentPlan.emoji}</span>
          <span>{currentPlan.label}</span>
        </div>
      )}

      <div className="isg-app-body">
        <aside className="isg-web-sidebar" aria-label="Modül menüsü">
          <div className="isg-web-sidebar-search">
            <span aria-hidden="true">⌕</span>
            <input
              value={moduleSearch}
              onChange={event => setModuleSearch(event.target.value)}
              placeholder="Modül ara..."
              type="search"
            />
            {moduleSearch && (
              <button type="button" onClick={() => setModuleSearch("")} aria-label="Aramayı temizle">
                ✕
              </button>
            )}
          </div>
          <div className="isg-web-sidebar-groups">
            {visibleGroups.map(group => (
              <div key={group.title} className="isg-web-sidebar-group">
                <div className="isg-web-sidebar-title">{group.title}</div>
                <div className="isg-web-sidebar-items">
                  {group.items.map(tab => {
                    const active = tab.id === activeTab;
                    return (
                      <button
                        key={tab.id}
                        type="button"
                        disabled={tab.disabled}
                        className={`isg-web-sidebar-item${active ? " is-active" : ""}`}
                        onClick={() => navigate(tab)}
                      >
                        <span>{tab.label}</span>
                        {tab.locked && <span className="isg-web-sidebar-badge">Kilitli</span>}
                        {tab.disabled && <span className="isg-web-sidebar-badge">Yakında</span>}
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </aside>

        <main className="isg-content-scroll">
          <div className="isg-content-inner">{children}</div>
        </main>
      </div>

      {moreOpen && (
        <div className="isg-more-backdrop" onClick={() => setMoreOpen(false)}>
          <section className="isg-more-sheet" onClick={event => event.stopPropagation()} aria-label="Modül seçici">
            <div className="isg-more-grabber" />
            <div className="isg-more-header">
              <div>
                <div className="isg-more-title">Modüller</div>
                <div className="isg-more-subtitle">Dokunarak görünümler arasında geçiş yap</div>
              </div>
              <button type="button" className="isg-icon-button" onClick={() => setMoreOpen(false)} aria-label="Kapat">
                ✕
              </button>
            </div>
            <input
              className="isg-module-search"
              value={moduleSearch}
              onChange={event => setModuleSearch(event.target.value)}
              placeholder="Modül ara..."
              type="search"
            />
            <div className="isg-more-actions">
              <div className="isg-view-toggle isg-view-toggle-sheet" aria-label="Görünüm seçimi">
                <button
                  type="button"
                  className={viewMode === "mobile" ? "is-active" : ""}
                  onClick={() => changeViewMode("mobile")}
                  aria-pressed={viewMode === "mobile"}
                >
                  Mobil
                </button>
                <button
                  type="button"
                  className={viewMode === "web" ? "is-active" : ""}
                  onClick={() => changeViewMode("web")}
                  aria-pressed={viewMode === "web"}
                >
                  Web
                </button>
              </div>
              <button type="button" className="isg-header-button" onClick={onRefresh}>Yenile</button>
              <button type="button" className="isg-header-button isg-danger-button" onClick={onSignOut}>Çıkış</button>
            </div>
            <div className="isg-more-list">
              {visibleGroups.map(group => (
                <div key={group.title} className="isg-more-group">
                  <div className="isg-more-group-title">{group.title}</div>
                  {group.items.map(tab => {
                    const active = tab.id === activeTab;
                    return (
                      <button
                        key={tab.id}
                        type="button"
                        disabled={tab.disabled}
                        className={`isg-more-item${active ? " is-active" : ""}`}
                        onClick={() => navigate(tab)}
                      >
                        <span>{tab.label}</span>
                        {tab.locked && <span className="isg-lock-badge">Kilitli</span>}
                        {tab.disabled && <span className="isg-lock-badge">Yakında</span>}
                      </button>
                    );
                  })}
                </div>
              ))}
            </div>
          </section>
        </div>
      )}

      <nav className="isg-bottom-nav" aria-label="Ana gezinme">
        {primaryItems.map(tab => {
          const active = tab.id === activeTab;
          return (
            <button
              key={tab.id}
              type="button"
              className={`isg-bottom-nav-item${active ? " is-active" : ""}`}
              onClick={() => navigate(tab)}
            >
              <span className="isg-bottom-icon">{getIcon(tab.label)}</span>
              <span>{getTitle(tab.label)}</span>
            </button>
          );
        })}
        <button
          type="button"
          className={`isg-bottom-nav-item${moreOpen || moreIsActive ? " is-active" : ""}`}
          onClick={() => setMoreOpen(open => !open)}
          aria-expanded={moreOpen}
        >
          <span className="isg-bottom-icon">☰</span>
          <span>Diğer</span>
        </button>
      </nav>
    </div>
  );
}
