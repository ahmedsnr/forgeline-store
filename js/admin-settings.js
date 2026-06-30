/* ==========================================================================
   FORGELINE — Admin Settings Logic
   ========================================================================== */

(function () {
  "use strict";

  let selectedHeroFile = null;
  let selectedOfferBannerFile = null;
  let phoneNumbers = [];

  document.addEventListener("DOMContentLoaded", async () => {
    AdminAuth.requireLogin();
    setupAdminLogout();
    await loadSettings();
    setupImageInputs();
    setupPhoneNumbers();
    setupFormSubmit();
  });

  /* ----------------------------------------------------------------------
     LOAD CURRENT SETTINGS
     ---------------------------------------------------------------------- */
  async function loadSettings() {
    const settings = await Store.getSettings();

    document.getElementById("announceEnabled").checked = settings.announceEnabled !== false;
    document.getElementById("announceTextAr").value = settings.announceText_ar || "";
    document.getElementById("announceTextFr").value = settings.announceText_fr || "";

    document.getElementById("heroImageCurrentUrl").value = settings.heroImage || "";
    if (settings.heroImage) {
      document.getElementById("heroImagePreview").innerHTML =
        `<img src="${settings.heroImage}" alt="" style="width:100%;height:100%;object-fit:cover;">`;
    }

    document.getElementById("offerBannerCurrentUrl").value = settings.offerBannerImage || "";
    if (settings.offerBannerImage) {
      document.getElementById("offerBannerPreview").innerHTML =
        `<img src="${settings.offerBannerImage}" alt="" style="width:100%;height:100%;object-fit:cover;">`;
    }

    phoneNumbers = Array.isArray(settings.phoneNumbers) ? [...settings.phoneNumbers] : [];
    renderPhoneNumbers();
  }

  /* ----------------------------------------------------------------------
     IMAGE INPUTS (Hero + Offer Banner)
     ---------------------------------------------------------------------- */
  function setupImageInputs() {
    const heroInput = document.getElementById("heroImageFile");
    heroInput.addEventListener("change", () => {
      selectedHeroFile = heroInput.files[0] || null;
      previewImage(selectedHeroFile, "heroImagePreview");
    });

    const offerInput = document.getElementById("offerBannerFile");
    offerInput.addEventListener("change", () => {
      selectedOfferBannerFile = offerInput.files[0] || null;
      previewImage(selectedOfferBannerFile, "offerBannerPreview");
    });
  }

  function previewImage(file, containerId) {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      document.getElementById(containerId).innerHTML =
        `<img src="${e.target.result}" alt="" style="width:100%;height:100%;object-fit:cover;">`;
    };
    reader.readAsDataURL(file);
  }

  async function uploadImage(file, folder) {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("upload_preset", CLOUDINARY_UPLOAD_PRESET);
    formData.append("folder", folder);
    const res = await fetch(
      `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`,
      { method: "POST", body: formData }
    );
    if (!res.ok) throw new Error("فشل رفع الصورة");
    const data = await res.json();
    return data.secure_url;
  }

  /* ----------------------------------------------------------------------
     PHONE NUMBERS LIST
     ---------------------------------------------------------------------- */
  function renderPhoneNumbers() {
    const container = document.getElementById("phoneNumbersList");
    if (phoneNumbers.length === 0) {
      container.innerHTML = `<p class="text-faint" style="font-size:13px;">لا توجد أرقام مضافة بعد</p>`;
      return;
    }
    container.innerHTML = phoneNumbers.map((num, i) => `
      <div style="display:flex; gap:8px; align-items:center;">
        <input type="tel" value="${escapeAttr(num)}" data-phone-index="${i}"
          style="flex:1; padding:10px 14px; border:1.5px solid var(--silver-200); border-radius:8px; font-size:14px;"
          placeholder="05XX XX XX XX">
        <button type="button" data-remove-phone="${i}" class="icon-action-btn danger" title="حذف">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
        </button>
      </div>
    `).join("");

    container.querySelectorAll("[data-phone-index]").forEach((input) => {
      input.addEventListener("input", () => {
        const idx = Number(input.getAttribute("data-phone-index"));
        phoneNumbers[idx] = input.value;
      });
    });
    container.querySelectorAll("[data-remove-phone]").forEach((btn) => {
      btn.addEventListener("click", () => {
        const idx = Number(btn.getAttribute("data-remove-phone"));
        phoneNumbers.splice(idx, 1);
        renderPhoneNumbers();
      });
    });
  }

  function escapeAttr(str) {
    return String(str || "").replace(/"/g, "&quot;");
  }

  function setupPhoneNumbers() {
    document.getElementById("addPhoneBtn").addEventListener("click", () => {
      phoneNumbers.push("");
      renderPhoneNumbers();
      const inputs = document.querySelectorAll("[data-phone-index]");
      if (inputs.length) inputs[inputs.length - 1].focus();
    });
  }

  /* ----------------------------------------------------------------------
     SAVE
     ---------------------------------------------------------------------- */
  function setupFormSubmit() {
    document.getElementById("settingsForm").addEventListener("submit", async (e) => {
      e.preventDefault();
      await saveSettings();
    });
  }

  function showError(msg) {
    const el = document.getElementById("formError");
    el.textContent = msg;
    el.style.display = "block";
    document.getElementById("formSuccess").style.display = "none";
  }
  function showSuccess() {
    document.getElementById("formError").style.display = "none";
    const el = document.getElementById("formSuccess");
    el.style.display = "block";
    setTimeout(() => { el.style.display = "none"; }, 4000);
  }

  async function saveSettings() {
    const btn = document.getElementById("saveSettingsBtn");
    const originalText = btn.textContent;
    btn.disabled = true;

    try {
      let heroImageUrl = document.getElementById("heroImageCurrentUrl").value;
      if (selectedHeroFile) {
        btn.textContent = "جاري رفع صورة الـ Hero...";
        heroImageUrl = await uploadImage(selectedHeroFile, "settings");
      }

      let offerBannerUrl = document.getElementById("offerBannerCurrentUrl").value;
      if (selectedOfferBannerFile) {
        btn.textContent = "جاري رفع صورة العروض...";
        offerBannerUrl = await uploadImage(selectedOfferBannerFile, "settings");
      }

      btn.textContent = "جاري الحفظ...";

      const settings = {
        announceEnabled: document.getElementById("announceEnabled").checked,
        announceText_ar: document.getElementById("announceTextAr").value.trim(),
        announceText_fr: document.getElementById("announceTextFr").value.trim(),
        heroImage: heroImageUrl,
        offerBannerImage: offerBannerUrl,
        phoneNumbers: phoneNumbers.map((n) => n.trim()).filter(Boolean),
      };

      await Store.saveSettings(settings);

      // تحديث الحقول المخفية بالقيم الجديدة (لو رفع المالك صورة، تبقى "موجودة" لو عدّل تاني بدون رفع صورة جديدة)
      document.getElementById("heroImageCurrentUrl").value = heroImageUrl;
      document.getElementById("offerBannerCurrentUrl").value = offerBannerUrl;
      selectedHeroFile = null;
      selectedOfferBannerFile = null;

      showSuccess();
    } catch (err) {
      console.error("saveSettings failed:", err);
      showError("حدث خطأ أثناء الحفظ. تأكد من اتصالك بالإنترنت وحاول مرة أخرى.");
    } finally {
      btn.disabled = false;
      btn.textContent = originalText;
    }
  }
})();
