import { jest, describe, it, expect, beforeAll, afterAll, beforeEach } from '@jest/globals';
import jwt from 'jsonwebtoken';

let request, mongoose, MongoMemoryServer, express, Movie, User;
let publicMovieRoutes, protectedRoutes, errorHandler;
let mongoServer;
let app;

const JWT_SECRET = process.env.JWT_SECRET || "dev_secret_change_me";



beforeAll(async () => {
  request = (await import('supertest')).default;
  mongoose = (await import('mongoose')).default;
  MongoMemoryServer = (await import('mongodb-memory-server')).MongoMemoryServer;
  express = (await import('express')).default;
  
  publicMovieRoutes = (await import('../routes/publicMovie.routes.js')).default;
  protectedRoutes = (await import('../routes/protected.routes.js')).default;
  Movie = (await import('../models/movie.js')).default;
  User = (await import('../models/user.js')).default;
  errorHandler = (await import('../middlewares/errorHandler.js')).default;


  
  mongoServer = await MongoMemoryServer.create();
  await mongoose.connect(mongoServer.getUri());

  
  app = express();
  app.use(express.json());
  
  
  app.use('/api/movies', publicMovieRoutes); 
  app.use('/api', protectedRoutes);     
  app.use(errorHandler);
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongoServer.stop();
});


beforeEach(async () => {
    await Movie.deleteMany({});
});



