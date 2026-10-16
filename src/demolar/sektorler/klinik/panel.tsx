/*
 * Klinik demosu: Mavi Diş Polikliniği. Randevular hekim takvimine işlem
 * süresiyle yerleşir, çakışan randevu verilmez. Tedavi planı onaylanınca
 * taksitler oluşur; vadesi geçen taksit kendiliğinden gecikmiş sayılır.
 */
import { useState } from "react";
import { IconArrowRight, IconCheck, IconChevronLeft, IconChevronRight, IconSend, IconUserCheck, IconX } from "@tabler/icons-react";
import { klinik as bilgi } from "./bilgi";
import { ozetEkrani } from "../../panel/Ozet";
import { Cekmece, EkranBasligi } from "../../panel/Liste";
import { AlanListesi, Bolum, Cubuk, Dugme, DurumYazi, Gecmis, MiniTablo, RENK } from "../../panel/parcalar";
import { CubukGrafik, HalkaGrafik } from "../../panel/grafik";
import { DAKIKA, GUN, GUNLER, GUN_KISA, SAAT, gunAdi, gunBasi, iki, kisiler, mesaiAni, saat, sayi, tarih, tarihYil, tl, tlKisa, yuzde, zaman } from "../../ortak";
import type { Durum, Eylem, Kayit, ModulBilgi, PanelApi, Rastgele, SektorPanel, Veri } from "../../tipler";

const KULLANICI = { ad: "Ece Polat", rol: "Klinik koordinatörü" };
const HEKIMLER = [
  { id: "h1", ad: "Dt. Ozan Keskin", alan: "Ortodonti" },
  { id: "h2", ad: "Dt. Selin Acar", alan: "Çocuk diş hekimliği" },
  { id: "h3", ad: "Dt. Barış Güneş", alan: "İmplant ve cerrahi" },
  { id: "h4", ad: "Dt. Nazlı Erdem", alan: "Estetik diş hekimliği" },
];
type Islem = { ad: string; sure: number; fiyat: number; hekim: string[]; agirlik: number };
// Ağırlık, işlemin ne sık yapıldığını belirler; implant ve kaplama muayeneden çok daha seyrek.
const ISLEMLER: Islem[] = [
  { ad: "Muayene", sure: 30, fiyat: 1500, hekim: ["h1", "h2", "h3", "h4"], agirlik: 30 },
  { ad: "Diş taşı temizliği", sure: 30, fiyat: 2500, hekim: ["h2", "h4"], agirlik: 16 },
  { ad: "Kompozit dolgu", sure: 60, fiyat: 4000, hekim: ["h2", "h4"], agirlik: 16 },
  { ad: "Kanal tedavisi", sure: 60, fiyat: 9000, hekim: ["h3", "h4"], agirlik: 8 },
  { ad: "Diş çekimi", sure: 30, fiyat: 3000, hekim: ["h3"], agirlik: 10 },
  { ad: "İmplant", sure: 90, fiyat: 38000, hekim: ["h3"], agirlik: 3 },
  { ad: "Zirkonyum kaplama", sure: 60, fiyat: 14000, hekim: ["h4"], agirlik: 3 },
  { ad: "Diş beyazlatma", sure: 60, fiyat: 9500, hekim: ["h4"], agirlik: 3 },
  { ad: "Ortodonti kontrolü", sure: 30, fiyat: 3000, hekim: ["h1"], agirlik: 30 },
  { ad: "Şeffaf plak ölçüsü", sure: 30, fiyat: 2000, hekim: ["h1"], agirlik: 5 },
  { ad: "Çocuk muayenesi", sure: 30, fiyat: 1200, hekim: ["h2"], agirlik: 16 },
  { ad: "Fissür örtücü", sure: 30, fiyat: 1800, hekim: ["h2"], agirlik: 8 },
];
const islem = (ad: string) => ISLEMLER.find((i) => i.ad === ad) ?? ISLEMLER[0];
const BAS = 9;
const BIT = 19;

/** Pazar günü yalnız iki hekim nöbetçi, cumartesi yarım gün. */
const calisma = (t: number) => {
  const g = new Date(t).getDay();
  return g === 0 ? { bas: 10, bit: 16, hekimler: ["h3", "h4"] } : g === 6 ? { bas: 9, bit: 15, hekimler: HEKIMLER.map((h) => h.id) } : { bas: BAS, bit: BIT, hekimler: HEKIMLER.map((h) => h.id) };
};

const RANDEVU_DURUMU: Record<string, Durum> = {
  bekleniyor: { ad: "Bekleniyor", renk: "mavi" },
  onayli: { ad: "Hasta onayladı", renk: "mavi" },
  geldi: { ad: "Bekleme salonunda", renk: "sari" },
  tedavide: { ad: "Tedavide", renk: "mor" },
  tamam: { ad: "Tamamlandı", renk: "yesil" },
  gelmedi: { ad: "Gelmedi", renk: "kirmizi" },
  iptal: { ad: "İptal", renk: "gri" },
};
const hastaAdi = (api: PanelApi, id: string) => api.bul("hastalar", id)?.ad ?? "Hasta";
const hekimAdi = (id: string) => HEKIMLER.find((h) => h.id === id)?.ad ?? "Hekim";

function taksitDurumu(t: Kayit, api: PanelApi): Durum {
  if (t.odendi) return { ad: "Ödendi", renk: "yesil" };
  if (t.vade < gunBasi(api.ani)) return { ad: `${Math.floor((gunBasi(api.ani) - t.vade) / GUN)} gün gecikti`, renk: "kirmizi" };
  if (t.vade < api.ani.getTime() + 7 * GUN) return { ad: "Bu hafta", renk: "sari" };
  return { ad: "Bekliyor", renk: "gri" };
}
const gecikti = (t: Kayit, api: PanelApi) => !t.odendi && t.vade < gunBasi(api.ani);

const planToplam = (p: Kayit) => p.kalemler.reduce((t: number, k: Kayit) => t + k.fiyat, 0);
const PLAN_DURUMU: Record<string, Durum> = {
  teklif: { ad: "Onay bekliyor", renk: "sari" },
  devam: { ad: "Devam ediyor", renk: "mavi" },
  tamam: { ad: "Tamamlandı", renk: "yesil" },
  red: { ad: "Hasta kabul etmedi", renk: "gri" },
};

/** Hekimin o saatte başka randevusu var mı. */
function cakisiyor(api: PanelApi, hekimId: string, t: number, sure: number, haric?: string) {
  return api.veri.randevular.some((r) => r.id !== haric && r.hekimId === hekimId && r.durum !== "iptal" && r.t < t + sure * DAKIKA && t < r.t + r.sure * DAKIKA);
}

/* ---------------- Veri üretimi ---------------- */

function taksitler(planId: string, hastaId: string, toplam: number, adet: number, ilk: number) {
  return Array.from({ length: adet }, (_, i) => ({ id: `${planId}k${i + 1}`, planId, hastaId, no: i + 1, adet, tutar: Math.round(toplam / adet), vade: gunBasi(ilk) + i * 30 * GUN, odendi: false, gecmis: [] as { t: number; m: string }[] }));
}

