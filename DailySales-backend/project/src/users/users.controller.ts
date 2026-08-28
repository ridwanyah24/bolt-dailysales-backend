import { Controller, Get, Post, Patch, Body, Param, Query, Res } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiQuery } from '@nestjs/swagger';
import { JwtService } from '@nestjs/jwt';
import { UsersService } from './users.service';
import { InviteSalespersonDto, AcceptInviteDto, UpdateSalespersonStatusDto } from './dto';
import { Roles } from '../common/roles.decorator';
import { Public } from '../common/public.decorator';
import { CurrentBusiness } from '../common/current-user.decorator';
import { hashToken, generateToken } from '../common/utils';
import { PrismaService } from '../common/prisma.service';

@ApiTags('salespeople')
@Controller('salespeople')
export class UsersController {
  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
    private prisma: PrismaService,
  ) {}

  @Get()
  @Roles('owner')
  @ApiOperation({ summary: 'List salespeople (owner only)' })
  async getSalespeople(@CurrentBusiness() businessId: string) {
    return this.usersService.getSalespeople(businessId);
  }

  @Post('invite')
  @Roles('owner')
  @ApiOperation({ summary: 'Invite a salesperson (owner only)' })
  async inviteSalesperson(@CurrentBusiness() businessId: string, @Body() dto: InviteSalespersonDto) {
    return this.usersService.inviteSalesperson(businessId, dto);
  }

  @Public()
  @Post('accept-invite')
  @ApiOperation({ summary: 'Accept an invite and set password' })
  async acceptInvite(@Body() dto: AcceptInviteDto, @Res() res: any) {
    const result = await this.usersService.acceptInvite(dto);
    const user = result.user;

    // Issue tokens
    const accessToken = this.jwtService.sign({
      sub: user.id,
      businessId: user.businessId,
      role: user.role.toLowerCase(),
    });

    // Issue refresh token
    const refreshToken = generateToken();
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 30);
    await this.prisma.refreshToken.create({
      data: { userId: user.id, tokenHash: hashToken(refreshToken), expiresAt },
    });

    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: true,
      sameSite: 'none',
      path: '/v1/auth',
      maxAge: 30 * 24 * 60 * 60 * 1000,
    });

    res.status(200).json({
      user: {
        id: user.id,
        businessId: user.businessId,
        name: user.name,
        email: user.email,
        role: user.role.toLowerCase(),
        avatarUrl: user.avatarUrl || undefined,
        createdAt: user.createdAt instanceof Date ? user.createdAt.toISOString() : user.createdAt,
      },
      accessToken,
    });
  }

  @Patch(':id/status')
  @Roles('owner')
  @ApiOperation({ summary: 'Update salesperson status (owner only)' })
  async updateStatus(
    @CurrentBusiness() businessId: string,
    @Param('id') id: string,
    @Body() dto: UpdateSalespersonStatusDto,
  ) {
    return this.usersService.updateSalespersonStatus(businessId, id, dto.status);
  }

  @Get(':id/performance')
  @Roles('owner')
  @ApiOperation({ summary: 'Get salesperson performance (owner only)' })
  @ApiQuery({ name: 'start', required: false })
  @ApiQuery({ name: 'end', required: false })
  async getPerformance(
    @CurrentBusiness() businessId: string,
    @Param('id') id: string,
    @Query('start') start?: string,
    @Query('end') end?: string,
  ) {
    return this.usersService.getSalespersonPerformance(businessId, id, { start, end });
  }
}
