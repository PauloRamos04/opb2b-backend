import { MongoClient, Db } from 'mongodb';

// Fallback simples em memória
class InMemoryDB {
  private collections: Map<string, any[]> = new Map();
  
  collection(name: string) {
    if (!this.collections.has(name)) {
      this.collections.set(name, []);
    }
    
    const data = this.collections.get(name)!;
    
    return {
      async findOne(query: any) {
        const item = data.find(item => {
          if (query._id) return item._id?.toString() === query._id.toString();
          if (query.email) return item.email === query.email;
          return false;
        });
        return item || null;
      },
      
      async insertOne(doc: any) {
        const id = Date.now().toString();
        const newDoc = { ...doc, _id: id };
        data.push(newDoc);
        return { insertedId: id };
      },
      
      async updateOne(query: any, update: any) {
        const index = data.findIndex(item => {
          if (query._id) return item._id?.toString() === query._id.toString();
          if (query.email) return item.email === query.email;
          return false;
        });
        
        if (index >= 0) {
          data[index] = { ...data[index], ...update.$set };
        }
        return { modifiedCount: index >= 0 ? 1 : 0 };
      },
      
      async createIndex() {
        // No-op para índices
        return true;
      }
    };
  }
  
  admin() {
    return {
      async ping() {
        return { ok: 1 };
      }
    };
  }
}

export class MongoDBConnection {
  private static client: MongoClient;
  private static db: Db | InMemoryDB;
  private static isInMemory = false;

  static async connect(): Promise<void> {
    const uri = process.env.MONGODB_URI;
    const dbName = process.env.MONGODB_DB || 'operacoes_b2b';
    const isProduction = process.env.NODE_ENV === 'production';

    console.log('🔗 Tentando conectar ao MongoDB...');
    console.log('🔍 Database:', dbName);
    console.log('🌍 Environment:', isProduction ? 'PRODUCTION' : 'DEVELOPMENT');

    if (!uri) {
      console.warn('⚠️ MONGODB_URI não definida, usando banco em memória');
      this.db = new InMemoryDB();
      this.isInMemory = true;
      await this.seedInMemoryDB();
      return;
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
      console.log('🔄 Usando banco em memória como fallback...');
      
      this.db = new InMemoryDB();
      this.isInMemory = true;
      await this.seedInMemoryDB();
    }
  }

  static getDatabase(): Db | InMemoryDB {
    if (!this.db) {
      throw new Error('Database não conectado. Execute connect() primeiro.');
    }
    return this.db;
  }

  static isUsingInMemory(): boolean {
    return this.isInMemory;
  }

  static async disconnect(): Promise<void> {
    if (this.client && !this.isInMemory) {
      await this.client.close();
      console.log('🔌 MongoDB desconectado');
    }
  }

  private static async createIndexes(): Promise<void> {
    if (this.isInMemory) return;
    
    const db = this.getDatabase() as Db;
    
    try {
      console.log('📊 Criando índices...');
      
      await db.collection('users').createIndex({ email: 1 }, { unique: true });
      await db.collection('users').createIndex({ operador: 1 });
      
      console.log('✅ Índices criados com sucesso');
    } catch (error) {
      console.warn('⚠️ Alguns índices podem já existir:', error.message);
    }
  }

  private static async seedInMemoryDB(): Promise<void> {
    console.log('🌱 Populando banco em memória com usuários de teste...');
    
    const bcrypt = require('bcryptjs');
    const hashedPassword = await bcrypt.hash('123456', 12);
    
    const users = [
      {
        nome: 'Paulo',
        email: 'paulo@b2b.com',
        password: hashedPassword,
        operador: 'B2B | Paulo',
        role: 'admin',
        carteiras: ['MEGA', 'DIRETA', 'CORTEZ'],
        dataCriacao: new Date(),
        ativo: true
      },
      {
        nome: 'Admin',
        email: 'admin@teste.com',
        password: hashedPassword,
        operador: 'B2B | Admin',
        role: 'admin',
        carteiras: ['MEGA', 'DIRETA', 'CORTEZ'],
        dataCriacao: new Date(),
        ativo: true
      }
    ];

    const usersCollection = this.db.collection('users');
    
    for (const user of users) {
      await usersCollection.insertOne(user);
      console.log(`✅ Usuário ${user.nome} criado no banco em memória`);
    }
    
    console.log('🎉 Banco em memória pronto! Use: paulo@b2b.com / 123456');
  }
}