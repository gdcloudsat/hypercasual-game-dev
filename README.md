# Hyper-Casual Real-Time Game Platform

A complete full-stack hyper-casual game platform with real-time features, leaderboards, rewards system, and admin panel. Built with Node.js, NestJS, React, MySQL, and Redis.

## 🚀 Features

### Core Features
- ✅ **User Authentication**: JWT-based auth with guest and registered user support
- ✅ **Real-time Game Sessions**: WebSocket-powered live updates
- ✅ **Points & Levels System**: Progressive difficulty with XP and level progression (1-50)
- ✅ **Reward System**: Coins, XP, achievements, daily bonuses, and streak tracking
- ✅ **Leaderboards**: Global, daily, and weekly rankings with Redis caching
- ✅ **Admin Panel**: Complete user management, analytics, and moderation tools
- ✅ **Activity Tracking**: Comprehensive user activity logs

### Technical Features
- ✅ **Vertical Scaling**: MySQL connection pooling and Redis caching
- ✅ **Rate Limiting**: Throttle protection against abuse
- ✅ **Anti-Cheat**: Score validation and session timing checks
- ✅ **Real-time Updates**: WebSocket gateway for live notifications
- ✅ **Docker Support**: Containerized services for easy deployment

## 📋 Tech Stack

### Backend
- **Framework**: NestJS (Node.js + TypeScript)
- **Database**: MySQL 8.0+ with connection pooling
- **Cache**: Redis for leaderboards and sessions
- **Authentication**: JWT with refresh tokens
- **Real-time**: Socket.IO WebSockets
- **Validation**: class-validator

### Frontend
- **Framework**: React 18 with TypeScript
- **Build Tool**: Vite
- **State Management**: Zustand
- **HTTP Client**: Axios
- **Real-time**: Socket.IO Client
- **Routing**: React Router v6

### Infrastructure
- **Containerization**: Docker & Docker Compose
- **Web Server**: Nginx (for frontend)
- **Connection Pooling**: mysql2/promise

## 🛠 Installation

### Prerequisites
- Node.js 18+ and npm
- Docker and Docker Compose
- MySQL 8.0+ (if running locally)
- Redis (if running locally)

### Quick Start with Docker

1. **Clone the repository**
```bash
git clone <repository-url>
cd hypercasual-game-dev
```

2. **Start services with Docker Compose**
```bash
docker-compose up -d
```

This will start:
- MySQL on port 3306
- Redis on port 6379
- Backend API on port 3000
- WebSocket server on port 3001
- Frontend on port 5173

3. **Access the application**
- Frontend: http://localhost:5173
- Backend API: http://localhost:3000
- WebSocket: http://localhost:3001

### Manual Setup

#### Backend Setup

1. **Navigate to backend directory**
```bash
cd backend
```

2. **Install dependencies**
```bash
npm install
```

3. **Configure environment**
```bash
cp .env.example .env
# Edit .env with your database credentials
```

4. **Initialize database**
```bash
# Connect to MySQL and run:
mysql -u root -p < src/database/schema.sql
```

5. **Start development server**
```bash
npm run start:dev
```

Backend will run on:
- API: http://localhost:3000
- WebSocket: Integrated with API server

#### Frontend Setup

1. **Navigate to frontend directory**
```bash
cd frontend
```

2. **Install dependencies**
```bash
npm install
```

3. **Create environment file**
```bash
# Create .env file
VITE_API_URL=http://localhost:3000
VITE_WS_URL=http://localhost:3000
```

4. **Start development server**
```bash
npm run dev
```

Frontend will run on http://localhost:5173

## 📚 API Documentation

### Authentication Endpoints

#### Register
```http
POST /auth/register
Content-Type: application/json

{
  "username": "player123",
  "email": "player@example.com",
  "password": "password123"
}
```

#### Login
```http
POST /auth/login
Content-Type: application/json

{
  "username": "player123",
  "password": "password123"
}
```

#### Guest Login
```http
POST /auth/guest-login
Content-Type: application/json

{
  "deviceId": "optional-device-id"
}
```

### Game Endpoints

#### Start Session
```http
POST /game/start-session
Authorization: Bearer <token>
Content-Type: application/json

{
  "difficulty": "easy|medium|hard|expert"
}
```

#### Submit Score
```http
POST /game/submit-score
Authorization: Bearer <token>
Content-Type: application/json

{
  "points": 1500,
  "level": 5,
  "difficulty": "medium",
  "sessionToken": "<session-token>"
}
```

#### Get User Stats
```http
GET /game/stats
Authorization: Bearer <token>
```

### Leaderboard Endpoints

#### Global Leaderboard
```http
GET /leaderboard/global?page=1&pageSize=20
Authorization: Bearer <token>
```

#### Daily Leaderboard
```http
GET /leaderboard/daily?page=1&pageSize=20
Authorization: Bearer <token>
```

#### User Rank
```http
GET /leaderboard/my-rank
Authorization: Bearer <token>
```

### Rewards Endpoints

#### Claim Daily Bonus
```http
POST /rewards/daily-bonus
Authorization: Bearer <token>
```

