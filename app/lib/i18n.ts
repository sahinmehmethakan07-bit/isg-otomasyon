/**
 * i18n.ts — Çok Dilli Destek (Türkçe / İngilizce)
 *
 * Kullanım:
 *   import { useLanguage, t } from "./i18n";
 *   const { lang, setLang, t } = useLanguage();
 *   t("login.title") → "Giriş Yap" veya "Sign In"
 */

"use client";

import { useState, useEffect, useCallback } from "react";

export type Language = "tr" | "en";

const LANG_KEY = "isg_language";

// ── Çeviri Sözlüğü ──────────────────────────────────────────────────────────

const translations: Record<Language, Record<string, string>> = {
  tr: {
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
  },

  en: {
    // General
    "app.name": "OHS Automation",
    "app.subtitle": "Occupational Health and Safety Management System",
    "language": "Language",
    "save": "Save",
    "cancel": "Cancel",
    "delete": "Delete",
    "edit": "Edit",
    "view": "View",
    "back": "Back",
    "close": "Close",
    "search": "Search",
    "loading": "Loading...",
    "yes": "Yes",
    "no": "No",
    "add": "Add",
    "new": "New",
    "actions": "Actions",
    "required": "Required field",
    "success": "Success",
    "error": "Error",

    // Login
    "login.selectRole": "Select your login type",
    "login.signIn": "Sign In",
    "login.signingIn": "Signing in...",
    "login.email": "Email",
    "login.password": "Password",
    "login.emailPlaceholder": "example@company.com",
    "login.passwordPlaceholder": "••••••••",
    "login.singleDevice": "Each account can only be used on 1 device at a time",
    "login.expired": "Your session has expired. Please sign in again.",
    "login.loggedOut": "You have been logged out successfully.",
    "login.noRole": "No role has been assigned to your account. Please contact the administrator.",
    "login.roleMismatch": "Your selected role does not match your account.",
    "login.noProfile": "No role has been assigned to your account yet. Please contact the administrator.",
    "login.wrongRole": "This account is registered as \"{role}\". Please select the correct login.",
    "login.activeSession": "This account is currently active on another device. Please log out from the other device first.",
    "login.userNotFound": "No user found with this email address.",
    "login.wrongPassword": "Incorrect password.",
    "login.invalidEmail": "Invalid email address.",
    "login.tooManyRequests": "Too many failed attempts. Please wait a moment.",
    "login.invalidCredential": "Email or password is incorrect.",
    "login.permissionDenied": "Firestore access denied. Check Firestore Rules.",
    "login.unavailable": "Unable to connect to server. Check your internet connection.",
    "login.blocked": "Unable to connect to server. Your ad blocker may be blocking Firebase connections.",
    "login.failed": "Login failed",

    // Roles
    "role.admin": "Admin",
    "role.admin.desc": "Views and manages all users' data",
    "role.doctor": "Doctor",
    "role.doctor.desc": "Views only their own data",
    "role.nurse": "Nurse",
    "role.nurse.desc": "Views only their own data",
    "role.safety_expert": "Safety Expert",
    "role.safety_expert.desc": "Manages occupational safety assessments",
    "role.login": "Login",

    // Dashboard / Tabs
    "tab.companies": "Companies",
    "tab.employees": "Employees",
    "tab.documents": "Documents",
    "tab.observers": "Observations",
    "tab.dofs": "DOF",
    "tab.risks": "Risks",
    "tab.signers": "Signers",
    "tab.ek2": "EK-2 Examination",
    "tab.users": "Users",
    "tab.settings": "Settings",
    "tab.shifts": "Shifts",

    // Header
    "header.logout": "Log Out",
    "header.welcome": "Welcome",

    // Companies
    "company.name": "Company Name",
    "company.official": "Official Title",
    "company.sgk": "SSI Registration No",
    "company.nace": "NACE Code",
    "company.danger": "Hazard Class",
    "company.employees": "Employee Count",
    "company.service": "Service Type",
    "company.contract": "Contract End",
    "company.add": "Add Company",

    // Employees
    "employee.name": "Full Name",
    "employee.tc": "National ID No",
    "employee.birth": "Date of Birth",
    "employee.position": "Position",
    "employee.department": "Department",
    "employee.startDate": "Start Date",
    "employee.company": "Company",
    "employee.add": "Add Employee",

    // User Management
    "users.title": "User Management",
    "users.new": "+ New User",
    "users.create": "Create User",
    "users.creating": "Creating...",
    "users.name": "Full Name",
    "users.email": "Email",
    "users.password": "Password",
    "users.role": "Role",
    "users.changeRole": "Change Role",
    "users.noUsers": "No registered users yet",
    "users.clientWarning": "User creation is done client-side. For production, Firebase Cloud Functions is recommended.",

    // EK-2 Form
    "ek2.title": "EK-2 Pre-Employment / Periodic Examination Form",
    "ek2.new": "New Examination Form",
    "ek2.pdf": "PDF",
    "ek2.pdfDownload": "Download PDF",
    "ek2.workplace": "Workplace Information",
    "ek2.employee": "Employee Information",
    "ek2.history": "Medical History",
    "ek2.family": "Family History",
    "ek2.medical": "Medical Anamnesis",
    "ek2.exam": "Physical Examination",
    "ek2.lab": "Laboratory",
    "ek2.result": "Opinion and Result",

    // Cookie Consent
    "cookie.title": "Cookie and Data Processing Policy",
    "cookie.intro": "This application processes certain data and uses cookies to provide you with a secure and functional experience. Please review the information below before continuing.",
    "cookie.accept": "Accept and Continue",
    "cookie.reject": "Reject",
    "cookie.required": "Cookie Consent Required",
    "cookie.requiredText": "This application requires cookies for session management and basic functionality. You cannot use the application without accepting cookies.",
    "cookie.goBack": "Go Back",
    "cookie.details": "More details",
    "cookie.hideDetails": "Hide details",
    "cookie.acceptNote": "By clicking \"Accept\", you consent to the processing of the data described above and the use of cookies.",
    "cookie.session": "Session Management",
    "cookie.sessionDesc": "Secure login and single device control",
    "cookie.formData": "Form Data",
    "cookie.formDataDesc": "Examination and risk assessment records",
    "cookie.profile": "User Profile",
    "cookie.profileDesc": "Role and authorization information",
    "cookie.logs": "Activity Logs",
    "cookie.logsDesc": "Activity logs for system security",

    // Session
    "session.checking": "Verifying session...",
    "session.expired": "Session Expired",
    "session.expiredText": "Your 12-hour session has expired. Redirecting to login page...",
  },
};

