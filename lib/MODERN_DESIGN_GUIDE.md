# İSG Otomasyon - Modern Tasarım Güncelleme

## 📦 Kurulum Adımları

### 1. Bağımlılıkları Kur

```bash
npm install framer-motion
# veya
yarn add framer-motion
```

### 2. Dosyaları Kopyala

Şu dosyaları projenize kopyalayın:

```
src/
├── styles/
│   └── globals.css (YENİ: globals-modern.css ile değiştir)
├── components/
│   ├── ModernHeader.tsx (YENİ)
│   ├── ModernCard.tsx (YENİ)
│   ├── ModernTabs.tsx (YENİ)
│   ├── ModernButton.tsx (YENİ)
│   ├── ModernInput.tsx (YENİ)
│   └── ... diğer mevcut bileşenler
└── app/
    ├── layout.tsx (GÜNCELLENMİŞ)
    └── dashboard/
        └── page.tsx (GÜNCELLENMİŞ)
```

### 3. globals.css Güncellemesi

Mevcut `globals.css` dosyanızı `globals-modern.css` ile değiştirin veya içeriğini birleştirin.

### 4. Layout.tsx Güncellemesi

```tsx
import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

// ... imports ...

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="tr" suppressHydrationWarning>
      <head>
        <meta name="color-scheme" content="light dark" />
      </head>
      <body className="min-h-full flex flex-col bg-isg-bg text-isg-text">
        {children}
      </body>
    </html>
  );
}
```

### 5. package.json İçinde

```json
{
  "dependencies": {
    "next": "^16.0.0",
    "react": "^19.0.0",
    "react-dom": "^19.0.0",
    "tailwindcss": "^4.0.0",
    "framer-motion": "^11.0.0",
    "firebase": "^10.0.0"
  }
}
```

## 🎨 Kullanım Örnekleri

### ModernHeader

```tsx
import { ModernHeader } from '@/components/ModernHeader';

export function Dashboard() {
  return (
    <>
      <ModernHeader
        title="Dashboard"
        subtitle="İSG Yönetim Sistemi"
        userName="Ahmet Yılmaz"
        userRole="İş Güvenliği Uzmanı"
        hasNotifications={true}
      />
      {/* ... content ... */}
    </>
  );
}
```

### ModernCard

```tsx
import { ModernCard } from '@/components/ModernCard';

export function StatsSection() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      <ModernCard
        title="Toplam Firmalar"
        icon="🏢"
        value={23}
        metric="aktif"
        gradient={true}
      />
      <ModernCard
        title="Personel"
        icon="👥"
        value={156}
        metric="çalışan"
        badge={{ text: "Yüksek", color: "success" }}
      />
      <ModernCard
        title="Açık DÖF'ler"
        icon="⚠️"
        value={8}
        metric="işlem beklemede"
        badge={{ text: "Acil", color: "danger" }}
      />
    </div>
  );
}
```

### ModernTabs

```tsx
import { ModernTabs } from '@/components/ModernTabs';

export function ModulesSection() {
  const tabs = [
    {
      id: 'companies',
      label: 'Firmalar',
      icon: '🏢',
      content: <CompaniesModule />,
    },
    {
      id: 'employees',
      label: 'Personel',
      icon: '👤',
      badge: 5,
      content: <EmployeesModule />,
    },
    {
      id: 'dofs',
      label: 'DÖF',
      icon: '⚠️',
      badge: 12,
      content: <DofsModule />,
    },
  ];

  return <ModernTabs tabs={tabs} defaultTabId="companies" />;
}
```

### ModernButton

```tsx
import { ModernButton } from '@/components/ModernButton';

export function ActionButtons() {
  return (
    <div className="flex gap-4">
      <ModernButton variant="primary" size="md">
        Ekle
      </ModernButton>
      <ModernButton variant="secondary" size="md">
        İptal
      </ModernButton>
      <ModernButton variant="danger" size="lg" loading={isLoading}>
        Sil
      </ModernButton>
      <ModernButton variant="success" icon="✓">
        Kaydet
      </ModernButton>
    </div>
  );
}
```

### ModernInput

