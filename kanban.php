<?php
session_start();
if (!isset($_SESSION['user_id'])) {
    header("Location: index.php");
    exit();
}
?>
<!DOCTYPE html>
<html lang="pt-br">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Kanban - Central de Projetos</title>
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0/css/all.min.css">
    <link rel="stylesheet" href="css/theme.css">
    <link rel="stylesheet" href="css/kanban.css">
    <link rel="icon" href="ico/projeto.png">
</head>
<body>

    <div class="app-container">
        <aside class="sidebar">
            <button class="btn-back" onclick="window.location.href='dashboard.php'">
                <i class="fas fa-arrow-left"></i> Voltar
            </button>
            
            <div class="sidebar-section">
                <div class="section-header" style="display: flex; justify-content: space-between; align-items: center; margin-top: 20px; margin-bottom: 10px;">
                    <h3 style="font-size: 0.8rem; text-transform: uppercase; color: #94a3b8; margin: 0;">Meus Quadros</h3>
                    <button onclick="openGenericModal('board')" class="add-mini-btn" title="Novo Quadro">+</button>
                </div>
                <ul class="nav-list" id="boards-list"></ul>
            </div>
        </aside>

        <main class="kanban-area">
            <header class="kanban-header">
                <h2 id="current-board-title" contenteditable="true" onblur="updateBoardName()" title="Clique para editar o nome do quadro">Selecione um Quadro</h2>
                <div style="display:flex; align-items:center; gap:12px;">
                    <button id="theme-toggle-btn" class="theme-toggle" title="Alternar tema">
                        <div class="theme-toggle-track"><div class="theme-toggle-knob">☀️</div></div>
                        <span class="theme-toggle-icon">Claro</span>
                    </button>
                    <button id="add-column-btn" class="primary-btn" style="display:none;" onclick="openGenericModal('column')">
                        + Nova Coluna
                    </button>
                </div>
            </header>

            <div class="columns-container" id="columns-container"></div>
        </main>
    </div>

    <div id="creation-modal" class="modal">
        <div class="modal-content creation-card">
            <h3 id="creation-modal-title">Novo Item</h3>
            <input type="text" id="creation-input-name" class="full-input" placeholder="Digite o nome...">
            <div style="margin-top:20px; display:flex; gap:10px; justify-content: center;">
                <button class="btn-secondary" onclick="closeCreationModal()">Cancelar</button>
                <button id="creation-confirm-btn" class="primary-btn">Confirmar</button>
            </div>
        </div>
    </div>

    <div id="card-detail-modal" class="modal">
        <div class="modal-content">
            <div class="modal-header"></div>

            <div class="card-layout">
                <div class="main-content">
                    <div id="modal-labels-container" class="labels-display"></div>

                    <div class="section-title"><i class="fas fa-users"></i> Membros</div>
                    <div id="card-members-list" style="display:flex; gap:5px; margin-bottom:15px;"></div>

                    <div class="section-title"><i class="fas fa-align-left"></i> Descrição</div>
                    <textarea id="modal-card-desc" placeholder="Adicione uma descrição detalhada..."></textarea>

                    <div id="checklist-section" style="display:none;">
                        <div class="section-title">
                            <i class="fas fa-check-square"></i> Checklist 
                            <span id="checklist-percentage" style="font-size:0.8rem; margin-left:auto;">0%</span>
                            <button class="btn-secondary" style="padding:2px 8px; font-size:0.7rem; margin-left:10px;" onclick="removeChecklist()">Excluir lista</button>
                        </div>
                        <div class="progress-container">
                            <div id="checklist-progress-bar" class="progress-bar"></div>
                        </div>
                        <div id="checklist-items"></div>

                        <div id="checklist-add-container" style="display:none; margin-top:10px;">
                            <input type="text" id="checklist-input" class="full-input" placeholder="Nome do item...">
                            <div style="margin-top:10px; display:flex; gap:5px;">
                                <button class="primary-btn" onclick="addChecklistItem()">Adicionar</button>
                                <button class="btn-secondary" onclick="toggleChecklistInput()">Cancelar</button>
                            </div>
                        </div>
                        <button id="btn-show-checklist-input" class="btn-secondary" style="margin-top:10px;" onclick="toggleChecklistInput()">Adicionar um item</button>
                    </div>

                    <div class="section-title"><i class="fas fa-calendar-alt"></i> Datas</div>
                    <div style="display:flex; gap:20px;">
                        <div style="flex:1;">
                            <label style="font-size:0.8rem; color:#64748b;">Data de Início</label>
                            <input type="date" id="start-date-input" class="full-input" onchange="updateDates()">
                        </div>
                        <div style="flex:1;">
                            <label style="font-size:0.8rem; color:#64748b;">Data de Entrega</label>
                            <input type="date" id="due-date-input" class="full-input" onchange="updateDates()">
                        </div>
                    </div>

                    <div class="section-title"><i class="fas fa-paperclip"></i> Anexos</div>
                    <div id="attachments-list"></div>
                    <input type="file" id="file-upload" style="display:none" onchange="handleFileUpload(this)">
                    <button class="btn-secondary" onclick="document.getElementById('file-upload').click()">Adicionar anexo</button>

                    <div class="section-title"><i class="fas fa-list-ul"></i> Atividades</div>
                    <div class="activity-input">
                        <input type="text" id="new-activity" placeholder="Escreva um comentário...">
                        <button class="primary-btn" onclick="addActivity()">Enviar</button>
                    </div>
                    <div id="activities-list" style="margin-top:20px;"></div>
                </div>

                <aside class="side-actions">
                    <label>Ações</label>
                    <button onclick="toggleMemberPicker()"><i class="fas fa-user"></i> Membros</button>
                    <button onclick="toggleLabelPicker()"><i class="fas fa-tag"></i> Etiquetas</button>
                    <button onclick="showChecklistSection()"><i class="fas fa-check-square"></i> Checklist</button>
                    <button onclick="document.getElementById('file-upload').click()"><i class="fas fa-paperclip"></i> Anexo</button>
                    
                    <div id="label-picker" class="label-picker" style="display:none;">
                        <input type="text" id="label-text-input" placeholder="Nome da etiqueta...">
                        <div class="color-palette">
                            <span class="color-dot" style="background:#22c55e" onclick="addLabel('#22c55e')"></span>
                            <span class="color-dot" style="background:#eab308" onclick="addLabel('#eab308')"></span>
                            <span class="color-dot" style="background:#ef4444" onclick="addLabel('#ef4444')"></span>
                            <span class="color-dot" style="background:#3b82f6" onclick="addLabel('#3b82f6')"></span>
                            <span class="color-dot" style="background:#a855f7" onclick="addLabel('#a855f7')"></span>
                        </div>
                    </div>

                    <div id="member-picker" class="member-picker" style="display:none;">
                        <input type="text" id="member-search" placeholder="Buscar por nome ou e-mail..." oninput="searchMembers(this.value)">
                        <div id="available-members-list" class="available-members-scroll"></div>
                    </div>

                    <hr style="border:0; border-top:1px solid #e2e8f0; margin:10px 0;">
                    <button class="danger-text" onclick="deleteCard()"><i class="fas fa-trash"></i> Excluir Card</button>
                </aside>
            </div>
        </div>
    </div>

    <script src="js/theme.js"></script>
    <script src="js/kanban.js"></script>
</body>
</html>