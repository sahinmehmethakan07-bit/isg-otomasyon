/**
 * Ek2MuayeneFormu.tsx — EK-2 İşe Giriş / Periyodik Muayene Formu
 *
 * - Doktor rolü: formu doldurabilir, düzenleyebilir, PDF oluşturabilir
 * - Diğer roller (hemşire, iş güvenliği uzmanı, admin): sadece görüntüler
 * - Firestore collection: "ek2forms"
 * - Her form bir çalışana (employee) bağlıdır
 */

"use client";

import React, { useState, useEffect } from "react";
import { generateEk2PDF } from "./ek2PdfGenerator";
import { db } from "../../lib/firebase";
import {
  collection,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  query,
  where,
  serverTimestamp,
} from "firebase/firestore";

// ── Tipler ───────────────────────────────────────────────────────────────────

export type Ek2Form = {
  id: string;
  // İşyeri bilgileri
  companyId: string;
  companyName: string;
  sgkSicilNo: string;
  companyAddress: string;
  companyTel: string;
  companyEmail: string;
  // Çalışan bilgileri
  employeeId: string;
  employeeName: string;
  tcKimlikNo: string;
  dogumYeriTarihi: string;
  cinsiyet: string;
  egitimDurumu: string;
  medeniDurum: string;
  cocukSayisi: string;
  evAdresi: string;
  telNo: string;
  meslegi: string;
  yaptigiIs: string;
  calistigiBolum: string;
  // Daha önce çalıştığı yerler
  oncekiIsler: { iskolu: string; yaptigiIs: string; girisCikisTarihi: string }[];
  // Özgeçmiş
  kanGrubu: string;
  konjenitalKronikHastalik: string;
  bagisiklamaTetanoz: string;
  bagisiklamaHepatit: string;
  bagisiklamaDiger: string;
  // Soygeçmiş
  soygecmisAnne: string;
  soygecmisBaba: string;
  soygecmisKardes: string;
  soygecmisCocuk: string;
  // Tıbbi Anamnez (1-10 arası sorular)
  yakınmalar: Record<string, { hayir: boolean; evet: boolean; aciklama: string }>;
  hastaliklar: Record<string, { hayir: boolean; evet: boolean; aciklama: string }>;
  hastaneYatis: { hayir: boolean; evet: boolean; tani: string };
  ameliyat: { hayir: boolean; evet: boolean; neden: string };
  isKazasi: { hayir: boolean; evet: boolean; neOldu: string };
  meslekHastaligi: { hayir: boolean; evet: boolean; sonuc: string };
  maluliyet: { hayir: boolean; evet: boolean; nedir: string; orani: string };
  tedavi: { hayir: boolean; evet: boolean; nedir: string };
  sigara: { durum: string; yil: string; adetGun: string };
  alkol: { durum: string; yil: string; siklik: string };
  // Fizik Muayene
  goz: string;
  kulakBurunBogaz: string;
  deri: string;
  kardiyovaskuler: string;
  solunum: string;
  sindirim: string;
  urogenital: string;
  kasIskelet: string;
  norolojik: string;
  psikiyatrik: string;
  fizikDiger: string;
  ta: string;
  nb: string;
  boy: string;
  kilo: string;
  vki: string;
  // Laboratuvar
  kan: string;
  idrar: string;
  radyolojik: string;
  odyometre: string;
  sft: string;
  psikolojik: string;
  labDiger: string;
  // Kanaat ve Sonuç
  kanaatSonuc: string;
  kanaatSart: string;
  // Doktor bilgileri
  doktorAdi: string;
  diplomaTarihNo: string;
  diplomaTescilNo: string;
  isyeriHekimBelgeNo: string;
  formTarihi: string;
  // Meta
  createdBy: string;
  createdAsRole: string;
  createdAt: any;
  updatedAt: any;
};

