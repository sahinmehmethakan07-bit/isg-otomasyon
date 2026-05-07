/**
 * LanguageSwitcher.tsx — TR/EN Dil Değiştirme Butonu
 *
 * Sağ üst köşeye yerleştirilir. Tıklayınca dil değişir.
 */

"use client";

import React from "react";
import { Language } from "./i18n";

type Props = {
  lang: Language;
  setLang: (lang: Language) => void;
  style?: React.CSSProperties;
};

export function LanguageSwitcher({ lang, setLang, style }: Props) {
  return (
    <div style={{
      display: "flex",
      alignItems: "center",
      gap: 0,
      borderRadius: 8,
      overflow: "hidden",
      border: "1px solid #334155",
      ...style,
    }}>
      <button
        onClick={() => setLang("tr")}
        style={{
          padding: "5px 10px",
          fontSize: 12,
          fontWeight: lang === "tr" ? 700 : 400,
          backgroundColor: lang === "tr" ? "#0ea5e9" : "transparent",
          color: lang === "tr" ? "#fff" : "#64748b",
          border: "none",
          cursor: "pointer",
          transition: "all 0.2s",
        }}
      >
        TR
      </button>
      <button
        onClick={() => setLang("en")}
        style={{
          padding: "5px 10px",
          fontSize: 12,
          fontWeight: lang === "en" ? 700 : 400,
          backgroundColor: lang === "en" ? "#0ea5e9" : "transparent",
          color: lang === "en" ? "#fff" : "#64748b",
          border: "none",
          cursor: "pointer",
          transition: "all 0.2s",
        }}
      >
        EN
      </button>
    </div>
  );
}
