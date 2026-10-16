/*
 * Bir sektör demosunun tanıtım sayfası. Üstte canlı panel sayfanın içinde
 * çalışır; altında panelin kime, neye yaradığı, ekranları, bir günü ve
 * bağlandığı sistemler anlatılır. Telefonda panel sayfaya gömülmez, tam ekran açılır.
 */
import { useEffect, useState } from "react";
import { IconArrowRight, IconArrowsMaximize, IconCheck, IconClick, IconDeviceMobile, IconInfoSquareRounded, IconLayoutGrid, IconListCheck, IconPlugConnected, IconUserOff, IconX } from "@tabler/icons-react";
import SayfaBasligi from "../bilesenler/SayfaBasligi";
import BolumBasligi from "../bilesenler/BolumBasligi";
import Sss from "../bilesenler/Sss";
import TeklifCagrisi from "../bilesenler/TeklifCagrisi";
import { Belirme } from "../bilesenler/Hareket";
import CanliPanel, { PanelIskeleti } from "../demolar/CanliPanel";
import DemoKarti from "../demolar/DemoKarti";
import { SEKTORLER, panelYolu } from "../demolar/katalog";
import type { SektorBilgi } from "../demolar/tipler";
import { kod } from "../demolar/ortak";
import { useIcerik } from "../veri/kaynak";


/** Panel yalnız geniş ekranda sayfaya gömülür; telefonda iskelet yerine tam ekran bağlantısı görünür. */
function GomuluPanel({ s }: { s: SektorBilgi }) {
  const [genis, setGenis] = useState(false);
  useEffect(() => {
    const m = window.matchMedia("(min-width: 900px)");
    setGenis(m.matches);
    const degis = () => setGenis(m.matches);
    m.addEventListener("change", degis);
    return () => m.removeEventListener("change", degis);
  }, []);

  return (
    <>
      <div className="hidden min-[900px]:block">
        <div className="relative rounded-[22px] bg-gradient-to-b from-white/20 via-white/[0.07] to-white/[0.02] p-px shadow-[0_40px_120px_rgba(0,0,0,0.6)]">
          <div className="overflow-hidden rounded-[21px]">
            <div className="flex h-11 items-center justify-between gap-3 border-b border-white/[0.07] bg-[#08080a] px-4">
              <span className="flex gap-1.5" aria-hidden="true">
                <span className="h-2.5 w-2.5 rounded-full bg-white/15" />
                <span className="h-2.5 w-2.5 rounded-full bg-white/15" />
                <span className="h-2.5 w-2.5 rounded-full bg-white/15" />
              </span>
              <span className="truncate rounded-md bg-white/[0.05] px-4 py-1 text-[12.5px] text-neutral-400">panel.{kod(s.firma).toLowerCase()}.com</span>
              <a href={panelYolu(s.slug)} className="inline-flex items-center gap-1.5 rounded-md px-2 py-1 text-[12.5px] font-medium text-neutral-300 hover:bg-white/10 hover:text-white">
                <IconArrowsMaximize size={14} aria-hidden="true" />
                Tam ekran
              </a>
            </div>
            <div className="h-[min(780px,82svh)]">{genis ? <CanliPanel bilgi={s} gomulu /> : <PanelIskeleti bilgi={s} gomulu />}</div>
          </div>
        </div>
        <ul className="mt-5 grid gap-3 text-[14px] leading-6 text-neutral-400 md:grid-cols-3">
          <li className="flex gap-2.5">
            <IconClick size={19} aria-hidden="true" className="mt-0.5 shrink-0 text-vurgu" />
            Soldaki menüden ekran değiştirin, bir kayda tıklayıp ayrıntısını açın.
          </li>
          <li className="flex gap-2.5">
            <IconInfoSquareRounded size={19} aria-hidden="true" className="mt-0.5 shrink-0 text-vurgu" />
            Sağdaki Bu ekran sütunu, baktığınız ekranın ne işe yaradığını anlatır.
          </li>
          <li className="flex gap-2.5">
            <IconListCheck size={19} aria-hidden="true" className="mt-0.5 shrink-0 text-vurgu" />
            Sol alttaki görevler, paneli birkaç dakikada tanımanızı sağlar.
          </li>
        </ul>
      </div>

      <a href={panelYolu(s.slug)} className="kutu group block p-5 min-[900px]:hidden">
        <span className="flex items-center gap-3">
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl" style={{ background: s.renk }}>
            <s.ikon size={22} aria-hidden="true" className="text-white" />
          </span>
          <span className="min-w-0">
            <span className="block text-[16px] font-semibold text-white">Paneli telefonunuzda açın</span>
            <span className="mt-0.5 block text-[13.5px] text-neutral-400">Tam ekran açılır, menü ve tablolar telefona göre dizilir.</span>
          </span>
          <IconArrowRight size={20} aria-hidden="true" className="ml-auto shrink-0 text-vurgu transition-transform group-hover:translate-x-1" />
        </span>
      </a>
    </>
  );
}

