import { MongoDBConnection } from '../src/lib/mongodb';
import { UserRepository } from '../src/repositories/user.repository';

async function seedDatabase() {
  console.log('🌱 Iniciando seed do banco de dados...');
  console.log('👥 Criando APENAS usuários (chamados vêm do Google Sheets)');
  console.log('🌍 TODOS os usuários terão acesso a TODAS as carteiras');

  try {
    // Conectar ao MongoDB
    await MongoDBConnection.connect();
    console.log('✅ MongoDB conectado para seed');
    
    // Testar conexão
    const db = MongoDBConnection.getDatabase();
    await db.admin().ping();
    console.log('✅ Teste de ping no MongoDB OK');
    
    const userRepository = new UserRepository();
    
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
        role: 'admin' as const,
        carteiras: todasCarteiras,
      },
      {
        nome: 'Gustavo',
        email: 'gustavo@b2b.com',
        password: '123456',
        operador: 'B2B | Gustavo',
        role: 'operador' as const,
        carteiras: todasCarteiras,
      },
      {
        nome: 'Jessica',
        email: 'jessica@b2b.com',
        password: '123456',
        operador: 'B2B | Jessica',
        role: 'operador' as const,
        carteiras: todasCarteiras,
      },
      {
        nome: 'Leonardo',
        email: 'leonardo@b2b.com',
        password: '123456',
        operador: 'B2B | Leonardo',
        role: 'operador' as const,
        carteiras: todasCarteiras,
      },
      {
        nome: 'Matheus',
        email: 'matheus@b2b.com',
        password: '123456',
        operador: 'B2B | Matheus',
        role: 'operador' as const,
        carteiras: todasCarteiras,
      },
      {
        nome: 'Paulo',
        email: 'paulo@b2b.com',
        password: '123456',
        operador: 'B2B | Matheus',
        role: 'operador' as const,
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
        const existingUser = await userRepository.findByEmail(userData.email);
        if (existingUser) {
          console.log(`⚠️  ${userData.nome} já existe`);
          existentes++;
          continue;
        }

        // Criar usuário
        const novoUsuario = await userRepository.createUser(userData);
        console.log(`✅ ${userData.nome} (${userData.role}) criado com ID: ${novoUsuario._id}`);
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
      console.log('   👤 Operador: gustavo@b2b.com / 123456');
      console.log('   👤 Operador: jessica@b2b.com / 123456');
      console.log('   👤 Operador: paulo@b2b.com / 123456');
    }
    
  } catch (error) {
    console.error('❌ Erro no seed:', error);
    console.error('Stack completo:', error.stack);
  } finally {
    await MongoDBConnection.disconnect();
    process.exit(0);
  }
}

// Carregar variáveis de ambiente
require('dotenv').config();

// Verificar se tem as variáveis necessárias
if (!process.env.MONGODB_URI) {
  console.error('❌ MONGODB_URI não encontrada no .env');
  process.exit(1);
}

seedDatabase();