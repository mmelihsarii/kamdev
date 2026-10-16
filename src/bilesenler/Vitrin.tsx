import UcBoyutluVitrin from "./UcBoyutluVitrin";

/** Ana sayfadaki 3B arayüz vitrini. */
export default function Vitrin() {
  return (
    <section id="vitrin" className="relative py-16 sm:py-20 md:py-28">
      <div className="kap">
        <UcBoyutluVitrin />
      </div>
    </section>
  );
}
