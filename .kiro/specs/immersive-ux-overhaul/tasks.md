# 구현 계획: Immersive UX Overhaul

## 개요

기존 아키텍처를 유지하면서 애니메이션 시스템, 세션 관리, 피드백 시스템, Quick Resume 위젯을 점진적으로 구현한다. 순수 로직 함수를 먼저 구현하고, UI 통합을 나중에 수행하여 각 단계에서 테스트 가능한 상태를 유지한다.

## Tasks

- [x] 1. 공유 유틸리티 및 애니메이션 시스템 구축
  - [x] 1.1 `lib/animations.ts` 생성 — 공유 framer-motion variants 및 transition 정의
    - `snappySpring`, `quickFade`, `phaseVariants`, `bubbleVariants`, `choiceVariants`, `correctPulse`, `wrongShake`, `progressSpring`, `staggerContainer`, `staggerItem` 정의
    - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5_
  - [x] 1.2 `lib/haptics.ts` 생성 — Vibration API 래퍼 함수
    - `hapticSuccess()` (50ms), `hapticError()` ([50,50,50]), `hapticTap()` (10ms) 구현
    - navigator.vibrate 미지원 시 no-op 처리
    - _Requirements: 3.5_
  - [x] 1.3 `lib/sessionUtils.ts` 생성 — 순수 로직 유틸리티 함수
    - `buildResumeData(session, episodes, locations)` — Quick Resume 위젯 데이터 구성
    - `findFirstIncompleteEpisode(episodes, completedIds)` — 첫 번째 미완료 에피소드 탐색
    - `findCorrectChoice(choices)` — 정답 선택지 식별
    - `calculateProgress(turnIndex, totalTurns)` — 진행률 퍼센트 계산
    - `buildCompletionSummary(vocabLearned, hp, startTime)` — 완료 요약 데이터 구성
    - `applyComboAction(combo, isCorrect)` — 콤보 카운터 로직
    - `isSessionValid(session)` — 세션 유효성 판단 (24시간 이내)
    - _Requirements: 2.2, 2.3, 2.5, 3.3, 4.1, 4.3, 4.4_
  - [ ]* 1.4 `lib/sessionUtils.test.ts` 생성 — 순수 함수 속성 테스트 (fast-check)
    - **Property 1: Quick Resume 데이터 완전성 및 네비게이션**
    - **Validates: Requirements 2.2, 2.5**
    - **Property 2: 첫 번째 미완료 에피소드 탐색**
    - **Validates: Requirements 2.3**
    - **Property 3: 오답 시 정답 식별**
    - **Validates: Requirements 3.3**
    - **Property 4: 진행률 계산 정확성**
    - **Validates: Requirements 4.1**
    - **Property 5: 에피소드 완료 요약 데이터 완전성**
    - **Validates: Requirements 4.3**
    - **Property 6: 콤보 카운터 스트릭 로직**
    - **Validates: Requirements 4.4**
  - [ ]* 1.5 `lib/haptics.test.ts` 생성 — 햅틱 함수 단위 테스트
    - navigator.vibrate mock으로 올바른 진동 패턴 호출 검증
    - Vibration API 미지원 시 에러 없이 동작 검증
    - _Requirements: 3.5_

- [x] 2. Checkpoint — 유틸리티 테스트 통과 확인
  - 모든 테스트가 통과하는지 확인하고, 문제가 있으면 사용자에게 질문한다.

- [x] 3. Progress Store 확장 — 세션 관리
  - [x] 3.1 `store/useProgressStore.ts` 수정 — lastSession 필드 및 액션 추가
    - `LastSession` 인터페이스 정의 (episodeId, turnIndex, locationId, timestamp)
    - `lastSession: LastSession | null` 상태 필드 추가
    - `saveSession(episodeId, turnIndex, locationId)` 액션 추가
    - `clearSession()` 액션 추가
    - Zustand persist가 자동으로 localStorage에 저장
    - _Requirements: 6.1, 6.2, 6.3_
  - [ ]* 3.2 `store/useProgressStore.test.ts` 생성 — 세션 저장/복원 속성 테스트
    - **Property 7: 세션 저장/복원 라운드 트립**
    - **Validates: Requirements 6.1, 6.2, 6.4**
    - **Property 8: 세션 초기화**
    - **Validates: Requirements 6.3**

