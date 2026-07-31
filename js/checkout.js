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
      opt.value = w.name;
      const prices = DELIVERY_PRICES[w.name];
      const unavailable = prices && prices.office === 0 && prices.home === 0;
      if (unavailable) {
        opt.textContent = `${w.code.toString().padStart(2, "0")} - ${w.name} (توصيل غير متوفر)`;
        opt.disabled = true;
        opt.style.color = "#aaa";
      } else {
        opt.textContent = `${w.code.toString().padStart(2, "0")} - ${w.name}`;
      }
      select.appendChild(opt);
    });
  }

  function setupWilayaChange() {
    const select = document.getElementById("custWilaya");
    if (!select) return;
    select.addEventListener("change", () => {
      selectedWilaya = select.value;
      updateDeliveryBtns(selectedWilaya);
      loadCommunes(selectedWilaya);
    });
  }

  async function loadCommunes(wilayaName) {
    const communeSelect = document.getElementById("custCommune");
    if (!communeSelect) return;

    // نجيب رقم الولاية
    const wilayaEntry = WILAYAS_DATA.find(w => w.name === wilayaName);
    if (!wilayaEntry) return;

    communeSelect.innerHTML = '<option value="">جاري التحميل...</option>';
    communeSelect.disabled = true;

    try {
      const res = await fetch(`/api/get-communes?wilaya_id=${wilayaEntry.code}`);
      const data = await res.json();

      communeSelect.innerHTML = '<option value="">اختر البلدية...</option>';

      if (Array.isArray(data) && data.length > 0) {
        data.forEach(c => {
          const name = c.name || c.commune_name || c.nom || '';
          if (name) {
            const opt = document.createElement('option');
            opt.value = name;
            opt.textContent = name;
            // نخزن هل stop_desk متوفر في هذه البلدية
            opt.setAttribute('data-has-stopdesk', c.has_stop_desk || c.stop_desk || 0);
            communeSelect.appendChild(opt);
          }
        });
        communeSelect.disabled = false;

        // نتحقق من stop_desk عند تغيير البلدية
        communeSelect.addEventListener('change', () => {
          const selectedOpt = communeSelect.options[communeSelect.selectedIndex];
          const hasStopDesk = selectedOpt && selectedOpt.getAttribute('data-has-stopdesk') == '1';
          const officeBtn = document.getElementById('deliveryOfficeBtn');
          const homeBtn = document.getElementById('deliveryHomeBtn');
          if (officeBtn) {
            if (!hasStopDesk) {
              officeBtn.style.display = 'none';
              // نختار التوصيل للمنزل تلقائياً
              deliveryType = 'home';
              if (homeBtn) homeBtn.classList.add('selected');
              officeBtn.classList.remove('selected');
            } else {
              officeBtn.style.display = '';
            }
          }
          renderSummary();
        });
      } else {
        communeSelect.innerHTML = '<option value="">اكتب اسم البلدية يدوياً</option>';
        communeSelect.disabled = false;
      }
    } catch (e) {
      communeSelect.innerHTML = '<option value="">خطأ في التحميل</option>';
      communeSelect.disabled = false;
      console.error("loadCommunes error:", e);
    }
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
      if (officeBtn.disabled) return;
      deliveryType = "office";
      officeBtn.classList.add("selected");
      homeBtn.classList.remove("selected");
      renderSummary();
    });
  }

  // تحديث أزرار التوصيل حسب الولاية المختارة
  function updateDeliveryBtns(wilaya) {
    const officeBtn = document.getElementById("deliveryOfficeBtn");
    const homeBtn = document.getElementById("deliveryHomeBtn");
    if (!officeBtn || !homeBtn) return;

    const prices = DELIVERY_PRICES[wilaya];
    const officeAvailable = prices && prices.office > 0;

    if (!officeAvailable) {
      // مكتب التوصيل غير متوفر — نعطّله ونختار المنزل تلقائياً
      officeBtn.disabled = true;
      officeBtn.style.opacity = "0.4";
      officeBtn.style.cursor = "not-allowed";
      officeBtn.classList.remove("selected");
      deliveryType = "home";
      homeBtn.classList.add("selected");
    } else {
      officeBtn.disabled = false;
      officeBtn.style.opacity = "";
      officeBtn.style.cursor = "";
    }
    renderSummary();
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
    } else {
      deliveryFee = wilayaPrice; // دائماً يُحسب سعر التوصيل بدون استثناء
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
      deliveryEl.textContent = lang === "fr" ? "Gratuit" : "مجاني";
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
    if (!commune) {
      // لو البلديات لم تُحمَّل بعد، نقبل الطلب بدون بلدية محددة
      const communeEl2 = document.getElementById("custCommune");
      if (communeEl2 && communeEl2.tagName === "SELECT" && communeEl2.options.length <= 1) {
        // البلديات لم تُحمَّل — نكمل بدون تحقق
      } else {
        showError("commune", "الرجاء اختيار البلدية"); valid = false;
      }
    }

    return { valid, data: { name, phone, wilaya, commune, deliveryType, notes: "" } };
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
      items: items.map((c) => ({ id: c.productId || c.id, name: c.product.name_ar, brand: c.product.brand || "", qty: c.qty, price: c.product.price, variant: c.variantName || "" })),
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

    // إرسال الطلب لـ Ecotrack/World Express تلقائياً مع retry
    sendToEcotracWithRetry(order);

    // إفراغ السلة
    Store.saveCart([]);

    showSuccess(order);
  }

  async function sendToEcotracWithRetry(order, attempt = 1) {
    try {
      await sendToEcotrack(order);
    } catch (err) {
      console.error(`Ecotrack attempt ${attempt} failed:`, err);
      if (attempt < 3) {
        // نحاول مرة أخرى بعد 5 ثواني
        setTimeout(() => sendToEcotracWithRetry(order, attempt + 1), 5000 * attempt);
      } else {
        // بعد 3 محاولات فاشلة، نحفظ في Firebase عشان نعرف إنها لم تُرسل
        try {
          await db.collection("orders").doc(order.id).update({ ecotrackFailed: true });
          console.error("Ecotrack failed after 3 attempts for order:", order.id);
        } catch (e) {}
      }
    }
  }

  async function sendToEcotrack(order) {
    // رقم الولاية من WILAYAS_DATA
    const wilayaEntry = WILAYAS_DATA.find(w => w.name === order.customer.wilaya);
    const wilayaCode = wilayaEntry ? wilayaEntry.code : 22;

    // تجهيز قائمة المنتجات كنص
    const itemsText = order.items
      .map(i => `${i.brand ? i.brand + " - " : ""}${i.name}${i.variant ? " (" + i.variant + ")" : ""} x${i.qty}`)
      .join(", ");

    const payload = {
      order: {
        orderId: order.id,
        name: order.customer.name,
        phone: order.customer.phone,
        wilayaCode: wilayaCode,
        commune: order.customer.commune,
        items: itemsText,
        total: order.total,
        deliveryType: order.customer.deliveryType,
        notes: order.customer.notes || "",
      }
    };

    const res = await fetch("/api/create-shipment", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      const err = await res.json();
      console.error("Ecotrack failed:", err);
    } else {
      console.log("Ecotrack shipment created successfully");
    }
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
