// Script de inicialização do MongoDB para o Bridge Metrics
db = db.getSiblingDB('bridge_metrics');

// Criar usuário específico para a aplicação
db.createUser({
  user: 'bridge_user',
  pwd: 'bridge_password',
  roles: [
    {
      role: 'readWrite',
      db: 'bridge_metrics'
    }
  ]
});

// Criar coleções com configurações otimizadas
db.createCollection('bugmetrics', {
  validator: {
    $jsonSchema: {
      bsonType: 'object',
      required: ['notionBugId', 'bugTitle', 'bugDescription'],
      properties: {
        notionBugId: {
          bsonType: 'string',
          description: 'ID do bug no Notion é obrigatório'
        },
        bugLevel: {
          bsonType: 'int',
          minimum: 1,
          maximum: 5,
          description: 'Nível do bug deve estar entre 1 e 5'
        },
        status: {
          bsonType: 'string',
          enum: ['pending', 'in_progress', 'resolved', 'rejected', 'escalated'],
          description: 'Status deve ser um dos valores permitidos'
        }
      }
    }
  }
});

db.createCollection('reports', {
  validator: {
    $jsonSchema: {
      bsonType: 'object',
      required: ['reportId', 'reportType'],
      properties: {
        reportType: {
          bsonType: 'string',
          enum: ['daily', 'weekly', 'monthly', 'custom'],
          description: 'Tipo de relatório deve ser um dos valores permitidos'
        }
      }
    }
  }
});

db.createCollection('mlconfigs', {
  validator: {
    $jsonSchema: {
      bsonType: 'object',
      required: ['configName'],
      properties: {
        configName: {
          bsonType: 'string',
          description: 'Nome da configuração é obrigatório'
        }
      }
    }
  }
});

// Criar índices para performance
db.bugmetrics.createIndex({ 'notionBugId': 1, 'createdAt': -1 });
db.bugmetrics.createIndex({ 'status': 1, 'bugLevel': 1 });
db.bugmetrics.createIndex({ 'createdAt': -1 });
db.bugmetrics.createIndex({ 'totalAttempts': 1 });
db.bugmetrics.createIndex({ 'totalCost': 1 });

db.reports.createIndex({ 'reportType': 1, 'period.startDate': -1 });
db.reports.createIndex({ 'createdAt': -1 });

db.mlconfigs.createIndex({ 'configName': 1 }, { unique: true });
db.mlconfigs.createIndex({ 'isActive': 1 });

// Inserir configuração padrão de ML
db.mlconfigs.insertOne({
  configName: 'default',
  promptTemplates: [
    {
      level: 1,
      template: 'Analise e corrija o seguinte bug: {bugDescription}. Forneça uma solução simples e direta.',
      successRate: 0.0,
      usageCount: 0
    },
    {
      level: 2,
      template: 'Este é um bug de nível intermediário. Analise cuidadosamente: {bugDescription}. Considere múltiplas abordagens e escolha a melhor.',
      successRate: 0.0,
      usageCount: 0
    },
    {
      level: 3,
      template: 'Bug complexo detectado: {bugDescription}. Realize análise detalhada, identifique dependências e forneça solução robusta.',
      successRate: 0.0,
      usageCount: 0
    },
    {
      level: 4,
      template: 'Bug crítico de alto nível: {bugDescription}. Análise arquitetural necessária. Considere impacto em todo o sistema.',
      successRate: 0.0,
      usageCount: 0
    },
    {
      level: 5,
      template: 'Bug extremamente complexo: {bugDescription}. Requer análise profunda, refatoração e testes extensivos. Abordagem sistemática necessária.',
      successRate: 0.0,
      usageCount: 0
    }
  ],
  escalationRules: [
    {
      condition: 'attempts > 2',
      action: 'increase_level',
      parameters: { increment: 1 }
    },
    {
      condition: 'attempts > 5',
      action: 'human_review',
      parameters: { notify: true }
    }
  ],
  learningRate: 0.1,
  isActive: true,
  lastUpdated: new Date()
});

print('✅ Bridge Metrics MongoDB inicializado com sucesso!');
print('📊 Coleções criadas: bugmetrics, reports, mlconfigs');
print('🔧 Configuração padrão de ML inserida');
print('📈 Índices de performance criados');
