/*
 * Emlak ofisi demosu: Kıyı Gayrimenkul. Talep ile ilan arasındaki uyum puanı
 * her açılışta portföyden hesaplanır; ilan fiyatı ya da durumu değişince
 * eşleşmeler de kendiliğinden değişir.
 */
import { useState } from "react";
import { IconBrandWhatsapp, IconCalendarPlus, IconCheck, IconRefresh, IconSend } from "@tabler/icons-react";
import { emlak as bilgi } from "./bilgi";
import { ozetEkrani } from "../../panel/Ozet";
import { AlanListesi, Anahtar, Bolum, Cubuk, Dugme, DurumYazi, Gecmis, MiniTablo, RENK } from "../../panel/parcalar";
import { HalkaGrafik } from "../../panel/grafik";
import { DAKIKA, GUN, SAAT, gunBasi, gunAdi, kisiler, mesaiAni, saat, sayi, tarih, tarihYil, tl, tlKisa, yuzde, zaman } from "../../ortak";
import type { Durum, Kayit, PanelApi, Rastgele, SektorPanel, Veri } from "../../tipler";

const KULLANICI = { ad: "Burcu Tekin", rol: "Ofis müdürü" };
const BOLGELER: Record<string, string[]> = {
  Muratpaşa: ["Lara", "Fener", "Şirinyalı", "Yeşilbahçe", "Güzeloba"],
  Konyaaltı: ["Hurma", "Liman", "Uncalı", "Sarısu", "Gürsu"],
  Kepez: ["Varsak", "Göksu", "Ahatlı"],
  Döşemealtı: ["Yeniköy", "Altınkale"],
  Aksu: ["Kundu", "Altıntaş"],
};
const ILCELER = Object.keys(BOLGELER);
const PORTALLAR = ["Site", "Hepsiemlak", "Emlakjet"];
const KOMISYON = { satis: 0.02, danismanPayi: 0.4 };
const DANISMAN_ADLARI = ["Ece Karaca", "Serkan Yıldız", "Melis Aydın", "Kaan Öztürk", "Derya Şahin", "Tolga Erdem"];

/* ---------------- Hesaplar ---------------- */

const ACIK_ILAN = ["Yayında", "Opsiyonlu"];
const ilanDurumu = (p: Kayit): Durum =>
  ({ Yayında: { ad: "Yayında", renk: "yesil" }, Opsiyonlu: { ad: "Opsiyonlu", renk: "sari" }, Satıldı: { ad: "Satıldı", renk: "mavi" }, Kiralandı: { ad: "Kiralandı", renk: "mavi" }, Pasif: { ad: "Pasif", renk: "gri" } })[p.durum as string] as Durum;
const odaYaz = (p: Kayit) => (p.oda ? `${p.oda} oda` : "Açık alan");
const fiyatYaz = (p: Kayit) => (p.islem === "Kiralık" ? `${tl(p.fiyat)} aylık` : tlKisa(p.fiyat));
const ilanBasligi = (p: Kayit) => `${p.mahalle}, ${p.tip === "Daire" ? `${p.oda} odalı daire` : p.tip.toLocaleLowerCase("tr")}`;

/** Talep ile ilan arasındaki uyum, 0 ile 100 arası. İşlem ya da tip uymazsa 0. */
function uyum(t: Kayit, p: Kayit) {
  if (!ACIK_ILAN.includes(p.durum) || t.islem !== p.islem || t.tip !== p.tip) return 0;
  let puan = 100;
  if (p.fiyat > t.butceMax) puan -= Math.min(60, ((p.fiyat - t.butceMax) / t.butceMax) * 300);
  if (p.fiyat < t.butceMin * 0.8) puan -= 10;
  if (!t.ilceler.includes(p.ilce)) puan -= 35;
  if (t.odaMin && p.oda < t.odaMin) puan -= 25 * (t.odaMin - p.oda);
  if (p.durum === "Opsiyonlu") puan -= 10;
  return Math.max(0, Math.round(puan));
}
const eslesenler = (t: Kayit, api: PanelApi, esik = 60) =>
  api.veri.portfoy
    .map((p) => ({ p, puan: uyum(t, p) }))
    .filter((x) => x.puan >= esik)
    .sort((a, b) => b.puan - a.puan);

const TALEP_DURUMU: Record<string, Durum> = {
  Yeni: { ad: "Yeni", renk: "mavi" },
  "Eşleşme gönderildi": { ad: "Eşleşme gönderildi", renk: "mor" },
  "Gösterim yapıldı": { ad: "Gösterim yapıldı", renk: "sari" },
  Teklif: { ad: "Teklif aşamasında", renk: "sari" },
  Kapandı: { ad: "Kapandı", renk: "yesil" },
  Vazgeçti: { ad: "Vazgeçti", renk: "gri" },
};
const ACIK_TALEP = ["Yeni", "Eşleşme gönderildi", "Gösterim yapıldı", "Teklif"];

const butceYaz = (t: Kayit) => (t.islem === "Kiralık" ? `${sayi(Math.round(t.butceMin / 1000))} ile ${sayi(Math.round(t.butceMax / 1000))} bin TL aylık` : `${tlKisa(t.butceMin)} ile ${tlKisa(t.butceMax)}`);
const danismanAdi = (api: PanelApi, id: string) => api.bul("danismanlar", id)?.ad ?? "Danışman";

function sozlesmeDurumu(s: Kayit, api: PanelApi): Durum {
  const n = api.ani.getTime();
  if (s.bit < n) return { ad: "Süresi doldu", renk: "gri" };
  if (s.gecikme) return { ad: "Ödeme gecikti", renk: "kirmizi" };
  if (s.bit < n + 60 * GUN) return { ad: "Bitiyor", renk: "sari" };
  return { ad: "Devam ediyor", renk: "yesil" };
}

function komisyon(p: Kayit) {
  const ofis = p.islem === "Kiralık" ? p.kapanisFiyat : p.kapanisFiyat * KOMISYON.satis * 2;
  return { ofis, danisman: ofis * KOMISYON.danismanPayi };
}

/* ---------------- Veri üretimi ---------------- */

