<?php
declare(strict_types=1);

namespace App\Http\Controllers;

use App\Helpers\BaseLogger;
use App\Models\Dashboard;
use App\Services\AuthService;
use Psr\Http\Message\ResponseInterface as Response;
use Psr\Http\Message\ServerRequestInterface as Request;
use Throwable;

/**
 * Controller responsible for returning dashboard data
 * (summary cards and monthly chart) as a JSON API.
 */
final class DashboardController
{
    public function __construct(
        private ?Dashboard $dashboard = null,
        private ?AuthService $authService = null
    ) {
        $this->dashboard = $this->dashboard ?? new Dashboard();
        $this->authService = $this->authService ?? new AuthService(
            $_ENV['JWT_SECRET'] ?? $_SERVER['JWT_SECRET'] ?? 'change_me',
            $_ENV['JWT_ISSUER'] ?? $_SERVER['JWT_ISSUER'] ?? 'app',
            (int)($_ENV['JWT_EXPIRE_MINUTES'] ?? $_SERVER['JWT_EXPIRE_MINUTES'] ?? 60),
        );
    }

    /**
     * GET /api/dashboard
     *
     * Response:
     * {
     *   "ok": true,
     *   "cards": { "ativos": int, "inativos": int, "agendadas": int },
     *   "grafico": [ { "mes": int, "ativos": int, "inativos": int }, ... ]
     * }
     *
     * @param Request  $request  PSR-7 request
     * @param Response $response PSR-7 response
     * @return Response          JSON response with dashboard data
     */
    public function index(Request $request, Response $response): Response
    {
        $logger = new BaseLogger('dashboard');

        try {
            $userId = $this->resolveAuthenticatedUserId($request);
            if ($userId === null) {
                return $this->json($response, ['ok' => false, 'message' => 'Unauthorized'], 401);
            }

            $cards   = $this->dashboard->getCards($userId);
            $grafico = $this->dashboard->getYearlyPatientChart($userId);

            return $this->json($response, [
                'ok'     => true,
                'cards'  => $cards,
                'grafico'=> $grafico,
            ], 200);
        } catch (Throwable $e) {
            $logger->error('Dashboard error', ['exception' => $e->getMessage()]);
            return $this->json($response, [
                'ok'    => false,
                'error' => 'Failed to fetch dashboard data',
            ], 500);
        }
    }

    /**
     * Resolve authenticated user id from session or Authorization: Bearer <JWT>.
     *
     * @param Request $request
     * @return int|null Authenticated user id or null if unauthenticated.
     */
    private function resolveAuthenticatedUserId(Request $request): ?int
    {
        // 1) Session
        $id = $_SESSION['user']['id'] ?? null;
        if (is_numeric($id)) {
            return (int) $id;
        }

        // 2) JWT (optional fallback)
        $authHeader = $request->getHeaderLine('Authorization');
        if ($authHeader && preg_match('/Bearer\s+(.+)/i', $authHeader, $m)) {
            try {
                $payload = $this->authService->verifyToken($m[1]);
                $sub = $payload['sub'] ?? null;
                return is_numeric($sub) ? (int) $sub : null;
            } catch (\Throwable $e) {
            }
        }

        return null;
    }

    /**
     * Writes a JSON payload to the response with proper headers.
     *
     * @param Response $response  Base response instance
     * @param array<mixed> $payload Arbitrary JSON-serializable payload
     * @param int $status         HTTP status code (default 200)
     * @return Response           JSON response
     */
    private function json(Response $response, array $payload, int $status = 200): Response
    {
        $response->getBody()->write((string) json_encode($payload, JSON_UNESCAPED_UNICODE));
        return $response
            ->withHeader('Content-Type', 'application/json; charset=utf-8')
            ->withStatus($status);
    }
}
