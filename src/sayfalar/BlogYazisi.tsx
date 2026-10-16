import { IconArrowRight } from "@tabler/icons-react";
import SayfaBasligi from "../bilesenler/SayfaBasligi";
import KisaCevap from "../bilesenler/KisaCevap";
import Icerik from "../bilesenler/Icerik";
import Icindekiler from "../bilesenler/Icindekiler";
import OkumaCubugu from "../bilesenler/OkumaCubugu";
import { SoruListesi } from "../bilesenler/Sss";
import BlogKarti from "../bilesenler/BlogKarti";
import TeklifCagrisi from "../bilesenler/TeklifCagrisi";
import { Belirme } from "../bilesenler/Hareket";
import { kategoriRengi, type Yazi } from "../veri/tipler";
import { useIcerik } from "../veri/kaynak";
import { hizmetYolu } from "../veri/yardimci";
import { bloklaraAyir, okumaSuresi, tarihYaz } from "../lib/metin";

export default function BlogYazisi({ yazi }: { yazi: Yazi }) {
  const bloklar = bloklaraAyir(yazi.icerik);
  const basliklar = bloklar.flatMap((b) => (b.tur === "h2" ? [{ id: b.id, metin: b.metin }] : []));
  const { yazilar, hizmetler } = useIcerik();
  const hizmet = yazi.ilgiliHizmet ? hizmetler.find((h) => h.slug === yazi.ilgiliHizmet) : undefined;
  const gorsel = yazi.gorsel;
  const sira = yazilar.findIndex((y) => y.kimlik === yazi.kimlik);
  const digerleri = [...yazilar.slice(sira + 1), ...yazilar.slice(0, Math.max(sira, 0))]
    .sort((a, b) => Number(b.kategori === yazi.kategori) - Number(a.kategori === yazi.kategori))
    .slice(0, 3);

  return (
    <>
      <OkumaCubugu />

      <SayfaBasligi
        baslik={yazi.baslik}
        giris={yazi.aciklama}
        renk={kategoriRengi(yazi.kategori)}
      >
        <p className="mt-8 flex flex-wrap gap-x-6 gap-y-1 text-sm font-medium text-neutral-300">
          <span>KAM Yazılım Stüdyosu</span>
          <time dateTime={yazi.guncelleme ?? yazi.tarih}>
            {yazi.guncelleme ? "Güncellendi " : ""}
            {tarihYaz(yazi.guncelleme ?? yazi.tarih)}
          </time>
          <span>{okumaSuresi(yazi.icerik)} dakikalık okuma</span>
        </p>
      </SayfaBasligi>

      {gorsel?.src && (
        <div className="kap bg-zemin pt-10 md:pt-14">
          <figure className="overflow-hidden rounded-2xl border border-white/10">
            <img
              src={gorsel.src}
              alt={gorsel.alt}
              width={1200}
              height={750}
              decoding="async"
              className="aspect-[21/9] w-full object-cover"
            />
          </figure>
        </div>
      )}

      <div className="bg-zemin py-12 sm:py-16 md:py-20">
        <div className="kap grid gap-12 lg:grid-cols-[minmax(0,1fr)_15rem] lg:gap-20">
          <article className="min-w-0 max-w-[46rem]">
            {yazi.kisaCevap && <KisaCevap metin={yazi.kisaCevap} />}
            <div className="mt-12">
              <Icerik bloklar={bloklar} />
            </div>

            {yazi.sss.length > 0 && (
              <section aria-labelledby="yazi-sss" className="mt-20">
                <h2 id="yazi-sss" className="baslik mb-6 text-[clamp(1.3rem,3.4vw,1.6rem)] tracking-[-0.03em]">
                  Sık sorulan sorular
                </h2>
                <SoruListesi sorular={yazi.sss} />
              </section>
            )}

            {hizmet && (
              <Belirme>
                <a
                  href={hizmetYolu(hizmet.slug)}
                  className="kutu group mt-16 block p-7 sm:p-9"
                >
                  <span aria-hidden="true" className="absolute -right-10 -top-10 h-40 w-40 rounded-full bg-vurgu/[0.06] blur-[60px] transition-opacity duration-500 group-hover:opacity-100" />
                  <span className="relative flex items-center justify-between gap-6">
                    <span className="text-xl font-normal tracking-tight text-white">{hizmet.baslik}</span>
                    <span
                      aria-hidden="true"
                      className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-white/20 transition-all duration-500 group-hover:-rotate-45 group-hover:border-white/50 group-hover:bg-white/15"
                    >
                      <IconArrowRight size={18} />
                    </span>
                  </span>
                  <span className="relative mt-3 block max-w-lg text-[15px] leading-7 text-neutral-300">{hizmet.giris}</span>
                </a>
              </Belirme>
            )}
          </article>

          <aside className="hidden lg:block">
            <div className="sticky top-32">
              <Icindekiler basliklar={basliklar} />
              <a
                href="/iletisim/"
                className="kutu group mt-10 block p-5"
              >
                <span className="block text-sm font-semibold text-white">Projeniz mi var?</span>
                <span className="mt-1 block text-sm leading-6 text-neutral-300">Kapsam, süre ve fiyat yazılı gelir.</span>
                <span className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-vurgu">
                  Teklif al <IconArrowRight size={16} aria-hidden="true" className="transition-transform duration-300 group-hover:translate-x-1" />
                </span>
              </a>
            </div>
          </aside>
        </div>
      </div>

      <section className="py-16 sm:py-20 md:py-24">
        <div className="kap">
          <div className="mb-10 flex items-end justify-between gap-4">
            <h2 className="baslik text-[clamp(1.35rem,3.5vw,1.9rem)] tracking-[-0.03em]">Sıradaki okumalar</h2>
            <a href="/blog/" className="inline-flex items-center gap-1.5 text-sm font-semibold text-white transition-colors hover:text-vurgu">
              Tüm yazılar <IconArrowRight size={16} aria-hidden="true" />
            </a>
          </div>
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-3">
            {digerleri.map((diger, i) => (
              <Belirme key={diger.kimlik} gecikme={i * 0.08} className="h-full">
                <BlogKarti yazi={diger} />
              </Belirme>
            ))}
          </div>
        </div>
      </section>

      <TeklifCagrisi />
    </>
  );
}
