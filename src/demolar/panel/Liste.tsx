/*
 * Liste ekranı: sayı şeridi, arama, süzgeçler, sıralanabilir tablo ve kayıt
 * çekmecesi. Panel genişliği daralınca sütunlar önceliğe göre gizlenir, en dar
 * halde tablo karta döner; hiçbir sütun yarıdan kesilmez.
 */
import { useEffect, useMemo, useState, type FormEvent, type ReactNode } from "react";
import { AnimatePresence, motion } from "motion/react";
import { IconArrowDown, IconArrowUp, IconDownload, IconPlus, IconSearch, IconX } from "@tabler/icons-react";
import { Bos, Dugme, DurumYazi, Harf, SayiSeridi, isimRengi } from "./parcalar";
import { bas } from "../ortak";
import { EGRI } from "../../bilesenler/Hareket";
import type { Form, FormAlani, Kayit, Liste, ModulBilgi, PanelApi } from "../tipler";

const SAYFA = 30;

const ONCELIK = { 1: "", 2: "hidden @3xl:table-cell", 3: "hidden @5xl:table-cell" } as const;

export function EkranBasligi({ modul, children }: { modul: ModulBilgi; children?: ReactNode }) {
  return (
    <div className="mb-5 flex flex-col gap-3 @2xl:flex-row @2xl:items-end @2xl:justify-between">
      <div className="min-w-0">
        <h2 className="text-[20px] font-bold tracking-tight text-[var(--m)]">{modul.ad}</h2>
        <p className="mt-1 max-w-2xl text-[13px] leading-6 text-[var(--ms)]">{modul.ozet}</p>
      </div>
      {children && <div className="flex shrink-0 flex-wrap gap-2">{children}</div>}
    </div>
  );
}

function filtreBaslangic(tanim: Liste, metin?: string) {
  const durum: Record<string, number> = {};
  if (!metin) return durum;
  const [ad, secenek] = metin.split("=");
  const f = tanim.filtreler?.find((x) => x.ad === ad);
  const i = f?.secenekler.findIndex((s) => s.ad === secenek) ?? -1;
  if (f && i >= 0) durum[f.ad] = i;
  return durum;
}

function csvIndir(dosya: string, satirlar: (string | number)[][]) {
  const metin = satirlar.map((s) => s.map((h) => `"${String(h).replace(/"/g, '""')}"`).join(";")).join("\r\n");
  const blob = new Blob(["﻿" + metin], { type: "text/csv;charset=utf-8" });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = dosya;
  a.click();
  setTimeout(() => URL.revokeObjectURL(a.href), 1000);
}

