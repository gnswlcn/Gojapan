'use client';

import type { ExampleSegment } from '@/store/useProgressStore';

interface ExampleSentenceProps {
  segments: ExampleSegment[];
  knownWords: string[];
  currentWordId: string;
}

export default function ExampleSentence({ segments, knownWords, currentWordId }: ExampleSentenceProps) {
  const knownSet = new Set(knownWords);

  return (
    <div className="text-sm leading-relaxed text-center flex flex-wrap justify-center gap-x-0.5">
      {segments.map((seg, i) => {
        const isCurrentWord = seg.wId === currentWordId;
        const isKnown = seg.wId !== null && knownSet.has(seg.wId);

        // 현재 카드 단어 → 항상 일본어 (학습 대상)
        // 아는 단어 → 일본어 (읽을 수 있음)
        // 모르는 단어 → 한국어 (문맥 이해용)
        // wId 없는 조사/어미 → 일본어 그대로
        const text = (isCurrentWord || isKnown || seg.wId === null) ? seg.jp : seg.ko;

        return (
          <span
            key={i}
            className={
              isCurrentWord
                ? 'text-yellow-300 font-bold'
                : isKnown
                ? 'text-gray-300'
                : seg.wId === null
                ? 'text-gray-500'
                : 'text-gray-500'
            }
          >
            {text}
          </span>
        );
      })}
    </div>
  );
}
