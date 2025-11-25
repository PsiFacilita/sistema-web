<?php
declare(strict_types=1);

namespace App\Services;

use App\Models\Appointments;
use DateInterval;
use DatePeriod;
use DateTimeImmutable;
use InvalidArgumentException;

final class AppointmentsService
{
    public function __construct(
        private ?Appointments $model = null
    ) {
        $this->model = $this->model ?? new Appointments();
    }

    public function list(
        int $userId,
        ?string $from,
        ?string $to,
        ?int $patientId,
        int $page,
        int $perPage
    ): array {
        $from = $this->sanitizeDateTime($from);
        $to   = $this->sanitizeDateTime($to);

        $patientId = $patientId !== null ? (int)$patientId : null;
        $page = max(1, (int)$page);
        $perPage = max(1, min(100, (int)$perPage));

        return $this->model->listByUser($userId, $from, $to, $patientId, $page, $perPage);
    }

    public function availability(
        int $userId,
        string $from,
        string $to,
        int $slotMinutes = 60
    ): array {
        $from = $this->sanitizeDateTime($from);
        $to   = $this->sanitizeDateTime($to);
        $slotMinutes = max(10, min(240, (int)$slotMinutes));

        $di = new DateTimeImmutable($from);
        $df = new DateTimeImmutable($to);

        if ($df < $di) {
            throw new InvalidArgumentException('Intervalo inválido: to < from.');
        }

        $maxDays = 93;
        if ($df->diff($di)->days > $maxDays) {
            throw new InvalidArgumentException("Intervalo muito grande. Máximo de {$maxDays} dias.");
        }

        $ownerId  = $this->model->resolveOwnerId($userId);
        $configId = $this->model->getConfigId($ownerId);
        if ($configId === null) {
            return [];
        }

        // Busca turnos já estruturados por dia: ['segunda' => [...], 'terça' => [...]]
        $turnosPorDia = $this->model->getTurnos($configId);

        $appts = $this->model->getAppointmentsBetween(
            $ownerId,
            $di->format('Y-m-d H:i:s'),
            $df->format('Y-m-d H:i:s')
        );

        $busyByDate = [];
        foreach ($appts as $a) {
            if (!isset($a['horario_inicio'], $a['horario_fim'])) {
                continue;
            }
            $d = substr($a['horario_inicio'], 0, 10);
            $busyByDate[$d][] = [
                'inicio' => $a['horario_inicio'],
                'fim'    => $a['horario_fim']
            ];
        }

        $period = new DatePeriod($di, new DateInterval('P1D'), $df->add(new DateInterval('PT1S')));
        $result = [];

        $mapDia = [
            0 => 'domingo',
            1 => 'segunda',
            2 => 'terça',
            3 => 'quarta',
            4 => 'quinta',
            5 => 'sexta',
            6 => 'sábado',
        ];

        foreach ($period as $day) {
            $date = $day->format('Y-m-d');
            $wIndex = (int)$day->format('w');
            $diaPt = $mapDia[$wIndex];

            $spec = $this->model->getSpecificDayConfig($configId, $date);
            
            // Se estiver fechado pela exceção
            if ($spec && ($spec['tipo'] ?? null) === 'fechado') {
                $result[] = ['date' => $date, 'slots' => []];
                continue;
            }

            $windows = [];

            // Se for exceção do tipo 'alterado'
            if ($spec && ($spec['tipo'] ?? null) === 'alterado' && ($spec['inicio'] ?? null) && ($spec['fim'] ?? null)) {
                $windows[] = [$date . ' ' . $spec['inicio'], $date . ' ' . $spec['fim']];
            } else {
                // Se não for exceção, usa a configuração normal do dia
                if (isset($turnosPorDia[$diaPt])) {
                    foreach ($turnosPorDia[$diaPt] as $t) {
                        if (!isset($t['inicio'], $t['fim'])) continue;
                        $windows[] = [$date . ' ' . $t['inicio'], $date . ' ' . $t['fim']];
                    }
                } else {
                    // Dia sem turnos configurados = fechado
                    $result[] = ['date' => $date, 'slots' => []];
                    continue;
                }
            }

            $slots = [];
            foreach ($windows as [$wStart, $wEnd]) {
                $slots = array_merge($slots, $this->buildSlots($wStart, $wEnd, $slotMinutes));
            }

            $busy = $busyByDate[$date] ?? [];
            $availableObjects = $this->filterBusy($slots, $busy);
            
            // Converter objetos de volta para strings completas Y-m-d H:i:s para compatibilidade com frontend
            $availableStrings = array_map(function($slot) {
                return (new DateTimeImmutable($slot['inicio']))->format('Y-m-d H:i:s');
            }, $availableObjects);

            // Remove duplicatas e reindexa
            $available = array_values(array_unique($availableStrings));
            sort($available);

            $result[] = [
                'date' => $date,
                'slots' => $available
            ];
        }

        return $result;
    }

