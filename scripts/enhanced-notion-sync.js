require('dotenv').config();
const mongoose = require('mongoose');
const BugMetrics = require('../app/models/BugMetrics');

// Dados extraídos via MCP do Notion com todos os detalhes
const enhancedBugs = [
  {
    id: "28ecd984-590f-8016-a140-e38cca5476a5",
    title: "Campos de IP indevidos no modal \"Confirmar Pagamento\"",
    url: "https://www.notion.so/28ecd984590f8016a140e38cca5476a5",
    properties: {
      categoria: ["Bug"],
      status: "Concluído",
      modulo: ["Despesas"],
      prioridade: 0,
      dataPrevista: false,
      criadoPor: "Maria Vitória Machado",
      editadoEm: "2025-10-16T17:04:14.636Z"
    },
    content: {
      resumo: "Os campos IP Principal e IP Adicional estão sendo exibidos indevidamente no modal de Confirmar Pagamento de despesa. Esses campos pertencem apenas à seção de cadastro de máquinas ou infraestrutura e não deveriam aparecer neste fluxo.",
      passosReproduzir: [
        "Acessar o módulo Gerenciamento de Despesas",
        "Clicar em Confirmar Pagamento de qualquer despesa",
        "Rolar o modal até a seção Dados da Máquina",
        "Observar os campos IP Principal e IP Adicional visíveis no modal"
      ],
      resultadoAtual: "Os campos IP Principal e IP Adicional aparecem no modal, permitindo entrada manual de endereços IP, mesmo quando a despesa não está vinculada a um registro de máquina.",
      resultadoEsperado: "Os campos IP Principal e IP Adicional não devem aparecer no modal de confirmação de pagamento, pois não são relevantes para o contexto financeiro. Esses campos devem: Ser removidos completamente da tela de confirmação de pagamento. Permanecer apenas nas telas de cadastro de máquinas (infraestrutura/inventário).",
      impactoNegocio: "Esses campos confundem os usuários do financeiro, gerando dúvidas sobre a necessidade de preenchimento e possíveis erros de dados. Além disso, adicionam ruído visual desnecessário no fluxo de confirmação de pagamento.",
      sugestaoCorrecao: [
        "Remover os campos de IP da renderização condicional do modal Confirmar Pagamento",
        "Garantir que o componente de IP permaneça disponível apenas na tela de Infraestrutura / Cadastro de Máquina",
        "Verificar se há dependência compartilhada entre modais e modularizar o formulário"
      ],
      anexos: ["Screenshot do modal com campos IP visíveis"]
    }
  },
  {
    id: "28ecd984-590f-806e-ad4c-e7cb191c4fe7",
    title: "Máscara de Moeda não aplicada no campo \"Valor\" do modal Confirmar Pagamento",
    url: "https://www.notion.so/28ecd984590f806ead4ce7cb191c4fe7",
    properties: {
      categoria: ["Bug"],
      status: "Pronto pra teste",
      modulo: ["Despesas"],
      prioridade: 0,
      dataPrevista: false,
      criadoPor: "Maria Vitória Machado",
      editadoEm: "2025-10-16T18:09:18.996Z"
    },
    content: {
      resumo: "Campo Valor no modal de confirmação de pagamento está sem máscara de moeda BRL, permitindo entrada livre (ex: número inteiro 0) sem formatação monetária.",
      passosReproduzir: [
        "Ir para Gerenciamento de Despesas",
        "Selecionar uma despesa qualquer e clicar em Confirmar Pagamento (abrir modal)",
        "Observar o campo Valor (lado direito, próximo à moeda selecionada)",
        "Inserir qualquer número (ex: 1000)"
      ],
      resultadoAtual: "O campo Valor aceita entrada numérica pura (ex: 0, 1000) sem máscara de moeda BRL. Não há separador de milhar, vírgula decimal ou prefixo de moeda.",
      resultadoEsperado: "O campo Valor deve aplicar máscara de moeda automaticamente ao digitar, conforme padrão BRL. Exemplo: digitar 1000 → exibir R$ 1.000,00. Prefixo BRL fixo conforme seleção do campo \"Moeda\". Formatação consistente com o restante do sistema financeiro.",
      criteriosAceitacao: [
        "Campo Valor exibe e aplica máscara de moeda BRL dinamicamente",
        "Mantém compatibilidade com as moedas disponíveis (caso o sistema suporte múltiplas moedas)",
        "Validação impede entrada de valores inválidos (ex: letras, múltiplos pontos decimais, negativos — a depender da regra de negócio)",
        "Máscara não interfere no envio correto do valor (payload numérico convertido corretamente para centavos ou float, conforme backend)",
        "Pegue o mesmo componente da mascara de valor de nova transferência interna"
      ],
      dadosUteis: {
        console: "verificar se há warnings de formatação",
        requestResponse: "confirmar se o valor enviado no payload está correto"
      },
      impactoNegocio: "A ausência de máscara pode gerar confusão no preenchimento e erros de valor, especialmente em lançamentos de grandes valores. Impacta confiabilidade e consistência dos dados financeiros.",
      sugestaoCorrecao: [
        "Aplicar componente de input monetário com máscara BRL (reutilizar padrão existente no sistema se houver)",
        "Garantir compatibilidade com diferentes moedas (usando campo \"Moeda\" como referência)",
        "Testar em diferentes navegadores e tamanhos de tela (mobile/responsivo)",
        "Adicionar testes unitários e e2e de máscara monetária"
      ],
      observacoesAdicionais: "Confirmar se o formato deve seguir padrão brasileiro (R$ 1.000,00) ou internacional (BRL 1,000.00) conforme configuração global do sistema.",
      anexos: ["Screenshot do campo sem máscara"]
    }
  },
  {
    id: "28ecd984-590f-80a5-8d9f-fde2cc67a92e",
    title: "Novo(a) ideia",
    url: "https://www.notion.so/28ecd984590f80a58d9ffde2cc67a92e",
    properties: {
      categoria: [],
      status: "Não iniciada",
      modulo: ["Despesas"],
      prioridade: 0,
      dataPrevista: false,
      criadoPor: "Maria Vitória Machado",
      editadoEm: "2025-10-17T13:37:10.856Z"
    },
    content: {
      resumo: "Página de template para novas ideias - ainda não preenchida",
      descricao: "Insira uma descrição em duas ou três frases.",
      importancia: [
        "Campo vazio",
        "Campo vazio", 
        "Campo vazio"
      ],
      dadosApoio: "Vincule conversas do slack, relatórios analíticos etc."
    }
  },
  {
    id: "28ecd984-590f-80bd-a0e4-d86f4fb5debf",
    title: "Valor deve ser editável no modal \"Confirmar Pagamento\"",
    url: "https://www.notion.so/28ecd984590f80bda0e4d86f4fb5debf",
    properties: {
      categoria: ["Bug"],
      status: "Concluído",
      modulo: ["Despesas"],
      prioridade: 0,
      dataPrevista: false,
      criadoPor: "Maria Vitória Machado",
      editadoEm: "2025-10-16T16:42:22.011Z"
    },
    content: {
      resumo: "Campo Valor exibido no modal de confirmação de pagamento está como somente leitura; deve ser possível editar o valor antes de confirmar o pagamento.",
      passosReproduzir: [
        "Ir para Gerenciamento de Despesas",
        "Selecionar uma despesa qualquer e clicar em Confirmar Pagamento (abrir modal)",
        "Observar o campo Valor destacado (lado superior direito do modal)",
        "Tentar editar o valor (clicar dentro do campo e digitar um novo valor)"
      ],
      resultadoAtual: "O campo Valor é exibido como texto formatado (BRL 50,00) e não permite edição — campo está como somente leitura.",
      resultadoEsperado: "O campo Valor deve ser um input editável (ou ter um botão/ícone para editar) permitindo que o usuário ajuste o valor manualmente antes de confirmar o pagamento. Deve manter validação de formato (decimal, separador de milhar/opcional) e máscaras de moeda.",
      criteriosAceitacao: [
        "O campo Valor aparece como input editável ao abrir o modal",
        "Permite entrada numérica com máscara BRL (ex: R$ 1.234,56 ou BRL 1234.56 conforme padrão do produto)",
        "Validação de valor: não aceitar valores negativos; mínimo = 0,00; máximo conforme regra de negócio",
        "Ao confirmar, o valor editado é enviado corretamente para a API e refletido na despesa (status/valor atualizado)",
        "Testes unitários e e2e cobrindo edição e envio do valor"
      ],
      dadosUteis: {
        console: "colar erros se houver",
        requestResponse: "capturar requisição que salva confirmação de pagamento",
        payloadEsperado: "{ \"amount\": 50.00, ... }"
      },
      impactoNegocio: "Usuários não conseguem corrigir/ajustar o valor ao confirmar pagamento, o que pode gerar lançamentos incorretos no financeiro e retrabalho manual — impacto direto na confiabilidade dos registros e fluxo de conciliação.",
      sugestaoCorrecao: [
        "Substituir o elemento atual por um input controlado (type=\"text\"/\"number\") com máscara de moeda",
        "Garantir que a máscara/formatação não atrapalhe a conversão para número no payload",
        "Reutilizar componente de input monetário já existente (se houver) para manter consistência",
        "Atualizar testes (unitários e e2e) e criar caso de QA para validar comportamento em mobile/responsivo"
      ],
      anexos: ["Screenshot do campo destacado"]
    }
  }
];

