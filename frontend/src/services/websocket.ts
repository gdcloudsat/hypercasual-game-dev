import { io, Socket } from 'socket.io-client';
import config from '../config';

const { wsUrl: WS_URL } = config;

class WebSocketService {
  private socket: Socket | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;

  connect(userId?: number, username?: string) {
    if (this.socket?.connected) {
      return;
    }

    this.socket = io(WS_URL, {
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      reconnectionAttempts: this.maxReconnectAttempts,
    });

    this.socket.on('connect', () => {
      console.log('WebSocket connected');
      this.reconnectAttempts = 0;

      if (userId && username) {
        this.socket?.emit('authenticate', { userId, username });
      }
    });

    this.socket.on('disconnect', () => {
      console.log('WebSocket disconnected');
    });

    this.socket.on('connect_error', (error) => {
      console.error('WebSocket connection error:', error);
      this.reconnectAttempts++;
    });

    this.socket.on('pong', () => {
      console.log('Received pong from server');
    });
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
  }

  subscribeToLeaderboard(callback: (data: any) => void) {
    if (!this.socket) return;

    this.socket.emit('subscribe-leaderboard');
    this.socket.on('leaderboard-update', callback);
  }

  unsubscribeFromLeaderboard() {
    if (!this.socket) return;

    this.socket.emit('unsubscribe-leaderboard');
    this.socket.off('leaderboard-update');
  }

  onScoreSubmitted(callback: (data: any) => void) {
    if (!this.socket) return;
    this.socket.on('score-submitted', callback);
  }

  onNotification(callback: (data: any) => void) {
    if (!this.socket) return;
    this.socket.on('notification', callback);
  }

  onAchievementUnlocked(callback: (data: any) => void) {
    if (!this.socket) return;
    this.socket.on('achievement-unlocked', callback);
  }

  ping() {
    if (!this.socket) return;
    this.socket.emit('ping');
  }

  isConnected(): boolean {
    return this.socket?.connected || false;
  }
}

export const websocketService = new WebSocketService();
