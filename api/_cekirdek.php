<?php
/*
 * KAM arka ucu: ortak çekirdek.
 *
 * Veri klasörü (veritabanı, yüklenen görseller, müşteri dosyaları, yedekler)
 * yayında web kökünün DIŞINDA durur: public_html yeniden yüklense bile hiçbir
 * şey silinmez ve dışarıdan erişilemez. Geliştirmede proje içindeki api/veri
 * kullanılır. KAM_VERI ortam değişkeniyle elle de belirlenebilir.
 */
declare(strict_types=1);

const KAM_KOLEKSIYONLAR = ['projeler', 'hizmetler', 'yazilar', 'sss', 'surec', 'ilkeler', 'teknolojiler'];

define('KAM_KOK', dirname(__DIR__));

function kam_veri_klasoru(): string
{
    $ortam = getenv('KAM_VERI');
    if ($ortam) return rtrim($ortam, '/');
    $gelistirme = file_exists(KAM_KOK . '/package.json');
    $ust = dirname(KAM_KOK);
    if (!$gelistirme && is_dir($ust) && is_writable($ust)) return $ust . '/kam-veri';
    return __DIR__ . '/veri';
}

define('KAM_VERI', kam_veri_klasoru());
define('KAM_DB', KAM_VERI . '/kam.sqlite'); // Yalnızca yerel geliştirme için.
define('KAM_MEDYA', KAM_VERI . '/medya');
define('KAM_OZEL', KAM_VERI . '/ozel');
define('KAM_YEDEK', KAM_VERI . '/yedekler');

/* ---------------- Yanıt yardımcıları ---------------- */

/** PDO PostgreSQL büyük tamsayıları metin verebilir; API'nin sayısal alanlarını uyumlu tut. */
function api_sayilarini_duzelt(mixed $veri): mixed
{
    if (!is_array($veri)) return $veri;
    $sayisalAlanlar = ['id', 'musteri_id', 'proje_id', 'boyut', 'genislik', 'yukseklik', 'aktif', 'ozel', 'asama', 'ilerleme', 'sira', 'zaman'];
    foreach ($veri as $anahtar => $deger) {
        if (is_array($deger)) {
            $veri[$anahtar] = api_sayilarini_duzelt($deger);
        } elseif (in_array((string)$anahtar, $sayisalAlanlar, true) && is_string($deger) && preg_match('/^-?\d+$/', $deger)) {
            $veri[$anahtar] = (int)$deger;
        }
    }
    return $veri;
}

