/*
 * Yönetim paneli kabuğu: oturum, kenar menüsü ve sayfa geçişleri.
 * Sayfalar adres çubuğundaki # kısmından seçilir; böylece sunucuda ek
 * yönlendirme gerekmez ve yenilemede aynı ekran açılır.
 */
import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import {
  IconArticle,
  IconBriefcase,
  IconBulb,
  IconCpu,
  IconDatabase,
  IconExternalLink,
  IconHelpCircle,
  IconHome,
  IconWorld,
  IconInbox,
  IconLayoutDashboard,
  IconLifebuoy,
  IconListNumbers,
  IconLogout,
  IconMenu2,
  IconPhoto,
  IconRoute,
  IconStack2,
  IconUser,
  IconUserPlus,
  IconUsers,
  IconX,
} from "@tabler/icons-react";
import type { Ayarlar, KoleksiyonAdi } from "../../veri/tipler";
import { OTURUM_DUSTU, oturum, yonetim, type Kullanici, type Ozet, type YonetimIcerigi } from "../api";
import { FormBaglam } from "../Form";
import Giris from "../Giris";
import { Dugme, HataKutusu, PanelSaglayici, Yukleniyor, ayrilmaOnayi, hataMetni } from "../ortak";
import { KOLEKSIYON_TANIMLARI, siteGorselleri } from "../sema";
import { YonetimBaglam, type IcerikBaglami } from "./baglam";
import Gosterge from "./Gosterge";
import KoleksiyonSayfasi from "./Koleksiyon";
import AyarlarSayfasi from "./Ayarlar";
import MedyaSayfasi from "./Medya";
import TaleplerSayfasi from "./Talepler";
import HesaplarSayfasi from "./Hesaplar";
import ProjelerSayfasi from "./Projeler";
import YedeklerSayfasi from "./Yedekler";
import HesabimSayfasi from "./Hesabim";
import RehberSayfasi from "./Rehber";
import YeniMusteriSayfasi from "./YeniMusteri";

/* ---------------- Adres ---------------- */

