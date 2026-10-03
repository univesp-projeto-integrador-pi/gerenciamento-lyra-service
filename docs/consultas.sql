-- =====================================================================
-- consultas.sql - Consultas de teste e relatorios
-- =====================================================================

-- 1) Funcionarios de uma obra (troque o ID)
SELECT f.id, f.nome, f.cargo
FROM alocacoes a
JOIN funcionarios f ON f.id = a.funcionarioId
WHERE a.obraId = 1
ORDER BY f.nome;

-- 2) Obras em que um funcionario esta alocado (troque o ID)
SELECT o.id, o.nome, o.status
FROM alocacoes a
JOIN obras o ON o.id = a.obraId
WHERE a.funcionarioId = 1
ORDER BY o.nome;

-- 3) Quantidade de funcionarios por obra (inclui obras sem ninguem)
SELECT o.nome AS obra, COUNT(a.id) AS qtd_funcionarios
FROM obras o
LEFT JOIN alocacoes a ON a.obraId = o.id
GROUP BY o.id, o.nome
ORDER BY qtd_funcionarios DESC;

-- 4) Funcionarios sem nenhuma alocacao
SELECT f.id, f.nome, f.cargo
FROM funcionarios f
LEFT JOIN alocacoes a ON a.funcionarioId = f.id
WHERE a.id IS NULL;

-- 5) Obras por status
SELECT status, COUNT(*) AS total
FROM obras
GROUP BY status;

-- 6) Custo mensal de salarios por obra (soma dos salarios dos alocados)
SELECT o.nome AS obra, SUM(f.salario) AS custo_mensal_salarios
FROM obras o
JOIN alocacoes a    ON a.obraId = o.id
JOIN funcionarios f ON f.id = a.funcionarioId
GROUP BY o.id, o.nome
ORDER BY custo_mensal_salarios DESC;

-- 7) Funcionarios alocados em mais de uma obra
SELECT f.nome, COUNT(a.id) AS qtd_obras
FROM funcionarios f
JOIN alocacoes a ON a.funcionarioId = f.id
GROUP BY f.id, f.nome
HAVING COUNT(a.id) > 1;

-- 8) Media salarial por cargo
SELECT cargo, COUNT(*) AS qtd, ROUND(AVG(salario), 2) AS media_salarial
FROM funcionarios
GROUP BY cargo
ORDER BY media_salarial DESC;

-- 9) Painel: obra, funcionario e cargo (visao geral das alocacoes)
SELECT o.nome AS obra, f.nome AS funcionario, f.cargo
FROM alocacoes a
JOIN obras o        ON o.id = a.obraId
JOIN funcionarios f ON f.id = a.funcionarioId
ORDER BY o.nome, f.nome;

-- 10) Situacao de todos os documentos (VENCIDO / VENCE EM 30 DIAS / VALIDO)
SELECT f.nome AS funcionario, d.tipo, d.descricao, d.dataValidade,
       CASE
         WHEN d.dataValidade < date('now') THEN 'VENCIDO'
         WHEN d.dataValidade <= date('now','+30 days') THEN 'VENCE EM 30 DIAS'
         ELSE 'VALIDO'
       END AS situacao
FROM documentos_pro d
JOIN funcionarios f ON f.id = d.funcionarioId
ORDER BY d.dataValidade;

-- 11) Documentos vencidos
SELECT f.nome AS funcionario, d.tipo, d.descricao, d.dataValidade
FROM documentos_pro d
JOIN funcionarios f ON f.id = d.funcionarioId
WHERE d.dataValidade < date('now')
ORDER BY d.dataValidade;

-- 12) Documentos que vencem nos proximos 30 dias
SELECT f.nome AS funcionario, d.tipo, d.descricao, d.dataValidade
FROM documentos_pro d
JOIN funcionarios f ON f.id = d.funcionarioId
WHERE d.dataValidade BETWEEN date('now') AND date('now','+30 days')
ORDER BY d.dataValidade;

-- 13) Funcionarios sem nenhum documento cadastrado
SELECT f.id, f.nome, f.cargo
FROM funcionarios f
LEFT JOIN documentos_pro d ON d.funcionarioId = f.id
WHERE d.id IS NULL;

-- 14) Funcionarios ALOCADOS em obra com algum documento vencido (alerta)
SELECT DISTINCT f.nome AS funcionario, o.nome AS obra
FROM alocacoes a
JOIN funcionarios f ON f.id = a.funcionarioId
JOIN obras o        ON o.id = a.obraId
JOIN documentos_pro d ON d.funcionarioId = f.id
WHERE d.dataValidade < date('now')
ORDER BY f.nome;

-- 15) Quantidade de documentos por tipo
SELECT tipo, COUNT(*) AS total
FROM documentos_pro
GROUP BY tipo;

-- ----- Testes das regras de integridade (devem FALHAR) -----
-- Alocacao duplicada:
--   INSERT INTO alocacoes (funcionarioId, obraId) VALUES (1, 1);
-- E-mail repetido:
--   INSERT INTO funcionarios (nome,email,cargo,salario) VALUES ('X','joao@email.com','Y',1);
-- Status invalido:
--   INSERT INTO obras (nome,endereco,status) VALUES ('X','Y','INVALIDO');
-- Exclusao em cascata (apaga as alocacoes do funcionario 1):
--   DELETE FROM funcionarios WHERE id = 1;  (apaga tambem os documentos_pro dele)
-- Tipo de documento invalido:
--   INSERT INTO documentos_pro (funcionarioId,tipo,descricao,dataEmissao,dataValidade) VALUES (1,'OUTRO','X','2026-01-01','2026-12-31');
-- Validade anterior a emissao:
--   INSERT INTO documentos_pro (funcionarioId,tipo,descricao,dataEmissao,dataValidade) VALUES (1,'EXAME','X','2026-12-31','2026-01-01');
