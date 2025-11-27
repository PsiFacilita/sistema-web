<?php
declare(strict_types=1);

namespace App\Http\Middleware;

use Psr\Http\Message\ResponseInterface as Response;
use Psr\Http\Message\ServerRequestInterface as Request;
use Psr\Http\Server\MiddlewareInterface;
use Psr\Http\Server\RequestHandlerInterface as Handler;
use Nyholm\Psr7\Response as Psr7Response;
use App\Services\AuthService;

/**
 * Middleware to protect routes that require authentication.
 * Checks if a user exists in the session or (optionally) in JWT.
 */
final class AuthMiddleware implements MiddlewareInterface
{
    public function process(Request $request, Handler $handler): Response
    {
        if (session_status() !== PHP_SESSION_ACTIVE) {
            session_start();
        }

        // If there is no session user, try to authenticate via Bearer token (JWT)
        if (!isset($_SESSION['user'])) {

            $authHeader = $request->getHeaderLine('Authorization');
            if ($authHeader && preg_match('/Bearer\s+(.+)/i', $authHeader, $m)) {
                try {
                    $auth = new AuthService(
                        $_ENV['JWT_SECRET']         ?? $_SERVER['JWT_SECRET']         ?? 'change_me',
                        $_ENV['JWT_ISSUER']         ?? $_SERVER['JWT_ISSUER']         ?? 'app',
                        (int)($_ENV['JWT_EXPIRE_MINUTES'] ?? $_SERVER['JWT_EXPIRE_MINUTES'] ?? 60),
                    );
                    $payload = $auth->verifyToken($m[1]);
                    $sub     = $payload['sub'] ?? null;
                    if (is_numeric($sub)) {
                        $_SESSION['user'] = ['id' => (int)$sub];
                    }
                } catch (\Throwable $e) {
                    // Ignore and fall through to 401 below
                }
            }

            if (!isset($_SESSION['user'])) {
                $res = new Psr7Response(401);
                $res->getBody()->write(json_encode([
                    'ok' => false,
                    'message' => 'Unauthorized',
                ], JSON_UNESCAPED_UNICODE));
                return $res->withHeader('Content-Type', 'application/json; charset=utf-8');
            }
        }
        return $handler->handle($request);
    }
}
