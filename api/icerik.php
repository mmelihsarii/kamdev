<?php
/* Herkese açık içerik: yalnızca yayındaki öğeler. Site her açılışta buradan günceli çeker. */
require __DIR__ . '/_cekirdek.php';

if ($_SERVER['REQUEST_METHOD'] !== 'GET') hata('Yalnızca okuma yapılabilir', 405);
json_yanit(icerik_topla(db(), false));
