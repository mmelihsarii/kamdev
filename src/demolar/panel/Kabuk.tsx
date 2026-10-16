/*
 * Demo panelinin kabuğu: veri deposu, adresleme, yan menü, üst çubuk, arama,
 * bildirimler, "Bu ekran" açıklama sütunu ve görevler. Tam ekran sayfada da
 * tanıtım sayfasına gömülü halde de aynı kod çalışır; gömülüyken her şey kendi
 * çerçevesinin içinde kalır ve sayfanın kısayollarını ele geçirmez.
 */
import { useCallback, useEffect, useMemo, useRef, useState, type CSSProperties, type ReactNode } from "react";
import { AnimatePresence, motion } from "motion/react";
import {
  IconArrowLeft,
  IconArrowsExchange,
  IconArrowsMaximize,
  IconBell,
  IconBrandWhatsapp,
  IconCheck,
  IconChevronRight,
  IconCircle,
  IconCircleCheckFilled,
  IconClock,
  IconInfoCircle,
  IconInfoSquareRounded,
  IconListCheck,
  IconMenu2,
  IconMoon,
  IconPlus,
  IconRefresh,
  IconSearch,
  IconSun,
  IconX,
} from "@tabler/icons-react";
import ListeEkrani from "./Liste";
import { Cubuk, Dugme, Harf, RENK, TEMA } from "./parcalar";
import { EGRI } from "../../bilesenler/Hareket";
import { bas, demoFarki, once, rastgele, saat } from "../ortak";
import { useIcerik } from "../../veri/kaynak";
import { SEKTORLER } from "../katalog";
import { sayfaMesaji, whatsappAdresi, whatsappNumarasi } from "../../lib/whatsapp";
import type { Kayit, PanelApi, SektorBilgi, SektorPanel, Veri } from "../tipler";

type Haber = { id: number; metin: string; tur: "basari" | "bilgi" | "uyari" };
type Akis = { zaman: number; metin: string; modul: string; kayit?: string };
type Saklanan = { veri: Veri; bitenler: string[]; akis: Akis[] };
type Konum = { modul: string; kayit: string | null; filtre?: string; surum: number; yeni: number };
type Katman = null | "ara" | "zil" | "gorev" | "yeni" | "menu" | "sektor";

const gunAnahtari = (slug: string) => `kam-demo-${slug}-${new Date().toLocaleDateString("sv-SE")}`;

function oku<T>(anahtar: string, depo: "local" | "session"): T | null {
  try {
    const m = (depo === "local" ? localStorage : sessionStorage).getItem(anahtar);
    return m ? (JSON.parse(m) as T) : null;
  } catch {
    return null;
  }
}
function yaz(anahtar: string, deger: unknown, depo: "local" | "session") {
  try {
    (depo === "local" ? localStorage : sessionStorage).setItem(anahtar, JSON.stringify(deger));
  } catch {
    /* Gizli pencerede depo kapalı olabilir; demo yine çalışır. */
  }
}

/* ---------------- Veri deposu ---------------- */

