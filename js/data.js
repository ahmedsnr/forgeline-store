/* ==========================================================================
   FORGELINE — Product & Store Data
   ========================================================================== */

const CURRENCY = "د.ج";

/* الفئات الافتراضية — تُستخدم فقط أول مرة (قبل ما يضيف المالك فئاته من لوحة التحكم) */
const DEFAULT_CATEGORIES = [
  { id: "protein",    ar: "بروتين",           fr: "Protéine",              icon: "💪" },
  { id: "preworkout", ar: "قوة وطاقة",         fr: "Pré-workout",           icon: "⚡" },
  { id: "creatine",   ar: "كرياتين",           fr: "Créatine",              icon: "📈" },
  { id: "vitamins",   ar: "فيتامينات ومعادن",  fr: "Vitamines",             icon: "🛡️" },
  { id: "mass",       ar: "ضخامة عضلية",       fr: "Mass Gainer",           icon: "🏋️" },
  { id: "aminos",     ar: "أحماض أمينية",      fr: "Acides aminés",         icon: "🔬" },
  { id: "fatburn",    ar: "حوارق الدهون",      fr: "Brûleur de graisse",    icon: "🔥" },
];

/* متوافق مع الكود القديم اللي بيستخدم CATEGORY_LABELS */
const CATEGORY_LABELS = Object.fromEntries(
  DEFAULT_CATEGORIES.map((c) => [c.id, { ar: c.ar, fr: c.fr }])
);

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

/* قائمة الولايات مع أرقامها الرسمية (التقسيم الإداري الجزائري 2026 — 69 ولاية) */
const WILAYAS_DATA = [
  { code: 1, name: "أدرار" }, { code: 2, name: "الشلف" }, { code: 3, name: "الأغواط" },
  { code: 4, name: "أم البواقي" }, { code: 5, name: "باتنة" }, { code: 6, name: "بجاية" },
  { code: 7, name: "بسكرة" }, { code: 8, name: "بشار" }, { code: 9, name: "البليدة" },
  { code: 10, name: "البويرة" }, { code: 11, name: "تمنراست" }, { code: 12, name: "تبسة" },
  { code: 13, name: "تلمسان" }, { code: 14, name: "تيارت" }, { code: 15, name: "تيزي وزو" },
  { code: 16, name: "الجزائر العاصمة" }, { code: 17, name: "الجلفة" }, { code: 18, name: "جيجل" },
  { code: 19, name: "سطيف" }, { code: 20, name: "سعيدة" }, { code: 21, name: "سكيكدة" },
  { code: 22, name: "سيدي بلعباس" }, { code: 23, name: "عنابة" }, { code: 24, name: "قالمة" },
  { code: 25, name: "قسنطينة" }, { code: 26, name: "المدية" }, { code: 27, name: "مستغانم" },
  { code: 28, name: "المسيلة" }, { code: 29, name: "معسكر" }, { code: 30, name: "ورقلة" },
  { code: 31, name: "وهران" }, { code: 32, name: "البيض" }, { code: 33, name: "إليزي" },
  { code: 34, name: "برج بوعريريج" }, { code: 35, name: "بومرداس" }, { code: 36, name: "الطارف" },
  { code: 37, name: "تندوف" }, { code: 38, name: "تيسمسيلت" }, { code: 39, name: "الوادي" },
  { code: 40, name: "خنشلة" }, { code: 41, name: "سوق أهراس" }, { code: 42, name: "تيبازة" },
  { code: 43, name: "ميلة" }, { code: 44, name: "عين الدفلى" }, { code: 45, name: "النعامة" },
  { code: 46, name: "عين تموشنت" }, { code: 47, name: "غرداية" }, { code: 48, name: "غليزان" },
  { code: 49, name: "تيميمون" }, { code: 50, name: "برج باجي مختار" }, { code: 51, name: "أولاد جلال" },
  { code: 52, name: "بني عباس" }, { code: 53, name: "عين صالح" }, { code: 54, name: "عين قزام" },
  { code: 55, name: "تقرت" }, { code: 56, name: "جانت" }, { code: 57, name: "المغير" },
  { code: 58, name: "المنيعة" }, { code: 59, name: "آفلو" }, { code: 60, name: "بريكة" },
  { code: 61, name: "القنطرة" }, { code: 62, name: "بير العاتر" }, { code: 63, name: "العريشة" },
  { code: 64, name: "قصر الشلالة" }, { code: 65, name: "عين وسارة" }, { code: 66, name: "مسعد" },
  { code: 67, name: "قصر البخاري" }, { code: 68, name: "بوسعادة" }, { code: 69, name: "الأبيض سيدي الشيخ" },
];

