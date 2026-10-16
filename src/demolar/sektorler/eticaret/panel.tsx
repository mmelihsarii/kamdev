/*
 * E ticaret demosunun canlı paneli: Defne Ev ve Mutfak. Son 30 günün siparişleri
 * saatlik yoğunluğa göre üretilir; stok, kargo, iade ve tahsilat kayıtları
 * siparişlerden türetilir, böylece her ekran aynı veriyi anlatır.
 */
import { useState } from "react";
import { IconCheck, IconPlayerPause, IconPlayerPlay, IconPlus, IconTruckDelivery, IconUser, IconX } from "@tabler/icons-react";
import { eticaret } from "./bilgi";
import { ozetEkrani } from "../../panel/Ozet";
import { AlanListesi, Anahtar, Bolum, Cubuk, Dugme, Gecmis, MiniTablo } from "../../panel/parcalar";
import { CubukGrafik, HalkaGrafik } from "../../panel/grafik";
import { DAKIKA, GUN, GUN_KISA, SAAT, gunBasi, kisiler, kod, mesaiAni, saat, sayi, tarih, tl, tlKisa, yuzde, zaman } from "../../ortak";
import type { Durum, Kayit, PanelApi, Rastgele, SektorPanel, Veri } from "../../tipler";

const KULLANICI = { ad: "Selin Arslan", rol: "Mağaza sahibi" };

const KANALLAR = ["Site", "Trendyol", "Hepsiburada", "Instagram"] as const;
const KANAL_RENGI: Record<string, string> = { Site: "vurgu", Trendyol: "mavi", Hepsiburada: "mor", Instagram: "sari" };
const KARGOLAR = ["Yurtiçi Kargo", "Aras Kargo", "MNG Kargo"];
const SEHIRLER = ["İstanbul", "İstanbul", "İstanbul", "Ankara", "İzmir", "İzmir", "Bursa", "Antalya", "Konya", "Eskişehir", "Kocaeli", "Mersin", "Samsun", "Gaziantep", "Muğla", "Denizli"];
const BANKALAR = ["Garanti BBVA", "İş Bankası", "Yapı Kredi", "Akbank", "QNB", "Ziraat Bankası"];

const URUN_LISTESI: [string, string, number][] = [
  ["Döküm tencere 24 cm", "Pişirme", 2890],
  ["Granit tava seti, 3 parça", "Pişirme", 1749],
  ["Çelik düdüklü tencere 6 litre", "Pişirme", 2390],
  ["Bakır cezve, orta boy", "Kahve ve çay", 489],
  ["Porselen çay seti, 6 kişilik", "Kahve ve çay", 1290],
  ["French press 1 litre", "Kahve ve çay", 649],
  ["El değirmeni, seramik bıçaklı", "Kahve ve çay", 899],
  ["Cam saklama kabı seti, 5 parça", "Saklama", 539],
  ["Vakumlu saklama kabı, 1,5 litre", "Saklama", 329],
  ["Bambu ekmek kutusu", "Saklama", 459],
  ["Baharat kavanozu seti, 12 parça", "Saklama", 689],
  ["Seramik kupa seti, 4 parça", "Sofra", 399],
  ["Yemek takımı, 24 parça", "Sofra", 3490],
  ["Keten masa örtüsü", "Tekstil", 579],
  ["Pamuklu mutfak havlusu, 3 lü", "Tekstil", 249],
  ["Silikon spatula seti", "Mutfak gereçleri", 299],
  ["Bambu kesme tahtası", "Mutfak gereçleri", 349],
  ["Çelik termos 500 ml", "Kahve ve çay", 449],
  ["Şef bıçağı 20 cm", "Mutfak gereçleri", 989],
  ["Tartı, dijital mutfak", "Mutfak gereçleri", 419],
  ["Zeytinyağı şişesi, cam", "Sofra", 189],
  ["Servis tabağı, mermer desen", "Sofra", 729],
  ["Fırın eldiveni, çift", "Tekstil", 199],
  ["Önlük, kanvas", "Tekstil", 349],
  ["Doğrayıcı, 5 bıçaklı", "Mutfak gereçleri", 559],
  ["Su ısıtıcı, cam gövde", "Küçük ev aleti", 1190],
  ["Filtre kahve makinesi", "Küçük ev aleti", 1890],
  ["El blenderi seti", "Küçük ev aleti", 1590],
];

const URUN_RENKLERI = ["#64748b", "#b45309", "#0e7490", "#57534e", "#7c3aed", "#be123c", "#15803d", "#a16207"];

/* ---------------- Yardımcılar ---------------- */

const DURUM: Record<string, Durum> = {
  yeni: { ad: "Yeni", renk: "mavi" },
  hazirlaniyor: { ad: "Hazırlanıyor", renk: "sari" },
  kargoda: { ad: "Kargoda", renk: "mor" },
  teslim: { ad: "Teslim edildi", renk: "yesil" },
  iptal: { ad: "İptal edildi", renk: "gri" },
};

const toplam = (s: Kayit) => s.araToplam - s.indirim + s.kargoUcreti;
const sayilir = (s: Kayit) => s.durum !== "iptal";

/** Müşteri başına toplamlar; siparişler değişmedikçe yeniden hesaplanmaz. */
const ozetOnbellek = new WeakMap<Kayit[], Map<string, { adet: number; tutar: number; son: number }>>();
function musteriOzeti(api: PanelApi) {
  const siparisler = api.veri.siparisler;
  let m = ozetOnbellek.get(siparisler);
  if (!m) {
    m = new Map();
    for (const s of siparisler) {
      if (!sayilir(s)) continue;
      const o = m.get(s.musteriId) ?? { adet: 0, tutar: 0, son: 0 };
      o.adet++;
      o.tutar += toplam(s);
      o.son = Math.max(o.son, s.t);
      m.set(s.musteriId, o);
    }
    ozetOnbellek.set(siparisler, m);
  }
  return m;
}
function musteri(k: Kayit, api: PanelApi) {
  const o = musteriOzeti(api).get(k.id) ?? { adet: 0, tutar: 0, son: 0 };
  const adet = o.adet + k.onceki.adet;
  const tutar = o.tutar + k.onceki.tutar;
  const son = Math.max(o.son, k.onceki.son);
  const gun = (api.ani.getTime() - son) / GUN;
  const grup = k.onceki.adet === 0 && o.adet <= 1 ? "Yeni" : adet >= 8 ? "Sadık" : gun > 90 ? "Uykuda" : "Ara sıra";
  return { adet, tutar, son, grup };
}

const satisOnbellek = new WeakMap<Kayit[], Map<string, number>>();
function satis30(api: PanelApi) {
  const siparisler = api.veri.siparisler;
  let m = satisOnbellek.get(siparisler);
  if (!m) {
    m = new Map();
    const sinir = api.ani.getTime() - 30 * GUN;
    for (const s of siparisler) if (sayilir(s) && s.t >= sinir) for (const k of s.kalemler) m.set(k.urunId, (m.get(k.urunId) ?? 0) + k.adet);
    satisOnbellek.set(siparisler, m);
  }
  return m;
}

const urunDurumu = (u: Kayit): Durum =>
  !u.kanallar.Site && !u.kanallar.Trendyol && !u.kanallar.Hepsiburada
    ? { ad: "Satışa kapalı", renk: "gri" }
    : u.stok === 0
      ? { ad: "Tükendi", renk: "kirmizi" }
      : u.stok <= u.kritik
        ? { ad: "Azalıyor", renk: "sari" }
        : { ad: "Satışta", renk: "yesil" };

const kargoGunu = (s: Kayit, api: PanelApi) => ((s.teslimT ?? api.ani.getTime()) - s.kargo.t) / GUN;
const kargoDurumu = (s: Kayit, api: PanelApi): Durum =>
  s.durum === "teslim" ? { ad: "Teslim edildi", renk: "yesil" } : kargoGunu(s, api) > 3 ? { ad: "Gecikiyor", renk: "kirmizi" } : { ad: "Yolda", renk: "mor" };

const takipNo = (r: Rastgele) => `${r.tam(1000, 9999)} ${r.tam(1000, 9999)} ${r.tam(1000, 9999)}`;

/* ---------------- Veri üretimi ---------------- */

// Saatlik sipariş yoğunluğu: gece az, öğle arası ve akşam yoğun.
const SAAT_AGIRLIGI = [2, 1, 1, 0.5, 0.5, 0.5, 1, 2, 3, 4, 5, 6, 7, 6, 6, 6, 6, 7, 8, 10, 12, 12, 9, 5];

