import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import { websocketService } from '../services/websocket';

export default function Leaderboard() {
  const navigate = useNavigate();
  const [leaderboardType, setLeaderboardType] = useState<'global' | 'daily' | 'weekly'>('global');
  const [leaderboard, setLeaderboard] = useState<any[]>([]);
  const [myRank, setMyRank] = useState<number>(0);
  const [loading, setLoading] = useState(false);

  const fetchLeaderboard = async () => {
    setLoading(true);
    try {
      const response = await api.get(`/leaderboard/${leaderboardType}`);
      setLeaderboard(response.data);
    } catch (error) {
      console.error('Failed to fetch leaderboard:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchMyRank = async () => {
    try {
      const response = await api.get('/leaderboard/my-rank');
      setMyRank(response.data.rank);
    } catch (error) {
      console.error('Failed to fetch rank:', error);
    }
  };

  useEffect(() => {
    fetchLeaderboard();
    fetchMyRank();

    websocketService.subscribeToLeaderboard((data) => {
      setLeaderboard(data);
    });

    return () => {
      websocketService.unsubscribeFromLeaderboard();
    };
  }, [leaderboardType]);

  return (
    <div className="leaderboard-container">
      <div className="leaderboard-header">
        <h1>Leaderboard</h1>
        <button className="btn btn-secondary" onClick={() => navigate('/')}>
          Back
        </button>
      </div>

      <div className="my-rank">
        <h3>Your Global Rank: #{myRank || 'Unranked'}</h3>
      </div>

      <div className="leaderboard-tabs">
        {(['global', 'daily', 'weekly'] as const).map((type) => (
          <button
            key={type}
            className={`tab-btn ${leaderboardType === type ? 'active' : ''}`}
            onClick={() => setLeaderboardType(type)}
          >
            {type.charAt(0).toUpperCase() + type.slice(1)}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="loading">Loading leaderboard...</div>
      ) : (
        <div className="leaderboard-table">
          <div className="table-header">
            <div className="col-rank">Rank</div>
            <div className="col-username">Username</div>
            <div className="col-points">Points</div>
            <div className="col-level">Level</div>
          </div>
          {leaderboard.length > 0 ? (
            leaderboard.map((entry) => (
              <div key={entry.userId} className="table-row">
                <div className="col-rank">
                  {entry.rank <= 3 && (
                    <span className="medal">
                      {entry.rank === 1 && '🥇'}
                      {entry.rank === 2 && '🥈'}
                      {entry.rank === 3 && '🥉'}
                    </span>
                  )}
                  #{entry.rank}
                </div>
                <div className="col-username">{entry.username}</div>
                <div className="col-points">
                  {entry.totalPoints || entry.dailyPoints || entry.weeklyPoints || 0}
                </div>
                <div className="col-level">{entry.level}</div>
              </div>
            ))
          ) : (
            <div className="empty-state">No leaderboard data available</div>
          )}
        </div>
      )}
    </div>
  );
}
