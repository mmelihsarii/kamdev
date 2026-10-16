/*
 * Bayi ve toptan satış demosu: Kartal Hırdavat Toptan. Fiyat her an liste
 * fiyatı, kur ve bayinin kademesinden hesaplanır; borç ve limit cari
 * hareketlerden türetilir. Böylece kur, tahsilat ya da sevk değişince bütün
 * ekranlar aynı anda değişir.
 */
import { useMemo, useState } from "react";
import { IconArrowsExchange, IconCheck, IconMinus, IconPlus, IconSend, IconTrash, IconTruckDelivery, IconX } from "@tabler/icons-react";
import { bayi as bilgi } from "./bilgi";
import { ozetEkrani } from "../../panel/Ozet";
import { EkranBasligi } from "../../panel/Liste";
import { AlanListesi, Bolum, Cubuk, Dugme, Gecmis, Kart, MiniTablo, RENK } from "../../panel/parcalar";
import { CubukGrafik, HalkaGrafik } from "../../panel/grafik";
import { DAKIKA, GUN, SAAT, gunBasi, kisiler, kod, mesaiAni, sayi, tarih, tl, tlKisa, yuzde, zaman } from "../../ortak";
import type { Durum, Kayit, ModulBilgi, PanelApi, Rastgele, SektorPanel, Veri } from "../../tipler";

const KULLANICI = { ad: "Hakan Tunç", rol: "Satış müdürü" };
const KADEME: Record<string, number> = { A: 0.22, B: 0.15, C: 0.08 };
const KDV = 0.2;
const PLASIYERLER = ["Emre Aksoy", "Oğuz Bulut", "Sinan Keskin"];
const DEPOLAR = { merkez: "Merkez depo", sincan: "Sincan deposu" } as const;
type DepoAdi = keyof typeof DEPOLAR;

const URUNLER: [string, string, "EUR" | "USD" | "TL", number, string][] = [
  ["Akülü vidalama 18 volt, çift akülü", "Elektrikli alet", "EUR", 96, "adet"],
  ["Darbeli matkap 850 watt", "Elektrikli alet", "EUR", 58, "adet"],
  ["Avuç taşlama 125 mm", "Elektrikli alet", "EUR", 44, "adet"],
  ["Kırıcı delici 1500 watt", "Elektrikli alet", "EUR", 189, "adet"],
  ["Dekupaj testere 650 watt", "Elektrikli alet", "EUR", 52, "adet"],
  ["Lazer metre 40 m", "Ölçüm", "USD", 38, "adet"],
  ["Su terazisi 60 cm", "Ölçüm", "TL", 340, "adet"],
  ["Şerit metre 5 m", "Ölçüm", "TL", 145, "adet"],
  ["Lokma takımı 94 parça", "El aleti", "EUR", 71, "takım"],
  ["Kombine anahtar seti 12 parça", "El aleti", "EUR", 29, "takım"],
  ["Pense 180 mm", "El aleti", "TL", 260, "adet"],
  ["Tornavida seti 8 parça", "El aleti", "TL", 310, "takım"],
  ["Çekiç 500 gr", "El aleti", "TL", 220, "adet"],
  ["Matkap ucu seti 25 parça", "Sarf", "EUR", 18, "takım"],
  ["Kesme diski 115 mm", "Sarf", "TL", 32, "kutu"],
  ["Zımpara kâğıdı 120 kum", "Sarf", "TL", 9, "adet"],
  ["Silikon şeffaf 280 ml", "Kimyasal", "TL", 88, "adet"],
  ["Poliüretan köpük 750 ml", "Kimyasal", "TL", 165, "adet"],
  ["Pas sökücü sprey 400 ml", "Kimyasal", "TL", 112, "adet"],
  ["Dübel seti 8 mm, 100 adet", "Bağlantı", "TL", 75, "kutu"],
  ["Sunta vidası 4x40, 500 adet", "Bağlantı", "TL", 140, "kutu"],
  ["Gömme menteşe 35 mm", "Bağlantı", "TL", 26, "adet"],
  ["İş eldiveni nitril", "İş güvenliği", "TL", 34, "çift"],
  ["Koruyucu gözlük", "İş güvenliği", "USD", 4, "adet"],
  ["Baret beyaz", "İş güvenliği", "TL", 165, "adet"],
  ["Kompresör 50 litre", "Hava aleti", "EUR", 210, "adet"],
  ["Hava tabancası seti", "Hava aleti", "USD", 24, "takım"],
  ["Kaynak makinesi 200 amper", "Kaynak", "EUR", 165, "adet"],
  ["Kaynak elektrodu 2,5 mm", "Kaynak", "TL", 390, "kutu"],
  ["Bahçe hortumu 25 m", "Bahçe", "TL", 520, "adet"],
  ["Budama makası", "Bahçe", "USD", 11, "adet"],
  ["Merdiven alüminyum 7 basamak", "Merdiven", "TL", 2350, "adet"],
];

const BAYI_ADLARI = [
  "Yıldız Yapı Market", "Güven Hırdavat", "Doğan Nalbur", "Özkan Yapı", "Çınar Teknik", "Aydın Hırdavat", "Kaya Yapı Malzemeleri", "Şahin Nalburiye",
  "Ege Teknik Hırdavat", "Başkent Yapı", "Anadolu Nalbur", "Merkez Hırdavat", "Akın Yapı Market", "Polat Teknik", "Ekinci Hırdavat", "Toros Yapı",
  "Kuzey Nalbur", "Sarı Teknik", "Bulut Yapı Market", "Altun Hırdavat", "Kılıç Yapı", "Erdem Nalbur", "Karaca Teknik", "Tekin Yapı Market",
  "Yeşil Hırdavat", "Uçar Yapı", "Koç Teknik Hırdavat", "Arslan Nalbur", "Demir Yapı Market", "Gündoğdu Hırdavat",
];
const SEHIRLER = ["Ankara", "Ankara", "Ankara", "Konya", "Kırıkkale", "Eskişehir", "Kayseri", "Çorum", "Yozgat", "Kırşehir", "Aksaray", "Bolu"];
const BANKALAR = ["Garanti BBVA", "İş Bankası", "Yapı Kredi", "Akbank", "Halkbank", "Vakıfbank", "Ziraat Bankası"];

/* ---------------- Hesaplar ---------------- */

const kur = (api: PanelApi, d: string) => (d === "TL" ? 1 : (api.veri.ayar.find((a) => a.id === "kur")?.[d] as number) ?? 1);
const listeTL = (u: Kayit, api: PanelApi) => u.liste * kur(api, u.doviz);
/** Bayinin kademesine göre KDV hariç net birim fiyat. */
const netFiyat = (u: Kayit, kademe: string, api: PanelApi) => listeTL(u, api) * (1 - KADEME[kademe]);
const toplamStok = (u: Kayit) => u.stok.merkez + u.stok.sincan;
/** Kalan limit eksiye düşünce eksi işaretiyle değil, aşılan tutarla yazılır. */
const bakiyeYaz = (n: number) => (n < 0 ? `${tl(-n)} alacaklı` : tl(n));
const kalanYaz = (n: number, kisa = false) => (n < 0 ? `${(kisa ? tlKisa : tl)(-n)} aşıldı` : (kisa ? tlKisa : tl)(n));
const dovizYaz = (u: Kayit) => (u.doviz === "TL" ? tl(u.liste) : `${sayi(u.liste, 2)} ${u.doviz === "EUR" ? "euro" : "dolar"}`);

const ACIK = ["onay", "onaylandi", "hazirlaniyor"];

type Risk = { bakiye: number; vadesiGecen: number; enEski: number; acik: number; kalan: number; oran: number };
const riskOnbellek = new WeakMap<Kayit[], { siparisler: Kayit[]; bayiler: Kayit[]; dakika: number; m: Map<string, Risk> }>();
/** Bayi başına borç, vadesi geçen tutar ve açık sipariş. Hareket, sipariş ya da bayi değişmedikçe yeniden hesaplanmaz. */
function riskler(api: PanelApi) {
  const dakika = Math.floor(api.ani.getTime() / 60_000);
  const o = riskOnbellek.get(api.veri.hareketler);
  if (o && o.siparisler === api.veri.siparisler && o.bayiler === api.veri.bayiler && o.dakika === dakika) return o.m;
  const m = new Map<string, Risk>();
  const simdi = api.ani.getTime();
  for (const b of api.veri.bayiler) {
    const h = api.veri.hareketler.filter((x) => x.bayiId === b.id);
    const borc = h.filter((x) => x.tur !== "tahsilat");
    const odenen = h.filter((x) => x.tur === "tahsilat").reduce((t, x) => t + x.tutar, 0);
    const bakiye = borc.reduce((t, x) => t + x.tutar, 0) - odenen;
    // Ödemeler en eski vadeli borçtan başlayarak düşülür; kalan vadesi geçmiş borç ve en eski vadesi bulunur.
    let kalanOdeme = odenen;
    let vadesiGecen = 0;
    let enEski = 0;
    for (const x of [...borc].sort((a, c) => a.vade - c.vade)) {
      const acikKisim = Math.max(0, x.tutar - kalanOdeme);
      kalanOdeme = Math.max(0, kalanOdeme - x.tutar);
      if (acikKisim > 0 && x.vade < simdi) {
        vadesiGecen += acikKisim;
        if (!enEski) enEski = x.vade;
      }
    }
    const acik = api.veri.siparisler.filter((s) => s.bayiId === b.id && ACIK.includes(s.durum)).reduce((t, s) => t + s.tutar, 0);
    const kullanilan = Math.max(0, bakiye) + acik;
    m.set(b.id, { bakiye, vadesiGecen, enEski, acik, kalan: b.limit - kullanilan, oran: kullanilan / b.limit });
  }
  riskOnbellek.set(api.veri.hareketler, { siparisler: api.veri.siparisler, bayiler: api.veri.bayiler, dakika, m });
  return m;
}
const risk = (api: PanelApi, bayiId: string) => riskler(api).get(bayiId)!;

