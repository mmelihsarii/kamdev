import { useId, useState } from "react";
import { motion } from "motion/react";
import { Belirme, EGRI } from "./Hareket";
import BolumBasligi from "./BolumBasligi";
import type { SoruCevap as Soru } from "../veri/tipler";

function SoruSatiri({ soru, acik, degistir }: { soru: Soru; acik: boolean; degistir: () => void }) {
  const kimlik = useId();

  return (
    <div className="group border-b border-white/8">
      <h3>
        <button
          type="button"
          onClick={degistir}
          aria-expanded={acik}
          aria-controls={kimlik}
          className="flex w-full items-start justify-between gap-6 py-5 text-left"
        >
          <span
            className={`text-[15px] font-semibold leading-snug tracking-tight transition-colors duration-300 md:text-base ${
              acik ? "text-white" : "text-neutral-300 group-hover:text-white"
            }`}
          >
            {soru.soru}
          </span>
          <span
            aria-hidden="true"
            className={`relative mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full border transition-colors duration-300 ${
              acik ? "border-white/40 bg-white/10" : "border-white/15 group-hover:border-white/40"
            }`}
          >
            <span className="absolute h-px w-2.5 bg-white" />
            <motion.span
              className="absolute h-2.5 w-px bg-white"
              animate={{ rotate: acik ? 90 : 0, opacity: acik ? 0 : 1 }}
              transition={{ duration: 0.3, ease: EGRI }}
            />
          </span>
        </button>
      </h3>

      {/* Kapalıyken de DOM'da kalır; arama motorları cevabı her durumda okur. */}
      <motion.div
        id={kimlik}
        aria-hidden={!acik}
        initial={false}
        animate={acik ? { height: "auto", opacity: 1 } : { height: 0, opacity: 0 }}
        transition={{ duration: 0.45, ease: EGRI }}
        className="overflow-hidden"
      >
        <p className="max-w-3xl pb-6 pr-10 text-sm leading-7 text-neutral-300">{soru.cevap}</p>
      </motion.div>
    </div>
  );
}

export function SoruListesi({ sorular }: { sorular: Soru[] }) {
  const [acik, setAcik] = useState<number | null>(0);

  return (
    <div className="border-t border-white/8">
      {sorular.map((soru, sira) => (
        <Belirme key={soru.soru} gecikme={sira * 0.04} mesafe={12}>
          <SoruSatiri soru={soru} acik={acik === sira} degistir={() => setAcik(acik === sira ? null : sira)} />
        </Belirme>
      ))}
    </div>
  );
}

export default function Sss({
  sorular,
  baslik = "Sık sorulanlar",
  aciklama,
}: {
  sorular: Soru[];
  baslik?: string;
  aciklama?: string;
}) {
  return (
    <section id="sss" className="relative py-16 sm:py-20 md:py-32">
      <div className="kap grid gap-4 lg:grid-cols-[0.8fr_1.2fr] lg:gap-20">
        <div className="lg:sticky lg:top-32 lg:self-start">
          <BolumBasligi baslik={baslik} aciklama={aciklama} />
        </div>
        <SoruListesi sorular={sorular} />
      </div>
    </section>
  );
}
