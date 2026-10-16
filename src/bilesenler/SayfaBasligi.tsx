import type { ReactNode } from "react";
import { motion } from "motion/react";
import { GirisBelirme, SatirAcilis } from "./Hareket";

/**
 * İç sayfaların açılış bölümü: dönüş bağlantısı, etiket, maskeden yükselen başlık ve giriş paragrafı.
 * Sık hâlde (iş sayfası) dönüş bağlantısı ile etiket tek satırda, başlığın yanında sağ içerik durur ve boşluklar daralır;
 * böylece altındaki görsel ilk ekrana sığar.
 */
export default function SayfaBasligi({
  baslik,
  giris,
  renk = "#e2462d",
  children,
  yan,
  sik = false,
  sag,
}: {
  baslik: string;
  giris?: string;
  renk?: string;
  children?: ReactNode;
  /** Geniş ekranda başlığın sağında duran görsel; dar ekranda gizlenir. */
  yan?: ReactNode;
  sik?: boolean;
  /** Sık hâlde başlıkla aynı satırda, sağa yaslı duran içerik. */
  sag?: ReactNode;
}) {
  if (sik) {
    return (
      <section className="relative pb-6 pt-[calc(92px+env(safe-area-inset-top))] md:pb-8 md:pt-[calc(100px+env(safe-area-inset-top))]">
        <motion.div
          aria-hidden="true"
          className="pointer-events-none fixed -right-32 -top-32 -z-10 h-[34rem] w-[34rem] rounded-full blur-[150px]"
          style={{ backgroundColor: renk }}
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: [0.1, 0.16, 0.1], scale: [0.95, 1.08, 0.95] }}
          transition={{ duration: 9, repeat: Infinity, ease: "easeInOut" }}
        />
        <div className="kap">
          <div className="flex flex-wrap items-end justify-between gap-x-10 gap-y-4">
            <h1 className="baslik min-w-0 text-[clamp(2rem,4.4vw,3rem)] leading-[1.05] tracking-[-0.035em] text-white">
              <SatirAcilis gecikme={0.15} className="-mb-[0.18em] pb-[0.18em]">{baslik}</SatirAcilis>
            </h1>
            {sag && <GirisBelirme gecikme={0.3}>{sag}</GirisBelirme>}
          </div>
          {giris && (
            <GirisBelirme gecikme={0.35}>
              <p className="mt-3 max-w-3xl text-[15px] leading-7 text-neutral-300 md:text-base">{giris}</p>
            </GirisBelirme>
          )}
        </div>
      </section>
    );
  }

  return (
    <section className="relative pb-12 pt-[calc(116px+env(safe-area-inset-top))] sm:pb-16 md:pb-20 md:pt-[calc(144px+env(safe-area-inset-top))]">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 -z-10 opacity-40 [background-image:linear-gradient(rgba(255,255,255,0.035)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.035)_1px,transparent_1px)] [background-size:72px_72px] [mask-image:radial-gradient(ellipse_at_top,black_30%,transparent_75%)]"
      />
      <motion.div
        aria-hidden="true"
        className="pointer-events-none fixed -right-32 -top-32 -z-10 h-[34rem] w-[34rem] rounded-full blur-[150px]"
        style={{ backgroundColor: renk }}
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: [0.1, 0.16, 0.1], scale: [0.95, 1.08, 0.95] }}
        transition={{ duration: 9, repeat: Infinity, ease: "easeInOut" }}
      />

      <div className={`kap ${yan ? "grid items-center gap-12 lg:grid-cols-[minmax(0,1fr)_minmax(0,0.85fr)]" : ""}`}>
        <div className="min-w-0">


        <h1 className="baslik max-w-4xl text-[clamp(1.8rem,5vw,3.2rem)] leading-[1.08] tracking-[-0.035em] text-white">
          <SatirAcilis gecikme={0.15} className="-mb-[0.18em] pb-[0.18em]">{baslik}</SatirAcilis>
        </h1>

        {giris && (
          <GirisBelirme gecikme={0.35}>
            <p className="govde-dar mt-6 max-w-2xl text-base leading-8 text-neutral-200 md:mt-7 md:text-lg">
              {giris}
            </p>
          </GirisBelirme>
        )}

        {children && <GirisBelirme gecikme={0.45}>{children}</GirisBelirme>}
        </div>
        {yan && (
          <GirisBelirme gecikme={0.3} className="hidden lg:block">
            {yan}
          </GirisBelirme>
        )}
      </div>
    </section>
  );
}
