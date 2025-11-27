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
        $originAllowed = trim((string)($_ENV['FRONTEND_URL'] ?? $_SERVER['FRONTEND_URL'] ?? 'http://localhost:3000'));

        if ($originAllowed === '') {
            $originAllowed = 'http://localhost:3000'; // Fallback padrão
            error_log("CorsMiddleware: Using fallback FRONTEND_URL");
        }

        if (strtoupper($request->getMethod()) === 'OPTIONS') {
            $response = new SlimResponse(204);
            return $this->withCors($response, $originAllowed);
        }

        try {
            $response = $handler->handle($request);
            return $this->withCors($response, $originAllowed);
        } catch (Exception $e) {
            error_log("CorsMiddleware: Exception in handler: " . $e->getMessage());
            throw $e;
        }
    }

    private function withCors(Response $response, string $origin): Response
    {
        return $response
            ->withHeader('Access-Control-Allow-Origin', $origin)
            ->withHeader('Vary', 'Origin')
            ->withHeader('Access-Control-Allow-Credentials', 'true')
            ->withHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE, OPTIONS')
            ->withHeader('Access-Control-Allow-Headers', 'Accept, Content-Type, Authorization, X-Requested-With')
            ->withHeader('Access-Control-Max-Age', '86400');
    }
}
