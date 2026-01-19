import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { useEffect, useState } from 'react';
import '../styles/Hero.css';

export default function Home() {
  const navigate = useNavigate();
  const { isAuthenticated, user } = useAuthStore();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <div className="home-container">
      <div className="hero-section">
        <div className={`hero-content ${mounted ? 'animate-in' : ''}`}>
          <div className="floating-emoji emoji-1">🎮</div>
          <div className="floating-emoji emoji-2">🏆</div>
          <div className="floating-emoji emoji-3">⭐</div>
          <div className="floating-emoji emoji-4">🎯</div>

          <h1 className="game-title animate-title">
            <span className="title-gradient">Hyper-Casual</span>
            <span className="title-sparkle">✨</span>
          </h1>
          <p className="game-subtitle animate-subtitle">
            Challenge yourself and climb the leaderboards!
          </p>

          <div className="game-showcase">
            <div className="showcase-card color-sort-card">
              <div className="card-icon">🎨</div>
              <h3>Color Sort</h3>
              <p>Sort colored water tubes to complete levels!</p>
              <div className="card-features">
                <span>🔢 50+ Levels</span>
                <span>🎯 Strategy</span>
              </div>
              <button 
                className="btn btn-primary btn-small" 
                onClick={() => navigate('/game', { state: { gameType: 'color_sort' } })}
              >
                Play Now
              </button>
            </div>

            <div className="showcase-card bubble-shooter-card">
              <div className="card-icon">🫧</div>
              <h3>Bubble Shooter</h3>
              <p>Match 3+ bubbles to pop them!</p>
              <div className="card-features">
                <span>💥 Explosive Action</span>
                <span>🎨 Color Matching</span>
              </div>
              <button 
                className="btn btn-primary btn-small" 
                onClick={() => navigate('/game', { state: { gameType: 'bubble_shooter' } })}
              >
                Play Now
              </button>
            </div>

            <div className="showcase-card rolling-ball-card">
              <div className="card-icon">🎱</div>
              <h3>Rolling Ball</h3>
              <p>Collect all the coins!</p>
              <div className="card-features">
                <span>⚡ Fast-paced</span>
                <span>🎮 Platformer</span>
              </div>
              <button 
                className="btn btn-primary btn-small" 
                onClick={() => navigate('/game', { state: { gameType: 'rolling_ball' } })}
              >
                Play Now
              </button>
            </div>
          </div>

          <div className="features-section">
            <div className="feature-item">
              <div className="feature-icon">🌍</div>
              <h4>Global Leaderboards</h4>
              <p>Compete with players worldwide</p>
            </div>
            <div className="feature-item">
              <div className="feature-icon">📈</div>
              <h4>Level Up System</h4>
              <p>Progress through 50 levels</p>
            </div>
            <div className="feature-item">
              <div className="feature-icon">🏅</div>
              <h4>Achievements</h4>
              <p>Unlock rewards and badges</p>
            </div>
            <div className="feature-item">
              <div className="feature-icon">🎁</div>
              <h4>Daily Rewards</h4>
              <p>Claim bonuses every day</p>
            </div>
          </div>

          {isAuthenticated ? (
            <div className="home-actions animate-actions">
              <div className="welcome-message">
                <h2>Welcome back, <span className="username-highlight">{user?.username}</span>!</h2>
              </div>
              <button className="btn btn-primary btn-large" onClick={() => navigate('/game')}>
                <span className="btn-icon">🎮</span>
                Play Now
              </button>
              <div className="action-buttons">
                <button className="btn btn-secondary" onClick={() => navigate('/leaderboard')}>
                  🏆 Leaderboard
                </button>
                <button className="btn btn-secondary" onClick={() => navigate('/profile')}>
                  👤 My Profile
                </button>
              </div>
              {user?.isAdmin && (
                <button className="btn btn-admin" onClick={() => navigate('/admin')}>
                  🛡️ Admin Dashboard
                </button>
              )}
            </div>
          ) : (
            <div className="home-actions animate-actions">
              <button className="btn btn-primary btn-large" onClick={() => navigate('/login')}>
                <span className="btn-icon">🚀</span>
                Get Started
              </button>
              <div className="auth-buttons">
                <button className="btn btn-secondary" onClick={() => navigate('/login')}>
                  Login
                </button>
                <button className="btn btn-secondary" onClick={() => navigate('/register')}>
                  Register
                </button>
              </div>
            </div>
          )}

          <div className="stats-section">
            <div className="stat-badge">
              <span className="stat-number">3</span>
              <span className="stat-label">Games</span>
            </div>
            <div className="stat-badge">
              <span className="stat-number">50</span>
              <span className="stat-label">Levels</span>
            </div>
            <div className="stat-badge">
              <span className="stat-number">∞</span>
              <span className="stat-label">Fun</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
