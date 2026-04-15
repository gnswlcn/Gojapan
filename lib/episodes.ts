export interface EpisodeMeta {
  id: string;
  locationId: string;   // 장소 기반 분류
  title: string;
  thumbnail: string;
  description: string;
  totalTurns: number;
  comingSoon?: boolean;
}

export const ALL_EPISODES: EpisodeMeta[] = [
  {
    id: 'ep001',
    locationId: 'convenience_store',
    title: '편의점에서',
    thumbnail: '🏪',
    description: '봉투, 데우기, 포인트 카드 기본 대화',
    totalTurns: 6,
  },
  {
    id: 'ep002',
    locationId: 'duty_free',
    title: '돈키호테 면세 카운터',
    thumbnail: '🛍️',
    description: '여권 제시부터 서명까지',
    totalTurns: 5,
  },
  {
    id: 'ep003',
    locationId: 'restaurant',
    title: '식당 웨이팅 취소',
    thumbnail: '🍜',
    description: '급한 일로 웨이팅 취소하기',
    totalTurns: 5,
  },
  {
    id: 'ep004',
    locationId: 'hotel',
    title: '호텔 수건 추가 요청',
    thumbnail: '🏨',
    description: '프런트에 전화해서 수건 추가 요청',
    totalTurns: 5,
  },
];

export function episodesForLocation(locationId: string): EpisodeMeta[] {
  return ALL_EPISODES.filter((e) => e.locationId === locationId);
}
