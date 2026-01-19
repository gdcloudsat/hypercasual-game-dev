import { Injectable, BadRequestException } from '@nestjs/common';
import { v4 as uuidv4 } from 'uuid';
import { getDatabasePool } from '../database/database.config';
import { SubmitScoreDto, Difficulty, GameType } from './dto/game.dto';
import { RowDataPacket, ResultSetHeader } from 'mysql2';

@Injectable()
export class GameService {
  private readonly DIFFICULTY_MULTIPLIERS = {
    easy: 1.0,
    medium: 1.5,
    hard: 2.0,
    expert: 3.0,
  };

  private readonly XP_PER_POINT = 2;
  private readonly LEVEL_XP_BASE = 1000;
  private readonly MAX_LEVEL = 50;

  async startSession(userId: number, difficulty: Difficulty, gameType: GameType = GameType.COLOR_SORT) {
    const pool = getDatabasePool();
    const sessionToken = uuidv4();

    await pool.query(
      'UPDATE game_sessions SET is_active = FALSE WHERE user_id = ? AND is_active = TRUE',
      [userId]
    );

    const [result] = await pool.query<ResultSetHeader>(
      'INSERT INTO game_sessions (user_id, session_token, game_type, is_active) VALUES (?, ?, ?, TRUE)',
      [userId, sessionToken, gameType]
    );

    await pool.query(
      'INSERT INTO user_activity_logs (user_id, action, metadata) VALUES (?, ?, ?)',
      [userId, 'game_start', JSON.stringify({ difficulty, gameType, sessionId: result.insertId })]
    );

    const [gameLevel] = await pool.query<RowDataPacket[]>(
      'SELECT current_level FROM user_game_levels WHERE user_id = ? AND game_type = ?',
      [userId, gameType]
    );

    return {
      sessionId: result.insertId,
      sessionToken,
      difficulty,
      gameType,
      multiplier: this.DIFFICULTY_MULTIPLIERS[difficulty],
      startLevel: gameLevel[0]?.current_level || 1,
    };
  }

  async submitScore(userId: number, submitScoreDto: SubmitScoreDto) {
    const pool = getDatabasePool();
    const { points, level, difficulty, sessionToken, gameType = GameType.COLOR_SORT } = submitScoreDto;

    const [sessions] = await pool.query<RowDataPacket[]>(
      'SELECT id, started_at, game_type FROM game_sessions WHERE session_token = ? AND user_id = ? AND is_active = TRUE',
      [sessionToken, userId]
    );

    if (sessions.length === 0) {
      throw new BadRequestException('Invalid or expired session');
    }

    const session = sessions[0];
    const sessionDuration = Date.now() - new Date(session.started_at).getTime();

    if (sessionDuration < 1000) {
      throw new BadRequestException('Session too short - possible cheating detected');
    }

    const multiplier = this.DIFFICULTY_MULTIPLIERS[difficulty];
    const finalPoints = Math.floor(points * multiplier);
    const earnedXP = Math.floor(finalPoints * this.XP_PER_POINT);

    await pool.query<ResultSetHeader>(
      'INSERT INTO game_scores (user_id, points, level, difficulty, game_type, session_id) VALUES (?, ?, ?, ?, ?, ?)',
      [userId, finalPoints, level, difficulty, gameType, session.id]
    );

    await pool.query(
      'UPDATE game_sessions SET ended_at = CURRENT_TIMESTAMP, is_active = FALSE WHERE id = ?',
      [session.id]
    );

    const levelProgress = await this.updateUserLevel(userId, earnedXP, gameType);

    await this.checkAndUnlockAchievements(userId, finalPoints, level);

    await pool.query(
      'INSERT INTO user_activity_logs (user_id, action, metadata) VALUES (?, ?, ?)',
      [userId, 'game_complete', JSON.stringify({ points: finalPoints, level, difficulty, gameType, xp: earnedXP })]
    );

    return {
      finalPoints,
      earnedXP,
      multiplier,
      levelProgress,
      gameType,
    };
  }

