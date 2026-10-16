/*
 * Bir koleksiyonun listesi ve düzenleme ekranı. Blog yazıları, işler,
 * hizmetler, sorular, süreç adımları, ilkeler ve teknolojiler aynı ekranı kullanır.
 */
import { useMemo, useState } from "react";
import {
  IconAlertTriangle,
  IconCheck,
  IconArrowDown,
  IconArrowLeft,
  IconArrowUp,
  IconExternalLink,
  IconFilePencil,
  IconPhoto,
  IconPlus,
  IconSearch,
  IconTrash,
} from "@tabler/icons-react";
import { SITE } from "../../veri/site";
import type { KoleksiyonAdi } from "../../veri/tipler";
import { ApiHatasi, onceGoster, yonetim } from "../api";
import { FormAlanlari } from "../Form";
import { Anahtar, BosDurum, Dugme, GIRDI, KART, SimgeDugme, kirliAyarla, useKaydetKisayolu, useKirliKoruma, usePanel } from "../ortak";
import { SAYFA_YARDIMI, YardimKutusu } from "../rehber";
import { KOLEKSIYON_TANIMLARI, type KoleksiyonTanimi } from "../sema";
import { ayniMi, taslakOku, taslakSil, useTaslakYaz } from "../taslak";
import { git, useYonetimIcerik } from "./baglam";

type Oge = Record<string, unknown> & { kimlik: string; yayinda?: boolean };

export default function KoleksiyonSayfasi({ koleksiyon, kimlik }: { koleksiyon: KoleksiyonAdi; kimlik?: string }) {
  const tanim = KOLEKSIYON_TANIMLARI[koleksiyon];
  return kimlik ? <Duzenleyici tanim={tanim} kimlik={kimlik} /> : <Liste tanim={tanim} />;
}

/* ---------------- Liste ---------------- */

function Kucuk({ gorsel, logo }: { gorsel?: string; logo?: boolean }) {
  if (!gorsel)
    return (
      <span className="flex h-12 w-16 shrink-0 items-center justify-center rounded-md bg-white/[0.04] text-neutral-600">
        <IconPhoto size={18} />
      </span>
    );
  return (
    <span className={`flex h-12 w-16 shrink-0 items-center justify-center overflow-hidden rounded-md ${logo ? "bg-white/[0.04] p-2.5" : "bg-white/[0.04]"}`}>
      <img src={gorsel} alt="" loading="lazy" className={logo ? "max-h-full max-w-full object-contain" : "h-full w-full object-cover"} />
    </span>
  );
}

