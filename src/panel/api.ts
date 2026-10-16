/* Panel istekleri. Bütün yazma istekleri X-KAM başlığı taşır; sunucu bunu sahte isteklere karşı arar. */
import type { Icerik, KoleksiyonAdi } from "../veri/tipler";

/** Oturum düştüğünde panel giriş ekranına döner; açık formlar taslakta kalır. */
export const OTURUM_DUSTU = "kam-oturum-dustu";

export class ApiHatasi extends Error {
  constructor(
    mesaj: string,
    public kod: number,
  ) {
    super(mesaj);
  }
}

async function cevapla<T>(yanit: Response, dustuBildir = true): Promise<T> {
  let veri: unknown = null;
  try {
    veri = await yanit.json();
  } catch {
    // Gövdesiz ya da JSON olmayan yanıt
  }
  if (!yanit.ok) {
    if (yanit.status === 401 && dustuBildir && typeof window !== "undefined") window.dispatchEvent(new Event(OTURUM_DUSTU));
    const mesaj = (veri as { hata?: string } | null)?.hata ?? `Sunucu hatası (${yanit.status})`;
    throw new ApiHatasi(mesaj, yanit.status);
  }
  return veri as T;
}

export async function istek<T = unknown>(dosya: string, govde: Record<string, unknown>): Promise<T> {
  let yanit: Response;
  try {
    yanit = await fetch(`/api/${dosya}`, {
      method: "POST",
      credentials: "same-origin",
      headers: { "Content-Type": "application/json", "X-KAM": "1" },
      body: JSON.stringify(govde),
    });
  } catch {
    throw new ApiHatasi("Sunucuya ulaşılamadı. İnternet bağlantınızı kontrol edin.", 0);
  }
  // Giriş ekranındaki yanlış şifre oturum düşmesi sayılmaz.
  return cevapla<T>(yanit, dosya !== "oturum.php");
}

export async function oku<T = unknown>(dosya: string): Promise<T> {
  const yanit = await fetch(`/api/${dosya}`, { credentials: "same-origin" });
  return cevapla<T>(yanit, false);
}

export type YuklenenDosya = { id: number; ad: string; tur: string; adres: string; genislik?: number | null; yukseklik?: number | null };

export async function dosyaYukle(dosya: File, secenek: { ozel?: boolean; projeId?: number } = {}): Promise<YuklenenDosya> {
  const form = new FormData();
  form.append("dosya", dosya);
  form.append("ozel", secenek.ozel ? "1" : "0");
  if (secenek.projeId) form.append("proje_id", String(secenek.projeId));
  let yanit: Response;
  try {
    yanit = await fetch("/api/yukle.php", { method: "POST", credentials: "same-origin", headers: { "X-KAM": "1" }, body: form });
  } catch {
    throw new ApiHatasi("Sunucuya ulaşılamadı. İnternet bağlantınızı kontrol edin.", 0);
  }
  return cevapla<YuklenenDosya>(yanit);
}

export type Kullanici = { id: number; eposta: string; ad: string; firma: string; telefon: string; rol: "yonetici" | "musteri" };
export type OturumDurumu = { kullanici: Kullanici | null; kurulum: boolean };

export const oturum = {
  durum: () => oku<OturumDurumu>("oturum.php"),
  giris: (eposta: string, sifre: string) => istek<{ kullanici: Kullanici }>("oturum.php", { islem: "giris", eposta, sifre }),
  kurulum: (ad: string, eposta: string, sifre: string) => istek<{ kullanici: Kullanici }>("oturum.php", { islem: "kurulum", ad, eposta, sifre }),
  cikis: () => istek("oturum.php", { islem: "cikis" }),
  sifre: (eski: string, yeni: string) => istek("oturum.php", { islem: "sifre", eski, yeni }),
};

export const yonetim = <T = unknown>(islem: string, veri: Record<string, unknown> = {}) => istek<T>("yonetim.php", { islem, ...veri });
export const musteri = <T = unknown>(islem: string, veri: Record<string, unknown> = {}) => istek<T>("musteri.php", { islem, ...veri });

/* Müşteri projesi tipleri */
export type ProjeDosyasi = { id: number; ad: string; tur: string; adres: string };
export type ProjeGuncellemesi = { id: number; proje_id?: number; tarih: string; baslik: string; aciklama: string; asama: number | null; dosyalar: ProjeDosyasi[] };
export type ProjeSorunu = { id: number; proje_id?: number; tur: "sorun" | "risk" | "bekleyen"; baslik: string; aciklama: string; durum: "acik" | "cozuldu"; guncelleme?: string };
export type MusteriProjesi = {
  id: number;
  musteri_id?: number;
  musteri_ad?: string;
  musteri_firma?: string;
  musteri_eposta?: string;
  ad: string;
  ozet: string;
  asama: number;
  ilerleme: number;
  sorumlu: string;
  teknolojiler: string[];
  onizleme: string;
  canli: string;
  baslangic: string;
  teslim: string;
  durum: "devam" | "beklemede" | "tamamlandi";
  notlar?: string;
  son_guncelleme?: string | null;
  acik_sorun?: number;
  guncellemeler?: ProjeGuncellemesi[];
  sorunlar?: ProjeSorunu[];
};
export type Asama = { baslik: string; aciklama: string; sure: string };

