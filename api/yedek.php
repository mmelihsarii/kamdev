<?php
/*
 * Yedek indirme (yalnızca yönetici).
 *  ?tur=tam              Veritabanının anlık kopyası, yüklenen görseller ve müşteri dosyaları tek zip.
 *  ?tur=gunluk&ad=...    Otomatik alınmış günlük JSON veritabanı kopyalarından biri.
 */
require __DIR__ . '/_cekirdek.php';

yonetici_sart();
$tur = (string)($_GET['tur'] ?? '');

if ($tur === 'gunluk') {
    $ad = basename((string)($_GET['ad'] ?? ''));
    $yol = KAM_YEDEK . '/' . $ad;
    if (!preg_match('~^kam-[\w-]+\.json$~', $ad) || !is_file($yol)) {
        http_response_code(404);
        exit;
    }
    header('Content-Type: application/octet-stream');
    header('Content-Disposition: attachment; filename="' . $ad . '"');
    header('Content-Length: ' . filesize($yol));
    readfile($yol);
    exit;
}

if ($tur !== 'tam') hata('Bilinmeyen yedek türü');
if (!class_exists('ZipArchive')) hata('Sunucuda zip desteği yok; günlük veritabanı kopyalarını tek tek indirebilirsiniz', 500);

$gecici = tempnam(sys_get_temp_dir(), 'kamyedek');
$anlik = KAM_YEDEK . '/indirme-' . bin2hex(random_bytes(4)) . '.json';
yedek_al($anlik);

$zip = new ZipArchive();
$zip->open($gecici, ZipArchive::OVERWRITE);
$zip->addFile($anlik, 'kam-veritabani.json');
foreach (['medya' => KAM_MEDYA, 'ozel' => KAM_OZEL] as $ad => $klasor) {
    if (!is_dir($klasor)) continue;
    $gez = new RecursiveIteratorIterator(new RecursiveDirectoryIterator($klasor, FilesystemIterator::SKIP_DOTS));
    foreach ($gez as $dosya) {
        if ($dosya->isFile()) $zip->addFile($dosya->getPathname(), $ad . '/' . substr($dosya->getPathname(), strlen($klasor) + 1));
    }
}
$zip->addFromString('BENIOKU.txt', "KAM tam yedek\nAlınma zamanı " . gmdate('c') . "\n\nBu arşiv veritabanı tablolarının JSON kopyasını, medya ve müşteri dosyalarını içerir. Veritabanı bağlantısı SUPABASE_DB_URL ortam değişkeniyle yapılandırılır.\n");
$zip->close();
@unlink($anlik);

header('Content-Type: application/zip');
header('Content-Disposition: attachment; filename="kam-tam-yedek-' . gmdate('Ymd-His') . '.zip"');
header('Content-Length: ' . filesize($gecici));
readfile($gecici);
@unlink($gecici);
