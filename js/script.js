let questionsData = {};
let currentQuestions = [];
let currentIndex = 0;
let score = 0;

// Variáveis para o Modo Leitura
let currentReadingPages = [];
let currentPageIndex = 0;

// Histórico de navegação para permitir a função "Voltar"
let navigationStack = [];

// Carregar dados do JSON
fetch('js/questions.json')
    .then(response => response.json())
    .then(data => { 
        questionsData = data; 
        showMainMenu(); // Inicia no menu principal após carregar
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
        
        // Verifica se o subtópico é do tipo LEITURA ou QUIZ
        if (subtopicObj.tipo === "leitura") {
            startReading(subtopicObj.paginas);
        } else {
            startQuiz(subtopicObj.questoes); 
        }
    }, subjectData.subtopicos, 'titulo');
}

function renderButtons(keys, callback, dataSource = null, labelKey = null) {
    const container = document.getElementById('dynamic-menu');
    container.innerHTML = "";

    keys.forEach(key => {
        const btn = document.createElement('button');
        btn.innerText = (dataSource && dataSource[key] && dataSource[key][labelKey]) 
                        ? dataSource[key][labelKey] 
                        : key.toUpperCase();
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

// --- 2. MODO LEITURA (NOVO) ---

function startReading(paginas) {
    currentReadingPages = paginas;
    currentPageIndex = 0;

    document.getElementById('home-screen').classList.add('hidden');
    document.getElementById('reading-screen').classList.remove('hidden');
    
    updateReadingPage();
}

function updateReadingPage() {
    const imgElement = document.getElementById('reading-image');
    imgElement.src = currentReadingPages[currentPageIndex];
    
    // Controle dos botões
    document.getElementById('prev-page').disabled = (currentPageIndex === 0);
    document.getElementById('next-page').innerText = 
        (currentPageIndex === currentReadingPages.length - 1) ? "Finalizar" : "Próximo";
}

function changePage(direction) {
    currentPageIndex += direction;

    if (currentPageIndex >= currentReadingPages.length) {
        confirmBackToMenu(); // Volta para o menu ao finalizar
        return;
    }
    
    updateReadingPage();
    window.scrollTo(0, 0); // Facilita a leitura voltando ao topo
}

// --- 3. LÓGICA DO QUIZ ---

function startQuiz(questionsList) {
    currentQuestions = [...questionsList].sort(() => Math.random() - 0.5);
    currentIndex = 0;
    score = 0;

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
    // Esconde todas as telas de jogo/leitura e volta para a principal
    document.getElementById('quiz-screen').classList.add('hidden');
    document.getElementById('reading-screen').classList.add('hidden');
    document.getElementById('home-screen').classList.remove('hidden');
    
    // Reseta estados
    currentQuestions = [];
    currentReadingPages = [];
    currentIndex = 0;
    score = 0;
    document.getElementById('feedback').innerText = "";
    document.getElementById('next-container').classList.add('hidden');
}

function confirmExit() {
    if (confirm("Deseja mesmo encerrar? Seu progresso atual será mostrado no resultado final.")) {
        showResult();
    }
}