import type { ReactNode } from "react";

/*
 * Blog yazıları için küçük bir işaretleme ayrıştırıcısı.
 * Desteklenenler: ## / ### başlık, paragraf, - madde, 1. sıralı madde,
 * | tablo |, > not kutusu, **kalın** ve [bağlantı](/adres).
 * Dış kütüphane yok; hem tarayıcıda hem ön işlemede aynı çıktıyı verir.
 */

export type Blok =
  | { tur: "h2" | "h3"; metin: string; id: string }
  | { tur: "p" | "not"; metin: string }
  | { tur: "ul" | "ol"; maddeler: string[] }
  | { tur: "tablo"; basliklar: string[]; satirlar: string[][] };

const TR_HARFLER: Record<string, string> = { ç: "c", ğ: "g", ı: "i", ö: "o", ş: "s", ü: "u", â: "a", î: "i", û: "u" };

export function kisaAd(metin: string) {
  return metin
    .toLocaleLowerCase("tr")
    .replace(/[çğıöşüâîû]/g, (h) => TR_HARFLER[h] ?? h)
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function hucreler(satir: string) {
  return satir
    .trim()
    .replace(/^\||\|$/g, "")
    .split("|")
    .map((h) => h.trim());
}

export function bloklaraAyir(kaynak: string): Blok[] {
  const bloklar: Blok[] = [];
  const satirlar = kaynak.trim().split("\n");
  let paragraf: string[] = [];

  const paragrafiKapat = () => {
    if (paragraf.length) bloklar.push({ tur: "p", metin: paragraf.join(" ") });
    paragraf = [];
  };

  for (let i = 0; i < satirlar.length; i++) {
    const satir = satirlar[i].trim();

    if (!satir) {
      paragrafiKapat();
      continue;
    }

    const baslik = /^(#{2,3})\s+(.*)$/.exec(satir);
    if (baslik) {
      paragrafiKapat();
      const metin = baslik[2];
      bloklar.push({ tur: baslik[1].length === 2 ? "h2" : "h3", metin, id: kisaAd(metin) });
      continue;
    }

    if (satir.startsWith("> ")) {
      paragrafiKapat();
      const parcalar = [satir.slice(2)];
      while (satirlar[i + 1]?.trim().startsWith("> ")) parcalar.push(satirlar[++i].trim().slice(2));
      bloklar.push({ tur: "not", metin: parcalar.join(" ") });
      continue;
    }

    if (/^-\s/.test(satir) || /^\d+\.\s/.test(satir)) {
      paragrafiKapat();
      const sirali = /^\d+\.\s/.test(satir);
      const desen = sirali ? /^\d+\.\s+/ : /^-\s+/;
      const maddeler = [satir.replace(desen, "")];
      while (satirlar[i + 1] && desen.test(satirlar[i + 1].trim())) {
        maddeler.push(satirlar[++i].trim().replace(desen, ""));
      }
      bloklar.push({ tur: sirali ? "ol" : "ul", maddeler });
      continue;
    }

    if (satir.startsWith("|")) {
      paragrafiKapat();
      const basliklar = hucreler(satir);
      const govde: string[][] = [];
      while (satirlar[i + 1]?.trim().startsWith("|")) {
        const sonraki = satirlar[++i].trim();
        if (/^\|[\s:|-]+\|$/.test(sonraki)) continue;
        govde.push(hucreler(sonraki));
      }
      bloklar.push({ tur: "tablo", basliklar, satirlar: govde });
      continue;
    }

    paragraf.push(satir);
  }

  paragrafiKapat();
  return bloklar;
}

/** **kalın** ve [metin](adres) parçalarını React düğümüne çevirir. */
export function satirIci(metin: string): ReactNode[] {
  return metin.split(/(\*\*[^*]+\*\*|\[[^\]]+\]\([^)]+\))/g).map((parca, sira) => {
    if (parca.startsWith("**") && parca.endsWith("**")) {
      return <strong key={sira}>{parca.slice(2, -2)}</strong>;
    }
    const baglanti = /^\[([^\]]+)\]\(([^)]+)\)$/.exec(parca);
    if (baglanti) {
      const hedef = baglanti[2] === "/#iletisim" ? "/iletisim/" : baglanti[2];
      const dis = /^https?:/.test(hedef);
      return (
        <a key={sira} href={hedef} {...(dis ? { target: "_blank", rel: "noopener noreferrer" } : {})}>
          {baglanti[1]}
        </a>
      );
    }
    return parca;
  });
}

/** Meta açıklamaları ve JSON-LD için işaretlemesiz düz metin. */
export function duzMetin(metin: string) {
  return metin.replace(/\*\*([^*]+)\*\*/g, "$1").replace(/\[([^\]]+)\]\([^)]+\)/g, "$1");
}

export function okumaSuresi(kaynak: string) {
  const kelime = kaynak.split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.round(kelime / 200));
}

export function tarihYaz(iso: string) {
  return new Date(iso + "T12:00:00").toLocaleDateString("tr-TR", { day: "numeric", month: "long", year: "numeric" });
}
