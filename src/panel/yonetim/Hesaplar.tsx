/* Müşteri ve yönetici hesapları. Müşteri hesabı açınca giriş bilgileri hazır mesaj olarak verilir. */
import { useEffect, useState } from "react";
import { IconCopy, IconKey, IconPencil, IconPlus, IconRoute, IconTrash } from "@tabler/icons-react";
import { onceGoster, yonetim, type HesapSatiri } from "../api";
import { YardimKutusu } from "../rehber";
import { Alan, Anahtar, Baslik, BosDurum, Dugme, GIRDI, HataKutusu, KART, Pencere, SimgeDugme, Yukleniyor, panoyaKopyala, usePanel, useVeri } from "../ortak";

type Form = { id?: number; ad: string; firma: string; eposta: string; telefon: string; rol: "musteri" | "yonetici"; aktif: boolean; sifre: string };

const BOS: Form = { ad: "", firma: "", eposta: "", telefon: "", rol: "musteri", aktif: true, sifre: "" };

/** Karışması kolay harfler olmadan okunur bir şifre üretir. */
function sifreUret() {
  const harfler = "abcdefghjkmnpqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  const dizi = new Uint32Array(14);
  crypto.getRandomValues(dizi);
  return Array.from(dizi, (s) => harfler[s % harfler.length]).join("");
}

function girisMesaji(f: Form) {
  return [
    `Merhaba ${f.ad || ""},`.replace(" ,", ","),
    "",
    "Projenizin hangi aşamada olduğunu, son güncellemeleri ve görselleri müşteri panelinden takip edebilirsiniz.",
    "",
    `Adres ${window.location.origin}/musteri/`,
    `Mail ${f.eposta}`,
    `Şifre ${f.sifre}`,
    "",
    "İlk girişten sonra şifrenizi panelden değiştirebilirsiniz.",
  ].join("\n");
}

