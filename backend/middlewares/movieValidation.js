// Validation middleware for movie operations
export const validateMovieStatus = (req, res, next) => {
  const { status } = req.body;
  const isStatusUpdateRoute = req.method === 'PATCH' && req.originalUrl.includes('/status');
  
  // Nếu là route cập nhật status, trường status là bắt buộc
  if (isStatusUpdateRoute && status === undefined) {
    return res.status(400).json({
      message: "Trạng thái là bắt buộc",
      error: "MISSING_STATUS"
    });
  }

  // Nếu status được cung cấp, tiến hành validate
  if (status === undefined) {
    return next();
  }

  if (typeof status !== 'string' || status.trim() === '') {
    return res.status(400).json({
      message: "Trạng thái phải là chuỗi văn bản không rỗng",
      error: "INVALID_STATUS_FORMAT"
    });
  }
  
  const normalizedStatus = status.trim().toLowerCase();
  const allowedStatuses = ['active', 'inactive'];

  if (!allowedStatuses.includes(normalizedStatus)) {
    return res.status(400).json({
      message: "Trạng thái phải là 'active' hoặc 'inactive'",
      error: "INVALID_STATUS_VALUE",
      received: status,
      allowed: allowedStatuses
    });
  }
  
  // Chuẩn hóa giá trị status trong request body
  req.body.status = normalizedStatus;
  
  next();
};

// Validation middleware for creating movies
export const validateCreateMovie = (req, res, next) => {
  const { title, duration } = req.body;
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

  // If there are validation errors, return them
  if (errors.length > 0) {
    return res.status(400).json({
      message: "Dữ liệu đầu vào không hợp lệ",
      error: "VALIDATION_ERROR",
      details: errors
    });
  }

  // Call a generic validator for optional fields
  validateOptionalMovieFields(req, res, next);
};

// Validation middleware for updating movies
export const validateUpdateMovie = (req, res, next) => {
  // For updates, all fields are optional, so we just call the generic validator
  validateOptionalMovieFields(req, res, next);
};

// A generic validator for all optional/updatable movie fields
const validateOptionalMovieFields = (req, res, next) => {
  const { description, genre, release_date, trailer_url, poster_url, status } = req.body;
  const errors = [];

  // Optional field validation
  if (description !== undefined && (typeof description !== 'string')) {
    errors.push({
      field: 'description',
      message: 'Mô tả phim phải là chuỗi văn bản'
    });
  }

  if (genre !== undefined && (!Array.isArray(genre) || !genre.every(g => typeof g === 'string' && g.trim() !== ''))) {
    errors.push({
      field: 'genre',
      message: 'Thể loại phim phải là mảng các chuỗi văn bản không rỗng'
    });
  }

  if (release_date !== undefined && (release_date !== null && isNaN(Date.parse(release_date)))) {
    errors.push({
      field: 'release_date',
      message: 'Ngày phát hành phải là ngày hợp lệ'
    });
  }

  if (trailer_url !== undefined && (typeof trailer_url !== 'string')) {
    errors.push({
      field: 'trailer_url',
      message: 'URL trailer phải là chuỗi văn bản'
    });
  }

  if (poster_url !== undefined && (typeof poster_url !== 'string')) {
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

  // Trim all string fields that exist in the body
  for (const key in req.body) {
    if (typeof req.body[key] === 'string') {
      req.body[key] = req.body[key].trim();
    }
  }

  next();
};

// Validation middleware specifically for status updates
export const validateStatusUpdate = (req, res, next) => {
  const { status } = req.body;
  
  // Status is required for status update
  if (status === undefined) {
    return res.status(400).json({
      message: "Trạng thái là bắt buộc",
      error: "MISSING_STATUS"
    });
  }
  
  if (typeof status !== 'string' || status.trim() === '') {
    return res.status(400).json({
      message: "Trạng thái không được để trống",
      error: "EMPTY_STATUS"
    });
  }
  
  const normalizedStatus = status.trim().toLowerCase();
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