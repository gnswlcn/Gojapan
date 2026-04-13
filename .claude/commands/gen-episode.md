# /gen-episode — 맞춤 에피소드 생성

일본어 쉐도잉 에피소드를 생성해서 파일로 저장합니다.

## 사용법

```
/gen-episode [레벨] [시나리오] [타겟 단어...]
```

**예시**
- `/gen-episode N5 약국`
- `/gen-episode N4 카페 注文 お会計`
- `/gen-episode N3 병원 予約 症状 처방전`

인자 없이 호출하면 현재 등록된 에피소드 목록을 보고 빠진 레벨/시나리오를 채워줍니다.

---

## 실행 절차

### 1. 기존 에피소드 파악

`/home/user/Gojapan/data/` 안의 `shadow_ep*.json` 파일 목록을 확인해서 다음 에피소드 번호를 결정합니다.
예: `ep001`~`ep004`가 있으면 새 파일은 `shadow_ep005.json`, id는 `ep005`.

### 2. 에피소드 JSON 생성 규칙

아래 스키마를 정확히 따릅니다.

```jsonc
{
  "episode_info": {
    "id": "ep005",                  // 자동 채번
    "title": "한국어 제목",
    "title_jp": "日本語タイトル",
    "setting_ko": "장소 (한국어)",
    "setting_jp": "場所（日本語）",
    "difficulty": "N5",             // 인자로 받은 레벨
    "thumbnail": "🎯",             // 시나리오에 맞는 이모지
    "description": "한 줄 설명 (한국어)"
  },
  "npc": {
    "name": "NPC 이름 (한국어)",
    "friendly_emoji": "🙂",
    "attack_emoji": "😤",
    "weapon_emoji": "🔪",
    "attack_messages": [
      // 5개, NPC 직업에 맞게 유머러스하게, 한국어
    ]
  },
  "vocabulary": [
    // 대화에서 핵심적으로 등장하는 단어만 (4~8개)
    // 형식: { "vocab_id": "n5_XXX", "jp": "漢字", "reading": "よみ", "ko": "뜻" }
  ],
  "dialogue_flow": [
    // 5~6턴. listen 1~2개 + choice 3~4개 혼합
    // 각 turn 스키마는 아래 참고
  ]
}
```

#### turn 스키마 (`type: "listen"`)
```jsonc
{
  "id": "t01",
  "speaker": "clerk",
  "jp": "日本語文",
  "jp_ruby": "{漢字|よみ} 형식으로 루비 포함한 전체 문장",
  "reading": "전체 히라가나 읽기",
  "ko_meaning": "한국어 번역",
  "type": "listen",
  "vocab_ids": []   // 이 턴에서 강조할 vocab_id 목록 (없으면 빈 배열)
}
```

#### turn 스키마 (`type: "choice"`)
```jsonc
{
  "id": "t02",
  "speaker": "clerk",
  "jp": "日本語文",
  "jp_ruby": "{漢字|よみ} 형식",
  "reading": "전체 히라가나",
  "ko_meaning": "한국어 번역",
  "type": "choice",
  "vocab_ids": ["vocab_id_1"],
  "thought_ko": "학습자 내면의 소리 — 이 상황에서 뭐라고 해야 할지 힌트 (한국어)",
  "choices": [
    {
      "id": "a",
      "jp": "틀린 선택지 (문법/경어 실수)",
      "jp_ruby": "{漢字|よみ} 형식",
      "reading": "히라가나",
      "ko": "한국어 번역",
      "correct": false
    },
    {
      "id": "b",
      "jp": "올바른 선택지",
      "jp_ruby": "{漢字|よみ} 형식",
      "reading": "히라가나",
      "ko": "한국어 번역",
      "correct": true
    }
  ]
}
```

### 3. 품질 기준

- **경어 수준**: N5는 ~ます/~です, N4는 ~でしょうか/~いただけますか, N3+ は ~ていただけますでしょうか 등
- **오답 설계**: 단순 틀린 말이 아니라, 실제 학습자가 실수하기 쉬운 표현 (경어 부족, 조수사 오류, 자연스럽지 않은 직역 등)
- **vocabulary**: 대화에서 실제 사용되는 단어만 포함. `vocab_id`는 `n5_XXX` / `n4_XXX` 형식 (임의 번호 사용 가능)
- **jp_ruby**: 히라가나만 있는 단어는 루비 불필요, 한자 포함 단어만 `{漢字|よみ}` 형식 적용
- **타겟 단어 우선**: 인자로 전달된 단어를 vocabulary와 대화에 자연스럽게 포함

### 4. 파일 저장

생성한 JSON을 `/home/user/Gojapan/data/shadow_epXXX.json`에 저장합니다.

### 5. episodes.ts 등록

`/home/user/Gojapan/lib/episodes.ts`의 `ALL_EPISODES` 배열 맨 끝에 추가합니다:

```typescript
{
  id: 'ep005',
  world: 'N5',          // episode_info.difficulty 값
  title: '한국어 제목',
  thumbnail: '🎯',
  description: '한 줄 설명',
  totalTurns: 6,        // dialogue_flow 배열 길이
},
```

### 6. page.tsx import 추가

`/home/user/Gojapan/app/shadow/play/page.tsx` 상단의 import 블록에 추가:

```typescript
import ep005 from '@/data/shadow_ep005.json';
```

그리고 `EPISODES` 객체에도 추가:
```typescript
ep005: ep005 as EpisodeData,
```

### 7. 빌드 확인

```bash
npm run build
```

빌드 성공하면 git commit & push.

커밋 메시지 형식:
```
Add ep005: [제목] ([레벨])

[한 줄 설명]
```
