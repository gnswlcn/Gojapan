'use client';

import { useParams, useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { useState, useEffect, useCallback } from 'react';
import { getLocation } from '@/lib/locations';
import { episodesForLocation } from '@/lib/episodes';
import { fetchEpisodesForLocation, type DbEpisode } from '@/lib/supabase';
import { useProgressStore, type DiscoveredWord } from '@/store/useProgressStore';
import type { LocationVocab } from '@/lib/locations';

const EDGE_FN_URL =
  'https://ormnjvmapbexmbwadnrb.supabase.co/functions/v1/generate-episode';

type GenEpContent = {
  episode_info?: {
    title?: string;
    thumbnail?: string;
    description?: string;
    location_id?: string;
  };
};

interface UnifiedWord {
  id: string;
  jp: string;
  reading: string;
  ko: string;
  isNew: boolean; // 에피소드에서 수확된 단어
}

export default function LocationClient() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();

  // ── Store ────────────────────────────────────────────────────────────────
  const {
    userId,
    wordProgress,
    completedEpisodes,
    pendingEpisodeRequestedAt,
    setPendingEpisodeRequest,
    locationWordPools,
    increaseConfidence,
    decreaseConfidence,
  } = useProgressStore();

  // ── Generated episodes ───────────────────────────────────────────────────
  const [genEps, setGenEps] = useState<DbEpisode[]>([]);
  const [loadingEps, setLoadingEps] = useState(true);

  const isGenerating =
    !!pendingEpisodeRequestedAt &&
    Date.now() - new Date(pendingEpisodeRequestedAt).getTime() < 5 * 60 * 1000;

  const loadEpisodes = useCallback(() => {
    fetchEpisodesForLocation(id).then((eps) => {
      if (
        pendingEpisodeRequestedAt &&
        eps.some(
          (ep) => new Date(ep.created_at) > new Date(pendingEpisodeRequestedAt)
        )
      ) {
        setPendingEpisodeRequest(null);
      }
      setGenEps(eps);
      setLoadingEps(false);
    });
  }, [id, pendingEpisodeRequestedAt, setPendingEpisodeRequest]);

  useEffect(() => {
    loadEpisodes();
  }, [loadEpisodes]);

  // Poll every 5s while generating
  useEffect(() => {
    if (!isGenerating) return;
    const interval = setInterval(loadEpisodes, 5000);
    return () => clearInterval(interval);
  }, [isGenerating, loadEpisodes]);

  // ── Location lookup ───────────────────────────────────────────────────────
  const loc = getLocation(id);

  if (!loc) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center">
        <div className="text-center">
          <div className="text-4xl mb-3">🗺️</div>
          <div className="text-gray-400 text-sm">장소를 찾을 수 없습니다</div>
          <button
            onClick={() => router.push('/')}
            className="mt-4 text-indigo-400 text-sm"
          >
            ← 홈으로
          </button>
        </div>
      </div>
    );
  }

  const staticEps = episodesForLocation(loc.id);

  // ── 단어 풀: 시드 + 에피소드에서 수확된 단어 ─────────────────────────────
  const discoveredPool: DiscoveredWord[] = locationWordPools[loc.id] ?? [];
  const discoveredJpSet = new Set(discoveredPool.map((w) => w.jp));
  const seedOnly: LocationVocab[] = loc.vocab.filter((v) => !discoveredJpSet.has(v.jp));

  const allWords: UnifiedWord[] = [
    ...seedOnly.map((v) => ({ ...v, isNew: false })),
    ...discoveredPool.map((w) => ({ ...w, isNew: true })),
  ];

  const totalWords = allWords.length;
  const knownCount = allWords.filter((w) => (wordProgress[w.id]?.confidence ?? 0) >= 3).length;
  const unknownWords = allWords.filter((w) => (wordProgress[w.id]?.confidence ?? 0) < 3);
  const weakWords: string[] = unknownWords.map((w) => `${w.jp}(${w.ko})`);

  // ── 에피소드 생성 요청 ───────────────────────────────────────────────────
  function requestEpisode() {
    if (isGenerating) return;
    setPendingEpisodeRequest(new Date().toISOString());
    fetch(EDGE_FN_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        userId,
        locationId: loc!.id,
        locationName: loc!.name_ko,
        locationVocab: allWords,
        weakWords,
      }),
    }).catch(console.error);
  }

  // ── 단어 탭: 알아요 ↔ 모르는 토글 ───────────────────────────────────────
  function toggleWord(wordId: string) {
    const conf = wordProgress[wordId]?.confidence ?? 0;
    if (conf >= 3) {
      decreaseConfidence(wordId);
    } else {
      increaseConfidence(wordId, 3);
    }
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
          className="flex items-center gap-4"
        >
          <div className="text-5xl">{loc.thumbnail}</div>
          <div>
            <div className="text-2xl font-black text-white">{loc.name_ko}</div>
            <div className="text-sm text-gray-400">{loc.name_jp}</div>
            <div className="text-xs text-gray-500 mt-0.5">{loc.description}</div>
          </div>
        </motion.div>
      </div>

      {/* ── 단어 체크리스트 ── */}
      <div className="px-4 mb-4">
        <div className="flex items-center justify-between mb-2">
          <div className="text-xs text-gray-500 uppercase tracking-widest">
            단어 {totalWords}개
          </div>
          <div className="text-xs text-gray-600">
            습득 <span className="text-emerald-400 font-bold">{knownCount}</span> / {totalWords}
          </div>
        </div>

        <p className="text-[11px] text-gray-600 mb-3">
          아는 단어를 탭해서 체크 → 모르는 단어만 드릴합니다
        </p>

        <div className="flex flex-col gap-1.5">
          {allWords.map((w, i) => {
            const conf = wordProgress[w.id]?.confidence ?? 0;
            const known = conf >= 3;
            return (
              <motion.button
                key={w.id}
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.015 }}
                onClick={() => toggleWord(w.id)}
                className={`flex items-center gap-3 px-4 py-3 rounded-2xl border transition-all active:scale-[0.98] text-left w-full ${
                  known
                    ? 'bg-emerald-950/40 border-emerald-800/40'
                    : 'bg-white/5 border-transparent'
                }`}
              >
                {/* 체크 원 */}
                <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 transition-all ${
                  known
                    ? 'bg-emerald-500 border-emerald-500'
                    : 'border-gray-600'
                }`}>
                  {known && <span className="text-white text-[10px] font-black leading-none">✓</span>}
                </div>

                {/* 단어 정보 */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className={`font-bold text-base ${known ? 'text-emerald-300' : 'text-white'}`}>
                      {w.jp}
                    </span>
                    <span className="text-gray-500 text-xs">{w.reading}</span>
                    {w.isNew && (
                      <span className="text-indigo-400/60 text-[10px] bg-indigo-900/30 px-1.5 py-0.5 rounded-full">
                        NEW
                      </span>
                    )}
                  </div>
                  <div className={`text-sm mt-0.5 ${known ? 'text-emerald-400/70' : 'text-gray-400'}`}>
                    {w.ko}
                  </div>
                </div>
              </motion.button>
            );
          })}
        </div>
      </div>

      {/* ── 드릴 CTA ── */}
      <div className="px-4 mb-6">
        {unknownWords.length > 0 ? (
          <motion.button
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            onClick={() => router.push(`/shadow/vocab-drill?loc=${loc.id}`)}
            className="w-full py-4 bg-indigo-600 hover:bg-indigo-500 text-white font-black text-base rounded-2xl active:scale-95 transition-all shadow-lg shadow-indigo-900/40"
          >
            모르는 단어 {unknownWords.length}개 드릴하기 →
          </motion.button>
        ) : totalWords > 0 ? (
          <div className="text-center py-3 text-emerald-400 text-sm font-bold">
            모든 단어를 알고 있어요! 에피소드를 바로 시작하세요 🎉
          </div>
        ) : null}
      </div>

      {/* ── Episodes ── */}
      <div className="px-4 flex-1">
        <div className="flex items-center justify-between mb-3">
          <div className="text-xs text-gray-500 uppercase tracking-widest">
            에피소드
          </div>
          <button
            onClick={requestEpisode}
            disabled={isGenerating}
            className="text-xs bg-indigo-600 hover:bg-indigo-500 disabled:bg-indigo-900/50 disabled:text-indigo-400/50 text-white px-3 py-1.5 rounded-full transition-all active:scale-95"
          >
            {isGenerating ? '⏳ 생성 중...' : '+ 새 에피소드'}
          </button>
        </div>

        {/* Generating banner */}
        {isGenerating && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="mb-3 bg-indigo-950/60 border border-indigo-500/30 rounded-2xl px-4 py-3 flex items-center gap-3"
          >
            <span className="animate-spin text-base">⏳</span>
            <div>
              <div className="text-indigo-300 text-sm font-bold">맞춤 에피소드 생성 중...</div>
              <div className="text-indigo-400/60 text-xs">완료되면 자동으로 추가돼요</div>
            </div>
          </motion.div>
        )}

        <div className="flex flex-col gap-2">
          {/* Static episodes */}
          {staticEps.map((ep, i) => {
            const done = completedEpisodes.includes(ep.id);
            return (
              <motion.button
                key={ep.id}
                initial={{ opacity: 0, x: -12 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.1 + i * 0.05 }}
                onClick={() => router.push(`/shadow/play?ep=${ep.id}`)}
                className="flex items-center gap-3 p-4 rounded-2xl bg-white/5 hover:bg-white/10 active:scale-95 transition-all text-left"
              >
                <div className="text-3xl shrink-0">{ep.thumbnail}</div>
                <div className="flex-1 min-w-0">
                  <div className="font-bold text-white text-sm flex items-center gap-2">
                    {ep.title}
                    {done && (
                      <span className="text-xs bg-emerald-500/20 text-emerald-400 px-1.5 py-0.5 rounded-full">
                        완료
                      </span>
                    )}
                  </div>
                  <div className="text-gray-400 text-xs mt-0.5">{ep.description}</div>
                  <div className="text-gray-600 text-xs mt-1">{ep.totalTurns}턴</div>
                </div>
                <span className="text-gray-600 shrink-0">›</span>
              </motion.button>
            );
          })}

          {/* Generated episodes */}
          {loadingEps ? (
            <div className="flex justify-center py-6">
              <div className="flex gap-1.5">
                {[0, 1, 2].map((i) => (
                  <motion.div
                    key={i}
                    className="w-1.5 h-1.5 rounded-full bg-indigo-400/50"
                    animate={{ y: [0, -4, 0] }}
                    transition={{ repeat: Infinity, duration: 0.6, delay: i * 0.12 }}
                  />
                ))}
              </div>
            </div>
          ) : (
            genEps.map((ep, i) => {
              const info = (ep.content as GenEpContent).episode_info;
              const done = completedEpisodes.includes(ep.id);
              return (
                <motion.button
                  key={ep.id}
                  initial={{ opacity: 0, x: -12 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.15 + i * 0.05 }}
                  onClick={() => router.push(`/shadow/play?ep=${ep.id}`)}
                  className="flex items-center gap-3 p-4 rounded-2xl bg-indigo-950/40 border border-indigo-800/30 hover:bg-indigo-950/60 active:scale-95 transition-all text-left"
                >
                  <div className="text-3xl shrink-0">{info?.thumbnail ?? '✨'}</div>
                  <div className="flex-1 min-w-0">
                    <div className="font-bold text-white text-sm flex items-center gap-2">
                      {info?.title ?? ep.id}
                      <span className="text-xs bg-indigo-500/20 text-indigo-400 px-1.5 py-0.5 rounded-full">
                        AI 생성
                      </span>
                      {done && (
                        <span className="text-xs bg-emerald-500/20 text-emerald-400 px-1.5 py-0.5 rounded-full">
                          완료
                        </span>
                      )}
                    </div>
                    {info?.description && (
                      <div className="text-gray-400 text-xs mt-0.5">{info.description}</div>
                    )}
                  </div>
                  <span className="text-gray-600 shrink-0">›</span>
                </motion.button>
              );
            })
          )}

          {/* Empty state */}
          {staticEps.length === 0 &&
            genEps.length === 0 &&
            !loadingEps &&
            !isGenerating && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-center py-10"
              >
                <div className="text-4xl mb-3">📭</div>
                <div className="text-gray-500 text-sm">아직 에피소드가 없어요</div>
                <div className="text-gray-600 text-xs mt-1">
                  위 버튼으로 첫 에피소드를 만들어보세요!
                </div>
              </motion.div>
            )}
        </div>
      </div>
    </div>
  );
}