export default function DemoDetay({ s }: { s: SektorBilgi }) {
  const { surec, projeler } = useIcerik();
  const gercek = s.gercekIs && projeler.find((p) => p.slug === s.gercekIs!.slug);
  const digerleri = SEKTORLER.filter((x) => x.slug !== s.slug);

  return (
    <>
      <SayfaBasligi
        baslik={s.baslik}
        giris={s.giris}
        renk={s.renk}
      >
        <div className="mt-8 flex flex-wrap items-center gap-3">
          <a
            href={panelYolu(s.slug)}
            className="inline-flex min-h-11 items-center gap-2 rounded-lg bg-[#ecebe7] px-5 text-[15px] font-semibold text-zemin transition-colors duration-300 hover:bg-white"
          >
            <IconArrowsMaximize size={17} aria-hidden="true" />
            Paneli tam ekran aç
          </a>
          <a href="/iletisim/" className="inline-flex min-h-11 items-center gap-2 rounded-lg border border-white/20 px-5 text-[15px] font-semibold text-white transition-colors hover:border-white/40">
            Bu paneli konuşalım
          </a>
        </div>
        <ul className="mt-8 flex flex-wrap gap-x-7 gap-y-3 text-[14px] text-neutral-300">
          {[
            [IconLayoutGrid, `${s.moduller.length} ekran`],
            [IconListCheck, "Beş görevle tanıtım"],
            [IconDeviceMobile, "Telefonda da çalışır"],
            [IconUserOff, "Kayıt ve giriş yok"],
          ].map(([Ikon, metin]) => {
            const I = Ikon as typeof IconLayoutGrid;
            return (
              <li key={metin as string} className="inline-flex items-center gap-2">
                <I size={17} aria-hidden="true" style={{ color: s.renk }} />
                {metin as string}
              </li>
            );
          })}
        </ul>
      </SayfaBasligi>

      <section className="pt-10 md:pt-14">
        <div className="kap">
          <Belirme>
            <GomuluPanel s={s} />
          </Belirme>
        </div>
      </section>

      <section className="py-16 md:py-24">
        <div className="kap">
          <BolumBasligi baslik="Bu panel kimin işine yarar" />
          <div className="grid gap-3 md:grid-cols-3">
            {s.kimler.map((k, i) => (
              <Belirme key={k.baslik} gecikme={i * 0.08} className="kutu p-6">
                <span className="numara">{String(i + 1).padStart(2, "0")}</span>
                <h3 className="mt-3 text-[18px] font-normal tracking-tight text-white">{k.baslik}</h3>
                <p className="mt-2 text-[15px] leading-7 text-neutral-300">{k.metin}</p>
              </Belirme>
            ))}
          </div>
        </div>
      </section>

      <section className="py-16 md:py-24">
        <div className="kap">
          <BolumBasligi baslik="Bugün nasıl yürüyor, panelle nasıl yürür" aciklama="Bu işletmelerde en sık gördüğümüz dört dağınıklık ve panelin onları nasıl topladığı." />
          <div className="overflow-hidden rounded-2xl border border-white/[0.08]">
            <div className="hidden grid-cols-2 border-b border-white/[0.08] bg-white/[0.02] md:grid">
              <p className="px-6 py-3 text-[12px] font-bold uppercase tracking-[1.4px] text-neutral-500">Bugün</p>
              <p className="border-l border-white/[0.08] px-6 py-3 text-[12px] font-bold uppercase tracking-[1.4px] text-neutral-300">Panelle</p>
            </div>
            {s.oncesi.map((o, i) => (
              <Belirme key={o.once} gecikme={i * 0.05} className="grid border-b border-white/[0.06] last:border-0 md:grid-cols-2">
                <p className="flex gap-3 px-6 py-5 text-[15px] leading-7 text-neutral-400">
                  <IconX size={18} aria-hidden="true" className="mt-1 shrink-0 text-neutral-600" />
                  {o.once}
                </p>
                <p className="flex gap-3 border-white/[0.06] bg-white/[0.015] px-6 py-5 text-[15px] leading-7 text-neutral-100 md:border-l">
                  <IconCheck size={18} aria-hidden="true" className="mt-1 shrink-0" style={{ color: s.renk }} />
                  {o.sonra}
                </p>
              </Belirme>
            ))}
          </div>
        </div>
      </section>

      <section className="py-16 md:py-24">
        <div className="kap">
          <BolumBasligi
            baslik={`Paneldeki ${s.moduller.length} ekran`}
            aciklama="Her ekranın ne işe yaradığı ve içinde neler olduğu. Panelde aç bağlantısı sizi doğrudan o ekrana götürür."
          />
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
            {s.moduller.map((m, i) => (
              <Belirme key={m.id} gecikme={(i % 4) * 0.06} className="kutu flex flex-col p-6">
                <span className="flex h-10 w-10 items-center justify-center rounded-xl" style={{ background: `${s.renk}1f`, color: s.renk }}>
                  <m.ikon size={21} aria-hidden="true" />
                </span>
                <h3 className="mt-4 text-[17px] font-bold tracking-tight text-white">{m.ad}</h3>
                <p className="mt-2 text-[14.5px] leading-6 text-neutral-300">{m.ozet}</p>
                <ul className="mt-4 space-y-2">
                  {m.ozellikler.map((o) => (
                    <li key={o} className="flex gap-2.5 text-[13.5px] leading-6 text-neutral-400">
                      <span aria-hidden="true" className="mt-[9px] h-1.5 w-1.5 shrink-0 rounded-[2px]" style={{ background: s.renk }} />
                      {o}
                    </li>
                  ))}
                </ul>
                <a href={`${panelYolu(s.slug)}#${m.id}`} className="mt-auto inline-flex min-h-10 items-center gap-1.5 pt-4 text-[14px] font-semibold text-white transition-colors hover:text-vurgu">
                  Panelde aç
                  <IconArrowRight size={15} aria-hidden="true" />
                </a>
              </Belirme>
            ))}
          </div>
        </div>
      </section>

      <section className="py-16 md:py-24">
        <div className="kap">
          <BolumBasligi baslik="Bu panelle sıradan bir iş günü" aciklama="Rakamlar örnek. Önemli olan, hangi işin kendiliğinden yürüdüğü ve hangisinin size kaldığı." />
          <ol className="relative grid gap-6 md:grid-cols-5 md:gap-4">
            <span aria-hidden="true" className="absolute left-[7px] top-2 h-[calc(100%-1rem)] w-px bg-white/10 md:left-0 md:top-[7px] md:h-px md:w-full" />
            {s.gun.map((g, i) => (
              <Belirme key={g.saat} etiket="li" gecikme={i * 0.08} className="relative pl-8 md:pl-0 md:pt-8">
                <span aria-hidden="true" className="absolute left-0 top-1 h-[15px] w-[15px] rounded-[4px] border-2 bg-zemin-kart md:top-0" style={{ borderColor: s.renk }} />
                <p className="text-[22px] font-bold tabular-nums tracking-tight text-white">{g.saat}</p>
                <p className="mt-2 text-[14.5px] leading-6 text-neutral-300">{g.metin}</p>
              </Belirme>
            ))}
          </ol>
        </div>
      </section>

      <section className="py-16 md:py-24">
        <div className="kap grid gap-10 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.4fr)] lg:gap-16">
          <BolumBasligi baslik="Panelin konuştuğu sistemler" aciklama="Hangilerinin bağlanacağı sizin kullandığınız hizmetlere göre teklifte netleşir. Listede olmayan bir sistem varsa ilk görüşmede konuşuruz." />
          <ul className="grid gap-3 sm:grid-cols-2">
            {s.entegrasyonlar.map((e, i) => (
              <Belirme key={e.ad} etiket="li" gecikme={(i % 2) * 0.06} className="kutu flex gap-4 p-5">
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-white/10 bg-white/[0.04]">
                  {e.logo ? <img src={e.logo} alt="" width={24} height={24} loading="lazy" className="h-6 w-6 object-contain" /> : <IconPlugConnected size={20} aria-hidden="true" className="text-neutral-400" />}
                </span>
                <span>
                  <span className="block text-[15px] font-semibold text-white">{e.ad}</span>
                  <span className="mt-1 block text-[14px] leading-6 text-neutral-400">{e.metin}</span>
                </span>
              </Belirme>
            ))}
          </ul>
        </div>
      </section>

      {s.gercekIs && gercek && (
        <section className="py-16 md:py-20">
          <div className="kap">
            <Belirme>
              <a href={`/isler/${gercek.slug}/`} className="kutu group grid items-center gap-6 p-6 sm:p-8 md:grid-cols-[minmax(0,1fr)_auto]">
                <span>
                  <span className="mt-2 block text-[clamp(1.5rem,3.4vw,2.2rem)] font-light leading-tight tracking-[-0.03em] text-white transition-colors group-hover:text-vurgu">{s.gercekIs.ad}</span>
                  <span className="mt-3 block max-w-2xl text-[15px] leading-7 text-neutral-300">{s.gercekIs.metin}</span>
                </span>
                <span className="inline-flex items-center gap-2 text-[15px] font-semibold text-white">
                  İşi incele
                  <IconArrowRight size={18} aria-hidden="true" className="transition-transform group-hover:translate-x-1" />
                </span>
              </a>
            </Belirme>
          </div>
        </section>
      )}

      {surec.length > 0 && (
        <section className="py-16 md:py-24">
          <div className="kap">
            <BolumBasligi baslik="Demodan kendi panelinize" aciklama="Demo bir başlangıç noktası. Sizin panelinizde yalnız ihtiyacınız olan ekranlar olur ve sizin iş akışınıza göre kurulur." />
            <ol className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
              {surec.map((a, i) => (
                <Belirme key={a.kimlik} etiket="li" gecikme={i * 0.06} className="kutu p-5">
                  <span className="numara">{a.numara}</span>
                  <h3 className="mt-2 text-[16px] font-bold text-white">{a.baslik}</h3>
                  <p className="mt-2 text-[14px] leading-6 text-neutral-400">{a.aciklama}</p>
                  <p className="mt-3 text-[12.5px] font-semibold text-neutral-500">{a.sure}</p>
                </Belirme>
              ))}
            </ol>
          </div>
        </section>
      )}

      <Sss sorular={s.sss} baslik="Bu demo hakkında sorulanlar" aciklama="Panelin nasıl kurulduğu, verilerin taşınması ve demonun kendisi." />

      {digerleri.length > 0 && (
        <section className="py-16 md:py-24">
          <div className="kap">
            <BolumBasligi baslik="Başka bir sektörün paneline bakın" />
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {digerleri.slice(0, 3).map((x) => (
                <DemoKarti key={x.slug} s={x} kucuk />
              ))}
            </div>
            <a href="/demolar/" className="mt-8 inline-flex min-h-10 items-center gap-2 text-[15px] font-semibold text-white hover:text-vurgu">
              Bütün demolar
              <IconArrowRight size={16} aria-hidden="true" />
            </a>
          </div>
        </section>
      )}

      <TeklifCagrisi baslik="Bu paneli kendi işinize göre konuşalım." />
    </>
  );
}
