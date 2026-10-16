/*
 * Yeni müşteri başlat: hesap ve proje tek ekranda açılır, sonunda müşteriye
 * gönderilecek giriş mesajı hazır gelir. Talepler sayfasından gelen bilgiler
 * forma kendiliğinden dolar.
 */
import { useEffect, useMemo, useState, type FormEvent, type ReactNode } from "react";
import { IconArrowRight, IconBrandWhatsapp, IconCheck, IconCopy, IconKey, IconMail } from "@tabler/icons-react";
import { yonetim, type MusteriProjesi } from "../api";
import { Alan, Baslik, Dugme, GIRDI, KART, panoyaKopyala, useKirliKoruma, usePanel } from "../ortak";
import { taslakOku, taslakSil, useTaslakYaz } from "../taslak";
import { useYonetimIcerik } from "./baglam";

type Form = { ad: string; firma: string; eposta: string; telefon: string; proje: string; ozet: string; teslim: string; asama: number; sorumlu: string };

const BOS: Form = { ad: "", firma: "", eposta: "", telefon: "", proje: "", ozet: "", teslim: "", asama: 0, sorumlu: "" };

function sifreUret() {
  const harfler = "abcdefghjkmnpqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  const dizi = new Uint32Array(12);
  crypto.getRandomValues(dizi);
  return Array.from(dizi, (s) => harfler[s % harfler.length]).join("");
}

function whatsappNumarasi(metin: string) {
  let r = metin.replace(/\D/g, "");
  if (r.length === 11 && r.startsWith("0")) r = "9" + r;
  if (r.length === 10 && r.startsWith("5")) r = "90" + r;
  return r.length >= 11 ? r : null;
}

function Adim({ no, baslik, aciklama, children }: { no: number; baslik: string; aciklama: string; children: ReactNode }) {
  return (
    <section className={`${KART} p-5 sm:p-6`}>
      <div className="flex items-start gap-4">
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-vurgu text-[15px] font-bold text-white">{no}</span>
        <div className="min-w-0 flex-1">
          <h2 className="text-[17px] font-semibold text-white">{baslik}</h2>
          <p className="mt-1 text-[13.5px] text-neutral-400">{aciklama}</p>
          <div className="mt-5">{children}</div>
        </div>
      </div>
    </section>
  );
}

