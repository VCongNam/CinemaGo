import Theater from "../../models/theater.js";
import Room from "../../models/room.js";
import mongoose from "mongoose";

export const getPublicTheaters = async (req, res, next) => {
  try {
    const { page = 1, pageSize = 10, orderBy = 'created_at', orderDir = 'DESC', status = 'active' } = req.body || {};
    const pageNum = parseInt(page);
    const limit = parseInt(pageSize);
    const skip = (pageNum - 1) * limit;

    const filter = {};
    if (status && typeof status === 'string' && status.trim() !== '') {
      filter.status = status;
    } else {
      filter.status = 'active';
    }

    const sort = {};
    const sortOrder = (String(orderDir).toUpperCase() === 'ASC') ? 1 : -1;
    sort[orderBy] = sortOrder;

    const [rows, totalCount] = await Promise.all([
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
        { $addFields: { rooms_count: { $size: '$rooms' } } },
        { $project: { rooms: 0 } },
        { $sort: sort },
        { $skip: skip },
        { $limit: limit }
      ]),
      Theater.countDocuments(filter)
    ]);

    const list = rows.map(t => ({
      id: t._id,
      name: t.name,
      location: t.location,
      rooms_count: t.rooms_count
    }));

    return res.status(200).json({
      message: 'Lấy danh sách rạp công khai thành công',
      page: pageNum,
      pageSize: limit,
      totalCount,
      list
    });
  } catch (err) {
    next(err);
  }
};

export const getPublicTheaterById = async (req, res, next) => {
  try {
    const { theaterId } = req.params;
    if (!theaterId?.match(/^[0-9a-fA-F]{24}$/)) {
      return res.status(400).json({ message: 'ID rạp không hợp lệ' });
    }

    const rows = await Theater.aggregate([
      { $match: { _id: new mongoose.Types.ObjectId(theaterId), status: 'active' } },
      {
        $lookup: {
          from: 'rooms',
          localField: '_id',
          foreignField: 'theater_id',
          as: 'rooms'
        }
      },
      {
        $addFields: {
          rooms: {
            $filter: { input: '$rooms', cond: { $eq: ['$$this.status', 'active'] } }
          },
          rooms_count: { $size: '$rooms' }
        }
      },
      { $project: { 'rooms.created_at': 0, 'rooms.updated_at': 0 } }
    ]);

    if (!rows.length) {
      return res.status(404).json({ message: 'Không tìm thấy rạp' });
    }

    const t = rows[0];
    return res.status(200).json({
      message: 'Lấy chi tiết rạp công khai thành công',
      data: {
        id: t._id,
        name: t.name,
        location: t.location,
        rooms_count: t.rooms_count,
        rooms: t.rooms.map(r => ({ id: r._id, name: r.name, status: r.status }))
      }
    });
  } catch (err) {
    next(err);
  }
};


