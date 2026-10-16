import { useEffect, useRef, useState, type CSSProperties } from "react";
import { IconArrowRight, IconMapPin, IconWorld } from "@tabler/icons-react";
import { Belirme } from "./Hareket";
import BolumBasligi from "./BolumBasligi";
import { useIcerik } from "../veri/kaynak";
import type { Proje } from "../veri/tipler";
import { isYolu } from "../veri/yardimci";
import "./proje-vitrini.css";

export function Telefon({ proje, gorsel, etkilesimli = true }: { proje: Proje; gorsel?: string; etkilesimli?: boolean }) {
  const [aktifBolge, setAktifBolge] = useState<"ust" | "alt" | null>(null);
  const kisaltma = proje.ad
    .split(" ")
    .map((kelime) => kelime[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <div
      className={`group/telefon absolute left-1/2 top-2 aspect-[9/19.5] w-[min(14rem,calc(100vw-3rem))] -translate-x-1/2 rounded-[3.35rem] border bg-[#050506] p-[7px] transition-all duration-500 ease-out md:w-[15rem] ${
        aktifBolge === "ust"
          ? "-translate-y-3 scale-[1.035] border-sky-400/45 shadow-[0_38px_110px_rgba(14,165,233,0.18)]"
          : aktifBolge === "alt"
            ? "translate-y-1 scale-[1.025] border-vurgu/45 shadow-[0_38px_110px_rgba(226,70,45,0.1)]"
            : "border-white/25 shadow-[0_32px_100px_rgba(0,0,0,0.72)] group-hover:-translate-y-2 group-hover:scale-[1.02] group-active:scale-[0.99]"
      }`}
      onMouseLeave={() => setAktifBolge(null)}
    >
      <div className="relative h-full overflow-hidden rounded-[2.85rem] bg-[#101014]">
        <span className="absolute left-1/2 top-3 z-30 h-[1.2rem] w-[4.8rem] -translate-x-1/2 rounded-full bg-black shadow-[0_1px_0_rgba(255,255,255,0.08)]" />
        <span className="absolute right-[2.55rem] top-[1.16rem] z-40 h-1 w-1 rounded-full bg-sky-950 ring-1 ring-white/10" />

        {gorsel ? (
          <img
            src={gorsel}
            alt={`${proje.ad} mobil uygulama ekranı`}
            loading="lazy"
            decoding="async"
            className="h-full w-full object-cover"
          />
        ) : (
          <div className="flex h-full flex-col bg-[radial-gradient(circle_at_18%_5%,rgba(56,189,248,0.24),transparent_38%),radial-gradient(circle_at_88%_42%,rgba(226,70,45,0.1),transparent_42%),linear-gradient(160deg,#17171d,#08080a)] px-4 pb-4 pt-10 transition-[background-position] duration-700 group-hover/telefon:bg-[radial-gradient(circle_at_32%_12%,rgba(56,189,248,0.28),transparent_42%),radial-gradient(circle_at_72%_50%,rgba(226,70,45,0.22),transparent_44%),linear-gradient(160deg,#17171d,#08080a)]">
            <div className="flex items-center justify-between text-[5px] font-semibold uppercase tracking-[0.14em] text-white/45">
              <span>{proje.ad}</span>
              
            </div>

            <div className={`mt-9 flex items-center gap-2.5 transition-all duration-500 ${aktifBolge === "ust" ? "-translate-y-1 scale-[1.035]" : ""}`}>
              <span className="flex h-10 w-10 items-center justify-center rounded-[0.9rem] bg-white text-xs font-bold text-black shadow-[0_8px_30px_rgba(255,255,255,0.12)]">
                {kisaltma}
              </span>
              <div className="space-y-1">
                <span className="block h-1.5 w-16 rounded-full bg-white/70" />
                <span className="block h-1 w-11 rounded-full bg-white/20" />
              </div>
            </div>

            <div className={`mt-6 rounded-2xl border bg-white/[0.055] p-3 transition-all duration-500 ${aktifBolge === "ust" ? "-translate-y-1.5 border-sky-400/25 bg-sky-400/[0.08] shadow-[0_12px_36px_rgba(14,165,233,0.12)]" : "border-white/8"}`}>
              <span className="block h-1.5 w-10 rounded-full bg-vurgu/80" />
              <span className="mt-2 block h-1 w-full rounded-full bg-white/20" />
              <span className="mt-1.5 block h-1 w-4/5 rounded-full bg-white/10" />
              <div className="mt-3 grid grid-cols-2 gap-1.5">
                <span className="h-14 rounded-xl bg-white/[0.07] transition-colors duration-500 group-hover/telefon:bg-white/[0.11]" />
                <span className="h-14 rounded-xl bg-white/[0.04] transition-colors duration-500 group-hover/telefon:bg-white/[0.08]" />
              </div>
            </div>

            <div className={`mt-4 space-y-2 transition-all duration-500 ${aktifBolge === "alt" ? "-translate-y-2 scale-[1.025]" : ""}`}>
              {[0, 1, 2].map((satir) => (
                <div key={satir} className={`flex items-center gap-2 rounded-lg p-1.5 transition-colors duration-300 ${aktifBolge === "alt" && satir === 0 ? "bg-vurgu/15" : "bg-white/[0.035]"}`}>
                  <span className={`h-5 w-5 rounded-md transition-colors duration-300 ${aktifBolge === "alt" && satir === 0 ? "bg-vurgu/70" : "bg-white/10"}`} />
                  <span className="h-1 flex-1 rounded-full bg-white/10" />
                </div>
              ))}
            </div>

            <div className={`mt-auto flex justify-around border-t pt-2 transition-all duration-300 ${aktifBolge === "alt" ? "border-vurgu/25 bg-vurgu/[0.04]" : "border-white/8"}`}>
              {[0, 1, 2, 3].map((nokta) => (
                <span key={nokta} className={`h-1.5 w-1.5 rounded-full ${nokta === 0 ? "bg-vurgu" : "bg-white/15"}`} />
              ))}
            </div>
          </div>
        )}

        <span className="pointer-events-none absolute -left-20 top-0 z-20 h-full w-16 -skew-x-12 bg-gradient-to-r from-transparent via-white/10 to-transparent opacity-0 transition-all duration-700 group-hover/telefon:left-[115%] group-hover/telefon:opacity-100" />
      </div>

      {etkilesimli && (
        <>
      <button
        type="button"
        aria-label={`${proje.ad} üst ekran etkileşimi`}
        aria-pressed={aktifBolge === "ust"}
        className="absolute inset-x-2 top-2 z-50 h-[47%] cursor-pointer rounded-t-[2.8rem] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-400"
        onMouseEnter={() => setAktifBolge("ust")}
        onFocus={() => setAktifBolge("ust")}
        onBlur={() => setAktifBolge(null)}
        onClick={() => setAktifBolge((mevcut) => (mevcut === "ust" ? null : "ust"))}
      />
      <button
        type="button"
        aria-label={`${proje.ad} alt ekran etkileşimi`}
        aria-pressed={aktifBolge === "alt"}
        className="absolute inset-x-2 bottom-2 z-50 h-[47%] cursor-pointer rounded-b-[2.8rem] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-vurgu"
        onMouseEnter={() => setAktifBolge("alt")}
        onFocus={() => setAktifBolge("alt")}
        onBlur={() => setAktifBolge(null)}
        onClick={() => setAktifBolge((mevcut) => (mevcut === "alt" ? null : "alt"))}
      />
        </>
      )}
    </div>
  );
}

/**
 * Sitenin yukarıdan aşağı kaydırıldığı video. Fare kartın üstüne gelince oynar, çıkınca başa döner;
 * dokunmatik ekranda ya da oto açıkken görününce oynar. Hareket azaltma açıksa yalnız kapak görünür.
 */
export function KaydirmaVideosu({ src, oto = false }: { src: string; oto?: boolean }) {
  const ref = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const video = ref.current;
    const kart = oto ? video : video?.closest<HTMLElement>(".group");
    if (!video || !kart || matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    video.muted = true;

    const oynat = () => void video.play().catch(() => {});
    const durdur = () => {
      video.pause();
      video.currentTime = 0;
    };

    // Video ancak oynayacağı an iner; sayfa açılırken kartların videoları indirilmez.
    if (oto || matchMedia("(hover: none)").matches) {
      const gorunur = new IntersectionObserver(([g]) => (g.isIntersecting ? oynat() : durdur()), { threshold: 0.6 });
      gorunur.observe(video);
      return () => gorunur.disconnect();
    }

    const olaylar = [["mouseenter", oynat], ["mouseleave", durdur], ["focusin", oynat], ["focusout", durdur]] as const;
    for (const [ad, f] of olaylar) kart.addEventListener(ad, f);
    return () => {
      for (const [ad, f] of olaylar) kart.removeEventListener(ad, f);
    };
  }, [src, oto]);

  return (
    <video
      ref={ref}
      src={src}
      poster={src.replace(/\.mp4$/, ".jpg")}
      muted
      loop
      playsInline
      preload="none"
      aria-hidden="true"
      className="h-full w-full object-cover object-top"
    />
  );
}

