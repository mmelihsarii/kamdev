/* Giriş ve ilk kurulum ekranı. Yönetim ve müşteri paneli aynı formu kullanır. */
import { useState, type FormEvent, type MouseEvent } from "react";
import { IconArrowLeft, IconEye, IconEyeOff } from "@tabler/icons-react";
import { oturum, type Kullanici } from "./api";
import { Alan, Dugme, GIRDI, hataMetni } from "./ortak";

export function SifreGirdisi({ id, deger, degistir, yeni }: { id: string; deger: string; degistir: (v: string) => void; yeni?: boolean }) {
  const [goster, setGoster] = useState(false);
  return (
    <div className="relative">
      <input
        id={id}
        type={goster ? "text" : "password"}
        className={`${GIRDI} pr-11`}
        value={deger}
        onChange={(e) => degistir(e.target.value)}
        autoComplete={yeni ? "new-password" : "current-password"}
        required
      />
      <button
        type="button"
        onClick={() => setGoster(!goster)}
        aria-label={goster ? "Şifreyi gizle" : "Şifreyi göster"}
        className="absolute right-1.5 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-md text-neutral-500 hover:text-white"
      >
        {goster ? <IconEyeOff size={17} /> : <IconEye size={17} />}
      </button>
    </div>
  );
}

/** Siteden gelindiyse bir önceki sayfaya döner; doğrudan açıldıysa bağlantı ana sayfaya gider. */
function geriDon(e: MouseEvent<HTMLAnchorElement>) {
  try {
    if (history.length > 1 && new URL(document.referrer).origin === location.origin) {
      e.preventDefault();
      history.back();
    }
  } catch {
    // Yönlendiren adres yoksa bağlantı kendi yoluna gider.
  }
}

export default function Giris({
  mod,
  kurulum = false,
  tamam,
  pencere = false,
}: {
  mod: "yonetim" | "musteri";
  kurulum?: boolean;
  tamam: (k: Kullanici) => void;
  /** Oturum süresi dolunca açık sayfanın üstünde çıkar; arkadaki form kaybolmaz. */
  pencere?: boolean;
}) {
  const [ad, setAd] = useState("");
  const [eposta, setEposta] = useState("");
  const [sifre, setSifre] = useState("");
  const [hata, setHata] = useState<string | null>(null);
  const [gonderiliyor, setGonderiliyor] = useState(false);

  const gonder = async (e: FormEvent) => {
    e.preventDefault();
    setHata(null);
    setGonderiliyor(true);
    try {
      const sonuc = kurulum ? await oturum.kurulum(ad, eposta, sifre) : await oturum.giris(eposta, sifre);
      tamam(sonuc.kullanici);
    } catch (h) {
      setHata(hataMetni(h));
    } finally {
      setGonderiliyor(false);
    }
  };

  const baslik = kurulum ? "Yönetici hesabını oluşturun" : pencere ? "Oturumunuzun süresi doldu" : mod === "yonetim" ? "Yönetim paneli" : "Müşteri paneli";
  const aciklama = kurulum
    ? "Bu ekran yalnızca bir kez açılır. Oluşturduğunuz hesapla siteyi, blogu ve müşteri projelerini yöneteceksiniz."
    : pencere
      ? "Tekrar giriş yapın. Açık olan sayfanız ve yazdıklarınız yerinde duruyor."
      : mod === "yonetim"
        ? "Devam etmek için giriş yapın."
        : "Projenizin hangi aşamada olduğunu, son güncellemeleri ve görselleri buradan takip edebilirsiniz.";

  const form = (
    <form onSubmit={gonder} className="w-full max-w-[400px]">
      {!pencere && (
        <a href="/" className="text-[26px] font-bold leading-none tracking-[-0.07em] text-white">
          KAM
        </a>
      )}
      <h1 className={`${pencere ? "" : "mt-10"} text-[26px] font-bold tracking-tight text-white`}>{baslik}</h1>
      <p className="mt-2 text-[14.5px] leading-relaxed text-neutral-400">{aciklama}</p>

      <div className="mt-8 space-y-5">
        {kurulum && (
          <Alan etiket="Adınız" htmlFor="g-ad">
            <input id="g-ad" className={GIRDI} value={ad} onChange={(e) => setAd(e.target.value)} autoComplete="name" required />
          </Alan>
        )}
        <Alan etiket="Mail adresi" htmlFor="g-eposta">
          <input id="g-eposta" type="email" className={GIRDI} value={eposta} onChange={(e) => setEposta(e.target.value)} autoComplete="username" required autoFocus />
        </Alan>
        <Alan etiket="Şifre" htmlFor="g-sifre" ipucu={kurulum ? "En az 10 karakter." : undefined}>
          <SifreGirdisi id="g-sifre" deger={sifre} degistir={setSifre} yeni={kurulum} />
        </Alan>
      </div>

      {hata && (
        <p role="alert" className="mt-5 rounded-lg border border-red-500/25 bg-red-500/[0.06] px-3.5 py-2.5 text-sm text-red-200">
          {hata}
        </p>
      )}

      <Dugme type="submit" tur="birincil" yukleniyor={gonderiliyor} className="mt-7 h-11 w-full">
        {kurulum ? "Hesabı oluştur" : "Giriş yap"}
      </Dugme>

      {mod === "musteri" && !pencere && (
        <p className="mt-6 text-[13px] leading-relaxed text-neutral-500">
          Giriş bilgileriniz proje başlarken size gönderilir. Şifrenizi unuttuysanız bize yazın, yenisini iletelim.
        </p>
      )}
    </form>
  );

  if (pencere) {
    return (
      <div className="fixed inset-0 z-[95] flex items-center justify-center bg-black/80 p-5 backdrop-blur-sm">
        <div className="w-full max-w-[460px] rounded-2xl border border-white/10 bg-[#0d0d10] p-7">{form}</div>
      </div>
    );
  }

  return (
    <div className="relative flex min-h-[100svh] items-center justify-center overflow-hidden px-5 py-16">
      <div aria-hidden="true" className="pointer-events-none absolute -top-40 left-1/2 h-[480px] w-[780px] -translate-x-1/2 rounded-full bg-vurgu/[0.07] blur-[120px]" />
      {mod === "musteri" && (
        <a
          href="/"
          onClick={geriDon}
          className="group absolute left-5 top-[calc(20px+env(safe-area-inset-top))] inline-flex min-h-10 items-center gap-2 text-sm font-semibold text-neutral-400 transition-colors duration-300 hover:text-white sm:left-8 sm:top-[calc(28px+env(safe-area-inset-top))]"
        >
          <IconArrowLeft size={16} aria-hidden="true" className="transition-transform duration-300 group-hover:-translate-x-1" />
          Siteye dön
        </a>
      )}
      <div className="relative w-full max-w-[400px]">{form}</div>
    </div>
  );
}
