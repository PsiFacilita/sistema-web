<?php
declare(strict_types=1);

namespace App\Models;

final class Patient extends Model
{
    public function getPatientsByUserId(int $userId): array
    {
        $q = "SELECT id, nome, email, telefone, CASE WHEN ativo = 1 THEN 'active' ELSE 'inactive' END as ativo, criado_em FROM paciente WHERE usuario_id = :uid ORDER BY criado_em DESC";
        $rows = $this->fetchAllRows($q, ['uid' => $userId]) ?? [];
        foreach ($rows as &$r) {
            $r['nome'] = $this->dec($r['nome'], "nome:$userId") ?? '';
            $r['email'] = $this->dec($r['email'], "email:$userId") ?? '';
            $r['telefone'] = $this->dec($r['telefone'], "telefone:$userId") ?? '';
        }
        return $rows;
    }

    public function buscarPorId(int $pacienteId, int $userId): ?array
    {
        $q = "SELECT id, nome, email, telefone, cpf, rg, data_nascimento, notas, CASE WHEN ativo = 1 THEN 'active' ELSE 'inactive' END as ativo, criado_em FROM paciente WHERE id = :id AND usuario_id = :uid";
        $row = $this->fetchRow($q, ['id' => $pacienteId, 'uid' => $userId]);
        if (!$row) return null;
        $row['nome'] = $this->dec($row['nome'], "nome:$userId") ?? '';
        $row['email'] = $this->dec($row['email'], "email:$userId") ?? '';
        $row['telefone'] = $this->dec($row['telefone'], "telefone:$userId") ?? '';
        $row['cpf'] = $this->dec($row['cpf'], "cpf:$userId") ?? '';
        $row['rg'] = $this->dec($row['rg'], "rg:$userId") ?? '';
        $row['data_nascimento'] = $this->dec($row['data_nascimento'], "data_nascimento:$userId") ?? '';
        $row['notas'] = $this->dec($row['notas'], "notas:$userId") ?? '';
        return $row;
    }

    public function criar(array $dados): int
    {
        // Validações rigorosas para o sistema web
        if (empty($dados['cpf'])) throw new \Exception('CPF é obrigatório');
        if (empty($dados['rg'])) throw new \Exception('RG é obrigatório');
        if (empty($dados['data_nascimento'])) throw new \Exception('Data de nascimento é obrigatória');

        $ativo = isset($dados['ativo']) ? ($dados['ativo'] === 'active' ? 1 : 0) : 1;

        $q = "INSERT INTO paciente (nome, email, telefone, cpf, rg, data_nascimento, notas, usuario_id, ativo, criado_em) 
              VALUES (:nome, :email, :telefone, :cpf, :rg, :data_nascimento, :notas, :usuario_id, :ativo, NOW())";

        $uid = (int)$dados['usuario_id'];

        $p = [
            'nome' => $this->enc($dados['nome'] ?? '', "nome:$uid"),
            'email' => $this->enc($dados['email'] ?? '', "email:$uid"),
            'telefone' => $this->enc($dados['telefone'] ?? '', "telefone:$uid"),
            'cpf' => $this->enc($dados['cpf'], "cpf:$uid"),
            'rg' => $this->enc($dados['rg'], "rg:$uid"),
            'data_nascimento' => $this->enc($dados['data_nascimento'], "data_nascimento:$uid"),
            'notas' => $this->enc($dados['notas'] ?? '', "notas:$uid"),
            'usuario_id' => $uid,
            'ativo' => $ativo
        ];

        if ($this->executeQuery($q, $p)) return (int)$this->lastInsertId();
        throw new \Exception('Erro ao criar paciente');
    }

    public function criarViaChatBot(array $dados): int
    {
        // Validações simplificadas para o Chatbot (apenas CPF obrigatório)
        if (empty($dados['cpf'])) throw new \Exception('CPF é obrigatório');
        // RG e Data de Nascimento são opcionais aqui

        $ativo = isset($dados['ativo']) ? ($dados['ativo'] === 'active' ? 1 : 0) : 1;

        $q = "INSERT INTO paciente (nome, email, telefone, cpf, rg, data_nascimento, notas, usuario_id, ativo, criado_em) 
              VALUES (:nome, :email, :telefone, :cpf, :rg, :data_nascimento, :notas, :usuario_id, :ativo, NOW())";

        $uid = (int)$dados['usuario_id'];

        $p = [
            'nome' => $this->enc($dados['nome'] ?? '', "nome:$uid"),
            'email' => $this->enc($dados['email'] ?? '', "email:$uid"),
            'telefone' => $this->enc($dados['telefone'] ?? '', "telefone:$uid"),
            'cpf' => $this->enc($dados['cpf'], "cpf:$uid"),
            'rg' => $this->enc($dados['rg'] ?? '', "rg:$uid"),
            'data_nascimento' => $this->enc($dados['data_nascimento'] ?? '', "data_nascimento:$uid"),
            'notas' => $this->enc($dados['notas'] ?? '', "notas:$uid"),
            'usuario_id' => $uid,
            'ativo' => $ativo
        ];

        if ($this->executeQuery($q, $p)) return (int)$this->lastInsertId();
        throw new \Exception('Erro ao criar paciente via chatbot');
    }

