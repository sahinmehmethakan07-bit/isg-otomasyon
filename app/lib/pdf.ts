import type {
  AccidentReportRecord,
  AnnualPlanRecord,
  CommitteeMeetingRecord,
  Company,
  CompanyVisitRecord,
  EmergencyPlanRecord,
  Employee,
  PpeRecord,
  RiskRecord,
  Signer,
  SignerRole,
  TrainingRecord,
} from "./types";

export async function generateRiskPDF(risks: RiskRecord[], companies: Company[], signers: Signer[]) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const pdfMake = (await import("pdfmake/build/pdfmake")) as any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const pdfFonts = (await import("pdfmake/build/vfs_fonts")) as any;
  const maker = pdfMake.default || pdfMake;
  maker.vfs = (pdfFonts.default || pdfFonts).vfs;

  const today = new Date().toLocaleDateString("tr-TR");
  const nextYear = new Date(new Date().setFullYear(new Date().getFullYear() + 1)).toLocaleDateString("tr-TR");
  const byCompany = companies
    .map((c) => ({ company: c, risks: risks.filter((r) => r.companyId === c.id) }))
    .filter((g) => g.risks.length > 0);

  if (byCompany.length === 0) return;

  const scoreColor = (s: number): string => s >= 15 ? "#dc2626" : s >= 8 ? "#d97706" : "#16a34a";
  const HL = "#1e293b"; // header/label color

  const content: any[] = [];
  let pageNum = 0;

  for (const { company, risks: cr } of byCompany) {
    if (content.length > 0) content.push({ text: "", pageBreak: "before" });
    pageNum++;

    // ── Sayfa 1: Başlık ──
    content.push({
      table: { widths: ["*"], body: [[{
        stack: [
          { text: company.officialName.toUpperCase(), fontSize: 14, bold: true, color: "white", alignment: "center" },
          { text: "RİSK DEĞERLENDİRME RAPORU", fontSize: 10, color: "white", alignment: "center", margin: [0, 2, 0, 0] },
        ],
        fillColor: HL, margin: [0, 6, 0, 6],
      }]] },
      layout: "noBorders",
      margin: [0, 0, 0, 6],
    });

    // ── Bilgi bölümü ──
    const infoRow = (label: string, value: string) => ({
      text: [{ text: label, bold: true, fontSize: 8 }, { text: " " + value, fontSize: 8 }], margin: [0, 1, 0, 1] as [number, number, number, number],
    });

    content.push({
      columns: [
        { width: "50%", stack: [
          infoRow("İşyeri Ünvanı :", company.officialName),
          infoRow("İşyeri Bölümü :", "GENEL"),
          infoRow("NACE Kodu :", company.naceCode),
          infoRow("Çalışan Sayısı :", String(company.employeeCount)),
          infoRow("Hizmet Türü :", company.serviceType),
        ]},
        { width: "50%", stack: [
          infoRow("SGK Sicil No. :", company.sgkSicil),
          infoRow("Analiz Tarihi :", today),
          infoRow("Tehlike Sınıfı :", company.dangerClass),
          infoRow("Geçerlilik Tarihi :", nextYear),
        ]},
      ],
      margin: [0, 0, 0, 8],
    });

    // ── Risk tablosu ──
    const hdr = (t: string) => ({ text: t, fontSize: 6, bold: true, color: "white", fillColor: HL, alignment: "center" as const, margin: [1, 3, 1, 3] as [number, number, number, number] });
    const tableHead = [
      hdr("No"), hdr("Bölüm /\nFaaliyet"), hdr("Tehlike Kaynağı /\nMevcut Durum"), hdr("Mevcut\nÖnlem"),
      hdr("Tehlike /\nRisk"), hdr("O"), hdr("Ş"), hdr("RS"),
      hdr("Öneriler /\nAlınacak Önlemler"), hdr("Etkilenecek\nKişiler"), hdr("Süreç\nSorumlusu"),
      hdr("Termin"), hdr("Kontrol\nTarihi"), hdr("O"), hdr("Ş"), hdr("RS"), hdr("İlgili Mevzuat"),
    ];

    const tCell = (t: string, align?: string) => ({ text: t, fontSize: 6, alignment: (align || "left") as any, margin: [1, 2, 1, 2] as [number, number, number, number] });
    const scoreCell = (val: number) => ({
      text: String(val), fontSize: 7, bold: true, color: "white",
      fillColor: scoreColor(val), alignment: "center" as const, margin: [1, 2, 1, 2] as [number, number, number, number],
    });

    const tableBody: any[] = [tableHead];
    cr.forEach((r, i) => {
      tableBody.push([
        tCell(String(i + 1), "center"),
        tCell(r.section || ""),
        tCell(r.hazard || ""),
        tCell(r.currentMeasure || ""),
        tCell(r.risk || ""),
        tCell(String(r.probability), "center"),
        tCell(String(r.severity), "center"),
        scoreCell(r.score),
        tCell(r.actionToTake || ""),
        tCell(r.affectedPersons || "-"),
        tCell(r.responsible || ""),
        tCell(r.dueDate || "", "center"),
        tCell(r.controlDate || "", "center"),
        tCell(String(r.residualProbability), "center"),
        tCell(String(r.residualSeverity), "center"),
        scoreCell(r.residualScore),
        tCell(r.lawReference || ""),
      ]);
    });

    content.push({
      table: {
        headerRows: 1,
        widths: [12, "*", "*", 34, "*", 12, 12, 16, "*", "*", 34, 30, 30, 12, 12, 16, "*"],
        body: tableBody,
      },
      layout: {
        hLineWidth: () => 0.5,
        vLineWidth: () => 0.5,
        hLineColor: () => "#94a3b8",
        vLineColor: () => "#94a3b8",
      },
    });

    // ── Sayfa numarası ──
    content.push({ text: `Sayfa ${pageNum}`, alignment: "center", fontSize: 8, color: "#64748b", margin: [0, 6, 0, 6] });

    // ── İmza bölümü ──
    const roles: SignerRole[] = ["İş Güvenliği Uzmanı", "İşveren / İşveren Vekili", "Çalışan Temsilcisi"];
    const companySigners = roles.map(role => {
      const found = signers.find(s => s.companyId === company.id && s.role === role);
      return { role, name: found?.fullName || "—" };
    });

    content.push({
      table: {
        widths: ["*", "*", "*"],
        body: [[
          ...companySigners.map(s => ({
            stack: [
              { text: s.role, fontSize: 8, bold: true, alignment: "center" as const, color: "#334155" },
              { text: s.name.toUpperCase(), fontSize: 9, bold: true, alignment: "center" as const, margin: [0, 4, 0, 0] as [number, number, number, number] },
              { text: "\n\n", fontSize: 6 },
              { text: "İmza", fontSize: 7, alignment: "center" as const, color: "#94a3b8" },
            ],
            margin: [6, 6, 6, 6] as [number, number, number, number],
          })),
        ]],
      },
      layout: {
        hLineWidth: () => 0.5,
        vLineWidth: () => 0.5,
        hLineColor: () => "#94a3b8",
        vLineColor: () => "#94a3b8",
      },
      margin: [0, 8, 0, 0],
    });

    // ── Sayfa 2: Metodoloji Matrisi ──
    content.push({ text: "", pageBreak: "before" });

    content.push({
      text: "Risk Değerlendirmesi Karar Matris Metodolojisi",
      fontSize: 13, bold: true, alignment: "center", color: HL, margin: [0, 0, 0, 12],
    });

    // Olasılık tablosu
    const mHdr = (t: string) => ({ text: t, fontSize: 8, bold: true, color: "white", fillColor: HL, margin: [4, 4, 4, 4] as [number, number, number, number] });
    const mCell = (t: string, bold?: boolean) => ({ text: t, fontSize: 8, bold: !!bold, margin: [4, 3, 4, 3] as [number, number, number, number] });

    content.push({
      table: {
        widths: [30, 100, "*"],
        headerRows: 1,
        body: [
          [mHdr("Puan"), mHdr("Zararın Gerçekleşme Olasılığı"), mHdr("Derecelendirme Basamakları")],
          [mCell("1", true), mCell("Çok Küçük"), mCell("Hemen hemen hiç")],
          [mCell("2", true), mCell("Küçük"), mCell("Çok az (yılda bir kez), sadece anormal durumlarda")],
          [mCell("3", true), mCell("Orta"), mCell("Az (yılda bir kaç kez)")],
          [mCell("4", true), mCell("Yüksek"), mCell("Sıklıkla (ayda bir)")],
          [mCell("5", true), mCell("Çok Yüksek"), mCell("Çok sıklıkla (haftada bir, her gün)")],
        ],
      },
      layout: { hLineWidth: () => 0.5, vLineWidth: () => 0.5, hLineColor: () => "#94a3b8", vLineColor: () => "#94a3b8" },
      margin: [0, 0, 0, 12],
    });

    // Şiddet tablosu
    content.push({
      table: {
        widths: [30, 100, "*"],
        headerRows: 1,
        body: [
          [mHdr("Puan"), mHdr("İhtimal"), mHdr("Derecelendirme")],
          [mCell("1", true), mCell("Çok Hafif"), mCell("İş saati kaybı yok, hemen giderilebilen")],
          [mCell("2", true), mCell("Hafif"), mCell("İş günü kaybı yok, kalıcı etkisi olmayan")],
          [mCell("3", true), mCell("Orta"), mCell("Hafif yaralanma, yatarak tedavi")],
          [mCell("4", true), mCell("Ciddi"), mCell("Ciddi yaralanma, meslek hastalığı")],
          [mCell("5", true), mCell("Çok Ciddi"), mCell("Ölüm, sürekli iş göremezlik")],
        ],
      },
      layout: { hLineWidth: () => 0.5, vLineWidth: () => 0.5, hLineColor: () => "#94a3b8", vLineColor: () => "#94a3b8" },
      margin: [0, 0, 0, 12],
    });

    // Risk skoru tablosu
    content.push({
      table: {
        widths: [60, 100, "*"],
        headerRows: 1,
        body: [
          [mHdr("Risk Skoru"), mHdr("Anlamı"), mHdr("Açıklama")],
          [{ text: "25", fontSize: 8, bold: true, fillColor: "#dc2626", color: "white", alignment: "center", margin: [4, 3, 4, 3] }, mCell("Kabul Edilemez"), mCell("Risk kabul edilebilir seviyeye düşürülünceye kadar iş başlatılmamalıdır.")],
          [{ text: "15, 16, 20", fontSize: 8, bold: true, fillColor: "#dc2626", color: "white", alignment: "center", margin: [4, 3, 4, 3] }, mCell("Ciddi"), mCell("Riskleri düşürmek için faaliyetler kısa zamanda başlatılmalıdır.")],
          [{ text: "8, 9, 10, 12", fontSize: 8, bold: true, fillColor: "#d97706", color: "white", alignment: "center", margin: [4, 3, 4, 3] }, mCell("Orta"), mCell("Riskleri düşürmek için faaliyetler en az 6 ay içinde tamamlanmalıdır.")],
          [{ text: "2, 3, 4, 5, 6", fontSize: 8, bold: true, fillColor: "#16a34a", color: "white", alignment: "center", margin: [4, 3, 4, 3] }, mCell("Düşük (Katlanılabilir)"), mCell("Mevcut kontroller sürdürülmelidir.")],
          [{ text: "1", fontSize: 8, bold: true, fillColor: "#16a34a", color: "white", alignment: "center", margin: [4, 3, 4, 3] }, mCell("Önemsiz"), mCell("Önlem öncelikli değildir.")],
        ],
      },
      layout: { hLineWidth: () => 0.5, vLineWidth: () => 0.5, hLineColor: () => "#94a3b8", vLineColor: () => "#94a3b8" },
      margin: [0, 0, 0, 12],
    });

    // Renk skalası
    content.push({
      text: "Risk Seviyesi Renk Skalası:", fontSize: 9, bold: true, margin: [0, 0, 0, 6],
    });
    content.push({
      columns: [
        { width: "auto", stack: [{ canvas: [{ type: "rect", x: 0, y: 0, w: 14, h: 14, r: 2, color: "#dc2626" }] }], margin: [0, 0, 4, 0] },
        { width: "auto", text: "Yüksek Risk (≥15) — Kabul edilemez / Ciddi", fontSize: 8, margin: [0, 2, 16, 0] },
        { width: "auto", stack: [{ canvas: [{ type: "rect", x: 0, y: 0, w: 14, h: 14, r: 2, color: "#d97706" }] }], margin: [0, 0, 4, 0] },
        { width: "auto", text: "Orta Risk (8-14) — Faaliyetler 6 ay içinde", fontSize: 8, margin: [0, 2, 16, 0] },
        { width: "auto", stack: [{ canvas: [{ type: "rect", x: 0, y: 0, w: 14, h: 14, r: 2, color: "#16a34a" }] }], margin: [0, 0, 4, 0] },
        { width: "auto", text: "Düşük Risk (<8) — Mevcut kontroller yeterli", fontSize: 8, margin: [0, 2, 0, 0] },
      ],
    });
  }

  const docDef: any = {
    pageOrientation: "landscape",
    pageSize: "A3",
    pageMargins: [20, 20, 20, 20],
    content,
    defaultStyle: { font: "Roboto" },
  };

  maker.createPdf(docDef).download(`Risk_Degerlendirme_Raporu_${today.replace(/\./g, "_")}.pdf`);
}

