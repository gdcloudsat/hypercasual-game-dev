import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';

export default function AdminLogin() {
  const navigate = useNavigate();
  const { login, logout, user, isAuthenticated } = useAuthStore();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isAuthenticated && user?.isAdmin) {
      navigate('/admin');
    } else if (isAuthenticated && !user?.isAdmin) {
      setError('You do not have admin privileges. Please login with an admin account.');
    }
  }, [isAuthenticated, user, navigate]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await login(username, password);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    logout();
    setError('');
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        <h2>Admin Login</h2>
        {error && <div className="error-message">{error}</div>}
        
        {isAuthenticated && !user?.isAdmin ? (
          <div style={{ textAlign: 'center' }}>
            <p>Logged in as: <strong>{user?.username}</strong></p>
            <button className="btn btn-secondary" onClick={handleLogout}>
              Logout to switch account
            </button>
          </div>
        ) : (
          <form onSubmit={handleLogin}>
            <div className="form-group">
              <label>Admin Username</label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
                disabled={loading}
              />
            </div>

            <div className="form-group">
              <label>Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                disabled={loading}
              />
            </div>

            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? 'Logging in...' : 'Login to Dashboard'}
            </button>
          </form>
        )}

        <p className="auth-footer">
          <Link to="/">Back to Home</Link>
        </p>
      </div>
    </div>
  );
}
