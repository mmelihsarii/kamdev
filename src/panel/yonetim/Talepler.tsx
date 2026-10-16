/* Sitedeki iletişim formundan gelen talepler. */
import { useMemo, useState } from "react";
import { IconBrandWhatsapp, IconCopy, IconMail, IconPhone, IconTrash, IconUserPlus } from "@tabler/icons-react";
import { TALEP_DURUMU, onceGoster, tarihSaatGoster, yonetim, type Talep } from "../api";
import { YardimKutusu } from "../rehber";
import { Baslik, BosDurum, Dugme, HataKutusu, KART, SimgeDugme, Yukleniyor, panoyaKopyala, usePanel, useVeri } from "../ortak";

/** Telefon numarasını WhatsApp bağlantısına uygun biçime getirir. */
function whatsappNumarasi(metin: string) {
  let r = metin.replace(/\D/g, "");
  if (r.length === 11 && r.startsWith("0")) r = "9" + r;
  if (r.length === 10 && r.startsWith("5")) r = "90" + r;
  return r.length >= 11 ? r : null;
}

function IletisimBaglantilari({ iletisim }: { iletisim: string }) {
  const { bildir } = usePanel();
  const eposta = /\S+@\S+\.\S+/.exec(iletisim)?.[0];
  const wa = !eposta ? whatsappNumarasi(iletisim) : null;
  const sinif = "inline-flex h-8 items-center gap-1.5 rounded-lg border border-white/10 px-2.5 text-[13px] text-neutral-200 hover:border-white/25 hover:text-white";
  return (
    <div className="flex flex-wrap items-center gap-2">
      <span className="text-[14.5px] font-medium text-white">{iletisim}</span>
      {eposta && (
        <a href={`mailto:${eposta}`} className={sinif}>
          <IconMail size={15} />
          Mail yaz
        </a>
      )}
      {wa && (
        <>
          <a href={`https://wa.me/${wa}`} target="_blank" rel="noopener" className={sinif}>
            <IconBrandWhatsapp size={15} />
            WhatsApp
          </a>
          <a href={`tel:+${wa}`} className={sinif}>
            <IconPhone size={15} />
            Ara
          </a>
        </>
      )}
      <SimgeDugme
        ad="Kopyala"
        onClick={async () => {
          await panoyaKopyala(iletisim);
          bildir("Kopyalandı");
        }}
      >
        <IconCopy size={15} />
      </SimgeDugme>
    </div>
  );
}

