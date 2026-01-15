import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useGameStore } from '../store/gameStore';
import { ColorSort } from '../components/ColorSort';

export default function Game() {
  const navigate = useNavigate();
  const {
    isPlaying,
    currentScore,
    currentLevel,
    difficulty,
    startSession,
    submitScore,
    updateScore,
    updateLevel,
    resetGame,
  } = useGameStore();

  const [selectedDifficulty, setSelectedDifficulty] = useState('easy');
  const [showResult, setShowResult] = useState(false);
  const [result, setResult] = useState<any>(null);

  useEffect(() => {
    return () => {
      resetGame();
    };
  }, [resetGame]);

  const handleStartGame = async () => {
    try {
      await startSession(selectedDifficulty);
    } catch (error) {
      console.error('Failed to start game:', error);
    }
  };

  const onScore = (points: number) => {
    const newScore = currentScore + points;
    const level = Math.floor(newScore / 500) + 1;

    updateScore(newScore);
    if (level > currentLevel) {
      updateLevel(level);
    }
  };

  const handleEndGame = async () => {
    try {
      const res = await submitScore(currentScore, currentLevel);
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
          <h2>Select Difficulty</h2>
          <div className="difficulty-selector">
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
        <ColorSort 
          onScore={onScore} 
          onLevelComplete={() => {}} 
          difficulty={difficulty} 
        />
      </div>

      <button className="btn btn-danger" onClick={handleEndGame} style={{ marginTop: '20px' }}>
        End Game & Submit Score
      </button>
    </div>
  );
}
