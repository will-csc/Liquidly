# Frontend Web Structure (React + TypeScript)

This document explains the folder organization within `frontend-web/src`.

## `src/assets`
- **What it is:** Folder for static files.
- **Importance:** Contains images, icons, fonts, and other files that are not code but are used in the interface.
- **Example:** Logos (`react.svg`), social media icons, background images.

## `src/components`
- **What it is:** Folder for reusable components.
- **Importance:** Here reside pieces of interface that are used in multiple places (buttons, inputs, headers, footers). This avoids code repetition.
- **Example:** `Button.tsx`, `Header.tsx`, `Sidebar.tsx`.

## `src/pages`
- **What it is:** Folder for complete application pages.
- **Importance:** Each file here represents a whole screen the user sees (Home, Login, Dashboard). They assemble the screen using components from `src/components`.
- **Example:** `Home.tsx`, `Login.tsx`, `Dashboard.tsx`.

## `src/routes`
- **What it is:** Navigation configuration.
- **Importance:** Defines which URLs open which pages (e.g., `/login` opens the Login page). Essential for user navigation.
- **Example:** `AppRoutes.tsx`.

## `src/services`
- **What it is:** Communication logic with the Backend.
- **Importance:** Contains the functions that call your Java API (Spring Boot). Centralizes HTTP calls (GET, POST) to facilitate maintenance.
- **Example:** `api.ts` (Axios configuration and request functions).

## `src/styles`
- **What it is:** Style files (CSS/SASS).
- **Importance:** Defines the visual appearance of the site (colors, fonts, spacing). Separating CSS from React code keeps the project more organized.
- **Example:** `App.css`, `index.css`, `global.css`.

## `src/utils`
- **What it is:** Utility and helper functions.
- **Importance:** Logical functions that are not components (date formatting, CPF/CNPJ validation, calculations). Can be used anywhere in the project.
- **Example:** `formatDate.ts`, `validateEmail.ts`.

## `src/hooks`
- **What it is:** Custom React hooks.
- **Importance:** Complex state logic that can be reused between components (e.g., hook to manage forms or authentication).
- **Example:** `useAuth.ts`, `useFetch.ts`.

## `src/types`
- **What it is:** TypeScript type definitions.
- **Importance:** Defines the data format (Interfaces) used in the project, ensuring safety and autocomplete in the code.
- **Example:** `User.ts`, `Project.ts` (interfaces that mirror your Java Models).
