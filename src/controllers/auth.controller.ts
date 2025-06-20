import { 
  Controller, 
  Post, 
  Body, 
  Get, 
  UseGuards, 
  Request, 
  HttpCode, 
  HttpStatus,
  Res,
  UnauthorizedException 
} from '@nestjs/common';
import { Response } from 'express';
import { AuthService } from '../services/auth.service';
import { AuthGuard } from '../guards/auth.guard';
import { LoginDto } from '../models/user.model';
import { RequestWithUser } from '../interfaces/request.interface';

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Post('login')
  @HttpCode(HttpStatus.OK)
  async login(
    @Body() loginDto: LoginDto, 
    @Request() req: RequestWithUser,
    @Res({ passthrough: true }) res: Response
  ) {
    const ip = req.ip || (req as any).connection?.remoteAddress;
    const userAgent = req.headers['user-agent'];
    
    const result = await this.authService.login(loginDto, ip, userAgent);

    if (result.token) {
      res.cookie('auth_token', result.token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 8 * 60 * 60 * 1000,
      });
    }

    if (result.refreshToken) {
      res.cookie('refresh_token', result.refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 7 * 24 * 60 * 60 * 1000,
      });
    }

    const { refreshToken, ...response } = result;
    
    return response;
  }

  @Post('logout')
  @UseGuards(AuthGuard)
  @HttpCode(HttpStatus.OK)
  async logout(
    @Request() req: RequestWithUser,
    @Res({ passthrough: true }) res: Response
  ) {
    const token = this.extractTokenFromHeader(req);
    const ip = req.ip || (req as any).connection?.remoteAddress;
    
    if (!token) {
      throw new UnauthorizedException('Token não encontrado');
    }

    const result = await this.authService.logout(token, ip);

    res.clearCookie('auth_token');
    res.clearCookie('refresh_token');
    
    return result;
  }

  @Get('validate')
  @UseGuards(AuthGuard)
  async validate(@Request() req: RequestWithUser) {
    const token = this.extractTokenFromHeader(req);
    
    if (!token) {
      throw new UnauthorizedException('Token não encontrado');
    }

    return await this.authService.validateToken(token);
  }

  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  async refresh(
    @Body('refreshToken') refreshToken: string,
    @Request() req: RequestWithUser,
    @Res({ passthrough: true }) res: Response
  ) {
    if (!refreshToken) {
      refreshToken = (req as any).cookies?.refresh_token;
    }

    if (!refreshToken) {
      throw new UnauthorizedException('Refresh token não fornecido');
    }

    const result = await this.authService.refreshToken(refreshToken);

    if (result.token) {
      res.cookie('auth_token', result.token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 8 * 60 * 60 * 1000,
      });
    }

    return result;
  }

  @Get('profile')
  @UseGuards(AuthGuard)
  async getProfile(@Request() req: RequestWithUser) {
    return {
      success: true,
      user: req.user,
    };
  }

  @Get('status')
  async getStatus() {
    return {
      success: true,
      message: 'Servidor de autenticação funcionando',
      timestamp: new Date().toISOString(),
    };
  }

  private extractTokenFromHeader(request: RequestWithUser): string | undefined {
    const authHeader = request.headers.authorization;
    if (!authHeader) return undefined;
    
    const [type, token] = authHeader.split(' ');
    return type === 'Bearer' ? token : undefined;
  }
}