function uret(ani: Date, r: Rastgele): Veri {
  const simdi = ani.getTime();
  const kisi = kisiler(r, 380);
  const hastalar: Kayit[] = kisi.map((k, i) => ({
    id: `p${i + 1}`,
    ad: k.tamAd,
    telefon: k.telefon,
    kadin: k.kadin,
    dogum: r.tam(1950, 2019),
    kayit: simdi - r.tam(5, 1400) * GUN,
    kvkk: r.olasilik(0.93),
    kaynak: r.agirlikli([["Tavsiye", 35], ["Google", 30], ["Instagram", 15], ["Online randevu", 12], ["Yoldan geçerken", 8]] as const),
    not: r.agirlikli([["", 70], ["Penisilin alerjisi var", 6], ["Kan sulandırıcı kullanıyor", 6], ["Diş hekimi korkusu var, sakin anlatılmalı", 8], ["Şeker hastası", 5], ["Hamile, röntgen çekilmeyecek", 5]] as const),
    gecmis: [],
  }));
  const cocuklar = hastalar.filter((h) => h.dogum > 2010);
  const yetiskinler = hastalar.filter((h) => h.dogum <= 2010);

  const randevular: Kayit[] = [];
  let no = 0;
  for (let g = -21; g <= 7; g++) {
    const gun = gunBasi(simdi) + g * GUN;
    const c = calisma(gun);
    for (const hekimId of c.hekimler) {
      let t = gun + c.bas * SAAT;
      while (t < gun + c.bit * SAAT) {
        const ogle = new Date(t).getHours() === 13;
        const isl = r.agirlikli(ISLEMLER.filter((x) => x.hekim.includes(hekimId)).map((x) => [x, x.agirlik] as const));
        if (ogle || t + isl.sure * DAKIKA > gun + c.bit * SAAT) {
          t += 30 * DAKIKA;
          continue;
        }
        // Gelecek günlerde takvim daha boş; yakın günler dolu.
        const dolulukOlasiligi = g < 0 ? 0.8 : g === 0 ? 0.82 : g === 1 ? 0.72 : 0.6 - g * 0.05;
        if (r.olasilik(dolulukOlasiligi)) {
          const hasta = hekimId === "h2" && r.olasilik(0.7) ? r.sec(cocuklar) : r.sec(yetiskinler);
          const bitis = t + isl.sure * DAKIKA;
          let durum: string;
          if (bitis <= simdi) durum = r.agirlikli([["tamam", 88], ["gelmedi", 8], ["iptal", 4]] as const);
          else if (t <= simdi) durum = "tedavide";
          else if (t - simdi < 25 * DAKIKA && g === 0) durum = r.olasilik(0.6) ? "geldi" : "bekleniyor";
          else durum = g === 1 && r.olasilik(0.55) ? "onayli" : g === 1 && r.olasilik(0.06) ? "iptal" : "bekleniyor";
          randevular.push({ id: `r${++no}`, hastaId: hasta.id, hekimId, islem: isl.ad, t, sure: isl.sure, ucret: isl.fiyat, durum, kaynak: r.agirlikli([["Telefon", 55], ["Online", 25], ["Klinikte", 20]] as const) });
          t = bitis;
        } else t += 30 * DAKIKA;
      }
    }
  }
  randevular.sort((a, b) => a.t - b.t);

  const planlar: Kayit[] = [];
  const taksitListesi: Kayit[] = [];
  for (let i = 0; i < 70; i++) {
    const hasta = r.sec(yetiskinler);
    const hekimId = r.sec(["h1", "h3", "h4"]);
    const adaylar = ISLEMLER.filter((x) => x.hekim.includes(hekimId) && x.fiyat >= 3000);
    const kalemSayisi = r.tam(1, 4);
    const kalemler = Array.from({ length: kalemSayisi }, () => {
      const x = r.sec(adaylar);
      return { islem: x.ad, dis: x.ad === "Ortodonti kontrolü" ? "" : String(r.sec([11, 12, 14, 16, 21, 22, 24, 26, 36, 37, 46, 47])), fiyat: x.fiyat, yapildi: false };
    });
    if (hekimId === "h1") kalemler.splice(0, kalemler.length, { islem: "Şeffaf plak tedavisi, 12 ay", dis: "", fiyat: 85000, yapildi: false });
    const t = mesaiAni(simdi - r.tam(0, 120) * GUN, 9, 18, r);
    const yas = (simdi - t) / GUN;
    const durum = yas < 10 && r.olasilik(0.6) ? "teklif" : r.agirlikli([["devam", 50], ["tamam", 35], ["red", 15]] as const);
    if (durum === "tamam") kalemler.forEach((k) => (k.yapildi = true));
    if (durum === "devam") kalemler.forEach((k, j) => (k.yapildi = j < kalemler.length / 2));
    const plan: Kayit = { id: `t${i + 1}`, hastaId: hasta.id, hekimId, kalemler, durum, t: Math.min(t, simdi - SAAT), gecmis: [{ t: Math.min(t, simdi - SAAT), m: `Teklif hazırlandı, ${hekimAdi(hekimId)}` }] };
    if (durum === "devam" || durum === "tamam") {
      const toplam = planToplam(plan);
      const adet = toplam > 30000 ? r.sec([3, 6, 6, 9]) : r.sec([1, 2, 3]);
      const onayT = plan.t + r.tam(1, 5) * GUN;
      plan.gecmis.unshift({ t: onayT, m: `Hasta onayladı, ${adet} taksit` });
      const tk = taksitler(plan.id, hasta.id, toplam, adet, onayT);
      for (const k of tk) {
        // Vadesi geçenlerin çoğu ödenmiş, birkaçı gecikmiş.
        if (k.vade < simdi) {
          k.odendi = r.olasilik(0.9);
          if (k.odendi) k.gecmis.push({ t: k.vade + r.tam(0, 3) * GUN, m: `${r.sec(["Kredi kartı", "Nakit", "Havale"])} ile ödendi` });
        }
      }
      taksitListesi.push(...tk);
    }
    planlar.push(plan);
  }

  // Yarınki randevular için hatırlatmalar; bugün 18.00 de gidecek ya da gitti.
  const yarin = gunBasi(simdi) + GUN;
  const gonderim = gunBasi(simdi) + 18 * SAAT;
  const hatirlatmalar: Kayit[] = randevular
    .filter((x) => x.t >= yarin && x.t < yarin + GUN && x.durum !== "iptal")
    .map((x) => ({
      id: `m${x.id}`,
      randevuId: x.id,
      hastaId: x.hastaId,
      kanal: r.olasilik(0.7) ? "WhatsApp" : "SMS",
      gonderim,
      durum: simdi >= gonderim ? (x.durum === "onayli" ? "onay" : "gitti") : "bekliyor",
    }));
  if (simdi >= gonderim) {
    for (const x of randevular.filter((y) => y.t >= yarin && y.t < yarin + GUN && y.durum === "iptal")) {
      hatirlatmalar.push({ id: `m${x.id}`, randevuId: x.id, hastaId: x.hastaId, kanal: "WhatsApp", gonderim, durum: "iptal" });
    }
  } else {
    // Gönderim saati gelmediyse yarının randevuları henüz onaylanmamış olur.
    randevular.filter((y) => y.t >= yarin && y.durum === "onayli").forEach((y) => (y.durum = "bekleniyor"));
  }

  return { hastalar, randevular, planlar: planlar.sort((a, b) => b.t - a.t), taksitler: taksitListesi, hatirlatmalar };
}

/* ---------------- Takvim ---------------- */

const SATIR = 30; // 30 dakikalık satırın yüksekliği, piksel

const RENK_ARKA: Record<string, string> = {
  bekleniyor: "var(--mavi)",
  onayli: "var(--mavi)",
  geldi: "var(--sari)",
  tedavide: "var(--mor)",
  tamam: "var(--yesil)",
  gelmedi: "var(--kirmizi)",
  iptal: "var(--ms)",
};

