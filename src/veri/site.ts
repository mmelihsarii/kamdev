import { ANLIK } from "./kaynak";

/*
 * Arama motoru etiketleri, kanonik adresler ve sitemap derleme anında üretilir;
 * bu yüzden site kimliği derleme kopyasından okunur. Sayfada görünen iletişim
 * bilgileri ise canlı içerikten gelir.
 */
export const SITE = ANLIK.ayarlar.site;

export function mutlakAdres(yol: string) {
  return SITE.adres + yol;
}
