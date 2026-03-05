/**
 * Lógica do Dashboard - Sistema de Gestão de Projetos
 */

// Função de logout exposta globalmente
window.logout = async function() {
    try {
        console.log("Iniciando processo de logout...");
        
        // Faz a chamada para a API destruir a sessão no PHP
        const response = await fetch('api/auth.php?action=logout');
        const result = await response.json();
        
        if (result.success) {
            // Limpa qualquer resquício de dados locais por segurança
            sessionStorage.clear();
            localStorage.clear();
            
            // Redireciona para a tela de login
            window.location.href = 'index.php';
        } else {
            console.error("Erro retornado pela API de logout.");
            window.location.href = 'index.php';
        }
    } catch (error) {
        console.error('Erro de conexão ao tentar sair:', error);
        // Fallback: se a rede falhar, força o redirecionamento
        window.location.href = 'index.php';
    }
};

// Garante que as interações da página funcionem após o carregamento do DOM
document.addEventListener('DOMContentLoaded', () => {
    
    // Como o nome do usuário agora vem direto pelo PHP no dashboard.php 
    // (através do echo $_SESSION['user_name']), não precisamos mais da 
    // função renderWelcomeMessage que buscava no localStorage.

    // Seleciona o botão de sair na navbar
    const btnLogout = document.querySelector('.logout-btn');
    
    if (btnLogout) {
        // Vincula o evento de clique ao botão de sair
        btnLogout.addEventListener('click', (e) => {
            e.preventDefault();
            window.logout();
        });
    }

    console.log("Dashboard carregado e pronto.");
});