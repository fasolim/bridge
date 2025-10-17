require('dotenv').config();
const mongoose = require('mongoose');

async function testMongoConnection() {
  try {
    console.log('🔍 Testando conexão com MongoDB...');
    console.log('📡 URI:', process.env.MONGODB_URI);
    
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Conectado ao MongoDB com sucesso!');
    
    // Testar uma operação simples
    const collections = await mongoose.connection.db.listCollections().toArray();
    console.log('📊 Coleções encontradas:', collections.map(c => c.name));
    
    await mongoose.disconnect();
    console.log('🔌 Desconectado do MongoDB');
    
  } catch (error) {
    console.log('❌ Erro na conexão:', error.message);
  }
}

testMongoConnection();
