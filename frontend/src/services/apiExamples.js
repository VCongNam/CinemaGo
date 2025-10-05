/**
 * API Usage Examples
 * Ví dụ cách sử dụng API Service
 */

import apiService from './apiService';
import authService from './authService';

// ==================== AUTHENTICATION EXAMPLES ====================

/**
 * Đăng nhập
 */
export const loginExample = async (credentials) => {
  return new Promise((resolve, reject) => {
    apiService.post('/auth/login-customer', credentials, (data, success) => {
      if (success) {
        // Lưu token và user info
        authService.setAuthData(data.accessToken, data.user);
        resolve(data);
      } else {
        reject(data);
      }
    });
  });
};

/**
 * Đăng ký
 */
export const registerExample = async (userData) => {
  return new Promise((resolve, reject) => {
    apiService.post('/auth/register-customer', userData, (data, success) => {
      if (success) {
        resolve(data);
      } else {
        reject(data);
      }
    });
  });
};

/**
 * Cập nhật profile
 */
export const updateProfileExample = async (profileData) => {
  return new Promise((resolve, reject) => {
    apiService.put('/auth/update-profile', profileData, (data, success) => {
      if (success) {
        // Cập nhật user info trong localStorage
        authService.updateUser(data.user);
        resolve(data);
      } else {
        reject(data);
      }
    });
  });
};

/**
 * Đổi mật khẩu
 */
export const changePasswordExample = async (passwordData) => {
  return new Promise((resolve, reject) => {
  apiService.put('/change-password', passwordData, (data, success) => {
      if (success) {
        resolve(data);
      } else {
        reject(data);
      }
    });
  });
};

// ==================== CRUD EXAMPLES ====================

/**
 * Lấy danh sách movies
 */ 
export const getMoviesExample = async (params = {}) => {
  return new Promise((resolve, reject) => {
    apiService.get('/movies', params, (data, success) => {
      if (success) {
        resolve(data);
      } else {
        reject(data);
      }
    });
  });
};

/**
 * Lấy chi tiết movie
 */
export const getMovieByIdExample = async (id) => {
  return new Promise((resolve, reject) => {
    apiService.getById('/movies/', id, (data, success) => {
      if (success) {
        resolve(data);
      } else {
        reject(data);
      }
    });
  });
};

/**
 * Tạo movie mới
 */
export const createMovieExample = async (movieData) => {
  return new Promise((resolve, reject) => {
    apiService.post('/movies', movieData, (data, success) => {
      if (success) {
        resolve(data);
      } else {
        reject(data);
      }
    });
  });
};

/**
 * Cập nhật movie
 */
export const updateMovieExample = async (id, movieData) => {
  return new Promise((resolve, reject) => {
    apiService.put(`/movies/${id}`, movieData, (data, success) => {
      if (success) {
        resolve(data);
      } else {
        reject(data);
      }
    });
  });
};

/**
 * Xóa movie
 */
export const deleteMovieExample = async (id) => {
  return new Promise((resolve, reject) => {
    apiService.deleteById('/movies/', id, (data, success) => {
      if (success) {
        resolve(data);
      } else {
        reject(data);
      }
    });
  });
};

// ==================== FILE UPLOAD EXAMPLES ====================

/**
 * Upload file đơn giản
 */
export const uploadFileExample = async (file) => {
  return new Promise((resolve, reject) => {
    apiService.uploadFile('/upload', file, (data, success) => {
      if (success) {
        resolve(data);
      } else {
        reject(data);
      }
    });
  });
};

/**
 * Upload file với progress tracking
 */
export const uploadFileWithProgressExample = async (file, onProgress) => {
  return new Promise((resolve, reject) => {
    apiService.uploadFileWithProgress('/upload', file, onProgress, (data, success) => {
      if (success) {
        resolve(data);
      } else {
        reject(data);
      }
    });
  });
};

/**
 * Upload file với params
 */
export const uploadFileWithParamsExample = async (file, params) => {
  return new Promise((resolve, reject) => {
    apiService.uploadFileWithParams('/upload', file, params, null, (data, success) => {
      if (success) {
        resolve(data);
      } else {
        reject(data);
      }
    });
  });
};

// ==================== REACT HOOK EXAMPLES ====================

/**
 * Custom hook cho authentication
 */
export const useAuth = () => {
  const isAuthenticated = authService.isAuthenticated();
  const user = authService.getUser();
  const token = authService.getToken();

  const login = async (credentials) => {
    try {
      const data = await loginExample(credentials);
      return { success: true, data };
    } catch (error) {
      return { success: false, error };
    }
  };

  const logout = () => {
    authService.logout();
  };

  const updateProfile = async (profileData) => {
    try {
      const data = await updateProfileExample(profileData);
      return { success: true, data };
    } catch (error) {
      return { success: false, error };
    }
  };

  return {
    isAuthenticated,
    user,
    token,
    login,
    logout,
    updateProfile
  };
};

// ==================== USAGE IN COMPONENTS ====================

/**
 * Ví dụ sử dụng trong React component
 */
export const ExampleComponent = () => {
  const { isAuthenticated, user, login, logout, updateProfile } = useAuth();

  const handleLogin = async () => {
    const result = await login({ username: 'test', password: '123' });
    if (result.success) {
      console.log('Login successful:', result.data);
    } else {
      console.error('Login failed:', result.error);
    }
  };

  const handleUpdateProfile = async () => {
    const result = await updateProfile({ fullName: 'New Name' });
    if (result.success) {
      console.log('Profile updated:', result.data);
    } else {
      console.error('Update failed:', result.error);
    }
  };

  const handleGetMovies = async () => {
    try {
      const movies = await getMoviesExample({ page: 1, limit: 10 });
      console.log('Movies:', movies);
    } catch (error) {
      console.error('Error fetching movies:', error);
    }
  };

  if (!isAuthenticated) {
    return (
      <div>
        <h1>Please Login</h1>
        <button onClick={handleLogin}>Login</button>
      </div>
    );
  }

  return (
    <div>
      <h1>Welcome, {user?.fullName}</h1>
      <button onClick={handleUpdateProfile}>Update Profile</button>
      <button onClick={handleGetMovies}>Get Movies</button>
      <button onClick={logout}>Logout</button>
    </div>
  );
};

export default {
  loginExample,
  registerExample,
  updateProfileExample,
  changePasswordExample,
  getMoviesExample,
  getMovieByIdExample,
  createMovieExample,
  updateMovieExample,
  deleteMovieExample,
  uploadFileExample,
  uploadFileWithProgressExample,
  uploadFileWithParamsExample,
  useAuth,
  ExampleComponent
};
