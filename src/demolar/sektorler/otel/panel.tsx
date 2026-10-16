/*
 * Butik otel demosu: Mavi Koy Butik Otel. Rezervasyonlar odaya ve geceye
 * bağlıdır; aynı odanın aynı gecesine ikinci rezervasyon girilemez. Giriş
 * saati 14.00, çıkış saati 12.00; çıkış yapılan oda kirli olur.
 */
import { useState } from "react";
import { IconBrush, IconCheck, IconDoorEnter, IconDoorExit, IconSend, IconTool, IconX } from "@tabler/icons-react";
import { otel as bilgi } from "./bilgi";
import { ozetEkrani } from "../../panel/Ozet";
import { Cekmece, EkranBasligi } from "../../panel/Liste";
import { AlanListesi, Bolum, Dugme, DurumYazi, Gecmis, Harf, Kart, MiniTablo, RENK, isimRengi } from "../../panel/parcalar";
import { CubukGrafik, HalkaGrafik } from "../../panel/grafik";
import { GUN, GUNLER, GUN_KISA, SAAT, bas, gunAdi, gunBasi, kisiler, sayi, tarih, tarihYil, tl, tlKisa, yuzde, zaman } from "../../ortak";
import type { Durum, Kayit, ModulBilgi, PanelApi, Rastgele, SektorPanel, Veri } from "../../tipler";

const KULLANICI = { ad: "Deniz Uçar", rol: "Otel müdürü" };
const ODALAR: [string, string, number, number][] = [
  ["101", "Standart", 2, 4200],
  ["102", "Standart", 2, 4200],
  ["103", "Standart", 2, 4200],
  ["104", "Deniz manzaralı", 2, 5400],
  ["105", "Deniz manzaralı", 2, 5400],
  ["106", "Deniz manzaralı", 3, 5800],
  ["201", "Deluxe", 2, 6800],
  ["202", "Deluxe", 2, 6800],
  ["203", "Deluxe", 3, 7200],
  ["204", "Deluxe", 2, 6800],
  ["205", "Deniz manzaralı", 2, 5400],
  ["206", "Deniz manzaralı", 2, 5400],
  ["207", "Standart", 2, 4200],
  ["208", "Standart", 3, 4600],
  ["301", "Suit", 4, 9500],
  ["302", "Suit", 4, 9800],
];
const KANALLAR: Record<string, { komisyon: number; renk: string }> = {
  Booking: { komisyon: 0.15, renk: "mavi" },
  Expedia: { komisyon: 0.18, renk: "mor" },
  "Kendi sitesi": { komisyon: 0.025, renk: "yesil" },
  Telefon: { komisyon: 0, renk: "sari" },
  Acente: { komisyon: 0.2, renk: "vurgu" },
};
const KANAL_ADLARI = Object.keys(KANALLAR);
const ULKELER = ["Türkiye", "Türkiye", "Türkiye", "Türkiye", "Almanya", "İngiltere", "Hollanda", "Rusya", "Fransa"];
const GIRIS = 14;
const CIKIS = 12;
const GOSTER = 14;

/* ---------------- Hesaplar ---------------- */

const REZ_DURUMU: Record<string, Durum> = {
  onayli: { ad: "Onaylı", renk: "mavi" },
  konakliyor: { ad: "Konaklıyor", renk: "yesil" },
  cikti: { ad: "Çıkış yaptı", renk: "gri" },
  iptal: { ad: "İptal", renk: "gri" },
  gelmedi: { ad: "Gelmedi", renk: "kirmizi" },
};
const cikisGunu = (r: Kayit) => r.giris + r.gece * GUN;
const aktifRez = (r: Kayit) => !["iptal", "gelmedi"].includes(r.durum);
const misafirAdi = (api: PanelApi, id: string) => api.bul("misafirler", id)?.ad ?? "Misafir";
const odaNo = (api: PanelApi, id: string) => api.bul("odalar", id)?.no ?? "";
/** O gecede dolu oda sayısı; gece, gelinen günün akşamıdır. */
const doluOda = (api: PanelApi, gece: number) => api.veri.rezervasyonlar.filter((r) => aktifRez(r) && r.giris <= gece && cikisGunu(r) > gece).length;
const odaBos = (api: PanelApi, odaId: string, giris: number, gece: number, haric?: string) =>
  !api.veri.rezervasyonlar.some((r) => r.id !== haric && r.odaId === odaId && aktifRez(r) && r.giris < giris + gece * GUN && cikisGunu(r) > giris);

const TEMIZLIK: Record<string, Durum> = {
  temiz: { ad: "Temiz", renk: "yesil" },
  kirli: { ad: "Kirli", renk: "kirmizi" },
  temizleniyor: { ad: "Temizleniyor", renk: "sari" },
  ariza: { ad: "Arızalı", renk: "mor" },
};

/* ---------------- Veri üretimi ---------------- */

