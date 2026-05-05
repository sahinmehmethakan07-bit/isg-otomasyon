/**
 * ek2PdfGenerator.ts — EK-2 İşe Giriş / Periyodik Muayene Formu PDF Oluşturucu
 * 
 * Orijinal resmi formun birebir aynısını pdfmake ile oluşturur.
 * Ek2MuayeneFormu.tsx içinden çağrılır.
 */

export async function generateEk2PDF(form: any) {
  const pdfMake = (await import("pdfmake/build/pdfmake")) as any;
  const pdfFonts = (await import("pdfmake/build/vfs_fonts")) as any;
  const maker = pdfMake.default || pdfMake;
  maker.vfs = (pdfFonts.default || pdfFonts).vfs;

  const B = "#000000";
  const G = "#444444";
  const LN = { hLineWidth: () => 0.5, vLineWidth: () => 0.5, hLineColor: () => "#999", vLineColor: () => "#999" };

  const yn = (val: any) => val?.evet ? "Evet" : "Hayır";
  const v = (val: any) => val || "";

  const content: any[] = [
    // ── BAŞLIK ──
    {
      text: "İŞE GİRİŞ / PERİYODİK MUAYENE FORMU",
      fontSize: 13,
      bold: true,
      alignment: "center",
      margin: [0, 0, 0, 2],
    },
    {
      text: "Ek-2",
      fontSize: 10,
      bold: true,
      alignment: "right",
      margin: [0, 0, 0, 10],
    },

    // ── İŞYERİNİN/İŞVERENİN BİLGİLERİ ──
    {
      table: {
        widths: [120, "*"],
        body: [
          [{ text: "İŞYERİNİN/İŞVERENİN", bold: true, fontSize: 10, colSpan: 2, fillColor: "#f0f0f0" }, {}],
          [{ text: "Unvanı", fontSize: 9, bold: true }, { text: v(form.companyName), fontSize: 9 }],
          [{ text: "SGK Sicil No.", fontSize: 9, bold: true }, { text: v(form.sgkSicilNo), fontSize: 9 }],
          [{ text: "Adresi", fontSize: 9, bold: true }, { text: v(form.companyAddress), fontSize: 9 }],
          [{ text: "Tel ve faks", fontSize: 9, bold: true }, { text: v(form.companyTel), fontSize: 9 }],
          [{ text: "E-Posta", fontSize: 9, bold: true }, { text: v(form.companyEmail), fontSize: 9 }],
        ],
      },
      layout: LN,
      margin: [0, 0, 0, 6],
    },

    // ── BEYAN ──
    {
      text: "İşe giriş/periyodik muayene olmayı kabul ettiğimi ve muayene sırasında verdiğim bilgilerin doğru ve eksiksiz olduğunu beyan ederim.",
      fontSize: 8,
      italics: true,
      margin: [0, 0, 0, 2],
    },
    {
      columns: [
        { text: `Çalışanın Adı Soyadı: ${v(form.employeeName)}`, fontSize: 9 },
        { text: "İMZA: ____________________", fontSize: 9, alignment: "right" },
      ],
      margin: [0, 0, 0, 4],
    },
    { canvas: [{ type: "line", x1: 0, y1: 0, x2: 515, y2: 0, lineWidth: 1, dash: { length: 3 } }], margin: [0, 4, 0, 6] },

    // ── ÇALIŞANIN BİLGİLERİ ──
    {
      table: {
        widths: [140, "*", 80, "*"],
        body: [
          [{ text: "ÇALIŞANIN/İŞE GİRENİN", bold: true, fontSize: 10, colSpan: 4, fillColor: "#f0f0f0" }, {}, {}, {}],
          [{ text: "Adı ve soyadı", fontSize: 9, bold: true }, { text: v(form.employeeName), fontSize: 9, colSpan: 3 }, {}, {}],
          [{ text: "T.C.Kimlik No", fontSize: 9, bold: true }, { text: v(form.tcKimlikNo), fontSize: 9, colSpan: 3 }, {}, {}],
          [{ text: "Doğum Yeri ve Tarihi", fontSize: 9, bold: true }, { text: v(form.dogumYeriTarihi), fontSize: 9 }, { text: "Cinsiyeti", fontSize: 9, bold: true }, { text: v(form.cinsiyet), fontSize: 9 }],
          [{ text: "Eğitim durumu", fontSize: 9, bold: true }, { text: v(form.egitimDurumu), fontSize: 9, colSpan: 3 }, {}, {}],
          [{ text: "Medeni durumu", fontSize: 9, bold: true }, { text: v(form.medeniDurum), fontSize: 9 }, { text: "Çocuk sayısı", fontSize: 9, bold: true }, { text: v(form.cocukSayisi), fontSize: 9 }],
          [{ text: "Ev Adresi", fontSize: 9, bold: true }, { text: v(form.evAdresi), fontSize: 9, colSpan: 3 }, {}, {}],
          [{ text: "Tel No.", fontSize: 9, bold: true }, { text: v(form.telNo), fontSize: 9, colSpan: 3 }, {}, {}],
          [{ text: "Mesleği/Meslek Dalı", fontSize: 9, bold: true }, { text: v(form.meslegi), fontSize: 9, colSpan: 3 }, {}, {}],
          [{ text: "Yaptığı iş", fontSize: 9, bold: true }, { text: v(form.yaptigiIs), fontSize: 9, colSpan: 3 }, {}, {}],
          [{ text: "Çalıştığı bölüm", fontSize: 9, bold: true }, { text: v(form.calistigiBolum), fontSize: 9, colSpan: 3 }, {}, {}],
        ],
      },
      layout: LN,
      margin: [0, 0, 0, 6],
    },

    // ── DAHA ÖNCE ÇALIŞTIĞI YERLER ──
    {
      table: {
        widths: [20, "*", "*", "*"],
        body: [
          [{ text: "Daha önce çalıştığı yerler", bold: true, fontSize: 9, colSpan: 4, fillColor: "#f0f0f0" }, {}, {}, {}],
          [{ text: "", fontSize: 8 }, { text: "İşkolu", fontSize: 8, bold: true }, { text: "Yaptığı iş", fontSize: 8, bold: true }, { text: "Giriş-çıkış tarihi", fontSize: 8, bold: true }],
          ...(form.oncekiIsler || [{ iskolu: "", yaptigiIs: "", girisCikisTarihi: "" }]).map((item: any, i: number) => [
            { text: `${i + 1}.`, fontSize: 8 },
            { text: v(item.iskolu), fontSize: 8 },
            { text: v(item.yaptigiIs), fontSize: 8 },
            { text: v(item.girisCikisTarihi), fontSize: 8 },
          ]),
        ],
      },
      layout: LN,
      margin: [0, 0, 0, 6],
    },

    // ── ÖZGEÇMİŞ ──
    {
      table: {
        widths: [120, "*"],
        body: [
          [{ text: "Özgeçmişi", bold: true, fontSize: 10, colSpan: 2, fillColor: "#f0f0f0" }, {}],
          [{ text: "Kan grubu", fontSize: 9, bold: true }, { text: v(form.kanGrubu), fontSize: 9 }],
          [{ text: "Konjenital/kronik hastalık", fontSize: 9, bold: true }, { text: v(form.konjenitalKronikHastalik), fontSize: 9 }],
          [{ text: "Bağışıklama - Tetanoz", fontSize: 9, bold: true }, { text: v(form.bagisiklamaTetanoz), fontSize: 9 }],
          [{ text: "Bağışıklama - Hepatit", fontSize: 9, bold: true }, { text: v(form.bagisiklamaHepatit), fontSize: 9 }],
          [{ text: "Bağışıklama - Diğer", fontSize: 9, bold: true }, { text: v(form.bagisiklamaDiger), fontSize: 9 }],
        ],
      },
      layout: LN,
      margin: [0, 0, 0, 6],
    },

    // ── SOYGEÇMİŞ ──
    {
      table: {
        widths: ["*", "*", "*", "*"],
        body: [
          [{ text: "Soygeçmişi", bold: true, fontSize: 10, colSpan: 4, fillColor: "#f0f0f0" }, {}, {}, {}],
          [{ text: "Anne", fontSize: 8, bold: true }, { text: "Baba", fontSize: 8, bold: true }, { text: "Kardeş", fontSize: 8, bold: true }, { text: "Çocuk", fontSize: 8, bold: true }],
          [{ text: v(form.soygecmisAnne), fontSize: 8 }, { text: v(form.soygecmisBaba), fontSize: 8 }, { text: v(form.soygecmisKardes), fontSize: 8 }, { text: v(form.soygecmisCocuk), fontSize: 8 }],
        ],
      },
      layout: LN,
      margin: [0, 0, 0, 6],
    },

    // ── TIBBİ ANAMNEZ ──
    { text: "TIBBİ ANAMNEZ", bold: true, fontSize: 10, fillColor: "#f0f0f0", margin: [0, 6, 0, 4] },

    // Soru 1: Yakınmalar
    { text: "1. Aşağıdaki yakınmalardan herhangi birini yaşadınız mı?", fontSize: 9, bold: true, margin: [0, 2, 0, 2] },
    {
      table: {
        widths: ["*", 40, 40],
        body: [
          [{ text: "", fontSize: 8 }, { text: "Hayır", fontSize: 8, bold: true, alignment: "center" }, { text: "Evet", fontSize: 8, bold: true, alignment: "center" }],
          ...["Balgamlı öksürük", "Nefes darlığı", "Göğüs ağrısı", "Çarpıntı", "Sırt ağrısı", "İshal veya kabızlık", "Eklemlerde ağrı"].map(y => [
            { text: `- ${y}`, fontSize: 8 },
            { text: form.yakınmalar?.[y]?.hayir ? "X" : "", fontSize: 8, alignment: "center" },
            { text: form.yakınmalar?.[y]?.evet ? "X" : "", fontSize: 8, alignment: "center" },
          ]),
        ],
      },
      layout: LN,
      margin: [0, 0, 0, 4],
    },

    // Soru 2: Hastalıklar
    { text: "2. Aşağıdaki hastalıklardan herhangi birini geçirdiniz mi?", fontSize: 9, bold: true, margin: [0, 2, 0, 2] },
    {
      table: {
        widths: ["*", 40, 40],
        body: [
          [{ text: "", fontSize: 8 }, { text: "Hayır", fontSize: 8, bold: true, alignment: "center" }, { text: "Evet", fontSize: 8, bold: true, alignment: "center" }],
          ...["Kalp hastalığı", "Şeker hastalığı", "Böbrek rahatsızlığı", "Sarılık", "Mide veya on iki parmak ülseri", "İşitme kaybı", "Görme bozukluğu", "Sinir sistemi hastalığı", "Deri hastalığı", "Besin zehirlenmesi"].map(h => [
            { text: `- ${h}`, fontSize: 8 },
            { text: form.hastaliklar?.[h]?.hayir ? "X" : "", fontSize: 8, alignment: "center" },
            { text: form.hastaliklar?.[h]?.evet ? "X" : "", fontSize: 8, alignment: "center" },
          ]),
        ],
      },
      layout: LN,
      margin: [0, 0, 0, 4],
    },

    // Sorular 3-8
    {
      table: {
        widths: ["*", 40, 40, "*"],
        body: [
          [{ text: "", fontSize: 8 }, { text: "Hayır", fontSize: 8, bold: true, alignment: "center" }, { text: "Evet", fontSize: 8, bold: true, alignment: "center" }, { text: "Açıklama", fontSize: 8, bold: true }],
          [{ text: "3. Hastanede yattınız mı?", fontSize: 8 }, { text: yn(form.hastaneYatis) === "Hayır" ? "X" : "", fontSize: 8, alignment: "center" }, { text: yn(form.hastaneYatis) === "Evet" ? "X" : "", fontSize: 8, alignment: "center" }, { text: v(form.hastaneYatis?.tani), fontSize: 8 }],
          [{ text: "4. Ameliyat geçirdiniz mi?", fontSize: 8 }, { text: yn(form.ameliyat) === "Hayır" ? "X" : "", fontSize: 8, alignment: "center" }, { text: yn(form.ameliyat) === "Evet" ? "X" : "", fontSize: 8, alignment: "center" }, { text: v(form.ameliyat?.neden), fontSize: 8 }],
          [{ text: "5. İş kazası geçirdiniz mi?", fontSize: 8 }, { text: yn(form.isKazasi) === "Hayır" ? "X" : "", fontSize: 8, alignment: "center" }, { text: yn(form.isKazasi) === "Evet" ? "X" : "", fontSize: 8, alignment: "center" }, { text: v(form.isKazasi?.neOldu), fontSize: 8 }],
          [{ text: "6. Meslek Hastalıkları şüphesi ile tetkik/muayeneye tabi tutuldunuz mu?", fontSize: 8 }, { text: yn(form.meslekHastaligi) === "Hayır" ? "X" : "", fontSize: 8, alignment: "center" }, { text: yn(form.meslekHastaligi) === "Evet" ? "X" : "", fontSize: 8, alignment: "center" }, { text: v(form.meslekHastaligi?.sonuc), fontSize: 8 }],
          [{ text: "7. Maluliyet aldınız mı?", fontSize: 8 }, { text: yn(form.maluliyet) === "Hayır" ? "X" : "", fontSize: 8, alignment: "center" }, { text: yn(form.maluliyet) === "Evet" ? "X" : "", fontSize: 8, alignment: "center" }, { text: `${v(form.maluliyet?.nedir)} ${v(form.maluliyet?.orani)}`, fontSize: 8 }],
          [{ text: "8. Şu anda herhangi bir tedavi görüyor musunuz?", fontSize: 8 }, { text: yn(form.tedavi) === "Hayır" ? "X" : "", fontSize: 8, alignment: "center" }, { text: yn(form.tedavi) === "Evet" ? "X" : "", fontSize: 8, alignment: "center" }, { text: v(form.tedavi?.nedir), fontSize: 8 }],
        ],
      },
      layout: LN,
      margin: [0, 0, 0, 4],
    },

    // Sigara & Alkol
    {
      table: {
        widths: ["*", "*"],
        body: [
          [
            { text: `9. Sigara: ${form.sigara?.durum === "evet" ? `Evet, ${v(form.sigara?.yil)} yıldır, ${v(form.sigara?.adetGun)} adet/gün` : form.sigara?.durum === "birakmis" ? "Bırakmış" : "Hayır"}`, fontSize: 8 },
            { text: `10. Alkol: ${form.alkol?.durum === "evet" ? `Evet, ${v(form.alkol?.yil)} yıldır, ${v(form.alkol?.siklik)} sıklıkla` : form.alkol?.durum === "birakmis" ? "Bırakmış" : "Hayır"}`, fontSize: 8 },
          ],
        ],
      },
      layout: LN,
      margin: [0, 0, 0, 6],
    },

    // ── SAYFA 2 ──
    { text: "", pageBreak: "before" },

    // ── FİZİK MUAYENE SONUÇLARI ──
    {
      table: {
        widths: [160, "*"],
        body: [
          [{ text: "FİZİK MUAYENE SONUÇLARI", bold: true, fontSize: 10, colSpan: 2, fillColor: "#f0f0f0" }, {}],
          [{ text: "a) Duyu organları", fontSize: 9, bold: true, colSpan: 2 }, {}],
          [{ text: "   - Göz", fontSize: 9 }, { text: v(form.goz), fontSize: 9 }],
          [{ text: "   - Kulak-Burun-Boğaz", fontSize: 9 }, { text: v(form.kulakBurunBogaz), fontSize: 9 }],
          [{ text: "   - Deri", fontSize: 9 }, { text: v(form.deri), fontSize: 9 }],
          [{ text: "b) Kardiyovasküler sistem muayenesi", fontSize: 9 }, { text: v(form.kardiyovaskuler), fontSize: 9 }],
          [{ text: "c) Solunum sistemi muayenesi", fontSize: 9 }, { text: v(form.solunum), fontSize: 9 }],
          [{ text: "d) Sindirim sistemi muayenesi", fontSize: 9 }, { text: v(form.sindirim), fontSize: 9 }],
          [{ text: "e) Ürogenital sistem muayenesi", fontSize: 9 }, { text: v(form.urogenital), fontSize: 9 }],
          [{ text: "f) Kas-iskelet sistemi muayenesi", fontSize: 9 }, { text: v(form.kasIskelet), fontSize: 9 }],
          [{ text: "g) Nörolojik muayene", fontSize: 9 }, { text: v(form.norolojik), fontSize: 9 }],
          [{ text: "Ğ) Psikiyatrik muayene", fontSize: 9 }, { text: v(form.psikiyatrik), fontSize: 9 }],
          [{ text: "h) Diğer", fontSize: 9 }, { text: v(form.fizikDiger), fontSize: 9 }],
        ],
      },
      layout: LN,
      margin: [0, 0, 0, 4],
    },

    // TA, Nb, Boy, Kilo, VKİ
    {
      table: {
        widths: ["*", "*", "*", "*", "*"],
        body: [
          [
            { text: `TA: ${v(form.ta)} mm-Hg`, fontSize: 8 },
            { text: `Nb: ${v(form.nb)} /dk.`, fontSize: 8 },
            { text: `Boy: ${v(form.boy)}`, fontSize: 8 },
            { text: `Kilo: ${v(form.kilo)}`, fontSize: 8 },
            { text: `VKİ: ${v(form.vki)}`, fontSize: 8 },
          ],
        ],
      },
      layout: LN,
      margin: [0, 0, 0, 6],
    },

    // ── LABORATUVAR BULGULARI ──
    {
      table: {
        widths: [160, "*"],
        body: [
          [{ text: "LABORATUVAR BULGULARI", bold: true, fontSize: 10, colSpan: 2, fillColor: "#f0f0f0" }, {}],
          [{ text: "a) Biyolojik analizler", fontSize: 9, bold: true, colSpan: 2 }, {}],
          [{ text: "   - Kan", fontSize: 9 }, { text: v(form.kan), fontSize: 9 }],
          [{ text: "   - İdrar", fontSize: 9 }, { text: v(form.idrar), fontSize: 9 }],
          [{ text: "b) Radyolojik analizler", fontSize: 9 }, { text: v(form.radyolojik), fontSize: 9 }],
          [{ text: "c) Fizyolojik analizler", fontSize: 9, bold: true, colSpan: 2 }, {}],
          [{ text: "   - Odyometre", fontSize: 9 }, { text: v(form.odyometre), fontSize: 9 }],
          [{ text: "   - SFT", fontSize: 9 }, { text: v(form.sft), fontSize: 9 }],
          [{ text: "d) Psikolojik testler", fontSize: 9 }, { text: v(form.psikolojik), fontSize: 9 }],
          [{ text: "e) Diğer", fontSize: 9 }, { text: v(form.labDiger), fontSize: 9 }],
        ],
      },
      layout: LN,
      margin: [0, 0, 0, 8],
    },

    // ── KANAAT VE SONUÇ ──
    {
      table: {
        widths: ["*"],
        body: [
          [{ text: "KANAAT VE SONUÇ", bold: true, fontSize: 10, fillColor: "#f0f0f0" }],
          [{ text: `1- ${v(form.kanaatSonuc) || "......................................................................................................."} işinde bedenen ve ruhen çalışmaya elverişlidir.`, fontSize: 9, margin: [0, 4, 0, 4] }],
          [{ text: `2- ${v(form.kanaatSart) || "......................................................................................................."} şartı ile çalışmaya elverişlidir.`, fontSize: 9, margin: [0, 4, 0, 4] }],
        ],
      },
      layout: LN,
      margin: [0, 0, 0, 4],
    },

    {
      text: "(*Yapılan muayene sonucunda çalışanın gece veya vardiyalı çalışma koşullarında çalışıp çalışamayacağı ile vücut sağlığını ve bütünlüğünü tamamlayıcı uygun alet teçhizat vs... bulunması durumunda çalışan için bu koşullarla çalışmaya elverişli olup olmadığı kanaati belirtilecektir.)",
      fontSize: 7,
      italics: true,
      color: "#666",
      margin: [0, 2, 0, 10],
    },

    // ── İMZA BÖLÜMÜ ──
    {
      columns: [
        { text: "", width: "*" },
        {
          width: 200,
          stack: [
            { text: `......./............/ 20.....`, fontSize: 9, margin: [0, 0, 0, 8] },
            { text: "İMZA", fontSize: 9, bold: true, margin: [0, 0, 0, 20] },
            { text: `Adı ve Soyadı: ${v(form.doktorAdi)}`, fontSize: 9, margin: [0, 0, 0, 4] },
            { text: `Diploma Tarih ve No: ${v(form.diplomaTarihNo)}`, fontSize: 9, margin: [0, 0, 0, 4] },
            { text: `Diploma Tescil Tarih ve No: ${v(form.diplomaTescilNo)}`, fontSize: 9, margin: [0, 0, 0, 4] },
            { text: `İşyeri Hekimliği Belgesi Tarih ve No: ${v(form.isyeriHekimBelgeNo)}`, fontSize: 9 },
          ],
        },
      ],
    },
  ];

  const docDef: any = {
    pageSize: "A4",
    pageMargins: [40, 40, 40, 40],
    content,
    defaultStyle: { font: "Roboto" },
    footer: (currentPage: number, pageCount: number) => ({
      text: `Sayfa ${currentPage} / ${pageCount}`,
      alignment: "right",
      fontSize: 7,
      color: "#999",
      margin: [0, 0, 40, 0],
    }),
  };

  const fileName = `EK2_${(form.employeeName || "form").replace(/\s/g, "_")}_${form.formTarihi || "tarihsiz"}.pdf`;
  maker.createPdf(docDef).download(fileName);
}
