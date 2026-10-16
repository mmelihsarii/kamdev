import { useState, type FormEvent } from "react";
import { IconArrowRight, IconBrandWhatsapp, IconMail, IconMapPin } from "@tabler/icons-react";
import DunyaKuresi from "./DunyaKuresi";
import { useIcerik } from "../veri/kaynak";
import { sayfaMesaji, whatsappAdresi, whatsappNumarasi } from "../lib/whatsapp";

type GonderimDurumu = "bos" | "gonderiliyor" | "tamam" | "hata";

const GIRDI =
  "min-h-12 w-full rounded-xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm text-white outline-none transition-colors placeholder:text-neutral-500 hover:border-white/20 focus:border-vurgu/70 focus:ring-2 focus:ring-vurgu/10";
const ETIKET = "text-xs font-semibold uppercase tracking-[1.2px] text-neutral-400";

function Alan({ ad, etiket, yerTutucu, gerekli = false }: { ad: string; etiket: string; yerTutucu?: string; gerekli?: boolean }) {
  return (
    <div className="flex flex-col gap-2">
      <label htmlFor={ad} className={ETIKET}>{etiket}</label>
      <input id={ad} name={ad} type="text" required={gerekli} placeholder={yerTutucu} className={GIRDI} />
    </div>
  );
}