#### Get Streak
```http
GET /rewards/streak
Authorization: Bearer <token>
```

### Admin Endpoints

#### Get System Stats
```http
GET /admin/stats
Authorization: Bearer <admin-token>
```

#### Get All Users
```http
GET /admin/users?page=1&pageSize=50
Authorization: Bearer <admin-token>
```

#### Ban User
```http
POST /admin/users/:id/ban
Authorization: Bearer <admin-token>
Content-Type: application/json

{
  "reason": "Cheating detected"
}
```

## 🎮 Game Mechanics

### Difficulty Multipliers
- **Easy**: 1.0x points
- **Medium**: 1.5x points
- **Hard**: 2.0x points
- **Expert**: 3.0x points

### Level Progression
- Levels 1-50 available
- XP required increases exponentially: `1000 * 1.5^(level - 1)`
- Each level up awards 3 stars

### Anti-Cheat
- Minimum session duration: 1 second
- Maximum score validation based on level
- Session token verification
- Timestamp validation

### Achievements
- First Victory
- Score Master (1000+ points)
- Level milestones (10, 25, 50)
- Dedication (7-day streak)
- Champion (Top 10 leaderboard)
- Marathon (100 games played)

## 🔧 Configuration

### Environment Variables

#### Backend (.env)
```env
PORT=3000
WS_PORT=3001
DB_HOST=localhost
DB_PORT=3306
DB_USERNAME=gameuser
DB_PASSWORD=gamepassword
DB_DATABASE=hypercasual_game
DB_CONNECTION_LIMIT=10
REDIS_HOST=localhost
REDIS_PORT=6379
JWT_SECRET=your-secret-key
JWT_EXPIRES_IN=7d
JWT_REFRESH_SECRET=your-refresh-secret
JWT_REFRESH_EXPIRES_IN=30d
CORS_ORIGIN=http://localhost:5173
```

#### Frontend (.env)
```env
VITE_API_URL=http://localhost:3000
VITE_WS_URL=http://localhost:3000
```

## 🏗 Architecture

### Database Schema
- **users**: User accounts and authentication
- **user_levels**: Level progression and XP
- **game_sessions**: Active game sessions
- **game_scores**: Historical scores
- **rewards**: User rewards and bonuses
- **achievements**: Achievement definitions
- **user_achievements**: Unlocked achievements
- **leaderboards**: Persisted leaderboard snapshots
- **user_streaks**: Daily activity streaks
- **user_activity_logs**: Activity tracking

### Redis Caching Strategy
- Leaderboard data: 5-minute TTL
- Session data: Stored with user context
- Real-time updates: Pub/sub pattern

### Connection Pooling
- MySQL pool size: Configurable (default: 10)
- Automatic connection management
- Queue limit: Unlimited
- Keep-alive enabled

## 🔐 Security

- JWT authentication with refresh tokens
- Password hashing with bcrypt
- Rate limiting on API endpoints
- Input validation with class-validator
- CORS configuration
- SQL injection prevention (parameterized queries)
- XSS protection

## 📊 Performance Optimization

1. **Database Indexing**
   - User lookups indexed
   - Score queries optimized
   - Leaderboard calculations cached

2. **Redis Caching**
   - Leaderboards cached for fast retrieval
   - Session management
   - Real-time data distribution

3. **Connection Pooling**
   - Reusable database connections
   - Reduced connection overhead
   - Automatic scaling

4. **WebSocket Optimization**
   - Room-based subscriptions
   - Heartbeat mechanism
   - Automatic reconnection

## 🚀 Deployment

### Docker Production Deployment

1. **Build images**
```bash
docker-compose build
```

2. **Start services**
```bash
docker-compose up -d
```

3. **View logs**
```bash
docker-compose logs -f
```

4. **Stop services**
```bash
docker-compose down
```

### Manual Production Deployment

1. **Build backend**
```bash
cd backend
npm install --production
npm run build
npm run start:prod
```

2. **Build frontend**
```bash
cd frontend
npm install
npm run build
# Serve dist/ with your web server
```

## 📈 Scaling Strategy

### Vertical Scaling
- Increase connection pool size
- Add more Redis memory
- Optimize database queries
- Increase server resources

### Horizontal Scaling (Future)
- Load balancer for multiple backend instances
- Redis cluster for distributed caching
- Session storage in Redis for stateless servers
- Separate WebSocket servers with Redis adapter

## 🧪 Testing

### Backend Tests
```bash
cd backend
npm test
```

### Frontend Tests
```bash
cd frontend
npm test
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Open a Pull Request

## 📝 License

MIT License - feel free to use this project for learning or commercial purposes.

## 🎯 Roadmap

- [ ] Add more game modes
- [ ] Implement friend system
- [ ] Add in-game chat
- [ ] Mobile app (React Native)
- [ ] Advanced analytics dashboard
- [ ] Payment integration for premium features
- [ ] Tournament system
- [ ] Seasonal events

## 📧 Support

For issues, questions, or contributions, please open an issue on GitHub.

---

**Built with ❤️ using NestJS, React, MySQL, and Redis**
