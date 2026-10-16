/* Site ayarları: genel bilgiler, ana sayfa girişi, bölüm başlıkları, vitrin ve teknoloji grupları. */
import { useEffect, useState } from "react";
import { IconAlertTriangle, IconCheck, IconChevronDown, IconFilePencil } from "@tabler/icons-react";
import { YardimKutusu } from "../rehber";
import type { Ayarlar } from "../../veri/tipler";
import { ApiHatasi, onceGoster, yonetim } from "../api";
import { FormAlanlari } from "../Form";
import { Dugme, KART, useKaydetKisayolu, useKirliKoruma, usePanel } from "../ortak";
import { BOLUM_ADLARI, HERO_ALANLARI, SECKI_ALANLARI, SITE_ALANLARI, VITRIN_ALANLARI, bolumAlanlari } from "../sema";
import { ayniMi, taslakOku, taslakSil, useTaslakYaz } from "../taslak";
import { git, useYonetimIcerik } from "./baglam";

const SEKMELER = [
  ["giris", "Ana sayfa girişi"],
  ["bolumler", "Bölüm başlıkları"],
  ["vitrin", "Vitrin ve görseller"],
  ["secki", "Teknoloji grupları"],
  ["site", "Site bilgileri"],
] as const;

type Sekme = (typeof SEKMELER)[number][0];
type Nesne = Record<string, unknown>;

function HeroOnizleme({ hero }: { hero: Ayarlar["hero"] }) {
  return (
    <section className={`${KART} overflow-hidden`}>
      <div className="border-b border-white/[0.06] px-5 py-3">
        <h2 className="text-[13px] font-medium text-neutral-200">Önizleme</h2>
      </div>
      <div className="px-6 py-10 sm:px-10">
        <p className="max-w-[12ch] text-[38px] font-semibold leading-[1.03] tracking-tight text-white sm:text-[48px]">{hero.baslikUst}</p>
        <p className="mt-5 max-w-xl text-[15px] leading-relaxed text-neutral-300">{hero.aciklama}</p>
        <div className="mt-6 flex flex-wrap gap-2">
          <span className="inline-flex h-10 items-center rounded-full bg-[#ecebe7] px-5 text-sm font-semibold text-zemin">{hero.birincilDugme}</span>
          <span className="inline-flex h-10 items-center rounded-full border border-white/15 px-5 text-sm text-neutral-200">{hero.ikincilDugme}</span>
        </div>
      </div>
    </section>
  );
}

function BolumKarti({ anahtar, deger, degistir }: { anahtar: keyof Ayarlar["bolumler"]; deger: Nesne; degistir: (v: Nesne) => void }) {
  const [acik, setAcik] = useState(false);
  return (
    <div className={KART}>
      <button type="button" onClick={() => setAcik(!acik)} className="flex w-full items-center justify-between gap-3 px-5 py-4 text-left" aria-expanded={acik}>
        <span className="min-w-0">
          <span className="block text-[15px] font-medium text-white">{BOLUM_ADLARI[anahtar]}</span>
          <span className="mt-0.5 block truncate text-[13px] text-neutral-500">{[deger.baslik, deger.vurgu].filter(Boolean).join(" ") || (deger.altBaslik as string) || "Başlık girilmedi"}</span>
        </span>
        <IconChevronDown size={18} className={`shrink-0 text-neutral-500 transition-transform ${acik ? "rotate-180" : ""}`} />
      </button>
      {acik && (
        <div className="border-t border-white/[0.06] p-5">
          <FormAlanlari alanlar={bolumAlanlari(anahtar)} deger={deger} degistir={degistir} />
        </div>
      )}
    </div>
  );
}

