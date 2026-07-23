/* ==========================================================================
   FORGELINE — Admin Products Logic
   ========================================================================== */

(function () {
  "use strict";

  let editingId = null; // null = إضافة جديد، أو id المنتج اللي بنعدّله
  let productsCache = [];
  let selectedImageFile = null;
  let selectedExtraImageFiles = [];
  let variants = []; // [{name, stock}]

  document.addEventListener("DOMContentLoaded", () => {
    AdminAuth.requireLogin();
    setupAdminLogout();
    setupListActions();
    setupFormActions();
    setupImageInputs();
    setupVariants();
    loadCategoriesIntoSelect();
    listenToProducts();
  });

  /* ----------------------------------------------------------------------
     VARIANTS (أذواق / نكهات)
     ---------------------------------------------------------------------- */
  function setupVariants() {
    document.getElementById("addVariantBtn")?.addEventListener("click", () => {
      variants.push({ name: "", stock: 0 });
      renderVariants();
      // Focus على آخر خانة اسم
      const inputs = document.querySelectorAll("[data-variant-name]");
      if (inputs.length) inputs[inputs.length - 1].focus();
    });
  }

  function renderVariants() {
    const container = document.getElementById("variantsList");
    if (!container) return;

    if (variants.length === 0) {
      container.innerHTML = `<p class="text-faint" style="font-size:12.5px;">لا توجد أذواق — المنتج سيُباع بدون اختيار ذوق</p>`;
      return;
    }

    container.innerHTML = variants.map((v, i) => `
      <div style="display:flex; gap:8px; align-items:center; background:var(--navy-50); padding:10px 12px; border-radius:10px;">
        <input type="text" value="${escapeAttr(v.name)}" data-variant-name="${i}"
          placeholder="اسم الذوق (مثال: Vanille)"
          style="flex:1; padding:9px 12px; border:1.5px solid var(--silver-200); border-radius:8px; font-size:13.5px;">
        <input type="number" value="${v.stock || 0}" data-variant-stock="${i}" min="0"
          placeholder="مخزون"
          style="width:80px; padding:9px 10px; border:1.5px solid var(--silver-200); border-radius:8px; font-size:13.5px; text-align:center;">
        <span style="font-size:11px; color:var(--ink-faint); white-space:nowrap;">د.ج مخزون</span>
        <button type="button" data-remove-variant="${i}" class="icon-action-btn danger" title="حذف">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
        </button>
      </div>
    `).join("");

    container.querySelectorAll("[data-variant-name]").forEach((inp) => {
      inp.addEventListener("input", () => {
        variants[Number(inp.getAttribute("data-variant-name"))].name = inp.value;
      });
    });
    container.querySelectorAll("[data-variant-stock]").forEach((inp) => {
      inp.addEventListener("input", () => {
        variants[Number(inp.getAttribute("data-variant-stock"))].stock = Math.max(0, Number(inp.value) || 0);
      });
    });
    container.querySelectorAll("[data-remove-variant]").forEach((btn) => {
      btn.addEventListener("click", () => {
        variants.splice(Number(btn.getAttribute("data-remove-variant")), 1);
        renderVariants();
      });
    });
  }

  function escapeAttr(str) {
    return String(str || "").replace(/"/g, "&quot;");
  }

  async function loadCategoriesIntoSelect(selectedCat) {
    try {
      const categories = await Store.getCategories();
      const sel = document.getElementById("fCategory");
      if (!sel) return;
      sel.innerHTML = `<option value="">اختر فئة...</option>` +
        categories.map((c) => `<option value="${c.id}">${c.ar}</option>`).join("");
      if (selectedCat) {
        sel.value = selectedCat;
        await loadSubcategoriesIntoSelect(selectedCat, "");
      }
    } catch (e) {
      console.error("loadCategoriesIntoSelect:", e);
    }
  }

  async function loadSubcategoriesIntoSelect(catId, selectedSub) {
    const subSel = document.getElementById("fSubcategory");
    if (!subSel) return;
    subSel.innerHTML = `<option value="">بدون فئة فرعية</option>`;
    if (!catId) return;
    try {
      const subs = await Store.getSubcategories(catId);
      subs.forEach(s => {
        const opt = document.createElement("option");
        opt.value = s.id;
        opt.textContent = s.ar;
        subSel.appendChild(opt);
      });
      if (selectedSub) subSel.value = selectedSub;
    } catch (e) {
      console.error("loadSubcategoriesIntoSelect:", e);
    }
  }

  function fmt(n) { return Number(n || 0).toLocaleString("en-US"); }

  /* ----------------------------------------------------------------------
     REAL-TIME PRODUCTS LISTENER
     ---------------------------------------------------------------------- */
  function listenToProducts() {
    db.collection("products").onSnapshot(
      (snapshot) => {
        productsCache = snapshot.docs.map((doc) => doc.data());
        // نحدّث القائمة فقط لو واجهة القائمة هي الظاهرة حالياً
        // (مش وإحنا فاتحين نموذج التعديل، عشان ما نقطعش شغل المالك)
        if (document.getElementById("listView").style.display !== "none") {
          renderList();
        }
      },
      (error) => {
        console.error("listenToProducts failed:", error);
      }
    );
  }

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
    const products = productsCache;
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
    const product = productsCache.find((p) => p.id === productId);
    if (!product) return;
    editingId = productId;
    // نحمّل الفئات أولاً عشان تكون جاهزة قبل fillForm
    loadCategoriesIntoSelect(product.cat).then(() => {
      fillForm(product);
    });
    document.getElementById("editorTitle").textContent = "تعديل المنتج";
    showEditorView();
  }

  async function deleteProduct(productId) {
    const product = productsCache.find((p) => p.id === productId);
    if (!product) return;
    const confirmed = window.confirm(`هل أنت متأكد من حذف "${product.name_ar}"؟ لا يمكن التراجع عن هذا الإجراء.`);
    if (!confirmed) return;
    try {
      await Store.deleteProduct(productId);
      // مفيش داعي لنداء renderList() — الـ listener هيحدّث القائمة تلقائياً
    } catch (e) {
      alert("تعذّر حذف المنتج. تأكد من اتصالك بالإنترنت.");
    }
  }

  /* ----------------------------------------------------------------------
     IMAGE UPLOAD (Firebase Storage)
     ---------------------------------------------------------------------- */
  function setupImageInputs() {
    const mainInput = document.getElementById("fImageFile");
    const extraInput = document.getElementById("fExtraImageFiles");

    if (mainInput) {
      mainInput.addEventListener("change", () => {
        selectedImageFile = mainInput.files[0] || null;
        showImagePreview("mainImagePreview", selectedImageFile, document.getElementById("fImageCurrentUrl").value);
      });
    }
    if (extraInput) {
      extraInput.addEventListener("change", () => {
        selectedExtraImageFiles = Array.from(extraInput.files || []);
        showExtraImagesPreview(selectedExtraImageFiles);
      });
    }
  }

  /* عرض الصور الإضافية الموجودة مع زرار حذف لكل صورة */
  function renderExistingExtraImages(urls) {
    const container = document.getElementById("extraImagesPreview");
    if (!container) return;
    container.innerHTML = urls.map((url, i) => `
      <div style="position:relative;display:inline-block;margin:4px;">
        <img src="${url}" alt="" style="width:72px;height:72px;object-fit:cover;border-radius:8px;display:block;">
        <button type="button" data-del-extra="${i}"
          style="position:absolute;top:-6px;inset-inline-end:-6px;width:20px;height:20px;
                 background:var(--danger);color:#fff;border-radius:50%;font-size:12px;
                 display:flex;align-items:center;justify-content:center;cursor:pointer;border:none;line-height:1;">✕</button>
      </div>
    `).join("");

    // ربط أزرار الحذف
    container.querySelectorAll("[data-del-extra]").forEach((btn) => {
      btn.addEventListener("click", () => {
        const idx = Number(btn.getAttribute("data-del-extra"));
        const currentUrls = document.getElementById("fExtraImagesCurrentUrls").value
          .split(",").map(s => s.trim()).filter(Boolean);
        currentUrls.splice(idx, 1);
        document.getElementById("fExtraImagesCurrentUrls").value = currentUrls.join(",");
        renderExistingExtraImages(currentUrls);
      });
    });
  }

  function showImagePreview(containerId, file, fallbackUrl) {
    const container = document.getElementById(containerId);
    if (!container) return;
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        container.innerHTML = `<img src="${e.target.result}" alt="" style="width:100%;height:100%;object-fit:cover;">`;
      };
      reader.readAsDataURL(file);
    } else if (fallbackUrl) {
      container.innerHTML = `<img src="${fallbackUrl}" alt="" style="width:100%;height:100%;object-fit:cover;">`;
    } else {
      container.innerHTML = "";
    }
  }

  function showExtraImagesPreview(files) {
    const container = document.getElementById("extraImagesPreview");
    if (!container) return;
    if (!files.length) { container.innerHTML = ""; return; }
    container.innerHTML = "";
    files.forEach((file) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = document.createElement("img");
        img.src = e.target.result;
        img.style.cssText = "width:60px;height:60px;object-fit:cover;border-radius:8px;";
        container.appendChild(img);
      };
      reader.readAsDataURL(file);
    });
  }

  /* يرفع ملف صورة واحد لـ Cloudinary ويرجع رابطه النهائي */
  async function uploadImageToStorage(file, pathPrefix) {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("upload_preset", CLOUDINARY_UPLOAD_PRESET);
    formData.append("folder", pathPrefix);

    const response = await fetch(
      `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`,
      { method: "POST", body: formData }
    );

    if (!response.ok) {
      throw new Error("فشل رفع الصورة إلى Cloudinary");
    }

    const data = await response.json();
    return data.secure_url;
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
    document.getElementById("fImageCurrentUrl").value = p.img || "";
    document.getElementById("fExtraImagesCurrentUrls").value = (p.extraImages || []).join(",");
    document.getElementById("fDesc_ar").value = p.desc_ar || "";
    document.getElementById("fDesc_fr").value = p.desc_fr || "";
    document.getElementById("fBest").checked = !!p.best;
    document.getElementById("fNew").checked = !!p.isNew;
    // تحميل الفئة الفرعية
    if (p.cat) {
      loadSubcats(p.cat).then(() => {
        const subSel = document.getElementById("fSubcategory");
        if (subSel && p.subcat) subSel.value = p.subcat;
      });
    }

    // تحميل الأذواق
    variants = Array.isArray(p.variants) ? p.variants.map((v) => ({ ...v })) : [];
    renderVariants();

    selectedImageFile = null;
    selectedExtraImageFiles = [];
    document.getElementById("fImageFile").value = "";
    document.getElementById("fExtraImageFiles").value = "";
    showImagePreview("mainImagePreview", null, p.img || "");
    const extraContainer = document.getElementById("extraImagesPreview");
    if (extraContainer) {
      renderExistingExtraImages(p.extraImages || []);
    }
    hideFormError();
  }

  function resetForm() {
    document.getElementById("productForm").reset();
    document.getElementById("productId").value = "";
    document.getElementById("fImageCurrentUrl").value = "";
    document.getElementById("fExtraImagesCurrentUrls").value = "";
    selectedImageFile = null;
    selectedExtraImageFiles = [];
    variants = [];
    renderVariants();
    const mainPreview = document.getElementById("mainImagePreview");
    if (mainPreview) mainPreview.innerHTML = "";
    const extraPreview = document.getElementById("extraImagesPreview");
    if (extraPreview) extraPreview.innerHTML = "";
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
    document.getElementById("productForm").addEventListener("submit", async (e) => {
      e.preventDefault();
      await saveProduct();
    });
    document.getElementById("cancelEditBtn").addEventListener("click", showListView);
    document.getElementById("backToList").addEventListener("click", (e) => {
      e.preventDefault();
      showListView();
    });
  }

  async function saveProduct() {
    const name_ar = document.getElementById("fName_ar").value.trim();
    const brand = document.getElementById("fBrand").value.trim();
    const price = Number(document.getElementById("fPrice").value);
    const stock = document.getElementById("fStock").value;
    const existingImageUrl = document.getElementById("fImageCurrentUrl").value;

    if (!name_ar) return showFormError("الرجاء إدخال اسم المنتج بالعربي");
    if (!brand) return showFormError("الرجاء إدخال الماركة");
    if (!document.getElementById("fPrice").value || isNaN(price) || price < 0) return showFormError("الرجاء إدخال سعر صحيح");
    if (stock === "" || isNaN(Number(stock)) || Number(stock) < 0) return showFormError("الرجاء إدخال كمية مخزون صحيحة");
    if (!selectedImageFile && !existingImageUrl) return showFormError("الرجاء اختيار صورة رئيسية للمنتج");

    hideFormError();

    const submitBtn = document.querySelector('#productForm button[type="submit"]');
    const originalText = submitBtn.textContent;
    submitBtn.disabled = true;

    try {
      // رفع الصورة الرئيسية لو المالك اختار صورة جديدة
      let imgUrl = existingImageUrl;
      if (selectedImageFile) {
        submitBtn.textContent = "جاري رفع الصورة...";
        imgUrl = await uploadImageToStorage(selectedImageFile, "products");
      }

      // رفع الصور الإضافية لو فيه صور جديدة مختارة، وإلا نحافظ على القديمة
      let extraImages = existingImageUrl
        ? document.getElementById("fExtraImagesCurrentUrls").value.split(",").map((s) => s.trim()).filter(Boolean)
        : [];
      if (selectedExtraImageFiles.length > 0) {
        submitBtn.textContent = "جاري رفع الصور الإضافية...";
        const newExtraUrls = await Promise.all(
          selectedExtraImageFiles.map((file) => uploadImageToStorage(file, "products"))
        );
        // نضيف الصور الجديدة للقديمة بدل ما نستبدلها
        extraImages = [...extraImages, ...newExtraUrls];
      }

      const oldPriceVal = document.getElementById("fOldPrice").value;
      const lowStockVal = document.getElementById("fLowStockAt").value;

      // الأذواق الصحيحة (بدون أذواق فارغة الاسم)
      const validVariants = variants.filter((v) => v.name.trim()).map((v) => ({
        name: v.name.trim(),
        stock: Number(v.stock) || 0,
      }));

      // لو فيه أذواق، نحسب المخزون الكلي منهم تلقائياً
      const totalStock = validVariants.length > 0
        ? validVariants.reduce((sum, v) => sum + v.stock, 0)
        : Number(stock);

      const productData = {
        name_ar,
        name_fr: document.getElementById("fName_fr").value.trim() || name_ar,
        brand,
        cat: document.getElementById("fCategory").value,
        subcat: document.getElementById("fSubcategory")?.value || "",
        price,
        oldPrice: oldPriceVal ? Number(oldPriceVal) : null,
        stock: totalStock,
        lowStockAt: lowStockVal ? Number(lowStockVal) : 5,
        img: imgUrl,
        extraImages,
        variants: validVariants,
        desc_ar: document.getElementById("fDesc_ar").value.trim(),
        desc_fr: document.getElementById("fDesc_fr").value.trim(),
        best: document.getElementById("fBest").checked,
        isNew: document.getElementById("fNew").checked,
      };

      submitBtn.textContent = "جاري الحفظ...";

      if (editingId) {
        const existing = productsCache.find((p) => p.id === editingId);
        await Store.saveProduct({
          ...existing,
          ...productData,
          id: editingId,
          createdAt: existing ? existing.createdAt : new Date().toISOString(),
        });
      } else {
        const newProduct = {
          ...productData,
          id: "p" + Date.now(),
          createdAt: new Date().toISOString(),
        };
        await Store.saveProduct(newProduct);
      }

      showListView();
    } catch (err) {
      console.error("saveProduct failed:", err);
      showFormError("حدث خطأ أثناء الحفظ. تأكد من اتصالك بالإنترنت وحاول مرة أخرى.");
    } finally {
      submitBtn.disabled = false;
      submitBtn.textContent = originalText;
    }
  }
})();
