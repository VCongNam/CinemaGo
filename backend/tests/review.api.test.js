import { jest, describe, it, expect, beforeAll, afterAll, beforeEach } from '@jest/globals';

// ✅ SỬA LỖI 1: Bỏ comment các khai báo 'let' toàn cục
let request, mongoose, MongoMemoryServer, express;
let User, Movie, Booking, Showtime, Review; 
let reviewRoutes, errorHandler, jwt; // Thêm jwt
let mongoServer;
let app;

let customerId, adminId, otherUserId;
let movie1, movie2;
let showtime1, showtime2;
let booking1_confirmed;
let review1_otherUser;
const JWT_SECRET = 'YOUR_TEST_SECRET'; // Secret giả để test logout

beforeAll(async () => {
	
	// Mock Auth Middleware
	await jest.unstable_mockModule('../middlewares/auth.js', () => ({
		verifyToken: jest.fn((req, res, next) => {
			const authHeader = req.headers.authorization;
			if (!authHeader) return res.status(401).json({ message: 'Chưa xác thực' });
			const token = authHeader.split(' ')[1];
			
			if (token === 'customer-token' && customerId) {
				req.user = { _id: customerId, id: customerId, role: 'customer' };
			} else if (token === 'admin-token' && adminId) {
				req.user = { _id: adminId, id: adminId, role: 'admin' };
			} else if (token === 'other-user-token' && otherUserId) {
				req.user = { _id: otherUserId, id: otherUserId, role: 'customer' };
			} else if (token) {
				// Xử lý token thật (dùng cho test logout)
				try {
					const decoded = jwt.verify(token, JWT_SECRET); 
					req.user = { _id: decoded.sub, id: decoded.sub, role: 'customer' };
				} catch(e) {
					return res.status(401).json({ message: 'Token không hợp lệ' });
				}
			} else {
				return res.status(401).json({ message: 'Token không hợp lệ' });
			}
			next();
		}),
		isAdmin: jest.fn((req, res, next) => (req.user && req.user.role === 'admin' ? next() : res.status(403).json({ message: 'Không có quyền Admin' }))),
		requireCustomer: jest.fn((req, res, next) => (req.user && (req.user.role === 'customer' || req.user.role === 'admin') ? next() : res.status(403).json({ message: 'Không có quyền Customer' }))),
		validateReview: jest.fn((req, res, next) => next()),
	}));

	// ✅ SỬA LỖI 2: Bỏ comment các import động
	request = (await import('supertest')).default;
	MongoMemoryServer = (await import('mongodb-memory-server')).MongoMemoryServer;
	express = (await import('express')).default;
	mongoose = (await import('mongoose')).default;
	jwt = (await import('jsonwebtoken')).default; // Import jwt thật

	User = (await import('../models/user.js')).default;
	Movie = (await import('../models/movie.js')).default;
	Booking = (await import('../models/booking.js')).default;
	Showtime = (await import('../models/showtime.js')).default;
	Review = (await import('../models/review.js')).default;

	reviewRoutes = (await import('../routes/review.routes.js')).default; 
	errorHandler = (await import('../middlewares/errorHandler.js')).default;

	// --- Khởi tạo ID (Sau khi import mongoose) ---
	customerId = new mongoose.Types.ObjectId().toHexString();
	adminId = new mongoose.Types.ObjectId().toHexString();
	otherUserId = new mongoose.Types.ObjectId().toHexString();
	
	// --- Khởi tạo DB và App ---
	mongoServer = await MongoMemoryServer.create();
	await mongoose.connect(mongoServer.getUri());

	app = express();
	app.use(express.json());
	app.use('/api/reviews', reviewRoutes); // Dòng này giờ sẽ chạy đúng
	app.use(errorHandler);
});

// --- Dọn dẹp ---
afterAll(async () => {
	if (mongoose) await mongoose.disconnect();
	if (mongoServer) await mongoServer.stop();
	jest.unmock('../middlewares/auth.js'); 
});

