import { Injectable, NotFoundException } from '@nestjs/common';
import { getDatabasePool } from '../database/database.config';
import { RowDataPacket, ResultSetHeader } from 'mysql2';

@Injectable()
export class AdminService {
  async getAllUsers(page: number = 1, pageSize: number = 50) {
    const pool = getDatabasePool();
    const offset = (page - 1) * pageSize;

    const [users] = await pool.query<RowDataPacket[]>(
      `SELECT 
        u.id, u.username, u.email, u.is_guest, u.is_admin, u.is_banned,
        u.created_at, u.last_login,
        ul.current_level, ul.total_xp,
        COUNT(DISTINCT gs.id) as total_games,
        COALESCE(SUM(gs.points), 0) as total_points
       FROM users u
       LEFT JOIN user_levels ul ON u.id = ul.user_id
       LEFT JOIN game_scores gs ON u.id = gs.user_id
       GROUP BY u.id, u.username, u.email, u.is_guest, u.is_admin, u.is_banned,
                u.created_at, u.last_login, ul.current_level, ul.total_xp
       ORDER BY u.created_at DESC
       LIMIT ? OFFSET ?`,
      [pageSize, offset]
    );

    const [countResult] = await pool.query<RowDataPacket[]>(
      'SELECT COUNT(*) as total FROM users'
    );

    return {
      users,
      total: countResult[0].total,
      page,
      pageSize,
      totalPages: Math.ceil(countResult[0].total / pageSize),
    };
  }

  async getUserDetails(userId: number) {
    const pool = getDatabasePool();

    const [users] = await pool.query<RowDataPacket[]>(
      `SELECT 
        u.id, u.username, u.email, u.is_guest, u.is_admin, u.is_banned,
        u.created_at, u.last_login,
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

    const [games] = await pool.query<RowDataPacket[]>(
      'SELECT id, points, level, difficulty, completed_at FROM game_scores WHERE user_id = ? ORDER BY completed_at DESC LIMIT 10',
      [userId]
    );

    const [activities] = await pool.query<RowDataPacket[]>(
      'SELECT id, action, metadata, ip_address, created_at FROM user_activity_logs WHERE user_id = ? ORDER BY created_at DESC LIMIT 20',
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

    return {
      user,
      recentGames: games,
      recentActivity: activities,
      achievements,
    };
  }

  async banUser(userId: number, reason?: string) {
    const pool = getDatabasePool();

    await pool.query(
      'UPDATE users SET is_banned = TRUE WHERE id = ?',
      [userId]
    );

    await pool.query(
      'INSERT INTO user_activity_logs (user_id, action, metadata) VALUES (?, ?, ?)',
      [userId, 'banned', JSON.stringify({ reason })]
    );

    return { success: true, message: 'User banned successfully' };
  }

  async unbanUser(userId: number) {
    const pool = getDatabasePool();

    await pool.query(
      'UPDATE users SET is_banned = FALSE WHERE id = ?',
      [userId]
    );

    await pool.query(
      'INSERT INTO user_activity_logs (user_id, action) VALUES (?, ?)',
      [userId, 'unbanned']
    );

    return { success: true, message: 'User unbanned successfully' };
  }

  async deleteUser(userId: number) {
    const pool = getDatabasePool();

    await pool.query('DELETE FROM users WHERE id = ?', [userId]);

    return { success: true, message: 'User deleted successfully' };
  }

  async getSystemStats() {
    const pool = getDatabasePool();

    const [totalUsers] = await pool.query<RowDataPacket[]>(
      'SELECT COUNT(*) as count FROM users'
    );

    const [totalGames] = await pool.query<RowDataPacket[]>(
      'SELECT COUNT(*) as count FROM game_scores'
    );

    const [totalPoints] = await pool.query<RowDataPacket[]>(
      'SELECT SUM(points) as total FROM game_scores'
    );

    const [activeToday] = await pool.query<RowDataPacket[]>(
      `SELECT COUNT(DISTINCT user_id) as count 
       FROM user_activity_logs 
       WHERE DATE(created_at) = CURDATE()`
    );

    const [guestUsers] = await pool.query<RowDataPacket[]>(
      'SELECT COUNT(*) as count FROM users WHERE is_guest = TRUE'
    );

    const [registeredUsers] = await pool.query<RowDataPacket[]>(
      'SELECT COUNT(*) as count FROM users WHERE is_guest = FALSE'
    );

    const [topPlayers] = await pool.query<RowDataPacket[]>(
      `SELECT u.username, SUM(gs.points) as totalPoints
       FROM users u
       JOIN game_scores gs ON u.id = gs.user_id
       GROUP BY u.id, u.username
       ORDER BY totalPoints DESC
       LIMIT 5`
    );

    return {
      totalUsers: totalUsers[0].count,
      totalGames: totalGames[0].count,
      totalPoints: totalPoints[0].total || 0,
      dailyActiveUsers: activeToday[0].count,
      guestUsers: guestUsers[0].count,
      registeredUsers: registeredUsers[0].count,
      topPlayers,
    };
  }

  async getActivityFeed(limit: number = 50) {
    const pool = getDatabasePool();

    const [activities] = await pool.query<RowDataPacket[]>(
      `SELECT 
        ual.id, ual.action, ual.metadata, ual.created_at,
        u.username
       FROM user_activity_logs ual
       JOIN users u ON ual.user_id = u.id
       ORDER BY ual.created_at DESC
       LIMIT ?`,
      [limit]
    );

    return activities;
  }

  async getDailyStats(days: number = 7) {
    const pool = getDatabasePool();

    const [stats] = await pool.query<RowDataPacket[]>(
      `SELECT 
        DATE(created_at) as date,
        COUNT(DISTINCT user_id) as activeUsers,
        COUNT(*) as totalActions
       FROM user_activity_logs
       WHERE created_at >= DATE_SUB(CURDATE(), INTERVAL ? DAY)
       GROUP BY DATE(created_at)
       ORDER BY date DESC`,
      [days]
    );

    return stats;
  }
}
