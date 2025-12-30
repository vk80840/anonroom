import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { AnonUser } from '@/types/database';

interface AuthState {
  user: AnonUser | null;
  setUser: (user: AnonUser | null) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      setUser: (user) => set({ user }),
      logout: () => set({ user: null }),
    }),
    {
      name: 'anon-auth',
    }
  )
);
