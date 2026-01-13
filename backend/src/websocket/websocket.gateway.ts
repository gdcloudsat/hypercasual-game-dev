import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
  MessageBody,
  ConnectedSocket,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Injectable } from '@nestjs/common';

interface ConnectedClient {
  userId?: number;
  username?: string;
}

@Injectable()
@WebSocketGateway({
  cors: {
    origin: process.env.CORS_ORIGIN || 'http://localhost:5173',
    credentials: true,
  },
})
export class WebsocketGateway
  implements OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer()
  server: Server;

  private connectedClients = new Map<string, ConnectedClient>();

  handleConnection(client: Socket) {
    console.log(`Client connected: ${client.id}`);
    this.connectedClients.set(client.id, {});
  }

  handleDisconnect(client: Socket) {
    console.log(`Client disconnected: ${client.id}`);
    this.connectedClients.delete(client.id);
  }

  @SubscribeMessage('authenticate')
  handleAuthenticate(
    @MessageBody() data: { userId: number; username: string },
    @ConnectedSocket() client: Socket,
  ) {
    this.connectedClients.set(client.id, {
      userId: data.userId,
      username: data.username,
    });
    client.emit('authenticated', { success: true });
  }

  @SubscribeMessage('subscribe-leaderboard')
  handleSubscribeLeaderboard(@ConnectedSocket() client: Socket) {
    client.join('leaderboard');
    client.emit('subscribed', { channel: 'leaderboard' });
  }

  @SubscribeMessage('unsubscribe-leaderboard')
  handleUnsubscribeLeaderboard(@ConnectedSocket() client: Socket) {
    client.leave('leaderboard');
    client.emit('unsubscribed', { channel: 'leaderboard' });
  }

  @SubscribeMessage('ping')
  handlePing(@ConnectedSocket() client: Socket) {
    client.emit('pong');
  }

  broadcastLeaderboardUpdate(leaderboard: any) {
    this.server.to('leaderboard').emit('leaderboard-update', leaderboard);
  }

  broadcastScoreSubmission(data: {
    userId: number;
    username: string;
    points: number;
    level: number;
  }) {
    this.server.emit('score-submitted', data);
  }

  sendNotification(userId: number, notification: any) {
    const clientId = this.findClientByUserId(userId);
    if (clientId) {
      this.server.to(clientId).emit('notification', notification);
    }
  }

  broadcastAchievementUnlocked(data: {
    userId: number;
    username: string;
    achievementName: string;
  }) {
    this.server.emit('achievement-unlocked', data);
  }

  private findClientByUserId(userId: number): string | undefined {
    for (const [clientId, client] of this.connectedClients.entries()) {
      if (client.userId === userId) {
        return clientId;
      }
    }
    return undefined;
  }

  getConnectedClientsCount(): number {
    return this.connectedClients.size;
  }
}