type Props = {
  styles: Record<string, React.CSSProperties>;
  companies: { id: string; nickName: string; officialName: string; sgkSicil: string }[];
  employees: { id: string; companyId: string; firstName: string; lastName: string; tcNo: string }[];
  userRole: string;
  userId: string;
};

const defaultYakinmalar = [
  "Balgamlı öksürük", "Nefes darlığı", "Göğüs ağrısı", "Çarpıntı",
  "Sırt ağrısı", "İshal veya kabızlık", "Eklemlerde ağrı",
];

const defaultHastaliklar = [
  "Kalp hastalığı", "Şeker hastalığı", "Böbrek rahatsızlığı", "Sarılık",
  "Mide veya on iki parmak ülseri", "İşitme kaybı", "Görme bozukluğu",
  "Sinir sistemi hastalığı", "Deri hastalığı", "Besin zehirlenmesi",
];

const emptyForm: Omit<Ek2Form, "id"> = {
  companyId: "", companyName: "", sgkSicilNo: "", companyAddress: "", companyTel: "", companyEmail: "",
  employeeId: "", employeeName: "", tcKimlikNo: "", dogumYeriTarihi: "", cinsiyet: "", egitimDurumu: "",
  medeniDurum: "", cocukSayisi: "", evAdresi: "", telNo: "", meslegi: "", yaptigiIs: "", calistigiBolum: "",
  oncekiIsler: [{ iskolu: "", yaptigiIs: "", girisCikisTarihi: "" }],
  kanGrubu: "", konjenitalKronikHastalik: "", bagisiklamaTetanoz: "", bagisiklamaHepatit: "", bagisiklamaDiger: "",
  soygecmisAnne: "", soygecmisBaba: "", soygecmisKardes: "", soygecmisCocuk: "",
  yakınmalar: Object.fromEntries(defaultYakinmalar.map(y => [y, { hayir: true, evet: false, aciklama: "" }])),
  hastaliklar: Object.fromEntries(defaultHastaliklar.map(h => [h, { hayir: true, evet: false, aciklama: "" }])),
  hastaneYatis: { hayir: true, evet: false, tani: "" },
  ameliyat: { hayir: true, evet: false, neden: "" },
  isKazasi: { hayir: true, evet: false, neOldu: "" },
  meslekHastaligi: { hayir: true, evet: false, sonuc: "" },
  maluliyet: { hayir: true, evet: false, nedir: "", orani: "" },
  tedavi: { hayir: true, evet: false, nedir: "" },
  sigara: { durum: "hayir", yil: "", adetGun: "" },
  alkol: { durum: "hayir", yil: "", siklik: "" },
  goz: "", kulakBurunBogaz: "", deri: "", kardiyovaskuler: "", solunum: "", sindirim: "",
  urogenital: "", kasIskelet: "", norolojik: "", psikiyatrik: "", fizikDiger: "",
  ta: "", nb: "", boy: "", kilo: "", vki: "",
  kan: "", idrar: "", radyolojik: "", odyometre: "", sft: "", psikolojik: "", labDiger: "",
  kanaatSonuc: "", kanaatSart: "",
  doktorAdi: "", diplomaTarihNo: "", diplomaTescilNo: "", isyeriHekimBelgeNo: "",
  formTarihi: new Date().toISOString().split("T")[0],
  createdBy: "", createdAsRole: "", createdAt: null, updatedAt: null,
};

// ── Bileşen ──────────────────────────────────────────────────────────────────

