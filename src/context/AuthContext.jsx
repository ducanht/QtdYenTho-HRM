import React, { createContext, useContext, useState, useEffect } from 'react';
import { 
  signInWithEmailAndPassword, 
  signOut as firebaseSignOut, 
  onAuthStateChanged,
  createUserWithEmailAndPassword
} from 'firebase/auth';
import { auth, isFirebaseConfigured } from '../lib/firebase';
import { getUserProfile } from '../lib/services';
import { INITIAL_EMPLOYEES, ROLES } from '../lib/mockData';

const AuthContext = createContext(null);

// Biến kiểm soát số lần đăng nhập sai (Anti Brute-Force Rate Limiter)
let failedAttempts = 0;
let lockUntilTime = 0;

export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [role, setRole] = useState(null);
  const [loading, setLoading] = useState(true);
  const [authError, setAuthError] = useState(null);

  // Khởi tạo trạng thái xác thực
  useEffect(() => {
    let unsubscribe = () => {};

    if (isFirebaseConfigured && auth) {
      unsubscribe = onAuthStateChanged(auth, async (fbUser) => {
        if (fbUser) {
          try {
            // Lấy thông tin role và phòng ban từ Firestore collection 'users'
            const profile = await getUserProfile(fbUser.uid, fbUser.email);
            if (profile?.status && profile.status !== 'ACTIVE') {
              console.warn('Tài khoản đã bị tạm dừng hoạt động:', profile);
              await firebaseSignOut(auth);
              setCurrentUser(null);
              setRole(null);
              setLoading(false);
              return;
            }

            setCurrentUser({
              uid: fbUser.uid,
              email: fbUser.email,
              name: profile?.name || fbUser.displayName || fbUser.email.split('@')[0],
              role: profile?.role || ROLES.STAFF,
              department: profile?.department || 'Phòng Tín dụng',
              position: profile?.position || 'Cán bộ',
              avatar: profile?.avatar || null,
              phone: profile?.phone || '',
              status: profile?.status || 'ACTIVE',
            });
            setRole(profile?.role || ROLES.STAFF);
          } catch (err) {
            console.error('Lỗi tải thông tin user Firestore:', err);
            setCurrentUser({
              uid: fbUser.uid,
              email: fbUser.email,
              name: fbUser.email.split('@')[0],
              role: ROLES.STAFF,
              department: 'Phòng Tín dụng',
              position: 'Cán bộ',
              status: 'ACTIVE',
            });
            setRole(ROLES.STAFF);
          }
        } else {
          setCurrentUser(null);
          setRole(null);
        }
        setLoading(false);
      });
    } else {
      // Chế độ dữ liệu nội bộ ban đầu
      const savedUser = localStorage.getItem('qtd_hrm_active_user');
      if (savedUser) {
        try {
          const parsed = JSON.parse(savedUser);
          setCurrentUser(parsed);
          setRole(parsed.role);
        } catch {
          const defaultStaff = INITIAL_EMPLOYEES[2]; // Nguyễn Văn An (staff)
          setCurrentUser(defaultStaff);
          setRole(defaultStaff.role);
        }
      } else {
        const defaultStaff = INITIAL_EMPLOYEES[2];
        setCurrentUser(defaultStaff);
        setRole(defaultStaff.role);
        localStorage.setItem('qtd_hrm_active_user', JSON.stringify(defaultStaff));
      }
      setLoading(false);
    }

    return () => unsubscribe();
  }, []);

  // Hàm Đăng nhập bằng Email & Mật khẩu bảo mật
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
      if (isFirebaseConfigured && auth) {
        const userCredential = await signInWithEmailAndPassword(auth, email, password);
        const fbUser = userCredential.user;
        const profile = await getUserProfile(fbUser.uid, fbUser.email);
        
        // Kiểm tra trạng thái tài khoản
        if (profile?.status && profile.status !== 'ACTIVE') {
          await firebaseSignOut(auth);
          throw new Error('Tài khoản của đồng chí đã bị tạm khóa bởi Ban Quản trị. Vui lòng liên hệ Văn phòng Quỹ!');
        }

        const userData = {
          uid: fbUser.uid,
          email: fbUser.email,
          name: profile?.name || fbUser.displayName || fbUser.email.split('@')[0],
          role: profile?.role || ROLES.STAFF,
          department: profile?.department || 'Phòng Tín dụng',
          position: profile?.position || 'Cán bộ',
          avatar: profile?.avatar || null,
          phone: profile?.phone || '',
          status: profile?.status || 'ACTIVE',
        };
        
        failedAttempts = 0; // Reset số lần sai
        setCurrentUser(userData);
        setRole(userData.role);
        setLoading(false);
        return { success: true, user: userData };
      } else {
        // Xử lý đăng nhập trong Chế độ Dữ liệu Nội bộ
        const matched = INITIAL_EMPLOYEES.find(
          (e) => e.email.toLowerCase() === email.trim().toLowerCase()
        );

        let userToSet;
        if (matched) {
          if (matched.status && matched.status !== 'ACTIVE') {
            throw new Error('Tài khoản đã bị tạm dừng hoạt động.');
          }
          userToSet = matched;
        } else {
          userToSet = {
            id: `emp-usr-${Date.now()}`,
            code: 'CB-MOI',
            name: email.split('@')[0].toUpperCase(),
            email: email.trim(),
            role: ROLES.STAFF,
            department: 'Phòng Tín dụng',
            position: 'Cán bộ',
            avatar: null,
            phone: '0900.000.000',
            status: 'ACTIVE',
          };
        }

        failedAttempts = 0; // Reset số lần sai
        setCurrentUser(userToSet);
        setRole(userToSet.role);
        localStorage.setItem('qtd_hrm_active_user', JSON.stringify(userToSet));
        setLoading(false);
        return { success: true, user: userToSet };
      }
    } catch (error) {
      setLoading(false);
      failedAttempts += 1;
      if (failedAttempts >= 5) {
        lockUntilTime = Date.now() + 30000; // Khóa 30 giây
      }
      let errorMsg = 'Đăng nhập không thành công. Vui lòng kiểm tra lại thông tin.';
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

  // Đăng xuất
  const logout = async () => {
    try {
      if (isFirebaseConfigured && auth) {
        await firebaseSignOut(auth);
      }
      setCurrentUser(null);
      setRole(null);
      localStorage.removeItem('qtd_hrm_active_user');
    } catch (err) {
      console.error('Lỗi đăng xuất:', err);
    }
  };

  // Chuyển đổi nhanh vai trò / tài khoản mẫu (tiện lợi cho việc review/demo tất cả 3 phân quyền)
  const switchDemoAccount = (targetEmailOrRole) => {
    let target = INITIAL_EMPLOYEES.find((e) => e.email === targetEmailOrRole);
    if (!target) {
      target = INITIAL_EMPLOYEES.find((e) => e.role === targetEmailOrRole);
    }
    if (target) {
      setCurrentUser(target);
      setRole(target.role);
      localStorage.setItem('qtd_hrm_active_user', JSON.stringify(target));
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
    isDemoMode: !isFirebaseConfigured,
    login,
    logout,
    switchDemoAccount,
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
