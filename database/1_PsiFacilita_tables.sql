CREATE TABLE IF NOT EXISTS usuario (
    id                   INT AUTO_INCREMENT PRIMARY KEY,
    nome                 VARCHAR(100) NOT NULL,
    email                VARCHAR(155) NOT NULL UNIQUE,
    crp                  VARCHAR(15) NULL UNIQUE,
    senha             VARCHAR(255) NOT NULL,
    telefone                VARCHAR(20) DEFAULT NULL,
    cargo                 ENUM('psicologo', 'secretaria') DEFAULT 'psicologo' NOT NULL,
    criado_em           TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    atualizado_em           TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    );

CREATE TABLE IF NOT EXISTS reset (
  id                   INT AUTO_INCREMENT PRIMARY KEY,
  usuario_id              INT NOT NULL,
  token          TEXT DEFAULT NULL,
  token_expira_em  DATETIME DEFAULT NULL,
  reset_autorizado     BOOLEAN NOT NULL DEFAULT FALSE,
  criado_em           TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  atualizado_em           TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_reset_users FOREIGN KEY (usuario_id) REFERENCES usuario(id) ON DELETE CASCADE
  );

CREATE TABLE IF NOT EXISTS paciente (
   id         INT AUTO_INCREMENT PRIMARY KEY,
   usuario_id    INT NOT NULL,
   nome       VARCHAR(255) NOT NULL,                      -- Criptografado
   cpf        VARCHAR(100) NOT NULL UNIQUE,               -- Criptografado
   rg         VARCHAR(100) NOT NULL UNIQUE,               -- Criptografado
   data_nascimento VARCHAR(80) NOT NULL,                       -- Criptografado
   email      VARCHAR(300) NULL UNIQUE,                   -- Criptografado
   telefone      VARCHAR(100) NOT NULL,                      -- Criptografado
   notas      TEXT NULL,                                  -- Criptografado
   ativo     BOOLEAN NOT NULL DEFAULT TRUE,
   criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
   CONSTRAINT fk_patients_usuario FOREIGN KEY (usuario_id) REFERENCES usuario(id) ON DELETE CASCADE
   );

CREATE TABLE IF NOT EXISTS campos_personalizados (
   id          INT AUTO_INCREMENT PRIMARY KEY,
   usuario_id     INT NOT NULL,
   nome_campo  VARCHAR(255) NOT NULL,
   tipo_campo  ENUM('text','number','date','textarea','email','phone') NOT NULL,
   obrigatorio BOOLEAN DEFAULT FALSE,
   criado_em  TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
   FOREIGN KEY (usuario_id) REFERENCES usuario(id) ON DELETE CASCADE
   );

CREATE TABLE IF NOT EXISTS campo_personalizado_pacientes (
   paciente_id       INT NOT NULL,
   campo_personalizado_id  INT NOT NULL,
   value            TEXT,                                 -- Criptografado
   PRIMARY KEY (paciente_id, campo_personalizado_id),
   FOREIGN KEY (paciente_id) REFERENCES paciente(id) ON DELETE CASCADE,
   FOREIGN KEY (campo_personalizado_id) REFERENCES campos_personalizados(id) ON DELETE CASCADE
    );

CREATE TABLE IF NOT EXISTS tipo_documento (
    id          INT AUTO_INCREMENT PRIMARY KEY,
    name        VARCHAR(255) NOT NULL,
    criado_em  TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    atualizado_em  TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    );

CREATE TABLE IF NOT EXISTS documentos (
    id                INT AUTO_INCREMENT PRIMARY KEY,
    usuario_id           INT NOT NULL,
    paciente_id        INT NOT NULL,
    tipo_documento_id  INT NOT NULL,
    conteudo           LONGTEXT NOT NULL,                   -- Criptografado
    status            ENUM('rascunho', 'final', 'arquivado', 'revisao_pendente') NOT NULL DEFAULT 'rascunho',
    criado_em        TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    atualizado_em        TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (usuario_id) REFERENCES usuario(id) ON DELETE CASCADE,
    FOREIGN KEY (paciente_id) REFERENCES paciente(id) ON DELETE CASCADE,
    FOREIGN KEY (tipo_documento_id) REFERENCES tipo_documento(id) ON DELETE RESTRICT
    );

