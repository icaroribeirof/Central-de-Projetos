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
    <title>Dashboard - Central de Projetos</title>
    <link rel="stylesheet" href="css/theme.css">
    <link rel="stylesheet" href="css/dashboard.css">
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0/css/all.min.css">
    <link rel="icon" href="ico/projeto.png">
</head>
<body>
    <nav class="navbar">
        <h1>Central de Projetos</h1>
        <div class="nav-right">
            <button class="theme-toggle" id="theme-toggle-btn" title="Alternar tema">
                <div class="theme-toggle-track"><div class="theme-toggle-knob">☀️</div></div>
                <span class="theme-toggle-icon">Claro</span>
            </button>
            <span style="color: white; margin-right: 20px;">Olá, <strong><?php echo $_SESSION['user_name']; ?></strong></span>
            <button class="logout-btn">Sair</button>
        </div>
    </nav>
    <div class="container">
        <div class="welcome-msg">
            <h2>Dashboard</h2>
            <p>O que vamos gerenciar hoje?</p>
        </div>
        <div class="menu-cards">
            <a href="kanban.php" class="menu-item">
                <i class="fas fa-columns"></i>
                <h3>Quadros Kanban</h3>
                <p>Gerencie colunas e cartões</p>
            </a>
            <a href="sprints.php" class="menu-item">
                <i class="fas fa-sync"></i>
                <h3>Sprints</h3>
                <p>Planejamento ágil e Backlog</p>
            </a>
        </div>
    </div>
    <script src="js/theme.js"></script>
    <script src="js/dashboard.js"></script>
</body>
</html>