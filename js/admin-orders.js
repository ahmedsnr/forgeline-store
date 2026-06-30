/* ==========================================================================
   FORGELINE — Admin Orders Logic
   ========================================================================== */

(function () {
  "use strict";

  const ORDER_STATUSES = ["new", "called", "confirmed", "shipped", "delivered", "cancelled"];
  const STATUS_LABELS = {
    new: "جديد", called: "تم الاتصال", confirmed: "مؤكد",
    shipped: "مشحون", delivered: "وصل للزبون", cancelled: "ملغي",
  };
  const STATUS_COLORS = {
    new: "#1E5BFF", called: "#9333EA", confirmed: "#1E7A4C",
    shipped: "#B7791F", delivered: "#16A34A", cancelled: "#B3261E",
  };

  let currentFilter = "all";
  let allOrdersCache = [];
  let unsubscribeOrders = null;

  document.addEventListener("DOMContentLoaded", () => {
    AdminAuth.requireLogin();
    setupAdminLogout();
    setupStatusFilter();
    listenToOrders();
  });

  function fmt(n) { return Number(n || 0).toLocaleString("en-US"); }

  /* ----------------------------------------------------------------------
     REAL-TIME ORDERS LISTENER
     أي طلب جديد (من أي جهاز) أو تغيير حالة (من جهاز تاني) بيظهر هنا
     فوراً بدون الحاجة لإعادة تحميل الصفحة.
     ---------------------------------------------------------------------- */
  function listenToOrders() {
    unsubscribeOrders = db.collection("orders").orderBy("date", "desc").onSnapshot(
      (snapshot) => {
        allOrdersCache = snapshot.docs.map((doc) => doc.data());
        render();
      },
      (error) => {
        console.error("listenToOrders failed:", error);
      }
    );
  }

  /* ----------------------------------------------------------------------
     STATUS FILTER PILLS
     ---------------------------------------------------------------------- */
  function setupStatusFilter() {
    const row = document.getElementById("statusFilterRow");
    if (!row) return;
    const pills = row.querySelectorAll(".status-pill");

    pills.forEach((pill) => {
      pill.addEventListener("click", () => {
        currentFilter = pill.getAttribute("data-status");
        pills.forEach((p) => {
          p.classList.remove("active");
          p.style.background = "";
          p.style.borderColor = "";
          p.style.color = "";
        });
        pill.classList.add("active");
        if (currentFilter === "all") {
          pill.style.background = "var(--navy-950)";
          pill.style.borderColor = "var(--navy-950)";
          pill.style.color = "#fff";
        } else {
          pill.style.background = STATUS_COLORS[currentFilter];
          pill.style.borderColor = STATUS_COLORS[currentFilter];
          pill.style.color = "#fff";
        }
        render();
      });
    });
  }

  /* ----------------------------------------------------------------------
     RENDER ORDERS LIST
     ---------------------------------------------------------------------- */
  function render() {
    const orders = currentFilter === "all" ? allOrdersCache : allOrdersCache.filter((o) => o.status === currentFilter);

    const container = document.getElementById("ordersList");
    const emptyNote = document.getElementById("ordersEmptyNote");

    if (orders.length === 0) {
      container.innerHTML = "";
      emptyNote.style.display = "block";
      return;
    }
    emptyNote.style.display = "none";

    container.innerHTML = orders.map((order) => orderCardHTML(order)).join("");
    bindStatusButtons();
  }

  function orderCardHTML(order) {
    const c = order.customer || {};
    const deliveryTypeLabel = c.deliveryType === "office" ? "مكتب التوصيل" : "توصيل للمنزل";
    const itemsLine = order.items.map((i) => `${i.name} ×${i.qty}`).join("، ");

    return `
    <div class="order-card" data-order-id="${order.id}">
      <div class="order-card-top">
        <div>
          <div class="order-id">${order.id}</div>
          <div class="order-date">${new Date(order.date).toLocaleString("ar-DZ")}</div>
        </div>
        <div class="order-total">${fmt(order.total)} ${CURRENCY}</div>
      </div>

      <div class="order-info-grid">
        <div class="order-info-item">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
          <strong>${escapeHTML(c.name || "—")}</strong>
        </div>
        <div class="order-info-item">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z"/></svg>
          <strong dir="ltr" style="unicode-bidi:plaintext;">${escapeHTML(c.phone || "—")}</strong>
        </div>
        <div class="order-info-item">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>
          <span>${escapeHTML(c.wilaya || "—")} — ${escapeHTML(c.commune || "—")}</span>
        </div>
        <div class="order-info-item">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="1" y="3" width="15" height="13"/><polygon points="16 8 20 8 23 11 23 16 16 16 16 8"/></svg>
          <span>${deliveryTypeLabel}</span>
        </div>
      </div>

      <div class="order-items-line">${escapeHTML(itemsLine)}</div>

      ${c.notes ? `<div class="order-notes">📝 ${escapeHTML(c.notes)}</div>` : ""}

      <div class="status-action-row">
        ${ORDER_STATUSES.map((s) => `
          <button
            class="status-action-btn ${order.status === s ? "active" : ""}"
            data-order-id="${order.id}"
            data-status="${s}"
            style="${order.status === s ? `background:${STATUS_COLORS[s]}; border-color:${STATUS_COLORS[s]};` : ""}"
          >${STATUS_LABELS[s]}</button>
        `).join("")}
      </div>
    </div>`;
  }

  function escapeHTML(str) {
    const div = document.createElement("div");
    div.textContent = String(str == null ? "" : str);
    return div.innerHTML;
  }

  /* ----------------------------------------------------------------------
     STATUS CHANGE
     ---------------------------------------------------------------------- */
  function bindStatusButtons() {
    document.querySelectorAll(".status-action-btn").forEach((btn) => {
      btn.addEventListener("click", () => {
        const orderId = btn.getAttribute("data-order-id");
        const newStatus = btn.getAttribute("data-status");
        updateOrderStatus(orderId, newStatus);
      });
    });
  }

  async function updateOrderStatus(orderId, newStatus) {
    try {
      const order = allOrdersCache.find((o) => o.id === orderId);
      if (!order) return;

      const wasCancelled = order.status === "cancelled";
      const willBeCancelled = newStatus === "cancelled";

      // لو الحالة فعلياً اتغيرت من/إلى "ملغي"، لازم نعدّل المخزون بأمان
      if (wasCancelled !== willBeCancelled) {
        await db.runTransaction(async (transaction) => {
          const orderRef = db.collection("orders").doc(orderId);
          const orderSnap = await transaction.get(orderRef);
          if (!orderSnap.exists) throw new Error("الطلب غير موجود");
          const orderData = orderSnap.data();

          const productRefs = orderData.items.map((it) => db.collection("products").doc(it.id));
          const productSnaps = await Promise.all(productRefs.map((ref) => transaction.get(ref)));

          productSnaps.forEach((snap, i) => {
            if (!snap.exists) return;
            const currentStock = snap.data().stock || 0;
            const qty = orderData.items[i].qty;
            // إلغاء الطلب → نرجع الكمية للمخزون (+)
            // إعادة تفعيل طلب كان ملغياً → ننقص الكمية تاني (-)
            const newStock = willBeCancelled ? currentStock + qty : Math.max(0, currentStock - qty);
            transaction.update(productRefs[i], { stock: newStock });
          });

          transaction.update(orderRef, { status: newStatus });
        });
      } else {
        // تغيير عادي للحالة بدون أي تأثير على المخزون
        await Store.updateOrderStatus(orderId, newStatus);
      }
      // مفيش داعي لنداء render() هنا — الـ onSnapshot listener هيلتقط
      // التغيير تلقائياً ويحدّث الواجهة لوحده فوراً.
    } catch (e) {
      console.error("updateOrderStatus failed:", e);
      alert("تعذّر تحديث حالة الطلب. تأكد من اتصالك بالإنترنت.");
    }
  }
})();
