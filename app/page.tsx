'use client';

import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { useState, useEffect, useCallback } from 'react';
import { useProgressStore } from '@/store/useProgressStore';
import { WORLD_CONFIG, LEVEL_ORDER } from '@/lib/wordSelector';
import { ALL_EPISODES, episodesForWorld } from '@/lib/episodes';
import { fetchGeneratedEpisodes, type DbEpisode } from '@/lib/supabase';
import type { JlptLevel } from '@/store/useProgressStore';

const EDGE_FN_URL = 'https://ormnjvmapbexmbwadnrb.supabase.co/functions/v1/generate-episode';
const today = () => new Date().toISOString().split('T')[0];

export default function HomePage() {
  const router = useRouter();
  const { userId, currentWorld, completedEpisodes, streak, dailyStats, wordProgress, setCurrentWorld } =
    useProgressStore();

  const todayStudied = dailyStats[today()]?.studied ?? 0;
  const config = WORLD_CONFIG[currentWorld];
  const currentEpisodes = episodesForWorld(currentWorld);

  // ── 맞춤 에피소드 ──────────────────────────────────────────────────────────
  const [generatedEpisodes, setGeneratedEpisodes] = useState<DbEpisode[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);

  useEffect(() => {
    fetchGeneratedEpisodes().then(setGeneratedEpisodes);
  }, []);

  // 약한 단어 (confidence < 2) 추출
  const weakWords = Object.entries(wordProgress)
    .filter(([, p]) => p.confidence < 2)
    .map(([id]) => id)
    .slice(0, 10);

  const requestNewEpisode = useCallback(async () => {
    if (isGenerating || weakWords.length === 0) return;
    setIsGenerating(true);
    try {
      const res = await fetch(EDGE_FN_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, level: currentWorld, weakWords }),
      });
      if (res.ok) {
        const fresh = await fetchGeneratedEpisodes();
        setGeneratedEpisodes(fresh);
      }
    } finally {
      setIsGenerating(false);
    }
  }, [isGenerating, weakWords, userId, currentWorld]);

  const isUnlocked = (level: JlptLevel): boolean => {
    const idx = LEVEL_ORDER.indexOf(level);
    if (idx === 0) return true;
    const prev = LEVEL_ORDER[idx - 1];
    const prevEps = episodesForWorld(prev).filter((e) => !e.comingSoon);
    if (prevEps.length === 0) return false;
    const doneCount = prevEps.filter((e) => completedEpisodes.includes(e.id)).length;
    return doneCount >= Math.ceil(prevEps.length * 0.5);
  };

  return (
    <div className="min-h-screen bg-gray-950 text-white flex flex-col">
      {/* Hero */}
      <div className="px-4 pt-10 pb-5 text-center">
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
          JLPT 회화 마스터 여정
        </motion.p>
      </div>

      {/* Today stats */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15 }}
        className="mx-4 mb-5 bg-white/5 rounded-2xl px-5 py-4 flex items-center justify-between"
      >
        <div>
          <div className="text-xs text-gray-500 mb-0.5">오늘의 퀘스트</div>
          <div className="text-xl font-bold text-white">
            {todayStudied > 0 ? `${todayStudied}턴 학습 완료 ✅` : '오늘 아직 시작 전!'}
          </div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-black text-orange-400">🔥{streak}</div>
          <div className="text-xs text-gray-500">연속</div>
        </div>
      </motion.div>

      {/* 맞춤 에피소드 섹션 */}
      {(generatedEpisodes.length > 0 || weakWords.length >= 3) && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.18 }}
          className="mx-4 mb-5"
        >
          <div className="text-xs text-gray-500 uppercase tracking-widest mb-2">🎯 맞춤 에피소드</div>
          <div className="flex flex-col gap-2">
            {generatedEpisodes
              .filter((ep) => !completedEpisodes.includes(ep.id))
              .slice(0, 3)
              .map((ep) => {
                const info = ep.content as { episode_info?: { title?: string; thumbnail?: string; description?: string } };
                const title = info.episode_info?.title ?? '맞춤 에피소드';
                const thumb = info.episode_info?.thumbnail ?? '🎯';
                const desc = info.episode_info?.description ?? ep.target_words.join(', ');
                return (
                  <button
                    key={ep.id}
                    onClick={() => router.push(`/shadow/play?ep=${ep.id}`)}
                    className="flex items-center gap-3 px-4 py-3 rounded-2xl text-left bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-900/40 transition-all active:scale-95"
                  >
                    <span className="text-2xl">{thumb}</span>
                    <div className="flex-1 min-w-0">
                      <div className="font-bold text-sm">{title}</div>
                      <div className="text-xs text-indigo-200 mt-0.5 truncate">{desc}</div>
                    </div>
                    <span className="text-sm shrink-0">⚔️</span>
                  </button>
                );
              })}

            {/* 생성 버튼 */}
            {weakWords.length >= 3 && (
              <button
                onClick={requestNewEpisode}
                disabled={isGenerating}
                className="flex items-center justify-center gap-2 px-4 py-3 rounded-2xl border border-dashed border-indigo-500/40 text-indigo-400 text-sm hover:bg-indigo-500/10 transition-all active:scale-95 disabled:opacity-50"
              >
                {isGenerating ? (
                  <><span className="animate-spin">⏳</span> 생성 중...</>
                ) : (
                  <>✨ 내 약점 단어로 새 에피소드 만들기</>
                )}
              </button>
            )}
          </div>
        </motion.div>
      )}

      {/* Current world + episode list */}
      <motion.div
        initial={{ opacity: 0, scale: 0.97 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.2 }}
        className="mx-4 mb-5"
      >
        <div className={`bg-gradient-to-br ${config.bgColor} rounded-3xl p-5 relative overflow-hidden`}>
          <div className="absolute top-3 right-4 text-5xl opacity-15 select-none">{config.emoji}</div>
          <div className="relative">
            <div className="text-xs font-semibold uppercase tracking-widest text-white/70 mb-0.5">
              현재 월드
            </div>
            <div className="text-2xl font-black text-white mb-0.5">
              {config.emoji} {config.name}
            </div>
            <div className="text-white/70 text-sm mb-4">{config.subtitle}</div>

            {/* Episode list inside world card */}
            <div className="flex flex-col gap-2">
              {currentEpisodes.map((ep) => {
                const done = completedEpisodes.includes(ep.id);
                const locked = ep.comingSoon;
                return (
                  <button
                    key={ep.id}
                    disabled={locked}
                    onClick={() => router.push(`/shadow/play?ep=${ep.id}`)}
                    className={`flex items-center gap-3 px-4 py-3 rounded-2xl text-left transition-all active:scale-95
                      ${locked
                        ? 'bg-black/10 opacity-50 cursor-not-allowed'
                        : done
                        ? 'bg-white/20 hover:bg-white/25'
                        : 'bg-white text-gray-900 hover:bg-gray-100 shadow'
                      }`}
                  >
                    <span className="text-2xl">{ep.thumbnail}</span>
                    <div className="flex-1 min-w-0">
                      <div className={`font-bold text-sm ${locked || done ? 'text-white' : 'text-gray-900'}`}>
                        {ep.title}
                      </div>
                      <div className={`text-xs mt-0.5 ${locked ? 'text-white/50' : done ? 'text-white/70' : 'text-gray-500'}`}>
                        {locked ? '준비 중...' : ep.description}
                      </div>
                    </div>
                    <span className="text-sm shrink-0">
                      {locked ? '🔒' : done ? '✅' : '⚔️'}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </motion.div>

      {/* World map */}
      <div className="px-4 mb-8">
        <div className="text-xs text-gray-500 uppercase tracking-widest mb-3">월드 맵</div>
        <div className="flex flex-col gap-2">
          {LEVEL_ORDER.map((level, idx) => {
            const wc = WORLD_CONFIG[level];
            const unlocked = isUnlocked(level);
            const isActive = level === currentWorld;
            const eps = episodesForWorld(level).filter((e) => !e.comingSoon);
            const doneCount = eps.filter((e) => completedEpisodes.includes(e.id)).length;
            const cleared = eps.length > 0 && doneCount === eps.length;

            return (
              <motion.button
                key={level}
                initial={{ x: -20, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ delay: 0.28 + idx * 0.06 }}
                disabled={!unlocked}
                onClick={() => {
                  if (unlocked) setCurrentWorld(level);
                }}
                className={`flex items-center gap-3 p-4 rounded-2xl transition-all active:scale-95 text-left
                  ${isActive ? 'bg-white/15 ring-2 ring-white/30' : 'bg-white/5 hover:bg-white/8'}
                  ${!unlocked ? 'opacity-40 cursor-not-allowed' : 'cursor-pointer'}
                `}
              >
                <div className="text-2xl">{cleared ? '✅' : unlocked ? wc.emoji : '🔒'}</div>
                <div className="flex-1 min-w-0">
                  <div className="font-bold text-white text-sm flex items-center gap-2">
                    {wc.name}
                    {isActive && (
                      <span className="text-xs bg-white/20 px-2 py-0.5 rounded-full">현재</span>
                    )}
                  </div>
                  <div className="text-xs text-gray-400">{wc.subtitle}</div>
                </div>
                {unlocked && eps.length > 0 && (
                  <div className="text-xs text-gray-400 shrink-0">
                    {doneCount}/{eps.length} 클리어
                  </div>
                )}
                {!unlocked && (
                  <div className="text-xs text-gray-600 shrink-0">이전 50%</div>
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
        className="mx-4 mb-8 text-center"
      >
        <p className="text-xs text-gray-600">
          🐉 최종 보스 <span className="text-gray-500 font-medium">龍の巣</span>이 기다리고 있다...
        </p>
      </motion.div>
    </div>
  );
}
