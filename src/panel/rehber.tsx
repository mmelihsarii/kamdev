/*
 * Panelin kullanım dili: her sayfanın başındaki "bu sayfa ne işe yarar" kutusu
 * ve Nasıl kullanılır sayfasındaki adım adım tarifler. Metinlerde düğme adları
 * iki yıldız arasına yazılır ve kalın görünür.
 */
import { Fragment, useState, type ReactNode } from "react";
import { IconBulb, IconChevronDown, IconExternalLink, IconX } from "@tabler/icons-react";

/** **kalın** parçaları <strong> yapar. */
export function Vurgulu({ metin }: { metin: string }) {
  return (
    <>
      {metin.split(/(\*\*[^*]+\*\*)/g).map((p, i) =>
        p.startsWith("**") ? (
          <strong key={i} className="font-semibold text-white">
            {p.slice(2, -2)}
          </strong>
        ) : (
          <Fragment key={i}>{p}</Fragment>
        ),
      )}
    </>
  );
}

export type SayfaYardimi = { ne: string; adimlar?: string[]; sitede?: { ad: string; adres: string } };

export const SAYFA_YARDIMI: Record<string, SayfaYardimi> = {
  yazilar: {
    ne: "Blog sayfasında ve ana sayfadaki blog bölümünde görünen makaleler. Listede en üstteki yazı ana sayfada en büyük kartta durur.",
    adimlar: [
      "Yeni yazı için sağ üstteki **Yeni yazı** düğmesine bas.",
      "Başlığı, kapak görselini ve yazının metnini doldur. Kapak görseli seçince sitedeki 16:10 oranına kırpman istenir. Metni yazarken yan tarafta sitedeki halini görürsün.",
      "Hazır olunca en üstteki **Sitede yayında** anahtarını aç ve **Kaydet ve yayınla** düğmesine bas.",
      "Sırayı değiştirmek için listedeki yukarı ve aşağı oklarını kullan.",
    ],
    sitede: { ad: "Blog sayfasını aç", adres: "/blog/" },
  },
  projeler: {
    ne: "Gerçek müşteriler için yaptığın projeler. Her işin kendi sayfası var ve hepsi İşler sayfasında listelenir. Listedeki ilk dört iş ana sayfada da görünür.",
    adimlar: [
      "**Yeni referans iş** düğmesine bas.",
      "Proje adını, kısa anlatımı ve canlı site adresini yaz.",
      "**Kapak görseli** kartta ve işin sayfasının en üstünde görünür, seçince 16:9 oranına kırpman istenir. **Ekran görüntüleri** işin sayfasının altında galeri olur.",
      "**Proje hakkında** alanına uzun anlatımı, **Neler yaptık** alanına maddeleri yaz. Bunlar işin kendi sayfasında görünür.",
      "**Sitede yayında** anahtarını açıp kaydet. Ana sayfada hangi dördünün görüneceğini oklarla sırayı değiştirerek seçersin.",
    ],
    sitede: { ad: "İşler sayfasını aç", adres: "/isler/" },
  },
  hizmetler: {
    ne: "Ana sayfadaki hizmet kartları, hizmetler sayfası ve her hizmetin kendi sayfası. Fiyat, teslim süresi, fotoğraf ve neler dahil olduğu burada yazar.",
    adimlar: [
      "Bir hizmete tıklayıp açılan sayfadaki alanları değiştir.",
      "Ana sayfa kartındaki kısa başlık ve açıklama ayrı alanlardadır, hizmet sayfasındaki uzun metinler ayrı.",
      "Fotoğraf seçince sitedeki 16:10 oranına kırpman istenir.",
      "Ana sayfada, hizmetler sayfasında ve alt bilgide hizmetler listedeki sırayla çıkar; sırayı oklarla değiştir.",
      "Kaydettiğin anda hem kart hem hizmet sayfası değişir.",
    ],
    sitede: { ad: "Hizmetler sayfasını aç", adres: "/hizmetler/" },
  },
  sss: {
    ne: "Ana sayfanın en altındaki soru cevap bölümü. Google bu soruları arama sonucunda da gösterebilir.",
    adimlar: ["**Yeni soru** ile ekle, var olan soruya tıklayıp değiştir.", "Okları kullanarak sırasını değiştir."],
    sitede: { ad: "Bölümü sitede aç", adres: "/#sss" },
  },
  surec: {
    ne: "Ana sayfadaki Nasıl çalışıyoruz bölümündeki adımlar. Aynı adımlar müşteri panelinde projenin aşamaları olarak da kullanılır.",
    adimlar: ["Bir adımın adını değiştirirsen müşteri panelindeki aşama adı da değişir.", "Yeni adım eklersen müşteri projelerinde seçilebilir hale gelir."],
    sitede: { ad: "Bölümü sitede aç", adres: "/#surec" },
  },
  ilkeler: {
    ne: "Ana sayfadaki Stüdyo bölümündeki kartlar. Her kartın simgesini, başlığını ve açıklamasını buradan değiştirirsin.",
    sitede: { ad: "Bölümü sitede aç", adres: "/#ilkeler" },
  },
  teknolojiler: {
    ne: "Ana sayfadaki kayan logo şeridi ve teknoloji bölümündeki logolar.",
    adimlar: [
      "**Yeni teknoloji logosu** ile ekle ve logoyu görsel olarak yükle.",
      "Logo siyahsa **Koyu logo** anahtarını aç, koyu zeminde açık görünsün.",
      "Teknoloji bölümünde hangi grupta duracağını **Ana sayfa ve ayarlar** içindeki **Teknoloji grupları** sekmesinden seçersin.",
    ],
    sitede: { ad: "Bölümü sitede aç", adres: "/#teknolojiler" },
  },
  ayarlar: {
    ne: "Ana sayfanın en üstündeki büyük yazı, bölümlerin başlıkları ve sitenin genel bilgileri. Sekmeler arasında gezip değiştirdikten sonra tek bir kayıt yeter.",
    adimlar: [
      "**Ana sayfa girişi** en üstteki büyük başlığı, açıklamayı ve düğmeleri değiştirir. Sağ tarafta önizlemesi var.",
      "**Bölüm başlıkları** her bölümün başlığını ve açıklamasını değiştirir.",
      "**Vitrin ve görseller** ana sayfadaki üç boyutlu görsel duvarını değiştirir.",
      "**Site bilgileri** mail adresini, site adresini ve fiyatların görünüp görünmeyeceğini belirler.",
    ],
    sitede: { ad: "Ana sayfayı aç", adres: "/" },
  },
  medya: {
    ne: "Sitede kullanmak için yüklediğin bütün görseller. Bir yazıya ya da işe görsel eklerken buradan seçersin.",
    adimlar: [
      "Görselleri kutunun içine sürükle ya da **Görsel yükle** düğmesine bas.",
      "Büyük fotoğrafları küçültmene gerek yok, sistem kendisi küçültür.",
      "Bir görselin adresini başka bir yerde kullanmak için kopyala simgesine bas.",
    ],
  },
  talepler: {
    ne: "Sitedeki iletişim formunu dolduran kişilerin mesajları. Yeni gelenler kırmızı Yeni yazısıyla işaretlenir.",
    adimlar: [
      "Mesajı oku, **WhatsApp**, **Ara** ya da **Mail yaz** ile kişiye dön.",
      "Sağ üstten durumunu **Okundu** ya da **Dönüldü** yap, liste düzenli kalsın.",
      "Anlaştıysanız **Müşteri olarak başlat** ile hesabını ve projesini tek seferde aç.",
    ],
  },
  musteriProjeleri: {
    ne: "Müşterinin kendi panelinde gördüğü takip ekranını buradan doldurursun. Müşteri ne görüyorsa buradan girilir.",
    adimlar: [
      "Yeni bir müşteri için **Yeni müşteri başlat** düğmesine bas. Hesabı ve projesi birlikte açılır.",
      "Projeye girip **Yolun neresindeyiz** bölümünden bulunduğunuz aşamayı seç, ilerleme çubuğunu ayarla.",
      "Her gelişmede **Güncelleme gönder** ile not ve ekran görüntüsü ekle.",
      "Müşteriden içerik ya da onay bekliyorsan **Kayıt ekle** ile bir Sizden beklenen kaydı aç. Müşteri panelinde en üstte görünür.",
      "Müşterinin ne gördüğünü kontrol etmek için **Müşteri gözüyle gör** düğmesine bas.",
    ],
  },
  hesaplar: {
    ne: "Müşteri paneline girebilen kişiler. Her müşterinin kendi mail adresi ve şifresi olur, yalnızca kendi projesini görür.",
    adimlar: [
      "Yeni müşteriyi **Yeni müşteri başlat** ile açman en kolayı.",
      "Şifresini unutan müşteri için kalem simgesine bas, **Üret** ile yeni şifre ver ve çıkan mesajı müşteriye gönder.",
      "Bir müşterinin girişini kapatmak için silmek yerine **Giriş yapabilsin** anahtarını kapat.",
    ],
  },
  yedekler: {
    ne: "Verilerinin kopyaları ve sildiğin şeylerin durduğu yer. Panelde sildiğin hiçbir şey hemen kaybolmaz.",
    adimlar: [
      "Yanlışlıkla bir şey sildiysen **Çöp kutusu** listesinde bul ve **Geri al** düğmesine bas.",
      "Ayda bir **Tam yedeği indir** ile her şeyin kopyasını bilgisayarına al.",
      "Sistem her gün kendiliğinden yedek alır, en alttaki listede görürsün.",
    ],
  },
};

