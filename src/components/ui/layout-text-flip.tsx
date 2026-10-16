"use client";
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { cn } from "@/lib/utils";

export const LayoutTextFlip = ({
  text = "Build Amazing",
  words = ["Landing Pages", "Component Blocks", "Page Sections", "3D Shaders"],
  duration = 3000,
  textClassName,
  wordClassName,
}: {
  text: string;
  words: string[];
  duration?: number;
  textClassName?: string;
  wordClassName?: string;
}) => {
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentIndex((prevIndex) => (prevIndex + 1) % words.length);
    }, duration);

    return () => clearInterval(interval);
  }, [duration, words.length]);

  return (
    <>
      <motion.span
        className={cn(
          "font-bold tracking-tight drop-shadow-lg",
          textClassName ?? "text-2xl md:text-4xl",
        )}
      >
        {text}
      </motion.span>

      <motion.span
        className={cn(
          "relative overflow-hidden rounded-md border border-white/10 bg-white px-4 py-2 font-sans font-bold tracking-tight text-black shadow-sm ring-1 shadow-black/10 ring-white/10 drop-shadow-lg",
          wordClassName ?? "w-fit text-2xl md:text-4xl",
        )}
      >
        <AnimatePresence mode="wait">
          <motion.span
            key={currentIndex}
            initial={{ y: -40, filter: "blur(10px)" }}
            animate={{
              y: 0,
              filter: "blur(0px)",
            }}
            exit={{ y: 50, filter: "blur(10px)", opacity: 0 }}
            transition={{
              duration: 0.5,
            }}
            className={cn("inline-block whitespace-nowrap")}
          >
            {words[currentIndex]}
          </motion.span>
        </AnimatePresence>
      </motion.span>
    </>
  );
};
