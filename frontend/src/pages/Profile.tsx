import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import api from '../services/api';

export default function Profile() {
  const navigate = useNavigate();
  const { user, logout } = useAuthStore();
  const [profile, setProfile] = useState<any>(null);
  const [stats, setStats] = useState<any>(null);
  const [streak, setStreak] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProfileData = async () => {
      try {
        const [profileRes, statsRes, streakRes] = await Promise.all([
          api.get('/users/profile'),
          api.get('/game/stats'),
          api.get('/rewards/streak'),
        ]);

        setProfile(profileRes.data);
        setStats(statsRes.data);
        setStreak(streakRes.data);
      } catch (error) {
        console.error('Failed to fetch profile data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchProfileData();
  }, []);

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const handleClaimDailyBonus = async () => {
    try {
      const response = await api.post('/rewards/daily-bonus');
      if (response.data.claimed) {
        alert(`Daily bonus claimed! +${response.data.coins} coins, +${response.data.xp} XP`);
        window.location.reload();
      } else {
        alert(response.data.message);
      }
    } catch (error) {
      console.error('Failed to claim daily bonus:', error);
    }
  };

  if (loading) {
    return <div className="loading">Loading profile...</div>;
  }

  return (
    <div className="profile-container">
      <div className="profile-header">
        <h1>Profile</h1>
        <div className="profile-actions">
          <button className="btn btn-secondary" onClick={() => navigate('/')}>
            Home
          </button>
          <button className="btn btn-danger" onClick={handleLogout}>
            Logout
          </button>
        </div>
      </div>

      <div className="profile-content">
        <div className="profile-card">
          <h2>{user?.username}</h2>
          {user?.email && <p className="email">{user.email}</p>}
          <div className="badges">
            {user?.isGuest && <span className="badge guest">Guest</span>}
            {user?.isAdmin && <span className="badge admin">Admin</span>}
          </div>
        </div>

        <div className="stats-grid">
          <div className="stat-card">
            <h3>Level</h3>
            <div className="stat-value">{stats?.level || 1}</div>
            <div className="progress-bar">
              <div
                className="progress-fill"
                style={{ width: `${stats?.xpProgress || 0}%` }}
              ></div>
            </div>
            <p className="stat-label">
              {stats?.totalXP || 0} / {stats?.xpForNextLevel || 1000} XP
            </p>
          </div>

          <div className="stat-card">
            <h3>Total Games</h3>
            <div className="stat-value">{stats?.totalGames || 0}</div>
          </div>

          <div className="stat-card">
            <h3>High Score</h3>
            <div className="stat-value">{stats?.highScore || 0}</div>
          </div>

          <div className="stat-card">
            <h3>Total Points</h3>
            <div className="stat-value">{stats?.totalPoints || 0}</div>
          </div>

          <div className="stat-card">
            <h3>Stars Earned</h3>
            <div className="stat-value">⭐ {stats?.stars || 0}</div>
          </div>

          <div className="stat-card">
            <h3>Current Streak</h3>
            <div className="stat-value">🔥 {streak?.current_streak || 0} days</div>
            <p className="stat-label">
              Longest: {streak?.longest_streak || 0} days
            </p>
          </div>
        </div>

        <div className="daily-bonus-section">
          <button className="btn btn-primary" onClick={handleClaimDailyBonus}>
            Claim Daily Bonus 🎁
          </button>
        </div>

        {stats?.achievements && stats.achievements.length > 0 && (
          <div className="achievements-section">
            <h3>Achievements ({stats.achievements.length})</h3>
            <div className="achievements-list">
              {stats.achievements.map((achievement: any, index: number) => (
                <div key={index} className="achievement-item">
                  <div className="achievement-icon">🏆</div>
                  <div className="achievement-info">
                    <h4>{achievement.name}</h4>
                    <p>{achievement.description}</p>
                    <span className="achievement-date">
                      {new Date(achievement.unlocked_at).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
