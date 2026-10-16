<?php
/* Panelden yüklenen herkese açık görselleri veri klasöründen sunar. Dosya adları benzersiz olduğu için uzun süre önbelleklenir. */
require __DIR__ . '/_cekirdek.php';

$d = (string)($_GET['d'] ?? '');
if ($d === '' || str_contains($d, '..') || !preg_match('~^[a-z0-9/._-]+$~i', $d)) {
    http_response_code(404);
    exit;
}
$yol = KAM_MEDYA . '/' . $d;
if (!is_file($yol)) {
    http_response_code(404);
    exit;
}
$tur = (new finfo(FILEINFO_MIME_TYPE))->file($yol) ?: 'application/octet-stream';
if (!str_starts_with($tur, 'image/')) {
    http_response_code(404);
    exit;
}
header('Content-Type: ' . $tur);
header('Content-Length: ' . filesize($yol));
header('Cache-Control: public, max-age=31536000, immutable');
header('X-Content-Type-Options: nosniff');
readfile($yol);
