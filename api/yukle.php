<?php
/*
 * Yönetici dosya yükleme.
 *  ozel=0: sitede kullanılacak görsel (medya kütüphanesi), herkese açık.
 *  ozel=1: müşteri projesine ait görsel ya da belge, yalnızca yönetici ve müşteri görür.
 * Görseller en fazla 2400 piksele küçültülüp WebP olarak yeniden kodlanır; bu hem
 * boyutu düşürür hem de dosyanın içine gizlenmiş zararlı veriyi temizler.
 */
require __DIR__ . '/_cekirdek.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') hata('Yalnızca yükleme yapılabilir', 405);
csrf_kontrol();
yonetici_sart();

$dosya = $_FILES['dosya'] ?? null;
if (!$dosya || ($dosya['error'] ?? UPLOAD_ERR_NO_FILE) !== UPLOAD_ERR_OK) {
    $kod = $dosya['error'] ?? UPLOAD_ERR_NO_FILE;
    hata($kod === UPLOAD_ERR_INI_SIZE || $kod === UPLOAD_ERR_FORM_SIZE ? 'Dosya sunucunun izin verdiği boyuttan büyük' : 'Dosya alınamadı');
}
if ($dosya['size'] > 25 * 1024 * 1024) hata('Dosya en fazla 25 MB olabilir');

$ozel = ($_POST['ozel'] ?? '0') === '1';
$projeId = isset($_POST['proje_id']) && $_POST['proje_id'] !== '' ? (int)$_POST['proje_id'] : null;
$tur = (new finfo(FILEINFO_MIME_TYPE))->file($dosya['tmp_name']) ?: '';

$gorselTurleri = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
$belgeTurleri = ['application/pdf', 'application/zip', 'application/x-zip-compressed'];
$gorsel = in_array($tur, $gorselTurleri, true);
if (!$gorsel && !($ozel && in_array($tur, $belgeTurleri, true))) {
    hata($ozel ? 'Yalnızca görsel, PDF ya da ZIP yüklenebilir' : 'Yalnızca JPG, PNG, WEBP ya da GIF görsel yüklenebilir');
}

$orijinalAd = mb_substr(basename((string)$dosya['name']), 0, 160);
$kok = preg_replace('~[^a-z0-9]+~', '-', strtolower(strtr(pathinfo($orijinalAd, PATHINFO_FILENAME), [
    'ç' => 'c', 'ğ' => 'g', 'ı' => 'i', 'ö' => 'o', 'ş' => 's', 'ü' => 'u', 'Ç' => 'c', 'Ğ' => 'g', 'İ' => 'i', 'Ö' => 'o', 'Ş' => 's', 'Ü' => 'u',
])));
$kok = trim((string)$kok, '-') ?: 'dosya';
$kok = substr($kok, 0, 50) . '-' . bin2hex(random_bytes(4));

$genislik = $yukseklik = null;
$kayitTuru = $tur;

if ($gorsel && $tur !== 'image/gif') {
    $kaynak = match ($tur) {
        'image/jpeg' => @imagecreatefromjpeg($dosya['tmp_name']),
        'image/png' => @imagecreatefrompng($dosya['tmp_name']),
        'image/webp' => @imagecreatefromwebp($dosya['tmp_name']),
        default => false,
    };
    if (!$kaynak) hata('Görsel okunamadı');
    // Telefon fotoğraflarındaki döndürme bilgisini uygula.
    if ($tur === 'image/jpeg' && function_exists('exif_read_data')) {
        $exif = @exif_read_data($dosya['tmp_name']);
        $yon = (int)($exif['Orientation'] ?? 1);
        $aci = [3 => 180, 6 => -90, 8 => 90][$yon] ?? 0;
        if ($aci) $kaynak = imagerotate($kaynak, $aci, 0);
    }
    $g = imagesx($kaynak);
    $y = imagesy($kaynak);
    $oran = min(1, 2400 / max($g, $y));
    $yg = (int)round($g * $oran);
    $yy = (int)round($y * $oran);
    $hedef = imagecreatetruecolor($yg, $yy);
    imagealphablending($hedef, false);
    imagesavealpha($hedef, true);
    imagecopyresampled($hedef, $kaynak, 0, 0, 0, 0, $yg, $yy, $g, $y);
    $ad = $kok . '.webp';
    $kayitTuru = 'image/webp';
    $genislik = $yg;
    $yukseklik = $yy;
} else {
    $uzanti = ['image/gif' => 'gif', 'application/pdf' => 'pdf', 'application/zip' => 'zip', 'application/x-zip-compressed' => 'zip'][$tur] ?? 'bin';
    $ad = $kok . '.' . $uzanti;
    if ($gorsel) {
        $boyut = @getimagesize($dosya['tmp_name']);
        $genislik = $boyut[0] ?? null;
        $yukseklik = $boyut[1] ?? null;
    }
}

if ($ozel) {
    $goreceli = $ad;
    $hedefYol = KAM_OZEL . '/' . $ad;
} else {
    $goreceli = gmdate('Y/m') . '/' . $ad;
    $hedefYol = KAM_MEDYA . '/' . $goreceli;
    klasor_hazirla(dirname($hedefYol));
}

if (isset($hedef)) {
    if (!imagewebp($hedef, $hedefYol, 82)) hata('Görsel kaydedilemedi', 500);
} elseif (!move_uploaded_file($dosya['tmp_name'], $hedefYol)) {
    hata('Dosya kaydedilemedi', 500);
}

$db = db();
yazmadan_once();
$db->prepare('INSERT INTO dosyalar (ad, yol, tur, boyut, genislik, yukseklik, ozel, proje_id, olusturma) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)')
    ->execute([$orijinalAd, $goreceli, $kayitTuru, filesize($hedefYol), $genislik, $yukseklik, $ozel ? 1 : 0, $projeId, simdi()]);
$id = son_eklenen_id($db);

json_yanit([
    'id' => $id,
    'ad' => $orijinalAd,
    'tur' => $kayitTuru,
    'adres' => $ozel ? '/api/dosya.php?id=' . $id : medya_adresi($goreceli),
    'genislik' => $genislik,
    'yukseklik' => $yukseklik,
]);