- [x] 4. Shadowing Play Screen 개선
  - [x] 4.1 `app/shadow/play/page.tsx` 수정 — 전환 속도 최적화
    - `lib/animations.ts`의 variants 적용 (phaseVariants, bubbleVariants, quickFade)
    - AnimatePresence의 mode="wait" 유지, transition duration 단축
    - vocab 카드 tap-through guard 시간을 350ms → 200ms로 단축
    - TTS 후 Phase 전환 딜레이를 300ms → 150ms로 단축
    - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5_
  - [x] 4.2 `app/shadow/play/page.tsx` 수정 — 정답/오답 피드백 시스템
    - 정답 선택 시: correctPulse variant + emerald 배경 + ✓ 아이콘 + hapticSuccess()
    - 오답 선택 시: wrongShake variant + red 배경 + 정답 하이라이트 + hapticError()
    - NPC 아바타 정답 반응: 바운스 애니메이션 추가
    - `findCorrectChoice()` 사용하여 오답 시 정답 하이라이트
    - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5_
  - [x] 4.3 `app/shadow/play/page.tsx` 수정 — 콤보 카운터 추가
    - `combo` 상태 추가, `applyComboAction()` 사용
    - 콤보 2 이상일 때 화면 상단에 "🔥 x{N} 콤보!" 표시
    - scale-up spring 애니메이션 적용
    - _Requirements: 4.4_
  - [x] 4.4 `app/shadow/play/page.tsx` 수정 — 프로그레스 바 및 완료 화면 개선
    - 프로그레스 바에 progressSpring transition 적용
    - 세션 시작 시 `startTime = Date.now()` 기록
    - 완료 화면에 confetti 파티클 효과 추가 (framer-motion으로 구현)
    - `buildCompletionSummary()` 사용하여 소요 시간 표시
    - _Requirements: 4.1, 4.2, 4.3_
  - [x] 4.5 `app/shadow/play/page.tsx` 수정 — 세션 자동 저장
    - 턴 전환 시 `saveSession()` 호출
    - 에피소드 완료 시 `clearSession()` 호출
    - _Requirements: 6.1, 6.3_
  - [x] 4.6 `app/shadow/play/page.tsx` 수정 — 선택지 stagger 애니메이션
    - choiceVariants 적용하여 각 버튼 50ms 간격 순차 등장
    - 버튼 탭 시 scale(0.95) press 애니메이션 (whileTap)
    - _Requirements: 5.2, 5.5_

- [x] 5. Checkpoint — 쉐도잉 플레이 화면 동작 확인
  - 모든 테스트가 통과하는지 확인하고, 문제가 있으면 사용자에게 질문한다.

- [x] 6. Home Screen 개선
  - [x] 6.1 `app/page.tsx` 수정 — Quick Resume 위젯 추가
    - `lastSession`과 `isSessionValid()` 사용하여 위젯 표시 여부 결정
    - `buildResumeData()` 사용하여 에피소드 제목, 장소 이름, 진행률 표시
    - 탭 시 `/shadow/play?ep={episodeId}` 로 직접 이동
    - 오늘의 학습 섹션 위에 배치
    - _Requirements: 2.1, 2.2, 2.5_
  - [x] 6.2 `app/page.tsx` 수정 — 장소 카드 stagger 애니메이션 개선
    - staggerContainer/staggerItem variants 적용
    - 기존 개별 delay 계산을 variants 기반으로 교체
    - _Requirements: 5.4_
  - [x] 6.3 `app/page.tsx` 수정 — 미완료 에피소드 하이라이트
    - `findFirstIncompleteEpisode()` 사용하여 장소 카드에 다음 에피소드 정보 표시
    - _Requirements: 2.3_

- [x] 7. Final Checkpoint — 전체 통합 확인
  - 모든 테스트가 통과하는지 확인하고, 문제가 있으면 사용자에게 질문한다.

## Notes

- `*` 표시된 태스크는 선택적이며 빠른 MVP를 위해 건너뛸 수 있다
- 각 태스크는 특정 요구사항을 참조하여 추적 가능하다
- Checkpoint에서 점진적 검증을 수행한다
- 속성 테스트는 보편적 정확성을, 단위 테스트는 특정 예제와 경계값을 검증한다
- Next.js 16 관련 변경사항은 `node_modules/next/dist/docs/`를 참조하여 확인한다
