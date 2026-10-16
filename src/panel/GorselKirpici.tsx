/*
 * Görsel kırpıcı. Alanın sitede gösterildiği oranda bir çerçeve açar; görsel
 * sürüklenip yakınlaştırılarak çerçeveye oturtulur. Sonuç tarayıcıda kesilir,
 * medya kütüphanesine yeni görsel olarak yüklenir ve adresi geri verilir.
 */
import { useEffect, useRef, useState, type PointerEvent as TepkiOlayi } from "react";
import { dosyaYukle } from "./api";
import { Dugme, hataMetni, Pencere } from "./ortak";

/** Çıktının uzun kenarı; sitede en geniş gösterimden biraz büyük. */
const CIKTI = 1920;

type Durum = { olcek: number; x: number; y: number };

export function GorselKirpici({
  src,
  oran,
  kapat,
  tamam,
}: {
  src: string | null;
  /** Genişlik bölü yükseklik, örneğin 16 / 10. */
  oran: number;
  kapat: () => void;
  tamam: (adres: string) => void;
}) {
  const kutu = useRef<HTMLDivElement>(null);
  const resim = useRef<HTMLImageElement | null>(null);
  const surukle = useRef<{ x: number; y: number; dx: number; dy: number } | null>(null);
  const [boyut, setBoyut] = useState<{ g: number; y: number } | null>(null);
  const [durum, setDurum] = useState<Durum>({ olcek: 1, x: 0, y: 0 });
  const [yukleniyor, setYukleniyor] = useState(false);
  const [hata, setHata] = useState<string | null>(null);

  useEffect(() => {
    setBoyut(null);
    setHata(null);
    setDurum({ olcek: 1, x: 0, y: 0 });
    if (!src) return;
    const r = new Image();
    r.onload = () => {
      resim.current = r;
      setBoyut({ g: r.naturalWidth, y: r.naturalHeight });
    };
    r.onerror = () => setHata("Görsel açılamadı.");
    r.src = src;
  }, [src]);

  // Görselin çerçeveye göre boyu (1 = çerçeve kadar). Yakınlaştırma 1 iken görsel çerçeveyi tam kaplar.
  const gorselOrani = boyut ? boyut.g / boyut.y : oran;
  const kapla = Math.max(oran / gorselOrani, 1);
  const gw = (olcek: number) => (kapla * olcek * gorselOrani) / oran;
  const gh = (olcek: number) => kapla * olcek;
  // Kaydırma çerçeve boyu cinsinden; görsel çerçevenin dışına taşamaz, boşluk kalmaz.
  const sinirla = (d: Durum): Durum => {
    const bosX = Math.max(0, gw(d.olcek) - 1) / 2;
    const bosY = Math.max(0, gh(d.olcek) - 1) / 2;
    return { olcek: d.olcek, x: Math.min(bosX, Math.max(-bosX, d.x)), y: Math.min(bosY, Math.max(-bosY, d.y)) };
  };

  const basla = (e: TepkiOlayi<HTMLDivElement>) => {
    e.currentTarget.setPointerCapture(e.pointerId);
    surukle.current = { x: e.clientX, y: e.clientY, dx: durum.x, dy: durum.y };
  };
  const tasi = (e: TepkiOlayi<HTMLDivElement>) => {
    const s = surukle.current;
    const k = kutu.current?.getBoundingClientRect();
    if (!s || !k) return;
    setDurum((d) => sinirla({ ...d, x: s.dx + (e.clientX - s.x) / k.width, y: s.dy + (e.clientY - s.y) / k.height }));
  };
  const birak = () => (surukle.current = null);

  const kaydet = async () => {
    const r = resim.current;
    if (!r || !boyut) return;
    setYukleniyor(true);
    setHata(null);
    try {
      // Çerçevenin görsel üstündeki karşılığı, görselin kendi piksellerinde.
      const w = gw(durum.olcek);
      const h = gh(durum.olcek);
      const sw = boyut.g / w;
      const sh = boyut.y / h;
      const sx = (((w - 1) / 2 - durum.x) / w) * boyut.g;
      const sy = (((h - 1) / 2 - durum.y) / h) * boyut.y;
      const cw = Math.round(Math.min(CIKTI, Math.max(600, sw)));
      const ch = Math.round(cw / oran);
      const tuval = document.createElement("canvas");
      tuval.width = cw;
      tuval.height = ch;
      const c = tuval.getContext("2d");
      if (!c) throw new Error("Tarayıcı görseli kesemedi.");
      c.imageSmoothingQuality = "high";
      c.drawImage(r, sx, sy, sw, sh, 0, 0, cw, ch);
      const blob = await new Promise<Blob | null>((ok) => tuval.toBlob(ok, "image/jpeg", 0.9));
      if (!blob) throw new Error("Görsel kaydedilemedi.");
      const ad = (src?.split("/").pop() ?? "gorsel").replace(/\.[a-z0-9]+$/i, "") + "-kirpilmis.jpg";
      const sonuc = await dosyaYukle(new File([blob], ad, { type: "image/jpeg" }));
      tamam(sonuc.adres);
      kapat();
    } catch (h) {
      setHata(hataMetni(h));
    } finally {
      setYukleniyor(false);
    }
  };

  const oranMetni = Math.abs(oran - 16 / 10) < 0.01 ? "16:10" : Math.abs(oran - 16 / 9) < 0.01 ? "16:9" : oran.toFixed(2);

  return (
    <Pencere acik={!!src} kapat={kapat} baslik="Görseli kırp" genis>
      <p className="mb-4 text-[13px] leading-relaxed text-neutral-400">
        Sitede bu görsel {oranMetni} oranında görünür. Görseli sürükleyerek ve yakınlaştırarak çerçeveye oturt; çerçevenin dışında kalan kısım sitede görünmez.
      </p>
      <div
        ref={kutu}
        onPointerDown={basla}
        onPointerMove={tasi}
        onPointerUp={birak}
        onPointerCancel={birak}
        className="relative w-full cursor-grab touch-none select-none overflow-hidden rounded-lg border border-white/15 bg-black active:cursor-grabbing"
        style={{ aspectRatio: String(oran) }}
      >
        {src && boyut && (
          <img
            src={src}
            alt=""
            draggable={false}
            className="pointer-events-none absolute max-w-none -translate-x-1/2 -translate-y-1/2"
            style={{
              left: `${50 + durum.x * 100}%`,
              top: `${50 + durum.y * 100}%`,
              width: `${gw(durum.olcek) * 100}%`,
              height: `${gh(durum.olcek) * 100}%`,
            }}
          />
        )}
        {/* Üçte bir çizgileri */}
        <div aria-hidden="true" className="pointer-events-none absolute inset-0 grid grid-cols-3 grid-rows-3">
          {Array.from({ length: 9 }).map((_, i) => (
            <span key={i} className="border-white/15 [&:nth-child(-n+6)]:border-b [&:not(:nth-child(3n))]:border-r" />
          ))}
        </div>
      </div>

      <label className="mt-4 flex items-center gap-3 text-[13px] text-neutral-400">
        Yakınlaştır
        <input
          type="range"
          min={1}
          max={3}
          step={0.01}
          value={durum.olcek}
          onChange={(e) => {
            const olcek = Number(e.target.value);
            setDurum((d) => sinirla({ ...d, olcek }));
          }}
          className="flex-1 accent-[var(--color-vurgu)]"
        />
      </label>

      {hata && (
        <p role="alert" className="mt-4 rounded-lg border border-red-500/25 bg-red-500/[0.06] px-3.5 py-2.5 text-sm text-red-200">
          {hata}
        </p>
      )}

      <div className="mt-5 flex flex-wrap justify-end gap-2">
        <Dugme tur="sade" onClick={kapat}>
          Vazgeç
        </Dugme>
        <Dugme tur="birincil" yukleniyor={yukleniyor} onClick={kaydet} disabled={!boyut}>
          Kırp ve kullan
        </Dugme>
      </div>
    </Pencere>
  );
}

/** Görselin oranı alanın oranına yeterince yakınsa kırpmaya gerek yoktur. */
export async function oranUyuyor(src: string, oran: number) {
  return new Promise<boolean>((ok) => {
    const r = new Image();
    r.onload = () => ok(Math.abs(r.naturalWidth / r.naturalHeight - oran) / oran < 0.02);
    r.onerror = () => ok(false);
    r.src = src;
  });
}
