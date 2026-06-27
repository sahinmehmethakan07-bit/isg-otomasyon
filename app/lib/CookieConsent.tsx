/**
 * CookieConsent.tsx — GDPR-Uyumlu Çerez/Veri İzni Bileşeni (Mobil Uyumlu)
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
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem(CONSENT_KEY);
    if (stored === "accepted") {
      setConsent("accepted");
    }
    const checkMobile = () => setIsMobile(window.innerWidth <= 768);
    checkMobile();
    window.addEventListener("resize", checkMobile);
    setLoading(false);
    return () => window.removeEventListener("resize", checkMobile);
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
        backgroundColor: "#F8F7F4",
        fontFamily: "var(--isg-font-sans)",
        padding: isMobile ? 12 : 20,
      }}>
        <div style={{
          backgroundColor: "#FFFFFF",
          border: "1px solid #FFFFFF",
          borderRadius: 16,
          padding: isMobile ? 20 : 32,
          maxWidth: 480,
          width: "100%",
          textAlign: "center",
        }}>
          <div style={{ fontSize: 40, marginBottom: 16 }}>🔒</div>
          <h2 style={{ fontSize: isMobile ? 16 : 18, fontWeight: 700, color: "#1A1A1A", marginBottom: 12 }}>
            Çerez İzni Gerekli
          </h2>
          <p style={{ fontSize: isMobile ? 13 : 14, color: "#6B7280", lineHeight: 1.6, marginBottom: 20 }}>
            Bu uygulama, oturum yönetimi ve temel işlevler için çerez kullanımını gerektirir.
            Çerezleri kabul etmeden uygulamayı kullanmanız mümkün değildir.
          </p>
          <button
            onClick={() => setConsent("pending")}
            style={{
              backgroundColor: "#1B4332",
              color: "#fff",
              border: "none",
              borderRadius: 10,
              padding: "12px 24px",
              fontSize: 14,
              fontWeight: 600,
              cursor: "pointer",
              width: isMobile ? "100%" : "auto",
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
      alignItems: isMobile ? "flex-start" : "center",
      justifyContent: "center",
      backgroundColor: "#F8F7F4",
      fontFamily: "var(--isg-font-sans)",
      padding: isMobile ? "40px 12px 20px" : 20,
      overflowY: "auto",
    }}>
      <div style={{
        backgroundColor: "#FFFFFF",
        border: "1px solid #FFFFFF",
        borderRadius: isMobile ? 12 : 16,
        padding: isMobile ? 16 : 32,
        maxWidth: 560,
        width: "100%",
      }}>
        {/* Logo */}
        <div style={{ textAlign: "center", marginBottom: isMobile ? 12 : 20 }}>
          <span style={{ fontSize: isMobile ? 28 : 36 }}>🦺</span>
          <h1 style={{ fontSize: isMobile ? 18 : 20, fontWeight: 700, color: "#1A1A1A", marginTop: 8 }}>
            İSG <span style={{ color: "#38bdf8" }}>Otomasyon</span>
          </h1>
        </div>

        <h2 style={{ fontSize: isMobile ? 14 : 16, fontWeight: 700, color: "#1A1A1A", marginBottom: 12 }}>
          🍪 Çerez ve Veri İşleme Politikası
        </h2>

        <p style={{ fontSize: isMobile ? 12 : 13, color: "#6B7280", lineHeight: 1.7, marginBottom: 12 }}>
          Bu uygulama, size güvenli ve işlevsel bir deneyim sunabilmek için belirli verileri
          işlemekte ve çerezler kullanmaktadır. Devam etmeden önce lütfen aşağıdaki bilgileri
          inceleyiniz.
        </p>

        {/* Özet kutuları — Mobil: 1 kolon, Desktop: 2 kolon */}
        <div style={{
          display: "grid",
          gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr",
          gap: isMobile ? 8 : 10,
          marginBottom: 16,
        }}>
          {[
            { icon: "🔐", title: "Oturum Yönetimi", desc: "Güvenli giriş ve tek cihaz kontrolü" },
            { icon: "📋", title: "Form Verileri", desc: "Muayene ve risk değerlendirme kayıtları" },
            { icon: "👤", title: "Kullanıcı Profili", desc: "Rol ve yetki bilgileri" },
            { icon: "📊", title: "İşlem Kayıtları", desc: "Sistem güvenliği için aktivite logları" },
          ].map((item, i) => (
            <div key={i} style={{
              backgroundColor: "#F8F7F4",
              border: "1px solid #FFFFFF",
              borderRadius: 10,
              padding: isMobile ? "8px 12px" : "10px 12px",
              display: isMobile ? "flex" : "block",
              alignItems: "center",
              gap: isMobile ? 10 : 0,
            }}>
              <div style={{ fontSize: isMobile ? 16 : 18, marginBottom: isMobile ? 0 : 4 }}>{item.icon}</div>
              <div>
                <div style={{ fontSize: 12, fontWeight: 600, color: "#e2e8f0", marginBottom: 2 }}>{item.title}</div>
                <div style={{ fontSize: 11, color: "#6B7280" }}>{item.desc}</div>
              </div>
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
            backgroundColor: "#F8F7F4",
            border: "1px solid #FFFFFF",
            borderRadius: 10,
            padding: isMobile ? 12 : 16,
            marginBottom: 16,
            fontSize: isMobile ? 11 : 12,
            color: "#6B7280",
            lineHeight: 1.7,
            maxHeight: isMobile ? 200 : 240,
            overflowY: "auto",
            WebkitOverflowScrolling: "touch",
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

        {/* Butonlar — Mobil: dikey, Desktop: yatay */}
        <div style={{
          display: "flex",
          flexDirection: isMobile ? "column" : "row",
          gap: 10,
          marginTop: 8,
        }}>
          <button
            onClick={handleAcceptAll}
            style={{
              flex: 1,
              backgroundColor: "#1B4332",
              color: "#fff",
              border: "none",
              borderRadius: 10,
              padding: isMobile ? "15px 0" : "13px 0",
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
              flex: isMobile ? 1 : 0.6,
              backgroundColor: "transparent",
              color: "#6B7280",
              border: "1px solid #334155",
              borderRadius: 10,
              padding: isMobile ? "15px 0" : "13px 0",
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

export function hasConsent(): boolean {
  if (typeof window === "undefined") return false;
  return localStorage.getItem(CONSENT_KEY) === "accepted";
}

export function resetConsent(): void {
  localStorage.removeItem(CONSENT_KEY);
  localStorage.removeItem(CONSENT_DATE_KEY);
  window.location.reload();
}
