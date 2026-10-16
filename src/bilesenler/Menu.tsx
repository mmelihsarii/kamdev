import { useEffect, useState } from "react";
import { motion, AnimatePresence, useMotionValueEvent, useScroll } from "motion/react";
import { IconArrowRight, IconMenu2, IconUserCircle, IconX } from "@tabler/icons-react";
import { EGRI } from "./Hareket";

const BAGLANTILAR = [
  { ad: "İşler", hedef: "/isler/" },
  { ad: "Demolar", hedef: "/demolar/" },
  { ad: "Hizmetler", hedef: "/hizmetler/" },
  { ad: "Süreç", hedef: "/surec/" },
  { ad: "Blog", hedef: "/blog/" },
  { ad: "İletişim", hedef: "/iletisim/" },
];

/** Bulunulan sayfanın menü bağlantısı; ana sayfadaki çapalar hiçbir zaman seçili sayılmaz. */
function seciliMi(hedef: string, yol: string) {
  return !hedef.includes("#") && yol.startsWith(hedef);
}

const YAY = { type: "spring", stiffness: 200, damping: 40 } as const;
const HAP_GOLGESI =
  "0 0 24px rgba(34,42,53,0.06), 0 1px 1px rgba(0,0,0,0.05), 0 0 0 1px rgba(255,255,255,0.08), 0 16px 68px rgba(0,0,0,0.55), inset 0 1px 0 rgba(255,255,255,0.1)";

function Logo() {
  return (
    <a href="/" className="group relative z-20 flex shrink-0 items-center" aria-label="KAM ana sayfa">
      <span className="block text-[26px] font-bold leading-none tracking-[-0.07em] text-white transition-opacity duration-200 group-hover:opacity-70">
        KAM
      </span>
    </a>
  );
}

function TeklifDugmesi({ className = "" }: { className?: string }) {
  return (
    <a
      href="/iletisim/"
      className={`group relative z-20 inline-flex h-10 shrink-0 items-center gap-2 rounded-full bg-[#ecebe7] px-5 text-sm font-semibold text-zemin transition-colors duration-300 hover:bg-white ${className}`}
    >
      Teklif al
      <IconArrowRight size={16} aria-hidden="true" className="transition-transform duration-300 group-hover:translate-x-0.5" />
    </a>
  );
}

/**
 * Sayfanın en üstünde içerikle aynı hizada duran şeffaf menü; aşağı
 * kaydırılınca yay animasyonuyla daralıp ortada yüzen siyah bir hapa dönüşür.
 */
