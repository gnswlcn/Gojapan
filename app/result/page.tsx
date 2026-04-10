'use client';

import { Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { WORLD_CONFIG, LEVEL_ORDER } from '@/lib/wordSelector';
import { useProgressStore } from '@/store/useProgressStore';
import type { JlptLevel } from '@/store/useProgressStore';

function ResultContent() {
  const router = useRouter();
  const params = useSearchParams();
  const { currentWorld } = useProgressStore();

  const studied = Number(params.get('studied') ?? 0);
  const known = Number(params.get('known') ?? 0);
  const world = (params.get('world') ?? currentWorld) as JlptLevel;
  const learning = studied - known;
  const pct = studied > 0 ? Math.round((known / studied) * 100) : 0;

  const config = WORLD_CONFIG[world];
  const isFinalWorld = world === 'N1';
  const nextWorld = isFinalWorld
    ? null
    : LEVEL_ORDER[LEVEL_ORDER.indexOf(world) + 1];

  const getMessage = () => {
    if (pct === 100) return { title: '완벽해요! 🌟', sub: '이번 던전 전부 클리어!' };
    if (pct >= 80) return { title: '훌륭해요! ⚡', sub: '거의 다 알고 있네요' };
    if (pct >= 50) return { title: '잘 하고 있어요 💪', sub: '다시 보면 금방 외워요' };
    return { title: '계속 도전! 🔥', sub: '반복이 실력이에요' };
  };

  const { title, sub } = getMessage();

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 to-gray-800 flex flex-col items-center justify-center px-4">
      {/* World badge */}
      <motion.div
        initial={{ scale: 0.5, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: 'spring', stiffness: 200, damping: 15 }}
        className="text-6xl mb-4"
      >
        {config.emoji}
      </motion.div>

      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.1 }}
        className="text-center mb-8"
      >
        <div className="text-white text-3xl font-bold mb-1">{title}</div>
        <div className="text-gray-400">{sub}</div>
      </motion.div>

      {/* Stats */}
      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.2 }}
        className="bg-white/10 backdrop-blur rounded-3xl p-6 w-full max-w-xs mb-6"
      >
        <div className="grid grid-cols-3 gap-4 text-center">
          <div>
            <div className="text-3xl font-bold text-white">{studied}</div>
            <div className="text-xs text-gray-400 mt-1">학습</div>
          </div>
          <div>
            <div className="text-3xl font-bold text-emerald-400">{known}</div>
            <div className="text-xs text-gray-400 mt-1">알았다</div>
          </div>
          <div>
            <div className="text-3xl font-bold text-red-400">{learning}</div>
            <div className="text-xs text-gray-400 mt-1">복습 필요</div>
          </div>
        </div>

        {/* Score bar */}
        <div className="mt-4">
          <div className="flex justify-between text-xs text-gray-400 mb-1">
            <span>정답률</span>
            <span>{pct}%</span>
          </div>
          <div className="h-2 bg-white/20 rounded-full overflow-hidden">
            <motion.div
              className="h-full bg-gradient-to-r from-emerald-400 to-green-500 rounded-full"
              initial={{ width: 0 }}
              animate={{ width: `${pct}%` }}
              transition={{ delay: 0.4, duration: 0.6 }}
            />
          </div>
        </div>
      </motion.div>

      {/* World name */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3 }}
        className="text-gray-500 text-sm mb-8"
      >
        {config.emoji} {config.name} · {config.subtitle}
      </motion.div>

      {/* Actions */}
      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.4 }}
        className="flex flex-col gap-3 w-full max-w-xs"
      >
        <button
          onClick={() => router.push('/learn')}
          className="w-full py-4 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-lg rounded-2xl active:scale-95 transition-all"
        >
          한 판 더 ⚔️
        </button>
        <button
          onClick={() => router.push('/')}
          className="w-full py-4 bg-white/10 hover:bg-white/20 text-white font-medium rounded-2xl active:scale-95 transition-all"
        >
          홈으로 돌아가기
        </button>
      </motion.div>

      {isFinalWorld && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
          className="mt-6 text-center"
        >
          <div className="text-yellow-400 text-sm font-medium">
            🐉 최종 보스에 도전 중! 포기하지 마세요!
          </div>
        </motion.div>
      )}

      {nextWorld && pct === 100 && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7 }}
          className="mt-4 text-center"
        >
          <div className="text-yellow-400 text-sm">
            🌟 다음 월드 {WORLD_CONFIG[nextWorld].emoji} {WORLD_CONFIG[nextWorld].name}이 열렸어요!
          </div>
        </motion.div>
      )}
    </div>
  );
}

export default function ResultPage() {
  return (
    <Suspense>
      <ResultContent />
    </Suspense>
  );
}
