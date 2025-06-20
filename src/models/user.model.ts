import { ObjectId } from 'mongodb';
import { IsEmail, IsString, IsNotEmpty, MinLength } from 'class-validator';

export interface IUser {
  _id?: ObjectId;
  nome: string;
  email: string;
  password: string;
  operador: string;
  role: 'admin' | 'operador' | 'viewer';
  carteiras: string[];
  ativo: boolean;
  dataCriacao: Date;
  dataUltimoLogin?: Date;
  tokenRefresh?: string;
  configuracoes?: {
    tema: 'light' | 'dark';
    notificacoes: boolean;
    filtrosPadrao?: any;
  };
}

export interface IUserSession {
  _id?: ObjectId;
  userId: ObjectId;
  token: string;
  refreshToken: string;
  expiresAt: Date;
  userAgent?: string;
  ip?: string;
  ativo: boolean;
  dataCriacao: Date;
}

export interface IUserActivity {
  _id?: ObjectId;
  userId: ObjectId;
  acao: string;
  detalhes?: any;
  timestamp: Date;
  ip?: string;
  userAgent?: string;
}

export class CreateUserDto {
  @IsString()
  @IsNotEmpty()
  nome: string;

  @IsEmail()
  @IsNotEmpty()
  email: string;

  @IsString()
  @MinLength(6)
  password: string;

  @IsString()
  @IsNotEmpty()
  operador: string;

  @IsString()
  role: 'admin' | 'operador' | 'viewer';

  carteiras: string[];
}

export class LoginDto {
  @IsEmail({}, { message: 'Email deve ser válido' })
  @IsNotEmpty({ message: 'Email é obrigatório' })
  email: string;

  @IsString({ message: 'Password deve ser string' })
  @IsNotEmpty({ message: 'Password é obrigatório' })
  @MinLength(6, { message: 'Password deve ter pelo menos 6 caracteres' })
  password: string;
}