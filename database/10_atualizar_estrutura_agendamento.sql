-- Adiciona a coluna 'dia' na tabela configuracao_turnos
ALTER TABLE configuracao_turnos ADD COLUMN dia ENUM('domingo', 'segunda', 'terça', 'quarta', 'quinta', 'sexta', 'sábado') NOT NULL AFTER configuracao_id;

-- (Opcional) Se quiser migrar dados existentes, precisaria de uma lógica complexa, 
-- mas como o modelo anterior não associava turnos a dias, vamos assumir que os turnos existentes se aplicam a todos os dias ativos.
-- INSERT INTO configuracao_turnos (configuracao_id, dia, turno_inicio, turno_fim)
-- SELECT ct.configuracao_id, cd.dia, ct.turno_inicio, ct.turno_fim
-- FROM configuracao_turnos ct
-- JOIN configuracao_dias cd ON cd.configuracao_id = ct.configuracao_id;
-- DELETE FROM configuracao_turnos WHERE dia IS NULL;

-- Remove a tabela configuracao_dias pois agora a definição de dias abertos é implícita pela existência de turnos
DROP TABLE IF EXISTS configuracao_dias;
