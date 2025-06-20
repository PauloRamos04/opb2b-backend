export interface AuthenticatedUser {
  userId: string;
  email: string;
  operador: string;
  role: 'admin' | 'operador' | 'viewer';
}

export interface JwtPayload {
  userId: string;
  email: string;
  operador: string;
  role: string;
  iat?: number;
  exp?: number;
}