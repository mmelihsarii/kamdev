<?php
/* Canlı llms.txt: dil modellerine sitenin güncel özetini verir (https://llmstxt.org). */
require __DIR__ . '/_cekirdek.php';

$icerik = icerik_topla(db(), false);
$site = $icerik['ayarlar']['site'] ?? [];
$adres = rtrim((string)($site['adres'] ?? ''), '/');
$duz = fn(string $m) => preg_replace(['~\*\*([^*]+)\*\*~', '~\[([^\]]+)\]\([^)]+\)~'], ['$1', '$1'], $m) ?? $m;

$projeler = array_map(fn($p) => $p['adres'] . ' (' . ($p['alan'] ?? '') . ')', array_filter($icerik['projeler'], fn($p) => !empty($p['adres'])));
$satirlar = [
    '# ' . ($site['tamAd'] ?? 'KAM'),
    '',
    '> ' . ($site['aciklama'] ?? ''),
    '',
    '- E-posta: ' . ($site['eposta'] ?? ''),
    '- Konum: ' . ($site['konum'] ?? '') . ' (Türkiye geneli uzaktan hizmet)',
    '- Canlı işler: ' . implode(', ', $projeler),
    '',
    '## Hizmetler',
    '',
];
foreach ($icerik['hizmetler'] as $h) {
    $satir = '- [' . $h['baslik'] . '](' . $adres . '/hizmetler/' . $h['slug'] . '/): ' . ($h['kisaCevap'] ?? '');
    if (!empty($site['fiyatGoster'])) $satir .= ' Başlangıç: ' . ($h['baslangicFiyati'] ?? '') . ' (' . ($h['fiyatNotu'] ?? '') . ').';
    $satirlar[] = $satir . ' Teslim: ' . ($h['teslimSuresi'] ?? '') . '.';
}
$satirlar[] = '';
$satirlar[] = '## İşler';
$satirlar[] = '';
foreach ($icerik['projeler'] as $p) $satirlar[] = '- [' . $p['ad'] . '](' . $adres . '/isler/' . (($p['slug'] ?? '') ?: $p['kimlik']) . '/): ' . ($p['ozet'] ?? '');
$demolar = json_decode((string)@file_get_contents(__DIR__ . '/demolar.json'), true);
if (is_array($demolar) && $demolar) {
    $satirlar[] = '';
    $satirlar[] = '## Canlı demolar';
    $satirlar[] = '';
    foreach ($demolar as $d) $satirlar[] = '- [' . $d['baslik'] . '](' . $adres . $d['yol'] . '): ' . $d['aciklama'];
}
$satirlar[] = '';
$satirlar[] = '## Blog';
$satirlar[] = '';
foreach ($icerik['yazilar'] as $y) $satirlar[] = '- [' . $y['baslik'] . '](' . $adres . '/blog/' . $y['slug'] . '/): ' . $duz((string)($y['kisaCevap'] ?? ''));
$satirlar[] = '';

header('Content-Type: text/plain; charset=utf-8');
header('Cache-Control: public, max-age=3600');
echo implode("\n", $satirlar);
