import Hero from "../bilesenler/Hero";
import BlogVitrini from "../bilesenler/BlogVitrini";
import Guvenenler from "../bilesenler/Guvenenler";
import Hizmetler from "../bilesenler/Hizmetler";
import Isler from "../bilesenler/Isler";
import Teknolojiler from "../bilesenler/Teknolojiler";
import Vitrin from "../bilesenler/Vitrin";
import Surec from "../bilesenler/Surec";
import Ilkeler from "../bilesenler/Ilkeler";
import Sss from "../bilesenler/Sss";
import { useIcerik } from "../veri/kaynak";

export default function AnaSayfa() {
  const { sss, ayarlar } = useIcerik();
  const bolum = ayarlar.bolumler.sss;

  return (
    <>
      <Hero />
      <Guvenenler />
      <BlogVitrini />
      <Hizmetler />
      <Isler />
      <Teknolojiler />
      <Vitrin />
      <Surec />
      <Ilkeler />
      <Sss sorular={sss} baslik={bolum.baslik} aciklama={bolum.aciklama} />
    </>
  );
}
