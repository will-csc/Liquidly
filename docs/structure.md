# Project Structure

This document consolidates the structure references for backend, web, mobile, and auxiliary services.

## Backend API Structure (Java Spring Boot)

This section explains the package organization within `backend-api/src/main/java/com/liquidly/api`.

### `controller`
- **What it is:** The API entry point (Control Layer).
- **Importance:** Receives HTTP requests (GET, POST, PUT, DELETE) from the frontend, calls the appropriate `service`, and returns the response (JSON). It defines your API URLs.
- **Example:** `UserController.java` (defines `/api/users`), `ProjectController.java`.

### `service`
- **What it is:** The business logic (The "brain" of the system).
- **Importance:** Contains the system rules. This is where you validate data, perform calculations, and decide what to do before saving to the database. The Controller calls the Service.
- **Example:** `UserService.java` (rule to create user), `ProjectService.java`.

### `repository`
- **What it is:** Database access (Data Layer).
- **Importance:** Interfaces that communicate directly with PostgreSQL. They use JPA/Hibernate to perform SQL queries automatically without you needing to write SQL manually for everything.
- **Example:** `UserRepository.java`, `ProjectRepository.java`.

### `model`
- **What it is:** The database entities.
- **Importance:** Java classes that represent your SQL database tables. Each attribute of the class becomes a column in the table.
- **Example:** `User.java` (`users` table), `Project.java` (`projects` table).

### `dto` (Data Transfer Object)
- **What it is:** Objects for data transfer.
- **Importance:** Defines what data enters and leaves the API. Used to hide sensitive data (like passwords) when sending responses to the frontend, or to receive specific data in forms.
- **Example:** `UserDTO.java` (returns user without password).

### `exception`
- **What it is:** Centralized error handling.
- **Importance:** Captures errors that happen anywhere in the system and transforms them into friendly messages for the frontend, preventing the API from "breaking" or showing ugly errors.
- **Example:** `GlobalExceptionHandler.java`.

## Frontend Web Structure (React + TypeScript)

This section explains the folder organization within `frontend-web/src` as it exists in this repository.

The web frontend is a Vite + React + TypeScript project, with Tailwind CSS and a small set of reusable UI primitives.

### Import Alias

This project uses an alias for imports:

- `@/` → `frontend-web/src/`

Example:

- `import { Button } from "@/components/ui/button";`

### `src/assets`
- **What it is:** Folder for static files.
- **Importance:** Contains images, icons, fonts, and other files that are not code but are used in the interface.
- **Example:** `assets/images/logo-green.png`, `assets/icons/home.svg`.

### `src/components`
- **What it is:** Reusable React components that are used across pages.
- **Importance:** Keeps pages clean and prevents duplication by extracting UI blocks into components.
- **Examples:**
  - `HomeDashboard.tsx` (dashboard content/cards/charts)
  - `ProjectsTable.tsx`, `BomTable.tsx`, `ConversionsTable.tsx` (CRUD tables + import)
  - `ControlPanelNav.tsx` (top navigation bar shared by dashboard pages)
  - `ReportsForm.tsx` (reports form UI + actions)

#### `src/components/ui`
- **What it is:** Low-level UI primitives (design-system-like components).
- **Importance:** Used as building blocks by app components and pages, enforcing consistency.
- **Examples:** `ui/button.tsx`, `ui/input.tsx`, `ui/SafeIcon.tsx`.

### `src/pages`
- **What it is:** Folder for complete application pages.
- **Importance:** Each file here represents a route-level screen. Pages usually compose components from `src/components`.
- **Examples:** `DashboardPage.tsx`, `ProjectsPage.tsx`, `BomPage.tsx`, `ReportPage.tsx`, `ConversionsPage.tsx`.

### `src/routes`
- **What it is:** Navigation configuration.
- **Importance:** Defines which routes render which pages (React Router).
- **Example:** `routes/AppRoutes.tsx`.

### `src/services`
- **What it is:** Communication logic with the Backend.
- **Importance:** Contains the functions that call your Java API (Spring Boot). Centralizes HTTP calls (GET, POST) to facilitate maintenance.
- **Examples:**
  - `services/api.ts` (Axios instance + API services)
  - `services/loadingBus.ts` (global loading state/events used by the UI)

