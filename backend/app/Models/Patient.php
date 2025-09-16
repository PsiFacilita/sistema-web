<?php
declare(strict_types=1);

namespace App\Models;

use PDOException;

final class Patient extends Model
{
    public function getPatientsByUserId(int $userId): array
    {
        $query = "SELECT id, nome, email, telefone, ativo, criado_em
                  FROM paciente 
                  WHERE usuario_id = :uid 
                  ORDER BY criado_em DESC";

        return $this->fetchAllRows($query, ['uid' => $userId]);
    }
}