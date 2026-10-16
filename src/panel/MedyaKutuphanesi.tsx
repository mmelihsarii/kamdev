/*
 * Medya kütüphanesi. Yüklenen görseller sunucuda WebP'ye çevrilir. Seçim
 * modunda bir ya da birden çok görsel seçilip forma geri verilir.
 */
import { useMemo, useRef, useState, type DragEvent } from "react";
import { IconCheck, IconCopy, IconPhotoPlus, IconTrash, IconUpload } from "@tabler/icons-react";
import { boyutGoster, dosyaYukle, tarihGoster, yonetim, type MedyaDosyasi } from "./api";
import { BosDurum, Dugme, HataKutusu, Pencere, SimgeDugme, Yukleniyor, panoyaKopyala, usePanel, useVeri } from "./ortak";

type Secim = { coklu: boolean; sec: (adresler: string[]) => void };

export function MedyaKutuphanesi({ secim, siteGorselleri = [] }: { secim?: Secim; siteGorselleri?: string[] }) {
  const { bildir, hataBildir, onayla } = usePanel();
  const { veri, setVeri, hata, yukleniyor, yenile } = useVeri(() => yonetim<MedyaDosyasi[]>("medya"));
  const [sekme, setSekme] = useState<"yuklenen" | "site">("yuklenen");
  const [secilen, setSecilen] = useState<string[]>([]);
  const [yukleme, setYukleme] = useState<{ biten: number; toplam: number } | null>(null);
  const [surukleniyor, setSurukleniyor] = useState(false);
  const girdi = useRef<HTMLInputElement>(null);

  const yukle = async (dosyalar: FileList | File[]) => {
    const liste = Array.from(dosyalar).filter((d) => d.type.startsWith("image/"));
    if (!liste.length) {
      bildir("Yalnızca görsel dosyaları yüklenebilir", "hata");
      return;
    }
    setYukleme({ biten: 0, toplam: liste.length });
    const yeni: MedyaDosyasi[] = [];
    for (const d of liste) {
      try {
        const sonuc = await dosyaYukle(d);
        yeni.push({ ...sonuc, yol: "", boyut: d.size, genislik: sonuc.genislik ?? null, yukseklik: sonuc.yukseklik ?? null, olusturma: new Date().toISOString() });
      } catch (h) {
        hataBildir(h);
      }
      setYukleme((y) => (y ? { ...y, biten: y.biten + 1 } : y));
    }
    setYukleme(null);
    if (yeni.length) {
      setVeri((v) => [...yeni.reverse(), ...(v ?? [])]);
      setSekme("yuklenen");
      bildir(yeni.length === 1 ? "Görsel yüklendi" : `${yeni.length} görsel yüklendi`);
      if (secim && !secim.coklu) setSecilen([yeni[0].adres]);
      else if (secim) setSecilen((s) => [...s, ...yeni.map((y) => y.adres)]);
    }
  };

  const birak = (e: DragEvent) => {
    e.preventDefault();
    setSurukleniyor(false);
    if (e.dataTransfer.files.length) yukle(e.dataTransfer.files);
  };

  const sec = (adres: string) => {
    if (!secim) return;
    if (!secim.coklu) {
      setSecilen([adres]);
      return;
    }
    setSecilen((s) => (s.includes(adres) ? s.filter((x) => x !== adres) : [...s, adres]));
  };

  const sil = async (m: MedyaDosyasi) => {
    const tamam = await onayla({
      baslik: "Görsel silinsin mi?",
      metin: "Dosya sunucudaki yedek klasörüne taşınır. Bu görseli kullanan sayfalar varsa orada boş görünür.",
      dugme: "Sil",
      tehlike: true,
    });
    if (!tamam) return;
    try {
      await yonetim("dosya-sil", { id: m.id });
      setVeri((v) => (v ?? []).filter((x) => x.id !== m.id));
      bildir("Görsel silindi");
    } catch (h) {
      hataBildir(h);
    }
  };

  const gorunen = useMemo<{ adres: string; ad: string; m?: MedyaDosyasi }[]>(() => {
    if (sekme === "site") return siteGorselleri.map((adres) => ({ adres, ad: adres.split("/").pop() ?? adres }));
    return (veri ?? []).map((m) => ({ adres: m.adres, ad: m.ad, m }));
  }, [sekme, veri, siteGorselleri]);

  return (
    <div>
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setSurukleniyor(true);
        }}
        onDragLeave={() => setSurukleniyor(false)}
        onDrop={birak}
        className={`flex flex-col items-center justify-center gap-3 rounded-xl border border-dashed px-6 py-8 text-center transition-colors ${
          surukleniyor ? "border-vurgu bg-vurgu/[0.06]" : "border-white/12 bg-white/[0.015]"
        }`}
      >
        <IconPhotoPlus size={28} className="text-neutral-500" aria-hidden="true" />
        <p className="text-sm text-neutral-300">Görselleri buraya sürükle ya da bilgisayarından seç.</p>
        <p className="text-[12.5px] text-neutral-500">JPG, PNG, WEBP ya da GIF. Büyük görseller otomatik küçültülür.</p>
        <Dugme tur="birincil" kucuk ikon={<IconUpload size={15} />} onClick={() => girdi.current?.click()} yukleniyor={!!yukleme}>
          {yukleme ? `Yükleniyor ${yukleme.biten} bitti, toplam ${yukleme.toplam}` : "Görsel yükle"}
        </Dugme>
        <input
          ref={girdi}
          type="file"
          accept="image/jpeg,image/png,image/webp,image/gif"
          multiple
          hidden
          onChange={(e) => {
            if (e.target.files) yukle(e.target.files);
            e.target.value = "";
          }}
        />
      </div>

      {siteGorselleri.length > 0 && (
        <div className="mt-5 flex gap-1 border-b border-white/[0.07]">
          {(
            [
              ["yuklenen", "Yüklenenler"],
              ["site", "Sitede kullanılanlar"],
            ] as const
          ).map(([k, ad]) => (
            <button
              key={k}
              type="button"
              onClick={() => setSekme(k)}
              className={`-mb-px border-b-2 px-3 py-2.5 text-sm font-medium transition-colors ${
                sekme === k ? "border-vurgu text-white" : "border-transparent text-neutral-400 hover:text-neutral-200"
              }`}
            >
              {ad}
            </button>
          ))}
        </div>
      )}

      <div className="mt-5">
        {sekme === "yuklenen" && yukleniyor && !veri ? (
          <Yukleniyor />
        ) : sekme === "yuklenen" && hata ? (
          <HataKutusu hata={hata} yenile={yenile} />
        ) : gorunen.length === 0 ? (
          <BosDurum baslik="Henüz görsel yok" metin="Yüklediğin görseller burada listelenir ve sitenin her yerinde kullanılabilir." />
        ) : (
          <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
            {gorunen.map((g) => {
              const secili = secilen.includes(g.adres);
              const m = g.m;
              return (
                <li key={g.adres} className="group">
                  <button
                    type="button"
                    onClick={() => (secim ? sec(g.adres) : window.open(g.adres, "_blank"))}
                    className={`relative block aspect-[4/3] w-full overflow-hidden rounded-lg border bg-white/[0.03] transition ${
                      secili ? "border-vurgu ring-2 ring-vurgu/50" : "border-white/[0.07] hover:border-white/25"
                    }`}
                  >
                    <img src={g.adres} alt="" loading="lazy" className="h-full w-full object-cover" />
                    {secili && (
                      <span className="absolute right-2 top-2 flex h-6 w-6 items-center justify-center rounded-md bg-vurgu text-white">
                        <IconCheck size={15} stroke={2.5} />
                      </span>
                    )}
                  </button>
                  <div className="mt-1.5 flex items-start justify-between gap-1">
                    <div className="min-w-0">
                      <p className="truncate text-[12.5px] text-neutral-300" title={g.ad}>
                        {g.ad}
                      </p>
                      {m && (
                        <p className="text-[11.5px] text-neutral-500">
                          {m.genislik && m.yukseklik ? `${m.genislik} x ${m.yukseklik}, ` : ""}
                          {boyutGoster(m.boyut)}
                          {m.olusturma ? `, ${tarihGoster(m.olusturma)}` : ""}
                        </p>
                      )}
                    </div>
                    {!secim && (
                      <div className="flex shrink-0">
                        <SimgeDugme
                          ad="Adresi kopyala"
                          onClick={async () => {
                            await panoyaKopyala(new URL(g.adres, window.location.origin).href);
                            bildir("Adres kopyalandı");
                          }}
                        >
                          <IconCopy size={15} />
                        </SimgeDugme>
                        {m && (
                          <SimgeDugme ad="Sil" onClick={() => sil(m)} className="hover:text-red-300">
                            <IconTrash size={15} />
                          </SimgeDugme>
                        )}
                      </div>
                    )}
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>

      {secim && (
        <div className="sticky bottom-0 -mx-5 -mb-5 mt-6 flex items-center justify-between gap-3 border-t border-white/[0.07] bg-[#0d0d10] px-5 py-4">
          <span className="text-sm text-neutral-400">{secilen.length ? `${secilen.length} görsel seçildi` : "Bir görsel seç"}</span>
          <Dugme tur="birincil" disabled={!secilen.length} onClick={() => secim.sec(secilen)}>
            Seç
          </Dugme>
        </div>
      )}
    </div>
  );
}

/** Formlardan açılan seçim penceresi. */
export function MedyaSecici({
  acik,
  kapat,
  coklu = false,
  sec,
  siteGorselleri,
}: {
  acik: boolean;
  kapat: () => void;
  coklu?: boolean;
  sec: (adresler: string[]) => void;
  siteGorselleri?: string[];
}) {
  return (
    <Pencere acik={acik} kapat={kapat} baslik={coklu ? "Görselleri seç" : "Görsel seç"} genis>
      {acik && (
        <MedyaKutuphanesi
          siteGorselleri={siteGorselleri}
          secim={{
            coklu,
            sec: (a) => {
              sec(a);
              kapat();
            },
          }}
        />
      )}
    </Pencere>
  );
}
