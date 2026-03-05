// Estrutura de dados centralizada
let sprintData = {
    backlog: [],
    sprints: []
};

let currentView = 'backlog'; 
let modalTargetType = '';    
let isAscending = true;

/**
 * Inicialização - Carrega os dados da API ao abrir a página
 */
async function init() {
    try {
        const response = await fetch('api/api_sprints.php?action=load_all');
        const res = await response.json();
        
        if (res.success) {
            sprintData.backlog = res.backlog || [];
            sprintData.sprints = res.sprints || [];
            renderSprintsNav();
            renderContent();
        } else {
            console.error("Erro retornado pela API:", res.message);
        }
    } catch (e) {
        console.error("Erro crítico na requisição init:", e);
    }
}

/**
 * Utilitário para formatar datas no padrão brasileiro
 */
function formatDateBR(dateStr) {
    if (!dateStr || dateStr === "0000-00-00") return "--/--/--";
    const [year, month, day] = dateStr.split('-');
    return `${day}/${month}/${year}`;
}

// --- GESTÃO DE MODAIS ---

function openGenericModal(type, sprintId = null) {
    modalTargetType = type;
    const modal = document.getElementById('creation-modal');
    const itemForm = document.getElementById('item-form-container');
    const sprintForm = document.getElementById('sprint-form-container');
    const title = document.getElementById('creation-modal-title');

    // Reset de estados e campos ocultos
    document.getElementById('edit-index').value = "-1";
    document.getElementById('edit-item-id').value = ""; 
    document.getElementById('edit-sprint-id').value = sprintId || "";
    
    // Reset de campos de Item
    document.getElementById('creation-input-name').value = '';
    document.getElementById('creation-description').value = '';
    document.getElementById('creation-priority').value = 'Média';
    document.getElementById('creation-status').value = 'Novo';
    document.getElementById('creation-type').value = 'User Story';
    document.getElementById('creation-points').value = '';

    // Reset de campos de Sprint
    document.getElementById('sprint-input-name').value = '';
    document.getElementById('sprint-start-date').value = '';
    document.getElementById('sprint-end-date').value = '';

    if (type === 'sprint') {
        itemForm.style.display = 'none';
        sprintForm.style.display = 'block';
        title.innerText = sprintId ? 'Editar Sprint' : 'Nova Sprint';
        
        if (sprintId) {
            const s = sprintData.sprints.find(s => s.id == sprintId);
            if(s) {
                document.getElementById('sprint-input-name').value = s.nome_sprint;
                document.getElementById('sprint-start-date').value = s.data_inicio;
                document.getElementById('sprint-end-date').value = s.data_fim;
            }
        }
    } else {
        itemForm.style.display = 'block';
        sprintForm.style.display = 'none';
        title.innerText = 'Novo Item';
    }
    modal.style.display = 'flex';
}

function openEditModal(itemId) {
    modalTargetType = 'item';
    const modal = document.getElementById('creation-modal');
    
    let item;
    if (currentView === 'backlog') {
        item = sprintData.backlog.find(i => i.id == itemId);
    } else {
        const currentSprint = sprintData.sprints.find(s => s.id == currentView);
        if (currentSprint && currentSprint.itens) {
            item = currentSprint.itens.find(i => i.id == itemId);
        }
    }

    if (!item) return;

    document.getElementById('creation-modal-title').innerText = 'Editar Item';
    document.getElementById('edit-item-id').value = item.id;
    
    document.getElementById('creation-input-name').value = item.titulo || "";
    document.getElementById('creation-type').value = item.tipo || "User Story";
    document.getElementById('creation-priority').value = item.prioridade || "Média";
    document.getElementById('creation-status').value = item.status || "Novo";
    document.getElementById('creation-points').value = item.storypoints || 0;
    document.getElementById('creation-description').value = item.descricao || "";

    document.getElementById('item-form-container').style.display = 'block';
    document.getElementById('sprint-form-container').style.display = 'none';
    modal.style.display = 'flex';
}

