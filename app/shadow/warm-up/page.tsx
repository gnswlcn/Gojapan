'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import ep001 from '@/data/shadow_ep001.json';
import ep002 from '@/data/shadow_ep002.json';
import ep003 from '@/data/shadow_ep003.json';
import ep004 from '@/data/shadow_ep004.json';
import { useProgressStore } from '@/store/useProgressStore';
import { fetchEpisodeById } from '@/lib/supabase';

// ─── Types ───────────────────────────────────────────────────────────────────

interface VocabWord {
  id?: string;
  vocab_id?: string;
  kanji?: string;
  jp?: string;
  reading: string;
  meaning_ko?: string;
  ko?: string;
}

interface EpisodeData {
  episode_info: { id: string; title: string; thumbnail: string };
  vocabulary: VocabWord[];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  [key: string]: any;
}

interface CheckWord {
  wordId: string;
  jp: string;
  reading: string;
  ko: string;
}

const STATIC_EPISODES: Record<string, EpisodeData> = {
  ep001: ep001 as EpisodeData,
  ep002: ep002 as EpisodeData,
  ep003: ep003 as EpisodeData,
  ep004: ep004 as EpisodeData,
};

// ─── Main ────────────────────────────────────────────────────────────────────

function WarmUpContent() {
  const router = useRouter();
  const params = useSearchParams();
  const epId = params.get('ep') ?? 'ep001';

  // ── Episode loading ───────────────────────────────────────────────────────
  const [episode, setEpisode] = useState<EpisodeData | null>(
    STATIC_EPISODES[epId] ?? null
  );
  const [loading, setLoading] = useState(!STATIC_EPISODES[epId]);

  useEffect(() => {
    if (STATIC_EPISODES[epId]) {
      setEpisode(STATIC_EPISODES[epId]);
      setLoading(false);
      return;
    }
    setLoading(true);
    fetchEpisodeById(epId).then((data) => {
      if (data) setEpisode(data.content as unknown as EpisodeData);
      setLoading(false);
    });
  }, [epId]);

  // ── Store ─────────────────────────────────────────────────────────────────
  const { increaseConfidence } = useProgressStore();

  // ── Derived vocab list ────────────────────────────────────────────────────
  const [words, setWords] = useState<CheckWord[]>([]);
  const [idx, setIdx] = useState(0);
  const [done, setDone] = useState(false);
  const [knownCount, setKnownCount] = useState(0);

  useEffect(() => {
    if (!episode) return;
    const list: CheckWord[] = (episode.vocabulary as VocabWord[])
      .map((v) => ({
        wordId: (v.id ?? v.vocab_id ?? '') as string,
        jp: (v.kanji ?? v.jp ?? '') as string,
        reading: v.reading,
        ko: (v.meaning_ko ?? v.ko ?? '') as string,
      }))
      .filter((w) => w.wordId && w.jp && w.ko);
    setWords(list);
    setIdx(0);
    setDone(false);
    setKnownCount(0);
  }, [episode]);

  // ── Handlers ──────────────────────────────────────────────────────────────
  function handleKnown() {
    // confidence → 3 이상으로 설정해서 에피소드 중 vocab 카드 skip
    increaseConfidence(words[idx].wordId, 3);
    setKnownCount((n) => n + 1);
    advance();
  }

  function handleUnknown() {
    // confidence 유지 (0) → 에피소드 중 vocab 카드 등장
    advance();
  }

  function advance() {
    if (idx >= words.length - 1) {
      setDone(true);
    } else {
      setIdx((i) => i + 1);
    }
  }

  function startEpisode() {
    router.push(`/shadow/play?ep=${epId}`);
  }

  // ── Loading ───────────────────────────────────────────────────────────────
  if (loading || !episode) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center">
        <div className="flex gap-1.5">
          {[0, 1, 2].map((i) => (
            <motion.div
              key={i}
              className="w-2 h-2 rounded-full bg-indigo-400"
              animate={{ y: [0, -6, 0] }}
              transition={{ repeat: Infinity, duration: 0.6, delay: i * 0.12 }}
            />
          ))}
        </div>
      </div>
    );
  }

  if (words.length === 0) {
    // 이 에피소드에 vocab 없음 → 바로 시작
    router.replace(`/shadow/play?ep=${epId}`);
    return null;
  }

  const current = words[idx];
  const progress = ((idx) / words.length) * 100;

  // ── Done screen ───────────────────────────────────────────────────────────
  if (done) {
    const unknownCount = words.length - knownCount;
    return (
      <div className="min-h-screen bg-gray-950 text-white flex flex-col items-center justify-center px-6 text-center">
        <motion.div
          initial={{ scale: 0.5, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: 'spring', stiffness: 200, damping: 14 }}
          className="text-6xl mb-5"
        >
          {episode.episode_info.thumbnail}
        </motion.div>

        <motion.div
          initial={{ y: 16, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.15 }}
          className="mb-8"
        >
          <div className="text-xl font-black mb-3">단어 확인 완료!</div>

          <div className="flex gap-4 justify-center mb-4">
            <div className="bg-emerald-950/50 border border-emerald-800/40 rounded-2xl px-5 py-3 text-center">
              <div className="text-2xl font-black text-emerald-400">{knownCount}</div>
              <div className="text-xs text-gray-500 mt-1">이미 알아요</div>
            </div>
            <div className="bg-indigo-950/50 border border-indigo-800/40 rounded-2xl px-5 py-3 text-center">
              <div className="text-2xl font-black text-indigo-400">{unknownCount}</div>
              <div className="text-xs text-gray-500 mt-1">에피소드에서 학습</div>
            </div>
          </div>

          {unknownCount > 0 ? (
            <p className="text-gray-400 text-sm">
              모르는 <span className="text-indigo-300 font-bold">{unknownCount}개</span> 단어가 에피소드 중 카드로 등장해요
            </p>
          ) : (
            <p className="text-gray-400 text-sm">모든 단어를 알고 있어요! 에피소드를 즐겨보세요 🎉</p>
          )}
        </motion.div>

        <motion.button
          initial={{ y: 16, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.25 }}
          onClick={startEpisode}
          className="w-full max-w-xs py-5 bg-indigo-600 hover:bg-indigo-500 text-white font-black text-lg rounded-2xl active:scale-95 transition-all shadow-lg shadow-indigo-900/40"
        >
          에피소드 시작 →
        </motion.button>
      </div>
    );
  }

  // ── Vocab check screen ────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-gray-950 text-white flex flex-col">

      {/* ── Header ── */}
      <div className="px-4 pt-6 pb-3 flex-none">
        <div className="max-w-sm mx-auto">
          <div className="flex items-center justify-between mb-3">
            <button
              onClick={() => router.back()}
              className="text-gray-500 hover:text-gray-300 text-sm"
            >
              ← 뒤로
            </button>
            <div className="text-xs text-gray-500">
              {idx + 1} / {words.length}
            </div>
            <button
              onClick={() => router.push(`/shadow/play?ep=${epId}`)}
              className="text-xs text-gray-600 hover:text-gray-400"
            >
              건너뛰기
            </button>
          </div>

          {/* Progress bar */}
          <div className="h-1 bg-white/10 rounded-full overflow-hidden">
            <motion.div
              className="h-full bg-indigo-500 rounded-full"
              animate={{ width: `${progress}%` }}
              transition={{ duration: 0.3 }}
            />
          </div>
        </div>
      </div>

      {/* ── Label ── */}
      <div className="text-center mt-4 mb-2">
        <span className="text-xs text-gray-500 uppercase tracking-widest">
          이 단어, 알고 있나요?
        </span>
      </div>

      {/* ── Word card ── */}
      <div className="flex-1 flex flex-col items-center justify-center px-6">
        <AnimatePresence mode="wait">
          <motion.div
            key={current.wordId}
            initial={{ opacity: 0, x: 24, scale: 0.97 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, x: -24, scale: 0.97 }}
            transition={{ duration: 0.18 }}
            className="w-full max-w-sm bg-white/6 border border-white/10 rounded-3xl px-8 py-10 text-center"
          >
            <div className="text-6xl font-black text-white mb-3 tracking-tight leading-none">
              {current.jp}
            </div>
            <div className="text-gray-400 text-lg mb-6">{current.reading}</div>
            <div className="w-12 h-px bg-white/15 mx-auto mb-6" />
            <div className="text-white text-2xl font-bold">{current.ko}</div>
          </motion.div>
        </AnimatePresence>
      </div>

      {/* ── Buttons ── */}
      <div className="px-6 pb-14 max-w-sm mx-auto w-full">
        <div className="flex gap-3">
          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={handleUnknown}
            className="flex-1 py-5 rounded-2xl bg-red-500/10 border border-red-500/25 text-red-400 font-bold text-base active:scale-95 transition-all"
          >
            몰라요
          </motion.button>
          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={handleKnown}
            className="flex-1 py-5 rounded-2xl bg-emerald-500/10 border border-emerald-500/25 text-emerald-400 font-bold text-base active:scale-95 transition-all"
          >
            알아요 ✓
          </motion.button>
        </div>
      </div>
    </div>
  );
}

export default function WarmUpPage() {
  return <Suspense><WarmUpContent /></Suspense>;
}
