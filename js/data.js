/* ==========================================================================
   FORGELINE — Product & Store Data
   هذا الملف فيه بيانات المنتجات التجريبية. لاحقاً، هذه البيانات هتتولد
   تلقائياً من لوحة التحكم وهتتخزن، بس دلوقتي هي بيانات ثابتة للتجربة.
   ========================================================================== */

const CURRENCY = "د.ج";

const CATEGORY_LABELS = {
  protein:    { ar: "بروتين",          fr: "Protéine" },
  preworkout: { ar: "قوة وطاقة",        fr: "Pré-workout" },
  creatine:   { ar: "كرياتين",          fr: "Créatine" },
  vitamins:   { ar: "فيتامينات ومعادن", fr: "Vitamines" },
  mass:       { ar: "ضخامة عضلية",      fr: "Mass Gainer" },
  aminos:     { ar: "أحماض أمينية",     fr: "Acides aminés" },
  fatburn:    { ar: "حوارق الدهون",     fr: "Brûleur de graisse" },
};

const PRODUCTS = [
  {
    id: "p1", cat: "protein", brand: "Optimum Nutrition",
    name_ar: "بروتين واي ايزوليت - فانيلا", name_fr: "Whey Isolate - Vanille",
    price: 18500, oldPrice: 21000, stock: 32, lowStockAt: 5,
    img: "https://images.unsplash.com/photo-1593095948071-474c5cc2989d?w=600&q=80",
    desc_ar: "بروتين واي معزول عالي النقاء، 25غ بروتين لكل حصة، يدعم بناء العضلات والاستشفاء بعد التمرين.",
    desc_fr: "Whey isolate haute pureté, 25g de protéines par dose, soutient la construction musculaire.",
    best: true, isNew: false, createdAt: "2026-01-10"
  },
  {
    id: "p2", cat: "protein", brand: "Dymatize",
    name_ar: "بروتين واي كونسنتريت - شوكولاتة", name_fr: "Whey Concentré - Chocolat",
    price: 16500, stock: 40, lowStockAt: 5,
    img: "https://images.unsplash.com/photo-1579722820901-cea4a05fbac9?w=600&q=80",
    desc_ar: "مزيج بروتين كلاسيكي بطعم شوكولاتة غني، مثالي بعد التمرين مباشرة.",
    desc_fr: "Mélange protéiné classique au chocolat riche, idéal après l'entraînement.",
    best: true, isNew: false, createdAt: "2026-02-01"
  },
  {
    id: "p3", cat: "preworkout", brand: "MuscleTech",
    name_ar: "بري وركاوت - توت أزرق", name_fr: "Pré-Workout - Myrtille",
    price: 9500, stock: 18, lowStockAt: 5,
    img: "https://images.unsplash.com/photo-1579722821273-0f6c1b5d8b3b?w=600&q=80",
    desc_ar: "طاقة وتركيز قبل التمرين مع كافيين وبيتا ألانين لأداء أقوى.",
    desc_fr: "Énergie et concentration avant l'entraînement avec caféine et bêta-alanine.",
    best: true, isNew: true, createdAt: "2026-06-01"
  },
  {
    id: "p4", cat: "vitamins", brand: "Nutrex",
    name_ar: "فيتامين د3 + ك2", name_fr: "Vitamine D3 + K2",
    price: 4200, stock: 60, lowStockAt: 10,
    img: "https://images.unsplash.com/photo-1607619056574-7b8d3ee536b2?w=600&q=80",
    desc_ar: "دعم صحة العظام والمناعة، جرعة يومية واحدة سهلة الاستخدام.",
    desc_fr: "Soutient la santé osseuse et l'immunité, une dose quotidienne.",
    best: false, isNew: false, createdAt: "2026-01-15"
  },
  {
    id: "p5", cat: "mass", brand: "BiotechUSA",
    name_ar: "ماس جينر - فانيلا", name_fr: "Mass Gainer - Vanille",
    price: 14500, stock: 3, lowStockAt: 5,
    img: "https://images.unsplash.com/photo-1622484212385-eb596e7fee49?w=600&q=80",
    desc_ar: "سعرات عالية الجودة لزيادة الوزن والكتلة العضلية بفعالية.",
    desc_fr: "Calories de haute qualité pour une prise de poids et de masse efficace.",
    best: false, isNew: false, createdAt: "2026-01-20"
  },
  {
    id: "p6", cat: "aminos", brand: "ON Gold Standard",
    name_ar: "بي سي ايه ايه 2:1:1", name_fr: "BCAA 2:1:1",
    price: 6900, stock: 45, lowStockAt: 8,
    img: "https://images.unsplash.com/photo-1599058917212-d750089bc07e?w=600&q=80",
    desc_ar: "أحماض أمينية متفرعة لتقليل التعب العضلي وتحسين الاستشفاء.",
    desc_fr: "Acides aminés ramifiés pour réduire la fatigue musculaire.",
    best: true, isNew: false, createdAt: "2026-02-10"
  },
  {
    id: "p7", cat: "fatburn", brand: "MuscleTech",
    name_ar: "حارق دهون L-كارنيتين", name_fr: "Brûleur L-Carnitine",
    price: 5500, stock: 0, lowStockAt: 5,
    img: "https://images.unsplash.com/photo-1556228720-195a672e8a03?w=600&q=80",
    desc_ar: "يدعم استقلاب الدهون لزيادة الطاقة أثناء التمرين.",
    desc_fr: "Soutient le métabolisme des graisses pour plus d'énergie.",
    best: false, isNew: false, createdAt: "2026-01-05"
  },
  {
    id: "p8", cat: "vitamins", brand: "Nutrex",
    name_ar: "أوميغا 3 - زيت سمك", name_fr: "Oméga 3 - Huile de poisson",
    price: 4800, stock: 50, lowStockAt: 10,
    img: "https://images.unsplash.com/photo-1577460551100-d3c8c5e5b3a3?w=600&q=80",
    desc_ar: "أحماض دهنية أساسية لدعم صحة القلب والمفاصل.",
    desc_fr: "Acides gras essentiels pour la santé cardiaque et articulaire.",
    best: false, isNew: false, createdAt: "2026-01-08"
  },
  {
    id: "p9", cat: "protein", brand: "BiotechUSA",
    name_ar: "بروتين نباتي - فانيلا", name_fr: "Protéine végétale - Vanille",
    price: 13500, stock: 15, lowStockAt: 5,
    img: "https://images.unsplash.com/photo-1622484211836-77d3e3f51d75?w=600&q=80",
    desc_ar: "بروتين نباتي 100% من البازلاء والأرز، خالٍ من الألبان.",
    desc_fr: "Protéine végétale 100% pois et riz, sans produits laitiers.",
    best: false, isNew: true, createdAt: "2026-05-20"
  },
  {
    id: "p10", cat: "creatine", brand: "Optimum Nutrition",
    name_ar: "كرياتين مونوهيدرات", name_fr: "Créatine Monohydrate",
    price: 5200, stock: 70, lowStockAt: 10,
    img: "https://images.unsplash.com/photo-1593095948843-99519b5f7c70?w=600&q=80",
    desc_ar: "يدعم القوة والأداء الانفجاري في التمارين عالية الكثافة.",
    desc_fr: "Soutient la force et la performance explosive.",
    best: true, isNew: false, createdAt: "2026-02-15"
  },
  {
    id: "p11", cat: "aminos", brand: "ON Gold Standard",
    name_ar: "غلوتامين نقي", name_fr: "Glutamine pure",
    price: 6200, stock: 4, lowStockAt: 5,
    img: "https://images.unsplash.com/photo-1622484212385-eb596e7fee48?w=600&q=80",
    desc_ar: "يدعم الاستشفاء العضلي وصحة الجهاز الهضمي.",
    desc_fr: "Soutient la récupération musculaire et la santé digestive.",
    best: false, isNew: false, createdAt: "2026-01-25"
  },
  {
    id: "p12", cat: "fatburn", brand: "Dymatize",
    name_ar: "سي إل إيه - كبسولات", name_fr: "CLA - Capsules",
    price: 5400, stock: 33, lowStockAt: 5,
    img: "https://images.unsplash.com/photo-1607619056574-7b8d3ee536b3?w=600&q=80",
    desc_ar: "حمض اللينوليك المترافق لدعم تركيبة الجسم.",
    desc_fr: "Acide linoléique conjugué pour soutenir la composition corporelle.",
    best: false, isNew: true, createdAt: "2026-06-10"
  },
];

