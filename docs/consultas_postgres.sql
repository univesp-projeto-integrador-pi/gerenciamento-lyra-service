-- =====================================================================
-- consultas_postgres.sql - Consultas de teste e relatorios (PostgreSQL)
-- =====================================================================

-- 1) Funcionarios de uma obra (troque o ID)
SELECT f.id, f.nome, f.cargo
FROM alocacoes a
JOIN funcionarios f ON f.id = a."funcionarioId"
WHERE a."obraId" = 1
ORDER BY f.nome;

-- 2) Obras em que um funcionario esta alocado (troque o ID)
SELECT o.id, o.nome, o.status
FROM alocacoes a
JOIN obras o ON o.id = a."obraId"
WHERE a."funcionarioId" = 1
ORDER BY o.nome;

-- 3) Quantidade de funcionarios por obra (inclui obras sem ninguem)
SELECT o.nome AS obra, COUNT(a.id) AS qtd_funcionarios
FROM obras o
LEFT JOIN alocacoes a ON a."obraId" = o.id
GROUP BY o.id, o.nome
ORDER BY qtd_funcionarios DESC;

-- 4) Funcionarios sem nenhuma alocacao
SELECT f.id, f.nome, f.cargo
FROM funcionarios f
LEFT JOIN alocacoes a ON a."funcionarioId" = f.id
WHERE a.id IS NULL;

-- 5) Obras por status
SELECT status, COUNT(*) AS total
FROM obras
GROUP BY status;

-- 6) Custo mensal de salarios por obra
SELECT o.nome AS obra, SUM(f.salario) AS custo_mensal_salarios
FROM obras o
JOIN alocacoes a    ON a."obraId" = o.id
JOIN funcionarios f ON f.id = a."funcionarioId"
GROUP BY o.id, o.nome
ORDER BY custo_mensal_salarios DESC;

-- 7) Funcionarios alocados em mais de uma obra
SELECT f.nome, COUNT(a.id) AS qtd_obras
FROM funcionarios f
JOIN alocacoes a ON a."funcionarioId" = f.id
GROUP BY f.id, f.nome
HAVING COUNT(a.id) > 1;

-- 8) Media salarial por cargo
SELECT cargo, COUNT(*) AS qtd, ROUND(AVG(salario), 2) AS media_salarial
FROM funcionarios
GROUP BY cargo
ORDER BY media_salarial DESC;

-- 9) Painel: obra, funcionario e cargo
SELECT o.nome AS obra, f.nome AS funcionario, f.cargo
FROM alocacoes a
JOIN obras o        ON o.id = a."obraId"
JOIN funcionarios f ON f.id = a."funcionarioId"
ORDER BY o.nome, f.nome;

-- 10) Situacao de todos os documentos
SELECT f.nome AS funcionario, d.tipo, d.descricao, d."dataValidade",
       CASE
         WHEN d."dataValidade" < CURRENT_DATE THEN 'VENCIDO'
         WHEN d."dataValidade" <= CURRENT_DATE + INTERVAL '30 days' THEN 'VENCE EM 30 DIAS'
         ELSE 'VALIDO'
       END AS situacao
FROM documentos_pro d
JOIN funcionarios f ON f.id = d."funcionarioId"
ORDER BY d."dataValidade";

-- 11) Documentos vencidos
SELECT f.nome AS funcionario, d.tipo, d.descricao, d."dataValidade"
FROM documentos_pro d
JOIN funcionarios f ON f.id = d."funcionarioId"
WHERE d."dataValidade" < CURRENT_DATE
ORDER BY d."dataValidade";

-- 12) Documentos que vencem nos proximos 30 dias
SELECT f.nome AS funcionario, d.tipo, d.descricao, d."dataValidade"
FROM documentos_pro d
JOIN funcionarios f ON f.id = d."funcionarioId"
WHERE d."dataValidade" BETWEEN CURRENT_DATE AND CURRENT_DATE + INTERVAL '30 days'
ORDER BY d."dataValidade";

-- 13) Funcionarios sem nenhum documento cadastrado
SELECT f.id, f.nome, f.cargo
FROM funcionarios f
LEFT JOIN documentos_pro d ON d."funcionarioId" = f.id
WHERE d.id IS NULL;

-- 14) Funcionarios ALOCADOS em obra com algum documento vencido (alerta)
SELECT DISTINCT f.nome AS funcionario, o.nome AS obra
FROM alocacoes a
JOIN funcionarios f   ON f.id = a."funcionarioId"
JOIN obras o          ON o.id = a."obraId"
JOIN documentos_pro d ON d."funcionarioId" = f.id
WHERE d."dataValidade" < CURRENT_DATE
ORDER BY f.nome;

-- 15) Quantidade de documentos por tipo
SELECT tipo, COUNT(*) AS total
FROM documentos_pro
GROUP BY tipo;

-- ----- Testes das regras de integridade (devem FALHAR) -----
--   INSERT INTO alocacoes ("funcionarioId","obraId") VALUES (1,1);
--   INSERT INTO funcionarios (nome,email,cargo,salario) VALUES ('X','joao@email.com','Y',1);
--   INSERT INTO obras (nome,endereco,status) VALUES ('X','Y','INVALIDO');
--   INSERT INTO documentos_pro ("funcionarioId",tipo,descricao,"dataEmissao","dataValidade") VALUES (1,'OUTRO','X','2026-01-01','2026-12-31');
--   INSERT INTO documentos_pro ("funcionarioId",tipo,descricao,"dataEmissao","dataValidade") VALUES (1,'EXAME','X','2026-12-31','2026-01-01');
-- Exclusao em cascata (apaga alocacoes e documentos do funcionario 1):
--   DELETE FROM funcionarios WHERE id = 1;
