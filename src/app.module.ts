import { Module, ValidationPipe } from '@nestjs/common';
import { APP_PIPE } from '@nestjs/core';
import { JwtModule } from '@nestjs/jwt';
import { GoogleSheetsService } from './services/google-sheets.service';
import { AuthService } from './services/auth.service';
import { UserRepository } from './repositories/user.repository';
import { SpreadsheetController } from './app.controller';
import { AppService } from './app.service';

@Module({
  imports: [
    JwtModule.register({
      secret: process.env.JWT_SECRET || 'your-secret-key',
      signOptions: { expiresIn: '8h' },
    }),
  ],
  controllers: [SpreadsheetController],
  providers: [
    AppService,
    GoogleSheetsService,
    AuthService,
    UserRepository,
    {
      provide: APP_PIPE,
      useClass: ValidationPipe,
    },
  ],
})
export class AppModule {}