# 🐛 RELATÓRIO DE BUGS EXTRAÍDOS DO NOTION

**Database**: 🔥 Força tarefa - 16/10 e 17/10  
**URL**: https://www.notion.so/28ecd984590f806eaa85ceb72a6e816c  
**Data de Extração**: 2025-10-17  
**Total de Bugs Encontrados**: 3  

---

## 📊 RESUMO EXECUTIVO

| Métrica | Valor |
|---------|-------|
| **Total de Bugs** | 3 |
| **Bugs Concluídos** | 2 |
| **Bugs Prontos para Teste** | 1 |
| **Bugs Reprovados** | 0 |
| **Módulo Mais Afetado** | Despesas (100%) |
| **Categoria** | Bug (100%) |

---

## 🐛 DETALHAMENTO DOS BUGS

### 1. **Valor deve ser editável no modal "Confirmar Pagamento"**

**ID**: `28ecd984-590f-80bd-a0e4-d86f4fb5debf`  
**Status**: ✅ Concluído  
**Módulo**: Despesas  
**Categoria**: Bug  
**Prioridade**: Não definida  
**Data de Edição**: 2025-10-16T16:42:22.011Z  

**Descrição**: Campo **Valor** exibido no modal de confirmação de pagamento está como somente leitura; deve ser possível editar o valor antes de confirmar o pagamento.

**Passos para Reproduzir**:
1. Ir para **Gerenciamento de Despesas**
2. Selecionar uma despesa qualquer e clicar em **Confirmar Pagamento** (abrir modal)
3. Observar o campo **Valor** destacado (lado superior direito do modal)
4. Tentar editar o valor (clicar dentro do campo e digitar um novo valor)

**Resultado Atual**: O campo **Valor** é exibido como texto formatado (BRL 50,00) e não permite edição — campo está como somente leitura.

**Resultado Esperado**: O campo **Valor** deve ser um input editável (ou ter um botão/ícone para editar) permitindo que o usuário ajuste o valor manualmente antes de confirmar o pagamento.

**Critérios de Aceitação**:
- O campo **Valor** aparece como input editável ao abrir o modal
- Permite entrada numérica com máscara BRL (ex: `R$ 1.234,56` ou `BRL 1234.56`)
- Validação de valor: não aceitar valores negativos; mínimo = 0,00
- Ao confirmar, o valor editado é enviado corretamente para a API
- Testes unitários e e2e cobrindo edição e envio do valor

**Impacto no Negócio**: Usuários não conseguem corrigir/ajustar o valor ao confirmar pagamento, o que pode gerar lançamentos incorretos no financeiro e retrabalho manual.

**Sugestão de Correção**:
- Substituir o elemento atual por um input controlado (type="text"/"number") com máscara de moeda
- Garantir que a máscara/formatação não atrapalhe a conversão para número no payload
- Reutilizar componente de input monetário já existente (se houver) para manter consistência

---

### 2. **Campos de IP indevidos no modal "Confirmar Pagamento"**

**ID**: `28ecd984-590f-8016-a140-e38cca5476a5`  
**Status**: ✅ Concluído  
**Módulo**: Despesas  
**Categoria**: Bug  
**Prioridade**: Não definida  
**Data de Edição**: 2025-10-16T17:04:14.636Z  

**Descrição**: Os campos **IP Principal** e **IP Adicional** estão sendo exibidos indevidamente no modal de **Confirmar Pagamento** de despesa. Esses campos pertencem apenas à seção de cadastro de máquinas ou infraestrutura e não deveriam aparecer neste fluxo.

**Passos para Reproduzir**:
1. Acessar o módulo **Gerenciamento de Despesas**
2. Clicar em **Confirmar Pagamento** de qualquer despesa
3. Rolar o modal até a seção **Dados da Máquina**
4. Observar os campos **IP Principal** e **IP Adicional** visíveis no modal

**Resultado Atual**: Os campos **IP Principal** e **IP Adicional** aparecem no modal, permitindo entrada manual de endereços IP, mesmo quando a despesa não está vinculada a um registro de máquina.

**Resultado Esperado**: Os campos **IP Principal** e **IP Adicional** **não devem aparecer** no modal de confirmação de pagamento, pois não são relevantes para o contexto financeiro.

**Impacto no Negócio**: Esses campos confundem os usuários do financeiro, gerando dúvidas sobre a necessidade de preenchimento e possíveis erros de dados. Além disso, adicionam ruído visual desnecessário no fluxo de confirmação de pagamento.

**Sugestão de Correção**:
- Remover os campos de IP da renderização condicional do modal Confirmar Pagamento
- Garantir que o componente de IP permaneça disponível apenas na tela de **Infraestrutura / Cadastro de Máquina**
- Verificar se há dependência compartilhada entre modais e modularizar o formulário