const OFFERS = [
  {
    id: "o1",
    title_ar: "تخفيض على البروتين", title_fr: "Promo Protéine",
    productId: "p1", discount: 12,
    start: "2026-06-01", end: "2026-07-31",
    img: "https://images.unsplash.com/photo-1593095948071-474c5cc2989d?w=900&q=80"
  },
  {
    id: "o2",
    title_ar: "عرض الكرياتين", title_fr: "Promo Créatine",
    productId: "p10", discount: 15,
    start: "2026-06-01", end: "2026-07-31",
    img: "https://images.unsplash.com/photo-1593095948843-99519b5f7c70?w=900&q=80"
  },
];

const WILAYAS = [
  "أدرار","الشلف","الأغواط","أم البواقي","باتنة","بجاية","بسكرة","بشار","البليدة","البويرة",
  "تمنراست","تبسة","تلمسان","تيارت","تيزي وزو","الجزائر العاصمة","الجلفة","جيجل","سطيف","سعيدة",
  "سكيكدة","سيدي بلعباس","عنابة","قالمة","قسنطينة","المدية","مستغانم","المسيلة","معسكر","ورقلة",
  "وهران","البيض","إليزي","برج بوعريريج","بومرداس","الطارف","تندوف","تيسمسيلت","الوادي","خنشلة",
  "سوق أهراس","تيبازة","ميلة","عين الدفلى","النعامة","عين تموشنت","غرداية","غليزان",
  "تيميمون","برج باجي مختار","أولاد جلال","بني عباس","عين صالح","عين قزام","تقرت","جانت",
  "المغير","المنيعة","آفلو","بريكة","القنطرة","بير العاتر","العريشة","قصر الشلالة",
  "عين وسارة","مسعد","قصر البخاري","بوسعادة","الأبيض سيدي الشيخ",
];

