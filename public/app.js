// Bridge Frontend - JavaScript

// Estado da aplicação
const state = {
    selectedStrategy: 'nao-iniciado',
    projects: [],
    tasks: []
};

// Inicialização
document.addEventListener('DOMContentLoaded', () => {
    initializeStrategySelector();
    initializeForm();
    loadProjects();
    loadTasks();
    setupRefreshButton();
});

// ============================================================================
// Strategy Selector
// ============================================================================

function initializeStrategySelector() {
    const strategies = document.querySelectorAll('.strategy-option');
    
    // Define primeira estratégia como ativa
    strategies[0].classList.add('active');
    
    strategies.forEach(strategy => {
        strategy.addEventListener('click', () => {
            // Remove active de todas
            strategies.forEach(s => s.classList.remove('active'));
            
            // Adiciona active na clicada
            strategy.classList.add('active');
            
            // Atualiza estado
            state.selectedStrategy = strategy.dataset.strategy;
            
            // Mostra/esconde campo de filtro customizado
            const customFilterGroup = document.getElementById('customFilterGroup');
            if (state.selectedStrategy === 'custom') {
                customFilterGroup.style.display = 'block';
            } else {
                customFilterGroup.style.display = 'none';
            }
            
            console.log('Estratégia selecionada:', state.selectedStrategy);
        });
    });
}

// ============================================================================
// Form Handling
// ============================================================================

function initializeForm() {
    const form = document.getElementById('configForm');
    
    // Handler de submit
    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        await handleFormSubmit();
    });
}

async function handleFormSubmit() {
    const submitBtn = document.getElementById('submitBtn');
    const resultsSection = document.getElementById('resultsSection');
    const resultsContent = document.getElementById('resultsContent');
    
    // Coleta dados do formulário
    const formData = {
        notionDatabaseUrl: document.getElementById('notionDatabaseUrl').value,
        projectName: document.getElementById('projectName').value,
        githubRepo: document.getElementById('githubRepo').value || null,
        autoCommit: document.getElementById('autoCommit').checked,
        strategy: state.selectedStrategy,
        customFilter: state.selectedStrategy === 'custom' 
            ? document.getElementById('customFilter').value 
            : null
    };
    
    // Validação
    if (!formData.notionDatabaseUrl || !formData.projectName) {
        showError('Por favor, preencha todos os campos obrigatórios');
        return;
    }
    
    // Desabilita botão e mostra loading
    submitBtn.disabled = true;
    submitBtn.classList.add('loading');
    
    try {
        // Envia requisição
        const response = await fetch('/api/bug-resolver', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(formData)
        });
        
        const result = await response.json();
        
        // Mostra resultado
        resultsSection.style.display = 'block';
        
        if (result.success) {
            resultsContent.innerHTML = createSuccessResult(result);
            
            // Recarrega lista de tarefas
            setTimeout(() => loadTasks(), 1000);
        } else {
            resultsContent.innerHTML = createErrorResult(result);
        }
        
        // Scroll para resultados
        resultsSection.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        
    } catch (error) {
        console.error('Erro ao enviar requisição:', error);
        resultsSection.style.display = 'block';
        resultsContent.innerHTML = createErrorResult({
            error: 'Erro de conexão com o servidor',
            message: error.message
        });
    } finally {
        // Reabilita botão
        submitBtn.disabled = false;
        submitBtn.classList.remove('loading');
    }
}

// ============================================================================
// Projects Loading
// ============================================================================

async function loadProjects() {
    const projectSelect = document.getElementById('projectName');
    
    try {
        const response = await fetch('/api/projects');
        const data = await response.json();
        
        if (data.success && data.projects) {
            state.projects = data.projects;
            
            // Popula select de projetos principais
            const mainProjects = data.projects.filter(p => p.type === 'main');
            
            projectSelect.innerHTML = '<option value="">Selecione um projeto</option>';
            mainProjects.forEach(project => {
                const option = document.createElement('option');
                option.value = project.name;
                option.textContent = project.name;
                projectSelect.appendChild(option);
            });
        }
    } catch (error) {
        console.error('Erro ao carregar projetos:', error);
        projectSelect.innerHTML = '<option value="">Erro ao carregar projetos</option>';
    }
}


// ============================================================================
// Tasks Loading
// ============================================================================

