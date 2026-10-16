/*
 * Teknik servis demosu: Ege Teknik Servis. Her iş bir randevu aralığına ve
 * teknisyene bağlıdır; durumu gün içindeki saate göre ilerler. Garantili iş
 * kapanınca markaya gidecek hakediş talebi kendiliğinden oluşur.
 */
import { useState } from "react";
import { IconCar, IconCheck, IconPackage, IconPlayerPlay, IconSend, IconUserCheck, IconX } from "@tabler/icons-react";
import { servis as bilgi } from "./bilgi";
import { ozetEkrani } from "../../panel/Ozet";
import { Cekmece, EkranBasligi } from "../../panel/Liste";
import { AlanListesi, Bolum, Cubuk, Dugme, DurumYazi, Gecmis, Harf, MiniTablo, RENK, isimRengi } from "../../panel/parcalar";
import { CubukGrafik, HalkaGrafik } from "../../panel/grafik";
import { DAKIKA, GUN, GUN_KISA, SAAT, bas, gunAdi, gunBasi, kisiler, kod, saat, sayi, tarih, tl, tlKisa, yuzde, zaman } from "../../ortak";
import type { Durum, Eylem, Kayit, ModulBilgi, PanelApi, Rastgele, SektorPanel, Veri } from "../../tipler";

const KULLANICI = { ad: "Serkan Yüksel", rol: "Servis müdürü" };
const ILCELER = ["Karşıyaka", "Bornova", "Buca", "Konak", "Bayraklı", "Çiğli", "Karabağlar", "Gaziemir", "Narlıdere", "Balçova"];
const MAHALLE: Record<string, string[]> = {
  Karşıyaka: ["Bostanlı", "Mavişehir", "Alaybey"],
  Bornova: ["Erzene", "Kazımdirik", "Evka 3"],
  Buca: ["Şirinyer", "Kuruçeşme", "Adatepe"],
  Konak: ["Alsancak", "Göztepe", "Güzelyalı"],
  Bayraklı: ["Mansuroğlu", "Adalet", "Manavkuyu"],
  Çiğli: ["Ataşehir", "Balatçık", "Harmandalı"],
  Karabağlar: ["Yeşilyurt", "Esentepe", "Üçkuyular"],
  Gaziemir: ["Sarnıç", "Atıfbey", "Menderes"],
  Narlıdere: ["Çatalkaya", "Atatürk", "Yenikale"],
  Balçova: ["Teleferik", "Çetin Emeç", "Korutürk"],
};
const MARKALAR = ["Nordtek", "Vesta", "Ayaz", "Termika", "Kuzey"];
const CIHAZLAR: Record<string, { arizalar: string[]; ucret: number; uzman: string }> = {
  Klima: { arizalar: ["Soğutmuyor", "Su akıtıyor", "Dış ünite ses yapıyor", "Kumanda çalışmıyor", "Yıllık bakım"], ucret: 1450, uzman: "Klima" },
  Kombi: { arizalar: ["Sıcak su gelmiyor", "Basınç düşüyor", "Hata kodu veriyor", "Yıllık bakım"], ucret: 1250, uzman: "Kombi" },
  Buzdolabı: { arizalar: ["Soğutmuyor", "Buzlanma yapıyor", "Ses yapıyor"], ucret: 1350, uzman: "Beyaz eşya" },
  "Çamaşır makinesi": { arizalar: ["Su boşaltmıyor", "Sıkma yapmıyor", "Kapı açılmıyor"], ucret: 1150, uzman: "Beyaz eşya" },
  "Bulaşık makinesi": { arizalar: ["Kurutmuyor", "Su almıyor", "Hata kodu veriyor"], ucret: 1100, uzman: "Beyaz eşya" },
};
const CIHAZ_ADLARI = Object.keys(CIHAZLAR);
const ARALIKLAR = ["09.00 ile 12.00", "12.00 ile 15.00", "15.00 ile 18.00"];
const ARALIK_BAS = [9, 12, 15];
const TEKNISYENLER: [string, string[], string][] = [
  ["Ozan Kaya", ["Karşıyaka", "Çiğli", "Bayraklı"], "Klima"],
  ["Emre Şahin", ["Bornova", "Bayraklı"], "Kombi"],
  ["Murat Doğan", ["Buca", "Karabağlar"], "Beyaz eşya"],
  ["Barış Öztürk", ["Konak", "Balçova", "Narlıdere"], "Klima"],
  ["Uğur Kılıç", ["Gaziemir", "Buca"], "Kombi"],
  ["Kerem Aslan", ["Karşıyaka", "Bornova"], "Beyaz eşya"],
  ["Hakan Polat", ["Karabağlar", "Konak"], "Kombi"],
  ["Cem Arslan", ["Çiğli", "Narlıdere", "Balçova"], "Beyaz eşya"],
];
const PARCALAR: [string, string, number, number][] = [
  ["Klima gazı R32, 1 kg", "Klima", 950, 10],
  ["Klima fan motoru", "Klima", 2400, 3],
  ["Klima kartı, iç ünite", "Klima", 3100, 2],
  ["Klima drenaj pompası", "Klima", 850, 4],
  ["Kumanda, evrensel", "Klima", 420, 6],
  ["Kombi genleşme tankı", "Kombi", 1650, 3],
  ["Kombi üç yollu vana", "Kombi", 1900, 3],
  ["Kombi basınç sensörü", "Kombi", 520, 6],
  ["Kombi ateşleme elektrodu", "Kombi", 310, 8],
  ["Kombi sirkülasyon pompası", "Kombi", 3600, 2],
  ["Buzdolabı termostatı", "Buzdolabı", 640, 5],
  ["Buzdolabı fan motoru", "Buzdolabı", 980, 4],
  ["Buzdolabı defrost rezistansı", "Buzdolabı", 720, 4],
  ["Kapı contası, buzdolabı", "Buzdolabı", 560, 4],
  ["Çamaşır makinesi pompası", "Çamaşır makinesi", 690, 6],
  ["Çamaşır makinesi kömürü", "Çamaşır makinesi", 240, 10],
  ["Kapı kilidi, çamaşır makinesi", "Çamaşır makinesi", 480, 6],
  ["Rulman takımı", "Çamaşır makinesi", 1150, 3],
  ["Bulaşık makinesi pompası", "Bulaşık makinesi", 820, 4],
  ["Bulaşık makinesi rezistansı", "Bulaşık makinesi", 990, 4],
  ["Su giriş ventili", "Bulaşık makinesi", 380, 6],
];

/* ---------------- Yardımcılar ---------------- */

const DURUM: Record<string, Durum> = {
  yeni: { ad: "Atanmadı", renk: "kirmizi" },
  atandi: { ad: "Atandı", renk: "mavi" },
  yolda: { ad: "Yolda", renk: "mor" },
  islemde: { ad: "İşlemde", renk: "sari" },
  parca: { ad: "Parça bekliyor", renk: "sari" },
  tamam: { ad: "Tamamlandı", renk: "yesil" },
  iptal: { ad: "İptal", renk: "gri" },
};
const ACIK = ["yeni", "atandi", "yolda", "islemde", "parca"];
const teknisyenAdi = (api: PanelApi, id?: string) => (id ? api.bul("teknisyenler", id)?.ad ?? "Teknisyen" : "Atanmadı");
const randevuGunu = (k: Kayit) => k.randevu.gun as number;
const randevuYaz = (k: Kayit, api: PanelApi) => `${gunAdi(k.randevu.gun, api.ani)}, ${ARALIKLAR[k.randevu.aralik]}`;
const bugunMu = (k: Kayit, api: PanelApi) => randevuGunu(k) === gunBasi(api.ani);

