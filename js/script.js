let questionsData = {};
let currentQuestions = [];
let currentIndex = 0;
let score = 0;

// Limite de pulos por quiz
const MAX_SKIPS = 3;
let skipsLeft = MAX_SKIPS;

// Variáveis para o Modo Leitura
let currentReadingPages = [];
let currentPageIndex = 0;

// Variáveis de Interação (Rotular Imagem e Associação de Colunas)
let selectedLabel = null;
let currentFilledAnswers = {};

// Histórico de navegação e contexto da sessão
let navigationStack = [];
let currentYearKey = "";
let currentSubtopicTitle = "";
let currentSubjectKey = "";
let currentSubtopicKey = "";

// Cache em memória para carregar sob demanda apenas os arquivos necessários
const loadedQuestionsByYear = {};

// Lista de Anos e Séries Suportados
const anosDisponiveis = [
    { key: "1_fundamental", label: "1º Ano Fundamental" },
    { key: "2_fundamental", label: "2º Ano Fundamental" },
    { key: "3_fundamental", label: "3º Ano Fundamental" },
    { key: "4_fundamental", label: "4º Ano Fundamental" },
    { key: "5_fundamental", label: "5º Ano Fundamental" },
    { key: "6_fundamental", label: "6º Ano Fundamental" },
    { key: "7_fundamental", label: "7º Ano Fundamental" },
    { key: "8_fundamental", label: "8º Ano Fundamental" },
    { key: "9_fundamental", label: "9º Ano Fundamental" },
    { key: "1_medio", label: "1º Ano Ensino Médio" },
    { key: "2_medio", label: "2º Ano Ensino Médio" },
    { key: "3_medio", label: "3º Ano Ensino Médio" }
];

// Garante execução tanto no DOMContentLoaded quanto em carregamento direto
if (document.readyState === 'loading') {
    document.addEventListener("DOMContentLoaded", showMainMenu);
} else {
    showMainMenu();
}

// --- 1. GESTÃO DE MENUS DINÂMICOS (SELEÇÃO DE ANO, MATÉRIA E SUBTÓPICO) ---

function showMainMenu() {
    navigationStack = [];
    currentYearKey = "";
    updateMenuDisplay("Selecione o Ano Escolar", "Escolha a etapa de ensino para estudar!", false);

    const container = document.getElementById('dynamic-menu');
    if (!container) return;
    
    container.innerHTML = "";

    // 1. Identifica o ano cadastrado do aluno (padrão: 5_fundamental se visitante)
    const userYearKey = (typeof currentUser !== 'undefined' && currentUser && currentUser.ano_escolar)
        ? currentUser.ano_escolar
        : '5_fundamental';

    const mainYearObj = anosDisponiveis.find(a => a.key === userYearKey) || anosDisponiveis[4];

    // 2. Card Principal de Destaque ("SEU ANO")
    const mainBtn = document.createElement('button');
    mainBtn.className = 'menu-card-btn';
    mainBtn.style.border = '2px solid #86efac';
    mainBtn.style.backgroundColor = '#f0fdf4';

    const badgeText = (typeof currentUser !== 'undefined' && currentUser) ? 'SEU ANO' : 'RECOMENDADO';
    mainBtn.innerHTML = `
        <span class="btn-text" style="font-weight: 700; color: #15803d;">${mainYearObj.label}</span>
        <span class="badge-novo" style="background-color: #bbf7d0; color: #14532d; font-size: 0.72rem; padding: 4px 8px; border-radius: 6px;">${badgeText}</span>
    `;
    mainBtn.onclick = () => handleYearSelection(mainYearObj.key);
    container.appendChild(mainBtn);

    // 3. Botão de Accordion ("Escolha um outro ano")
    const accordionToggle = document.createElement('button');
    accordionToggle.className = 'menu-card-btn';
    accordionToggle.id = 'toggle-other-years';
    accordionToggle.style.marginTop = '15px';
    accordionToggle.style.backgroundColor = '#f8fafc';
    accordionToggle.style.justifyContent = 'center';
    accordionToggle.style.gap = '10px';

    accordionToggle.innerHTML = `
        <span id="accordion-icon" style="color: #eab308; font-size: 0.9rem; transition: transform 0.2s ease;">▼</span>
        <span class="btn-text" style="color: #475569; font-size: 0.95rem;">Escolha um outro ano</span>
    `;

    // 4. Container colapsável com as outras séries
    const otherYearsContainer = document.createElement('div');
    otherYearsContainer.id = 'other-years-container';
    otherYearsContainer.className = 'category-list hidden';
    otherYearsContainer.style.marginTop = '10px';
    otherYearsContainer.style.paddingLeft = '8px';
    otherYearsContainer.style.borderLeft = '3px solid #e2e8f0';

    const outrosAnos = anosDisponiveis.filter(a => a.key !== mainYearObj.key);
    outrosAnos.forEach(ano => {
        const btn = document.createElement('button');
        btn.className = 'menu-card-btn';
        btn.style.fontSize = '0.9rem';
        btn.style.padding = '10px 14px';
        btn.innerHTML = `<span class="btn-text">${ano.label}</span>`;
        btn.onclick = () => handleYearSelection(ano.key);
        otherYearsContainer.appendChild(btn);
    });

    // Ação de expandir/recolher
    accordionToggle.onclick = () => {
        const isHidden = otherYearsContainer.classList.toggle('hidden');
        const icon = document.getElementById('accordion-icon');
        if (icon) {
            icon.style.transform = isHidden ? 'rotate(0deg)' : 'rotate(180deg)';
        }
    };

    container.appendChild(accordionToggle);
    container.appendChild(otherYearsContainer);
}

