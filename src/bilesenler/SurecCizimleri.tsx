/*
 * Süreç sahneleri. Her biri gerçek bir arayüz parçası gibi çizilir: gerçek
 * yazılar, saatler, okundu işaretleri, kendi projelerimizin ekran görüntüleri.
 * Kart ekrana girince bir kez oynar; kendi kendine ya da üzerine gelince
 * tekrar etmez.
 */
import type { ReactNode } from "react";
import { motion, type Variants } from "motion/react";
import { IconLock } from "@tabler/icons-react";
import { EGRI } from "./Hareket";

/* ---------- Ortak parçalar ---------- */

const belir = (gecikme: number, y = 8): Variants => ({
  gizli: { opacity: 0, y },
  gorunur: { opacity: 1, y: 0, transition: { duration: 0.5, delay: gecikme, ease: EGRI } },
});

const yay = (gecikme: number, x = 0, y = 10): Variants => ({
  gizli: { opacity: 0, x, y, scale: 0.94 },
  gorunur: { opacity: 1, x: 0, y: 0, scale: 1, transition: { type: "spring", stiffness: 300, damping: 26, delay: gecikme } },
});

/** Pencere çerçevesi: üstte gerçekçi pencere düğmeleri, istenirse ortada başlık ya da adres. */
function Pencere({ ust, children, className = "" }: { ust?: ReactNode; children: ReactNode; className?: string }) {
  return (
    <div className={`overflow-hidden rounded-[10px] border border-white/[0.09] bg-[#121215] shadow-[0_24px_48px_-24px_rgba(0,0,0,0.95),inset_0_1px_0_rgba(255,255,255,0.04)] ${className}`}>
      <div className="relative flex h-[26px] items-center border-b border-white/[0.06] bg-[#16161a] px-2.5">
        <span className="flex gap-[5px]">
          <span className="h-[9px] w-[9px] rounded-full bg-[#ff5f57]/80" />
          <span className="h-[9px] w-[9px] rounded-full bg-[#febc2e]/80" />
          <span className="h-[9px] w-[9px] rounded-full bg-[#28c840]/80" />
        </span>
        {ust && <div className="absolute inset-x-14 flex justify-center">{ust}</div>}
      </div>
      {children}
    </div>
  );
}

