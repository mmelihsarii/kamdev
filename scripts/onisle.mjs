/*
 * Ön işleme: her rotayı statik HTML'e çevirir, sitemap / robots / llms.txt üretir.
 * Arama motorları ve yapay zekâ botları içeriği JavaScript çalıştırmadan okur;
 * tarayıcıda React aynı HTML'in üzerine hidrasyonla bağlanır.
 */
import { cp, mkdir, readFile, rm, writeFile } from "node:fs/promises";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const kok = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const dist = join(kok, "dist");
const sunucuKlasoru = join(kok, "dist-sunucu");

const { isle, rotalar, bulunamadi, llmsMetni, site } = await import(pathToFileURL(join(sunucuKlasoru, "sunucu.js")).href);

const sablon = await readFile(join(dist, "index.html"), "utf8");
if (!sablon.includes("<!--kafa-->")) throw new Error("index.html içinde <!--kafa--> yer tutucusu yok");

function sayfaHtml(rota) {
  const { kafa, govde } = isle(rota);
  // Fonksiyonlu replace: içerikteki "$&" gibi dizgiler özel desen sayılmasın.
  return sablon.replace("<!--kafa-->", () => kafa).replace('<div id="kok"></div>', () => `<div id="kok">${govde}</div>`);
}

async function yaz(dosya, icerik) {
  await mkdir(dirname(dosya), { recursive: true });
  await writeFile(dosya, icerik);
}

const siteAdresi = site.adres;
const bugun = new Date().toLocaleDateString("sv-SE");

for (const rota of rotalar) {
  const hedef = rota.yol === "/" ? join(dist, "index.html") : join(dist, rota.yol, "index.html");
  await yaz(hedef, sayfaHtml(rota));
}
await yaz(join(dist, "404.html"), sayfaHtml(bulunamadi));

const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${rotalar
  .filter((r) => r.meta.indeksle !== false)
  .map(
    (r) => `  <url>
    <loc>${siteAdresi}${r.yol}</loc>
    <lastmod>${r.meta.guncelleme ?? bugun}</lastmod>
    <priority>${(r.oncelik ?? 0.5).toFixed(1)}</priority>
  </url>`,
  )
  .join("\n")}
</urlset>
`;
await yaz(join(dist, "sitemap.xml"), sitemap);

// Yapay zekâ arama botları bilinçli olarak açık: GEO'nun ön şartı bulunabilir olmak.
const robots = `User-agent: *
Allow: /

User-agent: GPTBot
Allow: /

User-agent: OAI-SearchBot
Allow: /

User-agent: ChatGPT-User
Allow: /

User-agent: ClaudeBot
Allow: /

User-agent: Claude-SearchBot
Allow: /

User-agent: PerplexityBot
Allow: /

User-agent: Google-Extended
Allow: /

Sitemap: ${siteAdresi}/sitemap.xml
`;
await yaz(join(dist, "robots.txt"), robots);
await yaz(join(dist, "llms.txt"), llmsMetni());

// Demo sayfaları veritabanında değil kodda; canlı sitemap.php ve llms.php onları bu listeden okur.
const demolar = rotalar
  .filter((r) => r.yol.startsWith("/demolar/") && r.meta.indeksle !== false)
  .map((r) => ({ yol: r.yol, baslik: r.meta.baslik, aciklama: r.meta.aciklama, oncelik: r.oncelik ?? 0.8 }));

// Arka uç: api klasörü (veri klasörü hariç) ve ilk açılış içeriği pakete girer.
await cp(join(kok, "api"), join(dist, "api"), { recursive: true, filter: (y) => !y.includes("/api/veri") && !y.endsWith("_yerel_sunucu.php") });
await cp(join(kok, "src/veri/icerik.json"), join(dist, "api/tohum.json"));
await yaz(join(dist, "api/demolar.json"), JSON.stringify(demolar, null, 1));
// Panelden eklenen yazılar için boş sayfa kalıbı; api/sayfa.php başlığı ve açıklamayı doldurur.
await yaz(join(dist, "api/_sablon.html"), sablon);

// Site haritası, llms.txt, blog ve hizmet sayfaları veritabanına bakan PHP'den geçer:
// panelde yapılan ekleme ve kaldırmalar yeniden derleme beklemeden aramalara yansır.
const htaccess = `ErrorDocument 404 /404.html
DirectoryIndex index.html index.php

<IfModule mod_headers.c>
  Header always set X-Content-Type-Options "nosniff"
  Header always set Referrer-Policy "strict-origin-when-cross-origin"
  Header always set X-Frame-Options "SAMEORIGIN"
</IfModule>

<IfModule mod_rewrite.c>
  RewriteEngine On
  RewriteRule ^sitemap\\.xml$ api/sitemap.php [L]
  RewriteRule ^llms\\.txt$ api/llms.php [L]
  RewriteRule ^(blog|hizmetler|isler)/([a-z0-9-]+)/?$ api/sayfa.php?tur=$1&slug=$2 [L,QSA]
</IfModule>
`;
await yaz(join(dist, ".htaccess"), htaccess);

await rm(sunucuKlasoru, { recursive: true, force: true });
console.log(`✓ ${rotalar.length} sayfa + 404 ön işlendi, sitemap.xml / robots.txt / llms.txt yazıldı (${siteAdresi})`);
