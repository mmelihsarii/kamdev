/*
 * Sektör demolarının tipleri. İki katman var:
 * SektorBilgi tanıtım sayfalarında kullanılan hafif bilgidir, ön işlemeye girer.
 * SektorPanel ise tarayıcıda ayrı parça olarak yüklenen canlı paneldir.
 */
import type { ComponentType, CSSProperties, ReactNode } from "react";

export type Ikon = ComponentType<{ size?: number; stroke?: number; className?: string; style?: CSSProperties }>;

export type ModulBilgi = {
  id: string;
  ad: string;
  ikon: Ikon;
  /** Ekran ne işe yarar, bir iki cümle. */
  ozet: string;
  ozellikler: string[];
  /** İşletmeye etkisi, panelin yan sütununda görünür. */
  kazanc: string;
  /** Ziyaretçiye bu ekranda denemesi önerilenler. */
  dene: string[];
};

export type SektorBilgi = {
  slug: string;
  ad: string;
  kisaAd: string;
  ikon: Ikon;
  renk: string;
  firma: string;
  firmaAlt: string;
  baslik: string;
  giris: string;
  kart: string;
  seo: { baslik: string; aciklama: string };
  kimler: { baslik: string; metin: string }[];
  oncesi: { once: string; sonra: string }[];
  moduller: ModulBilgi[];
  gun: { saat: string; metin: string }[];
  entegrasyonlar: { ad: string; metin: string; logo?: string }[];
  gercekIs?: { slug: string; ad: string; metin: string };
  sss: { soru: string; cevap: string }[];
  /** Liste sayfasındaki kartın küçük ekranında görünen örnek sayılar. */
  vitrin: { ad: string; deger: string }[];
};

/* ---------------- Canlı panel ---------------- */

// Kayıtlar sektörden sektöre değişir; alanları sektör dosyası bilir.
export type Kayit = { id: string } & Record<string, any>;
export type Veri = Record<string, Kayit[]>;

export type Renk = "yesil" | "sari" | "kirmizi" | "mavi" | "mor" | "gri" | "vurgu";
export type Durum = { ad: string; renk: Renk };

export type PanelApi = {
  veri: Veri;
  /** Panelin şu anki saati. Çalışma saati dışında sektörün yoğun saatine kayar. */
  ani: Date;
  bul: (koleksiyon: string, id: string) => Kayit | undefined;
  guncelle: (koleksiyon: string, id: string, degisim: Partial<Kayit>, kayitNotu?: string) => void;
  ekle: (koleksiyon: string, kayit: Kayit, basa?: boolean) => void;
  git: (modul: string, secenek?: { kayit?: string; filtre?: string }) => void;
  haber: (metin: string, tur?: "basari" | "bilgi" | "uyari") => void;
  /** Canlı akıştan gelen olay: kısa bildirim çıkar ve zilin son hareketlerine yazılır. */
  bildir: (metin: string, modul: string, kayit?: string) => void;
  /** Görev takibi; adı verilen olay bir kez olunca ilgili görev tamamlanır. */
  olay: (ad: string) => void;
  yeniId: (onek: string) => string;
};

export type Sutun = {
  ad: string;
  deger: (k: Kayit, api: PanelApi) => ReactNode;
  sirala?: (k: Kayit) => number | string;
  hiza?: "sag";
  /** Dışa aktarılan dosyaya yazılan düz değer; yoksa sıralama değeri kullanılır. */
  csv?: (k: Kayit, api: PanelApi) => string | number;
  /** 1 her genişlikte, 2 orta, 3 yalnız geniş panelde görünür. */
  oncelik?: 1 | 2 | 3;
};

export type Eylem = {
  ad: string;
  ikon?: Ikon;
  tur?: "ana" | "tehlike";
  gorunur?: (k: Kayit, api: PanelApi) => boolean;
  uygula: (k: Kayit, api: PanelApi) => void;
};

