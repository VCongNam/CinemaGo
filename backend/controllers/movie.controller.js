import Movie from "../models/movie.js";
import { formatForAPI, formatVietnamTime } from "../utils/timezone.js";

// Lấy tất cả movies (có phân trang và tìm kiếm)
export const getAllMovies = async (req, res, next) => {
  try {
    const { page = 1, limit = 10, search = '' } = req.query;
    const pageNum = parseInt(page, 10);
    const limitNum = parseInt(limit, 10);
    const skip = (pageNum - 1) * limitNum;

    const query = { status: "active" };
    if (search) {
      // Tìm kiếm không phân biệt chữ hoa/thường
      query.title = { $regex: search, $options: 'i' };
    }

    const [movies, totalCount] = await Promise.all([
      Movie.find(query)
        .sort({ created_at: -1 })
        .skip(skip)
        .limit(limitNum),
      Movie.countDocuments(query)
    ]);
    
    // Format dates to Vietnam timezone
    const formattedMovies = movies.map(movie => {
      const movieObj = movie.toObject();
      if (movieObj.release_date) {
        movieObj.release_date = formatForAPI(movieObj.release_date);
      }
      if (movieObj.created_at) {
        movieObj.created_at = formatForAPI(movieObj.created_at);
      }
      if (movieObj.updated_at) {
        movieObj.updated_at = formatForAPI(movieObj.updated_at);
      }
      return movieObj;
    });
    
    res.status(200).json({
      message: "Lấy danh sách phim thành công",
      data: formattedMovies,
      page: pageNum,
      limit: limitNum,
      totalCount
    });
  } catch (error) {
    next(error);
  }
};

// Lấy movie theo ID
export const getMovieById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const movie = await Movie.findById(id);
    
    if (!movie) {
      return res.status(404).json({
        message: "Không tìm thấy phim"
      });
    }
    
    // Format dates to Vietnam timezone
    const movieObj = movie.toObject();
    if (movieObj.release_date) {
      movieObj.release_date = formatForAPI(movieObj.release_date);
    }
    if (movieObj.created_at) {
      movieObj.created_at = formatForAPI(movieObj.created_at);
    }
    if (movieObj.updated_at) {
      movieObj.updated_at = formatForAPI(movieObj.updated_at);
    }
    
    res.status(200).json({
      message: "Lấy thông tin phim thành công",
      data: movieObj
    });
  } catch (error) {
    next(error);
  }
};

// Tạo movie mới (chỉ staff/admin)
export const createMovie = async (req, res, next) => {
  try {
    const { title, description, duration, genre, release_date, trailer_url, poster_url, status } = req.body;
    
    // Create movie with validated data
    const movie = await Movie.create({
      title,
      description,
      duration,
      genre,
      release_date,
      trailer_url,
      poster_url,
      status: status || "active" // Default to active if not provided
    });
    
    // Format dates to Vietnam timezone
    const movieObj = movie.toObject();
    if (movieObj.release_date) {
      movieObj.release_date = formatForAPI(movieObj.release_date);
    }
    if (movieObj.created_at) {
      movieObj.created_at = formatForAPI(movieObj.created_at);
    }
    if (movieObj.updated_at) {
      movieObj.updated_at = formatForAPI(movieObj.updated_at);
    }
    
    res.status(201).json({
      message: "Tạo phim mới thành công",
      data: movieObj
    });
  } catch (error) {
    next(error);
  }
};

// Cập nhật movie (chỉ staff/admin)
export const updateMovie = async (req, res, next) => {
  try {
    const { id } = req.params;
    const updateData = req.body;
    
    const movie = await Movie.findByIdAndUpdate(
      id,
      updateData,
      { new: true, runValidators: true }
    );
    
    if (!movie) {
      return res.status(404).json({
        message: "Không tìm thấy phim"
      });
    }
    
    // Format dates to Vietnam timezone
    const movieObj = movie.toObject();
    if (movieObj.release_date) {
      movieObj.release_date = formatForAPI(movieObj.release_date);
    }
    if (movieObj.created_at) {
      movieObj.created_at = formatForAPI(movieObj.created_at);
    }
    if (movieObj.updated_at) {
      movieObj.updated_at = formatForAPI(movieObj.updated_at);
    }
    
    res.status(200).json({
      message: "Cập nhật phim thành công",
      data: movieObj
    });
  } catch (error) {
    next(error);
  }
};

