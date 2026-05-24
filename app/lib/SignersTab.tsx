import React from "react";
import type { Company, Signer, SignerRole } from "./types";

type SignersTabProps = {
  styles: Record<string, React.CSSProperties>;
  companies: Company[];
  signers: Signer[];
  isAdmin: boolean;
  addSigner: (companyId: string, role: SignerRole, fullName: string) => Promise<void>;
  deleteSigner: (id: string) => Promise<void>;
};

const signerRoles: SignerRole[] = ["İş Güvenliği Uzmanı", "İşveren / İşveren Vekili", "Çalışan Temsilcisi"];

export function SignersTab({ styles, companies, signers, isAdmin, addSigner, deleteSigner }: SignersTabProps) {
  return (
    <div>
      <div style={styles.card} className="isg-card">
        <p style={styles.sectionTitle} className="isg-text-muted">İmzacı Yönetimi</p>
        <p style={{ fontSize: 12, color: "var(--isg-text-muted)", marginBottom: 16 }}>
          Her firma için PDF raporlarında görünecek 3 imzacıyı belirleyin: İş Güvenliği Uzmanı, İşveren/İşveren Vekili ve Çalışan Temsilcisi.
          {!isAdmin && " Bu ekranda yalnızca size atanmış firmaların imzacıları görünür."}
        </p>

        {companies.map(company => {
          const compSigners = signers.filter(s => s.companyId === company.id);

          return (
            <div key={company.id} style={{ ...styles.card, marginBottom: 12 }} className="isg-card">
              <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 12, color: "var(--isg-text)" }}>{company.nickName}</div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(min(240px, 100%), 1fr))", gap: 12 }}>
                {signerRoles.map(role => {
                  const existing = compSigners.find(s => s.role === role);
                  return (
                    <div key={role} style={{ backgroundColor: "var(--isg-input-bg)", border: "1px solid var(--isg-border)", borderRadius: 8, padding: 12 }}>
                      <div style={{ fontSize: 11, fontWeight: 600, color: "var(--isg-text-muted)", marginBottom: 8 }}>{role}</div>
                      {existing ? (
                        <div>
                          <div style={{ fontSize: 14, fontWeight: 700, color: "var(--isg-text)", marginBottom: 8 }}>{existing.fullName}</div>
                          <div style={{ display: "flex", gap: 6 }}>
                            <button style={styles.btnDanger} onClick={() => deleteSigner(existing.id)}>Sil</button>
                          </div>
                        </div>
                      ) : (
                        <div>
                          <input
                            style={styles.input}
                            className="isg-input"
                            placeholder="Ad Soyad girin..."
                            onKeyDown={async (e) => {
                              if (e.key === "Enter" && (e.target as HTMLInputElement).value.trim()) {
                                const input = e.target as HTMLInputElement;
                                const name = input.value.trim();
                                await addSigner(company.id, role, name);
                                input.value = "";
                              }
                            }}
                          />
                          <div style={{ fontSize: 10, color: "var(--isg-text-muted)", marginTop: 4 }}>Enter ile kaydet</div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
