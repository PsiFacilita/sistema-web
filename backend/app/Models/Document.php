<?php
declare(strict_types=1);

namespace App\Models;

final class Document extends Model
{
    /**
     * Get all documents for a user
     */
    public function findByUserId(int $userId): array
    {
        $query = "SELECT d.id, d.usuario_id, d.paciente_id, d.tipo_documento_id, 
                  d.status, d.criado_em, d.atualizado_em,
                  p.nome as paciente_nome,
                  td.name as tipo_documento_nome
                  FROM documentos d
                  INNER JOIN paciente p ON d.paciente_id = p.id
                  INNER JOIN tipo_documento td ON d.tipo_documento_id = td.id
                  WHERE d.usuario_id = :uid 
                  ORDER BY d.atualizado_em DESC";

        $rows = $this->fetchAllRows($query, ['uid' => $userId]);
        foreach ($rows as &$r) {
            if (isset($r['paciente_nome']) && $r['paciente_nome'] !== '') {
                $dec = $this->dec((string)$r['paciente_nome'], 'paciente.nome');
                if ($dec !== null) $r['paciente_nome'] = $dec;
            }
        }
        return $rows;
    }

    /**
     * Find a specific document by ID
     */
    public function findById(int $docId, int $userId): ?array
    {
        $query = "SELECT d.id, d.usuario_id, d.paciente_id, d.tipo_documento_id, 
                  d.conteudo, d.status, d.criado_em, d.atualizado_em,
                  p.nome as paciente_nome,
                  td.name as tipo_documento_nome
                  FROM documentos d
                  INNER JOIN paciente p ON d.paciente_id = p.id
                  INNER JOIN tipo_documento td ON d.tipo_documento_id = td.id
                  WHERE d.id = :id AND d.usuario_id = :uid";

        $row = $this->fetchRow($query, ['id' => $docId, 'uid' => $userId]);
        if (!$row) return null;

        if (isset($row['conteudo']) && $row['conteudo'] !== '') {
            $dec = $this->dec((string)$row['conteudo'], 'documentos.conteudo');
            if ($dec !== null) $row['conteudo'] = $dec;
        }
        if (isset($row['paciente_nome']) && $row['paciente_nome'] !== '') {
            $dec = $this->dec((string)$row['paciente_nome'], 'paciente.nome');
            if ($dec !== null) $row['paciente_nome'] = $dec;
        }

        return $row;
    }

    /**
     * Create a new document
     */
    public function create(array $data): int
    {
        if (empty($data['paciente_id'])) throw new \Exception('Patient ID is required');
        if (empty($data['tipo_documento_id'])) throw new \Exception('Document type is required');
        if (empty($data['conteudo'])) throw new \Exception('Content is required');
        if (empty($data['usuario_id'])) throw new \Exception('User ID is required');

        $status = $data['status'] ?? 'rascunho';
        $validStatuses = ['rascunho', 'final', 'arquivado', 'revisao_pendente'];
        if (!in_array($status, $validStatuses, true)) throw new \Exception('Invalid status');

        $encryptedContent = $this->enc((string)$data['conteudo'], 'documentos.conteudo');
        if ($encryptedContent === null) throw new \Exception('Encryption error');

        $query = "INSERT INTO documentos (usuario_id, paciente_id, tipo_documento_id, conteudo, status, criado_em) 
                  VALUES (:usuario_id, :paciente_id, :tipo_documento_id, :conteudo, :status, NOW())";

        $params = [
            'usuario_id' => (int)$data['usuario_id'],
            'paciente_id' => (int)$data['paciente_id'],
            'tipo_documento_id' => (int)$data['tipo_documento_id'],
            'conteudo' => $encryptedContent,
            'status' => $status
        ];

        if ($this->executeQuery($query, $params)) {
            return (int)$this->lastInsertId();
        }

        throw new \Exception('Error creating document');
    }