function bayiDurumu(b: Kayit, api: PanelApi): Durum {
  const r = risk(api, b.id);
  if (r.kalan < 0) return { ad: "Limit aşıldı", renk: "kirmizi" };
  if (r.vadesiGecen > 0) return { ad: "Vadesi geçmiş borç", renk: "kirmizi" };
  if (r.oran > 0.85) return { ad: "Limit dolmak üzere", renk: "sari" };
  return { ad: "Normal", renk: "yesil" };
}

/** Yeni siparişin onaya düşüp düşmeyeceği; bayi portalı ve canlı akış aynı kuralı kullanır. */
function onayGerekir(api: PanelApi, bayiId: string, tutar: number) {
  const r = risk(api, bayiId);
  if (r.vadesiGecen > 0) return `Vadesi geçmiş ${tl(r.vadesiGecen)} borç var`;
  if (r.kalan - tutar < 0) return `Limit ${tl(tutar - r.kalan)} aşılıyor`;
  return "";
}

const SIPARIS_DURUMU: Record<string, Durum> = {
  onay: { ad: "Onay bekliyor", renk: "sari" },
  onaylandi: { ad: "Onaylandı", renk: "mavi" },
  hazirlaniyor: { ad: "Hazırlanıyor", renk: "mor" },
  sevk: { ad: "Sevk edildi", renk: "yesil" },
  red: { ad: "Reddedildi", renk: "gri" },
};

const bayiAdi = (api: PanelApi, id: string) => api.bul("bayiler", id)?.ad ?? "Bayi";
const urunAdi = (api: PanelApi, id: string) => api.bul("urunler", id)?.ad ?? "Ürün";

/* ---------------- Veri üretimi ---------------- */

function uret(ani: Date, r: Rastgele): Veri {
  const simdi = ani.getTime();
  const urunler: Kayit[] = URUNLER.map(([ad, grup, doviz, liste, birim], i) => {
    const kritik = r.sec([10, 20, 30, 50]);
    return {
      id: `u${i + 1}`,
      ad,
      grup,
      doviz,
      liste,
      birim,
      kod: `KRT${kod(grup).slice(0, 3)}${2001 + i}`,
      kritik,
      stok: { merkez: r.tam(kritik, kritik * 8), sincan: r.tam(0, kritik * 4) },
      gecmis: [],
    };
  });
  r.karistir([...urunler]).slice(0, 4).forEach((u, i) => (u.stok = i === 0 ? { merkez: 0, sincan: r.tam(2, 8) } : { merkez: r.tam(1, Math.floor(u.kritik / 3)), sincan: r.tam(0, 4) }));

  const yetkililer = kisiler(r, BAYI_ADLARI.length);
  const riskliler = new Set(r.karistir(BAYI_ADLARI.map((_, i) => i)).slice(0, 6));
  const bayiler: Kayit[] = BAYI_ADLARI.map((ad, i) => {
    const kademe = r.agirlikli([["A", 20], ["B", 45], ["C", 35]] as const);
    return {
      id: `b${i + 1}`,
      ad,
      yetkili: yetkililer[i].tamAd,
      telefon: yetkililer[i].telefon,
      sehir: r.sec(SEHIRLER),
      kademe,
      limit: kademe === "A" ? r.sec([1_200_000, 1_400_000, 1_600_000]) : kademe === "B" ? r.sec([700_000, 850_000, 1_000_000]) : r.sec([350_000, 450_000, 500_000]),
      vade: r.sec([30, 45, 60]),
      plasiyer: PLASIYERLER[i % 3],
      riskli: riskliler.has(i),
      kadin: yetkililer[i].kadin,
      gecmis: [],
    };
  });

  const kurlar = { id: "kur", EUR: 50.85, USD: 43.6, t: gunBasi(simdi) + 8.5 * SAAT };
  const fiyatTL = (u: Kayit, k: string) => u.liste * (u.doviz === "TL" ? 1 : kurlar[u.doviz as "EUR" | "USD"]) * (1 - KADEME[k]);

  const hareketler: Kayit[] = [];
  const cekler: Kayit[] = [];
  // Devreden bakiye: riskli bayilerin bir kısmı vadesi geçmiş.
  for (const b of bayiler) {
    const tutar = Math.round(b.limit * (b.riskli ? 0.45 + r.kesir() * 0.35 : 0.1 + r.kesir() * 0.3));
    const vade = b.riskli ? simdi - r.tam(8, 40) * GUN : simdi + r.tam(5, 40) * GUN;
    hareketler.push({ id: `d${b.id}`, bayiId: b.id, tur: "devir", tutar, t: simdi - 80 * GUN, vade, aciklama: "Önceki dönemden devreden bakiye" });
  }

  const siparisler: Kayit[] = [];
  let no = 7300;
  // Büyük bayi daha sık ve daha çok kalemle sipariş verir.
  const bayiSec = () => r.agirlikli(bayiler.map((b) => [b, b.kademe === "A" ? 3 : b.kademe === "B" ? 2 : 1] as const));
  for (let gun = gunBasi(simdi) - 75 * GUN; gun <= simdi; gun += GUN) {
    const hafta = new Date(gun).getDay();
    if (hafta === 0) continue;
    const adet = hafta === 6 ? r.tam(1, 4) : r.tam(6, 12);
    const zamanlar = Array.from({ length: adet }, () => {
      const kanal = r.agirlikli([["Portal", 55], ["Plasiyer", 30], ["Telefon", 15]] as const);
      const s = kanal === "Portal" ? r.agirlikli([7, 8, 9, 10, 11, 13, 14, 15, 16, 20, 21, 22].map((x) => [x, x > 19 ? 1 : 3] as const)) : r.tam(9, 17);
      return { kanal, t: gun + s * SAAT + r.tam(0, 59) * DAKIKA };
    })
      .filter((x) => x.t <= simdi)
      .sort((a, b) => a.t - b.t);

    for (const { kanal, t } of zamanlar) {
      const b = bayiSec();
      const kalemSayisi = b.kademe === "A" ? r.tam(4, 8) : b.kademe === "B" ? r.tam(3, 6) : r.tam(2, 4);
      const kalemler: { urunId: string; adet: number; birim: number }[] = [];
      for (let i = 0; i < kalemSayisi; i++) {
        const u = r.sec(urunler);
        if (kalemler.some((k) => k.urunId === u.id)) continue;
        const birim = fiyatTL(u, b.kademe);
        // Pahalı aletten birkaç adet, sarf malzemesinden koli koli alınır.
        const adet = birim > 2000 ? r.tam(1, 4) : birim > 400 ? r.sec([2, 4, 6, 10]) : r.sec([10, 20, 24, 50]);
        kalemler.push({ urunId: u.id, adet, birim: Math.round(birim * 100) / 100 });
      }
      const araToplam = kalemler.reduce((s, k) => s + k.adet * k.birim, 0);
      const tutar = Math.round(araToplam * (1 + KDV));
      const yas = simdi - t;
      const depo: DepoAdi = r.olasilik(0.75) ? "merkez" : "sincan";
      const gecmis: { t: number; m: string }[] = [{ t, m: `${kanal} üzerinden alındı${kanal === "Plasiyer" ? `, ${b.plasiyer}` : ""}` }];
      let durum: string;
      let onayNedeni = "";
      if (b.riskli && yas < 4 * GUN) {
        durum = "onay";
        onayNedeni = "Vadesi geçmiş borç var";
        gecmis.unshift({ t: t + DAKIKA, m: "Vadesi geçmiş borç nedeniyle onaya düştü" });
      } else {
        const onayT = b.riskli ? mesaiAni(t + r.tam(1, 5) * SAAT, 9, 18, r) : t + DAKIKA;
        const red = b.riskli && r.olasilik(0.2);
        if (b.riskli) gecmis.unshift({ t: Math.min(onayT, simdi), m: red ? `Reddedildi, ${KULLANICI.ad}, önce tahsilat istendi` : `Onaylandı, ${KULLANICI.ad}` });
        else gecmis.unshift({ t: onayT, m: "Limit ve vade uygun, kendiliğinden onaylandı" });
        const hazirT = mesaiAni(onayT + r.tam(30, 180) * DAKIKA, 8.5, 17, r, true);
        const sevkT = mesaiAni(hazirT + r.tam(2, 20) * SAAT, 14, 17.5, r, true);
        durum = red ? "red" : sevkT <= simdi ? "sevk" : hazirT <= simdi ? "hazirlaniyor" : onayT <= simdi ? "onaylandi" : "onay";
        if (!red && hazirT <= simdi) gecmis.unshift({ t: hazirT, m: `Hazırlamaya alındı, ${DEPOLAR[depo]}` });
        if (durum === "sevk") {
          gecmis.unshift({ t: sevkT, m: `Sevk edildi, irsaliye ${r.tam(100000, 999999)}` });
          hareketler.push({ id: `f${no + 1}`, bayiId: b.id, tur: "fatura", tutar, t: sevkT, vade: sevkT + b.vade * GUN, aciklama: `Sipariş ${no + 1} faturası` });
        }
      }
      siparisler.push({ id: String(++no), bayiId: b.id, kanal, kalemler, araToplam, tutar, durum, t, depo, onayNedeni, gecmis });
    }
  }

  // Tahsilatlar: düzenli ödeyen bayi vadesi gelen borcunu kapatır, riskli bayi yalnız bir kısmını öder.
  for (const b of bayiler) {
    const vadesiGelen = hareketler.filter((h) => h.bayiId === b.id && h.vade < simdi).reduce((t, h) => t + h.tutar, 0);
    const hedef = b.riskli ? vadesiGelen * r.kesir() * 0.4 : vadesiGelen + (b.limit * r.kesir() * 0.1);
    const parca = r.tam(1, 4);
    for (let i = 0; i < parca; i++) {
      const t = mesaiAni(simdi - r.tam(1, 70) * GUN, 9, 18, r);
      if (t > simdi) continue;
      const yontem = r.agirlikli([["Havale", 55], ["Çek", 30], ["Kredi kartı", 15]] as const);
      const tutar = Math.round(hedef / parca / 100) * 100;
      if (tutar <= 0) continue;
      const id = `t${b.id}${i}`;
      hareketler.push({ id, bayiId: b.id, tur: "tahsilat", tutar, t, vade: t, yontem, aciklama: `${yontem} ile tahsilat${yontem === "Havale" ? "" : `, ${b.plasiyer}`}` });
      if (yontem === "Çek") cekler.push({ id: `c${id}`, bayiId: b.id, banka: r.sec(BANKALAR), no: String(r.tam(1000000, 9999999)), tutar, vade: t + r.tam(30, 90) * GUN, durum: "portfoy" });
    }
  }
  // Düzenli ödeyen bayinin limiti kullanımının biraz üstünde olsun; kendiliğinden onaylanan siparişleriyle çelişmesin.
  for (const b of bayiler.filter((x) => !x.riskli)) {
    const h = hareketler.filter((x) => x.bayiId === b.id);
    const bakiye = h.reduce((t, x) => t + (x.tur === "tahsilat" ? -x.tutar : x.tutar), 0);
    const acik = siparisler.filter((x) => x.bayiId === b.id && ACIK.includes(x.durum)).reduce((t, x) => t + x.tutar, 0);
    const kullanim = Math.max(0, bakiye) + acik;
    if (kullanim > b.limit * 0.92) b.limit = Math.ceil((kullanim * 1.2) / 100_000) * 100_000;
  }

  // Önümüzdeki günlerde vadesi gelen birkaç çek olsun.
  cekler.slice(0, 3).forEach((c, i) => (c.vade = gunBasi(simdi) + (i + 1) * 2 * GUN));

  return {
    ayar: [kurlar],
    urunler,
    bayiler,
    siparisler: siparisler.reverse(),
    hareketler: hareketler.sort((a, b) => b.t - a.t),
    cekler: cekler.sort((a, b) => a.vade - b.vade),
  };
}

