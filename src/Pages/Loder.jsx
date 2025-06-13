"use client"

import { motion } from "framer-motion"
import logoSrc from "../images/logo.png"

const Loader = () => {
  // Floating bubbles animation
  const bubbleVariants = {
    animate: {
      y: [-20, -80, -20],
      x: [-15, 15, -15],
      opacity: [0.2, 0.8, 0.2],
      scale: [0.8, 1.3, 0.8],
      transition: {
        duration: 4,
        repeat: Number.POSITIVE_INFINITY,
        ease: "easeInOut",
      },
    },
  }

  // Pulse animation for background elements
  const pulseVariants = {
    animate: {
      scale: [1, 1.4, 1],
      opacity: [0.05, 0.15, 0.05],
      transition: {
        duration: 3.5,
        repeat: Number.POSITIVE_INFINITY,
        ease: "easeInOut",
      },
    },
  }

  return (
    <div className="fixed inset-0 bg-white flex items-center justify-center z-50 overflow-hidden">
      {/* Animated background circles */}
      <motion.div
        variants={pulseVariants}
        animate="animate"
        className="absolute w-96 h-96 rounded-full bg-green-100"
        style={{ top: "5%", left: "8%" }}
      />
      <motion.div
        variants={pulseVariants}
        animate="animate"
        className="absolute w-80 h-80 rounded-full bg-green-50"
        style={{ top: "55%", right: "10%", animationDelay: "1.2s" }}
      />
      <motion.div
        variants={pulseVariants}
        animate="animate"
        className="absolute w-64 h-64 rounded-full bg-green-200"
        style={{ bottom: "15%", left: "15%", animationDelay: "0.8s" }}
      />

      {/* Floating bubbles */}
      {[...Array(12)].map((_, i) => (
        <motion.div
          key={i}
          variants={bubbleVariants}
          animate="animate"
          className="absolute rounded-full bg-green-300"
          style={{
            width: `${8 + (i % 4) * 4}px`,
            height: `${8 + (i % 4) * 4}px`,
            left: `${15 + i * 7}%`,
            top: `${20 + (i % 4) * 20}%`,
            animationDelay: `${i * 0.4}s`,
          }}
        />
      ))}

      {/* Additional smaller bubbles */}
      {[...Array(8)].map((_, i) => (
        <motion.div
          key={`small-${i}`}
          animate={{
            y: [-10, -40, -10],
            x: [-8, 8, -8],
            opacity: [0.1, 0.4, 0.1],
            scale: [0.5, 1, 0.5],
          }}
          transition={{
            duration: 3,
            repeat: Number.POSITIVE_INFINITY,
            ease: "easeInOut",
            delay: i * 0.5,
          }}
          className="absolute w-3 h-3 bg-green-400 rounded-full"
          style={{
            left: `${25 + i * 8}%`,
            top: `${40 + (i % 3) * 15}%`,
          }}
        />
      ))}

      <div className="flex flex-col items-center relative z-10">
        {/* Logo with animations */}
        <motion.div
          initial={{ opacity: 0, scale: 0.3, rotateY: -180 }}
          animate={{ opacity: 1, scale: 1, rotateY: 0 }}
          transition={{
            duration: 2,
            ease: "easeOut",
            type: "spring",
            stiffness: 100,
          }}
          className="mb-8 relative"
        >
          {/* Glowing ring behind logo */}
          <motion.div
            className="absolute inset-0 rounded-full"
            animate={{
              boxShadow: [
                "0 0 0px rgba(34, 197, 94, 0)",
                "0 0 30px rgba(34, 197, 94, 0.3)",
                "0 0 0px rgba(34, 197, 94, 0)",
              ],
            }}
            transition={{
              duration: 3,
              repeat: Number.POSITIVE_INFINITY,
              ease: "easeInOut",
            }}
            style={{ width: "280px", height: "280px", left: "-40px", top: "-40px" }}
          />

          {/* Main logo */}
          <motion.div
            animate={{
              rotateY: [0, 5, 0, -5, 0],
              scale: [1, 1.02, 1],
            }}
            transition={{
              duration: 6,
              repeat: Number.POSITIVE_INFINITY,
              ease: "easeInOut",
            }}
            className="relative"
          >
            <img
              src={logoSrc}
              alt="Karpagam Academy Logo"
              width={200}
              height={200}
              className="drop-shadow-lg"
            />
          </motion.div>
        </motion.div>

        {/* Animated progress bars */}
        <div className="space-y-3 w-64">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, delay: 1.5 }}
            className="relative"
          >
            <div className="h-1 bg-green-100 rounded-full overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: "100%" }}
                transition={{ duration: 3, ease: "easeInOut", delay: 2 }}
                className="h-full bg-gradient-to-r from-green-400 to-green-600"
              />
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, delay: 1.8 }}
            className="relative"
          >
            <div className="h-0.5 bg-green-50 rounded-full overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: "85%" }}
                transition={{ duration: 2.5, ease: "easeOut", delay: 2.3 }}
                className="h-full bg-green-300"
              />
            </div>
          </motion.div>
        </div>

        {/* Loading text with typewriter effect */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1, delay: 2.5 }}
          className="mt-8"
        >
          <motion.span
            animate={{ opacity: [0.6, 1, 0.6] }}
            transition={{
              duration: 2,
              repeat: Number.POSITIVE_INFINITY,
              ease: "easeInOut",
            }}
            className="text-green-600 font-medium text-lg"
          >
            Loading Academy Portal...
          </motion.span>
        </motion.div>

        {/* Bouncing dots */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1, delay: 3 }}
          className="flex space-x-2 mt-4"
        >
          {[0, 1, 2].map((i) => (
            <motion.div
              key={i}
              animate={{
                y: [-3, -12, -3],
                scale: [1, 1.2, 1],
              }}
              transition={{
                duration: 1.5,
                repeat: Number.POSITIVE_INFINITY,
                delay: i * 0.2,
                ease: "easeInOut",
              }}
              className="w-2 h-2 bg-green-500 rounded-full"
            />
          ))}
        </motion.div>
      </div>

      {/* Corner decorative elements */}
      <motion.div
        initial={{ opacity: 0, rotate: -90 }}
        animate={{ opacity: 0.2, rotate: 0 }}
        transition={{ duration: 2, delay: 1 }}
        className="absolute top-8 left-8 w-12 h-12 border-2 border-green-300 rounded-full"
      />
      <motion.div
        initial={{ opacity: 0, rotate: 90 }}
        animate={{ opacity: 0.2, rotate: 0 }}
        transition={{ duration: 2, delay: 1.3 }}
        className="absolute bottom-8 right-8 w-16 h-16 border-2 border-green-400 rounded-full"
      />
    </div>
  )
}

export default Loader