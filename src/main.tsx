import { StrictMode } from "react";
import { createRoot, hydrateRoot } from "react-dom/client";
import App from "./App";
import { BULUNAMADI, rotaBul } from "./rotalar";
import { ANLIK, IcerikSaglayici, yayindaOlanlar } from "./veri/kaynak";
import "./index.css";

const kok = document.getElementById("kok");
if (!kok) throw new Error("#kok bulunamadı");

const yol = window.location.pathname;
const uygulama = (
  <StrictMode>
    <IcerikSaglayici>
      <App yol={yol} />
    </IcerikSaglayici>
  </StrictMode>
);

// Yayında her sayfa önceden işlenmiş HTML ile gelir. Derleme kopyasında olmayan
// bir sayfa (404 ya da derlemeden sonra panelden eklenen yazı) sıfırdan çizilir.
const anlikRota = rotaBul(yol, yayindaOlanlar(ANLIK));
if (kok.hasChildNodes() && anlikRota !== BULUNAMADI) {
  hydrateRoot(kok, uygulama);
} else {
  kok.replaceChildren();
  createRoot(kok).render(uygulama);
}
