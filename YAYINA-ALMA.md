# KAM yayına alma

## Gerekenler

- PHP 8.1 veya üstü. PDO PostgreSQL (`pdo_pgsql`), GD (WebP destekli), fileinfo ve zip eklentileri açık olmalı.
- Apache ya da LiteSpeed. `.htaccess` dosyasındaki yönlendirmeler çalışmalı.
- Supabase projesi ve PostgreSQL bağlantı adresi.

## Adımlar

1. Supabase SQL Editor'da `supabase/schema.sql` dosyasının tamamını bir kez çalıştırın.
2. Supabase projesinden PostgreSQL connection string alın. Sunucuda `SUPABASE_DB_URL` ortam değişkenine parola içeren bağlantı adresini kaydedin. Havuzlayıcı kullanıyorsanız Supabase'in transaction/session pooler adresini ve gösterdiği kullanıcı adını aynen kullanın. Bu değeri kaynak koda veya herkese açık `.env` dosyasına koymayın.
3. Eski SQLite kurulumundaki hesapları, projeleri ve talepleri de koruyacaksanız uygulamayı ilk kez açmadan önce kaynak `kam.sqlite` dosyasını güvenli bir makinede tutun ve `php scripts/supabase-aktar.php /guvenli/yol/kam.sqlite` komutunu çalıştırın. Aktarım hedef tablolar boş değilse veri ezilmemesi için durur. Kaynakta veritabanı yoksa bu adımı atlayın; site içeriği ilk istekte `src/veri/icerik.json` dosyasından yüklenir.
4. Sunucuda PHP `pdo_pgsql` eklentisinin açık olduğunu doğrulayın.
5. `npm run build` komutunu çalıştırın. Her şey `dist/` klasörüne çıkar.
6. `dist/` klasörünün **içindekileri** `public_html/` klasörüne yükleyin. Gizli dosya olan `.htaccess` dosyası da yüklenmeli.
7. `https://alanadiniz/yonetim/` adresini açın. İlk açılışta yönetici hesabı oluşturma ekranı gelir. Bu ekran yalnızca bir kez çıkar.
8. Panelden **Site ayarları > Site bilgileri** bölümüne girin. Site adresini ve mail adresini kontrol edin.

## Veriler nerede durur

- Uygulama tabloları Supabase PostgreSQL'de tutulur. Görseller, müşteri dosyaları ve günlük JSON yedekleri `public_html` klasörünün dışındaki `kam-veri/` klasöründe tutulur.
- `SUPABASE_DB_URL` sunucu ortam değişkeni olarak ayarlandığında PHP Supabase PostgreSQL'e bağlanır. Yerel geliştirmede bu değişken yoksa SQLite kullanılır.
- Anon key bu PHP oturumlu backend'de kullanılmaz. Veritabanı parolası yalnızca sunucuda tutulmalıdır.

## Güncelleme

Kodu güncellemek için yalnızca yeni `dist/` klasörünü tekrar yükleyin. Veritabanı yeniden kurulmaz. Panelde yapılan değişiklikler korunur.

`src/veri/icerik.json` dosyası yalnızca **boş bir veritabanı** ilk kez kurulurken kullanılır. Kurulumdan sonra bütün içerik panelden yönetilir.

## Yedek

- Her gün yapılan ilk değişiklikte veritabanı tablolarının JSON kopyası otomatik alınır. Son 30 gün saklanır.
- Panelde **Yedekler ve çöp kutusu > Tam yedeği indir** düğmesi veritabanı kopyasını, görselleri ve müşteri dosyalarını tek zip dosyası olarak indirir. Supabase'in kendi yedekleme ayarlarını da etkin tutun.
- Panelde silinen her kayıt önce çöp kutusuna gider ve oradan geri alınabilir.

## Arama motorları

- `sitemap.xml`, `llms.txt`, blog yazıları, hizmet sayfaları ve iş sayfaları veritabanından canlı olarak üretilir.
- Panelden eklenen yeni bir yazı, yeniden derleme beklemeden doğru başlık ve açıklamayla yayına girer.
- Yayından kaldırılan bir sayfa 404 döner.
