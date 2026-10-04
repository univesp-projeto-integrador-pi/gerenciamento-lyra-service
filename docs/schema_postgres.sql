-- =====================================================================
-- schema_postgres.sql - Banco de dados: API de Funcionarios e Obras (Lyra)
-- SGBD: PostgreSQL
-- Uso:  psql -U usuario -d lyra -f schema_postgres.sql
-- Obs.: nomes de colunas em camelCase ficam entre aspas duplas, como o
--       Prisma gera (ex.: "funcionarioId").
-- =====================================================================

DROP TABLE IF EXISTS documentos_pro CASCADE;
DROP TABLE IF EXISTS alocacoes      CASCADE;
DROP TABLE IF EXISTS obras          CASCADE;
DROP TABLE IF EXISTS funcionarios   CASCADE;
DROP FUNCTION IF EXISTS set_atualizado_em() CASCADE;

-- ---------------------------------------------------------------------
-- Funcao generica: atualiza "atualizadoEm" a cada UPDATE
-- (se a API usa @updatedAt do Prisma, os triggers abaixo sao opcionais)
-- ---------------------------------------------------------------------
CREATE FUNCTION set_atualizado_em() RETURNS trigger AS $$
BEGIN
    NEW."atualizadoEm" = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ---------------------------------------------------------------------
-- Tabela: funcionarios
-- ---------------------------------------------------------------------
CREATE TABLE funcionarios (
    id            SERIAL        PRIMARY KEY,
    nome          TEXT          NOT NULL,
    email         TEXT          NOT NULL UNIQUE,
    cargo         TEXT          NOT NULL,
    salario       NUMERIC(10,2) NOT NULL CHECK (salario >= 0),
    "criadoEm"      TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizadoEm"  TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- ---------------------------------------------------------------------
-- Tabela: obras
-- ---------------------------------------------------------------------
CREATE TABLE obras (
    id            SERIAL  PRIMARY KEY,
    nome          TEXT    NOT NULL,
    endereco      TEXT    NOT NULL,
    status        TEXT    NOT NULL DEFAULT 'PLANEJADA'
                  CHECK (status IN ('PLANEJADA','EM_ANDAMENTO','CONCLUIDA','CANCELADA')),
    "dataInicio"  DATE,
    "dataFim"     DATE,
    "criadoEm"      TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizadoEm"  TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CHECK ("dataFim" IS NULL OR "dataInicio" IS NULL OR "dataFim" >= "dataInicio")
);

-- ---------------------------------------------------------------------
-- Tabela associativa: alocacoes (N:N entre funcionarios e obras)
-- ---------------------------------------------------------------------
CREATE TABLE alocacoes (
    id              SERIAL  PRIMARY KEY,
    "funcionarioId" INTEGER NOT NULL REFERENCES funcionarios(id) ON DELETE CASCADE ON UPDATE CASCADE,
    "obraId"        INTEGER NOT NULL REFERENCES obras(id)        ON DELETE CASCADE ON UPDATE CASCADE,
    "criadoEm"      TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UNIQUE ("funcionarioId", "obraId")
);

-- ---------------------------------------------------------------------
-- Tabela: documentos_pro (exames, EPI e treinamentos) - funcionarios 1:N
-- ---------------------------------------------------------------------
CREATE TABLE documentos_pro (
    id              SERIAL  PRIMARY KEY,
    "funcionarioId" INTEGER NOT NULL REFERENCES funcionarios(id) ON DELETE CASCADE ON UPDATE CASCADE,
    tipo            TEXT    NOT NULL CHECK (tipo IN ('EXAME','EPI','TREINAMENTO')),
    descricao       TEXT    NOT NULL,
    "dataEmissao"   DATE    NOT NULL,
    "dataValidade"  DATE    NOT NULL,
    "criadoEm"      TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizadoEm"  TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CHECK ("dataValidade" >= "dataEmissao")
);

-- ---------------------------------------------------------------------
-- Indices
-- ---------------------------------------------------------------------
CREATE INDEX idx_alocacoes_obraId          ON alocacoes("obraId");
CREATE INDEX idx_obras_status              ON obras(status);
CREATE INDEX idx_funcionarios_cargo        ON funcionarios(cargo);
CREATE INDEX idx_documentos_funcionarioId  ON documentos_pro("funcionarioId");
CREATE INDEX idx_documentos_dataValidade   ON documentos_pro("dataValidade");

-- ---------------------------------------------------------------------
-- Triggers de atualizadoEm
-- ---------------------------------------------------------------------
CREATE TRIGGER trg_funcionarios_atualizado BEFORE UPDATE ON funcionarios
    FOR EACH ROW EXECUTE FUNCTION set_atualizado_em();
CREATE TRIGGER trg_obras_atualizado BEFORE UPDATE ON obras
    FOR EACH ROW EXECUTE FUNCTION set_atualizado_em();
CREATE TRIGGER trg_documentos_pro_atualizado BEFORE UPDATE ON documentos_pro
    FOR EACH ROW EXECUTE FUNCTION set_atualizado_em();
