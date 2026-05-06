/**
 * ek2PdfGenerator.ts — EK-2 İşe Giriş / Periyodik Muayene Formu PDF Oluşturucu
 *
 * Resmi formun birebir aynısını pdfmake ile oluşturur.
 * 2 sayfa: Sayfa 1 = İşyeri + Çalışan + Özgeçmiş + Soygeçmiş + Tıbbi Anamnez
 *          Sayfa 2 = Fizik Muayene + Laboratuvar + Kanaat/Sonuç + İmza
 */

export async function generateEk2PDF(form: any) {
  const pdfMake = (await import("pdfmake/build/pdfmake")) as any;
  const pdfFonts = (await import("pdfmake/build/vfs_fonts")) as any;
  const maker = pdfMake.default || pdfMake;
  maker.vfs = (pdfFonts.default || pdfFonts).vfs;

  const v = (val: any) => val || "";
  const check = (condition: boolean) => condition ? "X" : "";
  const ynEvet = (obj: any) => obj?.evet === true;
  const ynHayir = (obj: any) => !obj?.evet;

  // Ortak tablo çizgi stili — ince siyah çizgiler
  const thinLines = {
    hLineWidth: () => 0.5,
    vLineWidth: () => 0.5,
    hLineColor: () => "#000",
    vLineColor: () => "#000",
  };

  const noLines = {
    hLineWidth: () => 0,
    vLineWidth: () => 0,
  };

  // Önceki işler satırları (en az 3 satır)
  const oncekiIsler = form.oncekiIsler && form.oncekiIsler.length > 0
    ? form.oncekiIsler
    : [{ iskolu: "", yaptigiIs: "", girisCikisTarihi: "" }, { iskolu: "", yaptigiIs: "", girisCikisTarihi: "" }, { iskolu: "", yaptigiIs: "", girisCikisTarihi: "" }];
  while (oncekiIsler.length < 3) oncekiIsler.push({ iskolu: "", yaptigiIs: "", girisCikisTarihi: "" });

  // Yakınmalar listesi
  const yakinmaList = [
    "Balgamlı öksürük", "Nefes darlığı", "Göğüs ağrısı", "Çarpıntı",
    "Sırt ağrısı", "İshal veya kabızlık", "Eklemlerde ağrı",
  ];

  // Hastalıklar listesi
  const hastalikList = [
    "Kalp hastalığı", "Şeker hastalığı", "Böbrek rahatsızlığı", "Sarılık",
    "Mide veya on iki parmak ülseri", "İşitme kaybı", "Görme bozukluğu",
    "Sinir sistemi hastalığı", "Deri hastalığı", "Besin zehirlenmesi",
  ];

  // Sigara metni
  let sigaraText = "Hayır";
  if (form.sigara?.durum === "evet") {
    sigaraText = `Evet ${v(form.sigara.yil)} yıldır ${v(form.sigara.adetGun)} adet/gün`;
  } else if (form.sigara?.durum === "birakmis") {
    sigaraText = `Bırakmış ${v(form.sigara.yil)} ay/yıl önce`;
  }

  // Alkol metni
  let alkolText = "Hayır";
  if (form.alkol?.durum === "evet") {
    alkolText = `Evet ${v(form.alkol.yil)} yıldır ${v(form.alkol.siklik)} sıklıkla`;
  } else if (form.alkol?.durum === "birakmis") {
    alkolText = `Bırakmış ${v(form.alkol.yil)} yıl önce`;
  }

  // ════════════════════════════════════════════════════════════════════════════
  // SAYFA 1
  // ════════════════════════════════════════════════════════════════════════════

  const content: any[] = [
    // ── BAŞLIK ──
    {
      columns: [
        { text: "İŞE GİRİŞ / PERİYODİK MUAYENE FORMU", fontSize: 12, bold: true, alignment: "center", width: "*" },
        { text: "Ek-2", fontSize: 10, bold: true, alignment: "right", width: 40 },
      ],
      margin: [0, 0, 0, 8],
    },

    // ── İŞYERİNİN / İŞVERENİN ──
    {
      table: {
        widths: [110, "*"],
        body: [
          [{ text: "İŞYERİNİN/İŞVERENİN", bold: true, fontSize: 9, colSpan: 2, border: [true, true, true, true] }, {}],
          [{ text: "Unvanı", fontSize: 8 }, { text: v(form.companyName), fontSize: 8 }],
          [{ text: "SGK Sicil No.", fontSize: 8 }, { text: v(form.sgkSicilNo), fontSize: 8 }],
          [{ text: "Adresi", fontSize: 8 }, { text: v(form.companyAddress), fontSize: 8 }],
          [{ text: "Tel ve faks", fontSize: 8 }, { text: v(form.companyTel), fontSize: 8 }],
          [{ text: "E-Posta", fontSize: 8 }, { text: v(form.companyEmail), fontSize: 8 }],
        ],
      },
      layout: thinLines,
      margin: [0, 0, 0, 4],
    },

    // ── BEYAN + İMZA ──
    {
      text: " İşe giriş/periyodik muayene olmayı kabul ettiğimi ve muayene sırasında verdiğim bilgilerin doğru ve eksiksiz olduğunu beyan ederim.",
      fontSize: 7.5,
      italics: true,
      margin: [0, 2, 0, 2],
    },
    {
      columns: [
        { text: `Çalışanın Adı Soyadı: ${v(form.employeeName)}`, fontSize: 8 },
        { text: "İMZA", fontSize: 8, bold: true, alignment: "right" },
      ],
      margin: [0, 0, 0, 2],
    },
    {
      canvas: [{ type: "line", x1: 0, y1: 0, x2: 515, y2: 0, lineWidth: 0.8, dash: { length: 4, space: 2 } }],
      margin: [0, 2, 0, 4],
    },

    // ── ÇALIŞANIN / İŞE GİRENİN ──
    {
      table: {
        widths: [110, "*", 70, 80],
        body: [
          [{ text: "ÇALIŞANIN/İŞE GİRENİN", bold: true, fontSize: 9, colSpan: 3 }, {}, {}, { text: "Fotoğraf", fontSize: 8, alignment: "center", rowSpan: 6, margin: [0, 10, 0, 0] }],
          [{ text: "Adı ve soyadı", fontSize: 8 }, { text: v(form.employeeName), fontSize: 8, colSpan: 2 }, {}, {}],
          [{ text: "T.C.Kimlik No", fontSize: 8 }, { text: v(form.tcKimlikNo), fontSize: 8, colSpan: 2 }, {}, {}],
          [{ text: "Doğum Yeri ve Tarihi", fontSize: 8 }, { text: v(form.dogumYeriTarihi), fontSize: 8, colSpan: 2 }, {}, {}],
          [{ text: "Cinsiyeti", fontSize: 8 }, { text: v(form.cinsiyet), fontSize: 8, colSpan: 2 }, {}, {}],
          [{ text: "Eğitim durumu", fontSize: 8 }, { text: v(form.egitimDurumu), fontSize: 8, colSpan: 2 }, {}, {}],
          [{ text: "Medeni durumu", fontSize: 8 }, { text: v(form.medeniDurum), fontSize: 8 }, { text: "Çocuk sayısı", fontSize: 8 }, { text: v(form.cocukSayisi), fontSize: 8 }],
          [{ text: "Ev Adresi", fontSize: 8 }, { text: v(form.evAdresi), fontSize: 8, colSpan: 3 }, {}, {}],
          [{ text: "Tel No.", fontSize: 8 }, { text: v(form.telNo), fontSize: 8, colSpan: 3 }, {}, {}],
          [{ text: "Mesleği/Meslek Dalı", fontSize: 8 }, { text: v(form.meslegi), fontSize: 8, colSpan: 3 }, {}, {}],
          [{ text: "Yaptığı iş\n(Ayrıntılı olarak tanımlanacaktır.)", fontSize: 8 }, { text: v(form.yaptigiIs), fontSize: 8, colSpan: 3 }, {}, {}],
          [{ text: "Çalıştığı bölüm", fontSize: 8 }, { text: v(form.calistigiBolum), fontSize: 8, colSpan: 3 }, {}, {}],
        ],
      },
      layout: thinLines,
      margin: [0, 0, 0, 4],
    },

    // ── DAHA ÖNCE ÇALIŞTIĞI YERLER ──
    {
      table: {
        widths: [180, "*", "*", 100],
        body: [
          [
            { text: "Daha önce çalıştığı yerler\n(Bu günden geçmişe doğru)", fontSize: 8, bold: true },
            { text: "İşkolu", fontSize: 8, bold: true, alignment: "center" },
            { text: "Yaptığı iş", fontSize: 8, bold: true, alignment: "center" },
            { text: "Giriş-çıkış tarihi", fontSize: 8, bold: true, alignment: "center" },
          ],
          ...oncekiIsler.map((item: any, i: number) => [
            { text: `${i + 1}.`, fontSize: 8 },
            { text: v(item.iskolu), fontSize: 8 },
            { text: v(item.yaptigiIs), fontSize: 8 },
            { text: v(item.girisCikisTarihi), fontSize: 8 },
          ]),
        ],
      },
      layout: thinLines,
      margin: [0, 0, 0, 4],
    },

    // ── ÖZGEÇMİŞİ ──
    {
      table: {
        widths: [110, "*"],
        body: [
          [{ text: "Özgeçmişi", bold: true, fontSize: 9, colSpan: 2 }, {}],
          [{ text: "Kan grubu", fontSize: 8 }, { text: v(form.kanGrubu), fontSize: 8 }],
          [{ text: "Konjenital/kronik hastalık", fontSize: 8 }, { text: v(form.konjenitalKronikHastalik), fontSize: 8 }],
          [{ text: "Bağışıklama", fontSize: 8, bold: true }, { text: "", fontSize: 8 }],
          [{ text: " - Tetanoz", fontSize: 8 }, { text: v(form.bagisiklamaTetanoz), fontSize: 8 }],
          [{ text: " - Hepatit", fontSize: 8 }, { text: v(form.bagisiklamaHepatit), fontSize: 8 }],
          [{ text: " - Diğer", fontSize: 8 }, { text: v(form.bagisiklamaDiger), fontSize: 8 }],
        ],
      },
      layout: thinLines,
      margin: [0, 0, 0, 4],
    },

    // ── SOYGEÇMİŞİ ──
    {
      table: {
        widths: ["*", "*", "*", "*"],
        body: [
          [{ text: "Soygeçmişi", bold: true, fontSize: 9, colSpan: 4 }, {}, {}, {}],
          [
            { text: "Anne", fontSize: 8, bold: true, alignment: "center" },
            { text: "Baba", fontSize: 8, bold: true, alignment: "center" },
            { text: "Kardeş", fontSize: 8, bold: true, alignment: "center" },
            { text: "Çocuk", fontSize: 8, bold: true, alignment: "center" },
          ],
          [
            { text: v(form.soygecmisAnne), fontSize: 8 },
            { text: v(form.soygecmisBaba), fontSize: 8 },
            { text: v(form.soygecmisKardes), fontSize: 8 },
            { text: v(form.soygecmisCocuk), fontSize: 8 },
          ],
        ],
      },
      layout: thinLines,
      margin: [0, 0, 0, 4],
    },

    // ── TIBBİ ANAMNEZ ──
    { text: "TIBBİ ANAMNEZ", bold: true, fontSize: 9, margin: [0, 4, 0, 4] },

    // Soru 1: Yakınmalar
    {
      table: {
        widths: ["*", 35, 35],
        body: [
          [
            { text: "1. Aşağıdaki yakınmalardan herhangi birini yaşadınız mı?", fontSize: 8, bold: true },
            { text: "Hayır", fontSize: 7, bold: true, alignment: "center" },
            { text: "Evet", fontSize: 7, bold: true, alignment: "center" },
          ],
          ...yakinmaList.map(y => [
            { text: `- ${y}`, fontSize: 8 },
            { text: check(ynHayir(form.yakınmalar?.[y])), fontSize: 8, alignment: "center" },
            { text: check(ynEvet(form.yakınmalar?.[y])), fontSize: 8, alignment: "center" },
          ]),
        ],
      },
      layout: thinLines,
      margin: [0, 0, 0, 4],
    },

    // Soru 2: Hastalıklar
    {
      table: {
        widths: ["*", 35, 35],
        body: [
          [
            { text: "2. Aşağıdaki hastalıklardan herhangi birini geçirdiniz mi?", fontSize: 8, bold: true },
            { text: "Hayır", fontSize: 7, bold: true, alignment: "center" },
            { text: "Evet", fontSize: 7, bold: true, alignment: "center" },
          ],
          ...hastalikList.map(h => [
            { text: `- ${h}`, fontSize: 8 },
            { text: check(ynHayir(form.hastaliklar?.[h])), fontSize: 8, alignment: "center" },
            { text: check(ynEvet(form.hastaliklar?.[h])), fontSize: 8, alignment: "center" },
          ]),
        ],
      },
      layout: thinLines,
      margin: [0, 0, 0, 4],
    },

    // Sorular 3-8
    {
      table: {
        widths: ["*", 30, 30, "*"],
        body: [
          [
            { text: "", fontSize: 7 },
            { text: "Hayır", fontSize: 7, bold: true, alignment: "center" },
            { text: "Evet", fontSize: 7, bold: true, alignment: "center" },
            { text: "", fontSize: 7 },
          ],
          [
            { text: "3. Hastanede yattınız mı?", fontSize: 8 },
            { text: check(ynHayir(form.hastaneYatis)), fontSize: 8, alignment: "center" },
            { text: check(ynEvet(form.hastaneYatis)), fontSize: 8, alignment: "center" },
            { text: ynEvet(form.hastaneYatis) ? `Tanı: ${v(form.hastaneYatis?.tani)}` : "", fontSize: 8 },
          ],
          [
            { text: "4. Ameliyat geçirdiniz mi?", fontSize: 8 },
            { text: check(ynHayir(form.ameliyat)), fontSize: 8, alignment: "center" },
            { text: check(ynEvet(form.ameliyat)), fontSize: 8, alignment: "center" },
            { text: ynEvet(form.ameliyat) ? `Neden: ${v(form.ameliyat?.neden)}` : "", fontSize: 8 },
          ],
          [
            { text: "5. İş kazası geçirdiniz mi?", fontSize: 8 },
            { text: check(ynHayir(form.isKazasi)), fontSize: 8, alignment: "center" },
            { text: check(ynEvet(form.isKazasi)), fontSize: 8, alignment: "center" },
            { text: ynEvet(form.isKazasi) ? `Ne oldu: ${v(form.isKazasi?.neOldu)}` : "", fontSize: 8 },
          ],
          [
            { text: "6. Meslek Hastalıkları şüphesi ile ilgili\n   tetkik ve muayeneye tabi tutuldunuz mu?", fontSize: 8 },
            { text: check(ynHayir(form.meslekHastaligi)), fontSize: 8, alignment: "center" },
            { text: check(ynEvet(form.meslekHastaligi)), fontSize: 8, alignment: "center" },
            { text: ynEvet(form.meslekHastaligi) ? `Sonuç: ${v(form.meslekHastaligi?.sonuc)}` : "", fontSize: 8 },
          ],
          [
            { text: "7. Maluliyet aldınız mı?", fontSize: 8 },
            { text: check(ynHayir(form.maluliyet)), fontSize: 8, alignment: "center" },
            { text: check(ynEvet(form.maluliyet)), fontSize: 8, alignment: "center" },
            { text: ynEvet(form.maluliyet) ? `${v(form.maluliyet?.nedir)} Oran: ${v(form.maluliyet?.orani)}` : "", fontSize: 8 },
          ],
          [
            { text: "8. Şu anda herhangi bir tedavi\n   görüyor musunuz?", fontSize: 8 },
            { text: check(ynHayir(form.tedavi)), fontSize: 8, alignment: "center" },
            { text: check(ynEvet(form.tedavi)), fontSize: 8, alignment: "center" },
            { text: ynEvet(form.tedavi) ? `Nedir: ${v(form.tedavi?.nedir)}` : "", fontSize: 8 },
          ],
        ],
      },
      layout: thinLines,
      margin: [0, 0, 0, 4],
    },

    // Sigara ve Alkol
    {
      table: {
        widths: ["*"],
        body: [
          [{ text: `9. Sigara içiyor musunuz?   ${sigaraText}`, fontSize: 8 }],
          [{ text: `10. Alkol alıyor musunuz?   ${alkolText}`, fontSize: 8 }],
        ],
      },
      layout: thinLines,
      margin: [0, 0, 0, 0],
    },

    // ════════════════════════════════════════════════════════════════════════════
    // SAYFA 2
    // ════════════════════════════════════════════════════════════════════════════
    { text: "", pageBreak: "before" },

    // ── FİZİK MUAYENE SONUÇLARI ──
    {
      table: {
        widths: [200, "*"],
        body: [
          [{ text: "FİZİK MUAYENE SONUÇLARI", bold: true, fontSize: 9, colSpan: 2 }, {}],
          [{ text: "a) Duyu organları", fontSize: 8, bold: true, colSpan: 2 }, {}],
          [{ text: "  - Göz", fontSize: 8 }, { text: v(form.goz), fontSize: 8 }],
          [{ text: "  - Kulak-Burun-Boğaz", fontSize: 8 }, { text: v(form.kulakBurunBogaz), fontSize: 8 }],
          [{ text: "  - Deri", fontSize: 8 }, { text: v(form.deri), fontSize: 8 }],
          [{ text: "b) Kardiyovasküler sistem muayenesi", fontSize: 8 }, { text: v(form.kardiyovaskuler), fontSize: 8 }],
          [{ text: "c) Solunum sistemi muayenesi", fontSize: 8 }, { text: v(form.solunum), fontSize: 8 }],
          [{ text: "d) Sindirim sistemi muayenesi", fontSize: 8 }, { text: v(form.sindirim), fontSize: 8 }],
          [{ text: "e) Ürogenital sistem muayenesi", fontSize: 8 }, { text: v(form.urogenital), fontSize: 8 }],
          [{ text: "f) Kas-iskelet sistemi muayenesi", fontSize: 8 }, { text: v(form.kasIskelet), fontSize: 8 }],
          [{ text: "g) Nörolojik muayene", fontSize: 8 }, { text: v(form.norolojik), fontSize: 8 }],
          [{ text: "Ğ) Psikiyatrik muayene", fontSize: 8 }, { text: v(form.psikiyatrik), fontSize: 8 }],
          [{ text: "h) Diğer", fontSize: 8 }, { text: v(form.fizikDiger), fontSize: 8 }],
        ],
      },
      layout: thinLines,
      margin: [0, 0, 0, 4],
    },

    // TA, Nb, Boy, Kilo, VKİ
    {
      table: {
        widths: ["*", "*", "*"],
        body: [
          [
            { text: `-TA : ${v(form.ta)} mm-Hg`, fontSize: 8 },
            { text: `-Nb : ${v(form.nb)} /dk.`, fontSize: 8 },
            { text: "", fontSize: 8 },
          ],
          [
            { text: `-Boy: ${v(form.boy)}`, fontSize: 8 },
            { text: `Kilo: ${v(form.kilo)}`, fontSize: 8 },
            { text: `Vücut Kitle İndeksi: ${v(form.vki)}`, fontSize: 8 },
          ],
        ],
      },
      layout: thinLines,
      margin: [0, 0, 0, 6],
    },

    // ── LABORATUVAR BULGULARI ──
    {
      table: {
        widths: [200, "*"],
        body: [
          [{ text: "LABORATUVAR BULGULARI", bold: true, fontSize: 9, colSpan: 2 }, {}],
          [{ text: "a) Biyolojik analizler", fontSize: 8, bold: true, colSpan: 2 }, {}],
          [{ text: "  - Kan", fontSize: 8 }, { text: v(form.kan), fontSize: 8 }],
          [{ text: "  - İdrar", fontSize: 8 }, { text: v(form.idrar), fontSize: 8 }],
          [{ text: "b) Radyolojik analizler", fontSize: 8 }, { text: v(form.radyolojik), fontSize: 8 }],
          [{ text: "c) Fizyolojik analizler", fontSize: 8, bold: true, colSpan: 2 }, {}],
          [{ text: "  - Odyometre", fontSize: 8 }, { text: v(form.odyometre), fontSize: 8 }],
          [{ text: "  - SFT", fontSize: 8 }, { text: v(form.sft), fontSize: 8 }],
          [{ text: "d) Psikolojik testler", fontSize: 8 }, { text: v(form.psikolojik), fontSize: 8 }],
          [{ text: "e) Diğer", fontSize: 8 }, { text: v(form.labDiger), fontSize: 8 }],
        ],
      },
      layout: thinLines,
      margin: [0, 0, 0, 8],
    },

    // ── KANAAT VE SONUÇ ──
    {
      table: {
        widths: ["*"],
        body: [
          [{ text: "KANAAT VE SONUÇ * :", bold: true, fontSize: 9 }],
          [{
            text: [
              { text: "1- ", fontSize: 8 },
              { text: v(form.kanaatSonuc) || "…………………………………………………………………………………………………………..……………………….…", fontSize: 8 },
              { text: " işinde bedenen ve ruhen çalışmaya elverişlidir.", fontSize: 8 },
            ],
            margin: [0, 4, 0, 4],
          }],
          [{
            text: [
              { text: "2- ", fontSize: 8 },
              { text: v(form.kanaatSart) || "……………………………………………………………………………………………..……………………", fontSize: 8 },
              { text: " şartı ile çalışmaya elverişlidir", fontSize: 8 },
            ],
            margin: [0, 4, 0, 4],
          }],
        ],
      },
      layout: thinLines,
      margin: [0, 0, 0, 2],
    },

    // Kanaat açıklama notu
    {
      text: "(*Yapılan muayene sonucunda çalışanın gece veya vardiyalı çalışma koşullarında çalışıp çalışamayacağı ile vücut sağlığını ve bütünlüğünü tamamlayıcı uygun alet teçhizat vs... bulunması durumunda çalışan için bu koşullarla çalışmaya elverişli olup olmadığı kanaati belirtilecektir.)",
      fontSize: 6.5,
      italics: true,
      color: "#333",
      margin: [0, 2, 0, 20],
    },

    // ── İMZA BÖLÜMÜ (sağ alt) ──
    {
      columns: [
        { text: "", width: "*" },
        {
          width: 250,
          stack: [
            { text: `……...... /............. / 20.............`, fontSize: 8, margin: [0, 0, 0, 10] },
            { text: "İMZA", fontSize: 9, bold: true, margin: [0, 0, 0, 24] },
            { text: `Adı ve Soyadı: ${v(form.doktorAdi)}`, fontSize: 8, margin: [0, 0, 0, 4] },
            { text: `Diploma Tarih ve No: ${v(form.diplomaTarihNo)}`, fontSize: 8, margin: [0, 0, 0, 4] },
            { text: `Diploma Tescil Tarih ve No: ${v(form.diplomaTescilNo)}`, fontSize: 8, margin: [0, 0, 0, 4] },
            { text: `İşyeri Hekimliği Belgesi Tarih ve No: ${v(form.isyeriHekimBelgeNo)}`, fontSize: 8 },
          ],
        },
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
