// ── Gerenciamento de Tema ──
// Aplica o tema salvo imediatamente (antes do paint) para evitar flash
(function() {
    const saved = localStorage.getItem('theme') || 'light';
    document.documentElement.setAttribute('data-theme', saved);
})();

function initThemeToggle() {
    const btn = document.getElementById('theme-toggle-btn');
    if (!btn) return;

    function update(theme) {
        document.documentElement.setAttribute('data-theme', theme);
        localStorage.setItem('theme', theme);
        const knob = btn.querySelector('.theme-toggle-knob');
        const icon = btn.querySelector('.theme-toggle-icon');
        if (knob) knob.textContent = theme === 'dark' ? '🌙' : '☀️';
        if (icon) icon.textContent = theme === 'dark' ? 'Escuro' : 'Claro';
    }

    // Aplica estado inicial
    update(localStorage.getItem('theme') || 'light');

    btn.addEventListener('click', () => {
        const current = document.documentElement.getAttribute('data-theme');
        update(current === 'dark' ? 'light' : 'dark');
    });
}

document.addEventListener('DOMContentLoaded', initThemeToggle);
