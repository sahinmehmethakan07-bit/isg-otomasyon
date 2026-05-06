#!/usr/bin/env python3
"""
Ek2MuayeneFormu.tsx'e PDF butonu ekler.
"""

with open('app/lib/Ek2MuayeneFormu.tsx', 'r') as f:
    content = f.read()

changes = 0

# 1. Import ekle
if 'ek2PdfGenerator' not in content:
    content = content.replace(
        'import React, { useState, useEffect } from "react";',
        'import React, { useState, useEffect } from "react";\nimport { generateEk2PDF } from "./ek2PdfGenerator";'
    )
    changes += 1
    print("1. PDF import eklendi")

# 2. Liste gorunumunde PDF butonu ekle (Duzenle butonunun yanina)
old_btn = '''{canEdit ? "Düzenle" : "Görüntüle"}
                        </button>'''
new_btn = '''{canEdit ? "Düzenle" : "Görüntüle"}
                        </button>
                        <button style={{ ...styles.btnPrimary, fontSize: 11, backgroundColor: "#7c3aed" }} onClick={() => generateEk2PDF(f)}>PDF</button>'''

if 'generateEk2PDF' not in content:
    content = content.replace(old_btn, new_btn)
    changes += 1
    print("2. Liste PDF butonu eklendi")

# 3. Form duzenlemede de PDF butonu ekle (Kaydet butonunun yanina)
old_save = '''          <button style={styles.btnSecondary} onClick={() => setShowForm(false)}>Geri</button>
        </div>
      </div>
    </div>
  );
}'''

new_save = '''          <button style={{ ...styles.btnPrimary, backgroundColor: "#7c3aed" }} onClick={() => generateEk2PDF(form)}>PDF İndir</button>
          <button style={styles.btnSecondary} onClick={() => setShowForm(false)}>Geri</button>
        </div>
      </div>
    </div>
  );
}'''

if 'PDF İndir' not in content:
    content = content.replace(old_save, new_save)
    changes += 1
    print("3. Form PDF butonu eklendi")

with open('app/lib/Ek2MuayeneFormu.tsx', 'w') as f:
    f.write(content)

print(f"\nToplam {changes} degisiklik yapildi")
