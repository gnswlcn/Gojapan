// ─── Location-based learning structure ────────────────────────────────────────
// JLPT 레벨 대신 "장소" 단위로 학습을 구조화
// 단어도 장소 기준으로 묶임 → 실전 회화 직결

export interface LocationVocab {
  id: string;
  jp: string;
  reading: string;
  ko: string;
}

export interface LocationConfig {
  id: string;
  name_ko: string;
  name_jp: string;
  thumbnail: string;
  description: string;
  vocab: LocationVocab[];
}

export const STATIC_LOCATIONS: LocationConfig[] = [
  {
    id: 'convenience_store',
    name_ko: '편의점',
    name_jp: 'コンビニ',
    thumbnail: '🏪',
    description: '계산, 봉투, 데우기, 포인트 카드',
    vocab: [
      { id: 'cv_01', jp: '袋', reading: 'ふくろ', ko: '봉투' },
      { id: 'cv_02', jp: '温める', reading: 'あたためる', ko: '데우다' },
      { id: 'cv_03', jp: 'お会計', reading: 'おかいけい', ko: '계산' },
      { id: 'cv_04', jp: 'ポイントカード', reading: 'ポイントカード', ko: '포인트 카드' },
      { id: 'cv_05', jp: '大丈夫', reading: 'だいじょうぶ', ko: '괜찮다' },
      { id: 'cv_06', jp: '一枚', reading: 'いちまい', ko: '한 장' },
      { id: 'cv_07', jp: 'ご利用', reading: 'ごりよう', ko: '이용' },
      { id: 'cv_08', jp: 'お願いします', reading: 'おねがいします', ko: '부탁드려요' },
    ],
  },
  {
    id: 'restaurant',
    name_ko: '식당',
    name_jp: 'レストラン',
    thumbnail: '🍜',
    description: '예약, 주문, 웨이팅, 계산',
    vocab: [
      { id: 'rs_01', jp: '予約', reading: 'よやく', ko: '예약' },
      { id: 'rs_02', jp: '注文', reading: 'ちゅうもん', ko: '주문' },
      { id: 'rs_03', jp: 'メニュー', reading: 'メニュー', ko: '메뉴' },
      { id: 'rs_04', jp: 'キャンセル', reading: 'キャンセル', ko: '취소' },
      { id: 'rs_05', jp: '名前', reading: 'なまえ', ko: '이름' },
      { id: 'rs_06', jp: '急用', reading: 'きゅうよう', ko: '급한 일' },
      { id: 'rs_07', jp: '申し訳ない', reading: 'もうしわけない', ko: '죄송하다' },
      { id: 'rs_08', jp: '来店', reading: 'らいてん', ko: '방문' },
    ],
  },
  {
    id: 'hotel',
    name_ko: '호텔',
    name_jp: 'ホテル',
    thumbnail: '🏨',
    description: '프런트, 객실, 추가 요청',
    vocab: [
      { id: 'ht_01', jp: 'フロント', reading: 'フロント', ko: '프런트' },
      { id: 'ht_02', jp: 'タオル', reading: 'タオル', ko: '수건' },
      { id: 'ht_03', jp: '部屋', reading: 'へや', ko: '방' },
      { id: 'ht_04', jp: '追加', reading: 'ついか', ko: '추가' },
      { id: 'ht_05', jp: '枚', reading: 'まい', ko: '장 (조수사)' },
      { id: 'ht_06', jp: '号室', reading: 'ごうしつ', ko: '호실' },
      { id: 'ht_07', jp: '用意する', reading: 'ようしする', ko: '준비하다' },
      { id: 'ht_08', jp: '不便', reading: 'ふべん', ko: '불편' },
    ],
  },
  {
    id: 'duty_free',
    name_ko: '면세점',
    name_jp: '免税店',
    thumbnail: '🛍️',
    description: '여권 제시, 결제, 서류 서명',
    vocab: [
      { id: 'df_01', jp: '免税', reading: 'めんぜい', ko: '면세' },
      { id: 'df_02', jp: 'パスポート', reading: 'パスポート', ko: '여권' },
      { id: 'df_03', jp: '提示', reading: 'ていじ', ko: '제시' },
      { id: 'df_04', jp: '支払い', reading: 'しはらい', ko: '결제' },
      { id: 'df_05', jp: '領収書', reading: 'りょうしゅうしょ', ko: '영수증' },
      { id: 'df_06', jp: 'サイン', reading: 'サイン', ko: '서명' },
      { id: 'df_07', jp: '現金', reading: 'げんきん', ko: '현금' },
      { id: 'df_08', jp: '保管', reading: 'ほかん', ko: '보관' },
    ],
  },
];

