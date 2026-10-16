import { Belirme } from "./Hareket";

export default function BolumBasligi({
  baslik,
  aciklama,
}: {
  baslik: string;
  aciklama?: string;
}) {
  return (
    <Belirme>
      <div className="mb-10 max-w-2xl sm:mb-12 md:mb-16">
        <h2 className="baslik text-[clamp(1.75rem,4.8vw,2.7rem)] leading-[1.1] tracking-[-0.03em]">
          {baslik}
        </h2>
        {aciklama && (
          <p className="govde-dar mt-4 max-w-xl text-base leading-7 text-neutral-300 sm:mt-5">
            {aciklama}
          </p>
        )}
      </div>
    </Belirme>
  );
}
