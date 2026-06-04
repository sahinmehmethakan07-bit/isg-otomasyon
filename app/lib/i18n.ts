/**
 * i18n.ts — Türkçe dil desteği
 */

"use client";

import { useCallback } from "react";

export type Language = "tr";

const translations: Record<string, string> = {
    // Genel
    "app.name": "İSG Otomasyon",
    "app.subtitle": "İş Sağlığı ve Güvenliği Yönetim Sistemi",
    "language": "Dil",
    "save": "Kaydet",
    "cancel": "İptal",
    "delete": "Sil",
    "edit": "Düzenle",
    "view": "Görüntüle",
    "back": "Geri",
    "close": "Kapat",
    "search": "Ara",
    "loading": "Yükleniyor...",
    "yes": "Evet",
    "no": "Hayır",
    "add": "Ekle",
    "new": "Yeni",
    "actions": "İşlemler",
    "required": "Zorunlu alan",
    "success": "Başarılı",
    "error": "Hata",

    // Login
    "login.selectRole": "Giriş türünüzü seçin",
    "login.signIn": "Giriş Yap",
    "login.signingIn": "Giriş yapılıyor...",
    "login.email": "E-posta",
    "login.password": "Şifre",
    "login.emailPlaceholder": "ornek@firma.com",
    "login.passwordPlaceholder": "••••••••",
    "login.singleDevice": "Her hesap aynı anda sadece 1 cihazdan kullanılabilir",
    "login.expired": "Oturum süreniz doldu. Lütfen tekrar giriş yapın.",
    "login.loggedOut": "Başarıyla çıkış yaptınız.",
    "login.noRole": "Hesabınıza bir rol atanmamış. Lütfen admin ile iletişime geçin.",
    "login.roleMismatch": "Seçtiğiniz rol ile hesabınız uyuşmuyor.",
    "login.noProfile": "Hesabınıza henüz rol atanmamış. Lütfen admin ile iletişime geçin.",
    "login.wrongRole": "Bu hesap \"{role}\" olarak kayıtlı. Lütfen doğru girişi seçin.",
    "login.activeSession": "Bu hesap şu anda başka bir cihazda aktif. Giriş yapabilmek için önce diğer cihazdan çıkış yapın.",
    "login.userNotFound": "Bu e-posta adresiyle kayıtlı kullanıcı bulunamadı.",
    "login.wrongPassword": "Şifre hatalı.",
    "login.invalidEmail": "Geçersiz e-posta adresi.",
    "login.tooManyRequests": "Çok fazla başarısız deneme. Lütfen biraz bekleyin.",
    "login.invalidCredential": "E-posta veya şifre hatalı.",
    "login.permissionDenied": "Firestore erişim izni reddedildi. Firestore Rules kontrol edin.",
    "login.unavailable": "Sunucuya bağlanılamıyor. İnternet bağlantınızı kontrol edin.",
    "login.blocked": "Sunucuya bağlanılamıyor. Reklam engelleyiciniz Firebase bağlantısını engelliyor olabilir.",
    "login.failed": "Giriş başarısız",

    // Roller
    "role.admin": "Admin",
    "role.admin.desc": "Tüm kullanıcıların verilerini görür ve yönetir",
    "role.doctor": "Doktor",
    "role.doctor.desc": "Sadece kendi eklediği verileri görür",
    "role.nurse": "Hemşire",
    "role.nurse.desc": "Sadece kendi eklediği verileri görür",
    "role.safety_expert": "İş Güvenliği Uzmanı",
    "role.safety_expert.desc": "İş güvenliği değerlendirmelerini yönetir",
    "role.human_resources": "İnsan Kaynakları",
    "role.human_resources.desc": "Personel girişlerini ve onboarding sürecini yönetir",
    "role.login": "Girişi",

    // Dashboard / Sekmeler
    "tab.companies": "Firmalar",
    "tab.employees": "Çalışanlar",
    "tab.documents": "Belgeler",
    "tab.observers": "Gözlemler",
    "tab.dofs": "DOF",
    "tab.risks": "Riskler",
    "tab.signers": "İmzacılar",
    "tab.ek2": "EK-2 Muayene",
    "tab.users": "Kullanıcılar",
    "tab.settings": "Ayarlar",
    "tab.shifts": "Vardiya",

    // Header
    "header.logout": "Çıkış Yap",
    "header.welcome": "Hoşgeldiniz",

    // Firmalar
    "company.name": "Firma Adı",
    "company.official": "Resmi Unvan",
    "company.sgk": "SGK Sicil No",
    "company.nace": "NACE Kodu",
    "company.danger": "Tehlike Sınıfı",
    "company.employees": "Çalışan Sayısı",
    "company.service": "Hizmet Türü",
    "company.contract": "Sözleşme Bitiş",
    "company.add": "Firma Ekle",

    // Çalışanlar
    "employee.name": "Ad Soyad",
    "employee.tc": "T.C. Kimlik No",
    "employee.birth": "Doğum Tarihi",
    "employee.position": "Pozisyon",
    "employee.department": "Bölüm",
    "employee.startDate": "İşe Giriş Tarihi",
    "employee.company": "Firma",
    "employee.add": "Çalışan Ekle",

    // Kullanıcı Yönetimi
    "users.title": "Kullanıcı Yönetimi",
    "users.new": "+ Yeni Kullanıcı",
    "users.create": "Kullanıcı Oluştur",
    "users.creating": "Oluşturuluyor...",
    "users.name": "Ad Soyad",
    "users.email": "E-posta",
    "users.password": "Şifre",
    "users.role": "Rol",
    "users.changeRole": "Rol Değiştir",
    "users.noUsers": "Henüz kayıtlı kullanıcı yok",
    "users.clientWarning": "Kullanıcı oluşturma işlemi client-side yapılmaktadır. Production ortamında Firebase Cloud Functions kullanılması önerilir.",

    // EK-2 Form
    "ek2.title": "EK-2 İşe Giriş / Periyodik Muayene Formu",
    "ek2.new": "Yeni Muayene Formu",
    "ek2.pdf": "PDF",
    "ek2.pdfDownload": "PDF İndir",
    "ek2.workplace": "İşyeri Bilgileri",
    "ek2.employee": "Çalışan Bilgileri",
    "ek2.history": "Özgeçmiş",
    "ek2.family": "Soygeçmiş",
    "ek2.medical": "Tıbbi Anamnez",
    "ek2.exam": "Fizik Muayene",
    "ek2.lab": "Laboratuvar",
    "ek2.result": "Kanaat ve Sonuç",

    // Cookie Consent
    "cookie.title": "Çerez ve Veri İşleme Politikası",
    "cookie.intro": "Bu uygulama, size güvenli ve işlevsel bir deneyim sunabilmek için belirli verileri işlemekte ve çerezler kullanmaktadır. Devam etmeden önce lütfen aşağıdaki bilgileri inceleyiniz.",
    "cookie.accept": "Kabul Et ve Devam Et",
    "cookie.reject": "Reddet",
    "cookie.required": "Çerez İzni Gerekli",
    "cookie.requiredText": "Bu uygulama, oturum yönetimi ve temel işlevler için çerez kullanımını gerektirir. Çerezleri kabul etmeden uygulamayı kullanmanız mümkün değildir.",
    "cookie.goBack": "Geri Dön",
    "cookie.details": "Detaylı bilgi",
    "cookie.hideDetails": "Detayları gizle",
    "cookie.acceptNote": "\"Kabul Et\" butonuna tıklayarak, yukarıda belirtilen verilerin işlenmesini ve çerez kullanımını onaylamış olursunuz.",
    "cookie.session": "Oturum Yönetimi",
    "cookie.sessionDesc": "Güvenli giriş ve tek cihaz kontrolü",
    "cookie.formData": "Form Verileri",
    "cookie.formDataDesc": "Muayene ve risk değerlendirme kayıtları",
    "cookie.profile": "Kullanıcı Profili",
    "cookie.profileDesc": "Rol ve yetki bilgileri",
    "cookie.logs": "İşlem Kayıtları",
    "cookie.logsDesc": "Sistem güvenliği için aktivite logları",

    // Session
    "session.checking": "Oturum doğrulanıyor...",
    "session.expired": "Oturum Süresi Doldu",
    "session.expiredText": "12 saatlik oturum süreniz doldu. Giriş sayfasına yönlendiriliyorsunuz...",
  };

function interpolate(text: string, params?: Record<string, string>): string {
  if (!params) return text;
  let next = text;
  Object.entries(params).forEach(([key, value]) => {
    next = next.replace(`{${key}}`, value);
  });
  return next;
}

export function useLanguage() {
  const translate = useCallback((key: string, params?: Record<string, string>): string => {
    return interpolate(translations[key] || key, params);
  }, []);

  return {
    lang: "tr" as const,
    setLang: (_lang: Language) => {},
    t: translate,
  };
}

export function getLanguage(): Language {
  return "tr";
}

export function t(key: string, params?: Record<string, string>): string {
  return interpolate(translations[key] || key, params);
}