export function Ek2MuayeneFormu({ styles, companies, employees, userRole, userId }: Props) {
  const [forms, setForms] = useState<Ek2Form[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<Omit<Ek2Form, "id">>(emptyForm);
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState("");
  const [selectedCompanyFilter, setSelectedCompanyFilter] = useState("all");

  const isDoctor = userRole === "doctor";
  const canEdit = isDoctor;

  useEffect(() => { loadForms(); }, []);

  async function loadForms() {
    setLoading(true);
    try {
      const snap = await getDocs(collection(db, "ek2forms"));
      setForms(snap.docs.map(d => ({ id: d.id, ...d.data() } as Ek2Form)));
    } catch (e) {
      console.error("EK-2 yükleme hatası:", e);
    } finally {
      setLoading(false);
    }
  }

  function startNew() {
    setForm({ ...emptyForm, createdBy: userId, createdAsRole: "doctor", formTarihi: new Date().toISOString().split("T")[0] });
    setEditingId(null);
    setShowForm(true);
  }

  function startEdit(f: Ek2Form) {
    const { id, ...rest } = f;
    setForm(rest);
    setEditingId(id);
    setShowForm(true);
  }

  function selectCompany(companyId: string) {
    const c = companies.find(x => x.id === companyId);
    if (c) {
      setForm(prev => ({ ...prev, companyId: c.id, companyName: c.officialName || c.nickName, sgkSicilNo: c.sgkSicil || "" }));
    }
  }

  function selectEmployee(employeeId: string) {
    const e = employees.find(x => x.id === employeeId);
    if (e) {
      setForm(prev => ({ ...prev, employeeId: e.id, employeeName: `${e.firstName} ${e.lastName}`, tcKimlikNo: e.tcNo || "" }));
    }
  }

  async function saveForm() {
    if (!form.companyId || !form.employeeName) return;
    setSaving(true);
    try {
      const data = { ...form, updatedAt: serverTimestamp() };
      if (!editingId) {
        data.createdAt = serverTimestamp();
        data.createdBy = userId;
        data.createdAsRole = "doctor";
        const ref = await addDoc(collection(db, "ek2forms"), data);
        setForms(prev => [...prev, { id: ref.id, ...data } as Ek2Form]);
      } else {
        await updateDoc(doc(db, "ek2forms", editingId), data as any);
        setForms(prev => prev.map(f => f.id === editingId ? { ...f, ...data } : f));
      }
      setShowForm(false);
      setEditingId(null);
    } catch (e: any) {
      alert("Kaydetme hatası: " + e.message);
    } finally {
      setSaving(false);
    }
  }

  async function deleteForm(id: string) {
    if (!confirm("Bu formu silmek istediğinize emin misiniz?")) return;
    await deleteDoc(doc(db, "ek2forms", id));
    setForms(prev => prev.filter(f => f.id !== id));
  }

  function updateField(field: string, value: any) {
    setForm(prev => ({ ...prev, [field]: value }));
  }

  // Filtreleme
  const filteredForms = forms.filter(f => {
    const matchSearch = !search || f.employeeName?.toLowerCase().includes(search.toLowerCase()) || f.companyName?.toLowerCase().includes(search.toLowerCase());
    const matchCompany = selectedCompanyFilter === "all" || f.companyId === selectedCompanyFilter;
    return matchSearch && matchCompany;
  });

  if (loading) return <div style={{ color: "var(--isg-text-muted)", padding: 20 }}>EK-2 formları yükleniyor...</div>;

  // ── Form Listesi ───────────────────────────────────────────────────────────
  if (!showForm) {
    return (
      <div>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
          <p style={{ ...styles.sectionTitle, marginBottom: 0 }}>EK-2 İşe Giriş / Periyodik Muayene Formları</p>
          {canEdit && (
            <button style={styles.btnPrimary} onClick={startNew}>+ Yeni Muayene Formu</button>
          )}
        </div>

        <div style={styles.searchBar}>
          <input style={{ ...styles.input, maxWidth: 300 }} placeholder="Çalışan veya firma ara..." value={search} onChange={e => setSearch(e.target.value)} />
          <select style={{ ...styles.select, maxWidth: 200 }} value={selectedCompanyFilter} onChange={e => setSelectedCompanyFilter(e.target.value)}>
            <option value="all">Tüm Firmalar</option>
            {companies.map(c => <option key={c.id} value={c.id}>{c.nickName}</option>)}
          </select>
        </div>

        {filteredForms.length === 0 ? (
          <div style={{ ...styles.card, textAlign: "center", color: "var(--isg-text-muted)", padding: 40 }}>
            {canEdit ? "Henüz muayene formu oluşturulmamış. Yeni form eklemek için yukarıdaki butonu kullanın." : "Henüz muayene formu bulunmamaktadır."}
          </div>
        ) : (
          <div style={styles.card}>
            <table style={styles.table}>
              <thead>
                <tr>
                  <th style={styles.th}>Çalışan</th>
                  <th style={styles.th}>T.C. Kimlik</th>
                  <th style={styles.th}>Firma</th>
                  <th style={styles.th}>Tarih</th>
                  <th style={styles.th}>Kanaat</th>
                  <th style={styles.th}>İşlem</th>
                </tr>
              </thead>
              <tbody>
                {filteredForms.map(f => (
                  <tr key={f.id}>
                    <td style={styles.td}>{f.employeeName}</td>
                    <td style={styles.td}>{f.tcKimlikNo}</td>
                    <td style={styles.td}>{f.companyName}</td>
                    <td style={styles.td}>{f.formTarihi}</td>
                    <td style={styles.td}>
                      <span style={{
                        ...styles.badge,
                        backgroundColor: f.kanaatSonuc ? "#16a34a22" : "#d9770622",
                        color: f.kanaatSonuc ? "#16a34a" : "#d97706",
                        border: `1px solid ${f.kanaatSonuc ? "#16a34a44" : "#d9770644"}`,
                      }}>
                        {f.kanaatSonuc ? "Tamamlandı" : "Taslak"}
                      </span>
                    </td>
                    <td style={styles.td}>
                      <div style={{ display: "flex", gap: 6 }}>
                        <button style={{ ...styles.btnSecondary, fontSize: 11 }} onClick={() => startEdit(f)}>
                          {canEdit ? "Düzenle" : "Görüntüle"}
                        </button>
                        {canEdit && (
                          <button style={{ ...styles.btnDanger, fontSize: 11 }} onClick={() => deleteForm(f.id)}>Sil</button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    );
  }

  // ── Form Düzenleme / Görüntüleme ──────────────────────────────────────────
  const companyEmployees = employees.filter(e => e.companyId === form.companyId);
  const readOnly = !canEdit;

  const SectionTitle = ({ title }: { title: string }) => (
    <div style={{ fontSize: 14, fontWeight: 700, color: "#38bdf8", marginTop: 24, marginBottom: 12, paddingBottom: 6, borderBottom: "1px solid var(--isg-border)" }}>
      {title}
    </div>
  );

  const Field = ({ label, field, wide, textarea }: { label: string; field: string; wide?: boolean; textarea?: boolean }) => (
    <div style={wide ? { gridColumn: "1 / -1" } : {}}>
      <label style={styles.label}>{label}</label>
      {textarea ? (
        <textarea style={{ ...styles.input, minHeight: 60, resize: "vertical" }} value={(form as any)[field] || ""} onChange={e => updateField(field, e.target.value)} readOnly={readOnly} />
      ) : (
        <input style={styles.input} value={(form as any)[field] || ""} onChange={e => updateField(field, e.target.value)} readOnly={readOnly} />
      )}
    </div>
  );

  const YesNo = ({ label, data, field }: { label: string; data: { hayir: boolean; evet: boolean; [key: string]: any }; field: string }) => (
    <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "4px 0", borderBottom: "1px solid var(--isg-border)" }}>
      <span style={{ flex: 1, fontSize: 13 }}>{label}</span>
      <label style={{ fontSize: 12, display: "flex", alignItems: "center", gap: 4 }}>
        <input type="radio" checked={data.hayir} onChange={() => {
          if (readOnly) return;
          const updated = { ...data, hayir: true, evet: false };
          updateField(field, updated);
        }} disabled={readOnly} /> Hayır
      </label>
      <label style={{ fontSize: 12, display: "flex", alignItems: "center", gap: 4 }}>
        <input type="radio" checked={data.evet} onChange={() => {
          if (readOnly) return;
          const updated = { ...data, hayir: false, evet: true };
          updateField(field, updated);
        }} disabled={readOnly} /> Evet
      </label>
    </div>
  );

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
        <p style={{ ...styles.sectionTitle, marginBottom: 0 }}>
          {readOnly ? "📋 EK-2 Muayene Formu (Görüntüleme)" : editingId ? "📋 EK-2 Muayene Formu (Düzenleme)" : "📋 Yeni EK-2 Muayene Formu"}
        </p>
        <div style={{ display: "flex", gap: 8 }}>
          {canEdit && (
            <button style={styles.btnSuccess} onClick={saveForm} disabled={saving}>
              {saving ? "Kaydediliyor..." : "Kaydet"}
            </button>
          )}
          <button style={styles.btnSecondary} onClick={() => setShowForm(false)}>Geri</button>
        </div>
      </div>

      <div style={styles.card}>
        {/* ── İŞYERİ BİLGİLERİ ── */}
        <SectionTitle title="İŞYERİNİN / İŞVERENİN BİLGİLERİ" />
        <div style={styles.formGrid}>
          <div>
            <label style={styles.label}>Firma Seçin</label>
            <select style={styles.select} value={form.companyId} onChange={e => selectCompany(e.target.value)} disabled={readOnly}>
              <option value="">Firma seçin...</option>
              {companies.map(c => <option key={c.id} value={c.id}>{c.nickName} ({c.officialName})</option>)}
            </select>
          </div>
          <Field label="Unvanı" field="companyName" />
          <Field label="SGK Sicil No" field="sgkSicilNo" />
          <Field label="Adresi" field="companyAddress" wide />
          <Field label="Tel ve Faks" field="companyTel" />
          <Field label="E-Posta" field="companyEmail" />
        </div>

        {/* ── ÇALIŞAN BİLGİLERİ ── */}
        <SectionTitle title="ÇALIŞANIN / İŞE GİRENİN BİLGİLERİ" />
        <div style={styles.formGrid}>
          {form.companyId && (
            <div>
              <label style={styles.label}>Çalışan Seçin</label>
              <select style={styles.select} value={form.employeeId} onChange={e => selectEmployee(e.target.value)} disabled={readOnly}>
                <option value="">Çalışan seçin...</option>
                {companyEmployees.map(e => <option key={e.id} value={e.id}>{e.firstName} {e.lastName}</option>)}
              </select>
            </div>
          )}
          <Field label="Adı ve Soyadı" field="employeeName" />
          <Field label="T.C. Kimlik No" field="tcKimlikNo" />
          <Field label="Doğum Yeri ve Tarihi" field="dogumYeriTarihi" />
          <div>
            <label style={styles.label}>Cinsiyeti</label>
            <select style={styles.select} value={form.cinsiyet} onChange={e => updateField("cinsiyet", e.target.value)} disabled={readOnly}>
              <option value="">Seçin</option>
              <option value="Erkek">Erkek</option>
              <option value="Kadın">Kadın</option>
            </select>
          </div>
          <Field label="Eğitim Durumu" field="egitimDurumu" />
          <Field label="Medeni Durumu" field="medeniDurum" />
          <Field label="Çocuk Sayısı" field="cocukSayisi" />
          <Field label="Ev Adresi" field="evAdresi" wide />
          <Field label="Tel No" field="telNo" />
          <Field label="Mesleği / Meslek Dalı" field="meslegi" />
          <Field label="Yaptığı İş" field="yaptigiIs" wide />
          <Field label="Çalıştığı Bölüm" field="calistigiBolum" />
        </div>

        {/* ── ÖZGEÇMİŞ ── */}
        <SectionTitle title="ÖZGEÇMİŞ" />
        <div style={styles.formGrid}>
          <Field label="Kan Grubu" field="kanGrubu" />
          <Field label="Konjenital / Kronik Hastalık" field="konjenitalKronikHastalik" />
          <Field label="Bağışıklama - Tetanoz" field="bagisiklamaTetanoz" />
          <Field label="Bağışıklama - Hepatit" field="bagisiklamaHepatit" />
          <Field label="Bağışıklama - Diğer" field="bagisiklamaDiger" />
        </div>

        {/* ── SOYGEÇMİŞ ── */}
        <SectionTitle title="SOYGEÇMİŞ" />
        <div style={styles.formGrid}>
          <Field label="Anne" field="soygecmisAnne" />
          <Field label="Baba" field="soygecmisBaba" />
          <Field label="Kardeş" field="soygecmisKardes" />
          <Field label="Çocuk" field="soygecmisCocuk" />
        </div>

        {/* ── TIBBİ ANAMNEZ ── */}
        <SectionTitle title="TIBBİ ANAMNEZ" />

        <div style={{ marginBottom: 16 }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: "var(--isg-text-muted)", marginBottom: 8 }}>
            1. Aşağıdaki yakınmalardan herhangi birini yaşadınız mı?
          </div>
          {defaultYakinmalar.map(y => (
            <YesNo key={y} label={`- ${y}`} data={form.yakınmalar?.[y] || { hayir: true, evet: false, aciklama: "" }} field={`yakınmalar`} />
          ))}
        </div>

        <div style={{ marginBottom: 16 }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: "var(--isg-text-muted)", marginBottom: 8 }}>
            2. Aşağıdaki hastalıklardan herhangi birini geçirdiniz mi?
          </div>
          {defaultHastaliklar.map(h => (
            <YesNo key={h} label={`- ${h}`} data={form.hastaliklar?.[h] || { hayir: true, evet: false, aciklama: "" }} field={`hastaliklar`} />
          ))}
        </div>

        <div style={{ display: "grid", gap: 8, marginBottom: 16 }}>
          <YesNo label="3. Hastanede yattınız mı?" data={form.hastaneYatis} field="hastaneYatis" />
          {form.hastaneYatis.evet && <Field label="Tanı" field="hastaneYatis" />}

          <YesNo label="4. Ameliyat geçirdiniz mi?" data={form.ameliyat} field="ameliyat" />
          <YesNo label="5. İş kazası geçirdiniz mi?" data={form.isKazasi} field="isKazasi" />
          <YesNo label="6. Meslek hastalığı şüphesi ile tetkik/muayeneye tabi tutuldunuz mu?" data={form.meslekHastaligi} field="meslekHastaligi" />
          <YesNo label="7. Maluliyet aldınız mı?" data={form.maluliyet} field="maluliyet" />
          <YesNo label="8. Şu anda herhangi bir tedavi görüyor musunuz?" data={form.tedavi} field="tedavi" />
        </div>

        <div style={styles.formGrid}>
          <div>
            <label style={styles.label}>9. Sigara içiyor musunuz?</label>
            <select style={styles.select} value={form.sigara.durum} onChange={e => updateField("sigara", { ...form.sigara, durum: e.target.value })} disabled={readOnly}>
              <option value="hayir">Hayır</option>
              <option value="birakmis">Bırakmış</option>
              <option value="evet">Evet</option>
            </select>
          </div>
          {form.sigara.durum !== "hayir" && (
            <>
              <Field label="Kaç yıldır" field="sigara" />
              <Field label="Adet/gün" field="sigara" />
            </>
          )}
          <div>
            <label style={styles.label}>10. Alkol alıyor musunuz?</label>
            <select style={styles.select} value={form.alkol.durum} onChange={e => updateField("alkol", { ...form.alkol, durum: e.target.value })} disabled={readOnly}>
              <option value="hayir">Hayır</option>
              <option value="birakmis">Bırakmış</option>
              <option value="evet">Evet</option>
            </select>
          </div>
        </div>

        {/* ── FİZİK MUAYENE ── */}
        <SectionTitle title="FİZİK MUAYENE SONUÇLARI" />
        <div style={styles.formGrid}>
          <Field label="a) Göz" field="goz" />
          <Field label="Kulak-Burun-Boğaz" field="kulakBurunBogaz" />
          <Field label="Deri" field="deri" />
          <Field label="b) Kardiyovasküler Sistem" field="kardiyovaskuler" />
          <Field label="c) Solunum Sistemi" field="solunum" />
          <Field label="d) Sindirim Sistemi" field="sindirim" />
          <Field label="e) Ürogenital Sistem" field="urogenital" />
          <Field label="f) Kas-İskelet Sistemi" field="kasIskelet" />
          <Field label="g) Nörolojik Muayene" field="norolojik" />
          <Field label="ğ) Psikiyatrik Muayene" field="psikiyatrik" />
          <Field label="h) Diğer" field="fizikDiger" />
          <Field label="TA (mm-Hg)" field="ta" />
          <Field label="Nb (/dk)" field="nb" />
          <Field label="Boy" field="boy" />
          <Field label="Kilo" field="kilo" />
          <Field label="Vücut Kitle İndeksi" field="vki" />
        </div>

        {/* ── LABORATUVAR ── */}
        <SectionTitle title="LABORATUVAR BULGULARI" />
        <div style={styles.formGrid}>
          <Field label="a) Kan" field="kan" />
          <Field label="İdrar" field="idrar" />
          <Field label="b) Radyolojik Analizler" field="radyolojik" />
          <Field label="c) Odyometre" field="odyometre" />
          <Field label="SFT" field="sft" />
          <Field label="d) Psikolojik Testler" field="psikolojik" />
          <Field label="e) Diğer" field="labDiger" />
        </div>

        {/* ── KANAAT VE SONUÇ ── */}
        <SectionTitle title="KANAAT VE SONUÇ" />
        <div style={styles.formGrid}>
          <Field label="İşinde bedenen ve ruhen çalışmaya elverişlidir" field="kanaatSonuc" wide textarea />
          <Field label="Şartı ile çalışmaya elverişlidir (koşullar)" field="kanaatSart" wide textarea />
        </div>

        {/* ── DOKTOR BİLGİLERİ ── */}
        <SectionTitle title="İŞYERİ HEKİMİ BİLGİLERİ" />
        <div style={styles.formGrid}>
          <Field label="Adı ve Soyadı" field="doktorAdi" />
          <Field label="Diploma Tarih ve No" field="diplomaTarihNo" />
          <Field label="Diploma Tescil Tarih ve No" field="diplomaTescilNo" />
          <Field label="İşyeri Hekimliği Belgesi Tarih ve No" field="isyeriHekimBelgeNo" />
          <Field label="Form Tarihi" field="formTarihi" />
        </div>

        {/* Kaydet / Geri butonları */}
        <div style={{ display: "flex", justifyContent: "flex-end", gap: 8, marginTop: 24, paddingTop: 16, borderTop: "1px solid var(--isg-border)" }}>
          {canEdit && (
            <button style={styles.btnSuccess} onClick={saveForm} disabled={saving}>
              {saving ? "Kaydediliyor..." : editingId ? "Güncelle" : "Kaydet"}
            </button>
          )}
          <button style={{ ...styles.btnPrimary, backgroundColor: "#7c3aed" }} onClick={() => generateEk2PDF(form)}>PDF İndir</button>
          <button style={styles.btnSecondary} onClick={() => setShowForm(false)}>Geri</button>
        </div>
      </div>
    </div>
  );
}
