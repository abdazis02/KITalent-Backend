import { Global, Module } from '@nestjs/common';
import { TokenBlacklistService } from './token-blacklist.service';

/** Global so the auth strategy/guard and services can share the token denylist (PRD §22). */
@Global()
@Module({
  providers: [TokenBlacklistService],
  exports: [TokenBlacklistService],
})
export class SecurityModule {}
