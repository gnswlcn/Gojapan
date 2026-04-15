# 요구사항 문서

## 소개

GoJapan 앱의 전반적인 UX를 "속도감 있고 몰입감 있는" 경험으로 개선하는 기능이다. 쉐도잉 플레이 화면의 전환 속도 향상, 홈에서 학습까지의 동선 단축, 마이크로 인터랙션 및 피드백 개선을 포함한다. 단어 드릴 게이미피케이션은 범위에서 제외한다.

## 용어집

- **Shadowing_Play_Screen**: 에피소드 대화를 듣고 따라 말하는 메인 학습 화면 (`app/shadow/play/page.tsx`)
- **Home_Screen**: 장소 카드 목록과 오늘의 학습 현황을 보여주는 메인 화면 (`app/page.tsx`)
- **Turn**: 에피소드 대화의 한 단위 (listen 또는 choice 타입)
- **Phase**: 쉐도잉 플레이의 진행 단계 (tts → vocab → choosing → shadow → done)
- **Quick_Resume_Widget**: 홈 화면에서 마지막 학습 위치로 즉시 복귀할 수 있는 UI 컴포넌트
- **Transition_Animation**: 턴 간, 페이즈 간 전환 시 재생되는 모션 애니메이션
- **Feedback_Indicator**: 정답/오답 시 사용자에게 시각적·촉각적 피드백을 제공하는 UI 요소
- **Progress_Store**: Zustand 기반 학습 진행 상태 관리 스토어 (`store/useProgressStore.ts`)
- **NPC_Avatar**: 대화 상대 캐릭터의 이모지 기반 아바타 컴포넌트

## 요구사항

### 요구사항 1: 쉐도잉 플레이 턴 전환 속도 개선

**사용자 스토리:** 학습자로서, 대화 턴 사이의 대기 시간이 줄어들기를 원한다. 그래야 학습 흐름이 끊기지 않고 속도감 있게 진행할 수 있다.

#### 수용 기준

1. WHEN TTS 재생이 완료되면, THE Shadowing_Play_Screen SHALL 300ms 이내에 다음 Phase로 전환한다
2. WHEN 사용자가 "다음" 버튼을 탭하면, THE Shadowing_Play_Screen SHALL 현재 턴의 exit 애니메이션과 다음 턴의 enter 애니메이션을 200ms 이내에 동시 실행한다
3. WHEN Phase가 전환되면, THE Transition_Animation SHALL 이전 Phase의 콘텐츠를 fade-out하고 새 Phase의 콘텐츠를 slide-up으로 표시한다
4. WHEN vocab 카드가 표시되면, THE Shadowing_Play_Screen SHALL 카드 등장 후 200ms 이내에 사용자 입력을 수용한다
5. WHEN 사용자가 vocab 카드에서 "알아요" 또는 "몰라요"를 탭하면, THE Shadowing_Play_Screen SHALL 100ms 이내에 다음 카드 또는 다음 Phase로 전환한다

### 요구사항 2: 홈에서 학습까지 빠른 진입

**사용자 스토리:** 학습자로서, 홈 화면에서 최소한의 탭으로 학습을 시작하거나 이어가기를 원한다. 그래야 앱을 열자마자 바로 학습에 몰입할 수 있다.

#### 수용 기준

1. WHEN 사용자가 진행 중인 에피소드가 있으면, THE Home_Screen SHALL "이어하기" Quick_Resume_Widget을 화면 상단에 표시한다
2. WHEN 사용자가 Quick_Resume_Widget을 탭하면, THE Home_Screen SHALL 해당 에피소드의 Shadowing_Play_Screen으로 직접 이동한다
3. WHEN 사용자가 모든 에피소드를 완료한 장소가 아닌 장소 카드를 탭하면, THE Home_Screen SHALL 해당 장소의 첫 번째 미완료 에피소드를 하이라이트하여 표시한다
4. WHEN 앱이 처음 로드되면, THE Home_Screen SHALL 300ms 이내에 장소 카드 목록을 렌더링 완료한다
5. WHEN 사용자에게 추천할 다음 에피소드가 있으면, THE Quick_Resume_Widget SHALL 에피소드 제목, 장소 이름, 진행률 정보를 함께 표시한다

### 요구사항 3: 정답/오답 피드백 강화

