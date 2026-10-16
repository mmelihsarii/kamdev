/*
 * Sayfa geçiş perdesi. Perdenin kendisi ve KAM yazısının çizimi index.html içindedir, böylece
 * JavaScript gelmeden ilk karede görünür. Yazı menüdeki logonun Roboto Bold harfleridir: önce
 * dış hatları yazılır, sonra içi dolar. Sayfa hazır olunca yazı küçülüp menüdeki logonun tam
 * yerine iner ve perde arkasından silinir. Perde yalnız oturumdaki ilk girişte ve KAM
 * logosuna tıklanınca iner, diğer bağlantılar ve yenilemeler perdesiz açılır. Logoyla başka sayfaya
 * geçerken yazı yeni sayfada kaldığı yerden sürer (tıklama anı sessionStorage ile taşınır).
 */

const SINIFLAR = ["yk-ilk", "yk-gecis", "yk-giris", "yk-hazir", "yk-bitti", "yk-kalk", "yk-logo"];
/** K, A ve M yazılıp dolana kadar perde açık kalır; uçuşla birlikte toplam 1,5 sn. */
const EN_AZ = 850;
const UCUS = 500;
/** Perdeyi indiren tek bağlantı: KAM logosu (menüde ve alt bilgide). */
const LOGO_BAGLANTISI = 'a[aria-label="KAM ana sayfa"]';
const LOGO = `${LOGO_BAGLANTISI} span`;
/** Roboto'nun em birimi ve index.html'deki SVG'nin viewBox ölçüleri. */
const EM = 2048;
const SVG_GENISLIK = 4052;
const SVG_YUKSEKLIK = 1456;
/** Perdesiz açılan yollar: paneller, API ve dosyalar. index.html'deki denetimle aynı. */
const PERDESIZ = /^\/(api|yonetim|musteri)(\/|$)|^\/demolar\/[^/]+\/panel\/|\.[a-z0-9]{2,5}$/i;

type Pencere = Window & { __ykBas?: number };
const bekle = (ms: number) => new Promise((r) => setTimeout(r, ms));
/** Her yeni perde bir öncekinin kalkışını iptal eder. */
let tur = 0;

function oturum(): Storage | null {
  try {
    return window.sessionStorage;
  } catch {
    return null;
  }
}

/** Perdedeki yazıyı menüdeki logonun üstüne oturtan dönüşüm; logo görünmüyorsa null. */
function logoHedefi(svg: SVGSVGElement): string | null {
  const logo = [...document.querySelectorAll<HTMLElement>(LOGO)].find((e) => {
    const k = e.getBoundingClientRect();
    return k.width > 0 && k.bottom > 0 && k.top < window.innerHeight;
  });
  const ctx = document.createElement("canvas").getContext("2d");
  if (!logo?.firstChild || !ctx) return null;

  // Metnin kutusu yazı tipinin üst ve alt payı kadardır; taban çizgisi bu paydan bulunur.
  const aralik = document.createRange();
  aralik.selectNodeContents(logo);
  const metin = aralik.getBoundingClientRect();
  const stil = getComputedStyle(logo);
  ctx.font = `${stil.fontWeight} ${stil.fontSize} ${stil.fontFamily}`;
  const olcu = ctx.measureText("KAM");
  const pay = olcu.fontBoundingBoxAscent + olcu.fontBoundingBoxDescent;
  const taban = metin.top + (metin.height * olcu.fontBoundingBoxAscent) / pay;
  const birim = parseFloat(stil.fontSize) / EM;

  const kutu = svg.getBoundingClientRect();
  if (!kutu.width) return null;
  const olcek = (SVG_GENISLIK * birim) / kutu.width;
  return `translate(${metin.left - kutu.left}px, ${taban - SVG_YUKSEKLIK * birim - kutu.top}px) scale(${olcek})`;
}

