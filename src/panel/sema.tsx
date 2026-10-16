/*
 * Panelde düzenlenen her şeyin alan tarifleri. Yeni bir alan eklemek için
 * yalnızca buraya bir satır yazmak yeter; form kendiliğinden çizilir.
 */
import { BLOG_KATEGORILERI, type Ayarlar, type Icerik, type KoleksiyonAdi } from "../veri/tipler";
import { hizmetYolu, isYolu, yaziYolu } from "../veri/yardimci";
import type { AlanTanimi, Secenek } from "./Form";

type Oge = Record<string, unknown> & { kimlik?: string; yayinda?: boolean };

export type KoleksiyonTanimi = {
  ad: KoleksiyonAdi;
  baslik: string;
  tekil: string;
  aciklama: string;
  alanlar: AlanTanimi[];
  ozet: (oge: Oge) => { baslik: string; alt?: string; gorsel?: string; logo?: boolean };
  yeni: () => Oge;
  adres?: (oge: Oge) => string | undefined;
  /** Liste boyunca sitede görünme sırası anlamlı mı */
  sirali: boolean;
};

const yazilarSecenek = (i: Icerik): Secenek[] => i.yazilar.map((y) => ({ deger: y.slug, ad: y.baslik }));
const hizmetlerSecenek = (i: Icerik): Secenek[] => i.hizmetler.map((h) => ({ deger: h.slug, ad: h.baslik }));
const teknolojiSecenek = (i: Icerik): Secenek[] => i.teknolojiler.map((t) => ({ deger: t.ad, ad: t.ad }));

const SSS_ALANLARI: AlanTanimi[] = [
  { tur: "metin", ad: "soru", etiket: "Soru", genis: true },
  { tur: "uzun", ad: "cevap", etiket: "Cevap", satir: 3 },
];

const bugun = () => new Date().toISOString().slice(0, 10);
const s = (v: unknown) => (typeof v === "string" ? v : "");