async function loadTasks() {
    const tasksList = document.getElementById('tasksList');
    
    try {
        const response = await fetch('/api/tasks');
        const data = await response.json();
        
        if (data.success && data.tasks) {
            state.tasks = data.tasks;
            
            if (data.tasks.length === 0) {
                tasksList.innerHTML = '<div class="loading">Nenhuma tarefa encontrada</div>';
            } else {
                tasksList.innerHTML = data.tasks.slice(0, 10).map(task => createTaskItem(task)).join('');
            }
        }
    } catch (error) {
        console.error('Erro ao carregar tarefas:', error);
        tasksList.innerHTML = '<div class="loading">Erro ao carregar tarefas</div>';
    }
}

function setupRefreshButton() {
    const refreshBtn = document.getElementById('refreshTasksBtn');
    refreshBtn.addEventListener('click', () => {
        loadTasks();
        refreshBtn.querySelector('.btn-icon').style.transform = 'rotate(360deg)';
        setTimeout(() => {
            refreshBtn.querySelector('.btn-icon').style.transform = 'rotate(0deg)';
        }, 500);
    });
}

// ============================================================================
// UI Helpers
// ============================================================================

function createSuccessResult(result) {
    const strategy = getStrategyName(state.selectedStrategy);
    
    return `
        <div class="result-success">
            <div class="result-title">
                ✅ Tarefa Criada com Sucesso!
            </div>
            <div class="result-message">
                <strong>Estratégia:</strong> ${strategy}<br>
                <strong>ID da Tarefa:</strong> <code>${result.taskId}</code>
            </div>
            <div class="result-details">
                ${result.message}
            </div>
            ${result.nextSteps ? `
                <div class="result-title" style="font-size: 1rem; margin-top: 1rem;">
                    📋 Próximos Passos:
                </div>
                <ul class="result-steps">
                    ${result.nextSteps.map(step => `<li>${step}</li>`).join('')}
                </ul>
            ` : ''}
        </div>
    `;
}

function createErrorResult(result) {
    return `
        <div class="result-error">
            <div class="result-title">
                ❌ Erro ao Criar Tarefa
            </div>
            <div class="result-message">
                ${result.error || 'Erro desconhecido'}
            </div>
            ${result.help ? `
                <div class="result-details">
                    💡 ${result.help}
                </div>
            ` : ''}
        </div>
    `;
}

function createTaskItem(task) {
    const date = new Date(task.timestamp).toLocaleString('pt-BR');
    const status = task.status || 'pending';
    const projectInfo = task.data ? 
        `${task.data.projectName || 'N/A'}` :
        'N/A';
    
    return `
        <div class="task-item">
            <div class="task-header">
                <div class="task-id">${task.id}</div>
                <div class="task-status ${status}">${getStatusText(status)}</div>
            </div>
            <div class="task-info">
                📁 ${projectInfo}
            </div>
            <div class="task-timestamp">
                🕐 ${date}
            </div>
        </div>
    `;
}

function getStrategyName(strategy) {
    const strategies = {
        'nao-iniciado': 'Bugs Não Iniciados',
        'reprovado': 'Bugs Reprovados',
        'em-andamento': 'Bugs Em Andamento',
        'prioridade-alta': 'Alta Prioridade',
        'todos-pendentes': 'Todos os Pendentes',
        'custom': 'Personalizado'
    };
    return strategies[strategy] || strategy;
}

function getStatusText(status) {
    const statusMap = {
        'pending': '⏳ Pendente',
        'in_progress': '⚡ Em Progresso',
        'completed': '✅ Concluído',
        'error': '❌ Erro'
    };
    return statusMap[status] || status;
}

function showError(message) {
    const resultsSection = document.getElementById('resultsSection');
    const resultsContent = document.getElementById('resultsContent');
    
    resultsSection.style.display = 'block';
    resultsContent.innerHTML = createErrorResult({ error: message });
    resultsSection.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}

// ============================================================================
// Status Check
// ============================================================================

// Verifica conexão com servidor a cada 30 segundos
setInterval(async () => {
    try {
        const response = await fetch('/api/projects');
        const statusDot = document.querySelector('.status-dot');
        const statusText = document.querySelector('.status-text');
        
        if (response.ok) {
            statusDot.style.background = 'var(--success)';
            statusText.textContent = 'Conectado';
        } else {
            statusDot.style.background = 'var(--warning)';
            statusText.textContent = 'Conectado com erros';
        }
    } catch (error) {
        const statusDot = document.querySelector('.status-dot');
        const statusText = document.querySelector('.status-text');
        statusDot.style.background = 'var(--danger)';
        statusText.textContent = 'Desconectado';
    }
}, 30000);