// --- Setup dữ liệu test chung ---
beforeEach(async () => {
	// Clear DB (Kiểm tra 'if' để đảm bảo model đã được load)
	if (User) await User.deleteMany({});
	if (Movie) await Movie.deleteMany({});
	if (Booking) await Booking.deleteMany({});
	if (Showtime) await Showtime.deleteMany({});
	if (Review) await Review.deleteMany({});
	
	jest.clearAllMocks();

	// Tạo User (Đã thêm 'password')
	await User.create([
		{ _id: customerId, username: 'customer', email: 'customer@test.com', password: 'password123' },
		{ _id: adminId, username: 'admin', email: 'admin@test.com', role: 'admin', password: 'password123' },
		{ _id: otherUserId, username: 'otherUser', email: 'other@test.com', password: 'password123' },
	]);

	// Tạo Phim (Đã thêm 'duration', 'average_rating', 'review_count' - **Đảm bảo các trường này có trong Movie Schema**)
	[movie1, movie2] = await Movie.create([
		{ title: 'Movie 1 (Customer Watched)', duration: 120, average_rating: 0, review_count: 0 },
		{ title: 'Movie 2 (Other Watched)', duration: 90, average_rating: 0, review_count: 0 },
	]);

	const startTime1 = new Date();
	const endTime1 = new Date(startTime1.getTime() + 120 * 60000); 
	const startTime2 = new Date();
	const endTime2 = new Date(startTime2.getTime() + 90 * 60000); 

	// Tạo Suất chiếu (Đã thêm 'end_time')
	[showtime1, showtime2] = await Showtime.create([
		{ movie_id: movie1._id, room_id: new mongoose.Types.ObjectId(), start_time: startTime1, end_time: endTime1 },
		{ movie_id: movie2._id, room_id: new mongoose.Types.ObjectId(), start_time: startTime2, end_time: endTime2 },
	]);

	// Tạo Booking (Đã thêm 'payment_method', 'total_price')
	booking1_confirmed = await Booking.create({
		user_id: customerId,
		showtime_id: showtime1._id,
		status: 'confirmed',
		payment_method: 'online', 
		total_price: 150000
	});

	await Booking.create({
		user_id: otherUserId,
		showtime_id: showtime2._id,
		status: 'confirmed',
		payment_method: 'cash', 
		total_price: 100000
	});
	
	review1_otherUser = await Review.create({
		movie_id: movie2._id,
		user_id: otherUserId,
		rating: 5,
		comment: 'Great movie!',
		status: 'approved' 
	});
	
	// Cập nhật lại movie2 để đảm bảo dữ liệu test ban đầu
	await Movie.findByIdAndUpdate(movie2._id, { average_rating: 5, review_count: 1 });
});
// --- Hết Setup ---


