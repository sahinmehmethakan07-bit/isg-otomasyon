export type WorkInstructionCategoryId =
  | "all"
  | "is-makineleri"
  | "el-aletleri"
  | "kimyasal"
  | "elektrik"
  | "yuksekte-calisma"
  | "kapali-alan"
  | "kaynak-kesme"
  | "tasima-depolama"
  | "mutfak"
  | "ofis"
  | "genel-isg";

export type WorkInstructionCategory = {
  id: WorkInstructionCategoryId;
  label: string;
  icon: string;
};

export type WorkInstructionTemplate = {
  id: string;
  title: string;
  category: Exclude<WorkInstructionCategoryId, "all">;
  summary: string;
  legalBasis: string;
  risks: string[];
  ppe: string[];
  steps: string[];
  emergency: string[];
  tags: string[];
};

export const workInstructionCategories: WorkInstructionCategory[] = [
  { id: "all", label: "Tümü", icon: "📚" },
  { id: "is-makineleri", label: "İş Makineleri", icon: "⚙️" },
  { id: "el-aletleri", label: "El Aletleri", icon: "🔧" },
  { id: "kimyasal", label: "Kimyasal Madde", icon: "⚗️" },
  { id: "elektrik", label: "Elektrik İşleri", icon: "⚡" },
  { id: "yuksekte-calisma", label: "Yüksekte Çalışma", icon: "🏗️" },
  { id: "kapali-alan", label: "Kapalı Alan", icon: "🚪" },
  { id: "kaynak-kesme", label: "Kaynak ve Kesme", icon: "🔥" },
  { id: "tasima-depolama", label: "Taşıma & Depolama", icon: "📦" },
  { id: "mutfak", label: "Mutfak & Yemekhane", icon: "🍳" },
  { id: "ofis", label: "Ofis & Büro", icon: "🖥️" },
  { id: "genel-isg", label: "Genel İSG", icon: "🛡️" },
];

