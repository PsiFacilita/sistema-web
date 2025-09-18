<?php
declare(strict_types=1);

namespace App\Services;

use App\Models\PasswordReset;
use App\Models\User;
use Exception;
use PasswordException;
use PHPMailer\PHPMailer\PHPMailer;
use Psr\Http\Message\ServerRequestInterface as Request;
use DateTimeImmutable;

final class PasswordResetService
{
    public function __construct(
        private PHPMailer $mailer,
        private string    $appUrl,
        private int       $tokenTtlSeconds = 900,
        private ?User $user = null,
        private ?PasswordReset $password = null
    )
    {
        $this->user = $this->user ?? new User();
        $this->password = $this->password ?? new PasswordReset();
    }

    /**
     * Gera token, grava em `reset` e envia e-mail (se o e-mail existir).
     */
    public function sendResetLink(string $email, Request $request): void
    {
        $userData = $this->user->findByEmail($email);

        $token = bin2hex(random_bytes(32));
        $tokenHash = hash('sha256', $token);
        $expiresAt = new DateTimeImmutable('+' . $this->tokenTtlSeconds . ' seconds');

        $ip = $request->getServerParams()['REMOTE_ADDR'] ?? null;
        $ua = $request->getHeaderLine('User-Agent') ?: null;

        $this->password->createForUser(
            userId: $userData->id,
            tokenHash: $tokenHash,
            expiresAt: $expiresAt,
            ip: $ip,
            userAgent: $ua
        );

        $link = rtrim($this->appUrl, '/') . '/reset-password/' . $token;

        $this->mailer->clearAllRecipients();
        $this->mailer->addAddress($userData->email, $userData->name ?? $userData->email);
        $this->mailer->Subject = 'Redefinição de senha';
        $this->mailer->isHTML();
        $this->mailer->Body = '<p>Olá,</p><p>Para redefinir sua senha, clique no link abaixo:</p><p><a href="' .
            htmlspecialchars($link, ENT_QUOTES, 'UTF-8') . '">' . htmlspecialchars($link, ENT_QUOTES, 'UTF-8') .
            '</a></p><p>Se você não solicitou, ignore este e-mail.</p>';
        $this->mailer->AltBody = "Para redefinir sua senha, acesse: $link";
        $this->mailer->send();
    }

    public function validateToken(string $token): void
    {
        if ($token === '') {
            throw new PasswordException('Token ausente');
        }

        $hash = hash('sha256', $token);
        $row = $this->password->findValidByHash($hash);

        if (!$row) {
            throw new PasswordException('Token inválido ou expirado.');
        }
    }

    public function resetPassword(array $data): void
    {
        $token = $data['token'];
        $password = $data['password'];
        $passwordConfirmation = $data['password_confirmation'];

        if ($token === '' || $password === '' || $passwordConfirmation === '') {
            throw new PasswordException('Dados inválidos.');
        }

        if ($password !== $passwordConfirmation) {
            throw new PasswordException('As senhas não conferem.');
        }

        $hashToken = hash('sha256', $token);
        $row = $this->password->findValidByHash($hashToken);
        if (!$row) {
            throw new PasswordException('Token inválido ou expirado.');
        }

        $userId = (int)$row['usuario_id'];
        $algo = defined('PASSWORD_ARGON2ID') ? PASSWORD_ARGON2ID : PASSWORD_DEFAULT;
        $pwdHash = password_hash($password, $algo);

        if (!$this->user->updatePassword($userId, $pwdHash)) {
            throw new PasswordException('Não foi possível atualizar a senha.');
        }

        $this->password->markUsedById((int)$row['id']);
        $this->password->invalidateAllForUser($userId);
    }
}