async function handleYearSelection(selectedYear) {
    if (typeof currentUser !== 'undefined' && currentUser && currentUser.ano_escolar && currentUser.ano_escolar !== selectedYear) {
        const confirmacao = await Swal.fire({
            title: 'Ano diferente do seu!',
            text: `Você está matriculado(a) no ${formatarAno(currentUser.ano_escolar)}. Deseja explorar os exercícios do ${formatarAno(selectedYear)} mesmo assim?`,
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#1976d2',
            cancelButtonColor: '#64748b',
            confirmButtonText: 'Sim, explorar',
            cancelButtonText: 'Voltar'
        });

        if (!confirmacao.isConfirmed) return;
    }

    const dadosAno = await loadYearQuestions(selectedYear);

    if (!dadosAno) {
        Swal.fire({
            title: 'Conteúdo em Preparação',
            text: `As questões do ${formatarAno(selectedYear)} ainda estão sendo elaboradas.`,
            icon: 'info',
            confirmButtonColor: '#1976d2',
            confirmButtonText: 'Entendido'
        });
        return;
    }

    currentYearKey = selectedYear;
    questionsData = dadosAno;
    showSubjects(selectedYear);
}

async function loadYearQuestions(yearKey) {
    if (loadedQuestionsByYear[yearKey]) {
        return loadedQuestionsByYear[yearKey];
    }

    try {
        const response = await fetch(`js/data/${yearKey}.json`);
        if (!response.ok) return null;
        const data = await response.json();
        loadedQuestionsByYear[yearKey] = data;
        return data;
    } catch (err) {
        console.warn(`Arquivo do ano ${yearKey} indisponível:`, err);
        return null;
    }
}

function showSubjects(yearKey) {
    navigationStack.push({ type: 'years' });

    updateMenuDisplay(`Matérias - ${formatarAno(yearKey)}`, "Escolha a matéria para começar:", true);

    const categories = Object.keys(questionsData);
    renderButtons(categories, (cat) => showSubjectUnits(cat), questionsData, 'titulo');
}

