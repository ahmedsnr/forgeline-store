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
     CATEGORY RAIL
     ---------------------------------------------------------------------- */
  function setupCategoryRail(initialCat) {
    const rail = document.getElementById("catRail");
    if (!rail) return;
    const pills = rail.querySelectorAll(".cat-pill");
    pills.forEach((pill) => {
      const cat = pill.getAttribute("data-cat");
      if (cat === (initialCat || "all")) pill.classList.add("active");
      else pill.classList.remove("active");

      pill.addEventListener("click", () => {
        state.cat = cat;
        pills.forEach((p) => p.classList.remove("active"));
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
  function applyFilters() {
    let list = window.ForgeLine.products;

    if (state.cat !== "all") list = list.filter((p) => p.cat === state.cat);
    if (state.brands.size > 0) list = list.filter((p) => state.brands.has(p.brand));
    list = list.filter((p) => p.price <= state.maxPrice);

    const headerSearch = document.getElementById("headerSearch");
    const liveQuery = headerSearch ? headerSearch.value.trim() : state.query;
    if (liveQuery) {
      const q = liveQuery.toLowerCase();
      list = list.filter(
        (p) =>
          p.name_ar.toLowerCase().includes(q) ||
          p.name_fr.toLowerCase().includes(q) ||
          p.brand.toLowerCase().includes(q)
      );
    }

    list = [...list];
    if (state.sort === "price_asc") list.sort((a, b) => a.price - b.price);
    else if (state.sort === "price_desc") list.sort((a, b) => b.price - a.price);
    else if (state.sort === "newest") list.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    window.ForgeLine.renderGrid("shopGrid", list);

    const countEl = document.getElementById("resultsCount");
    if (countEl) countEl.textContent = `(${list.length} منتج)`;
  }

  // re-apply filters live as user types in header search
  document.addEventListener("DOMContentLoaded", () => {
    const headerSearch = document.getElementById("headerSearch");
    if (headerSearch) {
      headerSearch.addEventListener("input", () => applyFilters());
    }
  });
})();
