/*
 * Panelin küçük yapı taşları. Renkler kabuğun verdiği CSS değişkenlerinden gelir:
 * --p vurgu, --y zemin, --yan yan menü, --kart kart, --k çizgi, --k2 dolgu,
 * --m metin, --ms soluk metin. Durum renkleri de tema ile birlikte değişir.
 */
import { useState, type ReactNode } from "react";
import { IconArrowDownRight, IconArrowUpRight, IconHelpCircle, IconMinus } from "@tabler/icons-react";
import type { Durum, Ikon, Renk } from "../tipler";

export const RENK: Record<Renk, string> = {
  yesil: "var(--yesil)",
  sari: "var(--sari)",
  kirmizi: "var(--kirmizi)",
  mavi: "var(--mavi)",
  mor: "var(--mor)",
  gri: "var(--ms)",
  vurgu: "var(--p)",
};

export const TEMA = {
  koyu: {
    "--y": "#0b0b0e",
    "--yan": "#08080a",
    "--kart": "#111115",
    "--kart2": "#16161b",
    "--k": "rgba(255,255,255,0.07)",
    "--k2": "rgba(255,255,255,0.1)",
    "--m": "#f4f4f5",
    "--ms": "#8e8e98",
    "--yesil": "#34d399",
    "--sari": "#fbbf24",
    "--kirmizi": "#f87171",
    "--mavi": "#60a5fa",
    "--mor": "#a78bfa",
    "--golge": "0 24px 70px rgba(0,0,0,0.55)",
  },
  acik: {
    "--y": "#f5f5f7",
    "--yan": "#ffffff",
    "--kart": "#ffffff",
    "--kart2": "#fafafb",
    "--k": "rgba(0,0,0,0.08)",
    "--k2": "rgba(0,0,0,0.06)",
    "--m": "#18181b",
    "--ms": "#6b6b75",
    "--yesil": "#059669",
    "--sari": "#c2410c",
    "--kirmizi": "#dc2626",
    "--mavi": "#2563eb",
    "--mor": "#7c3aed",
    "--golge": "0 24px 70px rgba(15,15,30,0.16)",
  },
} as const;

export function Kart({ children, className = "", baslik, sag }: { children: ReactNode; className?: string; baslik?: string; sag?: ReactNode }) {
  return (
    <section className={`rounded-xl border border-[var(--k)] bg-[var(--kart)] ${className}`}>
      {baslik && (
        <header className="flex items-center justify-between gap-3 border-b border-[var(--k)] px-4 py-3">
          <h3 className="text-[13px] font-semibold text-[var(--m)]">{baslik}</h3>
          {sag}
        </header>
      )}
      {children}
    </section>
  );
}

/** Durum yazısı: renkli küçük kare ve yanında durumun adı. Hap ya da parlayan nokta yok. */
export function DurumYazi({ d, kucuk = false }: { d: Durum; kucuk?: boolean }) {
  return (
    <span className={`inline-flex items-center gap-1.5 whitespace-nowrap font-medium ${kucuk ? "text-[11.5px]" : "text-[12.5px]"}`} style={{ color: RENK[d.renk] }}>
      <span aria-hidden="true" className="h-[7px] w-[7px] shrink-0 rounded-[2px]" style={{ background: RENK[d.renk] }} />
      {d.ad}
    </span>
  );
}

export function Dugme({
  children,
  onClick,
  tur = "normal",
  ikon: I,
  kucuk = false,
  type = "button",
  disabled,
  className = "",
}: {
  children?: ReactNode;
  onClick?: () => void;
  tur?: "ana" | "normal" | "tehlike" | "sade";
  ikon?: Ikon;
  kucuk?: boolean;
  type?: "button" | "submit";
  disabled?: boolean;
  className?: string;
}) {
  const stil = {
    ana: "bg-[var(--p)] text-white hover:brightness-110",
    normal: "border border-[var(--k)] bg-[var(--kart)] text-[var(--m)] hover:bg-[var(--k2)]",
    tehlike: "border border-[var(--k)] bg-[var(--kart)] text-[var(--kirmizi)] hover:bg-[var(--k2)]",
    sade: "text-[var(--ms)] hover:bg-[var(--k2)] hover:text-[var(--m)]",
  }[tur];
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`inline-flex shrink-0 items-center justify-center gap-1.5 rounded-lg font-semibold transition-[filter,background-color,color] disabled:cursor-not-allowed disabled:opacity-50 ${
        kucuk ? "h-8 px-2.5 text-[12px]" : "h-9 px-3.5 text-[13px]"
      } ${stil} ${className}`}
    >
      {I && <I size={kucuk ? 14 : 16} stroke={2} />}
      {children}
    </button>
  );
}

