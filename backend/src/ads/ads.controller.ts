import { Controller, Post, Get, UseGuards, Req } from '@nestjs/common';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { AdsService } from './ads.service';

@Controller('ads')
@UseGuards(JwtAuthGuard)
export class AdsController {
  constructor(private readonly adsService: AdsService) {}

  @Post('watch')
  async watchAd(@Req() req: any) {
    const userId = req.user.userId;
    return this.adsService.recordAdWatched(userId);
  }

  @Post('skip')
  async skipAd(@Req() req: any) {
    const userId = req.user.userId;
    return this.adsService.recordAdSkipped(userId);
  }

  @Get('rewards')
  async getRewards() {
    return this.adsService.getAdRewards();
  }

  @Get('stats')
  async getStats(@Req() req: any) {
    const userId = req.user.userId;
    return this.adsService.getAdStats(userId);
  }
}
