"use client";

import React, { useMemo, useState } from "react";
import {
  filterWorkInstructionTemplates,
  workInstructionCategories,
  workInstructionTemplates,
  type WorkInstructionCategoryId,
  type WorkInstructionTemplate,
} from "./workInstructionTemplates";

type WorkInstructionsTabProps = {
  styles: Record<string, React.CSSProperties>;
};

function slugify(value: string) {
  return value
    .toLocaleLowerCase("tr-TR")
    .replace(/ğ/g, "g")
    .replace(/ü/g, "u")
    .replace(/ş/g, "s")
    .replace(/ı/g, "i")
    .replace(/ö/g, "o")
    .replace(/ç/g, "c")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function downloadBlob(content: string | BlobPart[], filename: string, type: string) {
  const blob = new Blob(Array.isArray(content) ? content : [content], { type });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
}

function buildWordDocument(template: WorkInstructionTemplate) {
  const list = (items: string[]) => items.map((item) => `<li>${escapeHtml(item)}</li>`).join("");

  return `<!doctype html>
<html>
<head>
  <meta charset="utf-8" />
  <title>${escapeHtml(template.title)}</title>
  <style>
    body { font-family: Arial, sans-serif; color: #111827; line-height: 1.5; padding: 32px; }
    h1 { color: #0f172a; font-size: 26px; margin-bottom: 4px; }
    h2 { color: #1f2937; font-size: 18px; margin-top: 24px; border-bottom: 1px solid #d1d5db; padding-bottom: 6px; }
    .meta { color: #64748b; margin-bottom: 22px; }
    .box { border: 1px solid #d1d5db; border-radius: 10px; padding: 14px; margin: 14px 0; }
    ul, ol { padding-left: 22px; }
    li { margin-bottom: 6px; }
  </style>
</head>
<body>
  <h1>${escapeHtml(template.title)}</h1>
  <div class="meta">${escapeHtml(template.summary)}</div>
  <div class="box"><strong>Yasal dayanak:</strong> ${escapeHtml(template.legalBasis)}</div>
  <h2>Riskler</h2>
  <ul>${list(template.risks)}</ul>
  <h2>Gerekli KKD</h2>
  <ul>${list(template.ppe)}</ul>
  <h2>Güvenli Çalışma Adımları</h2>
  <ol>${list(template.steps)}</ol>
  <h2>Acil Durum</h2>
  <ul>${list(template.emergency)}</ul>
  <h2>Onay</h2>
  <p>Hazırlayan: ........................................ Tarih: .... / .... / ........</p>
  <p>Çalışan: .......................................... İmza: ..........................................</p>
</body>
</html>`;
}

function buildPdfDefinition(template: WorkInstructionTemplate) {
  return {
    pageSize: "A4",
    pageMargins: [42, 48, 42, 48],
    content: [
      { text: template.title, style: "title" },
      { text: template.summary, style: "muted", margin: [0, 4, 0, 14] },
      {
        table: {
          widths: ["*"],
          body: [[{ text: `Yasal dayanak: ${template.legalBasis}`, style: "notice" }]],
        },
        layout: {
          fillColor: () => "#eef2ff",
          hLineColor: () => "#c7d2fe",
          vLineColor: () => "#c7d2fe",
        },
        margin: [0, 0, 0, 16],
      },
      { text: "Riskler", style: "section" },
      { ul: template.risks, margin: [0, 0, 0, 12] },
      { text: "Gerekli KKD", style: "section" },
      { ul: template.ppe, margin: [0, 0, 0, 12] },
      { text: "Güvenli Çalışma Adımları", style: "section" },
      { ol: template.steps, margin: [0, 0, 0, 12] },
      { text: "Acil Durum", style: "section" },
      { ul: template.emergency, margin: [0, 0, 0, 18] },
      {
        columns: [
          { text: "Hazırlayan\n\n................................", margin: [0, 12, 0, 0] },
          { text: "Çalışan / İmza\n\n................................", margin: [0, 12, 0, 0] },
        ],
      },
    ],
    styles: {
      title: { fontSize: 22, bold: true, color: "#111827" },
      section: { fontSize: 14, bold: true, color: "#1d4ed8", margin: [0, 12, 0, 6] },
      muted: { fontSize: 10, color: "#64748b" },
      notice: { fontSize: 10, color: "#312e81", margin: [8, 8, 8, 8] },
    },
    defaultStyle: {
      fontSize: 10,
      lineHeight: 1.25,
    },
  };
}

export default function WorkInstructionsTab({ styles }: WorkInstructionsTabProps) {
  const [activeCategory, setActiveCategory] = useState<WorkInstructionCategoryId>("all");
  const [query, setQuery] = useState("");
  const [selectedTemplateId, setSelectedTemplateId] = useState<string | null>(null);
  const [downloadingId, setDownloadingId] = useState<string | null>(null);

  const templates = useMemo(
    () => filterWorkInstructionTemplates(activeCategory, query),
    [activeCategory, query]
  );

  const selectedTemplate =
    templates.find((template) => template.id === selectedTemplateId) ?? templates[0] ?? null;

  async function downloadPdf(template: WorkInstructionTemplate) {
    setDownloadingId(`${template.id}-pdf`);
    try {
      const pdfMakeModule = (await import("pdfmake/build/pdfmake")) as any;
      const pdfFontsModule = (await import("pdfmake/build/vfs_fonts")) as any;
      const pdfMake = pdfMakeModule.default || pdfMakeModule;
      pdfMake.vfs =
        pdfFontsModule.pdfMake?.vfs ||
        pdfFontsModule.default?.pdfMake?.vfs ||
        pdfFontsModule.default?.vfs ||
        pdfFontsModule.vfs;

      pdfMake
        .createPdf(buildPdfDefinition(template))
        .download(`${slugify(template.title)}.pdf`);
    } finally {
      setDownloadingId(null);
    }
  }

  function downloadWord(template: WorkInstructionTemplate) {
    downloadBlob(
      buildWordDocument(template),
      `${slugify(template.title)}.doc`,
      "application/msword;charset=utf-8"
    );
  }

  return (
    <div>
      <section style={styles.card}>
        <div style={headerGrid}>
          <div>
            <p style={styles.sectionTitle}>Talimat Kütüphanesi</p>
            <h2 style={pageTitle}>Çalışma Talimatları</h2>
            <p style={mutedText}>
              Hazır şablonlardan profesyonel İSG talimatı oluşturun, inceleyin ve PDF ya da
              Word olarak indirin.
            </p>
          </div>
          <div style={statsGrid}>
            <div style={statCard}><strong>{workInstructionTemplates.length}</strong><span>Şablon</span></div>
            <div style={statCard}><strong>{workInstructionCategories.length - 1}</strong><span>Kategori</span></div>
            <div style={statCard}><strong>PDF</strong><span>Word çıktı</span></div>
          </div>
        </div>
      </section>

      <section style={styles.card}>
        <div style={toolbarGrid}>
          <label style={searchWrap}>
            <span style={labelText}>Talimat ara</span>
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Forklift, kimyasal, elektrik..."
              style={styles.input}
            />
          </label>
          <button type="button" style={secondaryAction}>
            AI ile Üret
            <span style={smallHint}>Sonraki adım</span>
          </button>
        </div>

        <div style={categoryRow}>
          {workInstructionCategories.map((category) => {
            const selected = activeCategory === category.id;
            return (
              <button
                key={category.id}
                type="button"
                onClick={() => setActiveCategory(category.id)}
                  style={{
                    ...categoryButton,
                    ...(selected ? categoryButtonActive : {}),
                  }}
              >
                {category.label}
              </button>
            );
          })}
        </div>
      </section>

      <div style={contentGrid}>
        <section style={styles.card}>
          <div style={listHeader}>
            <div>
              <p style={styles.sectionTitle}>Şablonlar</p>
              <h3 style={panelTitle}>{templates.length} talimat bulundu</h3>
            </div>
          </div>

          {templates.length === 0 ? (
            <div style={emptyState}>Aramaya uygun talimat bulunamadı.</div>
          ) : (
            <div style={templateGrid}>
            {templates.map((template) => {
              const selected = selectedTemplate?.id === template.id;
              const category = workInstructionCategories.find((item) => item.id === template.category);
              return (
                <article
                    key={template.id}
                    style={{
                      ...templateCard,
                      ...(selected ? selectedCard : {}),
                    }}
                  >
                  <div style={templateTopLine}>
                    <span style={categoryBadge}>
                      {category?.label ?? "Talimat"}
                    </span>
                    <span style={iconBadge}>{category?.icon ?? "📋"}</span>
                  </div>
                    <h4 style={templateTitle}>{template.title}</h4>
                    <p style={templateSummary}>{template.summary}</p>
                    <div style={chipRow}>
                      {template.ppe.slice(0, 3).map((item) => (
                        <span key={item} style={miniChip}>{item}</span>
                      ))}
                      {template.ppe.length > 3 ? <span style={miniChip}>+{template.ppe.length - 3}</span> : null}
                    </div>
                    <div style={cardActions}>
                      <button
                        type="button"
                        style={styles.secondaryButton}
                        onClick={() => setSelectedTemplateId(template.id)}
                      >
                        İncele
                      </button>
                      <button
                        type="button"
                        style={styles.primaryButton}
                        onClick={() => downloadPdf(template)}
                        disabled={downloadingId === `${template.id}-pdf`}
                      >
                        {downloadingId === `${template.id}-pdf` ? "Hazırlanıyor" : "PDF"}
                      </button>
                      <button
                        type="button"
                        style={purpleButton}
                        onClick={() => downloadWord(template)}
                      >
                        Word
                      </button>
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </section>

        <aside style={styles.card}>
          {selectedTemplate ? (
            <div>
              <p style={styles.sectionTitle}>Önizleme</p>
              <h3 style={previewTitle}>{selectedTemplate.title}</h3>
              <p style={mutedText}>{selectedTemplate.summary}</p>
              <div style={noticeBox}>{selectedTemplate.legalBasis}</div>
              <PreviewList title="Riskler" items={selectedTemplate.risks} />
              <PreviewList title="KKD" items={selectedTemplate.ppe} />
              <PreviewList title="Adımlar" items={selectedTemplate.steps} ordered />
              <div>
                <PreviewList title="Acil Durum" items={selectedTemplate.emergency} />
              </div>
            </div>
          ) : (
            <div style={emptyState}>Önizleme için bir talimat seçin.</div>
          )}
        </aside>
      </div>
    </div>
  );
}

function PreviewList({ title, items, ordered = false }: { title: string; items: string[]; ordered?: boolean }) {
  const ListTag = ordered ? "ol" : "ul";
  return (
    <div>
      <h4 style={smallTitle}>{title}</h4>
      <ListTag style={previewList}>
        {items.map((item) => (
          <li key={item}>{item}</li>
        ))}
      </ListTag>
    </div>
  );
}

const headerGrid: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "minmax(0, 1fr) auto",
  gap: 24,
  alignItems: "center",
};

const pageTitle: React.CSSProperties = {
  margin: "8px 0",
  fontSize: 32,
  fontWeight: 800,
};

const mutedText: React.CSSProperties = {
  color: "var(--muted)",
  lineHeight: 1.6,
};

const statsGrid: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(3, minmax(100px, 1fr))",
  gap: 12,
};

const statCard: React.CSSProperties = {
  border: "1px solid var(--border)",
  borderRadius: 8,
  padding: "14px 16px",
  background: "var(--surface-strong)",
  display: "grid",
  gap: 4,
  minWidth: 0,
};

const toolbarGrid: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "minmax(240px, 1fr) auto",
  gap: 16,
  alignItems: "end",
};

const searchWrap: React.CSSProperties = {
  display: "grid",
  gap: 8,
  minWidth: 0,
};

const labelText: React.CSSProperties = {
  color: "var(--muted)",
  fontSize: 13,
  fontWeight: 700,
};

const secondaryAction: React.CSSProperties = {
  border: "1px solid rgba(139, 92, 246, 0.48)",
  borderRadius: 8,
  padding: "12px 18px",
  color: "#d8b4fe",
  background: "rgba(88, 28, 135, 0.22)",
  fontWeight: 800,
  display: "grid",
  gap: 2,
  minHeight: 50,
};

const smallHint: React.CSSProperties = {
  color: "var(--muted)",
  fontSize: 11,
  fontWeight: 600,
};

const categoryRow: React.CSSProperties = {
  display: "flex",
  gap: 10,
  overflowX: "auto",
  paddingTop: 18,
};

const categoryButton: React.CSSProperties = {
  border: "1px solid var(--border)",
  borderRadius: 999,
  padding: "10px 14px",
  background: "var(--surface-strong)",
  color: "var(--muted)",
  fontWeight: 800,
  whiteSpace: "nowrap",
};

const categoryButtonActive: React.CSSProperties = {
  background: "linear-gradient(135deg, #2563eb, #7c3aed)",
  color: "white",
  borderColor: "transparent",
};

const contentGrid: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "minmax(0, 1.35fr) minmax(320px, 0.65fr)",
  gap: 18,
  alignItems: "start",
};

const listHeader: React.CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  marginBottom: 16,
};

const panelTitle: React.CSSProperties = {
  margin: "6px 0 0",
  fontSize: 20,
};

const templateGrid: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(270px, 1fr))",
  gap: 14,
};

