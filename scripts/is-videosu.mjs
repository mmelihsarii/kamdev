// İş kartlarındaki kaydırma videoları: siteyi başsız Chrome'da açar, yukarıdan aşağı kaydırırken
// her kareyi ayrı çeker (akıcı 60 fps), ffmpeg ile MP4 ve ilk kareden kapak üretir.
// Kullanım: node scripts/is-videosu.mjs [kimlik ...]   (boşsa listedeki hepsi)
// Çıktı: public/isler/video/<kimlik>.mp4 ve <kimlik>.jpg
import { spawn, spawnSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";

const SITELER = [
  { kimlik: "zenomax", url: "https://zenomaxelaletleri.com/" },
  { kimlik: "gky-metal", url: "https://gkymetal.com.tr/" },
  { kimlik: "likya-grup", url: "https://likyainvest.com.tr/" },
  { kimlik: "longevity-house", url: "https://longevityhouse.com.tr/" },
  { kimlik: "cotas", url: "https://cotass.com/" },
  { kimlik: "tepe-optik", url: "https://tepeoptik.com.tr/" },
  { kimlik: "conta-tesisat", url: "https://contatesisat-web.web.app/" },
  // Yayında olmayan marka siteleri: önce dist klasörleri yerelde sunulur
  // (cd ~/Desktop/WEB/biraproje/dist && python3 -m http.server 8471, birafab için 8472).
  { kimlik: "preuger", url: "http://127.0.0.1:8471/" },
  { kimlik: "imperra", url: "http://127.0.0.1:8472/" },
  // KU Etkinlik canlı ana sayfasının başı bozuk (13.10.2026), yerel kopyadan çekilir: ku-etkinlik-web-kok-kopyasi, 8473.
  { kimlik: "ku-etkinlik", url: "http://127.0.0.1:8473/" },
  // FitCity yerel kopya, gerçek veritabanı değil: sahte verili demo DB ile çalışır
  // (DB_DATABASE=<demo.sqlite> php artisan serve --port=8010; hesap demo@fitcity.test, demo12345).
  {
    kimlik: "fitcity",
    url: "http://127.0.0.1:8010/dashboard",
    giris: {
      url: "http://127.0.0.1:8010/",
      js: `const t = document.querySelector("meta[name=csrf-token]")?.content || document.querySelector("input[name=_token]")?.value;
        const r = await fetch("/web-login", { method: "POST", headers: { "Content-Type": "application/json", Accept: "application/json", "X-CSRF-TOKEN": t },
          body: JSON.stringify({ email: "demo@fitcity.test", password: "demo12345" }) });
        return r.status;`,
    },
    // Her ekranın başındaki "Bu ekran ne işe yarar?" kutusu kayıtta görünmesin.
    hazirla: `document.querySelectorAll("[data-panel-help]").forEach((b) => (b.hidden = true));`,
  },
];

const GENIS = 1440, YUKSEK = 900; // kartın ekranı 16:10
const CIKIS_G = 1280, CIKIS_Y = 800;
const FPS = 60;
const PORT = 9337;
const KOK = path.dirname(path.dirname(new URL(import.meta.url).pathname));
const HEDEF = path.join(KOK, "public", "isler", "video");
const ISCI = fs.mkdtempSync(path.join(os.tmpdir(), "kam-video-"));
fs.mkdirSync(HEDEF, { recursive: true });

const secilen = process.argv.slice(2);
const liste = SITELER.filter((s) => !secilen.length || secilen.includes(s.kimlik));
const bekle = (ms) => new Promise((r) => setTimeout(r, ms));

/* ---------- Chrome ve CDP ---------- */
const chrome = spawn("/Applications/Google Chrome.app/Contents/MacOS/Google Chrome", [
  "--headless=new", "--hide-scrollbars", "--mute-audio", `--remote-debugging-port=${PORT}`,
  `--window-size=${GENIS},${YUKSEK}`, "--user-data-dir=" + path.join(ISCI, "profil"), "about:blank"], { stdio: "ignore" });

let ws, no = 0;
const bekleyen = new Map();
async function baglan() {
  let hedef;
  for (let i = 0; i < 60 && !hedef; i++) {
    await bekle(250);
    try { hedef = await (await fetch(`http://127.0.0.1:${PORT}/json/new?about:blank`, { method: "PUT" })).json(); } catch {}
  }
  ws = new WebSocket(hedef.webSocketDebuggerUrl);
  await new Promise((r) => ws.addEventListener("open", r));
  ws.addEventListener("message", (m) => {
    const d = JSON.parse(m.data);
    if (d.id && bekleyen.has(d.id)) { bekleyen.get(d.id)(d); bekleyen.delete(d.id); }
  });
}
const gonder = (method, params = {}) => new Promise((r) => { const id = ++no; bekleyen.set(id, r); ws.send(JSON.stringify({ id, method, params })); });
async function calistir(ifade) {
  const s = await gonder("Runtime.evaluate", { expression: `(async () => { ${ifade} })()`, awaitPromise: true, returnByValue: true });
  if (s.result?.exceptionDetails) throw new Error(s.result.exceptionDetails.exception?.description || "değerlendirme hatası");
  return s.result?.result?.value;
}

/** Yumuşak başlayıp yumuşak biten kaydırma eğrisi. */
const egri = (x) => (x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2);

const yuklensin = () => calistir(`await new Promise((r) => { const b = () => document.readyState === "complete" ? r() : setTimeout(b, 100); b(); });`);

async function kaydet({ kimlik, url, giris, hazirla }) {
  console.log(`${kimlik}: ${url}`);
  await gonder("Emulation.setDeviceMetricsOverride", { width: GENIS, height: YUKSEK, deviceScaleFactor: 1, mobile: false });
  if (giris) {
    await gonder("Page.navigate", { url: giris.url });
    await bekle(500);
    await yuklensin();
    console.log(`  giriş: ${await calistir(giris.js)}`);
  }
  await gonder("Page.navigate", { url });
  await bekle(500);
  await yuklensin();
  await bekle(2500);
  if (hazirla) await calistir(hazirla);

  // Tembel yüklenen görseller ve görününce beliren bölümler kayıttan önce bir kez tetiklensin.
  await calistir(`
    const s = document.createElement("style");
    s.textContent = "html, body { scroll-behavior: auto !important; }";
    document.head.append(s);
    for (let y = 0; y < document.documentElement.scrollHeight; y += 400) { scrollTo(0, y); await new Promise((r) => setTimeout(r, 120)); }
    scrollTo(0, document.documentElement.scrollHeight);
    await new Promise((r) => setTimeout(r, 1500));
    scrollTo(0, 0);
    // Sayfadaki videolar oynayacak kadar yüklensin, yoksa kayıtta siyah kutu kalır.
    await Promise.all([...document.querySelectorAll("video")].map((v) => {
      v.muted = true; v.preload = "auto"; v.play().catch(() => {});
      return new Promise((r) => { if (v.readyState >= 3) return r(); v.addEventListener("canplay", r, { once: true }); setTimeout(r, 10000); });
    }));
    await new Promise((r) => setTimeout(r, 1200));
  `);
  const boy = await calistir(`return document.documentElement.scrollHeight - innerHeight;`);

  // Sayfa uzadıkça hız artar, video 7 ile 14 saniye arasında kalır.
  const kaydirma = Math.min(14, Math.max(7, boy / 1100));
  const bas = 0.6, son = 0.8, toplam = bas + kaydirma + son;
  const kareSayisi = Math.round(toplam * FPS);
  const klasor = path.join(ISCI, kimlik);
  fs.mkdirSync(klasor, { recursive: true });

  for (let i = 0; i < kareSayisi; i++) {
    const t = i / FPS;
    const x = Math.min(1, Math.max(0, (t - bas) / kaydirma));
    const y = Math.round(egri(x) * boy);
    await calistir(`scrollTo(0, ${y}); await new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)));`);
    const { result } = await gonder("Page.captureScreenshot", { format: "jpeg", quality: 92 });
    fs.writeFileSync(path.join(klasor, `${String(i).padStart(5, "0")}.jpg`), Buffer.from(result.data, "base64"));
    if (i % 120 === 0) process.stdout.write(`  ${i}/${kareSayisi}\r`);
  }

  const mp4 = path.join(HEDEF, `${kimlik}.mp4`);
  const ff = spawnSync("ffmpeg", ["-y", "-loglevel", "error", "-framerate", String(FPS), "-i", path.join(klasor, "%05d.jpg"),
    "-vf", `scale=${CIKIS_G}:${CIKIS_Y}:flags=lanczos`, "-c:v", "libx264", "-preset", "slow", "-crf", "27",
    "-pix_fmt", "yuv420p", "-movflags", "+faststart", "-an", mp4], { stdio: "inherit" });
  if (ff.status !== 0) throw new Error(`${kimlik}: ffmpeg başarısız`);
  spawnSync("ffmpeg", ["-y", "-loglevel", "error", "-i", path.join(klasor, "00000.jpg"),
    "-vf", `scale=${CIKIS_G}:${CIKIS_Y}:flags=lanczos`, "-q:v", "4", path.join(HEDEF, `${kimlik}.jpg`)], { stdio: "inherit" });
  const mb = (fs.statSync(mp4).size / 1048576).toFixed(1);
  console.log(`  ${kareSayisi} kare, ${toplam.toFixed(1)} sn, sayfa ${boy + YUKSEK} px, ${mb} MB`);
}

try {
  await baglan();
  await gonder("Page.enable");
  for (const s of liste) await kaydet(s);
} finally {
  const kapandi = new Promise((r) => chrome.once("exit", r));
  chrome.kill();
  await kapandi;
  fs.rmSync(ISCI, { recursive: true, force: true, maxRetries: 5, retryDelay: 200 });
}
