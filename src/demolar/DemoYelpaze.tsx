/*
 * Demolar sayfasının başlığındaki görsel: üç sektörün küçük paneli yelpaze gibi
 * üst üste durur ve yavaşça süzülür. Hareket azaltma tercihinde sabit kalır.
 */
import { motion, useReducedMotion } from "motion/react";
import { MiniPanel } from "./DemoKarti";
import { SEKTORLER } from "./katalog";

const DURUS = [
  { x: "-6%", y: 34, r: -7, z: 1, s: 0.86 },
  { x: "14%", y: 0, r: 2, z: 3, s: 1 },
  { x: "30%", y: 58, r: 9, z: 2, s: 0.86 },
];

export default function DemoYelpaze() {
  const azalt = useReducedMotion();
  const secilen = [SEKTORLER[0], SEKTORLER[4] ?? SEKTORLER[1], SEKTORLER[5] ?? SEKTORLER[2]].filter(Boolean);
  return (
    <div aria-hidden="true" className="relative h-[22rem] [perspective:1400px]">
      {secilen.map((s, i) => (
        <motion.div
          key={s.slug}
          className="absolute left-0 top-0 w-[78%]"
          style={{ zIndex: DURUS[i].z, x: DURUS[i].x }}
          initial={{ opacity: 0, y: DURUS[i].y + 40, rotate: DURUS[i].r, scale: DURUS[i].s }}
          animate={azalt ? { opacity: 1, y: DURUS[i].y, rotate: DURUS[i].r, scale: DURUS[i].s } : { opacity: 1, y: [DURUS[i].y, DURUS[i].y - 10, DURUS[i].y], rotate: DURUS[i].r, scale: DURUS[i].s }}
          transition={azalt ? { duration: 0.8 } : { opacity: { duration: 0.8, delay: 0.2 + i * 0.15 }, y: { duration: 6 + i, repeat: Infinity, ease: "easeInOut", delay: i * 0.6 }, rotate: { duration: 0.8 }, scale: { duration: 0.8 } }}
        >
          <div className="rounded-xl shadow-[0_30px_80px_rgba(0,0,0,0.55)]" style={{ boxShadow: `0 30px 80px rgba(0,0,0,0.55), 0 0 0 1px ${s.renk}22` }}>
            <MiniPanel s={s} />
          </div>
        </motion.div>
      ))}
      <div className="pointer-events-none absolute inset-x-10 bottom-0 h-24 rounded-full bg-vurgu/10 blur-3xl" />
    </div>
  );
}