const templateCard: React.CSSProperties = {
  border: "1px solid var(--border)",
  borderRadius: 8,
  padding: 16,
  background: "var(--surface-strong)",
  display: "grid",
  gap: 12,
  minWidth: 0,
};

const selectedCard: React.CSSProperties = {
  borderColor: "rgba(96, 165, 250, 0.8)",
  boxShadow: "0 0 0 1px rgba(96, 165, 250, 0.22)",
};

const templateTopLine: React.CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  gap: 10,
  alignItems: "center",
};

const categoryBadge: React.CSSProperties = {
  color: "#93c5fd",
  border: "1px solid rgba(59, 130, 246, 0.35)",
  background: "rgba(37, 99, 235, 0.16)",
  borderRadius: 999,
  padding: "5px 9px",
  fontSize: 12,
  fontWeight: 800,
};

const iconBadge: React.CSSProperties = {
  fontSize: 20,
};

const templateTitle: React.CSSProperties = {
  margin: 0,
  fontSize: 18,
  lineHeight: 1.25,
};

const templateSummary: React.CSSProperties = {
  color: "var(--muted)",
  lineHeight: 1.55,
  margin: 0,
};

const chipRow: React.CSSProperties = {
  display: "flex",
  gap: 6,
  flexWrap: "wrap",
};

