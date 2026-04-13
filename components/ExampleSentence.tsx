'use client';

import type { ExampleSegment } from '@/store/useProgressStore';

interface ExampleSentenceProps {
  segments: ExampleSegment[];
  currentWordId: string;
}

export default function ExampleSentence({ segments, currentWordId }: ExampleSentenceProps) {
  return (
    <div className="text-sm leading-relaxed text-center flex flex-wrap justify-center gap-x-0.5">
      {segments.map((seg, i) => {
        const isCurrentWord = seg.wId === currentWordId;
        return (
          <span
            key={i}
            className={isCurrentWord ? 'text-yellow-300 font-bold' : 'text-gray-400'}
          >
            {seg.jp}
          </span>
        );
      })}
    </div>
  );
}
