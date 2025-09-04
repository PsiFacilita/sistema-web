<?php
declare(strict_types=1);

namespace App\Http\Middleware;

use Exception;
use Psr\Http\Message\ResponseInterface as Response;
use Psr\Http\Message\ServerRequestInterface as Request;
use Psr\Http\Server\RequestHandlerInterface as Handler;
use Slim\Psr7\Response as SlimResponse;

final class CorsMiddleware
{
    public function __invoke(Request $request, Handler $handler): Response
    {
        $originAllowed = trim((string)($_ENV['FRONTEND_URL'] ?? $_SERVER['FRONTEND_URL'] ?? ''));

        if ($originAllowed === '' || $originAllowed === '*') {
            throw new Exception('FRONTEND_URL environment variable is not set or invalid.');
        }

        if (strtoupper($request->getMethod()) === 'OPTIONS') {
            $response = new SlimResponse(204);
            return $this->withCors($response, $originAllowed);
        }

        $response = $handler->handle($request);
        return $this->withCors($response, $originAllowed);
    }

    private function withCors(Response $response, string $origin): Response
    {
        return $response
            ->withHeader('Access-Control-Allow-Origin', $origin)
            ->withHeader('Vary', 'Origin')
            ->withHeader('Access-Control-Allow-Credentials', 'true')
            ->withHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE, OPTIONS')
            ->withHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With')
            ->withHeader('Access-Control-Max-Age', '86400');
    }
}