// Xóa movie (chỉ staff/admin) - Chuyển thành xóa mềm
export const deleteMovie = async (req, res, next) => {
  try {
    const { id } = req.params;
    
    const movie = await Movie.findByIdAndUpdate(
      id,
      { status: 'inactive' }, // Đánh dấu là không hoạt động thay vì xóa
      { new: true }
    );
    
    if (!movie) {
      return res.status(404).json({
        message: "Không tìm thấy phim"
      });
    }
    
    res.status(200).json({
      message: "Xóa phim thành công (chuyển sang trạng thái không hoạt động)"
    });
  } catch (error) {
    next(error);
  }
};

// Cập nhật trạng thái movie (chỉ staff/admin)
export const updateMovieStatus = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    
    // Find the movie first to check if it exists
    const existingMovie = await Movie.findById(id);
    if (!existingMovie) {
      return res.status(404).json({
        message: "Không tìm thấy phim",
        error: "MOVIE_NOT_FOUND"
      });
    }
    
    // Check if status is actually changing
    if (existingMovie.status === status) {
      return res.status(200).json({
        message: `Trạng thái phim đã là '${status}'`,
        data: existingMovie,
        note: "Không có thay đổi nào được thực hiện"
      });
    }
    
    // Update the status
    const movie = await Movie.findByIdAndUpdate(
      id,
      { status },
      { new: true, runValidators: true }
    );
    
    // Format dates to Vietnam timezone
    const movieObj = movie.toObject();
    if (movieObj.release_date) {
      movieObj.release_date = formatForAPI(movieObj.release_date);
    }
    if (movieObj.created_at) {
      movieObj.created_at = formatForAPI(movieObj.created_at);
    }
    if (movieObj.updated_at) {
      movieObj.updated_at = formatForAPI(movieObj.updated_at);
    }
    
    res.status(200).json({
      message: "Cập nhật trạng thái phim thành công",
      data: movieObj,
      changes: {
        previousStatus: existingMovie.status,
        newStatus: status
      }
    });
  } catch (error) {
    next(error);
  }
};

// Lấy tất cả thể loại phim
export const getAllGenres = async (req, res, next) => {
  try {
    const movies = await Movie.find({ status: "active" }, { genre: 1 });
    
    // Lấy tất cả thể loại từ các phim và loại bỏ trùng lặp
    const allGenres = [...new Set(movies.flatMap(movie => movie.genre))];
    
    res.status(200).json({
      message: "Lấy danh sách thể loại phim thành công",
      data: allGenres,
      count: allGenres.length
    });
  } catch (error) {
    next(error);
  }
};

// Lọc phim theo thể loại
export const getMoviesByGenre = async (req, res, next) => {
  try {
    const { genre } = req.params;
    
    if (!genre) {
      return res.status(400).json({
        message: "Thể loại phim là bắt buộc"
      });
    }
    
    const movies = await Movie.find({ 
      status: "active",
      genre: { $in: [genre] }
    }).sort({ created_at: -1 });
    
    // Format dates to Vietnam timezone
    const formattedMovies = movies.map(movie => {
      const movieObj = movie.toObject();
      if (movieObj.release_date) {
        movieObj.release_date = formatForAPI(movieObj.release_date);
      }
      if (movieObj.created_at) {
        movieObj.created_at = formatForAPI(movieObj.created_at);
      }
      if (movieObj.updated_at) {
        movieObj.updated_at = formatForAPI(movieObj.updated_at);
      }
      return movieObj;
    });
    
    res.status(200).json({
      message: `Lấy danh sách phim thể loại "${genre}" thành công`,
      data: formattedMovies,
      count: formattedMovies.length,
      genre: genre
    });
  } catch (error) {
    next(error);
  }
};
