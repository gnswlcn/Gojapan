'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { Word } from '@/store/useProgressStore';

interface FlashCardProps {
  word: Word;
  onKnown: () => void;
  onLearning: () => void;
  cardIndex: number;
}

export default function FlashCard({ word, onKnown, onLearning, cardIndex }: FlashCardProps) {
  const [revealed, setRevealed] = useState(false);
  const [showReading, setShowReading] = useState(false);
  const [exiting, setExiting] = useState<'known' | 'learning' | null>(null);

  // Reset state on new card
  useEffect(() => {
    setRevealed(false);
    setShowReading(false);
    setExiting(null);
  }, [word.id, cardIndex]);

  const handleReveal = useCallback(() => {
    if (!revealed) setRevealed(true);
  }, [revealed]);

  const handleKnown = useCallback(() => {
    if (!revealed) return;
    setExiting('known');
    setTimeout(onKnown, 220);
  }, [revealed, onKnown]);

  const handleLearning = useCallback(() => {
    if (!revealed) return;
    setExiting('learning');
    setTimeout(onLearning, 220);
  }, [revealed, onLearning]);

  // Keyboard shortcuts
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === ' ' || e.key === 'Enter') {
        e.preventDefault();
        handleReveal();
      }
      if (e.key === 'ArrowRight') handleKnown();
      if (e.key === 'ArrowLeft') handleLearning();
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [handleReveal, handleKnown, handleLearning]);

  const slideVariants = {
    enter: { x: 60, opacity: 0 },
    center: { x: 0, opacity: 1 },
    exitKnown: { x: 120, opacity: 0, rotate: 8 },
    exitLearning: { x: -120, opacity: 0, rotate: -8 },
  };

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={word.id}
        initial="enter"
        animate={exiting ? (exiting === 'known' ? 'exitKnown' : 'exitLearning') : 'center'}
        variants={slideVariants}
        transition={{ duration: 0.2, ease: 'easeOut' }}
        className="w-full max-w-sm mx-auto"
      >
        {/* Card */}
        <div
          className="relative bg-white rounded-3xl shadow-2xl overflow-hidden cursor-pointer select-none"
          style={{ minHeight: 320 }}
          onClick={handleReveal}
        >
          {/* Top accent bar */}
          <div className="h-1.5 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500" />

          <div className="p-8 flex flex-col items-center justify-center" style={{ minHeight: 310 }}>
            {/* Kanji */}
            <div className="text-7xl font-bold text-gray-900 mb-2 tracking-tight">
              {word.kanji}
            </div>

            {/* Reading toggle */}
            <button
              className="text-sm text-gray-400 hover:text-indigo-500 transition-colors mb-6 flex items-center gap-1"
              onClick={(e) => {
                e.stopPropagation();
                setShowReading((v) => !v);
              }}
            >
              {showReading ? (
                <span className="text-lg font-medium text-indigo-500">{word.reading}</span>
              ) : (
                <span>읽기 보기 👁</span>
              )}
            </button>

            {/* Meaning */}
            <AnimatePresence>
              {revealed ? (
                <motion.div
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.18 }}
                  className="text-center"
                >
                  <div className="text-2xl font-semibold text-gray-700 mb-1">
                    {word.meaning_ko}
                  </div>
                  <div className="text-xs text-gray-400 uppercase tracking-wider">
                    {word.category}
                  </div>
                </motion.div>
              ) : (
                <motion.div
                  initial={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="text-gray-300 text-sm"
                >
                  탭해서 뜻 보기 ↓
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* Action buttons */}
        <AnimatePresence>
          {revealed && (
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.15 }}
              className="mt-5 flex gap-4"
            >
              <button
                onClick={handleLearning}
                className="flex-1 py-4 rounded-2xl bg-red-50 border-2 border-red-200 text-red-600 font-bold text-lg hover:bg-red-100 active:scale-95 transition-all"
              >
                ← 모름
              </button>
              <button
                onClick={handleKnown}
                className="flex-1 py-4 rounded-2xl bg-emerald-50 border-2 border-emerald-300 text-emerald-700 font-bold text-lg hover:bg-emerald-100 active:scale-95 transition-all"
              >
                알았다 →
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Keyboard hint */}
        {revealed && (
          <p className="text-center text-xs text-gray-300 mt-3">
            ← 모름 &nbsp;|&nbsp; 알았다 →  &nbsp;(키보드 방향키)
          </p>
        )}
      </motion.div>
    </AnimatePresence>
  );
}
