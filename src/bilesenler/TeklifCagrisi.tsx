import { IconArrowRight } from "@tabler/icons-react";
import { Belirme } from "./Hareket";
import { useIcerik } from "../veri/kaynak";


/** Sayfa sonlarındaki teklif bandı: kayan hizmet şeridi ve büyük çağrı bağlantısı. */
export default function TeklifCagrisi({
  baslik,
  aciklama,
}: {
  baslik?: string;
  aciklama?: string;
}) {
  const bolum = useIcerik().ayarlar.bolumler.teklif;
  baslik = baslik ?? bolum.baslik;
  aciklama = aciklama ?? bolum.aciklama;
  const KAYAN = bolum.kayanYazilar ?? [];

  return (
    <section className="relative overflow-hidden">
      <div aria-hidden="true" className="flex overflow-hidden py-5 [mask-image:linear-gradient(90deg,transparent,black_12%,black_88%,transparent)]">
        {[0, 1].map((kopya) => (
          <ul key={kopya} className="kayan-serit flex shrink-0 items-center gap-14 pr-14">
            {KAYAN.map((k) => (
              <li key={k} className="whitespace-nowrap text-sm font-bold uppercase tracking-[2px] text-neutral-300">
                {k}
              </li>
            ))}
          </ul>
        ))}
      </div>

      <div className="kap pb-16 pt-6 md:pb-24 md:pt-8">
        <Belirme>
          <a
            href="/iletisim/"
            className="group relative block overflow-hidden rounded-[28px] border border-white/10 bg-[#0b0b0e] p-8 shadow-[inset_0_1px_0_rgba(255,255,255,0.07),0_40px_100px_-40px_rgba(0,0,0,0.9)] transition-colors duration-500 hover:border-white/20 sm:p-12 md:p-16"
          >
            <span
              aria-hidden="true"
              className="pointer-events-none absolute inset-0 bg-[radial-gradient(55%_110%_at_0%_0%,rgba(226,70,45,0.32),transparent_62%),radial-gradient(50%_110%_at_100%_100%,rgba(42,72,160,0.38),transparent_62%)] transition-opacity duration-500 group-hover:opacity-90"
            />
            <span className="relative block">
              <span className="baslik block max-w-3xl text-[clamp(1.6rem,3.4vw,2.4rem)] leading-[1.1] tracking-[-0.035em] text-white">{baslik}</span>
              <span className="mt-5 flex flex-col gap-7 md:flex-row md:items-end md:justify-between">
                <span className="govde-dar max-w-lg text-base leading-7 text-neutral-200">{aciklama}</span>
                <span className="inline-flex min-h-14 shrink-0 items-center gap-3 self-start rounded-full bg-[#ecebe7] px-7 text-base font-semibold text-zemin transition-colors duration-300 group-hover:bg-white md:self-auto">
                  Teklif al
                  <IconArrowRight size={19} aria-hidden="true" className="transition-transform duration-300 group-hover:translate-x-1" />
                </span>
              </span>
            </span>
          </a>
        </Belirme>
      </div>
    </section>
  );
}