export async function generateAnnualPlanPDF(plans: AnnualPlanRecord[], companies: Company[]) {
  if (plans.length === 0) return;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const pdfMake = (await import("pdfmake/build/pdfmake")) as any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const pdfFonts = (await import("pdfmake/build/vfs_fonts")) as any;
  const maker = pdfMake.default || pdfMake;
  maker.vfs = (pdfFonts.default || pdfFonts).vfs;

  const companyName = (companyId: string) => companies.find(c => c.id === companyId)?.officialName || companies.find(c => c.id === companyId)?.nickName || "-";
  const sortedPlans = [...plans].sort((a, b) => `${a.companyId}-${a.plannedDate}`.localeCompare(`${b.companyId}-${b.plannedDate}`));
  const content: any[] = [
    { text: "YILLIK İSG PLANI", fontSize: 16, bold: true, color: "#1e293b", alignment: "center", margin: [0, 0, 0, 4] },
    { text: new Date().toLocaleDateString("tr-TR"), fontSize: 9, color: "#64748b", alignment: "center", margin: [0, 0, 0, 14] },
    {
      table: {
        headerRows: 1,
        widths: [78, 46, 72, "*", 58, 70, 62, "*"],
        body: [
          ["Firma", "Yıl", "Tür", "Başlık", "Tarih", "Sorumlu", "Durum", "Not"].map(text => ({ text, bold: true, color: "white", fillColor: "#1e293b", fontSize: 8, margin: [3, 4, 3, 4] })),
          ...sortedPlans.map(plan => [
            companyName(plan.companyId),
            String(plan.year),
            plan.type,
            plan.title,
            plan.plannedDate ? new Date(plan.plannedDate).toLocaleDateString("tr-TR") : "-",
            plan.responsible || "-",
            plan.status,
            plan.notes || "-",
          ].map(text => ({ text, fontSize: 7, color: "#334155", margin: [3, 4, 3, 4] }))),
        ],
      },
      layout: { hLineWidth: () => 0.4, vLineWidth: () => 0.4, hLineColor: () => "#cbd5e1", vLineColor: () => "#cbd5e1" },
    },
  ];

  maker.createPdf({
    pageOrientation: "landscape",
    pageSize: "A4",
    pageMargins: [18, 18, 18, 18],
    content,
    defaultStyle: { font: "Roboto" },
  }).download(`Yillik_ISG_Plani_${new Date().getFullYear()}.pdf`);
}

