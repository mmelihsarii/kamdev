import type { ReactNode } from "react";
import AnaSayfa from "./sayfalar/AnaSayfa";
import Iletisim from "./bilesenler/Iletisim";
import HizmetDetay from "./sayfalar/HizmetDetay";
import HizmetListesi from "./sayfalar/HizmetListesi";
import SurecSayfasi from "./sayfalar/SurecSayfasi";
import BlogListesi from "./sayfalar/BlogListesi";
import BlogYazisi from "./sayfalar/BlogYazisi";
import IsListesi from "./sayfalar/IsListesi";
import IsDetay from "./sayfalar/IsDetay";
import Bulunamadi from "./sayfalar/Bulunamadi";
import YonetimSayfasi from "./sayfalar/YonetimSayfasi";
import MusteriSayfasi from "./sayfalar/MusteriSayfasi";
import Demolar, { DEMO_SSS } from "./sayfalar/Demolar";
import DemoDetay from "./sayfalar/DemoDetay";
import DemoPanel from "./sayfalar/DemoPanel";
import { SEKTORLER, demoYolu, panelYolu } from "./demolar/katalog";
import { SITE } from "./veri/site";
import { hizmetYolu, isYolu, yaziYolu } from "./veri/yardimci";
import type { Icerik } from "./veri/tipler";
import { demoLd, hizmetLd, isLd, kirintiLd, kurumLd, makaleLd, sssLd, webSitesiLd, type SayfaMeta } from "./lib/seo";

export type Rota = {
  yol: string;
  meta: SayfaMeta;
  sayfa: () => ReactNode;
  /** Sitemap'te öncelik; 404 ve panel sayfaları listeye girmez. */
  oncelik?: number;
  /** Panel sayfaları sitenin menüsü ve alt bilgisi olmadan, kendi düzeniyle açılır. */
  yalin?: boolean;
};

export const BULUNAMADI: Rota = {
  yol: "/404/",
  sayfa: () => <Bulunamadi />,
  meta: {
    baslik: "Sayfa bulunamadı",
    aciklama: "Aradığınız sayfa taşınmış ya da hiç var olmamış olabilir.",
    yol: "/404/",
    indeksle: false,
    jsonLd: [],
  },
};

const YONETIM: Rota = {
  yol: "/yonetim/",
  yalin: true,
  sayfa: () => <YonetimSayfasi />,
  meta: { baslik: "Yönetim paneli", aciklama: "KAM yönetim paneli.", yol: "/yonetim/", indeksle: false, jsonLd: [] },
};

const MUSTERI: Rota = {
  yol: "/musteri/",
  yalin: true,
  sayfa: () => <MusteriSayfasi />,
  meta: { baslik: "Müşteri paneli", aciklama: "Projenizin durumunu takip edin.", yol: "/musteri/", indeksle: false, jsonLd: [] },
};

