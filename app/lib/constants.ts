import type { DangerClass, NewEmployeeForm } from "./types";

export const emptyNewEmployee: NewEmployeeForm = {
  companyId: "",
  firstName: "",
  lastName: "",
  tcNo: "",
  photo: "",
  birthPlace: "",
  birthDate: "",
  gender: "",
  nationality: "T.C.",
  nationalityOther: "",
  serialNo: "",
  fatherName: "",
  motherName: "",
  phone: "",
  email: "",
  department: "",
  diplomaInfo: "",
  educationLevel: "",
  maritalStatus: "",
  childrenCount: "",
  address: "",
  title: "",
  jobDescription: "",
  profession: "",
  hireDate: "",
  sgkNo: "",
  iban: "",
  emergencyContactName: "",
  emergencyContactPhone: "",
  bloodType: "",
  chronicDisease: "",
  tetanusVaccine: "",
  hepatitisVaccine: "",
  allergies: "",
  notes: "",
};

export const sgkCompanyRegistry: Record<string, { officialName: string; naceCode: string }> = {
  "2612345678901234567890": { officialName: "Örnek Turizm Otelcilik İnşaat Sanayi ve Ticaret A.Ş.", naceCode: "55.10.01" },
  "2611111111111111111111": { officialName: "Mavi Deniz Gıda Dağıtım Lojistik Limited Şirketi", naceCode: "46.38.01" },
};

export const naceRecords = [
  { code: "41.20.01", title: "Bina inşaatı", dangerClass: "Çok Tehlikeli" as DangerClass, note: "Şantiye, yüksekte çalışma, elektrik ve mekanik riskleri yüksek takip ister." },
  { code: "43.21.01", title: "Elektrik tesisatı işleri", dangerClass: "Çok Tehlikeli" as DangerClass, note: "Elektrik enerjisi, pano ve geçici tesisat kontrolleri kritik kabul edilir." },
  { code: "55.10.01", title: "Otel ve konaklama tesisleri", dangerClass: "Az Tehlikeli" as DangerClass, note: "Mutfak, teknik servis, havuz, kat hizmetleri ve yangın planı ayrı izlenmelidir." },
  { code: "56.10.01", title: "Lokanta ve yiyecek hizmetleri", dangerClass: "Az Tehlikeli" as DangerClass, note: "Mutfak yanığı, kesici-delici aletler, hijyen ve kaygan zemin kontrolleri öne çıkar." },
  { code: "46.38.01", title: "Gıda toptan ticareti", dangerClass: "Tehlikeli" as DangerClass, note: "Depo, yükleme-boşaltma, forklift ve soğuk zincir riskleri izlenmelidir." },
  { code: "49.41.01", title: "Karayolu yük taşımacılığı", dangerClass: "Tehlikeli" as DangerClass, note: "Araç güvenliği, sürücü eğitimleri ve yük sabitleme kayıtları önemlidir." },
  { code: "52.10.01", title: "Depolama ve antrepo faaliyetleri", dangerClass: "Tehlikeli" as DangerClass, note: "Raf sistemleri, istifleme, forklift yolları ve acil çıkışlar takip edilmelidir." },
  { code: "81.21.01", title: "Genel temizlik hizmetleri", dangerClass: "Tehlikeli" as DangerClass, note: "Kimyasal kullanımı, MSDS ve KKD teslimleri düzenli kontrol ister." },
  { code: "86.21.01", title: "Genel hekimlik uygulamaları", dangerClass: "Az Tehlikeli" as DangerClass, note: "Biyolojik risk, kesici-delici atık ve sağlık kayıtları öne çıkar." },
  { code: "96.02.01", title: "Kuaförlük ve güzellik salonları", dangerClass: "Az Tehlikeli" as DangerClass, note: "Kimyasal maruziyet, hijyen ve ergonomi kontrolleri takip edilmelidir." },
];

export const mykRecords = [
  { code: "12UY0054-3", title: "İnşaat İşçisi", level: "Seviye 3", sector: "İnşaat", mandatory: true, note: "Şantiye girişlerinde mesleki yeterlilik ve İSG eğitimi birlikte takip edilmelidir." },
  { code: "11UY0011-3", title: "Ahşap Kalıpçı", level: "Seviye 3", sector: "İnşaat", mandatory: true, note: "Yüksekte çalışma, iskele ve kalıp güvenliği kontrolleriyle birlikte izlenmelidir." },
  { code: "12UY0056-3", title: "Betonarme Demircisi", level: "Seviye 3", sector: "İnşaat", mandatory: true, note: "Kesici-delici ekipman, kaldırma operasyonu ve eldiven/gözlük KKD kaydı önemlidir." },
  { code: "15UY0215-4", title: "Elektrik Tesisatçısı", level: "Seviye 4", sector: "Elektrik", mandatory: true, note: "Elektrik pano, kilitleme-etiketleme ve yetkili çalışma kayıtlarıyla kontrol edilmelidir." },
  { code: "13UY0145-3", title: "Endüstriyel Taşımacı", level: "Seviye 3", sector: "Lojistik", mandatory: true, note: "Forklift, transpalet, yük sabitleme ve trafik planı kontrolleriyle ilişkilidir." },
  { code: "17UY0264-4", title: "Turizm ve Konaklama Görevlisi", level: "Seviye 4", sector: "Konaklama", mandatory: false, note: "Otel personeli için departman eğitimleri, hijyen ve acil durum planlarıyla izlenebilir." },
  { code: "10UY0003-3", title: "Makine Bakımcı", level: "Seviye 3", sector: "Metal / Bakım", mandatory: true, note: "Bakım izinleri, hareketli aksam koruyucuları ve enerji kesme kayıtları kritik kabul edilir." },
  { code: "16UY0241-3", title: "Temizlik Görevlisi", level: "Seviye 3", sector: "Hizmet", mandatory: false, note: "Kimyasal kullanım talimatı, MSDS ve KKD teslimi ile birlikte takip edilmelidir." },
];

export const requiredCompanyDocs = ["Risk Değerlendirme Raporu", "Acil Durum Eylem Planı", "Yıllık Eğitim Planı", "Yıllık Çalışma Planı"];

export const documentTemplates = [
  "Risk Değerlendirme Raporu",
  "DÖF Formu",
  "Acil Durum Eylem Planı",
  "Yıllık Eğitim Planı",
  "Yıllık Çalışma Planı",
  "Yıllık Değerlendirme Raporu",
  "Çalışan Temsilcisi Atama Tutanağı",
  "Eğitim Katılım Tutanağı",
  "İSG Kurul Toplantı Tutanağı",
  "İşe Giriş Sağlık Muayene Formu",
  "İSG Sertifikası",
  "EK-2",
];