function RandevuDetayi({ x, api, kapat }: { x: Kayit; api: PanelApi; kapat: () => void }) {
  const h = api.bul("hastalar", x.hastaId)!;
  const eylem = (durum: string, metin: string, olay?: string) => () => {
    api.guncelle("randevular", x.id, { durum });
    api.haber(metin, "basari");
    if (olay) api.olay(olay);
  };
  const gelecek = ["bekleniyor", "onayli"].includes(x.durum);
  return (
    <>
      <header className="flex items-start justify-between gap-3 border-b border-[var(--k)] px-5 py-4">
        <div>
          <h3 className="text-[17px] font-bold">{h.ad}</h3>
          <p className="mt-0.5 text-[12.5px] text-[var(--ms)]">
            {gunAdi(x.t, api.ani)} {saat(x.t)}, {x.sure} dakika, {hekimAdi(x.hekimId)}
          </p>
          <div className="mt-2">
            <DurumYazi d={RANDEVU_DURUMU[x.durum]} />
          </div>
        </div>
        <button type="button" onClick={kapat} aria-label="Kapat" className="flex h-8 w-8 items-center justify-center rounded-lg text-[var(--ms)] hover:bg-[var(--k2)]">
          <IconX size={18} />
        </button>
      </header>
      <div className="min-h-0 flex-1 overflow-y-auto">
        <Bolum baslik="Randevu">
          <AlanListesi alanlar={[["İşlem", x.islem], ["Ücret", tl(x.ucret)], ["Telefon", h.telefon], ["Alındığı yer", x.kaynak]]} />
          {h.not && (
            <p className="mt-3 rounded-lg bg-[var(--k2)] p-3 text-[12.5px] leading-5" style={{ color: RENK.kirmizi }}>
              Önemli not. {h.not}.
            </p>
          )}
        </Bolum>
        <Bolum
          baslik="Hasta"
          sag={
            <button type="button" onClick={() => api.git("hastalar", { kayit: h.id })} className="text-[12px] font-semibold text-[var(--p)] hover:underline">
              Hasta kartı
            </button>
          }
        >
          <AlanListesi alanlar={[["Yaş", String(api.ani.getFullYear() - h.dogum)], ["Kayıt", tarihYil(h.kayit)], ["Açık rıza", h.kvkk ? "Var" : "Eksik"], ["Geliş kaynağı", h.kaynak]]} />
        </Bolum>
      </div>
      <footer className="flex flex-wrap gap-2 border-t border-[var(--k)] px-5 py-3">
        {gelecek && x.t - api.ani.getTime() < 3 * SAAT && <Dugme tur="ana" ikon={IconUserCheck} onClick={eylem("geldi", `${h.ad} bekleme salonunda. Hekimin ekranında sırada görünüyor.`, "hasta-geldi")}>Hasta geldi</Dugme>}
        {x.durum === "geldi" && <Dugme tur="ana" ikon={IconArrowRight} onClick={eylem("tedavide", "Hasta tedaviye alındı", "tedaviye-al")}>Tedaviye al</Dugme>}
        {x.durum === "tedavide" && <Dugme tur="ana" ikon={IconCheck} onClick={eylem("tamam", `Tedavi tamamlandı. ${tl(x.ucret)} ödeme için kasaya düştü.`, "tamamla")}>Tamamla</Dugme>}
        {gelecek && x.t < api.ani.getTime() && <Dugme tur="tehlike" onClick={eylem("gelmedi", "Gelmedi olarak işaretlendi, hastaya yeni randevu mesajı gitti")}>Gelmedi</Dugme>}
        {gelecek && <Dugme tur="tehlike" ikon={IconX} onClick={eylem("iptal", "Randevu iptal edildi, saat takvimde boşaldı")}>İptal et</Dugme>}
      </footer>
    </>
  );
}

function YeniRandevu({ api, hekimId, t, kapat }: { api: PanelApi; hekimId: string; t: number; kapat: () => void }) {
  const uygun = ISLEMLER.filter((x) => x.hekim.includes(hekimId));
  const [isl, setIsl] = useState(uygun[0].ad);
  const [hasta, setHasta] = useState("");
  const [yeniAd, setYeniAd] = useState("");
  const sure = islem(isl).sure;
  const cakisma = cakisiyor(api, hekimId, t, sure);
  const gecmis = t < api.ani.getTime();
  const kaydet = () => {
    let hastaId = hasta;
    if (!hastaId) {
      hastaId = api.yeniId("p");
      api.ekle("hastalar", { id: hastaId, ad: yeniAd.trim() || "Yeni hasta", telefon: "0532 000 00 00", dogum: 1990, kayit: api.ani.getTime(), kvkk: false, kaynak: "Telefon", not: "", gecmis: [] });
    }
    api.ekle("randevular", { id: api.yeniId("r"), hastaId, hekimId, islem: isl, t, sure, ucret: islem(isl).fiyat, durum: "bekleniyor", kaynak: "Telefon" }, false);
    api.haber(`Randevu verildi, ${gunAdi(t, api.ani).toLocaleLowerCase("tr")} ${saat(t)}. Hastaya onay mesajı gitti.`, "basari");
    api.olay("randevu");
    kapat();
  };
  return (
    <>
      <header className="flex items-start justify-between gap-3 border-b border-[var(--k)] px-5 py-4">
        <div>
          <h3 className="text-[17px] font-bold">Yeni randevu</h3>
          <p className="mt-0.5 text-[12.5px] text-[var(--ms)]">
            {gunAdi(t, api.ani)} {saat(t)}, {hekimAdi(hekimId)}
          </p>
        </div>
        <button type="button" onClick={kapat} aria-label="Kapat" className="flex h-8 w-8 items-center justify-center rounded-lg text-[var(--ms)] hover:bg-[var(--k2)]">
          <IconX size={18} />
        </button>
      </header>
      <div className="min-h-0 flex-1 space-y-4 overflow-y-auto px-5 py-4">
        <label className="block">
          <span className="text-[12px] font-medium text-[var(--ms)]">İşlem</span>
          <select value={isl} onChange={(e) => setIsl(e.target.value)} className="mt-1.5 h-10 w-full rounded-lg border border-[var(--k)] bg-[var(--kart)] px-3 text-[13px] outline-none">
            {uygun.map((x) => (
              <option key={x.ad} value={x.ad}>
                {x.ad}, {x.sure} dakika, {tl(x.fiyat)}
              </option>
            ))}
          </select>
        </label>
        <label className="block">
          <span className="text-[12px] font-medium text-[var(--ms)]">Kayıtlı hasta</span>
          <select value={hasta} onChange={(e) => setHasta(e.target.value)} className="mt-1.5 h-10 w-full rounded-lg border border-[var(--k)] bg-[var(--kart)] px-3 text-[13px] outline-none">
            <option value="">Yeni hasta</option>
            {api.veri.hastalar.slice(0, 80).map((h) => (
              <option key={h.id} value={h.id}>
                {h.ad}, {h.telefon}
              </option>
            ))}
          </select>
        </label>
        {!hasta && (
          <label className="block">
            <span className="text-[12px] font-medium text-[var(--ms)]">Yeni hastanın adı</span>
            <input value={yeniAd} onChange={(e) => setYeniAd(e.target.value)} placeholder="Ad soyad" className="mt-1.5 h-10 w-full rounded-lg border border-[var(--k)] bg-transparent px-3 text-[13px] outline-none focus:border-[var(--p)] focus-visible:outline-none" />
          </label>
        )}
        {(cakisma || gecmis) && (
          <p className="rounded-lg bg-[var(--k2)] p-3 text-[12.5px] leading-5" style={{ color: RENK.kirmizi }}>
            {gecmis ? "Geçmiş bir saate randevu verilemez." : `Bu işlem ${sure} dakika sürüyor ve hekimin sonraki randevusuyla çakışıyor. Daha kısa bir işlem ya da başka bir saat seçin.`}
          </p>
        )}
      </div>
      <footer className="flex justify-end gap-2 border-t border-[var(--k)] px-5 py-3">
        <Dugme onClick={kapat}>Vazgeç</Dugme>
        <Dugme tur="ana" ikon={IconCheck} disabled={cakisma || gecmis || (!hasta && !yeniAd.trim())} onClick={kaydet}>
          Randevuyu kaydet
        </Dugme>
      </footer>
    </>
  );
}

