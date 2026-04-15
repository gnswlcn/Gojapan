// lib/sessionUtils.ts — 순수 로직 유틸리티 함수 (side-effect 없음)
// Requirements: 2.2, 2.3, 2.5, 3.3, 4.1, 4.3, 4.4

import type { EpisodeMeta } from './episodes';
import type { LocationConfig } from './locations';

// ─── Types ───────────────────────────────────────────────────────────────────

export interface LastSession {
  episodeId: string;
  turnIndex: number;
  locationId: string;
  timestamp: string; // ISO string
}

export interface ResumeData {
  episodeTitle: string;
  locationName: string;
  progress: number; // percent 0 < p <= 100
  url: string;
}

export interface Choice {
  id: string;
  jp: string;
  ko: string;
  correct: boolean;
  [key: string]: unknown; // allow extra fields like reading, jp_ruby
}

export interface CompletionSummary {
  vocabLearned: number;
  hp: number;
  elapsedMs: number;
}

export interface ComboState {
  combo: number;
}

// ─── Constants ───────────────────────────────────────────────────────────────

const SESSION_MAX_AGE_MS = 24 * 60 * 60 * 1000; // 24 hours
export const MAX_HP = 3;

// ─── Functions ───────────────────────────────────────────────────────────────

/**
 * 세션 유효성 판단 — null이거나 24시간 이상 경과하면 false
 * Validates: Requirements 2.1 (Quick Resume 표시 여부)
 */
export function isSessionValid(session: LastSession | null): boolean {
  if (!session) return false;
  const age = Date.now() - new Date(session.timestamp).getTime();
  return age < SESSION_MAX_AGE_MS;
}

/**
 * Quick Resume 위젯 데이터 구성
 * Validates: Requirements 2.2, 2.5
 */
export function buildResumeData(
  session: LastSession,
  episodes: EpisodeMeta[],
  locations: LocationConfig[],
): ResumeData | null {
  const episode = episodes.find((e) => e.id === session.episodeId);
  if (!episode) return null;

  const location = locations.find((l) => l.id === session.locationId);
  if (!location) return null;

  const progress = calculateProgress(session.turnIndex, episode.totalTurns);

  return {
    episodeTitle: episode.title,
    locationName: location.name_ko,
    progress,
    url: `/shadow/play?ep=${session.episodeId}`,
  };
}

/**
 * 첫 번째 미완료 에피소드 탐색 — 목록 순서상 가장 앞에 있는 미완료 에피소드 반환
 * 모든 에피소드가 완료된 경우 null 반환
 * Validates: Requirements 2.3
 */
export function findFirstIncompleteEpisode(
  episodes: EpisodeMeta[],
  completedIds: Set<string>,
): EpisodeMeta | null {
  return episodes.find((e) => !completedIds.has(e.id)) ?? null;
}

/**
 * 정답 선택지 식별 — correct: true인 선택지 반환
 * Validates: Requirements 3.3
 */
export function findCorrectChoice(choices: Choice[]): Choice | undefined {
  return choices.find((c) => c.correct);
}

/**
 * 진행률 퍼센트 계산
 * Formula: (turnIndex + 1) / totalTurns * 100
 * Result: 0 < progress <= 100
 * Validates: Requirements 4.1
 */
export function calculateProgress(turnIndex: number, totalTurns: number): number {
  if (totalTurns <= 0) return 100;
  const clamped = Math.min(Math.max(turnIndex, 0), totalTurns - 1);
  return ((clamped + 1) / totalTurns) * 100;
}

/**
 * 완료 요약 데이터 구성
 * Validates: Requirements 4.3
 */
export function buildCompletionSummary(
  vocabLearned: number,
  hp: number,
  startTime: number,
): CompletionSummary {
  return {
    vocabLearned: Math.max(0, vocabLearned),
    hp: Math.max(0, Math.min(hp, MAX_HP)),
    elapsedMs: Math.max(0, Date.now() - startTime),
  };
}

/**
 * 콤보 카운터 로직 — 정답이면 +1, 오답이면 0으로 리셋
 * Validates: Requirements 4.4
 */
export function applyComboAction(combo: number, isCorrect: boolean): number {
  return isCorrect ? combo + 1 : 0;
}
