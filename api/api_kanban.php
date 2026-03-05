<?php
session_start();
require_once '../db_connect.php';

header('Content-Type: application/json');

if (!isset($_SESSION['user_id'])) {
    echo json_encode(['success' => false, 'message' => 'Acesso negado.']);
    exit;
}

$user_id = $_SESSION['user_id'];
$action  = $_GET['action'] ?? '';
$input   = file_get_contents('php://input');
$data    = json_decode($input, true);

try {
    // --- LISTAR TODOS OS QUADROS DO USUÁRIO ---
    if ($action === 'list_boards') {
        $stmt = $conn->prepare("SELECT id, nome FROM quadros WHERE usuario_id = ? ORDER BY id DESC");
        $stmt->execute([$user_id]);
        echo json_encode($stmt->fetchAll(PDO::FETCH_ASSOC));
    }

    // --- CRIAR NOVO QUADRO ---
    elseif ($action === 'create_board') {
        $nome = $data['name'] ?? 'Novo Quadro';
        $stmt = $conn->prepare("INSERT INTO quadros (usuario_id, nome) VALUES (?, ?)");
        $stmt->execute([$user_id, $nome]);
        echo json_encode(['success' => true, 'id' => $conn->lastInsertId()]);
    }

    // --- RENOMEAR QUADRO ---
    elseif ($action === 'rename_board') {
        $stmt = $conn->prepare("UPDATE quadros SET nome = ? WHERE id = ? AND usuario_id = ?");
        $stmt->execute([$data['name'], $data['id'], $user_id]);
        echo json_encode(['success' => true]);
    }

    // --- EXCLUIR QUADRO ---
    elseif ($action === 'delete_board') {
        $stmt = $conn->prepare("DELETE FROM quadros WHERE id = ? AND usuario_id = ?");
        $stmt->execute([$data['id'], $user_id]);
        echo json_encode(['success' => true]);
    }

    // --- LISTAR COLUNAS (com validação de dono do quadro) ---
    elseif ($action === 'list_columns') {
        $quadro_id = $_GET['quadro_id'] ?? 0;
        $check = $conn->prepare("SELECT id FROM quadros WHERE id = ? AND usuario_id = ?");
        $check->execute([$quadro_id, $user_id]);
        if (!$check->fetch()) {
            echo json_encode(['success' => false, 'message' => 'Acesso negado ao quadro.']);
            exit;
        }
        $stmt = $conn->prepare("SELECT * FROM kanban_colunas WHERE quadro_id = ? ORDER BY ordem ASC");
        $stmt->execute([$quadro_id]);
        echo json_encode($stmt->fetchAll(PDO::FETCH_ASSOC));
    }

    // --- ADICIONAR COLUNA (com validação de dono do quadro) ---
    elseif ($action === 'add_column') {
        $quadro_id = $data['quadro_id'] ?? 0;
        $check = $conn->prepare("SELECT id FROM quadros WHERE id = ? AND usuario_id = ?");
        $check->execute([$quadro_id, $user_id]);
        if (!$check->fetch()) {
            echo json_encode(['success' => false, 'message' => 'Acesso negado ao quadro.']);
            exit;
        }
        $stmt = $conn->prepare("INSERT INTO kanban_colunas (quadro_id, nome, ordem) VALUES (?, ?, ?)");
        $stmt->execute([$quadro_id, $data['name'], $data['ordem']]);
        echo json_encode(['success' => true, 'id' => $conn->lastInsertId()]);
    }

    // --- EXCLUIR COLUNA (com validação de dono via JOIN) ---
    elseif ($action === 'delete_column') {
        $coluna_id = $data['id'] ?? 0;
        $check = $conn->prepare("
            SELECT kc.id FROM kanban_colunas kc
            INNER JOIN quadros q ON q.id = kc.quadro_id
            WHERE kc.id = ? AND q.usuario_id = ?
        ");
        $check->execute([$coluna_id, $user_id]);
        if (!$check->fetch()) {
            echo json_encode(['success' => false, 'message' => 'Acesso negado a esta coluna.']);
            exit;
        }
        $stmt = $conn->prepare("DELETE FROM kanban_colunas WHERE id = ?");
        $stmt->execute([$coluna_id]);
        echo json_encode(['success' => true]);
    }

    // --- LISTAR CARDS (com validação de dono via JOIN) ---
    elseif ($action === 'list_cards') {
        $coluna_id = $_GET['coluna_id'] ?? 0;
        $check = $conn->prepare("
            SELECT kc.id FROM kanban_colunas kc
            INNER JOIN quadros q ON q.id = kc.quadro_id
            WHERE kc.id = ? AND q.usuario_id = ?
        ");
        $check->execute([$coluna_id, $user_id]);
        if (!$check->fetch()) {
            echo json_encode(['success' => false, 'message' => 'Acesso negado a esta coluna.']);
            exit;
        }
        $stmt = $conn->prepare("SELECT id, titulo, descricao, data_inicio, data_entrega, concluido, atividades, etiquetas, membros, checklist, anexos FROM kanban_cards WHERE coluna_id = ?");
        $stmt->execute([$coluna_id]);
        $cards = $stmt->fetchAll(PDO::FETCH_ASSOC);
        foreach ($cards as &$card) {
            $card['atividades'] = json_decode($card['atividades'] ?: '[]');
            $card['etiquetas']  = json_decode($card['etiquetas']  ?: '[]');
            $card['membros']    = json_decode($card['membros']    ?: '[]');
            $card['checklist']  = json_decode($card['checklist']  ?: '[]');
            $card['anexos']     = json_decode($card['anexos']     ?: '[]');
            $card['concluido']  = (bool)$card['concluido'];
        }
        echo json_encode($cards);
    }

    // --- SALVAR/ATUALIZAR CARD (com validação e coluna_id atualizado) ---
    elseif ($action === 'save_card') {
        $atividades = json_encode($data['atividades'] ?? []);
        $etiquetas  = json_encode($data['etiquetas']  ?? []);
        $membros    = json_encode($data['membros']    ?? []);
        $checklist  = json_encode($data['checklist']  ?? []);
        $anexos     = json_encode($data['anexos']     ?? []);
        $concluido  = !empty($data['concluido']) ? 1 : 0;
        $coluna_id  = $data['coluna_id'] ?? 0;

        // Valida que a coluna de destino pertence ao usuário
        $checkCol = $conn->prepare("
            SELECT kc.id FROM kanban_colunas kc
            INNER JOIN quadros q ON q.id = kc.quadro_id
            WHERE kc.id = ? AND q.usuario_id = ?
        ");
        $checkCol->execute([$coluna_id, $user_id]);
        if (!$checkCol->fetch()) {
            echo json_encode(['success' => false, 'message' => 'Acesso negado a esta coluna.']);
            exit;
        }

        if (isset($data['id']) && $data['id'] > 0) {
            // UPDATE: inclui coluna_id para persistir movimentação de cards
            $sql = "UPDATE kanban_cards SET 
                    coluna_id=?, titulo=?, descricao=?, data_inicio=?, data_entrega=?,
                    atividades=?, etiquetas=?, membros=?, checklist=?, anexos=?, concluido=?
                    WHERE id=?";
            $stmt = $conn->prepare($sql);
            $stmt->execute([
                $coluna_id,
                $data['titulo'], $data['descricao'],
                $data['data_inicio'], $data['data_entrega'],
                $atividades, $etiquetas, $membros, $checklist, $anexos, $concluido,
                $data['id']
            ]);
            echo json_encode(['success' => true, 'id' => $data['id']]);
        } else {
            $sql = "INSERT INTO kanban_cards 
                    (coluna_id, titulo, descricao, data_inicio, data_entrega, atividades, etiquetas, membros, checklist, anexos, concluido)
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)";
            $stmt = $conn->prepare($sql);
            $stmt->execute([
                $coluna_id, $data['titulo'], $data['descricao'],
                $data['data_inicio'], $data['data_entrega'],
                $atividades, $etiquetas, $membros, $checklist, $anexos, $concluido
            ]);
            echo json_encode(['success' => true, 'id' => $conn->lastInsertId()]);
        }
    }

    // --- BUSCAR USUÁRIOS POR NOME OU E-MAIL ---
    elseif ($action === 'search_users') {
        // Aceita a busca tanto via corpo JSON quanto via query string (?q=...)
        $q = '%' . trim($data['q'] ?? $_GET['q'] ?? '') . '%';
        // Retorna todos os usuários que batem com a busca (incluindo o próprio)
        $stmt = $conn->prepare("SELECT id, nome, email FROM usuarios WHERE nome LIKE ? OR email LIKE ? ORDER BY nome ASC LIMIT 10");
        $stmt->execute([$q, $q]);
        $users = $stmt->fetchAll(PDO::FETCH_ASSOC);
        $colors = ['#3b82f6', '#22c55e', '#ef4444', '#eab308', '#a855f7', '#ec4899'];
        foreach ($users as &$u) {
            $words = explode(' ', trim($u['nome']));
            $u['iniciais'] = mb_strtoupper(mb_substr($words[0], 0, 1) . (isset($words[1]) ? mb_substr($words[1], 0, 1) : mb_substr($words[0], 1, 1)));
            $u['cor'] = $colors[$u['id'] % count($colors)];
        }
        echo json_encode($users);
    }

    // --- LISTAR MEMBROS DO USUÁRIO ---
    elseif ($action === 'list_members') {
        $stmt = $conn->prepare("SELECT id, nome, iniciais, cor FROM kanban_membros WHERE usuario_id = ? ORDER BY nome ASC");
        $stmt->execute([$user_id]);
        echo json_encode($stmt->fetchAll(PDO::FETCH_ASSOC));
    }

    // --- CRIAR MEMBRO ---
    elseif ($action === 'create_member') {
        $nome    = trim($data['name'] ?? '');
        $cor     = $data['color'] ?? '#3b82f6';
        $iniciais = mb_strtoupper(mb_substr($nome, 0, 2));
        if (!$nome) {
            echo json_encode(['success' => false, 'message' => 'Nome obrigatório.']);
            exit;
        }
        $stmt = $conn->prepare("INSERT INTO kanban_membros (usuario_id, nome, iniciais, cor) VALUES (?, ?, ?, ?)");
        $stmt->execute([$user_id, $nome, $iniciais, $cor]);
        echo json_encode(['success' => true, 'id' => $conn->lastInsertId(), 'iniciais' => $iniciais]);
    }

    // --- EXCLUIR MEMBRO ---
    elseif ($action === 'delete_member') {
        $stmt = $conn->prepare("DELETE FROM kanban_membros WHERE id = ? AND usuario_id = ?");
        $stmt->execute([$data['id'], $user_id]);
        echo json_encode(['success' => true]);
    }

    // --- EXCLUIR CARD (com validação de dono via JOIN) ---
    elseif ($action === 'delete_card') {
        $check = $conn->prepare("
            SELECT c.id FROM kanban_cards c
            INNER JOIN kanban_colunas kc ON kc.id = c.coluna_id
            INNER JOIN quadros q ON q.id = kc.quadro_id
            WHERE c.id = ? AND q.usuario_id = ?
        ");
        $check->execute([$data['id'], $user_id]);
        if (!$check->fetch()) {
            echo json_encode(['success' => false, 'message' => 'Acesso negado ao card.']);
            exit;
        }
        $stmt = $conn->prepare("DELETE FROM kanban_cards WHERE id = ?");
        $stmt->execute([$data['id']]);
        echo json_encode(['success' => true]);
    }

} catch (PDOException $e) {
    echo json_encode(['success' => false, 'message' => $e->getMessage()]);
}
?>