/** Mesajın yanındaki okundu işareti. */
function Okundu() {
  return (
    <svg viewBox="0 0 16 10" className="h-[8px] w-[13px] text-sky-300" fill="none" aria-hidden="true">
      <path d="M1 5.5 L3.8 8.2 L9.5 1.8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M6.2 7.4 L7 8.2 L12.7 1.8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

/** Çizilerek gelen onay işareti. */
function CizilenOnay({ gecikme, className = "" }: { gecikme: number; className?: string }) {
  return (
    <svg viewBox="0 0 16 16" className={className} fill="none" aria-hidden="true">
      <motion.path
        d="M3.5 8.5 L6.6 11.5 L12.5 4.8"
        stroke="currentColor"
        strokeWidth={2.2}
        strokeLinecap="round"
        strokeLinejoin="round"
        variants={{ gizli: { pathLength: 0 }, gorunur: { pathLength: 1, transition: { delay: gecikme, duration: 0.3, ease: "easeOut" } } }}
      />
    </svg>
  );
}

/* ---------- Konuşma: gerçek bir mesajlaşma penceresi ---------- */
export function KonusmaCizimi() {
  const gelen = "max-w-[82%] rounded-[14px] rounded-bl-[4px] bg-[#232328] px-2.5 py-1.5";
  const giden = "max-w-[82%] rounded-[14px] rounded-br-[4px] bg-[#3a1d18] px-2.5 py-1.5";
  return (
    <div className="flex h-full items-center px-3.5">
      <div className="w-full overflow-hidden rounded-[10px] border border-white/[0.09] bg-[#121215] shadow-[0_24px_48px_-24px_rgba(0,0,0,0.95),inset_0_1px_0_rgba(255,255,255,0.04)]">
        <div className="flex items-center gap-2 border-b border-white/[0.06] bg-[#16161a] px-3 py-1.5">
          <span className="flex h-6 w-6 items-center justify-center rounded-full bg-[#2a2a30] text-[9px] font-semibold text-neutral-200">AE</span>
          <span className="leading-none">
            <span className="block text-[11px] font-semibold text-white">Ahenk Ev</span>
            <span className="mt-0.5 flex items-center gap-1 text-[9px] text-neutral-500">
              <span className="h-[5px] w-[5px] rounded-full bg-emerald-400" /> çevrimiçi
            </span>
          </span>
        </div>
        <div className="flex flex-col gap-1.5 px-2.5 py-2">
          <motion.div variants={yay(0.15, -10)} className={`${gelen} origin-bottom-left self-start`}>
            <p className="text-[10.5px] leading-[14px] text-neutral-100">Seramiklerimizi online satmak istiyoruz.</p>
            <p className="mt-0.5 text-right text-[8.5px] text-neutral-500">10.41</p>
          </motion.div>
          <motion.div variants={yay(0.9, 10)} className={`${giden} origin-bottom-right self-end`}>
            <p className="text-[10.5px] leading-[14px] text-white">Kaç ürününüz var, kime satıyorsunuz?</p>
            <p className="mt-0.5 flex items-center justify-end gap-1 text-[8.5px] text-[#d9a99f]">
              10.42 <Okundu />
            </p>
          </motion.div>
          <div className="relative min-h-[34px]">
            <motion.span
              variants={{ gizli: { opacity: 0 }, gorunur: { opacity: [0, 1, 1, 0], transition: { delay: 1.45, duration: 1.15, times: [0, 0.1, 0.88, 1] } } }}
              className="absolute left-0 top-0 flex items-center gap-[3px] rounded-[14px] rounded-bl-[4px] bg-[#232328] px-2.5 py-2.5"
            >
              {[0, 1, 2].map((i) => (
                <motion.span
                  key={i}
                  className="h-[5px] w-[5px] rounded-full bg-neutral-400"
                  variants={{ gizli: { y: 0 }, gorunur: { y: [0, -3, 0], transition: { delay: 1.55 + i * 0.12, duration: 0.4, repeat: 1, repeatDelay: 0.12 } } }}
                />
              ))}
            </motion.span>
            <motion.div variants={yay(2.6, -10)} className={`${gelen} w-fit origin-bottom-left`}>
              <p className="text-[10.5px] leading-[14px] text-neutral-100">80 ürün, Türkiye geneline.</p>
              <p className="mt-0.5 text-right text-[8.5px] text-neutral-500">10.43</p>
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ---------- Teklif: kâğıt bir teklif belgesi, kalemler işaretlenir, imza atılır ---------- */
export function TeklifCizimi() {
  const kalemler = ["Mağaza tasarımı", "Ürün ve stok paneli", "Sanal POS bağlantısı", "Yayın ve teslim"];
  return (
    <div className="flex h-full items-center justify-center px-5">
      <div className="w-full max-w-[13.5rem] rounded-[6px] bg-[#f4f3ef] px-3.5 pb-3 pt-3 text-[#18181b] shadow-[0_24px_48px_-20px_rgba(0,0,0,0.95)]">
        <div className="flex items-start justify-between">
          <span>
            <span className="block text-[8px] font-bold tracking-[0.18em] text-[#71717a]">TEKLİF</span>
            <span className="mt-0.5 block text-[10.5px] font-semibold">Ahenk Ev</span>
          </span>
          <span className="text-[8.5px] text-[#71717a]">No 0148</span>
        </div>
        <ul className="mt-2 border-t border-[#e4e4e7]">
          {kalemler.map((k, i) => (
            <li key={k} className="flex items-center justify-between border-b border-[#e4e4e7] py-[5px]">
              <span className="text-[9.5px]">{k}</span>
              <span className="flex h-3 w-3 items-center justify-center text-[#16a34a]">
                <CizilenOnay gecikme={0.35 + i * 0.22} className="h-3 w-3" />
              </span>
            </li>
          ))}
        </ul>
        <div className="mt-2 flex items-end justify-between">
          <svg viewBox="0 0 90 26" className="h-[22px] w-[78px]" fill="none" aria-hidden="true">
            <motion.path
              d="M2 18 C 8 6, 12 4, 14 12 S 18 22, 24 12 S 32 2, 34 14 S 40 20, 46 10 C 50 4, 54 18, 60 14 S 72 8, 88 12"
              stroke="#1e3a8a"
              strokeWidth={1.4}
              strokeLinecap="round"
              strokeLinejoin="round"
              variants={{ gizli: { pathLength: 0 }, gorunur: { pathLength: 1, transition: { delay: 1.35, duration: 0.9, ease: "easeInOut" } } }}
            />
          </svg>
          <span className="relative h-[16px] w-[64px]">
            <motion.span
              variants={{ gizli: { opacity: 1 }, gorunur: { opacity: 0, transition: { delay: 2.25, duration: 0.2 } } }}
              className="absolute inset-0 flex items-center justify-center rounded-full bg-[#fef3c7] text-[8px] font-semibold text-[#92400e]"
            >
              Onay bekliyor
            </motion.span>
            <motion.span
              variants={yay(2.3, 0, 0)}
              className="absolute inset-0 flex items-center justify-center rounded-full bg-[#dcfce7] text-[8px] font-semibold text-[#166534]"
            >
              Onaylandı
            </motion.span>
          </span>
        </div>
      </div>
    </div>
  );
}

/* ---------- Örnek proje: Ahenk Ev, el yapımı seramik mağazası ---------- */
/* Düzen, Türk ajansı Beew'in Minikmucize e-ticaret tasarımındaki yapıyı izler:
   duyuru şeridi, logo ve arama, kategori menüsü, fotoğraflı giriş ve yanında öne çıkan ürün. */

const KATEGORILER = ["Vazolar", "Kupalar", "Tabaklar", "Tekstil", "Yeni gelenler"];
const URUNLER = [
  { ad: "Kum kavanoz", src: "/surec/ahenk-urun1.jpg" },
  { ad: "Kil vazo üçlü", src: "/surec/ahenk-urun2.jpg" },
  { ad: "Beyaz vazo", src: "/surec/ahenk-urun3.jpg" },
];

function Kalp() {
  return (
    <svg viewBox="0 0 16 16" className="h-[7px] w-[7px]" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden="true">
      <path d="M8 13.5 C 3 10, 1.5 7.5, 2.5 5 C 3.5 2.8, 6.5 2.6, 8 5 C 9.5 2.6, 12.5 2.8, 13.5 5 C 14.5 7.5, 13 10, 8 13.5 Z" strokeLinejoin="round" />
    </svg>
  );
}

function Canta() {
  return (
    <svg viewBox="0 0 16 16" className="h-[7px] w-[7px]" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden="true">
      <path d="M3 5.5 H13 L12.2 14 H3.8 Z" strokeLinejoin="round" />
      <path d="M5.8 5.5 V4.5 A2.2 2.2 0 0 1 10.2 4.5 V5.5" />
    </svg>
  );
}

function Ara() {
  return (
    <svg viewBox="0 0 16 16" className="h-[6px] w-[6px]" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
      <circle cx="7" cy="7" r="4.5" />
      <path d="M10.5 10.5 L14 14" strokeLinecap="round" />
    </svg>
  );
}

/** Ahenk Ev mağazasının ana sayfası; açık tema, gerçek ürün fotoğrafları. */
function OrnekMagaza() {
  return (
    <div className="absolute inset-0 flex flex-col bg-[#f7f5f1] text-[#1c1917]">
      <div className="flex h-[9px] shrink-0 items-center justify-center bg-[#1c1917] text-[4.5px] tracking-[0.04em] text-white">
        Tüm siparişlerde ücretsiz kargo
      </div>
      <div className="flex h-[17px] shrink-0 items-center gap-2 border-b border-[#e7e2d9] bg-white px-2.5">
        <span className="text-[7.5px] font-bold tracking-[-0.03em]">ahenk</span>
        <span className="flex h-[9px] flex-1 items-center justify-between rounded-full bg-[#f2efea] px-1.5 text-[4.5px] text-[#8a847b]">
          Ürün ya da koleksiyon ara
          <Ara />
        </span>
        <span className="flex items-center gap-1.5 text-[#1c1917]">
          <Kalp />
          <span className="relative">
            <Canta />
            <span className="absolute -right-[3px] -top-[3px] flex h-[5px] w-[5px] items-center justify-center rounded-full bg-[#b45309] text-[3.5px] text-white">2</span>
          </span>
        </span>
      </div>
      <div className="flex h-[11px] shrink-0 items-center gap-2 border-b border-[#e7e2d9] bg-white px-2.5 text-[4.5px] text-[#57534e]">
        <span className="rounded-[2px] border border-[#1c1917] px-1 py-[1px] font-medium text-[#1c1917]">Tüm kategoriler</span>
        {KATEGORILER.map((k) => (
          <span key={k}>{k}</span>
        ))}
      </div>
      <div className="grid min-h-0 flex-1 grid-cols-[1fr_31%] gap-1.5 bg-[#e8e4dc] p-1.5">
        <div className="relative overflow-hidden rounded-[3px]">
          <img src="/surec/ahenk-giris.jpg" alt="" loading="lazy" decoding="async" className="absolute inset-0 h-full w-full object-cover" />
          <span className="absolute inset-0 bg-gradient-to-r from-white/85 via-white/40 to-transparent" />
          <span className="absolute inset-y-0 left-2 flex flex-col justify-center">
            <span className="text-[4.5px] font-semibold uppercase tracking-[0.14em] text-[#b45309]">Yeni koleksiyon</span>
            <span className="mt-[2px] text-[9px] font-semibold leading-[10px] tracking-[-0.02em]">
              El yapımı seramikle
              <br />
              evinize sıcaklık katın.
            </span>
            <span className="mt-1.5 w-fit bg-[#1c1917] px-1.5 py-[2px] text-[4.5px] font-semibold text-white">ALIŞVERİŞE BAŞLA</span>
          </span>
        </div>
        <div className="flex min-h-0 flex-col overflow-hidden rounded-[3px] bg-white">
          <span className="relative block min-h-0 flex-1 overflow-hidden">
            <img src="/surec/ahenk-set.jpg" alt="" loading="lazy" decoding="async" className="absolute inset-0 h-full w-full object-cover" />
            <span className="absolute left-1 top-1 bg-[#7c3aed] px-[3px] py-[1px] text-[4px] font-semibold text-white">Yeni</span>
          </span>
          <span className="flex items-center justify-between px-1.5 py-1">
            <span>
              <span className="block text-[3.8px] text-[#8a847b]">Ahenk Atölye</span>
              <span className="block text-[5px] font-medium">Çizgili vazo seti</span>
            </span>
            <span className="flex h-[9px] w-[9px] items-center justify-center bg-[#1c1917] text-white">
              <Canta />
            </span>
          </span>
        </div>
      </div>
      <div className="grid h-[22%] shrink-0 grid-cols-3 gap-1.5 bg-[#f7f5f1] px-1.5 pb-1 pt-1">
        {URUNLER.map((u) => (
          <span key={u.ad} className="flex min-h-0 items-center gap-1 rounded-[3px] bg-white p-[3px]">
            <img src={u.src} alt="" loading="lazy" decoding="async" className="aspect-square h-full rounded-[2px] object-cover" />
            <span className="text-[4.5px] font-medium leading-[6px]">{u.ad}</span>
          </span>
        ))}
      </div>
    </div>
  );
}

/* ---------- Tasarım: aynı düzenin tel kafes taslağı, sürgüyle tasarlanmış sayfaya döner ---------- */
function TelKafes() {
  const cizgi = "border border-dashed border-[#c9c3b8]";
  return (
    <div className="absolute inset-0 flex flex-col bg-[#f7f5f1]">
      <div className={`h-[9px] shrink-0 ${cizgi} border-x-0 border-t-0`} />
      <div className="flex h-[17px] shrink-0 items-center gap-2 px-2.5">
        <span className={`h-[6px] w-6 rounded-sm ${cizgi}`} />
        <span className={`h-[9px] flex-1 rounded-full ${cizgi}`} />
        <span className={`h-[7px] w-4 rounded-sm ${cizgi}`} />
      </div>
      <div className="flex h-[11px] shrink-0 items-center gap-2 px-2.5">
        {[0, 1, 2, 3, 4, 5].map((i) => (
          <span key={i} className={`h-[5px] w-6 rounded-sm ${cizgi}`} />
        ))}
      </div>
      <div className="grid min-h-0 flex-1 grid-cols-[1fr_31%] gap-1.5 p-1.5">
        <div className={`relative flex flex-col justify-center gap-1 rounded-[3px] pl-2 ${cizgi}`}>
          <svg className="absolute inset-0 h-full w-full text-[#d6d0c5]" preserveAspectRatio="none" viewBox="0 0 100 100" aria-hidden="true">
            <path d="M0 0 L100 100 M100 0 L0 100" stroke="currentColor" strokeWidth="0.5" vectorEffect="non-scaling-stroke" />
          </svg>
          <span className={`relative h-[4px] w-10 rounded-sm bg-[#f7f5f1] ${cizgi}`} />
          <span className={`relative h-[8px] w-24 rounded-sm bg-[#f7f5f1] ${cizgi}`} />
          <span className={`relative h-[8px] w-20 rounded-sm bg-[#f7f5f1] ${cizgi}`} />
          <span className={`relative mt-0.5 h-[7px] w-14 bg-[#f7f5f1] ${cizgi}`} />
        </div>
        <div className={`rounded-[3px] ${cizgi}`} />
      </div>
      <div className="grid h-[22%] shrink-0 grid-cols-3 gap-1.5 px-1.5 pb-1 pt-1">
        {[0, 1, 2].map((i) => (
          <span key={i} className={`rounded-[3px] ${cizgi}`} />
        ))}
      </div>
    </div>
  );
}

export function TasarimCizimi() {
  const gecis = { delay: 0.5, duration: 1.6, ease: [0.65, 0, 0.35, 1] as const };
  return (
    <div className="flex h-full items-center justify-center px-4">
      <Pencere className="w-full max-w-[15.5rem]" ust={<span className="text-[8.5px] text-neutral-500">Ana sayfa tasarımı</span>}>
        <div className="relative aspect-[16/11] overflow-hidden bg-[#f7f5f1]">
          <TelKafes />
          <motion.div className="absolute inset-0" variants={{ gizli: { clipPath: "inset(0 100% 0 0)" }, gorunur: { clipPath: "inset(0 0% 0 0)", transition: gecis } }}>
            <OrnekMagaza />
          </motion.div>
          <motion.div
            aria-hidden="true"
            className="absolute inset-y-0 z-10 w-0"
            variants={{ gizli: { left: "0%", opacity: 0 }, gorunur: { left: ["0%", "100%"], opacity: [0, 1, 1, 0], transition: { ...gecis, times: [0, 0.08, 0.92, 1] } } }}
          >
            <span className="absolute inset-y-0 -left-px w-[2px] bg-white shadow-[0_0_10px_rgba(255,255,255,0.7)]" />
            <span className="absolute left-0 top-1/2 flex h-5 w-5 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-white shadow-[0_2px_8px_rgba(0,0,0,0.5)]">
              <svg viewBox="0 0 12 8" className="h-[7px] w-[10px] text-zemin" fill="currentColor" aria-hidden="true">
                <path d="M0 4 L3.5 0.5 V7.5 Z M12 4 L8.5 0.5 V7.5 Z" />
              </svg>
            </span>
          </motion.div>
        </div>
      </Pencere>
    </div>
  );
}

/* ---------- Geliştirme: renklendirilmiş kod satır satır yazılır, derlenir ---------- */
/** kod.svg içinde yazı olan satırlar; 2. satır boş. Görsel 240x136, burada 0.8 oranında; satır bandı 12.8 piksel. */
const KOD_SATIRLARI = [1, 3, 4, 5, 6, 7, 8];
const KOD_G = 192;
const KOD_Y = 108.8;
const SATIR = 12.8;
const kirp = (satir: number, sag: string) => `inset(${((satir - 1) * SATIR).toFixed(1)}px ${sag} ${(KOD_Y - satir * SATIR).toFixed(1)}px 0px)`;
export function GelistirmeCizimi() {
  return (
    <div className="flex h-full items-center justify-center px-3.5">
      <Pencere
        className="w-full"
        ust={
          <span className="flex items-center gap-1 text-[8.5px] text-neutral-300">
            <span className="h-[5px] w-[5px] rounded-full bg-sky-400/80" /> Sepet.tsx
          </span>
        }
      >
        <div className="flex gap-2.5 px-2.5 py-2">
          <div className="select-none pt-px text-right font-mono text-[9px] leading-[12.8px] text-neutral-600">
            {Array.from({ length: 8 }, (_, i) => (
              <div key={i}>{i + 1}</div>
            ))}
          </div>
          <div className="relative min-w-0 flex-1 overflow-hidden" style={{ height: KOD_Y }}>
            {KOD_SATIRLARI.map((satir, i) => (
              <motion.img
                key={satir}
                src="/surec/kod.svg"
                alt=""
                aria-hidden="true"
                className="absolute left-0 top-0 max-w-none"
                style={{ width: KOD_G, height: KOD_Y, clipPath: kirp(satir, "100%") }}
                variants={{
                  gizli: { clipPath: kirp(satir, "100%") },
                  gorunur: { clipPath: kirp(satir, "0%"), transition: { delay: 0.3 + i * 0.2, duration: 0.22, ease: "linear" } },
                }}
              />
            ))}
          </div>
        </div>
        <div className="flex items-center justify-between border-t border-white/[0.06] bg-[#16161a] px-2.5 py-1.5">
          <span className="relative h-[14px] w-[110px]">
            <motion.span
              variants={{ gizli: { opacity: 1 }, gorunur: { opacity: 0, transition: { delay: 2.25, duration: 0.2 } } }}
              className="absolute inset-0 flex items-center gap-1.5 text-[9px] text-neutral-400"
            >
              <span className="relative h-[3px] w-12 overflow-hidden rounded-full bg-white/10">
                <motion.span
                  className="absolute inset-0 origin-left rounded-full bg-neutral-300"
                  variants={{ gizli: { scaleX: 0 }, gorunur: { scaleX: 1, transition: { delay: 1.7, duration: 0.55, ease: "easeInOut" } } }}
                />
              </span>
              Derleniyor
            </motion.span>
            <motion.span variants={belir(2.3, 0)} className="absolute inset-0 flex items-center gap-1 text-[9px] text-emerald-300">
              <CizilenOnay gecikme={2.35} className="h-[11px] w-[11px]" />
              Ara sürüm hazır
            </motion.span>
          </span>
          <span className="truncate text-[8.5px] text-neutral-500">onizleme.kamdevops.com</span>
        </div>
      </Pencere>
    </div>
  );
}

/* ---------- Yayın: adres yazılır, sayfa yüklenir, site yayında ---------- */
const ADRES = "ahenkev.com";
export function YayinCizimi() {
  const yazmaSonu = 0.2 + ADRES.length * 0.045;
  return (
    <div className="flex h-full items-center justify-center px-3.5">
      <div className="relative w-full max-w-[16rem]">
        <Pencere
          ust={
            <span className="flex w-full items-center justify-center gap-1 rounded-[5px] bg-white/[0.06] px-2 py-[3px] text-[8.5px] text-neutral-300">
              <motion.span variants={yay(yazmaSonu, 0, 0)} className="flex">
                <IconLock size={8} className="text-neutral-400" />
              </motion.span>
              <span>
                {ADRES.split("").map((h, i) => (
                  <motion.span key={i} variants={{ gizli: { opacity: 0 }, gorunur: { opacity: 1, transition: { delay: 0.2 + i * 0.045, duration: 0.01 } } }}>
                    {h}
                  </motion.span>
                ))}
              </span>
            </span>
          }
        >
          <div className="relative aspect-[16/11] overflow-hidden bg-[#f7f5f1]">
            <motion.span
              className="absolute left-0 top-0 z-10 h-[2px] w-full origin-left bg-vurgu"
              variants={{ gizli: { scaleX: 0, opacity: 1 }, gorunur: { scaleX: [0, 0.7, 1], opacity: [1, 1, 0], transition: { delay: yazmaSonu + 0.1, duration: 0.9, times: [0, 0.6, 1] } } }}
            />
            <motion.div
              className="absolute inset-0"
              variants={{ gizli: { opacity: 0, scale: 1.03 }, gorunur: { opacity: 1, scale: 1, transition: { delay: yazmaSonu + 0.55, duration: 0.6, ease: EGRI } } }}
            >
              <OrnekMagaza />
            </motion.div>
          </div>
        </Pencere>
        <motion.div
          variants={yay(yazmaSonu + 1.25, 0, 10)}
          className="absolute -bottom-3 right-2 flex items-center gap-2 rounded-lg border border-white/[0.1] bg-[#18181c] px-2.5 py-1.5 shadow-[0_12px_24px_-8px_rgba(0,0,0,0.9)]"
        >
          <span className="relative flex h-2 w-2">
            <motion.span
              className="absolute inset-0 rounded-full bg-emerald-400"
              variants={{ gizli: { scale: 1, opacity: 0 }, gorunur: { scale: [1, 2.6], opacity: [0.6, 0], transition: { delay: yazmaSonu + 1.5, duration: 1.2, repeat: 1 } } }}
            />
            <span className="relative h-2 w-2 rounded-full bg-emerald-400" />
          </span>
          <span className="leading-none">
            <span className="block text-[10px] font-semibold text-white">Yayında</span>
            <span className="mt-0.5 block text-[8.5px] text-neutral-500">Şu an 12 kişi sitede</span>
          </span>
        </motion.div>
      </div>
    </div>
  );
}

/* ---------- Ölçme ---------- */

/** Ölçme: analiz paneli kartı; büyük rakam, aylık çizgi, çizgide yürüyen nokta. */
const OLCME_YOL = "M0 58 C 20 56, 34 50, 52 47 S 86 42, 104 34 S 140 24, 158 18 S 186 9, 200 6";
export function OlcmeCizimi() {
  const aylar = ["Oca", "Şub", "Mar", "Nis", "May", "Haz"];
  return (
    <div className="flex h-full items-center justify-center px-5">
      <Pencere className="w-full max-w-[19rem]" ust={<span className="text-[8.5px] text-neutral-500">ahenkev.com, analiz</span>}>
        <div className="px-3.5 pb-2.5 pt-3">
          <div className="flex items-end justify-between">
            <span>
              <span className="block text-[9.5px] text-neutral-500">Sipariş, son 6 ay</span>
              <motion.span variants={belir(0.25, 4)} className="mt-0.5 block text-[19px] font-semibold leading-none tracking-tight text-white">
                1.284
              </motion.span>
            </span>
            <motion.span variants={yay(1.5, 0, 0)} className="flex items-center gap-0.5 rounded-full bg-emerald-400/[0.12] px-1.5 py-0.5 text-[9px] font-semibold text-emerald-300">
              <svg viewBox="0 0 10 10" className="h-2 w-2" fill="currentColor" aria-hidden="true">
                <path d="M5 1 L9 6 H6.2 V9 H3.8 V6 H1 Z" />
              </svg>
              18
            </motion.span>
          </div>
          <svg viewBox="0 0 200 64" className="mt-2.5 h-[60px] w-full overflow-visible" fill="none" aria-hidden="true">
            <defs>
              <linearGradient id="olcme-alan" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0" stopColor="#e2462d" stopOpacity="0.28" />
                <stop offset="1" stopColor="#e2462d" stopOpacity="0" />
              </linearGradient>
            </defs>
            {[16, 32, 48].map((y) => (
              <line key={y} x1={0} x2={200} y1={y} y2={y} stroke="rgba(255,255,255,0.05)" />
            ))}
            <motion.path
              d={`${OLCME_YOL} L 200 64 L 0 64 Z`}
              fill="url(#olcme-alan)"
              variants={{ gizli: { opacity: 0 }, gorunur: { opacity: 1, transition: { delay: 1.4, duration: 0.6 } } }}
            />
            <motion.path
              d={OLCME_YOL}
              stroke="#e2462d"
              strokeWidth={1.8}
              strokeLinecap="round"
              variants={{ gizli: { pathLength: 0 }, gorunur: { pathLength: 1, transition: { delay: 0.35, duration: 1.2, ease: "easeInOut" } } }}
            />
            <motion.circle
              r={3.2}
              fill="#121215"
              stroke="#e2462d"
              strokeWidth={1.8}
              variants={{
                gizli: { cx: 0, cy: 58, opacity: 0 },
                gorunur: { cx: [0, 52, 104, 158, 200], cy: [58, 47, 34, 18, 6], opacity: 1, transition: { delay: 0.35, duration: 1.2, ease: "easeInOut" } },
              }}
            />
          </svg>
          <div className="mt-1 flex justify-between text-[8.5px] text-neutral-600">
            {aylar.map((a) => (
              <span key={a}>{a}</span>
            ))}
          </div>
        </div>
      </Pencere>
    </div>
  );
}

/** Kartın görünür olunca alt sahneleri oynatması için kapsayıcı ayarları. */
export const SAHNE_TETIK = { initial: "gizli", whileInView: "gorunur", viewport: { once: true, margin: "-80px" } } as const;
