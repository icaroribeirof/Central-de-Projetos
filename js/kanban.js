let boards = [];
let currentBoardId = null;
let modalTargetType = '';
let modalActiveColIdx = null;
let currentEditingCard = { colIdx: null, cardIdx: null };
let searchResults = []; // Resultados da busca de usuários

// Inicia carregando os quadros do banco de dados
async function init() { 
    try {
        const response = await fetch('api/api_kanban.php?action=list_boards');
        const boardsData = await response.json();
        if (Array.isArray(boardsData)) {
            boards = boardsData.map(b => ({ id: b.id, name: b.nome, columns: [] }));
            renderBoardsMenu();
        }
    } catch (e) {
        console.error("Erro ao iniciar:", e);
        renderBoardsMenu();
    }
}

// --- FUNÇÃO DE SINCRONIZAÇÃO COM O BANCO ---
async function syncCard(colIdx, cardIdx) {
    const board = boards.find(b => b.id === currentBoardId);
    const card = board.columns[colIdx].cards[cardIdx];
    
    // Removido o campo 'prioridade' do envio para o PHP
    const dataToSend = {
        id: card.id,
        coluna_id: board.columns[colIdx].id,
        titulo: card.title,
        descricao: card.desc,
        data_inicio: card.startDate,
        data_entrega: card.dueDate,
        concluido: card.completed,
        atividades: card.activities,
        etiquetas: card.labels,
        membros: card.members,
        checklist: card.checklist,
        anexos: card.attachments
    };

    const resp = await fetch('api/api_kanban.php?action=save_card', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(dataToSend)
    });
    const res = await resp.json();
    if (res.success && !card.id) card.id = res.id; 
    renderColumns();
}

// --- GESTÃO DO NOME DO QUADRO ---
async function updateBoardName() {
    const titleElement = document.getElementById('current-board-title');
    const newName = titleElement.innerText.trim();
    const board = boards.find(b => b.id === currentBoardId);

    if (!board) return;
    if (!newName) { titleElement.innerText = board.name; return; }

    board.name = newName;
    await fetch('api/api_kanban.php?action=rename_board', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: currentBoardId, name: newName })
    });
    renderBoardsMenu();
}

// --- GESTÃO DE MODAIS DE CRIAÇÃO ---
function openGenericModal(type, colIdx = null) {
    modalTargetType = type;
    modalActiveColIdx = colIdx;
    const input = document.getElementById('creation-input-name');
    input.value = '';
    document.getElementById('creation-modal').style.display = 'flex';
    const titles = { 'board': 'Novo Quadro', 'column': 'Nova Coluna', 'card': 'Novo Card' };
    document.getElementById('creation-modal-title').innerText = titles[type];
    setTimeout(() => input.focus(), 50);
}

function closeCreationModal() { 
    document.getElementById('creation-modal').style.display = 'none'; 
}

document.getElementById('creation-confirm-btn').onclick = async () => {
    const name = document.getElementById('creation-input-name').value.trim();
    if (!name) return;

    if (modalTargetType === 'board') {
        const resp = await fetch('api/api_kanban.php?action=create_board', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name: name })
        });
        const res = await resp.json();
        boards.push({ id: res.id, name: name, columns: [] });
        renderBoardsMenu(); loadBoard(res.id);
    } else if (modalTargetType === 'column') {
        const board = boards.find(b => b.id === currentBoardId);
        const resp = await fetch('api/api_kanban.php?action=add_column', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ quadro_id: currentBoardId, name: name, ordem: board.columns.length })
        });
        const res = await resp.json();
        board.columns.push({ id: res.id, name: name, cards: [] });
        renderColumns();
    } else if (modalTargetType === 'card') {
        const col = boards.find(b => b.id === currentBoardId).columns[modalActiveColIdx];
        const newCard = { 
            title: name, desc: '', activities: [], labels: [], checklist: [], attachments: [], 
            startDate: '', dueDate: '', completed: false, members: [] 
        };
        col.cards.push(newCard);
        await syncCard(modalActiveColIdx, col.cards.length - 1);
    }
    closeCreationModal();
};

