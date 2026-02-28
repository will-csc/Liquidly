# Frontend Mobile Structure (React Native + Expo)

This document explains the folder organization within `frontend-mobile/src`.

## `src/assets`
- **What it is:** Folder for app static files.
- **Importance:** Stores images (png, jpg), icons, and custom fonts used in the application.
- **Example:** App icon, splash screen images.

## `src/components`
- **What it is:** Reusable visual components.
- **Importance:** Pieces of mobile interface used on multiple screens (custom buttons, cards, inputs). Maintains consistent design.
- **Example:** `CustomButton.js`, `InputField.js`.

## `src/screens`
- **What it is:** The application screens.
- **Importance:** Equivalent to web `pages`. Each file is a complete screen the user navigates to.
- **Example:** `LoginScreen.js`, `HomeScreen.js`, `ProfileScreen.js`.

## `src/navigation`
- **What it is:** Routes and navigation configuration.
- **Importance:** Defines how the user transitions between screens (Stack, Tab, Drawer). Manages app navigation history.
- **Example:** `AppNavigator.js`, `TabNavigator.js`.

## `src/services`
- **What it is:** API communication.
- **Importance:** Centralizes calls to the Spring Boot backend. Allows the app to fetch and send data.
- **Example:** `api.js` (Axios configuration).

## `src/styles`
- **What it is:** Global styles and themes.
- **Importance:** Defines default colors, typography, and common styles to ensure visual identity throughout the app.
- **Example:** `colors.js`, `fonts.js`, `globalStyles.js`.

## `src/utils`
- **What it is:** Helper functions.
- **Importance:** Logical helper functions (formatters, validators) to avoid cluttering screen code.
- **Example:** `formatCurrency.js`, `dateHelpers.js`.
