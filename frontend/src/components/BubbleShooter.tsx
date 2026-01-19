import { useEffect, useRef, useState } from 'react';

interface BubbleShooterProps {
  onScore: (points: number) => void;
  onLevelComplete: () => void;
  difficulty: string;
  level: number;
}

interface Bubble {
  x: number;
  y: number;
  color: string;
  radius: number;
  row: number;
  col: number;
}

export function BubbleShooter({ onScore, onLevelComplete, difficulty, level }: BubbleShooterProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [score, setScore] = useState(0);
  const [bubbles, setBubbles] = useState<Bubble[]>([]);
  const [currentBubble, setCurrentBubble] = useState<Bubble | null>(null);
  const [angle, setAngle] = useState(-Math.PI / 2);
  const [isShooting, setIsShooting] = useState(false);

  const colors = ['#FF6B6B', '#4ECDC4', '#FFE66D', '#95E1D3', '#F38181'];
  const bubbleRadius = 20;

  const getRowCount = () => {
    const baseRows = difficulty === 'easy' ? 4 : difficulty === 'medium' ? 6 : difficulty === 'hard' ? 8 : 10;
    const levelBonus = Math.floor((level - 1) / 2);
    return Math.min(15, baseRows + levelBonus);
  };

  const getColCount = () => {
    return Math.floor((canvasRef.current?.width || 800) / (bubbleRadius * 2));
  };

  const initializeBubbles = () => {
    const newBubbles: Bubble[] = [];
    const rows = getRowCount();
    const cols = getColCount();

    for (let row = 0; row < rows; row++) {
      for (let col = 0; col < cols; col++) {
        const offsetX = row % 2 === 0 ? 0 : bubbleRadius;
        const x = col * bubbleRadius * 2 + bubbleRadius + offsetX;
        const y = row * bubbleRadius * 1.8 + bubbleRadius;

        if (x < (canvasRef.current?.width || 800) - bubbleRadius) {
          newBubbles.push({
            x,
            y,
            color: colors[Math.floor(Math.random() * colors.length)],
            radius: bubbleRadius,
            row,
            col,
          });
        }
      }
    }
    setBubbles(newBubbles);
  };

  const createNewBubble = () => {
    const x = (canvasRef.current?.width || 800) / 2;
    const y = (canvasRef.current?.height || 600) - bubbleRadius * 2;
    setCurrentBubble({
      x,
      y,
      color: colors[Math.floor(Math.random() * colors.length)],
      radius: bubbleRadius,
      row: -1,
      col: -1,
    });
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas || isShooting) return;

    const rect = canvas.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    const shooterX = canvas.width / 2;
    const shooterY = canvas.height - bubbleRadius * 2;

    const newAngle = Math.atan2(mouseY - shooterY, mouseX - shooterX);
    setAngle(newAngle);
  };

  const handleClick = () => {
    if (!currentBubble || isShooting) return;
    setIsShooting(true);
  };

  const shootBubble = () => {
    if (!currentBubble) return;

    const speed = 15;
    const dx = Math.cos(angle) * speed;
    const dy = Math.sin(angle) * speed;

    let newBubble = { ...currentBubble };
    let collided = false;

    const animate = () => {
      newBubble.x += dx;
      newBubble.y += dy;

      const canvas = canvasRef.current;
      if (!canvas) return;

      if (newBubble.x <= bubbleRadius || newBubble.x >= canvas.width - bubbleRadius) {
        newBubble.x = Math.max(bubbleRadius, Math.min(canvas.width - bubbleRadius, newBubble.x));
      }

      if (newBubble.y <= bubbleRadius) {
        collided = true;
      }

      for (const bubble of bubbles) {
        const dist = Math.hypot(newBubble.x - bubble.x, newBubble.y - bubble.y);
        if (dist < bubbleRadius * 2) {
          collided = true;
          break;
        }
      }

      if (collided) {
        const row = Math.floor(newBubble.y / (bubbleRadius * 1.8));
        const col = Math.floor((newBubble.x - (row % 2 === 0 ? 0 : bubbleRadius)) / (bubbleRadius * 2));

        newBubble.row = row;
        newBubble.col = col;

        const matchedBubbles = findMatches(newBubble, bubbles);
        if (matchedBubbles.length >= 3) {
          const points = matchedBubbles.length * 10;
          setScore(s => s + points);
          onScore(points);
          setBubbles(prev => prev.filter(b => !matchedBubbles.includes(b)));
        } else {
          setBubbles(prev => [...prev, newBubble]);
        }

        setIsShooting(false);
        setCurrentBubble(null);
        setTimeout(createNewBubble, 300);

        if (bubbles.filter(b => !matchedBubbles.includes(b)).length === 0) {
          onLevelComplete();
        }
      } else {
        setCurrentBubble({ ...newBubble });
        requestAnimationFrame(animate);
      }
    };

    animate();
  };

  const findMatches = (bubble: Bubble, allBubbles: Bubble[]): Bubble[] => {
    const matches: Bubble[] = [bubble];
    const visited = new Set<Bubble>();
    const queue: Bubble[] = [bubble];

    while (queue.length > 0) {
      const current = queue.shift()!;
      if (visited.has(current)) continue;
      visited.add(current);

      const neighbors = getNeighbors(current, allBubbles);
      for (const neighbor of neighbors) {
        if (neighbor.color === bubble.color && !visited.has(neighbor) && !matches.includes(neighbor)) {
          matches.push(neighbor);
          queue.push(neighbor);
        }
      }
    }

    return matches;
  };

  const getNeighbors = (bubble: Bubble, allBubbles: Bubble[]): Bubble[] => {
    return allBubbles.filter(b => {
      const dist = Math.hypot(bubble.x - b.x, bubble.y - b.y);
      return dist <= bubbleRadius * 2.5 && dist > bubbleRadius * 0.5;
    });
  };

  const draw = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    bubbles.forEach(bubble => {
      ctx.beginPath();
      ctx.arc(bubble.x, bubble.y, bubble.radius, 0, Math.PI * 2);
      ctx.fillStyle = bubble.color;
      ctx.fill();
      ctx.strokeStyle = 'rgba(0, 0, 0, 0.3)';
      ctx.lineWidth = 2;
      ctx.stroke();

      ctx.beginPath();
      ctx.arc(bubble.x - bubble.radius * 0.3, bubble.y - bubble.radius * 0.3, bubble.radius * 0.2, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
      ctx.fill();
    });

    if (currentBubble) {
      ctx.beginPath();
      ctx.arc(currentBubble.x, currentBubble.y, currentBubble.radius, 0, Math.PI * 2);
      ctx.fillStyle = currentBubble.color;
      ctx.fill();
      ctx.strokeStyle = 'rgba(0, 0, 0, 0.3)';
      ctx.lineWidth = 2;
      ctx.stroke();

      ctx.beginPath();
      ctx.arc(currentBubble.x - currentBubble.radius * 0.3, currentBubble.y - currentBubble.radius * 0.3, currentBubble.radius * 0.2, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
      ctx.fill();
    }

    if (!isShooting && currentBubble) {
      ctx.beginPath();
      ctx.moveTo(canvas.width / 2, canvas.height - bubbleRadius * 2);
      const endX = canvas.width / 2 + Math.cos(angle) * 100;
      const endY = canvas.height - bubbleRadius * 2 + Math.sin(angle) * 100;
      ctx.lineTo(endX, endY);
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.5)';
      ctx.lineWidth = 2;
      ctx.setLineDash([5, 5]);
      ctx.stroke();
      ctx.setLineDash([]);
    }
  };

  useEffect(() => {
    initializeBubbles();
    createNewBubble();
  }, [difficulty]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationId: number;

    const animate = () => {
      draw();
      animationId = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      cancelAnimationFrame(animationId);
    };
  }, [bubbles, currentBubble, angle, isShooting]);

  useEffect(() => {
    if (isShooting) {
      shootBubble();
    }
  }, [isShooting]);

  return (
    <div className="bubble-shooter-container">
      <div className="game-info">
        <div className="info-item">Score: {score}</div>
        <div className="info-item">Bubbles: {bubbles.length}</div>
      </div>
      <canvas
        ref={canvasRef}
        width={800}
        height={600}
        onMouseMove={handleMouseMove}
        onClick={handleClick}
        className="bubble-shooter-canvas"
      />
      <div className="game-instructions">
        <p>Move mouse to aim, click to shoot bubbles!</p>
        <p>Match 3+ bubbles of the same color to pop them!</p>
      </div>
    </div>
  );
}
