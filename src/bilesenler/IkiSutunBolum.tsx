import type { ReactNode } from "react";
import { IconCheck } from "@tabler/icons-react";
import { Belirme } from "./Hareket";

/** İç sayfaların ortak bölüm düzeni: solda başlık ve kısa açıklama, sağda içerik. */
export function IkiSutunBolum({ baslik, aciklama, children }: { baslik: string; aciklama?: string; children: ReactNode }) {
  return (
    <section className="relative py-16 sm:py-20 md:py-24">
      <div className="kap grid gap-8 lg:grid-cols-[0.8fr_1.2fr] lg:gap-20">
        <Belirme className="lg:sticky lg:top-32 lg:self-start">
          <h2 className="baslik text-[clamp(1.6rem,3.6vw,2.3rem)] leading-[1.1] tracking-[-0.03em] text-white">{baslik}</h2>
          {aciklama && <p className="mt-4 max-w-md text-[15px] leading-7 text-neutral-300">{aciklama}</p>}
        </Belirme>
        <Belirme gecikme={0.1}>{children}</Belirme>
      </div>
    </section>
  );
}

/** Çizgiyle ayrılmış, işaretli sade liste. İşaret rengi kapsayıcıdaki --renk değişkeninden gelir. */
export function IsaretliListe({ maddeler }: { maddeler: string[] }) {
  return (
    <ul className="border-t border-white/[0.07]">
      {maddeler.map((madde) => (
        <li key={madde} className="flex items-start gap-3.5 border-b border-white/[0.07] py-4 text-base leading-7 text-white">
          <IconCheck size={19} stroke={2.4} aria-hidden="true" className="mt-1 shrink-0 text-[var(--renk,var(--color-vurgu))]" />
          {madde}
        </li>
      ))}
    </ul>
  );
}

/** İki sütuna dizilen başlık ve açıklama kalemleri, aralarında ince çizgi. */
export function KalemIzgarasi({ kalemler }: { kalemler: { baslik: string; aciklama: string }[] }) {
  return (
    <ul className="grid gap-x-10 sm:grid-cols-2">
      {kalemler.map((kalem) => (
        <li key={kalem.baslik} className="border-t border-white/[0.07] py-6">
          <h3 className="text-lg font-semibold tracking-tight text-white">{kalem.baslik}</h3>
          <p className="mt-2 text-[15px] leading-7 text-neutral-300">{kalem.aciklama}</p>
        </li>
      ))}
    </ul>
  );
}
