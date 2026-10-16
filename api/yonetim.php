<?php
/* Yönetim paneli işlemleri. Hepsi yönetici oturumu ister. */
require __DIR__ . '/_cekirdek.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') hata('Yalnızca gönderim yapılabilir', 405);
csrf_kontrol();
$ben = yonetici_sart();
$db = db();
$g = govde();
$islem = (string)($g['islem'] ?? '');

/* ---------- yardımcılar ---------- */

function koleksiyon_dogrula(string $ad): string
{
    if (!in_array($ad, KAM_KOLEKSIYONLAR, true)) hata('Bilinmeyen koleksiyon');
    return $ad;
}

function oge_slug_sql(PDO $db): string
{
    return $db->getAttribute(PDO::ATTR_DRIVER_NAME) === 'pgsql' ? "(veri::jsonb ->> 'slug')" : "json_extract(veri, '$.slug')";
}

function kisa_ad(string $metin): string
{
    $metin = strtr(mb_strtolower($metin, 'UTF-8'), ['ç' => 'c', 'ğ' => 'g', 'ı' => 'i', 'ö' => 'o', 'ş' => 's', 'ü' => 'u', 'â' => 'a', 'î' => 'i', 'û' => 'u']);
    $metin = trim((string)preg_replace('~[^a-z0-9]+~', '-', $metin), '-');
    return $metin ?: 'oge-' . bin2hex(random_bytes(3));
}

function json_alan(array $satir, array $alanlar): array
{
    foreach ($alanlar as $a) $satir[$a] = json_decode((string)($satir[$a] ?? '[]'), true) ?: [];
    return $satir;
}

function proje_getir(PDO $db, int $id): array
{
    $s = $db->prepare('SELECT p.*, k.ad AS musteri_ad, k.firma AS musteri_firma, k.eposta AS musteri_eposta FROM musteri_projeleri p JOIN kullanicilar k ON k.id = p.musteri_id WHERE p.id = ?');
    $s->execute([$id]);
    $p = $s->fetch();
    if (!$p) hata('Proje bulunamadı', 404);
    $p = json_alan($p, ['teknolojiler']);
    $s = $db->prepare('SELECT * FROM proje_guncellemeleri WHERE proje_id = ? ORDER BY tarih DESC, id DESC');
    $s->execute([$id]);
    $p['guncellemeler'] = array_map(fn($x) => json_alan($x, ['dosyalar']), $s->fetchAll());
    $s = $db->prepare('SELECT * FROM proje_sorunlari WHERE proje_id = ? ORDER BY durum, id DESC');
    $s->execute([$id]);
    $p['sorunlar'] = $s->fetchAll();
    return $p;
}

function metin(array $g, string $ad, int $sinir = 2000): string
{
    return mb_substr(trim((string)($g[$ad] ?? '')), 0, $sinir);
}

/** Saniyenin altına inen zaman damgası; aynı kaydın iki sekmede ezilmesini yakalamak için. */
function damga(): string
{
    return (new DateTimeImmutable('now', new DateTimeZone('UTC')))->format('Y-m-d\\TH:i:s.uP');
}

/** İstemci kaydı açtığı andaki damgayı gönderir; arada başka biri değiştirdiyse yazılmaz. */
function cakisma_kontrol(array $g, string|false $simdiki): void
{
    if (!array_key_exists('beklenen', $g) || $simdiki === false || $simdiki === null) return;
    if ((string)$g['beklenen'] !== (string)$simdiki) {
        hata('Bu kayıt siz düzenlerken başka bir sekmede ya da cihazda değişti. Değişiklikleriniz taslak olarak duruyor; sayfayı yenileyip tekrar kaydedin.', 409);
    }
}

/** Projeyi bağlı güncelleme, sorun ve dosya bağlarıyla birlikte tek parça olarak okur. */
function proje_paketi(PDO $db, int $id): ?array
{
    $s = $db->prepare('SELECT * FROM musteri_projeleri WHERE id = ?');
    $s->execute([$id]);
    $p = $s->fetch();
    if (!$p) return null;
    $paket = ['proje' => $p];
    foreach (['guncellemeler' => 'proje_guncellemeleri', 'sorunlar' => 'proje_sorunlari'] as $anahtar => $tablo) {
        $s = $db->prepare("SELECT * FROM {$tablo} WHERE proje_id = ?");
        $s->execute([$id]);
        $paket[$anahtar] = $s->fetchAll();
    }
    $s = $db->prepare('SELECT id FROM dosyalar WHERE proje_id = ?');
    $s->execute([$id]);
    $paket['dosyalar'] = array_map('intval', $s->fetchAll(PDO::FETCH_COLUMN));
    return $paket;
}