/** Bölgesi tutan ve bugün en az işi olan teknisyen. */
function onerilen(api: PanelApi, k: Kayit) {
  const yuk = (t: Kayit) => api.veri.talepler.filter((x) => x.teknisyenId === t.id && randevuGunu(x) === randevuGunu(k) && ACIK.concat("tamam").includes(x.durum)).length;
  return [...api.veri.teknisyenler].sort((a, b) => {
    const puan = (t: Kayit) => (t.bolgeler.includes(k.ilce) ? 0 : 10) + (t.uzman === CIHAZLAR[k.cihaz].uzman ? 0 : 3) + yuk(t);
    return puan(a) - puan(b);
  });
}

/* ---------------- Veri üretimi ---------------- */

function uret(ani: Date, r: Rastgele): Veri {
  const simdi = ani.getTime();
  const bugun = gunBasi(simdi);
  const tKisi = kisiler(r, 8);
  const teknisyenler: Kayit[] = TEKNISYENLER.map(([ad, bolgeler, uzman], i) => ({ id: `t${i + 1}`, ad, bolgeler, uzman, telefon: tKisi[i].telefon, puan: Math.round((4.2 + r.kesir() * 0.75) * 10) / 10, gecmis: [] }));

  const parcalar: Kayit[] = PARCALAR.map(([ad, cihaz, fiyat, kritik], i) => ({
    id: `p${i + 1}`,
    ad,
    cihaz,
    fiyat,
    kritik,
    kod: `EGE${kod(cihaz).slice(0, 3)}${300 + i}`,
    depo: r.tam(Math.floor(kritik / 2), kritik * 4),
    arac: Object.fromEntries(teknisyenler.map((t) => [t.id, CIHAZLAR[cihaz].uzman === t.uzman ? r.tam(0, 3) : r.olasilik(0.2) ? 1 : 0])),
    gecmis: [],
  }));
  r.karistir([...parcalar]).slice(0, 3).forEach((p) => (p.depo = r.tam(0, Math.floor(p.kritik / 3))));

  const musteri = kisiler(r, 500);
  const talepler: Kayit[] = [];
  const garanti: Kayit[] = [];
  let no = 2800;
  for (let g = -30; g <= 3; g++) {
    const gun = bugun + g * GUN;
    if (new Date(gun).getDay() === 0) continue;
    // Sekiz teknisyen günde dörder beşer iş yapar; ileri tarihli randevular daha azdır.
    const gelecek = g > 0 ? 1 - g * 0.28 : 1;
    const adet = Math.round((new Date(gun).getDay() === 6 ? r.tam(14, 20) : r.tam(28, 36)) * gelecek);
    const gunIsleri: Kayit[] = [];
    for (let i = 0; i < adet; i++) {
      const cihaz = r.agirlikli([["Klima", 34], ["Kombi", 26], ["Buzdolabı", 14], ["Çamaşır makinesi", 16], ["Bulaşık makinesi", 10]] as const);
      const ilce = r.sec(ILCELER);
      const m = r.sec(musteri);
      const garantili = r.olasilik(0.55);
      const t: Kayit = {
        id: "",
        musteri: m.tamAd,
        telefon: m.telefon,
        ilce,
        mahalle: r.sec(MAHALLE[ilce]),
        cihaz,
        marka: r.sec(MARKALAR),
        ariza: r.sec(CIHAZLAR[cihaz].arizalar),
        garanti: garantili,
        oncelik: r.olasilik(0.12) ? "Acil" : "Normal",
        kaynak: r.agirlikli([["Çağrı merkezi", 45], ["Site formu", 25], ["Bayi", 15], ["WhatsApp", 15]] as const),
        t: Math.min(gun - r.tam(4, 40) * SAAT, simdi - 20 * DAKIKA),
        randevu: { gun, aralik: r.tam(0, 2) },
        teknisyenId: "",
        durum: "yeni",
        ucret: garantili ? 0 : CIHAZLAR[cihaz].ucret,
        ilkSeferde: true,
        puan: 0,
        gecmis: [] as { t: number; m: string }[],
      };
      t.gecmis.push({ t: t.t, m: `Talep açıldı, ${t.kaynak}` });
      if (g < 0 || r.olasilik(g === 0 ? 0.94 : g === 1 ? 0.82 : 0.55)) {
        // Bölgesindeki teknisyenlerden o gün en az işi olana verilir.
        const uygun = teknisyenler.filter((x) => x.bolgeler.includes(ilce));
        const aday = (uygun.length ? uygun : teknisyenler).sort((a, b) => gunIsleri.filter((x) => x.teknisyenId === a.id).length - gunIsleri.filter((x) => x.teknisyenId === b.id).length)[0];
        t.teknisyenId = aday.id;
        t.durum = "atandi";
        t.gecmis.unshift({ t: Math.min(t.t + r.tam(10, 90) * DAKIKA, simdi - 10 * DAKIKA), m: `${aday.ad} atandı` });
      }
      gunIsleri.push(t);
    }
    // Numaralar talebin açılış sırasına göre.
    gunIsleri.sort((a, b) => a.t - b.t).forEach((t) => (t.id = `S${++no}`));

    // Her teknisyenin günü sırayla: bir iş bitince yola çıkar, sıradaki aralığa gider.
    for (const tk of teknisyenler) {
      let saatT = gun + 8.75 * SAAT;
      for (const t of gunIsleri.filter((x) => x.teknisyenId === tk.id).sort((a, b) => a.randevu.aralik - b.randevu.aralik)) {
        if (g < 0 && r.olasilik(0.03)) {
          t.durum = "iptal";
          t.gecmis.unshift({ t: gun + 8 * SAAT, m: "Müşteri iptal etti" });
          continue;
        }
        const yolaT = Math.max(saatT, gun + ARALIK_BAS[t.randevu.aralik] * SAAT - 30 * DAKIKA) + r.tam(0, 15) * DAKIKA;
        const basT = yolaT + r.tam(20, 40) * DAKIKA;
        const bitT = basT + r.tam(35, 80) * DAKIKA;
        saatT = bitT;
        if (bitT <= simdi) {
          t.gecmis.unshift({ t: basT, m: "İşleme başlandı" }, { t: yolaT, m: "Teknisyen yola çıktı, müşteriye SMS gitti" });
          t.gecmis = [t.gecmis[0], t.gecmis[1], ...t.gecmis.slice(2)];
          if (r.olasilik(g < -3 ? 0.03 : 0.1)) {
            t.durum = "parca";
            t.ilkSeferde = false;
            t.gecmis.unshift({ t: bitT, m: "Parça gerekiyor, sipariş açıldı" });
          } else {
            t.durum = "tamam";
            t.ilkSeferde = r.olasilik(0.82);
            t.puan = r.agirlikli([[5, 62], [4, 25], [3, 9], [2, 4]] as const);
            t.bitis = bitT;
            t.gecmis.unshift({ t: bitT, m: t.ilkSeferde ? "Tamamlandı, ilk ziyarette çözüldü" : "Tamamlandı, ikinci ziyarette çözüldü" });
            if (t.garanti && simdi - bitT < 30 * GUN) {
              const yas = (simdi - bitT) / GUN;
              garanti.push({ id: `G${t.id.slice(1)}`, talepId: t.id, marka: t.marka, cihaz: t.cihaz, tutar: Math.round((650 + r.tam(0, 1800)) / 10) * 10, t: bitT, durum: yas < 3 ? "hazir" : yas < 10 ? r.sec(["gonderildi", "onaylandi"]) : r.agirlikli([["odendi", 80], ["red", 8], ["onaylandi", 12]] as const) });
            }
          }
        } else if (basT <= simdi) {
          t.durum = "islemde";
          t.gecmis.unshift({ t: basT, m: "İşleme başlandı" }, { t: yolaT, m: "Teknisyen yola çıktı, müşteriye SMS gitti" });
        } else if (yolaT <= simdi) {
          t.durum = "yolda";
          t.gecmis.unshift({ t: yolaT, m: "Teknisyen yola çıktı, müşteriye SMS gitti" });
        }
      }
    }
    talepler.push(...gunIsleri);
  }
  return { teknisyenler, parcalar, talepler: talepler.sort((a, b) => b.t - a.t), garanti: garanti.sort((a, b) => b.t - a.t) };
}

