-- =====================================================================
-- seed.sql - Dados de exemplo (rode DEPOIS do schema.sql)
-- =====================================================================
PRAGMA foreign_keys = ON;

INSERT INTO funcionarios (nome, email, cargo, salario) VALUES
 ('Joao da Silva',    'joao@email.com',    'Auxiliar de Limpeza', 2270.00),
 ('Maria Oliveira',   'maria@email.com',   'Lider de Equipe',     4200.00),
 ('Carlos Souza',     'carlos@email.com',  'Auxiliar de Limpeza', 2270.00),
 ('Ana Pereira',      'ana@email.com',     'Auxiliar de Limpeza', 2270.00),
 ('Pedro Santos',     'pedro@email.com',   'Auxiliar de Limpeza', 2270.00),
 ('Luciana Lima',     'luciana@email.com', 'Auxiliar de Limpeza', 2270.00);

INSERT INTO obras (nome, endereco, status, dataInicio, dataFim) VALUES
 ('Residencial Primavera', 'Rua das Flores, 100',      'EM_ANDAMENTO', '2026-09-01', NULL),
 ('Edificio Central',      'Av. Paulista, 1500',       'EM_ANDAMENTO', '2026-03-10', NULL),
 ('Reforma Escola Municipal','Rua da Escola, 45',      'CONCLUIDA',    '2025-06-01', '2026-02-15'),
 ('Galpao Industrial',     'Rod. Anhanguera, km 32',   'PLANEJADA',    '2027-01-10', NULL);

INSERT INTO alocacoes (funcionarioId, obraId) VALUES
 (1, 1), (2, 1), (4, 1),
 (1, 2), (3, 2), (5, 2),
 (2, 3), (6, 3),
 (6, 4);

INSERT INTO documentos_pro (funcionarioId, tipo, descricao, dataEmissao, dataValidade) VALUES
 (1, 'EXAME',       'ASO - Atestado de Saude Ocupacional',     '2026-03-15', '2027-03-15'),
 (1, 'EPI',         'Ficha de entrega de EPI',                 '2026-01-10', '2026-12-10'),
 (1, 'TREINAMENTO', 'NR-35 Trabalho em Altura',                '2025-08-01', '2026-08-01'),
 (2, 'EXAME',       'ASO - Atestado de Saude Ocupacional',     '2026-05-20', '2027-05-20'),
 (2, 'TREINAMENTO', 'NR-35 Trabalho em Altura',                '2026-02-10', '2028-02-10'),
 (3, 'EXAME',       'ASO - Atestado de Saude Ocupacional',     '2025-10-20', '2026-10-20'),
 (3, 'TREINAMENTO', 'NR-10 Seguranca em Eletricidade',         '2024-10-25', '2026-10-25'),
 (4, 'EXAME',       'ASO - Atestado de Saude Ocupacional',     '2026-06-01', '2027-06-01'),
 (4, 'EPI',         'Ficha de entrega de EPI',                 '2026-01-10', '2026-12-10'),
 (5, 'EXAME',       'ASO - Atestado de Saude Ocupacional',     '2025-09-15', '2026-09-15');
-- Obs.: a funcionaria 6 fica sem documentos de proposito (para testar consultas).