export default function HesaplarSayfasi({ sorgu }: { sorgu: URLSearchParams }) {
  const { bildir, hataBildir, onayla } = usePanel();
  const { veri, hata, yukleniyor, yenile } = useVeri(() => yonetim<HesapSatiri[]>("kullanicilar"));
  const [form, setForm] = useState<Form | null>(null);
  const [kaydediliyor, setKaydediliyor] = useState(false);
  const [mesaj, setMesaj] = useState<string | null>(null);
  const [rol, setRol] = useState<"musteri" | "yonetici">("musteri");

  // Talepler sayfasından "Müşteri hesabı aç" ile gelindiyse formu doldur.
  useEffect(() => {
    if (sorgu.get("yeni") !== "1") return;
    const iletisim = sorgu.get("iletisim") ?? "";
    const eposta = /\S+@\S+\.\S+/.test(iletisim) ? iletisim : "";
    setForm({ ...BOS, ad: sorgu.get("ad") ?? "", firma: sorgu.get("firma") ?? "", eposta, telefon: eposta ? "" : iletisim, sifre: sifreUret() });
    history.replaceState(null, "", "#/hesaplar");
  }, [sorgu]);

  const kaydet = async () => {
    if (!form) return;
    setKaydediliyor(true);
    try {
      await yonetim("kullanici-kaydet", { ...form });
      const yeniMi = !form.id;
      if (form.sifre && form.rol === "musteri") setMesaj(girisMesaji(form));
      setForm(null);
      yenile();
      bildir(yeniMi ? "Hesap açıldı" : "Hesap güncellendi");
    } catch (h) {
      hataBildir(h);
    } finally {
      setKaydediliyor(false);
    }
  };

  const sil = async (h: HesapSatiri) => {
    const tamam = await onayla({
      baslik: "Hesap silinsin mi?",
      metin: (
        <>
          <strong className="text-white">{h.ad || h.eposta}</strong> artık giriş yapamaz.
          {h.proje_sayisi > 0 && ` Bu hesaba bağlı ${h.proje_sayisi} proje de güncellemeleri ve dosya bağlarıyla birlikte çöp kutusuna taşınır.`} Yedekler sayfasından hepsini birlikte geri
          alabilirsin. Yalnızca girişi kapatmak istiyorsan silmek yerine hesabı pasif yap.
        </>
      ),
      dugme: "Çöp kutusuna taşı",
      tehlike: true,
    });
    if (!tamam) return;
    try {
      await yonetim("kullanici-sil", { id: h.id });
      yenile();
      bildir("Çöp kutusuna taşındı");
    } catch (e) {
      hataBildir(e);
    }
  };

  const liste = (veri ?? []).filter((h) => h.rol === rol);

  return (
    <div>
      <Baslik baslik="Müşteri hesapları">
        {rol === "musteri" ? (
          <a href="#/yeni-musteri" className="inline-flex h-10 items-center gap-2 rounded-lg bg-vurgu px-4 text-sm font-medium text-white hover:bg-[#ea583f]">
            <IconPlus size={16} />
            Yeni müşteri başlat
          </a>
        ) : (
          <Dugme tur="birincil" ikon={<IconPlus size={16} />} onClick={() => setForm({ ...BOS, rol, sifre: sifreUret() })}>
            Yeni yönetici
          </Dugme>
        )}
      </Baslik>
      <YardimKutusu anahtar="hesaplar" />

      <div className="mb-5 flex gap-1 border-b border-white/[0.07]">
        {(
          [
            ["musteri", "Müşteriler"],
            ["yonetici", "Yöneticiler"],
          ] as const
        ).map(([k, ad]) => (
          <button
            key={k}
            type="button"
            onClick={() => setRol(k)}
            className={`-mb-px border-b-2 px-3 py-2.5 text-sm font-medium transition-colors ${rol === k ? "border-vurgu text-white" : "border-transparent text-neutral-400 hover:text-neutral-200"}`}
          >
            {ad} <span className="ml-1 tabular-nums text-neutral-500">{(veri ?? []).filter((h) => h.rol === k).length}</span>
          </button>
        ))}
      </div>

      {yukleniyor && !veri ? (
        <Yukleniyor />
      ) : hata ? (
        <HataKutusu hata={hata} yenile={yenile} />
      ) : liste.length === 0 ? (
        <BosDurum baslik={rol === "musteri" ? "Henüz müşteri hesabı yok" : "Yönetici yok"} metin="Yeni hesap açtığında giriş bilgilerini müşteriye göndermen için hazır bir mesaj verilir." />
      ) : (
        <ul className={`${KART} divide-y divide-white/[0.05]`}>
          {liste.map((h) => (
            <li key={h.id} className="flex flex-col gap-3 px-4 py-3.5 sm:flex-row sm:items-center">
              <div className="min-w-0 flex-1">
                <p className="flex flex-wrap items-baseline gap-x-2.5">
                  <span className="text-[15px] font-medium text-white">{h.ad || "İsimsiz"}</span>
                  {h.firma && <span className="text-[13.5px] text-neutral-400">{h.firma}</span>}
                  {!h.aktif && <span className="text-[12.5px] font-medium text-amber-300/90">Pasif</span>}
                </p>
                <p className="mt-0.5 truncate text-[13px] text-neutral-500">
                  {[h.eposta, h.telefon].filter(Boolean).join(", ")}
                  {h.son_giris ? `, son giriş ${onceGoster(h.son_giris)}` : ", henüz giriş yapmadı"}
                </p>
              </div>
              <div className="flex shrink-0 items-center gap-1">
                {h.rol === "musteri" && (
                  <a
                    href={h.proje_sayisi ? `#/projeler?musteri=${h.id}` : `#/projeler/yeni?musteri=${h.id}`}
                    className="inline-flex h-8 items-center gap-1.5 rounded-lg px-2.5 text-[13px] text-neutral-300 hover:bg-white/[0.06] hover:text-white"
                  >
                    <IconRoute size={15} />
                    {h.proje_sayisi ? `${h.proje_sayisi} proje` : "Proje aç"}
                  </a>
                )}
                <SimgeDugme ad="Düzenle" onClick={() => setForm({ id: h.id, ad: h.ad, firma: h.firma, eposta: h.eposta, telefon: h.telefon, rol: h.rol, aktif: !!h.aktif, sifre: "" })}>
                  <IconPencil size={16} />
                </SimgeDugme>
                <SimgeDugme ad="Sil" onClick={() => sil(h)} className="hover:text-red-300">
                  <IconTrash size={16} />
                </SimgeDugme>
              </div>
            </li>
          ))}
        </ul>
      )}

      <Pencere
        acik={!!form}
        kapat={() => setForm(null)}
        baslik={form?.id ? "Hesabı düzenle" : form?.rol === "yonetici" ? "Yeni yönetici" : "Yeni müşteri"}
        alt={
          <>
            <Dugme onClick={() => setForm(null)}>Vazgeç</Dugme>
            <Dugme tur="birincil" onClick={kaydet} yukleniyor={kaydediliyor}>
              Kaydet
            </Dugme>
          </>
        }
      >
        {form && (
          <form
            className="grid gap-5 sm:grid-cols-2"
            onSubmit={(e) => {
              e.preventDefault();
              kaydet();
            }}
          >
            <Alan etiket="Ad soyad" htmlFor="h-ad">
              <input id="h-ad" className={GIRDI} value={form.ad} onChange={(e) => setForm({ ...form, ad: e.target.value })} autoFocus />
            </Alan>
            <Alan etiket="Firma" htmlFor="h-firma">
              <input id="h-firma" className={GIRDI} value={form.firma} onChange={(e) => setForm({ ...form, firma: e.target.value })} />
            </Alan>
            <Alan etiket="Mail adresi" htmlFor="h-eposta" zorunlu>
              <input id="h-eposta" type="email" className={GIRDI} value={form.eposta} onChange={(e) => setForm({ ...form, eposta: e.target.value })} />
            </Alan>
            <Alan etiket="Telefon" htmlFor="h-tel">
              <input id="h-tel" className={GIRDI} value={form.telefon} onChange={(e) => setForm({ ...form, telefon: e.target.value })} />
            </Alan>
            <Alan etiket={form.id ? "Yeni şifre" : "Şifre"} htmlFor="h-sifre" className="sm:col-span-2" ipucu={form.id ? "Değiştirmek istemiyorsan boş bırak." : "En az 10 karakter. Kaydedince müşteriye göndereceğiniz mesaj hazırlanır."}>
              <div className="flex gap-2">
                <input id="h-sifre" className={`${GIRDI} font-mono`} value={form.sifre} onChange={(e) => setForm({ ...form, sifre: e.target.value })} autoComplete="new-password" />
                <Dugme ikon={<IconKey size={16} />} onClick={() => setForm({ ...form, sifre: sifreUret() })}>
                  Üret
                </Dugme>
              </div>
            </Alan>
            <Alan etiket="Hesap türü" htmlFor="h-rol">
              <select id="h-rol" className={GIRDI} value={form.rol} onChange={(e) => setForm({ ...form, rol: e.target.value as Form["rol"] })}>
                <option value="musteri">Müşteri</option>
                <option value="yonetici">Yönetici</option>
              </select>
            </Alan>
            <div className="flex items-end pb-2">
              <Anahtar acik={form.aktif} degistir={(v) => setForm({ ...form, aktif: v })} etiket="Giriş yapabilsin" />
            </div>
            <button type="submit" hidden />
          </form>
        )}
      </Pencere>

      <Pencere
        acik={!!mesaj}
        kapat={() => setMesaj(null)}
        baslik="Müşteriye gönderilecek mesaj"
        alt={
          <>
            <Dugme onClick={() => setMesaj(null)}>Kapat</Dugme>
            <Dugme
              tur="birincil"
              ikon={<IconCopy size={16} />}
              onClick={async () => {
                if (mesaj) await panoyaKopyala(mesaj);
                bildir("Mesaj kopyalandı");
              }}
            >
              Kopyala
            </Dugme>
          </>
        }
      >
        <p className="mb-3 text-sm text-neutral-400">Şifre bir daha gösterilmez. Mesajı kopyalayıp WhatsApp ya da mail ile gönder.</p>
        <pre className="whitespace-pre-wrap rounded-lg bg-white/[0.04] p-4 font-sans text-[14px] leading-relaxed text-neutral-100">{mesaj}</pre>
      </Pencere>
    </div>
  );
}
