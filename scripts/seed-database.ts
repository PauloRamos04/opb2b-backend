import 'dotenv/config';
import { MongoClient } from 'mongodb';
import bcrypt from 'bcryptjs';

async function seedDatabase() {
  console.log('🌱 Iniciando seed do banco de dados...');
  console.log('👥 Criando APENAS usuários (chamados vêm do Google Sheets)');
  console.log('🌍 TODOS os usuários terão acesso a TODAS as carteiras');

  const uri = process.env.MONGODB_URL;
  const dbName = process.env.MONGODB_DB || 'operacoes_b2b';

  if (!uri) {
    console.error('❌ MONGODB_URL não encontrada no .env');
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
        console.error('Stack:', error.stack);
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