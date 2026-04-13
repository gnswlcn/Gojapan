'use client';

import type { ExampleSegment } from '@/store/useProgressStore';

interface ExampleSentenceProps {
  segments: ExampleSegment[];
  currentWordId: string;
  currentWordKanji: string;
  knownWordIds?: Set<string>; // confidence >= 3 → show in Japanese
}

// 세그먼트에서 단어 부분과 조사/어미 부분을 분리
// 예: "食べます。"+ "食べる" → ["食べ", "ます。"]
// 예: "ご飯を" + "ご飯" → ["ご飯", "を"]
function splitWordFromParticle(segmentJp: string, wordKanji: string): [string, string] {
  for (let len = wordKanji.length; len > 0; len--) {
    const prefix = wordKanji.slice(0, len);
    if (segmentJp.startsWith(prefix)) {
      return [prefix, segmentJp.slice(prefix.length)];
    }
  }
  return [segmentJp, ''];
}

export default function ExampleSentence({
  segments,
  currentWordId,
  currentWordKanji,
  knownWordIds,
}: ExampleSentenceProps) {
  return (
    <div className="text-sm leading-relaxed text-center flex flex-wrap justify-center gap-x-0.5">
      {segments.map((seg, i) => {
        const isCurrentWord = seg.wId === currentWordId;

        if (isCurrentWord) {
          const [wordPart, particlePart] = splitWordFromParticle(seg.jp, currentWordKanji);
          return (
            <span key={i}>
              <span className="text-yellow-300 font-bold">{wordPart}</span>
              <span className="text-gray-400">{particlePart}</span>
            </span>
          );
        }

        // Other words with a linked vocabulary ID
        if (seg.wId && knownWordIds?.has(seg.wId)) {
          // Known word (confidence >= 3): show in Japanese, bright white
          return (
            <span key={i} className="text-white/80">
              {seg.jp}
            </span>
          );
        }

        // Unknown / no wId: gray Japanese text
        return (
          <span key={i} className="text-gray-400">
            {seg.jp}
          </span>
        );
      })}
    </div>
  );
}
