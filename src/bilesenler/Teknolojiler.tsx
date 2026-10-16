import { Belirme } from "./Hareket";
import BolumBasligi from "./BolumBasligi";
import { useIcerik } from "../veri/kaynak";
import { logoSinifi } from "../veri/yardimci";

/*
 * Tüm logolar hero altındaki şeritte akıyor; burada yalnızca panelde seçilen
 * öne çıkan araçlar başlıklar halinde duruyor.
 */
export default function Teknolojiler() {
  const { teknolojiler, ayarlar } = useIcerik();
  const bolum = ayarlar.bolumler.teknolojiler;
  const logoBul = (ad: string) => teknolojiler.find((t) => t.ad === ad);

  return (
    <section id="teknolojiler" className="relative py-16 sm:py-20 md:py-28">
      <div className="kap">
        <BolumBasligi baslik={bolum.baslik} aciklama={bolum.aciklama} />

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {ayarlar.teknolojiSecki.map((kategori, sira) => (
            <Belirme key={kategori.baslik} gecikme={sira * 0.06} className="h-full">
              <article className="kutu h-full p-6 sm:p-7">
                <h3 className="text-[13px] font-bold uppercase tracking-[1.4px] text-neutral-400">
                  {kategori.baslik}
                </h3>
                <ul className="mt-6 grid grid-cols-4 gap-2.5">
                  {kategori.adlar.map((ad) => {
                    const logo = logoBul(ad);
                    if (!logo) return null;
                    return (
                      <li key={ad} className="group relative">
                        <span
                          title={ad}
                          className="flex aspect-square items-center justify-center rounded-xl border border-white/[0.06] bg-white/[0.03] p-3.5 transition-colors duration-300 group-hover:bg-white/[0.06]"
                        >
                          <img src={logo.ikon} alt={ad} loading="lazy" decoding="async" className={`h-full w-full object-contain ${logoSinifi(logo)}`} />
                        </span>
                        <span className="pointer-events-none absolute -bottom-8 left-1/2 z-10 -translate-x-1/2 whitespace-nowrap rounded-md bg-white px-2 py-1 text-xs font-semibold text-zemin opacity-0 transition-opacity duration-200 group-hover:opacity-100">
                          {ad}
                        </span>
                      </li>
                    );
                  })}
                </ul>
              </article>
            </Belirme>
          ))}
        </div>
      </div>
    </section>
  );
}
