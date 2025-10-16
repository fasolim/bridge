const mongoose = require('mongoose');

class DatabaseConfig {
  constructor() {
    this.connection = null;
  }

  async connect() {
    try {
      const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/bridge_metrics';
      
      this.connection = await mongoose.connect(MONGODB_URI, {
        useNewUrlParser: true,
        useUnifiedTopology: true,
      });
      
      console.log('✅ Conectado ao MongoDB com sucesso!');
      return this.connection;
    } catch (error) {
      console.error('❌ Erro ao conectar ao MongoDB:', error);
      throw error;
    }
  }

  async disconnect() {
    if (this.connection) {
      await mongoose.disconnect();
      console.log('🔌 Desconectado do MongoDB');
    }
  }

  getConnection() {
    return this.connection;
  }
}

module.exports = new DatabaseConfig();
