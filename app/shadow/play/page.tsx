'use client';

import { useState, useEffect, useCallback, useRef, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import ep001 from '@/data/shadow_ep001.json';
import ep002 from '@/data/shadow_ep002.json';
import ep003 from '@/data/shadow_ep003.json';
import ep004 from '@/data/shadow_ep004.json';

// ─── Types ───────────────────────────────────────────────────────────────────

interface Choice {
  id: string;
  ko: string;
  jp: string;
  reading: string;
  correct: boolean;
}

interface Turn {
  id: string;
  speaker: 'clerk';
  jp: string;
  reading: string;
  ko_meaning: string;
  type: 'listen' | 'choice';
  choices?: Choice[];
}

interface EpisodeData {
  episode_info: {
    id: string;
    title: string;
    setting_ko: string;
    thumbnail: string;
    difficulty: string;
  };
  dialogue_flow: Turn[];
}

// ─── Episode registry (static imports only — required for Next.js export) ────
const EPISODES: Record<string, EpisodeData> = {
  ep001: ep001 as EpisodeData,
  ep002: ep002 as EpisodeData,
  ep003: ep003 as EpisodeData,
  ep004: ep004 as EpisodeData,
};

// ─── TTS helper ──────────────────────────────────────────────────────────────

function speak(text: string, onEnd?: () => void): void {
  if (typeof window === 'undefined') return;
  window.speechSynthesis.cancel();
  const utt = new SpeechSynthesisUtterance(text);
  utt.lang = 'ja-JP';
  utt.rate = 0.85;
  if (onEnd) utt.onend = onEnd;
  window.speechSynthesis.speak(utt);
}

function stopTTS() {
  if (typeof window !== 'undefined') window.speechSynthesis.cancel();
}

// ─── Phase type ──────────────────────────────────────────────────────────────
// tts      → clerk TTS auto-playing, choices/shadow not yet visible
// choosing → TTS done, choice buttons visible
// shadow   → correct choice picked (or listen TTS done), Japanese shown to shadow
// done     → episode finished

type Phase = 'tts' | 'choosing' | 'shadow' | 'done';

// ─── Main play component ─────────────────────────────────────────────────────

function PlayContent() {
  const router = useRouter();
  const params = useSearchParams();
  const epId = params.get('ep') ?? 'ep001';
  const episode = EPISODES[epId] ?? EPISODES['ep001'];
  const turns = episode.dialogue_flow;

  const [turnIdx, setTurnIdx] = useState(0);
  const [phase, setPhase] = useState<Phase>('tts');
  const [wrongId, setWrongId] = useState<string | null>(null);
  const [chosenJp, setChosenJp] = useState<{ jp: string; reading: string } | null>(null);
  const [showReading, setShowReading] = useState(true);
  const didAutoPlay = useRef(false);

  const currentTurn = turns[turnIdx] as Turn;
  const isLast = turnIdx === turns.length - 1;

  // Auto-play clerk TTS at the start of each turn
  useEffect(() => {
    didAutoPlay.current = false;
    setPhase('tts');
    setWrongId(null);
    setChosenJp(null);

    // Small delay so AnimatePresence has time to swap the bubble
    const t = setTimeout(() => {
      didAutoPlay.current = true;
      speak(currentTurn.jp, () => {
        if (currentTurn.type === 'listen') {
          // For listen turns the "shadow" panel = repeat the clerk's line
          setChosenJp({ jp: currentTurn.jp, reading: currentTurn.reading });
          setPhase('shadow');
        } else {
          setPhase('choosing');
        }
      });
    }, 300);

    return () => {
      clearTimeout(t);
      stopTTS();
    };
  }, [turnIdx]); // eslint-disable-line react-hooks/exhaustive-deps

  // Clean up TTS on unmount
  useEffect(() => () => stopTTS(), []);

  const handleChoice = useCallback(
    (choice: Choice) => {
      if (choice.correct) {
        setChosenJp({ jp: choice.jp, reading: choice.reading });
        setPhase('shadow');
        speak(choice.jp);
      } else {
        setWrongId(choice.id);
        setTimeout(() => setWrongId(null), 500);
      }
    },
    []
  );

  const handleNext = useCallback(() => {
    if (isLast) {
      setPhase('done');
    } else {
      setTurnIdx((i) => i + 1);
    }
  }, [isLast]);

  // ── Complete screen ──────────────────────────────────────────────────────
  if (phase === 'done') {
    return (
      <div className="min-h-screen bg-gray-950 flex flex-col items-center justify-center gap-6 px-6 text-center">
        <motion.div
          initial={{ scale: 0.4, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: 'spring', stiffness: 200, damping: 14 }}
          className="text-7xl"
        >
          🎉
        </motion.div>
        <motion.div
          initial={{ y: 16, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.15 }}
        >
          <div className="text-white text-2xl font-black mb-2">에피소드 완료!</div>
          <div className="text-gray-400 text-sm">오늘도 훌륭하게 섀도잉했어요 💪</div>
        </motion.div>
        <motion.div
          initial={{ y: 16, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.25 }}
          className="flex flex-col gap-3 w-full max-w-xs"
        >
          <button
            onClick={() => {
              setTurnIdx(0);
              setPhase('tts');
            }}
            className="w-full py-4 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-2xl active:scale-95 transition-all"
          >
            한 번 더 🔁
          </button>
          <button
            onClick={() => router.push('/shadow')}
            className="w-full py-4 bg-white/10 hover:bg-white/20 text-white font-medium rounded-2xl active:scale-95 transition-all"
          >
            에피소드 목록
          </button>
        </motion.div>
      </div>
    );
  }

  // ── Main screen ──────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-gray-950 flex flex-col">
      {/* ── Header ── */}
      <div className="px-4 pt-6 pb-3 flex-none">
        <div className="max-w-sm mx-auto">
          <div className="flex items-center justify-between mb-2">
            <button
              onClick={() => { stopTTS(); router.push('/shadow'); }}
              className="text-gray-500 hover:text-gray-300 text-sm"
            >
              ← 나가기
            </button>
            <div className="text-xs text-gray-500">
              {turnIdx + 1} / {turns.length}
            </div>
            <button
              onClick={() => setShowReading((v) => !v)}
              className="text-xs text-gray-500 hover:text-gray-300"
            >
              {showReading ? '발음 숨기기' : '발음 보기'}
            </button>
          </div>

          {/* Progress bar */}
          <div className="h-1 bg-white/10 rounded-full overflow-hidden">
            <motion.div
              className="h-full bg-indigo-500 rounded-full"
              animate={{ width: `${((turnIdx + 1) / turns.length) * 100}%` }}
              transition={{ duration: 0.4 }}
            />
          </div>
        </div>
      </div>

      {/* ── Clerk bubble ── */}
      <div className="px-4 mt-6 max-w-sm mx-auto w-full">
        <div className="flex gap-3 items-start">
          {/* Avatar */}
          <div className="w-11 h-11 rounded-full bg-indigo-950 border border-indigo-800 flex items-center justify-center text-xl shrink-0 select-none">
            {episode.episode_info.thumbnail}
          </div>

          {/* Bubble */}
          <AnimatePresence mode="wait">
            <motion.div
              key={currentTurn.id}
              initial={{ opacity: 0, x: -12, scale: 0.97 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              exit={{ opacity: 0, scale: 0.97 }}
              transition={{ duration: 0.15 }}
              className="flex-1 bg-indigo-950/70 border border-indigo-800/40 rounded-2xl rounded-tl-sm px-4 py-3"
            >
              <div className="text-white text-xl font-bold leading-snug tracking-wide">
                {currentTurn.jp}
              </div>
              {showReading && (
                <div className="text-indigo-300/60 text-sm mt-1 font-medium">
                  {currentTurn.reading}
                </div>
              )}
              <div className="text-gray-400 text-sm mt-1">{currentTurn.ko_meaning}</div>

              {/* Re-play button */}
              <button
                onClick={() => speak(currentTurn.jp)}
                className="mt-2 text-xs text-indigo-400/60 hover:text-indigo-300 transition-colors"
              >
                🔊 다시 듣기
              </button>
            </motion.div>
          </AnimatePresence>
        </div>
      </div>

      {/* ── Spacer ── */}
      <div className="flex-1" />

      {/* ── Bottom panel ── */}
      <div className="px-4 pb-10 max-w-sm mx-auto w-full">
        <AnimatePresence mode="wait">

          {/* TTS loading indicator */}
          {phase === 'tts' && (
            <motion.div
              key="tts"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex justify-center py-8"
            >
              <div className="flex gap-1.5 items-center">
                {[0, 1, 2].map((i) => (
                  <motion.div
                    key={i}
                    className="w-2 h-2 rounded-full bg-indigo-400"
                    animate={{ y: [0, -6, 0] }}
                    transition={{ repeat: Infinity, duration: 0.6, delay: i * 0.12 }}
                  />
                ))}
              </div>
            </motion.div>
          )}

          {/* Choice buttons */}
          {phase === 'choosing' && currentTurn.choices && (
            <motion.div
              key="choices"
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 8 }}
              transition={{ duration: 0.18 }}
              className="flex flex-col gap-3"
            >
              <div className="text-xs text-gray-500 text-center mb-1 uppercase tracking-widest">
                뭐라고 대답할까요?
              </div>
              {currentTurn.choices.map((choice) => (
                <motion.button
                  key={choice.id}
                  animate={
                    wrongId === choice.id
                      ? { x: [-8, 8, -6, 6, -4, 4, 0] }
                      : {}
                  }
                  transition={{ duration: 0.35 }}
                  onClick={() => handleChoice(choice)}
                  className={`
                    w-full py-5 px-6 rounded-2xl font-bold text-lg text-left
                    active:scale-95 transition-all duration-100
                    ${wrongId === choice.id
                      ? 'bg-red-500/15 border-2 border-red-500/50 text-red-400'
                      : 'bg-white/8 border-2 border-white/10 text-white hover:bg-white/12 hover:border-white/20'
                    }
                  `}
                >
                  {choice.ko}
                </motion.button>
              ))}
            </motion.div>
          )}

          {/* Shadow panel */}
          {phase === 'shadow' && chosenJp && (
            <motion.div
              key="shadow"
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="flex flex-col gap-4"
            >
              {/* Japanese to shadow */}
              <div
                className={`rounded-2xl px-5 py-4 text-center border
                  ${currentTurn.type === 'choice'
                    ? 'bg-emerald-900/30 border-emerald-500/25'
                    : 'bg-white/5 border-white/10'
                  }`}
              >
                {currentTurn.type === 'choice' && (
                  <div className="text-xs text-emerald-400 uppercase tracking-widest mb-3">
                    ✓ 정답! 따라 말해보세요
                  </div>
                )}
                {currentTurn.type === 'listen' && (
                  <div className="text-xs text-gray-400 uppercase tracking-widest mb-3">
                    따라 말해보세요
                  </div>
                )}

                <div className="text-white text-2xl font-bold leading-snug tracking-wide">
                  {chosenJp.jp}
                </div>
                {showReading && (
                  <div
                    className={`text-sm mt-1.5 font-medium ${
                      currentTurn.type === 'choice' ? 'text-emerald-300/50' : 'text-gray-500'
                    }`}
                  >
                    {chosenJp.reading}
                  </div>
                )}

                <button
                  onClick={() => speak(chosenJp.jp)}
                  className={`mt-3 text-xs underline underline-offset-2 ${
                    currentTurn.type === 'choice'
                      ? 'text-emerald-400/60 hover:text-emerald-300'
                      : 'text-gray-500 hover:text-gray-300'
                  } transition-colors`}
                >
                  🔊 다시 듣기
                </button>
              </div>

              {/* CTA button */}
              <button
                onClick={handleNext}
                className="w-full py-5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-lg rounded-2xl active:scale-95 transition-all shadow-lg shadow-indigo-900/40"
              >
                소리 내어 읽은 후 터치하세요 →
              </button>
            </motion.div>
          )}

        </AnimatePresence>
      </div>
    </div>
  );
}

// ─── Page export (Suspense wrapper required for useSearchParams) ──────────────

export default function PlayPage() {
  return (
    <Suspense>
      <PlayContent />
    </Suspense>
  );
}
