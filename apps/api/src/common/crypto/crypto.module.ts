import { Global, Module } from '@nestjs/common';
import { FieldCryptoService } from './field-crypto.service';

/** Global so any module can encrypt/decrypt sensitive fields (PRD §22). */
@Global()
@Module({
  providers: [FieldCryptoService],
  exports: [FieldCryptoService],
})
export class CryptoModule {}