function uret(ani: Date, r: Rastgele): Veri {
  const simdi = ani.getTime();
  const urunler: Kayit[] = URUN_LISTESI.map(([ad, kategori, fiyat], i) => {
    const kritik = r.sec([5, 8, 10, 15]);
    return {
      id: `u${i + 1}`,
      ad,
      kategori,
      kod: `DFN${kod(kategori).slice(0, 3)}${1001 + i}`,
      fiyat,
      maliyet: Math.round(fiyat * (0.42 + r.kesir() * 0.18)),
      stok: r.tam(kritik + 4, 140),
      kritik,
      renk: URUN_RENKLERI[i % URUN_RENKLERI.length],
      populerlik: 0.3 + r.kesir() * (i < 12 ? 2 : 1),
      kanallar: { Site: true, Trendyol: r.olasilik(0.8), Hepsiburada: r.olasilik(0.6) },
      gecmis: [],
    };
  });
  // Birkaç ürün azalmış, biri tükenmiş olsun; özet ekranının uyarısı boş kalmasın.
  const azalanlar = r.karistir([...urunler]).slice(0, 4);
  azalanlar[0].stok = 0;
  azalanlar.slice(1).forEach((u) => (u.stok = r.tam(1, u.kritik)));
  urunler[urunler.length - 1].kanallar = { Site: false, Trendyol: false, Hepsiburada: false };

  const kisi = kisiler(r, 420);
  const musteriler: Kayit[] = kisi.map((k, i) => {
    const eski = r.olasilik(0.7);
    // Müşterilerin bir kısmı uykuda, çoğu ara sıra, azı çok sık alışveriş yapar.
    const uykuda = eski && r.olasilik(0.22);
    return {
      aktiflik: uykuda ? 0 : Math.pow(r.kesir(), 2.4) + 0.02,
      id: `m${i + 1}`,
      ad: k.tamAd,
      telefon: k.telefon,
      eposta: k.eposta,
      sehir: r.sec(SEHIRLER),
      kayit: simdi - (eski ? r.tam(40, 700) : r.tam(0, 30)) * GUN,
      onceki: eski ? { adet: r.tam(1, 4), tutar: r.tam(600, 9000), son: simdi - (uykuda ? r.tam(95, 300) : r.tam(32, 90)) * GUN } : { adet: 0, tutar: 0, son: 0 },
      gecmis: [],
    };
  });

  const toplamPopulerlik = urunler.reduce((t, u) => t + u.populerlik, 0);
  const urunSec = () => {
    let k = r.kesir() * toplamPopulerlik;
    for (const u of urunler) if ((k -= u.populerlik) <= 0) return u;
    return urunler[0];
  };

  const toplamAktiflik = musteriler.reduce((t, m) => t + m.aktiflik, 0);
  const musteriSec = () => {
    let k = r.kesir() * toplamAktiflik;
    for (const m of musteriler) if ((k -= m.aktiflik) <= 0) return m;
    return musteriler[0];
  };

  const siparisler: Kayit[] = [];
  const tahsilatlar: Kayit[] = [];
  const iadeler: Kayit[] = [];
  let no = 41200;
  const baslangic = gunBasi(simdi) - 30 * GUN;
  for (let gun = baslangic; gun <= simdi; gun += GUN) {
    const hafta = new Date(gun).getDay();
    const gunluk = Math.round((hafta === 0 ? 44 : hafta === 6 ? 40 : 30) * (0.8 + r.kesir() * 0.4));
    // Sipariş numaraları zamana göre artsın diye önce günün saatleri seçilip sıralanır.
    const zamanlar = Array.from({ length: gunluk }, () => gun + r.agirlikli(SAAT_AGIRLIGI.map((a, s) => [s, a] as const)) * SAAT + r.tam(0, 59) * DAKIKA)
      .filter((t) => t <= simdi)
      .sort((a, b) => a - b);
    for (const t of zamanlar) {
      const kanal = r.agirlikli([["Site", 46], ["Trendyol", 28], ["Hepsiburada", 16], ["Instagram", 10]] as const);
      const m = musteriSec();
      const kalemSayisi = r.agirlikli([[1, 60], [2, 28], [3, 12]] as const);
      const kalemler: { urunId: string; adet: number; fiyat: number }[] = [];
      for (let j = 0; j < kalemSayisi; j++) {
        const u = urunSec();
        if (kalemler.some((k) => k.urunId === u.id)) continue;
        kalemler.push({ urunId: u.id, adet: r.agirlikli([[1, 80], [2, 17], [3, 3]] as const), fiyat: u.fiyat });
      }
      const araToplam = kalemler.reduce((s, k) => s + k.adet * k.fiyat, 0);
      const kupon = kanal === "Site" && r.olasilik(0.18) ? r.sec(["HOSGELDIN10", "MUTFAK15", "EKIM200"]) : null;
      const indirim = kupon === "EKIM200" ? 200 : kupon === "MUTFAK15" ? Math.round(araToplam * 0.15) : kupon === "HOSGELDIN10" ? Math.round(araToplam * 0.1) : 0;
      const kargoUcreti = kanal === "Site" && araToplam < 750 ? 59 : 0;
      // Her adım mesai saatinde olur: paket gündüz hazırlanır, kargo öğleden sonra alınır, teslim gündüz yapılır.
      const iptal = r.olasilik(0.025);
      const hazirT = mesaiAni(t + r.tam(20, 180) * DAKIKA, 9, 18, r);
      let kargoT = mesaiAni(hazirT + r.tam(60, 240) * DAKIKA, 15, 18, r, true);
      if (r.olasilik(0.05)) kargoT = mesaiAni(kargoT + r.tam(1, 2) * GUN, 15, 18, r, true);
      const teslimT = mesaiAni(kargoT + r.tam(18, 60) * SAAT, 9, 20, r, true);
      const durum = iptal ? "iptal" : teslimT <= simdi ? "teslim" : kargoT <= simdi ? "kargoda" : hazirT <= simdi ? "hazirlaniyor" : "yeni";

      const odeme = kanal === "Trendyol" || kanal === "Hepsiburada" ? "Pazaryeri" : r.agirlikli([["Kredi kartı", 78], ["Havale", 12], ["Kapıda ödeme", 10]] as const);
      const taksit = odeme === "Kredi kartı" ? r.agirlikli([[1, 55], [3, 25], [6, 15], [9, 5]] as const) : 1;
      const id = String(++no);
      const gecmis: { t: number; m: string }[] = [{ t, m: `Sipariş alındı, ${kanal}` }];
      const s: Kayit = { id, musteriId: m.id, kanal, kalemler, araToplam, indirim, kupon, kargoUcreti, odeme, taksit, durum, t, sehir: m.sehir, gecmis };
      if (iptal) gecmis.unshift({ t: Math.min(simdi, t + r.tam(10, 120) * DAKIKA), m: "Müşteri isteğiyle iptal edildi" });
      if (durum !== "yeni" && !iptal) gecmis.unshift({ t: hazirT, m: `Hazırlamaya alındı, ${r.sec(["Selin Arslan", "Kaan Uçar"])}` });
      if (durum === "kargoda" || durum === "teslim") {
        s.kargo = { firma: r.sec(KARGOLAR), takip: takipNo(r), t: kargoT };
        gecmis.unshift({ t: kargoT, m: `Kargoya verildi, ${s.kargo.firma}, takip no ${s.kargo.takip}` });
      }
      if (durum === "teslim") {
        s.teslimT = teslimT;
        gecmis.unshift({ t: teslimT, m: "Teslim edildi, alıcı imzaladı" });
      }
      siparisler.push(s);

      if (durum !== "iptal") {
        const tutar = toplam(s);
        const oran = odeme === "Pazaryeri" ? (kanal === "Trendyol" ? 0.19 : 0.17) : odeme === "Kredi kartı" ? 0.0249 + (taksit - 1) * 0.011 : odeme === "Kapıda ödeme" ? 0.03 : 0;
        const gecis = odeme === "Pazaryeri" ? (s.teslimT ?? t + 4 * GUN) + 14 * GUN : odeme === "Kredi kartı" ? gunBasi(t) + GUN + 10 * SAAT : odeme === "Kapıda ödeme" ? (s.teslimT ?? t + 4 * GUN) + 3 * GUN : t + 2 * SAAT;
        tahsilatlar.push({
          id: `T${id}`,
          siparisId: id,
          t,
          yontem: odeme,
          banka: odeme === "Kredi kartı" ? r.sec(BANKALAR) : odeme === "Pazaryeri" ? kanal : "",
          taksit,
          tutar,
          komisyon: Math.round(tutar * oran),
          gecisT: gecis,
          iade: false,
          gecmis: [],
        });
      }

      // Teslim edilenlerin küçük bir kısmı iade talebine döner.
      if (durum === "teslim" && simdi - t < 20 * GUN && r.olasilik(0.04)) {
        const k = r.sec(kalemler);
        const it = s.teslimT + r.tam(10, 70) * SAAT;
        if (it < simdi) {
          const bekliyor = simdi - it < 2.5 * GUN;
          iadeler.push({
            id: `I${id}`,
            siparisId: id,
            urunId: k.urunId,
            adet: 1,
            tutar: k.fiyat,
            neden: r.sec(["Ürün hasarlı geldi", "Beklediğim gibi değil", "Yanlış ürün gönderildi", "Beden ve ölçü uymadı", "Fikrimi değiştirdim"]),
            t: it,
            durum: bekliyor ? "bekliyor" : r.olasilik(0.85) ? "onaylandi" : "reddedildi",
            gecmis: [{ t: it, m: "Müşteri iade talebi açtı" }],
          });
        }
      }
    }
  }
  // En az iki iade onay beklesin; görev ekranı boş kalmasın.
  const teslimler = siparisler.filter((s) => s.durum === "teslim" && simdi - s.teslimT < 2 * GUN);
  while (iadeler.filter((i) => i.durum === "bekliyor").length < 2 && teslimler.length) {
    const s = teslimler.pop()!;
    const k = s.kalemler[0];
    const it = Math.min(simdi - 30 * DAKIKA, s.teslimT + 5 * SAAT);
    iadeler.push({ id: `I${s.id}`, siparisId: s.id, urunId: k.urunId, adet: 1, tutar: k.fiyat, neden: "Ürün hasarlı geldi", t: it, durum: "bekliyor", gecmis: [{ t: it, m: "Müşteri iade talebi açtı, fotoğraf ekledi" }] });
  }
  // Bir iki gönderi yolda takılmış olsun: beş altı gün önce kargoya verilip hâlâ teslim edilmemiş.
  siparisler
    .filter((s) => s.durum === "teslim" && simdi - s.kargo.t > 4 * GUN && simdi - s.kargo.t < 6 * GUN && !iadeler.some((i) => i.siparisId === s.id))
    .slice(0, 2)
    .forEach((s) => {
      s.durum = "kargoda";
      delete s.teslimT;
      s.gecmis = s.gecmis.filter((g: Kayit) => !g.m.startsWith("Teslim"));
    });

  const kuponlar: Kayit[] = [
    { id: "k1", kod: "HOSGELDIN10", tur: "yuzde", deger: 10, sinir: 0, bitis: simdi + 120 * GUN, aktif: true, aciklama: "İlk siparişe yüzde 10" },
    { id: "k2", kod: "MUTFAK15", tur: "yuzde", deger: 15, sinir: 300, bitis: simdi + 9 * GUN, aktif: true, aciklama: "Pişirme kategorisi kampanyası" },
    { id: "k3", kod: "EKIM200", tur: "tutar", deger: 200, sinir: 150, bitis: simdi + 19 * GUN, aktif: true, aciklama: "1.500 TL üstü siparişe 200 TL" },
    { id: "k4", kod: "YAZSONU20", tur: "yuzde", deger: 20, sinir: 200, bitis: simdi - 12 * GUN, aktif: false, aciklama: "Yaz sonu indirimi" },
    { id: "k5", kod: "GERIDON25", tur: "yuzde", deger: 25, sinir: 50, bitis: simdi + 30 * GUN, aktif: true, aciklama: "Uykudaki müşterilere geri dönüş" },
  ].map((k) => ({ ...k, gecmis: [] }));

  return { urunler, musteriler, siparisler: siparisler.reverse(), tahsilatlar: tahsilatlar.reverse(), iadeler: iadeler.sort((a, b) => b.t - a.t), kuponlar };
}