// ===============================================
// == Bắt đầu các bộ test cho Review API
// ===============================================
describe('Review API', () => {

	describe('POST /api/reviews (createReview)', () => {
		it('1.1: nên tạo review thành công (201) (đã xem phim, chưa review)', async () => {
			const reviewData = {
				movie_id: movie1._id.toString(), 
				rating: 4,
				comment: 'Good movie'
			};

			const response = await request(app)
				.post('/api/reviews')
				.set('Authorization', 'Bearer customer-token')
				.send(reviewData);

			expect(response.status).toBe(201);
			expect(response.body.message).toContain('Đánh giá của bạn đã được ghi nhận');
			
			// FIX: Thêm .lean() để truy xuất thuộc tính an toàn hơn
			const movie = await Movie.findById(movie1._id).lean();
			expect(movie).toBeTruthy();
			expect(movie.average_rating).toBe(0); // Giả định review mới là 'pending' nên rating không đổi
		});

		it('2.1: nên trả về lỗi 403 (chưa xem phim)', async () => {
				const reviewData = {
						movie_id: movie2._id.toString(), // Customer CHƯA xem movie2
						rating: 5,
				};
	
				const response = await request(app)
						.post('/api/reviews')
						.set('Authorization', 'Bearer customer-token')
						.send(reviewData);
	
				expect(response.status).toBe(403);
				// ✅ SỬA LỖI 3: Sửa 'bạn' thành 'Bạn' (lỗi case-sensitive)
				expect(response.body.message).toContain('Bạn cần đặt vé và xem phim này');
		});

		it('2.2: nên trả về lỗi 400 (đã review rồi)', async () => {
				await Review.create({ movie_id: movie1._id, user_id: customerId, rating: 1 });
				const reviewData = {
						movie_id: movie1._id.toString(), 
						rating: 5,
				};
	
				const response = await request(app)
						.post('/api/reviews')
						.set('Authorization', 'Bearer customer-token')
						.send(reviewData);
	
				expect(response.status).toBe(400);
				expect(response.body.message).toContain('Bạn đã đánh giá bộ phim này rồi');
		});

		it('2.3: nên trả về lỗi 401 (chưa đăng nhập)', async () => {
				const response = await request(app)
						.post('/api/reviews')
						.send({ movie_id: movie1._id, rating: 5 });
				expect(response.status).toBe(401);
		});
	});

	describe('GET /api/reviews/movie/:movieId', () => {
		it('3.1: nên lấy danh sách review (approved) thành công', async () => {
				const response = await request(app).get(`/api/reviews/movie/${movie2._id}`);
				expect(response.status).toBe(200);
				expect(response.body.data).toHaveLength(1);
		});

		it('3.2: nên trả về mảng rỗng (chưa có review approved)', async () => {
				const response = await request(app).get(`/api/reviews/movie/${movie1._id}`);
				expect(response.status).toBe(200);
				expect(response.body.data).toHaveLength(0);
		});
	});

	describe('PUT /api/reviews/:reviewId', () => {
		let myReview;
		beforeEach(async () => {
				// Đặt lại dữ liệu ban đầu cho các test PUT
				await Movie.findByIdAndUpdate(movie1._id, { average_rating: 0, review_count: 0 }); 
				await Review.deleteMany({ movie_id: movie1._id });
				
				myReview = await Review.create({
						movie_id: movie1._id,
						user_id: customerId,
						rating: 3,
						status: 'approved'
				});
				// Cập nhật lại Movie để tính toán dựa trên review vừa tạo (rating: 3, count: 1)
				await Movie.findByIdAndUpdate(movie1._id, { average_rating: 3, review_count: 1 });
		});
		
		it('4.1: nên cho phép chủ sở hữu cập nhật review (200) và recalculate rating', async () => {
				const response = await request(app)
						.put(`/api/reviews/${myReview._id}`)
						.set('Authorization', 'Bearer customer-token')
						.send({ rating: 5, comment: 'New comment' });

				expect(response.status).toBe(200);
				// FIX: Thêm .lean()
				const movie = await Movie.findById(movie1._id).lean();
				expect(movie).toBeTruthy();
				// Rating phải là 5 (Vì chỉ có 1 review duy nhất được cập nhật từ 3 lên 5)
				expect(movie.average_rating).toBe(5); 
		});

		it('4.2: nên cấm (403) người khác cập nhật review', async () => {
				const response = await request(app)
						.put(`/api/reviews/${myReview._id}`) 
						.set('Authorization', 'Bearer other-user-token') // User khác
						.send({ rating: 1 });
				expect(response.status).toBe(403);
		});

		it('4.3: nên trả về 404 nếu review không tồn tại', async () => {
				const fakeId = new mongoose.Types.ObjectId().toHexString();
				const response = await request(app)
						.put(`/api/reviews/${fakeId}`)
						.set('Authorization', 'Bearer customer-token')
						.send({ rating: 1 });
				expect(response.status).toBe(404);
		});
	});

	describe('DELETE /api/reviews/:reviewId', () => {
		it('5.1: nên cho phép chủ sở hữu xóa review (200) và recalculate rating', async () => {
				const response = await request(app)
						.delete(`/api/reviews/${review1_otherUser._id}`)
						.set('Authorization', 'Bearer other-user-token'); // Chính chủ

				expect(response.status).toBe(200);
				// FIX: Thêm .lean()
				const movie = await Movie.findById(movie2._id).lean();
				expect(movie).toBeTruthy();
				// Review Count và Average Rating phải trở về 0 vì đây là review duy nhất
				expect(movie.average_rating).toBe(0); 
				expect(movie.review_count).toBe(0);
		});

		it('5.2: nên cho phép Admin xóa review của người khác (200) và recalculate rating', async () => {
				const response = await request(app)
						.delete(`/api/reviews/${review1_otherUser._id}`)
						.set('Authorization', 'Bearer admin-token'); // Admin xóa

				expect(response.status).toBe(200);
				// FIX: Thêm .lean()
				const movieAfter = await Movie.findById(movie2._id).lean();
				expect(movieAfter).toBeTruthy();
				// Review Count và Average Rating phải trở về 0
				expect(movieAfter.average_rating).toBe(0);
				expect(movieAfter.review_count).toBe(0);
		});

		it('5.3: nên cấm (403) người khác (không phải admin) xóa review', async () => {
			const response = await request(app)
						.delete(`/api/reviews/${review1_otherUser._id}`)
						.set('Authorization', 'Bearer customer-token'); // Customer cố xóa
				expect(response.status).toBe(403);
		});
	});

});