export const DURUM_ADI: Record<MusteriProjesi["durum"], string> = { devam: "Devam ediyor", beklemede: "Beklemede", tamamlandi: "Tamamlandı" };
export const SORUN_TURU_ADI: Record<ProjeSorunu["tur"], string> = { sorun: "Sorun", risk: "Risk", bekleyen: "Sizden beklenen" };

function tarihCoz(iso: string) {
  // Sunucu mikro saniyeli damga da gönderebilir; tarayıcılar milisaniyeden fazlasını sevmiyor.
  const duz = iso.length === 10 ? iso + "T12:00:00" : iso.replace(/(\.\d{3})\d+/, "$1");
  return new Date(duz);
}

export function tarihGoster(iso?: string | null) {
  if (!iso) return "";
  const t = tarihCoz(iso);
  if (Number.isNaN(t.getTime())) return iso;
  return t.toLocaleDateString("tr-TR", { day: "numeric", month: "long", year: "numeric" });
}

export function tarihSaatGoster(iso?: string | null) {
  if (!iso) return "";
  const t = tarihCoz(iso);
  if (Number.isNaN(t.getTime())) return iso;
  return t.toLocaleString("tr-TR", { day: "numeric", month: "long", year: "numeric", hour: "2-digit", minute: "2-digit" }).replace(":", ".");
}

/** "3 gün önce" gibi göreli zaman. */
export function onceGoster(iso?: string | null) {
  if (!iso) return "";
  const t = tarihCoz(iso).getTime();
  if (Number.isNaN(t)) return "";
  const dk = Math.round((Date.now() - t) / 60000);
  if (dk < 1) return "az önce";
  if (dk < 60) return `${dk} dakika önce`;
  const sa = Math.round(dk / 60);
  if (sa < 24) return `${sa} saat önce`;
  const gun = Math.round(sa / 24);
  if (gun < 31) return `${gun} gün önce`;
  return tarihGoster(iso);
}

/** Yalnızca gün bilgisi olan tarihler için: bugün, dün, 3 gün önce. */
export function gunOnceGoster(gun?: string | null) {
  if (!gun) return "";
  const t = new Date(gun.slice(0, 10) + "T00:00:00");
  if (Number.isNaN(t.getTime())) return "";
  const bugun = new Date();
  bugun.setHours(0, 0, 0, 0);
  const fark = Math.round((bugun.getTime() - t.getTime()) / 86400000);
  if (fark <= 0) return "bugün";
  if (fark === 1) return "dün";
  if (fark < 31) return `${fark} gün önce`;
  return tarihGoster(gun);
}

export function boyutGoster(bayt: number) {
  if (bayt < 1024) return `${bayt} bayt`;
  if (bayt < 1024 * 1024) return `${Math.round(bayt / 1024)} KB`;
  return `${(bayt / 1024 / 1024).toFixed(1).replace(".", ",")} MB`;
}

/* Yönetim tipleri */
export type Zamanlar = { ayarlar: string | null; ogeler: Partial<Record<KoleksiyonAdi, Record<string, string>>> };
export type YonetimIcerigi = Icerik & { zamanlar: Zamanlar };

export type Ozet = {
  yeniTalep: number;
  musteri: number;
  aktifProje: number;
  yazi: number;
  medya: number;
  sonIcerikGuncelleme: string | null;
  sonYedek: string | null;
  veriKlasoru: string;
};

export type Talep = { id: number; konu: string; ad: string; firma: string; iletisim: string; mesaj: string; ip: string; durum: "yeni" | "okundu" | "donuldu"; olusturma: string };
export const TALEP_DURUMU: Record<Talep["durum"], string> = { yeni: "Yeni", okundu: "Okundu", donuldu: "Dönüldü" };

export type HesapSatiri = Kullanici & { aktif: number; olusturma: string; son_giris: string | null; proje_sayisi: number };

export type MedyaDosyasi = { id: number; ad: string; yol: string; tur: string; boyut: number; genislik: number | null; yukseklik: number | null; olusturma: string; adres: string };

export type GunlukYedek = { ad: string; boyut: number; tarih: string };

export type CopKaydi = { id: number; tur: "oge" | "talep" | "kullanici" | "proje" | "guncelleme" | "sorun"; baslik: string; silen: string; silinme: string };
export const COP_TURU: Record<CopKaydi["tur"], string> = {
  oge: "Site içeriği",
  talep: "Talep",
  kullanici: "Hesap",
  proje: "Müşteri projesi",
  guncelleme: "Proje güncellemesi",
  sorun: "Sorun ya da risk",
};
