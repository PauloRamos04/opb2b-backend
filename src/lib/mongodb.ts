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
      throw new Error('MONGODB_URI não está definida no arquivo .env');
    }

    const clientOptions: any = {
      maxPoolSize: 10,
      serverSelectionTimeoutMS: 30000,
      socketTimeoutMS: 45000,
      connectTimeoutMS: 30000,
      maxIdleTimeMS: 30000,
      retryWrites: true,
    };

    // Configurações específicas para produção
    if (isProduction) {
      console.log('🔧 Aplicando configurações de produção...');
      clientOptions.tls = true;
      clientOptions.tlsAllowInvalidCertificates = true; // Mais permissivo em produção
      clientOptions.tlsAllowInvalidHostnames = true;
      clientOptions.tlsInsecure = true;
    }

    try {
      console.log('⏳ Conectando...');
      
      this.client = new MongoClient(uri, clientOptions);
      
      await this.client.connect();
      this.db = this.client.db(dbName);
      
      await this.db.admin().ping();
      console.log('🍃 MongoDB conectado com sucesso!');
      
      await this.createIndexes();
    } catch (error) {
      console.error('❌ Erro ao conectar MongoDB:', error.message);
      
      // Retry com configurações ainda mais permissivas
      if (isProduction && !error.message.includes('authentication')) {
        console.log('🔄 Tentando novamente com configurações mais permissivas...');
        try {
          const fallbackOptions = {
            serverSelectionTimeoutMS: 60000,
            socketTimeoutMS: 60000,
            connectTimeoutMS: 60000,
            tls: false,
            directConnection: false,
            retryWrites: true,
            maxPoolSize: 5
          };
          
          this.client = new MongoClient(uri, fallbackOptions);
          await this.client.connect();
          this.db = this.client.db(dbName);
          await this.db.admin().ping();
          console.log('🍃 MongoDB conectado com configurações fallback!');
          await this.createIndexes();
          return;
        } catch (fallbackError) {
          console.error('❌ Erro mesmo com fallback:', fallbackError.message);
        }
      }
      
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