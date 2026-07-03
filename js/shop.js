/* ==========================================================================
   FORGELINE — Shop Page Logic
   فلترة، ترتيب، بحث، فئات — لصفحة shop.html فقط
   ========================================================================== */

(function () {
  "use strict";

  // ننتظر main.js يخلص تحميل البيانات من Firestore قبل ما نشتغل
  document.addEventListener("forgeline:ready", init);

  let state = {
    cat: "all",
    brands: new Set(),
    maxPrice: 30000,
    sort: "default",
    query: "",
  };

  function getQueryParam(name) {
    const params = new URLSearchParams(window.location.search);
    return params.get(name) || "";
  }

  function getAllBrands(products) {
    return [...new Set(products.map((p) => p.brand))].sort();
  }

  function init() {
    const products = window.ForgeLine.products;
    const maxProductPrice = Math.max(...products.map((p) => p.price), 1000);

    // read URL params (?cat=, ?q=)
    const catParam = getQueryParam("cat");
    const qParam = getQueryParam("q");
    if (catParam) state.cat = catParam;
    if (qParam) state.query = qParam;
    state.maxPrice = maxProductPrice;

    renderBrandFilters(products);
    setupCategoryRail(catParam);
    setupPriceRange(maxProductPrice);
    setupSortSelects();
    setupClearFilters();
    setupMobileFilterToggle();

    if (qParam) {
      const headerSearch = document.getElementById("headerSearch");
      if (headerSearch) headerSearch.value = qParam;
    }

    applyFilters();
  }

  /* ----------------------------------------------------------------------
     CATEGORY RAIL (ديناميكي من Firestore)
     ---------------------------------------------------------------------- */
  function setupCategoryRail(initialCat) {
    const rail = document.getElementById("catRail");
    if (!rail) return;

    const categories = window.ForgeLine.categories;
    const lang = window.ForgeLine.lang;

    // ابني الـ pills ديناميكياً من قائمة الفئات
    rail.innerHTML = `
      <button class="cat-pill ${!initialCat || initialCat === "all" ? "active" : ""}" data-cat="all">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/></svg>
        ${lang === "ar" ? "الكل" : "Tout"}
      </button>
      ${categories.map((c) => `
        <button class="cat-pill ${initialCat === c.id ? "active" : ""}" data-cat="${c.id}">
          ${c.icon ? `<span>${c.icon}</span>` : ""}
          ${lang === "ar" ? c.ar : c.fr}
        </button>
      `).join("")}
    `;

    rail.querySelectorAll(".cat-pill").forEach((pill) => {
      pill.addEventListener("click", () => {
        state.cat = pill.getAttribute("data-cat");
        rail.querySelectorAll(".cat-pill").forEach((p) => p.classList.remove("active"));
        pill.classList.add("active");
        applyFilters();
      });
    });
  }

  /* ----------------------------------------------------------------------
     BRAND CHECKBOXES
     ---------------------------------------------------------------------- */
  function renderBrandFilters(products) {
    const container = document.getElementById("brandChecks");
    if (!container) return;
    const brands = getAllBrands(products);
    container.innerHTML = brands
      .map(
        (b, i) => `
      <label class="filter-check">
        <input type="checkbox" value="${b}" data-brand-check>
        ${b}
      </label>`
      )
      .join("");

    container.querySelectorAll("[data-brand-check]").forEach((cb) => {
      cb.addEventListener("change", () => {
        if (cb.checked) state.brands.add(cb.value);
        else state.brands.delete(cb.value);
        applyFilters();
      });
    });
  }

  /* ----------------------------------------------------------------------
     PRICE RANGE SLIDER
     ---------------------------------------------------------------------- */
  function setupPriceRange(maxPrice) {
    const slider = document.getElementById("priceRange");
    const label = document.getElementById("priceRangeLabel");
    if (!slider) return;
    slider.max = maxPrice;
    slider.value = maxPrice;
    state.maxPrice = maxPrice;

    function fmt(n) { return Number(n || 0).toLocaleString("en-US"); }

    function updateLabel() {
      if (label) label.textContent = `0 — ${fmt(slider.value)} ${CURRENCY}`;
    }
    updateLabel();

    slider.addEventListener("input", () => {
      state.maxPrice = Number(slider.value);
      updateLabel();
      applyFilters();
    });
  }

  /* ----------------------------------------------------------------------
     SORT SELECTS (desktop + mobile, kept in sync)
     ---------------------------------------------------------------------- */
  function setupSortSelects() {
    const desktop = document.getElementById("sortSelect");
    const mobile = document.getElementById("sortSelectMobile");
    [desktop, mobile].forEach((sel) => {
      if (!sel) return;
      sel.addEventListener("change", () => {
        state.sort = sel.value;
        if (desktop) desktop.value = sel.value;
        if (mobile) mobile.value = sel.value;
        applyFilters();
      });
    });
  }

  /* ----------------------------------------------------------------------
     CLEAR FILTERS
     ---------------------------------------------------------------------- */
  function setupClearFilters() {
    const link = document.getElementById("clearFilters");
    if (!link) return;
    link.addEventListener("click", (e) => {
      e.preventDefault();
      state.cat = "all";
      state.brands = new Set();
      state.sort = "default";
      state.query = "";

      document.querySelectorAll("#catRail .cat-pill").forEach((p) => {
        p.classList.toggle("active", p.getAttribute("data-cat") === "all");
      });
      document.querySelectorAll("[data-brand-check]").forEach((cb) => (cb.checked = false));
      const slider = document.getElementById("priceRange");
      if (slider) { slider.value = state.maxPrice; }
      const label = document.getElementById("priceRangeLabel");
      if (label) label.textContent = `0 — ${Number(state.maxPrice).toLocaleString("en-US")} ${CURRENCY}`;
      const desktop = document.getElementById("sortSelect");
      const mobile = document.getElementById("sortSelectMobile");
      if (desktop) desktop.value = "default";
      if (mobile) mobile.value = "default";
      const headerSearch = document.getElementById("headerSearch");
      if (headerSearch) headerSearch.value = "";

      applyFilters();
    });
  }

  /* ----------------------------------------------------------------------
     MOBILE FILTER PANEL TOGGLE
     ---------------------------------------------------------------------- */
  function setupMobileFilterToggle() {
    const btn = document.getElementById("mobileFilterToggle");
    const panel = document.getElementById("filtersPanel");
    if (!btn || !panel) return;
    btn.addEventListener("click", () => panel.classList.toggle("open"));
  }

  /* ----------------------------------------------------------------------
     APPLY FILTERS + RENDER
     ---------------------------------------------------------------------- */

  /* تطبيع النص: يشيل الـ accents ويحول لحروف صغيرة عشان البحث يشتغل
     مثلاً: "Créatine" → "creatine"، "BCAA" → "bcaa" */
  function normalizeText(str) {
    if (!str) return "";
    return str
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, ""); // يشيل كل الـ diacritics
  }

  function applyFilters() {
    let list = window.ForgeLine.products;

    if (state.cat !== "all") list = list.filter((p) => p.cat === state.cat);
    if (state.brands.size > 0) list = list.filter((p) => state.brands.has(p.brand));
    list = list.filter((p) => p.price <= state.maxPrice);

    const headerSearch = document.getElementById("headerSearch");
    const liveQuery = (headerSearch ? headerSearch.value.trim() : state.query);
    if (liveQuery) {
      const q = normalizeText(liveQuery);
      list = list.filter((p) => {
        return (
          normalizeText(p.name_ar).includes(q) ||
          normalizeText(p.name_fr).includes(q) ||
          normalizeText(p.brand).includes(q) ||
          normalizeText(p.desc_ar).includes(q) ||
          normalizeText(p.desc_fr).includes(q) ||
          normalizeText(p.cat).includes(q)
        );
      });
    }

    list = [...list];
    if (state.sort === "price_asc") list.sort((a, b) => a.price - b.price);
    else if (state.sort === "price_desc") list.sort((a, b) => b.price - a.price);
    else if (state.sort === "newest") list.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    window.ForgeLine.renderGrid("shopGrid", list);

    const countEl = document.getElementById("resultsCount");
    if (countEl) countEl.textContent = `(${list.length} منتج)`;

    // اقتراحات البحث
    renderSearchSuggestions(liveQuery, list);
  }

  /* ----------------------------------------------------------------------
     SEARCH SUGGESTIONS
     ---------------------------------------------------------------------- */
  function renderSearchSuggestions(query, results) {
    // نضيف قائمة اقتراحات تحت خانة البحث في الهيدر
    let suggestBox = document.getElementById("searchSuggestions");
    if (!suggestBox) {
      const searchInput = document.getElementById("headerSearch");
      if (!searchInput) return;
      suggestBox = document.createElement("div");
      suggestBox.id = "searchSuggestions";
      suggestBox.style.cssText = `
        position:absolute; top:100%; right:0; left:0;
        background:#fff; border:1px solid var(--silver-200);
        border-radius:var(--radius-md); box-shadow:0 8px 24px rgba(0,0,0,0.12);
        z-index:300; max-height:280px; overflow-y:auto;
        margin-top:4px; display:none;
      `;
      const wrapper = searchInput.closest("div");
      if (wrapper) {
        wrapper.style.position = "relative";
        wrapper.appendChild(suggestBox);
      }
    }

    if (!query || results.length === 0) {
      suggestBox.style.display = "none";
      return;
    }

    const topResults = results.slice(0, 6);
    const lang = window.ForgeLine.lang;
    suggestBox.innerHTML = topResults.map((p) => `
      <div data-suggest-id="${p.id}" style="
        display:flex; align-items:center; gap:10px;
        padding:10px 14px; cursor:pointer;
        border-bottom:1px solid var(--silver-100);
        transition:background 0.15s;
      " onmouseover="this.style.background='var(--navy-50)'"
         onmouseout="this.style.background=''"
      >
        <img src="${p.img}" alt="" style="width:36px;height:36px;object-fit:cover;border-radius:6px;background:var(--navy-50);">
        <div>
          <div style="font-size:13px;font-weight:700;">${lang === "ar" ? p.name_ar : p.name_fr}</div>
          <div style="font-size:11px;color:var(--ink-faint);">${p.brand}</div>
        </div>
        <div style="margin-inline-start:auto;font-size:13px;font-weight:800;">${Number(p.price).toLocaleString()} ${CURRENCY}</div>
      </div>
    `).join("");

    suggestBox.querySelectorAll("[data-suggest-id]").forEach((el) => {
      el.addEventListener("click", () => {
        window.location.href = `product.html?id=${el.getAttribute("data-suggest-id")}`;
      });
    });

    suggestBox.style.display = "block";
  }

  // إغلاق الاقتراحات لما المستخدم يضغط خارجها
  document.addEventListener("click", (e) => {
    const box = document.getElementById("searchSuggestions");
    if (box && !box.contains(e.target) && e.target.id !== "headerSearch") {
      box.style.display = "none";
    }
  });

  // re-apply filters live as user types in header search
  document.addEventListener("DOMContentLoaded", () => {
    const headerSearch = document.getElementById("headerSearch");
    if (headerSearch) {
      headerSearch.addEventListener("input", () => applyFilters());
      headerSearch.addEventListener("focus", () => {
        if (headerSearch.value.trim()) applyFilters();
      });
    }
  });

  // إعادة رسم المنتجات عند تغيير اللغة
  document.addEventListener("forgeline:langchange", () => {
    applyFilters();
    // تحديث عناوين الفئات
    const catRail = document.getElementById("catRail");
    if (catRail && window.applyTranslations) {
      window.applyTranslations(window.ForgeLine.lang);
    }
    // تحديث الـ sort select
    const sortSelect = document.getElementById("sortSelect");
    const sortMobile = document.getElementById("sortSelectMobile");
    const isFr = window.ForgeLine.lang === "fr";
    const sortOptions = [
      { value: "default", ar: "ترتيب: الأكثر صلة", fr: "Trier: Pertinence" },
      { value: "price_asc", ar: "السعر: من الأقل", fr: "Prix croissant" },
      { value: "price_desc", ar: "السعر: من الأعلى", fr: "Prix décroissant" },
      { value: "newest", ar: "الأحدث", fr: "Plus récents" },
    ];
    [sortSelect, sortMobile].forEach(sel => {
      if (!sel) return;
      Array.from(sel.options).forEach(opt => {
        const found = sortOptions.find(o => o.value === opt.value);
        if (found) opt.textContent = isFr ? found.fr : found.ar;
      });
    });
    // تحديث كلمة "فلاتر"
    const filterBtn = document.getElementById("mobileFilterToggle");
    if (filterBtn) {
      const textNode = Array.from(filterBtn.childNodes).find(n => n.nodeType === 3);
      if (textNode) textNode.textContent = isFr ? " Filtres" : " فلاتر";
    }
  });
})();
