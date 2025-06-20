import { MongoClient, Db } from 'mongodb';

export class MongoDBConfig {
  private static client: MongoClient;
  private static db: Db;

  static async connect(): Promise<void> {
    if (!process.env.MONGODB_URI) {
      throw new Error('MONGODB_URI não está definida');
    }

    try {
      this.client = new MongoClient(process.env.MONGODB_URI);
      await this.client.connect();
      this.db = this.client.db(process.env.MONGODB_DB || 'operacoes_b2b');
      
      console.log('🍃 MongoDB conectado com sucesso');
      
      await this.createIndexes();
    } catch (error) {
      console.error('❌ Erro ao conectar MongoDB:', error);
      throw error;
    }
  }

  static getDatabase(): Db {
    if (!this.db) {
      throw new Error('Database não conectado');
    }
    return this.db;
  }

  static async disconnect(): Promise<void> {
    if (this.client) {
      await this.client.close();
      console.log('🔌 MongoDB desconectado');
    }
  }

  private static async createIndexes(): Promise<void> {
    const db = this.getDatabase();
    
    await db.collection('users').createIndex({ email: 1 }, { unique: true });
    await db.collection('users').createIndex({ operador: 1 });
    await db.collection('chamados').createIndex({ linha: 1 }, { unique: true });
    await db.collection('chamados').createIndex({ operador: 1 });
    await db.collection('chamados').createIndex({ status: 1 });
    await db.collection('chamados').createIndex({ dataAbertura: -1 });
    await db.collection('user_sessions').createIndex({ token: 1 });
    await db.collection('user_sessions').createIndex({ expiresAt: 1 }, { expireAfterSeconds: 0 });
    await db.collection('user_activities').createIndex({ userId: 1, timestamp: -1 });
    await db.collection('chamados_historico').createIndex({ linha: 1, timestamp: -1 });
    
    console.log('📊 Índices criados com sucesso');
  }
}