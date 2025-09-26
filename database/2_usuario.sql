INSERT INTO usuario (nome, email, crp, senha, telefone, cargo)
VALUES 
('Ana Souza', 'ana.psicologa@example.com', '06/123456', '$argon2id$v=19$m=65536,t=3,p=4$T40RrjTlRpERwlr+7ffq7A$jPpEeJqk7I7SPf+ArBScVt8watjG4gw+z+XTvcNRxao', '(11) 91234-5678', 'psicologo'),
('Carlos Lima', 'carlos.secretaria@example.com', NULL, '$argon2id$v=19$m=65536,t=3,p=4$viMtBVYIIXFRFdzsvEGRpQ$Fg8QO09R5tAh3rF5cLseEfSWjxDy5sglm5xdfkFjixw', '(11) 99876-5432', 'secretaria');

INSERT INTO secretaria_pertence (psicologo_id, secretaria_id)
VALUES
    (1, 2);