import { IconArrowRight, IconArrowUp } from "@tabler/icons-react";
import { useIcerik } from "../veri/kaynak";
import { hizmetYolu, yaziYolu } from "../veri/yardimci";

const SUTUN_BASLIGI = "mb-5 font-mono text-xs uppercase tracking-[1.6px] text-neutral-400";
const SUTUN_BAGLANTISI =
  "inline-flex min-h-9 items-center text-sm text-neutral-300 transition-colors duration-300 hover:text-white active:text-white";

export default function Alt() {
  const { hizmetler, yazilar, ayarlar } = useIcerik();
  const SITE = ayarlar.site;

  return (
    // Ekranın iki kenarına uzanan buzlu cam şerit; arkadaki ışık bulanık görünür.
    <footer className="border-t border-white/10 bg-white/[0.035] shadow-[inset_0_1px_0_rgba(255,255,255,0.06)] backdrop-blur-2xl">
      <div className="kap pt-14 md:pt-16">
        <div className="grid grid-cols-1 gap-12 sm:grid-cols-2 lg:grid-cols-[1.4fr_1fr_1.3fr_1fr] lg:gap-10">
          <div>
            <a href="/" className="inline-flex items-center gap-2.5" aria-label="KAM ana sayfa">
              <span className="text-[26px] font-bold leading-none tracking-[-0.07em] text-white">KAM</span>
            </a>
            <p className="mt-5 max-w-xs text-sm leading-6 text-neutral-400">{SITE.aciklama}</p>
          </div>

          <nav aria-label="Hizmetler">
            <p className={SUTUN_BASLIGI}>Hizmetler</p>
            <ul>
              {hizmetler.map((h) => (
                <li key={h.slug}>
                  <a href={hizmetYolu(h.slug)} className={SUTUN_BAGLANTISI}>
                    {h.baslik}
                  </a>
                </li>
              ))}
              <li>
                <a href="/demolar/" className={SUTUN_BAGLANTISI}>
                  Canlı demolar
                </a>
              </li>
              <li>
                <a href="/hizmetler/" className={`${SUTUN_BAGLANTISI} gap-1.5 font-semibold text-white`}>
                  Bütün hizmetler <IconArrowRight size={15} aria-hidden="true" />
                </a>
              </li>
              <li>
                <a href="/isler/" className={`${SUTUN_BAGLANTISI} gap-1.5 font-semibold text-white`}>
                  Yaptığımız işler <IconArrowRight size={15} aria-hidden="true" />
                </a>
              </li>
            </ul>
          </nav>

          <nav aria-label="Blog">
            <p className={SUTUN_BASLIGI}>Blogdan</p>
            <ul>
              {yazilar.slice(0, 4).map((y) => (
                <li key={y.slug}>
                  <a href={yaziYolu(y.slug)} className={`${SUTUN_BAGLANTISI} py-1.5 leading-5`}>
                    {y.baslik}
                  </a>
                </li>
              ))}
              <li>
                <a href="/blog/" className={`${SUTUN_BAGLANTISI} gap-1.5 font-semibold text-white`}>
                  Tüm yazılar <IconArrowRight size={15} aria-hidden="true" />
                </a>
              </li>
            </ul>
          </nav>

          <div>
            <a href="/iletisim/" className={`${SUTUN_BASLIGI} block w-fit transition-colors hover:text-white`}>İletişim</a>
            <a
              href={`mailto:${SITE.eposta}`}
              className="text-base text-white underline decoration-white/20 underline-offset-4 transition-colors duration-300 hover:text-vurgu hover:decoration-vurgu"
            >
              {SITE.eposta}
            </a>
            <p className="mt-3 text-sm text-neutral-400">{SITE.konum}</p>
            <p className="mt-1 text-sm text-neutral-400">Türkiye geneli uzaktan hizmet</p>
            <a href="/musteri/" className={`${SUTUN_BAGLANTISI} mt-4`}>
              Müşteri girişi
            </a>
          </div>
        </div>

        <div className="mt-14 flex flex-col gap-3 border-t border-white/[0.08] pt-7 pb-[calc(5.5rem+env(safe-area-inset-bottom))] sm:flex-row sm:items-center sm:justify-between sm:pb-[max(1.75rem,env(safe-area-inset-bottom))]">
          <p className="font-mono text-xs uppercase tracking-[1.2px] text-neutral-400">
            {SITE.tamAd} {new Date().getFullYear()}
          </p>
          <a
            href="#tepe"
            className="inline-flex min-h-11 items-center gap-1.5 font-mono text-xs uppercase tracking-[1.2px] text-neutral-400 transition-colors duration-300 hover:text-white"
          >
            Başa dön <IconArrowUp size={14} aria-hidden="true" />
          </a>
        </div>
      </div>
    </footer>
  );
}
