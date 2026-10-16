import { IconBolt, IconEye, IconHeartHandshake, IconKey, IconLifebuoy, IconShieldCheck } from "@tabler/icons-react";
import { Belirme } from "./Hareket";
import BolumBasligi from "./BolumBasligi";
import { useIcerik } from "../veri/kaynak";

/** Panelde seçilebilen ilke ikonları. */
export const ILKE_IKONLARI = {
  goz: IconEye,
  anahtar: IconKey,
  "can-simidi": IconLifebuoy,
  kalkan: IconShieldCheck,
  simsek: IconBolt,
  el: IconHeartHandshake,
} as const;

export default function Ilkeler() {
  const { ilkeler, ayarlar } = useIcerik();
  const bolum = ayarlar.bolumler.ilkeler;

  return (
    <section id="ilkeler" className="py-16 sm:py-20 md:py-28">
      <div className="kap">
        <BolumBasligi baslik={bolum.baslik} aciklama={bolum.aciklama} />

        <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
          {ilkeler.map((ilke, sira) => {
            return (
              <Belirme key={ilke.kimlik} gecikme={sira * 0.08} className="h-full">
                <article className="kutu kutu-hareketli h-full p-7 sm:p-8">
                  <h3 className="text-xl font-normal tracking-tight text-white">{ilke.baslik}</h3>
                  <p className="mt-3 text-[15px] leading-7 text-neutral-300">{ilke.aciklama}</p>
                </article>
              </Belirme>
            );
          })}
        </div>
      </div>
    </section>
  );
}