```tsx
import { ModernInput } from '@/components/ModernInput';

export function FormExample() {
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');

  return (
    <div className="space-y-4">
      <ModernInput
        label="E-mail"
        type="email"
        placeholder="ornek@sirket.com"
        icon="✉️"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        helpText="Geçerli bir e-mail adresi girin"
      />
      <ModernInput
        label="Parola"
        type="password"
        placeholder="••••••••"
        icon="🔒"
        error={error}
      />
    </div>
  );
}
```

## 🎯 Özet Değişiklikler

### Renk Sistemi (CSS Variables)
- **Primary**: `--isg-primary` → Sky Blue (#0ea5e9)
- **Secondary**: `--isg-secondary` → Violet (#8b5cf6)
- **Accent**: `--isg-accent` → Rose (#f43f5e)
- **Success**: `--isg-success` → Emerald (#10b981)
- **Warning**: `--isg-warning` → Amber (#f59e0b)
- **Danger**: `--isg-danger` → Red (#ef4444)

### Animasyonlar
- `fadeIn` — Opacity animasyonu
- `slideInFromTop/Bottom/Left/Right` — Kaydırma animasyonları
- `scaleIn` — Ölçekleme animasyonu
- `pulse-soft` — Yumuşak nabız
- `glow` — Parlama efekti
- `float` — Yüzen hareket

### Efektler
- **Glassmorphism**: `.glass` sınıfı — Blur ve transparans
- **Gradients**: `gradient-primary`, `gradient-warm`, vb.
- **Box Shadows**: Glow ve hover efektleri
- **Transitions**: Smooth ve fast çeşitleri

## 🔧 Tailwind CSS Konfigürasyonu

`tailwind.config.ts` dosyasında şunu ekleyin:

```ts
import type { Config } from 'tailwindcss'

const config: Config = {
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        isg: {
          'primary': 'var(--isg-primary)',
          'secondary': 'var(--isg-secondary)',
          'text': 'var(--isg-text)',
          'text-muted': 'var(--isg-text-muted)',
          'border': 'var(--isg-border)',
          'bg': 'var(--isg-bg)',
          'card': 'var(--isg-card)',
        },
      },
      fontFamily: {
        sans: ['IBM Plex Sans', 'system-ui', 'sans-serif'],
      },
    },
  },
}

export default config
```

## 📱 Responsive Tasarım

Tüm bileşenler mobile-first ile tasarlanmıştır:

- **sm**: 640px
- **md**: 768px
- **lg**: 1024px
- **xl**: 1280px
- **2xl**: 1536px

## 🌙 Dark/Light Mode

HTML elemanına `dark` class'ını ekleyerek dark mode'a geçin:

```tsx
<html className="dark">
  {/* ... */}
</html>
```

## 💡 İpuçları

1. **Performance**: Framer Motion animations'lar GPU-accelerated'dir
2. **Accessibility**: Tüm bileşenler WCAG 2.1 standartlarına uyar
3. **Theme Toggle**: `document.documentElement.classList.toggle('dark')`
4. **Custom Colors**: CSS variables'ları değiştirerek özel renkler tanımlayın
5. **Animation Timing**: `transition` prop'u ile animasyon hızını kontrol edin

## 🚀 İleri Özellikler

### Layout Animation Groups

```tsx
<AnimatePresence>
  {items.map((item) => (
    <motion.div
      key={item.id}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      {item}
    </motion.div>
  ))}
</AnimatePresence>
```

### Stagger Effects

```tsx
<motion.div
  initial="hidden"
  whileInView="visible"
  variants={{
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.1 },
    },
  }}
>
  {/* children */}
</motion.div>
```

## 🎓 Kaynak Linkler

- [Framer Motion Docs](https://www.framer.com/motion/)
- [Tailwind CSS Docs](https://tailwindcss.com)
- [Next.js 16 Docs](https://nextjs.org)
- [CSS Variables Reference](https://developer.mozilla.org/en-US/docs/Web/CSS/--*)

---

**Versiyon**: 2.0 Modern Design Update
**Tarih**: 2025
**İSG Otomasyon © 2025**