    public function get(int $userId, int $id): ?array
    {
        $id = (int)$id;
        if ($id <= 0) {
            throw new InvalidArgumentException('ID inválido.');
        }
        return $this->model->findOne($userId, $id);
    }

    public function create(
        int $userId,
        int $patientId,
        string $inicio,
        string $fim,
        string $status
    ): int {
        $patientId = (int)$patientId;
        $inicio = $this->sanitizeDateTime($inicio);
        $fim    = $this->sanitizeDateTime($fim);
        $status = $this->sanitizeStatus($status);

        $this->assertDates($inicio, $fim);

        if (!$this->model->patientBelongsToOwner($userId, $patientId)) {
            throw new InvalidArgumentException('Paciente inválido para este usuário.');
        }

        if ($this->model->hasOverlap($userId, $inicio, $fim, null)) {
            throw new InvalidArgumentException('Conflito de horário com outro agendamento.');
        }

        return $this->model->create($userId, $patientId, $inicio, $fim, $status);
    }

    public function update(int $userId, int $id, array $payload): bool
    {
        $id = (int)$id;
        if ($id <= 0) {
            throw new InvalidArgumentException('ID inválido.');
        }

        $current = $this->model->findOne($userId, $id);
        if (!$current) {
            throw new InvalidArgumentException('Agendamento não encontrado.');
        }

        $fields = [];

        if (isset($payload['paciente_id'])) {
            $pid = (int)$payload['paciente_id'];
            if (!$this->model->patientBelongsToOwner($userId, $pid)) {
                throw new InvalidArgumentException('Paciente inválido para este usuário.');
            }
            $fields['paciente_id'] = $pid;
        }

        $inicio = isset($payload['horario_inicio'])
            ? $this->sanitizeDateTime((string)$payload['horario_inicio'])
            : $current['horario_inicio'];
        $fim = isset($payload['horario_fim'])
            ? $this->sanitizeDateTime((string)$payload['horario_fim'])
            : $current['horario_fim'];

        if (isset($payload['horario_inicio']) || isset($payload['horario_fim'])) {
            $this->assertDates((string)$inicio, (string)$fim);
            if ($this->model->hasOverlap($userId, (string)$inicio, (string)$fim, $id)) {
                throw new InvalidArgumentException('Conflito de horário com outro agendamento.');
            }
            $fields['horario_inicio'] = (string)$inicio;
            $fields['horario_fim']    = (string)$fim;
        }

        if (isset($payload['status'])) {
            $fields['status'] = $this->sanitizeStatus((string)$payload['status']);
        }

        return $this->model->updateFields($userId, $id, $fields);
    }

    public function delete(int $userId, int $id): bool
    {
        $id = (int)$id;
        if ($id <= 0) {
            throw new InvalidArgumentException('ID inválido.');
        }
        return $this->model->deleteOne($userId, $id);
    }

