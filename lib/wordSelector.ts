import type { Word, JlptLevel } from '@/store/useProgressStore';
import n5 from '@/data/n5.json';
import n4 from '@/data/n4.json';
import n3 from '@/data/n3.json';
import n2 from '@/data/n2.json';
import n1 from '@/data/n1.json';

const DUNGEON_SIZE = 10;

const WORD_DATA: Record<JlptLevel, Word[]> = {
  N5: n5 as Word[],
  N4: n4 as Word[],
  N3: n3 as Word[],
  N2: n2 as Word[],
  N1: n1 as Word[],
};

// Shuffle array (Fisher-Yates)
function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export async function loadWords(level: JlptLevel): Promise<Word[]> {
  return WORD_DATA[level];
}

export function selectDungeonWords(
  allWords: Word[],
  knownWords: string[],
  learningWords: string[]
): Word[] {
  const knownSet = new Set(knownWords);
  const learningSet = new Set(learningWords);

  // Priority 1: Learning words (need review)
  const learning = allWords.filter(
    (w) => learningSet.has(w.id) && !knownSet.has(w.id)
  );

  // Priority 2: Unseen words (not known, not in learning)
  const unseen = allWords.filter(
    (w) => !knownSet.has(w.id) && !learningSet.has(w.id)
  );

  const selected: Word[] = [];

  // Fill with learning words first (up to half the dungeon)
  const learningSlots = Math.min(learning.length, Math.floor(DUNGEON_SIZE / 2));
  selected.push(...shuffle(learning).slice(0, learningSlots));

  // Fill remaining with unseen words
  const remaining = DUNGEON_SIZE - selected.length;
  selected.push(...shuffle(unseen).slice(0, remaining));

  // If still not enough, use more learning words
  if (selected.length < DUNGEON_SIZE) {
    const morelearning = shuffle(learning)
      .filter((w) => !selected.find((s) => s.id === w.id))
      .slice(0, DUNGEON_SIZE - selected.length);
    selected.push(...morelearning);
  }

  return shuffle(selected);
}

export function getDungeonProgress(
  allWords: Word[],
  knownWords: string[]
): { cleared: number; total: number } {
  const knownSet = new Set(knownWords);
  const levelWords = allWords;
  const totalDungeons = Math.ceil(levelWords.length / DUNGEON_SIZE);
  const knownInLevel = levelWords.filter((w) => knownSet.has(w.id)).length;
  const clearedDungeons = Math.floor(knownInLevel / DUNGEON_SIZE);

  return { cleared: clearedDungeons, total: totalDungeons };
}

export function isWorldCleared(allWords: Word[], knownWords: string[]): boolean {
  const knownSet = new Set(knownWords);
  return allWords.every((w) => knownSet.has(w.id));
}

export const WORLD_CONFIG: Record<
  JlptLevel,
  { name: string; emoji: string; subtitle: string; color: string; bgColor: string }
> = {
  N5: {
    name: '村',
    emoji: '🏘️',
    subtitle: '여행자의 마을',
    color: 'text-emerald-600',
    bgColor: 'from-emerald-400 to-green-500',
  },
  N4: {
    name: '町',
    emoji: '🏙️',
    subtitle: '모험가의 거리',
    color: 'text-blue-600',
    bgColor: 'from-blue-400 to-cyan-500',
  },
  N3: {
    name: '城下町',
    emoji: '🏯',
    subtitle: '무사의 성곽 마을',
    color: 'text-purple-600',
    bgColor: 'from-purple-400 to-violet-500',
  },
  N2: {
    name: '城',
    emoji: '⚔️',
    subtitle: '검사의 성',
    color: 'text-orange-600',
    bgColor: 'from-orange-400 to-red-500',
  },
  N1: {
    name: '龍の巣',
    emoji: '🐉',
    subtitle: '최종 보스의 영역',
    color: 'text-rose-600',
    bgColor: 'from-rose-500 to-red-700',
  },
};

export const LEVEL_ORDER: JlptLevel[] = ['N5', 'N4', 'N3', 'N2', 'N1'];
