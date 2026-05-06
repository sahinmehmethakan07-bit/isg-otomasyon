# Rol Tabanlı Giriş Sistemi — Entegrasyon Rehberi

## Mimari

```
Login Sayfası
    ↓
Kullanıcı rol kartı seçer (Doktor / Hemşire / Admin)
    ↓
Email + şifre girer → Firebase Auth doğrular
    ↓
Firestore "users" collection'ından profil çekilir
    ↓
Profildeki rol ≠ seçilen rol → HATA ("Bu hesap Doktor olarak kayıtlı")
Profildeki rol = seçilen rol → Session oluşturulur → Dashboard açılır
    ↓
Dashboard'da:
  - Admin: TÜM verileri görür + "Kullanıcılar" sekmesi var
  - Doktor: sadece createdBy == kendi UID olan verileri görür
  - Hemşire: sadece createdBy == kendi UID olan verileri görür
```

## Yeni Dosyalar

| Dosya | Konum | Açıklama |
|-------|-------|----------|
| `roleManager.ts` | `app/lib/` | Rol yönetimi, profil CRUD, veri filtreleme |
| `useUserRole.ts` | `app/lib/` | React hook — kullanıcı rolüne erişim |
| `AdminUserPanel.tsx` | `app/lib/` | Admin kullanıcı yönetim paneli bileşeni |
| `login/page.tsx` | `app/login/` | Yeni rol tabanlı login sayfası |

## Firestore Yapısı

### Yeni "users" collection

```
users/{uid}
├── email: "doktor@firma.com"
├── displayName: "Dr. Ahmet Yılmaz"
├── role: "doctor" | "nurse" | "admin"
└── createdAt: timestamp
```

### Mevcut collection'lara eklenen alan

Her kayda `createdBy` ve `createdAt` alanları eklenir:

```
companies/{id}
├── ...mevcut alanlar...
├── createdBy: "kullanıcının_uid'si"    ← YENİ
└── createdAt: timestamp                 ← YENİ
```

Bu alan sayesinde Doktor/Hemşire sadece kendi verilerini görür.

---

## Adım Adım Entegrasyon

### 1. Dosyaları kopyala

```bash
cp ~/Downloads/roleManager.ts app/lib/
cp ~/Downloads/useUserRole.ts app/lib/
cp ~/Downloads/AdminUserPanel.tsx app/lib/
cp ~/Downloads/page.tsx app/login/   # Login sayfasını değiştirir
```

### 2. İlk admin kullanıcısını oluştur

Firebase Console → Firestore → Data → "+ Sammlung erstellen" ile `users` collection'ı oluştur.

Document ID = Firebase Auth'daki mevcut kullanıcının UID'si
(Authentication sekmesinden kopyala)

Alanlar:
- email (string): "senin@email.com"
- displayName (string): "Admin"
- role (string): "admin"
- createdAt (timestamp): şu anki tarih

### 3. page.tsx'e rol entegrasyonu

page.tsx'in başına import ekle:

```tsx
import { useUserRole } from "./lib/useUserRole";
import { getUserProfile, UserProfile, getRoleFilteredQuery, withCreatedBy } from "./lib/roleManager";
import { AdminUserPanel } from "./lib/AdminUserPanel";
import { getDocs } from "firebase/firestore"; // zaten var
```

Page() fonksiyonuna state ekle:

```tsx
const { user: userProfile, isAdmin } = useUserRole();
```

### 4. loadAll() fonksiyonunu güncelle (veri filtreleme)

```tsx
async function loadAll() {
  if (!userProfile) return; // profil yüklenene kadar bekle

  setLoading(true);
  try {
    // Admin tüm verileri görür, diğerleri sadece kendi verilerini
    const [compSnap, empSnap, docSnap, obsSnap, dofSnap, riskSnap, signerSnap] = await Promise.all([
      getDocs(getRoleFilteredQuery("companies", userProfile)),
      getDocs(getRoleFilteredQuery("employees", userProfile)),
      getDocs(getRoleFilteredQuery("documents", userProfile)),
      getDocs(getRoleFilteredQuery("observers", userProfile)),
      getDocs(getRoleFilteredQuery("dofs", userProfile)),
      getDocs(getRoleFilteredQuery("risks", userProfile)),
      getDocs(getRoleFilteredQuery("signers", userProfile)),
    ]);
    // ... geri kalanı aynı
  }
}
```

### 5. Veri ekleme fonksiyonlarına createdBy ekle

Her addDoc çağrısından önce data'ya createdBy ekle:

```tsx
// ESKİ:
const ref = await addDoc(collection(db, "companies"), data);

// YENİ:
const ref = await addDoc(collection(db, "companies"), withCreatedBy(data, userProfile!.uid));
```

Bu değişiklik şu fonksiyonlarda yapılmalı:
- Firma ekleme
- Personel ekleme
- Belge ekleme
- Gözlemci ekleme
- DÖF ekleme
- Risk ekleme
- İmzacı ekleme

### 6. Tabs dizisine Admin sekmesi ekle

```tsx
const tabs = [
  { id: "ozet", label: "📊 Özet" },
  { id: "firmalar", label: "🏢 Firmalar" },
  // ... mevcut sekmeler ...
  ...(isAdmin ? [{ id: "kullanicilar", label: "👥 Kullanıcılar" }] : []),
];
```

### 7. Admin panelini render et

Main içine, mevcut sekmelerin sonuna:

```tsx
{activeTab === "kullanicilar" && isAdmin && (
  <AdminUserPanel styles={styles} />
)}
```

### 8. Header'da rol göstergesi ekle

```tsx
<div style={{ display: "flex", alignItems: "center", gap: 8 }}>
  {userProfile && (
    <span style={{
      fontSize: 11,
      padding: "3px 8px",
      borderRadius: 4,
      backgroundColor: ROLE_CONFIG[userProfile.role]?.color + "22",
      color: ROLE_CONFIG[userProfile.role]?.color,
      border: `1px solid ${ROLE_CONFIG[userProfile.role]?.color}44`,
    }}>
      {ROLE_CONFIG[userProfile.role]?.icon} {ROLE_CONFIG[userProfile.role]?.label}
    </span>
  )}
  {/* mevcut butonlar */}
</div>
```

---

## Firestore Güvenlik Kuralları

Mevcut wildcard kuralınız zaten çalışır, ama ileride sıkılaştırmak isterseniz:

```
match /users/{userId} {
  // Herkes kendi profilini okuyabilir
  allow read: if request.auth != null && request.auth.uid == userId;
  // Sadece admin yazabilir (veya kendi profilini okuyabilir)
  allow write: if request.auth != null;
}
```

---

## Önemli Notlar

1. **Mevcut veriler createdBy içermez** — Admin olarak giriş yapıp mevcut verileri görebilirsin, ama Doktor/Hemşire eski verileri göremez (createdBy alanı yok). İsterseniz Firestore'daki mevcut kayıtlara toplu createdBy eklemek için bir migration script yazılabilir.

2. **Client-side kullanıcı oluşturma sorunu** — createUserWithEmailAndPassword mevcut oturumu değiştirir. Production'da Firebase Cloud Functions kullanın.

3. **Firestore index gerekebilir** — `where("createdBy", "==", uid)` query'si için Firestore otomatik index oluşturur, ama ilk seferde console'da hata verirse, hata mesajındaki linke tıklayıp index oluşturun.
