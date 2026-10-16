import { motion } from "motion/react";
import type { ReactNode } from "react";

/** Sitenin her yerinde aynı yavaşlama eğrisi kullanılıyor. */
export const EGRI = [0.22, 1, 0.36, 1] as const;

/**
 * Bir metin satırını maskenin altından yukarı kaydırarak açar.
 * Dış kutu overflow-hidden, iç kutu %110 aşağıdan geliyor.
 */
export function SatirAcilis({
  children,
  gecikme = 0,
  className = "",
}: {
  children: ReactNode;
  gecikme?: number;
  className?: string;
}) {
  return (
    <span className={`block overflow-hidden ${className}`}>
      <motion.span
        className="block"
        initial={{ y: "110%" }}
        animate={{ y: 0 }}
        transition={{ duration: 0.9, delay: gecikme, ease: EGRI }}
      >
        {children}
      </motion.span>
    </span>
  );
}

/** Ekrana girince bir kere aşağıdan belirir. Liste içinde `etiket="li"` ile kullanılır. */
export function Belirme({
  children,
  gecikme = 0,
  mesafe = 20,
  className,
  etiket = "div",
}: {
  children: ReactNode;
  gecikme?: number;
  mesafe?: number;
  className?: string;
  etiket?: "div" | "li";
}) {
  const Kutu = etiket === "li" ? motion.li : motion.div;
  return (
    <Kutu
      className={className}
      initial={{ opacity: 0, y: mesafe }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-80px" }}
      transition={{ duration: 0.7, delay: gecikme, ease: EGRI }}
    >
      {children}
    </Kutu>
  );
}

/** Açılışta yerinde beliren kısa öğeler (etiket, buton satırı). */
export function GirisBelirme({
  children,
  gecikme = 0,
  className,
}: {
  children: ReactNode;
  gecikme?: number;
  className?: string;
}) {
  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.8, delay: gecikme, ease: EGRI }}
    >
      {children}
    </motion.div>
  );
}
