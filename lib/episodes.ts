import type { JlptLevel } from '@/store/useProgressStore';

export interface EpisodeMeta {
  id: string;
  world: JlptLevel;
  title: string;
  thumbnail: string;
  description: string;
  totalTurns: number;
  comingSoon?: boolean;
}

// 에피소드 목록 — 콘텐츠 에이전트가 에피소드를 추가할 때 여기에만 등록하면 됨
export const ALL_EPISODES: EpisodeMeta[] = [
  {
    id: 'ep001',
    world: 'N5',
    title: '편의점에서',
    thumbnail: '🏪',
    description: '편의점 점원과 기본 대화',
    totalTurns: 6,
  },
  {
    id: 'ep002',
    world: 'N4',
    title: '돈키호테 면세 카운터',
    thumbnail: '🦝',
    description: '돈키호테 면세 카운터에서 여권 제시부터 사인까지 완벽하게!',
    totalTurns: 5,
  },
  {
    id: 'ep003',
    world: 'N4',
    title: '식당 웨이팅 취소',
    thumbnail: '🍜',
    description: '갑자기 웨이팅을 취소해야 할 때, 당황하지 말고 정중하게!',
    totalTurns: 5,
  },
  {
    id: 'ep004',
    world: 'N4',
    title: '호텔 수건 추가 요청',
    thumbnail: '🏨',
    description: "프런트에 전화해서 수건을 추가 요청해봐요. 조수사 '枚'도 놓치지 마세요!",
    totalTurns: 5,
  },
];

export function episodesForWorld(world: JlptLevel): EpisodeMeta[] {
  return ALL_EPISODES.filter((e) => e.world === world);
}
