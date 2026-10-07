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
            setCurrentUser({
              uid: fbUser.uid,
              email: fbUser.email,
              name: profile?.name || fbUser.displayName || fbUser.email.split('@')[0],
              role: profile?.role || ROLES.STAFF,
              department: profile?.department || 'Phòng Tín dụng',
              position: profile?.position || 'Cán bộ',
              avatar: profile?.avatar || null,
              phone: profile?.phone || '',
            });
            setRole(profile?.role || ROLES.STAFF);
          } catch (err) {
            console.error('Lỗi tải thông tin user Firestore:', err);
            // Default fallback
            setCurrentUser({
              uid: fbUser.uid,
              email: fbUser.email,
              name: fbUser.email.split('@')[0],
              role: ROLES.STAFF,
              department: 'Phòng Tín dụng',
              position: 'Cán bộ',
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
      // Chế độ Demo: kiểm tra tài khoản lưu gần nhất trong localStorage hoặc mặc định Cán bộ
      const savedDemoUser = localStorage.getItem('qtd_hrm_active_user');
      if (savedDemoUser) {
        try {
          const parsed = JSON.parse(savedDemoUser);
          setCurrentUser(parsed);
          setRole(parsed.role);
        } catch {
          // Default cán bộ
          const defaultStaff = INITIAL_EMPLOYEES[2]; // Nguyễn Văn An (staff)
          setCurrentUser(defaultStaff);
          setRole(defaultStaff.role);
        }
      } else {
        // Mặc định đăng nhập với tài khoản Cán bộ để người dùng thấy giao diện ngay
        const defaultStaff = INITIAL_EMPLOYEES[2];
        setCurrentUser(defaultStaff);
        setRole(defaultStaff.role);
        localStorage.setItem('qtd_hrm_active_user', JSON.stringify(defaultStaff));
      }
      setLoading(false);
    }

    return () => unsubscribe();
  }, []);

  // Hàm Đăng nhập bằng Email & Mật khẩu
  const login = async (email, password) => {
    setLoading(true);
    setAuthError(null);

    try {
      if (isFirebaseConfigured && auth) {
        const userCredential = await signInWithEmailAndPassword(auth, email, password);
        const fbUser = userCredential.user;
        const profile = await getUserProfile(fbUser.uid, fbUser.email);
        
        const userData = {
          uid: fbUser.uid,
          email: fbUser.email,
          name: profile?.name || fbUser.displayName || fbUser.email.split('@')[0],
          role: profile?.role || ROLES.STAFF,
          department: profile?.department || 'Phòng Tín dụng',
          position: profile?.position || 'Cán bộ',
          avatar: profile?.avatar || null,
          phone: profile?.phone || '',
        };
        
        setCurrentUser(userData);
        setRole(userData.role);
        setLoading(false);
        return { success: true, user: userData };
      } else {
        // Xử lý đăng nhập trong Chế độ Demo
        const matched = INITIAL_EMPLOYEES.find(
          (e) => e.email.toLowerCase() === email.trim().toLowerCase()
        );

        let userToSet;
        if (matched) {
          userToSet = matched;
        } else {
          // Tạo user ảo với role staff nếu nhập email mới
          userToSet = {
            id: `emp-demo-${Date.now()}`,
            code: 'CB-DEMO',
            name: email.split('@')[0].toUpperCase(),
            email: email.trim(),
            role: ROLES.STAFF,
            department: 'Phòng Tín dụng',
            position: 'Cán bộ thử nghiệm',
            avatar: null,
            phone: '0900.000.000',
          };
        }

        setCurrentUser(userToSet);
        setRole(userToSet.role);
        localStorage.setItem('qtd_hrm_active_user', JSON.stringify(userToSet));
        setLoading(false);
        return { success: true, user: userToSet };
      }
    } catch (error) {
      setLoading(false);
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