function Takvim({ api, modul }: { api: PanelApi; modul: ModulBilgi }) {
  const [gunFarki, setGunFarki] = useState(0);
  const [secili, setSecili] = useState<{ tur: "randevu"; id: string } | { tur: "yeni"; hekimId: string; t: number } | null>(null);
  const gun = gunBasi(api.ani) + gunFarki * GUN;
  const c = calisma(gun);
  const satirSayisi = (BIT - BAS) * 2;
  const s = api.ani.getTime();
  const randevular = api.veri.randevular.filter((x) => x.t >= gun && x.t < gun + GUN);
  const hekimler = HEKIMLER.filter((h) => c.hekimler.includes(h.id));
  const simdiY = gunFarki === 0 && s > gun + BAS * SAAT && s < gun + BIT * SAAT ? ((s - gun - BAS * SAAT) / (30 * DAKIKA)) * SATIR : null;
  const secRandevu = secili?.tur === "randevu" ? api.bul("randevular", secili.id) : null;
  const d = new Date(gun);

  return (
    <>
      <EkranBasligi modul={modul}>
        <div className="flex items-center gap-1">
          <Dugme tur="sade" ikon={IconChevronLeft} onClick={() => setGunFarki((g) => g - 1)} />
          <Dugme onClick={() => setGunFarki(0)} className={gunFarki === 0 ? "border-[var(--p)]" : ""}>
            {gunFarki === 0 ? "Bugün" : `${GUNLER[d.getDay()]} ${tarih(gun)}`}
          </Dugme>
          <Dugme tur="sade" ikon={IconChevronRight} onClick={() => setGunFarki((g) => g + 1)} />
        </div>
      </EkranBasligi>

      <div className="mb-3 flex flex-wrap gap-x-4 gap-y-1 text-[11.5px] text-[var(--ms)]">
        {["bekleniyor", "geldi", "tedavide", "tamam", "gelmedi"].map((k) => (
          <span key={k} className="inline-flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-[2px]" style={{ background: RENK_ARKA[k] }} />
            {RANDEVU_DURUMU[k].ad}
          </span>
        ))}
        <span>{d.getDay() === 0 ? "Pazar günü iki hekim nöbetçi." : d.getDay() === 6 ? "Cumartesi saat 15.00 e kadar." : "Boş bir saate tıklayınca randevu formu açılır."}</span>
      </div>

      <div className="overflow-x-auto rounded-xl border border-[var(--k)] bg-[var(--kart)]">
        <div className="min-w-[40rem]">
          <div className="grid border-b border-[var(--k)]" style={{ gridTemplateColumns: `3.5rem repeat(${hekimler.length}, minmax(0,1fr))` }}>
            <div />
            {hekimler.map((h) => {
              const dolu = randevular.filter((x) => x.hekimId === h.id && x.durum !== "iptal").reduce((t, x) => t + x.sure, 0);
              const kapasite = (c.bit - c.bas - (c.bit - c.bas > 6 ? 1 : 0)) * 60;
              return (
                <div key={h.id} className="border-l border-[var(--k)] px-3 py-2.5">
                  <p className="truncate text-[12.5px] font-semibold">{h.ad}</p>
                  <p className="truncate text-[11px] text-[var(--ms)]">{h.alan}</p>
                  <div className="mt-1.5 flex items-center gap-2">
                    <Cubuk oran={dolu / kapasite} ince />
                    <span className="shrink-0 text-[10.5px] tabular-nums text-[var(--ms)]">{yuzde(Math.min(100, (dolu / kapasite) * 100))}</span>
                  </div>
                </div>
              );
            })}
          </div>
          <div className="relative grid" style={{ gridTemplateColumns: `3.5rem repeat(${hekimler.length}, minmax(0,1fr))`, height: satirSayisi * SATIR }}>
            <div className="relative">
              {Array.from({ length: satirSayisi }, (_, i) => (
                <span key={i} className="absolute right-2 text-[10.5px] tabular-nums text-[var(--ms)]" style={{ top: Math.max(2, i * SATIR - 6) }}>
                  {i % 2 === 0 ? `${iki(BAS + i / 2)}.00` : ""}
                </span>
              ))}
            </div>
            {hekimler.map((h) => (
              <div key={h.id} className="relative border-l border-[var(--k)]">
                {Array.from({ length: satirSayisi }, (_, i) => {
                  const t = gun + BAS * SAAT + i * 30 * DAKIKA;
                  const kapali = t < gun + c.bas * SAAT || t >= gun + c.bit * SAAT;
                  return (
                    <button
                      key={i}
                      type="button"
                      disabled={kapali || t < s + 5 * DAKIKA}
                      aria-label={`${h.ad}, ${saat(t)} için randevu ver`}
                      onClick={() => setSecili({ tur: "yeni", hekimId: h.id, t })}
                      className={`absolute inset-x-0 border-t ${i % 2 === 0 ? "border-[var(--k)]" : "border-dashed border-[var(--k)]"} ${kapali ? "bg-[var(--k2)] opacity-40" : t < s + 5 * DAKIKA ? "" : "hover:bg-[var(--k2)]"}`}
                      style={{ top: i * SATIR, height: SATIR }}
                    />
                  );
                })}
                {randevular
                  .filter((x) => x.hekimId === h.id)
                  .map((x) => {
                    const top = ((x.t - gun - BAS * SAAT) / (30 * DAKIKA)) * SATIR;
                    const yuk = (x.sure / 30) * SATIR;
                    return (
                      <button
                        key={x.id}
                        type="button"
                        onClick={() => setSecili({ tur: "randevu", id: x.id })}
                        className={`absolute inset-x-1 overflow-hidden rounded-md border-l-[3px] bg-[var(--kart2)] px-2 py-1 text-left transition-[filter] hover:brightness-125 ${x.durum === "iptal" ? "opacity-40" : ""}`}
                        style={{ top: top + 1, height: yuk - 2, borderColor: RENK_ARKA[x.durum], background: `color-mix(in srgb, ${RENK_ARKA[x.durum]} 14%, var(--kart))` }}
                      >
                        <span className={`block truncate text-[11.5px] font-semibold ${x.durum === "iptal" ? "line-through" : ""}`}>{hastaAdi(api, x.hastaId)}</span>
                        {yuk > 34 && <span className="block truncate text-[10.5px] text-[var(--ms)]">{saat(x.t)} {x.islem}</span>}
                      </button>
                    );
                  })}
              </div>
            ))}
            {simdiY !== null && (
              <div className="pointer-events-none absolute left-14 right-0 z-10 flex items-center" style={{ top: simdiY }}>
                <span className="h-px flex-1 bg-[var(--kirmizi)]" />
              </div>
            )}
          </div>
        </div>
      </div>

      <Cekmece acik={!!secili} kapat={() => setSecili(null)}>
        {secRandevu && <RandevuDetayi x={secRandevu} api={api} kapat={() => setSecili(null)} />}
        {secili?.tur === "yeni" && <YeniRandevu key={`${secili.hekimId}${secili.t}`} api={api} hekimId={secili.hekimId} t={secili.t} kapat={() => setSecili(null)} />}
      </Cekmece>
    </>
  );
}

