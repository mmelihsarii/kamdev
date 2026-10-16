/*
 * Süreç, tek bir hayali müşterinin (Ahenk Ev) hikâyesi olarak anlatılır:
 * konuşma, teklif, tasarım, geliştirme, yayın ve ölçme. Masaüstünde solda
 * adımlar, sağda sabit duran tek ekran; ekrandaki sahne seçili adıma göre
 * değişir ve bir kez oynar. Telefonda her adım kendi sahnesiyle alt alta durur.
 */
import { useEffect, useRef, useState, type ComponentType } from "react";
import { AnimatePresence, motion } from "motion/react";
import { EGRI } from "./Hareket";
import { GelistirmeCizimi, KonusmaCizimi, OlcmeCizimi, SAHNE_TETIK, TasarimCizimi, TeklifCizimi, YayinCizimi } from "./SurecCizimleri";
import { useIcerik } from "../veri/kaynak";
import { logoSinifi } from "../veri/yardimci";

const SAHNELER: ComponentType[] = [KonusmaCizimi, TeklifCizimi, TasarimCizimi, GelistirmeCizimi, YayinCizimi, OlcmeCizimi];

/** Sahneler bu ölçüde çizilir, kutuya göre büyütülür; yazılar vektör olduğu için bulanıklaşmaz. */
const SAHNE_G = 300;
const SAHNE_Y = 225;

type Adim = { baslik: string; aciklama: string; ogeler?: string[] };

/** Sahneyi bulunduğu kutunun genişliğine ölçekler. */
function Sahne({ Cizim }: { Cizim: ComponentType }) {
  const kutu = useRef<HTMLDivElement>(null);
  const [olcek, setOlcek] = useState(1);
  useEffect(() => {
    const k = kutu.current;
    if (!k) return;
    const gozlem = new ResizeObserver(([e]) => setOlcek(e.contentRect.width / SAHNE_G));
    gozlem.observe(k);
    return () => gozlem.disconnect();
  }, []);
  return (
    <div ref={kutu} className="relative w-full" style={{ aspectRatio: `${SAHNE_G} / ${SAHNE_Y}` }}>
      <div className="absolute left-0 top-0 origin-top-left" style={{ width: SAHNE_G, height: SAHNE_Y, transform: `scale(${olcek})` }}>
        <Cizim />
      </div>
    </div>
  );
}

/** Ölçme adımının araç etiketleri; teknoloji listesindeki adlar logosuyla görünür. */
function Araclar({ ogeler }: { ogeler: string[] }) {
  const { teknolojiler } = useIcerik();
  return (
    <ul className="mt-3 flex flex-wrap gap-1.5">
      {ogeler.map((oge) => {
        const t = teknolojiler.find((x) => x.ad.toLocaleLowerCase("tr") === oge.toLocaleLowerCase("tr"));
        return (
          <li key={oge} className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/[0.03] px-2.5 py-1 text-[12.5px] text-neutral-300">
            {t?.ikon && <img src={t.ikon} alt="" loading="lazy" className={`h-3.5 w-3.5 object-contain ${logoSinifi(t)}`} />}
            {oge}
          </li>
        );
      })}
    </ul>
  );
}

/** Panelden gelen süreç adımları ve sonuna eklenen ölçme adımı. */
function useAdimlar(): Adim[] {
  const { surec, ayarlar } = useIcerik();
  const olcme = ayarlar.bolumler.surecSayfasi?.olcme;
  const adimlar: Adim[] = surec.map((a) => ({ baslik: a.baslik, aciklama: a.aciklama }));
  if (olcme?.baslik) adimlar.push({ baslik: olcme.baslik, aciklama: olcme.metin, ogeler: olcme.ogeler });
  return adimlar;
}

/**
 * kaydirma: süreç sayfasında adımlar kaydırdıkça ilerler.
 * Kapalıyken (ana sayfa, hizmet sayfaları) adıma tıklanınca ekran değişir; yer kaplamaz.
 */
