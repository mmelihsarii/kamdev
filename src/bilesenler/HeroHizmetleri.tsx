import type { ComponentType } from "react";
import { motion, useReducedMotion } from "motion/react";
import { IconArrowRight, IconBrowser, IconDeviceMobile, IconLayoutDashboard } from "@tabler/icons-react";
import { useIcerik } from "../veri/kaynak";
import { hizmetYolu } from "../veri/yardimci";

type Simge = ComponentType<{ size?: number; stroke?: number; className?: string }>;

const UCLU: { slug: string; simge: Simge; baslik: string }[] = [
  { slug: "mobil-uygulama", simge: IconDeviceMobile, baslik: "Mobil uygulama" },
  { slug: "kurumsal-web-sitesi", simge: IconBrowser, baslik: "Web sitesi ve mağaza" },
  { slug: "erp-ve-ozel-yazilim", simge: IconLayoutDashboard, baslik: "Özel yazılım" },
];

const EGRI = [0.22, 1, 0.36, 1] as const;

/**
 * Hero'daki ışığın içinde ne yaptığımızı anlatan üç cam düğme. Her biri
 * hizmetin sayfasına gider. Açılışta sırayla belirir; birkaç saniyede bir
 * üzerlerinden sırayla ince bir ışık süzülür.
 */
export default function HeroHizmetleri() {
  const { hizmetler } = useIcerik();
  const hareketsiz = useReducedMotion() ?? false;

  return (
    <ul className="flex w-full max-w-[26rem] flex-col gap-2.5 lg:max-w-[27rem] lg:gap-3">
      {UCLU.map((o, i) => {
        const S = o.simge;
        const hizmet = hizmetler.find((h) => h.slug === o.slug);
        return (
          <motion.li
            key={o.slug}
            initial={{ opacity: 0, y: 18, filter: "blur(8px)" }}
            animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
            transition={{ duration: 0.9, delay: 0.55 + i * 0.12, ease: EGRI }}
          >
            <a
              href={hizmet ? hizmetYolu(hizmet.slug) : "/hizmetler/"}
              className="group relative flex items-center gap-4 overflow-hidden rounded-full border border-white/[0.1] bg-white/[0.05] py-2 pl-2 pr-5 [@media(max-aspect-ratio:1/1)_and_(max-height:720px)]:py-1.5 [@media(max-aspect-ratio:1/1)_and_(max-height:720px)]:pl-1.5 shadow-[0_20px_50px_-28px_rgba(0,0,0,0.8),inset_0_1px_0_rgba(255,255,255,0.08)] backdrop-blur-2xl transition-colors duration-500 hover:border-white/25 hover:bg-white/[0.09]"
            >
              {/* Süzülen ışık */}
              {!hareketsiz && (
                <motion.span
                  aria-hidden="true"
                  className="pointer-events-none absolute inset-y-0 left-0 w-full bg-[linear-gradient(105deg,transparent_35%,rgba(255,255,255,0.13)_50%,transparent_65%)]"
                  initial={{ x: "-100%" }}
                  animate={{ x: "100%" }}
                  transition={{ duration: 1.6, delay: 1.6 + i * 0.28, repeat: Infinity, repeatDelay: 5, ease: "easeInOut" }}
                />
              )}
              <span className="relative flex h-12 w-12 shrink-0 items-center justify-center rounded-full border border-white/[0.12] bg-white/[0.08] [@media(max-aspect-ratio:1/1)_and_(max-height:720px)]:h-10 [@media(max-aspect-ratio:1/1)_and_(max-height:720px)]:w-10">
                <S size={22} stroke={1.25} className="text-white" />
              </span>
              <span className="relative min-w-0 flex-1 text-[16.5px] font-light tracking-[0.01em] text-white/90 lg:text-[17px]">{o.baslik}</span>
              <IconArrowRight
                size={18}
                stroke={1.25}
                aria-hidden="true"
                className="relative shrink-0 text-white/40 transition-all duration-300 group-hover:translate-x-0.5 group-hover:text-white"
              />
            </a>
          </motion.li>
        );
      })}
    </ul>
  );
}
