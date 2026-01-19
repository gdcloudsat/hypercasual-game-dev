import React, { useState, useEffect, useCallback } from 'react';
import '../styles/ColorSort.css';

interface ColorSortProps {
  onScore: (points: number) => void;
  onLevelComplete: () => void;
  difficulty: string;
  level: number;
}

const COLORS = [
  '#FF5252', // Red
  '#2196F3', // Blue
  '#4CAF50', // Green
  '#FFEB3B', // Yellow
  '#FF9800', // Orange
  '#9C27B0', // Purple
  '#E91E63', // Pink
  '#00BCD4', // Cyan
];

const TUBE_CAPACITY = 4;

export const ColorSort: React.FC<ColorSortProps> = ({ onScore, onLevelComplete, difficulty, level }) => {
  const [tubes, setTubes] = useState<string[][]>([]);
  const [selectedTubeIndex, setSelectedTubeIndex] = useState<number | null>(null);
  const [moves, setMoves] = useState(0);

  const initGame = useCallback(() => {
    let colorCount = 3;
    if (difficulty === 'medium') colorCount = 4;
    if (difficulty === 'hard') colorCount = 6;
    if (difficulty === 'expert') colorCount = 8;

    // Adjust based on level
    const levelBonus = Math.floor((level - 1) / 5);
    colorCount = Math.min(COLORS.length, colorCount + levelBonus);

    const gameColors = COLORS.slice(0, colorCount);
    const allBalls: string[] = [];
    gameColors.forEach(color => {
      for (let i = 0; i < TUBE_CAPACITY; i++) {
        allBalls.push(color);
      }
    });

    // Shuffle balls
    for (let i = allBalls.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [allBalls[i], allBalls[j]] = [allBalls[j], allBalls[i]];
    }

    const newTubes: string[][] = [];
    for (let i = 0; i < colorCount; i++) {
      newTubes.push(allBalls.slice(i * TUBE_CAPACITY, (i + 1) * TUBE_CAPACITY));
    }
    // Add 2 empty tubes
    newTubes.push([]);
    newTubes.push([]);

    setTubes(newTubes);
    setSelectedTubeIndex(null);
    setMoves(0);
  }, [difficulty]);

  useEffect(() => {
    initGame();
  }, [initGame]);

  const handleTubeClick = (index: number) => {
    if (selectedTubeIndex === null) {
      if (tubes[index].length > 0) {
        setSelectedTubeIndex(index);
      }
    } else {
      if (selectedTubeIndex === index) {
        setSelectedTubeIndex(null);
        return;
      }

      const sourceTube = tubes[selectedTubeIndex];
      const targetTube = tubes[index];
      const ballToMove = sourceTube[sourceTube.length - 1];

      const canMove = 
        targetTube.length < TUBE_CAPACITY && 
        (targetTube.length === 0 || targetTube[targetTube.length - 1] === ballToMove);

      if (canMove) {
        const newTubes = [...tubes];
        newTubes[selectedTubeIndex] = sourceTube.slice(0, -1);
        newTubes[index] = [...targetTube, ballToMove];
        
        // Move any additional balls of the same color that are on top and match
        while (
          newTubes[selectedTubeIndex].length > 0 && 
          newTubes[index].length < TUBE_CAPACITY &&
          newTubes[selectedTubeIndex][newTubes[selectedTubeIndex].length - 1] === ballToMove
        ) {
          const nextBall = newTubes[selectedTubeIndex].pop()!;
          newTubes[index].push(nextBall);
        }

        setTubes(newTubes);
        setSelectedTubeIndex(null);
        setMoves(m => m + 1);
        onScore(50);

        if (checkWin(newTubes)) {
          onScore(500);
          onLevelComplete();
          setTimeout(() => {
             initGame();
          }, 1500);
        }
      } else {
        setSelectedTubeIndex(index);
      }
    }
  };

  const checkWin = (currentTubes: string[][]) => {
    return currentTubes.every(tube => 
      tube.length === 0 || (tube.length === TUBE_CAPACITY && tube.every(ball => ball === tube[0]))
    );
  };

  return (
    <div className="color-sort-game">
      <div className="game-info">
        <span>Moves: {moves}</span>
        <button className="btn-small" onClick={initGame}>Reset Level</button>
      </div>
      <div className="tubes-container">
        {tubes.map((tube, index) => (
          <div 
            key={index} 
            className={`tube ${selectedTubeIndex === index ? 'selected' : ''}`}
            onClick={() => handleTubeClick(index)}
          >
            <div className="balls">
              {[...Array(TUBE_CAPACITY)].map((_, i) => {
                const ballColor = tube[TUBE_CAPACITY - 1 - i];
                return (
                  <div 
                    key={i} 
                    className="ball-slot"
                  >
                    {ballColor && (
                      <div 
                        className="ball" 
                        style={{ backgroundColor: ballColor }}
                      />
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>
      {checkWin(tubes) && (
        <div className="win-message">
          <h3>Level Complete!</h3>
        </div>
      )}
    </div>
  );
};
