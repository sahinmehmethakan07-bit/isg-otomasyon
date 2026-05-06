/**
 * ek2PdfGenerator.ts — EK-2 İşe Giriş / Periyodik Muayene Formu PDF Oluşturucu
 *
 * Resmi formun birebir aynısını pdfmake ile oluşturur.
 * Sayfa 1: İşyeri + Beyan/Fotoğraf + Çalışan + Önceki İşler + Özgeçmiş + Soygeçmiş + Tıbbi Anamnez (soru 1-2 kısmi)
 * Sayfa 2: Hastalıklar devam + Soru 3-10 + Fizik Muayene + Laboratuvar + Kanaat + İmza
 */

export async function generateEk2PDF(form: any) {
  const pdfMake = (await import("pdfmake/build/pdfmake")) as any;
  const pdfFonts = (await import("pdfmake/build/vfs_fonts")) as any;
  const maker = pdfMake.default || pdfMake;
  maker.vfs = (pdfFonts.default || pdfFonts).vfs;

  const v = (val: any) => val || "";
  const ynEvet = (obj: any) => obj?.evet === true;

  const TL = {
    hLineWidth: () => 0.5,
    vLineWidth: () => 0.5,
    hLineColor: () => "#000",
    vLineColor: () => "#000",
    paddingLeft: () => 4,
    paddingRight: () => 4,
    paddingTop: () => 2,
    paddingBottom: () => 2,
  };

  const onceki = form.oncekiIsler?.length > 0
    ? [...form.oncekiIsler]
    : [{ iskolu: "", yaptigiIs: "", girisCikisTarihi: "" }];
  while (onceki.length < 3) onceki.push({ iskolu: "", yaptigiIs: "", girisCikisTarihi: "" });

  const yakinmaList = [
    "Balgamlı öksürük", "Nefes darlığı", "Göğüs ağrısı", "Çarpıntı",
    "Sırt ağrısı", "İshal veya kabızlık", "Eklemlerde ağrı",
  ];

  const hastalikList = [
    "Kalp hastalığı", "Şeker hastalığı", "Böbrek rahatsızlığı", "Sarılık",
  ];

  const hastalikList2 = [
    "Mide veya on iki parmak ülseri", "İşitme kaybı", "Görme bozukluğu",
    "Sinir sistemi hastalığı", "Deri hastalığı", "Besin zehirlenmesi",
  ];

  // ════════════════════════════════════════════════════════════════════
  // SAYFA 1
  // ════════════════════════════════════════════════════════════════════

  const content: any[] = [
    // BAŞLIK
    {
      columns: [
        { text: "", width: 40 },
        { text: "İŞE GİRİŞ / PERİYODİK MUAYENE FORMU", fontSize: 13, bold: true, alignment: "center", width: "*" },
        { text: "Ek-2", fontSize: 11, bold: true, alignment: "right", width: 40 },
      ],
      margin: [0, 0, 0, 8],
    },

    // İŞYERİNİN/İŞVERENİN
    {
      table: {
        widths: [100, "*"],
        body: [
          [{ text: "İŞYERİNİN/İŞVERENİN", bold: true, fontSize: 9, colSpan: 2 }, {}],
          [{ text: "Unvanı", fontSize: 9 }, { text: v(form.companyName), fontSize: 9 }],
          [{ text: "SGK Sicil No.", fontSize: 9 }, { text: v(form.sgkSicilNo), fontSize: 9 }],
          [{ text: "Adresi", fontSize: 9 }, { text: v(form.companyAddress), fontSize: 9 }],
          [{ text: "Tel ve faks", fontSize: 9 }, { text: v(form.companyTel), fontSize: 9 }],
          [{ text: "E-Posta", fontSize: 9 }, { text: v(form.companyEmail), fontSize: 9 }],
        ],
      },
      layout: TL,
      margin: [0, 0, 0, 0],
    },

    // BEYAN + FOTOĞRAF
    {
      columns: [
        {
          width: "*",
          stack: [
            {
              text: "        İşe giriş/periyodik muayene olmayı kabul ettiğimi ve muayene sırasında verdiğim bilgilerin doğru ve eksiksiz olduğunu beyan ederim.",
              fontSize: 9,
              margin: [0, 6, 0, 10],
            },
            {
              text: "Çalışanın Adı Soyadı",
              fontSize: 9,
              alignment: "center",
              margin: [0, 0, 0, 2],
            },
            { text: "İMZA", fontSize: 9, bold: true, alignment: "center", margin: [0, 0, 0, 4] },
          ],
        },
        {
          width: 100,
          table: {
            widths: [80],
            heights: [70],
            body: [
              [{ text: "Fotoğraf", fontSize: 8, alignment: "center", margin: [0, 28, 0, 0] }],
            ],
          },
          layout: TL,
          margin: [10, 4, 0, 0],
        },
      ],
      margin: [0, 0, 0, 0],
    },

    // Kesikli çizgi
    { canvas: [{ type: "line", x1: 0, y1: 0, x2: 515, y2: 0, lineWidth: 0.8, dash: { length: 4, space: 2 } }], margin: [0, 4, 0, 4] },

    // ÇALIŞANIN/İŞE GİRENİN
    {
      table: {
        widths: [160, "*", 80, "*"],
        body: [
          [{ text: "ÇALIŞANIN/İŞE GİRENİN", bold: true, fontSize: 9, colSpan: 4 }, {}, {}, {}],
          [{ text: "Adı ve soyadı", fontSize: 9 }, { text: v(form.employeeName), fontSize: 9, colSpan: 3 }, {}, {}],
          [{ text: "T.C.Kimlik No", fontSize: 9 }, { text: v(form.tcKimlikNo), fontSize: 9, colSpan: 3 }, {}, {}],
          [{ text: "Doğum Yeri ve Tarihi", fontSize: 9 }, { text: v(form.dogumYeriTarihi), fontSize: 9, colSpan: 3 }, {}, {}],
          [{ text: "Cinsiyeti", fontSize: 9 }, { text: v(form.cinsiyet), fontSize: 9, colSpan: 3 }, {}, {}],
          [{ text: "Eğitim durumu", fontSize: 9 }, { text: v(form.egitimDurumu), fontSize: 9, colSpan: 3 }, {}, {}],
          [{ text: "Medeni durumu", fontSize: 9 }, { text: v(form.medeniDurum), fontSize: 9 }, { text: "Çocuk sayısı", fontSize: 9 }, { text: v(form.cocukSayisi), fontSize: 9 }],
          [{ text: "Ev Adresi", fontSize: 9 }, { text: v(form.evAdresi), fontSize: 9, colSpan: 3 }, {}, {}],
          [{ text: "Tel No.", fontSize: 9 }, { text: v(form.telNo), fontSize: 9, colSpan: 3 }, {}, {}],
          [{ text: "Mesleği/Meslek Dalı", fontSize: 9 }, { text: v(form.meslegi), fontSize: 9, colSpan: 3 }, {}, {}],
          [{ text: "Yaptığı iş (Ayrıntılı olarak tanımlanacaktır.)", fontSize: 9 }, { text: v(form.yaptigiIs), fontSize: 9, colSpan: 3 }, {}, {}],
          [{ text: "Çalıştığı bölüm", fontSize: 9 }, { text: v(form.calistigiBolum), fontSize: 9, colSpan: 3 }, {}, {}],
        ],
      },
      layout: TL,
      margin: [0, 0, 0, 0],
    },

    // DAHA ÖNCE ÇALIŞTIĞI YERLER
    {
      table: {
        widths: [160, "*", "*", 100],
        body: [
          [
            { text: "Daha önce çalıştığı yerler\n(Bu günden geçmişe doğru)", fontSize: 9 },
            { text: "İşkolu", fontSize: 9 },
            { text: "Yaptığı iş", fontSize: 9 },
            { text: "Giriş-çıkış tarihi", fontSize: 9 },
          ],
          ...onceki.map((item: any, i: number) => [
            { text: `${i + 1}.`, fontSize: 9 },
            { text: v(item.iskolu), fontSize: 9 },
            { text: v(item.yaptigiIs), fontSize: 9 },
            { text: v(item.girisCikisTarihi), fontSize: 9 },
          ]),
        ],
      },
      layout: TL,
      margin: [0, 0, 0, 0],
    },

    // ÖZGEÇMİŞİ
    {
      table: {
        widths: [160, "*"],
        body: [
          [{ text: "Özgeçmişi", bold: true, fontSize: 9, colSpan: 2 }, {}],
          [{ text: "Kan grubu", fontSize: 9 }, { text: v(form.kanGrubu), fontSize: 9 }],
          [{ text: "Konjenital/kronik hastalık", fontSize: 9 }, { text: v(form.konjenitalKronikHastalik), fontSize: 9 }],
          [{ text: "Bağışıklama", fontSize: 9 }, { text: "", fontSize: 9 }],
          [{ text: "  - Tetanoz", fontSize: 9 }, { text: v(form.bagisiklamaTetanoz), fontSize: 9 }],
          [{ text: "  - Hepatit", fontSize: 9 }, { text: v(form.bagisiklamaHepatit), fontSize: 9 }],
          [{ text: "  - Diğer", fontSize: 9 }, { text: v(form.bagisiklamaDiger), fontSize: 9 }],
        ],
      },
      layout: TL,
      margin: [0, 0, 0, 0],
    },

    // SOYGEÇMİŞİ
    {
      table: {
        widths: ["*", "*", "*", "*"],
        body: [
          [{ text: "Soygeçmişi", bold: true, fontSize: 9, colSpan: 4 }, {}, {}, {}],
          [
            { text: `Anne\n${v(form.soygecmisAnne)}`, fontSize: 9 },
            { text: `Baba\n${v(form.soygecmisBaba)}`, fontSize: 9 },
            { text: `Kardeş\n${v(form.soygecmisKardes)}`, fontSize: 9 },
            { text: `Çocuk\n${v(form.soygecmisCocuk)}`, fontSize: 9 },
          ],
        ],
      },
      layout: TL,
      margin: [0, 0, 0, 4],
    },

    // TIBBİ ANAMNEZ
    { text: "TIBBİ ANAMNEZ", bold: true, fontSize: 9, margin: [0, 4, 0, 2] },

    // Soru 1
    {
      table: {
        widths: ["*", 50, 50],
        body: [
          [
            { text: "1. Aşağıdaki yakınmalardan herhangi birini yaşadınız mı?", fontSize: 9 },
            { text: "Hayır", fontSize: 9, alignment: "center" },
            { text: "Evet", fontSize: 9, alignment: "center" },
          ],
          ...yakinmaList.map(y => [
            { text: `- ${y}`, fontSize: 9 },
            { text: !ynEvet(form.yakınmalar?.[y]) ? "X" : "", fontSize: 9, alignment: "center" },
            { text: ynEvet(form.yakınmalar?.[y]) ? "X" : "", fontSize: 9, alignment: "center" },
          ]),
        ],
      },
      layout: TL,
      margin: [0, 0, 0, 0],
    },

    // Soru 2 (ilk 4 — sayfa 1 sonu)
    {
      table: {
        widths: ["*", 50, 50],
        body: [
          [
            { text: "2. Aşağıdaki hastalıklardan herhangi birini geçirdiniz mi?", fontSize: 9 },
            { text: "Hayır", fontSize: 9, alignment: "center" },
            { text: "Evet", fontSize: 9, alignment: "center" },
          ],
          ...hastalikList.map(h => [
            { text: `- ${h}`, fontSize: 9 },
            { text: !ynEvet(form.hastaliklar?.[h]) ? "X" : "", fontSize: 9, alignment: "center" },
            { text: ynEvet(form.hastaliklar?.[h]) ? "X" : "", fontSize: 9, alignment: "center" },
          ]),
        ],
      },
      layout: TL,
      margin: [0, 0, 0, 0],
    },

    // ════════════════════════════════════════════════════════════════════
    // SAYFA 2
    // ════════════════════════════════════════════════════════════════════
    { text: "", pageBreak: "before" },

    // Hastalıklar devam
    {
      table: {
        widths: ["*", 50, 50],
        body: hastalikList2.map(h => [
          { text: `- ${h}`, fontSize: 9 },
          { text: !ynEvet(form.hastaliklar?.[h]) ? "X" : "", fontSize: 9, alignment: "center" },
          { text: ynEvet(form.hastaliklar?.[h]) ? "X" : "", fontSize: 9, alignment: "center" },
        ]),
      },
      layout: TL,
      margin: [0, 0, 0, 4],
    },

    // Sorular 3-8
    {
      table: {
        widths: ["*", 50, "*"],
        body: [
          [
            { text: "3. Hastanede yattınız mı?", fontSize: 9 },
            { text: "Hayır", fontSize: 9, alignment: "center" },
            { text: `Evet, ise tanı? ${v(form.hastaneYatis?.tani)}`, fontSize: 9 },
          ],
          [
            { text: "4. Ameliyat geçirdiniz mi?", fontSize: 9 },
            { text: "Hayır", fontSize: 9, alignment: "center" },
            { text: `Evet, ise neden? ${v(form.ameliyat?.neden)}`, fontSize: 9 },
          ],
          [
            { text: "5. İş kazası geçirdiniz mi?", fontSize: 9 },
            { text: "Hayır", fontSize: 9, alignment: "center" },
            { text: `Evet, ise ne oldu? ${v(form.isKazasi?.neOldu)}`, fontSize: 9 },
          ],
          [
            { text: "6. Meslek Hastalıkları şüphesi ile ilgili tetkik ve\nmuayeneye tabi tutuldunuz mu?", fontSize: 9 },
            { text: "Hayır", fontSize: 9, alignment: "center" },
            { text: `Evet, ise sonuç? ${v(form.meslekHastaligi?.sonuc)}`, fontSize: 9 },
          ],
          [
            { text: "7. Maluliyet aldınız mı?", fontSize: 9 },
            { text: "Hayır", fontSize: 9, alignment: "center" },
            { text: `Evet, ise nedir ve\noranı? ${v(form.maluliyet?.nedir)} ${v(form.maluliyet?.orani)}`, fontSize: 9 },
          ],
          [
            { text: "8. Şu anda herhangi bir tedavi görüyor musunuz?", fontSize: 9 },
            { text: "Hayır", fontSize: 9, alignment: "center" },
            { text: `Evet, ise nedir? ${v(form.tedavi?.nedir)}`, fontSize: 9 },
          ],
        ],
      },
      layout: TL,
      margin: [0, 0, 0, 0],
    },

    // Sigara (9)
    {
      table: {
        widths: [160, 80, "*", "*", "*"],
        body: [
          [
            { text: "9. Sigara içiyor musunuz?", fontSize: 9, rowSpan: 3 },
            { text: "Hayır", fontSize: 9 },
            { text: "", fontSize: 9, colSpan: 3 }, {}, {},
          ],
          [
            {},
            { text: "Bırakmış", fontSize: 9 },
            { text: "..........ay/yıl önce", fontSize: 8 },
            { text: ".............ay/yıl içmiş", fontSize: 8 },
            { text: "...........adet/gün içmiş", fontSize: 8 },
          ],
          [
            {},
            { text: "Evet", fontSize: 9 },
            { text: `${v(form.sigara?.yil)}..........yıldır`, fontSize: 8 },
            { text: `${v(form.sigara?.adetGun)}..............adet/gün`, fontSize: 8, colSpan: 2 }, {},
          ],
        ],
      },
      layout: TL,
      margin: [0, 0, 0, 0],
    },

    // Alkol (10)
    {
      table: {
        widths: [160, 80, "*", "*", "*"],
        body: [
          [
            { text: "10. Alkol alıyor musunuz?", fontSize: 9, rowSpan: 3 },
            { text: "Hayır", fontSize: 9 },
            { text: "", fontSize: 9, colSpan: 3 }, {}, {},
          ],
          [
            {},
            { text: "Bırakmış", fontSize: 9 },
            { text: "..............yıl önce", fontSize: 8 },
            { text: "..............yıl içmiş", fontSize: 8 },
            { text: "................sıklıkla içmiş", fontSize: 8 },
          ],
          [
            {},
            { text: "Evet", fontSize: 9 },
            { text: `${v(form.alkol?.yil)}.........yıldır`, fontSize: 8 },
            { text: `${v(form.alkol?.siklik)}..............sıklıkla`, fontSize: 8, colSpan: 2 }, {},
          ],
        ],
      },
      layout: TL,
      margin: [0, 0, 0, 0],
    },

    // FİZİK MUAYENE SONUÇLARI
    {
      table: {
        widths: [220, "*"],
        body: [
          [{ text: "FİZİK MUAYENE SONUÇLARI", bold: true, fontSize: 9, colSpan: 2 }, {}],
          [{ text: "a) Duyu organları", fontSize: 9, colSpan: 2 }, {}],
          [{ text: "  - Göz", fontSize: 9 }, { text: v(form.goz), fontSize: 9 }],
          [{ text: "  - Kulak-Burun-Boğaz", fontSize: 9 }, { text: v(form.kulakBurunBogaz), fontSize: 9 }],
          [{ text: "  - Deri", fontSize: 9 }, { text: v(form.deri), fontSize: 9 }],
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
      layout: TL,
      margin: [0, 0, 0, 0],
    },

    // TA, Nb, Boy/Kilo/VKİ
    {
      table: {
        widths: [50, 30, 80, 50, 30, 80, "*"],
        body: [
          [
            { text: "-TA :", fontSize: 9 },
            { text: v(form.ta), fontSize: 9 },
            { text: "/ mm-Hg", fontSize: 9, colSpan: 5 }, {}, {}, {}, {},
          ],
          [
            { text: "-Nb :", fontSize: 9 },
            { text: v(form.nb), fontSize: 9 },
            { text: "/ dk.", fontSize: 9, colSpan: 5 }, {}, {}, {}, {},
          ],
          [
            { text: "-Boy:", fontSize: 9 },
            { text: v(form.boy), fontSize: 9 },
            { text: "", fontSize: 9 },
            { text: "Kilo:", fontSize: 9 },
            { text: v(form.kilo), fontSize: 9 },
            { text: "Vücut Kitle İndeksi:", fontSize: 9 },
            { text: v(form.vki), fontSize: 9 },
          ],
        ],
      },
      layout: TL,
      margin: [0, 0, 0, 0],
    },

    // LABORATUVAR BULGULARI
    {
      table: {
        widths: [220, "*"],
        body: [
          [{ text: "LABORATUVAR BULGULARI", bold: true, fontSize: 9, colSpan: 2 }, {}],
          [{ text: "a) Biyolojik analizler", fontSize: 9, colSpan: 2 }, {}],
          [{ text: "  - Kan", fontSize: 9 }, { text: v(form.kan), fontSize: 9 }],
          [{ text: "  - İdrar", fontSize: 9 }, { text: v(form.idrar), fontSize: 9 }],
          [{ text: "b) Radyolojik analizler", fontSize: 9 }, { text: v(form.radyolojik), fontSize: 9 }],
          [{ text: "c) Fizyolojik analizler", fontSize: 9, colSpan: 2 }, {}],
          [{ text: "  - Odyometre", fontSize: 9 }, { text: v(form.odyometre), fontSize: 9 }],
          [{ text: "  - SFT", fontSize: 9 }, { text: v(form.sft), fontSize: 9 }],
          [{ text: "d) Psikolojik testler", fontSize: 9 }, { text: v(form.psikolojik), fontSize: 9 }],
          [{ text: "e) Diğer", fontSize: 9 }, { text: v(form.labDiger), fontSize: 9 }],
        ],
      },
      layout: TL,
      margin: [0, 0, 0, 4],
    },

    // KANAAT VE SONUÇ
    {
      text: "KANAAT VE SONUÇ * :",
      bold: true,
      fontSize: 9,
      margin: [0, 4, 0, 6],
    },
    {
      text: [
        { text: "1- ", bold: true, fontSize: 9 },
        { text: v(form.kanaatSonuc) || ".....................................................................................................................................................", fontSize: 9 },
        { text: " işinde bedenen ve ruhen çalışmaya elverişlidir.", bold: true, fontSize: 9 },
      ],
      margin: [0, 0, 0, 6],
    },
    {
      text: [
        { text: "2- ", bold: true, fontSize: 9 },
        { text: v(form.kanaatSart) || "...................................................................................................................................", fontSize: 9 },
        { text: " şartı ile çalışmaya elverişlidir", bold: true, fontSize: 9 },
      ],
      margin: [0, 0, 0, 6],
    },
    {
      text: "(*Yapılan muayene sonucunda çalışanın gece veya vardiyalı çalışma koşullarında çalışıp çalışamayacağı ile vücut sağlığını ve bütünlüğünü tamamlayıcı uygun alet teçhizat vs... bulunması durumunda çalışan için bu koşullarla çalışmaya elverişli olup olmadığı kanaati belirtilecektir.)",
      fontSize: 7,
      italics: true,
      margin: [0, 0, 0, 14],
    },

    // Tarih (sağ)
    {
      text: "……...... /............. / 20.............",
      fontSize: 9,
      alignment: "right",
      margin: [0, 0, 0, 10],
    },

    // İMZA bölümü (sol)
    {
      stack: [
        { text: "İMZA", bold: true, fontSize: 9, margin: [0, 0, 0, 4] },
        { text: `Adı ve Soyadı: ${v(form.doktorAdi)}`, fontSize: 9, margin: [0, 0, 0, 2] },
        { text: `Diploma Tarih ve No: ${v(form.diplomaTarihNo)}`, fontSize: 9, margin: [0, 0, 0, 2] },
        { text: `Diploma Tescil Tarih ve No: ${v(form.diplomaTescilNo)}`, fontSize: 9, margin: [0, 0, 0, 2] },
        { text: `İşyeri Hekimliği Belgesi Tarih ve No: ${v(form.isyeriHekimBelgeNo)}`, fontSize: 9 },
      ],
    },
  ];

  const docDef: any = {
    pageSize: "A4",
    pageMargins: [40, 30, 40, 30],
    content,
    defaultStyle: { font: "Roboto" },
  };

  const fileName = `EK2_${(form.employeeName || "form").replace(/\s/g, "_")}_${form.formTarihi || "tarihsiz"}.pdf`;
  maker.createPdf(docDef).download(fileName);
}