/* قائمة أسماء فقط — تستخدمها أجزاء أخرى من الكود (مثل DELIVERY_PRICES) */
const WILAYAS = WILAYAS_DATA.map((w) => w.name);

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
   DATA STORE — Firebase Firestore
   المنتجات والعروض والطلبات تتخزن في Firestore (مشتركة بين كل
   الأجهزة فوراً). السلة ولغة الواجهة تفضل محلية لكل جهاز/متصفح
   لأنها بيانات شخصية مش محتاجة مزامنة.

   ⚠️ كل دوال المنتجات/العروض/الطلبات بقت async — لازم تستخدم
   await أو .then() معاها في أي مكان بتتنادى فيه.
   ============================================================ */
const Store = {
  COLLECTIONS: {
    products: "products",
    offers: "offers",
    orders: "orders",
  },
  LOCAL_KEYS: {
    cart: "forgeline_cart",
    lang: "forgeline_lang",
  },

  _seeded: false,

  /* تتأكد إن فيه بيانات أولية في Firestore أول مرة (مرة واحدة بس) */
  async _ensureSeeded() {
    if (this._seeded) return;
    this._seeded = true;
    try {
      const snapshot = await db.collection(this.COLLECTIONS.products).limit(1).get();
      if (snapshot.empty) {
        const batch = db.batch();
        PRODUCTS.forEach((p) => {
          const ref = db.collection(this.COLLECTIONS.products).doc(p.id);
          batch.set(ref, p);
        });
        OFFERS.forEach((o) => {
          const ref = db.collection(this.COLLECTIONS.offers).doc(o.id);
          batch.set(ref, o);
        });
        await batch.commit();
      }
    } catch (e) {
      console.error("Firestore seeding failed:", e);
    }
  },

  /* ---------------- PRODUCTS ---------------- */
  async getProducts() {
    await this._ensureSeeded();
    try {
      const snapshot = await db.collection(this.COLLECTIONS.products).get();
      if (snapshot.empty) return PRODUCTS;
      return snapshot.docs.map((doc) => doc.data());
    } catch (e) {
      console.error("getProducts failed:", e);
      return PRODUCTS;
    }
  },
  async saveProducts(list) {
    try {
      const batch = db.batch();
      list.forEach((p) => {
        const ref = db.collection(this.COLLECTIONS.products).doc(p.id);
        batch.set(ref, p);
      });
      await batch.commit();
    } catch (e) {
      console.error("saveProducts failed:", e);
    }
  },
  async saveProduct(p) {
    try {
      await db.collection(this.COLLECTIONS.products).doc(p.id).set(p);
    } catch (e) {
      console.error("saveProduct failed:", e);
    }
  },
  async deleteProduct(id) {
    try {
      await db.collection(this.COLLECTIONS.products).doc(id).delete();
    } catch (e) {
      console.error("deleteProduct failed:", e);
    }
  },

  /* ---------------- OFFERS ---------------- */
  async getOffers() {
    await this._ensureSeeded();
    try {
      const snapshot = await db.collection(this.COLLECTIONS.offers).get();
      return snapshot.docs.map((doc) => doc.data());
    } catch (e) {
      console.error("getOffers failed:", e);
      return OFFERS;
    }
  },
  async saveOffers(list) {
    try {
      const batch = db.batch();
      list.forEach((o) => {
        const ref = db.collection(this.COLLECTIONS.offers).doc(o.id);
        batch.set(ref, o);
      });
      await batch.commit();
    } catch (e) {
      console.error("saveOffers failed:", e);
    }
  },
  async saveOffer(o) {
    try {
      await db.collection(this.COLLECTIONS.offers).doc(o.id).set(o);
    } catch (e) {
      console.error("saveOffer failed:", e);
    }
  },
  async deleteOffer(id) {
    try {
      await db.collection(this.COLLECTIONS.offers).doc(id).delete();
    } catch (e) {
      console.error("deleteOffer failed:", e);
    }
  },

  /* ---------------- ORDERS ---------------- */
  async getOrders() {
    try {
      const snapshot = await db.collection(this.COLLECTIONS.orders).orderBy("date", "desc").get();
      return snapshot.docs.map((doc) => doc.data());
    } catch (e) {
      console.error("getOrders failed:", e);
      return [];
    }
  },
  async saveOrders(list) {
    try {
      const batch = db.batch();
      list.forEach((o) => {
        const ref = db.collection(this.COLLECTIONS.orders).doc(o.id);
        batch.set(ref, o);
      });
      await batch.commit();
    } catch (e) {
      console.error("saveOrders failed:", e);
    }
  },
  async addOrder(order) {
    try {
      await db.collection(this.COLLECTIONS.orders).doc(order.id).set(order);
    } catch (e) {
      console.error("addOrder failed:", e);
      throw e;
    }
  },
  async updateOrderStatus(orderId, status) {
    try {
      await db.collection(this.COLLECTIONS.orders).doc(orderId).update({ status });
    } catch (e) {
      console.error("updateOrderStatus failed:", e);
    }
  },

  /* ---------------- CART (محلي لكل جهاز) ---------------- */
  getCart() {
    const raw = localStorage.getItem(this.LOCAL_KEYS.cart);
    return raw ? JSON.parse(raw) : [];
  },
  saveCart(cart) {
    localStorage.setItem(this.LOCAL_KEYS.cart, JSON.stringify(cart));
  },

  /* ---------------- LANGUAGE (محلي لكل جهاز) ---------------- */
  getLang() {
    return localStorage.getItem(this.LOCAL_KEYS.lang) || "ar";
  },
  setLang(lang) {
    localStorage.setItem(this.LOCAL_KEYS.lang, lang);
  },

  /* ---------------- SETTINGS العامة (شريط الإعلان، صور، أرقام هاتف...) ---------------- */
  DEFAULT_SETTINGS: {
    announceEnabled: true,
    announceText_ar: "توصيل مجاني للطلبات فوق 8,000 د.ج 🚚",
    announceText_fr: "Livraison gratuite dès 8 000 DA 🚚",
    heroImage: "",
    offerBannerImage: "",
    phoneNumbers: [],
  },

  async getSettings() {
    try {
      const doc = await db.collection("settings").doc("general").get();
      if (doc.exists) {
        return { ...this.DEFAULT_SETTINGS, ...doc.data() };
      }
      return { ...this.DEFAULT_SETTINGS };
    } catch (e) {
      console.error("getSettings failed:", e);
      return { ...this.DEFAULT_SETTINGS };
    }
  },
  async saveSettings(settings) {
    try {
      await db.collection("settings").doc("general").set(settings, { merge: true });
    } catch (e) {
      console.error("saveSettings failed:", e);
      throw e;
    }
  },

  /* ---------------- DELIVERY PRICES (قابلة للتعديل من لوحة التحكم) ---------------- */
  async getDeliveryPrices() {
    try {
      const doc = await db.collection("settings").doc("delivery").get();
      if (doc.exists && doc.data().prices) {
        return doc.data().prices;
      }
      // أول مرة: نزرع الأسعار الافتراضية الموجودة في الكود
      await this.saveDeliveryPrices(DELIVERY_PRICES);
      return DELIVERY_PRICES;
    } catch (e) {
      console.error("getDeliveryPrices failed:", e);
      return DELIVERY_PRICES;
    }
  },
  async saveDeliveryPrices(prices) {
    try {
      await db.collection("settings").doc("delivery").set({ prices }, { merge: true });
    } catch (e) {
      console.error("saveDeliveryPrices failed:", e);
      throw e;
    }
  },

  /* ---------------- CATEGORIES (فئات المنتجات) ---------------- */
  async getCategories() {
    try {
      const snap = await db.collection("categories").orderBy("order").get();
      if (!snap.empty) return snap.docs.map((d) => d.data());
      // أول مرة: نزرع الفئات الافتراضية
      await this.seedCategories();
      return DEFAULT_CATEGORIES.map((c, i) => ({ ...c, order: i }));
    } catch (e) {
      console.error("getCategories failed:", e);
      return DEFAULT_CATEGORIES.map((c, i) => ({ ...c, order: i }));
    }
  },
  async seedCategories() {
    const batch = db.batch();
    DEFAULT_CATEGORIES.forEach((c, i) => {
      const ref = db.collection("categories").doc(c.id);
      batch.set(ref, { ...c, order: i });
    });
    await batch.commit();
  },
  async saveCategory(cat) {
    await db.collection("categories").doc(cat.id).set(cat);
  },
  async deleteCategory(id) {
    // حذف الفئة وكل فئاتها الفرعية
    const batch = db.batch();
    batch.delete(db.collection("categories").doc(id));
    const subs = await db.collection("subcategories").where("parentId", "==", id).get();
    subs.forEach(doc => batch.delete(doc.ref));
    await batch.commit();
  },
  async reorderCategories(list) {
    const batch = db.batch();
    list.forEach((cat, i) => {
      batch.update(db.collection("categories").doc(cat.id), { order: i });
    });
    await batch.commit();
  },

  /* ---------------- SUB-CATEGORIES (فئات فرعية) ---------------- */
  async getSubcategories(parentId) {
    try {
      const snap = await db.collection("subcategories")
        .where("parentId", "==", parentId)
        .orderBy("order")
        .get();
      return snap.docs.map(d => d.data());
    } catch (e) {
      console.error("getSubcategories failed:", e);
      return [];
    }
  },
  async saveSubcategory(sub) {
    await db.collection("subcategories").doc(sub.id).set(sub);
  },
  async deleteSubcategory(id) {
    await db.collection("subcategories").doc(id).delete();
  },
};
