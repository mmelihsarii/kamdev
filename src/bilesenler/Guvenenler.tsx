import type { SyntheticEvent } from "react";
import { useIcerik } from "../veri/kaynak";

/**
 * Logolar aynı yükseklikte dursa geniş yazı logolar iri, kare amblemler küçük kalır.
 * Her logo aynı alanı kaplayacak boya getirilir; geniş olan alçalır, kare olan büyür.
 */
function dengele(e: SyntheticEvent<HTMLImageElement>) {
  const im = e.currentTarget;
  if (!im.naturalWidth || !im.naturalHeight) return;
  const oran = im.naturalWidth / im.naturalHeight;
  const alan = window.innerWidth < 768 ? 3000 : 4800;
  const boy = Math.min(window.innerWidth < 768 ? 40 : 52, Math.max(24, Math.sqrt(alan / oran)));
  im.style.height = `${Math.round(boy)}px`;
}

/** Logosu girilmiş işlerin müşteri logoları; gri, sola doğru akan tek şerit. Üstüne gelince durur. */
export default function Guvenenler() {
  const { projeler } = useIcerik();
  const logolar = projeler.filter((p) => p.logo);
  if (logolar.length < 3) return null;

  return (
    <section aria-label="Bize güvenenler" className="relative py-8 md:py-10">
      <div className="group flex overflow-hidden [mask-image:linear-gradient(90deg,transparent,black_10%,black_90%,transparent)]">
        {[0, 1].map((kopya) => (
          <ul
            key={kopya}
            aria-hidden={kopya === 1}
            className="kayan-serit flex shrink-0 items-center gap-14 pr-14 group-hover:[animation-play-state:paused] md:gap-20 md:pr-20"
            style={{ animationDuration: "60s" }}
          >
            {logolar.map((p) => (
              <li key={p.kimlik} className="flex h-16 shrink-0 items-center">
                <img
                  src={p.logo}
                  alt={kopya === 0 ? p.ad : ""}
                  loading="lazy"
                  decoding="async"
                  onLoad={dengele}
                  className="logo-gri h-10 w-auto max-w-none object-contain"
                />
              </li>
            ))}
          </ul>
        ))}
      </div>
    </section>
  );
}
