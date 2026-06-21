/* ==========================================================================
   FORGELINE — Product Detail Page Logic
   ========================================================================== */

(function () {
  "use strict";

  let qty = 1;
  let currentProduct = null;

  document.addEventListener("DOMContentLoaded", init);

  function getQueryParam(name) {
    const params = new URLSearchParams(window.location.search);
    return params.get(name) || "";
  }

  function init() {
    const id = getQueryParam("id");
    const products = Store.getProducts();
    currentProduct = products.find((p) => p.id === id);

    if (!currentProduct) {
      document.getElementById("productContent").style.display = "none";
      document.getElementById("productNotFound").style.display = "block";
      return;
    }

    renderProduct(currentProduct);
    setupQtyControls();
    setupAddToCart();
    renderRelated(currentProduct, products);
  }

  function lang() { return window.ForgeLine ? window.ForgeLine.lang : (Store.getLang() || "ar"); }
  function fmt(n) { return Number(n || 0).toLocaleString("en-US"); }

  function getActiveOffer(productId) {
    const now = new Date();
    const offers = Store.getOffers().filter((o) => new Date(o.start) <= now && now <= new Date(o.end));
    return offers.find((o) => o.productId === productId);
  }

  function renderProduct(p) {
    const L = lang();
    const name = L === "ar" ? p.name_ar : p.name_fr;
    const desc = L === "ar" ? p.desc_ar : p.desc_fr;
    const offer = getActiveOffer(p.id);
    const effectivePrice = offer ? Math.round(p.price * (1 - offer.discount / 100)) : p.price;

    document.title = name + " | فورجلاين";
    const breadcrumbName = document.getElementById("breadcrumbName");
    if (breadcrumbName) breadcrumbName.textContent = name;

    // Gallery
    const images = [p.img, ...(p.extraImages || [])].filter(Boolean);
    const mainImage = document.getElementById("mainImage");
    mainImage.src = images[0];
    mainImage.alt = name;

    const thumbsRow = document.getElementById("thumbsRow");
    if (images.length > 1) {
      thumbsRow.innerHTML = images
        .map(
          (img, i) => `
        <button class="pdp-thumb ${i === 0 ? "active" : ""}" data-img-index="${i}">
          <img src="${img}" alt="">
        </button>`
        )
        .join("");
      thumbsRow.querySelectorAll(".pdp-thumb").forEach((thumb) => {
        thumb.addEventListener("click", () => {
          const idx = Number(thumb.getAttribute("data-img-index"));
          mainImage.src = images[idx];
          thumbsRow.querySelectorAll(".pdp-thumb").forEach((t) => t.classList.remove("active"));
          thumb.classList.add("active");
        });
      });
    } else {
      thumbsRow.innerHTML = "";
    }

    // Brand / title
    document.getElementById("pdpBrand").textContent = p.brand;
    document.getElementById("pdpTitle").textContent = name;

    // Price
    document.getElementById("pdpPrice").innerHTML = `${fmt(effectivePrice)} <small style="font-size:14px;font-weight:700;color:var(--ink-faint);">${CURRENCY}</small>`;
    const oldPriceEl = document.getElementById("pdpOldPrice");
    const discountBadge = document.getElementById("pdpDiscountBadge");
    if (offer) {
      oldPriceEl.textContent = fmt(p.oldPrice || p.price) + " " + CURRENCY;
      oldPriceEl.style.display = "inline";
      discountBadge.textContent = "-" + offer.discount + "%";
      discountBadge.style.display = "inline-block";
    } else if (p.oldPrice) {
      oldPriceEl.textContent = fmt(p.oldPrice) + " " + CURRENCY;
      oldPriceEl.style.display = "inline";
      discountBadge.style.display = "none";
    } else {
      oldPriceEl.style.display = "none";
      discountBadge.style.display = "none";
    }

    // Stock
    const stockEl = document.getElementById("pdpStock");
    const oos = p.stock <= 0;
    const low = !oos && p.stock <= (p.lowStockAt || 5);
    stockEl.className = "pdp-stock " + (oos ? "out" : low ? "low" : "in");
    stockEl.innerHTML = `<span class="pdp-stock-dot"></span> ${oos ? "غير متوفر" : `${p.stock} متبقي بالمخزون`}`;

    // Description
    document.getElementById("pdpDesc").textContent = desc || "";

    // Meta
    document.getElementById("pdpCategory").textContent = (CATEGORY_LABELS[p.cat] && CATEGORY_LABELS[p.cat][L]) || p.cat;
    document.getElementById("pdpBrandMeta").textContent = p.brand;

    // Qty + Add button disabled state
    const addBtn = document.getElementById("addToCartBtn");
    const qtyRow = document.getElementById("pdpQtyRow");
    if (oos) {
      addBtn.disabled = true;
      addBtn.innerHTML = "غير متوفر حالياً";
      qtyRow.style.display = "none";
    }
  }

  function setupQtyControls() {
    const minus = document.getElementById("qtyMinus");
    const plus = document.getElementById("qtyPlus");
    const value = document.getElementById("qtyValue");
    if (!minus || !plus || !value) return;

    minus.addEventListener("click", () => {
      qty = Math.max(1, qty - 1);
      value.textContent = qty;
    });
    plus.addEventListener("click", () => {
      const max = currentProduct ? currentProduct.stock : 99;
      qty = Math.min(max, qty + 1);
      value.textContent = qty;
    });
  }

  function setupAddToCart() {
    const btn = document.getElementById("addToCartBtn");
    if (!btn) return;
    btn.addEventListener("click", () => {
      if (!currentProduct || currentProduct.stock <= 0) return;
      window.ForgeLine.addToCart(currentProduct.id, qty);
    });
  }

  function renderRelated(product, allProducts) {
    const related = allProducts.filter((p) => p.cat === product.cat && p.id !== product.id).slice(0, 4);
    if (related.length === 0) return;
    document.getElementById("relatedSection").style.display = "block";
    window.ForgeLine.renderGrid("relatedGrid", related);
  }
})();
