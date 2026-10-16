/*
 * Restoran demosu: Çınaraltı Restoran. Yemeklerin maliyeti reçete ile
 * malzemenin güncel alış fiyatından hesaplanır; kapanan her adisyon reçeteye
 * göre stoktan düşer. Mutfak ekranı açık adisyonlardaki ve paketlerdeki
 * bekleyen kalemlerden oluşur.
 */
import { useState } from "react";
import { IconCash, IconCheck, IconCreditCard, IconMinus, IconMoped, IconPlus, IconReceipt, IconX } from "@tabler/icons-react";
import { restoran as bilgi } from "./bilgi";
import { ozetEkrani } from "../../panel/Ozet";
import { Cekmece, EkranBasligi } from "../../panel/Liste";
import { AlanListesi, Anahtar, Bolum, Cubuk, Dugme, DurumYazi, Gecmis, Kart, MiniTablo, RENK } from "../../panel/parcalar";
import { CubukGrafik } from "../../panel/grafik";
import { DAKIKA, GUN, GUN_KISA, SAAT, gunBasi, kisiler, saat, sayi, tarih, tl, tlKisa, yuzde, zaman } from "../../ortak";
import type { Durum, Kayit, ModulBilgi, PanelApi, Rastgele, SektorPanel, Veri } from "../../tipler";

const KULLANICI = { ad: "Kemal Aydın", rol: "İşletme sahibi" };
const GARSONLAR = ["Emre", "Selin", "Burak", "Deniz"];

// [ad, birim, alış fiyatı, kritik seviye]
const MALZEMELER: [string, string, number, number][] = [
  ["Kuzu kuşbaşı", "kg", 950, 6],
  ["Dana kıyma", "kg", 720, 8],
  ["Tavuk göğüs", "kg", 260, 8],
  ["Levrek", "kg", 520, 4],
  ["Domates", "kg", 45, 15],
  ["Sivri biber", "kg", 60, 6],
  ["Soğan", "kg", 25, 10],
  ["Patlıcan", "kg", 55, 10],
  ["Yoğurt", "kg", 110, 8],
  ["Beyaz peynir", "kg", 380, 4],
  ["Tereyağı", "kg", 520, 3],
  ["Zeytinyağı", "litre", 420, 5],
  ["Un", "kg", 28, 15],
  ["Pirinç", "kg", 75, 8],
  ["Kırmızı mercimek", "kg", 70, 5],
  ["Yumurta", "adet", 6, 90],
  ["Limon", "kg", 50, 4],
  ["Süt", "litre", 38, 10],
  ["Çay", "kg", 380, 2],
  ["Türk kahvesi", "kg", 900, 1],
  ["Şeker", "kg", 40, 5],
  ["Kadayıf", "kg", 160, 3],
  ["Ayran", "adet", 18, 40],
  ["Sucuk", "kg", 780, 3],
];
const M = (ad: string) => `m${MALZEMELER.findIndex((x) => x[0] === ad) + 1}`;

// [ad, kategori, fiyat, hazırlık dakika, reçete [malzeme, miktar]]
const MENU: [string, string, number, number, [string, number][]][] = [
  ["Serpme kahvaltı, iki kişilik", "Kahvaltı", 1450, 12, [["Beyaz peynir", 0.15], ["Yumurta", 4], ["Domates", 0.25], ["Tereyağı", 0.05], ["Zeytinyağı", 0.03], ["Çay", 0.02]]],
  ["Menemen", "Kahvaltı", 260, 10, [["Yumurta", 3], ["Domates", 0.25], ["Sivri biber", 0.08], ["Tereyağı", 0.02]]],
  ["Sucuklu yumurta", "Kahvaltı", 300, 8, [["Yumurta", 3], ["Sucuk", 0.08], ["Tereyağı", 0.015]]],
  ["Mercimek çorbası", "Başlangıç", 180, 3, [["Kırmızı mercimek", 0.07], ["Soğan", 0.03], ["Tereyağı", 0.01], ["Limon", 0.02]]],
  ["Haydari", "Başlangıç", 160, 3, [["Yoğurt", 0.15], ["Zeytinyağı", 0.01]]],
  ["Sigara böreği", "Başlangıç", 220, 8, [["Beyaz peynir", 0.08], ["Un", 0.08], ["Zeytinyağı", 0.05]]],
  ["Adana kebap", "Ana yemek", 520, 15, [["Dana kıyma", 0.22], ["Sivri biber", 0.05], ["Domates", 0.1], ["Soğan", 0.05]]],
  ["Kuzu şiş", "Ana yemek", 640, 15, [["Kuzu kuşbaşı", 0.22], ["Domates", 0.1], ["Sivri biber", 0.05], ["Pirinç", 0.08]]],
  ["Izgara köfte", "Ana yemek", 420, 12, [["Dana kıyma", 0.2], ["Soğan", 0.04], ["Pirinç", 0.08]]],
  ["Tavuk şiş", "Ana yemek", 380, 12, [["Tavuk göğüs", 0.25], ["Yoğurt", 0.03], ["Pirinç", 0.08], ["Domates", 0.1]]],
  ["Levrek ızgara", "Ana yemek", 590, 18, [["Levrek", 0.45], ["Limon", 0.05], ["Zeytinyağı", 0.02]]],
  ["Hünkar beğendi", "Ana yemek", 560, 16, [["Kuzu kuşbaşı", 0.2], ["Patlıcan", 0.35], ["Süt", 0.1], ["Tereyağı", 0.03]]],
  ["Karnıyarık", "Ana yemek", 390, 14, [["Patlıcan", 0.4], ["Dana kıyma", 0.12], ["Domates", 0.15], ["Pirinç", 0.08]]],
  ["Çoban salata", "Salata", 180, 4, [["Domates", 0.25], ["Sivri biber", 0.05], ["Soğan", 0.05], ["Zeytinyağı", 0.02], ["Limon", 0.03]]],
  ["Künefe", "Tatlı", 280, 10, [["Kadayıf", 0.1], ["Beyaz peynir", 0.08], ["Tereyağı", 0.04], ["Şeker", 0.06]]],
  ["Sütlaç", "Tatlı", 170, 1, [["Süt", 0.25], ["Pirinç", 0.03], ["Şeker", 0.05]]],
  ["Ayran", "İçecek", 70, 1, [["Ayran", 1]]],
  ["Çay", "İçecek", 40, 1, [["Çay", 0.004], ["Şeker", 0.01]]],
  ["Türk kahvesi", "İçecek", 110, 4, [["Türk kahvesi", 0.008], ["Şeker", 0.005]]],
  ["Limonata", "İçecek", 120, 2, [["Limon", 0.1], ["Şeker", 0.04]]],
];
const KATEGORILER = [...new Set(MENU.map((m) => m[1]))];
const BOLUMLER = [
  { ad: "Salon", masalar: 12 },
  { ad: "Bahçe", masalar: 8 },
  { ad: "Teras", masalar: 4 },
];
const KANALLAR = ["Yemek platformu", "Kendi sitesi", "Telefon"];
const SEMTLER = ["Moda", "Caferağa", "Osmanağa", "Rasimpaşa", "Fenerbahçe", "Göztepe", "Acıbadem", "Koşuyolu"];

/* ---------------- Hesaplar ---------------- */

const malzemeFiyati = (api: PanelApi, id: string) => api.bul("malzemeler", id)?.fiyat ?? 0;
const maliyet = (y: Kayit, api: PanelApi) => y.recete.reduce((t: number, [id, miktar]: [string, number]) => t + malzemeFiyati(api, id) * miktar, 0);
const maliyetOrani = (y: Kayit, api: PanelApi) => (maliyet(y, api) / (y.fiyat / 1.1)) * 100;
const yemekAdi = (api: PanelApi, id: string) => api.bul("menu", id)?.ad ?? "Ürün";
const adisyonToplam = (a: Kayit, api: PanelApi) => a.kalemler.reduce((t: number, k: Kayit) => t + k.adet * (api.bul("menu", k.menuId)?.fiyat ?? 0), 0);
const paketToplam = (p: Kayit, api: PanelApi) => p.kalemler.reduce((t: number, k: Kayit) => t + k.adet * (api.bul("menu", k.menuId)?.fiyat ?? 0), 0);

