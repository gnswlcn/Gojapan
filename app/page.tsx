'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { useProgressStore } from '@/store/useProgressStore';
import { loadWords, getDungeonProgress, WORLD_CONFIG, LEVEL_ORDER } from '@/lib/wordSelector';
import type { JlptLevel, Word } from '@/store/useProgressStore';

const today = () => new Date().toISOString().split('T')[0];

export default function HomePage() {
  const router = useRouter();
  const { currentWorld, knownWords, streak, dailyStats, setCurrentWorld } = useProgressStore();
  const [worldWords, setWorldWords] = useState<Record<JlptLevel, Word[]>>({} as Record<JlptLevel, Word[]>);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const entries = await Promise.all(
        LEVEL_ORDER.map(async (level) => [level, await loadWords(level)])
      );
      setWorldWords(Object.fromEntries(entries) as Record<JlptLevel, Word[]>);
      setLoading(false);
    })();
  }, []);

  const todayStats = dailyStats[today()];
  const todayStudied = todayStats?.studied ?? 0;

  const config = WORLD_CONFIG[currentWorld];

  const isUnlocked = (level: JlptLevel): boolean => {
    const idx = LEVEL_ORDER.indexOf(level);
    if (idx === 0) return true;
    const prev = LEVEL_ORDER[idx - 1];
    const prevWords = worldWords[prev];
    if (!prevWords) return false;
    const prevKnown = prevWords.filter((w) => knownWords.includes(w.id)).length;
    return prevKnown >= Math.ceil(prevWords.length * 0.5);
  };

  return (
    <div className="min-h-screen bg-gray-950 text-white flex flex-col">
      {/* Hero header */}
      <div className="px-4 pt-10 pb-6 text-center">
        <motion.div
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="text-4xl font-black tracking-tight mb-1"
        >
          GoJapan 🗾
        </motion.div>
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.1 }}
          className="text-gray-400 text-sm"
        >
          JLPT 단어 마스터 여정
        </motion.p>
      </div>

      {/* Today stats bar */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15 }}
        className="mx-4 mb-6 bg-white/5 rounded-2xl px-5 py-4 flex items-center justify-between"
      >
        <div>
          <div className="text-xs text-gray-500 mb-0.5">오늘의 퀘스트</div>
          <div className="text-xl font-bold text-white">
            {todayStudied > 0 ? `${todayStudied}단어 학습 완료 ✅` : '오늘 아직 시작 전!'}
          </div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-black text-orange-400">🔥{streak}</div>
          <div className="text-xs text-gray-500">연속</div>
        </div>
      </motion.div>

      {/* Current world - Start button */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.2 }}
        className="mx-4 mb-6"
      >
        <div
          className={`bg-gradient-to-br ${config.bgColor} rounded-3xl p-6 relative overflow-hidden`}
        >
          <div className="absolute top-3 right-4 text-5xl opacity-20">{config.emoji}</div>
          <div className="relative">
            <div className="text-xs font-semibold uppercase tracking-widest text-white/70 mb-1">
              현재 월드
            </div>
            <div className="text-3xl font-black text-white mb-0.5">{config.emoji} {config.name}</div>
            <div className="text-white/80 text-sm mb-5">{config.subtitle}</div>

            {!loading && worldWords[currentWorld] && (
              <WorldProgress
                allWords={worldWords[currentWorld]}
                knownWords={knownWords}
              />
            )}

            <button
              onClick={() => router.push('/learn')}
              className="mt-5 w-full py-4 bg-white text-gray-900 font-black text-lg rounded-2xl active:scale-95 transition-all hover:bg-gray-100 shadow-lg"
            >
              던전 입장 ⚔️
            </button>
          </div>
        </div>
      </motion.div>

      {/* World map */}
      <div className="px-4 mb-4">
        <div className="text-xs text-gray-500 uppercase tracking-widest mb-3">월드 맵</div>
        <div className="flex flex-col gap-3">
          {LEVEL_ORDER.map((level, idx) => {
            const wc = WORLD_CONFIG[level];
            const unlocked = loading ? idx === 0 : isUnlocked(level);
            const isActive = level === currentWorld;
            const words = worldWords[level];
            const knownCount = words ? words.filter((w) => knownWords.includes(w.id)).length : 0;
            const totalCount = words?.length ?? 0;
            const cleared = totalCount > 0 && knownCount === totalCount;

            return (
              <motion.button
                key={level}
                initial={{ x: -20, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ delay: 0.25 + idx * 0.07 }}
                onClick={() => {
                  if (unlocked) {
                    setCurrentWorld(level);
                    router.push('/learn');
                  }
                }}
                disabled={!unlocked}
                className={`flex items-center gap-4 p-4 rounded-2xl transition-all active:scale-95 text-left
                  ${isActive ? 'bg-white/15 ring-2 ring-white/30' : 'bg-white/5 hover:bg-white/10'}
                  ${!unlocked ? 'opacity-40 cursor-not-allowed' : 'cursor-pointer'}
                `}
              >
                <div className="text-3xl">{cleared ? '✅' : unlocked ? wc.emoji : '🔒'}</div>
                <div className="flex-1 min-w-0">
                  <div className="font-bold text-white flex items-center gap-2">
                    {wc.name}
                    {isActive && (
                      <span className="text-xs bg-white/20 px-2 py-0.5 rounded-full">현재</span>
                    )}
                    {cleared && (
                      <span className="text-xs bg-emerald-500/30 text-emerald-300 px-2 py-0.5 rounded-full">클리어</span>
                    )}
                  </div>
                  <div className="text-xs text-gray-400">{wc.subtitle}</div>
                </div>
                {unlocked && totalCount > 0 && (
                  <div className="text-right text-xs text-gray-400 shrink-0">
                    <div className="font-bold text-white">{knownCount}</div>
                    <div>/{totalCount}</div>
                  </div>
                )}
                {!unlocked && (
                  <div className="text-xs text-gray-500 shrink-0">이전 월드 50%</div>
                )}
              </motion.button>
            );
          })}
        </div>
      </div>

      {/* Final boss tease */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.8 }}
        className="mx-4 mb-8 mt-2 text-center"
      >
        <p className="text-xs text-gray-600">
          🐉 최종 보스 <span className="text-gray-500 font-medium">龍の巣</span> 이 기다리고 있다...
        </p>
      </motion.div>
    </div>
  );
}

function WorldProgress({ allWords, knownWords }: { allWords: Word[]; knownWords: string[] }) {
  const { cleared, total } = getDungeonProgress(allWords, knownWords);
  const knownCount = allWords.filter((w) => knownWords.includes(w.id)).length;
  const pct = allWords.length > 0 ? Math.round((knownCount / allWords.length) * 100) : 0;

  return (
    <div>
      <div className="flex justify-between text-xs text-white/70 mb-1">
        <span>던전 {cleared} / {total} 클리어</span>
        <span>{pct}%</span>
      </div>
      <div className="h-1.5 bg-white/20 rounded-full overflow-hidden">
        <motion.div
          className="h-full bg-white rounded-full"
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 0.5 }}
        />
      </div>
    </div>
  );
}
