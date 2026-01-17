import { useEffect, useRef, useState, useCallback } from 'react';

interface RollingBallProps {
  onScore: (points: number) => void;
  onLevelComplete: () => void;
  difficulty: string;
}

interface Ball {
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  color: string;
}

interface Platform {
  x: number;
  y: number;
  width: number;
  height: number;
  color: string;
  isMoving?: boolean;
  moveDirection?: number;
  moveSpeed?: number;
  moveRange?: [number, number];
}

interface Coin {
  x: number;
  y: number;
  radius: number;
  collected: boolean;
}

export function RollingBall({ onScore, onLevelComplete, difficulty }: RollingBallProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [ball, setBall] = useState<Ball>({
    x: 100,
    y: 300,
    vx: 0,
    vy: 0,
    radius: 20,
    color: '#FF6B6B',
  });
  const [platforms, setPlatforms] = useState<Platform[]>([]);
  const [coins, setCoins] = useState<Coin[]>([]);
  const [score, setScore] = useState(0);
  const [collectedCoins, setCollectedCoins] = useState(0);
  const [gameState, setGameState] = useState<'playing' | 'won' | 'lost'>('playing');
  const [keys, setKeys] = useState({ left: false, right: false, up: false });

  const gravity = 0.5;
  const friction = 0.98;
  const jumpForce = -15;

  const getLevelConfig = () => {
    switch (difficulty) {
      case 'easy':
        return { platformCount: 8, coinCount: 5, movingPlatforms: 0 };
      case 'medium':
        return { platformCount: 12, coinCount: 10, movingPlatforms: 2 };
      case 'hard':
        return { platformCount: 16, coinCount: 15, movingPlatforms: 4 };
      case 'expert':
        return { platformCount: 20, coinCount: 20, movingPlatforms: 6 };
      default:
        return { platformCount: 8, coinCount: 5, movingPlatforms: 0 };
    }
  };

  const generateLevel = useCallback(() => {
    const config = getLevelConfig();
    const canvas = canvasRef.current;
    if (!canvas) return;

    const newPlatforms: Platform[] = [];
    const newCoins: Coin[] = [];

    const platformColors = ['#4ECDC4', '#95E1D3', '#FFE66D', '#DDA0DD'];

    newPlatforms.push({
      x: 0,
      y: canvas.height - 40,
      width: 200,
      height: 20,
      color: platformColors[0],
    });

    let lastY = canvas.height - 40;
    let lastX = 200;

    for (let i = 1; i < config.platformCount; i++) {
      const width = 80 + Math.random() * 80;
      const x = Math.min(lastX + 50 + Math.random() * 100, canvas.width - width - 20);
      const y = Math.max(lastY - 80 - Math.random() * 60, 80);
      const color = platformColors[i % platformColors.length];

      newPlatforms.push({
        x,
        y,
        width,
        height: 20,
        color,
        isMoving: i > config.platformCount - config.movingPlatforms - 1,
        moveDirection: 1,
        moveSpeed: 2,
        moveRange: [x, Math.min(x + 100, canvas.width - width)],
      });

      lastX = x;
      lastY = y;
    }

    for (let i = 0; i < config.coinCount; i++) {
      const randomPlatform = newPlatforms[Math.floor(Math.random() * newPlatforms.length)];
      newCoins.push({
        x: randomPlatform.x + Math.random() * randomPlatform.width,
        y: randomPlatform.y - 20,
        radius: 10,
        collected: false,
      });
    }

    setPlatforms(newPlatforms);
    setCoins(newCoins);
    setCollectedCoins(0);
  }, [difficulty]);

  useEffect(() => {
    generateLevel();
  }, [generateLevel]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft' || e.key === 'a') {
        setKeys(prev => ({ ...prev, left: true }));
      }
      if (e.key === 'ArrowRight' || e.key === 'd') {
        setKeys(prev => ({ ...prev, right: true }));
      }
      if (e.key === 'ArrowUp' || e.key === 'w' || e.key === ' ') {
        e.preventDefault();
        setKeys(prev => ({ ...prev, up: true }));
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft' || e.key === 'a') {
        setKeys(prev => ({ ...prev, left: false }));
      }
      if (e.key === 'ArrowRight' || e.key === 'd') {
        setKeys(prev => ({ ...prev, right: false }));
      }
      if (e.key === 'ArrowUp' || e.key === 'w' || e.key === ' ') {
        setKeys(prev => ({ ...prev, up: false }));
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, []);

  const updateGame = useCallback(() => {
    if (gameState !== 'playing') return;

    setBall(prev => {
      const newBall = { ...prev };

      if (keys.left) {
        newBall.vx -= 0.8;
      }
      if (keys.right) {
        newBall.vx += 0.8;
      }
      if (keys.up) {
        const onPlatform = platforms.some(p => newBall.x >= p.x && newBall.x <= p.x + p.width && newBall.y + newBall.radius >= p.y && newBall.y + newBall.radius <= p.y + p.height + 5);
        if (onPlatform && newBall.vy >= 0) {
          newBall.vy = jumpForce;
        }
      }

      newBall.vy += gravity;
      newBall.vx *= friction;
      newBall.vy *= 0.99;

      newBall.x += newBall.vx;
      newBall.y += newBall.vy;

      const canvas = canvasRef.current;
      if (!canvas) return newBall;

      if (newBall.x < newBall.radius) {
        newBall.x = newBall.radius;
        newBall.vx *= -0.5;
      }
      if (newBall.x > canvas.width - newBall.radius) {
        newBall.x = canvas.width - newBall.radius;
        newBall.vx *= -0.5;
      }
      if (newBall.y > canvas.height) {
        setGameState('lost');
        return newBall;
      }

      platforms.forEach(platform => {
        if (newBall.x + newBall.radius > platform.x &&
            newBall.x - newBall.radius < platform.x + platform.width &&
            newBall.y + newBall.radius > platform.y &&
            newBall.y - newBall.radius < platform.y + platform.height &&
            newBall.vy > 0) {
          newBall.y = platform.y - newBall.radius;
          newBall.vy = 0;

          if (platform.isMoving && platform.moveRange && platform.moveSpeed) {
            newBall.x += platform.moveDirection * platform.moveSpeed;
          }
        }
      });

      setCoins(prevCoins => {
        let newCollected = collectedCoins;
        const updatedCoins = prevCoins.map(coin => {
          if (coin.collected) return coin;

          const dist = Math.hypot(newBall.x - coin.x, newBall.y - coin.y);
          if (dist < newBall.radius + coin.radius) {
            const points = 50;
            setScore(s => s + points);
            onScore(points);
            newCollected++;
            return { ...coin, collected: true };
          }
          return coin;
        });

        setCollectedCoins(newCollected);

        if (newCollected === prevCoins.filter(c => !c.collected).length) {
          setGameState('won');
          onLevelComplete();
        }

        return updatedCoins;
      });

      return newBall;
    });

    setPlatforms(prev => prev.map(platform => {
      if (!platform.isMoving || !platform.moveRange || !platform.moveSpeed) {
        return platform;
      }

      const newPlatform = { ...platform };
      newPlatform.x += newPlatform.moveDirection * newPlatform.moveSpeed;

      if (newPlatform.x <= platform.moveRange[0] || newPlatform.x + platform.width >= platform.moveRange[1]) {
        newPlatform.moveDirection *= -1;
      }

      return newPlatform;
    }));
  }, [keys, platforms, coins, collectedCoins, gameState, onScore, onLevelComplete]);

  useEffect(() => {
    let animationId: number;

    const gameLoop = () => {
      updateGame();
      draw();
      animationId = requestAnimationFrame(gameLoop);
    };

    gameLoop();

    return () => {
      cancelAnimationFrame(animationId);
    };
  }, [updateGame]);

  const draw = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    ctx.fillStyle = '#1a1a2e';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    platforms.forEach(platform => {
      ctx.fillStyle = platform.color;
      ctx.fillRect(platform.x, platform.y, platform.width, platform.height);

      ctx.fillStyle = 'rgba(255, 255, 255, 0.2)';
      ctx.fillRect(platform.x, platform.y, platform.width, 5);

      ctx.strokeStyle = 'rgba(0, 0, 0, 0.3)';
      ctx.lineWidth = 2;
      ctx.strokeRect(platform.x, platform.y, platform.width, platform.height);
    });

    coins.forEach(coin => {
      if (coin.collected) return;

      ctx.beginPath();
      ctx.arc(coin.x, coin.y, coin.radius, 0, Math.PI * 2);
      ctx.fillStyle = '#FFD700';
      ctx.fill();
      ctx.strokeStyle = '#FFA500';
      ctx.lineWidth = 2;
      ctx.stroke();

      ctx.beginPath();
      ctx.arc(coin.x - coin.radius * 0.3, coin.y - coin.radius * 0.3, coin.radius * 0.2, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
      ctx.fill();
    });

    ctx.beginPath();
    ctx.arc(ball.x, ball.y, ball.radius, 0, Math.PI * 2);
    const gradient = ctx.createRadialGradient(ball.x - ball.radius * 0.3, ball.y - ball.radius * 0.3, 0, ball.x, ball.y, ball.radius);
    gradient.addColorStop(0, '#FF8A8A');
    gradient.addColorStop(1, ball.color);
    ctx.fillStyle = gradient;
    ctx.fill();
    ctx.strokeStyle = 'rgba(0, 0, 0, 0.3)';
    ctx.lineWidth = 2;
    ctx.stroke();

    ctx.beginPath();
    ctx.arc(ball.x - ball.radius * 0.3, ball.y - ball.radius * 0.3, ball.radius * 0.2, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
    ctx.fill();

    if (gameState === 'won') {
      ctx.fillStyle = 'rgba(0, 255, 0, 0.8)';
      ctx.font = 'bold 48px Arial';
      ctx.textAlign = 'center';
      ctx.fillText('Level Complete!', canvas.width / 2, canvas.height / 2);
    } else if (gameState === 'lost') {
      ctx.fillStyle = 'rgba(255, 0, 0, 0.8)';
      ctx.font = 'bold 48px Arial';
      ctx.textAlign = 'center';
      ctx.fillText('Game Over!', canvas.width / 2, canvas.height / 2);
    }
  };

  const resetGame = () => {
    setBall({
      x: 100,
      y: 300,
      vx: 0,
      vy: 0,
      radius: 20,
      color: '#FF6B6B',
    });
    setGameState('playing');
    setScore(0);
    generateLevel();
  };

  return (
    <div className="rolling-ball-container">
      <div className="game-info">
        <div className="info-item">Score: {score}</div>
        <div className="info-item">Coins: {collectedCoins}/{coins.length}</div>
        {gameState !== 'playing' && (
          <button className="btn btn-primary" onClick={resetGame}>
            {gameState === 'won' ? 'Play Next Level' : 'Try Again'}
          </button>
        )}
      </div>
      <canvas ref={canvasRef} width={800} height={600} className="rolling-ball-canvas" />
      <div className="game-instructions">
        <p>Use Arrow Keys or WASD to move and jump!</p>
        <p>Collect all coins to complete the level!</p>
      </div>
    </div>
  );
}
