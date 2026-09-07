let questionsData = {};
let currentQuestions = [];
let currentIndex = 0;
let score = 0;

// Variáveis para o Modo Leitura
let currentReadingPages = [];
let currentPageIndex = 0;

// Variáveis de Interação (Rotular Imagem e Associação de Colunas)
let selectedLabel = null;
let currentFilledAnswers = {};

// Histórico de navegação
let navigationStack = [];
let currentSubtopicTitle = "";

// Carregar dados do JSON
fetch('js/questions.json')
    .then(response => response.json())
    .then(data => { 
        questionsData = data; 
        showMainMenu(); 
    })
    .catch(err => console.error("Erro ao carregar perguntas:", err));

// --- 1. GESTÃO DE MENUS DINÂMICOS ---

function showMainMenu() {
    navigationStack = [];
    updateMenuDisplay("Escolha uma Matéria", "Selecione a matéria para estudar!", false);
    
    const categories = Object.keys(questionsData);
    renderButtons(categories, (cat) => showSubjects(cat), questionsData, 'titulo');
}

function showSubjects(category) {
    navigationStack.push({ type: 'main' });
    const categoryData = questionsData[category];
    
    updateMenuDisplay(categoryData.titulo, "Escolha uma unidade específica:", true);
    
    const subjects = Object.keys(categoryData.materias);
    renderButtons(subjects, (sub) => showSubtopics(category, sub), categoryData.materias, 'titulo');
}

function showSubtopics(category, subject) {
    navigationStack.push({ type: 'subject', category: category });
    const subjectData = questionsData[category].materias[subject];
    
    updateMenuDisplay(subjectData.titulo, "Escolha o tópico para começar:", true);
    
    const subtopics = Object.keys(subjectData.subtopicos);
    
    renderButtons(subtopics, (stopicKey) => {
        const subtopicObj = subjectData.subtopicos[stopicKey];
        
        if (subtopicObj.tipo === "leitura") {
            startReading(subtopicObj.paginas);
        } else {
            startQuiz(subtopicObj.questoes, subtopicObj.titulo); 
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

    if (lastState.type === 'main') {
        showMainMenu();
    } else if (lastState.type === 'subject') {
        showSubjects(lastState.category);
    }
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

// CORREÇÃO: Parâmetro subtopicTitle adicionado com fallback vazio
function startQuiz(questionsList, subtopicTitle = "") {
    if (!questionsList || questionsList.length === 0) {
        alert("Este tópico ainda não possui questões cadastradas.");
        return;
    }

    currentQuestions = [...questionsList].sort(() => Math.random() - 0.5);
    currentIndex = 0;
    score = 0;
    currentSubtopicTitle = subtopicTitle;

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

    // TIPO 1: Rotular Imagem
    if (q.tipo === "rotular_imagem") {
        imgElement.style.display = 'none';
        renderRotularImagem(q);
        return;
    }

    // TIPO 2: Associação em Colunas
    if (q.tipo === "associacao_colunas") {
        imgElement.style.display = 'none';
        renderAssociacaoColunas(q);
        return;
    }

    // TIPO PADRÃO: Múltipla Escolha
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
                        <img src="${item.imagem}" class="coluna-imagem" alt="${item.id}">
                        <div class="coluna-alvo" id="col-target-${item.id}" onclick="onColunaTargetClick('${item.id}')">
                            Toque aqui para preencher
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

    const usedBtn = document.getElementById(`label-btn-${selectedLabel.idx}`);
    if (usedBtn) {
        usedBtn.classList.add('used');
        usedBtn.classList.remove('selected');
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

// --- 6. NAVEGAÇÃO E ENCERRAMENTO DO QUIZ ---

function goToNextQuestion() {
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
    const percent = (score / total) * 100;
    document.getElementById('score-text').innerText = `Você acertou ${score} de ${total}!`;

    const starsContainer = document.getElementById('star-rating');
    let stars = "";
    const starCount = Math.floor(percent / 20);
    for (let i = 0; i < 5; i++) stars += i < starCount ? "★" : "☆";
    starsContainer.innerText = stars;

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
    document.getElementById('quiz-screen').classList.add('hidden');
    document.getElementById('reading-screen').classList.add('hidden');
    document.getElementById('home-screen').classList.remove('hidden');
    
    currentQuestions = [];
    currentReadingPages = [];
    currentIndex = 0;
    score = 0;
    selectedLabel = null;
    currentFilledAnswers = {};

    document.getElementById('feedback').innerText = "";
    document.getElementById('next-container').classList.add('hidden');
}

function confirmExit() {
    if (confirm("Deseja mesmo encerrar? Seu progresso atual será mostrado no resultado final.")) {
        showResult();
    }
}