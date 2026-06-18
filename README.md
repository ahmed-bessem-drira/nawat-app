# NAWAT FOCUS

An offline-first AI-powered serious game platform for children with ADHD in low-resource environments.

## 📱 Project Overview

NAWAT FOCUS is a mobile application designed to help children with ADHD improve:
- Attention
- Impulse control
- Emotional regulation
- Task organization
- Motivation

**Important:** This solution is for educational and supportive purposes only. It does NOT diagnose ADHD.

## 🏗️ Architecture

### Tech Stack

**Frontend (Mobile App):**
- React Native (Expo)
- TypeScript
- Expo Router
- Zustand (state management)
- React Query
- React Native SVG
- Expo Camera
- Expo SQLite
- React Native Reanimated
- MMKV (fast local storage)

**Backend (API):**
- NestJS
- PostgreSQL
- Prisma ORM
- JWT Authentication
- Swagger (API documentation)
- BullMQ (background jobs)

**AI:**
- Local LLM: Qwen2.5:1.5B
- Run through Ollama
- Backend communicates with Ollama
- Child app works fully without internet
- Advanced recommendations generated when backend is reachable

## 📁 Project Structure

```
nawat-focus/
├── mobile-app/              # React Native Expo app
│   ├── src/
│   │   ├── app/            # Expo Router screens
│   │   ├── components/     # Reusable components
│   │   ├── stores/         # Zustand stores
│   │   ├── services/       # Database, sync, AI services
│   │   ├── database/       # SQLite schema
│   │   ├── i18n/           # Translations
│   │   └── types/          # TypeScript types
│   ├── assets/             # Images, avatars
│   ├── package.json
│   └── app.json
├── backend/                # NestJS API
│   ├── src/
│   │   ├── auth/           # Authentication module
│   │   ├── children/       # Child management
│   │   ├── sessions/       # Game sessions
│   │   ├── recommendations/# AI recommendations
│   │   ├── ai/             # Ollama integration
│   │   ├── sync/           # Data synchronization
│   │   └── common/         # Shared utilities
│   ├── prisma/
│   │   └── schema.prisma   # Database schema
│   └── package.json
└── shared/                 # Shared TypeScript types
    └── types/
        └── index.ts
```

## 🎮 Game Villages

### Village 1: Noise Souk (Attention Training)
- **Goal:** Tap only target objects, ignore distractors
- **Metrics:** Correct hits, omissions, commissions, reaction time, reaction time variability

### Village 2: Gate of Patience (Impulse Control)
- **Goal:** Green = tap, Red = don't tap, Yellow = wait before tapping
- **Metrics:** Impulsive responses, correct inhibition, reaction time

### Village 3: Cloud Valley (Calmness & Emotional Regulation)
- **Goal:** Camera-based tracing activity with transparent overlay
- **Metrics:** Accuracy, smoothness, completion time, path deviation, calm score
- **Privacy:** No images saved, no photo processing

### Village 4: Backpack Oasis (Organization)
- **Goal:** Drag and drop tasks into correct order
- **Metrics:** Correct sequence, completion time

### Focus Garden (Reward System)
- Water drops, flowers, trees as rewards
- No competitive leaderboard
- No punishment

## 🚀 Getting Started

### Prerequisites

- Node.js (v18 or higher)
- PostgreSQL
- Ollama (for AI recommendations)
- Expo CLI
- Android Studio / Xcode (for mobile development)

### Backend Setup

1. Navigate to backend directory:
```bash
cd backend
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
```bash
cp .env.example .env
# Edit .env with your configuration
```

4. Run Prisma migrations:
```bash
npx prisma migrate dev
npx prisma generate
```

5. Start the server:
```bash
npm run start:dev
```

API documentation will be available at: `http://localhost:3001/api/docs`

### Mobile App Setup

1. Navigate to mobile-app directory:
```bash
cd mobile-app
```

2. Install dependencies:
```bash
npm install
```

3. Start the development server:
```bash
npm start
```

4. Run on device/simulator:
```bash
# iOS
npm run ios

# Android
npm run android
```

### Ollama Setup (for AI)

1. Install Ollama: https://ollama.ai/download

2. Pull the Qwen model:
```bash
ollama pull qwen2.5:1.5b
```

3. Start Ollama service:
```bash
ollama serve
```

## 🔐 Privacy Rules

- No real names required (use avatars)
- No camera images stored
- No microphone recording
- No ADHD diagnosis
- No public rankings
- All data stored locally on device
- Sync only when internet is available

## 📊 Database Schema

### PostgreSQL (Backend)
- User (teachers/admins)
- Child (child profiles)
- Session (game sessions)
- GameMetrics (performance metrics)
- MoodEntry (mood check-ins)
- Recommendation (AI recommendations)

### SQLite (Mobile)
- Child (local profile)
- MoodEntry (local mood data)
- Session (local game sessions)
- GameMetrics (local metrics)
- Reward (focus garden rewards)
- Recommendation (cached recommendations)
- Settings (app settings)

## 🔄 Sync Engine

When internet is available:
1. Upload unsynced sessions
2. Upload metrics
3. Upload moods
4. Download recommendations
5. Mark records as synced

All gameplay works without internet connection.

## 🤖 AI Integration

### Local AI (Mobile)
Rule-based recommendations that work offline:
- Adjust difficulty based on performance
- Suggest activities based on mood
- Provide encouragement messages

### Cloud AI (Backend via Ollama)
Advanced recommendations when online:
- Analyze session history
- Generate personalized encouragement
- Provide teacher recommendations
- Suggest next activities

## 🌍 Localization

Supported languages:
- English (en)
- French (fr)
- Arabic (ar)

## 📝 API Endpoints

### Authentication
- `POST /auth/login` - Login with email/password

### Children
- `POST /children` - Create child profile
- `GET /children` - Get all children
- `GET /children/:id` - Get child by ID

### Sessions
- `POST /sessions` - Create game session
- `POST /sessions/metrics` - Save game metrics
- `GET /sessions/child/:childId` - Get child sessions

### Recommendations
- `GET /recommendations/child/:childId` - Get recommendations

### Sync
- `POST /sync/sessions` - Sync offline data

### AI
- `POST /ai/recommendation` - Generate AI recommendation

## 🧪 Testing

### Backend
```bash
cd backend
npm run test
```

### Mobile
```bash
cd mobile-app
npm run test
```

## 📦 Deployment

### Backend
1. Build the project:
```bash
npm run build
```

2. Deploy to your preferred platform (Heroku, AWS, etc.)

### Mobile
1. Build for production:
```bash
eas build --platform ios
eas build --platform android
```

2. Submit to App Store / Google Play

## 🤝 Contributing

This is a production-ready MVP for educational purposes. Contributions should focus on:
- Improving accessibility
- Adding more languages
- Enhancing game mechanics
- Improving AI recommendations
- Adding new villages/activities

## 📄 License

This project is for educational purposes. Please ensure compliance with local regulations when deploying.

## 🙏 Acknowledgments

- Designed for children with ADHD in low-resource environments
- Uses evidence-based game mechanics
- Prioritizes privacy and offline functionality
- Built with accessibility in mind
