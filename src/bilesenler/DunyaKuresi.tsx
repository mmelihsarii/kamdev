import { useEffect, useMemo, useRef, useState } from "react";
import { geoGraticule10, geoOrthographic, geoPath } from "d3-geo";
import { useReducedMotion } from "motion/react";
import { feature } from "topojson-client";
import type { GeometryCollection, Topology } from "topojson-specification";
import dunya from "world-atlas/countries-110m.json";

const topo = dunya as unknown as Topology<{ countries: GeometryCollection }>;
const ulkeler = feature(topo, topo.objects.countries);
const izgara = geoGraticule10();

/** Ülke sınırlarını yerel dünya verisinden çizen, görünürken yavaşça dönen küre. */
export default function DunyaKuresi() {
  const alan = useRef<HTMLDivElement>(null);
  const azHareket = useReducedMotion();
  const [gorunur, setGorunur] = useState(false);
  const [donus, setDonus] = useState(-25);

  useEffect(() => {
    if (!alan.current) return;
    const gozlemci = new IntersectionObserver(
      ([girdi]) => setGorunur(girdi.isIntersecting),
      { threshold: 0.1 },
    );
    gozlemci.observe(alan.current);
    return () => gozlemci.disconnect();
  }, []);

  useEffect(() => {
    if (!gorunur || azHareket) return;
    let kare = 0;
    let sonKare = 0;
    const dondur = (zaman: number) => {
      if (zaman - sonKare >= 60) {
        setDonus((onceki) => (onceki + 0.35) % 360);
        sonKare = zaman;
      }
      kare = requestAnimationFrame(dondur);
    };
    kare = requestAnimationFrame(dondur);
    return () => cancelAnimationFrame(kare);
  }, [gorunur, azHareket]);

  const yollar = useMemo(() => {
    const izdüsüm = geoOrthographic()
      .scale(205)
      .translate([280, 280])
      .rotate([donus, -15])
      .clipAngle(90)
      .precision(0.3);
    const yol = geoPath(izdüsüm);
    return {
      kure: yol({ type: "Sphere" }) ?? "",
      paraleller: yol(izgara) ?? "",
      ulkeler: yol(ulkeler) ?? "",
    };
  }, [donus]);

  return (
    <div ref={alan} className="pointer-events-none relative mt-5 h-52 overflow-hidden sm:h-60" aria-hidden="true">
      <svg viewBox="0 0 560 560" className="absolute left-1/2 top-0 h-[440px] w-[440px] max-w-none -translate-x-1/2">
        <defs>
          <radialGradient id="iletisim-kure-isik">
            <stop offset="0%" stopColor="#e2462d" stopOpacity="0.1" />
            <stop offset="100%" stopColor="#e2462d" stopOpacity="0" />
          </radialGradient>
        </defs>
        <path d={yollar.kure} fill="url(#iletisim-kure-isik)" />
        <path d={yollar.paraleller} fill="none" stroke="#a1a1aa" strokeOpacity="0.14" strokeWidth="0.7" />
        <path d={yollar.ulkeler} fill="rgba(255,255,255,0.025)" stroke="#a1a1aa" strokeOpacity="0.68" strokeWidth="0.7" strokeLinejoin="round" />
        <path d={yollar.kure} fill="none" stroke="#a1a1aa" strokeOpacity="0.55" strokeWidth="1.2" />
      </svg>
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-zemin" />
    </div>
  );
}
