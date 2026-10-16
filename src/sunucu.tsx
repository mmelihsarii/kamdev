/*
 * Ön işleme girişi. `vite build --ssr` ile derlenir ve scripts/onisle.mjs
 * tarafından çağrılır; tarayıcı paketine girmez.
 */
import { StrictMode } from "react";
import { renderToString } from "react-dom/server";
import App from "./App";
import { BULUNAMADI, tumRotalar, type Rota } from "./rotalar";
import { kafaHtml } from "./lib/seo";
import { ANLIK, IcerikSaglayici, yayindaOlanlar } from "./veri/kaynak";
import { hizmetYolu, isYolu, yaziYolu } from "./veri/yardimci";
import { SITE } from "./veri/site";
import { duzMetin } from "./lib/metin";
import { SEKTORLER, demoYolu } from "./demolar/katalog";

const icerik = yayindaOlanlar(ANLIK);

export function isle(rota: Rota) {
  return {
    kafa: kafaHtml(rota.meta),
    govde: renderToString(
      <StrictMode>
        <IcerikSaglayici canliCek={false}>
          <App yol={rota.yol} />
        </IcerikSaglayici>
      </StrictMode>,
    ),
  };
}

export const rotalar = tumRotalar(icerik);
export const bulunamadi = BULUNAMADI;
export const site = SITE;

/** Dil modellerine sitenin özetini veren llms.txt (https://llmstxt.org). */
export function llmsMetni() {
  const projeler = icerik.projeler.filter((p) => p.adres).map((p) => `${p.adres} (${p.alan})`);
  const satirlar = [
    `# ${SITE.tamAd}`,
    "",
    `> ${SITE.aciklama}`,
    "",
    `- E-posta: ${SITE.eposta}`,
    `- Konum: ${SITE.konum} (Türkiye geneli uzaktan hizmet)`,
    `- Canlı işler: ${projeler.join(", ")}`,
    "",
    "## Hizmetler",
    "",
    ...icerik.hizmetler.map(
      (h) =>
        `- [${h.baslik}](${SITE.adres}${hizmetYolu(h.slug)}): ${h.kisaCevap}` +
        (SITE.fiyatGoster ? ` Başlangıç: ${h.baslangicFiyati} (${h.fiyatNotu}).` : "") +
        ` Teslim: ${h.teslimSuresi}.`,
    ),
    "",
    "## İşler",
    "",
    ...icerik.projeler.map((p) => `- [${p.ad}](${SITE.adres}${isYolu(p)}): ${p.ozet}`),
    "",
    "## Canlı demolar",
    "",
    ...SEKTORLER.map((d) => `- [${d.seo.baslik}](${SITE.adres}${demoYolu(d.slug)}): ${d.seo.aciklama}`),
    "",
    "## Blog",
    "",
    ...icerik.yazilar.map((y) => `- [${y.baslik}](${SITE.adres}${yaziYolu(y.slug)}): ${duzMetin(y.kisaCevap)}`),
    "",
  ];
  return satirlar.join("\n");
}
