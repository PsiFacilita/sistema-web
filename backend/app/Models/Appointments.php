<?php
declare(strict_types=1);

namespace App\Models;

final class Appointments extends Model
{
    private function ownerSql(): string
    {
        return "COALESCE((SELECT sp.psicologo_id FROM secretaria_pertence sp WHERE sp.secretaria_id = :uid LIMIT 1), :uid)";
    }

    public function listByUser(
        int $userId,
        ?string $from = null,
        ?string $to = null,
        ?int $patientId = null,
        int $page = 1,
        int $perPage = 20
    ): array {
        $owner = $this->ownerSql();

        $where = ["a.usuario_id = {$owner}"];
        $params = [':uid' => $userId];

        if ($from !== null) {
            $where[] = "a.horario_inicio >= :from";
            $params[':from'] = $from;
        }
        if ($to !== null) {
            $where[] = "a.horario_fim <= :to";
            $params[':to'] = $to;
        }
        if ($patientId !== null) {
            $where[] = "a.paciente_id = :pid";
            $params[':pid'] = $patientId;
        }

        $whereSql = 'WHERE ' . implode(' AND ', $where);

        $total = (int)($this->fetchColumn(
            "SELECT COUNT(*) FROM agenda a {$whereSql}",
            $params
        ) ?? 0);

        $page = max(1, $page);
        $perPage = max(1, min(100, $perPage));
        $offset = ($page - 1) * $perPage;

        $sql = "
            SELECT 
                a.id, a.usuario_id, a.paciente_id,
                a.horario_inicio, a.horario_fim,
                a.status, a.criado_em, a.atualizado_em,
                p.nome AS paciente_nome
            FROM agenda a
            JOIN paciente p ON p.id = a.paciente_id
            {$whereSql}
            ORDER BY a.horario_inicio ASC
            LIMIT :limit OFFSET :offset
        ";

        $stmt = $this->pdo->prepare($sql);
        foreach ($params as $k => $v) {
            $stmt->bindValue($k, $v);
        }
        $stmt->bindValue(':limit', $perPage, \PDO::PARAM_INT);
        $stmt->bindValue(':offset', $offset, \PDO::PARAM_INT);
        $stmt->execute();
        $items = $stmt->fetchAll(\PDO::FETCH_ASSOC);

        return [
            'items' => $items,
            'total' => $total,
            'page' => $page,
            'per_page' => $perPage,
        ];
    }

    public function findOne(int $userId, int $id): ?array
    {
        $owner = $this->ownerSql();
        $sql = "
            SELECT 
                a.id, a.usuario_id, a.paciente_id,
                a.horario_inicio, a.horario_fim,
                a.status, a.criado_em, a.atualizado_em,
                p.nome AS paciente_nome
            FROM agenda a
            JOIN paciente p ON p.id = a.paciente_id
            WHERE a.id = :id AND a.usuario_id = {$owner}
            LIMIT 1
        ";

        return $this->fetchRow($sql, [':id' => $id, ':uid' => $userId]);
    }

    public function patientBelongsToOwner(int $userId, int $patientId): bool
    {
        $owner = $this->ownerSql();
        $sql = "SELECT 1 FROM paciente WHERE id = :pid AND usuario_id = {$owner} LIMIT 1";
        $res = $this->fetchColumn($sql, [':pid' => $patientId, ':uid' => $userId]);
        return (bool)$res;
    }

    public function hasOverlap(int $userId, string $inicio, string $fim, ?int $excludeId = null): bool
    {
        $owner = $this->ownerSql();
        $sql = "
            SELECT 1
            FROM agenda
            WHERE usuario_id = {$owner}
              AND status <> 'cancelado'
              AND (horario_inicio < :fim AND horario_fim > :inicio)
        ";
        $params = [':uid' => $userId, ':inicio' => $inicio, ':fim' => $fim];

        if ($excludeId !== null) {
            $sql .= " AND id <> :eid";
            $params[':eid'] = $excludeId;
        }

        $sql .= " LIMIT 1";

        $res = $this->fetchColumn($sql, $params);
        return (bool)$res;
    }

