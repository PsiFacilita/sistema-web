<?php
declare(strict_types=1);

namespace App\Http\Middleware;

use Psr\Http\Message\ResponseInterface as Response;
use Psr\Http\Message\ServerRequestInterface as Request;
use Psr\Http\Server\MiddlewareInterface;
use Psr\Http\Server\RequestHandlerInterface as Handler;
use Nyholm\Psr7\Response as Psr7Response;

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

        if (!isset($_SESSION['user'])) {
            $res = new Psr7Response(401);
            $res->getBody()->write(json_encode([
                'ok' => false,
                'message' => 'Unauthorized',
            ], JSON_UNESCAPED_UNICODE));
            return $res->withHeader('Content-Type', 'application/json; charset=utf-8');   
        }

        return $handler->handle($request);

    }
}
