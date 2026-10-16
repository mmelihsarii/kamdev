import BolumBasligi from "./BolumBasligi";
import SurecHikayesi from "./SurecHikayesi";
import { useIcerik } from "../veri/kaynak";

/** Ana sayfada ve hizmet sayfalarında süreç bölümü; adıma tıklanınca örnek projenin ekranı değişir. */
export default function Surec() {
  const { ayarlar } = useIcerik();
  const bolum = ayarlar.bolumler.surec;

  return (
    <section id="surec" className="relative py-16 sm:py-20 md:py-28">
      <div className="kap">
        <BolumBasligi baslik={bolum.baslik} aciklama={bolum.aciklama} />
        <SurecHikayesi />
      </div>
    </section>
  );
}
