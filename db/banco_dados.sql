-- ============================================================
-- Sistema de Gestão de Projetos - Schema Completo e Limpo
-- ============================================================

CREATE DATABASE IF NOT EXISTS central_projetos CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE central_projetos;

-- -----------------------------------------------
-- Usuários
-- -----------------------------------------------
CREATE TABLE IF NOT EXISTS usuarios (
    id         INT AUTO_INCREMENT PRIMARY KEY,
    nome       VARCHAR(100) NOT NULL,
    email      VARCHAR(100) NOT NULL UNIQUE,
    senha      VARCHAR(255) NOT NULL,
    criado_em  TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- -----------------------------------------------
-- Quadros Kanban
-- -----------------------------------------------
CREATE TABLE IF NOT EXISTS quadros (
    id          INT AUTO_INCREMENT PRIMARY KEY,
    usuario_id  INT NOT NULL,
    nome        VARCHAR(100) NOT NULL,
    FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE
);

-- -----------------------------------------------
-- Colunas do Kanban
-- -----------------------------------------------
CREATE TABLE IF NOT EXISTS kanban_colunas (
    id         INT AUTO_INCREMENT PRIMARY KEY,
    quadro_id  INT NOT NULL,
    nome       VARCHAR(100) NOT NULL,
    ordem      INT DEFAULT 0,
    FOREIGN KEY (quadro_id) REFERENCES quadros(id) ON DELETE CASCADE
);

-- -----------------------------------------------
-- Cards do Kanban
-- -----------------------------------------------
CREATE TABLE IF NOT EXISTS kanban_cards (
    id            INT AUTO_INCREMENT PRIMARY KEY,
    coluna_id     INT NOT NULL,
    titulo        VARCHAR(255) NOT NULL,
    descricao     TEXT,
    data_inicio   DATE,
    data_entrega  DATE,
    concluido     BOOLEAN DEFAULT FALSE,
    atividades    TEXT,      -- JSON: array de strings
    etiquetas     TEXT,      -- JSON: [{text, color}]
    membros       TEXT,      -- JSON: [{id, name, initials, color}]
    checklist     TEXT,      -- JSON: [{text, completed}]
    anexos        LONGTEXT,  -- JSON: [{name, type, data (base64), date}]
    FOREIGN KEY (coluna_id) REFERENCES kanban_colunas(id) ON DELETE CASCADE
);

-- -----------------------------------------------
-- Membros do Kanban (persistido no banco)
-- -----------------------------------------------
CREATE TABLE IF NOT EXISTS kanban_membros (
    id          INT AUTO_INCREMENT PRIMARY KEY,
    usuario_id  INT NOT NULL,
    nome        VARCHAR(100) NOT NULL,
    iniciais    VARCHAR(5) NOT NULL,
    cor         VARCHAR(10) NOT NULL,
    criado_em   TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE
);

-- -----------------------------------------------
-- Sprints
-- -----------------------------------------------
CREATE TABLE IF NOT EXISTS sprints (
    id          INT AUTO_INCREMENT PRIMARY KEY,
    usuario_id  INT NOT NULL,
    nome_sprint VARCHAR(255) NOT NULL,
    data_inicio DATE,
    data_fim    DATE,
    status      VARCHAR(50) DEFAULT 'Novo',
    itens       TEXT,  -- JSON: array de itens do sprint
    FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE
);

-- -----------------------------------------------
-- Backlog
-- -----------------------------------------------
CREATE TABLE IF NOT EXISTS backlog (
    id          INT AUTO_INCREMENT PRIMARY KEY,
    usuario_id  INT NOT NULL,
    titulo      VARCHAR(255) NOT NULL,
    tipo        VARCHAR(50) DEFAULT 'User Story',
    prioridade  VARCHAR(50) DEFAULT 'Média',
    status      VARCHAR(50) DEFAULT 'Novo',
    storypoints INT DEFAULT 0,
    descricao   TEXT,
    criado_em   TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE
);
