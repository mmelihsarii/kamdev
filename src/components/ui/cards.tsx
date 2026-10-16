import { useState, type ReactNode } from "react";
import { motion } from "motion/react";
import { cn } from "@/lib/utils";

export interface CardItem {
  id: number | string;
  title: string;
  subtitle: string;
  /** Kartın arka plan görseli. Yoksa `visual` ya da düz zemin kullanılır. */
  imageUrl?: string;
  /** Görsel yerine çizilecek özel arka plan (logo kolajı, degrade vb.). */
  visual?: ReactNode;
  description?: string;
  tags?: string[];
  href?: string;
  linkLabel?: string;
}

const EGRI = [0.22, 1, 0.36, 1] as const;

/**
 * Yan yana duran kartlardan üzerine gelineni genişletip içeriğini açan şerit.
 * Masaüstünde yatay, telefonda dikey çalışır. Telefonda ilk dokunuş kartı
 * açar, ikinci dokunuş bağlantıya gider.
 */
export default function HoverRevealCards({ items, className }: { items: CardItem[]; className?: string }) {
  const [aktif, setAktif] = useState(0);

  return (
    <div className={cn("flex h-[44rem] flex-col gap-2 sm:h-[40rem] lg:h-[30rem] lg:flex-row lg:gap-3", className)}>
      {items.map((item, sira) => {
        const acik = sira === aktif;
        const Etiket = item.href ? "a" : "div";

        return (
          <Etiket
            key={item.id}
            {...(item.href ? { href: item.href } : {})}
            onMouseEnter={() => setAktif(sira)}
            onFocus={() => setAktif(sira)}
            onClick={(olay) => {
              if (!acik) {
                olay.preventDefault();
                setAktif(sira);
              }
            }}
            aria-expanded={acik}
            className={cn(
              "kutu group relative min-h-0 min-w-0 cursor-pointer transition-[flex-grow,border-color] duration-700 ease-[cubic-bezier(0.22,1,0.36,1)]",
              acik ? "border-white/20" : "",
            )}
            style={{ flexGrow: acik ? 4 : 1, flexBasis: 0 }}
          >
            {/* Arka plan: görsel, özel çizim ya da düz zemin */}
            <div
              aria-hidden="true"
              className={cn(
                "absolute inset-0 -z-10 transition-all duration-700 ease-out",
                acik ? "scale-100 opacity-100" : "scale-110 opacity-0 grayscale lg:opacity-40",
              )}
            >
              {item.imageUrl ? (
                <img src={item.imageUrl} alt="" loading="lazy" decoding="async" className="h-full w-full object-cover" />
              ) : (
                item.visual
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-black via-black/75 via-35% to-transparent to-70%" />
            </div>

            <div className="relative flex h-full flex-col justify-end p-5 sm:p-6">
              <span className={cn("absolute left-5 top-5 font-mono text-xs tracking-[0.08em] text-white/70 sm:left-6 sm:top-6", acik ? "" : "hidden lg:block")}>
                {String(sira + 1).padStart(2, "0")}
                <span className="text-vurgu">/</span>
              </span>

              {/* Kapalıyken masaüstünde başlık dikey okunur */}
              <span
                className={cn(
                  "absolute bottom-6 left-6 hidden origin-bottom-left -rotate-90 translate-x-4 whitespace-nowrap text-base font-semibold tracking-tight text-white/80 transition-opacity duration-300 lg:block",
                  acik ? "opacity-0" : "opacity-100 delay-300",
                )}
                aria-hidden="true"
              >
                {item.title}
              </span>

              <div className={cn(acik ? "" : "lg:invisible")}>
                <p className="font-mono text-xs uppercase tracking-[1.4px] text-vurgu">{item.subtitle}</p>
                <h3 className="mt-2 text-lg font-semibold tracking-tight text-white sm:text-xl">{item.title}</h3>

                <motion.div
                  initial={false}
                  animate={acik ? { opacity: 1, height: "auto", y: 0 } : { opacity: 0, height: 0, y: 12 }}
                  transition={{ duration: 0.55, ease: EGRI, delay: acik ? 0.15 : 0 }}
                  className="overflow-hidden"
                >
                  {item.description && (
                    <p className="mt-3 max-w-md text-sm leading-6 text-neutral-300">{item.description}</p>
                  )}
                  {item.tags && item.tags.length > 0 && (
                    <ul className="mt-4 flex flex-wrap gap-1.5">
                      {item.tags.map((etiket) => (
                        <li key={etiket} className="rounded-full border border-white/10 bg-black/40 px-2.5 py-1 text-xs text-neutral-300 backdrop-blur-sm">
                          {etiket}
                        </li>
                      ))}
                    </ul>
                  )}
                  {item.href && (
                    <span className="mt-5 inline-flex items-center gap-2 font-mono text-xs uppercase tracking-[1.2px] text-white">
                      {item.linkLabel ?? "İncele"}
                      <span aria-hidden="true" className="transition-transform duration-300 group-hover:translate-x-1">→</span>
                    </span>
                  )}
                </motion.div>
              </div>
            </div>
          </Etiket>
        );
      })}
    </div>
  );
}
