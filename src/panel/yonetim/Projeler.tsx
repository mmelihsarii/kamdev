/*
 * Müşteri projeleri. Müşterinin panelinde gördüğü her şey buradan girilir:
 * aşama, ilerleme, güncellemeler ve görseller, sorunlar, riskler ve müşteriden beklenenler.
 * İç notlar müşteriye hiçbir zaman gönderilmez.
 */
import { useEffect, useMemo, useRef, useState } from "react";
import {
  IconArrowLeft,
  IconCheck,
  IconEye,
  IconFile,
  IconPencil,
  IconPlus,
  IconRefresh,
  IconSend,
  IconTrash,
  IconUpload,
  IconX,
} from "@tabler/icons-react";
import {
  DURUM_ADI,
  SORUN_TURU_ADI,
  dosyaYukle,
  gunOnceGoster,
  onceGoster,
  tarihGoster,
  yonetim,
  type HesapSatiri,
  type MusteriProjesi,
  type ProjeDosyasi,
  type ProjeGuncellemesi,
  type ProjeSorunu,
} from "../api";
import { FormAlanlari, type AlanTanimi } from "../Form";
import { Alan, BosDurum, Dugme, GIRDI, HataKutusu, KART, SimgeDugme, Yukleniyor, kirliAyarla, useKaydetKisayolu, useKirliKoruma, usePanel, useVeri } from "../ortak";
import { YardimKutusu } from "../rehber";
import { ayniMi, taslakOku, taslakSil, useTaslakYaz } from "../taslak";
import { git, useYonetimIcerik } from "./baglam";

const SORUN_RENGI: Record<ProjeSorunu["tur"], string> = { sorun: "text-red-300", risk: "text-amber-300", bekleyen: "text-sky-300" };
const DURUM_RENGI: Record<MusteriProjesi["durum"], string> = { devam: "text-emerald-400", beklemede: "text-amber-300", tamamlandi: "text-neutral-400" };

function useAsamalar() {
  const { icerik } = useYonetimIcerik();
  return useMemo(() => icerik.surec.filter((s) => s.yayinda !== false), [icerik.surec]);
}

export function IlerlemeCubugu({ deger, ince }: { deger: number; ince?: boolean }) {
  return (
    <div className={`w-full overflow-hidden rounded-full bg-white/[0.07] ${ince ? "h-1.5" : "h-2"}`}>
      <div className="h-full rounded-full bg-gradient-to-r from-vurgu to-[#ff8a3d] transition-[width] duration-700" style={{ width: `${Math.max(0, Math.min(100, deger))}%` }} />
    </div>
  );
}

export default function ProjelerSayfasi({ id, sorgu }: { id?: string; sorgu: URLSearchParams }) {
  if (id) return <ProjeDetay id={id} sorgu={sorgu} />;
  return <ProjeListesi musteriId={Number(sorgu.get("musteri")) || undefined} />;
}

/* ---------------- Liste ---------------- */

