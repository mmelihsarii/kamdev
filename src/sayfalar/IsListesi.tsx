import { useEffect, useRef, useState } from "react";
import { IconArrowRight, IconChevronLeft, IconChevronRight } from "@tabler/icons-react";
import TeklifCagrisi from "../bilesenler/TeklifCagrisi";
import { ProjeKarti } from "../bilesenler/Isler";
import { useIcerik } from "../veri/kaynak";
import type { Proje } from "../veri/tipler";

/** Kartta işin kendi alanı yazar; süzgeçte benzer alanlar tek başlıkta toplanır. Listede olmayan alan kendi adıyla çıkar. */
const GRUPLAR: Record<string, string> = {
  "Klinik sitesi": "Web sitesi",
  "Emlak portalı": "Web sitesi",
  "Kurumsal site": "Web sitesi",
  "Marka sitesi": "Web sitesi",
  "Kurumsal yazılım": "Yazılım",
};
const GRUP_SIRASI = ["Web sitesi", "E ticaret", "Mobil uygulama", "Yazılım"];
/** Bir sayfada görünen iş sayısı; gerisi numaralı sayfalarda. */
const SAYFA_BASI = 4;

const grubu = (p: Proje) => GRUPLAR[p.alan] ?? p.alan;
const sirasi = (g: string) => (GRUP_SIRASI.indexOf(g) + 1 || 99);

/** Bütün referans işler; alana göre süzülebilir, her kart kendi sayfasına gider. */
export default function IsListesi() {
  const { projeler, ayarlar } = useIcerik();
  const bolum = ayarlar.bolumler.islerSayfasi ?? ayarlar.bolumler.isler;
  const gruplar = [...new Set(projeler.map(grubu).filter(Boolean))].sort((a, b) => sirasi(a) - sirasi(b));
  const [secili, setSecili] = useState<string | null>(null);
  const [sayfa, setSayfa] = useState(1);
  const izgara = useRef<HTMLElement>(null);
  const liste = secili ? projeler.filter((p) => grubu(p) === secili) : projeler;
  const sayfaSayisi = Math.max(1, Math.ceil(liste.length / SAYFA_BASI));
  const gecerli = Math.min(sayfa, sayfaSayisi);
  const gorunen = liste.slice((gecerli - 1) * SAYFA_BASI, gecerli * SAYFA_BASI);

  // Bağlantıyla gelen sayfa numarası (?sayfa=3) açılışta okunur; ön işlenen HTML hep ilk sayfadır.
  useEffect(() => {
    const n = Number(new URLSearchParams(location.search).get("sayfa"));
    if (n > 1) setSayfa(n);
  }, []);

  const sayfayaGit = (n: number) => {
    setSayfa(n);
    const adres = new URL(location.href);
    if (n > 1) adres.searchParams.set("sayfa", String(n));
    else adres.searchParams.delete("sayfa");
    history.replaceState(null, "", adres);
    const ust = izgara.current?.getBoundingClientRect().top ?? 0;
    if (ust < 80) izgara.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  return (
    <>
      <div>
        <div className="isler-sayfasi">
          <header className="isler-sayfasi__baslik">
            <h1 className="baslik">{bolum.baslik || "İşlerimiz"}</h1>
            <p>{bolum.aciklama}</p>
            {gruplar.length > 1 && (
              <div role="group" aria-label="Alana göre süz" className="isler-sayfasi__filtreler">
                {[null, ...gruplar].map((grup) => (
                  <button
                    key={grup ?? "tumu"}
                    type="button"
                    onClick={() => {
                      setSecili(grup);
                      sayfayaGit(1);
                    }}
                    aria-pressed={secili === grup}
                  >
                    {grup ?? "Tüm işler"}
                  </button>
                ))}
              </div>
            )}
          </header>

          <section ref={izgara} aria-label="Projeler" className="isler-sayfasi__grid scroll-mt-28">
            {gorunen.map((proje) => (
              <div key={proje.kimlik} className="isler-sayfasi__oge">
                <ProjeKarti proje={proje} />
              </div>
            ))}
            {gorunen.length % 2 === 1 && (
              <a href="/iletisim/" className="isler-sayfasi__davet">
                <strong>Yeni bir proje mi var?</strong>
                <span>Ne yapmak istediğinizi anlatın, kapsam, süre ve fiyat yazılı gelsin.</span>
                <em>
                  Teklif al
                  <IconArrowRight size={16} aria-hidden="true" />
                </em>
              </a>
            )}
          </section>

          {sayfaSayisi > 1 && (
            <nav aria-label="Sayfalar" className="isler-sayfasi__sayfalar">
              <button type="button" onClick={() => sayfayaGit(gecerli - 1)} disabled={gecerli === 1} aria-label="Önceki sayfa">
                <IconChevronLeft size={18} aria-hidden="true" />
              </button>
              {Array.from({ length: sayfaSayisi }, (_, i) => i + 1).map((n) => (
                <button key={n} type="button" onClick={() => sayfayaGit(n)} aria-current={n === gecerli ? "page" : undefined} aria-label={`${n}. sayfa`}>
                  {n}
                </button>
              ))}
              <button type="button" onClick={() => sayfayaGit(gecerli + 1)} disabled={gecerli === sayfaSayisi} aria-label="Sonraki sayfa">
                <IconChevronRight size={18} aria-hidden="true" />
              </button>
            </nav>
          )}
        </div>
      </div>

      <TeklifCagrisi />
    </>
  );
}