export const KOLEKSIYON_TANIMLARI: Record<KoleksiyonAdi, KoleksiyonTanimi> = {
  yazilar: {
    ad: "yazilar",
    baslik: "Blog yazıları",
    tekil: "Yazı",
    aciklama: "Blog sayfasında ve ana sayfadaki blog bölümünde görünen makaleler. En üstteki yazı ana sayfada en önde durur.",
    sirali: true,
    ozet: (o) => ({
      baslik: s(o.baslik) || "Başlıksız yazı",
      alt: [s(o.kategori), s(o.tarih) && new Date(s(o.tarih) + "T12:00:00").toLocaleDateString("tr-TR", { day: "numeric", month: "long", year: "numeric" })]
        .filter(Boolean)
        .join(", "),
      gorsel: (o.gorsel as { src?: string } | undefined)?.src,
    }),
    adres: (o) => (o.slug ? yaziYolu(s(o.slug)) : undefined),
    yeni: () => ({ yayinda: false, baslik: "", slug: "", kategori: BLOG_KATEGORILERI[0], tarih: bugun(), aciklama: "", kisaCevap: "", icerik: "", gorsel: { src: "", alt: "" }, sss: [] }),
    alanlar: [
      { tur: "metin", ad: "baslik", etiket: "Başlık", zorunlu: true, genis: true, sinir: 90 },
      { tur: "metin", ad: "slug", etiket: "Sayfa adresi", onEk: "/blog/", ipucu: "Boş bırakırsan başlıktan üretilir. Yayına aldıktan sonra değiştirme, eski bağlantılar kırılır." },
      { tur: "secim", ad: "kategori", etiket: "Kategori", secenekler: BLOG_KATEGORILERI.map((k) => ({ deger: k, ad: k })) },
      { tur: "tarih", ad: "tarih", etiket: "Yayın tarihi" },
      { tur: "tarih", ad: "guncelleme", etiket: "Son güncelleme tarihi", ipucu: "Yazıyı sonradan epey değiştirdiysen o günün tarihini gir. Google bunu görür." },
      {
        tur: "nesne",
        ad: "gorsel",
        etiket: "Kapak görseli",
        alanlar: [
          { tur: "gorsel", ad: "src", etiket: "Görsel", genis: true, oran: 16 / 10, ipucu: "Blog kartlarında ve yazının sayfasında 16:10 oranında görünür. Seçtiğin görsel bu orana kırpılır." },
          { tur: "metin", ad: "alt", etiket: "Görselin tarifi", genis: true, ipucu: "Görmeyen ziyaretçiler ve Google için görselde ne olduğunu bir cümleyle yaz." },
        ],
      },
      { tur: "uzun", ad: "aciklama", etiket: "Kısa açıklama", sinir: 160, satir: 2, ipucu: "Blog kartında ve Google sonuçlarında başlığın altında görünür." },
      {
        tur: "uzun",
        ad: "kisaCevap",
        etiket: "Kısa cevap",
        satir: 3,
        ipucu: "Yazının sorduğu soruya iki üç cümlelik net cevap. Yazının başında kutu içinde görünür, yapay zekâ aramaları en çok bunu alıntılar.",
      },
      { tur: "makale", ad: "icerik", etiket: "Yazının metni" },
      { tur: "nesneler", ad: "sss", etiket: "Sık sorulan sorular", ogeAdi: "Soru", baslikAlani: "soru", alanlar: SSS_ALANLARI, ipucu: "Yazının sonunda görünür ve Google için soru cevap olarak işaretlenir." },
      { tur: "secim", ad: "ilgiliHizmet", etiket: "İlgili hizmet", bos: "Seçilmedi", secenekler: hizmetlerSecenek, ipucu: "Yazının sonunda bu hizmete yönlendiren bir kart çıkar." },
      { tur: "metin", ad: "seoBaslik", etiket: "Google başlığı", sinir: 60, ipucu: "Boş bırakırsan yazının başlığı kullanılır." },
    ],
  },

  projeler: {
    ad: "projeler",
    baslik: "Referans işler",
    tekil: "Referans iş",
    aciklama: "Her işin kendi sayfası var, hepsi İşler sayfasında listelenir. Listedeki ilk dört iş ana sayfada da görünür.",
    sirali: true,
    ozet: (o) => ({ baslik: s(o.ad) || "Adsız iş", alt: [s(o.alan), s(o.konum), s(o.yil)].filter(Boolean).join(", "), gorsel: s(o.kapak) || (o.gorseller as string[] | undefined)?.[0] }),
    adres: (o) => (o.slug || o.kimlik ? isYolu({ slug: s(o.slug), kimlik: s(o.kimlik) }) : undefined),
    yeni: () => ({ yayinda: false, slug: "", ad: "", konum: "", alan: "", yil: String(new Date().getFullYear()), ozet: "", etiketler: [], teknolojiler: [], gorseller: [], icerik: "", yapilanlar: [], rakamlar: [] }),
    alanlar: [
      { tur: "metin", ad: "ad", etiket: "Proje adı", zorunlu: true },
      { tur: "secim", ad: "adDili", etiket: "Adın dili", bos: "Türkçe", secenekler: [{ deger: "en", ad: "İngilizce" }], ipucu: "Kartta ad büyük harfle yazılır. Longevity gibi İngilizce adlarda i harfi noktalı çıkmasın diye İngilizce seç." },
      { tur: "metin", ad: "slug", etiket: "Sayfa adresi", onEk: "/isler/", ipucu: "Boş bırakırsan proje adından üretilir. Yayına aldıktan sonra değiştirme." },
      { tur: "metin", ad: "alan", etiket: "Alan", yerTutucu: "E ticaret" },
      { tur: "metin", ad: "konum", etiket: "Şehir", yerTutucu: "İstanbul" },
      { tur: "metin", ad: "yil", etiket: "Yıl" },
      { tur: "uzun", ad: "ozet", etiket: "Kısa anlatım", satir: 3, ipucu: "Kartta ve işin sayfasının en üstünde görünür. İki üç cümle yeter." },
      { tur: "metin", ad: "adres", etiket: "Canlı site adresi", yerTutucu: "ornek.com" },
      { tur: "liste", ad: "etiketler", etiket: "Özellikler", ogeAdi: "Etiket", ipucu: "Teknoloji seçilmemişse işin sayfasında bunlar listelenir." },
      {
        tur: "coklu",
        ad: "teknolojiler",
        etiket: "Kullanılan teknolojiler",
        ogeAdi: "Teknoloji",
        secenekler: teknolojiSecenek,
        ipucu: "İşin sayfasında logolarıyla görünür. Listede olmayan bir araç için önce Teknolojiler bölümüne logosunu ekle.",
      },
      { tur: "gorsel", ad: "kapak", etiket: "Kapak görseli", genis: true, oran: 16 / 9, ipucu: "İşler sayfasındaki kartta, ana sayfada ve işin sayfasının en üstünde 16:9 oranında görünür. Seçtiğin görsel bu orana kırpılır." },
      { tur: "gorsel", ad: "logo", etiket: "Müşteri logosu", genis: true, ipucu: "Ana sayfadaki Bize güvenenler şeridinde gri olarak kayar. Şeffaf zeminli PNG ya da SVG yükle; renkli logo sitede griye çevrilir. Boş bırakırsan şeritte görünmez." },
      { tur: "gorseller", ad: "gorseller", etiket: "Ekran görüntüleri", ipucu: "İşin sayfasının altında galeri olarak görünür. Kapak seçilmemişse ilk görüntü kartta cihaz çerçevesinin içinde gösterilir." },
      { tur: "metin", ad: "video", etiket: "Kaydırma videosu", yerTutucu: "/isler/video/zenomax.mp4", ipucu: "Yalnızca kapak görseli seçilmemişse kullanılır; kartın ekranında, fare üstüne gelince sayfa aşağı kayar. Videoyu scripts klasöründeki is videosu aracı üretir." },
      { tur: "renk", ad: "vitrinRengi", etiket: "Vitrin rengi", ipucu: "İşin sayfasının başlığının arkasındaki ışığın rengi. Markanın ana rengini seç." },
      {
        tur: "nesneler",
        ad: "rakamlar",
        etiket: "Öne çıkan rakamlar",
        ogeAdi: "Rakam",
        baslikAlani: "deger",
        ipucu: "İşin sayfasında büyük yazılır. Örneğin 8.962 ve altında ürün.",
        alanlar: [
          { tur: "metin", ad: "deger", etiket: "Rakam", yerTutucu: "8.962" },
          { tur: "metin", ad: "etiket", etiket: "Altındaki yazı", yerTutucu: "ürün" },
        ],
      },
      { tur: "liste", ad: "yapilanlar", etiket: "Neler yaptık", ogeAdi: "Madde", ipucu: "İşin sayfasının sağında madde madde görünür." },
      { tur: "makale", ad: "icerik", etiket: "Proje hakkında", ipucu: "İşin sayfasındaki uzun anlatım. Müşteri kim, sorun neydi, nasıl çözdük." },
      {
        tur: "secim",
        ad: "sunum",
        etiket: "Görsel nasıl sunulsun",
        secenekler: [
          { deger: "", ad: "Ekran görüntüsü olarak" },
          { deger: "telefon", ad: "Telefon çerçevesinde" },
        ],
        ipucu: "Galerideki ekran görüntüleri telefon ekranıysa telefon çerçevesini seç.",
      },
      { tur: "metin", ad: "seoBaslik", etiket: "Google başlığı", sinir: 60, ipucu: "Boş bırakırsan proje adı ve alanı kullanılır." },
      { tur: "uzun", ad: "seoAciklama", etiket: "Google açıklaması", sinir: 160, satir: 2, ipucu: "Boş bırakırsan kısa anlatım kullanılır." },
    ],
  },

  hizmetler: {
    ad: "hizmetler",
    baslik: "Hizmetler",
    tekil: "Hizmet",
    aciklama: "Ana sayfadaki hizmet kartları, hizmetler sayfası ve her hizmetin kendi sayfası.",
    sirali: true,
    ozet: (o) => ({
      baslik: s(o.baslik) || "Adsız hizmet",
      alt: [s(o.baslangicFiyati), s(o.teslimSuresi)].filter(Boolean).join(", "),
      gorsel: (o.gorsel as { src?: string } | undefined)?.src,
    }),
    adres: (o) => (o.slug ? hizmetYolu(s(o.slug)) : undefined),
    yeni: () => ({ yayinda: false, baslik: "", slug: "", kimlerIcin: [], dahil: [], fiyatEtkenleri: [], sss: [], ilgiliYazilar: [] }),
    alanlar: [
      { tur: "metin", ad: "baslik", etiket: "Hizmet adı", zorunlu: true },
      { tur: "metin", ad: "slug", etiket: "Sayfa adresi", onEk: "/hizmetler/", ipucu: "Boş bırakırsan addan üretilir." },
      { tur: "metin", ad: "vitrinBaslik", etiket: "Ana sayfa kartındaki başlık" },
      { tur: "metin", ad: "vitrinAciklama", etiket: "Ana sayfa kartındaki açıklama" },
      { tur: "renk", ad: "renk", etiket: "Vurgu rengi", ipucu: "Kartlarda, hizmetler sayfasında ve hizmetin sayfasında bu renk kullanılır." },
      {
        tur: "nesne",
        ad: "gorsel",
        etiket: "Fotoğraf",
        alanlar: [
          { tur: "gorsel", ad: "src", etiket: "Görsel", genis: true, oran: 16 / 10, ipucu: "Ana sayfa kartında, hizmetler sayfasında ve hizmetin sayfasında 16:10 oranında görünür. Seçtiğin görsel bu orana kırpılır." },
          { tur: "metin", ad: "alt", etiket: "Görselin tarifi", genis: true, ipucu: "Görmeyen ziyaretçiler ve Google için görselde ne olduğunu bir cümleyle yaz." },
        ],
      },
      { tur: "uzun", ad: "giris", etiket: "Sayfanın giriş metni", satir: 3 },
      { tur: "uzun", ad: "kisaCevap", etiket: "Kısa cevap", satir: 3, ipucu: "Bu hizmet nedir, kime göredir, ne kadar sürer. Yapay zekâ aramaları için iki üç cümle." },
      { tur: "liste", ad: "kimlerIcin", etiket: "Kimler için", ogeAdi: "Madde" },
      {
        tur: "nesneler",
        ad: "dahil",
        etiket: "Neler dahil",
        ogeAdi: "Kalem",
        baslikAlani: "baslik",
        alanlar: [
          { tur: "metin", ad: "baslik", etiket: "Başlık", genis: true },
          { tur: "uzun", ad: "aciklama", etiket: "Açıklama", satir: 2 },
        ],
      },
      { tur: "metin", ad: "baslangicFiyati", etiket: "Başlangıç fiyatı", yerTutucu: "15.000 TL" },
      { tur: "metin", ad: "fiyatNotu", etiket: "Fiyat notu", yerTutucu: "KDV hariç" },
      { tur: "liste", ad: "fiyatEtkenleri", etiket: "Fiyatı neler belirler", ogeAdi: "Etken" },
      { tur: "metin", ad: "teslimSuresi", etiket: "Teslim süresi", yerTutucu: "1 ile 3 hafta" },
      {
        tur: "nesne",
        ad: "ornekProje",
        etiket: "Örnek proje",
        alanlar: [
          { tur: "secim", ad: "ad", etiket: "Proje", bos: "Seçilmedi", secenekler: (i) => i.projeler.map((p) => ({ deger: p.ad, ad: p.ad })), ipucu: "Sayfada Projeyi incele düğmesi bu işin sayfasına gider." },
          { tur: "uzun", ad: "ozet", etiket: "Kısa anlatım", satir: 2 },
        ],
      },
      { tur: "nesneler", ad: "sss", etiket: "Sık sorulan sorular", ogeAdi: "Soru", baslikAlani: "soru", alanlar: SSS_ALANLARI },
      { tur: "coklu", ad: "ilgiliYazilar", etiket: "İlgili blog yazıları", ogeAdi: "Yazı", secenekler: yazilarSecenek },
      { tur: "metin", ad: "seoBaslik", etiket: "Google başlığı", sinir: 60, genis: true },
      { tur: "uzun", ad: "seoAciklama", etiket: "Google açıklaması", sinir: 160, satir: 2 },
    ],
  },

  sss: {
    ad: "sss",
    baslik: "Sık sorulan sorular",
    tekil: "Soru",
    aciklama: "Ana sayfanın sonundaki soru cevap bölümü. Google için de soru cevap olarak işaretlenir.",
    sirali: true,
    ozet: (o) => ({ baslik: s(o.soru) || "Yeni soru", alt: s(o.cevap).slice(0, 110) }),
    yeni: () => ({ yayinda: true, soru: "", cevap: "" }),
    alanlar: [
      { tur: "metin", ad: "soru", etiket: "Soru", zorunlu: true, genis: true },
      { tur: "uzun", ad: "cevap", etiket: "Cevap", satir: 5 },
    ],
  },

  surec: {
    ad: "surec",
    baslik: "Çalışma adımları",
    tekil: "Adım",
    aciklama: "Nasıl çalışıyoruz bölümündeki adımlar. Müşteri panelindeki proje aşamaları da bunlardan gelir.",
    sirali: true,
    ozet: (o) => ({ baslik: s(o.baslik) || "Yeni adım", alt: s(o.sure) }),
    yeni: () => ({ yayinda: true, baslik: "", aciklama: "", sure: "" }),
    alanlar: [
      { tur: "metin", ad: "baslik", etiket: "Adım adı", zorunlu: true },
      { tur: "metin", ad: "sure", etiket: "Süre", yerTutucu: "1 hafta", ipucu: "Sitede görünmez, yalnızca müşteri panelindeki proje aşamalarında yazar." },
      { tur: "uzun", ad: "aciklama", etiket: "Açıklama", satir: 3 },
    ],
  },

  ilkeler: {
    ad: "ilkeler",
    baslik: "Stüdyo ilkeleri",
    tekil: "İlke",
    aciklama: "Stüdyo bölümündeki üç kart.",
    sirali: true,
    ozet: (o) => ({ baslik: s(o.baslik) || "Yeni ilke", alt: s(o.aciklama).slice(0, 110) }),
    yeni: () => ({ yayinda: true, ikon: "goz", baslik: "", aciklama: "" }),
    alanlar: [
      { tur: "metin", ad: "baslik", etiket: "Başlık", zorunlu: true },
      { tur: "uzun", ad: "aciklama", etiket: "Açıklama", satir: 3 },
    ],
  },

  teknolojiler: {
    ad: "teknolojiler",
    baslik: "Teknoloji logoları",
    tekil: "Teknoloji logosu",
    aciklama: "Logo şeridinde ve teknoloji bölümünde kullanılan logolar.",
    sirali: true,
    ozet: (o) => ({ baslik: s(o.ad) || "Yeni teknoloji", alt: s(o.kategori), gorsel: s(o.ikon), logo: true }),
    yeni: () => ({ yayinda: true, ad: "", ikon: "", renk: "#ffffff", kategori: "", acikTon: false }),
    alanlar: [
      { tur: "metin", ad: "ad", etiket: "Ad", zorunlu: true },
      {
        tur: "secim",
        ad: "kategori",
        etiket: "Kategori",
        secenekler: (i) => [...new Set(i.teknolojiler.map((t) => t.kategori).filter(Boolean))].map((k) => ({ deger: k, ad: k })),
      },
      { tur: "gorsel", ad: "ikon", etiket: "Logo", genis: true, ipucu: "SVG ya da şeffaf zeminli PNG en iyi sonucu verir." },
      { tur: "renk", ad: "renk", etiket: "Marka rengi" },
      { tur: "anahtar", ad: "acikTon", etiket: "Koyu logo", aciklama: "Logo siyah ya da çok koyuysa aç, koyu zeminde açık tona çevrilir." },
    ],
  },
};

