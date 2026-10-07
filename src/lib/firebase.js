import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

// ============================================================================
// CẤU HÌNH FIREBASE - QUỸ TÍN DỤNG NHÂN DÂN YÊN THỌ (HRM PORTAL)
// ============================================================================
// Project ID: qtdyentho-hrm
// Web App ID: 1:112031414979:web:e96098d3108638f50d4076
// ============================================================================
export const firebaseConfig = {
  apiKey: "AIzaSyAp-VFLx0EpD81zYSedMZSJpzE7BQuvvkM",
  authDomain: "qtdyentho-hrm.firebaseapp.com",
  projectId: "qtdyentho-hrm",
  storageBucket: "qtdyentho-hrm.firebasestorage.app",
  messagingSenderId: "112031414979",
  appId: "1:112031414979:web:e96098d3108638f50d4076"
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
let googleProvider = null;

if (isFirebaseConfigured) {
  try {
    app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
    auth = getAuth(app);
    db = getFirestore(app);
    googleProvider = new GoogleAuthProvider();
    googleProvider.setCustomParameters({ prompt: 'select_account' });
    console.info(" [Firebase] Khởi tạo thành công với Project ID:", firebaseConfig.projectId);
  } catch (error) {
    console.error("❌ [Firebase] Lỗi khi khởi tạo Firebase:", error);
  }
} else {
  console.warn("⚠️ [Firebase] firebaseConfig hiện đang để trống. Hệ thống đang tự động kích hoạt Chế độ Demo / Dữ liệu mô phỏng để bạn trải nghiệm ngay lập tức!");
}

export { auth, db, googleProvider };
export default app;
