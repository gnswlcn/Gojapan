'use client';

import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type JlptLevel = 'N5' | 'N4' | 'N3' | 'N2' | 'N1';

export interface Word {
  id: string;
  kanji: string;
  reading: string;
  meaning_ko: string;
  level: JlptLevel;
  category: string;
}

export interface DailyStats {
  studied: number;
  known: number;
}

interface ProgressState {
  knownWords: string[];
  learningWords: string[];
  currentWorld: JlptLevel;
  streak: number;
  lastStudiedDate: string;
  dailyStats: Record<string, DailyStats>;

  // Actions
  markKnown: (wordId: string) => void;
  markLearning: (wordId: string) => void;
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
      knownWords: [],
      learningWords: [],
      currentWorld: 'N5',
      streak: 0,
      lastStudiedDate: '',
      dailyStats: {},

      markKnown: (wordId: string) =>
        set((state) => ({
          knownWords: state.knownWords.includes(wordId)
            ? state.knownWords
            : [...state.knownWords, wordId],
          learningWords: state.learningWords.filter((id) => id !== wordId),
        })),

      markLearning: (wordId: string) =>
        set((state) => ({
          learningWords: state.learningWords.includes(wordId)
            ? state.learningWords
            : [...state.learningWords, wordId],
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
          knownWords: [],
          learningWords: [],
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