export default function TaleplerSayfasi({ yenilendi }: { yenilendi: () => void }) {
  const { bildir, hataBildir, onayla } = usePanel();
  const { veri, setVeri, hata, yukleniyor, yenile } = useVeri(() => yonetim<Talep[]>("talepler"));
  const [suzgec, setSuzgec] = useState<Talep["durum"] | "hepsi">("hepsi");

  const sayilar = useMemo(() => {
    const s: Record<string, number> = { hepsi: veri?.length ?? 0, yeni: 0, okundu: 0, donuldu: 0 };
    for (const t of veri ?? []) s[t.durum]++;
    return s;
  }, [veri]);

  const liste = (veri ?? []).filter((t) => suzgec === "hepsi" || t.durum === suzgec);

  const durumDegistir = async (t: Talep, durum: Talep["durum"]) => {
    setVeri((v) => (v ?? []).map((x) => (x.id === t.id ? { ...x, durum } : x)));
    try {
      await yonetim("talep-durum", { id: t.id, durum });
      yenilendi();
    } catch (h) {
      setVeri((v) => (v ?? []).map((x) => (x.id === t.id ? t : x)));
      hataBildir(h);
    }
  };

  const sil = async (t: Talep) => {
    const tamam = await onayla({ baslik: "Talep silinsin mi?", metin: "Talep çöp kutusuna taşınır, Yedekler sayfasından geri alabilirsin.", dugme: "Çöp kutusuna taşı", tehlike: true });
    if (!tamam) return;
    try {
      await yonetim("talep-sil", { id: t.id });
      setVeri((v) => (v ?? []).filter((x) => x.id !== t.id));
      yenilendi();
      bildir("Çöp kutusuna taşındı");
    } catch (h) {
      hataBildir(h);
    }
  };

  return (
    <div>
      <Baslik baslik="Gelen talepler" />
      <YardimKutusu anahtar="talepler" />

      <div className="mb-5 flex gap-1 overflow-x-auto border-b border-white/[0.07]">
        {(["hepsi", "yeni", "okundu", "donuldu"] as const).map((k) => (
          <button
            key={k}
            type="button"
            onClick={() => setSuzgec(k)}
            className={`-mb-px shrink-0 border-b-2 px-3 py-2.5 text-sm font-medium transition-colors ${
              suzgec === k ? "border-vurgu text-white" : "border-transparent text-neutral-400 hover:text-neutral-200"
            }`}
          >
            {k === "hepsi" ? "Hepsi" : TALEP_DURUMU[k]} <span className="ml-1 tabular-nums text-neutral-500">{sayilar[k]}</span>
          </button>
        ))}
      </div>

      {yukleniyor && !veri ? (
        <Yukleniyor />
      ) : hata ? (
        <HataKutusu hata={hata} yenile={yenile} />
      ) : liste.length === 0 ? (
        <BosDurum baslik="Burada talep yok" metin="Sitedeki iletişim formu doldurulduğunda talepler burada listelenir." />
      ) : (
        <ul className="space-y-3">
          {liste.map((t) => {
            const yeniHesap = new URLSearchParams({ ad: t.ad, firma: t.firma, iletisim: t.iletisim, konu: t.konu });
            return (
              <li key={t.id} className={`${KART} p-5 ${t.durum === "yeni" ? "border-vurgu/30" : ""}`}>
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
                      <span className="text-[16px] font-semibold text-white">{t.ad || "İsimsiz"}</span>
                      {t.firma && <span className="text-[14px] text-neutral-400">{t.firma}</span>}
                      {t.durum === "yeni" && <span className="text-[12.5px] font-semibold text-vurgu">Yeni</span>}
                    </p>
                    <p className="mt-1 text-[13px] text-neutral-500" title={tarihSaatGoster(t.olusturma)}>
                      {onceGoster(t.olusturma)}
                      {t.konu && `, konu ${t.konu}`}
                    </p>
                  </div>
                  <div className="flex rounded-lg border border-white/10 p-0.5 text-[12.5px]">
                    {(["yeni", "okundu", "donuldu"] as const).map((d) => (
                      <button
                        key={d}
                        type="button"
                        onClick={() => t.durum !== d && durumDegistir(t, d)}
                        aria-pressed={t.durum === d}
                        className={`rounded-md px-2.5 py-1 transition-colors ${t.durum === d ? "bg-white/10 text-white" : "text-neutral-400 hover:text-white"}`}
                      >
                        {TALEP_DURUMU[d]}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="mt-4">
                  <IletisimBaglantilari iletisim={t.iletisim} />
                </div>

                {t.mesaj && <p className="mt-4 whitespace-pre-wrap rounded-lg bg-white/[0.025] p-4 text-[14.5px] leading-relaxed text-neutral-200">{t.mesaj}</p>}

                <div className="mt-4 flex flex-wrap justify-end gap-2">
                  <a
                    href={`#/yeni-musteri?${yeniHesap}`}
                    className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-white/12 bg-white/[0.04] px-3 text-[13px] font-medium text-neutral-100 hover:border-white/25"
                  >
                    <IconUserPlus size={15} />
                    Müşteri olarak başlat
                  </a>
                  <Dugme kucuk tur="sade" ikon={<IconTrash size={15} />} onClick={() => sil(t)} className="hover:text-red-300">
                    Sil
                  </Dugme>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
