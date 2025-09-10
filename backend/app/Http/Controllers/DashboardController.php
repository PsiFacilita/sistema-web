<?php
declare(strict_types=1);

namespace App\Http\Controllers;

use App\Config\Controller;
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
final class DashboardController extends Controller
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
}
