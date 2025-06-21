import 'dotenv/config';
import { MongoClient } from 'mongodb';
import * as bcrypt from 'bcryptjs';

async function seedDatabase() {
  console.log('🌱 Iniciando seed do banco de dados...');
  console.log('👥 Criando APENAS usuários (chamados vêm do Google Sheets)');
  console.log('🌍 TODOS os usuários terão acesso a TODAS as carteiras');

  // Verificar variáveis de ambiente disponíveis
  console.log('🔍 Variáveis de ambiente MongoDB disponíveis:');
  Object.keys(process.env).forEach(key => {
    if (key.toLowerCase().includes('mongo') || key.toLowerCase().includes('database')) {
      console.log(`   ${key}: ${process.env[key]?.substring(0, 30)}...`);
    }
  });

  // Tentar diferentes variáveis de ambiente
  let uri = process.env.MONGODB_URL || 
            process.env.DATABASE_URL || 
            process.env.MONGODB_URI ||
            process.env.MONGO_URL;

  const dbName = process.env.MONGODB_DB || 
                 process.env.DATABASE_NAME || 
                 'operacoes_b2b';

  console.log(`🔗 URI selecionada: ${uri?.substring(0, 50)}...`);
  console.log(`📁 Database: ${dbName}`);

  if (!uri) {
    console.error('❌ Nenhuma URL do MongoDB encontrada nas variáveis de ambiente');
    console.error('Variáveis procuradas: MONGODB_URL, DATABASE_URL, MONGODB_URI, MONGO_URL');
    process.exit(1);
  }

  const client = new MongoClient(uri);

  try {
    // Conectar ao MongoDB
    console.log('🔗 Conectando ao MongoDB...');
    await client.connect();
    console.log('✅ MongoDB conectado para seed');

    const db = client.db(dbName);
    const usersCollection = db.collection('users');

    // Testar conexão
    await db.admin().ping();
    console.log('✅ Teste de ping no MongoDB OK');

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
          email: userData.email, 
          ativo: true 
        });
        
        if (existingUser) {
          console.log(`⚠️  ${userData.nome} já existe`);
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

    if (criados > 0) {
      console.log('\n👑 Usuários criados para login:');
      console.log('   🔑 Admin: dione@b2b.com / 123456');
      console.log('   🔑 Admin: gustavo@b2b.com / 123456');
      console.log('   🔑 Admin: jessica@b2b.com / 123456');
      console.log('   🔑 Admin: leonardo@b2b.com / 123456');
      console.log('   🔑 Admin: matheus@b2b.com / 123456');
      console.log('   🔑 Admin: paulo@b2b.com / 123456');
      console.log('   🔑 Admin: nickolas@b2b.com / 123456');
    }

  } catch (error) {
    console.error('❌ Erro no seed:', error);
    console.error('Stack completo:', error.stack);
  } finally {
    await client.close();
    console.log('🔌 MongoDB desconectado');
    process.exit(0);
  }
}

seedDatabase();