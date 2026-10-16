/*
 * Demo verisinin ortak araçları: tohumlu rastgele sayı, demo saati, biçimlendirme
 * ve kişi havuzu. Görünür metinlerde sitenin işaret kuralı geçerli; para TL ile,
 * oran "yüzde" ile, saat noktayla yazılır.
 */
import type { Rastgele } from "./tipler";

/** Aynı tohum aynı veriyi üretir; demo gün içinde tutarlı kalır, her gün tazelenir. */
export function rastgele(tohum: string): Rastgele {
  let h = 1779033703 ^ tohum.length;
  for (let i = 0; i < tohum.length; i++) {
    h = Math.imul(h ^ tohum.charCodeAt(i), 3432918353);
    h = (h << 13) | (h >>> 19);
  }
  let a = h >>> 0;
  const kesir = () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
  const tam = (min: number, max: number) => min + Math.floor(kesir() * (max - min + 1));
  return {
    kesir,
    tam,
    sec: (dizi) => dizi[Math.floor(kesir() * dizi.length)],
    agirlikli: (secenekler) => {
      const toplam = secenekler.reduce((t, s) => t + s[1], 0);
      let k = kesir() * toplam;
      for (const [deger, agirlik] of secenekler) {
        k -= agirlik;
        if (k <= 0) return deger;
      }
      return secenekler[secenekler.length - 1][0];
    },
    olasilik: (p) => kesir() < p,
    karistir: (dizi) => {
      for (let i = dizi.length - 1; i > 0; i--) {
        const j = Math.floor(kesir() * (i + 1));
        [dizi[i], dizi[j]] = [dizi[j], dizi[i]];
      }
      return dizi;
    },
  };
}

export const DAKIKA = 60_000;
export const SAAT = 60 * DAKIKA;
export const GUN = 24 * SAAT;

/**
 * Demo saati ile gerçek saat arasındaki fark. Çalışma saati dışında açılan
 * panel, boş görünmesin diye aynı günün yoğun saatine kayar ve bunu üst çubukta söyler.
 */
export function demoFarki(saat?: { acilis: number; kapanis: number; yogun: number }, simdi = new Date()) {
  if (!saat) return 0;
  const s = simdi.getHours() + simdi.getMinutes() / 60;
  const acik = saat.kapanis > saat.acilis ? s >= saat.acilis && s < saat.kapanis : s >= saat.acilis || s < saat.kapanis;
  if (acik) return 0;
  const hedef = new Date(simdi);
  hedef.setHours(Math.floor(saat.yogun), Math.round((saat.yogun % 1) * 60), 0, 0);
  return hedef.getTime() - simdi.getTime();
}

export function gunBasi(t: number | Date) {
  const d = new Date(t);
  d.setHours(0, 0, 0, 0);
  return d.getTime();
}

/**
 * t anından sonraki ilk mesai anı. Paket gece hazırlanmaz, kargo pazar alınmaz;
 * kayıtların geçmişi gerçek bir işletmenin saatlerine uysun diye kullanılır.
 */
export function mesaiAni(t: number, bas: number, bit: number, r: Rastgele, pazarYok = false) {
  const d = new Date(t);
  let saatNe = d.getHours() + d.getMinutes() / 60;
  let gun = gunBasi(t);
  if (saatNe >= bit) {
    gun += GUN;
    saatNe = -1;
  }
  while (pazarYok && new Date(gun).getDay() === 0) {
    gun += GUN;
    saatNe = -1;
  }
  if (saatNe < bas) return gun + bas * SAAT + r.tam(0, Math.round((bit - bas) * 24)) * DAKIKA;
  return t;
}

/* ---------------- Biçim ---------------- */

export const sayi = (n: number, ondalik = 0) =>
  n.toLocaleString("tr-TR", { minimumFractionDigits: ondalik, maximumFractionDigits: ondalik });

export const tl = (n: number) => `${sayi(Math.round(n))} TL`;

/** Büyük tutarları kısaltır: 1,24 milyon TL, 482 bin TL. */
export function tlKisa(n: number) {
  if (Math.abs(n) >= 1_000_000) return `${sayi(n / 1_000_000, 2)} milyon TL`;
  if (Math.abs(n) >= 10_000) return `${sayi(Math.round(n / 1000))} bin TL`;
  return tl(n);
}

export const yuzde = (n: number, ondalik = 0) => `yüzde ${sayi(n, ondalik)}`;

const AYLAR = ["Ocak", "Şubat", "Mart", "Nisan", "Mayıs", "Haziran", "Temmuz", "Ağustos", "Eylül", "Ekim", "Kasım", "Aralık"];
const AY_KISA = ["Oca", "Şub", "Mar", "Nis", "May", "Haz", "Tem", "Ağu", "Eyl", "Eki", "Kas", "Ara"];
export const GUNLER = ["Pazar", "Pazartesi", "Salı", "Çarşamba", "Perşembe", "Cuma", "Cumartesi"];
export const GUN_KISA = ["Paz", "Pzt", "Sal", "Çar", "Per", "Cum", "Cmt"];

