<?php
/* Mevcut KAM SQLite veritabanını boş Supabase şemasına bir kez aktarır. */
declare(strict_types=1);

if (PHP_SAPI !== 'cli') {
    fwrite(STDERR, "Bu araç yalnızca komut satırında çalıştırılabilir.\n");
    exit(1);
}

$kaynak = $argv[1] ?? '';
if ($kaynak === '' || !is_file($kaynak)) {
    fwrite(STDERR, "Kullanım: php scripts/supabase-aktar.php /guvenli/yol/kam.sqlite\n");
    exit(1);
}
if (!getenv('SUPABASE_DB_URL')) {
    fwrite(STDERR, "Önce SUPABASE_DB_URL ortam değişkenini ayarlayın.\n");
    exit(1);
}

putenv('KAM_TOHUM_YOK=1');
require dirname(__DIR__) . '/api/_cekirdek.php';

$tablolar = [
    'ayarlar', 'ogeler', 'kullanicilar', 'musteri_projeleri',
    'proje_guncellemeleri', 'proje_sorunlari', 'dosyalar',
    'talepler', 'deneme_kayitlari', 'cop',
];
$kimlikli = array_flip([
    'kullanicilar', 'musteri_projeleri', 'proje_guncellemeleri',
    'proje_sorunlari', 'dosyalar', 'talepler', 'cop',
]);

try {
    $eski = new PDO('sqlite:' . realpath($kaynak), null, null, [
        PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
        PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
    ]);
    $yeni = db();

    foreach ($tablolar as $tablo) {
        $adet = (int)$yeni->query("SELECT COUNT(*) FROM {$tablo}")->fetchColumn();
        if ($adet !== 0) throw new RuntimeException("Hedefte {$tablo} tablosu boş değil; aktarım durduruldu.");
    }

    $yeni->beginTransaction();
    foreach ($tablolar as $tablo) {
        $satirlar = $eski->query("SELECT * FROM {$tablo}")->fetchAll();
        if (!$satirlar) continue;
        $alanlar = array_keys($satirlar[0]);
        $sorgu = $yeni->prepare(
            "INSERT INTO {$tablo} (" . implode(', ', $alanlar) . ') VALUES (' . implode(', ', array_fill(0, count($alanlar), '?')) . ')'
        );
        foreach ($satirlar as $satir) $sorgu->execute(array_values($satir));
        if (isset($kimlikli[$tablo])) {
            $yeni->query("SELECT setval(pg_get_serial_sequence('public.{$tablo}', 'id'), (SELECT MAX(id) FROM public.{$tablo}), true)")->fetchColumn();
        }
        fwrite(STDOUT, $tablo . ': ' . count($satirlar) . " kayıt aktarıldı\n");
    }
    $yeni->commit();
    fwrite(STDOUT, "Aktarım tamamlandı. Kaynak SQLite dosyası değiştirilmedi.\n");
} catch (Throwable $hata) {
    if (isset($yeni) && $yeni instanceof PDO && $yeni->inTransaction()) $yeni->rollBack();
    fwrite(STDERR, 'Aktarım başarısız: ' . $hata->getMessage() . "\n");
    exit(1);
}
