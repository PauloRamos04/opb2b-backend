import 'dotenv/config';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { MongoDBConnection } from './lib/mongodb';

async function bootstrap() {
  console.log('🚀 Iniciando aplicação...');
  
  try {
    console.log('🔗 Conectando ao MongoDB...');
    await MongoDBConnection.connect();
    console.log('✅ MongoDB conectado com sucesso!');
  } catch (error) {
    console.error('❌ Erro ao conectar MongoDB:', error);
    process.exit(1);
  }

  const app = await NestFactory.create(AppModule);
  
  app.setGlobalPrefix('api');
  
  app.enableCors({
    origin: [
      'http://localhost:3000',
      'https://opb2b-frontend.vercel.app'
    ],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
    allowedHeaders: [
      'Content-Type', 
      'Authorization', 
      'X-Requested-With',
      'Accept',
      'Origin'
    ],
    exposedHeaders: ['Set-Cookie'],
    optionsSuccessStatus: 200
  });

  app.useGlobalPipes(new ValidationPipe({
    transform: true,
    whitelist: true,
    forbidNonWhitelisted: false,
  }));

  const port = process.env.PORT || 3001;
  await app.listen(port, '0.0.0.0');
  console.log(`🚀 Application is running on port ${port}`);
  console.log(`📡 API available at: http://localhost:${port}/api`);
  console.log(`📡 CORS enabled for: http://localhost:3000`);
  console.log(`🍃 MongoDB: ${process.env.MONGODB_URI ? 'Conectado' : 'Não configurado'}`);

  // Graceful shutdown
  process.on('SIGINT', async () => {
    console.log('🛑 Recebido SIGINT, desconectando...');
    await MongoDBConnection.disconnect();
    process.exit(0);
  });

  process.on('SIGTERM', async () => {
    console.log('🛑 Recebido SIGTERM, desconectando...');
    await MongoDBConnection.disconnect();
    process.exit(0);
  });
}

bootstrap().catch(error => {
  console.error('💥 Erro fatal na inicialização:', error);
  process.exit(1);
});