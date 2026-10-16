import { IconArrowRight } from "@tabler/icons-react";
import { kategoriRengi, type Yazi } from "../veri/tipler";
import { yaziYolu } from "../veri/yardimci";
import { okumaSuresi } from "../lib/metin";

/** Yazının kapak fotoğrafı; üzerine gelince yavaşça yakınlaşır. */
export function Kapak({ yazi, buyuk = false, oncelikli = false }: { yazi: Yazi; buyuk?: boolean; oncelikli?: boolean }) {
  const gorsel = yazi.gorsel;

  return (
    <div className={`relative overflow-hidden bg-[#0c0c0f] ${buyuk ? "aspect-[16/10] lg:aspect-auto lg:h-full" : "aspect-[16/10]"}`}>
      {gorsel?.src ? (
        <img
          src={gorsel.src}
          alt={gorsel.alt}
          loading={oncelikli ? "eager" : "lazy"}
          decoding="async"
          className="absolute inset-0 h-full w-full object-cover transition-transform duration-[1.2s] ease-out group-hover:scale-[1.06]"
        />
      ) : (
        // Kapak seçilmemiş yazılar için kategori renginde sade bir yüzey.
        <div
          aria-hidden="true"
          className="absolute inset-0 transition-transform duration-[1.2s] ease-out group-hover:scale-[1.06]"
          style={{ background: `radial-gradient(120% 90% at 0% 100%, ${kategoriRengi(yazi.kategori)}55, transparent 60%), #0c0c0f` }}
        />
      )}
      <div aria-hidden="true" className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
    </div>
  );
}

export default function BlogKarti({ yazi, buyuk = false }: { yazi: Yazi; buyuk?: boolean }) {
  return (
    <a
      href={yaziYolu(yazi.slug)}
      className={`kutu kutu-hareketli group flex h-full flex-col ${buyuk ? "lg:grid lg:grid-cols-[1.15fr_1fr]" : ""}`}
    >
      <Kapak yazi={yazi} buyuk={buyuk} />
      <div className={`flex flex-1 flex-col p-6 sm:p-7 ${buyuk ? "lg:justify-center lg:p-12" : ""}`}>
        <p className="text-[13px] font-medium text-neutral-400">
          <span className="font-bold uppercase tracking-[1px]" style={{ color: kategoriRengi(yazi.kategori) }}>
            {yazi.kategori}
          </span>
          <span className="ml-4">{okumaSuresi(yazi.icerik)} dakikalık okuma</span>
        </p>
        <h3
          className={`mt-3 font-bold leading-snug tracking-tight text-white transition-colors duration-300 group-hover:text-vurgu ${
            buyuk ? "text-xl md:text-2xl md:leading-tight" : "text-lg"
          }`}
        >
          {yazi.baslik}
        </h3>
        <p className={`mt-3 text-[15px] leading-7 text-neutral-300 ${buyuk ? "" : "line-clamp-3"}`}>{yazi.aciklama}</p>
        <span className="mt-auto inline-flex items-center gap-2 pt-7 text-sm font-semibold text-white">
          Yazıyı oku
          <IconArrowRight size={16} aria-hidden="true" className="transition-transform duration-300 group-hover:translate-x-1.5" />
        </span>
      </div>
    </a>
  );
}