/* ---------------- Ortak parçalar ---------------- */

function LimitKutusu({ api, bayiId, ek = 0 }: { api: PanelApi; bayiId: string; ek?: number }) {
  const b = api.bul("bayiler", bayiId)!;
  const rk = risk(api, bayiId);
  const kullanilan = Math.max(0, rk.bakiye) + rk.acik + ek;
  const oran = kullanilan / b.limit;
  return (
    <div className="rounded-lg border border-[var(--k)] p-3">
      <div className="mb-2 flex items-baseline justify-between gap-3 text-[12.5px]">
        <span className="text-[var(--ms)]">Limit kullanımı</span>
        <span className="font-semibold tabular-nums" style={{ color: oran > 1 ? "var(--kirmizi)" : oran > 0.85 ? "var(--sari)" : "var(--m)" }}>
          {tl(kullanilan)} ile {tl(b.limit)}
        </span>
      </div>
      <Cubuk oran={oran} renk={oran > 1 ? "var(--kirmizi)" : oran > 0.85 ? "var(--sari)" : "var(--p)"} />
      <dl className="mt-3 grid grid-cols-2 gap-2 text-[12px]">
        <div>
          <dt className="text-[var(--ms)]">Cari borç</dt>
          <dd className="font-medium tabular-nums">{bakiyeYaz(rk.bakiye)}</dd>
        </div>
        <div>
          <dt className="text-[var(--ms)]">Açık siparişler</dt>
          <dd className="font-medium tabular-nums">{tl(rk.acik)}</dd>
        </div>
        {ek > 0 && (
          <div>
            <dt className="text-[var(--ms)]">Bu sipariş</dt>
            <dd className="font-medium tabular-nums">{tl(ek)}</dd>
          </div>
        )}
        <div>
          <dt className="text-[var(--ms)]">Kalan limit</dt>
          <dd className="font-semibold tabular-nums" style={{ color: b.limit - kullanilan < 0 ? "var(--kirmizi)" : "var(--yesil)" }}>
            {kalanYaz(b.limit - kullanilan)}
          </dd>
        </div>
        {rk.vadesiGecen > 0 && (
          <div className="col-span-2">
            <dt className="text-[var(--ms)]">Vadesi geçen</dt>
            <dd className="font-semibold tabular-nums text-[var(--kirmizi)]">
              {tl(rk.vadesiGecen)}, {Math.floor((api.ani.getTime() - rk.enEski) / GUN)} gündür
            </dd>
          </div>
        )}
      </dl>
    </div>
  );
}

function KurPaneli({ api }: { api: PanelApi }) {
  const k = api.veri.ayar.find((a) => a.id === "kur")!;
  const [eur, setEur] = useState(sayi(k.EUR, 2));
  const [usd, setUsd] = useState(sayi(k.USD, 2));
  const sayiyaCevir = (m: string) => Number(m.replace(/\./g, "").replace(",", "."));
  const yeniEur = sayiyaCevir(eur);
  const yeniUsd = sayiyaCevir(usd);
  const gecerli = yeniEur > 0 && yeniUsd > 0 && (yeniEur !== k.EUR || yeniUsd !== k.USD);
  const dovizli = api.veri.urunler.filter((u) => u.doviz !== "TL").length;
  return (
    <Kart>
      <div className="flex flex-col gap-3 p-4 @3xl:flex-row @3xl:items-end">
        <div className="min-w-0 flex-1">
          <p className="text-[13px] font-semibold">Güncel kur</p>
          <p className="mt-0.5 text-[12px] leading-5 text-[var(--ms)]">
            Son güncelleme {zaman(k.t, api.ani)}. Değiştirdiğinizde {dovizli} dövizli ürünün üç kademedeki fiyatı birlikte yenilenir.
          </p>
        </div>
        {(
          [
            ["Euro", eur, setEur],
            ["Dolar", usd, setUsd],
          ] as const
        ).map(([ad, deger, ata]) => (
          <label key={ad} className="block">
            <span className="text-[11.5px] text-[var(--ms)]">{ad}</span>
            <input
              value={deger}
              inputMode="decimal"
              onChange={(e) => ata(e.target.value)}
              className="mt-1 h-9 w-28 rounded-lg border border-[var(--k)] bg-transparent px-3 text-[13px] tabular-nums outline-none focus:border-[var(--p)] focus-visible:outline-none"
            />
          </label>
        ))}
        <Dugme
          tur="ana"
          disabled={!gecerli}
          onClick={() => {
            api.guncelle("ayar", "kur", { EUR: yeniEur, USD: yeniUsd, t: api.ani.getTime() });
            api.haber(`${dovizli} ürünün fiyatı yeni kurla hesaplandı, bayi portalına yansıdı`, "basari");
            api.olay("kur");
          }}
        >
          Kuru güncelle
        </Dugme>
      </div>
      <div className="flex flex-wrap gap-x-6 gap-y-1 border-t border-[var(--k)] px-4 py-2.5 text-[12px] text-[var(--ms)]">
        {Object.entries(KADEME).map(([ad, o]) => (
          <span key={ad}>
            Kademe {ad}, iskonto {yuzde(o * 100)}
          </span>
        ))}
        <span>Fiyatlara KDV yüzde 20 eklenir</span>
      </div>
    </Kart>
  );
}

function CekTakvimi({ api }: { api: PanelApi }) {
  const s = api.ani.getTime();
  const yaklasan = api.veri.cekler.filter((c) => c.durum === "portfoy" && c.vade < s + 30 * GUN);
  return (
    <Kart baslik="Önümüzdeki 30 günün çek vadeleri" sag={<span className="text-[12px] tabular-nums text-[var(--ms)]">{tl(yaklasan.reduce((t, c) => t + c.tutar, 0))}</span>}>
      {yaklasan.length ? (
        <ul className="divide-y divide-[var(--k)]">
          {yaklasan.slice(0, 5).map((c) => (
            <li key={c.id} className="flex items-center justify-between gap-3 px-4 py-2.5 text-[12.5px]">
              <span className="min-w-0">
                <span className="block truncate font-medium">{bayiAdi(api, c.bayiId)}</span>
                <span className="block text-[11.5px] text-[var(--ms)]">
                  {c.banka}, çek no {c.no}
                </span>
              </span>
              <span className="shrink-0 text-right">
                <span className="block font-semibold tabular-nums">{tl(c.tutar)}</span>
                <span className="block text-[11.5px] text-[var(--ms)]">{tarih(c.vade)}</span>
              </span>
            </li>
          ))}
        </ul>
      ) : (
        <p className="px-4 py-4 text-[12.5px] text-[var(--ms)]">Önümüzdeki 30 günde vadesi gelen çek yok.</p>
      )}
    </Kart>
  );
}

function TahsilatGir({ b, api }: { b: Kayit; api: PanelApi }) {
  const rk = risk(api, b.id);
  const [tutar, setTutar] = useState(String(Math.max(0, Math.round(rk.vadesiGecen || rk.bakiye * 0.3))));
  const [yontem, setYontem] = useState("Havale");
  const n = Number(tutar.replace(/\./g, "").replace(",", "."));
  return (
    <div className="flex flex-wrap items-end gap-2">
      <label className="block flex-1">
        <span className="text-[11.5px] text-[var(--ms)]">Tutar, TL</span>
        <input value={tutar} inputMode="decimal" onChange={(e) => setTutar(e.target.value)} className="mt-1 h-9 w-full rounded-lg border border-[var(--k)] bg-transparent px-3 text-[13px] tabular-nums outline-none focus:border-[var(--p)] focus-visible:outline-none" />
      </label>
      <label className="block">
        <span className="text-[11.5px] text-[var(--ms)]">Yöntem</span>
        <select value={yontem} onChange={(e) => setYontem(e.target.value)} className="mt-1 h-9 rounded-lg border border-[var(--k)] bg-[var(--kart)] px-2 text-[13px] outline-none">
          {["Havale", "Çek", "Kredi kartı", "Nakit"].map((y) => (
            <option key={y}>{y}</option>
          ))}
        </select>
      </label>
      <Dugme
        tur="ana"
        disabled={!(n > 0)}
        onClick={() => {
          const t = api.ani.getTime();
          const id = api.yeniId("t");
          api.ekle("hareketler", { id, bayiId: b.id, tur: "tahsilat", tutar: n, t, vade: t, yontem, aciklama: `${yontem} ile tahsilat, ${KULLANICI.ad}` });
          if (yontem === "Çek") api.ekle("cekler", { id: `c${id}`, bayiId: b.id, banka: "Garanti BBVA", no: String(Date.now()).slice(-7), tutar: n, vade: t + 60 * GUN, durum: "portfoy" }, false);
          api.guncelle("bayiler", b.id, {}, `${tl(n)} tahsilat girildi, ${yontem}`);
          api.haber(`${tl(n)} tahsilat işlendi. ${b.ad} borcu ve limiti güncellendi.`, "basari");
          api.olay("tahsilat");
        }}
      >
        Tahsilatı işle
      </Dugme>
    </div>
  );
}

