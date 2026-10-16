import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { IconBrandWhatsapp, IconX } from "@tabler/icons-react";
import { EGRI } from "./Hareket";
import { useIcerik } from "../veri/kaynak";
import { sayfaMesaji, whatsappAdresi, whatsappNumarasi } from "../lib/whatsapp";

/**
 * Sağ altta duran WhatsApp düğmesi. Masaüstünde üstüne gelince küçük bir kart
 * açılır; kart hap biçiminde değil, sitenin diğer kartlarıyla aynı köşede.
 * Sayfa açılır açılmaz değil, ziyaretçi bir an baktıktan sonra belirir.
 */
export default function WhatsAppDugmesi({ yol }: { yol: string }) {
  const icerik = useIcerik();
  const numara = whatsappNumarasi(icerik.ayarlar.site.whatsapp);
  const [gorunur, setGorunur] = useState(false);
  const [kart, setKart] = useState(false);

  useEffect(() => {
    const t = window.setTimeout(() => setGorunur(true), 1400);
    return () => window.clearTimeout(t);
  }, []);

  if (!numara) return null;
  const adres = whatsappAdresi(numara, sayfaMesaji(yol, icerik));

  return (
    <AnimatePresence>
      {gorunur && (
        <motion.div
          initial={{ opacity: 0, y: 24, scale: 0.9 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.6, ease: EGRI }}
          className="fixed bottom-[calc(1.25rem+env(safe-area-inset-bottom))] right-5 z-40 flex items-end gap-3 sm:right-6"
          onMouseEnter={() => setKart(true)}
          onMouseLeave={() => setKart(false)}
        >
          <AnimatePresence>
            {kart && (
              <motion.div
                initial={{ opacity: 0, x: 12 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 8 }}
                transition={{ duration: 0.25, ease: EGRI }}
                className="mb-1 hidden w-64 rounded-2xl border border-white/10 bg-[#0e0e11]/95 p-4 shadow-[0_24px_70px_rgba(0,0,0,0.6)] backdrop-blur md:block"
              >
                <div className="flex items-start justify-between gap-3">
                  <p className="text-[15px] font-semibold text-white">WhatsApp ile yazın</p>
                  <button type="button" onClick={() => setKart(false)} aria-label="Kartı kapat" className="-mr-1 -mt-1 flex h-7 w-7 items-center justify-center rounded-lg text-neutral-500 hover:text-white">
                    <IconX size={15} />
                  </button>
                </div>
                <p className="mt-1.5 text-[13.5px] leading-5 text-neutral-400">
                  Projenizi kısaca anlatın.
                </p>
                <a
                  href={adres}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-3 inline-flex min-h-10 w-full items-center justify-center gap-2 rounded-xl bg-[#25d366] px-4 text-[14px] font-semibold text-[#06290f] transition-[filter] hover:brightness-110"
                >
                  <IconBrandWhatsapp size={18} aria-hidden="true" />
                  Sohbeti başlat
                </a>
              </motion.div>
            )}
          </AnimatePresence>
          <a
            href={adres}
            target="_blank"
            rel="noopener noreferrer"
            aria-label="WhatsApp ile yazın"
            className="group flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-[#25d366] text-white shadow-[0_12px_32px_rgba(37,211,102,0.32),0_2px_8px_rgba(0,0,0,0.4)] transition-transform duration-300 hover:scale-105 active:scale-95"
          >
            <IconBrandWhatsapp size={30} stroke={1.8} aria-hidden="true" className="transition-transform duration-300 group-hover:rotate-[-8deg]" />
          </a>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
