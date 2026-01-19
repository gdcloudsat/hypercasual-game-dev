import { Injectable, UnauthorizedException, ConflictException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { v4 as uuidv4 } from 'uuid';
import { getDatabasePool } from '../database/database.config';
import { RegisterDto, LoginDto } from './dto/register.dto';
import { RowDataPacket, ResultSetHeader } from 'mysql2';

@Injectable()
export class AuthService {
  constructor(private jwtService: JwtService) {}

  async register(registerDto: RegisterDto) {
    const pool = getDatabasePool();
    const { username, email, password } = registerDto;

    const [existingUsers] = await pool.query<RowDataPacket[]>(
      'SELECT id FROM users WHERE username = ? OR email = ?',
      [username, email]
    );

    if (existingUsers.length > 0) {
      throw new ConflictException('Username or email already exists');
    }

    const passwordHash = await bcrypt.hash(password, 10);

    const [result] = await pool.query<ResultSetHeader>(
      'INSERT INTO users (username, email, password_hash, is_guest) VALUES (?, ?, ?, ?)',
      [username, email, passwordHash, false]
    );

    const userId = result.insertId;

    await pool.query(
      'INSERT INTO user_levels (user_id, current_level, stars_earned, total_xp) VALUES (?, 1, 0, 0)',
      [userId]
    );

    await pool.query(
      'INSERT INTO user_streaks (user_id, current_streak, longest_streak) VALUES (?, 0, 0)',
      [userId]
    );

    const tokens = await this.generateTokens(userId, username, false, false);

    await pool.query(
      'INSERT INTO user_activity_logs (user_id, action, metadata) VALUES (?, ?, ?)',
      [userId, 'register', JSON.stringify({ method: 'email' })]
    );

    return {
      user: {
        id: userId,
        username,
        email,
        isGuest: false,
        isAdmin: false,
      },
      ...tokens,
    };
  }

  async login(loginDto: LoginDto) {
    const pool = getDatabasePool();
    const { username, password } = loginDto;

    const [users] = await pool.query<RowDataPacket[]>(
      'SELECT id, username, email, password_hash, is_guest, is_admin, is_banned FROM users WHERE username = ?',
      [username]
    );

    if (users.length === 0) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const user = users[0];

    if (user.is_banned) {
      throw new UnauthorizedException('Account has been banned');
    }

    if (user.is_guest) {
      throw new UnauthorizedException('Guest accounts cannot login with password');
    }

    const isPasswordValid = await bcrypt.compare(password, user.password_hash);

    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    await pool.query(
      'UPDATE users SET last_login = CURRENT_TIMESTAMP WHERE id = ?',
      [user.id]
    );

    await pool.query(
      'INSERT INTO user_activity_logs (user_id, action) VALUES (?, ?)',
      [user.id, 'login']
    );

    const tokens = await this.generateTokens(user.id, user.username, false, !!user.is_admin);

    return {
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        isGuest: false,
        isAdmin: !!user.is_admin,
      },
      ...tokens,
    };
  }

  async guestLogin(deviceId?: string) {
    const pool = getDatabasePool();
    
    const guestUsername = `guest_${uuidv4().substring(0, 8)}`;

    const [result] = await pool.query<ResultSetHeader>(
      'INSERT INTO users (username, is_guest) VALUES (?, TRUE)',
      [guestUsername]
    );

    const userId = result.insertId;

    await pool.query(
      'INSERT INTO user_levels (user_id, current_level, stars_earned, total_xp) VALUES (?, 1, 0, 0)',
      [userId]
    );

    await pool.query(
      'INSERT INTO user_streaks (user_id, current_streak, longest_streak) VALUES (?, 0, 0)',
      [userId]
    );

    const tokens = await this.generateTokens(userId, guestUsername, true, false);

    await pool.query(
      'INSERT INTO user_activity_logs (user_id, action, metadata) VALUES (?, ?, ?)',
      [userId, 'guest_login', JSON.stringify({ deviceId })]
    );

    return {
      user: {
        id: userId,
        username: guestUsername,
        isGuest: true,
        isAdmin: false,
      },
      ...tokens,
    };
  }

  async convertGuestToRegistered(userId: number, registerDto: RegisterDto) {
    const pool = getDatabasePool();
    const { username, email, password } = registerDto;

    const [users] = await pool.query<RowDataPacket[]>(
      'SELECT is_guest FROM users WHERE id = ?',
      [userId]
    );

    if (users.length === 0 || !users[0].is_guest) {
      throw new UnauthorizedException('Invalid guest account');
    }

    const [existingUsers] = await pool.query<RowDataPacket[]>(
      'SELECT id FROM users WHERE (username = ? OR email = ?) AND id != ?',
      [username, email, userId]
    );

    if (existingUsers.length > 0) {
      throw new ConflictException('Username or email already exists');
    }

    const passwordHash = await bcrypt.hash(password, 10);

    await pool.query(
      'UPDATE users SET username = ?, email = ?, password_hash = ?, is_guest = FALSE WHERE id = ?',
      [username, email, passwordHash, userId]
    );

    await pool.query(
      'INSERT INTO user_activity_logs (user_id, action) VALUES (?, ?)',
      [userId, 'guest_conversion']
    );

    const tokens = await this.generateTokens(userId, username, false, false);

    return {
      user: {
        id: userId,
        username,
        email,
        isGuest: false,
        isAdmin: false,
      },
      ...tokens,
    };
  }

  async refreshToken(refreshToken: string) {
    try {
      const payload = this.jwtService.verify(refreshToken, {
        secret: process.env.JWT_REFRESH_SECRET || 'your-super-secret-refresh-key-change-this-in-production',
      });

      const tokens = await this.generateTokens(
        payload.sub,
        payload.username,
        payload.isGuest,
        payload.isAdmin
      );

      return tokens;
    } catch (error) {
      throw new UnauthorizedException('Invalid refresh token');
    }
  }

  private async generateTokens(userId: number, username: string, isGuest: boolean, isAdmin: boolean) {
    const payload = { 
      sub: userId, 
      username, 
      isGuest,
      isAdmin 
    };

    const accessToken = this.jwtService.sign(payload, {
      secret: process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-this-in-production',
      expiresIn: process.env.JWT_EXPIRES_IN || '7d',
    });

    const refreshToken = this.jwtService.sign(payload, {
      secret: process.env.JWT_REFRESH_SECRET || 'your-super-secret-refresh-key-change-this-in-production',
      expiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '30d',
    });

    return {
      accessToken,
      refreshToken,
    };
  }
}