export default function YeniMusteriSayfasi({ sorgu }: { sorgu: URLSearchParams }) {
  const { icerik } = useYonetimIcerik();
  const { bildir, hataBildir } = usePanel();
  const asamalar = icerik.surec.filter((s) => s.yayinda !== false);

  const [form, setForm] = useState<Form>(() => {
    const iletisim = sorgu.get("iletisim") ?? "";
    if (sorgu.get("ad") || iletisim) {
      const eposta = /\S+@\S+\.\S+/.test(iletisim) ? iletisim : "";
      return { ...BOS, ad: sorgu.get("ad") ?? "", firma: sorgu.get("firma") ?? "", eposta, telefon: eposta ? "" : iletisim, proje: [sorgu.get("firma") || sorgu.get("ad"), (sorgu.get("konu") ?? "").toLocaleLowerCase("tr")].filter(Boolean).join(" ") };
    }
    return taslakOku<Form>("yeni-musteri")?.veri ?? BOS;
  });
  const [sifre, setSifre] = useState(sifreUret);
  const [musteriId, setMusteriId] = useState<number | null>(null);
  const [sonuc, setSonuc] = useState<{ proje: MusteriProjesi; mesaj: string } | null>(null);
  const [gonderiliyor, setGonderiliyor] = useState(false);

  useEffect(() => {
    if (sorgu.get("ad") || sorgu.get("iletisim")) history.replaceState(null, "", "#/yeni-musteri");
  }, [sorgu]);

  const kirli = !sonuc && JSON.stringify(form) !== JSON.stringify(BOS);
  useTaslakYaz("yeni-musteri", form, kirli);
  useKirliKoruma(kirli);

  const mesaj = useMemo(
    () =>
      [
        `Merhaba ${form.ad || ""},`.replace(" ,", ","),
        "",
        `${form.proje || "Projeniz"} için müşteri paneliniz hazır. Projenin hangi aşamada olduğunu, son gelişmeleri ve görselleri buradan takip edebilirsiniz.`,
        "",
        `Adres ${window.location.origin}/musteri/`,
        `Mail ${form.eposta}`,
        `Şifre ${sifre}`,
        "",
        "İlk girişten sonra şifrenizi panelden değiştirebilirsiniz.",
      ].join("\n"),
    [form.ad, form.proje, form.eposta, sifre],
  );

  const gonder = async (e: FormEvent) => {
    e.preventDefault();
    if (!form.eposta.trim()) return bildir("Müşterinin mail adresini yaz", "hata");
    if (!form.proje.trim()) return bildir("Projeye bir ad ver", "hata");
    setGonderiliyor(true);
    try {
      // Hesap bir önceki denemede açıldıysa tekrar açılmaz, yalnızca proje kaydedilir.
      let id = musteriId;
      if (!id) {
        const k = await yonetim<{ id: number }>("kullanici-kaydet", { ad: form.ad, firma: form.firma, eposta: form.eposta, telefon: form.telefon, rol: "musteri", aktif: true, sifre });
        id = k.id;
        setMusteriId(id);
      }
      const proje = await yonetim<MusteriProjesi>("proje-kaydet", {
        proje: {
          musteri_id: id,
          ad: form.proje,
          ozet: form.ozet,
          asama: form.asama,
          ilerleme: asamalar.length ? Math.round(((form.asama + 0.5) / asamalar.length) * 100) : 0,
          sorumlu: form.sorumlu,
          teknolojiler: [],
          onizleme: "",
          canli: "",
          baslangic: new Date().toISOString().slice(0, 10),
          teslim: form.teslim,
          durum: "devam",
          notlar: "",
        },
      });
      taslakSil("yeni-musteri");
      setSonuc({ proje, mesaj });
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (h) {
      hataBildir(h);
    } finally {
      setGonderiliyor(false);
    }
  };

  if (sonuc) {
    const wa = whatsappNumarasi(form.telefon);
    return (
      <div className="mx-auto max-w-2xl">
        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-500/15 text-emerald-400">
          <IconCheck size={30} stroke={2.4} />
        </div>
        <h1 className="mt-6 text-[28px] font-bold tracking-tight text-white">{form.ad || "Müşteri"} hazır</h1>
        <p className="mt-2 text-[15px] leading-relaxed text-neutral-400">
          Hesap açıldı ve {sonuc.proje.ad} projesi oluşturuldu. Şimdi aşağıdaki mesajı müşteriye gönder. Şifre bir daha gösterilmez.
        </p>

        <pre className="mt-6 whitespace-pre-wrap rounded-xl border border-white/10 bg-white/[0.03] p-5 font-sans text-[14.5px] leading-relaxed text-neutral-100">{sonuc.mesaj}</pre>

        <div className="mt-4 flex flex-wrap gap-2">
          {wa && (
            <a
              href={`https://wa.me/${wa}?text=${encodeURIComponent(sonuc.mesaj)}`}
              target="_blank"
              rel="noopener"
              className="inline-flex h-10 items-center gap-2 rounded-lg bg-[#25d366] px-4 text-sm font-semibold text-black hover:brightness-110"
            >
              <IconBrandWhatsapp size={18} />
              WhatsApp ile gönder
            </a>
          )}
          <a
            href={`mailto:${form.eposta}?subject=${encodeURIComponent("Müşteri paneliniz hazır")}&body=${encodeURIComponent(sonuc.mesaj)}`}
            className="inline-flex h-10 items-center gap-2 rounded-lg border border-white/12 bg-white/[0.04] px-4 text-sm font-medium text-neutral-100 hover:border-white/25"
          >
            <IconMail size={17} />
            Mail ile gönder
          </a>
          <Dugme
            ikon={<IconCopy size={16} />}
            onClick={async () => {
              await panoyaKopyala(sonuc.mesaj);
              bildir("Mesaj kopyalandı");
            }}
          >
            Kopyala
          </Dugme>
        </div>

        <div className={`${KART} mt-10 p-5`}>
          <h2 className="text-[15px] font-semibold text-white">Sırada ne var?</h2>
          <p className="mt-1.5 text-[14px] leading-relaxed text-neutral-400">
            Projenin sayfasında aşamayı güncelleyebilir, ilk güncellemeyi gönderebilir ve müşteriden beklediklerini yazabilirsin.
          </p>
          <a href={`#/projeler/${sonuc.proje.id}`} className="mt-4 inline-flex h-10 items-center gap-2 rounded-lg bg-vurgu px-4 text-sm font-medium text-white hover:bg-[#ea583f]">
            Projeyi aç
            <IconArrowRight size={16} />
          </a>
        </div>
      </div>
    );
  }

  const alan = (k: keyof Form) => ({
    value: String(form[k]),
    onChange: (e: { target: { value: string } }) => setForm({ ...form, [k]: e.target.value }),
  });

  return (
    <form onSubmit={gonder} className="mx-auto max-w-3xl">
      <Baslik
        baslik="Yeni müşteri başlat"
        aciklama="Anlaştığın bir müşteriyi sisteme alırsın. Müşterinin giriş hesabı ve proje takip ekranı birlikte açılır, sonunda müşteriye göndereceğin mesaj hazır gelir."
      />

      <div className="space-y-4">
        <Adim no={1} baslik="Müşteri kim?" aciklama="Müşteri bu mail adresi ve aşağıdaki şifreyle giriş yapacak.">
          <div className="grid gap-5 sm:grid-cols-2">
            <Alan etiket="Ad soyad" htmlFor="y-ad">
              <input id="y-ad" className={GIRDI} {...alan("ad")} placeholder="Ayşe Yılmaz" autoFocus />
            </Alan>
            <Alan etiket="Firma" htmlFor="y-firma">
              <input id="y-firma" className={GIRDI} {...alan("firma")} placeholder="Yılmaz Mobilya" />
            </Alan>
            <Alan etiket="Mail adresi" htmlFor="y-eposta" zorunlu>
              <input id="y-eposta" type="email" className={GIRDI} {...alan("eposta")} placeholder="ayse@firma.com" />
            </Alan>
            <Alan etiket="Telefon" htmlFor="y-tel" ipucu="Yazarsan giriş bilgilerini WhatsApp ile tek tıkla gönderebilirsin.">
              <input id="y-tel" className={GIRDI} {...alan("telefon")} placeholder="0532 000 00 00" />
            </Alan>
            <Alan etiket="Şifre" htmlFor="y-sifre" className="sm:col-span-2" ipucu="Kendiliğinden üretildi. İstersen değiştirebilirsin, en az 10 karakter olmalı.">
              <div className="flex gap-2">
                <input id="y-sifre" className={`${GIRDI} font-mono`} value={sifre} onChange={(e) => setSifre(e.target.value)} disabled={!!musteriId} />
                <Dugme ikon={<IconKey size={16} />} onClick={() => setSifre(sifreUret())} disabled={!!musteriId}>
                  Yeni üret
                </Dugme>
              </div>
            </Alan>
          </div>
        </Adim>

        <Adim no={2} baslik="Proje ne?" aciklama="Müşteri panelinde en üstte bu ad ve açıklama görünür.">
          <div className="grid gap-5 sm:grid-cols-2">
            <Alan etiket="Proje adı" htmlFor="y-proje" zorunlu className="sm:col-span-2">
              <input id="y-proje" className={GIRDI} {...alan("proje")} placeholder="Yılmaz Mobilya online mağaza" />
            </Alan>
            <Alan etiket="Kısa açıklama" htmlFor="y-ozet" className="sm:col-span-2">
              <textarea id="y-ozet" rows={2} className={`${GIRDI} resize-y`} {...alan("ozet")} placeholder="Ürün kataloğu, sanal POS ve yönetim paneli olan e ticaret sitesi." />
            </Alan>
            <Alan etiket="Proje şu an hangi aşamada?" htmlFor="y-asama">
              <select id="y-asama" className={GIRDI} value={form.asama} onChange={(e) => setForm({ ...form, asama: Number(e.target.value) })}>
                {asamalar.map((a, i) => (
                  <option key={a.kimlik} value={i}>
                    {a.baslik}
                  </option>
                ))}
              </select>
            </Alan>
            <Alan etiket="Tahmini teslim tarihi" htmlFor="y-teslim">
              <input id="y-teslim" type="date" className={`${GIRDI} [color-scheme:dark]`} {...alan("teslim")} />
            </Alan>
            <Alan etiket="Sorumlu kişi" htmlFor="y-sorumlu" ipucu="Müşteri panelinde görünür.">
              <input id="y-sorumlu" className={GIRDI} {...alan("sorumlu")} placeholder="Alperen" />
            </Alan>
          </div>
        </Adim>

        <Adim no={3} baslik="Başlat" aciklama="Hesap ve proje açılır, ardından müşteriye göndereceğin mesaj çıkar.">
          <Dugme type="submit" tur="birincil" yukleniyor={gonderiliyor} className="h-11 px-6">
            Müşteriyi başlat
            <IconArrowRight size={16} />
          </Dugme>
          {musteriId && <p className="mt-3 text-[13px] text-amber-300/90">Hesap açıldı, proje kaydedilemedi. Bilgileri kontrol edip tekrar dene, hesap ikinci kez açılmaz.</p>}
        </Adim>
      </div>
    </form>
  );
}