function closeModals() {
    document.getElementById('creation-modal').style.display = 'none';
    document.getElementById('move-modal').style.display = 'none';
}

/**
 * Lógica Principal de Salvamento
 */
document.getElementById('creation-confirm-btn').onclick = async () => {
    const btn = document.getElementById('creation-confirm-btn');
    btn.disabled = true;

    try {
        if (modalTargetType === 'sprint') {
            const id = document.getElementById('edit-sprint-id').value;
            const payload = {
                id: id || null,
                nome_sprint: document.getElementById('sprint-input-name').value,
                data_inicio: document.getElementById('sprint-start-date').value,
                data_fim: document.getElementById('sprint-end-date').value,
                itens: id ? (sprintData.sprints.find(s => s.id == id).itens || []) : []
            };

            await fetch('api/api_sprints.php?action=save_sprint', {
                method: 'POST',
                headers: {'Content-Type': 'application/json'},
                body: JSON.stringify(payload)
            });

        } else {
            const itemId = document.getElementById('edit-item-id').value;

            const itemData = {
                id: itemId !== "" ? itemId : null, 
                titulo: document.getElementById('creation-input-name').value,
                tipo: document.getElementById('creation-type').value,
                prioridade: document.getElementById('creation-priority').value,
                status: document.getElementById('creation-status').value,
                storypoints: parseInt(document.getElementById('creation-points').value) || 0,
                descricao: document.getElementById('creation-description').value
            };

            if (currentView === 'backlog') {
                await fetch('api/api_sprints.php?action=save_backlog_item', {
                    method: 'POST',
                    headers: {'Content-Type': 'application/json'},
                    body: JSON.stringify(itemData)
                });
            } else {
                const sprint = sprintData.sprints.find(s => s.id == currentView);
                if (!sprint.itens) sprint.itens = [];
                
                if (itemId !== "") {
                    const idx = sprint.itens.findIndex(i => i.id == itemId);
                    if (idx !== -1) sprint.itens[idx] = itemData;
                } else {
                    // Não geramos ID temporário aqui — o banco gerará um ID real
                    // após o save_sprint. O init() ao final recarrega tudo da API.
                    sprint.itens.push(itemData);
                }

                await fetch('api/api_sprints.php?action=save_sprint', {
                    method: 'POST',
                    headers: {'Content-Type': 'application/json'},
                    body: JSON.stringify(sprint)
                });
            }
        }
    } catch (e) {
        console.error("Erro ao salvar:", e);
    } finally {
        btn.disabled = false;
        closeModals();
        init(); 
    }
};

// --- RENDERIZAÇÃO DA INTERFACE ---

