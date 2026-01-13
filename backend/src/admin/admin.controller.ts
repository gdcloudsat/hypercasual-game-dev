import {
  Controller,
  Get,
  Post,
  Delete,
  Param,
  Query,
  Body,
  UseGuards,
  ParseIntPipe,
} from '@nestjs/common';
import { AdminService } from './admin.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { AdminGuard } from '../common/guards/admin.guard';
import { Admin } from '../common/decorators/admin.decorator';

@Controller('admin')
@UseGuards(JwtAuthGuard, AdminGuard)
@Admin()
export class AdminController {
  constructor(private adminService: AdminService) {}

  @Get('users')
  async getAllUsers(
    @Query('page') page?: string,
    @Query('pageSize') pageSize?: string,
  ) {
    const parsedPage = page ? parseInt(page) : 1;
    const parsedPageSize = pageSize ? parseInt(pageSize) : 50;
    return this.adminService.getAllUsers(parsedPage, parsedPageSize);
  }

  @Get('users/:id')
  async getUserDetails(@Param('id', ParseIntPipe) id: number) {
    return this.adminService.getUserDetails(id);
  }

  @Post('users/:id/ban')
  async banUser(
    @Param('id', ParseIntPipe) id: number,
    @Body('reason') reason?: string,
  ) {
    return this.adminService.banUser(id, reason);
  }

  @Post('users/:id/unban')
  async unbanUser(@Param('id', ParseIntPipe) id: number) {
    return this.adminService.unbanUser(id);
  }

  @Delete('users/:id')
  async deleteUser(@Param('id', ParseIntPipe) id: number) {
    return this.adminService.deleteUser(id);
  }

  @Get('stats')
  async getSystemStats() {
    return this.adminService.getSystemStats();
  }

  @Get('activity-feed')
  async getActivityFeed(@Query('limit') limit?: string) {
    const parsedLimit = limit ? parseInt(limit) : 50;
    return this.adminService.getActivityFeed(parsedLimit);
  }

  @Get('daily-stats')
  async getDailyStats(@Query('days') days?: string) {
    const parsedDays = days ? parseInt(days) : 7;
    return this.adminService.getDailyStats(parsedDays);
  }
}
