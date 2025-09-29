// Validation middleware cho Room APIs

export const validateCreateRoom = (req, res, next) => {
  const { theater_id, name } = req.body;
  const errors = [];

  // Validation theater_id
  if (!theater_id || typeof theater_id !== 'string') {
    errors.push("Theater ID là bắt buộc và phải là chuỗi");
  } else if (!theater_id.match(/^[0-9a-fA-F]{24}$/)) {
    errors.push("Theater ID không hợp lệ");
  }

  // Validation tên phòng
  if (!name || typeof name !== 'string') {
    errors.push("Tên phòng là bắt buộc và phải là chuỗi");
  } else if (name.trim().length < 2) {
    errors.push("Tên phòng phải có ít nhất 2 ký tự");
  } else if (name.trim().length > 50) {
    errors.push("Tên phòng không được vượt quá 50 ký tự");
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

export const validateUpdateRoom = (req, res, next) => {
  const { name, status } = req.body;
  const errors = [];

  // Validation tên phòng (nếu có)
  if (name !== undefined) {
    if (typeof name !== 'string') {
      errors.push("Tên phòng phải là chuỗi");
    } else if (name.trim().length < 2) {
      errors.push("Tên phòng phải có ít nhất 2 ký tự");
    } else if (name.trim().length > 50) {
      errors.push("Tên phòng không được vượt quá 50 ký tự");
    }
  }

  // Validation trạng thái (nếu có)
  if (status !== undefined) {
    if (!['active', 'inactive', 'maintenance'].includes(status)) {
      errors.push("Trạng thái phải là 'active', 'inactive' hoặc 'maintenance'");
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

export const validateRoomStatus = (req, res, next) => {
  const { status } = req.body;
  const errors = [];

  if (!status) {
    errors.push("Trạng thái là bắt buộc");
  } else if (!['active', 'inactive', 'maintenance'].includes(status)) {
    errors.push("Trạng thái phải là 'active', 'inactive' hoặc 'maintenance'");
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

export const validateRoomId = (req, res, next) => {
  const { id } = req.params;

  if (!id) {
    return res.status(400).json({
      success: false,
      message: "Room ID là bắt buộc"
    });
  }

  if (!id.match(/^[0-9a-fA-F]{24}$/)) {
    return res.status(400).json({
      success: false,
      message: "Room ID không hợp lệ"
    });
  }

  next();
};

export const validateTheaterId = (req, res, next) => {
  const { theaterId } = req.params;

  if (!theaterId) {
    return res.status(400).json({
      success: false,
      message: "Theater ID là bắt buộc"
    });
  }

  if (!theaterId.match(/^[0-9a-fA-F]{24}$/)) {
    return res.status(400).json({
      success: false,
      message: "Theater ID không hợp lệ"
    });
  }

  next();
};

