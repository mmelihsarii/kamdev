/*
 * Bir demonun tam ekran paneli. Ön işlenen HTML'de panelin iskeleti durur,
 * panel kodu tarayıcıda yüklenir; adres çubuğundaki # ile ekran ve kayıt paylaşılabilir.
 */
import CanliPanel from "../demolar/CanliPanel";
import type { SektorBilgi } from "../demolar/tipler";

export default function DemoPanel({ s }: { s: SektorBilgi }) {
  return <CanliPanel bilgi={s} />;
}
