<?php
declare(strict_types=1);

namespace App\Models;

final class Otp extends Model
{
    public ?int $id = null;
    public int $usuario_id;
    public string $desafio_id;
    public string $codigo_hash;
    public string $expira_em;
    public int $tentativas = 0;
    public int $usado = 0;

    public function criar(int $usuarioId, string $desafioId, string $codigoHash, string $expiraEm): bool
    {
        $sql = 'INSERT INTO codigos_otp (usuario_id, desafio_id, codigo_hash, expira_em) VALUES (:u,:d,:h,:e)';
        return $this->executeQuery($sql, [':u'=>$usuarioId,':d'=>$desafioId,':h'=>$codigoHash,':e'=>$expiraEm]);
    }

    public function buscarPorDesafio(string $desafioId): ?array
    {
        $sql = 'SELECT * FROM codigos_otp WHERE desafio_id=:d LIMIT 1';
        return $this->fetchRow($sql, [':d'=>$desafioId]) ?: null;
    }

    public function incrementarTentativas(int $id): bool
    {
        $sql = 'UPDATE codigos_otp SET tentativas=tentativas+1 WHERE id=:id';
        return $this->executeQuery($sql, [':id'=>$id]);
    }

    public function marcarUsado(int $id): bool
    {
        $sql = 'UPDATE codigos_otp SET usado=1 WHERE id=:id';
        return $this->executeQuery($sql, [':id'=>$id]);
    }
}
