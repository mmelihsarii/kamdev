<?php
/*
 * Yalnızca geliştirme için PHP yerleşik sunucu yönlendiricisi:
 *   php -S 127.0.0.1:8091 -t . api/_yerel_sunucu.php
 * Yerleşik sunucu .htaccess okumadığı için veri klasörünü ve çekirdek dosyaları burada kapatır.
 */
$yol = parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH) ?: '/';
if (preg_match('~^/api/(veri(/|$)|_)~', $yol)) {
    http_response_code(403);
    exit;
}
return false;
