<?php
declare(strict_types=1);

namespace App\Http\Controllers;

use App\Config\Controller;
use App\Helpers\BaseLogger;
use App\Services\AppointmentsService;
use Psr\Http\Message\ResponseInterface as Response;
use Psr\Http\Message\ServerRequestInterface as Request;
use Throwable;
use InvalidArgumentException;

final class AppointmentsController extends Controller
{
    public function __construct(
        protected ?AppointmentsService $service = null
    ) {
        $this->service = $this->service ?? new AppointmentsService();
    }

    public function index(Request $request, Response $response): Response
    {
        $logger = new BaseLogger('appointments');

        try {
            $userId = $this->resolveAuthenticatedUserId($request);
            if ($userId === null) {
                return $this->json($response, ['ok' => false, 'message' => 'Unauthorized'], 401);
            }

            $q = $request->getQueryParams();
            $from = isset($q['from']) ? (string)$q['from'] : null;
            $to   = isset($q['to'])   ? (string)$q['to']   : null;
            $pid  = isset($q['patient_id']) ? (int)$q['patient_id'] : null;
            $page = isset($q['page']) ? max(1, (int)$q['page']) : 1;
            $per  = isset($q['per_page']) ? max(1, min(100, (int)$q['per_page'])) : 20;

            $data = $this->service->list($userId, $from, $to, $pid, $page, $per);

            // Keep original shape and add an alias for chatbot compatibility
            $resp = ['ok' => true] + $data;
            if (!isset($resp['appointments']) && isset($data['items'])) {
                $resp['appointments'] = $data['items'];
            }

            return $this->json($response, $resp, 200);
        } catch (Throwable $e) {
            $logger->error('Failed to list appointments', ['exception' => $e->getMessage()]);
            return $this->json($response, ['ok' => false, 'message' => 'Erro ao listar agendamentos'], 500);
        }
    }

    public function availability(Request $request, Response $response): Response
    {
        $logger = new BaseLogger('appointments_availability');

        try {
            $userId = $this->resolveAuthenticatedUserId($request);
            if ($userId === null) {
                return $this->json($response, ['ok' => false, 'message' => 'Unauthorized'], 401);
            }

            $q = $request->getQueryParams();
            $from = isset($q['from']) ? (string)$q['from'] : null;
            $to   = isset($q['to'])   ? (string)$q['to']   : null;
            $slot = isset($q['slot_minutes']) ? max(10, min(240, (int)$q['slot_minutes'])) : 60;

            if (!$from || !$to) {
                return $this->json($response, ['ok' => false, 'message' => 'Parâmetros from e to são obrigatórios'], 422);
            }

            $data = $this->service->availability($userId, $from, $to, $slot);

            // Build a flattened list of slots for chatbot compatibility
            $availableSlots = [];
            foreach ($data as $day) {
                $date = $day['date'] ?? null;
                $slots = $day['slots'] ?? [];
                if (!$date || empty($slots)) {
                    continue;
                }
                foreach ($slots as $hm) {
                    // Ensure HH:MM:SS
                    $time = preg_match('/^\d{2}:\d{2}:\d{2}$/', (string)$hm) ? (string)$hm : ((string)$hm . ':00');
                    try {
                        $startDt = new \DateTimeImmutable($date . ' ' . $time);
                        $endDt   = $startDt->add(new \DateInterval('PT' . (int)$slot . 'M'));
                        // ISO8601 with offset (Python fromisoformat accepts offsets)
                        $availableSlots[] = [
                            'start' => $startDt->format(DATE_ATOM),
                            'end'   => $endDt->format(DATE_ATOM),
                        ];
                    } catch (\Throwable $e) {
                        // skip invalid entries
                    }
                }
            }

            return $this->json($response, [
                'ok' => true,
                'availability' => $data,
                'available_slots' => $availableSlots,
            ], 200);
        } catch (InvalidArgumentException $e) {
            return $this->json($response, ['ok' => false, 'message' => $e->getMessage()], 422);
        } catch (Throwable $e) {
            $logger->error('Failed to compute availability', ['exception' => $e->getMessage()]);
            return $this->json($response, ['ok' => false, 'message' => 'Erro ao calcular disponibilidade'], 500);
        }
    }

