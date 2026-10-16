/*
 * Demolar sayfası: bütün sektör panelleri, her demoda ortak olanlar ve
 * sık sorulanlar. Sayılar elle yazılmaz, demo listesinden hesaplanır.
 */
import {
  IconBolt,
  IconDeviceMobile,
  IconFileSpreadsheet,
  IconInfoSquareRounded,
  IconListCheck,
  IconSearch,
} from "@tabler/icons-react";
import SayfaBasligi from "../bilesenler/SayfaBasligi";
import BolumBasligi from "../bilesenler/BolumBasligi";
import Sss from "../bilesenler/Sss";
import TeklifCagrisi from "../bilesenler/TeklifCagrisi";
import { Belirme } from "../bilesenler/Hareket";
import DemoKarti from "../demolar/DemoKarti";
import DemoYelpaze from "../demolar/DemoYelpaze";
import { SEKTORLER, toplamEkran } from "../demolar/katalog";

export const DEMO_SSS = [
  {
    soru: "Demolar gerçek bir yazılım mı, yoksa ekran görüntüsü mü?",
    cevap: "Gerçek bir yazılım. Kayıt açar, durum değiştirir, stok düşer, arama yapar ve dosya indirirsiniz. Yalnız arkasında sunucu yok; her şey sizin tarayıcınızda çalışır.",
  },
  {
    soru: "Yaptığım değişiklikler kaydediliyor mu?",
    cevap: "Yalnız sizin tarayıcınızda, sekmeyi kapatana kadar durur. Başkası göremez. Sol alttaki Sıfırla düğmesi demoyu ilk haline döndürür.",
  },
  {
    soru: "Benim sektörüm listede yok, yine de panel yaptırabilir miyim?",
    cevap: "Evet. Buradaki demolar en sık istenen işleri gösteriyor. Sipariş, randevu, stok, cari, ekip ve raporlama gibi parçalar her sektörde benzer; sizin işinize göre birleştirilir.",
  },
  {
    soru: "Demodaki ekranların aynısını alabilir miyim?",
    cevap: "Alabilirsiniz, ama genelde gerekmez. İlk görüşmede hangi ekranın sizde nasıl kullanılacağını konuşuruz. Fazla ekran hem maliyeti hem öğrenme süresini artırır.",
  },
  {
    soru: "Bir panel ne kadar sürede hazır olur, kaça mal olur?",
    cevap: "Ekran sayısına ve bağlanacak sistemlere göre değişir. Kapsam, teslim tarihi ve fiyat ilk görüşmeden sonra yazılı olarak gelir.",
  },
];

const ORTAKLAR = [
  { ikon: IconBolt, baslik: "Canlı akış", metin: "Panel açıkken arada bir yeni sipariş, randevu ya da giriş düşer. Bildirim gelir, listeler kendiliğinden güncellenir." },
  { ikon: IconSearch, baslik: "Kayıtlarda arama", metin: "Ctrl ve K tuşlarıyla açılan arama, ekran adlarında değil bütün kayıtlarda arar. Müşteri adı, numara ya da ürün yazmanız yeter." },
  { ikon: IconInfoSquareRounded, baslik: "Bu ekran açıklaması", metin: "Her ekranın yanında ne işe yaradığı, işletmeye etkisi ve neler deneyebileceğiniz yazar. Sayıların nasıl hesaplandığı da yanındaki soru işaretinde." },
  { ikon: IconListCheck, baslik: "Görevler", metin: "Her demoda birkaç gerçek iş var. Sipariş kargolamak, randevu almak, iade onaylamak gibi. Bitirdikçe paneli tanırsınız." },
  { ikon: IconDeviceMobile, baslik: "Telefonda da tam", metin: "Menü çekmeceye, tablolar karta döner. Hiçbir sütun yarıdan kesilmez, hiçbir yazı üst üste binmez." },
  { ikon: IconFileSpreadsheet, baslik: "Dışa aktarma", metin: "Her listeyi süzdüğünüz haliyle Excel ile açılan dosya olarak indirebilirsiniz." },
];

export default function Demolar() {
  return (
    <>
      <SayfaBasligi
        baslik="Panelinizi teklif almadan önce deneyin"
        giris="Her demo, o sektörde çalışan hayali bir işletmenin yönetim paneli. Sipariş verin, randevu alın, stok ekleyin; panel gerçekten çalışır. Kayıt ve giriş gerekmez."
        yan={<DemoYelpaze />}
      >
        <dl className="mt-10 flex flex-wrap gap-x-10 gap-y-4">
          {[
            [String(SEKTORLER.length), "sektör"],
            [String(toplamEkran()), "ekran"],
          ].map(([deger, ad]) => (
            <div key={ad}>
              <dt className="sr-only">{ad}</dt>
              <dd className="flex items-baseline gap-2">
                <span className="text-[clamp(2rem,4vw,2.8rem)] font-light leading-none tracking-[-0.04em] text-white">{deger}</span>
                <span className="text-[15px] text-neutral-400">{ad}</span>
              </dd>
            </div>
          ))}
        </dl>
      </SayfaBasligi>

      <section className="py-12 sm:py-16 md:py-20">
        <div className="kap">
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {SEKTORLER.map((s, i) => (
              <Belirme key={s.slug} gecikme={(i % 3) * 0.08} className="h-full">
                <DemoKarti s={s} />
              </Belirme>
            ))}
          </div>
        </div>
      </section>

      <section className="py-16 md:py-24">
        <div className="kap">
          <BolumBasligi baslik="Ekran görüntüsü değil, çalışan bir panel" aciklama="Bütün demolar aynı altyapıyla kuruldu. Sizin paneliniz de bu özelliklerle gelir." />
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {ORTAKLAR.map((o, i) => (
              <Belirme key={o.baslik} gecikme={(i % 3) * 0.06} className="kutu p-6">
                <o.ikon size={24} aria-hidden="true" className="text-vurgu" />
                <h3 className="mt-4 text-[17px] font-bold tracking-tight text-white">{o.baslik}</h3>
                <p className="mt-2 text-[15px] leading-7 text-neutral-300">{o.metin}</p>
              </Belirme>
            ))}
          </div>
        </div>
      </section>

      <Sss sorular={DEMO_SSS} baslik="Demolar hakkında" aciklama="Demonun ne olduğu, ne olmadığı ve sonrasında ne olacağı." />

      <TeklifCagrisi baslik="Sektörünüz burada yoksa da konuşalım." />
    </>
  );
}