export async function generateTrainingPDF(trainings: TrainingRecord[], companies: Company[], employees: Employee[]) {
  if (trainings.length === 0) return;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const pdfMake = (await import("pdfmake/build/pdfmake")) as any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const pdfFonts = (await import("pdfmake/build/vfs_fonts")) as any;
  const maker = pdfMake.default || pdfMake;
  maker.vfs = (pdfFonts.default || pdfFonts).vfs;

  const companyName = (companyId: string) => companies.find(c => c.id === companyId)?.officialName || companies.find(c => c.id === companyId)?.nickName || "-";
  const employeeName = (employeeId: string) => {
    const employee = employees.find(e => e.id === employeeId);
    return employee ? `${employee.firstName} ${employee.lastName}` : "";
  };
  const sortedTrainings = [...trainings].sort((a, b) => `${a.companyId}-${a.trainingDate}`.localeCompare(`${b.companyId}-${b.trainingDate}`));

  const content: any[] = [
    { text: "İSG EĞİTİM TAKİP LİSTESİ", fontSize: 16, bold: true, color: "#1e293b", alignment: "center", margin: [0, 0, 0, 4] },
    { text: new Date().toLocaleDateString("tr-TR"), fontSize: 9, color: "#64748b", alignment: "center", margin: [0, 0, 0, 14] },
    {
      table: {
        headerRows: 1,
        widths: [82, 86, 82, 58, 70, 96, 58, "*"],
        body: [
          ["Firma", "Eğitim", "Tür", "Tarih", "Eğitmen", "Katılımcılar", "Durum", "Not"].map(text => ({ text, bold: true, color: "white", fillColor: "#1e293b", fontSize: 8, margin: [3, 4, 3, 4] })),
          ...sortedTrainings.map(training => [
            companyName(training.companyId),
            training.title,
            training.type,
            training.trainingDate ? new Date(training.trainingDate).toLocaleDateString("tr-TR") : "-",
            training.trainer || "-",
            training.participantIds.map(employeeName).filter(Boolean).join(", ") || "-",
            training.status,
            training.notes || "-",
          ].map(text => ({ text, fontSize: 7, color: "#334155", margin: [3, 4, 3, 4] }))),
        ],
      },
      layout: { hLineWidth: () => 0.4, vLineWidth: () => 0.4, hLineColor: () => "#cbd5e1", vLineColor: () => "#cbd5e1" },
    },
  ];

  maker.createPdf({
    pageOrientation: "landscape",
    pageSize: "A4",
    pageMargins: [18, 18, 18, 18],
    content,
    defaultStyle: { font: "Roboto" },
  }).download(`ISG_Egitim_Takip_${new Date().getFullYear()}.pdf`);
}