function showSubjectUnits(category) {
    navigationStack.push({ type: 'subjects', yearKey: currentYearKey });
    const categoryData = questionsData[category];

    updateMenuDisplay(categoryData.titulo, "Escolha uma unidade específica:", true);

    const subjects = Object.keys(categoryData.materias);
    renderButtons(subjects, (sub) => showSubtopics(category, sub), categoryData.materias, 'titulo');
}

function showSubtopics(category, subject) {
    navigationStack.push({ type: 'units', category: category });
    const subjectData = questionsData[category].materias[subject];

    updateMenuDisplay(subjectData.titulo, "Escolha o tópico para começar:", true);

    const subtopics = Object.keys(subjectData.subtopicos);

    renderButtons(subtopics, (stopicKey) => {
        const subtopicObj = subjectData.subtopicos[stopicKey];

        if (subtopicObj.tipo === "leitura") {
            startReading(subtopicObj.paginas);
        } else {
            startQuiz(subtopicObj.questoes, subtopicObj.titulo, category, stopicKey);
        }
    }, subjectData.subtopicos, 'titulo');
}

function renderButtons(keys, callback, dataSource = null, labelKey = null) {
    const container = document.getElementById('dynamic-menu');
    container.innerHTML = "";

    keys.forEach(key => {
        const item = dataSource ? dataSource[key] : null;
        const btn = document.createElement('button');
        btn.className = 'menu-card-btn';

        const label = (item && item[labelKey]) ? item[labelKey] : key.toUpperCase();
        const badgeHtml = (item && item.novo) ? '<span class="badge-novo">NOVO</span>' : '';

        btn.innerHTML = `
            <span class="btn-text">${label}</span>
            ${badgeHtml}
        `;

        btn.onclick = () => callback(key);
        container.appendChild(btn);
    });
}

function updateMenuDisplay(title, subtitle, showBack) {
    document.getElementById('menu-title').innerText = title;
    document.getElementById('menu-subtitle').innerText = subtitle;
    const backBtn = document.getElementById('back-menu-btn');
    if (showBack) backBtn.classList.remove('hidden');
    else backBtn.classList.add('hidden');
}

function goBackMenu() {
    const lastState = navigationStack.pop();
    if (!lastState) return;

    if (lastState.type === 'years') {
        showMainMenu();
    } else if (lastState.type === 'subjects') {
        showSubjects(lastState.yearKey);
    } else if (lastState.type === 'units') {
        showSubjectUnits(lastState.category);
    }
}

function formatarAno(key) {
    const encontrado = anosDisponiveis.find(a => a.key === key);
    return encontrado ? encontrado.label : key;
}

// --- 2. MODO LEITURA ---

function startReading(paginas) {
    currentReadingPages = paginas || [];
    currentPageIndex = 0;

    document.getElementById('home-screen').classList.add('hidden');
    document.getElementById('reading-screen').classList.remove('hidden');

    updateReadingPage();
}

function updateReadingPage() {
    const imgElement = document.getElementById('reading-image');
    imgElement.src = currentReadingPages[currentPageIndex];

    document.getElementById('prev-page').disabled = (currentPageIndex === 0);
    document.getElementById('next-page').innerText = 
        (currentPageIndex === currentReadingPages.length - 1) ? "Finalizar" : "Próximo";
}

function changePage(direction) {
    currentPageIndex += direction;

    if (currentPageIndex >= currentReadingPages.length) {
        confirmBackToMenu();
        return;
    }

    updateReadingPage();
    window.scrollTo(0, 0);
}

// --- 3. LÓGICA DO QUIZ ---

