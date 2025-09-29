import Seat from "../models/seat.js";
import Room from "../models/room.js";
import Theater from "../models/theater.js";
import mongoose from "mongoose";

// Lấy danh sách tất cả ghế (chỉ admin)
export const getAllSeats = async (req, res, next) => {
  try {
    const { page = 1, pageSize = 10, orderBy = 'created_at', orderDir = 'ASC', status = '', room_id = '', type = '', filterCriterias = [] } = req.body;

    // Validation
    const pageNum = parseInt(page);
    const limit = parseInt(pageSize);
    
    if (pageNum < 1) {
      return res.status(400).json({ message: "Page phải là số nguyên dương" });
    }
    
    if (limit < 1 || limit > 100) {
      return res.status(400).json({ message: "PageSize phải từ 1 đến 100" });
    }

    const skip = (pageNum - 1) * limit;

    // Build filter
    const filter = {};
    
    // Filter by status
    if (status && status.trim() !== '') {
      filter.status = status;
    }

    // Filter by type
    if (type && type.trim() !== '') {
      filter.type = type;
    }

    // Filter by room_id
    if (room_id && room_id.trim() !== '') {
      if (!room_id.match(/^[0-9a-fA-F]{24}$/)) {
        return res.status(400).json({ message: "Room ID không hợp lệ" });
      }
      filter.room_id = new mongoose.Types.ObjectId(room_id);
    }

    // Apply additional filterCriterias
    filterCriterias.forEach(criteria => {
      const { field, operator, value } = criteria;
      
      switch (operator) {
        case 'equals':
          filter[field] = value;
          break;
        case 'not_equals':
          filter[field] = { $ne: value };
          break;
        case 'contains':
          filter[field] = { $regex: value, $options: 'i' };
          break;
        case 'starts_with':
          filter[field] = { $regex: `^${value}`, $options: 'i' };
          break;
        case 'ends_with':
          filter[field] = { $regex: `${value}$`, $options: 'i' };
          break;
        case 'in':
          filter[field] = { $in: value };
          break;
        case 'not_in':
          filter[field] = { $nin: value };
          break;
        case 'greater_than':
          filter[field] = { $gt: value };
          break;
        case 'less_than':
          filter[field] = { $lt: value };
          break;
        case 'greater_equal':
          filter[field] = { $gte: value };
          break;
        case 'less_equal':
          filter[field] = { $lte: value };
          break;
      }
    });

    // Build sort
    const sort = {};
    const sortOrder = orderDir.toUpperCase() === 'DESC' ? -1 : 1;
    sort[orderBy] = sortOrder;

    // Query database with aggregation to get room and theater info
    const [seats, totalCount] = await Promise.all([
      Seat.aggregate([
        { $match: filter },
        {
          $lookup: {
            from: 'rooms',
            localField: 'room_id',
            foreignField: '_id',
            as: 'room'
          }
        },
        {
          $lookup: {
            from: 'theaters',
            localField: 'room.theater_id',
            foreignField: '_id',
            as: 'theater'
          }
        },
        {
          $addFields: {
            room_name: { $arrayElemAt: ['$room.name', 0] },
            theater_id: { $arrayElemAt: ['$room.theater_id', 0] },
            theater_name: { $arrayElemAt: ['$theater.name', 0] },
            theater_location: { $arrayElemAt: ['$theater.location', 0] }
          }
        },
        {
          $project: {
            room: 0,
            theater: 0
          }
        },
        { $sort: sort },
        { $skip: skip },
        { $limit: limit }
      ]),
      Seat.countDocuments(filter)
    ]);

    // Format response
    const formattedSeats = seats.map(seat => ({
      id: seat._id,
      room_id: seat.room_id,
      room_name: seat.room_name,
      theater_id: seat.theater_id,
      theater_name: seat.theater_name,
      theater_location: seat.theater_location,
      seat_number: seat.seat_number,
      type: seat.type,
      base_price: parseFloat(seat.base_price.toString()),
      status: seat.status,
      createdAt: seat.created_at,
      updatedAt: seat.updated_at
    }));

    res.status(200).json({
      message: "Lấy danh sách ghế thành công",
      page: pageNum,
      pageSize: limit,
      totalCount,
      list: formattedSeats
    });
  } catch (error) {
    next(error);
  }
};