export default function Iletisim() {
  const icerik = useIcerik();
  const { ayarlar } = icerik;
  const bolum = ayarlar.bolumler.iletisim;
  const site = ayarlar.site;
  const whatsapp = whatsappNumarasi(site.whatsapp);
  const konular = bolum.konular?.length ? bolum.konular : ["Web sitesi"];
  const [durum, setDurum] = useState<GonderimDurumu>("bos");

  async function gonder(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const veri = new FormData(form);
    const talep = {
      konu: String(veri.get("konu") ?? konular[0]),
      ad: String(veri.get("ad") ?? ""),
      firma: String(veri.get("firma") ?? ""),
      iletisim: String(veri.get("iletisim") ?? ""),
      mesaj: String(veri.get("mesaj") ?? ""),
      tuzak: String(veri.get("web") ?? ""),
    };
    setDurum("gonderiliyor");
    try {
      const yanit = await fetch("/api/talep.php", {
        method: "POST",
        headers: { "Content-Type": "application/json", "X-KAM": "1" },
        body: JSON.stringify(talep),
      });
      if (!yanit.ok) throw new Error(String(yanit.status));
      setDurum("tamam");
      form.reset();
    } catch {
      setDurum("hata");
      const govde = [`Konu ${talep.konu}`, `Ad ${talep.ad}`, `Firma ${talep.firma}`, `İletişim ${talep.iletisim}`, "", talep.mesaj].join("\n");
      window.location.href = `mailto:${site.eposta}?subject=${encodeURIComponent(`Proje talebi ${talep.konu}`)}&body=${encodeURIComponent(govde)}`;
    }
  }

  return (
    <section id="iletisim" className="relative min-h-screen overflow-hidden pb-20 pt-[calc(116px+env(safe-area-inset-top))] md:pb-28 md:pt-[calc(144px+env(safe-area-inset-top))]">
      <div aria-hidden="true" className="pointer-events-none absolute left-1/2 top-12 h-80 w-[min(90vw,720px)] -translate-x-1/2 rounded-full bg-vurgu/[0.045] blur-[110px]" />
      <div className="kap relative">
        <header className="mx-auto mb-12 flex max-w-2xl flex-col items-center gap-4 text-center md:mb-16">
          <h1 className="baslik text-4xl leading-[1.08] tracking-[-0.04em] text-white sm:text-5xl lg:text-6xl">
            {bolum.baslik} {bolum.vurgu}
          </h1>
          <p className="max-w-lg text-base leading-7 text-neutral-400">{bolum.aciklama}</p>
        </header>

        <div className="mx-auto grid max-w-5xl grid-cols-1 items-start gap-10 lg:grid-cols-2 lg:gap-14">
          <div className="min-w-0">
            <h2 className="text-xl font-normal text-white">Bize ulaşın</h2>
            <p className="mt-2 max-w-sm text-sm leading-6 text-neutral-400">
              Proje talepleri için e posta ya da formu kullanın.
            </p>

            <ul className="mt-7 space-y-4">
              <li>
                <a href={`mailto:${site.eposta}`} className="group inline-flex min-h-11 items-center gap-3 text-sm text-neutral-300 transition-colors hover:text-white">
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-white/10 bg-white/[0.05] text-neutral-400 transition-colors group-hover:border-vurgu/40 group-hover:bg-vurgu/10 group-hover:text-vurgu"><IconMail size={18} aria-hidden="true" /></span>
                  {site.eposta}
                </a>
              </li>
              {whatsapp && (
                <li>
                  <a href={whatsappAdresi(whatsapp, sayfaMesaji("/iletisim/", icerik))} target="_blank" rel="noopener noreferrer" className="group inline-flex min-h-11 items-center gap-3 text-sm text-neutral-300 transition-colors hover:text-white">
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-white/10 bg-white/[0.05] text-neutral-400 transition-colors group-hover:border-[#25d366]/40 group-hover:bg-[#25d366]/10 group-hover:text-[#25d366]"><IconBrandWhatsapp size={18} aria-hidden="true" /></span>
                    WhatsApp ile yazın
                  </a>
                </li>
              )}
              <li className="flex min-h-11 items-center gap-3 text-sm text-neutral-300">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-white/10 bg-white/[0.05] text-neutral-400"><IconMapPin size={18} aria-hidden="true" /></span>
                {site.konum}
              </li>
            </ul>

            <DunyaKuresi />
          </div>

          <form onSubmit={gonder} className="rounded-2xl border border-white/10 bg-zemin-kart p-6 shadow-[0_24px_80px_rgba(0,0,0,0.22)] sm:p-8">
            <h2 className="text-lg font-semibold text-white">Mesaj gönderin</h2>
            <p className="mt-1 text-sm leading-6 text-neutral-400">Formu doldurun, projenizi birlikte konuşalım.</p>

            <div aria-hidden="true" className="my-6 h-4 w-full opacity-70" style={{
              backgroundImage: "radial-gradient(circle, rgba(255,255,255,0.3) 0.8px, transparent 0.8px)",
              backgroundSize: "6px 6px",
              maskImage: "linear-gradient(90deg, transparent, black 10%, black 90%, transparent)",
            }} />

            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
              <Alan ad="ad" etiket="Adınız" yerTutucu="Adınız ve soyadınız" gerekli />
              <Alan ad="firma" etiket="Firma" yerTutucu="Firma adı" />
            </div>
            <div className="mt-5">
              <Alan ad="iletisim" etiket="Telefon veya e posta" yerTutucu="Size nasıl ulaşalım?" gerekli />
            </div>
            <div className="mt-5 flex flex-col gap-2">
              <label htmlFor="konu" className={ETIKET}>Proje türü</label>
              <select id="konu" name="konu" defaultValue={konular[0]} className={GIRDI}>
                {konular.map((konu) => <option key={konu} value={konu} className="bg-zemin-kart text-white">{konu}</option>)}
              </select>
            </div>
            <div className="mt-5 flex flex-col gap-2">
              <label htmlFor="mesaj" className={ETIKET}>Mesajınız</label>
              <textarea id="mesaj" name="mesaj" rows={5} required placeholder="Projenizden kısaca bahsedin..." className={`${GIRDI} min-h-32 resize-y`} />
            </div>
            <input type="text" name="web" tabIndex={-1} autoComplete="off" aria-hidden="true" className="absolute left-[-9999px] h-px w-px opacity-0" />

            <button type="submit" disabled={durum === "gonderiliyor"} className="group mt-7 inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-[#ecebe7] px-8 text-sm font-semibold text-zemin transition-colors hover:bg-white disabled:cursor-wait disabled:opacity-60">
              {durum === "gonderiliyor" ? "Gönderiliyor" : "Gönder"}
              <IconArrowRight size={17} aria-hidden="true" className="transition-transform group-hover:translate-x-1" />
            </button>
            <p role="status" aria-live="polite" className={`mt-5 text-sm leading-6 ${durum === "tamam" ? "text-emerald-300" : "text-neutral-400"}`}>
              {durum === "tamam"
                ? "Talebiniz bize ulaştı."
                : durum === "hata"
                  ? "Sunucuya ulaşılamadı, mail uygulamanız açılıyor."
                  : "Bilgileriniz yalnızca size dönüş yapmak için kullanılır."}
            </p>
          </form>
        </div>
      </div>
    </section>
  );
}