function startQuiz(questionsList, subtopicTitle = "", subjectKey = "", subtopicKey = "") {
    if (!questionsList || questionsList.length === 0) {
        if (typeof Swal !== "undefined") {
            Swal.fire({
                title: 'Em breve!',
                text: 'Este tópico ainda não possui questões cadastradas.',
                icon: 'info',
                confirmButtonColor: '#1976d2',
                confirmButtonText: 'Entendido'
            });
        } else {
            alert("Este tópico ainda não possui questões cadastradas.");
        }
        return;
    }

    currentQuestions = [...questionsList].sort(() => Math.random() - 0.5);
    currentIndex = 0;
    score = 0;
    skipsLeft = MAX_SKIPS;
    currentSubtopicTitle = subtopicTitle;
    currentSubjectKey = subjectKey;
    currentSubtopicKey = subtopicKey;

    document.getElementById('home-screen').classList.add('hidden');
    document.getElementById('quiz-screen').classList.remove('hidden');
    showQuestion();
}

function showQuestion() {
    const q = currentQuestions[currentIndex];
    const feedback = document.getElementById('feedback');
    const container = document.getElementById('options-container');
    const quizScreen = document.getElementById('quiz-screen');
    const counter = document.getElementById('question-counter');

    const skipBtn = document.getElementById('skip-btn');
    if (skipBtn) {
        if (skipsLeft > 0) {
            skipBtn.classList.remove('hidden');
            skipBtn.innerText = `Pular Pergunta (${skipsLeft} restantes) ↷`;
        } else {
            skipBtn.classList.add('hidden');
        }
    }

    const nextContainer = document.getElementById('next-container');
    if (nextContainer) nextContainer.classList.add('hidden');

    if (counter) {
        counter.innerText = `${currentIndex + 1} / ${currentQuestions.length}`;
    }

    feedback.innerText = "";
    document.getElementById('question-text').innerText = q.pergunta;

    let imgElement = document.getElementById('quiz-image');
    if (!imgElement) {
        imgElement = document.createElement('img');
        imgElement.id = 'quiz-image';
        quizScreen.insertBefore(imgElement, container);
    }

    if (q.tipo === "rotular_imagem") {
        imgElement.style.display = 'none';
        renderRotularImagem(q);
        return;
    }

    if (q.tipo === "associacao_colunas") {
        imgElement.style.display = 'none';
        renderAssociacaoColunas(q);
        return;
    }

    if (q.imagem) {
        imgElement.src = q.imagem;
        imgElement.style.display = 'block';
    } else {
        imgElement.style.display = 'none';
    }

    container.innerHTML = "";
    let choices = q.alternativas.map((text, index) => ({ text, index }));
    choices.sort(() => Math.random() - 0.5);

    choices.forEach(choice => {
        const btn = document.createElement('button');
        btn.innerText = choice.text;
        btn.onclick = () => checkAnswer(choice.index, q.correta);
        container.appendChild(btn);
    });
}

function checkAnswer(selected, correct) {
    const feedback = document.getElementById('feedback');
    const nextContainer = document.getElementById('next-container');
    const optionsButtons = document.querySelectorAll('#options-container button');

    const skipBtn = document.getElementById('skip-btn');
    if (skipBtn) skipBtn.classList.add('hidden');

    optionsButtons.forEach(btn => btn.disabled = true);

    if (selected === correct) {
        score++;
        feedback.innerText = "Parabéns você acertou!";
        feedback.style.color = "green";
        confetti({
            particleCount: 150,
            spread: 70,
            origin: { y: 0.6 },
            colors: ['#22cc11', '#55ff44', '#ffffff']
        });
    } else {
        feedback.innerText = "Estude mais e tente novamente!";
        feedback.style.color = "red";
    }
    nextContainer.classList.remove('hidden');
}

// --- 4. MECÂNICA: ROTULAR IMAGEM ---

function renderRotularImagem(q) {
    const container = document.getElementById('options-container');
    selectedLabel = null;
    currentFilledAnswers = {};

    container.innerHTML = `
        <div class="rotular-container">
            <img src="${q.imagem}" class="rotular-img" alt="Diagrama para rotular">
            ${q.alvos.map(alvo => `
                <div class="rotular-target" id="target-${alvo.id}"
                     style="top:${alvo.top}; left:${alvo.left}; width:${alvo.width}; height:${alvo.height};"
                     onclick="onTargetClick('${alvo.id}')">
                </div>
            `).join('')}
        </div>
        <div class="rotular-bank">
            ${q.etiquetas.map((txt, idx) => `
                <button class="rotular-btn" id="label-btn-${idx}" onclick="onSelectLabel('${txt}', ${idx})">
                    ${txt}
                </button>
            `).join('')}
        </div>
    `;
}