/* ---------------- Ortak hesaplar ---------------- */

function aralikSatis(api: PanelApi, bas: number, son: number) {
  let tutar = 0;
  let adet = 0;
  for (const s of api.veri.siparisler) if (sayilir(s) && s.t >= bas && s.t < son) {
    tutar += toplam(s);
    adet++;
  }
  return { tutar, adet };
}

const oranFarki = (yeni: number, eski: number) => (eski ? ((yeni - eski) / eski) * 100 : 0);

const urunAdi = (api: PanelApi, id: string) => api.bul("urunler", id)?.ad ?? "Silinmiş ürün";
const musteriAdi = (api: PanelApi, id: string) => api.bul("musteriler", id)?.ad ?? "Misafir";

/* ---------------- Ekranlar ---------------- */

const gunlukSatis = (api: PanelApi, gun = 14) => {
  const bugun = gunBasi(api.ani);
  return Array.from({ length: gun }, (_, i) => aralikSatis(api, bugun - (gun - i) * GUN, bugun - (gun - 1 - i) * GUN));
};

const ozet = ozetEkrani({
  kullanici: KULLANICI.ad,
  uyarilar: (api) => uyarilar(api),
  karsilama: (api) => {
    const s = api.ani.getTime();
    const son = aralikSatis(api, s - GUN, s);
    return `Son 24 saatte ${son.adet} sipariş geldi, toplam ${tl(son.tutar)}.`;
  },
  sayilar: (api) => {
    const s = api.ani.getTime();
    const son24 = aralikSatis(api, s - GUN, s);
    const gecenHafta = aralikSatis(api, s - 8 * GUN, s - 7 * GUN);
    const ay = aralikSatis(api, s - 30 * GUN, s);
    const hazirlanacak = api.veri.siparisler.filter((x) => x.durum === "yeni" || x.durum === "hazirlaniyor").length;
    return [
      {
        ad: "Son 24 saatin satışı",
        deger: sayi(son24.tutar),
        birim: "TL",
        degisim: { oran: oranFarki(son24.tutar, gecenHafta.tutar), iyi: son24.tutar >= gecenHafta.tutar, metin: "geçen haftanın aynı saatlerine göre" },
        not: "Şu andan geriye 24 saat içinde gelen, iptal edilmemiş siparişlerin toplamı. Takvim günü yerine son 24 saat kullanılır; sabah erken saatte de anlamlı bir sayı görürsünüz.",
        seri: gunlukSatis(api).map((x) => x.tutar),
        git: () => api.git("siparisler"),
      },
      {
        ad: "Son 24 saatin siparişi",
        deger: sayi(son24.adet),
        degisim: { oran: oranFarki(son24.adet, gecenHafta.adet), iyi: son24.adet >= gecenHafta.adet, metin: "geçen haftanın aynı saatlerine göre" },
        not: "Bütün kanallardan gelen siparişlerin sayısı. İptal edilenler sayılmaz.",
        seri: gunlukSatis(api).map((x) => x.adet),
        git: () => api.git("siparisler"),
      },
      {
        ad: "Sepet ortalaması, 30 gün",
        deger: sayi(ay.adet ? ay.tutar / ay.adet : 0),
        birim: "TL",
        alt: `${sayi(ay.adet)} siparişin ortalaması`,
        not: "Son 30 günde iptal edilmemiş siparişlerin toplam tutarı, sipariş sayısına bölünür. Kargo ücreti dahil, kupon indirimi düşülmüş.",
      },
      {
        ad: "Hazırlanacak sipariş",
        deger: sayi(hazirlanacak),
        renk: hazirlanacak > 20 ? "sari" : undefined,
        alt: "Yeni ve hazırlanıyor durumundakiler",
        not: "Henüz kargoya verilmemiş siparişler. Kartın üstüne tıklayınca liste bu siparişlerle süzülmüş açılır.",
        git: () => api.git("siparisler", { filtre: "Durum=Hazırlanacaklar" }),
      },
    ];
  },
  ana: {
    baslik: "Günlük satış, son 14 gün",
    icerik: (api) => {
      const bugun = gunBasi(api.ani);
      const veri = Array.from({ length: 15 }, (_, i) => {
        const g = bugun - (14 - i) * GUN;
        const { tutar } = aralikSatis(api, g, g + GUN);
        const d = new Date(g);
        return { etiket: i === 14 ? "Bugün" : `${d.getDate()}`, uzunEtiket: i === 14 ? `Bugün, saat ${saat(api.ani)} itibarıyla` : `${tarih(g)} ${GUN_KISA[d.getDay()]}`, deger: tutar, kismi: i === 14 };
      });
      const ortalama = veri.slice(0, 14).reduce((t, v) => t + v.deger, 0) / 14;
      return <CubukGrafik veri={veri} bicim={tl} hedef={Math.round((ortalama * 1.1) / 1000) * 1000} hedefAdi="Günlük hedef" ozet={`14 günün ortalaması ${tl(ortalama)}`} />;
    },
  },
  parcalar: [
    {
      baslik: "Kanallara göre satış, 30 gün",
      icerik: (api) => {
        const sinir = api.ani.getTime() - 30 * GUN;
        const dilimler = KANALLAR.map((k) => ({
          ad: k,
          renk: KANAL_RENGI[k],
          deger: api.veri.siparisler.filter((s) => s.kanal === k && sayilir(s) && s.t >= sinir).reduce((t, s) => t + toplam(s), 0),
        }));
        return <HalkaGrafik dilimler={dilimler} bicim={tlKisa} merkez={tlKisa(dilimler.reduce((t, d) => t + d.deger, 0))} />;
      },
    },
    {
      baslik: "En çok satanlar, 30 gün",
      icerik: (api) => {
        const m = satis30(api);
        const liste = [...m.entries()].sort((a, b) => b[1] - a[1]).slice(0, 5);
        const enCok = liste[0]?.[1] ?? 1;
        return (
          <ul className="space-y-3">
            {liste.map(([id, adet]) => (
              <li key={id}>
                <button type="button" onClick={() => api.git("urunler", { kayit: id })} className="block w-full text-left">
                  <span className="mb-1 flex justify-between gap-3 text-[12.5px]">
                    <span className="truncate text-[var(--m)]">{urunAdi(api, id)}</span>
                    <span className="shrink-0 tabular-nums text-[var(--ms)]">{adet} adet</span>
                  </span>
                  <Cubuk oran={adet / enCok} />
                </button>
              </li>
            ))}
          </ul>
        );
      },
    },
  ],
});