  async getUserStats(userId: number) {
    const pool = getDatabasePool();

    const [userLevel] = await pool.query<RowDataPacket[]>(
      'SELECT current_level, stars_earned, total_xp FROM user_levels WHERE user_id = ?',
      [userId]
    );

    const [totalGames] = await pool.query<RowDataPacket[]>(
      'SELECT COUNT(*) as count FROM game_scores WHERE user_id = ?',
      [userId]
    );

    const [highScore] = await pool.query<RowDataPacket[]>(
      'SELECT MAX(points) as score FROM game_scores WHERE user_id = ?',
      [userId]
    );

    const [totalPoints] = await pool.query<RowDataPacket[]>(
      'SELECT SUM(points) as total FROM game_scores WHERE user_id = ?',
      [userId]
    );

    const [gameLevels] = await pool.query<RowDataPacket[]>(
      'SELECT game_type, current_level, stars_earned, total_xp FROM user_game_levels WHERE user_id = ?',
      [userId]
    );

    const [gameHistory] = await pool.query<RowDataPacket[]>(
      `SELECT game_type, SUM(points) as total_points, COUNT(*) as games_played, MAX(points) as high_score
       FROM game_scores
       WHERE user_id = ?
       GROUP BY game_type`,
      [userId]
    );

    const [achievements] = await pool.query<RowDataPacket[]>(
      `SELECT a.name, a.description, ua.unlocked_at 
       FROM user_achievements ua 
       JOIN achievements a ON ua.achievement_id = a.id 
       WHERE ua.user_id = ?
       ORDER BY ua.unlocked_at DESC`,
      [userId]
    );

    const currentLevel = userLevel[0] || { current_level: 1, stars_earned: 0, total_xp: 0 };
    const xpForNextLevel = this.calculateXPForLevel(currentLevel.current_level + 1);
    const xpProgress = currentLevel.total_xp - this.calculateXPForLevel(currentLevel.current_level);

    return {
      level: currentLevel.current_level,
      stars: currentLevel.stars_earned,
      totalXP: currentLevel.total_xp,
      xpForNextLevel,
      xpProgress,
      totalGames: totalGames[0]?.count || 0,
      highScore: highScore[0]?.score || 0,
      totalPoints: totalPoints[0]?.total || 0,
      gameLevels: gameLevels || [],
      gameHistory: gameHistory || [],
      achievements: achievements || [],
    };
  }

  async getRecentGames(userId: number, limit: number = 10) {
    const pool = getDatabasePool();

    const [games] = await pool.query<RowDataPacket[]>(
      `SELECT id, points, level, difficulty, game_type, completed_at 
       FROM game_scores 
       WHERE user_id = ? 
       ORDER BY completed_at DESC 
       LIMIT ?`,
      [userId, limit]
    );

    return games;
  }