function HatirlatmaUst({ api }: { api: PanelApi }) {
  const bekleyen = api.veri.hatirlatmalar.filter((m) => m.durum === "bekliyor");
  return (
    <div className="flex flex-col gap-3 rounded-xl border border-[var(--k)] bg-[var(--kart)] p-4 @3xl:flex-row @3xl:items-center @3xl:justify-between">
      <p className="text-[12.5px] leading-5 text-[var(--ms)]">
        Yarınki {api.veri.hatirlatmalar.length} randevunun mesajı saat 18.00 de kendiliğinden gider. Hasta 1 yazarsa onaylanır, 2 yazarsa iptal edilir ve saat takvimde boşalır.
      </p>
      <Dugme
        tur="ana"
        ikon={IconSend}
        disabled={!bekleyen.length}
        onClick={() => {
          bekleyen.forEach((m, i) => {
            const onay = i % 5 !== 4;
            api.guncelle("hatirlatmalar", m.id, { durum: onay ? "onay" : "iptal", gonderim: api.ani.getTime() });
            api.guncelle("randevular", m.randevuId, { durum: onay ? "onayli" : "iptal" });
          });
          api.haber(`${bekleyen.length} mesaj gönderildi. Cevaplar geldi, iptal edilen saatler takvimde boşaldı.`, "basari");
          api.olay("hatirlatma-gonder");
        }}
      >
        {bekleyen.length ? "Hepsini şimdi gönder" : "Hepsi gönderildi"}
      </Dugme>
    </div>
  );
}

/* ---------------- Ekranlar ---------------- */

function uyarilar(api: PanelApi) {
  const liste: ReturnType<SektorPanel["uyarilar"]> = [];
  const s = api.ani.getTime();
  const salon = api.veri.randevular.filter((x) => x.durum === "geldi").length;
  const teklif = api.veri.planlar.filter((p) => p.durum === "teklif").length;
  const geciken = api.veri.taksitler.filter((t) => gecikti(t, api)).length;
  const kvkk = api.veri.hastalar.filter((h) => !h.kvkk).length;
  const yarinIptal = api.veri.randevular.filter((x) => x.durum === "iptal" && x.t > s && x.t < gunBasi(s) + 2 * GUN).length;
  if (salon) liste.push({ metin: `Bekleme salonunda ${salon} hasta var`, modul: "takvim", renk: "sari" });
  if (teklif) liste.push({ metin: `${teklif} tedavi teklifi hastanın onayını bekliyor`, modul: "tedaviler", filtre: "Durum=Onay bekliyor", renk: "mavi" });
  if (geciken) liste.push({ metin: `${geciken} taksitin vadesi geçti`, modul: "tahsilat", filtre: "Durum=Gecikti", renk: "kirmizi" });
  if (yarinIptal) liste.push({ metin: `Bugün ve yarın iptal edilen ${yarinIptal} randevunun saati boş`, modul: "takvim", renk: "mor" });
  if (kvkk) liste.push({ metin: `${kvkk} hastanın açık rıza onayı eksik`, modul: "hastalar", filtre: "Durum=Açık rıza eksik", renk: "sari" });
  return liste;
}

const ozet = ozetEkrani({
  kullanici: KULLANICI.ad,
  uyarilar,
  karsilama: (api) => {
    const s = api.ani.getTime();
    const bugun = api.veri.randevular.filter((x) => x.t >= gunBasi(s) && x.t < gunBasi(s) + GUN && x.durum !== "iptal");
    const sirada = bugun.filter((x) => ["bekleniyor", "onayli", "geldi"].includes(x.durum)).length;
    return `Bugünkü ${bugun.length} randevunun ${bugun.filter((x) => x.durum === "tamam").length} tanesi tamamlandı, ${sirada} hasta sırada.`;
  },
  sayilar: (api) => {
    const s = api.ani.getTime();
    const bugun = api.veri.randevular.filter((x) => x.t >= gunBasi(s) && x.t < gunBasi(s) + GUN && x.durum !== "iptal");
    const c = calisma(s);
    const kapasite = c.hekimler.length * (c.bit - c.bas - (c.bit - c.bas > 6 ? 1 : 0)) * 60;
    const dolu = bugun.reduce((t, x) => t + x.sure, 0);
    const otuz = api.veri.randevular.filter((x) => x.t > s - 30 * GUN && x.t < s && ["tamam", "gelmedi"].includes(x.durum));
    const tahsil = api.veri.randevular.filter((x) => x.durum === "tamam" && x.t > s - 30 * GUN).reduce((t, x) => t + x.ucret, 0);
    return [
      {
        ad: "Bugünkü randevu",
        deger: String(bugun.length),
        alt: `${bugun.filter((x) => x.durum === "tamam").length} tamamlandı, ${bugun.filter((x) => ["bekleniyor", "onayli", "geldi"].includes(x.durum)).length} sırada`,
        not: "Bugün için verilmiş, iptal edilmemiş randevular. Gelmeyenler de sayılır.",
        git: () => api.git("takvim"),
      },
      {
        ad: "Koltuk doluluğu, bugün",
        deger: sayi(Math.min(100, (dolu / kapasite) * 100)),
        birim: "yüzde",
        alt: `${c.hekimler.length} hekim, öğle arası hariç`,
        not: "Bugünkü randevuların toplam süresi, hekimlerin çalışma süresine bölünür. Bir saatlik öğle arası çalışma süresinden düşülür.",
        git: () => api.git("takvim"),
      },
      {
        ad: "Gelmeme oranı, 30 gün",
        deger: sayi((otuz.filter((x) => x.durum === "gelmedi").length / Math.max(1, otuz.length)) * 100, 1),
        birim: "yüzde",
        alt: "Hatırlatma mesajı onayı olanlarda daha düşük",
        not: "Son 30 günde zamanı geçmiş randevulardan gelinmeyenlerin oranı. İptal edilenler sayılmaz.",
      },
      {
        ad: "Tamamlanan işlem, 30 gün",
        deger: tlKisa(tahsil),
        alt: "Tedavi planı taksitleri hariç",
        not: "Son 30 günde tamamlanan randevuların ücret toplamı. Taksitli tedavi planlarının ödemeleri ayrı izlenir.",
        seri: Array.from({ length: 14 }, (_, i) => {
          const g = gunBasi(s) - (14 - i) * GUN;
          return api.veri.randevular.filter((x) => x.durum === "tamam" && x.t >= g && x.t < g + GUN).reduce((t, x) => t + x.ucret, 0);
        }),
        renk: "yesil",
      },
    ];
  },
  ana: {
    baslik: "Günlük tamamlanan işlem, son 14 gün",
    icerik: (api) => {
      const bugun = gunBasi(api.ani);
      const veri = Array.from({ length: 15 }, (_, i) => {
        const g = bugun - (14 - i) * GUN;
        const tutar = api.veri.randevular.filter((x) => x.durum === "tamam" && x.t >= g && x.t < g + GUN).reduce((t, x) => t + x.ucret, 0);
        const d = new Date(g);
        return { etiket: i === 14 ? "Bugün" : `${d.getDate()}`, uzunEtiket: i === 14 ? `Bugün, saat ${saat(api.ani)} itibarıyla` : `${tarih(g)} ${GUN_KISA[d.getDay()]}`, deger: tutar, kismi: i === 14 };
      });
      return <CubukGrafik veri={veri} bicim={tl} ozet="Pazar günleri nöbetçi iki hekim çalışır" />;
    },
  },
  parcalar: [
    {
      baslik: "Sıradaki hastalar",
      icerik: (api) => {
        const s = api.ani.getTime();
        const liste = api.veri.randevular.filter((x) => ["geldi", "tedavide", "bekleniyor", "onayli"].includes(x.durum) && x.t + x.sure * DAKIKA > s && x.t < gunBasi(s) + GUN).slice(0, 6);
        if (!liste.length) return <p className="text-[12.5px] text-[var(--ms)]">Bugün için sırada hasta yok.</p>;
        return (
          <ul className="divide-y divide-[var(--k)]">
            {liste.map((x) => (
              <li key={x.id}>
                <button type="button" onClick={() => api.git("takvim")} className="flex w-full items-center gap-3 py-2 text-left hover:text-[var(--p)]">
                  <span className="w-11 shrink-0 text-[13px] font-semibold tabular-nums">{saat(x.t)}</span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-[12.5px]">{hastaAdi(api, x.hastaId)}</span>
                    <span className="block truncate text-[11.5px] text-[var(--ms)]">
                      {x.islem}, {hekimAdi(x.hekimId)}
                    </span>
                  </span>
                  <DurumYazi d={RANDEVU_DURUMU[x.durum]} kucuk />
                </button>
              </li>
            ))}
          </ul>
        );
      },
    },
    {
      baslik: "İşlemlere göre, 30 gün",
      icerik: (api) => {
        const s = api.ani.getTime();
        const m = new Map<string, number>();
        api.veri.randevular.filter((x) => x.durum === "tamam" && x.t > s - 30 * GUN).forEach((x) => m.set(x.islem, (m.get(x.islem) ?? 0) + x.ucret));
        const sirali = [...m.entries()].sort((a, b) => b[1] - a[1]);
        const renkler = ["vurgu", "mavi", "mor", "sari", "yesil"];
        const dilimler = [...sirali.slice(0, 4).map(([ad, deger], i) => ({ ad, deger, renk: renkler[i] })), { ad: "Diğer", deger: sirali.slice(4).reduce((t, x) => t + x[1], 0), renk: "gri" }];
        return <HalkaGrafik dilimler={dilimler} bicim={tlKisa} merkez={tlKisa(dilimler.reduce((t, d) => t + d.deger, 0))} />;
      },
    },
  ],
});

