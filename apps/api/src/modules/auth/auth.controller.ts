import { Body, Controller, Get, Post, Req } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import type { Request } from 'express';
import { Public } from '../../common/decorators/public.decorator';
import { CurrentUser, type AuthenticatedUser } from '../../common/decorators/current-user.decorator';
import { AuthService } from './auth.service';
import { LoginDto, RefreshDto } from './dto/login.dto';

function ctxFrom(req: Request) {
  return {
    ipAddress: req.ip,
    userAgent: req.headers['user-agent'],
    deviceId: (req.headers['x-device-id'] as string) || undefined,
  };
}

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly auth: AuthService) {}

  @Public()
  @Throttle({ default: { limit: 5, ttl: 60_000 } }) // brute-force guard (PRD §22)
  @Post('login')
  @ApiOperation({ summary: 'Authenticate and receive access + refresh tokens' })
  login(@Body() dto: LoginDto, @Req() req: Request) {
    return this.auth.login(dto, ctxFrom(req));
  }

  @Public()
  @Post('refresh')
  @ApiOperation({ summary: 'Rotate refresh token and receive a new access token' })
  refresh(@Body() dto: RefreshDto, @Req() req: Request) {
    return this.auth.refresh(dto.refreshToken, ctxFrom(req));
  }

  @ApiBearerAuth()
  @Post('logout')
  @ApiOperation({ summary: 'Revoke the current refresh token' })
  logout(@Body() dto: RefreshDto, @CurrentUser() user: AuthenticatedUser) {
    return this.auth.logout(user.id, dto.refreshToken, user.tenantId, user.jti, user.tokenExp);
  }

  @ApiBearerAuth()
  @Get('me')
  @ApiOperation({ summary: 'Return the authenticated user with roles and permissions' })
  me(@CurrentUser() user: AuthenticatedUser) {
    return user;
  }
}