/* ---------------- İş detayı ve eylemleri ---------------- */

function IsDetayi({ k, api }: { k: Kayit; api: PanelApi }) {
  const [secilen, setSecilen] = useState("");
  const oneri = onerilen(api, k).slice(0, 3);
  return (
    <>
      <Bolum baslik="Arıza">
        <AlanListesi
          alanlar={[
            ["Cihaz", `${k.marka} ${k.cihaz.toLocaleLowerCase("tr")}`],
            ["Arıza", k.ariza],
            ["Kapsam", k.garanti ? "Garantili" : `Ücretli, ${tl(k.ucret)}`],
            ["Öncelik", k.oncelik],
            ["Randevu", randevuYaz(k, api)],
            ["Kaynak", k.kaynak],
          ]}
        />
      </Bolum>
      <Bolum baslik="Müşteri">
        <AlanListesi alanlar={[["Ad", k.musteri], ["Telefon", k.telefon], ["Adres", `${k.mahalle}, ${k.ilce}`]]} />
      </Bolum>
      <Bolum baslik="Teknisyen">
        {k.teknisyenId ? (
          <p className="flex items-center gap-2.5 text-[13px]">
            <Harf metin={bas(teknisyenAdi(api, k.teknisyenId))} renk={isimRengi(teknisyenAdi(api, k.teknisyenId))} yumusak boy={28} />
            {teknisyenAdi(api, k.teknisyenId)}
          </p>
        ) : (
          <>
            <p className="mb-2 text-[12px] text-[var(--ms)]">Önerilenler bölgeye, uzmanlığa ve o günkü iş yüküne göre sıralı.</p>
            <ul className="space-y-1.5">
              {oneri.map((t, i) => {
                const yuk = api.veri.talepler.filter((x) => x.teknisyenId === t.id && randevuGunu(x) === randevuGunu(k) && x.durum !== "iptal").length;
                return (
                  <li key={t.id}>
                    <label className={`flex cursor-pointer items-center gap-2.5 rounded-lg border p-2.5 text-[12.5px] ${secilen === t.id || (!secilen && i === 0) ? "border-[var(--p)]" : "border-[var(--k)]"}`}>
                      <input type="radio" name="teknisyen" className="sr-only" checked={secilen === t.id || (!secilen && i === 0)} onChange={() => setSecilen(t.id)} />
                      <Harf metin={bas(t.ad)} renk={isimRengi(t.ad)} yumusak boy={28} />
                      <span className="min-w-0 flex-1">
                        <span className="block font-medium">{t.ad}</span>
                        <span className="block text-[11.5px] text-[var(--ms)]">
                          {t.bolgeler.includes(k.ilce) ? `${k.ilce} bölgesinde` : "Bölge dışı"}, {t.uzman.toLocaleLowerCase("tr")}, o gün {yuk} iş
                        </span>
                      </span>
                    </label>
                  </li>
                );
              })}
            </ul>
            <Dugme
              tur="ana"
              ikon={IconUserCheck}
              className="mt-3"
              onClick={() => {
                const t = api.bul("teknisyenler", secilen || oneri[0].id)!;
                api.guncelle("talepler", k.id, { teknisyenId: t.id, durum: "atandi" }, `${t.ad} atandı, ${KULLANICI.ad}`);
                api.haber(`İş ${t.ad} için telefonuna düştü. Müşteriye randevu SMS ile bildirildi.`, "basari");
                api.olay("atama");
              }}
            >
              Ata
            </Dugme>
          </>
        )}
      </Bolum>
      <Bolum baslik="Geçmiş">
        <Gecmis satirlar={k.gecmis.map((g: Kayit) => ({ zaman: zaman(g.t, api.ani), metin: g.m }))} />
      </Bolum>
    </>
  );
}

const durumDegistir = (durum: string, not: string, haber: string, olay?: string) => (k: Kayit, api: PanelApi) => {
  const ek: Kayit = { id: k.id, durum };
  if (durum === "tamam") {
    ek.bitis = api.ani.getTime();
    if (k.garanti) api.ekle("garanti", { id: `G${k.id.slice(1)}`, talepId: k.id, marka: k.marka, cihaz: k.cihaz, tutar: 1100, t: api.ani.getTime(), durum: "hazir" });
  }
  api.guncelle("talepler", k.id, ek, not);
  api.haber(k.garanti && durum === "tamam" ? `${haber} Garanti hakediş talebi hazırlandı.` : haber, "basari");
  if (olay) api.olay(olay);
};

const IS_EYLEMLERI: Eylem[] = [
  { ad: "Yola çıktı", tur: "ana", ikon: IconCar, gorunur: (k) => k.durum === "atandi", uygula: durumDegistir("yolda", "Teknisyen yola çıktı", "Müşteriye teknisyenin yolda olduğu bildirildi.") },
  { ad: "İşleme başla", tur: "ana", ikon: IconPlayerPlay, gorunur: (k) => k.durum === "yolda", uygula: durumDegistir("islemde", "İşleme başlandı", "İş işlemde.") },
  { ad: "Tamamlandı", tur: "ana", ikon: IconCheck, gorunur: (k) => ["islemde", "parca"].includes(k.durum), uygula: durumDegistir("tamam", "Tamamlandı, müşteri imzaladı", "İş kapandı, memnuniyet anketi gönderildi.", "is-tamam") },
  { ad: "Parça bekliyor", ikon: IconPackage, gorunur: (k) => k.durum === "islemde", uygula: durumDegistir("parca", "Parça gerekiyor, sipariş açıldı", "İş parça bekliyor durumuna geçti, parça siparişi açıldı.") },
  { ad: "İptal et", tur: "tehlike", ikon: IconX, gorunur: (k) => ["yeni", "atandi"].includes(k.durum), uygula: durumDegistir("iptal", `İptal edildi, ${KULLANICI.ad}`, "Talep iptal edildi.") },
];