function uyarilar(api: PanelApi) {
  const s = api.ani.getTime();
  const liste: ReturnType<SektorPanel["uyarilar"]> = [];
  const yeni = api.veri.siparisler.filter((x) => x.durum === "yeni").length;
  const bekleyen = api.veri.siparisler.filter((x) => x.durum === "hazirlaniyor" && s - x.t > GUN).length;
  const tukenen = api.veri.urunler.filter((u) => u.stok === 0 && urunDurumu(u).ad === "Tükendi").length;
  const azalan = api.veri.urunler.filter((u) => urunDurumu(u).ad === "Azalıyor").length;
  const iade = api.veri.iadeler.filter((i) => i.durum === "bekliyor").length;
  const geciken = api.veri.siparisler.filter((x) => x.durum === "kargoda" && kargoGunu(x, api) > 3).length;
  if (yeni) liste.push({ metin: `${yeni} yeni sipariş hazırlanmayı bekliyor`, modul: "siparisler", filtre: "Durum=Yeni", renk: "mavi" });
  if (bekleyen) liste.push({ metin: `${bekleyen} sipariş bir günden uzun süredir hazırlanıyor`, modul: "siparisler", filtre: "Durum=Bir günü geçenler", renk: "kirmizi" });
  if (tukenen) liste.push({ metin: `${tukenen} ürün tükendi, satışta görünmüyor`, modul: "urunler", filtre: "Stok=Tükenenler", renk: "kirmizi" });
  if (azalan) liste.push({ metin: `${azalan} ürünün stoğu kritik seviyenin altında`, modul: "urunler", filtre: "Stok=Azalanlar", renk: "sari" });
  if (iade) liste.push({ metin: `${iade} iade talebi onay bekliyor`, modul: "iadeler", filtre: "Durum=Onay bekliyor", renk: "sari" });
  if (geciken) liste.push({ metin: `${geciken} gönderi üç günden uzun süredir kargoda`, modul: "kargo", filtre: "Durum=Gecikenler", renk: "kirmizi" });
  return liste;
}

function SiparisDetayi({ s, api }: { s: Kayit; api: PanelApi }) {
  const m = api.bul("musteriler", s.musteriId);
  return (
    <>
      <Bolum baslik="Sipariş">
        <AlanListesi
          alanlar={[
            ["Kanal", s.kanal],
            ["Sipariş zamanı", zaman(s.t, api.ani)],
            ["Ödeme", s.odeme === "Kredi kartı" ? `Kredi kartı, ${s.taksit === 1 ? "tek çekim" : `${s.taksit} taksit`}` : s.odeme],
            ["Teslimat", s.sehir],
          ]}
        />
      </Bolum>
      <Bolum
        baslik="Müşteri"
        sag={
          m && (
            <button type="button" onClick={() => api.git("musteriler", { kayit: m.id })} className="text-[12px] font-semibold text-[var(--p)] hover:underline">
              Müşteriyi aç
            </button>
          )
        }
      >
        <AlanListesi alanlar={[["Ad", m?.ad ?? "Misafir"], ["Telefon", m?.telefon], ["E posta", m?.eposta]]} />
      </Bolum>
      <Bolum baslik="Ürünler">
        <MiniTablo
          basliklar={["Ürün", "Adet", "Tutar"]}
          sagdakiler={[1, 2]}
          satirlar={[
            ...s.kalemler.map((k: Kayit) => [urunAdi(api, k.urunId), k.adet, tl(k.adet * k.fiyat)]),
            ...(s.indirim ? [[<span className="text-[var(--ms)]">İndirim, {s.kupon}</span>, "", <span className="text-[var(--yesil)]">{tl(s.indirim)} az</span>]] : []),
            ...(s.kargoUcreti ? [[<span className="text-[var(--ms)]">Kargo</span>, "", tl(s.kargoUcreti)]] : []),
            [<strong>Toplam</strong>, "", <strong>{tl(toplam(s))}</strong>],
          ]}
        />
      </Bolum>
      {s.kargo && (
        <Bolum baslik="Kargo">
          <AlanListesi alanlar={[["Firma", s.kargo.firma], ["Takip no", s.kargo.takip], ["Gönderim", zaman(s.kargo.t, api.ani)], ["Teslim", s.teslimT ? zaman(s.teslimT, api.ani) : "Yolda"]]} />
        </Bolum>
      )}
      <Bolum baslik="Geçmiş">
        <Gecmis satirlar={s.gecmis.map((g: Kayit) => ({ zaman: zaman(g.t, api.ani), metin: g.m }))} />
      </Bolum>
    </>
  );
}

function stokGeriKoy(api: PanelApi, kalemler: { urunId: string; adet: number }[]) {
  for (const k of kalemler) {
    const u = api.bul("urunler", k.urunId);
    if (u) api.guncelle("urunler", u.id, { stok: u.stok + k.adet });
  }
}

function FiyatDuzenle({ u, api }: { u: Kayit; api: PanelApi }) {
  const [fiyat, setFiyat] = useState(String(u.fiyat));
  const yeni = Number(fiyat.replace(",", "."));
  const gecerli = yeni > 0 && yeni !== u.fiyat;
  const oran = yeni > 0 ? ((yeni - u.maliyet) / yeni) * 100 : 0;
  return (
    <div>
      <div className="flex items-center gap-2">
        <label className="relative flex-1">
          <span className="sr-only">Satış fiyatı</span>
          <input
            value={fiyat}
            inputMode="decimal"
            onChange={(e) => setFiyat(e.target.value)}
            className="h-9 w-full rounded-lg border border-[var(--k)] bg-transparent pl-3 pr-10 text-[13px] tabular-nums text-[var(--m)] outline-none focus:border-[var(--p)]"
          />
          <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-[12px] text-[var(--ms)]">TL</span>
        </label>
        <Dugme
          tur="ana"
          disabled={!gecerli}
          onClick={() => {
            api.guncelle("urunler", u.id, { fiyat: Math.round(yeni) }, `Fiyat ${tl(u.fiyat)} yerine ${tl(yeni)} oldu`);
            api.haber("Yeni fiyat site ve açık pazaryerlerine gönderildi", "basari");
            api.olay("fiyat");
          }}
        >
          Kaydet
        </Dugme>
      </div>
      <p className="mt-2 text-[12px] text-[var(--ms)]">
        Bu fiyatla brüt kâr oranı <strong style={{ color: oran < 25 ? "var(--kirmizi)" : "var(--yesil)" }}>{yuzde(oran)}</strong>, birim maliyet {tl(u.maliyet)}.
      </p>
    </div>
  );
}