    public function show(Request $request, Response $response, array $args): Response
    {
        $logger = new BaseLogger('appointments');

        try {
            $userId = $this->resolveAuthenticatedUserId($request);
            if ($userId === null) {
                return $this->json($response, ['ok' => false, 'message' => 'Unauthorized'], 401);
            }

            $id = (int)($args['id'] ?? 0);
            if ($id <= 0) {
                return $this->json($response, ['ok' => false, 'message' => 'ID inválido'], 422);
            }

            $row = $this->service->get($userId, $id);
            if (!$row) {
                return $this->json($response, ['ok' => false, 'message' => 'Não encontrado'], 404);
            }

            return $this->json($response, ['ok' => true, 'appointment' => $row], 200);
        } catch (Throwable $e) {
            $logger->error('Failed to get appointment', ['exception' => $e->getMessage()]);
            return $this->json($response, ['ok' => false, 'message' => 'Erro ao buscar agendamento'], 500);
        }
    }

    public function create(Request $request, Response $response): Response
    {
        $logger = new BaseLogger('appointments');

        try {
            $userId = $this->resolveAuthenticatedUserId($request);
            if ($userId === null) {
                return $this->json($response, ['ok' => false, 'message' => 'Unauthorized'], 401);
            }

            $body = (array)($request->getParsedBody() ?? []);
            $pacienteId = isset($body['paciente_id']) ? (int)$body['paciente_id'] : 0;
            $inicio     = (string)($body['horario_inicio'] ?? '');
            $fim        = (string)($body['horario_fim'] ?? '');
            $status     = (string)($body['status'] ?? 'agendado');

            if ($pacienteId <= 0 || $inicio === '' || $fim === '') {
                return $this->json($response, ['ok' => false, 'message' => 'Campos obrigatórios ausentes'], 422);
            }

            $id = $this->service->create($userId, $pacienteId, $inicio, $fim, $status);

            return $this->json($response, ['ok' => true, 'id' => $id], 201);
        } catch (InvalidArgumentException $e) {
            return $this->json($response, ['ok' => false, 'message' => $e->getMessage()], 422);
        } catch (Throwable $e) {
            $logger->error('Failed to create appointment', ['exception' => $e->getMessage()]);
            return $this->json($response, ['ok' => false, 'message' => 'Erro ao criar agendamento'], 500);
        }
    }

    public function update(Request $request, Response $response, array $args): Response
    {
        $logger = new BaseLogger('appointments');

        try {
            $userId = $this->resolveAuthenticatedUserId($request);
            if ($userId === null) {
                return $this->json($response, ['ok' => false, 'message' => 'Unauthorized'], 401);
            }

            $id = (int)($args['id'] ?? 0);
            if ($id <= 0) {
                return $this->json($response, ['ok' => false, 'message' => 'ID inválido'], 422);
            }

            $body = (array)($request->getParsedBody() ?? []);
            $ok = $this->service->update($userId, $id, $body);

            return $this->json($response, ['ok' => $ok], $ok ? 200 : 400);
        } catch (InvalidArgumentException $e) {
            return $this->json($response, ['ok' => false, 'message' => $e->getMessage()], 422);
        } catch (Throwable $e) {
            $logger->error('Failed to update appointment', ['exception' => $e->getMessage()]);
            return $this->json($response, ['ok' => false, 'message' => 'Erro ao atualizar agendamento'], 500);
        }
    }

    public function delete(Request $request, Response $response, array $args): Response
    {
        $logger = new BaseLogger('appointments');

        try {
            $userId = $this->resolveAuthenticatedUserId($request);
            if ($userId === null) {
                return $this->json($response, ['ok' => false, 'message' => 'Unauthorized'], 401);
            }

            $id = (int)($args['id'] ?? 0);
            if ($id <= 0) {
                return $this->json($response, ['ok' => false, 'message' => 'ID inválido'], 422);
            }

            $ok = $this->service->delete($userId, $id);

            return $this->json($response, ['ok' => $ok], $ok ? 200 : 404);
        } catch (Throwable $e) {
            $logger->error('Failed to delete appointment', ['exception' => $e->getMessage()]);
            return $this->json($response, ['ok' => false, 'message' => 'Erro ao excluir agendamento'], 500);
        }
    }
}
