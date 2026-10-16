/* Medya kütüphanesi sayfası. */
import { MedyaKutuphanesi } from "../MedyaKutuphanesi";
import { Baslik } from "../ortak";
import { YardimKutusu } from "../rehber";
import { siteGorselleri } from "../sema";
import { useYonetimIcerik } from "./baglam";

export default function MedyaSayfasi() {
  const { icerik } = useYonetimIcerik();
  return (
    <div>
      <Baslik baslik="Görseller" />
      <YardimKutusu anahtar="medya" />
      <MedyaKutuphanesi siteGorselleri={siteGorselleri(icerik)} />
    </div>
  );
}
