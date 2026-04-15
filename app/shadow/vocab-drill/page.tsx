'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { getLocation } from '@/lib/locations';
import { useProgressStore, type DiscoveredWord } from '@/store/useProgressStore';
import type { LocationVocab } from '@/lib/locations';

// ─── Drill word type ──────────────────────────────────────────────────────────

interface DrillWord {
  id: string;
  jp: string;
  reading: string;
  ko: string;
}

// ─── Main ────────────────────────────────────────────────────────────────────

function VocabDrillContent() {
  const router = useRouter();
  const params = useSearchParams();
  const locId = params.get('loc') ?? '';

  const {
    wordProgress,
    increaseConfidence,
    decreaseConfidence,
    locationWordPools,
  } = useProgressStore();

  const loc = getLocation(locId);

  // ── 모르는 단어만 뽑기 ──────────────────────────────────────────────────
  const [drillWords, setDrillWords] = useState<DrillWord[]>([]);

  useEffect(() => {
    if (!loc) return;
    const discoveredPool: DiscoveredWord[] = locationWordPools[loc.id] ?? [];
    const discoveredJpSet = new Set(discoveredPool.map((w) => w.jp));
    const seedOnly: LocationVocab[] = loc.vocab.filter((v) => !discoveredJpSet.has(v.jp));

    const all: DrillWord[] = [
      ...seedOnly.map((v) => ({ id: v.id, jp: v.jp, reading: v.reading, ko: v.ko })),
      ...discoveredPool.map((w) => ({ id: w.id, jp: w.jp, reading: w.reading, ko: w.ko })),
    ];

    const unknown = all.filter((w) => (wordProgress[w.id]?.confidence ?? 0) < 3);
    setDrillWords(unknown.length > 0 ? unknown : all);
  }, [loc?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Drill state ───────────────────────────────────────────────────────────
  const [idx, setIdx] = useState(0);
  const [done, setDone] = useState(false);
  const [knownCount, setKnownCount] = useState(0);
  const [ready, setReady] = useState(false); // tap-through guard

  // 카드 전환 시 버튼 비활성화 (탭 연타 방지)
  useEffect(() => {
    setReady(false);
    const t = setTimeout(() => setReady(true), 280);
    return () => clearTimeout(t);
  }, [idx]);

  if (!loc) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center">
        <div className="text-center">
          <div className="text-4xl mb-3">❓</div>
          <div className="text-gray-400 text-sm">장소를 찾을 수 없습니다</div>
          <button onClick={() => router.push('/')} className="mt-4 text-indigo-400 text-sm">
            ← 홈으로
          </button>
        </div>
      </div>
    );
  }

  if (drillWords.length === 0) {
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

  const current = drillWords[idx];
  const progress = (idx / drillWords.length) * 100;

  function handleKnown() {
    if (!ready) return;
    increaseConfidence(current.id, 1);
    setKnownCount((n) => n + 1);
    advance();
  }

  function handleUnknown() {
    if (!ready) return;
    decreaseConfidence(current.id);
    advance();
  }

  function advance() {
    if (idx >= drillWords.length - 1) {
      setDone(true);
    } else {
      setIdx((i) => i + 1);
    }
  }

  // ── Done screen ───────────────────────────────────────────────────────────
  if (done) {
    const unknownCount = drillWords.length - knownCount;
    return (
      <div className="min-h-screen bg-gray-950 text-white flex flex-col items-center justify-center px-6 text-center">
        <motion.div
          initial={{ scale: 0.5, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: 'spring', stiffness: 200, damping: 14 }}
          className="text-6xl mb-5"
        >
          {loc.thumbnail}
        </motion.div>

        <motion.div
          initial={{ y: 16, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.15 }}
          className="mb-8"
        >
          <div className="text-xl font-black mb-4">드릴 완료!</div>

          <div className="flex gap-4 justify-center mb-4">
            <div className="bg-emerald-950/50 border border-emerald-800/40 rounded-2xl px-5 py-3 text-center">
              <div className="text-2xl font-black text-emerald-400">{knownCount}</div>
              <div className="text-xs text-gray-500 mt-1">외웠어요</div>
            </div>
            <div className="bg-red-950/50 border border-red-800/30 rounded-2xl px-5 py-3 text-center">
              <div className="text-2xl font-black text-red-400">{unknownCount}</div>
              <div className="text-xs text-gray-500 mt-1">더 연습 필요</div>
            </div>
          </div>

          <p className="text-gray-400 text-sm">
            에피소드 중 모르는 단어가 자동으로 카드로 등장해요
          </p>
        </motion.div>

        <motion.div
          initial={{ y: 16, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.25 }}
          className="flex flex-col gap-3 w-full max-w-xs"
        >
          <button
            onClick={() => router.push(`/location/${locId}`)}
            className="w-full py-5 bg-indigo-600 hover:bg-indigo-500 text-white font-black text-lg rounded-2xl active:scale-95 transition-all shadow-lg shadow-indigo-900/40"
          >
            에피소드 선택하기 →
          </button>
          {unknownCount > 0 && (
            <button
              onClick={() => { setIdx(0); setDone(false); setKnownCount(0); }}
              className="w-full py-4 bg-white/8 text-white rounded-2xl active:scale-95 transition-all"
            >
              다시 드릴하기 🔁
            </button>
          )}
        </motion.div>
      </div>
    );
  }

  // ── Drill card screen ─────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-gray-950 text-white flex flex-col">

      {/* ── Header ── */}
      <div className="px-4 pt-6 pb-3 flex-none">
        <div className="max-w-sm mx-auto">
          <div className="flex items-center justify-between mb-3">
            <button
              onClick={() => router.push(`/location/${locId}`)}
              className="text-gray-500 hover:text-gray-300 text-sm"
            >
              ← 뒤로
            </button>
            <div className="text-xs text-gray-500 font-medium">
              {idx + 1} / {drillWords.length}
            </div>
            <button
              onClick={() => router.push(`/location/${locId}`)}
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
          {loc.thumbnail} {loc.name_ko} · 이 단어, 알고 있나요?
        </span>
      </div>

      {/* ── Word card ── */}
      <div className="flex-1 flex flex-col items-center justify-center px-6">
        <AnimatePresence mode="wait">
          <motion.div
            key={current.id}
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
            disabled={!ready}
            className="flex-1 py-5 rounded-2xl bg-red-500/10 border border-red-500/25 text-red-400 font-bold text-base active:scale-95 transition-all disabled:opacity-40"
          >
            몰라요
          </motion.button>
          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={handleKnown}
            disabled={!ready}
            className="flex-1 py-5 rounded-2xl bg-emerald-500/10 border border-emerald-500/25 text-emerald-400 font-bold text-base active:scale-95 transition-all disabled:opacity-40"
          >
            알아요 ✓
          </motion.button>
        </div>
      </div>
    </div>
  );
}

export default function VocabDrillPage() {
  return <Suspense><VocabDrillContent /></Suspense>;
}
