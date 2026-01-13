import { Controller, Post, Get, Body, UseGuards, Request, Query } from '@nestjs/common';
import { GameService } from './game.service';
import { SubmitScoreDto, StartSessionDto } from './dto/game.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';

@Controller('game')
@UseGuards(JwtAuthGuard)
export class GameController {
  constructor(private gameService: GameService) {}

  @Post('start-session')
  async startSession(@Request() req, @Body() startSessionDto: StartSessionDto) {
    return this.gameService.startSession(req.user.userId, startSessionDto.difficulty);
  }

  @Post('submit-score')
  async submitScore(@Request() req, @Body() submitScoreDto: SubmitScoreDto) {
    return this.gameService.submitScore(req.user.userId, submitScoreDto);
  }

  @Get('stats')
  async getUserStats(@Request() req) {
    return this.gameService.getUserStats(req.user.userId);
  }

  @Get('recent-games')
  async getRecentGames(@Request() req, @Query('limit') limit?: string) {
    const parsedLimit = limit ? parseInt(limit) : 10;
    return this.gameService.getRecentGames(req.user.userId, parsedLimit);
  }
}