function Transfer({ u, api }: { u: Kayit; api: PanelApi }) {
  const [adet, setAdet] = useState("10");
  const [yon, setYon] = useState<"merkez" | "sincan">(u.stok.merkez >= u.stok.sincan ? "merkez" : "sincan");
  const hedef = yon === "merkez" ? "sincan" : "merkez";
  const n = Math.floor(Number(adet));
  const gecerli = n > 0 && n <= u.stok[yon];
  return (
    <div>
      <div className="flex flex-wrap items-end gap-2">
        <label className="block">
          <span className="text-[11.5px] text-[var(--ms)]">Çıkış</span>
          <select value={yon} onChange={(e) => setYon(e.target.value as "merkez" | "sincan")} className="mt-1 h-9 rounded-lg border border-[var(--k)] bg-[var(--kart)] px-2 text-[13px] outline-none">
            <option value="merkez">Merkez depo</option>
            <option value="sincan">Sincan deposu</option>
          </select>
        </label>
        <label className="block w-24">
          <span className="text-[11.5px] text-[var(--ms)]">Adet</span>
          <input value={adet} inputMode="numeric" onChange={(e) => setAdet(e.target.value)} className="mt-1 h-9 w-full rounded-lg border border-[var(--k)] bg-transparent px-3 text-[13px] tabular-nums outline-none focus:border-[var(--p)] focus-visible:outline-none" />
        </label>
        <Dugme
          tur="ana"
          ikon={IconArrowsExchange}
          disabled={!gecerli}
          onClick={() => {
            api.guncelle("urunler", u.id, { stok: { ...u.stok, [yon]: u.stok[yon] - n, [hedef]: u.stok[hedef] + n } }, `${DEPOLAR[yon]} çıkışlı ${n} ${u.birim} ${DEPOLAR[hedef]} girişine transfer edildi`);
            api.haber(`${n} ${u.birim} ${DEPOLAR[hedef]} için yola çıktı`, "basari");
            api.olay("transfer");
          }}
        >
          Transfer et
        </Dugme>
      </div>
      <p className="mt-2 text-[12px] text-[var(--ms)]">
        {gecerli ? `Transferden sonra ${DEPOLAR[yon]} ${u.stok[yon] - n}, ${DEPOLAR[hedef]} ${u.stok[hedef] + n} ${u.birim} olur.` : `${DEPOLAR[yon]} içinde ${u.stok[yon]} ${u.birim} var; daha fazlası gönderilemez.`}
      </p>
    </div>
  );
}

function siparisOlustur(api: PanelApi, bayiId: string, kalemler: { urunId: string; adet: number }[], kanal: string) {
  const b = api.bul("bayiler", bayiId)!;
  const satirlar = kalemler.map((k) => ({ ...k, birim: Math.round(netFiyat(api.bul("urunler", k.urunId)!, b.kademe, api) * 100) / 100 }));
  const araToplam = satirlar.reduce((t, k) => t + k.adet * k.birim, 0);
  const tutar = Math.round(araToplam * (1 + KDV));
  const neden = onayGerekir(api, bayiId, tutar);
  const no = String(Math.max(...api.veri.siparisler.map((s) => Number(s.id))) + 1);
  const t = api.ani.getTime();
  api.ekle("siparisler", {
    id: no,
    bayiId,
    kanal,
    kalemler: satirlar,
    araToplam,
    tutar,
    durum: neden ? "onay" : "onaylandi",
    t,
    depo: "merkez",
    onayNedeni: neden,
    gecmis: [neden ? { t, m: `${neden}, onaya düştü` } : { t, m: "Limit ve vade uygun, kendiliğinden onaylandı" }, { t, m: `${kanal} üzerinden alındı` }],
  });
  return { no, neden, tutar };
}

/* ---------------- Bayi portalı ---------------- */

function Portal({ api, modul }: { api: PanelApi; modul: ModulBilgi }) {
  const [bayiId, setBayiId] = useState(api.veri.bayiler[0].id);
  const [sepet, setSepet] = useState<Record<string, number>>({});
  const [aranan, setAranan] = useState("");
  const [gonderilen, setGonderilen] = useState<{ no: string; neden: string } | null>(null);
  const b = api.bul("bayiler", bayiId)!;
  const rk = risk(api, bayiId);
  const urunler = useMemo(() => {
    const a = aranan.toLocaleLowerCase("tr");
    return api.veri.urunler.filter((u) => !a || `${u.ad} ${u.grup} ${u.kod}`.toLocaleLowerCase("tr").includes(a));
  }, [api.veri.urunler, aranan]);
  const satirlar = Object.entries(sepet).filter(([, a]) => a > 0);
  const ara = satirlar.reduce((t, [id, a]) => t + a * netFiyat(api.bul("urunler", id)!, b.kademe, api), 0);
  const toplam = Math.round(ara * (1 + KDV));
  const neden = toplam ? onayGerekir(api, bayiId, toplam) : "";

  return (
    <>
      <EkranBasligi modul={modul}>
        <label className="flex items-center gap-2 text-[12.5px] text-[var(--ms)]">
          Bayi olarak bak
          <select
            value={bayiId}
            onChange={(e) => {
              setBayiId(e.target.value);
              setSepet({});
              setGonderilen(null);
            }}
            className="h-9 max-w-[14rem] rounded-lg border border-[var(--p)] bg-[var(--kart)] px-2 text-[13px] font-semibold text-[var(--m)] outline-none"
          >
            {api.veri.bayiler.map((x) => (
              <option key={x.id} value={x.id}>
                {x.ad}, kademe {x.kademe}
              </option>
            ))}
          </select>
        </label>
      </EkranBasligi>

      <div className="mb-4 rounded-xl border border-dashed border-[var(--p)] bg-[var(--kart)] p-4">
        <p className="text-[11.5px] font-semibold uppercase tracking-[0.08em] text-[var(--p)]">Bayinin gördüğü ekran</p>
        <div className="mt-2 flex flex-col gap-3 @3xl:flex-row @3xl:items-center @3xl:justify-between">
          <div>
            <p className="text-[17px] font-bold">
              Hoş geldiniz, {b.yetkili.split(" ")[0]} {b.kadin ? "Hanım" : "Bey"}
            </p>
            <p className="mt-0.5 text-[12.5px] text-[var(--ms)]">
              {b.ad}, kademe {b.kademe}, bütün ürünlerde iskonto {yuzde(KADEME[b.kademe] * 100)}. Vade {b.vade} gün.
            </p>
          </div>
          <div className="grid grid-cols-3 gap-4 text-[12px]">
            <div>
              <p className="text-[var(--ms)]">Limit</p>
              <p className="font-semibold tabular-nums">{tlKisa(b.limit)}</p>
            </div>
            <div>
              <p className="text-[var(--ms)]">Kalan</p>
              <p className="font-semibold tabular-nums" style={{ color: rk.kalan < 0 ? "var(--kirmizi)" : "var(--yesil)" }}>
                {kalanYaz(rk.kalan, true)}
              </p>
            </div>
            <div>
              <p className="text-[var(--ms)]">Vadesi geçen</p>
              <p className="font-semibold tabular-nums" style={{ color: rk.vadesiGecen ? "var(--kirmizi)" : undefined }}>
                {rk.vadesiGecen ? tlKisa(rk.vadesiGecen) : "Yok"}
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid gap-4 @5xl:grid-cols-[minmax(0,1fr)_20rem]">
        <Kart>
          <div className="border-b border-[var(--k)] p-3">
            <input
              value={aranan}
              onChange={(e) => setAranan(e.target.value)}
              placeholder="Ürün, marka ya da stok kodu ara"
              className="h-9 w-full rounded-lg border border-[var(--k)] bg-transparent px-3 text-[13px] outline-none placeholder:text-[var(--ms)] focus:border-[var(--p)] focus-visible:outline-none"
            />
          </div>
          <ul className="max-h-[30rem] divide-y divide-[var(--k)] overflow-y-auto">
            {urunler.map((u) => {
              const stok = toplamStok(u);
              const durum = stok === 0 ? { ad: "Stokta yok", renk: "var(--kirmizi)" } : stok < u.kritik ? { ad: "Az kaldı", renk: "var(--sari)" } : { ad: "Stokta", renk: "var(--yesil)" };
              const fiyat = netFiyat(u, b.kademe, api);
              const adet = sepet[u.id] ?? 0;
              return (
                <li key={u.id} className="flex items-center gap-3 px-4 py-2.5">
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-[13px] font-medium">{u.ad}</span>
                    <span className="flex flex-wrap gap-x-3 text-[11.5px]">
                      <span className="text-[var(--ms)]">{u.kod}</span>
                      <span style={{ color: durum.renk }}>{durum.ad}</span>
                    </span>
                  </span>
                  <span className="hidden shrink-0 text-right @2xl:block">
                    <span className="block text-[13px] font-semibold tabular-nums">{tl(fiyat)}</span>
                    <span className="block text-[11px] text-[var(--ms)]">KDV hariç, {u.birim}</span>
                  </span>
                  <span className="flex shrink-0 items-center rounded-lg border border-[var(--k)]">
                    <button type="button" aria-label="Azalt" disabled={!adet} onClick={() => setSepet((s) => ({ ...s, [u.id]: Math.max(0, adet - (u.liste > 100 ? 1 : 10)) }))} className="h-8 w-8 text-[var(--ms)] hover:text-[var(--m)] disabled:opacity-30">
                      <IconMinus size={14} className="mx-auto" />
                    </button>
                    <span className="w-8 text-center text-[12.5px] tabular-nums">{adet}</span>
                    <button type="button" aria-label="Artır" disabled={stok === 0} onClick={() => setSepet((s) => ({ ...s, [u.id]: adet + (u.liste > 100 ? 1 : 10) }))} className="h-8 w-8 text-[var(--ms)] hover:text-[var(--m)] disabled:opacity-30">
                      <IconPlus size={14} className="mx-auto" />
                    </button>
                  </span>
                </li>
              );
            })}
          </ul>
        </Kart>

        <Kart baslik="Sepet" sag={satirlar.length > 0 && <button type="button" onClick={() => setSepet({})} className="text-[var(--ms)] hover:text-[var(--m)]" aria-label="Sepeti boşalt"><IconTrash size={16} /></button>}>
          <div className="p-4">
            {gonderilen ? (
              <div>
                <p className="flex items-center gap-2 text-[14px] font-semibold text-[var(--yesil)]">
                  <IconCheck size={18} />
                  Sipariş {gonderilen.no} gönderildi
                </p>
                <p className="mt-2 text-[12.5px] leading-5 text-[var(--ms)]">
                  {gonderilen.neden ? `${gonderilen.neden}. Sipariş satış ekibinin onayına düştü.` : "Limit ve vade uygun olduğu için sipariş kendiliğinden onaylandı ve depoya indi."}
                </p>
                <div className="mt-3 flex flex-wrap gap-2">
                  <Dugme kucuk onClick={() => api.git("siparisler", { kayit: gonderilen.no })}>
                    Panelde aç
                  </Dugme>
                  <Dugme kucuk tur="sade" onClick={() => setGonderilen(null)}>
                    Yeni sipariş
                  </Dugme>
                </div>
              </div>
            ) : satirlar.length === 0 ? (
              <p className="text-[12.5px] leading-5 text-[var(--ms)]">Sepet boş. Soldaki listeden artı düğmesiyle ürün ekleyin.</p>
            ) : (
              <>
                <ul className="space-y-2">
                  {satirlar.map(([id, a]) => {
                    const u = api.bul("urunler", id)!;
                    return (
                      <li key={id} className="flex justify-between gap-3 text-[12.5px]">
                        <span className="min-w-0 truncate">
                          {a} {u.birim}, {u.ad}
                        </span>
                        <span className="shrink-0 tabular-nums">{tl(a * netFiyat(u, b.kademe, api))}</span>
                      </li>
                    );
                  })}
                </ul>
                <dl className="mt-3 space-y-1 border-t border-[var(--k)] pt-3 text-[12.5px]">
                  <div className="flex justify-between">
                    <dt className="text-[var(--ms)]">Ara toplam</dt>
                    <dd className="tabular-nums">{tl(ara)}</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-[var(--ms)]">KDV</dt>
                    <dd className="tabular-nums">{tl(toplam - ara)}</dd>
                  </div>
                  <div className="flex justify-between text-[14px] font-bold">
                    <dt>Toplam</dt>
                    <dd className="tabular-nums">{tl(toplam)}</dd>
                  </div>
                </dl>
                {neden && <p className="mt-3 rounded-lg bg-[var(--k2)] p-2.5 text-[12px] leading-5" style={{ color: RENK.sari }}>{neden}. Sipariş gönderilir ama satış ekibinin onayını bekler.</p>}
                <Dugme
                  tur="ana"
                  ikon={IconSend}
                  className="mt-3 w-full"
                  onClick={() => {
                    const sonuc = siparisOlustur(api, bayiId, satirlar.map(([urunId, adet]) => ({ urunId, adet })), "Portal");
                    setGonderilen(sonuc);
                    setSepet({});
                    api.haber(`Sipariş ${sonuc.no} bayi siparişlerine düştü`, "basari");
                    api.olay("portal-siparis");
                  }}
                >
                  Siparişi gönder
                </Dugme>
              </>
            )}
          </div>
        </Kart>
      </div>
    </>
  );
}

