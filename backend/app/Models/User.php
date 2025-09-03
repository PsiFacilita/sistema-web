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
    public bool $subscription_active = false;
    public ?string $subscription_expires = null;

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
        return $u;
    }

    public function findByEmail(string $email): ?self
    {
        $query = "SELECT id, nome, email, senha
                  FROM usuario WHERE email = :email";
        $row = $this->fetchRow($query, ['email' => $email]);
        return $row ? self::fromRow($row) : null;
    }

    public function verifyPassword(string $plain): bool
    {
        return password_verify($plain, $this->password);
    }
}
