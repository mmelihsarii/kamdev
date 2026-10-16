import { ThreeDMarquee } from "@/components/ui/3d-marquee";
import { useIcerik } from "../veri/kaynak";

export default function UcBoyutluVitrin() {
  const { ayarlar } = useIcerik();
  const bolum = ayarlar.bolumler.vitrin;
  // Dört sütunu dolduracak kadar aynı sırayla tekrarla; tekrar eden görsel iki sütun öteye düşer.
  const gorseller = [...ayarlar.vitrinGorselleri, ...ayarlar.vitrinGorselleri];

  return (
    <section
      className="relative overflow-hidden rounded-[1.25rem] border border-white/10 bg-[#08080a] p-1.5 shadow-[0_38px_120px_rgba(0,0,0,0.42)] sm:rounded-[1.85rem] sm:p-2"
      aria-labelledby="arayuz-vitrini-baslik"
    >
      <div className="pointer-events-none absolute inset-x-0 top-0 z-40 h-44 bg-gradient-to-b from-black via-black/75 to-transparent" />
      <div className="pointer-events-none absolute left-4 right-4 top-5 z-50 sm:left-6 sm:right-auto sm:top-7 md:left-10 md:top-9">
        <span className="text-[13px] font-bold uppercase tracking-[1.6px] text-neutral-400">
          {bolum.etiket}
        </span>
        <h3 id="arayuz-vitrini-baslik" className="mt-2 max-w-md text-[clamp(1.35rem,7vw,2.25rem)] font-light leading-tight tracking-tight text-white md:text-4xl">
          {bolum.altBaslik}
        </h3>
      </div>
      <ThreeDMarquee images={gorseller} />
    </section>
  );
}