export async function generateTrainingAttendancePDF(training: TrainingRecord, company: Company | undefined, employees: Employee[]) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const pdfMake = (await import("pdfmake/build/pdfmake")) as any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const pdfFonts = (await import("pdfmake/build/vfs_fonts")) as any;
  const maker = pdfMake.default || pdfMake;
  maker.vfs = (pdfFonts.default || pdfFonts).vfs;

  const participants = training.participantIds
    .map(id => employees.find(employee => employee.id === id))
    .filter(Boolean) as Employee[];

  const body = [
    ["No", "Ad Soyad", "T.C. Kimlik No", "Görev / Ünvan", "İmza"].map(text => ({ text, bold: true, color: "white", fillColor: "#1e293b", fontSize: 8, margin: [4, 5, 4, 5] })),
    ...(participants.length > 0 ? participants : [{ firstName: "", lastName: "", tcNo: "", title: "" } as Employee]).map((employee, index) => [
      String(index + 1),
      `${employee.firstName} ${employee.lastName}`.trim() || " ",
      employee.tcNo || " ",
      employee.title || " ",
      " ",
    ].map(text => ({ text, fontSize: 8, color: "#334155", margin: [4, 7, 4, 7] }))),
  ];

  const content: any[] = [
    { text: "EĞİTİM KATILIM FORMU", fontSize: 16, bold: true, color: "#1e293b", alignment: "center", margin: [0, 0, 0, 12] },
    {
      table: {
        widths: [90, "*", 90, "*"],
        body: [
          ["Firma", company?.officialName || company?.nickName || "-", "Eğitim Türü", training.type],
          ["Eğitim Başlığı", training.title, "Eğitim Tarihi", training.trainingDate ? new Date(training.trainingDate).toLocaleDateString("tr-TR") : "-"],
          ["Eğitmen", training.trainer || "-", "Süre / Yer", `${training.durationHours || "-"} saat / ${training.location || "-"}`],
        ].map(row => row.map((text, index) => ({ text, fontSize: 8, bold: index % 2 === 0, color: "#334155", margin: [4, 5, 4, 5] }))),
      },
      layout: { hLineWidth: () => 0.4, vLineWidth: () => 0.4, hLineColor: () => "#cbd5e1", vLineColor: () => "#cbd5e1" },
      margin: [0, 0, 0, 12],
    },
    {
      table: {
        headerRows: 1,
        widths: [28, "*", 82, "*", 110],
        body,
      },
      layout: { hLineWidth: () => 0.4, vLineWidth: () => 0.4, hLineColor: () => "#cbd5e1", vLineColor: () => "#cbd5e1" },
      margin: [0, 0, 0, 18],
    },
    {
      columns: [
        { width: "*", text: "Eğitmen\n\n\nİmza", fontSize: 9, alignment: "center" },
        { width: "*", text: "İşveren / İşveren Vekili\n\n\nİmza", fontSize: 9, alignment: "center" },
      ],
    },
  ];

  maker.createPdf({
    pageSize: "A4",
    pageMargins: [28, 28, 28, 28],
    content,
    defaultStyle: { font: "Roboto" },
  }).download(`Egitim_Katilim_Formu_${training.title.replace(/\s+/g, "_")}.pdf`);
}

