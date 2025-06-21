import { Injectable } from '@nestjs/common';
import { ObjectId, Collection } from 'mongodb';
import { MongoDBConnection } from '../database/mongodb';
import { IUser, IUserSession, IUserActivity, CreateUserDto } from '../models/user.model';
import * as bcrypt from 'bcryptjs';

@Injectable()
export class UserRepository {
  private getUsersCollection(): any {
    try {
      const db = MongoDBConnection.getDatabase();
      return db.collection('users');
    } catch (error) {
      console.error('❌ Erro ao obter collection users:', error.message);
      throw new Error('Database não conectado ao tentar acessar users collection');
    }
  }

  private getSessionsCollection(): any {
    try {
      const db = MongoDBConnection.getDatabase();
      return db.collection('user_sessions');
    } catch (error) {
      console.error('❌ Erro ao obter collection sessions:', error.message);
      throw new Error('Database não conectado ao tentar acessar sessions collection');
    }
  }

  private getActivitiesCollection(): any {
    try {
      const db = MongoDBConnection.getDatabase();
      return db.collection('user_activities');
    } catch (error) {
      console.error('❌ Erro ao obter collection activities:', error.message);
      throw new Error('Database não conectado ao tentar acessar activities collection');
    }
  }

  async createUser(userData: CreateUserDto): Promise<IUser> {
    try {
      console.log(`🔄 Tentando criar usuário: ${userData.nome} (${userData.email})`);
      
      const collection = this.getUsersCollection();
      
      const hashedPassword = await bcrypt.hash(userData.password, 12);
      console.log(`🔐 Senha hashada para ${userData.nome}`);
      
      const user: Omit<IUser, '_id'> = {
        ...userData,
        password: hashedPassword,
        dataCriacao: new Date(),
        ativo: true,
      };

      console.log(`💾 Inserindo usuário ${userData.nome}...`);
      const result = await collection.insertOne(user);
      console.log(`✅ Usuário ${userData.nome} inserido com ID: ${result.insertedId}`);
      
      return { ...user, _id: result.insertedId };
    } catch (error) {
      console.error(`❌ Erro detalhado ao criar usuário ${userData.nome}:`, error);
      throw error;
    }
  }

  async findByEmail(email: string): Promise<IUser | null> {
    try {
      const collection = this.getUsersCollection();
      const user = await collection.findOne({ email, ativo: true });
      
      return user;
    } catch (error) {
      console.error('❌ Erro ao buscar usuário por email:', error.message);
      throw error;
    }
  }

  async findById(id: string | ObjectId): Promise<IUser | null> {
    try {
      const collection = this.getUsersCollection();
      const objectId = typeof id === 'string' ? new ObjectId(id) : id;
      return await collection.findOne({ _id: objectId, ativo: true });
    } catch (error) {
      console.error('❌ Erro ao buscar usuário por ID:', error.message);
      throw error;
    }
  }

  async validatePassword(plainPassword: string, hashedPassword: string): Promise<boolean> {
    return await bcrypt.compare(plainPassword, hashedPassword);
  }

  async updateLastLogin(userId: ObjectId): Promise<void> {
    try {
      const collection = this.getUsersCollection();
      await collection.updateOne(
        { _id: userId },
        { $set: { dataUltimoLogin: new Date() } }
      );
    } catch (error) {
      console.error('❌ Erro ao atualizar último login:', error.message);
      throw error;
    }
  }

  async createSession(sessionData: Omit<IUserSession, '_id' | 'dataCriacao'>): Promise<IUserSession> {
    try {
      const collection = this.getSessionsCollection();
      
      const session: Omit<IUserSession, '_id'> = {
        ...sessionData,
        dataCriacao: new Date(),
        ativo: true,
      };

      const result = await collection.insertOne(session);
      return { ...session, _id: result.insertedId };
    } catch (error) {
      console.error('❌ Erro ao criar sessão:', error.message);
      throw error;
    }
  }

  async findSessionByToken(token: string): Promise<IUserSession | null> {
    try {
      const collection = this.getSessionsCollection();
      return await collection.findOne({ 
        token, 
        ativo: true,
        expiresAt: { $gt: new Date() }
      });
    } catch (error) {
      console.error('❌ Erro ao buscar sessão por token:', error.message);
      throw error;
    }
  }

  async invalidateSession(token: string): Promise<void> {
    try {
      const collection = this.getSessionsCollection();
      await collection.updateOne(
        { token },
        { $set: { ativo: false } }
      );
    } catch (error) {
      console.error('❌ Erro ao invalidar sessão:', error.message);
      throw error;
    }
  }

  async logActivity(activityData: Omit<IUserActivity, '_id' | 'timestamp'>): Promise<void> {
    try {
      const collection = this.getActivitiesCollection();
      
      const activity: Omit<IUserActivity, '_id'> = {
        ...activityData,
        timestamp: new Date(),
      };

      await collection.insertOne(activity);
    } catch (error) {
      console.error('❌ Erro ao registrar atividade:', error.message);
    }
  }

  async findSessionByRefreshToken(refreshToken: string): Promise<IUserSession | null> {
    try {
      const collection = this.getSessionsCollection();
      return await collection.findOne({ 
        refreshToken, 
        ativo: true,
        refreshExpiresAt: { $gt: new Date() }
      });
    } catch (error) {
      console.error('❌ Erro ao buscar sessão por refresh token:', error.message);
      throw error;
    }
  }

  async updateSessionToken(sessionId: ObjectId, newToken: string, newExpiresAt: Date): Promise<void> {
    try {
      const collection = this.getSessionsCollection();
      await collection.updateOne(
        { _id: sessionId },
        { 
          $set: { 
            token: newToken,
            expiresAt: newExpiresAt,
            dataUltimaAtualizacao: new Date()
          } 
        }
      );
    } catch (error) {
      console.error('❌ Erro ao atualizar token da sessão:', error.message);
      throw error;
    }
  }
}