/* ============================================================
   DELIVERY PRICES PER WILAYA (د.ج)
   ⚠️ أسعار تقريبية مؤقتة — عدّلها بنفسك بكل سهولة:
   كل ولاية ليها سعرين: home (توصيل للمنزل) و office (مكتب التوصيل).
   فقط غيّر الأرقام أمام اسم الولاية، بدون لمس أي شيء آخر بالملف.
   لو أضفت ولاية جديدة هنا، لازم تكون موجودة بنفس الاسم في WILAYAS فوق.
   ============================================================ */
const DELIVERY_PRICES = {
  "أدرار": { home: 1200, office: 950 },
  "الشلف": { home: 500, office: 400 },
  "الأغواط": { home: 700, office: 550 },
  "أم البواقي": { home: 700, office: 550 },
  "باتنة": { home: 700, office: 550 },
  "بجاية": { home: 600, office: 450 },
  "بسكرة": { home: 700, office: 550 },
  "بشار": { home: 1100, office: 850 },
  "البليدة": { home: 450, office: 350 },
  "البويرة": { home: 550, office: 450 },
  "تمنراست": { home: 1500, office: 1150 },
  "تبسة": { home: 800, office: 600 },
  "تلمسان": { home: 500, office: 400 },
  "تيارت": { home: 550, office: 450 },
  "تيزي وزو": { home: 550, office: 450 },
  "الجزائر العاصمة": { home: 400, office: 300 },
  "الجلفة": { home: 650, office: 500 },
  "جيجل": { home: 650, office: 500 },
  "سطيف": { home: 650, office: 500 },
  "سعيدة": { home: 500, office: 400 },
  "سكيكدة": { home: 700, office: 550 },
  "سيدي بلعباس": { home: 300, office: 250 },
  "عنابة": { home: 750, office: 600 },
  "قالمة": { home: 750, office: 600 },
  "قسنطينة": { home: 700, office: 550 },
  "المدية": { home: 500, office: 400 },
  "مستغانم": { home: 450, office: 350 },
  "المسيلة": { home: 650, office: 500 },
  "معسكر": { home: 400, office: 300 },
  "ورقلة": { home: 1000, office: 800 },
  "وهران": { home: 400, office: 300 },
  "البيض": { home: 800, office: 600 },
  "إليزي": { home: 1600, office: 1250 },
  "برج بوعريريج": { home: 650, office: 500 },
  "بومرداس": { home: 450, office: 350 },
  "الطارف": { home: 800, office: 600 },
  "تندوف": { home: 1500, office: 1150 },
  "تيسمسيلت": { home: 550, office: 450 },
  "الوادي": { home: 1000, office: 800 },
  "خنشلة": { home: 750, office: 600 },
  "سوق أهراس": { home: 800, office: 600 },
  "تيبازة": { home: 450, office: 350 },
  "ميلة": { home: 700, office: 550 },
  "عين الدفلى": { home: 500, office: 400 },
  "النعامة": { home: 900, office: 700 },
  "عين تموشنت": { home: 400, office: 300 },
  "غرداية": { home: 900, office: 700 },
  "غليزان": { home: 450, office: 350 },
  "تيميمون": { home: 1400, office: 1100 },
  "برج باجي مختار": { home: 1500, office: 1150 },
  "أولاد جلال": { home: 800, office: 600 },
  "بني عباس": { home: 1200, office: 950 },
  "عين صالح": { home: 1500, office: 1150 },
  "عين قزام": { home: 1700, office: 1350 },
  "تقرت": { home: 950, office: 750 },
  "جانت": { home: 1700, office: 1350 },
  "المغير": { home: 950, office: 750 },
  "المنيعة": { home: 950, office: 750 },
  "آفلو": { home: 650, office: 500 },
  "بريكة": { home: 700, office: 550 },
  "القنطرة": { home: 700, office: 550 },
  "بير العاتر": { home: 800, office: 600 },
  "العريشة": { home: 800, office: 600 },
  "قصر الشلالة": { home: 600, office: 450 },
  "عين وسارة": { home: 600, office: 450 },
  "مسعد": { home: 700, office: 550 },
  "قصر البخاري": { home: 500, office: 400 },
  "بوسعادة": { home: 650, office: 500 },
  "الأبيض سيدي الشيخ": { home: 800, office: 600 },
};
const DEFAULT_DELIVERY_PRICE = { home: 700, office: 550 }; // يُستخدم فقط إذا لم توجد ولاية بالجدول أعلاه