function json_yanit(mixed $veri, int $kod = 200): never
{
    http_response_code($kod);
    header('Content-Type: application/json; charset=utf-8');
    header('Cache-Control: no-store');
    echo json_encode(api_sayilarini_duzelt($veri), JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
    exit;
}

function hata(string $mesaj, int $kod = 400): never
{
    json_yanit(['hata' => $mesaj], $kod);
}

/** JSON gövdeyi okur. Çok büyük gövdeler reddedilir. */
function govde(int $sinir = 8_000_000): array
{
    $ham = file_get_contents('php://input', false, null, 0, $sinir + 1);
    if ($ham === false || strlen($ham) > $sinir) hata('İstek çok büyük', 413);
    if ($ham === '') return [];
    $veri = json_decode($ham, true);
    if (!is_array($veri)) hata('Geçersiz istek');
    return $veri;
}

/** Siteler arası istek sahteciliğine karşı: POST istekleri özel başlık taşımalı. */
function csrf_kontrol(): void
{
    if ($_SERVER['REQUEST_METHOD'] === 'POST' && ($_SERVER['HTTP_X_KAM'] ?? '') !== '1') {
        hata('Geçersiz istek kaynağı', 403);
    }
}

function simdi(): string
{
    return gmdate('c');
}

function istemci_ip(): string
{
    return substr((string)($_SERVER['REMOTE_ADDR'] ?? ''), 0, 64);
}

/* ---------------- Veritabanı ---------------- */

function klasor_hazirla(string $yol): void
{
    if (!is_dir($yol) && !mkdir($yol, 0775, true) && !is_dir($yol)) {
        hata('Veri klasörü oluşturulamadı: ' . basename($yol), 500);
    }
}

function db(): PDO
{
    static $pdo = null;
    if ($pdo) return $pdo;

    foreach ([KAM_VERI, KAM_MEDYA, KAM_OZEL, KAM_YEDEK] as $k) klasor_hazirla($k);
    // Apache kullanan sunucularda veri klasörü web kökünde kalırsa dışarıya kapalı olsun.
    if (!file_exists(KAM_VERI . '/.htaccess')) @file_put_contents(KAM_VERI . '/.htaccess', "Require all denied\nDeny from all\n");

    $supabaseDbUrl = getenv('SUPABASE_DB_URL');
    if ($supabaseDbUrl) {
        $parca = parse_url($supabaseDbUrl);
        if (!$parca || empty($parca['host']) || empty($parca['user']) || !array_key_exists('pass', $parca)) {
            hata('SUPABASE_DB_URL geçerli bir PostgreSQL bağlantı adresi değil', 500);
        }
        parse_str($parca['query'] ?? '', $sorgu);
        $sslmode = $sorgu['sslmode'] ?? 'require';
        $dbAdi = ltrim($parca['path'] ?? '/postgres', '/');
        $dsn = 'pgsql:host=' . $parca['host'] . ';port=' . ($parca['port'] ?? 5432)
            . ';dbname=' . ($dbAdi ?: 'postgres') . ';sslmode=' . $sslmode;
        $pdo = new PDO($dsn, rawurldecode($parca['user']), rawurldecode($parca['pass']), [
            PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
            PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
            // Supabase transaction pooler bağlantılarında sunucu tarafı prepared statement kullanma.
            PDO::ATTR_EMULATE_PREPARES => true,
        ]);
    } else {
        // SUPABASE_DB_URL tanımlı değilse yerel geliştirme SQLite'ını kullan.
        $pdo = new PDO('sqlite:' . KAM_DB, null, null, [
        PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
        PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
        ]);
        $pdo->exec('PRAGMA journal_mode = WAL; PRAGMA foreign_keys = ON; PRAGMA busy_timeout = 5000;');
        sema($pdo);
    }
    tohumla($pdo);
    return $pdo;
}

/** PostgreSQL'de son eklenen satırın kimliğini, SQLite'ta PDO'nun kimliğini döndürür. */
function son_eklenen_id(PDO $db): int
{
    return $db->getAttribute(PDO::ATTR_DRIVER_NAME) === 'pgsql'
        ? (int)$db->query('SELECT LASTVAL()')->fetchColumn()
        : (int)$db->lastInsertId();
}

function sema(PDO $db): void
{
    $db->exec(<<<SQL
        CREATE TABLE IF NOT EXISTS ayarlar (
          anahtar TEXT PRIMARY KEY,
          veri TEXT NOT NULL,
          guncelleme TEXT
        );
        CREATE TABLE IF NOT EXISTS ogeler (
          koleksiyon TEXT NOT NULL,
          kimlik TEXT NOT NULL,
          sira INTEGER NOT NULL DEFAULT 0,
          veri TEXT NOT NULL,
          guncelleme TEXT,
          PRIMARY KEY (koleksiyon, kimlik)
        );
        CREATE TABLE IF NOT EXISTS kullanicilar (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          eposta TEXT NOT NULL UNIQUE COLLATE NOCASE,
          sifre TEXT NOT NULL,
          ad TEXT NOT NULL DEFAULT '',
          firma TEXT NOT NULL DEFAULT '',
          telefon TEXT NOT NULL DEFAULT '',
          rol TEXT NOT NULL CHECK (rol IN ('yonetici', 'musteri')),
          aktif INTEGER NOT NULL DEFAULT 1,
          olusturma TEXT,
          son_giris TEXT
        );
        CREATE TABLE IF NOT EXISTS musteri_projeleri (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          musteri_id INTEGER NOT NULL REFERENCES kullanicilar(id) ON DELETE CASCADE,
          ad TEXT NOT NULL,
          ozet TEXT NOT NULL DEFAULT '',
          asama INTEGER NOT NULL DEFAULT 0,
          ilerleme INTEGER NOT NULL DEFAULT 0,
          sorumlu TEXT NOT NULL DEFAULT '',
          teknolojiler TEXT NOT NULL DEFAULT '[]',
          onizleme TEXT NOT NULL DEFAULT '',
          canli TEXT NOT NULL DEFAULT '',
          baslangic TEXT NOT NULL DEFAULT '',
          teslim TEXT NOT NULL DEFAULT '',
          durum TEXT NOT NULL DEFAULT 'devam',
          notlar TEXT NOT NULL DEFAULT '',
          olusturma TEXT,
          guncelleme TEXT
        );
        CREATE TABLE IF NOT EXISTS proje_guncellemeleri (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          proje_id INTEGER NOT NULL REFERENCES musteri_projeleri(id) ON DELETE CASCADE,
          tarih TEXT NOT NULL,
          baslik TEXT NOT NULL,
          aciklama TEXT NOT NULL DEFAULT '',
          asama INTEGER,
          dosyalar TEXT NOT NULL DEFAULT '[]',
          olusturma TEXT
        );
        CREATE TABLE IF NOT EXISTS proje_sorunlari (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          proje_id INTEGER NOT NULL REFERENCES musteri_projeleri(id) ON DELETE CASCADE,
          tur TEXT NOT NULL DEFAULT 'sorun' CHECK (tur IN ('sorun', 'risk', 'bekleyen')),
          baslik TEXT NOT NULL,
          aciklama TEXT NOT NULL DEFAULT '',
          durum TEXT NOT NULL DEFAULT 'acik' CHECK (durum IN ('acik', 'cozuldu')),
          olusturma TEXT,
          guncelleme TEXT
        );
        CREATE TABLE IF NOT EXISTS dosyalar (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          ad TEXT NOT NULL,
          yol TEXT NOT NULL,
          tur TEXT NOT NULL,
          boyut INTEGER NOT NULL DEFAULT 0,
          genislik INTEGER,
          yukseklik INTEGER,
          ozel INTEGER NOT NULL DEFAULT 0,
          proje_id INTEGER REFERENCES musteri_projeleri(id) ON DELETE SET NULL,
          olusturma TEXT
        );
        CREATE TABLE IF NOT EXISTS talepler (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          konu TEXT NOT NULL DEFAULT '',
          ad TEXT NOT NULL DEFAULT '',
          firma TEXT NOT NULL DEFAULT '',
          iletisim TEXT NOT NULL DEFAULT '',
          mesaj TEXT NOT NULL DEFAULT '',
          ip TEXT NOT NULL DEFAULT '',
          durum TEXT NOT NULL DEFAULT 'yeni',
          olusturma TEXT
        );
        CREATE TABLE IF NOT EXISTS deneme_kayitlari (
          tur TEXT NOT NULL,
          ip TEXT NOT NULL,
          zaman INTEGER NOT NULL
        );
        CREATE INDEX IF NOT EXISTS deneme_idx ON deneme_kayitlari (tur, ip, zaman);
        CREATE TABLE IF NOT EXISTS cop (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          tur TEXT NOT NULL,
          baslik TEXT NOT NULL DEFAULT '',
          veri TEXT NOT NULL,
          silen TEXT NOT NULL DEFAULT '',
          silinme TEXT
        );
    SQL);
}

/** Veritabanı boşsa sitenin derleme anındaki içeriğini (tohum.json) yükler. Dolu veritabanına asla dokunmaz. */
function tohumla(PDO $db): void
{
    if (getenv('KAM_TOHUM_YOK') === '1') return;
    $dolu = (int)$db->query('SELECT (SELECT COUNT(*) FROM ayarlar) + (SELECT COUNT(*) FROM ogeler)')->fetchColumn();
    if ($dolu > 0) return;

    $dosya = __DIR__ . '/tohum.json';
    if (!is_file($dosya)) $dosya = KAM_KOK . '/src/veri/icerik.json';
    if (!is_file($dosya)) return;

    $tohum = json_decode((string)file_get_contents($dosya), true);
    if (!is_array($tohum)) return;

    $db->beginTransaction();
    $an = simdi();
    $db->prepare('INSERT INTO ayarlar (anahtar, veri, guncelleme) VALUES (?, ?, ?)')
        ->execute(['genel', json_encode($tohum['ayarlar'] ?? [], JSON_UNESCAPED_UNICODE), $an]);
    $ekle = $db->prepare('INSERT INTO ogeler (koleksiyon, kimlik, sira, veri, guncelleme) VALUES (?, ?, ?, ?, ?)');
    foreach (KAM_KOLEKSIYONLAR as $ad) {
        foreach (($tohum[$ad] ?? []) as $sira => $oge) {
            $ekle->execute([$ad, (string)$oge['kimlik'], $sira, json_encode($oge, JSON_UNESCAPED_UNICODE), $an]);
        }
    }
    $db->commit();
}

/** Bütün içerik; $hepsi false ise yalnızca yayındaki öğeler. Biçimi src/veri/icerik.json ile aynıdır. */
function icerik_topla(PDO $db, bool $hepsi): array
{
    $ayar = $db->query("SELECT veri FROM ayarlar WHERE anahtar = 'genel'")->fetchColumn();
    $sonuc = ['surum' => 1, 'ayarlar' => $ayar ? json_decode((string)$ayar, true) : new stdClass()];
    $sorgu = $db->prepare('SELECT veri FROM ogeler WHERE koleksiyon = ? ORDER BY sira, kimlik');
    foreach (KAM_KOLEKSIYONLAR as $ad) {
        $sorgu->execute([$ad]);
        $liste = [];
        foreach ($sorgu->fetchAll(PDO::FETCH_COLUMN) as $satir) {
            $oge = json_decode((string)$satir, true);
            if (!is_array($oge)) continue;
            if (!$hepsi && ($oge['yayinda'] ?? true) === false) continue;
            $liste[] = $oge;
        }
        $sonuc[$ad] = $liste;
    }
    return $sonuc;
}

/* ---------------- Oturum ve yetki ---------------- */

function oturum_baslat(): void
{
    if (session_status() === PHP_SESSION_ACTIVE) return;
    $guvenli = (!empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off') || (($_SERVER['HTTP_X_FORWARDED_PROTO'] ?? '') === 'https');
    session_name('kam_oturum');
    session_set_cookie_params([
        'lifetime' => 60 * 60 * 24 * 14,
        'path' => '/',
        'secure' => $guvenli,
        'httponly' => true,
        'samesite' => 'Lax',
    ]);
    ini_set('session.use_strict_mode', '1');
    ini_set('session.gc_maxlifetime', (string)(60 * 60 * 24 * 14));
    $oturumKlasoru = KAM_VERI . '/oturumlar';
    klasor_hazirla($oturumKlasoru);
    session_save_path($oturumKlasoru);
    session_start();
}

function kullanici(): ?array
{
    oturum_baslat();
    $id = $_SESSION['kullanici_id'] ?? null;
    if (!$id) return null;
    $sorgu = db()->prepare('SELECT id, eposta, ad, firma, telefon, rol FROM kullanicilar WHERE id = ? AND aktif = 1');
    $sorgu->execute([$id]);
    $k = $sorgu->fetch();
    return $k ?: null;
}

function yonetici_sart(): array
{
    $k = kullanici();
    if (!$k) hata('Giriş yapmanız gerekiyor', 401);
    if ($k['rol'] !== 'yonetici') hata('Bu işlem için yetkiniz yok', 403);
    return $k;
}

function musteri_sart(): array
{
    $k = kullanici();
    if (!$k) hata('Giriş yapmanız gerekiyor', 401);
    return $k;
}

/** Aynı IP'den belirli sürede çok fazla deneme yapılmasını engeller. */
function deneme_siniri(string $tur, int $sinir, int $saniye): void
{
    $db = db();
    $esik = time() - $saniye;
    $db->prepare('DELETE FROM deneme_kayitlari WHERE zaman < ?')->execute([time() - 86400]);
    $sorgu = $db->prepare('SELECT COUNT(*) FROM deneme_kayitlari WHERE tur = ? AND ip = ? AND zaman > ?');
    $sorgu->execute([$tur, istemci_ip(), $esik]);
    if ((int)$sorgu->fetchColumn() >= $sinir) hata('Çok fazla deneme yapıldı. Lütfen biraz sonra tekrar deneyin.', 429);
}

function deneme_kaydet(string $tur): void
{
    db()->prepare('INSERT INTO deneme_kayitlari (tur, ip, zaman) VALUES (?, ?, ?)')->execute([$tur, istemci_ip(), time()]);
}

/* ---------------- Yedek ---------------- */

/** Günde bir kez veritabanı tablolarının JSON kopyasını alır; son 30 kopya saklanır. */
function gunluk_yedek(): void
{
    $hedef = KAM_YEDEK . '/kam-' . gmdate('Ymd') . '.json';
    if (is_file($hedef)) return;
    yedek_al($hedef);
    // Yalnızca tarihli günlük kopyalar döner; geri yükleme öncesi kopyalar elle silinene kadar kalır.
    $kopyalar = glob(KAM_YEDEK . '/kam-[0-9]*.json') ?: [];
    sort($kopyalar);
    while (count($kopyalar) > 30) @unlink(array_shift($kopyalar));
}

function yedek_al(string $hedef): void
{
    if (is_file($hedef)) @unlink($hedef);
    $tablolar = ['ayarlar', 'ogeler', 'kullanicilar', 'musteri_projeleri', 'proje_guncellemeleri', 'proje_sorunlari', 'dosyalar', 'talepler', 'deneme_kayitlari', 'cop'];
    $veri = ['surum' => 1, 'alinma' => simdi(), 'tablolar' => []];
    foreach ($tablolar as $tablo) $veri['tablolar'][$tablo] = db()->query("SELECT * FROM {$tablo}")->fetchAll();
    $json = json_encode($veri, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
    if ($json === false || file_put_contents($hedef, $json, LOCK_EX) === false) {
        throw new RuntimeException('Veritabanı yedeği yazılamadı');
    }
}

/** Her yazma işleminden önce çağrılır: önce günlük yedek, sonra değişiklik. */
function yazmadan_once(): void
{
    try {
        gunluk_yedek();
    } catch (Throwable) {
        // Yedek alınamaması işlemi durdurmasın; panelde yedek listesi boş görünür.
    }
}

/**
 * Silinen her kayıt önce çöp kutusuna kopyalanır; panelden tek tıkla geri alınabilir.
 * Kayıt, bağlı alt kayıtlarıyla birlikte tek parça saklanır.
 */
function cope_at(string $tur, string $baslik, array $veri, string $silen = ''): void
{
    db()->prepare('INSERT INTO cop (tur, baslik, veri, silen, silinme) VALUES (?, ?, ?, ?, ?)')
        ->execute([$tur, mb_substr($baslik, 0, 300), json_encode($veri, JSON_UNESCAPED_UNICODE), $silen, simdi()]);
}

/* ---------------- Medya adresi ---------------- */

function medya_adresi(string $goreceli): string
{
    return '/api/medya.php?d=' . rawurlencode($goreceli);
}
