<?php
declare(strict_types=1);

namespace App\Models;

final class User extends Model
{
    public ?int $id = null;
    public string $nome = '';
    public string $email = '';
    public ?string $telefone = null;
    public ?string $crp = null;
    public string $cargo = '';
    private string $senha = '';

    public static function fromRow(array $row): self
    {
        $u = new self();
        $u->id = (int)$row['id'];
        $u->nome = (string)$row['nome'];
        $u->email = (string)$row['email'];
        $u->telefone = $row['telefone'] ?? null;
        $u->crp = $row['crp'] ?? null;
        $u->cargo = (string)$row['cargo'];
        $u->senha = (string)$row['senha'];
        return $u;
    }

    public function findByEmail(string $email): ?self
    {
        $row = $this->fetchRow("SELECT * FROM usuario WHERE email = :email LIMIT 1", ['email' => $email]);
        return $row ? self::fromRow($row) : null;
    }

    public function findById(int $id): ?self
    {
        $row = $this->fetchRow("SELECT * FROM usuario WHERE id = :id LIMIT 1", ['id' => $id]);
        return $row ? self::fromRow($row) : null;
    }

    public function verifyPassword(string $plain): bool
    {
        return password_verify($plain, $this->senha);
    }

    public function updatePassword(int $id, string $hash): bool
    {
        return $this->executeQuery("UPDATE usuario SET senha = :s WHERE id = :id", ['s' => $hash, 'id' => $id]);
    }

    public function getProfile(int $userId): array
    {
        $r = $this->fetchRow("SELECT id, nome as name, email, telefone as phone, crp, cargo FROM usuario WHERE id = :id", ['id' => $userId]);
        return $r ?: [];
    }

    public function updateProfile(int $userId, string $nome, string $email, string $telefone, ?string $crp): bool
    {
        $e = $this->fetchColumn("SELECT id FROM usuario WHERE email = :e AND id <> :id", ['e' => $email, 'id' => $userId]);
        if ($e) throw new \Exception('Email já em uso');
        if ($crp) {
            $c = $this->fetchColumn("SELECT id FROM usuario WHERE crp = :c AND id <> :id", ['c' => $crp, 'id' => $userId]);
            if ($c) throw new \Exception('CRP já em uso');
        }
        return $this->executeQuery(
            "UPDATE usuario SET nome = :n, email = :e, telefone = :t, crp = :c WHERE id = :id",
            ['n' => $nome, 'e' => $email, 't' => $telefone, 'c' => $crp, 'id' => $userId]
        );
    }

    public function listSecretarias(int $psicologoId): array
    {
        $q = "SELECT u.id, u.nome as name, u.email, u.telefone as phone, u.cargo, sp.criado_em
              FROM secretaria_pertence sp
              INNER JOIN usuario u ON u.id = sp.secretaria_id
              WHERE sp.psicologo_id = :id
              ORDER BY u.nome ASC";
        return $this->fetchAllRows($q, ['id' => $psicologoId]);
    }

    public function createSecretaria(string $nome, string $email, string $telefone, string $senha): int
    {
        $exists = $this->fetchColumn("SELECT id FROM usuario WHERE email = :e", ['e' => $email]);
        if ($exists) throw new \Exception('Email já em uso');
        $hash = password_hash($senha, PASSWORD_DEFAULT);
        $this->executeQuery(
            "INSERT INTO usuario (nome, email, senha, telefone, cargo) VALUES (:n, :e, :s, :t, 'secretaria')",
            ['n' => $nome, 'e' => $email, 's' => $hash, 't' => $telefone]
        );
        return (int)$this->lastInsertId();
    }

    public function attachSecretaria(int $psicologoId, int $secretariaId): bool
    {
        $exists = $this->fetchColumn(
            "SELECT 1 FROM secretaria_pertence WHERE psicologo_id = :p AND secretaria_id = :s",
            ['p' => $psicologoId, 's' => $secretariaId]
        );
        if ($exists) return true;
        return $this->executeQuery(
            "INSERT INTO secretaria_pertence (psicologo_id, secretaria_id) VALUES (:p, :s)",
            ['p' => $psicologoId, 's' => $secretariaId]
        );
    }

    public function detachSecretaria(int $psicologoId, int $secretariaId): bool
    {
        $this->beginTransaction();
        try {
            // remove da pivot
            $this->executeQuery(
                "DELETE FROM secretaria_pertence WHERE psicologo_id = :p AND secretaria_id = :s",
                ['p' => $psicologoId, 's' => $secretariaId]
            );

            // remove da tabela usuario
            $this->executeQuery("DELETE FROM usuario WHERE id = :id AND cargo = 'secretaria'", ['id' => $secretariaId]);

            $this->commit();
            return true;
        } catch (\Throwable $e) {
            $this->rollback();
            throw $e;
        }
    }

    public function createOrAttachSecretaria(int $psicologoId, string $nome, string $email, string $telefone, string $senha): int
    {
        $this->beginTransaction();
        try {
            // cria o usuário
            $id = $this->createSecretaria($nome, $email, $telefone, $senha);

            // cria o vínculo
            $this->attachSecretaria($psicologoId, $id);

            $this->commit();
            return $id;
        } catch (\Throwable $e) {
            $this->rollback();
            throw $e;
        }
    }

    public function updateSecretaria(int $id, string $nome, string $email, ?string $telefone, ?string $cargo = 'secretaria'): bool
    {
        $exists = $this->fetchColumn("SELECT id FROM usuario WHERE email = :e AND id <> :id", ['e' => $email, 'id' => $id]);
        if ($exists) throw new \Exception('Email já em uso');

        return $this->executeQuery(
            "UPDATE usuario SET nome = :n, email = :e, telefone = :t, cargo = :c WHERE id = :id",
            ['n' => $nome, 'e' => $email, 't' => $telefone, 'c' => $cargo, 'id' => $id]
        );
    }
}
