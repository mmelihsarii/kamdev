/*
 * Spor salonu demosu: Atlas Spor Kulübü. Üyeliklerin durumu bitiş ve dondurma
 * tarihlerinden, salondaki kişi sayısı turnike kayıtlarından, eğitmen
 * hakedişi ders programından hesaplanır.
 */
import { useState } from "react";
import { IconBell, IconCalendarPlus, IconCheck, IconPlayerPause, IconPlayerPlay, IconQrcode, IconUserPlus, IconX } from "@tabler/icons-react";
import { spor as bilgi } from "./bilgi";
import { ozetEkrani } from "../../panel/Ozet";
import { Cekmece, EkranBasligi } from "../../panel/Liste";
import { AlanListesi, Bolum, Cubuk, Dugme, DurumYazi, Gecmis, Harf, Kart, MiniTablo, RENK } from "../../panel/parcalar";
import { CizgiGrafik, HalkaGrafik, IsiHaritasi } from "../../panel/grafik";
import { DAKIKA, GUN, GUN_KISA, SAAT, bas, gunAdi, gunBasi, iki, kisiler, once, sayi, tarih, tarihYil, tl, tlKisa, yuzde, zaman } from "../../ortak";
import type { Durum, Kayit, ModulBilgi, PanelApi, Rastgele, SektorPanel, Veri } from "../../tipler";

const KULLANICI = { ad: "Murat Kaya", rol: "Kulüp müdürü" };
const SUBELER = ["Alsancak", "Bornova", "Karşıyaka"];
const PAKETLER = [
  { ad: "Aylık", ay: 1, fiyat: 2900 },
  { ad: "3 aylık", ay: 3, fiyat: 7800 },
  { ad: "6 aylık", ay: 6, fiyat: 13900 },
  { ad: "Yıllık", ay: 12, fiyat: 23900 },
  { ad: "Öğrenci 3 aylık", ay: 3, fiyat: 5900 },
];
const DANISMANLAR = ["Gizem Aslan", "Onur Kılıç", "Pınar Doğan"];
const DERSLER = [
  { ad: "Pilates", kontenjan: 14 },
  { ad: "Spinning", kontenjan: 20 },
  { ad: "Yoga", kontenjan: 16 },
  { ad: "Fonksiyonel", kontenjan: 15 },
  { ad: "Zumba", kontenjan: 25 },
  { ad: "Boks", kontenjan: 12 },
  { ad: "HIIT", kontenjan: 18 },
];
const EGITMEN_UCRETI = { grup: 650, ozel: 900 };
// Haftanın her günü için saat başına giriş ağırlığı, 06 ile 23 arası.
const SAAT_AGIRLIGI = [5, 9, 7, 4, 3, 3, 4, 6, 5, 4, 4, 6, 10, 12, 11, 8, 4];
const AY = 30 * GUN;

/* ---------------- Hesaplar ---------------- */

function uyeDurumu(u: Kayit, api: PanelApi): Durum {
  const s = api.ani.getTime();
  if (u.dondurma && u.dondurma.bas <= s && u.dondurma.bit > s) return { ad: "Donduruldu", renk: "mor" };
  if (u.bit < s) return { ad: "Bitti", renk: "gri" };
  if (u.bit < s + 7 * GUN) return { ad: "Bitiyor", renk: "sari" };
  if (s - u.sonGiris > 14 * GUN) return { ad: "Gelmiyor", renk: "kirmizi" };
  return { ad: "Aktif", renk: "yesil" };
}
const aktifMi = (u: Kayit, api: PanelApi) => ["Aktif", "Bitiyor", "Gelmiyor"].includes(uyeDurumu(u, api).ad);
const uyeAdi = (api: PanelApi, id: string) => api.bul("uyeler", id)?.ad ?? "Üye";
const egitmenAdi = (api: PanelApi, id: string) => api.bul("egitmenler", id)?.ad ?? "Eğitmen";

/** Giriş kabul edilir mi; turnike, canlı akış ve QR düğmesi aynı kuralı kullanır. */
function girisKarari(u: Kayit, api: PanelApi) {
  const d = uyeDurumu(u, api).ad;
  if (d === "Bitti") return `Üyelik ${tarih(u.bit)} tarihinde bitti`;
  if (d === "Donduruldu") return `Üyelik ${tarih(u.dondurma.bit)} tarihine kadar dondurulmuş`;
  return "";
}

const icerideki = (api: PanelApi, sube?: string) => {
  const s = api.ani.getTime();
  return api.veri.girisler.filter((g) => g.kabul && s - g.t < 80 * DAKIKA && g.t <= s && (!sube || g.sube === sube)).length;
};

/** Haftanın pazartesisi; ders programı pazartesiden başlar. */
const pazartesi = (ani: Date) => gunBasi(ani) - ((ani.getDay() + 6) % 7) * GUN;
const dersZamani = (d: Kayit, ani: Date) => pazartesi(ani) + d.gun * GUN + d.saat * SAAT;

function hakedis(e: Kayit, api: PanelApi) {
  const s = api.ani.getTime();
  const haftalik = api.veri.dersler.filter((d) => d.egitmenId === e.id).length;
  const grup = Math.round(haftalik * 4.3) + e.ekGrup;
  return { grup, ozel: e.ozel30, tutar: grup * EGITMEN_UCRETI.grup + e.ozel30 * EGITMEN_UCRETI.ozel, son: s };
}

/* ---------------- Veri üretimi ---------------- */

