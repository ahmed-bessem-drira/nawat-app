# NAWAT FOCUS Mobile App

React Native Expo mobile application for NAWAT FOCUS - ADHD Support Platform

## 🚀 Getting Started

### Prerequisites
- Node.js (v18+)
- Expo CLI
- Android Studio / Xcode

### Installation

```bash
# Install dependencies
npm install

# Start development server
npm start

# Run on iOS simulator
npm run ios

# Run on Android emulator
npm run android
```

## 📱 App Structure

```
src/
├── app/               # Expo Router screens
│   ├── index.tsx      # Loading screen
│   ├── onboarding.tsx # Language/avatar selection
│   ├── mood-check-in.tsx
│   ├── village-map.tsx
│   ├── noise-souk.tsx
│   ├── gate-of-patience.tsx
│   ├── cloud-valley.tsx
│   ├── backpack-oasis.tsx
│   └── focus-garden.tsx
├── components/        # Reusable components
├── stores/           # Zustand stores
│   ├── childStore.ts
│   ├── gameStore.ts
│   └── syncStore.ts
├── services/         # Business logic
│   ├── database.service.ts
│   ├── sync.service.ts
│   └── localAI.service.ts
├── database/         # SQLite schema
├── i18n/            # Translations
└── types/           # TypeScript types
```

## 🎮 Game Features

### Offline-First Architecture
- All gameplay works without internet
- Data stored locally using SQLite
- Sync when internet is available
- Local AI recommendations (rule-based)

### State Management
- Zustand for global state
- MMKV for persistent storage
- SQLite for structured data

### Games
1. **Noise Souk** - Attention training
2. **Gate of Patience** - Impulse control
3. **Cloud Valley** - Calmness (camera tracing)
4. **Backpack Oasis** - Organization

### Rewards
- Focus Garden with water drops, flowers, trees
- No competitive elements
- Positive reinforcement only

## 🔐 Privacy

- No camera images stored
- No microphone recording
- No real names required
- All data local by default

## 🌍 Localization

Supported languages:
- English
- French
- Arabic

## 📦 Build

```bash
# Build for production
eas build --platform ios
eas build --platform android
```

## 🧪 Testing

```bash
npm run test
```
