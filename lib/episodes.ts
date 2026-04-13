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
    world: 'N5',
    title: '호텔 체크인',
    thumbnail: '🏨',
    description: '호텔에서 체크인하기',
    totalTurns: 0,
    comingSoon: true,
  },
  {
    id: 'ep003',
    world: 'N5',
    title: '식당에서 주문',
    thumbnail: '🍜',
    description: '식당에서 음식 주문하기',
    totalTurns: 0,
    comingSoon: true,
  },
];

export function episodesForWorld(world: JlptLevel): EpisodeMeta[] {
  return ALL_EPISODES.filter((e) => e.world === world);
}