export async function generateTrainingCertificatesPDF(training: TrainingRecord, company: Company | undefined, employees: Employee[]) {
  const participants = training.participantIds
    .map(id => employees.find(employee => employee.id === id))
    .filter(Boolean) as Employee[];
  if (participants.length === 0) return;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const pdfMake = (await import("pdfmake/build/pdfmake")) as any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const pdfFonts = (await import("pdfmake/build/vfs_fonts")) as any;
  const maker = pdfMake.default || pdfMake;
  maker.vfs = (pdfFonts.default || pdfFonts).vfs;

  const certificatePages = participants.flatMap((employee, index) => {
    const page: any = {
      stack: [
        { text: "İŞ SAĞLIĞI VE GÜVENLİĞİ", fontSize: 13, bold: true, color: "#0f766e", alignment: "center", margin: [0, 10, 0, 4] },
        { text: "EĞİTİM KATILIM SERTİFİKASI", fontSize: 24, bold: true, color: "#1e293b", alignment: "center", margin: [0, 0, 0, 24] },
        { text: `${employee.firstName} ${employee.lastName}`, fontSize: 22, bold: true, color: "#111827", alignment: "center", margin: [0, 0, 0, 12] },
        { text: `${training.title} (${training.type}) eğitimine katılmıştır.`, fontSize: 12, color: "#334155", alignment: "center", margin: [40, 0, 40, 18] },
        {
          table: {
            widths: ["*", "*"],
            body: [
              ["Firma", company?.officialName || company?.nickName || "-"],
              ["Tarih", training.trainingDate ? new Date(training.trainingDate).toLocaleDateString("tr-TR") : "-"],
              ["Süre", training.durationHours ? `${training.durationHours} saat` : "-"],
              ["Eğitmen", training.trainer || "-"],
            ].map(row => row.map((text, cellIndex) => ({ text, bold: cellIndex === 0, fontSize: 9, color: "#334155", margin: [5, 5, 5, 5] }))),
          },
          layout: { hLineWidth: () => 0.4, vLineWidth: () => 0.4, hLineColor: () => "#cbd5e1", vLineColor: () => "#cbd5e1" },
          margin: [70, 0, 70, 34],
        },
        {
          columns: [
            { width: "*", text: "Eğitmen\n\n\nİmza", fontSize: 9, alignment: "center" },
            { width: "*", text: "İşveren / İşveren Vekili\n\n\nİmza", fontSize: 9, alignment: "center" },
          ],
        },
      ],
      margin: [0, 0, 0, 0],
    };
    return index < participants.length - 1 ? [page, { text: "", pageBreak: "after" as const }] : [page];
  });

  maker.createPdf({
    pageSize: "A4",
    pageMargins: [34, 34, 34, 34],
    content: certificatePages,
    defaultStyle: { font: "Roboto" },
  }).download(`Egitim_Sertifikalari_${training.title.replace(/\s+/g, "_")}.pdf`);
}

export async function generatePpeAssignmentPDF(record: PpeRecord, company: Company | undefined, employee: Employee | undefined) {
  if (!employee) return;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const pdfMake = (await import("pdfmake/build/pdfmake")) as any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const pdfFonts = (await import("pdfmake/build/vfs_fonts")) as any;
  const maker = pdfMake.default || pdfMake;
  maker.vfs = (pdfFonts.default || pdfFonts).vfs;

  const content: any[] = [
    { text: "KİŞİSEL KORUYUCU DONANIM ZİMMET FORMU", fontSize: 15, bold: true, color: "#1e293b", alignment: "center", margin: [0, 0, 0, 14] },
    {
      table: {
        widths: [100, "*", 100, "*"],
        body: [
          ["Firma", company?.officialName || company?.nickName || "-", "Tarih", record.issueDate ? new Date(record.issueDate).toLocaleDateString("tr-TR") : "-"],
          ["Personel", `${employee.firstName} ${employee.lastName}`, "T.C. Kimlik No", employee.tcNo || "-"],
          ["Bölüm", employee.department || "-", "Görev / Ünvan", employee.title || "-"],
        ].map(row => row.map((text, index) => ({ text, fontSize: 8, bold: index % 2 === 0, color: "#334155", margin: [4, 5, 4, 5] }))),
      },
      layout: { hLineWidth: () => 0.4, vLineWidth: () => 0.4, hLineColor: () => "#cbd5e1", vLineColor: () => "#cbd5e1" },
      margin: [0, 0, 0, 12],
    },
    {
      table: {
        headerRows: 1,
        widths: ["*", 50, 86, 86, "*"],
        body: [
          ["KKD / Malzeme", "Adet", "Seri No", "Durum", "Not"].map(text => ({ text, bold: true, color: "white", fillColor: "#1e293b", fontSize: 8, margin: [4, 5, 4, 5] })),
          [
            record.equipment,
            String(record.quantity || 1),
            record.serialNo || "-",
            record.status,
            record.notes || "-",
          ].map(text => ({ text, fontSize: 8, color: "#334155", margin: [4, 7, 4, 7] })),
        ],
      },
      layout: { hLineWidth: () => 0.4, vLineWidth: () => 0.4, hLineColor: () => "#cbd5e1", vLineColor: () => "#cbd5e1" },
      margin: [0, 0, 0, 14],
    },
    {
      text: "Yukarıda belirtilen kişisel koruyucu donanımı eksiksiz ve çalışır durumda teslim aldım. Kullanım talimatlarına uygun kullanacağımı, kayıp veya hasar durumunda işverenimi bilgilendireceğimi kabul ederim.",
      fontSize: 9,
      color: "#334155",
      margin: [0, 0, 0, 28],
    },
    {
      columns: [
        { width: "*", text: "Teslim Eden\n\n\nAd Soyad / İmza", fontSize: 9, alignment: "center" },
        { width: "*", text: "Teslim Alan Personel\n\n\nAd Soyad / İmza", fontSize: 9, alignment: "center" },
      ],
    },
  ];

  maker.createPdf({
    pageSize: "A4",
    pageMargins: [28, 28, 28, 28],
    content,
    defaultStyle: { font: "Roboto" },
  }).download(`KKD_Zimmet_${employee.firstName}_${employee.lastName}.pdf`);
}

