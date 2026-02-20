'use client'

import { motion, HTMLMotionProps } from 'framer-motion'

interface MotionContainerProps extends HTMLMotionProps<'div'> {
  children: React.ReactNode
  delay?: number
}

export function MotionContainer({ 
  children, 
  delay = 0,
  initial = { opacity: 0, y: 20 },
  animate = { opacity: 1, y: 0 },
  transition = { duration: 0.5, ease: [0.22, 1, 0.36, 1] },
  ...props 
}: MotionContainerProps) {
  return (
    <motion.div
      initial={initial}
      animate={animate}
      transition={{ ...transition, delay }}
      {...props}
    >
      {children}
    </motion.div>
  )
}

export function StaggerChildren({ 
  children, 
  staggerDelay = 0.1,
  ...props 
}: { 
  children: React.ReactNode
  staggerDelay?: number 
} & HTMLMotionProps<'div'>) {
  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={{
        hidden: { opacity: 0 },
        visible: {
          opacity: 1,
          transition: {
            staggerChildren: staggerDelay
          }
        }
      }}
      {...props}
    >
      {children}
    </motion.div>
  )
}

export function MotionItem({ children, ...props }: HTMLMotionProps<'div'>) {
  return (
    <motion.div
      variants={{
        hidden: { opacity: 0, y: 20 },
        visible: { 
          opacity: 1, 
          y: 0,
          transition: {
            duration: 0.6,
            ease: [0.22, 1, 0.36, 1]
          }
        }
      }}
      {...props}
    >
      {children}
    </motion.div>
  )
}
