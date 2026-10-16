<?php
/* Giriş, çıkış, ilk yönetici kurulumu ve şifre değiştirme. */
require __DIR__ . '/_cekirdek.php';

$db = db();

function yonetici_var_mi(PDO $db): bool
{
    return (int)$db->query("SELECT COUNT(*) FROM kullanicilar WHERE rol = 'yonetici'")->fetchColumn() > 0;
}

if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    json_yanit(['kullanici' => kullanici(), 'kurulum' => !yonetici_var_mi($db)]);
}

csrf_kontrol();
$g = govde();
$islem = $g['islem'] ?? '';

switch ($islem) {
    case 'giris': {
        deneme_siniri('giris', 8, 900);
        $eposta = trim((string)($g['eposta'] ?? ''));
        $sifre = (string)($g['sifre'] ?? '');
        $sorgu = $db->prepare('SELECT id, sifre, aktif FROM kullanicilar WHERE lower(eposta) = lower(?)');
        $sorgu->execute([$eposta]);
        $k = $sorgu->fetch();
        // Kopyala yapıştırda şifrenin başına ya da sonuna kaçan boşluk girişi engellemesin.
        $dogru = $k && (password_verify($sifre, $k['sifre']) || ($sifre !== trim($sifre) && password_verify(trim($sifre), $k['sifre'])));
        if (!$dogru || !(int)$k['aktif']) {
            deneme_kaydet('giris');
            hata('Mail adresi ya da şifre hatalı', 401);
        }
        if (password_needs_rehash($k['sifre'], PASSWORD_DEFAULT) && password_verify($sifre, $k['sifre'])) {
            $db->prepare('UPDATE kullanicilar SET sifre = ? WHERE id = ?')->execute([password_hash($sifre, PASSWORD_DEFAULT), $k['id']]);
        }
        oturum_baslat();
        session_regenerate_id(true);
        $_SESSION['kullanici_id'] = (int)$k['id'];
        $db->prepare('UPDATE kullanicilar SET son_giris = ? WHERE id = ?')->execute([simdi(), $k['id']]);
        json_yanit(['kullanici' => kullanici()]);
    }

    case 'cikis': {
        oturum_baslat();
        $_SESSION = [];
        session_destroy();
        json_yanit(['tamam' => true]);
    }

    case 'kurulum': {
        // Yalnızca hiç yönetici yokken çalışır; sonra kapanır.
        if (yonetici_var_mi($db)) hata('Kurulum zaten yapılmış', 403);
        $eposta = trim((string)($g['eposta'] ?? ''));
        $sifre = (string)($g['sifre'] ?? '');
        $ad = trim((string)($g['ad'] ?? ''));
        if (!filter_var($eposta, FILTER_VALIDATE_EMAIL)) hata('Geçerli bir mail adresi girin');
        if (mb_strlen($sifre) < 10) hata('Şifre en az 10 karakter olmalı');
        $db->prepare("INSERT INTO kullanicilar (eposta, sifre, ad, rol, olusturma) VALUES (?, ?, ?, 'yonetici', ?)")
            ->execute([$eposta, password_hash($sifre, PASSWORD_DEFAULT), $ad, simdi()]);
        oturum_baslat();
        session_regenerate_id(true);
        $_SESSION['kullanici_id'] = son_eklenen_id($db);
        json_yanit(['kullanici' => kullanici()]);
    }

    case 'sifre': {
        $k = musteri_sart();
        $sorgu = $db->prepare('SELECT sifre FROM kullanicilar WHERE id = ?');
        $sorgu->execute([$k['id']]);
        if (!password_verify((string)($g['eski'] ?? ''), (string)$sorgu->fetchColumn())) hata('Mevcut şifre hatalı', 400);
        $yeni = (string)($g['yeni'] ?? '');
        if (mb_strlen($yeni) < 10) hata('Yeni şifre en az 10 karakter olmalı');
        $db->prepare('UPDATE kullanicilar SET sifre = ? WHERE id = ?')->execute([password_hash($yeni, PASSWORD_DEFAULT), $k['id']]);
        json_yanit(['tamam' => true]);
    }
}

hata('Bilinmeyen işlem');
