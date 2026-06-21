/* ==========================================================================
   FORGELINE — Admin Dashboard Logic
   ========================================================================== */

(function () {
  "use strict";

  document.addEventListener("DOMContentLoaded", () => {
    AdminAuth.requireLogin();
    setupAdminLogout();
    render();
  });

  function render() {
    const orders = Store.getOrders();
    const products = Store.getProducts();

    renderStatusCounts(orders);
    renderMonthSales(orders);
    renderTopProducts(orders, products);
    renderLowStock(products);
  }

  /* ----------------------------------------------------------------------
     STATUS COUNTS
     ---------------------------------------------------------------------- */
  function renderStatusCounts(orders) {
    const counts = { new: 0, called: 0, confirmed: 0, shipped: 0, delivered: 0, cancelled: 0 };
    orders.forEach((o) => {
      if (counts.hasOwnProperty(o.status)) counts[o.status]++;
    });
    document.getElementById("statNew").textContent = counts.new;
    document.getElementById("statConfirmed").textContent = counts.confirmed;
    document.getElementById("statShipped").textContent = counts.shipped;
    document.getElementById("statCancelled").textContent = counts.cancelled;
  }

  /* ----------------------------------------------------------------------
     MONTH SALES
     ---------------------------------------------------------------------- */
  function renderMonthSales(orders) {
    const now = new Date();
    const total = orders
      .filter((o) => o.status !== "cancelled")
      .filter((o) => {
        const d = new Date(o.date);
        return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
      })
      .reduce((sum, o) => sum + o.total, 0);

    document.getElementById("monthSales").innerHTML = `${fmtAdmin(total)} <small>${CURRENCY}</small>`;
  }

  /* ----------------------------------------------------------------------
     TOP PRODUCTS
     ---------------------------------------------------------------------- */
  function renderTopProducts(orders, products) {
    const counter = {};
    orders
      .filter((o) => o.status !== "cancelled")
      .forEach((o) => {
        o.items.forEach((item) => {
          counter[item.id] = (counter[item.id] || 0) + item.qty;
        });
      });

    const ranked = Object.entries(counter)
      .map(([id, qty]) => ({ product: products.find((p) => p.id === id), qty }))
      .filter((x) => x.product)
      .sort((a, b) => b.qty - a.qty)
      .slice(0, 5);

    const container = document.getElementById("topProductsList");

    if (ranked.length === 0) {
      container.innerHTML = `<p class="empty-note">لا توجد بيانات كافية بعد</p>`;
      return;
    }

    container.innerHTML = ranked
      .map(
        (item, i) => `
      <div class="mini-row">
        <span class="mini-rank">${i + 1}</span>
        <img src="${item.product.img}" alt="">
        <span class="mini-row-name">${item.product.name_ar}</span>
        <span class="mini-row-qty">${item.qty}×</span>
      </div>`
      )
      .join("");
  }

  /* ----------------------------------------------------------------------
     LOW STOCK ALERT
     ---------------------------------------------------------------------- */
  function renderLowStock(products) {
    const outOfStock = products.filter((p) => p.stock <= 0);
    const lowStock = products.filter((p) => p.stock > 0 && p.stock <= (p.lowStockAt || 5));
    const combined = [...outOfStock, ...lowStock].slice(0, 6);

    const container = document.getElementById("lowStockList");

    if (combined.length === 0) {
      container.innerHTML = `<p class="empty-note">لا توجد منتجات بحاجة لتنبيه حالياً</p>`;
      return;
    }

    container.innerHTML = combined
      .map((p) => {
        const isOut = p.stock <= 0;
        return `
        <div class="mini-row">
          <img src="${p.img}" alt="">
          <span class="mini-row-name">${p.name_ar}</span>
          <span class="mini-row-badge ${isOut ? "badge-out" : "badge-low"}">${p.stock}</span>
        </div>`;
      })
      .join("");
  }
})();