describe('Movie API', () => {

  
  describe('Public Routes', () => {
    
    describe('GET /api/movies', () => {
      beforeEach(async () => {
        await Movie.create([
            { title: 'Inception', duration: 148, status: 'active', genre: ['Sci-Fi', 'Action'] },
            { title: 'The Dark Knight', duration: 152, status: 'active', genre: ['Action', 'Drama'] },
            { title: 'Interstellar', duration: 169, status: 'inactive', genre: ['Sci-Fi', 'Adventure'] },
        ]);
      });

      it('TC1.1: nên trả về danh sách các phim đang hoạt động', async () => {
        const response = await request(app).get('/api/movies');
        expect(response.status).toBe(200);
        expect(response.body.data).toHaveLength(2);
      });
      
      it('TC1.3: nên tìm kiếm phim theo title thành công', async () => {
        const response = await request(app).get('/api/movies?search=Inception');
        expect(response.status).toBe(200);
        expect(response.body.data[0].title).toBe('Inception');
      });
    });

    describe('GET /api/movies/:id', () => {
      it('TC2.1: nên trả về thông tin chi tiết của một phim khi ID hợp lệ', async () => {
        const movie = await Movie.create({ title: 'Test Movie', duration: 120, status: 'active' });
        const response = await request(app).get(`/api/movies/${movie._id}`);
        expect(response.status).toBe(200);
        expect(response.body.data.title).toBe('Test Movie');
      });

      it('TC2.2: nên trả về lỗi 404 khi ID không tồn tại', async () => {
        const nonExistentId = new mongoose.Types.ObjectId();
        const response = await request(app).get(`/api/movies/${nonExistentId}`);
        expect(response.status).toBe(404);
      });
    });

    describe('GET /api/movies/genres', () => {
      it('TC7.1: nên trả về danh sách các thể loại phim duy nhất', async () => {
        await Movie.create([
            { title: 'Movie A', duration: 120, status: 'active', genre: ['Action', 'Sci-Fi'] },
            { title: 'Movie B', duration: 130, status: 'active', genre: ['Drama', 'Action'] },
            { title: 'Movie C', duration: 100, status: 'inactive', genre: ['Comedy'] },
        ]);
        const response = await request(app).get('/api/movies/genres');
        expect(response.status).toBe(200);
        expect(response.body.data.sort()).toEqual(['Action', 'Drama', 'Sci-Fi'].sort());
      });
    });

    describe('GET /api/movies/genre/:genre', () => {
        it('TC8.1: nên trả về danh sách phim theo thể loại', async () => {
            await Movie.create([
                { title: 'Action Movie 1', duration: 120, status: 'active', genre: ['Action'] },
                { title: 'Action Movie 2 (Inactive)', duration: 110, status: 'inactive', genre: ['Action'] },
            ]);
            const response = await request(app).get('/api/movies/genre/Action');
            expect(response.status).toBe(200);
            expect(response.body.data).toHaveLength(1);
            expect(response.body.data[0].title).toBe('Action Movie 1');
        });
    });
  });


  describe('Protected Routes', () => {
    let staffToken, customerToken;

    beforeEach(async () => {
        await User.deleteMany({});
        const [staffUser, customerUser] = await User.create([

            { username: 'stafftest', email: 'staff@test.com', role: 'LV2', password: '123' },
            { username: 'customertest', email: 'customer@test.com', role: 'customer', password: '123' },
        ]);
        staffToken = jwt.sign({ sub: staffUser._id, role: staffUser.role }, JWT_SECRET);
        customerToken = jwt.sign({ sub: customerUser._id, role: customerUser.role }, JWT_SECRET);
    });

    describe('POST /api/movies', () => {
        const newMovieData = { title: 'New Protected Movie', duration: 130, genre: ['Action'] };

        it('TC3.1: tạo phim mới nếu user là staff', async () => {
            const response = await request(app)
                .post('/api/movies')
                .set('Authorization', `Bearer ${staffToken}`)
                .send(newMovieData);
            expect(response.status).toBe(201);
            expect(response.body.data.title).toBe('New Protected Movie');
        });

        it('TC3.2: trả về lỗi 403 nếu user là customer', async () => {
            const response = await request(app)
                .post('/api/movies')
                .set('Authorization', `Bearer ${customerToken}`)
                .send(newMovieData);
            expect(response.status).toBe(403);
        });
    });

    describe('PUT /api/movies/:id', () => {
        let movieToUpdate;
        beforeEach(async () => {
            movieToUpdate = await Movie.create({ title: 'Original Title', duration: 100 });
        });

        it('TC4.1: cập nhật phim nếu user là staff', async () => {
            const response = await request(app)
                .put(`/api/movies/${movieToUpdate._id}`)
                .set('Authorization', `Bearer ${staffToken}`)
                .send({ title: 'Updated Title' });

            expect(response.status).toBe(200);
            expect(response.body.data.title).toBe('Updated Title');
        });
        
        it('TC4.2: trả về lỗi 403 nếu user là customer', async () => {
            const response = await request(app)
                .put(`/api/movies/${movieToUpdate._id}`)
                .set('Authorization', `Bearer ${customerToken}`)
                .send({ title: 'Updated Title' });
            expect(response.status).toBe(403);
        });
    });

    describe('DELETE /api/movies/:id', () => {
        let movieToDelete;
        beforeEach(async () => {
            movieToDelete = await Movie.create({ title: 'To Delete', duration: 100, status: 'active' });
        });
        
        it('TC5.1: xóa mềm phim nếu user là staff', async () => {
            const response = await request(app)
                .delete(`/api/movies/${movieToDelete._id}`)
                .set('Authorization', `Bearer ${staffToken}`);

            expect(response.status).toBe(200);
            const movieInDb = await Movie.findById(movieToDelete._id);
            expect(movieInDb.status).toBe('inactive');
        });
    });

    describe('PATCH /api/movies/:id/status', () => {
        let movieToUpdateStatus;
        beforeEach(async () => {
            movieToUpdateStatus = await Movie.create({ title: 'To Update Status', duration: 100, status: 'active' });
        });

        it('TC6.1: cập nhật trạng thái phim nếu user là staff', async () => {
            const response = await request(app)
                .patch(`/api/movies/${movieToUpdateStatus._id}/status`)
                .set('Authorization', `Bearer ${staffToken}`)
                .send({ status: 'inactive' });
            
            expect(response.status).toBe(200);
            expect(response.body.data.status).toBe('inactive');
        });
    });
  });
});