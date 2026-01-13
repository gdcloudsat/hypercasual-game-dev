import { Controller, Post, Body, UseGuards, Request } from '@nestjs/common';
import { AuthService } from './auth.service';
import { RegisterDto, LoginDto, GuestLoginDto } from './dto/register.dto';
import { Public } from '../common/decorators/public.decorator';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Public()
  @Post('register')
  async register(@Body() registerDto: RegisterDto) {
    return this.authService.register(registerDto);
  }

  @Public()
  @Post('login')
  async login(@Body() loginDto: LoginDto) {
    return this.authService.login(loginDto);
  }

  @Public()
  @Post('guest-login')
  async guestLogin(@Body() guestLoginDto: GuestLoginDto) {
    return this.authService.guestLogin(guestLoginDto.deviceId);
  }

  @UseGuards(JwtAuthGuard)
  @Post('convert-guest')
  async convertGuest(@Request() req, @Body() registerDto: RegisterDto) {
    return this.authService.convertGuestToRegistered(req.user.userId, registerDto);
  }

  @Public()
  @Post('refresh')
  async refresh(@Body('refreshToken') refreshToken: string) {
    return this.authService.refreshToken(refreshToken);
  }

  @UseGuards(JwtAuthGuard)
  @Post('validate')
  async validate(@Request() req) {
    return { valid: true, user: req.user };
  }
}