### `src/styles`
- **What it is:** Style files (CSS/SASS).
- **Importance:** Defines the visual appearance of the site (colors, fonts, spacing). Separating CSS from React code keeps the project more organized.
- **Examples:** `styles/index.css`, `styles/LoginPage.css`.

### `src/utils`
- **What it is:** Utility and helper functions.
- **Importance:** Logical functions that are not components (date formatting, CPF/CNPJ validation, calculations). Can be used anywhere in the project.
- **Examples:** `utils/validation.ts`.

### `src/hooks`
- **What it is:** Custom React hooks.
- **Importance:** Complex state logic that can be reused between components (e.g., hook to manage forms or authentication).
- **Examples:** `hooks/useForm.ts`.

### `src/types`
- **What it is:** TypeScript type definitions.
- **Importance:** Defines the data format (Interfaces) used in the project, ensuring safety and autocomplete in the code.
- **Examples:** `types/index.ts` (interfaces that mirror the backend models/DTOs).

### `src/i18n`
- **What it is:** Internationalization (translations + provider).
- **Importance:** Central place for language switching and translation strings used by the UI.
- **Examples:** `i18n/I18nProvider.tsx`, `i18n/translations.ts`.

### `src/lib`
- **What it is:** Shared libraries/helpers that are not React-specific.
- **Importance:** Used by components/services for formatting, class merging, Excel parsing, etc.
- **Examples:** `lib/utils.ts`, `lib/excel.ts`.

### `src/providers`
- **What it is:** App-level React providers (context wrappers).
- **Importance:** Global UI state (like loading) lives here and is composed at the app entrypoint.
- **Example:** `providers/LoadingProvider.tsx`.

### Entry Points
- `main.tsx`: Boots the React app and mounts it into the DOM.
- `App.tsx`: Root component (usually providers + routes).

## Frontend Mobile Structure (React Native + Expo)

This section explains the folder organization within `frontend-mobile/src`.

### `src/assets`
- **What it is:** Folder for app static files.
- **Importance:** Stores images (png, jpg), icons, and custom fonts used in the application.
- **Example:** App icon, splash screen images.

### `src/components`
- **What it is:** Reusable visual components.
- **Importance:** Pieces of mobile interface used on multiple screens (buttons, cards, inputs). Maintains consistent design.
- **Example:** common UI components used by multiple screens.

### `src/screens`
- **What it is:** The application screens.
- **Importance:** Equivalent to web `pages`. Each file is a complete screen the user navigates to.
- **Example:** login/home/profile screens.

### `src/navigation`
- **What it is:** Routes and navigation configuration.
- **Importance:** Defines how the user transitions between screens (Stack, Tab, Drawer). Manages app navigation history.
- **Example:** `AppNavigator.tsx`.

### `src/services`
- **What it is:** API communication.
- **Importance:** Centralizes calls to the backend and related local helpers (storage, etc.).
- **Example:** `api.ts` (Axios configuration and services).

### `src/styles`
- **What it is:** Global styles and themes.
- **Importance:** Defines default colors, typography, and common styles to ensure visual identity throughout the app.
- **Example:** colors/fonts/global styles modules.

### `src/utils`
- **What it is:** Helper functions.
- **Importance:** Logical helper functions (formatters, validators) to avoid cluttering screen code.
- **Example:** formatters/validators.

## Services Structure (Auxiliary Microservices)

This section explains the organization of auxiliary services in the `services` folder.

### `email-service` (Python Flask)

This is an isolated microservice responsible for sending emails.

#### Main Files

- **`app.py`**:
  - **What it is:** The main Python server code.
  - **Importance:** Starts a web server (Flask) that listens for requests on the `/send-email` route. When it receives a request, it connects to the SMTP server and sends the email.
- **`requirements.txt`**:
  - **What it is:** List of dependencies.
  - **Importance:** Tells Python which libraries to install (`Flask`, `python-dotenv`) for the code to work.
- **`.env`**:
  - **What it is:** Environment variables.
  - **Importance:** Stores passwords and sensitive configuration that should not be written directly in the code for security.
