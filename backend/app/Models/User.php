<?php
declare(strict_types=1);

namespace App\Models;

use App\Models\Model;

final class User extends Model
{
    public ?int $id = null;
    public string $name = '';
    public string $cpf = '';
    public string $email = '';
    private string $password = '';
    public string $role = '';
    public ?int $psicologoId = null;

    public function __construct()
    {
        parent::__construct();
    }

    private static function fromRow(array $row): self
    {
        $u = new self();
        $u->id                   = (int) $row['id'];
        $u->name                 = (string) $row['nome'];
        $u->email                = (string) $row['email'];
        $u->password             = (string) $row['senha'];
        $u->role                 = (string) $row['cargo'];
        $u->psicologoId          = (isset($row['psicologo_id'])) ? (int)$row['psicologo_id'] : null;
        return $u;
    }

    public function findByEmail(string $email): ?self
    {
        $query = "
        SELECT
            u.id,
            u.nome,
            u.email,
            u.senha,
            u.cargo,
            sp.psicologo_id AS psicologo_id
        FROM usuario u
        LEFT JOIN secretaria_pertence sp
            ON sp.secretaria_id = u.id
        WHERE u.email = :email
        LIMIT 1
    ";
        $row = $this->fetchRow($query, ['email' => $email]);
        return $row ? self::fromRow($row) : null;
    }


    public function verifyPassword(string $plain): bool
    {
        return password_verify($plain, $this->password);
    }

    public function findById(int $id): ?self
    {
        $query = "
        SELECT
            u.id,
            u.nome,
            u.email,
            u.senha,
            u.cargo,
            sp.psicologo_id AS psicologo_id
        FROM usuario u
        LEFT JOIN secretaria_pertence sp
            ON sp.secretaria_id = u.id
        WHERE u.id = :id
        LIMIT 1
    ";
        $row = $this->fetchRow($query, [':id' => $id]);
        return $row ? self::fromRow($row) : null;
    }

    public function updatePassword(int $id, string $passwordHash): bool
    {
        $sql = 'UPDATE usuario SET senha = ? WHERE id = ?';
        return $this->executeQuery($sql, [1 => $passwordHash, 2 => $id]);
    }
}
