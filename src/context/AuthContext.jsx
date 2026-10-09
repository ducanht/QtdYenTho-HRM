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

// 1. Nhận diện tài khoản Quản trị Cấp cao DUY NHẤT (SuperAdmin)
export const isSuperAdminEmail = (email) => {
  if (!email) return false;
  return email.trim().toLowerCase() === 'qtdyentho@gmail.com';
};

// 2. Nhận diện tài khoản Ban Quản trị & Điều hành (Admin: CT HĐQT, Giám đốc, TV HĐQT)
export const isAdminEmail = (email) => {
  if (!email) return false;
  const lower = email.trim().toLowerCase();
  return (
    lower === 'qtdyentho@gmail.com' ||
    lower === 'ducanht@gmail.com' ||
    lower === 'ducanhqtdyt@gmail.com' ||
    lower === 'nguyenducthao.qtd@gmail.com' ||
    lower === 'ducanht.gemini@gmail.com' ||
    lower === 'sonqtdyt@gmail.com' ||
    lower === 'nguyenvansontdyt@gmail.com' ||
    lower === 'qtdyentho.vuhien@gmail.com' ||
    lower.includes('admin') ||
    lower.includes('chutich') ||
    lower.includes('giamdoc') ||
    lower.includes('hdqt')
  );
};

// Hàm chuẩn hóa hồ sơ cán bộ khi đăng nhập
export const buildUserData = (fbUser, profile) => {
  const superFlag = isSuperAdminEmail(fbUser?.email);
  const adminFlag = superFlag || isAdminEmail(fbUser?.email) || profile?.department === 'Hội đồng Quản trị';
  
  let resolvedRole = ROLES.STAFF;
  if (superFlag) {
    resolvedRole = ROLES.SUPERADMIN;
  } else if (profile?.role) {
    resolvedRole = profile.role;
  } else if (adminFlag) {
    resolvedRole = ROLES.ADMIN;
  }

  // Tự động suy luận thông tin hiển thị chuẩn theo email lãnh đạo nếu chưa có profile
  const emailLower = fbUser?.email?.toLowerCase() || '';
  let defaultName = fbUser?.displayName || emailLower.split('@')[0];
  let defaultPosition = 'Cán bộ';
  let defaultDepartment = 'Phòng Tín dụng';
  let defaultCode = 'CB-QT';
  let defaultPartyRole = '';
  let defaultArea = '';

  if (superFlag) {
    defaultName = 'Quản trị viên Cấp cao (SuperAdmin)';
    defaultPosition = 'Quản trị viên Cấp cao';
    defaultDepartment = 'Hệ thống Quản trị Webapp';
    defaultCode = 'ROOT';
    defaultArea = 'Quản trị toàn diện Webapp, Feature Flags & Cấu hình tham số';
  } else if (emailLower.includes('ducanh') || emailLower.includes('nguyenducthao')) {
    defaultName = 'Trịnh Đức Anh';
    defaultPosition = 'Chủ tịch HĐQT';
    defaultDepartment = 'Hội đồng Quản trị';
    defaultCode = 'CB07';
    defaultPartyRole = 'Bí thư Chi bộ';
    defaultArea = 'Lãnh đạo toàn diện HĐQT & Định hướng chiến lược Quỹ';
  } else if (emailLower.includes('son') || emailLower.includes('giamdoc')) {
    defaultName = 'Nguyễn Văn Sơn';
    defaultPosition = 'Giám đốc';
    defaultDepartment = 'Ban Điều hành';
    defaultCode = 'CB03';
    defaultPartyRole = 'Phó Bí thư Chi bộ';
    defaultArea = 'Điều hành toàn diện hoạt động kinh doanh Quỹ';
  } else if (emailLower.includes('vuhien') || emailLower.includes('hdqt')) {
    defaultName = 'Vũ Thị Hiền';
    defaultPosition = 'Thành viên HĐQT chuyên trách';
    defaultDepartment = 'Hội đồng Quản trị';
    defaultCode = 'TV-HDQT';
    defaultPartyRole = 'Đảng viên';
    defaultArea = 'Thành viên Hội đồng Quản trị chuyên trách';
  }

  return {
    uid: fbUser.uid,
    id: profile?.id || fbUser.uid,
    code: profile?.code || defaultCode,
    email: fbUser.email,
    name: profile?.name || defaultName,
    role: resolvedRole,
    department: profile?.department || defaultDepartment,
    position: profile?.position || defaultPosition,
    avatar: profile?.avatar || fbUser.photoURL || null,
    phone: profile?.phone || (adminFlag ? '0965122111' : ''),
    status: profile?.status || 'ACTIVE',
    partyMember: profile ? Boolean(profile.partyMember) : (adminFlag ? true : false),
    politicalRole: profile?.politicalRole || defaultPartyRole,
    assignedArea: profile?.assignedArea || defaultArea,
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

  // Phân cấp quyền chuẩn:
  // 1. Quản trị viên Cấp cao (SuperAdmin): DUY NHẤT qtdyentho@gmail.com
  const isSuperAdmin = isSuperAdminEmail(currentUser?.email) || role === ROLES.SUPERADMIN || role === 'superadmin';

  // 2. Ban Quản trị & Điều hành (Admin: CT HĐQT, Giám đốc, TV HĐQT + SuperAdmin)
  const isAdmin = isSuperAdmin || role === ROLES.ADMIN || role === 'admin' || role === 'chairman' || role === 'manager';

  // 3. Phân quyền chi tiết từng chức danh
  const isChairman = isAdmin && (currentUser?.email?.toLowerCase().includes('ducanh') || currentUser?.position?.includes('Chủ tịch') || role === 'chairman');
  const isManager = isAdmin && (currentUser?.email?.toLowerCase().includes('son') || currentUser?.position?.includes('Giám đốc') || role === 'manager');
  const isBoardMember = isAdmin && (currentUser?.department?.includes('Hội đồng Quản trị') || currentUser?.position?.includes('HĐQT'));
  const isStaff = !isAdmin;

  // 4. Quyền Bật/tắt Module Webapp & Cấu hình Tham số Hệ thống
  // - Bật/tắt Module (Feature Flags): Chỉ SuperAdmin và Chủ tịch HĐQT (Chairman)
  // - Cấu hình CSDL: SuperAdmin và Ban Lãnh đạo Quỹ
  const canToggleModules = isSuperAdmin || isChairman;
  const canConfigureWebapp = isSuperAdmin || isAdmin;
  const canManageDatabase = isSuperAdmin || isAdmin;
  const canAccessDashboard = isAdmin || role === 'supervisor' || role === 'board_member' || currentUser?.department?.includes('Ban Kiểm soát') || currentUser?.department?.includes('Hội đồng Quản trị');

  const value = {
    currentUser,
    role,
    loading,
    authError,
    isSuperAdmin,
    isAdmin,
    isStaff,
    isManager,
    isChairman,
    isBoardMember,
    canToggleModules,
    canConfigureWebapp,
    canManageDatabase,
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
