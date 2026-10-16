/*
 * Kütüphanesiz grafikler. Hepsi kapsayıcının genişliğine yayılır, üstüne
 * gelinen öğenin değeri başlıkta yazar. Yarım kalmış gün (bugün) taralı
 * çizilir ve ayrıca belirtilir; grafik sona doğru sıfıra çakılmış gibi görünmez.
 */
import { useId, useState } from "react";
import { RENK } from "./parcalar";
import type { Renk } from "../tipler";

export type CubukVerisi = { etiket: string; deger: number; uzunEtiket?: string; kismi?: boolean };

export function CubukGrafik({
  veri,
  bicim,
  hedef,
  hedefAdi = "Hedef",
  yukseklik = 180,
  renk = "var(--p)",
  ozet,
  seriAdi = "Tamamlanan gün",
  kismiAdi = "Bugün, şu ana kadar",
}: {
  veri: CubukVerisi[];
  bicim: (n: number) => string;
  hedef?: number;
  hedefAdi?: string;
  yukseklik?: number;
  renk?: string;
  ozet?: string;
  /** Alttaki açıklamada çubukların adı; boş verilirse yazılmaz. */
  seriAdi?: string;
  kismiAdi?: string;
}) {
  const [secili, setSecili] = useState<number | null>(null);
  const desen = useId().replace(/:/g, "");
  const enYuksek = Math.max(...veri.map((v) => v.deger), hedef ?? 0, 1) * 1.08;
  const izgara = [0.33, 0.66, 1].map((o) => enYuksek * o);
  const g = secili !== null ? veri[secili] : null;
  // Etiketler sık olunca yalnız bir kısmı yazılır.
  const adim = Math.ceil(veri.length / 10);

  return (
    <div>
      <p className="mb-3 min-h-5 text-[12px] tabular-nums text-[var(--ms)]">
        {g ? (
          <>
            <span className="font-semibold text-[var(--m)]">{g.uzunEtiket ?? g.etiket}</span>, {bicim(g.deger)}
            {g.kismi && ", henüz bitmedi"}
          </>
        ) : (
          ozet ?? "Bir çubuğun üstüne gelin"
        )}
      </p>
      <div className="relative" style={{ height: yukseklik }} onMouseLeave={() => setSecili(null)}>
        <svg aria-hidden="true" className="absolute inset-0 h-full w-full overflow-visible">
          <defs>
            <pattern id={desen} width="6" height="6" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
              <rect width="6" height="6" fill={renk} opacity="0.18" />
              <line x1="0" y1="0" x2="0" y2="6" stroke={renk} strokeWidth="2.5" opacity="0.7" />
            </pattern>
          </defs>
          {izgara.map((d) => (
            <line key={d} x1="0" x2="100%" y1={`${100 - (d / enYuksek) * 100}%`} y2={`${100 - (d / enYuksek) * 100}%`} stroke="var(--k)" strokeDasharray="3 4" />
          ))}
          {hedef !== undefined && (
            <line x1="0" x2="100%" y1={`${100 - (hedef / enYuksek) * 100}%`} y2={`${100 - (hedef / enYuksek) * 100}%`} stroke="var(--sari)" strokeWidth="1.5" strokeDasharray="6 4" />
          )}
        </svg>
        <div className="absolute inset-0 flex items-end gap-[3px] sm:gap-1">
          {veri.map((v, i) => (
            <button
              key={i}
              type="button"
              aria-label={`${v.uzunEtiket ?? v.etiket}, ${bicim(v.deger)}`}
              onMouseEnter={() => setSecili(i)}
              onFocus={() => setSecili(i)}
              onClick={() => setSecili(i)}
              className="group relative flex h-full flex-1 items-end"
            >
              <svg className="w-full overflow-visible" style={{ height: `${(v.deger / enYuksek) * 100}%`, minHeight: v.deger > 0 ? 2 : 0 }} preserveAspectRatio="none">
                <rect
                  width="100%"
                  height="100%"
                  rx="3"
                  fill={v.kismi ? `url(#${desen})` : renk}
                  opacity={secili === null || secili === i ? (v.kismi ? 1 : 0.92) : 0.35}
                  className="transition-opacity duration-200"
                />
              </svg>
            </button>
          ))}
        </div>
      </div>
      <div className="mt-2 flex gap-[3px] sm:gap-1">
        {veri.map((v, i) => (
          <span key={i} className="flex-1 truncate text-center text-[10.5px] text-[var(--ms)]">
            {i % adim === 0 || i === veri.length - 1 ? v.etiket : ""}
          </span>
        ))}
      </div>
      <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-[11.5px] text-[var(--ms)]">
        {seriAdi && (
          <span className="inline-flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-[2px]" style={{ background: renk }} />
            {seriAdi}
          </span>
        )}
        {veri.some((v) => v.kismi) && (
          <span className="inline-flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-[2px] border" style={{ borderColor: renk, background: `repeating-linear-gradient(45deg, ${renk} 0 2px, transparent 2px 4px)` }} />
            {kismiAdi}
          </span>
        )}
        {hedef !== undefined && (
          <span className="inline-flex items-center gap-1.5">
            <span className="h-0.5 w-3 bg-[var(--sari)]" />
            {hedefAdi} {bicim(hedef)}
          </span>
        )}
      </div>
    </div>
  );
}

