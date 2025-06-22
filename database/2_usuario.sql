INSERT INTO usuario (nome, email, crp, senha, telefone, cargo)
VALUES 
('Ana Souza', 'ana.psicologa@example.com', '06/123456', SHA2('senha123', 256), '(11) 91234-5678', 'psicologo'),
('Carlos Lima', 'carlos.secretaria@example.com', NULL, SHA2('senha123', 256), '(11) 99876-5432', 'secretaria');