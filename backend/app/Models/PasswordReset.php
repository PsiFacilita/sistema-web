<?php
declare(strict_types=1);

namespace App\Models;

use DateTimeImmutable;
use PDOException;

final class PasswordReset extends Model
{
    /**
     * Cria um registro de reset na tabela `reset`.
     * Armazena o HASH (SHA-256) no campo `token`.
     *
     * @param int $userId
     * @param string $tokenHash SHA-256 do token
     * @param DateTimeImmutable $expiresAt
     * @param string|null $ip
     * @param string|null $userAgent
     * @return string ID inserido
     */
    public function createForUser(
        int $userId,
        string $tokenHash,
        DateTimeImmutable $expiresAt,
        ?string $ip = null,
        ?string $userAgent = null
    ): string {
        $sql = 'INSERT INTO `reset` (usuario_id, token, token_expira_em, reset_autorizado)
                VALUES (?, ?, ?, 1)';

        $params = [
            1 => $userId,
            2 => $tokenHash,
            3 => $expiresAt->format('Y-m-d H:i:s'),
        ];

        try {
            $ok = $this->executeQuery($sql, $params);
            if (!$ok) {
                throw new PDOException('Falha ao inserir token de recuperação.');
            }
            return $this->lastInsertId();
        } catch (PDOException $e) {
            throw $e;
        }
    }

    /**
     * Busca um token válido (não autorizado/uso ainda e não expirado).
     *
     * @param string $tokenHash
     * @return array<string,mixed>|null
     */
    public function findValidByHash(string $tokenHash): ?array
    {
        $sql = 'SELECT id, usuario_id, token, token_expira_em, reset_autorizado, criado_em, atualizado_em
                FROM `reset`
                WHERE token = ?
                  AND reset_autorizado = 1
                  AND token_expira_em > NOW()
                LIMIT 1';

        return $this->fetchRow($sql, [1 => $tokenHash]);
    }

    /**
     * Marca um registro como autorizado (consumido).
     *
     * @param int $id
     * @return bool
     */
    public function markUsedById(int $id): bool
    {
        $sql = 'UPDATE `reset` SET reset_autorizado = 0 WHERE id = ?';
        return $this->executeQuery($sql, [1 => $id]);
    }

    /**
     * Invalida todos os tokens pendentes de um usuário.
     *
     * @param int $userId
     * @return bool
     */
    public function invalidateAllForUser(int $userId): bool
    {
        $sql = 'UPDATE `reset` SET reset_autorizado = 0 WHERE usuario_id = ? AND reset_autorizado = 1';
        return $this->executeQuery($sql, [1 => $userId]);
    }
}
