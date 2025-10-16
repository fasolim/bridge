#!/usr/bin/env node

/**
 * Script para listar databases do Notion
 */

require('dotenv').config();
const axios = require('axios');

const NOTION_TOKEN = process.env.NOTION_TOKEN;
const NOTION_API_BASE = 'https://api.notion.com/v1';

async function listDatabases() {
  console.log('🔍 Listando databases do Notion...\n');
  
  if (!NOTION_TOKEN) {
    console.error('❌ NOTION_TOKEN não encontrado no .env');
    return;
  }
  
  try {
    const response = await axios.post(`${NOTION_API_BASE}/search`, {
      filter: {
        value: 'database',
        property: 'object'
      }
    }, {
      headers: {
        'Authorization': `Bearer ${NOTION_TOKEN}`,
        'Notion-Version': '2022-06-28',
        'Content-Type': 'application/json'
      }
    });
    
    const databases = response.data.results;
    
    if (databases.length === 0) {
      console.log('⚠️  Nenhum database encontrado');
      console.log('\n💡 Dicas:');
      console.log('1. Certifique-se de que a integração tem acesso aos databases');
      console.log('2. Compartilhe o database com a integração "Bug Resolver"');
      console.log('3. Verifique se o database tem as propriedades necessárias');
      return;
    }
    
    console.log(`📊 Encontrados ${databases.length} databases:\n`);
    
    databases.forEach((db, index) => {
      const title = db.title?.[0]?.plain_text || 'Sem título';
      const id = db.id;
      const url = db.url;
      
      console.log(`${index + 1}. ${title}`);
      console.log(`   ID: ${id}`);
      console.log(`   URL: ${url}`);
      console.log('');
    });
    
    console.log('💡 Para usar um database, copie o ID e execute:');
    console.log('   node scripts/simple-metrics.js sync <DATABASE_ID>');
    
  } catch (error) {
    console.error('❌ Erro ao listar databases:');
    if (error.response) {
      console.error(`   Status: ${error.response.status}`);
      console.error(`   Erro: ${error.response.data?.message || 'Erro desconhecido'}`);
    } else {
      console.error(`   Erro: ${error.message}`);
    }
  }
}

if (require.main === module) {
  listDatabases();
}