function uret(ani: Date, r: Rastgele): Veri {
  const simdi = ani.getTime();
  const dKisi = kisiler(r, 6);
  const danismanlar: Kayit[] = DANISMAN_ADLARI.map((ad, i) => ({ id: `d${i + 1}`, ad, telefon: dKisi[i].telefon, bolge: ILCELER[i % 3], gecmis: [] }));

  const portfoy: Kayit[] = [];
  for (let i = 0; i < 118; i++) {
    const ilce = r.agirlikli([["Muratpaşa", 34], ["Konyaaltı", 32], ["Kepez", 16], ["Döşemealtı", 9], ["Aksu", 9]] as const);
    const islem = r.agirlikli([["Satılık", 55], ["Kiralık", 45]] as const);
    const tip = r.agirlikli([["Daire", 80], ["Villa", 11], ["Dükkan", 9]] as const);
    const oda = tip === "Dükkan" ? 0 : tip === "Villa" ? r.tam(4, 6) : r.agirlikli([[1, 14], [2, 34], [3, 38], [4, 14]] as const);
    const m2 = tip === "Dükkan" ? r.tam(45, 260) : tip === "Villa" ? r.tam(220, 480) : 45 + oda * r.tam(24, 34);
    const bolgeCarpani = { Muratpaşa: 1.15, Konyaaltı: 1.2, Kepez: 0.75, Döşemealtı: 0.9, Aksu: 0.85 }[ilce]!;
    const fiyat =
      islem === "Satılık"
        ? Math.round((m2 * r.tam(48, 72) * 1000 * bolgeCarpani * (tip === "Villa" ? 1.3 : 1)) / 50_000) * 50_000
        : Math.round((m2 * r.tam(260, 380) * bolgeCarpani * (tip === "Villa" ? 1.4 : 1)) / 500) * 500;
    const eklenme = simdi - r.tam(1, 150) * GUN;
    const kapandi = eklenme < simdi - 20 * GUN && r.olasilik(0.22);
    const durum = kapandi ? (islem === "Satılık" ? "Satıldı" : "Kiralandı") : r.agirlikli([["Yayında", 85], ["Opsiyonlu", 7], ["Pasif", 8]] as const);
    const kapanisT = kapandi ? Math.min(simdi - GUN, eklenme + r.tam(15, 120) * GUN) : 0;
    const p: Kayit = {
      id: `p${i + 1}`,
      kod: `KY${1400 + i}`,
      islem,
      tip,
      ilce,
      mahalle: r.sec(BOLGELER[ilce]),
      oda,
      m2,
      kat: tip === "Daire" ? r.tam(0, 9) : 0,
      yas: r.tam(0, 25),
      ozellik: r.sec(["Deniz manzaralı", "Havuzlu site", "Asansörlü", "Otoparklı", "Eşyalı", "Doğalgazlı", "Bahçeli", "Yeni bina"]),
      fiyat,
      durum,
      danismanId: r.sec(danismanlar).id,
      t: eklenme,
      goruntulenme: r.tam(40, 2400),
      portallar: { Site: durum !== "Pasif", Hepsiemlak: durum === "Yayında" && r.olasilik(0.8), Emlakjet: durum === "Yayında" && r.olasilik(0.6) },
      kapanisT,
      kapanisFiyat: kapandi ? Math.round(fiyat * (islem === "Satılık" ? 0.94 + r.kesir() * 0.05 : 1)) : 0,
      gecmis: [{ t: eklenme, m: "Portföye eklendi" }],
    };
    if (kapandi) p.gecmis.unshift({ t: kapanisT, m: `${durum}, ${p.islem === "Kiralık" ? tl(p.kapanisFiyat) : tlKisa(p.kapanisFiyat)}` });
    portfoy.push(p);
  }

  const mKisi = kisiler(r, 64);
  const talepler: Kayit[] = mKisi.map((k, i) => {
    const islem = r.agirlikli([["Satılık", 50], ["Kiralık", 50]] as const);
    const tip = r.agirlikli([["Daire", 86], ["Villa", 8], ["Dükkan", 6]] as const);
    const odaMin = tip === "Dükkan" ? 0 : tip === "Villa" ? 4 : r.agirlikli([[1, 15], [2, 40], [3, 35], [4, 10]] as const);
    const ilceler = r.karistir([...ILCELER]).slice(0, r.tam(1, 2));
    // Bütçe, tercih edilen bölgedeki benzer ilanlara yakın seçilir; talebin bir kısmı fazla iddialı.
    const benzer = portfoy.filter((p) => p.islem === islem && p.tip === tip && ilceler.includes(p.ilce));
    const ortalama = benzer.length ? benzer.reduce((t, p) => t + p.fiyat, 0) / benzer.length : islem === "Kiralık" ? 35_000 : 6_000_000;
    const carpan = r.olasilik(0.15) ? 0.45 + r.kesir() * 0.15 : 0.75 + r.kesir() * 0.5;
    const butceMax = Math.round((ortalama * carpan) / (islem === "Kiralık" ? 1000 : 100_000)) * (islem === "Kiralık" ? 1000 : 100_000);
    const t = mesaiAni(simdi - r.tam(0, 40) * GUN - r.tam(0, 10) * SAAT - r.tam(0, 59) * DAKIKA, 9, 21, r);
    const yas = (simdi - t) / GUN;
    const durum = t > simdi ? "Yeni" : yas < 1.5 ? r.agirlikli([["Yeni", 70], ["Eşleşme gönderildi", 30]] as const) : r.agirlikli([["Eşleşme gönderildi", 30], ["Gösterim yapıldı", 25], ["Teklif", 8], ["Kapandı", 15], ["Vazgeçti", 12], ["Yeni", 10]] as const);
    return {
      id: `t${i + 1}`,
      musteri: k.tamAd,
      telefon: k.telefon,
      islem,
      tip,
      ilceler,
      odaMin,
      butceMin: Math.round(butceMax * 0.7),
      butceMax,
      kaynak: r.agirlikli([["Site formu", 40], ["Telefon", 25], ["Portal mesajı", 25], ["Ofise geldi", 10]] as const),
      danismanId: r.sec(danismanlar).id,
      durum,
      t: Math.min(t, simdi - 10 * DAKIKA),
      gonderilenler: [] as string[],
      gecmis: [{ t: Math.min(t, simdi - 10 * DAKIKA), m: "Talep alındı" }],
      not: r.sec(["Okula yakın olsun", "Site içinde olsun", "Kredi ile alacak", "Evcil hayvanı var", "Acil taşınacak", "Yatırım amaçlı", ""]),
    };
  });

  const gosterimler: Kayit[] = [];
  for (const t of talepler) {
    if (t.durum === "Yeni") continue;
    const uygun = portfoy
      .map((p) => ({ p, puan: uyum(t, p) }))
      .filter((x) => x.puan >= 60 || (x.p.durum !== "Pasif" && x.p.islem === t.islem && x.p.tip === t.tip && t.ilceler.includes(x.p.ilce)))
      .slice(0, 4);
    t.gonderilenler = uygun.map((x) => x.p.id);
    if (uygun.length) t.gecmis.unshift({ t: t.t + r.tam(1, 6) * SAAT, m: `${uygun.length} eşleşen ilan WhatsApp ile gönderildi` });
    if (["Gösterim yapıldı", "Teklif", "Kapandı"].includes(t.durum) && uygun.length) {
      const zamanT = mesaiAni(t.t + r.tam(1, 5) * GUN, 10, 18, r);
      if (zamanT < simdi) {
        gosterimler.push({ id: `g${gosterimler.length + 1}`, talepId: t.id, portfoyId: uygun[0].p.id, danismanId: t.danismanId, t: zamanT, durum: "Yapıldı", geriBildirim: r.sec(["Beğendi, eşiyle tekrar görmek istiyor", "Fiyatı yüksek buldu", "Konumu uymadı", "Teklif vermeyi düşünüyor"]) });
        t.gecmis.unshift({ t: zamanT, m: "Gösterim yapıldı" });
      }
    }
  }
  // Bugün ve önümüzdeki günler için planlanmış gösterimler.
  const acikTalepler = talepler.filter((t) => ["Eşleşme gönderildi", "Gösterim yapıldı"].includes(t.durum) && t.gonderilenler.length);
  for (let i = 0; i < 12 && acikTalepler.length; i++) {
    const t = acikTalepler[i % acikTalepler.length];
    const gun = i < 5 ? 0 : i < 9 ? 1 : r.tam(2, 4);
    const zamanT = gunBasi(simdi) + gun * GUN + r.sec([10, 11, 12, 14, 15, 16, 17]) * SAAT + r.sec([0, 30]) * DAKIKA;
    gosterimler.push({
      id: `g${gosterimler.length + 1}`,
      talepId: t.id,
      portfoyId: r.sec(t.gonderilenler),
      danismanId: t.danismanId,
      t: zamanT,
      durum: zamanT < simdi - SAAT ? (r.olasilik(0.85) ? "Yapıldı" : "İptal") : "Planlandı",
      geriBildirim: zamanT < simdi - SAAT ? r.sec(["Beğendi, eşiyle tekrar görmek istiyor", "Fiyatı yüksek buldu", "Teklif vermeyi düşünüyor"]) : "",
    });
  }
  gosterimler.sort((a, b) => a.t - b.t);

  const sKisi = kisiler(r, 80);
  const sozlesmeler: Kayit[] = Array.from({ length: 40 }, (_, i) => {
    const kalan = r.agirlikli([[r.tam(-20, -1), 5], [r.tam(0, 59), 20], [r.tam(60, 360), 75]] as const);
    const bit = gunBasi(simdi) + kalan * GUN;
    const bas = bit - 365 * GUN;
    const ilce = r.sec(ILCELER.slice(0, 3));
    return {
      id: `s${i + 1}`,
      adres: `${r.sec(BOLGELER[ilce])}, ${ilce}, ${r.tam(1, 4)} odalı daire`,
      evSahibi: sKisi[i * 2].tamAd,
      kiraci: sKisi[i * 2 + 1].tamAd,
      kiraciTel: sKisi[i * 2 + 1].telefon,
      kira: Math.round(r.tam(18, 65) * 1000),
      bas,
      bit,
      gecikme: r.olasilik(0.08),
      depozito: 0,
      gecmis: [{ t: bas, m: "Sözleşme imzalandı" }],
    };
  });

  return { danismanlar, portfoy, talepler: talepler.sort((a, b) => b.t - a.t), gosterimler, sozlesmeler };
}

