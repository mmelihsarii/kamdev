import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import anlikVeri from "./icerik.json";
import { KOLEKSIYONLAR, type Icerik } from "./tipler";

/**
 * Derleme anındaki içerik kopyası. Ön işlenen HTML bundan üretilir, tarayıcıda
 * sayfa önce bununla açılır ve hidrasyon farkı oluşmaz.
 */
export const ANLIK = anlikVeri as Icerik;

/** Yayında olmayan öğeleri ziyaretçiden gizler. */
export function yayindaOlanlar(icerik: Icerik): Icerik {
  const sonuc = { ...icerik };
  for (const ad of KOLEKSIYONLAR) {
    (sonuc[ad] as { yayinda: boolean }[]) = (icerik[ad] as { yayinda: boolean }[]).filter((o) => o.yayinda !== false);
  }
  return sonuc;
}

const Baglam = createContext<Icerik>(yayindaOlanlar(ANLIK));

/** Canlı içeriği yönetim panelinin yazdığı API'den çeker; bulamazsa derleme kopyasıyla devam eder. */
export async function canliIcerikGetir(): Promise<Icerik | null> {
  try {
    const yanit = await fetch("/api/icerik.php", { headers: { Accept: "application/json" } });
    if (!yanit.ok) return null;
    const veri = (await yanit.json()) as Icerik;
    return veri && veri.ayarlar ? veri : null;
  } catch {
    return null;
  }
}

export function IcerikSaglayici({ children, canliCek = true }: { children: ReactNode; canliCek?: boolean }) {
  const [icerik, setIcerik] = useState<Icerik>(ANLIK);

  useEffect(() => {
    if (!canliCek) return;
    let iptal = false;
    canliIcerikGetir().then((veri) => {
      if (veri && !iptal) setIcerik(veri);
    });
    return () => {
      iptal = true;
    };
  }, [canliCek]);

  const gorunen = useMemo(() => yayindaOlanlar(icerik), [icerik]);
  return <Baglam.Provider value={gorunen}>{children}</Baglam.Provider>;
}

export function useIcerik() {
  return useContext(Baglam);
}
