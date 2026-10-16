import { motion } from "motion/react";
import { IconArrowRight } from "@tabler/icons-react";
import { Belirme, EGRI } from "./Hareket";
import { Kapak } from "./BlogKarti";
import { kategoriRengi, type Yazi } from "../veri/tipler";
import { useIcerik } from "../veri/kaynak";
import { yaziYolu } from "../veri/yardimci";
import { okumaSuresi } from "../lib/metin";

/** Sağ sütundaki yazı satırı: küçük kapak fotoğrafı, kategori ve başlık. */
function YaziSatiri({ yazi }: { yazi: Yazi }) {
  const gorsel = yazi.gorsel;

  return (
    <a href={yaziYolu(yazi.slug)} className="kutu group flex h-full items-center gap-4 p-3 pr-5 transition-transform duration-500 hover:translate-x-1">
      <span className="relative h-20 w-28 shrink-0 overflow-hidden rounded-[10px] sm:h-[5.5rem] sm:w-32">
        {gorsel?.src ? (
          <img
            src={gorsel.src}
            alt=""
            loading="lazy"
            decoding="async"
            className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-110"
          />
        ) : (
          <span aria-hidden="true" className="block h-full w-full" style={{ background: `radial-gradient(120% 90% at 0% 100%, ${kategoriRengi(yazi.kategori)}55, transparent 60%), #0c0c0f` }} />
        )}
      </span>
      <span className="min-w-0 flex-1">
        <span className="text-xs font-bold uppercase tracking-[1px]" style={{ color: kategoriRengi(yazi.kategori) }}>
          {yazi.kategori}
        </span>
        <span className="mt-1.5 block text-[15px] font-semibold leading-snug text-white transition-colors duration-300 group-hover:text-vurgu">
          {yazi.baslik}
        </span>
      </span>
      <IconArrowRight
        size={18}
        aria-hidden="true"
        className="hidden shrink-0 text-neutral-400 transition-all duration-300 group-hover:translate-x-1 group-hover:text-white sm:block"
      />
    </a>
  );
}

/**
 * Hero'nun hemen altındaki blog vitrini. Ziyaretçi teklif istemeden önce
 * okuyacağı rehberleri ilk kaydırmalarda görsün diye ana sayfanın üst kısmında.
 */
export default function BlogVitrini() {
  const { yazilar, ayarlar } = useIcerik();
  const bolum = ayarlar.bolumler.blog;
  const [oneCikan, ...digerleri] = yazilar;
  const liste = digerleri.slice(0, 4);
  if (!oneCikan) return null;

  return (
    <section id="blog" aria-labelledby="blog-vitrini-baslik" className="overflow-hidden py-16 sm:py-20 md:py-24">
      <motion.span
        aria-hidden="true"
        className="pointer-events-none absolute -left-40 top-10 -z-10 h-[30rem] w-[30rem] rounded-full bg-vurgu/[0.06] blur-[140px]"
        animate={{ opacity: [0.5, 0.9, 0.5], scale: [0.9, 1.05, 0.9] }}
        transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
      />

      <div className="kap">
        <div className="mb-10 flex flex-col justify-between gap-6 md:mb-14 md:flex-row md:items-end">
          <Belirme>
            
            <h2 id="blog-vitrini-baslik" className="baslik max-w-2xl text-[clamp(1.8rem,4.8vw,2.8rem)] leading-[1.1] tracking-[-0.03em]">
              {bolum.baslik} {bolum.vurgu && <span>{bolum.vurgu}</span>}
            </h2>
            <p className="mt-4 max-w-xl text-base leading-7 text-neutral-300">{bolum.aciklama}</p>
          </Belirme>
          <Belirme gecikme={0.1}>
            <a
              href="/blog/"
              className="group inline-flex min-h-11 items-center gap-2 rounded-full border border-white/20 px-5 text-sm font-semibold text-white transition-colors duration-300 hover:border-white/50 hover:bg-white/15"
            >
              Tüm yazılar
              <IconArrowRight size={16} aria-hidden="true" className="transition-transform duration-300 group-hover:translate-x-1" />
            </a>
          </Belirme>
        </div>

        <div className="grid grid-cols-1 gap-3 lg:grid-cols-[1.25fr_1fr]">
          <Belirme className="h-full">
            <a href={yaziYolu(oneCikan.slug)} className="group block h-full">
              <span className="kutu flex h-full flex-col">
                <span className="relative block">
                  <Kapak yazi={oneCikan} oncelikli />
                </span>
                <span className="flex flex-1 flex-col p-6 sm:p-8">
                  <span className="text-[13px] font-medium text-neutral-400">
                    <span className="font-bold uppercase tracking-[1px]" style={{ color: kategoriRengi(oneCikan.kategori) }}>
                      {oneCikan.kategori}
                    </span>
                    <span className="ml-4">{okumaSuresi(oneCikan.icerik)} dakikalık okuma</span>
                  </span>
                  <span className="mt-3 block text-xl font-normal leading-snug tracking-tight text-white transition-colors duration-300 group-hover:text-vurgu md:text-2xl">
                    {oneCikan.baslik}
                  </span>
                  <span className="mt-3 block text-[15px] leading-7 text-neutral-300">{oneCikan.aciklama}</span>
                  <span aria-hidden="true" className="min-h-6 flex-1" />
                  <span className="inline-flex items-center gap-2 text-sm font-semibold text-white">
                    Hemen oku
                    <IconArrowRight size={16} aria-hidden="true" className="transition-transform duration-300 group-hover:translate-x-1.5" />
                  </span>
                </span>
              </span>
            </a>
          </Belirme>

          <ol className="grid grid-cols-1 gap-3">
            {liste.map((yazi, sira) => (
              <motion.li
                key={yazi.slug}
                className="h-full"
                initial={{ opacity: 0, x: 24 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true, margin: "-60px" }}
                transition={{ duration: 0.6, delay: 0.1 + sira * 0.08, ease: EGRI }}
              >
                <YaziSatiri yazi={yazi} />
              </motion.li>
            ))}
          </ol>
        </div>
      </div>

      {/* Tüm yazı başlıkları sonsuz şeritte akar; her biri yazıya gider. */}
      <div className="group mt-12 flex overflow-hidden py-4 [mask-image:linear-gradient(90deg,transparent,black_10%,black_90%,transparent)] md:mt-16">
        {[0, 1].map((kopya) => (
          <ul key={kopya} aria-hidden={kopya === 1} className="kayan-serit flex shrink-0 items-center gap-12 pr-12 group-hover:[animation-play-state:paused]">
            {yazilar.map((yazi) => (
              <li key={yazi.slug} className="whitespace-nowrap">
                <a
                  href={yaziYolu(yazi.slug)}
                  tabIndex={kopya === 1 ? -1 : undefined}
                  className="text-sm font-medium text-neutral-300 transition-colors duration-300 hover:text-white"
                >
                  {yazi.baslik}
                </a>
              </li>
            ))}
          </ul>
        ))}
      </div>
    </section>
  );
}
