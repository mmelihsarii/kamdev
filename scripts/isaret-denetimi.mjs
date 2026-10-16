/*
 * Görünür metinde yasak işaret denetimi. dist altındaki her HTML sayfasının
 * görünen metnini (script, style ve etiket öznitelikleri hariç) ve <title> ile
 * meta açıklamasını tarar. İzin verilenler: harf, rakam, boşluk, virgül,
 * noktalı virgül, nokta, soru işareti. E posta adresleri ve alan adları ayrıca serbest.
 */
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";

const kok = new URL("../dist/", import.meta.url).pathname;
const htmller = [];
(function gez(klasor) {
  for (const ad of readdirSync(klasor)) {
    const yol = join(klasor, ad);
    if (statSync(yol).isDirectory()) gez(yol);
    else if (ad.endsWith(".html")) htmller.push(yol);
  }
})(kok);

const varlik = { "&amp;": "&", "&lt;": "<", "&gt;": ">", "&quot;": '"', "&#x27;": "'", "&#39;": "'", "&nbsp;": " " };
const coz = (m) => m.replace(/&[#a-z0-9]+;/gi, (v) => varlik[v] ?? v);
const izinli = /[\p{L}\p{N}\s,;.?]/u;
const serbest = /[\w.-]+@[\w.-]+|https?:\/\/\S+|\b(?:[\w-]+\.)+(com|com\.tr|tr|dev|net|org|app)\b/gi;

const bulgular = new Map();
for (const dosya of htmller) {
  const html = readFileSync(dosya, "utf8");
  const govde = html.split('<div id="kok">')[1] ?? "";
  const baslik = (html.match(/<title>([^<]*)<\/title>/) ?? [])[1] ?? "";
  const aciklama = (html.match(/<meta name="description" content="([^"]*)"/) ?? [])[1] ?? "";
  const metin = govde
    .replace(/<script[\s\S]*?<\/script>/g, " ")
    .replace(/<style[\s\S]*?<\/style>/g, " ")
    .replace(/<[^>]+>/g, "\n");
  const parcalar = [baslik, aciklama, ...metin.split("\n")].map((p) => coz(p).replace(serbest, "").trim()).filter(Boolean);
  for (const p of parcalar) {
    for (const ch of p) {
      if (izinli.test(ch)) continue;
      const anahtar = `${ch}  ${p.slice(0, 110)}`;
      bulgular.set(anahtar, (bulgular.get(anahtar) ?? new Set()).add(dosya.replace(kok, "")));
    }
  }
}

const karakterSayisi = {};
for (const k of bulgular.keys()) karakterSayisi[k[0]] = (karakterSayisi[k[0]] ?? 0) + 1;
console.log("Karakter özeti:", JSON.stringify(karakterSayisi));
for (const [k, sayfalar] of bulgular) console.log(k, " <", [...sayfalar].slice(0, 2).join(", "));
console.log(`\nToplam ${bulgular.size} sorunlu metin parçası`);
process.exitCode = bulgular.size ? 1 : 0;
