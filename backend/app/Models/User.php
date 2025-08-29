<?php
declare(strict_types=1);

namespace App\Models;

use PDO;

final class User
{
    public ?int $id = null;
    public string $nome = '';
    public string $email = '';
    public string $senha = '';
    public ?string $crp = null;
    public ?string $telefone = null;
    public string $cargo = 'psicologo';

    public static function findByEmail(PDO $db, string $email): ?self
    {
        $stmt = $db->prepare('SELECT * FROM usuario WHERE email = :email LIMIT 1');
        $stmt->execute(['email' => $email]);
        $row = $stmt->fetch();

        if (!$row) {
            return null;
        }

        $u = new self();
        $u->id       = (int)$row['id'];
        $u->nome     = (string)$row['nome'];
        $u->email    = (string)$row['email'];
        $u->senha    = (string)$row['senha'];
        $u->crp      = $row['crp'] ?? null;
        $u->telefone = $row['telefone'] ?? null;
        $u->cargo    = (string)$row['cargo'];

        return $u;
    }

    /**
     * Cria um novo usuário (com senha já hashada).
     */
    public static function create(PDO $db, array $data): self
    {
        $hash = password_hash($data['senha'], PASSWORD_ARGON2ID);

        $stmt = $db->prepare("
            INSERT INTO usuario (nome, email, senha, crp, telefone, cargo)
            VALUES (:nome, :email, :senha, :crp, :telefone, :cargo)
        ");
        $stmt->execute([
            'nome'     => $data['nome'],
            'email'    => $data['email'],
            'senha'    => $hash,
            'crp'      => $data['crp'] ?? null,
            'telefone' => $data['telefone'] ?? null,
            'cargo'    => $data['cargo'] ?? 'psicologo',
        ]);

        $id = (int)$db->lastInsertId();
        return self::findByEmail($db, $data['email']);
    }

    /**
     * Verifica senha usando Argon2id.
     */
    public function verifyPassword(string $plain): bool
    {
        return password_verify($plain, $this->senha);
    }
}
