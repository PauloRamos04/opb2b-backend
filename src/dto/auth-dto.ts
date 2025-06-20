import { IsEmail, IsString, IsNotEmpty, MinLength } from 'class-validator';

export class LoginDto {
  @IsEmail({}, { message: 'Email deve ter um formato válido' })
  @IsNotEmpty({ message: 'Email é obrigatório' })
  email: string;

  @IsString({ message: 'Password deve ser uma string' })
  @IsNotEmpty({ message: 'Password é obrigatório' })
  @MinLength(6, { message: 'Password deve ter pelo menos 6 caracteres' })
  password: string;
}