export const iki = (n: number) => String(n).padStart(2, "0");
export const saat = (t: number | Date) => {
  const d = new Date(t);
  return `${iki(d.getHours())}.${iki(d.getMinutes())}`;
};
export const tarih = (t: number | Date, uzun = false) => {
  const d = new Date(t);
  return `${d.getDate()} ${(uzun ? AYLAR : AY_KISA)[d.getMonth()]}`;
};
export const tarihYil = (t: number | Date) => {
  const d = new Date(t);
  return `${d.getDate()} ${AYLAR[d.getMonth()]} ${d.getFullYear()}`;
};

/** Bugün 14.32, Dün 18.05, Yarın 10.00 ya da 9 Eki 11.20. */
export function zaman(t: number, ani: Date) {
  const fark = Math.round((gunBasi(t) - gunBasi(ani)) / GUN);
  const gun = fark === 0 ? "Bugün" : fark === -1 ? "Dün" : fark === 1 ? "Yarın" : tarih(t);
  return `${gun} ${saat(t)}`;
}

/** Bugün, Dün, Yarın ya da tarih. */
export function gunAdi(t: number, ani: Date) {
  const fark = Math.round((gunBasi(t) - gunBasi(ani)) / GUN);
  if (fark === 0) return "Bugün";
  if (fark === -1) return "Dün";
  if (fark === 1) return "Yarın";
  if (fark > 1 && fark < 7) return GUNLER[new Date(t).getDay()];
  return tarih(t);
}

/** 3 dakika önce, 2 saat önce, 4 gün önce. */
export function once(t: number, ani: Date) {
  const fark = ani.getTime() - t;
  if (fark < DAKIKA) return "Az önce";
  if (fark < SAAT) return `${Math.floor(fark / DAKIKA)} dakika önce`;
  if (fark < GUN) return `${Math.floor(fark / SAAT)} saat önce`;
  return `${Math.floor(fark / GUN)} gün önce`;
}

/** Stok ve sipariş kodları yalnız ASCII büyük harf ve rakam; barkod ve entegrasyonlar bozulmasın. */
export function kod(metin: string) {
  return metin
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/ı/g, "i")
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, "");
}

/* ---------------- Kişi havuzu ---------------- */

const KADIN = ["Ayşe", "Zeynep", "Elif", "Merve", "Selin", "Ece", "Deniz", "Derya", "Esra", "Büşra", "Gizem", "Seda", "Pınar", "Burcu", "Ceren", "İrem", "Melis", "Nazlı", "Ebru", "Tuğba", "Aslı", "Gül", "Sibel", "Dilan", "Yasemin", "Hande", "Özge", "Naz", "Ilgın", "Defne"];
const ERKEK = ["Mehmet", "Ahmet", "Mustafa", "Can", "Emre", "Burak", "Kaan", "Murat", "Onur", "Serkan", "Tolga", "Kerem", "Barış", "Cem", "Uğur", "Volkan", "Hakan", "Oğuz", "Arda", "Eren", "Furkan", "Yusuf", "Halil", "Kemal", "Sinan", "Batuhan", "Alper", "Umut", "Ozan", "Berk"];
const SOYAD = ["Yılmaz", "Kaya", "Demir", "Şahin", "Çelik", "Yıldız", "Yıldırım", "Öztürk", "Aydın", "Özdemir", "Arslan", "Doğan", "Kılıç", "Aslan", "Çetin", "Kara", "Koç", "Kurt", "Özkan", "Şimşek", "Polat", "Korkmaz", "Erdoğan", "Aktaş", "Güneş", "Bulut", "Tekin", "Acar", "Uçar", "Erdem", "Karaca", "Bozkurt", "Ateş", "Tunç", "Sarı", "Altun", "Keskin", "Güler", "Tan", "Yüksel"];

export type Kisi = { ad: string; soyad: string; tamAd: string; telefon: string; eposta: string; kadin: boolean };

export function kisi(r: Rastgele): Kisi {
  const kadin = r.olasilik(0.5);
  const ad = r.sec(kadin ? KADIN : ERKEK);
  const soyad = r.sec(SOYAD);
  const ascii = (m: string) => kod(m).toLowerCase();
  return {
    ad,
    soyad,
    tamAd: `${ad} ${soyad}`,
    kadin,
    telefon: `05${r.tam(30, 55)} ${r.tam(100, 999)} ${r.tam(10, 99)} ${r.tam(10, 99)}`,
    eposta: `${ascii(ad)}.${ascii(soyad)}${r.olasilik(0.4) ? r.tam(1, 99) : ""}@example.com`,
  };
}

/** Birbirinden farklı adlarla n kişi. */
export function kisiler(r: Rastgele, n: number): Kisi[] {
  const sonuc: Kisi[] = [];
  const goruldu = new Set<string>();
  while (sonuc.length < n) {
    const k = kisi(r);
    if (goruldu.has(k.tamAd)) continue;
    goruldu.add(k.tamAd);
    sonuc.push(k);
  }
  return sonuc;
}

export const bas = (m: string) => m.trim().split(/\s+/).map((p) => p[0]).slice(0, 2).join("").toLocaleUpperCase("tr");
