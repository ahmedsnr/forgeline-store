/* ==========================================================================
   FORGELINE — Admin Categories Logic
   ========================================================================== */

(function () {
  "use strict";

  let categoriesCache = [];
  let editingId = null;

  document.addEventListener("DOMContentLoaded", async () => {
    AdminAuth.requireLogin();
    setupAdminLogout();
    setupForm();
    await loadCategories();
  });

  /* ---------------------------------------------------------------------- */
  async function loadCategories() {
    categoriesCache = await Store.getCategories();
    renderList();
  }

  function renderList() {
    const container = document.getElementById("catList");
    if (categoriesCache.length === 0) {
      container.innerHTML = `<p class="empty-note">لا توجد فئات بعد</p>`;
      return;
    }
    container.innerHTML = categoriesCache.map((c) => `
      <div class="admin-list-row" data-cat-id="${c.id}">
        <div style="font-size:26px; width:40px; text-align:center; flex-shrink:0;">${c.icon || "📦"}</div>
        <div class="admin-list-info">
          <div class="admin-list-name">${escapeHTML(c.ar)} <span style="color:var(--ink-faint); font-weight:400;">/ ${escapeHTML(c.fr)}</span></div>
          <div class="admin-list-meta" style="direction:ltr; text-align:right;">ID: ${escapeHTML(c.id)}</div>
        </div>
        <button class="icon-action-btn" data-edit="${c.id}" title="تعديل">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
        </button>
        <button class="icon-action-btn danger" data-delete="${c.id}" title="حذف">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
        </button>
      </div>
    `).join("");

    container.querySelectorAll("[data-edit]").forEach((btn) => {
      btn.addEventListener("click", () => openEditor(btn.getAttribute("data-edit")));
    });
    container.querySelectorAll("[data-delete]").forEach((btn) => {
      btn.addEventListener("click", () => deleteCategory(btn.getAttribute("data-delete")));
    });
  }

  function escapeHTML(str) {
    const d = document.createElement("div");
    d.textContent = String(str || "");
    return d.innerHTML;
  }

  /* ---------------------------------------------------------------------- */
  function setupForm() {
    document.getElementById("addCatBtn").addEventListener("click", () => {
      editingId = null;
      resetForm();
      document.getElementById("catFormTitle").textContent = "فئة جديدة";
      document.getElementById("catId").removeAttribute("readonly");
      document.getElementById("catForm").style.display = "block";
      document.getElementById("catAr").focus();
    });

    // توليد ID تلقائي من الاسم الفرنسي
    document.getElementById("catFr").addEventListener("input", () => {
      if (editingId) return; // لا تغيّر الـ ID عند التعديل
      const fr = document.getElementById("catFr").value;
      const id = fr.toLowerCase()
        .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "");
      document.getElementById("catId").value = id;
    });

    document.getElementById("saveCatBtn").addEventListener("click", saveCategory);
    document.getElementById("cancelCatBtn").addEventListener("click", hideForm);
  }

  function openEditor(catId) {
    const cat = categoriesCache.find((c) => c.id === catId);
    if (!cat) return;
    editingId = catId;
    document.getElementById("catAr").value = cat.ar || "";
    document.getElementById("catFr").value = cat.fr || "";
    document.getElementById("catId").value = cat.id || "";
    document.getElementById("catId").setAttribute("readonly", true);
    document.getElementById("catIcon").value = cat.icon || "";
    document.getElementById("catFormTitle").textContent = "تعديل الفئة";
    document.getElementById("catForm").style.display = "block";
    hideError();
    document.getElementById("catAr").focus();
  }

  function resetForm() {
    document.getElementById("catAr").value = "";
    document.getElementById("catFr").value = "";
    document.getElementById("catId").value = "";
    document.getElementById("catIcon").value = "";
    hideError();
  }
  function hideForm() {
    document.getElementById("catForm").style.display = "none";
    editingId = null;
    resetForm();
  }
  function showError(msg) {
    const el = document.getElementById("catError");
    el.textContent = msg; el.style.display = "block";
  }
  function hideError() {
    document.getElementById("catError").style.display = "none";
  }

  /* ---------------------------------------------------------------------- */
  async function saveCategory() {
    const ar = document.getElementById("catAr").value.trim();
    const fr = document.getElementById("catFr").value.trim();
    const id = document.getElementById("catId").value.trim().toLowerCase();
    const icon = document.getElementById("catIcon").value.trim();

    if (!ar) return showError("الرجاء إدخال الاسم بالعربي");
    if (!fr) return showError("الرجاء إدخال الاسم بالفرنسي");
    if (!id) return showError("الرجاء إدخال المعرّف (ID)");
    if (!/^[a-z0-9-]+$/.test(id)) return showError("المعرّف يجب أن يحتوي على حروف إنجليزية صغيرة وأرقام وشرطات فقط");
    if (!editingId && categoriesCache.find((c) => c.id === id)) return showError("هذا المعرّف موجود بالفعل، اختر معرّفاً مختلفاً");

    const btn = document.getElementById("saveCatBtn");
    btn.disabled = true;
    btn.textContent = "جاري الحفظ...";

    try {
      const order = editingId
        ? (categoriesCache.find((c) => c.id === editingId)?.order ?? categoriesCache.length)
        : categoriesCache.length;

      await Store.saveCategory({ id, ar, fr, icon, order });
      await loadCategories();
      hideForm();
    } catch (e) {
      console.error(e);
      showError("حدث خطأ أثناء الحفظ. تأكد من اتصالك بالإنترنت.");
    } finally {
      btn.disabled = false;
      btn.textContent = "حفظ الفئة";
    }
  }

  async function deleteCategory(catId) {
    const cat = categoriesCache.find((c) => c.id === catId);
    if (!cat) return;
    if (!window.confirm(`حذف فئة "${cat.ar}"؟\n⚠️ المنتجات المرتبطة بها لن تُحذف، لكنها لن تظهر في الفلتر.`)) return;
    try {
      await Store.deleteCategory(catId);
      await loadCategories();
    } catch (e) {
      alert("تعذّر حذف الفئة.");
    }
  }
})();
