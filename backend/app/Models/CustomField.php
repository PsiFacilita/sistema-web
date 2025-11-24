<?php
declare(strict_types=1);

namespace App\Models;

final class CustomField extends Model
{
    public function getByUserId(int $userId): array
    {
        $q = "SELECT 
                id,
                nome_campo AS nome,
                tipo_campo AS tipo,
                obrigatorio,
                'active' AS status,
                criado_em
              FROM campos_personalizados
              WHERE usuario_id = :uid
              ORDER BY criado_em DESC";
        $rows = $this->fetchAllRows($q, ['uid' => $userId]) ?? [];
        foreach ($rows as &$row) {
            $row['obrigatorio'] = (int)$row['obrigatorio'];
        }
        return $rows;
    }

    public function getOneById(int $id, int $userId): ?array
    {
        $q = "SELECT 
                id,
                nome_campo AS nome,
                tipo_campo AS tipo,
                obrigatorio,
                'active' AS status,
                criado_em
              FROM campos_personalizados
              WHERE id = :id AND usuario_id = :uid";
        $row = $this->fetchRow($q, ['id' => $id, 'uid' => $userId]);
        if (!$row) {
            return null;
        }
        $row['obrigatorio'] = (int)$row['obrigatorio'];
        return $row;
    }

    public function createField(array $data): int
    {
        $required = !empty($data['obrigatorio']) ? 1 : 0;

        $q = "INSERT INTO campos_personalizados 
                (usuario_id, nome_campo, tipo_campo, obrigatorio, criado_em) 
              VALUES 
                (:usuario_id, :nome_campo, :tipo_campo, :obrigatorio, NOW())";

        $params = [
            'usuario_id' => (int)$data['usuario_id'],
            'nome_campo' => $data['nome'],
            'tipo_campo' => $data['tipo'],
            'obrigatorio' => $required,
        ];

        if ($this->executeQuery($q, $params)) {
            return (int)$this->lastInsertId();
        }

        throw new \Exception('Erro ao criar campo personalizado');
    }

    public function updateField(int $id, array $data): bool
    {
        $fields = [];
        $params = ['id' => $id];

        foreach ($data as $key => $value) {
            if ($key === 'nome') {
                $fields[] = "nome_campo = :nome_campo";
                $params['nome_campo'] = $value;
            } elseif ($key === 'tipo') {
                $fields[] = "tipo_campo = :tipo_campo";
                $params['tipo_campo'] = $value;
            } elseif ($key === 'obrigatorio') {
                $fields[] = "obrigatorio = :obrigatorio";
                $params['obrigatorio'] = (int)$value;
            }
        }

        if (!$fields) {
            return false;
        }

        $q = "UPDATE campos_personalizados SET " . implode(', ', $fields) . " WHERE id = :id";
        return $this->executeQuery($q, $params);
    }

    public function belongsToUser(int $id, int $userId): bool
    {
        $q = "SELECT COUNT(*) AS count 
              FROM campos_personalizados 
              WHERE id = :id AND usuario_id = :uid";
        $row = $this->fetchRow($q, ['id' => $id, 'uid' => $userId]);
        return $row && (int)$row['count'] > 0;
    }

    public function deleteField(int $id): bool
    {
        $q = "DELETE FROM campos_personalizados WHERE id = :id";
        return $this->executeQuery($q, ['id' => $id]);
    }
}
