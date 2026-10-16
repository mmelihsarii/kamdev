/*
 * Kurs merkezi demosu: Pusula Eğitim Kurumları. Deneme sonuçları ders ders
 * doğru ve yanlış olarak saklanır, net her açılışta hesaplanır. Bugünün ders
 * oturumları programdan üretilir; yoklaması alınmamış ders uyarı olur.
 */
import { useState } from "react";
import { IconCheck, IconClock, IconSend } from "@tabler/icons-react";
import { kurs as bilgi } from "./bilgi";
import { ozetEkrani } from "../../panel/Ozet";
import { EkranBasligi } from "../../panel/Liste";
import { AlanListesi, Bolum, Cubuk, Dugme, DurumYazi, Gecmis, Harf, Kart, MiniTablo, RENK, isimRengi } from "../../panel/parcalar";
import { CizgiGrafik, CubukGrafik } from "../../panel/grafik";
import { DAKIKA, GUN, GUN_KISA, SAAT, bas, gunBasi, iki, kisiler, saat, sayi, tarih, tarihYil, tl, tlKisa, yuzde, zaman } from "../../ortak";
import type { Durum, Eylem, Kayit, ModulBilgi, PanelApi, Rastgele, SektorPanel, Veri } from "../../tipler";

const KULLANICI = { ad: "Gizem Aydın", rol: "Kurum müdürü" };
const SINIFLAR = [
  { id: "c1", ad: "LGS A", seviye: "LGS", sube: "Çankaya" },
  { id: "c2", ad: "LGS B", seviye: "LGS", sube: "Keçiören" },
  { id: "c3", ad: "12 Sayısal A", seviye: "TYT", sube: "Çankaya" },
  { id: "c4", ad: "12 Sayısal B", seviye: "TYT", sube: "Keçiören" },
  { id: "c5", ad: "12 Eşit Ağırlık", seviye: "TYT", sube: "Çankaya" },
  { id: "c6", ad: "Mezun Sayısal", seviye: "TYT", sube: "Çankaya" },
];
const BOLUMLER: Record<string, [string, number][]> = {
  LGS: [["Türkçe", 20], ["Matematik", 20], ["Fen", 20], ["İnkılap", 10], ["Din", 10], ["İngilizce", 10]],
  TYT: [["Türkçe", 40], ["Sosyal", 20], ["Matematik", 40], ["Fen", 20]],
};
/** LGS de üç yanlış, TYT de dört yanlış bir doğruyu götürür. */
const CEZA: Record<string, number> = { LGS: 3, TYT: 4 };
const OGRETMENLER: [string, string, string][] = [
  ["Ahmet Yalın", "Matematik", "Çankaya"],
  ["Sevgi Duran", "Matematik", "Keçiören"],
  ["Nilay Ekinci", "Türkçe", "Çankaya"],
  ["Okan Sezer", "Türkçe", "Keçiören"],
  ["Ferda Işık", "Fen", "Çankaya"],
  ["Cengiz Toprak", "Fen", "Keçiören"],
  ["Melek Aksoy", "Sosyal", "Çankaya"],
  ["Tarık Bilgin", "Sosyal", "Keçiören"],
  ["Jale Karaman", "İngilizce", "Çankaya"],
];
const DERS_UCRETI = 700;
const PAKET: Record<string, number> = { LGS: 72000, TYT: 86000 };
const OTURUM_SURESI = 80;

const bransi = (ders: string) => (["İnkılap", "Din", "Sosyal"].includes(ders) ? "Sosyal" : ders);
const sinif = (id: string) => SINIFLAR.find((c) => c.id === id)!;

/* ---------------- Hesaplar ---------------- */

type Sonuc = Record<string, [number, number]>;
const netHesap = (sonuc: Sonuc, seviye: string) => Object.values(sonuc).reduce((t, [d, y]) => t + d - y / CEZA[seviye], 0);
const dersNeti = ([d, y]: [number, number], seviye: string) => d - y / CEZA[seviye];

function sonNetler(o: Kayit, api: PanelApi) {
  const sv = sinif(o.sinifId).seviye;
  return api.veri.denemeler
    .filter((d) => d.seviye === sv && o.sonuclar[d.id])
    .sort((a, b) => a.t - b.t)
    .map((d) => ({ d, net: netHesap(o.sonuclar[d.id], sv) }));
}

function ogrenciDurumu(o: Kayit, api: PanelApi): Durum {
  if (api.veri.taksitler.some((t) => t.ogrenciId === o.id && !t.odendi && t.vade < gunBasi(api.ani))) return { ad: "Ödeme gecikti", renk: "kirmizi" };
  if (o.devamsizlik >= 5) return { ad: "Devamsızlık yüksek", renk: "sari" };
  const n = sonNetler(o, api);
  if (n.length >= 3 && n[n.length - 1].net < n[n.length - 3].net - 4) return { ad: "Neti düşüyor", renk: "mor" };
  return { ad: "Normal", renk: "yesil" };
}

const ogretmenAdi = (api: PanelApi, id: string) => api.bul("ogretmenler", id)?.ad ?? "Öğretmen";
const ogrenciAdi = (api: PanelApi, id: string) => api.bul("ogrenciler", id)?.ad ?? "Öğrenci";

/* ---------------- Veri üretimi ---------------- */

