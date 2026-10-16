/*
 * Tanımdan form üreten çizici. Her koleksiyon ve ayar ekranı alanlarını
 * sema.tsx içinde tarif eder; burada hepsi aynı bileşenlerle çizilir.
 */
import { createContext, useContext, useId, useMemo, useRef, useState, type ComponentType, type ReactNode } from "react";
import {
  IconArrowDown,
  IconArrowLeft,
  IconArrowRight,
  IconArrowUp,
  IconBold,
  IconChevronDown,
  IconH2,
  IconH3,
  IconLink,
  IconList,
  IconListNumbers,
  IconNote,
  IconPhoto,
  IconPlus,
  IconTable,
  IconTrash,
  IconX,
} from "@tabler/icons-react";
import Icerik from "../bilesenler/Icerik";
import { bloklaraAyir, okumaSuresi } from "../lib/metin";
import type { Icerik as IcerikTipi } from "../veri/tipler";
import { MedyaSecici } from "./MedyaKutuphanesi";
import { GorselKirpici, oranUyuyor } from "./GorselKirpici";
import { Alan, Anahtar, Dugme, GIRDI, SimgeDugme } from "./ortak";

/* ---------------- Tanımlar ---------------- */

export type Secenek = { deger: string; ad: string };
type SecenekKaynagi = Secenek[] | ((icerik: IcerikTipi) => Secenek[]);

type Ortak = { ad: string; etiket: string; ipucu?: string; zorunlu?: boolean; genis?: boolean };

export type AlanTanimi =
  | (Ortak & { tur: "metin"; sinir?: number; yerTutucu?: string; onEk?: string })
  | (Ortak & { tur: "uzun"; sinir?: number; satir?: number; yerTutucu?: string })
  | (Ortak & { tur: "makale" })
  | (Ortak & { tur: "liste"; ogeAdi: string; yerTutucu?: string })
  | (Ortak & { tur: "nesneler"; ogeAdi: string; baslikAlani: string; alanlar: AlanTanimi[] })
  | (Ortak & { tur: "nesne"; alanlar: AlanTanimi[] })
  /** oran: sitede gösterildiği en boy oranı; verilirse seçilen görsel bu oranda kırpılır. */
  | (Ortak & { tur: "gorsel"; oran?: number })
  | (Ortak & { tur: "gorseller"; oran?: number })
  | (Ortak & { tur: "secim"; secenekler: SecenekKaynagi; bos?: string })
  | (Ortak & { tur: "coklu"; secenekler: SecenekKaynagi; ogeAdi: string })
  | (Ortak & { tur: "anahtar"; aciklama?: string })
  | (Ortak & { tur: "renk" })
  | (Ortak & { tur: "tarih" })
  | (Ortak & { tur: "ikon"; ikonlar: Record<string, ComponentType<{ size?: number; stroke?: number }>> });

type Nesne = Record<string, unknown>;

/** Formun ihtiyaç duyduğu çevre: seçenekler için içerik, medya seçici için sitedeki görseller. */
export const FormBaglam = createContext<{ icerik: IcerikTipi | null; siteGorselleri: string[] }>({ icerik: null, siteGorselleri: [] });

const GENIS_TURLER = new Set(["uzun", "makale", "liste", "nesneler", "nesne", "gorseller", "coklu"]);

/* ---------------- Çizici ---------------- */

export function FormAlanlari({ alanlar, deger, degistir }: { alanlar: AlanTanimi[]; deger: Nesne; degistir: (yeni: Nesne) => void }) {
  return (
    <div className="grid gap-x-5 gap-y-6 md:grid-cols-2">
      {alanlar.map((alan) => (
        <div key={alan.ad} className={alan.genis || GENIS_TURLER.has(alan.tur) ? "md:col-span-2" : ""}>
          <TekAlan alan={alan} deger={deger[alan.ad]} degistir={(v) => degistir({ ...deger, [alan.ad]: v })} />
        </div>
      ))}
    </div>
  );
}

