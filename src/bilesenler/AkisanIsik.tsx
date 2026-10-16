import { useEffect, useRef, useState } from "react";

/*
 * Hero'nun arkasındaki soyut ışık. Belli bir şekli yok: iç içe bükülmüş
 * gürültü alanı (domain warping) yavaşça akar, renkler sitenin kırmızısı ile
 * lacivertinin arasında gezinir. Kenarları gürültüyle bozulmuş yumuşak bir
 * düşüşle zemine erir, kutu sınırı görünmez.
 *
 * Tuval düşük çözünürlükte çizilip büyütülür; görüntü zaten yumuşak olduğu
 * için fark edilmez, işlemci yükü düşer. Ekranda değilken ve sekme gizliyken
 * durur. Hareket azaltma tercihinde tek kare çizip bırakır.
 */

const KOSE = `
attribute vec2 a_konum;
void main() { gl_Position = vec4(a_konum, 0.0, 1.0); }
`;

const PARCA = `
precision highp float;
uniform vec2 u_res;
uniform float u_zaman;
uniform vec2 u_merkez;
uniform float u_yaricap;
uniform float u_kazanc;
uniform vec2 u_sonum;
uniform float u_siklik;
uniform float u_kontrast;

float rastgele(vec2 p) {
  p = fract(p * vec2(123.34, 456.21));
  p += dot(p, p + 45.32);
  return fract(p.x * p.y);
}

float gurultu(vec2 p) {
  vec2 h = floor(p);
  vec2 f = fract(p);
  vec2 y = f * f * (3.0 - 2.0 * f);
  return mix(mix(rastgele(h), rastgele(h + vec2(1.0, 0.0)), y.x),
             mix(rastgele(h + vec2(0.0, 1.0)), rastgele(h + vec2(1.0, 1.0)), y.x), y.y);
}

float fbm(vec2 p) {
  float toplam = 0.0;
  float genlik = 0.5;
  mat2 don = mat2(1.6, 1.2, -1.2, 1.6);
  for (int i = 0; i < 4; i++) {
    toplam += genlik * gurultu(p);
    p = don * p;
    genlik *= 0.5;
  }
  return toplam;
}

void main() {
  vec2 uv = gl_FragCoord.xy / u_res;
  vec2 p = (uv - u_merkez) * vec2(u_res.x / u_res.y, 1.0);
  float t = u_zaman * 0.025;

  vec2 s = p * u_siklik;
  vec2 q = vec2(fbm(s + vec2(0.0, t)), fbm(s + vec2(5.2, 1.3) - t));
  vec2 r = vec2(fbm(s + 2.8 * q + vec2(1.7, 9.2) + 0.8 * t), fbm(s + 2.8 * q + vec2(8.3, 2.8) - 0.7 * t));
  float f = fbm(s + 2.8 * r);

  vec3 lacivert = vec3(0.17, 0.29, 0.66);
  vec3 kirmizi = vec3(0.89, 0.29, 0.19);
  vec3 krem = vec3(0.96, 0.93, 0.89);
  vec3 renk = mix(lacivert, kirmizi, smoothstep(0.32, 0.82, r.x));
  renk = mix(renk, krem, smoothstep(0.62, 0.95, f) * 0.5);

  // Kenar gürültüyle bozulur; daire değil, akan bir bulut gibi biter.
  float uzaklik = length(p) + (f - 0.5) * 0.45;
  float alan = 1.0 - smoothstep(u_yaricap * 0.25, u_yaricap, uzaklik);
  // Altta ve üstte uzun bir geçişle söner; yatay kesik görünmez.
  alan *= smoothstep(0.0, u_sonum.x, uv.y) * smoothstep(1.0, u_sonum.y, uv.y);

  float yogunluk = pow(smoothstep(0.15, 0.82, f * 1.2 + length(q) * 0.35), u_kontrast) * alan * u_kazanc;
  gl_FragColor = vec4(renk * yogunluk, yogunluk);
}
`;

function golgelendirici(gl: WebGLRenderingContext, tur: number, kaynak: string) {
  const g = gl.createShader(tur);
  if (!g) return null;
  gl.shaderSource(g, kaynak);
  gl.compileShader(g);
  if (!gl.getShaderParameter(g, gl.COMPILE_STATUS)) {
    gl.deleteShader(g);
    return null;
  }
  return g;
}

