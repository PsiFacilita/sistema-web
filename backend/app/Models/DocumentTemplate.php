<?php
declare(strict_types=1);

namespace App\Models;

final class DocumentTemplate extends Model
{
    public function findAll(int $userId): array
    {
        $query = "SELECT t.id, t.name, t.usuario_id, t.conteudo, t.criado_em, t.atualizado_em
                  FROM template t
                  WHERE t.usuario_id = :uid
                  ORDER BY t.atualizado_em DESC";
        
        $rows = $this->fetchAllRows($query, ['uid' => $userId]);
        foreach ($rows as &$r) {
            if (isset($r['conteudo']) && $r['conteudo'] !== '') {
                $dec = $this->dec((string)$r['conteudo'], 'template.conteudo');
                if ($dec !== null) $r['conteudo'] = $dec;
            }
        }
        return $rows;
    }

    public function findById(int $id, int $userId): ?array
    {
        $query = "SELECT t.id, t.name, t.usuario_id, t.conteudo, t.criado_em, t.atualizado_em
                  FROM template t
                  WHERE t.id = :id AND t.usuario_id = :uid";
        
        $row = $this->fetchRow($query, ['id' => $id, 'uid' => $userId]);
        if (!$row) return null;

        if (isset($row['conteudo']) && $row['conteudo'] !== '') {
            $dec = $this->dec((string)$row['conteudo'], 'template.conteudo');
            if ($dec !== null) $row['conteudo'] = $dec;
        }
        return $row;
    }

    public function create(array $data): string
    {
        $query = "INSERT INTO template (name, usuario_id, conteudo)
                  VALUES (:name, :usuario_id, :conteudo)";
        
        $encConteudo = $this->enc($data['conteudo'], 'template.conteudo');

        $this->executeQuery($query, [
            'name' => $data['name'],
            'usuario_id' => $data['usuario_id'],
            'conteudo' => $encConteudo
        ]);

        return $this->lastInsertId();
    }

    public function update(int $id, int $userId, array $data): bool
    {
        $query = "UPDATE template SET name = :name, conteudo = :conteudo
                  WHERE id = :id AND usuario_id = :uid";
        
        $encConteudo = $this->enc($data['conteudo'], 'template.conteudo');

        return $this->executeQuery($query, [
            'name' => $data['name'],
            'conteudo' => $encConteudo,
            'id' => $id,
            'uid' => $userId
        ]);
    }

    public function delete(int $id, int $userId): bool
    {
        $query = "DELETE FROM template WHERE id = :id AND usuario_id = :uid";
        return $this->executeQuery($query, ['id' => $id, 'uid' => $userId]);
    }
}
