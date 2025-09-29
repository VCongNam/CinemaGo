// Validation middleware cho Seat APIs

export const validateCreateSeat = (req, res, next) => {
  const { room_id, seat_number, type, base_price } = req.body;
  const errors = [];

  // Validation room_id
  if (!room_id || typeof room_id !== 'string') {
    errors.push("Room ID là bắt buộc và phải là chuỗi");
  } else if (!room_id.match(/^[0-9a-fA-F]{24}$/)) {
    errors.push("Room ID không hợp lệ");
  }

  // Validation số ghế
  if (!seat_number || typeof seat_number !== 'string') {
    errors.push("Số ghế là bắt buộc và phải là chuỗi");
  } else if (seat_number.trim().length < 1) {
    errors.push("Số ghế không được để trống");
  } else if (seat_number.trim().length > 10) {
    errors.push("Số ghế không được vượt quá 10 ký tự");
  }

  // Validation loại ghế
  if (type && !['normal', 'vip'].includes(type)) {
    errors.push("Loại ghế phải là 'normal' hoặc 'vip'");
  }

  // Validation giá cơ bản
  if (!base_price) {
    errors.push("Giá cơ bản là bắt buộc");
  } else if (typeof base_price !== 'number' && typeof base_price !== 'string') {
    errors.push("Giá cơ bản phải là số");
  } else {
    const price = parseFloat(base_price);
    if (isNaN(price) || price <= 0) {
      errors.push("Giá cơ bản phải là số dương");
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

export const validateCreateBulkSeats = (req, res, next) => {
  const { room_id, seats } = req.body;
  const errors = [];

  // Validation room_id
  if (!room_id || typeof room_id !== 'string') {
    errors.push("Room ID là bắt buộc và phải là chuỗi");
  } else if (!room_id.match(/^[0-9a-fA-F]{24}$/)) {
    errors.push("Room ID không hợp lệ");
  }

  // Validation danh sách ghế
  if (!seats || !Array.isArray(seats)) {
    errors.push("Danh sách ghế là bắt buộc và phải là mảng");
  } else if (seats.length === 0) {
    errors.push("Danh sách ghế không được để trống");
  // } else if (seats.length > 100) {
  //   errors.push("Không thể tạo quá 100 ghế cùng lúc");
  } else {
    // Validation từng ghế
    seats.forEach((seat, index) => {
      const { seat_number, type, base_price } = seat;

      if (!seat_number || typeof seat_number !== 'string') {
        errors.push(`Ghế ${index + 1}: Số ghế là bắt buộc và phải là chuỗi`);
      } else if (seat_number.trim().length < 1) {
        errors.push(`Ghế ${index + 1}: Số ghế không được để trống`);
      } else if (seat_number.trim().length > 10) {
        errors.push(`Ghế ${index + 1}: Số ghế không được vượt quá 10 ký tự`);
      }

      if (type && !['normal', 'vip'].includes(type)) {
        errors.push(`Ghế ${index + 1}: Loại ghế phải là 'normal' hoặc 'vip'`);
      }

      if (!base_price) {
        errors.push(`Ghế ${index + 1}: Giá cơ bản là bắt buộc`);
      } else {
        const price = parseFloat(base_price);
        if (isNaN(price) || price <= 0) {
          errors.push(`Ghế ${index + 1}: Giá cơ bản phải là số dương`);
        }
      }
    });
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

export const validateUpdateSeat = (req, res, next) => {
  const { seat_number, type, base_price, status } = req.body;
  const errors = [];

  // Validation số ghế (nếu có)
  if (seat_number !== undefined) {
    if (typeof seat_number !== 'string') {
      errors.push("Số ghế phải là chuỗi");
    } else if (seat_number.trim().length < 1) {
      errors.push("Số ghế không được để trống");
    } else if (seat_number.trim().length > 10) {
      errors.push("Số ghế không được vượt quá 10 ký tự");
    }
  }

  // Validation loại ghế (nếu có)
  if (type !== undefined && !['normal', 'vip'].includes(type)) {
    errors.push("Loại ghế phải là 'normal' hoặc 'vip'");
  }

  // Validation giá cơ bản (nếu có)
  if (base_price !== undefined) {
    const price = parseFloat(base_price);
    if (isNaN(price) || price <= 0) {
      errors.push("Giá cơ bản phải là số dương");
    }
  }

  // Validation trạng thái (nếu có)
  if (status !== undefined && !['active', 'inactive'].includes(status)) {
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

export const validateSeatStatus = (req, res, next) => {
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

export const validateSeatId = (req, res, next) => {
  const { id } = req.params;

  if (!id) {
    return res.status(400).json({
      success: false,
      message: "Seat ID là bắt buộc"
    });
  }

  if (!id.match(/^[0-9a-fA-F]{24}$/)) {
    return res.status(400).json({
      success: false,
      message: "Seat ID không hợp lệ"
    });
  }

  next();
};

export const validateRoomId = (req, res, next) => {
  const { roomId } = req.params;

  if (!roomId) {
    return res.status(400).json({
      success: false,
      message: "Room ID là bắt buộc"
    });
  }

  if (!roomId.match(/^[0-9a-fA-F]{24}$/)) {
    return res.status(400).json({
      success: false,
      message: "Room ID không hợp lệ"
    });
  }

  next();
};