/** Çöpten gelen satırı tabloya geri yazar. Eski numara boştaysa korunur, doluysa yenisi verilir. */
function satir_ekle(PDO $db, string $tablo, array $satir): int
{
    $izinliTablolar = ['kullanicilar', 'musteri_projeleri', 'proje_guncellemeleri', 'proje_sorunlari', 'dosyalar', 'talepler', 'cop'];
    if (!in_array($tablo, $izinliTablolar, true)) hata('Geçersiz tablo', 400);
    if ($db->getAttribute(PDO::ATTR_DRIVER_NAME) === 'pgsql') {
        $s = $db->prepare('SELECT column_name AS name FROM information_schema.columns WHERE table_schema = current_schema() AND table_name = ?');
        $s->execute([$tablo]);
        $sutunlar = array_column($s->fetchAll(), 'name');
    } else {
        $sutunlar = array_column($db->query("PRAGMA table_info({$tablo})")->fetchAll(), 'name');
    }
    $satir = array_intersect_key($satir, array_flip($sutunlar));
    if (isset($satir['id'])) {
        $s = $db->prepare("SELECT 1 FROM {$tablo} WHERE id = ?");
        $s->execute([(int)$satir['id']]);
        if ($s->fetchColumn()) unset($satir['id']);
    }
    $oncekiId = isset($satir['id']) ? (int)$satir['id'] : null;
    $alanlar = array_keys($satir);
    $db->prepare("INSERT INTO {$tablo} (" . implode(', ', $alanlar) . ') VALUES (' . implode(', ', array_fill(0, count($alanlar), '?')) . ')')
        ->execute(array_values($satir));
    if ($db->getAttribute(PDO::ATTR_DRIVER_NAME) === 'pgsql') {
        if ($oncekiId !== null) {
            $s = $db->prepare("SELECT setval(pg_get_serial_sequence('public.{$tablo}', 'id'), GREATEST((SELECT COALESCE(MAX(id), 1) FROM public.{$tablo}), 1), true)");
            $s->execute();
            return $oncekiId;
        }
        return son_eklenen_id($db);
    }
    return $oncekiId ?? son_eklenen_id($db);
}

function proje_geri_yukle(PDO $db, array $paket, ?int $musteriId = null): int
{
    $p = $paket['proje'];
    if ($musteriId) $p['musteri_id'] = $musteriId;
    $s = $db->prepare("SELECT 1 FROM kullanicilar WHERE id = ? AND rol = 'musteri'");
    $s->execute([(int)$p['musteri_id']]);
    if (!$s->fetchColumn()) hata('Bu projenin müşterisi artık yok. Önce müşteriyi çöp kutusundan geri alın.');
    $yeni = satir_ekle($db, 'musteri_projeleri', $p);
    foreach (['guncellemeler' => 'proje_guncellemeleri', 'sorunlar' => 'proje_sorunlari'] as $anahtar => $tablo) {
        foreach ($paket[$anahtar] ?? [] as $satir) satir_ekle($db, $tablo, ['proje_id' => $yeni] + array_diff_key($satir, ['proje_id' => 1]));
    }
    $bagla = $db->prepare('UPDATE dosyalar SET proje_id = ? WHERE id = ? AND proje_id IS NULL');
    foreach ($paket['dosyalar'] ?? [] as $d) $bagla->execute([$yeni, (int)$d]);
    return $yeni;
}

/* ---------- işlemler ---------- */

