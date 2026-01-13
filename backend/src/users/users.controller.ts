import { Controller, Get, UseGuards, Request, Query } from '@nestjs/common';
import { UsersService } from './users.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';

@Controller('users')
@UseGuards(JwtAuthGuard)
export class UsersController {
  constructor(private usersService: UsersService) {}

  @Get('profile')
  async getUserProfile(@Request() req) {
    return this.usersService.getUserProfile(req.user.userId);
  }

  @Get('activity')
  async getUserActivity(@Request() req, @Query('limit') limit?: string) {
    const parsedLimit = limit ? parseInt(limit) : 20;
    return this.usersService.getUserActivity(req.user.userId, parsedLimit);
  }

  @Get('search')
  async searchUsers(@Query('q') query: string, @Query('limit') limit?: string) {
    const parsedLimit = limit ? parseInt(limit) : 10;
    return this.usersService.searchUsers(query, parsedLimit);
  }
}
