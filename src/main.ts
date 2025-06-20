import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import * as dotenv from 'dotenv';
import * as cookieParser from 'cookie-parser';
import { MongoDBConnection } from './lib/mongodb'; // <== ajuste o path conforme necessário

dotenv.config();

async function bootstrap() {
  console.log('🔍 Debug das variáveis de ambiente:');
  console.log('NODE_ENV:', process.env.NODE_ENV);
  console.log('JWT_SECRET:', process.env.JWT_SECRET ? '✅' : '❌');
  console.log('JWT_REFRESH_SECRET:', process.env.JWT_REFRESH_SECRET ? '✅' : '❌');
  console.log('GOOGLE_SPREADSHEET_ID:', process.env.GOOGLE_SPREADSHEET_ID);
  console.log('GOOGLE_SHEET_NAME:', process.env.GOOGLE_SHEET_NAME);
  console.log('GOOGLE_SERVICE_ACCOUNT_EMAIL:', process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL);
  console.log('GOOGLE_PRIVATE_KEY existe:', !!process.env.GOOGLE_PRIVATE_KEY);
  console.log('PORT:', process.env.PORT);

  // 👉 CHAMADA OBRIGATÓRIA ANTES DE CRIAR O APP
  await MongoDBConnection.connect();

  const app = await NestFactory.create(AppModule, {
    cors: {
      origin: [
        'http://localhost:3000',
        'https://opb2b-frontend.vercel.app'
      ],
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization'],
      credentials: true,
    }
  });

  app.use(cookieParser());

  app.setGlobalPrefix('api');

  app.useGlobalPipes(new ValidationPipe({
    whitelist: true,
    forbidNonWhitelisted: true,
    transform: true,
    transformOptions: {
      enableImplicitConversion: true,
    },
  }));

  const port = process.env.PORT || 8080;
  await app.listen(port, '0.0.0.0');
  console.log(`🚀 Backend running on port ${port}`);
  console.log('✅ CORS enabled for production and development');
  console.log('🔐 Authentication system enabled');
  console.log('👥 Test users: dione@b2b.com, paulo@b2b.com (password: 123456)');
}

bootstrap();