function TekAlan({ alan, deger, degistir }: { alan: AlanTanimi; deger: unknown; degistir: (v: unknown) => void }) {
  const id = useId();
  const { icerik } = useContext(FormBaglam);
  const metin = typeof deger === "string" ? deger : deger == null ? "" : String(deger);

  switch (alan.tur) {
    case "metin":
      return (
        <Alan etiket={alan.etiket} ipucu={alan.ipucu} zorunlu={alan.zorunlu} htmlFor={id} sayac={alan.sinir ? { deger: metin.length, sinir: alan.sinir } : undefined}>
          <div className="flex">
            {alan.onEk && (
              <span className="flex items-center rounded-l-lg border border-r-0 border-white/10 bg-white/[0.05] px-3 text-sm text-neutral-400">{alan.onEk}</span>
            )}
            <input
              id={id}
              className={`${GIRDI} ${alan.onEk ? "rounded-l-none" : ""}`}
              value={metin}
              placeholder={alan.yerTutucu}
              onChange={(e) => degistir(e.target.value)}
            />
          </div>
        </Alan>
      );

    case "uzun":
      return (
        <Alan etiket={alan.etiket} ipucu={alan.ipucu} zorunlu={alan.zorunlu} htmlFor={id} sayac={alan.sinir ? { deger: metin.length, sinir: alan.sinir } : undefined}>
          <textarea
            id={id}
            className={`${GIRDI} resize-y leading-relaxed`}
            rows={alan.satir ?? 3}
            value={metin}
            placeholder={alan.yerTutucu}
            onChange={(e) => degistir(e.target.value)}
          />
        </Alan>
      );

    case "makale":
      return <MakaleAlani etiket={alan.etiket} ipucu={alan.ipucu} deger={metin} degistir={degistir} />;

    case "liste":
      return <ListeAlani alan={alan} deger={Array.isArray(deger) ? (deger as string[]) : []} degistir={degistir} />;

    case "nesneler":
      return <NesnelerAlani alan={alan} deger={Array.isArray(deger) ? (deger as Nesne[]) : []} degistir={degistir} />;

    case "nesne":
      return (
        <fieldset className="rounded-xl border border-white/[0.07] p-4 sm:p-5">
          <legend className="px-2 text-[13px] font-medium text-neutral-200">{alan.etiket}</legend>
          {alan.ipucu && <p className="-mt-1 mb-4 text-[12.5px] text-neutral-500">{alan.ipucu}</p>}
          <FormAlanlari alanlar={alan.alanlar} deger={(deger as Nesne) ?? {}} degistir={degistir} />
        </fieldset>
      );

    case "gorsel":
      return <GorselAlani etiket={alan.etiket} ipucu={alan.ipucu} oran={alan.oran} deger={metin} degistir={degistir} />;

    case "gorseller":
      return <GorsellerAlani etiket={alan.etiket} ipucu={alan.ipucu} oran={alan.oran} deger={Array.isArray(deger) ? (deger as string[]) : []} degistir={degistir} />;

    case "secim": {
      const secenekler = typeof alan.secenekler === "function" ? (icerik ? alan.secenekler(icerik) : []) : alan.secenekler;
      const listede = secenekler.some((s) => s.deger === metin);
      return (
        <Alan etiket={alan.etiket} ipucu={alan.ipucu} zorunlu={alan.zorunlu} htmlFor={id}>
          <div className="relative">
            <select id={id} className={`${GIRDI} appearance-none pr-10`} value={metin} onChange={(e) => degistir(e.target.value || undefined)}>
              {alan.bos !== undefined && <option value="">{alan.bos}</option>}
              {!listede && metin && <option value={metin}>{metin}</option>}
              {secenekler.map((s) => (
                <option key={s.deger} value={s.deger}>
                  {s.ad}
                </option>
              ))}
            </select>
            <IconChevronDown size={16} className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-neutral-500" />
          </div>
        </Alan>
      );
    }

    case "coklu": {
      const secenekler = typeof alan.secenekler === "function" ? (icerik ? alan.secenekler(icerik) : []) : alan.secenekler;
      return <CokluSecim alan={alan} secenekler={secenekler} deger={Array.isArray(deger) ? (deger as string[]) : []} degistir={degistir} />;
    }

    case "anahtar":
      return <Anahtar acik={!!deger} degistir={degistir} etiket={alan.etiket} aciklama={alan.aciklama ?? alan.ipucu} />;

    case "renk":
      return (
        <Alan etiket={alan.etiket} ipucu={alan.ipucu} htmlFor={id}>
          <div className="flex gap-2">
            <input
              type="color"
              aria-label={`${alan.etiket} seçici`}
              value={/^#[0-9a-f]{6}$/i.test(metin) ? metin : "#e2462d"}
              onChange={(e) => degistir(e.target.value)}
              className="h-[46px] w-14 shrink-0 cursor-pointer rounded-lg border border-white/10 bg-transparent p-1"
            />
            <input id={id} className={GIRDI} value={metin} onChange={(e) => degistir(e.target.value)} placeholder="#e2462d" />
          </div>
        </Alan>
      );

    case "tarih":
      return (
        <Alan etiket={alan.etiket} ipucu={alan.ipucu} zorunlu={alan.zorunlu} htmlFor={id}>
          <input id={id} type="date" className={`${GIRDI} [color-scheme:dark]`} value={metin} onChange={(e) => degistir(e.target.value || undefined)} />
        </Alan>
      );

    case "ikon":
      return (
        <Alan etiket={alan.etiket} ipucu={alan.ipucu}>
          <div className="flex flex-wrap gap-2">
            {Object.entries(alan.ikonlar).map(([ad, Ikon]) => (
              <button
                key={ad}
                type="button"
                aria-label={ad}
                aria-pressed={metin === ad}
                onClick={() => degistir(ad)}
                className={`flex h-12 w-12 items-center justify-center rounded-xl border transition-colors ${
                  metin === ad ? "border-vurgu bg-vurgu/10 text-vurgu" : "border-white/10 text-neutral-400 hover:border-white/25 hover:text-white"
                }`}
              >
                <Ikon size={22} stroke={1.8} />
              </button>
            ))}
          </div>
        </Alan>
      );
  }
}

/* ---------------- Liste ---------------- */

function tasi<T>(dizi: T[], i: number, yon: -1 | 1) {
  const j = i + yon;
  if (j < 0 || j >= dizi.length) return dizi;
  const yeni = [...dizi];
  [yeni[i], yeni[j]] = [yeni[j], yeni[i]];
  return yeni;
}

function SiraDugmeleri({ i, toplam, tasi: t, sil, yatay }: { i: number; toplam: number; tasi: (yon: -1 | 1) => void; sil: () => void; yatay?: boolean }) {
  return (
    <div className="flex shrink-0 items-center">
      <SimgeDugme ad="Yukarı taşı" disabled={i === 0} onClick={() => t(-1)}>
        {yatay ? <IconArrowLeft size={15} /> : <IconArrowUp size={15} />}
      </SimgeDugme>
      <SimgeDugme ad="Aşağı taşı" disabled={i === toplam - 1} onClick={() => t(1)}>
        {yatay ? <IconArrowRight size={15} /> : <IconArrowDown size={15} />}
      </SimgeDugme>
      <SimgeDugme ad="Kaldır" onClick={sil} className="hover:text-red-300">
        <IconTrash size={15} />
      </SimgeDugme>
    </div>
  );
}

function ListeAlani({ alan, deger, degistir }: { alan: Extract<AlanTanimi, { tur: "liste" }>; deger: string[]; degistir: (v: string[]) => void }) {
  const son = useRef<HTMLInputElement>(null);
  return (
    <Alan etiket={alan.etiket} ipucu={alan.ipucu}>
      <div className="space-y-2">
        {deger.map((m, i) => (
          <div key={i} className="flex items-center gap-1.5">
            <input
              ref={i === deger.length - 1 ? son : undefined}
              className={GIRDI}
              value={m}
              placeholder={alan.yerTutucu}
              aria-label={`${alan.ogeAdi} ${i + 1}`}
              onChange={(e) => degistir(deger.map((x, j) => (j === i ? e.target.value : x)))}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  degistir([...deger.slice(0, i + 1), "", ...deger.slice(i + 1)]);
                  window.setTimeout(() => (e.currentTarget.parentElement?.nextElementSibling?.querySelector("input") as HTMLInputElement | null)?.focus(), 0);
                }
              }}
            />
            <SiraDugmeleri i={i} toplam={deger.length} tasi={(y) => degistir(tasi(deger, i, y))} sil={() => degistir(deger.filter((_, j) => j !== i))} />
          </div>
        ))}
        <Dugme
          kucuk
          tur="sade"
          ikon={<IconPlus size={15} />}
          onClick={() => {
            degistir([...deger, ""]);
            window.setTimeout(() => son.current?.focus(), 0);
          }}
        >
          {alan.ogeAdi} ekle
        </Dugme>
      </div>
    </Alan>
  );
}

