/*
 * Canlı panelin yükleyicisi. Ön işlenen HTML'de ve ilk açılışta panelin
 * iskeleti görünür; kabuk ve sektörün panel kodu tarayıcıda ayrı parça olarak
 * gelir, sitenin diğer sayfaları bu kodu hiç indirmez.
 */
import { useEffect, useState, type ComponentType } from "react";
import { PANELLER } from "./katalog";
import type { SektorBilgi, SektorPanel } from "./tipler";

type KabukTipi = ComponentType<{ bilgi: SektorBilgi; panel: SektorPanel; gomulu?: boolean }>;

export function PanelIskeleti({ bilgi, gomulu = false }: { bilgi: SektorBilgi; gomulu?: boolean }) {
  return (
    <div aria-label="Demo panel yükleniyor" className={`flex overflow-hidden bg-[#0b0b0e] ${gomulu ? "h-full" : "h-[100svh]"}`}>
      <div className="hidden w-[232px] shrink-0 flex-col gap-2 border-r border-white/[0.07] bg-[#08080a] p-4 lg:flex">
        <div className="mb-4 flex items-center gap-2.5">
          <span className="h-[34px] w-[34px] rounded-lg" style={{ background: bilgi.renk }} />
          <span className="text-[13.5px] font-semibold text-white/80">{bilgi.firma}</span>
        </div>
        {bilgi.moduller.map((m) => (
          <span key={m.id} className="flex h-9 items-center gap-2.5 px-1 text-[13px] text-white/35">
            <m.ikon size={17} />
            {m.ad}
          </span>
        ))}
      </div>
      <div className="flex-1 p-6">
        <div className="mb-6 h-6 w-48 animate-pulse rounded bg-white/[0.06]" />
        <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className="h-28 animate-pulse rounded-xl border border-white/[0.07] bg-white/[0.03]" />
          ))}
        </div>
        <div className="mt-3 h-64 animate-pulse rounded-xl border border-white/[0.07] bg-white/[0.03]" />
      </div>
    </div>
  );
}

export default function CanliPanel({ bilgi, gomulu = false }: { bilgi: SektorBilgi; gomulu?: boolean }) {
  const [yuklu, setYuklu] = useState<{ Kabuk: KabukTipi; panel: SektorPanel } | null>(null);
  useEffect(() => {
    let iptal = false;
    Promise.all([import("./panel/Kabuk"), PANELLER[bilgi.slug]()]).then(([k, p]) => {
      if (!iptal) setYuklu({ Kabuk: k.default, panel: p.default });
    });
    return () => {
      iptal = true;
    };
  }, [bilgi.slug]);
  if (!yuklu) return <PanelIskeleti bilgi={bilgi} gomulu={gomulu} />;
  return <yuklu.Kabuk bilgi={bilgi} panel={yuklu.panel} gomulu={gomulu} />;
}
