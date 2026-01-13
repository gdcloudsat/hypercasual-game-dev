# Quick Start Guide

Get up and running with the Hyper-Casual Game Platform in minutes!

## 🚀 Fastest Way to Start

### Option 1: Docker (Recommended)

1. **Install Docker and Docker Compose**
   - Download from https://www.docker.com/get-started

2. **Clone and Start**
```bash
git clone <repository-url>
cd hypercasual-game-dev
./start.sh
```

That's it! The application will be available at http://localhost:5173

### Option 2: Manual Setup

#### Prerequisites
- Node.js 18+
- MySQL 8.0+
- Redis

#### Backend Setup
```bash
cd backend
npm install
cp .env.example .env
# Edit .env with your database credentials
npm run start:dev
```

#### Frontend Setup
```bash
cd frontend
npm install
npm run dev
```

## 🎮 First Steps

1. **Access the app**: Open http://localhost:5173
2. **Create account**: Click "Register" or "Play as Guest"
3. **Start playing**: Click "Play Game"
4. **View leaderboard**: Check rankings after your game
5. **Explore profile**: See your stats and achievements

## 🔑 Admin Access

To access the admin panel, you need to manually set a user as admin in the database:

```sql
UPDATE users SET is_admin = TRUE WHERE username = 'yourusername';
```

Then navigate to `/admin` in the application.

## 📚 Next Steps

- Read the full [README.md](README.md) for detailed documentation
- Explore the API endpoints
- Check out the database schema in `backend/src/database/schema.sql`
- Customize the game mechanics in `backend/src/game/game.service.ts`

## 🆘 Troubleshooting

### Backend won't start
- Check if MySQL and Redis are running
- Verify database credentials in `.env`
- Ensure port 3000 is not in use

### Frontend won't start
- Check if backend is running
- Verify `VITE_API_URL` in `.env`
- Ensure port 5173 is not in use

### Database connection errors
- Check MySQL is running: `mysql -u root -p`
- Verify credentials match `.env` file
- Run schema: `mysql -u root -p < backend/src/database/schema.sql`

### Redis connection errors
- Check Redis is running: `redis-cli ping`
- Should respond with `PONG`

## 🎯 Development Tips

- Backend auto-reloads on file changes with `npm run start:dev`
- Frontend uses Vite's hot module replacement
- Check browser console for frontend errors
- Check terminal output for backend errors
- Use `docker-compose logs -f` to view Docker logs

## 📞 Need Help?

- Check the [README.md](README.md) for detailed documentation
- Open an issue on GitHub
- Review the code comments for implementation details

Happy gaming! 🎮
