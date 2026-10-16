import { useEffect, useRef } from "react";

/*
 * Hero'nun arkasındaki canlı zemin.
 *
 * Sahnede tek bir tam ekran üçgen var; görüntünün tamamını fragment shader
 * çiziyor. Üç iç içe halka, açısal harmoniklerle kıvrılıyor: yarıçapı
 * sin(2a), sin(3a), sin(5a) toplamı bozuyor, böylece kapalı ama düzensiz
 * bir hat çıkıyor. Hatta olan uzaklık iki Gauss'tan geçiyor — biri ince
 * çekirdek, biri geniş hale — ve parlama böyle oluşuyor.
 *
 * Yalnız sinüs harmonikleri kullanıldığı için açının 0/2π dikişinde kopma
 * olmuyor; hat her yerde sürekli.
 */

const KOSE_GOLGELEYICI = `
attribute vec2 a_konum;
void main() {
  gl_Position = vec4(a_konum, 0.0, 1.0);
}
`;

const PARCA_GOLGELEYICI = `
precision highp float;

uniform vec2  u_res;        // tuval çözünürlüğü (piksel)
uniform float u_zaman;      // saniye
uniform vec2  u_fare;       // -0.5..0.5, yumuşatılmış
uniform vec2  u_merkez;     // halkaların merkezi (uv birimi)
uniform float u_yaricap;
uniform float u_kazanc;     // genel parlaklık
uniform float u_gorunumY;   // görünür alan yüksekliği (piksel)
uniform float u_dogus;      // 0 -> 1 açılış ilerlemesi

float rastgele(vec2 p) {
  return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453123);
}

float gurultu(vec2 p) {
  vec2 h = floor(p);
  vec2 f = fract(p);
  vec2 y = f * f * (3.0 - 2.0 * f);
  float a = rastgele(h);
  float b = rastgele(h + vec2(1.0, 0.0));
  float c = rastgele(h + vec2(0.0, 1.0));
  float d = rastgele(h + vec2(1.0, 1.0));
  return mix(mix(a, b, y.x), mix(c, d, y.x), y.y);
}

float fbm(vec2 p) {
  float toplam = 0.0;
  float genlik = 0.5;
  for (int i = 0; i < 4; i++) {
    toplam += genlik * gurultu(p);
    p *= 2.02;
    genlik *= 0.5;
  }
  return toplam;
}

void main() {
  // Koordinat merkezi tuvalin değil GÖRÜNÜR ALANIN ortası. Tuval hero'dan
  // uzun olduğu için, sayfa kaydıkça görüntü aşağıya doğru kesintisiz sürüyor.
  vec2 kok = vec2(0.5 * u_res.x, u_res.y - 0.5 * u_gorunumY);
  vec2 uv = (gl_FragCoord.xy - kok) / min(u_res.x, u_gorunumY);
  uv -= u_fare * 0.045;

  float t = u_zaman;
  vec2 p = uv - u_merkez;

  // Hafif dokusal bükülme. Açılış sırasında kapalı, hat pürüzsüz doğsun diye.
  vec2 burgu = vec2(fbm(p * 2.2 + t * 0.025), fbm(p * 2.2 - t * 0.025 + 5.1));
  p += 0.045 * (burgu - 0.5) * u_dogus;

  float aci = atan(p.y, p.x);
  float uzaklik = length(p);

  vec3 renk = vec3(0.0);

  for (int i = 0; i < 3; i++) {
    float fi = float(i);
    float faz = fi * 2.1;

    // Kıvrım: üç harmoniğin toplamı. Fazlar zamanla kaydığı için
    // hat sabit durmuyor, yavaşça şekil değiştiriyor.
    float salinim =
        0.150 * sin(2.0 * aci + t * 0.120 + faz)
      + 0.105 * sin(3.0 * aci - t * 0.085 + faz * 1.7)
      + 0.062 * sin(5.0 * aci + t * 0.055 + faz * 0.6);

    // Doğum: minik pürüzsüz bir halka; büyürken kıvrımlar da açılıyor.
    float R = u_yaricap * (0.72 + 0.17 * fi)
            * mix(0.05, 1.0, u_dogus)
            * (1.0 + salinim * u_dogus);

    float nefes = 1.0 + 0.030 * sin(t * 0.33 + fi * 1.1);
    float d = abs(uzaklik - R * nefes);

    // Hat boyunca kalınlık değişimi; dikişsiz kalması için yine açısal sinüs.
    float kalinlik = (1.0 + 0.45 * sin(3.0 * aci - t * 0.08 + faz) * u_dogus)
                   * mix(0.50, 1.0, u_dogus);
    float s1 = (0.028 + 0.006 * fi) * kalinlik;
    float s2 = (0.075 + 0.020 * fi) * kalinlik;

    float cekirdek = exp(-(d * d) / (2.0 * s1 * s1));
    float hale     = exp(-(d * d) / (2.0 * s2 * s2)) * 0.20;
    float dalga    = 0.80 + 0.20 * sin(2.0 * aci + t * 0.05 + faz);

    // Doğum anında daha parlak — kıvılcım hissi — sonra normale iniyor.
    float isik = (cekirdek + hale) * dalga
               * mix(u_kazanc * 2.0, u_kazanc, u_dogus)
               * (1.0 - 0.22 * fi);

    // İçten dışa kızıldan sıcak fümeye. En parlak yer beyaza taşmıyor,
    // közlenmiş turuncuda duruyor — ekranda yanık gibi görünmesin diye.
    vec3 ton = mix(vec3(0.74, 0.21, 0.09), vec3(0.40, 0.25, 0.23), fi * 0.5);
    renk += isik * mix(ton * 0.42, mix(ton, vec3(0.98, 0.71, 0.54), 0.55),
                       clamp(isik, 0.0, 1.0));
  }

  // Çok hafif dip ambiyans, düz siyahı kırıyor. Kızıla doğru eğik.
  renk += vec3(0.020, 0.010, 0.007) * (1.0 - uzaklik * 0.65);

  // Tuvalin alt kenarına yaklaşırken karanlığa eriyor; kesik görünmüyor.
  renk *= smoothstep(0.0, 0.20, gl_FragCoord.y / u_res.y);

  gl_FragColor = vec4(renk, 1.0);
}
`;