// --- RENDERIZAÇÃO ---
function renderBoardsMenu() {
    const list = document.getElementById('boards-list');
    list.innerHTML = '';
    boards.forEach(board => {
        const li = document.createElement('li');
        if (currentBoardId === board.id) li.className = 'active';
        li.innerHTML = `
            <span onclick="loadBoard(${board.id})" style="flex:1"><i class="fas fa-chalkboard"></i> ${board.name}</span>
            <i class="fas fa-trash" style="font-size:0.8rem; opacity:0.5; cursor:pointer" onclick="deleteBoard(${board.id})"></i>
        `;
        list.appendChild(li);
    });
}

async function loadBoard(id) {
    currentBoardId = id;
    const board = boards.find(b => b.id === id);
    if (!board) return;

    document.getElementById('current-board-title').textContent = board.name;
    document.getElementById('add-column-btn').style.display = 'block';

    try {
        const respCols = await fetch(`api/api_kanban.php?action=list_columns&quadro_id=${id}`);
        const colsData = await respCols.json();
        
        board.columns = await Promise.all(colsData.map(async (c) => {
            const respCards = await fetch(`api/api_kanban.php?action=list_cards&coluna_id=${c.id}`);
            const cardsData = await respCards.json();
            return {
                id: c.id, name: c.nome,
                cards: cardsData.map(card => ({
                    id: card.id, title: card.titulo, desc: card.descricao,
                    startDate: card.data_inicio, dueDate: card.data_entrega,
                    completed: card.concluido == 1, activities: card.atividades || [],
                    labels: card.etiquetas || [], members: card.membros || [],
                    checklist: card.checklist || [], attachments: card.anexos || []
                }))
            };
        }));
        renderBoardsMenu(); renderColumns();
    } catch (e) { console.error(e); }
}

function renderColumns() {
    const board = boards.find(b => b.id === currentBoardId);
    const container = document.getElementById('columns-container');
    container.innerHTML = '';
    if (!board) return;

    board.columns.forEach((col, colIdx) => {
        const colDiv = document.createElement('div');
        colDiv.className = 'column';
        colDiv.ondragover = (e) => e.preventDefault();
        colDiv.ondrop = (e) => drop(e, colIdx);

        colDiv.innerHTML = `
            <h3>${col.name} <i class="fas fa-trash" style="font-size:0.7rem; cursor:pointer" onclick="deleteColumn(${colIdx})"></i></h3>
            <div class="cards-list"></div>
            <button class="add-board-sidebar" onclick="openGenericModal('card', ${colIdx})">+ Adicionar card</button>
        `;
        
        const list = colDiv.querySelector('.cards-list');
        col.cards.forEach((card, cardIdx) => {
            const cardDiv = document.createElement('div');
            cardDiv.className = `card ${card.completed ? 'completed' : ''}`;
            cardDiv.draggable = true;
            cardDiv.ondragstart = (e) => drag(e, colIdx, cardIdx);
            cardDiv.onclick = () => openCard(colIdx, cardIdx);
            
            let labelsHtml = '<div class="card-labels">';
            if(card.labels) card.labels.forEach(l => {
                labelsHtml += `<div class="label-pill-small" style="background:${l.color}">${l.text}</div>`;
            });
            labelsHtml += '</div>';

            let checklistHtml = '';
            if(card.checklist && card.checklist.length > 0) {
                const total = card.checklist.length;
                const done = card.checklist.filter(i => i.completed).length;
                checklistHtml = `<div class="info-item ${total === done ? 'status-green' : ''}"><i class="far fa-check-square"></i> ${done}/${total}</div>`;
            }

            let datesHtml = '';
            if(card.startDate || card.dueDate) {
                const start = card.startDate ? card.startDate.split('-').reverse().join('/') : '...';
                const end = card.dueDate ? card.dueDate.split('-').reverse().join('/') : '...';
                let dateClass = '';
                if (card.completed) { dateClass = 'status-green'; } 
                else if (card.dueDate) {
                    const today = new Date(); today.setHours(0, 0, 0, 0);
                    const deadline = new Date(card.dueDate + 'T00:00:00');
                    const diffDays = Math.ceil((deadline - today) / (1000 * 60 * 60 * 24));
                    if (diffDays < 0) dateClass = 'status-red';
                    else if (diffDays <= 1) dateClass = 'status-yellow';
                }
                datesHtml = `<div class="info-item ${dateClass}"><i class="far fa-clock"></i> ${start} - ${end}</div>`;
            }

            let descIcon = (card.desc && card.desc.trim() !== '') ? '<div class="info-item"><i class="fas fa-align-left"></i></div>' : '';

            let membersHtml = '<div class="card-members-mini">';
            if(card.members) card.members.forEach(m => {
                membersHtml += `<div class="avatar" style="width:24px; height:24px; font-size:0.6rem; background:${m.color}; margin-left:-6px">${m.initials}</div>`;
            });
            membersHtml += '</div>';

            cardDiv.innerHTML = `
                ${labelsHtml}
                <div class="card-header-flex">
                    <input type="checkbox" class="complete-checkbox" ${card.completed ? 'checked' : ''} 
                        onclick="event.stopPropagation(); toggleCardComplete(event, ${colIdx}, ${cardIdx})">
                    <span class="card-title">${card.title}</span>
                </div>
                <div class="card-footer-flex">
                    <div class="card-info-footer">${datesHtml}${descIcon}${checklistHtml}</div>
                    ${membersHtml}
                </div>
            `;
            list.appendChild(cardDiv);
        });
        container.appendChild(colDiv);
    });
}

