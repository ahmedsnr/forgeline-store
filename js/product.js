/* ==========================================================================
   FORGELINE — Product Detail Page Logic
   ========================================================================== */

(function () {
  "use strict";

  let qty = 1;
  let currentProduct = null;

  document.addEventListener("forgeline:ready", init);

  function getQueryParam(name) {
    const params = new URLSearchParams(window.location.search);
    return params.get(name) || "";
  }

  function init() {
    const id = getQueryParam("id");
    const products = window.ForgeLine.products;
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

  function lang() { return window.ForgeLine.lang; }
  function fmt(n) { return Number(n || 0).toLocaleString("en-US"); }

  function getActiveOffer(productId) {
    const now = new Date();
    const offers = window.ForgeLine.offers.filter((o) => new Date(o.start) <= now && now <= new Date(o.end));
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

    // Variants (أذواق / نكهات)
    const variantsContainer = document.getElementById("pdpVariants");
    const hasVariants = Array.isArray(p.variants) && p.variants.length > 0;

    if (variantsContainer) {
      if (hasVariants) {
        variantsContainer.style.display = "block";
        variantsContainer.innerHTML = `
          <div style="font-size:13px; font-weight:800; color:var(--ink-faint); margin-bottom:10px;">
            ${lang() === "ar" ? "اختر الذوق / النكهة" : "Choisir le goût / la saveur"}
          </div>
          <div style="display:flex; flex-wrap:wrap; gap:8px;" id="variantBtns">
            ${p.variants.map((v, i) => `
              <button class="variant-btn ${i === 0 ? "active" : ""}" data-variant-index="${i}"
                ${v.stock <= 0 ? "disabled style=\"opacity:0.4;\"" : ""}
                style="padding:9px 16px; border:2px solid ${i === 0 ? "var(--navy-950)" : "var(--silver-200)"}; border-radius:var(--radius-full); font-size:13px; font-weight:700; background:${i === 0 ? "var(--navy-950)" : "transparent"}; color:${i === 0 ? "var(--white)" : "var(--ink)"}; cursor:${v.stock <= 0 ? "not-allowed" : "pointer"}; transition:all 0.2s; touch-action:manipulation;">
                ${v.name}${v.stock <= 0 ? ` <span style="font-size:10px;">(نفد)</span>` : ""}
              </button>
            `).join("")}
          </div>`;

        // منطق تبديل الأذواق
        let selectedVariantIndex = 0;
        variantsContainer.querySelectorAll(".variant-btn").forEach((btn) => {
          btn.addEventListener("click", () => {
            if (btn.disabled) return;
            selectedVariantIndex = Number(btn.getAttribute("data-variant-index"));
            const selectedVariant = p.variants[selectedVariantIndex];

            // تحديث شكل الأزرار
            variantsContainer.querySelectorAll(".variant-btn").forEach((b, bi) => {
              const active = bi === selectedVariantIndex;
              b.style.borderColor = active ? "var(--navy-950)" : "var(--silver-200)";
              b.style.background = active ? "var(--navy-950)" : "transparent";
              b.style.color = active ? "var(--white)" : "var(--ink)";
            });

            // تحديث المخزون المعروض
            const variantOos = selectedVariant.stock <= 0;
            const variantLow = !variantOos && selectedVariant.stock <= (p.lowStockAt || 5);
            stockEl.className = "pdp-stock " + (variantOos ? "out" : variantLow ? "low" : "in");
            stockEl.innerHTML = `<span class="pdp-stock-dot"></span> ${variantOos ? (window.ForgeLine && window.ForgeLine.lang === "fr" ? "Rupture de stock" : "غير متوفر") : selectedVariant.stock + " " + (window.ForgeLine && window.ForgeLine.lang === "fr" ? "restant(s)" : "متبقي")}`;

            // تحديث زرار الإضافة
            addBtn.disabled = variantOos;
            addBtn.innerHTML = variantOos
            const _isFr = window.ForgeLine && window.ForgeLine.lang === "fr";
            addBtn.innerHTML = variantOos
              ? (_isFr ? "Actuellement indisponible" : "غير متوفر حالياً")
              : '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg> ' + (_isFr ? "Ajouter au panier" : "أضف للسلة");
            addBtn.onclick = () => {
              if (!currentProduct || variantOos) return;
              // نضيف للسلة بـ id مركّب (productId + variantIndex) عشان كل ذوق يكون عنصر منفصل
              const cartId = `${currentProduct.id}__v${selectedVariantIndex}`;
              // نحتاج نضيف variant info للكارت — نستخدم طريقة مختلفة
              window.ForgeLine.addToCartWithVariant(currentProduct.id, qty, {
                index: selectedVariantIndex,
                name: selectedVariant.name,
              });
            };
          });
        });

        // addToCartWithVariant
        if (!window.ForgeLine.addToCartWithVariant) {
          window.ForgeLine.addToCartWithVariant = (productId, qty, variant) => {
            window.ForgeLine.addToCart(productId, qty);
          };
        }

      } else {
        variantsContainer.style.display = "none";
      }
    }

    // Stock
    const stockEl = document.getElementById("pdpStock");
    const oos = p.stock <= 0;
    const low = !oos && p.stock <= (p.lowStockAt || 5);
    stockEl.className = "pdp-stock " + (oos ? "out" : low ? "low" : "in");
    stockEl.innerHTML = `<span class="pdp-stock-dot"></span> ${oos ? window.ForgeLine && window.ForgeLine.lang === "fr" ? "Rupture de stock" : "غير متوفر" : `${p.stock} ${window.ForgeLine && window.ForgeLine.lang === "fr" ? "restant(s)" : "متبقي بالمخزون"}`}`;

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
      addBtn.innerHTML = (_isFr ? "Actuellement indisponible" : "غير متوفر حالياً");
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
