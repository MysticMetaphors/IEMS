# IEMS

IEMS is a mobile application that lets independent educators (for example, ESL teachers) manage their schedule and students **offline**, without juggling multiple pieces of software.

Built with [Expo](https://expo.dev) (SDK 55), React Native 0.83, Expo Router, NativeWind (Tailwind CSS) and a local SQLite database, so your data stays on the device.

<img width="3184" height="1823" alt="Aquatics (1) 3" src="https://github.com/user-attachments/assets/ad1c85b8-30f2-4860-8c05-e99d5d73f42e" />

---

## Table of Contents

- [Tech Stack](#tech-stack)
- [Prerequisites](#prerequisites)
- [Quick Start](#quick-start)
- [Running on a Device or Emulator](#running-on-a-device-or-emulator)
- [Available Scripts](#available-scripts)
- [Project Structure](#project-structure)
- [Building with EAS](#building-with-eas)
- [Troubleshooting](#troubleshooting)

---

## Tech Stack

| Area | Technology |
| --- | --- |
| Framework | Expo SDK 55, React 19.2, React Native 0.83 |
| Language | TypeScript 5.9 |
| Navigation | Expo Router (file-based routing), React Navigation bottom tabs |
| Styling | NativeWind 4 + Tailwind CSS 3 |
| Local storage | `expo-sqlite` |
| Notifications | `expo-notifications`, `expo-background-task`, `expo-task-manager` |
| Animations | `react-native-reanimated`, `react-native-gesture-handler` |
| Builds | EAS Build (`eas.json`) |

---

## Prerequisites

Install the following before you begin:

1. **Node.js** (current LTS; 20.19 or newer recommended) and **npm**
2. **Git**
3. For running on a device or emulator, one or more of:
   - **Android:** [Android Studio](https://developer.android.com/studio) with an emulator, or a physical Android phone with USB debugging enabled
   - **iOS (macOS only):** Xcode with an iOS simulator, or a physical iPhone
4. *(Optional)* An [Expo account](https://expo.dev/signup) and EAS CLI if you want cloud builds

---

## Quick Start

```bash
# 1. Clone the repository
git clone https://github.com/MysticMetaphors/IEMS.git
cd IEMS

# 2. Install dependencies
npm install

# 3. Start the development server
npx expo start
```

The terminal will show a QR code and shortcuts for opening the app on Android, iOS, or web.

> IEMS stores its data locally on the device with SQLite, so there is no backend or database server to set up.

---

## Running on a Device or Emulator

IEMS uses native modules (notifications, background tasks, SQLite, dev client), so it should be run as a **development build** rather than in Expo Go, which only includes a limited set of bundled native modules.

### Option A: Local development build

```bash
# Android (emulator running, or phone connected by USB)
npm run android

# iOS (macOS only)
npm run ios
```

The first run generates the native `android/` / `ios/` folders and compiles the app, which can take several minutes. Later runs are much faster.

Once the development build is installed, you can start Metro on its own and reopen the app any time:

```bash
npx expo start --dev-client
```

### Option B: Cloud development build with EAS

If you don't want to install Android Studio or Xcode:

```bash
npm install -g eas-cli
eas login
eas build --profile development --platform android   # or ios
```

Install the resulting build on your device, then run `npx expo start --dev-client` and scan the QR code.

### Notifications permission

On Android 13+, the app requests the notification permission (`POST_NOTIFICATIONS`) so it can remind you about lessons. Accept the prompt on first launch to receive reminders.

---

## Available Scripts

| Command | Description |
| --- | --- |
| `npm start` | Start the Expo dev server |
| `npm run android` | Build and run the app on Android (`expo run:android`) |
| `npm run ios` | Build and run the app on iOS (`expo run:ios`) |
| `npm run web` | Start the app in a web browser |
| `npm run lint` | Lint the project with Expo's ESLint setup |
| `npx tsc --noEmit` | Type-check the project |
| `npx expo-doctor` | Diagnose dependency and config issues |
| `npx expo install --fix` | Fix packages that don't match the installed SDK |

> **Adding packages:** use `npx expo install <package>` instead of `npm install <package>` so Expo picks a version compatible with the current SDK.

---

## Project Structure

```
IEMS/
├── src/                 # Application source (screens, components, logic)
│   └── app/             # Expo Router routes: each file is a screen
├── assets/              # Images, icons, splash assets
├── scripts/             # Helper scripts
├── app.json             # Expo app configuration and plugins
├── eas.json             # EAS Build profiles
├── babel.config.js      # Babel configuration
├── metro.config.js      # Metro bundler configuration
├── tailwind.config.js   # Tailwind / NativeWind theme
├── tsconfig.json        # TypeScript configuration
└── package.json
```

Routes live in `src/app/`. Keep non-route code (components, hooks, utilities) outside that folder.

---

## Building with EAS

Build profiles are defined in `eas.json`:

| Profile | Purpose |
| --- | --- |
| `development` | Development client, distributed internally |
| `preview` | Internal-distribution test build |
| `production` | Store build with auto-incrementing version |

```bash
npm install -g eas-cli
eas login

eas build --profile preview --platform android
eas build --profile production --platform android
```

The Android application ID is `com.iems`.

---

## Troubleshooting

- **Metro cache problems or odd red-screen errors:** run `npx expo start --clear`.
- **Dependency version warnings:** run `npx expo install --fix`, then `npx expo-doctor`.
- **App opens in Expo Go and a native module is missing:** use a development build (see above).
- **Android build fails after changing plugins or native config:** regenerate native folders with `npx expo prebuild --clean`.
- **Phone can't reach the dev server:** make sure the phone and computer are on the same Wi-Fi network, or use `npx expo start --tunnel`.
- **NativeWind classes not applying:** restart with `npx expo start --clear` after editing `tailwind.config.js`.
