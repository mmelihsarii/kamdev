/*
 * Özet ekranı kalıbı. Her sektör kendi sayılarını ve grafiklerini verir;
 * selamlama, dikkat isteyenler listesi ve yerleşim burada ortak.
 */
import type { ReactNode } from "react";
import { IconChevronRight, IconCircleCheck } from "@tabler/icons-react";
import { Kart, RENK, SayiKarti, type SayiTanimi } from "./parcalar";
import { GUNLER, saat, tarih } from "../ortak";
import type { ModulBilgi, Ozel, PanelApi, Uyari } from "../tipler";

type Parca = { baslik: string; sag?: (api: PanelApi) => ReactNode; icerik: (api: PanelApi) => ReactNode; genis?: boolean };

export function Uyarilar({ api, uyarilar }: { api: PanelApi; uyarilar: Uyari[] }) {
  if (!uyarilar.length)
    return (
      <p className="flex items-center gap-2 px-4 py-6 text-[13px] text-[var(--ms)]">
        <IconCircleCheck size={18} className="text-[var(--yesil)]" />
        Şu an bekleyen bir iş yok.
      </p>
    );
  return (
    <ul className="divide-y divide-[var(--k)]">
      {uyarilar.map((u) => (
        <li key={u.metin}>
          <button type="button" onClick={() => api.git(u.modul, { filtre: u.filtre })} className="flex w-full items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-[var(--k2)]">
            <span aria-hidden="true" className="h-8 w-1 shrink-0 rounded-full" style={{ background: RENK[u.renk] }} />
            <span className="min-w-0 flex-1 text-[13px] leading-5 text-[var(--m)]">{u.metin}</span>
            <IconChevronRight size={16} className="shrink-0 text-[var(--ms)]" />
          </button>
        </li>
      ))}
    </ul>
  );
}

export function selam(ani: Date) {
  const s = ani.getHours();
  return s < 5 ? "İyi geceler" : s < 12 ? "Günaydın" : s < 18 ? "İyi günler" : "İyi akşamlar";
}

export function ozetEkrani(t: {
  sayilar: (api: PanelApi) => SayiTanimi[];
  uyarilar: (api: PanelApi) => Uyari[];
  kullanici: string;
  /** Karşılama kartındaki tek cümlelik durum özeti. */
  karsilama?: (api: PanelApi) => string;
  ana: Parca;
  parcalar?: Parca[];
}): Ozel {
  function OzetEkrani({ api }: { api: PanelApi; modul: ModulBilgi }) {
    const uyarilar = t.uyarilar(api);
    const sayilar = t.sayilar(api);
    const ilk = uyarilar[0];
    return (
      <>
        <div className="relative mb-4 overflow-hidden rounded-2xl border border-[var(--k)] bg-[var(--kart)] p-5 @2xl:p-6">
          <div aria-hidden="true" className="pointer-events-none absolute -right-20 -top-28 h-72 w-72 rounded-full opacity-[0.16] blur-3xl" style={{ background: "var(--p)" }} />
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 opacity-40 [background-image:linear-gradient(var(--k)_1px,transparent_1px),linear-gradient(90deg,var(--k)_1px,transparent_1px)] [background-size:28px_28px] [mask-image:linear-gradient(110deg,transparent_45%,black)]"
          />
          <div className="relative flex flex-col gap-4 @3xl:flex-row @3xl:items-end @3xl:justify-between">
            <div className="min-w-0">
              <p className="text-[12px] font-medium text-[var(--ms)]">
                {tarih(api.ani, true)} {GUNLER[api.ani.getDay()]}, saat {saat(api.ani)}
              </p>
              <h2 className="mt-1 text-[22px] font-bold tracking-tight text-[var(--m)]">
                {selam(api.ani)}, {t.kullanici.split(" ")[0]}
              </h2>
              <p className="mt-1.5 max-w-xl text-[13px] leading-6 text-[var(--ms)]">
                {t.karsilama ? `${t.karsilama(api)} ` : ""}
                {uyarilar.length ? `${uyarilar.length} konu ilginizi bekliyor.` : "Bekleyen bir iş görünmüyor."}
              </p>
            </div>
            {ilk && (
              <button
                type="button"
                onClick={() => api.git(ilk.modul, { filtre: ilk.filtre })}
                className="group flex shrink-0 items-center gap-3 rounded-xl border border-[var(--k)] bg-[var(--kart2)] px-3.5 py-2.5 text-left transition-colors hover:border-[var(--p)]"
              >
                <span aria-hidden="true" className="h-8 w-1 rounded-full" style={{ background: RENK[ilk.renk] }} />
                <span className="max-w-[16rem]">
                  <span className="block text-[11px] font-semibold uppercase tracking-[0.08em] text-[var(--ms)]">Önce buna bakın</span>
                  <span className="block text-[12.5px] leading-5 text-[var(--m)]">{ilk.metin}</span>
                </span>
                <IconChevronRight size={16} className="shrink-0 text-[var(--ms)] transition-transform group-hover:translate-x-0.5" />
              </button>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 gap-3 @md:grid-cols-2 @5xl:grid-cols-4">
          {sayilar.map((s) => (
            <SayiKarti key={s.ad} s={s} />
          ))}
        </div>

        <div className="mt-3 grid gap-3 @5xl:grid-cols-[minmax(0,1.7fr)_minmax(0,1fr)]">
          <Kart baslik={t.ana.baslik} sag={t.ana.sag?.(api)}>
            <div className="p-4">{t.ana.icerik(api)}</div>
          </Kart>
          <Kart baslik="Dikkat isteyenler" sag={<span className="text-[12px] font-semibold tabular-nums text-[var(--p)]">{uyarilar.length || ""}</span>}>
            <Uyarilar api={api} uyarilar={uyarilar} />
          </Kart>
        </div>

        {t.parcalar && (
          <div className="mt-3 grid gap-3 @4xl:grid-cols-2">
            {t.parcalar.map((p) => (
              <Kart key={p.baslik} baslik={p.baslik} sag={p.sag?.(api)} className={p.genis ? "@4xl:col-span-2" : ""}>
                <div className="p-4">{p.icerik(api)}</div>
              </Kart>
            ))}
          </div>
        )}
      </>
    );
  }
  return { tur: "ozel", bilesen: OzetEkrani };
}
