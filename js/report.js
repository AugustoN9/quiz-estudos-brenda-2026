// --- LÓGICA DO DASHBOARD "MEU DESEMPENHO" ---

// Dicionário para exibir nomes amigáveis na interface
const topicLabels = {
    // Ciências
    'os_alimentos': 'Os Alimentos',
    'alimentos_saudavel': 'Alimentos Saudáveis',
    'sistema_digestorio': 'Sistema Digestório',
    'nutricao_corpo_humano': 'Nutrição do Corpo Humano',
    'transtornos_alimentares': 'Transtornos Alimentares',
    'respiracao_humana': 'Respiração Humana',
    'saude_sistema_respiratorio': 'Saúde do Sistema Respiratório',
    'circulacao_sanguinea': 'Circulação Sanguínea',
    'sistema_cardiovascular_organismo': 'O Sistema Cardiovascular',
    'saude_sistema_cardiovascular': 'Saúde Cardiovascular',
    'propriedades_fisicas_gerais': 'Propriedades dos Materiais',
    'conceitos_e_circuitos': 'Circuitos Elétricos',
    'fontes_e_usinas_eletricas': 'Usinas e Geração de Energia'
};

// 1. Abrir a tela de relatório e carregar dados
async function openReportScreen() {
    if (!currentUser) {
        Swal.fire({
            title: 'Acesso Restrito',
            text: 'Faça login para acompanhar seu histórico e desempenho.',
            icon: 'info',
            confirmButtonColor: '#1976d2'
        });
        return;
    }

    // Esconde as outras telas e exibe o relatório
    document.getElementById('home-screen').classList.add('hidden');
    if (document.getElementById('login-screen')) document.getElementById('login-screen').classList.add('hidden');
    if (document.getElementById('register-screen')) document.getElementById('register-screen').classList.add('hidden');
    if (document.getElementById('quiz-screen')) document.getElementById('quiz-screen').classList.add('hidden');
    if (document.getElementById('result-screen')) document.getElementById('result-screen').classList.add('hidden');
    
    const reportScreen = document.getElementById('report-screen');
    reportScreen.classList.remove('hidden');

    // Carregamento visual
    const listContainer = document.getElementById('report-topics-list');
    listContainer.innerHTML = '<p style="color: #64748b; font-size: 0.9rem;">Carregando seus resultados...</p>';

    try {
        const historico = await dbBuscarHistorico(currentUser.id);
        renderReportData(historico);
    } catch (err) {
        console.error("Erro ao buscar histórico:", err);
        listContainer.innerHTML = '<p style="color: #ef4444; font-size: 0.9rem;">Não foi possível carregar os dados. Tente novamente.</p>';
    }
}

// 2. Fechar a tela de relatório
function closeReportScreen() {
    document.getElementById('report-screen').classList.add('hidden');
    document.getElementById('home-screen').classList.remove('hidden');
}

// 3. Processar cálculos e montar os elementos no DOM
function renderReportData(historico) {
    const listContainer = document.getElementById('report-topics-list');
    const kpiCount = document.getElementById('kpi-quizzes-count');
    const kpiAvg = document.getElementById('kpi-avg-score');
    const boxRec = document.getElementById('report-recommendations');
    const txtRec = document.getElementById('recommendation-text');

    listContainer.innerHTML = '';

    if (!historico || historico.length === 0) {
        kpiCount.innerText = '0';
        kpiAvg.innerText = '0%';
        boxRec.classList.add('hidden');
        listContainer.innerHTML = '<p style="color: #64748b; font-size: 0.85rem; padding: 15px 0;">Você ainda não completou nenhum quiz conectado à sua conta. Faça seu primeiro quiz!</p>';
        return;
    }

    // KPIs Gerais
    const totalQuizzes = historico.length;
    const somaTotal = historico.reduce((acc, curr) => acc + Number(curr.aproveitamento_percentual), 0);
    const mediaGeral = Math.round(somaTotal / totalQuizzes);

    kpiCount.innerText = totalQuizzes;
    kpiAvg.innerText = `${mediaGeral}%`;

    // Agrupamento por subtópico
    const agrupado = {};
    historico.forEach(item => {
        const sub = item.subtopico;
        if (!agrupado[sub]) {
            agrupado[sub] = {
                tentativas: 0,
                somaPercentual: 0,
                materia: item.materia
            };
        }
        agrupado[sub].tentativas += 1;
        agrupado[sub].somaPercentual += Number(item.aproveitamento_percentual);
    });

    const topicosAbaixo70 = [];

    // Renderiza cada linha de tópico
    Object.keys(agrupado).forEach(subKey => {
        const item = agrupado[subKey];
        const mediaTopico = Math.round(item.somaPercentual / item.tentativas);
        const nomeLegivel = topicLabels[subKey] || subKey.replace(/_/g, ' ');
        const isBomDesempenho = mediaTopico >= 70;

        if (!isBomDesempenho) {
            topicosAbaixo70.push(nomeLegivel);
        }

        const row = document.createElement('div');
        row.className = 'report-topic-row';
        row.innerHTML = `
            <div class="topic-header">
                <span>${nomeLegivel} <small style="font-size: 0.72rem; color: #64748b;">(${item.tentativas}x feito)</small></span>
                <span style="font-weight: 700; color: ${isBomDesempenho ? '#16a34a' : '#dc2626'};">${mediaTopico}%</span>
            </div>
            <div class="progress-track">
                <div class="progress-bar ${isBomDesempenho ? 'progress-green' : 'progress-red'}" style="width: ${mediaTopico}%;"></div>
            </div>
        `;
        listContainer.appendChild(row);
    });

    // Bloco de recomendações pedagógicas de estudo
    if (topicosAbaixo70.length > 0) {
        boxRec.classList.remove('hidden');
        txtRec.innerHTML = `Vale a pena revisar com calma os seguintes temas onde seu aproveitamento ficou abaixo de 70%: <b>${topicosAbaixo70.join(', ')}</b>. Refazer as questões vai te ajudar a fixar melhor!`;
    } else {
        boxRec.classList.remove('hidden');
        boxRec.style.borderLeftColor = '#22c55e';
        boxRec.style.backgroundColor = '#f0fdf4';
        boxRec.style.color = '#15803d';
        txtRec.innerHTML = `🎉 Parabéns! Seu aproveitamento em todos os tópicos avaliados está acima de <b>70%</b>. Continue praticando!`;
    }
}