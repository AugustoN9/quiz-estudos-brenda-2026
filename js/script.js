let questions = {};
let currentQuestions = [];
let currentIndex = 0;
let score = 0;

// Carregar dados do JSON
fetch('js/questions.json')
    .then(response => response.json())
    .then(data => { questions = data; });

function startQuiz(category) {
    if (!questions[category]) return alert("Categoria não encontrada!");
    
    // Filtra e embaralha as questões da categoria
    currentQuestions = [...questions[category]].sort(() => Math.random() - 0.5);
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
    const counter = document.getElementById('question-counter'); // Elemento para ( 1 / 20 )

    // 1. Atualiza o contador no topo (Ex: 1 / 20)
    if (counter) {
        counter.innerText = `${currentIndex + 1} / ${currentQuestions.length}`;
    }
    
    // 2. Limpa o feedback anterior
    feedback.innerText = "";
    
    // 3. Atualiza o texto da pergunta
    document.getElementById('question-text').innerText = q.pergunta;

    // --- LÓGICA DE IMAGEM ---
    let imgElement = document.getElementById('quiz-image');
    if (!imgElement) {
        imgElement = document.createElement('img');
        imgElement.id = 'quiz-image';
        imgElement.style.maxWidth = '100%';
        imgElement.style.borderRadius = '8px';
        imgElement.style.marginBottom = '15px';
        // Insere a imagem antes das opções
        quizScreen.insertBefore(imgElement, container);
    }

    if (q.imagem) {
        imgElement.src = q.imagem;
        imgElement.style.display = 'block';
    } else {
        imgElement.style.display = 'none';
    }

    // --- LÓGICA DAS ALTERNATIVAS ---
    container.innerHTML = "";

    // Mapeia o texto ao índice original para não perder a resposta correta após o sorteio
    let choices = q.alternativas.map((text, index) => {
        return { text: text, index: index };
    });

    // Embaralha a ordem das alternativas
    choices.sort(() => Math.random() - 0.5);

    // Cria os botões das alternativas
    choices.forEach(choice => {
        const btn = document.createElement('button');
        btn.innerText = choice.text;
        
        // Compara o índice original (choice.index) com o correto do JSON (q.correta)
        btn.onclick = () => checkAnswer(choice.index, q.correta);
        container.appendChild(btn);
    });

    // --- LÓGICA DO BOTÃO SAIR (RODAPÉ) ---
    // Verifica se o rodapé já existe, senão cria para centralizar o botão
    let footer = document.querySelector('.quiz-footer');
    if (!footer) {
        footer = document.createElement('div');
        footer.className = 'quiz-footer';
        footer.style.marginTop = '20px';
        footer.style.display = 'flex';
        footer.style.justifyContent = 'center';
        
        const exitBtn = document.createElement('button');
        exitBtn.id = 'exit-btn';
        exitBtn.innerText = 'Sair do Quiz';
        exitBtn.onclick = () => confirmExit(); // Certifique-se de ter essa função definida
        
        footer.appendChild(exitBtn);
        quizScreen.appendChild(footer);
    }
}

function checkAnswer(selected, correct) {
    const feedback = document.getElementById('feedback');
    const nextContainer = document.getElementById('next-container');
    const optionsButtons = document.querySelectorAll('#options-container button');

    // Desabilita os botões de opção para o usuário não clicar várias vezes
    optionsButtons.forEach(btn => btn.disabled = true);

    if (selected === correct) {
        score++;
        feedback.innerText = "Parabéns você acertou!";
        feedback.style.color = "green";

        // --- EFEITO DUOLINGO (CONFETE) ---
        confetti({
            particleCount: 150,
            spread: 70,
            origin: { y: 0.6 },
            colors: ['#22cc11', '#55ff44', '#ffffff'] // Cores puxadas para o verde de sucesso
        });

    } else {
        feedback.innerText = "Estude mais e tente novamente!";
        feedback.style.color = "red";
    }

    // Em vez de usar o setTimeout automático, mostramos o botão de avançar
    nextContainer.classList.remove('hidden');
}

function goToNextQuestion() {
    const nextContainer = document.getElementById('next-container');
    
    // Esconde o botão de avançar para a próxima pergunta
    nextContainer.classList.add('hidden');
    
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
    
    for (let i = 0; i < 5; i++) {
        stars += i < starCount ? "★" : "☆";
    }
    starsContainer.innerText = stars;

    // Chuva de confete extra se acertar tudo (100%)
    if (percent === 100) {
        var duration = 3 * 1000;
        var end = Date.now() + duration;

        (function frame() {
            confetti({
                particleCount: 3,
                angle: 60,
                spread: 55,
                origin: { x: 0 },
                colors: ['#ffd700', '#ffffff'] // Ouro e Branco para a vitória
            });
            confetti({
                particleCount: 3,
                angle: 120,
                spread: 55,
                origin: { x: 1 },
                colors: ['#ffd700', '#ffffff']
            });

            if (Date.now() < end) {
                requestAnimationFrame(frame);
            }
        }());
    }
}

function confirmExit() {
    if (confirm("Deseja mesmo sair? Seu progresso atual será mostrado no ranking.")) {
        showResult(); // Leva para a tela de pontuação final
    }
}