function uret(ani: Date, r: Rastgele): Veri {
  const simdi = ani.getTime();
  const bugun = gunBasi(simdi);
  const saatNe = ani.getHours() + ani.getMinutes() / 60;
  const odalar: Kayit[] = ODALAR.map(([no, tip, kapasite, fiyat]) => ({ id: `o${no}`, no, tip, kapasite, fiyat, temizlik: "temiz", gecmis: [] }));
  const kisi = kisiler(r, 260);
  const misafirler: Kayit[] = kisi.map((k, i) => ({
    id: `m${i + 1}`,
    ad: k.tamAd,
    telefon: k.telefon,
    eposta: k.eposta,
    ulke: r.sec(ULKELER),
    onceki: r.olasilik(0.18) ? r.tam(1, 4) : 0,
    not: r.agirlikli([["", 80], ["Glutensiz kahvaltı istiyor", 4], ["Yıl dönümü, odaya çiçek", 4], ["Erken giriş rica ediyor", 6], ["Sessiz oda tercih ediyor", 6]] as const),
    gecmis: [],
  }));

  const rezervasyonlar: Kayit[] = [];
  let no = 5100;
  for (const oda of odalar) {
    let gun = bugun - 34 * GUN + r.tam(0, 3) * GUN;
    while (gun < bugun + 45 * GUN) {
      const ileri = (gun - bugun) / GUN;
      // Yakın gecelerde doluluk yüksek, uzak gecelerde rezervasyon henüz az.
      const dolulukOlasiligi = ileri < 0 ? 0.82 : ileri < 14 ? 0.8 : ileri < 30 ? 0.55 : 0.3;
      if (!r.olasilik(dolulukOlasiligi)) {
        gun += GUN * r.tam(1, 2);
        continue;
      }
      const gece = r.agirlikli([[1, 12], [2, 22], [3, 24], [4, 16], [5, 10], [7, 12]] as const);
      const kanal = r.agirlikli([["Booking", 38], ["Expedia", 12], ["Kendi sitesi", 22], ["Telefon", 14], ["Acente", 14]] as const);
      const m = r.sec(misafirler);
      const hs = new Date(gun).getDay();
      const fiyat = Math.round((oda.fiyat * (hs === 5 || hs === 6 ? 1.15 : 1) * (kanal === "Acente" ? 0.88 : 1)) / 50) * 50;
      const olusma = gun - r.tam(2, 60) * GUN;
      const cikis = gun + gece * GUN;
      let durum: string;
      if (cikis < bugun || (cikis === bugun && saatNe >= CIKIS - 0.5 && r.olasilik(Math.min(1, (saatNe - CIKIS + 1) / 1.5)))) durum = "cikti";
      else if (gun < bugun || (gun === bugun && saatNe >= GIRIS && r.olasilik(Math.min(0.9, (saatNe - GIRIS + 0.5) / 4)))) durum = "konakliyor";
      else durum = "onayli";
      if (olusma < bugun && r.olasilik(0.04)) durum = gun < bugun ? "gelmedi" : "iptal";
      rezervasyonlar.push({
        id: `R${++no}`,
        odaId: oda.id,
        misafirId: m.id,
        giris: gun,
        gece,
        kisi: Math.min(oda.kapasite, r.tam(1, oda.kapasite)),
        kanal,
        fiyat,
        toplam: fiyat * gece,
        ekstra: durum === "konakliyor" || durum === "cikti" ? r.sec([0, 0, 380, 640, 1250, 2100]) : 0,
        odenen: kanal === "Kendi sitesi" || kanal === "Acente" ? fiyat * gece : durum === "cikti" ? fiyat * gece : Math.round(fiyat * (r.olasilik(0.5) ? 1 : 0)),
        t: Math.min(olusma, simdi - SAAT),
        durum,
        gecmis: [{ t: Math.min(olusma, simdi - SAAT), m: `${kanal} üzerinden rezervasyon` }],
      });
      gun = cikis + (r.olasilik(0.3) ? r.tam(1, 2) * GUN : 0);
    }
  }
  // Numaralar rezervasyonun alındığı sıraya göre.
  rezervasyonlar.sort((a, b) => a.t - b.t).forEach((x, i) => (x.id = `R${5100 + i + 1}`));

  // Bugün çıkış yapan odaların bir kısmı henüz temizlenmedi; bir oda arızalı.
  for (const x of rezervasyonlar.filter((y) => y.durum === "cikti" && cikisGunu(y) === bugun)) {
    const oda = odalar.find((o) => o.id === x.odaId)!;
    oda.temizlik = r.agirlikli([["temiz", 45], ["kirli", 35], ["temizleniyor", 20]] as const);
  }
  r.sec(odalar.filter((o) => o.temizlik === "temiz")).temizlik = "ariza";

  for (const m of misafirler) {
    const kendi = rezervasyonlar.filter((x) => x.misafirId === m.id && aktifRez(x));
    m.konaklama = m.onceki + kendi.filter((x) => x.durum === "cikti").length;
  }
  return { odalar, misafirler, rezervasyonlar: rezervasyonlar.reverse() };
}

/* ---------------- Rezervasyon parçaları ---------------- */

function RezervasyonBilgisi({ x, api }: { x: Kayit; api: PanelApi }) {
  const m = api.bul("misafirler", x.misafirId)!;
  const oda = api.bul("odalar", x.odaId)!;
  const komisyon = x.toplam * KANALLAR[x.kanal].komisyon;
  return (
    <>
      <Bolum baslik="Konaklama">
        <AlanListesi
          alanlar={[
            ["Oda", `${oda.no}, ${oda.tip.toLocaleLowerCase("tr")}`],
            ["Kişi", `${x.kisi} kişi`],
            ["Giriş", `${tarih(x.giris, true)} ${GUNLER[new Date(x.giris).getDay()]}, 14.00`],
            ["Çıkış", `${tarih(cikisGunu(x), true)} ${GUNLER[new Date(cikisGunu(x)).getDay()]}, 12.00`],
            ["Gece", `${x.gece} gece`],
            ["Kanal", x.kanal],
          ]}
        />
      </Bolum>
      <Bolum
        baslik="Misafir"
        sag={
          <button type="button" onClick={() => api.git("misafirler", { kayit: m.id })} className="text-[12px] font-semibold text-[var(--p)] hover:underline">
            Misafir kartı
          </button>
        }
      >
        <AlanListesi alanlar={[["Ad", m.ad], ["Ülke", m.ulke], ["Telefon", m.telefon], ["Önceki konaklama", m.konaklama ? `${m.konaklama} kez` : "İlk gelişi"]]} />
        {m.not && <p className="mt-3 rounded-lg bg-[var(--k2)] p-3 text-[12.5px]" style={{ color: RENK.sari }}>Not. {m.not}.</p>}
      </Bolum>
      <Bolum baslik="Hesap">
        <MiniTablo
          basliklar={["Kalem", "Tutar"]}
          sagdakiler={[1]}
          satirlar={[
            [`${x.gece} gece, gecelik ${tl(x.fiyat)}`, tl(x.toplam)],
            ...(x.ekstra ? [["Restoran ve minibar", tl(x.ekstra)]] : []),
            ["Ödenen", tl(x.odenen)],
            [<strong>Kalan</strong>, <strong>{tl(Math.max(0, x.toplam + x.ekstra - x.odenen))}</strong>],
            [<span className="text-[var(--ms)]">Kanal komisyonu</span>, <span className="text-[var(--ms)]">{tl(komisyon)}</span>],
          ]}
        />
      </Bolum>
      <Bolum baslik="Geçmiş">
        <Gecmis satirlar={x.gecmis.map((g: Kayit) => ({ zaman: zaman(g.t, api.ani), metin: g.m }))} />
      </Bolum>
    </>
  );
}

const girisYap = (x: Kayit, api: PanelApi) => {
  const oda = api.bul("odalar", x.odaId)!;
  if (oda.temizlik !== "temiz") {
    api.haber(`Oda ${oda.no} henüz hazır değil, durumu ${TEMIZLIK[oda.temizlik].ad.toLocaleLowerCase("tr")}. Önce kat hizmetlerinden temizlenmeli.`, "uyari");
    return;
  }
  api.guncelle("rezervasyonlar", x.id, { durum: "konakliyor" }, `Giriş yapıldı, oda ${oda.no}, ${KULLANICI.ad}`);
  api.haber(`${misafirAdi(api, x.misafirId)} oda ${oda.no} için giriş yaptı. Kimlik bildirimi hazırlandı.`, "basari");
  api.olay("giris");
};
const cikisYap = (x: Kayit, api: PanelApi) => {
  const oda = api.bul("odalar", x.odaId)!;
  const kalan = Math.max(0, x.toplam + x.ekstra - x.odenen);
  api.guncelle("rezervasyonlar", x.id, { durum: "cikti", odenen: x.toplam + x.ekstra }, `Çıkış yapıldı${kalan ? `, ${tl(kalan)} tahsil edildi` : ""}`);
  api.guncelle("odalar", oda.id, { temizlik: "kirli" }, "Çıkış sonrası temizlik bekliyor");
  api.haber(`Çıkış tamam${kalan ? `, ${tl(kalan)} tahsil edildi` : ""}. Oda ${oda.no} kat hizmetlerine kirli olarak düştü.`, "basari");
  api.olay("cikis");
};