function gizliMi(anahtar: string) {
  try {
    return localStorage.getItem("kam-yardim-gizli:" + anahtar) === "1";
  } catch {
    return false;
  }
}

/** Sayfanın başındaki açıklama kutusu. Gizlenince tek satırlık bir bağlantıya döner. */
export function YardimKutusu({ anahtar }: { anahtar: string }) {
  const yardim = SAYFA_YARDIMI[anahtar];
  const [gizli, setGizli] = useState(() => gizliMi(anahtar));
  if (!yardim) return null;

  const degistir = (v: boolean) => {
    setGizli(v);
    try {
      localStorage.setItem("kam-yardim-gizli:" + anahtar, v ? "1" : "0");
    } catch {
      // yok say
    }
  };

  if (gizli) {
    return (
      <button type="button" onClick={() => degistir(false)} className="mb-6 inline-flex items-center gap-2 text-[13px] text-neutral-500 hover:text-white">
        <IconBulb size={16} />
        Bu sayfa ne işe yarar?
      </button>
    );
  }

  return (
    <section className="relative mb-7 rounded-xl border border-white/[0.08] bg-gradient-to-br from-white/[0.04] to-white/[0.01] p-5 pr-12 sm:p-6 sm:pr-14">
      <button
        type="button"
        onClick={() => degistir(true)}
        aria-label="Açıklamayı gizle"
        title="Gizle"
        className="absolute right-3 top-3 flex h-8 w-8 items-center justify-center rounded-lg text-neutral-500 hover:bg-white/5 hover:text-white"
      >
        <IconX size={16} />
      </button>
      <p className="flex items-center gap-2 text-[13px] font-semibold text-amber-200">
        <IconBulb size={17} />
        Bu sayfa ne işe yarar?
      </p>
      <p className="mt-2 max-w-3xl text-[14.5px] leading-relaxed text-neutral-200">{yardim.ne}</p>
      {yardim.adimlar && (
        <ol className="mt-4 grid gap-2.5 md:grid-cols-2">
          {yardim.adimlar.map((a, i) => (
            <li key={i} className="flex gap-3 text-[13.5px] leading-relaxed text-neutral-400">
              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-white/[0.07] text-[12px] font-bold tabular-nums text-neutral-200">{i + 1}</span>
              <span>
                <Vurgulu metin={a} />
              </span>
            </li>
          ))}
        </ol>
      )}
      <div className="mt-4 flex flex-wrap items-center gap-4">
        {yardim.sitede && (
          <a href={yardim.sitede.adres} target="_blank" rel="noopener" className="inline-flex items-center gap-1.5 text-[13px] font-medium text-vurgu hover:underline">
            {yardim.sitede.ad}
            <IconExternalLink size={14} />
          </a>
        )}
        <button type="button" onClick={() => degistir(true)} className="text-[13px] text-neutral-500 hover:text-white">
          Anladım, gizle
        </button>
      </div>
    </section>
  );
}

