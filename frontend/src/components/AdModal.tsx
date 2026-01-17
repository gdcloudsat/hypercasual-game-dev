import { useEffect, useState } from 'react';

interface AdModalProps {
  show: boolean;
  onClose: () => void;
  onWatchComplete: () => void;
  onSkip: () => void;
}

export function AdModal({ show, onClose, onWatchComplete, onSkip }: AdModalProps) {
  const [countdown, setCountdown] = useState(5);
  const [canSkip, setCanSkip] = useState(false);
  const [adRewards, setAdRewards] = useState({ xp: 50, coins: 25 });

  useEffect(() => {
    if (show) {
      setCountdown(5);
      setCanSkip(false);
    }
  }, [show]);

  useEffect(() => {
    if (!show || canSkip) return;

    const interval = setInterval(() => {
      setCountdown(prev => {
        if (prev <= 1) {
          setCanSkip(true);
          onWatchComplete();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [show, canSkip, onWatchComplete]);

  if (!show) return null;

  return (
    <div className="ad-overlay">
      <div className="ad-modal">
        <div className="ad-content">
          <div className="ad-placeholder">
            <div className="ad-spinner"></div>
            <h2>Advertisement</h2>
            <p>Watch this ad to earn rewards!</p>
            <div className="ad-rewards">
              <div className="reward-badge">
                <span className="reward-icon">⭐</span>
                <span className="reward-value">+{adRewards.xp} XP</span>
              </div>
              <div className="reward-badge">
                <span className="reward-icon">💰</span>
                <span className="reward-value">+{adRewards.coins} Coins</span>
              </div>
            </div>
            <div className="ad-timer">
              <div className="timer-circle">
                <span className="timer-text">{countdown}</span>
              </div>
            </div>
          </div>
          <div className="ad-actions">
            {canSkip ? (
              <button className="btn btn-success" onClick={onClose}>
                Claim Rewards!
              </button>
            ) : (
              <button className="btn btn-secondary" onClick={onSkip}>
                Skip (No Rewards)
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
