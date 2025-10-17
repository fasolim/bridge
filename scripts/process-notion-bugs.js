const mongoose = require('mongoose');
const BugMetrics = require('../app/models/BugMetrics');
const MLConfig = require('../app/models/MLConfig');

// Dados extraídos do Notion
const notionBugs = [
  {
    notionBugId: '28ecd984-590f-80bd-a0e4-d86f4fb5debf',
    title: 'Valor deve ser editável no modal "Confirmar Pagamento"',
    status: 'Concluído',
    category: 'Bug',
    module: 'Despesas',
    priority: null,
    lastEdited: '2025-10-16T16:42:22.011Z',
    url: 'https://www.notion.so/28ecd984590f80bda0e4d86f4fb5debf',
    description: 'Campo Valor exibido no modal de confirmação de pagamento está como somente leitura; deve ser possível editar o valor antes de confirmar o pagamento.',
    stepsToReproduce: [
      'Ir para Gerenciamento de Despesas',
      'Selecionar uma despesa qualquer e clicar em Confirmar Pagamento (abrir modal)',
      'Observar o campo Valor destacado (lado superior direito do modal)',
      'Tentar editar o valor (clicar dentro do campo e digitar um novo valor)'
    ],
    expectedResult: 'O campo Valor deve ser um input editável (ou ter um botão/ícone para editar) permitindo que o usuário ajuste o valor manualmente antes de confirmar o pagamento.',
    acceptanceCriteria: [
      'O campo Valor aparece como input editável ao abrir o modal',
      'Permite entrada numérica com máscara BRL (ex: R$ 1.234,56 ou BRL 1234.56)',
      'Validação de valor: não aceitar valores negativos; mínimo = 0,00',
      'Ao confirmar, o valor editado é enviado corretamente para a API',
      'Testes unitários e e2e cobrindo edição e envio do valor'
    ],
    businessImpact: 'Usuários não conseguem corrigir/ajustar o valor ao confirmar pagamento, o que pode gerar lançamentos incorretos no financeiro e retrabalho manual.',
    suggestedFix: 'Substituir o elemento atual por um input controlado (type="text"/"number") com máscara de moeda. Garantir que a máscara/formatação não atrapalhe a conversão para número no payload.'
  },
  {
    notionBugId: '28ecd984-590f-8016-a140-e38cca5476a5',
    title: 'Campos de IP indevidos no modal "Confirmar Pagamento"',
    status: 'Concluído',
    category: 'Bug',
    module: 'Despesas',
    priority: null,
    lastEdited: '2025-10-16T17:04:14.636Z',
    url: 'https://www.notion.so/28ecd984590f8016a140e38cca5476a5',
    description: 'Os campos IP Principal e IP Adicional estão sendo exibidos indevidamente no modal de Confirmar Pagamento de despesa. Esses campos pertencem apenas à seção de cadastro de máquinas ou infraestrutura e não deveriam aparecer neste fluxo.',
    stepsToReproduce: [
      'Acessar o módulo Gerenciamento de Despesas',
      'Clicar em Confirmar Pagamento de qualquer despesa',
      'Rolar o modal até a seção Dados da Máquina',
      'Observar os campos IP Principal e IP Adicional visíveis no modal'
    ],
    expectedResult: 'Os campos IP Principal e IP Adicional não devem aparecer no modal de confirmação de pagamento, pois não são relevantes para o contexto financeiro.',
    acceptanceCriteria: [
      'Campos de IP removidos completamente da tela de confirmação de pagamento',
      'Campos permanecem apenas nas telas de cadastro de máquinas (infraestrutura/inventário)'
    ],
    businessImpact: 'Esses campos confundem os usuários do financeiro, gerando dúvidas sobre a necessidade de preenchimento e possíveis erros de dados. Além disso, adicionam ruído visual desnecessário no fluxo de confirmação de pagamento.',
    suggestedFix: 'Remover os campos de IP da renderização condicional do modal Confirmar Pagamento. Garantir que o componente de IP permaneça disponível apenas na tela de Infraestrutura / Cadastro de Máquina.'
  },
  {
    notionBugId: '28ecd984-590f-806e-ad4c-e7cb191c4fe7',
    title: 'Máscara de Moeda não aplicada no campo "Valor" do modal Confirmar Pagamento',
    status: 'Pronto pra teste',
    category: 'Bug',
    module: 'Despesas',
    priority: null,
    lastEdited: '2025-10-16T18:09:18.996Z',
    url: 'https://www.notion.so/28ecd984590f806ead4ce7cb191c4fe7',
    description: 'Campo Valor no modal de confirmação de pagamento está sem máscara de moeda BRL, permitindo entrada livre (ex: número inteiro 0) sem formatação monetária.',
    stepsToReproduce: [
      'Ir para Gerenciamento de Despesas',
      'Selecionar uma despesa qualquer e clicar em Confirmar Pagamento (abrir modal)',
      'Observar o campo Valor (lado direito, próximo à moeda selecionada)',
      'Inserir qualquer número (ex: 1000)'
    ],
    expectedResult: 'O campo Valor deve aplicar máscara de moeda automaticamente ao digitar, conforme padrão BRL. Exemplo: digitar 1000 → exibir R$ 1.000,00',
    acceptanceCriteria: [
      'Campo Valor exibe e aplica máscara de moeda BRL dinamicamente',
      'Mantém compatibilidade com as moedas disponíveis',
      'Validação impede entrada de valores inválidos',
      'Máscara não interfere no envio correto do valor',
      'Pegue o mesmo componente da mascara de valor de nova transferência interna'
    ],
    businessImpact: 'A ausência de máscara pode gerar confusão no preenchimento e erros de valor, especialmente em lançamentos de grandes valores. Impacta confiabilidade e consistência dos dados financeiros.',
    suggestedFix: 'Aplicar componente de input monetário com máscara BRL (reutilizar padrão existente no sistema se houver). Garantir compatibilidade com diferentes moedas.'
  }
];