export const KOLEKSIYON_SIRASI: KoleksiyonAdi[] = ["yazilar", "projeler", "hizmetler", "sss", "surec", "ilkeler", "teknolojiler"];

/* ---------------- Ayarlar ---------------- */

export const SITE_ALANLARI: AlanTanimi[] = [
  { tur: "metin", ad: "ad", etiket: "Kısa ad", yerTutucu: "KAM" },
  { tur: "metin", ad: "tamAd", etiket: "Tam ad" },
  { tur: "metin", ad: "adres", etiket: "Site adresi", yerTutucu: "https://kamdevops.com" },
  { tur: "metin", ad: "eposta", etiket: "Mail adresi" },
  { tur: "metin", ad: "whatsapp", etiket: "WhatsApp numarası", yerTutucu: "0532 418 22 90", ipucu: "Sağ alttaki WhatsApp düğmesi bu numaraya yazar. Boş bırakırsanız düğme görünmez." },
  { tur: "metin", ad: "konum", etiket: "Konum" },
  { tur: "metin", ad: "dil", etiket: "Dil kodu", yerTutucu: "tr-TR" },
  { tur: "uzun", ad: "aciklama", etiket: "Site açıklaması", sinir: 200, satir: 3, ipucu: "Ana sayfanın Google açıklaması ve yapay zekâ için özet." },
  { tur: "uzun", ad: "kisaAciklama", etiket: "Kısa açıklama", satir: 2, ipucu: "Alt bilgide görünür." },
  { tur: "anahtar", ad: "fiyatGoster", etiket: "Fiyatları göster", aciklama: "Kapatırsan hizmet sayfalarında başlangıç fiyatları gizlenir." },
];

