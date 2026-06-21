/* ==========================================================================
   FORGELINE — Checkout Page Logic
   ========================================================================== */

(function () {
  "use strict";

  const FREE_DELIVERY_THRESHOLD = 8000;
  const DELIVERY_FEE = 600;

  let deliveryType = "home";

  document.addEventListener("DOMContentLoaded", init);

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
    setupFormSubmit();
  }

  /* ----------------------------------------------------------------------
     WILAYAS DROPDOWN
     ---------------------------------------------------------------------- */
  function populateWilayas() {
    const select = document.getElementById("custWilaya");
    if (!select) return;
    WILAYAS.forEach((w) => {
      const opt = document.createElement("option");
      opt.value = w;
      opt.textContent = w;
      select.appendChild(opt);
    });
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
    });
    officeBtn.addEventListener("click", () => {
      deliveryType = "office";
      officeBtn.classList.add("selected");
      homeBtn.classList.remove("selected");
    });
  }

  /* ----------------------------------------------------------------------
     ORDER SUMMARY
     ---------------------------------------------------------------------- */
  function calcTotals() {
    const subtotal = window.ForgeLine.getCartSubtotal();
    const deliveryFee = subtotal === 0 || subtotal >= FREE_DELIVERY_THRESHOLD ? 0 : DELIVERY_FEE;
    const total = subtotal + deliveryFee;
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
        <div class="summary-line-total">${fmt(item.product.price * item.qty)} ${CURRENCY}</div>
      </div>`
      )
      .join("");

    const { subtotal, deliveryFee, total } = calcTotals();
    document.getElementById("summarySubtotal").textContent = fmt(subtotal) + " " + CURRENCY;
    document.getElementById("summaryDelivery").textContent = deliveryFee === 0 ? "مجاني" : fmt(deliveryFee) + " " + CURRENCY;
    document.getElementById("summaryTotal").textContent = fmt(total) + " " + CURRENCY;
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

    form.addEventListener("submit", (e) => {
      e.preventDefault();
      const { valid, data } = validateForm();
      if (!valid) {
        const firstError = form.querySelector(".field-error");
        if (firstError) firstError.scrollIntoView({ behavior: "smooth", block: "center" });
        return;
      }
      placeOrder(data);
    });
  }

  function placeOrder(customerData) {
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

    // decrement stock
    const products = Store.getProducts();
    const updatedProducts = products.map((p) => {
      const cartItem = items.find((c) => c.id === p.id);
      return cartItem ? { ...p, stock: Math.max(0, p.stock - cartItem.qty) } : p;
    });
    Store.saveProducts(updatedProducts);

    // save order
    const orders = Store.getOrders();
    orders.unshift(order);
    Store.saveOrders(orders);

    // clear cart
    Store.saveCart([]);

    showSuccess(order);
  }

  function showSuccess(order) {
    document.getElementById("checkoutContent").style.display = "none";
    document.getElementById("successState").style.display = "block";
    document.getElementById("successOrderId").textContent = order.id;
    document.getElementById("successOrderTotal").textContent = fmt(order.total) + " " + CURRENCY;
    window.scrollTo({ top: 0, behavior: "smooth" });
    window.ForgeLine.renderCartDrawer();
  }
})();
