/* ==========================================================================
   FORGELINE — Firebase Configuration
   مفاتيح الاتصال بمشروع Firebase الخاص بالمتجر.
   هذا الملف لازم يتحمّل قبل أي ملف JS آخر بكل صفحات الموقع.
   ========================================================================== */

const firebaseConfig = {
  apiKey: "AIzaSyAHIc063TvSIRwYOj08y2M35AIFeqcn0Yg",
  authDomain: "forgeline-store.firebaseapp.com",
  projectId: "forgeline-store",
  storageBucket: "forgeline-store.firebasestorage.app",
  messagingSenderId: "724802610707",
  appId: "1:724802610707:web:eedc7c644511416a0fc1e6",
};

// تهيئة Firebase (نسخة compat — تعمل مباشرة بـ <script> بدون أدوات بناء/npm)
firebase.initializeApp(firebaseConfig);

const db = firebase.firestore();
// ملاحظة: رفع الصور بيتم عبر Cloudinary (انظر js/cloudinary-config.js)
// وليس Firebase Storage، لأن Storage يتطلب خطة Blaze المدفوعة.