function Liste({ tanim }: { tanim: KoleksiyonTanimi }) {
  const { icerik, siraDegisti, ogeSilindi } = useYonetimIcerik();
  const { bildir, hataBildir, onayla } = usePanel();
  const [arama, setArama] = useState("");
  const liste = icerik[tanim.ad] as unknown as Oge[];

  const suzulmus = useMemo(() => {
    const a = arama.trim().toLocaleLowerCase("tr");
    if (!a) return liste;
    return liste.filter((o) => {
      const oz = tanim.ozet(o);
      return `${oz.baslik} ${oz.alt ?? ""}`.toLocaleLowerCase("tr").includes(a);
    });
  }, [liste, arama, tanim]);

  const tasi = async (i: number, yon: -1 | 1) => {
    const j = i + yon;
    if (j < 0 || j >= liste.length) return;
    const yeni = [...liste];
    [yeni[i], yeni[j]] = [yeni[j], yeni[i]];
    siraDegisti(tanim.ad, yeni);
    try {
      await yonetim("sirala", { koleksiyon: tanim.ad, kimlikler: yeni.map((o) => o.kimlik) });
    } catch (h) {
      siraDegisti(tanim.ad, liste);
      hataBildir(h);
    }
  };

  const sil = async (o: Oge) => {
    const ad = tanim.ozet(o).baslik;
    const tamam = await onayla({
      baslik: `${tanim.tekil} silinsin mi?`,
      metin: (
        <>
          <strong className="text-white">{ad}</strong> sitedeki yerinden kalkar ve çöp kutusuna taşınır. Yedekler sayfasından istediğin zaman geri alabilirsin.
        </>
      ),
      dugme: "Çöp kutusuna taşı",
      tehlike: true,
    });
    if (!tamam) return;
    try {
      await yonetim("oge-sil", { koleksiyon: tanim.ad, kimlik: o.kimlik });
      ogeSilindi(tanim.ad, o.kimlik);
      bildir("Çöp kutusuna taşındı");
    } catch (h) {
      hataBildir(h);
    }
  };

  const yayindaSayisi = liste.filter((o) => o.yayinda !== false).length;
  const sitede = SAYFA_YARDIMI[tanim.ad]?.sitede;

  return (
    <div>
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-[26px] font-bold tracking-tight text-white sm:text-[30px]">{tanim.baslik}</h1>
          <p className="mt-1.5 text-[13.5px] text-neutral-500">
            {liste.length} kayıt, {yayindaSayisi} tanesi sitede görünüyor
            {liste.length - yayindaSayisi > 0 && `, ${liste.length - yayindaSayisi} tanesi gizli`}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {sitede && (
            <a
              href={sitede.adres}
              target="_blank"
              rel="noopener"
              className="inline-flex h-10 items-center gap-2 rounded-lg border border-white/12 bg-white/[0.04] px-4 text-sm font-medium text-neutral-100 hover:border-white/25"
            >
              <IconExternalLink size={16} />
              Sitede gör
            </a>
          )}
          <a href={`#/icerik/${tanim.ad}/yeni`} className="inline-flex h-10 shrink-0 items-center gap-2 rounded-lg bg-vurgu px-4 text-sm font-medium text-white hover:bg-[#ea583f]">
            <IconPlus size={16} />
            Yeni {tanim.tekil.toLocaleLowerCase("tr")}
          </a>
        </div>
      </div>

      <YardimKutusu anahtar={tanim.ad} />

      {liste.length > 6 && (
        <div className="relative mb-4 max-w-sm">
          <IconSearch size={16} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-500" />
          <input className={`${GIRDI} pl-10`} placeholder="Ara" value={arama} onChange={(e) => setArama(e.target.value)} aria-label={`${tanim.baslik} içinde ara`} />
        </div>
      )}

      {suzulmus.length === 0 ? (
        <BosDurum
          baslik={arama ? "Aramana uyan kayıt yok" : "Henüz kayıt yok"}
          eylem={
            !arama && (
              <a href={`#/icerik/${tanim.ad}/yeni`} className="text-sm font-medium text-vurgu hover:underline">
                İlk kaydı ekle
              </a>
            )
          }
        />
      ) : (
        <ul className={`${KART} divide-y divide-white/[0.05]`}>
          {suzulmus.map((o) => {
            const oz = tanim.ozet(o);
            const i = liste.indexOf(o);
            const adres = tanim.adres?.(o);
            return (
              <li key={o.kimlik} className="group flex items-center gap-3 px-3 py-2.5 transition-colors hover:bg-white/[0.02] sm:gap-4 sm:px-4">
                {(tanim.ad === "yazilar" || tanim.ad === "projeler" || tanim.ad === "teknolojiler") && <Kucuk gorsel={oz.gorsel} logo={oz.logo} />}
                <a href={`#/icerik/${tanim.ad}/${o.kimlik}`} className="min-w-0 flex-1 py-1">
                  <span className="block truncate text-[15px] font-medium text-neutral-100 group-hover:text-white">{oz.baslik}</span>
                  <span className="mt-0.5 flex items-center gap-2 text-[13px]">
                    {o.yayinda === false ? <span className="font-medium text-amber-300/90">Gizli, sitede görünmüyor</span> : <span className="text-emerald-400/90">Sitede görünüyor</span>}
                    {oz.alt && <span className="truncate text-neutral-500">{oz.alt}</span>}
                  </span>
                </a>
                <div className="flex shrink-0 items-center">
                  {tanim.sirali && !arama && (
                    <>
                      <SimgeDugme ad="Yukarı taşı" disabled={i === 0} onClick={() => tasi(i, -1)}>
                        <IconArrowUp size={16} />
                      </SimgeDugme>
                      <SimgeDugme ad="Aşağı taşı" disabled={i === liste.length - 1} onClick={() => tasi(i, 1)}>
                        <IconArrowDown size={16} />
                      </SimgeDugme>
                    </>
                  )}
                  {adres && o.yayinda !== false && (
                    <a
                      href={adres}
                      target="_blank"
                      rel="noopener"
                      aria-label="Sitede gör"
                      title="Sitede gör"
                      className="hidden h-8 w-8 items-center justify-center rounded-lg text-neutral-400 hover:bg-white/[0.07] hover:text-white sm:inline-flex"
                    >
                      <IconExternalLink size={16} />
                    </a>
                  )}
                  <SimgeDugme ad="Sil" onClick={() => sil(o)} className="hover:text-red-300">
                    <IconTrash size={16} />
                  </SimgeDugme>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

/* ---------------- Düzenleyici ---------------- */

function eksikAlanlar(tanim: KoleksiyonTanimi, oge: Oge) {
  return tanim.alanlar.filter((a) => a.zorunlu && !String(oge[a.ad] ?? "").trim()).map((a) => a.etiket);
}

function GoogleOnizleme({ baslik, aciklama, adres }: { baslik: string; aciklama: string; adres: string }) {
  const alan = SITE.adres.replace(/^https?:\/\//, "");
  return (
    <section className={`${KART} p-5`}>
      <h2 className="text-[13px] font-medium text-neutral-200">Google sonucunda böyle görünür</h2>
      <div className="mt-3 rounded-lg bg-white px-4 py-3.5">
        <p className="truncate text-[13px] text-[#4d5156]">
          {alan}
          {adres}
        </p>
        <p className="mt-1 truncate text-[19px] leading-snug text-[#1a0dab]">{baslik || "Başlık"}</p>
        <p className="mt-1 line-clamp-2 text-[13.5px] leading-snug text-[#4d5156]">{aciklama || "Açıklama yazılmadı."}</p>
      </div>
    </section>
  );
}

function Duzenleyici({ tanim, kimlik }: { tanim: KoleksiyonTanimi; kimlik: string }) {
  const { icerik, ogeKaydedildi, ogeSilindi, yenile } = useYonetimIcerik();
  const { bildir, hataBildir, onayla } = usePanel();
  const yeni = kimlik === "yeni";
  const mevcut = yeni ? null : ((icerik[tanim.ad] as unknown as Oge[]).find((o) => o.kimlik === kimlik) ?? null);

  const [aktifKimlik, setAktifKimlik] = useState<string | null>(yeni ? null : kimlik);
  const [kayitli, setKayitli] = useState<Oge>(() => (mevcut ?? (tanim.yeni() as Oge)));
  const [deger, setDeger] = useState<Oge>(kayitli);
  const [zaman, setZaman] = useState<string | undefined>(() => (yeni ? undefined : icerik.zamanlar.ogeler[tanim.ad]?.[kimlik]));
  const [kaydediliyor, setKaydediliyor] = useState(false);
  const [cakisma, setCakisma] = useState(false);

  const taslakAnahtari = `oge:${tanim.ad}:${aktifKimlik ?? "yeni"}`;
  const [taslak, setTaslak] = useState(() => {
    const t = taslakOku<Oge>(taslakAnahtari);
    return t && !ayniMi(t.veri, kayitli) ? t : null;
  });

  const kirli = !ayniMi(deger, kayitli);
  useTaslakYaz(taslakAnahtari, deger, kirli);
  useKirliKoruma(kirli);

  const kaydet = async (zorla = false) => {
    const eksik = eksikAlanlar(tanim, deger);
    if (eksik.length) {
      bildir(`Doldurulması gereken alan var. ${eksik.join(", ")}`, "hata");
      return;
    }
    setKaydediliyor(true);
    try {
      const sonuc = await yonetim<{ oge: Oge; guncelleme: string }>("oge-kaydet", {
        koleksiyon: tanim.ad,
        oge: deger,
        ...(zaman && !zorla ? { beklenen: zaman } : {}),
      });
      ogeKaydedildi(tanim.ad, sonuc.oge, sonuc.guncelleme, aktifKimlik ?? undefined);
      taslakSil(taslakAnahtari);
      setKayitli(sonuc.oge);
      setDeger(sonuc.oge);
      setZaman(sonuc.guncelleme);
      setCakisma(false);
      setTaslak(null);
      if (!aktifKimlik) {
        setAktifKimlik(sonuc.oge.kimlik);
        history.replaceState(null, "", `#/icerik/${tanim.ad}/${sonuc.oge.kimlik}`);
      }
      bildir(sonuc.oge.yayinda === false ? "Kaydedildi. Gizli olduğu için sitede görünmüyor." : "Kaydedildi, sitede görünüyor");
    } catch (h) {
      if (h instanceof ApiHatasi && h.kod === 409) setCakisma(true);
      hataBildir(h);
    } finally {
      setKaydediliyor(false);
    }
  };

  useKaydetKisayolu(() => !kaydediliyor && kaydet());

  const sil = async () => {
    const tamam = await onayla({
      baslik: `${tanim.tekil} silinsin mi?`,
      metin: "Kayıt çöp kutusuna taşınır, Yedekler sayfasından geri alabilirsin.",
      dugme: "Çöp kutusuna taşı",
      tehlike: true,
    });
    if (!tamam || !aktifKimlik) return;
    try {
      await yonetim("oge-sil", { koleksiyon: tanim.ad, kimlik: aktifKimlik });
      taslakSil(taslakAnahtari);
      kirliAyarla(false);
      ogeSilindi(tanim.ad, aktifKimlik);
      bildir("Çöp kutusuna taşındı");
      git(`/icerik/${tanim.ad}`);
    } catch (h) {
      hataBildir(h);
    }
  };

  if (!yeni && !mevcut && aktifKimlik === kimlik) {
    return (
      <BosDurum
        baslik="Bu kayıt bulunamadı"
        metin="Silinmiş olabilir. Yedekler sayfasındaki çöp kutusuna bak."
        eylem={
          <a href={`#/icerik/${tanim.ad}`} className="text-sm font-medium text-vurgu hover:underline">
            {tanim.baslik} listesine dön
          </a>
        }
      />
    );
  }

  const oz = tanim.ozet(deger);
  const adres = tanim.adres?.(kayitli);
  const seo = tanim.ad === "yazilar" || tanim.ad === "hizmetler" || tanim.ad === "projeler";
  const googleBaslik =
    String(deger.seoBaslik || "") || (tanim.ad === "projeler" ? [deger.ad, deger.alan && `${deger.alan} projesi`].filter(Boolean).join(", ") : String(deger.baslik || ""));
  const googleAciklama = String(deger.seoAciklama || "") || String((tanim.ad === "projeler" ? deger.ozet : deger.aciklama) || "");

  return (
    <div>
      <div className="sticky top-14 z-30 -mx-4 mb-6 border-b border-white/[0.06] bg-zemin/90 px-4 py-3 backdrop-blur sm:-mx-6 sm:px-6 lg:top-0 lg:-mx-10 lg:px-10">
        <div className="mx-auto flex max-w-[1180px] flex-wrap items-center justify-between gap-3">
          <div className="flex min-w-0 items-center gap-2">
            <a href={`#/icerik/${tanim.ad}`} aria-label={`${tanim.baslik} listesine dön`} className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-neutral-400 hover:bg-white/5 hover:text-white">
              <IconArrowLeft size={19} />
            </a>
            <div className="min-w-0">
              <p className="text-[12px] text-neutral-500">{tanim.baslik}</p>
              <p className="truncate text-[15px] font-semibold text-white">{yeni && !aktifKimlik && !oz.baslik ? `Yeni ${tanim.tekil.toLocaleLowerCase("tr")}` : oz.baslik}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className={`hidden text-[12.5px] md:inline ${kirli ? "text-amber-300/90" : "text-neutral-500"}`}>
              {kirli ? "Kaydedilmemiş değişiklik var" : zaman ? `Son kayıt ${onceGoster(zaman)}` : ""}
            </span>
            {adres && kayitli.yayinda !== false && (
              <a
                href={adres}
                target="_blank"
                rel="noopener"
                className="inline-flex h-10 items-center gap-2 rounded-lg border border-white/12 bg-white/[0.04] px-3.5 text-sm text-neutral-100 hover:border-white/25"
              >
                <IconExternalLink size={16} />
                <span className="hidden sm:inline">Sitede gör</span>
              </a>
            )}
            <Dugme
              tur="birincil"
              onClick={() => kaydet()}
              yukleniyor={kaydediliyor}
              disabled={!kirli && !!aktifKimlik}
              ikon={!kirli && aktifKimlik ? <IconCheck size={16} /> : undefined}
            >
              {!kirli && aktifKimlik ? "Kaydedildi" : deger.yayinda === false ? "Gizli olarak kaydet" : "Kaydet ve yayınla"}
            </Dugme>
          </div>
        </div>
      </div>

      {taslak && (
        <div className="mb-6 flex flex-col gap-3 rounded-xl border border-amber-400/25 bg-amber-400/[0.05] p-4 sm:flex-row sm:items-center sm:justify-between">
          <p className="flex items-start gap-2.5 text-sm text-amber-100">
            <IconFilePencil size={18} className="mt-px shrink-0" />
            Bu kayıt için kaydedilmemiş bir taslağın var, {onceGoster(new Date(taslak.zaman).toISOString())} yazılmış.
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
                taslakSil(taslakAnahtari);
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
            Bu kayıt sen düzenlerken başka bir sekmede ya da cihazda değişti. Yazdıkların bu tarayıcıda taslak olarak duruyor.
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            <Dugme
              kucuk
              onClick={async () => {
                await yenile();
                setCakisma(false);
                bildir("Sayfayı yeniden açınca sunucudaki son hal gelir, taslağın da önerilir.");
                git(`/icerik/${tanim.ad}`);
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

      <div className="grid gap-6">
        <section className={`${KART} flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between`}>
          <Anahtar
            acik={deger.yayinda !== false}
            degistir={(v) => setDeger({ ...deger, yayinda: v })}
            etiket="Sitede yayında"
            aciklama={
              deger.yayinda === false
                ? "Kapalı. Ziyaretçiler bu kaydı görmüyor, panelde saklanıyor. Hazır olunca açıp kaydet."
                : "Açık. Kaydettiğin anda ziyaretçiler görür."
            }
          />
          <p className="max-w-md text-[13px] leading-relaxed text-neutral-500 sm:text-right">{tanim.aciklama}</p>
        </section>

        <section className={`${KART} p-5 sm:p-6`}>
          <FormAlanlari alanlar={tanim.alanlar} deger={deger} degistir={(v) => setDeger(v as Oge)} />
        </section>

        {seo && (
          <GoogleOnizleme baslik={googleBaslik} aciklama={googleAciklama} adres={tanim.adres?.(deger) ?? `/${tanim.ad === "yazilar" ? "blog" : tanim.ad === "projeler" ? "isler" : "hizmetler"}/`} />
        )}

        {aktifKimlik && (
          <div className="flex justify-end">
            <Dugme tur="tehlike" ikon={<IconTrash size={16} />} onClick={sil}>
              Bu {tanim.tekil.toLocaleLowerCase("tr")} kaydını sil
            </Dugme>
          </div>
        )}
      </div>
    </div>
  );
}