async function syncEnhancedBugs() {
  try {
    // Conectar ao MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Conectado ao MongoDB');
    
    let syncedCount = 0;
    let updatedCount = 0;
    const errors = [];
    
    // Processar cada bug com dados detalhados
    for (const bug of enhancedBugs) {
      try {
        console.log(`🔍 Processando: ${bug.title}`);
        
        // Mapear status do Notion para interno
        const statusMap = {
          'concluído': 'resolved',
          'pronto pra teste': 'pending',
          'não iniciada': 'pending',
          'em progresso': 'in_progress',
          'despriorizada': 'pending',
          'reprovado': 'rejected'
        };
        
        const internalStatus = statusMap[bug.properties.status?.toLowerCase()] || 'pending';
        
        // Criar descrição completa com todos os detalhes
        let fullDescription = bug.content.resumo || '';
        
        if (bug.content.passosReproduzir) {
          fullDescription += '\n\n**Passos para Reproduzir:**\n';
          fullDescription += bug.content.passosReproduzir.map((passo, i) => `${i + 1}. ${passo}`).join('\n');
        }
        
        if (bug.content.resultadoAtual) {
          fullDescription += '\n\n**Resultado Atual:**\n';
          fullDescription += bug.content.resultadoAtual;
        }
        
        if (bug.content.resultadoEsperado) {
          fullDescription += '\n\n**Resultado Esperado:**\n';
          fullDescription += bug.content.resultadoEsperado;
        }
        
        if (bug.content.criteriosAceitacao) {
          fullDescription += '\n\n**Critérios de Aceitação:**\n';
          fullDescription += bug.content.criteriosAceitacao.map(criterio => `- ${criterio}`).join('\n');
        }
        
        if (bug.content.impactoNegocio) {
          fullDescription += '\n\n**Impacto no Negócio:**\n';
          fullDescription += bug.content.impactoNegocio;
        }
        
        if (bug.content.sugestaoCorrecao) {
          fullDescription += '\n\n**Sugestão de Correção:**\n';
          fullDescription += bug.content.sugestaoCorrecao.map(sugestao => `- ${sugestao}`).join('\n');
        }
        
        if (bug.content.observacoesAdicionais) {
          fullDescription += '\n\n**Observações Adicionais:**\n';
          fullDescription += bug.content.observacoesAdicionais;
        }
        
        const bugData = {
          notionBugId: bug.id,
          bugTitle: bug.title,
          bugDescription: fullDescription,
          status: internalStatus,
          bugLevel: 1,
          notionDetails: {
            // Propriedades básicas
            categoria: bug.properties.categoria || [],
            modulo: bug.properties.modulo || [],
            prioridade: bug.properties.prioridade || 0,
            dataPrevista: bug.properties.dataPrevista || false,
            criadoPor: bug.properties.criadoPor || '',
            editadoEm: bug.properties.editadoEm ? new Date(bug.properties.editadoEm) : new Date(),
            url: bug.url,
            
            // Conteúdo estruturado
            resumo: bug.content.resumo || '',
            passosReproduzir: bug.content.passosReproduzir || [],
            resultadoAtual: bug.content.resultadoAtual || '',
            resultadoEsperado: bug.content.resultadoEsperado || '',
            criteriosAceitacao: bug.content.criteriosAceitacao || [],
            dadosUteis: {
              console: bug.content.dadosUteis?.console || '',
              requestResponse: bug.content.dadosUteis?.requestResponse || '',
              payloadEsperado: bug.content.dadosUteis?.payloadEsperado || ''
            },
            impactoNegocio: bug.content.impactoNegocio || '',
            sugestaoCorrecao: bug.content.sugestaoCorrecao || [],
            observacoesAdicionais: bug.content.observacoesAdicionais || '',
            anexos: bug.content.anexos || [],
            
            // Para ideias
            descricao: bug.content.descricao || '',
            importancia: bug.content.importancia || [],
            dadosApoio: bug.content.dadosApoio || ''
          },
          rawData: {
            url: bug.url,
            properties: bug.properties,
            content: bug.content,
            extractedAt: new Date().toISOString(),
            source: 'MCP_Notion_Enhanced'
          }
        };
        
        // Verificar se bug já existe
        const existingBug = await BugMetrics.findOne({ notionBugId: bug.id });
        
        if (existingBug) {
          console.log(`   ✅ Atualizando bug existente`);
          existingBug.bugTitle = bugData.bugTitle;
          existingBug.bugDescription = bugData.bugDescription;
          existingBug.status = bugData.status;
          existingBug.notionDetails = bugData.notionDetails;
          existingBug.rawData = bugData.rawData;
          existingBug.updatedAt = new Date();
          
          await existingBug.save();
          updatedCount++;
        } else {
          console.log(`   🆕 Criando novo bug`);
          const newBug = new BugMetrics(bugData);
          await newBug.save();
          syncedCount++;
        }
        
        console.log(`   📝 "${bugData.bugTitle}" - ${bugData.status}`);
        console.log(`   📊 Descrição: ${bugData.bugDescription.length} caracteres`);
        
      } catch (error) {
        console.log(`❌ Erro: ${error.message}`);
        errors.push({
          pageId: bug.id,
          error: error.message
        });
      }
    }
    
    console.log(`\n🎉 Sincronização detalhada concluída!`);
    console.log(`📊 Total: ${enhancedBugs.length} bugs/ideias`);
    console.log(`✅ Novos: ${syncedCount}`);
    console.log(`🔄 Atualizados: ${updatedCount}`);
    console.log(`❌ Erros: ${errors.length}`);
    
    if (errors.length > 0) {
      console.log(`\n❌ Detalhes dos erros:`);
      errors.forEach(error => {
        console.log(`   ${error.pageId}: ${error.error}`);
      });
    }
    
    // Estatísticas dos dados
    const bugs = enhancedBugs.filter(b => b.properties.categoria.includes('Bug'));
    const ideias = enhancedBugs.filter(b => !b.properties.categoria.includes('Bug'));
    
    console.log(`\n📈 Estatísticas:`);
    console.log(`   🐛 Bugs: ${bugs.length}`);
    console.log(`   💡 Ideias: ${ideias.length}`);
    console.log(`   ✅ Concluídos: ${enhancedBugs.filter(b => b.properties.status === 'Concluído').length}`);
    console.log(`   🟣 Prontos para teste: ${enhancedBugs.filter(b => b.properties.status === 'Pronto pra teste').length}`);
    console.log(`   ⚪ Não iniciados: ${enhancedBugs.filter(b => b.properties.status === 'Não iniciada').length}`);
    
  } catch (error) {
    console.log('❌ Erro geral:', error.message);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Desconectado do MongoDB');
  }
}

// Executar se chamado diretamente
if (require.main === module) {
  syncEnhancedBugs();
}

module.exports = { syncEnhancedBugs, enhancedBugs };
