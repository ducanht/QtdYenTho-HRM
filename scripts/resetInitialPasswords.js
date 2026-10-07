// Script cập nhật mật khẩu mặc định Qtd@2003 cho 12 tài khoản Cán bộ Quỹ TDND Yên Thọ
import { initializeApp } from 'firebase/app';
import { 
  getAuth, 
  signInWithEmailAndPassword, 
  updatePassword,
  createUserWithEmailAndPassword 
} from 'firebase/auth';
import { firebaseConfig } from '../src/lib/firebase.js';
import { OFFICIAL_EMPLOYEES } from './seedOfficialEmployees.js';

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);

const DEFAULT_PASS = 'Qtd@2003';

async function updateAllPasswords() {
  console.log(`🔐 Đang cập nhật mật khẩu mặc định "${DEFAULT_PASS}" cho 12 cán bộ...`);

  for (const emp of OFFICIAL_EMPLOYEES) {
    if (!emp.email) continue;
    const email = emp.email.toLowerCase();

    // 1. Thử đăng nhập bằng mật khẩu mới trước
    try {
      await signInWithEmailAndPassword(auth, email, DEFAULT_PASS);
      console.log(`  ✓ [ĐÃ CẬP NHẬT TRƯỚC ĐÓ] ${email} -> ${DEFAULT_PASS}`);
      continue;
    } catch (err) {
      // Chưa cập nhật hoặc chưa tạo
    }

    // 2. Thử đăng nhập bằng mật khẩu cũ 123456 để đổi sang Qtd@2003
    let signedIn = false;
    try {
      await signInWithEmailAndPassword(auth, email, '123456');
      signedIn = true;
    } catch (oldErr) {
      // Thử pass Admin@123456
      try {
        await signInWithEmailAndPassword(auth, email, 'Admin@123456');
        signedIn = true;
      } catch (adminErr) {
        // Chưa có tài khoản, tạo mới
        try {
          await createUserWithEmailAndPassword(auth, email, DEFAULT_PASS);
          console.log(`  ✓ [TẠO MỚI THÀNH CÔNG] ${email} -> ${DEFAULT_PASS}`);
          continue;
        } catch (createErr) {
          console.warn(`  ⚠️ Không thể xử lý ${email}:`, createErr.message);
        }
      }
    }

    if (signedIn && auth.currentUser) {
      try {
        await updatePassword(auth.currentUser, DEFAULT_PASS);
        console.log(`  ✓ [ĐÃ ĐỔI MẬT KHẨU THÀNH CÔNG] ${email} -> ${DEFAULT_PASS}`);
      } catch (updateErr) {
        console.warn(`  ⚠️ Không thể đổi mật khẩu cho ${email}:`, updateErr.message);
      }
    }
  }

  console.log('\n✅ Hoàn tất đồng bộ mật khẩu mặc định Qtd@2003 cho toàn bộ nhân sự!');
  process.exit(0);
}

updateAllPasswords().catch((e) => {
  console.error('Lỗi thực thi:', e);
  process.exit(1);
});