    public function atualizar(int $pacienteId, array $dados): bool
    {
        $uid = isset($dados['usuario_id']) ? (int)$dados['usuario_id'] : null;
        $map = [
            'nome' => "nome",
            'email' => "email",
            'telefone' => "telefone",
            'cpf' => "cpf",
            'rg' => "rg",
            'data_nascimento' => "data_nascimento",
            'notas' => "notas",
        ];

        $campos = [];
        $params = ['id' => $pacienteId];

        foreach ($dados as $campo => $valor) {
            if ($campo === 'ativo') {
                $campos[] = "ativo = :ativo";
                $params['ativo'] = ($valor === 'active' || $valor === 1) ? 1 : 0;
                continue;
            }
            if (array_key_exists($campo, $map)) {
                $aad = $uid ? "{$campo}:{$uid}" : $campo;
                $campos[] = "{$campo} = :{$campo}";
                $params[$campo] = $this->enc((string)$valor, $aad);
            } else {
                $campos[] = "{$campo} = :{$campo}";
                $params[$campo] = $valor;
            }
        }

        if (!$campos) return false;
        $q = "UPDATE paciente SET " . implode(', ', $campos) . " WHERE id = :id";
        return $this->executeQuery($q, $params);
    }

    public function pertenceAoUsuario(int $pacienteId, int $userId): bool
    {
        $q = "SELECT COUNT(*) as count FROM paciente WHERE id = :id AND usuario_id = :uid";
        $r = $this->fetchRow($q, ['id' => $pacienteId, 'uid' => $userId]);
        return $r && (int)$r['count'] > 0;
    }

    public function excluir(int $pacienteId): bool
    {
        $q = "DELETE FROM paciente WHERE id = :id";
        return $this->executeQuery($q, ['id' => $pacienteId]);
    }

    public function findByPhone(int $userId, string $phone): ?array
    {
        $q = "SELECT id, nome, email, telefone, CASE WHEN ativo = 1 THEN 'active' ELSE 'inactive' END as ativo, criado_em
              FROM paciente WHERE usuario_id = :uid ORDER BY criado_em DESC";
        $rows = $this->fetchAllRows($q, ['uid' => $userId]) ?? [];
        foreach ($rows as &$r) {
            $r['nome'] = $this->dec($r['nome'], "nome:$userId") ?? '';
            $r['email'] = $this->dec($r['email'], "email:$userId") ?? '';
            $r['telefone'] = $this->dec($r['telefone'], "telefone:$userId") ?? '';
            
            // Normalize DB phone for comparison
            $dbPhone = preg_replace('/[^0-9]/', '', $r['telefone']);
            if ($dbPhone === $phone) return $r;
        }
        return null;
    }

    public function findByPhoneGlobal(string $phone): ?array
    {
        $q = "SELECT id, usuario_id, nome, email, telefone, CASE WHEN ativo = 1 THEN 'active' ELSE 'inactive' END as ativo, criado_em
              FROM paciente ORDER BY criado_em DESC";
        $rows = $this->fetchAllRows($q) ?? [];
        foreach ($rows as &$r) {
            $ownerId = $r['usuario_id'];
            $r['nome'] = $this->dec($r['nome'], "nome:$ownerId") ?? '';
            $r['email'] = $this->dec($r['email'], "email:$ownerId") ?? '';
            $r['telefone'] = $this->dec($r['telefone'], "telefone:$ownerId") ?? '';
            
            // Normalize DB phone for comparison
            $dbPhone = preg_replace('/[^0-9]/', '', $r['telefone']);
            if ($dbPhone === $phone) return $r;
        }
        return null;
    }

    public function getCustomFieldsForPatient(int $patientId, int $userId): array
    {
        $q = "SELECT 
                f.id,
                f.nome_campo,
                f.tipo_campo,
                f.obrigatorio,
                cpp.value
              FROM campos_personalizados f
              LEFT JOIN campo_personalizado_pacientes cpp
                ON cpp.campo_personalizado_id = f.id
               AND cpp.paciente_id = :pid
              WHERE f.usuario_id = :uid
              ORDER BY f.id";
        $rows = $this->fetchAllRows($q, ['pid' => $patientId, 'uid' => $userId]) ?? [];
        foreach ($rows as &$row) {
            $row['obrigatorio'] = (int)$row['obrigatorio'];
        }
        return $rows;
    }

    public function saveCustomFieldValues(int $patientId, array $fields): void
    {
        foreach ($fields as $field) {
            if (!isset($field['id'])) {
                continue;
            }
            $fieldId = (int)$field['id'];
            $value = $field['value'] ?? '';

            $this->executeQuery(
                "INSERT INTO campo_personalizado_pacientes (paciente_id, campo_personalizado_id, value)
                 VALUES (:pid, :fid, :val)
                 ON DUPLICATE KEY UPDATE value = :val2",
                [
                    'pid' => $patientId,
                    'fid' => $fieldId,
                    'val' => $value,
                    'val2' => $value,
                ]
            );
        }
    }
}
