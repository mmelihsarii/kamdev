/*
 * Panelin ortak yapı taşları: düğme, alan, pencere, bildirim, onay ve veri yükleme.
 * Yönetim ve müşteri paneli aynı parçaları kullanır.
 */
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type ButtonHTMLAttributes,
  type ReactNode,
} from "react";
import { AnimatePresence, motion } from "motion/react";
import { IconAlertTriangle, IconCheck, IconLoader2, IconX } from "@tabler/icons-react";
import { ApiHatasi } from "./api";

/* ---------------- Sınıflar ---------------- */

export const GIRDI =
  "w-full rounded-lg border border-white/10 bg-white/[0.03] px-3.5 py-2.5 text-[15px] text-white placeholder:text-neutral-500 outline-none transition-colors focus:border-vurgu/70 focus:bg-white/[0.05] disabled:opacity-50";

export const KART = "rounded-xl border border-white/[0.07] bg-white/[0.02]";

/* ---------------- Düğme ---------------- */

type DugmeTuru = "birincil" | "ikincil" | "tehlike" | "sade";

const DUGME_TURU: Record<DugmeTuru, string> = {
  birincil: "bg-vurgu text-white hover:bg-[#ea583f] disabled:bg-vurgu/50",
  ikincil: "border border-white/12 bg-white/[0.04] text-neutral-100 hover:border-white/25 hover:bg-white/[0.08]",
  tehlike: "border border-red-500/30 bg-red-500/[0.06] text-red-300 hover:border-red-400/60 hover:bg-red-500/15",
  sade: "text-neutral-300 hover:bg-white/[0.06] hover:text-white",
};

export function Dugme({
  tur = "ikincil",
  kucuk,
  yukleniyor,
  ikon,
  children,
  className = "",
  ...geri
}: ButtonHTMLAttributes<HTMLButtonElement> & { tur?: DugmeTuru; kucuk?: boolean; yukleniyor?: boolean; ikon?: ReactNode }) {
  return (
    <button
      type="button"
      {...geri}
      disabled={geri.disabled || yukleniyor}
      className={`inline-flex shrink-0 items-center justify-center gap-2 rounded-lg font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-60 ${
        kucuk ? "h-8 px-3 text-[13px]" : "h-10 px-4 text-sm"
      } ${DUGME_TURU[tur]} ${className}`}
    >
      {yukleniyor ? <IconLoader2 size={kucuk ? 14 : 16} className="animate-spin" aria-hidden="true" /> : ikon}
      {children}
    </button>
  );
}

/** Yalnızca simgeli küçük düğme; erişilebilir adı zorunlu. */
export function SimgeDugme({ ad, children, className = "", ...geri }: ButtonHTMLAttributes<HTMLButtonElement> & { ad: string }) {
  return (
    <button
      type="button"
      aria-label={ad}
      title={ad}
      {...geri}
      className={`inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-neutral-400 transition-colors hover:bg-white/[0.07] hover:text-white disabled:pointer-events-none disabled:opacity-30 ${className}`}
    >
      {children}
    </button>
  );
}

/* ---------------- Alan ---------------- */

export function Alan({
  etiket,
  ipucu,
  sayac,
  zorunlu,
  children,
  className = "",
  htmlFor,
}: {
  etiket: string;
  ipucu?: ReactNode;
  sayac?: { deger: number; sinir: number };
  zorunlu?: boolean;
  children: ReactNode;
  className?: string;
  htmlFor?: string;
}) {
  const asim = sayac && sayac.deger > sayac.sinir;
  return (
    <div className={className}>
      <div className="mb-1.5 flex items-baseline justify-between gap-3">
        <label htmlFor={htmlFor} className="text-[13px] font-medium text-neutral-200">
          {etiket}
          {zorunlu && <span className="ml-2 text-[11.5px] font-normal text-neutral-500">zorunlu</span>}
        </label>
        {sayac && (
          <span className={`text-[12px] tabular-nums ${asim ? "text-amber-400" : "text-neutral-500"}`}>
            {sayac.deger} karakter, önerilen en çok {sayac.sinir}
          </span>
        )}
      </div>
      {children}
      {ipucu && <p className="mt-1.5 text-[12.5px] leading-relaxed text-neutral-500">{ipucu}</p>}
    </div>
  );
}