/** Ekran görüntüsünü ya da kaydırma videosunu içine alan laptop maketi. İkisi de yoksa sade bir panel taslağı çizilir. */
export function Laptop({ proje }: { proje: Proje }) {
  const gorsel = proje.gorseller?.[0];

  return (
    <div className="absolute left-1/2 top-[11%] w-[80%] -translate-x-1/2 transition-transform duration-700 ease-out group-hover:-translate-y-1.5 group-hover:scale-[1.02]">
      <div className="rounded-t-[14px] border border-white/15 bg-[#18181b] p-[1.6%] shadow-[0_30px_80px_rgba(0,0,0,0.7)]">
        <div className="relative aspect-[16/10] overflow-hidden rounded-[6px] bg-[#0c0c0f]">
          {proje.video ? (
            <KaydirmaVideosu src={proje.video} />
          ) : gorsel ? (
            <img src={gorsel} alt={`${proje.ad} ekran görüntüsü`} loading="lazy" decoding="async" className="h-full w-full object-cover object-top" />
          ) : (
            <div className="flex h-full">
              <div className="w-[22%] space-y-2 border-r border-white/[0.06] p-3">
                <span className="block h-2.5 w-3/4 rounded bg-vurgu/70" />
                {[0, 1, 2, 3, 4].map((k) => (
                  <span key={k} className="block h-1.5 rounded bg-white/15" />
                ))}
              </div>
              <div className="flex-1 p-3">
                <span className="block text-[clamp(0.7rem,1.6vw,1.1rem)] font-bold text-white/90">{proje.ad}</span>
                <div className="mt-3 grid grid-cols-3 gap-2">
                  {[0, 1, 2].map((k) => (
                    <span key={k} className="h-10 rounded-md bg-white/[0.07]" />
                  ))}
                </div>
                <div className="mt-2 h-[45%] rounded-md bg-gradient-to-t from-vurgu/25 to-white/[0.04]" />
              </div>
            </div>
          )}
        </div>
      </div>
      <div className="relative -mx-[6%] h-[9px] rounded-b-[10px] bg-gradient-to-b from-[#3f3f46] to-[#18181b]">
        <span className="absolute left-1/2 top-0 h-[4px] w-[16%] -translate-x-1/2 rounded-b-md bg-[#0c0c0f]" />
      </div>
    </div>
  );
}