// Função para determinar o nível do bug baseado na complexidade
function determineBugLevel(bug) {
  const complexityFactors = {
    hasStepsToReproduce: bug.stepsToReproduce && bug.stepsToReproduce.length > 0,
    hasAcceptanceCriteria: bug.acceptanceCriteria && bug.acceptanceCriteria.length > 0,
    hasBusinessImpact: !!bug.businessImpact,
    hasSuggestedFix: !!bug.suggestedFix,
    moduleComplexity: bug.module === 'Despesas' ? 2 : 1,
    statusComplexity: bug.status === 'Pronto pra teste' ? 2 : 1
  };

  const score = Object.values(complexityFactors).reduce((sum, factor) => sum + (factor ? 1 : 0), 0);
  
  if (score >= 6) return 3; // Alto
  if (score >= 4) return 2; // Médio
  return 1; // Baixo
}

// Função para mapear status do Notion para status interno
function mapNotionStatus(notionStatus) {
  const statusMap = {
    'Concluído': 'resolved',
    'Pronto pra teste': 'pending', // Mapear para pending pois ready_for_testing não existe no enum
    'Em progresso': 'in_progress',
    'Não iniciada': 'pending',
    'Despriorizada': 'pending',
    'Reprovado': 'rejected'
  };
  
  return statusMap[notionStatus] || 'pending';
}