/** İçerikten bütün sayfaları üretir. Derlemede kopyadan, tarayıcıda canlı içerikten çalışır. */
export function rotalariOlustur(icerik: Icerik): Rota[] {
  const { ayarlar, hizmetler, yazilar, sss, projeler } = icerik;

  const anaSayfa: Rota = {
    yol: "/",
    oncelik: 1,
    sayfa: () => <AnaSayfa />,
    meta: {
      baslik: `${SITE.tamAd}, Web Sitesi, E Ticaret ve Mobil Uygulama`,
      aciklama: SITE.aciklama,
      yol: "/",
      jsonLd: [kurumLd(), webSitesiLd(), sssLd(sss)],
    },
  };

  const iletisim: Rota = {
    yol: "/iletisim/",
    oncelik: 0.8,
    sayfa: () => <Iletisim />,
    meta: {
      baslik: `İletişim ve Teklif Al, ${SITE.tamAd}`,
      aciklama: ayarlar.bolumler.iletisim.aciklama,
      yol: "/iletisim/",
      jsonLd: [
        kurumLd(),
        kirintiLd([
          { ad: "Ana sayfa", yol: "/" },
          { ad: "İletişim", yol: "/iletisim/" },
        ]),
      ],
    },
  };

  const blog: Rota = {
    yol: "/blog/",
    oncelik: 0.8,
    sayfa: () => <BlogListesi />,
    meta: {
      baslik: "Blog, Web Sitesi, E Ticaret ve Mobil Uygulama Rehberleri",
      aciklama: ayarlar.bolumler.blogSayfasi.aciklama,
      yol: "/blog/",
      jsonLd: [
        kurumLd(),
        {
          "@type": "Blog",
          name: `${SITE.ad} Blog`,
          url: SITE.adres + "/blog/",
          inLanguage: SITE.dil,
          publisher: { "@id": SITE.adres + "/#kurum" },
          blogPost: yazilar.map((y) => ({ "@type": "BlogPosting", headline: y.baslik, url: SITE.adres + yaziYolu(y.slug), datePublished: y.tarih })),
        },
        kirintiLd([
          { ad: "Ana sayfa", yol: "/" },
          { ad: "Blog", yol: "/blog/" },
        ]),
      ],
    },
  };

  const hizmetlerSayfasi: Rota = {
    yol: "/hizmetler/",
    oncelik: 0.9,
    sayfa: () => <HizmetListesi />,
    meta: {
      baslik: "Hizmetler, Web Sitesi, Mobil Uygulama, ERP, SEO ve Reklam",
      aciklama: (ayarlar.bolumler.hizmetlerSayfasi ?? ayarlar.bolumler.hizmetler).aciklama,
      yol: "/hizmetler/",
      jsonLd: [
        kurumLd(),
        {
          "@type": "ItemList",
          name: `${SITE.ad} hizmetleri`,
          url: SITE.adres + "/hizmetler/",
          itemListElement: hizmetler.map((h, sira) => ({ "@type": "ListItem", position: sira + 1, name: h.baslik, url: SITE.adres + hizmetYolu(h.slug) })),
        },
        kirintiLd([
          { ad: "Ana sayfa", yol: "/" },
          { ad: "Hizmetler", yol: "/hizmetler/" },
        ]),
      ],
    },
  };

  const surecSayfasi: Rota = {
    yol: "/surec/",
    oncelik: 0.7,
    sayfa: () => <SurecSayfasi />,
    meta: {
      baslik: "Süreç, Konuşmadan Yayına Adım Adım Çalışma Düzeni",
      aciklama: ayarlar.bolumler.surec.aciklama,
      yol: "/surec/",
      jsonLd: [
        kurumLd(),
        ...(ayarlar.bolumler.surecSayfasi?.sorular?.length ? [sssLd(ayarlar.bolumler.surecSayfasi.sorular)] : []),
        kirintiLd([
          { ad: "Ana sayfa", yol: "/" },
          { ad: "Süreç", yol: "/surec/" },
        ]),
      ],
    },
  };

  const hizmetRotalari: Rota[] = hizmetler.map((h) => {
    const yol = hizmetYolu(h.slug);
    return {
      yol,
      oncelik: 0.9,
      sayfa: () => <HizmetDetay hizmet={h} />,
      meta: {
        baslik: h.seoBaslik,
        aciklama: h.seoAciklama,
        yol,
        gorsel: h.gorsel?.src || undefined,
        jsonLd: [
          kurumLd(),
          hizmetLd(h, yol, ayarlar.site.fiyatGoster),
          sssLd(h.sss),
          kirintiLd([
            { ad: "Ana sayfa", yol: "/" },
            { ad: "Hizmetler", yol: "/hizmetler/" },
            { ad: h.baslik, yol },
          ]),
        ],
      },
    };
  });

  const yaziRotalari: Rota[] = yazilar.map((y) => {
    const yol = yaziYolu(y.slug);
    return {
      yol,
      oncelik: 0.7,
      sayfa: () => <BlogYazisi yazi={y} />,
      meta: {
        baslik: y.seoBaslik || y.baslik,
        aciklama: y.aciklama,
        yol,
        tur: "article",
        yayin: y.tarih,
        guncelleme: y.guncelleme || y.tarih,
        gorsel: y.gorsel?.src || undefined,
        jsonLd: [
          kurumLd(),
          makaleLd(y, yol),
          ...(y.sss.length ? [sssLd(y.sss)] : []),
          kirintiLd([
            { ad: "Ana sayfa", yol: "/" },
            { ad: "Blog", yol: "/blog/" },
            { ad: y.baslik, yol },
          ]),
        ],
      },
    };
  });

  const isler: Rota = {
    yol: "/isler/",
    oncelik: 0.8,
    sayfa: () => <IsListesi />,
    meta: {
      baslik: "İşlerimiz, Web Sitesi, E Ticaret ve Mobil Uygulama Projeleri",
      aciklama: (ayarlar.bolumler.islerSayfasi ?? ayarlar.bolumler.isler).aciklama,
      yol: "/isler/",
      jsonLd: [
        kurumLd(),
        {
          "@type": "CollectionPage",
          name: `${SITE.ad} işleri`,
          url: SITE.adres + "/isler/",
          inLanguage: SITE.dil,
          hasPart: projeler.map((p) => ({ "@type": "CreativeWork", name: p.ad, url: SITE.adres + isYolu(p), genre: p.alan })),
        },
        kirintiLd([
          { ad: "Ana sayfa", yol: "/" },
          { ad: "İşler", yol: "/isler/" },
        ]),
      ],
    },
  };

  const isRotalari: Rota[] = projeler.map((p) => {
    const yol = isYolu(p);
    return {
      yol,
      oncelik: 0.7,
      sayfa: () => <IsDetay proje={p} />,
      meta: {
        baslik: p.seoBaslik || `${p.ad}, ${p.alan} projesi`,
        aciklama: p.seoAciklama || p.ozet,
        yol,
        gorsel: p.kapak || p.gorseller?.[0] || undefined,
        jsonLd: [
          kurumLd(),
          isLd(p, yol),
          kirintiLd([
            { ad: "Ana sayfa", yol: "/" },
            { ad: "İşler", yol: "/isler/" },
            { ad: p.ad, yol },
          ]),
        ],
      },
    };
  });

  const demolar: Rota = {
    yol: "/demolar/",
    oncelik: 0.8,
    sayfa: () => <Demolar />,
    meta: {
      baslik: "Canlı Demolar, Sektöre Özel Yönetim Paneli Örnekleri",
      aciklama:
        `${SEKTORLER.map((d) => d.kisaAd).join(", ").replace(/, ([^,]+)$/, " ve $1")} için yönetim panellerini canlı deneyin. Kayıt gerekmez, panel tarayıcınızda gerçekten çalışır.`,
      yol: "/demolar/",
      jsonLd: [
        kurumLd(),
        {
          "@type": "CollectionPage",
          name: `${SITE.ad} canlı demoları`,
          url: SITE.adres + "/demolar/",
          inLanguage: SITE.dil,
          hasPart: SEKTORLER.map((d) => ({ "@type": "WebApplication", name: d.ad, url: SITE.adres + demoYolu(d.slug) })),
        },
        sssLd(DEMO_SSS),
        kirintiLd([
          { ad: "Ana sayfa", yol: "/" },
          { ad: "Demolar", yol: "/demolar/" },
        ]),
      ],
    },
  };

  const demoRotalari: Rota[] = SEKTORLER.map((d) => {
    const yol = demoYolu(d.slug);
    return {
      yol,
      oncelik: 0.8,
      sayfa: () => <DemoDetay s={d} />,
      meta: {
        baslik: d.seo.baslik,
        aciklama: d.seo.aciklama,
        yol,
        jsonLd: [
          kurumLd(),
          demoLd(d, yol),
          sssLd(d.sss),
          kirintiLd([
            { ad: "Ana sayfa", yol: "/" },
            { ad: "Demolar", yol: "/demolar/" },
            { ad: d.ad, yol },
          ]),
        ],
      },
    };
  });

  return [anaSayfa, iletisim, isler, ...isRotalari, hizmetlerSayfasi, ...hizmetRotalari, surecSayfasi, demolar, ...demoRotalari, blog, ...yaziRotalari];
}

/** Demoların tam ekran panelleri; arama motorlarına kapalı, tanıtım sayfası dizine girer. */
const PANEL_ROTALARI: Rota[] = SEKTORLER.map((d) => ({
  yol: panelYolu(d.slug),
  yalin: true,
  sayfa: () => <DemoPanel s={d} />,
  meta: { baslik: `${d.ad}, canlı demo paneli`, aciklama: d.seo.aciklama, yol: panelYolu(d.slug), indeksle: false, jsonLd: [] },
}));

/** Ön işlenecek bütün sayfalar: içerik sayfaları ve iki panel kabuğu. */
export function tumRotalar(icerik: Icerik): Rota[] {
  return [...rotalariOlustur(icerik), YONETIM, MUSTERI, ...PANEL_ROTALARI];
}

/** "/blog/x" ve "/blog/x/" aynı sayfaya düşsün; bilinmeyen yol 404 olur. */
export function rotaBul(yol: string, icerik: Icerik): Rota {
  const temiz = (yol.split(/[?#]/)[0] || "/").replace(/\/index\.html$/, "/");
  const sonEgik = temiz.endsWith("/") ? temiz : temiz + "/";
  return tumRotalar(icerik).find((r) => r.yol === sonEgik) ?? BULUNAMADI;
}
