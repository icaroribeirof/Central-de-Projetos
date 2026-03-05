const loginBox    = document.getElementById('login-box');
const registerBox = document.getElementById('register-box');

function showMsg(id, text, type) {
    const el = document.getElementById(id);
    el.textContent = text;
    el.className = 'msg ' + type;
}

function switchTo(hide, show) {
    hide.classList.add('slide-out');
    setTimeout(() => {
        hide.classList.add('hidden');
        hide.classList.remove('slide-out');
        show.classList.remove('hidden');
        show.classList.add('slide-in');
        setTimeout(() => show.classList.remove('slide-in'), 400);
    }, 250);
}

document.getElementById('show-register').onclick = (e) => {
    e.preventDefault();
    switchTo(loginBox, registerBox);
};

document.getElementById('show-login').onclick = (e) => {
    e.preventDefault();
    switchTo(registerBox, loginBox);
};

// ── Cadastro ──
document.getElementById('register-form').onsubmit = async (e) => {
    e.preventDefault();
    const btn = e.target.querySelector('button');
    btn.textContent = 'Cadastrando...';
    btn.disabled = true;

    const data = {
        name:     document.getElementById('reg-name').value,
        email:    document.getElementById('reg-email').value,
        password: document.getElementById('reg-password').value
    };

    try {
        const response = await fetch('api/auth.php?action=register', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });
        const result = await response.json();

        if (result.success) {
            showMsg('register-msg', result.message, 'success');
            e.target.reset();
            setTimeout(() => switchTo(registerBox, loginBox), 1500);
        } else {
            showMsg('register-msg', result.message, 'error');
        }
    } catch {
        showMsg('register-msg', 'Erro de conexão. Tente novamente.', 'error');
    } finally {
        btn.textContent = 'Criar conta';
        btn.disabled = false;
    }
};

// ── Login ──
document.getElementById('login-form').onsubmit = async (e) => {
    e.preventDefault();
    const btn = e.target.querySelector('button');
    btn.textContent = 'Entrando...';
    btn.disabled = true;

    const data = {
        email:    document.getElementById('login-email').value,
        password: document.getElementById('login-password').value
    };

    try {
        const response = await fetch('api/auth.php?action=login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });
        const result = await response.json();

        if (result.success) {
            btn.textContent = '✓ Redirecionando...';
            window.location.href = 'dashboard.php';
        } else {
            showMsg('login-msg', result.message, 'error');
            btn.textContent = 'Entrar';
            btn.disabled = false;
        }
    } catch {
        showMsg('login-msg', 'Erro de conexão. Tente novamente.', 'error');
        btn.textContent = 'Entrar';
        btn.disabled = false;
    }
};
