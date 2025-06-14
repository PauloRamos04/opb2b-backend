import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import * as dotenv from 'dotenv';

// Carregar .env
dotenv.config();

async function bootstrap() {
  // Debug das variáveis de ambiente
  console.log('🔍 Debug das variáveis de ambiente:');
  console.log('NODE_ENV:', process.env.NODE_ENV);
  console.log('GOOGLE_SPREADSHEET_ID:', process.env.GOOGLE_SPREADSHEET_ID);
  console.log('GOOGLE_SHEET_NAME:', process.env.GOOGLE_SHEET_NAME);
  console.log('GOOGLE_SERVICE_ACCOUNT_EMAIL:', process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL);
  console.log('GOOGLE_PRIVATE_KEY existe:', !!process.env.GOOGLE_PRIVATE_KEY);
  console.log('PORT:', process.env.PORT);
  
  const app = await NestFactory.create(AppModule);
  
  app.enableCors({
    origin: 'http://localhost:3000',
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  });

  const port = process.env.PORT || 3001;
  await app.listen(port);
  console.log(`🚀 Backend running on http://localhost:${port}`);
  console.log('✅ CORS enabled for http://localhost:3000');
}

bootstrap();