function ProjeListesi({ musteriId }: { musteriId?: number }) {
  const asamalar = useAsamalar();
  const { veri, hata, yukleniyor, yenile } = useVeri(() => yonetim<MusteriProjesi[]>("projeler"));
  const [durum, setDurum] = useState<MusteriProjesi["durum"] | "hepsi">("hepsi");
  const liste = (veri ?? []).filter((p) => (!musteriId || p.musteri_id === musteriId) && (durum === "hepsi" || p.durum === durum));

  return (
    <div>
      <div className="mb-7 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-[26px] font-bold tracking-tight text-white sm:text-[30px]">Müşteri projeleri</h1>
          {musteriId && (
            <a href="#/projeler" className="mt-2 inline-block text-[13px] text-vurgu hover:underline">
              Bir müşterinin projeleri gösteriliyor, hepsini göster
            </a>
          )}
        </div>
        <div className="flex flex-wrap gap-2">
          <a
            href={`#/projeler/yeni${musteriId ? `?musteri=${musteriId}` : ""}`}
            className="inline-flex h-10 items-center gap-2 rounded-lg border border-white/12 bg-white/[0.04] px-4 text-sm font-medium text-neutral-100 hover:border-white/25"
          >
            <IconPlus size={16} />
            Var olan müşteriye proje
          </a>
          <a href="#/yeni-musteri" className="inline-flex h-10 items-center gap-2 rounded-lg bg-vurgu px-4 text-sm font-medium text-white hover:bg-[#ea583f]">
            <IconPlus size={16} />
            Yeni müşteri başlat
          </a>
        </div>
      </div>

      <YardimKutusu anahtar="musteriProjeleri" />

      <div className="mb-5 flex gap-1 overflow-x-auto border-b border-white/[0.07]">
        {(["hepsi", "devam", "beklemede", "tamamlandi"] as const).map((k) => (
          <button
            key={k}
            type="button"
            onClick={() => setDurum(k)}
            className={`-mb-px shrink-0 border-b-2 px-3 py-2.5 text-sm font-medium transition-colors ${durum === k ? "border-vurgu text-white" : "border-transparent text-neutral-400 hover:text-neutral-200"}`}
          >
            {k === "hepsi" ? "Hepsi" : DURUM_ADI[k]}
          </button>
        ))}
      </div>

      {yukleniyor && !veri ? (
        <Yukleniyor />
      ) : hata ? (
        <HataKutusu hata={hata} yenile={yenile} />
      ) : liste.length === 0 ? (
        <BosDurum
          baslik="Henüz proje yok"
          metin="Anlaştığın ilk müşteriyi Yeni müşteri başlat ile sisteme al. Hesabı ve projesi birlikte açılır."
          eylem={
            <a href="#/yeni-musteri" className="text-sm font-medium text-vurgu hover:underline">
              Yeni müşteri başlat
            </a>
          }
        />
      ) : (
        <ul className="grid gap-3 md:grid-cols-2">
          {liste.map((p) => (
            <li key={p.id}>
              <a href={`#/projeler/${p.id}`} className={`${KART} block p-5 transition-colors hover:border-white/15 hover:bg-white/[0.035]`}>
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="truncate text-[16px] font-semibold text-white">{p.ad}</p>
                    <p className="mt-0.5 truncate text-[13.5px] text-neutral-400">{p.musteri_firma || p.musteri_ad}</p>
                  </div>
                  <span className={`shrink-0 text-[13px] font-medium ${DURUM_RENGI[p.durum]}`}>{DURUM_ADI[p.durum]}</span>
                </div>
                <div className="mt-5 flex items-center justify-between text-[13px]">
                  <span className="text-neutral-300">{asamalar[p.asama]?.baslik ?? "Aşama seçilmedi"}</span>
                  <span className="tabular-nums text-neutral-400">yüzde {p.ilerleme}</span>
                </div>
                <div className="mt-2">
                  <IlerlemeCubugu deger={p.ilerleme} ince />
                </div>
                <p className="mt-4 flex flex-wrap gap-x-4 gap-y-1 text-[12.5px] text-neutral-500">
                  <span>{p.son_guncelleme ? `Son güncelleme ${gunOnceGoster(p.son_guncelleme)}` : "Henüz güncelleme girilmedi"}</span>
                  {!!p.acik_sorun && <span className="text-amber-300/90">{p.acik_sorun} açık kayıt</span>}
                </p>
              </a>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

/* ---------------- Detay ---------------- */

type ProjeFormu = Omit<MusteriProjesi, "id" | "guncellemeler" | "sorunlar"> & { id?: number };

function bosProje(musteriId?: number): ProjeFormu {
  return {
    musteri_id: musteriId ?? 0,
    ad: "",
    ozet: "",
    asama: 0,
    ilerleme: 0,
    sorumlu: "",
    teknolojiler: [],
    onizleme: "",
    canli: "",
    baslangic: new Date().toISOString().slice(0, 10),
    teslim: "",
    durum: "devam",
    notlar: "",
  };
}

function formaCevir(p: MusteriProjesi): ProjeFormu {
  const { guncellemeler: _g, sorunlar: _s, musteri_ad: _a, musteri_firma: _f, musteri_eposta: _e, son_guncelleme: _sg, acik_sorun: _as, ...geri } = p;
  return { ...geri, ozet: geri.ozet ?? "", notlar: geri.notlar ?? "" };
}

function ProjeDetay({ id, sorgu }: { id: string; sorgu: URLSearchParams }) {
  const yeni = id === "yeni";
  const [projeId, setProjeId] = useState<number | null>(yeni ? null : Number(id));
  const musteriler = useVeri(() => yonetim<HesapSatiri[]>("kullanicilar"));
  const proje = useVeri(() => (projeId ? yonetim<MusteriProjesi>("proje", { id: projeId }) : Promise.resolve(null)), []);

  if (!yeni && proje.yukleniyor && !proje.veri) return <Yukleniyor />;
  if (!yeni && proje.hata) return <HataKutusu hata={proje.hata} yenile={proje.yenile} />;
  if (musteriler.yukleniyor && !musteriler.veri) return <Yukleniyor />;

  return (
    <ProjeDuzenleyici
      baslangic={proje.veri}
      musteriler={(musteriler.veri ?? []).filter((m) => m.rol === "musteri")}
      varsayilanMusteri={Number(sorgu.get("musteri")) || undefined}
      kaydedildi={(p) => {
        proje.setVeri(p);
        if (!projeId) {
          setProjeId(p.id);
          history.replaceState(null, "", `#/projeler/${p.id}`);
        }
      }}
    />
  );
}

function ProjeDuzenleyici({
  baslangic,
  musteriler,
  varsayilanMusteri,
  kaydedildi,
}: {
  baslangic: MusteriProjesi | null;
  musteriler: HesapSatiri[];
  varsayilanMusteri?: number;
  kaydedildi: (p: MusteriProjesi) => void;
}) {
  const { bildir, hataBildir, onayla } = usePanel();
  const asamalar = useAsamalar();
  const [tam, setTam] = useState<MusteriProjesi | null>(baslangic);
  const [kayitli, setKayitli] = useState<ProjeFormu>(() => (baslangic ? formaCevir(baslangic) : bosProje(varsayilanMusteri ?? (musteriler.length === 1 ? musteriler[0].id : undefined))));
  const [deger, setDeger] = useState<ProjeFormu>(kayitli);
  const [kaydediliyor, setKaydediliyor] = useState(false);
  const [guncellemeTetik, setGuncellemeTetik] = useState(0);

  const taslakAnahtari = `proje:${tam?.id ?? "yeni"}`;
  const [taslak, setTaslak] = useState(() => {
    const t = taslakOku<ProjeFormu>(taslakAnahtari);
    return t && !ayniMi(t.veri, kayitli) ? t : null;
  });
  const kirli = !ayniMi(deger, kayitli);
  useTaslakYaz(taslakAnahtari, deger, kirli);
  useKirliKoruma(kirli);

  const yerlestir = (p: MusteriProjesi) => {
    setTam(p);
    kaydedildi(p);
  };

  const kaydet = async (ek?: Partial<ProjeFormu>) => {
    const gonderilecek = { ...deger, ...ek };
    if (!gonderilecek.musteri_id) return bildir("Projeyi bir müşteriye bağla", "hata");
    if (!gonderilecek.ad.trim()) return bildir("Proje adını yaz", "hata");
    setKaydediliyor(true);
    try {
      const p = await yonetim<MusteriProjesi>("proje-kaydet", { proje: gonderilecek });
      taslakSil(taslakAnahtari);
      const f = formaCevir(p);
      setKayitli(f);
      setDeger(f);
      setTaslak(null);
      yerlestir(p);
      bildir("Proje kaydedildi, müşteri panelinde güncel");
    } catch (h) {
      hataBildir(h);
    } finally {
      setKaydediliyor(false);
    }
  };
  useKaydetKisayolu(() => !kaydediliyor && kaydet());

  const sil = async () => {
    if (!tam) return;
    const tamam = await onayla({
      baslik: "Proje silinsin mi?",
      metin: "Proje, bütün güncellemeleri ve sorun kayıtlarıyla birlikte çöp kutusuna taşınır. Müşteri artık göremez. Yedekler sayfasından geri alabilirsin.",
      dugme: "Çöp kutusuna taşı",
      tehlike: true,
    });
    if (!tamam) return;
    try {
      await yonetim("proje-sil", { id: tam.id });
      taslakSil(taslakAnahtari);
      kirliAyarla(false);
      bildir("Çöp kutusuna taşındı");
      git("/projeler");
    } catch (h) {
      hataBildir(h);
    }
  };

  const alanlar: AlanTanimi[] = [
    {
      tur: "secim",
      ad: "musteri_id",
      etiket: "Müşteri",
      zorunlu: true,
      bos: "Müşteri seç",
      secenekler: musteriler.map((m) => ({ deger: String(m.id), ad: [m.ad, m.firma].filter(Boolean).join(", ") || m.eposta })),
      ipucu: musteriler.length ? undefined : "Henüz müşteri hesabı yok. Önce Yeni müşteri başlat sayfasını kullan.",
    },
    { tur: "metin", ad: "ad", etiket: "Proje adı", zorunlu: true },
    {
      tur: "secim",
      ad: "durum",
      etiket: "Durum",
      secenekler: (Object.keys(DURUM_ADI) as MusteriProjesi["durum"][]).map((d) => ({ deger: d, ad: DURUM_ADI[d] })),
    },
    { tur: "metin", ad: "sorumlu", etiket: "Sorumlu kişi", yerTutucu: "Alperen" },
    { tur: "tarih", ad: "baslangic", etiket: "Başlangıç tarihi" },
    { tur: "tarih", ad: "teslim", etiket: "Tahmini teslim tarihi" },
    { tur: "metin", ad: "onizleme", etiket: "Önizleme adresi", yerTutucu: "https://", ipucu: "Müşterinin geliştirme sürümünü görebileceği bağlantı." },
    { tur: "metin", ad: "canli", etiket: "Canlı adres", yerTutucu: "https://" },
    { tur: "liste", ad: "teknolojiler", etiket: "Kullanılan teknolojiler", ogeAdi: "Teknoloji" },
    { tur: "uzun", ad: "ozet", etiket: "Müşterinin göreceği açıklama", satir: 3 },
    { tur: "uzun", ad: "notlar", etiket: "İç notlar", satir: 3, ipucu: "Yalnızca sen görürsün, müşteriye hiçbir zaman gönderilmez." },
  ];

  const formDegeri = { ...deger, musteri_id: deger.musteri_id ? String(deger.musteri_id) : "" } as unknown as Record<string, unknown>;
  const onerilen = asamalar.length ? Math.round(((deger.asama + 0.5) / asamalar.length) * 100) : 0;

  return (
    <div>
      <div className="sticky top-14 z-30 -mx-4 mb-6 border-b border-white/[0.06] bg-zemin/90 px-4 py-3 backdrop-blur sm:-mx-6 sm:px-6 lg:top-0 lg:-mx-10 lg:px-10">
        <div className="mx-auto flex max-w-[1180px] flex-wrap items-center justify-between gap-3">
          <div className="flex min-w-0 items-center gap-2">
            <a href="#/projeler" aria-label="Projelere dön" className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-neutral-400 hover:bg-white/5 hover:text-white">
              <IconArrowLeft size={19} />
            </a>
            <div className="min-w-0">
              <p className="text-[12px] text-neutral-500">{tam ? tam.musteri_firma || tam.musteri_ad : "Müşteri projesi"}</p>
              <p className="truncate text-[15px] font-semibold text-white">{deger.ad || "Yeni proje"}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className={`hidden text-[12.5px] md:inline ${kirli ? "text-amber-300/90" : "text-neutral-500"}`}>{kirli ? "Kaydedilmemiş değişiklik var" : ""}</span>
            {tam && (
              <a
                href={`/musteri/#/proje/${tam.id}`}
                target="_blank"
                rel="noopener"
                className="inline-flex h-10 items-center gap-2 rounded-lg border border-white/12 bg-white/[0.04] px-3.5 text-sm text-neutral-100 hover:border-white/25"
              >
                <IconEye size={16} />
                <span className="hidden sm:inline">Müşteri gözüyle gör</span>
              </a>
            )}
            {tam && !kirli ? (
              <Dugme tur="birincil" ikon={<IconSend size={16} />} onClick={() => setGuncellemeTetik((t) => t + 1)}>
                Güncelleme gönder
              </Dugme>
            ) : (
              <Dugme tur="birincil" onClick={() => kaydet()} yukleniyor={kaydediliyor}>
                {tam ? "Değişiklikleri kaydet" : "Projeyi oluştur"}
              </Dugme>
            )}
          </div>
        </div>
      </div>

      {taslak && (
        <div className="mb-6 flex flex-col gap-3 rounded-xl border border-amber-400/25 bg-amber-400/[0.05] p-4 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm text-amber-100">Bu proje için kaydedilmemiş bir taslağın var, {onceGoster(new Date(taslak.zaman).toISOString())} yazılmış.</p>
          <div className="flex gap-2">
            <Dugme
              kucuk
              tur="birincil"
              onClick={() => {
                setDeger(taslak.veri);
                setTaslak(null);
              }}
            >
              Taslağı geri yükle
            </Dugme>
            <Dugme
              kucuk
              onClick={() => {
                taslakSil(taslakAnahtari);
                setTaslak(null);
              }}
            >
              Taslağı sil
            </Dugme>
          </div>
        </div>
      )}

      <div className="grid gap-6">
        <section className={`${KART} p-5 sm:p-6`}>
          <h2 className="text-[16px] font-semibold text-white">Yolun neresindeyiz</h2>
          <p className="mt-1 text-[13.5px] text-neutral-400">Seçtiğin aşama müşteri panelinde şu an buradayız yazısıyla işaretlenir. Aşamalar sitenin süreç adımlarından gelir.</p>
          <ol className="mt-5 grid gap-2 sm:grid-cols-2 lg:grid-cols-5">
            {asamalar.map((a, i) => {
              const secili = deger.asama === i;
              const gecti = i < deger.asama;
              return (
                <li key={a.kimlik}>
                  <button
                    type="button"
                    onClick={() => setDeger({ ...deger, asama: i })}
                    aria-pressed={secili}
                    className={`flex h-full w-full flex-col rounded-xl border p-4 text-left transition-colors ${
                      secili ? "border-vurgu bg-vurgu/[0.08]" : gecti ? "border-white/10 bg-white/[0.03]" : "border-white/[0.07] hover:border-white/20"
                    }`}
                  >
                    <span className="flex items-center justify-between">
                      <span className={`text-[13px] font-bold tabular-nums ${secili ? "text-vurgu" : "text-neutral-500"}`}>{a.numara || i + 1}</span>
                      {gecti && <IconCheck size={16} className="text-emerald-400" />}
                    </span>
                    <span className={`mt-2 text-[14.5px] font-semibold ${secili || gecti ? "text-white" : "text-neutral-300"}`}>{a.baslik}</span>
                    {secili && <span className="mt-1 text-[12px] font-medium text-vurgu">Şu an buradayız</span>}
                  </button>
                </li>
              );
            })}
          </ol>

          <div className="mt-6">
            <div className="mb-2 flex flex-wrap items-baseline justify-between gap-2">
              <label htmlFor="p-ilerleme" className="text-[13px] font-medium text-neutral-200">
                İlerleme, yüzde {deger.ilerleme}
              </label>
              {onerilen !== deger.ilerleme && (
                <button type="button" onClick={() => setDeger({ ...deger, ilerleme: onerilen })} className="text-[12.5px] text-neutral-400 hover:text-white">
                  Aşamaya göre yüzde {onerilen} yap
                </button>
              )}
            </div>
            <input
              id="p-ilerleme"
              type="range"
              min={0}
              max={100}
              step={5}
              value={deger.ilerleme}
              onChange={(e) => setDeger({ ...deger, ilerleme: Number(e.target.value) })}
              className="kaydirici w-full"
              style={{ ["--dolu" as string]: `${deger.ilerleme}%` }}
            />
          </div>
        </section>

        <section className={`${KART} p-5 sm:p-6`}>
          <h2 className="mb-5 text-[16px] font-semibold text-white">Proje bilgileri</h2>
          <FormAlanlari
            alanlar={alanlar}
            deger={formDegeri}
            degistir={(v) => setDeger({ ...(v as unknown as ProjeFormu), musteri_id: Number(v.musteri_id) || 0 })}
          />
        </section>

        {tam ? (
          <>
            <Guncellemeler proje={tam} asamalar={asamalar} yerlestir={yerlestir} asamaYap={(a) => kaydet({ asama: a })} tetik={guncellemeTetik} />
            <Sorunlar proje={tam} yerlestir={yerlestir} />
            <div className="flex justify-end">
              <Dugme tur="tehlike" ikon={<IconTrash size={16} />} onClick={sil}>
                Projeyi sil
              </Dugme>
            </div>
          </>
        ) : (
          <p className="text-sm text-neutral-500">Projeyi kaydettikten sonra güncelleme, görsel ve sorun ekleyebilirsin.</p>
        )}
      </div>
    </div>
  );
}

/* ---------------- Güncellemeler ---------------- */

type GuncellemeFormu = { id?: number; tarih: string; baslik: string; aciklama: string; asama: number | null; dosyalar: ProjeDosyasi[] };

const bosGuncelleme = (asama: number): GuncellemeFormu => ({ tarih: new Date().toISOString().slice(0, 10), baslik: "", aciklama: "", asama, dosyalar: [] });

function DosyaOnizleme({ d, kaldir }: { d: ProjeDosyasi; kaldir?: () => void }) {
  const gorsel = d.tur.startsWith("image/");
  return (
    <div className="group relative overflow-hidden rounded-lg border border-white/[0.08] bg-white/[0.03]">
      <a href={d.adres} target="_blank" rel="noopener" className="block aspect-[4/3]">
        {gorsel ? (
          <img src={d.adres} alt={d.ad} loading="lazy" className="h-full w-full object-cover" />
        ) : (
          <span className="flex h-full flex-col items-center justify-center gap-2 p-2 text-center text-[12px] text-neutral-400">
            <IconFile size={24} />
            <span className="line-clamp-2 break-all">{d.ad}</span>
          </span>
        )}
      </a>
      {kaldir && (
        <button
          type="button"
          onClick={kaldir}
          aria-label="Kaldır"
          className="absolute right-1.5 top-1.5 flex h-7 w-7 items-center justify-center rounded-md bg-black/70 text-white opacity-0 transition-opacity hover:bg-red-600 group-hover:opacity-100 focus:opacity-100"
        >
          <IconX size={15} />
        </button>
      )}
    </div>
  );
}

function Guncellemeler({
  proje,
  asamalar,
  yerlestir,
  asamaYap,
  tetik,
}: {
  proje: MusteriProjesi;
  asamalar: { baslik: string }[];
  yerlestir: (p: MusteriProjesi) => void;
  asamaYap: (asama: number) => Promise<void>;
  tetik: number;
}) {
  const { bildir, hataBildir, onayla } = usePanel();
  const taslakAnahtari = `guncelleme:${proje.id}`;
  const [form, setForm] = useState<GuncellemeFormu | null>(() => taslakOku<GuncellemeFormu>(taslakAnahtari)?.veri ?? null);
  const [yukleme, setYukleme] = useState(0);
  const [kaydediliyor, setKaydediliyor] = useState(false);
  const [asamayiCek, setAsamayiCek] = useState(true);
  const girdi = useRef<HTMLInputElement>(null);
  const kutu = useRef<HTMLElement>(null);

  // Üstteki Güncelleme gönder düğmesi formu açar ve sayfayı buraya kaydırır.
  useEffect(() => {
    if (!tetik) return;
    setForm((f) => f ?? bosGuncelleme(proje.asama));
    window.setTimeout(() => kutu.current?.scrollIntoView({ behavior: "smooth", block: "start" }), 50);
  }, [tetik, proje.asama]);

  useTaslakYaz(taslakAnahtari, form, !!form && !form.id && !!(form.baslik || form.aciklama || form.dosyalar.length));

  const yukle = async (dosyalar: FileList) => {
    if (!form) return;
    setYukleme(dosyalar.length);
    const eklenen: ProjeDosyasi[] = [];
    for (const d of Array.from(dosyalar)) {
      try {
        const s = await dosyaYukle(d, { ozel: true, projeId: proje.id });
        eklenen.push({ id: s.id, ad: s.ad, tur: s.tur, adres: s.adres });
      } catch (h) {
        hataBildir(h);
      }
      setYukleme((y) => y - 1);
    }
    setForm((f) => (f ? { ...f, dosyalar: [...f.dosyalar, ...eklenen] } : f));
  };

  const kaydet = async () => {
    if (!form) return;
    if (!form.baslik.trim()) return bildir("Güncellemeye bir başlık yaz", "hata");
    setKaydediliyor(true);
    try {
      const p = await yonetim<MusteriProjesi>("guncelleme-kaydet", { guncelleme: { ...form, proje_id: proje.id } });
      yerlestir(p);
      taslakSil(taslakAnahtari);
      const yeniAsama = form.asama;
      setForm(null);
      bildir("Güncelleme müşteri panelinde yayında");
      if (asamayiCek && yeniAsama !== null && yeniAsama !== proje.asama) await asamaYap(yeniAsama);
    } catch (h) {
      hataBildir(h);
    } finally {
      setKaydediliyor(false);
    }
  };

  const sil = async (g: ProjeGuncellemesi) => {
    const tamam = await onayla({ baslik: "Güncelleme silinsin mi?", metin: "Müşteri artık bu güncellemeyi görmez. Çöp kutusundan geri alabilirsin.", dugme: "Çöp kutusuna taşı", tehlike: true });
    if (!tamam) return;
    try {
      yerlestir(await yonetim<MusteriProjesi>("guncelleme-sil", { id: g.id }));
      bildir("Çöp kutusuna taşındı");
    } catch (h) {
      hataBildir(h);
    }
  };

  const guncellemeler = proje.guncellemeler ?? [];

  return (
    <section ref={kutu} className={`${KART} scroll-mt-28 p-5 sm:p-6`}>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-[16px] font-semibold text-white">Güncellemeler</h2>
          <p className="mt-1 text-[13.5px] text-neutral-400">Müşterinin panelinde zaman çizelgesi olarak görünür. Ekran görüntüsü, tasarım ya da belge ekleyebilirsin.</p>
        </div>
        {!form && (
          <Dugme tur="birincil" kucuk ikon={<IconPlus size={15} />} onClick={() => setForm(bosGuncelleme(proje.asama))}>
            Güncelleme ekle
          </Dugme>
        )}
      </div>

      {form && (
        <div className="mt-5 rounded-xl border border-vurgu/25 bg-vurgu/[0.03] p-4 sm:p-5">
          <div className="grid gap-4 sm:grid-cols-[1fr_180px_220px]">
            <Alan etiket="Başlık" htmlFor="g-baslik" zorunlu>
              <input id="g-baslik" className={GIRDI} value={form.baslik} onChange={(e) => setForm({ ...form, baslik: e.target.value })} placeholder="Ana sayfa tasarımı onayınızda" autoFocus />
            </Alan>
            <Alan etiket="Tarih" htmlFor="g-tarih">
              <input id="g-tarih" type="date" className={`${GIRDI} [color-scheme:dark]`} value={form.tarih} onChange={(e) => setForm({ ...form, tarih: e.target.value })} />
            </Alan>
            <Alan etiket="Aşama" htmlFor="g-asama">
              <select
                id="g-asama"
                className={GIRDI}
                value={form.asama ?? ""}
                onChange={(e) => setForm({ ...form, asama: e.target.value === "" ? null : Number(e.target.value) })}
              >
                <option value="">Belirtme</option>
                {asamalar.map((a, i) => (
                  <option key={i} value={i}>
                    {a.baslik}
                  </option>
                ))}
              </select>
            </Alan>
          </div>
          <Alan etiket="Açıklama" htmlFor="g-aciklama" className="mt-4">
            <textarea
              id="g-aciklama"
              rows={4}
              className={`${GIRDI} resize-y leading-relaxed`}
              value={form.aciklama}
              onChange={(e) => setForm({ ...form, aciklama: e.target.value })}
              placeholder="Ne yapıldı, sırada ne var, müşteriden ne bekleniyor."
            />
          </Alan>

          <div className="mt-4">
            <p className="mb-2 text-[13px] font-medium text-neutral-200">Görseller ve belgeler</p>
            <div className="grid grid-cols-3 gap-2 sm:grid-cols-5 lg:grid-cols-6">
              {form.dosyalar.map((d) => (
                <DosyaOnizleme key={d.id} d={d} kaldir={() => setForm({ ...form, dosyalar: form.dosyalar.filter((x) => x.id !== d.id) })} />
              ))}
              <button
                type="button"
                onClick={() => girdi.current?.click()}
                disabled={yukleme > 0}
                className="flex aspect-[4/3] flex-col items-center justify-center gap-1 rounded-lg border border-dashed border-white/15 text-[12.5px] text-neutral-400 transition-colors hover:border-vurgu/60 hover:text-white disabled:opacity-60"
              >
                <IconUpload size={18} />
                {yukleme > 0 ? `${yukleme} dosya yükleniyor` : "Dosya ekle"}
              </button>
            </div>
            <p className="mt-2 text-[12px] text-neutral-500">Görsel, PDF ya da ZIP. Dosyaları yalnızca sen ve bu müşteri görebilir.</p>
            <input
              ref={girdi}
              type="file"
              hidden
              multiple
              accept="image/jpeg,image/png,image/webp,image/gif,application/pdf,application/zip,.zip"
              onChange={(e) => {
                if (e.target.files?.length) yukle(e.target.files);
                e.target.value = "";
              }}
            />
          </div>

          {form.asama !== null && form.asama !== proje.asama && (
            <label className="mt-4 flex items-center gap-2.5 text-[13.5px] text-neutral-300">
              <input type="checkbox" checked={asamayiCek} onChange={(e) => setAsamayiCek(e.target.checked)} className="h-4 w-4 accent-[#e2462d]" />
              Projenin aşamasını da {asamalar[form.asama]?.baslik} olarak güncelle
            </label>
          )}

          <div className="mt-5 flex flex-wrap justify-end gap-2">
            <Dugme
              onClick={() => {
                taslakSil(taslakAnahtari);
                setForm(null);
              }}
            >
              Vazgeç
            </Dugme>
            <Dugme tur="birincil" onClick={kaydet} yukleniyor={kaydediliyor} disabled={yukleme > 0}>
              {form.id ? "Güncellemeyi kaydet" : "Müşteriye yayınla"}
            </Dugme>
          </div>
        </div>
      )}

      {guncellemeler.length === 0 ? (
        !form && <p className="mt-5 text-sm text-neutral-500">Henüz güncelleme yok. İlk güncellemeyi girdiğinde müşteri panelinde görünür.</p>
      ) : (
        <ol className="mt-6 space-y-5 border-l border-white/[0.08] pl-5">
          {guncellemeler.map((g) => (
            <li key={g.id} className="relative">
              <span aria-hidden="true" className="absolute -left-[25px] top-1.5 h-2 w-2 rounded-full bg-neutral-500" />
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="text-[12.5px] text-neutral-500">
                    {tarihGoster(g.tarih)}
                    {g.asama !== null && asamalar[g.asama] && `, ${asamalar[g.asama].baslik}`}
                  </p>
                  <p className="mt-0.5 text-[15px] font-semibold text-white">{g.baslik}</p>
                </div>
                <div className="flex">
                  <SimgeDugme ad="Düzenle" onClick={() => setForm({ id: g.id, tarih: g.tarih, baslik: g.baslik, aciklama: g.aciklama, asama: g.asama, dosyalar: g.dosyalar })}>
                    <IconPencil size={15} />
                  </SimgeDugme>
                  <SimgeDugme ad="Sil" onClick={() => sil(g)} className="hover:text-red-300">
                    <IconTrash size={15} />
                  </SimgeDugme>
                </div>
              </div>
              {g.aciklama && <p className="mt-1.5 whitespace-pre-wrap text-[14px] leading-relaxed text-neutral-300">{g.aciklama}</p>}
              {g.dosyalar.length > 0 && (
                <div className="mt-3 grid grid-cols-3 gap-2 sm:grid-cols-5 lg:grid-cols-6">
                  {g.dosyalar.map((d) => (
                    <DosyaOnizleme key={d.id} d={d} />
                  ))}
                </div>
              )}
            </li>
          ))}
        </ol>
      )}
    </section>
  );
}

/* ---------------- Sorunlar, riskler, beklenenler ---------------- */

type SorunFormu = { id?: number; tur: ProjeSorunu["tur"]; baslik: string; aciklama: string; durum: ProjeSorunu["durum"] };

function Sorunlar({ proje, yerlestir }: { proje: MusteriProjesi; yerlestir: (p: MusteriProjesi) => void }) {
  const { bildir, hataBildir, onayla } = usePanel();
  const [form, setForm] = useState<SorunFormu | null>(null);
  const [kaydediliyor, setKaydediliyor] = useState(false);
  const sorunlar = proje.sorunlar ?? [];

  const kaydet = async (f: SorunFormu) => {
    if (!f.baslik.trim()) return bildir("Bir başlık yaz", "hata");
    setKaydediliyor(true);
    try {
      yerlestir(await yonetim<MusteriProjesi>("sorun-kaydet", { sorun: { ...f, proje_id: proje.id } }));
      setForm(null);
    } catch (h) {
      hataBildir(h);
    } finally {
      setKaydediliyor(false);
    }
  };

  const sil = async (s: ProjeSorunu) => {
    const tamam = await onayla({ baslik: "Kayıt silinsin mi?", metin: "Çöp kutusuna taşınır, geri alabilirsin. Sadece kapatmak istiyorsan çözüldü olarak işaretle.", dugme: "Çöp kutusuna taşı", tehlike: true });
    if (!tamam) return;
    try {
      yerlestir(await yonetim<MusteriProjesi>("sorun-sil", { id: s.id }));
    } catch (h) {
      hataBildir(h);
    }
  };

  return (
    <section className={`${KART} p-5 sm:p-6`}>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-[16px] font-semibold text-white">Sorunlar, riskler ve müşteriden beklenenler</h2>
          <p className="mt-1 text-[13.5px] text-neutral-400">Açık olanlar müşteri panelinde öne çıkar. Müşteriden beklenenler en üstte görünür.</p>
        </div>
        {!form && (
          <Dugme kucuk ikon={<IconPlus size={15} />} onClick={() => setForm({ tur: "bekleyen", baslik: "", aciklama: "", durum: "acik" })}>
            Kayıt ekle
          </Dugme>
        )}
      </div>

      {form && (
        <div className="mt-5 grid gap-4 rounded-xl border border-white/10 bg-white/[0.02] p-4 sm:grid-cols-[200px_1fr]">
          <Alan etiket="Tür" htmlFor="s-tur">
            <select id="s-tur" className={GIRDI} value={form.tur} onChange={(e) => setForm({ ...form, tur: e.target.value as SorunFormu["tur"] })}>
              {(Object.keys(SORUN_TURU_ADI) as ProjeSorunu["tur"][]).map((t) => (
                <option key={t} value={t}>
                  {SORUN_TURU_ADI[t]}
                </option>
              ))}
            </select>
          </Alan>
          <Alan etiket="Başlık" htmlFor="s-baslik" zorunlu>
            <input id="s-baslik" className={GIRDI} value={form.baslik} onChange={(e) => setForm({ ...form, baslik: e.target.value })} autoFocus placeholder="Ürün görselleri bekleniyor" />
          </Alan>
          <Alan etiket="Açıklama" htmlFor="s-aciklama" className="sm:col-span-2">
            <textarea id="s-aciklama" rows={3} className={`${GIRDI} resize-y`} value={form.aciklama} onChange={(e) => setForm({ ...form, aciklama: e.target.value })} />
          </Alan>
          <div className="flex justify-end gap-2 sm:col-span-2">
            <Dugme onClick={() => setForm(null)}>Vazgeç</Dugme>
            <Dugme tur="birincil" onClick={() => kaydet(form)} yukleniyor={kaydediliyor}>
              Kaydet
            </Dugme>
          </div>
        </div>
      )}

      {sorunlar.length === 0 ? (
        !form && <p className="mt-5 text-sm text-neutral-500">Kayıt yok.</p>
      ) : (
        <ul className="mt-5 divide-y divide-white/[0.05]">
          {sorunlar.map((s) => (
            <li key={s.id} className={`flex flex-col gap-2 py-3.5 sm:flex-row sm:items-start ${s.durum === "cozuldu" ? "opacity-55" : ""}`}>
              <div className="min-w-0 flex-1">
                <p className="flex flex-wrap items-baseline gap-x-2.5">
                  <span className={`text-[12.5px] font-semibold ${SORUN_RENGI[s.tur]}`}>{SORUN_TURU_ADI[s.tur]}</span>
                  <span className={`text-[14.5px] font-medium text-neutral-100 ${s.durum === "cozuldu" ? "line-through decoration-neutral-500" : ""}`}>{s.baslik}</span>
                  {s.durum === "cozuldu" && <span className="text-[12.5px] text-emerald-400">Çözüldü</span>}
                </p>
                {s.aciklama && <p className="mt-1 whitespace-pre-wrap text-[13.5px] text-neutral-400">{s.aciklama}</p>}
              </div>
              <div className="flex shrink-0 items-center gap-1">
                <Dugme
                  kucuk
                  tur="sade"
                  ikon={s.durum === "acik" ? <IconCheck size={15} /> : <IconRefresh size={15} />}
                  onClick={() => kaydet({ ...s, durum: s.durum === "acik" ? "cozuldu" : "acik" })}
                >
                  {s.durum === "acik" ? "Çözüldü" : "Tekrar aç"}
                </Dugme>
                <SimgeDugme ad="Düzenle" onClick={() => setForm({ id: s.id, tur: s.tur, baslik: s.baslik, aciklama: s.aciklama, durum: s.durum })}>
                  <IconPencil size={15} />
                </SimgeDugme>
                <SimgeDugme ad="Sil" onClick={() => sil(s)} className="hover:text-red-300">
                  <IconTrash size={15} />
                </SimgeDugme>
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