/* ---------------- Dispeç panosu ---------------- */

function Pano({ api, modul }: { api: PanelApi; modul: ModulBilgi }) {
  const [secili, setSecili] = useState<string | null>(null);
  const [gun, setGun] = useState(0);
  const hedef = gunBasi(api.ani) + gun * GUN;
  const isler = api.veri.talepler.filter((k) => randevuGunu(k) === hedef && k.durum !== "iptal");
  const atanmamis = api.veri.talepler.filter((k) => k.durum === "yeni" && randevuGunu(k) <= hedef + 2 * GUN);
  const k = secili ? api.bul("talepler", secili) : null;
  const eylemler = k ? IS_EYLEMLERI.filter((e) => !e.gorunur || e.gorunur(k, api)) : [];

  const Kartcik = ({ x }: { x: Kayit }) => (
    <button type="button" onClick={() => setSecili(x.id)} className="block w-full rounded-lg border border-[var(--k)] bg-[var(--kart2)] p-2.5 text-left transition-colors hover:border-[var(--p)]" style={{ borderLeft: `3px solid ${RENK[DURUM[x.durum].renk]}` }}>
      <span className="flex items-center justify-between gap-2">
        <span className="text-[11px] tabular-nums text-[var(--ms)]">{ARALIKLAR[x.randevu.aralik]}</span>
        {x.oncelik === "Acil" && <span className="text-[10.5px] font-bold text-[var(--kirmizi)]">Acil</span>}
      </span>
      <span className="mt-1 block truncate text-[12.5px] font-semibold">{x.musteri}</span>
      <span className="block truncate text-[11.5px] text-[var(--ms)]">
        {x.cihaz}, {x.ilce}
      </span>
      <span className="mt-1.5 block">
        <DurumYazi d={DURUM[x.durum]} kucuk />
      </span>
    </button>
  );

  return (
    <>
      <EkranBasligi modul={modul}>
        <div role="group" aria-label="Gün" className="flex rounded-lg border border-[var(--k)] p-0.5">
          {[0, 1].map((g) => (
            <button key={g} type="button" aria-pressed={gun === g} onClick={() => setGun(g)} className={`h-8 rounded-md px-3 text-[12.5px] font-medium ${gun === g ? "bg-[var(--p)] text-white" : "text-[var(--ms)] hover:text-[var(--m)]"}`}>
              {g === 0 ? "Bugün" : "Yarın"}
            </button>
          ))}
        </div>
      </EkranBasligi>
      <div className="overflow-x-auto pb-2">
        <div className="flex min-w-max gap-3">
          <section className="w-56 shrink-0 rounded-xl border border-dashed border-[var(--kirmizi)] bg-[var(--kart)] p-2.5">
            <header className="mb-2 flex items-center justify-between px-1">
              <h3 className="text-[12.5px] font-semibold text-[var(--kirmizi)]">Atanmamış</h3>
              <span className="text-[12px] tabular-nums text-[var(--ms)]">{atanmamis.length}</span>
            </header>
            <div className="space-y-2">
              {atanmamis.length ? atanmamis.map((x) => <Kartcik key={x.id} x={x} />) : <p className="px-1 py-4 text-[12px] text-[var(--ms)]">Atanmayı bekleyen iş yok.</p>}
            </div>
          </section>
          {api.veri.teknisyenler.map((t) => {
            const onun = isler.filter((x) => x.teknisyenId === t.id).sort((a, b) => a.randevu.aralik - b.randevu.aralik);
            const biten = onun.filter((x) => x.durum === "tamam").length;
            return (
              <section key={t.id} className="w-56 shrink-0 rounded-xl border border-[var(--k)] bg-[var(--kart)] p-2.5">
                <header className="mb-2 px-1">
                  <div className="flex items-center gap-2">
                    <Harf metin={bas(t.ad)} renk={isimRengi(t.ad)} yumusak boy={26} />
                    <span className="min-w-0">
                      <span className="block truncate text-[12.5px] font-semibold">{t.ad}</span>
                      <span className="block truncate text-[10.5px] text-[var(--ms)]">{t.bolgeler.join(", ")}</span>
                    </span>
                  </div>
                  <div className="mt-2 flex items-center gap-2">
                    <Cubuk oran={onun.length ? biten / onun.length : 0} ince />
                    <span className="shrink-0 text-[10.5px] tabular-nums text-[var(--ms)]">
                      {biten} ile {onun.length}
                    </span>
                  </div>
                </header>
                <div className="space-y-2">
                  {onun.length ? onun.map((x) => <Kartcik key={x.id} x={x} />) : <p className="px-1 py-4 text-[12px] text-[var(--ms)]">Bu gün için işi yok.</p>}
                </div>
              </section>
            );
          })}
        </div>
      </div>
      <Cekmece acik={!!k} kapat={() => setSecili(null)}>
        {k && (
          <>
            <header className="flex items-start justify-between gap-3 border-b border-[var(--k)] px-5 py-4">
              <div>
                <h3 className="text-[17px] font-bold">
                  İş {k.id}, {k.musteri}
                </h3>
                <p className="mt-0.5 text-[12.5px] text-[var(--ms)]">
                  {k.cihaz}, {k.ilce}
                </p>
                <div className="mt-2">
                  <DurumYazi d={DURUM[k.durum]} />
                </div>
              </div>
              <button type="button" onClick={() => setSecili(null)} aria-label="Kapat" className="flex h-8 w-8 items-center justify-center rounded-lg text-[var(--ms)] hover:bg-[var(--k2)]">
                <IconX size={18} />
              </button>
            </header>
            <div className="min-h-0 flex-1 overflow-y-auto">
              <IsDetayi k={k} api={api} />
            </div>
            {eylemler.length > 0 && (
              <footer className="flex flex-wrap gap-2 border-t border-[var(--k)] px-5 py-3">
                {eylemler.map((e) => (
                  <Dugme key={e.ad} tur={e.tur ?? "normal"} ikon={e.ikon} onClick={() => e.uygula(k, api)}>
                    {e.ad}
                  </Dugme>
                ))}
              </footer>
            )}
          </>
        )}
      </Cekmece>
    </>
  );
}

function AracaGonder({ p, api }: { p: Kayit; api: PanelApi }) {
  const [tek, setTek] = useState(api.veri.teknisyenler[0].id);
  const [adet, setAdet] = useState("2");
  const n = Math.floor(Number(adet));
  return (
    <div className="flex flex-wrap items-end gap-2">
      <label className="block min-w-0 flex-1">
        <span className="text-[11.5px] text-[var(--ms)]">Teknisyen</span>
        <select value={tek} onChange={(e) => setTek(e.target.value)} className="mt-1 h-9 w-full rounded-lg border border-[var(--k)] bg-[var(--kart)] px-2 text-[13px] outline-none">
          {api.veri.teknisyenler.map((t) => (
            <option key={t.id} value={t.id}>
              {t.ad}, araçta {p.arac[t.id] ?? 0}
            </option>
          ))}
        </select>
      </label>
      <label className="block w-20">
        <span className="text-[11.5px] text-[var(--ms)]">Adet</span>
        <input value={adet} inputMode="numeric" onChange={(e) => setAdet(e.target.value)} className="mt-1 h-9 w-full rounded-lg border border-[var(--k)] bg-transparent px-3 text-[13px] tabular-nums outline-none focus:border-[var(--p)] focus-visible:outline-none" />
      </label>
      <Dugme
        tur="ana"
        ikon={IconSend}
        disabled={!(n > 0 && n <= p.depo)}
        onClick={() => {
          const t = api.bul("teknisyenler", tek)!;
          api.guncelle("parcalar", p.id, { depo: p.depo - n, arac: { ...p.arac, [tek]: (p.arac[tek] ?? 0) + n } }, `${n} adet ${t.ad} aracına verildi`);
          api.haber(`${n} adet ${p.ad} ${t.ad} aracına verildi`, "basari");
          api.olay("parca-arac");
        }}
      >
        Araca ver
      </Dugme>
    </div>
  );
}