/* ---------------- Parçalar ---------------- */

function gosterimPlanla(api: PanelApi, t: Kayit, portfoyId: string) {
  const s = api.ani.getTime();
  // Yarın sabah danışmanın ilk boş saati.
  const dolu = new Set(api.veri.gosterimler.filter((g) => g.danismanId === t.danismanId && g.durum === "Planlandı").map((g) => g.t));
  let zamanT = gunBasi(s) + GUN + 10 * SAAT;
  while (dolu.has(zamanT)) zamanT += SAAT;
  api.ekle("gosterimler", { id: api.yeniId("g"), talepId: t.id, portfoyId, danismanId: t.danismanId, t: zamanT, durum: "Planlandı", geriBildirim: "" }, false);
  api.guncelle("talepler", t.id, {}, `Gösterim planlandı, ${gunAdi(zamanT, api.ani)} ${saat(zamanT)}`);
  api.haber(`Gösterim ${gunAdi(zamanT, api.ani).toLocaleLowerCase("tr")} ${saat(zamanT)} için planlandı. Müşteriye ve ev sahibine hatırlatma gidecek.`, "basari");
  api.olay("gosterim");
}

function Eslesmeler({ t, api }: { t: Kayit; api: PanelApi }) {
  const liste = eslesenler(t, api).slice(0, 8);
  if (!liste.length) return <p className="text-[12.5px] leading-5 text-[var(--ms)]">Şu an bu talebe yüzde 60 üstü uyan ilan yok. Bütçeyi ya da bölgeyi genişletmeyi önerebilirsiniz; yeni ilan girildiğinde talep yeniden taranır.</p>;
  return (
    <ul className="space-y-2.5">
      {liste.map(({ p, puan }) => (
        <li key={p.id} className="rounded-lg border border-[var(--k)] p-3">
          <div className="flex items-start justify-between gap-3">
            <button type="button" onClick={() => api.git("portfoy", { kayit: p.id })} className="min-w-0 text-left hover:text-[var(--p)]">
              <span className="block truncate text-[13px] font-semibold">{ilanBasligi(p)}</span>
              <span className="block text-[11.5px] text-[var(--ms)]">
                {p.ilce}, {p.m2} metrekare, {fiyatYaz(p)}
              </span>
            </button>
            <span className="shrink-0 text-right text-[12px] font-bold tabular-nums" style={{ color: puan >= 85 ? RENK.yesil : puan >= 70 ? RENK.mavi : RENK.sari }}>
              yüzde {puan}
            </span>
          </div>
          <div className="mt-2">
            <Cubuk oran={puan / 100} ince renk={puan >= 85 ? "var(--yesil)" : puan >= 70 ? "var(--mavi)" : "var(--sari)"} />
          </div>
          <div className="mt-2 flex items-center justify-between gap-2 text-[11.5px]">
            <span className="text-[var(--ms)]">{t.gonderilenler.includes(p.id) ? "Müşteriye gönderildi" : "Henüz gönderilmedi"}</span>
            <button type="button" onClick={() => gosterimPlanla(api, t, p.id)} className="font-semibold text-[var(--p)] hover:underline">
              Gösterim planla
            </button>
          </div>
        </li>
      ))}
    </ul>
  );
}

function FiyatGuncelle({ p, api }: { p: Kayit; api: PanelApi }) {
  const [deger, setDeger] = useState(String(p.fiyat));
  const n = Number(deger.replace(/\./g, ""));
  const uyanlar = (fiyat: number) => api.veri.talepler.filter((t) => ACIK_TALEP.includes(t.durum) && uyum(t, { ...p, fiyat }) >= 60).length;
  return (
    <div>
      <div className="flex gap-2">
        <input value={deger} inputMode="numeric" onChange={(e) => setDeger(e.target.value)} className="h-9 min-w-0 flex-1 rounded-lg border border-[var(--k)] bg-transparent px-3 text-[13px] tabular-nums outline-none focus:border-[var(--p)] focus-visible:outline-none" />
        <Dugme
          tur="ana"
          disabled={!(n > 0) || n === p.fiyat}
          onClick={() => {
            const once = uyanlar(p.fiyat);
            const sonra = uyanlar(n);
            api.guncelle("portfoy", p.id, { fiyat: n }, `Fiyat ${fiyatYaz(p)} yerine ${fiyatYaz({ ...p, fiyat: n })} oldu`);
            api.haber(sonra > once ? `Fiyat güncellendi. Bu ilana uyan talep ${once} yerine ${sonra} oldu.` : "Fiyat güncellendi, portallara gönderildi", "basari");
            api.olay("ilan-fiyat");
          }}
        >
          Kaydet
        </Dugme>
      </div>
      <p className="mt-2 text-[12px] text-[var(--ms)]">Şu an {uyanlar(p.fiyat)} açık talep bu ilana yüzde 60 üstü uyuyor.</p>
    </div>
  );
}

/* ---------------- Ekranlar ---------------- */

function uyarilar(api: PanelApi) {
  const liste: ReturnType<SektorPanel["uyarilar"]> = [];
  const s = api.ani.getTime();
  const yeni = api.veri.talepler.filter((t) => t.durum === "Yeni").length;
  const bugun = api.veri.gosterimler.filter((g) => g.durum === "Planlandı" && g.t >= s && g.t < gunBasi(s) + GUN).length;
  const sonucsuz = api.veri.gosterimler.filter((g) => g.durum === "Planlandı" && g.t < s).length;
  const biten = api.veri.sozlesmeler.filter((x) => sozlesmeDurumu(x, api).ad === "Bitiyor").length;
  const geciken = api.veri.sozlesmeler.filter((x) => sozlesmeDurumu(x, api).ad === "Ödeme gecikti").length;
  if (yeni) liste.push({ metin: `${yeni} yeni talebe henüz eşleşme gönderilmedi`, modul: "talepler", filtre: "Durum=Yeni", renk: "mavi" });
  if (bugun) liste.push({ metin: `Bugün ${bugun} gösterim daha var`, modul: "gosterimler", filtre: "Zaman=Bugün", renk: "mor" });
  if (sonucsuz) liste.push({ metin: `${sonucsuz} gösterimin sonucu girilmedi`, modul: "gosterimler", filtre: "Durum=Sonucu girilmeyen", renk: "sari" });
  if (biten) liste.push({ metin: `${biten} kira sözleşmesi altmış gün içinde bitiyor`, modul: "sozlesmeler", filtre: "Durum=Bitiyor", renk: "sari" });
  if (geciken) liste.push({ metin: `${geciken} sözleşmede kira ödemesi gecikti`, modul: "sozlesmeler", filtre: "Durum=Ödeme gecikti", renk: "kirmizi" });
  return liste;
}