/** Değerin nasıl hesaplandığını anlatan küçük soru işareti; üstüne gelince ya da dokununca açılır. */
export function Ipucu({ metin }: { metin: string }) {
  const [acik, setAcik] = useState(false);
  return (
    <span className="relative inline-flex" onMouseEnter={() => setAcik(true)} onMouseLeave={() => setAcik(false)}>
      <button
        type="button"
        aria-label="Bu sayı nasıl hesaplanıyor?"
        aria-expanded={acik}
        onClick={() => setAcik((a) => !a)}
        className="flex h-5 w-5 items-center justify-center rounded text-[var(--ms)] opacity-60 transition-opacity hover:opacity-100"
      >
        <IconHelpCircle size={14} />
      </button>
      {acik && (
        <span
          role="tooltip"
          className="absolute right-0 top-6 z-30 w-60 rounded-lg border border-[var(--k)] bg-[var(--kart2)] p-3 text-[12px] font-normal leading-5 text-[var(--m)] [box-shadow:var(--golge)]"
        >
          {metin}
        </span>
      )}
    </span>
  );
}

export type Degisim = { oran: number; iyi: boolean; metin: string };

/** Değişim satırı: ok, oran ve neye göre olduğu. Değişim yoksa düz çizgi. */
export function DegisimYazi({ d }: { d: Degisim }) {
  const sabit = Math.abs(d.oran) < 0.5;
  const renk = sabit ? "var(--ms)" : d.iyi ? "var(--yesil)" : "var(--kirmizi)";
  const I = sabit ? IconMinus : d.oran > 0 ? IconArrowUpRight : IconArrowDownRight;
  return (
    <span className="flex flex-wrap items-center gap-x-1 text-[11.5px] leading-5">
      <span className="inline-flex items-center gap-0.5 font-semibold" style={{ color: renk }}>
        <I size={13} stroke={2.2} />
        {sabit ? "Değişmedi" : `yüzde ${Math.abs(d.oran).toLocaleString("tr-TR", { maximumFractionDigits: 1 })}`}
      </span>
      <span className="text-[var(--ms)]">{d.metin}</span>
    </span>
  );
}

export type SayiTanimi = {
  ad: string;
  deger: string;
  birim?: string;
  degisim?: Degisim;
  alt?: string;
  not: string;
  renk?: Renk;
  git?: () => void;
  /** Kartın altındaki küçük eğilim çizgisi; eskiden yeniye. */
  seri?: number[];
};

/** Küçük eğilim çizgisi; eksen ve yazı yok, yalnız gidişat. */
export function EgilimCizgisi({ seri, renk = "var(--p)" }: { seri: number[]; renk?: string }) {
  if (seri.length < 2) return null;
  const alt = Math.min(...seri);
  const ust = Math.max(...seri);
  const y = (d: number) => 26 - ((d - alt) / (ust - alt || 1)) * 22;
  const x = (i: number) => (i / (seri.length - 1)) * 100;
  const yol = seri.map((d, i) => `${i ? "L" : "M"}${x(i)},${y(d)}`).join(" ");
  return (
    <svg aria-hidden="true" viewBox="0 0 100 28" preserveAspectRatio="none" className="h-7 w-24 overflow-visible">
      <path d={`${yol} L100,28 L0,28 Z`} fill={renk} opacity="0.1" />
      <path d={yol} fill="none" stroke={renk} strokeWidth="1.6" vectorEffect="non-scaling-stroke" strokeLinejoin="round" />
      <circle cx={x(seri.length - 1)} cy={y(seri[seri.length - 1])} r="2" fill={renk} />
    </svg>
  );
}