/* ---------------- Ekranlar ---------------- */

function uyarilar(api: PanelApi) {
  const liste: ReturnType<SektorPanel["uyarilar"]> = [];
  const s = api.ani.getTime();
  const onay = api.veri.siparisler.filter((x) => x.durum === "onay").length;
  const gecen = api.veri.bayiler.filter((b) => risk(api, b.id).vadesiGecen > 0).length;
  const kritik = api.veri.urunler.filter((u) => toplamStok(u) < u.kritik).length;
  const cek = api.veri.cekler.filter((c) => c.durum === "portfoy" && c.vade < s + 7 * GUN).length;
  const bekleyen = api.veri.siparisler.filter((x) => x.durum === "hazirlaniyor" && s - x.t > GUN).length;
  if (onay) liste.push({ metin: `${onay} sipariş limit ya da vade nedeniyle onay bekliyor`, modul: "siparisler", filtre: "Durum=Onay bekliyor", renk: "sari" });
  if (gecen) liste.push({ metin: `${gecen} bayinin vadesi geçmiş borcu var`, modul: "cari", filtre: "Durum=Vadesi geçenler", renk: "kirmizi" });
  if (bekleyen) liste.push({ metin: `${bekleyen} sipariş bir günden uzun süredir sevk bekliyor`, modul: "siparisler", filtre: "Durum=Hazırlanıyor", renk: "sari" });
  if (kritik) liste.push({ metin: `${kritik} ürün iki depoda toplam kritik seviyenin altında`, modul: "depo", filtre: "Stok=Kritik", renk: "kirmizi" });
  if (cek) liste.push({ metin: `${cek} çekin vadesi bu hafta doluyor`, modul: "cari", renk: "mavi" });
  return liste;
}

const ozet = ozetEkrani({
  kullanici: KULLANICI.ad,
  uyarilar,
  karsilama: (api) => {
    const bugun = api.veri.siparisler.filter((x) => x.t >= gunBasi(api.ani));
    return `Bugün ${bugun.length} bayi siparişi geldi, toplam ${tlKisa(bugun.reduce((t, x) => t + x.tutar, 0))}.`;
  },
  sayilar: (api) => {
    const s = api.ani.getTime();
    const satis = (bas: number, son: number) => api.veri.siparisler.filter((x) => x.durum !== "red" && x.t >= bas && x.t < son).reduce((t, x) => t + x.tutar, 0);
    const ay = satis(s - 30 * GUN, s);
    const onceki = satis(s - 60 * GUN, s - 30 * GUN);
    const acik = api.veri.siparisler.filter((x) => ACIK.includes(x.durum));
    const gecen = api.veri.bayiler.reduce((t, b) => t + risk(api, b.id).vadesiGecen, 0);
    return [
      {
        ad: "Satış, son 30 gün",
        deger: tlKisa(ay),
        degisim: onceki ? { oran: ((ay - onceki) / onceki) * 100, iyi: ay >= onceki, metin: "önceki 30 güne göre" } : undefined,
        alt: onceki ? undefined : "KDV dahil, reddedilenler hariç",
        not: "Son 30 günde alınan, reddedilmemiş bütün siparişlerin KDV dahil toplamı. Sevk edilmeyi bekleyenler de dahil.",
        seri: Array.from({ length: 8 }, (_, i) => satis(s - (8 - i) * 7 * GUN, s - (7 - i) * 7 * GUN)),
        git: () => api.git("siparisler"),
      },
      {
        ad: "Açık sipariş",
        deger: tlKisa(acik.reduce((t, x) => t + x.tutar, 0)),
        alt: `${acik.length} sipariş henüz sevk edilmedi`,
        not: "Onay bekleyen, onaylanan ve hazırlanan siparişlerin toplamı. Bu tutar bayilerin limitinden düşülür.",
        git: () => api.git("siparisler", { filtre: "Durum=Açık siparişler" }),
      },
      {
        ad: "Vadesi geçen alacak",
        deger: tlKisa(gecen),
        renk: gecen ? "kirmizi" : undefined,
        alt: `${api.veri.bayiler.filter((b) => risk(api, b.id).vadesiGecen > 0).length} bayide`,
        not: "Vadesi bugünden önce dolmuş ama ödenmemiş fatura ve devir tutarı. Tahsilatlar en eski borçtan başlayarak düşülür.",
        git: () => api.git("cari", { filtre: "Durum=Vadesi geçenler" }),
      },
      {
        ad: "Onay bekleyen sipariş",
        deger: String(api.veri.siparisler.filter((x) => x.durum === "onay").length),
        renk: "sari",
        alt: "Limit ya da vade kontrolüne takılanlar",
        not: "Bayinin limiti aşıldığında ya da vadesi geçmiş borcu olduğunda sipariş kendiliğinden onaylanmaz, burada bekler.",
        git: () => api.git("siparisler", { filtre: "Durum=Onay bekliyor" }),
      },
    ];
  },
  ana: {
    baslik: "Haftalık satış, son 8 hafta",
    icerik: (api) => {
      const s = api.ani.getTime();
      const pazartesi = gunBasi(s) - ((api.ani.getDay() + 6) % 7) * GUN;
      const veri = Array.from({ length: 8 }, (_, i) => {
        const bas = pazartesi - (7 - i) * 7 * GUN;
        const tutar = api.veri.siparisler.filter((x) => x.durum !== "red" && x.t >= bas && x.t < bas + 7 * GUN).reduce((t, x) => t + x.tutar, 0);
        return { etiket: i === 7 ? "Bu hafta" : tarih(bas), uzunEtiket: i === 7 ? "Bu hafta, bugüne kadar" : `${tarih(bas)} haftası`, deger: tutar, kismi: i === 7 };
      });
      return <CubukGrafik veri={veri} bicim={tlKisa} ozet="Hafta pazartesi başlar, KDV dahil" seriAdi="Tamamlanan hafta" kismiAdi="Bu hafta, bugüne kadar" />;
    },
  },
  parcalar: [
    {
      baslik: "Kademeye göre satış, 30 gün",
      icerik: (api) => {
        const s = api.ani.getTime();
        const dilimler = (["A", "B", "C"] as const).map((k, i) => ({
          ad: `Kademe ${k}`,
          renk: ["vurgu", "mor", "sari"][i],
          deger: api.veri.siparisler.filter((x) => x.durum !== "red" && x.t > s - 30 * GUN && api.bul("bayiler", x.bayiId)?.kademe === k).reduce((t, x) => t + x.tutar, 0),
        }));
        return <HalkaGrafik dilimler={dilimler} bicim={tlKisa} merkez={tlKisa(dilimler.reduce((t, d) => t + d.deger, 0))} />;
      },
    },
    {
      baslik: "Vadesi geçen borcu en yüksek bayiler",
      icerik: (api) => {
        const liste = api.veri.bayiler
          .map((b) => ({ b, r: risk(api, b.id) }))
          .filter((x) => x.r.vadesiGecen > 0)
          .sort((a, b) => b.r.vadesiGecen - a.r.vadesiGecen)
          .slice(0, 5);
        if (!liste.length) return <p className="text-[12.5px] text-[var(--ms)]">Vadesi geçmiş borç yok.</p>;
        return (
          <ul className="divide-y divide-[var(--k)]">
            {liste.map(({ b, r }) => (
              <li key={b.id}>
                <button type="button" onClick={() => api.git("cari", { kayit: b.id })} className="flex w-full items-center justify-between gap-3 py-2 text-left text-[12.5px] hover:text-[var(--p)]">
                  <span className="min-w-0">
                    <span className="block truncate font-medium">{b.ad}</span>
                    <span className="block text-[11.5px] text-[var(--ms)]">
                      {Math.floor((api.ani.getTime() - r.enEski) / GUN)} gündür, plasiyer {b.plasiyer}
                    </span>
                  </span>
                  <span className="shrink-0 font-semibold tabular-nums text-[var(--kirmizi)]">{tl(r.vadesiGecen)}</span>
                </button>
              </li>
            ))}
          </ul>
        );
      },
    },
  ],
});

