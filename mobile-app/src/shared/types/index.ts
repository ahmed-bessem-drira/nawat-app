// Shared TypeScript types for NAWAT FOCUS

export enum Language {
  ARABIC = 'ar',
  FRENCH = 'fr',
  ENGLISH = 'en'
}

export enum Mood {
  CALM = 'calm',
  HAPPY = 'happy',
  TIRED = 'tired',
  ANGRY = 'angry',
  SAD = 'sad',
  EXCITED = 'excited'
}

export enum GameType {
  NOISE_SOUK = 'noise_souk',
  GATE_OF_PATIENCE = 'gate_of_patience',
  CLOUD_VALLEY = 'cloud_valley',
  BACKPACK_OASIS = 'backpack_oasis'
}

export enum UserRole {
  TEACHER = 'teacher',
  ADMIN = 'admin'
}

export interface User {
  id: string;
  email: string;
  role: UserRole;
  createdAt: Date;
}

export interface Child {
  id: string;
  nickname: string;
  avatar: string;
  language: Language;
  createdAt: Date;
}

export interface Session {
  id: string;
  childId: string;
  gameType: GameType;
  duration: number;
  synced: boolean;
  createdAt: Date;
}

export interface GameMetrics {
  id: string;
  sessionId: string;
  gameType: GameType;
  omissions?: number;
  commissions?: number;
  reactionTime?: number;
  reactionTimeVariability?: number;
  accuracy?: number;
  smoothness?: number;
  completionTime?: number;
  pathDeviation?: number;
  calmScore?: number;
  impulsiveResponses?: number;
  correctInhibition?: number;
  correctSequence?: number;
  synced: boolean;
  createdAt: Date;
}

export interface MoodEntry {
  id: string;
  childId: string;
  mood: Mood;
  synced: boolean;
  createdAt: Date;
}

export interface Recommendation {
  id: string;
  childId: string;
  content: string;
  encouragement: string;
  suggestedActivity: GameType | null;
  createdAt: Date;
}

export interface Reward {
  id: string;
  childId: string;
  waterDrops: number;
  flowers: number;
  trees: number;
  updatedAt: Date;
}

// API Request/Response Types
export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  accessToken: string;
  user: User;
}

export interface CreateChildRequest {
  nickname: string;
  avatar: string;
  language: Language;
}

export interface SyncSessionRequest {
  sessions: Session[];
  metrics: GameMetrics[];
  moods: MoodEntry[];
}

export interface SyncSessionResponse {
  synced: number;
  recommendations: Recommendation[];
}

export interface AIRecommendationRequest {
  mood: Mood;
  omissions: number;
  commissions: number;
  reactionTime: number;
  calmScore: number;
  sessionHistory: GameMetrics[];
}

export interface AIRecommendationResponse {
  encouragement: string;
  teacherRecommendation: string;
  suggestedActivity: GameType;
  difficultyAdjustment: {
    reduceDistractors?: boolean;
    slowGameplay?: boolean;
    suggestCloudValley?: boolean;
  };
}

export interface LocalDifficultyAdjustment {
  reduceDistractors: boolean;
  slowGameplay: boolean;
  suggestCloudValley: boolean;
}