// Função para processar e salvar bugs no MongoDB
async function processNotionBugs() {
  try {
    // Conectar ao MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://bridge_user:bridge_password@localhost:27017/bridge_metrics');
    console.log('✅ Conectado ao MongoDB');

    let processedCount = 0;
    let createdCount = 0;
    let updatedCount = 0;

    for (const notionBug of notionBugs) {
      try {
        // Verificar se o bug já existe
        const existingBug = await BugMetrics.findOne({ notionBugId: notionBug.notionBugId });
        
        const bugData = {
          notionBugId: notionBug.notionBugId,
          bugTitle: notionBug.title,
          bugDescription: notionBug.description,
          bugLevel: determineBugLevel(notionBug),
          status: mapNotionStatus(notionBug.status),
          category: notionBug.category,
          module: notionBug.module,
          priority: notionBug.priority,
          url: notionBug.url,
          lastEdited: new Date(notionBug.lastEdited),
          
          // Dados estruturados
          stepsToReproduce: notionBug.stepsToReproduce,
          expectedResult: notionBug.expectedResult,
          acceptanceCriteria: notionBug.acceptanceCriteria,
          businessImpact: notionBug.businessImpact,
          suggestedFix: notionBug.suggestedFix,
          
          // Métricas iniciais
          totalAttempts: 0,
          totalTokens: 0,
          totalCost: 0,
          totalExecutionTime: 0,
          attempts: [],
          
          // Dados de ML
          mlData: {
            successProbability: 0.5,
            complexityScore: determineBugLevel(notionBug),
            lastLearningUpdate: new Date(),
            features: {
              hasStepsToReproduce: notionBug.stepsToReproduce && notionBug.stepsToReproduce.length > 0,
              hasAcceptanceCriteria: notionBug.acceptanceCriteria && notionBug.acceptanceCriteria.length > 0,
              hasBusinessImpact: !!notionBug.businessImpact,
              hasSuggestedFix: !!notionBug.suggestedFix,
              moduleComplexity: notionBug.module === 'Despesas' ? 2 : 1
            }
          },
          
          // Metadados
          createdAt: new Date(),
          updatedAt: new Date(),
          source: 'notion_mcp',
          extractedAt: new Date()
        };

        if (existingBug) {
          // Atualizar bug existente
          await BugMetrics.updateOne(
            { notionBugId: notionBug.notionBugId },
            { 
              ...bugData,
              updatedAt: new Date()
            }
          );
          updatedCount++;
          console.log(`🔄 Atualizado: ${notionBug.title}`);
        } else {
          // Criar novo bug
          await BugMetrics.create(bugData);
          createdCount++;
          console.log(`✅ Criado: ${notionBug.title}`);
        }
        
        processedCount++;
      } catch (error) {
        console.error(`❌ Erro ao processar bug ${notionBug.notionBugId}:`, error.message);
      }
    }

    console.log('\n📊 RESUMO DO PROCESSAMENTO:');
    console.log(`Total processados: ${processedCount}`);
    console.log(`Novos bugs criados: ${createdCount}`);
    console.log(`Bugs atualizados: ${updatedCount}`);
    
    // Gerar estatísticas
    const stats = await BugMetrics.aggregate([
      {
        $group: {
          _id: null,
          totalBugs: { $sum: 1 },
          avgBugLevel: { $avg: '$bugLevel' },
          statusBreakdown: { $push: '$status' },
          moduleBreakdown: { $push: '$module' }
        }
      }
    ]);

    if (stats.length > 0) {
      const stat = stats[0];
      console.log('\n📈 ESTATÍSTICAS:');
      console.log(`Total de bugs no sistema: ${stat.totalBugs}`);
      console.log(`Nível médio de complexidade: ${stat.avgBugLevel.toFixed(2)}`);
      
      // Contar status
      const statusCount = stat.statusBreakdown.reduce((acc, status) => {
        acc[status] = (acc[status] || 0) + 1;
        return acc;
      }, {});
      console.log('Status:', statusCount);
      
      // Contar módulos
      const moduleCount = stat.moduleBreakdown.reduce((acc, module) => {
        acc[module] = (acc[module] || 0) + 1;
        return acc;
      }, {});
      console.log('Módulos:', moduleCount);
    }

  } catch (error) {
    console.error('❌ Erro geral:', error);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Desconectado do MongoDB');
  }
}

// Executar se chamado diretamente
if (require.main === module) {
  processNotionBugs();
}

module.exports = { processNotionBugs, notionBugs };
