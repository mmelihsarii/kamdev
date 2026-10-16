/* Kendi hesabı: şifre değiştirme. */
import { useState, type FormEvent } from "react";
import { oturum, type Kullanici } from "../api";
import { SifreGirdisi } from "../Giris";
import { Alan, Baslik, Dugme, KART, usePanel } from "../ortak";

export function SifreFormu() {
  const { bildir, hataBildir } = usePanel();
  const [eski, setEski] = useState("");
  const [yeni, setYeni] = useState("");
  const [tekrar, setTekrar] = useState("");
  const [gonderiliyor, setGonderiliyor] = useState(false);

  const gonder = async (e: FormEvent) => {
    e.preventDefault();
    if (yeni !== tekrar) {
      bildir("Yeni şifreler birbirini tutmuyor", "hata");
      return;
    }
    setGonderiliyor(true);
    try {
      await oturum.sifre(eski, yeni);
      setEski("");
      setYeni("");
      setTekrar("");
      bildir("Şifre değişti");
    } catch (h) {
      hataBildir(h);
    } finally {
      setGonderiliyor(false);
    }
  };

  return (
    <form onSubmit={gonder} className="max-w-md space-y-5">
      <Alan etiket="Şu anki şifre" htmlFor="s-eski">
        <SifreGirdisi id="s-eski" deger={eski} degistir={setEski} />
      </Alan>
      <Alan etiket="Yeni şifre" htmlFor="s-yeni" ipucu="En az 10 karakter.">
        <SifreGirdisi id="s-yeni" deger={yeni} degistir={setYeni} yeni />
      </Alan>
      <Alan etiket="Yeni şifre tekrar" htmlFor="s-tekrar">
        <SifreGirdisi id="s-tekrar" deger={tekrar} degistir={setTekrar} yeni />
      </Alan>
      <Dugme type="submit" tur="birincil" yukleniyor={gonderiliyor}>
        Şifreyi değiştir
      </Dugme>
    </form>
  );
}

export default function HesabimSayfasi({ kullanici }: { kullanici: Kullanici }) {
  return (
    <div>
      <Baslik baslik="Şifremi değiştir" aciklama={`${kullanici.ad || "Yönetici"} olarak giriş yaptın, ${kullanici.eposta}`} />
      <section className={`${KART} p-5 sm:p-6`}>
        <h2 className="mb-5 text-[16px] font-semibold text-white">Şifre değiştir</h2>
        <SifreFormu />
      </section>
    </div>
  );
}
