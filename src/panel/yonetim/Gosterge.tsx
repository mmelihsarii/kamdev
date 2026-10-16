/* Genel bakış: bekleyen işler, son talepler, güncelleme bekleyen projeler ve yarım kalan taslaklar. */
import { useMemo, useState, type ReactNode } from "react";
import {
  IconArrowRight,
  IconArticle,
  IconClockHour4,
  IconDatabase,
  IconFilePencil,
  IconInbox,
  IconBriefcase,
  IconHome,
  IconLifebuoy,
  IconPhoto,
  IconRoute,
  IconSend,
  IconUserPlus,
  IconUsers,
  IconX,
} from "@tabler/icons-react";
import type { KoleksiyonAdi } from "../../veri/tipler";
import { gunOnceGoster, onceGoster, tarihSaatGoster, yonetim, type MusteriProjesi, type Ozet, type Talep } from "../api";
import { KART, useVeri } from "../ortak";
import { KOLEKSIYON_TANIMLARI } from "../sema";
import { useYonetimIcerik } from "./baglam";

function Sayac({ ad, deger, hedef, ikon, vurgulu }: { ad: string; deger: number | undefined; hedef: string; ikon: ReactNode; vurgulu?: boolean }) {
  return (
    <a href={hedef} className={`${KART} group flex flex-col justify-between p-5 transition-colors hover:border-white/15 hover:bg-white/[0.035]`}>
      <span className={`${vurgulu ? "text-vurgu" : "text-neutral-500"}`}>{ikon}</span>
      <span className="mt-6">
        <span className={`block text-[32px] font-bold leading-none tabular-nums ${vurgulu ? "text-vurgu" : "text-white"}`}>{deger ?? "0"}</span>
        <span className="mt-2 block text-[13.5px] text-neutral-400">{ad}</span>
      </span>
    </a>
  );
}

/** Tarayıcıda bekleyen taslaklar; hangi forma ait olduklarını anahtarlarından çözer. */
function useTaslaklar() {
  const { icerik } = useYonetimIcerik();
  return useMemo(() => {
    const liste: { ad: string; hedef: string; zaman: number }[] = [];
    try {
      for (let i = 0; i < localStorage.length; i++) {
        const anahtar = localStorage.key(i) ?? "";
        if (!anahtar.startsWith("kam-taslak:")) continue;
        const [tur, a, b] = anahtar.slice("kam-taslak:".length).split(":");
        const zaman = (JSON.parse(localStorage.getItem(anahtar) ?? "{}") as { zaman?: number }).zaman ?? 0;
        if (tur === "oge" && a in KOLEKSIYON_TANIMLARI) {
          const tanim = KOLEKSIYON_TANIMLARI[a as KoleksiyonAdi];
          const oge = (icerik[a as KoleksiyonAdi] as unknown as Record<string, unknown>[]).find((o) => o.kimlik === b);
          const ad = oge ? tanim.ozet(oge).baslik : `Yeni ${tanim.tekil.toLocaleLowerCase("tr")}`;
          liste.push({ ad: `${tanim.baslik}, ${ad}`, hedef: `#/icerik/${a}/${b}`, zaman });
        } else if (tur === "ayarlar") {
          liste.push({ ad: "Site ayarları", hedef: "#/ayarlar", zaman });
        } else if (tur === "proje") {
          liste.push({ ad: a === "yeni" ? "Yeni müşteri projesi" : "Müşteri projesi", hedef: `#/projeler/${a}`, zaman });
        } else if (tur === "guncelleme") {
          liste.push({ ad: "Yazılmakta olan proje güncellemesi", hedef: `#/projeler/${a}`, zaman });
        }
      }
    } catch {
      // depolama kapalı
    }
    return liste.sort((x, y) => y.zaman - x.zaman);
  }, [icerik]);
}

type Gorev = { baslik: string; aciklama: string; hedef: string; ikon: ReactNode; vurgulu?: boolean };

