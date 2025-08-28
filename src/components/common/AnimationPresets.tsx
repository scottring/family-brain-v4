'use client'

import { Variants } from 'framer-motion'

// Common animation variants for consistent motion design
export const fadeInUp: Variants = {
  initial: {
    opacity: 0,
    y: 20
  },
  animate: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.4,
      ease: 'easeOut'
    }
  },
  exit: {
    opacity: 0,
    y: -10,
    transition: {
      duration: 0.2,
      ease: 'easeIn'
    }
  }
}

export const fadeInDown: Variants = {
  initial: {
    opacity: 0,
    y: -20
  },
  animate: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.4,
      ease: 'easeOut'
    }
  },
  exit: {
    opacity: 0,
    y: -10,
    transition: {
      duration: 0.2,
      ease: 'easeIn'
    }
  }
}

export const fadeInLeft: Variants = {
  initial: {
    opacity: 0,
    x: -20
  },
  animate: {
    opacity: 1,
    x: 0,
    transition: {
      duration: 0.4,
      ease: 'easeOut'
    }
  },
  exit: {
    opacity: 0,
    x: -10,
    transition: {
      duration: 0.2,
      ease: 'easeIn'
    }
  }
}

export const fadeInRight: Variants = {
  initial: {
    opacity: 0,
    x: 20
  },
  animate: {
    opacity: 1,
    x: 0,
    transition: {
      duration: 0.4,
      ease: 'easeOut'
    }
  },
  exit: {
    opacity: 0,
    x: 10,
    transition: {
      duration: 0.2,
      ease: 'easeIn'
    }
  }
}

export const scaleIn: Variants = {
  initial: {
    opacity: 0,
    scale: 0.9
  },
  animate: {
    opacity: 1,
    scale: 1,
    transition: {
      duration: 0.3,
      ease: 'easeOut'
    }
  },
  exit: {
    opacity: 0,
    scale: 0.95,
    transition: {
      duration: 0.2,
      ease: 'easeIn'
    }
  }
}

export const slideInUp: Variants = {
  initial: {
    y: '100%',
    opacity: 0
  },
  animate: {
    y: 0,
    opacity: 1,
    transition: {
      duration: 0.4,
      ease: 'easeOut'
    }
  },
  exit: {
    y: '100%',
    opacity: 0,
    transition: {
      duration: 0.3,
      ease: 'easeIn'
    }
  }
}

export const slideInDown: Variants = {
  initial: {
    y: '-100%',
    opacity: 0
  },
  animate: {
    y: 0,
    opacity: 1,
    transition: {
      duration: 0.4,
      ease: 'easeOut'
    }
  },
  exit: {
    y: '-100%',
    opacity: 0,
    transition: {
      duration: 0.3,
      ease: 'easeIn'
    }
  }
}

export const staggerContainer: Variants = {
  initial: {},
  animate: {
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.1
    }
  },
  exit: {
    transition: {
      staggerChildren: 0.05,
      staggerDirection: -1
    }
  }
}

export const staggerItem: Variants = {
  initial: {
    opacity: 0,
    y: 20
  },
  animate: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.4,
      ease: 'easeOut'
    }
  },
  exit: {
    opacity: 0,
    y: 10,
    transition: {
      duration: 0.2,
      ease: 'easeIn'
    }
  }
}

export const pulseAnimation: Variants = {
  animate: {
    scale: [1, 1.05, 1],
    transition: {
      duration: 2,
      repeat: Infinity,
      repeatType: 'reverse',
      ease: 'easeInOut'
    }
  }
}

export const bounceIn: Variants = {
  initial: {
    opacity: 0,
    scale: 0.3
  },
  animate: {
    opacity: 1,
    scale: 1,
    transition: {
      type: 'spring',
      stiffness: 200,
      damping: 10
    }
  },
  exit: {
    opacity: 0,
    scale: 0.8,
    transition: {
      duration: 0.2,
      ease: 'easeIn'
    }
  }
}

export const rotateIn: Variants = {
  initial: {
    opacity: 0,
    rotate: -180,
    scale: 0.5
  },
  animate: {
    opacity: 1,
    rotate: 0,
    scale: 1,
    transition: {
      duration: 0.6,
      ease: 'easeOut'
    }
  },
  exit: {
    opacity: 0,
    rotate: 180,
    scale: 0.5,
    transition: {
      duration: 0.4,
      ease: 'easeIn'
    }
  }
}

export const flipIn: Variants = {
  initial: {
    opacity: 0,
    rotateY: -90,
    transformPerspective: 1000
  },
  animate: {
    opacity: 1,
    rotateY: 0,
    transition: {
      duration: 0.6,
      ease: 'easeOut'
    }
  },
  exit: {
    opacity: 0,
    rotateY: 90,
    transition: {
      duration: 0.4,
      ease: 'easeIn'
    }
  }
}

// Page transition variants
export const pageVariants: Variants = {
  initial: {
    opacity: 0,
    x: '-100vw'
  },
  in: {
    opacity: 1,
    x: 0,
    transition: {
      type: 'tween',
      ease: 'anticipate',
      duration: 0.6
    }
  },
  out: {
    opacity: 0,
    x: '100vw',
    transition: {
      type: 'tween',
      ease: 'anticipate',
      duration: 0.4
    }
  }
}

// Modal overlay variants
export const overlayVariants: Variants = {
  hidden: {
    opacity: 0
  },
  visible: {
    opacity: 1,
    transition: {
      duration: 0.3
    }
  },
  exit: {
    opacity: 0,
    transition: {
      duration: 0.2
    }
  }
}

// Modal content variants
export const modalVariants: Variants = {
  hidden: {
    opacity: 0,
    scale: 0.8,
    y: 50
  },
  visible: {
    opacity: 1,
    scale: 1,
    y: 0,
    transition: {
      type: 'spring',
      stiffness: 300,
      damping: 30
    }
  },
  exit: {
    opacity: 0,
    scale: 0.8,
    y: 50,
    transition: {
      duration: 0.2
    }
  }
}

// Hover effects
export const hoverScale = {
  scale: 1.05,
  transition: {
    duration: 0.2,
    ease: 'easeInOut'
  }
}

export const hoverLift = {
  y: -4,
  transition: {
    duration: 0.2,
    ease: 'easeInOut'
  }
}

export const tapScale = {
  scale: 0.95,
  transition: {
    duration: 0.1,
    ease: 'easeInOut'
  }
}

// Loading animations
export const spinningLoader: Variants = {
  animate: {
    rotate: 360,
    transition: {
      duration: 1,
      repeat: Infinity,
      ease: 'linear'
    }
  }
}

export const pulsingDot: Variants = {
  animate: {
    scale: [1, 1.2, 1],
    opacity: [0.5, 1, 0.5],
    transition: {
      duration: 1.5,
      repeat: Infinity,
      ease: 'easeInOut'
    }
  }
}

// Success/Error animations
export const successCheckmark: Variants = {
  initial: {
    pathLength: 0,
    opacity: 0
  },
  animate: {
    pathLength: 1,
    opacity: 1,
    transition: {
      duration: 0.6,
      ease: 'easeOut'
    }
  }
}

export const errorShake: Variants = {
  animate: {
    x: [0, -10, 10, -10, 10, 0],
    transition: {
      duration: 0.4,
      ease: 'easeInOut'
    }
  }
}