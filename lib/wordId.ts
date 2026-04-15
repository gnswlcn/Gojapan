/**
 * stableWordId — jp + reading 조합으로 일관된 단어 키 생성
 * 장소 vocab, 정적 에피소드, 생성 에피소드 등 소스에 관계없이
 * 같은 단어(같은 jp + reading)는 항상 같은 confidence 키를 사용
 */
export function stableWordId(jp: string, reading: string): string {
  let h = 5381;
  const s = jp + '\0' + reading;
  for (let i = 0; i < s.length; i++) {
    h = ((h << 5) + h) ^ s.charCodeAt(i);
    h = h >>> 0;
  }
  return 'w_' + h.toString(36);
}