function onSelectLabel(texto, idx) {
    selectedLabel = { texto, idx };
    document.querySelectorAll('.rotular-btn, .coluna-btn').forEach(btn => btn.classList.remove('selected'));
    const activeBtn = document.getElementById(`label-btn-${idx}`);
    if (activeBtn) activeBtn.classList.add('selected');
}

function onTargetClick(targetId) {
    if (!selectedLabel) return;

    const targetEl = document.getElementById(`target-${targetId}`);

    if (currentFilledAnswers[targetId]) {
        const prevBtn = document.getElementById(`label-btn-${currentFilledAnswers[targetId].idx}`);
        if (prevBtn) prevBtn.classList.remove('used');
    }

    targetEl.innerText = selectedLabel.texto;
    targetEl.classList.add('filled');
    currentFilledAnswers[targetId] = { texto: selectedLabel.texto, idx: selectedLabel.idx };

    const usedBtn = document.getElementById(`label-btn-${selectedLabel.idx}`);
    if (usedBtn) {
        usedBtn.classList.add('used');
        usedBtn.classList.remove('selected');
    }
    selectedLabel = null;

    const currentQ = currentQuestions[currentIndex];
    if (Object.keys(currentFilledAnswers).length === currentQ.alvos.length) {
        validateRotularAnswers(currentQ);
    }
}

function validateRotularAnswers(q) {
    const feedback = document.getElementById('feedback');
    const nextContainer = document.getElementById('next-container');
    const skipBtn = document.getElementById('skip-btn');
    if (skipBtn) skipBtn.classList.add('hidden');

    let acertos = 0;

    q.alvos.forEach(alvo => {
        const el = document.getElementById(`target-${alvo.id}`);
        if (currentFilledAnswers[alvo.id] && currentFilledAnswers[alvo.id].texto === alvo.resposta) {
            el.classList.add('correct');
            acertos++;
        } else {
            el.classList.add('wrong');
        }
    });

    if (acertos === q.alvos.length) {
        score++;
        feedback.innerText = "Excelente! Você identificou todas as partes corretamente!";
        feedback.style.color = "green";
        confetti({
            particleCount: 150,
            spread: 70,
            origin: { y: 0.6 },
            colors: ['#22cc11', '#55ff44', '#ffffff']
        });
    } else {
        feedback.innerText = `Você acertou ${acertos} de ${q.alvos.length} partes. Revise os pontos marcados em vermelho!`;
        feedback.style.color = "red";
    }

    nextContainer.classList.remove('hidden');
}

// --- 5. MECÂNICA: ASSOCIAÇÃO EM COLUNAS ---

function renderAssociacaoColunas(q) {
    const container = document.getElementById('options-container');
    selectedLabel = null;
    currentFilledAnswers = {};

    container.innerHTML = `
        <div class="colunas-wrapper">
            ${q.titulo_atividade ? `<div class="colunas-title">${q.titulo_atividade}</div>` : ''}
            <div class="colunas-grid">
                ${q.itens.map(item => `
                    <div class="coluna-linha">
                        <img 
                            src="${item.imagem}" 
                            class="coluna-imagem" 
                            alt="${item.id}"
                            style="width: 58px !important; height: 58px !important; min-width: 58px !important; max-width: 58px !important; border-radius: 50% !important; object-fit: cover !important; flex-shrink: 0 !important; display: block;"
                        >
                        <div class="coluna-alvo" id="col-target-${item.id}" onclick="onColunaTargetClick('${item.id}')">
                            Toque para preencher
                        </div>
                    </div>
                `).join('')}
            </div>
            <div class="colunas-bank">
                ${q.etiquetas.map((txt, idx) => `
                    <button class="coluna-btn" id="label-btn-${idx}" onclick="onSelectLabel('${txt}', ${idx})">
                        ${txt}
                    </button>
                `).join('')}
            </div>
        </div>
    `;
}

