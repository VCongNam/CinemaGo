import Theater from "../models/theater.js";
import Room from "../models/room.js";
import Seat from "../models/seat.js";
import mongoose from "mongoose";
import { logAction } from "../utils/logger.js";

// Lấy danh sách tất cả rạp (chỉ admin)
export const getAllTheaters = async (req, res, next) => {
  try {
    const { page = 1, pageSize = 10, orderBy = 'created_at', orderDir = 'ASC', status = '', filterCriterias = [] } = req.body;

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

    // Query database with aggregation to get room and seat counts
    const [theaters, totalCount] = await Promise.all([
      Theater.aggregate([
        { $match: filter },
        {
          $lookup: {
            from: 'rooms',
            localField: '_id',
            foreignField: 'theater_id',
            as: 'rooms'
          }
        },
        {
          $lookup: {
            from: 'seats',
            localField: 'rooms._id',
            foreignField: 'room_id',
            as: 'seats'
          }
        },
        {
          $addFields: {
            rooms_count: { $size: '$rooms' },
            total_seats: { $size: '$seats' },
            active_rooms: {
              $size: {
                $filter: {
                  input: '$rooms',
                  cond: { $eq: ['$$this.status', 'active'] }
                }
              }
            }
          }
        },
        {
          $project: {
            rooms: 0,
            seats: 0
          }
        },
        { $sort: sort },
        { $skip: skip },
        { $limit: limit }
      ]),
      Theater.countDocuments(filter)
    ]);

    // Format response
    const formattedTheaters = theaters.map(theater => ({
      id: theater._id,
      name: theater.name,
      location: theater.location,
      status: theater.status,
      rooms_count: theater.rooms_count,
      total_seats: theater.total_seats,
      active_rooms: theater.active_rooms,
      createdAt: theater.created_at,
      updatedAt: theater.updated_at
    }));

    res.status(200).json({
      message: "Lấy danh sách rạp thành công",
      page: pageNum,
      pageSize: limit,
      totalCount,
      list: formattedTheaters
    });
  } catch (error) {
    next(error);
  }
};

// Lấy chi tiết rạp theo ID (chỉ admin)
export const getTheaterById = async (req, res, next) => {
  try {
    const { id } = req.params;

    if (!id.match(/^[0-9a-fA-F]{24}$/)) {
      return res.status(400).json({ 
        success: false,
        message: "ID rạp không hợp lệ" 
      });
    }

    const theater = await Theater.aggregate([
      { $match: { _id: new mongoose.Types.ObjectId(id) } },
      {
        $lookup: {
          from: 'rooms',
          localField: '_id',
          foreignField: 'theater_id',
          as: 'rooms'
        }
      },
      {
        $lookup: {
          from: 'seats',
          localField: 'rooms._id',
          foreignField: 'room_id',
          as: 'seats'
        }
      },
      {
        $addFields: {
          rooms_count: { $size: '$rooms' },
          total_seats: { $size: '$seats' },
          active_rooms: {
            $size: {
              $filter: {
                input: '$rooms',
                cond: { $eq: ['$$this.status', 'active'] }
              }
            }
          }
        }
      }
    ]);

    if (!theater || theater.length === 0) {
      return res.status(404).json({ 
        success: false,
        message: "Không tìm thấy rạp" 
      });
    }

    res.status(200).json({
      success: true,
      message: "Lấy thông tin rạp thành công",
      data: theater[0]
    });
  } catch (error) {
    next(error);
  }
};

// Tạo rạp mới (chỉ admin)
export const createTheater = async (req, res, next) => {
  try {
    const { name, location } = req.body;

    // Validation
    if (!name || !location) {
      return res.status(400).json({ 
        success: false,
        message: "Tên rạp và địa điểm là bắt buộc" 
      });
    }

    // Kiểm tra tên rạp đã tồn tại chưa
    const existingTheater = await Theater.findOne({ 
      name: { $regex: new RegExp(`^${name}$`, 'i') } 
    });

    if (existingTheater) {
      return res.status(400).json({ 
        success: false,
        message: "Tên rạp đã tồn tại" 
      });
    }

    const theater = await Theater.create({
      name: name.trim(),
      location: location.trim(),
      status: 'active'
    });

    // Ghi log hành động tạo
    await logAction(req.user.id, 'Theater', theater._id, 'document', null, theater);

    res.status(201).json({
      success: true,
      message: "Tạo rạp thành công",
      data: theater
    });
  } catch (error) {
    next(error);
  }
};