/** Açma kapama anahtarı. */
export function Anahtar({ acik, degistir, etiket, aciklama }: { acik: boolean; degistir: (v: boolean) => void; etiket: string; aciklama?: string }) {
  return (
    <label className="flex cursor-pointer items-start gap-3">
      <button
        type="button"
        role="switch"
        aria-checked={acik}
        onClick={() => degistir(!acik)}
        className={`relative mt-0.5 h-6 w-11 shrink-0 rounded-full transition-colors ${acik ? "bg-vurgu" : "bg-white/15"}`}
      >
        <span className={`absolute left-0 top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform ${acik ? "translate-x-[22px]" : "translate-x-0.5"}`} />
      </button>
      <span>
        <span className="block text-sm font-medium text-neutral-100">{etiket}</span>
        {aciklama && <span className="mt-0.5 block text-[12.5px] text-neutral-500">{aciklama}</span>}
      </span>
    </label>
  );
}

/* ---------------- Durum ---------------- */

export function Yukleniyor({ metin = "Yükleniyor", tamEkran }: { metin?: string; tamEkran?: boolean }) {
  return (
    <div className={`flex items-center justify-center gap-3 text-sm text-neutral-400 ${tamEkran ? "min-h-[100svh]" : "py-16"}`}>
      <IconLoader2 size={18} className="animate-spin text-vurgu" aria-hidden="true" />
      {metin}
    </div>
  );
}

export function HataKutusu({ hata, yenile }: { hata: string; yenile?: () => void }) {
  return (
    <div className="flex flex-col items-start gap-3 rounded-xl border border-red-500/25 bg-red-500/[0.05] p-5 text-sm text-red-200 sm:flex-row sm:items-center sm:justify-between">
      <span className="flex items-center gap-2.5">
        <IconAlertTriangle size={18} aria-hidden="true" />
        {hata}
      </span>
      {yenile && (
        <Dugme kucuk onClick={yenile}>
          Tekrar dene
        </Dugme>
      )}
    </div>
  );
}

export function BosDurum({ baslik, metin, eylem }: { baslik: string; metin?: string; eylem?: ReactNode }) {
  return (
    <div className="flex flex-col items-center rounded-xl border border-dashed border-white/10 px-6 py-14 text-center">
      <p className="text-[15px] font-medium text-neutral-200">{baslik}</p>
      {metin && <p className="mt-1.5 max-w-sm text-sm text-neutral-500">{metin}</p>}
      {eylem && <div className="mt-5">{eylem}</div>}
    </div>
  );
}

/** Bölüm başlığı ve sağdaki eylemler. */
export function Baslik({ baslik, aciklama, children }: { baslik: string; aciklama?: ReactNode; children?: ReactNode }) {
  return (
    <div className="mb-7 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div className="min-w-0">
        <h1 className="text-[26px] font-bold tracking-tight text-white sm:text-[30px]">{baslik}</h1>
        {aciklama && <p className="mt-1.5 max-w-2xl text-[14.5px] leading-relaxed text-neutral-400">{aciklama}</p>}
      </div>
      {children && <div className="flex flex-wrap items-center gap-2">{children}</div>}
    </div>
  );
}

/* ---------------- Pencere ---------------- */

