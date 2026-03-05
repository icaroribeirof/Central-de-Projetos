<?php
session_start();
// Busca a conexão centralizada no arquivo db_connect.php
require_once '../db_connect.php';

header('Content-Type: application/json');

// Verifica se o usuário está logado
if (!isset($_SESSION['user_id'])) {
    echo json_encode(['success' => false, 'message' => 'Usuário não autenticado.']);
    exit;
}

$usuario_id = $_SESSION['user_id'];
$action = $_GET['action'] ?? '';
$data = json_decode(file_get_contents('php://input'), true);

switch ($action) {
    case 'load_all':
        try {
            // Busca itens do backlog vinculados ao usuário
            $stmt1 = $conn->prepare("SELECT id, titulo, tipo, prioridade, status, storypoints, descricao FROM backlog WHERE usuario_id = ? ORDER BY id DESC");
            $stmt1->execute([$usuario_id]);
            $backlog = $stmt1->fetchAll(PDO::FETCH_ASSOC);

            // Busca Sprints vinculadas ao usuário
            $stmt2 = $conn->prepare("SELECT id, nome_sprint, data_inicio, data_fim, itens FROM sprints WHERE usuario_id = ? ORDER BY data_inicio ASC");
            $stmt2->execute([$usuario_id]);
            $sprints = $stmt2->fetchAll(PDO::FETCH_ASSOC);

            // Decodifica o JSON dos itens de cada sprint
            foreach ($sprints as &$sprint) {
                $sprint['itens'] = json_decode($sprint['itens'], true) ?: [];
            }

            echo json_encode(['success' => true, 'backlog' => $backlog, 'sprints' => $sprints]);
        } catch (Exception $e) {
            echo json_encode(['success' => false, 'message' => $e->getMessage()]);
        }
        break;

    case 'save_backlog_item':
        try {
            // Se o ID existir e não for vazio, faz UPDATE. 
            // Se o ID for nulo (caso do Mover), faz INSERT.
            if (isset($data['id']) && !empty($data['id'])) {
                $sql = "UPDATE backlog SET titulo=?, tipo=?, prioridade=?, status=?, storypoints=?, descricao=? 
                        WHERE id=? AND usuario_id=?";
                $stmt = $conn->prepare($sql);
                $stmt->execute([
                    $data['titulo'], $data['tipo'], $data['prioridade'], 
                    $data['status'], $data['storypoints'], $data['descricao'], 
                    $data['id'], $usuario_id
                ]);
            } else {
                $sql = "INSERT INTO backlog (usuario_id, titulo, tipo, prioridade, status, storypoints, descricao) 
                        VALUES (?, ?, ?, ?, ?, ?, ?)";
                $stmt = $conn->prepare($sql);
                $stmt->execute([
                    $usuario_id, $data['titulo'], $data['tipo'], 
                    $data['prioridade'], $data['status'], $data['storypoints'], $data['descricao']
                ]);
            }
            echo json_encode(['success' => true]);
        } catch (Exception $e) {
            echo json_encode(['success' => false, 'message' => $e->getMessage()]);
        }
        break;

    case 'save_sprint':
        try {
            $itens_json = json_encode($data['itens'] ?? []);
            if (isset($data['id']) && !empty($data['id'])) {
                $sql = "UPDATE sprints SET nome_sprint=?, data_inicio=?, data_fim=?, itens=? 
                        WHERE id=? AND usuario_id=?";
                $stmt = $conn->prepare($sql);
                $stmt->execute([
                    $data['nome_sprint'], $data['data_inicio'], $data['data_fim'], 
                    $itens_json, $data['id'], $usuario_id
                ]);
            } else {
                $sql = "INSERT INTO sprints (usuario_id, nome_sprint, data_inicio, data_fim, itens, status) 
                        VALUES (?, ?, ?, ?, ?, 'Novo')";
                $stmt = $conn->prepare($sql);
                $stmt->execute([
                    $usuario_id, $data['nome_sprint'], $data['data_inicio'], 
                    $data['data_fim'], $itens_json
                ]);
            }
            echo json_encode(['success' => true]);
        } catch (Exception $e) {
            echo json_encode(['success' => false, 'message' => $e->getMessage()]);
        }
        break;

    case 'delete_backlog_item':
        try {
            $stmt = $conn->prepare("DELETE FROM backlog WHERE id = ? AND usuario_id = ?");
            $stmt->execute([$data['id'], $usuario_id]);
            echo json_encode(['success' => true]);
        } catch (Exception $e) {
            echo json_encode(['success' => false, 'message' => $e->getMessage()]);
        }
        break;

    case 'delete_sprint':
        try {
            $stmt = $conn->prepare("DELETE FROM sprints WHERE id = ? AND usuario_id = ?");
            $stmt->execute([$data['id'], $usuario_id]);
            echo json_encode(['success' => true]);
        } catch (Exception $e) {
            echo json_encode(['success' => false, 'message' => $e->getMessage()]);
        }
        break;
}
?>