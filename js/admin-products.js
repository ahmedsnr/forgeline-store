/* ==========================================================================
   FORGELINE — Admin Products Logic
   ========================================================================== */

(function () {
  "use strict";

  let editingId = null; // null = إضافة جديد، أو id المنتج اللي بنعدّله

  document.addEventListener("DOMContentLoaded", () => {
    AdminAuth.requireLogin();
    setupAdminLogout();
    setupListActions();
    setupFormActions();
    renderList();
  });

  function fmt(n) { return Number(n || 0).toLocaleString("en-US"); }

  /* ----------------------------------------------------------------------
     VIEW SWITCHING
     ---------------------------------------------------------------------- */
  function showListView() {
    document.getElementById("listView").style.display = "block";
    document.getElementById("editorView").style.display = "none";
    renderList();
  }
  function showEditorView() {
    document.getElementById("listView").style.display = "none";
    document.getElementById("editorView").style.display = "block";
  }

  /* ----------------------------------------------------------------------
     RENDER PRODUCTS LIST
     ---------------------------------------------------------------------- */
  function renderList() {
    const products = Store.getProducts();
    const container = document.getElementById("productsList");
    const emptyNote = document.getElementById("productsEmptyNote");
    document.getElementById("productsCount").textContent = `${products.length} منتج`;

    if (products.length === 0) {
      container.innerHTML = "";
      emptyNote.style.display = "block";
      return;
    }
    emptyNote.style.display = "none";

    container.innerHTML = products.map((p) => productRowHTML(p)).join("");

    container.querySelectorAll("[data-edit-id]").forEach((btn) => {
      btn.addEventListener("click", () => openEditor(btn.getAttribute("data-edit-id")));
    });
    container.querySelectorAll("[data-delete-id]").forEach((btn) => {
      btn.addEventListener("click", () => deleteProduct(btn.getAttribute("data-delete-id")));
    });
  }

  function productRowHTML(p) {
    const oos = p.stock <= 0;
    const low = !oos && p.stock <= (p.lowStockAt || 5);
    const stockClass = oos ? "stock-out" : low ? "stock-low" : "";

    return `
    <div class="admin-list-row">
      <img src="${p.img}" alt="">
      <div class="admin-list-info">
        <div class="admin-list-name">${escapeHTML(p.name_ar)}</div>
        <div class="admin-list-meta">
          ${escapeHTML(p.brand)} · ${fmt(p.price)} ${CURRENCY} ·
          المخزون: <span class="${stockClass}">${p.stock}</span>
        </div>
      </div>
      <button class="icon-action-btn" data-edit-id="${p.id}" aria-label="تعديل" title="تعديل">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
      </button>
      <button class="icon-action-btn danger" data-delete-id="${p.id}" aria-label="حذف" title="حذف">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
      </button>
    </div>`;
  }

  function escapeHTML(str) {
    const div = document.createElement("div");
    div.textContent = String(str == null ? "" : str);
    return div.innerHTML;
  }

  /* ----------------------------------------------------------------------
     ADD / EDIT / DELETE ACTIONS
     ---------------------------------------------------------------------- */
  function setupListActions() {
    document.getElementById("addProductBtn").addEventListener("click", () => {
      editingId = null;
      resetForm();
      document.getElementById("editorTitle").textContent = "إضافة منتج جديد";
      showEditorView();
    });
  }

  function openEditor(productId) {
    const products = Store.getProducts();
    const product = products.find((p) => p.id === productId);
    if (!product) return;

    editingId = productId;
    fillForm(product);
    document.getElementById("editorTitle").textContent = "تعديل المنتج";
    showEditorView();
  }

  function deleteProduct(productId) {
    const products = Store.getProducts();
    const product = products.find((p) => p.id === productId);
    if (!product) return;
    const confirmed = window.confirm(`هل أنت متأكد من حذف "${product.name_ar}"؟ لا يمكن التراجع عن هذا الإجراء.`);
    if (!confirmed) return;
    const updated = products.filter((p) => p.id !== productId);
    Store.saveProducts(updated);
    renderList();
  }

  /* ----------------------------------------------------------------------
     FORM: FILL / RESET
     ---------------------------------------------------------------------- */
  function fillForm(p) {
    document.getElementById("productId").value = p.id;
    document.getElementById("fName_ar").value = p.name_ar || "";
    document.getElementById("fName_fr").value = p.name_fr || "";
    document.getElementById("fBrand").value = p.brand || "";
    document.getElementById("fCategory").value = p.cat || "protein";
    document.getElementById("fPrice").value = p.price || "";
    document.getElementById("fOldPrice").value = p.oldPrice || "";
    document.getElementById("fStock").value = p.stock != null ? p.stock : "";
    document.getElementById("fLowStockAt").value = p.lowStockAt || "";
    document.getElementById("fImage").value = p.img || "";
    document.getElementById("fExtraImages").value = (p.extraImages || []).join(", ");
    document.getElementById("fDesc_ar").value = p.desc_ar || "";
    document.getElementById("fDesc_fr").value = p.desc_fr || "";
    document.getElementById("fBest").checked = !!p.best;
    document.getElementById("fNew").checked = !!p.isNew;
    hideFormError();
  }

  function resetForm() {
    document.getElementById("productForm").reset();
    document.getElementById("productId").value = "";
    hideFormError();
  }

  function showFormError(msg) {
    const el = document.getElementById("formError");
    el.textContent = msg;
    el.style.display = "block";
  }
  function hideFormError() {
    document.getElementById("formError").style.display = "none";
  }

  /* ----------------------------------------------------------------------
     FORM: SUBMIT / CANCEL
     ---------------------------------------------------------------------- */
  function setupFormActions() {
    document.getElementById("productForm").addEventListener("submit", (e) => {
      e.preventDefault();
      saveProduct();
    });
    document.getElementById("cancelEditBtn").addEventListener("click", showListView);
    document.getElementById("backToList").addEventListener("click", (e) => {
      e.preventDefault();
      showListView();
    });
  }

  function saveProduct() {
    const name_ar = document.getElementById("fName_ar").value.trim();
    const brand = document.getElementById("fBrand").value.trim();
    const price = Number(document.getElementById("fPrice").value);
    const stock = document.getElementById("fStock").value;
    const img = document.getElementById("fImage").value.trim();

    if (!name_ar) return showFormError("الرجاء إدخال اسم المنتج بالعربي");
    if (!brand) return showFormError("الرجاء إدخال الماركة");
    if (!document.getElementById("fPrice").value || isNaN(price) || price < 0) return showFormError("الرجاء إدخال سعر صحيح");
    if (stock === "" || isNaN(Number(stock)) || Number(stock) < 0) return showFormError("الرجاء إدخال كمية مخزون صحيحة");
    if (!img) return showFormError("الرجاء إدخال رابط صورة المنتج");

    hideFormError();

    const extraImagesRaw = document.getElementById("fExtraImages").value.trim();
    const extraImages = extraImagesRaw ? extraImagesRaw.split(",").map((s) => s.trim()).filter(Boolean) : [];

    const oldPriceVal = document.getElementById("fOldPrice").value;
    const lowStockVal = document.getElementById("fLowStockAt").value;

    const productData = {
      name_ar,
      name_fr: document.getElementById("fName_fr").value.trim() || name_ar,
      brand,
      cat: document.getElementById("fCategory").value,
      price,
      oldPrice: oldPriceVal ? Number(oldPriceVal) : undefined,
      stock: Number(stock),
      lowStockAt: lowStockVal ? Number(lowStockVal) : 5,
      img,
      extraImages,
      desc_ar: document.getElementById("fDesc_ar").value.trim(),
      desc_fr: document.getElementById("fDesc_fr").value.trim(),
      best: document.getElementById("fBest").checked,
      isNew: document.getElementById("fNew").checked,
    };

    const products = Store.getProducts();

    if (editingId) {
      // تعديل منتج موجود — نحافظ على id و createdAt الأصليين
      const existing = products.find((p) => p.id === editingId);
      const updated = products.map((p) =>
        p.id === editingId ? { ...p, ...productData, id: editingId, createdAt: existing.createdAt } : p
      );
      Store.saveProducts(updated);
    } else {
      // منتج جديد
      const newProduct = {
        ...productData,
        id: "p" + Date.now(),
        createdAt: new Date().toISOString(),
      };
      Store.saveProducts([newProduct, ...products]);
    }

    showListView();
  }
})();
