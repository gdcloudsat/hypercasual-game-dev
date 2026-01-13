import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';

export default function AdminDashboard() {
  const navigate = useNavigate();
  const [stats, setStats] = useState<any>(null);
  const [users, setUsers] = useState<any[]>([]);
  const [activityFeed, setActivityFeed] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [statsRes, usersRes, activityRes] = await Promise.all([
        api.get('/admin/stats'),
        api.get('/admin/users?pageSize=20'),
        api.get('/admin/activity-feed?limit=20'),
      ]);

      setStats(statsRes.data);
      setUsers(usersRes.data.users);
      setActivityFeed(activityRes.data);
    } catch (error) {
      console.error('Failed to fetch admin data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleBanUser = async (userId: number) => {
    if (!confirm('Are you sure you want to ban this user?')) return;

    try {
      await api.post(`/admin/users/${userId}/ban`);
      alert('User banned successfully');
      fetchData();
    } catch (error) {
      console.error('Failed to ban user:', error);
      alert('Failed to ban user');
    }
  };

  const handleUnbanUser = async (userId: number) => {
    try {
      await api.post(`/admin/users/${userId}/unban`);
      alert('User unbanned successfully');
      fetchData();
    } catch (error) {
      console.error('Failed to unban user:', error);
      alert('Failed to unban user');
    }
  };

  if (loading) {
    return <div className="loading">Loading admin dashboard...</div>;
  }

  return (
    <div className="admin-container">
      <div className="admin-header">
        <h1>Admin Dashboard</h1>
        <button className="btn btn-secondary" onClick={() => navigate('/')}>
          Back to Home
        </button>
      </div>

      <div className="admin-stats-grid">
        <div className="admin-stat-card">
          <h3>Total Users</h3>
          <div className="stat-value">{stats?.totalUsers || 0}</div>
          <p className="stat-breakdown">
            Registered: {stats?.registeredUsers || 0} | Guests: {stats?.guestUsers || 0}
          </p>
        </div>

        <div className="admin-stat-card">
          <h3>Daily Active Users</h3>
          <div className="stat-value">{stats?.dailyActiveUsers || 0}</div>
        </div>

        <div className="admin-stat-card">
          <h3>Total Games</h3>
          <div className="stat-value">{stats?.totalGames || 0}</div>
        </div>

        <div className="admin-stat-card">
          <h3>Total Points</h3>
          <div className="stat-value">{stats?.totalPoints?.toLocaleString() || 0}</div>
        </div>
      </div>

      <div className="admin-section">
        <h2>Recent Users</h2>
        <div className="users-table">
          <div className="table-header">
            <div>Username</div>
            <div>Email</div>
            <div>Level</div>
            <div>Games</div>
            <div>Points</div>
            <div>Status</div>
            <div>Actions</div>
          </div>
          {users.map((user) => (
            <div key={user.id} className="table-row">
              <div>{user.username}</div>
              <div>{user.email || 'N/A'}</div>
              <div>{user.current_level || 1}</div>
              <div>{user.total_games}</div>
              <div>{user.total_points}</div>
              <div>
                {user.is_banned && <span className="badge danger">Banned</span>}
                {user.is_guest && <span className="badge">Guest</span>}
                {user.is_admin && <span className="badge admin">Admin</span>}
              </div>
              <div className="action-buttons">
                {user.is_banned ? (
                  <button
                    className="btn btn-sm btn-success"
                    onClick={() => handleUnbanUser(user.id)}
                  >
                    Unban
                  </button>
                ) : (
                  !user.is_admin && (
                    <button
                      className="btn btn-sm btn-danger"
                      onClick={() => handleBanUser(user.id)}
                    >
                      Ban
                    </button>
                  )
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="admin-section">
        <h2>Recent Activity</h2>
        <div className="activity-feed">
          {activityFeed.map((activity) => (
            <div key={activity.id} className="activity-item">
              <span className="activity-user">{activity.username}</span>
              <span className="activity-action">{activity.action}</span>
              <span className="activity-time">
                {new Date(activity.created_at).toLocaleString()}
              </span>
            </div>
          ))}
        </div>
      </div>

      {stats?.topPlayers && stats.topPlayers.length > 0 && (
        <div className="admin-section">
          <h2>Top Players</h2>
          <div className="top-players">
            {stats.topPlayers.map((player: any, index: number) => (
              <div key={index} className="top-player-item">
                <span className="player-rank">#{index + 1}</span>
                <span className="player-name">{player.username}</span>
                <span className="player-points">{player.totalPoints} pts</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
