## CinemaGo

A simple Node.js/Express + Mongoose backend starter with a placeholder frontend folder.

### Tech stack
- Node.js, Express
- MongoDB, Mongoose
- dotenv, nodemon

### Prerequisites
- Node.js 18+
- MongoDB running locally or a MongoDB Atlas connection string

### Project structure
```
backend/
  config/
    db.js
  models/
    user.js
  server.js
frontend/
package.json
```

### Environment variables
Create a `.env` file at the project root with the following values:
```
MONGO_URI=mongodb://127.0.0.1:27017/cinemago
PORT=5000
```

Note: If you use MongoDB Atlas, replace `MONGO_URI` with your connection string.

### Install & run
```bash
# install deps
npm install

# start development (auto-reload)
npm run dev

# start production
npm run build  # (if you add a build later)
npm start
```

### API routes (current)
- POST `/register-staff`
  - body: `{ "username": string, "password": string }`
  - creates a staff user with hashed password
- POST `/login-staff`
  - body: `{ "username": string, "password": string }`
  - verifies password and returns success message

### Notes
- Passwords are hashed using `bcryptjs`.
- Mongo connection is initialized in `connectDB()` when the server starts.

### Git setup
```bash
git init
git add .
git commit -m "Initial commit"
# then create a repo on GitHub and push
# git remote add origin <your-repo-url>
# git push -u origin main
```

### Future improvements
- Add JWT-based authentication
- Add request validation (e.g., zod/joi)
- Separate routes/controllers/services
