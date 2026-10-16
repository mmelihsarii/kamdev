import type { CSSProperties } from "react";
import { IconArrowRight, IconCheck } from "@tabler/icons-react";
import SayfaBasligi from "../bilesenler/SayfaBasligi";
import TeklifCagrisi from "../bilesenler/TeklifCagrisi";
import { Belirme } from "../bilesenler/Hareket";
import { useIcerik } from "../veri/kaynak";
import { hizmetYolu } from "../veri/yardimci";
import type { Hizmet } from "../veri/tipler";

/** Tek hizmet satırı: bir yanda fotoğraf, öbür yanda başlık, açıklama ve kapsamın ilk maddeleri. Satırlar sırayla yer değiştirir. */
function HizmetSatiri({ hizmet, ters }: { hizmet: Hizmet; ters: boolean }) {
  const adres = hizmetYolu(hizmet.slug);

  return (
    <article
      style={{ "--renk": hizmet.renk || "#e2462d" } as CSSProperties}
      className="grid items-center gap-8 py-12 md:py-16 lg:grid-cols-2 lg:gap-16"
    >
      <div className={`relative ${ters ? "lg:order-2" : ""}`}>
        <span aria-hidden="true" className="pointer-events-none absolute -inset-6 -z-10 rounded-[2rem] bg-[var(--renk)] opacity-[0.14] blur-[70px]" />
        <a
          href={adres}
          tabIndex={-1}
          aria-hidden="true"
          className="group relative block aspect-[16/10] overflow-hidden rounded-2xl border border-white/10 bg-[#0c0c0f]"
        >
          {hizmet.gorsel?.src ? (
            <img
              src={hizmet.gorsel.src}
              alt=""
              loading="lazy"
              decoding="async"
              className="absolute inset-0 h-full w-full object-cover transition-transform duration-[1.2s] ease-out group-hover:scale-[1.04]"
            />
          ) : (
            <span className="absolute inset-0 bg-[radial-gradient(120%_90%_at_0%_100%,color-mix(in_srgb,var(--renk)_30%,transparent),transparent_60%)]" />
          )}
          <span
            aria-hidden="true"
            className="absolute inset-0 bg-[radial-gradient(80%_60%_at_100%_100%,color-mix(in_srgb,var(--renk)_30%,transparent),transparent_70%)]"
          />
        </a>
      </div>

      <div>
        <h2 className="baslik text-[clamp(1.6rem,3.2vw,2.3rem)] leading-[1.1] tracking-[-0.03em] text-white">
          <a href={adres} className="transition-colors duration-300 hover:text-[var(--renk)]">
            {hizmet.baslik}
          </a>
        </h2>
        <p className="mt-4 max-w-xl text-base leading-7 text-neutral-300">{hizmet.vitrinAciklama}</p>

        {hizmet.dahil.length > 0 && (
          <ul className="mt-7 grid max-w-xl gap-x-6 gap-y-3 sm:grid-cols-2">
            {hizmet.dahil.slice(0, 4).map((kalem) => (
              <li key={kalem.baslik} className="flex items-start gap-2.5 text-[15px] leading-6 text-neutral-200">
                <IconCheck size={17} stroke={2.4} aria-hidden="true" className="mt-0.5 shrink-0 text-[var(--renk)]" />
                {kalem.baslik}
              </li>
            ))}
          </ul>
        )}

        <a
          href={adres}
          className="group mt-8 inline-flex min-h-11 items-center gap-2 rounded-full border border-white/20 px-5 text-sm font-semibold text-white transition-colors duration-300 hover:border-[var(--renk)] hover:bg-[color-mix(in_srgb,var(--renk)_14%,transparent)]"
        >
          Hizmeti incele
          <IconArrowRight size={16} aria-hidden="true" className="transition-transform duration-300 group-hover:translate-x-1" />
        </a>
      </div>
    </article>
  );
}

/** Bütün hizmetler alt alta; her satır hizmetin kendi sayfasına gider. */
export default function HizmetListesi() {
  const { hizmetler, ayarlar } = useIcerik();
  const bolum = ayarlar.bolumler.hizmetlerSayfasi ?? ayarlar.bolumler.hizmetler;
  // Sıra paneldeki hizmet sırasıdır.
  const liste = hizmetler;

  return (
    <>
      <SayfaBasligi baslik={bolum.baslik} giris={bolum.aciklama} />

      <section className="overflow-x-clip pb-8 md:pb-12">
        <div className="kap divide-y divide-white/[0.07]">
          {liste.map((h, sira) => (
            <Belirme key={h.kimlik}>
              <HizmetSatiri hizmet={h} ters={sira % 2 === 1} />
            </Belirme>
          ))}
        </div>
      </section>

      <TeklifCagrisi />
    </>
  );
}