export const HERO_ALANLARI: AlanTanimi[] = [
  { tur: "metin", ad: "baslikUst", etiket: "Başlık", genis: true },
  { tur: "uzun", ad: "aciklama", etiket: "Açıklama", satir: 3, ipucu: "Ne yaptığınızı bir iki cümleyle söyleyin." },
  { tur: "metin", ad: "birincilDugme", etiket: "Ana düğme" },
  { tur: "metin", ad: "ikincilDugme", etiket: "İkinci düğme" },
];

export const BOLUM_ADLARI: Record<keyof Ayarlar["bolumler"], string> = {
  logoSeridi: "Logo şeridi",
  blog: "Ana sayfa blog bölümü",
  isler: "İşler",
  hizmetler: "Hizmetler",
  vitrin: "Vitrin",
  teknolojiler: "Teknolojiler",
  surec: "Süreç",
  ilkeler: "Stüdyo ve ilkeler",
  sss: "Sık sorulanlar",
  teklif: "Teklif bandı",
  iletisim: "İletişim",
  blogSayfasi: "Blog sayfası",
  islerSayfasi: "İşler sayfası",
  hizmetlerSayfasi: "Hizmetler sayfası",
  surecSayfasi: "Süreç sayfası",
};

/** Bölümün sitede kullandığı alanlar. */
export function bolumAlanlari(anahtar: keyof Ayarlar["bolumler"]): AlanTanimi[] {
  // Vitrin bölümünden yalnızca 3B vitrin kaldı; onun etiketi ve başlığı düzenlenir.
  if (anahtar === "vitrin") {
    return [
      { tur: "metin", ad: "etiket", etiket: "Küçük etiket" },
      { tur: "metin", ad: "altBaslik", etiket: "3B vitrinin başlığı", genis: true },
    ];
  }
  const alanlar: AlanTanimi[] = [];
  // Küçük etiket bu bölümde sitede görünür.
  if (anahtar === "logoSeridi") alanlar.push({ tur: "metin", ad: "etiket", etiket: "Küçük etiket" });
  alanlar.push({ tur: "metin", ad: "baslik", etiket: "Başlık" });
  if (["blog", "iletisim"].includes(anahtar)) alanlar.push({ tur: "metin", ad: "vurgu", etiket: "Başlığın renkli kısmı" });
  alanlar.push({ tur: "uzun", ad: "aciklama", etiket: "Açıklama", satir: 2 });
  if (anahtar === "iletisim") {
    alanlar.push({ tur: "liste", ad: "konular", etiket: "Formdaki konu seçenekleri", ogeAdi: "Konu" });
  }
  if (anahtar === "teklif") alanlar.push({ tur: "liste", ad: "kayanYazilar", etiket: "Kayan yazılar", ogeAdi: "Yazı" });
  if (anahtar === "surecSayfasi") {
    // Bu bölümün başlığı ve açıklaması süreç sayfasında yolun altındaki ilk bölümün başlığıdır.
    alanlar.push({ tur: "nesne", ad: "olcme", etiket: "Süreçteki ölçme adımı", ipucu: "Yayından sonraki son adım. Teknolojiler listesinde adı geçen araç logosuyla görünür.", alanlar: [
      { tur: "metin", ad: "baslik", etiket: "Başlık", genis: true },
      { tur: "metin", ad: "metin", etiket: "Açıklama", genis: true },
      { tur: "liste", ad: "ogeler", etiket: "Araçlar", ogeAdi: "Araç" },
    ] });
    alanlar.push({ tur: "nesneler", ad: "kalemler", etiket: "Süreç boyunca verilenler", ogeAdi: "Kalem", baslikAlani: "baslik", alanlar: [
      { tur: "metin", ad: "baslik", etiket: "Başlık", genis: true },
      { tur: "uzun", ad: "aciklama", etiket: "Açıklama", satir: 2 },
    ] });
    alanlar.push({ tur: "liste", ad: "gerekenler", etiket: "Sizden gerekenler", ogeAdi: "Madde" });
    alanlar.push({ tur: "nesneler", ad: "sorular", etiket: "Süreç hakkında sorular", ogeAdi: "Soru", baslikAlani: "soru", alanlar: SSS_ALANLARI });
  }
  return alanlar;
}

