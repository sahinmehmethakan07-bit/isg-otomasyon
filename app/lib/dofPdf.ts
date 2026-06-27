import type { Company, DofRecord, Observer, Signer } from "./types";

type DofPdfContext = {
  companies: Company[];
  observers: Observer[];
  signers: Signer[];
};

export async function generateDofPDF(
  dof: DofRecord,
  { companies, observers, signers }: DofPdfContext,
  returnBase64?: boolean
): Promise<string | void> {
  const pdfMake = (await import("pdfmake/build/pdfmake")) as any;
  const pdfFonts = (await import("pdfmake/build/vfs_fonts")) as any;
  const maker = pdfMake.default || pdfMake;
  maker.vfs = (pdfFonts.default || pdfFonts).vfs;

  const company = companies.find(c => c.id === dof.companyId);
  const observer = observers.find(o => o.id === dof.observerId);
  const companySigners = signers.filter(s => s.companyId === dof.companyId);
  const today = new Date().toLocaleDateString("tr-TR");
  const HL = "#FFFFFF";
  const BORDER = "#d1d5db";

  const thCell = (t: string) => ({ text: t, fontSize: 7, bold: true, color: "white", fillColor: HL, margin: [3, 4, 3, 4] as [number, number, number, number] });
  const tdCell = (t: string, opts?: any) => ({ text: t || "—", fontSize: 7, margin: [3, 3, 3, 3] as [number, number, number, number], ...opts });
  const infoLabel = (t: string) => ({ text: t, fontSize: 8, bold: true, color: "#334155", margin: [0, 2, 0, 2] as [number, number, number, number] });
  const infoValue = (t: string) => ({ text: t || "—", fontSize: 8, color: "#475569", margin: [0, 2, 0, 2] as [number, number, number, number] });

  const prBadge = (priority: string) => {
    const color = priority === "Yüksek" ? "#C0392B" : priority === "Orta" ? "#D4A017" : "#2D6A4F";
    return { text: priority, fontSize: 7, bold: true, color: "white", fillColor: color, alignment: "center" as const, margin: [3, 3, 3, 3] as [number, number, number, number] };
  };

  const stBadge = (status: string) => {
    const colorMap: Record<string, string> = { "Açık": "#C0392B", "Bildirildi": "#1B4332", "Önlem Alındı": "#D4A017", "Çözüldü": "#2D6A4F", "Riske Aktarıldı": "#7c3aed" };
    const color = colorMap[status] || "#6B7280";
    return { text: status, fontSize: 7, bold: true, color: "white", fillColor: color, alignment: "center" as const, margin: [3, 3, 3, 3] as [number, number, number, number] };
  };

  const content: any[] = [
    {
      table: { widths: ["*"], body: [[{
        stack: [
          { text: (company?.officialName || "—").toUpperCase(), fontSize: 14, bold: true, color: "white", alignment: "center" },
          { text: "DOF — DUZELTME ONLEYICI FAALIYET FORMU", fontSize: 9, color: "#6B7280", alignment: "center", margin: [0, 2, 0, 0] },
        ],
        fillColor: HL, margin: [0, 8, 0, 8],
      }]] },
      layout: "noBorders", margin: [0, 0, 0, 12],
    },
    {
      table: {
        widths: ["auto", "*", "auto", "*"],
        body: [
          [infoLabel("Isyeri Unvani"), infoValue(company?.officialName || ""), infoLabel("SGK Sicil No."), infoValue(company?.sgkSicil || "")],
          [infoLabel("Isyeri Bolumu"), infoValue(dof.location || "GENEL"), infoLabel("DOF Tarihi"), infoValue(today)],
          [infoLabel("NACE Kodu"), infoValue(company?.naceCode || ""), infoLabel("Tehlike Sinifi"), infoValue(company?.dangerClass || "")],
          [infoLabel("Calisan Sayisi"), infoValue(String(company?.employeeCount || "")), infoLabel("Termin Tarihi"), infoValue(dof.dueDate || "")],
          [infoLabel("Gozlemci"), infoValue(observer?.fullName || ""), infoLabel("Belge No."), infoValue(observer?.certificateNo || "")],
        ],
      },
      layout: { hLineWidth: () => 0, vLineWidth: () => 0 },
      margin: [0, 0, 0, 16],
    },
    {
      table: {
        headerRows: 1,
        widths: [18, 55, "*", 50, 50, "auto", "*", 55, 50, 50, "auto"],
        body: [
          [
            thCell("No"),
            thCell("Konum / Bolum"),
            thCell("Uygunsuzluk / Baslik"),
            thCell("Oncelik"),
            thCell("Durum"),
            thCell("Aciklama"),
            thCell("Oneriler / Alinacak Onlemler"),
            thCell("Etkilenecek Kisiler"),
            thCell("Surec Sorumlusu"),
            thCell("Termin"),
            thCell("Ilgili Mevzuat"),
          ],
          [
            tdCell("1"),
            tdCell(dof.location || "GENEL"),
            tdCell(dof.title, { bold: true }),
            prBadge(dof.priority),
            stBadge(dof.status),
            tdCell(dof.description || ""),
            tdCell(dof.lawReference ? `Mevzuat: ${dof.lawReference}` : ""),
            tdCell(dof.affectedPersons || "Tum calisanlar"),
            tdCell(dof.responsible || ""),
            tdCell(dof.dueDate || ""),
            tdCell(dof.lawReference || ""),
          ],
        ],
      },
      layout: {
        hLineWidth: (i: number) => i <= 1 ? 0.5 : 0.3,
        vLineWidth: () => 0.3,
        hLineColor: (i: number) => i <= 1 ? HL : BORDER,
        vLineColor: () => BORDER,
      },
      margin: [0, 0, 0, 16],
    },
    ...((dof.beforePhoto || dof.afterPhoto) ? [{
      columns: [
        ...(dof.beforePhoto ? [{
          stack: [
            { text: "Uygunsuzluk Fotografi (Once)", fontSize: 8, bold: true, color: HL, margin: [0, 0, 0, 4] as [number, number, number, number] },
            { image: dof.beforePhoto.startsWith("data:") ? dof.beforePhoto : `data:image/jpeg;base64,${dof.beforePhoto}`, width: 260, margin: [0, 0, 10, 0] as [number, number, number, number] },
          ],
          width: "auto",
        }] : []),
        ...(dof.afterPhoto ? [{
          stack: [
            { text: "Duzeltme Fotografi (Sonra)", fontSize: 8, bold: true, color: HL, margin: [0, 0, 0, 4] as [number, number, number, number] },
            { image: dof.afterPhoto.startsWith("data:") ? dof.afterPhoto : `data:image/jpeg;base64,${dof.afterPhoto}`, width: 260, margin: [0, 0, 0, 0] as [number, number, number, number] },
          ],
          width: "auto",
        }] : []),
      ],
      margin: [0, 0, 0, 20] as [number, number, number, number],
    }] : []),
    { text: "", margin: [0, 0, 0, 0] },
    {
      table: {
        widths: ["*", "*", "*"],
        body: [
          [
            { text: "Is Guvenligi Uzmani", fontSize: 8, bold: true, color: "#334155", margin: [0, 0, 0, 4] },
            { text: "Isveren / Isveren Vekili", fontSize: 8, bold: true, color: "#334155", margin: [0, 0, 0, 4] },
            { text: "Calisan Temsilcisi", fontSize: 8, bold: true, color: "#334155", margin: [0, 0, 0, 4] },
          ],
          [
            { text: companySigners.find(s => s.role === "İş Güvenliği Uzmanı")?.fullName || observer?.fullName || "", fontSize: 8, color: "#475569" },
            { text: companySigners.find(s => s.role === "İşveren / İşveren Vekili")?.fullName || "", fontSize: 8, color: "#475569" },
            { text: companySigners.find(s => s.role === "Çalışan Temsilcisi")?.fullName || "", fontSize: 8, color: "#475569" },
          ],
          [
            { text: "____________________\nImza", fontSize: 7, color: "#6B7280", margin: [0, 12, 0, 0] },
            { text: "____________________\nImza", fontSize: 7, color: "#6B7280", margin: [0, 12, 0, 0] },
            { text: "____________________\nImza", fontSize: 7, color: "#6B7280", margin: [0, 12, 0, 0] },
          ],
        ],
      },
      layout: "noBorders",
      margin: [0, 40, 0, 0],
    },
  ];

  const docDef: any = {
    pageSize: "A4",
    pageOrientation: "landscape",
    pageMargins: [30, 30, 30, 40],
    content,
    defaultStyle: {},
    footer: (currentPage: number) => ({
      text: `Sayfa ${currentPage}`,
      alignment: "right",
      fontSize: 7,
      color: "#6B7280",
      margin: [0, 0, 30, 0],
    }),
  };

  if (returnBase64) {
    return new Promise<string>((resolve) => {
      maker.createPdf(docDef).getBase64((data: string) => resolve(data));
    });
  }

  maker.createPdf(docDef).download(`DOF_${dof.id.substring(0, 8)}_${today.replace(/\./g, "_")}.pdf`);
}
