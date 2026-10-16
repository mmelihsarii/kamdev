import { lazy, Suspense, useEffect, useState } from "react";
import type { Application } from "@splinetool/runtime";

const Spline = lazy(() => import("@splinetool/react-spline"));
const SAHNE_ADRESI = "https://prod.spline.design/HjVm7wuHDMxk8Era/scene.splinecode";

type SplineMetni = {
  data?: {
    geometry?: {
      text?: string | { textValue?: string };
    };
  };
  textGeometry?: {
    setText: (metin: string, varliklar: unknown) => Promise<void>;
  };
};

type DahiliSpline = Application & {
  _scene?: {
    traverseEntity: (islem: (nesne: SplineMetni) => void) => void;
  };
  _sharedAssetsManager?: unknown;
};

// Sahnedeki 3B yazılar boşaltılır. Başlık, Roboto ile HTML olarak Hero bileşeninde çizilir.
const METINLER = new Map([
  ["Clarity. Focus. Impact.", " "],
  ["We turn complex ideas into effortless experiences", " "],
]);

async function metinleriGuncelle(spline: Application) {
  const dahili = spline as DahiliSpline;
  if (!dahili._scene || !dahili._sharedAssetsManager) return;

  const islemler: Promise<void>[] = [];

  dahili._scene.traverseEntity((nesne) => {
    const metin = nesne.data?.geometry?.text;
    const mevcutMetin = typeof metin === "string" ? undefined : metin?.textValue;
    const yeniMetin = mevcutMetin ? METINLER.get(mevcutMetin) : undefined;

    if (yeniMetin === undefined) return;
    // Boşluğa çevirmek her sürümde işlemiyor; yazı nesnesi doğrudan gizlenir.
    const gorunur = nesne as { visible?: boolean };
    if ("visible" in gorunur) gorunur.visible = false;
    if (yeniMetin.trim() && nesne.textGeometry) {
      islemler.push(nesne.textGeometry.setText(yeniMetin, dahili._sharedAssetsManager));
    }
  });

  await Promise.allSettled(islemler);
  spline.requestRender();
}

export default function SplineArkaPlan() {
  // Sahne yalnızca tarayıcıda yüklenir; ön işlemede (sunucuda) boş kutu basılır.
  const [hazir, setHazir] = useState(false);
  // Sahnedeki İngilizce yazılar boşaltılana kadar sahne görünmez, sonra yumuşakça belirir.
  const [gorunur, setGorunur] = useState(false);
  useEffect(() => setHazir(true), []);

  return (
    <div
      aria-hidden="true"
      className={`absolute inset-0 z-[2] overflow-hidden transition-opacity duration-1000 ${gorunur ? "opacity-100" : "opacity-0"}`}
    >
      {hazir && (
        <Suspense fallback={null}>
          <Spline
            scene={SAHNE_ADRESI}
            className="h-full w-full"
            onLoad={(spline) => void metinleriGuncelle(spline).finally(() => setGorunur(true))}
          />
        </Suspense>
      )}
    </div>
  );
}
