const app = require('./app/app');

const PORT = process.env.PORT || 3001;
const HOST = process.env.HOST || '0.0.0.0';

// Função para obter o IP local da máquina
function getLocalIP() {
  const { networkInterfaces } = require('os');
  const nets = networkInterfaces();
  
  for (const name of Object.keys(nets)) {
    for (const net of nets[name]) {
      if (net.family === 'IPv4' && !net.internal) {
        return net.address;
      }
    }
  }
  return 'localhost';
}

const server = app.listen(PORT, HOST, () => {
  const localIP = getLocalIP();
  
  console.log('\n' + '='.repeat(70));
  console.log('🚀 Bridge Metrics API está rodando!');
  console.log('='.repeat(70));
  console.log(`\n📡 URLs disponíveis:\n`);
  console.log(`   Local:    http://localhost:${PORT}/api/health`);
  console.log(`   Rede:     http://${localIP}:${PORT}/api/health`);
  console.log(`\n📌 Use o endereço de REDE para acessar de outros computadores`);
  console.log('='.repeat(70) + '\n');
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully');
  server.close(() => {
    console.log('Process terminated');
  });
});

process.on('SIGINT', () => {
  console.log('SIGINT received, shutting down gracefully');
  server.close(() => {
    console.log('Process terminated');
  });
});

module.exports = server;