function uret(ani: Date, r: Rastgele): Veri {
  const simdi = ani.getTime();
  const bugun = gunBasi(simdi);
  const ogretmenler: Kayit[] = OGRETMENLER.map(([ad, brans, sube], i) => ({ id: `t${i + 1}`, ad, brans, sube, telefon: `05${r.tam(30, 55)} ${r.tam(100, 999)} ${r.tam(10, 99)} ${r.tam(10, 99)}`, gecmis: [] }));
  const ogretmenSec = (brans: string, sube: string) => ogretmenler.find((t) => t.brans === bransi(brans) && t.sube === sube) ?? ogretmenler.find((t) => t.brans === bransi(brans))!;

  // Denemeler: her seviye için iki haftada bir, beş deneme.
  const denemeler: Kayit[] = [];
  for (const seviye of ["LGS", "TYT"]) {
    for (let i = 0; i < 5; i++) {
      const t = gunBasi(simdi - ((4 - i) * 14 + (seviye === "LGS" ? 3 : 2)) * GUN) + 10 * SAAT;
      denemeler.push({ id: `d${seviye}${i + 1}`, ad: `${seviye} deneme ${i + 1}`, seviye, t, karne: i < 4 });
    }
  }

  const ogrenciler: Kayit[] = [];
  const taksitler: Kayit[] = [];
  const kisi = kisiler(r, 140);
  const veli = kisiler(r, 140);
  let k = 0;
  for (const c of SINIFLAR) {
    const adet = r.tam(18, 24);
    for (let i = 0; i < adet && k < kisi.length; i++, k++) {
      const yetenek = r.kesir();
      const egilim = r.kesir() * 0.08 - 0.025;
      const sonuclar: Record<string, Sonuc> = {};
      denemeler
        .filter((d) => d.seviye === c.seviye)
        .forEach((d, j) => {
          if (!r.olasilik(0.92)) return;
          const s: Sonuc = {};
          for (const [ders, soru] of BOLUMLER[c.seviye]) {
            const p = Math.max(0.1, Math.min(0.97, 0.22 + yetenek * 0.62 + egilim * j + (r.kesir() - 0.5) * 0.12));
            const dogru = Math.round(soru * p);
            const yanlis = Math.round((soru - dogru) * (0.35 + r.kesir() * 0.4));
            s[ders] = [dogru, yanlis];
          }
          sonuclar[d.id] = s;
        });
      const o: Kayit = {
        id: `o${k + 1}`,
        ad: kisi[k].tamAd,
        sinifId: c.id,
        sube: c.sube,
        veli: veli[k].tamAd.split(" ")[0] + " " + kisi[k].soyad,
        veliTel: veli[k].telefon,
        okul: c.seviye === "LGS" ? r.sec(["Atatürk Ortaokulu", "Cumhuriyet Ortaokulu", "Gazi Ortaokulu", "Mimar Sinan Ortaokulu"]) : c.id === "c6" ? "Mezun" : r.sec(["Ankara Anadolu Lisesi", "Yenimahalle Fen Lisesi", "Keçiören Anadolu Lisesi", "Çankaya Lisesi"]),
        hedef: c.seviye === "LGS" ? r.sec(["Fen lisesi", "Anadolu lisesi", "Sosyal bilimler lisesi"]) : r.sec(["Tıp", "Mühendislik", "Hukuk", "Psikoloji", "Öğretmenlik"]),
        devamsizlik: r.agirlikli([[0, 40], [1, 22], [2, 15], [3, 9], [r.tam(5, 9), 14]] as const),
        sonuclar,
        kayit: simdi - r.tam(30, 70) * GUN,
        gecmis: [],
      };
      ogrenciler.push(o);
      const toplam = PAKET[c.seviye] * (r.olasilik(0.2) ? 0.85 : 1);
      const adetT = r.olasilik(0.15) ? 1 : 9;
      const ilk = gunBasi(o.kayit) + 5 * GUN;
      const riskli = r.olasilik(0.1);
      for (let j = 0; j < adetT; j++) {
        const vade = ilk + j * 30 * GUN;
        const odendi = vade < simdi && !(riskli && vade > simdi - 40 * GUN);
        taksitler.push({ id: `${o.id}k${j + 1}`, ogrenciId: o.id, no: j + 1, adet: adetT, tutar: Math.round(toplam / adetT / 10) * 10, vade, odendi, gecmis: odendi ? [{ t: vade + r.tam(0, 4) * GUN, m: `${r.sec(["Kredi kartı", "Havale", "Nakit"])} ile ödendi` }] : [] });
      }
    }
  }

  // Haftalık program: her sınıfa üç hafta içi akşamı ve cumartesi; mezun sınıfı pazar da.
  const program: Kayit[] = [];
  let p = 0;
  SINIFLAR.forEach((c, ci) => {
    const gunler = [[0, 2, 4], [1, 3, 4], [0, 2, 3]][ci % 3];
    const dersler = BOLUMLER[c.seviye].map((x) => x[0]);
    let sira = ci;
    const ekle = (gun: number, saatNe: number) => {
      const ders = dersler[sira++ % dersler.length];
      program.push({ id: `p${++p}`, sinifId: c.id, ders, ogretmenId: ogretmenSec(ders, c.sube).id, gun, saat: saatNe });
    };
    for (const g of gunler) [17, 18.5].forEach((s) => ekle(g, s));
    [10, 11.5, 13.5].forEach((s) => ekle(5, s));
    if (c.id === "c6") [10, 11.5].forEach((s) => ekle(6, s));
  });

  // Bugünün oturumları: biten derslerin yoklaması alınmış, devam eden dersinki bekliyor.
  const gunNo = (ani.getDay() + 6) % 7;
  const oturumlar: Kayit[] = program
    .filter((x) => x.gun === gunNo)
    .map((x) => {
      const basT = bugun + x.saat * SAAT;
      const bitti = basT + OTURUM_SURESI * DAKIKA < simdi;
      const sinifOgr = ogrenciler.filter((o) => o.sinifId === x.sinifId);
      return {
        id: `y${x.id}`,
        programId: x.id,
        sinifId: x.sinifId,
        ders: x.ders,
        ogretmenId: x.ogretmenId,
        bas: basT,
        yoklama: bitti ? { gelmeyen: r.karistir(sinifOgr.map((o) => o.id)).slice(0, r.tam(0, 2)), gec: [], t: basT + 6 * DAKIKA } : null,
      };
    })
    .sort((a, b) => a.bas - b.bas);

  return { ogretmenler, ogrenciler, denemeler, taksitler, program, oturumlar };
}

/* ---------------- Parçalar ---------------- */

