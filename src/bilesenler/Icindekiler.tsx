import { useEffect, useState } from "react";

/** Yazının h2 başlıklarından içindekiler listesi; okunan bölüm vurgulanır. */
export default function Icindekiler({ basliklar }: { basliklar: { id: string; metin: string }[] }) {
  const [aktif, setAktif] = useState(basliklar[0]?.id);

  useEffect(() => {
    const ogeler = basliklar
      .map((b) => document.getElementById(b.id))
      .filter((o): o is HTMLElement => o !== null);

    const gozlemci = new IntersectionObserver(
      (kayitlar) => {
        const gorunen = kayitlar.filter((k) => k.isIntersecting).sort((x, y) => x.boundingClientRect.top - y.boundingClientRect.top);
        if (gorunen[0]) setAktif(gorunen[0].target.id);
      },
      { rootMargin: "-90px 0px -65% 0px" },
    );
    ogeler.forEach((o) => gozlemci.observe(o));
    return () => gozlemci.disconnect();
  }, [basliklar]);

  return (
    <nav aria-label="İçindekiler">
      <p className="mb-5 font-mono text-xs uppercase tracking-[1.6px] text-neutral-400">İçindekiler</p>
      <ol className="space-y-1 border-l border-white/8">
        {basliklar.map((b) => {
          const secili = b.id === aktif;
          return (
            <li key={b.id}>
              <a
                href={`#${b.id}`}
                className={`-ml-px block border-l py-1.5 pl-4 text-sm leading-5 transition-colors duration-300 ${
                  secili ? "border-vurgu text-white" : "border-transparent text-neutral-400 hover:text-neutral-200"
                }`}
              >
                {b.metin}
              </a>
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
