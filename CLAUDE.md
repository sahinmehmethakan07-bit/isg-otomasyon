# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

@AGENTS.md

## Commands

```bash
npm run dev      # Start dev server at localhost:3000
npm run build    # Production build (run before deploying)
npm run lint     # ESLint check
npm run start    # Start production server (after build)
```

There are no automated tests. Verify changes manually via `npm run dev`.

## Architecture

**İSG Otomasyon** is a Turkish OHS (İş Sağlığı ve Güvenliği) management system built as a Next.js 16 App Router app with Firebase Firestore as the only database.

### Auth & Roles

- Firebase Auth handles login (`app/login/page.tsx`)
- After login, `app/lib/roleManager.ts` fetches the user's Firestore `users/{uid}` doc which contains `role`, `roles[]`, `companyIds[]`
- **Admin** sees all companies and all data. **All other roles** (`doctor`, `nurse`, `safety_expert`, `human_resources`) see only records belonging to their `companyIds`
- `app/lib/useUserRole.ts` is the hook that provides `userProfile` to the main page

### Single-Page App Pattern

`app/page.tsx` is the entire authenticated app — one large client component that renders different tab content based on `activeTab` state. Tabs map to modules: firmalar, çalışanlar, döf, risk, eğitimler, ppe, acil durum, toplantılar, kaza raporları, ziyaretler, belgeler, arşiv, yıllık plan, iş talimatları, MYK/NACE arama, kullanıcılar (admin only).

### `app/lib/` — all business logic lives here

| Pattern | Files |
|---|---|
| Tab UI components | `*Tab.tsx`, `EmployeeTable.tsx`, `EmployeeDetailPanel.tsx`, etc. |
| Firestore write services | `companyService.ts`, `employeeService.ts`, `dofRiskService.ts`, `recordService.ts`, `moduleRecordService.ts` |
| Firestore read/filter | `dashboardSelectors.ts`, `dashboardOverview.ts` |
| Utility/formatting | `dashboardUtils.ts`, `constants.ts` |
| PDF generation | `pdf.ts` (risk PDF), `dofPdf.ts` (DÖF PDF), `ek2PdfGenerator.ts` (Ek-2 form) — uses jspdf + pdfmake |
| Types | `types.ts` — single source of truth for all domain types |
| i18n | `i18n.ts` + `LanguageSwitcher.tsx` (TR/EN) |
| Role management | `roleManager.ts` |

### `lib/` (root-level)

- `lib/firebase.ts` — client-side Firebase init (used by `app/page.tsx` and tab components)
- `lib/notoSansFont.ts` — base64 font for PDF generation

### API Routes (`app/api/`)

Server-side only, use `firebase-admin` (via `app/lib/firebaseAdmin.ts`):
- `send-dof-email` — sends email notification on new DÖF
- `send-onboarding-notification` — employee onboarding reminders
- `send-test-email` — email config test
- `admin/` — admin user management endpoints

### Styling

Components use an inline `styles` object (`Record<string, React.CSSProperties>`) defined at the top of each file. CSS variables (`--isg-bg`, `--isg-text`, etc.) handle dark/light mode and are defined in `app/globals.css`. Tailwind is available but used sparingly.

### Data Flow

1. `app/page.tsx` loads all Firestore collections on mount via `loadAll()`
2. Role-scoped loading: non-admin users trigger `loadCompanyScopedRecords()` which queries by `companyId in [...]`
3. All state lives in `Page()` and is passed down as props to tab components
4. Tab components call handler functions (also defined in `Page()`) passed as props — no context, no global state manager