function OgrenciKarnesi({ o, api }: { o: Kayit; api: PanelApi }) {
  const sv = sinif(o.sinifId).seviye;
  const netler = sonNetler(o, api);
  const son = netler[netler.length - 1];
  return (
    <>
      <Bolum baslik="Net gidişi">
        {netler.length >= 2 ? (
          <CizgiGrafik noktalar={netler.map((x) => ({ etiket: x.d.ad.replace(`${sv} deneme `, "Deneme "), deger: x.net }))} bicim={(n) => `${sayi(n, 2)} net`} yukseklik={110} />
        ) : (
          <p className="text-[12.5px] text-[var(--ms)]">Grafik için en az iki deneme gerekir.</p>
        )}
      </Bolum>
      {son && (
        <Bolum baslik={`${son.d.ad}, ders ders`}>
          <MiniTablo
            basliklar={["Ders", "Doğru", "Yanlış", "Net"]}
            sagdakiler={[1, 2, 3]}
            satirlar={[
              ...BOLUMLER[sv].map(([ders, soru]) => {
                const x = o.sonuclar[son.d.id][ders] as [number, number];
                const n = dersNeti(x, sv);
                return [`${ders}, ${soru} soru`, x[0], x[1], <span style={{ color: n / soru < 0.4 ? RENK.kirmizi : undefined }}>{sayi(n, 2)}</span>];
              }),
              [<strong>Toplam</strong>, "", "", <strong>{sayi(son.net, 2)}</strong>],
            ]}
          />
          <p className="mt-2 text-[12px] leading-5 text-[var(--ms)]">{sv === "LGS" ? "LGS de üç yanlış bir doğruyu götürür." : "TYT de dört yanlış bir doğruyu götürür."} Kırmızı dersler sorularının yarısından azını netleyenler.</p>
        </Bolum>
      )}
    </>
  );
}

function Yoklama({ api, modul }: { api: PanelApi; modul: ModulBilgi }) {
  const s = api.ani.getTime();
  const oturumlar = api.veri.oturumlar;
  const ilkBekleyen = oturumlar.find((x) => !x.yoklama && x.bas <= s + 15 * DAKIKA) ?? oturumlar[0];
  const [secili, setSecili] = useState<string | null>(ilkBekleyen?.id ?? null);
  const [gelmeyen, setGelmeyen] = useState<Set<string>>(new Set());
  const [gec, setGec] = useState<Set<string>>(new Set());
  const ot = secili ? api.bul("oturumlar", secili) : null;
  const liste = ot ? api.veri.ogrenciler.filter((o) => o.sinifId === ot.sinifId) : [];
  const durum = (x: Kayit) => (x.yoklama ? { ad: "Yoklama alındı", renk: "yesil" as const } : x.bas > s ? { ad: "Başlamadı", renk: "gri" as const } : x.bas + OTURUM_SURESI * DAKIKA > s ? { ad: "Derste, yoklama bekliyor", renk: "sari" as const } : { ad: "Yoklama alınmadı", renk: "kirmizi" as const });
  const sec = (id: string) => {
    setSecili(id);
    const x = api.bul("oturumlar", id)!;
    setGelmeyen(new Set(x.yoklama?.gelmeyen ?? []));
    setGec(new Set(x.yoklama?.gec ?? []));
  };
  const degistir = (id: string) => {
    // Geldi, gelmedi, geç kaldı sırayla döner.
    if (gelmeyen.has(id)) {
      const g = new Set(gelmeyen);
      g.delete(id);
      setGelmeyen(g);
      setGec(new Set(gec).add(id));
    } else if (gec.has(id)) {
      const g = new Set(gec);
      g.delete(id);
      setGec(g);
    } else setGelmeyen(new Set(gelmeyen).add(id));
  };

  return (
    <>
      <EkranBasligi modul={modul} />
      {!oturumlar.length ? (
        <Kart className="p-8 text-center text-[13px] text-[var(--ms)]">Bugün programda ders yok.</Kart>
      ) : (
        <div className="grid gap-4 @3xl:grid-cols-[16rem_minmax(0,1fr)]">
          <Kart baslik="Bugünün dersleri">
            <ul className="divide-y divide-[var(--k)]">
              {oturumlar.map((x) => {
                const d = durum(x);
                return (
                  <li key={x.id}>
                    <button type="button" onClick={() => sec(x.id)} className={`flex w-full items-start gap-3 px-4 py-2.5 text-left transition-colors hover:bg-[var(--k2)] ${secili === x.id ? "bg-[var(--k2)]" : ""}`}>
                      <span className="w-11 shrink-0 pt-px text-[13px] font-semibold tabular-nums">{saat(x.bas)}</span>
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-[12.5px] font-medium">
                          {sinif(x.sinifId).ad}, {x.ders}
                        </span>
                        <span className="block truncate text-[11.5px] text-[var(--ms)]">{ogretmenAdi(api, x.ogretmenId)}</span>
                        <span className="mt-1 block">
                          <DurumYazi d={d} kucuk />
                        </span>
                      </span>
                    </button>
                  </li>
                );
              })}
            </ul>
          </Kart>
          {ot && (
            <Kart
              baslik={`${sinif(ot.sinifId).ad}, ${ot.ders}, ${saat(ot.bas)}`}
              sag={<span className="text-[12px] text-[var(--ms)]">{liste.length} öğrenci</span>}
            >
              <p className="border-b border-[var(--k)] px-4 py-2.5 text-[12px] leading-5 text-[var(--ms)]">
                Öğrenciye dokunun; geldi, gelmedi ve geç kaldı arasında döner. Kaydedince gelmeyenlerin velisine mesaj gider.
              </p>
              <ul className="grid grid-cols-1 gap-2 p-3 @xl:grid-cols-2 @6xl:grid-cols-3">
                {liste.map((o) => {
                  const d = gelmeyen.has(o.id) ? { ad: "Gelmedi", renk: "kirmizi" as const } : gec.has(o.id) ? { ad: "Geç kaldı", renk: "sari" as const } : { ad: "Geldi", renk: "yesil" as const };
                  return (
                    <li key={o.id}>
                      <button type="button" onClick={() => degistir(o.id)} className="flex w-full items-center gap-2.5 rounded-lg border border-[var(--k)] p-2 text-left transition-colors hover:bg-[var(--k2)]" style={{ borderColor: d.renk === "yesil" ? undefined : RENK[d.renk] }}>
                        <Harf metin={bas(o.ad)} renk={isimRengi(o.ad)} yumusak boy={28} />
                        <span className="min-w-0 flex-1 truncate text-[12.5px]">{o.ad}</span>
                        <DurumYazi d={d} kucuk />
                      </button>
                    </li>
                  );
                })}
              </ul>
              <div className="flex flex-wrap items-center justify-between gap-3 border-t border-[var(--k)] px-4 py-3">
                <span className="text-[12.5px] text-[var(--ms)]">
                  {liste.length - gelmeyen.size} geldi, {gelmeyen.size} gelmedi{gec.size ? `, ${gec.size} geç` : ""}
                </span>
                <Dugme
                  tur="ana"
                  ikon={IconCheck}
                  disabled={ot.bas > s + 15 * DAKIKA}
                  onClick={() => {
                    const once = new Set<string>(ot.yoklama?.gelmeyen ?? []);
                    api.guncelle("oturumlar", ot.id, { yoklama: { gelmeyen: [...gelmeyen], gec: [...gec], t: s } });
                    for (const id of gelmeyen) {
                      if (once.has(id)) continue;
                      const o = api.bul("ogrenciler", id)!;
                      api.guncelle("ogrenciler", id, { devamsizlik: o.devamsizlik + 1 }, `${sinif(ot.sinifId).ad} ${ot.ders} dersine gelmedi, veliye mesaj gitti`);
                    }
                    api.haber(gelmeyen.size ? `Yoklama kaydedildi. ${gelmeyen.size} veliye SMS gitti.` : "Yoklama kaydedildi, herkes derste.", "basari");
                    api.olay("yoklama");
                  }}
                >
                  {ot.bas > s + 15 * DAKIKA ? "Ders başlamadı" : ot.yoklama ? "Yoklamayı güncelle" : "Yoklamayı kaydet"}
                </Dugme>
              </div>
            </Kart>
          )}
        </div>
      )}
    </>
  );
}