function NesnelerAlani({ alan, deger, degistir }: { alan: Extract<AlanTanimi, { tur: "nesneler" }>; deger: Nesne[]; degistir: (v: Nesne[]) => void }) {
  const [acik, setAcik] = useState<number | null>(null);
  return (
    <Alan etiket={alan.etiket} ipucu={alan.ipucu}>
      <div className="space-y-2">
        {deger.map((o, i) => {
          const baslik = String(o[alan.baslikAlani] ?? "").trim();
          return (
            <div key={i} className="rounded-xl border border-white/[0.08] bg-white/[0.015]">
              <div className="flex items-center gap-2 py-1.5 pl-4 pr-1.5">
                <button type="button" onClick={() => setAcik(acik === i ? null : i)} className="flex min-w-0 flex-1 items-center gap-2 py-1.5 text-left">
                  <IconChevronDown size={16} className={`shrink-0 text-neutral-500 transition-transform ${acik === i ? "" : "-rotate-90"}`} />
                  <span className={`truncate text-sm ${baslik ? "text-neutral-100" : "text-neutral-500"}`}>{baslik || `Yeni ${alan.ogeAdi.toLocaleLowerCase("tr")}`}</span>
                </button>
                <SiraDugmeleri
                  i={i}
                  toplam={deger.length}
                  tasi={(y) => {
                    degistir(tasi(deger, i, y));
                    setAcik(null);
                  }}
                  sil={() => {
                    degistir(deger.filter((_, j) => j !== i));
                    setAcik(null);
                  }}
                />
              </div>
              {acik === i && (
                <div className="border-t border-white/[0.06] p-4">
                  <FormAlanlari alanlar={alan.alanlar} deger={o} degistir={(yeni) => degistir(deger.map((x, j) => (j === i ? yeni : x)))} />
                </div>
              )}
            </div>
          );
        })}
        <Dugme
          kucuk
          tur="sade"
          ikon={<IconPlus size={15} />}
          onClick={() => {
            degistir([...deger, {}]);
            setAcik(deger.length);
          }}
        >
          {alan.ogeAdi} ekle
        </Dugme>
      </div>
    </Alan>
  );
}