const bayiSutunlari = {
  kademe: { ad: "Kademe", deger: (b: Kayit) => b.kademe, sirala: (b: Kayit) => b.kademe, oncelik: 2 as const },
  bakiye: { ad: "Cari borç", deger: (b: Kayit, api: PanelApi) => bakiyeYaz(risk(api, b.id).bakiye), csv: (b: Kayit, api: PanelApi) => Math.round(risk(api, b.id).bakiye), hiza: "sag" as const, oncelik: 1 as const },
  gecen: {
    ad: "Vadesi geçen",
    deger: (b: Kayit, api: PanelApi) => {
      const r = risk(api, b.id);
      return r.vadesiGecen ? <span className="text-[var(--kirmizi)]">{tl(r.vadesiGecen)}</span> : "Yok";
    },
    csv: (b: Kayit, api: PanelApi) => Math.round(risk(api, b.id).vadesiGecen),
    hiza: "sag" as const,
    oncelik: 1 as const,
  },
};

const panel: SektorPanel = {
  saat: { acilis: 7, kapanis: 22, yogun: 11 },
  kullanici: KULLANICI,
  uret,
  uyarilar,
  moduller: [
    { id: "ozet", grup: "Genel", ekran: ozet },
    {
      id: "siparisler",
      grup: "Satış",
      rozet: (api) => api.veri.siparisler.filter((s) => s.durum === "onay").length,
      ekran: {
        tur: "liste",
        koleksiyon: "siparisler",
        baslikAdi: "Sipariş",
        baslik: (s) => `Sipariş ${s.id}`,
        alt: (s, api) => bayiAdi(api, s.bayiId),
        harf: (s, api) => bayiAdi(api, s.bayiId),
        durum: (s) => SIPARIS_DURUMU[s.durum],
        arama: (s, api) => `${bayiAdi(api, s.bayiId)} ${s.kanal} ${s.kalemler.map((k: Kayit) => urunAdi(api, k.urunId)).join(" ")}`,
        sira: (a, b) => (a.durum === "onay" ? 0 : 1) - (b.durum === "onay" ? 0 : 1) || b.t - a.t,
        sutunlar: [
          { ad: "Zaman", deger: (s, api) => zaman(s.t, api.ani), sirala: (s) => s.t, oncelik: 1 },
          { ad: "Kanal", deger: (s) => s.kanal, sirala: (s) => s.kanal, oncelik: 2 },
          { ad: "Kalem", deger: (s) => `${s.kalemler.length} kalem`, oncelik: 3 },
          { ad: "Depo", deger: (s) => DEPOLAR[s.depo as DepoAdi], oncelik: 3 },
          { ad: "Tutar", deger: (s) => tl(s.tutar), sirala: (s) => s.tutar, csv: (s) => s.tutar, hiza: "sag", oncelik: 1 },
        ],
        filtreler: [
          {
            ad: "Durum",
            secenekler: [
              { ad: "Onay bekliyor", kosul: (s) => s.durum === "onay" },
              { ad: "Açık siparişler", kosul: (s) => ACIK.includes(s.durum) },
              { ad: "Onaylandı", kosul: (s) => s.durum === "onaylandi" },
              { ad: "Hazırlanıyor", kosul: (s) => s.durum === "hazirlaniyor" },
              { ad: "Sevk edildi", kosul: (s) => s.durum === "sevk" },
              { ad: "Reddedildi", kosul: (s) => s.durum === "red" },
            ],
          },
          { ad: "Kanal", secenekler: ["Portal", "Plasiyer", "Telefon"].map((k) => ({ ad: k, kosul: (s: Kayit) => s.kanal === k })) },
          { ad: "Depo", secenekler: (Object.keys(DEPOLAR) as DepoAdi[]).map((d) => ({ ad: DEPOLAR[d], kosul: (s: Kayit) => s.depo === d })) },
        ],
        ozet: (api) => {
          const l = api.veri.siparisler;
          const say = (d: string) => l.filter((x) => x.durum === d).length;
          return [
            { ad: "Onay bekliyor", deger: String(say("onay")), renk: "sari" },
            { ad: "Onaylandı", deger: String(say("onaylandi")), renk: "mavi" },
            { ad: "Hazırlanıyor", deger: String(say("hazirlaniyor")), renk: "mor" },
            { ad: "Portaldan gelen, 30 gün", deger: yuzde((l.filter((x) => x.kanal === "Portal").length / l.length) * 100), not: "Telefon ve mesaj yerine" },
          ];
        },
        detay: {
          bolumler: (s, api) => (
            <>
              <Bolum baslik="Sipariş">
                <AlanListesi
                  alanlar={[
                    ["Bayi", bayiAdi(api, s.bayiId)],
                    ["Kanal", s.kanal],
                    ["Zaman", zaman(s.t, api.ani)],
                    ["Depo", DEPOLAR[s.depo as DepoAdi]],
                  ]}
                />
                {s.durum === "onay" && s.onayNedeni && (
                  <p className="mt-3 rounded-lg bg-[var(--k2)] p-3 text-[12.5px] leading-5" style={{ color: RENK.sari }}>
                    Onaya düşme nedeni. {s.onayNedeni}.
                  </p>
                )}
              </Bolum>
              <Bolum
                baslik="Bayinin limiti"
                sag={
                  <button type="button" onClick={() => api.git("bayiler", { kayit: s.bayiId })} className="text-[12px] font-semibold text-[var(--p)] hover:underline">
                    Bayiyi aç
                  </button>
                }
              >
                <LimitKutusu api={api} bayiId={s.bayiId} />
              </Bolum>
              <Bolum baslik="Kalemler">
                <MiniTablo
                  basliklar={["Ürün", "Adet", "Birim", "Tutar"]}
                  sagdakiler={[1, 2, 3]}
                  satirlar={[
                    ...s.kalemler.map((k: Kayit) => [urunAdi(api, k.urunId), k.adet, tl(k.birim), tl(k.adet * k.birim)]),
                    [<span className="text-[var(--ms)]">KDV yüzde 20</span>, "", "", tl(s.tutar - s.araToplam)],
                    [<strong>Toplam</strong>, "", "", <strong>{tl(s.tutar)}</strong>],
                  ]}
                />
              </Bolum>
              <Bolum baslik="Geçmiş">
                <Gecmis satirlar={s.gecmis.map((g: Kayit) => ({ zaman: zaman(g.t, api.ani), metin: g.m }))} />
              </Bolum>
            </>
          ),
          eylemler: [
            {
              ad: "Onayla",
              tur: "ana",
              ikon: IconCheck,
              gorunur: (s) => s.durum === "onay",
              uygula: (s, api) => {
                api.guncelle("siparisler", s.id, { durum: "onaylandi" }, `Onaylandı, ${KULLANICI.ad}`);
                api.haber(`Sipariş ${s.id} onaylandı, depoya indi. Bayiye bilgi gitti.`, "basari");
                api.olay("siparis-onay");
              },
            },
            {
              ad: "Reddet",
              tur: "tehlike",
              ikon: IconX,
              gorunur: (s) => s.durum === "onay",
              uygula: (s, api) => {
                api.guncelle("siparisler", s.id, { durum: "red" }, `Reddedildi, ${KULLANICI.ad}, önce tahsilat istendi`);
                api.haber("Sipariş reddedildi, bayiye gerekçesiyle bilgi gitti", "bilgi");
                api.olay("siparis-onay");
              },
            },
            {
              ad: "Hazırlamaya al",
              tur: "ana",
              ikon: IconCheck,
              gorunur: (s) => s.durum === "onaylandi",
              uygula: (s, api) => {
                api.guncelle("siparisler", s.id, { durum: "hazirlaniyor" }, `Hazırlamaya alındı, ${DEPOLAR[s.depo as DepoAdi]}`);
                api.haber("Toplama listesi depoya gönderildi", "basari");
              },
            },
            {
              ad: "Sevk et",
              tur: "ana",
              ikon: IconTruckDelivery,
              gorunur: (s) => s.durum === "hazirlaniyor",
              uygula: (s, api) => {
                const t = api.ani.getTime();
                const b = api.bul("bayiler", s.bayiId)!;
                for (const k of s.kalemler) {
                  const u = api.bul("urunler", k.urunId);
                  if (u) api.guncelle("urunler", u.id, { stok: { ...u.stok, [s.depo]: Math.max(0, u.stok[s.depo] - k.adet) } });
                }
                api.ekle("hareketler", { id: `f${s.id}`, bayiId: s.bayiId, tur: "fatura", tutar: s.tutar, t, vade: t + b.vade * GUN, aciklama: `Sipariş ${s.id} faturası` });
                api.guncelle("siparisler", s.id, { durum: "sevk" }, "Sevk edildi, irsaliye ve fatura kesildi");
                api.haber(`Sevk edildi. ${tl(s.tutar)} fatura ${b.ad} carisine işlendi, vade ${b.vade} gün.`, "basari");
                api.olay("sevk");
              },
            },
          ],
        },
      },
    },
    {
      id: "bayiler",
      grup: "Satış",
      ekran: {
        tur: "liste",
        koleksiyon: "bayiler",
        baslikAdi: "Bayi",
        baslik: (b) => b.ad,
        harf: (b) => b.ad,
        alt: (b) => `${b.sehir}, ${b.yetkili}`,
        durum: bayiDurumu,
        arama: (b) => `${b.sehir} ${b.yetkili} ${b.telefon} ${b.plasiyer}`,
        sutunlar: [
          bayiSutunlari.kademe,
          { ad: "Plasiyer", deger: (b) => b.plasiyer, sirala: (b) => b.plasiyer, oncelik: 3 },
          { ad: "Limit", deger: (b) => tlKisa(b.limit), sirala: (b) => b.limit, csv: (b) => b.limit, hiza: "sag", oncelik: 2 },
          {
            ad: "Limit kullanımı",
            deger: (b, api) => {
              const o = risk(api, b.id).oran;
              return (
                <span className="flex items-center gap-2">
                  <span className="w-16">
                    <Cubuk oran={o} ince renk={o > 1 ? "var(--kirmizi)" : o > 0.85 ? "var(--sari)" : "var(--p)"} />
                  </span>
                  <span className="tabular-nums text-[12px]">{yuzde(o * 100)}</span>
                </span>
              );
            },
            sirala: (b) => b.limit,
            oncelik: 1,
          },
          bayiSutunlari.bakiye,
        ],
        filtreler: [
          { ad: "Kademe", secenekler: ["A", "B", "C"].map((k) => ({ ad: `Kademe ${k}`, kosul: (b: Kayit) => b.kademe === k })) },
          { ad: "Plasiyer", secenekler: PLASIYERLER.map((p) => ({ ad: p, kosul: (b: Kayit) => b.plasiyer === p })) },
          {
            ad: "Risk",
            secenekler: [
              { ad: "Limiti yüzde 85 üstü dolu", kosul: (b, api) => risk(api, b.id).oran > 0.85 },
              { ad: "Vadesi geçmiş borcu olan", kosul: (b, api) => risk(api, b.id).vadesiGecen > 0 },
            ],
          },
        ],
        detay: {
          bolumler: (b, api) => {
            const siparisler = api.veri.siparisler.filter((s) => s.bayiId === b.id).slice(0, 6);
            return (
              <>
                <Bolum baslik="Bayi">
                  <AlanListesi
                    alanlar={[
                      ["Yetkili", b.yetkili],
                      ["Telefon", b.telefon],
                      ["Şehir", b.sehir],
                      ["Plasiyer", b.plasiyer],
                      ["Kademe", `${b.kademe}, iskonto ${yuzde(KADEME[b.kademe] * 100)}`],
                      ["Vade", `${b.vade} gün`],
                    ]}
                  />
                </Bolum>
                <Bolum baslik="Risk">
                  <LimitKutusu api={api} bayiId={b.id} />
                </Bolum>
                <Bolum baslik="Son siparişler">
                  <ul className="divide-y divide-[var(--k)]">
                    {siparisler.map((s) => (
                      <li key={s.id}>
                        <button type="button" onClick={() => api.git("siparisler", { kayit: s.id })} className="flex w-full items-center justify-between gap-3 py-2 text-left text-[12.5px] hover:text-[var(--p)]">
                          <span>
                            Sipariş {s.id}, {tarih(s.t)}
                          </span>
                          <span className="tabular-nums">{tl(s.tutar)}</span>
                        </button>
                      </li>
                    ))}
                  </ul>
                </Bolum>
                <Bolum baslik="Geçmiş">
                  <Gecmis satirlar={b.gecmis.map((g: Kayit) => ({ zaman: zaman(g.t, api.ani), metin: g.m }))} />
                </Bolum>
              </>
            );
          },
          eylemler: [
            {
              ad: "Kademeyi değiştir",
              uygula: (b, api) => {
                const yeni = b.kademe === "A" ? "C" : b.kademe === "B" ? "A" : "B";
                api.guncelle("bayiler", b.id, { kademe: yeni }, `Kademe ${b.kademe} yerine ${yeni} oldu, ${KULLANICI.ad}`);
                api.haber(`${b.ad} artık kademe ${yeni}. Portalındaki fiyatlar iskonto ${yuzde(KADEME[yeni] * 100)} ile yenilendi.`, "basari");
                api.olay("kademe");
              },
            },
            {
              ad: "Limiti 100 bin TL artır",
              tur: "ana",
              uygula: (b, api) => {
                api.guncelle("bayiler", b.id, { limit: b.limit + 100_000 }, `Limit ${tlKisa(b.limit)} yerine ${tlKisa(b.limit + 100_000)} oldu, ${KULLANICI.ad}`);
                api.haber("Limit artırıldı. Onay bekleyen siparişleri yeniden değerlendirebilirsiniz.", "basari");
              },
            },
          ],
        },
      },
    },
    {
      id: "fiyatlar",
      grup: "Satış",
      ekran: {
        tur: "liste",
        koleksiyon: "urunler",
        baslikAdi: "Ürün",
        baslik: (u) => u.ad,
        alt: (u) => `${u.kod}, ${u.grup}`,
        arama: (u) => `${u.kod} ${u.grup}`,
        ust: KurPaneli,
        sutunlar: [
          { ad: "Liste fiyatı", deger: (u) => dovizYaz(u), sirala: (u) => u.liste, csv: (u) => `${u.liste} ${u.doviz}`, oncelik: 2 },
          { ad: "TL karşılığı", deger: (u, api) => tl(listeTL(u, api)), csv: (u, api) => Math.round(listeTL(u, api)), hiza: "sag", oncelik: 3 },
          ...(["A", "B", "C"] as const).map((k) => ({
            ad: `Kademe ${k}`,
            deger: (u: Kayit, api: PanelApi) => tl(netFiyat(u, k, api) * (1 + KDV)),
            csv: (u: Kayit, api: PanelApi) => Math.round(netFiyat(u, k, api) * (1 + KDV)),
            hiza: "sag" as const,
            oncelik: (k === "B" ? 2 : 1) as 1 | 2,
          })),
        ],
        filtreler: [
          { ad: "Para birimi", secenekler: [["Euro", "EUR"], ["Dolar", "USD"], ["TL", "TL"]].map(([ad, d]) => ({ ad, kosul: (u: Kayit) => u.doviz === d })) },
          { ad: "Grup", secenekler: [...new Set(URUNLER.map((u) => u[1]))].map((g) => ({ ad: g, kosul: (u: Kayit) => u.grup === g })) },
        ],
        detay: {
          bolumler: (u, api) => (
            <>
              <Bolum baslik="Fiyat hesabı">
                <MiniTablo
                  basliklar={["Kalem", "Tutar"]}
                  sagdakiler={[1]}
                  satirlar={[
                    ["Liste fiyatı", dovizYaz(u)],
                    ...(u.doviz !== "TL" ? [[`Kur ${sayi(kur(api, u.doviz), 2)}`, tl(listeTL(u, api))]] : []),
                    ...(["A", "B", "C"] as const).map((k) => [`Kademe ${k}, iskonto ${yuzde(KADEME[k] * 100)}, KDV dahil`, <strong>{tl(netFiyat(u, k, api) * (1 + KDV))}</strong>]),
                  ]}
                />
                <p className="mt-3 text-[12px] leading-5 text-[var(--ms)]">Fiyat kayıtta tutulmaz, her açılışta liste fiyatı, kur ve kademeden yeniden hesaplanır. Kur değişince eski fiyatla satış olmaz.</p>
              </Bolum>
              <Bolum baslik="Stok">
                <AlanListesi alanlar={[[DEPOLAR.merkez, `${u.stok.merkez} ${u.birim}`], [DEPOLAR.sincan, `${u.stok.sincan} ${u.birim}`]]} />
              </Bolum>
            </>
          ),
        },
      },
    },
    {
      id: "cari",
      grup: "Finans",
      rozet: (api) => api.veri.bayiler.filter((b) => risk(api, b.id).vadesiGecen > 0).length,
      ekran: {
        tur: "liste",
        koleksiyon: "bayiler",
        baslikAdi: "Bayi",
        baslik: (b) => b.ad,
        harf: (b) => b.ad,
        alt: (b) => `Plasiyer ${b.plasiyer}, vade ${b.vade} gün`,
        durum: (b, api) => {
          const r = risk(api, b.id);
          return r.vadesiGecen > 0 ? { ad: `${Math.floor((api.ani.getTime() - r.enEski) / GUN)} gün gecikmiş`, renk: "kirmizi" } : r.bakiye > 0 ? { ad: "Vadesi gelmedi", renk: "mavi" } : { ad: "Borcu yok", renk: "yesil" };
        },
        arama: (b) => `${b.plasiyer} ${b.yetkili}`,
        sira: (a, b) => b.limit - a.limit,
        ust: CekTakvimi,
        sutunlar: [
          bayiSutunlari.bakiye,
          bayiSutunlari.gecen,
          {
            ad: "Son tahsilat",
            deger: (b, api) => {
              const t = api.veri.hareketler.find((h) => h.bayiId === b.id && h.tur === "tahsilat");
              return t ? `${tarih(t.t)}, ${tlKisa(t.tutar)}` : "Yok";
            },
            oncelik: 3,
          },
        ],
        filtreler: [
          {
            ad: "Durum",
            secenekler: [
              { ad: "Vadesi geçenler", kosul: (b, api) => risk(api, b.id).vadesiGecen > 0 },
              { ad: "Borcu olanlar", kosul: (b, api) => risk(api, b.id).bakiye > 0 },
            ],
          },
          { ad: "Plasiyer", secenekler: PLASIYERLER.map((p) => ({ ad: p, kosul: (b: Kayit) => b.plasiyer === p })) },
        ],
        ozet: (api) => {
          const r = api.veri.bayiler.map((b) => risk(api, b.id));
          const s = api.ani.getTime();
          return [
            { ad: "Toplam alacak", deger: tlKisa(r.reduce((t, x) => t + Math.max(0, x.bakiye), 0)) },
            { ad: "Vadesi geçen", deger: tlKisa(r.reduce((t, x) => t + x.vadesiGecen, 0)), renk: "kirmizi" },
            { ad: "Tahsilat, 30 gün", deger: tlKisa(api.veri.hareketler.filter((h) => h.tur === "tahsilat" && h.t > s - 30 * GUN).reduce((t, h) => t + h.tutar, 0)), renk: "yesil" },
            { ad: "Portföydeki çek", deger: tlKisa(api.veri.cekler.filter((c) => c.durum === "portfoy").reduce((t, c) => t + c.tutar, 0)) },
          ];
        },
        detay: {
          bolumler: (b, api) => {
            const h = api.veri.hareketler.filter((x) => x.bayiId === b.id).sort((x, y) => x.t - y.t);
            let bakiye = 0;
            const satirlar = h.map((x) => {
              bakiye += x.tur === "tahsilat" ? -x.tutar : x.tutar;
              return { x, bakiye };
            });
            return (
              <>
                <Bolum baslik="Tahsilat gir">
                  <TahsilatGir key={satirlar.length} b={b} api={api} />
                </Bolum>
                <Bolum baslik="Durum">
                  <LimitKutusu api={api} bayiId={b.id} />
                </Bolum>
                <Bolum baslik="Ekstre">
                  <MiniTablo
                    basliklar={["Tarih", "Açıklama", "Tutar", "Bakiye"]}
                    sagdakiler={[2, 3]}
                    satirlar={satirlar
                      .slice(-10)
                      .reverse()
                      .map(({ x, bakiye: kalan }) => [
                        tarih(x.t),
                        <span>
                          {x.aciklama}
                          {x.tur !== "tahsilat" && <span className="block text-[11px] text-[var(--ms)]">Vade {tarih(x.vade)}</span>}
                        </span>,
                        <span style={{ color: x.tur === "tahsilat" ? "var(--yesil)" : undefined }}>{tl(x.tutar)}</span>,
                        bakiyeYaz(kalan),
                      ])}
                  />
                </Bolum>
              </>
            );
          },
        },
      },
    },
    {
      id: "depo",
      grup: "Operasyon",
      rozet: (api) => api.veri.urunler.filter((u) => toplamStok(u) < u.kritik).length,
      ekran: {
        tur: "liste",
        koleksiyon: "urunler",
        baslikAdi: "Ürün",
        baslik: (u) => u.ad,
        alt: (u) => `${u.kod}, ${u.grup}`,
        durum: (u) => (toplamStok(u) === 0 ? { ad: "Tükendi", renk: "kirmizi" } : toplamStok(u) < u.kritik ? { ad: "Kritik", renk: "kirmizi" } : u.stok.merkez < u.kritik / 2 || u.stok.sincan === 0 ? { ad: "Bir depoda az", renk: "sari" } : { ad: "Yeterli", renk: "yesil" }),
        arama: (u) => `${u.kod} ${u.grup}`,
        sira: (a, b) => toplamStok(a) / a.kritik - toplamStok(b) / b.kritik,
        sutunlar: [
          { ad: "Merkez", deger: (u) => `${u.stok.merkez} ${u.birim}`, sirala: (u) => u.stok.merkez, csv: (u) => u.stok.merkez, hiza: "sag", oncelik: 1 },
          { ad: "Sincan", deger: (u) => `${u.stok.sincan} ${u.birim}`, sirala: (u) => u.stok.sincan, csv: (u) => u.stok.sincan, hiza: "sag", oncelik: 1 },
          { ad: "Kritik seviye", deger: (u) => `${u.kritik}`, hiza: "sag", oncelik: 2 },
          { ad: "Stok değeri", deger: (u, api) => tl(toplamStok(u) * listeTL(u, api) * 0.62), hiza: "sag", oncelik: 3 },
        ],
        filtreler: [
          {
            ad: "Stok",
            secenekler: [
              { ad: "Kritik", kosul: (u) => toplamStok(u) < u.kritik },
              { ad: "Bir depoda az", kosul: (u) => toplamStok(u) >= u.kritik && (u.stok.merkez < u.kritik / 2 || u.stok.sincan === 0) },
            ],
          },
          { ad: "Grup", secenekler: [...new Set(URUNLER.map((u) => u[1]))].map((g) => ({ ad: g, kosul: (u: Kayit) => u.grup === g })) },
        ],
        ozet: (api) => {
          const u = api.veri.urunler;
          return [
            { ad: "Merkez depo", deger: `${sayi(u.reduce((t, x) => t + x.stok.merkez, 0))} birim` },
            { ad: "Sincan deposu", deger: `${sayi(u.reduce((t, x) => t + x.stok.sincan, 0))} birim` },
            { ad: "Kritik ürün", deger: String(u.filter((x) => toplamStok(x) < x.kritik).length), renk: "kirmizi" },
            { ad: "Stok değeri", deger: tlKisa(u.reduce((t, x) => t + toplamStok(x) * listeTL(x, api) * 0.62, 0)), not: "Alış maliyetiyle, tahmini" },
          ];
        },
        detay: {
          bolumler: (u, api) => (
            <>
              <Bolum baslik="Stok">
                <AlanListesi alanlar={[[DEPOLAR.merkez, `${u.stok.merkez} ${u.birim}`], [DEPOLAR.sincan, `${u.stok.sincan} ${u.birim}`], ["Toplam", `${toplamStok(u)} ${u.birim}`], ["Kritik seviye", `${u.kritik} ${u.birim}`]]} />
              </Bolum>
              <Bolum baslik="Depolar arası transfer">
                <Transfer key={JSON.stringify(u.stok)} u={u} api={api} />
              </Bolum>
              <Bolum baslik="Hareketler">
                <Gecmis satirlar={u.gecmis.map((g: Kayit) => ({ zaman: zaman(g.t, api.ani), metin: g.m }))} />
              </Bolum>
            </>
          ),
          eylemler: [
            {
              ad: "Tedarikçiye sipariş aç",
              tur: "ana",
              uygula: (u, api) => {
                api.guncelle("urunler", u.id, {}, `Tedarikçiye ${u.kritik * 4} ${u.birim} sipariş açıldı, ${KULLANICI.ad}`);
                api.haber(`${u.kritik * 4} ${u.birim} için satın alma siparişi açıldı`, "basari");
              },
            },
          ],
        },
      },
    },
    { id: "portal", grup: "Bayi tarafı", ekran: { tur: "ozel", bilesen: Portal } },
  ],
  arama: [
    { koleksiyon: "bayiler", modul: "bayiler", baslik: (b) => b.ad, alt: (b) => `${b.sehir}, kademe ${b.kademe}`, metin: (b) => `${b.yetkili} ${b.telefon}` },
    { koleksiyon: "siparisler", modul: "siparisler", baslik: (s) => `Sipariş ${s.id}`, alt: (s) => tl(s.tutar), metin: (s) => s.id },
    { koleksiyon: "urunler", modul: "fiyatlar", baslik: (u) => u.ad, alt: (u) => `${u.kod}, ${dovizYaz(u)}`, metin: (u) => `${u.kod} ${u.grup}` },
  ],
  gorevler: [
    { id: "g1", metin: "Onay bekleyen bir siparişi sonuçlandırın", ipucu: "Bayi siparişlerinde en üstteki sarı siparişi açın, limit hesabını okuyup karar verin.", modul: "siparisler", olay: "siparis-onay" },
    { id: "g2", metin: "Kuru güncelleyin", ipucu: "Fiyat listesinin üstündeki euro kuruna yeni bir değer yazın, bütün fiyatlar yenilensin.", modul: "fiyatlar", olay: "kur" },
    { id: "g3", metin: "Bayi gözüyle sipariş verin", ipucu: "Bayi portalında sepete ürün ekleyip gönderin, siparişin panele düştüğünü görün.", modul: "portal", olay: "portal-siparis" },
    { id: "g4", metin: "Bir bayiden tahsilat girin", ipucu: "Cari ve tahsilat ekranında vadesi geçmiş bir bayiyi açın.", modul: "cari", olay: "tahsilat" },
    { id: "g5", metin: "Depolar arasında transfer yapın", ipucu: "Depolar ekranında bir ürünü açın, Sincan deposuna gönderin.", modul: "depo", olay: "transfer" },
  ],
  canli: {
    aralik: 38_000,
    uret: (api, r) => {
      const b = r.sec(api.veri.bayiler);
      const kalemler = r
        .karistir([...api.veri.urunler])
        .filter((u) => toplamStok(u) > 0)
        .slice(0, r.tam(2, 5))
        .map((u) => ({ urunId: u.id, adet: u.liste > 100 ? r.tam(1, 3) : r.sec([10, 20, 24]) }));
      const { no, neden, tutar } = siparisOlustur(api, b.id, kalemler, "Portal");
      api.bildir(`${b.ad} portaldan ${tl(tutar)} sipariş verdi${neden ? ", onay bekliyor" : ""}`, "siparisler", no);
    },
  },
};

export default panel;
export { bilgi };