function uret(ani: Date, r: Rastgele): Veri {
  const simdi = ani.getTime();
  const kisi = kisiler(r, 820);
  const uyeler: Kayit[] = kisi.map((k, i) => {
    const paket = r.agirlikli(PAKETLER.map((p, j) => [p, [30, 30, 15, 15, 10][j]] as const));
    // Üyeliklerin bir kısmı bitmiş, bir kısmı bitmek üzere, çoğu devam ediyor.
    const kalanGun = r.agirlikli([[r.tam(-60, -1), 14], [r.tam(0, 6), 5], [r.tam(7, paket.ay * 30), 81]] as const);
    const bit = gunBasi(simdi) + kalanGun * GUN + 23 * SAAT;
    const basT = gunBasi(bit - paket.ay * AY) + r.tam(9, 20) * SAAT + r.tam(0, 59) * DAKIKA;
    // Üyelerin çoğu bu paketten önce de üyeydi; bu paket bir yenileme.
    const ilk = r.olasilik(0.65) ? basT - r.tam(1, 24) * AY : basT;
    const duzenli = r.kesir();
    const sonGiris = kalanGun < 0 ? bit - r.tam(1, 20) * GUN : duzenli < 0.12 ? simdi - r.tam(15, 40) * GUN : simdi - r.tam(0, 6) * GUN - r.tam(1, 14) * SAAT;
    const kilo = r.tam(54, 98);
    const olcumSayisi = r.tam(1, 5);
    const olcumler = Array.from({ length: olcumSayisi }, (_, j) => {
      const ilerleme = j / Math.max(1, olcumSayisi - 1);
      return {
        t: Math.min(simdi - GUN, basT + j * r.tam(25, 35) * GUN),
        kilo: Math.round((kilo - ilerleme * r.tam(0, 7)) * 10) / 10,
        yag: Math.round((r.tam(18, 32) - ilerleme * r.tam(0, 5)) * 10) / 10,
        kas: Math.round((kilo * 0.42 + ilerleme * r.tam(0, 2)) * 10) / 10,
      };
    }).filter((o) => o.t > basT - GUN);
    const dondurma = i % 37 === 0 ? { bas: simdi - r.tam(2, 10) * GUN, bit: simdi + r.tam(3, 20) * GUN } : null;
    return {
      id: `u${i + 1}`,
      ad: k.tamAd,
      telefon: k.telefon,
      kadin: k.kadin,
      sube: r.agirlikli([["Alsancak", 40], ["Bornova", 35], ["Karşıyaka", 25]] as const),
      paket: paket.ad,
      bas: basT,
      ilk,
      bit: dondurma ? bit + (dondurma.bit - dondurma.bas) : bit,
      sonGiris,
      siklik: Math.max(0.5, duzenli * 5),
      hedef: r.sec(["Kilo vermek", "Kas kazanmak", "Kondisyon", "Esneklik ve duruş"]),
      olcumler,
      dondurma,
      gecmis: ilk < basT ? [{ t: basT, m: `${paket.ad} paket ile yeniledi` }, { t: ilk, m: "İlk kez üye oldu" }] : [{ t: basT, m: `${paket.ad} paket ile üye oldu` }],
    };
  });

  const egitmenAdlari = kisiler(r, 12);
  const egitmenler: Kayit[] = egitmenAdlari.map((k, i) => ({
    id: `e${i + 1}`,
    ad: k.tamAd,
    kadin: k.kadin,
    sube: SUBELER[i % 3],
    uzmanlik: r.sec(["Pilates ve yoga", "Fonksiyonel antrenman", "Kuvvet ve kondisyon", "Spinning ve kardiyo", "Boks ve dövüş sporları"]),
    puan: Math.round((4 + r.kesir() * 0.95) * 10) / 10,
    yorum: r.tam(12, 80),
    ozel30: r.tam(4, 38),
    ekGrup: r.tam(0, 4),
    gecmis: [],
  }));

  // Haftalık program: her şubede sabah, öğle ve akşam dersleri.
  const dersler: Kayit[] = [];
  const pzt = pazartesi(ani);
  let dersNo = 0;
  for (const sube of SUBELER) {
    const subeEgitmenleri = egitmenler.filter((e) => e.sube === sube);
    for (let gun = 0; gun < 7; gun++) {
      const saatler = gun === 6 ? [10, 11.5] : gun === 5 ? [10, 11.5, 17] : [7.5, 12.5, 18, 19, 20];
      for (const saat of saatler) {
        if (r.olasilik(0.15)) continue;
        const tur = r.sec(DERSLER);
        const zamanT = pzt + gun * GUN + saat * SAAT;
        const yogun = saat >= 18 || saat === 12.5;
        const dolu = Math.min(tur.kontenjan, Math.round(tur.kontenjan * (yogun ? 0.7 + r.kesir() * 0.4 : 0.35 + r.kesir() * 0.4)));
        const adaylar = r.karistir(uyeler.filter((u) => u.sube === sube).map((u) => u.id));
        dersler.push({
          id: `d${++dersNo}`,
          ad: tur.ad,
          sube,
          egitmenId: r.sec(subeEgitmenleri).id,
          gun,
          saat,
          sure: 50,
          kontenjan: tur.kontenjan,
          katilimcilar: adaylar.slice(0, dolu),
          bekleme: dolu >= tur.kontenjan && yogun ? adaylar.slice(dolu, dolu + r.tam(1, 4)) : [],
          gelenler: zamanT < simdi ? adaylar.slice(0, Math.round(dolu * (0.8 + r.kesir() * 0.2))) : [],
          iptal: false,
          gecmis: [],
        });
      }
    }
  }

  // Turnike: son iki günün girişleri, gün içinde saate göre dağılmış.
  const girisler: Kayit[] = [];
  for (const gunT of [gunBasi(simdi) - GUN, gunBasi(simdi)]) {
    const haftaGunu = new Date(gunT).getDay();
    const carpan = haftaGunu === 0 ? 0.55 : haftaGunu === 6 ? 0.7 : 1;
    for (const u of uyeler) {
      if (u.bit < gunT - GUN && !r.olasilik(0.01)) continue;
      if (!r.olasilik((u.siklik / 7) * carpan)) continue;
      const saat = 6 + r.agirlikli(SAAT_AGIRLIGI.map((a, i) => [i, a] as const));
      const t = gunT + saat * SAAT + r.tam(0, 59) * DAKIKA;
      if (t > simdi) continue;
      const bitmis = u.bit < t;
      girisler.push({ id: `g${girisler.length + 1}`, uyeId: u.id, sube: u.sube, t, kabul: !bitmis, neden: bitmis ? `Üyelik ${tarih(u.bit)} tarihinde bitti` : "" });
      if (!bitmis) u.sonGiris = Math.max(u.sonGiris, t);
    }
  }
  girisler.sort((a, b) => b.t - a.t);

  // Son dört haftanın ortalama yoğunluğu: gün ve saate göre.
  const yogunluk = Array.from({ length: 7 }, (_, g) => SAAT_AGIRLIGI.map((a) => Math.round(a * (g >= 5 ? (g === 6 ? 2.6 : 3.4) : 5.2) * (0.85 + r.kesir() * 0.3))));

  // Satışlar: her üyenin son 90 gün içindeki bütün paket başlangıçları; aylık üye her ay yeniler.
  const satislar: Kayit[] = [];
  for (const u of uyeler) {
    const paket = PAKETLER.find((p) => p.ad === u.paket)!;
    for (let t = u.bas; t > simdi - 90 * GUN && t >= u.ilk - GUN; t -= paket.ay * AY) {
      const odeme = r.agirlikli([["Kredi kartı", 70], ["Nakit", 15], ["Havale", 15]] as const);
      satislar.push({
        id: `s${satislar.length + 1}`,
        uyeId: u.id,
        paket: paket.ad,
        tur: t > u.ilk + GUN ? "Yenileme" : "Yeni üyelik",
        tutar: paket.fiyat,
        odeme,
        taksit: odeme === "Kredi kartı" && paket.ay >= 3 ? r.sec([1, 3, 6]) : 1,
        danisman: r.sec(DANISMANLAR),
        sube: u.sube,
        t: Math.min(simdi, t),
      });
    }
  }
  satislar.sort((a, b) => b.t - a.t);

  return { uyeler, egitmenler, dersler, girisler, satislar, ayar: [{ id: "yogunluk", degerler: yogunluk }] };
}

/* ---------------- Parçalar ---------------- */