/* ============================================================
   LOCAL DATA STORE
   يقرأ من localStorage إذا كانت بيانات لوحة التحكم محفوظة هناك،
   وإلا يستخدم البيانات الافتراضية أعلاه.
   ============================================================ */
const Store = {
  KEYS: {
    products: "forgeline_products",
    offers: "forgeline_offers",
    orders: "forgeline_orders",
    cart: "forgeline_cart",
    lang: "forgeline_lang",
  },

  getProducts() {
    const raw = localStorage.getItem(this.KEYS.products);
    return raw ? JSON.parse(raw) : PRODUCTS;
  },
  saveProducts(list) {
    localStorage.setItem(this.KEYS.products, JSON.stringify(list));
  },

  getOffers() {
    const raw = localStorage.getItem(this.KEYS.offers);
    return raw ? JSON.parse(raw) : OFFERS;
  },
  saveOffers(list) {
    localStorage.setItem(this.KEYS.offers, JSON.stringify(list));
  },

  getOrders() {
    const raw = localStorage.getItem(this.KEYS.orders);
    return raw ? JSON.parse(raw) : [];
  },
  saveOrders(list) {
    localStorage.setItem(this.KEYS.orders, JSON.stringify(list));
  },

  getCart() {
    const raw = localStorage.getItem(this.KEYS.cart);
    return raw ? JSON.parse(raw) : [];
  },
  saveCart(cart) {
    localStorage.setItem(this.KEYS.cart, JSON.stringify(cart));
  },

  getLang() {
    return localStorage.getItem(this.KEYS.lang) || "ar";
  },
  setLang(lang) {
    localStorage.setItem(this.KEYS.lang, lang);
  },
};
