<?php
/* Canlı site haritası: panelden eklenen yazılar derleme beklemeden listeye girer. */
require __DIR__ . '/_cekirdek.php';

$db = db();
$icerik = icerik_topla($db, false);
$adres = rtrim((string)($icerik['ayarlar']['site']['adres'] ?? ''), '/');
$bugun = gmdate('Y-m-d');
$en_yeni = $bugun;

$satirlar = [];
$ekle = function (string $yol, string $tarih, float $oncelik) use (&$satirlar, $adres) {
    $satirlar[] = "  <url>\n    <loc>" . htmlspecialchars($adres . $yol, ENT_XML1) . "</loc>\n    <lastmod>" . htmlspecialchars($tarih, ENT_XML1) . "</lastmod>\n    <priority>" . number_format($oncelik, 1) . "</priority>\n  </url>";
};

$ekle('/', $bugun, 1.0);
$ekle('/blog/', $bugun, 0.8);
$ekle('/isler/', $bugun, 0.8);
$ekle('/hizmetler/', $bugun, 0.9);
$ekle('/surec/', $bugun, 0.7);
foreach ($icerik['projeler'] as $p) $ekle('/isler/' . (($p['slug'] ?? '') ?: $p['kimlik']) . '/', $bugun, 0.7);
foreach ($icerik['hizmetler'] as $h) if (!empty($h['slug'])) $ekle('/hizmetler/' . $h['slug'] . '/', $bugun, 0.9);
// Demo sayfaları kodda durur; listeyi derleme yazar.
$demolar = json_decode((string)@file_get_contents(__DIR__ . '/demolar.json'), true);
if (is_array($demolar)) foreach ($demolar as $d) $ekle((string)$d['yol'], $bugun, (float)($d['oncelik'] ?? 0.8));
foreach ($icerik['yazilar'] as $y) {
    if (empty($y['slug'])) continue;
    $tarih = (string)(($y['guncelleme'] ?? '') ?: ($y['tarih'] ?? $bugun));
    $ekle('/blog/' . $y['slug'] . '/', $tarih, 0.7);
}

header('Content-Type: application/xml; charset=utf-8');
header('Cache-Control: public, max-age=3600');
echo "<?xml version=\"1.0\" encoding=\"UTF-8\"?>\n<urlset xmlns=\"http://www.sitemaps.org/schemas/sitemap/0.9\">\n" . implode("\n", $satirlar) . "\n</urlset>\n";
