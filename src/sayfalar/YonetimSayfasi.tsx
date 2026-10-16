/*
 * Yönetim paneli. Ön işlenen HTML'de yalnızca bekleme ekranı bulunur; panel
 * kodu tarayıcıda ayrı bir parça olarak yüklenir, ziyaretçinin sitesini ağırlaştırmaz.
 */
import { lazy, Suspense, useEffect, useState } from "react";

const Panel = lazy(() => import("../panel/yonetim/Panel"));

export function PanelBekleme() {
  return (
    <div className="flex min-h-[100svh] items-center justify-center">
      <span className="text-[26px] font-bold leading-none tracking-[-0.07em] text-white/30">KAM</span>
    </div>
  );
}

export default function YonetimSayfasi() {
  const [hazir, setHazir] = useState(false);
  useEffect(() => setHazir(true), []);
  if (!hazir) return <PanelBekleme />;
  return (
    <Suspense fallback={<PanelBekleme />}>
      <Panel />
    </Suspense>
  );
}
