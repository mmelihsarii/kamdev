import { motion, useScroll, useSpring } from "motion/react";

/** Menünün hemen altında, yazının ne kadarının okunduğunu gösteren ince çizgi. */
export default function OkumaCubugu() {
  const { scrollYProgress } = useScroll();
  const olcek = useSpring(scrollYProgress, { stiffness: 120, damping: 30, mass: 0.4 });

  return (
    <motion.div
      aria-hidden="true"
      className="fixed inset-x-0 top-0 z-[60] h-[3px] origin-left bg-white/60"
      style={{ scaleX: olcek }}
    />
  );
}
