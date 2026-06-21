/* ==========================================================================
   FORGELINE — Admin Panel Core Logic
   تسجيل الدخول، حماية الجلسة، وأدوات مشتركة لكل صفحات لوحة التحكم
   ========================================================================== */

/* ⚠️ غيّر كلمة المرور هنا بنفسك في أي وقت — سطر واحد بس */
const ADMIN_PASSWORD = "admin123";

const AdminAuth = {
  SESSION_KEY: "forgeline_admin_session",

  isLoggedIn() {
    return sessionStorage.getItem(this.SESSION_KEY) === "true";
  },
  login(password) {
    if (password === ADMIN_PASSWORD) {
      sessionStorage.setItem(this.SESSION_KEY, "true");
      return true;
    }
    return false;
  },
  logout() {
    sessionStorage.removeItem(this.SESSION_KEY);
  },
  /* يستدعى في أعلى كل صفحة admin محمية (غير login.html) */
  requireLogin() {
    if (!this.isLoggedIn()) {
      window.location.href = "login.html";
    }
  },
};

/* ----------------------------------------------------------------------
   LOGIN PAGE LOGIC (يعمل فقط لو الصفحة فيها loginForm)
   ---------------------------------------------------------------------- */
document.addEventListener("DOMContentLoaded", () => {
  const loginForm = document.getElementById("loginForm");
  if (!loginForm) return;

  // لو المالك مسجل دخول بالفعل، روّحه على الداشبورد مباشرة
  if (AdminAuth.isLoggedIn()) {
    window.location.href = "dashboard.html";
    return;
  }

  loginForm.addEventListener("submit", (e) => {
    e.preventDefault();
    const password = document.getElementById("passwordInput").value;
    const errorBox = document.getElementById("loginError");

    if (AdminAuth.login(password)) {
      window.location.href = "dashboard.html";
    } else {
      errorBox.style.display = "block";
      document.getElementById("passwordInput").value = "";
      document.getElementById("passwordInput").focus();
    }
  });
});

/* ----------------------------------------------------------------------
   SHARED ADMIN HELPERS
   ---------------------------------------------------------------------- */
function fmtAdmin(n) {
  return Number(n || 0).toLocaleString("en-US");
}

function setupAdminLogout() {
  const btn = document.getElementById("adminLogoutBtn");
  if (!btn) return;
  btn.addEventListener("click", () => {
    AdminAuth.logout();
    window.location.href = "login.html";
  });
}
