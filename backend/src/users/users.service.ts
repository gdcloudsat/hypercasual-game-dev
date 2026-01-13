import { Injectable, NotFoundException } from '@nestjs/common';
import { getDatabasePool } from '../database/database.config';
import { RowDataPacket } from 'mysql2';

@Injectable()
export class UsersService {
  async getUserProfile(userId: number) {
    const pool = getDatabasePool();

    const [users] = await pool.query<RowDataPacket[]>(
      `SELECT 
        u.id, u.username, u.email, u.is_guest, u.is_admin, u.created_at, u.last_login,
        ul.current_level, ul.stars_earned, ul.total_xp
       FROM users u
       LEFT JOIN user_levels ul ON u.id = ul.user_id
       WHERE u.id = ?`,
      [userId]
    );

    if (users.length === 0) {
      throw new NotFoundException('User not found');
    }

    const user = users[0];

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

    const [achievements] = await pool.query<RowDataPacket[]>(
      'SELECT COUNT(*) as count FROM user_achievements WHERE user_id = ?',
      [userId]
    );

    return {
      id: user.id,
      username: user.username,
      email: user.email,
      isGuest: user.is_guest,
      isAdmin: user.is_admin,
      createdAt: user.created_at,
      lastLogin: user.last_login,
      level: user.current_level || 1,
      stars: user.stars_earned || 0,
      totalXP: user.total_xp || 0,
      totalGames: totalGames[0]?.count || 0,
      highScore: highScore[0]?.score || 0,
      totalPoints: totalPoints[0]?.total || 0,
      achievementsUnlocked: achievements[0]?.count || 0,
    };
  }

  async getUserActivity(userId: number, limit: number = 20) {
    const pool = getDatabasePool();

    const [activities] = await pool.query<RowDataPacket[]>(
      `SELECT id, action, metadata, ip_address, created_at
       FROM user_activity_logs
       WHERE user_id = ?
       ORDER BY created_at DESC
       LIMIT ?`,
      [userId, limit]
    );

    return activities;
  }

  async searchUsers(query: string, limit: number = 10) {
    const pool = getDatabasePool();

    const [users] = await pool.query<RowDataPacket[]>(
      `SELECT 
        u.id, u.username, u.is_guest,
        ul.current_level, ul.total_xp
       FROM users u
       LEFT JOIN user_levels ul ON u.id = ul.user_id
       WHERE u.username LIKE ? AND u.is_banned = FALSE
       LIMIT ?`,
      [`%${query}%`, limit]
    );

    return users;
  }
}
