'use client';

import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { MORE_LOCATIONS } from '@/lib/locations';
import { useProgressStore } from '@/store/useProgressStore';

export default function NewLocationPage() {
  const router = useRouter();
  const { unlockedLocationIds, unlockLocation } = useProgressStore();

  // Only show locations not yet unlocked
  const available = MORE_LOCATIONS.filter(
    (loc) => !unlockedLocationIds.includes(loc.id)
  );

  function handleAdd(id: string) {
    unlockLocation(id);
    router.push(`/location/${id}`);
  }

  return (
    <div className="min-h-screen bg-gray-950 text-white flex flex-col pb-10">

      {/* ── Header ── */}
      <div className="px-4 pt-8 pb-4">
        <button
          onClick={() => router.push('/')}
          className="text-gray-500 hover:text-gray-300 text-sm mb-5 block"
        >
          ← 홈
        </button>
        <motion.div
          initial={{ y: -10, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
        >
          <div className="text-2xl font-black">장소 추가</div>
          <div className="text-gray-500 text-sm mt-1">
            공부하고 싶은 장소를 추가하면 에피소드를 생성할 수 있어요
          </div>
        </motion.div>
      </div>

      {/* ── Location list ── */}
      <div className="px-4 flex flex-col gap-3 mt-2">
        {available.length === 0 ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-16"
          >
            <div className="text-4xl mb-3">🎉</div>
            <div className="text-gray-400 text-sm">
              모든 장소를 추가했어요!
            </div>
            <button
              onClick={() => router.push('/')}
              className="mt-4 text-indigo-400 text-sm"
            >
              홈으로 →
            </button>
          </motion.div>
        ) : (
          available.map((loc, idx) => (
            <motion.div
              key={loc.id}
              initial={{ opacity: 0, x: -16 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: idx * 0.06 }}
              className="flex items-center gap-4 p-4 rounded-2xl bg-white/5 border border-white/0"
            >
              <div className="text-4xl shrink-0">{loc.thumbnail}</div>
              <div className="flex-1 min-w-0">
                <div className="font-bold text-white text-base">
                  {loc.name_ko}
                </div>
                <div className="text-gray-400 text-xs mt-0.5">
                  {loc.description}
                </div>
                <div className="text-gray-600 text-xs mt-1">
                  단어 {loc.vocab.length}개
                </div>
              </div>
              <button
                onClick={() => handleAdd(loc.id)}
                className="shrink-0 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-bold rounded-xl active:scale-95 transition-all"
              >
                추가
              </button>
            </motion.div>
          ))
        )}
      </div>
    </div>
  );
}