/** Özet ekranının sayı kartı. Uzun açıklamalar kesilmez, alt satıra geçer. */
export function SayiKarti({ s }: { s: SayiTanimi }) {
  const Govde = s.git ? "button" : "div";
  return (
    <div className="relative rounded-xl border border-[var(--k)] bg-[var(--kart)] transition-colors has-[button.sayi-git:hover]:border-[var(--k2)]">
      <div className="absolute right-2.5 top-2.5 z-10">
        <Ipucu metin={s.not} />
      </div>
      <Govde
        {...(s.git ? { type: "button" as const, onClick: s.git } : {})}
        className={`sayi-git block w-full p-4 pr-9 text-left ${s.git ? "cursor-pointer" : ""}`}
      >
        <span className="block text-[12px] leading-5 text-[var(--ms)]">{s.ad}</span>
        <span className="mt-1.5 flex items-baseline gap-1.5">
          <span className="text-[22px] font-bold tabular-nums tracking-tight" style={{ color: s.renk ? RENK[s.renk] : "var(--m)" }}>
            {s.deger}
          </span>
          {s.birim && <span className="text-[12px] font-medium text-[var(--ms)]">{s.birim}</span>}
        </span>
        <span className="mt-1.5 flex items-end justify-between gap-3">
          <span className="min-w-0">{s.degisim ? <DegisimYazi d={s.degisim} /> : s.alt ? <span className="text-[11.5px] leading-5 text-[var(--ms)]">{s.alt}</span> : null}</span>
          {s.seri && (
            <span className="-mb-1 shrink-0">
              <EgilimCizgisi seri={s.seri} renk={s.renk ? RENK[s.renk] : "var(--p)"} />
            </span>
          )}
        </span>
      </Govde>
    </div>
  );
}

/** Etiket ve değer çiftleri; detay çekmecesinde kullanılır. */
export function AlanListesi({ alanlar, sutun = 2 }: { alanlar: [string, ReactNode][]; sutun?: 1 | 2 }) {
  return (
    <dl className={`grid gap-x-6 gap-y-3.5 ${sutun === 2 ? "grid-cols-2" : "grid-cols-1"}`}>
      {alanlar
        .filter(([, d]) => d !== null && d !== undefined && d !== "")
        .map(([ad, deger]) => (
          <div key={ad} className="min-w-0">
            <dt className="text-[11.5px] text-[var(--ms)]">{ad}</dt>
            <dd className="mt-0.5 break-words text-[13px] font-medium text-[var(--m)]">{deger}</dd>
          </div>
        ))}
    </dl>
  );
}

export function Bolum({ baslik, children, sag }: { baslik: string; children: ReactNode; sag?: ReactNode }) {
  return (
    <section className="border-t border-[var(--k)] px-5 py-4 first:border-t-0">
      <div className="mb-3 flex items-center justify-between gap-3">
        <h4 className="text-[11.5px] font-semibold uppercase tracking-[0.08em] text-[var(--ms)]">{baslik}</h4>
        {sag}
      </div>
      {children}
    </section>
  );
}

/** Kaydın geçmişi; en yeni üstte. */
export function Gecmis({ satirlar }: { satirlar: { zaman: string; metin: string }[] }) {
  if (!satirlar.length) return <p className="text-[12.5px] text-[var(--ms)]">Henüz bir hareket yok.</p>;
  return (
    <ol className="space-y-3">
      {satirlar.map((s, i) => (
        <li key={i} className="relative flex gap-3 pl-4">
          <span aria-hidden="true" className="absolute left-0 top-[7px] h-[7px] w-[7px] rounded-[2px]" style={{ background: i === 0 ? "var(--p)" : "var(--k2)" }} />
          {i < satirlar.length - 1 && <span aria-hidden="true" className="absolute left-[3px] top-4 h-[calc(100%+4px)] w-px bg-[var(--k)]" />}
          <span className="min-w-0">
            <span className="block text-[12.5px] leading-5 text-[var(--m)]">{s.metin}</span>
            <span className="block text-[11px] text-[var(--ms)]">{s.zaman}</span>
          </span>
        </li>
      ))}
    </ol>
  );
}

