/* ==========================================================================
   FORGELINE — Admin Offers Logic
   ========================================================================== */

(function () {
  "use strict";

  let editingId = null;
  let offersCache = [];
  let productsCache = [];
  let selectedImageFile = null;

  document.addEventListener("DOMContentLoaded", () => {
    AdminAuth.requireLogin();
    setupAdminLogout();
    setupListActions();
    setupFormActions();
    setupImageInput();
    listenToOffers();
    loadProducts();
  });

  /* ----------------------------------------------------------------------
     REAL-TIME OFFERS LISTENER
     ---------------------------------------------------------------------- */
  function listenToOffers() {
    db.collection("offers").onSnapshot(
      (snapshot) => {
        offersCache = snapshot.docs.map((d) => d.data());
        if (document.getElementById("listView").style.display !== "none") renderList();
      },
      (err) => console.error("listenToOffers:", err)
    );
  }

  async function loadProducts() {
    try {
      const snap = await db.collection("products").get();
      productsCache = snap.docs.map((d) => d.data());
      populateProductSelect();
    } catch (e) {
      console.error("loadProducts:", e);
    }
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
     RENDER OFFERS LIST
     ---------------------------------------------------------------------- */
  function renderList() {
    const container = document.getElementById("offersGrid");
    const emptyNote = document.getElementById("offersEmptyNote");

    if (offersCache.length === 0) {
      container.innerHTML = "";
      emptyNote.style.display = "block";
      return;
    }
    emptyNote.style.display = "none";

    container.innerHTML = offersCache.map((o) => offerCardHTML(o)).join("");

    container.querySelectorAll("[data-edit-id]").forEach((btn) => {
      btn.addEventListener("click", () => openEditor(btn.getAttribute("data-edit-id")));
    });
    container.querySelectorAll("[data-delete-id]").forEach((btn) => {
      btn.addEventListener("click", () => deleteOffer(btn.getAttribute("data-delete-id")));
    });
  }

  function offerStatus(o) {
    const now = new Date();
    if (now < new Date(o.start)) return "scheduled";
    if (now > new Date(o.end)) return "expired";
    return "active";
  }

  function offerCardHTML(o) {
    const prod = productsCache.find((p) => p.id === o.productId);
    const status = offerStatus(o);
    const statusLabel = status === "active" ? "فعّال" : status === "expired" ? "منتهي" : "مجدول";
    const statusColor = status === "active" ? "#16A34A" : status === "expired" ? "#94A3B8" : "#B7791F";
    const imgUrl = o.img || (prod ? prod.img : "");

    return `
    <div class="offer-card-admin">
      <div class="offer-card-img">
        ${imgUrl ? `<img src="${imgUrl}" alt="">` : ""}
        <span class="offer-status-badge" style="background:${statusColor};">${statusLabel}</span>
      </div>
      <div class="offer-card-body">
        <div class="offer-card-title">${escapeHTML(o.title_ar || "—")}</div>
        <div class="offer-card-product">${prod ? escapeHTML(prod.name_ar) : "—"}</div>
        <div class="offer-card-discount">-${o.discount}%</div>
        <div class="offer-card-dates">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
          ${o.start} ← ${o.end}
        </div>
        <div style="display:flex; gap:8px;">
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

  function escapeHTML(str) {
    const d = document.createElement("div");
    d.textContent = String(str == null ? "" : str);
    return d.innerHTML;
  }

  /* ----------------------------------------------------------------------
     PRODUCT SELECT
     ---------------------------------------------------------------------- */
  function populateProductSelect() {
    const sel = document.getElementById("fProductId");
    if (!sel) return;
    const currentVal = sel.value;
    // keep first placeholder option
    while (sel.options.length > 1) sel.remove(1);
    productsCache.forEach((p) => {
      const opt = document.createElement("option");
      opt.value = p.id;
      opt.textContent = p.name_ar;
      sel.appendChild(opt);
    });
    if (currentVal) sel.value = currentVal;
  }

  /* ----------------------------------------------------------------------
     IMAGE UPLOAD
     ---------------------------------------------------------------------- */
  function setupImageInput() {
    const input = document.getElementById("fOfferImageFile");
    if (!input) return;
    input.addEventListener("change", () => {
      selectedImageFile = input.files[0] || null;
      const preview = document.getElementById("offerImagePreview");
      if (selectedImageFile && preview) {
        const reader = new FileReader();
        reader.onload = (e) => {
          preview.innerHTML = `<img src="${e.target.result}" alt="" style="width:100%;height:100%;object-fit:cover;">`;
        };
        reader.readAsDataURL(selectedImageFile);
      }
    });
  }

  async function uploadImage(file) {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("upload_preset", CLOUDINARY_UPLOAD_PRESET);
    formData.append("folder", "offers");
    const res = await fetch(
      `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`,
      { method: "POST", body: formData }
    );
    if (!res.ok) throw new Error("فشل رفع صورة العرض");
    const data = await res.json();
    return data.secure_url;
  }

  /* ----------------------------------------------------------------------
     ADD / EDIT / DELETE
     ---------------------------------------------------------------------- */
  function setupListActions() {
    document.getElementById("addOfferBtn").addEventListener("click", () => {
      editingId = null;
      resetForm();
      document.getElementById("editorTitle").textContent = "إنشاء عرض جديد";
      showEditorView();
    });
  }

  function openEditor(offerId) {
    const offer = offersCache.find((o) => o.id === offerId);
    if (!offer) return;
    editingId = offerId;
    fillForm(offer);
    document.getElementById("editorTitle").textContent = "تعديل العرض";
    showEditorView();
  }

  async function deleteOffer(offerId) {
    const offer = offersCache.find((o) => o.id === offerId);
    if (!offer) return;
    if (!window.confirm(`هل أنت متأكد من حذف عرض "${offer.title_ar}"؟`)) return;
    try {
      await db.collection("offers").doc(offerId).delete();
    } catch (e) {
      alert("تعذّر حذف العرض. تأكد من اتصالك بالإنترنت.");
    }
  }

  /* ----------------------------------------------------------------------
     FORM
     ---------------------------------------------------------------------- */
  function fillForm(o) {
    document.getElementById("offerId").value = o.id;
    document.getElementById("fTitleAr").value = o.title_ar || "";
    document.getElementById("fTitleFr").value = o.title_fr || "";
    document.getElementById("fProductId").value = o.productId || "";
    document.getElementById("fDiscount").value = o.discount || "";
    document.getElementById("fStart").value = o.start || "";
    document.getElementById("fEnd").value = o.end || "";
    document.getElementById("fOfferImageCurrentUrl").value = o.img || "";
    selectedImageFile = null;
    document.getElementById("fOfferImageFile").value = "";
    const preview = document.getElementById("offerImagePreview");
    if (preview) {
      preview.innerHTML = o.img
        ? `<img src="${o.img}" alt="" style="width:100%;height:100%;object-fit:cover;">`
        : "";
    }
    hideFormError();
  }

  function resetForm() {
    document.getElementById("offerForm").reset();
    document.getElementById("offerId").value = "";
    document.getElementById("fOfferImageCurrentUrl").value = "";
    selectedImageFile = null;
    const preview = document.getElementById("offerImagePreview");
    if (preview) preview.innerHTML = "";
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

  function setupFormActions() {
    document.getElementById("offerForm").addEventListener("submit", async (e) => {
      e.preventDefault();
      await saveOffer();
    });
    document.getElementById("cancelEditBtn").addEventListener("click", showListView);
    document.getElementById("backToList").addEventListener("click", (e) => {
      e.preventDefault();
      showListView();
    });
  }

  async function saveOffer() {
    const titleAr = document.getElementById("fTitleAr").value.trim();
    const productId = document.getElementById("fProductId").value;
    const discount = Number(document.getElementById("fDiscount").value);
    const start = document.getElementById("fStart").value;
    const end = document.getElementById("fEnd").value;

    if (!titleAr) return showFormError("الرجاء إدخال عنوان العرض بالعربي");
    if (!productId) return showFormError("الرجاء اختيار المنتج");
    if (!discount || discount < 1 || discount > 99) return showFormError("الرجاء إدخال نسبة خصم صحيحة (1-99%)");
    if (!start) return showFormError("الرجاء اختيار تاريخ البداية");
    if (!end) return showFormError("الرجاء اختيار تاريخ النهاية");
    if (new Date(end) <= new Date(start)) return showFormError("تاريخ النهاية لازم يكون بعد تاريخ البداية");

    hideFormError();

    const submitBtn = document.querySelector('#offerForm button[type="submit"]');
    const originalText = submitBtn.textContent;
    submitBtn.disabled = true;

    try {
      let imgUrl = document.getElementById("fOfferImageCurrentUrl").value;
      if (selectedImageFile) {
        submitBtn.textContent = "جاري رفع الصورة...";
        imgUrl = await uploadImage(selectedImageFile);
      }

      const offerData = {
        title_ar: titleAr,
        title_fr: document.getElementById("fTitleFr").value.trim() || titleAr,
        productId,
        discount,
        start,
        end,
        img: imgUrl || "",
      };

      submitBtn.textContent = "جاري الحفظ...";

      if (editingId) {
        await db.collection("offers").doc(editingId).set({ ...offerData, id: editingId });
      } else {
        const newId = "o" + Date.now();
        await db.collection("offers").doc(newId).set({ ...offerData, id: newId });
      }

      showListView();
    } catch (err) {
      console.error("saveOffer:", err);
      showFormError("حدث خطأ أثناء الحفظ. تأكد من اتصالك بالإنترنت وحاول مرة أخرى.");
    } finally {
      submitBtn.disabled = false;
      submitBtn.textContent = originalText;
    }
  }
})();
