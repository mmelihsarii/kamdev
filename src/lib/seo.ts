import { SITE, mutlakAdres } from "../veri/site";
import type { Hizmet, Proje, SoruCevap, Yazi } from "../veri/tipler";
import type { SektorBilgi } from "../demolar/tipler";
import { duzMetin } from "./metin";

export type SayfaMeta = {
  baslik: string;
  aciklama: string;
  yol: string;
  tur?: "website" | "article";
  yayin?: string;
  guncelleme?: string;
  indeksle?: boolean;
  /** Paylaşım görseli; yoksa site geneli görsel kullanılır. */
  gorsel?: string;
  jsonLd: object[];
};

const ORG_ID = mutlakAdres("/#kurum");

export function kurumLd() {
  return {
    "@type": "ProfessionalService",
    "@id": ORG_ID,
    name: SITE.ad,
    alternateName: SITE.tamAd,
    description: SITE.aciklama,
    url: mutlakAdres("/"),
    email: SITE.eposta,
    logo: mutlakAdres("/logo-512.png"),
    image: mutlakAdres("/og.png"),
    address: {
      "@type": "PostalAddress",
      streetAddress: "Hoşnudiye Mahallesi, 770 Sokak No:4, Casaba Modern",
      addressLocality: "Tepebaşı",
      addressRegion: "Eskişehir",
      postalCode: "26130",
      addressCountry: "TR",
    },
    areaServed: { "@type": "Country", name: "Türkiye" },
    knowsLanguage: ["tr", "en"],
    knowsAbout: [
      "Web sitesi geliştirme",
      "E-ticaret",
      "Sanal POS entegrasyonu",
      "PayTR",
      "iyzico",
      "Mobil uygulama geliştirme",
      "Flutter",
      "React",
      "Laravel",
      "Supabase",
      "B2B bayi sistemleri",
      "ERP entegrasyonu",
      "SEO",
      "GEO",
    ],
  };
}

export function webSitesiLd() {
  return {
    "@type": "WebSite",
    "@id": mutlakAdres("/#site"),
    url: mutlakAdres("/"),
    name: SITE.ad,
    inLanguage: SITE.dil,
    publisher: { "@id": ORG_ID },
  };
}

export function kirintiLd(adimlar: { ad: string; yol: string }[]) {
  return {
    "@type": "BreadcrumbList",
    itemListElement: adimlar.map((a, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: a.ad,
      item: mutlakAdres(a.yol),
    })),
  };
}

export function sssLd(sorular: SoruCevap[]) {
  return {
    "@type": "FAQPage",
    mainEntity: sorular.map((s) => ({
      "@type": "Question",
      name: s.soru,
      acceptedAnswer: { "@type": "Answer", text: duzMetin(s.cevap) },
    })),
  };
}

export function makaleLd(yazi: Yazi, yol: string) {
  return {
    "@type": "BlogPosting",
    headline: yazi.baslik,
    description: yazi.aciklama,
    abstract: yazi.kisaCevap,
    datePublished: yazi.tarih,
    dateModified: yazi.guncelleme ?? yazi.tarih,
    inLanguage: SITE.dil,
    mainEntityOfPage: mutlakAdres(yol),
    url: mutlakAdres(yol),
    image: mutlakAdres(yazi.gorsel?.src || "/og.png"),
    articleSection: yazi.kategori,
    author: { "@id": ORG_ID },
    publisher: { "@id": ORG_ID },
  };
}

export function hizmetLd(h: Hizmet, yol: string, fiyatGoster: boolean) {
  const rakam = Number(h.baslangicFiyati.replace(/[^\d]/g, ""));
  return {
    "@type": "Service",
    name: h.baslik,
    serviceType: h.baslik,
    description: h.kisaCevap,
    url: mutlakAdres(yol),
    ...(h.gorsel?.src ? { image: mutlakAdres(h.gorsel.src) } : {}),
    provider: { "@id": ORG_ID },
    areaServed: { "@type": "Country", name: "Türkiye" },
    ...(fiyatGoster && rakam
      ? {
          offers: {
            "@type": "Offer",
            priceCurrency: "TRY",
            price: rakam,
            priceSpecification: { "@type": "PriceSpecification", minPrice: rakam, priceCurrency: "TRY", valueAddedTaxIncluded: false },
          },
        }
      : {}),
  };
}

const kacis = (m: string) =>
  m.replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

/** Ön işleme sırasında index.html'deki <!--kafa--> yerine yazılan etiketler. */
export function kafaHtml(m: SayfaMeta) {
  const adres = mutlakAdres(m.yol);
  const gorsel = mutlakAdres(m.gorsel ?? "/og.png");
  const satirlar = [
    `<title>${kacis(m.baslik)}</title>`,
    `<meta name="description" content="${kacis(m.aciklama)}" />`,
    m.indeksle === false
      ? `<meta name="robots" content="noindex" />`
      : `<meta name="robots" content="index, follow, max-image-preview:large, max-snippet:-1" />`,
    `<link rel="canonical" href="${adres}" />`,
    `<meta property="og:type" content="${m.tur ?? "website"}" />`,
    `<meta property="og:locale" content="tr_TR" />`,
    `<meta property="og:site_name" content="${SITE.ad}" />`,
    `<meta property="og:title" content="${kacis(m.baslik)}" />`,
    `<meta property="og:description" content="${kacis(m.aciklama)}" />`,
    `<meta property="og:url" content="${adres}" />`,
    `<meta property="og:image" content="${gorsel}" />`,
    `<meta name="twitter:card" content="summary_large_image" />`,
    ...(m.yayin ? [`<meta property="article:published_time" content="${m.yayin}" />`] : []),
    ...(m.guncelleme ? [`<meta property="article:modified_time" content="${m.guncelleme}" />`] : []),
    `<script type="application/ld+json">${JSON.stringify({ "@context": "https://schema.org", "@graph": m.jsonLd }).replace(/</g, "\\u003c")}</script>`,
  ];
  return satirlar.join("\n    ");
}

/** Referans iş: yapılan projenin kendisi, stüdyo üretici olarak. */
export function isLd(p: Proje, yol: string) {
  const kapak = p.kapak || p.gorseller?.[0];
  return {
    "@type": "CreativeWork",
    name: p.ad,
    description: p.ozet,
    url: mutlakAdres(yol),
    image: mutlakAdres(kapak || "/og.png"),
    creator: { "@id": ORG_ID },
    dateCreated: p.yil,
    genre: p.alan,
    keywords: p.etiketler.join(", "),
    locationCreated: { "@type": "Place", name: p.konum },
    ...(p.adres ? { sameAs: `https://${p.adres}` } : {}),
  };
}

/** Sektör demosu: tarayıcıda çalışan örnek yönetim paneli. */
export function demoLd(d: SektorBilgi, yol: string) {
  return {
    "@type": "WebApplication",
    name: d.ad,
    description: d.seo.aciklama,
    url: mutlakAdres(yol),
    applicationCategory: "BusinessApplication",
    operatingSystem: "Web",
    inLanguage: SITE.dil,
    isAccessibleForFree: true,
    featureList: d.moduller.map((m) => m.ad).join(", "),
    creator: { "@id": ORG_ID },
  };
}
