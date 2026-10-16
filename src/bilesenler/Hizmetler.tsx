import type { CSSProperties } from "react";
import { IconArrowRight } from "@tabler/icons-react";
import { motion } from "motion/react";
import BolumBasligi from "./BolumBasligi";
import { EGRI } from "./Hareket";
import { useIcerik } from "../veri/kaynak";
import { hizmetYolu } from "../veri/yardimci";

/** Ana sayfadaki hizmet kartları: hepsi aynı boyda, fotoğraf üstte, yazı altta, her biri kendi renginde. */
export default function Hizmetler() {
  const { hizmetler, ayarlar } = useIcerik();
  const bolum = ayarlar.bolumler.hizmetler;
  // Sıra paneldeki hizmet sırasıdır.
  const liste = hizmetler;

  return (
    <section id="hizmetler" className="py-16 sm:py-20 md:py-28">
      <div className="kap">
        <BolumBasligi baslik={bolum.baslik} aciklama={bolum.aciklama || undefined} />

        {/* Son sıra eksik kalırsa kartlar ortalanır. */}
        <div className="flex flex-wrap justify-center gap-3">
          {liste.map((h, sira) => (
            <motion.a
              key={h.kimlik}
              href={hizmetYolu(h.slug)}
              style={{ "--renk": h.renk || "#e2462d" } as CSSProperties}
              className="kutu kutu-hareketli group flex w-full flex-col hover:!border-[color-mix(in_srgb,var(--renk)_45%,transparent)] sm:w-[calc(50%-0.375rem)] lg:w-[calc(25%-0.5625rem)]"
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-60px" }}
              transition={{ duration: 0.7, delay: (sira % 4) * 0.07, ease: EGRI }}
            >
              <div className="relative aspect-[16/10] overflow-hidden bg-[#0c0c0f]">
                {h.gorsel?.src && (
                  <img
                    src={h.gorsel.src}
                    alt={h.gorsel.alt}
                    loading="lazy"
                    decoding="async"
                    className="absolute inset-0 h-full w-full object-cover transition-transform duration-[1.2s] ease-out group-hover:scale-[1.06]"
                  />
                )}
                <div aria-hidden="true" className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent" />
                <div
                  aria-hidden="true"
                  className="absolute inset-0 bg-[radial-gradient(90%_70%_at_0%_100%,color-mix(in_srgb,var(--renk)_38%,transparent),transparent_70%)] opacity-80 transition-opacity duration-500 group-hover:opacity-100"
                />
              </div>

              <div className="relative flex flex-1 flex-col p-5 sm:p-6">
                <span
                  aria-hidden="true"
                  className="pointer-events-none absolute -bottom-16 -left-10 -z-10 h-40 w-40 rounded-full bg-[var(--renk)] opacity-[0.07] blur-[60px] transition-opacity duration-500 group-hover:opacity-[0.16]"
                />
                <h3 className="text-lg font-bold tracking-tight text-white transition-colors duration-300 group-hover:text-[var(--renk)]">
                  {h.vitrinBaslik || h.baslik}
                </h3>
                <p className="mt-2 text-[15px] leading-7 text-neutral-300">{h.vitrinAciklama}</p>
                <span aria-hidden="true" className="min-h-5 flex-1" />
                <span className="inline-flex items-center gap-2.5 text-sm font-semibold text-white">
                  Detaylar
                  <span
                    aria-hidden="true"
                    className="flex h-8 w-8 items-center justify-center rounded-full border border-white/10 text-neutral-400 transition-all duration-500 group-hover:-rotate-45 group-hover:border-[var(--renk)] group-hover:bg-[var(--renk)] group-hover:text-zemin"
                  >
                    <IconArrowRight size={16} />
                  </span>
                </span>
              </div>
            </motion.a>
          ))}
        </div>

        <div className="mt-8 flex justify-center md:mt-10">
          <a
            href="/hizmetler/"
            className="group inline-flex min-h-12 items-center gap-2.5 rounded-full border border-white/20 bg-white/[0.04] px-6 text-[15px] font-semibold text-white transition-colors duration-300 hover:border-white/50 hover:bg-white/15"
          >
            Bütün hizmetler
            <IconArrowRight size={17} aria-hidden="true" className="transition-transform duration-300 group-hover:translate-x-0.5" />
          </a>
        </div>
      </div>
    </section>
  );
}
