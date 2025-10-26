<?php
declare(strict_types=1);

namespace App\Http\Controllers;

use App\Config\Controller;
use App\Services\AuthService;
use App\Services\OtpService;
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
            $data     = (array)($request->getParsedBody() ?? []);
            $email    = trim((string)($data['email'] ?? ''));
            $password = (string)($data['password'] ?? '');

            $logger->info('Login request received', [
                'email' => $email !== '' ? $email : '[empty]',
                'ip'    => $request->getServerParams()['REMOTE_ADDR'] ?? null,
            ]);

            if ($email === '' || $password === '') {
                $logger->warning('Login attempt with missing credentials', ['email' => $email]);
                return $this->json($response, ['ok' => false, 'message' => 'Email e senha são obrigatórios.'], 422);
            }

            $auth = new AuthService(
                $_ENV['JWT_SECRET']         ?? $_SERVER['JWT_SECRET']         ?? 'change_me',
                $_ENV['JWT_ISSUER']         ?? $_SERVER['JWT_ISSUER']         ?? 'app',
                (int)($_ENV['JWT_EXPIRE_MINUTES'] ?? $_SERVER['JWT_EXPIRE_MINUTES'] ?? 60),
            );

            $user = $auth->validateCredentials($email, $password);
            if (!$user) {
                $logger->notice('Invalid login attempt', ['email' => $email]);
                return $this->json($response, ['ok' => false, 'message' => 'Credenciais inválidas.'], 401);
            }

            // Se for chatbot, pula 2FA completamente
            if ($user->role === 'chatbot') {
                $_SESSION['user'] = ['id' => $user->id];
                $token = $auth->generateToken($user);
                
                $cookie = sprintf(
                    'access_token=%s; Expires=%s; Path=/; HttpOnly; Secure; SameSite=Lax',
                    rawurlencode($token),
                    gmdate('D, d M Y H:i:s \G\M\T', time() + $auth->getTtlSeconds())
                );
                $response = $response->withAddedHeader('Set-Cookie', $cookie);
                
                $logger->info('Chatbot login successful - 2FA skipped', [
                    'user_id' => $user->id, 
                    'email' => $user->email
                ]);

                return $this->json($response, [
                    'ok'         => true,
                    'token'      => $token,
                    'token_type' => 'Bearer',
                    'expires_in' => $auth->getTtlSeconds(),
                    'user'       => [
                        'id' => $user->id, 
                        'name' => $user->name, 
                        'email' => $user->email, 
                        'role' => $user->role
                    ],
                ], 200);
            }


            $appEnv = $_ENV['APP_ENV'] ?? $_SERVER['APP_ENV'] ?? 'production';
            $secure = $appEnv === 'production';

            if (session_status() !== PHP_SESSION_ACTIVE) {
                session_set_cookie_params([
                    'lifetime' => 0,
                    'path'     => '/',
                    'domain'   => '',
                    'secure'   => $secure,
                    'httponly' => true,
                    'samesite' => 'Lax',
                ]);
                session_start();
            }

            session_regenerate_id(true);

            $_SESSION['pendente_usuario_id'] = $user->id;

            $lembrarCookie = $_COOKIE['lembrar_2fa'] ?? null;

            $appName = $_ENV['APP_NAME'] ?? $_SERVER['APP_NAME'] ?? 'MinhaApp';
            $otp     = new OtpService(appName: $appName); // helper cuida do e-mail

            // Se dispositivo confiável, pula 2FA
            if ($otp->valido($user->id, $lembrarCookie)) {
                $_SESSION['user'] = ['id' => $user->id];
                $token  = $auth->generateToken($user);
                $cookie = sprintf(
                    'access_token=%s; Expires=%s; Path=/; HttpOnly; Secure; SameSite=Lax',
                    rawurlencode($token),
                    gmdate('D, d M Y H:i:s \G\M\T', time() + $auth->getTtlSeconds())
                );
                $response = $response->withAddedHeader('Set-Cookie', $cookie);
                $logger->info('Login successful via trusted device', ['user_id' => $user->id, 'email' => $user->email]);

                return $this->json($response, [
                    'ok'         => true,
                    'token'      => $token,
                    'token_type' => 'Bearer',
                    'expires_in' => $auth->getTtlSeconds(),
                    'user'       => ['id' => $user->id, 'name' => $user->name, 'email' => $user->email, 'role' => $user->role, 'psicologo_id' => $user->psicologoId],
                ], 200);
            }

            // Envia o código e retorna o challenge_id
            $challengeId = $otp->enviarCodigo($user->id, 10);

            if ($appEnv !== 'production') {
                $logger->info('OTP email dispatched', ['desafio_id' => $challengeId, 'user_id' => $user->id]);
            }

            return $this->json($response, [
                'ok'           => true,
                'requires_2fa' => true,
                'challenge_id' => $challengeId,
                'message'      => 'Código enviado por e-mail.'
            ], 200);

        } catch (Throwable $e) {
            $logger->critical('Unexpected error during login', [
                'exception' => $e->getMessage(),
                'trace'     => $e->getTraceAsString(),
            ]);
            return $this->json($response, ['ok' => false, 'message' => 'Erro interno.'], 500);
        }
    }

    public function verify2fa(Request $request, Response $response): Response
    {
        $logger = new BaseLogger('auth');

        try {
            $data      = (array)($request->getParsedBody() ?? []);
            $desafioId = trim((string)($data['challenge_id'] ?? ''));
            $codigo    = trim((string)($data['code'] ?? ''));
            $lembrar   = (bool)($data['remember'] ?? $data['lembrar'] ?? false);

            if ($desafioId === '' || $codigo === '') {
                $logger->warning('2FA verification failed - missing fields', [
                    'challenge_id_present' => $desafioId !== '',
                    'code_present'         => $codigo !== '',
                ]);
                return $this->json($response, ['ok' => false, 'message' => 'Código inválido.'], 422);
            }

            $appName = $_ENV['APP_NAME'] ?? $_SERVER['APP_NAME'] ?? 'MinhaApp';
            $otp     = new OtpService(appName: $appName); // não envia e-mail aqui

            $usuarioId = $otp->verificar($desafioId, $codigo, 5);
            if (!$usuarioId) {
                $logger->notice('2FA verification invalid code or expired', [
                    'challenge_id' => $desafioId,
                    'ip'           => $request->getServerParams()['REMOTE_ADDR'] ?? null,
                    'ua'           => $request->getHeaderLine('User-Agent') ?: null,
                ]);
                return $this->json($response, ['ok' => false, 'message' => 'Código inválido.'], 401);
            }

            if (session_status() !== PHP_SESSION_ACTIVE) {
                @session_start();
            }

            $_SESSION['user'] = ['id' => $usuarioId];

            $auth = new AuthService(
                $_ENV['JWT_SECRET']         ?? $_SERVER['JWT_SECRET']         ?? 'change_me',
                $_ENV['JWT_ISSUER']         ?? $_SERVER['JWT_ISSUER']         ?? 'app',
                (int)($_ENV['JWT_EXPIRE_MINUTES'] ?? $_SERVER['JWT_EXPIRE_MINUTES'] ?? 60),
            );

            $userModel = new \App\Models\User();
            $user      = $userModel->findById($usuarioId);
            $token     = $auth->generateToken($user);

            $cookie = sprintf(
                'access_token=%s; Expires=%s; Path=/; HttpOnly; Secure; SameSite=Lax',
                rawurlencode($token),
                gmdate('D, d M Y H:i:s \G\M\T', time() + $auth->getTtlSeconds())
            );
            $response = $response->withAddedHeader('Set-Cookie', $cookie);

            if ($lembrar) {
                $raw = $otp->gerarToken(
                    $usuarioId,
                    $request->getHeaderLine('User-Agent'),
                    $request->getServerParams()['REMOTE_ADDR'] ?? null,
                    30
                );
                $lembrarCookie = sprintf(
                    'lembrar_2fa=%s; Expires=%s; Path=/; HttpOnly; Secure; SameSite=Lax',
                    rawurlencode($raw),
                    gmdate('D, d M Y H:i:s \G\M\T', time() + 60*60*24*30)
                );
                $response = $response->withAddedHeader('Set-Cookie', $lembrarCookie);
            }

            $logger->info('2FA verified', ['user_id' => $usuarioId]);

            return $this->json($response, [
                'ok'         => true,
                'token'      => $token,
                'token_type' => 'Bearer',
                'expires_in' => $auth->getTtlSeconds(),
                'user'       => ['id' => $user->id, 'name' => $user->name, 'email' => $user->email, 'role' => $user->role, 'psicologo_id' => $user->psicologoId]
            ], 200);

        } catch (Throwable $e) {
            $logger->critical('Unexpected error during 2FA verification', [
                'exception' => $e->getMessage(),
                'trace'     => $e->getTraceAsString(),
                'body'      => $request->getParsedBody(),
            ]);
            return $this->json($response, ['ok' => false, 'message' => 'Erro interno.'], 500);
        }
    }

    public function resend2fa(Request $request, Response $response): Response
    {
        $logger = new BaseLogger('auth');

        try {
            if (session_status() !== PHP_SESSION_ACTIVE) {
                @session_start();
            }
            $usuarioId = $_SESSION['pendente_usuario_id'] ?? null;
            if (!$usuarioId) {
                $logger->notice('2FA resend attempted without pending session', [
                    'ip' => $request->getServerParams()['REMOTE_ADDR'] ?? null,
                ]);
                return $this->json($response, ['ok' => false, 'message' => 'Sessão expirada.'], 401);
            }

            $appName     = $_ENV['APP_NAME'] ?? $_SERVER['APP_NAME'] ?? 'MinhaApp';
            $otp         = new OtpService(appName: $appName);
            $challengeId = $otp->enviarCodigo((int)$usuarioId, 10);

            $logger->info('2FA code resent', ['user_id' => (int)$usuarioId, 'challenge_id' => $challengeId]);

            return $this->json($response, [
                'ok'           => true,
                'challenge_id' => $challengeId,
                'message'      => 'Código reenviado por e-mail.'
            ], 200);

        } catch (Throwable $e) {
            $logger->critical('Unexpected error during 2FA resend', [
                'exception' => $e->getMessage(),
                'trace'     => $e->getTraceAsString(),
            ]);
            return $this->json($response, ['ok'=>false,'message'=>'Erro interno.'], 500);
        }
    }

    public function me(Request $req, Response $res): Response
    {
        $logger = new BaseLogger('auth');

        if (session_status() !== PHP_SESSION_ACTIVE) {
            @session_start();
        }

        $sessionId = $_SESSION['user']['id'] ?? null;
        if (is_numeric($sessionId)) {
            $userModel = new \App\Models\User();
            $user      = $userModel->findById((int)$sessionId);
            if ($user) {
                return $this->json($res, [
                    'ok'   => true,
                    'user' => [
                        'id'           => $user->id,
                        'name'         => $user->name,
                        'email'        => $user->email,
                        'role'         => $user->role,
                        'psicologo_id' => $user->psicologoId ?? null,
                    ],
                ]);
            }
            $logger->notice('Session user id not found in DB', ['session_user_id' => (int)$sessionId]);
            return $this->json($res, ['ok' => false], 401);
        }

        $authHeader = $req->getHeaderLine('Authorization');
        if ($authHeader && preg_match('/Bearer\s+(.+)/i', $authHeader, $m)) {
            try {
                $auth = new \App\Services\AuthService(
                    $_ENV['JWT_SECRET']         ?? $_SERVER['JWT_SECRET']         ?? 'change_me',
                    $_ENV['JWT_ISSUER']         ?? $_SERVER['JWT_ISSUER']         ?? 'app',
                    (int)($_ENV['JWT_EXPIRE_MINUTES'] ?? $_SERVER['JWT_EXPIRE_MINUTES'] ?? 60),
                );
                $payload = $auth->verifyToken($m[1]);
                $sub     = $payload['sub'] ?? null;

                if (is_numeric($sub)) {
                    $userModel = new \App\Models\User();
                    $user      = $userModel->findById((int)$sub);
                    if ($user) {
                        $_SESSION['user'] = ['id' => $user->id];

                        return $this->json($res, [
                            'ok'   => true,
                            'user' => [
                                'id'           => $user->id,
                                'name'         => $user->name,
                                'email'        => $user->email,
                                'role'         => $user->role,
                                'psicologo_id' => $user->psicologoId ?? null,
                            ],
                        ]);
                    }
                    $logger->notice('JWT sub not found in DB', ['sub' => (int)$sub]);
                }
            } catch (Throwable $e) {
                $logger->warning('JWT verification failed in /auth/me', [
                    'exception' => $e->getMessage(),
                    'trace'     => $e->getTraceAsString(),
                ]);
            }
        }

        return $this->json($res, ['ok' => false], 401);
    }

    public function logout(Request $request, Response $response): Response
    {
        $logger = new BaseLogger('auth');

        try {
            $appEnv = $_ENV['APP_ENV'] ?? $_SERVER['APP_ENV'] ?? 'production';
            $secure = $appEnv === 'production';

            if (session_status() !== PHP_SESSION_ACTIVE) {
                @session_start();
            }

            $userId = $_SESSION['user']['id'] ?? null;

            $_SESSION = [];

            if (ini_get('session.use_cookies')) {
                $params = session_get_cookie_params();
                setcookie(
                    session_name(),
                    '',
                    time() - 42000,
                    $params['path'] ?? '/',
                    $params['domain'] ?? '',
                    $secure,
                    true
                );
            }

            @session_destroy();

            $expired = gmdate('D, d M Y H:i:s \G\M\T', time() - 3600);

            $cookieFlags = '; Path=/; HttpOnly; SameSite=Lax' . ($secure ? '; Secure' : '');
            $response = $response
                ->withAddedHeader('Set-Cookie', "access_token=; Expires={$expired}{$cookieFlags}")
                ->withAddedHeader('Set-Cookie', "lembrar_2fa=; Expires={$expired}{$cookieFlags}");

            $logger->info('User logged out', [
                'user_id' => $userId,
                'ip'      => $request->getServerParams()['REMOTE_ADDR'] ?? null,
                'ua'      => $request->getHeaderLine('User-Agent') ?: null,
            ]);

            return $this->json($response, [
                'ok'      => true,
                'message' => 'Logged out.',
            ], 200);

        } catch (Throwable $e) {
            $logger->critical('Unexpected error during logout', [
                'exception' => $e->getMessage(),
                'trace'     => $e->getTraceAsString(),
            ]);

            return $this->json($response, [
                'ok'      => false,
                'message' => 'Erro interno.',
            ], 500);
        }
    }
}
