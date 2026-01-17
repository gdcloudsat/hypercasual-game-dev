import { Injectable } from '@nestjs/common';
import { getDatabasePool } from '../database/database.config';
import { RowDataPacket, ResultSetHeader } from 'mysql2';

@Injectable()
export class AdsService {
  private readonly AD_REWARD_XP = 50;
  private readonly AD_REWARD_COINS = 25;
  private readonly AD_REWARD_POINTS = 100;

  async recordAdWatched(userId: number) {
    const pool = getDatabasePool();

    await pool.query<ResultSetHeader>(
      'INSERT INTO ad_rewards (user_id, reward_type, amount, ad_shown) VALUES (?, ?, ?, TRUE)',
      [userId, 'xp', this.AD_REWARD_XP]
    );

    await pool.query<ResultSetHeader>(
      'INSERT INTO ad_rewards (user_id, reward_type, amount, ad_shown) VALUES (?, ?, ?, TRUE)',
      [userId, 'coins', this.AD_REWARD_COINS]
    );

    const [stats] = await pool.query<RowDataPacket[]>(
      'SELECT total_ads_watched, total_coins_from_ads, total_xp_from_ads FROM user_ad_stats WHERE user_id = ?',
      [userId]
    );

    if (stats.length > 0) {
      await pool.query(
        'UPDATE user_ad_stats SET total_ads_watched = total_ads_watched + 1, total_coins_from_ads = total_coins_from_ads + ?, total_xp_from_ads = total_xp_from_ads + ?, last_ad_watched_at = CURRENT_TIMESTAMP WHERE user_id = ?',
        [this.AD_REWARD_COINS, this.AD_REWARD_XP, userId]
      );
    } else {
      await pool.query(
        'INSERT INTO user_ad_stats (user_id, total_ads_watched, total_coins_from_ads, total_xp_from_ads, last_ad_watched_at) VALUES (?, 1, ?, ?, CURRENT_TIMESTAMP)',
        [userId, this.AD_REWARD_COINS, this.AD_REWARD_XP]
      );
    }

    await pool.query(
      'UPDATE user_levels SET total_xp = total_xp + ? WHERE user_id = ?',
      [this.AD_REWARD_XP, userId]
    );

    await pool.query(
      'INSERT INTO user_activity_logs (user_id, action, metadata) VALUES (?, ?, ?)',
      [userId, 'ad_watched', JSON.stringify({ xp: this.AD_REWARD_XP, coins: this.AD_REWARD_COINS })]
    );

    return {
      xp: this.AD_REWARD_XP,
      coins: this.AD_REWARD_COINS,
      points: this.AD_REWARD_POINTS,
    };
  }

  async recordAdSkipped(userId: number) {
    const pool = getDatabasePool();

    const [stats] = await pool.query<RowDataPacket[]>(
      'SELECT total_ads_skipped FROM user_ad_stats WHERE user_id = ?',
      [userId]
    );

    if (stats.length > 0) {
      await pool.query(
        'UPDATE user_ad_stats SET total_ads_skipped = total_ads_skipped + 1 WHERE user_id = ?',
        [userId]
      );
    } else {
      await pool.query(
        'INSERT INTO user_ad_stats (user_id, total_ads_skipped) VALUES (?, 1)',
        [userId]
      );
    }

    await pool.query(
      'INSERT INTO user_activity_logs (user_id, action, metadata) VALUES (?, ?, ?)',
      [userId, 'ad_skipped', JSON.stringify({})]
    );

    return {
      skipped: true,
    };
  }

  async getAdStats(userId: number) {
    const pool = getDatabasePool();

    const [stats] = await pool.query<RowDataPacket[]>(
      'SELECT total_ads_watched, total_ads_skipped, total_coins_from_ads, total_xp_from_ads, last_ad_watched_at FROM user_ad_stats WHERE user_id = ?',
      [userId]
    );

    if (stats.length === 0) {
      return {
        totalAdsWatched: 0,
        totalAdsSkipped: 0,
        totalCoinsFromAds: 0,
        totalXPFromAds: 0,
        lastAdWatchedAt: null,
      };
    }

    const stat = stats[0];
    return {
      totalAdsWatched: stat.total_ads_watched,
      totalAdsSkipped: stat.total_ads_skipped,
      totalCoinsFromAds: stat.total_coins_from_ads,
      totalXPFromAds: stat.total_xp_from_ads,
      lastAdWatchedAt: stat.last_ad_watched_at,
    };
  }

  getAdRewards() {
    return {
      xp: this.AD_REWARD_XP,
      coins: this.AD_REWARD_COINS,
      points: this.AD_REWARD_POINTS,
    };
  }
}
