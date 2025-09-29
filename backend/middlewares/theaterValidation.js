// Validation middleware cho Theater APIs

export const validateCreateTheater = (req, res, next) => {
  const { name, location } = req.body;
  const errors = [];

  // Validation tên rạp
  if (!name || typeof name !== 'string') {
    errors.push("Tên rạp là bắt buộc và phải là chuỗi");
  } else if (name.trim().length < 2) {
    errors.push("Tên rạp phải có ít nhất 2 ký tự");
  } else if (name.trim().length > 100) {
    errors.push("Tên rạp không được vượt quá 100 ký tự");
  }

  // Validation địa điểm
  if (!location || typeof location !== 'string') {
    errors.push("Địa điểm là bắt buộc và phải là chuỗi");
  } else if (location.trim().length < 5) {
    errors.push("Địa điểm phải có ít nhất 5 ký tự");
  } else if (location.trim().length > 200) {
    errors.push("Địa điểm không được vượt quá 200 ký tự");
  }

  if (errors.length > 0) {
    return res.status(400).json({
      success: false,
      message: "Dữ liệu không hợp lệ",
      errors
    });
  }

  next();
};

export const validateUpdateTheater = (req, res, next) => {
  const { name, location, status } = req.body;
  const errors = [];

  // Validation tên rạp (nếu có)
  if (name !== undefined) {
    if (typeof name !== 'string') {
      errors.push("Tên rạp phải là chuỗi");
    } else if (name.trim().length < 2) {
      errors.push("Tên rạp phải có ít nhất 2 ký tự");
    } else if (name.trim().length > 100) {
      errors.push("Tên rạp không được vượt quá 100 ký tự");
    }
  }

  // Validation địa điểm (nếu có)
  if (location !== undefined) {
    if (typeof location !== 'string') {
      errors.push("Địa điểm phải là chuỗi");
    } else if (location.trim().length < 5) {
      errors.push("Địa điểm phải có ít nhất 5 ký tự");
    } else if (location.trim().length > 200) {
      errors.push("Địa điểm không được vượt quá 200 ký tự");
    }
  }

  // Validation trạng thái (nếu có)
  if (status !== undefined) {
    if (!['active', 'inactive'].includes(status)) {
      errors.push("Trạng thái phải là 'active' hoặc 'inactive'");
    }
  }

  if (errors.length > 0) {
    return res.status(400).json({
      success: false,
      message: "Dữ liệu không hợp lệ",
      errors
    });
  }

  next();
};

export const validateTheaterStatus = (req, res, next) => {
  const { status } = req.body;
  const errors = [];

  if (!status) {
    errors.push("Trạng thái là bắt buộc");
  } else if (!['active', 'inactive'].includes(status)) {
    errors.push("Trạng thái phải là 'active' hoặc 'inactive'");
  }

  if (errors.length > 0) {
    return res.status(400).json({
      success: false,
      message: "Dữ liệu không hợp lệ",
      errors
    });
  }

  next();
};

export const validateTheaterId = (req, res, next) => {
  const { id } = req.params;

  if (!id) {
    return res.status(400).json({
      success: false,
      message: "ID rạp là bắt buộc"
    });
  }

  if (!id.match(/^[0-9a-fA-F]{24}$/)) {
    return res.status(400).json({
      success: false,
      message: "ID rạp không hợp lệ"
    });
  }

  next();
};