// --- LOGICA DE CONCLUIR CARD ---
async function toggleCardComplete(event, colIdx, cardIdx) {
    const card = boards.find(b => b.id === currentBoardId).columns[colIdx].cards[cardIdx];
    card.completed = !card.completed;
    await syncCard(colIdx, cardIdx);
}

function updateModalTitleStyle(isCompleted) {
    const title = document.getElementById('modal-card-title');
    if (isCompleted) title.classList.add('modal-title-completed');
    else title.classList.remove('modal-title-completed');
}

// --- SISTEMA DE MEMBROS ---
function toggleMemberPicker() {
    const picker = document.getElementById('member-picker');
    const isHidden = picker.style.display === 'none';
    document.getElementById('label-picker').style.display = 'none';
    picker.style.display = isHidden ? 'block' : 'none';
    if (isHidden) {
        // Limpa busca e mostra membros já atribuídos ao abrir
        document.getElementById('member-search').value = '';
        searchResults = [];
        renderAvailableMembers([]);
    }
}

let searchTimeout = null;
async function searchMembers(query) {
    clearTimeout(searchTimeout);
    const container = document.getElementById('available-members-list');

    if (!query.trim()) {
        searchResults = [];
        renderAvailableMembers([]);
        return;
    }

    container.innerHTML = '<p style="font-size:0.85rem; color:#94a3b8; padding:8px 0;">Buscando...</p>';

    searchTimeout = setTimeout(async () => {
        try {
            const resp = await fetch('api/api_kanban.php?action=search_users', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ q: query })
            });
            const result = await resp.json();
            // Garante que o resultado é sempre um array
            searchResults = Array.isArray(result) ? result : [];
            if (searchResults.length === 0) {
                container.innerHTML = '<p style="font-size:0.85rem; color:#94a3b8; padding:8px 0;">Nenhum usuário encontrado.</p>';
            } else {
                renderAvailableMembers(searchResults);
            }
        } catch(e) {
            console.error('Erro ao buscar usuários:', e);
            container.innerHTML = '<p style="font-size:0.85rem; color:#ef4444; padding:8px 0;">Erro ao buscar usuários.</p>';
        }
    }, 300); // debounce de 300ms
}

