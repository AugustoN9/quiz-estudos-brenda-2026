// Configuração do Cliente Supabase
const SUPABASE_URL = 'https://ocmjbfwvfznmyadfputs.supabase.co';
const SUPABASE_KEY = 'sb_publishable_OaH32KQANvAqMKR0ygVvUA_gYK0ZCI2'; 

// Inicializa a conexão global
const supabaseClient = window.supabase ? window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY) : null;

// --- FUNÇÕES DE BANCO DE DADOS ---

// 1. Cadastrar novo aluno
async function dbCadastrarAluno(alunoData) {
    if (!supabaseClient) throw new Error("Supabase não carregado");

    const { data, error } = await supabaseClient
        .from('alunos')
        .insert([{
            nome: alunoData.nome,
            data_nascimento: alunoData.dob,
            whatsapp: alunoData.whatsapp,
            is_responsavel: alunoData.isGuardian,
            nome_responsavel: alunoData.guardianName,
            senha: alunoData.senha
        }])
        .select();

    if (error) throw error;
    return data[0];
}

// 2. Realizar login por WhatsApp e Senha
async function dbFazerLogin(whatsapp, senha) {
    if (!supabaseClient) throw new Error("Supabase não carregado");

    const { data, error } = await supabaseClient
        .from('alunos')
        .select('*')
        .eq('whatsapp', whatsapp)
        .eq('senha', senha)
        .single();

    if (error) throw error;
    return data;
}

// 3. Salvar desempenho do quiz ao finalizar
async function dbSalvarHistoricoQuiz(payload) {
    if (!supabaseClient) return null;

    const { data, error } = await supabaseClient
        .from('historico_quiz')
        .insert([payload]);

    if (error) {
        console.error("Erro ao gravar histórico no banco:", error);
        return null;
    }
    return data;
}

// 4. Buscar histórico de um aluno para o relatório
async function dbBuscarHistorico(alunoId) {
    if (!supabaseClient) return [];

    const { data, error } = await supabaseClient
        .from('historico_quiz')
        .select('*')
        .eq('aluno_id', alunoId)
        .order('created_at', { ascending: false });

    if (error) {
        console.error("Erro ao carregar histórico:", error);
        return [];
    }
    return data;
}

// 5. Atualizar senha do aluno logado
async function dbAtualizarSenha(alunoId, novaSenha) {
    if (!supabaseClient) throw new Error("Supabase não carregado");

    const { data, error } = await supabaseClient
        .from('alunos')
        .update({ senha: novaSenha })
        .eq('id', alunoId)
        .select();

    if (error) throw error;
    return data[0];
}