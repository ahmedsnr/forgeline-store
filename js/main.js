/* ==========================================================================
   FORGELINE — Core Site Logic
   يشتغل على كل صفحات الموقع (غير لوحة التحكم)
   ========================================================================== */

(function () {
  "use strict";

  /* ----------------------------------------------------------------------
     STATE
     ---------------------------------------------------------------------- */
  let lang = Store.getLang();
  let cart = Store.getCart();

  /* كاش محلي للمنتجات والعروض — يتحمّل مرة واحدة من Firestore عند فتح
     الصفحة، وبعدها كل دوال العرض (sync) بتقرأ منه مباشرة بدون انتظار.
     بعد أي عملية تضيف/تعدّل بيانات (نادراً ما تحصل من صفحات الزبون)
     لازم ننادي refreshDataCache() عشان الكاش يتحدث. */
  let productsCache = [];
  let offersCache = [];
  let settingsCache = null;
  let categoriesCache = [];

  async function refreshDataCache() {
    const [products, offers, settings, categories] = await Promise.all([
      Store.getProducts(),
      Store.getOffers(),
      Store.getSettings(),
      Store.getCategories(),
    ]);
    productsCache = products;
    offersCache = offers;
    settingsCache = settings;
    categoriesCache = categories;
    applySettings();
  }

  /* تطبيق الإعدادات العامة على عناصر الواجهة (شريط الإعلان، صورة الهيرو، أرقام الهاتف...) */
  function applySettings() {
    if (!settingsCache) return;

    // شريط الإعلان
    const bar = document.querySelector(".announce-bar");
    if (bar) {
      if (settingsCache.announceEnabled === false) {
        bar.style.display = "none";
      } else {
        bar.style.display = "";
        const text = lang === "ar" ? settingsCache.announceText_ar : settingsCache.announceText_fr;
        if (text) bar.textContent = text;
      }
    }

    // صورة الـ Hero (موجودة فقط في الصفحة الرئيسية)
    const heroImg = document.getElementById("heroImage");
    if (heroImg && settingsCache.heroImage) {
      heroImg.src = settingsCache.heroImage;
    }

    // أرقام الهاتف في الفوتر
    const phonesList = document.getElementById("footerPhones");
    if (phonesList) {
      const phones = Array.isArray(settingsCache.phoneNumbers) ? settingsCache.phoneNumbers : [];
      phonesList.innerHTML = phones.map((num) => `
        <li class="footer-contact-item">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z"/></svg>
          <a href="tel:${num.replace(/\\s/g, "")}" dir="ltr" style="unicode-bidi:plaintext;">${num}</a>
        </li>
      `).join("");
    }
  }

  /* ----------------------------------------------------------------------
     I18N STRINGS (UI chrome shared across pages)
     ---------------------------------------------------------------------- */
  const UI = {
    ar: {
      search_ph: "ابحث عن منتج أو ماركة...",
      add_to_cart: "أضف للسلة",
      out_of_stock: "غير متوفر",
      low_stock: "كمية محدودة",
      in_stock_left: "متبقي",
      quick_view: "عرض سريع",
      cart_empty_title: "سلتك فارغة حالياً",
      cart_empty_sub: "أضف منتجات لتبدأ طلبك",
      cart_subtotal: "المجموع الفرعي",
      checkout: "إتمام الطلب",
      offer_ends: "ينتهي في",
      bestsellers_short: "★",
      new_short: "جديد",
    },
    fr: {
      search_ph: "Rechercher un produit ou une marque...",
      add_to_cart: "Ajouter au panier",
      out_of_stock: "Rupture de stock",
      low_stock: "Stock limité",
      in_stock_left: "restant(s)",
      quick_view: "Aperçu rapide",
      cart_empty_title: "Votre panier est vide",
      cart_empty_sub: "Ajoutez des produits pour commencer",
      cart_subtotal: "Sous-total",
      checkout: "Passer la commande",
      offer_ends: "Se termine le",
      bestsellers_short: "★",
      new_short: "Nouveau",
    },
  };
  function t(key) { return UI[lang][key] || key; }
  function fmt(n) { return Number(n || 0).toLocaleString("en-US"); }
  function currency() { return lang === "ar" ? "د.ج" : "DZD"; }

  /* ----------------------------------------------------------------------
     LANGUAGE
     ---------------------------------------------------------------------- */
  function applyLang() {
    document.documentElement.lang = lang;
    document.documentElement.dir = lang === "ar" ? "rtl" : "ltr";
    // ترجمة كل العناصر الثابتة في HTML
    if (window.applyTranslations) window.applyTranslations(lang);
    // تحديث placeholders خانات البحث
    const ph = lang === "ar" ? "ابحث عن منتج أو ماركة..." : "Rechercher un produit ou une marque...";
    document.querySelectorAll("#headerSearch, #mobileSearch").forEach(el => el.placeholder = ph);
    // تحديث زرار تبديل اللغة
    const switchBtn = document.getElementById("langSwitch");
    if (switchBtn) {
      const svg = switchBtn.querySelector("svg");
      switchBtn.textContent = lang === "ar" ? "FR" : "AR";
      if (svg) switchBtn.prepend(svg);
    }
  }

  function toggleLang() {
    const newLang = lang === "ar" ? "fr" : "ar";
    Store.setLang(newLang);
    // إعادة تحميل الصفحة عشان كل شيء يتغير باللغة الجديدة بشكل كامل
    window.location.reload();
  }

  /* ----------------------------------------------------------------------
     CART LOGIC
     ---------------------------------------------------------------------- */
  function addBundleToCart(offer) {
    // الباقة تضاف كعنصر واحد بـ id خاص مع بياناتها مخزّنة في السلة مباشرة
    const bundleId = `bundle__${offer.id}`;
    const firstProd = offer.bundleProducts && offer.bundleProducts[0]
      ? productsCache.find((p) => p.id === offer.bundleProducts[0].productId)
      : null;

    // نخزّن بيانات الباقة في item السلة عشان تبقى حتى بعد reload
    const bundleCartItem = {
      id: bundleId,
      qty: 1,
      bundleData: {
        id: bundleId,
        name_ar: offer.title_ar,
        name_fr: offer.title_fr,
        price: offer.bundlePrice,
        img: offer.img || (firstProd ? firstProd.img : ""),
        brand_ar: lang === "fr" ? "Pack" : "باقة تجميعية",
        brand_fr: "Pack",
        isBundle: true,
      },
    };

    const existing = cart.find((c) => c.id === bundleId);
    if (existing) {
      existing.qty += 1;
    } else {
      cart.push(bundleCartItem);
    }

    // نضيف للـ productsCache عشان getCartItems تشتغل
    if (!productsCache.find((p) => p.id === bundleId)) {
      productsCache.push({
        ...bundleCartItem.bundleData,
        brand: bundleCartItem.bundleData.brand_ar,
      });
    }

    Store.saveCart(cart);
    renderCartDrawer();
    openCartDrawer();
  }

  function addToCart(productId, qty) {
    qty = qty || 1;
    const existing = cart.find((c) => c.id === productId);
    if (existing) existing.qty += qty;
    else cart.push({ id: productId, qty: qty });
    Store.saveCart(cart);
    renderCartDrawer();
    openCartDrawer();
  }

  function updateCartQty(productId, qty) {
    if (qty <= 0) {
      cart = cart.filter((c) => c.id !== productId);
    } else {
      const item = cart.find((c) => c.id === productId);
      if (item) item.qty = qty;
    }
    Store.saveCart(cart);
    renderCartDrawer();
  }

  function removeFromCart(productId) {
    cart = cart.filter((c) => c.id !== productId);
    Store.saveCart(cart);
    renderCartDrawer();
  }

  function getCartItems() {
    return cart.map((c) => {
      // لو الـ item باقة تجميعية، نستخدم bundleData المخزّنة في السلة
      if (c.bundleData) {
        const lang_val = lang;
        return {
          ...c,
          product: {
            ...c.bundleData,
            name_ar: c.bundleData.name_ar,
            name_fr: c.bundleData.name_fr,
            brand: lang_val === "ar" ? c.bundleData.brand_ar : c.bundleData.brand_fr,
            price: c.bundleData.price,
            img: c.bundleData.img,
          }
        };
      }
      return { ...c, product: productsCache.find((p) => p.id === c.id) };
    }).filter((c) => c.product);
  }

  function getCartCount() {
    return cart.reduce((s, c) => s + c.qty, 0);
  }

  function getCartSubtotal() {
    return getCartItems().reduce((s, c) => s + c.qty * c.product.price, 0);
  }

  /* ----------------------------------------------------------------------
     CART DRAWER UI
     ---------------------------------------------------------------------- */
  function renderCartDrawer() {
    const badge = document.getElementById("cartBadge");
    const body = document.getElementById("drawerBody");
    const foot = document.getElementById("drawerFoot");
    const subtotalEl = document.getElementById("drawerSubtotal");
    if (!body) return;

    const count = getCartCount();
    if (badge) {
      badge.textContent = count;
      badge.style.display = count > 0 ? "flex" : "none";
    }

    const items = getCartItems();

    if (items.length === 0) {
      body.innerHTML = `
        <div class="drawer-empty">
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/><path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/></svg>
          <strong>${t("cart_empty_title")}</strong>
          <span class="text-faint">${t("cart_empty_sub")}</span>
        </div>`;
      if (foot) foot.style.display = "none";
      return;
    }

    body.innerHTML = items
      .map(
        (item) => `
      <div class="cart-line" data-id="${item.id}">
        <img src="${item.product.img}" alt="">
        <div class="cart-line-info">
          <div class="cart-line-name">${lang === "ar" ? item.product.name_ar : item.product.name_fr}</div>
          <div class="cart-line-price">${fmt(item.product.price)} ${currency()}</div>
          <div class="cart-line-controls">
            <button class="qty-btn" data-action="dec" data-id="${item.id}">−</button>
            <span class="qty-value">${item.qty}</span>
            <button class="qty-btn" data-action="inc" data-id="${item.id}">+</button>
            <button class="cart-line-remove" data-action="remove" data-id="${item.id}" aria-label="إزالة">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
            </button>
          </div>
        </div>
        <div class="cart-line-total">${fmt(item.product.price * item.qty)} ${currency()}</div>
      </div>`
      )
      .join("");

    if (foot) {
      foot.style.display = "block";
      if (subtotalEl) subtotalEl.textContent = `${fmt(getCartSubtotal())} ${currency()}`;
    }

    body.querySelectorAll("[data-action]").forEach((btn) => {
      btn.addEventListener("click", () => {
        const id = btn.getAttribute("data-id");
        const action = btn.getAttribute("data-action");
        const current = cart.find((c) => c.id === id);
        if (action === "inc") updateCartQty(id, (current ? current.qty : 0) + 1);
        else if (action === "dec") updateCartQty(id, (current ? current.qty : 0) - 1);
        else if (action === "remove") removeFromCart(id);
      });
    });
  }

  function openCartDrawer() {
    const drawer = document.getElementById("cartDrawer");
    if (!drawer) return;
    // نحدد اتجاه السلة حسب اللغة الحالية
    if (lang === "ar") {
      drawer.classList.add("drawer-rtl");
    } else {
      drawer.classList.remove("drawer-rtl");
    }
    drawer.classList.add("open");
    document.getElementById("drawerOverlay")?.classList.add("open");
  }
  function closeCartDrawer() {
    document.getElementById("cartDrawer")?.classList.remove("open");
    document.getElementById("drawerOverlay")?.classList.remove("open");
  }

  /* ----------------------------------------------------------------------
     PRODUCT CARD RENDERING
     ---------------------------------------------------------------------- */
  function getActiveOffers() {
    const now = new Date();
    return offersCache.filter((o) => new Date(o.start) <= now && now <= new Date(o.end));
  }

  function offerForProduct(productId, activeOffers) {
    return activeOffers.find((o) => o.productId === productId);
  }

  function productCardHTML(p, activeOffers) {
    const name = lang === "ar" ? p.name_ar : p.name_fr;
    const hasVariants = Array.isArray(p.variants) && p.variants.length > 0;
    const oos = p.stock <= 0;
    const lowStock = !oos && p.stock <= (p.lowStockAt || 5);
    const offer = offerForProduct(p.id, activeOffers);
    const effectivePrice = offer ? Math.round(p.price * (1 - offer.discount / 100)) : p.price;

    let tags = "";
    if (offer) tags += `<span class="tag tag-sale">-${offer.discount}%</span>`;
    else if (p.best) tags += `<span class="tag tag-best">${t("bestsellers_short")}</span>`;
    if (p.isNew) tags += `<span class="tag tag-new">${t("new_short")}</span>`;
    // لا نعرض عدد الأذواق على بطاقة المنتج

    return `
    <div class="product-card" data-product-id="${p.id}">
      <div class="product-media">
        <div class="product-tags">${tags}</div>
        <img src="${p.img}" alt="${name}" loading="lazy">
        ${oos ? `<div class="product-oos"><span>${t("out_of_stock")}</span></div>` : ""}
        <button class="product-quick" data-action="quickview" data-id="${p.id}">${t("quick_view")}</button>
      </div>
      <div class="product-body">
        <div class="product-brand">${p.brand}</div>
        <div class="product-name">${name}</div>
        <div class="product-price-row">
          <span class="product-price">${fmt(effectivePrice)} <small>${currency()}</small></span>
          ${offer || p.oldPrice ? `<span class="product-price-old">${fmt(p.oldPrice || p.price)}</span>` : ""}
        </div>
        ${lowStock && !hasVariants ? `<div class="product-stock-low">${t("low_stock")}</div>` : ""}
        ${hasVariants
          ? `<button class="product-add" data-action="choose-variant" data-id="${p.id}">
               <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="16"/><line x1="8" y1="12" x2="16" y2="12"/></svg>
               ${lang === "ar" ? "اختر الذوق" : "Choisir le goût"}
             </button>`
          : `<button class="product-add" data-action="add" data-id="${p.id}" ${oos ? "disabled" : ""}>
               <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
               ${t("add_to_cart")}
             </button>`
        }
      </div>
    </div>`;
  }

  function bindProductCardEvents(container) {
    container.querySelectorAll('[data-action="add"]').forEach((btn) => {
      btn.addEventListener("click", () => addToCart(btn.getAttribute("data-id"), 1));
    });
    // لو المنتج عنده أذواق، يوديه لصفحة المنتج عشان يختار
    container.querySelectorAll('[data-action="choose-variant"]').forEach((btn) => {
      btn.addEventListener("click", () => {
        window.location.href = "product.html?id=" + btn.getAttribute("data-id");
      });
    });
    container.querySelectorAll('[data-action="quickview"]').forEach((btn) => {
      btn.addEventListener("click", () => {
        window.location.href = "product.html?id=" + btn.getAttribute("data-id");
      });
    });
    container.querySelectorAll(".product-name, .product-media img").forEach((el) => {
      el.style.cursor = "pointer";
      el.addEventListener("click", (e) => {
        const card = el.closest(".product-card");
        if (card) window.location.href = "product.html?id=" + card.getAttribute("data-product-id");
      });
    });
  }

  function renderGrid(containerId, products) {
    const el = document.getElementById(containerId);
    if (!el) return;
    const activeOffers = getActiveOffers();
    if (products.length === 0) {
      el.innerHTML = `<p class="text-faint" style="grid-column:1/-1;text-align:center;padding:40px 0;">—</p>`;
      return;
    }
    el.innerHTML = products.map((p) => productCardHTML(p, activeOffers)).join("");
    bindProductCardEvents(el);
  }

  /* ----------------------------------------------------------------------
     OFFERS BANNER (homepage)
     ---------------------------------------------------------------------- */
  function renderOffersBanner() {
    const el = document.getElementById("offersGrid");
    if (!el) return;
    const activeOffers = getActiveOffers();
    if (activeOffers.length === 0) {
      el.closest("section").style.display = "none";
      return;
    }
    el.innerHTML = activeOffers.map((o) => offerCardHTML(o)).join("");

    // ربط أزرار "أضف للسلة" للباقات
    el.querySelectorAll("[data-bundle-offer]").forEach((btn) => {
      btn.addEventListener("click", () => {
        const offerId = btn.getAttribute("data-bundle-offer");
        const offer = activeOffers.find((o) => o.id === offerId);
        if (!offer || !offer.bundleProducts) return;
        // نضيف الباقة كعنصر واحد في السلة بسعر الباقة الإجمالي
        addBundleToCart(offer);
      });
    });

    // ربط أزرار "أضف للسلة" للعروض العادية
    el.querySelectorAll("[data-offer-product]").forEach((btn) => {
      btn.addEventListener("click", () => {
        addToCart(btn.getAttribute("data-offer-product"), 1);
      });
    });
  }

  function offerCardHTML(o) {
    const isBundle = o.type === "bundle";
    const defaultImg = (settingsCache && settingsCache.offerBannerImage) || "";

    if (isBundle) {
      // حساب السعر الأصلي الإجمالي للباقة
      const originalTotal = (o.bundleProducts || []).reduce((sum, item) => {
        const prod = productsCache.find((p) => p.id === item.productId);
        return sum + (prod ? prod.price * (item.qty || 1) : 0);
      }, 0);
      const savings = originalTotal > 0 ? originalTotal - o.bundlePrice : 0;
      const savingsPct = originalTotal > 0 ? Math.round((savings / originalTotal) * 100) : 0;
      const imgUrl = o.img || defaultImg;
      const productNames = (o.bundleProducts || [])
        .map((item) => {
          const prod = productsCache.find((p) => p.id === item.productId);
          return prod ? (lang === "ar" ? prod.name_ar : prod.name_fr) : "";
        })
        .filter(Boolean)
        .join(" + ");

      return `
      <div class="offer-card offer-card-bundle">
        <img src="${imgUrl}" alt="">
        <div class="offer-content">
          <span class="offer-discount">${savings > 0 ? `-${savingsPct}%` : (lang === "fr" ? "Pack" : "باقة")}</span>
          <span class="bundle-badge">${lang === "fr" ? "Pack" : lang === "fr" ? "Pack" : "باقة تجميعية"}</span>
          <h3>${lang === "ar" ? o.title_ar : o.title_fr}</h3>
          <p class="bundle-products-line">${productNames}</p>
          <div class="bundle-price-row">
            <span class="bundle-price">${fmt(o.bundlePrice)} ${currency()}</span>
            ${originalTotal > 0 ? `<span class="bundle-original">${fmt(originalTotal)}</span>` : ""}
          </div>
          <div class="offer-end">${t("offer_ends")} ${new Date(o.end).toLocaleDateString()}</div>
          <button class="btn btn-primary btn-sm" data-bundle-offer="${o.id}" style="margin-top:12px;width:100%;">
            + ${lang === "ar" ? "أضف الباقة للسلة" : "Ajouter le pack au panier"}
          </button>
        </div>
      </div>`;
    }

    // عرض عادي
    const prod = productsCache.find((p) => p.id === o.productId);
    if (!prod) return "";
    return `
    <div class="offer-card">
      <img src="${o.img || prod.img || defaultImg}" alt="">
      <div class="offer-content">
        <span class="offer-discount">-${o.discount}%</span>
        <h3>${lang === "ar" ? o.title_ar : o.title_fr}</h3>
        <p>${lang === "ar" ? prod.name_ar : prod.name_fr}</p>
        <div class="offer-end">${t("offer_ends")} ${new Date(o.end).toLocaleDateString()}</div>
        <button class="btn btn-primary btn-sm" data-offer-product="${prod.id}" style="margin-top:12px;width:100%;">
          + ${lang === "ar" ? "أضف للسلة" : "Ajouter au panier"}
        </button>
      </div>
    </div>`;
  }

  /* ----------------------------------------------------------------------
     HOMEPAGE SECTIONS
     ---------------------------------------------------------------------- */
  function renderHomepage() {
    const products = productsCache;
    const bestsellers = products.filter((p) => p.best).slice(0, 4);
    const newest = [...products]
      .filter((p) => p.isNew)
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
      .slice(0, 4);
    renderGrid("bestsellersGrid", bestsellers);
    renderGrid("newArrivalsGrid", newest);
    renderOffersBanner();
  }

  /* ----------------------------------------------------------------------
     SEARCH SUGGESTIONS (تعمل في كل الصفحات)
     ---------------------------------------------------------------------- */
  function normalizeText(str) {
    if (!str) return "";
    return str.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
  }

  function buildSuggestBox(inputEl) {
    let box = document.getElementById("headerSuggestBox");
    if (box) return box;
    box = document.createElement("div");
    box.id = "headerSuggestBox";
    box.style.cssText = [
      "position:absolute", "top:calc(100% + 6px)", "inset-inline-start:0",
      "width:320px", "max-width:90vw",
      "background:#fff", "border:1px solid #DDE1E7",
      "border-radius:12px", "box-shadow:0 8px 28px rgba(0,0,0,0.14)",
      "z-index:500", "overflow:hidden", "display:none",
    ].join(";");
    const wrapper = inputEl.closest("div") || inputEl.parentNode;
    if (wrapper) {
      wrapper.style.position = "relative";
      wrapper.appendChild(box);
    }
    return box;
  }

  function showSuggestions(inputEl, query) {
    const box = buildSuggestBox(inputEl);
    if (!query) { box.style.display = "none"; return; }

    const q = normalizeText(query);
    const results = productsCache.filter((p) =>
      normalizeText(p.name_ar).includes(q) ||
      normalizeText(p.name_fr).includes(q) ||
      normalizeText(p.brand).includes(q) ||
      normalizeText(p.cat).includes(q)
    ).slice(0, 7);

    if (results.length === 0) { box.style.display = "none"; return; }

    const isAr = lang === "ar";
    box.innerHTML = results.map((p) => `
      <div data-sid="${p.id}" style="
        display:flex;align-items:center;gap:10px;
        padding:10px 14px;cursor:pointer;
        border-bottom:1px solid #EEF0F3;
      ">
        <img src="${p.img}" alt="" style="width:38px;height:38px;object-fit:cover;border-radius:7px;background:#F4F7FB;flex-shrink:0;">
        <div style="flex:1;min-width:0;">
          <div style="font-size:13.5px;font-weight:700;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">
            ${isAr ? p.name_ar : p.name_fr}
          </div>
          <div style="font-size:11.5px;color:#8995A6;">${p.brand}</div>
        </div>
        <div style="font-size:13px;font-weight:800;white-space:nowrap;color:#0A1F3D;">
          ${fmt(p.price)} <span style="font-size:10px;font-weight:700;color:#8995A6;">${currency()}</span>
        </div>
      </div>`).join("") +
      `<div data-search-all style="
        padding:11px 14px;text-align:center;
        font-size:13px;font-weight:700;color:#1E5BFF;
        cursor:pointer;background:#F4F7FB;
      ">عرض كل النتائج</div>`;

    box.querySelectorAll("[data-sid]").forEach((el) => {
      el.addEventListener("mouseenter", () => el.style.background = "#F4F7FB");
      el.addEventListener("mouseleave", () => el.style.background = "");

      const goToProduct = (e) => {
        e.preventDefault();
        window.location.href = "product.html?id=" + el.getAttribute("data-sid");
      };
      el.addEventListener("click", goToProduct);
      el.addEventListener("touchend", goToProduct, { passive: false });
    });

    const allBtn = box.querySelector("[data-search-all]");
    if (allBtn) {
      const goToAll = (e) => {
        e.preventDefault();
        window.location.href = "shop.html?q=" + encodeURIComponent(query);
      };
      allBtn.addEventListener("click", goToAll);
      allBtn.addEventListener("touchend", goToAll, { passive: false });
    }

    box.style.display = "block";
  }

  function hideSuggestions() {
    const box = document.getElementById("headerSuggestBox");
    if (box) box.style.display = "none";
  }

  /* ----------------------------------------------------------------------
     GLOBAL EVENT WIRING
     ---------------------------------------------------------------------- */
  function wireGlobalUI() {
    document.getElementById("cartTrigger")?.addEventListener("click", openCartDrawer);
    document.getElementById("closeDrawer")?.addEventListener("click", closeCartDrawer);
    document.getElementById("drawerOverlay")?.addEventListener("click", closeCartDrawer);
    document.getElementById("langSwitch")?.addEventListener("click", toggleLang);

    document.getElementById("mobileMenuToggle")?.addEventListener("click", () => {
      document.getElementById("mobileNav")?.classList.toggle("open");
    });

    // ربط خانات البحث (ديسكتوب + موبايل)
    const searchInputs = [
      document.getElementById("headerSearch"),
      document.getElementById("mobileSearch"),
    ].filter(Boolean);

    searchInputs.forEach((inp) => {
      const onInput = () => showSuggestions(inp, inp.value.trim());
      inp.addEventListener("input", onInput);
      inp.addEventListener("compositionend", onInput);
      inp.addEventListener("keyup", onInput);

      inp.addEventListener("keydown", (e) => {
        if (e.key === "Enter" && inp.value.trim()) {
          hideSuggestions();
          window.location.href = "shop.html?q=" + encodeURIComponent(inp.value.trim());
        }
        if (e.key === "Escape") hideSuggestions();
      });

      // موبايل: Enter على كيبورد الموبايل (Go/Search button)
      inp.setAttribute("enterkeyhint", "search");
    });

    // إغلاق الاقتراحات — نستخدم touchstart مع click للموبايل
    document.addEventListener("click", (e) => {
      if (!e.target.closest("#headerSuggestBox") && e.target.id !== "headerSearch") {
        hideSuggestions();
      }
    });
    document.addEventListener("touchstart", (e) => {
      if (!e.target.closest("#headerSuggestBox") && e.target.id !== "headerSearch") {
        hideSuggestions();
      }
    }, { passive: true });
  }

  function renderAll() {
    renderCartDrawer();
    if (document.getElementById("bestsellersGrid")) renderHomepage();
    // صفحة العروض المستقلة
    if (document.getElementById("offersGrid") && !document.getElementById("bestsellersGrid")) {
      renderOffersPage();
    }
  }

  function renderOffersPage() {
    const activeOffers = getActiveOffers();
    const grid = document.getElementById("offersGrid");
    const noOffers = document.getElementById("noOffersNote");
    if (!grid) return;

    if (activeOffers.length === 0) {
      grid.style.display = "none";
      if (noOffers) noOffers.style.display = "block";
      return;
    }

    grid.style.display = "";
    if (noOffers) noOffers.style.display = "none";
    grid.innerHTML = activeOffers.map((o) => offerCardHTML(o)).join("");

    grid.querySelectorAll("[data-bundle-offer]").forEach((btn) => {
      btn.addEventListener("click", () => {
        const offer = activeOffers.find((o) => o.id === btn.getAttribute("data-bundle-offer"));
        if (!offer || !offer.bundleProducts) return;
        addBundleToCart(offer);
      });
    });
    grid.querySelectorAll("[data-offer-product]").forEach((btn) => {
      btn.addEventListener("click", () => addToCart(btn.getAttribute("data-offer-product"), 1));
    });
  }

  /* ----------------------------------------------------------------------
     INIT
     ---------------------------------------------------------------------- */
  document.addEventListener("DOMContentLoaded", async () => {
    applyLang(); // تطبيق اللغة فوراً على العناصر الموجودة
    wireGlobalUI();
    await refreshDataCache();
    renderAll();
    applyLang(); // تطبيق مرة ثانية بعد تحميل البيانات عشان العناصر الديناميكية تتترجم
    // إشارة لباقي السكريبتات (shop.js, product.js, checkout.js) إن البيانات بقت جاهزة
    document.dispatchEvent(new CustomEvent("forgeline:ready"));
  });

  // expose a few things other page-specific scripts (shop.js, product.js, checkout.js) need
  window.ForgeLine = {
    get lang() { return lang; },
    get products() { return productsCache; },
    get offers() { return offersCache; },
    get categories() { return categoriesCache; },
    refreshDataCache,
    t, fmt,
    addToCart, updateCartQty, removeFromCart,
    getCartItems, getCartCount, getCartSubtotal,
    getActiveOffers, offerForProduct,
    productCardHTML, bindProductCardEvents, renderGrid,
    openCartDrawer, closeCartDrawer, renderCartDrawer,
  };
})();