const panel: SektorPanel = {
  kullanici: KULLANICI,
  uret,
  uyarilar,
  moduller: [
    { id: "ozet", grup: "Genel", ekran: ozet },
    {
      id: "siparisler",
      grup: "Satış",
      rozet: (api) => api.veri.siparisler.filter((s) => s.durum === "yeni").length,
      ekran: {
        tur: "liste",
        koleksiyon: "siparisler",
        baslikAdi: "Sipariş",
        baslik: (s) => `Sipariş ${s.id}`,
        alt: (s, api) => musteriAdi(api, s.musteriId),
        harf: (s, api) => musteriAdi(api, s.musteriId),
        durum: (s) => DURUM[s.durum],
        arama: (s, api) => `${musteriAdi(api, s.musteriId)} ${s.kanal} ${s.sehir} ${s.kargo?.takip ?? ""} ${s.kalemler.map((k: Kayit) => urunAdi(api, k.urunId)).join(" ")}`,
        sira: (a, b) => b.t - a.t,
        sutunlar: [
          { ad: "Zaman", deger: (s, api) => zaman(s.t, api.ani), sirala: (s) => s.t, oncelik: 1 },
          { ad: "Kanal", deger: (s) => s.kanal, sirala: (s) => s.kanal, oncelik: 2 },
          { ad: "Ürün", deger: (s, api) => (s.kalemler.length > 1 ? `${urunAdi(api, s.kalemler[0].urunId)} ve ${s.kalemler.length - 1} ürün daha` : urunAdi(api, s.kalemler[0].urunId)), oncelik: 3 },
          { ad: "Ödeme", deger: (s) => (s.odeme === "Kredi kartı" && s.taksit > 1 ? `${s.taksit} taksit` : s.odeme), oncelik: 3 },
          { ad: "Tutar", deger: (s) => tl(toplam(s)), sirala: toplam, csv: toplam, hiza: "sag", oncelik: 1 },
        ],
        filtreler: [
          {
            ad: "Durum",
            secenekler: [
              { ad: "Hazırlanacaklar", kosul: (s) => s.durum === "yeni" || s.durum === "hazirlaniyor" },
              { ad: "Yeni", kosul: (s) => s.durum === "yeni" },
              { ad: "Hazırlanıyor", kosul: (s) => s.durum === "hazirlaniyor" },
              { ad: "Bir günü geçenler", kosul: (s, api) => s.durum === "hazirlaniyor" && api.ani.getTime() - s.t > GUN },
              { ad: "Kargoda", kosul: (s) => s.durum === "kargoda" },
              { ad: "Teslim edildi", kosul: (s) => s.durum === "teslim" },
              { ad: "İptal edildi", kosul: (s) => s.durum === "iptal" },
            ],
          },
          { ad: "Kanal", secenekler: KANALLAR.map((k) => ({ ad: k, kosul: (s: Kayit) => s.kanal === k })) },
          { ad: "Ödeme", secenekler: ["Kredi kartı", "Pazaryeri", "Havale", "Kapıda ödeme"].map((o) => ({ ad: o, kosul: (s: Kayit) => s.odeme === o })) },
        ],
        ozet: (api) => {
          const s = api.ani.getTime();
          const son = aralikSatis(api, s - GUN, s);
          const l = api.veri.siparisler;
          return [
            { ad: "Son 24 saat", deger: `${son.adet} sipariş`, not: tl(son.tutar) },
            { ad: "Yeni", deger: String(l.filter((x) => x.durum === "yeni").length), renk: "mavi" },
            { ad: "Hazırlanıyor", deger: String(l.filter((x) => x.durum === "hazirlaniyor").length), renk: "sari" },
            { ad: "Kargoda", deger: String(l.filter((x) => x.durum === "kargoda").length), renk: "mor" },
          ];
        },
        detay: {
          bolumler: (s, api) => <SiparisDetayi s={s} api={api} />,
          eylemler: [
            {
              ad: "Hazırlamaya al",
              tur: "ana",
              ikon: IconCheck,
              gorunur: (s) => s.durum === "yeni",
              uygula: (s, api) => {
                api.guncelle("siparisler", s.id, { durum: "hazirlaniyor" }, `Hazırlamaya alındı, ${KULLANICI.ad}`);
                api.haber(`Sipariş ${s.id} hazırlanıyor. Depo listesine düştü.`, "basari");
                api.olay("siparis-hazirla");
              },
            },
            {
              ad: "Kargoya ver",
              tur: "ana",
              ikon: IconTruckDelivery,
              gorunur: (s) => s.durum === "hazirlaniyor",
              uygula: (s, api) => {
                const r = Math.random;
                const takip = `${1000 + Math.floor(r() * 9000)} ${1000 + Math.floor(r() * 9000)} ${1000 + Math.floor(r() * 9000)}`;
                const firma = KARGOLAR[Math.floor(r() * KARGOLAR.length)];
                api.guncelle("siparisler", s.id, { durum: "kargoda", kargo: { firma, takip, t: api.ani.getTime() } }, `Kargoya verildi, ${firma}, takip no ${takip}`);
                api.haber("Takip numarası müşteriye SMS ve e posta ile gönderildi", "basari");
                api.olay("siparis-kargo");
              },
            },
            {
              ad: "Teslim edildi",
              ikon: IconCheck,
              gorunur: (s) => s.durum === "kargoda",
              uygula: (s, api) => {
                api.guncelle("siparisler", s.id, { durum: "teslim", teslimT: api.ani.getTime() }, "Teslim edildi olarak işaretlendi");
                api.haber("Sipariş kapandı, müşteriye değerlendirme daveti gitti", "basari");
              },
            },
            {
              ad: "İptal et",
              tur: "tehlike",
              ikon: IconX,
              gorunur: (s) => s.durum === "yeni" || s.durum === "hazirlaniyor",
              uygula: (s, api) => {
                api.guncelle("siparisler", s.id, { durum: "iptal" }, `İptal edildi, ${KULLANICI.ad}`);
                stokGeriKoy(api, s.kalemler);
                const t = api.veri.tahsilatlar.find((x) => x.siparisId === s.id);
                if (t) api.guncelle("tahsilatlar", t.id, { iade: true });
                api.haber("Sipariş iptal edildi. Ürünler stoğa döndü, ödeme iadesi başlatıldı.", "bilgi");
              },
            },
          ],
        },
      },
    },
    {
      id: "urunler",
      grup: "Satış",
      rozet: (api) => api.veri.urunler.filter((u) => ["Azalıyor", "Tükendi"].includes(urunDurumu(u).ad)).length,
      ekran: {
        tur: "liste",
        koleksiyon: "urunler",
        baslikAdi: "Ürün",
        baslik: (u) => u.ad,
        alt: (u) => `${u.kod}, ${u.kategori}`,
        durum: urunDurumu,
        arama: (u) => `${u.kod} ${u.kategori}`,
        sutunlar: [
          { ad: "Fiyat", deger: (u) => tl(u.fiyat), sirala: (u) => u.fiyat, csv: (u) => u.fiyat, hiza: "sag", oncelik: 1 },
          {
            ad: "Stok",
            deger: (u) => <span style={{ color: u.stok <= u.kritik ? (u.stok === 0 ? "var(--kirmizi)" : "var(--sari)") : undefined }}>{u.stok}</span>,
            sirala: (u) => u.stok,
            csv: (u) => u.stok,
            hiza: "sag",
            oncelik: 1,
          },
          { ad: "Satış, 30 gün", deger: (u, api) => `${satis30(api).get(u.id) ?? 0} adet`, sirala: (u) => u.populerlik, hiza: "sag", oncelik: 2 },
          { ad: "Kâr oranı", deger: (u) => yuzde(((u.fiyat - u.maliyet) / u.fiyat) * 100), sirala: (u) => (u.fiyat - u.maliyet) / u.fiyat, hiza: "sag", oncelik: 3 },
          { ad: "Kanallar", deger: (u) => Object.entries(u.kanallar).filter(([, a]) => a).map(([k]) => k).join(", ") || "Kapalı", oncelik: 3 },
        ],
        filtreler: [
          {
            ad: "Stok",
            secenekler: [
              { ad: "Azalanlar", kosul: (u) => urunDurumu(u).ad === "Azalıyor" },
              { ad: "Tükenenler", kosul: (u) => urunDurumu(u).ad === "Tükendi" },
              { ad: "Yeterli", kosul: (u) => urunDurumu(u).ad === "Satışta" },
            ],
          },
          { ad: "Kategori", secenekler: [...new Set(URUN_LISTESI.map((u) => u[1]))].map((k) => ({ ad: k, kosul: (u: Kayit) => u.kategori === k })) },
        ],
        ozet: (api) => {
          const u = api.veri.urunler;
          return [
            { ad: "Ürün", deger: String(u.length) },
            { ad: "Stok değeri", deger: tlKisa(u.reduce((t, x) => t + x.stok * x.maliyet, 0)), not: "Maliyet fiyatıyla" },
            { ad: "Azalan", deger: String(u.filter((x) => urunDurumu(x).ad === "Azalıyor").length), renk: "sari" },
            { ad: "Tükenen", deger: String(u.filter((x) => urunDurumu(x).ad === "Tükendi").length), renk: "kirmizi" },
          ];
        },
        detay: {
          bolumler: (u, api) => (
            <>
              <Bolum baslik="Ürün">
                <div className="mb-4 flex items-center gap-3">
                  <span className="h-14 w-14 shrink-0 rounded-xl" style={{ background: `linear-gradient(135deg, ${u.renk}, ${u.renk}55)` }} />
                  <span className="text-[12.5px] leading-5 text-[var(--ms)]">
                    Stok kodu {u.kod}
                    <br />
                    {u.kategori}
                  </span>
                </div>
                <AlanListesi
                  alanlar={[
                    ["Stok", `${u.stok} adet`],
                    ["Kritik seviye", `${u.kritik} adet`],
                    ["Satış, 30 gün", `${satis30(api).get(u.id) ?? 0} adet`],
                    ["Bu hızla stok yeter", (() => {
                      const hiz = (satis30(api).get(u.id) ?? 0) / 30;
                      return hiz ? `${Math.floor(u.stok / hiz)} gün` : "Satış yok";
                    })()],
                  ]}
                />
              </Bolum>
              <Bolum baslik="Fiyat">
                <FiyatDuzenle key={u.fiyat} u={u} api={api} />
              </Bolum>
              <Bolum baslik="Satış kanalları">
                <ul className="space-y-2.5">
                  {(["Site", "Trendyol", "Hepsiburada"] as const).map((k) => (
                    <li key={k} className="flex items-center justify-between gap-3 text-[13px]">
                      <span>{k}</span>
                      <Anahtar
                        acik={u.kanallar[k]}
                        ad={`${k} kanalında satış`}
                        degistir={() => {
                          api.guncelle("urunler", u.id, { kanallar: { ...u.kanallar, [k]: !u.kanallar[k] } }, `${k} kanalında satışa ${u.kanallar[k] ? "kapatıldı" : "açıldı"}`);
                          api.haber(`${k} kanalı güncellendi`, "basari");
                        }}
                      />
                    </li>
                  ))}
                </ul>
              </Bolum>
              <Bolum baslik="Geçmiş">
                <Gecmis satirlar={u.gecmis.map((g: Kayit) => ({ zaman: zaman(g.t, api.ani), metin: g.m }))} />
              </Bolum>
            </>
          ),
          eylemler: [
            {
              ad: "Stoğa 20 adet ekle",
              tur: "ana",
              ikon: IconPlus,
              uygula: (u, api) => {
                api.guncelle("urunler", u.id, { stok: u.stok + 20 }, `Stoğa 20 adet eklendi, ${KULLANICI.ad}`);
                api.haber(`${u.ad} stoğu ${u.stok + 20} adet oldu`, "basari");
                api.olay("stok-ekle");
              },
            },
          ],
        },
      },
    },
    {
      id: "musteriler",
      grup: "Satış",
      ekran: {
        tur: "liste",
        koleksiyon: "musteriler",
        baslikAdi: "Müşteri",
        baslik: (m) => m.ad,
        alt: (m) => `${m.sehir}, ${m.telefon}`,
        harf: (m) => m.ad,
        durum: (m, api) => {
          const g = musteri(m, api).grup;
          return { ad: g, renk: g === "Sadık" ? "yesil" : g === "Yeni" ? "mavi" : g === "Uykuda" ? "sari" : "gri" };
        },
        arama: (m) => `${m.telefon} ${m.eposta} ${m.sehir}`,
        sira: (a, b) => b.onceki.tutar - a.onceki.tutar,
        sutunlar: [
          { ad: "Sipariş", deger: (m, api) => musteri(m, api).adet, hiza: "sag", oncelik: 1 },
          { ad: "Toplam harcama", deger: (m, api) => tl(musteri(m, api).tutar), csv: (m) => m.onceki.tutar, sirala: (m) => m.onceki.tutar, hiza: "sag", oncelik: 1 },
          { ad: "Son sipariş", deger: (m, api) => (musteri(m, api).son ? tarih(musteri(m, api).son) : "Yok"), oncelik: 2 },
          { ad: "Üyelik", deger: (m) => tarih(m.kayit), oncelik: 3 },
        ],
        filtreler: [{ ad: "Grup", secenekler: ["Sadık", "Yeni", "Ara sıra", "Uykuda"].map((g) => ({ ad: g, kosul: (m: Kayit, api: PanelApi) => musteri(m, api).grup === g })) }],
        ozet: (api) => {
          const gruplar = api.veri.musteriler.map((m) => musteri(m, api).grup);
          return [
            { ad: "Müşteri", deger: String(gruplar.length) },
            { ad: "Sadık", deger: String(gruplar.filter((g) => g === "Sadık").length), not: "8 ve üstü sipariş", renk: "yesil" },
            { ad: "Yeni", deger: String(gruplar.filter((g) => g === "Yeni").length), not: "İlk siparişi bu ay", renk: "mavi" },
            { ad: "Uykuda", deger: String(gruplar.filter((g) => g === "Uykuda").length), not: "90 günü geçen", renk: "sari" },
          ];
        },
        detay: {
          bolumler: (m, api) => {
            const o = musteri(m, api);
            const siparisler = api.veri.siparisler.filter((s) => s.musteriId === m.id).slice(0, 8);
            return (
              <>
                <Bolum baslik="İletişim">
                  <AlanListesi alanlar={[["Telefon", m.telefon], ["E posta", m.eposta], ["Şehir", m.sehir], ["Üyelik", tarih(m.kayit)]]} />
                </Bolum>
                <Bolum baslik="Alışveriş">
                  <AlanListesi alanlar={[["Toplam sipariş", o.adet], ["Toplam harcama", tl(o.tutar)], ["Sepet ortalaması", tl(o.adet ? o.tutar / o.adet : 0)], ["Son sipariş", o.son ? zaman(o.son, api.ani) : "Yok"]]} />
                </Bolum>
                <Bolum baslik="Son 30 günün siparişleri">
                  {siparisler.length ? (
                    <ul className="divide-y divide-[var(--k)]">
                      {siparisler.map((s) => (
                        <li key={s.id}>
                          <button type="button" onClick={() => api.git("siparisler", { kayit: s.id })} className="flex w-full items-center justify-between gap-3 py-2 text-left text-[12.5px] hover:text-[var(--p)]">
                            <span>
                              Sipariş {s.id}, {tarih(s.t)}
                            </span>
                            <span className="tabular-nums">{tl(toplam(s))}</span>
                          </button>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-[12.5px] text-[var(--ms)]">Bu dönemde siparişi yok. Daha önceki siparişleri {m.onceki.adet} adet.</p>
                  )}
                </Bolum>
                <Bolum baslik="Geçmiş">
                  <Gecmis satirlar={m.gecmis.map((g: Kayit) => ({ zaman: zaman(g.t, api.ani), metin: g.m }))} />
                </Bolum>
              </>
            );
          },
          eylemler: [
            {
              ad: "Geri dön kuponu gönder",
              tur: "ana",
              ikon: IconUser,
              gorunur: (m, api) => musteri(m, api).grup === "Uykuda",
              uygula: (m, api) => {
                api.guncelle("musteriler", m.id, {}, "GERIDON25 kuponu SMS ile gönderildi");
                api.haber(`${m.ad} kişisine yüzde 25 geri dönüş kuponu gönderildi`, "basari");
                api.olay("kupon-gonder");
              },
            },
          ],
        },
      },
    },
    {
      id: "kampanyalar",
      grup: "Satış",
      ekran: {
        tur: "liste",
        koleksiyon: "kuponlar",
        baslikAdi: "Kupon",
        baslik: (k) => k.kod,
        alt: (k) => k.aciklama,
        durum: (k, api) => (k.bitis < api.ani.getTime() ? { ad: "Süresi doldu", renk: "gri" } : k.aktif ? { ad: "Yayında", renk: "yesil" } : { ad: "Durduruldu", renk: "sari" }),
        arama: (k) => k.aciklama,
        sutunlar: [
          { ad: "İndirim", deger: (k) => (k.tur === "yuzde" ? yuzde(k.deger) : tl(k.deger)), oncelik: 1 },
          {
            ad: "Kullanım",
            deger: (k, api) => {
              const n = api.veri.siparisler.filter((s) => s.kupon === k.kod).length + (k.kod === "YAZSONU20" ? 200 : 0);
              return k.sinir ? `${n} kez, sınır ${k.sinir}` : `${n} kez`;
            },
            oncelik: 1,
          },
          { ad: "Getirdiği satış", deger: (k, api) => tl(api.veri.siparisler.filter((s) => s.kupon === k.kod && sayilir(s)).reduce((t, s) => t + toplam(s), 0)), hiza: "sag", oncelik: 2 },
          { ad: "Bitiş", deger: (k) => tarih(k.bitis), sirala: (k) => k.bitis, oncelik: 2 },
        ],
        detay: {
          bolumler: (k, api) => {
            const kullanan = api.veri.siparisler.filter((s) => s.kupon === k.kod && sayilir(s));
            return (
              <>
                <Bolum baslik="Kupon">
                  <AlanListesi alanlar={[["Kod", k.kod], ["İndirim", k.tur === "yuzde" ? yuzde(k.deger) : tl(k.deger)], ["Kullanım sınırı", k.sinir || "Sınırsız"], ["Bitiş", tarih(k.bitis, true)]]} />
                </Bolum>
                <Bolum baslik="Sonuç, 30 gün">
                  <AlanListesi
                    alanlar={[
                      ["Kullanan sipariş", kullanan.length],
                      ["Getirdiği satış", tl(kullanan.reduce((t, s) => t + toplam(s), 0))],
                      ["Verilen indirim", tl(kullanan.reduce((t, s) => t + s.indirim, 0))],
                      ["Sepet ortalaması", tl(kullanan.length ? kullanan.reduce((t, s) => t + toplam(s), 0) / kullanan.length : 0)],
                    ]}
                  />
                </Bolum>
                <Bolum baslik="Geçmiş">
                  <Gecmis satirlar={k.gecmis.map((g: Kayit) => ({ zaman: zaman(g.t, api.ani), metin: g.m }))} />
                </Bolum>
              </>
            );
          },
          eylemler: [
            {
              ad: "Durdur",
              ikon: IconPlayerPause,
              gorunur: (k, api) => k.aktif && k.bitis > api.ani.getTime(),
              uygula: (k, api) => {
                api.guncelle("kuponlar", k.id, { aktif: false }, `Durduruldu, ${KULLANICI.ad}`);
                api.haber(`${k.kod} artık kullanılamıyor`, "bilgi");
                api.olay("kupon");
              },
            },
            {
              ad: "Yayına al",
              tur: "ana",
              ikon: IconPlayerPlay,
              gorunur: (k, api) => !k.aktif && k.bitis > api.ani.getTime(),
              uygula: (k, api) => {
                api.guncelle("kuponlar", k.id, { aktif: true }, `Yayına alındı, ${KULLANICI.ad}`);
                api.haber(`${k.kod} yeniden kullanılabilir`, "basari");
                api.olay("kupon");
              },
            },
          ],
        },
        yeni: {
          baslik: "Yeni kupon",
          dugme: "Kuponu oluştur",
          alanlar: [
            { ad: "Kupon kodu", anahtar: "kod", tur: "metin", varsayilan: "HAFTASONU10", zorunlu: true },
            { ad: "İndirim türü", anahtar: "tur", tur: "secim", secenekler: ["Yüzde", "Tutar"] },
            { ad: "İndirim", anahtar: "deger", tur: "sayi", varsayilan: "10", zorunlu: true },
            { ad: "Kullanım sınırı", anahtar: "sinir", tur: "sayi", varsayilan: "100" },
          ],
          olustur: (d, api) => {
            const id = api.yeniId("k");
            const k = kod(d.kod) || "YENIKUPON";
            api.ekle("kuponlar", {
              id,
              kod: k,
              tur: d.tur === "Tutar" ? "tutar" : "yuzde",
              deger: Number(d.deger) || 10,
              sinir: Number(d.sinir) || 0,
              bitis: api.ani.getTime() + 14 * GUN,
              aktif: true,
              aciklama: "Panelden oluşturuldu",
              gecmis: [{ t: api.ani.getTime(), m: `Oluşturuldu, ${KULLANICI.ad}` }],
            });
            api.haber(`${k} kuponu oluşturuldu, 14 gün geçerli`, "basari");
            api.olay("kupon");
            return id;
          },
        },
      },
    },
    {
      id: "kargo",
      grup: "Operasyon",
      rozet: (api) => api.veri.siparisler.filter((s) => s.durum === "kargoda" && kargoGunu(s, api) > 3).length,
      ekran: {
        tur: "liste",
        koleksiyon: "siparisler",
        baslikAdi: "Gönderi",
        kapsam: (s) => !!s.kargo && (s.durum === "kargoda" || s.durum === "teslim"),
        baslik: (s) => `Sipariş ${s.id}`,
        alt: (s, api) => `${musteriAdi(api, s.musteriId)}, ${s.sehir}`,
        durum: kargoDurumu,
        arama: (s, api) => `${s.kargo.takip} ${s.kargo.firma} ${musteriAdi(api, s.musteriId)} ${s.sehir}`,
        sira: (a, b) => {
          const gec = (s: Kayit) => (s.durum === "kargoda" ? 1 : 0);
          return gec(b) - gec(a) || b.kargo.t - a.kargo.t;
        },
        sutunlar: [
          { ad: "Firma", deger: (s) => s.kargo.firma, sirala: (s) => s.kargo.firma, oncelik: 1 },
          { ad: "Takip no", deger: (s) => s.kargo.takip, oncelik: 2 },
          { ad: "Gönderim", deger: (s, api) => zaman(s.kargo.t, api.ani), sirala: (s) => s.kargo.t, oncelik: 2 },
          { ad: "Süre", deger: (s, api) => `${sayi(kargoGunu(s, api), 1)} gün`, sirala: (s) => -s.kargo.t, hiza: "sag", oncelik: 1 },
        ],
        filtreler: [
          {
            ad: "Durum",
            secenekler: [
              { ad: "Yolda", kosul: (s, api) => kargoDurumu(s, api).ad === "Yolda" },
              { ad: "Gecikenler", kosul: (s, api) => kargoDurumu(s, api).ad === "Gecikiyor" },
              { ad: "Teslim edilenler", kosul: (s) => s.durum === "teslim" },
            ],
          },
          { ad: "Firma", secenekler: KARGOLAR.map((f) => ({ ad: f, kosul: (s: Kayit) => s.kargo.firma === f })) },
        ],
        ozet: (api) => {
          const l = api.veri.siparisler.filter((s) => s.kargo);
          const teslim = l.filter((s) => s.durum === "teslim" && s.teslimT);
          return [
            { ad: "Yolda", deger: String(l.filter((s) => kargoDurumu(s, api).ad === "Yolda").length), renk: "mor" },
            { ad: "Geciken", deger: String(l.filter((s) => kargoDurumu(s, api).ad === "Gecikiyor").length), renk: "kirmizi" },
            { ad: "Ortalama teslim", deger: `${sayi(teslim.reduce((t, s) => t + (s.teslimT - s.kargo.t), 0) / Math.max(1, teslim.length) / GUN, 1)} gün` },
            { ad: "Teslim edilen, 30 gün", deger: String(teslim.length) },
          ];
        },
        detay: {
          bolumler: (s, api) => <SiparisDetayi s={s} api={api} />,
          eylemler: [
            {
              ad: "Teslim edildi",
              tur: "ana",
              ikon: IconCheck,
              gorunur: (s) => s.durum === "kargoda",
              uygula: (s, api) => {
                api.guncelle("siparisler", s.id, { durum: "teslim", teslimT: api.ani.getTime() }, "Teslim edildi olarak işaretlendi");
                api.haber("Gönderi teslim edildi, sipariş kapandı", "basari");
                api.olay("teslim");
              },
            },
            {
              ad: "Müşteriye bilgi ver",
              gorunur: (s) => s.durum === "kargoda",
              uygula: (s, api) => {
                api.guncelle("siparisler", s.id, {}, "Müşteriye gecikme bilgisi ve takip bağlantısı gönderildi");
                api.haber("Müşteriye SMS gönderildi", "basari");
              },
            },
          ],
        },
      },
    },
    {
      id: "iadeler",
      grup: "Operasyon",
      rozet: (api) => api.veri.iadeler.filter((i) => i.durum === "bekliyor").length,
      ekran: {
        tur: "liste",
        koleksiyon: "iadeler",
        baslikAdi: "İade",
        baslik: (i, api) => urunAdi(api, i.urunId),
        alt: (i, api) => `Sipariş ${i.siparisId}, ${musteriAdi(api, api.bul("siparisler", i.siparisId)?.musteriId)}`,
        durum: (i) => (i.durum === "bekliyor" ? { ad: "Onay bekliyor", renk: "sari" } : i.durum === "onaylandi" ? { ad: "Onaylandı", renk: "yesil" } : { ad: "Reddedildi", renk: "gri" }),
        arama: (i) => `${i.siparisId} ${i.neden}`,
        sira: (a, b) => (a.durum === "bekliyor" ? 0 : 1) - (b.durum === "bekliyor" ? 0 : 1) || b.t - a.t,
        sutunlar: [
          { ad: "Neden", deger: (i) => i.neden, oncelik: 1 },
          { ad: "Talep", deger: (i, api) => zaman(i.t, api.ani), sirala: (i) => i.t, oncelik: 2 },
          { ad: "Tutar", deger: (i) => tl(i.tutar), sirala: (i) => i.tutar, csv: (i) => i.tutar, hiza: "sag", oncelik: 1 },
        ],
        filtreler: [
          {
            ad: "Durum",
            secenekler: [
              { ad: "Onay bekliyor", kosul: (i) => i.durum === "bekliyor" },
              { ad: "Onaylandı", kosul: (i) => i.durum === "onaylandi" },
              { ad: "Reddedildi", kosul: (i) => i.durum === "reddedildi" },
            ],
          },
        ],
        ozet: (api) => {
          const s = api.ani.getTime();
          const teslim = api.veri.siparisler.filter((x) => x.durum === "teslim" && x.t > s - 30 * GUN).length;
          const l = api.veri.iadeler;
          return [
            { ad: "Onay bekleyen", deger: String(l.filter((i) => i.durum === "bekliyor").length), renk: "sari" },
            { ad: "İade oranı, 30 gün", deger: yuzde((l.length / Math.max(1, teslim)) * 100, 1), not: "Teslim edilen siparişlere göre" },
            { ad: "İade tutarı", deger: tl(l.filter((i) => i.durum === "onaylandi").reduce((t, i) => t + i.tutar, 0)) },
            { ad: "En sık neden", deger: (() => {
              const m = new Map<string, number>();
              l.forEach((i) => m.set(i.neden, (m.get(i.neden) ?? 0) + 1));
              return [...m.entries()].sort((a, b) => b[1] - a[1])[0]?.[0] ?? "Yok";
            })() },
          ];
        },
        detay: {
          bolumler: (i, api) => (
            <>
              <Bolum baslik="Talep">
                <AlanListesi
                  alanlar={[
                    ["Ürün", urunAdi(api, i.urunId)],
                    ["Tutar", tl(i.tutar)],
                    ["Neden", i.neden],
                    ["Talep zamanı", zaman(i.t, api.ani)],
                  ]}
                />
                <p className="mt-3 rounded-lg bg-[var(--k2)] p-3 text-[12.5px] leading-5 text-[var(--ms)]">
                  Onaylanırsa ürün stoğa döner, {tl(i.tutar)} müşterinin kartına iade edilir ve müşteriye bilgi gider.
                </p>
              </Bolum>
              <Bolum baslik="Geçmiş">
                <Gecmis satirlar={i.gecmis.map((g: Kayit) => ({ zaman: zaman(g.t, api.ani), metin: g.m }))} />
              </Bolum>
            </>
          ),
          eylemler: [
            {
              ad: "Onayla",
              tur: "ana",
              ikon: IconCheck,
              gorunur: (i) => i.durum === "bekliyor",
              uygula: (i, api) => {
                api.guncelle("iadeler", i.id, { durum: "onaylandi" }, `Onaylandı, ${KULLANICI.ad}. Ürün stoğa döndü, ödeme iadesi başladı.`);
                stokGeriKoy(api, [{ urunId: i.urunId, adet: i.adet }]);
                api.haber("İade onaylandı. Ürün stoğa döndü, müşteriye bilgi gitti.", "basari");
                api.olay("iade-sonuc");
              },
            },
            {
              ad: "Reddet",
              tur: "tehlike",
              ikon: IconX,
              gorunur: (i) => i.durum === "bekliyor",
              uygula: (i, api) => {
                api.guncelle("iadeler", i.id, { durum: "reddedildi" }, `Reddedildi, ${KULLANICI.ad}`);
                api.haber("İade reddedildi, müşteriye gerekçesiyle bilgi gitti", "bilgi");
                api.olay("iade-sonuc");
              },
            },
          ],
        },
      },
    },
    {
      id: "tahsilat",
      grup: "Finans",
      ekran: {
        tur: "liste",
        koleksiyon: "tahsilatlar",
        baslikAdi: "Tahsilat",
        baslik: (t) => `Sipariş ${t.siparisId}`,
        alt: (t, api) => zaman(t.t, api.ani),
        durum: (t, api) => (t.iade ? { ad: "İade edildi", renk: "gri" } : t.gecisT <= api.ani.getTime() ? { ad: "Hesapta", renk: "yesil" } : { ad: "Hesaba geçecek", renk: "mavi" }),
        arama: (t) => `${t.yontem} ${t.banka}`,
        sutunlar: [
          { ad: "Yöntem", deger: (t) => (t.banka ? `${t.yontem}, ${t.banka}` : t.yontem), oncelik: 2 },
          { ad: "Taksit", deger: (t) => (t.taksit > 1 ? `${t.taksit} taksit` : "Tek çekim"), oncelik: 3 },
          { ad: "Tutar", deger: (t) => tl(t.tutar), sirala: (t) => t.tutar, csv: (t) => t.tutar, hiza: "sag", oncelik: 1 },
          { ad: "Komisyon", deger: (t) => tl(t.komisyon), sirala: (t) => t.komisyon, csv: (t) => t.komisyon, hiza: "sag", oncelik: 2 },
          { ad: "Net", deger: (t) => tl(t.tutar - t.komisyon), csv: (t) => t.tutar - t.komisyon, hiza: "sag", oncelik: 1 },
          { ad: "Hesaba geçiş", deger: (t) => tarih(t.gecisT), sirala: (t) => t.gecisT, oncelik: 3 },
        ],
        filtreler: [
          { ad: "Yöntem", secenekler: ["Kredi kartı", "Pazaryeri", "Havale", "Kapıda ödeme"].map((o) => ({ ad: o, kosul: (t: Kayit) => t.yontem === o })) },
          {
            ad: "Durum",
            secenekler: [
              { ad: "Hesaba geçecek", kosul: (t, api) => !t.iade && t.gecisT > api.ani.getTime() },
              { ad: "Hesapta", kosul: (t, api) => !t.iade && t.gecisT <= api.ani.getTime() },
              { ad: "İade edildi", kosul: (t) => t.iade },
            ],
          },
        ],
        ozet: (api) => {
          const s = api.ani.getTime();
          const l = api.veri.tahsilatlar.filter((t) => !t.iade);
          const ay = l.filter((t) => t.t > s - 30 * GUN);
          return [
            { ad: "Tahsilat, 30 gün", deger: tlKisa(ay.reduce((t, x) => t + x.tutar, 0)) },
            { ad: "Komisyon, 30 gün", deger: tlKisa(ay.reduce((t, x) => t + x.komisyon, 0)), renk: "sari" },
            { ad: "7 gün içinde hesaba geçecek", deger: tlKisa(l.filter((t) => t.gecisT > s && t.gecisT < s + 7 * GUN).reduce((t, x) => t + x.tutar - x.komisyon, 0)), renk: "mavi" },
            { ad: "Daha ileri tarihte", deger: tlKisa(l.filter((t) => t.gecisT >= s + 7 * GUN).reduce((t, x) => t + x.tutar - x.komisyon, 0)), not: "Çoğu pazaryeri hakedişi" },
          ];
        },
        detay: {
          bolumler: (t, api) => (
            <>
              <Bolum baslik="Ödeme">
                <AlanListesi
                  alanlar={[
                    ["Yöntem", t.yontem],
                    ["Banka ya da kanal", t.banka || "Yok"],
                    ["Taksit", t.taksit > 1 ? `${t.taksit} taksit` : "Tek çekim"],
                    ["Ödeme zamanı", zaman(t.t, api.ani)],
                  ]}
                />
              </Bolum>
              <Bolum baslik="Hesap">
                <MiniTablo
                  basliklar={["Kalem", "Tutar"]}
                  sagdakiler={[1]}
                  satirlar={[
                    ["Brüt tahsilat", tl(t.tutar)],
                    [`Komisyon, ${yuzde((t.komisyon / t.tutar) * 100, 2)}`, `${tl(t.komisyon)} düşülür`],
                    [<strong>Hesaba geçecek</strong>, <strong>{tl(t.tutar - t.komisyon)}</strong>],
                  ]}
                />
                <p className="mt-3 text-[12px] leading-5 text-[var(--ms)]">
                  Hesaba geçiş günü {tarih(t.gecisT, true)}.{" "}
                  {t.yontem === "Pazaryeri" ? "Pazaryeri hakedişi teslimden sonraki ödeme gününde yatar." : t.yontem === "Kredi kartı" ? "Sanal POS ödemesi ertesi iş günü hesaba geçer." : ""}
                </p>
              </Bolum>
              <Bolum
                baslik="Sipariş"
                sag={
                  <button type="button" onClick={() => api.git("siparisler", { kayit: t.siparisId })} className="text-[12px] font-semibold text-[var(--p)] hover:underline">
                    Siparişi aç
                  </button>
                }
              >
                <p className="text-[12.5px] text-[var(--m)]">Sipariş {t.siparisId}</p>
              </Bolum>
            </>
          ),
        },
      },
    },
  ],
  arama: [
    { koleksiyon: "siparisler", modul: "siparisler", baslik: (s) => `Sipariş ${s.id}`, alt: (s) => `${s.kanal}, ${tl(toplam(s))}`, metin: (s) => `${s.id} ${s.kargo?.takip ?? ""}` },
    { koleksiyon: "musteriler", modul: "musteriler", baslik: (m) => m.ad, alt: (m) => `${m.sehir}, ${m.telefon}`, metin: (m) => `${m.telefon} ${m.eposta}` },
    { koleksiyon: "urunler", modul: "urunler", baslik: (u) => u.ad, alt: (u) => `${u.kod}, ${tl(u.fiyat)}`, metin: (u) => `${u.kod} ${u.kategori}` },
  ],
  gorevler: [
    { id: "g1", metin: "Yeni bir siparişi hazırlamaya alın", ipucu: "Siparişler ekranında durumu Yeni olan bir siparişi açın, alttaki düğmeye basın.", modul: "siparisler", olay: "siparis-hazirla" },
    { id: "g2", metin: "Hazırlanan bir siparişi kargoya verin", ipucu: "Takip numarası oluşur ve müşteriye kendiliğinden gider.", modul: "siparisler", olay: "siparis-kargo" },
    { id: "g3", metin: "Azalan bir ürüne stok ekleyin", ipucu: "Ürünler ekranında stok süzgecinden Azalanlar seçeneğini seçin.", modul: "urunler", olay: "stok-ekle" },
    { id: "g4", metin: "Bekleyen bir iadeyi sonuçlandırın", ipucu: "Onaylarsanız ürün stoğa geri döner.", modul: "iadeler", olay: "iade-sonuc" },
    { id: "g5", metin: "Aramadan bir müşteri bulun", ipucu: "Üstteki arama kutusuna bir müşteri adı yazın, sonuca tıklayın.", modul: "musteriler", olay: "arama" },
  ],
  canli: {
    aralik: 26_000,
    uret: (api, r) => {
      const urun = r.sec(api.veri.urunler.filter((u) => u.stok > 0 && u.kanallar.Site));
      if (!urun) return;
      const m = r.sec(api.veri.musteriler);
      const kanal = r.agirlikli([["Site", 50], ["Trendyol", 30], ["Hepsiburada", 20]] as const);
      const adet = r.agirlikli([[1, 85], [2, 15]] as const);
      const no = String(Math.max(...api.veri.siparisler.map((s) => Number(s.id))) + 1);
      const t = api.ani.getTime();
      const araToplam = adet * urun.fiyat;
      const kargoUcreti = kanal === "Site" && araToplam < 750 ? 59 : 0;
      const odeme = kanal === "Site" ? "Kredi kartı" : "Pazaryeri";
      api.ekle("siparisler", {
        id: no,
        musteriId: m.id,
        kanal,
        kalemler: [{ urunId: urun.id, adet, fiyat: urun.fiyat }],
        araToplam,
        indirim: 0,
        kupon: null,
        kargoUcreti,
        odeme,
        taksit: 1,
        durum: "yeni",
        t,
        sehir: m.sehir,
        gecmis: [{ t, m: `Sipariş alındı, ${kanal}` }],
      });
      api.ekle("tahsilatlar", { id: `T${no}`, siparisId: no, t, yontem: odeme, banka: odeme === "Pazaryeri" ? kanal : r.sec(BANKALAR), taksit: 1, tutar: araToplam + kargoUcreti, komisyon: Math.round((araToplam + kargoUcreti) * (odeme === "Pazaryeri" ? 0.18 : 0.0249)), gecisT: t + (odeme === "Pazaryeri" ? 18 : 1) * GUN, iade: false, gecmis: [] });
      api.guncelle("urunler", urun.id, { stok: urun.stok - adet });
      api.bildir(`Yeni sipariş ${no}, ${kanal}, ${tl(araToplam + kargoUcreti)}`, "siparisler", no);
    },
  },
};

export default panel;
export { eticaret as bilgi };