---

### 3. **Máscara de Moeda não aplicada no campo "Valor" do modal Confirmar Pagamento**

**ID**: `28ecd984-590f-806e-ad4c-e7cb191c4fe7`  
**Status**: 🧪 Pronto pra teste  
**Módulo**: Despesas  
**Categoria**: Bug  
**Prioridade**: Não definida  
**Data de Edição**: 2025-10-16T18:09:18.996Z  

**Descrição**: Campo **Valor** no modal de confirmação de pagamento está sem máscara de moeda BRL, permitindo entrada livre (ex: número inteiro 0) sem formatação monetária.

**Passos para Reproduzir**:
1. Ir para **Gerenciamento de Despesas**
2. Selecionar uma despesa qualquer e clicar em **Confirmar Pagamento** (abrir modal)
3. Observar o campo **Valor** (lado direito, próximo à moeda selecionada)
4. Inserir qualquer número (ex: 1000)

**Resultado Atual**: O campo **Valor** aceita entrada numérica pura (ex: `0`, `1000`) sem máscara de moeda BRL. Não há separador de milhar, vírgula decimal ou prefixo de moeda.

**Resultado Esperado**: O campo **Valor** deve aplicar máscara de moeda automaticamente ao digitar, conforme padrão BRL.
- Exemplo: digitar `1000` → exibir `R$ 1.000,00`
- Prefixo BRL fixo conforme seleção do campo "Moeda"
- Formatação consistente com o restante do sistema financeiro

**Critérios de Aceitação**:
- Campo **Valor** exibe e aplica máscara de moeda BRL dinamicamente
- Mantém compatibilidade com as moedas disponíveis (caso o sistema suporte múltiplas moedas)
- Validação impede entrada de valores inválidos (ex: letras, múltiplos pontos decimais, negativos)
- Máscara não interfere no envio correto do valor (payload numérico convertido corretamente)
- Pegue o mesmo componente da mascara de valor de nova transferência interna

**Impacto no Negócio**: A ausência de máscara pode gerar confusão no preenchimento e erros de valor, especialmente em lançamentos de grandes valores. Impacta confiabilidade e consistência dos dados financeiros.

**Sugestão de Correção**:
- Aplicar componente de input monetário com máscara BRL (reutilizar padrão existente no sistema se houver)
- Garantir compatibilidade com diferentes moedas (usando campo "Moeda" como referência)
- Testar em diferentes navegadores e tamanhos de tela (mobile/responsivo)
- Adicionar testes unitários e e2e de máscara monetária

---

## 📈 ANÁLISE DE PADRÕES

### **Módulos Afetados**
- **Despesas**: 3 bugs (100%)

### **Status dos Bugs**
- **Concluído**: 2 bugs (66.7%)
- **Pronto pra teste**: 1 bug (33.3%)

### **Categorias**
- **Bug**: 3 bugs (100%)

### **Tendências Identificadas**
1. **Concentração no Módulo de Despesas**: Todos os bugs estão relacionados ao fluxo de confirmação de pagamento
2. **Problemas de UX**: Foco em melhorias de interface e validação de campos
3. **Alta Taxa de Resolução**: 66.7% dos bugs já foram concluídos

---

## 🎯 RECOMENDAÇÕES

### **Para Desenvolvimento**
1. **Padronizar Componentes**: Criar componentes reutilizáveis para campos monetários
2. **Melhorar Validação**: Implementar validações mais robustas nos formulários
3. **Testes Automatizados**: Expandir cobertura de testes e2e para fluxos críticos

### **Para QA**
1. **Foco em Despesas**: Priorizar testes no módulo de despesas
2. **Testes de Máscara**: Validar formatação monetária em diferentes cenários
3. **Testes de Responsividade**: Verificar comportamento em mobile

### **Para Produto**
1. **Revisão de UX**: Avaliar fluxo de confirmação de pagamento
2. **Documentação**: Criar guias para usuários sobre campos obrigatórios
3. **Feedback**: Coletar feedback dos usuários sobre a experiência atual

---

## 🔗 LINKS ÚTEIS

- **Database Original**: https://www.notion.so/28ecd984590f806eaa85ceb72a6e816c
- **Bug #1**: https://www.notion.so/28ecd984590f80bda0e4d86f4fb5debf
- **Bug #2**: https://www.notion.so/28ecd984590f8016a140e38cca5476a5
- **Bug #3**: https://www.notion.so/28ecd984590f806ead4ce7cb191c4fe7

---

**Relatório gerado automaticamente pelo Bridge Metrics System**  
**Data**: 2025-10-17  
**Sistema**: Notion MCP Integration