function onColunaTargetClick(targetId) {
    if (!selectedLabel) return;

    const targetEl = document.getElementById(`col-target-${targetId}`);

    if (currentFilledAnswers[targetId]) {
        const prevBtn = document.getElementById(`label-btn-${currentFilledAnswers[targetId].idx}`);
        if (prevBtn) prevBtn.classList.remove('used');
    }

    targetEl.innerText = selectedLabel.texto;
    targetEl.classList.add('filled');
    currentFilledAnswers[targetId] = { texto: selectedLabel.texto, idx: selectedLabel.idx };

    const promptBtn = document.getElementById(`label-btn-${selectedLabel.idx}`);
    if (promptBtn) {
        promptBtn.classList.add('used');
        promptBtn.classList.remove('selected');
    }
    selectedLabel = null;

    const currentQ = currentQuestions[currentIndex];
    if (Object.keys(currentFilledAnswers).length === currentQ.itens.length) {
        validateColunaAnswers(currentQ);
    }
}

function validateColunaAnswers(q) {
    const feedback = document.getElementById('feedback');
    const nextContainer = document.getElementById('next-container');
    const skipBtn = document.getElementById('skip-btn');
    if (skipBtn) skipBtn.classList.add('hidden');

    let acertos = 0;

    q.itens.forEach(item => {
        const el = document.getElementById(`col-target-${item.id}`);
        if (currentFilledAnswers[item.id] && currentFilledAnswers[item.id].texto === item.resposta) {
            el.classList.add('correct');
            acertos++;
        } else {
            el.classList.add('wrong');
        }
    });

    if (acertos === q.itens.length) {
        score++;
        feedback.innerText = "Excelente! Você associou todas as usinas corretamente!";
        feedback.style.color = "green";
        confetti({
            particleCount: 150,
            spread: 70,
            origin: { y: 0.6 },
            colors: ['#22cc11', '#55ff44', '#ffffff']
        });
    } else {
        feedback.innerText = `Você acertou ${acertos} de ${q.itens.length} usinas. Tente memorizar as marcadas em vermelho!`;
        feedback.style.color = "red";
    }

    nextContainer.classList.remove('hidden');
}

// --- 6. NAVEGAÇÃO, ENCERRAMENTO E ALERTAS COM SWEETALERT2 ---

function goToNextQuestion() {
    document.getElementById('next-container').classList.add('hidden');
    currentIndex++;
    if (currentIndex < currentQuestions.length) {
        showQuestion();
    } else {
        showResult();
    }
}

function skipQuestion() {
    const skipBtn = document.getElementById('skip-btn');

    if (skipsLeft <= 0) {
        if (skipBtn) skipBtn.classList.add('hidden');
        return;
    }

    skipsLeft--;

    const mensagemAviso = skipsLeft === 1
        ? 'Você ainda pode pular 1 pergunta.'
        : (skipsLeft === 0 ? 'Você utilizou todos os seus 3 pulos!' : `Você ainda pode pular mais ${skipsLeft} perguntas.`);

    if (typeof Swal !== "undefined") {
        Swal.fire({
            title: 'Pergunta pulada!',
            text: mensagemAviso,
            icon: 'info',
            timer: 1500,
            showConfirmButton: false
        });
    }

    if (skipsLeft === 0 && skipBtn) {
        skipBtn.classList.add('hidden');
    }

    selectedLabel = null;
    currentFilledAnswers = {};

    const feedback = document.getElementById('feedback');
    if (feedback) feedback.innerText = "";
    document.getElementById('next-container').classList.add('hidden');

    currentIndex++;
    if (currentIndex < currentQuestions.length) {
        showQuestion();
    } else {
        showResult();
    }
}

