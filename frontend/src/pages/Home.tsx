import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';

export default function Home() {
  const navigate = useNavigate();
  const { isAuthenticated, user } = useAuthStore();

  return (
    <div className="home-container">
      <div className="home-content">
        <h1 className="game-title">Hyper-Casual Game Platform</h1>
        <p className="game-subtitle">Challenge yourself and climb the leaderboards!</p>

        {isAuthenticated ? (
          <div className="home-actions">
            <h2>Welcome back, {user?.username}!</h2>
            <button className="btn btn-primary" onClick={() => navigate('/game')}>
              Play Game
            </button>
            <button className="btn btn-secondary" onClick={() => navigate('/leaderboard')}>
              Leaderboard
            </button>
            <button className="btn btn-secondary" onClick={() => navigate('/profile')}>
              My Profile
            </button>
            {user?.isAdmin && (
              <button className="btn btn-admin" onClick={() => navigate('/admin')}>
                Admin Dashboard
              </button>
            )}
          </div>
        ) : (
          <div className="home-actions">
            <button className="btn btn-primary" onClick={() => navigate('/login')}>
              Login
            </button>
            <button className="btn btn-secondary" onClick={() => navigate('/register')}>
              Register
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
