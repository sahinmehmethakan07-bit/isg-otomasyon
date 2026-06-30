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
import { formatDate } from "./dateUtils";
import { generateEk2PDF } from "./ek2PdfGenerator";
import { EmptyState } from "./EmptyState";
import { TurkishDateInput } from "./TurkishDateInput";
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
  employeePhoto?: string;
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
  employees: {
    id: string;
    companyId: string;
    firstName: string;
    lastName: string;
    tcNo: string;
    photo?: string;
    birthPlace?: string;
    birthDate?: string;
    gender?: string;
    educationLevel?: string;
    maritalStatus?: string;
    address?: string;
    phone?: string;
    title?: string;
    department?: string;
    bloodType?: string;
    chronicDisease?: string;
    chronicConditions?: string;
    tetanusVaccine?: string;
    hepatitisVaccine?: string;
    allergies?: string;
  }[];
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
  employeeId: "", employeePhoto: "", employeeName: "", tcKimlikNo: "", dogumYeriTarihi: "", cinsiyet: "", egitimDurumu: "",
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
  const [statusFilter, setStatusFilter] = useState<"all" | "completed" | "draft">("all");
  const [quickEmployeeId, setQuickEmployeeId] = useState("");

  const isDoctor = userRole === "doctor";
  const canEdit = isDoctor;

  useEffect(() => { loadForms(); }, [companies]);

  async function loadForms() {
    setLoading(true);
    try {
      const accessibleCompanyIds = companies.map(c => c.id);
      if (accessibleCompanyIds.length === 0) {
        setForms([]);
        return;
      }

      const chunks: string[][] = [];
      for (let i = 0; i < accessibleCompanyIds.length; i += 30) {
        chunks.push(accessibleCompanyIds.slice(i, i + 30));
      }

      const snaps = await Promise.all(chunks.map(ids =>
        getDocs(query(collection(db, "ek2forms"), where("companyId", "in", ids)))
      ));
      setForms(snaps.flatMap(snap => snap.docs.map(d => ({ id: d.id, ...d.data() } as Ek2Form))));
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

  function employeeToEk2Fields(employeeId: string) {
    const e = employees.find(x => x.id === employeeId);
    if (!e) return {};
    const birthText = [e.birthPlace, e.birthDate].filter(Boolean).join(" / ");
    return {
      employeeId: e.id,
      employeePhoto: e.photo || "",
      employeeName: `${e.firstName} ${e.lastName}`.trim(),
      tcKimlikNo: e.tcNo || "",
      dogumYeriTarihi: birthText,
      cinsiyet: e.gender || "",
      egitimDurumu: e.educationLevel || "",
      medeniDurum: e.maritalStatus || "",
      cocukSayisi: "",
      evAdresi: e.address || "",
      telNo: e.phone || "",
      meslegi: e.title || "",
      yaptigiIs: e.title || "",
      calistigiBolum: e.department || "",
      kanGrubu: e.bloodType || "",
      konjenitalKronikHastalik: [e.chronicConditions || e.chronicDisease, e.allergies ? `Alerji: ${e.allergies}` : ""].filter(Boolean).join(" | "),
      bagisiklamaTetanoz: e.tetanusVaccine || "",
      bagisiklamaHepatit: e.hepatitisVaccine || "",
    };
  }

  function selectEmployee(employeeId: string) {
    const mapped = employeeToEk2Fields(employeeId);
    if (Object.keys(mapped).length > 0) setForm(prev => ({ ...prev, ...mapped }));
  }

  function startFromEmployee(employeeId: string) {
    const e = employees.find(x => x.id === employeeId);
    if (!e) return;
    const c = companies.find(x => x.id === e.companyId);
    setForm({
      ...emptyForm,
      createdBy: userId,
      createdAsRole: "doctor",
      formTarihi: new Date().toISOString().split("T")[0],
      companyId: c?.id || e.companyId,
      companyName: c?.officialName || c?.nickName || "",
      sgkSicilNo: c?.sgkSicil || "",
      ...employeeToEk2Fields(employeeId),
    });
    setEditingId(null);
    setShowForm(true);
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
    const normalizedSearch = search.trim().toLocaleLowerCase("tr-TR");
    const matchSearch = !normalizedSearch || f.employeeName?.toLocaleLowerCase("tr-TR").includes(normalizedSearch) || f.companyName?.toLocaleLowerCase("tr-TR").includes(normalizedSearch);
    const matchCompany = selectedCompanyFilter === "all" || f.companyId === selectedCompanyFilter;
    const matchStatus = statusFilter === "all" || (statusFilter === "completed" ? Boolean(f.kanaatSonuc) : !f.kanaatSonuc);
    return matchSearch && matchCompany && matchStatus;
  });

  const statusFilters = [
    { value: "all" as const, label: "Tüm Formlar", count: forms.length, color: "#52d3b5" },
    { value: "completed" as const, label: "Tamamlandı", count: forms.filter(f => Boolean(f.kanaatSonuc)).length, color: "#2D6A4F" },
    { value: "draft" as const, label: "Taslak", count: forms.filter(f => !f.kanaatSonuc).length, color: "#D4A017" },
  ];

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
          <span style={{ color: "var(--isg-text-muted)", fontSize: 13 }}>{filteredForms.length} form</span>
        </div>

        <div style={{ display: "grid", gap: 8, marginBottom: 16 }}>
          <div style={{ fontSize: 12, fontWeight: 800, letterSpacing: "0.08em", color: "var(--isg-text-muted)", textTransform: "uppercase" }}>
            Durum Filtresi
          </div>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            {statusFilters.map(filter => {
              const active = statusFilter === filter.value;
              return (
                <button
                  key={filter.value}
                  type="button"
                  onClick={() => setStatusFilter(filter.value)}
                  style={{
                    ...styles.btnSecondary,
                    minHeight: 44,
                    border: `1px solid ${active ? filter.color : "var(--isg-border)"}`,
                    backgroundColor: active ? `${filter.color}18` : "var(--isg-input-bg)",
                    color: active ? filter.color : "var(--isg-text)",
                  }}
                >
                  {filter.label} <span style={{ color: active ? filter.color : "var(--isg-text-muted)" }}>({filter.count})</span>
                </button>
              );
            })}
          </div>
        </div>

        {canEdit && (
          <div style={{ ...styles.card, marginBottom: 16 }}>
            <p style={{ ...styles.sectionTitle, marginBottom: 12 }}>İnsan Kaynakları Kaydından Form Başlat</p>
            <div style={{ display: "grid", gridTemplateColumns: "minmax(220px, 1fr) auto", gap: 12, alignItems: "end" }}>
              <div>
                <label style={styles.label}>Personel seçin</label>
                <select style={styles.select} value={quickEmployeeId} onChange={e => setQuickEmployeeId(e.target.value)}>
                  <option value="">HR tarafından girilen personel...</option>
                  {employees.map(e => {
                    const company = companies.find(c => c.id === e.companyId);
                    return <option key={e.id} value={e.id}>{e.firstName} {e.lastName} {company ? `- ${company.nickName}` : ""}</option>;
                  })}
                </select>
              </div>
              <button style={styles.btnSuccess} disabled={!quickEmployeeId} onClick={() => startFromEmployee(quickEmployeeId)}>
                Tek Tıkla EK-2 Oluştur
              </button>
            </div>
          </div>
        )}

        {filteredForms.length === 0 ? (
          <div style={styles.card} className="isg-card">
            <EmptyState message={canEdit ? "Yeni muayene formu oluşturmak için yukarıdaki butonu kullanın." : "Muayene formu oluşturulduğunda burada görünecek."} />
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
                    <td style={styles.td}>{formatDate(f.formTarihi)}</td>
                    <td style={styles.td}>
                      <span style={{
                        ...styles.badge,
                        backgroundColor: f.kanaatSonuc ? "#2D6A4F22" : "#D4A01722",
                        color: f.kanaatSonuc ? "#2D6A4F" : "#D4A017",
                        border: `1px solid ${f.kanaatSonuc ? "#2D6A4F44" : "#D4A01744"}`,
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

  // Field, SectionTitle, YesNo artik asagida component disinda tanimli
  // readOnly ve styles'i props olarak aliyorlar

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
        <Ek2SectionTitle title="İŞYERİNİN / İŞVERENİN BİLGİLERİ" />
        <div style={styles.formGrid}>
          <div>
            <label style={styles.label}>Firma Seçin</label>
            <select style={styles.select} value={form.companyId} onChange={e => selectCompany(e.target.value)} disabled={readOnly}>
              <option value="">Firma seçin...</option>
              {companies.map(c => <option key={c.id} value={c.id}>{c.nickName} ({c.officialName})</option>)}
            </select>
          </div>
          <Ek2Field label="Unvanı" value={(form as any)["companyName"] || ""} onChange={(val) => updateField("companyName", val)} readOnly={readOnly} styles={styles} />
          <Ek2Field label="SGK Sicil No" value={(form as any)["sgkSicilNo"] || ""} onChange={(val) => updateField("sgkSicilNo", val)} readOnly={readOnly} styles={styles} />
          <Ek2Field label="Adresi" value={(form as any)["companyAddress"] || ""} onChange={(val) => updateField("companyAddress", val)} readOnly={readOnly} styles={styles} wide />
          <Ek2Field label="Tel ve Faks" value={(form as any)["companyTel"] || ""} onChange={(val) => updateField("companyTel", val)} readOnly={readOnly} styles={styles} />
          <Ek2Field label="E-Posta" value={(form as any)["companyEmail"] || ""} onChange={(val) => updateField("companyEmail", val)} readOnly={readOnly} styles={styles} />
        </div>

        {/* ── ÇALIŞAN BİLGİLERİ ── */}
        <Ek2SectionTitle title="ÇALIŞANIN / İŞE GİRENİN BİLGİLERİ" />
        {form.employeePhoto && (
          <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 12, padding: 12, border: "1px solid var(--isg-border)", borderRadius: 8, backgroundColor: "var(--isg-input-bg)" }}>
            <img src={form.employeePhoto} alt="personel fotoğrafı" style={{ width: 64, height: 78, objectFit: "cover", borderRadius: 8, border: "1px solid var(--isg-border)" }} />
            <div>
              <div style={{ fontWeight: 800, color: "var(--isg-text)" }}>{form.employeeName || "Seçili personel"}</div>
              <div style={{ fontSize: 12, color: "var(--isg-text-muted)", marginTop: 2 }}>İnsan Kaynakları kaydından aktarılan fotoğraf ve bilgiler</div>
            </div>
          </div>
        )}
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
          <Ek2Field label="Adı ve Soyadı" value={(form as any)["employeeName"] || ""} onChange={(val) => updateField("employeeName", val)} readOnly={readOnly} styles={styles} />
          <Ek2Field label="T.C. Kimlik No" value={(form as any)["tcKimlikNo"] || ""} onChange={(val) => updateField("tcKimlikNo", val)} readOnly={readOnly} styles={styles} />
          <Ek2Field label="Doğum Yeri ve Tarihi" value={(form as any)["dogumYeriTarihi"] || ""} onChange={(val) => updateField("dogumYeriTarihi", val)} readOnly={readOnly} styles={styles} />
          <div>
            <label style={styles.label}>Cinsiyeti</label>
            <select style={styles.select} value={form.cinsiyet} onChange={e => updateField("cinsiyet", e.target.value)} disabled={readOnly}>
              <option value="">Seçin</option>
              <option value="Erkek">Erkek</option>
              <option value="Kadın">Kadın</option>
            </select>
          </div>
          <Ek2Field label="Eğitim Durumu" value={(form as any)["egitimDurumu"] || ""} onChange={(val) => updateField("egitimDurumu", val)} readOnly={readOnly} styles={styles} />
          <Ek2Field label="Medeni Durumu" value={(form as any)["medeniDurum"] || ""} onChange={(val) => updateField("medeniDurum", val)} readOnly={readOnly} styles={styles} />
          <Ek2Field label="Çocuk Sayısı" value={(form as any)["cocukSayisi"] || ""} onChange={(val) => updateField("cocukSayisi", val)} readOnly={readOnly} styles={styles} />
          <Ek2Field label="Ev Adresi" value={(form as any)["evAdresi"] || ""} onChange={(val) => updateField("evAdresi", val)} readOnly={readOnly} styles={styles} wide />
          <Ek2Field label="Tel No" value={(form as any)["telNo"] || ""} onChange={(val) => updateField("telNo", val)} readOnly={readOnly} styles={styles} />
          <Ek2Field label="Mesleği / Meslek Dalı" value={(form as any)["meslegi"] || ""} onChange={(val) => updateField("meslegi", val)} readOnly={readOnly} styles={styles} />
          <Ek2Field label="Yaptığı İş" value={(form as any)["yaptigiIs"] || ""} onChange={(val) => updateField("yaptigiIs", val)} readOnly={readOnly} styles={styles} wide />
          <Ek2Field label="Çalıştığı Bölüm" value={(form as any)["calistigiBolum"] || ""} onChange={(val) => updateField("calistigiBolum", val)} readOnly={readOnly} styles={styles} />
        </div>

        {/* ── ÖZGEÇMİŞ ── */}
        <Ek2SectionTitle title="ÖZGEÇMİŞ" />
        <div style={styles.formGrid}>
          <Ek2Field label="Kan Grubu" value={(form as any)["kanGrubu"] || ""} onChange={(val) => updateField("kanGrubu", val)} readOnly={readOnly} styles={styles} />
          <Ek2Field label="Konjenital / Kronik Hastalık" value={(form as any)["konjenitalKronikHastalik"] || ""} onChange={(val) => updateField("konjenitalKronikHastalik", val)} readOnly={readOnly} styles={styles} />
          <Ek2Field label="Bağışıklama - Tetanoz" value={(form as any)["bagisiklamaTetanoz"] || ""} onChange={(val) => updateField("bagisiklamaTetanoz", val)} readOnly={readOnly} styles={styles} />
          <Ek2Field label="Bağışıklama - Hepatit" value={(form as any)["bagisiklamaHepatit"] || ""} onChange={(val) => updateField("bagisiklamaHepatit", val)} readOnly={readOnly} styles={styles} />
          <Ek2Field label="Bağışıklama - Diğer" value={(form as any)["bagisiklamaDiger"] || ""} onChange={(val) => updateField("bagisiklamaDiger", val)} readOnly={readOnly} styles={styles} />
        </div>

        {/* ── SOYGEÇMİŞ ── */}
        <Ek2SectionTitle title="SOYGEÇMİŞ" />
        <div style={styles.formGrid}>
          <Ek2Field label="Anne" value={(form as any)["soygecmisAnne"] || ""} onChange={(val) => updateField("soygecmisAnne", val)} readOnly={readOnly} styles={styles} />
          <Ek2Field label="Baba" value={(form as any)["soygecmisBaba"] || ""} onChange={(val) => updateField("soygecmisBaba", val)} readOnly={readOnly} styles={styles} />
          <Ek2Field label="Kardeş" value={(form as any)["soygecmisKardes"] || ""} onChange={(val) => updateField("soygecmisKardes", val)} readOnly={readOnly} styles={styles} />
          <Ek2Field label="Çocuk" value={(form as any)["soygecmisCocuk"] || ""} onChange={(val) => updateField("soygecmisCocuk", val)} readOnly={readOnly} styles={styles} />
        </div>

        {/* ── TIBBİ ANAMNEZ ── */}
        <Ek2SectionTitle title="TIBBİ ANAMNEZ" />

        <div style={{ marginBottom: 16 }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: "var(--isg-text-muted)", marginBottom: 8 }}>
            1. Aşağıdaki yakınmalardan herhangi birini yaşadınız mı?
          </div>
          {defaultYakinmalar.map(y => (
            <Ek2YesNo key={y} label={`- ${y}`} data={form.yakınmalar?.[y] || { hayir: true, evet: false }} onChange={(val) => updateField("yakınmalar", {...form.yakınmalar, [y]: val})} readOnly={readOnly} />
          ))}
        </div>

        <div style={{ marginBottom: 16 }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: "var(--isg-text-muted)", marginBottom: 8 }}>
            2. Aşağıdaki hastalıklardan herhangi birini geçirdiniz mi?
          </div>
          {defaultHastaliklar.map(h => (
            <Ek2YesNo key={h} label={`- ${h}`} data={form.hastaliklar?.[h] || { hayir: true, evet: false }} onChange={(val) => updateField("hastaliklar", {...form.hastaliklar, [h]: val})} readOnly={readOnly} />
          ))}
        </div>

        <div style={{ display: "grid", gap: 8, marginBottom: 16 }}>
          <Ek2YesNo label="3. Hastanede yattınız mı?" data={form.hastaneYatis} onChange={(val) => updateField("hastaneYatis", val)} readOnly={readOnly} />
          {form.hastaneYatis.evet && <Ek2Field label="Tanı" value={(form as any)["hastaneYatis"] || ""} onChange={(val) => updateField("hastaneYatis", val)} readOnly={readOnly} styles={styles} />}

          <Ek2YesNo label="4. Ameliyat geçirdiniz mi?" data={form.ameliyat} onChange={(val) => updateField("ameliyat", val)} readOnly={readOnly} />
          <Ek2YesNo label="5. İş kazası geçirdiniz mi?" data={form.isKazasi} onChange={(val) => updateField("isKazasi", val)} readOnly={readOnly} />
          <Ek2YesNo label="6. Meslek hastalığı şüphesi ile tetkik/muayeneye tabi tutuldunuz mu?" data={form.meslekHastaligi} onChange={(val) => updateField("meslekHastaligi", val)} readOnly={readOnly} />
          <Ek2YesNo label="7. Maluliyet aldınız mı?" data={form.maluliyet} onChange={(val) => updateField("maluliyet", val)} readOnly={readOnly} />
          <Ek2YesNo label="8. Şu anda herhangi bir tedavi görüyor musunuz?" data={form.tedavi} onChange={(val) => updateField("tedavi", val)} readOnly={readOnly} />
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
              <Ek2Field label="Kaç yıldır" value={(form as any)["sigara"] || ""} onChange={(val) => updateField("sigara", val)} readOnly={readOnly} styles={styles} />
              <Ek2Field label="Adet/gün" value={(form as any)["sigara"] || ""} onChange={(val) => updateField("sigara", val)} readOnly={readOnly} styles={styles} />
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
        <Ek2SectionTitle title="FİZİK MUAYENE SONUÇLARI" />
        <div style={styles.formGrid}>
          <Ek2Field label="a) Göz" value={(form as any)["goz"] || ""} onChange={(val) => updateField("goz", val)} readOnly={readOnly} styles={styles} />
          <Ek2Field label="Kulak-Burun-Boğaz" value={(form as any)["kulakBurunBogaz"] || ""} onChange={(val) => updateField("kulakBurunBogaz", val)} readOnly={readOnly} styles={styles} />
          <Ek2Field label="Deri" value={(form as any)["deri"] || ""} onChange={(val) => updateField("deri", val)} readOnly={readOnly} styles={styles} />
          <Ek2Field label="b) Kardiyovasküler Sistem" value={(form as any)["kardiyovaskuler"] || ""} onChange={(val) => updateField("kardiyovaskuler", val)} readOnly={readOnly} styles={styles} />
          <Ek2Field label="c) Solunum Sistemi" value={(form as any)["solunum"] || ""} onChange={(val) => updateField("solunum", val)} readOnly={readOnly} styles={styles} />
          <Ek2Field label="d) Sindirim Sistemi" value={(form as any)["sindirim"] || ""} onChange={(val) => updateField("sindirim", val)} readOnly={readOnly} styles={styles} />
          <Ek2Field label="e) Ürogenital Sistem" value={(form as any)["urogenital"] || ""} onChange={(val) => updateField("urogenital", val)} readOnly={readOnly} styles={styles} />
          <Ek2Field label="f) Kas-İskelet Sistemi" value={(form as any)["kasIskelet"] || ""} onChange={(val) => updateField("kasIskelet", val)} readOnly={readOnly} styles={styles} />
          <Ek2Field label="g) Nörolojik Muayene" value={(form as any)["norolojik"] || ""} onChange={(val) => updateField("norolojik", val)} readOnly={readOnly} styles={styles} />
          <Ek2Field label="ğ) Psikiyatrik Muayene" value={(form as any)["psikiyatrik"] || ""} onChange={(val) => updateField("psikiyatrik", val)} readOnly={readOnly} styles={styles} />
          <Ek2Field label="h) Diğer" value={(form as any)["fizikDiger"] || ""} onChange={(val) => updateField("fizikDiger", val)} readOnly={readOnly} styles={styles} />
          <Ek2Field label="TA (mm-Hg)" value={(form as any)["ta"] || ""} onChange={(val) => updateField("ta", val)} readOnly={readOnly} styles={styles} />
          <Ek2Field label="Nb (/dk)" value={(form as any)["nb"] || ""} onChange={(val) => updateField("nb", val)} readOnly={readOnly} styles={styles} />
          <Ek2Field label="Boy" value={(form as any)["boy"] || ""} onChange={(val) => updateField("boy", val)} readOnly={readOnly} styles={styles} />
          <Ek2Field label="Kilo" value={(form as any)["kilo"] || ""} onChange={(val) => updateField("kilo", val)} readOnly={readOnly} styles={styles} />
          <Ek2Field label="Vücut Kitle İndeksi" value={(form as any)["vki"] || ""} onChange={(val) => updateField("vki", val)} readOnly={readOnly} styles={styles} />
        </div>

        {/* ── LABORATUVAR ── */}
        <Ek2SectionTitle title="LABORATUVAR BULGULARI" />
        <div style={styles.formGrid}>
          <Ek2Field label="a) Kan" value={(form as any)["kan"] || ""} onChange={(val) => updateField("kan", val)} readOnly={readOnly} styles={styles} />
          <Ek2Field label="İdrar" value={(form as any)["idrar"] || ""} onChange={(val) => updateField("idrar", val)} readOnly={readOnly} styles={styles} />
          <Ek2Field label="b) Radyolojik Analizler" value={(form as any)["radyolojik"] || ""} onChange={(val) => updateField("radyolojik", val)} readOnly={readOnly} styles={styles} />
          <Ek2Field label="c) Odyometre" value={(form as any)["odyometre"] || ""} onChange={(val) => updateField("odyometre", val)} readOnly={readOnly} styles={styles} />
          <Ek2Field label="SFT" value={(form as any)["sft"] || ""} onChange={(val) => updateField("sft", val)} readOnly={readOnly} styles={styles} />
          <Ek2Field label="d) Psikolojik Testler" value={(form as any)["psikolojik"] || ""} onChange={(val) => updateField("psikolojik", val)} readOnly={readOnly} styles={styles} />
          <Ek2Field label="e) Diğer" value={(form as any)["labDiger"] || ""} onChange={(val) => updateField("labDiger", val)} readOnly={readOnly} styles={styles} />
        </div>

        {/* ── KANAAT VE SONUÇ ── */}
        <Ek2SectionTitle title="KANAAT VE SONUÇ" />
        <div style={styles.formGrid}>
          <Ek2Field label="İşinde bedenen ve ruhen çalışmaya elverişlidir" value={(form as any)["kanaatSonuc"] || ""} onChange={(val) => updateField("kanaatSonuc", val)} readOnly={readOnly} styles={styles} wide textarea />
          <Ek2Field label="Şartı ile çalışmaya elverişlidir (koşullar)" value={(form as any)["kanaatSart"] || ""} onChange={(val) => updateField("kanaatSart", val)} readOnly={readOnly} styles={styles} wide textarea />
        </div>

        {/* ── DOKTOR BİLGİLERİ ── */}
        <Ek2SectionTitle title="İŞYERİ HEKİMİ BİLGİLERİ" />
        <div style={styles.formGrid}>
          <Ek2Field label="Adı ve Soyadı" value={(form as any)["doktorAdi"] || ""} onChange={(val) => updateField("doktorAdi", val)} readOnly={readOnly} styles={styles} />
          <Ek2Field label="Diploma Tarih ve No" value={(form as any)["diplomaTarihNo"] || ""} onChange={(val) => updateField("diplomaTarihNo", val)} readOnly={readOnly} styles={styles} />
          <Ek2Field label="Diploma Tescil Tarih ve No" value={(form as any)["diplomaTescilNo"] || ""} onChange={(val) => updateField("diplomaTescilNo", val)} readOnly={readOnly} styles={styles} />
          <Ek2Field label="İşyeri Hekimliği Belgesi Tarih ve No" value={(form as any)["isyeriHekimBelgeNo"] || ""} onChange={(val) => updateField("isyeriHekimBelgeNo", val)} readOnly={readOnly} styles={styles} />
          <Ek2Field label="Form Tarihi" value={(form as any)["formTarihi"] || ""} onChange={(val) => updateField("formTarihi", val)} readOnly={readOnly} styles={styles} inputType="date" />
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


// ── Yardimci Bilesenler (component disinda, re-render'da yeniden olusturulmaz) ──

function Ek2SectionTitle({ title }: { title: string }) {
  return (
    <div style={{ fontSize: 14, fontWeight: 700, color: "#38bdf8", marginTop: 24, marginBottom: 12, paddingBottom: 6, borderBottom: "1px solid #1e293b" }}>
      {title}
    </div>
  );
}

function Ek2Field({ label, value, onChange, wide, textarea, readOnly, styles, inputType = "text" }: { label: string; value: string; onChange: (val: string) => void; wide?: boolean; textarea?: boolean; readOnly: boolean; styles: any; inputType?: React.HTMLInputTypeAttribute }) {
  return (
    <div style={wide ? { gridColumn: "1 / -1" } : {}}>
      <label style={styles.label}>{label}</label>
      {textarea ? (
        <textarea style={{ ...styles.input, minHeight: 60, resize: "vertical" }} value={value} onChange={e => onChange(e.target.value)} readOnly={readOnly} />
      ) : inputType === "date" ? (
        <TurkishDateInput styles={styles} value={value} onChange={onChange} readOnly={readOnly} />
      ) : (
        <input type={inputType} style={styles.input} value={value} onChange={e => onChange(e.target.value)} readOnly={readOnly} />
      )}
    </div>
  );
}

function Ek2YesNo({ label, data, onChange, readOnly }: { label: string; data: { hayir: boolean; evet: boolean; [key: string]: any }; onChange: (val: any) => void; readOnly: boolean }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "4px 0", borderBottom: "1px solid #1e293b" }}>
      <span style={{ flex: 1, fontSize: 13 }}>{label}</span>
      <label style={{ fontSize: 12, display: "flex", alignItems: "center", gap: 4 }}>
        <input type="radio" checked={data.hayir} onChange={() => { if (!readOnly) onChange({ ...data, hayir: true, evet: false }); }} disabled={readOnly} /> Hayır
      </label>
      <label style={{ fontSize: 12, display: "flex", alignItems: "center", gap: 4 }}>
        <input type="radio" checked={data.evet} onChange={() => { if (!readOnly) onChange({ ...data, hayir: false, evet: true }); }} disabled={readOnly} /> Evet
      </label>
    </div>
  );
}