function renderContent() {
    const tbody = document.getElementById('items-tbody');
    const title = document.getElementById('view-title');
    const stats = document.getElementById('sprint-stats-container');
    const prog = document.getElementById('progress-container');
    const dates = document.getElementById('sprint-dates-display');
    
    if(!tbody) return;
    tbody.innerHTML = '';
    let itemsToShow = [], ptsP = 0, ptsC = 0;

    if (currentView === 'backlog') {
        title.textContent = 'Backlog do Produto';
        itemsToShow = [...sprintData.backlog];
        if(stats) stats.style.display = 'none'; 
        if(prog) prog.style.display = 'none'; 
        if(dates) dates.style.display = 'none';
    } else {
        const s = sprintData.sprints.find(s => s.id == currentView);
        if(!s) return;
        title.textContent = s.nome_sprint;
        itemsToShow = [...(s.itens || [])];
        if(stats) stats.style.display = 'flex'; 
        if(prog) prog.style.display = 'block'; 
        if(dates) dates.style.display = 'flex';
        
        const startDisp = document.getElementById('display-start-date');
        const endDisp = document.getElementById('display-end-date');
        if(startDisp) startDisp.textContent = formatDateBR(s.data_inicio);
        if(endDisp) endDisp.textContent = formatDateBR(s.data_fim);
    }

    itemsToShow.sort((a, b) => isAscending ? a.titulo.localeCompare(b.titulo) : b.titulo.localeCompare(a.titulo));

    itemsToShow.forEach((item) => {
        const sp = parseInt(item.storypoints) || 0;
        ptsP += sp;
        if (item.status === 'Concluído') ptsC += sp;

        let typeCls = item.tipo === 'Task' ? 'type-task' : (item.tipo === 'Bug' ? 'type-bug' : 'type-story');
        let statusColor = item.status === 'Em Progresso' ? '#3b82f6' : (item.status === 'Concluído' ? '#22c55e' : (item.status === 'Impedido' ? '#ef4444' : '#64748b'));

        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td><div style="display:flex; align-items:center;"><span class="badge-type ${typeCls}">${item.tipo}</span><b>${item.titulo}</b></div></td>
            <td><span class="badge" style="background:${statusColor}; color:white;">${item.status}</span></td>
            <td>${item.prioridade}</td>
            <td><span class="points-badge">${sp}</span></td>
            <td>
                <button class="primary-btn" style="padding:4px 8px; font-size:0.7rem;" onclick="openMoveModalByItemID(${item.id})">Mover</button>
                <button onclick="openEditModal(${item.id})" style="background:none; border:none; color:#3b82f6; cursor:pointer; margin-left:8px;"><i class="fas fa-edit"></i></button>
                <button onclick="deleteItemByID(${item.id})" style="background:none; border:none; color:#ef4444; cursor:pointer; margin-left:8px;"><i class="fas fa-trash"></i></button>
            </td>
        `;
        tbody.appendChild(tr);
    });

    const pPlan = document.getElementById('points-planned');
    const pDone = document.getElementById('points-completed');
    const pFill = document.getElementById('progress-bar-fill');

    if(pPlan) pPlan.textContent = `Planejado: ${ptsP} SP`;
    if(pDone) pDone.textContent = `Concluído: ${ptsC} SP`;
    if(pFill) pFill.style.width = (ptsP > 0 ? (ptsC/ptsP)*100 : 0) + "%";
}

function renderSprintsNav() {
    const list = document.getElementById('sprints-nav-list');
    if(!list) return;
    list.innerHTML = '';
    
    const navBacklog = document.getElementById('nav-backlog');
    if(navBacklog) navBacklog.className = currentView === 'backlog' ? 'active' : '';
    
    sprintData.sprints.forEach(s => {
        const li = document.createElement('li');
        li.className = currentView == s.id ? 'active' : '';
        li.innerHTML = `
            <span onclick="switchView(${s.id})" style="flex:1; cursor:pointer;">
                <i class="fas fa-rocket"></i> ${s.nome_sprint}
            </span>
            <div style="display: flex; gap: 8px;">
                <button class="sidebar-icon-trash" onclick="openGenericModal('sprint', ${s.id})" title="Editar Sprint">
                    <i class="fas fa-pen" style="font-size:0.8rem;"></i>
                </button>
                <button class="sidebar-icon-trash" onclick="deleteSprint(${s.id})" title="Excluir Sprint">
                    <i class="fas fa-trash"></i>
                </button>
            </div>
        `;
        list.appendChild(li);
    });
}

function filterItems() {
    const val = document.getElementById('quick-filter').value.toLowerCase();
    const rows = document.querySelectorAll('#items-tbody tr');
    rows.forEach(r => {
        const text = r.querySelector('td:first-child').textContent.toLowerCase();
        r.style.display = text.includes(val) ? "" : "none";
    });
}

function toggleSortOrder() {
    isAscending = !isAscending;
    const icon = document.querySelector('.sort-btn i');
    if(icon) icon.className = isAscending ? 'fas fa-sort-alpha-down' : 'fas fa-sort-alpha-up';
    renderContent();
}

// --- GESTÃO POR ID ---

function openMoveModalByItemID(itemId) {
    let index;
    if(currentView === 'backlog') index = sprintData.backlog.findIndex(i => i.id == itemId);
    else {
        const s = sprintData.sprints.find(s => s.id == currentView);
        index = s.itens.findIndex(i => i.id == itemId);
    }
    openMoveModal(index);
}

async function deleteItemByID(itemId) {
    if (confirm("Excluir este item permanentemente?")) {
        if (currentView === 'backlog') {
            await fetch('api/api_sprints.php?action=delete_backlog_item', {
                method: 'POST', headers: {'Content-Type': 'application/json'},
                body: JSON.stringify({ id: itemId })
            });
        } else {
            const sprint = sprintData.sprints.find(s => s.id == currentView);
            sprint.itens = sprint.itens.filter(i => i.id != itemId);
            await fetch('api/api_sprints.php?action=save_sprint', {
                method: 'POST', headers: {'Content-Type': 'application/json'},
                body: JSON.stringify(sprint)
            });
        }
        init();
    }
}

function openMoveModal(index) {
    document.getElementById('move-item-index').value = index;
    const select = document.getElementById('move-destination-select');
    if(!select) return;
    select.innerHTML = '';
    
    if (currentView !== 'backlog') {
        const opt = document.createElement('option');
        opt.value = 'backlog'; opt.textContent = 'Mover para Backlog';
        select.appendChild(opt);
    }
    sprintData.sprints.forEach(s => {
        if (s.id != currentView) {
            const opt = document.createElement('option');
            opt.value = s.id; opt.textContent = `Mover para ${s.nome_sprint}`;
            select.appendChild(opt);
        }
    });
    document.getElementById('move-modal').style.display = 'flex';
}

async function confirmMove() {
    const moveIdx = document.getElementById('move-item-index').value;
    const destId = document.getElementById('move-destination-select').value;
    let item;
    
    if (currentView === 'backlog') {
        item = sprintData.backlog.splice(moveIdx, 1)[0];
        await fetch('api/api_sprints.php?action=delete_backlog_item', {
            method: 'POST', headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({ id: item.id })
        });
    } else {
        const originSprint = sprintData.sprints.find(s => s.id == currentView);
        item = originSprint.itens.splice(moveIdx, 1)[0];
        await fetch('api/api_sprints.php?action=save_sprint', {
            method: 'POST', headers: {'Content-Type': 'application/json'},
            body: JSON.stringify(originSprint)
        });
    }

    if (destId === 'backlog') {
        delete item.id; 
        await fetch('api/api_sprints.php?action=save_backlog_item', {
            method: 'POST', headers: {'Content-Type': 'application/json'},
            body: JSON.stringify(item)
        });
    } else {
        const destSprint = sprintData.sprints.find(s => s.id == destId);
        if(!destSprint.itens) destSprint.itens = [];
        // ID será mantido se vier do backlog ou gerado pelo banco no próximo carregamento
        destSprint.itens.push(item);
        await fetch('api/api_sprints.php?action=save_sprint', {
            method: 'POST', headers: {'Content-Type': 'application/json'},
            body: JSON.stringify(destSprint)
        });
    }
    closeModals();
    init();
}

async function deleteSprint(id) {
    if (confirm("Excluir Sprint? Itens vinculados voltarão ao Backlog.")) {
        const sprint = sprintData.sprints.find(s => s.id == id);
        if (sprint.itens && sprint.itens.length > 0) {
            for (let item of sprint.itens) {
                delete item.id; 
                await fetch('api/api_sprints.php?action=save_backlog_item', {
                    method: 'POST', headers: {'Content-Type': 'application/json'},
                    body: JSON.stringify(item)
                });
            }
        }
        await fetch('api/api_sprints.php?action=delete_sprint', {
            method: 'POST', headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({ id: id })
        });
        currentView = 'backlog';
        init();
    }
}

function switchView(id) { 
    currentView = id; 
    renderSprintsNav(); 
    renderContent(); 
}

function showBacklog() { switchView('backlog'); }
window.onclick = (e) => { if (e.target.className === 'modal') closeModals(); };

init();