export const VITRIN_ALANLARI: AlanTanimi[] = [
  { tur: "gorseller", ad: "vitrinGorselleri", etiket: "Üç boyutlu vitrin görselleri", oran: 16 / 9, ipucu: "Ana sayfadaki eğik görsel duvarında 16:9 oranında görünür. En az 12 görsel önerilir." },
];

export const SECKI_ALANLARI: AlanTanimi[] = [
  {
    tur: "nesneler",
    ad: "teknolojiSecki",
    etiket: "Teknoloji bölümündeki gruplar",
    ogeAdi: "Grup",
    baslikAlani: "baslik",
    alanlar: [
      { tur: "metin", ad: "baslik", etiket: "Grup adı" },
      { tur: "renk", ad: "renk", etiket: "Renk" },
      { tur: "coklu", ad: "adlar", etiket: "Gruptaki teknolojiler", ogeAdi: "Teknoloji", secenekler: teknolojiSecenek },
    ],
  },
];

/** Medya seçicide "Sitede kullanılanlar" sekmesi için içerikte geçen bütün görseller. */
export function siteGorselleri(icerik: Icerik) {
  const liste = [
    ...icerik.yazilar.map((y) => y.gorsel?.src),
    ...icerik.hizmetler.map((h) => h.gorsel?.src),
    ...icerik.projeler.map((p) => p.kapak),
    ...icerik.projeler.map((p) => p.logo),
    ...icerik.projeler.flatMap((p) => p.gorseller ?? []),
    ...(icerik.ayarlar.vitrinGorselleri ?? []),
  ].filter((g): g is string => !!g);
  return [...new Set(liste)];
}
