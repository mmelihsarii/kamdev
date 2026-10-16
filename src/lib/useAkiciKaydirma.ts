import { useEffect } from "react";
import Lenis from "lenis";

/**
 * Lenis akıcı kaydırmayı kurar.
 * Hareket azaltma tercihi açıksa hiç devreye girmez; o kullanıcılar
 * tarayıcının normal kaydırmasını görür.
 */
export function useAkiciKaydirma(acik = true) {
  useEffect(() => {
    if (!acik || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const lenis = new Lenis({
      duration: 1.1,
      easing: (t: number) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      touchMultiplier: 1.6,
    });

    let kare = 0;
    const dongu = (zaman: number) => {
      lenis.raf(zaman);
      kare = requestAnimationFrame(dongu);
    };
    kare = requestAnimationFrame(dongu);

    return () => {
      cancelAnimationFrame(kare);
      lenis.destroy();
    };
  }, [acik]);
}
