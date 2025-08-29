<?php
declare(strict_types=1);

namespace App\Http\Middleware;

use Psr\Http\Message\ResponseInterface as Response;
use Psr\Http\Message\ServerRequestInterface as Request;
use Psr\Http\Server\RequestHandlerInterface as Handler;

final class CorsMiddleware
{
    public function __invoke(Request $request, Handler $handler): Response
    {
        $originAllowed = $_ENV['FRONTEND_URL'] ?? $_SERVER['FRONTEND_URL'] ?? '*';

        if (strtoupper($request->getMethod()) === 'OPTIONS') {
            $response = new \Slim\Psr7\Response(204);
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
            ->withHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE, OPTIONS')
            ->withHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');
    }
}
