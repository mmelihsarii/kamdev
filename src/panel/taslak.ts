/*
 * Kaydedilmemiş formlar tarayıcıda taslak olarak tutulur. Sekme kapansa,
 * oturum düşse ya da internet gitse bile yazılanlar kaybolmaz; form tekrar
 * açıldığında taslağı geri yükleme önerilir. Kayıt başarılı olunca taslak silinir.
 */
import { useEffect, useRef } from "react";

const ONEK = "kam-taslak:";

export type Taslak<T> = { veri: T; zaman: number };

export function taslakOku<T>(anahtar: string): Taslak<T> | null {
  try {
    const ham = localStorage.getItem(ONEK + anahtar);
    if (!ham) return null;
    const t = JSON.parse(ham) as Taslak<T>;
    return t && typeof t.zaman === "number" ? t : null;
  } catch {
    return null;
  }
}

export function taslakYaz<T>(anahtar: string, veri: T) {
  try {
    localStorage.setItem(ONEK + anahtar, JSON.stringify({ veri, zaman: Date.now() }));
  } catch {
    // Depolama dolu ya da kapalı; form yine çalışır, yalnızca taslak tutulamaz.
  }
}

export function taslakSil(anahtar: string) {
  try {
    localStorage.removeItem(ONEK + anahtar);
  } catch {
    // yok say
  }
}

/** Form kirliyken değeri yarım saniye gecikmeyle taslağa yazar. */
export function useTaslakYaz<T>(anahtar: string, veri: T, kirli: boolean) {
  const zamanlayici = useRef<number | undefined>(undefined);
  useEffect(() => {
    if (!kirli) return;
    window.clearTimeout(zamanlayici.current);
    zamanlayici.current = window.setTimeout(() => taslakYaz(anahtar, veri), 500);
    return () => window.clearTimeout(zamanlayici.current);
  }, [anahtar, veri, kirli]);

  // Sayfa kapanırken ya da form ekrandan kalkarken bekleyen yazımı hemen yap.
  const son = useRef({ anahtar, veri, kirli });
  son.current = { anahtar, veri, kirli };
  useEffect(() => {
    const yaz = () => son.current.kirli && taslakYaz(son.current.anahtar, son.current.veri);
    window.addEventListener("pagehide", yaz);
    return () => {
      window.removeEventListener("pagehide", yaz);
      yaz();
    };
  }, []);
}

/** İki değerin içerik olarak aynı olup olmadığı. */
export function ayniMi(a: unknown, b: unknown) {
  return JSON.stringify(a) === JSON.stringify(b);
}