export async function generateEmergencyPlanPDF(plan: EmergencyPlanRecord, company: Company | undefined, employees: Employee[]) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const pdfMake = (await import("pdfmake/build/pdfmake")) as any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const pdfFonts = (await import("pdfmake/build/vfs_fonts")) as any;
  const maker = pdfMake.default || pdfMake;
  maker.vfs = (pdfFonts.default || pdfFonts).vfs;

  const companyEmployees = employees.filter(employee => employee.companyId === plan.companyId);
  const infoRows = [
    ["Firma", company?.officialName || company?.nickName || "-", "Tehlike Sınıfı", company?.dangerClass || "-"],
    ["Plan Başlığı", plan.title, "Plan Tarihi", plan.planDate ? new Date(plan.planDate).toLocaleDateString("tr-TR") : "-"],
    ["Senaryo", plan.scenario, "Tatbikat Tarihi", plan.drillDate ? new Date(plan.drillDate).toLocaleDateString("tr-TR") : "-"],
    ["Toplanma Alanı", plan.assemblyArea || "-", "Sorumlu", plan.responsible || "-"],
  ];

  const content: any[] = [
    { text: "ACİL DURUM PLANI", fontSize: 17, bold: true, color: "#1e293b", alignment: "center", margin: [0, 0, 0, 12] },
    {
      table: {
        widths: [92, "*", 92, "*"],
        body: infoRows.map(row => row.map((text, index) => ({ text, fontSize: 8, bold: index % 2 === 0, color: "#334155", margin: [4, 5, 4, 5] }))),
      },
      layout: { hLineWidth: () => 0.4, vLineWidth: () => 0.4, hLineColor: () => "#cbd5e1", vLineColor: () => "#cbd5e1" },
      margin: [0, 0, 0, 12],
    },
    { text: "Acil Durum Ekibi", fontSize: 11, bold: true, color: "#1e293b", margin: [0, 0, 0, 6] },
    {
      table: {
        widths: ["*"],
        body: [[{ text: plan.emergencyTeam || "-", fontSize: 9, color: "#334155", margin: [5, 8, 5, 8] }]],
      },
      layout: { hLineWidth: () => 0.4, vLineWidth: () => 0.4, hLineColor: () => "#cbd5e1", vLineColor: () => "#cbd5e1" },
      margin: [0, 0, 0, 12],
    },
    { text: "Uygulama Notları", fontSize: 11, bold: true, color: "#1e293b", margin: [0, 0, 0, 6] },
    {
      table: {
        widths: ["*"],
        body: [[{ text: plan.notes || "Acil durumda ilgili ekipler bilgilendirilir, personel toplanma alanına yönlendirilir ve yoklama alınır.", fontSize: 9, color: "#334155", margin: [5, 8, 5, 8] }]],
      },
      layout: { hLineWidth: () => 0.4, vLineWidth: () => 0.4, hLineColor: () => "#cbd5e1", vLineColor: () => "#cbd5e1" },
      margin: [0, 0, 0, 12],
    },
    { text: "Personel Bilgisi", fontSize: 11, bold: true, color: "#1e293b", margin: [0, 0, 0, 6] },
    {
      table: {
        headerRows: 1,
        widths: ["*", "*", 74],
        body: [
          ["Ad Soyad", "Bölüm / Ünvan", "Telefon"].map(text => ({ text, bold: true, color: "white", fillColor: "#1e293b", fontSize: 8, margin: [4, 5, 4, 5] })),
          ...(companyEmployees.length > 0 ? companyEmployees : [{ firstName: "", lastName: "", department: "", title: "", phone: "" } as Employee]).slice(0, 18).map(employee => [
            `${employee.firstName} ${employee.lastName}`.trim() || " ",
            [employee.department, employee.title].filter(Boolean).join(" / ") || " ",
            employee.phone || " ",
          ].map(text => ({ text, fontSize: 7, color: "#334155", margin: [4, 4, 4, 4] }))),
        ],
      },
      layout: { hLineWidth: () => 0.4, vLineWidth: () => 0.4, hLineColor: () => "#cbd5e1", vLineColor: () => "#cbd5e1" },
      margin: [0, 0, 0, 18],
    },
    {
      columns: [
        { width: "*", text: "Hazırlayan\n\n\nAd Soyad / İmza", fontSize: 9, alignment: "center" },
        { width: "*", text: "İşveren / İşveren Vekili\n\n\nAd Soyad / İmza", fontSize: 9, alignment: "center" },
      ],
    },
  ];

  maker.createPdf({
    pageSize: "A4",
    pageMargins: [28, 28, 28, 28],
    content,
    defaultStyle: { font: "Roboto" },
  }).download(`Acil_Durum_Plani_${plan.title.replace(/\s+/g, "_")}.pdf`);
}

