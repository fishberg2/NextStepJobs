import { create } from 'zustand';
import { User } from 'firebase/auth';
import { UserProfile, CareerRecommendation, SkillTranslation, CareerMapStep } from '../utils/gemini';

export interface UserData {
  profile?: UserProfile;
  recommendations?: CareerRecommendation[];
  skillTranslations?: SkillTranslation[];
  careerMap?: CareerMapStep[];
  displayName?: string | null;
  photoURL?: string | null;
  bio?: string;
  transition?: string;
}

interface AppState {
  theme: 'light' | 'dark';
  setTheme: (theme: 'light' | 'dark') => void;
  user: User | null;
  setUser: (user: User | null) => void;
  authLoading: boolean;
  setAuthLoading: (loading: boolean) => void;
  userData: UserData | null;
  setUserData: (data: UserData | null) => void;
}

export const useAppStore = create<AppState>((set) => ({
  theme: 'light',
  setTheme: (theme) => set({ theme }),
  user: null,
  setUser: (user) => set({ user }),
  authLoading: true,
  setAuthLoading: (loading) => set({ authLoading: loading }),
  userData: null,
  setUserData: (userData) => set({ userData }),
}));
