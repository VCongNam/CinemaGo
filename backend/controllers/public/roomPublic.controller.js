import Room from "../../models/room.js";
import Seat from "../../models/seat.js";
import mongoose from "mongoose";

export const getPublicRoomsByTheater = async (req, res, next) => {
  try {
    const { theaterId } = req.params;
    const { page = 1, pageSize = 10, orderBy = 'created_at', orderDir = 'DESC', status = 'active' } = req.body || {};

    if (!theaterId?.match(/^[0-9a-fA-F]{24}$/)) {
      return res.status(400).json({ message: 'ID rạp không hợp lệ' });
    }

    const pageNum = parseInt(page);
    const limit = parseInt(pageSize);
    const skip = (pageNum - 1) * limit;

    const filter = { theater_id: new mongoose.Types.ObjectId(theaterId) };
    if (status && typeof status === 'string' && status.trim() !== '') {
      filter.status = status;
    } else {
      filter.status = 'active';
    }

    const sort = {};
    const sortOrder = (String(orderDir).toUpperCase() === 'ASC') ? 1 : -1;
    sort[orderBy] = sortOrder;

    const [rows, totalCount] = await Promise.all([
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
        { $addFields: { total_seats: { $size: '$seats' } } },
        { $project: { seats: 0 } },
        { $sort: sort },
        { $skip: skip },
        { $limit: limit }
      ]),
      Room.countDocuments(filter)
    ]);

    const list = rows.map(r => ({ id: r._id, name: r.name, status: r.status, total_seats: r.total_seats }));

    return res.status(200).json({
      message: 'Lấy danh sách phòng công khai thành công',
      page: pageNum,
      pageSize: limit,
      totalCount,
      list
    });
  } catch (err) {
    next(err);
  }
};

export const getPublicRoomSeats = async (req, res, next) => {
  try {
    const { roomId } = req.params;
    if (!roomId?.match(/^[0-9a-fA-F]{24}$/)) {
      return res.status(400).json({ message: 'ID phòng không hợp lệ' });
    }

    const seats = await Seat.find({ room_id: roomId, status: 'active' }).sort({ seat_number: 1 });
    const list = seats.map(s => ({ id: s._id, seat_number: s.seat_number, type: s.type }));

    return res.status(200).json({
      message: 'Lấy danh sách ghế công khai thành công',
      totalCount: list.length,
      list
    });
  } catch (err) {
    next(err);
  }
};


