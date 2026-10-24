// --- LÓGICA DO DASHBOARD "MEU DESEMPENHO" ---

// Dicionário para exibição amigável dos nomes das Matérias
const subjectLabels = {
    'matematica': 'Matemática',
    'ciencias': 'Ciências',
    'portugues': 'Língua Portuguesa',
    'geografia': 'Geografia',
    'historia': 'História',
    'historia_2': 'História 2 (Lacunas)',
    'ingles': 'Língua Inglesa'
};

// Dicionário completo de tópicos amigáveis
const topicLabels = {
    // Matemática - Os Números e Operações
    'sistema_numeracao_decimal': 'Sistema de Numeração Decimal',
    'ordens_e_classes': 'Ordens e Classes',
    'comparacao': 'Comparação de Números',
    'arredondamento': 'Arredondamento',
    'adicao_numeros_naturais': 'Adição de Naturais',
    'propriedades_adicao': 'Propriedades da Adição',
    'subtracao_numeros_naturais': 'Subtração de Naturais',
    'operacao_inversa': 'Operação Inversa',
    'expressoes_numericas': 'Expressões Numéricas',
    'poliedros_e_nao_poliedros': 'Poliedros e Não Poliedros',
    'prismas_e_piramides': 'Prismas e Pirâmides',

    // Matemática - Números Decimais
    'decimais_nivel_1': 'Decimais: Frações e Ordens',
    'decimais_nivel_2': 'Decimais: Decomposição e Comparação',
    'decimais_nivel_3': 'Decimais: Operações com Frações',
    'decimais_nivel_4': 'Decimais: Cotidiano e Medidas',
    'decimais_nivel_5': 'Decimais: Multiplicação e Divisão',

    // Matemática - Grandezas e Medidas (quando gravado como nivel_X)
    'medidas_nivel_1': 'Medidas: Unidades de Comprimento',
    'medidas_nivel_2': 'Medidas: Problemas com Comprimento',
    'medidas_nivel_3': 'Medidas: Perímetro e Área',
    'medidas_nivel_4': 'Medidas: Malha Quadriculada',
    'medidas_nivel_5': 'Medidas: Volume e Capacidade',
    'nivel_1': 'Nível 1: Introdução e Conceitos',
    'nivel_2': 'Nível 2: Problemas e Operações',
    'nivel_3': 'Nível 3: Perímetro e Área',
    'nivel_4': 'Nível 4: Malhas e Figuras Planas',
    'nivel_5': 'Nível 5: Volume e Desafios',

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
    'fontes_e_usinas_eletricas': 'Usinas e Geração de Energia',

    // Língua Portuguesa
    'generos_narrativos': 'Contos, Fábulas e Mitos',
    'generos_jornalisticos': 'Notícias e Reportagens',
    'classes_palavras': 'Classes de Palavras',
    'pontuacao_acentuacao': 'Pontuação e Acentuação',

    // Geografia
    'diversidade_povo_brasileiro': 'Diversidade do Povo Brasileiro',
    'povos_indigenas_quilombolas': 'Indígenas e Quilombolas',
    'crescimento_populacao_brasileira': 'Crescimento da População',
    'populacao_total_brasil': 'População Total do Brasil',
    'territorio_brasileiro_ocupacao': 'Território e Ocupação',
    'migracoes_populacao': 'Migrações da População',
    'distribuicao_por_faixa_etaria': 'Faixa Etária e Pirâmide',
    'populacao_trabalho_brasil': 'População e Trabalho (PEA)',

    // História
    'historia_anterior_escrita': 'História Anterior à Escrita',
    'surgimento_primeiras_cidades': 'Surgimento das Primeiras Cidades',
    'cidadania_direitos_humanos': 'Cidadania e Direitos Humanos',
    'grandes_navegacoes_encontro_povos': 'Grandes Navegações e Povos',
    'completar_cap4': 'Cidadania e Direitos (Lacunas)',
    'completar_cap5': 'Navegações e Encontros (Lacunas)',

    // Língua Inglesa
    'telling_time': 'Telling Time (Que horas são?)',
    'daily_activities': 'Daily Activities (Rotina)',
    'hobbies_sports': 'Sports & Free Time (Lazer)'
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

    document.getElementById('home-screen').classList.add('hidden');
    if (document.getElementById('login-screen')) document.getElementById('login-screen').classList.add('hidden');
    if (document.getElementById('register-screen')) document.getElementById('register-screen').classList.add('hidden');
    if (document.getElementById('quiz-screen')) document.getElementById('quiz-screen').classList.add('hidden');
    if (document.getElementById('result-screen')) document.getElementById('result-screen').classList.add('hidden');

    const reportScreen = document.getElementById('report-screen');
    reportScreen.classList.remove('hidden');

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

// 3. Processar cálculos e agrupar por Matéria > Tópico
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

    const totalQuizzes = historico.length;
    const somaTotal = historico.reduce((acc, curr) => acc + Number(curr.aproveitamento_percentual), 0);
    const mediaGeral = Math.round(somaTotal / totalQuizzes);

    kpiCount.innerText = totalQuizzes;
    kpiAvg.innerText = `${mediaGeral}%`;

    // Agrupamento multinível: materia -> subtopico
    const materiasAgrupadas = {};

    historico.forEach(item => {
        const matKey = item.materia || 'outros';
        const subKey = item.subtopico || 'geral';

        if (!materiasAgrupadas[matKey]) {
            materiasAgrupadas[matKey] = {};
        }

        if (!materiasAgrupadas[matKey][subKey]) {
            materiasAgrupadas[matKey][subKey] = {
                tentativas: 0,
                somaPercentual: 0
            };
        }

        materiasAgrupadas[matKey][subKey].tentativas += 1;
        materiasAgrupadas[matKey][subKey].somaPercentual += Number(item.aproveitamento_percentual);
    });

    const topicosAbaixo70 = [];

    // Renderiza organizado por seções de Matéria
    Object.keys(materiasAgrupadas).forEach(matKey => {
        const nomeMateria = subjectLabels[matKey] || matKey.toUpperCase();
        const subtopicos = materiasAgrupadas[matKey];

        const section = document.createElement('div');
        section.className = 'report-subject-group';
        section.style.marginBottom = '20px';
        section.style.textAlign = 'left';

        // Cabeçalho da Matéria
        section.innerHTML = `
            <div style="display: flex; align-items: center; gap: 8px; margin: 14px 0 8px 0; border-bottom: 1.5px solid #cbd5e1; padding-bottom: 4px;">
                <span style="font-size: 0.8rem; background: #e0f2fe; color: #0369a1; font-weight: 800; padding: 2px 8px; border-radius: 4px; text-transform: uppercase; letter-spacing: 0.5px;">Matéria</span>
                <strong style="font-size: 1rem; color: #1e293b;">${nomeMateria}</strong>
            </div>
        `;

        Object.keys(subtopicos).forEach(subKey => {
            const item = subtopicos[subKey];
            const mediaTopico = Math.round(item.somaPercentual / item.tentativas);
            const nomeTopico = topicLabels[subKey] || subKey.replace(/_/g, ' ');
            const isBomDesempenho = mediaTopico >= 70;

            if (!isBomDesempenho) {
                topicosAbaixo70.push(`${nomeTopico} (${nomeMateria})`);
            }

            const row = document.createElement('div');
            row.className = 'report-topic-row';
            row.style.background = '#f8fafc';
            row.style.border = '1px solid #e2e8f0';
            row.style.borderRadius = '8px';
            row.style.padding = '10px 12px';
            row.style.marginBottom = '8px';

            row.innerHTML = `
                <div class="topic-header" style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px;">
                    <span style="font-weight: 600; font-size: 0.9rem; color: #334155;">
                        ${nomeTopico} 
                        <small style="font-size: 0.72rem; color: #64748b; font-weight: normal;">(${item.tentativas}x feito)</small>
                    </span>
                    <span style="font-weight: 800; font-size: 0.95rem; color: ${isBomDesempenho ? '#16a34a' : '#dc2626'};">${mediaTopico}%</span>
                </div>
                <div class="progress-track" style="width: 100%; height: 8px; background: #e2e8f0; border-radius: 4px; overflow: hidden;">
                    <div class="progress-bar ${isBomDesempenho ? 'progress-green' : 'progress-red'}" style="width: ${mediaTopico}%; height: 100%; background: ${isBomDesempenho ? '#22c55e' : '#ef4444'}; border-radius: 4px; transition: width 0.4s ease;"></div>
                </div>
            `;
            section.appendChild(row);
        });

        listContainer.appendChild(section);
    });

    // Dicas de Estudos
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