import type { Proje, Teknoloji } from "./tipler";

export function yaziYolu(slug: string) {
  return `/blog/${slug}/`;
}

export function hizmetYolu(slug: string) {
  return `/hizmetler/${slug}/`;
}

/** Referans işin ayrıntı sayfası. Eski kayıtlarda adres yoksa kimlik kullanılır. */
export function isYolu(proje: Pick<Proje, "slug" | "kimlik">) {
  return `/isler/${proje.slug || proje.kimlik}/`;
}

/** Koyu zeminde logonun nasıl gösterileceği. Koyu çizilmiş logolar tonu korunarak açılır. */
export function logoSinifi(teknoloji: Pick<Teknoloji, "acikTon"> | undefined) {
  return teknoloji?.acikTon ? "logo-acik" : "logo-renkli";
}
