import React, { useMemo, useState } from "react";
import { mykRecords, naceRecords } from "./constants";
import type { Company, DangerClass, Employee } from "./types";

type Styles = Record<string, React.CSSProperties>;

function LookupBadge({ styles, text, color }: { styles: Styles; text: string; color: string }) {
  return <span style={{ ...styles.badge, backgroundColor: color + "22", color, border: "1px solid " + color + "44" }}>{text}</span>;
}

export function NaceLookupTab({
  styles,
  compactLayout,
  isAdmin,
  onApplyToCompany,
}: {
  styles: Styles;
  compactLayout: boolean;
  isAdmin: boolean;
  onApplyToCompany: (code: string, dangerClass: DangerClass) => void;
}) {
  const [naceSearch, setNaceSearch] = useState("");
  const filteredNaceRecords = useMemo(() => {
    const term = naceSearch.trim().toLowerCase();
    if (!term) return naceRecords;
    return naceRecords.filter(record =>
      [record.code, record.title, record.dangerClass, record.note].join(" ").toLowerCase().includes(term)
    );
  }, [naceSearch]);

  return (
    <div>
      <div style={styles.card} className="isg-card">
        <p style={styles.sectionTitle} className="isg-text-muted">NACE Sorgula</p>
        <div style={{ color: "var(--isg-text-muted)", fontSize: 13, lineHeight: 1.55, marginBottom: 16 }}>
          NACE kodu, faaliyet adı veya tehlike sınıfına göre hızlı arama yapın. Firma oluştururken kodu seçip forma aktarabilirsiniz.
        </div>
        <div style={styles.searchBar}>
          <input
            style={{ ...styles.input, maxWidth: 420 }}
            className="isg-input"
            placeholder="Örn. otel, 55.10.01, tehlikeli..."
            value={naceSearch}
            onChange={e => setNaceSearch(e.target.value)}
          />
          <span style={{ color: "var(--isg-text-muted)", fontSize: 13 }}>{filteredNaceRecords.length} sonuç</span>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: compactLayout ? "1fr" : "repeat(auto-fit, minmax(280px, 1fr))", gap: 14 }}>
        {filteredNaceRecords.map(record => {
          const color = record.dangerClass === "Çok Tehlikeli" ? "#dc2626" : record.dangerClass === "Tehlikeli" ? "#d97706" : "#16a34a";
          return (
            <div key={record.code} style={styles.card} className="isg-card">
              <div style={{ display: "flex", justifyContent: "space-between", gap: 12, alignItems: "flex-start", marginBottom: 10 }}>
                <div>
                  <div style={{ fontSize: 20, fontWeight: 900, color: "var(--isg-text)", marginBottom: 4 }}>{record.code}</div>
                  <div style={{ color: "var(--isg-text-muted)", fontSize: 13, lineHeight: 1.45 }}>{record.title}</div>
                </div>
                <LookupBadge styles={styles} text={record.dangerClass} color={color} />
              </div>
              <p style={{ color: "var(--isg-text-muted)", fontSize: 13, lineHeight: 1.55, minHeight: 42, margin: "0 0 14px" }}>
                {record.note}
              </p>
              {isAdmin && (
                <button style={styles.btnSecondary} onClick={() => onApplyToCompany(record.code, record.dangerClass)}>
                  Firma Formuna Aktar
                </button>
              )}
            </div>
          );
        })}
        {filteredNaceRecords.length === 0 && (
          <div style={{ ...styles.card, color: "var(--isg-text-muted)", fontSize: 13 }} className="isg-card">
            Aradığınız kriterlere uygun NACE kaydı bulunamadı.
          </div>
        )}
      </div>
    </div>
  );
}

