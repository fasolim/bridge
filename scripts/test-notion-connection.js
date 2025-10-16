#!/usr/bin/env node

/**
 * Script para testar conexão com Notion
 */

require('dotenv').config();
const axios = require('axios');

const NOTION_TOKEN = process.env.NOTION_TOKEN;
const NOTION_API_BASE = 'https://api.notion.com/v1';

async function testNotionConnection() {
  console.log('🔍 Testando conexão com Notion...\n');
  
  if (!NOTION_TOKEN) {
    console.error('❌ NOTION_TOKEN não encontrado no .env');
    return false;
  }
  
  console.log(`✅ Token encontrado: ${NOTION_TOKEN.substring(0, 20)}...`);
  
  try {
    // Testar conexão básica
    const response = await axios.get(`${NOTION_API_BASE}/users/me`, {
      headers: {
        'Authorization': `Bearer ${NOTION_TOKEN}`,
        'Notion-Version': '2022-06-28'
      }
    });
    
    console.log('✅ Conexão com Notion: OK');
    console.log(`👤 Usuário: ${response.data.name || 'N/A'}`);
    console.log(`📧 Email: ${response.data.person?.email || 'N/A'}`);
    
    return true;
  } catch (error) {
    console.error('❌ Erro na conexão com Notion:');
    if (error.response) {
      console.error(`   Status: ${error.response.status}`);
      console.error(`   Erro: ${error.response.data?.message || 'Erro desconhecido'}`);
    } else {
      console.error(`   Erro: ${error.message}`);
    }
    return false;
  }
}

async function testDatabaseAccess(databaseId) {
  if (!databaseId) {
    console.log('\n⚠️  Nenhum database ID fornecido para teste');
    return false;
  }
  
  console.log(`\n🔍 Testando acesso ao database: ${databaseId}...`);
  
  try {
    const response = await axios.post(`${NOTION_API_BASE}/databases/${databaseId}/query`, {
      page_size: 1
    }, {
      headers: {
        'Authorization': `Bearer ${NOTION_TOKEN}`,
        'Notion-Version': '2022-06-28',
        'Content-Type': 'application/json'
      }
    });
    
    console.log('✅ Acesso ao database: OK');
    console.log(`📊 Total de páginas: ${response.data.results.length}`);
    
    if (response.data.results.length > 0) {
      const page = response.data.results[0];
      console.log(`📄 Primeira página: ${page.id}`);
      console.log(`🔗 URL: ${page.url}`);
    }
    
    return true;
  } catch (error) {
    console.error('❌ Erro no acesso ao database:');
    if (error.response) {
      console.error(`   Status: ${error.response.status}`);
      console.error(`   Erro: ${error.response.data?.message || 'Erro desconhecido'}`);
    } else {
      console.error(`   Erro: ${error.message}`);
    }
    return false;
  }
}

async function main() {
  const args = process.argv.slice(2);
  const databaseId = args[0];
  
  console.log('🧪 TESTE DE CONEXÃO NOTION\n');
  console.log('='.repeat(50));
  
  const connectionOk = await testNotionConnection();
  
  if (connectionOk && databaseId) {
    await testDatabaseAccess(databaseId);
  }
  
  console.log('\n' + '='.repeat(50));
  
  if (connectionOk) {
    console.log('🎉 Conexão com Notion funcionando!');
    console.log('\n📋 Próximos passos:');
    console.log('1. Instale o MongoDB localmente ou inicie o Docker');
    console.log('2. Execute: npm run sync <DATABASE_ID>');
    console.log('3. Execute: npm run auto-sync sync <DATABASE_ID>');
  } else {
    console.log('❌ Problemas na conexão com Notion');
    console.log('\n🔧 Verifique:');
    console.log('1. Se o token está correto no .env');
    console.log('2. Se o token tem as permissões necessárias');
    console.log('3. Se o database foi compartilhado com a integração');
  }
  
  console.log('='.repeat(50) + '\n');
}

if (require.main === module) {
  main();
}
