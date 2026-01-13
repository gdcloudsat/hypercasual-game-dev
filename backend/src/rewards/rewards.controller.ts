import { Controller, Post, Get, UseGuards, Request, Query } from '@nestjs/common';
import { RewardsService } from './rewards.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';

@Controller('rewards')
@UseGuards(JwtAuthGuard)
export class RewardsController {
  constructor(private rewardsService: RewardsService) {}

  @Post('daily-bonus')
  async claimDailyBonus(@Request() req) {
    return this.rewardsService.claimDailyBonus(req.user.userId);
  }

  @Get()
  async getUserRewards(@Request() req, @Query('limit') limit?: string) {
    const parsedLimit = limit ? parseInt(limit) : 20;
    return this.rewardsService.getUserRewards(req.user.userId, parsedLimit);
  }

  @Get('coins')
  async getTotalCoins(@Request() req) {
    const total = await this.rewardsService.getTotalCoins(req.user.userId);
    return { totalCoins: total };
  }

  @Get('streak')
  async getStreak(@Request() req) {
    return this.rewardsService.getStreak(req.user.userId);
  }
}
