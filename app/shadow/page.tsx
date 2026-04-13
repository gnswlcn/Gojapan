'use client';

import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';

interface EpisodeMeta {
  id: string;
  title: string;
  setting_ko: string;
  difficulty: string;
  thumbnail: string;
  description: string;
  totalTurns: number;
}

// 에피소드 목록 (추후 JSON manifest로 분리 가능)
const EPISODES: EpisodeMeta[] = [
  {
    id: 'ep001',
    title: '편의점에서',
    setting_ko: '편의점',
    difficulty: 'N5',
    thumbnail: '🏪',
    description: '편의점 점원과 기본 대화를 연습해봐요',
    totalTurns: 6,
  },
  {
    id: 'ep002',
    title: '돈키호테 면세 카운터',
    setting_ko: '돈키호테 면세 카운터',
    difficulty: 'N4',
    thumbnail: '🦝',
    description: '면세 처리부터 서명까지! 쇼핑 마무리를 완벽하게',
    totalTurns: 5,
  },
  {
    id: 'ep003',
    title: '식당 웨이팅 취소',
    setting_ko: '인기 식당 입구',
    difficulty: 'N4',
    thumbnail: '🍜',
    description: '갑자기 웨이팅을 취소해야 할 때 당황하지 않는 법',
    totalTurns: 5,
  },
  {
    id: 'ep004',
    title: '호텔 수건 추가 요청',
    setting_ko: '호텔 프런트 (전화)',
    difficulty: 'N4',
    thumbnail: '🏨',
    description: '프런트에 전화로 요청하기 — 조수사 枚(まい)도 잡아봐요',
    totalTurns: 5,
  },
];

const DIFFICULTY_COLOR: Record<string, string> = {
  N5: 'text-emerald-400 bg-emerald-400/10',
  N4: 'text-blue-400 bg-blue-400/10',
  N3: 'text-purple-400 bg-purple-400/10',
  N2: 'text-orange-400 bg-orange-400/10',
  N1: 'text-rose-400 bg-rose-400/10',
};

export default function ShadowPage() {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-gray-950 text-white flex flex-col">
      {/* Header */}
      <div className="px-4 pt-10 pb-6">
        <div className="max-w-sm mx-auto">
          <button
            onClick={() => router.push('/')}
            className="text-gray-500 hover:text-gray-300 text-sm mb-6 block"
          >
            ← 홈
          </button>
          <motion.div
            initial={{ y: -10, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            className="text-3xl font-black mb-1"
          >
            섀도잉 연습 🎙️
          </motion.div>
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.1 }}
            className="text-gray-400 text-sm"
          >
            점원의 말을 듣고, 정확한 표현으로 답하고, 따라 말해봐요
          </motion.p>
        </div>
      </div>

      {/* How it works */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15 }}
        className="mx-4 mb-6 max-w-sm mx-auto"
      >
        <div className="bg-white/5 rounded-2xl px-4 py-3 flex flex-col gap-2 text-xs text-gray-400 max-w-sm mx-auto">
          <div className="flex items-center gap-2"><span>①</span> 점원이 말해요 → 자동 재생</div>
          <div className="flex items-center gap-2"><span>②</span> 2개 선택지 중 맞는 응답 고르기</div>
          <div className="flex items-center gap-2"><span>③</span> 정답 일본어가 나오면 소리 내어 따라 말하기</div>
          <div className="flex items-center gap-2"><span>④</span> 버튼 터치 → 다음 턴</div>
        </div>
      </motion.div>

      {/* Episode list */}
      <div className="px-4 max-w-sm mx-auto w-full">
        <div className="text-xs text-gray-500 uppercase tracking-widest mb-3">에피소드</div>
        <div className="flex flex-col gap-3">
          {EPISODES.map((ep, i) => (
            <motion.button
              key={ep.id}
              initial={{ x: -16, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ delay: 0.2 + i * 0.07 }}
              onClick={() => router.push(`/shadow/play?ep=${ep.id}`)}
              className="bg-white/5 hover:bg-white/10 active:scale-95 transition-all rounded-2xl p-4 text-left flex items-center gap-4"
            >
              <div className="text-4xl">{ep.thumbnail}</div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-0.5">
                  <span className="font-bold text-white">{ep.title}</span>
                  <span
                    className={`text-xs px-2 py-0.5 rounded-full font-semibold ${DIFFICULTY_COLOR[ep.difficulty] ?? ''}`}
                  >
                    {ep.difficulty}
                  </span>
                </div>
                <div className="text-xs text-gray-400">{ep.description}</div>
                <div className="text-xs text-gray-600 mt-1">{ep.totalTurns}턴</div>
              </div>
              <div className="text-gray-600 text-lg shrink-0">›</div>
            </motion.button>
          ))}

          {/* Placeholder */}
          <div className="bg-white/3 rounded-2xl p-4 flex items-center gap-4 opacity-40">
            <div className="text-4xl">🏨</div>
            <div className="flex-1">
              <div className="font-bold text-white text-sm">호텔 체크인</div>
              <div className="text-xs text-gray-500 mt-0.5">준비 중...</div>
            </div>
          </div>
          <div className="bg-white/3 rounded-2xl p-4 flex items-center gap-4 opacity-40">
            <div className="text-4xl">🍜</div>
            <div className="flex-1">
              <div className="font-bold text-white text-sm">식당 주문하기</div>
              <div className="text-xs text-gray-500 mt-0.5">준비 중...</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
