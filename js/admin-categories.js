/* ==========================================================================
   FORGELINE — Admin Categories Logic (مع الفئات الفرعية)
   ========================================================================== */

(function () {
  "use strict";

  let categoriesCache = [];
  let editingCatId = null;
  let editingSubId = null;
  let currentParentId = null; // الفئة الرئيسية المفتوحة حالياً لإدارة فئاتها الفرعية

  document.addEventListener("DOMContentLoaded", async () => {
    AdminAuth.requireLogin();
    setupAdminLogout();
    setupCatForm();
    setupSubForm();
    await loadCategories();
  });

  /* ---------------------------------------------------------------------- */
  async function loadCategories() {
    categoriesCache = await Store.getCategories();
    renderCatList();
  }

  /* ---------------------------------------------------------------------- */
  function renderCatList() {
    const container = document.getElementById("catList");
    if (categoriesCache.length === 0) {
      container.innerHTML = `<p class="empty-note">لا توجد فئات بعد</p>`;
      return;
    }
    container.innerHTML = categoriesCache.map((c) => `
      <div class="admin-list-row" data-cat-id="${c.id}">
        <div style="font-size:26px;width:40px;text-align:center;flex-shrink:0;">${c.icon || "📦"}</div>
        <div class="admin-list-info">
          <div class="admin-list-name">${escapeHTML(c.ar)} <span style="color:var(--ink-faint);font-weight:400;">/ ${escapeHTML(c.fr)}</span></div>
          <div class="admin-list-meta" style="direction:ltr;">ID: ${escapeHTML(c.id)}</div>
        </div>
        <button class="icon-action-btn" data-manage-subs="${c.id}" title="إدارة الفئات الفرعية" style="color:#6366F1;">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="9" y1="18" x2="15" y2="12"/><line x1="9" y1="6" x2="15" y2="12"/></svg>
        </button>
        <button class="icon-action-btn" data-edit-cat="${c.id}" title="تعديل">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
        </button>
        <button class="icon-action-btn danger" data-delete-cat="${c.id}" title="حذف">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
        </button>
      </div>
    `).join("");

    container.querySelectorAll("[data-manage-subs]").forEach(btn =>
      btn.addEventListener("click", () => openSubsManager(btn.getAttribute("data-manage-subs")))
    );
    container.querySelectorAll("[data-edit-cat]").forEach(btn =>
      btn.addEventListener("click", () => openCatEditor(btn.getAttribute("data-edit-cat")))
    );
    container.querySelectorAll("[data-delete-cat]").forEach(btn =>
      btn.addEventListener("click", () => deleteCat(btn.getAttribute("data-delete-cat")))
    );
  }

  /* ---------------------------------------------------------------------- */
  /* SUBCATEGORIES MANAGER */
  async function openSubsManager(catId) {
    currentParentId = catId;
    const cat = categoriesCache.find(c => c.id === catId);
    document.getElementById("subsManagerTitle").textContent = `الفئات الفرعية لـ "${cat ? cat.ar : catId}"`;
    document.getElementById("subsManager").style.display = "block";
    document.getElementById("catList").style.display = "none";
    document.getElementById("addCatBtn").style.display = "none";
    await loadSubs(catId);
  }

  function closeSubsManager() {
    currentParentId = null;
    document.getElementById("subsManager").style.display = "none";
    document.getElementById("catList").style.display = "block";
    document.getElementById("addCatBtn").style.display = "inline-flex";
    document.getElementById("subForm").style.display = "none";
  }

  async function loadSubs(catId) {
    const subs = await Store.getSubcategories(catId);
    const container = document.getElementById("subsList");
    if (subs.length === 0) {
      container.innerHTML = `<p class="empty-note" style="padding:20px 0;">لا توجد فئات فرعية — اضغط "إضافة فئة فرعية"</p>`;
      return;
    }
    container.innerHTML = subs.map(s => `
      <div class="admin-list-row">
        <div style="font-size:20px;width:36px;text-align:center;flex-shrink:0;">${s.icon || "•"}</div>
        <div class="admin-list-info">
          <div class="admin-list-name">${escapeHTML(s.ar)} <span style="color:var(--ink-faint);font-weight:400;">/ ${escapeHTML(s.fr)}</span></div>
          <div class="admin-list-meta" style="direction:ltr;">ID: ${escapeHTML(s.id)}</div>
        </div>
        <button class="icon-action-btn" data-edit-sub="${s.id}" title="تعديل">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
        </button>
        <button class="icon-action-btn danger" data-delete-sub="${s.id}" title="حذف">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
        </button>
      </div>
    `).join("");

    container.querySelectorAll("[data-edit-sub]").forEach(btn =>
      btn.addEventListener("click", async () => {
        const subs = await Store.getSubcategories(currentParentId);
        const sub = subs.find(s => s.id === btn.getAttribute("data-edit-sub"));
        if (sub) openSubEditor(sub);
      })
    );
    container.querySelectorAll("[data-delete-sub]").forEach(btn =>
      btn.addEventListener("click", () => deleteSub(btn.getAttribute("data-delete-sub")))
    );
  }

  /* ---------------------------------------------------------------------- */
  /* CAT FORM */
  function setupCatForm() {
    document.getElementById("addCatBtn").addEventListener("click", () => {
      editingCatId = null;
      resetCatForm();
      document.getElementById("catFormTitle").textContent = "فئة جديدة";
      document.getElementById("catId").removeAttribute("readonly");
      document.getElementById("catForm").style.display = "block";
      document.getElementById("catAr").focus();
    });
    document.getElementById("catFr").addEventListener("input", () => {
      if (editingCatId) return;
      const fr = document.getElementById("catFr").value;
      document.getElementById("catId").value = fr.toLowerCase()
        .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
        .replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
    });
    document.getElementById("saveCatBtn").addEventListener("click", saveCat);
    document.getElementById("cancelCatBtn").addEventListener("click", () => {
      document.getElementById("catForm").style.display = "none";
      editingCatId = null;
      resetCatForm();
    });
  }

  function openCatEditor(catId) {
    const cat = categoriesCache.find(c => c.id === catId);
    if (!cat) return;
    editingCatId = catId;
    document.getElementById("catAr").value = cat.ar || "";
    document.getElementById("catFr").value = cat.fr || "";
    document.getElementById("catId").value = cat.id || "";
    document.getElementById("catId").setAttribute("readonly", true);
    document.getElementById("catIcon").value = cat.icon || "";
    document.getElementById("catFormTitle").textContent = "تعديل الفئة";
    document.getElementById("catForm").style.display = "block";
    document.getElementById("catAr").focus();
  }

  function resetCatForm() {
    ["catAr","catFr","catId","catIcon"].forEach(id => document.getElementById(id).value = "");
    document.getElementById("catError").style.display = "none";
  }

  async function saveCat() {
    const ar = document.getElementById("catAr").value.trim();
    const fr = document.getElementById("catFr").value.trim();
    const id = document.getElementById("catId").value.trim().toLowerCase();
    const icon = document.getElementById("catIcon").value.trim();

    if (!ar || !fr || !id) return showCatError("الرجاء تعبئة كل الحقول المطلوبة");
    if (!/^[a-z0-9-]+$/.test(id)) return showCatError("المعرّف: حروف إنجليزية صغيرة وأرقام وشرطات فقط");
    if (!editingCatId && categoriesCache.find(c => c.id === id)) return showCatError("هذا المعرّف موجود بالفعل");

    const btn = document.getElementById("saveCatBtn");
    btn.disabled = true; btn.textContent = "جاري الحفظ...";
    try {
      const order = editingCatId
        ? (categoriesCache.find(c => c.id === editingCatId)?.order ?? categoriesCache.length)
        : categoriesCache.length;
      await Store.saveCategory({ id, ar, fr, icon, order });
      await loadCategories();
      document.getElementById("catForm").style.display = "none";
      editingCatId = null; resetCatForm();
    } catch (e) { showCatError("خطأ في الحفظ — تأكد من اتصالك"); }
    finally { btn.disabled = false; btn.textContent = "حفظ الفئة"; }
  }

  async function deleteCat(catId) {
    const cat = categoriesCache.find(c => c.id === catId);
    if (!cat || !window.confirm(`حذف "${cat.ar}" وكل فئاتها الفرعية؟`)) return;
    try { await Store.deleteCategory(catId); await loadCategories(); }
    catch (e) { alert("تعذّر الحذف"); }
  }

  function showCatError(msg) {
    const el = document.getElementById("catError");
    el.textContent = msg; el.style.display = "block";
  }

  /* ---------------------------------------------------------------------- */
  /* SUB FORM */
  function setupSubForm() {
    document.getElementById("addSubBtn").addEventListener("click", () => {
      editingSubId = null;
      resetSubForm();
      document.getElementById("subFormTitle").textContent = "فئة فرعية جديدة";
      document.getElementById("subId").removeAttribute("readonly");
      document.getElementById("subForm").style.display = "block";
      document.getElementById("subAr").focus();
    });
    document.getElementById("subFr").addEventListener("input", () => {
      if (editingSubId) return;
      const fr = document.getElementById("subFr").value;
      document.getElementById("subId").value = fr.toLowerCase()
        .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
        .replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
    });
    document.getElementById("saveSubBtn").addEventListener("click", saveSub);
    document.getElementById("cancelSubBtn").addEventListener("click", () => {
      document.getElementById("subForm").style.display = "none";
      editingSubId = null; resetSubForm();
    });
    document.getElementById("backToCatsBtn").addEventListener("click", closeSubsManager);
  }

  function openSubEditor(sub) {
    editingSubId = sub.id;
    document.getElementById("subAr").value = sub.ar || "";
    document.getElementById("subFr").value = sub.fr || "";
    document.getElementById("subId").value = sub.id || "";
    document.getElementById("subId").setAttribute("readonly", true);
    document.getElementById("subIcon").value = sub.icon || "";
    document.getElementById("subFormTitle").textContent = "تعديل الفئة الفرعية";
    document.getElementById("subForm").style.display = "block";
    document.getElementById("subAr").focus();
  }

  function resetSubForm() {
    ["subAr","subFr","subId","subIcon"].forEach(id => document.getElementById(id).value = "");
    document.getElementById("subError").style.display = "none";
  }

  async function saveSub() {
    const ar = document.getElementById("subAr").value.trim();
    const fr = document.getElementById("subFr").value.trim();
    const id = document.getElementById("subId").value.trim().toLowerCase();
    const icon = document.getElementById("subIcon").value.trim();

    if (!ar || !fr || !id) return showSubError("الرجاء تعبئة كل الحقول المطلوبة");
    if (!/^[a-z0-9-]+$/.test(id)) return showSubError("المعرّف: حروف إنجليزية وأرقام وشرطات فقط");

    const btn = document.getElementById("saveSubBtn");
    btn.disabled = true; btn.textContent = "جاري الحفظ...";
    try {
      const subs = await Store.getSubcategories(currentParentId);
      const order = editingSubId
        ? (subs.find(s => s.id === editingSubId)?.order ?? subs.length)
        : subs.length;
      await Store.saveSubcategory({ id, ar, fr, icon, order, parentId: currentParentId });
      await loadSubs(currentParentId);
      document.getElementById("subForm").style.display = "none";
      editingSubId = null; resetSubForm();
    } catch (e) { showSubError("خطأ في الحفظ — تأكد من اتصالك"); }
    finally { btn.disabled = false; btn.textContent = "حفظ"; }
  }

  async function deleteSub(subId) {
    if (!window.confirm("حذف هذه الفئة الفرعية؟")) return;
    try { await Store.deleteSubcategory(subId); await loadSubs(currentParentId); }
    catch (e) { alert("تعذّر الحذف"); }
  }

  function showSubError(msg) {
    const el = document.getElementById("subError");
    el.textContent = msg; el.style.display = "block";
  }

  function escapeHTML(str) {
    const d = document.createElement("div");
    d.textContent = String(str || ""); return d.innerHTML;
  }
})();