function OlcumEkle({ u, api }: { u: Kayit; api: PanelApi }) {
  const son = u.olcumler[u.olcumler.length - 1];
  const [kilo, setKilo] = useState(son ? String(son.kilo - 0.6).replace(".", ",") : "75");
  const [yag, setYag] = useState(son ? String(Math.round((son.yag - 0.4) * 10) / 10).replace(".", ",") : "24");
  const n = (m: string) => Number(m.replace(",", "."));
  return (
    <div className="flex flex-wrap items-end gap-2">
      {(
        [
          ["Kilo", kilo, setKilo],
          ["Yağ oranı, yüzde", yag, setYag],
        ] as const
      ).map(([ad, deger, ata]) => (
        <label key={ad} className="block w-28">
          <span className="text-[11.5px] text-[var(--ms)]">{ad}</span>
          <input value={deger} inputMode="decimal" onChange={(e) => ata(e.target.value)} className="mt-1 h-9 w-full rounded-lg border border-[var(--k)] bg-transparent px-3 text-[13px] tabular-nums outline-none focus:border-[var(--p)] focus-visible:outline-none" />
        </label>
      ))}
      <Dugme
        tur="ana"
        disabled={!(n(kilo) > 30 && n(yag) > 3)}
        onClick={() => {
          const o = { t: api.ani.getTime(), kilo: n(kilo), yag: n(yag), kas: son?.kas ?? Math.round(n(kilo) * 0.42) };
          api.guncelle("uyeler", u.id, { olcumler: [...u.olcumler, o] }, `Ölçüm girildi, ${sayi(o.kilo, 1)} kg`);
          api.haber(son ? `İlk ölçüme göre ${sayi(Math.abs(o.kilo - u.olcumler[0].kilo), 1)} kg ${o.kilo < u.olcumler[0].kilo ? "verdi" : "aldı"}. Üyeye rapor gönderildi.` : "İlk ölçüm kaydedildi", "basari");
          api.olay("olcum");
        }}
      >
        Kaydet
      </Dugme>
    </div>
  );
}

