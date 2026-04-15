'use client';

import { useState, useEffect, useCallback, useRef, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import ep001 from '@/data/shadow_ep001.json';
import ep002 from '@/data/shadow_ep002.json';
import ep003 from '@/data/shadow_ep003.json';
import ep004 from '@/data/shadow_ep004.json';
import { useProgressStore, type DiscoveredWord } from '@/store/useProgressStore';
import { fetchEpisodeById } from '@/lib/supabase';
import { ALL_EPISODES } from '@/lib/episodes';

// ─── Types ───────────────────────────────────────────────────────────────────

interface NpcConfig {
  name: string;
  image?: string;          // eyes open (normal)
  image_blink?: string;    // eyes closed (blink)
  image_attack?: string;   // attack pose
  friendly_emoji: string;
  attack_emoji: string;
  weapon_emoji: string;
  attack_messages: string[];
}

// Supports both ep001 format (id/kanji/meaning_ko) and ep002-004 format (vocab_id/jp/ko)
interface VocabWord {
  id?: string;
  vocab_id?: string;
  kanji?: string;
  jp?: string;
  reading: string;
  meaning_ko?: string;
  ko?: string;
}

interface NormalizedVocab {
  wordId: string;
  display: string;
  reading: string;
  meaning: string;
}

function normalizeVocab(v: VocabWord): NormalizedVocab {
  return {
    wordId: (v.id ?? v.vocab_id) as string,
    display: (v.kanji ?? v.jp) as string,
    reading: v.reading,
    meaning: (v.meaning_ko ?? v.ko) as string,
  };
}

interface Choice {
  id: string;
  jp: string;
  jp_ruby?: string;
  reading: string;
  ko?: string;
  correct: boolean;
}

interface Turn {
  id: string;
  speaker: 'clerk';
  jp: string;
  jp_ruby?: string;
  reading: string;
  ko_meaning: string;
  type: 'listen' | 'choice';
  vocab_ids?: string[];
  situation?: string;    // legacy field
  thought_ko?: string;   // new field (content agent naming)
  choices?: Choice[];
}

interface EpisodeData {
  episode_info: { id: string; title: string; thumbnail: string };
  npc: NpcConfig;
  vocabulary: VocabWord[];
  dialogue_flow: Turn[];
}

const STATIC_EPISODES: Record<string, EpisodeData> = {
  ep001: ep001 as EpisodeData,
  ep002: ep002 as EpisodeData,
  ep003: ep003 as EpisodeData,
  ep004: ep004 as EpisodeData,
};

// ─── NPC avatar ──────────────────────────────────────────────────────────────

interface NpcAvatarProps {
  npc: NpcConfig;
  mood: 'friendly' | 'attacking';
}

function NpcAvatar({ npc, mood }: NpcAvatarProps) {
  const shakeAnim = mood === 'attacking'
    ? { x: [-6, 6, -5, 5, -3, 3, 0], scale: [1, 1.08, 1, 1.08, 1] }
    : { scale: 1, x: 0 };

  return (
    <motion.div
      animate={shakeAnim}
      transition={{ duration: 0.5 }}
      className="w-12 h-12 rounded-full bg-indigo-950 border-2 border-indigo-800/60 flex items-center justify-center text-2xl shrink-0 select-none"
    >
      {mood === 'attacking' ? npc.attack_emoji : npc.friendly_emoji}
    </motion.div>
  );
}

// ─── Ruby text renderer ───────────────────────────────────────────────────────

function RubyText({ text }: { text: string }) {
  const parts = text.split(/(\{[^|{}]+\|[^|{}]+\})/g);
  return (
    <>
      {parts.map((part, i) => {
        const m = part.match(/^\{(.+)\|(.+)\}$/);
        if (m) {
          return (
            <ruby key={i}>
              {m[1]}
              <rt className="text-[0.55em] text-indigo-300/70">{m[2]}</rt>
            </ruby>
          );
        }
        return <span key={i}>{part}</span>;
      })}
    </>
  );
}

// ─── TTS ─────────────────────────────────────────────────────────────────────

function stopTTS() {
  if (typeof window !== 'undefined') window.speechSynthesis.cancel();
}

function speakWithFallback(text: string, onDone: () => void): () => void {
  if (typeof window === 'undefined') {
    const t = setTimeout(onDone, 400);
    return () => clearTimeout(t);
  }
  window.speechSynthesis.cancel();
  const utt = new SpeechSynthesisUtterance(text);
  utt.lang = 'ja-JP';
  utt.rate = 0.85;
  const maxWait = Math.min(4000, Math.max(1500, text.length * 120));
  let finished = false;
  const finish = () => {
    if (finished) return;
    finished = true;
    clearTimeout(fallback);
    onDone();
  };
  const fallback = setTimeout(finish, maxWait);
  utt.onend = finish;
  utt.onerror = finish;
  window.speechSynthesis.speak(utt);
  return () => { finished = true; clearTimeout(fallback); stopTTS(); };
}

function speak(text: string) {
  if (typeof window === 'undefined') return;
  window.speechSynthesis.cancel();
  const utt = new SpeechSynthesisUtterance(text);
  utt.lang = 'ja-JP';
  utt.rate = 0.85;
  window.speechSynthesis.speak(utt);
}

// ─── Phase / mood ─────────────────────────────────────────────────────────────

type Phase = 'tts' | 'vocab' | 'choosing' | 'shadow' | 'done';
type NpcMood = 'friendly' | 'attacking';

const MAX_HP = 3;

// ─── Component ───────────────────────────────────────────────────────────────

function PlayContent() {
  const router = useRouter();
  const params = useSearchParams();
  const epId = params.get('ep') ?? 'ep001';

  // ── Episode loading (static or Supabase) ─────────────────────────────────
  const [episode, setEpisode] = useState<EpisodeData | null>(STATIC_EPISODES[epId] ?? null);
  const [loadingEpisode, setLoadingEpisode] = useState(!STATIC_EPISODES[epId]);

  useEffect(() => {
    if (STATIC_EPISODES[epId]) { setEpisode(STATIC_EPISODES[epId]); setLoadingEpisode(false); return; }
    setLoadingEpisode(true);
    fetchEpisodeById(epId).then((data) => {
      if (data) setEpisode(data.content as unknown as EpisodeData);
      setLoadingEpisode(false);
    });
  }, [epId]);

  const {
    wordProgress,
    increaseConfidence,
    decreaseConfidence,
    markEpisodeComplete,
    recordDailyStudy,
    addWordsToLocation,
  } = useProgressStore();

  // ── Core state ──────────────────────────────────────────────────────────
  const [sessionKey, setSessionKey] = useState(0);
  const [turnIdx, setTurnIdx] = useState(0);
  const [phase, setPhase] = useState<Phase>('tts');
  const [chosenJp, setChosenJp] = useState<{ jp: string; reading: string; jp_ruby?: string; ko?: string } | null>(null);
  const [wrongChoice, setWrongChoice] = useState<Choice | null>(null);

  // ── Vocab queue ─────────────────────────────────────────────────────────
  const [vocabQueue, setVocabQueue] = useState<NormalizedVocab[]>([]);
  const [afterVocabPhase, setAfterVocabPhase] = useState<'choosing' | 'shadow'>('choosing');

  // ── HP / NPC mood ────────────────────────────────────────────────────────
  const [hp, setHp] = useState(MAX_HP);
  const [npcMood, setNpcMood] = useState<NpcMood>('friendly');
  const [attackMsg, setAttackMsg] = useState('');
  const [attackPending, setAttackPending] = useState(false);
  const [isDead, setIsDead] = useState(false);
  const attackTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // ── Stats ────────────────────────────────────────────────────────────────
  const [vocabLearned, setVocabLearned] = useState(0);

  // ── Advance after TTS ────────────────────────────────────────────────────
  const advanceAfterTTS = useCallback(
    (turn: Turn) => {
      const vocab = episode?.vocabulary ?? [];
      const unknownVocab = (turn.vocab_ids ?? [])
        .map((vid) => (vocab as VocabWord[]).find((v) => v.id === vid || v.vocab_id === vid))
        .filter((v): v is VocabWord => !!v)
        .map(normalizeVocab)
        .filter((v) => (wordProgress[v.wordId]?.confidence ?? 0) < 3);

      const target: 'choosing' | 'shadow' = turn.type === 'listen' ? 'shadow' : 'choosing';
      if (turn.type === 'listen') {
        setChosenJp({ jp: turn.jp, reading: turn.reading, jp_ruby: turn.jp_ruby });
      }

      if (unknownVocab.length > 0) {
        setVocabQueue(unknownVocab);
        setAfterVocabPhase(target);
        setPhase('vocab');
      } else {
        setPhase(target);
      }
    },
    [episode?.vocabulary, wordProgress]
  );

  // ── TTS auto-play ────────────────────────────────────────────────────────
  useEffect(() => {
    const turn = episode?.dialogue_flow[turnIdx] as Turn | undefined;
    if (!turn) return;

    setPhase('tts');
    setChosenJp(null);
    setVocabQueue([]);

    let cleanup: (() => void) | undefined;
    const t = setTimeout(() => {
      cleanup = speakWithFallback(turn.jp, () => advanceAfterTTS(turn));
    }, 300);

    return () => { clearTimeout(t); cleanup?.(); };
  }, [turnIdx, sessionKey, episode]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => () => {
    stopTTS();
    if (attackTimerRef.current) clearTimeout(attackTimerRef.current);
  }, []);

  // ── Restart ──────────────────────────────────────────────────────────────
  const restart = useCallback(() => {
    if (attackTimerRef.current) clearTimeout(attackTimerRef.current);
    setHp(MAX_HP);
    setNpcMood('friendly');
    setAttackPending(false);
    setIsDead(false);
    setAttackMsg('');
    setVocabLearned(0);
    setWrongChoice(null);
    setTurnIdx(0);
    setSessionKey((k) => k + 1);
  }, []);

  // ── Vocab handlers ───────────────────────────────────────────────────────
  const dismissVocab = useCallback(
    (known: boolean) => {
      const word = vocabQueue[0];
      if (known) { increaseConfidence(word.wordId); setVocabLearned((n) => n + 1); }
      else decreaseConfidence(word.wordId);
      const rest = vocabQueue.slice(1);
      if (rest.length === 0) setPhase(afterVocabPhase);
      else setVocabQueue(rest);
    },
    [vocabQueue, afterVocabPhase, increaseConfidence, decreaseConfidence]
  );

  // ── Confirm attack popup ─────────────────────────────────────────────────
  const confirmAttack = useCallback(() => {
    setAttackPending(false);
    if (hp <= 0) setIsDead(true);
  }, [hp]);

  // ── Choice handler ───────────────────────────────────────────────────────
  const handleChoice = useCallback(
    (choice: Choice) => {
      if (npcMood === 'attacking' || attackPending) return;
      const attackMessages = episode?.npc.attack_messages ?? [];

      if (choice.correct) {
        setChosenJp({ jp: choice.jp, reading: choice.reading, jp_ruby: choice.jp_ruby, ko: choice.ko });
        setWrongChoice(null);
        setPhase('shadow');
        speak(choice.jp);
      } else {
        setWrongChoice(choice);
        const newHp = hp - 1;
        setHp(newHp);
        const msg = attackMessages[Math.floor(Math.random() * attackMessages.length)];
        setAttackMsg(msg);
        setNpcMood('attacking');
        setAttackPending(true);
        stopTTS();

        if (attackTimerRef.current) clearTimeout(attackTimerRef.current);
        attackTimerRef.current = setTimeout(() => { setNpcMood('friendly'); }, 1600);
      }
    },
    [hp, episode?.npc.attack_messages, npcMood, attackPending]
  );

  // ── Next turn ────────────────────────────────────────────────────────────
  const handleNext = useCallback(() => {
    const flow = episode?.dialogue_flow ?? [];
    const isLast = turnIdx === flow.length - 1;
    setWrongChoice(null);
    if (isLast) {
      const episodeId = episode?.episode_info.id ?? epId;
      markEpisodeComplete(episodeId);
      recordDailyStudy(flow.length, vocabLearned);

      // ── 에피소드 완료: vocab을 장소 pool에 수확 ──────────────────────────
      const epInfo = episode?.episode_info as
        | { id: string; title: string; thumbnail: string; location_id?: string }
        | undefined;
      const locationId =
        epInfo?.location_id ??
        ALL_EPISODES.find((e) => e.id === episodeId)?.locationId;

      if (locationId && episode?.vocabulary) {
        const discovered: DiscoveredWord[] = (episode.vocabulary as VocabWord[])
          .map((v) => ({
            id: (v.id ?? v.vocab_id ?? '') as string,
            jp: (v.kanji ?? v.jp ?? '') as string,
            reading: v.reading,
            ko: (v.meaning_ko ?? v.ko ?? '') as string,
          }))
          .filter((w) => w.id && w.jp && w.reading && w.ko);
        addWordsToLocation(locationId, discovered);
      }

      setPhase('done');
    } else {
      setTurnIdx((i) => i + 1);
    }
  }, [episode, epId, turnIdx, vocabLearned, markEpisodeComplete, recordDailyStudy, addWordsToLocation]);

  // ── Loading screen (after all hooks) ────────────────────────────────────
  if (loadingEpisode || !episode) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center">
        <div className="flex gap-1.5">
          {[0, 1, 2].map((i) => (
            <motion.div key={i} className="w-2 h-2 rounded-full bg-indigo-400"
              animate={{ y: [0, -6, 0] }}
              transition={{ repeat: Infinity, duration: 0.6, delay: i * 0.12 }} />
          ))}
        </div>
      </div>
    );
  }

  // ── Derived values (episode guaranteed non-null here) ────────────────────
  const turns = episode.dialogue_flow;
  const npc = episode.npc;
  const currentTurn = turns[turnIdx] as Turn;
  const isLast = turnIdx === turns.length - 1;

  // ─────────────────────────────────────────────────────────────────────────
  // ── Done screen ──────────────────────────────────────────────────────────
  if (phase === 'done') {
    return (
      <div className="min-h-screen bg-gray-950 flex flex-col items-center justify-center gap-6 px-6 text-center">
        <motion.div initial={{ scale: 0.4, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
          transition={{ type: 'spring', stiffness: 200, damping: 14 }} className="text-7xl">🎉</motion.div>
        <motion.div initial={{ y: 16, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.15 }}>
          <div className="text-white text-2xl font-black mb-2">에피소드 클리어!</div>
          <div className="text-gray-400 text-sm">
            단어 <span className="text-indigo-300 font-bold">{vocabLearned}개</span> 획득 ·
            잔여 HP <span className="text-red-400 font-bold">{'❤️'.repeat(hp)}</span>
          </div>
        </motion.div>
        <motion.div initial={{ y: 16, opacity: 0 }} animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.25 }} className="flex flex-col gap-3 w-full max-w-xs">
          <button onClick={restart}
            className="w-full py-4 bg-indigo-600 text-white font-bold rounded-2xl active:scale-95 transition-all">
            한 번 더 🔁
          </button>
          <button onClick={() => router.push('/')}
            className="w-full py-4 bg-white/10 text-white rounded-2xl active:scale-95 transition-all">
            홈으로
          </button>
        </motion.div>
      </div>
    );
  }

  // thought bubble: support both thought_ko (new) and situation (legacy)
  const thoughtText = currentTurn.thought_ko ?? currentTurn.situation;

  // ─────────────────────────────────────────────────────────────────────────
  // ── Main screen ──────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-gray-950 flex flex-col">

      {/* ── Attack flash overlay ── */}
      <AnimatePresence>
        {npcMood === 'attacking' && (
          <motion.div
            key="flash"
            initial={{ opacity: 0.5 }}
            animate={{ opacity: [0.5, 0.25, 0.45, 0.1, 0] }}
            transition={{ duration: 1.4 }}
            className="fixed inset-0 bg-red-600 pointer-events-none z-40"
          />
        )}
      </AnimatePresence>

      {/* ── Attack message popup ── */}
      <AnimatePresence>
        {attackPending && attackMsg && (
          <motion.div
            key="attack-popup"
            initial={{ opacity: 0, scale: 0.6 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            transition={{ type: 'spring', stiffness: 300, damping: 18 }}
            className="fixed inset-0 z-50 flex items-center justify-center px-6"
          >
            {/* dim backdrop */}
            <div className="absolute inset-0 bg-black/60" />
            <div className="relative bg-gray-900 border border-red-500/40 rounded-3xl px-8 py-6 text-center shadow-2xl shadow-red-900/50 w-full max-w-xs">
              <div className="text-6xl mb-3">
                {npc.attack_emoji}{npc.weapon_emoji}
              </div>
              <div className="text-red-400 text-lg font-black leading-snug mb-2">
                {attackMsg}
              </div>
              {wrongChoice && (
                <div className="mt-2 pt-2 border-t border-white/10 text-left">
                  <div className="text-gray-500 text-xs mb-1">내가 말한 것:</div>
                  <div className="text-white/70 text-sm font-bold">{wrongChoice.jp}</div>
                  {wrongChoice.ko && (
                    <div className="text-orange-400/90 text-sm mt-0.5">→ {wrongChoice.ko}</div>
                  )}
                </div>
              )}
              <div className="text-gray-500 text-sm mt-3 mb-4">
                HP {Array.from({ length: MAX_HP }, (_, i) => (
                  <span key={i} style={{ filter: i >= hp ? 'grayscale(1) opacity(0.25)' : 'none' }}>❤️</span>
                ))}
              </div>
              <button
                onClick={confirmAttack}
                className="w-full py-3 bg-red-600 hover:bg-red-500 text-white font-bold rounded-2xl active:scale-95 transition-all"
              >
                확인
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Death screen ── */}
      <AnimatePresence>
        {isDead && (
          <motion.div
            key="death"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="fixed inset-0 z-60 bg-gray-950 flex flex-col items-center justify-center px-6 text-center"
          >
            <motion.div
              initial={{ scale: 0.2, rotate: -15 }}
              animate={{ scale: 1, rotate: [0, -5, 5, -3, 0] }}
              transition={{ type: 'spring', stiffness: 200, damping: 10, delay: 0.1 }}
              className="text-8xl mb-2"
            >
              {npc.attack_emoji}
            </motion.div>
            <motion.div
              initial={{ scale: 0.5 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.15 }}
              className="text-6xl mb-6"
            >
              {npc.weapon_emoji}
            </motion.div>

            <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.35 }}>
              <div className="text-red-500 text-4xl font-black mb-2">사망!</div>
              <div className="text-gray-400 text-base mb-1">
                <span className="text-white font-bold">{npc.name}</span>에게 당했습니다...
              </div>
              <div className="text-gray-600 text-sm">대화를 더 조심하세요 🪦</div>
            </motion.div>

            <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.55 }} className="flex flex-col gap-3 w-full max-w-xs mt-10">
              <button onClick={restart}
                className="w-full py-5 bg-red-600 hover:bg-red-500 text-white font-black text-lg rounded-2xl active:scale-95 transition-all">
                다시 도전 🔁
              </button>
              <button onClick={() => router.push('/')}
                className="w-full py-4 bg-white/10 text-white rounded-2xl active:scale-95 transition-all">
                홈으로 도망치기
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Header ── */}
      <div className="px-4 pt-6 pb-3 flex-none">
        <div className="max-w-sm mx-auto">
          <div className="flex items-center justify-between mb-2">
            <button onClick={() => { stopTTS(); router.push('/'); }}
              className="text-gray-500 hover:text-gray-300 text-sm">← 홈</button>

            {/* HP hearts */}
            <div className="flex gap-1 text-lg">
              {Array.from({ length: MAX_HP }, (_, i) => (
                <motion.span
                  key={i}
                  animate={npcMood === 'attacking' && i === hp - 1
                    ? { scale: [1, 1.5, 0.8, 1], opacity: [1, 1, 0.3, 0.3] }
                    : {}}
                  transition={{ duration: 0.5 }}
                  style={{ filter: i >= hp ? 'grayscale(1) opacity(0.25)' : 'none' }}
                >
                  ❤️
                </motion.span>
              ))}
            </div>

            <div className="w-16" />
          </div>

          {/* Progress bar */}
          <div className="h-1 bg-white/10 rounded-full overflow-hidden">
            <motion.div className="h-full bg-indigo-500 rounded-full"
              animate={{ width: `${((turnIdx + 1) / turns.length) * 100}%` }}
              transition={{ duration: 0.4 }} />
          </div>
        </div>
      </div>

      {/* ── NPC bubble ── */}
      <div className="px-4 mt-4 max-w-sm mx-auto w-full">
        <div className="flex gap-3 items-start">
          <NpcAvatar npc={npc} mood={npcMood} />

          {/* Speech bubble */}
          <AnimatePresence mode="wait">
            <motion.div
              key={currentTurn.id}
              initial={{ opacity: 0, x: -12, scale: 0.97 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              exit={{ opacity: 0, scale: 0.97 }}
              transition={{ duration: 0.15 }}
              className={`flex-1 rounded-2xl rounded-tl-sm px-4 py-3 border transition-colors duration-300 ${
                npcMood === 'attacking'
                  ? 'bg-red-950/60 border-red-500/30'
                  : 'bg-indigo-950/70 border-indigo-800/40'
              }`}
            >
              <div className="text-white text-xl font-bold leading-snug tracking-wide">
                {currentTurn.jp_ruby
                  ? <RubyText text={currentTurn.jp_ruby} />
                  : currentTurn.jp}
              </div>
              <div className="text-gray-400 text-sm mt-1">{currentTurn.ko_meaning}</div>
              <button onClick={() => speak(currentTurn.jp)}
                className="mt-2 text-xs text-indigo-400/50 hover:text-indigo-300 transition-colors">
                🔊 다시 듣기
              </button>
            </motion.div>
          </AnimatePresence>
        </div>
      </div>

      {/* ── Bottom panel ── */}
      <div className="px-4 pt-4 pb-10 max-w-sm mx-auto w-full">
        <AnimatePresence mode="wait">

          {/* TTS indicator */}
          {phase === 'tts' && (
            <motion.div key="tts" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="flex justify-center py-8">
              <div className="flex gap-1.5 items-center">
                {[0, 1, 2].map((i) => (
                  <motion.div key={i} className="w-2 h-2 rounded-full bg-indigo-400"
                    animate={{ y: [0, -6, 0] }}
                    transition={{ repeat: Infinity, duration: 0.6, delay: i * 0.12 }} />
                ))}
              </div>
            </motion.div>
          )}

          {/* Vocab card */}
          {phase === 'vocab' && vocabQueue.length > 0 && (
            <motion.div key={`vocab-${vocabQueue[0].wordId}`}
              initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.18 }}
              className="flex flex-col gap-3">
              <div className="flex items-center justify-between text-xs text-gray-500 px-1">
                <span className="uppercase tracking-widest">이 단어 알아요?</span>
                {vocabQueue.length > 1 && <span className="text-gray-600">{vocabQueue.length}개 남음</span>}
              </div>
              <div className="bg-white/6 border border-white/10 rounded-3xl px-6 py-7 text-center">
                <div className="text-6xl font-black text-white mb-2 tracking-tight">{vocabQueue[0].display}</div>
                <div className="text-lg text-gray-400 mb-4">{vocabQueue[0].reading}</div>
                <div className="w-10 h-px bg-white/10 mx-auto mb-4" />
                <div className="text-2xl font-bold text-white">{vocabQueue[0].meaning}</div>
              </div>
              <div className="flex gap-2">
                <button onClick={() => dismissVocab(false)}
                  className="flex-1 py-4 rounded-2xl bg-red-500/10 border border-red-500/20 text-red-400 font-bold active:scale-95 transition-all">
                  몰라요
                </button>
                <button onClick={() => dismissVocab(true)}
                  className="flex-1 py-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 font-bold active:scale-95 transition-all">
                  알아요 ✓
                </button>
              </div>
            </motion.div>
          )}

          {/* Choice buttons */}
          {phase === 'choosing' && currentTurn.choices && (
            <motion.div key="choices"
              initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 8 }} transition={{ duration: 0.18 }}
              className="flex flex-col gap-3">

              {/* 한국어 생각말풍선 */}
              {thoughtText && (
                <motion.div
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.05 }}
                  className="flex items-start gap-2"
                >
                  <span className="text-lg mt-0.5 shrink-0">💭</span>
                  <div className="bg-white/8 border border-white/10 rounded-2xl rounded-tl-sm px-4 py-2.5">
                    <p className="text-white/75 text-sm leading-relaxed italic">
                      {thoughtText}
                    </p>
                  </div>
                </motion.div>
              )}

              <div className="text-xs text-gray-500 text-center uppercase tracking-widest mt-1">
                맞는 일본어를 골라보세요
              </div>

              {currentTurn.choices.map((choice) => {
                const isWrong = wrongChoice?.id === choice.id;
                return (
                  <button
                    key={choice.id}
                    disabled={npcMood === 'attacking' || attackPending}
                    onClick={() => handleChoice(choice)}
                    className={`w-full py-4 px-5 rounded-2xl text-left
                      active:scale-95 transition-all duration-100 disabled:pointer-events-none
                      border-2
                      ${isWrong
                        ? 'bg-red-950/30 border-red-500/40'
                        : 'bg-white/8 border-white/10 hover:bg-white/12'}
                      ${(npcMood === 'attacking' || attackPending) ? 'opacity-40' : ''}
                    `}
                  >
                    <div className="text-white font-bold text-lg leading-snug">
                      {choice.jp_ruby
                        ? <RubyText text={choice.jp_ruby} />
                        : choice.jp}
                    </div>
                    {isWrong && choice.ko && (
                      <div className="text-red-400/80 text-sm mt-1">→ {choice.ko}</div>
                    )}
                  </button>
                );
              })}
            </motion.div>
          )}

          {/* Shadow panel */}
          {phase === 'shadow' && chosenJp && (
            <motion.div key="shadow"
              initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }} transition={{ duration: 0.2 }}
              className="flex flex-col gap-4">
              <div className={`rounded-2xl px-5 py-4 text-center border ${
                currentTurn.type === 'choice'
                  ? 'bg-emerald-900/30 border-emerald-500/25'
                  : 'bg-white/5 border-white/10'
              }`}>
                {currentTurn.type === 'choice' && (
                  <div className="text-xs text-emerald-400 uppercase tracking-widest mb-3">✓ 정답! 따라 말해보세요</div>
                )}
                {currentTurn.type === 'listen' && (
                  <div className="text-xs text-gray-400 uppercase tracking-widest mb-3">따라 말해보세요</div>
                )}
                <div className="text-white text-2xl font-bold leading-snug tracking-wide">
                  {chosenJp.jp_ruby
                    ? <RubyText text={chosenJp.jp_ruby} />
                    : chosenJp.jp}
                </div>
                {chosenJp.ko && (
                  <div className={`text-sm mt-1.5 ${currentTurn.type === 'choice' ? 'text-emerald-300/60' : 'text-gray-400/70'}`}>
                    {chosenJp.ko}
                  </div>
                )}
                <button onClick={() => speak(chosenJp.jp)}
                  className={`mt-3 text-xs underline underline-offset-2 transition-colors ${
                    currentTurn.type === 'choice' ? 'text-emerald-400/60 hover:text-emerald-300' : 'text-gray-500 hover:text-gray-300'
                  }`}>
                  🔊 다시 듣기
                </button>
              </div>
              <button onClick={handleNext}
                className="w-full py-5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-lg rounded-2xl active:scale-95 transition-all shadow-lg shadow-indigo-900/40">
                소리 내어 읽은 후 터치하세요 →
              </button>
            </motion.div>
          )}

        </AnimatePresence>
      </div>
    </div>
  );
}

export default function PlayPage() {
  return <Suspense><PlayContent /></Suspense>;
}
