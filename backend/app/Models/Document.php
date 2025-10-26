<?php
declare(strict_types=1);

namespace App\Models;

use PDOException;

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

        return $this->fetchAllRows($query, ['uid' => $userId]);
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
        
        return $this->fetchRow($query, ['id' => $docId, 'uid' => $userId]);
    }

    /**
     * Create a new document
     */
    public function create(array $data): int
    {
        // Validate required fields
        if (empty($data['paciente_id'])) {
            throw new \Exception('Patient ID is required');
        }
        if (empty($data['tipo_documento_id'])) {
            throw new \Exception('Document type is required');
        }
        if (empty($data['conteudo'])) {
            throw new \Exception('Content is required');
        }
        if (empty($data['usuario_id'])) {
            throw new \Exception('User ID is required');
        }

        // Set default status if not provided
        $status = $data['status'] ?? 'rascunho';
        
        // Validate status
        $validStatuses = ['rascunho', 'final', 'arquivado', 'revisao_pendente'];
        if (!in_array($status, $validStatuses)) {
            throw new \Exception('Invalid status');
        }

        $query = "INSERT INTO documentos (usuario_id, paciente_id, tipo_documento_id, conteudo, status, criado_em) 
                  VALUES (:usuario_id, :paciente_id, :tipo_documento_id, :conteudo, :status, NOW())";
        
        $params = [
            'usuario_id' => $data['usuario_id'],
            'paciente_id' => $data['paciente_id'],
            'tipo_documento_id' => $data['tipo_documento_id'],
            'conteudo' => $data['conteudo'],
            'status' => $status
        ];
        
        if ($this->executeQuery($query, $params)) {
            return (int) $this->lastInsertId();
        }
        
        throw new \Exception('Error creating document');
    }

    /**
     * Update an existing document
     */
    public function update(int $docId, int $userId, array $data): bool
    {
        // First check if document belongs to user
        if (!$this->belongsToUser($docId, $userId)) {
            throw new \Exception('Document not found or does not belong to user');
        }

        $fields = [];
        $params = ['id' => $docId, 'usuario_id' => $userId];
        
        // Allowed fields for update
        $allowedFields = ['paciente_id', 'tipo_documento_id', 'conteudo', 'status'];
        
        foreach ($data as $field => $value) {
            if (in_array($field, $allowedFields)) {
                // Special validation for status
                if ($field === 'status') {
                    $validStatuses = ['rascunho', 'final', 'arquivado', 'revisao_pendente'];
                    if (!in_array($value, $validStatuses)) {
                        throw new \Exception('Invalid status');
                    }
                }
                
                $fields[] = "{$field} = :{$field}";
                $params[$field] = $value;
            }
        }
        
        if (empty($fields)) {
            return false;
        }
        
        $query = "UPDATE documentos SET " . implode(', ', $fields) . ", atualizado_em = NOW() 
                  WHERE id = :id AND usuario_id = :usuario_id";
        
        return $this->executeQuery($query, $params);
    }

    /**
     * Delete a document
     */
    public function delete(int $docId, int $userId): bool
    {
        // Check if document belongs to user
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

        return $this->fetchAllRows($query, ['paciente_id' => $patientId, 'uid' => $userId]);
    }

    /**
     * Check if a document belongs to a user
     */
    public function belongsToUser(int $docId, int $userId): bool
    {
        $query = "SELECT COUNT(*) as count FROM documentos WHERE id = :id AND usuario_id = :uid";
        $result = $this->fetchRow($query, ['id' => $docId, 'uid' => $userId]);
        return $result && $result['count'] > 0;
    }

    /**
     * Check if a patient belongs to a user (for validation)
     */
    public function patientBelongsToUser(int $patientId, int $userId): bool
    {
        $query = "SELECT COUNT(*) as count FROM paciente WHERE id = :id AND usuario_id = :uid";
        $result = $this->fetchRow($query, ['id' => $patientId, 'uid' => $userId]);
        return $result && $result['count'] > 0;
    }
}
