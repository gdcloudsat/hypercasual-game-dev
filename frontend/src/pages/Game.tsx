import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useGameStore } from '../store/gameStore';
import { ColorSort } from '../components/ColorSort';
import { BubbleShooter } from '../components/BubbleShooter';
import { RollingBall } from '../components/RollingBall';
import { AdModal } from '../components/AdModal';
import { adsApi } from '../services/api';

export default function Game() {
  const navigate = useNavigate();
  const location = useLocation();
  const {
    isPlaying,
    currentScore,
    currentLevel,
    difficulty,
    gameType,
    startSession,
    submitScore,
    updateScore,
    updateLevel,
    resetGame,
  } = useGameStore();

  const [selectedDifficulty, setSelectedDifficulty] = useState('easy');
  const [selectedGameType, setSelectedGameType] = useState(location.state?.gameType || 'color_sort');
  const [showResult, setShowResult] = useState(false);
  const [showAd, setShowAd] = useState(false);
  const [result, setResult] = useState<any>(null);

  useEffect(() => {
    if (location.state?.gameType) {
      setSelectedGameType(location.state.gameType);
    }
  }, [location.state]);

  useEffect(() => {
    return () => {
      resetGame();
    };
  }, [resetGame]);

  const handleStartGame = async () => {
    try {
      await startSession(selectedDifficulty, selectedGameType);
    } catch (error) {
      console.error('Failed to start game:', error);
    }
  };

  const onScore = (points: number) => {
    updateScore(currentScore + points);
  };

  const onLevelComplete = async () => {
    updateLevel(currentLevel + 1);
    setShowAd(true);
  };

  const handleEndGame = async () => {
    try {
      const res = await submitScore(currentScore, currentLevel, gameType);
      setResult(res);
      setShowResult(true);
    } catch (error) {
      console.error('Failed to submit score:', error);
    }
  };

  const handlePlayAgain = () => {
    setShowResult(false);
    setResult(null);
    resetGame();
  };

  const handleWatchAd = async () => {
    try {
      await adsApi.watchAd();
    } catch (error) {
      console.error('Failed to record ad:', error);
    }
  };

  const handleSkipAd = async () => {
    try {
      await adsApi.skipAd();
      setShowAd(false);
    } catch (error) {
      console.error('Failed to skip ad:', error);
    }
  };

  const handleAdClose = () => {
    setShowAd(false);
    if (result) {
      setShowResult(true);
    }
  };

  if (showAd) {
    return (
      <div className="game-container">
        <AdModal
          show={showAd}
          onClose={handleAdClose}
          onWatchComplete={handleWatchAd}
          onSkip={handleSkipAd}
        />
      </div>
    );
  }

  if (showResult && result) {
    return (
      <div className="game-container">
        <div className="game-result">
          <h2>Game Over!</h2>
          <div className="result-stats">
            <div className="stat">
              <span className="stat-label">Final Score:</span>
              <span className="stat-value">{result.finalPoints}</span>
            </div>
            <div className="stat">
              <span className="stat-label">XP Earned:</span>
              <span className="stat-value">{result.earnedXP}</span>
            </div>
            <div className="stat">
              <span className="stat-label">Multiplier:</span>
              <span className="stat-value">{result.multiplier}x</span>
            </div>
            {result.levelProgress && (
              <>
                <div className="stat">
                  <span className="stat-label">Current Level:</span>
                  <span className="stat-value">{result.levelProgress.currentLevel}</span>
                </div>
                {result.levelProgress.levelsGained > 0 && (
                  <div className="level-up">
                    🎉 Level Up! +{result.levelProgress.levelsGained} levels!
                  </div>
                )}
              </>
            )}
          </div>
          <div className="result-actions">
            <button className="btn btn-primary" onClick={handlePlayAgain}>
              Play Again
            </button>
            <button className="btn btn-secondary" onClick={() => navigate('/leaderboard')}>
              View Leaderboard
            </button>
            <button className="btn btn-secondary" onClick={() => navigate('/')}>
              Home
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!isPlaying) {
    return (
      <div className="game-container">
        <div className="game-menu">
          <h2>Select Game & Difficulty</h2>

          <div className="game-selector">
            <h3>Choose Your Game</h3>
            <div className="game-cards">
              <div
                className={`game-card ${selectedGameType === 'color_sort' ? 'active' : ''}`}
                onClick={() => setSelectedGameType('color_sort')}
              >
                <div className="game-card-icon">🎨</div>
                <h4>Color Sort</h4>
                <p>Sort colored water tubes to complete levels!</p>
              </div>
              <div
                className={`game-card ${selectedGameType === 'bubble_shooter' ? 'active' : ''}`}
                onClick={() => setSelectedGameType('bubble_shooter')}
              >
                <div className="game-card-icon">🫧</div>
                <h4>Bubble Shooter</h4>
                <p>Shoot and match 3+ bubbles to pop them!</p>
              </div>
              <div
                className={`game-card ${selectedGameType === 'rolling_ball' ? 'active' : ''}`}
                onClick={() => setSelectedGameType('rolling_ball')}
              >
                <div className="game-card-icon">🎱</div>
                <h4>Rolling Ball</h4>
                <p>Navigate the ball and collect coins!</p>
              </div>
            </div>
          </div>

          <div className="difficulty-selector">
            <h3>Select Difficulty</h3>
            {['easy', 'medium', 'hard', 'expert'].map((diff) => (
              <button
                key={diff}
                className={`difficulty-btn ${selectedDifficulty === diff ? 'active' : ''}`}
                onClick={() => setSelectedDifficulty(diff)}
              >
                {diff.toUpperCase()}
                <span className="multiplier">
                  {diff === 'easy' && '1.0x'}
                  {diff === 'medium' && '1.5x'}
                  {diff === 'hard' && '2.0x'}
                  {diff === 'expert' && '3.0x'}
                </span>
              </button>
            ))}
          </div>
          <button className="btn btn-primary" onClick={handleStartGame}>
            Start Game
          </button>
          <button className="btn btn-secondary" onClick={() => navigate('/')}>
            Back
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="game-container">
      <div className="game-hud">
        <div className="hud-item">
          <span className="hud-label">Score:</span>
          <span className="hud-value">{currentScore}</span>
        </div>
        <div className="hud-item">
          <span className="hud-label">Level:</span>
          <span className="hud-value">{currentLevel}</span>
        </div>
        <div className="hud-item">
          <span className="hud-label">Difficulty:</span>
          <span className="hud-value">{difficulty}</span>
        </div>
      </div>

      <div className="game-area">
        {gameType === 'bubble_shooter' && (
          <BubbleShooter onScore={onScore} onLevelComplete={onLevelComplete} difficulty={difficulty} level={currentLevel} />
        )}
        {gameType === 'rolling_ball' && (
          <RollingBall onScore={onScore} onLevelComplete={onLevelComplete} difficulty={difficulty} level={currentLevel} />
        )}
        {gameType === 'color_sort' && (
          <ColorSort onScore={onScore} onLevelComplete={onLevelComplete} difficulty={difficulty} level={currentLevel} />
        )}
      </div>

      <button className="btn btn-danger" onClick={handleEndGame} style={{ marginTop: '20px' }}>
        End Game & Submit Score
      </button>
    </div>
  );
}