/* ---------------- Nasıl kullanılır ---------------- */

export type Tarif = { soru: string; adimlar: string[]; eylem?: { ad: string; hedef: string }; grup: "site" | "musteri" | "guvenlik" };

export const TARIFLER: Tarif[] = [
  {
    grup: "site",
    soru: "Blog yazısı nasıl eklerim?",
    adimlar: [
      "Soldaki menüden **Blog yazıları** sayfasına gir ve **Yeni yazı** düğmesine bas.",
      "**Başlık** alanına yazının başlığını yaz. Sayfa adresini boş bırakabilirsin, başlıktan üretilir.",
      "**Kapak görseli** bölümünde **Kütüphaneden seç** ile bir görsel seç ya da yenisini yükle.",
      "**Yazının metni** alanına yaz. Üstteki düğmeler ara başlık, kalın yazı ve liste ekler. Sağda sitedeki halini görürsün.",
      "En üstteki **Sitede yayında** anahtarını aç ve **Kaydet ve yayınla** düğmesine bas.",
    ],
    eylem: { ad: "Yeni yazı yaz", hedef: "#/icerik/yazilar/yeni" },
  },
  {
    grup: "site",
    soru: "Ana sayfadaki büyük yazıyı nasıl değiştiririm?",
    adimlar: [
      "Menüden **Ana sayfa ve ayarlar** sayfasına gir. **Ana sayfa girişi** sekmesi açılır.",
      "**Başlığın sabit kısmı** ilk satırdır. **Sırayla değişen satırlar** altında dönen kırmızı satırlardır.",
      "Değiştirdikçe sağdaki önizleme güncellenir. Bitince sağ üstteki kayıt düğmesine bas.",
    ],
    eylem: { ad: "Ana sayfa girişini aç", hedef: "#/ayarlar/giris" },
  },
  {
    grup: "site",
    soru: "Yeni bir referans işi nasıl eklerim?",
    adimlar: [
      "Menüden **Referans işler** sayfasına gir ve **Yeni referans iş** düğmesine bas.",
      "Proje adını, şehri, yılı ve kısa anlatımı yaz.",
      "**Kapak görseli** kartta ve işin sayfasının en üstünde görünür, seçince 16:9 oranına kırpman istenir. **Ekran görüntüleri** işin sayfasının altında galeri olur.",
      "**Proje hakkında** alanına projeyi anlat, **Neler yaptık** alanına maddeleri ekle.",
      "**Sitede yayında** anahtarını aç ve kaydet. İşin kendi sayfası açılır ve İşler sayfasına girer.",
    ],
    eylem: { ad: "Yeni referans iş ekle", hedef: "#/icerik/projeler/yeni" },
  },
  {
    grup: "site",
    soru: "Bir şeyi silmeden sitede nasıl gizlerim?",
    adimlar: [
      "Gizlemek istediğin yazıyı, işi ya da soruyu aç.",
      "En üstteki **Sitede yayında** anahtarını kapat ve kaydet.",
      "Kayıt panelde kalır, ziyaretçiler görmez. Tekrar açtığında aynı haliyle geri gelir.",
    ],
  },
  {
    grup: "site",
    soru: "Görseli nasıl yüklerim?",
    adimlar: [
      "Görsel isteyen her alanda **Kütüphaneden seç** düğmesi vardır. Açılan pencerede görseli sürükleyip bırakabilirsin.",
      "Bütün görselleri görmek için menüden **Görseller** sayfasına gir.",
      "Fotoğrafı küçültmene gerek yok, sistem kendisi küçültüp hızlı açılır hale getirir.",
    ],
    eylem: { ad: "Görsellere git", hedef: "#/medya" },
  },
  {
    grup: "musteri",
    soru: "Yeni bir müşteriyi nasıl başlatırım?",
    adimlar: [
      "Menüden **Yeni müşteri başlat** sayfasına gir. Talepler sayfasındaki **Müşteri olarak başlat** düğmesi de aynı yere götürür.",
      "Müşterinin adını, mail adresini ve projenin adını yaz. Şifre kendiliğinden üretilir.",
      "**Müşteriyi başlat** düğmesine bas. Hesap ve proje birlikte açılır.",
      "Çıkan giriş mesajını **WhatsApp ile gönder** ya da **Kopyala** ile müşteriye ilet. Şifre bir daha gösterilmez.",
    ],
    eylem: { ad: "Yeni müşteri başlat", hedef: "#/yeni-musteri" },
  },
  {
    grup: "musteri",
    soru: "Müşteriye gelişmeyi nasıl gösteririm?",
    adimlar: [
      "Menüden **Müşteri projeleri** sayfasına gir ve projeye tıkla.",
      "Üstteki **Güncelleme gönder** düğmesine bas.",
      "Kısa bir başlık ve açıklama yaz, **Dosya ekle** ile ekran görüntülerini yükle.",
      "Proje yeni bir aşamaya geçtiyse aşamayı seç. **Müşteriye yayınla** dediğin anda müşteri panelinde görünür.",
    ],
    eylem: { ad: "Müşteri projelerine git", hedef: "#/projeler" },
  },
  {
    grup: "musteri",
    soru: "Müşteriden bir şey beklediğimi nasıl söylerim?",
    adimlar: [
      "Projenin sayfasında aşağıdaki **Sorunlar, riskler ve müşteriden beklenenler** bölümüne in.",
      "**Kayıt ekle** düğmesine bas, türü **Sizden beklenen** olarak bırak.",
      "Ne beklediğini yaz, örneğin ürün görselleri ya da logo dosyası. Müşteri panelinde en üstte mavi kutuda görünür.",
      "Müşteri gönderince kaydın yanındaki **Çözüldü** düğmesine bas.",
    ],
    eylem: { ad: "Müşteri projelerine git", hedef: "#/projeler" },
  },
  {
    grup: "musteri",
    soru: "Müşteri şifresini unuttu, ne yaparım?",
    adimlar: [
      "Menüden **Müşteri hesapları** sayfasına gir.",
      "Müşterinin satırındaki kalem simgesine bas ve **Üret** ile yeni şifre oluştur.",
      "Kaydet. Çıkan mesajı müşteriye gönder.",
    ],
    eylem: { ad: "Müşteri hesaplarına git", hedef: "#/hesaplar" },
  },
  {
    grup: "guvenlik",
    soru: "Yanlışlıkla bir şey sildim, nasıl geri alırım?",
    adimlar: [
      "Menüden **Yedekler ve çöp kutusu** sayfasına gir.",
      "**Çöp kutusu** listesinde sildiğin şeyi bul ve **Geri al** düğmesine bas.",
      "Silinen müşteri, projesi ve güncellemeleriyle birlikte geri gelir.",
    ],
    eylem: { ad: "Çöp kutusuna git", hedef: "#/yedekler" },
  },
  {
    grup: "guvenlik",
    soru: "Kaydetmeden çıktım, yazdıklarım gitti mi?",
    adimlar: [
      "Gitmedi. Panel yazdıklarını bu tarayıcıda taslak olarak saklar.",
      "Aynı sayfayı tekrar açınca üstte sarı bir kutu çıkar. **Taslağı geri yükle** düğmesine bas.",
      "Bütün yarım kalan taslakları **Genel bakış** sayfasında da görürsün.",
    ],
  },
  {
    grup: "guvenlik",
    soru: "Yedeği nasıl alırım?",
    adimlar: [
      "Sistem her gün kendiliğinden yedek alır, senin bir şey yapmana gerek yok.",
      "Yine de ayda bir **Yedekler ve çöp kutusu** sayfasındaki **Tam yedeği indir** düğmesiyle bilgisayarına kopya al.",
    ],
    eylem: { ad: "Yedeklere git", hedef: "#/yedekler" },
  },
];

