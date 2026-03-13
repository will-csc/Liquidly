# How to Run the Mobile Frontend Locally (Expo + React Native)

This guide explains how to run the Liquidly mobile app on your machine using Expo.

## Prerequisites

- Node.js 18+ (recommended)
- npm (or another package manager, but the commands below use npm)
- Expo CLI (no need to install globally; you can use `npx`)
- One of the environments below:
  - Android Studio (Android Emulator) or
  - Xcode (iOS Simulator, on macOS) or
  - A phone with Expo Go (Android/iOS)
- Backend running (optional, but recommended to test integrations)

## Project Location

- Mobile frontend folder: `frontend-mobile`

## API Configuration (Important)

The mobile app tries to use the production API and falls back to a local API if it cannot connect.

- Production: `https://backend-api.onrender.com`
- Local (fallback):
  - Android (emulator): `http://10.0.2.2:8080`
  - iOS and Web: `http://localhost:8080`

Note: `localhost` on a physical phone does not point to your computer. To use a local backend on a phone, you must expose the backend on your network (e.g., `http://YOUR_IP:8080`) and adjust the local URL in the app code.

## Install Dependencies

From the repository root:

```bash
cd frontend-mobile
npm install
```

## Run the App

Start Expo:

```bash
cd frontend-mobile
npm run start
```

Then choose one of the options:

- Android (emulator): press `a` in the Expo terminal or run `npm run android`
- iOS (simulator, macOS): press `i` or run `npm run ios`
- Phone (Expo Go): scan the QR code with the Expo Go app

## Quick Smoke Test

1. Open the app and navigate to a screen that fetches data (e.g., lists/reports).
2. If the local backend is running, it should be at `http://localhost:8080` (or `http://10.0.2.2:8080` on the Android emulator).
3. If the production API is unavailable, the app will try to fall back automatically to the local URL.

## Common Issues

### Android Emulator cannot access `localhost`

On the Android emulator, use `10.0.2.2` to access your computer's `localhost`.

### Physical phone cannot access local backend

- Use the production API, or
- Change the app local URL to `http://YOUR_IP:8080` and make sure:
  - your phone and PC are on the same network
  - Windows Firewall allows incoming connections on port 8080

### Connection errors / Timeout

- Confirm the backend is running and responds at `/api/users` (or another endpoint)
- If using the Android emulator, verify `http://10.0.2.2:8080` opens in the emulator browser
