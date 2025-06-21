import { MongoClient, Db } from 'mongodb';

export class MongoDBConnection {
  private static client: MongoClient;
  private static db: Db;

  static async connect(): Promise<void> {
    const uri = process.env.MONGODB_URI;
    const dbName = process.env.MONGODB_DB || 'operacoes_b2b';
    const isProduction = process.env.NODE_ENV === 'production';

    console.log('🔗 Tentando conectar ao MongoDB...');
    console.log('🔍 Database:', dbName);
    console.log('🌍 Environment:', isProduction ? 'PRODUCTION' : 'DEVELOPMENT');

    if (!uri) {
      throw new Error('MONGODB_URI não definida nas variáveis de ambiente');
    }

    try {
      console.log('⏳ Conectando ao MongoDB...');
      
      this.client = new MongoClient(uri, {
        serverSelectionTimeoutMS: isProduction ? 10000 : 5000,
        socketTimeoutMS: 30000,
        connectTimeoutMS: 10000,
      });
      
      await this.client.connect();
      this.db = this.client.db(dbName);
      
      await this.db.admin().ping();
      console.log('🍃 MongoDB conectado com sucesso!');
      
      await this.createIndexes();
    } catch (error) {
      console.error('❌ Erro ao conectar MongoDB:', error.message);
      throw error;
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
      
      console.log('✅ Índices criados com sucesso');
    } catch (error) {
      console.warn('⚠️ Alguns índices podem já existir:', error.message);
    }
  }
}