export default function AyarlarSayfasi({ sekme: sekmeAdi }: { sekme?: string }) {
  const { icerik, ayarlarKaydedildi, yenile } = useYonetimIcerik();
  const { bildir, hataBildir } = usePanel();
  const sekmeBul = (ad?: string): Sekme => (SEKMELER.some(([k]) => k === ad) ? (ad as Sekme) : "giris");
  const [sekme, setSekme] = useState<Sekme>(() => sekmeBul(sekmeAdi));
  useEffect(() => setSekme(sekmeBul(sekmeAdi)), [sekmeAdi]);

  const [kayitli, setKayitli] = useState<Ayarlar>(icerik.ayarlar);
  const [deger, setDeger] = useState<Ayarlar>(icerik.ayarlar);
  const [zaman, setZaman] = useState(icerik.zamanlar.ayarlar);
  const [kaydediliyor, setKaydediliyor] = useState(false);
  const [cakisma, setCakisma] = useState(false);
  const [taslak, setTaslak] = useState(() => {
    const t = taslakOku<Ayarlar>("ayarlar");
    return t && !ayniMi(t.veri, kayitli) ? t : null;
  });

  const kirli = !ayniMi(deger, kayitli);
  useTaslakYaz("ayarlar", deger, kirli);
  useKirliKoruma(kirli);

  const kaydet = async (zorla = false) => {
    setKaydediliyor(true);
    try {
      const sonuc = await yonetim<{ guncelleme: string }>("ayarlar-kaydet", { ayarlar: deger, ...(zaman && !zorla ? { beklenen: zaman } : {}) });
      ayarlarKaydedildi(deger, sonuc.guncelleme);
      taslakSil("ayarlar");
      setKayitli(deger);
      setZaman(sonuc.guncelleme);
      setTaslak(null);
      setCakisma(false);
      bildir("Ayarlar kaydedildi ve sitede yayında");
    } catch (h) {
      if (h instanceof ApiHatasi && h.kod === 409) setCakisma(true);
      hataBildir(h);
    } finally {
      setKaydediliyor(false);
    }
  };
  useKaydetKisayolu(() => !kaydediliyor && kaydet());

  const parca = <K extends keyof Ayarlar>(k: K, v: Ayarlar[K]) => setDeger({ ...deger, [k]: v });

  return (
    <div>
      <div className="sticky top-14 z-30 -mx-4 mb-6 border-b border-white/[0.06] bg-zemin/90 px-4 pt-4 backdrop-blur sm:-mx-6 sm:px-6 lg:top-0 lg:-mx-10 lg:px-10 lg:pt-6">
        <div className="mx-auto max-w-[1180px]">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h1 className="text-[26px] font-bold tracking-tight text-white">Ana sayfa ve ayarlar</h1>
            <div className="flex items-center gap-3">
              <span className={`hidden text-[12.5px] md:inline ${kirli ? "text-amber-300/90" : "text-neutral-500"}`}>
                {kirli ? "Kaydedilmemiş değişiklik var" : zaman ? `Son kayıt ${onceGoster(zaman)}` : ""}
              </span>
              <Dugme tur="birincil" onClick={() => kaydet()} yukleniyor={kaydediliyor} disabled={!kirli} ikon={!kirli ? <IconCheck size={16} /> : undefined}>
                {kirli ? "Kaydet ve yayınla" : "Kaydedildi"}
              </Dugme>
            </div>
          </div>
          <nav className="-mb-px mt-4 flex gap-1 overflow-x-auto" aria-label="Ayar bölümleri">
            {SEKMELER.map(([k, ad]) => (
              <a
                key={k}
                href={`#/ayarlar/${k}`}
                onClick={(e) => {
                  // Sekme değiştirmek sayfadan ayrılmak değil; değişiklikler aynı formda kalır.
                  e.preventDefault();
                  history.replaceState(null, "", `#/ayarlar/${k}`);
                  setSekme(k);
                }}
                aria-current={sekme === k ? "page" : undefined}
                className={`shrink-0 border-b-2 px-3 pb-3 text-sm font-medium transition-colors ${
                  sekme === k ? "border-vurgu text-white" : "border-transparent text-neutral-400 hover:text-neutral-200"
                }`}
              >
                {ad}
              </a>
            ))}
          </nav>
        </div>
      </div>

      <YardimKutusu anahtar="ayarlar" />

      {taslak && (
        <div className="mb-6 flex flex-col gap-3 rounded-xl border border-amber-400/25 bg-amber-400/[0.05] p-4 sm:flex-row sm:items-center sm:justify-between">
          <p className="flex items-start gap-2.5 text-sm text-amber-100">
            <IconFilePencil size={18} className="mt-px shrink-0" />
            Ayarlar için kaydedilmemiş bir taslağın var, {onceGoster(new Date(taslak.zaman).toISOString())} yazılmış.
          </p>
          <div className="flex gap-2">
            <Dugme
              kucuk
              tur="birincil"
              onClick={() => {
                setDeger(taslak.veri);
                setTaslak(null);
              }}
            >
              Taslağı geri yükle
            </Dugme>
            <Dugme
              kucuk
              onClick={() => {
                taslakSil("ayarlar");
                setTaslak(null);
              }}
            >
              Taslağı sil
            </Dugme>
          </div>
        </div>
      )}

      {cakisma && (
        <div className="mb-6 rounded-xl border border-red-500/25 bg-red-500/[0.05] p-4">
          <p className="flex items-start gap-2.5 text-sm text-red-100">
            <IconAlertTriangle size={18} className="mt-px shrink-0" />
            Ayarlar sen düzenlerken başka bir sekmede ya da cihazda değişti. Yazdıkların bu tarayıcıda taslak olarak duruyor.
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            <Dugme
              kucuk
              onClick={async () => {
                await yenile();
                git("/");
              }}
            >
              Sunucudaki son hali aç
            </Dugme>
            <Dugme kucuk tur="tehlike" onClick={() => kaydet(true)}>
              Benimkini yine de kaydet
            </Dugme>
          </div>
        </div>
      )}

      {sekme === "giris" && (
        <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
          <section className={`${KART} p-5 sm:p-6`}>
            <FormAlanlari alanlar={HERO_ALANLARI} deger={deger.hero as unknown as Nesne} degistir={(v) => parca("hero", v as unknown as Ayarlar["hero"])} />
          </section>
          <div className="xl:sticky xl:top-40 xl:self-start">
            <HeroOnizleme hero={deger.hero} />
          </div>
        </div>
      )}

      {sekme === "bolumler" && (
        <div className="space-y-2">
          <p className="mb-4 text-[14px] text-neutral-400">Ana sayfadaki her bölümün üstündeki küçük etiket, başlık ve açıklama.</p>
          {(Object.keys(BOLUM_ADLARI) as (keyof Ayarlar["bolumler"])[]).map((k) => (
            <BolumKarti
              key={k}
              anahtar={k}
              deger={(deger.bolumler[k] ?? {}) as unknown as Nesne}
              degistir={(v) => parca("bolumler", { ...deger.bolumler, [k]: v })}
            />
          ))}
        </div>
      )}

      {sekme === "vitrin" && (
        <section className={`${KART} p-5 sm:p-6`}>
          <FormAlanlari
            alanlar={VITRIN_ALANLARI}
            deger={{ vitrinGorselleri: deger.vitrinGorselleri }}
            degistir={(v) => setDeger({ ...deger, ...(v as Partial<Ayarlar>) })}
          />
        </section>
      )}

      {sekme === "secki" && (
        <section className={`${KART} p-5 sm:p-6`}>
          <p className="mb-5 text-[14px] text-neutral-400">Teknoloji bölümünde yan yana duran gruplar. Logolar Teknolojiler listesinden gelir.</p>
          <FormAlanlari alanlar={SECKI_ALANLARI} deger={{ teknolojiSecki: deger.teknolojiSecki }} degistir={(v) => setDeger({ ...deger, ...(v as Partial<Ayarlar>) })} />
        </section>
      )}

      {sekme === "site" && (
        <section className={`${KART} p-5 sm:p-6`}>
          <FormAlanlari alanlar={SITE_ALANLARI} deger={deger.site as unknown as Nesne} degistir={(v) => parca("site", v as unknown as Ayarlar["site"])} />
        </section>
      )}
    </div>
  );
}