/** Küçük satır tablosu: sipariş kalemleri, ödemeler, seanslar. */
export function MiniTablo({ basliklar, satirlar, sagdakiler = [] }: { basliklar: string[]; satirlar: ReactNode[][]; sagdakiler?: number[] }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-[12.5px]">
        <thead>
          <tr className="text-[11px] text-[var(--ms)]">
            {basliklar.map((b, i) => (
              <th key={b} className={`pb-2 font-medium ${sagdakiler.includes(i) ? "text-right" : "text-left"}`}>
                {b}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {satirlar.map((s, i) => (
            <tr key={i} className="border-t border-[var(--k)]">
              {s.map((h, j) => (
                <td key={j} className={`py-2 pr-2 align-top text-[var(--m)] last:pr-0 ${sagdakiler.includes(j) ? "text-right tabular-nums" : ""}`}>
                  {h}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function Anahtar({ acik, degistir, ad }: { acik: boolean; degistir: () => void; ad: string }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={acik}
      aria-label={ad}
      onClick={(e) => {
        e.stopPropagation();
        degistir();
      }}
      className={`relative h-5 w-9 shrink-0 rounded-full transition-colors ${acik ? "bg-[var(--p)]" : "bg-[var(--k2)]"}`}
    >
      <span className={`absolute left-0 top-0.5 h-4 w-4 rounded-full bg-white shadow transition-transform ${acik ? "translate-x-[18px]" : "translate-x-0.5"}`} />
    </button>
  );
}

const HARF_RENKLERI = ["#e2462d", "#3b6cf6", "#16a34a", "#0d9488", "#a855f7", "#d97706", "#0a84c6", "#db2777"];
/** İsimden her seferinde aynı rengi seçer; aynı kişi her ekranda aynı renkte görünür. */
export const isimRengi = (ad: string) => HARF_RENKLERI[[...ad].reduce((t, c) => (t * 31 + c.charCodeAt(0)) >>> 0, 7) % HARF_RENKLERI.length];

/** Baş harfli küçük kare; kişi ya da firma için. */
export function Harf({ metin, renk, boy = 32, yumusak = false }: { metin: string; renk?: string; boy?: number; yumusak?: boolean }) {
  return (
    <span
      aria-hidden="true"
      className="flex shrink-0 items-center justify-center rounded-lg font-semibold"
      style={{
        width: boy,
        height: boy,
        fontSize: boy * 0.38,
        background: renk ? (yumusak ? `color-mix(in srgb, ${renk} 20%, transparent)` : renk) : "var(--k2)",
        color: renk ? (yumusak ? renk : "#fff") : "var(--ms)",
      }}
    >
      {metin}
    </span>
  );
}

/** Doluluk ve ilerleme çubuğu. */
export function Cubuk({ oran, renk = "var(--p)", ince = false }: { oran: number; renk?: string; ince?: boolean }) {
  return (
    <span className={`block w-full overflow-hidden rounded-full bg-[var(--k2)] ${ince ? "h-1" : "h-1.5"}`}>
      <span className="block h-full rounded-full transition-[width] duration-500" style={{ width: `${Math.max(0, Math.min(1, oran)) * 100}%`, background: renk }} />
    </span>
  );
}

export function Bos({ metin, ikon: I }: { metin: string; ikon?: Ikon }) {
  return (
    <div className="flex flex-col items-center justify-center gap-2 px-6 py-12 text-center">
      {I && <I size={26} className="text-[var(--ms)] opacity-60" />}
      <p className="max-w-xs text-[13px] leading-6 text-[var(--ms)]">{metin}</p>
    </div>
  );
}

/** Ekran başlığının altındaki küçük sayı şeridi. */
export function SayiSeridi({ sayilar }: { sayilar: { ad: string; deger: string; not?: string; renk?: Renk }[] }) {
  return (
    <div className="grid grid-cols-2 overflow-hidden rounded-xl border border-[var(--k)] bg-[var(--kart)] @2xl:grid-cols-4">
      {sayilar.map((s, i) => (
        <div key={s.ad} className={`min-w-0 border-[var(--k)] p-3.5 ${i % 2 === 1 ? "border-l" : ""} ${i >= 2 ? "border-t @2xl:border-t-0" : ""} @2xl:[&:not(:first-child)]:border-l`}>
          <p className="text-[11.5px] text-[var(--ms)]">{s.ad}</p>
          <p className="mt-1 text-[17px] font-bold tabular-nums tracking-tight" style={{ color: s.renk ? RENK[s.renk] : "var(--m)" }}>
            {s.deger}
          </p>
          {s.not && <p className="mt-0.5 text-[11px] leading-4 text-[var(--ms)]">{s.not}</p>}
        </div>
      ))}
    </div>
  );
}