// ─── Additional locations (unlockable by user) ───────────────────────────────
export const MORE_LOCATIONS: LocationConfig[] = [
  {
    id: 'airport',
    name_ko: '공항',
    name_jp: '空港',
    thumbnail: '✈️',
    description: '탑승 수속, 보안 검사, 환승',
    vocab: [
      { id: 'ap_01', jp: '搭乗口', reading: 'とうじょうぐち', ko: '탑승구' },
      { id: 'ap_02', jp: 'チェックイン', reading: 'チェックイン', ko: '체크인' },
      { id: 'ap_03', jp: '手荷物', reading: 'てにもつ', ko: '수하물' },
      { id: 'ap_04', jp: '出発', reading: 'しゅっぱつ', ko: '출발' },
      { id: 'ap_05', jp: '到着', reading: 'とうちゃく', ko: '도착' },
      { id: 'ap_06', jp: '税関', reading: 'ぜいかん', ko: '세관' },
      { id: 'ap_07', jp: '遅延', reading: 'ちえん', ko: '지연' },
      { id: 'ap_08', jp: '搭乗券', reading: 'とうじょうけん', ko: '탑승권' },
    ],
  },
  {
    id: 'pharmacy',
    name_ko: '약국',
    name_jp: '薬局',
    thumbnail: '💊',
    description: '증상 설명, 약 구매, 복용법',
    vocab: [
      { id: 'ph_01', jp: '薬', reading: 'くすり', ko: '약' },
      { id: 'ph_02', jp: '痛み', reading: 'いたみ', ko: '통증' },
      { id: 'ph_03', jp: '熱', reading: 'ねつ', ko: '열' },
      { id: 'ph_04', jp: '処方箋', reading: 'しょほうせん', ko: '처방전' },
      { id: 'ph_05', jp: '飲み方', reading: 'のみかた', ko: '복용법' },
      { id: 'ph_06', jp: '症状', reading: 'しょうじょう', ko: '증상' },
      { id: 'ph_07', jp: '風邪薬', reading: 'かぜぐすり', ko: '감기약' },
      { id: 'ph_08', jp: '副作用', reading: 'ふくさよう', ko: '부작용' },
    ],
  },
  {
    id: 'train_station',
    name_ko: '기차역',
    name_jp: '駅',
    thumbnail: '🚆',
    description: '티켓 구매, 환승, 플랫폼',
    vocab: [
      { id: 'tr_01', jp: '切符', reading: 'きっぷ', ko: '티켓' },
      { id: 'tr_02', jp: '乗り換え', reading: 'のりかえ', ko: '환승' },
      { id: 'tr_03', jp: 'ホーム', reading: 'ホーム', ko: '플랫폼' },
      { id: 'tr_04', jp: '終電', reading: 'しゅうでん', ko: '막차' },
      { id: 'tr_05', jp: '改札', reading: 'かいさつ', ko: '개찰구' },
      { id: 'tr_06', jp: '急行', reading: 'きゅうこう', ko: '급행' },
      { id: 'tr_07', jp: '指定席', reading: 'していせき', ko: '지정석' },
      { id: 'tr_08', jp: '定期券', reading: 'ていきけん', ko: '정기권' },
    ],
  },
  {
    id: 'izakaya',
    name_ko: '이자카야',
    name_jp: '居酒屋',
    thumbnail: '🍺',
    description: '주문, 건배, 계산 나누기',
    vocab: [
      { id: 'iz_01', jp: '乾杯', reading: 'かんぱい', ko: '건배' },
      { id: 'iz_02', jp: 'おつまみ', reading: 'おつまみ', ko: '안주' },
      { id: 'iz_03', jp: '割り勘', reading: 'わりかん', ko: '더치페이' },
      { id: 'iz_04', jp: 'おかわり', reading: 'おかわり', ko: '리필' },
      { id: 'iz_05', jp: 'ラストオーダー', reading: 'ラストオーダー', ko: '라스트오더' },
      { id: 'iz_06', jp: 'お通し', reading: 'おとおし', ko: '기본 안주' },
      { id: 'iz_07', jp: '締め', reading: 'しめ', ko: '마무리 음식' },
      { id: 'iz_08', jp: '飲み放題', reading: 'のみほうだい', ko: '무제한 음주' },
    ],
  },
  {
    id: 'hospital',
    name_ko: '병원',
    name_jp: '病院',
    thumbnail: '🏥',
    description: '접수, 진료, 처방',
    vocab: [
      { id: 'hs_01', jp: '受付', reading: 'うけつけ', ko: '접수' },
      { id: 'hs_02', jp: '診察', reading: 'しんさつ', ko: '진찰' },
      { id: 'hs_03', jp: '保険証', reading: 'ほけんしょう', ko: '보험증' },
      { id: 'hs_04', jp: '予約', reading: 'よやく', ko: '예약' },
      { id: 'hs_05', jp: '内科', reading: 'ないか', ko: '내과' },
      { id: 'hs_06', jp: '血圧', reading: 'けつあつ', ko: '혈압' },
      { id: 'hs_07', jp: '検査', reading: 'けんさ', ko: '검사' },
      { id: 'hs_08', jp: '待合室', reading: 'まちあいしつ', ko: '대기실' },
    ],
  },
];

export function getAllLocations(): LocationConfig[] {
  return [...STATIC_LOCATIONS, ...MORE_LOCATIONS];
}

export function getLocation(id: string): LocationConfig | undefined {
  return getAllLocations().find((l) => l.id === id);
}