/** Panelden seçilen kapak; kapağı olmayan işler için ekran görüntüsünden kurulan cihaz sahnesi. */
export function ProjeVitrini({ proje, detay = false }: { proje: Proje; detay?: boolean }) {
  const kapak = proje.kapak;

  if (kapak) {
    return (
      <div className={`proje-vitrini proje-vitrini--ozel${detay ? " proje-vitrini--detay" : ""}`}>
        <img
          className="proje-vitrini__ozel-kapak"
          src={kapak}
          alt={`${proje.ad} projesinin ekranlarını gösteren özel kapak`}
          width={1440}
          height={810}
          loading={detay ? "eager" : "lazy"}
          decoding="async"
        />
        {!detay && <span className="proje-vitrini__etiket">{proje.alan}</span>}
      </div>
    );
  }

  const mobil = proje.sunum === "telefon";
  const ekranlar = proje.gorseller ?? [];
  const webEkrani = proje.video?.replace(/\.mp4$/, ".jpg") ?? ekranlar[0];

  return (
    <div
      className={`proje-vitrini ${mobil ? "proje-vitrini--mobil" : "proje-vitrini--web"}${detay ? " proje-vitrini--detay" : ""}`}
      style={proje.vitrinRengi ? ({ "--vitrin": proje.vitrinRengi } as CSSProperties) : undefined}
    >
      <img
        className="proje-vitrini__zemin"
        src={`/isler/sahneler/${mobil ? "telefon" : "laptop"}-studyo.webp`}
        alt=""
        width={1280}
        height={720}
        loading={detay ? "eager" : "lazy"}
        decoding="async"
      />
      {proje.vitrinRengi && <span className="proje-vitrini__isik" aria-hidden="true" />}
      {mobil ? (
        <>
          {[0, 1].map((sira) => (
            <div key={sira} className={`proje-vitrini__ekran proje-vitrini__ekran--telefon-${sira}`}>
                {ekranlar[sira] ? (
                  <img
                    src={ekranlar[sira]}
                    alt={`${proje.ad} ${sira === 0 ? "ana ekranı" : "uygulama detay ekranı"}`}
                    loading={detay ? "eager" : "lazy"}
                    decoding="async"
                  />
                ) : (
                  <span className="proje-vitrini__bos" aria-hidden="true">{proje.ad}</span>
                )}
            </div>
          ))}
        </>
      ) : (
        <div className="proje-vitrini__ekran proje-vitrini__ekran--web">
          {webEkrani ? (
            <img src={webEkrani} alt={`${proje.ad} web sitesi ekranı`} loading={detay ? "eager" : "lazy"} decoding="async" />
          ) : (
            <span className="proje-vitrini__bos">{proje.ad}</span>
          )}
        </div>
      )}
      {!detay && <span className="proje-vitrini__etiket">{proje.alan}</span>}
    </div>
  );
}

