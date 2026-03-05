<?php
// Configurações do banco de dados
$host     = "localhost";
$db_name  = "gestao_projetos";
$username = "root";    // Altere se necessário
$password = "";        // Altere se necessário

try {
    $conn = new PDO("mysql:host=$host;dbname=$db_name;charset=utf8", $username, $password);
    $conn->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
} catch(PDOException $e) {
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => 'Erro na conexão com o banco de dados.']);
    exit;
}
?>