CREATE TABLE IF NOT EXISTS template (
    id               INT AUTO_INCREMENT PRIMARY KEY,
    tipo_documento_id INT NOT NULL,
    usuario_id           INT NOT NULL,
    conteudo        LONGTEXT NOT NULL,                   -- Criptografado
    criado_em     TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    atualizado_em     TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (tipo_documento_id) REFERENCES tipo_documento(id) ON DELETE CASCADE,
    FOREIGN KEY (usuario_id) REFERENCES usuario(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS agenda (
    id                INT AUTO_INCREMENT PRIMARY KEY,
    usuario_id           INT NOT NULL,
    paciente_id        INT NOT NULL,
    horario_inicio        DATETIME NOT NULL,
    horario_fim          DATETIME NOT NULL,
    status            ENUM('agendado', 'confirmado', 'cancelado', 'reagendado') NOT NULL DEFAULT 'agendado',
    criado_em        TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    atualizado_em        TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (usuario_id) REFERENCES usuario(id) ON DELETE CASCADE,
    FOREIGN KEY (paciente_id) REFERENCES paciente(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS configuracao (
   id INT AUTO_INCREMENT PRIMARY KEY,
   usuario_id INT NOT NULL,
   criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
   atualizado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
   FOREIGN KEY (usuario_id) REFERENCES usuario(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS configuracao_turnos (
   id INT AUTO_INCREMENT PRIMARY KEY,
   configuracao_id INT NOT NULL,
   turno_inicio TIME NOT NULL,
   turno_fim TIME NOT NULL,
   FOREIGN KEY (configuracao_id) REFERENCES configuracao(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS configuracao_dias (
   configuracao_id INT NOT NULL,
   dia ENUM('domingo', 'segunda', 'terça', 'quarta', 'quinta', 'sexta', 'sábado') NOT NULL,
   PRIMARY KEY (configuracao_id, dia),
   FOREIGN KEY (configuracao_id) REFERENCES configuracao(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS configuracao_dias_especificos (
   id INT AUTO_INCREMENT PRIMARY KEY,
   configuracao_id INT NOT NULL,
   data DATE NOT NULL,
   horario_inicio TIME,
   horario_fim TIME,
   motivo VARCHAR(255),
   tipo ENUM('fechado', 'alterado') DEFAULT 'fechado',
   FOREIGN KEY (configuracao_id) REFERENCES configuracao(id) ON DELETE CASCADE,
   UNIQUE (configuracao_id, data)
);

CREATE TABLE IF NOT EXISTS secretaria_pertence (
    psicologo_id INT NOT NULL,
    secretaria_id INT NOT NULL,
    criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    atualizado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (psicologo_id, secretaria_id),
    FOREIGN KEY (psicologo_id) REFERENCES usuario(id) ON DELETE CASCADE,
    FOREIGN KEY (secretaria_id) REFERENCES usuario(id) ON DELETE CASCADE
);
CREATE TABLE IF NOT EXISTS codigos_otp (
                                           id BIGINT AUTO_INCREMENT PRIMARY KEY,
                                           usuario_id INT NOT NULL,
                                           desafio_id CHAR(36) NOT NULL,
    codigo_hash VARCHAR(255) NOT NULL,
    expira_em DATETIME NOT NULL,
    tentativas INT NOT NULL DEFAULT 0,
    usado TINYINT(1) NOT NULL DEFAULT 0,
    criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    atualizado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY(desafio_id),
    KEY(usuario_id),
    KEY(expira_em),
    CONSTRAINT fk_codigos_otp_usuario FOREIGN KEY (usuario_id) REFERENCES usuario(id) ON DELETE CASCADE
    );

CREATE TABLE IF NOT EXISTS dispositivos_confiaveis (
                                                       id BIGINT AUTO_INCREMENT PRIMARY KEY,
                                                       usuario_id INT NOT NULL,
                                                       hash_dispositivo CHAR(64) NOT NULL,
    agente_usuario TEXT NULL,
    ip VARCHAR(45) NULL,
    expira_em DATETIME NOT NULL,
    criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    atualizado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY(usuario_id, hash_dispositivo),
    KEY(expira_em),
    CONSTRAINT fk_dispositivos_confiaveis_usuario FOREIGN KEY (usuario_id) REFERENCES usuario(id) ON DELETE CASCADE
    );

