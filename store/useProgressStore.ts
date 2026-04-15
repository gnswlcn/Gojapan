'use client';

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { upsertWordProgress } from '@/lib/supabase';

export type JlptLevel = 'N5' | 'N4' | 'N3' | 'N2' | 'N1';

export interface ExampleSegment {
  jp: string;
  ko: string;
  wId: string | null;
}

export interface Word {
  id: string;
  kanji: string;
  reading: string;
  meaning_ko: string;
  level: JlptLevel;
  category: string;
  example?: ExampleSegment[];
}

export interface WordProgress {
  confidence: number; // 0 = unseen, 1-2 = low, 3-4 = known, 5 = mastered
  lastSeen: string;
}

export interface DailyStats {
  studied: number;
  known: number;
}

function generateUserId(): string {
  return 'u_' + Math.random().toString(36).slice(2) + Date.now().toString(36);
}

interface ProgressState {
  userId: string;
  wordProgress: Record<string, WordProgress>;
  completedEpisodes: string[];
  currentWorld: JlptLevel;
  streak: number;
  lastStudiedDate: string;
  dailyStats: Record<string, DailyStats>;

  // Actions
  increaseConfidence: (wordId: string, amount?: number) => void;
  decreaseConfidence: (wordId: string) => void;
  markEpisodeComplete: (episodeId: string) => void;
  recordDailyStudy: (studied: number, known: number) => void;
  setCurrentWorld: (level: JlptLevel) => void;
  resetProgress: () => void;
}

const today = () => new Date().toISOString().split('T')[0];

const updateStreak = (lastDate: string, currentStreak: number): number => {
  const todayStr = today();
  if (lastDate === todayStr) return currentStreak;

  const last = new Date(lastDate);
  const now = new Date(todayStr);
  const diffDays = Math.round((now.getTime() - last.getTime()) / (1000 * 60 * 60 * 24));

  if (diffDays === 1) return currentStreak + 1;
  return 1;
};

export const useProgressStore = create<ProgressState>()(
  persist(
    (set, get) => ({
      userId: generateUserId(),
      wordProgress: {},
      completedEpisodes: [],
      currentWorld: 'N5',
      streak: 0,
      lastStudiedDate: '',
      dailyStats: {},

      increaseConfidence: (wordId: string, amount = 1) => {
        const { userId, wordProgress } = get();
        const current = wordProgress[wordId];
        const newConfidence = Math.min(5, (current?.confidence ?? 0) + amount);
        set((state) => ({
          wordProgress: {
            ...state.wordProgress,
            [wordId]: { confidence: newConfidence, lastSeen: today() },
          },
        }));
        // 백그라운드 Supabase 동기화 (fire-and-forget)
        upsertWordProgress(userId, wordId, newConfidence);
      },

      decreaseConfidence: (wordId: string) => {
        const { userId, wordProgress } = get();
        const current = wordProgress[wordId];
        const newConfidence = Math.max(0, (current?.confidence ?? 1) - 1);
        set((state) => ({
          wordProgress: {
            ...state.wordProgress,
            [wordId]: { confidence: newConfidence, lastSeen: today() },
          },
        }));
        // 백그라운드 Supabase 동기화
        upsertWordProgress(userId, wordId, newConfidence);
      },

      markEpisodeComplete: (episodeId: string) =>
        set((state) => ({
          completedEpisodes: state.completedEpisodes.includes(episodeId)
            ? state.completedEpisodes
            : [...state.completedEpisodes, episodeId],
        })),

      recordDailyStudy: (studied: number, known: number) => {
        const todayStr = today();
        const state = get();
        const newStreak = state.lastStudiedDate
          ? updateStreak(state.lastStudiedDate, state.streak)
          : 1;

        set((s) => ({
          streak: newStreak,
          lastStudiedDate: todayStr,
          dailyStats: {
            ...s.dailyStats,
            [todayStr]: {
              studied: (s.dailyStats[todayStr]?.studied ?? 0) + studied,
              known: (s.dailyStats[todayStr]?.known ?? 0) + known,
            },
          },
        }));
      },

      setCurrentWorld: (level: JlptLevel) => set({ currentWorld: level }),

      resetProgress: () =>
        set({
          wordProgress: {},
          completedEpisodes: [],
          currentWorld: 'N5',
          streak: 0,
          lastStudiedDate: '',
          dailyStats: {},
        }),
    }),
    {
      name: 'gojapan-progress',
    }
  )
);
