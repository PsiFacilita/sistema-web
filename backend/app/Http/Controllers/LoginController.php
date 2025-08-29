<?php
declare(strict_types=1);

namespace App\Http\Controllers;

use App\Config\Database;
use App\Services\AuthService;
use Psr\Http\Message\ResponseInterface as Response;
use Psr\Http\Message\ServerRequestInterface as Request;

final class LoginController
{
    public function login(Request $request, Response $response): Response
    {
        $data = (array) ($request->getParsedBody() ?? []);
        $email = trim((string)($data['email'] ?? ''));
        $password = (string)($data['password'] ?? '');

        if ($email === '' || $password === '') {
            return $this->json($response, ['ok' => false, 'message' => 'Email e senha são obrigatórios.'], 422);
        }

        $pdo = Database::connection();

        $auth = new AuthService(
            $pdo,
            $_ENV['JWT_SECRET'] ?? $_SERVER['JWT_SECRET'] ?? 'change_me',
            $_ENV['JWT_ISSUER'] ?? $_SERVER['JWT_ISSUER'] ?? 'app',
            (int)($_ENV['JWT_EXPIRE_MINUTES'] ?? $_SERVER['JWT_EXPIRE_MINUTES'] ?? 60),
        );

        $user = $auth->validateCredentials($email, $password);
        if (!$user) {
            return $this->json($response, ['ok' => false, 'message' => 'Credenciais inválidas.'], 401);
        }

        $token = $auth->generateToken($user);

        return $this->json($response, [
            'ok'         => true,
            'token'      => $token,
            'token_type' => 'Bearer',
            'expires_in' => (int)($auth->getTtlSeconds()),
            'user'       => ['id' => $user->id, 'name' => $user->name, 'email' => $user->email],
        ], 200);
    }

    private function json(Response $response, array $payload, int $status = 200): Response
    {
        $response->getBody()->write((string)json_encode($payload, JSON_UNESCAPED_UNICODE));
        return $response->withHeader('Content-Type', 'application/json; charset=utf-8')
                        ->withStatus($status);
    }
}