export async function generateCommitteeMeetingPDF(meeting: CommitteeMeetingRecord, company: Company | undefined, employees: Employee[]) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const pdfMake = (await import("pdfmake/build/pdfmake")) as any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const pdfFonts = (await import("pdfmake/build/vfs_fonts")) as any;
  const maker = pdfMake.default || pdfMake;
  maker.vfs = (pdfFonts.default || pdfFonts).vfs;

  const participants = meeting.participantIds
    .map(id => employees.find(employee => employee.id === id))
    .filter(Boolean) as Employee[];

  const content: any[] = [
    { text: "İSG KURUL TOPLANTISI TUTANAĞI", fontSize: 16, bold: true, color: "#1e293b", alignment: "center", margin: [0, 0, 0, 12] },
    {
      table: {
        widths: [90, "*", 90, "*"],
        body: [
          ["Firma", company?.officialName || company?.nickName || "-", "Toplantı No", meeting.meetingNo || "-"],
          ["Tarih", meeting.meetingDate ? new Date(meeting.meetingDate).toLocaleDateString("tr-TR") : "-", "Yer", meeting.location || "-"],
          ["Başkan", meeting.chairperson || "-", "Durum", meeting.status],
        ].map(row => row.map((text, index) => ({ text, fontSize: 8, bold: index % 2 === 0, color: "#334155", margin: [4, 5, 4, 5] }))),
      },
      layout: { hLineWidth: () => 0.4, vLineWidth: () => 0.4, hLineColor: () => "#cbd5e1", vLineColor: () => "#cbd5e1" },
      margin: [0, 0, 0, 12],
    },
    { text: "Gündem", fontSize: 11, bold: true, color: "#1e293b", margin: [0, 0, 0, 6] },
    {
      table: { widths: ["*"], body: [[{ text: meeting.agenda || "-", fontSize: 9, color: "#334155", margin: [5, 8, 5, 8] }]] },
      layout: { hLineWidth: () => 0.4, vLineWidth: () => 0.4, hLineColor: () => "#cbd5e1", vLineColor: () => "#cbd5e1" },
      margin: [0, 0, 0, 12],
    },
    { text: "Alınan Kararlar", fontSize: 11, bold: true, color: "#1e293b", margin: [0, 0, 0, 6] },
    {
      table: { widths: ["*"], body: [[{ text: meeting.decisions || "-", fontSize: 9, color: "#334155", margin: [5, 8, 5, 8] }]] },
      layout: { hLineWidth: () => 0.4, vLineWidth: () => 0.4, hLineColor: () => "#cbd5e1", vLineColor: () => "#cbd5e1" },
      margin: [0, 0, 0, 12],
    },
    { text: "Katılımcılar", fontSize: 11, bold: true, color: "#1e293b", margin: [0, 0, 0, 6] },
    {
      table: {
        headerRows: 1,
        widths: [28, "*", "*", 110],
        body: [
          ["No", "Ad Soyad", "Görev / Ünvan", "İmza"].map(text => ({ text, bold: true, color: "white", fillColor: "#1e293b", fontSize: 8, margin: [4, 5, 4, 5] })),
          ...(participants.length > 0 ? participants : [{ firstName: "", lastName: "", title: "" } as Employee]).map((employee, index) => [
            String(index + 1),
            `${employee.firstName} ${employee.lastName}`.trim() || " ",
            employee.title || " ",
            " ",
          ].map(text => ({ text, fontSize: 8, color: "#334155", margin: [4, 7, 4, 7] }))),
        ],
      },
      layout: { hLineWidth: () => 0.4, vLineWidth: () => 0.4, hLineColor: () => "#cbd5e1", vLineColor: () => "#cbd5e1" },
      margin: [0, 0, 0, 18],
    },
    { text: meeting.notes || "", fontSize: 8, color: "#64748b", margin: [0, 0, 0, 16] },
    {
      columns: [
        { width: "*", text: "Kurul Başkanı\n\n\nAd Soyad / İmza", fontSize: 9, alignment: "center" },
        { width: "*", text: "İşveren / İşveren Vekili\n\n\nAd Soyad / İmza", fontSize: 9, alignment: "center" },
      ],
    },
  ];

  maker.createPdf({
    pageSize: "A4",
    pageMargins: [28, 28, 28, 28],
    content,
    defaultStyle: { font: "Roboto" },
  }).download(`Kurul_Toplantisi_${meeting.meetingNo || meeting.meetingDate}.pdf`);
}

