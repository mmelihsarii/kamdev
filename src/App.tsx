import { useEffect } from "react";
import Menu from "./bilesenler/Menu";
import Alt from "./bilesenler/Alt";
import WhatsAppDugmesi from "./bilesenler/WhatsAppDugmesi";
import { useAkiciKaydirma } from "./lib/useAkiciKaydirma";
import { sayfaGecisleri } from "./lib/yukleme";
import { rotaBul } from "./rotalar";
import { useIcerik } from "./veri/kaynak";

export default function App({ yol }: { yol: string }) {
  const icerik = useIcerik();
  const rota = rotaBul(yol, icerik);
  useAkiciKaydirma(!rota.yalin);

  // Sayfa hazır: KAM perdesi kalkar; site içi bağlantılarda perde inip yeni sayfada sürer.
  useEffect(() => sayfaGecisleri(), []);

  // Canlı içerikle sayfa değişirse (ör. derlemeden sonra eklenen yazı) başlık da güncellensin.
  useEffect(() => {
    document.title = rota.meta.baslik;
  }, [rota.meta.baslik]);

  // Kartlardaki imleç ışığı: tek dinleyici, yalnızca imlecin altındaki karta yazar.
  useEffect(() => {
    const gezdi = (olay: PointerEvent) => {
      const kutu = (olay.target as Element | null)?.closest?.<HTMLElement>(".kutu");
      if (!kutu) return;
      const alan = kutu.getBoundingClientRect();
      kutu.style.setProperty("--x", `${olay.clientX - alan.left}px`);
      kutu.style.setProperty("--y", `${olay.clientY - alan.top}px`);
    };
    window.addEventListener("pointermove", gezdi, { passive: true });
    return () => window.removeEventListener("pointermove", gezdi);
  }, []);

  if (rota.yalin) return <main id="icerik">{rota.sayfa()}</main>;

  return (
    <>
      <a
        href="#icerik"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-[100] focus:rounded-[2px] focus:bg-white focus:px-4 focus:py-2 focus:font-mono focus:text-[12px] focus:uppercase focus:text-zemin"
      >
        İçeriğe geç
      </a>

      <span id="tepe" aria-hidden="true" className="absolute top-0" />
      <div aria-hidden="true" className="sayfa-isigi" />
      <Menu yol={rota.yol} />
      <main id="icerik">{rota.sayfa()}</main>
      <Alt />
      <WhatsAppDugmesi yol={rota.yol} />
    </>
  );
}
