// Validation middleware for movie operations
export const validateMovieStatus = (req, res, next) => {
  const { status } = req.body;
  
  // If status is provided, validate it
  if (status !== undefined) {
    // Check if status is a string
    if (typeof status !== 'string') {
      return res.status(400).json({
        message: "Trạng thái phải là chuỗi văn bản",
        error: "INVALID_STATUS_TYPE",
        received: typeof status,
        expected: "string"
      });
    }
    
    // Trim whitespace and convert to lowercase for comparison
    const normalizedStatus = status.trim().toLowerCase();
    
    // Check if status is empty after trimming
    if (!normalizedStatus) {
      return res.status(400).json({
        message: "Trạng thái không được để trống",
        error: "EMPTY_STATUS"
      });
    }
    
    // Validate against allowed values
    const allowedStatuses = ['active', 'inactive'];
    if (!allowedStatuses.includes(normalizedStatus)) {
      return res.status(400).json({
        message: "Trạng thái phải là 'active' hoặc 'inactive'",
        error: "INVALID_STATUS_VALUE",
        received: status,
        allowed: allowedStatuses
      });
    }
    
    // Normalize the status in the request body
    req.body.status = normalizedStatus;
  }
  
  next();
};

// Validation middleware for creating movies
export const validateCreateMovie = (req, res, next) => {
  const { title, description, duration, genre, release_date, trailer_url, poster_url, status } = req.body;
  const errors = [];

  // Required field validation
  if (!title || typeof title !== 'string' || !title.trim()) {
    errors.push({
      field: 'title',
      message: 'Tiêu đề phim là bắt buộc và phải là chuỗi văn bản không rỗng'
    });
  }

  if (!duration || typeof duration !== 'number' || duration <= 0) {
    errors.push({
      field: 'duration',
      message: 'Thời lượng phim là bắt buộc và phải là số dương'
    });
  }

  // Optional field validation
  if (description !== undefined && (typeof description !== 'string')) {
    errors.push({
      field: 'description',
      message: 'Mô tả phim phải là chuỗi văn bản'
    });
  }

  if (genre !== undefined && (!Array.isArray(genre) || !genre.every(g => typeof g === 'string'))) {
    errors.push({
      field: 'genre',
      message: 'Thể loại phim phải là mảng các chuỗi văn bản'
    });
  }

  if (release_date !== undefined && isNaN(Date.parse(release_date))) {
    errors.push({
      field: 'release_date',
      message: 'Ngày phát hành phải là ngày hợp lệ'
    });
  }

  if (trailer_url !== undefined && (typeof trailer_url !== 'string' || trailer_url.trim() === '')) {
    errors.push({
      field: 'trailer_url',
      message: 'URL trailer phải là chuỗi văn bản không rỗng'
    });
  }

  if (poster_url !== undefined && (typeof poster_url !== 'string' || poster_url.trim() === '')) {
    errors.push({
      field: 'poster_url',
      message: 'URL poster phải là chuỗi văn bản không rỗng'
    });
  }

  // Status validation (if provided)
  if (status !== undefined) {
    if (typeof status !== 'string' || !['active', 'inactive'].includes(status.trim().toLowerCase())) {
      errors.push({
        field: 'status',
        message: "Trạng thái phải là 'active' hoặc 'inactive'"
      });
    } else {
      // Normalize status
      req.body.status = status.trim().toLowerCase();
    }
  }

  // If there are validation errors, return them
  if (errors.length > 0) {
    return res.status(400).json({
      message: "Dữ liệu đầu vào không hợp lệ",
      error: "VALIDATION_ERROR",
      details: errors
    });
  }

  next();
};

// Validation middleware for updating movies
export const validateUpdateMovie = (req, res, next) => {
  const { title, description, duration, genre, release_date, trailer_url, poster_url, status } = req.body;
  const errors = [];

  // Optional field validation (since it's an update, all fields are optional)
  if (title !== undefined && (typeof title !== 'string' || !title.trim())) {
    errors.push({
      field: 'title',
      message: 'Tiêu đề phim phải là chuỗi văn bản không rỗng'
    });
  }

  if (duration !== undefined && (typeof duration !== 'number' || duration <= 0)) {
    errors.push({
      field: 'duration',
      message: 'Thời lượng phim phải là số dương'
    });
  }

  if (description !== undefined && typeof description !== 'string') {
    errors.push({
      field: 'description',
      message: 'Mô tả phim phải là chuỗi văn bản'
    });
  }

  if (genre !== undefined && (!Array.isArray(genre) || !genre.every(g => typeof g === 'string'))) {
    errors.push({
      field: 'genre',
      message: 'Thể loại phim phải là mảng các chuỗi văn bản'
    });
  }

  if (release_date !== undefined && isNaN(Date.parse(release_date))) {
    errors.push({
      field: 'release_date',
      message: 'Ngày phát hành phải là ngày hợp lệ'
    });
  }

  if (trailer_url !== undefined && typeof trailer_url !== 'string') {
    errors.push({
      field: 'trailer_url',
      message: 'URL trailer phải là chuỗi văn bản'
    });
  }

  if (poster_url !== undefined && typeof poster_url !== 'string') {
    errors.push({
      field: 'poster_url',
      message: 'URL poster phải là chuỗi văn bản'
    });
  }

  // Status validation (if provided)
  if (status !== undefined) {
    if (typeof status !== 'string' || !['active', 'inactive'].includes(status.trim().toLowerCase())) {
      errors.push({
        field: 'status',
        message: "Trạng thái phải là 'active' hoặc 'inactive'"
      });
    } else {
      // Normalize status
      req.body.status = status.trim().toLowerCase();
    }
  }

  // If there are validation errors, return them
  if (errors.length > 0) {
    return res.status(400).json({
      message: "Dữ liệu đầu vào không hợp lệ",
      error: "VALIDATION_ERROR",
      details: errors
    });
  }

  next();
};

// Validation middleware specifically for status updates
export const validateStatusUpdate = (req, res, next) => {
  const { status } = req.body;
  
  // Status is required for status update
  if (!status) {
    return res.status(400).json({
      message: "Trạng thái là bắt buộc",
      error: "MISSING_STATUS"
    });
  }
  
  // Check if status is a string
  if (typeof status !== 'string') {
    return res.status(400).json({
      message: "Trạng thái phải là chuỗi văn bản",
      error: "INVALID_STATUS_TYPE",
      received: typeof status,
      expected: "string"
    });
  }
  
  // Trim whitespace and convert to lowercase for comparison
  const normalizedStatus = status.trim().toLowerCase();
  
  // Check if status is empty after trimming
  if (!normalizedStatus) {
    return res.status(400).json({
      message: "Trạng thái không được để trống",
      error: "EMPTY_STATUS"
    });
  }
  
  // Validate against allowed values
  const allowedStatuses = ['active', 'inactive'];
  if (!allowedStatuses.includes(normalizedStatus)) {
    return res.status(400).json({
      message: "Trạng thái phải là 'active' hoặc 'inactive'",
      error: "INVALID_STATUS_VALUE",
      received: status,
      allowed: allowedStatuses,
      suggestion: "Sử dụng 'active' cho phim đang hoạt động hoặc 'inactive' cho phim ngừng hoạt động"
    });
  }
  
  // Normalize the status in the request body
  req.body.status = normalizedStatus;
  
  next();
};