// Lấy danh sách ghế theo room_id (chỉ admin)
export const getSeatsByRoom = async (req, res, next) => {
  try {
    const { roomId } = req.params;
    const { page = 1, pageSize = 10, status = '', type = '' } = req.query;

    if (!roomId.match(/^[0-9a-fA-F]{24}$/)) {
      return res.status(400).json({ 
        success: false,
        message: "Room ID không hợp lệ" 
      });
    }

    // Kiểm tra room có tồn tại không
    const room = await Room.findById(roomId).populate('theater_id');
    if (!room) {
      return res.status(404).json({ 
        success: false,
        message: "Không tìm thấy phòng" 
      });
    }

    // Pagination
    const pageNum = parseInt(page);
    const limit = parseInt(pageSize);
    const skip = (pageNum - 1) * limit;

    // Build filter
    const filter = { room_id: new mongoose.Types.ObjectId(roomId) };
    if (status) filter.status = status;
    if (type) filter.type = type;

    // Query with aggregation
    const [seats, totalCount] = await Promise.all([
      Seat.aggregate([
        { $match: filter },
        {
          $addFields: {
            base_price_float: { $toDouble: "$base_price" }
          }
        },
        { $sort: { seat_number: 1 } },
        { $skip: skip },
        { $limit: limit }
      ]),
      Seat.countDocuments(filter)
    ]);

    // Format response
    const formattedSeats = seats.map(seat => ({
      id: seat._id,
      seat_number: seat.seat_number,
      type: seat.type,
      base_price: seat.base_price_float,
      status: seat.status,
      createdAt: seat.created_at,
      updatedAt: seat.updated_at
    }));

    res.status(200).json({
      success: true,
      message: "Lấy danh sách ghế theo phòng thành công",
      data: {
        room: {
          id: room._id,
          name: room.name,
          status: room.status
        },
        theater: {
          id: room.theater_id._id,
          name: room.theater_id.name,
          location: room.theater_id.location
        },
        seats: formattedSeats,
        pagination: {
          page: pageNum,
          limit: limit,
          total: totalCount,
          pages: Math.ceil(totalCount / limit)
        }
      }
    });
  } catch (error) {
    next(error);
  }
};

// Lấy layout ghế theo room_id (chỉ admin)
export const getSeatLayout = async (req, res, next) => {
  try {
    const { roomId } = req.params;

    if (!roomId.match(/^[0-9a-fA-F]{24}$/)) {
      return res.status(400).json({ 
        success: false,
        message: "Room ID không hợp lệ" 
      });
    }

    // Kiểm tra room có tồn tại không
    const room = await Room.findById(roomId).populate('theater_id');
    if (!room) {
      return res.status(404).json({ 
        success: false,
        message: "Không tìm thấy phòng" 
      });
    }

    // Lấy tất cả ghế của phòng
    const seats = await Seat.find({ room_id: roomId })
      .sort({ seat_number: 1 });

    // Tạo layout theo hàng
    const layout = {};
    const summary = {
      total_seats: seats.length,
      active_seats: 0,
      inactive_seats: 0,
      vip_seats: 0,
      normal_seats: 0,
      total_revenue: 0
    };

    seats.forEach(seat => {
      const row = seat.seat_number.charAt(0); // Lấy ký tự đầu (hàng)
      const column = seat.seat_number.substring(1); // Lấy phần còn lại (cột)
      
      if (!layout[row]) {
        layout[row] = [];
      }

      const seatData = {
        id: seat._id,
        seat_number: seat.seat_number,
        column: column,
        type: seat.type,
        base_price: parseFloat(seat.base_price.toString()),
        status: seat.status
      };

      layout[row].push(seatData);

      // Cập nhật summary
      if (seat.status === 'active') summary.active_seats++;
      else summary.inactive_seats++;
      
      if (seat.type === 'vip') summary.vip_seats++;
      else summary.normal_seats++;
      
      summary.total_revenue += parseFloat(seat.base_price.toString());
    });

    res.status(200).json({
      success: true,
      message: "Lấy layout ghế thành công",
      data: {
        room: {
          id: room._id,
          name: room.name,
          status: room.status
        },
        theater: {
          id: room.theater_id._id,
          name: room.theater_id.name,
          location: room.theater_id.location
        },
        layout: layout,
        summary: summary
      }
    });
  } catch (error) {
    next(error);
  }
};

