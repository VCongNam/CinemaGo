import Room from "../models/room.js";
import Theater from "../models/theater.js";
import Seat from "../models/seat.js";
import mongoose from "mongoose";

// Lấy danh sách tất cả phòng (chỉ admin)
export const getAllRooms = async (req, res, next) => {
  try {
    const { page = 1, pageSize = 10, orderBy = 'created_at', orderDir = 'ASC', status = '', theater_id = '', filterCriterias = [] } = req.body;

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

    // Filter by theater_id
    if (theater_id && theater_id.trim() !== '') {
      if (!theater_id.match(/^[0-9a-fA-F]{24}$/)) {
        return res.status(400).json({ message: "Theater ID không hợp lệ" });
      }
      filter.theater_id = new mongoose.Types.ObjectId(theater_id);
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

    // Query database with aggregation to get seat counts and theater info
    const [rooms, totalCount] = await Promise.all([
      Room.aggregate([
        { $match: filter },
        {
          $lookup: {
            from: 'theaters',
            localField: 'theater_id',
            foreignField: '_id',
            as: 'theater'
          }
        },
        {
          $lookup: {
            from: 'seats',
            localField: '_id',
            foreignField: 'room_id',
            as: 'seats'
          }
        },
        {
          $addFields: {
            theater_name: { $arrayElemAt: ['$theater.name', 0] },
            theater_location: { $arrayElemAt: ['$theater.location', 0] },
            total_seats: { $size: '$seats' },
            active_seats: {
              $size: {
                $filter: {
                  input: '$seats',
                  cond: { $eq: ['$$this.status', 'active'] }
                }
              }
            },
            vip_seats: {
              $size: {
                $filter: {
                  input: '$seats',
                  cond: { $eq: ['$$this.type', 'vip'] }
                }
              }
            },
            normal_seats: {
              $size: {
                $filter: {
                  input: '$seats',
                  cond: { $eq: ['$$this.type', 'normal'] }
                }
              }
            }
          }
        },
        {
          $project: {
            theater: 0,
            seats: 0
          }
        },
        { $sort: sort },
        { $skip: skip },
        { $limit: limit }
      ]),
      Room.countDocuments(filter)
    ]);

    // Format response
    const formattedRooms = rooms.map(room => ({
      id: room._id,
      theater_id: room.theater_id,
      theater_name: room.theater_name,
      theater_location: room.theater_location,
      name: room.name,
      status: room.status,
      total_seats: room.total_seats,
      active_seats: room.active_seats,
      vip_seats: room.vip_seats,
      normal_seats: room.normal_seats,
      createdAt: room.created_at,
      updatedAt: room.updated_at
    }));

    res.status(200).json({
      message: "Lấy danh sách phòng thành công",
      page: pageNum,
      pageSize: limit,
      totalCount,
      list: formattedRooms
    });
  } catch (error) {
    next(error);
  }
};

// Lấy danh sách phòng theo theater_id (chỉ admin)
export const getRoomsByTheater = async (req, res, next) => {
  try {
    const { theaterId } = req.params;
    const { page = 1, pageSize = 10, status = '' } = req.query;

    if (!theaterId.match(/^[0-9a-fA-F]{24}$/)) {
      return res.status(400).json({ 
        success: false,
        message: "Theater ID không hợp lệ" 
      });
    }

    // Kiểm tra theater có tồn tại không
    const theater = await Theater.findById(theaterId);
    if (!theater) {
      return res.status(404).json({ 
        success: false,
        message: "Không tìm thấy rạp" 
      });
    }

    // Pagination
    const pageNum = parseInt(page);
    const limit = parseInt(pageSize);
    const skip = (pageNum - 1) * limit;

    // Build filter
    const filter = { theater_id: new mongoose.Types.ObjectId(theaterId) };
    if (status) filter.status = status;

    // Query with aggregation
    const [rooms, totalCount] = await Promise.all([
      Room.aggregate([
        { $match: filter },
        {
          $lookup: {
            from: 'seats',
            localField: '_id',
            foreignField: 'room_id',
            as: 'seats'
          }
        },
        {
          $addFields: {
            total_seats: { $size: '$seats' },
            active_seats: {
              $size: {
                $filter: {
                  input: '$seats',
                  cond: { $eq: ['$$this.status', 'active'] }
                }
              }
            }
          }
        },
        {
          $project: {
            seats: 0
          }
        },
        { $sort: { created_at: -1 } },
        { $skip: skip },
        { $limit: limit }
      ]),
      Room.countDocuments(filter)
    ]);

    res.status(200).json({
      success: true,
      message: "Lấy danh sách phòng theo rạp thành công",
      data: {
        theater: {
          id: theater._id,
          name: theater.name,
          location: theater.location
        },
        rooms,
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

// Lấy chi tiết phòng theo ID (chỉ admin)
export const getRoomById = async (req, res, next) => {
  try {
    const { id } = req.params;

    if (!id.match(/^[0-9a-fA-F]{24}$/)) {
      return res.status(400).json({ 
        success: false,
        message: "Room ID không hợp lệ" 
      });
    }

    const room = await Room.aggregate([
      { $match: { _id: new mongoose.Types.ObjectId(id) } },
      {
        $lookup: {
          from: 'theaters',
          localField: 'theater_id',
          foreignField: '_id',
          as: 'theater'
        }
      },
      {
        $lookup: {
          from: 'seats',
          localField: '_id',
          foreignField: 'room_id',
          as: 'seats'
        }
      },
      {
        $addFields: {
          theater_name: { $arrayElemAt: ['$theater.name', 0] },
          theater_location: { $arrayElemAt: ['$theater.location', 0] },
          total_seats: { $size: '$seats' },
          active_seats: {
            $size: {
              $filter: {
                input: '$seats',
                cond: { $eq: ['$$this.status', 'active'] }
              }
            }
          }
        }
      }
    ]);

    if (!room || room.length === 0) {
      return res.status(404).json({ 
        success: false,
        message: "Không tìm thấy phòng" 
      });
    }

    res.status(200).json({
      success: true,
      message: "Lấy thông tin phòng thành công",
      data: room[0]
    });
  } catch (error) {
    next(error);
  }
};

// Tạo phòng mới (chỉ admin)
export const createRoom = async (req, res, next) => {
  try {
    const { theater_id, name } = req.body;

    // Validation
    if (!theater_id || !name) {
      return res.status(400).json({ 
        success: false,
        message: "Theater ID và tên phòng là bắt buộc" 
      });
    }

    if (!theater_id.match(/^[0-9a-fA-F]{24}$/)) {
      return res.status(400).json({ 
        success: false,
        message: "Theater ID không hợp lệ" 
      });
    }

    // Kiểm tra theater có tồn tại không
    const theater = await Theater.findById(theater_id);
    if (!theater) {
      return res.status(404).json({ 
        success: false,
        message: "Không tìm thấy rạp" 
      });
    }

    // Kiểm tra tên phòng đã tồn tại trong rạp chưa
    const existingRoom = await Room.findOne({ 
      theater_id,
      name: { $regex: new RegExp(`^${name}$`, 'i') } 
    });

    if (existingRoom) {
      return res.status(400).json({ 
        success: false,
        message: "Tên phòng đã tồn tại trong rạp này" 
      });
    }

    const room = await Room.create({
      theater_id,
      name: name.trim(),
      status: 'active'
    });

    res.status(201).json({
      success: true,
      message: "Tạo phòng thành công",
      data: room
    });
  } catch (error) {
    next(error);
  }
};

// Cập nhật phòng (chỉ admin)
export const updateRoom = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { name, status } = req.body;

    if (!id.match(/^[0-9a-fA-F]{24}$/)) {
      return res.status(400).json({ 
        success: false,
        message: "Room ID không hợp lệ" 
      });
    }

    const room = await Room.findById(id);
    if (!room) {
      return res.status(404).json({ 
        success: false,
        message: "Không tìm thấy phòng" 
      });
    }

    // Kiểm tra tên phòng trùng lặp (nếu có thay đổi tên)
    if (name && name !== room.name) {
      const existingRoom = await Room.findOne({ 
        theater_id: room.theater_id,
        name: { $regex: new RegExp(`^${name}$`, 'i') },
        _id: { $ne: id }
      });

      if (existingRoom) {
        return res.status(400).json({ 
          success: false,
          message: "Tên phòng đã tồn tại trong rạp này" 
        });
      }
    }

    // Cập nhật
    const updateData = {};
    if (name !== undefined) updateData.name = name.trim();
    if (status !== undefined) updateData.status = status;

    const updatedRoom = await Room.findByIdAndUpdate(
      id,
      updateData,
      { new: true, runValidators: true }
    );

    res.status(200).json({
      success: true,
      message: "Cập nhật phòng thành công",
      data: updatedRoom
    });
  } catch (error) {
    next(error);
  }
};

// Xóa phòng (chỉ admin) - Soft delete
export const deleteRoom = async (req, res, next) => {
  try {
    const { id } = req.params;

    if (!id.match(/^[0-9a-fA-F]{24}$/)) {
      return res.status(400).json({ 
        success: false,
        message: "Room ID không hợp lệ" 
      });
    }

    const room = await Room.findById(id);
    if (!room) {
      return res.status(404).json({ 
        success: false,
        message: "Không tìm thấy phòng" 
      });
    }

    // Kiểm tra phòng có ghế không
    const seatsCount = await Seat.countDocuments({ room_id: id });
    if (seatsCount > 0) {
      return res.status(400).json({ 
        success: false,
        message: "Không thể xóa phòng có ghế. Vui lòng xóa tất cả ghế trước" 
      });
    }

    // Soft delete - cập nhật status thành inactive
    await Room.findByIdAndUpdate(id, { status: 'inactive' });

    res.status(200).json({
      success: true,
      message: "Xóa phòng thành công"
    });
  } catch (error) {
    next(error);
  }
};

// Thay đổi trạng thái phòng (chỉ admin)
export const updateRoomStatus = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!id.match(/^[0-9a-fA-F]{24}$/)) {
      return res.status(400).json({ 
        success: false,
        message: "Room ID không hợp lệ" 
      });
    }

    if (!status || !['active', 'inactive', 'maintenance'].includes(status)) {
      return res.status(400).json({ 
        success: false,
        message: "Trạng thái phải là 'active', 'inactive' hoặc 'maintenance'" 
      });
    }

    const room = await Room.findById(id);
    if (!room) {
      return res.status(404).json({ 
        success: false,
        message: "Không tìm thấy phòng" 
      });
    }

    const updatedRoom = await Room.findByIdAndUpdate(
      id,
      { status },
      { new: true }
    );

    res.status(200).json({
      success: true,
      message: `Cập nhật trạng thái phòng thành '${status}' thành công`,
      data: updatedRoom
    });
  } catch (error) {
    next(error);
  }
};

// Lấy thống kê phòng (chỉ admin)
export const getRoomStats = async (req, res, next) => {
  try {
    const { id } = req.params;

    if (!id.match(/^[0-9a-fA-F]{24}$/)) {
      return res.status(400).json({ 
        success: false,
        message: "Room ID không hợp lệ" 
      });
    }

    const room = await Room.findById(id);
    if (!room) {
      return res.status(404).json({ 
        success: false,
        message: "Không tìm thấy phòng" 
      });
    }

    // Thống kê chi tiết
    const stats = await Room.aggregate([
      { $match: { _id: new mongoose.Types.ObjectId(id) } },
      {
        $lookup: {
          from: 'theaters',
          localField: 'theater_id',
          foreignField: '_id',
          as: 'theater'
        }
      },
      {
        $lookup: {
          from: 'seats',
          localField: '_id',
          foreignField: 'room_id',
          as: 'seats'
        }
      },
      {
        $addFields: {
          theater_name: { $arrayElemAt: ['$theater.name', 0] },
          theater_location: { $arrayElemAt: ['$theater.location', 0] },
          total_seats: { $size: '$seats' },
          active_seats: {
            $size: {
              $filter: {
                input: '$seats',
                cond: { $eq: ['$$this.status', 'active'] }
              }
            }
          },
          inactive_seats: {
            $size: {
              $filter: {
                input: '$seats',
                cond: { $eq: ['$$this.status', 'inactive'] }
              }
            }
          },
          vip_seats: {
            $size: {
              $filter: {
                input: '$seats',
                cond: { $eq: ['$$this.type', 'vip'] }
              }
            }
          },
          normal_seats: {
            $size: {
              $filter: {
                input: '$seats',
                cond: { $eq: ['$$this.type', 'normal'] }
              }
            }
          }
        }
      },
      {
        $project: {
          _id: 1,
          name: 1,
          status: 1,
          theater_name: 1,
          theater_location: 1,
          total_seats: 1,
          active_seats: 1,
          inactive_seats: 1,
          vip_seats: 1,
          normal_seats: 1
        }
      }
    ]);

    res.status(200).json({
      success: true,
      message: "Lấy thống kê phòng thành công",
      data: stats[0]
    });
  } catch (error) {
    next(error);
  }
};

