# Frontend Web Structure (React + TypeScript)

This document explains the folder organization within `frontend-web/src` as it exists in this repository.

The web frontend is a Vite + React + TypeScript project, with Tailwind CSS and a small set of reusable UI primitives.

## Import Alias

This project uses an alias for imports:

- `@/` → `frontend-web/src/`

Example:

- `import { Button } from "@/components/ui/button";`

## `src/assets`
- **What it is:** Folder for static files.
- **Importance:** Contains images, icons, fonts, and other files that are not code but are used in the interface.
- **Example:** `assets/images/logo-green.png`, `assets/icons/home.svg`.

## `src/components`
- **What it is:** Reusable React components that are used across pages.
- **Importance:** Keeps pages clean and prevents duplication by extracting UI blocks into components.
- **Examples:**
  - `HomeDashboard.tsx` (dashboard content/cards/charts)
  - `ProjectsTable.tsx`, `BomTable.tsx`, `ConversionsTable.tsx` (CRUD tables + import)
  - `ControlPanelNav.tsx` (top navigation bar shared by dashboard pages)
  - `ReportsForm.tsx` (reports form UI + actions)

### `src/components/ui`
- **What it is:** Low-level UI primitives (design-system-like components).
- **Importance:** Used as building blocks by app components and pages, enforcing consistency.
- **Examples:** `ui/button.tsx`, `ui/input.tsx`, `ui/SafeIcon.tsx`.

## `src/pages`
- **What it is:** Folder for complete application pages.
- **Importance:** Each file here represents a route-level screen. Pages usually compose components from `src/components`.
- **Examples:** `DashboardPage.tsx`, `ProjectsPage.tsx`, `BomPage.tsx`, `ReportPage.tsx`, `ConversionsPage.tsx`.

## `src/routes`
- **What it is:** Navigation configuration.
- **Importance:** Defines which routes render which pages (React Router).
- **Example:** `routes/AppRoutes.tsx`.

## `src/services`
- **What it is:** Communication logic with the Backend.
- **Importance:** Contains the functions that call your Java API (Spring Boot). Centralizes HTTP calls (GET, POST) to facilitate maintenance.
- **Examples:**
  - `services/api.ts` (Axios instance + API services)
  - `services/loadingBus.ts` (global loading state/events used by the UI)

## `src/styles`
- **What it is:** Style files (CSS/SASS).
- **Importance:** Defines the visual appearance of the site (colors, fonts, spacing). Separating CSS from React code keeps the project more organized.
- **Examples:** `styles/index.css`, `styles/LoginPage.css`.

## `src/utils`
- **What it is:** Utility and helper functions.
- **Importance:** Logical functions that are not components (date formatting, CPF/CNPJ validation, calculations). Can be used anywhere in the project.
- **Examples:** `utils/validation.ts`.

## `src/hooks`
- **What it is:** Custom React hooks.
- **Importance:** Complex state logic that can be reused between components (e.g., hook to manage forms or authentication).
- **Examples:** `hooks/useForm.ts`.

## `src/types`
- **What it is:** TypeScript type definitions.
- **Importance:** Defines the data format (Interfaces) used in the project, ensuring safety and autocomplete in the code.
- **Examples:** `types/index.ts` (interfaces that mirror the backend models/DTOs).

## `src/i18n`
- **What it is:** Internationalization (translations + provider).
- **Importance:** Central place for language switching and translation strings used by the UI.
- **Examples:** `i18n/I18nProvider.tsx`, `i18n/translations.ts`.

## `src/lib`
- **What it is:** Shared libraries/helpers that are not React-specific.
- **Importance:** Used by components/services for formatting, class merging, Excel parsing, etc.
- **Examples:** `lib/utils.ts`, `lib/excel.ts`.

## `src/providers`
- **What it is:** App-level React providers (context wrappers).
- **Importance:** Global UI state (like loading) lives here and is composed at the app entrypoint.
- **Example:** `providers/LoadingProvider.tsx`.

## Entry Points
- `main.tsx`: Boots the React app and mounts it into the DOM.
- `App.tsx`: Root component (usually providers + routes).
