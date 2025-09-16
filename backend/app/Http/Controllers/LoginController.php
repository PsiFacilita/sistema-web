<?php
declare(strict_types=1);

namespace App\Http\Controllers;

use App\Config\Controller;
use App\Services\AuthService;
use App\Helpers\BaseLogger;
use Psr\Http\Message\ResponseInterface as Response;
use Psr\Http\Message\ServerRequestInterface as Request;
use Throwable;

final class LoginController extends Controller
{
    public function login(Request $request, Response $response): Response
    {
        $logger = new BaseLogger('auth');

        try {
            $data = (array)($request->getParsedBody() ?? []);
            $email = trim((string)($data['email'] ?? ''));
            $password = (string)($data['password'] ?? '');

            $logger->info('Login request received', [
                'email' => $email !== '' ? $email : '[empty]',
                'ip' => $request->getServerParams()['REMOTE_ADDR'] ?? null,
            ]);

            if ($email === '' || $password === '') {
                $logger->warning('Login attempt with missing credentials', [
                    'email' => $email,
                ]);
                return $this->json($response, ['ok' => false, 'message' => 'Email e senha são obrigatórios.'], 422);
            }

            $auth = new AuthService(
                $_ENV['JWT_SECRET'] ?? $_SERVER['JWT_SECRET'] ?? 'change_me',
                $_ENV['JWT_ISSUER'] ?? $_SERVER['JWT_ISSUER'] ?? 'app',
                (int)($_ENV['JWT_EXPIRE_MINUTES'] ?? $_SERVER['JWT_EXPIRE_MINUTES'] ?? 60),
            );

            $user = $auth->validateCredentials($email, $password);
            if (!$user) {
                $logger->notice('Invalid login attempt', ['email' => $email]);
                return $this->json($response, ['ok' => false, 'message' => 'Credenciais inválidas.'], 401);
            }

            $appEnv = $_ENV['APP_ENV'] ?? $_SERVER['APP_ENV'] ?? 'production';

            $secure = $appEnv === 'production';

            if (session_status() !== PHP_SESSION_ACTIVE) {
                session_set_cookie_params([
                    'lifetime' => 0,
                    'path' => '/',
                    'domain' => '',
                    'secure' => $secure,
                    'httponly' => true,
                    'samesite' => 'Lax',
                ]);
                session_start();
            }

            session_regenerate_id(true);

            $_SESSION['user'] = [
                'id' => $user->id,
            ];

            $token = $auth->generateToken($user);

            $cookie = sprintf(
                'access_token=%s; Expires=%s; Path=/; HttpOnly; Secure; SameSite=Lax',
                rawurlencode($token),
                gmdate('D, d M Y H:i:s \G\M\T', time() + $auth->getTtlSeconds())
            );
            $response = $response->withAddedHeader('Set-Cookie', $cookie);

            $logger->info('Login successful', [
                'user_id' => $user->id,
                'email' => $user->email,
            ]);

            return $this->json($response, [
                'ok' => true,
                'token' => $token,
                'token_type' => 'Bearer',
                'expires_in' => ($auth->getTtlSeconds()),
                'user' => ['id' => $user->id, 'name' => $user->name, 'email' => $user->email, 'cargo' => $user->role, 'psicologo_id' => $user->psicologoId],
            ], 200);
        } catch (Throwable $e) {
            $logger->critical('Unexpected error during login', [
                'exception' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
            ]);
            return $this->json($response, ['ok' => false, 'message' => 'Erro interno.'], 500);
        }
    }

    public function me($req, $res)
    {
        if (session_status() !== PHP_SESSION_ACTIVE) {
            session_start();
        }

        if (!isset($_SESSION['user'])) {
            return $this->json($res, ['ok' => false], 401);
        }
        return $this->json($res, ['ok' => true, 'user' => $_SESSION['user']]);
    }
}