export default function ShaderZemin() {
  const tuvalRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const tuval = tuvalRef.current;
    if (!tuval) return;

    const azalt = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    const gl = tuval.getContext("webgl", { antialias: true, alpha: false });
    if (!gl) return;

    const derle = (tur: number, kaynak: string) => {
      const g = gl.createShader(tur);
      if (!g) return null;
      gl.shaderSource(g, kaynak);
      gl.compileShader(g);
      if (!gl.getShaderParameter(g, gl.COMPILE_STATUS)) {
        gl.deleteShader(g);
        return null;
      }
      return g;
    };

    const kose = derle(gl.VERTEX_SHADER, KOSE_GOLGELEYICI);
    const parca = derle(gl.FRAGMENT_SHADER, PARCA_GOLGELEYICI);
    if (!kose || !parca) return;

    const program = gl.createProgram();
    if (!program) return;
    gl.attachShader(program, kose);
    gl.attachShader(program, parca);
    gl.linkProgram(program);
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) return;
    gl.useProgram(program);

    // Ekranı tek üçgenle kaplıyoruz; iki üçgenden ucuz ve dikişsiz.
    const tampon = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, tampon);
    gl.bufferData(
      gl.ARRAY_BUFFER,
      new Float32Array([-1, -1, 3, -1, -1, 3]),
      gl.STATIC_DRAW,
    );
    const konum = gl.getAttribLocation(program, "a_konum");
    gl.enableVertexAttribArray(konum);
    gl.vertexAttribPointer(konum, 2, gl.FLOAT, false, 0, 0);

    const u = {
      res: gl.getUniformLocation(program, "u_res"),
      zaman: gl.getUniformLocation(program, "u_zaman"),
      fare: gl.getUniformLocation(program, "u_fare"),
      merkez: gl.getUniformLocation(program, "u_merkez"),
      yaricap: gl.getUniformLocation(program, "u_yaricap"),
      kazanc: gl.getUniformLocation(program, "u_kazanc"),
      gorunumY: gl.getUniformLocation(program, "u_gorunumY"),
      dogus: gl.getUniformLocation(program, "u_dogus"),
    };

    let genislik = 0;
    let yukseklik = 0;

    const olcule = () => {
      const dar = window.innerWidth < 768;
      // Parlama yumuşak olduğu için yarı çözünürlük göze çarpmıyor,
      // buna karşılık doldurma maliyeti dörtte bire iniyor.
      const olcek = 0.5 * Math.min(window.devicePixelRatio || 1, dar ? 1 : 1.5);
      const g = Math.max(1, Math.round(tuval.clientWidth * olcek));
      const y = Math.max(1, Math.round(tuval.clientHeight * olcek));
      if (g === genislik && y === yukseklik) return;

      genislik = g;
      yukseklik = y;
      tuval.width = g;
      tuval.height = y;
      gl.viewport(0, 0, g, y);
      gl.clearColor(0.02, 0.02, 0.024, 1);
      gl.clear(gl.COLOR_BUFFER_BIT);

      // Başlık solda durduğu için halkalar sağ boşluğa oturuyor; mobilde ortaya.
      gl.uniform2f(u.merkez, dar ? 0 : 0.44, dar ? 0.1 : 0.06);
      gl.uniform1f(u.yaricap, dar ? 0.82 : 0.42);
      gl.uniform1f(u.kazanc, dar ? 0.45 : 0.78);
      gl.uniform1f(u.gorunumY, window.innerHeight * olcek);
    };

    olcule();
    window.addEventListener("resize", olcule);

    let hedefX = 0;
    let hedefY = 0;
    let fareX = 0;
    let fareY = 0;
    const fareGezdi = (e: MouseEvent) => {
      hedefX = e.clientX / window.innerWidth - 0.5;
      hedefY = -(e.clientY / window.innerHeight - 0.5);
    };
    if (!azalt) window.addEventListener("mousemove", fareGezdi);

    let kare = 0;
    let calisiyor = false;
    let gorunur = true;
    let sonCizim = 0;
    const baslangic = performance.now();

    const ciz = (simdi: number) => {
      kare = requestAnimationFrame(ciz);
      // ~32 fps yetiyor; her ekran tazelemesinde çizmek boşa pil yakıyor.
      if (simdi - sonCizim < 31) return;
      sonCizim = simdi;

      fareX += (hedefX - fareX) * 0.05;
      fareY += (hedefY - fareY) * 0.05;

      const gecen = simdi - baslangic;
      const dogus = 1 - Math.pow(1 - Math.min(1, gecen / 1800), 3);

      gl.uniform1f(u.dogus, dogus);
      gl.uniform2f(u.res, tuval.width, tuval.height);
      gl.uniform1f(u.zaman, gecen / 1000);
      gl.uniform2f(u.fare, fareX, fareY);
      gl.drawArrays(gl.TRIANGLES, 0, 3);
    };

    const calistir = (acik: boolean) => {
      if (acik === calisiyor) return;
      calisiyor = acik;
      cancelAnimationFrame(kare);
      if (acik) kare = requestAnimationFrame(ciz);
    };

    // Hareket azaltma açıksa tek kare çizip duruyoruz: görüntü var, hareket yok.
    gl.uniform1f(u.dogus, azalt ? 1 : 0);
    gl.uniform2f(u.res, tuval.width, tuval.height);
    gl.uniform1f(u.zaman, azalt ? 12 : 0);
    gl.uniform2f(u.fare, 0, 0);
    gl.drawArrays(gl.TRIANGLES, 0, 3);

    if (!azalt) calistir(true);

    const durumTazele = () => calistir(!document.hidden && gorunur && !azalt);
    document.addEventListener("visibilitychange", durumTazele);

    // Hero ekrandan çıkınca çizimi tamamen durdurur.
    const gozcu = new IntersectionObserver(([giris]) => {
      gorunur = giris.isIntersecting;
      durumTazele();
    });
    gozcu.observe(tuval);

    const baglamKayboldu = (e: Event) => {
      e.preventDefault();
      calistir(false);
    };
    tuval.addEventListener("webglcontextlost", baglamKayboldu);

    return () => {
      cancelAnimationFrame(kare);
      gozcu.disconnect();
      document.removeEventListener("visibilitychange", durumTazele);
      window.removeEventListener("resize", olcule);
      window.removeEventListener("mousemove", fareGezdi);
      tuval.removeEventListener("webglcontextlost", baglamKayboldu);
    };
  }, []);

  return (
    <canvas
      ref={tuvalRef}
      aria-hidden="true"
      className="absolute left-0 top-0 h-[150svh] w-full"
      style={{ backgroundColor: "#050506" }}
    />
  );
}
