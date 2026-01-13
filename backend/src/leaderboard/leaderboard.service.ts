import { Injectable } from '@nestjs/common';
import { getDatabasePool } from '../database/database.config';
import { getRedisClient } from '../database/redis.config';
import { RowDataPacket } from 'mysql2';

@Injectable()
export class LeaderboardService {
  private readonly CACHE_TTL = 300;
  private readonly LEADERBOARD_SIZE = 100;

  async getGlobalLeaderboard(page: number = 1, pageSize: number = 20) {
    const redis = await getRedisClient();
    const cacheKey = `leaderboard:global:${page}:${pageSize}`;

    const cached = await redis.get(cacheKey);
    if (cached) {
      return JSON.parse(cached);
    }

    const pool = getDatabasePool();
    const offset = (page - 1) * pageSize;

    const [leaderboard] = await pool.query<RowDataPacket[]>(
      `SELECT 
        u.id,
        u.username,
        ul.current_level as level,
        COALESCE(SUM(gs.points), 0) as totalPoints,
        ul.total_xp as totalXP
       FROM users u
       LEFT JOIN user_levels ul ON u.id = ul.user_id
       LEFT JOIN game_scores gs ON u.id = gs.user_id
       WHERE u.is_banned = FALSE
       GROUP BY u.id, u.username, ul.current_level, ul.total_xp
       ORDER BY totalPoints DESC, ul.total_xp DESC
       LIMIT ? OFFSET ?`,
      [pageSize, offset]
    );

    const result = leaderboard.map((entry, index) => ({
      rank: offset + index + 1,
      userId: entry.id,
      username: entry.username,
      totalPoints: entry.totalPoints || 0,
      level: entry.level || 1,
      totalXP: entry.totalXP || 0,
    }));

    await redis.setEx(cacheKey, this.CACHE_TTL, JSON.stringify(result));

    return result;
  }

  async getDailyLeaderboard(page: number = 1, pageSize: number = 20) {
    const redis = await getRedisClient();
    const cacheKey = `leaderboard:daily:${page}:${pageSize}`;

    const cached = await redis.get(cacheKey);
    if (cached) {
      return JSON.parse(cached);
    }

    const pool = getDatabasePool();
    const offset = (page - 1) * pageSize;
    const today = new Date().toISOString().split('T')[0];

    const [leaderboard] = await pool.query<RowDataPacket[]>(
      `SELECT 
        u.id,
        u.username,
        ul.current_level as level,
        COALESCE(SUM(gs.points), 0) as dailyPoints
       FROM users u
       LEFT JOIN user_levels ul ON u.id = ul.user_id
       LEFT JOIN game_scores gs ON u.id = gs.user_id AND DATE(gs.completed_at) = ?
       WHERE u.is_banned = FALSE
       GROUP BY u.id, u.username, ul.current_level
       HAVING dailyPoints > 0
       ORDER BY dailyPoints DESC
       LIMIT ? OFFSET ?`,
      [today, pageSize, offset]
    );

    const result = leaderboard.map((entry, index) => ({
      rank: offset + index + 1,
      userId: entry.id,
      username: entry.username,
      dailyPoints: entry.dailyPoints || 0,
      level: entry.level || 1,
    }));

    await redis.setEx(cacheKey, 60, JSON.stringify(result));

    return result;
  }

  async getWeeklyLeaderboard(page: number = 1, pageSize: number = 20) {
    const redis = await getRedisClient();
    const cacheKey = `leaderboard:weekly:${page}:${pageSize}`;

    const cached = await redis.get(cacheKey);
    if (cached) {
      return JSON.parse(cached);
    }

    const pool = getDatabasePool();
    const offset = (page - 1) * pageSize;
    const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

    const [leaderboard] = await pool.query<RowDataPacket[]>(
      `SELECT 
        u.id,
        u.username,
        ul.current_level as level,
        COALESCE(SUM(gs.points), 0) as weeklyPoints
       FROM users u
       LEFT JOIN user_levels ul ON u.id = ul.user_id
       LEFT JOIN game_scores gs ON u.id = gs.user_id AND DATE(gs.completed_at) >= ?
       WHERE u.is_banned = FALSE
       GROUP BY u.id, u.username, ul.current_level
       HAVING weeklyPoints > 0
       ORDER BY weeklyPoints DESC
       LIMIT ? OFFSET ?`,
      [weekAgo, pageSize, offset]
    );

    const result = leaderboard.map((entry, index) => ({
      rank: offset + index + 1,
      userId: entry.id,
      username: entry.username,
      weeklyPoints: entry.weeklyPoints || 0,
      level: entry.level || 1,
    }));

    await redis.setEx(cacheKey, 300, JSON.stringify(result));

    return result;
  }

  async getUserRank(userId: number) {
    const pool = getDatabasePool();

    const [result] = await pool.query<RowDataPacket[]>(
      `SELECT COUNT(*) + 1 as rank
       FROM (
         SELECT u.id, COALESCE(SUM(gs.points), 0) as totalPoints
         FROM users u
         LEFT JOIN game_scores gs ON u.id = gs.user_id
         WHERE u.is_banned = FALSE
         GROUP BY u.id
       ) as rankings
       WHERE totalPoints > (
         SELECT COALESCE(SUM(points), 0)
         FROM game_scores
         WHERE user_id = ?
       )`,
      [userId]
    );

    return result[0]?.rank || 0;
  }

  async invalidateCache() {
    const redis = await getRedisClient();
    const keys = await redis.keys('leaderboard:*');
    if (keys.length > 0) {
      await redis.del(keys);
    }
  }

  async persistLeaderboardToDatabase() {
    const pool = getDatabasePool();
    const today = new Date().toISOString().split('T')[0];

    const globalLeaderboard = await this.getGlobalLeaderboard(1, this.LEADERBOARD_SIZE);

    for (const entry of globalLeaderboard) {
      await pool.query(
        `INSERT INTO leaderboards (user_id, rank, points, level, leaderboard_type, snapshot_date)
         VALUES (?, ?, ?, ?, 'global', ?)
         ON DUPLICATE KEY UPDATE rank = ?, points = ?, level = ?`,
        [entry.userId, entry.rank, entry.totalPoints, entry.level, today, entry.rank, entry.totalPoints, entry.level]
      );
    }
  }
}