function CokluSecim({
  alan,
  secenekler,
  deger,
  degistir,
}: {
  alan: Extract<AlanTanimi, { tur: "coklu" }>;
  secenekler: Secenek[];
  deger: string[];
  degistir: (v: string[]) => void;
}) {
  const [arama, setArama] = useState("");
  const ad = (d: string) => secenekler.find((s) => s.deger === d)?.ad ?? d;
  const kalan = secenekler.filter((s) => !deger.includes(s.deger) && s.ad.toLocaleLowerCase("tr").includes(arama.toLocaleLowerCase("tr")));
  return (
    <Alan etiket={alan.etiket} ipucu={alan.ipucu}>
      <div className="rounded-xl border border-white/[0.08]">
        {deger.length > 0 ? (
          <ul className="divide-y divide-white/[0.05]">
            {deger.map((d, i) => (
              <li key={d} className="flex items-center gap-2 py-1 pl-4 pr-1.5">
                <span className="w-6 text-[12px] tabular-nums text-neutral-500">{i + 1}</span>
                <span className="min-w-0 flex-1 truncate text-sm text-neutral-100">{ad(d)}</span>
                <SiraDugmeleri i={i} toplam={deger.length} tasi={(y) => degistir(tasi(deger, i, y))} sil={() => degistir(deger.filter((x) => x !== d))} />
              </li>
            ))}
          </ul>
        ) : (
          <p className="px-4 py-3 text-sm text-neutral-500">Henüz seçilmedi.</p>
        )}
        <div className="border-t border-white/[0.06] p-3">
          <input className={GIRDI} value={arama} onChange={(e) => setArama(e.target.value)} placeholder={`${alan.ogeAdi} ara ve ekle`} aria-label={`${alan.ogeAdi} ara`} />
          {kalan.length > 0 && (
            <div className="mt-2 flex max-h-44 flex-wrap gap-1.5 overflow-y-auto">
              {kalan.slice(0, 60).map((s) => (
                <button
                  key={s.deger}
                  type="button"
                  onClick={() => degistir([...deger, s.deger])}
                  className="inline-flex items-center gap-1 rounded-md border border-white/10 px-2.5 py-1 text-[13px] text-neutral-300 transition-colors hover:border-vurgu/60 hover:text-white"
                >
                  <IconPlus size={13} aria-hidden="true" />
                  {s.ad}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </Alan>
  );
}

/* ---------------- Görsel ---------------- */

/** Görsel sitedeki oranı tutmuyorsa kırpıcıya gönderir, tutuyorsa olduğu gibi kullanır. */
function useOranKontrolu(oran: number | undefined) {
  const [kirpilacak, setKirpilacak] = useState<{ src: string; bitti: (adres: string) => void; iptal?: () => void } | null>(null);
  const kontrolEt = async (src: string, bitti: (adres: string) => void, iptal?: () => void) => {
    if (!oran || (await oranUyuyor(src, oran))) bitti(src);
    else setKirpilacak({ src, bitti, iptal });
  };
  const kirpici = oran ? (
    <GorselKirpici
      src={kirpilacak?.src ?? null}
      oran={oran}
      kapat={() => {
        kirpilacak?.iptal?.();
        setKirpilacak(null);
      }}
      tamam={(adres) => kirpilacak?.bitti(adres)}
    />
  ) : null;
  return { kontrolEt, kirp: (src: string, bitti: (adres: string) => void) => setKirpilacak({ src, bitti }), kirpici };
}

function GorselAlani({ etiket, ipucu, oran, deger, degistir }: { etiket: string; ipucu?: string; oran?: number; deger: string; degistir: (v: string) => void }) {
  const [acik, setAcik] = useState(false);
  const { siteGorselleri } = useContext(FormBaglam);
  const { kontrolEt, kirp, kirpici } = useOranKontrolu(oran);
  const id = useId();
  return (
    <Alan etiket={etiket} ipucu={ipucu} htmlFor={id}>
      <div className="flex gap-3">
        <button
          type="button"
          onClick={() => setAcik(true)}
          className="flex w-32 shrink-0 items-center justify-center overflow-hidden rounded-lg border border-white/10 bg-white/[0.03] text-neutral-500 transition-colors hover:border-white/25"
          style={{ aspectRatio: String(oran ?? 4 / 3) }}
          aria-label="Görsel seç"
        >
          {deger ? <img src={deger} alt="" className="h-full w-full object-cover" /> : <IconPhoto size={24} />}
        </button>
        <div className="flex min-w-0 flex-1 flex-col gap-2">
          <input id={id} className={GIRDI} value={deger} onChange={(e) => degistir(e.target.value)} placeholder="Görsel adresi" />
          <div className="flex flex-wrap gap-2">
            <Dugme kucuk onClick={() => setAcik(true)}>
              Kütüphaneden seç
            </Dugme>
            {deger && oran && (
              <Dugme kucuk onClick={() => kirp(deger, degistir)}>
                Kırp
              </Dugme>
            )}
            {deger && (
              <Dugme kucuk tur="sade" onClick={() => degistir("")}>
                Kaldır
              </Dugme>
            )}
          </div>
        </div>
      </div>
      <MedyaSecici acik={acik} kapat={() => setAcik(false)} sec={(a) => void kontrolEt(a[0], degistir)} siteGorselleri={siteGorselleri} />
      {kirpici}
    </Alan>
  );
}

function GorsellerAlani({ etiket, ipucu, oran, deger, degistir }: { etiket: string; ipucu?: string; oran?: number; deger: string[]; degistir: (v: string[]) => void }) {
  const [acik, setAcik] = useState(false);
  const { siteGorselleri } = useContext(FormBaglam);
  const { kontrolEt, kirp, kirpici } = useOranKontrolu(oran);
  // Kırpma penceresi tek tek açıldığı için güncel liste ref'te tutulur.
  const guncel = useRef(deger);
  guncel.current = deger;
  const ekle = async (adresler: string[]) => {
    for (const a of adresler.filter((x) => !guncel.current.includes(x))) {
      // Vazgeçilirse o görsel eklenmez, sıradakine geçilir.
      await new Promise<void>((bitti) =>
        void kontrolEt(
          a,
          (son) => {
            guncel.current = [...guncel.current, son];
            degistir(guncel.current);
            bitti();
          },
          bitti,
        ),
      );
    }
  };
  const oranStili = { aspectRatio: String(oran ?? 4 / 3) };
  return (
    <Alan etiket={etiket} ipucu={ipucu}>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
        {deger.map((g, i) => (
          <div key={`${g}-${i}`} className="rounded-lg border border-white/[0.08] bg-white/[0.02] p-1.5">
            <img src={g} alt="" className="w-full rounded-md object-cover" style={oranStili} />
            <div className="mt-1 flex items-center justify-between">
              <span className="pl-1 text-[12px] tabular-nums text-neutral-500">{i + 1}</span>
              <span className="flex items-center gap-1">
                {oran && (
                  <button
                    type="button"
                    onClick={() => kirp(g, (yeni) => degistir(guncel.current.map((x, j) => (j === i ? yeni : x))))}
                    className="rounded px-1.5 py-0.5 text-[11px] text-neutral-400 hover:bg-white/[0.06] hover:text-white"
                  >
                    Kırp
                  </button>
                )}
                <SiraDugmeleri yatay i={i} toplam={deger.length} tasi={(y) => degistir(tasi(deger, i, y))} sil={() => degistir(deger.filter((_, j) => j !== i))} />
              </span>
            </div>
          </div>
        ))}
        <button
          type="button"
          onClick={() => setAcik(true)}
          className="flex flex-col items-center justify-center gap-1.5 rounded-lg border border-dashed border-white/12 text-sm text-neutral-400 transition-colors hover:border-vurgu/60 hover:text-white"
          style={oranStili}
        >
          <IconPlus size={20} />
          Görsel ekle
        </button>
      </div>
      <MedyaSecici acik={acik} kapat={() => setAcik(false)} coklu sec={(a) => void ekle(a)} siteGorselleri={siteGorselleri} />
      {kirpici}
    </Alan>
  );
}

/* ---------------- Makale düzenleyici ---------------- */

type Arac = { ad: string; ikon: ReactNode; uygula: (secili: string) => { metin: string; satirBasi?: boolean } };

const ARACLAR: Arac[] = [
  { ad: "Ara başlık", ikon: <IconH2 size={17} />, uygula: (s) => ({ metin: `## ${s || "Ara başlık"}`, satirBasi: true }) },
  { ad: "Küçük başlık", ikon: <IconH3 size={17} />, uygula: (s) => ({ metin: `### ${s || "Küçük başlık"}`, satirBasi: true }) },
  { ad: "Kalın", ikon: <IconBold size={17} />, uygula: (s) => ({ metin: `**${s || "kalın metin"}**` }) },
  {
    ad: "Bağlantı",
    ikon: <IconLink size={17} />,
    uygula: (s) => {
      const adres = window.prompt("Bağlantı adresi", "https://") || "https://";
      return { metin: `[${s || "bağlantı metni"}](${adres})` };
    },
  },
  {
    ad: "Madde listesi",
    ikon: <IconList size={17} />,
    uygula: (s) => ({ metin: (s || "Madde").split("\n").map((x) => `- ${x}`).join("\n"), satirBasi: true }),
  },
  {
    ad: "Numaralı liste",
    ikon: <IconListNumbers size={17} />,
    uygula: (s) => ({ metin: (s || "Madde").split("\n").map((x, i) => `${i + 1}. ${x}`).join("\n"), satirBasi: true }),
  },
  { ad: "Not kutusu", ikon: <IconNote size={17} />, uygula: (s) => ({ metin: `> ${s || "Öne çıkarmak istediğin not"}`, satirBasi: true }) },
  {
    ad: "Tablo",
    ikon: <IconTable size={17} />,
    uygula: () => ({ metin: "| Başlık | Başlık |\n|---|---|\n| Hücre | Hücre |\n| Hücre | Hücre |", satirBasi: true }),
  },
];

function MakaleAlani({ etiket, ipucu, deger, degistir }: { etiket: string; ipucu?: string; deger: string; degistir: (v: string) => void }) {
  const alan = useRef<HTMLTextAreaElement>(null);
  const [gorunum, setGorunum] = useState<"yaz" | "ikisi" | "onizle">("ikisi");
  const bloklar = useMemo(() => bloklaraAyir(deger || ""), [deger]);
  const kelime = useMemo(() => (deger.match(/\S+/g) ?? []).length, [deger]);
  const [yardim, setYardim] = useState(false);

  const uygula = (arac: Arac) => {
    const t = alan.current;
    if (!t) return;
    const bas = t.selectionStart;
    const son = t.selectionEnd;
    const sonuc = arac.uygula(deger.slice(bas, son));
    let ek = sonuc.metin;
    if (sonuc.satirBasi) {
      const once = deger.slice(0, bas);
      if (once && !once.endsWith("\n\n")) ek = (once.endsWith("\n") ? "\n" : "\n\n") + ek;
      const sonra = deger.slice(son);
      if (sonra && !sonra.startsWith("\n\n")) ek += sonra.startsWith("\n") ? "\n" : "\n\n";
    }
    const yeni = deger.slice(0, bas) + ek + deger.slice(son);
    degistir(yeni);
    window.setTimeout(() => {
      t.focus();
      t.setSelectionRange(bas + ek.length, bas + ek.length);
    }, 0);
  };

  return (
    <div>
      <div className="mb-1.5 flex flex-wrap items-baseline justify-between gap-3">
        <span className="text-[13px] font-medium text-neutral-200">{etiket}</span>
        <span className="text-[12px] tabular-nums text-neutral-500">
          {kelime} kelime, yaklaşık {okumaSuresi(deger || "")} dakikalık okuma
        </span>
      </div>
      <div className="overflow-hidden rounded-xl border border-white/10">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-white/[0.08] bg-white/[0.03] px-2 py-1.5">
          <div className="flex flex-wrap items-center">
            {ARACLAR.map((a) => (
              <SimgeDugme key={a.ad} ad={a.ad} onClick={() => uygula(a)} disabled={gorunum === "onizle"}>
                {a.ikon}
              </SimgeDugme>
            ))}
            <button type="button" onClick={() => setYardim(!yardim)} className="ml-1 px-2 text-[12.5px] text-neutral-400 underline-offset-4 hover:text-white hover:underline">
              Nasıl yazılır?
            </button>
          </div>
          <div className="flex rounded-lg border border-white/10 p-0.5 text-[12.5px]">
            {(
              [
                ["yaz", "Yaz"],
                ["ikisi", "Yan yana"],
                ["onizle", "Önizle"],
              ] as const
            ).map(([k, ad]) => (
              <button
                key={k}
                type="button"
                onClick={() => setGorunum(k)}
                className={`rounded-md px-2.5 py-1 transition-colors ${gorunum === k ? "bg-white/10 text-white" : "text-neutral-400 hover:text-white"} ${
                  k === "ikisi" ? "hidden lg:block" : ""
                }`}
              >
                {ad}
              </button>
            ))}
          </div>
        </div>
        {yardim && (
          <div className="relative border-b border-white/[0.08] bg-vurgu/[0.04] px-4 py-3 text-[13px] leading-relaxed text-neutral-300">
            <SimgeDugme ad="Kapat" onClick={() => setYardim(false)} className="absolute right-2 top-2">
              <IconX size={15} />
            </SimgeDugme>
            Paragraflar arasında bir boş satır bırak. Satır başına iki kare işareti ara başlık, üç kare işareti küçük başlık yapar. Satırı tire ve boşlukla başlatırsan
            madde, sayı ve noktayla başlatırsan numaralı madde olur. İki yıldız arasındaki yazı kalın görünür. Üstteki düğmeler bunları senin yerine ekler. Ara
            başlıklar yazının içindekiler listesine otomatik girer.
          </div>
        )}
        <div className={`grid ${gorunum === "ikisi" ? "lg:grid-cols-2" : ""}`}>
          {gorunum !== "onizle" && (
            <textarea
              ref={alan}
              aria-label={etiket}
              value={deger}
              onChange={(e) => degistir(e.target.value)}
              spellCheck
              className={`min-h-[520px] w-full resize-y bg-transparent px-4 py-4 font-mono text-[14.5px] leading-[1.75] text-neutral-100 outline-none ${
                gorunum === "ikisi" ? "lg:border-r lg:border-white/[0.08]" : ""
              }`}
            />
          )}
          {gorunum !== "yaz" && (
            <div className={`max-h-[760px] overflow-y-auto px-5 py-5 ${gorunum === "ikisi" ? "hidden lg:block" : ""}`}>
              {bloklar.length ? <Icerik bloklar={bloklar} /> : <p className="text-sm text-neutral-500">Yazdıkça önizleme burada görünür.</p>}
            </div>
          )}
        </div>
      </div>
      {ipucu && <p className="mt-1.5 text-[12.5px] text-neutral-500">{ipucu}</p>}
    </div>
  );
}
