<?php
declare(strict_types=1);

namespace App\Models;

use PDOException;

final class Patient extends Model
{
    public function getPatientsByUserId(int $userId): array
    {
        $query = "SELECT id, nome, email, telefone, 
                  CASE WHEN ativo = 1 THEN 'active' ELSE 'inactive' END as ativo, 
                  criado_em
                  FROM paciente 
                  WHERE usuario_id = :uid 
                  ORDER BY criado_em DESC";

        return $this->fetchAllRows($query, ['uid' => $userId]);
    }

    public function buscarPorUsuario(int $userId): array
    {
        return $this->getPatientsByUserId($userId);
    }

    public function buscarPorId(int $pacienteId, int $userId): ?array
    {
        $query = "SELECT id, nome, email, telefone, cpf, rg, data_nascimento, notas,
                  CASE WHEN ativo = 1 THEN 'active' ELSE 'inactive' END as ativo, 
                  criado_em
                  FROM paciente 
                  WHERE id = :id AND usuario_id = :uid";
        return $this->fetchRow($query, ['id' => $pacienteId, 'uid' => $userId]);
    }

    public function criar(array $dados): int
    {
        // Validação dos campos obrigatórios
        if (empty($dados['cpf'])) {
            throw new \Exception('CPF é obrigatório');
        }
        if (empty($dados['rg'])) {
            throw new \Exception('RG é obrigatório');
        }
        if (empty($dados['data_nascimento'])) {
            throw new \Exception('Data de nascimento é obrigatória');
        }
        
        // Converte o status ativo para o formato do banco
        $ativo = isset($dados['ativo']) && $dados['ativo'] === 'active' ? 1 : 0;
        
        $query = "INSERT INTO paciente (nome, email, telefone, cpf, rg, data_nascimento, usuario_id, ativo, criado_em) 
                  VALUES (:nome, :email, :telefone, :cpf, :rg, :data_nascimento, :usuario_id, :ativo, NOW())";
        
        $parametros = [
            'nome' => $dados['nome'],
            'email' => $dados['email'],
            'telefone' => $dados['telefone'] ?? '',
            'cpf' => $dados['cpf'],
            'rg' => $dados['rg'],
            'data_nascimento' => $dados['data_nascimento'],
            'usuario_id' => $dados['usuario_id'],
            'ativo' => $ativo
        ];
        
        if ($this->executeQuery($query, $parametros)) {
            return (int) $this->lastInsertId();
        }
        
        throw new \Exception('Erro ao criar paciente');
    }

    public function atualizar(int $pacienteId, array $dados): bool
    {
        $campos = [];
        $parametros = ['id' => $pacienteId];
        
        foreach ($dados as $campo => $valor) {
            $campos[] = "{$campo} = :{$campo}";
            $parametros[$campo] = $valor;
        }
        
        if (empty($campos)) {
            return false;
        }
        
        $query = "UPDATE paciente SET " . implode(', ', $campos) . " WHERE id = :id";
        return $this->executeQuery($query, $parametros);
    }

    public function pertenceAoUsuario(int $pacienteId, int $userId): bool
    {
        $query = "SELECT COUNT(*) as count FROM paciente WHERE id = :id AND usuario_id = :uid";
        $result = $this->fetchRow($query, ['id' => $pacienteId, 'uid' => $userId]);
        return $result && $result['count'] > 0;
    }

    public function excluir(int $pacienteId): bool
    {
        $query = "DELETE FROM paciente WHERE id = :id";
        return $this->executeQuery($query, ['id' => $pacienteId]);
    }
}