function useDemoDeposu(bilgi: SektorBilgi, panel: SektorPanel) {
  const anahtar = gunAnahtari(bilgi.slug);
  const [fark] = useState(() => demoFarki(panel.saat));
  const [simdi, setSimdi] = useState(() => Date.now());
  useEffect(() => {
    const t = window.setInterval(() => setSimdi(Date.now()), 15_000);
    return () => window.clearInterval(t);
  }, []);
  const ani = useMemo(() => new Date(simdi + fark), [simdi, fark]);

  const ilk = () => ({
    veri: panel.uret(new Date(Date.now() + fark), rastgele(anahtar)),
    bitenler: [],
    akis: [],
  });
  const [depo, setDepo] = useState<Saklanan>(() => oku<Saklanan>(anahtar, "session") ?? ilk());
  useEffect(() => {
    const t = window.setTimeout(() => yaz(anahtar, depo, "session"), 300);
    return () => window.clearTimeout(t);
  }, [depo, anahtar]);

  // Görevin iki kez sayılmaması için bitenler ayrıca burada tutulur.
  const bitenRef = useRef(new Set(depo.bitenler));
  const [haberler, setHaberler] = useState<Haber[]>([]);
  const haberSayaci = useRef(0);
  const haber = useCallback((metin: string, tur: Haber["tur"] = "bilgi") => {
    const id = ++haberSayaci.current;
    setHaberler((h) => [...h.slice(-2), { id, metin, tur }]);
    window.setTimeout(() => setHaberler((h) => h.filter((x) => x.id !== id)), 3800);
  }, []);

  const [konumIstegi, setKonumIstegi] = useState<{ modul: string; kayit?: string; filtre?: string; n: number } | null>(null);
  const idSayaci = useRef(0);

  const api: PanelApi = useMemo(() => {
    const notEkle = (k: Kayit, metin: string) => ({ ...k, gecmis: [{ t: Date.now() + fark, m: metin }, ...((k.gecmis as unknown[]) ?? [])] });
    return {
      veri: depo.veri,
      ani,
      bul: (koleksiyon, id) => depo.veri[koleksiyon]?.find((k) => k.id === id),
      guncelle: (koleksiyon, id, degisim, kayitNotu) =>
        setDepo((d) => ({
          ...d,
          veri: {
            ...d.veri,
            [koleksiyon]: d.veri[koleksiyon].map((k) => (k.id === id ? (kayitNotu ? notEkle({ ...k, ...degisim }, kayitNotu) : { ...k, ...degisim }) : k)),
          },
        })),
      ekle: (koleksiyon, kayit, basa = true) =>
        setDepo((d) => ({ ...d, veri: { ...d.veri, [koleksiyon]: basa ? [kayit, ...(d.veri[koleksiyon] ?? [])] : [...(d.veri[koleksiyon] ?? []), kayit] } })),
      git: (modul, secenek) => setKonumIstegi((o) => ({ modul, kayit: secenek?.kayit, filtre: secenek?.filtre, n: (o?.n ?? 0) + 1 })),
      haber,
      bildir: (metin, modul, kayit) => {
        setDepo((d) => ({ ...d, akis: [{ metin, modul, kayit, zaman: Date.now() + fark }, ...d.akis].slice(0, 20) }));
        haber(metin, "bilgi");
      },
      olay: (ad) => {
        const gorev = panel.gorevler.find((g) => g.olay === ad);
        if (!gorev || bitenRef.current.has(gorev.id)) return;
        bitenRef.current.add(gorev.id);
        const kalan = panel.gorevler.length - bitenRef.current.size;
        setDepo((d) => (d.bitenler.includes(gorev.id) ? d : { ...d, bitenler: [...d.bitenler, gorev.id] }));
        window.setTimeout(() => haber(kalan ? `Görev tamam. ${kalan} görev kaldı.` : "Bütün görevler tamam. Paneli tanıdınız.", "basari"), 450);
      },
      yeniId: (onek) => `${onek}${String(Date.now()).slice(-5)}${++idSayaci.current}`,
    };
  }, [depo.veri, ani, fark, haber, panel.gorevler]);

  // Canlı akış: ekran görünürken arada bir yeni kayıt düşer.
  const apiRef = useRef(api);
  apiRef.current = api;
  const gorunur = useRef(true);
  useEffect(() => {
    if (!panel.canli || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    let sayi = 0;
    const r = rastgele(`${anahtar}-canli-${Date.now()}`);
    const t = window.setInterval(() => {
      if (!gorunur.current || document.visibilityState !== "visible" || sayi >= 12) return;
      sayi++;
      panel.canli!.uret(apiRef.current, r);
    }, panel.canli.aralik);
    return () => window.clearInterval(t);
  }, [panel, anahtar]);

  const sifirla = () => {
    bitenRef.current = new Set();
    setDepo(ilk());
    haber("Demo ilk haline döndü", "bilgi");
  };

  return { api, depo, haberler, fark, sifirla, konumIstegi, gorunur };
}

/* ---------------- Kabuk ---------------- */

export default function Kabuk({ bilgi, panel, gomulu = false }: { bilgi: SektorBilgi; panel: SektorPanel; gomulu?: boolean }) {
  const { api, depo, haberler, fark, sifirla, konumIstegi, gorunur } = useDemoDeposu(bilgi, panel);
  const icerik = useIcerik();
  const whatsapp = whatsappNumarasi(icerik.ayarlar.site.whatsapp);
  const kok = useRef<HTMLDivElement>(null);
  const ilkModul = panel.moduller[0].id;

  const cozumle = useCallback(
    (hash: string): Pick<Konum, "modul" | "kayit"> => {
      const [m, k] = decodeURIComponent(hash.replace(/^#/, "")).split("/");
      return panel.moduller.some((x) => x.id === m) ? { modul: m, kayit: k || null } : { modul: ilkModul, kayit: null };
    },
    [panel.moduller, ilkModul],
  );

  const [konum, setKonum] = useState<Konum>(() => ({ ...(gomulu ? { modul: ilkModul, kayit: null } : cozumle(window.location.hash)), surum: 0, yeni: 0 }));

  const git = useCallback(
    (modul: string, kayit: string | null = null, filtre?: string, yeni = false) => {
      setKonum((o) => ({ modul, kayit, filtre, surum: o.surum + (filtre || o.modul !== modul ? 1 : 0), yeni: yeni ? o.yeni + 1 : o.yeni }));
      if (!gomulu) {
        const hash = `#${modul}${kayit ? `/${kayit}` : ""}`;
        if (window.location.hash !== hash) window.history.pushState(null, "", hash);
      }
      if (!kayit) kok.current?.querySelector("main")?.scrollTo({ top: 0 });
    },
    [gomulu],
  );

  useEffect(() => {
    if (konumIstegi) {
      git(konumIstegi.modul, konumIstegi.kayit ?? null, konumIstegi.filtre);
      setKatman(null);
    }
  }, [konumIstegi, git]);

  useEffect(() => {
    if (gomulu) return;
    const geri = () => setKonum((o) => ({ ...o, ...cozumle(window.location.hash), filtre: undefined }));
    window.addEventListener("popstate", geri);
    return () => window.removeEventListener("popstate", geri);
  }, [gomulu, cozumle]);

  // Tema ve açıklama sütunu tercihleri ziyaretçinin tarayıcısında kalır.
  const [koyu, setKoyu] = useState(() => oku<string>("kam-demo-tema", "local") !== "acik");
  const [genislik, setGenislik] = useState(1400);
  const [aciklama, setAciklama] = useState<boolean | null>(() => {
    const t = oku<string>("kam-demo-aciklama", "local");
    return t === null ? null : t === "acik";
  });
  useEffect(() => {
    const el = kok.current;
    if (!el) return;
    const izle = new ResizeObserver(([g]) => setGenislik(g.contentRect.width));
    izle.observe(el);
    const gor = new IntersectionObserver(([g]) => (gorunur.current = g.isIntersecting), { threshold: 0.2 });
    gor.observe(el);
    return () => {
      izle.disconnect();
      gor.disconnect();
    };
  }, [gorunur]);
  const genis = genislik >= 1240;
  const aciklamaAcik = aciklama ?? genis;
  const aciklamaDegistir = () => {
    const yeni = !aciklamaAcik;
    setAciklama(yeni);
    yaz("kam-demo-aciklama", yeni ? "acik" : "kapali", "local");
  };

  const [katman, setKatman] = useState<Katman>(null);
  useEffect(() => {
    const tus = (e: KeyboardEvent) => {
      const icinde = !gomulu || kok.current?.contains(document.activeElement);
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k" && icinde) {
        e.preventDefault();
        setKatman((k) => (k === "ara" ? null : "ara"));
      }
      if (e.key === "Escape") setKatman(null);
    };
    window.addEventListener("keydown", tus);
    return () => window.removeEventListener("keydown", tus);
  }, [gomulu]);

  const modulBilgi = (id: string) => bilgi.moduller.find((m) => m.id === id)!;
  const aktif = panel.moduller.find((m) => m.id === konum.modul) ?? panel.moduller[0];
  const aktifBilgi = modulBilgi(aktif.id);
  const uyarilar = panel.uyarilar(api);
  const yeniler = panel.moduller.filter((m) => m.ekran.tur === "liste" && m.ekran.yeni);

  const gruplar: [string, typeof panel.moduller][] = [];
  for (const m of panel.moduller) {
    const g = gruplar.find(([ad]) => ad === m.grup);
    if (g) g[1].push(m);
    else gruplar.push([m.grup, [m]]);
  }

  const degiskenler = { ...TEMA[koyu ? "koyu" : "acik"], "--p": bilgi.renk } as unknown as CSSProperties;

  const yanMenu = (
    <div className="flex h-full flex-col">
      <div className="flex items-center gap-2.5 px-3 pb-3 pt-4">
        <Harf metin={bas(bilgi.firma)} renk={bilgi.renk} boy={34} />
        <span className="min-w-0">
          <span className="block truncate text-[13.5px] font-semibold text-[var(--m)]">{bilgi.firma}</span>
          <span className="block truncate text-[11.5px] text-[var(--ms)]">{bilgi.firmaAlt}</span>
        </span>
      </div>
      <nav aria-label="Panel menüsü" className="min-h-0 flex-1 overflow-y-auto px-2 pb-3">
        {gruplar.map(([grup, moduller]) => (
          <div key={grup} className="mt-3">
            <p className="px-2.5 pb-1 text-[10.5px] font-semibold uppercase tracking-[0.1em] text-[var(--ms)] opacity-80">{grup}</p>
            {moduller.map((m) => {
              const b = modulBilgi(m.id);
              const secili = m.id === aktif.id;
              const rozet = m.rozet?.(api) ?? 0;
              return (
                <button
                  key={m.id}
                  type="button"
                  onClick={() => {
                    git(m.id);
                    setKatman(null);
                  }}
                  aria-current={secili ? "page" : undefined}
                  className={`relative flex h-9 w-full items-center gap-2.5 rounded-lg px-2.5 text-[13px] transition-colors ${
                    secili ? "bg-[var(--k2)] font-semibold text-[var(--m)]" : "text-[var(--ms)] hover:bg-[var(--k2)] hover:text-[var(--m)]"
                  }`}
                >
                  {secili && <span aria-hidden="true" className="absolute -left-2 top-2 h-5 w-[3px] rounded-r bg-[var(--p)]" />}
                  <b.ikon size={17} className={secili ? "text-[var(--p)]" : ""} />
                  <span className="flex-1 truncate text-left">{b.ad}</span>
                  {rozet > 0 && <span className="text-[11.5px] font-semibold tabular-nums text-[var(--p)]">{rozet}</span>}
                </button>
              );
            })}
          </div>
        ))}
      </nav>
      <div className="space-y-2 border-t border-[var(--k)] p-3">
        <button type="button" onClick={() => setKatman("gorev")} className="block w-full rounded-lg border border-[var(--k)] bg-[var(--kart)] p-3 text-left transition-colors hover:border-[var(--p)]">
          <span className="flex items-center gap-1.5 text-[12.5px] font-semibold text-[var(--m)]">
            <IconListCheck size={16} className="text-[var(--p)]" />
            Demo görevleri
          </span>
          <span className="mt-2 block">
            <Cubuk oran={depo.bitenler.length / panel.gorevler.length} ince />
          </span>
          <span className="mt-1.5 block text-[11.5px] tabular-nums text-[var(--ms)]">
            {depo.bitenler.length === panel.gorevler.length ? "Hepsi tamam" : `${panel.gorevler.length} görevin ${depo.bitenler.length} tanesi tamam`}
          </span>
        </button>
        <div className="flex items-center justify-between gap-2 px-1">
          {gomulu ? (
            <a href={`/demolar/${bilgi.slug}/panel/#${aktif.id}`} className="inline-flex items-center gap-1.5 text-[12px] text-[var(--ms)] hover:text-[var(--m)]">
              <IconArrowsMaximize size={14} />
              Tam ekran aç
            </a>
          ) : (
            <div className="relative">
              <button type="button" onClick={() => setKatman(katman === "sektor" ? null : "sektor")} className="inline-flex items-center gap-1.5 text-[12px] text-[var(--ms)] hover:text-[var(--m)]">
                <IconArrowsExchange size={14} />
                Sektör değiştir
              </button>
              <AnimatePresence>
                {katman === "sektor" && (
                  <>
                    <div className="fixed inset-0 z-40" onClick={() => setKatman(null)} />
                    <motion.div
                      initial={{ opacity: 0, y: 6 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 6 }}
                      transition={{ duration: 0.18 }}
                      className="absolute bottom-7 left-0 z-50 w-60 overflow-hidden rounded-xl border border-[var(--k)] bg-[var(--kart2)] py-1 [box-shadow:var(--golge)]"
                    >
                      <p className="px-3 pb-1 pt-2 text-[11px] font-semibold uppercase tracking-[0.08em] text-[var(--ms)]">Diğer demolar</p>
                      {SEKTORLER.map((x) => (
                        <a
                          key={x.slug}
                          href={`/demolar/${x.slug}/panel/`}
                          aria-current={x.slug === bilgi.slug ? "page" : undefined}
                          className={`flex items-center gap-2.5 px-3 py-2 text-[13px] hover:bg-[var(--k2)] ${x.slug === bilgi.slug ? "font-semibold text-[var(--m)]" : "text-[var(--ms)]"}`}
                        >
                          <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md" style={{ background: `color-mix(in srgb, ${x.renk} 22%, transparent)`, color: x.renk }}>
                            <x.ikon size={14} />
                          </span>
                          {x.kisaAd}
                        </a>
                      ))}
                      <a href="/demolar/" className="mt-1 flex items-center gap-2 border-t border-[var(--k)] px-3 py-2.5 text-[12.5px] text-[var(--ms)] hover:text-[var(--m)]">
                        <IconArrowLeft size={14} />
                        Bütün demoların tanıtımı
                      </a>
                    </motion.div>
                  </>
                )}
              </AnimatePresence>
            </div>
          )}
          <button type="button" onClick={sifirla} title="Yaptığınız değişiklikleri silip demoyu baştan başlatır" className="inline-flex items-center gap-1.5 text-[12px] text-[var(--ms)] hover:text-[var(--m)]">
            <IconRefresh size={14} />
            Sıfırla
          </button>
        </div>
      </div>
    </div>
  );

  const Ekran = aktif.ekran;

  return (
    <div
      ref={kok}
      style={degiskenler}
      className={`@container/kabuk relative isolate flex flex-col overflow-hidden bg-[var(--y)] text-left text-[var(--m)] transition-colors duration-300 ${gomulu ? "h-full" : "h-[100svh]"}`}
    >
      {!gomulu && (
        <div className="flex shrink-0 items-center justify-between gap-3 border-b border-white/10 bg-[#050506] px-3 py-2 text-[12px] text-neutral-300 @2xl/kabuk:px-4">
          <span className="flex min-w-0 items-center gap-2">
            <a href="/" className="text-[17px] font-bold leading-none tracking-[-0.07em] text-white" aria-label="KAM ana sayfa">
              KAM
            </a>
            <span className="hidden truncate @3xl/kabuk:inline">
              Canlı demo. Veriler örnektir, yaptığınız değişiklikler yalnız bu tarayıcıda durur.
            </span>
          </span>
          <span className="flex shrink-0 items-center gap-1">
            <a href={`/demolar/${bilgi.slug}/`} className="hidden rounded-md px-2.5 py-1.5 font-medium hover:bg-white/10 hover:text-white @xl/kabuk:inline-flex">
              Bu panel ne yapıyor
            </a>
            {whatsapp && (
              <a
                href={whatsappAdresi(whatsapp, sayfaMesaji(`/demolar/${bilgi.slug}/`, icerik))}
                target="_blank"
                rel="noopener noreferrer"
                aria-label="WhatsApp ile yazın"
                title="WhatsApp ile yazın"
                className="flex h-8 w-8 items-center justify-center rounded-md text-[#25d366] hover:bg-white/10"
              >
                <IconBrandWhatsapp size={19} />
              </a>
            )}
            <a href="/iletisim/" className="rounded-md bg-[#ecebe7] px-3 py-1.5 font-semibold text-[#050506] hover:bg-white">
              Teklif al
            </a>
          </span>
        </div>
      )}

      <div className="relative flex min-h-0 flex-1">
        <aside className="hidden w-[232px] shrink-0 border-r border-[var(--k)] bg-[var(--yan)] @4xl/kabuk:block">{yanMenu}</aside>

        <div className="flex min-w-0 flex-1 flex-col">
          {/* Üst çubuk */}
          <header className="flex h-14 shrink-0 items-center gap-2 border-b border-[var(--k)] bg-[var(--yan)] px-2.5 @2xl/kabuk:px-4">
            <button
              type="button"
              aria-label="Menüyü aç"
              onClick={() => setKatman("menu")}
              className="flex h-9 w-9 items-center justify-center rounded-lg text-[var(--ms)] hover:bg-[var(--k2)] @4xl/kabuk:hidden"
            >
              <IconMenu2 size={19} />
            </button>
            <p className="flex min-w-0 items-center gap-1.5 text-[13px]">
              <span className="hidden truncate text-[var(--ms)] @5xl/kabuk:inline">{bilgi.firma}</span>
              <IconChevronRight size={14} className="hidden shrink-0 text-[var(--ms)] @5xl/kabuk:inline" />
              <span className="truncate font-semibold">{aktifBilgi.ad}</span>
            </p>
            <span className="flex-1" />
            {fark !== 0 && (
              <span
                title="Gerçek saatiniz işletmenin kapalı ya da çok sakin olduğu saatlere denk geldi. Panelin dolu halini görebilmeniz için demo günün yoğun saatinden çalışıyor."
                className="hidden items-center gap-1.5 text-[12px] text-[var(--ms)] @3xl/kabuk:inline-flex"
              >
                <IconClock size={15} />
                Demo saati {saat(api.ani)}
              </span>
            )}
            <button
              type="button"
              onClick={() => setKatman("ara")}
              className="flex h-9 items-center gap-2 rounded-lg border border-[var(--k)] px-2.5 text-[12.5px] text-[var(--ms)] hover:bg-[var(--k2)] @3xl/kabuk:w-52"
            >
              <IconSearch size={16} />
              <span className="hidden flex-1 text-left @3xl/kabuk:inline">Kayıt ya da ekran ara</span>
              <kbd className="hidden rounded border border-[var(--k)] px-1 text-[10.5px] @3xl/kabuk:inline">Ctrl K</kbd>
            </button>
            {yeniler.length > 0 && (
              <div className="relative">
                <Dugme tur="ana" ikon={IconPlus} onClick={() => setKatman(katman === "yeni" ? null : "yeni")}>
                  <span className="hidden @xl/kabuk:inline">Yeni</span>
                </Dugme>
                <Acilir acik={katman === "yeni"} kapat={() => setKatman(null)} className="right-0 w-60">
                  <p className="px-3 pb-1 pt-2 text-[11px] font-semibold uppercase tracking-[0.08em] text-[var(--ms)]">Hızlı oluştur</p>
                  {yeniler.map((m) => {
                    const b = modulBilgi(m.id);
                    return (
                      <button
                        key={m.id}
                        type="button"
                        onClick={() => {
                          setKatman(null);
                          git(m.id, null, undefined, true);
                        }}
                        className="flex w-full items-center gap-2.5 px-3 py-2 text-left text-[13px] hover:bg-[var(--k2)]"
                      >
                        <b.ikon size={16} className="text-[var(--ms)]" />
                        {m.ekran.tur === "liste" && m.ekran.yeni?.baslik}
                      </button>
                    );
                  })}
                </Acilir>
              </div>
            )}
            <button
              type="button"
              aria-label={koyu ? "Açık görünüme geç" : "Koyu görünüme geç"}
              title={koyu ? "Açık görünüm" : "Koyu görünüm"}
              onClick={() => {
                setKoyu(!koyu);
                yaz("kam-demo-tema", koyu ? "acik" : "koyu", "local");
              }}
              className="hidden h-9 w-9 items-center justify-center rounded-lg text-[var(--ms)] hover:bg-[var(--k2)] hover:text-[var(--m)] @md/kabuk:flex"
            >
              {koyu ? <IconSun size={18} /> : <IconMoon size={18} />}
            </button>
            <div className="relative">
              <button
                type="button"
                aria-label={`Bildirimler, ${uyarilar.length} konu`}
                onClick={() => setKatman(katman === "zil" ? null : "zil")}
                className="relative flex h-9 w-9 items-center justify-center rounded-lg text-[var(--ms)] hover:bg-[var(--k2)] hover:text-[var(--m)]"
              >
                <IconBell size={18} />
                {uyarilar.length > 0 && (
                  <span className="absolute right-0.5 top-0.5 flex h-4 min-w-4 items-center justify-center rounded-[5px] bg-[var(--p)] px-1 text-[10px] font-bold tabular-nums text-white">
                    {uyarilar.length}
                  </span>
                )}
              </button>
              <Acilir acik={katman === "zil"} kapat={() => setKatman(null)} className="right-0 w-[min(22rem,calc(100vw-1.5rem))]">
                <p className="border-b border-[var(--k)] px-4 py-3 text-[13px] font-semibold">Dikkat isteyenler</p>
                <ul className="max-h-[22rem] overflow-y-auto">
                  {uyarilar.map((u) => (
                    <li key={u.metin}>
                      <button
                        type="button"
                        onClick={() => {
                          setKatman(null);
                          git(u.modul, null, u.filtre);
                        }}
                        className="flex w-full items-start gap-2.5 px-4 py-2.5 text-left text-[12.5px] leading-5 hover:bg-[var(--k2)]"
                      >
                        <span aria-hidden="true" className="mt-1.5 h-[7px] w-[7px] shrink-0 rounded-[2px]" style={{ background: RENK[u.renk] }} />
                        {u.metin}
                      </button>
                    </li>
                  ))}
                  {depo.akis.length > 0 && <li className="border-t border-[var(--k)] px-4 pb-1 pt-3 text-[11px] font-semibold uppercase tracking-[0.08em] text-[var(--ms)]">Son hareketler</li>}
                  {depo.akis.slice(0, 6).map((a, i) => (
                    <li key={i}>
                      <button
                        type="button"
                        onClick={() => {
                          setKatman(null);
                          git(a.modul, a.kayit ?? null);
                        }}
                        className="w-full px-4 py-2 text-left hover:bg-[var(--k2)]"
                      >
                        <span className="block text-[12.5px] text-[var(--m)]">{a.metin}</span>
                        <span className="block text-[11px] text-[var(--ms)]">{once(a.zaman, api.ani)}</span>
                      </button>
                    </li>
                  ))}
                </ul>
              </Acilir>
            </div>
            <button
              type="button"
              onClick={aciklamaDegistir}
              aria-pressed={aciklamaAcik}
              title="Bu ekranın ne işe yaradığını ve neler deneyebileceğinizi gösterir"
              className={`flex h-9 items-center gap-1.5 rounded-lg px-2 text-[12.5px] font-medium transition-colors ${
                aciklamaAcik ? "bg-[var(--k2)] text-[var(--m)]" : "text-[var(--ms)] hover:bg-[var(--k2)] hover:text-[var(--m)]"
              }`}
            >
              <IconInfoSquareRounded size={18} className={aciklamaAcik ? "text-[var(--p)]" : ""} />
              <span className="hidden @5xl/kabuk:inline">Bu ekran</span>
            </button>
            <span className="ml-1 hidden items-center gap-2 @6xl/kabuk:flex">
              <Harf metin={bas(panel.kullanici.ad)} boy={30} />
              <span className="leading-tight">
                <span className="block text-[12.5px] font-semibold">{panel.kullanici.ad}</span>
                <span className="block text-[11px] text-[var(--ms)]">{panel.kullanici.rol}</span>
              </span>
            </span>
          </header>

          <div className="relative flex min-h-0 flex-1">
            <main className="@container min-w-0 flex-1 overflow-y-auto overscroll-contain p-3.5 pb-20 @2xl/kabuk:p-6">
              <AnimatePresence mode="wait" initial={false}>
                <motion.div key={`${aktif.id}-${konum.surum}`} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.22, ease: EGRI }}>
                  {Ekran.tur === "liste" ? (
                    <ListeEkrani
                      tanim={Ekran}
                      modul={aktifBilgi}
                      api={api}
                      kayitId={konum.kayit}
                      ac={(id) => git(aktif.id, id, konum.filtre)}
                      filtre={konum.filtre}
                      yeniAc={konum.yeni}
                    />
                  ) : (
                    <Ekran.bilesen api={api} modul={aktifBilgi} />
                  )}
                </motion.div>
              </AnimatePresence>
            </main>

            {/* Bu ekran: geniş panelde sütun, dar panelde üstte açılan çekmece */}
            <AnimatePresence initial={false}>
              {aciklamaAcik && (
                <motion.aside
                  key="aciklama"
                  aria-label="Bu ekran hakkında"
                  initial={genis ? { width: 0, opacity: 0 } : { x: "100%" }}
                  animate={genis ? { width: 320, opacity: 1 } : { x: 0 }}
                  exit={genis ? { width: 0, opacity: 0 } : { x: "100%" }}
                  transition={{ duration: 0.3, ease: EGRI }}
                  className={`shrink-0 overflow-hidden border-l border-[var(--k)] bg-[var(--yan)] ${genis ? "" : "absolute inset-y-0 right-0 z-30 w-[min(320px,100%)] [box-shadow:var(--golge)]"}`}
                >
                  <AciklamaSutunu
                    bilgi={bilgi}
                    modulId={aktif.id}
                    panel={panel}
                    bitenler={depo.bitenler}
                    kapat={aciklamaDegistir}
                  />
                </motion.aside>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* Dar panelde yan menü çekmecesi */}
        <AnimatePresence>
          {katman === "menu" && (
            <>
              <motion.div className="absolute inset-0 z-40 bg-black/45" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setKatman(null)} />
              <motion.aside
                className="absolute inset-y-0 left-0 z-50 w-[264px] max-w-[85%] border-r border-[var(--k)] bg-[var(--yan)]"
                initial={{ x: "-100%" }}
                animate={{ x: 0 }}
                exit={{ x: "-100%" }}
                transition={{ duration: 0.3, ease: EGRI }}
              >
                <button type="button" aria-label="Menüyü kapat" onClick={() => setKatman(null)} className="absolute right-2 top-3 flex h-8 w-8 items-center justify-center rounded-lg text-[var(--ms)] hover:bg-[var(--k2)]">
                  <IconX size={18} />
                </button>
                {yanMenu}
              </motion.aside>
            </>
          )}
        </AnimatePresence>
      </div>

      <AramaPenceresi acik={katman === "ara"} kapat={() => setKatman(null)} bilgi={bilgi} panel={panel} api={api} git={git} />
      <GorevPenceresi acik={katman === "gorev"} kapat={() => setKatman(null)} panel={panel} bilgi={bilgi} bitenler={depo.bitenler} git={(m) => git(m)} />

      {/* Kısa bildirimler */}
      <div aria-live="polite" className="pointer-events-none absolute bottom-4 left-1/2 z-[60] flex w-[min(26rem,calc(100%-2rem))] -translate-x-1/2 flex-col gap-2">
        <AnimatePresence>
          {haberler.map((h) => (
            <motion.div
              key={h.id}
              layout
              initial={{ opacity: 0, y: 16, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 8 }}
              transition={{ duration: 0.3, ease: EGRI }}
              className="flex items-start gap-2.5 rounded-xl border border-[var(--k)] bg-[var(--kart2)] px-3.5 py-2.5 text-[12.5px] font-medium leading-5 text-[var(--m)] [box-shadow:var(--golge)]"
            >
              {h.tur === "basari" ? (
                <IconCheck size={16} className="mt-0.5 shrink-0 text-[var(--yesil)]" />
              ) : (
                <IconInfoCircle size={16} className="mt-0.5 shrink-0" style={{ color: h.tur === "uyari" ? "var(--sari)" : "var(--p)" }} />
              )}
              {h.metin}
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
}

/* ---------------- Açılır parçalar ---------------- */

function Acilir({ acik, kapat, className = "", children }: { acik: boolean; kapat: () => void; className?: string; children: ReactNode }) {
  return (
    <AnimatePresence>
      {acik && (
        <>
          <div className="fixed inset-0 z-40" onClick={kapat} />
          <motion.div
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.18 }}
            className={`absolute top-11 z-50 overflow-hidden rounded-xl border border-[var(--k)] bg-[var(--kart2)] py-1 [box-shadow:var(--golge)] ${className}`}
          >
            {children}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

function Pencere({ acik, kapat, children, ust = false }: { acik: boolean; kapat: () => void; children: ReactNode; ust?: boolean }) {
  return (
    <AnimatePresence>
      {acik && (
        <motion.div
          className={`absolute inset-0 z-[55] flex justify-center bg-black/45 p-3 backdrop-blur-[2px] ${ust ? "items-start pt-[12%]" : "items-end @lg/kabuk:items-center"}`}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={kapat}
        >
          <motion.div
            onClick={(e) => e.stopPropagation()}
            initial={{ y: 16, opacity: 0, scale: 0.98 }}
            animate={{ y: 0, opacity: 1, scale: 1 }}
            exit={{ y: 10, opacity: 0 }}
            transition={{ duration: 0.25, ease: EGRI }}
            className="flex max-h-full w-full max-w-lg flex-col overflow-hidden rounded-2xl border border-[var(--k)] bg-[var(--kart2)] [box-shadow:var(--golge)]"
          >
            {children}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function AramaPenceresi({
  acik,
  kapat,
  bilgi,
  panel,
  api,
  git,
}: {
  acik: boolean;
  kapat: () => void;
  bilgi: SektorBilgi;
  panel: SektorPanel;
  api: PanelApi;
  git: (modul: string, kayit?: string | null) => void;
}) {
  const [aranan, setAranan] = useState("");
  const [secili, setSecili] = useState(0);
  useEffect(() => {
    if (acik) {
      setAranan("");
      setSecili(0);
    }
  }, [acik]);

  const sonuclar = useMemo(() => {
    const a = aranan.trim().toLocaleLowerCase("tr");
    const ekranlar = bilgi.moduller
      .filter((m) => !a || `${m.ad} ${m.ozet}`.toLocaleLowerCase("tr").includes(a))
      .slice(0, a ? 4 : 6)
      .map((m) => ({ tur: "Ekran", baslik: m.ad, alt: m.ozet, modul: m.id, kayit: null as string | null, Ikon: m.ikon }));
    if (!a) return ekranlar;
    const kayitlar = panel.arama.flatMap((t) => {
      const b = bilgi.moduller.find((m) => m.id === t.modul)!;
      return (api.veri[t.koleksiyon] ?? [])
        .filter((k) => `${t.baslik(k)} ${t.metin(k)}`.toLocaleLowerCase("tr").includes(a))
        .slice(0, 5)
        .map((k) => ({ tur: b.ad, baslik: t.baslik(k), alt: t.alt(k), modul: t.modul, kayit: k.id as string | null, Ikon: b.ikon }));
    });
    return [...kayitlar, ...ekranlar];
  }, [aranan, bilgi, panel, api.veri]);

  const sec = (i: number) => {
    const s = sonuclar[i];
    if (!s) return;
    kapat();
    git(s.modul, s.kayit);
    if (s.kayit) api.olay("arama");
  };

  return (
    <Pencere acik={acik} kapat={kapat} ust>
      <label className="flex items-center gap-3 border-b border-[var(--k)] px-4">
        <IconSearch size={18} className="shrink-0 text-[var(--ms)]" />
        <span className="sr-only">Kayıt ya da ekran ara</span>
        <input
          autoFocus
          value={aranan}
          onChange={(e) => {
            setAranan(e.target.value);
            setSecili(0);
          }}
          onKeyDown={(e) => {
            if (e.key === "ArrowDown") {
              e.preventDefault();
              setSecili((s) => Math.min(s + 1, sonuclar.length - 1));
            }
            if (e.key === "ArrowUp") {
              e.preventDefault();
              setSecili((s) => Math.max(s - 1, 0));
            }
            if (e.key === "Enter") sec(secili);
          }}
          placeholder="Müşteri adı, kayıt numarası, ürün ya da ekran"
          className="h-14 min-w-0 flex-1 bg-transparent text-[14px] text-[var(--m)] outline-none placeholder:text-[var(--ms)] focus-visible:outline-none"
        />
        <kbd className="rounded border border-[var(--k)] px-1.5 text-[10.5px] text-[var(--ms)]">Esc</kbd>
      </label>
      <ul className="max-h-[22rem] overflow-y-auto py-1">
        {sonuclar.length === 0 && <li className="px-4 py-8 text-center text-[13px] text-[var(--ms)]">Eşleşen kayıt yok. Başka bir ad ya da numara deneyin.</li>}
        {sonuclar.map((s, i) => (
          <li key={`${s.modul}-${s.kayit ?? s.baslik}`}>
            <button
              type="button"
              onMouseEnter={() => setSecili(i)}
              onClick={() => sec(i)}
              className={`flex w-full items-center gap-3 px-4 py-2.5 text-left ${secili === i ? "bg-[var(--k2)]" : ""}`}
            >
              <s.Ikon size={17} className="shrink-0 text-[var(--ms)]" />
              <span className="min-w-0 flex-1">
                <span className="block truncate text-[13px] font-medium text-[var(--m)]">{s.baslik}</span>
                <span className="block truncate text-[11.5px] text-[var(--ms)]">{s.alt}</span>
              </span>
              <span className="shrink-0 text-[11px] text-[var(--ms)]">{s.tur}</span>
            </button>
          </li>
        ))}
      </ul>
      {!aranan && (
        <p className="border-t border-[var(--k)] px-4 py-2.5 text-[11.5px] text-[var(--ms)]">
          Arama yalnız ekran adlarında değil, bütün kayıtlarda yapılır. Bir müşteri adı yazmayı deneyin.
        </p>
      )}
    </Pencere>
  );
}

function GorevPenceresi({
  acik,
  kapat,
  panel,
  bilgi,
  bitenler,
  git,
}: {
  acik: boolean;
  kapat: () => void;
  panel: SektorPanel;
  bilgi: SektorBilgi;
  bitenler: string[];
  git: (modul: string) => void;
}) {
  const hepsi = bitenler.length === panel.gorevler.length;
  return (
    <Pencere acik={acik} kapat={kapat}>
      <header className="flex items-start justify-between gap-3 border-b border-[var(--k)] px-5 py-4">
        <div>
          <h3 className="text-[16px] font-bold">Demo görevleri</h3>
          <p className="mt-1 text-[12.5px] leading-5 text-[var(--ms)]">
            Paneli en hızlı tanımanın yolu birkaç gerçek işi yapmak. Her görev, {bilgi.kisaAd.toLocaleLowerCase("tr")} işletmesinde her gün tekrarlanan bir iş.
          </p>
        </div>
        <button type="button" onClick={kapat} aria-label="Kapat" className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-[var(--ms)] hover:bg-[var(--k2)]">
          <IconX size={18} />
        </button>
      </header>
      <div className="px-5 pt-4">
        <Cubuk oran={bitenler.length / panel.gorevler.length} />
        <p className="mt-2 text-[12px] text-[var(--ms)]">
          {panel.gorevler.length} görevin {bitenler.length} tanesi tamam
        </p>
      </div>
      <ol className="space-y-1 overflow-y-auto p-3">
        {panel.gorevler.map((g) => {
          const bitti = bitenler.includes(g.id);
          return (
            <li key={g.id} className="flex items-start gap-3 rounded-xl p-2.5">
              {bitti ? <IconCircleCheckFilled size={20} className="mt-0.5 shrink-0 text-[var(--yesil)]" /> : <IconCircle size={20} className="mt-0.5 shrink-0 text-[var(--ms)]" />}
              <span className="min-w-0 flex-1">
                <span className={`block text-[13.5px] font-semibold ${bitti ? "text-[var(--ms)] line-through decoration-[var(--k2)]" : "text-[var(--m)]"}`}>{g.metin}</span>
                <span className="mt-0.5 block text-[12px] leading-5 text-[var(--ms)]">{g.ipucu}</span>
              </span>
              {!bitti && (
                <Dugme
                  kucuk
                  onClick={() => {
                    kapat();
                    git(g.modul);
                  }}
                >
                  Ekrana git
                </Dugme>
              )}
            </li>
          );
        })}
      </ol>
      {hepsi && (
        <a href="/iletisim/" className="m-3 mt-0 block rounded-xl bg-[var(--p)] p-4 text-white transition-[filter] hover:brightness-110">
          <span className="block text-[14px] font-semibold">Hepsini yaptınız. Sıra sizin işletmenizde.</span>
          <span className="mt-1 block text-[12.5px] opacity-90">Bu paneli kendi sürecinize göre nasıl kuracağımızı konuşalım. İlk görüşme ücretsiz.</span>
        </a>
      )}
    </Pencere>
  );
}

function AciklamaSutunu({
  bilgi,
  modulId,
  panel,
  bitenler,
  kapat,
}: {
  bilgi: SektorBilgi;
  modulId: string;
  panel: SektorPanel;
  bitenler: string[];
  kapat: () => void;
}) {
  const m = bilgi.moduller.find((x) => x.id === modulId)!;
  const gorevler = panel.gorevler.filter((g) => g.modul === modulId);
  return (
    <div className="flex h-full w-[320px] max-w-full flex-col">
      <header className="flex items-center justify-between gap-2 border-b border-[var(--k)] px-4 py-3">
        <p className="flex items-center gap-2 text-[13px] font-semibold">
          <IconInfoSquareRounded size={17} className="text-[var(--p)]" />
          Bu ekran ne işe yarar?
        </p>
        <button type="button" onClick={kapat} aria-label="Açıklamayı kapat" className="flex h-8 w-8 items-center justify-center rounded-lg text-[var(--ms)] hover:bg-[var(--k2)]">
          <IconX size={17} />
        </button>
      </header>
      <div className="min-h-0 flex-1 space-y-5 overflow-y-auto px-4 py-4">
        <div>
          <p className="flex items-center gap-2 text-[15px] font-bold">
            <m.ikon size={18} className="text-[var(--p)]" />
            {m.ad}
          </p>
          <p className="mt-2 text-[13px] leading-6 text-[var(--m)]">{m.ozet}</p>
        </div>
        <div>
          <p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.08em] text-[var(--ms)]">Neler var</p>
          <ul className="space-y-2">
            {m.ozellikler.map((o) => (
              <li key={o} className="flex gap-2 text-[12.5px] leading-5 text-[var(--m)]">
                <IconCheck size={15} className="mt-0.5 shrink-0 text-[var(--p)]" />
                {o}
              </li>
            ))}
          </ul>
        </div>
        <div className="rounded-xl border border-[var(--k)] bg-[var(--kart)] p-3.5">
          <p className="mb-1.5 text-[11px] font-semibold uppercase tracking-[0.08em] text-[var(--ms)]">İşletmenize etkisi</p>
          <p className="text-[12.5px] leading-5 text-[var(--m)]">{m.kazanc}</p>
        </div>
        <div>
          <p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.08em] text-[var(--ms)]">Burada deneyin</p>
          <ol className="space-y-2">
            {m.dene.map((d, i) => (
              <li key={d} className="flex gap-2.5 text-[12.5px] leading-5 text-[var(--m)]">
                <span className="mt-px flex h-[18px] w-[18px] shrink-0 items-center justify-center rounded-[5px] bg-[var(--k2)] text-[10.5px] font-bold text-[var(--p)]">{i + 1}</span>
                {d}
              </li>
            ))}
          </ol>
        </div>
        {gorevler.length > 0 && (
          <div>
            <p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.08em] text-[var(--ms)]">Bu ekrandaki görevler</p>
            <ul className="space-y-2">
              {gorevler.map((g) => {
                const bitti = bitenler.includes(g.id);
                return (
                  <li key={g.id} className="flex gap-2 text-[12.5px] leading-5">
                    {bitti ? <IconCircleCheckFilled size={16} className="mt-0.5 shrink-0 text-[var(--yesil)]" /> : <IconCircle size={16} className="mt-0.5 shrink-0 text-[var(--ms)]" />}
                    <span className={bitti ? "text-[var(--ms)] line-through" : "text-[var(--m)]"}>{g.metin}</span>
                  </li>
                );
              })}
            </ul>
          </div>
        )}
      </div>
      <a href="/iletisim/" className="group m-3 block rounded-xl border border-[var(--k)] bg-[var(--kart)] p-3.5 transition-colors hover:border-[var(--p)]">
        <span className="block text-[12.5px] font-semibold text-[var(--m)]">Bu ekran sizin işinize göre nasıl olur?</span>
        <span className="mt-1 flex items-center gap-1 text-[12px] text-[var(--ms)]">
          Ücretsiz ilk görüşmede konuşalım
          <IconChevronRight size={14} className="transition-transform group-hover:translate-x-0.5" />
        </span>
      </a>
    </div>
  );
}

