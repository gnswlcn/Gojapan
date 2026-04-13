'use client';

import { useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import ExampleSentence from './ExampleSentence';
import type { Word } from '@/store/useProgressStore';

interface FlashCardProps {
  word: Word;
  onKnown: () => void;
  onLearning: () => void;
  cardIndex: number;
}

export default function FlashCard({ word, onKnown, onLearning, cardIndex }: FlashCardProps) {
  // Keyboard shortcuts
  const handleKnown = useCallback(onKnown, [onKnown]);
  const handleLearning = useCallback(onLearning, [onLearning]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight' || e.key === 'd') handleKnown();
      if (e.key === 'ArrowLeft' || e.key === 'a') handleLearning();
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [handleKnown, handleLearning]);

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={`${word.id}-${cardIndex}`}
        initial={{ opacity: 0, scale: 0.96 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 1.02 }}
        transition={{ duration: 0.08 }}
        className="relative w-full h-full flex flex-col"
      >
        {/* Split tap zones - full height overlay */}
        <button
          aria-label="모름"
          onClick={handleLearning}
          className="absolute left-0 top-0 w-1/2 h-full z-10 opacity-0"
        />
        <button
          aria-label="알았다"
          onClick={handleKnown}
          className="absolute right-0 top-0 w-1/2 h-full z-10 opacity-0"
        />

        {/* Card content */}
        <div className="flex-1 flex flex-col items-center justify-center px-6 pointer-events-none select-none">

          {/* Category chip */}
          <div className="text-xs text-gray-500 uppercase tracking-widest mb-4">
            {word.category}
          </div>

          {/* Kanji — big */}
          <div className="text-7xl font-black text-white mb-3 tracking-tight">
            {word.kanji}
          </div>

          {/* Reading */}
          <div className="text-xl text-gray-400 mb-5">
            {word.reading}
          </div>

          {/* Divider */}
          <div className="w-12 h-px bg-white/10 mb-5" />

          {/* Meaning */}
          <div className="text-3xl font-bold text-white mb-6">
            {word.meaning_ko}
          </div>

          {/* Example sentence */}
          {word.example && (
            <div className="w-full max-w-xs bg-white/5 rounded-2xl px-4 py-3">
              <ExampleSentence segments={word.example} currentWordId={word.id} />
            </div>
          )}
        </div>

        {/* Bottom tap zone hints */}
        <div className="flex pointer-events-none mb-6 px-4 gap-3">
          <div className="flex-1 py-4 rounded-2xl bg-red-500/10 border border-red-500/20 text-red-400 font-bold text-lg text-center">
            ← 모름
          </div>
          <div className="flex-1 py-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 font-bold text-lg text-center">
            알았다 →
          </div>
        </div>

        {/* Edge gradient hints on hover — decorative */}
        <div className="absolute inset-y-0 left-0 w-12 bg-gradient-to-r from-red-500/5 to-transparent pointer-events-none rounded-l-3xl" />
        <div className="absolute inset-y-0 right-0 w-12 bg-gradient-to-l from-emerald-500/5 to-transparent pointer-events-none rounded-r-3xl" />
      </motion.div>
    </AnimatePresence>
  );
}
