<?php
session_start();
if (isset($_SESSION['user_id'])) {
    header("Location: dashboard.php");
    exit();
}
?>
<!DOCTYPE html>
<html lang="pt-br">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Login - Central de Projetos</title>
    <link rel="stylesheet" href="css/login.css">
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0/css/all.min.css">
    <link rel="icon" href="ico/projeto.png">
</head>
<body>
    <div class="login-container">

        <!-- ── LOGIN ── -->
        <div class="auth-box" id="login-box">
            <div class="auth-logo">
                <div class="auth-logo-icon"><i class="fas fa-diagram-project"></i></div>
                <div class="auth-logo-text">
                    Central
                    <p>de Projetos</p>
                </div>
            </div>

            <h2>Bem-vindo de volta!</h2>
            <p class="subtitle">Entre na sua conta para continuar</p>

            <div class="msg" id="login-msg"></div>

            <form id="login-form">
                <div class="field">
                    <input type="email" id="login-email" placeholder="Seu e-mail" required autocomplete="email">
                    <i class="fas fa-envelope"></i>
                </div>
                <div class="field">
                    <input type="password" id="login-password" placeholder="Sua senha" required autocomplete="current-password">
                    <i class="fas fa-lock"></i>
                </div>
                <button type="submit" class="btn-auth">Entrar</button>
            </form>

            <div class="divider"><span>ou</span></div>

            <p class="auth-switch">
                Não tem uma conta?
                <a href="#" id="show-register">Cadastre-se grátis</a>
            </p>
        </div>

        <!-- ── CADASTRO ── -->
        <div class="auth-box hidden" id="register-box">
            <div class="auth-logo">
                <div class="auth-logo-icon"><i class="fas fa-diagram-project"></i></div>
                <div class="auth-logo-text">
                    Central
                    <p>de Projetos</p>
                </div>
            </div>

            <h2>Criar conta</h2>
            <p class="subtitle">Preencha os dados para se cadastrar</p>

            <div class="msg" id="register-msg"></div>

            <form id="register-form">
                <div class="field">
                    <input type="text" id="reg-name" placeholder="Seu nome completo" required autocomplete="name">
                    <i class="fas fa-user"></i>
                </div>
                <div class="field">
                    <input type="email" id="reg-email" placeholder="Seu e-mail" required autocomplete="email">
                    <i class="fas fa-envelope"></i>
                </div>
                <div class="field">
                    <input type="password" id="reg-password" placeholder="Crie uma senha" required autocomplete="new-password">
                    <i class="fas fa-lock"></i>
                </div>
                <button type="submit" class="btn-auth">Criar conta</button>
            </form>

            <div class="divider"><span>ou</span></div>

            <p class="auth-switch">
                Já tem uma conta?
                <a href="#" id="show-login">Fazer login</a>
            </p>
        </div>

    </div>
    <script src="js/login.js"></script>
</body>
</html>