const ozet = ozetEkrani({
  kullanici: KULLANICI.ad,
  uyarilar,
  karsilama: (api) => {
    const s = api.ani.getTime();
    const gosterim = api.veri.gosterimler.filter((g) => g.t >= gunBasi(s) && g.t < gunBasi(s) + GUN && g.durum !== "İptal").length;
    const talep = api.veri.talepler.filter((t) => t.t > s - GUN).length;
    return `Bugün ${gosterim} gösterim var, son 24 saatte ${talep} yeni talep geldi.`;
  },
  sayilar: (api) => {
    const s = api.ani.getTime();
    const aktif = api.veri.portfoy.filter((p) => ACIK_ILAN.includes(p.durum));
    const acik = api.veri.talepler.filter((t) => ACIK_TALEP.includes(t.durum));
    const pzt = gunBasi(s) - ((api.ani.getDay() + 6) % 7) * GUN;
    const hafta = api.veri.gosterimler.filter((g) => g.t >= pzt && g.t < pzt + 7 * GUN && g.durum !== "İptal");
    const kapanan = api.veri.portfoy.filter((p) => p.kapanisT > s - 30 * GUN);
    return [
      {
        ad: "Aktif portföy",
        deger: String(aktif.length),
        alt: `${aktif.filter((p) => p.islem === "Satılık").length} satılık, ${aktif.filter((p) => p.islem === "Kiralık").length} kiralık`,
        not: "Yayında ve opsiyonlu ilanlar. Satılan, kiralanan ve pasife alınanlar sayılmaz.",
        git: () => api.git("portfoy"),
      },
      {
        ad: "Açık talep",
        deger: String(acik.length),
        alt: `${acik.filter((t) => t.durum === "Yeni").length} tanesine eşleşme gönderilmedi`,
        not: "Henüz kapanmamış ve müşterinin vazgeçmediği talepler.",
        seri: Array.from({ length: 14 }, (_, i) => api.veri.talepler.filter((t) => t.t >= gunBasi(s) - (13 - i) * GUN && t.t < gunBasi(s) - (12 - i) * GUN).length),
        git: () => api.git("talepler"),
      },
      {
        ad: "Bu haftanın gösterimi",
        deger: String(hafta.length),
        alt: `${hafta.filter((g) => g.durum === "Yapıldı").length} yapıldı, ${hafta.filter((g) => g.durum === "Planlandı").length} planlı`,
        not: "Pazartesiden pazara bu haftaki gösterimler. İptal edilenler sayılmaz.",
        git: () => api.git("gosterimler"),
      },
      {
        ad: "Kapanan iş, 30 gün",
        deger: String(kapanan.length),
        alt: `Ofis komisyonu ${tlKisa(kapanan.reduce((t, p) => t + komisyon(p).ofis, 0))}`,
        not: "Son 30 günde satılan ya da kiralanan ilanlar. Satışta alıcı ve satıcıdan yüzde 2, kiralamada bir aylık kira komisyon sayılır.",
        renk: "yesil",
        git: () => api.git("portfoy", { filtre: "Durum=Kapananlar" }),
      },
    ];
  },
  ana: {
    baslik: "Bölgelere göre talep ve portföy",
    icerik: (api) => {
      const satirlar = ILCELER.map((ilce) => ({
        ilce,
        talep: api.veri.talepler.filter((t) => ACIK_TALEP.includes(t.durum) && t.ilceler.includes(ilce)).length,
        portfoy: api.veri.portfoy.filter((p) => ACIK_ILAN.includes(p.durum) && p.ilce === ilce).length,
      }));
      const enCok = Math.max(1, ...satirlar.flatMap((x) => [x.talep, x.portfoy]));
      return (
        <div>
          <p className="mb-4 text-[12px] leading-5 text-[var(--ms)]">Talebin portföyden fazla olduğu bölge, yeni ilan toplanacak yerdir.</p>
          <ul className="space-y-4">
            {satirlar.map((x) => (
              <li key={x.ilce}>
                <div className="mb-1.5 flex justify-between gap-3 text-[12.5px]">
                  <span className="font-medium">{x.ilce}</span>
                  <span className="text-[var(--ms)]" style={{ color: x.talep > x.portfoy ? RENK.sari : undefined }}>
                    {x.talep > x.portfoy ? `${x.talep - x.portfoy} ilan eksik` : "Yeterli"}
                  </span>
                </div>
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="w-14 text-[11px] text-[var(--ms)]">Talep</span>
                    <span className="h-2.5 rounded-full bg-[var(--p)] transition-[width] duration-500" style={{ width: `${(x.talep / enCok) * 75}%` }} />
                    <span className="text-[11px] tabular-nums">{x.talep}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="w-14 text-[11px] text-[var(--ms)]">Portföy</span>
                    <span className="h-2.5 rounded-full bg-[var(--mavi)] opacity-70 transition-[width] duration-500" style={{ width: `${(x.portfoy / enCok) * 75}%` }} />
                    <span className="text-[11px] tabular-nums">{x.portfoy}</span>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </div>
      );
    },
  },
  parcalar: [
    {
      baslik: "Bugünün gösterimleri",
      icerik: (api) => {
        const s = api.ani.getTime();
        const liste = api.veri.gosterimler.filter((g) => g.t >= gunBasi(s) && g.t < gunBasi(s) + GUN);
        if (!liste.length) return <p className="text-[12.5px] text-[var(--ms)]">Bugün gösterim yok.</p>;
        return (
          <ul className="divide-y divide-[var(--k)]">
            {liste.map((g) => {
              const p = api.bul("portfoy", g.portfoyId)!;
              const t = api.bul("talepler", g.talepId)!;
              return (
                <li key={g.id}>
                  <button type="button" onClick={() => api.git("gosterimler", { kayit: g.id })} className="flex w-full items-center gap-3 py-2 text-left hover:text-[var(--p)]">
                    <span className="w-11 shrink-0 text-[13px] font-semibold tabular-nums">{saat(g.t)}</span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-[12.5px]">{ilanBasligi(p)}</span>
                      <span className="block truncate text-[11.5px] text-[var(--ms)]">
                        {t.musteri}, {danismanAdi(api, g.danismanId)}
                      </span>
                    </span>
                    <DurumYazi d={g.durum === "Yapıldı" ? { ad: "Yapıldı", renk: "yesil" } : g.durum === "İptal" ? { ad: "İptal", renk: "gri" } : g.t < s ? { ad: "Sonuç bekliyor", renk: "sari" } : { ad: "Planlandı", renk: "mavi" }} kucuk />
                  </button>
                </li>
              );
            })}
          </ul>
        );
      },
    },
    {
      baslik: "Portföy dağılımı",
      icerik: (api) => {
        const aktif = api.veri.portfoy.filter((p) => ACIK_ILAN.includes(p.durum));
        const dilimler = [
          { ad: "Satılık daire", renk: "vurgu", deger: aktif.filter((p) => p.islem === "Satılık" && p.tip === "Daire").length },
          { ad: "Kiralık daire", renk: "mavi", deger: aktif.filter((p) => p.islem === "Kiralık" && p.tip === "Daire").length },
          { ad: "Villa", renk: "mor", deger: aktif.filter((p) => p.tip === "Villa").length },
          { ad: "Dükkan", renk: "sari", deger: aktif.filter((p) => p.tip === "Dükkan").length },
        ];
        return <HalkaGrafik dilimler={dilimler} bicim={(n) => `${n} ilan`} merkez={String(aktif.length)} />;
      },
    },
  ],
});

const panel: SektorPanel = {
  saat: { acilis: 9, kapanis: 19.5, yogun: 14 },
  kullanici: KULLANICI,
  uret,
  uyarilar,
  moduller: [
    { id: "ozet", grup: "Genel", ekran: ozet },
    {
      id: "portfoy",
      grup: "Portföy",
      ekran: {
        tur: "liste",
        koleksiyon: "portfoy",
        baslikAdi: "İlan",
        baslik: (p) => ilanBasligi(p),
        alt: (p) => `${p.kod}, ${p.ilce}, ${p.m2} metrekare`,
        durum: ilanDurumu,
        arama: (p) => `${p.kod} ${p.ilce} ${p.mahalle} ${p.tip} ${p.ozellik}`,
        sira: (a, b) => (ACIK_ILAN.includes(b.durum) ? 1 : 0) - (ACIK_ILAN.includes(a.durum) ? 1 : 0) || b.t - a.t,
        sutunlar: [
          { ad: "İşlem", deger: (p) => p.islem, sirala: (p) => p.islem, oncelik: 1 },
          { ad: "Fiyat", deger: (p) => fiyatYaz(p), sirala: (p) => p.fiyat, csv: (p) => p.fiyat, hiza: "sag", oncelik: 1 },
          { ad: "Oda", deger: (p) => odaYaz(p), sirala: (p) => p.oda, oncelik: 3 },
          { ad: "Danışman", deger: (p, api) => danismanAdi(api, p.danismanId), oncelik: 3 },
          { ad: "Görüntülenme", deger: (p) => sayi(p.goruntulenme), sirala: (p) => p.goruntulenme, hiza: "sag", oncelik: 2 },
        ],
        filtreler: [
          { ad: "İşlem", secenekler: ["Satılık", "Kiralık"].map((x) => ({ ad: x, kosul: (p: Kayit) => p.islem === x })) },
          { ad: "Tip", secenekler: ["Daire", "Villa", "Dükkan"].map((x) => ({ ad: x, kosul: (p: Kayit) => p.tip === x })) },
          { ad: "İlçe", secenekler: ILCELER.map((x) => ({ ad: x, kosul: (p: Kayit) => p.ilce === x })) },
          {
            ad: "Durum",
            secenekler: [
              { ad: "Aktif ilanlar", kosul: (p) => ACIK_ILAN.includes(p.durum) },
              { ad: "Kapananlar", kosul: (p) => p.durum === "Satıldı" || p.durum === "Kiralandı" },
              { ad: "Pasif", kosul: (p) => p.durum === "Pasif" },
            ],
          },
        ],
        ozet: (api) => {
          const a = api.veri.portfoy.filter((p) => ACIK_ILAN.includes(p.durum));
          const ss = a.filter((p) => p.islem === "Satılık" && p.tip === "Daire");
          const kk = a.filter((p) => p.islem === "Kiralık" && p.tip === "Daire");
          return [
            { ad: "Aktif ilan", deger: String(a.length) },
            { ad: "Satılık daire, ortalama", deger: tlKisa(ss.reduce((t, p) => t + p.fiyat, 0) / Math.max(1, ss.length)) },
            { ad: "Kiralık daire, ortalama", deger: tl(kk.reduce((t, p) => t + p.fiyat, 0) / Math.max(1, kk.length)), not: "Aylık" },
            { ad: "Portalda olmayan", deger: String(a.filter((p) => !p.portallar.Hepsiemlak && !p.portallar.Emlakjet).length), renk: "sari" },
          ];
        },
        detay: {
          bolumler: (p, api) => (
            <>
              <Bolum baslik="İlan">
                <AlanListesi
                  alanlar={[
                    ["İşlem", p.islem],
                    ["Tip", p.tip],
                    ["Bölge", `${p.mahalle}, ${p.ilce}`],
                    ["Metrekare", `${p.m2} metrekare`],
                    ["Oda", p.oda ? `${p.oda} oda, 1 salon` : "Açık alan"],
                    ["Kat ve yaş", p.tip === "Daire" ? `${p.kat ? `${p.kat}. kat` : "Giriş kat"}, ${p.yas ? `${p.yas} yıllık` : "sıfır bina"}` : `${p.yas} yıllık`],
                    ["Öne çıkan", p.ozellik],
                    ["Danışman", danismanAdi(api, p.danismanId)],
                  ]}
                />
              </Bolum>
              {ACIK_ILAN.includes(p.durum) ? (
                <>
                  <Bolum baslik={p.islem === "Kiralık" ? "Aylık kira, TL" : "Satış fiyatı, TL"}>
                    <FiyatGuncelle key={p.fiyat} p={p} api={api} />
                  </Bolum>
                  <Bolum baslik="Yayın">
                    <ul className="space-y-2.5">
                      {PORTALLAR.map((k) => (
                        <li key={k} className="flex items-center justify-between gap-3 text-[13px]">
                          <span>{k === "Site" ? "Kendi siteniz" : k}</span>
                          <Anahtar
                            acik={!!p.portallar[k]}
                            ad={`${k} yayını`}
                            degistir={() => {
                              api.guncelle("portfoy", p.id, { portallar: { ...p.portallar, [k]: !p.portallar[k] } }, `${k} ${p.portallar[k] ? "yayınından kaldırıldı" : "üzerinde yayına alındı"}`);
                              api.haber(p.portallar[k] ? `${k} üzerinden kaldırıldı` : `${k} üzerinde yayına alındı`, "basari");
                              api.olay("ilan-yayin");
                            }}
                          />
                        </li>
                      ))}
                    </ul>
                  </Bolum>
                </>
              ) : (
                p.kapanisT > 0 && (
                  <Bolum baslik="Kapanış">
                    <AlanListesi alanlar={[["Tarih", tarihYil(p.kapanisT)], ["Bedel", fiyatYaz({ ...p, fiyat: p.kapanisFiyat })], ["Ofis komisyonu", tl(komisyon(p).ofis)], ["Danışman payı", tl(komisyon(p).danisman)]]} />
                  </Bolum>
                )
              )}
              <Bolum baslik="Geçmiş">
                <Gecmis satirlar={p.gecmis.map((g: Kayit) => ({ zaman: zaman(g.t, api.ani), metin: g.m }))} />
              </Bolum>
            </>
          ),
          eylemler: [
            {
              ad: "Opsiyon koy",
              gorunur: (p) => p.durum === "Yayında",
              uygula: (p, api) => {
                api.guncelle("portfoy", p.id, { durum: "Opsiyonlu" }, "Opsiyon kondu, kapora alındı");
                api.haber("İlan opsiyonlu oldu, portallarda rezerve olarak görünüyor", "basari");
              },
            },
            {
              ad: "Yeniden yayına al",
              ikon: IconRefresh,
              gorunur: (p) => p.durum === "Pasif",
              uygula: (p, api) => {
                api.guncelle("portfoy", p.id, { durum: "Yayında", portallar: { Site: true, Hepsiemlak: true, Emlakjet: true } }, "Yeniden yayına alındı");
                api.haber("İlan site ve portallarda yayında", "basari");
              },
            },
          ],
        },
        yeni: {
          baslik: "Yeni ilan",
          dugme: "İlanı ekle",
          alanlar: [
            { ad: "İşlem", anahtar: "islem", tur: "secim", secenekler: ["Kiralık", "Satılık"] },
            { ad: "Tip", anahtar: "tip", tur: "secim", secenekler: ["Daire", "Villa", "Dükkan"] },
            { ad: "İlçe", anahtar: "ilce", tur: "secim", secenekler: ILCELER },
            { ad: "Oda sayısı", anahtar: "oda", tur: "sayi", varsayilan: "3" },
            { ad: "Metrekare", anahtar: "m2", tur: "sayi", varsayilan: "125" },
            { ad: "Fiyat, TL", anahtar: "fiyat", tur: "sayi", varsayilan: "38000", zorunlu: true },
          ],
          olustur: (d, api) => {
            const s = api.ani.getTime();
            const id = api.yeniId("p");
            const p: Kayit = {
              id,
              kod: `KY${2000 + api.veri.portfoy.length}`,
              islem: d.islem,
              tip: d.tip,
              ilce: d.ilce,
              mahalle: BOLGELER[d.ilce][0],
              oda: d.tip === "Dükkan" ? 0 : Number(d.oda) || 2,
              m2: Number(d.m2) || 100,
              kat: 2,
              yas: 5,
              ozellik: "Yeni eklendi",
              fiyat: Number(d.fiyat) || 30000,
              durum: "Yayında",
              danismanId: api.veri.danismanlar[0].id,
              t: s,
              goruntulenme: 0,
              portallar: { Site: true, Hepsiemlak: false, Emlakjet: false },
              kapanisT: 0,
              kapanisFiyat: 0,
              gecmis: [{ t: s, m: `Portföye eklendi, ${KULLANICI.ad}` }],
            };
            api.ekle("portfoy", p);
            const uyan = api.veri.talepler.filter((t) => ACIK_TALEP.includes(t.durum) && uyum(t, p) >= 60).length;
            api.haber(uyan ? `İlan eklendi. ${uyan} açık talep bu ilana uyuyor, müşterilere gönderebilirsiniz.` : "İlan eklendi ve sitede yayında. Şu an uyan açık talep yok.", "basari");
            api.olay("ilan-ekle");
            return id;
          },
        },
      },
    },
    {
      id: "talepler",
      grup: "Müşteri",
      rozet: (api) => api.veri.talepler.filter((t) => t.durum === "Yeni").length,
      ekran: {
        tur: "liste",
        koleksiyon: "talepler",
        baslikAdi: "Müşteri",
        baslik: (t) => t.musteri,
        harf: (t) => t.musteri,
        alt: (t) => `${t.islem} ${t.tip.toLocaleLowerCase("tr")}, ${t.ilceler.join(" ya da ")}`,
        durum: (t) => TALEP_DURUMU[t.durum],
        arama: (t) => `${t.telefon} ${t.ilceler.join(" ")} ${t.islem} ${t.tip} ${t.not}`,
        sira: (a, b) => (a.durum === "Yeni" ? 0 : 1) - (b.durum === "Yeni" ? 0 : 1) || b.t - a.t,
        sutunlar: [
          { ad: "Bütçe", deger: (t) => butceYaz(t), sirala: (t) => t.butceMax, oncelik: 1 },
          { ad: "Oda", deger: (t) => (t.odaMin ? `En az ${t.odaMin}` : "Yok"), oncelik: 3 },
          {
            ad: "Eşleşen",
            deger: (t, api) => {
              const n = eslesenler(t, api).length;
              return <span style={{ color: n ? RENK.yesil : RENK.gri }}>{n ? `${n} ilan` : "Yok"}</span>;
            },
            csv: (t, api) => eslesenler(t, api).length,
            oncelik: 1,
          },
          { ad: "Kaynak", deger: (t) => t.kaynak, sirala: (t) => t.kaynak, oncelik: 3 },
          { ad: "Geliş", deger: (t, api) => zaman(t.t, api.ani), sirala: (t) => t.t, oncelik: 2 },
        ],
        filtreler: [
          {
            ad: "Durum",
            secenekler: [
              { ad: "Açık talepler", kosul: (t) => ACIK_TALEP.includes(t.durum) },
              ...Object.entries(TALEP_DURUMU).map(([k, d]) => ({ ad: k === "Teklif" ? d.ad : k, kosul: (t: Kayit) => t.durum === k })),
            ],
          },
          { ad: "İşlem", secenekler: ["Satılık", "Kiralık"].map((x) => ({ ad: x, kosul: (t: Kayit) => t.islem === x })) },
          { ad: "Danışman", secenekler: DANISMAN_ADLARI.map((ad, i) => ({ ad, kosul: (t: Kayit) => t.danismanId === `d${i + 1}` })) },
        ],
        ozet: (api) => {
          const a = api.veri.talepler.filter((t) => ACIK_TALEP.includes(t.durum));
          const eslesmeli = a.filter((t) => eslesenler(t, api).length > 0).length;
          return [
            { ad: "Açık talep", deger: String(a.length) },
            { ad: "Yeni", deger: String(a.filter((t) => t.durum === "Yeni").length), renk: "mavi", not: "Eşleşme gönderilmedi" },
            { ad: "Uyan ilanı olan", deger: yuzde((eslesmeli / Math.max(1, a.length)) * 100), renk: "yesil" },
            { ad: "Siteden gelen, 30 gün", deger: String(api.veri.talepler.filter((t) => t.kaynak === "Site formu" && t.t > api.ani.getTime() - 30 * GUN).length) },
          ];
        },
        detay: {
          bolumler: (t, api) => (
            <>
              <Bolum baslik="Aradığı">
                <AlanListesi
                  alanlar={[
                    ["İşlem ve tip", `${t.islem} ${t.tip.toLocaleLowerCase("tr")}`],
                    ["Bütçe", butceYaz(t)],
                    ["Bölge", t.ilceler.join(" ya da ")],
                    ["Oda", t.odaMin ? `En az ${t.odaMin} oda` : "Fark etmez"],
                    ["Telefon", t.telefon],
                    ["Danışman", danismanAdi(api, t.danismanId)],
                    ...(t.not ? ([["Not", t.not]] as [string, string][]) : []),
                  ]}
                />
              </Bolum>
              <Bolum baslik="Eşleşen ilanlar" sag={<span className="text-[11.5px] text-[var(--ms)]">Uyum puanına göre</span>}>
                <Eslesmeler t={t} api={api} />
              </Bolum>
              <Bolum baslik="Geçmiş">
                <Gecmis satirlar={t.gecmis.map((g: Kayit) => ({ zaman: zaman(g.t, api.ani), metin: g.m }))} />
              </Bolum>
            </>
          ),
          eylemler: [
            {
              ad: "Eşleşenleri WhatsApp ile gönder",
              tur: "ana",
              ikon: IconBrandWhatsapp,
              gorunur: (t, api) => ACIK_TALEP.includes(t.durum) && eslesenler(t, api).some((x) => !t.gonderilenler.includes(x.p.id)),
              uygula: (t, api) => {
                const yeni = eslesenler(t, api)
                  .filter((x) => !t.gonderilenler.includes(x.p.id))
                  .slice(0, 5);
                api.guncelle("talepler", t.id, { gonderilenler: [...t.gonderilenler, ...yeni.map((x) => x.p.id)], durum: t.durum === "Yeni" ? "Eşleşme gönderildi" : t.durum }, `${yeni.length} ilan fotoğraf ve konumuyla WhatsApp ile gönderildi`);
                api.haber(`${t.musteri} kişisine ${yeni.length} ilan gönderildi`, "basari");
                api.olay("eslesme-gonder");
              },
            },
            {
              ad: "En uygun ilana gösterim planla",
              ikon: IconCalendarPlus,
              gorunur: (t, api) => ACIK_TALEP.includes(t.durum) && eslesenler(t, api).length > 0,
              uygula: (t, api) => gosterimPlanla(api, t, eslesenler(t, api)[0].p.id),
            },
          ],
        },
      },
    },
    {
      id: "gosterimler",
      grup: "Müşteri",
      rozet: (api) => api.veri.gosterimler.filter((g) => g.durum === "Planlandı" && g.t < api.ani.getTime()).length,
      ekran: {
        tur: "liste",
        koleksiyon: "gosterimler",
        baslikAdi: "Gösterim",
        baslik: (g, api) => ilanBasligi(api.bul("portfoy", g.portfoyId)!),
        alt: (g, api) => `${api.bul("talepler", g.talepId)?.musteri}, ${danismanAdi(api, g.danismanId)}`,
        durum: (g, api) => (g.durum === "Yapıldı" ? { ad: "Yapıldı", renk: "yesil" } : g.durum === "İptal" ? { ad: "İptal", renk: "gri" } : g.t < api.ani.getTime() ? { ad: "Sonuç bekliyor", renk: "sari" } : { ad: "Planlandı", renk: "mavi" }),
        arama: (g, api) => `${api.bul("talepler", g.talepId)?.musteri} ${api.bul("portfoy", g.portfoyId)?.ilce}`,
        sira: (a, b) => {
          // Yaklaşanlar önce, sonra geçmiş olanlar yeniden eskiye.
          const n = Date.now();
          const k = (g: Kayit) => (g.t >= n - 2 * SAAT ? g.t : 1e15 - g.t);
          return k(a) - k(b);
        },
        sutunlar: [
          { ad: "Zaman", deger: (g, api) => zaman(g.t, api.ani), sirala: (g) => g.t, oncelik: 1 },
          { ad: "Fiyat", deger: (g, api) => fiyatYaz(api.bul("portfoy", g.portfoyId)!), oncelik: 2 },
          { ad: "Geri bildirim", deger: (g) => g.geriBildirim || "Yok", oncelik: 3 },
        ],
        filtreler: [
          {
            ad: "Zaman",
            secenekler: [
              { ad: "Bugün", kosul: (g, api) => g.t >= gunBasi(api.ani) && g.t < gunBasi(api.ani) + GUN },
              { ad: "Yarın", kosul: (g, api) => g.t >= gunBasi(api.ani) + GUN && g.t < gunBasi(api.ani) + 2 * GUN },
              { ad: "Geçmiş", kosul: (g, api) => g.t < api.ani.getTime() },
            ],
          },
          {
            ad: "Durum",
            secenekler: [
              { ad: "Planlandı", kosul: (g, api) => g.durum === "Planlandı" && g.t >= api.ani.getTime() },
              { ad: "Sonucu girilmeyen", kosul: (g, api) => g.durum === "Planlandı" && g.t < api.ani.getTime() },
              { ad: "Yapıldı", kosul: (g) => g.durum === "Yapıldı" },
            ],
          },
        ],
        detay: {
          bolumler: (g, api) => {
            const p = api.bul("portfoy", g.portfoyId)!;
            const t = api.bul("talepler", g.talepId)!;
            return (
              <>
                <Bolum baslik="Gösterim">
                  <AlanListesi
                    alanlar={[
                      ["Zaman", zaman(g.t, api.ani)],
                      ["Danışman", danismanAdi(api, g.danismanId)],
                      ["Müşteri", t.musteri],
                      ["Telefon", t.telefon],
                      ["İlan", `${p.kod}, ${fiyatYaz(p)}`],
                      ["Uyum", `yüzde ${uyum(t, p)}`],
                    ]}
                  />
                </Bolum>
                {g.durum === "Planlandı" && g.t < api.ani.getTime() + 3 * SAAT && (
                  <Bolum baslik="Sonucu girin">
                    <div className="flex flex-wrap gap-2">
                      {["Beğendi, teklif düşünüyor", "Fiyatı yüksek buldu", "Konumu uymadı", "Gelmedi"].map((x) => (
                        <Dugme
                          key={x}
                          kucuk
                          onClick={() => {
                            api.guncelle("gosterimler", g.id, { durum: x === "Gelmedi" ? "İptal" : "Yapıldı", geriBildirim: x });
                            api.guncelle("talepler", t.id, { durum: x.startsWith("Beğendi") ? "Teklif" : x === "Gelmedi" ? t.durum : "Gösterim yapıldı" }, `Gösterim sonucu, ${x.toLocaleLowerCase("tr")}`);
                            api.haber(x.startsWith("Beğendi") ? "Talep teklif aşamasına geçti" : "Gösterim sonucu kaydedildi", "basari");
                            api.olay("gosterim-sonuc");
                          }}
                        >
                          {x}
                        </Dugme>
                      ))}
                    </div>
                  </Bolum>
                )}
                {g.geriBildirim && (
                  <Bolum baslik="Geri bildirim">
                    <p className="text-[13px]">{g.geriBildirim}</p>
                  </Bolum>
                )}
              </>
            );
          },
        },
      },
    },
    {
      id: "danismanlar",
      grup: "Ofis",
      ekran: {
        tur: "liste",
        koleksiyon: "danismanlar",
        baslikAdi: "Danışman",
        baslik: (d) => d.ad,
        harf: (d) => d.ad,
        alt: (d) => `${d.bolge} bölgesi, ${d.telefon}`,
        arama: (d) => d.bolge,
        sutunlar: [
          { ad: "Aktif ilan", deger: (d, api) => api.veri.portfoy.filter((p) => p.danismanId === d.id && ACIK_ILAN.includes(p.durum)).length, hiza: "sag", oncelik: 2 },
          { ad: "Açık talep", deger: (d, api) => api.veri.talepler.filter((t) => t.danismanId === d.id && ACIK_TALEP.includes(t.durum)).length, hiza: "sag", oncelik: 3 },
          { ad: "Gösterim, 30 gün", deger: (d, api) => api.veri.gosterimler.filter((g) => g.danismanId === d.id && g.durum === "Yapıldı" && g.t > api.ani.getTime() - 30 * GUN).length, hiza: "sag", oncelik: 2 },
          {
            ad: "Komisyon, 30 gün",
            deger: (d, api) => tl(api.veri.portfoy.filter((p) => p.danismanId === d.id && p.kapanisT > api.ani.getTime() - 30 * GUN).reduce((t, p) => t + komisyon(p).danisman, 0)),
            csv: (d, api) => Math.round(api.veri.portfoy.filter((p) => p.danismanId === d.id && p.kapanisT > api.ani.getTime() - 30 * GUN).reduce((t, p) => t + komisyon(p).danisman, 0)),
            hiza: "sag",
            oncelik: 1,
          },
        ],
        detay: {
          bolumler: (d, api) => {
            const kapanan = api.veri.portfoy.filter((p) => p.danismanId === d.id && p.kapanisT > api.ani.getTime() - 90 * GUN).sort((a, b) => b.kapanisT - a.kapanisT);
            return (
              <>
                <Bolum baslik="Son 90 günde kapanan işler">
                  {kapanan.length ? (
                    <MiniTablo
                      basliklar={["İlan", "Tarih", "Danışman payı"]}
                      sagdakiler={[2]}
                      satirlar={kapanan.map((p) => [<button type="button" onClick={() => api.git("portfoy", { kayit: p.id })} className="text-left hover:text-[var(--p)]">{ilanBasligi(p)}</button>, tarih(p.kapanisT), tl(komisyon(p).danisman)])}
                    />
                  ) : (
                    <p className="text-[12.5px] text-[var(--ms)]">Son 90 günde kapanan işi yok.</p>
                  )}
                  <p className="mt-3 text-[12px] leading-5 text-[var(--ms)]">Satışta alıcıdan ve satıcıdan yüzde 2, kiralamada bir aylık kira ofis komisyonudur. Danışman bu komisyonun yüzde 40 kadarını alır.</p>
                </Bolum>
              </>
            );
          },
        },
      },
    },
    {
      id: "sozlesmeler",
      grup: "Ofis",
      rozet: (api) => api.veri.sozlesmeler.filter((s) => ["Bitiyor", "Ödeme gecikti"].includes(sozlesmeDurumu(s, api).ad)).length,
      ekran: {
        tur: "liste",
        koleksiyon: "sozlesmeler",
        baslikAdi: "Sözleşme",
        baslik: (s) => s.adres,
        alt: (s) => `Kiracı ${s.kiraci}, ev sahibi ${s.evSahibi}`,
        durum: sozlesmeDurumu,
        arama: (s) => `${s.kiraci} ${s.evSahibi} ${s.kiraciTel}`,
        sira: (a, b) => a.bit - b.bit,
        sutunlar: [
          { ad: "Kira", deger: (s) => tl(s.kira), sirala: (s) => s.kira, csv: (s) => s.kira, hiza: "sag", oncelik: 1 },
          { ad: "Bitiş", deger: (s) => tarihYil(s.bit), sirala: (s) => s.bit, oncelik: 1 },
          { ad: "Kalan", deger: (s, api) => (s.bit > api.ani.getTime() ? `${Math.ceil((s.bit - api.ani.getTime()) / GUN)} gün` : "Bitti"), sirala: (s) => s.bit, hiza: "sag", oncelik: 2 },
        ],
        filtreler: [{ ad: "Durum", secenekler: ["Bitiyor", "Ödeme gecikti", "Devam ediyor", "Süresi doldu"].map((d) => ({ ad: d, kosul: (s: Kayit, api: PanelApi) => sozlesmeDurumu(s, api).ad === d })) }],
        detay: {
          bolumler: (s, api) => (
            <>
              <Bolum baslik="Sözleşme">
                <AlanListesi alanlar={[["Ev sahibi", s.evSahibi], ["Kiracı", s.kiraci], ["Kiracı telefonu", s.kiraciTel], ["Aylık kira", tl(s.kira)], ["Başlangıç", tarihYil(s.bas)], ["Bitiş", tarihYil(s.bit)]]} />
              </Bolum>
              <Bolum baslik="Yenilemede yeni kira">
                <MiniTablo
                  basliklar={["Artış oranı", "Yeni kira"]}
                  sagdakiler={[1]}
                  satirlar={[25, 30, 35].map((o) => [yuzde(o), tl(Math.round((s.kira * (1 + o / 100)) / 100) * 100)])}
                />
                <p className="mt-2 text-[12px] leading-5 text-[var(--ms)]">Konutta artış yasal sınır ve son on iki ayın enflasyon ortalamasına göre belirlenir. Oran ev sahibiyle konuşulup kayda geçer.</p>
              </Bolum>
              <Bolum baslik="Geçmiş">
                <Gecmis satirlar={s.gecmis.map((g: Kayit) => ({ zaman: zaman(g.t, api.ani), metin: g.m }))} />
              </Bolum>
            </>
          ),
          eylemler: [
            {
              ad: "Hatırlatma gönder",
              tur: "ana",
              ikon: IconSend,
              gorunur: (s, api) => ["Bitiyor", "Ödeme gecikti"].includes(sozlesmeDurumu(s, api).ad),
              uygula: (s, api) => {
                const d = sozlesmeDurumu(s, api).ad;
                api.guncelle("sozlesmeler", s.id, {}, d === "Bitiyor" ? "Ev sahibine ve kiracıya yenileme hatırlatması gönderildi" : "Kiracıya ödeme hatırlatması gönderildi");
                api.haber(d === "Bitiyor" ? "Ev sahibine ve kiracıya yenileme mesajı gitti" : "Kiracıya ödeme hatırlatması gitti", "basari");
                api.olay("sozlesme-hatirlat");
              },
            },
            {
              ad: "Bir yıl yenile",
              ikon: IconCheck,
              gorunur: (s, api) => sozlesmeDurumu(s, api).ad !== "Devam ediyor",
              uygula: (s, api) => {
                const yeniKira = Math.round((s.kira * 1.3) / 100) * 100;
                api.guncelle("sozlesmeler", s.id, { bit: Math.max(s.bit, gunBasi(api.ani)) + 365 * GUN, kira: yeniKira, gecikme: false }, `Bir yıl yenilendi, yeni kira ${tl(yeniKira)}`);
                api.haber(`Sözleşme yenilendi, yeni kira ${tl(yeniKira)}`, "basari");
              },
            },
          ],
        },
      },
    },
  ],
  arama: [
    { koleksiyon: "talepler", modul: "talepler", baslik: (t) => t.musteri, alt: (t) => `${t.islem} ${t.tip.toLocaleLowerCase("tr")}, ${t.ilceler.join(" ya da ")}`, metin: (t) => t.telefon },
    { koleksiyon: "portfoy", modul: "portfoy", baslik: (p) => ilanBasligi(p), alt: (p) => `${p.kod}, ${fiyatYaz(p)}`, metin: (p) => `${p.kod} ${p.ilce}` },
    { koleksiyon: "sozlesmeler", modul: "sozlesmeler", baslik: (s) => s.kiraci, alt: (s) => s.adres, metin: (s) => s.evSahibi },
  ],
  gorevler: [
    { id: "g1", metin: "Bir talebe eşleşen ilanları gönderin", ipucu: "Talepler ekranında durumu Yeni olan bir müşteriyi açın.", modul: "talepler", olay: "eslesme-gonder" },
    { id: "g2", metin: "Bir gösterim planlayın", ipucu: "Talebin eşleşen ilanlarından birinde Gösterim planla bağlantısına basın.", modul: "talepler", olay: "gosterim" },
    { id: "g3", metin: "Portföye yeni ilan ekleyin", ipucu: "Portföy ekranındaki Yeni ilan düğmesi. Kaç talebin bu ilana uyduğu hemen yazar.", modul: "portfoy", olay: "ilan-ekle" },
    { id: "g4", metin: "Bitmek üzere bir sözleşme için hatırlatma gönderin", ipucu: "Kira sözleşmelerinde durum süzgecinden Bitiyor seçin.", modul: "sozlesmeler", olay: "sozlesme-hatirlat" },
    { id: "g5", metin: "Bir gösterimin sonucunu girin", ipucu: "Gösterimler ekranında sonucu girilmeyen bir gösterimi açın.", modul: "gosterimler", olay: "gosterim-sonuc" },
  ],
  canli: {
    aralik: 45_000,
    uret: (api, r) => {
      const s = api.ani.getTime();
      const islem = r.sec(["Kiralık", "Satılık"] as const);
      const ilceler = [r.sec(ILCELER.slice(0, 3))];
      const benzer = api.veri.portfoy.filter((p) => ACIK_ILAN.includes(p.durum) && p.islem === islem && p.tip === "Daire" && ilceler.includes(p.ilce));
      const ortalama = benzer.reduce((t, p) => t + p.fiyat, 0) / Math.max(1, benzer.length) || (islem === "Kiralık" ? 35000 : 6_000_000);
      const yuvarla = islem === "Kiralık" ? 1000 : 100_000;
      const butceMax = Math.round((ortalama * 1.05) / yuvarla) * yuvarla;
      const k = kisiler(r, 1)[0];
      const id = api.yeniId("t");
      const t: Kayit = { id, musteri: k.tamAd, telefon: k.telefon, islem, tip: "Daire", ilceler, odaMin: r.sec([2, 3]), butceMin: Math.round(butceMax * 0.7), butceMax, kaynak: "Site formu", danismanId: r.sec(api.veri.danismanlar).id, durum: "Yeni", t: s, gonderilenler: [], gecmis: [{ t: s, m: "Siteden form ile geldi" }], not: "" };
      api.ekle("talepler", t);
      const n = api.veri.portfoy.filter((p) => uyum(t, p) >= 60).length;
      api.bildir(`Siteden yeni talep, ${islem.toLocaleLowerCase("tr")} daire, ${ilceler[0]}. ${n} ilan uyuyor.`, "talepler", id);
    },
  },
};

export default panel;
export { bilgi };
