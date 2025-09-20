/**
 * Common API Service
 * Hỗ trợ các phương thức HTTP cơ bản với token authentication
 */

class ApiService {
  constructor() {
    this.baseURL = process.env.REACT_APP_API_URL || '/api';
  }

  /**
   * Lấy token từ localStorage
   */
  getToken() {
    return localStorage.getItem('accessToken');
  }

  /**
   * Xử lý lỗi 401 - Unauthorized
   */
  handleUnauthorized() {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('user');
    window.location.href = '/login';
  }

  /**
   * Tạo headers cho request
   */
  createHeaders(includeAuth = true, contentType = 'application/json') {
    const headers = {
      'Content-Type': contentType,
    };

    if (includeAuth) {
      const token = this.getToken();
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }
    }

    return headers;
  }

  /**
   * Xử lý response
   */
  async handleResponse(response, callback) {
    if (response.status === 401) {
      this.handleUnauthorized();
      if (callback) callback(null, false);
      return;
    }

    try {
      const data = await response.json();
      if (callback) callback(data, response.ok);
    } catch (error) {
      if (callback) callback(error, false);
    }
  }

  /**
   * GET request
   */
  async get(url, params = {}, callback = null) {
    try {
      const queryString = new URLSearchParams(params).toString();
      const fullUrl = queryString ? `${this.baseURL}${url}?${queryString}` : `${this.baseURL}${url}`;
      
      const response = await fetch(fullUrl, {
        method: 'GET',
        headers: this.createHeaders(),
      });

      await this.handleResponse(response, callback);
    } catch (error) {
      if (callback) callback(error, false);
    }
  }

  /**
   * GET request với params array
   */
  async getWithParams(url, params = [], callback = null) {
    try {
      let requestUrl = `${this.baseURL}${url}`;
      
      if (params.length > 0) {
        const queryString = params
          .map(param => `${param.key}=${encodeURIComponent(param.value)}`)
          .join('&');
        requestUrl += `?${queryString}`;
      }

      const response = await fetch(requestUrl, {
        method: 'GET',
        headers: this.createHeaders(),
      });

      await this.handleResponse(response, callback);
    } catch (error) {
      if (callback) callback(error, false);
    }
  }

  /**
   * GET request không redirect khi 401
   */
  async getNoRedirect(url, params = {}, callback = null) {
    try {
      const queryString = new URLSearchParams(params).toString();
      const fullUrl = queryString ? `${this.baseURL}${url}?${queryString}` : `${this.baseURL}${url}`;
      
      const response = await fetch(fullUrl, {
        method: 'GET',
        headers: this.createHeaders(),
      });

      if (response.status === 401) {
        localStorage.removeItem('accessToken');
        localStorage.removeItem('user');
        const errorData = await response.json();
        if (callback) callback(errorData, false);
        return;
      }

      await this.handleResponse(response, callback);
    } catch (error) {
      if (callback) callback(error, false);
    }
  }

  /**
   * POST request
   */
  async post(url, data = {}, callback = null) {
    try {
      const response = await fetch(`${this.baseURL}${url}`, {
        method: 'POST',
        headers: this.createHeaders(),
        body: JSON.stringify(data),
      });

      await this.handleResponse(response, callback);
    } catch (error) {
      if (callback) callback(error, false);
    }
  }

  /**
   * POST request với params
   */
  async postWithParams(url, params = [], callback = null) {
    try {
      let requestUrl = `${this.baseURL}${url}`;
      
      if (params.length > 0) {
        const queryString = params
          .map(param => `${param.key}=${encodeURIComponent(param.value)}`)
          .join('&');
        requestUrl += `?${queryString}`;
      }

      const response = await fetch(requestUrl, {
        method: 'POST',
        headers: this.createHeaders(),
      });

      await this.handleResponse(response, callback);
    } catch (error) {
      if (callback) callback(error, false);
    }
  }

  /**
   * PUT request
   */
  async put(url, data = {}, callback = null) {
    try {
      const response = await fetch(`${this.baseURL}${url}`, {
        method: 'PUT',
        headers: this.createHeaders(),
        body: JSON.stringify(data),
      });

      await this.handleResponse(response, callback);
    } catch (error) {
      if (callback) callback(error, false);
    }
  }

  /**
   * PUT request với params
   */
  async putWithParams(url, params = [], callback = null) {
    try {
      let requestUrl = `${this.baseURL}${url}`;
      
      if (params.length > 0) {
        const queryString = params
          .map(param => `${param.key}=${encodeURIComponent(param.value)}`)
          .join('&');
        requestUrl += `?${queryString}`;
      }

      const response = await fetch(requestUrl, {
        method: 'PUT',
        headers: this.createHeaders(),
      });

      await this.handleResponse(response, callback);
    } catch (error) {
      if (callback) callback(error, false);
    }
  }

  /**
   * PATCH request
   */
  async patch(url, data = {}, callback = null) {
    try {
      const response = await fetch(`${this.baseURL}${url}`, {
        method: 'PATCH',
        headers: this.createHeaders(),
        body: JSON.stringify(data),
      });

      await this.handleResponse(response, callback);
    } catch (error) {
      if (callback) callback(error, false);
    }
  }

  /**
   * PATCH request với params
   */
  async patchWithParams(url, params = [], callback = null) {
    try {
      let requestUrl = `${this.baseURL}${url}`;
      
      if (params.length > 0) {
        const queryString = params
          .map(param => `${param.key}=${encodeURIComponent(param.value)}`)
          .join('&');
        requestUrl += `?${queryString}`;
      }

      const response = await fetch(requestUrl, {
        method: 'PATCH',
        headers: this.createHeaders(),
      });

      await this.handleResponse(response, callback);
    } catch (error) {
      if (callback) callback(error, false);
    }
  }

  /**
   * DELETE request
   */
  async delete(url, data = {}, callback = null) {
    try {
      const response = await fetch(`${this.baseURL}${url}`, {
        method: 'DELETE',
        headers: this.createHeaders(),
        body: JSON.stringify(data),
      });

      await this.handleResponse(response, callback);
    } catch (error) {
      if (callback) callback(error, false);
    }
  }

  /**
   * DELETE request với ID
   */
  async deleteById(url, id, callback = null) {
    try {
      const response = await fetch(`${this.baseURL}${url}${id}`, {
        method: 'DELETE',
        headers: this.createHeaders(),
      });

      await this.handleResponse(response, callback);
    } catch (error) {
      if (callback) callback(error, false);
    }
  }

  /**
   * DELETE request với params
   */
  async deleteWithParams(url, params = [], callback = null) {
    try {
      let requestUrl = `${this.baseURL}${url}`;
      
      if (params.length > 0) {
        const queryString = params
          .map(param => `${param.key}=${encodeURIComponent(param.value)}`)
          .join('&');
        requestUrl += `?${queryString}`;
      }

      const response = await fetch(requestUrl, {
        method: 'DELETE',
        headers: this.createHeaders(),
      });

      await this.handleResponse(response, callback);
    } catch (error) {
      if (callback) callback(error, false);
    }
  }

  /**
   * GET request để lấy chi tiết theo ID
   */
  async getById(url, id, callback = null) {
    try {
      const response = await fetch(`${this.baseURL}${url}${id}`, {
        method: 'GET',
        headers: this.createHeaders(),
      });

      await this.handleResponse(response, callback);
    } catch (error) {
      if (callback) callback(error, false);
    }
  }

  /**
   * Upload file
   */
  async uploadFile(url, file, callback = null) {
    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch(`${this.baseURL}${url}`, {
        method: 'POST',
        headers: this.createHeaders(true, false), // Không set Content-Type cho FormData
        body: formData,
      });

      await this.handleResponse(response, callback);
    } catch (error) {
      if (callback) callback(error, false);
    }
  }

  /**
   * Upload file với progress tracking
   */
  async uploadFileWithProgress(url, file, onProgress, callback = null) {
    try {
      const formData = new FormData();
      formData.append('file', file);

      const xhr = new XMLHttpRequest();
      
      xhr.upload.addEventListener('progress', (evt) => {
        if (evt.lengthComputable) {
          const percentComplete = Math.round((evt.loaded / evt.total) * 100);
          onProgress(percentComplete);
        }
      });

      xhr.onload = () => {
        if (xhr.status === 401) {
          this.handleUnauthorized();
          if (callback) callback(null, false);
          return;
        }

        try {
          const data = JSON.parse(xhr.responseText);
          if (callback) callback(data, xhr.status >= 200 && xhr.status < 300);
        } catch (error) {
          if (callback) callback(error, false);
        }
      };

      xhr.onerror = () => {
        if (callback) callback(xhr, false);
      };

      xhr.open('POST', `${this.baseURL}${url}`);
      
      const token = this.getToken();
      if (token) {
        xhr.setRequestHeader('Authorization', `Bearer ${token}`);
      }

      xhr.send(formData);
    } catch (error) {
      if (callback) callback(error, false);
    }
  }

  /**
   * Upload file với params
   */
  async uploadFileWithParams(url, file, params = [], onProgress = null, callback = null) {
    try {
      const formData = new FormData();
      formData.append('file', file);
      
      params.forEach(param => {
        formData.append(param.key, param.value);
      });

      if (onProgress) {
        return this.uploadFileWithProgress(url, file, onProgress, callback);
      }

      const response = await fetch(`${this.baseURL}${url}`, {
        method: 'POST',
        headers: this.createHeaders(true, false),
        body: formData,
      });

      await this.handleResponse(response, callback);
    } catch (error) {
      if (callback) callback(error, false);
    }
  }

  /**
   * Upload file với crop
   */
  async uploadFileWithCrop(url, file, cropModel, callback = null) {
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('x', cropModel.x);
      formData.append('y', cropModel.y);
      formData.append('w', cropModel.w);
      formData.append('h', cropModel.h);
      formData.append('fw', cropModel.fw);
      formData.append('fh', cropModel.fh);

      const response = await fetch(`${this.baseURL}${url}`, {
        method: 'POST',
        headers: this.createHeaders(true, false),
        body: formData,
      });

      await this.handleResponse(response, callback);
    } catch (error) {
      if (callback) callback(error, false);
    }
  }

  /**
   * Edit file với crop
   */
  async editFileWithCrop(url, fileSlug, cropModel, callback = null) {
    try {
      const formData = new FormData();
      formData.append('file_slug', fileSlug);
      formData.append('x', cropModel.x);
      formData.append('y', cropModel.y);
      formData.append('w', cropModel.w);
      formData.append('h', cropModel.h);
      formData.append('fw', cropModel.fw);
      formData.append('fh', cropModel.fh);

      const response = await fetch(`${this.baseURL}${url}`, {
        method: 'POST',
        headers: this.createHeaders(true, false),
        body: formData,
      });

      await this.handleResponse(response, callback);
    } catch (error) {
      if (callback) callback(error, false);
    }
  }

  /**
   * GET request không cần authentication
   */
  async getPublic(url, params = {}, callback = null) {
    try {
      const queryString = new URLSearchParams(params).toString();
      const fullUrl = queryString ? `${this.baseURL}${url}?${queryString}` : `${this.baseURL}${url}`;
      
      const response = await fetch(fullUrl, {
        method: 'GET',
        headers: this.createHeaders(false),
      });

      await this.handleResponse(response, callback);
    } catch (error) {
      if (callback) callback(error, false);
    }
  }
}

// Tạo instance duy nhất
const apiService = new ApiService();

export default apiService;