function masaDurumu(m: Kayit, api: PanelApi): Durum {
  if (!m.adisyon) return { ad: "Boş", renk: "gri" };
  if (m.adisyon.hesap) return { ad: "Hesap istedi", renk: "sari" };
  if (m.adisyon.kalemler.some((k: Kayit) => k.durum === "mutfakta" && api.ani.getTime() - k.t > 15 * DAKIKA)) return { ad: "Yemek gecikiyor", renk: "kirmizi" };
  return { ad: "Dolu", renk: "vurgu" };
}

const PAKET_DURUMU: Record<string, Durum> = {
  yeni: { ad: "Yeni", renk: "mavi" },
  mutfakta: { ad: "Hazırlanıyor", renk: "sari" },
  hazir: { ad: "Kurye bekliyor", renk: "mor" },
  yolda: { ad: "Yolda", renk: "vurgu" },
  teslim: { ad: "Teslim edildi", renk: "yesil" },
  iptal: { ad: "İptal", renk: "gri" },
};

/** Mutfak ekranındaki fişler: açık masalarda ve paketlerde hazırlanmayı bekleyen kalemler. */
function fisler(api: PanelApi) {
  const liste: { anahtar: string; kaynak: string; alt: string; t: number; kalemler: Kayit[]; masaId?: string; paketId?: string }[] = [];
  for (const m of api.veri.masalar) {
    if (!m.adisyon) continue;
    const bekleyen = m.adisyon.kalemler.filter((k: Kayit) => k.durum === "mutfakta");
    if (!bekleyen.length) continue;
    // Aynı masada aynı anda verilen kalemler tek fiştir.
    const gruplar = new Map<number, Kayit[]>();
    for (const k of bekleyen) gruplar.set(k.t, [...(gruplar.get(k.t) ?? []), k]);
    for (const [t, kalemler] of gruplar) liste.push({ anahtar: `${m.id}${t}`, kaynak: `Masa ${m.ad}`, alt: `${m.bolum}, garson ${m.adisyon.garson}`, t, kalemler, masaId: m.id });
  }
  for (const p of api.veri.paketler) if (p.durum === "yeni" || p.durum === "mutfakta") liste.push({ anahtar: p.id, kaynak: `Paket ${p.id.slice(1)}`, alt: p.kanal, t: p.t, kalemler: p.kalemler, paketId: p.id });
  return liste.sort((a, b) => a.t - b.t);
}

/* ---------------- Veri üretimi ---------------- */

function adisyonKalemleri(r: Rastgele, kisi: number, menu: Kayit[], t: number, simdi: number) {
  const kalemler: Kayit[] = [];
  const ekle = (kategori: string, adet: number, kt: number) => {
    const y = r.agirlikli(menu.filter((x) => x.kategori === kategori).map((x) => [x, x.populerlik] as const));
    const varolan = kalemler.find((k) => k.menuId === y.id && k.t === kt);
    if (varolan) varolan.adet += adet;
    else kalemler.push({ id: `k${Math.floor(r.kesir() * 1e9)}`, menuId: y.id, adet, t: kt, durum: "servis" });
  };
  const sipT = t + r.tam(3, 8) * DAKIKA;
  if (r.olasilik(0.6)) ekle("Başlangıç", r.tam(1, 2), sipT);
  for (let i = 0; i < kisi; i++) ekle("Ana yemek", 1, sipT);
  if (r.olasilik(0.5)) ekle("Salata", 1, sipT);
  for (let i = 0; i < kisi; i++) if (r.olasilik(0.7)) ekle("İçecek", 1, sipT);
  const tatliT = t + r.tam(45, 70) * DAKIKA;
  if (tatliT < simdi && r.olasilik(0.5)) {
    ekle("Tatlı", r.tam(1, kisi), tatliT);
    ekle("İçecek", r.tam(1, kisi), tatliT);
  }
  // Son verilen sipariş henüz mutfaktaysa durum ona göre.
  for (const k of kalemler) {
    const y = menu.find((x) => x.id === k.menuId)!;
    k.durum = simdi - k.t < y.hazirlik * DAKIKA * (0.6 + r.kesir() * 0.55) ? "mutfakta" : simdi - k.t < (y.hazirlik + 3) * DAKIKA ? "hazir" : "servis";
  }
  return kalemler;
}

