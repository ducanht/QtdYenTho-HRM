import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

// ============================================================================
// CẤU HÌNH FIREBASE - QUỸ TÍN DỤNG NHÂN DÂN YÊN THỌ (HRM PORTAL)
// ============================================================================
// Hướng dẫn: Dán thông tin cấu hình Firebase Console của bạn vào đối tượng dưới đây.
// Truy cập https://console.firebase.google.com -> Project Settings -> General -> Your apps
// ============================================================================
export const firebaseConfig = {
  apiKey: "",            // <-- DÁN API KEY CỦA BẠN TẠI ĐÂY (Ví dụ: "AIzaSy...")
  authDomain: "",        // <-- DÁN AUTH DOMAIN (Ví dụ: "qtd-yentho-hrm.firebaseapp.com")
  projectId: "",         // <-- DÁN PROJECT ID (Ví dụ: "qtd-yentho-hrm")
  storageBucket: "",     // <-- DÁN STORAGE BUCKET (Ví dụ: "qtd-yentho-hrm.firebasestorage.app")
  messagingSenderId: "", // <-- DÁN MESSAGING SENDER ID (Ví dụ: "1234567890")
  appId: "",             // <-- DÁN APP ID (Ví dụ: "1:1234567890:web:abcdef123456")
  measurementId: ""      // <-- (Tùy chọn) MEASUREMENT ID
};

// Kiểm tra xem người dùng đã điền cấu hình Firebase hợp lệ hay chưa
export const isFirebaseConfigured = Boolean(
  firebaseConfig.apiKey &&
  firebaseConfig.projectId &&
  firebaseConfig.apiKey.trim() !== "" &&
  firebaseConfig.projectId.trim() !== ""
);

let app = null;
let auth = null;
let db = null;

if (isFirebaseConfigured) {
  try {
    app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
    auth = getAuth(app);
    db = getFirestore(app);
    console.info(" [Firebase] Khởi tạo thành công với Project ID:", firebaseConfig.projectId);
  } catch (error) {
    console.error("❌ [Firebase] Lỗi khi khởi tạo Firebase:", error);
  }
} else {
  console.warn("⚠️ [Firebase] firebaseConfig hiện đang để trống. Hệ thống đang tự động kích hoạt Chế độ Demo / Dữ liệu mô phỏng để bạn trải nghiệm ngay lập tức!");
}

export { auth, db };
export default app;
