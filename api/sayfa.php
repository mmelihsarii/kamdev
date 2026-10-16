<?php
/*
 * Blog yazısı ve hizmet sayfaları için kapı. Panelden eklenen bir yazının
 * derlemede üretilmiş HTML'i yoktur; bu dosya onu doğru başlık, açıklama ve
 * yapılandırılmış veriyle 200 koduyla sunar. Yayından kaldırılan ya da silinen
 * sayfalar ise derleme kopyası dursa bile 404 döner.
 */
require __DIR__ . '/_cekirdek.php';

function bulunamadi(): never
{
    http_response_code(404);
    header('Content-Type: text/html; charset=utf-8');
    $sayfa = KAM_KOK . '/404.html';
    if (is_file($sayfa)) readfile($sayfa);
    exit;
}

function html_gonder(string $html): never
{
    header('Content-Type: text/html; charset=utf-8');
    header('Cache-Control: no-cache');
    echo $html;
    exit;
}

function kacis(string $m): string
{
    return htmlspecialchars($m, ENT_QUOTES | ENT_SUBSTITUTE, 'UTF-8');
}

function duz_metin(string $m): string
{
    return preg_replace(['~\*\*([^*]+)\*\*~', '~\[([^\]]+)\]\([^)]+\)~'], ['$1', '$1'], $m) ?? $m;
}

$tur = (string)($_GET['tur'] ?? '');
$slug = (string)($_GET['slug'] ?? '');
if (!in_array($tur, ['blog', 'hizmetler', 'isler'], true) || !preg_match('~^[a-z0-9-]{1,120}$~', $slug)) bulunamadi();

$yol = "/{$tur}/{$slug}/";
$istek = (string)parse_url((string)($_SERVER['REQUEST_URI'] ?? ''), PHP_URL_PATH);
if (!str_ends_with($istek, '/')) {
    header('Location: ' . $yol, true, 301);
    exit;
}

$db = db();
$koleksiyon = ['blog' => 'yazilar', 'hizmetler' => 'hizmetler', 'isler' => 'projeler'][$tur];
// Adresi olmayan eski iş kayıtlarında kimlik adres yerine geçer.
$jsonSlug = $db->getAttribute(PDO::ATTR_DRIVER_NAME) === 'pgsql' ? "(veri::jsonb ->> 'slug')" : "json_extract(veri, '$.slug')";
$s = $db->prepare("SELECT veri FROM ogeler WHERE koleksiyon = ? AND ({$jsonSlug} = ? OR (COALESCE({$jsonSlug}, '') = '' AND kimlik = ?))");
$s->execute([$koleksiyon, $slug, $slug]);
$oge = json_decode((string)$s->fetchColumn(), true);
if (!is_array($oge) || ($oge['yayinda'] ?? true) === false) bulunamadi();

// Derlemede üretilmiş sayfa varsa o gönderilir; içerik tarayıcıda canlı veriyle tazelenir.
$statik = KAM_KOK . $yol . 'index.html';
if (is_file($statik)) html_gonder((string)file_get_contents($statik));

$sablon = @file_get_contents(__DIR__ . '/_sablon.html');
if (!$sablon) bulunamadi();

$ayar = json_decode((string)$db->query("SELECT veri FROM ayarlar WHERE anahtar = 'genel'")->fetchColumn(), true) ?: [];
$site = $ayar['site'] ?? [];
$adres = rtrim((string)($site['adres'] ?? ''), '/');
$siteAd = (string)($site['ad'] ?? 'KAM');
$kurum = $adres . '/#kurum';

