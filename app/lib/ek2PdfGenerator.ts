/**
 * ek2PdfGenerator.ts — EK-2 İşe Giriş / Periyodik Muayene Formu PDF
 * Resmi formun birebir aynısı. Kompakt 2 sayfa.
 */

export async function generateEk2PDF(form: any) {
  const pdfMake = (await import("pdfmake/build/pdfmake")) as any;
  const pdfFonts = (await import("pdfmake/build/vfs_fonts")) as any;
  const maker = pdfMake.default || pdfMake;
  maker.vfs = (pdfFonts.default || pdfFonts).vfs;

  const v = (val: any) => val || "";
  const ynEvet = (obj: any) => obj?.evet === true;
  const F = 8; // base font size
  const TL = {
    hLineWidth: () => 0.4, vLineWidth: () => 0.4,
    hLineColor: () => "#000", vLineColor: () => "#000",
    paddingLeft: () => 3, paddingRight: () => 3,
    paddingTop: () => 1, paddingBottom: () => 1,
  };

  const onceki = form.oncekiIsler?.length > 0 ? [...form.oncekiIsler] : [];
  while (onceki.length < 3) onceki.push({ iskolu: "", yaptigiIs: "", girisCikisTarihi: "" });

  const yakinmaList = ["Balgamlı öksürük", "Nefes darlığı", "Göğüs ağrısı", "Çarpıntı", "Sırt ağrısı", "İshal veya kabızlık", "Eklemlerde ağrı"];
  const hastalikAll = ["Kalp hastalığı", "Şeker hastalığı", "Böbrek rahatsızlığı", "Sarılık", "Mide veya on iki parmak ülseri", "İşitme kaybı", "Görme bozukluğu", "Sinir sistemi hastalığı", "Deri hastalığı", "Besin zehirlenmesi"];

  const content: any[] = [
    // ── BAŞLIK ──
    { columns: [{ text: "", width: 40 }, { text: "İŞE GİRİŞ / PERİYODİK MUAYENE FORMU", fontSize: 12, bold: true, alignment: "center", width: "*" }, { text: "Ek-2", fontSize: 10, bold: true, alignment: "right", width: 40 }], margin: [0, 0, 0, 4] },

    // ── İŞYERİ + BEYAN + FOTOĞRAF ──
    {
      columns: [
        {
          width: "*",
          stack: [
            { table: { widths: [90, "*"], body: [
              [{ text: "İŞYERİNİN/İŞVERENİN", bold: true, fontSize: F, colSpan: 2 }, {}],
              [{ text: "Unvanı", fontSize: F }, { text: v(form.companyName), fontSize: F }],
              [{ text: "SGK Sicil No.", fontSize: F }, { text: v(form.sgkSicilNo), fontSize: F }],
              [{ text: "Adresi", fontSize: F }, { text: v(form.companyAddress), fontSize: F }],
              [{ text: "Tel ve faks", fontSize: F }, { text: v(form.companyTel), fontSize: F }],
              [{ text: "E-Posta", fontSize: F }, { text: v(form.companyEmail), fontSize: F }],
            ]}, layout: TL },
            { text: "     İşe giriş/periyodik muayene olmayı kabul ettiğimi ve muayene sırasında verdiğim bilgilerin doğru ve eksiksiz olduğunu beyan ederim.", fontSize: F, margin: [0, 3, 0, 6] },
            { text: "Çalışanın Adı Soyadı", fontSize: F, alignment: "center" },
            { text: "İMZA", fontSize: F, bold: true, alignment: "center", margin: [0, 1, 0, 0] },
          ],
        },
        {
          width: 120,
          table: { widths: [100], heights: [130], body: [[{ text: "\n\n\n\nFotoğraf", fontSize: F, alignment: "center" }]] },
          layout: TL,
          margin: [6, 0, 0, 0],
        },
      ],
      margin: [0, 0, 0, 0],
    },

    // Kesikli çizgi
    { canvas: [{ type: "line", x1: 0, y1: 0, x2: 515, y2: 0, lineWidth: 0.6, dash: { length: 3, space: 2 } }], margin: [0, 2, 0, 2] },

    // ── ÇALIŞAN ──
    { table: { widths: [140, "*", 70, "*"], body: [
      [{ text: "ÇALIŞANIN/İŞE GİRENİN", bold: true, fontSize: F, colSpan: 4 }, {}, {}, {}],
      [{ text: "Adı ve soyadı", fontSize: F }, { text: v(form.employeeName), fontSize: F, colSpan: 3 }, {}, {}],
      [{ text: "T.C.Kimlik No", fontSize: F }, { text: v(form.tcKimlikNo), fontSize: F, colSpan: 3 }, {}, {}],
      [{ text: "Doğum Yeri ve Tarihi", fontSize: F }, { text: v(form.dogumYeriTarihi), fontSize: F, colSpan: 3 }, {}, {}],
      [{ text: "Cinsiyeti", fontSize: F }, { text: v(form.cinsiyet), fontSize: F, colSpan: 3 }, {}, {}],
      [{ text: "Eğitim durumu", fontSize: F }, { text: v(form.egitimDurumu), fontSize: F, colSpan: 3 }, {}, {}],
      [{ text: "Medeni durumu", fontSize: F }, { text: v(form.medeniDurum), fontSize: F }, { text: "Çocuk sayısı", fontSize: F }, { text: v(form.cocukSayisi), fontSize: F }],
      [{ text: "Ev Adresi", fontSize: F }, { text: v(form.evAdresi), fontSize: F, colSpan: 3 }, {}, {}],
      [{ text: "Tel No.", fontSize: F }, { text: v(form.telNo), fontSize: F, colSpan: 3 }, {}, {}],
      [{ text: "Mesleği/Meslek Dalı", fontSize: F }, { text: v(form.meslegi), fontSize: F, colSpan: 3 }, {}, {}],
      [{ text: "Yaptığı iş (Ayrıntılı olarak tanımlanacaktır.)", fontSize: F }, { text: v(form.yaptigiIs), fontSize: F, colSpan: 3 }, {}, {}],
      [{ text: "Çalıştığı bölüm", fontSize: F }, { text: v(form.calistigiBolum), fontSize: F, colSpan: 3 }, {}, {}],
    ]}, layout: TL, margin: [0, 0, 0, 0] },

    // ── DAHA ÖNCE ÇALIŞTIĞI YERLER ──
    { table: { widths: [140, "*", "*", 90], body: [
      [{ text: "Daha önce çalıştığı yerler\n(Bu günden geçmişe doğru)", fontSize: F }, { text: "İşkolu", fontSize: F }, { text: "Yaptığı iş", fontSize: F }, { text: "Giriş-çıkış tarihi", fontSize: F }],
      ...onceki.map((item: any, i: number) => [{ text: `${i + 1}.`, fontSize: F }, { text: v(item.iskolu), fontSize: F }, { text: v(item.yaptigiIs), fontSize: F }, { text: v(item.girisCikisTarihi), fontSize: F }]),
    ]}, layout: TL, margin: [0, 0, 0, 0] },

    // ── ÖZGEÇMİŞ ──
    { table: { widths: [140, "*"], body: [
      [{ text: "Özgeçmişi", bold: true, fontSize: F, colSpan: 2 }, {}],
      [{ text: "Kan grubu", fontSize: F }, { text: v(form.kanGrubu), fontSize: F }],
      [{ text: "Konjenital/kronik hastalık", fontSize: F }, { text: v(form.konjenitalKronikHastalik), fontSize: F }],
      [{ text: "Bağışıklama", fontSize: F }, { text: "", fontSize: F }],
      [{ text: "  - Tetanoz", fontSize: F }, { text: v(form.bagisiklamaTetanoz), fontSize: F }],
      [{ text: "  - Hepatit", fontSize: F }, { text: v(form.bagisiklamaHepatit), fontSize: F }],
      [{ text: "  - Diğer", fontSize: F }, { text: v(form.bagisiklamaDiger), fontSize: F }],
    ]}, layout: TL, margin: [0, 0, 0, 0] },

    // ── SOYGEÇMİŞ ──
    { table: { widths: ["*", "*", "*", "*"], body: [
      [{ text: "Soygeçmişi", bold: true, fontSize: F, colSpan: 4 }, {}, {}, {}],
      [{ text: `Anne\n${v(form.soygecmisAnne)}`, fontSize: F }, { text: `Baba\n${v(form.soygecmisBaba)}`, fontSize: F }, { text: `Kardeş\n${v(form.soygecmisKardes)}`, fontSize: F }, { text: `Çocuk\n${v(form.soygecmisCocuk)}`, fontSize: F }],
    ]}, layout: TL, margin: [0, 0, 0, 2] },

    // ── TIBBİ ANAMNEZ ──
    { text: "TIBBİ ANAMNEZ", bold: true, fontSize: F, margin: [0, 2, 0, 1] },

    // Soru 1 - Yakınmalar
    { table: { widths: ["*", 40, 40], body: [
      [{ text: "1. Aşağıdaki yakınmalardan herhangi birini yaşadınız mı?", fontSize: F }, { text: "Hayır", fontSize: 7, alignment: "center" }, { text: "Evet", fontSize: 7, alignment: "center" }],
      ...yakinmaList.map(y => [{ text: `- ${y}`, fontSize: F }, { text: !ynEvet(form.yakınmalar?.[y]) ? "X" : "", fontSize: F, alignment: "center" }, { text: ynEvet(form.yakınmalar?.[y]) ? "X" : "", fontSize: F, alignment: "center" }]),
    ]}, layout: TL, margin: [0, 0, 0, 0] },

    // Soru 2 - Tüm hastalıklar tek tabloda
    { table: { widths: ["*", 40, 40], body: [
      [{ text: "2. Aşağıdaki hastalıklardan herhangi birini geçirdiniz mi?", fontSize: F }, { text: "Hayır", fontSize: 7, alignment: "center" }, { text: "Evet", fontSize: 7, alignment: "center" }],
      ...hastalikAll.map(h => [{ text: `- ${h}`, fontSize: F }, { text: !ynEvet(form.hastaliklar?.[h]) ? "X" : "", fontSize: F, alignment: "center" }, { text: ynEvet(form.hastaliklar?.[h]) ? "X" : "", fontSize: F, alignment: "center" }]),
    ]}, layout: TL, margin: [0, 0, 0, 0] },

    // ══════════════ SAYFA 2 ══════════════
    { text: "", pageBreak: "before" },

    // Sorular 3-8
    { table: { widths: ["*", 40, "*"], body: [
      [{ text: "3. Hastanede yattınız mı?", fontSize: F }, { text: "Hayır", fontSize: F, alignment: "center" }, { text: `Evet, ise tanı? ${v(form.hastaneYatis?.tani)}`, fontSize: F }],
      [{ text: "4. Ameliyat geçirdiniz mi?", fontSize: F }, { text: "Hayır", fontSize: F, alignment: "center" }, { text: `Evet, ise neden? ${v(form.ameliyat?.neden)}`, fontSize: F }],
      [{ text: "5. İş kazası geçirdiniz mi?", fontSize: F }, { text: "Hayır", fontSize: F, alignment: "center" }, { text: `Evet, ise ne oldu? ${v(form.isKazasi?.neOldu)}`, fontSize: F }],
      [{ text: "6. Meslek Hastalıkları şüphesi ile ilgili tetkik ve\nmuayeneye tabi tutuldunuz mu?", fontSize: F }, { text: "Hayır", fontSize: F, alignment: "center" }, { text: `Evet, ise sonuç? ${v(form.meslekHastaligi?.sonuc)}`, fontSize: F }],
      [{ text: "7. Maluliyet aldınız mı?", fontSize: F }, { text: "Hayır", fontSize: F, alignment: "center" }, { text: `Evet, ise nedir ve oranı? ${v(form.maluliyet?.nedir)} ${v(form.maluliyet?.orani)}`, fontSize: F }],
      [{ text: "8. Şu anda herhangi bir tedavi görüyor musunuz?", fontSize: F }, { text: "Hayır", fontSize: F, alignment: "center" }, { text: `Evet, ise nedir? ${v(form.tedavi?.nedir)}`, fontSize: F }],
    ]}, layout: TL, margin: [0, 0, 0, 0] },

    // Sigara (9)
    { table: { widths: [140, 70, "*", "*", "*"], body: [
      [{ text: "9. Sigara içiyor musunuz?", fontSize: F, rowSpan: 3 }, { text: "Hayır", fontSize: F }, { text: "", fontSize: F, colSpan: 3 }, {}, {}],
      [{}, { text: "Bırakmış", fontSize: F }, { text: "..........ay/yıl önce", fontSize: 7 }, { text: ".............ay/yıl içmiş", fontSize: 7 }, { text: "...........adet/gün içmiş", fontSize: 7 }],
      [{}, { text: "Evet", fontSize: F }, { text: `${v(form.sigara?.yil)}..........yıldır`, fontSize: 7 }, { text: `${v(form.sigara?.adetGun)}..............adet/gün`, fontSize: 7, colSpan: 2 }, {}],
    ]}, layout: TL, margin: [0, 0, 0, 0] },

    // Alkol (10)
    { table: { widths: [140, 70, "*", "*", "*"], body: [
      [{ text: "10. Alkol alıyor musunuz?", fontSize: F, rowSpan: 3 }, { text: "Hayır", fontSize: F }, { text: "", fontSize: F, colSpan: 3 }, {}, {}],
      [{}, { text: "Bırakmış", fontSize: F }, { text: "..............yıl önce", fontSize: 7 }, { text: "..............yıl içmiş", fontSize: 7 }, { text: "................sıklıkla içmiş", fontSize: 7 }],
      [{}, { text: "Evet", fontSize: F }, { text: `${v(form.alkol?.yil)}.........yıldır`, fontSize: 7 }, { text: `${v(form.alkol?.siklik)}..............sıklıkla`, fontSize: 7, colSpan: 2 }, {}],
    ]}, layout: TL, margin: [0, 0, 0, 0] },

    // ── FİZİK MUAYENE ──
    { table: { widths: [200, "*"], body: [
      [{ text: "FİZİK MUAYENE SONUÇLARI", bold: true, fontSize: F, colSpan: 2 }, {}],
      [{ text: "a) Duyu organları", fontSize: F, colSpan: 2 }, {}],
      [{ text: "  - Göz", fontSize: F }, { text: v(form.goz), fontSize: F }],
      [{ text: "  - Kulak-Burun-Boğaz", fontSize: F }, { text: v(form.kulakBurunBogaz), fontSize: F }],
      [{ text: "  - Deri", fontSize: F }, { text: v(form.deri), fontSize: F }],
      [{ text: "b) Kardiyovasküler sistem muayenesi", fontSize: F }, { text: v(form.kardiyovaskuler), fontSize: F }],
      [{ text: "c) Solunum sistemi muayenesi", fontSize: F }, { text: v(form.solunum), fontSize: F }],
      [{ text: "d) Sindirim sistemi muayenesi", fontSize: F }, { text: v(form.sindirim), fontSize: F }],
      [{ text: "e) Ürogenital sistem muayenesi", fontSize: F }, { text: v(form.urogenital), fontSize: F }],
      [{ text: "f) Kas-iskelet sistemi muayenesi", fontSize: F }, { text: v(form.kasIskelet), fontSize: F }],
      [{ text: "g) Nörolojik muayene", fontSize: F }, { text: v(form.norolojik), fontSize: F }],
      [{ text: "Ğ) Psikiyatrik muayene", fontSize: F }, { text: v(form.psikiyatrik), fontSize: F }],
      [{ text: "h) Diğer", fontSize: F }, { text: v(form.fizikDiger), fontSize: F }],
    ]}, layout: TL, margin: [0, 0, 0, 0] },

    // TA, Nb, Boy/Kilo/VKİ
    { table: { widths: [45, 30, 70, 45, 30, 70, "*"], body: [
      [{ text: "-TA :", fontSize: F }, { text: v(form.ta), fontSize: F }, { text: "/ mm-Hg", fontSize: F, colSpan: 5 }, {}, {}, {}, {}],
      [{ text: "-Nb :", fontSize: F }, { text: v(form.nb), fontSize: F }, { text: "/ dk.", fontSize: F, colSpan: 5 }, {}, {}, {}, {}],
      [{ text: "-Boy:", fontSize: F }, { text: v(form.boy), fontSize: F }, { text: "", fontSize: F }, { text: "Kilo:", fontSize: F }, { text: v(form.kilo), fontSize: F }, { text: "Vücut Kitle İndeksi:", fontSize: F }, { text: v(form.vki), fontSize: F }],
    ]}, layout: TL, margin: [0, 0, 0, 0] },

    // ── LABORATUVAR ──
    { table: { widths: [200, "*"], body: [
      [{ text: "LABORATUVAR BULGULARI", bold: true, fontSize: F, colSpan: 2 }, {}],
      [{ text: "a) Biyolojik analizler", fontSize: F, colSpan: 2 }, {}],
      [{ text: "  - Kan", fontSize: F }, { text: v(form.kan), fontSize: F }],
      [{ text: "  - İdrar", fontSize: F }, { text: v(form.idrar), fontSize: F }],
      [{ text: "b) Radyolojik analizler", fontSize: F }, { text: v(form.radyolojik), fontSize: F }],
      [{ text: "c) Fizyolojik analizler", fontSize: F, colSpan: 2 }, {}],
      [{ text: "  - Odyometre", fontSize: F }, { text: v(form.odyometre), fontSize: F }],
      [{ text: "  - SFT", fontSize: F }, { text: v(form.sft), fontSize: F }],
      [{ text: "d) Psikolojik testler", fontSize: F }, { text: v(form.psikolojik), fontSize: F }],
      [{ text: "e) Diğer", fontSize: F }, { text: v(form.labDiger), fontSize: F }],
    ]}, layout: TL, margin: [0, 0, 0, 2] },

    // ── KANAAT VE SONUÇ ──
    { text: "KANAAT VE SONUÇ * :", bold: true, fontSize: F, margin: [0, 2, 0, 3] },
    { text: [{ text: "1- ", bold: true, fontSize: F }, { text: v(form.kanaatSonuc) || ".....................................................................................................................................................", fontSize: F }, { text: " işinde bedenen ve ruhen çalışmaya elverişlidir.", bold: true, fontSize: F }], margin: [0, 0, 0, 3] },
    { text: [{ text: "2- ", bold: true, fontSize: F }, { text: v(form.kanaatSart) || "...................................................................................................................................", fontSize: F }, { text: " şartı ile çalışmaya elverişlidir", bold: true, fontSize: F }], margin: [0, 0, 0, 3] },
    { text: "(*Yapılan muayene sonucunda çalışanın gece veya vardiyalı çalışma koşullarında çalışıp çalışamayacağı ile vücut sağlığını ve bütünlüğünü tamamlayıcı uygun alet teçhizat vs... bulunması durumunda çalışan için bu koşullarla çalışmaya elverişli olup olmadığı kanaati belirtilecektir.)", fontSize: 6.5, italics: true, margin: [0, 0, 0, 8] },

    // Tarih + İmza
    { text: "……...... /............. / 20.............", fontSize: F, alignment: "right", margin: [0, 0, 0, 6] },
    { stack: [
      { text: "İMZA", bold: true, fontSize: F, margin: [0, 0, 0, 2] },
      { text: `Adı ve Soyadı: ${v(form.doktorAdi)}`, fontSize: F },
      { text: `Diploma Tarih ve No: ${v(form.diplomaTarihNo)}`, fontSize: F },
      { text: `Diploma Tescil Tarih ve No: ${v(form.diplomaTescilNo)}`, fontSize: F },
      { text: `İşyeri Hekimliği Belgesi Tarih ve No: ${v(form.isyeriHekimBelgeNo)}`, fontSize: F },
    ]},
  ];

  const docDef: any = {
    pageSize: "A4",
    pageMargins: [36, 24, 36, 24],
    content,
    defaultStyle: {},
  };

  const fileName = `EK2_${(form.employeeName || "form").replace(/\s/g, "_")}_${form.formTarihi || "tarihsiz"}.pdf`;
  maker.createPdf(docDef).download(fileName);
}
