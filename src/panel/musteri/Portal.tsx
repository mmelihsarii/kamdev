/*
 * Müşteri paneli. Müşteri projesinin yolun neresinde olduğunu, ilerlemeyi,
 * güncellemeleri, görselleri ve kendisinden beklenenleri görür.
 * Yönetici aynı sayfayı "müşteri gözüyle" açabilir.
 */
import { useCallback, useEffect, useMemo, useState, type ReactNode } from "react";
import { motion } from "motion/react";
import {
  IconAlertTriangle,
  IconArrowLeft,
  IconArrowRight,
  IconCalendar,
  IconCheck,
  IconChevronDown,
  IconChevronLeft,
  IconChevronRight,
  IconDownload,
  IconExternalLink,
  IconFile,
  IconHandStop,
  IconKey,
  IconLogout,
  IconShieldCheck,
  IconStack2,
  IconUser,
  IconX,
} from "@tabler/icons-react";
import { useIcerik } from "../../veri/kaynak";
import {
  DURUM_ADI,
  OTURUM_DUSTU,
  SORUN_TURU_ADI,
  musteri,
  gunOnceGoster,
  oturum,
  tarihGoster,
  type Asama,
  type Kullanici,
  type MusteriProjesi,
  type ProjeDosyasi,
  type ProjeSorunu,
} from "../api";
import Giris from "../Giris";
import { HataKutusu, KART, PanelSaglayici, Pencere, Yukleniyor, hataMetni } from "../ortak";
import { SifreFormu } from "../yonetim/Hesabim";

const EGRI = [0.22, 1, 0.36, 1] as const;

function projeIdOku() {
  const m = /^#\/proje\/(\d+)/.exec(window.location.hash);
  return m ? Number(m[1]) : null;
}

/* ---------------- Parçalar ---------------- */

function Belir({ children, gecikme = 0, className = "" }: { children: ReactNode; gecikme?: number; className?: string }) {
  return (
    <motion.div className={className} initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7, delay: gecikme, ease: EGRI }}>
      {children}
    </motion.div>
  );
}

function Ilerleme({ deger }: { deger: number }) {
  return (
    <div className="h-2 w-full overflow-hidden rounded-full bg-white/[0.07]">
      <motion.div
        className="h-full rounded-full bg-gradient-to-r from-vurgu to-[#ff8a3d]"
        initial={{ width: 0 }}
        animate={{ width: `${Math.max(0, Math.min(100, deger))}%` }}
        transition={{ duration: 1.4, delay: 0.3, ease: EGRI }}
      />
    </div>
  );
}

function kalanGun(iso: string) {
  if (!iso) return null;
  const fark = Math.ceil((new Date(iso + "T23:59:59").getTime() - Date.now()) / 86400000);
  return Number.isFinite(fark) ? fark : null;
}