function uret(ani: Date, r: Rastgele): Veri {
  const simdi = ani.getTime();
  const malzemeler: Kayit[] = MALZEMELER.map(([ad, birim, fiyat, kritik], i) => ({
    id: `m${i + 1}`,
    ad,
    birim,
    fiyat,
    kritik,
    stok: Math.round(kritik * (1.2 + r.kesir() * 3) * 10) / 10,
    tedarikci: r.sec(["Kadıköy Hal", "Ege Et", "Marmara Süt", "Toptan Kuru Gıda"]),
    gecmis: [],
  }));
  r.karistir([...malzemeler]).slice(0, 3).forEach((m) => (m.stok = Math.round(m.kritik * (0.2 + r.kesir() * 0.6) * 10) / 10));

  const menu: Kayit[] = MENU.map(([ad, kategori, fiyat, hazirlik, recete], i) => ({
    id: `y${i + 1}`,
    ad,
    kategori,
    fiyat,
    hazirlik,
    recete: recete.map(([m, miktar]) => [M(m), miktar]),
    populerlik: 0.4 + r.kesir() * 1.6,
    aktif: true,
    gecmis: [],
  }));

  // Son 30 günün günlük özeti; bugün yalnız şu ana kadar.
  const gunluk: Kayit[] = [];
  for (let g = 30; g >= 0; g--) {
    const gun = gunBasi(simdi) - g * GUN;
    const hafta = new Date(gun).getDay();
    const carpan = hafta === 5 || hafta === 6 ? 1.35 : hafta === 0 ? 1.2 : 0.9 + r.kesir() * 0.15;
    const tam = Math.round(118 * carpan * (0.9 + r.kesir() * 0.2));
    const saatKesri = g === 0 ? Math.max(0, Math.min(1, (ani.getHours() + ani.getMinutes() / 60 - 9) / 15)) ** 1.6 : 1;
    const adisyon = Math.round(tam * saatKesri);
    gunluk.push({ id: `d${g}`, gun, adisyon, kisi: Math.round(adisyon * 2.4), ciro: Math.round(adisyon * (1180 + r.tam(-80, 80))), paket: Math.round(adisyon * 0.35) });
  }

  // Masalar: akşam yoğunluğunda çoğu dolu.
  const masalar: Kayit[] = [];
  const saatNe = ani.getHours() + ani.getMinutes() / 60;
  const doluluk = saatNe >= 19 && saatNe < 22.5 ? 0.75 : saatNe >= 12 && saatNe < 14.5 ? 0.6 : 0.3;
  for (const b of BOLUMLER) {
    for (let i = 1; i <= b.masalar; i++) {
      const kapasite = b.ad === "Teras" ? 6 : r.sec([2, 4, 4, 4, 6]);
      const ad = `${b.ad[0]}${i}`;
      let adisyon: Record<string, unknown> | null = null;
      if (r.olasilik(doluluk)) {
        const kisi = Math.max(1, Math.min(kapasite, r.tam(Math.ceil(kapasite / 2), kapasite)));
        const t = simdi - r.tam(4, 95) * DAKIKA;
        adisyon = { acilis: t, kisi, garson: r.sec(GARSONLAR), kalemler: adisyonKalemleri(r, kisi, menu, t, simdi), hesap: simdi - t > 70 * DAKIKA && r.olasilik(0.6) };
      }
      masalar.push({ id: ad, ad, bolum: b.ad, kapasite, adisyon });
    }
  }

  // Bugün kapanan adisyonlar.
  const kapananlar: Kayit[] = [];
  const bugun = gunluk[gunluk.length - 1];
  for (let i = 0; i < Math.min(bugun.adisyon, 70); i++) {
    const t = gunBasi(simdi) + (9 + r.kesir() * Math.max(0.5, saatNe - 9)) * SAAT;
    if (t > simdi - 10 * DAKIKA) continue;
    kapananlar.push({ id: `a${i + 1}`, masa: `${r.sec(["S", "B", "T"])}${r.tam(1, 8)}`, t, tutar: Math.round(r.tam(380, 2600) / 10) * 10, kisi: r.tam(1, 5), odeme: r.agirlikli([["Kart", 70], ["Nakit", 18], ["Yemek kartı", 12]] as const) });
  }
  kapananlar.sort((a, b) => b.t - a.t);

  // Paket siparişleri: son üç saat.
  const paketler: Kayit[] = [];
  const kisi = kisiler(r, 30);
  for (let i = 0; i < 16; i++) {
    const t = simdi - r.tam(2, 170) * DAKIKA;
    const kalemler: Kayit[] = [];
    const n = r.tam(1, 3);
    for (let j = 0; j < n; j++) {
      const y = r.agirlikli(menu.filter((x) => ["Ana yemek", "Başlangıç", "Tatlı", "İçecek"].includes(x.kategori) && x.kategori !== "Kahvaltı").map((x) => [x, x.populerlik] as const));
      kalemler.push({ id: `pk${i}${j}`, menuId: y.id, adet: r.tam(1, 2), t, durum: "mutfakta" });
    }
    const yas = (simdi - t) / DAKIKA;
    const durum = yas < 4 ? "yeni" : yas < 16 ? "mutfakta" : yas < 22 ? "hazir" : yas < 50 ? "yolda" : r.olasilik(0.97) ? "teslim" : "iptal";
    paketler.push({
      id: `p${4100 + i}`,
      kanal: r.agirlikli(KANALLAR.map((k, j) => [k, [60, 25, 15][j]] as const)),
      musteri: kisi[i].tamAd,
      telefon: kisi[i].telefon,
      semt: r.sec(SEMTLER),
      kalemler,
      t,
      soz: t + r.tam(35, 50) * DAKIKA,
      durum,
      kurye: ["yolda", "teslim"].includes(durum) ? r.sec(["Mert", "Yusuf", "Ali"]) : "",
      gecmis: [{ t, m: "Sipariş alındı" }],
    });
  }
  paketler.sort((a, b) => b.t - a.t);

  // Son 30 günün satış adetleri, yemeğin popülerliğine göre.
  const toplamAdisyon = gunluk.slice(0, -1).reduce((t, g) => t + g.adisyon, 0);
  for (const y of menu) y.satis30 = Math.round(((toplamAdisyon * 2.4) / menu.length) * y.populerlik * (y.kategori === "İçecek" ? 1.6 : y.kategori === "Kahvaltı" ? 0.4 : 1));

  return { malzemeler, menu, gunluk, masalar, kapananlar, paketler };
}

/* ---------------- Salon ---------------- */

const oturma = (fark: number) => {
  const dk = Math.floor(fark / DAKIKA);
  if (dk < 2) return "yeni oturdu";
  return dk < 60 ? `${dk} dakikadır oturuyor` : `${Math.floor(dk / 60)} saat ${dk % 60} dakikadır oturuyor`;
};

