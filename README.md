# Digital Notes

A clean, offline-first React Native app that turns camera photos into organized digital notes using AI.

## Features

- **Camera capture** — take a photo of any note, document, or whiteboard.
- **AI conversion** — sends the image to the Umans Code API and returns a structured digital note.
- **Offline reading** — all folders, notes, and photos are stored locally on the device.
- **Folder / topic organization** — create colored folders and move notes between them.
- **Search** — quickly find folders from the dashboard.
- **Favorites** — mark important notes with a star.
- **Clean minimal UI** — simple, distraction-free interface.

## Tech Stack

- Expo SDK 57
- React Native 0.86
- TypeScript
- Expo Router
- Expo SQLite (local database)
- Expo FileSystem (local image storage)
- Expo Camera
- Zustand (state management)
- Umans Code API (OpenAI-compatible endpoint)

## Getting Started

### 1. Install dependencies

```bash
npm install --legacy-peer-deps
```

### 2. Configure environment variables

Copy `.env.example` to `.env` and add your Umans API key:

```bash
cp .env.example .env
```

Then edit `.env`:

```env
EXPO_PUBLIC_UMANS_API_KEY=sk-your-umans-api-key
EXPO_PUBLIC_UMANS_BASE_URL=https://api.code.umans.ai/v1
```

Get your key from [app.umans.ai/billing](https://app.umans.ai/billing).

### 3. Run the app

```bash
# iOS
npx expo run:ios

# Android
npx expo run:android

# Or start the dev server
npx expo start
```

## Project Structure

```
app/
  (tabs)/             # Tab navigation (Dashboard, Settings)
  folder/[id].tsx     # Folder detail
  note/[id].tsx       # Note detail
  note/edit.tsx       # Create/edit note
  camera.tsx          # Camera screen
components/           # Reusable UI components
constants/            # Design tokens
services/             # Database, storage, AI adapters
hooks/                # Custom React hooks
store/                # Zustand store
types/                # TypeScript types
```

## Notes

- The app is **local-first**. After a note is created, everything works offline.
- The Umans API key is bundled via an environment variable at build time.
- Photos are stored in the app's document directory under `notes/`.