const miniChip: React.CSSProperties = {
  background: "rgba(15, 23, 42, 0.45)",
  border: "1px solid var(--border)",
  borderRadius: 6,
  color: "var(--muted)",
  padding: "4px 7px",
  fontSize: 11,
};

const cardActions: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "1fr 1fr 1fr",
  gap: 8,
  marginTop: 4,
};

const purpleButton: React.CSSProperties = {
  border: "1px solid rgba(124, 58, 237, 0.6)",
  borderRadius: 8,
  padding: "10px 12px",
  background: "linear-gradient(135deg, #4f46e5, #7c3aed)",
  color: "white",
  fontWeight: 800,
};

const previewTitle: React.CSSProperties = {
  margin: "8px 0",
  fontSize: 24,
};

const noticeBox: React.CSSProperties = {
  border: "1px solid rgba(59, 130, 246, 0.35)",
  borderRadius: 8,
  padding: 14,
  background: "rgba(37, 99, 235, 0.12)",
  color: "#bfdbfe",
  margin: "16px 0",
  lineHeight: 1.5,
};

const smallTitle: React.CSSProperties = {
  margin: "18px 0 8px",
  fontSize: 14,
  letterSpacing: 0,
  textTransform: "uppercase",
  color: "var(--muted)",
};

const previewList: React.CSSProperties = {
  color: "var(--text)",
  paddingLeft: 22,
  lineHeight: 1.55,
};

const emptyState: React.CSSProperties = {
  border: "1px dashed var(--border)",
  borderRadius: 8,
  padding: 28,
  color: "var(--muted)",
  textAlign: "center",
};