function Adisyon({ m, api, kapat }: { m: Kayit; api: PanelApi; kapat: () => void }) {
  const [kategori, setKategori] = useState("Ana yemek");
  const [kisi, setKisi] = useState(2);
  const [sepet, setSepet] = useState<Record<string, number>>({});
  const a = m.adisyon;
  const s = api.ani.getTime();
  const sepetSatirlari = Object.entries(sepet).filter(([, n]) => n > 0);

  if (!a) {
    return (
      <>
        <header className="flex items-start justify-between gap-3 border-b border-[var(--k)] px-5 py-4">
          <div>
            <h3 className="text-[17px] font-bold">Masa {m.ad}</h3>
            <p className="mt-0.5 text-[12.5px] text-[var(--ms)]">
              {m.bolum}, {m.kapasite} kişilik, boş
            </p>
          </div>
          <button type="button" onClick={kapat} aria-label="Kapat" className="flex h-8 w-8 items-center justify-center rounded-lg text-[var(--ms)] hover:bg-[var(--k2)]">
            <IconX size={18} />
          </button>
        </header>
        <div className="px-5 py-5">
          <p className="text-[12.5px] text-[var(--ms)]">Kaç kişi oturdu?</p>
          <div className="mt-2 flex flex-wrap gap-2">
            {Array.from({ length: m.kapasite }, (_, i) => i + 1).map((n) => (
              <button key={n} type="button" aria-pressed={kisi === n} onClick={() => setKisi(n)} className={`h-10 w-10 rounded-lg border text-[14px] font-semibold ${kisi === n ? "border-[var(--p)] bg-[var(--p)] text-white" : "border-[var(--k)] hover:bg-[var(--k2)]"}`}>
                {n}
              </button>
            ))}
          </div>
          <Dugme
            tur="ana"
            className="mt-5"
            onClick={() => {
              api.guncelle("masalar", m.id, { adisyon: { acilis: s, kisi, garson: GARSONLAR[0], kalemler: [], hesap: false } });
              api.haber(`Masa ${m.ad} açıldı, ${kisi} kişi`, "basari");
              api.olay("masa-ac");
            }}
          >
            Masayı aç
          </Dugme>
        </div>
      </>
    );
  }

  const toplam = adisyonToplam(a, api);
  const kapatHesap = (odeme: string) => {
    // Reçetedeki malzemeler stoktan düşer.
    const dusus = new Map<string, number>();
    for (const k of a.kalemler) for (const [id, miktar] of api.bul("menu", k.menuId)!.recete as [string, number][]) dusus.set(id, (dusus.get(id) ?? 0) + miktar * k.adet);
    for (const [id, miktar] of dusus) {
      const mz = api.bul("malzemeler", id);
      if (mz) api.guncelle("malzemeler", id, { stok: Math.max(0, Math.round((mz.stok - miktar) * 100) / 100) });
    }
    api.ekle("kapananlar", { id: api.yeniId("a"), masa: m.ad, t: s, tutar: toplam, kisi: a.kisi, odeme });
    api.guncelle("masalar", m.id, { adisyon: null });
    api.haber(`Masa ${m.ad} kapandı, ${tl(toplam)} ${odeme.toLocaleLowerCase("tr")}. Malzemeler stoktan düştü.`, "basari");
    api.olay("hesap");
    kapat();
  };

  return (
    <>
      <header className="flex items-start justify-between gap-3 border-b border-[var(--k)] px-5 py-4">
        <div>
          <h3 className="text-[17px] font-bold">Masa {m.ad}</h3>
          <p className="mt-0.5 text-[12.5px] text-[var(--ms)]">
            {m.bolum}, {a.kisi} kişi, {oturma(s - a.acilis)}, garson {a.garson}
          </p>
          <div className="mt-2">
            <DurumYazi d={masaDurumu(m, api)} />
          </div>
        </div>
        <button type="button" onClick={kapat} aria-label="Kapat" className="flex h-8 w-8 items-center justify-center rounded-lg text-[var(--ms)] hover:bg-[var(--k2)]">
          <IconX size={18} />
        </button>
      </header>
      <div className="min-h-0 flex-1 overflow-y-auto">
        <Bolum baslik="Adisyon" sag={<span className="text-[13px] font-bold tabular-nums">{tl(toplam)}</span>}>
          {a.kalemler.length ? (
            <ul className="space-y-1.5">
              {a.kalemler.map((k: Kayit) => (
                <li key={k.id} className="flex items-center justify-between gap-3 text-[12.5px]">
                  <span className="min-w-0 truncate">
                    {k.adet} adet {yemekAdi(api, k.menuId)}
                  </span>
                  <span className="flex shrink-0 items-center gap-3">
                    <span className="text-[11.5px]" style={{ color: k.durum === "mutfakta" ? RENK.sari : k.durum === "hazir" ? RENK.mor : RENK.gri }}>
                      {k.durum === "mutfakta" ? `Mutfakta, ${Math.max(0, Math.floor((s - k.t) / DAKIKA))} dakika` : k.durum === "hazir" ? "Hazır, servis bekliyor" : "Servis edildi"}
                    </span>
                    <span className="w-16 text-right tabular-nums">{tl(k.adet * (api.bul("menu", k.menuId)?.fiyat ?? 0))}</span>
                  </span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-[12.5px] text-[var(--ms)]">Henüz sipariş yok. Aşağıdan ürün ekleyin.</p>
          )}
        </Bolum>
        <Bolum baslik="Ürün ekle">
          <div className="-mx-1 mb-3 flex gap-1 overflow-x-auto pb-1">
            {KATEGORILER.map((k) => (
              <button key={k} type="button" aria-pressed={kategori === k} onClick={() => setKategori(k)} className={`h-8 shrink-0 rounded-lg px-3 text-[12px] font-medium ${kategori === k ? "bg-[var(--p)] text-white" : "text-[var(--ms)] hover:bg-[var(--k2)]"}`}>
                {k}
              </button>
            ))}
          </div>
          <ul className="grid grid-cols-2 gap-2">
            {api.veri.menu
              .filter((y) => y.kategori === kategori && y.aktif)
              .map((y) => {
                const n = sepet[y.id] ?? 0;
                return (
                  <li key={y.id} className={`flex items-center gap-2 rounded-lg border p-2 ${n ? "border-[var(--p)]" : "border-[var(--k)]"}`}>
                    <button type="button" onClick={() => setSepet((x) => ({ ...x, [y.id]: n + 1 }))} className="min-w-0 flex-1 text-left">
                      <span className="block truncate text-[12px] font-medium">{y.ad}</span>
                      <span className="block text-[11px] tabular-nums text-[var(--ms)]">{tl(y.fiyat)}</span>
                    </button>
                    {n > 0 && (
                      <span className="flex items-center gap-1">
                        <button type="button" aria-label="Azalt" onClick={() => setSepet((x) => ({ ...x, [y.id]: n - 1 }))} className="flex h-6 w-6 items-center justify-center rounded text-[var(--ms)] hover:bg-[var(--k2)]">
                          <IconMinus size={13} />
                        </button>
                        <span className="w-4 text-center text-[12px] font-semibold tabular-nums">{n}</span>
                      </span>
                    )}
                  </li>
                );
              })}
          </ul>
          {sepetSatirlari.length > 0 && (
            <Dugme
              tur="ana"
              ikon={IconPlus}
              className="mt-3 w-full"
              onClick={() => {
                const yeni = sepetSatirlari.map(([menuId, adet]) => ({ id: api.yeniId("k"), menuId, adet, t: s, durum: "mutfakta" }));
                api.guncelle("masalar", m.id, { adisyon: { ...a, kalemler: [...a.kalemler, ...yeni], hesap: false } });
                setSepet({});
                api.haber(`${yeni.reduce((t, k) => t + k.adet, 0)} ürün mutfak ekranına düştü`, "basari");
                api.olay("siparis-gir");
              }}
            >
              Mutfağa gönder, {tl(sepetSatirlari.reduce((t, [id, n]) => t + n * (api.bul("menu", id)?.fiyat ?? 0), 0))}
            </Dugme>
          )}
        </Bolum>
      </div>
      {a.kalemler.length > 0 && (
        <footer className="space-y-2 border-t border-[var(--k)] px-5 py-3">
          <p className="text-[11.5px] text-[var(--ms)]">Hesabı kapat, {tl(toplam)}</p>
          <div className="flex flex-wrap gap-2">
            <Dugme tur="ana" ikon={IconCreditCard} onClick={() => kapatHesap("Kart")}>
              Kart
            </Dugme>
            <Dugme ikon={IconCash} onClick={() => kapatHesap("Nakit")}>
              Nakit
            </Dugme>
            <Dugme ikon={IconReceipt} onClick={() => kapatHesap("Yemek kartı")}>
              Yemek kartı
            </Dugme>
          </div>
        </footer>
      )}
    </>
  );
}

function Salon({ api, modul }: { api: PanelApi; modul: ModulBilgi }) {
  const [secili, setSecili] = useState<string | null>(null);
  const s = api.ani.getTime();
  const m = secili ? api.bul("masalar", secili) : null;
  const dolu = api.veri.masalar.filter((x) => x.adisyon);
  return (
    <>
      <EkranBasligi modul={modul}>
        <span className="text-[12.5px] text-[var(--ms)]">
          {dolu.length} masa dolu, {dolu.reduce((t, x) => t + x.adisyon.kisi, 0)} kişi
        </span>
      </EkranBasligi>
      <div className="mb-3 flex flex-wrap gap-x-4 gap-y-1 text-[11.5px] text-[var(--ms)]">
        {[
          ["Boş", "var(--k2)"],
          ["Dolu", "var(--p)"],
          ["Hesap istedi", "var(--sari)"],
          ["Yemek gecikiyor", "var(--kirmizi)"],
        ].map(([ad, renk]) => (
          <span key={ad} className="inline-flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-[2px]" style={{ background: renk }} />
            {ad}
          </span>
        ))}
      </div>
      <div className="space-y-4">
        {BOLUMLER.map((b) => (
          <Kart key={b.ad} baslik={b.ad} sag={<span className="text-[12px] text-[var(--ms)]">{api.veri.masalar.filter((x) => x.bolum === b.ad && x.adisyon).length} dolu</span>}>
            <div className="grid grid-cols-2 gap-2 p-3 @lg:grid-cols-3 @3xl:grid-cols-4 @5xl:grid-cols-6">
              {api.veri.masalar
                .filter((x) => x.bolum === b.ad)
                .map((x) => {
                  const d = masaDurumu(x, api);
                  const mutfakta = x.adisyon?.kalemler.filter((k: Kayit) => k.durum === "mutfakta").length ?? 0;
                  return (
                    <button
                      key={x.id}
                      type="button"
                      onClick={() => setSecili(x.id)}
                      className="rounded-xl border p-3 text-left transition-colors hover:bg-[var(--k2)]"
                      style={{ borderColor: x.adisyon ? RENK[d.renk] : "var(--k)", background: x.adisyon ? `color-mix(in srgb, ${RENK[d.renk]} 9%, transparent)` : undefined }}
                    >
                      <span className="flex items-baseline justify-between gap-2">
                        <span className="text-[16px] font-bold">{x.ad}</span>
                        <span className="text-[11px] text-[var(--ms)]">{x.adisyon ? `${x.adisyon.kisi} kişi` : `${x.kapasite} kişilik`}</span>
                      </span>
                      {x.adisyon ? (
                        <>
                          <span className="mt-2 block text-[13px] font-semibold tabular-nums">{tl(adisyonToplam(x.adisyon, api))}</span>
                          <span className="block text-[11px] text-[var(--ms)]">
                            {Math.floor((s - x.adisyon.acilis) / DAKIKA)} dakika{mutfakta ? `, ${mutfakta} ürün mutfakta` : ""}
                          </span>
                          {d.ad !== "Dolu" && <span className="mt-1 block text-[11px] font-semibold" style={{ color: RENK[d.renk] }}>{d.ad}</span>}
                        </>
                      ) : (
                        <span className="mt-2 block text-[12px] text-[var(--ms)]">Boş, açmak için dokunun</span>
                      )}
                    </button>
                  );
                })}
            </div>
          </Kart>
        ))}
      </div>
      <Cekmece acik={!!m} kapat={() => setSecili(null)}>
        {m && <Adisyon key={m.id + (m.adisyon ? "dolu" : "bos")} m={m} api={api} kapat={() => setSecili(null)} />}
      </Cekmece>
    </>
  );
}

function Mutfak({ api, modul }: { api: PanelApi; modul: ModulBilgi }) {
  const s = api.ani.getTime();
  const liste = fisler(api);
  const hazirla = (f: (typeof liste)[number]) => {
    if (f.masaId) {
      const m = api.bul("masalar", f.masaId)!;
      const ids = new Set(f.kalemler.map((k) => k.id));
      api.guncelle("masalar", m.id, { adisyon: { ...m.adisyon, kalemler: m.adisyon.kalemler.map((k: Kayit) => (ids.has(k.id) ? { ...k, durum: "hazir" } : k)) } });
      api.haber(`Masa ${m.ad} hazır, garson ${m.adisyon.garson} bilgilendirildi`, "basari");
    } else if (f.paketId) {
      api.guncelle("paketler", f.paketId, { durum: "hazir" }, "Mutfakta hazırlandı, kurye bekliyor");
      api.haber("Paket hazır, kuryeye bildirildi", "basari");
    }
    api.olay("mutfak-hazir");
  };
  return (
    <>
      <EkranBasligi modul={modul}>
        <span className="text-[12.5px] text-[var(--ms)]">
          {liste.length} fiş bekliyor, ana yemekte ortalama hazırlanma {Math.round(api.veri.menu.filter((y) => y.kategori === "Ana yemek").reduce((t, y) => t + y.hazirlik, 0) / Math.max(1, api.veri.menu.filter((y) => y.kategori === "Ana yemek").length))} dakika
        </span>
      </EkranBasligi>
      {liste.length === 0 ? (
        <Kart className="p-8 text-center text-[13px] text-[var(--ms)]">Mutfakta bekleyen fiş yok.</Kart>
      ) : (
        <div className="grid grid-cols-1 gap-3 @xl:grid-cols-2 @4xl:grid-cols-3 @6xl:grid-cols-4">
          {liste.map((f) => {
            const dk = Math.max(0, Math.floor((s - f.t) / DAKIKA));
            const renk = dk >= 15 ? "var(--kirmizi)" : dk >= 10 ? "var(--sari)" : "var(--yesil)";
            return (
              <article key={f.anahtar} className="flex flex-col overflow-hidden rounded-xl border bg-[var(--kart)]" style={{ borderColor: renk }}>
                <header className="flex items-start justify-between gap-2 px-3.5 py-2.5" style={{ background: `color-mix(in srgb, ${renk} 14%, transparent)` }}>
                  <span>
                    <span className="block text-[14px] font-bold">{f.kaynak}</span>
                    <span className="block text-[11px] text-[var(--ms)]">{f.alt}</span>
                  </span>
                  <span className="text-right">
                    <span className="block text-[18px] font-bold tabular-nums" style={{ color: renk }}>
                      {dk}
                    </span>
                    <span className="block text-[10.5px] text-[var(--ms)]">dakika</span>
                  </span>
                </header>
                <ul className="flex-1 space-y-1 px-3.5 py-2.5">
                  {f.kalemler.map((k) => (
                    <li key={k.id} className="text-[13px]">
                      <strong className="tabular-nums">{k.adet}</strong> {yemekAdi(api, k.menuId)}
                    </li>
                  ))}
                </ul>
                <div className="border-t border-[var(--k)] p-2">
                  <Dugme tur="ana" ikon={IconCheck} className="w-full" onClick={() => hazirla(f)}>
                    Hazır
                  </Dugme>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </>
  );
}

function FiyatAlani({ deger, birim, kaydet }: { deger: number; birim: string; kaydet: (n: number) => void }) {
  const [m, setM] = useState(sayi(deger, deger % 1 ? 2 : 0));
  const n = Number(m.replace(/\./g, "").replace(",", "."));
  return (
    <div className="flex gap-2">
      <label className="relative flex-1">
        <span className="sr-only">Fiyat</span>
        <input value={m} inputMode="decimal" onChange={(e) => setM(e.target.value)} className="h-9 w-full rounded-lg border border-[var(--k)] bg-transparent pl-3 pr-16 text-[13px] tabular-nums outline-none focus:border-[var(--p)] focus-visible:outline-none" />
        <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-[12px] text-[var(--ms)]">{birim}</span>
      </label>
      <Dugme tur="ana" disabled={!(n > 0) || n === deger} onClick={() => kaydet(n)}>
        Kaydet
      </Dugme>
    </div>
  );
}

/* ---------------- Ekranlar ---------------- */

function uyarilar(api: PanelApi) {
  const liste: ReturnType<SektorPanel["uyarilar"]> = [];
  const s = api.ani.getTime();
  const hesap = api.veri.masalar.filter((m) => m.adisyon?.hesap).length;
  const geciken = fisler(api).filter((f) => s - f.t > 15 * DAKIKA).length;
  const paketGec = api.veri.paketler.filter((p) => ["yeni", "mutfakta", "hazir", "yolda"].includes(p.durum) && p.soz < s).length;
  const kritik = api.veri.malzemeler.filter((m) => m.stok < m.kritik).length;
  const pahali = api.veri.menu.filter((y) => maliyetOrani(y, api) > 35).length;
  if (hesap) liste.push({ metin: `${hesap} masa hesap istedi`, modul: "salon", renk: "sari" });
  if (geciken) liste.push({ metin: `${geciken} fiş 15 dakikadan uzun süredir mutfakta`, modul: "mutfak", renk: "kirmizi" });
  if (paketGec) liste.push({ metin: `${paketGec} paket söz verilen saati geçti`, modul: "paket", filtre: "Durum=Gecikenler", renk: "kirmizi" });
  if (kritik) liste.push({ metin: `${kritik} malzeme kritik seviyenin altında`, modul: "stok", filtre: "Stok=Kritik", renk: "sari" });
  if (pahali) liste.push({ metin: `${pahali} yemeğin maliyet oranı yüzde 35 üstünde`, modul: "menu", filtre: "Maliyet=Yüzde 35 üstü", renk: "mor" });
  return liste;
}

const ozet = ozetEkrani({
  kullanici: KULLANICI.ad,
  uyarilar,
  karsilama: (api) => {
    const dolu = api.veri.masalar.filter((m) => m.adisyon);
    return `Salonda ${dolu.reduce((t, m) => t + m.adisyon.kisi, 0)} kişi oturuyor, mutfakta ${fisler(api).length} fiş bekliyor.`;
  },
  sayilar: (api) => {
    const s = api.ani.getTime();
    const dolu = api.veri.masalar.filter((m) => m.adisyon);
    const ay = api.veri.gunluk.filter((g) => g.id !== "d0");
    const f = fisler(api);
    return [
      {
        ad: "Dolu masa",
        deger: `${dolu.length}`,
        birim: `masa, ${api.veri.masalar.length} masadan`,
        alt: `${dolu.reduce((t, m) => t + m.adisyon.kisi, 0)} kişi oturuyor`,
        not: "Adisyonu açık olan masalar. Kişi sayısı masa açılırken girilir.",
        git: () => api.git("salon"),
      },
      {
        ad: "Bugünün cirosu",
        deger: tlKisa(api.veri.kapananlar.reduce((t, a) => t + (a.t >= gunBasi(s) ? a.tutar : 0), 0) + dolu.reduce((t, m) => t + adisyonToplam(m.adisyon, api), 0)),
        alt: `Açık masalardaki ${tlKisa(dolu.reduce((t, m) => t + adisyonToplam(m.adisyon, api), 0))} dahil`,
        not: "Bugün kapanan adisyonlar ile şu an açık masaların tutarı. Paket siparişler paket servis ekranında ayrıca izlenir.",
        seri: api.veri.gunluk.slice(-15, -1).map((g) => g.ciro),
      },
      {
        ad: "Ortalama adisyon, 30 gün",
        deger: tl(ay.reduce((t, g) => t + g.ciro, 0) / Math.max(1, ay.reduce((t, g) => t + g.adisyon, 0))),
        alt: `Kişi başı ${tl(ay.reduce((t, g) => t + g.ciro, 0) / Math.max(1, ay.reduce((t, g) => t + g.kisi, 0)))}`,
        not: "Son 30 günün cirosu, kapanan adisyon sayısına bölünür.",
      },
      {
        ad: "Mutfakta bekleyen",
        deger: String(f.length),
        birim: "fiş",
        renk: f.some((x) => s - x.t > 15 * DAKIKA) ? "kirmizi" : undefined,
        alt: f.length ? `En eskisi ${Math.floor((s - f[0].t) / DAKIKA)} dakikadır bekliyor` : "Mutfak boş",
        not: "Açık masalarda ve paketlerde henüz hazırlanmamış siparişler. On beş dakikayı geçen fiş kırmızıyla gösterilir.",
        git: () => api.git("mutfak"),
      },
    ];
  },
  ana: {
    baslik: "Günlük ciro, son 14 gün",
    icerik: (api) => {
      const veri = api.veri.gunluk.slice(-15).map((g, i, l) => {
        const d = new Date(g.gun);
        const son = i === l.length - 1;
        const bugunCiro = son ? api.veri.kapananlar.filter((a) => a.t >= g.gun).reduce((t, a) => t + a.tutar, 0) : g.ciro;
        return { etiket: son ? "Bugün" : `${d.getDate()}`, uzunEtiket: son ? `Bugün, saat ${saat(api.ani)} itibarıyla, kapanan adisyonlar` : `${tarih(g.gun)} ${GUN_KISA[d.getDay()]}, ${g.adisyon} adisyon`, deger: bugunCiro, kismi: son };
      });
      return <CubukGrafik veri={veri} bicim={tl} ozet="Cuma ve cumartesi akşamları en yoğun günler" />;
    },
  },
  parcalar: [
    {
      baslik: "En çok satanlar, 30 gün",
      icerik: (api) => {
        const liste = api.veri.menu.filter((y) => y.kategori !== "İçecek").sort((a, b) => b.satis30 - a.satis30).slice(0, 6);
        const enCok = liste[0]?.satis30 ?? 1;
        return (
          <ul className="space-y-3">
            {liste.map((y) => (
              <li key={y.id}>
                <button type="button" onClick={() => api.git("menu", { kayit: y.id })} className="block w-full text-left">
                  <span className="mb-1 flex justify-between gap-3 text-[12.5px]">
                    <span className="truncate">{y.ad}</span>
                    <span className="shrink-0 tabular-nums text-[var(--ms)]">{sayi(y.satis30)} porsiyon</span>
                  </span>
                  <Cubuk oran={y.satis30 / enCok} />
                </button>
              </li>
            ))}
          </ul>
        );
      },
    },
    {
      baslik: "Paket servis, şu an",
      icerik: (api) => {
        const durumlar = ["yeni", "mutfakta", "hazir", "yolda"];
        return (
          <ul className="space-y-2.5">
            {durumlar.map((d) => {
              const n = api.veri.paketler.filter((p) => p.durum === d).length;
              return (
                <li key={d}>
                  <button type="button" onClick={() => api.git("paket")} className="flex w-full items-center justify-between gap-3 text-left text-[13px]">
                    <DurumYazi d={PAKET_DURUMU[d]} />
                    <span className="font-semibold tabular-nums">{n}</span>
                  </button>
                </li>
              );
            })}
          </ul>
        );
      },
    },
  ],
});

const panel: SektorPanel = {
  saat: { acilis: 12, kapanis: 23, yogun: 20 },
  kullanici: KULLANICI,
  uret,
  uyarilar,
  moduller: [
    { id: "ozet", grup: "Genel", ekran: ozet },
    { id: "salon", grup: "Servis", rozet: (api) => api.veri.masalar.filter((m) => m.adisyon?.hesap).length, ekran: { tur: "ozel", bilesen: Salon } },
    { id: "mutfak", grup: "Servis", rozet: (api) => fisler(api).length, ekran: { tur: "ozel", bilesen: Mutfak } },
    {
      id: "paket",
      grup: "Servis",
      rozet: (api) => api.veri.paketler.filter((p) => p.durum === "hazir").length,
      ekran: {
        tur: "liste",
        koleksiyon: "paketler",
        baslikAdi: "Paket",
        baslik: (p) => `Paket ${p.id.slice(1)}, ${p.musteri}`,
        alt: (p) => `${p.kanal}, ${p.semt}`,
        harf: (p) => p.musteri,
        durum: (p, api) => (["yeni", "mutfakta", "hazir", "yolda"].includes(p.durum) && p.soz < api.ani.getTime() ? { ad: `${PAKET_DURUMU[p.durum].ad}, gecikti`, renk: "kirmizi" } : PAKET_DURUMU[p.durum]),
        arama: (p) => `${p.telefon} ${p.semt} ${p.kanal}`,
        sira: (a, b) => {
          const acik = (p: Kayit) => (["teslim", "iptal"].includes(p.durum) ? 1 : 0);
          return acik(a) - acik(b) || a.soz - b.soz;
        },
        sutunlar: [
          { ad: "Sipariş", deger: (p, api) => zaman(p.t, api.ani), sirala: (p) => p.t, oncelik: 2 },
          { ad: "Söz verilen", deger: (p) => saat(p.soz), sirala: (p) => p.soz, oncelik: 1 },
          { ad: "Kurye", deger: (p) => p.kurye || "Yok", oncelik: 3 },
          { ad: "Tutar", deger: (p, api) => tl(paketToplam(p, api)), csv: (p, api) => paketToplam(p, api), hiza: "sag", oncelik: 1 },
        ],
        filtreler: [
          {
            ad: "Durum",
            secenekler: [
              { ad: "Açık siparişler", kosul: (p) => ["yeni", "mutfakta", "hazir", "yolda"].includes(p.durum) },
              { ad: "Kurye bekleyen", kosul: (p) => p.durum === "hazir" },
              { ad: "Gecikenler", kosul: (p, api) => ["yeni", "mutfakta", "hazir", "yolda"].includes(p.durum) && p.soz < api.ani.getTime() },
              { ad: "Teslim edildi", kosul: (p) => p.durum === "teslim" },
            ],
          },
          { ad: "Kanal", secenekler: KANALLAR.map((k) => ({ ad: k, kosul: (p: Kayit) => p.kanal === k })) },
        ],
        ozet: (api) => {
          const l = api.veri.paketler;
          return [
            { ad: "Mutfakta", deger: String(l.filter((p) => ["yeni", "mutfakta"].includes(p.durum)).length), renk: "sari" },
            { ad: "Kurye bekliyor", deger: String(l.filter((p) => p.durum === "hazir").length), renk: "mor" },
            { ad: "Yolda", deger: String(l.filter((p) => p.durum === "yolda").length) },
            { ad: "Son üç saatin tutarı", deger: tlKisa(l.filter((p) => p.durum !== "iptal").reduce((t, p) => t + paketToplam(p, api), 0)) },
          ];
        },
        detay: {
          bolumler: (p, api) => (
            <>
              <Bolum baslik="Sipariş">
                <AlanListesi alanlar={[["Kanal", p.kanal], ["Müşteri", p.musteri], ["Telefon", p.telefon], ["Semt", p.semt], ["Sipariş", zaman(p.t, api.ani)], ["Söz verilen", saat(p.soz)]]} />
              </Bolum>
              <Bolum baslik="Ürünler">
                <MiniTablo
                  basliklar={["Ürün", "Adet", "Tutar"]}
                  sagdakiler={[1, 2]}
                  satirlar={[...p.kalemler.map((k: Kayit) => [yemekAdi(api, k.menuId), k.adet, tl(k.adet * (api.bul("menu", k.menuId)?.fiyat ?? 0))]), [<strong>Toplam</strong>, "", <strong>{tl(paketToplam(p, api))}</strong>]]}
                />
              </Bolum>
              <Bolum baslik="Geçmiş">
                <Gecmis satirlar={p.gecmis.map((g: Kayit) => ({ zaman: zaman(g.t, api.ani), metin: g.m }))} />
              </Bolum>
            </>
          ),
          eylemler: [
            {
              ad: "Kuryeye ver",
              tur: "ana",
              ikon: IconMoped,
              gorunur: (p) => p.durum === "hazir",
              uygula: (p, api) => {
                const kurye = ["Mert", "Yusuf", "Ali"][Math.floor(Math.random() * 3)];
                api.guncelle("paketler", p.id, { durum: "yolda", kurye }, `Kurye ${kurye} yola çıktı`);
                api.haber(`Paket yolda. Müşteriye kurye bilgisi WhatsApp ile gitti.`, "basari");
                api.olay("paket-yolda");
              },
            },
            {
              ad: "Teslim edildi",
              ikon: IconCheck,
              gorunur: (p) => p.durum === "yolda",
              uygula: (p, api) => {
                api.guncelle("paketler", p.id, { durum: "teslim" }, "Teslim edildi");
                api.haber("Paket teslim edildi", "basari");
              },
            },
          ],
        },
      },
    },
    {
      id: "menu",
      grup: "Mutfak",
      ekran: {
        tur: "liste",
        koleksiyon: "menu",
        baslikAdi: "Ürün",
        baslik: (y) => y.ad,
        alt: (y) => y.kategori,
        durum: (y, api) => (!y.aktif ? { ad: "Menüde değil", renk: "gri" } : maliyetOrani(y, api) > 35 ? { ad: "Maliyet yüksek", renk: "kirmizi" } : maliyetOrani(y, api) > 28 ? { ad: "Sınırda", renk: "sari" } : { ad: "Sağlıklı", renk: "yesil" }),
        arama: (y) => y.kategori,
        sutunlar: [
          { ad: "Fiyat", deger: (y) => tl(y.fiyat), sirala: (y) => y.fiyat, csv: (y) => y.fiyat, hiza: "sag", oncelik: 1 },
          { ad: "Maliyet", deger: (y, api) => tl(maliyet(y, api)), csv: (y, api) => Math.round(maliyet(y, api)), hiza: "sag", oncelik: 2 },
          {
            ad: "Maliyet oranı",
            deger: (y, api) => {
              const o = maliyetOrani(y, api);
              return <span style={{ color: o > 35 ? RENK.kirmizi : o > 28 ? RENK.sari : undefined }}>{yuzde(o, 1)}</span>;
            },
            csv: (y, api) => Math.round(maliyetOrani(y, api) * 10) / 10,
            hiza: "sag",
            oncelik: 1,
          },
          { ad: "Satış, 30 gün", deger: (y) => `${sayi(y.satis30)} porsiyon`, sirala: (y) => y.satis30, hiza: "sag", oncelik: 3 },
        ],
        filtreler: [
          { ad: "Kategori", secenekler: KATEGORILER.map((k) => ({ ad: k, kosul: (y: Kayit) => y.kategori === k })) },
          { ad: "Maliyet", secenekler: [{ ad: "Yüzde 35 üstü", kosul: (y, api) => maliyetOrani(y, api) > 35 }, { ad: "Yüzde 28 ile 35 arası", kosul: (y, api) => maliyetOrani(y, api) > 28 && maliyetOrani(y, api) <= 35 }] },
        ],
        detay: {
          bolumler: (y, api) => (
            <>
              <Bolum baslik="Reçete, bir porsiyon">
                <MiniTablo
                  basliklar={["Malzeme", "Miktar", "Tutar"]}
                  sagdakiler={[1, 2]}
                  satirlar={[
                    ...y.recete.map(([id, miktar]: [string, number]) => {
                      const mz = api.bul("malzemeler", id)!;
                      return [mz.ad, `${sayi(miktar, miktar < 1 ? 3 : 0)} ${mz.birim}`, tl(mz.fiyat * miktar)];
                    }),
                    [<strong>Maliyet</strong>, "", <strong>{tl(maliyet(y, api))}</strong>],
                  ]}
                />
                <p className="mt-3 text-[12px] leading-5 text-[var(--ms)]">
                  Maliyet oranı, maliyetin KDV hariç satış fiyatına bölümüdür. Restoranlarda yüzde 28 ile 35 arası olağan kabul edilir. Şu an {yuzde(maliyetOrani(y, api), 1)}.
                </p>
              </Bolum>
              <Bolum baslik="Satış fiyatı">
                <FiyatAlani
                  key={y.fiyat}
                  deger={y.fiyat}
                  birim="TL"
                  kaydet={(n) => {
                    api.guncelle("menu", y.id, { fiyat: n }, `Fiyat ${tl(y.fiyat)} yerine ${tl(n)} oldu`);
                    api.haber(`Yeni fiyatla maliyet oranı ${yuzde(maliyetOrani({ ...y, fiyat: n }, api), 1)}. QR menü güncellendi.`, "basari");
                    api.olay("menu-fiyat");
                  }}
                />
              </Bolum>
              <Bolum baslik="Menüde">
                <div className="flex items-center justify-between gap-3 text-[13px]">
                  <span>QR menüde ve garson ekranında görünsün</span>
                  <Anahtar acik={y.aktif} ad="Menüde görünsün" degistir={() => api.guncelle("menu", y.id, { aktif: !y.aktif }, y.aktif ? "Menüden kaldırıldı" : "Menüye eklendi")} />
                </div>
              </Bolum>
              <Bolum baslik="Geçmiş">
                <Gecmis satirlar={y.gecmis.map((g: Kayit) => ({ zaman: zaman(g.t, api.ani), metin: g.m }))} />
              </Bolum>
            </>
          ),
        },
      },
    },
    {
      id: "stok",
      grup: "Mutfak",
      rozet: (api) => api.veri.malzemeler.filter((m) => m.stok < m.kritik).length,
      ekran: {
        tur: "liste",
        koleksiyon: "malzemeler",
        baslikAdi: "Malzeme",
        baslik: (m) => m.ad,
        alt: (m) => m.tedarikci,
        durum: (m) => (m.stok < m.kritik ? { ad: "Kritik", renk: "kirmizi" } : m.stok < m.kritik * 1.5 ? { ad: "Azalıyor", renk: "sari" } : { ad: "Yeterli", renk: "yesil" }),
        arama: (m) => m.tedarikci,
        sira: (a, b) => a.stok / a.kritik - b.stok / b.kritik,
        sutunlar: [
          { ad: "Stok", deger: (m) => `${sayi(m.stok, m.stok % 1 ? 1 : 0)} ${m.birim}`, sirala: (m) => m.stok / m.kritik, csv: (m) => m.stok, hiza: "sag", oncelik: 1 },
          { ad: "Kritik seviye", deger: (m) => `${m.kritik} ${m.birim}`, hiza: "sag", oncelik: 3 },
          { ad: "Alış fiyatı", deger: (m) => `${tl(m.fiyat)}, ${m.birim} başına`, sirala: (m) => m.fiyat, csv: (m) => m.fiyat, hiza: "sag", oncelik: 2 },
        ],
        filtreler: [{ ad: "Stok", secenekler: [{ ad: "Kritik", kosul: (m) => m.stok < m.kritik }, { ad: "Azalıyor", kosul: (m) => m.stok >= m.kritik && m.stok < m.kritik * 1.5 }] }],
        detay: {
          bolumler: (m, api) => {
            const kullanan = api.veri.menu.filter((y) => y.recete.some(([id]: [string, number]) => id === m.id));
            return (
              <>
                <Bolum baslik="Stok">
                  <AlanListesi alanlar={[["Mevcut", `${sayi(m.stok, 1)} ${m.birim}`], ["Kritik seviye", `${m.kritik} ${m.birim}`], ["Tedarikçi", m.tedarikci]]} />
                </Bolum>
                <Bolum baslik={`Alış fiyatı, ${m.birim} başına`}>
                  <FiyatAlani
                    key={m.fiyat}
                    deger={m.fiyat}
                    birim="TL"
                    kaydet={(n) => {
                      // Her yemeğin maliyet oranı, bu malzemenin reçetedeki miktarı kadar puan değişir.
                      const etki = kullanan
                        .map((y) => ({ y, fark: ((y.recete.find(([id]: [string, number]) => id === m.id)![1] * (n - m.fiyat)) / (y.fiyat / 1.1)) * 100 }))
                        .sort((a, b) => Math.abs(b.fark) - Math.abs(a.fark))[0];
                      api.guncelle("malzemeler", m.id, { fiyat: n }, `Alış fiyatı ${tl(m.fiyat)} yerine ${tl(n)} oldu`);
                      api.haber(etki ? `${kullanan.length} yemeğin maliyeti yenilendi. En çok etkilenen ${etki.y.ad}, oranı ${sayi(Math.abs(etki.fark), 1)} puan ${etki.fark > 0 ? "arttı" : "azaldı"}.` : "Fiyat güncellendi", "basari");
                      api.olay("maliyet");
                    }}
                  />
                </Bolum>
                <Bolum baslik={`Kullanan yemekler, ${kullanan.length}`}>
                  <ul className="space-y-1.5">
                    {kullanan.map((y) => (
                      <li key={y.id}>
                        <button type="button" onClick={() => api.git("menu", { kayit: y.id })} className="flex w-full justify-between gap-3 text-left text-[12.5px] hover:text-[var(--p)]">
                          <span>{y.ad}</span>
                          <span className="tabular-nums" style={{ color: maliyetOrani(y, api) > 35 ? RENK.kirmizi : undefined }}>
                            {yuzde(maliyetOrani(y, api), 1)}
                          </span>
                        </button>
                      </li>
                    ))}
                  </ul>
                </Bolum>
                <Bolum baslik="Geçmiş">
                  <Gecmis satirlar={m.gecmis.map((g: Kayit) => ({ zaman: zaman(g.t, api.ani), metin: g.m }))} />
                </Bolum>
              </>
            );
          },
          eylemler: [
            {
              ad: "Tedarikçiye sipariş ver",
              tur: "ana",
              gorunur: (m) => m.stok < m.kritik * 1.5,
              uygula: (m, api) => {
                const miktar = Math.ceil(m.kritik * 3);
                api.guncelle("malzemeler", m.id, {}, `${m.tedarikci} için ${miktar} ${m.birim} sipariş verildi`);
                api.haber(`${m.tedarikci} siparişi WhatsApp ile gönderildi, ${miktar} ${m.birim}`, "basari");
                api.olay("tedarik");
              },
            },
            {
              ad: "Mal girişi yap",
              uygula: (m, api) => {
                const miktar = Math.ceil(m.kritik * 3);
                api.guncelle("malzemeler", m.id, { stok: Math.round((m.stok + miktar) * 10) / 10 }, `${miktar} ${m.birim} giriş yapıldı`);
                api.haber(`${m.ad} stoğu ${sayi(m.stok + miktar, 1)} ${m.birim} oldu`, "basari");
              },
            },
          ],
        },
      },
    },
  ],
  arama: [
    { koleksiyon: "menu", modul: "menu", baslik: (y) => y.ad, alt: (y) => `${y.kategori}, ${tl(y.fiyat)}`, metin: (y) => y.kategori },
    { koleksiyon: "paketler", modul: "paket", baslik: (p) => `Paket ${p.id.slice(1)}, ${p.musteri}`, alt: (p) => `${p.kanal}, ${p.semt}`, metin: (p) => p.telefon },
    { koleksiyon: "malzemeler", modul: "stok", baslik: (m) => m.ad, alt: (m) => m.tedarikci, metin: (m) => m.birim },
  ],
  gorevler: [
    { id: "g1", metin: "Bir masaya sipariş girin", ipucu: "Salon ekranında bir masaya dokunun; boşsa açın, sonra ürün ekleyip mutfağa gönderin.", modul: "salon", olay: "siparis-gir" },
    { id: "g2", metin: "Mutfakta bir fişi hazır işaretleyin", ipucu: "Mutfak ekranında en eski fişin Hazır düğmesine basın.", modul: "mutfak", olay: "mutfak-hazir" },
    { id: "g3", metin: "Bir masanın hesabını kapatın", ipucu: "Sarı, hesap isteyen bir masayı açıp ödeme türünü seçin.", modul: "salon", olay: "hesap" },
    { id: "g4", metin: "Bir malzemenin fiyatını değiştirin", ipucu: "Malzeme stoğunda domatesi açın, yeni alış fiyatı girin.", modul: "stok", olay: "maliyet" },
    { id: "g5", metin: "Hazır bir paketi kuryeye verin", ipucu: "Paket servis ekranında durumu Kurye bekliyor olan bir siparişi açın.", modul: "paket", olay: "paket-yolda" },
  ],
  canli: {
    aralik: 24_000,
    uret: (api, r) => {
      const s = api.ani.getTime();
      if (r.olasilik(0.5)) {
        const kalemler = Array.from({ length: r.tam(1, 3) }, (_, j) => ({ id: api.yeniId(`pk${j}`), menuId: r.sec(api.veri.menu.filter((y) => ["Ana yemek", "Başlangıç", "Tatlı"].includes(y.kategori))).id, adet: r.tam(1, 2), t: s, durum: "mutfakta" }));
        const k = kisiler(r, 1)[0];
        const no = Math.max(...api.veri.paketler.map((p) => Number(p.id.slice(1)))) + 1;
        const kanal = r.sec(KANALLAR);
        api.ekle("paketler", { id: `p${no}`, kanal, musteri: k.tamAd, telefon: k.telefon, semt: r.sec(SEMTLER), kalemler, t: s, soz: s + 40 * DAKIKA, durum: "yeni", kurye: "", gecmis: [{ t: s, m: "Sipariş alındı" }] });
        api.bildir(`Yeni paket, ${kanal}, ${kalemler.length} ürün`, "paket", `p${no}`);
      } else {
        // Dolu bir masa tatlı ya da içecek ister.
        const m = r.sec(api.veri.masalar.filter((x) => x.adisyon && !x.adisyon.hesap));
        if (!m) return;
        const y = r.sec(api.veri.menu.filter((x) => ["Tatlı", "İçecek"].includes(x.kategori)));
        api.guncelle("masalar", m.id, { adisyon: { ...m.adisyon, kalemler: [...m.adisyon.kalemler, { id: api.yeniId("k"), menuId: y.id, adet: r.tam(1, m.adisyon.kisi), t: s, durum: "mutfakta" }] } });
        api.bildir(`Masa ${m.ad}, ${y.ad} siparişi mutfağa düştü`, "mutfak");
      }
    },
  },
};

export default panel;
export { bilgi };
