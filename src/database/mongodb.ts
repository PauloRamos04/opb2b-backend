import { MongoClient, Db } from 'mongodb';

export class MongoDBConnection {
  private static client: MongoClient;
  private static db: Db;

  static async connect(): Promise<void> {
    const uri = process.env.MONGODB_URL || process.env.MONGO_URL;
    const dbName = process.env.MONGODB_DB || 'operacoes_b2b';

    console.log('🔗 Conectando ao MongoDB...');

    if (!uri) {
      throw new Error('MONGODB_URL ou MONGO_URL não está definida nas variáveis de ambiente');
    }

    try {
      this.client = new MongoClient(uri);
      await this.client.connect();
      this.db = this.client.db(dbName);
      
      await this.db.admin().ping();
      console.log('🍃 MongoDB conectado com sucesso!');
      
      await this.createIndexes();
    } catch (error) {
      console.error('❌ Erro ao conectar MongoDB:', error.message);
      throw new Error(`Falha na conexão: ${error.message}`);
    }
  }

  static getDatabase(): Db {
    if (!this.db) {
      throw new Error('Database não conectado. Execute connect() primeiro.');
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
    
    try {
      console.log('📊 Criando índices...');
      
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
      
      console.log('✅ Índices criados com sucesso');
    } catch (error) {
      console.warn('⚠️ Alguns índices podem já existir:', error.message);
    }
  }
}