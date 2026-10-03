-- =====================================================================
-- schema.sql - Banco de dados: API de Funcionarios e Obras (Lyra)
-- SGBD: SQLite (compativel com o schema.prisma do projeto)
-- Uso:  sqlite3 banco.db < schema.sql
-- =====================================================================

PRAGMA foreign_keys = ON;

DROP TABLE IF EXISTS documentos_pro;
DROP TABLE IF EXISTS alocacoes;
DROP TABLE IF EXISTS obras;
DROP TABLE IF EXISTS funcionarios;

-- ---------------------------------------------------------------------
-- Tabela: funcionarios
-- ---------------------------------------------------------------------
CREATE TABLE funcionarios (
    id            INTEGER  PRIMARY KEY AUTOINCREMENT,
    nome          TEXT     NOT NULL,
    email         TEXT     NOT NULL UNIQUE,
    cargo         TEXT     NOT NULL,
    salario       REAL     NOT NULL CHECK (salario >= 0),
    criadoEm      DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    atualizadoEm  DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- ---------------------------------------------------------------------
-- Tabela: obras
-- ---------------------------------------------------------------------
CREATE TABLE obras (
    id            INTEGER  PRIMARY KEY AUTOINCREMENT,
    nome          TEXT     NOT NULL,
    endereco      TEXT     NOT NULL,
    status        TEXT     NOT NULL DEFAULT 'PLANEJADA'
                  CHECK (status IN ('PLANEJADA','EM_ANDAMENTO','CONCLUIDA','CANCELADA')),
    dataInicio    DATE,
    dataFim       DATE,
    criadoEm      DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    atualizadoEm  DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CHECK (dataFim IS NULL OR dataInicio IS NULL OR dataFim >= dataInicio)
);

-- ---------------------------------------------------------------------
-- Tabela associativa: alocacoes (relacionamento N:N)
-- ---------------------------------------------------------------------
CREATE TABLE alocacoes (
    id             INTEGER  PRIMARY KEY AUTOINCREMENT,
    funcionarioId  INTEGER  NOT NULL,
    obraId         INTEGER  NOT NULL,
    criadoEm       DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (funcionarioId) REFERENCES funcionarios(id) ON DELETE CASCADE ON UPDATE CASCADE,
    FOREIGN KEY (obraId)        REFERENCES obras(id)        ON DELETE CASCADE ON UPDATE CASCADE,
    UNIQUE (funcionarioId, obraId)
);

-- ---------------------------------------------------------------------
-- Tabela: documentos_pro (exames, EPI e treinamentos do funcionario)
-- Relacionamento: funcionarios 1:N documentos_pro
-- ---------------------------------------------------------------------
CREATE TABLE documentos_pro (
    id             INTEGER  PRIMARY KEY AUTOINCREMENT,
    funcionarioId  INTEGER  NOT NULL,
    tipo           TEXT     NOT NULL
                   CHECK (tipo IN ('EXAME','EPI','TREINAMENTO')),
    descricao      TEXT     NOT NULL,
    dataEmissao    DATE     NOT NULL,
    dataValidade   DATE     NOT NULL,
    criadoEm       DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    atualizadoEm   DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (funcionarioId) REFERENCES funcionarios(id) ON DELETE CASCADE ON UPDATE CASCADE,
    CHECK (dataValidade >= dataEmissao)
);

-- ---------------------------------------------------------------------
-- Indices (a UNIQUE ja cobre buscas por funcionarioId; falta obraId)
-- ---------------------------------------------------------------------
CREATE INDEX idx_alocacoes_obraId     ON alocacoes(obraId);
CREATE INDEX idx_obras_status         ON obras(status);
CREATE INDEX idx_funcionarios_cargo   ON funcionarios(cargo);
CREATE INDEX idx_documentos_funcionarioId ON documentos_pro(funcionarioId);
CREATE INDEX idx_documentos_dataValidade  ON documentos_pro(dataValidade);

-- ---------------------------------------------------------------------
-- Triggers: mantem atualizadoEm em dia nas atualizacoes
-- ---------------------------------------------------------------------
CREATE TRIGGER trg_funcionarios_atualizado
AFTER UPDATE ON funcionarios
FOR EACH ROW
BEGIN
    UPDATE funcionarios SET atualizadoEm = CURRENT_TIMESTAMP WHERE id = NEW.id;
END;

CREATE TRIGGER trg_obras_atualizado
AFTER UPDATE ON obras
FOR EACH ROW
BEGIN
    UPDATE obras SET atualizadoEm = CURRENT_TIMESTAMP WHERE id = NEW.id;
END;

CREATE TRIGGER trg_documentos_pro_atualizado
AFTER UPDATE ON documentos_pro
FOR EACH ROW
BEGIN
    UPDATE documentos_pro SET atualizadoEm = CURRENT_TIMESTAMP WHERE id = NEW.id;
END;