switch ($islem) {
    /* İçerik */
    case 'icerik': {
        $veri = icerik_topla($db, true);
        $zamanlar = ['ayarlar' => $db->query("SELECT guncelleme FROM ayarlar WHERE anahtar = 'genel'")->fetchColumn() ?: null, 'ogeler' => new stdClass()];
        $ogeler = [];
        foreach ($db->query('SELECT koleksiyon, kimlik, guncelleme FROM ogeler') as $r) $ogeler[$r['koleksiyon']][$r['kimlik']] = $r['guncelleme'];
        if ($ogeler) $zamanlar['ogeler'] = $ogeler;
        $veri['zamanlar'] = $zamanlar;
        json_yanit($veri);
    }

    case 'ayarlar-kaydet': {
        $ayarlar = $g['ayarlar'] ?? null;
        if (!is_array($ayarlar) || !isset($ayarlar['site'])) hata('Ayarlar eksik');
        cakisma_kontrol($g, $db->query("SELECT guncelleme FROM ayarlar WHERE anahtar = 'genel'")->fetchColumn());
        yazmadan_once();
        $an = damga();
        $db->prepare("INSERT INTO ayarlar (anahtar, veri, guncelleme) VALUES ('genel', ?, ?) ON CONFLICT(anahtar) DO UPDATE SET veri = excluded.veri, guncelleme = excluded.guncelleme")
            ->execute([json_encode($ayarlar, JSON_UNESCAPED_UNICODE), $an]);
        json_yanit(['tamam' => true, 'guncelleme' => $an]);
    }

    case 'oge-kaydet': {
        $ad = koleksiyon_dogrula((string)($g['koleksiyon'] ?? ''));
        $oge = $g['oge'] ?? null;
        if (!is_array($oge)) hata('Öğe eksik');
        $kimlik = trim((string)($oge['kimlik'] ?? ''));
        if ($kimlik === '') {
            $kaynak = 'oge';
            foreach (['slug', 'baslik', 'ad', 'soru'] as $alan) {
                if (trim((string)($oge[$alan] ?? '')) !== '') { $kaynak = (string)$oge[$alan]; break; }
            }
            $temel = kisa_ad($kaynak);
            $kimlik = $temel;
            $var = $db->prepare('SELECT 1 FROM ogeler WHERE koleksiyon = ? AND kimlik = ?');
            for ($i = 2; $var->execute([$ad, $kimlik]) && $var->fetchColumn(); $i++) $kimlik = $temel . '-' . $i;
            $oge['kimlik'] = $kimlik;
        }
        if (in_array($ad, ['yazilar', 'hizmetler', 'projeler'], true)) {
            $oge['slug'] = kisa_ad((string)($oge['slug'] ?? '') ?: (string)($oge['baslik'] ?? $oge['ad'] ?? $kimlik));
            // Aynı adres iki sayfaya verilmesin.
            $slugSql = oge_slug_sql($db);
            $s = $db->prepare("SELECT kimlik FROM ogeler WHERE koleksiyon = ? AND kimlik <> ? AND {$slugSql} = ?");
            $s->execute([$ad, $kimlik, $oge['slug']]);
            if ($s->fetchColumn()) hata('Bu adres başka bir sayfada kullanılıyor: ' . $oge['slug']);
        }
        $oge['yayinda'] = (bool)($oge['yayinda'] ?? true);
        $s = $db->prepare('SELECT sira, guncelleme FROM ogeler WHERE koleksiyon = ? AND kimlik = ?');
        $s->execute([$ad, $kimlik]);
        $mevcut = $s->fetch();
        cakisma_kontrol($g, $mevcut ? $mevcut['guncelleme'] : false);
        yazmadan_once();
        $sira = $mevcut ? $mevcut['sira'] : false;
        if ($sira === false) {
            // Yeni öğe: blog yazıları en üste, diğerleri en alta eklenir.
            if ($ad === 'yazilar') {
                $db->prepare('UPDATE ogeler SET sira = sira + 1 WHERE koleksiyon = ?')->execute([$ad]);
                $sira = 0;
            } else {
                $s = $db->prepare('SELECT COALESCE(MAX(sira), -1) + 1 FROM ogeler WHERE koleksiyon = ?');
                $s->execute([$ad]);
                $sira = (int)$s->fetchColumn();
            }
        }
        $db->prepare('INSERT INTO ogeler (koleksiyon, kimlik, sira, veri, guncelleme) VALUES (?, ?, ?, ?, ?) ON CONFLICT(koleksiyon, kimlik) DO UPDATE SET veri = excluded.veri, guncelleme = excluded.guncelleme')
            ->execute([$ad, $kimlik, (int)$sira, json_encode($oge, JSON_UNESCAPED_UNICODE), $an = damga()]);
        json_yanit(['oge' => $oge, 'guncelleme' => $an]);
    }

    case 'oge-sil': {
        $ad = koleksiyon_dogrula((string)($g['koleksiyon'] ?? ''));
        $s = $db->prepare('SELECT * FROM ogeler WHERE koleksiyon = ? AND kimlik = ?');
        $s->execute([$ad, (string)($g['kimlik'] ?? '')]);
        $satir = $s->fetch();
        if (!$satir) hata('Öğe bulunamadı', 404);
        $veri = json_decode((string)$satir['veri'], true) ?: [];
        yazmadan_once();
        $db->beginTransaction();
        cope_at('oge', $veri['baslik'] ?? $veri['ad'] ?? $veri['soru'] ?? $satir['kimlik'], $satir, $ben['eposta']);
        $db->prepare('DELETE FROM ogeler WHERE koleksiyon = ? AND kimlik = ?')->execute([$ad, $satir['kimlik']]);
        $db->commit();
        json_yanit(['tamam' => true]);
    }

    case 'sirala': {
        $ad = koleksiyon_dogrula((string)($g['koleksiyon'] ?? ''));
        $kimlikler = $g['kimlikler'] ?? [];
        if (!is_array($kimlikler)) hata('Sıra eksik');
        yazmadan_once();
        $db->beginTransaction();
        $s = $db->prepare('UPDATE ogeler SET sira = ? WHERE koleksiyon = ? AND kimlik = ?');
        foreach (array_values($kimlikler) as $i => $k) $s->execute([$i, $ad, (string)$k]);
        $db->commit();
        json_yanit(['tamam' => true]);
    }

    /* Gösterge */
    case 'ozet': {
        $say = fn(string $sql) => (int)$db->query($sql)->fetchColumn();
        json_yanit([
            'yeniTalep' => $say("SELECT COUNT(*) FROM talepler WHERE durum = 'yeni'"),
            'musteri' => $say("SELECT COUNT(*) FROM kullanicilar WHERE rol = 'musteri'"),
            'aktifProje' => $say("SELECT COUNT(*) FROM musteri_projeleri WHERE durum = 'devam'"),
            'yazi' => $say("SELECT COUNT(*) FROM ogeler WHERE koleksiyon = 'yazilar'"),
            'medya' => $say('SELECT COUNT(*) FROM dosyalar WHERE ozel = 0'),
            'sonIcerikGuncelleme' => $db->query('SELECT MAX(g) FROM (SELECT MAX(guncelleme) g FROM ogeler UNION ALL SELECT MAX(guncelleme) FROM ayarlar)')->fetchColumn(),
            'sonYedek' => (function () {
                $k = glob(KAM_YEDEK . '/kam-*.json') ?: [];
                sort($k);
                return $k ? gmdate('c', filemtime(end($k))) : null;
            })(),
            'veriKlasoru' => KAM_VERI,
        ]);
    }

    /* Talepler */
    case 'talepler':
        json_yanit($db->query('SELECT * FROM talepler ORDER BY id DESC LIMIT 500')->fetchAll());

    case 'talep-durum': {
        $durum = (string)($g['durum'] ?? '');
        if (!in_array($durum, ['yeni', 'okundu', 'donuldu'], true)) hata('Geçersiz durum');
        $db->prepare('UPDATE talepler SET durum = ? WHERE id = ?')->execute([$durum, (int)($g['id'] ?? 0)]);
        json_yanit(['tamam' => true]);
    }

    case 'talep-sil': {
        $s = $db->prepare('SELECT * FROM talepler WHERE id = ?');
        $s->execute([(int)($g['id'] ?? 0)]);
        $talep = $s->fetch();
        if (!$talep) hata('Talep bulunamadı', 404);
        yazmadan_once();
        $db->beginTransaction();
        cope_at('talep', trim($talep['ad'] . ' ' . $talep['konu']) ?: 'Talep', $talep, $ben['eposta']);
        $db->prepare('DELETE FROM talepler WHERE id = ?')->execute([(int)$talep['id']]);
        $db->commit();
        json_yanit(['tamam' => true]);
    }

    /* Kullanıcılar */
    case 'kullanicilar':
        json_yanit($db->query("SELECT k.id, k.eposta, k.ad, k.firma, k.telefon, k.rol, k.aktif, k.olusturma, k.son_giris, (SELECT COUNT(*) FROM musteri_projeleri p WHERE p.musteri_id = k.id) AS proje_sayisi FROM kullanicilar k ORDER BY k.rol, k.ad")->fetchAll());

    case 'kullanici-kaydet': {
        $id = (int)($g['id'] ?? 0);
        $eposta = metin($g, 'eposta', 200);
        if (!filter_var($eposta, FILTER_VALIDATE_EMAIL)) hata('Geçerli bir mail adresi girin');
        $rol = ($g['rol'] ?? 'musteri') === 'yonetici' ? 'yonetici' : 'musteri';
        $sifre = (string)($g['sifre'] ?? '');
        if ($sifre !== '' && mb_strlen($sifre) < 10) hata('Şifre en az 10 karakter olmalı');
        $aktif = ($g['aktif'] ?? true) ? 1 : 0;
        if ($id === (int)$ben['id'] && (!$aktif || $rol !== 'yonetici')) hata('Kendi hesabınızı pasif yapamaz ya da yetkisini düşüremezsiniz');
        yazmadan_once();
        try {
            if ($id) {
                $db->prepare('UPDATE kullanicilar SET eposta = ?, ad = ?, firma = ?, telefon = ?, rol = ?, aktif = ? WHERE id = ?')
                    ->execute([$eposta, metin($g, 'ad', 160), metin($g, 'firma', 160), metin($g, 'telefon', 60), $rol, $aktif, $id]);
                if ($sifre !== '') $db->prepare('UPDATE kullanicilar SET sifre = ? WHERE id = ?')->execute([password_hash($sifre, PASSWORD_DEFAULT), $id]);
            } else {
                if ($sifre === '') hata('Yeni hesap için şifre gerekli');
                $db->prepare('INSERT INTO kullanicilar (eposta, sifre, ad, firma, telefon, rol, aktif, olusturma) VALUES (?, ?, ?, ?, ?, ?, ?, ?)')
                    ->execute([$eposta, password_hash($sifre, PASSWORD_DEFAULT), metin($g, 'ad', 160), metin($g, 'firma', 160), metin($g, 'telefon', 60), $rol, $aktif, simdi()]);
                $id = son_eklenen_id($db);
            }
        } catch (PDOException $e) {
            if (str_contains($e->getMessage(), 'UNIQUE')) hata('Bu mail adresiyle kayıtlı bir hesap var');
            throw $e;
        }
        json_yanit(['id' => $id]);
    }

    case 'kullanici-sil': {
        $id = (int)($g['id'] ?? 0);
        if ($id === (int)$ben['id']) hata('Kendi hesabınızı silemezsiniz');
        $s = $db->prepare('SELECT * FROM kullanicilar WHERE id = ?');
        $s->execute([$id]);
        $hesap = $s->fetch();
        if (!$hesap) hata('Hesap bulunamadı', 404);
        // Müşteri silinince projeleri de veritabanından düşer; hepsi birlikte çöpe kopyalanır.
        $s = $db->prepare('SELECT id FROM musteri_projeleri WHERE musteri_id = ?');
        $s->execute([$id]);
        $projeler = array_map(fn($pid) => proje_paketi($db, (int)$pid), $s->fetchAll(PDO::FETCH_COLUMN));
        yazmadan_once();
        $db->beginTransaction();
        cope_at('kullanici', trim($hesap['ad'] . ' ' . $hesap['eposta']), ['kullanici' => $hesap, 'projeler' => $projeler], $ben['eposta']);
        $db->prepare('DELETE FROM kullanicilar WHERE id = ?')->execute([$id]);
        $db->commit();
        json_yanit(['tamam' => true]);
    }

    /* Müşteri projeleri */
    case 'projeler':
        json_yanit(array_map(fn($p) => json_alan($p, ['teknolojiler']), $db->query(
            "SELECT p.*, k.ad AS musteri_ad, k.firma AS musteri_firma,
                    (SELECT MAX(tarih) FROM proje_guncellemeleri g WHERE g.proje_id = p.id) AS son_guncelleme,
                    (SELECT COUNT(*) FROM proje_sorunlari s WHERE s.proje_id = p.id AND s.durum = 'acik') AS acik_sorun
             FROM musteri_projeleri p JOIN kullanicilar k ON k.id = p.musteri_id
             ORDER BY CASE p.durum WHEN 'devam' THEN 0 WHEN 'beklemede' THEN 1 ELSE 2 END, p.guncelleme DESC"
        )->fetchAll()));

    case 'proje':
        json_yanit(proje_getir($db, (int)($g['id'] ?? 0)));

    case 'proje-kaydet': {
        $p = $g['proje'] ?? [];
        if (!is_array($p)) hata('Proje eksik');
        $id = (int)($p['id'] ?? 0);
        $musteri = (int)($p['musteri_id'] ?? 0);
        $s = $db->prepare("SELECT 1 FROM kullanicilar WHERE id = ? AND rol = 'musteri'");
        $s->execute([$musteri]);
        if (!$s->fetchColumn()) hata('Önce projeye bir müşteri seçin');
        if (metin($p, 'ad') === '') hata('Proje adı zorunlu');
        $durum = in_array($p['durum'] ?? '', ['devam', 'beklemede', 'tamamlandi'], true) ? $p['durum'] : 'devam';
        $degerler = [
            $musteri, metin($p, 'ad', 200), metin($p, 'ozet', 4000), max(0, (int)($p['asama'] ?? 0)),
            max(0, min(100, (int)($p['ilerleme'] ?? 0))), metin($p, 'sorumlu', 160),
            json_encode(array_values(array_filter(array_map('strval', (array)($p['teknolojiler'] ?? [])))), JSON_UNESCAPED_UNICODE),
            metin($p, 'onizleme', 500), metin($p, 'canli', 500), metin($p, 'baslangic', 20), metin($p, 'teslim', 20),
            $durum, metin($p, 'notlar', 8000), simdi(),
        ];
        yazmadan_once();
        if ($id) {
            $db->prepare('UPDATE musteri_projeleri SET musteri_id = ?, ad = ?, ozet = ?, asama = ?, ilerleme = ?, sorumlu = ?, teknolojiler = ?, onizleme = ?, canli = ?, baslangic = ?, teslim = ?, durum = ?, notlar = ?, guncelleme = ? WHERE id = ?')
                ->execute([...$degerler, $id]);
        } else {
            $db->prepare('INSERT INTO musteri_projeleri (musteri_id, ad, ozet, asama, ilerleme, sorumlu, teknolojiler, onizleme, canli, baslangic, teslim, durum, notlar, guncelleme, olusturma) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)')
                ->execute([...$degerler, simdi()]);
            $id = son_eklenen_id($db);
        }
        json_yanit(proje_getir($db, $id));
    }

    case 'proje-sil': {
        $paket = proje_paketi($db, (int)($g['id'] ?? 0));
        if (!$paket) hata('Proje bulunamadı', 404);
        yazmadan_once();
        $db->beginTransaction();
        cope_at('proje', $paket['proje']['ad'], $paket, $ben['eposta']);
        $db->prepare('DELETE FROM musteri_projeleri WHERE id = ?')->execute([(int)$paket['proje']['id']]);
        $db->commit();
        json_yanit(['tamam' => true]);
    }

    case 'guncelleme-kaydet': {
        $x = $g['guncelleme'] ?? [];
        $projeId = (int)($x['proje_id'] ?? 0);
        proje_getir($db, $projeId);
        if (metin($x, 'baslik') === '') hata('Güncelleme başlığı zorunlu');
        $dosyalar = array_values(array_filter((array)($x['dosyalar'] ?? []), 'is_array'));
        $tarih = metin($x, 'tarih', 20) ?: gmdate('Y-m-d');
        $asama = isset($x['asama']) && $x['asama'] !== '' && $x['asama'] !== null ? (int)$x['asama'] : null;
        yazmadan_once();
        if (!empty($x['id'])) {
            $db->prepare('UPDATE proje_guncellemeleri SET tarih = ?, baslik = ?, aciklama = ?, asama = ?, dosyalar = ? WHERE id = ? AND proje_id = ?')
                ->execute([$tarih, metin($x, 'baslik', 300), metin($x, 'aciklama', 8000), $asama, json_encode($dosyalar, JSON_UNESCAPED_UNICODE), (int)$x['id'], $projeId]);
        } else {
            $db->prepare('INSERT INTO proje_guncellemeleri (proje_id, tarih, baslik, aciklama, asama, dosyalar, olusturma) VALUES (?, ?, ?, ?, ?, ?, ?)')
                ->execute([$projeId, $tarih, metin($x, 'baslik', 300), metin($x, 'aciklama', 8000), $asama, json_encode($dosyalar, JSON_UNESCAPED_UNICODE), simdi()]);
        }
        // Yüklenen özel dosyaları bu projeye bağla ki müşteri görebilsin.
        $bagla = $db->prepare('UPDATE dosyalar SET proje_id = ? WHERE id = ? AND ozel = 1');
        foreach ($dosyalar as $d) if (!empty($d['id'])) $bagla->execute([$projeId, (int)$d['id']]);
        $db->prepare('UPDATE musteri_projeleri SET guncelleme = ? WHERE id = ?')->execute([simdi(), $projeId]);
        json_yanit(proje_getir($db, $projeId));
    }

    case 'guncelleme-sil': {
        $s = $db->prepare('SELECT * FROM proje_guncellemeleri WHERE id = ?');
        $s->execute([(int)($g['id'] ?? 0)]);
        $satir = $s->fetch();
        if (!$satir) hata('Güncelleme bulunamadı', 404);
        yazmadan_once();
        $db->beginTransaction();
        cope_at('guncelleme', $satir['baslik'], $satir, $ben['eposta']);
        $db->prepare('DELETE FROM proje_guncellemeleri WHERE id = ?')->execute([(int)$satir['id']]);
        $db->commit();
        json_yanit(proje_getir($db, (int)$satir['proje_id']));
    }

    case 'sorun-kaydet': {
        $x = $g['sorun'] ?? [];
        $projeId = (int)($x['proje_id'] ?? 0);
        proje_getir($db, $projeId);
        if (metin($x, 'baslik') === '') hata('Başlık zorunlu');
        $tur = in_array($x['tur'] ?? '', ['sorun', 'risk', 'bekleyen'], true) ? $x['tur'] : 'sorun';
        $durum = ($x['durum'] ?? 'acik') === 'cozuldu' ? 'cozuldu' : 'acik';
        yazmadan_once();
        if (!empty($x['id'])) {
            $db->prepare('UPDATE proje_sorunlari SET tur = ?, baslik = ?, aciklama = ?, durum = ?, guncelleme = ? WHERE id = ? AND proje_id = ?')
                ->execute([$tur, metin($x, 'baslik', 300), metin($x, 'aciklama', 4000), $durum, simdi(), (int)$x['id'], $projeId]);
        } else {
            $db->prepare('INSERT INTO proje_sorunlari (proje_id, tur, baslik, aciklama, durum, olusturma, guncelleme) VALUES (?, ?, ?, ?, ?, ?, ?)')
                ->execute([$projeId, $tur, metin($x, 'baslik', 300), metin($x, 'aciklama', 4000), $durum, simdi(), simdi()]);
        }
        json_yanit(proje_getir($db, $projeId));
    }

    case 'sorun-sil': {
        $s = $db->prepare('SELECT * FROM proje_sorunlari WHERE id = ?');
        $s->execute([(int)($g['id'] ?? 0)]);
        $satir = $s->fetch();
        if (!$satir) hata('Kayıt bulunamadı', 404);
        yazmadan_once();
        $db->beginTransaction();
        cope_at('sorun', $satir['baslik'], $satir, $ben['eposta']);
        $db->prepare('DELETE FROM proje_sorunlari WHERE id = ?')->execute([(int)$satir['id']]);
        $db->commit();
        json_yanit(proje_getir($db, (int)$satir['proje_id']));
    }

    /* Medya */
    case 'medya': {
        $liste = $db->query('SELECT id, ad, yol, tur, boyut, genislik, yukseklik, olusturma FROM dosyalar WHERE ozel = 0 ORDER BY id DESC')->fetchAll();
        foreach ($liste as &$m) $m['adres'] = medya_adresi((string)$m['yol']);
        json_yanit($liste);
    }

    case 'dosya-sil': {
        $s = $db->prepare('SELECT * FROM dosyalar WHERE id = ?');
        $s->execute([(int)($g['id'] ?? 0)]);
        $d = $s->fetch();
        if (!$d) hata('Dosya bulunamadı', 404);
        yazmadan_once();
        $yol = $d['ozel'] ? KAM_OZEL . '/' . basename((string)$d['yol']) : KAM_MEDYA . '/' . $d['yol'];
        // Dosya önce yedek klasörüne taşınır, hemen silinmez.
        $cop = KAM_YEDEK . '/silinen';
        klasor_hazirla($cop);
        if (is_file($yol)) @rename($yol, $cop . '/' . gmdate('Ymd-His') . '-' . basename($yol));
        $db->prepare('DELETE FROM dosyalar WHERE id = ?')->execute([(int)$d['id']]);
        json_yanit(['tamam' => true]);
    }

    /* Çöp kutusu */
    case 'cop':
        json_yanit($db->query('SELECT id, tur, baslik, silen, silinme FROM cop ORDER BY id DESC LIMIT 500')->fetchAll());

    case 'cop-geri-al': {
        $s = $db->prepare('SELECT * FROM cop WHERE id = ?');
        $s->execute([(int)($g['id'] ?? 0)]);
        $kayit = $s->fetch();
        if (!$kayit) hata('Çöp kutusunda böyle bir kayıt yok', 404);
        $v = json_decode((string)$kayit['veri'], true) ?: [];
        yazmadan_once();
        $db->beginTransaction();
        switch ($kayit['tur']) {
            case 'oge': {
                $ad = koleksiyon_dogrula((string)$v['koleksiyon']);
                $oge = json_decode((string)$v['veri'], true) ?: [];
                $kimlik = (string)$v['kimlik'];
                $var = $db->prepare('SELECT 1 FROM ogeler WHERE koleksiyon = ? AND kimlik = ?');
                for ($i = 2, $temel = $kimlik; $var->execute([$ad, $kimlik]) && $var->fetchColumn(); $i++) $kimlik = $temel . '-' . $i;
                $oge['kimlik'] = $kimlik;
                if (!empty($oge['slug'])) {
                    $slugSql = oge_slug_sql($db);
                    $s = $db->prepare("SELECT 1 FROM ogeler WHERE koleksiyon = ? AND {$slugSql} = ?");
                    $s->execute([$ad, $oge['slug']]);
                    if ($s->fetchColumn()) {
                        // Aynı adreste yeni bir sayfa varsa geri gelen yayından alınır, adresi değiştirilir.
                        $oge['slug'] .= '-' . $i;
                        $oge['yayinda'] = false;
                    }
                }
                $db->prepare('INSERT INTO ogeler (koleksiyon, kimlik, sira, veri, guncelleme) VALUES (?, ?, ?, ?, ?)')
                    ->execute([$ad, $kimlik, (int)$v['sira'], json_encode($oge, JSON_UNESCAPED_UNICODE), damga()]);
                break;
            }
            case 'talep':
                satir_ekle($db, 'talepler', $v);
                break;
            case 'proje':
                proje_geri_yukle($db, $v);
                break;
            case 'kullanici': {
                $s = $db->prepare('SELECT 1 FROM kullanicilar WHERE lower(eposta) = lower(?)');
                $s->execute([$v['kullanici']['eposta']]);
                if ($s->fetchColumn()) hata('Bu mail adresiyle yeni bir hesap açılmış. Önce o hesabın adresini değiştirin.');
                $yeniId = satir_ekle($db, 'kullanicilar', $v['kullanici']);
                foreach ($v['projeler'] ?? [] as $paket) if ($paket) proje_geri_yukle($db, $paket, $yeniId);
                break;
            }
            case 'guncelleme':
            case 'sorun': {
                $s = $db->prepare('SELECT 1 FROM musteri_projeleri WHERE id = ?');
                $s->execute([(int)$v['proje_id']]);
                if (!$s->fetchColumn()) hata('Bağlı olduğu proje silinmiş. Önce projeyi geri alın.');
                satir_ekle($db, $kayit['tur'] === 'sorun' ? 'proje_sorunlari' : 'proje_guncellemeleri', $v);
                if ($kayit['tur'] === 'guncelleme') {
                    $bagla = $db->prepare('UPDATE dosyalar SET proje_id = ? WHERE id = ? AND ozel = 1');
                    foreach (json_decode((string)($v['dosyalar'] ?? '[]'), true) ?: [] as $d) if (!empty($d['id'])) $bagla->execute([(int)$v['proje_id'], (int)$d['id']]);
                }
                break;
            }
            default:
                hata('Bu kayıt türü geri alınamıyor');
        }
        $db->prepare('DELETE FROM cop WHERE id = ?')->execute([(int)$kayit['id']]);
        $db->commit();
        json_yanit(['tamam' => true]);
    }

    case 'cop-sil': {
        yazmadan_once();
        $db->prepare('DELETE FROM cop WHERE id = ?')->execute([(int)($g['id'] ?? 0)]);
        json_yanit(['tamam' => true]);
    }

    /* Yedekler */
    case 'yedekler': {
        $liste = [];
        foreach (glob(KAM_YEDEK . '/kam-*.json') ?: [] as $y) {
            $liste[] = ['ad' => basename($y), 'boyut' => filesize($y), 'tarih' => gmdate('c', filemtime($y))];
        }
        usort($liste, fn($a, $b) => strcmp($b['ad'], $a['ad']));
        json_yanit($liste);
    }

    case 'disa-aktar': {
        $tablolar = ['kullanicilar', 'musteri_projeleri', 'proje_guncellemeleri', 'proje_sorunlari', 'dosyalar', 'talepler', 'cop'];
        $veri = ['icerik' => icerik_topla($db, true), 'alinma' => simdi()];
        foreach ($tablolar as $t) $veri['tablolar'][$t] = $db->query("SELECT * FROM {$t}")->fetchAll();
        json_yanit($veri);
    }

    case 'ice-aktar': {
        // Yalnızca site içeriğini (ayarlar ve koleksiyonlar) geri yükler; kullanıcılar ve projeler korunur.
        $icerik = $g['veri']['icerik'] ?? $g['veri'] ?? null;
        if (!is_array($icerik) || !isset($icerik['ayarlar'])) hata('Dosyada site içeriği bulunamadı');
        yedek_al(KAM_YEDEK . '/kam-geriyukleme-oncesi-' . gmdate('Ymd-His') . '.json');
        $db->beginTransaction();
        $an = simdi();
        $db->prepare("INSERT INTO ayarlar (anahtar, veri, guncelleme) VALUES ('genel', ?, ?) ON CONFLICT(anahtar) DO UPDATE SET veri = excluded.veri, guncelleme = excluded.guncelleme")
            ->execute([json_encode($icerik['ayarlar'], JSON_UNESCAPED_UNICODE), $an]);
        $db->exec('DELETE FROM ogeler');
        $ekle = $db->prepare('INSERT INTO ogeler (koleksiyon, kimlik, sira, veri, guncelleme) VALUES (?, ?, ?, ?, ?)');
        foreach (KAM_KOLEKSIYONLAR as $ad) {
            foreach (($icerik[$ad] ?? []) as $sira => $oge) {
                if (!is_array($oge) || empty($oge['kimlik'])) continue;
                $ekle->execute([$ad, (string)$oge['kimlik'], $sira, json_encode($oge, JSON_UNESCAPED_UNICODE), $an]);
            }
        }
        $db->commit();
        json_yanit(['tamam' => true]);
    }
}

hata('Bilinmeyen işlem');
