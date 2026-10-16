import { Belirme } from "./Hareket";

/**
 * Sayfanın sorusuna 2-4 cümlelik doğrudan cevap. Hem okuyucu hem de
 * yapay zekâ aramaları için sayfanın en alıntılanabilir paragrafı.
 */
export default function KisaCevap({ metin }: { metin: string }) {
  return (
    <Belirme>
      <aside className="kutu p-6 sm:p-7">
        <p className="text-base leading-8 text-white">{metin}</p>
      </aside>
    </Belirme>
  );
}