const veliRaporu: Eylem = {
  ad: "Veliye rapor gönder",
  tur: "ana",
  ikon: IconSend,
  uygula: (o, api) => {
    api.guncelle("ogrenciler", o.id, {}, "Devamsızlık ve deneme raporu veliye gönderildi");
    api.haber(`${o.veli} için rapor WhatsApp ile gönderildi`, "basari");
    api.olay("veli-rapor");
  },
};

/* ---------------- Ekranlar ---------------- */

function sonDeneme(api: PanelApi, seviye: string) {
  return api.veri.denemeler.filter((d) => d.seviye === seviye).sort((a, b) => b.t - a.t)[0];
}
function denemeOrtalamasi(api: PanelApi, d: Kayit) {
  const n = api.veri.ogrenciler.filter((o) => o.sonuclar[d.id]).map((o) => netHesap(o.sonuclar[d.id], d.seviye));
  return { ort: n.reduce((t, x) => t + x, 0) / Math.max(1, n.length), katilim: n.length, enYuksek: Math.max(0, ...n), netler: n };
}

function uyarilar(api: PanelApi) {
  const liste: ReturnType<SektorPanel["uyarilar"]> = [];
  const s = api.ani.getTime();
  const yoklamasiz = api.veri.oturumlar.filter((x) => !x.yoklama && x.bas + 10 * DAKIKA < s).length;
  const karne = api.veri.denemeler.filter((d) => !d.karne).length;
  const devamsiz = api.veri.ogrenciler.filter((o) => o.devamsizlik >= 5).length;
  const dusen = api.veri.ogrenciler.filter((o) => ogrenciDurumu(o, api).ad === "Neti düşüyor").length;
  const geciken = api.veri.taksitler.filter((t) => !t.odendi && t.vade < gunBasi(s)).length;
  if (yoklamasiz) liste.push({ metin: `${yoklamasiz} dersin yoklaması alınmadı`, modul: "yoklama", renk: "kirmizi" });
  if (karne) liste.push({ metin: `${karne} denemenin karnesi velilere gönderilmedi`, modul: "denemeler", renk: "mavi" });
  if (devamsiz) liste.push({ metin: `${devamsiz} öğrencinin devamsızlığı beş günü geçti`, modul: "ogrenciler", filtre: "Durum=Devamsızlık yüksek", renk: "sari" });
  if (dusen) liste.push({ metin: `${dusen} öğrencinin neti son üç denemede düştü`, modul: "ogrenciler", filtre: "Durum=Neti düşüyor", renk: "mor" });
  if (geciken) liste.push({ metin: `${geciken} taksitin vadesi geçti`, modul: "odemeler", filtre: "Durum=Gecikti", renk: "kirmizi" });
  return liste;
}

