import { Controller, Get, Query, UseGuards, Request } from '@nestjs/common';
import { LeaderboardService } from './leaderboard.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';

@Controller('leaderboard')
@UseGuards(JwtAuthGuard)
export class LeaderboardController {
  constructor(private leaderboardService: LeaderboardService) {}

  @Get('global')
  async getGlobalLeaderboard(
    @Query('page') page?: string,
    @Query('pageSize') pageSize?: string,
  ) {
    const parsedPage = page ? parseInt(page) : 1;
    const parsedPageSize = pageSize ? parseInt(pageSize) : 20;
    return this.leaderboardService.getGlobalLeaderboard(parsedPage, parsedPageSize);
  }

  @Get('daily')
  async getDailyLeaderboard(
    @Query('page') page?: string,
    @Query('pageSize') pageSize?: string,
  ) {
    const parsedPage = page ? parseInt(page) : 1;
    const parsedPageSize = pageSize ? parseInt(pageSize) : 20;
    return this.leaderboardService.getDailyLeaderboard(parsedPage, parsedPageSize);
  }

  @Get('weekly')
  async getWeeklyLeaderboard(
    @Query('page') page?: string,
    @Query('pageSize') pageSize?: string,
  ) {
    const parsedPage = page ? parseInt(page) : 1;
    const parsedPageSize = pageSize ? parseInt(pageSize) : 20;
    return this.leaderboardService.getWeeklyLeaderboard(parsedPage, parsedPageSize);
  }

  @Get('my-rank')
  async getUserRank(@Request() req) {
    const rank = await this.leaderboardService.getUserRank(req.user.userId);
    return { rank };
  }
}