function hashOku() {
  const h = window.location.hash.replace(/^#\/?/, "");
  const [yol, sorgu = ""] = h.split("?");
  return { parcalar: yol.split("/").filter(Boolean).map(decodeURIComponent), sorgu: new URLSearchParams(sorgu) };
}

function useHashRota() {
  const [rota, setRota] = useState(hashOku);
  const onceki = useRef(typeof window !== "undefined" ? window.location.hash : "");
  useEffect(() => {
    const degisti = () => {
      if (!ayrilmaOnayi()) {
        // Geri dönülemeyen değişiklik yok; kullanıcı kalmak istedi, adresi eski haline al.
        history.pushState(null, "", onceki.current || "#/");
        return;
      }
      onceki.current = window.location.hash;
      setRota(hashOku());
      window.scrollTo({ top: 0 });
    };
    window.addEventListener("hashchange", degisti);
    return () => window.removeEventListener("hashchange", degisti);
  }, []);
  return rota;
}

/* ---------------- Menü ---------------- */

type MenuOgesi = { ad: string; hedef: string; ikon: ReactNode; sayi?: number };

function menuGruplari(ozet: Ozet | null): { baslik?: string; ogeler: MenuOgesi[] }[] {
  const k = (ad: KoleksiyonAdi) => `/icerik/${ad}`;
  return [
    {
      ogeler: [
        { ad: "Genel bakış", hedef: "/", ikon: <IconLayoutDashboard size={18} /> },
        { ad: "Nasıl kullanılır", hedef: "/rehber", ikon: <IconLifebuoy size={18} /> },
      ],
    },
    {
      baslik: "Siten",
      ogeler: [
        { ad: "Ana sayfa ve ayarlar", hedef: "/ayarlar", ikon: <IconHome size={18} /> },
        { ad: KOLEKSIYON_TANIMLARI.yazilar.baslik, hedef: k("yazilar"), ikon: <IconArticle size={18} /> },
        { ad: KOLEKSIYON_TANIMLARI.projeler.baslik, hedef: k("projeler"), ikon: <IconBriefcase size={18} /> },
        { ad: KOLEKSIYON_TANIMLARI.hizmetler.baslik, hedef: k("hizmetler"), ikon: <IconStack2 size={18} /> },
        { ad: "Görseller", hedef: "/medya", ikon: <IconPhoto size={18} /> },
      ],
    },
    {
      baslik: "Sitenin diğer bölümleri",
      ogeler: [
        { ad: KOLEKSIYON_TANIMLARI.sss.baslik, hedef: k("sss"), ikon: <IconHelpCircle size={18} /> },
        { ad: KOLEKSIYON_TANIMLARI.surec.baslik, hedef: k("surec"), ikon: <IconListNumbers size={18} /> },
        { ad: KOLEKSIYON_TANIMLARI.ilkeler.baslik, hedef: k("ilkeler"), ikon: <IconBulb size={18} /> },
        { ad: KOLEKSIYON_TANIMLARI.teknolojiler.baslik, hedef: k("teknolojiler"), ikon: <IconCpu size={18} /> },
      ],
    },
    {
      baslik: "Müşterilerin",
      ogeler: [
        { ad: "Gelen talepler", hedef: "/talepler", ikon: <IconInbox size={18} />, sayi: ozet?.yeniTalep },
        { ad: "Yeni müşteri başlat", hedef: "/yeni-musteri", ikon: <IconUserPlus size={18} /> },
        { ad: "Müşteri projeleri", hedef: "/projeler", ikon: <IconRoute size={18} /> },
        { ad: "Müşteri hesapları", hedef: "/hesaplar", ikon: <IconUsers size={18} /> },
      ],
    },
    {
      baslik: "Güvenlik",
      ogeler: [
        { ad: "Yedekler ve çöp kutusu", hedef: "/yedekler", ikon: <IconDatabase size={18} /> },
        { ad: "Şifremi değiştir", hedef: "/hesabim", ikon: <IconUser size={18} /> },
      ],
    },
  ];
}

function KenarMenu({ aktif, ozet, kullanici, cikis, kapat }: { aktif: string; ozet: Ozet | null; kullanici: Kullanici; cikis: () => void; kapat?: () => void }) {
  return (
    <nav aria-label="Panel menüsü" className="flex h-full flex-col">
      <div className="flex h-16 items-center justify-between px-5">
        <a href="#/" onClick={kapat} className="flex items-baseline gap-2.5">
          <span className="text-[24px] font-bold leading-none tracking-[-0.07em] text-white">KAM</span>
          <span className="text-[13px] font-medium text-neutral-500">Yönetim</span>
        </a>
        {kapat && (
          <button type="button" onClick={kapat} aria-label="Menüyü kapat" className="flex h-9 w-9 items-center justify-center rounded-lg text-neutral-400 hover:bg-white/5 hover:text-white">
            <IconX size={20} />
          </button>
        )}
      </div>
      <div className="flex-1 space-y-5 overflow-y-auto px-3 pb-6 pt-1">
        {menuGruplari(ozet).map((g, i) => (
          <div key={i}>
            {g.baslik && <p className="mb-1.5 px-3 text-[11.5px] font-semibold uppercase tracking-[0.12em] text-neutral-500">{g.baslik}</p>}
            <ul className="space-y-0.5">
              {g.ogeler.map((o) => {
                const secili = o.hedef === "/" ? aktif === "/" : aktif === o.hedef || aktif.startsWith(o.hedef + "/");
                return (
                  <li key={o.hedef}>
                    <a
                      href={`#${o.hedef}`}
                      onClick={kapat}
                      aria-current={secili ? "page" : undefined}
                      className={`flex items-center gap-3 rounded-lg px-3 py-[7px] text-[14px] transition-colors ${
                        secili ? "bg-white/[0.07] font-medium text-white" : "text-neutral-400 hover:bg-white/[0.04] hover:text-neutral-100"
                      }`}
                    >
                      <span className={secili ? "text-vurgu" : ""}>{o.ikon}</span>
                      <span className="flex-1">{o.ad}</span>
                      {!!o.sayi && <span className="text-[12.5px] font-semibold tabular-nums text-vurgu">{o.sayi}</span>}
                    </a>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </div>
      <div className="border-t border-white/[0.06] p-3">
        <a href="/" target="_blank" rel="noopener" className="flex items-center gap-3 rounded-lg px-3 py-2 text-[14px] text-neutral-400 hover:bg-white/[0.04] hover:text-white">
          <IconWorld size={18} />
          <span className="flex-1">Siteyi aç</span>
          <IconExternalLink size={15} />
        </a>
        <div className="mt-2 flex items-center gap-3 rounded-lg px-3 py-2">
          <div className="min-w-0 flex-1">
            <p className="truncate text-[13.5px] font-medium text-neutral-100">{kullanici.ad || "Yönetici"}</p>
            <p className="truncate text-[12px] text-neutral-500">{kullanici.eposta}</p>
          </div>
          <button type="button" onClick={cikis} aria-label="Çıkış yap" title="Çıkış yap" className="flex h-9 w-9 items-center justify-center rounded-lg text-neutral-400 hover:bg-white/5 hover:text-white">
            <IconLogout size={18} />
          </button>
        </div>
      </div>
    </nav>
  );
}

/* ---------------- Kabuk ---------------- */

function Kabuk({ kullanici, cikis }: { kullanici: Kullanici; cikis: () => void }) {
  const { parcalar, sorgu } = useHashRota();
  const [icerik, setIcerik] = useState<YonetimIcerigi | null>(null);
  const [icerikHata, setIcerikHata] = useState<string | null>(null);
  const [ozet, setOzet] = useState<Ozet | null>(null);
  const [mobilMenu, setMobilMenu] = useState(false);

  const icerikYukle = useCallback(async () => {
    try {
      setIcerik(await yonetim<YonetimIcerigi>("icerik"));
      setIcerikHata(null);
    } catch (h) {
      setIcerikHata(hataMetni(h));
    }
  }, []);

  const ozetYukle = useCallback(() => {
    yonetim<Ozet>("ozet").then(setOzet, () => {});
  }, []);

  useEffect(() => {
    icerikYukle();
    ozetYukle();
  }, [icerikYukle, ozetYukle]);

  // Talepler sayısı sayfa değiştikçe tazelensin.
  const aktif = "/" + parcalar.join("/");
  useEffect(() => {
    ozetYukle();
  }, [aktif, ozetYukle]);

  const baglam = useMemo<IcerikBaglami | null>(() => {
    if (!icerik) return null;
    return {
      icerik,
      yenile: icerikYukle,
      ogeKaydedildi: (k, oge, zaman, eskiKimlik) =>
        setIcerik((i) => {
          if (!i) return i;
          const liste = i[k] as unknown as Record<string, unknown>[];
          const varMi = liste.some((x) => x.kimlik === (eskiKimlik ?? oge.kimlik) || x.kimlik === oge.kimlik);
          // Yeni blog yazısı sunucuda da en üste eklenir, diğerleri sona.
          const yeniListe = varMi ? liste.map((x) => (x.kimlik === oge.kimlik || x.kimlik === eskiKimlik ? oge : x)) : k === "yazilar" ? [oge, ...liste] : [...liste, oge];
          return {
            ...i,
            [k]: yeniListe,
            zamanlar: { ...i.zamanlar, ogeler: { ...i.zamanlar.ogeler, [k]: { ...(i.zamanlar.ogeler[k] ?? {}), [oge.kimlik]: zaman } } },
          };
        }),
      ogeSilindi: (k, kimlik) =>
        setIcerik((i) => (i ? { ...i, [k]: (i[k] as unknown as Record<string, unknown>[]).filter((x) => x.kimlik !== kimlik) } : i)),
      siraDegisti: (k, liste) => setIcerik((i) => (i ? { ...i, [k]: liste } : i)),
      ayarlarKaydedildi: (ayarlar: Ayarlar, zaman) => setIcerik((i) => (i ? { ...i, ayarlar, zamanlar: { ...i.zamanlar, ayarlar: zaman } } : i)),
    };
  }, [icerik, icerikYukle]);

  const formBaglam = useMemo(() => ({ icerik, siteGorselleri: icerik ? siteGorselleri(icerik) : [] }), [icerik]);

  let sayfa: ReactNode;
  if (icerikHata) sayfa = <HataKutusu hata={icerikHata} yenile={icerikYukle} />;
  else if (!baglam) sayfa = <Yukleniyor />;
  else {
    const [bolum, a, b] = parcalar;
    switch (bolum) {
      case undefined:
        sayfa = <Gosterge ozet={ozet} kullaniciAdi={kullanici.ad} />;
        break;
      case "icerik":
        sayfa = a && a in KOLEKSIYON_TANIMLARI ? <KoleksiyonSayfasi key={`${a}/${b ?? ""}`} koleksiyon={a as KoleksiyonAdi} kimlik={b} /> : <Bulunmadi />;
        break;
      case "ayarlar":
        sayfa = <AyarlarSayfasi sekme={a} />;
        break;
      case "medya":
        sayfa = <MedyaSayfasi />;
        break;
      case "talepler":
        sayfa = <TaleplerSayfasi yenilendi={ozetYukle} />;
        break;
      case "projeler":
        sayfa = <ProjelerSayfasi key={a ?? ""} id={a} sorgu={sorgu} />;
        break;
      case "hesaplar":
        sayfa = <HesaplarSayfasi sorgu={sorgu} />;
        break;
      case "yedekler":
        sayfa = <YedeklerSayfasi ozet={ozet} />;
        break;
      case "hesabim":
        sayfa = <HesabimSayfasi kullanici={kullanici} />;
        break;
      case "rehber":
        sayfa = <RehberSayfasi />;
        break;
      case "yeni-musteri":
        sayfa = <YeniMusteriSayfasi key={sorgu.toString()} sorgu={sorgu} />;
        break;
      default:
        sayfa = <Bulunmadi />;
    }
  }

  return (
    <YonetimBaglam.Provider value={baglam}>
      <FormBaglam.Provider value={formBaglam}>
        <div className="min-h-[100svh] bg-zemin lg:grid lg:grid-cols-[264px_minmax(0,1fr)]">
          <aside className="sticky top-0 hidden h-[100svh] border-r border-white/[0.06] bg-[#08080a] lg:block">
            <KenarMenu aktif={aktif} ozet={ozet} kullanici={kullanici} cikis={cikis} />
          </aside>

          <div className="sticky top-0 z-40 flex h-14 items-center justify-between border-b border-white/[0.06] bg-zemin/90 px-4 backdrop-blur lg:hidden">
            <a href="#/" className="flex items-baseline gap-2">
              <span className="text-[22px] font-bold leading-none tracking-[-0.07em] text-white">KAM</span>
              <span className="text-[12.5px] text-neutral-500">Yönetim</span>
            </a>
            <button type="button" onClick={() => setMobilMenu(true)} aria-label="Menüyü aç" className="flex h-10 w-10 items-center justify-center rounded-lg text-neutral-300 hover:bg-white/5">
              <IconMenu2 size={22} />
            </button>
          </div>
          {mobilMenu && (
            <div className="fixed inset-0 z-[70] lg:hidden">
              <div className="absolute inset-0 bg-black/70" onClick={() => setMobilMenu(false)} />
              <aside className="absolute inset-y-0 left-0 w-[86%] max-w-[300px] border-r border-white/[0.06] bg-[#08080a]">
                <KenarMenu aktif={aktif} ozet={ozet} kullanici={kullanici} cikis={cikis} kapat={() => setMobilMenu(false)} />
              </aside>
            </div>
          )}

          <main className="min-w-0 px-4 pb-24 pt-7 sm:px-6 lg:px-10 lg:pt-10">
            <div className="mx-auto max-w-[1180px]">{sayfa}</div>
          </main>
        </div>
      </FormBaglam.Provider>
    </YonetimBaglam.Provider>
  );
}

function Bulunmadi() {
  return (
    <div className="py-20 text-center">
      <p className="text-lg font-semibold text-white">Bu sayfa bulunamadı</p>
      <a href="#/" className="mt-3 inline-block text-sm text-vurgu hover:underline">
        Genel bakışa dön
      </a>
    </div>
  );
}

/* ---------------- Oturum ---------------- */

export default function Panel() {
  const [durum, setDurum] = useState<{ yukleniyor: boolean; kullanici: Kullanici | null; kurulum: boolean; hata?: string }>({
    yukleniyor: true,
    kullanici: null,
    kurulum: false,
  });
  const [oturumDustu, setOturumDustu] = useState(false);

  const kontrol = useCallback(() => {
    oturum
      .durum()
      .then((d) => setDurum({ yukleniyor: false, kullanici: d.kullanici, kurulum: d.kurulum }))
      .catch((h) => setDurum({ yukleniyor: false, kullanici: null, kurulum: false, hata: hataMetni(h) }));
  }, []);

  useEffect(() => {
    kontrol();
    const dustu = () => setOturumDustu(true);
    window.addEventListener(OTURUM_DUSTU, dustu);
    return () => window.removeEventListener(OTURUM_DUSTU, dustu);
  }, [kontrol]);

  const cikis = async () => {
    if (!ayrilmaOnayi()) return;
    await oturum.cikis().catch(() => {});
    setDurum({ yukleniyor: false, kullanici: null, kurulum: false });
  };

  let govde: ReactNode;
  if (durum.yukleniyor) govde = <Yukleniyor tamEkran />;
  else if (durum.hata)
    govde = (
      <div className="mx-auto flex min-h-[100svh] max-w-lg items-center px-5">
        <HataKutusu hata={`Sunucuya ulaşılamadı. ${durum.hata}`} yenile={kontrol} />
      </div>
    );
  else if (!durum.kullanici)
    govde = <Giris mod="yonetim" kurulum={durum.kurulum} tamam={(k) => setDurum({ yukleniyor: false, kullanici: k, kurulum: false })} />;
  else if (durum.kullanici.rol !== "yonetici")
    govde = (
      <div className="mx-auto flex min-h-[100svh] max-w-md flex-col justify-center px-5">
        <h1 className="text-2xl font-bold text-white">Bu bir müşteri hesabı</h1>
        <p className="mt-2 text-neutral-400">Projenizi müşteri panelinden takip edebilirsiniz.</p>
        <div className="mt-6 flex gap-2">
          <a href="/musteri/" className="inline-flex h-10 items-center rounded-lg bg-vurgu px-4 text-sm font-medium text-white">
            Müşteri paneline git
          </a>
          <Dugme onClick={cikis}>Çıkış yap</Dugme>
        </div>
      </div>
    );
  else govde = <Kabuk kullanici={durum.kullanici} cikis={cikis} />;

  return (
    <PanelSaglayici>
      {govde}
      {oturumDustu && durum.kullanici && (
        <Giris
          mod="yonetim"
          pencere
          tamam={(k) => {
            setOturumDustu(false);
            setDurum((d) => ({ ...d, kullanici: k }));
          }}
        />
      )}
    </PanelSaglayici>
  );
}
