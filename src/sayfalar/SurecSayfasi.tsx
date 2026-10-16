import SayfaBasligi from "../bilesenler/SayfaBasligi";
import SurecHikayesi from "../bilesenler/SurecHikayesi";
import { IkiSutunBolum, IsaretliListe, KalemIzgarasi } from "../bilesenler/IkiSutunBolum";
import Sss from "../bilesenler/Sss";
import TeklifCagrisi from "../bilesenler/TeklifCagrisi";
import { useIcerik } from "../veri/kaynak";

/** Örnek bir projenin hikâyesiyle süreç adımları; altında süreç boyunca verilenler, sizden gerekenler ve sorular. */
export default function SurecSayfasi() {
  const { bolumler } = useIcerik().ayarlar;
  const bolum = bolumler.surec;
  const ek = bolumler.surecSayfasi;

  return (
    <>
      <SayfaBasligi baslik={bolum.baslik} giris={bolum.aciklama} />
      <section className="relative pb-8 md:pb-12">
        <div className="kap">
          <SurecHikayesi kaydirma />
        </div>
      </section>

      {ek?.kalemler && ek.kalemler.length > 0 && (
        <IkiSutunBolum baslik={ek.baslik || "Süreç boyunca"} aciklama={ek.aciklama || undefined}>
          <KalemIzgarasi kalemler={ek.kalemler} />
        </IkiSutunBolum>
      )}

      {ek?.gerekenler && ek.gerekenler.length > 0 && (
        <IkiSutunBolum baslik="Sizden gerekenler" aciklama="Başlarken bunları hazırlarsanız süreç hızlanır. Eksik olanı birlikte tamamlarız.">
          <IsaretliListe maddeler={ek.gerekenler} />
        </IkiSutunBolum>
      )}

      {ek?.sorular && ek.sorular.length > 0 && <Sss sorular={ek.sorular} baslik="Süreç hakkında" />}

      <TeklifCagrisi />
    </>
  );
}
