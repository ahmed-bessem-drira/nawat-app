import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface Child {
  id: string;
  nickname: string;
  avatar: string;
  language: string;
  createdAt: string;
}

interface ChildState {
  child: Child | null;
  currentMood: string | null;
  setChild: (child: Child) => void;
  setMood: (mood: string) => void;
  clearChild: () => void;
}

export const useChildStore = create<ChildState>()(
  persist(
    (set) => ({
      child: null,
      currentMood: null,
      setChild: (child) => set({ child }),
      setMood: (mood) => set({ currentMood: mood }),
      clearChild: () => set({ child: null, currentMood: null }),
    }),
    {
      name: 'nawat-child-storage',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);