export const workInstructionTemplates: WorkInstructionTemplate[] = [
  {
    id: "forklift",
    title: "Forklift Kullanma Talimatı",
    category: "is-makineleri",
    summary: "Forklift operatörlerinin güvenli yükleme, taşıma ve park kurallarını standartlaştırır.",
    legalBasis: "6331 sayılı İş Sağlığı ve Güvenliği Kanunu ve İş Ekipmanlarının Kullanımında Sağlık ve Güvenlik Şartları Yönetmeliği.",
    risks: ["Devrilme", "Yaya çarpması", "Yük düşmesi", "Görüş alanı kısıtlılığı"],
    ppe: ["Baret", "Çelik burunlu iş ayakkabısı", "Reflektörlü yelek"],
    steps: [
      "Yetkisiz ve eğitimsiz personel forklift kullanmamalıdır.",
      "Çalışma öncesi fren, korna, ışık, lastik ve kaldırma sistemi kontrol edilmelidir.",
      "Yük kapasitesi aşılmamalı, yük çatallara dengeli yerleştirilmelidir.",
      "Yaya yollarında hız düşürülmeli ve kör noktalarda korna kullanılmalıdır.",
    ],
    emergency: ["Devrilme halinde araçtan atlanmamalı, direksiyon sıkıca tutulmalıdır.", "Kaza ve hasarlar amire hemen bildirilmelidir."],
    tags: ["forklift", "yük taşıma", "operatör", "depo"],
  },
  {
    id: "torna",
    title: "Torna Tezgahı Kullanma Talimatı",
    category: "is-makineleri",
    summary: "Torna tezgahında talaşlı imalat sırasında uyulacak güvenli çalışma kurallarını içerir.",
    legalBasis: "İş Ekipmanlarının Kullanımında Sağlık ve Güvenlik Şartları Yönetmeliği.",
    risks: ["Parça fırlaması", "Sıkışma", "Talaş sıçraması", "Kesilme"],
    ppe: ["Koruyucu gözlük", "Çelik burunlu iş ayakkabısı", "Vücuda oturan iş elbisesi"],
    steps: [
      "Bol kıyafet, takı ve açık saç ile çalışma yapılmamalıdır.",
      "Koruyucular sökülmemeli, ayna anahtarı tezgah üzerinde bırakılmamalıdır.",
      "Ölçüm ve talaş temizliği tezgah tamamen durduktan sonra yapılmalıdır.",
      "Uygun kesici takım ve uygun devir seçilmelidir.",
    ],
    emergency: ["Anormal ses, titreşim veya parça gevşemesi görüldüğünde makine durdurulmalıdır."],
    tags: ["torna", "talaşlı imalat", "makine", "metal"],
  },
  {
    id: "hidrolik-pres",
    title: "Hidrolik Pres Makinesi Talimatı",
    category: "is-makineleri",
    summary: "Hidrolik preslerde kalıp, baskı ve sıkışma risklerine karşı güvenli çalışma adımlarını tanımlar.",
    legalBasis: "Makine Emniyeti Yönetmeliği ve 6331 sayılı Kanun.",
    risks: ["Ezilme", "Sıkışma", "Hidrolik kaçak", "Kalıp fırlaması"],
    ppe: ["Koruyucu gözlük", "Çelik burunlu iş ayakkabısı", "Anti-vibrasyon eldiveni"],
    steps: [
      "Çift el kumanda ve acil stop sistemi çalışır durumda olmalıdır.",
      "Kalıp bağlama işlemi yetkili kişi tarafından yapılmalıdır.",
      "Çalışma alanına el sokulmamalı, uygun aparat kullanılmalıdır.",
      "Basınç ayarları iş talimatına uygun seçilmelidir.",
    ],
    emergency: ["Sıkışma veya kaçak durumunda acil stopa basılmalı ve bakım ekibi çağrılmalıdır."],
    tags: ["pres", "hidrolik", "kalıp", "ezilme"],
  },
  {
    id: "spiral",
    title: "Spiral Taşlama Makinesi Talimatı",
    category: "el-aletleri",
    summary: "Spiral taşlama makinesinin güvenli kullanım, disk seçimi ve bakım kurallarını açıklar.",
    legalBasis: "İş Ekipmanlarının Kullanımında Sağlık ve Güvenlik Şartları Yönetmeliği.",
    risks: ["Disk patlaması", "Kıvılcım", "Kesilme", "Gürültü"],
    ppe: ["Yüz siperi", "Koruyucu gözlük", "Kulaklık", "Anti-vibrasyon eldiveni"],
    steps: [
      "Disk koruyucusu olmadan makine kullanılmamalıdır.",
      "Uygun devir ve uygun disk seçilmelidir.",
      "Kıvılcım yönünde yanıcı malzeme bulundurulmamalıdır.",
      "Makine iki elle tutulmalı ve iş parçası sabitlenmelidir.",
    ],
    emergency: ["Disk kırılması veya aşırı titreşimde makine hemen durdurulmalıdır."],
    tags: ["spiral", "taşlama", "kesme", "el aleti"],
  },
  {
    id: "sutunlu-matkap",
    title: "Sütunlu Matkap Kullanma Talimatı",
    category: "el-aletleri",
    summary: "Delme işlemlerinde parça sabitleme, talaş temizliği ve koruyucu kullanımını standartlaştırır.",
    legalBasis: "6331 sayılı Kanun ve ilgili iş ekipmanı hükümleri.",
    risks: ["Parça dönmesi", "Talaş sıçraması", "Sıkışma", "Kesilme"],
    ppe: ["Koruyucu gözlük", "Çelik burunlu iş ayakkabısı", "Vücuda oturan iş elbisesi"],
    steps: [
      "İş parçası mengene veya uygun aparatla sabitlenmelidir.",
      "Matkap ucu işe uygun seçilmeli ve sağlam takılmalıdır.",
      "Talaş elle temizlenmemeli, fırça kullanılmalıdır.",
      "Makine durmadan ölçüm veya ayar yapılmamalıdır.",
    ],
    emergency: ["Parça sıkışırsa makine kapatılmalı, enerji kesildikten sonra müdahale edilmelidir."],
    tags: ["matkap", "delme", "tezgah", "talaş"],
  },
  {
    id: "kimyasal-depolama",
    title: "Kimyasal Madde Depolama ve Kullanma Talimatı",
    category: "kimyasal",
    summary: "Tehlikeli kimyasalların etiketleme, depolama ve dökülme müdahalesi kurallarını içerir.",
    legalBasis: "Kimyasal Maddelerle Çalışmalarda Sağlık ve Güvenlik Önlemleri Yönetmeliği.",
    risks: ["Yanma", "Zehirlenme", "Dökülme", "Uygunsuz karışım"],
    ppe: ["Kimyasala dayanıklı eldiven", "Kimyasal göz koruması", "Yarım yüz maske ve uygun filtre"],
    steps: [
      "Güvenlik bilgi formu okunmadan kimyasal kullanılmamalıdır.",
      "Kimyasallar orijinal ve etiketli kaplarda saklanmalıdır.",
      "Asit, baz, oksitleyici ve yanıcı maddeler ayrı bölümlerde depolanmalıdır.",
      "Dökülme kiti erişilebilir olmalı ve havalandırma çalışır durumda tutulmalıdır.",
    ],
    emergency: ["Dökülmede alan izole edilmeli, uygun dökülme prosedürü uygulanmalıdır.", "Maruziyet halinde göz/vücut duşu kullanılmalı ve sağlık birimine başvurulmalıdır."],
    tags: ["kimyasal", "msds", "gbf", "depolama"],
  },
  {
    id: "elektrik-panosu",
    title: "Elektrik Panosu Çalışma Talimatı",
    category: "elektrik",
    summary: "Elektrik panolarında yetkilendirme, enerji kesme ve kilitleme kurallarını tanımlar.",
    legalBasis: "Elektrik İç Tesisleri Yönetmeliği ve 6331 sayılı Kanun.",
    risks: ["Elektrik çarpması", "Ark patlaması", "Yangın", "Yanık"],
    ppe: ["İzole eldiven", "Yüz siperi", "Yalıtkan ayakkabı"],
    steps: [
      "Elektrik panolarında yalnızca yetkili personel çalışmalıdır.",
      "Enerji kesilmeli, kilitleme ve etiketleme uygulanmalıdır.",
      "Gerilim yokluğu uygun ölçü aleti ile doğrulanmalıdır.",
      "Pano kapakları açık bırakılmamalı, yanıcı malzeme uzak tutulmalıdır.",
    ],
    emergency: ["Elektrik çarpmasında enerji kesilmeden kişiye temas edilmemelidir.", "Yangında uygun tip söndürücü kullanılmalıdır."],
    tags: ["elektrik", "pano", "loto", "kilitleme"],
  },
  {
    id: "yuksekte-calisma",
    title: "Yüksekte Çalışma Talimatı",
    category: "yuksekte-calisma",
    summary: "İskele, merdiven, platform ve çatı çalışmalarında düşme riskini kontrol altına alır.",
    legalBasis: "Yapı İşlerinde İş Sağlığı ve Güvenliği Yönetmeliği.",
    risks: ["Düşme", "Malzeme düşmesi", "Dengesiz zemin", "Uygunsuz ankraj"],
    ppe: ["Tam vücut emniyet kemeri", "Baret", "Çift kollu lanyard", "Kaymaz iş ayakkabısı"],
    steps: [
      "Yüksekte çalışma izni ve risk değerlendirmesi yapılmadan çalışmaya başlanmamalıdır.",
      "Ankraj noktası kontrol edilmeli, yaşam hattı kullanılmalıdır.",
      "Alt alan şeritlenmeli ve malzeme düşmesine karşı önlem alınmalıdır.",
      "Rüzgar, yağış ve yetersiz aydınlatma koşullarında çalışma durdurulmalıdır.",
    ],
    emergency: ["Düşme sonrası askıda kalma kurtarma planı uygulanmalı ve sağlık ekibi çağrılmalıdır."],
    tags: ["yüksekte çalışma", "emniyet kemeri", "iskele", "çatı"],
  },
  {
    id: "kapali-alan",
    title: "Kapalı Alanda Çalışma Talimatı",
    category: "kapali-alan",
    summary: "Kapalı alan girişlerinde atmosfer ölçümü, gözcü ve kurtarma hazırlıklarını düzenler.",
    legalBasis: "6331 sayılı Kanun ve kapalı alan güvenli çalışma prensipleri.",
    risks: ["Oksijen yetersizliği", "Zehirli gaz", "Patlama", "Kurtarma zorluğu"],
    ppe: ["Gaz ölçüm cihazı", "Tripod/kurtarma halatı", "Uygun solunum koruması"],
    steps: [
      "Kapalı alan izni olmadan giriş yapılmamalıdır.",
      "Oksijen, yanıcı gaz ve toksik gaz ölçümleri kayıt altına alınmalıdır.",
      "Giriş boyunca dışarıda eğitimli gözcü bulunmalıdır.",
      "Havalandırma ve acil kurtarma ekipmanı hazır tutulmalıdır.",
    ],
    emergency: ["Bilinç kaybı halinde izinsiz kurtarma girişi yapılmamalı, kurtarma planı devreye alınmalıdır."],
    tags: ["kapalı alan", "gaz ölçümü", "gözcü", "izinli çalışma"],
  },
  {
    id: "kaynak-kesme",
    title: "Kaynak ve Kesme İşleri Talimatı",
    category: "kaynak-kesme",
    summary: "Sıcak işlerde yangın, duman, radyasyon ve tüp güvenliği kurallarını içerir.",
    legalBasis: "6331 sayılı Kanun ve yangınla mücadele mevzuatı.",
    risks: ["Yangın", "Göz hasarı", "Duman maruziyeti", "Tüp patlaması"],
    ppe: ["Kaynak maskesi", "Kaynakçı eldiveni", "Alev geciktirici tulum"],
    steps: [
      "Sıcak iş izni alınmadan kaynak ve kesme yapılmamalıdır.",
      "Yanıcı maddeler uzaklaştırılmalı, yangın söndürücü hazır olmalıdır.",
      "Tüpler dik sabitlenmeli ve hortumlar kaçak açısından kontrol edilmelidir.",
      "Kaynak dumanı için lokal havalandırma sağlanmalıdır.",
    ],
    emergency: ["Yangında çalışma durdurulmalı, alan boşaltılmalı ve yangın prosedürü uygulanmalıdır."],
    tags: ["kaynak", "kesme", "sıcak iş", "yangın"],
  },
  {
    id: "depo-raf",
    title: "Depo ve Raf Sistemleri Güvenlik Talimatı",
    category: "tasima-depolama",
    summary: "Depolama, istifleme, raf kapasitesi ve yaya yolları için güvenli çalışma kurallarını belirler.",
    legalBasis: "İşyerlerinde Acil Durumlar ve İş Ekipmanları mevzuatı.",
    risks: ["Yük devrilmesi", "Raf çökmesi", "Takılma", "Forklift-yaya teması"],
    ppe: ["Baret", "Çelik burunlu ayakkabı", "Mekanik eldiven"],
    steps: [
      "Raf kapasite levhaları görünür olmalı ve aşılmamalıdır.",
      "Ağır yükler alt raflara, hafif yükler üst raflara yerleştirilmelidir.",
      "Yaya yolları ve acil çıkışlar kapatılmamalıdır.",
      "Hasarlı raf ve paletler kullanılmamalıdır.",
    ],
    emergency: ["Raf hasarı görüldüğünde alan boşaltılmalı ve yetkiliye bildirilmelidir."],
    tags: ["depo", "raf", "istif", "palet"],
  },
  {
    id: "endustriyel-firin",
    title: "Endüstriyel Fırın ve Ocak Kullanma Talimatı",
    category: "mutfak",
    summary: "Endüstriyel mutfaklarda sıcak yüzey, buhar ve yanık riskleri için kontrol adımlarını içerir.",
    legalBasis: "6331 sayılı Kanun ve iş ekipmanı güvenliği hükümleri.",
    risks: ["Yanık", "Buhar basıncı", "Kayma", "Yangın"],
    ppe: ["Sıcak iş eldiveni", "Kaymaz iş ayakkabısı", "Mutfak önlüğü"],
    steps: [
      "Fırın ve ocak çevresi kuru ve düzenli tutulmalıdır.",
      "Sıcak kaplar uygun eldivenle taşınmalıdır.",
      "Gaz kokusu veya kaçak şüphesinde cihaz kullanılmamalıdır.",
      "Davlumbaz ve havalandırma sistemi çalışır durumda olmalıdır.",
    ],
    emergency: ["Yanık halinde ilk yardım uygulanmalı ve olay sorumluya bildirilmelidir."],
    tags: ["mutfak", "fırın", "ocak", "yanık"],
  },
  {
    id: "yazici-fotokopi",
    title: "Yazıcı ve Fotokopi Makinesi Güvenlik Talimatı",
    category: "ofis",
    summary: "Ofis ekipmanlarında toner, elektrik, sıkışma ve havalandırma risklerini azaltır.",
    legalBasis: "6331 sayılı Kanun kapsamında ofis çalışma ortamı güvenliği.",
    risks: ["Toner maruziyeti", "Elektrik çarpması", "Sıkışma", "Ergonomi"],
    ppe: ["Toner değişiminde nitril eldiven", "FFP2 maske", "Koruyucu gözlük"],
    steps: [
      "Cihaz havalandırması kapatılmamalı ve kablolar ezilmemelidir.",
      "Toner değişimi üretici talimatına göre yapılmalıdır.",
      "Kağıt sıkışması giderilirken cihaz kapatılmalıdır.",
      "Arızalı cihaz yetkili servis dışında açılmamalıdır.",
    ],
    emergency: ["Toner dökülmesinde kuru yöntemle temizlik yapılmalı, toz solunmamalıdır."],
    tags: ["ofis", "yazıcı", "fotokopi", "toner"],
  },
  {
    id: "temizlik-hijyen",
    title: "İşyeri Temizlik ve Hijyen Talimatı",
    category: "genel-isg",
    summary: "İşyeri genel temizliği, hijyen ve dezenfeksiyon uygulamalarını düzenler.",
    legalBasis: "İşyeri Bina ve Eklentilerinde Alınacak Sağlık ve Güvenlik Önlemleri Yönetmeliği.",
    risks: ["Kayma", "Biyolojik risk", "Kimyasal maruziyet", "Atık birikimi"],
    ppe: ["Kimyasal eldiven", "Kaymaz iş ayakkabısı", "Koruyucu gözlük"],
    steps: [
      "Temizlik planı alan, sıklık ve sorumlu kişi bazında belirlenmelidir.",
      "Islak zeminlerde uyarı levhası kullanılmalıdır.",
      "Temizlik kimyasalları karıştırılmamalı ve etiketli tutulmalıdır.",
      "Atıklar uygun şekilde ayrıştırılıp uzaklaştırılmalıdır.",
    ],
    emergency: ["Kimyasal sıçramada ilgili güvenlik bilgi formuna göre müdahale edilmelidir."],
    tags: ["hijyen", "temizlik", "dezenfeksiyon", "atık"],
  },
];

export function filterWorkInstructionTemplates(
  categoryId: WorkInstructionCategoryId,
  query: string,
) {
  const normalizedQuery = query.trim().toLocaleLowerCase("tr-TR");

  return workInstructionTemplates.filter((template) => {
    const matchesCategory = categoryId === "all" || template.category === categoryId;
    const searchable = [
      template.title,
      template.summary,
      template.legalBasis,
      ...template.risks,
      ...template.ppe,
      ...template.tags,
    ]
      .join(" ")
      .toLocaleLowerCase("tr-TR");

    return matchesCategory && (!normalizedQuery || searchable.includes(normalizedQuery));
  });
}