**사용자 스토리:** 학습자로서, 선택지를 고를 때 정답과 오답에 대한 즉각적이고 명확한 피드백을 받기를 원한다. 그래야 학습 효과가 높아지고 게임처럼 몰입할 수 있다.

#### 수용 기준

1. WHEN 사용자가 정답 선택지를 탭하면, THE Feedback_Indicator SHALL 선택된 버튼에 성공 색상(emerald) 펄스 애니메이션과 체크마크 아이콘을 100ms 이내에 표시한다
2. WHEN 사용자가 오답 선택지를 탭하면, THE Feedback_Indicator SHALL 선택된 버튼에 실패 색상(red) 쉐이크 애니메이션을 100ms 이내에 표시한다
3. WHEN 사용자가 오답을 선택하면, THE Feedback_Indicator SHALL 정답 선택지를 하이라이트하여 올바른 답을 시각적으로 알려준다
4. WHEN 사용자가 정답을 선택하면, THE NPC_Avatar SHALL 긍정적 반응 애니메이션(바운스 또는 하트 이모지)을 재생한다
5. IF 디바이스가 Vibration API를 지원하면, THEN THE Feedback_Indicator SHALL 정답 시 짧은 진동(50ms), 오답 시 이중 진동(50ms-50ms-50ms)을 실행한다

### 요구사항 4: 진행률 표시 개선

**사용자 스토리:** 학습자로서, 에피소드 진행 상황을 직관적이고 보상감 있게 확인하기를 원한다. 그래야 학습 동기가 유지된다.

#### 수용 기준

1. WHEN 턴이 진행되면, THE Shadowing_Play_Screen SHALL 프로그레스 바를 스프링 애니메이션으로 업데이트한다
2. WHEN 에피소드의 마지막 턴이 완료되면, THE Shadowing_Play_Screen SHALL 완료 축하 화면을 confetti 또는 파티클 애니메이션과 함께 표시한다
3. WHEN 에피소드 완료 화면이 표시되면, THE Shadowing_Play_Screen SHALL 학습한 단어 수, 잔여 HP, 소요 시간을 요약하여 표시한다
4. WHEN 사용자가 연속 정답을 달성하면, THE Shadowing_Play_Screen SHALL 콤보 카운터를 표시하고 연속 정답 수를 시각적으로 강조한다

### 요구사항 5: 전반적 애니메이션 품질 향상

**사용자 스토리:** 학습자로서, 앱 전체에서 부드럽고 일관된 애니메이션을 경험하기를 원한다. 그래야 앱이 세련되고 몰입감 있게 느껴진다.

#### 수용 기준

1. THE Shadowing_Play_Screen SHALL 모든 Phase 전환에 framer-motion의 spring 타입 애니메이션을 사용한다
2. WHEN 선택지 버튼이 표시되면, THE Shadowing_Play_Screen SHALL 각 버튼을 50ms 간격의 stagger 애니메이션으로 순차 등장시킨다
3. WHEN NPC 말풍선이 전환되면, THE Transition_Animation SHALL 이전 말풍선을 scale-down하며 fade-out하고 새 말풍선을 slide-in하며 fade-in한다
4. THE Home_Screen SHALL 장소 카드 목록을 stagger 애니메이션으로 순차 등장시킨다
5. WHEN 사용자가 버튼을 탭하면, THE Shadowing_Play_Screen SHALL 해당 버튼에 scale(0.95) press 애니메이션을 적용한다

### 요구사항 6: 학습 세션 상태 관리

**사용자 스토리:** 학습자로서, 앱을 닫았다가 다시 열어도 마지막 학습 위치에서 이어갈 수 있기를 원한다. 그래야 학습 진행이 유실되지 않는다.

#### 수용 기준

1. WHEN 사용자가 에피소드 중간에 앱을 떠나면, THE Progress_Store SHALL 현재 에피소드 ID와 턴 인덱스를 로컬 스토리지에 저장한다
2. WHEN 사용자가 앱에 복귀하면, THE Progress_Store SHALL 저장된 세션 정보를 복원하여 Quick_Resume_Widget에 제공한다
3. WHEN 에피소드가 완료되면, THE Progress_Store SHALL 저장된 세션 정보를 초기화한다
4. FOR ALL 유효한 세션 정보에 대해, 저장 후 복원하면 동일한 에피소드 ID와 턴 인덱스를 반환한다 (라운드 트립 속성)