  private async updateUserLevel(userId: number, earnedXP: number, gameType: GameType = GameType.COLOR_SORT) {
    const pool = getDatabasePool();

    // 1. Update Global Level
    const [currentLevel] = await pool.query<RowDataPacket[]>(
      'SELECT current_level, total_xp FROM user_levels WHERE user_id = ?',
      [userId]
    );

    const current = currentLevel[0] || { current_level: 1, total_xp: 0 };
    const newTotalXP = current.total_xp + earnedXP;
    let newLevel = current.current_level;

    while (newLevel < this.MAX_LEVEL && newTotalXP >= this.calculateXPForLevel(newLevel + 1)) {
      newLevel++;
    }

    const levelsGained = newLevel - current.current_level;
    const starsEarned = levelsGained * 3;

    await pool.query(
      'UPDATE user_levels SET current_level = ?, total_xp = ?, stars_earned = stars_earned + ? WHERE user_id = ?',
      [newLevel, newTotalXP, starsEarned, userId]
    );

    // 2. Update Game Specific Level
    const [currentGameLevel] = await pool.query<RowDataPacket[]>(
      'SELECT current_level, total_xp FROM user_game_levels WHERE user_id = ? AND game_type = ?',
      [userId, gameType]
    );

    let gameNewLevel: number;
    let gameNewTotalXP: number;
    let gameLevelsGained: number;
    let gameStarsEarned: number;

    if (currentGameLevel.length === 0) {
      // Initialize game level if it doesn't exist
      gameNewLevel = 1;
      gameNewTotalXP = earnedXP;
      while (gameNewLevel < this.MAX_LEVEL && gameNewTotalXP >= this.calculateXPForLevel(gameNewLevel + 1)) {
        gameNewLevel++;
      }
      gameLevelsGained = gameNewLevel - 0; // Starting from level 0 essentially
      gameStarsEarned = gameNewLevel * 3;
      
      await pool.query(
        'INSERT INTO user_game_levels (user_id, game_type, current_level, total_xp, stars_earned) VALUES (?, ?, ?, ?, ?)',
        [userId, gameType, gameNewLevel, gameNewTotalXP, gameStarsEarned]
      );
    } else {
      const gameCurrent = currentGameLevel[0];
      gameNewTotalXP = gameCurrent.total_xp + earnedXP;
      gameNewLevel = gameCurrent.current_level;

      while (gameNewLevel < this.MAX_LEVEL && gameNewTotalXP >= this.calculateXPForLevel(gameNewLevel + 1)) {
        gameNewLevel++;
      }

      gameLevelsGained = gameNewLevel - gameCurrent.current_level;
      gameStarsEarned = gameLevelsGained * 3;

      await pool.query(
        'UPDATE user_game_levels SET current_level = ?, total_xp = ?, stars_earned = stars_earned + ? WHERE user_id = ? AND game_type = ?',
        [gameNewLevel, gameNewTotalXP, gameStarsEarned, userId, gameType]
      );
    }

    if (levelsGained > 0) {
      await pool.query(
        'INSERT INTO rewards (user_id, reward_type, amount, metadata) VALUES (?, ?, ?, ?)',
        [userId, 'xp', earnedXP, JSON.stringify({ levelsGained, newLevel, gameType })]
      );
    }

    const xpForNextLevel = this.calculateXPForLevel(newLevel + 1);
    const xpForCurrentLevel = this.calculateXPForLevel(newLevel);
    const progress = ((newTotalXP - xpForCurrentLevel) / (xpForNextLevel - xpForCurrentLevel)) * 100;

    // Return game-specific level progress as primary, but include global
    const gameXpForNextLevel = this.calculateXPForLevel(gameNewLevel + 1);
    const gameXpForCurrentLevel = this.calculateXPForLevel(gameNewLevel);
    const gameProgress = ((gameNewTotalXP - gameXpForCurrentLevel) / (gameXpForNextLevel - gameXpForCurrentLevel)) * 100;

    return {
      currentLevel: gameNewLevel,
      totalXP: gameNewTotalXP,
      levelsGained: gameLevelsGained,
      starsEarned: gameStarsEarned,
      xpForNextLevel: gameXpForNextLevel,
      progress: Math.min(100, gameProgress),
      global: {
        currentLevel: newLevel,
        totalXP: newTotalXP,
        levelsGained,
        starsEarned,
        xpForNextLevel,
        progress: Math.min(100, progress),
      }
    };
  }

  private calculateXPForLevel(level: number): number {
    return Math.floor(this.LEVEL_XP_BASE * Math.pow(1.5, level - 1));
  }

  private async checkAndUnlockAchievements(userId: number, points: number, level: number) {
    const pool = getDatabasePool();

    const [totalGames] = await pool.query<RowDataPacket[]>(
      'SELECT COUNT(*) as count FROM game_scores WHERE user_id = ?',
      [userId]
    );

    const gamesPlayed = totalGames[0]?.count || 0;

    const achievementChecks = [
      { type: 'games_played', value: gamesPlayed },
      { type: 'single_game_score', value: points },
      { type: 'level_reached', value: level },
    ];

    for (const check of achievementChecks) {
      const [achievements] = await pool.query<RowDataPacket[]>(
        `SELECT a.id, a.reward_xp, a.reward_coins 
         FROM achievements a
         WHERE a.requirement_type = ? 
         AND a.requirement_value <= ?
         AND NOT EXISTS (
           SELECT 1 FROM user_achievements ua 
           WHERE ua.user_id = ? AND ua.achievement_id = a.id
         )`,
        [check.type, check.value, userId]
      );

      for (const achievement of achievements) {
        await pool.query(
          'INSERT INTO user_achievements (user_id, achievement_id) VALUES (?, ?)',
          [userId, achievement.id]
        );

        await pool.query(
          'INSERT INTO rewards (user_id, reward_type, amount, metadata) VALUES (?, ?, ?, ?)',
          [userId, 'achievement', achievement.reward_xp, JSON.stringify({ achievementId: achievement.id })]
        );

        if (achievement.reward_xp > 0) {
          await pool.query(
            'UPDATE user_levels SET total_xp = total_xp + ? WHERE user_id = ?',
            [achievement.reward_xp, userId]
          );
        }
      }
    }
  }
}