export type HalkaDilimi = { ad: string; deger: number; renk: Renk | string };

export function HalkaGrafik({ dilimler, bicim, merkez }: { dilimler: HalkaDilimi[]; bicim: (n: number) => string; merkez: string }) {
  const [secili, setSecili] = useState<number | null>(null);
  const toplam = dilimler.reduce((t, d) => t + d.deger, 0) || 1;
  const R = 42;
  const C = 2 * Math.PI * R;
  let birikim = 0;
  const renkOf = (r: string) => (r in RENK ? RENK[r as Renk] : r);
  const s = secili !== null ? dilimler[secili] : null;
  return (
    <div className="flex flex-col items-center gap-4 @md:flex-row @md:items-center">
      <div className="relative h-36 w-36 shrink-0">
        <svg viewBox="0 0 100 100" className="h-full w-full -rotate-90">
          <circle cx="50" cy="50" r={R} fill="none" stroke="var(--k2)" strokeWidth="11" />
          {dilimler.map((d, i) => {
            const uzunluk = (d.deger / toplam) * C;
            const parca = (
              <circle
                key={d.ad}
                cx="50"
                cy="50"
                r={R}
                fill="none"
                stroke={renkOf(d.renk)}
                strokeWidth={secili === i ? 14 : 11}
                strokeDasharray={`${Math.max(0, uzunluk - 1.2)} ${C}`}
                strokeDashoffset={-birikim}
                className="cursor-pointer transition-[stroke-width] duration-200"
                onMouseEnter={() => setSecili(i)}
                onMouseLeave={() => setSecili(null)}
              />
            );
            birikim += uzunluk;
            return parca;
          })}
        </svg>
        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center text-center">
          <span className="text-[15px] font-bold tabular-nums text-[var(--m)]">{s ? `yüzde ${Math.round((s.deger / toplam) * 100)}` : merkez}</span>
          <span className="max-w-[5.5rem] truncate text-[10.5px] text-[var(--ms)]">{s ? s.ad : "Toplam"}</span>
        </div>
      </div>
      <ul className="w-full min-w-0 space-y-2">
        {dilimler.map((d, i) => (
          <li
            key={d.ad}
            onMouseEnter={() => setSecili(i)}
            onMouseLeave={() => setSecili(null)}
            className={`flex items-center justify-between gap-3 rounded-md px-1.5 py-1 text-[12.5px] transition-colors ${secili === i ? "bg-[var(--k2)]" : ""}`}
          >
            <span className="flex min-w-0 items-center gap-2 text-[var(--m)]">
              <span className="h-2.5 w-2.5 shrink-0 rounded-[3px]" style={{ background: renkOf(d.renk) }} />
              <span className="truncate">{d.ad}</span>
            </span>
            <span className="shrink-0 tabular-nums text-[var(--ms)]">{bicim(d.deger)}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

/** Gün ve saat yoğunluğu; satırlar günler, sütunlar saatler. */
export function IsiHaritasi({ satirlar, sutunlar, degerler, bicim }: { satirlar: string[]; sutunlar: string[]; degerler: number[][]; bicim: (n: number) => string }) {
  const [secili, setSecili] = useState<[number, number] | null>(null);
  const enYuksek = Math.max(1, ...degerler.flat());
  return (
    <div>
      <p className="mb-3 min-h-5 text-[12px] text-[var(--ms)]">
        {secili ? (
          <>
            <span className="font-semibold text-[var(--m)]">
              {satirlar[secili[0]]} {sutunlar[secili[1]]}
            </span>
            , {bicim(degerler[secili[0]][secili[1]])}
          </>
        ) : (
          "Bir kareye gelin; koyu kareler en yoğun saatler"
        )}
      </p>
      <div className="overflow-x-auto">
        <div className="min-w-[30rem]" onMouseLeave={() => setSecili(null)}>
          {satirlar.map((s, i) => (
            <div key={s} className="mb-[3px] flex items-center gap-[3px]">
              <span className="w-9 shrink-0 text-[10.5px] text-[var(--ms)]">{s}</span>
              {degerler[i].map((d, j) => (
                <span
                  key={j}
                  onMouseEnter={() => setSecili([i, j])}
                  className="h-5 flex-1 rounded-[3px] transition-transform hover:scale-110"
                  style={{ background: d === 0 ? "var(--k2)" : "var(--p)", opacity: d === 0 ? 1 : 0.15 + (d / enYuksek) * 0.85 }}
                />
              ))}
            </div>
          ))}
          <div className="flex gap-[3px] pl-[39px]">
            {sutunlar.map((s, j) => (
              <span key={s} className="flex-1 text-center text-[10px] text-[var(--ms)]">
                {j % 2 === 0 ? s : ""}
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

/** Ölçüm ve eğilim çizgisi. */
export function CizgiGrafik({ noktalar, bicim, yukseklik = 140, renk = "var(--p)" }: { noktalar: { etiket: string; deger: number }[]; bicim: (n: number) => string; yukseklik?: number; renk?: string }) {
  const [secili, setSecili] = useState<number | null>(null);
  const kimlik = useId().replace(/:/g, "");
  if (noktalar.length < 2) return null;
  const degerler = noktalar.map((n) => n.deger);
  const alt = Math.min(...degerler);
  const ust = Math.max(...degerler);
  const pay = (ust - alt) * 0.2 || 1;
  const y = (d: number) => 100 - ((d - (alt - pay)) / (ust - alt + 2 * pay)) * 100;
  const x = (i: number) => (i / (noktalar.length - 1)) * 100;
  const yol = noktalar.map((n, i) => `${i ? "L" : "M"}${x(i)},${y(n.deger)}`).join(" ");
  const s = secili !== null ? noktalar[secili] : noktalar[noktalar.length - 1];
  return (
    <div>
      <p className="mb-2 text-[12px] tabular-nums text-[var(--ms)]">
        <span className="font-semibold text-[var(--m)]">{s.etiket}</span>, {bicim(s.deger)}
      </p>
      <div className="relative" style={{ height: yukseklik }} onMouseLeave={() => setSecili(null)}>
        <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="absolute inset-0 h-full w-full overflow-visible">
          <defs>
            <linearGradient id={kimlik} x1="0" x2="0" y1="0" y2="1">
              <stop offset="0" stopColor={renk} stopOpacity="0.25" />
              <stop offset="1" stopColor={renk} stopOpacity="0" />
            </linearGradient>
          </defs>
          <path d={`${yol} L100,100 L0,100 Z`} fill={`url(#${kimlik})`} />
          <path d={yol} fill="none" stroke={renk} strokeWidth="2" vectorEffect="non-scaling-stroke" />
        </svg>
        <span
          aria-hidden="true"
          className="pointer-events-none absolute h-2.5 w-2.5 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 bg-[var(--kart)] transition-[left,top] duration-150"
          style={{ borderColor: renk, left: `${x(secili ?? noktalar.length - 1)}%`, top: `${y(s.deger)}%` }}
        />
        <div className="absolute inset-0 flex">
          {noktalar.map((n, i) => (
            <button key={i} type="button" aria-label={`${n.etiket}, ${bicim(n.deger)}`} onMouseEnter={() => setSecili(i)} onFocus={() => setSecili(i)} className="h-full flex-1" />
          ))}
        </div>
      </div>
      <div className="mt-2 flex justify-between text-[10.5px] text-[var(--ms)]">
        <span>{noktalar[0].etiket}</span>
        <span>{noktalar[noktalar.length - 1].etiket}</span>
      </div>
    </div>
  );
}
