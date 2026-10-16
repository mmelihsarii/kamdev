import { IconArrowRight } from "@tabler/icons-react";
import { GirisBelirme } from "./Hareket";
import AkisanIsik from "./AkisanIsik";
import HeroHizmetleri from "./HeroHizmetleri";
import { useIcerik } from "../veri/kaynak";

/**
 * Ana sayfa girişi: ne yaptığımızı söyleyen başlık, kısa açıklama, iki düğme;
 * arkada yavaşça akan soyut bir ışık ve ışığın içinde üç hizmet düğmesi.
 * Dikey ekranda giriş ilk ekranı doldurur, hizmet düğmeleri yazının altına,
 * teklif düğmesi başparmağın eriştiği en alta iner. Dikey ölçüsü ışığın
 * yerleşimiyle aynıdır (en boy oranı 1 ve altı).
 */
export default function Hero() {
  const hero = useIcerik().ayarlar.hero;

  return (
    <section className="relative isolate flex flex-col overflow-hidden pb-20 pt-32 text-white sm:pt-36 md:pb-28 lg:min-h-[82svh] lg:pt-44 [@media(max-aspect-ratio:1/1)]:min-h-[100svh] [@media(max-aspect-ratio:1/1)]:pb-[calc(1.75rem+env(safe-area-inset-bottom))] [@media(max-aspect-ratio:1/1)_and_(max-height:720px)]:pt-24 [@media(max-aspect-ratio:1/1)_and_(max-height:720px)]:pb-[calc(1rem+env(safe-area-inset-bottom))]">
      <AkisanIsik className="absolute inset-0 -z-10 h-full w-full" />
      <div className="kap flex w-full flex-1 flex-col">
        <GirisBelirme>
          <h1 className="max-w-[12ch] text-[clamp(2.75rem,6vw,5.5rem)] font-light leading-[1.04] tracking-[-0.035em] text-[#f1efe9]">
            {hero.baslikUst}
          </h1>
        </GirisBelirme>
        <GirisBelirme gecikme={0.1}>
          <p className="mt-6 max-w-[34rem] text-pretty text-base leading-7 text-neutral-300 md:mt-8 md:text-lg md:leading-8 [@media(max-aspect-ratio:1/1)_and_(max-height:720px)]:mt-4">
            {hero.aciklama}
          </p>
        </GirisBelirme>

        {/* Dikey ekranda yazıyla teklif düğmesi arasındaki boşlukta, geniş ekranda ışığın ortasında. */}
        <div className="flex flex-1 items-center py-8 [@media(max-aspect-ratio:1/1)_and_(max-height:720px)]:py-4 lg:[@media(min-aspect-ratio:1/1)]:absolute lg:[@media(min-aspect-ratio:1/1)]:left-[74%] lg:[@media(min-aspect-ratio:1/1)]:top-1/2 lg:[@media(min-aspect-ratio:1/1)]:w-[25rem] lg:[@media(min-aspect-ratio:1/1)]:-translate-x-1/2 lg:[@media(min-aspect-ratio:1/1)]:-translate-y-1/2 lg:[@media(min-aspect-ratio:1/1)]:py-0">
          <HeroHizmetleri />
        </div>

        <GirisBelirme
          gecikme={0.2}
          className="mt-8 flex flex-wrap items-center gap-2.5 md:mt-10 max-sm:flex-col max-sm:items-stretch max-sm:gap-1 [@media(max-aspect-ratio:1/1)]:mt-auto [@media(max-aspect-ratio:1/1)]:pt-4"
        >
          <a
            href="/iletisim/"
            className="group inline-flex min-h-11 items-center justify-center gap-1.5 rounded-full bg-[#ecebe7] px-5 text-sm font-medium text-zemin transition-colors duration-300 hover:bg-white max-sm:min-h-12 max-sm:text-[15px]"
          >
            {hero.birincilDugme}
            <IconArrowRight size={16} aria-hidden="true" className="transition-transform duration-300 group-hover:translate-x-1" />
          </a>
          {/* Telefonda yer kaplamasın diye çerçevesiz bir bağlantı olarak durur. */}
          <a
            href="/isler/"
            className="inline-flex min-h-11 items-center justify-center rounded-full border border-white/20 bg-white/[0.04] px-5 text-sm font-medium text-white backdrop-blur-md transition-colors duration-300 hover:border-white/40 hover:bg-white/10 max-sm:min-h-10 max-sm:border-transparent max-sm:bg-transparent max-sm:text-[14px] max-sm:text-white/75 max-sm:backdrop-blur-none"
          >
            {hero.ikincilDugme}
          </a>
        </GirisBelirme>
      </div>
    </section>
  );
}