export default function Menu({ yol = "/" }: { yol?: string }) {
  const { scrollY } = useScroll();
  const [kucuk, setKucuk] = useState(false);
  const [acik, setAcik] = useState(false);
  const [uzerinde, setUzerinde] = useState<number | null>(null);

  useMotionValueEvent(scrollY, "change", (deger) => setKucuk(deger > 80));
  useEffect(() => setKucuk(window.scrollY > 80), []);

  const mobilDolu = kucuk || acik;

  return (
    <header className="fixed inset-x-0 top-0 z-50" style={{ paddingTop: "env(safe-area-inset-top)" }}>
      {/* Masaüstü */}
      <div className="kap hidden lg:block">
        <motion.div
          initial={false}
          animate={
            kucuk
              ? { width: "56%", y: 16, paddingLeft: 22, paddingRight: 10, backgroundColor: "rgba(0,0,0,1)", boxShadow: HAP_GOLGESI }
              : { width: "100%", y: 0, paddingLeft: 0, paddingRight: 0, backgroundColor: "rgba(0,0,0,0)", boxShadow: "0 0 0 0 rgba(0,0,0,0)" }
          }
          transition={YAY}
          style={{ minWidth: 900 }}
          className="relative mx-auto flex h-16 items-center justify-between rounded-full"
        >
          <Logo />

          <nav
            aria-label="Ana menü"
            onMouseLeave={() => setUzerinde(null)}
            className="absolute inset-0 flex items-center justify-center gap-1"
          >
            {BAGLANTILAR.map((b, sira) => {
              const secili = seciliMi(b.hedef, yol);
              return (
                <a
                  key={b.hedef}
                  href={b.hedef}
                  onMouseEnter={() => setUzerinde(sira)}
                  aria-current={secili ? "page" : undefined}
                  className={`relative px-4 py-2 text-[15px] font-medium transition-colors duration-200 hover:text-white [text-shadow:0_1px_8px_rgba(0,0,0,0.9)] ${
                    secili ? "text-white" : "text-neutral-200"
                  }`}
                >
                  {uzerinde === sira && (
                    <motion.span
                      layoutId="menu-vurgu"
                      className="absolute inset-0 rounded-full bg-white/[0.12]"
                      transition={{ type: "spring", stiffness: 400, damping: 35 }}
                    />
                  )}
                  <span className="relative z-10">{b.ad}</span>
                </a>
              );
            })}
          </nav>

          <div className="relative z-20 flex items-center gap-1">
            <a
              href="/musteri/"
              title="Müşteri girişi"
              aria-label="Müşteri girişi"
              className="flex h-10 items-center gap-2 rounded-full px-3 text-[14px] font-medium text-neutral-300 transition-colors hover:bg-white/[0.08] hover:text-white"
            >
              <IconUserCircle size={20} aria-hidden="true" />
              {!kucuk && <span className="hidden xl:inline">Müşteri girişi</span>}
            </a>
            <TeklifDugmesi />
          </div>
        </motion.div>
      </div>

      {/* Mobil */}
      <div className="kap lg:hidden">
        <motion.div
          initial={false}
          animate={
            mobilDolu
              ? { y: 10, paddingLeft: 18, paddingRight: 8, backgroundColor: "rgba(0,0,0,0.96)", boxShadow: HAP_GOLGESI }
              : { y: 0, paddingLeft: 0, paddingRight: 0, backgroundColor: "rgba(0,0,0,0)", boxShadow: "0 0 0 0 rgba(0,0,0,0)" }
          }
          transition={YAY}
          className="rounded-[28px]"
        >
          <div className="flex h-16 items-center justify-between">
            <Logo />
            <button
              type="button"
              onClick={() => setAcik((o) => !o)}
              aria-label={acik ? "Menüyü kapat" : "Menüyü aç"}
              aria-expanded={acik}
              className="flex h-11 w-11 items-center justify-center rounded-full text-white active:bg-white/10"
            >
              {acik ? <IconX size={24} aria-hidden="true" /> : <IconMenu2 size={24} aria-hidden="true" />}
            </button>
          </div>

          <AnimatePresence initial={false}>
            {acik && (
              <motion.nav
                aria-label="Mobil menü"
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.35, ease: EGRI }}
                className="overflow-hidden"
              >
                <div className="flex flex-col pb-5 pr-2.5 pt-1">
                  {BAGLANTILAR.map((b, i) => (
                    <motion.a
                      key={b.hedef}
                      href={b.hedef}
                      onClick={() => setAcik(false)}
                      initial={{ opacity: 0, x: -12 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.4, delay: 0.05 + i * 0.05, ease: EGRI }}
                      className="flex min-h-12 items-center border-b border-white/[0.06] text-lg font-semibold text-white active:text-vurgu"
                    >
                      {b.ad}
                    </motion.a>
                  ))}
                  <motion.a
                    href="/musteri/"
                    initial={{ opacity: 0, x: -12 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.4, delay: 0.05 + BAGLANTILAR.length * 0.05, ease: EGRI }}
                    className="flex min-h-12 items-center gap-2.5 border-b border-white/[0.06] text-lg font-semibold text-neutral-300 active:text-vurgu"
                  >
                    <IconUserCircle size={22} aria-hidden="true" />
                    Müşteri girişi
                  </motion.a>
                  <TeklifDugmesi className="mt-5 w-full justify-center" />
                </div>
              </motion.nav>
            )}
          </AnimatePresence>
        </motion.div>
      </div>
    </header>
  );
}
