import { useIcerik } from "../veri/kaynak";
import { logoSinifi } from "../veri/yardimci";
import type { Teknoloji } from "../veri/tipler";

function Satir({ logolar, ters = false, sure }: { logolar: Teknoloji[]; ters?: boolean; sure: number }) {
  return (
    <div className="group flex overflow-hidden [mask-image:linear-gradient(90deg,transparent,black_6%,black_94%,transparent)]">
      {[0, 1].map((kopya) => (
        <ul
          key={kopya}
          aria-hidden={kopya === 1}
          className={`flex shrink-0 items-center gap-6 pr-6 group-hover:[animation-play-state:paused] ${ters ? "kayan-serit-ters" : "kayan-serit"}`}
          style={{ animationDuration: `${sure}s` }}
        >
          {logolar.map((t) => (
            <li key={t.kimlik} className="flex h-12 shrink-0 items-center gap-3 px-4">
              <span className="flex h-7 w-7 shrink-0 items-center justify-center">
                <img src={t.ikon} alt="" loading="lazy" decoding="async" className={`h-full w-full object-contain ${logoSinifi(t)}`} />
              </span>
              <span className="whitespace-nowrap text-[15px] font-medium text-neutral-400">{t.ad}</span>
            </li>
          ))}
        </ul>
      ))}
    </div>
  );
}

/** Hero'nun hemen altında, kullandığımız tüm teknolojilerin iki satır halinde zıt yönlere aktığı şerit. */
export default function LogoSeridi() {
  const { teknolojiler, ayarlar } = useIcerik();
  const bolum = ayarlar.bolumler.logoSeridi;
  const yari = Math.ceil(teknolojiler.length / 2);

  return (
    <section aria-label="Kullandığımız teknolojiler" className="relative py-8 md:py-10">
      <div className="kap flex flex-col gap-6 lg:flex-row lg:items-center lg:gap-10">
        <p className="shrink-0 text-[13px] font-bold uppercase leading-6 tracking-[1.6px] text-neutral-400 lg:w-44">
          {bolum.etiket}
          <span className="block text-white">
            {teknolojiler.length} {bolum.baslik}
          </span>
        </p>
        <div className="flex min-w-0 flex-1 flex-col gap-3">
          <Satir logolar={teknolojiler.slice(0, yari)} sure={230} />
          <Satir logolar={teknolojiler.slice(yari)} ters sure={250} />
        </div>
      </div>
    </section>
  );
}
