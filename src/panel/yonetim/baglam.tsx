/* Yönetim panelinin elindeki site içeriği. Bir kez yüklenir, her kayıttan sonra yerinde güncellenir. */
import { createContext, useContext } from "react";
import type { Ayarlar, KoleksiyonAdi } from "../../veri/tipler";
import type { YonetimIcerigi } from "../api";

type Oge = Record<string, unknown> & { kimlik: string };

export type IcerikBaglami = {
  icerik: YonetimIcerigi;
  ogeKaydedildi: (koleksiyon: KoleksiyonAdi, oge: Oge, zaman: string, eskiKimlik?: string) => void;
  ogeSilindi: (koleksiyon: KoleksiyonAdi, kimlik: string) => void;
  siraDegisti: (koleksiyon: KoleksiyonAdi, liste: Oge[]) => void;
  ayarlarKaydedildi: (ayarlar: Ayarlar, zaman: string) => void;
  yenile: () => Promise<void>;
};

export const YonetimBaglam = createContext<IcerikBaglami | null>(null);

export function useYonetimIcerik() {
  const b = useContext(YonetimBaglam);
  if (!b) throw new Error("useYonetimIcerik yalnızca panel içinde kullanılabilir");
  return b;
}

/** Panel içi bağlantılar: #/icerik/yazilar gibi. */
export function git(hedef: string) {
  window.location.hash = hedef.startsWith("#") ? hedef : `#${hedef}`;
}