const ozet = ozetEkrani({
  kullanici: KULLANICI.ad,
  uyarilar,
  karsilama: (api) => {
    const o = api.veri.oturumlar;
    return `Bugün ${o.length} ders var, ${o.filter((x) => x.yoklama).length} tanesinin yoklaması alındı.`;
  },
  sayilar: (api) => {
    const l = api.veri.ogrenciler;
    const tyt = api.veri.denemeler.filter((d) => d.seviye === "TYT").sort((a, b) => a.t - b.t);
    const ortalar = tyt.map((d) => denemeOrtalamasi(api, d).ort);
    const sonO = ortalar[ortalar.length - 1];
    const onceki = ortalar[ortalar.length - 2];
    const lgsO = denemeOrtalamasi(api, sonDeneme(api, "LGS")).ort;
    const devam = l.reduce((t, o) => t + o.devamsizlik, 0) / Math.max(1, l.length * 12);
    return [
      { ad: "Aktif öğrenci", deger: String(l.length), alt: `${l.filter((o) => sinif(o.sinifId).seviye === "LGS").length} LGS, ${l.filter((o) => sinif(o.sinifId).seviye === "TYT").length} YKS`, not: "Bu dönem kayıtlı öğrenciler.", git: () => api.git("ogrenciler") },
      { ad: "Son TYT ortalaması", deger: sayi(sonO, 1), birim: "net", degisim: { oran: ((sonO - onceki) / onceki) * 100, iyi: sonO >= onceki, metin: "bir önceki denemeye göre" }, not: "Son TYT denemesine giren öğrencilerin ortalama neti. Net, doğrudan yanlışın dörtte biri düşülerek bulunur.", git: () => api.git("denemeler"), seri: ortalar },
      { ad: "Son LGS ortalaması", deger: sayi(lgsO, 1), birim: "net", alt: "90 soru üzerinden", not: "Son LGS denemesine giren öğrencilerin ortalama neti. Üç yanlış bir doğruyu götürür.", git: () => api.git("denemeler") },
      { ad: "Devamsızlık, 30 gün", deger: sayi(devam * 100, 1), birim: "yüzde", alt: `${l.filter((o) => o.devamsizlik >= 5).length} öğrenci beş günü geçti`, not: "Son 30 günde öğrencilerin gelmediği ders günlerinin, toplam ders günlerine oranı.", renk: devam > 0.1 ? "sari" : undefined },
    ];
  },
  ana: {
    baslik: "Son TYT denemesinde net dağılımı",
    icerik: (api) => {
      const d = sonDeneme(api, "TYT");
      const { netler, ort } = denemeOrtalamasi(api, d);
      const araliklar = [0, 20, 30, 40, 50, 60, 70, 80, 90, 100];
      const veri = araliklar.slice(0, -1).map((a, i) => ({ etiket: `${a}`, uzunEtiket: `${a} ile ${araliklar[i + 1]} net arası`, deger: netler.filter((n) => n >= a && n < araliklar[i + 1]).length }));
      return <CubukGrafik veri={veri} bicim={(n) => `${n} öğrenci`} ozet={`${d.ad}, ${tarih(d.t)}, ortalama ${sayi(ort, 1)} net`} seriAdi="Öğrenci sayısı" />;
    },
  },
  parcalar: [
    {
      baslik: "Bugünün dersleri",
      icerik: (api) => {
        const s = api.ani.getTime();
        if (!api.veri.oturumlar.length) return <p className="text-[12.5px] text-[var(--ms)]">Bugün ders yok.</p>;
        return (
          <ul className="divide-y divide-[var(--k)]">
            {api.veri.oturumlar.slice(0, 7).map((x) => (
              <li key={x.id}>
                <button type="button" onClick={() => api.git("yoklama")} className="flex w-full items-center gap-3 py-2 text-left hover:text-[var(--p)]">
                  <span className="w-11 shrink-0 text-[13px] font-semibold tabular-nums">{saat(x.bas)}</span>
                  <span className="min-w-0 flex-1 truncate text-[12.5px]">
                    {sinif(x.sinifId).ad}, {x.ders}
                  </span>
                  <DurumYazi d={x.yoklama ? { ad: "Alındı", renk: "yesil" } : x.bas > s ? { ad: "Bekliyor", renk: "gri" } : { ad: "Alınmadı", renk: "kirmizi" }} kucuk />
                </button>
              </li>
            ))}
          </ul>
        );
      },
    },
    {
      baslik: "Devamsızlığı en yüksek öğrenciler",
      icerik: (api) => (
        <ul className="space-y-2.5">
          {[...api.veri.ogrenciler]
            .sort((a, b) => b.devamsizlik - a.devamsizlik)
            .slice(0, 6)
            .map((o) => (
              <li key={o.id}>
                <button type="button" onClick={() => api.git("ogrenciler", { kayit: o.id })} className="flex w-full items-center gap-2.5 text-left">
                  <Harf metin={bas(o.ad)} renk={isimRengi(o.ad)} yumusak boy={26} />
                  <span className="min-w-0 flex-1">
                    <span className="flex justify-between gap-2 text-[12.5px]">
                      <span className="truncate">{o.ad}</span>
                      <span className="shrink-0 tabular-nums text-[var(--ms)]">{o.devamsizlik} gün</span>
                    </span>
                    <Cubuk oran={o.devamsizlik / 10} ince renk={o.devamsizlik >= 5 ? "var(--kirmizi)" : "var(--sari)"} />
                  </span>
                </button>
              </li>
            ))}
        </ul>
      ),
    },
  ],
});