    private function assertDates(string $inicio, string $fim): void
    {
        $di = new DateTimeImmutable($inicio);
        $df = new DateTimeImmutable($fim);
        if ($df <= $di) {
            throw new InvalidArgumentException('horario_fim deve ser maior que horario_inicio.');
        }
    }

    private function assertStatus(string $status): void
    {
        $allowed = ['agendado','confirmado','cancelado','reagendado'];
        if (!in_array($status, $allowed, true)) {
            throw new InvalidArgumentException('Status inválido.');
        }
    }

    private function sanitizeDateTime(?string $dateTime): ?string
    {
        if ($dateTime === null || trim($dateTime) === '') {
            return null;
        }
        $dt = DateTimeImmutable::createFromFormat('Y-m-d H:i:s', $dateTime)
            ?: new DateTimeImmutable($dateTime);
        return $dt->format('Y-m-d H:i:s');
    }

    private function sanitizeStatus(string $status): string
    {
        return strtolower(trim($status));
    }

    private function isWeekdayAllowed(int $weekday, array $weekAllowed): bool
    {
        if (empty($weekAllowed)) {
            return true;
        }
        $set = [];
        foreach ($weekAllowed as $k => $v) {
            if (is_int($v) || (is_string($v) && ctype_digit($v))) {
                $set[(int)$v] = true;
                continue;
            }
            if (is_int($k) && ($v === true || $v === 1 || $v === '1')) {
                $set[$k] = true;
                continue;
            }
            if (is_string($k) && ($v === true || $v === 1 || $v === '1')) {
                $map = ['0'=>0,'1'=>1,'2'=>2,'3'=>3,'4'=>4,'5'=>5,'6'=>6,'dom'=>0,'seg'=>1,'ter'=>2,'qua'=>3,'qui'=>4,'sex'=>5,'sab'=>6,'sun'=>0,'mon'=>1,'tue'=>2,'wed'=>3,'thu'=>4,'fri'=>5,'sat'=>6];
                $lk = strtolower($k);
                if (isset($map[$lk])) {
                    $set[$map[$lk]] = true;
                }
            }
        }
        if (empty($set)) {
            return true;
        }
        return isset($set[$weekday]);
    }

    private function buildSlots(string $windowStart, string $windowEnd, int $slotMinutes): array
    {
        $start = new DateTimeImmutable($windowStart);
        $end = new DateTimeImmutable($windowEnd);
        if ($end <= $start) {
            return [];
        }
        $step = new DateInterval('PT' . $slotMinutes . 'M');
        $slots = [];
        $cursor = $start;
        while (true) {
            $s = $cursor;
            $e = $s->add($step);
            if ($e > $end) {
                break;
            }
            $slots[] = [
                'inicio' => $s->format('Y-m-d H:i:s'),
                'fim'    => $e->format('Y-m-d H:i:s'),
            ];
            $cursor = $e;
        }
        return $slots;
    }

    private function filterBusy(array $slots, array $busy): array
    {
        if (empty($slots) || empty($busy)) {
            return $slots;
        }
        $busyNorm = [];
        foreach ($busy as $b) {
            if (!isset($b['inicio'], $b['fim'])) {
                continue;
            }
            $bs = new DateTimeImmutable($b['inicio']);
            $be = new DateTimeImmutable($b['fim']);
            if ($be <= $bs) {
                continue;
            }
            $busyNorm[] = [$bs, $be];
        }
        if (empty($busyNorm)) {
            return $slots;
        }
        $out = [];
        foreach ($slots as $slot) {
            if (!isset($slot['inicio'], $slot['fim'])) {
                continue;
            }
            $ss = new DateTimeImmutable($slot['inicio']);
            $se = new DateTimeImmutable($slot['fim']);
            $overlap = false;
            foreach ($busyNorm as [$bs, $be]) {
                if ($ss < $be && $se > $bs) {
                    $overlap = true;
                    break;
                }
            }
            if (!$overlap) {
                $out[] = $slot;
            }
        }
        return $out;
    }
}