async function perdeyiKaldir(kaydir?: () => void) {
  const benim = tur;
  const kok = document.documentElement;
  if (!kok.classList.contains("yk-ilk") && !kok.classList.contains("yk-gecis")) return;

  await Promise.race([document.fonts?.ready, bekle(1500)]);
  const bas = (window as Pencere).__ykBas ?? Date.now();
  // Aynı sayfa: perde tam inince sayfa arkada kayar, menü yazı bitene kadar yeni haline oturur.
  if (kaydir) {
    await bekle(Math.max(0, 350 - (Date.now() - bas)));
    if (benim !== tur) return;
    kaydir();
  }
  await bekle(Math.max(0, EN_AZ - (Date.now() - bas)));
  if (benim !== tur) return;

  kok.classList.add("yk-hazir");
  await bekle(100);
  if (benim !== tur) return;
  const svg = document.querySelector<SVGSVGElement>("#yukleme svg");
  const hedef = svg ? logoHedefi(svg) : null;
  if (svg && hedef) svg.style.transform = hedef;
  else kok.classList.add("yk-kalk");
  kok.classList.add("yk-bitti");

  await bekle(UCUS);
  if (benim !== tur) return;
  kok.classList.remove("yk-logo"); // menüdeki logo, üstüne inen yazının tam altında belirir
  await bekle(80);
  if (benim !== tur) return;
  kok.classList.remove(...SINIFLAR);
  kok.style.removeProperty("--gecen");
  if (svg) svg.style.transform = "";
}

function perdeyiIndir(sonra: () => void) {
  tur++;
  const kok = document.documentElement;
  kok.classList.remove(...SINIFLAR);
  kok.style.setProperty("--gecen", "0s");
  const svg = document.querySelector<SVGSVGElement>("#yukleme svg");
  if (svg) svg.style.transform = "";
  void kok.offsetWidth; // çizim baştan başlasın
  kok.classList.add("yk-gecis", "yk-giris", "yk-logo");
  (window as Pencere).__ykBas = Date.now();
  sonra();
}

function tiklandi(olay: MouseEvent) {
  if (olay.defaultPrevented || olay.button !== 0 || olay.metaKey || olay.ctrlKey || olay.shiftKey || olay.altKey) return;
  const bag = (olay.target as Element | null)?.closest?.<HTMLAnchorElement>("a[href]");
  if (!bag?.matches(LOGO_BAGLANTISI) || (bag.target && bag.target !== "_self") || bag.hasAttribute("download")) return;
  const hedef = new URL(bag.href, window.location.href);
  if (hedef.origin !== window.location.origin || PERDESIZ.test(hedef.pathname) || !oturum()) return;
  if (PERDESIZ.test(window.location.pathname)) return;
  olay.preventDefault();

  // Ana sayfadayken: perde iner, sayfa perdenin arkasında başa kayar, perde kalkar.
  if (hedef.pathname === window.location.pathname && hedef.search === window.location.search) {
    perdeyiIndir(() => {
      void perdeyiKaldir(() => {
        const bolum = hedef.hash ? document.getElementById(decodeURIComponent(hedef.hash.slice(1))) : null;
        if (bolum) bolum.scrollIntoView({ behavior: "instant", block: "start" });
        else window.scrollTo({ top: 0, behavior: "instant" });
        if (hedef.hash !== window.location.hash) history.pushState(null, "", hedef.hash || hedef.pathname);
      });
    });
    return;
  }

  perdeyiIndir(() => {
    oturum()?.setItem("kam-gecis", String(Date.now()));
    requestAnimationFrame(() => window.location.assign(hedef.href));
  });
}

/** Geri tuşuyla önbellekten dönülen sayfada perde inik kalmasın. */
function geriDonuldu(olay: PageTransitionEvent) {
  if (!olay.persisted) return;
  tur++;
  document.documentElement.classList.remove(...SINIFLAR);
}

/** App açılınca bir kez çağrılır; dinleyicileri kaldıran işlevi döndürür. */
export function sayfaGecisleri() {
  void perdeyiKaldir();
  document.addEventListener("click", tiklandi);
  window.addEventListener("pageshow", geriDonuldu);
  return () => {
    document.removeEventListener("click", tiklandi);
    window.removeEventListener("pageshow", geriDonuldu);
  };
}
