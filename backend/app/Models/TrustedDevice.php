<?php
declare(strict_types=1);

namespace App\Models;

final class TrustedDevice extends Model
{
    public ?int $id = null;
    public int $usuario_id;
    public string $hash_dispositivo;
    public ?string $agente_usuario = null;
    public ?string $ip = null;
    public string $expira_em;

    public function criar(int $usuarioId, string $hash, ?string $agente, ?string $ip, string $expiraEm): bool
    {
        $sql = 'INSERT INTO dispositivos_confiaveis (usuario_id, hash_dispositivo, agente_usuario, ip, expira_em) VALUES (:u,:h,:a,:i,:e)';
        return $this->executeQuery($sql, [':u'=>$usuarioId,':h'=>$hash,':a'=>$agente,':i'=>$ip,':e'=>$expiraEm]);
    }

    public function existeValido(int $usuarioId, string $hash): bool
    {
        $sql = 'SELECT id FROM dispositivos_confiaveis WHERE usuario_id=:u AND hash_dispositivo=:h AND expira_em>NOW() LIMIT 1';
        return (bool)$this->fetchRow($sql, [':u'=>$usuarioId,':h'=>$hash]);
    }
}
