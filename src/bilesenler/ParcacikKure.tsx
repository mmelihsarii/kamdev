import { useEffect, useRef } from "react";

type Nokta = {
  x: number;
  y: number;
  z: number;
  faz: number;
};

function noktalarOlustur(enlemSayisi: number, boylamSayisi: number): Nokta[] {
  const noktalar: Nokta[] = [];

  for (let enlem = 0; enlem < enlemSayisi; enlem += 1) {
    const kutupAcisi = (Math.PI * (enlem + 0.5)) / enlemSayisi;
    const halka = Math.sin(kutupAcisi);
    const y = Math.cos(kutupAcisi);
    const satirOfseti = (enlem % 2) * (Math.PI / boylamSayisi);

    for (let boylam = 0; boylam < boylamSayisi; boylam += 1) {
      const cevreAcisi = (Math.PI * 2 * boylam) / boylamSayisi + satirOfseti;
      noktalar.push({
        x: Math.cos(cevreAcisi) * halka,
        y,
        z: Math.sin(cevreAcisi) * halka,
        faz: cevreAcisi + kutupAcisi * 1.7,
      });
    }
  }

  return noktalar;
}

export default function ParcacikKure() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const context = canvas.getContext("2d");
    if (!context) return;

    const hareketAzalt = window.matchMedia("(prefers-reduced-motion: reduce)");
    const noktalar = noktalarOlustur(
      window.innerWidth < 1024 ? 46 : 66,
      window.innerWidth < 1024 ? 72 : 104,
    );
    const fare = { x: 0, y: 0 };
    const yumusakFare = { x: 0, y: 0 };
    let genislik = 0;
    let yukseklik = 0;
    let pikselOrani = 1;
    let animasyon = 0;
    let gorunur = true;
    let sonKare = 0;

    const boyutlandir = () => {
      const kutu = canvas.getBoundingClientRect();
      genislik = kutu.width;
      yukseklik = kutu.height;
      pikselOrani = Math.min(window.devicePixelRatio || 1, 1.6);
      canvas.width = Math.max(1, Math.round(genislik * pikselOrani));
      canvas.height = Math.max(1, Math.round(yukseklik * pikselOrani));
      context.setTransform(pikselOrani, 0, 0, pikselOrani, 0, 0);
    };

    const fareyiGuncelle = (olay: PointerEvent) => {
      fare.x = (olay.clientX / window.innerWidth - 0.5) * 2;
      fare.y = (olay.clientY / window.innerHeight - 0.5) * 2;
    };

    const ciz = (zaman: number) => {
      context.clearRect(0, 0, genislik, yukseklik);
      yumusakFare.x += (fare.x - yumusakFare.x) * 0.035;
      yumusakFare.y += (fare.y - yumusakFare.y) * 0.035;

      const saniye = zaman * 0.001;
      const donusY = saniye * 0.105 + yumusakFare.x * 0.32;
      const donusX = -0.14 + yumusakFare.y * 0.2;
      const cosY = Math.cos(donusY);
      const sinY = Math.sin(donusY);
      const cosX = Math.cos(donusX);
      const sinX = Math.sin(donusX);
      const olcek = Math.min(genislik, yukseklik) * 0.64;
      const merkezX = genislik * 0.52;
      const merkezY = yukseklik * 0.46;

      for (const nokta of noktalar) {
        const dalga = 1 + Math.sin(nokta.faz * 1.8 + saniye * 0.42) * 0.009;
        const hamX = nokta.x * dalga;
        const hamY = nokta.y * dalga;
        const hamZ = nokta.z * dalga;
        const x1 = hamX * cosY - hamZ * sinY;
        const z1 = hamX * sinY + hamZ * cosY;
        const y2 = hamY * cosX - z1 * sinX;
        const z2 = hamY * sinX + z1 * cosX;
        const perspektif = 1 / (3.15 - z2);
        const ekranX = merkezX + x1 * olcek * perspektif;
        const ekranY = merkezY + y2 * olcek * perspektif;
        const derinlik = Math.max(0, Math.min(1, (z2 + 1.2) / 2.4));
        const alfa = 0.16 + derinlik * 0.75;
        const yaricap = 0.48 + derinlik * 0.26;

        context.beginPath();
        context.arc(ekranX, ekranY, yaricap, 0, Math.PI * 2);
        context.fillStyle = `rgba(226, 230, 235, ${alfa})`;
        context.fill();
      }
    };

    const dongu = (zaman: number) => {
      if (gorunur && zaman - sonKare > 32) {
        ciz(zaman);
        sonKare = zaman;
      }
      animasyon = window.requestAnimationFrame(dongu);
    };

    const gozlemci = new IntersectionObserver(
      ([girdi]) => {
        gorunur = girdi.isIntersecting;
      },
      { threshold: 0.02 },
    );

    boyutlandir();
    gozlemci.observe(canvas);
    window.addEventListener("resize", boyutlandir);
    window.addEventListener("pointermove", fareyiGuncelle, { passive: true });

    if (hareketAzalt.matches) {
      ciz(3200);
    } else {
      animasyon = window.requestAnimationFrame(dongu);
    }

    return () => {
      window.cancelAnimationFrame(animasyon);
      gozlemci.disconnect();
      window.removeEventListener("resize", boyutlandir);
      window.removeEventListener("pointermove", fareyiGuncelle);
    };
  }, []);

  return (
    <div
      aria-hidden="true"
      className="pointer-events-none absolute inset-y-0 right-[2%] z-[2] hidden w-[48%] overflow-hidden md:block"
      style={{
        maskImage:
          "linear-gradient(90deg, transparent 0%, rgba(0,0,0,.72) 20%, #000 45%, #000 88%, transparent 100%)",
      }}
    >
      <div
        className="absolute inset-0 opacity-[0.1]"
        style={{
          backgroundImage:
            "linear-gradient(rgba(255,255,255,.22) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.22) 1px, transparent 1px)",
          backgroundSize: "108px 108px",
        }}
      />
      <div className="absolute inset-[16%_6%] rounded-full bg-[radial-gradient(circle,rgba(255,255,255,0.035),transparent_66%)] blur-2xl" />
      <canvas ref={canvasRef} className="absolute inset-0 h-full w-full" />
    </div>
  );
}
