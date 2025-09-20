import Movie from "../models/movie.js";

// Lấy tất cả movies
export const getAllMovies = async (req, res, next) => {
  try {
    const movies = await Movie.find({ status: "active" }).sort({ created_at: -1 });
    
    res.status(200).json({
      message: "Lấy danh sách phim thành công",
      data: movies,
      count: movies.length
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
    
    res.status(200).json({
      message: "Lấy thông tin phim thành công",
      data: movie
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
      title: title.trim(),
      description: description?.trim(),
      duration,
      genre,
      release_date,
      trailer_url: trailer_url?.trim(),
      poster_url: poster_url?.trim(),
      status: status || "active" // Default to active if not provided
    });
    
    res.status(201).json({
      message: "Tạo phim mới thành công",
      data: movie
    });
  } catch (error) {
    // Handle mongoose validation errors
    if (error.name === 'ValidationError') {
      const validationErrors = Object.values(error.errors).map(err => ({
        field: err.path,
        message: err.message
      }));
      
      return res.status(400).json({
        message: "Dữ liệu không hợp lệ",
        error: "MONGOOSE_VALIDATION_ERROR",
        details: validationErrors
      });
    }
    
    next(error);
  }
};

// Cập nhật movie (chỉ staff/admin)
export const updateMovie = async (req, res, next) => {
  try {
    const { id } = req.params;
    const updateData = { ...req.body };
    
    // Trim string fields if they exist
    if (updateData.title) updateData.title = updateData.title.trim();
    if (updateData.description) updateData.description = updateData.description.trim();
    if (updateData.trailer_url) updateData.trailer_url = updateData.trailer_url.trim();
    if (updateData.poster_url) updateData.poster_url = updateData.poster_url.trim();
    
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
    
    res.status(200).json({
      message: "Cập nhật phim thành công",
      data: movie
    });
  } catch (error) {
    // Handle mongoose validation errors
    if (error.name === 'ValidationError') {
      const validationErrors = Object.values(error.errors).map(err => ({
        field: err.path,
        message: err.message
      }));
      
      return res.status(400).json({
        message: "Dữ liệu không hợp lệ",
        error: "MONGOOSE_VALIDATION_ERROR",
        details: validationErrors
      });
    }
    
    next(error);
  }
};

// Xóa movie (chỉ staff/admin)
export const deleteMovie = async (req, res, next) => {
  try {
    const { id } = req.params;
    
    const movie = await Movie.findByIdAndDelete(id);
    
    if (!movie) {
      return res.status(404).json({
        message: "Không tìm thấy phim"
      });
    }
    
    res.status(200).json({
      message: "Xóa phim thành công"
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
    
    res.status(200).json({
      message: "Cập nhật trạng thái phim thành công",
      data: movie,
      changes: {
        previousStatus: existingMovie.status,
        newStatus: status
      }
    });
  } catch (error) {
    // Handle mongoose validation errors
    if (error.name === 'ValidationError') {
      const validationErrors = Object.values(error.errors).map(err => ({
        field: err.path,
        message: err.message
      }));
      
      return res.status(400).json({
        message: "Trạng thái không hợp lệ",
        error: "MONGOOSE_VALIDATION_ERROR",
        details: validationErrors
      });
    }
    
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
    
    res.status(200).json({
      message: `Lấy danh sách phim thể loại "${genre}" thành công`,
      data: movies,
      count: movies.length,
      genre: genre
    });
  } catch (error) {
    next(error);
  }
};