/** Aşama çizelgesi: geçilenler işaretli, bulunulan aşama vurgulu. */
function Yol({ asamalar, asama, tamamlandi }: { asamalar: Asama[]; asama: number; tamamlandi: boolean }) {
  const n = asamalar.length;
  return (
    <ol className="grid gap-6 lg:grid-cols-[repeat(var(--n),minmax(0,1fr))]" style={{ ["--n" as string]: n }}>
      {asamalar.map((a, i) => {
        const gecti = tamamlandi || i < asama;
        const simdi = !tamamlandi && i === asama;
        return (
          <motion.li
            key={i}
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.25 + i * 0.08, ease: EGRI }}
            className="relative flex gap-4 lg:block"
            aria-current={simdi ? "step" : undefined}
          >
            {i < n - 1 && (
              <>
                <span aria-hidden="true" className="absolute left-[19px] top-11 h-[calc(100%-20px)] w-[2px] overflow-hidden bg-white/[0.08] lg:hidden">
                  {gecti && <motion.span className="block h-full w-full origin-top bg-vurgu" initial={{ scaleY: 0 }} animate={{ scaleY: 1 }} transition={{ duration: 0.6, delay: 0.5 + i * 0.15, ease: EGRI }} />}
                </span>
                <span aria-hidden="true" className="absolute left-12 top-5 hidden h-[2px] w-[calc(100%-32px)] overflow-hidden bg-white/[0.08] lg:block">
                  {gecti && <motion.span className="block h-full w-full origin-left bg-vurgu" initial={{ scaleX: 0 }} animate={{ scaleX: 1 }} transition={{ duration: 0.6, delay: 0.5 + i * 0.15, ease: EGRI }} />}
                </span>
              </>
            )}
            <span
              className={`relative z-10 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border text-[13px] font-bold tabular-nums ${
                simdi ? "border-vurgu bg-vurgu text-white" : gecti ? "border-vurgu/40 bg-[#1a0f0d] text-vurgu" : "border-white/10 bg-zemin text-neutral-500"
              }`}
            >
              {gecti ? <IconCheck size={18} stroke={2.6} /> : i + 1}
            </span>
            <div className="pb-2 lg:mt-5 lg:pr-4">
              {simdi && <p className="mb-1 text-[12px] font-semibold uppercase tracking-[0.12em] text-vurgu">Şu an buradayız</p>}
              <p className={`text-[16px] font-semibold ${simdi || gecti ? "text-white" : "text-neutral-400"}`}>{a.baslik}</p>
              {a.sure && <p className="mt-0.5 text-[12.5px] text-neutral-500">{a.sure}</p>}
              <p className={`mt-2 text-[13.5px] leading-relaxed ${simdi ? "text-neutral-300" : "text-neutral-500"}`}>{a.aciklama}</p>
            </div>
          </motion.li>
        );
      })}
    </ol>
  );
}

function Galeri({ gorseller, baslangic, kapat }: { gorseller: ProjeDosyasi[]; baslangic: number; kapat: () => void }) {
  const [sira, setSira] = useState(baslangic);
  const git = useCallback((yon: number) => setSira((s) => (s + yon + gorseller.length) % gorseller.length), [gorseller.length]);
  useEffect(() => {
    const tus = (e: KeyboardEvent) => {
      if (e.key === "Escape") kapat();
      if (e.key === "ArrowRight") git(1);
      if (e.key === "ArrowLeft") git(-1);
    };
    const eski = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", tus);
    return () => {
      document.body.style.overflow = eski;
      window.removeEventListener("keydown", tus);
    };
  }, [kapat, git]);
  const g = gorseller[sira];
  return (
    <div className="fixed inset-0 z-[90] flex items-center justify-center bg-black/95" role="dialog" aria-modal="true" aria-label="Görsel" onClick={kapat}>
      <img src={g.adres} alt={g.ad} className="max-h-[88svh] max-w-[94vw] rounded-lg object-contain" onClick={(e) => e.stopPropagation()} />
      <button type="button" onClick={kapat} aria-label="Kapat" className="absolute right-4 top-4 flex h-11 w-11 items-center justify-center rounded-xl bg-white/10 text-white hover:bg-white/20">
        <IconX size={22} />
      </button>
      {gorseller.length > 1 && (
        <>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              git(-1);
            }}
            aria-label="Önceki görsel"
            className="absolute left-3 top-1/2 flex h-12 w-12 -translate-y-1/2 items-center justify-center rounded-xl bg-white/10 text-white hover:bg-white/20"
          >
            <IconChevronLeft size={24} />
          </button>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              git(1);
            }}
            aria-label="Sonraki görsel"
            className="absolute right-3 top-1/2 flex h-12 w-12 -translate-y-1/2 items-center justify-center rounded-xl bg-white/10 text-white hover:bg-white/20"
          >
            <IconChevronRight size={24} />
          </button>
        </>
      )}
      <a
        href={g.adres}
        download={g.ad}
        onClick={(e) => e.stopPropagation()}
        className="absolute bottom-5 left-1/2 inline-flex h-10 -translate-x-1/2 items-center gap-2 rounded-xl bg-white/10 px-4 text-sm text-white hover:bg-white/20"
      >
        <IconDownload size={16} />
        İndir
      </a>
    </div>
  );
}