export default function AkisanIsik({ className = "" }: { className?: string }) {
  const tuval = useRef<HTMLCanvasElement>(null);
  const [destekYok, setDestekYok] = useState(false);
  const [hazir, setHazir] = useState(false);

  useEffect(() => {
    const t = tuval.current;
    if (!t) return;
    const gl = t.getContext("webgl", { antialias: false, premultipliedAlpha: true, alpha: true });
    const kose = gl && golgelendirici(gl, gl.VERTEX_SHADER, KOSE);
    const parca = gl && golgelendirici(gl, gl.FRAGMENT_SHADER, PARCA);
    const program = gl && kose && parca ? gl.createProgram() : null;
    if (!gl || !program || !kose || !parca) {
      setDestekYok(true);
      return;
    }
    gl.attachShader(program, kose);
    gl.attachShader(program, parca);
    gl.linkProgram(program);
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
      setDestekYok(true);
      return;
    }
    gl.useProgram(program);

    const tampon = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, tampon);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
    const konum = gl.getAttribLocation(program, "a_konum");
    gl.enableVertexAttribArray(konum);
    gl.vertexAttribPointer(konum, 2, gl.FLOAT, false, 0, 0);

    const u = (ad: string) => gl.getUniformLocation(program, ad);
    const uRes = u("u_res");
    const uZaman = u("u_zaman");
    const uMerkez = u("u_merkez");
    const uYaricap = u("u_yaricap");
    const uKazanc = u("u_kazanc");
    const uSonum = u("u_sonum");
    const uSiklik = u("u_siklik");
    const uKontrast = u("u_kontrast");

    const yatay = window.matchMedia("(min-aspect-ratio: 1/1)");
    const boyutla = () => {
      // Geniş ekranda yarım çözünürlük yeter; telefonda tuval küçük olduğu için daha sık çizilir, yoksa bulanıklaşır.
      const olcek = yatay.matches ? Math.min(window.devicePixelRatio || 1, 1) * 0.5 : 0.85;
      t.width = Math.max(1, Math.round(t.clientWidth * olcek));
      t.height = Math.max(1, Math.round(t.clientHeight * olcek));
      gl.viewport(0, 0, t.width, t.height);
      gl.uniform2f(uRes, t.width, t.height);
      // Yatay ekranda ışık sağda, yazının yanında. Dikey ekranda yazının altında,
      // düğmelerin arkasında akar; başlığa yalnızca ucu değer.
      if (yatay.matches) {
        gl.uniform2f(uMerkez, 0.74, 0.5);
        gl.uniform1f(uYaricap, 0.68);
        gl.uniform1f(uKazanc, 0.9);
        gl.uniform2f(uSonum, 0.42, 0.8);
        gl.uniform1f(uSiklik, 1.45);
        gl.uniform1f(uKontrast, 1);
      } else {
        gl.uniform2f(uMerkez, 0.56, 0.3);
        gl.uniform1f(uYaricap, 0.5);
        gl.uniform1f(uKazanc, 1.3);
        gl.uniform2f(uSonum, 0.1, 0.7);
        gl.uniform1f(uSiklik, 1.75);
        gl.uniform1f(uKontrast, 1.5);
      }
    };
    boyutla();
    const gozlemBoyut = new ResizeObserver(boyutla);
    gozlemBoyut.observe(t);

    const hareketsiz = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const baslangic = performance.now();
    let kare = 0;
    let gorunur = true;

    const ciz = (an: number) => {
      gl.uniform1f(uZaman, hareketsiz ? 24 : 24 + (an - baslangic) / 1000);
      gl.drawArrays(gl.TRIANGLES, 0, 3);
    };
    const dongu = (an: number) => {
      ciz(an);
      kare = requestAnimationFrame(dongu);
    };
    const baslat = () => {
      if (hareketsiz || kare || !gorunur || document.hidden) return;
      kare = requestAnimationFrame(dongu);
    };
    const durdur = () => {
      cancelAnimationFrame(kare);
      kare = 0;
    };

    ciz(performance.now());
    setHazir(true);
    baslat();

    const gozlemEkran = new IntersectionObserver(([g]) => {
      gorunur = g.isIntersecting;
      if (gorunur) baslat();
      else durdur();
    });
    gozlemEkran.observe(t);
    const sekme = () => (document.hidden ? durdur() : baslat());
    document.addEventListener("visibilitychange", sekme);

    return () => {
      durdur();
      gozlemBoyut.disconnect();
      gozlemEkran.disconnect();
      document.removeEventListener("visibilitychange", sekme);
      // Bağlam kapatılmaz: geliştirmede efekt iki kez çalışır, aynı tuval aynı bağlamı geri verir.
      gl.deleteBuffer(tampon);
      gl.deleteProgram(program);
      gl.deleteShader(kose);
      gl.deleteShader(parca);
    };
  }, []);

  if (destekYok) {
    return (
      <div
        aria-hidden="true"
        className={`pointer-events-none ${className}`}
        style={{ background: "radial-gradient(40rem 30rem at 74% 50%, rgb(226 70 45 / 0.18), transparent 70%), radial-gradient(34rem 28rem at 82% 40%, rgb(42 72 160 / 0.25), transparent 70%)" }}
      />
    );
  }

  return (
    <canvas
      ref={tuval}
      aria-hidden="true"
      className={`pointer-events-none transition-opacity duration-[1600ms] ${hazir ? "opacity-100" : "opacity-0"} ${className}`}
    />
  );
}
