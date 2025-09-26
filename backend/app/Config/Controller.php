<?php

namespace App\Config;

use App\Services\AuthService;
use Psr\Http\Message\ResponseInterface as Response;
use Psr\Http\Message\ServerRequestInterface as Request;

class Controller
{
    /**
     * Resolve authenticated user id from session or Authorization: Bearer <JWT>.
     *
     * @param Request $request
     * @return int|null Authenticated user id or null if unauthenticated.
     */
    protected function resolveAuthenticatedUserId(Request $request): ?int
    {
        $authService = new AuthService(
                $_ENV['JWT_SECRET'] ?? $_SERVER['JWT_SECRET'] ?? 'change_me',
                $_ENV['JWT_ISSUER'] ?? $_SERVER['JWT_ISSUER'] ?? 'app',
                (int)($_ENV['JWT_EXPIRE_MINUTES'] ?? $_SERVER['JWT_EXPIRE_MINUTES'] ?? 60),
        );

        // 1) Session
        $id = $_SESSION['user']['id'] ?? null;
        if (is_numeric($id)) {
            return (int) $id;
        }

        $authHeader = $request->getHeaderLine('Authorization');
        if ($authHeader && preg_match('/Bearer\s+(.+)/i', $authHeader, $m)) {
            try {
                $payload = $authService->verifyToken($m[1]);
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
    protected function json(Response $response, array $payload, int $status = 200): Response
    {
        $response->getBody()->write((string) json_encode($payload, JSON_UNESCAPED_UNICODE));
        return $response
            ->withHeader('Content-Type', 'application/json; charset=utf-8')
            ->withStatus($status);
    }
}