export function ProjeKarti({ proje }: { proje: Proje }) {
  const KonumIkonu = proje.konum === "Türkiye" ? IconWorld : IconMapPin;

  return (
    <a
      href={isYolu(proje)}
      className="proje-karti"
    >
      <ProjeVitrini proje={proje} />

      <div className="proje-karti__icerik">
        <div className="proje-karti__baslik">
          <h3 lang={proje.adDili === "en" ? "en" : undefined}>{proje.ad}</h3>
          <span className="proje-karti__konum">
            <KonumIkonu size={16} aria-hidden="true" />
            {proje.konum}
          </span>
        </div>
        <p className="proje-karti__ozet">{proje.ozet}</p>

        <span className="proje-karti__alt">
          <span className="proje-karti__baglanti">
            Projeyi incele
            <IconArrowRight size={16} aria-hidden="true" />
          </span>
        </span>
      </div>
    </a>
  );
}

/** Ana sayfadaki öne çıkan işler. Hepsi /isler/ sayfasında, her biri kendi sayfasında. */
export default function Isler() {
  const { projeler, ayarlar } = useIcerik();
  const bolum = ayarlar.bolumler.isler;
  const liste = projeler.slice(0, 4);

  return (
    <section id="isler" className="relative isolate overflow-hidden py-16 sm:py-20 md:py-28">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -left-32 top-0 -z-10 h-[34rem] w-[34rem] rounded-full bg-vurgu/[0.045] blur-[150px]"
      />
      <div className="kap">
        <BolumBasligi baslik={bolum.baslik} aciklama={bolum.aciklama} />

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 md:gap-5">
          {liste.map((proje, sira) => (
            <Belirme key={proje.kimlik} gecikme={(sira % 2) * 0.08} className="h-full">
              <ProjeKarti proje={proje} />
            </Belirme>
          ))}
        </div>

        {projeler.length > 0 && (
          <div className="mt-8 flex justify-center md:mt-10">
            <a
              href="/isler/"
              className="group inline-flex min-h-12 items-center gap-2.5 rounded-full border border-white/20 bg-white/[0.04] px-6 text-[15px] font-semibold text-white transition-colors duration-300 hover:border-white/50 hover:bg-white/15"
            >
              Bütün işleri gör
              <span className="text-neutral-400 transition-colors duration-300 group-hover:text-white">{projeler.length}</span>
              <IconArrowRight size={17} aria-hidden="true" className="transition-transform duration-300 group-hover:translate-x-0.5" />
            </a>
          </div>
        )}
      </div>
    </section>
  );
}