const panel: SektorPanel = {
  saat: { acilis: 9, kapanis: 18.5, yogun: 11 },
  kullanici: KULLANICI,
  uret,
  uyarilar,
  moduller: [
    { id: "ozet", grup: "Genel", ekran: ozet },
    { id: "takvim", grup: "Randevu", rozet: (api) => api.veri.randevular.filter((x) => x.durum === "geldi").length, ekran: { tur: "ozel", bilesen: Takvim } },
    {
      id: "hatirlatma",
      grup: "Randevu",
      ekran: {
        tur: "liste",
        koleksiyon: "hatirlatmalar",
        baslikAdi: "Hasta",
        baslik: (m, api) => hastaAdi(api, m.hastaId),
        harf: (m, api) => hastaAdi(api, m.hastaId),
        alt: (m, api) => {
          const x = api.bul("randevular", m.randevuId)!;
          return `Yarın ${saat(x.t)}, ${x.islem}`;
        },
        durum: (m) => ({ bekliyor: { ad: "Gönderilecek", renk: "gri" }, gitti: { ad: "Gönderildi, cevap yok", renk: "mavi" }, onay: { ad: "Hasta onayladı", renk: "yesil" }, iptal: { ad: "Hasta iptal etti", renk: "kirmizi" } })[m.durum as string] as Durum,
        arama: (m, api) => api.bul("hastalar", m.hastaId)?.telefon ?? "",
        sira: (a, b) => (a.randevuId < b.randevuId ? -1 : 1),
        ust: HatirlatmaUst,
        sutunlar: [
          { ad: "Kanal", deger: (m) => m.kanal, oncelik: 1 },
          { ad: "Hekim", deger: (m, api) => hekimAdi(api.bul("randevular", m.randevuId)!.hekimId), oncelik: 2 },
          { ad: "Gönderim", deger: (m, api) => zaman(m.gonderim, api.ani), oncelik: 3 },
        ],
        filtreler: [{ ad: "Kanal", secenekler: ["WhatsApp", "SMS"].map((k) => ({ ad: k, kosul: (m: Kayit) => m.kanal === k })) }],
        detay: {
          bolumler: (m, api) => {
            const x = api.bul("randevular", m.randevuId)!;
            return (
              <Bolum baslik="Mesaj">
                <p className="rounded-lg bg-[var(--k2)] p-3 text-[12.5px] leading-5">
                  Sayın {hastaAdi(api, m.hastaId)}, yarın saat {saat(x.t)} için {hekimAdi(x.hekimId)} ile randevunuz var. Onay için 1, iptal için 2 yazabilirsiniz. Mavi Diş Polikliniği
                </p>
              </Bolum>
            );
          },
        },
      },
    },
    {
      id: "hastalar",
      grup: "Hasta",
      ekran: {
        tur: "liste",
        koleksiyon: "hastalar",
        baslikAdi: "Hasta",
        baslik: (h) => h.ad,
        harf: (h) => h.ad,
        alt: (h, api) => `${api.ani.getFullYear() - h.dogum} yaş, ${h.telefon}`,
        durum: (h, api) => (!h.kvkk ? { ad: "Açık rıza eksik", renk: "sari" } : api.veri.taksitler.some((t) => t.hastaId === h.id && gecikti(t, api)) ? { ad: "Geciken ödeme", renk: "kirmizi" } : { ad: "Normal", renk: "yesil" }),
        arama: (h) => `${h.telefon} ${h.not} ${h.kaynak}`,
        sutunlar: [
          {
            ad: "Son ziyaret",
            deger: (h, api) => {
              const x = api.veri.randevular.filter((y) => y.hastaId === h.id && y.durum === "tamam").pop();
              return x ? tarih(x.t) : "Yok";
            },
            oncelik: 2,
          },
          {
            ad: "Sonraki randevu",
            deger: (h, api) => {
              const x = api.veri.randevular.find((y) => y.hastaId === h.id && y.t > api.ani.getTime() && y.durum !== "iptal");
              return x ? zaman(x.t, api.ani) : "Yok";
            },
            oncelik: 1,
          },
          { ad: "Geliş kaynağı", deger: (h) => h.kaynak, sirala: (h) => h.kaynak, oncelik: 3 },
        ],
        filtreler: [
          {
            ad: "Durum",
            secenekler: [
              { ad: "Açık rıza eksik", kosul: (h) => !h.kvkk },
              { ad: "Geciken ödemesi olan", kosul: (h, api) => api.veri.taksitler.some((t) => t.hastaId === h.id && gecikti(t, api)) },
              { ad: "Notu olan", kosul: (h) => !!h.not },
            ],
          },
          { ad: "Kaynak", secenekler: ["Tavsiye", "Google", "Instagram", "Online randevu", "Yoldan geçerken"].map((k) => ({ ad: k, kosul: (h: Kayit) => h.kaynak === k })) },
        ],
        detay: {
          bolumler: (h, api) => {
            const randevular = api.veri.randevular.filter((x) => x.hastaId === h.id).sort((a, b) => b.t - a.t).slice(0, 6);
            const planlar = api.veri.planlar.filter((p) => p.hastaId === h.id);
            return (
              <>
                <Bolum baslik="Hasta">
                  <AlanListesi alanlar={[["Telefon", h.telefon], ["Doğum yılı", String(h.dogum)], ["Kayıt", tarihYil(h.kayit)], ["Geliş kaynağı", h.kaynak], ["Açık rıza", h.kvkk ? "Onaylı" : "Eksik"], ...(h.not ? ([["Not", h.not]] as [string, string][]) : [])]} />
                </Bolum>
                <Bolum baslik="Randevular">
                  {randevular.length ? (
                    <MiniTablo basliklar={["Zaman", "İşlem", "Durum"]} satirlar={randevular.map((x) => [zaman(x.t, api.ani), x.islem, <DurumYazi d={RANDEVU_DURUMU[x.durum]} kucuk />])} />
                  ) : (
                    <p className="text-[12.5px] text-[var(--ms)]">Son dört haftada randevusu yok.</p>
                  )}
                </Bolum>
                {planlar.length > 0 && (
                  <Bolum baslik="Tedavi planları">
                    <ul className="space-y-1.5">
                      {planlar.map((p) => (
                        <li key={p.id}>
                          <button type="button" onClick={() => api.git("tedaviler", { kayit: p.id })} className="flex w-full justify-between gap-3 text-left text-[12.5px] hover:text-[var(--p)]">
                            <span>{p.kalemler.map((k: Kayit) => k.islem).join(", ")}</span>
                            <span className="shrink-0 tabular-nums">{tl(planToplam(p))}</span>
                          </button>
                        </li>
                      ))}
                    </ul>
                  </Bolum>
                )}
              </>
            );
          },
          eylemler: [
            {
              ad: "Açık rıza formu gönder",
              tur: "ana",
              ikon: IconSend,
              gorunur: (h) => !h.kvkk,
              uygula: (h, api) => {
                api.guncelle("hastalar", h.id, { kvkk: true }, "Açık rıza formu SMS ile gönderildi ve onaylandı");
                api.haber("Form gönderildi, hasta telefonundan onayladı", "basari");
                api.olay("kvkk");
              },
            },
          ],
        },
      },
    },
    {
      id: "tedaviler",
      grup: "Hasta",
      rozet: (api) => api.veri.planlar.filter((p) => p.durum === "teklif").length,
      ekran: {
        tur: "liste",
        koleksiyon: "planlar",
        baslikAdi: "Hasta",
        baslik: (p, api) => hastaAdi(api, p.hastaId),
        harf: (p, api) => hastaAdi(api, p.hastaId),
        alt: (p) => p.kalemler.map((k: Kayit) => k.islem).join(", "),
        durum: (p) => PLAN_DURUMU[p.durum],
        arama: (p) => p.kalemler.map((k: Kayit) => k.islem).join(" "),
        sira: (a, b) => (a.durum === "teklif" ? 0 : 1) - (b.durum === "teklif" ? 0 : 1) || b.t - a.t,
        sutunlar: [
          { ad: "Hekim", deger: (p) => hekimAdi(p.hekimId), oncelik: 2 },
          { ad: "İlerleme", deger: (p) => `${p.kalemler.filter((k: Kayit) => k.yapildi).length} kalemin ${p.kalemler.length} tanesi`, oncelik: 3 },
          { ad: "Tutar", deger: (p) => tl(planToplam(p)), sirala: planToplam, csv: planToplam, hiza: "sag", oncelik: 1 },
          { ad: "Tarih", deger: (p) => tarih(p.t), sirala: (p) => p.t, oncelik: 2 },
        ],
        filtreler: [
          { ad: "Durum", secenekler: Object.entries(PLAN_DURUMU).map(([k, d]) => ({ ad: d.ad, kosul: (p: Kayit) => p.durum === k })) },
          { ad: "Hekim", secenekler: HEKIMLER.map((h) => ({ ad: h.ad, kosul: (p: Kayit) => p.hekimId === h.id })) },
        ],
        ozet: (api) => {
          const l = api.veri.planlar;
          const teklif = l.filter((p) => p.durum === "teklif");
          const karar = l.filter((p) => p.durum !== "teklif");
          return [
            { ad: "Onay bekleyen", deger: String(teklif.length), renk: "sari", not: tlKisa(teklif.reduce((t, p) => t + planToplam(p), 0)) },
            { ad: "Kabul oranı", deger: yuzde((karar.filter((p) => p.durum !== "red").length / Math.max(1, karar.length)) * 100) },
            { ad: "Devam eden", deger: String(l.filter((p) => p.durum === "devam").length), renk: "mavi" },
            { ad: "Ortalama plan", deger: tlKisa(l.reduce((t, p) => t + planToplam(p), 0) / Math.max(1, l.length)) },
          ];
        },
        detay: {
          bolumler: (p, api) => {
            const tk = api.veri.taksitler.filter((t) => t.planId === p.id);
            return (
              <>
                <Bolum baslik="Kalemler">
                  <MiniTablo
                    basliklar={["İşlem", "Diş", "Tutar", "Durum"]}
                    sagdakiler={[2]}
                    satirlar={[
                      ...p.kalemler.map((k: Kayit) => [k.islem, k.dis || "Yok", tl(k.fiyat), <span style={{ color: k.yapildi ? RENK.yesil : RENK.gri }}>{k.yapildi ? "Yapıldı" : "Bekliyor"}</span>]),
                      [<strong>Toplam</strong>, "", <strong>{tl(planToplam(p))}</strong>, ""],
                    ]}
                  />
                </Bolum>
                {tk.length > 0 && (
                  <Bolum baslik="Ödeme planı">
                    <MiniTablo basliklar={["Taksit", "Vade", "Tutar", "Durum"]} sagdakiler={[2]} satirlar={tk.map((t) => [`${t.no}. taksit`, tarih(t.vade), tl(t.tutar), <DurumYazi d={taksitDurumu(t, api)} kucuk />])} />
                  </Bolum>
                )}
                <Bolum baslik="Geçmiş">
                  <Gecmis satirlar={p.gecmis.map((g: Kayit) => ({ zaman: zaman(g.t, api.ani), metin: g.m }))} />
                </Bolum>
              </>
            );
          },
          eylemler: [
            {
              ad: "Hasta onayladı, 6 taksit",
              tur: "ana",
              ikon: IconCheck,
              gorunur: (p) => p.durum === "teklif",
              uygula: (p, api) => {
                const toplam = planToplam(p);
                const adet = toplam > 20000 ? 6 : 2;
                for (const t of taksitler(p.id, p.hastaId, toplam, adet, api.ani.getTime() + 2 * GUN)) api.ekle("taksitler", t, false);
                api.guncelle("planlar", p.id, { durum: "devam" }, `Hasta onayladı, ${adet} taksit planı oluştu`);
                api.haber(`Plan onaylandı. ${adet} taksit, ilki ${tarih(api.ani.getTime() + 2 * GUN)} vadeli. İlk seans için randevu verebilirsiniz.`, "basari");
                api.olay("tedavi-onay");
              },
            },
            {
              ad: "Kabul etmedi",
              tur: "tehlike",
              gorunur: (p) => p.durum === "teklif",
              uygula: (p, api) => {
                api.guncelle("planlar", p.id, { durum: "red" }, "Hasta teklifi kabul etmedi");
                api.haber("Teklif kapatıldı. Üç ay sonra hatırlatma görevi oluştu.", "bilgi");
              },
            },
            {
              ad: "Sıradaki kalemi tamamla",
              ikon: IconCheck,
              gorunur: (p) => p.durum === "devam",
              uygula: (p, api) => {
                const i = p.kalemler.findIndex((k: Kayit) => !k.yapildi);
                const kalemler = p.kalemler.map((k: Kayit, j: number) => (j === i ? { ...k, yapildi: true } : k));
                const bitti = kalemler.every((k: Kayit) => k.yapildi);
                api.guncelle("planlar", p.id, { kalemler, durum: bitti ? "tamam" : "devam" }, `${p.kalemler[i].islem} yapıldı`);
                api.haber(bitti ? "Tedavi planı tamamlandı" : `${p.kalemler[i].islem} yapıldı olarak işlendi`, "basari");
              },
            },
          ],
        },
      },
    },
    {
      id: "tahsilat",
      grup: "Finans",
      rozet: (api) => api.veri.taksitler.filter((t) => gecikti(t, api)).length,
      ekran: {
        tur: "liste",
        koleksiyon: "taksitler",
        baslikAdi: "Hasta",
        kapsam: (t, api) => t.odendi || t.vade < api.ani.getTime() + 45 * GUN,
        baslik: (t, api) => hastaAdi(api, t.hastaId),
        harf: (t, api) => hastaAdi(api, t.hastaId),
        alt: (t) => `${t.no}. taksit, ${t.adet} taksitin`,
        durum: taksitDurumu,
        arama: (t, api) => api.bul("hastalar", t.hastaId)?.telefon ?? "",
        sira: (a, b) => (a.odendi ? 1 : 0) - (b.odendi ? 1 : 0) || a.vade - b.vade,
        sutunlar: [
          { ad: "Vade", deger: (t) => tarih(t.vade), sirala: (t) => t.vade, oncelik: 1 },
          { ad: "Tutar", deger: (t) => tl(t.tutar), sirala: (t) => t.tutar, csv: (t) => t.tutar, hiza: "sag", oncelik: 1 },
          { ad: "Ödeme", deger: (t) => (t.odendi ? t.gecmis[t.gecmis.length - 1]?.m ?? "Ödendi" : "Yok"), oncelik: 3 },
        ],
        filtreler: [
          {
            ad: "Durum",
            secenekler: [
              { ad: "Gecikti", kosul: (t, api) => gecikti(t, api) },
              { ad: "Bu hafta", kosul: (t, api) => taksitDurumu(t, api).ad === "Bu hafta" },
              { ad: "Ödenmedi", kosul: (t) => !t.odendi },
              { ad: "Ödendi", kosul: (t) => t.odendi },
            ],
          },
        ],
        ozet: (api) => {
          const l = api.veri.taksitler;
          const s = api.ani.getTime();
          return [
            { ad: "Geciken", deger: tlKisa(l.filter((t) => gecikti(t, api)).reduce((a, t) => a + t.tutar, 0)), renk: "kirmizi" },
            { ad: "Bu hafta gelecek", deger: tlKisa(l.filter((t) => !t.odendi && t.vade >= gunBasi(s) && t.vade < s + 7 * GUN).reduce((a, t) => a + t.tutar, 0)), renk: "sari" },
            { ad: "Tahsil edilen, 30 gün", deger: tlKisa(l.filter((t) => t.odendi && t.vade > s - 30 * GUN && t.vade <= s).reduce((a, t) => a + t.tutar, 0)), renk: "yesil" },
            { ad: "Toplam alacak", deger: tlKisa(l.filter((t) => !t.odendi).reduce((a, t) => a + t.tutar, 0)) },
          ];
        },
        detay: {
          bolumler: (t, api) => (
            <>
              <Bolum
                baslik="Taksit"
                sag={
                  <button type="button" onClick={() => api.git("tedaviler", { kayit: t.planId })} className="text-[12px] font-semibold text-[var(--p)] hover:underline">
                    Planı aç
                  </button>
                }
              >
                <AlanListesi alanlar={[["Hasta", hastaAdi(api, t.hastaId)], ["Telefon", api.bul("hastalar", t.hastaId)?.telefon], ["Taksit", `${t.no}. taksit, toplam ${t.adet}`], ["Vade", tarihYil(t.vade)], ["Tutar", tl(t.tutar)]]} />
              </Bolum>
              <Bolum baslik="Geçmiş">
                <Gecmis satirlar={[...t.gecmis].reverse().map((g: Kayit) => ({ zaman: zaman(g.t, api.ani), metin: g.m }))} />
              </Bolum>
            </>
          ),
          eylemler: [
            ...["Kredi kartı", "Nakit"].map(
              (y, i): Eylem => ({
                ad: `${y} ile ödeme al`,
                tur: i === 0 ? "ana" : undefined,
                gorunur: (t) => !t.odendi,
                uygula: (t, api) => {
                  api.guncelle("taksitler", t.id, { odendi: true, gecmis: [...t.gecmis, { t: api.ani.getTime(), m: `${y} ile ödendi, ${KULLANICI.ad}` }] });
                  api.haber(`${tl(t.tutar)} tahsil edildi, e Arşiv belgesi hastaya gönderildi`, "basari");
                  api.olay("odeme");
                },
              }),
            ),
            {
              ad: "Hatırlatma gönder",
              gorunur: (t, api) => gecikti(t, api),
              uygula: (t, api) => {
                api.guncelle("taksitler", t.id, { gecmis: [...t.gecmis, { t: api.ani.getTime(), m: "Ödeme hatırlatması ve kartla ödeme bağlantısı gönderildi" }] });
                api.haber("Hastaya ödeme bağlantısıyla nazik bir hatırlatma gitti", "basari");
                api.olay("odeme-hatirlat");
              },
            },
          ],
        },
      },
    },
  ],
  arama: [
    { koleksiyon: "hastalar", modul: "hastalar", baslik: (h) => h.ad, alt: (h) => h.telefon, metin: (h) => `${h.telefon} ${h.not}` },
    { koleksiyon: "planlar", modul: "tedaviler", baslik: (p) => `Tedavi planı ${p.id.slice(1)}`, alt: (p) => p.kalemler.map((k: Kayit) => k.islem).join(", "), metin: (p) => p.kalemler.map((k: Kayit) => k.islem).join(" ") },
  ],
  gorevler: [
    { id: "g1", metin: "Boş bir saate randevu verin", ipucu: "Randevu takviminde bir hekimin boş saatine tıklayın.", modul: "takvim", olay: "randevu" },
    { id: "g2", metin: "Gelen bir hastayı tedaviye alın", ipucu: "Takvimde sarı renkli, bekleme salonundaki bir hastayı açın.", modul: "takvim", olay: "tedaviye-al" },
    { id: "g3", metin: "Bir tedavi teklifini onaylayın", ipucu: "Tedavi planlarında onay bekleyen bir teklifi açın; taksitler kendiliğinden oluşur.", modul: "tedaviler", olay: "tedavi-onay" },
    { id: "g4", metin: "Geciken bir taksiti tahsil edin", ipucu: "Ödemeler ekranında durum süzgecinden Gecikti seçin.", modul: "tahsilat", olay: "odeme" },
    { id: "g5", metin: "Yarının hatırlatmalarını gönderin", ipucu: "Hatırlatmalar ekranında Hepsini şimdi gönder düğmesine basın.", modul: "hatirlatma", olay: "hatirlatma-gonder" },
  ],
  canli: {
    aralik: 34_000,
    uret: (api) => {
      const s = api.ani.getTime();
      const x = api.veri.randevular.find((y) => ["bekleniyor", "onayli"].includes(y.durum) && y.t > s - 10 * DAKIKA && y.t - s < 40 * DAKIKA);
      if (!x) return;
      api.guncelle("randevular", x.id, { durum: "geldi" });
      api.bildir(`${hastaAdi(api, x.hastaId)} geldi, ${saat(x.t)} randevusu için bekleme salonunda`, "takvim");
    },
  },
};

export default panel;
export { bilgi };
