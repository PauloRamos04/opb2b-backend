import 'dotenv/config';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { MongoDBConnection } from './database/mongodb';

// Função para executar o seed
async function runSeed() {
  console.log('🌱 Iniciando seed do banco de dados...');
  console.log('👥 Criando APENAS usuários (chamados vêm do Google Sheets)');
  console.log('🌍 TODOS os usuários terão acesso a TODAS as carteiras');

  const bcrypt = require('bcryptjs');
  
  try {
    const db = MongoDBConnection.getDatabase();
    const usersCollection = db.collection('users');

    // Verificar se já existem usuários
    const userCount = await usersCollection.countDocuments();
    console.log(`📊 Usuários existentes no banco: ${userCount}`);

    // Lista completa de todas as carteiras
    const todasCarteiras = [
      'ALEGRA', 'CABOTELECOM', 'CORTEZ', 'CONEXÃO', 'DIRETA', 'IP3',
      'MEGA', 'MULTIPLAY', 'NETVGA', 'NOWTECH', 'OUTCENTER',
      'RESENDENET', 'SAPUCAINET', 'STARWEB', 'TECNET', 'WAYNET',
      'WEBNET', 'WEBBY', 'AZZA', 'LIVRE'
    ];

    const users = [
      {
        nome: 'Dione',
        email: 'dione@b2b.com',
        password: '123456',
        operador: 'B2B | Dione',
        role: 'admin',
        carteiras: todasCarteiras,
      },
      {
        nome: 'Gustavo',
        email: 'gustavo@b2b.com',
        password: '123456',
        operador: 'B2B | Gustavo',
        role: 'admin',
        carteiras: todasCarteiras,
      },
      {
        nome: 'Jessica',
        email: 'jessica@b2b.com',
        password: '123456',
        operador: 'B2B | Jessica',
        role: 'admin',
        carteiras: todasCarteiras,
      },
      {
        nome: 'Leonardo',
        email: 'leonardo@b2b.com',
        password: '123456',
        operador: 'B2B | Leonardo',
        role: 'admin',
        carteiras: todasCarteiras,
      },
      {
        nome: 'Matheus',
        email: 'matheus@b2b.com',
        password: '123456',
        operador: 'B2B | Matheus',
        role: 'admin',
        carteiras: todasCarteiras,
      },
      {
        nome: 'Paulo F',
        email: 'paulo@b2b.com',
        password: '123456',
        operador: 'B2B | Paulo F',
        role: 'admin',
        carteiras: todasCarteiras,
      },
      {
        nome: 'Nickolas',
        email: 'nickolas@b2b.com',
        password: '123456',
        operador: 'B2B | Nickolas',
        role: 'admin',
        carteiras: todasCarteiras,
      },
    ];

    console.log(`📝 Tentando criar ${users.length} usuários...`);
    console.log(`💼 Cada usuário terá acesso a ${todasCarteiras.length} carteiras`);

    let criados = 0;
    let existentes = 0;
    let erros = 0;

    for (const userData of users) {
      try {
        console.log(`\n🔄 Processando usuário: ${userData.nome}`);

        // Verificar se já existe
        const existingUser = await usersCollection.findOne({ 
          email: userData.email 
        });
        
        if (existingUser) {
          console.log(`⚠️  ${userData.nome} já existe (ID: ${existingUser._id})`);
          existentes++;
          continue;
        }

        // Hash da senha
        const hashedPassword = await bcrypt.hash(userData.password, 12);
        
        // Criar usuário
        const novoUsuario = {
          ...userData,
          password: hashedPassword,
          dataCriacao: new Date(),
          ativo: true,
        };

        const result = await usersCollection.insertOne(novoUsuario);
        console.log(`✅ ${userData.nome} (${userData.role}) criado com ID: ${result.insertedId}`);
        criados++;

      } catch (error) {
        console.error(`❌ Erro ao criar ${userData.nome}:`, error.message);
        erros++;
      }
    }

    console.log('\n🎉 Seed de usuários concluído!');
    console.log(`📊 Resumo:`);
    console.log(`   ✅ Criados: ${criados}`);
    console.log(`   ⚠️  Já existiam: ${existentes}`);
    console.log(`   ❌ Erros: ${erros}`);
    console.log(`   📈 Total no banco agora: ${userCount + criados}`);

    if (criados > 0) {
      console.log('\n👑 Usuários criados para login:');
      users.forEach(user => {
        console.log(`   🔑 ${user.role}: ${user.email} / ${user.password}`);
      });
    }
    
  } catch (error) {
    console.error('❌ Erro durante o seed:', error);
    throw error;
  }
}

async function bootstrap() {
  console.log('🚀 Iniciando aplicação...');
  
  try {
    console.log('🔗 Conectando ao MongoDB...');
    await MongoDBConnection.connect();
    console.log('✅ MongoDB conectado com sucesso!');
    
    // Executar seed após conexão bem-sucedida
    await runSeed();
    
  } catch (error) {
    console.error('❌ Erro ao conectar MongoDB:', error);
    process.exit(1);
  }

  const app = await NestFactory.create(AppModule);
  
  app.setGlobalPrefix('api');
  
  app.enableCors({
    origin: [
      'http://localhost:3000',
      'https://opb2b-frontend.vercel.app'
    ],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
    allowedHeaders: [
      'Content-Type', 
      'Authorization', 
      'X-Requested-With',
      'Accept',
      'Origin'
    ],
    exposedHeaders: ['Set-Cookie'],
    optionsSuccessStatus: 200
  });

  app.useGlobalPipes(new ValidationPipe({
    transform: true,
    whitelist: true,
    forbidNonWhitelisted: false,
  }));

  const port = process.env.PORT || 3001;
  await app.listen(port, '0.0.0.0');
  console.log(`🚀 Application is running on port ${port}`);
  console.log(`📡 API available at: http://localhost:${port}/api`);
  console.log(`📡 CORS enabled for: http://localhost:3000`);
  console.log(`🍃 MongoDB: ${process.env.MONGO_URL ? 'Conectado' : 'Não configurado'}`);

  // Graceful shutdown
  process.on('SIGINT', async () => {
    console.log('🛑 Recebido SIGINT, desconectando...');
    await MongoDBConnection.disconnect();
    process.exit(0);
  });

  process.on('SIGTERM', async () => {
    console.log('🛑 Recebido SIGTERM, desconectando...');
    await MongoDBConnection.disconnect();
    process.exit(0);
  });
}

bootstrap().catch(error => {
  console.error('💥 Erro fatal na inicialização:', error);
  process.exit(1);
});