function BilgiKutusu({ ikon, ad, children }: { ikon: ReactNode; ad: string; children: ReactNode }) {
  return (
    <div className={`${KART} p-5`}>
      <p className="flex items-center gap-2 text-[12.5px] font-medium uppercase tracking-[0.1em] text-neutral-500">
        {ikon}
        {ad}
      </p>
      <div className="mt-3 text-[15px] text-neutral-100">{children}</div>
    </div>
  );
}

/* ---------------- Proje görünümü ---------------- */

function ProjeGorunumu({ proje, asamalar, coklu }: { proje: MusteriProjesi; asamalar: Asama[]; coklu: boolean }) {
  const { ayarlar } = useIcerik();
  const [galeri, setGaleri] = useState<{ gorseller: ProjeDosyasi[]; sira: number } | null>(null);
  const [cozulenler, setCozulenler] = useState(false);

  const tamamlandi = proje.durum === "tamamlandi";
  const asama = asamalar[proje.asama];
  const sorunlar = proje.sorunlar ?? [];
  const bekleyenler = sorunlar.filter((s) => s.tur === "bekleyen" && s.durum === "acik");
  const acikDiger = sorunlar.filter((s) => s.tur !== "bekleyen" && s.durum === "acik");
  const cozulmus = sorunlar.filter((s) => s.durum === "cozuldu");
  const guncellemeler = proje.guncellemeler ?? [];
  const kalan = kalanGun(proje.teslim);
  const tumGorseller = useMemo(() => guncellemeler.flatMap((g) => g.dosyalar.filter((d) => d.tur.startsWith("image/"))), [guncellemeler]);

  return (
    <div>
      {coklu && (
        <a href="#/" className="mb-8 inline-flex items-center gap-2 text-sm text-neutral-400 hover:text-white">
          <IconArrowLeft size={16} />
          Bütün projelerim
        </a>
      )}

      <div className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_380px] lg:items-end">
        <Belir>
          <p className="text-[13px] font-semibold uppercase tracking-[0.14em] text-vurgu">{proje.musteri_firma || "Projeniz"}</p>
          <h1 className="mt-4 text-[clamp(2.2rem,5.5vw,4rem)] font-medium leading-[1.02] tracking-[-0.03em] text-white">{proje.ad}</h1>
          {proje.ozet && <p className="mt-5 max-w-2xl text-[16px] leading-relaxed text-neutral-300">{proje.ozet}</p>}
          <p className="mt-5 flex flex-wrap gap-x-5 gap-y-1 text-[13.5px]">
            <span className={proje.durum === "devam" ? "text-emerald-400" : proje.durum === "beklemede" ? "text-amber-300" : "text-neutral-300"}>{DURUM_ADI[proje.durum]}</span>
            {guncellemeler[0] && <span className="text-neutral-500">Son güncelleme {gunOnceGoster(guncellemeler[0].tarih)}</span>}
          </p>
        </Belir>

        <Belir gecikme={0.12} className={`${KART} p-6`}>
          <p className="text-[12.5px] font-medium uppercase tracking-[0.1em] text-neutral-500">Tamamlanan kısım</p>
          <p className="mt-3 flex items-baseline gap-2">
            <span className="text-[15px] text-neutral-400">yüzde</span>
            <span className="text-[64px] font-bold leading-none tabular-nums tracking-tight text-white">{proje.ilerleme}</span>
          </p>
          <div className="mt-5">
            <Ilerleme deger={proje.ilerleme} />
          </div>
          <p className="mt-4 text-[13.5px] text-neutral-400">
            {tamamlandi ? "Proje tamamlandı." : asama ? `${asama.baslik} aşamasındayız.` : ""}
            {!tamamlandi && kalan !== null && (kalan > 0 ? ` Tahmini teslime ${kalan} gün var.` : kalan === 0 ? " Tahmini teslim bugün." : "")}
          </p>
        </Belir>
      </div>

      {bekleyenler.length > 0 && (
        <Belir gecikme={0.2} className="mt-10">
          <section className="rounded-xl border border-sky-400/25 bg-sky-400/[0.05] p-5 sm:p-6">
            <h2 className="flex items-center gap-2.5 text-[16px] font-semibold text-sky-100">
              <IconHandStop size={20} className="text-sky-300" />
              Sizden beklediklerimiz
            </h2>
            <p className="mt-1 text-[13.5px] text-sky-100/70">Bunlar tamamlanınca bir sonraki adıma geçebiliyoruz.</p>
            <ul className="mt-4 space-y-3">
              {bekleyenler.map((s) => (
                <li key={s.id} className="rounded-lg bg-black/20 px-4 py-3">
                  <p className="text-[15px] font-medium text-white">{s.baslik}</p>
                  {s.aciklama && <p className="mt-1 whitespace-pre-wrap text-[13.5px] leading-relaxed text-neutral-300">{s.aciklama}</p>}
                </li>
              ))}
            </ul>
          </section>
        </Belir>
      )}

      <section className="mt-16">
        <Belir>
          <h2 className="text-[13px] font-semibold uppercase tracking-[0.14em] text-neutral-400">Yolun neresindeyiz</h2>
        </Belir>
        <div className="mt-8">
          <Yol asamalar={asamalar} asama={proje.asama} tamamlandi={tamamlandi} />
        </div>
      </section>

      <section className="mt-16 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <BilgiKutusu ikon={<IconCalendar size={15} />} ad="Başlangıç">
          {proje.baslangic ? tarihGoster(proje.baslangic) : "Belirlenmedi"}
        </BilgiKutusu>
        <BilgiKutusu ikon={<IconCalendar size={15} />} ad="Tahmini teslim">
          {proje.teslim ? tarihGoster(proje.teslim) : "Belirlenmedi"}
        </BilgiKutusu>
        <BilgiKutusu ikon={<IconUser size={15} />} ad="Sorumlu">
          {proje.sorumlu || ayarlar.site.ad}
        </BilgiKutusu>
        <BilgiKutusu ikon={<IconStack2 size={15} />} ad="Teknolojiler">
          {proje.teknolojiler.length ? proje.teknolojiler.join(", ") : "Belirlenmedi"}
        </BilgiKutusu>
      </section>

      {(proje.onizleme || proje.canli) && (
        <section className="mt-3 flex flex-col gap-3 sm:flex-row">
          {proje.onizleme && (
            <a
              href={proje.onizleme}
              target="_blank"
              rel="noopener"
              className={`${KART} group flex flex-1 items-center justify-between gap-4 p-5 transition-colors hover:border-vurgu/40`}
            >
              <span>
                <span className="block text-[15px] font-semibold text-white">Geliştirme sürümünü açın</span>
                <span className="mt-0.5 block text-[13px] text-neutral-400">Üzerinde çalıştığımız halini canlı olarak görün.</span>
              </span>
              <IconExternalLink size={20} className="shrink-0 text-vurgu transition-transform group-hover:translate-x-0.5" />
            </a>
          )}
          {proje.canli && (
            <a href={/^https?:/.test(proje.canli) ? proje.canli : `https://${proje.canli}`} target="_blank" rel="noopener" className={`${KART} group flex flex-1 items-center justify-between gap-4 p-5 transition-colors hover:border-vurgu/40`}>
              <span>
                <span className="block text-[15px] font-semibold text-white">Yayındaki site</span>
                <span className="mt-0.5 block text-[13px] text-neutral-400">{proje.canli.replace(/^https?:\/\//, "")}</span>
              </span>
              <IconExternalLink size={20} className="shrink-0 text-vurgu transition-transform group-hover:translate-x-0.5" />
            </a>
          )}
        </section>
      )}

      <div className="mt-16 grid gap-12 lg:grid-cols-[minmax(0,1fr)_360px]">
        <section>
          <h2 className="text-[13px] font-semibold uppercase tracking-[0.14em] text-neutral-400">Güncellemeler</h2>
          {guncellemeler.length === 0 ? (
            <p className="mt-6 text-[15px] text-neutral-400">İlk güncelleme yakında burada olacak. Her adımda görseller ve notlarla haber vereceğiz.</p>
          ) : (
            <ol className="mt-8 space-y-10">
              {guncellemeler.map((g, gi) => {
                const gorseller = g.dosyalar.filter((d) => d.tur.startsWith("image/"));
                const belgeler = g.dosyalar.filter((d) => !d.tur.startsWith("image/"));
                return (
                  <motion.li
                    key={g.id}
                    initial={{ opacity: 0, y: 18 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, margin: "-60px" }}
                    transition={{ duration: 0.7, ease: EGRI }}
                    className="grid gap-4 sm:grid-cols-[120px_minmax(0,1fr)]"
                  >
                    <div className="sm:pt-1">
                      <p className={`text-[13.5px] font-medium ${gi === 0 ? "text-vurgu" : "text-neutral-300"}`}>{tarihGoster(g.tarih)}</p>
                      {g.asama !== null && asamalar[g.asama] && <p className="mt-0.5 text-[12.5px] text-neutral-500">{asamalar[g.asama].baslik}</p>}
                    </div>
                    <div className="min-w-0 border-l border-white/[0.08] pl-5 sm:pl-6">
                      <h3 className="text-[19px] font-semibold leading-snug text-white">{g.baslik}</h3>
                      {g.aciklama && <p className="mt-2 whitespace-pre-wrap text-[15px] leading-relaxed text-neutral-300">{g.aciklama}</p>}
                      {gorseller.length > 0 && (
                        <div className={`mt-5 grid gap-2 ${gorseller.length === 1 ? "max-w-[720px]" : "grid-cols-2 sm:grid-cols-3"}`}>
                          {gorseller.map((d) => (
                            <button
                              key={d.id}
                              type="button"
                              onClick={() => setGaleri({ gorseller: tumGorseller, sira: tumGorseller.findIndex((x) => x.id === d.id) })}
                              className="group overflow-hidden rounded-lg border border-white/[0.08] bg-white/[0.03]"
                              aria-label={`${d.ad} görselini büyüt`}
                            >
                              <img
                                src={d.adres}
                                alt={d.ad}
                                loading="lazy"
                                className={`w-full object-cover transition-transform duration-700 group-hover:scale-[1.03] ${gorseller.length === 1 ? "max-h-[440px]" : "aspect-[4/3]"}`}
                              />
                            </button>
                          ))}
                        </div>
                      )}
                      {belgeler.length > 0 && (
                        <ul className="mt-4 space-y-2">
                          {belgeler.map((d) => (
                            <li key={d.id}>
                              <a href={d.adres} className="flex items-center gap-3 rounded-lg border border-white/[0.08] px-4 py-3 text-sm text-neutral-200 hover:border-white/20 hover:text-white">
                                <IconFile size={18} className="shrink-0 text-neutral-500" />
                                <span className="min-w-0 flex-1 truncate">{d.ad}</span>
                                <IconDownload size={16} className="shrink-0" />
                              </a>
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                  </motion.li>
                );
              })}
            </ol>
          )}
        </section>

        <aside className="space-y-4 lg:sticky lg:top-24 lg:self-start">
          <section className={`${KART} p-5`}>
            <h2 className="flex items-center gap-2 text-[15px] font-semibold text-white">
              <IconAlertTriangle size={18} className="text-amber-300" />
              Sorunlar ve riskler
            </h2>
            {acikDiger.length === 0 ? (
              <p className="mt-3 flex items-center gap-2 text-[14px] text-neutral-400">
                <IconShieldCheck size={17} className="text-emerald-400" />
                Şu an açık bir sorun yok.
              </p>
            ) : (
              <ul className="mt-3 space-y-3">
                {acikDiger.map((s) => (
                  <SorunSatiri key={s.id} s={s} />
                ))}
              </ul>
            )}
            {cozulmus.length > 0 && (
              <div className="mt-4 border-t border-white/[0.06] pt-3">
                <button type="button" onClick={() => setCozulenler(!cozulenler)} className="flex w-full items-center justify-between text-[13.5px] text-neutral-400 hover:text-white" aria-expanded={cozulenler}>
                  Çözülenler, {cozulmus.length} kayıt
                  <IconChevronDown size={16} className={`transition-transform ${cozulenler ? "rotate-180" : ""}`} />
                </button>
                {cozulenler && (
                  <ul className="mt-3 space-y-3 opacity-70">
                    {cozulmus.map((s) => (
                      <SorunSatiri key={s.id} s={s} />
                    ))}
                  </ul>
                )}
              </div>
            )}
          </section>

          <section className={`${KART} p-5`}>
            <h2 className="text-[15px] font-semibold text-white">Bir sorunuz mu var?</h2>
            <p className="mt-1.5 text-[13.5px] leading-relaxed text-neutral-400">Projeyle ilgili her şeyi doğrudan sorumlu kişiye yazabilirsiniz. Aynı gün dönüyoruz.</p>
            <a
              href={`mailto:${ayarlar.site.eposta}?subject=${encodeURIComponent(proje.ad)}`}
              className="mt-4 inline-flex h-10 items-center gap-2 rounded-lg bg-vurgu px-4 text-sm font-medium text-white hover:bg-[#ea583f]"
            >
              Mail gönderin
              <IconArrowRight size={16} />
            </a>
          </section>
        </aside>
      </div>

      {galeri && <Galeri gorseller={galeri.gorseller} baslangic={Math.max(0, galeri.sira)} kapat={() => setGaleri(null)} />}
    </div>
  );
}

function SorunSatiri({ s }: { s: ProjeSorunu }) {
  return (
    <li>
      <p className={`text-[12px] font-semibold ${s.tur === "risk" ? "text-amber-300" : s.tur === "sorun" ? "text-red-300" : "text-sky-300"}`}>
        {SORUN_TURU_ADI[s.tur]}
        {s.durum === "cozuldu" && <span className="ml-2 text-emerald-400">Çözüldü</span>}
      </p>
      <p className="mt-0.5 text-[14.5px] font-medium text-neutral-100">{s.baslik}</p>
      {s.aciklama && <p className="mt-1 whitespace-pre-wrap text-[13px] leading-relaxed text-neutral-400">{s.aciklama}</p>}
    </li>
  );
}

/* ---------------- Liste ---------------- */

function ProjeListesi({ projeler, asamalar }: { projeler: MusteriProjesi[]; asamalar: Asama[] }) {
  return (
    <div>
      <Belir>
        <p className="text-[13px] font-semibold uppercase tracking-[0.14em] text-vurgu">Projeleriniz</p>
        <h1 className="mt-4 text-[clamp(2rem,5vw,3.4rem)] font-medium leading-[1.05] tracking-[-0.03em] text-white">Hepsi tek yerde.</h1>
      </Belir>
      <ul className="mt-10 grid gap-3 md:grid-cols-2">
        {projeler.map((p, i) => (
          <Belir key={p.id} gecikme={0.08 * i}>
            <a href={`#/proje/${p.id}`} className={`${KART} group block p-6 transition-colors hover:border-white/15 hover:bg-white/[0.035]`}>
              <div className="flex items-start justify-between gap-3">
                <p className="text-[19px] font-semibold text-white">{p.ad}</p>
                <span className="shrink-0 text-[13px] text-neutral-400">{DURUM_ADI[p.durum]}</span>
              </div>
              <p className="mt-1 text-[14px] text-neutral-400">{p.durum === "tamamlandi" ? "Tamamlandı" : asamalar[p.asama]?.baslik}</p>
              <div className="mt-6 flex items-center gap-4">
                <div className="flex-1">
                  <Ilerleme deger={p.ilerleme} />
                </div>
                <span className="text-[13px] tabular-nums text-neutral-300">yüzde {p.ilerleme}</span>
              </div>
              <p className="mt-4 flex items-center gap-1.5 text-[13px] text-neutral-500 group-hover:text-white">
                Projeyi aç
                <IconArrowRight size={15} className="transition-transform group-hover:translate-x-0.5" />
              </p>
            </a>
          </Belir>
        ))}
      </ul>
    </div>
  );
}

/* ---------------- Kabuk ---------------- */

type Veri =
  | { tur: "yukleniyor" }
  | { tur: "hata"; mesaj: string }
  | { tur: "liste"; projeler: MusteriProjesi[]; asamalar: Asama[] }
  | { tur: "proje"; proje: MusteriProjesi; asamalar: Asama[]; coklu: boolean };

function Icerik({ kullanici, cikis }: { kullanici: Kullanici; cikis: () => void }) {
  const [projeId, setProjeId] = useState(projeIdOku);
  const [veri, setVeri] = useState<Veri>({ tur: "yukleniyor" });
  const [sifreAcik, setSifreAcik] = useState(false);
  const yonetici = kullanici.rol === "yonetici";

  useEffect(() => {
    const degisti = () => {
      setProjeId(projeIdOku());
      window.scrollTo({ top: 0 });
    };
    window.addEventListener("hashchange", degisti);
    return () => window.removeEventListener("hashchange", degisti);
  }, []);

  useEffect(() => {
    let iptal = false;
    (async () => {
      setVeri({ tur: "yukleniyor" });
      try {
        const liste = yonetici ? null : await musteri<{ projeler: MusteriProjesi[]; asamalar: Asama[] }>("projelerim");
        const hedef = projeId ?? (liste && liste.projeler.length === 1 ? liste.projeler[0].id : null);
        if (hedef) {
          const s = await musteri<{ proje: MusteriProjesi; asamalar: Asama[] }>("proje", { id: hedef });
          if (!iptal) setVeri({ tur: "proje", proje: s.proje, asamalar: s.asamalar, coklu: (liste?.projeler.length ?? 0) > 1 });
        } else if (liste && !iptal) {
          setVeri({ tur: "liste", projeler: liste.projeler, asamalar: liste.asamalar });
        } else if (!iptal) {
          setVeri({ tur: "hata", mesaj: "Önizlemek için yönetim panelinden bir proje açın." });
        }
      } catch (h) {
        if (!iptal) setVeri({ tur: "hata", mesaj: hataMetni(h) });
      }
    })();
    return () => {
      iptal = true;
    };
  }, [projeId, yonetici]);

  return (
    <div className="relative min-h-[100svh] overflow-hidden bg-zemin">
      <div aria-hidden="true" className="pointer-events-none absolute -top-48 left-1/2 h-[520px] w-[900px] -translate-x-1/2 rounded-full bg-vurgu/[0.06] blur-[140px]" />

      {yonetici && (
        <div className="relative z-10 bg-vurgu px-4 py-2 text-center text-[13px] font-medium text-white">Yönetici önizlemesi. Müşteri bu sayfayı tam olarak böyle görür, iç notlar görünmez.</div>
      )}

      <header className="kap relative z-10 flex h-20 items-center justify-between">
        <a href="/" className="flex items-baseline gap-2.5">
          <span className="text-[26px] font-bold leading-none tracking-[-0.07em] text-white">KAM</span>
          <span className="hidden text-[13px] font-medium text-neutral-500 sm:inline">Müşteri paneli</span>
        </a>
        <div className="flex items-center gap-1">
          <span className="mr-2 hidden text-right sm:block">
            <span className="block text-[13.5px] font-medium text-neutral-100">{kullanici.ad || kullanici.eposta}</span>
            {kullanici.firma && <span className="block text-[12px] text-neutral-500">{kullanici.firma}</span>}
          </span>
          {!yonetici && (
            <button
              type="button"
              onClick={() => setSifreAcik(true)}
              aria-label="Şifre değiştir"
              title="Şifre değiştir"
              className="flex h-10 w-10 items-center justify-center rounded-lg text-neutral-400 hover:bg-white/5 hover:text-white"
            >
              <IconKey size={19} />
            </button>
          )}
          <button type="button" onClick={cikis} aria-label="Çıkış yap" title="Çıkış yap" className="flex h-10 w-10 items-center justify-center rounded-lg text-neutral-400 hover:bg-white/5 hover:text-white">
            <IconLogout size={19} />
          </button>
        </div>
      </header>

      <main className="kap relative z-10 pb-28 pt-10 sm:pt-16">
        {veri.tur === "yukleniyor" && <Yukleniyor />}
        {veri.tur === "hata" && <HataKutusu hata={veri.mesaj} />}
        {veri.tur === "liste" &&
          (veri.projeler.length === 0 ? (
            <div className="max-w-xl">
              <h1 className="text-[34px] font-medium tracking-tight text-white">Hoş geldiniz.</h1>
              <p className="mt-3 text-[16px] leading-relaxed text-neutral-400">Projeniz başladığında aşamaları, güncellemeleri ve görselleri burada göreceksiniz.</p>
            </div>
          ) : (
            <ProjeListesi projeler={veri.projeler} asamalar={veri.asamalar} />
          ))}
        {veri.tur === "proje" && <ProjeGorunumu key={veri.proje.id} proje={veri.proje} asamalar={veri.asamalar} coklu={veri.coklu} />}
      </main>

      <Pencere acik={sifreAcik} kapat={() => setSifreAcik(false)} baslik="Şifre değiştir">
        <SifreFormu />
      </Pencere>
    </div>
  );
}

export default function Portal() {
  const [durum, setDurum] = useState<{ yukleniyor: boolean; kullanici: Kullanici | null; hata?: string }>({ yukleniyor: true, kullanici: null });
  const [oturumDustu, setOturumDustu] = useState(false);

  const kontrol = useCallback(() => {
    oturum
      .durum()
      .then((d) => setDurum({ yukleniyor: false, kullanici: d.kullanici }))
      .catch((h) => setDurum({ yukleniyor: false, kullanici: null, hata: hataMetni(h) }));
  }, []);

  useEffect(() => {
    kontrol();
    const dustu = () => setOturumDustu(true);
    window.addEventListener(OTURUM_DUSTU, dustu);
    return () => window.removeEventListener(OTURUM_DUSTU, dustu);
  }, [kontrol]);

  const cikis = async () => {
    await oturum.cikis().catch(() => {});
    setDurum({ yukleniyor: false, kullanici: null });
  };

  return (
    <PanelSaglayici>
      {durum.yukleniyor ? (
        <Yukleniyor tamEkran />
      ) : durum.hata ? (
        <div className="mx-auto flex min-h-[100svh] max-w-lg items-center px-5">
          <HataKutusu hata={`Sunucuya ulaşılamadı. ${durum.hata}`} yenile={kontrol} />
        </div>
      ) : durum.kullanici ? (
        <Icerik kullanici={durum.kullanici} cikis={cikis} />
      ) : (
        <Giris mod="musteri" tamam={(k) => setDurum({ yukleniyor: false, kullanici: k })} />
      )}
      {oturumDustu && durum.kullanici && (
        <Giris
          mod="musteri"
          pencere
          tamam={(k) => {
            setOturumDustu(false);
            setDurum({ yukleniyor: false, kullanici: k });
          }}
        />
      )}
    </PanelSaglayici>
  );
}
