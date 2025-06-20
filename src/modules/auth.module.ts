import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { AuthService } from '../services/auth.service';
import { UserRepository } from '../repositories/user.repository';
import { AuthController } from '../controllers/auth.controller';
import { AuthGuard } from '../guards/auth.guard';

@Module({
  imports: [
    PassportModule,
    JwtModule.register({
      secret: process.env.JWT_SECRET || 'your-secret-key-here',
      signOptions: { expiresIn: '8h' },
    }),
  ],
  controllers: [AuthController],
  providers: [AuthService, UserRepository, AuthGuard],
  exports: [AuthService, UserRepository, AuthGuard],
})
export class AuthModule {}