function YeniRezervasyon({ api, odaId, giris, kapat }: { api: PanelApi; odaId: string; giris: number; kapat: () => void }) {
  const oda = api.bul("odalar", odaId)!;
  const [gece, setGece] = useState(2);
  const [ad, setAd] = useState("");
  const [kanal, setKanal] = useState("Telefon");
  const bos = odaBos(api, odaId, giris, gece);
  const hs = new Date(giris).getDay();
  const fiyat = Math.round((oda.fiyat * (hs === 5 || hs === 6 ? 1.15 : 1)) / 50) * 50;
  return (
    <>
      <header className="flex items-start justify-between gap-3 border-b border-[var(--k)] px-5 py-4">
        <div>
          <h3 className="text-[17px] font-bold">Yeni rezervasyon</h3>
          <p className="mt-0.5 text-[12.5px] text-[var(--ms)]">
            Oda {oda.no}, {oda.tip.toLocaleLowerCase("tr")}, {tarih(giris, true)} girişli
          </p>
        </div>
        <button type="button" onClick={kapat} aria-label="Kapat" className="flex h-8 w-8 items-center justify-center rounded-lg text-[var(--ms)] hover:bg-[var(--k2)]">
          <IconX size={18} />
        </button>
      </header>
      <div className="min-h-0 flex-1 space-y-4 overflow-y-auto px-5 py-4">
        <label className="block">
          <span className="text-[12px] font-medium text-[var(--ms)]">Misafirin adı</span>
          <input value={ad} onChange={(e) => setAd(e.target.value)} placeholder="Ad soyad" className="mt-1.5 h-10 w-full rounded-lg border border-[var(--k)] bg-transparent px-3 text-[13px] outline-none focus:border-[var(--p)] focus-visible:outline-none" />
        </label>
        <div>
          <span className="text-[12px] font-medium text-[var(--ms)]">Gece</span>
          <div className="mt-1.5 flex flex-wrap gap-2">
            {[1, 2, 3, 4, 5, 7].map((n) => (
              <button key={n} type="button" aria-pressed={gece === n} onClick={() => setGece(n)} className={`h-9 w-11 rounded-lg border text-[13px] font-semibold ${gece === n ? "border-[var(--p)] bg-[var(--p)] text-white" : "border-[var(--k)] hover:bg-[var(--k2)]"}`}>
                {n}
              </button>
            ))}
          </div>
        </div>
        <label className="block">
          <span className="text-[12px] font-medium text-[var(--ms)]">Kanal</span>
          <select value={kanal} onChange={(e) => setKanal(e.target.value)} className="mt-1.5 h-10 w-full rounded-lg border border-[var(--k)] bg-[var(--kart)] px-3 text-[13px] outline-none">
            {KANAL_ADLARI.map((k) => (
              <option key={k}>{k}</option>
            ))}
          </select>
        </label>
        <div className="rounded-lg border border-[var(--k)] p-3 text-[12.5px]">
          <p className="flex justify-between">
            <span className="text-[var(--ms)]">Gecelik</span>
            <span className="tabular-nums">{tl(fiyat)}</span>
          </p>
          <p className="mt-1 flex justify-between font-semibold">
            <span>Toplam, {gece} gece</span>
            <span className="tabular-nums">{tl(fiyat * gece)}</span>
          </p>
          <p className="mt-1 text-[11.5px] text-[var(--ms)]">Çıkış {tarih(giris + gece * GUN, true)} saat 12.00</p>
        </div>
        {!bos && <p className="rounded-lg bg-[var(--k2)] p-3 text-[12.5px]" style={{ color: RENK.kirmizi }}>Bu odanın seçtiğiniz gecelerinden biri dolu. Gece sayısını azaltın ya da başka bir oda seçin.</p>}
      </div>
      <footer className="flex justify-end gap-2 border-t border-[var(--k)] px-5 py-3">
        <Dugme onClick={kapat}>Vazgeç</Dugme>
        <Dugme
          tur="ana"
          ikon={IconCheck}
          disabled={!bos || !ad.trim()}
          onClick={() => {
            const s = api.ani.getTime();
            const mId = api.yeniId("m");
            api.ekle("misafirler", { id: mId, ad: ad.trim(), telefon: "0532 000 00 00", eposta: "", ulke: "Türkiye", onceki: 0, konaklama: 0, not: "", gecmis: [] });
            const no = `R${Math.max(...api.veri.rezervasyonlar.map((x) => Number(x.id.slice(1)))) + 1}`;
            api.ekle("rezervasyonlar", { id: no, odaId, misafirId: mId, giris, gece, kisi: 2, kanal, fiyat, toplam: fiyat * gece, ekstra: 0, odenen: 0, t: s, durum: "onayli", gecmis: [{ t: s, m: `${kanal} üzerinden rezervasyon, ${KULLANICI.ad}` }] });
            api.haber(`Rezervasyon ${no} oluştu. Misafire onay ve ön ödeme bağlantısı gitti.`, "basari");
            api.olay("rezervasyon");
            kapat();
          }}
        >
          Rezervasyonu kaydet
        </Dugme>
      </footer>
    </>
  );
}