/* ---------------- Ekranlar ---------------- */

function uyarilar(api: PanelApi) {
  const liste: ReturnType<SektorPanel["uyarilar"]> = [];
  const s = api.ani.getTime();
  const atanmamis = api.veri.talepler.filter((k) => k.durum === "yeni").length;
  const acil = api.veri.talepler.filter((k) => k.durum === "yeni" && k.oncelik === "Acil").length;
  const parca = api.veri.talepler.filter((k) => k.durum === "parca").length;
  const kritik = api.veri.parcalar.filter((p) => p.depo < p.kritik).length;
  const hazir = api.veri.garanti.filter((g) => g.durum === "hazir").length;
  const gecikmis = api.veri.talepler.filter((k) => ["atandi", "yolda"].includes(k.durum) && randevuGunu(k) === gunBasi(s) && gunBasi(s) + (ARALIK_BAS[k.randevu.aralik] + 3) * SAAT < s).length;
  if (atanmamis) liste.push({ metin: `${atanmamis} talep atanmayı bekliyor${acil ? `, ${acil} tanesi acil` : ""}`, modul: "talepler", filtre: "Durum=Atanmamış", renk: "kirmizi" });
  if (gecikmis) liste.push({ metin: `${gecikmis} işin randevu aralığı geçti, teknisyen henüz başlamadı`, modul: "pano", renk: "kirmizi" });
  if (parca) liste.push({ metin: `${parca} iş parça bekliyor`, modul: "talepler", filtre: "Durum=Parça bekliyor", renk: "sari" });
  if (kritik) liste.push({ metin: `${kritik} parça depoda kritik seviyenin altında`, modul: "parcalar", filtre: "Stok=Kritik", renk: "sari" });
  if (hazir) liste.push({ metin: `${hazir} garanti hakediş talebi markaya gönderilmeyi bekliyor`, modul: "garanti", filtre: "Durum=Gönderilecek", renk: "mavi" });
  return liste;
}

const otuzGun = (api: PanelApi) => api.veri.talepler.filter((k) => k.durum === "tamam" && k.bitis > api.ani.getTime() - 30 * GUN);