    public function create(int $userId, int $patientId, string $inicio, string $fim, string $status): int
    {
        $sql = "
            INSERT INTO agenda (usuario_id, paciente_id, horario_inicio, horario_fim, status)
            VALUES (:uid_owner, :pid, :inicio, :fim, :status)
        ";

        $this->executeQuery($sql, [
            ':uid_owner' => $this->resolveOwnerId($userId),
            ':pid' => $patientId,
            ':inicio' => $inicio,
            ':fim' => $fim,
            ':status' => $status,
        ]);

        return (int)$this->lastInsertId();
    }

    public function updateFields(int $userId, int $id, array $fields): bool
    {
        $set = [];
        $params = [':id' => $id];

        if (array_key_exists('paciente_id', $fields)) {
            $set[] = "paciente_id = :pid";
            $params[':pid'] = (int)$fields['paciente_id'];
        }
        if (array_key_exists('horario_inicio', $fields)) {
            $set[] = "horario_inicio = :inicio";
            $params[':inicio'] = (string)$fields['horario_inicio'];
        }
        if (array_key_exists('horario_fim', $fields)) {
            $set[] = "horario_fim = :fim";
            $params[':fim'] = (string)$fields['horario_fim'];
        }
        if (array_key_exists('status', $fields)) {
            $set[] = "status = :status";
            $params[':status'] = (string)$fields['status'];
        }

        if (!$set) return true;

        $owner = $this->ownerSql();
        $sql = "UPDATE agenda SET " . implode(', ', $set) . " WHERE id = :id AND usuario_id = {$owner}";
        $params[':uid'] = $userId;

        return $this->executeQuery($sql, $params);
    }

    public function deleteOne(int $userId, int $id): bool
    {
        $owner = $this->ownerSql();
        $sql = "DELETE FROM agenda WHERE id = :id AND usuario_id = {$owner}";
        return $this->executeQuery($sql, [':id' => $id, ':uid' => $userId]);
    }

    public function resolveOwnerId(int $userId): int
    {
        $row = $this->fetchRow(
            "SELECT COALESCE((SELECT psicologo_id FROM secretaria_pertence WHERE secretaria_id = :uid LIMIT 1), :uid) AS owner_id",
            [':uid' => $userId]
        );
        return (int)($row['owner_id'] ?? $userId);
    }

    public function getConfigId(int $ownerUserId): ?int
    {
        $row = $this->fetchRow("SELECT id FROM configuracao WHERE usuario_id = :uid LIMIT 1", [':uid' => $ownerUserId]);
        return $row ? (int)$row['id'] : null;
    }

    public function getAllowedWeekdays(int $configId): array
    {
        $rows = $this->fetchAllRows(
            "SELECT dia FROM configuracao_dias WHERE configuracao_id = :cid",
            [':cid' => $configId]
        );
        return array_values(array_map(fn($r) => (string)$r['dia'], $rows));
    }

    public function getTurnos(int $configId): array
    {
        $rows = $this->fetchAllRows(
            "SELECT turno_inicio, turno_fim FROM configuracao_turnos WHERE configuracao_id = :cid ORDER BY turno_inicio",
            [':cid' => $configId]
        );
        $out = [];
        foreach ($rows as $r) {
            $out[] = [
                'inicio' => substr((string)$r['turno_inicio'], 0, 8),
                'fim'    => substr((string)$r['turno_fim'], 0, 8),
            ];
        }
        return $out;
    }