function renderAvailableMembers(users) {
    const container = document.getElementById('available-members-list');
    const card = boards.find(b => b.id === currentBoardId).columns[currentEditingCard.colIdx].cards[currentEditingCard.cardIdx];

    if (!users || users.length === 0) {
        // Mostra apenas os membros já atribuídos ao card
        const assigned = card.members || [];
        if (assigned.length === 0) {
            container.innerHTML = '<p style="font-size:0.85rem; color:#94a3b8; padding:8px 0;">Busque um usuário pelo nome ou e-mail.</p>';
        } else {
            container.innerHTML = assigned.map(m => `
                <div class="member-item-picker" onclick="toggleMemberAssignment(${m.id}, ${JSON.stringify(m).split('"').join('&quot;')})">
                    <div class="avatar" style="background:${m.color}">${m.initials}</div>
                    <div style="flex:1; margin-left:10px;">
                        <div style="font-size:0.9rem; font-weight:600;">${m.name}</div>
                    </div>
                    <i class="fas fa-check" style="color:var(--success)"></i>
                </div>`).join('');
        }
        return;
    }

    container.innerHTML = users.map(u => {
        const isAssigned = (card.members || []).some(m => m.id === u.id);
        const memberObj = JSON.stringify({ id: u.id, name: u.nome, initials: u.iniciais, color: u.cor }).split('"').join('&quot;');
        return `<div class="member-item-picker" onclick="toggleMemberAssignment(${u.id}, '${memberObj}')">
            <div class="avatar" style="background:${u.cor}">${u.iniciais}</div>
            <div style="flex:1; margin-left:10px;">
                <div style="font-size:0.9rem; font-weight:600;">${u.nome}</div>
                <div style="font-size:0.75rem; color:#94a3b8;">${u.email}</div>
            </div>
            ${isAssigned ? '<i class="fas fa-check" style="color:var(--success)"></i>' : ''}
        </div>`;
    }).join('');
}

async function toggleMemberAssignment(memberId, memberDataRaw) {
    const card = boards.find(b => b.id === currentBoardId).columns[currentEditingCard.colIdx].cards[currentEditingCard.cardIdx];
    if (!card.members) card.members = [];
    const idx = card.members.findIndex(m => m.id === memberId);
    if (idx > -1) {
        card.members.splice(idx, 1);
    } else {
        // memberDataRaw pode vir como string JSON (dos resultados de busca) ou objeto (dos atribuídos)
        const memberData = typeof memberDataRaw === 'string'
            ? JSON.parse(memberDataRaw.split('&quot;').join('"'))
            : memberDataRaw;
        card.members.push(memberData);
    }
    const currentQuery = document.getElementById('member-search').value;
    if (currentQuery.trim()) {
        renderAvailableMembers(searchResults);
    } else {
        renderAvailableMembers([]);
    }
    renderModalMembers();
    await syncCard(currentEditingCard.colIdx, currentEditingCard.cardIdx);
}

function renderModalMembers() {
    const container = document.getElementById('card-members-list');
    const card = boards.find(b => b.id === currentBoardId).columns[currentEditingCard.colIdx].cards[currentEditingCard.cardIdx];
    container.innerHTML = (card.members || []).map(m => 
        `<div class="avatar" title="${m.name}" style="background:${m.color}; margin-right:-8px">${m.initials}</div>`
    ).join('');
}

// --- SISTEMA DE DATAS ---
async function updateDates() {
    const card = boards.find(b => b.id === currentBoardId).columns[currentEditingCard.colIdx].cards[currentEditingCard.cardIdx];
    card.startDate = document.getElementById('start-date-input').value;
    card.dueDate = document.getElementById('due-date-input').value;
    await syncCard(currentEditingCard.colIdx, currentEditingCard.cardIdx);
}

// --- SISTEMA DE ANEXOS ---
function handleFileUpload(input) {
    const file = input.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async function(e) {
        const card = boards.find(b => b.id === currentBoardId).columns[currentEditingCard.colIdx].cards[currentEditingCard.cardIdx];
        if (!card.attachments) card.attachments = [];
        card.attachments.push({ name: file.name, type: file.type, data: e.target.result, date: new Date().toLocaleString() });
        input.value = ''; renderAttachments();
        await syncCard(currentEditingCard.colIdx, currentEditingCard.cardIdx);
    };
    reader.readAsDataURL(file);
}