export async function generateAccidentReportPDF(report: AccidentReportRecord, company: Company | undefined, employee: Employee | undefined) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const pdfMake = (await import("pdfmake/build/pdfmake")) as any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const pdfFonts = (await import("pdfmake/build/vfs_fonts")) as any;
  const maker = pdfMake.default || pdfMake;
  maker.vfs = (pdfFonts.default || pdfFonts).vfs;

  const content: any[] = [
    { text: "İŞ KAZASI / RAMAK KALA RAPORU", fontSize: 16, bold: true, color: "#1e293b", alignment: "center", margin: [0, 0, 0, 12] },
    {
      table: {
        widths: [90, "*", 90, "*"],
        body: [
          ["Firma", company?.officialName || company?.nickName || "-", "Tarih", report.accidentDate ? new Date(report.accidentDate).toLocaleDateString("tr-TR") : "-"],
          ["Personel", employee ? `${employee.firstName} ${employee.lastName}` : "-", "T.C. Kimlik No", employee?.tcNo || "-"],
          ["Olay Yeri", report.location || "-", "Şiddet", report.severity],
          ["Olay Türü", report.incidentType || "-", "Durum", report.status],
        ].map(row => row.map((text, index) => ({ text, fontSize: 8, bold: index % 2 === 0, color: "#334155", margin: [4, 5, 4, 5] }))),
      },
      layout: { hLineWidth: () => 0.4, vLineWidth: () => 0.4, hLineColor: () => "#cbd5e1", vLineColor: () => "#cbd5e1" },
      margin: [0, 0, 0, 12],
    },
    ...[
      ["Olay Açıklaması", report.description],
      ["Kök Neden", report.rootCause],
      ["Aksiyon Planı", report.actionPlan],
      ["Sorumlu / Termin", `${report.responsible || "-"} / ${report.dueDate ? new Date(report.dueDate).toLocaleDateString("tr-TR") : "-"}`],
      ["Not", report.notes],
    ].flatMap(([title, text]) => [
      { text: title, fontSize: 11, bold: true, color: "#1e293b", margin: [0, 0, 0, 6] },
      {
        table: { widths: ["*"], body: [[{ text: text || "-", fontSize: 9, color: "#334155", margin: [5, 8, 5, 8] }]] },
        layout: { hLineWidth: () => 0.4, vLineWidth: () => 0.4, hLineColor: () => "#cbd5e1", vLineColor: () => "#cbd5e1" },
        margin: [0, 0, 0, 12],
      },
    ]),
    {
      columns: [
        { width: "*", text: "Raporu Hazırlayan\n\n\nAd Soyad / İmza", fontSize: 9, alignment: "center" },
        { width: "*", text: "İşveren / İşveren Vekili\n\n\nAd Soyad / İmza", fontSize: 9, alignment: "center" },
      ],
    },
  ];

  maker.createPdf({
    pageSize: "A4",
    pageMargins: [28, 28, 28, 28],
    content,
    defaultStyle: { font: "Roboto" },
  }).download(`Is_Kazasi_Raporu_${report.accidentDate || report.id}.pdf`);
}

export async function generateCompanyVisitPDF(visit: CompanyVisitRecord, company: Company | undefined) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const pdfMake = (await import("pdfmake/build/pdfmake")) as any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const pdfFonts = (await import("pdfmake/build/vfs_fonts")) as any;
  const maker = pdfMake.default || pdfMake;
  maker.vfs = (pdfFonts.default || pdfFonts).vfs;

  const content: any[] = [
    { text: "FİRMA ZİYARET RAPORU", fontSize: 16, bold: true, color: "#1e293b", alignment: "center", margin: [0, 0, 0, 12] },
    {
      table: {
        widths: [90, "*", 90, "*"],
        body: [
          ["Firma", company?.officialName || company?.nickName || "-", "Ziyaret Tarihi", visit.visitDate ? new Date(visit.visitDate).toLocaleDateString("tr-TR") : "-"],
          ["Ziyaret Amacı", visit.purpose, "Durum", visit.status],
          ["Ziyaret Eden", visit.visitor || "-", "Görüşülen Kişi", visit.contactedPerson || "-"],
          ["Sonraki Ziyaret", visit.nextVisitDate ? new Date(visit.nextVisitDate).toLocaleDateString("tr-TR") : "-", "SGK Sicil", company?.sgkSicil || "-"],
        ].map(row => row.map((text, index) => ({ text, fontSize: 8, bold: index % 2 === 0, color: "#334155", margin: [4, 5, 4, 5] }))),
      },
      layout: { hLineWidth: () => 0.4, vLineWidth: () => 0.4, hLineColor: () => "#cbd5e1", vLineColor: () => "#cbd5e1" },
      margin: [0, 0, 0, 12],
    },
    ...[
      ["Tespitler", visit.findings],
      ["Aksiyonlar", visit.actions],
      ["Notlar", visit.notes],
    ].flatMap(([title, text]) => [
      { text: title, fontSize: 11, bold: true, color: "#1e293b", margin: [0, 0, 0, 6] },
      {
        table: { widths: ["*"], body: [[{ text: text || "-", fontSize: 9, color: "#334155", margin: [5, 8, 5, 8] }]] },
        layout: { hLineWidth: () => 0.4, vLineWidth: () => 0.4, hLineColor: () => "#cbd5e1", vLineColor: () => "#cbd5e1" },
        margin: [0, 0, 0, 12],
      },
    ]),
    {
      columns: [
        { width: "*", text: "Ziyareti Yapan\n\n\nAd Soyad / İmza", fontSize: 9, alignment: "center" },
        { width: "*", text: "Firma Yetkilisi\n\n\nAd Soyad / İmza", fontSize: 9, alignment: "center" },
      ],
    },
  ];

  maker.createPdf({
    pageSize: "A4",
    pageMargins: [28, 28, 28, 28],
    content,
    defaultStyle: { font: "Roboto" },
  }).download(`Firma_Ziyaret_Raporu_${visit.visitDate || visit.id}.pdf`);
}
