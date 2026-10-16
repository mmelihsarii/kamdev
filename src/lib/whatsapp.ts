/*
 * WhatsApp bağlantısı. Numara panelden site ayarlarına girilir; boşsa düğme
 * hiç görünmez. Mesaj, ziyaretçinin hangi sayfadan yazdığını söyler, böylece
 * ilk cevapta neyle ilgilendiği bellidir.
 */
import { SEKTORLER } from "../demolar/katalog";
import type { Icerik } from "../veri/tipler";

/** 0532 418 22 90, +90 532 418 22 90 ya da 905324182290 aynı numaraya çevrilir. */
export function whatsappNumarasi(ham?: string) {
  let n = (ham ?? "").replace(/\D/g, "");
  if (n.startsWith("0")) n = "90" + n.slice(1);
  if (n.length === 10 && n.startsWith("5")) n = "90" + n;
  return n.length >= 11 ? n : "";
}

export function sayfaMesaji(yol: string, icerik: Icerik) {
  const [, kok, slug] = yol.split("/");
  if (kok === "demolar" && slug) {
    const d = SEKTORLER.find((s) => s.slug === slug);
    if (d) return `Merhaba, sitenizde ${d.ad.toLocaleLowerCase("tr")} demosunu inceledim. Kendi işletmem için konuşmak istiyorum.`;
  }
  if (kok === "demolar") return "Merhaba, sitenizdeki canlı demoları inceledim. Kendi işletmem için bir panel konuşmak istiyorum.";
  if (kok === "hizmetler" && slug) {
    const h = icerik.hizmetler.find((x) => x.slug === slug);
    if (h) return `Merhaba, ${h.baslik.toLocaleLowerCase("tr")} hizmetiniz hakkında bilgi almak istiyorum.`;
  }
  if (kok === "isler" && slug) {
    const p = icerik.projeler.find((x) => (x.slug || x.kimlik) === slug);
    if (p) return `Merhaba, ${p.ad} işinize benzer bir proje için yazıyorum.`;
  }
  return "Merhaba, KAM sitesinden yazıyorum. Bir projem için bilgi almak istiyorum.";
}

export const whatsappAdresi = (numara: string, mesaj: string) => `https://wa.me/${numara}?text=${encodeURIComponent(mesaj)}`;