const panel: SektorPanel = {
  saat: { acilis: 9, kapanis: 21, yogun: 17.5 },
  kullanici: KULLANICI,
  uret,
  uyarilar,
  moduller: [
    { id: "ozet", grup: "Genel", ekran: ozet },
    {
      id: "ogrenciler",
      grup: "Öğrenci",
      ekran: {
        tur: "liste",
        koleksiyon: "ogrenciler",
        baslikAdi: "Öğrenci",
        baslik: (o) => o.ad,
        alt: (o) => `${sinif(o.sinifId).ad}, ${o.okul}`,
        harf: (o) => o.ad,
        durum: ogrenciDurumu,
        arama: (o) => `${o.veli} ${o.veliTel} ${o.okul} ${o.hedef}`,
        sutunlar: [
          { ad: "Sınıf", deger: (o) => sinif(o.sinifId).ad, sirala: (o) => o.sinifId, oncelik: 2 },
          {
            ad: "Son net",
            deger: (o, api) => {
              const n = sonNetler(o, api);
              return n.length ? sayi(n[n.length - 1].net, 1) : "Girmedi";
            },
            hiza: "sag",
            oncelik: 1,
          },
          { ad: "Devamsızlık", deger: (o) => `${o.devamsizlik} gün`, sirala: (o) => o.devamsizlik, hiza: "sag", oncelik: 1 },
          { ad: "Hedef", deger: (o) => o.hedef, oncelik: 3 },
        ],
        filtreler: [
          { ad: "Sınıf", secenekler: SINIFLAR.map((c) => ({ ad: c.ad, kosul: (o: Kayit) => o.sinifId === c.id })) },
          { ad: "Durum", secenekler: ["Normal", "Devamsızlık yüksek", "Neti düşüyor", "Ödeme gecikti"].map((d) => ({ ad: d, kosul: (o: Kayit, api: PanelApi) => ogrenciDurumu(o, api).ad === d })) },
          { ad: "Şube", secenekler: ["Çankaya", "Keçiören"].map((x) => ({ ad: x, kosul: (o: Kayit) => o.sube === x })) },
        ],
        detay: {
          bolumler: (o, api) => {
            const tk = api.veri.taksitler.filter((t) => t.ogrenciId === o.id);
            return (
              <>
                <Bolum baslik="Öğrenci">
                  <AlanListesi alanlar={[["Sınıf", sinif(o.sinifId).ad], ["Şube", o.sube], ["Okul", o.okul], ["Hedef", o.hedef], ["Veli", o.veli], ["Veli telefonu", o.veliTel], ["Devamsızlık, 30 gün", `${o.devamsizlik} gün`], ["Kayıt", tarih(o.kayit)]]} />
                </Bolum>
                <OgrenciKarnesi o={o} api={api} />
                <Bolum baslik="Taksitler">
                  <p className="text-[12.5px]">
                    {tk.filter((t) => t.odendi).length} ödendi, {tk.filter((t) => !t.odendi).length} kaldı. Kalan {tl(tk.filter((t) => !t.odendi).reduce((a, t) => a + t.tutar, 0))}.
                  </p>
                </Bolum>
                <Bolum baslik="Geçmiş">
                  <Gecmis satirlar={o.gecmis.map((g: Kayit) => ({ zaman: zaman(g.t, api.ani), metin: g.m }))} />
                </Bolum>
              </>
            );
          },
          eylemler: [
            veliRaporu,
            {
              ad: "Rehberlik görüşmesi planla",
              ikon: IconClock,
              uygula: (o, api) => {
                api.guncelle("ogrenciler", o.id, {}, "Rehberlik görüşmesi yarın 16.00 için planlandı");
                api.haber("Görüşme planlandı, veliye bilgi gitti", "basari");
              },
            },
          ],
        },
        yeni: {
          baslik: "Yeni öğrenci",
          dugme: "Kaydet",
          alanlar: [
            { ad: "Öğrenci adı", anahtar: "ad", tur: "metin", varsayilan: "Ece Toprak", zorunlu: true },
            { ad: "Sınıf", anahtar: "sinif", tur: "secim", secenekler: SINIFLAR.map((c) => c.ad) },
            { ad: "Veli adı", anahtar: "veli", tur: "metin", varsayilan: "Murat Toprak" },
            { ad: "Veli telefonu", anahtar: "tel", tur: "metin", varsayilan: "0532 418 22 90" },
            { ad: "Taksit sayısı", anahtar: "taksit", tur: "secim", secenekler: ["9", "6", "1"] },
          ],
          olustur: (d, api) => {
            const s = api.ani.getTime();
            const c = SINIFLAR.find((x) => x.ad === d.sinif) ?? SINIFLAR[0];
            const id = api.yeniId("o");
            const adet = Number(d.taksit) || 9;
            api.ekle("ogrenciler", { id, ad: d.ad.trim() || "Yeni öğrenci", sinifId: c.id, sube: c.sube, veli: d.veli, veliTel: d.tel, okul: "Girilmedi", hedef: "Girilmedi", devamsizlik: 0, sonuclar: {}, kayit: s, gecmis: [{ t: s, m: `Kaydedildi, ${KULLANICI.ad}` }] });
            for (let j = 0; j < adet; j++) api.ekle("taksitler", { id: `${id}k${j + 1}`, ogrenciId: id, no: j + 1, adet, tutar: Math.round(PAKET[c.seviye] / adet / 10) * 10, vade: gunBasi(s) + j * 30 * GUN, odendi: false, gecmis: [] }, false);
            api.haber(`Kayıt tamam. ${adet} taksit planı oluştu, veliye hoş geldin mesajı gitti.`, "basari");
            api.olay("yeni-ogrenci");
            return id;
          },
        },
      },
    },
    { id: "yoklama", grup: "Öğrenci", rozet: (api) => api.veri.oturumlar.filter((x) => !x.yoklama && x.bas + 10 * DAKIKA < api.ani.getTime()).length, ekran: { tur: "ozel", bilesen: Yoklama } },
    {
      id: "denemeler",
      grup: "Öğrenci",
      rozet: (api) => api.veri.denemeler.filter((d) => !d.karne).length,
      ekran: {
        tur: "liste",
        koleksiyon: "denemeler",
        baslikAdi: "Deneme",
        baslik: (d) => d.ad,
        alt: (d) => `${tarihYil(d.t)}, ${d.seviye === "LGS" ? "90" : "120"} soru`,
        durum: (d) => (d.karne ? { ad: "Karneler gönderildi", renk: "yesil" } : { ad: "Karne bekliyor", renk: "mavi" }),
        arama: (d) => d.seviye,
        sira: (a, b) => b.t - a.t,
        sutunlar: [
          { ad: "Katılım", deger: (d, api) => `${denemeOrtalamasi(api, d).katilim} öğrenci`, oncelik: 2 },
          { ad: "Ortalama", deger: (d, api) => `${sayi(denemeOrtalamasi(api, d).ort, 1)} net`, hiza: "sag", oncelik: 1 },
          { ad: "En yüksek", deger: (d, api) => `${sayi(denemeOrtalamasi(api, d).enYuksek, 1)} net`, hiza: "sag", oncelik: 2 },
        ],
        filtreler: [{ ad: "Seviye", secenekler: ["LGS", "TYT"].map((x) => ({ ad: x, kosul: (d: Kayit) => d.seviye === x })) }],
        detay: {
          bolumler: (d, api) => {
            const katilanlar = api.veri.ogrenciler.filter((o) => o.sonuclar[d.id]).map((o) => ({ o, net: netHesap(o.sonuclar[d.id], d.seviye) })).sort((a, b) => b.net - a.net);
            return (
              <>
                <Bolum baslik="Ders ortalamaları">
                  <MiniTablo
                    basliklar={["Ders", "Soru", "Ortalama net", "Başarı"]}
                    sagdakiler={[1, 2, 3]}
                    satirlar={BOLUMLER[d.seviye].map(([ders, soru]) => {
                      const ort = katilanlar.reduce((t, x) => t + dersNeti(x.o.sonuclar[d.id][ders], d.seviye), 0) / Math.max(1, katilanlar.length);
                      return [ders, soru, sayi(ort, 1), yuzde((ort / soru) * 100)];
                    })}
                  />
                </Bolum>
                <Bolum baslik="İlk beş">
                  <ol className="space-y-1.5">
                    {katilanlar.slice(0, 5).map((x, i) => (
                      <li key={x.o.id}>
                        <button type="button" onClick={() => api.git("ogrenciler", { kayit: x.o.id })} className="flex w-full justify-between gap-3 text-left text-[12.5px] hover:text-[var(--p)]">
                          <span>
                            {i + 1}. {x.o.ad}, {sinif(x.o.sinifId).ad}
                          </span>
                          <span className="tabular-nums">{sayi(x.net, 2)}</span>
                        </button>
                      </li>
                    ))}
                  </ol>
                </Bolum>
              </>
            );
          },
          eylemler: [
            {
              ad: "Karneleri velilere gönder",
              tur: "ana",
              ikon: IconSend,
              gorunur: (d) => !d.karne,
              uygula: (d, api) => {
                const n = api.veri.ogrenciler.filter((o) => o.sonuclar[d.id]).length;
                api.guncelle("denemeler", d.id, { karne: true });
                api.haber(`${n} veliye karne bağlantısı gönderildi. Her veli yalnız kendi çocuğunun sonucunu görür.`, "basari");
                api.olay("karne");
              },
            },
          ],
        },
      },
    },
    {
      id: "odemeler",
      grup: "Finans",
      rozet: (api) => api.veri.taksitler.filter((t) => !t.odendi && t.vade < gunBasi(api.ani)).length,
      ekran: {
        tur: "liste",
        koleksiyon: "taksitler",
        baslikAdi: "Öğrenci",
        kapsam: (t, api) => t.odendi ? t.vade > api.ani.getTime() - 60 * GUN : t.vade < api.ani.getTime() + 40 * GUN,
        baslik: (t, api) => ogrenciAdi(api, t.ogrenciId),
        alt: (t) => `${t.no}. taksit, ${t.adet} taksitin`,
        harf: (t, api) => ogrenciAdi(api, t.ogrenciId),
        durum: (t, api) => (t.odendi ? { ad: "Ödendi", renk: "yesil" } : t.vade < gunBasi(api.ani) ? { ad: `${Math.floor((gunBasi(api.ani) - t.vade) / GUN)} gün gecikti`, renk: "kirmizi" } : { ad: "Bekliyor", renk: "gri" }),
        arama: (t, api) => api.bul("ogrenciler", t.ogrenciId)?.veli ?? "",
        sira: (a, b) => (a.odendi ? 1 : 0) - (b.odendi ? 1 : 0) || a.vade - b.vade,
        sutunlar: [
          { ad: "Vade", deger: (t) => tarih(t.vade), sirala: (t) => t.vade, oncelik: 1 },
          { ad: "Tutar", deger: (t) => tl(t.tutar), sirala: (t) => t.tutar, csv: (t) => t.tutar, hiza: "sag", oncelik: 1 },
          { ad: "Veli", deger: (t, api) => api.bul("ogrenciler", t.ogrenciId)?.veli, oncelik: 3 },
        ],
        filtreler: [
          {
            ad: "Durum",
            secenekler: [
              { ad: "Gecikti", kosul: (t, api) => !t.odendi && t.vade < gunBasi(api.ani) },
              { ad: "Ödenmedi", kosul: (t) => !t.odendi },
              { ad: "Ödendi", kosul: (t) => t.odendi },
            ],
          },
        ],
        ozet: (api) => {
          const l = api.veri.taksitler;
          const s = gunBasi(api.ani);
          return [
            { ad: "Geciken", deger: tlKisa(l.filter((t) => !t.odendi && t.vade < s).reduce((a, t) => a + t.tutar, 0)), renk: "kirmizi" },
            { ad: "Bu ay gelecek", deger: tlKisa(l.filter((t) => !t.odendi && t.vade >= s && t.vade < s + 30 * GUN).reduce((a, t) => a + t.tutar, 0)) },
            { ad: "Tahsil edilen, 30 gün", deger: tlKisa(l.filter((t) => t.odendi && t.vade > s - 30 * GUN).reduce((a, t) => a + t.tutar, 0)), renk: "yesil" },
            { ad: "Dönem toplamı", deger: tlKisa(l.reduce((a, t) => a + t.tutar, 0)) },
          ];
        },
        detay: {
          bolumler: (t, api) => {
            const o = api.bul("ogrenciler", t.ogrenciId)!;
            return (
              <>
                <Bolum
                  baslik="Taksit"
                  sag={
                    <button type="button" onClick={() => api.git("ogrenciler", { kayit: o.id })} className="text-[12px] font-semibold text-[var(--p)] hover:underline">
                      Öğrenciyi aç
                    </button>
                  }
                >
                  <AlanListesi alanlar={[["Öğrenci", o.ad], ["Veli", o.veli], ["Veli telefonu", o.veliTel], ["Taksit", `${t.no}. taksit, toplam ${t.adet}`], ["Vade", tarihYil(t.vade)], ["Tutar", tl(t.tutar)]]} />
                </Bolum>
                <Bolum baslik="Geçmiş">
                  <Gecmis satirlar={[...t.gecmis].reverse().map((g: Kayit) => ({ zaman: zaman(g.t, api.ani), metin: g.m }))} />
                </Bolum>
              </>
            );
          },
          eylemler: [
            {
              ad: "Ödeme al",
              tur: "ana",
              ikon: IconCheck,
              gorunur: (t) => !t.odendi,
              uygula: (t, api) => {
                api.guncelle("taksitler", t.id, { odendi: true, gecmis: [...t.gecmis, { t: api.ani.getTime(), m: `Kredi kartı ile ödendi, ${KULLANICI.ad}` }] });
                api.haber(`${tl(t.tutar)} tahsil edildi, veliye makbuz gitti`, "basari");
                api.olay("odeme");
              },
            },
            {
              ad: "Veliye hatırlat",
              ikon: IconSend,
              gorunur: (t, api) => !t.odendi && t.vade < gunBasi(api.ani),
              uygula: (t, api) => {
                api.guncelle("taksitler", t.id, { gecmis: [...t.gecmis, { t: api.ani.getTime(), m: "Veliye ödeme bağlantısıyla hatırlatma gönderildi" }] });
                api.haber("Veliye kartla ödeme bağlantısı gönderildi", "basari");
              },
            },
          ],
        },
      },
    },
    {
      id: "ogretmenler",
      grup: "Kurum",
      ekran: {
        tur: "liste",
        koleksiyon: "ogretmenler",
        baslikAdi: "Öğretmen",
        baslik: (t) => t.ad,
        alt: (t) => `${t.brans}, ${t.sube}`,
        harf: (t) => t.ad,
        arama: (t) => `${t.brans} ${t.sube}`,
        sutunlar: [
          { ad: "Haftalık ders", deger: (t, api) => `${api.veri.program.filter((p) => p.ogretmenId === t.id).length} saat`, hiza: "sag", oncelik: 1 },
          { ad: "Sınıflar", deger: (t, api) => [...new Set(api.veri.program.filter((p) => p.ogretmenId === t.id).map((p) => sinif(p.sinifId).ad))].join(", "), oncelik: 3 },
          { ad: "Aylık hakediş", deger: (t, api) => tl(api.veri.program.filter((p) => p.ogretmenId === t.id).length * 4.3 * DERS_UCRETI), hiza: "sag", oncelik: 1 },
        ],
        filtreler: [{ ad: "Şube", secenekler: ["Çankaya", "Keçiören"].map((x) => ({ ad: x, kosul: (t: Kayit) => t.sube === x })) }],
        detay: {
          bolumler: (t, api) => {
            const dersler = api.veri.program.filter((p) => p.ogretmenId === t.id).sort((a, b) => a.gun - b.gun || a.saat - b.saat);
            return (
              <>
                <Bolum baslik="Haftalık program">
                  <MiniTablo basliklar={["Gün", "Saat", "Sınıf", "Ders"]} satirlar={dersler.map((p) => [GUN_KISA[(p.gun + 1) % 7], `${iki(Math.floor(p.saat))}.${iki(Math.round((p.saat % 1) * 60))}`, sinif(p.sinifId).ad, p.ders])} />
                </Bolum>
                <Bolum baslik="Hakediş">
                  <p className="text-[12.5px] leading-5">
                    Haftada {dersler.length} ders saati, ayda yaklaşık {Math.round(dersler.length * 4.3)} saat. Ders saati {tl(DERS_UCRETI)}, aylık {tl(dersler.length * 4.3 * DERS_UCRETI)}.
                  </p>
                </Bolum>
              </>
            );
          },
        },
      },
    },
  ],
  arama: [
    { koleksiyon: "ogrenciler", modul: "ogrenciler", baslik: (o) => o.ad, alt: (o) => `${sinif(o.sinifId).ad}, veli ${o.veli}`, metin: (o) => `${o.veli} ${o.veliTel}` },
    { koleksiyon: "ogretmenler", modul: "ogretmenler", baslik: (t) => t.ad, alt: (t) => t.brans, metin: (t) => t.sube },
  ],
  gorevler: [
    { id: "g1", metin: "Bugünkü bir dersin yoklamasını alın", ipucu: "Yoklama ekranında sarı ya da kırmızı bir dersi seçin, birkaç öğrenciyi gelmedi yapın.", modul: "yoklama", olay: "yoklama" },
    { id: "g2", metin: "Bir öğrencinin velisine rapor gönderin", ipucu: "Öğrenciler ekranında devamsızlığı yüksek bir öğrenciyi açın.", modul: "ogrenciler", olay: "veli-rapor" },
    { id: "g3", metin: "Son denemenin karnelerini gönderin", ipucu: "Deneme sınavlarında karnesi bekleyen denemeyi açın.", modul: "denemeler", olay: "karne" },
    { id: "g4", metin: "Geciken bir taksiti tahsil edin", ipucu: "Taksitler ekranında durum süzgecinden Gecikti seçin.", modul: "odemeler", olay: "odeme" },
    { id: "g5", metin: "Yeni bir öğrenci kaydedin", ipucu: "Öğrenciler ekranındaki Yeni öğrenci düğmesi. Taksit planı kendiliğinden oluşur.", modul: "ogrenciler", olay: "yeni-ogrenci" },
  ],
  canli: {
    aralik: 42_000,
    uret: (api, r) => {
      const o = r.sec(api.veri.ogrenciler);
      api.guncelle("ogrenciler", o.id, {}, `Veli ${o.veli} mesaj attı, öğrenci bugün hasta olduğu için gelemeyecek`);
      api.bildir(`${o.veli} bildirdi, ${o.ad} bugün derse gelemeyecek`, "ogrenciler", o.id);
    },
  },
};

export default panel;
export { bilgi };
