<?php
/* İletişim formundan gelen talepler. Veritabanına yazılır ve panelde görünür. */
require __DIR__ . '/_cekirdek.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') hata('Yalnızca gönderim yapılabilir', 405);
csrf_kontrol();
$g = govde(50_000);

// Botlar için görünmez alan doluysa sessizce başarılı say.
if (trim((string)($g['tuzak'] ?? '')) !== '') json_yanit(['tamam' => true]);

deneme_siniri('talep', 6, 3600);

$alan = fn(string $ad, int $sinir) => mb_substr(trim((string)($g[$ad] ?? '')), 0, $sinir);
$talep = [
    'konu' => $alan('konu', 120),
    'ad' => $alan('ad', 120),
    'firma' => $alan('firma', 160),
    'iletisim' => $alan('iletisim', 160),
    'mesaj' => $alan('mesaj', 5000),
];
if ($talep['ad'] === '' || $talep['iletisim'] === '' || $talep['mesaj'] === '') hata('Ad, iletişim bilgisi ve mesaj zorunludur');

$db = db();
yazmadan_once();
$db->prepare('INSERT INTO talepler (konu, ad, firma, iletisim, mesaj, ip, olusturma) VALUES (?, ?, ?, ?, ?, ?, ?)')
    ->execute([$talep['konu'], $talep['ad'], $talep['firma'], $talep['iletisim'], $talep['mesaj'], istemci_ip(), simdi()]);
deneme_kaydet('talep');

// Sunucu destekliyorsa site adresine bildirim maili; desteklemiyorsa talep yine panelde.
$ayar = json_decode((string)$db->query("SELECT veri FROM ayarlar WHERE anahtar = 'genel'")->fetchColumn(), true);
$hedef = $ayar['site']['eposta'] ?? '';
if ($hedef && function_exists('mail')) {
    $metin = "Konu {$talep['konu']}\nAd {$talep['ad']}\nFirma {$talep['firma']}\nİletişim {$talep['iletisim']}\n\n{$talep['mesaj']}";
    @mail($hedef, '=?UTF-8?B?' . base64_encode('Yeni proje talebi ' . $talep['konu']) . '?=', $metin, "Content-Type: text/plain; charset=UTF-8\r\n");
}

json_yanit(['tamam' => true]);
