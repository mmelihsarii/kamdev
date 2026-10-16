/*
 * Demolar listesindeki kart. Üstte panelin küçük bir çizimi durur: firma,
 * menüdeki ilk ekranlar ve birkaç örnek sayı. Çizim süs; asıl bilgi altta yazılı.
 */
import { IconArrowRight, IconArrowsMaximize } from "@tabler/icons-react";
import { demoYolu, panelYolu } from "./katalog";
import type { SektorBilgi } from "./tipler";

export function MiniPanel({ s }: { s: SektorBilgi }) {
  // Çubuk yükseklikleri sektörün adından türetilir; her kartta farklı ama her açılışta aynı.
  const cubuklar = Array.from({ length: 12 }, (_, i) => 30 + ((s.slug.charCodeAt(i % s.slug.length) * (i + 7)) % 60));
  return (
    <div aria-hidden="true" className="relative overflow-hidden rounded-xl border border-white/[0.08] bg-[#0b0b0e]">
      <div className="flex h-7 items-center gap-1.5 border-b border-white/[0.06] bg-[#08080a] px-3">
        <span className="h-2 w-2 rounded-full bg-white/15" />
        <span className="h-2 w-2 rounded-full bg-white/15" />
        <span className="h-2 w-2 rounded-full bg-white/15" />
      </div>
      <div className="flex">
        <div className="hidden w-[38%] shrink-0 border-r border-white/[0.06] bg-[#08080a] p-3 sm:block">
          <div className="mb-3 flex items-center gap-2">
            <span className="h-5 w-5 rounded-md" style={{ background: s.renk }} />
            <span className="truncate text-[10.5px] font-semibold text-white/80">{s.firma}</span>
          </div>
          {s.moduller.slice(0, 5).map((m, i) => (
            <span key={m.id} className={`mb-1 flex items-center gap-1.5 rounded-md px-1.5 py-1 text-[10px] ${i === 0 ? "bg-white/[0.07] text-white/85" : "text-white/40"}`}>
              <m.ikon size={11} style={{ color: i === 0 ? s.renk : undefined }} />
              <span className="truncate">{m.ad}</span>
            </span>
          ))}
        </div>
        <div className="min-w-0 flex-1 p-3">
          <div className="grid grid-cols-3 gap-1.5">
            {s.vitrin.map((v) => (
              <span key={v.ad} className="rounded-md border border-white/[0.06] bg-white/[0.025] p-1.5">
                <span className="block truncate text-[8.5px] text-white/40">{v.ad}</span>
                <span className="mt-0.5 block truncate text-[11px] font-bold text-white/90">{v.deger}</span>
              </span>
            ))}
          </div>
          <div className="mt-2 flex h-16 items-end gap-[3px] rounded-md border border-white/[0.06] bg-white/[0.02] p-1.5">
            {cubuklar.map((h, i) => (
              <span
                key={i}
                className="flex-1 origin-bottom rounded-[2px] transition-[transform,opacity] duration-500 ease-out group-hover:scale-y-[1.12] group-hover:opacity-90"
                style={{ height: `${h}%`, background: s.renk, opacity: i === cubuklar.length - 1 ? 0.95 : 0.55, transitionDelay: `${i * 25}ms` }}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function DemoKarti({ s, kucuk = false }: { s: SektorBilgi; kucuk?: boolean }) {
  return (
    <article className="kutu kutu-hareketli group flex h-full flex-col p-4 sm:p-5">
      <a href={demoYolu(s.slug)} tabIndex={-1} aria-hidden="true" className="block">
        <MiniPanel s={s} />
      </a>
      <div className="mt-5 flex items-center gap-2.5">
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg" style={{ background: `${s.renk}22`, color: s.renk }}>
          <s.ikon size={19} aria-hidden="true" />
        </span>
        <h3 className="text-[18px] font-bold tracking-tight text-white">
          <a href={demoYolu(s.slug)} className="after:absolute after:inset-0 after:content-[''] focus:outline-none">
            {s.ad}
          </a>
        </h3>
      </div>
      {!kucuk && <p className="mt-3 text-[15px] leading-7 text-neutral-300">{s.kart}</p>}
      <p className="mt-3 text-[13px] leading-6 text-neutral-500">
        {s.moduller.length} ekran. {s.moduller.slice(1).map((m) => m.ad).join(", ")}.
      </p>
      <div className="relative z-10 mt-auto flex flex-wrap items-center gap-x-5 gap-y-2 pt-5">
        <a href={demoYolu(s.slug)} className="inline-flex min-h-10 items-center gap-1.5 text-sm font-semibold text-white transition-colors hover:text-vurgu">
          Neler yapıyor
          <IconArrowRight size={16} aria-hidden="true" className="transition-transform group-hover:translate-x-0.5" />
        </a>
        <a href={panelYolu(s.slug)} className="inline-flex min-h-10 items-center gap-1.5 text-sm font-medium text-neutral-400 transition-colors hover:text-white">
          <IconArrowsMaximize size={15} aria-hidden="true" />
          Paneli doğrudan aç
        </a>
      </div>
    </article>
  );
}