function renderAttachments() {
    const card = boards.find(b => b.id === currentBoardId).columns[currentEditingCard.colIdx].cards[currentEditingCard.cardIdx];
    const container = document.getElementById('attachments-list');
    container.innerHTML = (card.attachments || []).map((file, idx) => {
        const isImage = file.type.startsWith('image/');
        return `
            <div class="attachment-item">
                <div class="attachment-preview">${isImage ? `<img src="${file.data}">` : '<i class="fas fa-file"></i>'}</div>
                <div class="attachment-info">
                    <span class="file-name">${file.name}</span>
                    <div class="attachment-actions">
                        <span onclick="downloadFile(${idx})">Download</span>
                        <span class="delete-file" onclick="removeAttachment(${idx})">Excluir</span>
                    </div>
                </div>
            </div>`;
    }).join('');
}

function downloadFile(idx) {
    const card = boards.find(b => b.id === currentBoardId).columns[currentEditingCard.colIdx].cards[currentEditingCard.cardIdx];
    const file = card.attachments[idx];
    const link = document.createElement('a');
    link.href = file.data; link.download = file.name; link.click();
}

async function removeAttachment(idx) {
    if (confirm("Deseja excluir este anexo?")) {
        const card = boards.find(b => b.id === currentBoardId).columns[currentEditingCard.colIdx].cards[currentEditingCard.cardIdx];
        card.attachments.splice(idx, 1); renderAttachments();
        await syncCard(currentEditingCard.colIdx, currentEditingCard.cardIdx);
    }
}

// --- CHECKLIST ---
function showChecklistSection() {
    const section = document.getElementById('checklist-section');
    // Só exibe se ainda não estiver visível (evita reabrir ao clicar de novo)
    if (section.style.display === 'none') {
        section.style.display = 'block';
    }
}

function toggleChecklistInput() {
    const container = document.getElementById('checklist-add-container');
    const btn = document.getElementById('btn-show-checklist-input');
    const isHidden = container.style.display === 'none';
    container.style.display = isHidden ? 'block' : 'none';
    btn.style.display = isHidden ? 'none' : 'block';
    if(isHidden) document.getElementById('checklist-input').focus();
}

async function removeChecklist() {
    if (confirm("Excluir toda a lista de checklist?")) {
        const card = boards.find(b => b.id === currentBoardId).columns[currentEditingCard.colIdx].cards[currentEditingCard.cardIdx];
        card.checklist = [];
        document.getElementById('checklist-section').style.display = 'none';
        document.getElementById('checklist-add-container').style.display = 'none';
        document.getElementById('btn-show-checklist-input').style.display = 'block';
        await syncCard(currentEditingCard.colIdx, currentEditingCard.cardIdx);
    }
}

async function addChecklistItem() {
    const input = document.getElementById('checklist-input');
    const text = input.value.trim();
    if (!text) return;
    const card = boards.find(b => b.id === currentBoardId).columns[currentEditingCard.colIdx].cards[currentEditingCard.cardIdx];
    if(!card.checklist) card.checklist = [];
    card.checklist.push({ text: text, completed: false });
    input.value = ''; renderChecklist();
    await syncCard(currentEditingCard.colIdx, currentEditingCard.cardIdx);
}

async function toggleItemStatus(idx) {
    const card = boards.find(b => b.id === currentBoardId).columns[currentEditingCard.colIdx].cards[currentEditingCard.cardIdx];
    card.checklist[idx].completed = !card.checklist[idx].completed;
    renderChecklist();
    await syncCard(currentEditingCard.colIdx, currentEditingCard.cardIdx);
}

async function removeChecklistItem(idx) {
    const card = boards.find(b => b.id === currentBoardId).columns[currentEditingCard.colIdx].cards[currentEditingCard.cardIdx];
    card.checklist.splice(idx, 1);
    if (card.checklist.length === 0) document.getElementById('checklist-section').style.display = 'none';
    renderChecklist();
    await syncCard(currentEditingCard.colIdx, currentEditingCard.cardIdx);
}