    /**
     * Update an existing document
     */
    public function update(int $docId, int $userId, array $data): bool
    {
        if (!$this->belongsToUser($docId, $userId)) {
            throw new \Exception('Document not found or does not belong to user');
        }

        $allowedFields = ['paciente_id', 'tipo_documento_id', 'conteudo', 'status'];
        $fields = [];
        $params = ['id' => $docId, 'usuario_id' => $userId];

        foreach ($data as $field => $value) {
            if (!in_array($field, $allowedFields, true)) continue;

            if ($field === 'status') {
                $validStatuses = ['rascunho', 'final', 'arquivado', 'revisao_pendente'];
                if (!in_array($value, $validStatuses, true)) throw new \Exception('Invalid status');
                $fields[] = "status = :status";
                $params['status'] = (string)$value;
                continue;
            }

            if ($field === 'conteudo') {
                $enc = $this->enc((string)$value, 'documentos.conteudo');
                if ($enc === null) throw new \Exception('Encryption error');
                $fields[] = "conteudo = :conteudo";
                $params['conteudo'] = $enc;
                continue;
            }

            if ($field === 'paciente_id') {
                $fields[] = "paciente_id = :paciente_id";
                $params['paciente_id'] = (int)$value;
                continue;
            }

            if ($field === 'tipo_documento_id') {
                $fields[] = "tipo_documento_id = :tipo_documento_id";
                $params['tipo_documento_id'] = (int)$value;
                continue;
            }
        }

        if (empty($fields)) return false;

        $query = "UPDATE documentos SET " . implode(', ', $fields) . ", atualizado_em = NOW() 
                  WHERE id = :id AND usuario_id = :usuario_id";

        return $this->executeQuery($query, $params);
    }

    /**
     * Delete a document
     */
    public function delete(int $docId, int $userId): bool
    {
        if (!$this->belongsToUser($docId, $userId)) {
            throw new \Exception('Document not found or does not belong to user');
        }

        $query = "DELETE FROM documentos WHERE id = :id AND usuario_id = :usuario_id";
        return $this->executeQuery($query, ['id' => $docId, 'usuario_id' => $userId]);
    }

    /**
     * Get all documents for a specific patient
     */
    public function findByPatientId(int $patientId, int $userId): array
    {
        $query = "SELECT d.id, d.usuario_id, d.paciente_id, d.tipo_documento_id, 
                  d.status, d.criado_em, d.atualizado_em,
                  p.nome as paciente_nome,
                  td.name as tipo_documento_nome
                  FROM documentos d
                  INNER JOIN paciente p ON d.paciente_id = p.id
                  INNER JOIN tipo_documento td ON d.tipo_documento_id = td.id
                  WHERE d.paciente_id = :paciente_id AND d.usuario_id = :uid 
                  ORDER BY d.atualizado_em DESC";

        $rows = $this->fetchAllRows($query, ['paciente_id' => $patientId, 'uid' => $userId]);
        foreach ($rows as &$r) {
            if (isset($r['paciente_nome']) && $r['paciente_nome'] !== '') {
                $dec = $this->dec((string)$r['paciente_nome'], 'paciente.nome');
                if ($dec !== null) $r['paciente_nome'] = $dec;
            }
        }
        return $rows;
    }

    /**
     * Check if a document belongs to a user
     */
    public function belongsToUser(int $docId, int $userId): bool
    {
        $query = "SELECT COUNT(*) as count FROM documentos WHERE id = :id AND usuario_id = :uid";
        $result = $this->fetchRow($query, ['id' => $docId, 'uid' => $userId]);
        return $result && (int)$result['count'] > 0;
    }

    public function patientBelongsToUser(int $patientId, int $userId): bool
    {
        $query = "SELECT COUNT(*) as count FROM paciente WHERE id = :id AND usuario_id = :uid";
        $result = $this->fetchRow($query, ['id' => $patientId, 'uid' => $userId]);
        return $result && (int)$result['count'] > 0;
    }
}
