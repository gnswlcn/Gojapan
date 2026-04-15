import type { Variants, Transition } from 'framer-motion';

// 공통 spring 전환
export const snappySpring: Transition = {
  type: 'spring',
  stiffness: 400,
  damping: 30,
};

export const quickFade: Transition = {
  duration: 0.15,
};

// Phase 전환 variants
export const phaseVariants: Variants = {
  initial: { opacity: 0, y: 12, scale: 0.98 },
  animate: { opacity: 1, y: 0, scale: 1 },
  exit: { opacity: 0, y: -8, scale: 0.98 },
};

// NPC 말풍선 variants
export const bubbleVariants: Variants = {
  initial: { opacity: 0, x: -12, scale: 0.95 },
  animate: { opacity: 1, x: 0, scale: 1 },
  exit: { opacity: 0, scale: 0.9 },
};

// 선택지 stagger variants
export const choiceVariants: Variants = {
  initial: { opacity: 0, y: 8 },
  animate: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.05, ...snappySpring },
  }),
};

// 정답 펄스
export const correctPulse: Variants = {
  initial: { scale: 1 },
  animate: {
    scale: [1, 1.05, 1],
    transition: { duration: 0.3 },
  },
};

// 오답 쉐이크
export const wrongShake: Variants = {
  initial: { x: 0 },
  animate: {
    x: [-4, 4, -3, 3, -1, 0],
    transition: { duration: 0.3 },
  },
};

// 프로그레스 바 spring
export const progressSpring: Transition = {
  type: 'spring',
  stiffness: 300,
  damping: 25,
};

// 카드 목록 stagger
export const staggerContainer: Variants = {
  animate: {
    transition: { staggerChildren: 0.04 },
  },
};

export const staggerItem: Variants = {
  initial: { opacity: 0, x: -12 },
  animate: { opacity: 1, x: 0 },
};
