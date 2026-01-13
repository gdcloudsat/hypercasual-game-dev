import { Injectable } from '@nestjs/common';
import { getDatabasePool } from '../database/database.config';
import { RowDataPacket, ResultSetHeader } from 'mysql2';

@Injectable()
export class RewardsService {
  private readonly DAILY_BONUS_COINS = 100;
  private readonly DAILY_BONUS_XP = 50;

  async claimDailyBonus(userId: number) {
    const pool = getDatabasePool();

    const today = new Date().toISOString().split('T')[0];

    const [existingBonus] = await pool.query<RowDataPacket[]>(
      `SELECT id FROM rewards 
       WHERE user_id = ? 
       AND reward_type = 'daily_bonus' 
       AND DATE(earned_at) = ?`,
      [userId, today]
    );

    if (existingBonus.length > 0) {
      return { claimed: false, message: 'Daily bonus already claimed today' };
    }

    await pool.query<ResultSetHeader>(
      'INSERT INTO rewards (user_id, reward_type, amount, metadata) VALUES (?, ?, ?, ?)',
      [userId, 'daily_bonus', this.DAILY_BONUS_COINS, JSON.stringify({ xp: this.DAILY_BONUS_XP })]
    );

    await pool.query(
      'UPDATE user_levels SET total_xp = total_xp + ? WHERE user_id = ?',
      [this.DAILY_BONUS_XP, userId]
    );

    await this.updateStreak(userId);

    return {
      claimed: true,
      coins: this.DAILY_BONUS_COINS,
      xp: this.DAILY_BONUS_XP,
    };
  }

  async getUserRewards(userId: number, limit: number = 20) {
    const pool = getDatabasePool();

    const [rewards] = await pool.query<RowDataPacket[]>(
      `SELECT id, reward_type, amount, metadata, earned_at 
       FROM rewards 
       WHERE user_id = ? 
       ORDER BY earned_at DESC 
       LIMIT ?`,
      [userId, limit]
    );

    return rewards;
  }

  async getTotalCoins(userId: number) {
    const pool = getDatabasePool();

    const [result] = await pool.query<RowDataPacket[]>(
      `SELECT SUM(amount) as total 
       FROM rewards 
       WHERE user_id = ? AND reward_type IN ('coins', 'daily_bonus', 'achievement')`,
      [userId]
    );

    return result[0]?.total || 0;
  }

  async getStreak(userId: number) {
    const pool = getDatabasePool();

    const [streak] = await pool.query<RowDataPacket[]>(
      'SELECT current_streak, longest_streak, last_activity_date FROM user_streaks WHERE user_id = ?',
      [userId]
    );

    return streak[0] || { current_streak: 0, longest_streak: 0, last_activity_date: null };
  }

  private async updateStreak(userId: number) {
    const pool = getDatabasePool();
    const today = new Date().toISOString().split('T')[0];
    const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];

    const [streak] = await pool.query<RowDataPacket[]>(
      'SELECT current_streak, longest_streak, last_activity_date FROM user_streaks WHERE user_id = ?',
      [userId]
    );

    if (streak.length === 0) {
      await pool.query(
        'INSERT INTO user_streaks (user_id, current_streak, longest_streak, last_activity_date) VALUES (?, 1, 1, ?)',
        [userId, today]
      );
      return;
    }

    const lastActivity = streak[0].last_activity_date;
    let newStreak = streak[0].current_streak;

    if (!lastActivity || lastActivity === yesterday) {
      newStreak += 1;
    } else if (lastActivity !== today) {
      newStreak = 1;
    }

    const newLongest = Math.max(newStreak, streak[0].longest_streak);

    await pool.query(
      'UPDATE user_streaks SET current_streak = ?, longest_streak = ?, last_activity_date = ? WHERE user_id = ?',
      [newStreak, newLongest, today, userId]
    );

    if (newStreak === 7) {
      const [achievements] = await pool.query<RowDataPacket[]>(
        `SELECT a.id FROM achievements a
         WHERE a.requirement_type = 'streak_days' AND a.requirement_value = 7
         AND NOT EXISTS (
           SELECT 1 FROM user_achievements ua 
           WHERE ua.user_id = ? AND ua.achievement_id = a.id
         )`,
        [userId]
      );

      if (achievements.length > 0) {
        await pool.query(
          'INSERT INTO user_achievements (user_id, achievement_id) VALUES (?, ?)',
          [userId, achievements[0].id]
        );
      }
    }
  }
}