export function TarifKarti({ tarif, acikBaslasin = false }: { tarif: Tarif; acikBaslasin?: boolean }) {
  const [acik, setAcik] = useState(acikBaslasin);
  return (
    <div className="rounded-xl border border-white/[0.07] bg-white/[0.02]">
      <button type="button" onClick={() => setAcik(!acik)} aria-expanded={acik} className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left">
        <span className="text-[15px] font-medium text-white">{tarif.soru}</span>
        <IconChevronDown size={18} className={`shrink-0 text-neutral-500 transition-transform ${acik ? "rotate-180" : ""}`} />
      </button>
      {acik && (
        <div className="border-t border-white/[0.06] px-5 pb-5 pt-4">
          <ol className="space-y-3">
            {tarif.adimlar.map((a, i) => (
              <li key={i} className="flex gap-3 text-[14px] leading-relaxed text-neutral-300">
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-vurgu/15 text-[12px] font-bold tabular-nums text-vurgu">{i + 1}</span>
                <span>
                  <Vurgulu metin={a} />
                </span>
              </li>
            ))}
          </ol>
          {tarif.eylem && (
            <a href={tarif.eylem.hedef} className="mt-5 inline-flex h-9 items-center rounded-lg bg-vurgu px-4 text-[13.5px] font-medium text-white hover:bg-[#ea583f]">
              {tarif.eylem.ad}
            </a>
          )}
        </div>
      )}
    </div>
  );
}

export function Bolum({ baslik, aciklama, children }: { baslik: string; aciklama?: string; children: ReactNode }) {
  return (
    <section className="mt-10">
      <h2 className="text-[18px] font-semibold text-white">{baslik}</h2>
      {aciklama && <p className="mt-1 text-[14px] text-neutral-400">{aciklama}</p>}
      <div className="mt-4 space-y-2">{children}</div>
    </section>
  );
}