// Lấy chi tiết ghế theo ID (chỉ admin)
export const getSeatById = async (req, res, next) => {
  try {
    const { id } = req.params;

    if (!id.match(/^[0-9a-fA-F]{24}$/)) {
      return res.status(400).json({ 
        success: false,
        message: "Seat ID không hợp lệ" 
      });
    }

    const seat = await Seat.aggregate([
      { $match: { _id: new mongoose.Types.ObjectId(id) } },
      {
        $lookup: {
          from: 'rooms',
          localField: 'room_id',
          foreignField: '_id',
          as: 'room'
        }
      },
      {
        $lookup: {
          from: 'theaters',
          localField: 'room.theater_id',
          foreignField: '_id',
          as: 'theater'
        }
      },
      {
        $addFields: {
          room_name: { $arrayElemAt: ['$room.name', 0] },
          theater_id: { $arrayElemAt: ['$room.theater_id', 0] },
          theater_name: { $arrayElemAt: ['$theater.name', 0] },
          theater_location: { $arrayElemAt: ['$theater.location', 0] },
          base_price_float: { $toDouble: "$base_price" }
        }
      },
      {
        $project: {
          room: 0,
          theater: 0
        }
      }
    ]);

    if (!seat || seat.length === 0) {
      return res.status(404).json({ 
        success: false,
        message: "Không tìm thấy ghế" 
      });
    }

    res.status(200).json({
      success: true,
      message: "Lấy thông tin ghế thành công",
      data: seat[0]
    });
  } catch (error) {
    next(error);
  }
};

// Tạo ghế mới (chỉ admin)
export const createSeat = async (req, res, next) => {
  try {
    const { room_id, seat_number, type, base_price } = req.body;

    // Validation
    if (!room_id || !seat_number || !base_price) {
      return res.status(400).json({ 
        success: false,
        message: "Room ID, số ghế và giá cơ bản là bắt buộc" 
      });
    }

    if (!room_id.match(/^[0-9a-fA-F]{24}$/)) {
      return res.status(400).json({ 
        success: false,
        message: "Room ID không hợp lệ" 
      });
    }

    // Kiểm tra room có tồn tại không
    const room = await Room.findById(room_id);
    if (!room) {
      return res.status(404).json({ 
        success: false,
        message: "Không tìm thấy phòng" 
      });
    }

    // Kiểm tra số ghế đã tồn tại trong phòng chưa
    const existingSeat = await Seat.findOne({ 
      room_id,
      seat_number: { $regex: new RegExp(`^${seat_number}$`, 'i') } 
    });

    if (existingSeat) {
      return res.status(400).json({ 
        success: false,
        message: "Số ghế đã tồn tại trong phòng này" 
      });
    }

    const seat = await Seat.create({
      room_id,
      seat_number: seat_number.trim(),
      type: type || 'normal',
      base_price: parseFloat(base_price),
      status: 'active'
    });

    res.status(201).json({
      success: true,
      message: "Tạo ghế thành công",
      data: seat
    });
  } catch (error) {
    next(error);
  }
};

// Tạo nhiều ghế cùng lúc (chỉ admin)
export const createBulkSeats = async (req, res, next) => {
  try {
    const { room_id, seats } = req.body;

    // Validation
    if (!room_id || !seats || !Array.isArray(seats)) {
      return res.status(400).json({ 
        success: false,
        message: "Room ID và danh sách ghế là bắt buộc" 
      });
    }

    if (!room_id.match(/^[0-9a-fA-F]{24}$/)) {
      return res.status(400).json({ 
        success: false,
        message: "Room ID không hợp lệ" 
      });
    }

    // Kiểm tra room có tồn tại không
    const room = await Room.findById(room_id);
    if (!room) {
      return res.status(404).json({ 
        success: false,
        message: "Không tìm thấy phòng" 
      });
    }

    // Validation từng ghế
    const errors = [];
    const seatsToCreate = [];

    for (let i = 0; i < seats.length; i++) {
      const seat = seats[i];
      const { seat_number, type, base_price } = seat;

      if (!seat_number || !base_price) {
        errors.push(`Ghế ${i + 1}: Số ghế và giá cơ bản là bắt buộc`);
        continue;
      }

      if (typeof base_price !== 'number' || base_price <= 0) {
        errors.push(`Ghế ${i + 1}: Giá cơ bản phải là số dương`);
        continue;
      }

      seatsToCreate.push({
        room_id,
        seat_number: seat_number.trim(),
        type: type || 'normal',
        base_price: parseFloat(base_price),
        status: 'active'
      });
    }

    if (errors.length > 0) {
      return res.status(400).json({ 
        success: false,
        message: "Dữ liệu không hợp lệ",
        errors
      });
    }

    // Kiểm tra trùng lặp
    const existingSeats = await Seat.find({ 
      room_id,
      seat_number: { $in: seatsToCreate.map(s => s.seat_number) }
    });

    if (existingSeats.length > 0) {
      return res.status(400).json({ 
        success: false,
        message: `Các ghế sau đã tồn tại: ${existingSeats.map(s => s.seat_number).join(', ')}` 
      });
    }

    // Tạo ghế
    const createdSeats = await Seat.insertMany(seatsToCreate);

    res.status(201).json({
      success: true,
      message: `Tạo ${createdSeats.length} ghế thành công`,
      data: {
        created_count: createdSeats.length,
        seats: createdSeats
      }
    });
  } catch (error) {
    next(error);
  }
};

