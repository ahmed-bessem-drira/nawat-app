import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Global validation pipe
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  // CORS
  app.enableCors({
    origin: '*',
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
    credentials: true,
  });

  // Swagger documentation
  const config = new DocumentBuilder()
    .setTitle('NAWAT FOCUS API')
    .setDescription('API for NAWAT FOCUS - ADHD Support Platform')
    .setVersion('1.0')
    .addTag('auth', 'Authentication endpoints')
    .addTag('children', 'Child management')
    .addTag('sessions', 'Game sessions')
    .addTag('recommendations', 'AI recommendations')
    .addTag('sync', 'Data synchronization')
    .addBearerAuth()
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document);

  const port = process.env.PORT || 3001;

  await app.init();
  const server = app.getHttpServer();

  function tryListen(retries = 3) {
    server.listen(port, '0.0.0.0', () => {
      console.log(`🚀 NAWAT FOCUS Backend running on http://0.0.0.0:${port}`);
      console.log(`📚 API Documentation: http://0.0.0.0:${port}/api/docs`);
    });
    server.on('error', (err: any) => {
      if (err.code === 'EADDRINUSE' && retries > 0) {
        console.log(`Port ${port} busy, retrying in 10s...`);
        server.close();
        setTimeout(() => tryListen(retries - 1), 10000);
      } else {
        console.error('Failed to start server:', err.message);
      }
    });
  }

  tryListen();
}

bootstrap();