    public function getSpecificDayConfig(int $configId, string $dateYmd): ?array
    {
        $row = $this->fetchRow(
            "SELECT tipo, horario_inicio, horario_fim 
             FROM configuracao_dias_especificos 
             WHERE configuracao_id = :cid AND data = :dt LIMIT 1",
            [':cid' => $configId, ':dt' => $dateYmd]
        );
        if (!$row) return null;

        $tipo = (string)$row['tipo'];
        $inicio = $row['horario_inicio'] ? substr((string)$row['horario_inicio'], 0, 8) : null;
        $fim    = $row['horario_fim']    ? substr((string)$row['horario_fim'], 0, 8)    : null;

        return ['tipo' => $tipo, 'inicio' => $inicio, 'fim' => $fim];
    }

    public function getAppointmentsBetween(int $ownerUserId, string $from, string $to): array
    {
        $sql = "
            SELECT id, horario_inicio, horario_fim, status
            FROM agenda
            WHERE usuario_id = :uid
              AND status <> 'cancelado'
              AND horario_inicio < :to
              AND horario_fim > :from
            ORDER BY horario_inicio
        ";
        return $this->fetchAllRows($sql, [':uid' => $ownerUserId, ':from' => $from, ':to' => $to]);
    }

    public function availability(int $userId, string $from, string $to, int $slotMinutes = 60): array
    {
        $ownerId  = $this->resolveOwnerId($userId);
        $configId = $this->getConfigId($ownerId);

        if ($configId === null) {
            return [];
        }

        // Turnos padrão
        $turnos = $this->getTurnos($configId);
        // Dias permitidos
        $diasPermitidos = $this->getAllowedWeekdays($configId);

        // Agendamentos já existentes no período
        $agendados = $this->getAppointmentsBetween($ownerId, $from, $to);

        // Normalizar agendados em intervalos
        $ocupados = [];
        foreach ($agendados as $ag) {
            $ocupados[] = [
                'inicio' => substr((string)$ag['horario_inicio'], 0, 16),
                'fim'    => substr((string)$ag['horario_fim'], 0, 16),
            ];
        }

        // Iterar dias e slots
        $inicio = new \DateTimeImmutable($from);
        $fim    = new \DateTimeImmutable($to);

        $result = [];

        for ($d = $inicio; $d <= $fim; $d = $d->modify('+1 day')) {
            $dow = strtolower($d->format('l')); // sunday, monday...

            // mapear para pt-BR
            $map = [
                'sunday'    => 'domingo',
                'monday'    => 'segunda',
                'tuesday'   => 'terça',
                'wednesday' => 'quarta',
                'thursday'  => 'quinta',
                'friday'    => 'sexta',
                'saturday'  => 'sábado',
            ];

            $dowPt = $map[$dow] ?? null;
            if (!$dowPt || !in_array($dowPt, $diasPermitidos, true)) {
                continue; // dia não permitido
            }

            // turnos do dia
            foreach ($turnos as $turno) {
                $start = new \DateTimeImmutable($d->format('Y-m-d') . ' ' . $turno['inicio']);
                $end   = new \DateTimeImmutable($d->format('Y-m-d') . ' ' . $turno['fim']);

                $slots = [];
                for ($s = $start; $s < $end; $s = $s->modify("+{$slotMinutes} minutes")) {
                    $slotInicio = $s;
                    $slotFim    = $s->modify("+{$slotMinutes} minutes");

                    // verificar se bate com algum ocupado
                    $temConflito = false;
                    foreach ($ocupados as $oc) {
                        $ocInicio = new \DateTimeImmutable($oc['inicio']);
                        $ocFim    = new \DateTimeImmutable($oc['fim']);
                        if ($slotInicio < $ocFim && $slotFim > $ocInicio) {
                            $temConflito = true;
                            break;
                        }
                    }

                    if (!$temConflito) {
                        $slots[] = $slotInicio->format('H:i');
                    }
                }

                if ($slots) {
                    $result[] = [
                        'date'  => $d->format('Y-m-d'),
                        'slots' => $slots,
                    ];
                }
            }
        }

        return $result;
    }

}
