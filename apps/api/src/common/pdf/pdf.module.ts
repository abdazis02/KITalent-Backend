import { Global, Module } from '@nestjs/common';
import { PdfService } from './pdf.service';

/** Global so any module can render documents to PDF (PRD §18 generate-pdf). */
@Global()
@Module({
  providers: [PdfService],
  exports: [PdfService],
})
export class PdfModule {}