function renderChecklist() {
    const card = boards.find(b => b.id === currentBoardId).columns[currentEditingCard.colIdx].cards[currentEditingCard.cardIdx];
    const container = document.getElementById('checklist-items');
    container.innerHTML = (card.checklist || []).map((item, idx) => `
        <div class="checklist-item ${item.completed ? 'completed' : ''}">
            <input type="checkbox" ${item.completed ? 'checked' : ''} onclick="event.stopPropagation(); toggleItemStatus(${idx})">
            <span>${item.text}</span>
            <i class="fas fa-trash" onclick="event.stopPropagation(); removeChecklistItem(${idx})"></i>
        </div>
    `).join('');
    updateProgressBar(card.checklist);
}

function updateProgressBar(checklist) {
    const bar = document.getElementById('checklist-progress-bar');
    const text = document.getElementById('checklist-percentage');
    if (!checklist || checklist.length === 0) { bar.style.width = '0%'; text.innerText = '0%'; return; }
    const completed = checklist.filter(i => i.completed).length;
    const percentage = Math.round((completed / checklist.length) * 100);
    bar.style.width = `${percentage}%`; text.innerText = `${percentage}%`;
    bar.style.background = percentage === 100 ? 'var(--success)' : 'var(--accent)';
}

// --- ETIQUETAS ---
function toggleLabelPicker() {
    const picker = document.getElementById('label-picker');
    document.getElementById('member-picker').style.display = 'none';
    picker.style.display = picker.style.display === 'none' ? 'block' : 'none';
}

async function addLabel(color) {
    const textInput = document.getElementById('label-text-input');
    const text = textInput.value.trim();
    if (!text) return;
    const card = boards.find(b => b.id === currentBoardId).columns[currentEditingCard.colIdx].cards[currentEditingCard.cardIdx];
    if(!card.labels) card.labels = [];
    card.labels.push({ text: text, color: color });
    textInput.value = ''; toggleLabelPicker(); renderModalLabels();
    await syncCard(currentEditingCard.colIdx, currentEditingCard.cardIdx);
}

async function removeLabel(idx) {
    const card = boards.find(b => b.id === currentBoardId).columns[currentEditingCard.colIdx].cards[currentEditingCard.cardIdx];
    card.labels.splice(idx, 1); renderModalLabels();
    await syncCard(currentEditingCard.colIdx, currentEditingCard.cardIdx);
}

function renderModalLabels() {
    const container = document.getElementById('modal-labels-container');
    const card = boards.find(b => b.id === currentBoardId).columns[currentEditingCard.colIdx].cards[currentEditingCard.cardIdx];
    container.innerHTML = (card.labels || []).map((l, idx) => 
        `<span class="label-pill" style="background:${l.color}">${l.text} <i class="fas fa-times" onclick="removeLabel(${idx})"></i></span>`
    ).join('');
}

// --- DETALHES DO CARD ---
function openCard(colIdx, cardIdx) {
    const card = boards.find(b => b.id === currentBoardId).columns[colIdx].cards[cardIdx];
    currentEditingCard = { colIdx: colIdx, cardIdx: cardIdx };

    const modalHeader = document.querySelector('.modal-header');
    modalHeader.innerHTML = `
        <div class="modal-header-flex">
            <input type="checkbox" class="complete-checkbox" ${card.completed ? 'checked' : ''} 
                onclick="toggleCardComplete(event, ${colIdx}, ${cardIdx}); updateModalTitleStyle(this.checked)">
            <h2 id="modal-card-title" contenteditable="true" onblur="updateCardTitle()" 
                class="${card.completed ? 'modal-title-completed' : ''}">${card.title}</h2>
        </div>
        <button class="close-btn" onclick="closeCardDetailModal()">&times;</button>
    `;

    document.getElementById('modal-card-desc').value = card.desc || '';
    document.getElementById('label-picker').style.display = 'none';
    document.getElementById('member-picker').style.display = 'none';
    document.getElementById('checklist-add-container').style.display = 'none';
    document.getElementById('btn-show-checklist-input').style.display = 'block';
    document.getElementById('start-date-input').value = card.startDate || '';
    document.getElementById('due-date-input').value = card.dueDate || '';
    
    const section = document.getElementById('checklist-section');
    if (card.checklist && card.checklist.length > 0) { section.style.display = 'block'; renderChecklist(); } 
    else { section.style.display = 'none'; }
    
    renderAttachments(); renderModalLabels(); renderModalMembers();
    renderActivities(card.activities || []);
    document.getElementById('card-detail-modal').style.display = 'flex';
}

