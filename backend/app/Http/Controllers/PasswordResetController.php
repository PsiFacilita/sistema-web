<?php
declare(strict_types=1);

namespace App\Http\Controllers;

use App\Config\Controller;
use App\Helpers\BaseLogger;
use App\Services\PasswordResetService;
use App\Exceptions\PasswordException;
use PHPMailer\PHPMailer\PHPMailer;
use Psr\Http\Message\ResponseInterface as Response;
use Psr\Http\Message\ServerRequestInterface as Request;
use Throwable;

/**
 * Controlador de e-mails (recuperação de senha).
 */
final class PasswordResetController extends Controller
{
    public function __construct(
        private ?BaseLogger $logger = null,
        private ?PasswordResetService $service = null
    ) {
        $this->logger = $this->logger ?? new BaseLogger('PasswordResetController');
        $this->service = $this->service ?? new PasswordResetService(
            mailer: $this->makeMailer(),
            appUrl: (string)($_ENV['FRONTEND_URL'] ?? $_SERVER['FRONTEND_URL'] ?? 'http://localhost:3000'),
            tokenTtlSeconds: 15 * 60
        );
    }

    /**
     * POST /auth/password/forgot
     * Body: { "email": "usuario@exemplo.com" }
     *
     * @param Request $request
     * @param Response $response
     * @return Response
     */
    public function forgot(Request $request, Response $response): Response
    {
        try {
            $rawBody = (string)$request->getBody();
            $body = json_decode($rawBody, true) ?? [];
            $email = trim((string)($body['email'] ?? ''));

            $ip = $request->getServerParams()['REMOTE_ADDR'] ?? 'unknown';
            $ua = $request->getHeaderLine('User-Agent') ?: 'unknown';

            $this->logger->info('Password reset requested', [
                'email_masked' => $this->maskEmail($email),
                'ip' => $ip,
                'user_agent' => $ua,
            ]);

            if ($email === '') {
                $this->logger->warning('Password reset validation failed: empty email', ['body' => $rawBody]);
                return $this->json($response, [
                    'error' => 'VALIDATION_ERROR',
                    'message' => 'O campo e-mail é obrigatório.',
                ], 422);
            }

            $this->service->sendResetLink($email, $request);

            $this->logger->info('Password reset email processed');
            return $this->json($response, [
                'message' => 'Se este e-mail estiver cadastrado, você receberá instruções para redefinir a senha.'
            ]);

        } catch (PasswordException $e) {
            $this->logger->error('Password reset request failed', [
                'exception' => get_class($e),
                'message' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
            ]);

            return $this->json($response, ['ok' => false, 'message' => $e->getMessage()]);

        } catch (\Throwable $e) {
            $this->logger->error('Password reset request failed', [
                'exception' => get_class($e),
                'message' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
            ]);

            return $this->json($response, [
                'ok' => false,
                'error' => 'RESET_REQUEST_FAILED',
                'message' => 'Não foi possível processar sua solicitação. Tente novamente mais tarde.',
                'asd' => $e->getMessage()
            ], 500);
        }
    }

    public function validate(Request $request, Response $response, array $args): Response
    {
        try {
            $this->service->validateToken((string)($args['token'] ?? ''));

            return $this->json($response, ['ok' => true]);

        } catch (PasswordException $e) {
            $this->logger->error('Password reset request failed', [
                'exception' => get_class($e),
                'message' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
            ]);

            return $this->json($response, ['ok' => false, 'message' => $e->getMessage()]);

        } catch (Throwable $e) {
            $this->logger->error('Password reset request failed', [
                'exception' => get_class($e),
                'message' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
            ]);

            return $this->json($response, [
                'ok' => false,
                'error' => 'RESET_REQUEST_FAILED',
                'message' => 'Não foi possível processar sua solicitação. Tente novamente mais tarde.',
            ], 500);
        }
    }

    public function reset(Request $request, Response $response): Response
    {
        try {
            $parsed = $request->getParsedBody();
            $body = is_array($parsed) ? $parsed : (json_decode((string)$request->getBody(), true) ?? []);

            $this->service->resetPassword([
                'token' => trim((string)($body['token'] ?? '')),
                'password' => (string)($body['password'] ?? ''),
                'password_confirmation' => (string)($body['password_confirmation'] ?? '')
            ]);

            return $this->json($response, ['ok' => true, 'message' => 'Senha redefinida com sucesso.']);
        } catch (PasswordException $e) {
            $this->logger->error('Password reset request failed', [
                'exception' => get_class($e),
                'message' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
            ]);

            return $this->json($response, ['ok' => false, 'message' => $e->getMessage()]);

        } catch (Throwable $e) {
            $this->logger->error('Password reset request failed', [
                'exception' => get_class($e),
                'message' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
            ]);

            return $this->json($response, ['ok' => false, 'message' => 'Erro insperado.']);
        }
    }

    /**
     * Instancia e configura PHPMailer para Mailpit/SMTP, com logs.
     *
     * @param BaseLogger $logger
     * @return PHPMailer
     */
    private function makeMailer(): PHPMailer
    {
        $smtpHost = (string) ($_ENV['SMTP_HOST'] ?? 'mailpit');
        $smtpPort = (int) ($_ENV['SMTP_PORT'] ?? 1025);
        $smtpUser = (string) ($_ENV['SMTP_USERNAME'] ?? '');
        $smtpPass = (string) ($_ENV['SMTP_PASSWORD'] ?? '');
        $smtpEnc  = (string) ($_ENV['SMTP_ENCRYPTION'] ?? '');

        $this->logger->info('Configuring mailer', [
            'host' => $smtpHost,
            'port' => $smtpPort,
            'encryption' => $smtpEnc ?: '(none)',
            'auth' => ($smtpUser !== '' || $smtpPass !== ''),
        ]);

        $m = new PHPMailer(true);
        $m->isSMTP();
        $m->Host = $smtpHost;
        $m->Port = $smtpPort;
        $m->SMTPAuth = $smtpUser !== '' || $smtpPass !== '';
        if ($m->SMTPAuth) {
            $m->Username = $smtpUser;
            $m->Password = $smtpPass;
        }
        if ($smtpEnc !== '') {
            $m->SMTPSecure = $smtpEnc;
        }
        $m->CharSet = 'UTF-8';
        $m->setFrom('no-reply@sistema-web.local', 'Sistema Web');

        return $m;
    }

    /**
     * Mascara e-mails para logs, preservando privacidade.
     *
     * @param string $email
     * @return string
     */
    private function maskEmail(string $email): string
    {
        if ($email === '' || !str_contains($email, '@')) {
            return '(empty/invalid)';
        }
        [$user, $domain] = explode('@', $email, 2);
        $userMasked = strlen($user) <= 2 ? str_repeat('*', strlen($user)) : substr($user, 0, 1) . str_repeat('*', max(1, strlen($user) - 2)) . substr($user, -1);
        return $userMasked . '@' . $domain;
    }
}
