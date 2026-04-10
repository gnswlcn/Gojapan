'use client';

import type { ExampleSegment } from '@/store/useProgressStore';

interface ExampleSentenceProps {
  segments: ExampleSegment[];
  knownWords: string[];
}

export default function ExampleSentence({ segments, knownWords }: ExampleSentenceProps) {
  const knownSet = new Set(knownWords);

  return (
    <div className="text-sm leading-relaxed text-center flex flex-wrap justify-center gap-x-0.5">
      {segments.map((seg, i) => {
        const isKnown = seg.wId !== null && knownSet.has(seg.wId);
        // Known word → Korean (easy to read), Unknown → Japanese (learn the script)
        const text = isKnown ? seg.ko : seg.jp;
        const isTarget = seg.wId !== null && !knownSet.has(seg.wId);

        return (
          <span
            key={i}
            className={
              isTarget
                ? 'text-indigo-300 font-semibold'
                : isKnown
                ? 'text-gray-400'
                : 'text-gray-300'
            }
          >
            {text}
          </span>
        );
      })}
    </div>
  );
}
