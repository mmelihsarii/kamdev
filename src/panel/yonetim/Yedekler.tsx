/* Yedek indirme, içerik dışa ve içe aktarma, günlük kopyalar ve çöp kutusu. */
import { useRef, useState } from "react";
import { IconArrowBackUp, IconDownload, IconFileImport, IconTrash } from "@tabler/icons-react";
import { COP_TURU, boyutGoster, onceGoster, tarihSaatGoster, yonetim, type CopKaydi, type GunlukYedek, type Ozet } from "../api";
import { Baslik, BosDurum, Dugme, HataKutusu, KART, SimgeDugme, Yukleniyor, usePanel, useVeri } from "../ortak";
import { YardimKutusu } from "../rehber";
import { useYonetimIcerik } from "./baglam";

function dosyaIndir(ad: string, icerik: string) {
  const adres = URL.createObjectURL(new Blob([icerik], { type: "application/json" }));
  const a = document.createElement("a");
  a.href = adres;
  a.download = ad;
  a.click();
  window.setTimeout(() => URL.revokeObjectURL(adres), 2000);
}

export default function YedeklerSayfasi({ ozet }: { ozet: Ozet | null }) {
  const { bildir, hataBildir, onayla } = usePanel();
  const { yenile: icerikYenile } = useYonetimIcerik();
  const yedekler = useVeri(() => yonetim<GunlukYedek[]>("yedekler"));
  const cop = useVeri(() => yonetim<CopKaydi[]>("cop"));
  const [aktariliyor, setAktariliyor] = useState(false);
  const [isleniyor, setIsleniyor] = useState<number | null>(null);
  const girdi = useRef<HTMLInputElement>(null);

  const disaAktar = async () => {
    setAktariliyor(true);
    try {
      const veri = await yonetim("disa-aktar");
      dosyaIndir(`kam-icerik-${new Date().toISOString().slice(0, 10)}.json`, JSON.stringify(veri, null, 2));
    } catch (h) {
      hataBildir(h);
    } finally {
      setAktariliyor(false);
    }
  };

  const iceAktar = async (dosya: File) => {
    let veri: unknown;
    try {
      veri = JSON.parse(await dosya.text());
    } catch {
      bildir("Dosya okunamadı. Panelden indirilen JSON dosyasını seç.", "hata");
      return;
    }
    const tamam = await onayla({
      baslik: "Site içeriği bu dosyayla değiştirilsin mi?",
      metin:
        "Blog yazıları, işler, hizmetler ve bütün ayarlar dosyadaki haline döner. Müşteri hesapları, projeler ve talepler etkilenmez. İşlemden hemen önce şu anki halin tam kopyası otomatik alınır, gerekirse geri dönebilirsin.",
      dugme: "Geri yükle",
      tehlike: true,
    });
    if (!tamam) return;
    setAktariliyor(true);
    try {
      await yonetim("ice-aktar", { veri });
      await icerikYenile();
      yedekler.yenile();
      bildir("İçerik geri yüklendi");
    } catch (h) {
      hataBildir(h);
    } finally {
      setAktariliyor(false);
    }
  };

  const geriAl = async (k: CopKaydi) => {
    setIsleniyor(k.id);
    try {
      await yonetim("cop-geri-al", { id: k.id });
      cop.setVeri((v) => (v ?? []).filter((x) => x.id !== k.id));
      if (k.tur === "oge") await icerikYenile();
      bildir(`${k.baslik} geri alındı`);
    } catch (h) {
      hataBildir(h);
    } finally {
      setIsleniyor(null);
    }
  };

  const kaliciSil = async (k: CopKaydi) => {
    const tamam = await onayla({
      baslik: "Kalıcı olarak silinsin mi?",
      metin: "Bu kayıt çöp kutusundan da kalkar. Yalnızca günlük veritabanı yedeklerinde kalır.",
      dugme: "Kalıcı sil",
      tehlike: true,
    });
    if (!tamam) return;
    try {
      await yonetim("cop-sil", { id: k.id });
      cop.setVeri((v) => (v ?? []).filter((x) => x.id !== k.id));
    } catch (h) {
      hataBildir(h);
    }
  };

  return (
    <div>
      <Baslik baslik="Yedekler ve çöp kutusu" />
      <YardimKutusu anahtar="yedekler" />

      <div className="grid gap-4 lg:grid-cols-3">
        <section className={`${KART} flex flex-col p-5`}>
          <h2 className="text-[15px] font-semibold text-white">Tam yedek</h2>
          <p className="mt-1.5 flex-1 text-[13.5px] leading-relaxed text-neutral-400">Supabase verilerinin JSON kopyası, yüklenen görseller ve müşteri dosyaları tek zip dosyasında. Ayda bir bilgisayarına indir.</p>
          <a
            href="/api/yedek.php?tur=tam"
            className="mt-4 inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-vurgu px-4 text-sm font-medium text-white hover:bg-[#ea583f]"
          >
            <IconDownload size={16} />
            Tam yedeği indir
          </a>
        </section>
        <section className={`${KART} flex flex-col p-5`}>
          <h2 className="text-[15px] font-semibold text-white">Site içeriği</h2>
          <p className="mt-1.5 flex-1 text-[13.5px] leading-relaxed text-neutral-400">Yazılar, işler, hizmetler ve ayarlar okunabilir tek bir dosyada. Başka bir sunucuya taşırken de kullanılır.</p>
          <Dugme className="mt-4" ikon={<IconDownload size={16} />} onClick={disaAktar} yukleniyor={aktariliyor}>
            İçeriği indir
          </Dugme>
        </section>
        <section className={`${KART} flex flex-col p-5`}>
          <h2 className="text-[15px] font-semibold text-white">İçeriği geri yükle</h2>
          <p className="mt-1.5 flex-1 text-[13.5px] leading-relaxed text-neutral-400">Daha önce indirdiğin içerik dosyasını yükle. Öncesinde otomatik kopya alınır.</p>
          <Dugme className="mt-4" ikon={<IconFileImport size={16} />} onClick={() => girdi.current?.click()} yukleniyor={aktariliyor}>
            Dosya seç
          </Dugme>
          <input
            ref={girdi}
            type="file"
            accept="application/json,.json"
            hidden
            onChange={(e) => {
              const d = e.target.files?.[0];
              if (d) iceAktar(d);
              e.target.value = "";
            }}
          />
        </section>
      </div>

      <section className="mt-10">
        <h2 className="text-[18px] font-semibold text-white">Çöp kutusu</h2>
        <p className="mt-1 text-[13.5px] text-neutral-400">Silinen yazılar, projeler, hesaplar ve talepler. Geri aldığında bağlı kayıtlarıyla birlikte eski yerine döner.</p>
        <div className="mt-4">
          {cop.yukleniyor && !cop.veri ? (
            <Yukleniyor />
          ) : cop.hata ? (
            <HataKutusu hata={cop.hata} yenile={cop.yenile} />
          ) : (cop.veri ?? []).length === 0 ? (
            <BosDurum baslik="Çöp kutusu boş" />
          ) : (
            <ul className={`${KART} divide-y divide-white/[0.05]`}>
              {(cop.veri ?? []).map((k) => (
                <li key={k.id} className="flex flex-col gap-2 px-4 py-3 sm:flex-row sm:items-center">
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[14.5px] font-medium text-neutral-100">{k.baslik}</p>
                    <p className="text-[12.5px] text-neutral-500" title={tarihSaatGoster(k.silinme)}>
                      {COP_TURU[k.tur] ?? k.tur}, {onceGoster(k.silinme)} silindi
                    </p>
                  </div>
                  <div className="flex shrink-0 items-center gap-1">
                    <Dugme kucuk ikon={<IconArrowBackUp size={15} />} onClick={() => geriAl(k)} yukleniyor={isleniyor === k.id}>
                      Geri al
                    </Dugme>
                    <SimgeDugme ad="Kalıcı sil" onClick={() => kaliciSil(k)} className="hover:text-red-300">
                      <IconTrash size={15} />
                    </SimgeDugme>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>

      <section className="mt-10">
        <h2 className="text-[18px] font-semibold text-white">Günlük veritabanı kopyaları</h2>
        <p className="mt-1 text-[13.5px] text-neutral-400">
          Sunucuda saklanan otomatik kopyalar.
          {ozet?.veriKlasoru && ` Veri klasörü ${ozet.veriKlasoru}`}
        </p>
        <div className="mt-4">
          {yedekler.yukleniyor && !yedekler.veri ? (
            <Yukleniyor />
          ) : yedekler.hata ? (
            <HataKutusu hata={yedekler.hata} yenile={yedekler.yenile} />
          ) : (yedekler.veri ?? []).length === 0 ? (
            <BosDurum baslik="Henüz otomatik kopya yok" metin="İlk değişikliği kaydettiğinde bugünün kopyası alınır." />
          ) : (
            <ul className={`${KART} divide-y divide-white/[0.05]`}>
              {(yedekler.veri ?? []).map((y) => (
                <li key={y.ad} className="flex items-center justify-between gap-3 px-4 py-3">
                  <div className="min-w-0">
                    <p className="truncate text-[14px] text-neutral-100">{y.ad.includes("geriyukleme") ? "Geri yükleme öncesi kopya" : tarihSaatGoster(y.tarih)}</p>
                    <p className="text-[12.5px] text-neutral-500">
                      {boyutGoster(y.boyut)}
                      {y.ad.includes("geriyukleme") && `, ${tarihSaatGoster(y.tarih)}`}
                    </p>
                  </div>
                  <a
                    href={`/api/yedek.php?tur=gunluk&ad=${encodeURIComponent(y.ad)}`}
                    className="inline-flex h-8 shrink-0 items-center gap-1.5 rounded-lg px-2.5 text-[13px] text-neutral-300 hover:bg-white/[0.06] hover:text-white"
                  >
                    <IconDownload size={15} />
                    İndir
                  </a>
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>
    </div>
  );
}
