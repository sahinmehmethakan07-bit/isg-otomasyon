/**
 * CookieConsent.tsx — GDPR-Uyumlu Çerez/Veri İzni Bileşeni
 *
 * Kullanıcı ilk kez siteye girdiğinde gösterilir.
 * Kabul edene kadar uygulama kullanılamaz.
 * Tercih localStorage'da saklanır.
 *
 * Türkçe — ISG Otomasyon'a özel
 */

"use client";

import React, { useState, useEffect } from "react";

const CONSENT_KEY = "isg_cookie_consent";
const CONSENT_DATE_KEY = "isg_cookie_consent_date";

type ConsentStatus = "pending" | "accepted" | "rejected";

export function CookieConsent({ children }: { children: React.ReactNode }) {
  const [consent, setConsent] = useState<ConsentStatus>("pending");
  const [showDetails, setShowDetails] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const stored = localStorage.getItem(CONSENT_KEY);
    if (stored === "accepted") {
      setConsent("accepted");
    }
    setLoading(false);
  }, []);

  function handleAcceptAll() {
    localStorage.setItem(CONSENT_KEY, "accepted");
    localStorage.setItem(CONSENT_DATE_KEY, new Date().toISOString());
    setConsent("accepted");
  }

  function handleReject() {
    setConsent("rejected");
  }

  if (loading) return null;

  if (consent === "accepted") {
    return <>{children}</>;
  }

  if (consent === "rejected") {
    return (
      <div style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: "#0a0e1a",
        fontFamily: "'IBM Plex Sans', system-ui, sans-serif",
        padding: 20,
      }}>
        <div style={{
          backgroundColor: "#111827",
          border: "1px solid #1e293b",
          borderRadius: 16,
          padding: 32,
          maxWidth: 480,
          textAlign: "center",
        }}>
          <div style={{ fontSize: 40, marginBottom: 16 }}>🔒</div>
          <h2 style={{ fontSize: 18, fontWeight: 700, color: "#f1f5f9", marginBottom: 12 }}>
            Çerez İzni Gerekli
          </h2>
          <p style={{ fontSize: 14, color: "#94a3b8", lineHeight: 1.6, marginBottom: 20 }}>
            Bu uygulama, oturum yönetimi ve temel işlevler için çerez kullanımını gerektirir.
            Çerezleri kabul etmeden uygulamayı kullanmanız mümkün değildir.
          </p>
          <button
            onClick={() => setConsent("pending")}
            style={{
              backgroundColor: "#0ea5e9",
              color: "#fff",
              border: "none",
              borderRadius: 10,
              padding: "12px 24px",
              fontSize: 14,
              fontWeight: 600,
              cursor: "pointer",
            }}
          >
            Geri Dön
          </button>
        </div>
      </div>
    );
  }

  // ── CONSENT BANNER ──
  return (
    <div style={{
      minHeight: "100vh",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: "#0a0e1a",
      fontFamily: "'IBM Plex Sans', system-ui, sans-serif",
      padding: 20,
    }}>
      <div style={{
        backgroundColor: "#111827",
        border: "1px solid #1e293b",
        borderRadius: 16,
        padding: 32,
        maxWidth: 560,
        width: "100%",
      }}>
        {/* Logo */}
        <div style={{ textAlign: "center", marginBottom: 20 }}>
          <span style={{ fontSize: 36 }}>🦺</span>
          <h1 style={{ fontSize: 20, fontWeight: 700, color: "#f1f5f9", marginTop: 8 }}>
            İSG <span style={{ color: "#38bdf8" }}>Otomasyon</span>
          </h1>
        </div>

        <h2 style={{ fontSize: 16, fontWeight: 700, color: "#f1f5f9", marginBottom: 12 }}>
          🍪 Çerez ve Veri İşleme Politikası
        </h2>

        <p style={{ fontSize: 13, color: "#94a3b8", lineHeight: 1.7, marginBottom: 12 }}>
          Bu uygulama, size güvenli ve işlevsel bir deneyim sunabilmek için belirli verileri
          işlemekte ve çerezler kullanmaktadır. Devam etmeden önce lütfen aşağıdaki bilgileri
          inceleyiniz.
        </p>

        {/* Özet kutuları */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 16 }}>
          {[
            { icon: "🔐", title: "Oturum Yönetimi", desc: "Güvenli giriş ve tek cihaz kontrolü" },
            { icon: "📋", title: "Form Verileri", desc: "Muayene ve risk değerlendirme kayıtları" },
            { icon: "👤", title: "Kullanıcı Profili", desc: "Rol ve yetki bilgileri" },
            { icon: "📊", title: "İşlem Kayıtları", desc: "Sistem güvenliği için aktivite logları" },
          ].map((item, i) => (
            <div key={i} style={{
              backgroundColor: "#0f172a",
              border: "1px solid #1e293b",
              borderRadius: 10,
              padding: "10px 12px",
            }}>
              <div style={{ fontSize: 18, marginBottom: 4 }}>{item.icon}</div>
              <div style={{ fontSize: 12, fontWeight: 600, color: "#e2e8f0", marginBottom: 2 }}>{item.title}</div>
              <div style={{ fontSize: 11, color: "#64748b" }}>{item.desc}</div>
            </div>
          ))}
        </div>

        {/* Detaylı bilgi */}
        <button
          onClick={() => setShowDetails(!showDetails)}
          style={{
            background: "none",
            border: "none",
            color: "#38bdf8",
            fontSize: 12,
            cursor: "pointer",
            padding: 0,
            marginBottom: 12,
            textDecoration: "underline",
          }}
        >
          {showDetails ? "Detayları gizle ▲" : "Detaylı bilgi ▼"}
        </button>

        {showDetails && (
          <div style={{
            backgroundColor: "#0f172a",
            border: "1px solid #1e293b",
            borderRadius: 10,
            padding: 16,
            marginBottom: 16,
            fontSize: 12,
            color: "#94a3b8",
            lineHeight: 1.7,
            maxHeight: 240,
            overflowY: "auto",
          }}>
            <p style={{ fontWeight: 600, color: "#e2e8f0", marginBottom: 8 }}>
              1. İşlenen Veriler
            </p>
            <p style={{ marginBottom: 8 }}>
              • <strong>Kimlik bilgileri:</strong> Ad-soyad, e-posta adresi, kullanıcı rolü (doktor/hemşire/admin)
            </p>
            <p style={{ marginBottom: 8 }}>
              • <strong>Oturum verileri:</strong> Tarayıcı bilgisi (user agent), ekran çözünürlüğü, IP adresi, oturum tokeni
            </p>
            <p style={{ marginBottom: 8 }}>
              • <strong>Sağlık verileri:</strong> Çalışan muayene formları (EK-2), risk değerlendirmeleri, iş sağlığı ve güvenliği kayıtları
            </p>
            <p style={{ marginBottom: 8 }}>
              • <strong>Firma bilgileri:</strong> İşyeri unvanı, SGK sicil numarası, adres ve iletişim bilgileri
            </p>

            <p style={{ fontWeight: 600, color: "#e2e8f0", marginBottom: 8, marginTop: 12 }}>
              2. Verilerin İşlenme Amacı
            </p>
            <p style={{ marginBottom: 8 }}>
              Toplanan veriler yalnızca iş sağlığı ve güvenliği mevzuatı kapsamında yasal yükümlülüklerin yerine
              getirilmesi, çalışan sağlık takibi ve işyeri güvenlik yönetimi amacıyla işlenmektedir.
            </p>

            <p style={{ fontWeight: 600, color: "#e2e8f0", marginBottom: 8, marginTop: 12 }}>
              3. Veri Saklama
            </p>
            <p style={{ marginBottom: 8 }}>
              Veriler Google Firebase (Firestore) altyapısında, şifrelenmiş olarak saklanmaktadır.
              Oturum verileri 12 saat sonra otomatik olarak silinir. Sağlık ve iş güvenliği kayıtları
              yasal saklama süreleri boyunca muhafaza edilir.
            </p>

            <p style={{ fontWeight: 600, color: "#e2e8f0", marginBottom: 8, marginTop: 12 }}>
              4. Çerez Kullanımı
            </p>
            <p style={{ marginBottom: 8 }}>
              • <strong>isg_session:</strong> Oturum yönetimi çerezi (zorunlu, 12 saat geçerli)
            </p>
            <p style={{ marginBottom: 8 }}>
              • <strong>isg_cookie_consent:</strong> Çerez tercih kaydı (zorunlu)
            </p>
            <p>
              Bu uygulama reklam veya analitik amaçlı üçüncü taraf çerezleri kullanmamaktadır.
            </p>

            <p style={{ fontWeight: 600, color: "#e2e8f0", marginBottom: 8, marginTop: 12 }}>
              5. Yasal Dayanak ve Uyumluluk
            </p>
            <p style={{ marginBottom: 8 }}>
              Verileriniz, bulunduğunuz ülkenin geçerli veri koruma mevzuatına uygun olarak işlenmektedir:
            </p>
            <p style={{ marginBottom: 4 }}>
              • <strong>Türkiye:</strong> 6698 sayılı Kişisel Verilerin Korunması Kanunu (KVKK)
            </p>
            <p style={{ marginBottom: 4 }}>
              • <strong>Avrupa Birliği / AEA:</strong> Genel Veri Koruma Tüzüğü (GDPR / DSGVO)
            </p>
            <p style={{ marginBottom: 4 }}>
              • <strong>Diğer ülkeler:</strong> Uluslararası veri koruma standartları ve yerel mevzuat
            </p>
            <p style={{ marginTop: 8 }}>
              Kişisel verilerinize erişim, düzeltme, silme ve işlemeye itiraz etme haklarınız saklıdır.
              Bu haklarınızı kullanmak için sistem yöneticinize başvurabilirsiniz.
            </p>
          </div>
        )}

        {/* Butonlar */}
        <div style={{ display: "flex", gap: 10, marginTop: 8 }}>
          <button
            onClick={handleAcceptAll}
            style={{
              flex: 1,
              backgroundColor: "#0ea5e9",
              color: "#fff",
              border: "none",
              borderRadius: 10,
              padding: "13px 0",
              fontSize: 14,
              fontWeight: 600,
              cursor: "pointer",
            }}
          >
            Kabul Et ve Devam Et
          </button>
          <button
            onClick={handleReject}
            style={{
              flex: 0.6,
              backgroundColor: "transparent",
              color: "#64748b",
              border: "1px solid #334155",
              borderRadius: 10,
              padding: "13px 0",
              fontSize: 13,
              cursor: "pointer",
            }}
          >
            Reddet
          </button>
        </div>

        <p style={{ fontSize: 10, color: "#475569", marginTop: 12, textAlign: "center", lineHeight: 1.5 }}>
          "Kabul Et" butonuna tıklayarak, yukarıda belirtilen verilerin işlenmesini ve çerez
          kullanımını onaylamış olursunuz.
        </p>
      </div>
    </div>
  );
}

/**
 * Consent durumunu kontrol etmek için yardımcı fonksiyon
 */
export function hasConsent(): boolean {
  if (typeof window === "undefined") return false;
  return localStorage.getItem(CONSENT_KEY) === "accepted";
}

/**
 * Consent'i sıfırlamak için (ayarlardan kullanılabilir)
 */
export function resetConsent(): void {
  localStorage.removeItem(CONSENT_KEY);
  localStorage.removeItem(CONSENT_DATE_KEY);
  window.location.reload();
}