export type Filtre = { ad: string; secenekler: { ad: string; kosul: (k: Kayit, api: PanelApi) => boolean }[] };

export type FormAlani = {
  ad: string;
  anahtar: string;
  tur: "metin" | "sayi" | "secim";
  secenekler?: string[];
  varsayilan?: string;
  zorunlu?: boolean;
};

export type Form = {
  baslik: string;
  dugme: string;
  alanlar: FormAlani[] | ((api: PanelApi) => FormAlani[]);
  /** Yeni kaydı ekler, kimliğini döndürür; panel kaydı açar. */
  olustur: (degerler: Record<string, string>, api: PanelApi) => string;
};

export type Liste = {
  tur: "liste";
  koleksiyon: string;
  /** İlk sütunun başlığı; kaydın adı ve altında kısa bilgisi durur. */
  baslikAdi: string;
  /** Koleksiyonun bu ekranda görünen kısmı; kargo ekranı yalnız gönderilmiş siparişleri gösterir. */
  kapsam?: (k: Kayit, api: PanelApi) => boolean;
  baslik: (k: Kayit, api: PanelApi) => string;
  alt?: (k: Kayit, api: PanelApi) => string;
  /** Kayıt bir kişi ya da firmaysa adının baş harfleri renkli bir karede gösterilir. */
  harf?: (k: Kayit, api: PanelApi) => string;
  durum?: (k: Kayit, api: PanelApi) => Durum;
  sutunlar: Sutun[];
  arama: (k: Kayit, api: PanelApi) => string;
  filtreler?: Filtre[];
  sira?: (a: Kayit, b: Kayit) => number;
  ozet?: (api: PanelApi) => { ad: string; deger: string; not?: string; renk?: Renk }[];
  detay: {
    bolumler: (k: Kayit, api: PanelApi) => ReactNode;
    eylemler?: Eylem[];
  };
  yeni?: Form;
  /** Listenin üstünde, filtrelerin altında duran sektöre özel parça. */
  ust?: ComponentType<{ api: PanelApi }>;
};

export type Ozel = { tur: "ozel"; bilesen: ComponentType<{ api: PanelApi; modul: ModulBilgi }> };

export type PanelModulu = {
  /** SektorBilgi.moduller içindeki kimlikle aynı. */
  id: string;
  grup: string;
  rozet?: (api: PanelApi) => number;
  ekran: Liste | Ozel;
};

export type Gorev = { id: string; metin: string; ipucu: string; modul: string; olay: string };

export type Uyari = { metin: string; modul: string; filtre?: string; renk: Renk };

export type SektorPanel = {
  /**
   * Panelin gerçek saatle çalıştığı aralık ve en yoğun saat. Gerçek saat bu aralığın dışındaysa
   * (işletme kapalı ya da çok sakinken) panel yoğun saate kayar ve üst çubukta bunu söyler.
   */
  saat?: { acilis: number; kapanis: number; yogun: number };
  kullanici: { ad: string; rol: string };
  uret: (ani: Date, r: Rastgele) => Veri;
  moduller: PanelModulu[];
  arama: { koleksiyon: string; modul: string; baslik: (k: Kayit) => string; alt: (k: Kayit) => string; metin: (k: Kayit) => string }[];
  gorevler: Gorev[];
  uyarilar: (api: PanelApi) => Uyari[];
  /** Ekrandayken arada bir yeni kayıt düşürür, panel canlı görünsün. */
  canli?: { aralik: number; uret: (api: PanelApi, r: Rastgele) => void };
};

export type Rastgele = {
  kesir: () => number;
  tam: (min: number, max: number) => number;
  sec: <T>(dizi: readonly T[]) => T;
  agirlikli: <T>(secenekler: readonly (readonly [T, number])[]) => T;
  olasilik: (p: number) => boolean;
  karistir: <T>(dizi: T[]) => T[];
};
