import { Controller, Post, Get, Body, Req, Res, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { RegisterDto, LoginDto, ForgotPasswordDto, ResetPasswordDto, VerifyEmailDto } from './dto';
import { Public } from '../common/public.decorator';
import { CurrentUser } from '../common/current-user.decorator';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Public()
  @Post('register')
  @ApiOperation({ summary: 'Register a new business and owner' })
  async register(@Body() dto: RegisterDto, @Res() res: any) {
    const result = await this.authService.register(dto, res);
    res.status(201).json(result);
  }

  @Public()
  @Post('login')
  @ApiOperation({ summary: 'Login with email and password' })
  async login(@Body() dto: LoginDto, @Res() res: any) {
    const result = await this.authService.login(dto, res);
    res.status(200).json(result);
  }

  @Public()
  @Post('refresh')
  @ApiOperation({ summary: 'Refresh access token using httpOnly cookie' })
  async refresh(@Req() req: any, @Res() res: any) {
    const result = await this.authService.refresh(req, res);
    res.status(200).json(result);
  }

  @Post('logout')
  @ApiOperation({ summary: 'Logout and revoke refresh token' })
  async logout(@Req() req: any, @Res() res: any) {
    await this.authService.logout(req, res);
    res.status(204).send();
  }

  @Get('me')
  @ApiOperation({ summary: 'Get current user and business' })
  async me(@CurrentUser() user: any) {
    return this.authService.me(user);
  }

  @Public()
  @Post('forgot-password')
  @ApiOperation({ summary: 'Request a password reset' })
  async forgotPassword(@Body() dto: ForgotPasswordDto) {
    return this.authService.forgotPassword(dto);
  }

  @Public()
  @Post('reset-password')
  @ApiOperation({ summary: 'Reset password using a reset token' })
  async resetPassword(@Body() dto: ResetPasswordDto) {
    return this.authService.resetPassword(dto);
  }

  @Post('verify-email')
  @ApiOperation({ summary: 'Verify email with a code' })
  async verifyEmail(@Body() dto: VerifyEmailDto, @CurrentUser() user: any) {
    return this.authService.verifyEmail(dto, user);
  }
}