function OdaPlani({ api, modul }: { api: PanelApi; modul: ModulBilgi }) {
  const [kaydir, setKaydir] = useState(0);
  const [secim, setSecim] = useState<{ tur: "rez"; id: string } | { tur: "yeni"; odaId: string; giris: number } | null>(null);
  const bugun = gunBasi(api.ani);
  const bas0 = bugun - GUN + kaydir * 7 * GUN;
  const gunler = Array.from({ length: GOSTER }, (_, i) => bas0 + i * GUN);
  const rez = secim?.tur === "rez" ? api.bul("rezervasyonlar", secim.id) : null;
  const eylemler = rez ? REZ_EYLEMLERI.filter((e) => !e.gorunur || e.gorunur(rez, api)) : [];

  return (
    <>
      <EkranBasligi modul={modul}>
        <div className="flex items-center gap-1">
          <Dugme tur="sade" onClick={() => setKaydir((k) => k - 1)}>
            Önceki hafta
          </Dugme>
          <Dugme onClick={() => setKaydir(0)} className={kaydir === 0 ? "border-[var(--p)]" : ""}>
            Bugün
          </Dugme>
          <Dugme tur="sade" onClick={() => setKaydir((k) => k + 1)}>
            Sonraki hafta
          </Dugme>
        </div>
      </EkranBasligi>
      <div className="mb-3 flex flex-wrap gap-x-4 gap-y-1 text-[11.5px] text-[var(--ms)]">
        {KANAL_ADLARI.map((k) => (
          <span key={k} className="inline-flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-[2px]" style={{ background: RENK[KANALLAR[k].renk as keyof typeof RENK] }} />
            {k}
          </span>
        ))}
        <span>Şeritler giriş günü öğleden sonra başlar, çıkış günü öğlen biter.</span>
      </div>
      <div className="overflow-x-auto rounded-xl border border-[var(--k)] bg-[var(--kart)]">
        <div className="min-w-[56rem]">
          <div className="grid border-b border-[var(--k)]" style={{ gridTemplateColumns: `6.5rem repeat(${GOSTER}, minmax(0,1fr))` }}>
            <div className="px-3 py-2 text-[11px] text-[var(--ms)]">Oda</div>
            {gunler.map((g) => {
              const d = new Date(g);
              const bugunMu = g === bugun;
              const dolu = doluOda(api, g);
              return (
                <div key={g} className={`border-l border-[var(--k)] px-1 py-1.5 text-center ${bugunMu ? "bg-[var(--k2)]" : ""}`}>
                  <p className={`text-[11px] font-semibold ${bugunMu ? "text-[var(--p)]" : d.getDay() === 0 || d.getDay() === 6 ? "text-[var(--m)]" : "text-[var(--ms)]"}`}>
                    {GUN_KISA[d.getDay()]} {d.getDate()}
                  </p>
                  <p className="text-[10px] tabular-nums text-[var(--ms)]">yüzde {Math.round((dolu / ODALAR.length) * 100)}</p>
                </div>
              );
            })}
          </div>
          {api.veri.odalar.map((oda) => {
            const odaRez = api.veri.rezervasyonlar.filter((x) => x.odaId === oda.id && aktifRez(x) && cikisGunu(x) > bas0 && x.giris < bas0 + GOSTER * GUN);
            return (
              <div key={oda.id} className="grid border-b border-[var(--k)] last:border-0" style={{ gridTemplateColumns: `6.5rem minmax(0,1fr)` }}>
                <div className="flex flex-col justify-center px-3 py-1.5">
                  <span className="flex items-center gap-1.5 text-[12.5px] font-semibold">
                    {oda.no}
                    {oda.temizlik !== "temiz" && <span aria-label={TEMIZLIK[oda.temizlik].ad} title={TEMIZLIK[oda.temizlik].ad} className="h-[7px] w-[7px] rounded-[2px]" style={{ background: RENK[TEMIZLIK[oda.temizlik].renk] }} />}
                  </span>
                  <span className="truncate text-[10.5px] text-[var(--ms)]">{oda.tip}</span>
                </div>
                <div className="relative h-11">
                  <div className="absolute inset-0 grid" style={{ gridTemplateColumns: `repeat(${GOSTER}, minmax(0,1fr))` }}>
                    {gunler.map((g) => (
                      <button
                        key={g}
                        type="button"
                        aria-label={`Oda ${oda.no}, ${tarih(g)} girişli rezervasyon`}
                        disabled={g < bugun || !odaBos(api, oda.id, g, 1)}
                        onClick={() => setSecim({ tur: "yeni", odaId: oda.id, giris: g })}
                        className={`border-l border-[var(--k)] transition-colors ${g === bugun ? "bg-[var(--k2)]" : ""} enabled:hover:bg-[var(--k2)]`}
                      />
                    ))}
                  </div>
                  {odaRez.map((x) => {
                    const bas = (x.giris - bas0) / GUN + 0.5;
                    const son = (cikisGunu(x) - bas0) / GUN + 0.5;
                    const sol = Math.max(0, bas);
                    const sag = Math.min(GOSTER, son);
                    const renk = RENK[KANALLAR[x.kanal].renk as keyof typeof RENK];
                    return (
                      <button
                        key={x.id}
                        type="button"
                        onClick={() => setSecim({ tur: "rez", id: x.id })}
                        className="absolute top-1.5 flex h-8 items-center overflow-hidden rounded-md px-2 text-left text-[11.5px] font-semibold transition-[filter] hover:brightness-125"
                        style={{
                          left: `calc(${(sol / GOSTER) * 100}% + 2px)`,
                          width: `calc(${((sag - sol) / GOSTER) * 100}% - 4px)`,
                          background: `color-mix(in srgb, ${renk} ${x.durum === "cikti" ? 10 : 22}%, var(--kart))`,
                          borderLeft: bas >= 0 ? `3px solid ${renk}` : undefined,
                          color: "var(--m)",
                          opacity: x.durum === "cikti" ? 0.6 : 1,
                        }}
                      >
                        <span className="truncate">
                          {misafirAdi(api, x.misafirId)}
                          {x.durum === "konakliyor" && <span className="font-normal text-[var(--ms)]">, içeride</span>}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </div>
      <Cekmece acik={!!secim} kapat={() => setSecim(null)}>
        {rez && (
          <>
            <header className="flex items-start justify-between gap-3 border-b border-[var(--k)] px-5 py-4">
              <div>
                <h3 className="text-[17px] font-bold">{misafirAdi(api, rez.misafirId)}</h3>
                <p className="mt-0.5 text-[12.5px] text-[var(--ms)]">
                  Rezervasyon {rez.id}, oda {odaNo(api, rez.odaId)}
                </p>
                <div className="mt-2">
                  <DurumYazi d={REZ_DURUMU[rez.durum]} />
                </div>
              </div>
              <button type="button" onClick={() => setSecim(null)} aria-label="Kapat" className="flex h-8 w-8 items-center justify-center rounded-lg text-[var(--ms)] hover:bg-[var(--k2)]">
                <IconX size={18} />
              </button>
            </header>
            <div className="min-h-0 flex-1 overflow-y-auto">
              <RezervasyonBilgisi x={rez} api={api} />
            </div>
            {eylemler.length > 0 && (
              <footer className="flex flex-wrap gap-2 border-t border-[var(--k)] px-5 py-3">
                {eylemler.map((e) => (
                  <Dugme key={e.ad} tur={e.tur ?? "normal"} ikon={e.ikon} onClick={() => e.uygula(rez, api)}>
                    {e.ad}
                  </Dugme>
                ))}
              </footer>
            )}
          </>
        )}
        {secim?.tur === "yeni" && <YeniRezervasyon key={`${secim.odaId}${secim.giris}`} api={api} odaId={secim.odaId} giris={secim.giris} kapat={() => setSecim(null)} />}
      </Cekmece>
    </>
  );
}

const REZ_EYLEMLERI = [
  { ad: "Giriş yap", tur: "ana" as const, ikon: IconDoorEnter, gorunur: (x: Kayit, api: PanelApi) => x.durum === "onayli" && x.giris <= gunBasi(api.ani), uygula: girisYap },
  { ad: "Çıkış yap", tur: "ana" as const, ikon: IconDoorExit, gorunur: (x: Kayit) => x.durum === "konakliyor", uygula: cikisYap },
  {
    ad: "İptal et",
    tur: "tehlike" as const,
    ikon: IconX,
    gorunur: (x: Kayit, api: PanelApi) => x.durum === "onayli" && x.giris >= gunBasi(api.ani),
    uygula: (x: Kayit, api: PanelApi) => {
      api.guncelle("rezervasyonlar", x.id, { durum: "iptal" }, `İptal edildi, ${KULLANICI.ad}`);
      api.haber("Rezervasyon iptal edildi, geceler oda planında boşaldı", "bilgi");
    },
  },
];

function KatHizmetleri({ api, modul }: { api: PanelApi; modul: ModulBilgi }) {
  const bugun = gunBasi(api.ani);
  const sayilar = Object.keys(TEMIZLIK).map((k) => [k, api.veri.odalar.filter((o) => o.temizlik === k).length] as const);
  const girisVar = (oda: Kayit) => api.veri.rezervasyonlar.some((x) => x.odaId === oda.id && x.durum === "onayli" && x.giris === bugun);
  const icinde = (oda: Kayit) => api.veri.rezervasyonlar.find((x) => x.odaId === oda.id && x.durum === "konakliyor");
  const degistir = (oda: Kayit, temizlik: string, not: string, olay?: string) => {
    api.guncelle("odalar", oda.id, { temizlik }, not);
    api.haber(`Oda ${oda.no} ${TEMIZLIK[temizlik].ad.toLocaleLowerCase("tr")}`, "basari");
    if (olay) api.olay(olay);
  };
  const sirali = [...api.veri.odalar].sort((a, b) => {
    const p = (o: Kayit) => (o.temizlik !== "temiz" && girisVar(o) ? 0 : o.temizlik === "kirli" ? 1 : o.temizlik === "temizleniyor" ? 2 : 3);
    return p(a) - p(b) || a.no.localeCompare(b.no);
  });
  return (
    <>
      <EkranBasligi modul={modul} />
      <div className="mb-4 grid grid-cols-2 gap-3 @3xl:grid-cols-4">
        {sayilar.map(([k, n]) => (
          <Kart key={k} className="p-3.5">
            <p className="text-[11.5px] text-[var(--ms)]">{TEMIZLIK[k].ad}</p>
            <p className="mt-1 text-[20px] font-bold tabular-nums" style={{ color: RENK[TEMIZLIK[k].renk] }}>
              {n}
            </p>
          </Kart>
        ))}
      </div>
      <div className="grid grid-cols-1 gap-3 @xl:grid-cols-2 @5xl:grid-cols-4">
        {sirali.map((oda) => {
          const d = TEMIZLIK[oda.temizlik];
          const oncelik = oda.temizlik !== "temiz" && girisVar(oda);
          const misafir = icinde(oda);
          return (
            <article key={oda.id} className="flex flex-col rounded-xl border bg-[var(--kart)] p-3.5" style={{ borderColor: oncelik ? RENK.kirmizi : "var(--k)" }}>
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="text-[17px] font-bold">{oda.no}</p>
                  <p className="text-[11.5px] text-[var(--ms)]">{oda.tip}</p>
                </div>
                <DurumYazi d={d} kucuk />
              </div>
              <p className="mt-2 min-h-5 text-[11.5px] leading-5 text-[var(--ms)]">
                {oncelik ? <span style={{ color: RENK.kirmizi }}>Bugün giriş var, önce bu oda</span> : misafir ? `Misafir içeride, ${tarih(cikisGunu(misafir))} çıkış` : girisVar(oda) ? "Bugün giriş var, hazır" : "Boş"}
              </p>
              <div className="mt-3 flex flex-wrap gap-1.5">
                {oda.temizlik === "kirli" && (
                  <Dugme kucuk tur="ana" ikon={IconBrush} onClick={() => degistir(oda, "temizleniyor", "Temizliğe başlandı")}>
                    Temizliğe başla
                  </Dugme>
                )}
                {oda.temizlik === "temizleniyor" && (
                  <Dugme kucuk tur="ana" ikon={IconCheck} onClick={() => degistir(oda, "temiz", "Temizlendi, resepsiyona bildirildi", "temizlik")}>
                    Temizlendi
                  </Dugme>
                )}
                {oda.temizlik === "ariza" ? (
                  <Dugme kucuk ikon={IconCheck} onClick={() => degistir(oda, "temiz", "Arıza giderildi")}>
                    Arıza giderildi
                  </Dugme>
                ) : (
                  oda.temizlik === "temiz" && (
                    <Dugme kucuk tur="sade" ikon={IconTool} onClick={() => degistir(oda, "ariza", "Arıza bildirildi, teknik ekibe iletildi")}>
                      Arıza bildir
                    </Dugme>
                  )
                )}
              </div>
            </article>
          );
        })}
      </div>
    </>
  );
}

/* ---------------- Ekranlar ---------------- */

function uyarilar(api: PanelApi) {
  const liste: ReturnType<SektorPanel["uyarilar"]> = [];
  const bugun = gunBasi(api.ani);
  const saatNe = api.ani.getHours();
  const giris = api.veri.rezervasyonlar.filter((x) => x.durum === "onayli" && x.giris === bugun).length;
  const cikis = api.veri.rezervasyonlar.filter((x) => x.durum === "konakliyor" && cikisGunu(x) === bugun).length;
  const kirliGiris = api.veri.odalar.filter((o) => o.temizlik !== "temiz" && api.veri.rezervasyonlar.some((x) => x.odaId === o.id && x.durum === "onayli" && x.giris === bugun)).length;
  const bosGece = ODALAR.length - doluOda(api, bugun);
  if (kirliGiris) liste.push({ metin: `Bugün girişi olan ${kirliGiris} oda henüz hazır değil`, modul: "kat", renk: "kirmizi" });
  if (cikis) liste.push({ metin: `${cikis} misafirin bugün çıkışı var${saatNe >= CIKIS ? ", çıkış saati geçti" : ""}`, modul: "rezervasyonlar", filtre: "Durum=Bugün çıkacak", renk: saatNe >= CIKIS ? "kirmizi" : "sari" });
  if (giris) liste.push({ metin: `${giris} misafir bugün gelecek`, modul: "rezervasyonlar", filtre: "Durum=Bugün gelecek", renk: "mavi" });
  if (bosGece) liste.push({ metin: `Bu gece ${bosGece} oda boş, son dakika fiyatı düşünülebilir`, modul: "takvim", renk: "mor" });
  return liste;
}

const otuzGunGelir = (api: PanelApi) => {
  const s = gunBasi(api.ani);
  return api.veri.rezervasyonlar.filter((x) => aktifRez(x) && x.giris >= s - 30 * GUN && x.giris < s);
};

const ozet = ozetEkrani({
  kullanici: KULLANICI.ad,
  uyarilar,
  karsilama: (api) => {
    const bugun = gunBasi(api.ani);
    const g = api.veri.rezervasyonlar.filter((x) => aktifRez(x) && x.giris === bugun).length;
    const c = api.veri.rezervasyonlar.filter((x) => aktifRez(x) && cikisGunu(x) === bugun).length;
    return `Bugün ${g} giriş ve ${c} çıkış var, bu gece ${doluOda(api, bugun)} oda dolu.`;
  },
  sayilar: (api) => {
    const bugun = gunBasi(api.ani);
    const buGece = doluOda(api, bugun);
    const l = otuzGunGelir(api);
    const geceler = l.reduce((t, x) => t + x.gece, 0);
    const adr = l.reduce((t, x) => t + x.toplam, 0) / Math.max(1, geceler);
    const ileri = Array.from({ length: 30 }, (_, i) => doluOda(api, bugun + i * GUN));
    return [
      { ad: "Bu gece doluluk", deger: String(Math.round((buGece / ODALAR.length) * 100)), birim: "yüzde", alt: `${ODALAR.length} odanın ${buGece} tanesi dolu`, not: "Bu gece konaklayan ya da bugün gelecek misafirlerin odaları. İptal edilenler sayılmaz.", git: () => api.git("takvim") },
      {
        ad: "Bugün giriş",
        deger: String(api.veri.rezervasyonlar.filter((x) => aktifRez(x) && x.giris === bugun).length),
        birim: "misafir",
        alt: `${api.veri.rezervasyonlar.filter((x) => aktifRez(x) && cikisGunu(x) === bugun).length} misafirin de bugün çıkışı var`,
        not: "Giriş saati 14.00, çıkış saati 12.00. Girişi yapılmış ya da çıkışı tamamlanmış olanlar da sayılır.",
        git: () => api.git("rezervasyonlar"),
      },
      { ad: "Gecelik ortalama fiyat, 30 gün", deger: tl(adr), alt: `${geceler} gece satıldı`, not: "Son 30 günde başlayan konaklamaların oda geliri, satılan gece sayısına bölünür. Ekstralar hariç." },
      { ad: "Önümüzdeki 30 gece", deger: sayi((ileri.reduce((t, n) => t + n, 0) / (30 * ODALAR.length)) * 100), birim: "yüzde dolu", alt: "Şu anki rezervasyonlarla", not: "Önümüzdeki 30 gecenin ortalama doluluğu. Uzak geceler doldukça artar.", seri: ileri },
    ];
  },
  ana: {
    baslik: "Önümüzdeki 30 gecenin doluluğu",
    icerik: (api) => {
      const bugun = gunBasi(api.ani);
      const veri = Array.from({ length: 30 }, (_, i) => {
        const g = bugun + i * GUN;
        const d = new Date(g);
        const n = doluOda(api, g);
        return { etiket: i === 0 ? "Bu gece" : `${d.getDate()}`, uzunEtiket: `${i === 0 ? "Bu gece" : `${tarih(g)} ${GUN_KISA[d.getDay()]}`}, ${n} oda, yüzde ${Math.round((n / ODALAR.length) * 100)}`, deger: n };
      });
      return <CubukGrafik veri={veri} bicim={(n) => `${n} oda dolu`} hedef={ODALAR.length} hedefAdi="Toplam oda" ozet="Boş kalacak geceler için kampanya ve fiyat kararı buradan" seriAdi="Dolu oda" />;
    },
  },
  parcalar: [
    {
      baslik: "Bugün gelenler",
      icerik: (api) => {
        const bugun = gunBasi(api.ani);
        const l = api.veri.rezervasyonlar.filter((x) => aktifRez(x) && x.giris === bugun);
        if (!l.length) return <p className="text-[12.5px] text-[var(--ms)]">Bugün giriş yok.</p>;
        return (
          <ul className="divide-y divide-[var(--k)]">
            {l.map((x) => (
              <li key={x.id}>
                <button type="button" onClick={() => api.git("rezervasyonlar", { kayit: x.id })} className="flex w-full items-center gap-3 py-2 text-left hover:text-[var(--p)]">
                  <Harf metin={bas(misafirAdi(api, x.misafirId))} renk={isimRengi(misafirAdi(api, x.misafirId))} yumusak boy={28} />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-[12.5px]">{misafirAdi(api, x.misafirId)}</span>
                    <span className="block text-[11.5px] text-[var(--ms)]">
                      Oda {odaNo(api, x.odaId)}, {x.gece} gece, {x.kanal}
                    </span>
                  </span>
                  <DurumYazi d={REZ_DURUMU[x.durum]} kucuk />
                </button>
              </li>
            ))}
          </ul>
        );
      },
    },
    {
      baslik: "Kanallara göre gelir, 30 gün",
      icerik: (api) => {
        const l = otuzGunGelir(api);
        const dilimler = KANAL_ADLARI.map((k) => ({ ad: k, renk: KANALLAR[k].renk, deger: l.filter((x) => x.kanal === k).reduce((t, x) => t + x.toplam, 0) }));
        return <HalkaGrafik dilimler={dilimler} bicim={tlKisa} merkez={tlKisa(dilimler.reduce((t, d) => t + d.deger, 0))} />;
      },
    },
  ],
});

const panel: SektorPanel = {
  kullanici: KULLANICI,
  uret,
  uyarilar,
  moduller: [
    { id: "ozet", grup: "Genel", ekran: ozet },
    { id: "takvim", grup: "Ön büro", ekran: { tur: "ozel", bilesen: OdaPlani } },
    {
      id: "rezervasyonlar",
      grup: "Ön büro",
      rozet: (api) => api.veri.rezervasyonlar.filter((x) => x.durum === "onayli" && x.giris === gunBasi(api.ani)).length,
      ekran: {
        tur: "liste",
        koleksiyon: "rezervasyonlar",
        baslikAdi: "Misafir",
        baslik: (x, api) => misafirAdi(api, x.misafirId),
        alt: (x, api) => `Rezervasyon ${x.id}, oda ${odaNo(api, x.odaId)}`,
        harf: (x, api) => misafirAdi(api, x.misafirId),
        durum: (x) => REZ_DURUMU[x.durum],
        arama: (x, api) => `${x.id} ${x.kanal} ${odaNo(api, x.odaId)} ${api.bul("misafirler", x.misafirId)?.telefon ?? ""}`,
        sira: (a, b) => {
          // Önce bugünün işleri, sonra yaklaşanlar, en sonda geçmiş.
          const g = gunBasi(Date.now());
          const k = (x: Kayit) => (x.giris === g || cikisGunu(x) === g ? 0 : x.giris > g ? 1 : 2);
          return k(a) - k(b) || (k(a) === 2 ? b.giris - a.giris : a.giris - b.giris);
        },
        sutunlar: [
          { ad: "Giriş", deger: (x, api) => `${gunAdi(x.giris, api.ani)}`, sirala: (x) => x.giris, csv: (x) => tarihYil(x.giris), oncelik: 1 },
          { ad: "Gece", deger: (x) => `${x.gece} gece`, sirala: (x) => x.gece, oncelik: 2 },
          { ad: "Kanal", deger: (x) => x.kanal, sirala: (x) => x.kanal, oncelik: 3 },
          { ad: "Tutar", deger: (x) => tl(x.toplam), sirala: (x) => x.toplam, csv: (x) => x.toplam, hiza: "sag", oncelik: 1 },
        ],
        filtreler: [
          {
            ad: "Durum",
            secenekler: [
              { ad: "Bugün gelecek", kosul: (x, api) => aktifRez(x) && x.giris === gunBasi(api.ani) },
              { ad: "Bugün çıkacak", kosul: (x, api) => aktifRez(x) && cikisGunu(x) === gunBasi(api.ani) },
              { ad: "Konaklıyor", kosul: (x) => x.durum === "konakliyor" },
              { ad: "Gelecek", kosul: (x, api) => x.durum === "onayli" && x.giris > gunBasi(api.ani) },
              { ad: "Geçmiş", kosul: (x) => x.durum === "cikti" },
              { ad: "İptal ve gelmeyen", kosul: (x) => !aktifRez(x) },
            ],
          },
          { ad: "Kanal", secenekler: KANAL_ADLARI.map((k) => ({ ad: k, kosul: (x: Kayit) => x.kanal === k })) },
        ],
        ozet: (api) => {
          const bugun = gunBasi(api.ani);
          const l = api.veri.rezervasyonlar;
          return [
            { ad: "Bugün gelecek", deger: String(l.filter((x) => x.durum === "onayli" && x.giris === bugun).length), renk: "mavi" },
            { ad: "Bugün çıkacak", deger: String(l.filter((x) => x.durum === "konakliyor" && cikisGunu(x) === bugun).length), renk: "sari" },
            { ad: "Konaklayan", deger: String(l.filter((x) => x.durum === "konakliyor").length), renk: "yesil" },
            { ad: "Gelecek rezervasyon", deger: String(l.filter((x) => x.durum === "onayli" && x.giris > bugun).length) },
          ];
        },
        detay: { bolumler: (x, api) => <RezervasyonBilgisi x={x} api={api} />, eylemler: REZ_EYLEMLERI },
      },
    },
    {
      id: "kat",
      grup: "Ön büro",
      rozet: (api) => api.veri.odalar.filter((o) => o.temizlik === "kirli").length,
      ekran: { tur: "ozel", bilesen: KatHizmetleri },
    },
    {
      id: "misafirler",
      grup: "Misafir",
      ekran: {
        tur: "liste",
        koleksiyon: "misafirler",
        baslikAdi: "Misafir",
        kapsam: (m, api) => api.veri.rezervasyonlar.some((x) => x.misafirId === m.id) || m.onceki > 0,
        baslik: (m) => m.ad,
        alt: (m) => `${m.ulke}, ${m.telefon}`,
        harf: (m) => m.ad,
        durum: (m) => (m.konaklama >= 2 ? { ad: "Tekrar gelen", renk: "yesil" } : { ad: "Yeni misafir", renk: "gri" }),
        arama: (m) => `${m.telefon} ${m.eposta} ${m.ulke} ${m.not}`,
        sutunlar: [
          { ad: "Ülke", deger: (m) => m.ulke, sirala: (m) => m.ulke, oncelik: 2 },
          { ad: "Konaklama", deger: (m) => `${m.konaklama} kez`, sirala: (m) => m.konaklama, hiza: "sag", oncelik: 1 },
          { ad: "Toplam harcama", deger: (m, api) => tl(api.veri.rezervasyonlar.filter((x) => x.misafirId === m.id && x.durum === "cikti").reduce((t, x) => t + x.toplam + x.ekstra, 0)), hiza: "sag", oncelik: 3 },
        ],
        filtreler: [
          { ad: "Ülke", secenekler: [...new Set(ULKELER)].map((u) => ({ ad: u, kosul: (m: Kayit) => m.ulke === u })) },
          { ad: "Tür", secenekler: [{ ad: "Tekrar gelen", kosul: (m) => m.konaklama >= 2 }, { ad: "Notu olan", kosul: (m) => !!m.not }] },
        ],
        detay: {
          bolumler: (m, api) => {
            const l = api.veri.rezervasyonlar.filter((x) => x.misafirId === m.id).sort((a, b) => b.giris - a.giris);
            return (
              <>
                <Bolum baslik="Misafir">
                  <AlanListesi alanlar={[["Ülke", m.ulke], ["Telefon", m.telefon], ["E posta", m.eposta], ["Konaklama", `${m.konaklama} kez`], ...(m.not ? ([["Not", m.not]] as [string, string][]) : [])]} />
                </Bolum>
                <Bolum baslik="Rezervasyonları">
                  <MiniTablo basliklar={["Giriş", "Oda", "Gece", "Durum"]} satirlar={l.map((x) => [tarih(x.giris), odaNo(api, x.odaId), x.gece, <DurumYazi d={REZ_DURUMU[x.durum]} kucuk />])} />
                </Bolum>
                <Bolum baslik="Geçmiş">
                  <Gecmis satirlar={m.gecmis.map((g: Kayit) => ({ zaman: zaman(g.t, api.ani), metin: g.m }))} />
                </Bolum>
              </>
            );
          },
          eylemler: [
            {
              ad: "Tekrar gelme teklifi gönder",
              tur: "ana",
              ikon: IconSend,
              uygula: (m, api) => {
                api.guncelle("misafirler", m.id, {}, "Kendi sitesinden rezervasyonda yüzde 10 indirim teklifi gönderildi");
                api.haber(`${m.ad} için doğrudan rezervasyon teklifi e posta ile gitti`, "basari");
                api.olay("teklif");
              },
            },
          ],
        },
      },
    },
    {
      id: "kanallar",
      grup: "Gelir",
      ekran: {
        tur: "ozel",
        bilesen: function Kanallar({ api, modul }: { api: PanelApi; modul: ModulBilgi }) {
          const l = otuzGunGelir(api);
          const satirlar = KANAL_ADLARI.map((k) => {
            const r = l.filter((x) => x.kanal === k);
            const gelir = r.reduce((t, x) => t + x.toplam, 0);
            const komisyon = gelir * KANALLAR[k].komisyon;
            return { k, adet: r.length, gece: r.reduce((t, x) => t + x.gece, 0), gelir, komisyon, net: gelir - komisyon };
          }).sort((a, b) => b.net - a.net);
          const toplam = satirlar.reduce((t, x) => t + x.gelir, 0);
          const kom = satirlar.reduce((t, x) => t + x.komisyon, 0);
          return (
            <>
              <EkranBasligi modul={modul} />
              <div className="mb-4 grid grid-cols-2 gap-3 @3xl:grid-cols-3">
                <Kart className="p-3.5">
                  <p className="text-[11.5px] text-[var(--ms)]">Oda geliri, 30 gün</p>
                  <p className="mt-1 text-[20px] font-bold tabular-nums">{tlKisa(toplam)}</p>
                </Kart>
                <Kart className="p-3.5">
                  <p className="text-[11.5px] text-[var(--ms)]">Kanallara giden komisyon</p>
                  <p className="mt-1 text-[20px] font-bold tabular-nums text-[var(--kirmizi)]">{tlKisa(kom)}</p>
                </Kart>
                <Kart className="p-3.5">
                  <p className="text-[11.5px] text-[var(--ms)]">Doğrudan satış payı</p>
                  <p className="mt-1 text-[20px] font-bold tabular-nums text-[var(--yesil)]">{yuzde(((satirlar.find((x) => x.k === "Kendi sitesi")!.gelir + satirlar.find((x) => x.k === "Telefon")!.gelir) / Math.max(1, toplam)) * 100)}</p>
                </Kart>
              </div>
              <Kart>
                <div className="overflow-x-auto p-4">
                  <MiniTablo
                    basliklar={["Kanal", "Rezervasyon", "Gece", "Gelir", "Komisyon", "Net"]}
                    sagdakiler={[1, 2, 3, 4, 5]}
                    satirlar={satirlar.map((x) => [
                      <span className="inline-flex items-center gap-2">
                        <span className="h-2.5 w-2.5 rounded-[3px]" style={{ background: RENK[KANALLAR[x.k].renk as keyof typeof RENK] }} />
                        {x.k}, {yuzde(KANALLAR[x.k].komisyon * 100, 1)}
                      </span>,
                      x.adet,
                      x.gece,
                      tl(x.gelir),
                      <span className="text-[var(--kirmizi)]">{tl(x.komisyon)}</span>,
                      <strong>{tl(x.net)}</strong>,
                    ])}
                  />
                  <p className="mt-3 text-[12px] leading-5 text-[var(--ms)]">
                    Kendi sitenizden gelen rezervasyonda yalnız sanal POS komisyonu ödenir. Doğrudan satışı yüzde 10 artırmak, bu tabloya göre ayda yaklaşık {tl(kom * 0.1)} komisyonu cebinizde bırakır.
                  </p>
                </div>
              </Kart>
            </>
          );
        },
      },
    },
  ],
  arama: [
    { koleksiyon: "misafirler", modul: "misafirler", baslik: (m) => m.ad, alt: (m) => `${m.ulke}, ${m.telefon}`, metin: (m) => `${m.telefon} ${m.eposta}` },
    { koleksiyon: "rezervasyonlar", modul: "rezervasyonlar", baslik: (x) => `Rezervasyon ${x.id}`, alt: (x) => `${x.kanal}, ${x.gece} gece`, metin: (x) => x.id },
  ],
  gorevler: [
    { id: "g1", metin: "Oda planında boş bir geceye rezervasyon girin", ipucu: "Oda planında boş bir kutuya tıklayın, misafir adını yazın.", modul: "takvim", olay: "rezervasyon" },
    { id: "g2", metin: "Bugün gelen bir misafirin girişini yapın", ipucu: "Rezervasyonlarda Bugün gelecek süzgecini seçin. Oda kirliyse önce temizlenmesi gerekir.", modul: "rezervasyonlar", olay: "giris" },
    { id: "g3", metin: "Konaklayan bir misafirin çıkışını yapın", ipucu: "Çıkışta kalan tutar tahsil edilir, oda kirliye düşer.", modul: "rezervasyonlar", olay: "cikis" },
    { id: "g4", metin: "Kirli bir odayı temizleyin", ipucu: "Kat hizmetlerinde önce Temizliğe başla, sonra Temizlendi düğmesine basın.", modul: "kat", olay: "temizlik" },
    { id: "g5", metin: "Tekrar gelen bir misafire teklif gönderin", ipucu: "Misafirlerde tür süzgecinden Tekrar gelen seçeneğini seçin.", modul: "misafirler", olay: "teklif" },
  ],
  canli: {
    aralik: 36_000,
    uret: (api, r) => {
      const bugun = gunBasi(api.ani);
      for (let deneme = 0; deneme < 20; deneme++) {
        const oda = r.sec(api.veri.odalar);
        const giris = bugun + r.tam(1, 30) * GUN;
        const gece = r.tam(1, 4);
        if (!odaBos(api, oda.id, giris, gece)) continue;
        const kanal = r.agirlikli([["Booking", 45], ["Expedia", 15], ["Kendi sitesi", 25], ["Telefon", 15]] as const);
        const k = kisiler(r, 1)[0];
        const mId = api.yeniId("m");
        api.ekle("misafirler", { id: mId, ad: k.tamAd, telefon: k.telefon, eposta: k.eposta, ulke: r.sec(ULKELER), onceki: 0, konaklama: 0, not: "", gecmis: [] });
        const no = `R${Math.max(...api.veri.rezervasyonlar.map((x) => Number(x.id.slice(1)))) + 1}`;
        const fiyat = oda.fiyat;
        api.ekle("rezervasyonlar", { id: no, odaId: oda.id, misafirId: mId, giris, gece, kisi: 2, kanal, fiyat, toplam: fiyat * gece, ekstra: 0, odenen: kanal === "Kendi sitesi" ? fiyat * gece : 0, t: api.ani.getTime(), durum: "onayli", gecmis: [{ t: api.ani.getTime(), m: `${kanal} üzerinden rezervasyon` }] });
        api.bildir(`${kanal} üzerinden yeni rezervasyon, oda ${oda.no}, ${tarih(giris)} girişli ${gece} gece`, "rezervasyonlar", no);
        return;
      }
    },
  },
};

export default panel;
export { bilgi };