export default function SurecHikayesi({ kaydirma = false }: { kaydirma?: boolean }) {
  const adimlar = useAdimlar();
  const [aktif, setAktif] = useState(0);
  const ogeler = useRef<(HTMLLIElement | null)[]>([]);

  useEffect(() => {
    if (!kaydirma) return;
    const gozlem = new IntersectionObserver(
      (girdiler) => {
        for (const g of girdiler) if (g.isIntersecting) setAktif(Number((g.target as HTMLElement).dataset.sira));
      },
      { rootMargin: "-45% 0px -45% 0px" },
    );
    ogeler.current.forEach((o) => o && gozlem.observe(o));
    return () => gozlem.disconnect();
  }, [kaydirma, adimlar.length]);

  if (!adimlar.length) return null;
  const Cizim = SAHNELER[aktif];

  return (
    <>
      {/* Masaüstü: solda adımlar, sağda sabit ekran */}
      <div className="hidden gap-16 lg:grid lg:grid-cols-[minmax(0,0.8fr)_minmax(0,1.2fr)]">
        <ol className={kaydirma ? "py-[18vh]" : "flex flex-col justify-center"}>
          {adimlar.map((adim, sira) => {
            const acik = sira === aktif;
            return (
              <li
                key={adim.baslik}
                ref={(o) => {
                  ogeler.current[sira] = o;
                }}
                data-sira={sira}
                className={kaydirma ? "flex min-h-[42vh] items-center" : ""}
              >
                <button
                  type="button"
                  onClick={() => setAktif(sira)}
                  aria-pressed={acik}
                  className={`w-full border-l-2 py-4 pl-6 text-left transition-colors duration-500 ${acik ? "border-white" : "border-white/10 hover:border-white/30"}`}
                >
                  <span className={`block text-xl font-normal tracking-tight transition-colors duration-500 ${acik ? "text-white" : "text-neutral-500"}`}>
                    {adim.baslik}
                  </span>
                  <motion.span
                    initial={false}
                    animate={{ height: acik || kaydirma ? "auto" : 0, opacity: acik ? 1 : kaydirma ? 0.45 : 0 }}
                    transition={{ duration: 0.4, ease: EGRI }}
                    className="block overflow-hidden"
                  >
                    <span className="block pt-2 text-[15px] leading-7 text-neutral-400">{adim.aciklama}</span>
                    {adim.ogeler && adim.ogeler.length > 0 && <Araclar ogeler={adim.ogeler} />}
                  </motion.span>
                </button>
              </li>
            );
          })}
        </ol>

        <div className={kaydirma ? "relative" : "flex items-center"}>
          <div className={`w-full ${kaydirma ? "sticky top-[calc(50vh-15rem)]" : ""}`}>
            <div>
              <AnimatePresence mode="wait" initial={false}>
                {Cizim && (
                  <motion.div
                    key={aktif}
                    aria-hidden="true"
                    initial="gizli"
                    animate="gorunur"
                    exit={{ opacity: 0, transition: { duration: 0.18 } }}
                    variants={{ gizli: { opacity: 0 }, gorunur: { opacity: 1, transition: { duration: 0.3 } } }}
                  >
                    <Sahne Cizim={Cizim} />
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
            <p className="mt-4 text-center text-[13px] text-neutral-500">Örnek proje, Ahenk Ev online mağazası</p>
          </div>
        </div>
      </div>

      {/* Telefon ve tablet: her adım kendi sahnesiyle */}
      <ol className="grid gap-10 sm:grid-cols-2 sm:gap-x-6 lg:hidden">
        {adimlar.map((adim, sira) => {
          const C = SAHNELER[sira];
          return (
            <motion.li key={adim.baslik} className="flex flex-col" {...SAHNE_TETIK}>
              {C && (
                <div aria-hidden="true">
                  <Sahne Cizim={C} />
                </div>
              )}
              <div className="px-1 pt-3">
                <h3 className="text-lg font-normal tracking-tight text-white">{adim.baslik}</h3>
                <p className="mt-1.5 text-[15px] leading-7 text-neutral-400">{adim.aciklama}</p>
                {adim.ogeler && adim.ogeler.length > 0 && <Araclar ogeler={adim.ogeler} />}
              </div>
            </motion.li>
          );
        })}
      </ol>
    </>
  );
}