// Cập nhật ghế (chỉ admin)
export const updateSeat = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { seat_number, type, base_price, status } = req.body;

    if (!id.match(/^[0-9a-fA-F]{24}$/)) {
      return res.status(400).json({ 
        success: false,
        message: "Seat ID không hợp lệ" 
      });
    }

    const seat = await Seat.findById(id);
    if (!seat) {
      return res.status(404).json({ 
        success: false,
        message: "Không tìm thấy ghế" 
      });
    }

    // Kiểm tra số ghế trùng lặp (nếu có thay đổi)
    if (seat_number && seat_number !== seat.seat_number) {
      const existingSeat = await Seat.findOne({ 
        room_id: seat.room_id,
        seat_number: { $regex: new RegExp(`^${seat_number}$`, 'i') },
        _id: { $ne: id }
      });

      if (existingSeat) {
        return res.status(400).json({ 
          success: false,
          message: "Số ghế đã tồn tại trong phòng này" 
        });
      }
    }

    // Cập nhật
    const updateData = {};
    if (seat_number !== undefined) updateData.seat_number = seat_number.trim();
    if (type !== undefined) updateData.type = type;
    if (base_price !== undefined) updateData.base_price = parseFloat(base_price);
    if (status !== undefined) updateData.status = status;

    const updatedSeat = await Seat.findByIdAndUpdate(
      id,
      updateData,
      { new: true, runValidators: true }
    );

    res.status(200).json({
      success: true,
      message: "Cập nhật ghế thành công",
      data: updatedSeat
    });
  } catch (error) {
    next(error);
  }
};

// Xóa ghế (chỉ admin)
export const deleteSeat = async (req, res, next) => {
  try {
    const { id } = req.params;

    if (!id.match(/^[0-9a-fA-F]{24}$/)) {
      return res.status(400).json({ 
        success: false,
        message: "Seat ID không hợp lệ" 
      });
    }

    const seat = await Seat.findById(id);
    if (!seat) {
      return res.status(404).json({ 
        success: false,
        message: "Không tìm thấy ghế" 
      });
    }

    // Soft delete - cập nhật status thành inactive
    await Seat.findByIdAndUpdate(id, { status: 'inactive' });

    res.status(200).json({
      success: true,
      message: "Xóa ghế thành công"
    });
  } catch (error) {
    next(error);
  }
};

// Thay đổi trạng thái ghế (chỉ admin)
export const updateSeatStatus = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!id.match(/^[0-9a-fA-F]{24}$/)) {
      return res.status(400).json({ 
        success: false,
        message: "Seat ID không hợp lệ" 
      });
    }

    if (!status || !['active', 'inactive'].includes(status)) {
      return res.status(400).json({ 
        success: false,
        message: "Trạng thái phải là 'active' hoặc 'inactive'" 
      });
    }

    const seat = await Seat.findById(id);
    if (!seat) {
      return res.status(404).json({ 
        success: false,
        message: "Không tìm thấy ghế" 
      });
    }

    const updatedSeat = await Seat.findByIdAndUpdate(
      id,
      { status },
      { new: true }
    );

    res.status(200).json({
      success: true,
      message: `Cập nhật trạng thái ghế thành '${status}' thành công`,
      data: updatedSeat
    });
  } catch (error) {
    next(error);
  }
};

// Lấy thống kê ghế (chỉ admin)
export const getSeatStats = async (req, res, next) => {
  try {
    const { id } = req.params;

    if (!id.match(/^[0-9a-fA-F]{24}$/)) {
      return res.status(400).json({ 
        success: false,
        message: "Seat ID không hợp lệ" 
      });
    }

    const seat = await Seat.findById(id);
    if (!seat) {
      return res.status(404).json({ 
        success: false,
        message: "Không tìm thấy ghế" 
      });
    }

    // Lấy thông tin room và theater
    const room = await Room.findById(seat.room_id).populate('theater_id');

    res.status(200).json({
      success: true,
      message: "Lấy thống kê ghế thành công",
      data: {
        seat: {
          id: seat._id,
          seat_number: seat.seat_number,
          type: seat.type,
          base_price: parseFloat(seat.base_price.toString()),
          status: seat.status,
          createdAt: seat.created_at,
          updatedAt: seat.updated_at
        },
        room: {
          id: room._id,
          name: room.name,
          status: room.status
        },
        theater: {
          id: room.theater_id._id,
          name: room.theater_id.name,
          location: room.theater_id.location
        }
      }
    });
  } catch (error) {
    next(error);
  }
};