function GorevKarti({ g }: { g: Gorev }) {
  return (
    <a
      href={g.hedef}
      className={`group flex items-start gap-4 rounded-xl border p-5 transition-colors ${
        g.vurgulu ? "border-vurgu/35 bg-vurgu/[0.06] hover:border-vurgu/60" : "border-white/[0.07] bg-white/[0.02] hover:border-white/15 hover:bg-white/[0.035]"
      }`}
    >
      <span className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${g.vurgulu ? "bg-vurgu text-white" : "bg-white/[0.06] text-neutral-200 group-hover:text-white"}`}>
        {g.ikon}
      </span>
      <span className="min-w-0 flex-1">
        <span className="flex items-center gap-2 text-[15.5px] font-semibold text-white">
          {g.baslik}
          <IconArrowRight size={16} className="text-neutral-500 transition-transform group-hover:translate-x-0.5 group-hover:text-white" />
        </span>
        <span className="mt-1 block text-[13.5px] leading-relaxed text-neutral-400">{g.aciklama}</span>
      </span>
    </a>
  );
}

function Hosgeldin({ ad }: { ad: string }) {
  const [gizli, setGizli] = useState(() => {
    try {
      return localStorage.getItem("kam-hosgeldin-gizli") === "1";
    } catch {
      return false;
    }
  });
  if (gizli) return null;
  const gizle = () => {
    setGizli(true);
    try {
      localStorage.setItem("kam-hosgeldin-gizli", "1");
    } catch {
      // yok say
    }
  };
  return (
    <section className="relative mb-8 overflow-hidden rounded-2xl border border-white/[0.08] bg-gradient-to-br from-vurgu/[0.09] via-white/[0.02] to-transparent p-6 sm:p-7">
      <button type="button" onClick={gizle} aria-label="Kapat" className="absolute right-3 top-3 flex h-8 w-8 items-center justify-center rounded-lg text-neutral-500 hover:bg-white/5 hover:text-white">
        <IconX size={16} />
      </button>
      <h2 className="text-[20px] font-bold tracking-tight text-white">Panele hoş geldin{ad ? `, ${ad}` : ""}.</h2>
      <p className="mt-2 max-w-3xl text-[14.5px] leading-relaxed text-neutral-300">
        Burada iki şeyi yönetiyorsun. Birincisi siten, yani ziyaretçilerin gördüğü yazılar, görseller ve bölümler. İkincisi müşterilerin, yani her müşterinin kendi
        şifresiyle girip projesini takip ettiği ekran. Aşağıdan ne yapmak istediğini seç, gerisini panel adım adım gösterir.
      </p>
      <div className="mt-5 flex flex-wrap gap-2">
        <a href="#/rehber" className="inline-flex h-10 items-center gap-2 rounded-lg bg-white px-4 text-sm font-semibold text-zemin hover:bg-neutral-200">
          <IconLifebuoy size={17} />
          Nasıl kullanılır
        </a>
        <button type="button" onClick={gizle} className="inline-flex h-10 items-center rounded-lg px-4 text-sm text-neutral-400 hover:text-white">
          Anladım, bir daha gösterme
        </button>
      </div>
    </section>
  );
}

export default function Gosterge({ ozet, kullaniciAdi = "" }: { ozet: Ozet | null; kullaniciAdi?: string }) {
  const talepler = useVeri(() => yonetim<Talep[]>("talepler"));
  const projeler = useVeri(() => yonetim<MusteriProjesi[]>("projeler"));
  const taslaklar = useTaslaklar();

  const aktifProjeler = (projeler.veri ?? []).filter((p) => p.durum === "devam");
  const yeniTalep = ozet?.yeniTalep ?? 0;

  const siteGorevleri: Gorev[] = [
    { baslik: "Blog yazısı yaz", aciklama: "Yeni bir makale ekle. Blog sayfasında ve aramalarda görünür.", hedef: "#/icerik/yazilar/yeni", ikon: <IconArticle size={21} /> },
    { baslik: "Ana sayfanın yazısını değiştir", aciklama: "En üstteki büyük başlık, açıklama ve düğmeler. Önizlemeli.", hedef: "#/ayarlar/giris", ikon: <IconHome size={21} /> },
    { baslik: "Referans iş ekle", aciklama: "Yaptığın bir projeyi görselleriyle ana sayfada göster.", hedef: "#/icerik/projeler/yeni", ikon: <IconBriefcase size={21} /> },
  ];

  const musteriGorevleri: Gorev[] = [
    {
      baslik: "Gelen talepler",
      aciklama: yeniTalep ? `${yeniTalep} yeni mesaj seni bekliyor. Okuyup WhatsApp ya da mail ile dön.` : "Siteden yazan herkes burada. Şu an yeni mesaj yok.",
      hedef: "#/talepler",
      ikon: <IconInbox size={21} />,
      vurgulu: yeniTalep > 0,
    },
    { baslik: "Yeni müşteri başlat", aciklama: "Anlaştığın kişinin hesabını ve proje takip ekranını tek seferde aç.", hedef: "#/yeni-musteri", ikon: <IconUserPlus size={21} /> },
    {
      baslik: "Müşteriye güncelleme gönder",
      aciklama:
        aktifProjeler.length === 1
          ? `${aktifProjeler[0].ad} için not ve ekran görüntüsü ekle, müşteri hemen görsün.`
          : "Projeyi seç, not ve ekran görüntüsü ekle, müşteri panelinde hemen görsün.",
      hedef: aktifProjeler.length === 1 ? `#/projeler/${aktifProjeler[0].id}` : "#/projeler",
      ikon: <IconSend size={21} />,
    },
  ];

  const bekleyenProjeler = useMemo(() => {
    const sinir = Date.now() - 7 * 24 * 3600 * 1000;
    return (projeler.veri ?? []).filter((p) => p.durum === "devam" && (!p.son_guncelleme || new Date(p.son_guncelleme + "T12:00:00").getTime() < sinir));
  }, [projeler.veri]);

  return (
    <div>
      <Hosgeldin ad={kullaniciAdi.split(" ")[0]} />

      <h1 className="text-[26px] font-bold tracking-tight text-white sm:text-[30px]">Ne yapmak istiyorsun?</h1>

      <div className="mt-6">
        <p className="mb-3 text-[12px] font-semibold uppercase tracking-[0.12em] text-neutral-500">Siten</p>
        <div className="grid gap-3 md:grid-cols-3">
          {siteGorevleri.map((g) => (
            <GorevKarti key={g.baslik} g={g} />
          ))}
        </div>
      </div>

      <div className="mt-6">
        <p className="mb-3 text-[12px] font-semibold uppercase tracking-[0.12em] text-neutral-500">Müşterilerin</p>
        <div className="grid gap-3 md:grid-cols-3">
          {musteriGorevleri.map((g) => (
            <GorevKarti key={g.baslik} g={g} />
          ))}
        </div>
      </div>

      <h2 className="mb-3 mt-12 text-[12px] font-semibold uppercase tracking-[0.12em] text-neutral-500">Durum</h2>
      <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-5">
        <Sayac ad="Yeni talep" deger={ozet?.yeniTalep} hedef="#/talepler" ikon={<IconInbox size={22} />} vurgulu={!!ozet?.yeniTalep} />
        <Sayac ad="Devam eden proje" deger={ozet?.aktifProje} hedef="#/projeler" ikon={<IconRoute size={22} />} />
        <Sayac ad="Müşteri hesabı" deger={ozet?.musteri} hedef="#/hesaplar" ikon={<IconUsers size={22} />} />
        <Sayac ad="Blog yazısı" deger={ozet?.yazi} hedef="#/icerik/yazilar" ikon={<IconArticle size={22} />} />
        <Sayac ad="Yüklenen görsel" deger={ozet?.medya} hedef="#/medya" ikon={<IconPhoto size={22} />} />
      </div>

      {taslaklar.length > 0 && (
        <section className={`${KART} mt-6 border-amber-400/20 bg-amber-400/[0.03] p-5`}>
          <h2 className="flex items-center gap-2 text-[15px] font-semibold text-amber-200">
            <IconFilePencil size={18} />
            Kaydedilmemiş taslaklar
          </h2>
          <p className="mt-1 text-[13.5px] text-neutral-400">Bu tarayıcıda yarım kalmış düzenlemeler. Açıp kaydedebilir ya da silebilirsin.</p>
          <ul className="mt-3 divide-y divide-white/[0.05]">
            {taslaklar.map((t) => (
              <li key={t.hedef}>
                <a href={t.hedef} className="flex items-center justify-between gap-3 py-2.5 text-sm text-neutral-200 hover:text-white">
                  <span className="truncate">{t.ad}</span>
                  <span className="shrink-0 text-[12.5px] text-neutral-500">{onceGoster(new Date(t.zaman).toISOString())}</span>
                </a>
              </li>
            ))}
          </ul>
        </section>
      )}

      <div className="mt-6 grid gap-6 xl:grid-cols-2">
        <section className={`${KART} p-5`}>
          <div className="flex items-center justify-between">
            <h2 className="text-[15px] font-semibold text-white">Son talepler</h2>
            <a href="#/talepler" className="flex items-center gap-1 text-[13px] text-neutral-400 hover:text-white">
              Hepsi <IconArrowRight size={14} />
            </a>
          </div>
          {(talepler.veri ?? []).length === 0 ? (
            <p className="mt-4 text-sm text-neutral-500">{talepler.yukleniyor ? "Yükleniyor" : "Henüz talep gelmedi. Sitedeki iletişim formundan gelenler burada görünür."}</p>
          ) : (
            <ul className="mt-3 divide-y divide-white/[0.05]">
              {(talepler.veri ?? []).slice(0, 5).map((t) => (
                <li key={t.id}>
                  <a href="#/talepler" className="flex items-start justify-between gap-4 py-3">
                    <span className="min-w-0">
                      <span className="flex items-center gap-2 text-sm font-medium text-neutral-100">
                        {t.ad || "İsimsiz"}
                        {t.durum === "yeni" && <span className="text-[12px] font-semibold text-vurgu">Yeni</span>}
                      </span>
                      <span className="mt-0.5 block truncate text-[13px] text-neutral-500">{[t.konu, t.mesaj].filter(Boolean).join(", ")}</span>
                    </span>
                    <span className="shrink-0 text-[12.5px] text-neutral-500">{onceGoster(t.olusturma)}</span>
                  </a>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className={`${KART} p-5`}>
          <div className="flex items-center justify-between">
            <h2 className="text-[15px] font-semibold text-white">Güncelleme bekleyen projeler</h2>
            <a href="#/projeler" className="flex items-center gap-1 text-[13px] text-neutral-400 hover:text-white">
              Hepsi <IconArrowRight size={14} />
            </a>
          </div>
          <p className="mt-1 text-[13px] text-neutral-500">Devam eden ve bir haftadır müşteriye güncelleme girilmemiş projeler.</p>
          {bekleyenProjeler.length === 0 ? (
            <p className="mt-4 text-sm text-neutral-500">{projeler.yukleniyor ? "Yükleniyor" : "Hepsi güncel."}</p>
          ) : (
            <ul className="mt-3 divide-y divide-white/[0.05]">
              {bekleyenProjeler.slice(0, 6).map((p) => (
                <li key={p.id}>
                  <a href={`#/projeler/${p.id}`} className="flex items-center justify-between gap-4 py-3">
                    <span className="min-w-0">
                      <span className="block truncate text-sm font-medium text-neutral-100">{p.ad}</span>
                      <span className="block truncate text-[13px] text-neutral-500">{p.musteri_firma || p.musteri_ad}</span>
                    </span>
                    <span className="flex shrink-0 items-center gap-1.5 text-[12.5px] text-amber-300/90">
                      <IconClockHour4 size={14} />
                      {p.son_guncelleme ? gunOnceGoster(p.son_guncelleme) : "Hiç güncelleme yok"}
                    </span>
                  </a>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>

      <section className={`${KART} mt-6 flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between`}>
        <div className="flex items-start gap-3">
          <IconDatabase size={22} className="mt-0.5 shrink-0 text-emerald-400" />
          <div>
            <h2 className="text-[15px] font-semibold text-white">Verilerin güvende</h2>
            <p className="mt-1 text-[13.5px] leading-relaxed text-neutral-400">
              Her gün otomatik yedek alınıyor, son 30 gün saklanıyor. Silinen her kayıt önce çöp kutusuna gidiyor.
              {ozet?.sonYedek && ` Son yedek ${tarihSaatGoster(ozet.sonYedek)}.`}
            </p>
          </div>
        </div>
        <a href="#/yedekler" className="inline-flex h-10 shrink-0 items-center rounded-lg border border-white/12 bg-white/[0.04] px-4 text-sm font-medium text-neutral-100 hover:border-white/25">
          Yedekleri yönet
        </a>
      </section>
    </div>
  );
}
