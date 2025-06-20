import { Injectable, CanActivate, ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UserRepository } from '../repositories/user.repository';

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(
    private jwtService: JwtService,
    private userRepository: UserRepository,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const token = this.extractTokenFromHeader(request);

    if (!token) {
      throw new UnauthorizedException('Token não fornecido');
    }

    try {
      const payload = this.jwtService.verify(token);
      
      const session = await this.userRepository.findSessionByToken(token);
      if (!session || !session.ativo) {
        throw new UnauthorizedException('Sessão inválida ou expirada');
      }

      const user = await this.userRepository.findById(payload.userId);
      if (!user || !user.ativo) {
        throw new UnauthorizedException('Usuário não encontrado ou inativo');
      }

      request.user = {
        id: user._id?.toString(),
        nome: user.nome,
        email: user.email,
        operador: user.operador,
        role: user.role,
        carteiras: user.carteiras,
      };

      return true;
    } catch (error) {
      throw new UnauthorizedException('Token inválido');
    }
  }

  private extractTokenFromHeader(request: any): string | undefined {
    const authHeader = request.headers.authorization;
    if (!authHeader) return undefined;
    
    const [type, token] = authHeader.split(' ');
    return type === 'Bearer' ? token : undefined;
  }
}