import { useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import SayfaBasligi from "../bilesenler/SayfaBasligi";
import BlogKarti from "../bilesenler/BlogKarti";
import TeklifCagrisi from "../bilesenler/TeklifCagrisi";
import { EGRI } from "../bilesenler/Hareket";
import { useIcerik } from "../veri/kaynak";
import { BLOG_KATEGORILERI } from "../veri/tipler";

export default function BlogListesi() {
  const { yazilar, ayarlar } = useIcerik();
  const bolum = ayarlar.bolumler.blogSayfasi;
  const kategoriler = BLOG_KATEGORILERI.filter((k) => yazilar.some((y) => y.kategori === k));
  const [secili, setSecili] = useState<string | null>(null);
  const liste = secili ? yazilar.filter((y) => y.kategori === secili) : yazilar;
  const [oneCikan, ...kalan] = liste;

  return (
    <>
      <SayfaBasligi
        baslik={bolum.baslik}
        giris={bolum.aciklama}
      >
        <div role="group" aria-label="Kategoriye göre süz" className="mt-10 flex flex-wrap gap-2">
          {[null, ...kategoriler].map((kategori) => {
            const aktif = secili === kategori;
            return (
              <button
                key={kategori ?? "tumu"}
                type="button"
                onClick={() => setSecili(kategori)}
                aria-pressed={aktif}
                className={`inline-flex min-h-10 items-center rounded-lg border px-4 text-sm font-semibold transition-colors duration-300 ${
                  aktif ? "border-[#ecebe7] bg-[#ecebe7] text-zemin" : "border-white/20 bg-white/[0.03] text-white hover:border-white/40"
                }`}
              >
                {kategori ?? "Tüm yazılar"}
              </button>
            );
          })}
        </div>
      </SayfaBasligi>

      <section className="py-12 sm:py-16 md:py-20">
        <div className="kap">
          <motion.div layout className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-3">
            <AnimatePresence mode="popLayout" initial={false}>
              {oneCikan && (
                <motion.div
                  key={oneCikan.kimlik}
                  layout
                  initial={{ opacity: 0, y: 24 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.97 }}
                  transition={{ duration: 0.5, ease: EGRI }}
                  className="md:col-span-2 lg:col-span-3"
                >
                  <BlogKarti yazi={oneCikan} buyuk />
                </motion.div>
              )}
              {kalan.map((yazi, sira) => (
                <motion.div
                  key={yazi.kimlik}
                  layout
                  initial={{ opacity: 0, y: 24 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.97 }}
                  transition={{ duration: 0.5, delay: 0.04 * sira, ease: EGRI }}
                  className="h-full"
                >
                  <BlogKarti yazi={yazi} />
                </motion.div>
              ))}
            </AnimatePresence>
          </motion.div>
        </div>
      </section>

      <TeklifCagrisi />
    </>
  );
}
