import type { CSSProperties } from "react";
import { IconArrowRight, IconClock } from "@tabler/icons-react";
import SayfaBasligi from "../bilesenler/SayfaBasligi";
import Surec from "../bilesenler/Surec";
import Sss from "../bilesenler/Sss";
import BlogKarti from "../bilesenler/BlogKarti";
import TeklifCagrisi from "../bilesenler/TeklifCagrisi";
import { Belirme } from "../bilesenler/Hareket";
import { IkiSutunBolum as Bolum, IsaretliListe, KalemIzgarasi } from "../bilesenler/IkiSutunBolum";
import type { Hizmet } from "../veri/tipler";
import { useIcerik } from "../veri/kaynak";
import { hizmetYolu, isYolu } from "../veri/yardimci";

export default function HizmetDetay({ hizmet }: { hizmet: Hizmet }) {
  const icerik = useIcerik();
  const yazilar = hizmet.ilgiliYazilar
    .map((slug) => icerik.yazilar.find((y) => y.slug === slug))
    .filter((y) => y !== undefined);
  const digerleri = icerik.hizmetler.filter((h) => h.slug !== hizmet.slug);
  const ornek = hizmet.ornekProje?.ad ? hizmet.ornekProje : undefined;
  const ornekIs = ornek && icerik.projeler.find((p) => p.ad.toLocaleLowerCase("tr") === ornek.ad.toLocaleLowerCase("tr"));

  const renk = hizmet.renk || "#e2462d";

  return (
    <div style={{ "--renk": renk } as CSSProperties}>
      <SayfaBasligi
        baslik={hizmet.baslik}
        giris={hizmet.giris}
        renk={renk}
        yan={
          hizmet.gorsel?.src ? (
            <div className="relative aspect-[16/10] overflow-hidden rounded-2xl border border-white/10 bg-[#0c0c0f]">
              <img src={hizmet.gorsel.src} alt={hizmet.gorsel.alt} fetchPriority="high" decoding="async" className="absolute inset-0 h-full w-full object-cover" />
            </div>
          ) : undefined
        }
      >
        <div className="mt-9 flex flex-wrap items-center gap-x-6 gap-y-4">
          <a
            href="/iletisim/"
            className="group inline-flex min-h-12 items-center gap-2.5 rounded-full bg-[#ecebe7] px-6 text-[15px] font-semibold text-zemin transition-colors duration-300 hover:bg-white"
          >
            Teklif al
            <IconArrowRight size={17} aria-hidden="true" className="transition-transform duration-300 group-hover:translate-x-1" />
          </a>
          {hizmet.teslimSuresi && (
            <span className="inline-flex items-center gap-2 text-sm text-neutral-300">
              <IconClock size={17} aria-hidden="true" className="text-neutral-500" />
              {hizmet.teslimSuresi}
            </span>
          )}
        </div>
      </SayfaBasligi>

      {hizmet.dahil.length > 0 && (
        <Bolum baslik="Neler dahil" aciklama={hizmet.kisaCevap}>
          <KalemIzgarasi kalemler={hizmet.dahil} />
        </Bolum>
      )}

      {hizmet.kimlerIcin.length > 0 && (
        <Bolum baslik="Kimler için">
          <IsaretliListe maddeler={hizmet.kimlerIcin} />
        </Bolum>
      )}

      {hizmet.fiyatEtkenleri.length > 0 && (
        <Bolum baslik="Fiyatı ne belirler" aciklama="Teklifte her kalem ayrı satır olarak yazılır.">
          <IsaretliListe maddeler={hizmet.fiyatEtkenleri} />
        </Bolum>
      )}

      {ornek && (
        <Bolum baslik="Örnek proje">
          <div className="border-t border-white/[0.07] pt-6">
            <h3 className="text-2xl font-normal tracking-tight text-white">{ornek.ad}</h3>
            <p className="mt-3 max-w-xl text-base leading-7 text-neutral-300">{ornek.ozet}</p>
            {ornekIs && (
              <a
                href={isYolu(ornekIs)}
                className="group mt-6 inline-flex min-h-11 items-center gap-2 rounded-full border border-white/20 px-5 text-sm font-semibold text-white transition-colors duration-300 hover:border-white/50 hover:bg-white/10"
              >
                Projeyi incele
                <IconArrowRight size={16} aria-hidden="true" className="transition-transform duration-300 group-hover:translate-x-1" />
              </a>
            )}
          </div>
        </Bolum>
      )}

      <Surec />

      <Sss sorular={hizmet.sss} baslik={`${hizmet.baslik} hakkında`} />

      {yazilar.length > 0 && (
        <section className="relative py-16 sm:py-20 md:py-24">
          <div className="kap">
            <h2 className="baslik mb-10 text-[clamp(1.6rem,3.6vw,2.3rem)] leading-[1.1] tracking-[-0.03em] text-white md:mb-12">İlgili yazılar</h2>
            <div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-3">
              {yazilar.map((yazi, sira) => (
                <Belirme key={yazi.kimlik} gecikme={sira * 0.08} className="h-full">
                  <BlogKarti yazi={yazi} />
                </Belirme>
              ))}
            </div>
          </div>
        </section>
      )}

      <section className="py-16 md:py-20">
        <div className="kap">
          <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
            <h2 className="baslik text-[clamp(1.6rem,3.6vw,2.3rem)] leading-[1.1] tracking-[-0.03em] text-white">Diğer hizmetler</h2>
            <a href="/hizmetler/" className="group inline-flex items-center gap-2 text-sm font-semibold text-neutral-300 transition-colors duration-300 hover:text-white">
              Bütün hizmetler
              <IconArrowRight size={16} aria-hidden="true" className="transition-transform duration-300 group-hover:translate-x-1" />
            </a>
          </div>
          <nav aria-label="Diğer hizmetler" className="grid grid-cols-1 border-t border-white/[0.07] sm:grid-cols-2 lg:grid-cols-4 sm:gap-x-8">
            {digerleri.map((h) => (
              <a
                key={h.kimlik}
                href={hizmetYolu(h.slug)}
                className="group flex items-center justify-between gap-4 border-b border-white/[0.07] py-5 text-base font-semibold text-neutral-200 transition-colors duration-300 hover:text-white"
              >
                {h.baslik}
                <IconArrowRight size={17} aria-hidden="true" className="shrink-0 text-neutral-500 transition-all duration-300 group-hover:translate-x-1 group-hover:text-white" />
              </a>
            ))}
          </nav>
        </div>
      </section>

      <TeklifCagrisi />
    </div>
  );
}