const ozet = ozetEkrani({
  kullanici: KULLANICI.ad,
  uyarilar,
  karsilama: (api) => {
    const bugun = api.veri.talepler.filter((k) => bugunMu(k, api) && k.durum !== "iptal");
    return `Bugün ${bugun.length} işin ${bugun.filter((k) => k.durum === "tamam").length} tanesi bitti, ${bugun.filter((k) => ["yolda", "islemde"].includes(k.durum)).length} teknisyen şu an sahada.`;
  },
  sayilar: (api) => {
    const acik = api.veri.talepler.filter((k) => ACIK.includes(k.durum));
    const bugun = api.veri.talepler.filter((k) => bugunMu(k, api) && k.durum !== "iptal");
    const tamam = otuzGun(api);
    const ilk = tamam.filter((k) => k.ilkSeferde).length / Math.max(1, tamam.length);
    const alacak = api.veri.garanti.filter((g) => ["hazir", "gonderildi", "onaylandi"].includes(g.durum)).reduce((t, g) => t + g.tutar, 0);
    const s = gunBasi(api.ani);
    return [
      { ad: "Açık talep", deger: String(acik.length), alt: `${acik.filter((k) => k.durum === "yeni").length} tanesi atanmadı`, not: "Tamamlanmamış ve iptal edilmemiş bütün talepler. Parça bekleyenler de dahil.", git: () => api.git("talepler", { filtre: "Durum=Açık" }) },
      {
        ad: "Bugünün işleri",
        deger: String(bugun.length),
        alt: `${bugun.filter((k) => k.durum === "tamam").length} tamamlandı`,
        not: "Randevusu bugüne verilmiş işler. Dispeç panosunda teknisyen teknisyen görünür.",
        git: () => api.git("pano"),
        seri: Array.from({ length: 14 }, (_, i) => api.veri.talepler.filter((k) => k.durum === "tamam" && randevuGunu(k) === s - (14 - i) * GUN).length),
      },
      { ad: "İlk seferde çözüm, 30 gün", deger: sayi(ilk * 100), birim: "yüzde", renk: ilk > 0.8 ? "yesil" : "sari", alt: `${tamam.length} tamamlanan işte`, not: "Teknisyenin ilk ziyarette çözdüğü işlerin oranı. Parça beklemek ya da ikinci ziyaret gerektiren işler düşürür." },
      { ad: "Garanti alacağı", deger: tlKisa(alacak), alt: "Gönderilecek, gönderilen ve onaylanan", not: "Markaya gönderilmeyi bekleyen ya da gönderilmiş ama henüz ödenmemiş garanti hakedişlerinin toplamı.", git: () => api.git("garanti") },
    ];
  },
  ana: {
    baslik: "Günlük tamamlanan iş, son 14 gün",
    icerik: (api) => {
      const bugun = gunBasi(api.ani);
      const veri = Array.from({ length: 15 }, (_, i) => {
        const g = bugun - (14 - i) * GUN;
        const d = new Date(g);
        return { etiket: i === 14 ? "Bugün" : `${d.getDate()}`, uzunEtiket: i === 14 ? `Bugün, saat ${saat(api.ani)} itibarıyla` : `${tarih(g)} ${GUN_KISA[d.getDay()]}`, deger: api.veri.talepler.filter((k) => k.durum === "tamam" && randevuGunu(k) === g).length, kismi: i === 14 };
      });
      return <CubukGrafik veri={veri} bicim={(n) => `${n} iş`} ozet="Pazar günleri servis kapalı" />;
    },
  },
  parcalar: [
    {
      baslik: "Cihaza göre arıza, 30 gün",
      icerik: (api) => {
        const l = otuzGun(api);
        const dilimler = CIHAZ_ADLARI.map((c, i) => ({ ad: c, renk: ["vurgu", "mavi", "mor", "sari", "yesil"][i], deger: l.filter((k) => k.cihaz === c).length }));
        return <HalkaGrafik dilimler={dilimler} bicim={(n) => `${n} iş`} merkez={String(l.length)} />;
      },
    },
    {
      baslik: "Bugün sahadakiler",
      icerik: (api) => (
        <ul className="space-y-2.5">
          {api.veri.teknisyenler.map((t) => {
            const onun = api.veri.talepler.filter((k) => k.teknisyenId === t.id && bugunMu(k, api) && k.durum !== "iptal");
            const simdi = onun.find((k) => ["yolda", "islemde"].includes(k.durum));
            return (
              <li key={t.id}>
                <button type="button" onClick={() => api.git("pano")} className="flex w-full items-center gap-2.5 text-left">
                  <Harf metin={bas(t.ad)} renk={isimRengi(t.ad)} yumusak boy={26} />
                  <span className="min-w-0 flex-1">
                    <span className="flex justify-between gap-2 text-[12.5px]">
                      <span className="truncate">{t.ad}</span>
                      <span className="shrink-0 tabular-nums text-[var(--ms)]">
                        {onun.filter((k) => k.durum === "tamam").length} ile {onun.length}
                      </span>
                    </span>
                    <span className="block truncate text-[11px]" style={{ color: simdi ? RENK[DURUM[simdi.durum].renk] : "var(--ms)" }}>
                      {simdi ? `${DURUM[simdi.durum].ad}, ${simdi.ilce}` : "Şu an sahada değil"}
                    </span>
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
      ),
    },
  ],
});

const panel: SektorPanel = {
  saat: { acilis: 8.5, kapanis: 19, yogun: 11.5 },
  kullanici: KULLANICI,
  uret,
  uyarilar,
  moduller: [
    { id: "ozet", grup: "Genel", ekran: ozet },
    {
      id: "talepler",
      grup: "Servis",
      rozet: (api) => api.veri.talepler.filter((k) => k.durum === "yeni").length,
      ekran: {
        tur: "liste",
        koleksiyon: "talepler",
        baslikAdi: "Talep",
        baslik: (k) => `İş ${k.id}, ${k.musteri}`,
        alt: (k) => `${k.marka} ${k.cihaz.toLocaleLowerCase("tr")}, ${k.ariza.toLocaleLowerCase("tr")}`,
        harf: (k) => k.musteri,
        durum: (k) => DURUM[k.durum],
        arama: (k) => `${k.telefon} ${k.ilce} ${k.mahalle} ${k.marka} ${k.cihaz}`,
        sira: (a, b) => (a.durum === "yeni" ? 0 : 1) - (b.durum === "yeni" ? 0 : 1) || b.randevu.gun - a.randevu.gun || a.randevu.aralik - b.randevu.aralik,
        sutunlar: [
          { ad: "Randevu", deger: (k, api) => randevuYaz(k, api), sirala: (k) => k.randevu.gun + k.randevu.aralik, oncelik: 1 },
          { ad: "İlçe", deger: (k) => k.ilce, sirala: (k) => k.ilce, oncelik: 2 },
          { ad: "Teknisyen", deger: (k, api) => teknisyenAdi(api, k.teknisyenId), oncelik: 2 },
          { ad: "Kapsam", deger: (k) => (k.garanti ? "Garantili" : tl(k.ucret)), oncelik: 3 },
        ],
        filtreler: [
          {
            ad: "Durum",
            secenekler: [
              { ad: "Açık", kosul: (k) => ACIK.includes(k.durum) },
              { ad: "Atanmamış", kosul: (k) => k.durum === "yeni" },
              { ad: "Bugün", kosul: (k, api) => bugunMu(k, api) },
              { ad: "Parça bekliyor", kosul: (k) => k.durum === "parca" },
              { ad: "Tamamlandı", kosul: (k) => k.durum === "tamam" },
            ],
          },
          { ad: "Cihaz", secenekler: CIHAZ_ADLARI.map((c) => ({ ad: c, kosul: (k: Kayit) => k.cihaz === c })) },
          { ad: "Kapsam", secenekler: [{ ad: "Garantili", kosul: (k) => k.garanti }, { ad: "Ücretli", kosul: (k) => !k.garanti }] },
        ],
        ozet: (api) => {
          const l = api.veri.talepler;
          return [
            { ad: "Atanmamış", deger: String(l.filter((k) => k.durum === "yeni").length), renk: "kirmizi" },
            { ad: "Sahada", deger: String(l.filter((k) => ["yolda", "islemde"].includes(k.durum)).length), renk: "mor" },
            { ad: "Parça bekliyor", deger: String(l.filter((k) => k.durum === "parca").length), renk: "sari" },
            { ad: "Müşteri puanı, 30 gün", deger: sayi(otuzGun(api).reduce((t, k) => t + k.puan, 0) / Math.max(1, otuzGun(api).length), 1), not: "5 üzerinden" },
          ];
        },
        detay: { bolumler: (k, api) => <IsDetayi key={k.id + k.durum} k={k} api={api} />, eylemler: IS_EYLEMLERI },
        yeni: {
          baslik: "Yeni servis talebi",
          dugme: "Talebi aç",
          alanlar: [
            { ad: "Müşteri", anahtar: "musteri", tur: "metin", varsayilan: "Selin Kara", zorunlu: true },
            { ad: "Telefon", anahtar: "telefon", tur: "metin", varsayilan: "0532 418 22 90" },
            { ad: "İlçe", anahtar: "ilce", tur: "secim", secenekler: ILCELER },
            { ad: "Cihaz", anahtar: "cihaz", tur: "secim", secenekler: CIHAZ_ADLARI },
            { ad: "Arıza", anahtar: "ariza", tur: "metin", varsayilan: "Soğutmuyor" },
            { ad: "Garanti", anahtar: "garanti", tur: "secim", secenekler: ["Garantili", "Ücretli"] },
          ],
          olustur: (d, api) => {
            const s = api.ani.getTime();
            const no = `S${Math.max(...api.veri.talepler.map((k) => Number(k.id.slice(1)))) + 1}`;
            api.ekle("talepler", {
              id: no,
              musteri: d.musteri.trim() || "Yeni müşteri",
              telefon: d.telefon,
              ilce: d.ilce,
              mahalle: MAHALLE[d.ilce][0],
              cihaz: d.cihaz,
              marka: MARKALAR[0],
              ariza: d.ariza || "Arıza bildirimi",
              garanti: d.garanti === "Garantili",
              oncelik: "Normal",
              kaynak: "Çağrı merkezi",
              t: s,
              randevu: { gun: gunBasi(s) + GUN, aralik: 0 },
              teknisyenId: "",
              durum: "yeni",
              ucret: d.garanti === "Garantili" ? 0 : CIHAZLAR[d.cihaz].ucret,
              ilkSeferde: true,
              puan: 0,
              gecmis: [{ t: s, m: `Talep açıldı, ${KULLANICI.ad}` }],
            });
            api.haber("Talep açıldı. Yarın sabah için randevu verildi, müşteriye SMS gitti. Şimdi teknisyen atayın.", "basari");
            api.olay("yeni-talep");
            return no;
          },
        },
      },
    },
    { id: "pano", grup: "Servis", ekran: { tur: "ozel", bilesen: Pano } },
    {
      id: "teknisyenler",
      grup: "Ekip",
      ekran: {
        tur: "liste",
        koleksiyon: "teknisyenler",
        baslikAdi: "Teknisyen",
        baslik: (t) => t.ad,
        alt: (t) => `${t.uzman}, ${t.bolgeler.join(", ")}`,
        harf: (t) => t.ad,
        arama: (t) => `${t.bolgeler.join(" ")} ${t.uzman}`,
        sutunlar: [
          { ad: "Bugün", deger: (t, api) => { const o = api.veri.talepler.filter((k) => k.teknisyenId === t.id && bugunMu(k, api) && k.durum !== "iptal"); return `${o.filter((k) => k.durum === "tamam").length} ile ${o.length}`; }, oncelik: 2 },
          { ad: "Tamamlanan, 30 gün", deger: (t, api) => otuzGun(api).filter((k) => k.teknisyenId === t.id).length, hiza: "sag", oncelik: 2 },
          {
            ad: "İlk seferde",
            deger: (t, api) => {
              const l = otuzGun(api).filter((k) => k.teknisyenId === t.id);
              const o = (l.filter((k) => k.ilkSeferde).length / Math.max(1, l.length)) * 100;
              return <span style={{ color: o < 75 ? RENK.sari : undefined }}>{yuzde(o)}</span>;
            },
            hiza: "sag",
            oncelik: 1,
          },
          { ad: "Puan", deger: (t) => sayi(t.puan, 1), sirala: (t) => t.puan, hiza: "sag", oncelik: 1 },
        ],
        detay: {
          bolumler: (t, api) => {
            const bugun = api.veri.talepler.filter((k) => k.teknisyenId === t.id && bugunMu(k, api) && k.durum !== "iptal").sort((a, b) => a.randevu.aralik - b.randevu.aralik);
            const arac = api.veri.parcalar.filter((p) => (p.arac[t.id] ?? 0) > 0);
            return (
              <>
                <Bolum baslik="Teknisyen">
                  <AlanListesi alanlar={[["Uzmanlık", t.uzman], ["Bölge", t.bolgeler.join(", ")], ["Telefon", t.telefon], ["Müşteri puanı", `${sayi(t.puan, 1)}, 5 üzerinden`]]} />
                </Bolum>
                <Bolum baslik="Bugünün işleri">
                  {bugun.length ? <MiniTablo basliklar={["Aralık", "Müşteri", "Durum"]} satirlar={bugun.map((k) => [ARALIKLAR[k.randevu.aralik], `${k.musteri}, ${k.ilce}`, <DurumYazi d={DURUM[k.durum]} kucuk />])} /> : <p className="text-[12.5px] text-[var(--ms)]">Bugün işi yok.</p>}
                </Bolum>
                <Bolum baslik={`Araç stoğu, ${arac.reduce((s, p) => s + p.arac[t.id], 0)} parça`}>
                  <ul className="space-y-1 text-[12.5px]">
                    {arac.map((p) => (
                      <li key={p.id} className="flex justify-between gap-3">
                        <span className="truncate">{p.ad}</span>
                        <span className="tabular-nums">{p.arac[t.id]}</span>
                      </li>
                    ))}
                  </ul>
                </Bolum>
              </>
            );
          },
        },
      },
    },
    {
      id: "parcalar",
      grup: "Depo",
      rozet: (api) => api.veri.parcalar.filter((p) => p.depo < p.kritik).length,
      ekran: {
        tur: "liste",
        koleksiyon: "parcalar",
        baslikAdi: "Parça",
        baslik: (p) => p.ad,
        alt: (p) => `${p.kod}, ${p.cihaz}`,
        durum: (p) => (p.depo < p.kritik ? { ad: "Kritik", renk: "kirmizi" } : p.depo < p.kritik * 1.5 ? { ad: "Azalıyor", renk: "sari" } : { ad: "Yeterli", renk: "yesil" }),
        arama: (p) => `${p.kod} ${p.cihaz}`,
        sira: (a, b) => a.depo / a.kritik - b.depo / b.kritik,
        sutunlar: [
          { ad: "Depo", deger: (p) => p.depo, sirala: (p) => p.depo, hiza: "sag", oncelik: 1 },
          { ad: "Araçlarda", deger: (p) => Object.values(p.arac as Record<string, number>).reduce((t, n) => t + n, 0), hiza: "sag", oncelik: 1 },
          { ad: "Kritik seviye", deger: (p) => p.kritik, hiza: "sag", oncelik: 3 },
          { ad: "Birim fiyat", deger: (p) => tl(p.fiyat), sirala: (p) => p.fiyat, csv: (p) => p.fiyat, hiza: "sag", oncelik: 2 },
        ],
        filtreler: [
          { ad: "Stok", secenekler: [{ ad: "Kritik", kosul: (p) => p.depo < p.kritik }, { ad: "Azalıyor", kosul: (p) => p.depo >= p.kritik && p.depo < p.kritik * 1.5 }] },
          { ad: "Cihaz", secenekler: CIHAZ_ADLARI.map((c) => ({ ad: c, kosul: (p: Kayit) => p.cihaz === c })) },
        ],
        detay: {
          bolumler: (p, api) => (
            <>
              <Bolum baslik="Stok">
                <AlanListesi alanlar={[["Depo", `${p.depo} adet`], ["Kritik seviye", `${p.kritik} adet`], ["Birim fiyat", tl(p.fiyat)], ["Cihaz", p.cihaz]]} />
              </Bolum>
              <Bolum baslik="Araçlardaki">
                <MiniTablo basliklar={["Teknisyen", "Adet"]} sagdakiler={[1]} satirlar={api.veri.teknisyenler.map((t) => [t.ad, p.arac[t.id] ?? 0])} />
              </Bolum>
              <Bolum baslik="Araca parça ver">
                <AracaGonder key={p.depo} p={p} api={api} />
              </Bolum>
              <Bolum baslik="Geçmiş">
                <Gecmis satirlar={p.gecmis.map((g: Kayit) => ({ zaman: zaman(g.t, api.ani), metin: g.m }))} />
              </Bolum>
            </>
          ),
          eylemler: [
            {
              ad: "Tedarikçiden sipariş et",
              tur: "ana",
              gorunur: (p) => p.depo < p.kritik * 1.5,
              uygula: (p, api) => {
                api.guncelle("parcalar", p.id, {}, `${p.kritik * 3} adet sipariş verildi`);
                api.haber(`${p.kritik * 3} adet ${p.ad} için satın alma açıldı`, "basari");
              },
            },
          ],
        },
      },
    },
    {
      id: "garanti",
      grup: "Finans",
      rozet: (api) => api.veri.garanti.filter((g) => g.durum === "hazir").length,
      ekran: {
        tur: "liste",
        koleksiyon: "garanti",
        baslikAdi: "Hakediş",
        baslik: (g) => `${g.marka}, iş ${g.talepId}`,
        alt: (g, api) => `${g.cihaz}, ${api.bul("talepler", g.talepId)?.musteri ?? ""}`,
        durum: (g) => ({ hazir: { ad: "Gönderilecek", renk: "mavi" }, gonderildi: { ad: "Markada", renk: "mor" }, onaylandi: { ad: "Onaylandı", renk: "sari" }, odendi: { ad: "Ödendi", renk: "yesil" }, red: { ad: "Reddedildi", renk: "kirmizi" } })[g.durum as string] as Durum,
        arama: (g) => `${g.marka} ${g.talepId} ${g.cihaz}`,
        sutunlar: [
          { ad: "İş kapanışı", deger: (g, api) => zaman(g.t, api.ani), sirala: (g) => g.t, oncelik: 2 },
          { ad: "Tutar", deger: (g) => tl(g.tutar), sirala: (g) => g.tutar, csv: (g) => g.tutar, hiza: "sag", oncelik: 1 },
        ],
        filtreler: [
          {
            ad: "Durum",
            secenekler: [
              { ad: "Gönderilecek", kosul: (g) => g.durum === "hazir" },
              { ad: "Markada", kosul: (g) => g.durum === "gonderildi" },
              { ad: "Onaylandı", kosul: (g) => g.durum === "onaylandi" },
              { ad: "Ödendi", kosul: (g) => g.durum === "odendi" },
              { ad: "Reddedildi", kosul: (g) => g.durum === "red" },
            ],
          },
          { ad: "Marka", secenekler: MARKALAR.map((m) => ({ ad: m, kosul: (g: Kayit) => g.marka === m })) },
        ],
        ozet: (api) => {
          const l = api.veri.garanti;
          const top = (d: string) => tlKisa(l.filter((g) => g.durum === d).reduce((t, g) => t + g.tutar, 0));
          return [
            { ad: "Gönderilecek", deger: top("hazir"), renk: "mavi" },
            { ad: "Markada", deger: top("gonderildi"), renk: "mor" },
            { ad: "Onaylandı, ödenmedi", deger: top("onaylandi"), renk: "sari" },
            { ad: "Ödendi, 30 gün", deger: top("odendi"), renk: "yesil" },
          ];
        },
        detay: {
          bolumler: (g, api) => {
            const k = api.bul("talepler", g.talepId);
            return (
              <Bolum
                baslik="Hakediş"
                sag={
                  k && (
                    <button type="button" onClick={() => api.git("talepler", { kayit: k.id })} className="text-[12px] font-semibold text-[var(--p)] hover:underline">
                      İşi aç
                    </button>
                  )
                }
              >
                <AlanListesi alanlar={[["Marka", g.marka], ["Cihaz", g.cihaz], ["Müşteri", k?.musteri], ["Teknisyen", teknisyenAdi(api, k?.teknisyenId)], ["İşçilik ve parça", tl(g.tutar)], ["İş kapanışı", zaman(g.t, api.ani)]]} />
                {g.durum === "red" && <p className="mt-3 rounded-lg bg-[var(--k2)] p-3 text-[12.5px]" style={{ color: RENK.kirmizi }}>Marka, seri numarası fotoğrafı eksik olduğu için reddetti. Fotoğraf eklenip yeniden gönderilebilir.</p>}
              </Bolum>
            );
          },
          eylemler: [
            {
              ad: "Markaya gönder",
              tur: "ana",
              ikon: IconSend,
              gorunur: (g) => g.durum === "hazir" || g.durum === "red",
              uygula: (g, api) => {
                api.guncelle("garanti", g.id, { durum: "gonderildi" });
                api.haber(`${g.marka} portalına ${tl(g.tutar)} hakediş talebi gönderildi`, "basari");
                api.olay("garanti");
              },
            },
            {
              ad: "Ödendi olarak işaretle",
              ikon: IconCheck,
              gorunur: (g) => g.durum === "onaylandi",
              uygula: (g, api) => {
                api.guncelle("garanti", g.id, { durum: "odendi" });
                api.haber("Hakediş ödendi olarak kaydedildi", "basari");
              },
            },
          ],
        },
      },
    },
  ],
  arama: [
    { koleksiyon: "talepler", modul: "talepler", baslik: (k) => `İş ${k.id}, ${k.musteri}`, alt: (k) => `${k.cihaz}, ${k.ilce}`, metin: (k) => `${k.id} ${k.telefon}` },
    { koleksiyon: "parcalar", modul: "parcalar", baslik: (p) => p.ad, alt: (p) => p.kod, metin: (p) => `${p.kod} ${p.cihaz}` },
    { koleksiyon: "teknisyenler", modul: "teknisyenler", baslik: (t) => t.ad, alt: (t) => t.uzman, metin: (t) => t.bolgeler.join(" ") },
  ],
  gorevler: [
    { id: "g1", metin: "Atanmamış bir işi teknisyene atayın", ipucu: "Dispeç panosunda soldaki kırmızı sütundan bir işi açın; önerilen teknisyen bölgeye göre seçilir.", modul: "pano", olay: "atama" },
    { id: "g2", metin: "Sahadaki bir işi tamamlayın", ipucu: "Panoda işlemde durumundaki bir işi açıp Tamamlandı düğmesine basın.", modul: "pano", olay: "is-tamam" },
    { id: "g3", metin: "Yeni servis talebi açın", ipucu: "Servis talepleri ekranındaki Yeni servis talebi düğmesi.", modul: "talepler", olay: "yeni-talep" },
    { id: "g4", metin: "Bir teknisyenin aracına parça verin", ipucu: "Yedek parça ekranında bir parçayı açın.", modul: "parcalar", olay: "parca-arac" },
    { id: "g5", metin: "Garanti hakedişini markaya gönderin", ipucu: "Garanti hakedişi ekranında Gönderilecek durumundaki bir talebi açın.", modul: "garanti", olay: "garanti" },
  ],
  canli: {
    aralik: 30_000,
    uret: (api, r) => {
      const s = api.ani.getTime();
      const ilerleyen = api.veri.talepler.find((k) => bugunMu(k, api) && ["yolda", "islemde"].includes(k.durum));
      if (ilerleyen && r.olasilik(0.5)) {
        const sonraki = ilerleyen.durum === "yolda" ? "islemde" : "tamam";
        api.guncelle("talepler", ilerleyen.id, { durum: sonraki, ...(sonraki === "tamam" ? { bitis: s } : {}) }, sonraki === "islemde" ? "İşleme başlandı" : "Tamamlandı, müşteri imzaladı");
        api.bildir(`${teknisyenAdi(api, ilerleyen.teknisyenId)}, iş ${ilerleyen.id} ${sonraki === "islemde" ? "işleme başladı" : "tamamlandı"}`, "pano");
        return;
      }
      const cihaz = r.sec(CIHAZ_ADLARI);
      const ilce = r.sec(ILCELER);
      const m = kisiler(r, 1)[0];
      const no = `S${Math.max(...api.veri.talepler.map((k) => Number(k.id.slice(1)))) + 1}`;
      api.ekle("talepler", {
        id: no,
        musteri: m.tamAd,
        telefon: m.telefon,
        ilce,
        mahalle: r.sec(MAHALLE[ilce]),
        cihaz,
        marka: r.sec(MARKALAR),
        ariza: r.sec(CIHAZLAR[cihaz].arizalar),
        garanti: r.olasilik(0.5),
        oncelik: r.olasilik(0.2) ? "Acil" : "Normal",
        kaynak: r.sec(["Site formu", "WhatsApp", "Çağrı merkezi"]),
        t: s,
        randevu: { gun: gunBasi(s) + GUN, aralik: r.tam(0, 2) },
        teknisyenId: "",
        durum: "yeni",
        ucret: CIHAZLAR[cihaz].ucret,
        ilkSeferde: true,
        puan: 0,
        gecmis: [{ t: s, m: "Talep açıldı" }],
      });
      api.bildir(`Yeni arıza kaydı, ${cihaz.toLocaleLowerCase("tr")}, ${ilce}`, "talepler", no);
    },
  },
};

export default panel;
export { bilgi };
