import React, { createContext, useContext, useState, useEffect } from 'react';
import { 
  signInWithEmailAndPassword, 
  signInWithPopup,
  signOut as firebaseSignOut, 
  onAuthStateChanged,
  updatePassword
} from 'firebase/auth';
import { doc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db, googleProvider, isFirebaseConfigured } from '../lib/firebase';
import { getUserProfile, syncUserProfile } from '../lib/services';
import { ROLES } from '../lib/constants';

const AuthContext = createContext(null);

// Biến kiểm soát số lần đăng nhập sai (Anti Brute-Force Rate Limiter)
let failedAttempts = 0;
let lockUntilTime = 0;

// Nhận diện tài khoản Lãnh đạo / Admin Quỹ
export const isAdminEmail = (email) => {
  if (!email) return false;
  const lower = email.trim().toLowerCase();
  return (
    lower === 'ducanht@gmail.com' ||
    lower === 'nguyenducthao.qtd@gmail.com' ||
    lower === 'ducanht.gemini@gmail.com' ||
    lower.includes('admin') ||
    lower.includes('chutich')
  );
};

// Hàm chuẩn hóa hồ sơ cán bộ khi đăng nhập
export const buildUserData = (fbUser, profile) => {
  const adminFlag = isAdminEmail(fbUser?.email);
  const resolvedRole = profile?.role || (adminFlag ? ROLES.ADMIN : ROLES.STAFF);

  return {
    uid: fbUser.uid,
    id: profile?.id || fbUser.uid,
    code: profile?.code || (adminFlag ? 'CB07' : 'CB-QT'),
    email: fbUser.email,
    name: profile?.name || fbUser.displayName || (adminFlag ? 'Trịnh Đức Anh' : fbUser.email.split('@')[0]),
    role: resolvedRole,
    department: profile?.department || (adminFlag ? 'Ban Quản trị (HĐQT)' : 'Phòng Tín dụng'),
    position: profile?.position || (adminFlag ? 'Chủ tịch HĐQT' : 'Cán bộ'),
    avatar: profile?.avatar || fbUser.photoURL || null,
    phone: profile?.phone || (adminFlag ? '0965122111' : ''),
    status: profile?.status || 'ACTIVE',
    partyMember: profile ? Boolean(profile.partyMember) : (adminFlag ? true : false),
    politicalRole: profile?.politicalRole || (adminFlag ? 'Bí thư Chi bộ' : ''),
    assignedArea: profile?.assignedArea || (adminFlag ? 'Lãnh đạo toàn diện HĐQT & Định hướng chiến lược Quỹ' : ''),
    mustChangePassword: profile ? (profile.mustChangePassword ?? false) : false,
  };
};

