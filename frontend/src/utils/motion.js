/**
 * OralAI Global Motion Tokens and Framer Motion Variants
 * Compliant with OralAI Balanced Premium Animation System
 */

export const transitions = {
  springGentle: { type: 'spring', stiffness: 280, damping: 26 },
  springSnappy: { type: 'spring', stiffness: 420, damping: 28 },
  springBouncy: { type: 'spring', stiffness: 380, damping: 20 },
  smoothEase: { duration: 0.35, ease: [0.16, 1, 0.3, 1] },
  smoothFast: { duration: 0.22, ease: [0.16, 1, 0.3, 1] },
  pageTransition: { duration: 0.32, ease: [0.25, 0.46, 0.45, 0.94] },
};

export const staggerContainer = (staggerChildren = 0.08, delayChildren = 0) => ({
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren,
      delayChildren,
    },
  },
});

export const fadeIn = (direction = 'up', delay = 0, duration = 0.35) => ({
  hidden: {
    opacity: 0,
    y: direction === 'up' ? 14 : direction === 'down' ? -14 : 0,
    x: direction === 'left' ? 14 : direction === 'right' ? -14 : 0,
  },
  show: {
    opacity: 1,
    y: 0,
    x: 0,
    transition: {
      duration,
      delay,
      ease: [0.16, 1, 0.3, 1],
    },
  },
});

export const cardHoverMotion = {
  whileHover: {
    y: -4,
    transition: { duration: 0.24, ease: [0.16, 1, 0.3, 1] },
  },
  whileTap: {
    scale: 0.985,
    transition: { duration: 0.12 },
  },
};

export const buttonMotion = {
  whileHover: {
    y: -1.5,
    transition: { duration: 0.18, ease: [0.16, 1, 0.3, 1] },
  },
  whileTap: {
    scale: 0.97,
    transition: { duration: 0.12 },
  },
};

export const toothFloatMotion = {
  animate: {
    y: [-8, 8, -8],
    rotateZ: [-0.5, 0.5, -0.5],
  },
  transition: {
    duration: 6,
    repeat: Infinity,
    ease: 'easeInOut',
  },
};
