import { satirIci, type Blok } from "../lib/metin";

/** Ayrıştırılmış blog bloklarını `.yazi` tipografisiyle basar. */
export default function Icerik({ bloklar }: { bloklar: Blok[] }) {
  return (
    <div className="yazi">
      {bloklar.map((blok, sira) => {
        switch (blok.tur) {
          case "h2":
            return (
              <h2 key={sira} id={blok.id}>
                {blok.metin}
              </h2>
            );
          case "h3":
            return (
              <h3 key={sira} id={blok.id}>
                {blok.metin}
              </h3>
            );
          case "p":
            return <p key={sira}>{satirIci(blok.metin)}</p>;
          case "not":
            return (
              <aside key={sira} className="not">
                <p>{satirIci(blok.metin)}</p>
              </aside>
            );
          case "ul":
            return (
              <ul key={sira}>
                {blok.maddeler.map((m) => (
                  <li key={m}>{satirIci(m)}</li>
                ))}
              </ul>
            );
          case "ol":
            return (
              <ol key={sira}>
                {blok.maddeler.map((m) => (
                  <li key={m}>{satirIci(m)}</li>
                ))}
              </ol>
            );
          case "tablo":
            return (
              <div key={sira} className="tablo-kap">
                <table>
                  <thead>
                    <tr>
                      {blok.basliklar.map((b, i) => (
                        <th key={i} scope="col">
                          {satirIci(b)}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {blok.satirlar.map((satir, i) => (
                      <tr key={i}>
                        {satir.map((hucre, j) => (j === 0 ? <th key={j} scope="row">{satirIci(hucre)}</th> : <td key={j}>{satirIci(hucre)}</td>))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            );
        }
      })}
    </div>
  );
}
