/* ==========================================================================
   FORGELINE — Checkout Page Logic
   ========================================================================== */

(function () {
  "use strict";
  function currency() {
    return window.ForgeLine && window.ForgeLine.lang === "fr" ? "DZD" : "د.ج";
  }

  const FREE_DELIVERY_THRESHOLD = 8000;

  let deliveryType = "home";
  let selectedWilaya = "";

  document.addEventListener("forgeline:ready", init);

  function fmt(n) { return Number(n || 0).toLocaleString("en-US"); }

  function init() {
    const items = window.ForgeLine.getCartItems();

    if (items.length === 0) {
      document.getElementById("checkoutContent").style.display = "none";
      document.getElementById("emptyCartState").style.display = "block";
      return;
    }

    populateWilayas();
    renderSummary();
    setupDeliveryToggle();
    setupWilayaChange();
    setupFormSubmit();
  }

  /* ----------------------------------------------------------------------
     WILAYAS DROPDOWN
     ---------------------------------------------------------------------- */
  function populateWilayas() {
    const select = document.getElementById("custWilaya");
    if (!select) return;
    WILAYAS_DATA.forEach((w) => {
      const opt = document.createElement("option");
      opt.value = w.name; // القيمة المخزنة في الطلب تبقى الاسم فقط (للتوافق مع DELIVERY_PRICES)
      opt.textContent = `${w.code.toString().padStart(2, "0")} - ${w.name}`;
      select.appendChild(opt);
    });
  }

  function setupWilayaChange() {
    const select = document.getElementById("custWilaya");
    if (!select) return;
    select.addEventListener("change", () => {
      selectedWilaya = select.value;
      renderSummary();
    });
  }

  function getDeliveryPriceForWilaya(wilaya, type) {
    if (!wilaya) return null; // لسه محددش ولاية
    const entry = DELIVERY_PRICES.hasOwnProperty(wilaya) ? DELIVERY_PRICES[wilaya] : DEFAULT_DELIVERY_PRICE;
    return type === "office" ? entry.office : entry.home;
  }

  /* ----------------------------------------------------------------------
     DELIVERY TYPE TOGGLE
     ---------------------------------------------------------------------- */
  function setupDeliveryToggle() {
    const homeBtn = document.getElementById("deliveryHomeBtn");
    const officeBtn = document.getElementById("deliveryOfficeBtn");
    if (!homeBtn || !officeBtn) return;

    homeBtn.addEventListener("click", () => {
      deliveryType = "home";
      homeBtn.classList.add("selected");
      officeBtn.classList.remove("selected");
      renderSummary();
    });
    officeBtn.addEventListener("click", () => {
      deliveryType = "office";
      officeBtn.classList.add("selected");
      homeBtn.classList.remove("selected");
      renderSummary();
    });
  }

  /* ----------------------------------------------------------------------
     ORDER SUMMARY
     ---------------------------------------------------------------------- */
  function calcTotals() {
    const subtotal = window.ForgeLine.getCartSubtotal();
    const wilayaPrice = getDeliveryPriceForWilaya(selectedWilaya, deliveryType);
    let deliveryFee;
    if (subtotal === 0) {
      deliveryFee = 0;
    } else if (wilayaPrice === null) {
      deliveryFee = null; // لسه محتاج يختار ولاية
    } else if (subtotal >= FREE_DELIVERY_THRESHOLD) {
      deliveryFee = 0;
    } else {
      deliveryFee = wilayaPrice;
    }
    const total = subtotal + (deliveryFee || 0);
    return { subtotal, deliveryFee, total };
  }

  function renderSummary() {
    const items = window.ForgeLine.getCartItems();
    const linesEl = document.getElementById("summaryLines");
    linesEl.innerHTML = items
      .map(
        (item) => `
      <div class="summary-line">
        <img src="${item.product.img}" alt="">
        <div style="flex:1; min-width:0;">
          <div class="summary-line-name">${item.product.name_ar}</div>
          <div class="summary-line-qty">×${item.qty}</div>
        </div>
        <div class="summary-line-total">${fmt(item.product.price * item.qty)} ${currency()}</div>
      </div>`
      )
      .join("");

    const { subtotal, deliveryFee, total } = calcTotals();
    document.getElementById("summarySubtotal").textContent = fmt(subtotal) + " " + currency();
    const deliveryEl = document.getElementById("summaryDelivery");
    if (deliveryFee === null) {
      deliveryEl.textContent = "اختر الولاية أولاً";
    } else if (deliveryFee === 0) {
      deliveryEl.textContent = "مجاني";
    } else {
      deliveryEl.textContent = fmt(deliveryFee) + " " + currency();
    }
    document.getElementById("summaryTotal").textContent = fmt(total) + " " + currency();
  }

  /* ----------------------------------------------------------------------
     VALIDATION
     ---------------------------------------------------------------------- */
  function showError(fieldKey, message) {
    const fieldEl = document.getElementById("field-" + fieldKey);
    const errorEl = document.getElementById("error-" + fieldKey);
    if (fieldEl) fieldEl.classList.add("field-error");
    if (errorEl) {
      errorEl.textContent = message;
      errorEl.style.display = "block";
    }
  }
  function clearError(fieldKey) {
    const fieldEl = document.getElementById("field-" + fieldKey);
    const errorEl = document.getElementById("error-" + fieldKey);
    if (fieldEl) fieldEl.classList.remove("field-error");
    if (errorEl) errorEl.style.display = "none";
  }
  function clearAllErrors() {
    ["name", "phone", "wilaya", "commune"].forEach(clearError);
  }

  function validateForm() {
    clearAllErrors();
    let valid = true;

    const name = document.getElementById("custName").value.trim();
    const phone = document.getElementById("custPhone").value.trim();
    const wilaya = document.getElementById("custWilaya").value;
    const commune = document.getElementById("custCommune").value.trim();

    if (!name) { showError("name", "هذا الحقل مطلوب"); valid = false; }
    if (!phone) { showError("phone", "هذا الحقل مطلوب"); valid = false; }
    else if (!/^[0-9+\s-]{8,15}$/.test(phone)) { showError("phone", "رقم هاتف غير صالح"); valid = false; }
    if (!wilaya) { showError("wilaya", "الرجاء الاختيار"); valid = false; }
    if (!commune) { showError("commune", "هذا الحقل مطلوب"); valid = false; }

    return { valid, data: { name, phone, wilaya, commune, deliveryType, notes: document.getElementById("custNotes").value.trim() } };
  }

  /* ----------------------------------------------------------------------
     SUBMIT ORDER
     ---------------------------------------------------------------------- */
  function setupFormSubmit() {
    const form = document.getElementById("checkoutForm");
    if (!form) return;

    form.addEventListener("submit", async (e) => {
      e.preventDefault();
      const { valid, data } = validateForm();
      if (!valid) {
        const firstError = form.querySelector(".field-error");
        if (firstError) firstError.scrollIntoView({ behavior: "smooth", block: "center" });
        return;
      }

      const submitBtn = document.getElementById("submitOrderBtn");
      const originalText = submitBtn.textContent;
      submitBtn.disabled = true;
      submitBtn.textContent = "جاري إرسال الطلب...";

      try {
        await placeOrder(data);
      } catch (err) {
        console.error("placeOrder failed:", err);
        alert("حدث خطأ أثناء إرسال الطلب. تأكد من اتصالك بالإنترنت وحاول مرة أخرى.");
        submitBtn.disabled = false;
        submitBtn.textContent = originalText;
      }
    });
  }

  async function placeOrder(customerData) {
    const items = window.ForgeLine.getCartItems();
    const { subtotal, deliveryFee, total } = calcTotals();

    const order = {
      id: "ORD-" + Math.random().toString(36).slice(2, 8).toUpperCase(),
      date: new Date().toISOString(),
      items: items.map((c) => ({ id: c.id, name: c.product.name_ar, qty: c.qty, price: c.product.price })),
      subtotal, deliveryFee, total,
      customer: customerData,
      status: "new",
    };

    // إنقاص المخزون بأمان باستخدام Firestore transaction — يضمن عدم
    // تعارض البيانات لو أكثر من زبون اشترى نفس المنتج بنفس اللحظة.
    await db.runTransaction(async (transaction) => {
      const productRefs = items.map((c) => db.collection("products").doc(c.id));
      const productSnaps = await Promise.all(productRefs.map((ref) => transaction.get(ref)));

      productSnaps.forEach((snap, i) => {
        if (!snap.exists) return;
        const currentStock = snap.data().stock || 0;
        const newStock = Math.max(0, currentStock - items[i].qty);
        transaction.update(productRefs[i], { stock: newStock });
      });

      const orderRef = db.collection("orders").doc(order.id);
      transaction.set(orderRef, order);
    });

    // تحديث الكاش المحلي للمنتجات عشان المخزون يبان صحيح فوراً
    await window.ForgeLine.refreshDataCache();

    // إفراغ السلة
    Store.saveCart([]);

    showSuccess(order);
  }

  function showSuccess(order) {
    document.getElementById("checkoutContent").style.display = "none";
    document.getElementById("successState").style.display = "block";
    document.getElementById("successOrderId").textContent = order.id;
    document.getElementById("successOrderTotal").textContent = fmt(order.total) + " " + currency();
    window.scrollTo({ top: 0, behavior: "smooth" });
    window.ForgeLine.renderCartDrawer();
  }
})();