export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [role, setRole] = useState(null);
  const [loading, setLoading] = useState(true);
  const [authError, setAuthError] = useState(null);

  // Khởi tạo trạng thái xác thực từ Firebase Authentication & Firestore
  useEffect(() => {
    let unsubscribe = () => {};

    if (isFirebaseConfigured && auth) {
      unsubscribe = onAuthStateChanged(auth, async (fbUser) => {
        if (fbUser) {
          try {
            // Lấy thông tin role và phòng ban thực tế từ Firestore collection 'users'
            const profile = await getUserProfile(fbUser.uid, fbUser.email);
            if (profile?.status && profile.status !== 'ACTIVE') {
              console.warn('Tài khoản đã bị tạm dừng hoạt động trên Firestore:', profile);
              await firebaseSignOut(auth);
              setCurrentUser(null);
              setRole(null);
              setLoading(false);
              return;
            }

            const userData = buildUserData(fbUser, profile);

            setCurrentUser(userData);
            setRole(userData.role);
          } catch (err) {
            console.error('Lỗi tải thông tin user Firestore:', err);
            // Fallback an toàn nếu lỗi mạng: vẫn cấp quyền admin nếu email là ducanht@gmail.com
            const fallbackData = buildUserData(fbUser, null);
            setCurrentUser(fallbackData);
            setRole(fallbackData.role);
          }
        } else {
          setCurrentUser(null);
          setRole(null);
        }
        setLoading(false);
      });
    } else {
      setCurrentUser(null);
      setRole(null);
      setLoading(false);
    }

    return () => unsubscribe();
  }, []);

  // Hàm Đăng nhập bằng Email & Mật khẩu bảo mật qua Firebase Auth
  const login = async (email, password) => {
    // 1. Kiểm tra Rate Limiting chống Brute-Force
    const now = Date.now();
    if (lockUntilTime > now) {
      const waitSec = Math.ceil((lockUntilTime - now) / 1000);
      const msg = `Phát hiện nhiều lần đăng nhập không thành công. Hệ thống tạm khóa trong ${waitSec} giây để bảo vệ an toàn thông tin!`;
      setAuthError(msg);
      throw new Error(msg);
    }

    setLoading(true);
    setAuthError(null);

    try {
      if (!isFirebaseConfigured || !auth) {
        throw new Error('Hệ thống xác thực Firebase chưa sẵn sàng. Vui lòng kiểm tra kết nối.');
      }

      const userCredential = await signInWithEmailAndPassword(auth, email.trim(), password);
      const fbUser = userCredential.user;
      const profile = await getUserProfile(fbUser.uid, fbUser.email);
      
      // Kiểm tra trạng thái tài khoản
      if (profile?.status && profile.status !== 'ACTIVE') {
        await firebaseSignOut(auth);
        throw new Error('Tài khoản của đồng chí đã bị tạm dừng hoạt động bởi Ban Quản trị.');
      }

      const userData = buildUserData(fbUser, profile);
      
      failedAttempts = 0; // Reset số lần sai
      setCurrentUser(userData);
      setRole(userData.role);
      setLoading(false);
      return { success: true, user: userData };
    } catch (error) {
      setLoading(false);
      failedAttempts += 1;
      if (failedAttempts >= 5) {
        lockUntilTime = Date.now() + 30000; // Khóa 30 giây
      }
      let errorMsg = error.message || 'Đăng nhập không thành công. Vui lòng kiểm tra lại thông tin.';
      if (error.code === 'auth/user-not-found' || error.code === 'auth/wrong-password' || error.code === 'auth/invalid-credential') {
        errorMsg = 'Email hoặc mật khẩu không chính xác.';
      } else if (error.code === 'auth/too-many-requests') {
        errorMsg = 'Quá nhiều lần thử thất bại. Vui lòng thử lại sau ít phút.';
      } else if (error.code === 'auth/invalid-email') {
        errorMsg = 'Định dạng email không hợp lệ.';
      }
      setAuthError(errorMsg);
      throw new Error(errorMsg);
    }
  };

  // Hàm Đăng nhập bằng Google
  const loginWithGoogle = async () => {
    setLoading(true);
    setAuthError(null);

    try {
      if (!isFirebaseConfigured || !auth || !googleProvider) {
        throw new Error('Đăng nhập Google chưa được cấu hình.');
      }

      const result = await signInWithPopup(auth, googleProvider);
      const fbUser = result.user;

      // Tra cứu hồ sơ từ Firestore
      let profile = await getUserProfile(fbUser.uid, fbUser.email);
      if (!profile) {
        profile = await syncUserProfile(fbUser);
      }

      if (profile?.status && profile.status !== 'ACTIVE') {
        await firebaseSignOut(auth);
        throw new Error('Tài khoản đã bị tạm dừng hoạt động. Vui lòng liên hệ Văn phòng Quỹ!');
      }

      const userData = buildUserData(fbUser, profile);

      failedAttempts = 0;
      setCurrentUser(userData);
      setRole(userData.role);
      setLoading(false);
      return { success: true, user: userData };

      failedAttempts = 0;
      setCurrentUser(userData);
      setRole(userData.role);
      setLoading(false);
      return { success: true, user: userData };
    } catch (error) {
      setLoading(false);
      console.error('Lỗi xác thực Google:', error);
      let errorMsg = 'Đăng nhập bằng tài khoản Google không thành công.';
      if (error.code === 'auth/popup-closed-by-user') {
        errorMsg = 'Cửa sổ xác thực Google đã bị đóng trước khi hoàn tất.';
      } else if (error.code === 'auth/popup-blocked') {
        errorMsg = 'Trình duyệt đã chặn cửa sổ pop-up. Vui lòng cho phép mở pop-up để đăng nhập.';
      } else if (error.code === 'auth/unauthorized-domain') {
        errorMsg = 'Tên miền chưa được cấp phép trong danh sách Authorized Domains của Firebase.';
      }
      setAuthError(errorMsg);
      throw new Error(errorMsg);
    }
  };

  // Hàm Đổi mật khẩu lần đầu hoặc theo yêu cầu bảo mật
  const changeUserPassword = async (newPassword) => {
    if (!newPassword || newPassword.trim().length < 6) {
      throw new Error('Mật khẩu mới phải có tối thiểu 6 ký tự.');
    }
    if (newPassword.trim() === 'Qtd@2003') {
      throw new Error('Mật khẩu mới không được trùng với mật khẩu mặc định (Qtd@2003).');
    }

    try {
      if (isFirebaseConfigured && auth && auth.currentUser) {
        await updatePassword(auth.currentUser, newPassword.trim());
      }

      // Cập nhật trạng thái Firestore: mustChangePassword = false
      if (db && currentUser?.id) {
        await updateDoc(doc(db, 'users', currentUser.id), {
          mustChangePassword: false,
          passwordChangedAt: serverTimestamp(),
        }).catch((err) => console.warn('Cập nhật Firestore user doc thất bại:', err));
      }

      // Cập nhật state nội bộ
      setCurrentUser((prev) => (prev ? { ...prev, mustChangePassword: false } : null));

      return { success: true };
    } catch (err) {
      console.error('Lỗi khi đổi mật khẩu tài khoản:', err);
      let msg = err.message || 'Không thể đổi mật khẩu. Vui lòng thử lại.';
      if (err.code === 'auth/requires-recent-login') {
        msg = 'Phiên làm việc đã hết hạn xác thực. Vui lòng đăng nhập lại để thực hiện đổi mật khẩu.';
      } else if (err.code === 'auth/weak-password') {
        msg = 'Mật khẩu quá yếu. Vui lòng chọn mật khẩu gồm cả chữ và số an toàn hơn.';
      }
      throw new Error(msg);
    }
  };

  // Đăng xuất
  const logout = async () => {
    try {
      if (isFirebaseConfigured && auth) {
        await firebaseSignOut(auth);
      }
      setCurrentUser(null);
      setRole(null);
    } catch (err) {
      console.error('Lỗi đăng xuất:', err);
    }
  };

  // Phân quyền chuẩn: Chủ tịch HĐQT & Giám đốc là Admin, các tài khoản khác là Staff
  const isAdmin = role === ROLES.ADMIN || role === 'admin' || role === 'chairman' || role === 'manager';
  const isStaff = role === ROLES.STAFF || role === 'staff';
  const isManager = isAdmin;
  const isChairman = isAdmin;
  const canAccessDashboard = isAdmin;

  const value = {
    currentUser,
    role,
    loading,
    authError,
    isAdmin,
    isStaff,
    isManager,
    isChairman,
    canAccessDashboard,
    isDemoMode: false,
    login,
    loginWithGoogle,
    logout,
    changeUserPassword,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
