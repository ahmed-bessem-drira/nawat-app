import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface GameSession {
  id: string;
  gameType: string;
  startTime: number;
  endTime?: number;
  metrics: any;
}

interface RewardState {
  waterDrops: number;
  flowers: number;
  trees: number;
  addWaterDrop: () => void;
  addFlower: () => void;
  addTree: () => void;
  resetRewards: () => void;
}

interface GameState {
  currentSession: GameSession | null;
  rewards: RewardState;
  startSession: (gameType: string) => void;
  endSession: (metrics: any) => void;
  clearSession: () => void;
}

export const useGameStore = create<GameState>()(
  persist(
    (set, get) => ({
      currentSession: null,
      rewards: {
        waterDrops: 0,
        flowers: 0,
        trees: 0,
        addWaterDrop: () => set((state) => ({ rewards: { ...state.rewards, waterDrops: state.rewards.waterDrops + 1 } })),
        addFlower: () => set((state) => ({ rewards: { ...state.rewards, flowers: state.rewards.flowers + 1 } })),
        addTree: () => set((state) => ({ rewards: { ...state.rewards, trees: state.rewards.trees + 1 } })),
        resetRewards: () => set((state) => ({ rewards: { ...state.rewards, waterDrops: 0, flowers: 0, trees: 0 } })),
      },
      startSession: (gameType) => set({
        currentSession: {
          id: Date.now().toString(),
          gameType,
          startTime: Date.now(),
          metrics: {},
        },
      }),
      endSession: (metrics) => set((state) => ({
        currentSession: state.currentSession ? {
          ...state.currentSession,
          endTime: Date.now(),
          metrics,
        } : null,
      })),
      clearSession: () => set({ currentSession: null }),
    }),
    {
      name: 'nawat-game-storage',
      storage: createJSONStorage(() => AsyncStorage),
      merge: (persistedState: any, currentState: GameState) => ({
        ...currentState,
        ...persistedState,
        rewards: {
          ...currentState.rewards,
          ...(persistedState as any)?.rewards,
        },
      }),
    }
  )
);
