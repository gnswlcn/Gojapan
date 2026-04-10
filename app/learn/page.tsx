'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import FlashCard from '@/components/FlashCard';
import ProgressBar from '@/components/ProgressBar';
import { useProgressStore } from '@/store/useProgressStore';
import { loadWords, selectDungeonWords, WORLD_CONFIG } from '@/lib/wordSelector';
import type { Word } from '@/store/useProgressStore';

export default function LearnPage() {
  const router = useRouter();
  const { currentWorld, knownWords, learningWords, markKnown, markLearning, recordDailyStudy } =
    useProgressStore();

  const [words, setWords] = useState<Word[]>([]);
  const [cardIndex, setCardIndex] = useState(0);
  const [sessionKnown, setSessionKnown] = useState<string[]>([]);
  const [sessionLearning, setSessionLearning] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [done, setDone] = useState(false);

  const config = WORLD_CONFIG[currentWorld];

  useEffect(() => {
    (async () => {
      const all = await loadWords(currentWorld);
      const dungeon = selectDungeonWords(all, knownWords, learningWords);
      setWords(dungeon);
      setLoading(false);
    })();
  }, [currentWorld]); // eslint-disable-line react-hooks/exhaustive-deps

  const advance = useCallback(() => {
    setCardIndex((i) => {
      if (i + 1 >= words.length) {
        setDone(true);
        return i;
      }
      return i + 1;
    });
  }, [words.length]);

  const handleKnown = useCallback(() => {
    const word = words[cardIndex];
    markKnown(word.id);
    setSessionKnown((prev) => [...prev, word.id]);
    advance();
  }, [words, cardIndex, markKnown, advance]);

  const handleLearning = useCallback(() => {
    const word = words[cardIndex];
    markLearning(word.id);
    setSessionLearning((prev) => [...prev, word.id]);
    advance();
  }, [words, cardIndex, markLearning, advance]);

  // Save stats and navigate to result
  useEffect(() => {
    if (done && words.length > 0) {
      recordDailyStudy(words.length, sessionKnown.length);
      router.push(
        `/result?studied=${words.length}&known=${sessionKnown.length}&world=${currentWorld}`
      );
    }
  }, [done]); // eslint-disable-line react-hooks/exhaustive-deps

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}
          className="w-10 h-10 border-4 border-indigo-300 border-t-indigo-600 rounded-full"
        />
      </div>
    );
  }

  if (words.length === 0) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 gap-4">
        <div className="text-5xl">🎉</div>
        <p className="text-xl font-bold text-gray-700">이 월드의 단어를 모두 마스터했어요!</p>
        <button
          onClick={() => router.push('/')}
          className="mt-4 px-6 py-3 bg-indigo-600 text-white rounded-2xl font-bold"
        >
          홈으로
        </button>
      </div>
    );
  }

  const currentWord = words[cardIndex];

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100 flex flex-col">
      {/* Header */}
      <div className="px-4 pt-safe pt-6 pb-4">
        <div className="max-w-sm mx-auto">
          <div className="flex items-center justify-between mb-4">
            <button
              onClick={() => router.push('/')}
              className="text-gray-400 hover:text-gray-600 text-sm flex items-center gap-1"
            >
              ← 홈
            </button>
            <div className={`text-sm font-bold ${config.color} flex items-center gap-1`}>
              <span>{config.emoji}</span>
              <span>{config.name}</span>
            </div>
          </div>

          <ProgressBar
            current={cardIndex}
            total={words.length}
            knownCount={sessionKnown.length}
          />
        </div>
      </div>

      {/* Card area */}
      <div className="flex-1 flex items-center justify-center px-4 py-6">
        <div className="w-full max-w-sm">
          <AnimatePresence mode="wait">
            {!done && (
              <FlashCard
                key={`${currentWord.id}-${cardIndex}`}
                word={currentWord}
                onKnown={handleKnown}
                onLearning={handleLearning}
                cardIndex={cardIndex}
              />
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Bottom hint */}
      <div className="pb-8 px-4 text-center">
        <p className="text-xs text-gray-300">
          스페이스 / 탭 = 뜻 보기 &nbsp;|&nbsp; ← = 모름 &nbsp;|&nbsp; → = 알았다
        </p>
      </div>
    </div>
  );
}