export default function ListeEkrani({
  tanim,
  modul,
  api,
  kayitId,
  ac,
  filtre,
  yeniAc = 0,
}: {
  tanim: Liste;
  modul: ModulBilgi;
  api: PanelApi;
  kayitId: string | null;
  ac: (id: string | null) => void;
  filtre?: string;
  /** Üst çubuktaki Yeni menüsünden gelinince kayıt formu açılır; her istekte sayı artar. */
  yeniAc?: number;
}) {
  const [arama, setArama] = useState("");
  const [secimler, setSecimler] = useState<Record<string, number>>(() => filtreBaslangic(tanim, filtre));
  const [sira, setSira] = useState<{ i: number; artan: boolean } | null>(null);
  const [goster, setGoster] = useState(SAYFA);
  const [form, setForm] = useState(false);

  // Bildirimden ya da özet ekranından süzgeçle gelinince süzgeç yenilenir.
  useEffect(() => {
    if (filtre) setSecimler(filtreBaslangic(tanim, filtre));
  }, [filtre, tanim]);

  useEffect(() => {
    if (yeniAc) setForm(true);
  }, [yeniAc]);

  const tum = useMemo(() => {
    const t = api.veri[tanim.koleksiyon] ?? [];
    return tanim.kapsam ? t.filter((k) => tanim.kapsam!(k, api)) : t;
  }, [api, tanim]);
  const liste = useMemo(() => {
    const aranan = arama.trim().toLocaleLowerCase("tr");
    let l = tum.filter((k) => {
      for (const f of tanim.filtreler ?? []) {
        const i = secimler[f.ad];
        if (i !== undefined && i >= 0 && !f.secenekler[i].kosul(k, api)) return false;
      }
      return !aranan || `${tanim.baslik(k, api)} ${tanim.arama(k, api)}`.toLocaleLowerCase("tr").includes(aranan);
    });
    if (sira) {
      const s = tanim.sutunlar[sira.i];
      if (s.sirala) l = [...l].sort((a, b) => {
        const x = s.sirala!(a);
        const y = s.sirala!(b);
        const f = typeof x === "number" && typeof y === "number" ? x - y : String(x).localeCompare(String(y), "tr");
        return sira.artan ? f : -f;
      });
    } else if (tanim.sira) l = [...l].sort(tanim.sira);
    return l;
  }, [tum, arama, secimler, sira, tanim, api]);

  const secili = kayitId ? tum.find((k) => k.id === kayitId) ?? null : null;

  const disaAktar = () => {
    const basliklar = [tanim.baslikAdi, ...tanim.sutunlar.map((s) => s.ad), ...(tanim.durum ? ["Durum"] : [])];
    const satirlar = liste.map((k) => [
      tanim.baslik(k, api),
      ...tanim.sutunlar.map((s) => {
        if (s.csv) return s.csv(k, api);
        const d = s.deger(k, api);
        return typeof d === "string" || typeof d === "number" ? d : s.sirala ? s.sirala(k) : "";
      }),
      ...(tanim.durum ? [tanim.durum(k, api).ad] : []),
    ]);
    csvIndir(`${modul.ad}.csv`, [basliklar, ...satirlar]);
    api.haber(`${liste.length} kayıt Excel ile açılabilen dosyaya aktarıldı`, "basari");
    api.olay("disa-aktar");
  };

  const Ust = tanim.ust;

  return (
    <>
      <EkranBasligi modul={modul}>
        <Dugme ikon={IconDownload} onClick={disaAktar}>
          Dışa aktar
        </Dugme>
        {tanim.yeni && (
          <Dugme tur="ana" ikon={IconPlus} onClick={() => setForm(true)}>
            {tanim.yeni.dugme}
          </Dugme>
        )}
      </EkranBasligi>

      {tanim.ozet && (
        <div className="mb-4">
          <SayiSeridi sayilar={tanim.ozet(api)} />
        </div>
      )}

      {Ust && (
        <div className="mb-4">
          <Ust api={api} />
        </div>
      )}

      <div className="rounded-xl border border-[var(--k)] bg-[var(--kart)]">
        <div className="flex flex-col gap-2 border-b border-[var(--k)] p-3 @2xl:flex-row @2xl:items-center">
          <label className="relative flex min-w-0 flex-1 items-center">
            <IconSearch size={15} className="pointer-events-none absolute left-3 text-[var(--ms)]" />
            <span className="sr-only">Listede ara</span>
            <input
              value={arama}
              onChange={(e) => {
                setArama(e.target.value);
                setGoster(SAYFA);
              }}
              placeholder={`${modul.ad} içinde ara`}
              className="h-9 w-full rounded-lg border border-[var(--k)] bg-transparent pl-9 pr-8 text-[13px] text-[var(--m)] outline-none placeholder:text-[var(--ms)] focus:border-[var(--p)] focus-visible:outline-none"
            />
            {arama && (
              <button type="button" aria-label="Aramayı temizle" onClick={() => setArama("")} className="absolute right-2 text-[var(--ms)] hover:text-[var(--m)]">
                <IconX size={14} />
              </button>
            )}
          </label>
          <div className="flex flex-wrap gap-2">
            {tanim.filtreler?.map((f) => (
              <label key={f.ad} className="relative">
                <span className="sr-only">{f.ad}</span>
                <select
                  value={secimler[f.ad] ?? -1}
                  onChange={(e) => {
                    setSecimler((s) => ({ ...s, [f.ad]: Number(e.target.value) }));
                    setGoster(SAYFA);
                  }}
                  className={`h-9 cursor-pointer appearance-none rounded-lg border bg-transparent pl-3 pr-8 text-[12.5px] outline-none focus:border-[var(--p)] focus-visible:outline-none ${
                    (secimler[f.ad] ?? -1) >= 0 ? "border-[var(--p)] font-semibold text-[var(--m)]" : "border-[var(--k)] text-[var(--ms)]"
                  }`}
                >
                  <option value={-1}>{f.ad}, hepsi</option>
                  {f.secenekler.map((s, i) => (
                    <option key={s.ad} value={i}>
                      {s.ad}
                    </option>
                  ))}
                </select>
                <IconArrowDown size={13} className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-[var(--ms)]" />
              </label>
            ))}
          </div>
        </div>

        <p className="border-b border-[var(--k)] px-4 py-2 text-[11.5px] text-[var(--ms)]">
          {liste.length === tum.length ? `${tum.length} kayıt` : `${tum.length} kayıttan ${liste.length} tanesi gösteriliyor`}
          {(arama || Object.values(secimler).some((v) => v >= 0)) && (
            <button
              type="button"
              onClick={() => {
                setArama("");
                setSecimler({});
              }}
              className="ml-2 font-semibold text-[var(--p)] hover:underline"
            >
              Süzgeçleri temizle
            </button>
          )}
        </p>

        {liste.length === 0 ? (
          <Bos metin="Bu aramaya uyan kayıt yok. Süzgeçleri temizleyip yeniden deneyin." ikon={IconSearch} />
        ) : (
          <>
            {/* Dar panelde kart görünümü */}
            <ul className="divide-y divide-[var(--k)] @2xl:hidden">
              {liste.slice(0, goster).map((k) => (
                <li key={k.id}>
                  <button type="button" onClick={() => ac(k.id)} className="flex w-full flex-col gap-1.5 px-4 py-3 text-left transition-colors hover:bg-[var(--k2)]">
                    <span className="flex items-start justify-between gap-3">
                      {tanim.harf && <Harf metin={bas(tanim.harf(k, api))} renk={isimRengi(tanim.harf(k, api))} boy={34} yumusak />}
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-[13.5px] font-semibold text-[var(--m)]">{tanim.baslik(k, api)}</span>
                        {tanim.alt && <span className="block truncate text-[12px] text-[var(--ms)]">{tanim.alt(k, api)}</span>}
                      </span>
                      {tanim.durum && <DurumYazi d={tanim.durum(k, api)} kucuk />}
                    </span>
                    <span className="flex flex-wrap gap-x-4 gap-y-0.5 text-[12px]">
                      {tanim.sutunlar
                        .filter((s) => (s.oncelik ?? 1) === 1)
                        .slice(0, 3)
                        .map((s) => (
                          <span key={s.ad} className="text-[var(--m)]">
                            <span className="text-[var(--ms)]">{s.ad} </span>
                            {s.deger(k, api)}
                          </span>
                        ))}
                    </span>
                  </button>
                </li>
              ))}
            </ul>

            {/* Geniş panelde tablo */}
            <div className="hidden @2xl:block">
              <table className="w-full text-[13px]">
                <thead>
                  <tr className="border-b border-[var(--k)] text-[11.5px] text-[var(--ms)]">
                    <th className="px-4 py-2.5 text-left font-medium">{tanim.baslikAdi}</th>
                    {tanim.sutunlar.map((s, i) => (
                      <th key={s.ad} className={`px-3 py-2.5 font-medium ${s.hiza === "sag" ? "text-right" : "text-left"} ${ONCELIK[s.oncelik ?? 1]}`}>
                        {s.sirala ? (
                          <button
                            type="button"
                            onClick={() => setSira((o) => (o?.i === i ? (o.artan ? { i, artan: false } : null) : { i, artan: true }))}
                            className={`inline-flex items-center gap-1 hover:text-[var(--m)] ${sira?.i === i ? "text-[var(--m)]" : ""}`}
                          >
                            {s.ad}
                            {sira?.i === i && (sira.artan ? <IconArrowUp size={12} /> : <IconArrowDown size={12} />)}
                          </button>
                        ) : (
                          s.ad
                        )}
                      </th>
                    ))}
                    {tanim.durum && <th className="px-4 py-2.5 text-left font-medium">Durum</th>}
                  </tr>
                </thead>
                <tbody>
                  {liste.slice(0, goster).map((k) => (
                    <tr
                      key={k.id}
                      tabIndex={0}
                      onClick={() => ac(k.id)}
                      onKeyDown={(e) => e.key === "Enter" && ac(k.id)}
                      className={`cursor-pointer border-b border-[var(--k)] outline-none transition-colors last:border-0 hover:bg-[var(--k2)] focus-visible:bg-[var(--k2)] ${k.id === kayitId ? "bg-[var(--k2)]" : ""}`}
                    >
                      <td className="max-w-[20rem] px-4 py-2.5">
                        <span className="flex items-center gap-3">
                          {tanim.harf && <Harf metin={bas(tanim.harf(k, api))} renk={isimRengi(tanim.harf(k, api))} boy={32} yumusak />}
                          <span className="min-w-0">
                            <span className="block truncate font-semibold text-[var(--m)]">{tanim.baslik(k, api)}</span>
                            {tanim.alt && <span className="block truncate text-[11.5px] text-[var(--ms)]">{tanim.alt(k, api)}</span>}
                          </span>
                        </span>
                      </td>
                      {tanim.sutunlar.map((s) => (
                        <td key={s.ad} className={`px-3 py-2.5 text-[var(--m)] ${s.hiza === "sag" ? "text-right tabular-nums" : ""} ${ONCELIK[s.oncelik ?? 1]}`}>
                          {s.deger(k, api)}
                        </td>
                      ))}
                      {tanim.durum && (
                        <td className="px-4 py-2.5">
                          <DurumYazi d={tanim.durum(k, api)} />
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {liste.length > goster && (
              <div className="border-t border-[var(--k)] p-3 text-center">
                <Dugme tur="sade" onClick={() => setGoster((g) => g + SAYFA)}>
                  {Math.min(SAYFA, liste.length - goster)} kayıt daha göster
                </Dugme>
              </div>
            )}
          </>
        )}
      </div>

      <Cekmece acik={!!secili} kapat={() => ac(null)}>
        {secili && <Detay tanim={tanim} kayit={secili} api={api} kapat={() => ac(null)} />}
      </Cekmece>

      {tanim.yeni && (
        <FormPenceresi
          acik={form}
          form={tanim.yeni}
          api={api}
          kapat={() => setForm(false)}
          bitti={(id) => {
            setForm(false);
            ac(id);
          }}
        />
      )}
    </>
  );
}

/** Kabuğun içine sabitlenen sağ çekmece; panel tam ekran da olsa sayfaya gömülü de olsa kendi alanında kalır. */
export function Cekmece({ acik, kapat, children, genislik = 480 }: { acik: boolean; kapat: () => void; children: ReactNode; genislik?: number }) {
  useEffect(() => {
    if (!acik) return;
    const tus = (e: KeyboardEvent) => e.key === "Escape" && kapat();
    window.addEventListener("keydown", tus);
    return () => window.removeEventListener("keydown", tus);
  }, [acik, kapat]);

  return (
    <AnimatePresence>
      {acik && (
        <>
          <motion.div
            key="perde"
            className="absolute inset-0 z-40 bg-black/40"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={kapat}
          />
          <motion.aside
            key="cekmece"
            role="dialog"
            aria-modal="true"
            className="absolute inset-y-0 right-0 z-50 flex w-full flex-col border-l border-[var(--k)] bg-[var(--kart)] [box-shadow:var(--golge)]"
            style={{ maxWidth: genislik }}
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ duration: 0.35, ease: EGRI }}
          >
            {children}
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
}

function Detay({ tanim, kayit, api, kapat }: { tanim: Liste; kayit: Kayit; api: PanelApi; kapat: () => void }) {
  const eylemler = (tanim.detay.eylemler ?? []).filter((e) => !e.gorunur || e.gorunur(kayit, api));
  return (
    <>
      <header className="flex items-start justify-between gap-3 border-b border-[var(--k)] px-5 py-4">
        <div className="min-w-0">
          <h3 className="text-[17px] font-bold tracking-tight text-[var(--m)]">{tanim.baslik(kayit, api)}</h3>
          {tanim.alt && <p className="mt-0.5 text-[12.5px] text-[var(--ms)]">{tanim.alt(kayit, api)}</p>}
          {tanim.durum && (
            <div className="mt-2">
              <DurumYazi d={tanim.durum(kayit, api)} />
            </div>
          )}
        </div>
        <button type="button" onClick={kapat} aria-label="Kapat" className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-[var(--ms)] hover:bg-[var(--k2)] hover:text-[var(--m)]">
          <IconX size={18} />
        </button>
      </header>
      <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain">{tanim.detay.bolumler(kayit, api)}</div>
      {eylemler.length > 0 && (
        <footer className="flex flex-wrap gap-2 border-t border-[var(--k)] px-5 py-3">
          {eylemler.map((e) => (
            <Dugme key={e.ad} tur={e.tur ?? "normal"} ikon={e.ikon} onClick={() => e.uygula(kayit, api)}>
              {e.ad}
            </Dugme>
          ))}
        </footer>
      )}
    </>
  );
}

export function FormPenceresi({ acik, form, api, kapat, bitti }: { acik: boolean; form: Form; api: PanelApi; kapat: () => void; bitti: (id: string) => void }) {
  const alanlar: FormAlani[] = typeof form.alanlar === "function" ? form.alanlar(api) : form.alanlar;
  const [degerler, setDegerler] = useState<Record<string, string>>({});

  useEffect(() => {
    if (acik) setDegerler(Object.fromEntries(alanlar.map((a) => [a.anahtar, a.varsayilan ?? (a.tur === "secim" ? a.secenekler?.[0] ?? "" : "")])));
    // Pencere her açılışta varsayılanlarla başlar.
  }, [acik]);

  const gonder = (e: FormEvent) => {
    e.preventDefault();
    const id = form.olustur(degerler, api);
    bitti(id);
  };

  return (
    <AnimatePresence>
      {acik && (
        <motion.div className="absolute inset-0 z-50 flex items-end justify-center bg-black/45 p-3 @lg:items-center" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={kapat}>
          <motion.form
            onSubmit={gonder}
            onClick={(e) => e.stopPropagation()}
            initial={{ y: 24, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 24, opacity: 0 }}
            transition={{ duration: 0.3, ease: EGRI }}
            className="max-h-full w-full max-w-md overflow-y-auto rounded-2xl border border-[var(--k)] bg-[var(--kart)] [box-shadow:var(--golge)]"
          >
            <header className="flex items-center justify-between border-b border-[var(--k)] px-5 py-4">
              <h3 className="text-[16px] font-bold text-[var(--m)]">{form.baslik}</h3>
              <button type="button" onClick={kapat} aria-label="Kapat" className="flex h-8 w-8 items-center justify-center rounded-lg text-[var(--ms)] hover:bg-[var(--k2)]">
                <IconX size={18} />
              </button>
            </header>
            <div className="space-y-3.5 px-5 py-4">
              {alanlar.map((a) => (
                <label key={a.anahtar} className="block">
                  <span className="text-[12px] font-medium text-[var(--ms)]">{a.ad}</span>
                  {a.tur === "secim" ? (
                    <select
                      value={degerler[a.anahtar] ?? ""}
                      onChange={(e) => setDegerler((d) => ({ ...d, [a.anahtar]: e.target.value }))}
                      className="mt-1.5 h-10 w-full rounded-lg border border-[var(--k)] bg-[var(--kart)] px-3 text-[13px] text-[var(--m)] outline-none focus:border-[var(--p)]"
                    >
                      {a.secenekler?.map((s) => (
                        <option key={s}>{s}</option>
                      ))}
                    </select>
                  ) : (
                    <input
                      type={a.tur === "sayi" ? "number" : "text"}
                      inputMode={a.tur === "sayi" ? "decimal" : undefined}
                      required={a.zorunlu}
                      value={degerler[a.anahtar] ?? ""}
                      onChange={(e) => setDegerler((d) => ({ ...d, [a.anahtar]: e.target.value }))}
                      className="mt-1.5 h-10 w-full rounded-lg border border-[var(--k)] bg-transparent px-3 text-[13px] text-[var(--m)] outline-none focus:border-[var(--p)]"
                    />
                  )}
                </label>
              ))}
            </div>
            <footer className="flex justify-end gap-2 border-t border-[var(--k)] px-5 py-3">
              <Dugme onClick={kapat}>Vazgeç</Dugme>
              <Dugme tur="ana" type="submit">
                {form.dugme}
              </Dugme>
            </footer>
          </motion.form>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