export function Pencere({
  acik,
  kapat,
  baslik,
  children,
  genis,
  alt,
}: {
  acik: boolean;
  kapat: () => void;
  baslik: string;
  children: ReactNode;
  genis?: boolean;
  alt?: ReactNode;
}) {
  useEffect(() => {
    if (!acik) return;
    const tus = (e: KeyboardEvent) => e.key === "Escape" && kapat();
    const eski = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", tus);
    return () => {
      document.body.style.overflow = eski;
      window.removeEventListener("keydown", tus);
    };
  }, [acik, kapat]);

  return (
    <AnimatePresence>
      {acik && (
        <motion.div
          className="fixed inset-0 z-[80] flex items-end justify-center bg-black/70 backdrop-blur-sm sm:items-center sm:p-6"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onMouseDown={(e) => e.target === e.currentTarget && kapat()}
        >
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-label={baslik}
            className={`flex max-h-[92svh] w-full flex-col overflow-hidden rounded-t-2xl border border-white/10 bg-[#0d0d10] shadow-2xl sm:rounded-2xl ${
              genis ? "sm:max-w-5xl" : "sm:max-w-lg"
            }`}
            initial={{ y: 24, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 24, opacity: 0 }}
            transition={{ type: "spring", stiffness: 380, damping: 34 }}
          >
            <div className="flex items-center justify-between gap-4 border-b border-white/[0.07] px-5 py-4">
              <h2 className="text-[17px] font-semibold text-white">{baslik}</h2>
              <SimgeDugme ad="Kapat" onClick={kapat}>
                <IconX size={18} />
              </SimgeDugme>
            </div>
            <div className="min-h-0 flex-1 overflow-y-auto px-5 py-5">{children}</div>
            {alt && <div className="flex flex-wrap justify-end gap-2 border-t border-white/[0.07] px-5 py-4">{alt}</div>}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

/* ---------------- Bildirim ve onay ---------------- */

type Bildirim = { id: number; metin: string; tur: "basari" | "hata" };
type OnaySecenegi = { baslik: string; metin?: ReactNode; dugme?: string; tehlike?: boolean };

const PanelBaglam = createContext<{
  bildir: (metin: string, tur?: Bildirim["tur"]) => void;
  hataBildir: (hata: unknown) => void;
  onayla: (secenek: OnaySecenegi) => Promise<boolean>;
}>({
  bildir: () => {},
  hataBildir: () => {},
  onayla: async () => false,
});

export function hataMetni(hata: unknown) {
  if (hata instanceof ApiHatasi) return hata.message;
  if (hata instanceof Error) return hata.message;
  return "Beklenmeyen bir hata oluştu";
}

export function PanelSaglayici({ children }: { children: ReactNode }) {
  const [bildirimler, setBildirimler] = useState<Bildirim[]>([]);
  const [onay, setOnay] = useState<(OnaySecenegi & { coz: (v: boolean) => void }) | null>(null);
  const sayac = useRef(0);

  const bildir = useCallback((metin: string, tur: Bildirim["tur"] = "basari") => {
    const id = ++sayac.current;
    setBildirimler((b) => [...b.slice(-3), { id, metin, tur }]);
    window.setTimeout(() => setBildirimler((b) => b.filter((x) => x.id !== id)), tur === "hata" ? 7000 : 3200);
  }, []);

  const hataBildir = useCallback((hata: unknown) => bildir(hataMetni(hata), "hata"), [bildir]);

  const onayla = useCallback(
    (secenek: OnaySecenegi) =>
      new Promise<boolean>((coz) => {
        setOnay({ ...secenek, coz });
      }),
    [],
  );

  const kapat = (sonuc: boolean) => {
    onay?.coz(sonuc);
    setOnay(null);
  };

  return (
    <PanelBaglam.Provider value={{ bildir, hataBildir, onayla }}>
      {children}

      <div className="pointer-events-none fixed inset-x-0 bottom-0 z-[90] flex flex-col items-center gap-2 p-4 sm:items-end">
        <AnimatePresence>
          {bildirimler.map((b) => (
            <motion.div
              key={b.id}
              layout
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 8 }}
              role="status"
              className={`pointer-events-auto flex max-w-md items-start gap-2.5 rounded-xl border px-4 py-3 text-sm shadow-2xl backdrop-blur ${
                b.tur === "hata" ? "border-red-500/30 bg-[#1a0d0d]/95 text-red-100" : "border-white/10 bg-[#121215]/95 text-neutral-100"
              }`}
            >
              {b.tur === "hata" ? (
                <IconAlertTriangle size={18} className="mt-px shrink-0 text-red-400" aria-hidden="true" />
              ) : (
                <IconCheck size={18} className="mt-px shrink-0 text-emerald-400" aria-hidden="true" />
              )}
              <span className="leading-snug">{b.metin}</span>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      <Pencere
        acik={!!onay}
        kapat={() => kapat(false)}
        baslik={onay?.baslik ?? ""}
        alt={
          <>
            <Dugme onClick={() => kapat(false)}>Vazgeç</Dugme>
            <Dugme tur={onay?.tehlike ? "tehlike" : "birincil"} onClick={() => kapat(true)} autoFocus>
              {onay?.dugme ?? "Onayla"}
            </Dugme>
          </>
        }
      >
        <div className="text-[14.5px] leading-relaxed text-neutral-300">{onay?.metin}</div>
      </Pencere>
    </PanelBaglam.Provider>
  );
}

export function usePanel() {
  return useContext(PanelBaglam);
}

/* ---------------- Veri yükleme ---------------- */

export function useVeri<T>(getir: () => Promise<T>, bagimlilik: unknown[] = []) {
  const [veri, setVeri] = useState<T | null>(null);
  const [hata, setHata] = useState<string | null>(null);
  const [yukleniyor, setYukleniyor] = useState(true);
  const [tur, setTur] = useState(0);

  useEffect(() => {
    let iptal = false;
    setYukleniyor(true);
    getir()
      .then((v) => {
        if (iptal) return;
        setVeri(v);
        setHata(null);
      })
      .catch((h) => !iptal && setHata(hataMetni(h)))
      .finally(() => !iptal && setYukleniyor(false));
    return () => {
      iptal = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tur, ...bagimlilik]);

  return { veri, setVeri, hata, yukleniyor, yenile: () => setTur((t) => t + 1) };
}

/* ---------------- Kaydedilmemiş değişiklik koruması ---------------- */

let kirliSayfa = false;

/** Açık formda kaydedilmemiş değişiklik var mı; sayfa değiştirirken sorulur. */
export function kirliAyarla(kirli: boolean) {
  kirliSayfa = kirli;
}

export function ayrilmaOnayi() {
  if (!kirliSayfa) return true;
  const tamam = window.confirm("Kaydedilmemiş değişiklikler var. Taslak olarak saklandı, sonra kaldığın yerden devam edebilirsin. Yine de çıkılsın mı?");
  if (tamam) kirliSayfa = false;
  return tamam;
}

export function useKirliKoruma(kirli: boolean) {
  useEffect(() => {
    kirliAyarla(kirli);
    if (!kirli) return;
    const uyar = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = "";
    };
    window.addEventListener("beforeunload", uyar);
    return () => {
      window.removeEventListener("beforeunload", uyar);
      kirliAyarla(false);
    };
  }, [kirli]);
}

/** Ctrl S ya da Cmd S ile kaydet. */
export function useKaydetKisayolu(kaydet: () => void, etkin = true) {
  const ref = useRef(kaydet);
  ref.current = kaydet;
  useEffect(() => {
    if (!etkin) return;
    const tus = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "s") {
        e.preventDefault();
        ref.current();
      }
    };
    window.addEventListener("keydown", tus);
    return () => window.removeEventListener("keydown", tus);
  }, [etkin]);
}

/** Panoya kopyalar; eski tarayıcılarda seçip kopyalama yoluna düşer. */
export async function panoyaKopyala(metin: string) {
  try {
    await navigator.clipboard.writeText(metin);
    return true;
  } catch {
    const alan = document.createElement("textarea");
    alan.value = metin;
    document.body.appendChild(alan);
    alan.select();
    const sonuc = document.execCommand("copy");
    alan.remove();
    return sonuc;
  }
}
