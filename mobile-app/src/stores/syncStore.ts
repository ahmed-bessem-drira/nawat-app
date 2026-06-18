import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface SyncState {
  isOnline: boolean;
  pendingSyncCount: number;
  setOnlineStatus: (isOnline: boolean) => void;
  incrementPendingSync: () => void;
  decrementPendingSync: () => void;
  resetPendingSync: () => void;
}

export const useSyncStore = create<SyncState>()(
  persist(
    (set) => ({
      isOnline: true,
      pendingSyncCount: 0,
      setOnlineStatus: (isOnline) => set({ isOnline }),
      incrementPendingSync: () => set((state) => ({ pendingSyncCount: state.pendingSyncCount + 1 })),
      decrementPendingSync: () => set((state) => ({ pendingSyncCount: Math.max(0, state.pendingSyncCount - 1) })),
      resetPendingSync: () => set({ pendingSyncCount: 0 }),
    }),
    {
      name: 'nawat-sync-storage',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);
