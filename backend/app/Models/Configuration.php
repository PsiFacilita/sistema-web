<?php
declare(strict_types=1);

namespace App\Models;

final class Configuration extends Model
{
    private function ensureConfig(int $userId): int
    {
        $row = $this->fetchRow("SELECT id FROM configuracao WHERE usuario_id = :u LIMIT 1", ['u' => $userId]);
        if ($row && isset($row['id'])) return (int)$row['id'];
        $ok = $this->executeQuery("INSERT INTO configuracao (usuario_id) VALUES (:u)", ['u' => $userId]);
        if (!$ok) throw new \Exception('Falha ao criar configuração');
        return (int)$this->lastInsertId();
    }

    public function getAggregated(int $userId): array
    {
        $cid = $this->ensureConfig($userId);
        $turnos = $this->fetchAllRows("SELECT id, dia, turno_inicio, turno_fim FROM configuracao_turnos WHERE configuracao_id = :c ORDER BY dia, turno_inicio ASC", ['c' => $cid]);
        $ex = $this->fetchAllRows("SELECT id, data, horario_inicio, horario_fim, motivo, tipo FROM configuracao_dias_especificos WHERE configuracao_id = :c ORDER BY data ASC", ['c' => $cid]);
        
        $schedule = [];
        foreach ($turnos as $t) {
            $dia = $t['dia'];
            if (!isset($schedule[$dia])) $schedule[$dia] = [];
            $schedule[$dia][] = ['start' => $t['turno_inicio'], 'end' => $t['turno_fim']];
        }

        return [
            'config_id' => $cid,
            'schedule' => $schedule,
            'exceptions' => array_map(fn($r) => [
                'id' => (int)$r['id'],
                'date' => $r['data'],
                'start' => $r['horario_inicio'],
                'end' => $r['horario_fim'],
                'reason' => $r['motivo'],
                'type' => $r['tipo']
            ], $ex)
        ];
    }

    public function saveSchedule(int $userId, array $schedule, array $exceptions): void
    {
        $cid = $this->ensureConfig($userId);
        $validDays = ['domingo','segunda','terça','quarta','quinta','sexta','sábado'];
        
        // Validação básica
        foreach ($schedule as $day => $shifts) {
            if (!in_array($day, $validDays, true)) throw new \Exception("Dia inválido: $day");
            foreach ($shifts as $s) {
                if (!isset($s['start'], $s['end'])) throw new \Exception("Turno inválido para $day");
            }
        }

        foreach ($exceptions as $e) {
            if (!isset($e['date'], $e['type'])) throw new \Exception('Exceção inválida');
            if (!in_array($e['type'], ['fechado','alterado'], true)) throw new \Exception('Tipo inválido');
        }

        $this->beginTransaction();
        try {
            // Remove turnos antigos
            $this->executeQuery("DELETE FROM configuracao_turnos WHERE configuracao_id = :c", ['c' => $cid]);
            
            // Insere novos turnos
            foreach ($schedule as $day => $shifts) {
                foreach ($shifts as $s) {
                    $this->executeQuery(
                        "INSERT INTO configuracao_turnos (configuracao_id, dia, turno_inicio, turno_fim) VALUES (:c, :d, :i, :f)",
                        ['c' => $cid, 'd' => $day, 'i' => $s['start'], 'f' => $s['end']]
                    );
                }
            }

            // Atualiza exceções
            $this->executeQuery("DELETE FROM configuracao_dias_especificos WHERE configuracao_id = :c", ['c' => $cid]);
            foreach ($exceptions as $e) {
                $this->executeQuery(
                    "INSERT INTO configuracao_dias_especificos (configuracao_id, data, horario_inicio, horario_fim, motivo, tipo) 
                     VALUES (:c, :dt, :i, :f, :m, :t)",
                    [
                        'c' => $cid,
                        'dt' => $e['date'],
                        'i' => $e['type'] === 'alterado' ? ($e['start'] ?? null) : null,
                        'f' => $e['type'] === 'alterado' ? ($e['end'] ?? null) : null,
                        'm' => $e['reason'] ?? null,
                        't' => $e['type']
                    ]
                );
            }
            $this->commit();
        } catch (\Throwable $e) {
            $this->rollback();
            throw $e;
        }
    }
}
