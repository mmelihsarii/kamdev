/* Müşteri paneli. Kodu yalnızca bu sayfa açıldığında yüklenir. */
import { lazy, Suspense, useEffect, useState } from "react";
import { PanelBekleme } from "./YonetimSayfasi";

const Portal = lazy(() => import("../panel/musteri/Portal"));

export default function MusteriSayfasi() {
  const [hazir, setHazir] = useState(false);
  useEffect(() => setHazir(true), []);
  if (!hazir) return <PanelBekleme />;
  return (
    <Suspense fallback={<PanelBekleme />}>
      <Portal />
    </Suspense>
  );
}