async function updateCardTitle() {
    const newTitle = document.getElementById('modal-card-title').innerText.trim();
    if (!newTitle) return;
    boards.find(b => b.id === currentBoardId).columns[currentEditingCard.colIdx].cards[currentEditingCard.cardIdx].title = newTitle;
    await syncCard(currentEditingCard.colIdx, currentEditingCard.cardIdx);
}

function closeCardDetailModal() { 
    document.getElementById('card-detail-modal').style.display = 'none'; 
}

// Clique fora do modal para fechar
window.onclick = function(event) {
    if (event.target.classList.contains('modal')) { 
        closeCreationModal(); 
        closeCardDetailModal(); 
    }
};

// --- DRAG AND DROP ---
function drag(e, colIdx, cardIdx) { e.dataTransfer.setData("text/plain", JSON.stringify({ colIdx, cardIdx })); }
async function drop(e, targetColIdx) {
    e.preventDefault();
    const data = JSON.parse(e.dataTransfer.getData("text/plain"));
    const board = boards.find(b => b.id === currentBoardId);
    const cardMovido = board.columns[data.colIdx].cards.splice(data.cardIdx, 1)[0];
    board.columns[targetColIdx].cards.push(cardMovido);
    await syncCard(targetColIdx, board.columns[targetColIdx].cards.length - 1);
}

// --- DESCRIÇÃO E ATIVIDADES ---
document.getElementById('modal-card-desc').onblur = async function() {
    boards.find(b => b.id === currentBoardId).columns[currentEditingCard.colIdx].cards[currentEditingCard.cardIdx].desc = this.value;
    await syncCard(currentEditingCard.colIdx, currentEditingCard.cardIdx);
};

async function addActivity() {
    const input = document.getElementById('new-activity');
    if (input.value.trim()) {
        const card = boards.find(b => b.id === currentBoardId).columns[currentEditingCard.colIdx].cards[currentEditingCard.cardIdx];
        if (!card.activities) card.activities = [];
        card.activities.unshift(input.value.trim());
        input.value = ''; renderActivities(card.activities);
        await syncCard(currentEditingCard.colIdx, currentEditingCard.cardIdx);
    }
}

function renderActivities(list) { 
    document.getElementById('activities-list').innerHTML = list.map(a => `<div class="activity-item">${a}</div>`).join(''); 
}

// --- EXCLUSÕES GERAIS ---
async function deleteCard() { 
    if (confirm("Excluir card?")) { 
        const card = boards.find(b => b.id === currentBoardId).columns[currentEditingCard.colIdx].cards[currentEditingCard.cardIdx];
        await fetch('api/api_kanban.php?action=delete_card', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ id: card.id })
        });
        boards.find(b => b.id === currentBoardId).columns[currentEditingCard.colIdx].cards.splice(currentEditingCard.cardIdx, 1); 
        renderColumns(); closeCardDetailModal(); 
    } 
}

async function deleteBoard(id) { 
    if(confirm("Excluir quadro?")) { 
        await fetch('api/api_kanban.php?action=delete_board', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ id: id })
        });
        boards = boards.filter(b => b.id !== id); 
        currentBoardId = null; renderBoardsMenu(); 
        document.getElementById('columns-container').innerHTML = ''; 
    } 
}

async function deleteColumn(i) {
    if (confirm("Excluir coluna? Todos os cards dentro dela serão removidos.")) {
        const board = boards.find(b => b.id === currentBoardId);
        const col = board.columns[i];
        // Chama a API para excluir a coluna (e seus cards via CASCADE no banco)
        await fetch('api/api_kanban.php?action=delete_column', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ id: col.id })
        });
        board.columns.splice(i, 1);
        renderColumns();
    }
}

init();