// ── Hook ─────────────────────────────────────────────────────────────────────

export function useLanguage() {
  const [lang, setLangState] = useState<Language>("tr");

  useEffect(() => {
    const stored = localStorage.getItem(LANG_KEY) as Language | null;
    if (stored === "tr" || stored === "en") {
      setLangState(stored);
    }
  }, []);

  const setLang = useCallback((newLang: Language) => {
    setLangState(newLang);
    localStorage.setItem(LANG_KEY, newLang);
  }, []);

  const t = useCallback((key: string, params?: Record<string, string>): string => {
    let text = translations[lang][key] || translations["tr"][key] || key;
    if (params) {
      Object.entries(params).forEach(([k, val]) => {
        text = text.replace(`{${k}}`, val);
      });
    }
    return text;
  }, [lang]);

  return { lang, setLang, t };
}

// ── Standalone t function (hook dışında kullanım için) ───────────────────────

export function getLanguage(): Language {
  if (typeof window === "undefined") return "tr";
  const stored = localStorage.getItem(LANG_KEY) as Language | null;
  return stored === "en" ? "en" : "tr";
}

export function t(key: string, params?: Record<string, string>): string {
  const lang = getLanguage();
  let text = translations[lang][key] || translations["tr"][key] || key;
  if (params) {
    Object.entries(params).forEach(([k, val]) => {
      text = text.replace(`{${k}}`, val);
    });
  }
  return text;
}
