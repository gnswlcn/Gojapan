import type { Word, JlptLevel, WordProgress } from '@/store/useProgressStore';
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
  wordProgress: Record<string, WordProgress>
): Word[] {
  const getConf = (id: string) => wordProgress[id]?.confidence ?? 0;

  // unseen: never studied
  const unseen = allWords.filter((w) => !wordProgress[w.id]);
  // low confidence: studied but shaky (1-2)
  const lowConf = allWords.filter((w) => {
    const c = getConf(w.id);
    return c >= 1 && c <= 2;
  });
  // medium confidence: knows it but needs occasional review (3-4)
  const medConf = allWords.filter((w) => {
    const c = getConf(w.id);
    return c >= 3 && c <= 4;
  });
  // mastered (confidence 5) are excluded

  const selected: Word[] = [];

  // Priority 1: low confidence (needs review, up to half the dungeon)
  const lowSlots = Math.min(lowConf.length, Math.floor(DUNGEON_SIZE / 2));
  selected.push(...shuffle(lowConf).slice(0, lowSlots));

  // Priority 2: unseen words to fill remaining slots
  const unseenNeeded = DUNGEON_SIZE - selected.length;
  selected.push(...shuffle(unseen).slice(0, unseenNeeded));

  // Priority 3: more low confidence if still short
  if (selected.length < DUNGEON_SIZE) {
    const moreLow = shuffle(lowConf).filter((w) => !selected.find((s) => s.id === w.id));
    selected.push(...moreLow.slice(0, DUNGEON_SIZE - selected.length));
  }

  // Priority 4: medium confidence for review
  if (selected.length < DUNGEON_SIZE) {
    selected.push(...shuffle(medConf).slice(0, DUNGEON_SIZE - selected.length));
  }

  return shuffle(selected);
}

export function getDungeonProgress(
  allWords: Word[],
  wordProgress: Record<string, WordProgress>
): { cleared: number; total: number } {
  const totalDungeons = Math.ceil(allWords.length / DUNGEON_SIZE);
  // "Known" = confidence >= 3
  const knownCount = allWords.filter((w) => (wordProgress[w.id]?.confidence ?? 0) >= 3).length;
  const clearedDungeons = Math.floor(knownCount / DUNGEON_SIZE);
  return { cleared: clearedDungeons, total: totalDungeons };
}

export function isWorldCleared(
  allWords: Word[],
  wordProgress: Record<string, WordProgress>
): boolean {
  return allWords.every((w) => (wordProgress[w.id]?.confidence ?? 0) >= 5);
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
