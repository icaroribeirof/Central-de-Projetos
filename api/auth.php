<?php
session_start();
require_once '../db_connect.php';

header('Content-Type: application/json');

// Captura a ação da URL (ex: ?action=login)
$action = $_GET['action'] ?? '';

// Captura o corpo da requisição JSON enviada pelo JavaScript
$input = file_get_contents('php://input');
$data = json_decode($input, true);

// --- LÓGICA DE CADASTRO ---
if ($action === 'register') {
    if (!isset($data['name']) || !isset($data['email']) || !isset($data['password'])) {
        echo json_encode(['success' => false, 'message' => 'Dados incompletos.']);
        exit;
    }

    $nome = $data['name'];
    $email = $data['email'];
    // Criptografa a senha para o banco de dados
    $senha = password_hash($data['password'], PASSWORD_DEFAULT);

    try {
        $stmt = $conn->prepare("INSERT INTO usuarios (nome, email, senha) VALUES (?, ?, ?)");
        $stmt->execute([$nome, $email, $senha]);
        echo json_encode(['success' => true, 'message' => 'Usuário cadastrado com sucesso!']);
    } catch (PDOException $e) {
        // Verifica se o erro é de duplicidade de e-mail
        if ($e->getCode() == 23000) {
            echo json_encode(['success' => false, 'message' => 'Este e-mail já está cadastrado.']);
        } else {
            echo json_encode(['success' => false, 'message' => 'Erro no banco: ' . $e->getMessage()]);
        }
    }
    exit;
}

// --- LÓGICA DE LOGIN ---
if ($action === 'login') {
    $email = $data['email'] ?? '';
    $senha = $data['password'] ?? '';

    try {
        $stmt = $conn->prepare("SELECT * FROM usuarios WHERE email = ?");
        $stmt->execute([$email]);
        $user = $stmt->fetch(PDO::FETCH_ASSOC);

        if ($user && password_verify($senha, $user['senha'])) {
            // Cria a sessão no servidor
            $_SESSION['user_id'] = $user['id'];
            $_SESSION['user_name'] = $user['nome'];
            echo json_encode(['success' => true]);
        } else {
            echo json_encode(['success' => false, 'message' => 'E-mail ou senha incorretos.']);
        }
    } catch (PDOException $e) {
        echo json_encode(['success' => false, 'message' => 'Erro no login: ' . $e->getMessage()]);
    }
    exit;
}

// --- LÓGICA DE LOGOUT (O que faltava para o botão Sair) ---
if ($action === 'logout') {
    // Limpa todas as variáveis de sessão
    $_SESSION = array();
    
    // Destrói o cookie da sessão se existir
    if (ini_get("session.use_cookies")) {
        $params = session_get_cookie_params();
        setcookie(session_name(), '', time() - 42000,
            $params["path"], $params["domain"],
            $params["secure"], $params["httponly"]
        );
    }

    // Destrói a sessão no servidor
    session_destroy();
    
    echo json_encode(['success' => true]);
    exit;
}

// Se chegar aqui sem uma ação válida
echo json_encode(['success' => false, 'message' => 'Ação inválida.']);
?>