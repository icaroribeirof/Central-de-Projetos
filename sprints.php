<?php
session_start();

// Verifica se o usuário está logado
if (!isset($_SESSION['user_id'])) {
    header("Location: index.php");
    exit;
}
?>
<!DOCTYPE html>
<html lang="pt-br">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Sprints - Central de Projetos</title>
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0/css/all.min.css">
    <link rel="stylesheet" href="css/theme.css">
    <link rel="stylesheet" href="css/sprints.css">
    <link rel="icon" href="ico/projeto.png">
</head>
<body>
    <div class="app-container">
        <aside class="sidebar">
            <button onclick="location.href='dashboard.php'" class="btn-back">
                <i class="fas fa-arrow-left"></i> Voltar
            </button>
            
            <div class="sidebar-section">
                <h3>Planejamento</h3>
                <ul class="nav-list">
                    <li id="nav-backlog" class="active" onclick="showBacklog()">
                        <span><i class="fas fa-list-ul"></i> Backlog</span>
                    </li>
                </ul>
            </div>

            <div class="sidebar-section">
                <div class="section-header">
                    <h3>Sprints</h3>
                    <button onclick="openGenericModal('sprint')" class="add-mini-btn" title="Nova Sprint">+</button>
                </div>
                <ul id="sprints-nav-list" class="nav-list">
                </ul>
            </div>
        </aside>

        <main class="content-area">
            <header class="content-header">
                <div style="display: flex; justify-content: space-between; width: 100%; align-items: center;">
                    <div style="display: flex; align-items: center; gap: 15px;">
                        <h2 id="view-title">Backlog do Produto</h2>
                        <div id="sprint-stats-container" style="display: none; gap: 10px;">
                            <span id="points-planned" class="points-badge header-total-badge">Planejado: 0 SP</span>
                            <span id="points-completed" class="points-badge header-total-badge" style="background: var(--success);">Concluído: 0 SP</span>
                        </div>
                    </div>
                    <div class="header-actions" style="display:flex; align-items:center; gap:12px;">
                        <button id="theme-toggle-btn" class="theme-toggle" title="Alternar tema">
                            <div class="theme-toggle-track"><div class="theme-toggle-knob">☀️</div></div>
                            <span class="theme-toggle-icon">Claro</span>
                        </button>
                        <button class="primary-btn" onclick="openGenericModal('item')">+ Novo Item</button>
                    </div>
                </div>

                <div id="sprint-dates-display" style="display: none; font-size: 0.85rem; color: #64748b; align-items: center; gap: 8px; margin-top: 5px;">
                    <i class="far fa-calendar-alt"></i>
                    <span id="display-start-date">--/--/--</span> 
                    <span>até</span> 
                    <span id="display-end-date">--/--/--</span>
                </div>

                <div id="progress-container" style="display: none; width: 100%; background: #e2e8f0; height: 8px; border-radius: 10px; overflow: hidden; margin-top: 10px;">
                    <div id="progress-bar-fill" style="width: 0%; height: 100%; background: var(--success); transition: width 0.5s ease-in-out;"></div>
                </div>
            </header>

            <div class="search-container">
                <div style="position: relative; width: 350px;">
                    <i class="fas fa-search" style="position: absolute; left: 12px; top: 50%; transform: translateY(-50%); color: #94a3b8;"></i>
                    <input type="text" id="quick-filter" onkeyup="filterItems()" placeholder="Filtrar itens por título..." 
                           class="full-input" style="padding-left: 35px; margin: 0;">
                </div>
                <button class="sort-btn" onclick="toggleSortOrder()" title="Ordenar A-Z / Z-A">
                    <i class="fas fa-sort-alpha-down"></i>
                    <span>Ordenar</span>
                </button>
            </div>

            <div class="items-table-container">
                <table class="items-table">
                    <thead>
                        <tr>
                            <th>Título</th>
                            <th>Status</th>
                            <th>Prioridade</th>
                            <th>Esforço (SP)</th>
                            <th>Ações</th>
                        </tr>
                    </thead>
                    <tbody id="items-tbody">
                    </tbody>
                </table>
            </div>
        </main>
    </div>

    <div id="creation-modal" class="modal">
        <div class="modal-content creation-card" style="width: 550px; max-width: 95%;">
            <input type="hidden" id="edit-index" value="-1">
            <input type="hidden" id="edit-item-id" value="">
            <input type="hidden" id="edit-sprint-id" value="">
            
            <h3 id="creation-modal-title" style="margin-bottom: 20px; color: var(--primary);">Novo Item</h3>
            
            <div id="item-form-container">
                <label class="form-label">Título</label>
                <input type="text" id="creation-input-name" class="full-input" placeholder="Ex: Criar API de login">
                
                <div style="display: flex; gap: 15px;">
                    <div style="flex: 1;">
                        <label class="form-label">Tipo</label>
                        <select id="creation-type" class="full-input">
                            <option value="User Story">User Story</option>
                            <option value="Task">Task</option>
                            <option value="Bug">Bug</option>
                        </select>
                    </div>
                    <div style="flex: 1;">
                        <label class="form-label">Prioridade</label>
                        <select id="creation-priority" class="full-input">
                            <option value="Baixa">Baixa</option>
                            <option value="Média" selected>Média</option>
                            <option value="Alta">Alta</option>
                            <option value="Crítica">Crítica</option>
                        </select>
                    </div>
                </div>

                <div style="display: flex; gap: 15px;">
                    <div style="flex: 1;">
                        <label class="form-label">Status</label>
                        <select id="creation-status" class="full-input">
                            <option value="Novo">Novo</option>
                            <option value="Em Progresso">Em Progresso</option>
                            <option value="Concluído">Concluído</option>
                            <option value="Impedido">Impedido</option>
                        </select>
                    </div>
                    <div style="flex: 0.5;">
                        <label class="form-label">Story Points</label>
                        <input type="number" id="creation-points" class="full-input" placeholder="0" min="0">
                    </div>
                </div>

                <label class="form-label">Descrição</label>
                <textarea id="creation-description" class="full-input" style="height: 80px; resize: none;"></textarea>
            </div>

            <div id="sprint-form-container" style="display: none;">
                <label class="form-label">Nome da Sprint</label>
                <input type="text" id="sprint-input-name" class="full-input" placeholder="Ex: Sprint 01">
                
                <div style="display: flex; gap: 15px;">
                    <div style="flex: 1;">
                        <label class="form-label">Data de Início</label>
                        <input type="date" id="sprint-start-date" class="full-input">
                    </div>
                    <div style="flex: 1;">
                        <label class="form-label">Data de Término</label>
                        <input type="date" id="sprint-end-date" class="full-input">
                    </div>
                </div>
            </div>

            <div style="margin-top:25px; display:flex; gap:10px; justify-content: flex-end;">
                <button class="btn-secondary" onclick="closeModals()">Cancelar</button>
                <button id="creation-confirm-btn" class="primary-btn">Confirmar</button>
            </div>
        </div>
    </div>

    <div id="move-modal" class="modal">
        <div class="modal-content creation-card" style="width: 400px;">
            <h3 style="margin-bottom: 15px; color: var(--primary);">Mover Item</h3>
            <p style="font-size: 0.9rem; color: #64748b; margin-bottom: 20px;">Selecione o destino para este item:</p>
            <input type="hidden" id="move-item-index">
            <select id="move-destination-select" class="full-input"></select>
            <div style="margin-top:25px; display:flex; gap:10px; justify-content: flex-end;">
                <button class="btn-secondary" onclick="closeModals()">Cancelar</button>
                <button class="primary-btn" onclick="confirmMove()">Confirmar</button>
            </div>
        </div>
    </div>

    <script src="js/theme.js"></script>
    <script src="js/sprints.js"></script>
</body>
</html>