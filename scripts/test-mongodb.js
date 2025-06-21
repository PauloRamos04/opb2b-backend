require('dotenv').config();
const { MongoClient } = require('mongodb');

async function testConnection() {
  const uri = process.env.MONGO_URL;
  
  console.log('🔗 Testando conexão MongoDB...');
  console.log('URI:', uri ? uri.replace(/\/\/([^:]+):([^@]+)@/, '//***:***@') : 'NÃO DEFINIDA');
  
  if (!uri) {
    console.error('❌ MONGO_URL não encontrada no .env');
    return;
  }

  const client = new MongoClient(uri, {
    maxPoolSize: 5,
    serverSelectionTimeoutMS: 10000,
    socketTimeoutMS: 30000,
    tls: true,
    tlsAllowInvalidCertificates: false,
    retryWrites: true
  });

  try {
    console.log('⏳ Conectando...');
    await client.connect();
    
    console.log('✅ Conectado! Testando ping...');
    const db = client.db(process.env.MONGODB_DB || 'operacoes_b2b');
    await db.admin().ping();
    
    console.log('🎉 MongoDB funcionando perfeitamente!');
    
    const collections = await db.listCollections().toArray();
    console.log('📚 Collections:', collections.map(c => c.name));
    
  } catch (error) {
    console.error('❌ Erro na conexão:', error.message);
    
    if (error.message.includes('SSL') || error.message.includes('TLS')) {
      console.log('\n🔧 Possíveis soluções:');
      console.log('1. Verificar se a URI está correta');
      console.log('2. Verificar se o cluster está rodando');
      console.log('3. Verificar whitelist de IPs no Atlas');
    }
  } finally {
    await client.close();
    console.log('🔌 Conexão fechada');
  }
}

testConnection();