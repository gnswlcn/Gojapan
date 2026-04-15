import { createClient } from 'jsr:@supabase/supabase-js@2';
import Anthropic from 'npm:@anthropic-ai/sdk';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface VocabItem {
  id: string;
  jp: string;
  reading: string;
  ko: string;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { userId, locationId, locationName, locationVocab, weakWords } =
      await req.json() as {
        userId: string;
        locationId: string;
        locationName: string;
        locationVocab: VocabItem[];
        weakWords: string[];
      };

    if (!userId || !locationId) {
      return new Response(
        JSON.stringify({ error: 'userId and locationId required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    );

    const anthropic = new Anthropic({ apiKey: Deno.env.get('ANTHROPIC_API_KEY')! });

    // 약한 단어 목록 (최대 8개)
    const targetWords = (weakWords ?? []).slice(0, 8);
    const vocabList = (locationVocab ?? [])
      .map((v) => `${v.jp}(${v.reading}: ${v.ko})`)
      .join(', ');
    const targetWordsText = targetWords.length > 0
      ? `\n사용자 약점 단어 (대화에 반드시 포함): ${targetWords.join(', ')}`
      : '';

    const prompt = `
당신은 일본어 쉐도잉 학습 앱의 에피소드 생성기입니다.
"${locationName}" 장소 상황의 실전 대화 에피소드를 JSON으로 생성해주세요.

장소: ${locationName} (location_id: "${locationId}")
이 장소의 핵심 단어: ${vocabList}${targetWordsText}

반드시 아래 JSON 구조를 정확히 따라야 합니다:

{
  "episode_info": {
    "id": "gen_[타임스탬프]",
    "location_id": "${locationId}",
    "title": "한국어 제목",
    "title_jp": "日本語タイトル",
    "setting_ko": "${locationName}",
    "difficulty": "N4",
    "thumbnail": "이모지",
    "description": "한 줄 설명 (한국어)"
  },
  "npc": {
    "name": "NPC 이름 (한국어)",
    "friendly_emoji": "😊",
    "attack_emoji": "😤",
    "weapon_emoji": "🔪",
    "attack_messages": ["5개의 유머러스한 공격 메시지 (한국어)", "...", "...", "...", "..."]
  },
  "vocabulary": [
    { "vocab_id": "gen_v01", "jp": "漢字", "reading": "よみ", "ko": "뜻" }
  ],
  "dialogue_flow": [
    {
      "id": "t01",
      "speaker": "clerk",
      "jp": "일본어 문장",
      "jp_ruby": "{漢字|よみ} 형식 루비 포함 문장",
      "reading": "전체 히라가나",
      "ko_meaning": "한국어 번역",
      "type": "listen"
    },
    {
      "id": "t02",
      "speaker": "clerk",
      "jp": "일본어 문장",
      "jp_ruby": "{漢字|よみ} 형식",
      "reading": "전체 히라가나",
      "ko_meaning": "한국어 번역",
      "type": "choice",
      "vocab_ids": ["gen_v01"],
      "thought_ko": "학습자 내면의 소리 (힌트, 한국어)",
      "choices": [
        { "id": "a", "jp": "틀린 선택지", "jp_ruby": "루비", "reading": "히라가나", "ko": "한국어", "correct": false },
        { "id": "b", "jp": "올바른 선택지", "jp_ruby": "루비", "reading": "히라가나", "ko": "한국어", "correct": true },
        { "id": "c", "jp": "틀린 선택지2", "jp_ruby": "루비", "reading": "히라가나", "ko": "한국어", "correct": false }
      ]
    }
  ]
}

규칙:
- dialogue_flow는 5~6턴 (listen 1~2개 + choice 3~4개)
- ${locationName} 장소에서 실제로 벌어질 법한 자연스러운 시나리오
- 핵심 단어를 최소 3개 이상 대화에 녹여낼 것
- 경어체(~です/~ます) 사용
- 오답은 학습자가 실제로 헷갈리기 쉬운 표현으로 구성
- JSON만 출력 (설명 없이)
`;

    const response = await anthropic.messages.create({
      model: 'claude-opus-4-5',
      max_tokens: 4096,
      messages: [{ role: 'user', content: prompt }],
    });

    const text = response.content[0].type === 'text' ? response.content[0].text : '';
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error('No JSON in response');

    const episodeContent = JSON.parse(jsonMatch[0]);
    const episodeId = `gen_${Date.now()}`;
    episodeContent.episode_info.id = episodeId;
    // Ensure location_id is always set
    episodeContent.episode_info.location_id = locationId;

    const { error } = await supabase.from('episodes').insert({
      id: episodeId,
      level: locationId,        // repurpose level column for location
      target_words: targetWords,
      content: episodeContent,
      is_generated: true,
    });

    if (error) throw error;

    return new Response(JSON.stringify({ success: true, episodeId }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
