import React from 'react';
import { motion } from 'framer-motion';

const variants = {
  fadeInUp: {
    hidden: { opacity: 0, y: 60, scale: 0.95 },
    visible: { opacity: 1, y: 0, scale: 1, transition: { duration: 0.7, ease: [0.22, 1, 0.36, 1] } }
  },
  fadeInLeft: {
    hidden: { opacity: 0, x: -80, scale: 0.95 },
    visible: { opacity: 1, x: 0, scale: 1, transition: { duration: 0.8, ease: [0.22, 1, 0.36, 1] } }
  },
  fadeInRight: {
    hidden: { opacity: 0, x: 80, scale: 0.95 },
    visible: { opacity: 1, x: 0, scale: 1, transition: { duration: 0.8, ease: [0.22, 1, 0.36, 1] } }
  },
  staggerContainer: {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.15
      }
    }
  },
  staggerItem: {
    hidden: { opacity: 0, y: 40, scale: 0.9 },
    visible: { opacity: 1, y: 0, scale: 1, transition: { type: "spring", stiffness: 100, damping: 12 } }
  }
};

const AnimatedSection = ({ children, animation = "fadeInUp", className = "", once = false, delay = 0 }) => {
  const selectedVariant = variants[animation] || variants.fadeInUp;
  
  if (animation === "staggerContainer") {
      return (
        <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once, margin: "-100px" }}
            variants={selectedVariant}
            className={className}
        >
            {children}
        </motion.div>
      )
  }

  // To support delay on individual items if needed
  const variantWithDelay = {
    ...selectedVariant,
    visible: {
        ...selectedVariant.visible,
        transition: {
            ...selectedVariant.visible.transition,
            delay: delay
        }
    }
  }

  return (
    <motion.div
      initial="hidden"
      whileInView="visible"
      viewport={{ once, margin: "-100px" }}
      variants={variantWithDelay}
      className={className}
    >
      {children}
    </motion.div>
  );
};

export { AnimatedSection, variants };
