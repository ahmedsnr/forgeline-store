/* ==========================================================================
   FORGELINE — Admin Offers Logic (عروض عادية + باقات تجميعية)
   ========================================================================== */

(function () {
  "use strict";

  let editingId = null;
  let offersCache = [];
  let productsCache = [];
  let selectedImageFile = null;
  let bundleItems = []; // [{productId, qty}]

  /* ── Product Picker state ── */
  let pickerSelectedId = null;
  let pickerActiveCat  = "الكل";
  let pickerQuery      = "";

  document.addEventListener("DOMContentLoaded", () => {
    AdminAuth.requireLogin();
    setupAdminLogout();
    setupListActions();
    setupFormActions();
    setupImageInput();
    setupOfferTypeToggle();
    setupProductPicker();
    listenToOffers();
    loadProducts();
  });

  /* ---------------------------------------------------------------------- */
  function listenToOffers() {
    db.collection("offers").onSnapshot(
      (snap) => { offersCache = snap.docs.map((d) => d.data()); if (document.getElementById("listView").style.display !== "none") renderList(); },
      (err) => console.error(err)
    );
  }

  async function loadProducts() {
    try {
      const snap = await db.collection("products").get();
      productsCache = snap.docs.map((d) => d.data());
      window._offersProductsCache = productsCache;
      renderPickerCats();
      renderPickerList();
    } catch (e) { console.error(e); }
  }

  /* ---------------------------------------------------------------------- */
  function showListView() {
    document.getElementById("listView").style.display = "block";
    document.getElementById("editorView").style.display = "none";
    renderList();
  }
  function showEditorView() {
    document.getElementById("listView").style.display = "none";
    document.getElementById("editorView").style.display = "block";
  }

  /* ---------------------------------------------------------------------- */
  function renderList() {
    const container = document.getElementById("offersGrid");
    const emptyNote = document.getElementById("offersEmptyNote");
    if (offersCache.length === 0) { container.innerHTML = ""; emptyNote.style.display = "block"; return; }
    emptyNote.style.display = "none";

    container.innerHTML = offersCache.map((o) => offerCardHTML(o)).join("");
    container.querySelectorAll("[data-edit-id]").forEach((btn) =>
      btn.addEventListener("click", () => openEditor(btn.getAttribute("data-edit-id")))
    );
    container.querySelectorAll("[data-delete-id]").forEach((btn) =>
      btn.addEventListener("click", () => deleteOffer(btn.getAttribute("data-delete-id")))
    );
  }

  function offerStatus(o) {
    const now = new Date();
    if (now < new Date(o.start)) return "scheduled";
    if (now > new Date(o.end)) return "expired";
    return "active";
  }

  function offerCardHTML(o) {
    const isBundle = o.type === "bundle";
    const prod = !isBundle ? productsCache.find((p) => p.id === o.productId) : null;
    const status = offerStatus(o);
    const statusLabel = status === "active" ? "فعّال" : status === "expired" ? "منتهي" : "مجدول";
    const statusColor = status === "active" ? "#16A34A" : status === "expired" ? "#94A3B8" : "#B7791F";
    const imgUrl = o.img || (prod ? prod.img : "");
    const typeBadge = isBundle ? `<span style="background:#6366F1;color:#fff;font-size:10px;font-weight:800;padding:3px 8px;border-radius:20px;margin-bottom:4px;display:inline-block;">باقة</span><br>` : "";
    const priceInfo = isBundle
      ? `<div style="font-size:13px;font-weight:800;color:var(--navy-950);">${fmtAdmin(o.bundlePrice)} ${CURRENCY}</div><div style="font-size:11px;color:var(--ink-faint);">${(o.bundleProducts||[]).length} منتجات</div>`
      : `<div style="font-size:13px;font-weight:800;color:var(--danger);">-${o.discount}%</div>`;

    return `
    <div class="offer-card-admin">
      <div class="offer-card-img">
        ${imgUrl ? `<img src="${imgUrl}" alt="">` : ""}
        <span class="offer-status-badge" style="background:${statusColor};">${statusLabel}</span>
      </div>
      <div class="offer-card-body">
        ${typeBadge}
        <div class="offer-card-title">${escapeHTML(o.title_ar || "—")}</div>
        <div class="offer-card-product">${isBundle ? `باقة (${(o.bundleProducts||[]).length} منتج)` : (prod ? escapeHTML(prod.name_ar) : "—")}</div>
        ${priceInfo}
        <div class="offer-card-dates">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
          ${o.start} ← ${o.end}
        </div>
        <div style="display:flex;gap:8px;margin-top:10px;">
          <button class="icon-action-btn" data-edit-id="${o.id}" title="تعديل">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
          </button>
          <button class="icon-action-btn danger" data-delete-id="${o.id}" title="حذف">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
          </button>
        </div>
      </div>
    </div>`;
  }

  function fmtAdmin(n) { return Number(n || 0).toLocaleString("en-US"); }
  function escapeHTML(str) { const d = document.createElement("div"); d.textContent = String(str == null ? "" : str); return d.innerHTML; }

  /* ======================================================================
     PRODUCT PICKER
     ====================================================================== */
  function setupProductPicker() {
    const trigger  = document.getElementById("productPickerTrigger");
    const dropdown = document.getElementById("productPickerDropdown");
    const search   = document.getElementById("pickerSearch");

    if (!trigger) return;

    trigger.addEventListener("click", () => {
      const isOpen = dropdown.classList.contains("open");
      if (isOpen) { closePicker(); } else { openPicker(); }
    });

    // إغلاق عند النقر خارج الـ picker
    document.addEventListener("click", (e) => {
      if (!document.getElementById("productPickerWrap")?.contains(e.target)) {
        closePicker();
      }
    });

    search.addEventListener("input", () => {
      pickerQuery = search.value.trim();
      renderPickerList();
    });
  }

  function openPicker() {
    document.getElementById("productPickerTrigger").classList.add("open");
    document.getElementById("productPickerDropdown").classList.add("open");
    document.getElementById("pickerSearch").focus();
  }

  function closePicker() {
    document.getElementById("productPickerTrigger")?.classList.remove("open");
    document.getElementById("productPickerDropdown")?.classList.remove("open");
  }

  function renderPickerCats() {
    const catsEl = document.getElementById("pickerCats");
    if (!catsEl) return;

    // استخرج الفئات الفريدة من المنتجات
    const cats = ["الكل", ...new Set(productsCache.map(p => p.category || p.cat || "").filter(Boolean))];

    catsEl.innerHTML = cats.map(cat => `
      <button type="button" class="picker-cat-btn ${cat === pickerActiveCat ? "active" : ""}" data-cat="${escapeHTML(cat)}">
        ${escapeHTML(cat)}
      </button>
    `).join("");

    catsEl.querySelectorAll(".picker-cat-btn").forEach(btn => {
      btn.addEventListener("click", () => {
        pickerActiveCat = btn.getAttribute("data-cat");
        renderPickerCats();
        renderPickerList();
      });
    });
  }

  function renderPickerList() {
    const listEl = document.getElementById("pickerList");
    if (!listEl) return;

    let filtered = productsCache;

    // فلتر الفئة
    if (pickerActiveCat !== "الكل") {
      filtered = filtered.filter(p => (p.category || p.cat || "") === pickerActiveCat);
    }

    // فلتر البحث
    if (pickerQuery) {
      const q = pickerQuery.toLowerCase();
      filtered = filtered.filter(p =>
        (p.name_ar || "").toLowerCase().includes(q) ||
        (p.name_fr || "").toLowerCase().includes(q) ||
        (p.brand  || "").toLowerCase().includes(q)
      );
    }

    if (filtered.length === 0) {
      listEl.innerHTML = `<div class="picker-empty">لا توجد منتجات مطابقة</div>`;
      return;
    }

    listEl.innerHTML = filtered.map(p => `
      <div class="picker-item ${p.id === pickerSelectedId ? "selected" : ""}" data-pid="${p.id}">
        <img src="${escapeHTML(p.img || "")}" alt="" onerror="this.style.display='none'">
        <div class="picker-item-info">
          <div class="picker-item-name">${escapeHTML(p.name_ar || p.name_fr || "")}</div>
          <div class="picker-item-brand">${escapeHTML(p.brand || "")}</div>
          <div class="picker-item-price">${Number(p.price).toLocaleString("en-US")} ${CURRENCY}</div>
        </div>
        ${p.id === pickerSelectedId ? `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--navy-950)" stroke-width="2.5"><polyline points="20 6 9 17 4 12"/></svg>` : ""}
      </div>
    `).join("");

    listEl.querySelectorAll(".picker-item").forEach(item => {
      item.addEventListener("click", () => {
        selectProduct(item.getAttribute("data-pid"));
        closePicker();
      });
    });
  }

  function selectProduct(productId) {
    pickerSelectedId = productId;
    document.getElementById("fProductId").value = productId;

    const product = productsCache.find(p => p.id === productId);
    if (!product) return;

    // تحديث الزر
    const trigger = document.getElementById("productPickerTrigger");
    trigger.innerHTML = `
      <img src="${escapeHTML(product.img || "")}" alt="" onerror="this.style.display='none'" style="width:36px;height:36px;border-radius:7px;object-fit:cover;flex-shrink:0;">
      <span style="font-weight:700;">${escapeHTML(product.name_ar || product.name_fr || "")}</span>
      <svg class="picker-arrow" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="6 9 12 15 18 9"/></svg>
    `;

    // معاينة المنتج
    const preview    = document.getElementById("productPreview");
    const img        = document.getElementById("productPreviewImg");
    const nameEl     = document.getElementById("productPreviewName");
    const priceEl    = document.getElementById("productPreviewPrice");
    const discInput  = document.getElementById("fDiscount");

    img.src       = product.img || "";
    nameEl.textContent  = product.name_ar || product.name_fr || "";
    priceEl.textContent = "السعر الأصلي: " + Number(product.price).toLocaleString("en-US") + " د.ج";
    preview.style.display = "flex";

    if (discInput && !discInput.value) discInput.value = product.price;

    discInput.oninput = () => {
      const newPrice = Number(discInput.value);
      const savings  = product.price - newPrice;
      const savingsEl = document.getElementById("regularSavings");
      if (savingsEl) {
        if (savings > 0) {
          savingsEl.innerHTML = `✅ التوفير: <strong>${savings.toLocaleString("en-US")} د.ج</strong>`;
          savingsEl.style.color = "var(--success)";
        } else if (savings < 0) {
          savingsEl.innerHTML = `⚠️ السعر أعلى من الأصلي!`;
          savingsEl.style.color = "var(--danger)";
        } else {
          savingsEl.innerHTML = "لا يوجد خصم";
          savingsEl.style.color = "var(--ink-faint)";
        }
      }
    };

    renderPickerList(); // تحديث العلامة ✓ في القائمة
  }

  function resetPicker() {
    pickerSelectedId = null;
    pickerActiveCat  = "الكل";
    pickerQuery      = "";
    document.getElementById("fProductId").value = "";
    const trigger = document.getElementById("productPickerTrigger");
    if (trigger) {
      trigger.innerHTML = `
        <span class="picker-placeholder" id="pickerLabel">اختر منتجاً...</span>
        <svg class="picker-arrow" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="6 9 12 15 18 9"/></svg>
      `;
    }
    const search = document.getElementById("pickerSearch");
    if (search) search.value = "";
    document.getElementById("productPreview").style.display = "none";
    renderPickerCats();
    renderPickerList();
  }

  /* ---------------------------------------------------------------------- */
  function setupOfferTypeToggle() {
    document.querySelectorAll('input[name="offerType"]').forEach((radio) => {
      radio.addEventListener("change", () => {
        const isBundle = document.getElementById("typeBundle").checked;
        document.getElementById("regularFields").style.display = isBundle ? "none" : "block";
        document.getElementById("bundleFields").style.display = isBundle ? "block" : "none";
        document.getElementById("typeRegularLabel").style.borderColor = isBundle ? "" : "var(--navy-950)";
        document.getElementById("typeBundleLabel").style.borderColor = isBundle ? "var(--navy-950)" : "";
      });
    });

    document.getElementById("fBundlePrice")?.addEventListener("input", updateBundleSavings);
  }

  function updateBundleSavings() {
    const originalTotal = bundleItems.reduce((sum, item) => {
      const prod = productsCache.find((p) => p.id === item.productId);
      return sum + (prod ? prod.price * (item.qty || 1) : 0);
    }, 0);
    const bundlePrice = Number(document.getElementById("fBundlePrice").value) || 0;
    const savings = originalTotal - bundlePrice;
    const pct = originalTotal > 0 ? Math.round((savings / originalTotal) * 100) : 0;
    const el = document.getElementById("bundleSavings");
    if (originalTotal > 0 && bundlePrice > 0) {
      el.innerHTML = savings > 0
        ? `<span style="color:var(--success);font-weight:800;">✓ توفير ${fmtAdmin(savings)} د.ج (-${pct}%)</span><br><span style="font-size:11.5px;">السعر الأصلي: ${fmtAdmin(originalTotal)} د.ج</span>`
        : `<span style="color:var(--danger);font-weight:700;">⚠️ سعر الباقة أعلى من المجموع!</span>`;
    } else {
      el.innerHTML = `<span style="color:var(--ink-faint);">أدخل السعر لحساب التوفير</span>`;
    }
  }

  /* ---------------------------------------------------------------------- */
  function renderBundleItems() {
    const container = document.getElementById("bundleProductsList");
    if (bundleItems.length === 0) {
      container.innerHTML = `<p style="font-size:13px;color:var(--ink-faint);">لم تُضف منتجات بعد</p>`;
      return;
    }
    container.innerHTML = bundleItems.map((item, i) => {
      const prod = productsCache.find((p) => p.id === item.productId);
      return `
      <div style="display:flex;align-items:center;gap:10px;padding:10px;background:var(--navy-50);border-radius:10px;">
        ${prod ? `<img src="${prod.img}" alt="" style="width:40px;height:40px;object-fit:cover;border-radius:7px;flex-shrink:0;">` : `<div style="width:40px;height:40px;background:var(--silver-100);border-radius:7px;flex-shrink:0;"></div>`}
        <select data-bundle-product="${i}" style="flex:1;padding:8px 10px;border:1.5px solid var(--silver-200);border-radius:8px;font-size:13px;">
          <option value="">اختر منتجاً...</option>
          ${productsCache.map((p) => `<option value="${p.id}" ${p.id === item.productId ? "selected" : ""}>${p.name_ar}</option>`).join("")}
        </select>
        <input type="number" min="1" value="${item.qty || 1}" data-bundle-qty="${i}"
          style="width:55px;padding:8px;border:1.5px solid var(--silver-200);border-radius:8px;font-size:13px;font-weight:700;text-align:center;">
        <button type="button" data-remove-bundle="${i}" class="icon-action-btn danger">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
        </button>
      </div>`;
    }).join("");

    container.querySelectorAll("[data-bundle-product]").forEach((sel) => {
      sel.addEventListener("change", () => {
        const idx = Number(sel.getAttribute("data-bundle-product"));
        bundleItems[idx].productId = sel.value;
        updateBundleSavings();
        renderBundleItems();
      });
    });
    container.querySelectorAll("[data-bundle-qty]").forEach((inp) => {
      inp.addEventListener("input", () => {
        const idx = Number(inp.getAttribute("data-bundle-qty"));
        bundleItems[idx].qty = Math.max(1, Number(inp.value) || 1);
        updateBundleSavings();
      });
    });
    container.querySelectorAll("[data-remove-bundle]").forEach((btn) => {
      btn.addEventListener("click", () => {
        bundleItems.splice(Number(btn.getAttribute("data-remove-bundle")), 1);
        updateBundleSavings();
        renderBundleItems();
      });
    });
  }

  /* ---------------------------------------------------------------------- */
  function setupImageInput() {
    document.getElementById("fOfferImageFile")?.addEventListener("change", (e) => {
      selectedImageFile = e.target.files[0] || null;
      const preview = document.getElementById("offerImagePreview");
      if (selectedImageFile && preview) {
        const reader = new FileReader();
        reader.onload = (ev) => { preview.innerHTML = `<img src="${ev.target.result}" alt="" style="width:100%;height:100%;object-fit:cover;">`; };
        reader.readAsDataURL(selectedImageFile);
      }
    });
  }

  async function uploadImage(file) {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("upload_preset", CLOUDINARY_UPLOAD_PRESET);
    formData.append("folder", "offers");
    const res = await fetch(`https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`, { method: "POST", body: formData });
    if (!res.ok) throw new Error("فشل رفع صورة العرض");
    return (await res.json()).secure_url;
  }

  /* ---------------------------------------------------------------------- */
  function setupListActions() {
    document.getElementById("addOfferBtn").addEventListener("click", () => {
      editingId = null; resetForm();
      document.getElementById("editorTitle").textContent = "إنشاء عرض جديد";
      showEditorView();
    });
  }

  function openEditor(offerId) {
    const offer = offersCache.find((o) => o.id === offerId);
    if (!offer) return;
    editingId = offerId;
    fillForm(offer);
    document.getElementById("editorTitle").textContent = offer.type === "bundle" ? "تعديل الباقة" : "تعديل العرض";
    showEditorView();
  }

  async function deleteOffer(offerId) {
    const offer = offersCache.find((o) => o.id === offerId);
    if (!offer || !window.confirm(`هل أنت متأكد من حذف "${offer.title_ar}"؟`)) return;
    try { await db.collection("offers").doc(offerId).delete(); }
    catch (e) { alert("تعذّر حذف العرض."); }
  }

  /* ---------------------------------------------------------------------- */
  function fillForm(o) {
    const isBundle = o.type === "bundle";
    document.getElementById("offerId").value = o.id;
    document.getElementById(isBundle ? "typeBundle" : "typeRegular").checked = true;
    document.getElementById("regularFields").style.display = isBundle ? "none" : "block";
    document.getElementById("bundleFields").style.display = isBundle ? "block" : "none";
    document.getElementById("typeRegularLabel").style.borderColor = isBundle ? "" : "var(--navy-950)";
    document.getElementById("typeBundleLabel").style.borderColor = isBundle ? "var(--navy-950)" : "";

    document.getElementById("fTitleAr").value = o.title_ar || "";
    document.getElementById("fTitleFr").value = o.title_fr || "";
    document.getElementById("fStart").value = o.start || "";
    document.getElementById("fEnd").value = o.end || "";
    document.getElementById("fOfferImageCurrentUrl").value = o.img || "";
    selectedImageFile = null;
    document.getElementById("fOfferImageFile").value = "";
    document.getElementById("offerImagePreview").innerHTML = o.img
      ? `<img src="${o.img}" alt="" style="width:100%;height:100%;object-fit:cover;">` : "";

    if (!isBundle) {
      // تحديد المنتج في الـ picker
      if (o.productId) selectProduct(o.productId);
      document.getElementById("fDiscount").value = o.discount || "";
    } else {
      bundleItems = (o.bundleProducts || []).map((b) => ({ productId: b.productId, qty: b.qty || 1 }));
      document.getElementById("fBundlePrice").value = o.bundlePrice || "";
      renderBundleItems();
      updateBundleSavings();
    }
    hideFormError();
  }

  function resetForm() {
    document.getElementById("offerForm").reset();
    document.getElementById("offerId").value = "";
    document.getElementById("fOfferImageCurrentUrl").value = "";
    document.getElementById("offerImagePreview").innerHTML = "";
    document.getElementById("typeRegular").checked = true;
    document.getElementById("regularFields").style.display = "block";
    document.getElementById("bundleFields").style.display = "none";
    document.getElementById("typeRegularLabel").style.borderColor = "var(--navy-950)";
    document.getElementById("typeBundleLabel").style.borderColor = "";
    bundleItems = [];
    renderBundleItems();
    selectedImageFile = null;
    resetPicker();
    hideFormError();
  }

  function showFormError(msg) { const el = document.getElementById("formError"); el.textContent = msg; el.style.display = "block"; }
  function hideFormError() { document.getElementById("formError").style.display = "none"; }

  /* ---------------------------------------------------------------------- */
  function setupFormActions() {
    document.getElementById("addBundleProductBtn")?.addEventListener("click", () => {
      bundleItems.push({ productId: "", qty: 1 });
      renderBundleItems();
    });
    document.getElementById("offerForm").addEventListener("submit", async (e) => { e.preventDefault(); await saveOffer(); });
    document.getElementById("cancelEditBtn").addEventListener("click", showListView);
    document.getElementById("backToList").addEventListener("click", (e) => { e.preventDefault(); showListView(); });
  }

  async function saveOffer() {
    const isBundle = document.getElementById("typeBundle").checked;
    const titleAr = document.getElementById("fTitleAr").value.trim();
    const start = document.getElementById("fStart").value;
    const end = document.getElementById("fEnd").value;

    if (!titleAr) return showFormError("الرجاء إدخال عنوان العرض بالعربي");
    if (!start) return showFormError("الرجاء اختيار تاريخ البداية");
    if (!end) return showFormError("الرجاء اختيار تاريخ النهاية");
    if (new Date(end) <= new Date(start)) return showFormError("تاريخ النهاية لازم يكون بعد تاريخ البداية");

    if (!isBundle) {
      if (!document.getElementById("fProductId").value) return showFormError("الرجاء اختيار المنتج");
      const disc = Number(document.getElementById("fDiscount").value);
      if (!disc || disc < 0) return showFormError("الرجاء إدخال سعر الخصم");
    } else {
      const validItems = bundleItems.filter((b) => b.productId);
      if (validItems.length < 2) return showFormError("الباقة لازم تحتوي على منتجين أو أكثر");
      if (!document.getElementById("fBundlePrice").value) return showFormError("الرجاء إدخال سعر الباقة");
    }

    hideFormError();
    const submitBtn = document.querySelector('#offerForm button[type="submit"]');
    const originalText = submitBtn.textContent;
    submitBtn.disabled = true;

    try {
      let imgUrl = document.getElementById("fOfferImageCurrentUrl").value;
      if (selectedImageFile) { submitBtn.textContent = "جاري رفع الصورة..."; imgUrl = await uploadImage(selectedImageFile); }
      submitBtn.textContent = "جاري الحفظ...";

      const offerData = {
        title_ar: titleAr,
        title_fr: document.getElementById("fTitleFr").value.trim() || titleAr,
        type: isBundle ? "bundle" : "regular",
        start, end,
        img: imgUrl || "",
      };

      if (!isBundle) {
        offerData.productId = document.getElementById("fProductId").value;
        const discountedPrice = Number(document.getElementById("fDiscount").value);
        offerData.discountedPrice = discountedPrice;
        const prod = window._offersProductsCache?.find(p => p.id === offerData.productId);
        if (prod && prod.price > discountedPrice) {
          offerData.discount = Math.round((1 - discountedPrice / prod.price) * 100);
        } else {
          offerData.discount = 0;
        }
      } else {
        offerData.bundleProducts = bundleItems.filter((b) => b.productId).map((b) => ({ productId: b.productId, qty: b.qty || 1 }));
        offerData.bundlePrice = Number(document.getElementById("fBundlePrice").value);
      }

      const id = editingId || "o" + Date.now();
      await db.collection("offers").doc(id).set({ ...offerData, id });
      showListView();
    } catch (err) {
      console.error(err);
      showFormError("حدث خطأ أثناء الحفظ. تأكد من اتصالك بالإنترنت وحاول مرة أخرى.");
    } finally {
      submitBtn.disabled = false;
      submitBtn.textContent = originalText;
    }
  }
})();
