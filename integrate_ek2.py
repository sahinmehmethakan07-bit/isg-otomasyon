#!/usr/bin/env python3
"""
EK-2 Muayene Formu entegrasyon scripti.
page.tsx'e:
1. Import ekler
2. Tabs dizisine "EK-2 Muayene" sekmesi ekler (sadece doktor icin veya herkes icin)
3. Render bloğu ekler
"""

with open('app/page.tsx', 'r') as f:
    content = f.read()

changes = 0

# 1. Import ekle
import_line = 'import { AdminUserPanel } from "./lib/AdminUserPanel";'
new_import = import_line + '\nimport { Ek2MuayeneFormu } from "./lib/Ek2MuayeneFormu";'

if 'Ek2MuayeneFormu' not in content:
    content = content.replace(import_line, new_import)
    changes += 1
    print("1. Import eklendi")
else:
    print("1. Import zaten var")

# 2. Tab ekle - imzacilar'dan sonra, kullanicilar'dan once
old_tabs = '{ id: "imzacilar", label: "✍️ İmzacılar" },'
new_tabs = old_tabs + '\n    { id: "ek2muayene", label: "🏥 EK-2 Muayene" },'

if 'ek2muayene' not in content:
    content = content.replace(old_tabs, new_tabs)
    changes += 1
    print("2. Tab eklendi")
else:
    print("2. Tab zaten var")

# 3. Render blogu ekle - AdminUserPanel'den once
old_render = '        {activeTab === "kullanicilar" && isAdmin && ('
new_render = '''        {activeTab === "ek2muayene" && (
          <Ek2MuayeneFormu
            styles={styles}
            companies={companies}
            employees={employees}
            userRole={userProfile?.activeRole || userProfile?.role || ""}
            userId={userProfile?.uid || ""}
          />
        )}

        {activeTab === "kullanicilar" && isAdmin && ('''

if 'ek2muayene' not in content.split('activeTab')[0] or 'Ek2MuayeneFormu' not in content.split('return')[1] if 'return' in content else True:
    if old_render in content:
        content = content.replace(old_render, new_render)
        changes += 1
        print("3. Render blogu eklendi")
    else:
        print("3. Render blogu BULUNAMADI - kullanicilar activeTab yok")
else:
    print("3. Render blogu zaten var")

with open('app/page.tsx', 'w') as f:
    f.write(content)

print(f"\nToplam {changes} degisiklik yapildi")
