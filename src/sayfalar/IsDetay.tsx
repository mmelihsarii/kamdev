import { IconArrowRight, IconCheck } from "@tabler/icons-react";
import SayfaBasligi from "../bilesenler/SayfaBasligi";
import Icerik from "../bilesenler/Icerik";
import TeklifCagrisi from "../bilesenler/TeklifCagrisi";
import { Belirme } from "../bilesenler/Hareket";
import { ProjeVitrini } from "../bilesenler/Isler";
import { bloklaraAyir } from "../lib/metin";
import { useIcerik } from "../veri/kaynak";
import type { Proje, Teknoloji } from "../veri/tipler";
import { logoSinifi } from "../veri/yardimci";

export default function IsDetay({ proje }: { proje: Proje }) {
  const { teknolojiler } = useIcerik();
  const bloklar = bloklaraAyir(proje.icerik ?? "");
  // Kapak varsa bütün ekran görüntüleri galeride; yoksa ilki kartta kullanıldığı için galeri ikinciden başlar.
  const digerGorseller = (proje.gorseller ?? []).slice(proje.kapak ? 0 : 1);
  const rakamlar = proje.rakamlar?.filter((r) => r.deger) ?? [];
  const yapilanlar = proje.yapilanlar?.filter(Boolean) ?? [];
  const yigin = (proje.teknolojiler ?? []).map((ad) => teknolojiler.find((t) => t.ad === ad)).filter((t): t is Teknoloji => !!t);

  return (
    <>
      <SayfaBasligi
        baslik={proje.ad}
        giris={proje.ozet}
        renk={proje.vitrinRengi}
        sik
      />

      <section className="">
        <div className="kap">
          <Belirme>
            <ProjeVitrini proje={proje} detay />
          </Belirme>
        </div>
      </section>

      {rakamlar.length > 0 && (
        <section className="pt-10 md:pt-14">
          <div className="kap">
            <dl className={`grid gap-3 ${rakamlar.length >= 3 ? "sm:grid-cols-3" : rakamlar.length === 2 ? "sm:grid-cols-2" : ""}`}>
              {rakamlar.map((r, i) => (
                <Belirme key={r.etiket + i} gecikme={i * 0.08} className="kutu p-6 sm:p-8">
                  <dt className="sr-only">{r.etiket}</dt>
                  <dd>
                    <span className="block text-[clamp(2.4rem,6vw,4rem)] font-light leading-none tracking-[-0.04em] text-white">{r.deger}</span>
                    <span className="mt-3 block text-[15px] font-medium text-neutral-300">{r.etiket}</span>
                  </dd>
                </Belirme>
              ))}
            </dl>
          </div>
        </section>
      )}

      {yigin.length > 0 && (
        <section className="pt-10 md:pt-14">
          <div className="kap">
            <Belirme className="kutu flex flex-col gap-5 p-6 sm:p-8 lg:flex-row lg:items-center lg:gap-12">
              <h2 className="shrink-0 text-[13px] font-bold uppercase tracking-[1.4px] text-neutral-400 lg:w-40">Kullanılan teknolojiler</h2>
              <ul className="flex flex-wrap gap-2">
                {yigin.map((t) => (
                  <li
                    key={t.kimlik}
                    className="inline-flex min-h-11 items-center gap-2.5 rounded-xl border border-white/[0.07] bg-white/[0.03] py-2 pl-3 pr-4 text-[15px] font-medium text-neutral-200"
                  >
                    <img src={t.ikon} alt="" loading="lazy" decoding="async" className={`h-5 w-5 shrink-0 object-contain ${logoSinifi(t)}`} />
                    {t.ad}
                  </li>
                ))}
              </ul>
            </Belirme>
          </div>
        </section>
      )}

      <section className="py-12 sm:py-16 md:py-20">
        <div className="kap grid gap-12 lg:grid-cols-[minmax(0,1fr)_22rem] lg:gap-20">
          <article className="min-w-0 max-w-[46rem]">
            {bloklar.length > 0 ? <Icerik bloklar={bloklar} /> : <p className="yazi">{proje.ozet}</p>}
          </article>

          <aside className="space-y-4 lg:sticky lg:top-28 lg:self-start">
            {yapilanlar.length > 0 && (
              <div className="kutu p-6">
                <h2 className="text-[13px] font-bold uppercase tracking-[1.4px] text-neutral-400">Neler yaptık</h2>
                <ul className="mt-4 space-y-3">
                  {yapilanlar.map((y) => (
                    <li key={y} className="flex gap-3 text-[15px] leading-6 text-neutral-200">
                      <IconCheck size={18} aria-hidden="true" className="mt-[3px] shrink-0 text-vurgu" />
                      {y}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {yigin.length === 0 && proje.etiketler.length > 0 && (
              <div className="kutu p-6">
                <h2 className="text-[13px] font-bold uppercase tracking-[1.4px] text-neutral-400">Kullanılanlar</h2>
                <ul className="mt-4 grid grid-cols-2 gap-x-4 gap-y-2.5">
                  {proje.etiketler.map((e) => (
                    <li key={e} className="flex items-center gap-2.5 text-[15px] text-neutral-200">
                      <span aria-hidden="true" className="h-1.5 w-1.5 shrink-0 rounded-[2px] bg-vurgu" />
                      {e}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            <a href="/iletisim/" className="kutu group flex items-center justify-between gap-4 p-6 transition-colors duration-300 hover:border-vurgu/50">
              <span>
                <span className="block text-[16px] font-semibold text-white">Benzer bir proje mi düşünüyorsunuz?</span>
                <span className="mt-1 block text-sm text-neutral-400">Kapsam, süre ve fiyat yazılı gelir.</span>
              </span>
              <IconArrowRight size={20} aria-hidden="true" className="shrink-0 text-vurgu transition-transform duration-300 group-hover:translate-x-1" />
            </a>
          </aside>
        </div>
      </section>

      {digerGorseller.length > 0 && (
        <section className="pb-12 sm:pb-16 md:pb-20">
          <div
            className={`kap ${proje.sunum === "telefon" ? "flex flex-wrap justify-center gap-4" : `grid gap-3 ${digerGorseller.length > 1 ? "md:grid-cols-2" : ""}`}`}
          >
            {digerGorseller.map((g, i) => (
              <Belirme key={g} gecikme={(i % 2) * 0.08}>
                <img
                  src={g}
                  alt={`${proje.ad} ekran görüntüsü ${i + 2}`}
                  loading="lazy"
                  decoding="async"
                  className={
                    proje.sunum === "telefon"
                      ? "w-[min(16rem,42vw)] rounded-[1.75rem] border border-white/10"
                      : "w-full rounded-2xl border border-white/10 object-cover"
                  }
                />
              </Belirme>
            ))}
          </div>
        </section>
      )}

      <TeklifCagrisi />
    </>
  );
}
