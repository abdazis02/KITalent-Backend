import 'reflect-metadata';
import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import helmet from 'helmet';
import { AppModule } from './app.module';
import { PrismaExceptionFilter } from './common/filters/prisma-exception.filter';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, { cors: false });
  const config = app.get(ConfigService);

  // Security headers (PRD §22). CSP disabled so the Swagger UI keeps working.
  app.use(helmet({ contentSecurityPolicy: false, crossOriginEmbedderPolicy: false }));

  const prefix = config.get<string>('globalPrefix')!;
  app.setGlobalPrefix(prefix);

  app.enableCors({
    origin: config.get<string[]>('corsOrigins'),
    credentials: true,
    // PRD §10.34 #9: clients send Accept-Language; allow it + tenant/device headers.
    allowedHeaders: ['Content-Type', 'Authorization', 'Accept-Language', 'x-tenant-id', 'x-device-id'],
  });

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: { enableImplicitConversion: true },
    }),
  );

  // Map Prisma DB errors (unique/FK/…) to clean HTTP statuses instead of 500.
  app.useGlobalFilters(new PrismaExceptionFilter());

  // Swagger / OpenAPI (PRD §0.8)
  const swaggerConfig = new DocumentBuilder()
    .setTitle('KITalent API')
    .setDescription('Outsourcing Management Platform + SaaS HRIS — API-first backend')
    .setVersion('1.1')
    .addBearerAuth()
    .addGlobalParameters({
      name: 'Accept-Language',
      in: 'header',
      required: false,
      schema: { type: 'string', enum: ['id-ID', 'en-US'], default: 'id-ID' },
    })
    .build();
  const document = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup(`${prefix}/docs`, app, document);

  const port = config.get<number>('port')!;
  await app.listen(port);
  // eslint-disable-next-line no-console
  console.log(`KITalent API running on http://localhost:${port}/${prefix} (docs: /${prefix}/docs)`);
}

void bootstrap();
