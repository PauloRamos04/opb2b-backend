import { Request } from 'express';

export interface RequestWithUser extends Request {
  user?: {
    id: string;
    nome: string;
    email: string;
    operador: string;
    role: string;
    carteiras: string[];
  };
}