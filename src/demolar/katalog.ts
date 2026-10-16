/*
 * Sektör demolarının listesi. Tanıtım bilgisi ön işlemeye girer; canlı panel
 * kodu yalnız panel açılınca ayrı parça olarak yüklenir.
 */
import type { SektorBilgi, SektorPanel } from "./tipler";
import { eticaret } from "./sektorler/eticaret/bilgi";
import { bayi } from "./sektorler/bayi/bilgi";
import { spor } from "./sektorler/spor/bilgi";
import { emlak } from "./sektorler/emlak/bilgi";
import { klinik } from "./sektorler/klinik/bilgi";
import { restoran } from "./sektorler/restoran/bilgi";
import { servis } from "./sektorler/servis/bilgi";
import { kurs } from "./sektorler/kurs/bilgi";
import { otel } from "./sektorler/otel/bilgi";

export const SEKTORLER: SektorBilgi[] = [eticaret, bayi, spor, emlak, klinik, restoran, servis, kurs, otel];

export const PANELLER: Record<string, () => Promise<{ default: SektorPanel }>> = {
  "e-ticaret": () => import("./sektorler/eticaret/panel"),
  "bayi-ve-toptan": () => import("./sektorler/bayi/panel"),
  "spor-salonu": () => import("./sektorler/spor/panel"),
  "emlak-ofisi": () => import("./sektorler/emlak/panel"),
  klinik: () => import("./sektorler/klinik/panel"),
  restoran: () => import("./sektorler/restoran/panel"),
  "teknik-servis": () => import("./sektorler/servis/panel"),
  "kurs-merkezi": () => import("./sektorler/kurs/panel"),
  "butik-otel": () => import("./sektorler/otel/panel"),
};

export const demoYolu = (slug: string) => `/demolar/${slug}/`;
export const panelYolu = (slug: string) => `/demolar/${slug}/panel/`;

/** Bütün demolardaki ekran sayısı; tanıtım sayfalarındaki rakam elle yazılmaz, buradan gelir. */
export const toplamEkran = () => SEKTORLER.reduce((t, s) => t + s.moduller.length, 0);