export function MykLookupTab({
  styles,
  compactLayout,
  companies,
  employees,
  onOpenEmployee,
}: {
  styles: Styles;
  compactLayout: boolean;
  companies: Company[];
  employees: Employee[];
  onOpenEmployee: (employeeId: string) => void;
}) {
  const [mykSearch, setMykSearch] = useState("");
  const filteredMykRecords = useMemo(() => {
    const term = mykSearch.trim().toLowerCase();
    if (!term) return mykRecords;
    return mykRecords.filter(record =>
      [record.code, record.title, record.level, record.sector, record.note].join(" ").toLowerCase().includes(term)
    );
  }, [mykSearch]);
  const mykMatchedEmployees = useMemo(() => {
    const term = mykSearch.trim().toLowerCase();
    if (!term) return employees.slice(0, 6);
    return employees.filter(employee =>
      [employee.firstName, employee.lastName, employee.title || "", employee.profession || "", employee.department || ""].join(" ").toLowerCase().includes(term)
    ).slice(0, 8);
  }, [employees, mykSearch]);

  return (
    <div>
      <div style={styles.card} className="isg-card">
        <p style={styles.sectionTitle} className="isg-text-muted">MYK Sorgula</p>
        <div style={{ color: "var(--isg-text-muted)", fontSize: 13, lineHeight: 1.55, marginBottom: 16 }}>
          Meslek, yeterlilik kodu veya sektör bilgisine göre arama yapın. Aynı arama metni personel unvanlarıyla da eşleştirilir.
        </div>
        <div style={styles.searchBar}>
          <input
            style={{ ...styles.input, maxWidth: 420 }}
            className="isg-input"
            placeholder="Örn. elektrik, kalıpçı, lojistik..."
            value={mykSearch}
            onChange={e => setMykSearch(e.target.value)}
          />
          <span style={{ color: "var(--isg-text-muted)", fontSize: 13 }}>{filteredMykRecords.length} yeterlilik</span>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: compactLayout ? "1fr" : "minmax(0, 1.4fr) minmax(320px, 0.8fr)", gap: 16, alignItems: "start" }}>
        <div style={{ display: "grid", gap: 14 }}>
          {filteredMykRecords.map(record => (
            <div key={record.code} style={styles.card} className="isg-card">
              <div style={{ display: "flex", justifyContent: "space-between", gap: 12, alignItems: "flex-start", marginBottom: 10 }}>
                <div>
                  <div style={{ fontSize: 18, fontWeight: 900, color: "var(--isg-text)", marginBottom: 4 }}>{record.title}</div>
                  <div style={{ color: "var(--isg-text-muted)", fontSize: 12 }}>{record.code} · {record.level} · {record.sector}</div>
                </div>
                <LookupBadge styles={styles} text={record.mandatory ? "Zorunlu" : "Takip Edilebilir"} color={record.mandatory ? "#dc2626" : "#0ea5e9"} />
              </div>
              <p style={{ color: "var(--isg-text-muted)", fontSize: 13, lineHeight: 1.55, margin: 0 }}>{record.note}</p>
            </div>
          ))}
          {filteredMykRecords.length === 0 && (
            <div style={{ ...styles.card, color: "var(--isg-text-muted)", fontSize: 13 }} className="isg-card">
              Aradığınız kriterlere uygun MYK kaydı bulunamadı.
            </div>
          )}
        </div>

        <div style={styles.card} className="isg-card">
          <p style={styles.sectionTitle} className="isg-text-muted">Personel Eşleşmeleri</p>
          <div style={{ color: "var(--isg-text-muted)", fontSize: 13, lineHeight: 1.55, marginBottom: 12 }}>
            Arama metnine göre mevcut personel unvanı, meslek dalı ve birim alanları taranır.
          </div>
          <div style={{ display: "grid", gap: 8 }}>
            {mykMatchedEmployees.map(employee => {
              const company = companies.find(c => c.id === employee.companyId);
              return (
                <button
                  key={employee.id}
                  type="button"
                  onClick={() => onOpenEmployee(employee.id)}
                  style={{
                    ...styles.btnSecondary,
                    justifyContent: "space-between",
                    textAlign: "left",
                    width: "100%",
                    gap: 10,
                  }}
                >
                  <span>
                    <strong style={{ display: "block", color: "var(--isg-text)" }}>{employee.firstName} {employee.lastName}</strong>
                    <span style={{ color: "var(--isg-text-muted)", fontSize: 12 }}>{employee.title || employee.profession || "Unvan girilmedi"} · {company?.nickName || "Firma yok"}</span>
                  </span>
                  <span style={{ color: "var(--isg-text-subtle)", fontSize: 12 }}>Aç</span>
                </button>
              );
            })}
            {mykMatchedEmployees.length === 0 && (
              <div style={{ color: "var(--isg-text-muted)", fontSize: 13 }}>Eşleşen personel bulunamadı.</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
