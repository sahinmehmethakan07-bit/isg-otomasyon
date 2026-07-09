# Firebase Production Runbook

## Deploy Öncesi Kontrol

1. `npm ci`
2. `npx tsc --noEmit`
3. `npm run build`
4. Firebase rules deploy etmeden önce emülatör veya staging proje üzerinde test et.

## Zorunlu Ortam Değişkenleri

Vercel Project Settings > Environment Variables içine `.env.example` dosyasındaki değerleri gir.

- `NEXT_PUBLIC_FIREBASE_*`: Browser tarafı Firebase bağlantısı.
- `FIREBASE_ADMIN_*`: Sadece API route'larında kullanılan Admin SDK bilgileri.
- `RESEND_API_KEY`: DÖF e-posta gönderimi.

## Firestore ve Storage Rules Deploy

Rules emülatör testi için makinede Java Runtime gerekir:

```bash
npm run firebase:test:rules
```

Canlı kuralları deploy etmek için Firebase CLI login gerekir:

```bash
firebase deploy --only firestore:rules,firestore:indexes,storage --project isg-otomasyon
```

Rules deployundan sonra admin olmayan bir test kullanıcıyla şu akışları kontrol et:

- Sadece atanmış firmaları görebiliyor mu?
- Başka firma ID'siyle kayıt okuyamıyor mu?
- DÖF e-postası sadece yetkili firma için gönderilebiliyor mu?
- Kullanıcı ve hesap yönetimi sadece admin ile açılıyor mu?

## Backup Stratejisi

Günlük Firestore export için Google Cloud Scheduler veya elle çalıştırılan komut:

```bash
gcloud firestore export gs://YOUR_BACKUP_BUCKET/firestore/$(date +%Y-%m-%d) --project=isg-otomasyon
```

Öneri:

- Günlük yedek: 30 gün sakla.
- Haftalık yedek: 6 ay sakla.
- Büyük deploy öncesi manuel yedek al.

## Geri Dönüş

1. Hatalı Vercel deploy için önce Vercel dashboard üzerinden önceki başarılı deployment'a rollback yap.
2. Veri bozulduysa en son sağlam Firestore export'u ayrı staging projeye import ederek doğrula.
3. Doğrulanan export'u production'a geri yükle.

## İzleme

- Vercel Runtime Logs: API hataları ve 500 cevapları.
- Firebase Usage dashboard: ani read/write artışı.
- Resend dashboard: DÖF e-posta hata oranı.
