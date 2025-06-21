import { MongoClient } from 'mongodb';
import * as bcrypt from 'bcryptjs';

async function seedDatabase() {
  console.log('🌱 Iniciando seed do banco de dados...');
  console.log('👥 Criando APENAS usuários (chamados vêm do Google Sheets)');
  console.log('🌍 TODOS os usuários terão acesso a TODAS as carteiras');

  // FORÇAR o uso da MONGO_URL do Railway
  const uri = process.env.MONGO_URL;
  const dbName = process.env.MONGODB_DB || 'operacoes_b2b';

  console.log('🔍 Debug das variáveis:');
  console.log(`   MONGO_URL: ${uri}`);
  console.log(`   MONGODB_DB: ${dbName}`);
  console.log(`   NODE_ENV: ${process.env.NODE_ENV}`);

  if (!uri) {
    console.error('❌ MONGO_URL não encontrada');
    process.exit(1);
  }

  // Verificar se a URL contém railway.internal (problema)
  if (uri.includes('railway.internal')) {
    console.error('❌ URL contém railway.internal - isso não vai funcionar no railway run');
    console.error('A URL deveria ser pública, não interna');
    process.exit(1);
  }

  console.log('✅ URL parece estar correta (não contém railway.internal)');

  // Criar cliente com configurações específicas
  const client = new MongoClient(uri, {
    serverSelectionTimeoutMS: 5000,
    connectTimeoutMS: 10000,
  });

  try {
    console.log('🔗 Conectando ao MongoDB...');
    console.log(`🎯 Tentando conectar em: ${uri.split('@')[1]?.split('/')[0] || 'URL_MASCARADA'}`);
    
    await client.connect();
    console.log('✅ MongoDB conectado para seed');

    const db = client.db(dbName);
    const usersCollection = db.collection('users');

    // Testar conexão
    await db.admin().ping();
    console.log('✅ Teste de ping no MongoDB OK');

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
    console.error('❌ Erro no seed:', error.message);
    
    // Debug adicional
    if (error.message.includes('railway.internal')) {
      console.error('🚨 PROBLEMA: O MongoDB está tentando usar railway.internal');
      console.error('Isso significa que há uma configuração incorreta em algum lugar');
      console.error('Verifique se não há MONGODB_URL ou DATABASE_URL conflitantes');
    }
    
  } finally {
    try {
      await client.close();
      console.log('🔌 MongoDB desconectado');
    } catch (e) {
      console.log('⚠️  Erro ao desconectar MongoDB');
    }
    process.exit(0);
  }
}

seedDatabase();