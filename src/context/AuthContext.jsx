import React, { createContext, useContext, useState, useEffect } from 'react';
import { 
  signInWithEmailAndPassword, 
  signInWithPopup,
  signOut as firebaseSignOut, 
  onAuthStateChanged
} from 'firebase/auth';
import { auth, googleProvider, isFirebaseConfigured } from '../lib/firebase';
import { getUserProfile, syncUserProfile } from '../lib/services';
import { ROLES } from '../lib/constants';

const AuthContext = createContext(null);

// Biến kiểm soát số lần đăng nhập sai (Anti Brute-Force Rate Limiter)
let failedAttempts = 0;
let lockUntilTime = 0;

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

            const userData = {
              uid: fbUser.uid,
              id: profile?.id || fbUser.uid,
              code: profile?.code || 'CB-QT',
              email: fbUser.email,
              name: profile?.name || fbUser.displayName || fbUser.email.split('@')[0],
              role: profile?.role || ROLES.STAFF,
              department: profile?.department || 'Phòng Tín dụng',
              position: profile?.position || 'Cán bộ',
              avatar: profile?.avatar || null,
              phone: profile?.phone || '',
              status: profile?.status || 'ACTIVE',
              partyMember: Boolean(profile?.partyMember),
              politicalRole: profile?.politicalRole || '',
              assignedArea: profile?.assignedArea || '',
            };

            setCurrentUser(userData);
            setRole(userData.role);
          } catch (err) {
            console.error('Lỗi tải thông tin user Firestore:', err);
            setCurrentUser(null);
            setRole(null);
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

      const userData = {
        uid: fbUser.uid,
        id: profile?.id || fbUser.uid,
        code: profile?.code || 'CB-QT',
        email: fbUser.email,
        name: profile?.name || fbUser.displayName || fbUser.email.split('@')[0],
        role: profile?.role || ROLES.STAFF,
        department: profile?.department || 'Phòng Tín dụng',
        position: profile?.position || 'Cán bộ',
        avatar: profile?.avatar || null,
        phone: profile?.phone || '',
        status: profile?.status || 'ACTIVE',
        partyMember: Boolean(profile?.partyMember),
        politicalRole: profile?.politicalRole || '',
        assignedArea: profile?.assignedArea || '',
      };
      
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

      const userData = {
        uid: fbUser.uid,
        id: profile?.id || fbUser.uid,
        code: profile?.code || 'CB-QT',
        email: fbUser.email,
        name: profile?.name || fbUser.displayName || fbUser.email.split('@')[0],
        role: profile?.role || ROLES.STAFF,
        department: profile?.department || 'Phòng Tín dụng',
        position: profile?.position || 'Cán bộ',
        avatar: profile?.avatar || fbUser.photoURL || null,
        phone: profile?.phone || '',
        status: profile?.status || 'ACTIVE',
        partyMember: Boolean(profile?.partyMember),
        politicalRole: profile?.politicalRole || '',
        assignedArea: profile?.assignedArea || '',
      };

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

  const isStaff = role === ROLES.STAFF;
  const isManager = role === ROLES.MANAGER;
  const isChairman = role === ROLES.CHAIRMAN;
  const canAccessDashboard = isManager || isChairman;

  const value = {
    currentUser,
    role,
    loading,
    authError,
    isStaff,
    isManager,
    isChairman,
    canAccessDashboard,
    isDemoMode: false,
    login,
    loginWithGoogle,
    logout,
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