function GirisKontrol({ api, modul }: { api: PanelApi; modul: ModulBilgi }) {
  const [sube, setSube] = useState("Hepsi");
  const s = api.ani.getTime();
  const liste = api.veri.girisler.filter((g) => g.t <= s && (sube === "Hepsi" || g.sube === sube)).slice(0, 40);
  const bugun = api.veri.girisler.filter((g) => g.t >= gunBasi(api.ani) && g.t <= s);
  const qr = () => {
    // Çoğunlukla geçerli üye, arada bir süresi bitmiş ya da dondurulmuş üye okutur.
    const adaylar = api.veri.uyeler.filter((u) => (sube === "Hepsi" || u.sube === sube) && (Math.random() < 0.25 ? !aktifMi(u, api) : aktifMi(u, api)));
    const u = adaylar[Math.floor(Math.random() * adaylar.length)];
    if (!u) return;
    const neden = girisKarari(u, api);
    api.ekle("girisler", { id: api.yeniId("g"), uyeId: u.id, sube: sube === "Hepsi" ? u.sube : sube, t: s, kabul: !neden, neden });
    if (!neden) api.guncelle("uyeler", u.id, { sonGiris: s });
    api.haber(neden ? `${u.ad} için giriş reddedildi. ${neden}.` : `${u.ad} içeri girdi, kapı açıldı`, neden ? "uyari" : "basari");
    api.olay("giris");
  };
  return (
    <>
      <EkranBasligi modul={modul}>
        <select value={sube} onChange={(e) => setSube(e.target.value)} className="h-9 rounded-lg border border-[var(--k)] bg-[var(--kart)] px-2 text-[13px] outline-none">
          <option>Hepsi</option>
          {SUBELER.map((x) => (
            <option key={x}>{x}</option>
          ))}
        </select>
        <Dugme tur="ana" ikon={IconQrcode} onClick={qr}>
          QR okut
        </Dugme>
      </EkranBasligi>
      <div className="mb-4 grid grid-cols-2 gap-3 @3xl:grid-cols-4">
        {SUBELER.map((x) => (
          <Kart key={x} className="p-3.5">
            <p className="text-[11.5px] text-[var(--ms)]">{x}, şu an içeride</p>
            <p className="mt-1 text-[20px] font-bold tabular-nums">{icerideki(api, x)}</p>
          </Kart>
        ))}
        <Kart className="p-3.5">
          <p className="text-[11.5px] text-[var(--ms)]">Bugün reddedilen</p>
          <p className="mt-1 text-[20px] font-bold tabular-nums text-[var(--sari)]">{bugun.filter((g) => !g.kabul).length}</p>
        </Kart>
      </div>
      <Kart baslik="Son girişler" sag={<span className="text-[12px] text-[var(--ms)]">Bugün {bugun.length} giriş</span>}>
        <ul className="divide-y divide-[var(--k)]">
          {liste.map((g) => {
            const u = api.bul("uyeler", g.uyeId);
            return (
              <li key={g.id}>
                <button type="button" onClick={() => api.git("uyeler", { kayit: g.uyeId })} className="flex w-full items-center gap-3 px-4 py-2.5 text-left transition-colors hover:bg-[var(--k2)]">
                  <Harf metin={bas(u?.ad ?? "Ü")} boy={30} renk={g.kabul ? undefined : "var(--kirmizi)"} />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-[13px] font-medium">{u?.ad}</span>
                    <span className="block truncate text-[11.5px] text-[var(--ms)]">{g.kabul ? `${g.sube}, ${u?.paket} paket` : g.neden}</span>
                  </span>
                  <span className="shrink-0 text-right">
                    <DurumYazi d={g.kabul ? { ad: "Kabul", renk: "yesil" } : { ad: "Reddedildi", renk: "kirmizi" }} kucuk />
                    <span className="block text-[11px] text-[var(--ms)]">{once(g.t, api.ani)}</span>
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
      </Kart>
    </>
  );
}

function DersProgrami({ api, modul }: { api: PanelApi; modul: ModulBilgi }) {
  const [sube, setSube] = useState(SUBELER[0]);
  const [secili, setSecili] = useState<string | null>(null);
  const [ekle, setEkle] = useState("");
  const dersler = api.veri.dersler.filter((d) => d.sube === sube);
  const saatler = [...new Set(dersler.map((d) => d.saat))].sort((a, b) => a - b);
  const bugunNo = (api.ani.getDay() + 6) % 7;
  const d = secili ? api.bul("dersler", secili) : null;
  const saatYaz = (x: number) => `${iki(Math.floor(x))}.${iki(Math.round((x % 1) * 60))}`;
  const gecti = (x: Kayit) => dersZamani(x, api.ani) < api.ani.getTime();

  return (
    <>
      <EkranBasligi modul={modul}>
        <div role="group" aria-label="Şube" className="flex rounded-lg border border-[var(--k)] p-0.5">
          {SUBELER.map((x) => (
            <button key={x} type="button" aria-pressed={sube === x} onClick={() => setSube(x)} className={`h-8 rounded-md px-3 text-[12.5px] font-medium ${sube === x ? "bg-[var(--p)] text-white" : "text-[var(--ms)] hover:text-[var(--m)]"}`}>
              {x}
            </button>
          ))}
        </div>
      </EkranBasligi>
      <div className="overflow-x-auto rounded-xl border border-[var(--k)] bg-[var(--kart)]">
        <div className="grid min-w-[52rem] grid-cols-[4rem_repeat(7,minmax(0,1fr))]">
          <div className="border-b border-[var(--k)]" />
          {GUN_KISA.slice(1).concat(GUN_KISA[0]).map((g, i) => (
            <div key={g} className={`border-b border-l border-[var(--k)] px-2 py-2.5 text-center text-[12px] font-semibold ${i === bugunNo ? "text-[var(--p)]" : "text-[var(--ms)]"}`}>
              {g} {new Date(pazartesi(api.ani) + i * GUN).getDate()}
              {i === bugunNo && <span className="block text-[10.5px] font-medium">Bugün</span>}
            </div>
          ))}
          {saatler.map((saat) => (
            <div key={saat} className="contents">
              <div className="border-b border-[var(--k)] px-2 py-3 text-right text-[11.5px] tabular-nums text-[var(--ms)]">{saatYaz(saat)}</div>
              {Array.from({ length: 7 }, (_, gun) => {
                const x = dersler.find((y) => y.gun === gun && y.saat === saat);
                if (!x) return <div key={gun} className="border-b border-l border-[var(--k)]" />;
                const oran = x.katilimcilar.length / x.kontenjan;
                return (
                  <div key={gun} className="border-b border-l border-[var(--k)] p-1">
                    <button
                      type="button"
                      onClick={() => {
                        setSecili(x.id);
                        setEkle("");
                      }}
                      className={`block w-full rounded-lg border p-2 text-left transition-colors hover:border-[var(--p)] ${x.iptal ? "border-dashed border-[var(--k)] opacity-50" : "border-[var(--k)] bg-[var(--kart2)]"} ${gecti(x) ? "opacity-60" : ""}`}
                    >
                      <span className="block truncate text-[12.5px] font-semibold">{x.ad}</span>
                      <span className="block truncate text-[11px] text-[var(--ms)]">{egitmenAdi(api, x.egitmenId).split(" ")[0]}</span>
                      <span className="mt-1.5 block">
                        <Cubuk oran={oran} ince renk={oran >= 1 ? "var(--kirmizi)" : oran > 0.8 ? "var(--sari)" : "var(--p)"} />
                      </span>
                      <span className="mt-1 block text-[10.5px] tabular-nums text-[var(--ms)]">
                        {x.iptal ? "İptal" : oran >= 1 ? `Dolu${x.bekleme.length ? `, ${x.bekleme.length} bekliyor` : ""}` : `${x.katilimcilar.length} kişi, ${x.kontenjan} yer`}
                      </span>
                    </button>
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      </div>
      <p className="mt-3 text-[12px] text-[var(--ms)]">Soluk kutular bu hafta geçmiş dersler. Bir derse tıklayınca katılımcıları ve bekleme listesini görürsünüz.</p>

      <Cekmece acik={!!d} kapat={() => setSecili(null)}>
        {d && (
          <>
            <header className="flex items-start justify-between gap-3 border-b border-[var(--k)] px-5 py-4">
              <div>
                <h3 className="text-[17px] font-bold">{d.ad}</h3>
                <p className="mt-0.5 text-[12.5px] text-[var(--ms)]">
                  {gunAdi(dersZamani(d, api.ani), api.ani)} {saatYaz(d.saat)}, {d.sube}, {egitmenAdi(api, d.egitmenId)}
                </p>
                <div className="mt-2">
                  <DurumYazi d={d.iptal ? { ad: "İptal edildi", renk: "gri" } : gecti(d) ? { ad: "Yapıldı", renk: "gri" } : d.katilimcilar.length >= d.kontenjan ? { ad: "Dolu", renk: "kirmizi" } : { ad: "Rezervasyon açık", renk: "yesil" }} />
                </div>
              </div>
              <button type="button" onClick={() => setSecili(null)} aria-label="Kapat" className="flex h-8 w-8 items-center justify-center rounded-lg text-[var(--ms)] hover:bg-[var(--k2)]">
                <IconX size={18} />
              </button>
            </header>
            <div className="min-h-0 flex-1 overflow-y-auto">
              <Bolum baslik="Doluluk">
                <Cubuk oran={d.katilimcilar.length / d.kontenjan} />
                <p className="mt-2 text-[12.5px] text-[var(--ms)]">
                  {d.kontenjan} kişilik derste {d.katilimcilar.length} kayıt{d.bekleme.length ? `, bekleme listesinde ${d.bekleme.length} kişi` : ""}.
                  {gecti(d) && ` Derse ${d.gelenler.length} kişi geldi.`}
                </p>
              </Bolum>
              {!gecti(d) && !d.iptal && (
                <Bolum baslik="Üye ekle">
                  <div className="flex gap-2">
                    <select value={ekle} onChange={(e) => setEkle(e.target.value)} className="h-9 min-w-0 flex-1 rounded-lg border border-[var(--k)] bg-[var(--kart)] px-2 text-[13px] outline-none">
                      <option value="">Üye seçin</option>
                      {api.veri.uyeler
                        .filter((u) => u.sube === d.sube && aktifMi(u, api) && !d.katilimcilar.includes(u.id) && !d.bekleme.includes(u.id))
                        .slice(0, 60)
                        .map((u) => (
                          <option key={u.id} value={u.id}>
                            {u.ad}
                          </option>
                        ))}
                    </select>
                    <Dugme
                      tur="ana"
                      ikon={IconUserPlus}
                      disabled={!ekle}
                      onClick={() => {
                        const dolu = d.katilimcilar.length >= d.kontenjan;
                        api.guncelle("dersler", d.id, dolu ? { bekleme: [...d.bekleme, ekle] } : { katilimcilar: [...d.katilimcilar, ekle] });
                        api.haber(dolu ? `Ders dolu. ${uyeAdi(api, ekle)} bekleme listesine ${d.bekleme.length + 1}. sırada yazıldı.` : `${uyeAdi(api, ekle)} kaydedildi, ders hatırlatması bir saat önce gidecek.`, "basari");
                        setEkle("");
                        api.olay("ders-kayit");
                      }}
                    >
                      Ekle
                    </Dugme>
                  </div>
                </Bolum>
              )}
              <Bolum baslik={`Katılımcılar, ${d.katilimcilar.length}`}>
                <ul className="space-y-1.5">
                  {d.katilimcilar.map((id: string) => (
                    <li key={id} className="flex items-center justify-between gap-2 text-[12.5px]">
                      <button type="button" onClick={() => api.git("uyeler", { kayit: id })} className="truncate hover:text-[var(--p)]">
                        {uyeAdi(api, id)}
                      </button>
                      {gecti(d) && <span className="text-[11.5px]" style={{ color: d.gelenler.includes(id) ? RENK.yesil : RENK.kirmizi }}>{d.gelenler.includes(id) ? "Geldi" : "Gelmedi"}</span>}
                    </li>
                  ))}
                </ul>
              </Bolum>
              {d.bekleme.length > 0 && (
                <Bolum baslik="Bekleme listesi">
                  <ol className="space-y-1.5 text-[12.5px]">
                    {d.bekleme.map((id: string, i: number) => (
                      <li key={id}>
                        {i + 1}. {uyeAdi(api, id)}
                      </li>
                    ))}
                  </ol>
                  <p className="mt-2 text-[12px] text-[var(--ms)]">Kayıtlı bir üye vazgeçerse sıradaki kişiye SMS gider, iki saat içinde onaylarsa yeri onun olur.</p>
                </Bolum>
              )}
            </div>
            {!gecti(d) && !d.iptal && (
              <footer className="border-t border-[var(--k)] px-5 py-3">
                <Dugme
                  tur="tehlike"
                  ikon={IconX}
                  onClick={() => {
                    api.guncelle("dersler", d.id, { iptal: true });
                    api.haber(`Ders iptal edildi. ${d.katilimcilar.length} katılımcıya SMS gitti.`, "bilgi");
                  }}
                >
                  Dersi iptal et
                </Dugme>
              </footer>
            )}
          </>
        )}
      </Cekmece>
    </>
  );
}

/* ---------------- Ekranlar ---------------- */

function uyarilar(api: PanelApi) {
  const liste: ReturnType<SektorPanel["uyarilar"]> = [];
  const durumlar = api.veri.uyeler.map((u) => uyeDurumu(u, api).ad);
  const bitiyor = durumlar.filter((d) => d === "Bitiyor").length;
  const gelmiyor = durumlar.filter((d) => d === "Gelmiyor").length;
  const s = api.ani.getTime();
  const doluDersler = api.veri.dersler.filter((d) => !d.iptal && d.bekleme.length && dersZamani(d, api.ani) > s && dersZamani(d, api.ani) < gunBasi(s) + GUN);
  const reddedilen = api.veri.girisler.filter((g) => !g.kabul && g.t > s - GUN && g.t <= s).length;
  if (bitiyor) liste.push({ metin: `${bitiyor} üyeliğin süresi yedi gün içinde bitiyor`, modul: "uyeler", filtre: "Durum=Bitiyor", renk: "sari" });
  if (gelmiyor) liste.push({ metin: `${gelmiyor} aktif üye on dört günden uzun süredir gelmiyor`, modul: "uyeler", filtre: "Durum=Gelmiyor", renk: "kirmizi" });
  for (const d of doluDersler.slice(0, 2)) liste.push({ metin: `Bugün ${d.sube} ${d.ad} dersi dolu, bekleme listesinde ${d.bekleme.length} kişi`, modul: "dersler", renk: "mavi" });
  if (reddedilen) liste.push({ metin: `Son 24 saatte ${reddedilen} giriş reddedildi`, modul: "giris", renk: "sari" });
  return liste;
}

const ozet = ozetEkrani({
  kullanici: KULLANICI.ad,
  uyarilar,
  karsilama: (api) => {
    const bugun = api.veri.girisler.filter((g) => g.kabul && g.t >= gunBasi(api.ani) && g.t <= api.ani.getTime()).length;
    return `Bugün turnikeden ${bugun} kişi geçti, şu an ${icerideki(api)} kişi salonda.`;
  },
  sayilar: (api) => {
    const aktif = api.veri.uyeler.filter((u) => aktifMi(u, api)).length;
    const s = api.ani.getTime();
    const otuzGunOnce = api.veri.uyeler.filter((u) => (u.ilk ?? u.bas) <= s - 30 * GUN && u.bit > s - 30 * GUN).length;
    const satis = (bas: number, son: number) => api.veri.satislar.filter((x) => x.t >= bas && x.t < son).reduce((t, x) => t + x.tutar, 0);
    const ay = satis(s - 30 * GUN, s);
    const onceki = satis(s - 60 * GUN, s - 30 * GUN);
    return [
      {
        ad: "Aktif üye",
        deger: sayi(aktif),
        degisim: { oran: ((aktif - otuzGunOnce) / otuzGunOnce) * 100, iyi: aktif >= otuzGunOnce, metin: "30 gün öncesine göre" },
        not: "Üyeliği devam eden ve dondurulmamış üyeler. Uzun süredir gelmeyenler de aktif sayılır, çünkü üyelikleri sürüyor.",
        git: () => api.git("uyeler"),
      },
      {
        ad: "Şu an salonda",
        deger: sayi(icerideki(api)),
        alt: SUBELER.map((x) => `${x} ${icerideki(api, x)}`).join(", "),
        not: "Son 80 dakika içinde turnikeden geçen üyeler. Ortalama antrenman süresi bu kadar olduğu için içeride sayılırlar.",
        git: () => api.git("giris"),
      },
      {
        ad: "Paket satışı, 30 gün",
        deger: tlKisa(ay),
        degisim: onceki ? { oran: ((ay - onceki) / onceki) * 100, iyi: ay >= onceki, metin: "önceki 30 güne göre" } : undefined,
        not: "Yeni üyelik ve yenileme satışlarının toplamı. Taksitli satışlar tam tutarıyla sayılır.",
        seri: Array.from({ length: 12 }, (_, i) => satis(s - (12 - i) * 7 * GUN, s - (11 - i) * 7 * GUN)),
        git: () => api.git("satislar"),
      },
      {
        ad: "Bitecek üyelik, 7 gün",
        deger: String(api.veri.uyeler.filter((u) => uyeDurumu(u, api).ad === "Bitiyor").length),
        renk: "sari",
        alt: "Yenileme görüşmesi için",
        not: "Önümüzdeki yedi gün içinde süresi dolacak üyelikler. Karta tıklayınca liste bu üyelerle süzülmüş açılır.",
        git: () => api.git("uyeler", { filtre: "Durum=Bitiyor" }),
      },
    ];
  },
  ana: {
    baslik: "Giriş yoğunluğu, son dört hafta",
    icerik: (api) => {
      const d = api.veri.ayar.find((a) => a.id === "yogunluk")!.degerler as number[][];
      return <IsiHaritasi satirlar={GUN_KISA.slice(1).concat(GUN_KISA[0])} sutunlar={Array.from({ length: 17 }, (_, i) => iki(6 + i))} degerler={d} bicim={(n) => `ortalama ${n} giriş`} />;
    },
  },
  parcalar: [
    {
      baslik: "Şubelere göre aktif üye",
      icerik: (api) => {
        const dilimler = SUBELER.map((x, i) => ({ ad: x, renk: ["vurgu", "mavi", "mor"][i], deger: api.veri.uyeler.filter((u) => u.sube === x && aktifMi(u, api)).length }));
        return <HalkaGrafik dilimler={dilimler} bicim={(n) => `${n} üye`} merkez={String(dilimler.reduce((t, d) => t + d.deger, 0))} />;
      },
    },
    {
      baslik: "Bugünün dersleri",
      icerik: (api) => {
        const bugunNo = (api.ani.getDay() + 6) % 7;
        const liste = api.veri.dersler.filter((d) => d.gun === bugunNo && !d.iptal).sort((a, b) => a.saat - b.saat);
        if (!liste.length) return <p className="text-[12.5px] text-[var(--ms)]">Bugün grup dersi yok.</p>;
        return (
          <ul className="space-y-2.5">
            {liste.slice(0, 7).map((d) => (
              <li key={d.id}>
                <button type="button" onClick={() => api.git("dersler")} className="block w-full text-left">
                  <span className="mb-1 flex justify-between gap-3 text-[12.5px]">
                    <span className="truncate">
                      {iki(Math.floor(d.saat))}.{iki(Math.round((d.saat % 1) * 60))} {d.ad}, {d.sube}
                    </span>
                    <span className="shrink-0 tabular-nums text-[var(--ms)]">
                      {d.katilimcilar.length} kişi, {d.kontenjan} yer
                    </span>
                  </span>
                  <Cubuk oran={d.katilimcilar.length / d.kontenjan} renk={d.katilimcilar.length >= d.kontenjan ? "var(--kirmizi)" : "var(--p)"} />
                </button>
              </li>
            ))}
          </ul>
        );
      },
    },
  ],
});

const panel: SektorPanel = {
  saat: { acilis: 8, kapanis: 22.5, yogun: 18.5 },
  kullanici: KULLANICI,
  uret,
  uyarilar,
  moduller: [
    { id: "ozet", grup: "Genel", ekran: ozet },
    {
      id: "uyeler",
      grup: "Üyeler",
      rozet: (api) => api.veri.uyeler.filter((u) => uyeDurumu(u, api).ad === "Bitiyor").length,
      ekran: {
        tur: "liste",
        koleksiyon: "uyeler",
        baslikAdi: "Üye",
        baslik: (u) => u.ad,
        alt: (u) => `${u.sube}, ${u.telefon}`,
        harf: (u) => u.ad,
        durum: uyeDurumu,
        arama: (u) => `${u.telefon} ${u.sube} ${u.paket}`,
        // Süresi en yakında bitecek olanlar üstte, bitmiş üyelikler en altta.
        sira: (a, b) => {
          const sira = (u: Kayit) => (u.bit < Date.now() - GUN ? 1e15 - u.bit : u.bit);
          return sira(a) - sira(b);
        },
        sutunlar: [
          { ad: "Paket", deger: (u) => u.paket, sirala: (u) => u.paket, oncelik: 2 },
          { ad: "Bitiş", deger: (u) => tarih(u.bit), sirala: (u) => u.bit, csv: (u) => tarihYil(u.bit), oncelik: 1 },
          { ad: "Son giriş", deger: (u, api) => once(u.sonGiris, api.ani), sirala: (u) => u.sonGiris, oncelik: 1 },
          { ad: "Haftada", deger: (u) => `${sayi(u.siklik, 1)} kez`, sirala: (u) => u.siklik, hiza: "sag", oncelik: 3 },
        ],
        filtreler: [
          { ad: "Durum", secenekler: ["Aktif", "Bitiyor", "Gelmiyor", "Donduruldu", "Bitti"].map((d) => ({ ad: d, kosul: (u: Kayit, api: PanelApi) => uyeDurumu(u, api).ad === d })) },
          { ad: "Şube", secenekler: SUBELER.map((x) => ({ ad: x, kosul: (u: Kayit) => u.sube === x })) },
          { ad: "Paket", secenekler: PAKETLER.map((p) => ({ ad: p.ad, kosul: (u: Kayit) => u.paket === p.ad })) },
        ],
        ozet: (api) => {
          const d = api.veri.uyeler.map((u) => uyeDurumu(u, api).ad);
          return [
            { ad: "Aktif", deger: String(d.filter((x) => x === "Aktif").length), renk: "yesil" },
            { ad: "Bitiyor", deger: String(d.filter((x) => x === "Bitiyor").length), not: "Yedi gün içinde", renk: "sari" },
            { ad: "Gelmiyor", deger: String(d.filter((x) => x === "Gelmiyor").length), not: "On dört günü geçen", renk: "kirmizi" },
            { ad: "Donduruldu", deger: String(d.filter((x) => x === "Donduruldu").length), renk: "mor" },
          ];
        },
        detay: {
          bolumler: (u, api) => {
            const girisler = api.veri.girisler.filter((g) => g.uyeId === u.id && g.t <= api.ani.getTime()).slice(0, 4);
            return (
              <>
                <Bolum baslik="Üyelik">
                  <AlanListesi
                    alanlar={[
                      ["Paket", u.paket],
                      ["Şube", u.sube],
                      ["Başlangıç", tarih(u.bas)],
                      ["Bitiş", tarihYil(u.bit)],
                      ["Kalan", u.bit > api.ani.getTime() ? `${Math.ceil((u.bit - api.ani.getTime()) / GUN)} gün` : "Bitti"],
                      ["Hedef", u.hedef],
                      ...(u.dondurma ? ([["Dondurma", `${tarih(u.dondurma.bas)} ile ${tarih(u.dondurma.bit)} arası`]] as [string, string][]) : []),
                    ]}
                  />
                </Bolum>
                <Bolum baslik="Ölçüm">
                  {u.olcumler.length >= 2 ? (
                    <CizgiGrafik noktalar={u.olcumler.map((o: Kayit) => ({ etiket: tarih(o.t), deger: o.kilo }))} bicim={(n) => `${sayi(n, 1)} kg`} yukseklik={110} />
                  ) : (
                    <p className="text-[12.5px] text-[var(--ms)]">Grafik için en az iki ölçüm gerekir.</p>
                  )}
                  {u.olcumler.length > 0 && (
                    <div className="mt-3">
                      <MiniTablo
                        basliklar={["Tarih", "Kilo", "Yağ", "Kas"]}
                        sagdakiler={[1, 2, 3]}
                        satirlar={[...u.olcumler].reverse().slice(0, 4).map((o: Kayit) => [tarih(o.t), `${sayi(o.kilo, 1)} kg`, yuzde(o.yag, 1), `${sayi(o.kas, 1)} kg`])}
                      />
                    </div>
                  )}
                  <div className="mt-4">
                    <OlcumEkle key={u.olcumler.length} u={u} api={api} />
                  </div>
                </Bolum>
                <Bolum baslik="Son girişler">
                  {girisler.length ? (
                    <ul className="space-y-1.5 text-[12.5px]">
                      {girisler.map((g) => (
                        <li key={g.id} className="flex justify-between gap-3">
                          <span>{zaman(g.t, api.ani)}</span>
                          <span style={{ color: g.kabul ? undefined : RENK.kirmizi }}>{g.kabul ? g.sube : "Reddedildi"}</span>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-[12.5px] text-[var(--ms)]">Son iki günde girişi yok. En son {once(u.sonGiris, api.ani).toLocaleLowerCase("tr")} geldi.</p>
                  )}
                </Bolum>
                <Bolum baslik="Geçmiş">
                  <Gecmis satirlar={u.gecmis.map((g: Kayit) => ({ zaman: zaman(g.t, api.ani), metin: g.m }))} />
                </Bolum>
              </>
            );
          },
          eylemler: [
            {
              ad: "3 ay uzat",
              tur: "ana",
              ikon: IconCalendarPlus,
              gorunur: (u, api) => ["Bitiyor", "Bitti", "Gelmiyor", "Aktif"].includes(uyeDurumu(u, api).ad),
              uygula: (u, api) => {
                const s = api.ani.getTime();
                const yeniBit = Math.max(u.bit, gunBasi(s) + 23 * SAAT) + 3 * AY;
                api.guncelle("uyeler", u.id, { bit: yeniBit, paket: "3 aylık" }, `3 ay uzatıldı, yeni bitiş ${tarih(yeniBit)}`);
                api.ekle("satislar", { id: api.yeniId("s"), uyeId: u.id, paket: "3 aylık", tur: "Yenileme", tutar: 7800, odeme: "Kredi kartı", taksit: 3, danisman: DANISMANLAR[0], sube: u.sube, t: s });
                api.haber(`Üyelik ${tarihYil(yeniBit)} tarihine uzatıldı. 7.800 TL satış kaydedildi.`, "basari");
                api.olay("uyelik-uzat");
              },
            },
            {
              ad: "Dondur",
              ikon: IconPlayerPause,
              gorunur: (u, api) => aktifMi(u, api),
              uygula: (u, api) => {
                const s = api.ani.getTime();
                api.guncelle("uyeler", u.id, { dondurma: { bas: s, bit: s + 14 * GUN }, bit: u.bit + 14 * GUN }, "14 gün donduruldu, bitiş tarihi 14 gün ileri alındı");
                api.haber("Üyelik 14 gün donduruldu. Bitiş tarihi kendiliğinden ileri kaydı.", "basari");
                api.olay("dondur");
              },
            },
            {
              ad: "Dondurmayı bitir",
              ikon: IconPlayerPlay,
              gorunur: (u, api) => uyeDurumu(u, api).ad === "Donduruldu",
              uygula: (u, api) => {
                const s = api.ani.getTime();
                const kalan = u.dondurma.bit - s;
                api.guncelle("uyeler", u.id, { dondurma: { ...u.dondurma, bit: s }, bit: u.bit - kalan }, "Dondurma erken bitirildi");
                api.haber("Üye yeniden giriş yapabilir", "basari");
              },
            },
            {
              ad: "Hatırlatma gönder",
              ikon: IconBell,
              gorunur: (u, api) => ["Bitiyor", "Gelmiyor"].includes(uyeDurumu(u, api).ad),
              uygula: (u, api) => {
                const d = uyeDurumu(u, api).ad;
                api.guncelle("uyeler", u.id, {}, d === "Bitiyor" ? "Yenileme hatırlatması gönderildi" : "Sizi özledik mesajı gönderildi");
                api.haber(`${u.ad} kişisine WhatsApp mesajı gönderildi`, "basari");
                api.olay("hatirlatma");
              },
            },
          ],
        },
        yeni: {
          baslik: "Yeni üye",
          dugme: "Üyeyi kaydet",
          alanlar: [
            { ad: "Ad soyad", anahtar: "ad", tur: "metin", varsayilan: "Deniz Arslan", zorunlu: true },
            { ad: "Telefon", anahtar: "telefon", tur: "metin", varsayilan: "0532 418 22 90" },
            { ad: "Şube", anahtar: "sube", tur: "secim", secenekler: SUBELER },
            { ad: "Paket", anahtar: "paket", tur: "secim", secenekler: PAKETLER.map((p) => p.ad) },
          ],
          olustur: (d, api) => {
            const s = api.ani.getTime();
            const p = PAKETLER.find((x) => x.ad === d.paket) ?? PAKETLER[0];
            const id = api.yeniId("u");
            api.ekle("uyeler", {
              id,
              ad: d.ad.trim() || "Yeni üye",
              telefon: d.telefon,
              sube: d.sube,
              paket: p.ad,
              bas: s,
              ilk: s,
              bit: gunBasi(s) + p.ay * AY + 23 * SAAT,
              sonGiris: s,
              siklik: 3,
              hedef: "Kondisyon",
              olcumler: [],
              dondurma: null,
              gecmis: [{ t: s, m: `${p.ad} paket ile üye oldu, ${KULLANICI.ad}` }],
            });
            api.ekle("satislar", { id: api.yeniId("s"), uyeId: id, paket: p.ad, tur: "Yeni üyelik", tutar: p.fiyat, odeme: "Kredi kartı", taksit: 1, danisman: DANISMANLAR[1], sube: d.sube, t: s });
            api.haber(`Üye kaydedildi. QR kodu telefonuna gönderildi, turnikeden girebilir.`, "basari");
            api.olay("yeni-uye");
            return id;
          },
        },
      },
    },
    { id: "giris", grup: "Üyeler", ekran: { tur: "ozel", bilesen: GirisKontrol } },
    { id: "dersler", grup: "Program", ekran: { tur: "ozel", bilesen: DersProgrami } },
    {
      id: "egitmenler",
      grup: "Program",
      ekran: {
        tur: "liste",
        koleksiyon: "egitmenler",
        baslikAdi: "Eğitmen",
        baslik: (e) => e.ad,
        harf: (e) => e.ad,
        alt: (e) => `${e.uzmanlik}, ${e.sube}`,
        arama: (e) => `${e.uzmanlik} ${e.sube}`,
        sira: (a, b) => b.puan - a.puan,
        sutunlar: [
          { ad: "Grup dersi, 30 gün", deger: (e, api) => hakedis(e, api).grup, hiza: "sag", oncelik: 2 },
          { ad: "Özel ders, 30 gün", deger: (e) => e.ozel30, sirala: (e) => e.ozel30, hiza: "sag", oncelik: 2 },
          { ad: "Puan", deger: (e) => `${sayi(e.puan, 1)}, ${e.yorum} oy`, sirala: (e) => e.puan, csv: (e) => e.puan, hiza: "sag", oncelik: 1 },
          { ad: "Hakediş", deger: (e, api) => tl(hakedis(e, api).tutar), csv: (e, api) => hakedis(e, api).tutar, hiza: "sag", oncelik: 1 },
        ],
        filtreler: [{ ad: "Şube", secenekler: SUBELER.map((x) => ({ ad: x, kosul: (e: Kayit) => e.sube === x })) }],
        detay: {
          bolumler: (e, api) => {
            const h = hakedis(e, api);
            const dersleri = api.veri.dersler.filter((d) => d.egitmenId === e.id).sort((a, b) => a.gun - b.gun || a.saat - b.saat);
            return (
              <>
                <Bolum baslik="Hakediş, son 30 gün">
                  <MiniTablo
                    basliklar={["Kalem", "Adet", "Tutar"]}
                    sagdakiler={[1, 2]}
                    satirlar={[
                      [`Grup dersi, ders başına ${tl(EGITMEN_UCRETI.grup)}`, h.grup, tl(h.grup * EGITMEN_UCRETI.grup)],
                      [`Özel ders, ders başına ${tl(EGITMEN_UCRETI.ozel)}`, h.ozel, tl(h.ozel * EGITMEN_UCRETI.ozel)],
                      [<strong>Toplam</strong>, "", <strong>{tl(h.tutar)}</strong>],
                    ]}
                  />
                  <p className="mt-3 text-[12px] leading-5 text-[var(--ms)]">Ders sayıları programdan ve özel ders onaylarından sayılır. İptal edilen ders hakedişe girmez.</p>
                </Bolum>
                <Bolum baslik="Haftalık dersleri">
                  <ul className="space-y-1.5 text-[12.5px]">
                    {dersleri.map((d) => (
                      <li key={d.id} className="flex justify-between gap-3">
                        <span>
                          {GUN_KISA[(d.gun + 1) % 7]} {iki(Math.floor(d.saat))}.{iki(Math.round((d.saat % 1) * 60))}, {d.ad}
                        </span>
                        <span className="tabular-nums text-[var(--ms)]">{d.katilimcilar.length} kişi</span>
                      </li>
                    ))}
                  </ul>
                </Bolum>
                <Bolum baslik="Üye puanı">
                  <AlanListesi alanlar={[["Ortalama", `${sayi(e.puan, 1)}, 5 üzerinden`], ["Oy veren", `${e.yorum} üye`]]} />
                </Bolum>
              </>
            );
          },
          eylemler: [
            {
              ad: "Puantajı onayla",
              tur: "ana",
              ikon: IconCheck,
              uygula: (e, api) => {
                api.guncelle("egitmenler", e.id, {}, `Puantaj onaylandı, ${tl(hakedis(e, api).tutar)}`);
                api.haber(`${e.ad} için ${tl(hakedis(e, api).tutar)} hakediş muhasebeye gönderildi`, "basari");
              },
            },
          ],
        },
      },
    },
    {
      id: "satislar",
      grup: "Finans",
      ekran: {
        tur: "liste",
        koleksiyon: "satislar",
        baslikAdi: "Satış",
        baslik: (x, api) => uyeAdi(api, x.uyeId),
        harf: (x, api) => uyeAdi(api, x.uyeId),
        alt: (x, api) => `${zaman(x.t, api.ani)}, ${x.sube}`,
        durum: (x) => (x.tur === "Yenileme" ? { ad: "Yenileme", renk: "mavi" } : { ad: "Yeni üyelik", renk: "yesil" }),
        arama: (x) => `${x.paket} ${x.danisman} ${x.sube}`,
        sira: (a, b) => b.t - a.t,
        sutunlar: [
          { ad: "Paket", deger: (x) => x.paket, sirala: (x) => x.paket, oncelik: 1 },
          { ad: "Ödeme", deger: (x) => (x.taksit > 1 ? `${x.odeme}, ${x.taksit} taksit` : x.odeme), oncelik: 3 },
          { ad: "Danışman", deger: (x) => x.danisman, sirala: (x) => x.danisman, oncelik: 2 },
          { ad: "Tutar", deger: (x) => tl(x.tutar), sirala: (x) => x.tutar, csv: (x) => x.tutar, hiza: "sag", oncelik: 1 },
        ],
        filtreler: [
          { ad: "Tür", secenekler: ["Yeni üyelik", "Yenileme"].map((t) => ({ ad: t, kosul: (x: Kayit) => x.tur === t })) },
          { ad: "Şube", secenekler: SUBELER.map((s) => ({ ad: s, kosul: (x: Kayit) => x.sube === s })) },
          { ad: "Danışman", secenekler: DANISMANLAR.map((d) => ({ ad: d, kosul: (x: Kayit) => x.danisman === d })) },
        ],
        ozet: (api) => {
          const s = api.ani.getTime();
          const l = api.veri.satislar.filter((x) => x.t > s - 30 * GUN);
          return [
            { ad: "Satış, 30 gün", deger: tlKisa(l.reduce((t, x) => t + x.tutar, 0)) },
            { ad: "Yeni üyelik", deger: String(l.filter((x) => x.tur === "Yeni üyelik").length), renk: "yesil" },
            { ad: "Yenileme", deger: String(l.filter((x) => x.tur === "Yenileme").length), renk: "mavi" },
            { ad: "Ortalama paket", deger: tl(l.reduce((t, x) => t + x.tutar, 0) / Math.max(1, l.length)) },
          ];
        },
        detay: {
          bolumler: (x, api) => (
            <Bolum
              baslik="Satış"
              sag={
                <button type="button" onClick={() => api.git("uyeler", { kayit: x.uyeId })} className="text-[12px] font-semibold text-[var(--p)] hover:underline">
                  Üyeyi aç
                </button>
              }
            >
              <AlanListesi alanlar={[["Üye", uyeAdi(api, x.uyeId)], ["Paket", x.paket], ["Tür", x.tur], ["Tutar", tl(x.tutar)], ["Ödeme", x.taksit > 1 ? `${x.odeme}, ${x.taksit} taksit` : x.odeme], ["Danışman", x.danisman], ["Şube", x.sube], ["Zaman", zaman(x.t, api.ani)]]} />
            </Bolum>
          ),
        },
      },
    },
  ],
  arama: [
    { koleksiyon: "uyeler", modul: "uyeler", baslik: (u) => u.ad, alt: (u) => `${u.sube}, ${u.paket}`, metin: (u) => u.telefon },
    { koleksiyon: "egitmenler", modul: "egitmenler", baslik: (e) => e.ad, alt: (e) => e.uzmanlik, metin: (e) => e.sube },
  ],
  gorevler: [
    { id: "g1", metin: "Süresi biten bir üyeliği uzatın", ipucu: "Üyeler ekranında durum süzgecinden Bitiyor ya da Bitti seçin.", modul: "uyeler", olay: "uyelik-uzat" },
    { id: "g2", metin: "Bir derse üye ekleyin", ipucu: "Ders programında bugünden sonraki bir dersi açın.", modul: "dersler", olay: "ders-kayit" },
    { id: "g3", metin: "Turnikede QR okutun", ipucu: "Giriş kontrol ekranında QR okut düğmesine basın. Arada süresi bitmiş biri de okutur.", modul: "giris", olay: "giris" },
    { id: "g4", metin: "Bir üyeye ölçüm girin", ipucu: "Bir üyeyi açın, ölçüm bölümüne yeni kilo ve yağ oranını yazın.", modul: "uyeler", olay: "olcum" },
    { id: "g5", metin: "Gelmeyen bir üyeye hatırlatma gönderin", ipucu: "Durum süzgecinden Gelmiyor seçeneğini seçin.", modul: "uyeler", olay: "hatirlatma" },
  ],
  canli: {
    aralik: 11_000,
    uret: (api, r) => {
      const s = api.ani.getTime();
      const uygun = api.veri.uyeler.filter((u) => aktifMi(u, api) && s - u.sonGiris > 6 * SAAT);
      const u = r.olasilik(0.12) ? r.sec(api.veri.uyeler.filter((x) => !aktifMi(x, api))) : r.sec(uygun);
      if (!u) return;
      const neden = girisKarari(u, api);
      api.ekle("girisler", { id: api.yeniId("g"), uyeId: u.id, sube: u.sube, t: s, kabul: !neden, neden });
      if (!neden) api.guncelle("uyeler", u.id, { sonGiris: s });
      else api.bildir(`${u.sube} turnikesi, ${u.ad} için giriş reddedildi`, "giris");
    },
  },
};

export default panel;
export { bilgi };