if ($tur === 'blog') {
    $baslik = (string)(($oge['seoBaslik'] ?? '') ?: ($oge['baslik'] ?? ''));
    $aciklama = (string)($oge['aciklama'] ?? '');
    $gorsel = (string)($oge['gorsel']['src'] ?? '') ?: '/og.png';
    $ld = [
        '@type' => 'BlogPosting',
        'headline' => (string)($oge['baslik'] ?? ''),
        'description' => $aciklama,
        'abstract' => duz_metin((string)($oge['kisaCevap'] ?? '')),
        'datePublished' => (string)($oge['tarih'] ?? ''),
        'dateModified' => (string)(($oge['guncelleme'] ?? '') ?: ($oge['tarih'] ?? '')),
        'image' => str_starts_with($gorsel, 'http') ? $gorsel : $adres . $gorsel,
        'url' => $adres . $yol,
        'mainEntityOfPage' => $adres . $yol,
        'inLanguage' => (string)($site['dil'] ?? 'tr-TR'),
        'author' => ['@id' => $kurum],
        'publisher' => ['@id' => $kurum],
    ];
    $ogTuru = 'article';
} elseif ($tur === 'isler') {
    $baslik = (string)(($oge['seoBaslik'] ?? '') ?: (($oge['ad'] ?? '') . ', ' . ($oge['alan'] ?? '') . ' projesi'));
    $aciklama = (string)(($oge['seoAciklama'] ?? '') ?: ($oge['ozet'] ?? ''));
    $gorsel = (string)(($oge['kapak'] ?? '') ?: (($oge['gorseller'][0] ?? '') ?: '/og.png'));
    $ld = [
        '@type' => 'CreativeWork',
        'name' => (string)($oge['ad'] ?? ''),
        'description' => (string)($oge['ozet'] ?? ''),
        'url' => $adres . $yol,
        'image' => str_starts_with($gorsel, 'http') ? $gorsel : $adres . $gorsel,
        'creator' => ['@id' => $kurum],
        'dateCreated' => (string)($oge['yil'] ?? ''),
        'genre' => (string)($oge['alan'] ?? ''),
        'keywords' => implode(', ', array_map('strval', (array)($oge['etiketler'] ?? []))),
    ];
    $ogTuru = 'website';
} else {
    $baslik = (string)(($oge['seoBaslik'] ?? '') ?: ($oge['baslik'] ?? ''));
    $aciklama = (string)(($oge['seoAciklama'] ?? '') ?: ($oge['vitrinAciklama'] ?? ''));
    $gorsel = (string)($oge['gorsel']['src'] ?? '') ?: '/og.png';
    $ld = [
        '@type' => 'Service',
        'name' => (string)($oge['baslik'] ?? ''),
        'description' => duz_metin((string)($oge['kisaCevap'] ?? '')),
        'url' => $adres . $yol,
        'provider' => ['@id' => $kurum],
        'areaServed' => ['@type' => 'Country', 'name' => 'Türkiye'],
    ];
    $ogTuru = 'website';
}

$sss = array_values(array_filter((array)($oge['sss'] ?? []), fn($x) => is_array($x) && !empty($x['soru'])));
$graf = [$ld];
if ($sss) {
    $graf[] = [
        '@type' => 'FAQPage',
        'mainEntity' => array_map(fn($x) => ['@type' => 'Question', 'name' => (string)$x['soru'], 'acceptedAnswer' => ['@type' => 'Answer', 'text' => duz_metin((string)($x['cevap'] ?? ''))]], $sss),
    ];
}

$gorselAdres = str_starts_with($gorsel, 'http') ? $gorsel : $adres . $gorsel;
$kafa = implode("\n    ", [
    '<title>' . kacis($baslik) . '</title>',
    '<meta name="description" content="' . kacis($aciklama) . '" />',
    '<meta name="robots" content="index, follow, max-image-preview:large, max-snippet:-1" />',
    '<link rel="canonical" href="' . kacis($adres . $yol) . '" />',
    '<meta property="og:type" content="' . $ogTuru . '" />',
    '<meta property="og:locale" content="tr_TR" />',
    '<meta property="og:site_name" content="' . kacis($siteAd) . '" />',
    '<meta property="og:title" content="' . kacis($baslik) . '" />',
    '<meta property="og:description" content="' . kacis($aciklama) . '" />',
    '<meta property="og:url" content="' . kacis($adres . $yol) . '" />',
    '<meta property="og:image" content="' . kacis($gorselAdres) . '" />',
    '<meta name="twitter:card" content="summary_large_image" />',
    '<script type="application/ld+json">' . str_replace('<', '<', (string)json_encode(['@context' => 'https://schema.org', '@graph' => $graf], JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES)) . '</script>',
]);

html_gonder(str_replace('<!--kafa-->', $kafa, $sablon));
