import { GirisBelirme, SatirAcilis } from "../bilesenler/Hareket";

export default function Bulunamadi() {
  return (
    <section className="relative flex min-h-[100svh] items-center overflow-hidden pt-24">
      <span
        aria-hidden="true"
        className="baslik pointer-events-none absolute -bottom-10 right-0 select-none text-[clamp(10rem,40vw,34rem)] leading-none tracking-[-0.08em] text-white/[0.03]"
      >
        404
      </span>
      <div className="kap relative w-full">
        <p className="mb-6 font-mono text-xs uppercase tracking-[1.6px] text-vurgu">404</p>
        <h1 className="baslik max-w-3xl text-[clamp(1.9rem,5.5vw,3.4rem)] leading-[1.08] tracking-[-0.035em]">
          <SatirAcilis className="-mb-[0.18em] pb-[0.18em]">Aradığınız sayfa burada değil.</SatirAcilis>
        </h1>
        <GirisBelirme gecikme={0.3} className="mt-10 flex flex-wrap gap-4">
          <a
            href="/"
            className="inline-flex min-h-12 items-center rounded-[2px] bg-[#f4f4f5] px-7 font-mono text-[13px] uppercase tracking-[1.2px] text-zemin transition-colors duration-300 hover:bg-white/15 hover:text-white"
          >
            Ana sayfa
          </a>
          <a
            href="/blog/"
            className="inline-flex min-h-12 items-center rounded-[2px] border border-white/15 px-7 font-mono text-[13px] uppercase tracking-[1.2px] text-neutral-300 transition-colors duration-300 hover:border-white/40 hover:text-white"
          >
            Blog
          </a>
        </GirisBelirme>
      </div>
    </section>
  );
}