// Cập nhật rạp (chỉ admin)
export const updateTheater = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { name, location, status } = req.body;

    if (!id.match(/^[0-9a-fA-F]{24}$/)) {
      return res.status(400).json({
        success: false,
        message: "ID rạp không hợp lệ"
      });
    }

    const oldTheater = await Theater.findById(id).lean();
    if (!oldTheater) {
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy rạp"
      });
    }

    // Kiểm tra tên rạp trùng lặp (nếu có thay đổi tên)
    if (name && name !== oldTheater.name) {
      const existingTheater = await Theater.findOne({
        name: { $regex: new RegExp(`^${name}$`, 'i') },
        _id: { $ne: id }
      });

      if (existingTheater) {
        return res.status(400).json({
          success: false,
          message: "Tên rạp đã tồn tại"
        });
      }
    }

    // Cập nhật
    const updateData = {};
    if (name !== undefined) updateData.name = name.trim();
    if (location !== undefined) updateData.location = location.trim();
    if (status !== undefined) updateData.status = status;

    const updatedTheater = await Theater.findByIdAndUpdate(
      id,
      updateData,
      { new: true, runValidators: true }
    );

    // Ghi log cho các trường đã thay đổi
    const changes = Object.keys(updateData);
    for (const field of changes) {
      if (oldTheater[field] !== updatedTheater[field]) {
        await logAction(req.user.id, 'Theater', updatedTheater._id, field, oldTheater[field], updatedTheater[field]);
      }
    }

    res.status(200).json({
      success: true,
      message: "Cập nhật rạp thành công",
      data: updatedTheater
    });
  } catch (error) {
    next(error);
  }
};

// Xóa rạp (chỉ admin) - Soft delete
export const deleteTheater = async (req, res, next) => {
  try {
    const { id } = req.params;

    if (!id.match(/^[0-9a-fA-F]{24}$/)) {
      return res.status(400).json({ 
        success: false,
        message: "ID rạp không hợp lệ" 
      });
    }

    const theater = await Theater.findById(id);
    if (!theater) {
      return res.status(404).json({ 
        success: false,
        message: "Không tìm thấy rạp" 
      });
    }

    // Kiểm tra rạp có phòng chiếu không
    const roomsCount = await Room.countDocuments({ theater_id: id });
    if (roomsCount > 0) {
      return res.status(400).json({ 
        success: false,
        message: "Không thể xóa rạp có phòng chiếu. Vui lòng xóa tất cả phòng chiếu trước" 
      });
    }

    // Soft delete - cập nhật status thành inactive
    await Theater.findByIdAndUpdate(id, { status: 'inactive' });

    // Ghi log hành động xóa (thay đổi status)
    await logAction(req.user.id, 'Theater', theater._id, 'status', theater.status, 'inactive');

    res.status(200).json({
      success: true,
      message: "Xóa rạp thành công"
    });
  } catch (error) {
    next(error);
  }
};

// Thay đổi trạng thái rạp (chỉ admin)
export const updateTheaterStatus = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!id.match(/^[0-9a-fA-F]{24}$/)) {
      return res.status(400).json({ 
        success: false,
        message: "ID rạp không hợp lệ" 
      });
    }

    if (!status || !['active', 'inactive'].includes(status)) {
      return res.status(400).json({ 
        success: false,
        message: "Trạng thái phải là 'active' hoặc 'inactive'" 
      });
    }

    const theater = await Theater.findById(id);
    if (!theater) {
      return res.status(404).json({ 
        success: false,
        message: "Không tìm thấy rạp" 
      });
    }

    const updatedTheater = await Theater.findByIdAndUpdate(
      id,
      { status },
      { new: true }
    );

    // Ghi log hành động thay đổi status
    await logAction(req.user.id, 'Theater', theater._id, 'status', theater.status, updatedTheater.status);

    res.status(200).json({
      success: true,
      message: `Cập nhật trạng thái rạp thành '${status}' thành công`,
      data: updatedTheater
    });
  } catch (error) {
    next(error);
  }
};

// Lấy thống kê rạp (chỉ admin)
export const getTheaterStats = async (req, res, next) => {
  try {
    const { id } = req.params;

    if (!id.match(/^[0-9a-fA-F]{24}$/)) {
      return res.status(400).json({ 
        success: false,
        message: "ID rạp không hợp lệ" 
      });
    }

    const theater = await Theater.findById(id);
    if (!theater) {
      return res.status(404).json({ 
        success: false,
        message: "Không tìm thấy rạp" 
      });
    }

    // Thống kê chi tiết
    const stats = await Theater.aggregate([
      { $match: { _id: new mongoose.Types.ObjectId(id) } },
      {
        $lookup: {
          from: 'rooms',
          localField: '_id',
          foreignField: 'theater_id',
          as: 'rooms'
        }
      },
      {
        $lookup: {
          from: 'seats',
          localField: 'rooms._id',
          foreignField: 'room_id',
          as: 'seats'
        }
      },
      {
        $addFields: {
          total_rooms: { $size: '$rooms' },
          active_rooms: {
            $size: {
              $filter: {
                input: '$rooms',
                cond: { $eq: ['$$this.status', 'active'] }
              }
            }
          },
          inactive_rooms: {
            $size: {
              $filter: {
                input: '$rooms',
                cond: { $eq: ['$$this.status', 'inactive'] }
              }
            }
          },
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
          _id: 1,
          name: 1,
          location: 1,
          status: 1,
          total_rooms: 1,
          active_rooms: 1,
          inactive_rooms: 1,
          total_seats: 1,
          active_seats: 1,
          vip_seats: 1,
          normal_seats: 1
        }
      }
    ]);

    res.status(200).json({
      success: true,
      message: "Lấy thống kê rạp thành công",
      data: stats[0]
    });
  } catch (error) {
    next(error);
  }
};
