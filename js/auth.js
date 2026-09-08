// Estado do usuário na sessão atual
let currentUser = JSON.parse(localStorage.getItem('quiz_user')) || null;

document.addEventListener('DOMContentLoaded', () => {
    updateUserBar();
});

// --- 1. NAVEGAÇÃO ENTRE TELAS ---

function openLoginScreen() {
    document.getElementById('home-screen').classList.add('hidden');
    document.getElementById('register-screen').classList.add('hidden');
    document.getElementById('login-screen').classList.remove('hidden');
}

function openRegisterScreen() {
    document.getElementById('home-screen').classList.add('hidden');
    document.getElementById('login-screen').classList.add('hidden');
    document.getElementById('register-screen').classList.remove('hidden');
}

function closeAuthScreens() {
    document.getElementById('login-screen').classList.add('hidden');
    document.getElementById('register-screen').classList.add('hidden');
    document.getElementById('home-screen').classList.remove('hidden');
}

function toggleGuardianField() {
    const isChecked = document.getElementById('reg-is-guardian').checked;
    const guardianWrapper = document.getElementById('guardian-name-wrapper');
    if (isChecked) {
        guardianWrapper.classList.remove('hidden');
    } else {
        guardianWrapper.classList.add('hidden');
    }
}

// --- 2. ATUALIZAÇÃO DA BARRA DE USUÁRIO ---

function updateUserBar() {
    const statusText = document.getElementById('user-status-text');
    const btnLogin = document.getElementById('btn-open-login');
    const btnReport = document.getElementById('btn-user-report');
    const btnChangePass = document.getElementById('btn-change-password');
    const btnLogout = document.getElementById('btn-user-logout');

    if (currentUser) {
        statusText.innerText = `Olá, ${currentUser.nome.split(' ')[0]}!`;
        btnLogin.classList.add('hidden');
        btnReport.classList.remove('hidden');
        if (btnChangePass) btnChangePass.classList.remove('hidden');
        btnLogout.classList.remove('hidden');
    } else {
        statusText.innerText = "Olá, Visitante!";
        btnLogin.classList.remove('hidden');
        btnReport.classList.add('hidden');
        if (btnChangePass) btnChangePass.classList.add('hidden');
        btnLogout.classList.add('hidden');
    }
}

// Nova função para alteração de senha
async function promptChangePassword() {
    if (!currentUser) return;

    const { value: formValues } = await Swal.fire({
        title: 'Alterar Senha',
        html: `
            <input type="password" id="swal-pass-atual" class="swal2-input" placeholder="Senha atual" style="width: 80%; font-size: 0.95rem;">
            <input type="password" id="swal-pass-nova" class="swal2-input" placeholder="Nova senha" style="width: 80%; font-size: 0.95rem;">
            <input type="password" id="swal-pass-confirma" class="swal2-input" placeholder="Confirmar nova senha" style="width: 80%; font-size: 0.95rem;">
        `,
        focusConfirm: false,
        showCancelButton: true,
        confirmButtonColor: '#1976d2',
        cancelButtonColor: '#64748b',
        confirmButtonText: 'Salvar Senha',
        cancelButtonText: 'Cancelar',
        preConfirm: () => {
            const passAtual = document.getElementById('swal-pass-atual').value;
            const passNova = document.getElementById('swal-pass-nova').value;
            const passConfirma = document.getElementById('swal-pass-confirma').value;

            if (!passAtual || !passNova || !passConfirma) {
                Swal.showValidationMessage('Preencha todos os campos!');
                return false;
            }
            if (passAtual !== currentUser.senha) {
                Swal.showValidationMessage('A senha atual digitada está incorreta.');
                return false;
            }
            if (passNova.length < 4) {
                Swal.showValidationMessage('A nova senha deve ter no mínimo 4 caracteres.');
                return false;
            }
            if (passNova !== passConfirma) {
                Swal.showValidationMessage('A confirmação não coincide com a nova senha.');
                return false;
            }
            return passNova;
        }
    });

    if (formValues) {
        Swal.fire({
            title: 'Atualizando...',
            allowOutsideClick: false,
            didOpen: () => Swal.showLoading()
        });

        try {
            await dbAtualizarSenha(currentUser.id, formValues);
            currentUser.senha = formValues;
            localStorage.setItem('quiz_user', JSON.stringify(currentUser));

            Swal.fire({
                title: 'Senha alterada!',
                text: 'Sua nova senha já está valendo para os próximos acessos.',
                icon: 'success',
                confirmButtonColor: '#1976d2'
            });
        } catch (err) {
            console.error("Erro ao alterar senha:", err);
            Swal.fire({
                title: 'Erro ao salvar',
                text: 'Não foi possível atualizar a senha no momento. Tente novamente.',
                icon: 'error',
                confirmButtonColor: '#1976d2'
            });
        }
    }
}

