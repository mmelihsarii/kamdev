/*
 * Sitenin bütün içerik tipleri. Aynı yapı hem derleme anındaki kopyada
 * (icerik.json) hem de yönetim panelinin yazdığı veritabanında kullanılır.
 */

/** Her koleksiyon öğesinin ortak alanları. */
export type Temel = {
  kimlik: string;
  yayinda: boolean;
};

export type SoruCevap = { soru: string; cevap: string };

export type Proje = Temel & {
  /** Ayrıntı sayfasının adresi; boşsa kimlik kullanılır. */
  slug?: string;
  ad: string;
  konum: string;
  ozet: string;
  alan: string;
  yil: string;
  etiketler: string[];
  /** İşin sayfasında logolarıyla görünen teknolojiler; adlar teknoloji koleksiyonundaki adlarla eşleşir. */
  teknolojiler?: string[];
  adres?: string;
  vurgu?: string;
  sunum?: "telefon";
  /** Ad İngilizceyse kartta büyük harfe çevrilirken i harfi İ olmasın. */
  adDili?: "en";
  /** Kartta, ana sayfada ve işin sayfasının üstünde 16:9 duran kapak. */
  kapak?: string;
  /** Ana sayfadaki "Bize güvenenler" şeridinde gri görünen müşteri logosu. */
  logo?: string;
  gorseller?: string[];
  /** Kartın ekranında oynayan kaydırma videosu (scripts/is-videosu.mjs); kapağı aynı adlı .jpg. */
  video?: string;
  /** Kart ve iş sayfasındaki cihaz sahnesine vurulan ışığın rengi; markanın ana rengi. Boşsa sahne gri kalır. */
  vitrinRengi?: string;
  /** Ayrıntı sayfasındaki uzun anlatım; blog yazılarıyla aynı işaretleme. */
  icerik?: string;
  yapilanlar?: string[];
  rakamlar?: { deger: string; etiket: string }[];
  seoBaslik?: string;
  seoAciklama?: string;
};

export type Hizmet = Temel & {
  slug: string;
  baslik: string;
  vitrinBaslik: string;
  vitrinAciklama: string;
  seoBaslik: string;
  seoAciklama: string;
  ust?: string;
  giris: string;
  kisaCevap: string;
  kimlerIcin: string[];
  dahil: { baslik: string; aciklama: string }[];
  baslangicFiyati: string;
  fiyatNotu: string;
  fiyatEtkenleri: string[];
  teslimSuresi: string;
  ornekProje?: { ad: string; ozet: string; adres?: string };
  sss: SoruCevap[];
  ilgiliYazilar: string[];
  /** Hizmetler sayfasındaki kartın ve hizmet sayfasının başlığının yanındaki fotoğraf. */
  gorsel?: { src: string; alt: string };
  /** Kartlarda, hizmetler sayfasında ve hizmetin sayfasında kullanılan vurgu rengi. */
  renk?: string;
};

export const BLOG_KATEGORILERI = ["Fiyatlar", "E ticaret", "Mobil", "SEO ve GEO", "Rehber"] as const;

export const KATEGORI_RENGI: Record<string, string> = {
  Fiyatlar: "#e2462d",
  "E ticaret": "#f59e0b",
  Mobil: "#38bdf8",
  "SEO ve GEO": "#34d399",
  Rehber: "#a78bfa",
};

export function kategoriRengi(kategori: string) {
  return KATEGORI_RENGI[kategori] ?? "#e2462d";
}

export type Yazi = Temel & {
  slug: string;
  baslik: string;
  seoBaslik?: string;
  aciklama: string;
  kategori: string;
  tarih: string;
  guncelleme?: string;
  gorsel: { src: string; alt: string };
  kisaCevap: string;
  icerik: string;
  sss: SoruCevap[];
  ilgiliHizmet?: string;
};

export type Sss = Temel & SoruCevap;

export type Adim = Temel & {
  numara?: string;
  baslik: string;
  aciklama: string;
  sure: string;
};

export type Ilke = Temel & {
  ikon: string;
  baslik: string;
  aciklama: string;
};

export type Teknoloji = Temel & {
  ad: string;
  ikon: string;
  renk: string;
  kategori: string;
  /** Koyu çizilmiş logo; koyu zeminde açık tona çevrilir. */
  acikTon: boolean;
};

export type Bolum = {
  etiket: string;
  baslik: string;
  aciklama: string;
  vurgu?: string;
  altBaslik?: string;
  donusSuresi?: string;
  konular?: string[];
  kayanYazilar?: string[];
  /** Süreç sayfası: süreç boyunca verilenler, sizden gerekenler ve sorular. */
  kalemler?: { baslik: string; aciklama: string }[];
  /** Süreç hikâyesinin son adımı; yayından sonra ölçülenler ve araçlar. */
  olcme?: { baslik: string; metin: string; ogeler: string[] };
  gerekenler?: string[];
  sorular?: SoruCevap[];
};

export type SiteBilgisi = {
  ad: string;
  tamAd: string;
  adres: string;
  eposta: string;
  konum: string;
  aciklama: string;
  kisaAciklama: string;
  dil: string;
  fiyatGoster: boolean;
  /** WhatsApp numarası, ülke koduyla. Boşsa sağ alttaki düğme görünmez. */
  whatsapp?: string;
};

export type Ayarlar = {
  site: SiteBilgisi;
  hero: {
    etiket?: string;
    baslikUst: string;
    aciklama: string;
    birincilDugme: string;
    ikincilDugme: string;
  };
  bolumler: Record<
    "logoSeridi" | "blog" | "hizmetler" | "isler" | "teknolojiler" | "vitrin" | "surec" | "ilkeler" | "sss" | "iletisim" | "teklif" | "blogSayfasi" | "islerSayfasi" | "hizmetlerSayfasi" | "surecSayfasi",
    Bolum
  >;
  laptopKelimeleri: { on: string; kelimeler: string[] };
  vitrinGorselleri: string[];
  teknolojiSecki: { baslik: string; renk: string; adlar: string[] }[];
};

export type Icerik = {
  surum: number;
  ayarlar: Ayarlar;
  projeler: Proje[];
  hizmetler: Hizmet[];
  yazilar: Yazi[];
  sss: Sss[];
  surec: Adim[];
  ilkeler: Ilke[];
  teknolojiler: Teknoloji[];
};

export type KoleksiyonAdi = "projeler" | "hizmetler" | "yazilar" | "sss" | "surec" | "ilkeler" | "teknolojiler";

export const KOLEKSIYONLAR: KoleksiyonAdi[] = ["projeler", "hizmetler", "yazilar", "sss", "surec", "ilkeler", "teknolojiler"];
