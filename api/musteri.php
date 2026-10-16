<?php
/* Müşteri paneli: müşteri yalnızca kendi projelerini görür. İç notlar müşteriye gönderilmez. */
require __DIR__ . '/_cekirdek.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') hata('Yalnızca gönderim yapılabilir', 405);
csrf_kontrol();
$ben = musteri_sart();
$db = db();
$g = govde(100_000);

/** Aşama adları sitenin süreç adımlarından gelir; panelde değişince müşteri de yenisini görür. */
function asamalar(PDO $db): array
{
    $icerik = icerik_topla($db, false);
    return array_map(fn($a) => ['baslik' => $a['baslik'], 'aciklama' => $a['aciklama'], 'sure' => $a['sure'] ?? ''], $icerik['surec']);
}

function musteri_projesi(array $p): array
{
    unset($p['notlar'], $p['musteri_id']);
    $p['teknolojiler'] = json_decode((string)$p['teknolojiler'], true) ?: [];
    return $p;
}

$kosul = $ben['rol'] === 'yonetici' && !empty($g['musteri_id']) ? (int)$g['musteri_id'] : (int)$ben['id'];

switch ($g['islem'] ?? '') {
    case 'projelerim': {
        $s = $db->prepare("SELECT p.*, (SELECT MAX(tarih) FROM proje_guncellemeleri g WHERE g.proje_id = p.id) AS son_guncelleme FROM musteri_projeleri p WHERE p.musteri_id = ? ORDER BY CASE p.durum WHEN 'devam' THEN 0 WHEN 'beklemede' THEN 1 ELSE 2 END, p.guncelleme DESC");
        $s->execute([$kosul]);
        json_yanit(['projeler' => array_map('musteri_projesi', $s->fetchAll()), 'asamalar' => asamalar($db), 'kullanici' => $ben]);
    }

    case 'proje': {
        $id = (int)($g['id'] ?? 0);
        $s = $db->prepare('SELECT p.*, k.firma AS musteri_firma FROM musteri_projeleri p JOIN kullanicilar k ON k.id = p.musteri_id WHERE p.id = ?');
        $s->execute([$id]);
        $p = $s->fetch();
        if (!$p || ($ben['rol'] !== 'yonetici' && (int)$p['musteri_id'] !== (int)$ben['id'])) hata('Proje bulunamadı', 404);
        $p = musteri_projesi($p);
        $s = $db->prepare('SELECT id, tarih, baslik, aciklama, asama, dosyalar FROM proje_guncellemeleri WHERE proje_id = ? ORDER BY tarih DESC, id DESC');
        $s->execute([$id]);
        $p['guncellemeler'] = array_map(function ($x) {
            $x['dosyalar'] = json_decode((string)$x['dosyalar'], true) ?: [];
            return $x;
        }, $s->fetchAll());
        $s = $db->prepare('SELECT id, tur, baslik, aciklama, durum, guncelleme FROM proje_sorunlari WHERE proje_id = ? ORDER BY durum, id DESC');
        $s->execute([$id]);
        $p['sorunlar'] = $s->fetchAll();
        json_yanit(['proje' => $p, 'asamalar' => asamalar($db)]);
    }
}

hata('Bilinmeyen işlem');