// --- 3. FLUXO DE CADASTRO REAL (SUPABASE) ---

async function handleRegister() {
    const nome = document.getElementById('reg-name').value.trim();
    const dob = document.getElementById('reg-dob').value;
    const whatsapp = document.getElementById('reg-whatsapp').value.trim();
    const isGuardian = document.getElementById('reg-is-guardian').checked;
    const guardianName = document.getElementById('reg-guardian-name').value.trim();

    if (!nome || !dob || !whatsapp) {
        Swal.fire({
            title: 'Campos obrigatórios',
            text: 'Por favor, preencha nome, data de nascimento e WhatsApp.',
            icon: 'warning',
            confirmButtonColor: '#1976d2'
        });
        return;
    }

    if (isGuardian && !guardianName) {
        Swal.fire({
            title: 'Responsável obrigatório',
            text: 'Informe o nome do responsável.',
            icon: 'warning',
            confirmButtonColor: '#1976d2'
        });
        return;
    }

    // Gera senha aleatória de 6 dígitos
    const senhaGerada = "BR" + Math.floor(1000 + Math.random() * 9000);

    const novoAluno = {
        nome,
        dob,
        whatsapp,
        isGuardian,
        guardianName: isGuardian ? guardianName : null,
        senha: senhaGerada
    };

    // Feedback visual de carregamento
    Swal.fire({
        title: 'Criando cadastro...',
        text: 'Salvando suas informações com segurança.',
        allowOutsideClick: false,
        didOpen: () => {
            Swal.showLoading();
        }
    });

    try {
        await dbCadastrarAluno(novoAluno);

        Swal.fire({
            title: 'Conta criada com sucesso!',
            html: `Simulação de envio via WhatsApp para <b>${whatsapp}</b>:<br><br>Sua senha de acesso é: <b style="font-size: 1.35rem; color: #1976d2;">${senhaGerada}</b>`,
            icon: 'success',
            confirmButtonColor: '#1976d2',
            confirmButtonText: 'Fazer Login'
        }).then(() => {
            openLoginScreen();
            document.getElementById('login-whatsapp').value = whatsapp;
            document.getElementById('login-password').value = senhaGerada;
        });
    } catch (err) {
        console.error("Erro no cadastro:", err);
        const errorMsg = err.message && err.message.includes('unique') 
            ? 'Este número de WhatsApp já possui uma conta cadastrada!' 
            : 'Ocorreu um erro ao conectar ao servidor. Tente novamente.';

        Swal.fire({
            title: 'Não foi possível cadastrar',
            text: errorMsg,
            icon: 'error',
            confirmButtonColor: '#1976d2'
        });
    }
}

// --- 4. FLUXO DE LOGIN REAL (SUPABASE) ---

async function handleLogin() {
    const whatsapp = document.getElementById('login-whatsapp').value.trim();
    const password = document.getElementById('login-password').value.trim();

    if (!whatsapp || !password) {
        Swal.fire({
            title: 'Dados incompletos',
            text: 'Informe seu WhatsApp e senha para acessar.',
            icon: 'warning',
            confirmButtonColor: '#1976d2'
        });
        return;
    }

    Swal.fire({
        title: 'Validando acesso...',
        allowOutsideClick: false,
        didOpen: () => {
            Swal.showLoading();
        }
    });

    try {
        const aluno = await dbFazerLogin(whatsapp, password);

        if (aluno) {
            currentUser = aluno;
            localStorage.setItem('quiz_user', JSON.stringify(currentUser));
            updateUserBar();

            Swal.fire({
                title: `Bem-vinda, ${currentUser.nome.split(' ')[0]}!`,
                text: 'Login confirmado. Seus resultados serão registrados!',
                icon: 'success',
                timer: 1500,
                showConfirmButton: false
            });

            closeAuthScreens();
        }
    } catch (err) {
        console.error("Erro no login:", err);
        Swal.fire({
            title: 'Acesso negado',
            text: 'WhatsApp ou senha incorretos. Verifique suas credenciais.',
            icon: 'error',
            confirmButtonColor: '#1976d2'
        });
    }
}

// --- 5. LOGOUT ---

function logoutUser() {
    Swal.fire({
        title: 'Sair da conta?',
        text: 'Você continuará podendo fazer os quizzes, mas como visitante.',
        icon: 'question',
        showCancelButton: true,
        confirmButtonColor: '#ef4444',
        cancelButtonColor: '#64748b',
        confirmButtonText: 'Sim, sair',
        cancelButtonText: 'Cancelar'
    }).then((result) => {
        if (result.isConfirmed) {
            currentUser = null;
            localStorage.removeItem('quiz_user');
            updateUserBar();
            closeAuthScreens();
        }
    });
}