<?php
/* Müşteri projelerine ait özel dosyalar: yalnızca yönetici ve projenin sahibi görebilir. */
require __DIR__ . '/_cekirdek.php';

$k = kullanici();
if (!$k) {
    http_response_code(401);
    exit;
}
$id = (int)($_GET['id'] ?? 0);
$sorgu = db()->prepare('SELECT d.*, p.musteri_id FROM dosyalar d LEFT JOIN musteri_projeleri p ON p.id = d.proje_id WHERE d.id = ? AND d.ozel = 1');
$sorgu->execute([$id]);
$dosya = $sorgu->fetch();
if (!$dosya || ($k['rol'] !== 'yonetici' && (int)$dosya['musteri_id'] !== (int)$k['id'])) {
    http_response_code(404);
    exit;
}
$yol = KAM_OZEL . '/' . basename((string)$dosya['yol']);
if (!is_file($yol)) {
    http_response_code(404);
    exit;
}
header('Content-Type: ' . $dosya['tur']);
header('Content-Length: ' . filesize($yol));
header('Cache-Control: private, max-age=3600');
header('X-Content-Type-Options: nosniff');
$ad = rawurlencode((string)$dosya['ad']);
header("Content-Disposition: " . (str_starts_with((string)$dosya['tur'], 'image/') ? 'inline' : 'attachment') . "; filename*=UTF-8''{$ad}");
readfile($yol);
