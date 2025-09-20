/**
 * Authentication Service
 * Quản lý authentication state và token
 */

class AuthService {
  constructor() {
    this.tokenKey = 'accessToken';
    this.userKey = 'user';
  }

  /**
   * Lưu token và user info
   */
  setAuthData(token, user) {
    localStorage.setItem(this.tokenKey, token);
    localStorage.setItem(this.userKey, JSON.stringify(user));
  }

  /**
   * Lấy token
   */
  getToken() {
    return localStorage.getItem(this.tokenKey);
  }

  /**
   * Lấy user info
   */
  getUser() {
    const userStr = localStorage.getItem(this.userKey);
    return userStr ? JSON.parse(userStr) : null;
  }

  /**
   * Kiểm tra đã đăng nhập chưa
   */
  isAuthenticated() {
    return !!this.getToken();
  }

  /**
   * Xóa auth data
   */
  clearAuthData() {
    localStorage.removeItem(this.tokenKey);
    localStorage.removeItem(this.userKey);
  }

  /**
   * Logout
   */
  logout() {
    this.clearAuthData();
    window.location.href = '/login';
  }

  /**
   * Cập nhật user info
   */
  updateUser(userData) {
    const currentUser = this.getUser();
    if (currentUser) {
      const updatedUser = { ...currentUser, ...userData };
      localStorage.setItem(this.userKey, JSON.stringify(updatedUser));
    }
  }
}

// Tạo instance duy nhất
const authService = new AuthService();

export default authService;
