/* Nasıl kullanılır: panelin iki işini anlatan giriş ve adım adım tarifler. */
import type { ReactNode } from "react";
import { IconDeviceDesktop, IconRoute } from "@tabler/icons-react";
import { Baslik, KART } from "../ortak";
import { Bolum, TARIFLER, TarifKarti, Vurgulu } from "../rehber";

function Dunya({ ikon, baslik, metin, maddeler }: { ikon: ReactNode; baslik: string; metin: string; maddeler: string[] }) {
  return (
    <div className={`${KART} p-6`}>
      <span className="flex h-11 w-11 items-center justify-center rounded-xl border border-vurgu/30 bg-vurgu/10 text-vurgu">{ikon}</span>
      <h2 className="mt-5 text-[18px] font-semibold text-white">{baslik}</h2>
      <p className="mt-1.5 text-[14px] leading-relaxed text-neutral-400">{metin}</p>
      <ul className="mt-4 space-y-2">
        {maddeler.map((m) => (
          <li key={m} className="flex gap-2.5 text-[13.5px] leading-relaxed text-neutral-300">
            <span aria-hidden="true" className="mt-[8px] h-1.5 w-1.5 shrink-0 rounded-[2px] bg-vurgu" />
            <span>
              <Vurgulu metin={m} />
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default function RehberSayfasi() {
  return (
    <div>
      <Baslik baslik="Nasıl kullanılır" aciklama="Bu panelde iki ayrı şeyi yönetiyorsun. Sol menü de bu ikisine göre ayrılmış." />

      <div className="grid gap-4 lg:grid-cols-2">
        <Dunya
          ikon={<IconDeviceDesktop size={22} />}
          baslik="1. Siten"
          metin="Ziyaretçilerin gördüğü her yazı, görsel ve bölüm. Burada değiştirdiğin şey kaydettiğin anda sitede değişir."
          maddeler={[
            "Makaleler için **Blog yazıları**",
            "Yaptığın projeleri göstermek için **Referans işler**",
            "En üstteki büyük yazı ve bölüm başlıkları için **Ana sayfa ve ayarlar**",
            "Yüklediğin fotoğraflar için **Görseller**",
          ]}
        />
        <Dunya
          ikon={<IconRoute size={22} />}
          baslik="2. Müşterilerin"
          metin="Her müşterinin kendi giriş bilgisiyle açtığı takip ekranı. Müşteri projesinin hangi aşamada olduğunu, gelişmeleri ve görselleri orada görür."
          maddeler={[
            "Siteden yazanlar **Talepler** sayfasına düşer",
            "Anlaştığın kişiyi **Yeni müşteri başlat** ile sisteme al",
            "Gelişmeleri **Müşteri projeleri** içinden **Güncelleme gönder** ile paylaş",
            "Müşteriden bir şey bekliyorsan **Sizden beklenen** kaydı aç",
          ]}
        />
      </div>

      <div className={`${KART} mt-4 p-5 text-[14px] leading-relaxed text-neutral-300`}>
        <Vurgulu metin="Korkmadan dene. Sildiğin her şey **Yedekler ve çöp kutusu** sayfasına gider ve geri alınabilir. Kaydetmeden çıktığın yazılar taslak olarak saklanır. Sistem her gün kendiliğinden yedek alır." />
      </div>

      <Bolum baslik="Siteyle ilgili" aciklama="Yazı, görsel ve sayfa değişiklikleri.">
        {TARIFLER.filter((t) => t.grup === "site").map((t, i) => (
          <TarifKarti key={t.soru} tarif={t} acikBaslasin={i === 0} />
        ))}
      </Bolum>

      <Bolum baslik="Müşterilerle ilgili" aciklama="Talepten projeye, projeden teslime.">
        {TARIFLER.filter((t) => t.grup === "musteri").map((t) => (
          <TarifKarti key={t.soru} tarif={t} />
        ))}
      </Bolum>

      <Bolum baslik="Güvenlik ve yedek">
        {TARIFLER.filter((t) => t.grup === "guvenlik").map((t) => (
          <TarifKarti key={t.soru} tarif={t} />
        ))}
      </Bolum>
    </div>
  );
}
