'use client';

import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { useState, useEffect } from 'react';
import { useProgressStore } from '@/store/useProgressStore';
import { STATIC_LOCATIONS, MORE_LOCATIONS, type LocationConfig } from '@/lib/locations';
import { episodesForLocation } from '@/lib/episodes';
import { fetchGeneratedEpisodes, type DbEpisode } from '@/lib/supabase';

const today = () => new Date().toISOString().split('T')[0];

export default function HomePage() {
  const router = useRouter();
  const { completedEpisodes, streak, dailyStats, pendingEpisodeRequestedAt, unlockedLocationIds } =
    useProgressStore();

  // Merge static + unlocked additional locations
  const unlockedMore = MORE_LOCATIONS.filter((l) =>
    unlockedLocationIds.includes(l.id)
  );
  const allVisibleLocations = [...STATIC_LOCATIONS, ...unlockedMore];

  const todayStudied = dailyStats[today()]?.studied ?? 0;

  // ── 생성된 에피소드 (Supabase) ─────────────────────────────────────────────
  const [generatedEpisodes, setGeneratedEpisodes] = useState<DbEpisode[]>([]);
  const isGenerating = !!pendingEpisodeRequestedAt &&
    Date.now() - new Date(pendingEpisodeRequestedAt).getTime() < 5 * 60 * 1000;

  useEffect(() => {
    fetchGeneratedEpisodes().then(setGeneratedEpisodes);
  }, []);

  // ── 장소별 에피소드 수 계산 ────────────────────────────────────────────────
  function getLocationStats(loc: LocationConfig) {
    const staticEps = episodesForLocation(loc.id);
    const genEps = generatedEpisodes.filter(
      (ep) => (ep.content as { episode_info?: { location_id?: string } })
        .episode_info?.location_id === loc.id
    );
    const allEps = [...staticEps, ...genEps];
    const doneCount = allEps.filter((e) => completedEpisodes.includes(e.id)).length;
    return { total: allEps.length, done: doneCount };
  }

  return (
    <div className="min-h-screen bg-gray-950 text-white flex flex-col">

      {/* ── 헤더 ── */}
      <div className="px-4 pt-10 pb-4 text-center">
        <motion.div
          initial={{ y: -20, opacity: 0 }} animate={{ y: 0, opacity: 1 }}
          className="text-4xl font-black tracking-tight mb-1"
        >
          GoJapan 🗾
        </motion.div>
        <motion.p
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.1 }}
          className="text-gray-400 text-sm"
        >
          어디서 일본어를 써볼까요?
        </motion.p>
      </div>

      {/* ── 오늘의 퀘스트 + 스트릭 ── */}
      <motion.div
        initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.12 }}
        className="mx-4 mb-5 bg-white/5 rounded-2xl px-5 py-4 flex items-center justify-between"
      >
        <div>
          <div className="text-xs text-gray-500 mb-0.5">오늘의 학습</div>
          <div className="text-xl font-bold">
            {todayStudied > 0 ? `${todayStudied}턴 완료 ✅` : '아직 시작 전!'}
          </div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-black text-orange-400">🔥{streak}</div>
          <div className="text-xs text-gray-500">연속</div>
        </div>
      </motion.div>

      {/* ── 생성 중 배너 ── */}
      {isGenerating && (
        <motion.div
          initial={{ opacity: 0 }} animate={{ opacity: 1 }}
          className="mx-4 mb-4 bg-indigo-950/60 border border-indigo-500/30 rounded-2xl px-4 py-3 flex items-center gap-3"
        >
          <span className="animate-spin text-lg">⏳</span>
          <div>
            <div className="text-indigo-300 text-sm font-bold">맞춤 에피소드 생성 중...</div>
            <div className="text-indigo-400/60 text-xs">완료되면 장소 카드에 자동으로 추가돼요</div>
          </div>
        </motion.div>
      )}

      {/* ── 장소 맵 ── */}
      <div className="px-4 mb-4">
        <div className="text-xs text-gray-500 uppercase tracking-widest mb-3">장소 선택</div>
        <div className="flex flex-col gap-3">
          {allVisibleLocations.map((loc, idx) => {
            const { total, done } = getLocationStats(loc);
            const allDone = total > 0 && done === total;
            return (
              <motion.button
                key={loc.id}
                initial={{ opacity: 0, x: -16 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.15 + idx * 0.06 }}
                onClick={() => router.push(`/location/${loc.id}`)}
                className="flex items-center gap-4 p-4 rounded-2xl bg-white/5 hover:bg-white/10 active:scale-95 transition-all text-left"
              >
                <div className="text-4xl shrink-0">{loc.thumbnail}</div>
                <div className="flex-1 min-w-0">
                  <div className="font-bold text-white text-base flex items-center gap-2">
                    {loc.name_ko}
                    {allDone && <span className="text-xs bg-emerald-500/20 text-emerald-400 px-2 py-0.5 rounded-full">완료</span>}
                  </div>
                  <div className="text-gray-400 text-xs mt-0.5">{loc.description}</div>
                  <div className="flex items-center gap-3 mt-1.5">
                    <span className="text-xs text-gray-500">
                      에피소드 {done}/{total}
                    </span>
                    <span className="text-xs text-indigo-400/70">
                      단어 {loc.vocab.length}개
                    </span>
                  </div>
                </div>
                <span className="text-gray-600 text-lg shrink-0">›</span>
              </motion.button>
            );
          })}
        </div>
      </div>

      {/* ── 새 장소 추가 ── */}
      <motion.div
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }}
        className="mx-4 mb-8"
      >
        <button
          onClick={() => router.push('/location/new')}
          className="w-full flex items-center justify-center gap-2 py-4 rounded-2xl border border-dashed border-white/15 text-gray-500 hover:text-gray-300 hover:border-white/25 transition-all active:scale-95 text-sm"
        >
          <span className="text-lg">+</span>
          새 장소 추가하기
        </button>
      </motion.div>

    </div>
  );
}
