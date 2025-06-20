import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UserRepository } from '../repositories/user.repository';
import { LoginDto } from '../dto/auth-dto';
import { ObjectId } from 'mongodb';

@Injectable()
export class AuthService {
  constructor(
    private userRepository: UserRepository,
    private jwtService: JwtService,
  ) {}

  async login(loginDto: LoginDto, ip?: string, userAgent?: string) {
    const { email, password } = loginDto;

    const user = await this.userRepository.findByEmail(email);
    
    if (!user || !await this.userRepository.validatePassword(password, user.password)) {
      if (user?._id) {
        await this.userRepository.logActivity({
          userId: user._id,
          acao: 'login_falhou',
          detalhes: { email, ip },
        });
      }

      throw new UnauthorizedException('Credenciais inválidas');
    }

    if (!user.ativo) {
      throw new UnauthorizedException('Usuário desativado');
    }

    const tokenPayload = {
      userId: user._id,
      email: user.email,
      operador: user.operador,
      role: user.role,
    };

    const token = this.jwtService.sign(tokenPayload, { expiresIn: '8h' });
    const refreshToken = this.jwtService.sign(
      { userId: user._id }, 
      { secret: process.env.JWT_REFRESH_SECRET, expiresIn: '7d' }
    );

    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 8);

    await this.userRepository.createSession({
      userId: user._id!,
      token,
      refreshToken,
      expiresAt,
      userAgent: userAgent || '',
      ip: ip || '',
      ativo: true,
    });

    await this.userRepository.updateLastLogin(user._id!);
    
    await this.userRepository.logActivity({
      userId: user._id!,
      acao: 'login_sucesso',
      detalhes: { ip },
    });

    return {
      success: true,
      user: {
        id: user._id,
        nome: user.nome,
        email: user.email,
        operador: user.operador,
        role: user.role,
        carteiras: user.carteiras,
      },
      token,
      refreshToken,
    };
  }

  async logout(token: string, ip?: string) {
    await this.userRepository.invalidateSession(token);
    
    const session = await this.userRepository.findSessionByToken(token);
    if (session) {
      await this.userRepository.logActivity({
        userId: session.userId,
        acao: 'logout',
        detalhes: { ip },
      });
    }

    return { success: true, message: 'Logout realizado com sucesso' };
  }

  async validateToken(token: string) {
    try {
      const decoded = this.jwtService.verify(token);
      
      const session = await this.userRepository.findSessionByToken(token);
      if (!session || !session.ativo) {
        throw new UnauthorizedException('Sessão inválida ou expirada');
      }

      const user = await this.userRepository.findById(decoded.userId);
      if (!user || !user.ativo) {
        throw new UnauthorizedException('Usuário não encontrado ou inativo');
      }

      return {
        success: true,
        user: {
          id: user._id,
          nome: user.nome,
          email: user.email,
          operador: user.operador,
          role: user.role,
          carteiras: user.carteiras,
        },
      };
    } catch (error) {
      throw new UnauthorizedException('Token inválido');
    }
  }

  async refreshToken(refreshToken: string) {
    try {
      const decoded = this.jwtService.verify(refreshToken, {
        secret: process.env.JWT_REFRESH_SECRET,
      });

      const session = await this.userRepository.findSessionByRefreshToken(refreshToken);
      if (!session || !session.ativo) {
        throw new UnauthorizedException('Refresh token inválido');
      }

      const user = await this.userRepository.findById(decoded.userId);
      if (!user || !user.ativo) {
        throw new UnauthorizedException('Usuário não encontrado');
      }

      const newTokenPayload = {
        userId: user._id,
        email: user.email,
        operador: user.operador,
        role: user.role,
      };

      const newToken = this.jwtService.sign(newTokenPayload, { expiresIn: '8h' });
      const newExpiresAt = new Date();
      newExpiresAt.setHours(newExpiresAt.getHours() + 8);

      await this.userRepository.updateSessionToken(session._id!, newToken, newExpiresAt);

      return {
        success: true,
        token: newToken,
        user: {
          id: user._id,
          nome: user.nome,
          email: user.email,
          operador: user.operador,
          role: user.role,
          carteiras: user.carteiras,
        },
      };
    } catch (error) {
      throw new UnauthorizedException('Refresh token inválido');
    }
  }
}