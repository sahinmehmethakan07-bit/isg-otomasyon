export type CheckItem = {
  id: string;
  label: string;
  visionCue: string;
  regulation: string;
  requiredAction: string;
};

export const CHECKLIST: CheckItem[] = [
  {
    id: "elektrik_panosu_yalitkan_paspas_yok",
    label: "Elektrik panosu önünde yalıtkan paspas yok",
    visionCue: "Elektrik panosu veya pano odasi onunde yalitkan izole paspas bulunmamasi",
    regulation: "Elektrik İç Tesisleri Yönetmeliği ve Elektrik Tesislerinde Topraklamalar Yönetmeliği ile İşyeri Bina ve Eklentilerinde Alınacak Sağlık ve Güvenlik Önlemlerine İlişkin Yönetmelik kapsamında",
    requiredAction: "Elektrik panosu önüne uygun ebatta yalıtkan paspas serilmeli ve alan kuru tutulmalıdır.",
  },
  {
    id: "elektrik_panosu_co2_tup_yok",
    label: "Elektrik panosu yanında uygun CO2 yangın söndürücü yok",
    visionCue: "Elektrik panosu, trafo veya elektrik odasi yakininda CO2 tip yangin sondurucu bulunmamasi",
    regulation: "Binaların Yangından Korunması Hakkında Yönetmelik ve ilgili acil durum mevzuatı kapsamında",
    requiredAction: "Elektrik pano/trafo alanında uygun tipte CO2 yangın söndürme cihazı bulundurulmalı, erişimi açık tutulmalı ve periyodik kontrolleri yapılmalıdır.",
  },
  {
    id: "elektrik_panosu_kapagi_acik",
    label: "Elektrik panosu kapağı açık veya yetkisiz erişime açık",
    visionCue: "Elektrik panosu kapaginin acik olmasi, pano kapagi kilitsiz veya korumasiz gorunmesi",
    regulation: "Elektrik İç Tesisleri Yönetmeliği ve İşyeri Bina ve Eklentilerinde Alınacak Sağlık ve Güvenlik Önlemlerine İlişkin Yönetmelik kapsamında",
    requiredAction: "Elektrik panosu kapağı kapalı ve kilitli tutulmalı, yetkisiz erişim engellenmeli ve elektrik tehlikesi uyarı levhası asılmalıdır.",
  },
  {
    id: "daginik_acik_elektrik_kablosu",
    label: "Açıkta veya dağınık elektrik kablosu var",
    visionCue: "Yerde daginik, acikta, ekli, bantli, koruyucu kilifsiz veya hasarli elektrik kablolari",
    regulation: "İşyeri Bina ve Eklentilerinde Alınacak Sağlık ve Güvenlik Önlemlerine İlişkin Yönetmelik Ek-I Madde 8 ve Elektrik İç Tesisleri Yönetmeliği kapsamında",
    requiredAction: "Açıkta ve dağınık kablolar kaldırılmalı, kablo kanalı/koruyucu kılıf içine alınmalı, hasarlı veya ekli kablolar yenilenmelidir.",
  },
  {
    id: "kirilmis_priz_fis",
    label: "Kırık priz, fiş veya kapaksız elektrik ekipmanı var",
    visionCue: "Kirik priz, kirik fis, kapaksiz priz, acik kontak veya hasarli elektrik baglanti noktasi",
    regulation: "Elektrik İç Tesisleri Yönetmeliği ve ilgili elektrik güvenliği mevzuatı kapsamında",
    requiredAction: "Kırık/hasarlı priz ve fişler kullanım dışı bırakılmalı, standartlara uygun sağlam ekipmanlarla değiştirilmelidir.",
  },
  {
    id: "islak_zemin_elektrik_yakini",
    label: "Elektrik ekipmanı yakınında ıslak zemin veya su sızıntısı var",
    visionCue: "Elektrik panosu, kablo, priz veya elektrikli ekipman yakininda islak zemin, su sizintisi veya damlama",
    regulation: "6331 sayılı İş Sağlığı ve Güvenliği Kanunu ile Elektrik İç Tesisleri Yönetmeliği kapsamında",
    requiredAction: "Su sızıntısı giderilmeli, zemin kurutulmalı ve elektrik ekipmanları su temasına karşı korunmalıdır.",
  },
  {
    id: "calisma_alani_duzensiz",
    label: "Çalışma alanında tertip düzen eksikliği var",
    visionCue: "Calisma alaninda yerde malzeme, atik, kablo, ekipman daginikligi veya gecis yolunu kapatan duzensizlik",
    regulation: "İşyeri Bina ve Eklentilerinde Alınacak Sağlık ve Güvenlik Önlemlerine İlişkin Yönetmelik kapsamında",
    requiredAction: "Çalışma alanında tertip düzen sağlanmalı, geçiş yolları açık tutulmalı ve atık/malzeme belirlenen alanlarda depolanmalıdır.",
  },
  {
    id: "uygunsuz_istifleme_depolama",
    label: "Uygunsuz istifleme veya depolama var",
    visionCue: "Devrilme riski olan, gecis yolunu kapatan, rafsiz, sabitlenmemis veya uygunsuz istiflenmis malzeme",
    regulation: "İşyeri Bina ve Eklentilerinde Alınacak Sağlık ve Güvenlik Önlemlerine İlişkin Yönetmelik kapsamında",
    requiredAction: "Malzemeler raflı, sabitlenmiş ve devrilme riski oluşturmayacak şekilde istiflenmeli; geçiş ve acil çıkış yolları kapatılmamalıdır.",
  },
  {
    id: "yangin_ekipmani_erisimi_kapali",
    label: "Yangın ekipmanının önü kapalı veya erişimi zor",
    visionCue: "Yangin dolabi, yangin sondurucu veya hidrant onunun malzeme ile kapatilmasi, erisimin engellenmesi",
    regulation: "Binaların Yangından Korunması Hakkında Yönetmelik ve İşyerlerinde Acil Durumlar Hakkında Yönetmelik kapsamında",
    requiredAction: "Yangın ekipmanlarının önü açık tutulmalı, ekipmanlara her zaman kolay erişim sağlanmalı ve işaretlemeler görünür olmalıdır.",
  },
  {
    id: "acil_cikis_yolu_engelli",
    label: "Acil çıkış veya tahliye yolu engelli",
    visionCue: "Acil cikis kapisi, kapi onu, tahliye yolu veya merdiven gecisinin malzeme ile kapatilmasi",
    regulation: "İşyerlerinde Acil Durumlar Hakkında Yönetmelik ve Binaların Yangından Korunması Hakkında Yönetmelik kapsamında",
    requiredAction: "Acil çıkış kapıları ve tahliye yolları sürekli açık, görünür ve engelsiz tutulmalıdır.",
  },
  {
    id: "kaydirmaz_bant_eksik",
    label: "Merdiven veya kaygan zeminde kaydırmaz önlem eksik",
    visionCue: "Merdiven basamaklarinda, rampa veya kaygan zeminde kaydirmaz bant, kaplama veya uyarinin bulunmamasi",
    regulation: "İşyeri Bina ve Eklentilerinde Alınacak Sağlık ve Güvenlik Önlemlerine İlişkin Yönetmelik kapsamında",
    requiredAction: "Kayma riski olan merdiven ve zeminlerde kaydırmaz bant/kaplama uygulanmalı ve gerekli uyarı işaretleri yerleştirilmelidir.",
  },
  {
    id: "korkuluk_eksik",
    label: "Merdiven, boşluk veya yüksekte çalışma alanında korkuluk eksik",
    visionCue: "Merdiven, platform, bosluk kenari veya yuksekte calisma alaninda korkuluk, ara korkuluk veya topuk levhasi olmamasi",
    regulation: "6331 sayılı İş Sağlığı ve Güvenliği Kanunu ve Yapı İşlerinde İş Sağlığı ve Güvenliği Yönetmeliği kapsamında",
    requiredAction: "Düşme riski bulunan kenarlarda uygun ana korkuluk, ara korkuluk ve topuk levhası tesis edilmelidir.",
  },
  {
    id: "iskele_uygunsuz",
    label: "İskele/platform standartlara uygun değil",
    visionCue: "Iskelede eksik platform, korkuluk, topukluk, merdivenli ulasim veya emniyetli calisma platformu olmamasi",
    regulation: "Yapı İşlerinde İş Sağlığı ve Güvenliği Yönetmeliği ve İş Ekipmanlarının Kullanımında Sağlık ve Güvenlik Şartları Yönetmeliği kapsamında",
    requiredAction: "İskele/platform standartlara uygun hale getirilmeli; platform, korkuluk, topukluk ve güvenli erişim sistemi tamamlanmadan çalışma yapılmamalıdır.",
  },
  {
    id: "kkd_kullanilmiyor",
    label: "Çalışan uygun KKD kullanmıyor",
    visionCue: "Calisanin is ayakkabisi, baret, eldiven, gozluk, maske, emniyet kemeri veya ise uygun KKD kullanmamasi",
    regulation: "6331 sayılı İş Sağlığı ve Güvenliği Kanunu ve ilgili kişisel koruyucu donanım mevzuatı kapsamında",
    requiredAction: "Yapılan işe uygun KKD kullanımı sağlanmalı, çalışanlar bilgilendirilmeli ve saha denetimi ile sürekliliği takip edilmelidir.",
  },
  {
    id: "yuksekte_calisma_emniyet_kemeri_yok",
    label: "Yüksekte çalışmada düşmeye karşı koruyucu sistem yok",
    visionCue: "Yuksekte calisan kiside emniyet kemeri, yasam hatti, ankraj veya dusmeye karsi koruma bulunmamasi",
    regulation: "6331 sayılı İş Sağlığı ve Güvenliği Kanunu ve Yapı İşlerinde İş Sağlığı ve Güvenliği Yönetmeliği kapsamında",
    requiredAction: "Yüksekte çalışmalarda düşmeye karşı toplu koruma önlemleri alınmalı; gerekli hallerde emniyet kemeri, yaşam hattı ve uygun ankraj sistemi kullanılmalıdır.",
  },
  {
    id: "basincli_kap_muayene_etiket_yok",
    label: "Basınçlı kap/periyodik kontrol etiketi veya kanıtı yok",
    visionCue: "Kazan, kompresor, hidrofor, tank veya basincli ekipmanda periyodik kontrol etiketi, muayene belgesi veya tanimlama bulunmamasi",
    regulation: "İş Ekipmanlarının Kullanımında Sağlık ve Güvenlik Şartları Yönetmeliği Ek-II Madde 1 kapsamında",
    requiredAction: "Basınçlı kapların periyodik kontrolleri yetkili kişilerce yaptırılmalı, kayıtları saklanmalı ve ekipman üzerinde tanımlama/etiketleme yapılmalıdır.",
  },
  {
    id: "makine_ekipman_muayene_kaydi_yok",
    label: "İş ekipmanı muayene/bakım kaydı yok",
    visionCue: "Is ekipmani, makine, jeneratör veya kaldirma ekipmaninda bakim muayene etiketi ya da kontrol kaydi bulunmamasi",
    regulation: "İş Ekipmanlarının Kullanımında Sağlık ve Güvenlik Şartları Yönetmeliği Ek-II Madde 1 kapsamında",
    requiredAction: "İş ekipmanlarının günlük/haftalık/aylık/periyodik kontrolleri kayıt altına alınmalı, bakım ve onarım kayıtları saklanmalıdır.",
  },
  {
    id: "kimyasal_uygunsuz_depolama",
    label: "Kimyasallar uygunsuz veya etiketsiz depolanmış",
    visionCue: "Kimyasal kaplarin etiketsiz, duzensiz, uygunsuz ortamda veya ikincil sizinti kabi olmadan depolanmasi",
    regulation: "Kimyasal Maddelerle Çalışmalarda Sağlık ve Güvenlik Önlemleri Hakkında Yönetmelik kapsamında",
    requiredAction: "Kimyasallar etiketli, güvenlik bilgi formuna uygun, havalandırılmış ve sızıntıya karşı kontrollü alanlarda depolanmalıdır.",
  },
  {
    id: "ilkyardim_dolabi_eksik",
    label: "İlk yardım dolabı veya malzemeleri eksik",
    visionCue: "Ilk yardim dolabinin yerinde olmamasi, bos olmasi, erisilememesi veya malzeme eksikligi",
    regulation: "İlkyardım Yönetmeliği ve İşyerlerinde Acil Durumlar Hakkında Yönetmelik kapsamında",
    requiredAction: "İlk yardım dolabı uygun konumda bulundurulmalı, malzemeleri düzenli kontrol edilmeli ve eksikler tamamlanmalıdır.",
  },
  {
    id: "acil_durum_levha_kroki_eksik",
    label: "Acil durum levhası, kroki veya toplanma bilgisi eksik",
    visionCue: "Acil durum telefonu, ekip listesi, tahliye krokisi, acil cikis isareti veya toplanma alani levhasi bulunmamasi",
    regulation: "İşyerlerinde Acil Durumlar Hakkında Yönetmelik kapsamında",
    requiredAction: "Acil durum telefonları, ekip listeleri, tahliye krokileri, acil çıkış işaretleri ve toplanma alanı bilgileri görünür noktalara asılmalıdır.",
  },
];

export function findChecklistItem(id: string) {
  return CHECKLIST.find(item => item.id === id) || null;
}