function showResult() {
    document.getElementById('quiz-screen').classList.add('hidden');
    document.getElementById('result-screen').classList.remove('hidden');

    const subtopicElement = document.getElementById('result-subtopic');
    if (subtopicElement) {
        subtopicElement.innerText = currentSubtopicTitle;
    }

    const total = currentQuestions.length;
    const percent = Math.round((score / total) * 100);
    document.getElementById('score-text').innerText = `Você acertou ${score} de ${total}! (${percent}%)`;

    const starsContainer = document.getElementById('star-rating');
    let stars = "";
    const starCount = Math.floor(percent / 20);
    for (let i = 0; i < 5; i++) stars += i < starCount ? "★" : "☆";
    starsContainer.innerText = stars;

    if (typeof currentUser !== 'undefined' && currentUser && typeof dbSalvarHistoricoQuiz === 'function') {
        const pulosGastos = MAX_SKIPS - skipsLeft;

        const payload = {
            aluno_id: currentUser.id,
            materia: currentSubjectKey || 'ciencias',
            subtopico: currentSubtopicKey || 'geral',
            total_questoes: total,
            acertos: score,
            pulos_utilizados: pulosGastos,
            aproveitamento_percentual: percent
        };

        dbSalvarHistoricoQuiz(payload)
            .then(() => console.log("Resultado registrado no Supabase com sucesso."))
            .catch(err => console.error("Erro ao registrar resultado no Supabase:", err));
    }

    if (percent === 100) {
        const end = Date.now() + 3000;
        (function frame() {
            confetti({ particleCount: 3, angle: 60, spread: 55, origin: { x: 0 }, colors: ['#ffd700', '#ffffff'] });
            confetti({ particleCount: 3, angle: 120, spread: 55, origin: { x: 1 }, colors: ['#ffd700', '#ffffff'] });
            if (Date.now() < end) requestAnimationFrame(frame);
        }());
    }
}

function confirmBackToMenu() {
    const quizScreen = document.getElementById('quiz-screen');
    const isQuizActive = quizScreen && !quizScreen.classList.contains('hidden');

    if (isQuizActive && typeof Swal !== "undefined") {
        Swal.fire({
            title: 'Voltar aos tópicos?',
            text: 'O seu progresso nesta rodada será perdido.',
            icon: 'question',
            showCancelButton: true,
            confirmButtonColor: '#1976d2',
            cancelButtonColor: '#64748b',
            confirmButtonText: 'Sim, voltar',
            cancelButtonText: 'Continuar estudando'
        }).then((result) => {
            if (result.isConfirmed) {
                resetQuizAndGoHome();
            }
        });
        return;
    }

    resetQuizAndGoHome();
}

function resetQuizAndGoHome() {
    document.getElementById('quiz-screen').classList.add('hidden');
    document.getElementById('reading-screen').classList.add('hidden');
    document.getElementById('home-screen').classList.remove('hidden');

    currentQuestions = [];
    currentReadingPages = [];
    currentIndex = 0;
    score = 0;
    skipsLeft = MAX_SKIPS;
    selectedLabel = null;
    currentFilledAnswers = {};

    document.getElementById('feedback').innerText = "";
    document.getElementById('next-container').classList.add('hidden');
}

function confirmExit() {
    if (typeof Swal !== "undefined") {
        Swal.fire({
            title: 'Deseja mesmo encerrar?',
            text: 'Seu progresso atual será mostrado no resultado final.',
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#ef4444',
            cancelButtonColor: '#64748b',
            confirmButtonText: 'Sim, encerrar',
            cancelButtonText: 'Continuar'
        }).then((result) => {
            if (result.isConfirmed) {
                showResult();
            }
        });
    } else if (confirm("Deseja mesmo encerrar? Seu progresso atual será mostrado no resultado final.")) {
        showResult();
    }
}